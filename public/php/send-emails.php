<?php
/**
 * Email Marketing Backend
 * Handles sending marketing emails via Hostinger SMTP
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to client

// Allow CORS from same origin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid JSON input']);
  exit();
}

$action = $input['action'] ?? '';
$recipients = $input['recipients'] ?? [];
$subject = $input['subject'] ?? '';
$fromName = $input['fromName'] ?? 'Floinvite';
$htmlBody = $input['htmlBody'] ?? '';

// Validate input
if (!$action || !$recipients || !$subject || !$htmlBody) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing required fields']);
  exit();
}

if ($action !== 'send') {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid action']);
  exit();
}

// Hostinger SMTP configuration
// These are standard Hostinger SMTP settings
// You may need to update these based on your Hostinger account
$smtpHost = 'smtp.hostinger.com';
$smtpPort = 465; // SSL
$smtpUser = getenv('SMTP_USER') ?: 'your-email@floinvite.com'; // Set via environment variable
$smtpPass = getenv('SMTP_PASS') ?: ''; // Set via environment variable

// Use mail() function as fallback (more reliable on Hostinger)
$fromEmail = $smtpUser ?: 'admin@floinvite.com';

$success = 0;
$failed = 0;
$errors = [];

// Send emails to each recipient
foreach ($recipients as $recipient) {
  $email = $recipient['email'] ?? '';
  $name = $recipient['name'] ?? '';

  // Validate email
  if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $failed++;
    $errors[] = [
      'email' => $email,
      'error' => 'Invalid email address'
    ];
    continue;
  }

  // Prepare personalized content
  $personalizedBody = str_replace(
    ['{name}', '{company}'],
    [$name ?: 'Friend', $recipient['company'] ?? 'your organization'],
    $htmlBody
  );

  // Prepare headers
  $headers = "MIME-Version: 1.0\r\n";
  $headers .= "Content-type: text/html; charset=UTF-8\r\n";
  $headers .= "From: {$fromName} <{$fromEmail}>\r\n";
  $headers .= "Reply-To: {$fromEmail}\r\n";

  // Send email using mail()
  if (@mail($email, $subject, $personalizedBody, $headers)) {
    $success++;
  } else {
    $failed++;
    $errors[] = [
      'email' => $email,
      'error' => 'Failed to send (mail function)'
    ];
  }

  // Add small delay to avoid rate limiting
  usleep(100000); // 100ms delay between emails
}

// Return results
http_response_code(200);
echo json_encode([
  'success' => $success,
  'failed' => $failed,
  'errors' => array_slice($errors, 0, 10) // Return first 10 errors only
]);
?>
