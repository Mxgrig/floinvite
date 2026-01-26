<?php
/**
 * API: Get Subscribers List
 * GET /api-get-subscribers.php?filter=unreached&campaign_id=123
 * Filters: unreached (never successfully emailed), reached (successfully emailed), all (all active subscribers)
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = get_db();
    $campaign_id = intval($_GET['campaign_id'] ?? 0);
    $filter = $_GET['filter'] ?? 'all';

    if (!in_array($filter, ['unreached', 'reached', 'all'], true)) {
        $filter = 'all';
    }

    if ($filter === 'unreached') {
        $stmt = $db->prepare("
            SELECT s.email, s.name, s.company
            FROM subscribers s
            WHERE s.status = 'active'
            AND NOT EXISTS (
                SELECT 1
                FROM campaign_sends cs
                WHERE cs.subscriber_id = s.id
                AND cs.status = 'sent'
            )
            ORDER BY s.name ASC, s.email ASC
            LIMIT 1000
        ");
        $stmt->execute();
    } elseif ($filter === 'reached') {
        $stmt = $db->prepare("
            SELECT s.email, s.name, s.company
            FROM subscribers s
            WHERE s.status = 'active'
            AND EXISTS (
                SELECT 1
                FROM campaign_sends cs
                WHERE cs.subscriber_id = s.id
                AND cs.status = 'sent'
            )
            ORDER BY s.name ASC, s.email ASC
            LIMIT 1000
        ");
        $stmt->execute();
    } else {
        $stmt = $db->prepare("
            SELECT email, name, company
            FROM subscribers
            WHERE status = 'active'
            ORDER BY name ASC, email ASC
            LIMIT 1000
        ");
        $stmt->execute();
    }

    $subscribers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    respond(true, $subscribers, 'Subscribers loaded successfully');
} catch (Exception $e) {
    respond(false, null, 'Error: ' . $e->getMessage());
}
?>
