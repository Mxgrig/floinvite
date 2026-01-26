<?php
/**
 * Migration: Add campaign recipients table for custom send lists
 */

require_once 'config.php';

$db = get_db();

try {
    echo "Starting migration...\n";

    $db->query("
        CREATE TABLE IF NOT EXISTS campaign_recipients (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            campaign_id BIGINT NOT NULL,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            company VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_campaign_email (campaign_id, email),
            INDEX idx_campaign (campaign_id),
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    echo "✓ Created campaign_recipients table\n";
    echo "\nMigration completed successfully!\n";
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
