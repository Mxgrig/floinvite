<?php
/**
 * PHPMailer Helper - SMTP Email Sender
 * Handles both port 465 (implicit SSL) and port 587 (STARTTLS)
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
        $this->smtpHost = getenv('SMTP_HOST') ?: 'smtp.hostinger.com';
        $this->smtpPort = getenv('SMTP_PORT') ?: 587;
        $this->smtpUser = getenv('SMTP_USER') ?: '';
        $this->smtpPass = getenv('SMTP_PASS') ?: '';
        $this->defaultFromEmail = getenv('SMTP_USER') ?: '';
        $this->defaultFromName = 'Floinvite';

        if (empty($this->smtpUser) || empty($this->smtpPass)) {
            throw new Exception('SMTP credentials not configured');
        }
    }

    public function send($options) {
        $to = trim($options['to'] ?? '');
        $subject = $this->sanitizeHeader(trim($options['subject'] ?? ''));
        $body = $options['body'] ?? '';
        $fromEmail = trim($options['fromEmail'] ?? $this->defaultFromEmail);
        $fromName = $this->sanitizeHeader(trim($options['fromName'] ?? $this->defaultFromName));
        $isHtml = $options['isHtml'] ?? false;

        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid recipient email'];
        }
        if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid sender email'];
        }
        if (empty($subject) || empty($body)) {
            return ['success' => false, 'error' => 'Subject and body required'];
        }

        try {
            $socket = $this->connect();
            $messageId = $this->generateMessageId();

            $this->cmd($socket, "MAIL FROM:<{$fromEmail}>");
            $this->cmd($socket, "RCPT TO:<{$to}>");
            $this->cmd($socket, "DATA");

            $email = "From: {$fromName} <{$fromEmail}>\r\n";
            $email .= "To: {$to}\r\n";
            $email .= "Subject: {$subject}\r\n";
            $email .= "Message-ID: <{$messageId}>\r\n";
            $email .= "MIME-Version: 1.0\r\n";
            $email .= "Content-Type: " . ($isHtml ? 'text/html' : 'text/plain') . "; charset=UTF-8\r\n";
            $email .= "Date: " . date('r') . "\r\n\r\n";
            $email .= $this->normalizeBody($body) . "\r\n.\r\n";

            fwrite($socket, $email);
            $this->read($socket);
            $this->cmd($socket, "QUIT");
            fclose($socket);

            return ['success' => true, 'messageId' => $messageId];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function connect() {
        $useImplicitSSL = ($this->smtpPort == 465);
        $host = $useImplicitSSL ? 'ssl://' . $this->smtpHost : $this->smtpHost;
        
        $socket = @fsockopen($host, $this->smtpPort, $errno, $errstr, $this->timeout);
        if (!$socket) {
            throw new Exception("Connection failed: {$errstr}");
        }

        stream_set_timeout($socket, $this->timeout);
        
        // Read server greeting
        $response = $this->read($socket);
        if (strpos($response, '220') === false) {
            fclose($socket);
            throw new Exception("No greeting from server");
        }

        // Send EHLO
        $this->cmd($socket, "EHLO " . gethostname());

        // If port 587, need STARTTLS
        if (!$useImplicitSSL) {
            // Send STARTTLS and read response
            fwrite($socket, "STARTTLS\r\n");
            $response = $this->read($socket);
            
            // STARTTLS may return 220 or 250 depending on server
            if (strpos($response, '220') === false && strpos($response, '250') === false) {
                throw new Exception("STARTTLS not supported or failed");
            }

            // Enable TLS encryption
            $cryptoMethods = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
            if (!stream_socket_enable_crypto($socket, true, $cryptoMethods)) {
                throw new Exception("TLS negotiation failed");
            }

            // Re-send EHLO after STARTTLS (required by RFC)
            $this->cmd($socket, "EHLO " . gethostname());
        }

        // AUTH LOGIN
        $this->cmd($socket, "AUTH LOGIN");
        
        // Send username (base64 encoded)
        fwrite($socket, base64_encode($this->smtpUser) . "\r\n");
        $response = $this->read($socket);
        if (strpos($response, '334') === false) {
            throw new Exception("Username not accepted");
        }

        // Send password (base64 encoded)
        fwrite($socket, base64_encode($this->smtpPass) . "\r\n");
        $response = $this->read($socket);
        
        // Check for success (235) or continuation (503)
        if (strpos($response, '235') === false && strpos($response, '503') === false) {
            throw new Exception("Authentication failed: " . trim($response));
        }

        return $socket;
    }

    private function cmd($socket, $cmd) {
        fwrite($socket, $cmd . "\r\n");
        $response = $this->read($socket);
        $code = substr($response, 0, 3);
        
        if ($code[0] === '4' || $code[0] === '5') {
            throw new Exception("Error ({$code}): " . trim($response));
        }

        return $response;
    }

    private function read($socket) {
        $response = '';
        while (!feof($socket)) {
            $line = fgets($socket, 512);
            if ($line === false) break;
            $response = $line;
            // Continue reading if this is a continuation line (contains '-' at position 3)
            if (strlen($line) < 4 || $line[3] !== '-') {
                break;
            }
        }
        return $response;
    }

    private function normalizeBody($body) {
        $body = str_replace("\r\n", "\n", $body);
        $body = str_replace("\r", "\n", $body);
        $body = str_replace("\n", "\r\n", $body);
        return str_replace("\r\n.", "\r\n..", $body);
    }

    private function sanitizeHeader($value) {
        return str_replace(["\r", "\n"], '', $value);
    }

    private function generateMessageId() {
        return bin2hex(random_bytes(8)) . '.' . time() . '@floinvite.com';
    }

    public function testConnection() {
        try {
            $socket = $this->connect();
            $this->cmd($socket, "QUIT");
            fclose($socket);
            return ['success' => true, 'message' => "Connected to {$this->smtpHost}:{$this->smtpPort}"];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function getConfig() {
        return [
            'host' => $this->smtpHost,
            'port' => $this->smtpPort,
            'user' => $this->smtpUser,
            'fromEmail' => $this->defaultFromEmail
        ];
    }
}
?>
