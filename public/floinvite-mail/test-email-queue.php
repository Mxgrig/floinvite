<?php
/**
 * Email Queue Diagnostic Tool
 * Tests email queue status and identifies issues
 */

require_once 'config.php';
require_once '../api/PHPMailerHelper.php';

header('Content-Type: text/plain; charset=utf-8');

// Test 1: Database Connection
echo "=== TEST 1: Database Connection ===\n";
try {
    $db = get_db();
    echo "✓ Database connected\n\n";
} catch (Exception $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: SMTP Configuration
echo "=== TEST 2: SMTP Configuration ===\n";
echo "SMTP Host: " . SMTP_HOST . "\n";
echo "SMTP Port: " . SMTP_PORT . "\n";
echo "SMTP User: " . SMTP_USER . "\n";
echo "SMTP Pass: " . (empty(SMTP_PASS) ? "NOT SET" : "***") . "\n";

if (empty(SMTP_PASS)) {
    echo "✗ SMTP password not configured!\n\n";
} else {
    echo "✓ SMTP credentials appear configured\n\n";
}

// Test 3: PHPMailer Connection Test
echo "=== TEST 3: SMTP Connection Test ===\n";
try {
    $mailer = new PHPMailerHelper();
    $result = $mailer->testConnection();
    echo ($result['success'] ? "✓" : "✗") . " " . $result['message'] . "\n\n";
} catch (Exception $e) {
    echo "✗ PHPMailerHelper error: " . $e->getMessage() . "\n\n";
}

// Test 4: Campaign Queue Status
echo "=== TEST 4: Campaign Queue Status ===\n";
$stmt = $db->prepare("
    SELECT 
        c.id,
        c.name,
        c.status,
        c.recipient_count,
        c.sent_count,
        c.failed_count,
        COUNT(q.id) as queue_count,
        SUM(CASE WHEN q.status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN q.status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM campaigns c
    LEFT JOIN send_queue q ON c.id = q.campaign_id
    WHERE c.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY c.id
    ORDER BY c.created_at DESC
");
$stmt->execute();
$campaigns = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

if (empty($campaigns)) {
    echo "No campaigns found in last 7 days\n\n";
} else {
    foreach ($campaigns as $c) {
        echo "Campaign #{$c['id']}: {$c['name']}\n";
        echo "  Status: {$c['status']}\n";
        echo "  Recipients: {$c['recipient_count']} | Sent: {$c['sent_count']} | Failed: {$c['failed_count']}\n";
        echo "  Queue: {$c['queue_count']} total | Queued: {$c['queued']} | Failed: {$c['failed']}\n\n";
    }
}

// Test 5: Sample Error Messages
echo "=== TEST 5: Recent Error Messages ===\n";
$stmt = $db->prepare("
    SELECT id, campaign_id, email, error_message, attempts, max_attempts, updated_at
    FROM send_queue
    WHERE status = 'failed'
    ORDER BY updated_at DESC
    LIMIT 10
");
$stmt->execute();
$failed = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

if (empty($failed)) {
    echo "No failed emails in queue\n\n";
} else {
    foreach ($failed as $f) {
        echo "Queue #{$f['id']} - Campaign {$f['campaign_id']}\n";
        echo "  Email: {$f['email']}\n";
        echo "  Error: {$f['error_message']}\n";
        echo "  Attempts: {$f['attempts']}/{$f['max_attempts']}\n";
        echo "  Updated: {$f['updated_at']}\n\n";
    }
}

// Test 6: Queued Emails
echo "=== TEST 6: Queued Emails (Ready to Send) ===\n";
$stmt = $db->prepare("
    SELECT COUNT(*) as count
    FROM send_queue
    WHERE status = 'queued'
    AND campaign_id IN (SELECT id FROM campaigns WHERE status IN ('sending', 'scheduled'))
");
$stmt->execute();
$queued = $stmt->get_result()->fetch_assoc();
echo "Queued emails ready to send: {$queued['count']}\n\n";

echo "=== DIAGNOSTIC COMPLETE ===\n";
?>
