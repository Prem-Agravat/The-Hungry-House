<?php
$config = [];
if (file_exists(__DIR__ . '/../config.env')) {
    $config = parse_ini_file(__DIR__ . '/../config.env');
}

return [
    'host' => $config['SMTP_HOST'] ?? 'smtp.gmail.com',
    'port' => (int)($config['SMTP_PORT'] ?? 465),
    'encryption' => $config['SMTP_ENCRYPTION'] ?? 'ssl',
    'username' => $config['SMTP_USER'] ?? '',
    'password' => $config['SMTP_PASS'] ?? '',
    'from_email' => $config['SMTP_FROM_EMAIL'] ?? '',
    'from_name' => $config['SMTP_FROM_NAME'] ?? 'The Hungry House'
];
