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
    $stmt->execute([$campaign_id]);
    $campaign = $stmt->fetch();

    if (!$campaign) {
        $message = 'Campaign not found';
    }
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'save';
    $name = trim($_POST['name'] ?? '');
    $subject = trim($_POST['subject'] ?? '');
    $from_name = trim($_POST['from_name'] ?? '');
    $html_body = trim($_POST['html_body'] ?? '');
    $test_email = trim($_POST['test_email'] ?? '');

    if ($action === 'test') {
        if (!validate_email($test_email)) {
            $message = 'Error: Provide a valid test email address';
        } elseif (!$subject || !$from_name || !$html_body) {
            $message = 'Error: Subject, From Name, and Email Content are required for test send';
        } else {
            $safe_subject = preg_replace('/[\r\n]+/', ' ', $subject);
            $safe_from = preg_replace('/[\r\n]+/', ' ', $from_name);
            $from_email = SMTP_USER ?: 'admin@floinvite.com';

            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-type: text/html; charset=UTF-8\r\n";
            $headers .= "From: {$safe_from} <{$from_email}>\r\n";
            $headers .= "Reply-To: {$from_email}\r\n";

            if (@mail($test_email, $safe_subject, $html_body, $headers)) {
                $message = 'Test email sent successfully';
            } else {
                $message = 'Error: Test email failed to send';
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
                        SET name = ?, subject = ?, from_name = ?, html_body = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$name, $subject, $from_name, $html_body, $campaign_id]);
                    $message = 'Campaign updated successfully';
                } else {
                    // Create new
                    $stmt = $db->prepare("
                        INSERT INTO campaigns (name, subject, from_name, html_body, status)
                        VALUES (?, ?, ?, ?, 'draft')
                    ");
                    $stmt->execute([$name, $subject, $from_name, $html_body]);
                    $campaign_id = $db->lastInsertId();
                    $message = 'Campaign created successfully';
                }

                if ($action === 'save_send') {
                    $recipient_mode = $_POST['recipient_mode'] ?? 'subscribers';
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
                        'custom_emails' => implode("\n", $emails),
                        'token' => $prefill_token
                    ];
                    header('Location: send.php?id=' . $campaign_id . '&prefill=' . urlencode($prefill_token));
                    exit;
                }

                // Reload campaign data
                $stmt = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
                $stmt->execute([$campaign_id]);
                $campaign = $stmt->fetch();
            } catch (Exception $e) {
                $message = 'Error: ' . $e->getMessage();
            }
        }
    }
}

// Get subscriber count
$subscriber_count = 0;
$result = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
$subscriber_count = $result->fetch()['count'] ?? 0;

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $campaign_id ? 'Edit Campaign' : 'Compose Campaign'; ?> - floinvite Mail</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .container {
            max-width: 1000px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .template-btn {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            cursor: pointer;
        }

        .template-btn:hover {
            background: #e5e7eb;
        }
    </style>
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

            <div class="form-group">
                <label for="html_body">Email Content (HTML) *</label>
                <div style="margin-bottom: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button type="button" class="template-btn" onclick="insertTemplate()">Insert Default Template</button>
                    <button type="button" class="template-btn" onclick="insertPromo()">Insert Promo Template</button>
                    <button type="button" class="template-btn" id="preview-toggle" onclick="togglePreview()" style="background: #4f46e5; color: white; border: none;">Show Preview</button>
                </div>
                <textarea id="html_body" name="html_body" required placeholder="Enter HTML email content..."><?php echo htmlspecialchars($campaign['html_body'] ?? ''); ?></textarea>
                <small style="color: #6b7280; margin-top: 0.5rem; display: block;">
                    Support variables: {name}, {email}, {company}. Use tracking pixel: &lt;img src="<?php echo BASE_URL; ?>/track.php?id={tracking_id}" width="1" height="1"&gt;
                </small>
                <div id="preview-container" style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 0.9rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Email Preview</h3>
                    <iframe id="email-preview" style="width: 100%; height: 600px; border: 1px solid #e5e7eb; border-radius: 4px; background: white; display: block;"></iframe>
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
                    <div style="padding: 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; color: #1e3a8a;">
                        Sending to all active subscribers in your list.
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
        const logoUrl = '<?php echo htmlspecialchars(get_logo_url(PUBLIC_URL)); ?>';
        const baseUrl = '<?php echo htmlspecialchars(BASE_URL); ?>';
        const publicUrl = '<?php echo htmlspecialchars(PUBLIC_URL); ?>';

        function getDefaultTemplate() {
            return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f8f9fa;
            line-height: 1.5;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-collapse: collapse;
        }
        .header {
            padding: 32px 32px 24px;
            border-bottom: 3px solid #4338ca;
            text-align: left;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }
        .logo-section img {
            height: 32px;
            width: auto;
        }
        .brand-wordmark {
            display: inline-flex;
            align-items: baseline;
            gap: 0;
            font-weight: 700;
            letter-spacing: -0.3px;
            line-height: 1;
            text-transform: lowercase;
        }
        .brand-wordmark-flo {
            color: #4338ca;
        }
        .brand-wordmark-invite {
            color: #10b981;
        }
        .brand-wordmark {
            display: inline-flex;
            align-items: baseline;
            gap: 0;
            font-weight: 700;
            letter-spacing: -0.3px;
            line-height: 1;
            text-transform: lowercase;
        }
        .brand-wordmark-flo {
            color: #4338ca;
        }
        .brand-wordmark-invite {
            color: #10b981;
        }
        .company-name {
            font-size: 18px;
            font-weight: 600;
            color: #111;
            margin: 0;
        }
        .content {
            padding: 32px;
            color: #333;
        }
        .greeting {
            font-size: 16px;
            margin: 0 0 24px 0;
            font-weight: 500;
        }
        .content h2 {
            color: #111;
            font-size: 22px;
            margin: 0 0 16px 0;
            font-weight: 600;
        }
        .content p {
            font-size: 16px;
            margin: 0 0 16px 0;
            line-height: 1.6;
        }
        .cta-button {
            display: inline-block;
            background: #4338ca;
            color: white;
            padding: 12px 32px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            margin: 24px 0;
            font-size: 16px;
            line-height: 1;
            border: none;
            cursor: pointer;
        }
        .cta-button:hover {
            background: #3730a3;
        }
        .footer {
            padding: 24px 32px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #666;
            line-height: 1.6;
        }
        .footer p {
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #4338ca;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 600px) {
            .email-container { width: 100% !important; }
            .header { padding: 24px 20px 16px; }
            .content { padding: 24px 20px; }
            .footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-section">
                <img src="${logoUrl}" alt="floinvite">
                <div class="company-name"><span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></div>
            </div>
        </div>
        <div class="content">
            <p class="greeting">Hello {name},</p>
            <h2>Welcome to <span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></h2>
            <p>We're excited to connect with you. Here's an important update for your visit.</p>
            <p>Your content goes here. Edit this message to customize your email.</p>
            <a href="#" class="cta-button">Learn More</a>
            <p style="color: #666; font-size: 14px; margin-top: 32px;">If you have any questions, don't hesitate to reach out.</p>
        </div>
        <div class="footer">
            <p><strong><span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></strong><br>Professional Visitor Management</p>
            <p>Email: {email}<br>Company: {company}</p>
            <p><a href="${baseUrl}/unsubscribe.php?token={unsubscribe_token}">Unsubscribe</a> | <a href="${publicUrl}/contact">Contact Us</a></p>
        </div>
    </div>
</body>
</html>`;
        }

        function insertTemplate() {
            const template = getDefaultTemplate();
            document.getElementById('html_body').value = template;
            updatePreview();
        }

        function insertPromo() {
            const template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f8f9fa;
            line-height: 1.5;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
        }
        .header {
            padding: 24px 32px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-section img {
            height: 32px;
            width: auto;
        }
        .company-name {
            font-size: 18px;
            font-weight: 600;
            color: #111;
            margin: 0;
        }
        .hero {
            background: #dc2626;
            color: white;
            padding: 48px 32px;
            text-align: center;
        }
        .hero h1 {
            font-size: 32px;
            margin: 0 0 12px 0;
            font-weight: 700;
            line-height: 1.2;
        }
        .hero p {
            font-size: 18px;
            margin: 0 0 28px 0;
            opacity: 0.95;
        }
        .cta {
            display: inline-block;
            background: white;
            color: #dc2626;
            padding: 14px 40px;
            text-decoration: none;
            font-weight: 700;
            border-radius: 4px;
            font-size: 16px;
            border: none;
            cursor: pointer;
        }
        .cta:hover {
            background: #f3f4f6;
        }
        .content {
            padding: 32px;
            color: #333;
        }
        .content p {
            font-size: 16px;
            margin: 0 0 16px 0;
            line-height: 1.6;
        }
        .content p:first-child {
            font-weight: 500;
            margin-bottom: 24px;
        }
        .footer {
            padding: 24px 32px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #666;
            line-height: 1.6;
        }
        .footer p {
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #4338ca;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .badge {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        @media (max-width: 600px) {
            .email-container { width: 100% !important; }
            .header { padding: 20px; }
            .hero { padding: 36px 20px; }
            .hero h1 { font-size: 28px; }
            .content { padding: 20px; }
            .footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-section">
                <img src="${logoUrl}" alt="floinvite">
                <div class="company-name"><span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></div>
            </div>
        </div>
        <div class="hero">
            <div class="badge">Limited Time Offer</div>
            <h1>Special Offer Just For You!</h1>
            <p>Get 20% off on your next visit</p>
            <a href="#" class="cta">Claim Offer Now</a>
        </div>
        <div class="content">
            <p>Hi {name},</p>
            <p>We have a special exclusive offer just for our valued customers like you.</p>
            <p>This limited-time offer is a token of our appreciation. Don't miss out!</p>
            <p>Thank you for choosing <span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span>!</p>
        </div>
        <div class="footer">
            <p><strong><span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></strong><br>Professional Visitor Management</p>
            <p><a href="${baseUrl}/unsubscribe.php?token={unsubscribe_token}">Unsubscribe</a> | <a href="${publicUrl}/contact">Contact Us</a></p>
        </div>
    </div>
</body>
</html>`;
            document.getElementById('html_body').value = template;
            updatePreview();
        }

        let previewOpen = false;
        let previewReady = false;
        let textarea, preview, previewContainer, previewBtn;

        function initializePreview() {
            textarea = document.getElementById('html_body');
            preview = document.getElementById('email-preview');
            previewContainer = document.getElementById('preview-container');
            previewBtn = document.getElementById('preview-toggle');

            if (textarea && preview && previewContainer && previewBtn) {
                // Load default template on page load
                if (!textarea.value) {
                    textarea.value = getDefaultTemplate();
                    previewOpen = true;
                }

                // Initial preview render
                updatePreview();

                textarea.addEventListener('input', function() {
                    if (previewOpen) {
                        updatePreview();
                    }
                });
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
            if (!textarea || !preview) {
                return;
            }
            let html = textarea.value || '<p style="color: #999; padding: 20px; text-align: center;">Email preview will appear here...</p>';

            // Substitute template variables with actual values
            html = html.replace(/\$\{logoUrl\}/g, logoUrl);
            html = html.replace(/\$\{baseUrl\}/g, baseUrl);
            html = html.replace(/\$\{publicUrl\}/g, publicUrl);

            // Use document.write to render HTML in iframe
            const iframeDoc = preview.contentDocument || preview.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(html);
            iframeDoc.close();
        }

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializePreview);
        } else {
            initializePreview();
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
    </script>

    <!-- Footer -->
    <div class="container">
        <div style="text-align: center; padding: 2rem 0; border-top: 1px solid #e5e7eb; margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
            <p style="margin: 0;"><strong><span style="color: #4338ca;">flo</span><span style="color: #10b981;">invite</span></strong> Email Marketing Platform</p>
            <p style="margin: 0.25rem 0 0 0;"><?php echo date('M d, Y'); ?></p>
        </div>
    </div>
</body>
</html>
