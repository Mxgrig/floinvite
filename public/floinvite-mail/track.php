<?php
/**
 * Email Tracking
 * Handles open and click tracking (no authentication required)
 */

require_once 'config.php';

$db = get_db();

// Handle open tracking (1x1 pixel)
if (!empty($_GET['id'])) {
    $tracking_id = trim($_GET['id']);

    try {
        // Get the send record
        $stmt = $db->prepare("
            SELECT campaign_id, id as send_id FROM campaign_sends
            WHERE tracking_id = ?
        ");
        $stmt->execute([$tracking_id]);
        $send = $stmt->fetch();

        if ($send) {
            // Update opened_at if not already tracked
            $stmt = $db->prepare("
                UPDATE campaign_sends
                SET opened_at = IF(opened_at IS NULL, NOW(), opened_at)
                WHERE id = ?
            ");
            $stmt->execute([$send['send_id']]);

            // Update campaign open count
            $stmt = $db->prepare("
                UPDATE campaigns
                SET opened_count = (
                    SELECT COUNT(*) FROM campaign_sends
                    WHERE campaign_id = ? AND opened_at IS NOT NULL
                )
                WHERE id = ?
            ");
            $stmt->execute([$send['campaign_id'], $send['campaign_id']]);

            // Log analytics
            $stmt = $db->prepare("
                INSERT INTO analytics (campaign_id, send_id, event_type, ip_address, user_agent)
                VALUES (?, ?, 'opened', ?, ?)
            ");
            $stmt->execute([
                $send['campaign_id'],
                $send['send_id'],
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
        }
    } catch (Exception $e) {
        // Silently fail - don't expose errors
    }
}

// Handle click tracking
if (!empty($_GET['link'])) {
    $tracking_id = trim($_GET['id']);
    $link_url = trim($_GET['link']);

    try {
        // Get the send record
        $stmt = $db->prepare("
            SELECT campaign_id, id as send_id FROM campaign_sends
            WHERE tracking_id = ?
        ");
        $stmt->execute([$tracking_id]);
        $send = $stmt->fetch();

        if ($send) {
            // Update clicked_at
            $stmt = $db->prepare("
                UPDATE campaign_sends
                SET clicked_at = IF(clicked_at IS NULL, NOW(), clicked_at)
                WHERE id = ?
            ");
            $stmt->execute([$send['send_id']]);

            // Update campaign click count
            $stmt = $db->prepare("
                UPDATE campaigns
                SET clicked_count = (
                    SELECT COUNT(*) FROM campaign_sends
                    WHERE campaign_id = ? AND clicked_at IS NOT NULL
                )
                WHERE id = ?
            ");
            $stmt->execute([$send['campaign_id'], $send['campaign_id']]);

            // Log analytics with link
            $stmt = $db->prepare("
                INSERT INTO analytics (campaign_id, send_id, event_type, ip_address, user_agent, link_url)
                VALUES (?, ?, 'clicked', ?, ?, ?)
            ");
            $stmt->execute([
                $send['campaign_id'],
                $send['send_id'],
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                $link_url
            ]);
        }
    } catch (Exception $e) {
        // Silently fail
    }
}

// Redirect for click tracking when link param is provided
if (!empty($_GET['link'])) {
    $destination = trim($_GET['link']);
    if (filter_var($destination, FILTER_VALIDATE_URL)) {
        header('Location: ' . $destination, true, 302);
        exit;
    }
}

// Return 1x1 transparent GIF pixel (open tracking)
header('Content-Type: image/gif');
header('Cache-Control: no-cache, no-store, must-revalidate');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

?>
