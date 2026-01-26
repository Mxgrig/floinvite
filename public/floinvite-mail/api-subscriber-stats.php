<?php
/**
 * API: Subscriber Stats
 * Returns live subscriber counts for UI.
 * Response: { success: true, data: { all, reached, unreached, generated_at } }
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = get_db();

    $all_stmt = $db->prepare("SELECT COUNT(*) as cnt FROM subscribers WHERE status = 'active'");
    $all_stmt->execute();
    $all_row = $all_stmt->get_result()->fetch_assoc();
    $all = (int) ($all_row['cnt'] ?? 0);

    $reached_stmt = $db->prepare("
        SELECT COUNT(*) as cnt
        FROM subscribers s
        WHERE s.status = 'active'
        AND EXISTS (
            SELECT 1
            FROM campaign_sends cs
            WHERE cs.subscriber_id = s.id
            AND cs.status = 'sent'
        )
    ");
    $reached_stmt->execute();
    $reached_row = $reached_stmt->get_result()->fetch_assoc();
    $reached = (int) ($reached_row['cnt'] ?? 0);

    $unreached_stmt = $db->prepare("
        SELECT COUNT(*) as cnt
        FROM subscribers s
        WHERE s.status = 'active'
        AND NOT EXISTS (
            SELECT 1
            FROM campaign_sends cs
            WHERE cs.subscriber_id = s.id
            AND cs.status = 'sent'
        )
    ");
    $unreached_stmt->execute();
    $unreached_row = $unreached_stmt->get_result()->fetch_assoc();
    $unreached = (int) ($unreached_row['cnt'] ?? 0);

    $data = [
        'all' => $all,
        'reached' => $reached,
        'unreached' => $unreached,
        'generated_at' => gmdate('c')
    ];

    respond(true, $data, 'Subscriber stats loaded');
} catch (Exception $e) {
    respond(false, null, 'Error: ' . $e->getMessage());
}
?>
