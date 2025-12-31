<?php
/**
 * Unsubscribe Handler
 * Public endpoint for unsubscribing from emails (no authentication required)
 */

require_once 'config.php';

$db = get_db();
$message = '';
$success = false;
$token = trim($_GET['token'] ?? $_POST['token'] ?? '');

// Handle unsubscribe request
if ($_SERVER['REQUEST_METHOD'] === 'POST' || !empty($token)) {
    if (!$token) {
        $message = 'Invalid unsubscribe request';
    } else {
        try {
            // Get subscriber from token
            $stmt = $db->prepare("
                SELECT subscriber_id FROM campaign_sends
                WHERE unsubscribe_token = ? LIMIT 1
            ");
            $stmt->execute([$token]);
            $record = $stmt->fetch();

            if (!$record) {
                $message = 'Invalid or expired unsubscribe link';
            } else {
                // Unsubscribe the subscriber
                $stmt = $db->prepare("
                    UPDATE subscribers
                    SET status = 'unsubscribed'
                    WHERE id = ?
                ");
                $stmt->execute([$record['subscriber_id']]);

                // Log analytics
                $stmt = $db->prepare("
                    SELECT campaign_id, id as send_id FROM campaign_sends
                    WHERE unsubscribe_token = ?
                ");
                $stmt->execute([$token]);
                $send = $stmt->fetch();

                if ($send) {
                    $stmt = $db->prepare("
                        INSERT INTO analytics (campaign_id, send_id, event_type, ip_address, user_agent)
                        VALUES (?, ?, 'unsubscribed', ?, ?)
                    ");
                    $stmt->execute([
                        $send['campaign_id'],
                        $send['send_id'],
                        $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                        $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
                    ]);
                }

                $message = 'You have been successfully unsubscribed';
                $success = true;

                log_activity('unsubscribe', ['subscriber_id' => $record['subscriber_id']]);
            }
        } catch (Exception $e) {
            $message = 'An error occurred. Please try again.';
        }
    }
}

// Check if API request
if (!empty($_GET['api'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message
    ]);
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe - Floinvite</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }

        .container {
            background: white;
            border-radius: 12px;
            padding: 3rem 2rem;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            text-align: center;
        }

        h1 {
            font-size: 1.875rem;
            margin-bottom: 1rem;
            color: #1f2937;
        }

        .message {
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-size: 1rem;
            line-height: 1.6;
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

        .form-group {
            margin: 1.5rem 0;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #1f2937;
        }

        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 1rem;
            font-family: inherit;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        button {
            padding: 0.75rem 1.5rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
        }

        button:hover {
            background: #5568d3;
        }

        .info-box {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            color: #6b7280;
            font-size: 0.875rem;
        }

        .footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.875rem;
        }

        .footer a {
            color: #667eea;
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        .icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .success .icon::before {
            content: '✓';
            color: #10b981;
        }

        .error .icon::before {
            content: '✕';
            color: #ef4444;
        }
    </style>
</head>
<body>
    <div class="container">
        <?php if ($success): ?>
            <h1>Unsubscribed</h1>
            <div class="message success">
                <div class="icon"></div>
                <p><?php echo htmlspecialchars($message); ?></p>
            </div>

            <div class="info-box">
                <p>We've removed your email address from our mailing list. You won't receive any more marketing emails from us.</p>
            </div>

            <p style="color: #6b7280; margin: 1rem 0;">If you change your mind or have any questions, please contact us.</p>
        <?php elseif (!empty($token)): ?>
            <h1>Unsubscribe</h1>
            <div class="message error">
                <p><?php echo htmlspecialchars($message); ?></p>
            </div>

            <div class="info-box">
                <p>The unsubscribe link may be invalid or expired. If you'd like to unsubscribe, please contact us directly.</p>
            </div>
        <?php else: ?>
            <h1>Manage Your Preferences</h1>

            <p style="color: #6b7280; margin-bottom: 1.5rem;">Enter your email address to unsubscribe from our mailing list.</p>

            <form method="POST">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required placeholder="your@email.com">
                </div>

                <button type="submit">Unsubscribe Me</button>
            </form>

            <div class="info-box">
                <strong>Privacy First:</strong> We respect your privacy. We'll remove your email immediately and won't send you any more emails. You can also request your data be permanently deleted.
            </div>
        <?php endif; ?>

        <div class="footer">
            <p>Floinvite Email Marketing System</p>
            <p><a href="<?php echo PUBLIC_URL; ?>">Back to Floinvite</a></p>
        </div>
    </div>
</body>
</html>
