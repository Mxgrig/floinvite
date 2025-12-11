<?php
/**
 * Floinvite Stripe Webhook Handler
 * Processes Stripe events for subscription management
 *
 * Deployment: Upload to public_html/api/webhooks/stripe.php on Hostinger
 * Webhook URL: https://floinvite.com/api/webhooks/stripe.php
 */

// Suppress warnings/notices
error_reporting(0);
ini_set('display_errors', 0);

if (ob_get_level()) {
    ob_clean();
}

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
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

// Verify the signature
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

// Log all events
logWebhookEvent($type, $data);

try {
    switch ($type) {
        case 'checkout.session.completed':
            handleCheckoutSessionCompleted($data);
            break;

        case 'customer.subscription.updated':
            handleSubscriptionUpdated($data);
            break;

        case 'customer.subscription.deleted':
            handleSubscriptionDeleted($data);
            break;

        case 'invoice.paid':
            handleInvoicePaid($data);
            break;

        case 'invoice.payment_failed':
            handleInvoicePaymentFailed($data);
            break;

        default:
            // Log unhandled event type
            logWebhookEvent('unhandled_event', $type);
    }

    // Always return 200 to acknowledge receipt
    http_response_code(200);
    echo json_encode(['success' => true, 'event' => $type]);

} catch (Exception $e) {
    logWebhookEvent('webhook_error', $e->getMessage());
    http_response_code(200); // Still return 200 to prevent retry loop
    echo json_encode(['success' => true, 'error' => $e->getMessage()]);
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Handlers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle successful checkout session
 * Customer has completed payment
 */
function handleCheckoutSessionCompleted($session) {
    $customer_email = $session['customer_email'] ?? '';
    $subscription_id = $session['subscription'] ?? '';
    $customer_id = $session['customer'] ?? '';
    $metadata = $session['metadata'] ?? [];

    // Store subscription info in localStorage (client-side) via response
    // Or send confirmation email
    $tier_id = $metadata['tierId'] ?? 'starter';
    $billing_cycle = $metadata['billingCycle'] ?? 'month';

    // Log successful checkout
    $log = "CHECKOUT_SUCCESS | Customer: $customer_email | Subscription: $subscription_id | Tier: $tier_id | Cycle: $billing_cycle";
    logWebhookEvent('checkout_success', $log);

    // Send confirmation email (optional)
    sendConfirmationEmail($customer_email, $tier_id, $billing_cycle);
}

/**
 * Handle subscription update (plan change, renewal, etc.)
 */
function handleSubscriptionUpdated($subscription) {
    $customer_id = $subscription['customer'];
    $subscription_id = $subscription['id'];
    $status = $subscription['status'];
    $current_period_end = $subscription['current_period_end'];

    $log = "SUBSCRIPTION_UPDATED | ID: $subscription_id | Status: $status | Next Renewal: " . date('Y-m-d', $current_period_end);
    logWebhookEvent('subscription_updated', $log);
}

/**
 * Handle subscription cancellation
 */
function handleSubscriptionDeleted($subscription) {
    $customer_id = $subscription['customer'];
    $subscription_id = $subscription['id'];

    $log = "SUBSCRIPTION_DELETED | ID: $subscription_id | Customer: $customer_id";
    logWebhookEvent('subscription_deleted', $log);

    // Could downgrade user to starter plan here
}

/**
 * Handle successful payment
 */
function handleInvoicePaid($invoice) {
    $customer_id = $invoice['customer'];
    $amount = $invoice['amount_paid'];
    $paid_at = date('Y-m-d H:i:s', $invoice['paid_at']);

    $log = "INVOICE_PAID | Customer: $customer_id | Amount: \$" . ($amount / 100) . " | Date: $paid_at";
    logWebhookEvent('invoice_paid', $log);
}

/**
 * Handle failed payment
 */
function handleInvoicePaymentFailed($invoice) {
    $customer_id = $invoice['customer'];
    $customer_email = $invoice['customer_email'] ?? '';
    $amount = $invoice['amount_due'];

    $log = "INVOICE_FAILED | Customer: $customer_email | Amount: \$" . ($amount / 100);
    logWebhookEvent('invoice_failed', $log);

    // Send payment failure notification email
    sendPaymentFailureEmail($customer_email, $amount / 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature($body, $sig_header, $secret) {
    $timestamp = '';
    $signature = '';

    // Parse signature header: t=timestamp,v1=signature
    foreach (explode(',', $sig_header) as $item) {
        $parts = explode('=', $item);
        if ($parts[0] === 't') {
            $timestamp = $parts[1];
        } elseif ($parts[0] === 'v1') {
            $signature = $parts[1];
        }
    }

    // Check timestamp is within 5 minutes (300 seconds)
    if (abs(time() - $timestamp) > 300) {
        return null;
    }

    // Verify signature
    $signed_content = "$timestamp.$body";
    $expected_signature = hash_hmac('sha256', $signed_content, $secret);

    if (hash_equals($expected_signature, $signature)) {
        return json_decode($body, true);
    }

    return null;
}

/**
 * Send confirmation email after successful checkout
 */
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
<p><a href='https://floinvite.com/app/dashboard'>Go to Dashboard</a></p>
<p>If you have any questions, contact us at admin@floinvite.com</p>
</body>
</html>";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Floinvite <admin@floinvite.com>\r\n";

    @mail($email, $subject, $body, $headers);
}

/**
 * Send payment failure notification
 */
function sendPaymentFailureEmail($email, $amount) {
    $subject = "Payment Failed - Action Required";
    $body = "<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body>
<h2>Payment Failed</h2>
<p>We were unable to process your payment of \$$amount</p>
<p>Please update your payment method to continue your subscription.</p>
<p><a href='https://floinvite.com/app/dashboard'>Update Payment Method</a></p>
<p>Questions? Contact admin@floinvite.com</p>
</body>
</html>";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Floinvite <admin@floinvite.com>\r\n";

    @mail($email, $subject, $body, $headers);
}

/**
 * Log webhook events
 */
function logWebhookEvent($type, $data) {
    $log_file = '/tmp/floinvite_stripe_webhooks.log';
    $timestamp = date('Y-m-d H:i:s');
    $data_str = is_array($data) ? json_encode($data) : (string)$data;
    $log_entry = "$timestamp | $type | $data_str\n";

    @file_put_contents($log_file, $log_entry, FILE_APPEND);
}
?>
