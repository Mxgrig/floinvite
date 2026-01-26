<?php
/**
 * Migration: Increase send_queue max_attempts default to 5
 */

require_once 'config.php';

$db = get_db();

try {
    echo "Starting migration...\n";

    $db->query("ALTER TABLE send_queue ALTER COLUMN max_attempts SET DEFAULT 5");
    echo "✓ Updated max_attempts default\n";

    $db->query("UPDATE send_queue SET max_attempts = 5 WHERE max_attempts < 5");
    echo "✓ Updated existing rows with max_attempts < 5\n";

    echo "\nMigration completed successfully!\n";
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
