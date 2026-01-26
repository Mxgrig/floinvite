<?php
/**
 * API: Subscriber Sample
 * Returns a limited sample list for preview dropdown.
 * GET /api-subscriber-sample.php?filter=unreached
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = get_db();
    $filter = $_GET['filter'] ?? 'all';
    if (!in_array($filter, ['unreached', 'reached', 'all'], true)) {
        $filter = 'all';
    }

    $limit = 50;

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
            LIMIT $limit
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
            LIMIT $limit
        ");
        $stmt->execute();
    } else {
        $stmt = $db->prepare("
            SELECT email, name, company
            FROM subscribers
            WHERE status = 'active'
            ORDER BY name ASC, email ASC
            LIMIT $limit
        ");
        $stmt->execute();
    }

    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    respond(true, $rows, 'Subscriber sample loaded');
} catch (Exception $e) {
    respond(false, null, 'Error: ' . $e->getMessage());
}
?>
