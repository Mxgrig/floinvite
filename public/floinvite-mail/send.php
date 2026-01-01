<?php
/**
 * Send Campaign
 * Handles batch sending with rate limiting
 */

require_once 'config.php';
require_once 'logo.php';
require_auth();

$db = get_db();
$campaign_id = intval($_GET['id'] ?? 0);

if (!$campaign_id) {
    handle_error('Campaign ID required', 400);
}

// Get campaign
$stmt = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
$stmt->execute([$campaign_id]);
$campaign = $stmt->fetch();

if (!$campaign) {
    handle_error('Campaign not found', 404);
}

function parse_custom_emails($raw) {
    $invalid = 0;
    $invalid_samples = [];
    $emails = [];

    $normalized = preg_replace('/[\\s,;]+/', "\n", $raw);
    $parts = preg_split('/\\s+/', $normalized, -1, PREG_SPLIT_NO_EMPTY);

    foreach ($parts as $email) {
        $email = strtolower(trim($email));
        if ($email === '') {
            continue;
        }
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emails[$email] = true;
        } else {
            $invalid++;
            if (count($invalid_samples) < 20) {
                $invalid_samples[] = $email;
            }
        }
    }

    return [
        'emails' => array_keys($emails),
        'invalid' => $invalid,
        'invalid_samples' => $invalid_samples
    ];
}

function fetch_subscriber_statuses($db, $emails) {
    $found = [];
    if (empty($emails)) {
        return $found;
    }

    foreach (array_chunk($emails, 200) as $chunk) {
        $placeholders = implode(',', array_fill(0, count($chunk), '?'));
        $stmt = $db->prepare("SELECT id, email, status FROM subscribers WHERE email IN ($placeholders)");
        $stmt->execute($chunk);
        foreach ($stmt->fetchAll() as $row) {
            $found[strtolower($row['email'])] = [
                'id' => $row['id'],
                'status' => $row['status']
            ];
        }
    }

    return $found;
}

$preview = null;
$preview_error = null;
$prefill = $_SESSION['send_prefill'][$campaign_id] ?? null;
$prefill_token = $_GET['prefill'] ?? null;
if ($prefill && (!is_string($prefill_token) || !hash_equals($prefill['token'] ?? '', $prefill_token))) {
    $prefill = null;
}
$prefill_mode = $prefill['mode'] ?? null;
$prefill_custom = $prefill['custom_emails'] ?? '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    $send_mode = $_POST['send_mode'] ?? 'all';
    $allow_new = !empty($_POST['allow_new']);
    $allow_reactivate = !empty($_POST['allow_reactivate']);

    if ($action === 'preview') {
        if ($send_mode === 'custom') {
            $custom_emails_raw = trim($_POST['custom_emails'] ?? '');
            $parsed = parse_custom_emails($custom_emails_raw);

            if (empty($parsed['emails'])) {
                $preview_error = 'Provide at least one valid email address to preview.';
            } else {
                $statuses = fetch_subscriber_statuses($db, $parsed['emails']);
                $counts = [
                    'valid' => count($parsed['emails']),
                    'invalid' => $parsed['invalid'],
                    'active' => 0,
                    'inactive' => 0,
                    'unsubscribed' => 0,
                    'new' => 0
                ];

                foreach ($parsed['emails'] as $email) {
                    if (isset($statuses[$email])) {
                        if ($statuses[$email]['status'] === 'active') {
                            $counts['active']++;
                        } elseif ($statuses[$email]['status'] === 'unsubscribed') {
                            $counts['unsubscribed']++;
                        } else {
                            $counts['inactive']++;
                        }
                    } else {
                        $counts['new']++;
                    }
                }

                $preview = [
                    'mode' => 'custom',
                    'counts' => $counts,
                    'invalid_samples' => $parsed['invalid_samples']
                ];
            }
        } else {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
            $stmt->execute();
            $count = $stmt->fetch()['count'] ?? 0;
            $preview = [
                'mode' => 'all',
                'counts' => [
                    'active' => (int) $count
                ]
            ];
        }
    }

    if ($action === 'start') {
        $custom_emails_raw = trim($_POST['custom_emails'] ?? '');
        $parsed = parse_custom_emails($custom_emails_raw);

        try {
            $db->beginTransaction();

            $subscribers = [];
            $skipped = [
                'unsubscribed' => 0,
                'inactive' => 0,
                'new' => 0,
                'invalid' => $parsed['invalid']
            ];

            if ($send_mode === 'custom') {
                if (empty($parsed['emails'])) {
                    $db->rollBack();
                    respond(false, null, 'Provide at least one valid email address.');
                }

                $find_stmt = $db->prepare("SELECT id, status FROM subscribers WHERE email = ?");
                $insert_stmt = $db->prepare("
                    INSERT INTO subscribers (email, status)
                    VALUES (?, 'active')
                ");
                $activate_stmt = $db->prepare("
                    UPDATE subscribers SET status = 'active'
                    WHERE id = ?
                ");

                foreach ($parsed['emails'] as $email) {
                    $find_stmt->execute([$email]);
                    $existing = $find_stmt->fetch();

                    if ($existing) {
                        if ($existing['status'] === 'unsubscribed') {
                            if ($allow_reactivate) {
                                $activate_stmt->execute([$existing['id']]);
                                $subscribers[] = ['id' => $existing['id'], 'email' => $email];
                            } else {
                                $skipped['unsubscribed']++;
                            }
                            continue;
                        }
                        if ($existing['status'] !== 'active') {
                            if (!$allow_reactivate) {
                                $skipped['inactive']++;
                                continue;
                            }
                            $activate_stmt->execute([$existing['id']]);
                        }
                        $subscribers[] = ['id' => $existing['id'], 'email' => $email];
                        continue;
                    }

                    if ($allow_new) {
                        $insert_stmt->execute([$email]);
                        $subscribers[] = ['id' => $db->lastInsertId(), 'email' => $email];
                    } else {
                        $skipped['new']++;
                    }
                }
            } else {
                // Get active subscribers
                $stmt = $db->prepare("
                    SELECT id, email, name, company FROM subscribers
                    WHERE status = 'active'
                    ORDER BY id
                ");
                $stmt->execute();
                $subscribers = $stmt->fetchAll();
            }

            if (empty($subscribers)) {
                $db->rollBack();
                respond(false, null, 'No active subscribers to send to');
            }

            $count = 0;

            // Create campaign_sends records
            foreach ($subscribers as $sub) {
                $tracking_id = generate_tracking_id();
                $unsubscribe_token = generate_unsubscribe_token();

                $stmt = $db->prepare("
                    INSERT INTO campaign_sends (
                        campaign_id, subscriber_id, email, tracking_id, unsubscribe_token, status
                    ) VALUES (?, ?, ?, ?, ?, 'pending')
                ");
                $stmt->execute([
                    $campaign_id,
                    $sub['id'],
                    $sub['email'],
                    $tracking_id,
                    $unsubscribe_token
                ]);

                $send_id = $db->lastInsertId();

                // Add to send queue
                $stmt = $db->prepare("
                    INSERT INTO send_queue (send_id, campaign_id, email, status)
                    VALUES (?, ?, ?, 'queued')
                ");
                $stmt->execute([$send_id, $campaign_id, $sub['email']]);

                $count++;
            }

            // Update campaign
            $stmt = $db->prepare("
                UPDATE campaigns
                SET status = 'sending', recipient_count = ?, started_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$count, $campaign_id]);

            $db->commit();

            $message = "Campaign queued for sending to $count subscribers";
            if ($send_mode === 'custom') {
                $details = [];
                if ($skipped['invalid'] > 0) {
                    $details[] = "{$skipped['invalid']} invalid ignored";
                }
                if ($skipped['unsubscribed'] > 0) {
                    $details[] = "{$skipped['unsubscribed']} unsubscribed skipped";
                }
                if ($skipped['inactive'] > 0) {
                    $details[] = "{$skipped['inactive']} inactive skipped";
                }
                if ($skipped['new'] > 0) {
                    $details[] = "{$skipped['new']} new skipped";
                }
                if (!empty($details)) {
                    $message .= ' (' . implode(', ', $details) . ')';
                }
            }
            respond(true, ['queued' => $count], $message);
        } catch (Exception $e) {
            $db->rollBack();
            respond(false, null, 'Error starting campaign: ' . $e->getMessage());
        }
    }
}

// Get send progress
$stmt = $db->prepare("
    SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM campaign_sends
    WHERE campaign_id = ?
");
$stmt->execute([$campaign_id]);
$progress = $stmt->fetch();

// Check if API request
if (!empty($_GET['api'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'campaign' => $campaign,
        'progress' => $progress
    ]);
    exit;
}

$selected_send_mode = $_POST['send_mode'] ?? ($prefill_mode ?: 'all');
$custom_emails_display = $_POST['custom_emails'] ?? $prefill_custom;
$allow_new_checked = !empty($_POST['allow_new']);
$allow_reactivate_checked = !empty($_POST['allow_reactivate']);

if ($prefill && isset($_SESSION['send_prefill'][$campaign_id])) {
    unset($_SESSION['send_prefill'][$campaign_id]);
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Send Campaign - floinvite Mail</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --brand-blue: #4338ca;
            --brand-green: #10b981;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            color: #1f2937;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }

        header {
            background: white;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 2rem;
            padding: 2rem 0;
        }

        header h1 {
            font-size: 1.875rem;
        }

        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }

        .header-branding {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .brand-wordmark {
            display: inline-flex;
            align-items: baseline;
            gap: 0;
            font-weight: 800;
            letter-spacing: -0.3px;
            line-height: 1;
            text-transform: lowercase;
        }

        .brand-wordmark-flo {
            color: var(--brand-blue);
        }

        .brand-wordmark-invite {
            color: var(--brand-green);
        }

        .header-branding img {
            width: 32px;
            height: 32px;
        }

        .mail-footer {
            border-top: 1px solid #e5e7eb;
            margin-top: 2rem;
            padding: 1.5rem 0;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
        }

        .brand-name {
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: -0.3px;
            color: #4338ca;
        }

        .brand-name-invite {
            color: #10b981;
        }

        .nav {
            display: flex;
            gap: 2rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
        }

        .nav a {
            color: #6b7280;
            text-decoration: none;
            font-weight: 500;
        }

        .nav a:hover {
            color: #4f46e5;
        }

        .section {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            border: 1px solid #e5e7eb;
            margin-bottom: 2rem;
        }

        .campaign-info {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 6px;
            margin-bottom: 2rem;
            border-left: 4px solid #4f46e5;
        }

        .campaign-info h3 {
            margin-bottom: 0.5rem;
        }

        .campaign-info p {
            color: #6b7280;
            font-size: 0.875rem;
        }

        .recipient-count {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin: 1rem 0;
        }

        .warning-box {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 2rem;
            color: #92400e;
        }

        .warning-box strong {
            display: block;
            margin-bottom: 0.5rem;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 9999px;
            overflow: hidden;
            margin: 1rem 0;
        }

        .progress-fill {
            height: 100%;
            background: #4f46e5;
            transition: width 0.3s;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin: 1.5rem 0;
        }

        .stat {
            background: #f9fafb;
            padding: 1rem;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e5e7eb;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
        }

        .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.5rem;
        }

        button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: #4f46e5;
            color: white;
        }

        .btn-primary:hover:not(:disabled) {
            background: #4338ca;
        }

        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
            background: #e5e7eb;
        }

        .button-group {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        }

        .send-mode {
            display: grid;
            gap: 0.75rem;
            margin: 1.5rem 0;
        }

        .send-option {
            display: flex;
            gap: 0.75rem;
            align-items: flex-start;
        }

        .send-option label {
            font-weight: 600;
        }

        .custom-emails {
            width: 100%;
            min-height: 120px;
            padding: 0.75rem 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-family: inherit;
            font-size: 0.95rem;
            resize: vertical;
        }

        .custom-emails:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .helper-text {
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }

        .invalid-list {
            margin-top: 0.5rem;
            padding: 0.75rem;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            color: #991b1b;
            font-size: 0.85rem;
        }

        .invalid-count {
            display: block;
            margin-top: 0.35rem;
            color: #7f1d1d;
            font-size: 0.8rem;
        }

        .disabled-message {
            margin-top: 0.5rem;
            color: #991b1b;
            font-size: 0.85rem;
        }

        .preview-box {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
            color: #1f2937;
        }

        .preview-box strong {
            display: block;
            margin-bottom: 0.5rem;
        }

        .preview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.75rem;
        }

        .preview-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 0.75rem;
        }

        .preview-item span {
            display: block;
            font-size: 0.85rem;
            color: #6b7280;
        }

        .custom-only {
            display: none;
        }

        .back-link {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }

        .info-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
            color: #1e40af;
            font-size: 0.875rem;
        }

        .success-box {
            background: #d1fae5;
            border: 1px solid #6ee7b7;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
            color: #065f46;
        }

        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #f3f4f6;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <header class="mail-hero">
        <div class="container">
            <div class="header-row">
                <div class="header-branding">
                    <img src="<?php echo htmlspecialchars(get_logo_path()); ?>" alt="floinvite">
                    <span class="brand-wordmark">
                        <span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span>
                    </span>
                </div>
                <a href="index.php" class="back-link">← Back to Dashboard</a>
            </div>
            <h1>Send Campaign</h1>
            <nav class="nav mail-nav">
                <a href="index.php">Dashboard</a>
                <a href="subscribers.php">Subscribers</a>
                <a href="compose.php">New Campaign</a>
            </nav>
        </div>
    </header>

    <div class="container">
        <!-- Campaign Details -->
        <div class="campaign-info">
            <h3><?php echo htmlspecialchars($campaign['name']); ?></h3>
            <p>Subject: <?php echo htmlspecialchars($campaign['subject']); ?></p>
            <p>Status: <strong><?php echo ucfirst($campaign['status']); ?></strong></p>
        </div>

        <!-- Warning -->
        <div class="warning-box">
            <strong>Important Notice</strong>
            Once you start sending, this campaign cannot be paused. Emails will be sent at a rate of up to <?php echo RATE_LIMIT_PER_HOUR; ?> per hour to comply with Hostinger limits.
        </div>

        <!-- Start Sending -->
        <?php if ($campaign['status'] === 'draft'): ?>
            <div class="section">
                <h2>Ready to Send?</h2>
                <p style="margin-bottom: 1rem; color: #6b7280;">
                    Choose whether to send to all active subscribers or a custom list.
                </p>

                <div class="recipient-count">
                    <?php
                        $stmt = $db->prepare("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
                        $stmt->execute();
                        $count = $stmt->fetch()['count'];
                        echo number_format($count);
                    ?> Recipients
                </div>

                <?php if ($preview_error): ?>
                    <div class="message error"><?php echo htmlspecialchars($preview_error); ?></div>
                <?php elseif ($preview): ?>
                    <div class="preview-box">
                        <strong>Recipient preview</strong>
                        <?php if ($preview['mode'] === 'all'): ?>
                            <div class="preview-grid">
                                <div class="preview-item">
                                    <?php echo number_format($preview['counts']['active']); ?>
                                    <span>Active subscribers</span>
                                </div>
                            </div>
                        <?php else: ?>
                            <div class="preview-grid">
                                <div class="preview-item">
                                    <?php echo number_format($preview['counts']['valid']); ?>
                                    <span>Valid emails</span>
                                </div>
                                <div class="preview-item">
                                    <?php echo number_format($preview['counts']['invalid']); ?>
                                    <span>Invalid entries</span>
                                </div>
                                <div class="preview-item">
                                    <?php echo number_format($preview['counts']['active']); ?>
                                    <span>Active subscribers</span>
                                </div>
                                <div class="preview-item">
                                    <?php echo number_format($preview['counts']['inactive']); ?>
                                    <span>Inactive subscribers</span>
                                </div>
                                <div class="preview-item">
                                    <?php echo number_format($preview['counts']['unsubscribed']); ?>
                                    <span>Unsubscribed</span>
                                </div>
                                <div class="preview-item">
                                    <?php echo number_format($preview['counts']['new']); ?>
                                    <span>New addresses</span>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>

                <form method="POST">
                    <div class="send-mode">
                        <div class="send-option">
                            <input type="radio" id="send-all" name="send_mode" value="all" <?php echo $selected_send_mode === 'all' ? 'checked' : ''; ?>>
                            <label for="send-all">Send to all active subscribers (<?php echo number_format($count); ?>)</label>
                        </div>
                        <div class="send-option">
                            <input type="radio" id="send-custom" name="send_mode" value="custom" <?php echo $selected_send_mode === 'custom' ? 'checked' : ''; ?>>
                            <label for="send-custom">Send to specific email addresses</label>
                        </div>
                        <div class="custom-only">
                            <textarea class="custom-emails" name="custom_emails" placeholder="name@company.com, another@domain.com&#10;one@more.com"><?php echo htmlspecialchars($custom_emails_display); ?></textarea>
                            <div class="helper-text">Comma, space, or newline separated.</div>
                            <?php if ($preview && $preview['mode'] === 'custom' && $preview['counts']['invalid'] > 0): ?>
                                <div class="invalid-list">
                                    Invalid entries (first <?php echo count($preview['invalid_samples']); ?>):
                                    <?php echo htmlspecialchars(implode(', ', $preview['invalid_samples'])); ?>
                                    <?php
                                        $remaining_invalid = $preview['counts']['invalid'] - count($preview['invalid_samples']);
                                        if ($remaining_invalid > 0):
                                    ?>
                                        <span class="invalid-count">And <?php echo $remaining_invalid; ?> more.</span>
                                    <?php endif; ?>
                                </div>
                            <?php endif; ?>
                            <label class="send-option" style="margin-top: 0.75rem;">
                                <input type="checkbox" name="allow_new" <?php echo $allow_new_checked ? 'checked' : ''; ?>>
                                Allow new addresses (create subscribers)
                            </label>
                            <label class="send-option">
                                <input type="checkbox" name="allow_reactivate" <?php echo $allow_reactivate_checked ? 'checked' : ''; ?>>
                                Allow reactivation of inactive or unsubscribed addresses
                            </label>
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="submit" name="action" value="preview" class="btn-secondary">
                            Preview Recipients
                        </button>
                        <?php
                            $disable_send_reason = '';
                            if ($preview_error) {
                                $disable_send_reason = 'Fix preview errors before sending.';
                            } elseif ($preview && $preview['mode'] === 'custom' && $preview['counts']['valid'] === 0) {
                                $disable_send_reason = 'No valid recipients to send.';
                            }
                            $disable_send = $disable_send_reason !== '';
                        ?>
                        <button type="submit" name="action" value="start" class="btn-primary" <?php echo $disable_send ? 'disabled' : ''; ?> onclick="return confirm('Start sending this campaign to the selected recipients? This cannot be undone.')">
                            Start Sending Campaign
                        </button>
                        <?php if ($disable_send): ?>
                            <div class="disabled-message"><?php echo htmlspecialchars($disable_send_reason); ?></div>
                        <?php endif; ?>
                    </div>
                </form>
            </div>
        <?php else: ?>
            <!-- Progress -->
            <div class="section">
                <h2>Sending Progress</h2>

                <?php if ($progress['total'] > 0): ?>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: <?php echo ($progress['sent'] / $progress['total']) * 100; ?>%"></div>
                    </div>

                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value"><?php echo $progress['sent']; ?></div>
                            <div class="stat-label">Sent</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value"><?php echo $progress['total']; ?></div>
                            <div class="stat-label">Total</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value"><?php echo $progress['failed']; ?></div>
                            <div class="stat-label">Failed</div>
                        </div>
                    </div>

                    <div class="info-box">
                        Emails are being sent at <?php echo RATE_LIMIT_PER_HOUR; ?> per hour. Progress updates automatically every 30 seconds.
                        <script>
                            setInterval(() => {
                                fetch('?api=1&id=<?php echo $campaign_id; ?>')
                                    .then(r => r.json())
                                    .then(data => {
                                        if (data.progress) {
                                            location.reload();
                                        }
                                    });
                            }, 30000);
                        </script>
                    </div>

                    <?php if ($campaign['status'] === 'completed'): ?>
                        <div class="success-box">
                            Campaign completed successfully!
                        </div>
                    <?php endif; ?>
                <?php else: ?>
                    <p>No subscribers queued.</p>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <script>
        const sendAll = document.getElementById('send-all');
        const sendCustom = document.getElementById('send-custom');
        const customSection = document.querySelector('.custom-only');

        function updateSendMode() {
            if (!sendAll || !sendCustom || !customSection) {
                return;
            }
            const isCustom = sendCustom.checked;
            customSection.style.display = isCustom ? 'block' : 'none';
            const textarea = customSection.querySelector('textarea');
            if (textarea) {
                textarea.disabled = !isCustom;
            }
            customSection.querySelectorAll('input[type="checkbox"]').forEach((input) => {
                input.disabled = !isCustom;
            });
        }

        if (sendAll && sendCustom && customSection) {
            sendAll.addEventListener('change', updateSendMode);
            sendCustom.addEventListener('change', updateSendMode);
            updateSendMode();
        }
    </script>

    <!-- Footer -->
    <div class="container">
        <footer class="mail-footer">
            <p>© <?php echo date('Y'); ?> <span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span>. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>
