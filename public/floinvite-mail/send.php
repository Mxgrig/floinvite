<?php
/**
 * Send Campaign
 * Handles batch sending with rate limiting
 */

require_once 'config.php';
require_once 'logo.php';
require_once '../api/PHPMailerHelper.php';
require_once 'queue.php';
require_auth();

$db = get_db();
$campaign_id = intval($_GET['id'] ?? 0);

if (!$campaign_id) {
    handle_error('Campaign ID required', 400);
}

// Get campaign
$stmt = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
$stmt->bind_param("i", $campaign_id);
$stmt->execute();
$campaign = $stmt->get_result()->fetch_assoc();

if (!$campaign) {
    handle_error('Campaign not found', 404);
}

// Auto-correct campaign status: if marked completed but has pending/failed emails, revert to sending
if ($campaign['status'] === 'completed') {
    $pending_check = $db->prepare("SELECT COUNT(*) as count FROM campaign_sends WHERE campaign_id = ? AND status IN ('pending', 'failed')");
    $pending_check->bind_param("i", $campaign_id);
    $pending_check->execute();
    $pending_count = $pending_check->get_result()->fetch_assoc()['count'] ?? 0;
    
    if ($pending_count > 0) {
        // Status is wrong - update it back to sending
        $fix_status = $db->prepare("UPDATE campaigns SET status = 'sending', completed_at = NULL WHERE id = ?");
        $fix_status->bind_param("i", $campaign_id);
        $fix_status->execute();
        $campaign['status'] = 'sending';  // Refresh local copy
    }
}

function parse_custom_emails($raw) {
    $invalid = 0;
    $invalid_samples = [];
    $emails = [];

    $normalized = preg_replace('/[\\s,;]+/', "\n", $raw);
    $parts = preg_split('/\\s+/', $normalized, -1, PREG_SPLIT_NO_EMPTY);

    foreach ($parts as $email) {
        $email = strtolower(trim($email));
        if ($email === '') {
            continue;
        }
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emails[$email] = true;
        } else {
            $invalid++;
            if (count($invalid_samples) < 20) {
                $invalid_samples[] = $email;
            }
        }
    }

    return [
        'emails' => array_keys($emails),
        'invalid' => $invalid,
        'invalid_samples' => $invalid_samples
    ];
}

function fetch_subscriber_statuses($db, $emails) {
    $found = [];
    if (empty($emails)) {
        return $found;
    }

    foreach (array_chunk($emails, 200) as $chunk) {
        $placeholders = implode(',', array_fill(0, count($chunk), '?'));
        $stmt = $db->prepare("SELECT id, email, status FROM subscribers WHERE email IN ($placeholders)");
        $types = str_repeat('s', count($chunk));
        $stmt->bind_param($types, ...$chunk);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $found[strtolower($row['email'])] = [
                'id' => $row['id'],
                'status' => $row['status']
            ];
        }
    }

    return $found;
}


/**
 * Get count of all active subscribers
 */
function get_all_active_count($db) {
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    return (int)($result['count'] ?? 0);
}

/**
 * Get count of unreached subscribers (never targeted by any campaign)
 */
function get_unreached_count($db) {
    $stmt = $db->prepare("
        SELECT COUNT(*) as count FROM subscribers
        WHERE status = 'active'
        AND id NOT IN (SELECT DISTINCT subscriber_id FROM campaign_sends)
    ");
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    return (int)($result['count'] ?? 0);
}

/**
 * Get count of reached subscribers (targeted by at least one campaign)
 */
function get_reached_count($db) {
    $stmt = $db->prepare("
        SELECT COUNT(*) as count FROM subscribers
        WHERE status = 'active'
        AND id IN (SELECT DISTINCT subscriber_id FROM campaign_sends)
    ");
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    return (int)($result['count'] ?? 0);
}

/**
 * Fetch subscribers for a given segment
 */
function get_segment_subscribers($db, $segment) {
    if ($segment === 'unreached') {
        $stmt = $db->prepare("
            SELECT id, email, name, company FROM subscribers
            WHERE status = 'active'
            AND id NOT IN (SELECT DISTINCT subscriber_id FROM campaign_sends)
            ORDER BY id
        ");
    } elseif ($segment === 'reached') {
        $stmt = $db->prepare("
            SELECT id, email, name, company FROM subscribers
            WHERE status = 'active'
            AND id IN (SELECT DISTINCT subscriber_id FROM campaign_sends)
            ORDER BY id
        ");
    } else {
        // Default to all active
        $stmt = $db->prepare("
            SELECT id, email, name, company FROM subscribers
            WHERE status = 'active'
            ORDER BY id
        ");
    }

    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function get_csrf_token() {
    $now = time();
    $token = $_SESSION['csrf_token'] ?? null;
    $created_at = $_SESSION['csrf_token_created_at'] ?? 0;
    $expired = !$created_at || ($now - $created_at) > 3600;

    if (!is_string($token) || strlen($token) !== 32 || !ctype_xdigit($token) || $expired) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
        $_SESSION['csrf_token_created_at'] = $now;
    }

    return $_SESSION['csrf_token'];
}

function verify_csrf_token($token) {
    $session_token = $_SESSION['csrf_token'] ?? null;
    $created_at = $_SESSION['csrf_token_created_at'] ?? 0;

    if (!is_string($token) || !is_string($session_token)) {
        return false;
    }
    if (strlen($token) !== 32 || !ctype_xdigit($token)) {
        return false;
    }
    if (strlen($session_token) !== 32 || !ctype_xdigit($session_token)) {
        return false;
    }
    if (!$created_at || (time() - $created_at) > 3600) {
        return false;
    }
    return hash_equals($session_token, $token);
}

function register_csrf_failure() {
    $window = 60;
    $max_failures = 10;
    $now = time();
    $state = $_SESSION['csrf_failures'] ?? null;

    if (!is_array($state) || !isset($state['window_start'], $state['count'])) {
        $state = ['window_start' => $now, 'count' => 0];
    }

    if ($now - $state['window_start'] > $window) {
        $state = ['window_start' => $now, 'count' => 0];
    }

    $state['count']++;
    $_SESSION['csrf_failures'] = $state;

    return $state['count'] <= $max_failures;
}

function clear_csrf_failures() {
    unset($_SESSION['csrf_failures']);
}

function sanitize_log_value($value) {
    return preg_replace('/[\\x00-\\x1F\\x7F]+/', ' ', (string) $value);
}

function log_campaign_error($action, $campaign_id, $error) {
    $safe_action = sanitize_log_value($action);
    $safe_error = sanitize_log_value($error);
    error_log("CAMPAIGN_{$safe_action}_ERROR: campaign_id=" . (int) $campaign_id . ", error={$safe_error}");
}

function validate_campaign_action($action, $campaign) {
    $status = $campaign['status'] ?? null;

    if (in_array($action, ['preview', 'start'], true) && $status !== 'draft') {
        return ['ok' => false, 'message' => 'Campaign is not in a sendable draft state.'];
    }

    if ($action === 'cancel' && !in_array($status, ['sending', 'scheduled'], true)) {
        return ['ok' => false, 'message' => 'Campaign is not in a cancellable state.'];
    }

    if ($action === 'resume' && $status !== 'paused') {
        return ['ok' => false, 'message' => 'Campaign is not paused.'];
    }

    if ($action === 'send_now' && !in_array($status, ['sending', 'paused'], true)) {
        return ['ok' => false, 'message' => 'Campaign is not in a sendable state.'];
    }

    return ['ok' => true];
}

function validate_action_request($action, $campaign, $csrf_token) {
    $campaign_validation = validate_campaign_action($action, $campaign);
    if (!$campaign_validation['ok']) {
        return $campaign_validation;
    }

    if (!verify_csrf_token($csrf_token)) {
        $allowed = register_csrf_failure();
        $message = $allowed
            ? 'Invalid session token. Please reload and try again.'
            : 'Too many invalid requests. Please wait a minute and try again.';
        return ['ok' => false, 'message' => $message];
    }

    clear_csrf_failures();
    return ['ok' => true];
}

function requeue_cancelled_sends($db, $campaign_id) {
    // Update failed queue entries back to 'queued' status
    $update_queue_stmt = $db->prepare("
        UPDATE send_queue
        SET status = 'queued', attempts = 0, error_message = NULL
        WHERE campaign_id = ?
          AND status = 'failed'
          AND error_message = 'Cancelled by admin'
    ");
    $update_queue_stmt->bind_param("i", $campaign_id);
    $update_queue_stmt->execute();
    $requeued = $update_queue_stmt->affected_rows;

    if ($requeued > 0) {
        // Update campaign_sends records back to 'pending'
        $update_sends_stmt = $db->prepare("
            UPDATE campaign_sends
            SET status = 'pending'
            WHERE campaign_id = ?
              AND status = 'failed'
              AND id IN (
                  SELECT DISTINCT send_id FROM send_queue
                  WHERE campaign_id = ?
                    AND status = 'queued'
                    AND error_message IS NULL
              )
        ");
        $update_sends_stmt->bind_param("ii", $campaign_id, $campaign_id);
        $update_sends_stmt->execute();
    }

    return $requeued;
}

function ensure_send_queue_exists($db, $campaign_id) {
    // Requeue failed send_queue records that correspond to pending campaign_sends
    // This handles cases where emails were cancelled/failed but campaign_sends are still pending
    $requeue_stmt = $db->prepare("
        UPDATE send_queue
        SET status = 'queued', attempts = 0, error_message = NULL
        WHERE campaign_id = ?
          AND status = 'failed'
          AND send_id IN (
              SELECT id FROM campaign_sends
              WHERE campaign_id = ?
                AND status IN ('pending', 'failed')
          )
    ");
    $requeue_stmt->bind_param("ii", $campaign_id, $campaign_id);
    $requeue_stmt->execute();
    $requeued = $requeue_stmt->affected_rows;

    // Create missing send_queue records for pending campaign_sends
    // This fixes cases where send_queue records weren't created during campaign start
    $insert_stmt = $db->prepare("
        INSERT INTO send_queue (send_id, campaign_id, email, status)
        SELECT id, campaign_id, email, 'queued'
        FROM campaign_sends
        WHERE campaign_id = ?
          AND status IN ('pending', 'failed')
          AND id NOT IN (
              SELECT DISTINCT send_id FROM send_queue
              WHERE campaign_id = ?
          )
    ");
    $insert_stmt->bind_param("ii", $campaign_id, $campaign_id);
    $insert_stmt->execute();
    $inserted = $insert_stmt->affected_rows;

    // Remove duplicate queued records, keeping only the oldest one per send_id
    // This can happen if the INSERT runs multiple times or records were recreated
    $dedupe_stmt = $db->prepare("
        DELETE sq FROM send_queue sq
        INNER JOIN (
            SELECT send_id, MIN(id) as keep_id
            FROM send_queue
            WHERE campaign_id = ? AND status = 'queued'
            GROUP BY send_id
            HAVING COUNT(*) > 1
        ) keep ON sq.send_id = keep.send_id AND sq.id > keep.keep_id
        WHERE sq.campaign_id = ?
    ");
    $dedupe_stmt->bind_param("ii", $campaign_id, $campaign_id);
    $dedupe_stmt->execute();

    return $requeued + $inserted;
}

function process_campaign_queue($db, $campaign_id, $limit) {
    $limit = intval($limit);
    $send_to_all_active = false;
    $campaign_stmt = $db->prepare("SELECT send_to_all_active FROM campaigns WHERE id = ? LIMIT 1");
    $campaign_stmt->bind_param("i", $campaign_id);
    $campaign_stmt->execute();
    $campaign_row = $campaign_stmt->get_result()->fetch_assoc();
    if ($campaign_row) {
        $send_to_all_active = !empty($campaign_row['send_to_all_active']);
    }
    $result = process_send_queue_batch($db, $limit, [
        'auto_add_all_active' => $send_to_all_active,
        'processing_stale_minutes' => 15,
        'campaign_id' => $campaign_id
    ]);

    update_campaign_stats_and_complete($db, $result['campaign_ids']);

    return [
        'processed' => $result['processed'],
        'sent' => $result['sent'],
        'failed' => $result['failed']
    ];
}

function wants_json_response() {
    if (!empty($_GET['api'])) {
        return true;
    }
    $requested_with = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    if (strtolower($requested_with) === 'xmlhttprequest') {
        return true;
    }
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    return stripos($accept, 'application/json') !== false;
}

function respond_or_redirect($success, $data, $message, $campaign_id) {
    if (wants_json_response()) {
        respond($success, $data, $message);
    }

    $_SESSION['send_notice'] = [
        'type' => $success ? 'success' : 'error',
        'message' => $message
    ];
    header('Location: index.php');
    exit;
}

$preview = null;
$preview_error = null;
$prefill = $_SESSION['send_prefill'][$campaign_id] ?? null;
$prefill_token = $_GET['prefill'] ?? null;
if ($prefill && (!is_string($prefill_token) || !hash_equals($prefill['token'] ?? '', $prefill_token))) {
    $prefill = null;
}
$prefill_mode = $prefill['mode'] ?? null;
$prefill_custom = $prefill['custom_emails'] ?? '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $csrf_token = $_POST['csrf_token'] ?? '';

    $send_segment = $_POST['send_segment'] ?? 'all';

    $validation = validate_action_request($action, $campaign, $csrf_token);
    if (!$validation['ok']) {
        if ($action === 'preview') {
            $preview_error = $validation['message'];
        } else {
            respond_or_redirect(false, null, $validation['message'], $campaign_id);
        }
    }

    if ($action === 'preview' && $validation['ok']) {
        // Get subscriber counts for selected segment
        $segment = $_POST['send_segment'] ?? 'all';

        if ($segment === 'unreached') {
            $count = get_unreached_count($db);
        } elseif ($segment === 'reached') {
            $count = get_reached_count($db);
        } else {
            $count = get_all_active_count($db);
        }

        $preview = [
            'mode' => 'segment',
            'segment' => $segment,
            'counts' => [
                'active' => $count
            ]
        ];
    }

    if ($action === 'cancel') {
        try {
            $db->begin_transaction();

            $update_campaign = $db->prepare("
                UPDATE campaigns
                SET status = 'paused'
                WHERE id = ? AND status IN ('sending', 'scheduled')
            ");
            $cid = $campaign_id;
            $update_campaign->bind_param("i", $cid);
            $update_campaign->execute();

            $cancel_queue = $db->prepare("
                UPDATE send_queue
                SET status = 'failed', error_message = 'Cancelled by admin'
                WHERE campaign_id = ? AND status = 'queued'
            ");
            $cid = $campaign_id;
            $cancel_queue->bind_param("i", $cid);
            $cancel_queue->execute();
            $cancelled = $cancel_queue->affected_rows;

            $cancel_sends = $db->prepare("
                UPDATE campaign_sends
                SET status = 'failed'
                WHERE campaign_id = ?
                AND status = 'pending'
                AND id IN (
                    SELECT send_id FROM send_queue
                    WHERE campaign_id = ? AND status = 'failed'
                )
            ");
            $cid1 = $campaign_id;
            $cid2 = $campaign_id;
            $cancel_sends->bind_param("ii", $cid1, $cid2);
            $cancel_sends->execute();

            $db->commit();

            $message = "Campaign paused. {$cancelled} queued emails cancelled.";
            respond_or_redirect(true, ['cancelled' => $cancelled], $message, $campaign_id);
        } catch (Exception $e) {
            $db->rollback();
            log_campaign_error('cancel', $campaign_id, $e->getMessage());
            respond_or_redirect(false, null, 'Error cancelling campaign: ' . $e->getMessage(), $campaign_id);
        }
    }

    if ($action === 'resume') {
        try {
            $db->begin_transaction();

            $send_method = $campaign['send_method'] ?? 'queue';
            $scheduled_at = $campaign['scheduled_at'] ?? null;
            $resume_status = ($send_method === 'scheduled' && $scheduled_at && strtotime($scheduled_at) > time())
                ? 'scheduled'
                : 'sending';

            $update_campaign = $db->prepare("
                UPDATE campaigns
                SET status = ?
                WHERE id = ? AND status = 'paused'
            ");
            $cid = $campaign_id;
            $update_campaign->bind_param("si", $resume_status, $cid);
            $update_campaign->execute();

            $requeued = requeue_cancelled_sends($db, $campaign_id);
            $db->commit();

            $_SESSION['send_notice'] = [
                'type' => 'success',
                'message' => "Campaign resumed. {$requeued} emails re-queued for sending."
            ];
            header("Location: send.php?id={$campaign_id}");
            exit;
        } catch (Exception $e) {
            $db->rollback();
            log_campaign_error('resume', $campaign_id, $e->getMessage());
            $_SESSION['send_notice'] = [
                'type' => 'error',
                'message' => 'Error resuming campaign: ' . $e->getMessage()
            ];
            header("Location: send.php?id={$campaign_id}");
            exit;
        }
    }

    if ($action === 'retry_failed') {
        try {
            $db->begin_transaction();

            // Requeue all failed emails for this campaign
            $update_queue = $db->prepare("
                UPDATE send_queue
                SET status = 'queued', attempts = 0, error_message = NULL
                WHERE campaign_id = ? AND status = 'failed'
            ");
            $cid = $campaign_id;
            $update_queue->bind_param("i", $cid);
            $update_queue->execute();
            $requeued = $update_queue->affected_rows;

            if ($requeued > 0) {
                // Update campaign_sends back to pending
                $update_sends = $db->prepare("
                    UPDATE campaign_sends
                    SET status = 'pending'
                    WHERE campaign_id = ? AND status = 'failed'
                ");
                $cid = $campaign_id;
                $update_sends->bind_param("i", $cid);
                $update_sends->execute();
            }

            $db->commit();

            $_SESSION['send_notice'] = [
                'type' => 'success',
                'message' => "Re-queued $requeued failed emails for retry."
            ];
            header("Location: send.php?id={$campaign_id}");
            exit;
        } catch (Exception $e) {
            $db->rollback();
            log_campaign_error('retry_failed', $campaign_id, $e->getMessage());
            $_SESSION['send_notice'] = [
                'type' => 'error',
                'message' => 'Error retrying failed emails: ' . $e->getMessage()
            ];
            header("Location: send.php?id={$campaign_id}");
            exit;
        }
    }

    if ($action === 'send_now') {
        try {
            $db->begin_transaction();

            if ($campaign['status'] === 'paused') {
                $update_campaign = $db->prepare("
                    UPDATE campaigns
                    SET status = 'sending', send_method = 'immediate', scheduled_at = NULL
                    WHERE id = ? AND status = 'paused'
                ");
                $cid = $campaign_id;
                $update_campaign->bind_param("i", $cid);
                $update_campaign->execute();
                $requeued = requeue_cancelled_sends($db, $campaign_id);
            } else {
                $update_campaign = $db->prepare("
                    UPDATE campaigns
                    SET send_method = 'immediate', scheduled_at = NULL
                    WHERE id = ?
                ");
                $cid = $campaign_id;
                $update_campaign->bind_param("i", $cid);
                $update_campaign->execute();
                $requeued = 0;
            }

            // Auto-add missing active subscribers if send_to_all_active flag is enabled
            $added_missing = add_missing_all_active_subscribers($db, $campaign_id, $campaign);

            // Process a batch immediately
            // Ensure send_queue records exist for all pending emails
            $created = ensure_send_queue_exists($db, $campaign_id);
            $result = process_campaign_queue($db, $campaign_id, BATCH_SIZE);
            $db->commit();

            // Check if there are any remaining outstanding emails
            $outstanding_stmt = $db->prepare("
                SELECT COUNT(*) as count FROM campaign_sends
                WHERE campaign_id = ? AND status IN ('pending', 'failed')
            ");
            $cid = $campaign_id;
            $outstanding_stmt->bind_param("i", $cid);
            $outstanding_stmt->execute();
            $outstanding_count = $outstanding_stmt->get_result()->fetch_assoc()['count'] ?? 0;

            // If all emails are done (no pending), mark campaign as completed
            if ($outstanding_count === 0) {
                $complete_stmt = $db->prepare("
                    UPDATE campaigns
                    SET status = 'completed', completed_at = NOW()
                    WHERE id = ? AND status = 'sending'
                ");
                $cid = $campaign_id;
                $complete_stmt->bind_param("i", $cid);
                $complete_stmt->execute();
            }

            $_SESSION['send_notice'] = [
                'type' => 'success',
                'message' => "Batch processed: {$result['sent']} sent, {$result['failed']} failed."
            ];

            // If no outstanding emails remain, redirect to dashboard
            // Otherwise, stay on send page with updated button state
            if ($outstanding_count === 0) {
                header('Location: index.php');
            } else {
                header("Location: send.php?id={$campaign_id}");
            }
            exit;
        } catch (Exception $e) {
            $db->rollBack();
            log_campaign_error('send_now', $campaign_id, $e->getMessage());
            $_SESSION['send_notice'] = [
                'type' => 'error',
                'message' => 'Error processing send: ' . $e->getMessage()
            ];
            header("Location: send.php?id={$campaign_id}");
            exit;
        }
    }

    if ($action === 'start') {
        try {
            $db->begin_transaction();
        } catch (Exception $e) {
            // Transaction handling below
        }
        
        // Get segment from form
        $segment = $_POST['send_segment'] ?? 'all';
        $subscribers = get_segment_subscribers($db, $segment);

        $transaction_started = false;
        try {
            $db->begin_transaction();
            $transaction_started = true;

            // Subscribers already fetched by get_segment_subscribers()
            if (empty($subscribers)) {
                if ($transaction_started) $db->rollback();
                respond_or_redirect(false, null, 'No subscribers in selected segment.', $campaign_id);
            }

            $count = 0;

            // Create campaign_sends records
            foreach ($subscribers as $sub) {
                $tracking_id = generate_tracking_id();
                $unsubscribe_token = generate_unsubscribe_token();

                $stmt = $db->prepare("
                    INSERT INTO campaign_sends (
                        campaign_id, subscriber_id, email, name, company, tracking_id, unsubscribe_token, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                ");
                $sub_id = $sub['id'];
                $sub_email = $sub['email'];
                $sub_name = $sub['name'] ?? '';
                $sub_company = $sub['company'] ?? '';
                $status = 'pending';
                $stmt->bind_param("iisssss", $campaign_id, $sub_id, $sub_email, $sub_name, $sub_company, $tracking_id, $unsubscribe_token);
                $stmt->execute();

                $send_id = $db->insert_id;

                // Add to send queue
                $stmt = $db->prepare("
                    INSERT INTO send_queue (send_id, campaign_id, email, status)
                    VALUES (?, ?, ?, 'queued')
                ");
                $stmt->bind_param("iis", $send_id, $campaign_id, $sub_email);
                $stmt->execute();

                $count++;
            }

            // Update campaign
            $stmt = $db->prepare("
                UPDATE campaigns
                SET status = 'sending', recipient_count = ?, started_at = NOW()
                WHERE id = ?
            ");
            $stmt->bind_param("ii", $count, $campaign_id);
            $stmt->execute();

            $db->commit();

            $message = "Campaign queued for sending to $count subscribers";
            
            // Add note if send_to_all_active is enabled
            if (!empty($campaign['send_to_all_active'])) {
                $message .= ' (including all active subscribers)';
            }
            
            if ($send_mode === 'custom') {
                $details = [];
                if ($skipped['invalid'] > 0) {
                    $details[] = "{$skipped['invalid']} invalid ignored";
                }
                if ($skipped['unsubscribed'] > 0) {
                    $details[] = "{$skipped['unsubscribed']} unsubscribed skipped";
                }
                if ($skipped['inactive'] > 0) {
                    $details[] = "{$skipped['inactive']} inactive skipped";
                }
                if ($skipped['new'] > 0) {
                    $details[] = "{$skipped['new']} new skipped";
                }
                if (!empty($details)) {
                    $message .= ' (' . implode(', ', $details) . ')';
                }
            }
            respond_or_redirect(true, ['queued' => $count], $message, $campaign_id);
        } catch (Exception $e) {
            if ($transaction_started) $db->rollback();
            log_campaign_error('start', $campaign_id, $e->getMessage());
            respond_or_redirect(false, null, 'Error starting campaign: ' . $e->getMessage(), $campaign_id);
        }
    }
}

// Get send progress
$stmt = $db->prepare("
    SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM campaign_sends
    WHERE campaign_id = ?
");
$cid = $campaign_id;
$stmt->bind_param("i", $cid);
$stmt->execute();
$progress = $stmt->get_result()->fetch_assoc();

// Check if API request
if (!empty($_GET['api'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'campaign' => $campaign,
        'progress' => $progress
    ]);
    exit;
}

$selected_segment = $_POST['send_segment'] ?? 'all';
$custom_emails_display = $_POST['custom_emails'] ?? $prefill_custom;

$csrf_token = get_csrf_token();

$flash_notice = $_SESSION['send_notice'] ?? null;
if ($flash_notice) {
    unset($_SESSION['send_notice']);
}

if ($prefill && isset($_SESSION['send_prefill'][$campaign_id])) {
    unset($_SESSION['send_prefill'][$campaign_id]);
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Send Campaign - floinvite Mail</title>
    <link rel="stylesheet" href="styles.css">
    
</head>
<body>
    <header class="mail-hero">
        <div class="container">
            <div class="header-row">
                <div class="header-branding">
                    <img src="<?php echo htmlspecialchars(get_logo_path()); ?>" alt="floinvite">
                    <span class="brand-wordmark">
                        <span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span>
                    </span>
                </div>
                <a href="index.php" class="back-link">← Back to Dashboard</a>
            </div>
            <h1>Send Campaign</h1>
            <nav class="nav mail-nav">
                <a href="index.php">Dashboard</a>
                <a href="subscribers.php">Subscribers</a>
                <a href="compose.php">New Campaign</a>
            </nav>
        </div>
    </header>

    <div class="container">
        <!-- Campaign Details -->
        <div class="campaign-info">
            <h3><?php echo htmlspecialchars($campaign['name']); ?></h3>
            <p>Subject: <?php echo htmlspecialchars($campaign['subject']); ?></p>
            <p>Status: <strong><?php echo ucfirst($campaign['status']); ?></strong></p>
        </div>

        <!-- Warning -->
        <div class="warning-box">
            <strong>Important Notice</strong>
            Once you start sending, this campaign cannot be paused. Emails will be sent at a rate of up to <?php echo RATE_LIMIT_PER_HOUR; ?> per hour to comply with Hostinger limits.
        </div>

        <?php if ($flash_notice): ?>
            <div class="message <?php echo htmlspecialchars($flash_notice['type']); ?>">
                <?php echo htmlspecialchars($flash_notice['message']); ?>
            </div>
        <?php endif; ?>

        <!-- Start Sending -->
        <?php if ($campaign['status'] === 'draft'): ?>
            <div class="section">
                <h2>Ready to Send?</h2>
                <p style="margin-bottom: 1rem; color: #6b7280;">
                    Choose which segment to send to.
                </p>

                <div class="recipient-count" id="segment-count">
                    Loading segment counts...
                </div>

                <?php if ($preview_error): ?>
                    <div class="message error"><?php echo htmlspecialchars($preview_error); ?></div>
                <?php elseif ($preview): ?>
                    <div class="preview-box">
                        <strong>Recipient preview</strong>
                        <?php if ($preview && $preview['mode'] === 'segment'): ?>
                            <div class="preview-grid">
                                <div class="preview-item">
                                    <?php echo number_format($preview['counts']['active']); ?>
                                    <span><?php
                                        $segment_labels = [
                                            'all' => 'All Active Subscribers',
                                            'unreached' => 'Unreached Subscribers',
                                            'reached' => 'Reached Subscribers'
                                        ];
                                        echo $segment_labels[$preview['segment']] ?? 'Recipients';
                                    ?></span>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>

                <form method="POST">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf_token); ?>">
                    <div class="send-mode">
                        <?php
                            $all_count = get_all_active_count($db);
                            $unreached_count = get_unreached_count($db);
                            $reached_count = get_reached_count($db);
                            $selected_segment = $_POST['send_segment'] ?? 'all';
                        ?>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" id="send-all" name="send_segment" value="all" <?php echo $selected_segment === 'all' ? 'checked' : ''; ?> style="cursor: pointer;">
                                <label for="send-all" style="cursor: pointer; margin: 0;">
                                    Send to all active subscribers (<?php echo number_format($all_count); ?>)
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" id="send-unreached" name="send_segment" value="unreached" <?php echo $selected_segment === 'unreached' ? 'checked' : ''; ?> style="cursor: pointer;">
                                <label for="send-unreached" style="cursor: pointer; margin: 0;">
                                    Send to unreached subscribers (<?php echo number_format($unreached_count); ?>)
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" id="send-reached" name="send_segment" value="reached" <?php echo $selected_segment === 'reached' ? 'checked' : ''; ?> style="cursor: pointer;">
                                <label for="send-reached" style="cursor: pointer; margin: 0;">
                                    Send to reached subscribers (<?php echo number_format($reached_count); ?>)
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="submit" name="action" value="preview" class="btn-secondary">
                            Preview Recipients
                        </button>
                        <?php
                            $disable_send_reason = '';
                            if ($preview_error) {
                                $disable_send_reason = 'Fix preview errors before sending.';
                            } elseif ($preview && $preview['counts']['active'] === 0) {
                                $disable_send_reason = 'No recipients in selected segment.';
                            }
                            $disable_send = $disable_send_reason !== '';
                        ?>
                        <button type="submit" name="action" value="start" class="btn-primary" <?php echo $disable_send ? 'disabled' : ''; ?> onclick="return confirm('Start sending this campaign to the selected recipients? This cannot be undone.')">
                            Start Sending Campaign
                        </button>
                        <?php if ($disable_send): ?>
                            <div class="disabled-message"><?php echo htmlspecialchars($disable_send_reason); ?></div>
                        <?php endif; ?>
                    </div>
                </form>
            </div>
        <?php else: ?>
            <!-- Progress -->
            <div class="section">
                <h2>Sending Progress</h2>

                <?php if ($progress['total'] > 0): ?>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: <?php echo ($progress['sent'] / $progress['total']) * 100; ?>%"></div>
                    </div>

                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value"><?php echo $progress['sent']; ?></div>
                            <div class="stat-label">Sent</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value"><?php echo $progress['total']; ?></div>
                            <div class="stat-label">Total</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value"><?php echo ($progress['total'] - $progress['sent'] - $progress['failed']); ?></div>
                            <div class="stat-label">Outstanding</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value"><?php echo $progress['failed']; ?></div>
                            <div class="stat-label">Failed</div>
                        </div>
                    </div>

                    <div class="info-box">
                        Emails are being sent at <?php echo RATE_LIMIT_PER_HOUR; ?> per hour. Progress updates automatically every 30 seconds.
                        <script>
                            setInterval(() => {
                                fetch('?api=1&id=<?php echo $campaign_id; ?>')
                                    .then(r => r.json())
                                    .then(data => {
                                        if (data.progress) {
                                            location.reload();
                                        }
                                    });
                            }, 30000);
                        </script>
                    </div>

                    <!-- Debug info -->
                    <?php
                        $debug_pending = $db->prepare("SELECT COUNT(*) as count FROM campaign_sends WHERE campaign_id = ? AND status = 'pending'");
                        $cid = $campaign_id;
                        $debug_pending->bind_param("i", $cid);
                        $debug_pending->execute();
                        $pending_count = $debug_pending->get_result()->fetch_assoc()['count'] ?? 0;

                        $debug_queued = $db->prepare("SELECT COUNT(*) as count FROM send_queue WHERE campaign_id = ? AND status = 'queued'");
                        $cid = $campaign_id;
                        $debug_queued->bind_param("i", $cid);
                        $debug_queued->execute();
                        $queued_count = $debug_queued->get_result()->fetch_assoc()['count'] ?? 0;
                    ?>
                    <div style="background: #f3f4f6; border: 1px solid #e5e7eb; padding: 0.75rem; margin-top: 1rem; border-radius: 0.375rem; font-family: monospace; font-size: 0.875rem;">
                        <strong>Debug Info:</strong><br>
                        Campaign Status: <?php echo htmlspecialchars($campaign['status']); ?><br>
                        Pending in campaign_sends: <?php echo $pending_count; ?><br>
                        Queued in send_queue: <?php echo $queued_count; ?><br>
                        Send Method: <?php echo htmlspecialchars($campaign['send_method'] ?? 'null'); ?>
                    </div>

                    <?php if ($campaign['status'] === 'completed'): ?>
                        <div class="success-box">
                            Campaign completed successfully!
                        </div>
                    <?php elseif ($campaign['status'] === 'sending'): ?>
                        <div class="button-group" style="margin-top: 1rem;">
                            <form method="POST">
                                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf_token); ?>">
                                <input type="hidden" name="action" value="send_now">
                                <button type="submit" class="btn-secondary" onclick="return confirm('Process outstanding emails now? This will send up to the batch size immediately.')">
                                    Send Outstanding
                                </button>
                            </form>
                            <?php if ($progress['failed'] > 0): ?>
                                <form method="POST">
                                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf_token); ?>">
                                    <input type="hidden" name="action" value="retry_failed">
                                    <button type="submit" class="btn-secondary" onclick="return confirm('Retry all <?php echo $progress['failed']; ?> failed emails?')">
                                        Retry Failed (<?php echo $progress['failed']; ?>)
                                    </button>
                                </form>
                            <?php endif; ?>
                            <form method="POST">
                                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf_token); ?>">
                                <input type="hidden" name="action" value="cancel">
                                <button type="submit" class="btn-secondary" onclick="return confirm('Cancel sending this campaign? This will stop queued emails from sending.')">
                                    Cancel Sending
                                </button>
                            </form>
                        </div>
                    <?php elseif ($campaign['status'] === 'paused'): ?>
                        <div class="warning-box">
                            This campaign is paused. You can resume sending or send a batch immediately.
                        </div>
                        <div class="button-group" style="margin-top: 1rem;">
                            <form method="POST">
                                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf_token); ?>">
                                <input type="hidden" name="action" value="resume">
                                <button type="submit" class="btn-secondary">
                                    Resume Sending
                                </button>
                            </form>
                            <form method="POST">
                                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf_token); ?>">
                                <input type="hidden" name="action" value="send_now">
                                <button type="submit" class="btn-secondary" onclick="return confirm('Send outstanding emails and resume this campaign?')">
                                    Resume &amp; Send Outstanding
                                </button>
                            </form>
                            <?php if ($progress['failed'] > 0): ?>
                                <form method="POST">
                                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf_token); ?>">
                                    <input type="hidden" name="action" value="retry_failed">
                                    <button type="submit" class="btn-secondary" onclick="return confirm('Retry all <?php echo $progress['failed']; ?> failed emails?')">
                                        Retry Failed (<?php echo $progress['failed']; ?>)
                                    </button>
                                </form>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                <?php else: ?>
                    <p>No subscribers queued.</p>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Segment mode: update count when selection changes -->
    <script>
        if (document.querySelector('input[name="send_segment"]')) {
            const radioButtons = document.querySelectorAll('input[name="send_segment"]');
            const segmentCount = document.getElementById('segment-count');

            const counts = {
                'all': <?php echo get_all_active_count($db); ?>,
                'unreached': <?php echo get_unreached_count($db); ?>,
                'reached': <?php echo get_reached_count($db); ?>
            };

            const updateCount = () => {
                const selected = document.querySelector('input[name="send_segment"]:checked')?.value || 'all';
                if (segmentCount) {
                    segmentCount.textContent = 'Sending to ' + (counts[selected] || 0).toLocaleString() + ' recipients';
                }
            };

            radioButtons.forEach(btn => {
                btn.addEventListener('change', updateCount);
            });

            updateCount();
        }
    </script>

    <!-- Footer -->
    <div class="container">
        <footer class="mail-footer">
            <p>© <?php echo date('Y'); ?> <span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span>. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>
