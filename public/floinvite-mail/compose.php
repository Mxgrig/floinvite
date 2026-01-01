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
    $name = trim($_POST['name'] ?? '');
    $subject = trim($_POST['subject'] ?? '');
    $from_name = trim($_POST['from_name'] ?? '');
    $html_body = trim($_POST['html_body'] ?? '');

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

            // Reload campaign data
            $stmt = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
            $stmt->execute([$campaign_id]);
            $campaign = $stmt->fetch();
        } catch (Exception $e) {
            $message = 'Error: ' . $e->getMessage();
        }
    }
}

// Get subscriber count for this campaign
$subscriber_count = 0;
if ($campaign_id) {
    $result = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
    $subscriber_count = $result->fetch()['count'] ?? 0;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $campaign_id ? 'Edit Campaign' : 'Compose Campaign'; ?> - Floinvite Mail</title>
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

        <form method="POST" class="section">
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
                        value="<?php echo htmlspecialchars($campaign['from_name'] ?? 'Floinvite Team'); ?>"
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
                <?php if ($campaign_id && $campaign['status'] === 'draft'): ?>
                    <a href="send.php?id=<?php echo $campaign_id; ?>" class="btn-primary" style="text-decoration: none; padding: 0.75rem 1.5rem; display: inline-block; background: #10b981;">
                        Send Campaign
                    </a>
                <?php endif; ?>
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
            border-bottom: 3px solid #4f46e5;
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
            background: #4f46e5;
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
            background: #4338ca;
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
            color: #4f46e5;
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
                <img src="${logoUrl}" alt="Floinvite">
                <div class="company-name">Floinvite</div>
            </div>
        </div>
        <div class="content">
            <p class="greeting">Hello {name},</p>
            <h2>Welcome to Floinvite</h2>
            <p>We're excited to connect with you. Here's an important update for your visit.</p>
            <p>Your content goes here. Edit this message to customize your email.</p>
            <a href="#" class="cta-button">Learn More</a>
            <p style="color: #666; font-size: 14px; margin-top: 32px;">If you have any questions, don't hesitate to reach out.</p>
        </div>
        <div class="footer">
            <p><strong>Floinvite</strong><br>Professional Visitor Management</p>
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
            color: #4f46e5;
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
                <img src="${logoUrl}" alt="Floinvite">
                <div class="company-name">Floinvite</div>
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
            <p>Thank you for choosing Floinvite!</p>
        </div>
        <div class="footer">
            <p><strong>Floinvite</strong><br>Professional Visitor Management</p>
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
    </script>
</body>
</html>
