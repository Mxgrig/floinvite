<?php
/**
 * Queue Processor API Endpoint
 * Trigger the queue processor via HTTP request
 *
 * GET: https://floinvite.com/floinvite-mail/api-process-queue.php
 */

require_once 'config.php';
require_once '../api/PHPMailerHelper.php';
require_once 'logo.php';

header('Content-Type: application/json; charset=utf-8');

// Allow cron jobs to access this endpoint with a token (instead of session auth)
$cron_token = $_GET['cron_token'] ?? $_POST['cron_token'] ?? '';
$is_cron = !empty($cron_token) && $cron_token === CRON_SECRET;
$is_session_auth = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

if (!$is_cron && !$is_session_auth) {
    header('Location: login.php');
    exit;
}

try {
    $db = get_db();
    $batch_size = 10;
    $processed = 0;
    $sent = 0;
    $failed = 0;

    // Get queued emails to send (respect send_method scheduling)
    $stmt = $db->prepare("
        SELECT
            q.id as queue_id,
            q.send_id,
            q.campaign_id,
            q.attempts,
            q.max_attempts,
            s.email,
            s.name,
            s.company,
            s.tracking_id,
            s.unsubscribe_token,
            c.greeting,
            c.html_body,
            c.signature,
            c.from_name,
            c.subject,
            c.send_method,
            c.scheduled_at
        FROM send_queue q
        JOIN campaign_sends s ON q.send_id = s.id
        JOIN campaigns c ON q.campaign_id = c.id
        WHERE q.status = 'queued'
        AND q.attempts < q.max_attempts
        AND c.status IN ('sending', 'scheduled')
        AND (
            c.send_method IN ('queue', 'immediate')
            OR (c.send_method = 'scheduled' AND c.scheduled_at IS NOT NULL AND c.scheduled_at <= NOW())
        )
        ORDER BY q.created_at ASC
        LIMIT ?
    ");
    $stmt->bind_param("i", $batch_size);
    $stmt->execute();
    $queued = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (empty($queued)) {
        respond(true, ['processed' => 0, 'sent' => 0, 'failed' => 0], 'No queued emails to process');
    }

    foreach ($queued as $item) {
        try {
            // Mark as processing
            $update_stmt = $db->prepare("UPDATE send_queue SET status = 'processing' WHERE id = ?");
            $queue_id = $item['queue_id'];
            $update_stmt->bind_param("i", $queue_id);
            $update_stmt->execute();

            // Generate email HTML from greeting + body + signature
            $html_body = create_email_from_text(
                $item['greeting'] ?? '',
                $item['html_body'] ?? '',
                $item['signature'] ?? '',
                $item['name'] ?? $item['email'],
                $item['email'],
                $item['company'] ?? '',
                'Host Name',
                'host@floinvite.com',
                'default'
            );

            // Prepare sender info
            $from_email = SMTP_USER ?: 'admin@floinvite.com';
            $from_name = $item['from_name'] ?: 'floinvite';
            $subject = preg_replace('/[\r\n]+/', ' ', $item['subject']);

            // Send email using SMTP (PHPMailer)
            try {
                $mailer = new PHPMailerHelper();
                $result = $mailer->send([
                    'to' => $item['email'],
                    'subject' => $subject,
                    'body' => $html_body,
                    'isHtml' => true,
                    'fromEmail' => $from_email,
                    'fromName' => $from_name
                ]);

                if ($result['success']) {
                    // Update campaign_sends status
                    $update_send = $db->prepare("
                        UPDATE campaign_sends
                        SET status = 'sent', sent_at = NOW()
                        WHERE id = ?
                    ");
                    $send_id = $item['send_id'];
                    $update_send->bind_param("i", $send_id);
                    $update_send->execute();

                    // Update queue status
                    $update_queue = $db->prepare("
                        UPDATE send_queue
                        SET status = 'sent', attempts = attempts + 1
                        WHERE id = ?
                    ");
                    $queue_id = $item['queue_id'];
                    $update_queue->bind_param("i", $queue_id);
                    $update_queue->execute();

                    $sent++;
                } else {
                    throw new Exception($result['error'] ?? 'Failed to send email via SMTP');
                }
            } catch (Exception $e) {
                throw $e;
            }
        } catch (Exception $e) {
            $next_attempts = $item['attempts'] + 1;
            
            // Only mark as permanently failed if all retry attempts are exhausted
            if ($next_attempts >= $item['max_attempts']) {
                // All retries exhausted - mark permanently failed
                $update_stmt = $db->prepare("
                    UPDATE send_queue
                    SET status = 'failed', attempts = ?, error_message = ?
                    WHERE id = ?
                ");
                $error_msg = substr($e->getMessage(), 0, 500);
                $queue_id = $item['queue_id'];
                $update_stmt->bind_param("isi", $next_attempts, $error_msg, $queue_id);
                $update_stmt->execute();
                $failed++;
            } else {
                // Still have retries - keep as queued with incremented attempts
                $update_stmt = $db->prepare("
                    UPDATE send_queue
                    SET status = 'queued', attempts = ?, error_message = ?
                    WHERE id = ?
                ");
                $error_msg = substr($e->getMessage(), 0, 500);
                $queue_id = $item['queue_id'];
                $update_stmt->bind_param("isi", $next_attempts, $error_msg, $queue_id);
                $update_stmt->execute();
            }
        }

        $processed++;
    }

    respond(true, [
        'processed' => $processed,
        'sent' => $sent,
        'failed' => $failed
    ], 'Queue processed successfully');

} catch (Exception $e) {
    respond(false, null, 'Error processing queue: ' . $e->getMessage());
}
?>
