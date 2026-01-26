<?php
/**
 * Render a campaign email preview for a specific recipient.
 *
 * GET params:
 * - campaign_id (required)
 * - email (required)
 * - name (optional)
 * - company (optional)
 */

require_once 'config.php';
require_once 'logo.php';

require_auth();

$campaign_id = intval($_GET['campaign_id'] ?? 0);
$email = trim($_GET['email'] ?? '');
$name = trim($_GET['name'] ?? '');
$company = trim($_GET['company'] ?? '');

if (!$campaign_id) {
    respond(false, null, 'Campaign ID required');
}

if (!$email || !validate_email($email)) {
    respond(false, null, 'Valid recipient email required');
}

$db = get_db();

$stmt = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
$stmt->bind_param("i", $campaign_id);
$stmt->execute();
$campaign = $stmt->get_result()->fetch_assoc();

if (!$campaign) {
    respond(false, null, 'Campaign not found');
}

if ($name === '' || $company === '') {
    $sub_stmt = $db->prepare("
        SELECT name, company
        FROM subscribers
        WHERE email = ?
        LIMIT 1
    ");
    $sub_stmt->bind_param("s", $email);
    $sub_stmt->execute();
    $subscriber = $sub_stmt->get_result()->fetch_assoc();
    if ($subscriber) {
        if ($name === '') {
            $name = $subscriber['name'] ?? '';
        }
        if ($company === '') {
            $company = $subscriber['company'] ?? '';
        }
    }
}

$unsubscribe_token = '';
$token_stmt = $db->prepare("
    SELECT unsubscribe_token
    FROM campaign_sends
    WHERE campaign_id = ? AND email = ?
    ORDER BY id DESC
    LIMIT 1
");
$token_stmt->bind_param("is", $campaign_id, $email);
$token_stmt->execute();
$token_row = $token_stmt->get_result()->fetch_assoc();
if ($token_row) {
    $unsubscribe_token = $token_row['unsubscribe_token'] ?? '';
}

$requires_response = false;
$column_check = $db->prepare("
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'campaigns' AND COLUMN_NAME = 'requires_response'
    LIMIT 1
");
$db_name = DB_NAME;
$column_check->bind_param("s", $db_name);
$column_check->execute();
if ($column_check->get_result()->fetch_assoc()) {
    $requires_response = !empty($campaign['requires_response']);
}

$html = create_email_from_text(
    $campaign['greeting'] ?? '',
    $campaign['html_body'] ?? '',
    $campaign['signature'] ?? '',
    $name ?: $email,
    $email,
    $company ?? '',
    $campaign['from_name'] ?? 'floinvite',
    $campaign['from_email'] ?? 'admin@floinvite.com',
    'default',
    $unsubscribe_token,
    true,
    $requires_response
);

respond(true, ['html' => $html], 'Rendered preview');
?>
