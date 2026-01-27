<?php
/**
 * Compose Campaign
 * Create and edit email campaigns
 */

require_once 'config.php';
require_once 'logo.php';
require_auth();

$db = get_db();
$message = '';
$test_email = '';
$campaign_id = $_GET['id'] ?? null;
$campaign = null;

// Load existing campaign if editing
if ($campaign_id) {
    $stmt = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
    $stmt->bind_param("i", $campaign_id);
    $stmt->execute();
    $campaign = $stmt->get_result()->fetch_assoc();

    if (!$campaign) {
        $message = 'Campaign not found';
    } elseif (isset($_GET['resumed'])) {
        $message = 'Campaign resumed. Review settings and save or send.';
    } elseif (isset($_GET['send_now'])) {
        $message = 'Send method changed to immediate. Review settings and save or send.';
    }
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'save';
    $name = trim($_POST['name'] ?? '');
    $subject = trim($_POST['subject'] ?? '');
    $from_name = trim($_POST['from_name'] ?? '');
    $greeting = trim($_POST['greeting'] ?? '');
    $html_body = trim($_POST['html_body'] ?? '');
    $signature = trim($_POST['signature'] ?? '');
    $test_email = trim($_POST['test_email'] ?? '');
    $send_method = $_POST['send_method'] ?? 'queue';
    $scheduled_at = !empty($_POST['scheduled_at']) ? $_POST['scheduled_at'] : null;
    $send_to_all_active = !empty($_POST['send_to_all_active']) ? 1 : 0;

    if ($action === 'test') {
        if (!validate_email($test_email)) {
            $message = 'Error: Provide a valid test email address';
        } elseif (!$subject || !$from_name || !$html_body) {
            $message = 'Error: Subject, From Name, and Email Body are required for test send';
        } else {
            // Get template type from form
            $template_type = $_POST['template-type'] ?? 'default';

            // Generate email HTML from greeting + body + signature
            $test_email_html = create_email_from_text(
                $greeting,
                $html_body,
                $signature,
                'Test User',  // Sample visitor name
                $test_email,
                'Test Company',  // Sample company
                'Test Host',  // Sample host name
                'host@example.com',  // Sample host email
                $template_type
            );

            $safe_subject = preg_replace('/[\r\n]+/', ' ', $subject);
            $safe_from = preg_replace('/[\r\n]+/', ' ', $from_name);
            $from_email = SMTP_USER ?: 'admin@floinvite.com';

            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-type: text/html; charset=UTF-8\r\n";
            $headers .= "From: {$safe_from} <{$from_email}>\r\n";
            $headers .= "Reply-To: {$from_email}\r\n";

            error_log("TEST_EMAIL_SENDING: to={$test_email}, from={$safe_from} <{$from_email}>");
            if (@mail($test_email, $safe_subject, $test_email_html, $headers)) {
                $message = 'Test email sent successfully (with sample data)';
                error_log("TEST_EMAIL_SUCCESS: Email sent to {$test_email}");
            } else {
                $message = 'Error: Test email failed to send';
                error_log("TEST_EMAIL_FAILED: mail() returned false for {$test_email}");
            }
        }
    } else {
        // Validation
        if (!$name || !$subject || !$html_body) {
            $message = 'All fields are required';
        } else {
            try {
                if ($campaign_id) {
                    // Update existing
                    $stmt = $db->prepare("
                        UPDATE campaigns
                        SET name = ?, subject = ?, from_name = ?, greeting = ?, html_body = ?, signature = ?, send_method = ?, scheduled_at = ?, send_to_all_active = ?
                        WHERE id = ?
                    ");
                    $stmt->bind_param("ssssssssii", $name, $subject, $from_name, $greeting, $html_body, $signature, $send_method, $scheduled_at, $send_to_all_active, $campaign_id);
                    $stmt->execute();
                    $message = 'Campaign updated successfully';
                } else {
                    // Create new
                    $stmt = $db->prepare("
                        INSERT INTO campaigns (name, subject, from_name, greeting, html_body, signature, send_method, scheduled_at, send_to_all_active, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
                    ");
                    $stmt->bind_param("ssssssssi", $name, $subject, $from_name, $greeting, $html_body, $signature, $send_method, $scheduled_at, $send_to_all_active);
                    $stmt->execute();
                    $campaign_id = $db->insert_id;
                    $message = 'Campaign created successfully';
                }

                if ($action === 'save_send') {
                    $recipient_mode = $_POST['recipient_mode'] ?? 'subscribers';
                    $subscriber_filter = $_POST['subscriber_filter'] ?? 'all';
                    $recipients_raw = $_POST['recipients'] ?? '[]';
                    $recipients = json_decode($recipients_raw, true);
                    $emails = [];
                    if (is_array($recipients)) {
                        foreach ($recipients as $recipient) {
                            if (!empty($recipient['email'])) {
                                $emails[] = strtolower(trim($recipient['email']));
                            }
                        }
                    }
                    $emails = array_values(array_unique(array_filter($emails)));
                    $prefill_token = bin2hex(random_bytes(16));
                    $_SESSION['send_prefill'][$campaign_id] = [
                        'mode' => $recipient_mode === 'subscribers' ? 'all' : 'custom',
                        'subscriber_filter' => $subscriber_filter,
                        'custom_emails' => implode("\n", $emails),
                        'recipients' => is_array($recipients) ? $recipients : [],
                        'token' => $prefill_token
                    ];
                    header('Location: send.php?id=' . $campaign_id . '&prefill=' . urlencode($prefill_token));
                    exit;
                }

                // Reload campaign data
                $stmt = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
                $stmt->bind_param("i", $campaign_id);
                $stmt->execute();
                $campaign = $stmt->get_result()->fetch_assoc();
            } catch (Exception $e) {
                $message = 'Error: ' . $e->getMessage();
            }
        }
    }
}

// Get subscriber count
$subscriber_count = 0;
$result = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
$subscriber_count = $result->fetch_assoc()['count'] ?? 0;

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $campaign_id ? 'Edit Campaign' : 'Compose Campaign'; ?> - floinvite Mail</title>
    <link rel="stylesheet" href="styles.css">
    
</head>
<body>
    <header class="mail-hero">
        <div class="container">
            <a href="index.php" class="back-link">← Back to Dashboard</a>
            <h1><?php echo $campaign_id ? 'Edit Campaign' : 'Create New Campaign'; ?></h1>
            <nav class="nav mail-nav">
                <a href="index.php">Dashboard</a>
                <a href="subscribers.php">Subscribers</a>
                <a href="compose.php" class="active">New Campaign</a>
            </nav>
        </div>
    </header>

    <div class="container">
        <?php if ($message): ?>
            <div class="message <?php echo strpos($message, 'Error') === false ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <form method="POST" class="section" id="campaign-form">
            <input type="hidden" name="action" id="form-action" value="save">
            <h2>Campaign Details</h2>

            <div class="form-row">
                <div class="form-group">
                    <label for="name">Campaign Name *</label>
                    <input type="text" id="name" name="name" required
                        value="<?php echo htmlspecialchars($campaign['name'] ?? ''); ?>"
                        placeholder="e.g., Holiday Promo 2024">
                </div>

                <div class="form-group">
                    <label for="from_name">From Name *</label>
                    <input type="text" id="from_name" name="from_name" required
                        value="<?php echo htmlspecialchars($campaign['from_name'] ?? 'floinvite Team'); ?>"
                        placeholder="Your company name">
                </div>
            </div>

            <div class="form-group">
                <label for="subject">Subject Line *</label>
                <input type="text" id="subject" name="subject" required
                    value="<?php echo htmlspecialchars($campaign['subject'] ?? ''); ?>"
                    placeholder="Email subject">
            </div>

            <input type="hidden" id="template-type" name="template-type" value="default">

            <div class="form-group">
                <label for="greeting">Greeting *</label>
                <input type="text" id="greeting" name="greeting" required
                    value="<?php echo htmlspecialchars($campaign['greeting'] ?? ''); ?>"
                    placeholder="e.g., Hello {visitor_name}, or Hi there,">
                <small style="color: #6b7280; margin-top: 0.5rem; display: block;">
                    Available variables: {visitor_name}, {visitor_email}, {visitor_company}, {host_name}
                </small>
            </div>

            <div class="form-group">
                <label for="html_body">Email Body *</label>
                <div style="margin-bottom: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button type="button" class="template-btn" id="insert-template-btn" style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 0.5rem 1rem; font-size: 0.875rem; cursor: pointer;">Load Default Template</button>
                    <button type="button" class="template-btn" id="insert-offer-btn" style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 0.5rem 1rem; font-size: 0.875rem; cursor: pointer;">Load Offer Template</button>
                    <button type="button" class="template-btn" id="preview-toggle" onclick="togglePreview()" style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 0.875rem; cursor: pointer;">Show Preview</button>
                </div>
                <textarea id="html_body" name="html_body" required placeholder="Enter email body (plain text - no HTML needed)&#10;&#10;You can use line breaks to create paragraphs.&#10;Leave blank lines between paragraphs."><?php echo htmlspecialchars($campaign['html_body'] ?? ''); ?></textarea>
                <small style="color: #6b7280; margin-top: 0.5rem; display: block;">
                    Write in plain text. Line breaks will be automatically converted to HTML. No HTML knowledge required!
                </small>
                <div id="preview-container" style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                        <h3 style="margin: 0; font-size: 0.9rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Email Preview</h3>
                        <div id="preview-sample-stats" style="font-size: 0.85rem; color: #4b5563; font-weight: 500;">Loading stats...</div>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <label for="preview-subscriber-email" style="display: block; font-size: 0.85rem; color: #4b5563; margin-bottom: 0.25rem;">Preview as subscriber (optional)</label>
                        <input type="email" id="preview-subscriber-email" placeholder="subscriber@example.com" style="width: 100%; max-width: 360px; padding: 0.5rem 0.6rem; border: 1px solid #d1d5db; border-radius: 4px;">
                        <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.35rem;">Uses live subscriber data when the email matches an active subscriber.</div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem;">
                        <div>
                            <label for="preview-subscriber-sample" style="display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Quick sample</label>
                            <select id="preview-subscriber-sample" style="min-width: 220px; padding: 0.45rem 0.6rem; border: 1px solid #d1d5db; border-radius: 4px;">
                                <option value="">Select a subscriber…</option>
                            </select>
                        </div>
                        <button type="button" id="preview-subscriber-refresh" style="height: 34px; align-self: flex-end; padding: 0 0.75rem; background: #e5e7eb; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Refresh list</button>
                        <div id="preview-subscriber-stats" style="font-size: 0.75rem; color: #6b7280; align-self: flex-end; display: flex; gap: 0.5rem; flex-wrap: wrap;"></div>
                    </div>
                    <iframe id="email-preview" style="width: 100%; height: 600px; border: 1px solid #e5e7eb; border-radius: 4px; background: white; display: block;"></iframe>
                </div>
            </div>

            <div class="form-group">
                <label for="signature">Signature *</label>
                <input type="text" id="signature" name="signature" required
                    value="<?php echo htmlspecialchars($campaign['signature'] ?? ''); ?>"
                    placeholder="e.g., Best regards, {host_name} or Thanks, The Team">
                <small style="color: #6b7280; margin-top: 0.5rem; display: block;">
                    Available variables: {visitor_name}, {visitor_email}, {visitor_company}, {host_name}
                </small>
            </div>

            <div class="form-group">
                <label>Attachments</label>
                <p style="margin-bottom: 1rem; color: #6b7280; font-size: 0.875rem;">Add PDF files and images to send with the email to all recipients</p>

                <div style="margin-bottom: 1rem;">
                    <input type="file" id="attach-file-input" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" style="display: none;" multiple>
                    <label for="attach-file-input" class="btn-secondary" style="margin-bottom: 0.5rem; display: inline-block; cursor: pointer;">+ Add File</label>
                    <small style="color: #6b7280; display: block;">Supported: PDF, JPG, PNG, GIF, WebP (Max 10MB per file)</small>
                </div>

                <div id="attachments-list" style="display: none; margin-top: 1rem; padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px;">
                    <strong style="color: #166534; display: block; margin-bottom: 0.5rem;">Attached Files:</strong>
                    <ul id="attachments-items" style="margin: 0; padding: 0; list-style: none;">
                    </ul>
                </div>
            </div>

            <div class="form-group">
                <label for="test_email">Send Test Email</label>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
                    <input type="email" id="test_email" name="test_email"
                        value="<?php echo htmlspecialchars($test_email); ?>"
                        placeholder="you@example.com" style="flex: 1 1 260px;">
                    <button type="button" class="btn-secondary" id="send-test-btn">Send Test Email</button>
                </div>
                <small style="color: #6b7280; margin-top: 0.5rem; display: block;">
                    Sends the current subject and HTML to the test address without saving changes.
                </small>
            </div>

            <div class="form-group">
                <label>Send Settings *</label>
                <p style="margin-bottom: 1rem; color: #6b7280; font-size: 0.875rem;">Choose when and how to send this campaign</p>

                <?php
                $send_method = $campaign['send_method'] ?? 'queue';
                $scheduled_at = $campaign['scheduled_at'] ?? '';
                $send_to_all_active = $campaign['send_to_all_active'] ?? 0;
                ?>

                <div style="display: flex; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="send_method" id="send-queue" value="queue" <?php echo $send_method === 'queue' ? 'checked' : ''; ?> style="cursor: pointer;">
                        <span>Queue for automatic sending (cron will send)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="send_method" id="send-immediate" value="immediate" <?php echo $send_method === 'immediate' ? 'checked' : ''; ?> style="cursor: pointer;">
                        <span>Send immediately</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="send_method" id="send-scheduled" value="scheduled" <?php echo $send_method === 'scheduled' ? 'checked' : ''; ?> style="cursor: pointer;">
                        <span>Schedule for specific time</span>
                    </label>
                </div>

                <div id="scheduled-input-section" style="display: <?php echo $send_method === 'scheduled' ? 'block' : 'none'; ?>; margin-bottom: 1rem;">
                    <input type="datetime-local" id="scheduled_at" name="scheduled_at" value="<?php echo htmlspecialchars($scheduled_at); ?>" style="padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem;">
                    <small style="color: #6b7280; margin-top: 0.5rem; display: block;">Campaign will start sending at this time</small>
                </div>

                <div style="margin-top: 1rem; padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" name="send_to_all_active" id="send-to-all-active" value="1" <?php echo $send_to_all_active ? 'checked' : ''; ?> style="cursor: pointer; width: 18px; height: 18px;">
                        <span style="font-weight: 500;">Send to all active subscribers (current + future)</span>
                    </label>
                    <small style="color: #6b7280; margin-top: 0.5rem; display: block; margin-left: 1.5rem;">
                        When enabled, all active subscribers at the time of sending will automatically be added to this campaign. New subscribers added after campaign creation will also be included.
                    </small>
                </div>

                <div id="queue-info" style="padding: 1rem; background: #dbeafe; border: 1px solid #93c5fd; border-radius: 6px; color: #1e40af; font-size: 0.875rem;">
                    Emails will be queued and sent automatically via cron job (every 5 minutes in batches of 10).
                </div>
            </div>

            <div class="form-group">
                <label>Email Recipients *</label>
                <p style="margin-bottom: 1rem; color: #6b7280; font-size: 0.875rem;">Choose how to add recipients</p>

                <div style="display: flex; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="recipient_mode" id="recipient-subscribers" value="subscribers" checked style="cursor: pointer;">
                        <span>Use active subscribers (<?php echo number_format($subscriber_count); ?>)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="recipient_mode" id="recipient-csv" value="csv" style="cursor: pointer;">
                        <span>Upload CSV File</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="recipient_mode" id="recipient-manual" value="manual" style="cursor: pointer;">
                        <span>Enter Email Addresses Manually</span>
                    </label>
                </div>

                <div id="subscribers-input-section" style="margin-bottom: 1rem;">
                    <div id="subscriber-filter-buttons" style="margin-bottom: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
                        <!-- Filter buttons will be populated by JavaScript -->
                    </div>
                    <div style="padding: 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; color: #1e3a8a;">
                        <span id="subscriber-filter-text">Sending to all active subscribers in your list.</span>
                        <a href="subscribers.php" style="color: #1d4ed8; text-decoration: underline; margin-left: 0.25rem;">Manage subscribers</a>
                    </div>
                </div>

                <div id="csv-input-section" style="display: none;">
                    <input type="file" id="recipient-csv-file" accept=".csv" style="display: none;">
                    <button type="button" class="btn-secondary" id="csv-upload-btn" style="margin-bottom: 0.5rem;">Choose CSV File</button>
                    <small style="color: #6b7280; margin-top: 0.5rem; display: block;">CSV must have email, name (optional), and company (optional) columns</small>
                    <div id="csv-preview" style="margin-top: 1rem; padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; color: #166534; display: none;">
                        <strong id="csv-count">0 recipients loaded</strong>
                    </div>
                </div>

                <div id="manual-input-section" style="display: none;">
                    <textarea id="recipient-emails" name="recipient_emails" placeholder="name@company.com, another@domain.com&#10;one@more.com" rows="6" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 0.875rem;"></textarea>
                    <small style="color: #6b7280; margin-top: 0.5rem; display: block;">Comma, space, or newline separated</small>
                    <div id="manual-preview" style="margin-top: 1rem; padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; color: #166534; display: none;">
                        <strong id="manual-count">0 valid emails detected</strong>
                    </div>
                </div>

                <input type="hidden" name="recipients" id="recipients-json" value="[]">
                <input type="hidden" id="subscriber-filter" name="subscriber_filter" value="all">
            </div>

            <?php if ($campaign_id): ?>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-label">Recipients</div>
                        <div class="stat-value"><?php echo $subscriber_count; ?></div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Status</div>
                        <div class="stat-value" style="text-transform: capitalize;"><?php echo $campaign['status']; ?></div>
                    </div>
                </div>

                <div class="info-box">
                    Campaign created on <?php echo date('M d, Y \a\t H:i', strtotime($campaign['created_at'])); ?>
                </div>
            <?php endif; ?>

            <div class="button-group">
                <button type="submit" class="btn-primary">
                    <?php echo $campaign_id ? 'Update Campaign' : 'Save Draft'; ?>
                </button>
                <button type="button" class="btn-primary" id="save-send-btn" style="background: #10b981;">
                    Save &amp; Continue to Send
                </button>
                <a href="index.php" class="btn-secondary" style="text-decoration: none; padding: 0.75rem 1.5rem; display: inline-block;">
                    Cancel
                </a>
            </div>

            <?php if (!$campaign_id): ?>
                <div style="margin-top: 1.5rem; padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; color: #166534; font-size: 0.9rem;">
                    <strong>Tip:</strong> Save your campaign as a draft first, then you can send it to your recipients.
                </div>
            <?php endif; ?>
        </form>
    </div>

    <div class="container">
        <footer class="mail-footer">
            <p>© <?php echo date('Y'); ?> <span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span>. All rights reserved.</p>
        </footer>
    </div>

    <script>
        // TEST DEPLOYMENT: Check if this comment appears - v2 Cache Busting
        const logoUrl = '<?php echo htmlspecialchars(get_logo_url(PUBLIC_URL)); ?>';
        const baseUrl = '<?php echo htmlspecialchars(BASE_URL); ?>';
        const publicUrl = '<?php echo htmlspecialchars(PUBLIC_URL); ?>';

        let previewOpen = false;
        let previewReady = false;
        let greetingInput, bodyInput, signatureInput, preview, previewContainer, previewBtn, previewSubscriberInput, previewSampleSelect, previewSampleRefresh, previewSampleStats;

        function loadDefaultTemplate() {
            // Auto-open preview if not already open
            if (!previewOpen) {
                togglePreview();
            }
            
            const greeting = document.getElementById('greeting');
            const body = document.getElementById('html_body');
            const signature = document.getElementById('signature');
            const templateType = document.getElementById('template-type');

            greeting.value = 'Hello {visitor_name},';
            body.value = 'We are delighted to have you visit us today.\n\nThis is a professional email template with a company header and footer.\n\nYour content and message go here. Write naturally - line breaks will be converted to HTML.\n\nLearn more about floinvite.';
            signature.value = 'Best regards,\n{host_name}';
            if (templateType) {
                templateType.value = 'default';
            }

            // Trigger input events to update preview
            greeting.dispatchEvent(new Event('input', { bubbles: true }));
            body.dispatchEvent(new Event('input', { bubbles: true }));
            signature.dispatchEvent(new Event('input', { bubbles: true }));

            if (previewOpen && previewReady) {
                updatePreview();
            }
        }

        function loadOfferTemplate() {
            // Auto-open preview if not already open
            if (!previewOpen) {
                togglePreview();
            }
            
            const greeting = document.getElementById('greeting');
            const body = document.getElementById('html_body');
            const signature = document.getElementById('signature');
            const templateType = document.getElementById('template-type');

            greeting.value = 'Hi {visitor_name},';
            body.value = 'We have an exclusive special offer just for you!\n\nTake advantage of this limited-time promotion and enjoy amazing benefits.\n\nDon\'t miss out - this offer won\'t last long!';
            signature.value = 'Thank you,\nThe {host_name} Team';
            if (templateType) {
                templateType.value = 'offer';
            }

            // Trigger input events to update preview
            greeting.dispatchEvent(new Event('input', { bubbles: true }));
            body.dispatchEvent(new Event('input', { bubbles: true }));
            signature.dispatchEvent(new Event('input', { bubbles: true }));

            if (previewOpen && previewReady) {
                updatePreview();
            }
        }

        function initializePreview() {
            greetingInput = document.getElementById('greeting');
            bodyInput = document.getElementById('html_body');
            signatureInput = document.getElementById('signature');
            preview = document.getElementById('email-preview');
            previewContainer = document.getElementById('preview-container');
            previewBtn = document.getElementById('preview-toggle');
            const insertTemplateBtn = document.getElementById('insert-template-btn');
            const insertOfferBtn = document.getElementById('insert-offer-btn');

            previewSubscriberInput = document.getElementById('preview-subscriber-email');
            previewSampleSelect = document.getElementById('preview-subscriber-sample');

            // Load subscriber stats
            loadSubscriberStats();
            previewSampleRefresh = document.getElementById('preview-subscriber-refresh');
            previewSampleStats = document.getElementById('preview-subscriber-stats');

            if (greetingInput && bodyInput && signatureInput && preview && previewContainer && previewBtn) {
                // Attach template button listeners
                if (insertTemplateBtn) {
                    insertTemplateBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        loadDefaultTemplate();
                    });
                }
                if (insertOfferBtn) {
                    insertOfferBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        loadOfferTemplate();
                    });
                }

                // Initial preview render - show container by default
                previewContainer.style.display = 'block';
                previewOpen = true;
                previewBtn.textContent = 'Hide Preview';
                updatePreview();

                // Update preview on any input change
                greetingInput.addEventListener('input', function() {
                    if (previewOpen) {
                        updatePreview();
                    }
                });
                bodyInput.addEventListener('input', function() {
                    if (previewOpen) {
                        updatePreview();
                    }
                });
                signatureInput.addEventListener('input', function() {
                    if (previewOpen) {
                        updatePreview();
                    }
                });
                if (previewSubscriberInput) {
                    previewSubscriberInput.addEventListener('input', function() {
                        if (previewOpen) {
                            updatePreview();
                        }
                    });
                }
                if (previewSampleSelect) {
                    previewSampleSelect.addEventListener('change', function() {
                        const selected = previewSampleSelect.value || '';
                        if (previewSubscriberInput) {
                            previewSubscriberInput.value = selected;
                        }
                        if (previewOpen) {
                            updatePreview();
                        }
                    });
                }
                if (previewSampleRefresh) {
                    previewSampleRefresh.addEventListener('click', function() {
                        loadPreviewSamples();
                        loadPreviewStats();
                    });
                }
                loadPreviewSamples();
                loadPreviewStats();
                previewReady = true;
            }
        }

        function togglePreview() {
            if (!previewReady) {
                initializePreview();
            }
            if (!previewBtn) {
                return;
            }
            previewOpen = !previewOpen;
            previewBtn.textContent = previewOpen ? 'Hide Preview' : 'Show Preview';
            if (previewOpen) {
                updatePreview();
            }
        }

        function updatePreview() {
            if (!greetingInput || !bodyInput || !signatureInput || !preview) {
                return;
            }

            const greeting = greetingInput.value || '';
            const body = bodyInput.value || '';
            const signature = signatureInput.value || '';
            const templateType = document.getElementById('template-type').value || 'default';
            const subscriberEmail = previewSubscriberInput ? previewSubscriberInput.value.trim() : '';

            // Fetch preview from server
            const apiUrl = '<?php echo htmlspecialchars(BASE_URL); ?>/api-preview-email.php';
            console.log('Fetching preview from:', apiUrl);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    greeting: greeting,
                    body: body,
                    signature: signature,
                    template_type: templateType,
                    subscriber_email: subscriberEmail,
                    sample_name: 'John Smith',
                    sample_email: 'john@example.com',
                    sample_company: 'ABC Corp',
                    sample_host: 'Mary Johnson',
                    sample_host_email: 'mary@example.com'
                })
            })
            .then(response => {
                clearTimeout(timeoutId);
                console.log('Preview response status:', response.status);
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Preview response data:', data);
                if (data.success && data.data && data.data.html) {
                    const iframeDoc = preview.contentDocument || preview.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(data.data.html);
                    iframeDoc.close();
                } else {
                    throw new Error(data.message || 'Unknown error');
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error('Preview fetch error:', error);
                const iframeDoc = preview.contentDocument || preview.contentWindow.document;
                iframeDoc.open();
                let errorMsg = error.message;
                if (error.name === 'AbortError') {
                    errorMsg = 'Request timeout (10s)';
                }
                iframeDoc.write('<p style="color: #c00; padding: 20px; text-align: center;">Error: ' + errorMsg + '</p>');
                iframeDoc.close();
            });
        }

        function loadPreviewSamples() {
            if (!previewSampleSelect) {
                return;
            }
            const currentFilter = document.getElementById('subscriber-filter').value || 'all';
            const apiUrl = '<?php echo htmlspecialchars(BASE_URL); ?>/api-subscriber-sample.php?filter=' + encodeURIComponent(currentFilter);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            fetch(apiUrl, { signal: controller.signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.json();
                })
                .then(data => {
                    const current = previewSampleSelect.value || '';
                    previewSampleSelect.innerHTML = '<option value="">Select a subscriber…</option>';
                    if (data && data.success && Array.isArray(data.data)) {
                        data.data.forEach((row) => {
                            const option = document.createElement('option');
                            option.value = row.email || '';
                            const name = row.name ? row.name + ' — ' : '';
                            option.textContent = name + (row.email || '');
                            previewSampleSelect.appendChild(option);
                        });
                        if (current) {
                            previewSampleSelect.value = current;
                        }
                    }
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    console.error('Error loading preview samples:', error);
                    previewSampleSelect.innerHTML = '<option value="">Unable to load subscribers</option>';
                });
        }

        function loadPreviewStats() {
            if (!previewSampleStats) {
                return;
            }
            const apiUrl = '<?php echo htmlspecialchars(BASE_URL); ?>/api-subscriber-stats.php';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            fetch(apiUrl, { signal: controller.signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.json();
                })
                .then(data => {
                    if (data && data.success && data.data) {
                        const stats = data.data;
                        const currentFilter = document.getElementById('subscriber-filter').value || 'all';

                        // Create filter buttons
                        previewSampleStats.innerHTML = '';

                        const allBtn = document.createElement('button');
                        allBtn.type = 'button';
                        allBtn.setAttribute('data-filter', 'all');
                        allBtn.textContent = `All (${stats.all})`;
                        allBtn.style.cssText = `
                            padding: 0.4rem 0.7rem;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            background: ${currentFilter === 'all' ? '#4338ca' : '#f3f4f6'};
                            color: ${currentFilter === 'all' ? '#fff' : '#374151'};
                            cursor: pointer;
                            font-size: 0.75rem;
                            font-weight: 500;
                            transition: all 0.2s ease;
                        `;

                        const reachedBtn = document.createElement('button');
                        reachedBtn.type = 'button';
                        reachedBtn.setAttribute('data-filter', 'reached');
                        reachedBtn.textContent = `Reached (${stats.reached})`;
                        reachedBtn.style.cssText = `
                            padding: 0.4rem 0.7rem;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            background: ${currentFilter === 'reached' ? '#4338ca' : '#f3f4f6'};
                            color: ${currentFilter === 'reached' ? '#fff' : '#374151'};
                            cursor: pointer;
                            font-size: 0.75rem;
                            font-weight: 500;
                            transition: all 0.2s ease;
                        `;

                        const unreachedBtn = document.createElement('button');
                        unreachedBtn.type = 'button';
                        unreachedBtn.setAttribute('data-filter', 'unreached');
                        unreachedBtn.textContent = `Unreached (${stats.unreached})`;
                        unreachedBtn.style.cssText = `
                            padding: 0.4rem 0.7rem;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            background: ${currentFilter === 'unreached' ? '#4338ca' : '#f3f4f6'};
                            color: ${currentFilter === 'unreached' ? '#fff' : '#374151'};
                            cursor: pointer;
                            font-size: 0.75rem;
                            font-weight: 500;
                            transition: all 0.2s ease;
                        `;

                        // Add button click handlers
                        const handleFilterClick = (btn) => {
                            const filter = btn.getAttribute('data-filter');
                            document.getElementById('subscriber-filter').value = filter;
                            updateSubscriberFilterDisplay(filter);
                            loadPreviewStats();
                            loadPreviewSamples();
                        };

                        allBtn.addEventListener('click', (e) => { e.preventDefault(); handleFilterClick(allBtn); });
                        reachedBtn.addEventListener('click', (e) => { e.preventDefault(); handleFilterClick(reachedBtn); });
                        unreachedBtn.addEventListener('click', (e) => { e.preventDefault(); handleFilterClick(unreachedBtn); });

                        previewSampleStats.appendChild(allBtn);
                        previewSampleStats.appendChild(reachedBtn);
                        previewSampleStats.appendChild(unreachedBtn);
                    }
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    console.error('Error loading subscriber stats:', error);
                    previewSampleStats.textContent = 'Stats unavailable';
                });
        }

        function updateSubscriberFilterDisplay(filter) {
            const subscribersSection = document.getElementById('subscribers-input-section');
            if (!subscribersSection) return;

            const filterLabels = {
                'all': 'Sending to all active subscribers in your list.',
                'reached': 'Sending to subscribers who have already been reached.',
                'unreached': 'Sending to subscribers who have not yet been reached.'
            };

            const label = filterLabels[filter] || 'Sending to selected subscribers.';
            subscribersSection.querySelector('div').textContent = label;

            const link = subscribersSection.querySelector('a');
            if (link) {
                link.textContent = 'Manage subscribers';
                link.style.marginLeft = '0.25rem';
            }
        }

        // Load subscriber filter buttons for main recipients section
        function loadSubscriberFilterButtons() {
            const filterButtonsContainer = document.getElementById('subscriber-filter-buttons');
            if (!filterButtonsContainer) {
                return;
            }

            const apiUrl = '<?php echo htmlspecialchars(BASE_URL); ?>/api-subscriber-stats.php';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            fetch(apiUrl, { signal: controller.signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.json();
                })
                .then(data => {
                    if (data && data.success && data.data) {
                        const stats = data.data;
                        const currentFilter = document.getElementById('subscriber-filter').value || 'all';

                        filterButtonsContainer.innerHTML = '';

                        const allBtn = document.createElement('button');
                        allBtn.type = 'button';
                        allBtn.setAttribute('data-filter', 'all');
                        allBtn.textContent = `All (${stats.all})`;
                        allBtn.style.cssText = `
                            padding: 0.5rem 1rem;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            background: ${currentFilter === 'all' ? '#4338ca' : '#f3f4f6'};
                            color: ${currentFilter === 'all' ? '#fff' : '#374151'};
                            cursor: pointer;
                            font-size: 0.875rem;
                            font-weight: 500;
                            transition: all 0.2s ease;
                        `;

                        const reachedBtn = document.createElement('button');
                        reachedBtn.type = 'button';
                        reachedBtn.setAttribute('data-filter', 'reached');
                        reachedBtn.textContent = `Reached (${stats.reached})`;
                        reachedBtn.style.cssText = `
                            padding: 0.5rem 1rem;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            background: ${currentFilter === 'reached' ? '#4338ca' : '#f3f4f6'};
                            color: ${currentFilter === 'reached' ? '#fff' : '#374151'};
                            cursor: pointer;
                            font-size: 0.875rem;
                            font-weight: 500;
                            transition: all 0.2s ease;
                        `;

                        const unreachedBtn = document.createElement('button');
                        unreachedBtn.type = 'button';
                        unreachedBtn.setAttribute('data-filter', 'unreached');
                        unreachedBtn.textContent = `Unreached (${stats.unreached})`;
                        unreachedBtn.style.cssText = `
                            padding: 0.5rem 1rem;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            background: ${currentFilter === 'unreached' ? '#4338ca' : '#f3f4f6'};
                            color: ${currentFilter === 'unreached' ? '#fff' : '#374151'};
                            cursor: pointer;
                            font-size: 0.875rem;
                            font-weight: 500;
                            transition: all 0.2s ease;
                        `;

                        // Add button click handlers
                        const handleMainFilterClick = (btn) => {
                            const filter = btn.getAttribute('data-filter');
                            document.getElementById('subscriber-filter').value = filter;
                            updateMainSubscriberFilterDisplay(filter);
                            loadSubscriberFilterButtons();
                        };

                        allBtn.addEventListener('click', (e) => { e.preventDefault(); handleMainFilterClick(allBtn); });
                        reachedBtn.addEventListener('click', (e) => { e.preventDefault(); handleMainFilterClick(reachedBtn); });
                        unreachedBtn.addEventListener('click', (e) => { e.preventDefault(); handleMainFilterClick(unreachedBtn); });

                        filterButtonsContainer.appendChild(allBtn);
                        filterButtonsContainer.appendChild(reachedBtn);
                        filterButtonsContainer.appendChild(unreachedBtn);
                    }
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    console.error('Error loading subscriber filter buttons:', error);
                });
        }

        // Update main subscriber filter display text
        function updateMainSubscriberFilterDisplay(filter) {
            const filterText = document.getElementById('subscriber-filter-text');
            if (!filterText) return;

            const filterLabels = {
                'all': 'Sending to all active subscribers in your list.',
                'reached': 'Sending to subscribers who have already been reached.',
                'unreached': 'Sending to subscribers who have not yet been reached.'
            };

            filterText.textContent = filterLabels[filter] || 'Sending to selected subscribers.';
        }

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initializePreview();
                loadSubscriberFilterButtons();
            });
        } else {
            initializePreview();
            loadSubscriberFilterButtons();
        }

        const testBtn = document.getElementById('send-test-btn');
        const saveSendBtn = document.getElementById('save-send-btn');
        const formAction = document.getElementById('form-action');
        const campaignForm = document.getElementById('campaign-form');

        if (testBtn && formAction && campaignForm) {
            testBtn.addEventListener('click', () => {
                formAction.value = 'test';
                campaignForm.submit();
            });
        }

        if (saveSendBtn && formAction && campaignForm) {
            saveSendBtn.addEventListener('click', () => {
                formAction.value = 'save_send';
                campaignForm.submit();
            });
        }

        // Recipient input handling
        const recipientSubscribersRadio = document.getElementById('recipient-subscribers');
        const recipientCSVRadio = document.getElementById('recipient-csv');
        const recipientManualRadio = document.getElementById('recipient-manual');
        const subscribersInputSection = document.getElementById('subscribers-input-section');
        const csvInputSection = document.getElementById('csv-input-section');
        const manualInputSection = document.getElementById('manual-input-section');
        const csvUploadBtn = document.getElementById('csv-upload-btn');
        const csvFileInput = document.getElementById('recipient-csv-file');
        const recipientEmailsTextarea = document.getElementById('recipient-emails');
        const recipientsJsonField = document.getElementById('recipients-json');

        // Toggle between subscriber list, CSV, and manual input
        const showSubscriberMode = () => {
            subscribersInputSection.style.display = 'block';
            csvInputSection.style.display = 'none';
            manualInputSection.style.display = 'none';
            recipientsJsonField.value = '[]';
        };

        const showCSVMode = () => {
            subscribersInputSection.style.display = 'none';
            csvInputSection.style.display = 'block';
            manualInputSection.style.display = 'none';
        };

        const showManualMode = () => {
            subscribersInputSection.style.display = 'none';
            csvInputSection.style.display = 'none';
            manualInputSection.style.display = 'block';
        };

        recipientSubscribersRadio.addEventListener('change', showSubscriberMode);
        recipientCSVRadio.addEventListener('change', showCSVMode);
        recipientManualRadio.addEventListener('change', showManualMode);

        if (recipientSubscribersRadio.checked) {
            showSubscriberMode();
        } else if (recipientCSVRadio.checked) {
            showCSVMode();
        } else {
            showManualMode();
        }

        // CSV file upload
        csvUploadBtn.addEventListener('click', () => {
            csvFileInput.click();
        });

        csvFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const text = await file.text();
            const recipients = parseCSV(text);
            displayCSVPreview(recipients);
            serializeRecipients(recipients);
        });

        // Manual email input with real-time validation
        recipientEmailsTextarea.addEventListener('input', () => {
            const emails = parseManualEmails(recipientEmailsTextarea.value);
            displayManualPreview(emails);
            serializeRecipients(emails);
        });

        // Parse CSV file
        function parseCSV(text) {
            const lines = text.trim().split('\n');
            if (lines.length === 0) return [];

            // Parse header
            const headerLine = lines[0].split(',').map(h => h.trim().toLowerCase());
            const emailIndex = headerLine.indexOf('email');
            const nameIndex = headerLine.indexOf('name');
            const companyIndex = headerLine.indexOf('company');

            if (emailIndex === -1) {
                alert('CSV must have an "email" column');
                return [];
            }

            // Parse data rows
            const recipients = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const fields = line.split(',').map(f => f.trim());
                const email = fields[emailIndex];
                const name = nameIndex !== -1 ? fields[nameIndex] : '';
                const company = companyIndex !== -1 ? fields[companyIndex] : '';

                if (validateEmail(email)) {
                    recipients.push({ email, name, company });
                }
            }

            return recipients;
        }

        // Parse manual email input (comma, space, or newline separated)
        function parseManualEmails(text) {
            const recipients = [];
            const emailsText = text.replace(/[,\s]+/g, '\n').trim();
            const lines = emailsText.split('\n');

            lines.forEach(line => {
                const email = line.trim();
                if (email && validateEmail(email)) {
                    recipients.push({ email, name: '', company: '' });
                }
            });

            return recipients;
        }

        // Email validation
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        }

        // Display CSV preview
        function displayCSVPreview(recipients) {
            const preview = document.getElementById('csv-preview');
            const count = document.getElementById('csv-count');

            if (recipients.length === 0) {
                preview.style.display = 'none';
                return;
            }

            count.textContent = recipients.length + ' recipient' + (recipients.length !== 1 ? 's' : '') + ' loaded';
            preview.style.display = 'block';
        }

        // Display manual preview
        function displayManualPreview(recipients) {
            const preview = document.getElementById('manual-preview');
            const count = document.getElementById('manual-count');

            if (recipients.length === 0) {
                preview.style.display = 'none';
                return;
            }

            count.textContent = recipients.length + ' valid email' + (recipients.length !== 1 ? 's' : '') + ' detected';
            preview.style.display = 'block';
        }

        // Serialize recipients to JSON field
        function serializeRecipients(recipients) {
            recipientsJsonField.value = JSON.stringify(recipients);
        }

        // Handle send method selection
        const sendQueueRadio = document.getElementById('send-queue');
        const sendImmediateRadio = document.getElementById('send-immediate');
        const sendScheduledRadio = document.getElementById('send-scheduled');
        const scheduledInputSection = document.getElementById('scheduled-input-section');
        const scheduledAtInput = document.getElementById('scheduled_at');
        const queueInfo = document.getElementById('queue-info');

        const updateSendMethodUI = () => {
            if (sendScheduledRadio.checked) {
                scheduledInputSection.style.display = 'block';
                queueInfo.style.display = 'none';
                scheduledAtInput.required = true;
            } else {
                scheduledInputSection.style.display = 'none';
                scheduledAtInput.required = false;
                if (sendQueueRadio.checked) {
                    queueInfo.style.display = 'block';
                } else {
                    queueInfo.style.display = 'none';
                }
            }
        };

        if (sendQueueRadio) sendQueueRadio.addEventListener('change', updateSendMethodUI);
        if (sendImmediateRadio) sendImmediateRadio.addEventListener('change', updateSendMethodUI);
        if (sendScheduledRadio) sendScheduledRadio.addEventListener('change', updateSendMethodUI);

        // Initialize UI on page load
        updateSendMethodUI();

        // ═══════════════════════════════════════════════════
        // Attachment Handling
        // ═══════════════════════════════════════════════════
        let attachFileInput, attachmentsList, attachmentsItems;
        let currentAttachments = [];
        let tempAttachments = [];  // Temporary attachments storage for new campaigns

        // Initialize attachments on page load
        function initializeAttachments() {
            // Get elements when DOM is ready
            attachFileInput = document.getElementById('attach-file-input');
            attachmentsList = document.getElementById('attachments-list');
            attachmentsItems = document.getElementById('attachments-items');

            // Set up button handlers
            setupAttachmentButton();

            // Load existing attachments for saved campaigns
            if (!<?php echo $campaign_id ? 'true' : 'false'; ?>) return;

            fetch('<?php echo htmlspecialchars(BASE_URL); ?>/api-handle-attachments.php?action=list&campaign_id=<?php echo htmlspecialchars($campaign_id); ?>')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        currentAttachments = data.attachments;
                        renderAttachmentsList();
                    }
                })
                .catch(error => console.error('Error loading attachments:', error));
        }

        // Render attachments list (both server and temporary)
        function renderAttachmentsList() {
            attachmentsItems.innerHTML = '';

            // Render server attachments
            currentAttachments.forEach(att => {
                const li = document.createElement('li');
                li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: white; border-radius: 4px; margin-bottom: 0.5rem;';

                const fileInfo = document.createElement('span');
                fileInfo.textContent = att.original_name + ' (' + (att.file_size / 1024).toFixed(1) + ' KB)';
                fileInfo.style.cssText = 'color: #166534; font-size: 0.875rem;';

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.textContent = 'Remove';
                deleteBtn.style.cssText = 'background: #ef4444; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.75rem; font-size: 0.75rem; cursor: pointer;';
                deleteBtn.onclick = (e) => {
                    e.preventDefault();
                    deleteAttachment(att.id);
                };

                li.appendChild(fileInfo);
                li.appendChild(deleteBtn);
                attachmentsItems.appendChild(li);
            });

            // Render temporary attachments (for new campaigns)
            tempAttachments.forEach((file, index) => {
                const li = document.createElement('li');
                li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: white; border-radius: 4px; margin-bottom: 0.5rem; opacity: 0.7;';

                const fileInfo = document.createElement('span');
                fileInfo.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB) - Pending';
                fileInfo.style.cssText = 'color: #166534; font-size: 0.875rem;';

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.textContent = 'Remove';
                deleteBtn.style.cssText = 'background: #ef4444; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.75rem; font-size: 0.75rem; cursor: pointer;';
                deleteBtn.onclick = (e) => {
                    e.preventDefault();
                    tempAttachments.splice(index, 1);
                    renderAttachmentsList();
                };

                li.appendChild(fileInfo);
                li.appendChild(deleteBtn);
                attachmentsItems.appendChild(li);
            });

            attachmentsList.style.display = (currentAttachments.length + tempAttachments.length) > 0 ? 'block' : 'none';
        }

        // Set up attachment handlers (called after DOM is ready)
        function setupAttachmentButton() {
            if (!attachFileInput) {
                console.error('Attachment file input not found');
                return;
            }

            // Handle file selection
            attachFileInput.addEventListener('change', async (e) => {
                const files = e.target.files;
                if (!files.length) return;

                for (let file of files) {
                    await uploadAttachment(file);
                }

                // Reset input
                e.target.value = '';
            });
        }

        // Upload attachment
        async function uploadAttachment(file) {
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                alert('File too large: ' + file.name + ' (max 10MB)');
                return;
            }

            const hasCampaignId = <?php echo $campaign_id ? 'true' : 'false'; ?>;

            if (hasCampaignId) {
                // For existing campaigns: upload immediately to server
                const formData = new FormData();
                formData.append('file', file);
                formData.append('action', 'upload');
                formData.append("campaign_id", "<?php echo htmlspecialchars($campaign_id); ?>");

                try {
                    const response = await fetch('<?php echo htmlspecialchars(BASE_URL); ?>/api-handle-attachments.php', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (data.success) {
                        currentAttachments.push(data.attachment);
                        renderAttachmentsList();
                    } else {
                        alert('Error uploading file: ' + data.error);
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('Error uploading file: ' + error.message);
                }
            } else {
                // For new campaigns: store temporarily client-side
                tempAttachments.push(file);
                renderAttachmentsList();
            }
        }

        // Delete attachment
        async function deleteAttachment(attachmentId) {
            if (!confirm('Are you sure you want to remove this attachment?')) return;

            try {
                const response = await fetch('<?php echo htmlspecialchars(BASE_URL); ?>/api-handle-attachments.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: 'delete',
                        campaign_id: (<?php echo $campaign_id ? "true" : "false"; ?> ? "<?php echo htmlspecialchars($campaign_id); ?>" : ""),
                        attachment_id: attachmentId
                    })
                });

                const data = await response.json();

                if (data.success) {
                    currentAttachments = currentAttachments.filter(att => att.id !== attachmentId);
                    renderAttachmentsList();
                } else {
                    alert('Error deleting attachment: ' + data.error);
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('Error deleting attachment: ' + error.message);
            }
        }

        // Handle form submission with temp attachments
        function initializeFormHandler() {
            const form = document.getElementById('campaign-form');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
                // Only intercept if this is a new campaign with temp attachments
                if (tempAttachments.length === 0 || <?php echo $campaign_id ? 'true' : 'false'; ?>) {
                    return; // Let form submit normally
                }

                e.preventDefault();

                // Show uploading message
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving campaign...';

                try {
                    // Submit form to create campaign first
                    const formData = new FormData(form);
                    const response = await fetch(form.action || '', {
                        method: 'POST',
                        body: formData
                    });

                    const html = await response.text();

                    // Check if campaign was created successfully by looking for campaign_id in response
                    const campaignIdMatch = html.match(/id=(\d+)/);
                    if (!campaignIdMatch) {
                        throw new Error('Failed to create campaign');
                    }

                    const newCampaignId = campaignIdMatch[1];
                    submitBtn.textContent = 'Uploading ' + tempAttachments.length + ' file(s)...';

                    // Now upload temp attachments
                    for (let file of tempAttachments) {
                        const attachFormData = new FormData();
                        attachFormData.append('file', file);
                        attachFormData.append('action', 'upload');
                        attachFormData.append('campaign_id', newCampaignId);

                        const uploadResponse = await fetch('<?php echo htmlspecialchars(BASE_URL); ?>/api-handle-attachments.php', {
                            method: 'POST',
                            body: attachFormData
                        });

                        const uploadData = await uploadResponse.json();
                        if (!uploadData.success) {
                            throw new Error('Failed to upload ' + file.name + ': ' + uploadData.error);
                        }
                    }

                    // Success - redirect to campaign or refresh
                    window.location.href = 'compose.php?id=' + newCampaignId;

                } catch (error) {
                    console.error('Error:', error);
                    alert('Error: ' + error.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }

        // Initialize attachments and form handler when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initializeAttachments();
                initializeFormHandler();
            });
        } else {
            initializeAttachments();
            initializeFormHandler();
        }

        // ═══════════════════════════════════════════════════
        // Load Subscriber Statistics
        // ═══════════════════════════════════════════════════
        function loadSubscriberStats() {
            const statsElement = document.getElementById('preview-sample-stats');
            if (!statsElement) return;

            const apiUrl = '<?php echo htmlspecialchars(BASE_URL); ?>/api-subscriber-stats.php';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            fetch(apiUrl, { signal: controller.signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.json();
                })
                .then(data => {
                    if (data.success && data.data) {
                        const { all, reached, unreached } = data.data;
                        statsElement.textContent = `All: ${all} · Reached: ${reached} · Unreached: ${unreached}`;
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error('Error loading stats:', error);
                    statsElement.textContent = 'Stats unavailable';
                });
        }
    </script>

</body>
</html>
