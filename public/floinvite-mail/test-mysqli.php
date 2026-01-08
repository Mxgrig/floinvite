<?php
/**
 * Test MySQLi Connection
 * Verify nd_mysqli extension is working
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

$results = [];

// Test 1: Check if mysqli extension is loaded
$results['mysqli_loaded'] = extension_loaded('mysqli');

// Test 2: Try to connect
try {
    require_once __DIR__ . '/../api/env.php';

    $host = getenv('DB_HOST_MAIL') ?: getenv('DB_HOST') ?: 'localhost';
    $user = getenv('DB_USER_MAIL') ?: getenv('DB_USER') ?: 'u958180753_mail';
    $pass = getenv('DB_PASS_MAIL') ?: getenv('DB_PASS') ?: 'floinvit3_Mail#';
    $name = getenv('DB_NAME_MAIL') ?: getenv('DB_NAME') ?: 'u958180753_mail';

    $mysqli = new mysqli($host, $user, $pass, $name);

    if ($mysqli->connect_error) {
        $results['connection'] = [
            'success' => false,
            'error' => $mysqli->connect_error,
            'host' => $host,
            'user' => $user,
            'database' => $name
        ];
    } else {
        // Try a simple query
        $test_query = $mysqli->query("SELECT 1 as test");

        if ($test_query) {
            $row = $test_query->fetch_assoc();
            $mysqli->close();

            $results['connection'] = [
                'success' => true,
                'message' => 'MySQLi connection successful and query working',
                'host' => $host,
                'user' => $user,
                'database' => $name,
                'test_query_result' => $row
            ];
        } else {
            $results['connection'] = [
                'success' => false,
                'error' => $mysqli->error,
                'host' => $host,
                'user' => $user,
                'database' => $name
            ];
            $mysqli->close();
        }
    }
} catch (Exception $e) {
    $results['connection'] = [
        'success' => false,
        'error' => $e->getMessage(),
        'exception' => true
    ];
}

// Test 3: Check MySQLi methods
$results['mysqli_methods'] = [
    'has_prepare' => method_exists('mysqli', 'prepare'),
    'has_query' => method_exists('mysqli', 'query'),
    'has_get_result' => method_exists('mysqli_stmt', 'get_result')
];

// Test 4: Check PHP version
$results['php_version'] = PHP_VERSION;

echo json_encode($results, JSON_PRETTY_PRINT);
?>
