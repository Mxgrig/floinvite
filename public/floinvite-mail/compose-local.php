<?php
/**
 * Compose Campaign - LOCAL VERSION
 * Demo page without database requirement
 */
session_start();
$_SESSION['admin_logged_in'] = true;
$_SESSION['last_activity'] = time();

require_once 'logo.php';

$subscriber_count = 1234;
$message = '';
$campaign = null;
define('BASE_URL', 'http://localhost:8080');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compose Campaign - floinvite Mail</title>
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
            <a href="index-local.php" class="back-link">← Back to Dashboard</a>
            <h1>Create New Campaign</h1>
            <nav class="nav mail-nav">
                <a href="index-local.php">Dashboard</a>
                <a href="subscribers.php">Subscribers</a>
                <a href="compose-local.php" class="active">New Campaign</a>
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
                    <button type="button" class="template-btn" id="preview-toggle" onclick="togglePreview()" style="background: #4338ca; color: white; border: none;">Show Preview</button>
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
                    <input type="email" id="test_email" name="test_email" placeholder="you@example.com" style="flex: 1 1 260px;">
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

            <div class="form-actions">
                <button type="submit" class="btn-primary">
                    Save Draft
                </button>
                <button type="button" class="btn-primary" id="save-send-btn" style="background: #10b981;">
                    Save &amp; Continue to Send
                </button>
                <a href="index-local.php" class="btn-secondary" style="text-decoration: none; padding: 0.75rem 1.5rem; display: inline-block;">
                    Cancel
                </a>
            </div>
        </form>
    </div>

    <!-- Footer -->
    <div class="container">
        <footer class="mail-footer">
            <p>© <?php echo date('Y'); ?> <span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span>. All rights reserved.</p>
        </footer>
    </div>

    <script>
        function insertTemplate() {
            const defaultTemplate = `<html><body style="font-family: Arial, sans-serif;">
<h2>Hello {name},</h2>
<p>Welcome to floinvite! We're excited to connect with you.</p>
<p>Your content goes here. Edit this message to customize your email.</p>
<a href="#" style="background: #4338ca; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Learn More</a>
<p style="margin-top: 30px; color: #666; font-size: 14px;">If you have any questions, don't hesitate to reach out.</p>
</body></html>`;
            document.getElementById('html_body').value = defaultTemplate;
            updatePreview();
        }

        function insertPromo() {
            const promoTemplate = `<html><body style="font-family: Arial, sans-serif;">
<h2>Special Offer Just for You!</h2>
<p>Hi {name},</p>
<p>We have an exclusive offer just for our valued customers like you.</p>
<p>This limited-time offer is a token of our appreciation.</p>
<a href="#" style="background: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-size: 16px;">Claim Your Offer</a>
<p style="margin-top: 30px;">Best regards,<br><strong>The floinvite Team</strong></p>
</body></html>`;
            document.getElementById('html_body').value = promoTemplate;
            updatePreview();
        }

        function updatePreview() {
            const html = document.getElementById('html_body').value;
            const iframe = document.getElementById('email-preview');
            iframe.srcdoc = html;
        }

        function togglePreview() {
            const container = document.getElementById('preview-container');
            const btn = document.getElementById('preview-toggle');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                btn.textContent = 'Hide Preview';
                updatePreview();
            } else {
                container.style.display = 'none';
                btn.textContent = 'Show Preview';
            }
        }

        // Recipient mode toggles
        document.getElementById('recipient-subscribers').addEventListener('change', () => {
            document.getElementById('subscribers-input-section').style.display = 'block';
            document.getElementById('csv-input-section').style.display = 'none';
            document.getElementById('manual-input-section').style.display = 'none';
        });

        document.getElementById('recipient-csv').addEventListener('change', () => {
            document.getElementById('subscribers-input-section').style.display = 'none';
            document.getElementById('csv-input-section').style.display = 'block';
            document.getElementById('manual-input-section').style.display = 'none';
        });

        document.getElementById('recipient-manual').addEventListener('change', () => {
            document.getElementById('subscribers-input-section').style.display = 'none';
            document.getElementById('csv-input-section').style.display = 'none';
            document.getElementById('manual-input-section').style.display = 'block';
        });

        // Buttons
        document.getElementById('save-send-btn').addEventListener('click', () => {
            document.getElementById('form-action').value = 'save_send';
            document.getElementById('campaign-form').submit();
        });
    </script>
</body>
</html>
