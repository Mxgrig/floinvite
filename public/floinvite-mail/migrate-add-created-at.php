<?php
/**
 * Migration: Add created_at timestamp to subscribers table
 * Enables tracking of new subscribers for segmentation
 */

require_once 'config.php';
require_auth();

$db = get_db();

try {
    $db->begin_transaction();

    // Check if column already exists
    $check_stmt = $db->prepare("
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'created_at'
    ");
    $db_name = DB_NAME;
    $check_stmt->bind_param("s", $db_name);
    $check_stmt->execute();
    $exists = $check_stmt->get_result()->fetch_assoc();

    if (!$exists) {
        // Add created_at column
        $db->query("
            ALTER TABLE subscribers
            ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ");
        echo "✓ Added created_at column to subscribers table\n";
    } else {
        echo "✓ created_at column already exists\n";
    }

    // Set created_at for existing subscribers (before any campaigns were sent)
    $db->query("
        UPDATE subscribers
        SET created_at = '2026-01-01 00:00:00'
        WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00'
    ");
    echo "✓ Set default timestamp for existing subscribers\n";

    $db->commit();
    echo "\n✓ Migration completed successfully\n";

} catch (Exception $e) {
    $db->rollback();
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
