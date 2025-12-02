<?php
/**
 * Floinvite Email API Endpoint
 * Handles visitor notification emails via Hostinger email
 * 
 * Deployment: Upload to public_html/api/send-email.php on Hostinger
 * 
 * This endpoint accepts POST requests with visitor notification data
 * and sends emails via Hostinger's mail system.
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORS & Security Headers
// ═══════════════════════════════════════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://floinvite.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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
define('NOTIFICATION_FROM_NAME', 'Floinvite Reception');
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
$body = htmlspecialchars($input['body'], ENT_QUOTES, 'UTF-8');

// Email headers
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "From: " . $from_name . " <" . $from_email . ">\r\n";
$headers .= "Reply-To: " . $from_email . "\r\n";
$headers .= "X-Mailer: Floinvite/1.0\r\n";

// Additional headers for better deliverability
$headers .= "X-Priority: 3\r\n";
$headers .= "Importance: Normal\r\n";

// Send email using PHP mail() function
// Note: For better reliability, consider upgrading to PHPMailer + SMTP
$success = mail($to, $subject, $body, $headers);

if ($success) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully',
        'to' => $to,
        'timestamp' => date('c')
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email. Please contact support.',
        'details' => 'Mail function returned false. Check Hostinger email configuration.'
    ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// Logging (Optional)
// ═══════════════════════════════════════════════════════════════════════════

// Uncomment to enable logging:
/*
$log_file = __DIR__ . '/../../logs/email.log';
$log_entry = date('Y-m-d H:i:s') . " | " . ($success ? 'SUCCESS' : 'FAILED') . " | To: " . $to . " | Subject: " . $subject . "\n";
@file_put_contents($log_file, $log_entry, FILE_APPEND);
*/
?>
