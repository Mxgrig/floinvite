<?php
require_once 'config.php';

$db = get_db();

// Count active subscribers
$stmt = $db->prepare("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
echo "Active subscribers: " . $result['count'] . "\n";

// List all subscribers
$stmt = $db->prepare("SELECT id, email, status FROM subscribers ORDER BY id");
$stmt->execute();
$all = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
echo "Total subscribers: " . count($all) . "\n\n";

foreach ($all as $sub) {
    echo $sub['id'] . " | " . $sub['email'] . " | " . $sub['status'] . "\n";
}
?>
