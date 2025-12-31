<?php
/**
 * Floinvite Mail Configuration
 * Database and SMTP settings for email marketing system
 */

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Load environment variables
require_once dirname(dirname(__DIR__)) . '/public/api/env.php';

// Database Configuration (Email Marketing System)
define('DB_HOST', getenv('DB_HOST_MAIL') ?: getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER_MAIL') ?: getenv('DB_USER') ?: 'u958180753_mail');
define('DB_PASS', getenv('DB_PASS_MAIL') ?: getenv('DB_PASS') ?: 'floinvit3_Mail#');
define('DB_NAME', getenv('DB_NAME_MAIL') ?: getenv('DB_NAME') ?: 'u958180753_mail');

// SMTP Configuration (Hostinger)
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.hostinger.com');
define('SMTP_PORT', getenv('SMTP_PORT') ?: 465);
define('SMTP_USER', getenv('SMTP_USER') ?: 'admin@floinvite.com');
define('SMTP_PASS', getenv('SMTP_PASS') ?: '');

// Rate Limiting
define('RATE_LIMIT_PER_HOUR', 100);
define('BATCH_SIZE', 50);

// Base URLs
define('BASE_URL', getenv('BASE_URL') ?: 'https://floinvite.com/floinvite-mail');
define('PUBLIC_URL', getenv('PUBLIC_URL') ?: 'https://floinvite.com');

// Session Configuration
session_start();
define('SESSION_TIMEOUT', 3600); // 1 hour

// Response Helper
function respond($success, $data = null, $message = null) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($success ? 200 : 400);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'timestamp' => date('c')
    ]);
    exit;
}

// Error Handler
function handle_error($message, $code = 500) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => date('c')
    ]);
    exit;
}

// Database Connection
function get_db() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 5
                ]
            );
        } catch (PDOException $e) {
            // Log detailed error for debugging
            error_log("Mail DB Connection Error: Host=" . DB_HOST . ", User=" . DB_USER . ", DB=" . DB_NAME . ", Error: " . $e->getMessage());
            handle_error('Database connection failed');
        }
    }

    return $pdo;
}

// Authentication Check
function require_auth() {
    // Check if session is set and valid
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        header('Location: login.php');
        exit;
    }

    // Check session timeout
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT)) {
        session_destroy();
        header('Location: login.php');
        exit;
    }

    $_SESSION['last_activity'] = time();
}

// Generate Tracking ID
function generate_tracking_id() {
    return bin2hex(random_bytes(16));
}

// Generate Unsubscribe Token
function generate_unsubscribe_token() {
    return bin2hex(random_bytes(32));
}

// Validate Email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Log Activity
function log_activity($action, $details = []) {
    $file = __DIR__ . '/logs/activity.log';
    if (!is_dir(__DIR__ . '/logs')) {
        mkdir(__DIR__ . '/logs', 0755, true);
    }

    $log = [
        'timestamp' => date('c'),
        'action' => $action,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'details' => $details
    ];

    file_put_contents($file, json_encode($log) . "\n", FILE_APPEND);
}

// CORS Headers
header('Access-Control-Allow-Origin: ' . PUBLIC_URL);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

?>
