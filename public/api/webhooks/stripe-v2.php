<?php
/**
 * Floinvite Stripe Webhook Handler v2
 * Processes Stripe events and PERSISTS subscription data to database
 * Payment enforcement enforced server-side (cannot be faked by client)
 *
 * Deployment: Upload to public_html/api/webhooks/stripe.php on Hostinger
 * Webhook URL: https://floinvite.com/api/webhooks/stripe.php
 */

error_reporting(0);
ini_set('display_errors', 0);

if (ob_get_level()) {
    ob_clean();
}

header('Content-Type: application/json; charset=utf-8');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Database Connection (for persistent storage)
// ═══════════════════════════════════════════════════════════════════════════

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'u958180753_floinvite';
$db_user = getenv('DB_USER') ?: 'u958180753_floinvite';
$db_pass = getenv('DB_PASS') ?: '';

$pdo = null;
try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    logWebhookEvent('db_error', $e->getMessage());
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Configuration
// ═══════════════════════════════════════════════════════════════════════════

$webhook_secret = getenv('STRIPE_WEBHOOK_SECRET');
if (!$webhook_secret) {
    http_response_code(500);
    echo json_encode(['error' => 'Webhook secret not configured']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Verify Webhook Signature
// ═══════════════════════════════════════════════════════════════════════════

$body = file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if (!$sig_header) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing Stripe signature']);
    exit;
}

$event = verifyStripeSignature($body, $sig_header, $webhook_secret);

if (!$event) {
    http_response_code(403);
    echo json_encode(['error' => 'Webhook signature verification failed']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// Process Event
// ═══════════════════════════════════════════════════════════════════════════

$type = $event['type'];
$data = $event['data']['object'];

logWebhookEvent($type, $data);

try {
    switch ($type) {
        case 'checkout.session.completed':
            handleCheckoutSessionCompleted($data, $pdo);
            break;

        case 'customer.subscription.updated':
            handleSubscriptionUpdated($data, $pdo);
            break;

        case 'customer.subscription.deleted':
            handleSubscriptionDeleted($data, $pdo);
            break;

        case 'invoice.paid':
            handleInvoicePaid($data, $pdo);
            break;

        case 'invoice.payment_failed':
            handleInvoicePaymentFailed($data, $pdo);
            break;

        default:
            logWebhookEvent('unhandled_event', $type);
    }

    http_response_code(200);
    echo json_encode(['success' => true, 'event' => $type]);

} catch (Exception $e) {
    logWebhookEvent('webhook_error', $e->getMessage());
    http_response_code(200);
    echo json_encode(['success' => true, 'error' => $e->getMessage()]);
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Handlers - WITH DATABASE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle successful checkout session
 * Creates or updates user record in database with subscription details
 */
function handleCheckoutSessionCompleted($session, $pdo) {
    if (!$pdo) return;

    $customer_email = $session['customer_email'] ?? '';
    $subscription_id = $session['subscription'] ?? '';
    $customer_id = $session['customer'] ?? '';
    $metadata = $session['metadata'] ?? [];

    $tier_id = $metadata['tierId'] ?? 'starter';
    $billing_cycle = $metadata['billingCycle'] ?? 'month';

    if (!$customer_email) return;

    try {
        // Insert or update user with subscription
        $stmt = $pdo->prepare('
            INSERT INTO users (id, email, tier, subscription_status, stripe_customer_id, stripe_subscription_id)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                tier = ?,
                subscription_status = ?,
                stripe_customer_id = ?,
                stripe_subscription_id = ?,
                updated_at = NOW()
        ');

        $id = bin2hex(random_bytes(18));
        $stmt->execute([
            $id, $customer_email, $tier_id, 'active', $customer_id, $subscription_id,
            $tier_id, 'active', $customer_id, $subscription_id
        ]);

        logWebhookEvent('user_created_or_updated', "Email: $customer_email | Tier: $tier_id | Sub: $subscription_id");
        sendConfirmationEmail($customer_email, $tier_id, $billing_cycle);

    } catch (Exception $e) {
        logWebhookEvent('checkout_db_error', $e->getMessage());
    }
}

/**
 * Handle subscription update (renewal, plan change, etc.)
 */
function handleSubscriptionUpdated($subscription, $pdo) {
    if (!$pdo) return;

    $subscription_id = $subscription['id'];
    $status = $subscription['status'];
    $current_period_start = $subscription['current_period_start'] ?? null;
    $current_period_end = $subscription['current_period_end'] ?? null;
    $cancel_at_period_end = (bool)($subscription['cancel_at_period_end'] ?? false);

    try {
        // Update subscription status by subscription ID
        $stmt = $pdo->prepare('
            UPDATE users
            SET subscription_status = ?,
                current_period_start = ?,
                current_period_end = ?,
                cancel_at_period_end = ?,
                updated_at = NOW()
            WHERE stripe_subscription_id = ?
        ');

        $stmt->execute([
            $status,
            $current_period_start,
            $current_period_end,
            $cancel_at_period_end ? 1 : 0,
            $subscription_id
        ]);

        logWebhookEvent('subscription_updated_db', "Sub: $subscription_id | Status: $status");

    } catch (Exception $e) {
        logWebhookEvent('subscription_update_error', $e->getMessage());
    }
}

/**
 * Handle subscription cancellation
 * Downgrade user to starter plan
 */
function handleSubscriptionDeleted($subscription, $pdo) {
    if (!$pdo) return;

    $subscription_id = $subscription['id'];

    try {
        // Downgrade user to starter tier
        $stmt = $pdo->prepare('
            UPDATE users
            SET tier = ?,
                subscription_status = ?,
                updated_at = NOW()
            WHERE stripe_subscription_id = ?
        ');

        $stmt->execute(['starter', 'canceled', $subscription_id]);
        logWebhookEvent('subscription_canceled_db', "Sub: $subscription_id");

    } catch (Exception $e) {
        logWebhookEvent('subscription_delete_error', $e->getMessage());
    }
}

/**
 * Handle successful payment
 */
function handleInvoicePaid($invoice, $pdo) {
    if (!$pdo) return;

    $customer_id = $invoice['customer'] ?? '';
    $invoice_id = $invoice['id'] ?? '';
    $amount = $invoice['amount_paid'] ?? 0;

    try {
        // Record successful payment
        $stmt = $pdo->prepare('
            INSERT INTO payments (id, user_email, stripe_invoice_id, stripe_charge_id, amount_cents, status)
            SELECT ?, email, ?, ?, ?, ?
            FROM users
            WHERE stripe_customer_id = ?
            LIMIT 1
        ');

        $id = bin2hex(random_bytes(18));
        $stmt->execute([
            $id,
            $invoice_id,
            $invoice['charge'] ?? '',
            $amount,
            'succeeded',
            $customer_id
        ]);

        logWebhookEvent('payment_recorded', "Invoice: $invoice_id | Amount: \$" . ($amount / 100));

    } catch (Exception $e) {
        logWebhookEvent('payment_record_error', $e->getMessage());
    }
}

/**
 * Handle failed payment
 */
function handleInvoicePaymentFailed($invoice, $pdo) {
    if (!$pdo) return;

    $customer_email = $invoice['customer_email'] ?? '';
    $amount = $invoice['amount_due'] ?? 0;
    $error_message = $invoice['last_payment_error']['message'] ?? 'Unknown error';

    try {
        // Record failed payment
        $stmt = $pdo->prepare('
            INSERT INTO failed_payments (user_email, error_message, error_code)
            VALUES (?, ?, ?)
        ');

        $stmt->execute([
            $customer_email,
            $error_message,
            'stripe_payment_failed'
        ]);

        // Update subscription status to past_due
        $stmt2 = $pdo->prepare('
            UPDATE users
            SET subscription_status = ?
            WHERE email = ?
        ');
        $stmt2->execute(['past_due', $customer_email]);

        logWebhookEvent('payment_failed_recorded', "Email: $customer_email | Amount: \$" . ($amount / 100));
        sendPaymentFailureEmail($customer_email, $amount / 100);

    } catch (Exception $e) {
        logWebhookEvent('payment_failure_record_error', $e->getMessage());
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function verifyStripeSignature($body, $sig_header, $secret) {
    $timestamp = '';
    $signature = '';

    foreach (explode(',', $sig_header) as $item) {
        $parts = explode('=', $item);
        if ($parts[0] === 't') {
            $timestamp = $parts[1];
        } elseif ($parts[0] === 'v1') {
            $signature = $parts[1];
        }
    }

    if (abs(time() - $timestamp) > 300) {
        return null;
    }

    $signed_content = "$timestamp.$body";
    $expected_signature = hash_hmac('sha256', $signed_content, $secret);

    if (hash_equals($expected_signature, $signature)) {
        return json_decode($body, true);
    }

    return null;
}

function sendConfirmationEmail($email, $tier, $cycle) {
    $tier_name = ucfirst($tier);
    $cycle_text = ($cycle === 'month') ? 'Monthly' : 'Yearly';

    $subject = "Welcome to Floinvite {$tier_name}!";
    $body = "<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body>
<h2>Welcome to Floinvite {$tier_name}!</h2>
<p>Your subscription has been successfully activated.</p>
<p><strong>Plan:</strong> {$tier_name} ({$cycle_text})</p>
<p>You can now access all {$tier_name} features in your dashboard.</p>
<p><a href='https://floinvite.com/'>Back to Dashboard</a></p>
<p>If you have any questions, contact us at admin@floinvite.com</p>
</body>
</html>";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Floinvite <admin@floinvite.com>\r\n";

    @mail($email, $subject, $body, $headers);
}

function sendPaymentFailureEmail($email, $amount) {
    $subject = "Payment Failed - Action Required";
    $body = "<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body>
<h2>Payment Failed</h2>
<p>We were unable to process your payment of \$$amount</p>
<p>Please update your payment method to continue your subscription.</p>
<p><a href='https://floinvite.com/'>Update Payment Method</a></p>
<p>Questions? Contact admin@floinvite.com</p>
</body>
</html>";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Floinvite <admin@floinvite.com>\r\n";

    @mail($email, $subject, $body, $headers);
}

function logWebhookEvent($type, $data) {
    $log_file = '/tmp/floinvite_stripe_webhooks.log';
    $timestamp = date('Y-m-d H:i:s');
    $data_str = is_array($data) ? json_encode($data) : (string)$data;
    $log_entry = "$timestamp | $type | $data_str\n";

    @file_put_contents($log_file, $log_entry, FILE_APPEND);
}
?>
