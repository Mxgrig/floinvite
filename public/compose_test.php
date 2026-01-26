<?php
// Mock database for testing
$_SESSION['admin_logged_in'] = true;
$campaign_id = $_GET['id'] ?? null;
$campaign = null;
$message = '';
$test_email = '';
$subscriber_count = 150;

// Mock campaign data if editing
if ($campaign_id) {
    $campaign = [
        'id' => $campaign_id,
        'name' => 'Test Campaign',
        'subject' => 'Test Subject',
        'from_name' => 'Test Sender',
        'greeting' => 'Hello',
        'html_body' => 'Test email body',
        'signature' => 'Best regards',
        'send_method' => 'queue',
        'scheduled_at' => '',
        'send_to_all_active' => 0
    ];
}

// Mock logo function
function get_logo_url() {
    return '';
}

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
                        value="<?php echo htmlspecialchars($campaign['from_name'] ?? ''); ?>"
                        placeholder="e.g., Marketing Team">
                </div>
            </div>

            <div class="form-group">
                <label for="subject">Subject Line *</label>
                <input type="text" id="subject" name="subject" required
                    value="<?php echo htmlspecialchars($campaign['subject'] ?? ''); ?>"
                    placeholder="e.g., Exciting New Offer Inside">
            </div>

            <div class="form-group">
                <label for="greeting">Greeting *</label>
                <input type="text" id="greeting" name="greeting" required
                    value="<?php echo htmlspecialchars($campaign['greeting'] ?? ''); ?>"
                    placeholder="e.g., Hello [Name]">
            </div>

            <div class="form-group">
                <label for="html_body">Email Body *</label>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <button type="button" class="template-btn" id="preview-toggle" onclick="togglePreview()" style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 0.875rem; cursor: pointer;">Show Preview</button>
                </div>
                <textarea id="html_body" name="html_body" required placeholder="Enter email body (plain text - no HTML needed)&#10;&#10;You can use line breaks to create paragraphs.&#10;Leave blank lines between paragraphs."><?php echo htmlspecialchars($campaign['html_body'] ?? ''); ?></textarea>
                <small style="color: #6b7280; margin-top: 0.5rem; display: block;">
                    Write in plain text. Line breaks will be automatically converted to HTML. No HTML knowledge required!
                </small>
            </div>

            <div class="form-group">
                <label for="signature">Email Signature</label>
                <textarea id="signature" name="signature" placeholder="e.g., Best regards,&#10;The Marketing Team" style="height: 100px;"><?php echo htmlspecialchars($campaign['signature'] ?? ''); ?></textarea>
            </div>

            <h2 style="margin-top: 2rem;">Preview</h2>
            <div id="preview-container" style="display: none; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; background: #f9fafb;">
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label for="preview-email">Test Email Address:</label>
                        <input type="email" id="preview-email" placeholder="test@example.com" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                    <div>
                        <label for="preview-subscriber-dropdown">Sample Subscriber:</label>
                        <select id="preview-subscriber-dropdown" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select a subscriber...</option>
                        </select>
                        <button type="button" id="preview-subscriber-refresh" style="height: 34px; align-self: flex-end; padding: 0 0.75rem; background: #e5e7eb; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Refresh list</button>
                        <div id="preview-subscriber-stats" style="font-size: 0.75rem; color: #6b7280; align-self: flex-end;"></div>
                    </div>
                </div>
                <iframe id="email-preview" style="width: 100%; height: 600px; border: 1px solid #e5e7eb; border-radius: 4px; background: white; display: block;"></iframe>
            </div>

            <h2 style="margin-top: 2rem;">Recipients</h2>
            <div class="form-group">
                <label>Send to:</label>
                <div style="display: flex; gap: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" name="send_to_all_active" value="1" <?php echo (!$campaign_id || $campaign['send_to_all_active'] == 1) ? 'checked' : ''; ?>>
                        All active subscribers (<?php echo $subscriber_count; ?>)
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" name="send_to_all_active" value="0" <?php echo ($campaign_id && $campaign['send_to_all_active'] == 0) ? 'checked' : ''; ?>>
                        Custom list
                    </label>
                </div>
            </div>

            <h2 style="margin-top: 2rem;">Send Method</h2>
            <div class="form-group">
                <label>Choose how to send:</label>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" id="send-queue" name="send_method" value="queue" <?php echo ($campaign['send_method'] ?? 'queue') === 'queue' ? 'checked' : ''; ?>>
                        Queue (recommended) - Process in background
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" id="send-immediate" name="send_method" value="immediate" <?php echo ($campaign['send_method'] ?? '') === 'immediate' ? 'checked' : ''; ?>>
                        Send Immediately
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" id="send-scheduled" name="send_method" value="scheduled" <?php echo ($campaign['send_method'] ?? '') === 'scheduled' ? 'checked' : ''; ?>>
                        Schedule for later
                    </label>
                    <div id="scheduled-input-section" style="display: none; margin-left: 1.5rem;">
                        <input type="datetime-local" id="scheduled_at" name="scheduled_at" value="<?php echo htmlspecialchars($campaign['scheduled_at'] ?? ''); ?>">
                    </div>
                </div>
            </div>

            <h2 style="margin-top: 2rem;">Actions</h2>
            <div style="display: flex; gap: 1rem;">
                <button type="submit" class="btn-primary">
                    <?php echo $campaign_id ? 'Update Campaign' : 'Save Draft'; ?>
                </button>
                <button type="button" class="btn-primary" id="save-send-btn" style="background: #10b981;">
                    Save &amp; Continue to Send
                </button>
                <button type="button" id="send-test-btn" class="btn-secondary">Send Test Email</button>
                <a href="index.php" class="btn-secondary" style="text-decoration: none; padding: 0.75rem 1.5rem; display: inline-block;">
                    Cancel
                </a>
            </div>
        </form>
    </div>

    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .mail-hero {
            background: linear-gradient(135deg, #4f46e5 0%, #667eea 100%);
            color: white;
            padding: 2rem;
            margin-bottom: 2rem;
        }

        .mail-hero h1 {
            font-size: 2rem;
            margin: 1rem 0;
        }

        .mail-nav {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }

        .mail-nav a {
            color: rgba(255,255,255,0.9);
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .mail-nav a.active {
            background: rgba(255,255,255,0.2);
            font-weight: 600;
        }

        .section {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
        }

        input[type="text"],
        input[type="email"],
        input[type="datetime-local"],
        select,
        textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-family: inherit;
            font-size: 1rem;
        }

        textarea {
            min-height: 200px;
            resize: vertical;
        }

        .btn-primary {
            background: #4f46e5;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
        }

        .btn-primary:hover {
            background: #4338ca;
        }

        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        }

        h2 {
            font-size: 1.5rem;
            color: #111827;
            margin: 0 0 1rem 0;
        }

        .back-link {
            color: white;
            text-decoration: none;
            font-size: 0.9rem;
        }

        .message {
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
        }

        .message.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }

        .message.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }
    </style>

    <script>
        function togglePreview() {
            document.getElementById('preview-container').style.display = 
                document.getElementById('preview-container').style.display === 'none' ? 'block' : 'none';
        }

        document.getElementById('save-send-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('form-action').value = 'save_send';
            document.getElementById('campaign-form').submit();
        });

        document.getElementById('send-test-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            const email = prompt('Enter test email address:');
            if (email) {
                alert('Test email would be sent to: ' + email);
            }
        });

        // Handle scheduled send UI
        const sendScheduledRadio = document.getElementById('send-scheduled');
        if (sendScheduledRadio) {
            sendScheduledRadio.addEventListener('change', () => {
                document.getElementById('scheduled-input-section').style.display = 'block';
            });
        }

        const sendQueueRadio = document.getElementById('send-queue');
        const sendImmediateRadio = document.getElementById('send-immediate');
        [sendQueueRadio, sendImmediateRadio].forEach(radio => {
            if (radio) {
                radio.addEventListener('change', () => {
                    document.getElementById('scheduled-input-section').style.display = 'none';
                });
            }
        });
    </script>
</body>
</html>
