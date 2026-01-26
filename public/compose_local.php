<?php
/**
 * Compose Campaign - LOCAL VERSION
 * Create and edit email campaigns (with mock database for local testing)
 */

require_once 'mock_config.php';

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
        $campaign = [
            'id' => $campaign_id,
            'name' => 'Sample Campaign',
            'subject' => 'Sample Subject',
            'from_name' => 'Marketing Team',
            'greeting' => 'Hello [Name]',
            'html_body' => 'This is a sample email body',
            'signature' => 'Best regards',
            'send_method' => 'queue',
            'scheduled_at' => '',
            'send_to_all_active' => 1
        ];
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
            $message = 'Error: Subject, From Name, and Email Body are required';
        } else {
            $message = 'Test email would be sent to: ' . htmlspecialchars($test_email);
        }
    } else {
        if (!$name || !$subject || !$from_name || !$html_body) {
            $message = 'Error: Campaign Name, Subject, From Name, and Email Body are required';
        } else {
            $message = $campaign_id ? 'Campaign updated successfully' : 'Campaign created successfully';
        }
    }

    if ($action === 'save_send') {
        $message = 'Campaign saved. Redirecting to send page...';
    }
}

// Get subscriber count
$subscriber_count = 0;
$result = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
$row = $result->fetch_assoc();
$subscriber_count = $row['count'] ?? 150;

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $campaign_id ? 'Edit Campaign' : 'Compose Campaign'; ?> - floinvite Mail</title>
    <link rel="stylesheet" href="floinvite-mail/styles.css">
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
            border-radius: 8px;
        }

        .mail-hero h1 {
            font-size: 2rem;
            margin: 1rem 0 0.5rem 0;
        }

        .mail-nav {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
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

        .back-link {
            color: rgba(255,255,255,0.9);
            text-decoration: none;
            font-size: 0.9rem;
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
            box-sizing: border-box;
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

        .preview-container {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            background: #f9fafb;
        }

        .btn-actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .template-btn {
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            cursor: pointer;
        }

        .template-btn:hover {
            background: #4338ca;
        }

        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .btn-actions {
                flex-direction: column;
            }
            
            .btn-primary, .btn-secondary {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <header class="mail-hero">
        <div class="container">
            <a href="#" class="back-link">← Back to Dashboard</a>
            <h1><?php echo $campaign_id ? 'Edit Campaign' : 'Create New Campaign'; ?></h1>
            <nav class="mail-nav">
                <a href="#">Dashboard</a>
                <a href="#">Subscribers</a>
                <a href="#" class="active">New Campaign</a>
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
                    <button type="button" class="template-btn" id="preview-toggle" onclick="togglePreview()">Show Preview</button>
                </div>
                <textarea id="html_body" name="html_body" required placeholder="Enter email body (plain text - no HTML needed)&#10;&#10;You can use line breaks to create paragraphs.&#10;Leave blank lines between paragraphs."><?php echo htmlspecialchars($campaign['html_body'] ?? ''); ?></textarea>
                <small style="color: #6b7280; margin-top: 0.5rem; display: block;">
                    Write in plain text. Line breaks will be automatically converted to HTML. No HTML knowledge required!
                </small>
            </div>

            <div class="form-group">
                <label for="signature">Email Signature</label>
                <textarea id="signature" name="signature" placeholder="e.g., Best regards,&#10;The Marketing Team"><?php echo htmlspecialchars($campaign['signature'] ?? ''); ?></textarea>
            </div>

            <div id="preview-container" class="preview-container" style="display: none;">
                <h3>Email Preview</h3>
                <p>This is how your email will appear to recipients.</p>
                <div style="background: white; border: 1px solid #d1d5db; padding: 1rem; border-radius: 4px;">
                    <strong>From:</strong> <?php echo htmlspecialchars($campaign['from_name'] ?? 'Sender Name'); ?><br>
                    <strong>Subject:</strong> <?php echo htmlspecialchars($campaign['subject'] ?? 'Email Subject'); ?><br><br>
                    <strong>Body:</strong><br>
                    <?php echo nl2br(htmlspecialchars($campaign['html_body'] ?? 'Email body will appear here')); ?>
                    <hr>
                    <?php echo nl2br(htmlspecialchars($campaign['signature'] ?? '')); ?>
                </div>
            </div>

            <h2 style="margin-top: 2rem;">Recipients</h2>
            <div class="form-group">
                <label>Send to:</label>
                <div style="display: flex; gap: 2rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" name="send_to_all_active" value="1" <?php echo (!$campaign_id || ($campaign['send_to_all_active'] ?? 1) == 1) ? 'checked' : ''; ?>>
                        All active subscribers (<?php echo $subscriber_count; ?>)
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" name="send_to_all_active" value="0" <?php echo ($campaign_id && ($campaign['send_to_all_active'] ?? 0) == 0) ? 'checked' : ''; ?>>
                        Custom list
                    </label>
                </div>
            </div>

            <h2 style="margin-top: 2rem;">Send Method</h2>
            <div class="form-group">
                <label>Choose how to send:</label>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" id="send-queue" name="send_method" value="queue" <?php echo (($campaign['send_method'] ?? 'queue') === 'queue') ? 'checked' : ''; ?>>
                        <span>
                            <strong>Queue (recommended)</strong> - Process in background
                        </span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" id="send-immediate" name="send_method" value="immediate" <?php echo (($campaign['send_method'] ?? '') === 'immediate') ? 'checked' : ''; ?>>
                        <span>
                            <strong>Send Immediately</strong> - Send now
                        </span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="radio" id="send-scheduled" name="send_method" value="scheduled" <?php echo (($campaign['send_method'] ?? '') === 'scheduled') ? 'checked' : ''; ?>>
                        <span>
                            <strong>Schedule for later</strong>
                        </span>
                    </label>
                    <div id="scheduled-input-section" style="display: none; margin-left: 1.5rem;">
                        <label for="scheduled_at">Send Date & Time:</label>
                        <input type="datetime-local" id="scheduled_at" name="scheduled_at" value="<?php echo htmlspecialchars($campaign['scheduled_at'] ?? ''); ?>">
                    </div>
                </div>
            </div>

            <h2 style="margin-top: 2rem;">Actions</h2>
            <div class="btn-actions">
                <button type="submit" class="btn-primary">
                    <?php echo $campaign_id ? 'Update Campaign' : 'Save Draft'; ?>
                </button>
                <button type="button" class="btn-primary" id="save-send-btn" style="background: #10b981;">
                    Save &amp; Continue to Send
                </button>
                <button type="button" id="send-test-btn" class="btn-secondary">Send Test Email</button>
                <a href="#" class="btn-secondary" style="text-decoration: none; padding: 0.75rem 1.5rem; display: inline-block;">
                    Cancel
                </a>
            </div>
        </form>
    </div>

    <script>
        function togglePreview() {
            const container = document.getElementById('preview-container');
            const btn = document.getElementById('preview-toggle');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                btn.textContent = 'Hide Preview';
            } else {
                container.style.display = 'none';
                btn.textContent = 'Show Preview';
            }
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
        const sendQueueRadio = document.getElementById('send-queue');
        const sendImmediateRadio = document.getElementById('send-immediate');

        function updateSendMethodUI() {
            const scheduledSection = document.getElementById('scheduled-input-section');
            if (sendScheduledRadio.checked) {
                scheduledSection.style.display = 'block';
                document.getElementById('scheduled_at').required = true;
            } else {
                scheduledSection.style.display = 'none';
                document.getElementById('scheduled_at').required = false;
            }
        }

        [sendScheduledRadio, sendQueueRadio, sendImmediateRadio].forEach(radio => {
            if (radio) {
                radio.addEventListener('change', updateSendMethodUI);
            }
        });

        updateSendMethodUI();
    </script>
</body>
</html>
