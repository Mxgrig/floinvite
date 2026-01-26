<?php
/**
 * Email with Attachments Handler
 * Generates MIME multipart emails with file attachments
 */

/**
 * Generate MIME boundary for multipart emails
 */
function generate_mime_boundary() {
    return '-----=' . md5(uniqid() . time());
}

/**
 * Encode file content to base64 for MIME attachment
 */
function encode_file_attachment($file_path) {
    if (!file_exists($file_path)) {
        return null;
    }

    $content = file_get_contents($file_path);
    if ($content === false) {
        return null;
    }

    return base64_encode($content);
}

/**
 * Get MIME type from file extension
 */
function get_mime_type($filename) {
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    $mime_types = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
    ];

    return $mime_types[$ext] ?? 'application/octet-stream';
}

/**
 * Create SMTP-compatible MIME multipart email with attachments
 * Returns the full email as a string ready for SMTP transmission
 */
function create_mime_email_with_attachments($from_name, $from_email, $to_email, $subject, $html_body, $attachments = []) {
    $boundary = generate_mime_boundary();
    $messageId = '<' . uniqid('msg_') . '@' . gethostname() . '>';

    $email = "";
    $email .= "From: {$from_name} <{$from_email}>\r\n";
    $email .= "To: {$to_email}\r\n";
    $email .= "Subject: {$subject}\r\n";
    $email .= "Message-ID: {$messageId}\r\n";
    $email .= "MIME-Version: 1.0\r\n";
    $email .= "Date: " . date('r') . "\r\n";

    if (!empty($attachments)) {
        $email .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";
        $email .= "\r\n";

        // HTML content part
        $email .= "--{$boundary}\r\n";
        $email .= "Content-Type: text/html; charset=UTF-8\r\n";
        $email .= "Content-Transfer-Encoding: 8bit\r\n";
        $email .= "\r\n";
        $email .= $html_body . "\r\n";

        // Attachment parts
        foreach ($attachments as $att) {
            $file_path = $att['file_path'];
            $original_name = $att['original_name'];
            $mime_type = get_mime_type($original_name);
            $encoded_content = encode_file_attachment($file_path);

            if ($encoded_content === null) {
                // Skip files that can't be read
                continue;
            }

            $email .= "\r\n--{$boundary}\r\n";
            $email .= "Content-Type: {$mime_type}; name=\"{$original_name}\"\r\n";
            $email .= "Content-Transfer-Encoding: base64\r\n";
            $email .= "Content-Disposition: attachment; filename=\"{$original_name}\"\r\n";
            $email .= "\r\n";
            $email .= chunk_split($encoded_content, 76, "\r\n");
        }

        $email .= "\r\n--{$boundary}--\r\n";
    } else {
        // No attachments - simple HTML email
        $email .= "Content-Type: text/html; charset=UTF-8\r\n";
        $email .= "\r\n";
        $email .= $html_body . "\r\n";
    }

    return $email;
}

/**
 * Send email with attachments via SMTP socket
 * Returns array ['success' => bool, 'error' => string|null]
 */
function send_email_with_attachments($from_name, $from_email, $to_email, $subject, $html_body, $attachments = []) {
    $smtp_host = SMTP_HOST;
    $smtp_port = SMTP_PORT;
    $smtp_user = SMTP_USER;
    $smtp_pass = SMTP_PASS;

    try {
        // Connect to SMTP server
        $useImplicitSSL = ($smtp_port == 465);
        $host = $useImplicitSSL ? 'ssl://' . $smtp_host : $smtp_host;

        $socket = @fsockopen($host, $smtp_port, $errno, $errstr, 30);
        if (!$socket) {
            return ['success' => false, 'error' => "Connection failed: {$errstr}"];
        }

        stream_set_timeout($socket, 30);

        // Read server greeting
        $response = fread($socket, 1024);
        if (strpos($response, '220') === false) {
            fclose($socket);
            return ['success' => false, 'error' => 'No greeting from SMTP server'];
        }

        // Send EHLO
        fwrite($socket, "EHLO " . gethostname() . "\r\n");
        fread($socket, 1024);

        // STARTTLS for port 587
        if (!$useImplicitSSL) {
            fwrite($socket, "STARTTLS\r\n");
            $response = fread($socket, 1024);
            if (strpos($response, '220') === false) {
                fclose($socket);
                return ['success' => false, 'error' => 'STARTTLS failed'];
            }

            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                return ['success' => false, 'error' => 'TLS upgrade failed'];
            }

            fwrite($socket, "EHLO " . gethostname() . "\r\n");
            fread($socket, 1024);
        }

        // Authenticate
        fwrite($socket, "AUTH LOGIN\r\n");
        fread($socket, 1024);

        fwrite($socket, base64_encode($smtp_user) . "\r\n");
        $response = fread($socket, 1024);
        if (strpos($response, '334') === false) {
            fclose($socket);
            return ['success' => false, 'error' => 'Authentication failed'];
        }

        fwrite($socket, base64_encode($smtp_pass) . "\r\n");
        $response = fread($socket, 1024);
        if (strpos($response, '235') === false) {
            fclose($socket);
            return ['success' => false, 'error' => 'Authentication failed'];
        }

        // Send email
        fwrite($socket, "MAIL FROM:<{$from_email}>\r\n");
        fread($socket, 1024);

        fwrite($socket, "RCPT TO:<{$to_email}>\r\n");
        fread($socket, 1024);

        fwrite($socket, "DATA\r\n");
        fread($socket, 1024);

        // Create MIME message
        $email_message = create_mime_email_with_attachments(
            $from_name,
            $from_email,
            $to_email,
            $subject,
            $html_body,
            $attachments
        );

        // Send message
        fwrite($socket, $email_message . "\r\n");
        $response = fread($socket, 1024);
        if (strpos($response, '250') === false) {
            fclose($socket);
            return ['success' => false, 'error' => 'Failed to send message'];
        }

        // Close connection
        fwrite($socket, "QUIT\r\n");
        fclose($socket);

        return ['success' => true];
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

?>
