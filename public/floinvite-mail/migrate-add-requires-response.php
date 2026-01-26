<?php
/**
 * Migration: Add requires_response field to campaigns table
 */

require_once 'config.php';

$db = get_db();

try {
    echo "Starting migration...\n";

    $check = $db->query("SHOW COLUMNS FROM campaigns LIKE 'requires_response'");
    if ($check && $check->num_rows > 0) {
        echo "✓ requires_response already exists\n";
        exit(0);
    }

    $db->query("ALTER TABLE campaigns ADD COLUMN requires_response TINYINT(1) DEFAULT 0 AFTER reply_to");
    echo "✓ Added requires_response column\n";

    echo "\nMigration completed successfully!\n";
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
