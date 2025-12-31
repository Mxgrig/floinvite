<?php
/**
 * Admin Mail Configuration
 * Database and SMTP settings
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'u958180753_mail');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'u958180753_mail');

// SMTP Configuration (Hostinger)
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USER', getenv('SMTP_USER') ?: 'admin@floinvite.com');
define('SMTP_PASS', getenv('SMTP_PASS') ?: '');

// Rate Limiting (emails per hour)
define('RATE_LIMIT_PER_HOUR', 100);

// Base URLs
define('BASE_URL', getenv('BASE_URL') ?: 'https://floinvite.com/admin-mail');
define('PUBLIC_URL', getenv('PUBLIC_URL') ?: 'https://floinvite.com');

// API Keys (for security)
define('API_KEY', getenv('API_KEY') ?: '');

// Response Helper
function respond($success, $data = null, $message = null) {
    header('Content-Type: application/json');
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
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => date('c')
    ]);
    exit;
}

// CORS Headers
header('Access-Control-Allow-Origin: ' . PUBLIC_URL);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Connection Function
function get_db() {
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
        return $pdo;
    } catch (PDOException $e) {
        handle_error('Database connection failed: ' . $e->getMessage());
    }
}

?>
