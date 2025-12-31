<?php
/**
 * Floinvite Subscription Status Endpoint
 * Returns user's subscription status from server database
 * ENFORCES payment - cannot be bypassed by client
 *
 * Deployment: Upload to public_html/api/subscription-status.php
 * Usage: GET /api/subscription-status?email=user@example.com
 *
 * Security: Validates email parameter
 */

error_reporting(0);
ini_set('display_errors', 0);

if (ob_get_level()) {
    ob_clean();
}

header('Content-Type: application/json; charset=utf-8');

// Load environment variables from .env file
require_once __DIR__ . '/env.php';

// ═══════════════════════════════════════════════════════════════════════════
// CORS & Security Headers
// ═══════════════════════════════════════════════════════════════════════════

$allowed_origins = [
    'https://floinvite.com',
    'https://www.floinvite.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins) || strpos($origin, 'floinvite.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use GET.']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Database Connection
// ═══════════════════════════════════════════════════════════════════════════

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'u958180753_floinvite';
$db_user = getenv('DB_USER') ?: 'u958180753_floinvite';
$db_pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Get & Validate Email Parameter
// ═══════════════════════════════════════════════════════════════════════════

$email = $_GET['email'] ?? '';

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid email parameter required']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Query User Subscription Status
// ═══════════════════════════════════════════════════════════════════════════

try {
    $stmt = $pdo->prepare('
        SELECT
            tier,
            subscription_status,
            current_period_start,
            current_period_end,
            cancel_at_period_end
        FROM users
        WHERE email = ?
        LIMIT 1
    ');

    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Default response for new users (starter tier, no subscription yet)
    if (!$user) {
        http_response_code(200);
        echo json_encode([
            'tier' => 'starter',
            'status' => 'active',
            'currentPeriodStart' => null,
            'currentPeriodEnd' => null,
            'cancelAtPeriodEnd' => false,
            'isActive' => true
        ]);
        exit;
    }

    if ($user['tier'] === 'professional') {
        $user['tier'] = 'compliance';
    }

    // Check if subscription is currently active
    $now = time();
    $isActive = $user['subscription_status'] === 'active';

    // If subscription period has ended and wasn't renewed, downgrade to starter
    if ($isActive && $user['current_period_end'] && $now > $user['current_period_end']) {
        // Auto-downgrade to starter
        $updateStmt = $pdo->prepare('
            UPDATE users
            SET tier = ?, subscription_status = ?
            WHERE email = ?
        ');
        $updateStmt->execute(['starter', 'active', $email]);
        $isActive = false;
    }

    // Response: Server-controlled subscription status (CANNOT be faked)
    http_response_code(200);
    echo json_encode([
        'tier' => $user['tier'],
        'status' => $user['subscription_status'],
        'currentPeriodStart' => $user['current_period_start'],
        'currentPeriodEnd' => $user['current_period_end'],
        'cancelAtPeriodEnd' => (bool)$user['cancel_at_period_end'],
        'isActive' => $isActive
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
?>
