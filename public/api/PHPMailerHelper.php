<?php
/**
 * PHPMailer Helper Class
 * Unified SMTP email sending for both visitor notifications and email marketing
 * 
 * Replaces PHP's mail() function which uses sendmail() (suspended on Hostinger)
 * Uses SMTP authentication for reliable email delivery
 * 
 * Usage:
 *   $mailer = new PHPMailerHelper();
 *   $result = $mailer->send([
 *       'to' => 'recipient@example.com',
 *       'subject' => 'Test Email',
 *       'body' => 'Email content (HTML or plain text)',
 *       'fromEmail' => 'sender@floinvite.com',
 *       'fromName' => 'Floinvite'
 *   ]);
 *   if ($result['success']) { /* Email sent */ }
 *   else { /* Handle error */ }
 */

class PHPMailerHelper {
    private $smtpHost;
    private $smtpPort;
    private $smtpUser;
    private $smtpPass;
    private $defaultFromEmail;
    private $defaultFromName;
    private $timeout = 30;

    public function __construct() {
        // Load environment variables
        $this->smtpHost = getenv('SMTP_HOST') ?: 'smtp.hostinger.com';
        $this->smtpPort = getenv('SMTP_PORT') ?: 465;
        $this->smtpUser = getenv('SMTP_USER') ?: 'admin@floinvite.com';
        $this->smtpPass = getenv('SMTP_PASS') ?: '';
        $this->defaultFromEmail = getenv('SMTP_USER') ?: 'admin@floinvite.com';
        $this->defaultFromName = 'Floinvite';

        // Validate SMTP credentials
        if (empty($this->smtpUser) || empty($this->smtpPass)) {
            throw new Exception('SMTP credentials not configured. Check .env file.');
        }
    }

    /**
     * Send email via SMTP
     * 
     * @param array $options Email options:
     *   - to (required): recipient email address
     *   - subject (required): email subject
     *   - body (required): email body (HTML or plain text)
     *   - fromEmail (optional): sender email, defaults to SMTP_USER
     *   - fromName (optional): sender name, defaults to 'Floinvite'
     *   - isHtml (optional): true if body is HTML, auto-detected if not specified
     * 
     * @return array Result with keys:
     *   - success: true if sent, false if failed
     *   - messageId: unique message ID if sent
     *   - error: error message if failed
     */
    public function send($options) {
        // Validate required fields
        $to = trim($options['to'] ?? '');
        $subject = trim($options['subject'] ?? '');
        $body = $options['body'] ?? '';
        $fromEmail = trim($options['fromEmail'] ?? $this->defaultFromEmail);
        $fromName = trim($options['fromName'] ?? $this->defaultFromName);
        
        // Auto-detect if body is HTML
        $isHtml = $options['isHtml'] ?? false;
        if (!$isHtml && (strpos($body, '<!DOCTYPE') !== false || strpos($body, '<html>') !== false)) {
            $isHtml = true;
        }

        // Validate emails
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'error' => 'Invalid recipient email address: ' . $to
            ];
        }
        if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'error' => 'Invalid sender email address: ' . $fromEmail
            ];
        }

        if (empty($subject)) {
            return [
                'success' => false,
                'error' => 'Email subject is required'
            ];
        }

        if (empty($body)) {
            return [
                'success' => false,
                'error' => 'Email body is required'
            ];
        }

        // Attempt SMTP connection
        try {
            $handle = $this->connectSMTP();
            if (!$handle) {
                return [
                    'success' => false,
                    'error' => 'Failed to connect to SMTP server'
                ];
            }

            // Build email headers and body
            $messageId = $this->generateMessageId();
            $boundary = 'boundary_' . md5(uniqid());
            
            // Send SMTP commands
            $this->sendCommand($handle, "MAIL FROM:<{$fromEmail}>");
            $this->sendCommand($handle, "RCPT TO:<{$to}>");
            $this->sendCommand($handle, "DATA");

            // Build email
            $headers = "From: {$fromName} <{$fromEmail}>\r\n";
            $headers .= "Reply-To: {$fromEmail}\r\n";
            $headers .= "Message-ID: <{$messageId}>\r\n";
            $headers .= "X-Mailer: Floinvite PHPMailer/1.0\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: " . ($isHtml ? 'text/html' : 'text/plain') . "; charset=UTF-8\r\n";
            $headers .= "Subject: {$subject}\r\n";
            $headers .= "Date: " . date('r') . "\r\n";
            $headers .= "To: {$to}\r\n";

            // Send headers and body
            $email = $headers . "\r\n" . $body . "\r\n.\r\n";
            fputs($handle, $email);

            $response = fgets($handle, 256);
            $this->sendCommand($handle, "QUIT");
            fclose($handle);

            // Check response
            if (strpos($response, '250') !== 0) {
                return [
                    'success' => false,
                    'error' => 'SMTP server rejected email: ' . trim($response)
                ];
            }

            return [
                'success' => true,
                'messageId' => $messageId
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'SMTP Error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Connect to SMTP server using TLS/SSL
     * 
     * @return resource|false Socket resource on success, false on failure
     */
    private function connectSMTP() {
        // Determine SSL/TLS settings based on port
        $ssl = $this->smtpPort === 465 ? 'ssl://' : '';
        $host = $ssl . $this->smtpHost;

        // Create socket with timeout
        $handle = @fsockopen($host, $this->smtpPort, $errno, $errstr, $this->timeout);

        if (!$handle) {
            throw new Exception("Failed to connect to {$this->smtpHost}:{$this->smtpPort} - {$errstr}");
        }

        // Read greeting
        $response = fgets($handle, 256);
        if (strpos($response, '220') === false) {
            fclose($handle);
            throw new Exception("SMTP server greeting failed: {$response}");
        }

        // EHLO greeting
        $this->sendCommand($handle, "EHLO " . gethostname());

        // Authenticate
        $this->sendCommand($handle, "AUTH LOGIN");
        $this->sendCommand($handle, base64_encode($this->smtpUser));
        $this->sendCommand($handle, base64_encode($this->smtpPass));

        return $handle;
    }

    /**
     * Send SMTP command and get response
     * 
     * @param resource $handle Socket handle
     * @param string $command Command to send
     * @return string Server response
     */
    private function sendCommand($handle, $command) {
        fputs($handle, $command . "\r\n");
        $response = fgets($handle, 256);

        // Log for debugging
        if (getenv('DEBUG') === 'true') {
            error_log("SMTP Command: {$command} -> Response: " . trim($response));
        }

        // Check for error responses (400-500 range)
        $code = substr($response, 0, 3);
        if ($code[0] === '4' || $code[0] === '5') {
            throw new Exception("SMTP Error ({$code}): {$response}");
        }

        return $response;
    }

    /**
     * Generate unique Message-ID header
     * 
     * @return string Message ID
     */
    private function generateMessageId() {
        return bin2hex(random_bytes(8)) . '.' . time() . '@floinvite.com';
    }

    /**
     * Test SMTP connection (for debugging)
     * 
     * @return array Status with 'success' and 'message' keys
     */
    public function testConnection() {
        try {
            $handle = $this->connectSMTP();
            if (!$handle) {
                return [
                    'success' => false,
                    'message' => 'Failed to create socket'
                ];
            }

            $this->sendCommand($handle, "QUIT");
            fclose($handle);

            return [
                'success' => true,
                'message' => "Successfully connected to {$this->smtpHost}:{$this->smtpPort}"
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Get current SMTP configuration (for debugging)
     * 
     * @return array Configuration details
     */
    public function getConfig() {
        return [
            'host' => $this->smtpHost,
            'port' => $this->smtpPort,
            'user' => $this->smtpUser,
            'fromEmail' => $this->defaultFromEmail,
            'fromName' => $this->defaultFromName
        ];
    }
}
?>
