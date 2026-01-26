<?php
/**
 * Add attachments support to campaigns table
 */

require_once 'config.php';

$db = get_db();

// Check if attachments column exists
$result = $db->query("SHOW COLUMNS FROM campaigns LIKE 'attachments'");
if ($result && $result->num_rows > 0) {
    echo "✓ attachments column already exists\n";
    exit;
}

// Add attachments column to store JSON metadata
$sql = "ALTER TABLE campaigns ADD COLUMN attachments JSON DEFAULT NULL AFTER html_body";

if ($db->query($sql)) {
    echo "✓ Successfully added attachments column to campaigns table\n";
} else {
    echo "✗ Error adding attachments column: " . $db->error . "\n";
}

// Create attachments directory if it doesn't exist
$upload_dir = __DIR__ . '/uploads/attachments';
if (!is_dir($upload_dir)) {
    if (mkdir($upload_dir, 0755, true)) {
        echo "✓ Created /uploads/attachments directory\n";
    } else {
        echo "✗ Failed to create /uploads/attachments directory\n";
    }
}

// Create .htaccess to block direct access
$htaccess_content = "Deny from all\n";
if (file_put_contents($upload_dir . '/.htaccess', $htaccess_content)) {
    echo "✓ Created .htaccess to protect uploads\n";
} else {
    echo "✗ Warning: Could not create .htaccess\n";
}

?>
