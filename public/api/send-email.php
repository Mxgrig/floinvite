<?php
/**
 * Floinvite Email API Endpoint
 * Handles visitor notification emails via SMTP (PHPMailer)
 *
 * Deployment: Upload to public_html/api/send-email.php on Hostinger
 *
 * This endpoint accepts POST requests with visitor notification data
 * and sends emails via SMTP authentication (replaces sendmail())
 */

// Load environment variables and PHPMailer helper
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/PHPMailerHelper.php';

// Suppress all warnings/notices to prevent corrupting JSON response
// These MUST be set BEFORE any output
error_reporting(0);
ini_set('display_errors', 0);

// Clear any buffered output from auto_prepend_file or other sources
if (ob_get_level()) {
    ob_clean();
}

// ═══════════════════════════════════════════════════════════════════════════
// CORS & Security Headers
// ═══════════════════════════════════════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');

// CORS - Allow requests from floinvite.com and subdomains
$allowed_origins = [
    'https://floinvite.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins) || strpos($origin, 'floinvite.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 3600');

// Chrome's Private Network Access - Allow preflight requests from public sites
// This header tells Chrome we explicitly allow access from the internet
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS' && isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_PRIVATE_NETWORK'])) {
    header('Access-Control-Allow-Private-Network: true');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. Use POST.'
    ]);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

// Email addresses for different purposes
define('NOTIFICATION_EMAIL', 'notification@floinvite.com');
define('ADMIN_EMAIL', 'admin@floinvite.com');
define('NOTIFICATION_FROM_NAME', 'Floinvite Guest Management');
define('ADMIN_FROM_NAME', 'Floinvite Admin');

// Rate limiting: 10 emails per minute per IP
define('RATE_LIMIT_EMAILS', 10);
define('RATE_LIMIT_WINDOW', 60); // seconds

// ═══════════════════════════════════════════════════════════════════════════
// Request Parsing
// ═══════════════════════════════════════════════════════════════════════════

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON payload'
    ]);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

$errors = [];

// Required fields
if (empty($input['to'])) {
    $errors[] = 'Recipient email (to) is required';
}

if (empty($input['subject'])) {
    $errors[] = 'Email subject is required';
}

if (empty($input['body'])) {
    $errors[] = 'Email body is required';
}

// Validate email format
if (!empty($input['to']) && !filter_var($input['to'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid recipient email address';
}

// Check for suspicious content (basic spam detection)
$body = (string)$input['body'];
if (strlen($body) > 10000) {
    $errors[] = 'Email body too long (max 10000 characters)';
}

// Rate limiting check
$client_ip = $_SERVER['REMOTE_ADDR'];
$rate_limit_key = "floinvite_email_rate_{$client_ip}";
$cache_file = sys_get_temp_dir() . "/{$rate_limit_key}";

if (file_exists($cache_file)) {
    $data = unserialize(file_get_contents($cache_file));
    if (time() - $data['timestamp'] < RATE_LIMIT_WINDOW) {
        if ($data['count'] >= RATE_LIMIT_EMAILS) {
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'error' => 'Rate limit exceeded. Maximum ' . RATE_LIMIT_EMAILS . ' emails per minute.'
            ]);
            exit;
        }
        $data['count']++;
    } else {
        $data = ['count' => 1, 'timestamp' => time()];
    }
    file_put_contents($cache_file, serialize($data));
} else {
    file_put_contents($cache_file, serialize(['count' => 1, 'timestamp' => time()]));
}

// Return validation errors
if (count($errors) > 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'errors' => $errors
    ]);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Email Sending
// ═══════════════════════════════════════════════════════════════════════════

// Determine email type (default: 'notification')
$email_type = isset($input['emailType']) ? strtolower($input['emailType']) : 'notification';

// Select appropriate email and name based on type
if ($email_type === 'admin') {
    $from_email = ADMIN_EMAIL;
    $from_name = ADMIN_FROM_NAME;
} else {
    // Default to notification email for all other types
    $from_email = NOTIFICATION_EMAIL;
    $from_name = NOTIFICATION_FROM_NAME;
}

$to = filter_var($input['to'], FILTER_VALIDATE_EMAIL);
$subject = substr(htmlspecialchars($input['subject'], ENT_QUOTES, 'UTF-8'), 0, 200);
$body = $input['body']; // Don't escape HTML - let it pass through

// Send email using SMTP (PHPMailer)
$response = [];
try {
    $mailer = new PHPMailerHelper();
    $result = $mailer->send([
        'to' => $to,
        'subject' => $subject,
        'body' => $body,
        'fromEmail' => $from_email,
        'fromName' => $from_name
    ]);

    if ($result['success']) {
        http_response_code(200);
        $response = [
            'success' => true,
            'message' => 'Email sent successfully',
            'to' => $to,
            'timestamp' => date('c')
        ];
    } else {
        http_response_code(500);
        $response = [
            'success' => false,
            'error' => $result['error'] ?? 'Failed to send email',
            'details' => 'Check SMTP configuration in .env file'
        ];
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = [
        'success' => false,
        'error' => 'SMTP Error: ' . $e->getMessage(),
        'details' => 'Check SMTP credentials in .env file'
    ];
}

// Encode and output JSON (always safe)
$json = json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if ($json === false) {
    // Fallback if JSON encoding fails
    http_response_code(500);
    echo '{"success":false,"error":"JSON encoding failed"}';
} else {
    echo $json;
}

// ═══════════════════════════════════════════════════════════════════════════
// Logging
// ═══════════════════════════════════════════════════════════════════════════

// Log all email requests for debugging
$log_file = '/tmp/floinvite_email.log';
$success = $response['success'] ?? false;
$log_entry = date('Y-m-d H:i:s') . " | " . ($success ? 'SUCCESS' : 'FAILED') . " | Type: " . $email_type . " | From: " . $from_name . " <" . $from_email . "> | To: " . $to . " | Subject: " . $subject . " | Method: SMTP\n";
if (!$success && isset($response['error'])) {
    $log_entry = str_replace("\n", " | Error: " . $response['error'] . "\n", $log_entry);
}
@file_put_contents($log_file, $log_entry, FILE_APPEND);
?>
