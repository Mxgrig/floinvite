<?php
/**
 * Email Failure Diagnostic Tool
 * Shows why emails are failing
 */

require_once 'config.php';
require_auth();

header('Content-Type: text/html; charset=utf-8');

$db = get_db();
$campaign_id = intval($_GET['id'] ?? 0);

if (!$campaign_id) {
    echo '<h1>Campaign ID Required</h1>';
    echo '<p>Usage: ?id=4</p>';
    exit;
}

// Get campaign
$stmt = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
$stmt->bind_param("i", $campaign_id);
$stmt->execute();
$campaign = $stmt->get_result()->fetch_assoc();

if (!$campaign) {
    echo '<h1>Campaign Not Found</h1>';
    exit;
}

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Failure Diagnostic</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        .section { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; }
        h1 { color: #333; }
        h2 { color: #666; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
        th { background: #f0f0f0; font-weight: bold; }
        .error { color: #d32f2f; }
        .success { color: #388e3c; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>

<div class="section">
    <h1>Campaign #<?php echo $campaign_id; ?>: <?php echo htmlspecialchars($campaign['name']); ?></h1>
    <p><strong>Status:</strong> <?php echo htmlspecialchars($campaign['status']); ?></p>
    <p><strong>Recipients:</strong> <?php echo $campaign['recipient_count']; ?></p>
    <p><strong>Sent:</strong> <?php echo $campaign['sent_count']; ?></p>
    <p><strong>Failed:</strong> <?php echo $campaign['failed_count']; ?></p>
</div>

<div class="section">
    <h2>Failed Email Details</h2>
    <?php
    $stmt = $db->prepare("
        SELECT id, email, error_message, attempts, max_attempts, updated_at
        FROM send_queue
        WHERE campaign_id = ? AND status = 'failed'
        ORDER BY updated_at DESC
        LIMIT 10
    ");
    $stmt->bind_param("i", $campaign_id);
    $stmt->execute();
    $failed = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (empty($failed)) {
        echo '<p class="success">No failed emails in send_queue</p>';
    } else {
        echo '<table>';
        echo '<tr><th>ID</th><th>Email</th><th>Error Message</th><th>Attempts</th><th>Updated</th></tr>';
        
        foreach ($failed as $row) {
            echo '<tr>';
            echo '<td>' . $row['id'] . '</td>';
            echo '<td>' . htmlspecialchars($row['email']) . '</td>';
            echo '<td class="error">' . htmlspecialchars($row['error_message']) . '</td>';
            echo '<td>' . $row['attempts'] . '/' . $row['max_attempts'] . '</td>';
            echo '<td>' . $row['updated_at'] . '</td>';
            echo '</tr>';
        }
        
        echo '</table>';
    }
    ?>
</div>

<div class="section">
    <h2>Campaign Sends Status</h2>
    <?php
    $stmt = $db->prepare("
        SELECT status, COUNT(*) as count
        FROM campaign_sends
        WHERE campaign_id = ?
        GROUP BY status
    ");
    $stmt->bind_param("i", $campaign_id);
    $stmt->execute();
    $sends = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo '<table>';
    echo '<tr><th>Status</th><th>Count</th></tr>';
    foreach ($sends as $row) {
        echo '<tr>';
        echo '<td>' . htmlspecialchars($row['status']) . '</td>';
        echo '<td>' . $row['count'] . '</td>';
        echo '</tr>';
    }
    echo '</table>';
    ?>
</div>

<div class="section">
    <h2>Send Queue Status</h2>
    <?php
    $stmt = $db->prepare("
        SELECT status, COUNT(*) as count
        FROM send_queue
        WHERE campaign_id = ?
        GROUP BY status
    ");
    $stmt->bind_param("i", $campaign_id);
    $stmt->execute();
    $queue = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo '<table>';
    echo '<tr><th>Status</th><th>Count</th></tr>';
    foreach ($queue as $row) {
        echo '<tr>';
        echo '<td>' . htmlspecialchars($row['status']) . '</td>';
        echo '<td>' . $row['count'] . '</td>';
        echo '</tr>';
    }
    echo '</table>';
    ?>
</div>

</body>
</html>
<?php
?>
