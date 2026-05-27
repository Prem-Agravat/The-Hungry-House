<?php

function ensureForgotPasswordTable(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS password_reset_otps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            email VARCHAR(150) NOT NULL,
            otpCode VARCHAR(6) NOT NULL,
            expiresAt DATETIME NOT NULL,
            isUsed TINYINT(1) NOT NULL DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email_used (email, isUsed),
            INDEX idx_user_used (userId, isUsed)
        )
    ");
}

function generateOtpCode(): string
{
    return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

