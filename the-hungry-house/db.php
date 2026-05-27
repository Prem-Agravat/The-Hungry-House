<?php
date_default_timezone_set('Asia/Kolkata');
// Parse config file
$config = [];
if (file_exists(__DIR__ . '/config.env')) {
    $config = parse_ini_file(__DIR__ . '/config.env');
}

$host = $config['DB_HOST'] ?? 'localhost';
$db   = $config['DB_NAME'] ?? 'hungry_house';
$user = $config['DB_USER'] ?? 'root';
$pass = $config['DB_PASS'] ?? '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
     $pdo = new PDO($dsn, $user, $pass);
} catch (\PDOException $e) {
     die(json_encode(['error' => 'Connection failed: ' . $e->getMessage()]));
}
?>
