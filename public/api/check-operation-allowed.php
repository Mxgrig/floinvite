<?php
/**
 * Floinvite Operation Enforcement Endpoint
 * Validates if user can perform ANY operation (check-in, checkout, add host, etc.)
 * Returns FORBIDDEN if user has breached free limit
 *
 * Deployment: Upload to public_html/api/check-operation-allowed.php
 * Usage: POST /api/check-operation-allowed
 * Body: {
 *   "email": "user@example.com",
 *   "operation": "checkin|checkout|add_host|edit_host|delete_host",
 *   "currentHostCount": 5,
 *   "currentGuestCount": 15
 * }
 *
 * Response: { "allowed": true|false, "reason": "ok|limit_reached|payment_required" }
 */

error_reporting(0);
ini_set('display_errors', 0);

if (ob_get_level()) {
    ob_clean();
}

// Load environment variables from .env file
require_once __DIR__ . '/env.php';

header('Content-Type: application/json; charset=utf-8');

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
$operation = $input['operation'] ?? '';
$hostCount = (int)($input['currentHostCount'] ?? 0);
$guestCount = (int)($input['currentGuestCount'] ?? 0);

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid email required']);
    exit;
}

if (!$operation) {
    http_response_code(400);
    echo json_encode(['error' => 'Operation type required']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Database Connection
// ═══════════════════════════════════════════════════════════════════════════

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'u958180753_floinvite';
$db_user = getenv('DB_USER') ?: 'u958180753_floinvite';
$db_pass = getenv('DB_PASS') ?: '';

if (!$db_pass) {
    http_response_code(500);
    echo json_encode(['error' => 'Database configuration missing']);
    exit;
}

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
// Get User's Subscription & Tier
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

    $tier = 'starter';
    $subscription_active = false;

    if ($user) {
        $tier = $user['tier'];
        if ($tier === 'professional') {
            $tier = 'compliance';
        }
        if ($user['subscription_status'] === 'active' && $user['current_period_end'] && time() <= $user['current_period_end']) {
            $subscription_active = true;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Define Operations That Require Payment Check
    // ═══════════════════════════════════════════════════════════════════════

    // These operations are BLOCKED if user is over limit:
    $operations_blocked_if_over_limit = [
        'checkin',           // Cannot check in new guest
        'add_host',         // Cannot add new host
        'edit_host',        // Cannot edit host (might add guest to it)
        'import_hosts',     // Cannot import new hosts
    ];

    // These operations are ALLOWED even if over limit:
    $operations_always_allowed = [
        'checkout',         // Can check out existing guests (reduces count)
        'delete_host',      // Can delete host (reduces count)
        'delete_guest',     // Can delete guest (reduces count)
        'view_logbook',     // Can view data
        'view_settings',    // Can view settings
        'logout',           // Can always logout
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // Check If Operation Is Allowed
    // ═══════════════════════════════════════════════════════════════════════

    $allowed = true;
    $reason = 'ok';

    // If operation is always allowed, skip limit check
    if (in_array($operation, $operations_always_allowed)) {
        $allowed = true;
        $reason = 'ok';
    }
    // If operation requires limit check
    elseif (in_array($operation, $operations_blocked_if_over_limit)) {
        // Define limits
        $limits = [
            'starter' => 20,
            'compliance' => 999999,
            'enterprise' => 999999
        ];

        $tierLimit = $limits[$tier] ?? 20;
        $totalCount = $hostCount + $guestCount;

        // Check if over limit
        if ($totalCount > $tierLimit) {
            $allowed = false;
            $reason = 'limit_reached';
        } elseif (!$subscription_active && $tier === 'compliance') {
            $allowed = false;
            $reason = 'payment_required';
        } else {
            $allowed = true;
            $reason = 'ok';
        }
    } else {
        // Unknown operation
        http_response_code(400);
        echo json_encode(['error' => 'Unknown operation type: ' . $operation]);
        exit;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Log Operation Check
    // ═══════════════════════════════════════════════════════════════════════

    if (!$allowed) {
        $logStmt = $pdo->prepare('
            INSERT INTO usage_tracking (user_email, action_type, count_after)
            VALUES (?, ?, ?)
        ');
        $logStmt->execute([$email, $operation . '_blocked', $totalCount ?? 0]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Return Response
    // ═══════════════════════════════════════════════════════════════════════

    http_response_code($allowed ? 200 : 403);
    echo json_encode([
        'allowed' => $allowed,
        'reason' => $reason,
        'operation' => $operation,
        'tier' => $tier,
        'message' => $allowed
            ? "Operation allowed"
            : ($reason === 'limit_reached'
                ? "You have reached the free tier limit. Continue on Starter for $29/month, or upgrade to Compliance+."
                : "Payment required. Continue on Starter for $29/month, or upgrade to Compliance+.")
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'allowed' => false]);
}
?>
