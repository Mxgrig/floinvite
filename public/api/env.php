<?php
/**
 * Load environment variables from .env file
 * Usage: require_once __DIR__ . '/env.php';
 * 
 * Search priority:
 * 1. Project root/.env (main dev config)
 * 2. /public/.env (production fallback)
 * 3. /public/api/.env (legacy location)
 */

$possible_paths = [
    dirname(dirname(__DIR__)) . '/.env',     // Project root
    dirname(__DIR__) . '/.env',              // /public/
    __DIR__ . '/.env'                        // /public/api/
];

$envFile = null;
foreach ($possible_paths as $path) {
    if (file_exists($path)) {
        $envFile = $path;
        break;
    }
}

if ($envFile) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments and empty lines
        if (empty($line) || strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                $value = substr($value, 1, -1);
            }
            
            // Set as environment variable
            putenv("$key=$value");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value; // Also set in $_SERVER for compatibility
        }
    }
}
?>
