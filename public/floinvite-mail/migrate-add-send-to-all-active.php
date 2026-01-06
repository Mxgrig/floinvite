<?php
/**
 * Add send_to_all_active column to campaigns table
 * This column allows campaigns to auto-include all active subscribers
 */

require_once 'config.php';

try {
    $db = get_db();
    
    // Check if column already exists
    $stmt = $db->prepare("SHOW COLUMNS FROM campaigns LIKE 'send_to_all_active'");
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        echo "Column 'send_to_all_active' already exists. Skipping migration.\n";
        exit(0);
    }
    
    // Add the column
    $db->exec("ALTER TABLE campaigns ADD COLUMN send_to_all_active TINYINT(1) DEFAULT 0 AFTER send_method");
    
    echo "Migration complete: Added 'send_to_all_active' column to campaigns table\n";
    exit(0);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
