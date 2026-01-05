<?php
/**
 * Migration: Add greeting and signature columns to campaigns table
 * Allows users to create emails with structured sections (greeting + body + signature)
 */

require_once 'config.php';

$db = get_db();

try {
    echo "Starting migration...\n";

    // Add greeting column (text greeting with placeholders)
    $db->exec("ALTER TABLE campaigns ADD COLUMN greeting LONGTEXT DEFAULT NULL AFTER html_body");
    echo "✓ Added greeting column\n";

    // Add signature column (text signature with placeholders)
    $db->exec("ALTER TABLE campaigns ADD COLUMN signature LONGTEXT DEFAULT NULL AFTER greeting");
    echo "✓ Added signature column\n";

    echo "\nMigration completed successfully!\n";
    echo "campaigns table now supports structured email format: greeting + body + signature\n";

} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Columns already exist. Migration already applied.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
