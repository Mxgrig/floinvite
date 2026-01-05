<?php
/**
 * Migration: Add send_method column to campaigns table
 * Tracks how the campaign should be sent: immediate, queue, or scheduled
 */

require_once 'config.php';

$db = get_db();

try {
    echo "Starting migration...\n";

    // Add send_method column
    $db->exec("ALTER TABLE campaigns ADD COLUMN send_method ENUM('immediate', 'queue', 'scheduled') DEFAULT 'queue' AFTER status");
    echo "✓ Added send_method column (default: 'queue')\n";

    echo "\nMigration completed successfully!\n";
    echo "campaigns table now supports send_method for controlling when emails are sent.\n";

} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists. Migration already applied.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
