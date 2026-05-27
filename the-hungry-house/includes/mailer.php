<?php

function smtpReadResponse($socket): string
{
    $response = '';
    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (preg_match('/^\d{3}\s/', $line)) {
            break;
        }
    }
    return $response;
}

function smtpSendCommand($socket, string $command, array $validCodes = ['250']): bool
{
    fwrite($socket, $command . "\r\n");
    $response = smtpReadResponse($socket);
    foreach ($validCodes as $code) {
        if (strpos($response, (string)$code) === 0) {
            return true;
        }
    }
    return false;
}

function sendOtpEmail(string $toEmail, string $toName, string $otpCode): array
{
    $configPath = __DIR__ . '/smtp-config.php';
    if (!file_exists($configPath)) {
        return ['success' => false, 'message' => 'SMTP config file missing'];
    }

    $cfg = require $configPath;
    $host = $cfg['host'] ?? '';
    $port = (int)($cfg['port'] ?? 465);
    $enc = strtolower($cfg['encryption'] ?? 'ssl');
    $username = $cfg['username'] ?? '';
    $password = $cfg['password'] ?? '';
    $fromEmail = $cfg['from_email'] ?? '';
    $fromName = $cfg['from_name'] ?? 'The Hungry House';

    if (!$host || !$username || !$password || !$fromEmail) {
        return ['success' => false, 'message' => 'SMTP config is incomplete'];
    }

    $transportHost = $enc === 'ssl' ? "ssl://{$host}" : $host;
    $socket = @stream_socket_client("{$transportHost}:{$port}", $errno, $errstr, 20);
    if (!$socket) {
        return ['success' => false, 'message' => "SMTP connection failed: {$errstr}"];
    }

    stream_set_timeout($socket, 20);
    $greeting = smtpReadResponse($socket);
    if (strpos($greeting, '220') !== 0) {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP greeting failed'];
    }

    if (!smtpSendCommand($socket, 'EHLO localhost', ['250'])) {
        fclose($socket);
        return ['success' => false, 'message' => 'EHLO failed'];
    }

    if ($enc === 'tls') {
        if (!smtpSendCommand($socket, 'STARTTLS', ['220'])) {
            fclose($socket);
            return ['success' => false, 'message' => 'STARTTLS failed'];
        }
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return ['success' => false, 'message' => 'TLS handshake failed'];
        }
        if (!smtpSendCommand($socket, 'EHLO localhost', ['250'])) {
            fclose($socket);
            return ['success' => false, 'message' => 'EHLO after TLS failed'];
        }
    }

    if (!smtpSendCommand($socket, 'AUTH LOGIN', ['334']) ||
        !smtpSendCommand($socket, base64_encode($username), ['334']) ||
        !smtpSendCommand($socket, base64_encode($password), ['235'])) {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP authentication failed'];
    }

    if (!smtpSendCommand($socket, "MAIL FROM:<{$fromEmail}>", ['250']) ||
        !smtpSendCommand($socket, "RCPT TO:<{$toEmail}>", ['250', '251']) ||
        !smtpSendCommand($socket, 'DATA', ['354'])) {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP envelope failed'];
    }

    $subject = 'The Hungry House - Password Reset OTP';
    $htmlBody = '
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #eee; border-radius:8px; overflow:hidden;">
        <div style="background:#c62828; color:#fff; padding:16px 20px;">
          <h2 style="margin:0;">The Hungry House</h2>
        </div>
        <div style="padding:20px;">
          <p>Hello ' . htmlspecialchars($toName ?: 'User') . ',</p>
          <p>Use this OTP to reset your password:</p>
          <div style="font-size:28px; font-weight:bold; letter-spacing:4px; color:#c62828; margin:16px 0;">' . htmlspecialchars($otpCode) . '</div>
          <p>This OTP is valid for <strong>2 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      </div>
    ';

    $headers = [];
    $headers[] = "From: {$fromName} <{$fromEmail}>";
    $headers[] = "To: {$toEmail}";
    $headers[] = "Subject: {$subject}";
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';

    $data = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.";
    fwrite($socket, $data . "\r\n");
    $sendResp = smtpReadResponse($socket);
    smtpSendCommand($socket, 'QUIT', ['221']);
    fclose($socket);

    if (strpos($sendResp, '250') !== 0) {
        return ['success' => false, 'message' => 'SMTP send failed'];
    }

    return ['success' => true];
}

function sendRegistrationSuccessEmail(string $toEmail, string $toName): array
{
    $configPath = __DIR__ . '/smtp-config.php';
    if (!file_exists($configPath)) {
        return ['success' => false, 'message' => 'SMTP config file missing'];
    }

    $cfg = require $configPath;
    $host = $cfg['host'] ?? '';
    $port = (int)($cfg['port'] ?? 465);
    $enc = strtolower($cfg['encryption'] ?? 'ssl');
    $username = $cfg['username'] ?? '';
    $password = $cfg['password'] ?? '';
    $fromEmail = $cfg['from_email'] ?? '';
    $fromName = $cfg['from_name'] ?? 'The Hungry House';

    if (!$host || !$username || !$password || !$fromEmail) {
        return ['success' => false, 'message' => 'SMTP config is incomplete'];
    }

    $transportHost = $enc === 'ssl' ? "ssl://{$host}" : $host;
    $socket = @stream_socket_client("{$transportHost}:{$port}", $errno, $errstr, 20);
    if (!$socket) {
        return ['success' => false, 'message' => "SMTP connection failed: {$errstr}"];
    }

    stream_set_timeout($socket, 20);
    $greeting = smtpReadResponse($socket);
    if (strpos($greeting, '220') !== 0) {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP greeting failed'];
    }

    if (!smtpSendCommand($socket, 'EHLO localhost', ['250'])) {
        fclose($socket);
        return ['success' => false, 'message' => 'EHLO failed'];
    }

    if ($enc === 'tls') {
        if (!smtpSendCommand($socket, 'STARTTLS', ['220'])) {
            fclose($socket);
            return ['success' => false, 'message' => 'STARTTLS failed'];
        }
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return ['success' => false, 'message' => 'TLS handshake failed'];
        }
        if (!smtpSendCommand($socket, 'EHLO localhost', ['250'])) {
            fclose($socket);
            return ['success' => false, 'message' => 'EHLO after TLS failed'];
        }
    }

    if (!smtpSendCommand($socket, 'AUTH LOGIN', ['334']) ||
        !smtpSendCommand($socket, base64_encode($username), ['334']) ||
        !smtpSendCommand($socket, base64_encode($password), ['235'])) {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP authentication failed'];
    }

    if (!smtpSendCommand($socket, "MAIL FROM:<{$fromEmail}>", ['250']) ||
        !smtpSendCommand($socket, "RCPT TO:<{$toEmail}>", ['250', '251']) ||
        !smtpSendCommand($socket, 'DATA', ['354'])) {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP envelope failed'];
    }

    $subject = 'Welcome to The Hungry House!';
    $htmlBody = '
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #eee; border-radius:8px; overflow:hidden;">
        <div style="background:#c62828; color:#fff; padding:16px 20px;">
          <h2 style="margin:0;">The Hungry House</h2>
        </div>
        <div style="padding:20px;">
          <h3 style="margin-top:0; color:#c62828;">Congratulations, ' . htmlspecialchars($toName ?: 'Food Lover') . '!</h3>
          <p>Your account has been created successfully.</p>
          <p>We are excited to have you with us. Explore our menu, unlock special offers, and enjoy your meals with The Hungry House.</p>
          <div style="margin:20px 0; padding:12px; background:#fff3e0; border-left:4px solid #ff9800;">
            <strong>Welcome Offer:</strong> Check the Offers section to grab active discounts.
          </div>
          <p style="margin-bottom:0;">Thank you for joining us!</p>
        </div>
      </div>
    ';

    $headers = [];
    $headers[] = "From: {$fromName} <{$fromEmail}>";
    $headers[] = "To: {$toEmail}";
    $headers[] = "Subject: {$subject}";
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';

    $data = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.";
    fwrite($socket, $data . "\r\n");
    $sendResp = smtpReadResponse($socket);
    smtpSendCommand($socket, 'QUIT', ['221']);
    fclose($socket);

    if (strpos($sendResp, '250') !== 0) {
        return ['success' => false, 'message' => 'SMTP send failed'];
    }

    return ['success' => true];
}

