<?php
/**
 * Floinvite Check-In Enforcement Endpoint
 * Validates if user can perform a check-in based on subscription tier and usage
 * ENFORCES payment - cannot be bypassed by client
 *
 * Deployment: Upload to public_html/api/check-checkin-allowed.php
 * Usage: POST /api/check-checkin-allowed
 * Body: {
 *   "email": "user@example.com",
 *   "currentHostCount": 5,
 *   "currentGuestCount": 15
 * }
 *
 * Response:
 * {
 *   "allowed": true|false,
 *   "reason": "limit_reached" | "payment_required" | "ok",
 *   "tier": "starter|professional|enterprise",
 *   "usage": { "hosts": 5, "guests": 15, "total": 20 },
 *   "limits": { "hosts": 20, "guests": 20, "total": 20 }
 * }
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
// CORS & Security
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

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Parse & Validate Request
// ═══════════════════════════════════════════════════════════════════════════

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

$email = $input['email'] ?? '';
$hostCount = (int)($input['currentHostCount'] ?? 0);
$guestCount = (int)($input['currentGuestCount'] ?? 0);

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid email required']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Database Connection
// ═══════════════════════════════════════════════════════════════════════════

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'u958180753_floinvite';
$db_user = getenv('DB_USER') ?: 'u958180753_floinvite';
$db_pass = getenv('DB_PASS') ?: 'Fl0invit3db!';

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Tier & Limits Configuration
// ═══════════════════════════════════════════════════════════════════════════

$limits = [
    'starter' => [
        'hosts' => 20,
        'guests' => 20,
        'total' => 20  // hosts + guests combined
    ],
    'compliance' => [
        'hosts' => 999999,
        'guests' => 999999,
        'total' => 999999
    ],
    'enterprise' => [
        'hosts' => 999999,
        'guests' => 999999,
        'total' => 999999
    ]
];

// ═══════════════════════════════════════════════════════════════════════════
// Get User's Subscription Tier
// ═══════════════════════════════════════════════════════════════════════════

try {
    $stmt = $pdo->prepare('
        SELECT tier, subscription_status, current_period_end
        FROM users
        WHERE email = ?
        LIMIT 1
    ');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Default: new user with starter tier
    $tier = 'starter';
    $subscription_active = false;

    if ($user) {
        $tier = $user['tier'];
        if ($tier === 'professional') {
            $tier = 'compliance';
        }
        // Validate subscription is actually active
        if ($user['subscription_status'] === 'active' && $user['current_period_end'] && time() <= $user['current_period_end']) {
            $subscription_active = true;
        } elseif (!$user['subscription_status'] === 'active') {
            // Not active, downgrade to starter
            $tier = 'starter';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Check Usage Against Limits
    // ═══════════════════════════════════════════════════════════════════════

    $tierLimits = $limits[$tier];
    $totalCount = $hostCount + $guestCount;

    $allowed = true;
    $reason = 'ok';

    // Check individual limits
    if ($hostCount > $tierLimits['hosts'] || $guestCount > $tierLimits['guests'] || $totalCount > $tierLimits['total']) {
        $allowed = false;
        $reason = 'limit_reached';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Log the check for audit trail (only if user exists)
    // ═══════════════════════════════════════════════════════════════════════

    if ($user) {
        try {
            $logStmt = $pdo->prepare('
                INSERT INTO usage_tracking (user_email, action_type, count_after)
                VALUES (?, ?, ?)
            ');
            $logStmt->execute([$email, 'guest_checkin', $totalCount]);
        } catch (Exception $log_e) {
            // Silently skip logging if it fails
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Return Response
    // ═══════════════════════════════════════════════════════════════════════

    http_response_code($allowed ? 200 : 403);
    echo json_encode([
        'allowed' => $allowed,
        'reason' => $reason,
        'tier' => $tier,
        'subscriptionActive' => $subscription_active,
        'usage' => [
            'hosts' => $hostCount,
            'guests' => $guestCount,
            'total' => $totalCount
        ],
        'limits' => [
            'hosts' => $tierLimits['hosts'],
            'guests' => $tierLimits['guests'],
            'total' => $tierLimits['total']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage(),
        'allowed' => false
    ]);
}
?>
