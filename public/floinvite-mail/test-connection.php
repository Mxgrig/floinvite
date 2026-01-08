<?php
/**
 * Test Database and SMTP Connection
 * No authentication required - diagnostic only
 */

// Force error display
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

$results = [];

try {
    // Load environment without requiring auth
    require_once __DIR__ . '/../api/env.php';

    // Test 1: PHP Extensions
    $results['extensions'] = [
        'pdo' => extension_loaded('pdo'),
        'sockets' => extension_loaded('sockets'),
        'json' => extension_loaded('json'),
        'pdo_drivers' => PDO::getAvailableDrivers()
    ];

    // Test 2: Database Connection
    try {
        $host = getenv('DB_HOST_MAIL') ?: getenv('DB_HOST') ?: 'localhost';
        $user = getenv('DB_USER_MAIL') ?: getenv('DB_USER') ?: 'u958180753_mail';
        $pass = getenv('DB_PASS_MAIL') ?: getenv('DB_PASS') ?: 'floinvit3_Mail#';
        $name = getenv('DB_NAME_MAIL') ?: getenv('DB_NAME') ?: 'u958180753_mail';

        $pdo = new PDO(
            'mysql:host=' . $host . ';dbname=' . $name . ';charset=utf8mb4',
            $user,
            $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
        );

        $stmt = $pdo->query("SELECT 1");
        $stmt->fetch();

        $results['database'] = [
            'success' => true,
            'host' => $host,
            'user' => $user,
            'database' => $name
        ];
    } catch (PDOException $e) {
        $results['database'] = [
            'success' => false,
            'error' => $e->getMessage(),
            'code' => $e->getCode(),
            'host' => $host ?? 'unknown',
            'user' => $user ?? 'unknown',
            'database' => $name ?? 'unknown'
        ];
    }

    // Test 3: SMTP Configuration
    $smtp_host = getenv('SMTP_HOST') ?: 'smtp.hostinger.com';
    $smtp_port = getenv('SMTP_PORT') ?: 465;
    $smtp_user = getenv('SMTP_USER') ?: 'campaigns@floinvite.com';

    $results['smtp_config'] = [
        'host' => $smtp_host,
        'port' => $smtp_port,
        'user' => $smtp_user,
        'has_password' => !empty(getenv('SMTP_PASS'))
    ];

    // Test 4: Environment Variables Loaded
    $results['env_loaded'] = [
        'DB_HOST' => getenv('DB_HOST') ? 'yes' : 'no',
        'DB_USER_MAIL' => getenv('DB_USER_MAIL') ? 'yes' : 'no',
        'DB_PASS_MAIL' => getenv('DB_PASS_MAIL') ? 'yes' : 'no',
        'DB_NAME_MAIL' => getenv('DB_NAME_MAIL') ? 'yes' : 'no',
        'SMTP_HOST' => getenv('SMTP_HOST') ? 'yes' : 'no',
        'SMTP_USER' => getenv('SMTP_USER') ? 'yes' : 'no',
        'SMTP_PASS' => getenv('SMTP_PASS') ? 'yes' : 'no'
    ];

} catch (Exception $e) {
    $results['error'] = [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
