<?php
/**
 * Floinvite Database Setup & Initialization
 * Creates MySQL tables for payment enforcement and subscription management
 *
 * Deployment: Run once on Hostinger via SSH or browser access
 * Usage: curl https://floinvite.com/api/db-setup.php?action=create
 *
 * SECURITY: Protect this file in production (require admin token)
 */

error_reporting(0);
ini_set('display_errors', 0);

if (ob_get_level()) {
    ob_clean();
}

header('Content-Type: application/json; charset=utf-8');

// ═══════════════════════════════════════════════════════════════════════════
// Database Configuration
// ═══════════════════════════════════════════════════════════════════════════

// Hostinger cPanel MySQL credentials
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'u958180753_floinvite';
$db_user = getenv('DB_USER') ?: 'u958180753_floinvite';
$db_pass = getenv('DB_PASS') ?: '';

// Try to connect
try {
    $pdo = new PDO(
        "mysql:host=$db_host",
        $db_user,
        $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name`");
    $pdo->exec("USE `$db_name`");

} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage(),
        'config' => [
            'host' => $db_host,
            'database' => $db_name,
            'user' => $db_user
        ]
    ]));
}

// ═══════════════════════════════════════════════════════════════════════════
// Create Tables
// ═══════════════════════════════════════════════════════════════════════════

$action = $_GET['action'] ?? 'status';
$result = [];

try {
    // Table 1: Users (for payment tracking)
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        tier ENUM('starter', 'professional', 'enterprise') DEFAULT 'starter',
        subscription_status ENUM('active', 'past_due', 'canceled', 'unpaid') DEFAULT 'active',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        current_period_start BIGINT,
        current_period_end BIGINT,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (email),
        INDEX (stripe_customer_id),
        INDEX (tier)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $result['users_table'] = 'created/exists';

    // Table 2: Usage Tracking (for limit enforcement)
    $pdo->exec("CREATE TABLE IF NOT EXISTS usage_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        action_type ENUM('host_added', 'host_deleted', 'guest_checkin', 'guest_checkout') NOT NULL,
        count_after INT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
        INDEX (user_email),
        INDEX (timestamp),
        INDEX (action_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $result['usage_tracking_table'] = 'created/exists';

    // Table 3: Check-in Log (for audit trail)
    $pdo->exec("CREATE TABLE IF NOT EXISTS checkin_log (
        id VARCHAR(36) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255),
        host_id VARCHAR(36),
        host_name VARCHAR(255),
        checkin_time TIMESTAMP,
        checkout_time TIMESTAMP NULL,
        status ENUM('checked_in', 'checked_out', 'no_show') DEFAULT 'checked_in',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
        INDEX (user_email),
        INDEX (checkin_time),
        INDEX (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $result['checkin_log_table'] = 'created/exists';

    // Table 4: Payment Records (for audit)
    $pdo->exec("CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        stripe_charge_id VARCHAR(255) UNIQUE,
        stripe_invoice_id VARCHAR(255) UNIQUE,
        amount_cents INT NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status ENUM('succeeded', 'pending', 'failed') DEFAULT 'pending',
        tier ENUM('starter', 'professional', 'enterprise'),
        billing_period_start BIGINT,
        billing_period_end BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
        INDEX (user_email),
        INDEX (status),
        INDEX (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $result['payments_table'] = 'created/exists';

    // Table 5: Webhook Events (for debugging)
    $pdo->exec("CREATE TABLE IF NOT EXISTS webhook_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(255) NOT NULL,
        stripe_event_id VARCHAR(255) UNIQUE,
        payload LONGTEXT,
        processed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (event_type),
        INDEX (stripe_event_id),
        INDEX (processed)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $result['webhook_events_table'] = 'created/exists';

    // Table 6: Failed Payments (for retry logic)
    $pdo->exec("CREATE TABLE IF NOT EXISTS failed_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        error_message TEXT,
        error_code VARCHAR(50),
        retry_count INT DEFAULT 0,
        next_retry_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
        INDEX (user_email),
        INDEX (retry_count)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $result['failed_payments_table'] = 'created/exists';

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'All tables created/verified successfully',
        'tables' => $result
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'tables' => $result
    ]);
}
?>
