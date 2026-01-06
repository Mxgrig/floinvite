<?php
/**
 * Floinvite Mail Configuration
 * Database and SMTP settings for email marketing system
 */

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/error_log');

// Load environment variables - use relative path from floinvite-mail to api
require_once __DIR__ . '/../api/env.php';

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
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_samesite', 'Lax');
    $secure_cookie = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    ini_set('session.cookie_secure', $secure_cookie ? 1 : 0);
    session_start();
}
define('SESSION_TIMEOUT', 3600); // 1 hour

if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: same-origin');
}

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

// Replace Email Template Placeholders
function replace_template_placeholders($html, $name = '', $email = '', $company = '', $unsubscribe_token = '') {
    // Replace personalization placeholders
    $html = str_replace('{name}', htmlspecialchars($name ?: $email), $html);
    $html = str_replace('{email}', htmlspecialchars($email), $html);
    $html = str_replace('{company}', htmlspecialchars($company ?: ''), $html);
    $html = str_replace('{unsubscribe_token}', htmlspecialchars($unsubscribe_token), $html);

    return $html;
}

// Convert Plain Text to HTML Email Format
// Handles greeting + body + signature sections
function create_email_from_text($greeting = '', $body = '', $signature = '', $name = '', $email = '', $company = '', $host_name = '', $host_email = '', $template_type = 'default') {
    // Get logo URL
    $logo_url = get_logo_url(PUBLIC_URL);
    $public_url = PUBLIC_URL;
    $base_url = BASE_URL;

    // Replace visitor/host placeholders in greeting and signature
    $greeting = str_replace('{visitor_name}', htmlspecialchars($name ?: $email), $greeting);
    $greeting = str_replace('{visitor_email}', htmlspecialchars($email), $greeting);
    $greeting = str_replace('{visitor_company}', htmlspecialchars($company ?: ''), $greeting);
    $greeting = str_replace('{host_name}', htmlspecialchars($host_name), $greeting);
    $greeting = str_replace('{host_email}', htmlspecialchars($host_email), $greeting);

    $signature = str_replace('{visitor_name}', htmlspecialchars($name ?: $email), $signature);
    $signature = str_replace('{visitor_email}', htmlspecialchars($email), $signature);
    $signature = str_replace('{visitor_company}', htmlspecialchars($company ?: ''), $signature);
    $signature = str_replace('{host_name}', htmlspecialchars($host_name), $signature);
    $signature = str_replace('{host_email}', htmlspecialchars($host_email), $signature);

    // Convert body plain text to HTML
    // Split by double line breaks (paragraphs)
    $body = trim($body);
    $paragraphs = preg_split('/\n\s*\n/', $body);
    $body_html = '';
    foreach ($paragraphs as $para) {
        if (trim($para)) {
            // Convert URLs to links, then preserve line breaks
            $para_html = linkify_plain_text($para);
            $para_html = str_replace("\n", "<br>\n", $para_html);
            $body_html .= "<p>" . $para_html . "</p>\n";
        }
    }

    // For offer template, return special HTML with red hero section
    if ($template_type === 'offer') {
        if (function_exists('create_offer_email_html')) {
            return create_offer_email_html($logo_url, $greeting, $body_html, $signature, $public_url, $base_url);
        }
    }

    // Build complete email HTML with template styling
    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f8f9fa;
            line-height: 1.5;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-collapse: collapse;
        }
        .header {
            padding: 32px 32px 24px;
            border-bottom: 3px solid #4338ca;
            text-align: left;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }
        .logo-section img {
            height: 32px;
            width: auto;
        }
        .brand-wordmark {
            display: inline-flex;
            align-items: baseline;
            gap: 0;
            font-weight: 800;
            letter-spacing: -0.3px;
            line-height: 1;
            text-transform: lowercase;
        }
        .brand-wordmark-flo {
            color: #4338ca;
        }
        .brand-wordmark-invite {
            color: #10b981;
        }
        .company-name {
            font-size: 18px;
            font-weight: 600;
            color: #111;
            margin: 0;
        }
        .content {
            padding: 32px;
            color: #333;
        }
        .greeting {
            font-size: 16px;
            margin: 0 0 24px 0;
            font-weight: 500;
        }
        .body {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .body p {
            margin: 0 0 16px 0;
        }
        .body p:last-child {
            margin-bottom: 0;
        }
        .signature {
            font-size: 14px;
            color: #666;
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            white-space: pre-wrap;
        }
        .footer {
            padding: 24px 32px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #666;
            line-height: 1.6;
        }
        .footer p {
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #4338ca;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 600px) {
            .email-container { width: 100% !important; }
            .header { padding: 24px 20px 16px; }
            .content { padding: 24px 20px; }
            .footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-section">
                <img src="$logo_url" alt="floinvite">
                <div class="company-name"><span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></div>
            </div>
        </div>
        <div class="content">
            <div class="greeting">$greeting</div>
            <div class="body">$body_html</div>
            <div class="signature">$signature</div>
        </div>
        <div class="footer">
            <p><strong><span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></strong><br>Professional Visitor Management</p>
            <p><a href="$base_url/unsubscribe.php?token={unsubscribe_token}">Unsubscribe</a> | <a href="$public_url/contact">Contact Us</a></p>
        </div>
    </div>
</body>
</html>
HTML;

    return $html;
}

// Convert plain text to HTML with clickable links
function linkify_plain_text($text) {
    $pattern = '/\bhttps?:\/\/[^\s<>()]+/i';
    $result = '';
    $offset = 0;

    if (preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE)) {
        foreach ($matches[0] as $match) {
            $url = $match[0];
            $pos = $match[1];
            $result .= htmlspecialchars(substr($text, $offset, $pos - $offset));
            $safe_url = htmlspecialchars($url);
            $result .= '<a href="' . $safe_url . '" target="_blank" rel="noopener noreferrer">' . $safe_url . '</a>';
            $offset = $pos + strlen($url);
        }
    }

    $result .= htmlspecialchars(substr($text, $offset));
    return $result;
}

// Create Offer Email HTML with Red Hero Section
function create_offer_email_html($logo_url, $greeting, $body_html, $signature, $public_url, $base_url) {
    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f8f9fa;
            line-height: 1.5;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
        }
        .header {
            padding: 24px 32px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-section img {
            height: 32px;
            width: auto;
        }
        .brand-wordmark {
            display: inline-flex;
            align-items: baseline;
            gap: 0;
            font-weight: 800;
            letter-spacing: -0.3px;
            line-height: 1;
            text-transform: lowercase;
        }
        .brand-wordmark-flo {
            color: #4338ca;
        }
        .brand-wordmark-invite {
            color: #10b981;
        }
        .company-name {
            font-size: 18px;
            font-weight: 600;
            color: #111;
            margin: 0;
        }
        .hero {
            background: #dc2626;
            color: white;
            padding: 48px 32px;
            text-align: center;
        }
        .hero h1 {
            font-size: 32px;
            margin: 0 0 12px 0;
            font-weight: 700;
            line-height: 1.2;
        }
        .hero p {
            font-size: 18px;
            margin: 0 0 28px 0;
            opacity: 0.95;
        }
        .hero .cta {
            display: inline-block;
            background: white;
            color: #dc2626;
            padding: 14px 40px;
            text-decoration: none;
            font-weight: 700;
            border-radius: 4px;
            font-size: 16px;
            border: none;
            cursor: pointer;
        }
        .hero .cta:hover {
            background: #f3f4f6;
        }
        .badge {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .content {
            padding: 32px;
            color: #333;
        }
        .greeting {
            font-size: 16px;
            margin: 0 0 24px 0;
            font-weight: 500;
        }
        .body {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .body p {
            margin: 0 0 16px 0;
        }
        .body p:last-child {
            margin-bottom: 0;
        }
        .signature {
            font-size: 14px;
            color: #666;
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            white-space: pre-wrap;
        }
        .footer {
            padding: 24px 32px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #666;
            line-height: 1.6;
        }
        .footer p {
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #4338ca;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 600px) {
            .email-container { width: 100% !important; }
            .header { padding: 20px; }
            .hero { padding: 36px 20px; }
            .hero h1 { font-size: 28px; }
            .content { padding: 24px 20px; }
            .footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-section">
                <img src="$logo_url" alt="floinvite">
                <div class="company-name"><span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></div>
            </div>
        </div>
        <div class="hero">
            <div class="badge">Special Offer</div>
            <h1>Exclusive Offer For You!</h1>
            <p>Limited time opportunity - don't miss out</p>
            <a href="$public_url" class="cta" target="_blank">Claim Offer Now</a>
        </div>
        <div class="content">
            <div class="greeting">$greeting</div>
            <div class="body">$body_html</div>
            <div class="signature">$signature</div>
        </div>
        <div class="footer">
            <p><strong><span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span></strong><br>Professional Visitor Management</p>
            <p><a href="$base_url/unsubscribe.php?token={unsubscribe_token}">Unsubscribe</a> | <a href="$public_url/contact">Contact Us</a></p>
        </div>
    </div>
</body>
</html>
HTML;

    return $html;
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
