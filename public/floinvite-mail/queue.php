<?php
/**
 * Shared queue helpers for floinvite Mail sending.
 * Adds Tagtaly-style reliability (atomic claiming, retries, backoff, rate limiting),
 * but keeps floinvite's attachment model and mysqli usage.
 */

require_once 'config.php';
require_once '../api/PHPMailerHelper.php';
require_once 'email-with-attachments.php';

if (!function_exists('calculate_retry_backoff_seconds')) {
    function calculate_retry_backoff_seconds($attempts) {
        $attempts = max(1, (int) $attempts);
        $base = 3600;
        $max = 86400;
        return min($max, $base * (2 ** ($attempts - 1)));
    }
}

if (!function_exists('get_rate_limit_remaining')) {
    function get_rate_limit_remaining($db, $campaign_id) {
        if (!$db || !defined('RATE_LIMIT_PER_HOUR') || RATE_LIMIT_PER_HOUR <= 0) {
            return 0;
        }

        $stmt = $db->prepare("
            SELECT COALESCE(SUM(email_count), 0) as sent
            FROM rate_limit_log
            WHERE campaign_id = ?
              AND sent_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $stmt->bind_param("i", $campaign_id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $sent = (int) ($row['sent'] ?? 0);

        return max(0, RATE_LIMIT_PER_HOUR - $sent);
    }
}

if (!function_exists('record_rate_limit_send')) {
    function record_rate_limit_send($db, $campaign_id, $count) {
        if (!$db || $count <= 0) {
            return;
        }

        $stmt = $db->prepare("
            INSERT INTO rate_limit_log (campaign_id, email_count, sent_at, hour_bucket)
            VALUES (?, ?, NOW(), HOUR(NOW()))
        ");
        $stmt->bind_param("ii", $campaign_id, $count);
        $stmt->execute();
    }
}

function queue_column_exists($db, $table, $column) {
    static $cache = [];
    $key = $table . '.' . $column;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }

    $stmt = $db->prepare("
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
        LIMIT 1
    ");
    $db_name = DB_NAME;
    $stmt->bind_param("sss", $db_name, $table, $column);
    $stmt->execute();
    $cache[$key] = (bool) $stmt->get_result()->fetch_assoc();
    return $cache[$key];
}

function queue_supports_processing_fields($db) {
    return queue_column_exists($db, 'send_queue', 'processing_token')
        && queue_column_exists($db, 'send_queue', 'processing_started_at')
        && queue_column_exists($db, 'send_queue', 'next_attempt_at');
}

function build_attachment_list_from_campaign($campaign) {
    $attachments = [];
    if (empty($campaign['attachments'])) {
        return $attachments;
    }

    $attachments_data = json_decode($campaign['attachments'], true);
    if (!is_array($attachments_data)) {
        return $attachments;
    }

    $upload_dir = __DIR__ . '/uploads/attachments';
    foreach ($attachments_data as $att) {
        if (!is_array($att)) {
            continue;
        }
        $stored_name = $att['stored_name'] ?? '';
        if ($stored_name === '') {
            continue;
        }
        $file_path = $upload_dir . '/' . $stored_name;
        if (!file_exists($file_path)) {
            continue;
        }
        $attachments[] = [
            'file_path' => $file_path,
            'original_name' => $att['original_name'] ?? $stored_name
        ];
    }

    return $attachments;
}

function add_missing_all_active_subscribers($db, $campaign_id, $campaign) {
    if (empty($campaign['send_to_all_active'])) {
        return 0;
    }

    $missing_stmt = $db->prepare("
        SELECT s.id, s.email, s.name, s.company
        FROM subscribers s
        WHERE s.status = 'active'
        AND s.id NOT IN (
            SELECT DISTINCT subscriber_id FROM campaign_sends
            WHERE campaign_id = ?
        )
        ORDER BY s.id
    ");
    $missing_stmt->bind_param("i", $campaign_id);
    $missing_stmt->execute();
    $missing = $missing_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (empty($missing)) {
        return 0;
    }

    $added = 0;
    $insert_stmt = $db->prepare("
        INSERT INTO campaign_sends
        (campaign_id, subscriber_id, email, name, company, tracking_id, unsubscribe_token, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");

    foreach ($missing as $sub) {
        try {
            $tracking_id = generate_tracking_id();
            $unsubscribe_token = generate_unsubscribe_token();
            $name = $sub['name'] ?? '';
            $company = $sub['company'] ?? '';

            $insert_stmt->bind_param(
                "iisssss",
                $campaign_id,
                $sub['id'],
                $sub['email'],
                $name,
                $company,
                $tracking_id,
                $unsubscribe_token
            );
            $insert_stmt->execute();
            $added++;
        } catch (Exception $e) {
            // Skip failures to avoid breaking queue processing.
        }
    }

    if ($added > 0) {
        $queue_stmt = $db->prepare("
            INSERT INTO send_queue (send_id, campaign_id, email, status)
            SELECT id, campaign_id, email, 'queued'
            FROM campaign_sends
            WHERE campaign_id = ?
            AND status = 'pending'
            AND id NOT IN (
                SELECT DISTINCT send_id FROM send_queue
                WHERE campaign_id = ?
            )
        ");
        $queue_stmt->bind_param("ii", $campaign_id, $campaign_id);
        $queue_stmt->execute();
    }

    return $added;
}

function update_campaign_stats_and_complete($db, array $campaign_ids) {
    if (empty($campaign_ids)) {
        return;
    }

    $update_stats = $db->prepare("
        UPDATE campaigns
        SET
            sent_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = ? AND status = 'sent'),
            failed_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = ? AND status = 'failed')
        WHERE id = ?
    ");

    $complete_stmt = $db->prepare("
        UPDATE campaigns
        SET status = 'completed', completed_at = NOW()
        WHERE id = ?
          AND status = 'sending'
          AND NOT EXISTS (
              SELECT 1 FROM campaign_sends
              WHERE campaign_id = ?
                AND status IN ('pending', 'failed')
          )
    ");

    foreach ($campaign_ids as $campaign_id) {
        $update_stats->bind_param("iii", $campaign_id, $campaign_id, $campaign_id);
        $update_stats->execute();
        $complete_stmt->bind_param("ii", $campaign_id, $campaign_id);
        $complete_stmt->execute();
    }
}

function process_send_queue_batch($db, $batch_size, array $options = []) {
    $processing_stale_minutes = (int) ($options['processing_stale_minutes'] ?? 15);
    $campaign_id = isset($options['campaign_id']) ? (int) $options['campaign_id'] : null;
    $auto_add_all_active = !empty($options['auto_add_all_active']);

    $supports_processing = queue_supports_processing_fields($db);
    $supports_next_attempt = $supports_processing || queue_column_exists($db, 'send_queue', 'next_attempt_at');

    if ($auto_add_all_active) {
        $campaign_query = "
            SELECT *
            FROM campaigns
            WHERE send_to_all_active = 1
              AND status IN ('sending', 'scheduled')
              AND (
                  send_method IN ('queue', 'immediate')
                  OR (send_method = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW())
              )
        ";
        $params = [];
        $types = '';
        if ($campaign_id) {
            $campaign_query .= " AND id = ?";
            $params[] = $campaign_id;
            $types .= 'i';
        }
        $campaign_stmt = $db->prepare($campaign_query);
        if ($params) {
            $campaign_stmt->bind_param($types, ...$params);
        }
        $campaign_stmt->execute();
        $campaigns = $campaign_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        foreach ($campaigns as $campaign) {
            add_missing_all_active_subscribers($db, (int) $campaign['id'], $campaign);
        }
    }

    if ($supports_processing) {
        $stale_sql = "
            UPDATE send_queue
            SET status = 'queued', processing_token = NULL, processing_started_at = NULL
            WHERE status = 'processing'
              AND processing_started_at IS NOT NULL
              AND processing_started_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ";
        $stale_params = [$processing_stale_minutes];
        $stale_types = 'i';
        if ($campaign_id) {
            $stale_sql .= " AND campaign_id = ?";
            $stale_params[] = $campaign_id;
            $stale_types .= 'i';
        }
        $stale_stmt = $db->prepare($stale_sql);
        $stale_stmt->bind_param($stale_types, ...$stale_params);
        $stale_stmt->execute();
    }

    $processing_token = bin2hex(random_bytes(16));
    $queue_ids = [];

    if ($supports_processing) {
        try {
            $db->begin_transaction();

            $select_ids_sql = "
                SELECT q.id
                FROM send_queue q
                JOIN campaign_sends s ON q.send_id = s.id
                JOIN campaigns c ON q.campaign_id = c.id
                WHERE q.status = 'queued'
                  AND q.attempts < q.max_attempts
            ";
            if ($supports_next_attempt) {
                $select_ids_sql .= " AND (q.next_attempt_at IS NULL OR q.next_attempt_at <= NOW())";
            }
            $select_ids_sql .= "
                  AND c.status IN ('sending', 'scheduled')
                  AND (
                      c.send_method IN ('queue', 'immediate')
                      OR (c.send_method = 'scheduled' AND c.scheduled_at IS NOT NULL AND c.scheduled_at <= NOW())
                  )
            ";

            $params = [];
            $types = '';
            if ($campaign_id) {
                $select_ids_sql .= " AND q.campaign_id = ?";
                $params[] = $campaign_id;
                $types .= 'i';
            }
            $batch_limit = max(0, (int) $batch_size);
            $select_ids_sql .= " ORDER BY q.created_at ASC LIMIT ? FOR UPDATE";
            $params[] = $batch_limit;
            $types .= 'i';

            $select_stmt = $db->prepare($select_ids_sql);
            $select_stmt->bind_param($types, ...$params);
            $select_stmt->execute();
            $rows = $select_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $queue_ids = array_column($rows, 'id');

            if (empty($queue_ids)) {
                $db->commit();
                return ['processed' => 0, 'sent' => 0, 'failed' => 0, 'campaign_ids' => []];
            }

            $placeholders = implode(',', array_fill(0, count($queue_ids), '?'));
            $update_sql = "
                UPDATE send_queue
                SET status = 'processing',
                    processing_token = ?,
                    processing_started_at = NOW()
                WHERE id IN ($placeholders)
            ";
            $update_stmt = $db->prepare($update_sql);
            $types = 's' . str_repeat('i', count($queue_ids));
            $update_stmt->bind_param($types, $processing_token, ...$queue_ids);
            $update_stmt->execute();

            $db->commit();
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
    }

    $select_fields = [
        "q.id as queue_id",
        "q.send_id",
        "q.campaign_id",
        "q.attempts",
        "q.max_attempts",
        "s.email",
        queue_column_exists($db, 'campaign_sends', 'name') ? "s.name" : "'' as name",
        queue_column_exists($db, 'campaign_sends', 'company') ? "s.company" : "'' as company",
        "s.tracking_id",
        "s.unsubscribe_token",
        queue_column_exists($db, 'campaigns', 'greeting') ? "c.greeting" : "'' as greeting",
        "c.html_body",
        queue_column_exists($db, 'campaigns', 'signature') ? "c.signature" : "'' as signature",
        "c.from_name",
        "c.subject",
        "c.send_method",
        "c.scheduled_at",
        queue_column_exists($db, 'campaigns', 'attachments') ? "c.attachments" : "'' as attachments",
        queue_column_exists($db, 'campaigns', 'requires_response') ? "c.requires_response" : "0 as requires_response"
    ];

    $select_sql = "
        SELECT " . implode(",\n            ", $select_fields) . "
        FROM send_queue q
        JOIN campaign_sends s ON q.send_id = s.id
        JOIN campaigns c ON q.campaign_id = c.id
    ";

    $params = [];
    $types = '';
    if ($supports_processing) {
        $select_sql .= " WHERE q.status = 'processing' AND q.processing_token = ?";
        $params[] = $processing_token;
        $types .= 's';
    } else {
        $select_sql .= " WHERE q.status = 'queued' AND q.attempts < q.max_attempts";
        if ($supports_next_attempt) {
            $select_sql .= " AND (q.next_attempt_at IS NULL OR q.next_attempt_at <= NOW())";
        }
        $select_sql .= "
            AND c.status IN ('sending', 'scheduled')
            AND (
                c.send_method IN ('queue', 'immediate')
                OR (c.send_method = 'scheduled' AND c.scheduled_at IS NOT NULL AND c.scheduled_at <= NOW())
            )
        ";
        if ($campaign_id) {
            $select_sql .= " AND q.campaign_id = ?";
            $params[] = $campaign_id;
            $types .= 'i';
        }
        $select_sql .= " ORDER BY q.created_at ASC LIMIT ?";
        $params[] = max(0, (int) $batch_size);
        $types .= 'i';
    }

    $stmt = $db->prepare($select_sql);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $queued = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (empty($queued)) {
        return ['processed' => 0, 'sent' => 0, 'failed' => 0, 'campaign_ids' => []];
    }

    $processed = 0;
    $sent = 0;
    $failed = 0;
    $rate_remaining = [];
    $attempted_by_campaign = [];
    $campaign_ids = [];

    foreach ($queued as $item) {
        $campaign_id = (int) $item['campaign_id'];
        $campaign_ids[$campaign_id] = true;

        if (!array_key_exists($campaign_id, $rate_remaining)) {
            $rate_remaining[$campaign_id] = get_rate_limit_remaining($db, $campaign_id);
        }

        try {
            if ($rate_remaining[$campaign_id] <= 0) {
                if ($supports_processing) {
                    $defer_stmt = $db->prepare("
                        UPDATE send_queue
                        SET status = 'queued',
                            processing_token = NULL,
                            processing_started_at = NULL,
                            next_attempt_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
                            error_message = 'Rate limit deferred'
                        WHERE id = ?
                    ");
                    $defer_stmt->bind_param("i", $item['queue_id']);
                    $defer_stmt->execute();
                } else {
                    $defer_sql = "
                        UPDATE send_queue
                        SET status = 'queued', error_message = 'Rate limit deferred'
                    ";
                    if ($supports_next_attempt) {
                        $defer_sql .= ", next_attempt_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)";
                    }
                    $defer_sql .= " WHERE id = ?";
                    $defer_stmt = $db->prepare($defer_sql);
                    $defer_stmt->bind_param("i", $item['queue_id']);
                    $defer_stmt->execute();
                }
                continue;
            }

            $html_body = create_email_from_text(
                $item['greeting'] ?? '',
                $item['html_body'] ?? '',
                $item['signature'] ?? '',
                $item['name'] ?? $item['email'],
                $item['email'],
                $item['company'] ?? '',
                'Host Name',
                'host@floinvite.com',
                'default',
                $item['unsubscribe_token'] ?? '',
                false,
                !empty($item['requires_response'])
            );

            $from_email = SMTP_USER ?: 'admin@floinvite.com';
            $from_name = $item['from_name'] ?: 'floinvite';
            $subject = preg_replace('/[\r\n]+/', ' ', $item['subject']);

            $attachments = build_attachment_list_from_campaign($item);

            $rate_remaining[$campaign_id]--;
            $attempted_by_campaign[$campaign_id] = ($attempted_by_campaign[$campaign_id] ?? 0) + 1;

            if (!empty($attachments)) {
                $result = send_email_with_attachments(
                    $from_name,
                    $from_email,
                    $item['email'],
                    $subject,
                    $html_body,
                    $attachments
                );
            } else {
                $mailer = new PHPMailerHelper();
                $result = $mailer->send([
                    'to' => $item['email'],
                    'subject' => $subject,
                    'body' => $html_body,
                    'isHtml' => true,
                    'fromEmail' => $from_email,
                    'fromName' => $from_name
                ]);
            }

            if (!empty($result['success'])) {
                $update_send = $db->prepare("
                    UPDATE campaign_sends
                    SET status = 'sent', sent_at = NOW()
                    WHERE id = ?
                ");
                $update_send->bind_param("i", $item['send_id']);
                $update_send->execute();

                $update_sql = "
                    UPDATE send_queue
                    SET status = 'sent',
                        attempts = attempts + 1
                ";
                if ($supports_processing) {
                    $update_sql .= ",
                        processing_token = NULL,
                        processing_started_at = NULL,
                        next_attempt_at = NULL
                    ";
                } elseif ($supports_next_attempt) {
                    $update_sql .= ", next_attempt_at = NULL";
                }
                $update_sql .= " WHERE id = ?";
                $update_queue = $db->prepare($update_sql);
                $update_queue->bind_param("i", $item['queue_id']);
                $update_queue->execute();

                $sent++;
            } else {
                throw new Exception($result['error'] ?? 'Failed to send email via SMTP');
            }
        } catch (Exception $e) {
            $error_message = substr($e->getMessage(), 0, 500);
            $next_attempts = $item['attempts'] + 1;
            $backoff_seconds = calculate_retry_backoff_seconds($next_attempts);
            $next_attempt_at = date('Y-m-d H:i:s', time() + $backoff_seconds);

            if ($next_attempts >= $item['max_attempts']) {
                $update_sql = "
                    UPDATE send_queue
                    SET status = 'failed',
                        attempts = ?,
                        error_message = ?
                ";
                if ($supports_processing) {
                    $update_sql .= ",
                        processing_token = NULL,
                        processing_started_at = NULL,
                        next_attempt_at = NULL
                    ";
                } elseif ($supports_next_attempt) {
                    $update_sql .= ", next_attempt_at = NULL";
                }
                $update_sql .= " WHERE id = ?";
                $update_stmt = $db->prepare($update_sql);
                $update_stmt->bind_param("isi", $next_attempts, $error_message, $item['queue_id']);
                $update_stmt->execute();
                $failed++;

                $update_send = $db->prepare("
                    UPDATE campaign_sends
                    SET status = 'failed', error_message = ?
                    WHERE id = ?
                ");
                $update_send->bind_param("si", $error_message, $item['send_id']);
                $update_send->execute();
            } else {
                $update_sql = "
                    UPDATE send_queue
                    SET status = 'queued',
                        attempts = ?,
                        error_message = ?
                ";
                if ($supports_processing || $supports_next_attempt) {
                    $update_sql .= ", next_attempt_at = ?";
                }
                $update_sql .= " WHERE id = ?";
                $update_stmt = $db->prepare($update_sql);
                if ($supports_processing || $supports_next_attempt) {
                    $update_stmt->bind_param("issi", $next_attempts, $error_message, $next_attempt_at, $item['queue_id']);
                } else {
                    $update_stmt->bind_param("isi", $next_attempts, $error_message, $item['queue_id']);
                }
                $update_stmt->execute();
            }
        }

        $processed++;
    }

    foreach ($attempted_by_campaign as $attempted_campaign_id => $count) {
        record_rate_limit_send($db, $attempted_campaign_id, $count);
    }

    return [
        'processed' => $processed,
        'sent' => $sent,
        'failed' => $failed,
        'campaign_ids' => array_keys($campaign_ids)
    ];
}
