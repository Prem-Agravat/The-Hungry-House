<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');
usleep(800000); // Simulate network latency so local dev can see loaders
require_once 'db.php';
require_once 'includes/table-booking-utils.php';
require_once 'includes/forgot-password-utils.php';
require_once 'includes/mailer.php';

$action = $_GET['action'] ?? '';

function ensureOrderRatingColumns($pdo) {
    static $checked = false;
    if ($checked) {
        return;
    }

    $databaseName = $pdo->query("SELECT DATABASE()")->fetchColumn();
    $stmt = $pdo->prepare("
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'orders'
          AND COLUMN_NAME IN ('rating', 'ratingComment', 'ratedAt')
    ");
    $stmt->execute([$databaseName]);
    $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('rating', $existingColumns, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN rating TINYINT UNSIGNED DEFAULT NULL");
    }
    if (!in_array('ratingComment', $existingColumns, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN ratingComment TEXT DEFAULT NULL");
    }
    if (!in_array('ratedAt', $existingColumns, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN ratedAt DATETIME DEFAULT NULL");
    }

    $checked = true;
}

function ensureOrderDateTimeColumn($pdo) {
    static $checked = false;
    if ($checked) {
        return;
    }

    $databaseName = $pdo->query("SELECT DATABASE()")->fetchColumn();
    $stmt = $pdo->prepare("
        SELECT DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'orders'
          AND COLUMN_NAME = 'date'
        LIMIT 1
    ");
    $stmt->execute([$databaseName]);
    $dateType = $stmt->fetchColumn();

    if ($dateType === 'date') {
        $pdo->exec("ALTER TABLE orders MODIFY COLUMN `date` DATETIME DEFAULT NULL");
    }

    $checked = true;
}

function attachFoodRatings($pdo, &$foodItems) {
    if (!$foodItems) {
        return;
    }

    $stmt = $pdo->query("
        SELECT
            oi.foodId,
            AVG(o.rating) AS avgRating,
            COUNT(DISTINCT o.id) AS ratingCount
        FROM order_items oi
        JOIN orders o ON o.id = oi.orderId
        WHERE o.status = 'delivered'
          AND o.rating IS NOT NULL
        GROUP BY oi.foodId
    ");
    $ratingsByFood = [];
    foreach ($stmt->fetchAll() as $row) {
        $ratingsByFood[(int)$row['foodId']] = [
            'avgRating' => round((float)$row['avgRating'], 1),
            'ratingCount' => (int)$row['ratingCount']
        ];
    }

    foreach ($foodItems as &$food) {
        $foodId = (int)$food['id'];
        $food['avgRating'] = $ratingsByFood[$foodId]['avgRating'] ?? 0;
        $food['ratingCount'] = $ratingsByFood[$foodId]['ratingCount'] ?? 0;
    }
}

switch ($action) {
    case 'get_all':
        syncTableStatusesFromBookings($pdo);
        ensureOrderRatingColumns($pdo);
        ensureOrderDateTimeColumn($pdo);
        $userId = $_GET['userId'] ?? 0;
        $data = [
            'users' => $pdo->query("SELECT * FROM users")->fetchAll(),
            'foodItems' => $pdo->query("SELECT * FROM food_items")->fetchAll(),
            'tables' => $pdo->query("SELECT * FROM restaurant_tables")->fetchAll(),
            'orders' => $pdo->query("SELECT * FROM orders")->fetchAll()
        ];
        attachFoodRatings($pdo, $data['foodItems']);
        $isAdmin = isset($_SESSION['user']) && ($_SESSION['user']['role'] ?? '') === 'admin';
        
        if ($isAdmin) {
            $data['offers'] = $pdo->query("SELECT * FROM offers")->fetchAll();
        } else {
            // Fetch only active, unused offers for the user
            $stmt = $pdo->prepare("SELECT * FROM offers WHERE id NOT IN (SELECT offerId FROM used_offers WHERE userId = ?) AND isActive = 1");
            $stmt->execute([$userId]);
            $data['offers'] = $stmt->fetchAll();
        }
        
        // Add items to orders
        foreach ($data['orders'] as &$order) {
            $stmt = $pdo->prepare("SELECT * FROM order_items WHERE orderId = ?");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll();
        }
        
        echo json_encode($data);
        break;

    case 'login':
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
        $stmt->execute([$email, $password]);
        $user = $stmt->fetch();
        if ($user) {
            $_SESSION['user'] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ];
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
        break;

    case 'send_forgot_otp':
        ensureForgotPasswordTable($pdo);
        $email = trim($_POST['email'] ?? '');
        if (!$email) {
            echo json_encode(['success' => false, 'message' => 'Email is required']);
            break;
        }

        $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'Email is not registered']);
            break;
        }

        $otpCode = generateOtpCode();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+2 minutes'));

        $pdo->prepare("UPDATE password_reset_otps SET isUsed = 1 WHERE email = ? AND isUsed = 0")
            ->execute([$email]);

        $stmtOtp = $pdo->prepare("INSERT INTO password_reset_otps (userId, email, otpCode, expiresAt, isUsed) VALUES (?, ?, ?, ?, 0)");
        $stmtOtp->execute([$user['id'], $email, $otpCode, $expiresAt]);

        $mailResult = sendOtpEmail($email, $user['name'], $otpCode);
        if (!$mailResult['success']) {
            echo json_encode(['success' => false, 'message' => $mailResult['message'] ?? 'Failed to send OTP email']);
            break;
        }

        echo json_encode(['success' => true, 'message' => 'OTP sent successfully']);
        break;

    case 'verify_forgot_otp':
        ensureForgotPasswordTable($pdo);
        $email = trim($_POST['email'] ?? '');
        $otp = trim($_POST['otp'] ?? '');

        if (!$email || !$otp) {
            echo json_encode(['success' => false, 'message' => 'Email and OTP are required']);
            break;
        }

        $stmt = $pdo->prepare("
            SELECT * FROM password_reset_otps
            WHERE email = ? AND otpCode = ? AND isUsed = 0
            ORDER BY id DESC
            LIMIT 1
        ");
        $stmt->execute([$email, $otp]);
        $otpRow = $stmt->fetch();

        if (!$otpRow) {
            echo json_encode(['success' => false, 'message' => 'Invalid OTP']);
            break;
        }

        if (strtotime($otpRow['expiresAt']) < time()) {
            echo json_encode(['success' => false, 'message' => 'OTP expired']);
            break;
        }

        $_SESSION['password_reset_email'] = $email;
        $_SESSION['password_reset_otp_id'] = (int)$otpRow['id'];
        echo json_encode(['success' => true, 'message' => 'OTP verified']);
        break;

    case 'reset_password_with_otp':
        ensureForgotPasswordTable($pdo);
        $email = trim($_POST['email'] ?? '');
        $newPassword = $_POST['newPassword'] ?? '';

        if (!$email || !$newPassword) {
            echo json_encode(['success' => false, 'message' => 'Email and new password are required']);
            break;
        }

        if (strlen($newPassword) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            break;
        }

        if (
            !isset($_SESSION['password_reset_email'], $_SESSION['password_reset_otp_id']) ||
            $_SESSION['password_reset_email'] !== $email
        ) {
            echo json_encode(['success' => false, 'message' => 'OTP verification is required']);
            break;
        }

        $otpId = (int)$_SESSION['password_reset_otp_id'];
        $stmtOtp = $pdo->prepare("SELECT * FROM password_reset_otps WHERE id = ? AND email = ? AND isUsed = 0 LIMIT 1");
        $stmtOtp->execute([$otpId, $email]);
        $otpRow = $stmtOtp->fetch();
        if (!$otpRow) {
            echo json_encode(['success' => false, 'message' => 'OTP is invalid or already used']);
            break;
        }

        if (strtotime($otpRow['expiresAt']) < time()) {
            echo json_encode(['success' => false, 'message' => 'OTP expired']);
            break;
        }

        $stmtUser = $pdo->prepare("SELECT id, password FROM users WHERE email = ? LIMIT 1");
        $stmtUser->execute([$email]);
        $user = $stmtUser->fetch();
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            break;
        }

        if ($user['password'] === $newPassword) {
            echo json_encode(['success' => false, 'message' => 'New password must be different from current password']);
            break;
        }

        $pdo->beginTransaction();
        try {
            $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$newPassword, $user['id']]);
            $pdo->prepare("UPDATE password_reset_otps SET isUsed = 1 WHERE id = ?")->execute([$otpId]);
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Failed to update password']);
            break;
        }

        unset($_SESSION['password_reset_email'], $_SESSION['password_reset_otp_id']);
        echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
        break;

    case 'place_order':
        ensureOrderDateTimeColumn($pdo);
        $orderData = json_decode(file_get_contents('php://input'), true);
        if (!$orderData) {
            echo json_encode(['success' => false, 'message' => 'No order data']);
            break;
        }

        try {
            syncTableStatusesFromBookings($pdo);
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("INSERT INTO orders (userId, type, subtotal, tax, delivery, total, status, date, customerName, customerPhone, address, tableNumber, numberOfGuests, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $orderData['userId'],
                $orderData['type'],
                $orderData['subtotal'],
                $orderData['tax'],
                $orderData['delivery'],
                $orderData['total'],
                $orderData['status'],
                $orderData['date'] ?? date('Y-m-d H:i:s'),
                $orderData['customerName'],
                $orderData['customerPhone'],
                $orderData['address'] ?? null,
                $orderData['tableNumber'] ?? null,
                $orderData['numberOfGuests'] ?? null,
                $orderData['paymentMethod']
            ]);
            
            $orderId = $pdo->lastInsertId();
            
            // Record used offer if any
            if (isset($orderData['appliedOfferId']) && $orderData['userId']) {
                $stmtOffer = $pdo->prepare("INSERT INTO used_offers (userId, offerId) VALUES (?, ?)");
                $stmtOffer->execute([$orderData['userId'], $orderData['appliedOfferId']]);
            }
            
            $stmtItem = $pdo->prepare("INSERT INTO order_items (orderId, foodId, name, quantity, price) VALUES (?, ?, ?, ?, ?)");
            foreach ($orderData['items'] as $item) {
                $stmtItem->execute([
                    $orderId,
                    $item['foodId'],
                    $item['name'],
                    $item['quantity'],
                    $item['price']
                ]);
            }

            // Mark the table as occupied for dine-in orders
            if (isset($orderData['type']) && $orderData['type'] === 'dine-in' && !empty($orderData['tableNumber'])) {
                $stmtTable = $pdo->prepare("UPDATE restaurant_tables SET status = 'occupied', currentOrder = ? WHERE number = ?");
                $stmtTable->execute([$orderId, $orderData['tableNumber']]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'orderId' => $orderId]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'register':
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $phone = $_POST['phone'] ?? '';
        
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Email already registered']);
            break;
        }

        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'user')");
        if ($stmt->execute([$name, $email, $password, $phone])) {
            $userId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $newUser = $stmt->fetch();
            $_SESSION['user'] = [
                'id' => $newUser['id'],
                'name' => $newUser['name'],
                'email' => $newUser['email'],
                'role' => $newUser['role']
            ];

            $welcomeMail = sendRegistrationSuccessEmail($newUser['email'], $newUser['name']);
            $response = ['success' => true, 'user' => $newUser];
            if (!$welcomeMail['success']) {
                $response['mailWarning'] = $welcomeMail['message'] ?? 'Registration email could not be sent';
            }
            echo json_encode($response);
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed']);
        }
        break;

    case 'logout':
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
        }
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    case 'update_order_status':
        syncTableStatusesFromBookings($pdo);
        $orderId = $_POST['orderId'] ?? '';
        $status = $_POST['status'] ?? '';
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        if ($stmt->execute([$status, $orderId])) {
            // If dine-in and finished, free the table
            if ($status === 'delivered' || $status === 'cancelled') {
                $stmt = $pdo->prepare("SELECT type, tableNumber FROM orders WHERE id = ?");
                $stmt->execute([$orderId]);
                $order = $stmt->fetch();
                if ($order && $order['type'] === 'dine-in') {
                    $stmtActiveBooking = $pdo->prepare("
                        SELECT 1 FROM restaurant_table_bookings b
                        JOIN restaurant_tables t ON t.id = b.tableId
                        WHERE t.number = ?
                          AND b.status = 'confirmed'
                          AND b.startAt <= NOW()
                          AND b.endAt > NOW()
                        LIMIT 1
                    ");
                    $stmtActiveBooking->execute([$order['tableNumber']]);

                    if (!$stmtActiveBooking->fetch()) {
                        $stmt = $pdo->prepare("UPDATE restaurant_tables SET status = 'available', currentOrder = NULL WHERE number = ?");
                        $stmt->execute([$order['tableNumber']]);
                    }
                }
            }
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false]);
        }
        break;

    case 'save_food':
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data['id']) {
            $stmt = $pdo->prepare("UPDATE food_items SET name=?, description=?, price=?, offerPrice=?, category=?, image=?, isAvailable=?, isOffer=? WHERE id=?");
            $stmt->execute([$data['name'], $data['description'], $data['price'], $data['offerPrice'], $data['category'], $data['image'], $data['isAvailable'], $data['isOffer'], $data['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO food_items (name, description, price, offerPrice, category, image, isAvailable, isOffer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data['name'], $data['description'], $data['price'], $data['offerPrice'], $data['category'], $data['image'], $data['isAvailable'], $data['isOffer']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'delete_food':
        $id = $_POST['id'] ?? '';
        $stmt = $pdo->prepare("DELETE FROM food_items WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;

    case 'save_user':
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data['id']) {
            if ($data['password']) {
                $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, password=?, phone=?, role=? WHERE id=?");
                $stmt->execute([$data['name'], $data['email'], $data['password'], $data['phone'], $data['role'], $data['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, phone=?, role=? WHERE id=?");
                $stmt->execute([$data['name'], $data['email'], $data['phone'], $data['role'], $data['id']]);
            }
        } else {
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$data['name'], $data['email'], $data['password'] ?: 'default123', $data['phone'], $data['role']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'delete_user':
        $id = $_POST['id'] ?? '';
        if ($id == 1) {
            echo json_encode(['success' => false, 'message' => 'Cannot delete main admin']);
            break;
        }
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;

    case 'save_offer':
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data['id']) {
            $stmt = $pdo->prepare("UPDATE offers SET title=?, code=?, discount=?, description=?, validUntil=?, isActive=? WHERE id=?");
            $stmt->execute([$data['title'], $data['code'], $data['discount'], $data['description'], $data['validUntil'], $data['isActive'], $data['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO offers (title, code, discount, description, validUntil, isActive) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data['title'], $data['code'], $data['discount'], $data['description'], $data['validUntil'], $data['isActive']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'delete_offer':
        $id = $_POST['id'] ?? '';
        $stmt = $pdo->prepare("DELETE FROM offers WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;

    case 'save_table':
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data['id']) {
            $stmt = $pdo->prepare("UPDATE restaurant_tables SET number=?, seats=?, status=? WHERE id=?");
            $stmt->execute([$data['number'], $data['seats'], $data['status'], $data['id']]);

            // If admin manually sets table to 'available', cancel any active bookings
            // so the auto-sync doesn't override the admin's decision
            if ($data['status'] === 'available') {
                $now = date('Y-m-d H:i:s');
                $stmtCancel = $pdo->prepare("
                    UPDATE restaurant_table_bookings
                    SET status = 'completed'
                    WHERE tableId = ?
                      AND status = 'confirmed'
                      AND startAt <= ?
                      AND endAt > ?
                ");
                $stmtCancel->execute([$data['id'], $now, $now]);
            }
        } else {
            $stmt = $pdo->prepare("INSERT INTO restaurant_tables (number, seats, status) VALUES (?, ?, ?)");
            $stmt->execute([$data['number'], $data['seats'], $data['status']]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'get_advance_tables':
        syncTableStatusesFromBookings($pdo);
        ensureTableBookingsTable($pdo);

        $bookingDate = $_GET['bookingDate'] ?? '';
        $bookingTime = $_GET['bookingTime'] ?? '';
        $durationMinutes = isset($_GET['durationMinutes']) ? (int)$_GET['durationMinutes'] : 60;

        if (!$bookingDate || !$bookingTime) {
            echo json_encode(['success' => false, 'message' => 'Date and time are required']);
            break;
        }

        if (!isAllowedAdvanceBookingDate($bookingDate)) {
            echo json_encode(['success' => false, 'message' => 'You can book tables only for today or tomorrow']);
            break;
        }

        if ($durationMinutes < 30 || $durationMinutes > 240) {
            $durationMinutes = 60;
        }

        [$startAt, $endAt] = buildDateTimes($bookingDate, $bookingTime, $durationMinutes);

        // Check availability by booking overlap only — a table occupied NOW may
        // be free during the requested future time slot, and vice-versa.
        $stmt = $pdo->prepare("
            SELECT t.*
            FROM restaurant_tables t
            WHERE NOT EXISTS (
                SELECT 1
                FROM restaurant_table_bookings b
                WHERE b.tableId = t.id
                  AND b.status = 'confirmed'
                  AND b.startAt < ?
                  AND b.endAt > ?
              )
            ORDER BY t.number ASC
        ");
        $stmt->execute([$endAt, $startAt]);
        $tables = $stmt->fetchAll();

        echo json_encode(['success' => true, 'tables' => $tables]);
        break;

    case 'book_tables_advance':
        syncTableStatusesFromBookings($pdo);
        ensureTableBookingsTable($pdo);

        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Please login first']);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $tableIds = $data['tableIds'] ?? [];
        $bookingDate = $data['bookingDate'] ?? '';
        $bookingTime = $data['bookingTime'] ?? '';
        $durationMinutes = isset($data['durationMinutes']) ? (int)$data['durationMinutes'] : 60;
        $notes = trim($data['notes'] ?? '');

        if (!$bookingDate || !$bookingTime || empty($tableIds)) {
            echo json_encode(['success' => false, 'message' => 'Please select date, time and at least one table']);
            break;
        }

        if (!isAllowedAdvanceBookingDate($bookingDate)) {
            echo json_encode(['success' => false, 'message' => 'You can book tables only for today or tomorrow']);
            break;
        }

        if ($durationMinutes < 30 || $durationMinutes > 240) {
            echo json_encode(['success' => false, 'message' => 'Duration must be between 30 and 240 minutes']);
            break;
        }

        [$startAt, $endAt] = buildDateTimes($bookingDate, $bookingTime, $durationMinutes);
        $userId = (int)$_SESSION['user']['id'];

        try {
            $pdo->beginTransaction();

            $tableIds = array_values(array_unique(array_map('intval', $tableIds)));
            $stmtTable = $pdo->prepare("SELECT id, status FROM restaurant_tables WHERE id = ? LIMIT 1");
            $stmtInsert = $pdo->prepare("
                INSERT INTO restaurant_table_bookings
                (userId, tableId, bookingDate, bookingTime, durationMinutes, startAt, endAt, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
            ");

            foreach ($tableIds as $tableId) {
                $stmtTable->execute([$tableId]);
                $table = $stmtTable->fetch();
                if (!$table) {
                    throw new Exception("Selected table does not exist");
                }

                if ($table['status'] === 'occupied') {
                    throw new Exception("A selected table is currently occupied");
                }

                if (hasOverlappingBooking($pdo, $tableId, $startAt, $endAt)) {
                    throw new Exception("A selected table is occupied at the selected time");
                }

                $stmtInsert->execute([
                    $userId,
                    $tableId,
                    $bookingDate,
                    $bookingTime,
                    $durationMinutes,
                    $startAt,
                    $endAt,
                    $notes ?: null
                ]);
            }

            // If booking starts now (rare), occupy immediately.
            $now = date('Y-m-d H:i:s');
            if ($startAt <= $now && $endAt > $now) {
                $placeholders = implode(',', array_fill(0, count($tableIds), '?'));
                $stmtOcc = $pdo->prepare("UPDATE restaurant_tables SET status = 'occupied' WHERE id IN ($placeholders)");
                $stmtOcc->execute($tableIds);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Table booking created successfully']);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get_my_table_bookings':
        syncTableStatusesFromBookings($pdo);
        ensureTableBookingsTable($pdo);

        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Please login first']);
            break;
        }

        $userId = (int)$_SESSION['user']['id'];
        $stmt = $pdo->prepare("
            SELECT b.*, t.number AS tableNumber, t.seats AS tableSeats
            FROM restaurant_table_bookings b
            JOIN restaurant_tables t ON t.id = b.tableId
            WHERE b.userId = ?
            ORDER BY b.startAt DESC
        ");
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'bookings' => $stmt->fetchAll()]);
        break;

    case 'get_all_advance_bookings':
        syncTableStatusesFromBookings($pdo);
        ensureTableBookingsTable($pdo);

        if (!isset($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            break;
        }

        $stmt = $pdo->query("
            SELECT
                b.*,
                t.number AS tableNumber,
                t.seats AS tableSeats,
                u.name AS userName,
                u.email AS userEmail,
                u.phone AS userPhone
            FROM restaurant_table_bookings b
            JOIN restaurant_tables t ON t.id = b.tableId
            JOIN users u ON u.id = b.userId
            ORDER BY b.startAt DESC
        ");
        echo json_encode(['success' => true, 'bookings' => $stmt->fetchAll()]);
        break;

    case 'update_profile':
        $userId = $_POST['userId'] ?? '';
        $name = $_POST['name'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $currentPassword = $_POST['currentPassword'] ?? '';
        $newPassword = $_POST['newPassword'] ?? '';

        // Verify current user exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            break;
        }

        // If changing password, verify current password
        if ($newPassword) {
            if ($currentPassword !== $user['password']) {
                echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
                break;
            }
        }

        // Update user profile
        if ($newPassword) {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?");
            $stmt->execute([$name, $phone, $newPassword, $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
            $stmt->execute([$name, $phone, $userId]);
        }

        // Return updated user data
        $stmt = $pdo->prepare("SELECT id, name, email, phone, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch();

        echo json_encode(['success' => true, 'user' => $updatedUser]);
        break;

    case 'get_user_orders':
        ensureOrderRatingColumns($pdo);
        ensureOrderDateTimeColumn($pdo);
        $userId = $_GET['userId'] ?? '';

        $stmt = $pdo->prepare("
            SELECT o.*, GROUP_CONCAT(
                CONCAT(oi.name, ' (', oi.quantity, ' x ₹', oi.price, ')')
                SEPARATOR ', '
            ) as items_summary
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.orderId
            WHERE o.userId = ?
            GROUP BY o.id
            ORDER BY o.date DESC
        ");
        $stmt->execute([$userId]);
        $orders = $stmt->fetchAll();

        // Get detailed items for each order
        foreach ($orders as &$order) {
            $stmt = $pdo->prepare("SELECT * FROM order_items WHERE orderId = ?");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll();
        }

        echo json_encode(['success' => true, 'orders' => $orders]);
        break;

    case 'rate_order':
        ensureOrderRatingColumns($pdo);

        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Please login first']);
            break;
        }

        $orderId = isset($_POST['orderId']) ? (int)$_POST['orderId'] : 0;
        $rating = isset($_POST['rating']) ? (int)$_POST['rating'] : 0;
        $comment = trim($_POST['comment'] ?? '');
        $userId = (int)$_SESSION['user']['id'];

        if (!$orderId || $rating < 1 || $rating > 5) {
            echo json_encode(['success' => false, 'message' => 'Please select a rating from 1 to 5']);
            break;
        }

        $stmt = $pdo->prepare("SELECT id, userId, status, rating FROM orders WHERE id = ? LIMIT 1");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order || (int)$order['userId'] !== $userId) {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            break;
        }

        if ($order['status'] !== 'delivered') {
            echo json_encode(['success' => false, 'message' => 'You can rate only delivered orders']);
            break;
        }

        if (!empty($order['rating'])) {
            echo json_encode(['success' => false, 'message' => 'This order is already rated']);
            break;
        }

        $stmt = $pdo->prepare("UPDATE orders SET rating = ?, ratingComment = ?, ratedAt = NOW() WHERE id = ?");
        $stmt->execute([$rating, $comment ?: null, $orderId]);

        echo json_encode(['success' => true, 'message' => 'Thanks for rating your order']);
        break;

    case 'sync_table_status':
        // Automatic time-based table status synchronization endpoint
        // Called periodically by frontend for real-time updates
        try {
            syncTableStatusesFromBookings($pdo);
            
            // Return updated table statuses
            $tables = $pdo->query("SELECT * FROM restaurant_tables")->fetchAll();

            // Return active bookings so frontend can show live countdowns
            $now = date('Y-m-d H:i:s');
            $stmtActive = $pdo->prepare("
                SELECT b.*, t.number AS tableNumber, t.seats AS tableSeats,
                       u.name AS userName
                FROM restaurant_table_bookings b
                JOIN restaurant_tables t ON t.id = b.tableId
                JOIN users u ON u.id = b.userId
                WHERE b.status = 'confirmed'
                ORDER BY b.startAt ASC
            ");
            $stmtActive->execute();
            $activeBookings = $stmtActive->fetchAll();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Table statuses synchronized successfully',
                'tables' => $tables,
                'activeBookings' => $activeBookings,
                'serverTime' => $now,
                'timestamp' => $now
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false, 
                'message' => 'Failed to sync table statuses: ' . $e->getMessage()
            ]);
        }
        break;

    case 'cancel_table_booking':
        syncTableStatusesFromBookings($pdo);
        ensureTableBookingsTable($pdo);

        if (!isset($_SESSION['user'])) {
            echo json_encode(['success' => false, 'message' => 'Please login first']);
            break;
        }

        $bookingId = isset($_POST['bookingId']) ? (int)$_POST['bookingId'] : 0;
        if (!$bookingId) {
            echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
            break;
        }

        $userId = (int)$_SESSION['user']['id'];
        $isAdmin = ($_SESSION['user']['role'] ?? '') === 'admin';

        // Fetch the booking
        $stmtBooking = $pdo->prepare("SELECT * FROM restaurant_table_bookings WHERE id = ? LIMIT 1");
        $stmtBooking->execute([$bookingId]);
        $booking = $stmtBooking->fetch();

        if (!$booking) {
            echo json_encode(['success' => false, 'message' => 'Booking not found']);
            break;
        }

        // Only the owner or admin can cancel
        if ((int)$booking['userId'] !== $userId && !$isAdmin) {
            echo json_encode(['success' => false, 'message' => 'You can only cancel your own bookings']);
            break;
        }

        if ($booking['status'] !== 'confirmed') {
            echo json_encode(['success' => false, 'message' => 'Only confirmed bookings can be cancelled']);
            break;
        }

        try {
            $pdo->beginTransaction();

            $pdo->prepare("UPDATE restaurant_table_bookings SET status = 'cancelled' WHERE id = ?")->execute([$bookingId]);

            // Re-sync table statuses after cancellation
            syncTableStatusesFromBookings($pdo);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully']);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(['success' => false, 'message' => 'Failed to cancel booking: ' . $e->getMessage()]);
        }
        break;

    case 'create_razorpay_order':
        // Create a Razorpay order for online payment==========================================================
        $rzpKeyId = 'rzp_test_SbVRSTpq1w3o0A';
        $rzpKeySecret = '5cWfRy06BsS8xNI8X3NFwMBB';

        $input = json_decode(file_get_contents('php://input'), true);
        $amountInPaise = isset($input['amount']) ? (int)round($input['amount'] * 100) : 0;
        $receiptId = $input['receipt'] ?? ('rcpt_' . time());

        if ($amountInPaise < 100) {
            echo json_encode(['success' => false, 'message' => 'Invalid amount']);
            break;
        }

        $orderPayload = json_encode([
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'receipt' => $receiptId,
            'payment_capture' => 1
        ]);

        $ch = curl_init('https://api.razorpay.com/v1/orders');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $orderPayload,
            CURLOPT_USERPWD => "$rzpKeyId:$rzpKeySecret",
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            echo json_encode(['success' => false, 'message' => 'Razorpay connection error: ' . $curlError]);
            break;
        }

        $rzpOrder = json_decode($response, true);
        if ($httpCode !== 200 || empty($rzpOrder['id'])) {
            $errMsg = $rzpOrder['error']['description'] ?? 'Failed to create Razorpay order';
            echo json_encode(['success' => false, 'message' => $errMsg]);
            break;
        }

        echo json_encode([
            'success' => true,
            'orderId' => $rzpOrder['id'],
            'amount' => $rzpOrder['amount'],
            'currency' => $rzpOrder['currency'],
            'keyId' => $rzpKeyId
        ]);
        break;

    case 'verify_razorpay_payment':
        // Verify the Razorpay payment signature
        $rzpKeySecret = '5cWfRy06BsS8xNI8X3NFwMBB';

        $input = json_decode(file_get_contents('php://input'), true);
        $razorpayOrderId = $input['razorpay_order_id'] ?? '';
        $razorpayPaymentId = $input['razorpay_payment_id'] ?? '';
        $razorpaySignature = $input['razorpay_signature'] ?? '';

        if (!$razorpayOrderId || !$razorpayPaymentId || !$razorpaySignature) {
            echo json_encode(['success' => false, 'message' => 'Missing payment verification data']);
            break;
        }

        $expectedSignature = hash_hmac('sha256', $razorpayOrderId . '|' . $razorpayPaymentId, $rzpKeySecret);

        if (hash_equals($expectedSignature, $razorpaySignature)) {
            echo json_encode([
                'success' => true,
                'message' => 'Payment verified successfully',
                'paymentId' => $razorpayPaymentId
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Payment verification failed. Signature mismatch.']);
        }
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
?>
