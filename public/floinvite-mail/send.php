<?php
/**
 * Send Campaign
 * Handles batch sending with rate limiting
 */

require_once 'config.php';
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

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'start') {
        try {
            $db->beginTransaction();

            // Get active subscribers
            $stmt = $db->prepare("
                SELECT id, email, name, company FROM subscribers
                WHERE status = 'active'
                ORDER BY id
            ");
            $stmt->execute();
            $subscribers = $stmt->fetchAll();

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

            respond(true, ['queued' => $count], "Campaign queued for sending to $count subscribers");
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

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Send Campaign - Floinvite Mail</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
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
    <header>
        <div class="container">
            <a href="index.php" class="back-link">← Back to Dashboard</a>
            <h1>Send Campaign</h1>
            <nav class="nav">
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
                    This campaign will be sent to all active subscribers.
                </p>

                <div class="recipient-count">
                    <?php
                        $stmt = $db->prepare("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
                        $stmt->execute();
                        $count = $stmt->fetch()['count'];
                        echo number_format($count);
                    ?> Recipients
                </div>

                <form method="POST">
                    <input type="hidden" name="action" value="start">
                    <button type="submit" class="btn-primary" onclick="return confirm('Start sending to <?php echo number_format($count); ?> subscribers? This cannot be undone.')">
                        Start Sending Campaign
                    </button>
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
</body>
</html>
