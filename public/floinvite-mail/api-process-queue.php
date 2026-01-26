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
require_once 'queue.php';

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
    $processing_stale_minutes = 15;
    $result = process_send_queue_batch($db, $batch_size, [
        'auto_add_all_active' => true,
        'processing_stale_minutes' => $processing_stale_minutes
    ]);

    update_campaign_stats_and_complete($db, $result['campaign_ids']);

    respond(true, [
        'processed' => $result['processed'],
        'sent' => $result['sent'],
        'failed' => $result['failed']
    ], 'Queue processed successfully');

} catch (Exception $e) {
    respond(false, null, 'Error processing queue: ' . $e->getMessage());
}
?>
