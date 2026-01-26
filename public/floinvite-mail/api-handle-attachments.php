<?php
/**
 * Handle file attachments for campaigns
 * Handles upload, deletion, and retrieval of campaign attachments
 */

require_once 'config.php';
require_once 'logo.php';
require_auth();

header('Content-Type: application/json');

$db = get_db();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$campaign_id = intval($_GET['campaign_id'] ?? $_POST['campaign_id'] ?? 0);

// Ensure upload directory exists
$upload_dir = __DIR__ . '/uploads/attachments';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Define allowed file types and max size
$allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
$max_file_size = 10 * 1024 * 1024; // 10MB

if ($action === 'upload') {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No file uploaded or upload error']);
        exit;
    }

    $file = $_FILES['file'];
    $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $file_mime = mime_content_type($file['tmp_name']);

    // Validate file type
    if (!in_array($file_ext, $allowed_extensions) || !in_array($file_mime, $allowed_types)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid file type. Only PDF and images allowed.']);
        exit;
    }

    // Validate file size
    if ($file['size'] > $max_file_size) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File too large. Maximum 10MB.']);
        exit;
    }

    // Generate unique filename
    $file_hash = hash('sha256', $file['tmp_name'] . time());
    $stored_filename = $campaign_id . '_' . substr($file_hash, 0, 12) . '.' . $file_ext;
    $stored_path = $upload_dir . '/' . $stored_filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $stored_path)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save file']);
        exit;
    }

    // If campaign_id is provided, update campaign attachments metadata
    if ($campaign_id > 0) {
        $stmt = $db->prepare("SELECT attachments FROM campaigns WHERE id = ?");
        $stmt->bind_param("i", $campaign_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        $attachments = $result ? json_decode($result['attachments'] ?? '[]', true) : [];

        $new_attachment = [
            'id' => uniqid('att_'),
            'original_name' => $file['name'],
            'stored_name' => $stored_filename,
            'file_type' => $file_ext,
            'file_size' => $file['size'],
            'mime_type' => $file_mime,
            'uploaded_at' => date('c')
        ];

        $attachments[] = $new_attachment;

        $attachments_json = json_encode($attachments);
        $update_stmt = $db->prepare("UPDATE campaigns SET attachments = ? WHERE id = ?");
        $update_stmt->bind_param("si", $attachments_json, $campaign_id);
        $update_stmt->execute();

        echo json_encode([
            'success' => true,
            'attachment' => $new_attachment
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'filename' => $stored_filename,
            'original_name' => $file['name']
        ]);
    }
    exit;
}

if ($action === 'delete') {
    $attachment_id = $_POST['attachment_id'] ?? '';

    if (!$campaign_id || !$attachment_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing campaign_id or attachment_id']);
        exit;
    }

    $stmt = $db->prepare("SELECT attachments FROM campaigns WHERE id = ?");
    $stmt->bind_param("i", $campaign_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if (!$result) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Campaign not found']);
        exit;
    }

    $attachments = json_decode($result['attachments'] ?? '[]', true);
    $attachment_to_delete = null;
    $updated_attachments = [];

    foreach ($attachments as $att) {
        if ($att['id'] === $attachment_id) {
            $attachment_to_delete = $att;
        } else {
            $updated_attachments[] = $att;
        }
    }

    if (!$attachment_to_delete) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Attachment not found']);
        exit;
    }

    // Delete physical file
    $file_path = $upload_dir . '/' . $attachment_to_delete['stored_name'];
    if (file_exists($file_path)) {
        unlink($file_path);
    }

    // Update database
    $attachments_json = json_encode($updated_attachments) ?: null;
    $update_stmt = $db->prepare("UPDATE campaigns SET attachments = ? WHERE id = ?");
    $update_stmt->bind_param("si", $attachments_json, $campaign_id);
    $update_stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Attachment deleted'
    ]);
    exit;
}

if ($action === 'list') {
    if (!$campaign_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing campaign_id']);
        exit;
    }

    $stmt = $db->prepare("SELECT attachments FROM campaigns WHERE id = ?");
    $stmt->bind_param("i", $campaign_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    $attachments = $result ? json_decode($result['attachments'] ?? '[]', true) : [];

    echo json_encode([
        'success' => true,
        'attachments' => $attachments
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Invalid action']);
?>
