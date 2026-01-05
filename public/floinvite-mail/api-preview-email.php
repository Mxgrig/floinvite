<?php
/**
 * Email Preview API Endpoint
 * Generates HTML preview for email composition
 *
 * POST /api-preview-email.php
 * Content-Type: application/json
 * {
 *   "greeting": "string",
 *   "body": "string",
 *   "signature": "string",
 *   "template_type": "default|offer",
 *   "sample_name": "string",
 *   "sample_email": "string",
 *   "sample_company": "string",
 *   "sample_host": "string",
 *   "sample_host_email": "string"
 * }
 */

require_once 'config.php';
require_once 'logo.php';

header('Content-Type: application/json; charset=utf-8');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Get JSON data
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        throw new Exception('Invalid JSON input');
    }

    $greeting = $input['greeting'] ?? '';
    $body = $input['body'] ?? '';
    $signature = $input['signature'] ?? '';
    $template_type = $input['template_type'] ?? 'default';
    $sample_name = $input['sample_name'] ?? 'John Smith';
    $sample_email = $input['sample_email'] ?? 'john@example.com';
    $sample_company = $input['sample_company'] ?? 'ABC Corp';
    $sample_host = $input['sample_host'] ?? 'Mary Johnson';
    $sample_host_email = $input['sample_host_email'] ?? 'mary@example.com';

    // Validate inputs
    if (!$greeting || !$body || !$signature) {
        throw new Exception('Greeting, body, and signature are required');
    }

    // Generate HTML using the text-to-HTML converter with template type
    $html = create_email_from_text(
        $greeting,
        $body,
        $signature,
        $sample_name,
        $sample_email,
        $sample_company,
        $sample_host,
        $sample_host_email,
        $template_type
    );

    // Return response with HTML
    respond(true, ['html' => $html], 'Preview generated successfully');

} catch (Exception $e) {
    respond(false, null, 'Error: ' . $e->getMessage());
}
?>
