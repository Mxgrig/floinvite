<?php
/**
 * Email Queue Processor
 * Processes and sends queued emails with placeholder substitution
 *
 * Run manually: php /path/to/process-queue.php
 * Or via cron: */5 * * * * cd /path/to && php process-queue.php
 */

require_once 'config.php';

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
    $stmt->execute([$batch_size]);
    $queued = $stmt->fetchAll();

    if (empty($queued)) {
        error_log("[Queue Processor] No queued emails to process");
        exit(0);
    }

    error_log("[Queue Processor] Found " . count($queued) . " emails to send");

    foreach ($queued as $item) {
        try {
            // Mark as processing
            $update_stmt = $db->prepare("UPDATE send_queue SET status = 'processing' WHERE id = ?");
            $update_stmt->execute([$item['queue_id']]);

            // Generate email HTML from greeting + body + signature
            $html_body = create_email_from_text(
                $item['greeting'] ?? '',
                $item['html_body'] ?? '',
                $item['signature'] ?? '',
                $item['name'] ?? $item['email'],
                $item['email'],
                $item['company'] ?? '',
                'Host Name',  // Will be replaced by customer data if available
                'host@floinvite.com',
                'default'  // Template type (default for backward compatibility)
            );

            // Prepare headers
            $from_email = SMTP_USER ?: 'admin@floinvite.com';
            $from_name = $item['from_name'] ?: 'floinvite';
            $subject = preg_replace('/[\r\n]+/', ' ', $item['subject']);

            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-type: text/html; charset=UTF-8\r\n";
            $headers .= "From: {$from_name} <{$from_email}>\r\n";
            $headers .= "Reply-To: {$from_email}\r\n";

            error_log("[Queue Processor] Sending to {$item['email']} (name: {$item['name']}, company: {$item['company']})");

            // Send email
            if (@mail($item['email'], $subject, $html_body, $headers)) {
                // Update campaign_sends status
                $update_send = $db->prepare("
                    UPDATE campaign_sends
                    SET status = 'sent', sent_at = NOW()
                    WHERE id = ?
                ");
                $update_send->execute([$item['send_id']]);

                // Update queue status
                $update_queue = $db->prepare("
                    UPDATE send_queue
                    SET status = 'sent', attempts = attempts + 1
                    WHERE id = ?
                ");
                $update_queue->execute([$item['queue_id']]);

                $sent++;
                error_log("[Queue Processor] Sent to {$item['email']}");
            } else {
                throw new Exception("mail() returned false");
            }
        } catch (Exception $e) {
            error_log("[Queue Processor] Failed to send to {$item['email']}: " . $e->getMessage());

            // Update attempts
            $update_stmt = $db->prepare("
                UPDATE send_queue
                SET status = 'failed', attempts = attempts + 1, error_message = ?
                WHERE id = ?
            ");
            $update_stmt->execute([$e->getMessage(), $item['queue_id']]);

            $failed++;
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
