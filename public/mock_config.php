<?php
// Mock config for local testing (no database needed)

session_start();
$_SESSION['admin_logged_in'] = true;

define('BASE_URL', 'http://127.0.0.1:8080/floinvite-mail');
define('UPLOAD_DIR', __DIR__ . '/floinvite-mail/uploads');
define('SESSION_TIMEOUT', 3600);

function get_db() {
    return new MockDB();
}

class MockDB {
    public function prepare($sql) {
        return new MockStmt();
    }
    
    public function query($sql) {
        return new MockResult();
    }
    
    public $insert_id = 1;
}

class MockStmt {
    public function bind_param($types, &...$params) {
        return true;
    }
    
    public function execute() {
        return true;
    }
    
    public function get_result() {
        return new MockResult();
    }
}

class MockResult {
    public function fetch_assoc() {
        return ['count' => 150];
    }
    
    public function fetch_all() {
        return [];
    }
}

function require_auth() {
    $_SESSION['admin_logged_in'] = true;
}

function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function generate_tracking_id() {
    return bin2hex(random_bytes(16));
}

function htmlspecialchars_array($array) {
    return array_map('htmlspecialchars', $array);
}

function logo_url() {
    return '';
}

function get_logo_url() {
    return '';
}
