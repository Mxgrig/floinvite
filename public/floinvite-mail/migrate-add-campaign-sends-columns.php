<?php
/**
 * Migration: Add name and company columns to campaign_sends table
 */

require_once 'config.php';

$db = get_db();

try {
    echo "Starting migration...\n";

    try {
        $db->query("ALTER TABLE campaign_sends ADD COLUMN name VARCHAR(255) AFTER email");
        echo "✓ Added name column\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "✓ name column already exists\n";
        } else {
            throw $e;
        }
    }

    try {
        $db->query("ALTER TABLE campaign_sends ADD COLUMN company VARCHAR(255) AFTER name");
        echo "✓ Added company column\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "✓ company column already exists\n";
        } else {
            throw $e;
        }
    }

    echo "\nMigration completed successfully!\n";
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
