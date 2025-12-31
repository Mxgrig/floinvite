<?php
/**
 * Compose Campaign
 * Create and edit email campaigns
 */

require_once 'config.php';
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
            max-width: 1000px;
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

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #1f2937;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-family: inherit;
            font-size: 1rem;
        }

        .form-group textarea {
            resize: vertical;
            min-height: 300px;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .button-group {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
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

        .btn-primary:hover {
            background: #4338ca;
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
            background: #e5e7eb;
        }

        .message {
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
        }

        .message.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #6ee7b7;
        }

        .message.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }

        .info-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1rem;
            color: #1e40af;
            font-size: 0.875rem;
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

        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat {
            background: #f9fafb;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }

        .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
        }

        .back-link {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }

        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <a href="index.php" class="back-link">← Back to Dashboard</a>
            <h1><?php echo $campaign_id ? 'Edit Campaign' : 'Create New Campaign'; ?></h1>
            <nav class="nav">
                <a href="index.php">Dashboard</a>
                <a href="subscribers.php">Subscribers</a>
                <a href="compose.php" style="color: #4f46e5; font-weight: 700;">New Campaign</a>
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
                <div style="margin-bottom: 0.5rem;">
                    <button type="button" class="template-btn" onclick="insertTemplate()">Insert Default Template</button>
                    <button type="button" class="template-btn" onclick="insertPromo()">Insert Promo Template</button>
                </div>
                <textarea id="html_body" name="html_body" required placeholder="Enter HTML email content..."><?php echo htmlspecialchars($campaign['html_body'] ?? ''); ?></textarea>
                <small style="color: #6b7280; margin-top: 0.5rem; display: block;">
                    Support variables: {name}, {email}, {company}. Use tracking pixel: &lt;img src="<?php echo BASE_URL; ?>/track.php?id={tracking_id}" width="1" height="1"&gt;
                </small>
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
                    <a href="send.php?id=<?php echo $campaign_id; ?>" class="btn-primary" style="text-decoration: none; padding: 0.75rem 1.5rem; display: inline-block;">
                        Send Campaign
                    </a>
                <?php endif; ?>
                <a href="index.php" class="btn-secondary" style="text-decoration: none; padding: 0.75rem 1.5rem; display: inline-block;">
                    Cancel
                </a>
            </div>
        </form>
    </div>

    <script>
        function insertTemplate() {
            const template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: white; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hello {name}</h1>
        </div>
        <div class="content">
            <p>We have an exciting update for you!</p>
            <p>Your content goes here...</p>
        </div>
        <div class="footer">
            <p>Floinvite | Professional Visitor Management</p>
            <p><a href="${BASE_URL}/unsubscribe.php?token={unsubscribe_token}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`;
            document.getElementById('html_body').value = template;
        }

        function insertPromo() {
            const template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .promo { background: #dc2626; color: white; padding: 40px; text-align: center; }
        .promo h1 { font-size: 2em; margin: 0 0 10px 0; }
        .cta { display: inline-block; background: white; color: #dc2626; padding: 12px 30px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="promo">
            <h1>Special Offer Just For You!</h1>
            <p>Get 20% off on your next visit</p>
            <a href="#" class="cta">Claim Offer</a>
        </div>
        <div style="padding: 20px; background: white; margin-top: 20px;">
            <p>Hi {name},</p>
            <p>We have a special offer just for our valued customers like you.</p>
            <p>Thank you for choosing Floinvite!</p>
        </div>
    </div>
</body>
</html>`;
            document.getElementById('html_body').value = template;
        }
    </script>
</body>
</html>
