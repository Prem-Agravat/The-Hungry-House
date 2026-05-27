<?php

function ensureTableBookingsTable(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS restaurant_table_bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            tableId INT NOT NULL,
            bookingDate DATE NOT NULL,
            bookingTime TIME NOT NULL,
            durationMinutes INT NOT NULL DEFAULT 60,
            startAt DATETIME NOT NULL,
            endAt DATETIME NOT NULL,
            status ENUM('confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'confirmed',
            notes TEXT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_table_time (tableId, startAt, endAt, status),
            INDEX idx_user_date (userId, bookingDate)
        )
    ");
}

function getTomorrowDateString(): string
{
    return date('Y-m-d', strtotime('+1 day'));
}

function getTodayDateString(): string
{
    return date('Y-m-d');
}

function isAllowedAdvanceBookingDate(string $date): bool
{
    return in_array($date, [getTodayDateString(), getTomorrowDateString()], true);
}

function buildDateTimes(string $bookingDate, string $bookingTime, int $durationMinutes): array
{
    $startAt = date('Y-m-d H:i:s', strtotime($bookingDate . ' ' . $bookingTime));
    $endAt = date('Y-m-d H:i:s', strtotime($startAt . " +{$durationMinutes} minutes"));
    return [$startAt, $endAt];
}

function hasOverlappingBooking(PDO $pdo, int $tableId, string $startAt, string $endAt): bool
{
    $stmt = $pdo->prepare("
        SELECT id
        FROM restaurant_table_bookings
        WHERE tableId = ?
          AND status = 'confirmed'
          AND startAt < ?
          AND endAt > ?
        LIMIT 1
    ");
    $stmt->execute([$tableId, $endAt, $startAt]);
    return (bool)$stmt->fetch();
}

function syncTableStatusesFromBookings(PDO $pdo): void
{
    ensureTableBookingsTable($pdo);

    $now = date('Y-m-d H:i:s');

    // Mark past bookings completed.
    $stmtComplete = $pdo->prepare("
        UPDATE restaurant_table_bookings
        SET status = 'completed'
        WHERE status = 'confirmed' AND endAt <= ?
    ");
    $stmtComplete->execute([$now]);

    // Set occupied for tables currently in active booking window.
    $stmtActive = $pdo->prepare("
        SELECT DISTINCT tableId
        FROM restaurant_table_bookings
        WHERE status = 'confirmed'
          AND startAt <= ?
          AND endAt > ?
    ");
    $stmtActive->execute([$now, $now]);
    $activeIds = array_map('intval', array_column($stmtActive->fetchAll(), 'tableId'));

    if (!empty($activeIds)) {
        $placeholders = implode(',', array_fill(0, count($activeIds), '?'));
        $stmtOcc = $pdo->prepare("
            UPDATE restaurant_tables
            SET status = 'occupied'
            WHERE id IN ($placeholders)
        ");
        $stmtOcc->execute($activeIds);
    }

    // Release tables that are not actively booked and not linked to an active dine-in order.
    $stmtRelease = $pdo->prepare("
        UPDATE restaurant_tables t
        LEFT JOIN orders o
          ON o.tableNumber = t.number
         AND o.type = 'dine-in'
         AND o.status IN ('pending', 'preparing', 'ready')
        SET t.status = 'available', t.currentOrder = NULL
        WHERE o.id IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM restaurant_table_bookings b
            WHERE b.tableId = t.id
              AND b.status = 'confirmed'
              AND b.startAt <= ?
              AND b.endAt > ?
          )
    ");
    $stmtRelease->execute([$now, $now]);
}

