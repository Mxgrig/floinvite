<?php
/**
 * Email Queue Processor
 * Processes and sends queued emails with placeholder substitution
 *
 * Run manually: php /path/to/process-queue.php
 * Or via cron: */5 * * * * cd /path/to && php process-queue.php
 */

require_once 'config.php';
require_once '../api/PHPMailerHelper.php';

$db = get_db();
$batch_size = 10;  // Process 10 at a time
$processed = 0;
$sent = 0;
$failed = 0;

error_log("[Queue Processor] Starting batch processing");

try {
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
        error_log("[Queue Processor] No queued emails to process");
        exit(0);
    }

    error_log("[Queue Processor] Found " . count($queued) . " emails to send");

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

            error_log("[Queue Processor] Sending to {$item['email']} (name: {$item['name']}, company: {$item['company']})");

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
                    error_log("[Queue Processor] Sent to {$item['email']}");
                } else {
                    throw new Exception($result['error'] ?? 'Failed to send email via SMTP');
                }
            } catch (Exception $e) {
                throw $e;
            }
        } catch (Exception $e) {
            error_log("[Queue Processor] Failed to send to {$item['email']}: " . $e->getMessage());

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

    // Update campaign statistics
    $stmt = $db->prepare("
        UPDATE campaigns
        SET
            sent_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = ? AND status = 'sent'),
            failed_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = ? AND status = 'failed')
        WHERE id = ?
    ");

    error_log("[Queue Processor] Batch complete: Processed={$processed}, Sent={$sent}, Failed={$failed}");

} catch (Exception $e) {
    error_log("[Queue Processor] Fatal error: " . $e->getMessage());
    exit(1);
}

exit(0);
?>
