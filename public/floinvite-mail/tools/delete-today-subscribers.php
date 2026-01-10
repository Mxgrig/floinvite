<?php
/**
 * Delete Today's Subscribers
 * Removes all subscribers that were uploaded/created today
 *
 * Usage: php delete-today-subscribers.php
 */

require_once __DIR__ . '/../config.php';

// Connect to database
$db = get_db();

try {
    // Get count of subscribers to be deleted
    $count_stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM subscribers
        WHERE DATE(created_at) = CURDATE()
    ");
    $count_stmt->execute();
    $count_result = $count_stmt->fetch();
    $count_to_delete = $count_result['count'] ?? 0;

    if ($count_to_delete === 0) {
        echo json_encode([
            'success' => true,
            'message' => 'No subscribers found from today.',
            'deleted' => 0
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // Display subscribers to be deleted
    $list_stmt = $db->prepare("
        SELECT id, email, name, company, created_at
        FROM subscribers
        WHERE DATE(created_at) = CURDATE()
        ORDER BY created_at DESC
    ");
    $list_stmt->execute();
    $subscribers = $list_stmt->fetchAll();

    echo "===== DELETE TODAY'S SUBSCRIBERS =====\n\n";
    echo "Found " . count($subscribers) . " subscriber(s) to delete:\n\n";

    foreach ($subscribers as $sub) {
        echo "- ID: {$sub['id']}, Email: {$sub['email']}, Name: {$sub['name']}, Company: {$sub['company']}, Created: {$sub['created_at']}\n";
    }

    echo "\n";

    // Prompt for confirmation (CLI only)
    if (php_sapi_name() === 'cli') {
        echo "Are you sure you want to DELETE these " . count($subscribers) . " subscriber(s)? (yes/no): ";
        $handle = fopen('php://stdin', 'r');
        $confirmation = trim(fgets($handle));
        fclose($handle);

        if (strtolower($confirmation) !== 'yes') {
            echo "Deletion cancelled.\n";
            exit;
        }
    }

    // Delete subscribers from today
    $delete_stmt = $db->prepare("
        DELETE FROM subscribers
        WHERE DATE(created_at) = CURDATE()
    ");
    $delete_stmt->execute();
    $deleted_count = $delete_stmt->rowCount();

    // Log activity
    log_activity('subscribers_deleted_today', [
        'count' => $deleted_count,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

    $response = [
        'success' => true,
        'message' => "Successfully deleted $deleted_count subscriber(s) from today.",
        'deleted' => $deleted_count,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if (php_sapi_name() === 'cli') {
        echo "\n✓ Successfully deleted $deleted_count subscriber(s) from today.\n";
        echo "Log file: logs/activity.log\n";
    } else {
        header('Content-Type: application/json');
        echo json_encode($response, JSON_PRETTY_PRINT);
    }

} catch (PDOException $e) {
    $error_response = [
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ];

    error_log("Delete subscribers error: " . $e->getMessage());

    if (php_sapi_name() === 'cli') {
        echo "Error: " . $e->getMessage() . "\n";
    } else {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode($error_response, JSON_PRETTY_PRINT);
    }
}
?>
