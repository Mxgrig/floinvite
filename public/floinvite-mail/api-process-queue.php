<?php
/**
 * Queue Processor API Endpoint
 * Trigger the queue processor via HTTP request
 *
 * GET: https://floinvite.com/floinvite-mail/api-process-queue.php?key=YOUR_SECRET_KEY
 */

require_once 'config.php';
require_auth();  // Require admin authentication

header('Content-Type: application/json; charset=utf-8');

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
            c.send_method = 'queue'
            OR (c.send_method = 'scheduled' AND c.scheduled_at IS NOT NULL AND c.scheduled_at <= NOW())
        )
        ORDER BY q.created_at ASC
        LIMIT ?
    ");
    $stmt->execute([$batch_size]);
    $queued = $stmt->fetchAll();

    if (empty($queued)) {
        respond(true, ['processed' => 0, 'sent' => 0, 'failed' => 0], 'No queued emails to process');
    }

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
            } else {
                throw new Exception("mail() returned false");
            }
        } catch (Exception $e) {
            // Update queue status to failed
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

    respond(true, [
        'processed' => $processed,
        'sent' => $sent,
        'failed' => $failed
    ], 'Queue processed successfully');

} catch (Exception $e) {
    respond(false, null, 'Error processing queue: ' . $e->getMessage());
}
?>
