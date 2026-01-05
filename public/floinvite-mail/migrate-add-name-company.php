<?php
/**
 * Migration: Add name and company columns to campaign_sends table
 * Run once to add support for placeholder personalization
 */

require_once 'config.php';

$db = get_db();

try {
    echo "Starting migration...\n";

    // Add name column if it doesn't exist
    $db->exec("ALTER TABLE campaign_sends ADD COLUMN name VARCHAR(255) DEFAULT NULL AFTER email");
    echo "✓ Added name column\n";

    // Add company column if it doesn't exist
    $db->exec("ALTER TABLE campaign_sends ADD COLUMN company VARCHAR(255) DEFAULT NULL AFTER name");
    echo "✓ Added company column\n";

    echo "\nMigration completed successfully!\n";
    echo "campaign_sends table now supports name and company for placeholder substitution.\n";

} catch (PDOException $e) {
    // Check if columns already exist
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Columns already exist. Migration already applied.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
