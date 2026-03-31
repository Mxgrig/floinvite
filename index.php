<?php
session_start();

if (!isset($_SESSION['gate_passed'])) {
    header('Location: gate.php');
    exit;
}

readfile(__DIR__ . '/dist/index.html');
