<?php
/**
 * Migration: Add processing and retry fields to send_queue
 * Enables atomic queue claiming and retry backoff.
 */

require_once 'config.php';

$db = get_db();

try {
    echo "Starting migration...\n";

    $db->query("ALTER TABLE send_queue ADD COLUMN processing_token VARCHAR(64) DEFAULT NULL AFTER status");
    echo "✓ Added processing_token column\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "✓ processing_token already exists\n";
    } else {
        throw $e;
    }
}

try {
    $db->query("ALTER TABLE send_queue ADD COLUMN processing_started_at DATETIME DEFAULT NULL AFTER processing_token");
    echo "✓ Added processing_started_at column\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "✓ processing_started_at already exists\n";
    } else {
        throw $e;
    }
}

try {
    $db->query("ALTER TABLE send_queue ADD COLUMN next_attempt_at DATETIME DEFAULT NULL AFTER max_attempts");
    echo "✓ Added next_attempt_at column\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "✓ next_attempt_at already exists\n";
    } else {
        throw $e;
    }
}

echo "\nMigration completed successfully!\n";
?>
