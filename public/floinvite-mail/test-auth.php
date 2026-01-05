<?php
/**
 * Local Test Auth - For development/demo purposes only
 */
session_start();
$_SESSION['admin_logged_in'] = true;
$_SESSION['last_activity'] = time();
header('Location: index.php');
exit;
?>
