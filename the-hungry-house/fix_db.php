<?php
require 'db.php';
try {
    $pdo->exec("ALTER TABLE orders MODIFY COLUMN status ENUM('pending','preparing','ready','delivered','cancelled') DEFAULT 'pending'");
    echo 'success';
} catch (Exception $e) {
    echo 'error: ' . $e->getMessage();
}
