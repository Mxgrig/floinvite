<?php
session_start();

if (!isset($_SESSION['gate_passed'])) {
    header('Location: gate.php');
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
readfile(__DIR__ . '/dist/index.html');
