<?php
/**
 * Email Queue Processor
 * Processes and sends queued emails with placeholder substitution
 *
 * Can be run in multiple ways:
 * 1. CLI: php /path/to/process-queue.php (requires config DB connection)
 * 2. HTTP: https://floinvite.com/floinvite-mail/api-process-queue.php (requires session auth)
 * 3. HTTP Cron: https://floinvite.com/floinvite-mail/api-process-queue.php?cron_token=SECRET (recommended)
 *
 * For Hostinger shared hosting, use HTTP cron trigger (option 3) because:
 * - CLI PHP may not have mysqli extension loaded
 * - HTTP guarantees the correct PHP environment
 */

require_once 'config.php';
require_once '../api/PHPMailerHelper.php';
require_once 'logo.php';
require_once 'queue.php';

// For CLI execution without session, allow processing
// For web execution, require auth (either session or cron token)
if (!function_exists('cli_set_process_title') && !defined('STDIN')) {
    // This is a web request, require auth
    $cron_token = $_GET['cron_token'] ?? $_POST['cron_token'] ?? '';
    $is_cron = !empty($cron_token) && $cron_token === CRON_SECRET;
    $is_session_auth = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

    if (!$is_cron && !$is_session_auth) {
        header('HTTP/1.1 403 Forbidden');
        exit('Unauthorized');
    }

    header('Content-Type: application/json; charset=utf-8');
}

$db = get_db();
$batch_size = 10;  // Process 10 at a time
$processing_stale_minutes = 15;

error_log("[Queue Processor] Starting batch processing");

try {
    $result = process_send_queue_batch($db, $batch_size, [
        'auto_add_all_active' => true,
        'processing_stale_minutes' => $processing_stale_minutes
    ]);

    update_campaign_stats_and_complete($db, $result['campaign_ids']);

    error_log("[Queue Processor] Batch complete: Processed={$result['processed']}, Sent={$result['sent']}, Failed={$result['failed']}");
} catch (Exception $e) {
    error_log("[Queue Processor] Fatal error: " . $e->getMessage());
    exit(1);
}

exit(0);
?>
