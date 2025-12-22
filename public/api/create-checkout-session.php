<?php
/**
 * Floinvite Stripe Checkout Session Creator
 * Creates Stripe checkout sessions for subscription purchases
 *
 * Deployment: Upload to public_html/api/create-checkout-session.php on Hostinger
 */

// Suppress warnings/notices
error_reporting(0);
ini_set('display_errors', 0);

if (ob_get_level()) {
    ob_clean();
}

// Load environment variables from .env file
require_once __DIR__ . '/env.php';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration & Security Headers
// ═══════════════════════════════════════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');

// CORS - Allow requests from floinvite.com and subdomains
$allowed_origins = [
    'https://floinvite.com',
    'https://www.floinvite.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins) || strpos($origin, 'floinvite.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

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
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Stripe Configuration - Load from environment
// ═══════════════════════════════════════════════════════════════════════════

$stripe_secret_key = getenv('STRIPE_SECRET_KEY');
if (!$stripe_secret_key) {
    http_response_code(500);
    echo json_encode(['error' => 'Stripe configuration missing']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Request Parsing & Validation
// ═══════════════════════════════════════════════════════════════════════════

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

// Validate required fields
$errors = [];

if (empty($input['priceId']) && empty($input['customAmount'])) {
    $errors[] = 'Either priceId or customAmount is required';
}

if (empty($input['tierId'])) {
    $errors[] = 'tierId is required (starter, professional, enterprise)';
}

if (empty($input['customerEmail'])) {
    $errors[] = 'customerEmail is required';
}

if (!filter_var($input['customerEmail'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid customer email address';
}

// Validate custom amount if provided
if (!empty($input['customAmount'])) {
    if (!is_numeric($input['customAmount']) || $input['customAmount'] < 100) {
        $errors[] = 'Custom amount must be at least $1.00 (100 cents)';
    }
}

if (count($errors) > 0) {
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Create Stripe Checkout Session
// ═══════════════════════════════════════════════════════════════════════════

try {
    // Use cURL to call Stripe API (avoiding external libraries)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret_key . ':');

    // Build line items
    $line_items = [];

    if (!empty($input['customAmount'])) {
        // Custom amount (for enterprise or special pricing)
        $line_items[] = [
            'price_data' => [
                'currency' => 'usd',
                'product_data' => [
                    'name' => 'Floinvite ' . ucfirst($input['tierId']) . ' Plan',
                    'description' => 'Custom pricing subscription'
                ],
                'recurring' => [
                    'interval' => $input['billingCycle'] ?? 'month',
                    'interval_count' => 1
                ],
                'unit_amount' => (int)$input['customAmount']
            ],
            'quantity' => 1
        ];
    } else {
        // Standard price ID
        $line_items[] = [
            'price' => $input['priceId'],
            'quantity' => 1
        ];
    }

    // Prepare POST data
    $post_data = [
        'payment_method_types[0]' => 'card',
        'mode' => 'subscription',
        'customer_email' => $input['customerEmail'],
        'success_url' => 'https://floinvite.com/app/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => 'https://floinvite.com/pricing?checkout=canceled',
        'metadata[tierId]' => $input['tierId'],
        'metadata[billingCycle]' => $input['billingCycle'] ?? 'month',
        'metadata[customAmount]' => $input['customAmount'] ?? '0'
    ];

    // Add line items
    foreach ($line_items as $i => $item) {
        if (isset($item['price'])) {
            $post_data["line_items[$i][price]"] = $item['price'];
            $post_data["line_items[$i][quantity]"] = $item['quantity'];
        } else {
            $pd = $item['price_data'];
            $post_data["line_items[$i][price_data][currency]"] = $pd['currency'];
            $post_data["line_items[$i][price_data][product_data][name]"] = $pd['product_data']['name'];
            $post_data["line_items[$i][price_data][product_data][description]"] = $pd['product_data']['description'];
            $post_data["line_items[$i][price_data][recurring][interval]"] = $pd['recurring']['interval'];
            $post_data["line_items[$i][price_data][recurring][interval_count]"] = $pd['recurring']['interval_count'];
            $post_data["line_items[$i][price_data][unit_amount]"] = $pd['unit_amount'];
            $post_data["line_items[$i][quantity]"] = $item['quantity'];
        }
    }

    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true);

    if ($http_code !== 200) {
        http_response_code($http_code);
        echo json_encode([
            'error' => $data['error']['message'] ?? 'Failed to create checkout session',
            'type' => $data['error']['type'] ?? 'unknown_error'
        ]);
        exit;
    }

    // Success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'sessionId' => $data['id'],
        'url' => $data['url'],
        'tierId' => $input['tierId']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
