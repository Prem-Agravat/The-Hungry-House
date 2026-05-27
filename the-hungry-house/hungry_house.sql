-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 01, 2026 at 03:16 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hungry_house`
--

-- --------------------------------------------------------

--
-- Table structure for table `food_items`
--

CREATE TABLE `food_items` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `offerPrice` decimal(10,2) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `isAvailable` tinyint(1) DEFAULT 1,
  `isOffer` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `food_items`
--

INSERT INTO `food_items` (`id`, `name`, `description`, `price`, `offerPrice`, `category`, `image`, `isAvailable`, `isOffer`) VALUES
(1, 'Paneer Tikka', 'Grilled cottage cheese cubes marinated in spices', 299.00, 249.00, 'starters', 'https://spicecravings.com/wp-content/uploads/2020/10/Paneer-Tikka-Featured-1.jpg', 1, 1),
(2, 'Chole (Chana Masala)', '-Made from chickpeas\n-Spicy gravy\n-Served with Bhature or Rice', 159.00, NULL, 'starters', 'https://media.istockphoto.com/id/979914742/photo/chole-bhature-or-chick-pea-curry-and-fried-puri-served-in-terracotta-crockery-over-white.jpg?s=612x612&w=0&k=20&c=OLAw-ZleN1UVaa468OlPSAc6dkz2sjehxWevbvZQNew=', 1, 0),
(3, 'Shahi Paneer', 'Rich and creamy Punjabi curry made with soft paneer cubes cooked in a mildly sweet, buttery tomato-cashew gravy.', 399.00, 349.00, 'main-course', 'https://tiffinandteaofficial.com/wp-content/uploads/2020/07/Untitled-1.jpg', 1, 1),
(4, 'Paneer Butter Masala', 'Cottage cheese cubes in creamy tomato gravy', 329.00, NULL, 'main-course', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', 1, 0),
(5, 'Dal Makhani', 'Black lentils cooked overnight with butter and cream', 279.00, 239.00, 'main-course', 'https://plus.unsplash.com/premium_photo-1700751850864-f3e2542bf9e0?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 1, 1),
(6, 'Veg Biryani', 'Fragrant basmati rice cooked with mixed vegetables', 299.00, NULL, 'main-course', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', 1, 0),
(7, 'Potato Biryani', 'Aromatic basmati rice with tender Potato pieces', 349.00, 299.00, 'main-course', 'https://media.istockphoto.com/id/1934234952/photo/aloo-biryani-rice-with-potato-and-lemon-slice-served-in-plate-isolated-wooden-background-top.jpg?s=612x612&w=0&k=20&c=k6v-WiaaJUgu9h6JIFA96he0KId7P17skVtpg86sT94=', 1, 1),
(8, 'Butter Naan', 'Soft leavened bread brushed with butter', 59.00, NULL, 'breads', 'https://t3.ftcdn.net/jpg/08/95/50/04/360_F_895500474_IDUMxbOGEBn29tyPyjG8oLEEWlK8ZlOg.jpg', 1, 0),
(9, 'Garlic Naan', 'Naan stuffed with garlic and coriander', 79.00, 69.00, 'breads', 'https://t4.ftcdn.net/jpg/17/15/16/93/360_F_1715169355_cAjyCT1V26tJbHqmlqqXT8rKNgRvFiHk.jpg', 1, 1),
(10, 'Roti', 'Whole wheat Indian flatbread', 25.00, NULL, 'breads', 'https://benfurney.com/wp-content/uploads/2023/02/email-header-sjff.jpg', 1, 0),
(11, 'Gulab Jamun', 'Gulab Jamun is a soft, deep-fried milk-based sweet soaked in fragrant sugar syrup, served warm and delicious.', 129.00, 99.00, 'desserts', 'https://media.istockphoto.com/id/163064596/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=JvJ4AAs-N5pRzzRmVg1lG0talC3QoUt0ZGiO1NKz-kQ=', 1, 1),
(12, 'Rasmalai', 'Soft cheese patties in sweetened milk', 149.00, NULL, 'desserts', 'https://images.archanaskitchen.com/images/recipes/indian/sweet-recipes/traditional_rasmalai_recipe_d5b18e48ac.jpg', 1, 0),
(13, 'Margherita Pizza', 'Classic pizza with fresh tomato sauce, mozzarella cheese, and basil leaves. Simple and tasty.', 199.00, 159.00, 'starters', 'https://thumbs.dreamstime.com/b/pizza-margherita-27409337.jpg', 1, 1),
(14, 'DalFry & JeeraRice', 'best main coursse', 299.00, NULL, 'main-course', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4yMQSAY_-XqP6zDT5r_ACAnGM_XVnr8kYNA&s', 1, 0),
(15, 'Tandoori Roti', 'Whole wheat Indian bread baked in a clay tandoor, soft inside with a slightly crispy and smoky flavor.', 59.00, 35.00, 'breads', 'https://www.cookwithmanali.com/wp-content/uploads/2021/07/Tandoori-Roti-500x375.jpg', 1, 1),
(16, 'Garlic Bread', 'Garlic Bread is crispy baked bread topped with butter, fresh garlic, and herbs, often served with cheese and dips.', 159.00, 99.00, 'starters', 'https://www.mygingergarlickitchen.com/wp-content/rich-markup-images/1x1/1x1-garlic-bread.jpg', 1, 1),
(17, 'Buttermilk (Chaas)', 'Buttermilk (Chaas) is a refreshing yogurt-based drink blended with water, salt, and mild spices, perfect for cooling the body after meals.', 55.00, 35.00, 'main-course', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0_e9OQq70BLlFWN0KYCIkBofkoNdbQUKk_gFGj2qchmMNJEAV4VkzYslwK1LFi3a4fBSYisq5ZIBSBm5r5fowa0288gqzNSapNXoQVg&s=10', 1, 1),
(18, 'Plain Naan', 'Plain naan is a classic, leavened flatbread from the Indian subcontinent known for its soft, pillowy texture with a slightly chewy bite and signature charred spots.', 25.00, NULL, 'breads', 'https://cdn.uengage.io/uploads/28289/image-5NEIDK-1723273073.jpg', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `offers`
--

CREATE TABLE `offers` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `discount` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `validUntil` date DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `offers`
--

INSERT INTO `offers` (`id`, `title`, `code`, `discount`, `description`, `validUntil`, `isActive`) VALUES
(1, 'Weekend Special', 'WEEKEND20', 20, 'Get 20% off on all orders above ₹500', '2024-12-31', 1),
(2, 'First Order', 'FIRSTORDER', 15, '15% off on your first order', '2026-12-31', 1),
(3, 'Family Deal', 'FAMILY30', 30, '30% off on orders above ₹1000', '2026-11-30', 1),
(4, 'Holi', 'HOLIIII0099', 20, 'best offer', '2026-05-14', 1);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `type` enum('delivery','dine-in') NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL,
  `delivery` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `status` enum('pending','preparing','ready','delivered','cancelled') DEFAULT 'pending',
  `date` datetime DEFAULT NULL,
  `customerName` varchar(100) DEFAULT NULL,
  `customerPhone` varchar(15) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tableNumber` int(11) DEFAULT NULL,
  `numberOfGuests` int(11) DEFAULT NULL,
  `paymentMethod` varchar(20) DEFAULT NULL,
  `rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `ratingComment` text DEFAULT NULL,
  `ratedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `userId`, `type`, `subtotal`, `tax`, `delivery`, `total`, `status`, `date`, `customerName`, `customerPhone`, `address`, `tableNumber`, `numberOfGuests`, `paymentMethod`) VALUES
(1, 2, 'delivery', 597.00, 107.46, 49.00, 753.46, 'delivered', '2024-10-15', 'Rajesh Kumar', '9876543211', '123 Andheri West, Mumbai - 400001', NULL, NULL, 'card'),
(2, 3, 'dine-in', 487.00, 87.66, 0.00, 574.66, 'preparing', '2024-10-16', 'Priya Sharma', '9876543212', NULL, 3, 2, 'cash'),
(3, 2, 'delivery', 249.00, 44.82, 49.00, 342.82, 'cancelled', '2026-02-22', 'Rajesh Kumar', '9876543211', 'asdaassd, zdadas - 123123', NULL, NULL, 'card'),
(4, 1, 'delivery', 349.00, 62.82, 49.00, 460.82, 'cancelled', '2026-02-22', 'Admin User', '9876543210', 'fwerwer, serwere - 123123', NULL, NULL, 'cash'),
(5, 1, 'delivery', 249.00, 44.82, 49.00, 342.82, 'cancelled', '2026-02-22', 'Admin User', '9876543210', 'jhgjgjgjgh, chgfhf - 123123', NULL, NULL, 'cash'),
(6, 1, 'delivery', 747.00, 107.57, 49.00, 754.17, 'cancelled', '2026-02-22', 'Admin User', '9876543210', 'fdgdgd, fdgfd - 123123', NULL, NULL, 'cash'),
(7, 1, 'dine-in', 847.00, 152.46, 0.00, 999.46, 'preparing', '2026-02-22', 'Admin User', '9876543210', NULL, 1, 2, 'cash'),
(8, 1, 'delivery', 349.00, 62.82, 49.00, 460.82, 'cancelled', '2026-02-22', 'Admin User', '9876543210', 'gfhgfhf, hgf - hfhgfhgf', NULL, NULL, 'cash'),
(9, 2, 'delivery', 698.00, 125.64, 49.00, 872.64, 'cancelled', '2026-02-22', 'Rajesh Kumar', '9876543211', 'weqew, wewer - erwer', NULL, NULL, 'cash'),
(10, 2, 'delivery', 1594.00, 229.54, 49.00, 1553.74, 'cancelled', '2026-02-22', 'Rajesh Kumar', '9876543211', 'sadasd, zdadas - 123123', NULL, NULL, 'cash'),
(11, 2, 'delivery', 349.00, 62.82, 49.00, 460.82, 'cancelled', '2026-02-22', 'Rajesh Kumar', '9876543211', 'qweqwe, zdadas - 123123', NULL, NULL, 'cash'),
(12, 2, 'delivery', 249.00, 44.82, 49.00, 342.82, 'cancelled', '2026-02-22', 'Rajesh Kumar', '9876543211', 'hjgjgjgg, serwere - 123123', NULL, NULL, 'cash'),
(13, 2, 'delivery', 349.00, 62.82, 49.00, 460.82, 'delivered', '2026-02-22', 'Rajesh Kumar', '9876543211', 'fcgfdgfd, zdadas - gfdgd', NULL, NULL, 'cash'),
(14, 2, 'dine-in', 249.00, 44.82, 0.00, 293.82, 'preparing', '2026-02-22', 'Rajesh Kumar', '9876543211', NULL, 1, 2, 'cash'),
(15, 2, 'delivery', 548.00, 98.64, 49.00, 695.64, 'cancelled', '2026-02-22', 'Rajesh Kumar', '9876543211', 'Tokiz road, asopalav society ,Bagasara, AMRELI - 365440', NULL, NULL, 'cash'),
(16, 2, 'delivery', 349.00, 62.82, 49.00, 460.82, 'cancelled', '2026-02-22', 'Rajesh Kumar', '9876543211', 'Govind Para1, Rajkot - 360002', NULL, NULL, 'cash'),
(17, 2, 'dine-in', 568.00, 102.24, 0.00, 670.24, 'delivered', '2026-02-22', 'Rajesh Kumar', '9876543211', NULL, 1, 2, 'cash'),
(18, 4, 'dine-in', 388.00, 69.84, 0.00, 457.84, 'delivered', '2026-02-22', 'dev bhaiiiiiiiiiiiiii', '6356043009', NULL, 5, 6, 'cash'),
(19, 4, 'dine-in', 159.00, 24.33, 0.00, 159.48, 'delivered', '2026-02-27', 'dev bhaiiiiiiiiiiiiii', '6356043009', NULL, 4, 2, 'cash'),
(20, 1, 'dine-in', 159.00, 28.62, 0.00, 187.62, 'delivered', '2026-02-27', 'Admin User', '9876543210', NULL, 1, 2, 'cash'),
(21, 1, 'dine-in', 538.00, 96.84, 0.00, 634.84, 'delivered', '2026-02-27', 'Admin User', '9876543210', NULL, 2, 2, 'cash'),
(22, 9, 'delivery', 159.00, 28.62, 29.00, 216.62, 'pending', '2026-03-13', 'Chauhan Siddharth', '9825280488', 'Govind Para1, Rajkot - 360002', NULL, NULL, 'cash'),
(23, 1, 'dine-in', 249.00, 44.82, 0.00, 293.82, 'delivered', '2026-04-01', 'Admin User', '9876543210', NULL, 4, 2, 'cash');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `orderId` int(11) DEFAULT NULL,
  `foodId` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `orderId`, `foodId`, `name`, `quantity`, `price`) VALUES
(1, 1, 1, 'Paneer Tikka', 2, 249.00),
(2, 1, 11, 'Gulab Jamun', 1, 99.00),
(3, 2, 3, 'Butter Chicken', 1, 349.00),
(4, 2, 9, 'Garlic Naan', 2, 69.00),
(5, 3, 1, 'Paneer Tikka', 1, 249.00),
(6, 4, 2, 'Chicken Tikka', 1, 349.00),
(7, 5, 1, 'Paneer Tikka', 1, 249.00),
(8, 6, 1, 'Paneer Tikka', 3, 249.00),
(9, 7, 1, 'Paneer Tikka', 2, 249.00),
(10, 7, 2, 'Chicken Tikka', 1, 349.00),
(11, 8, 2, 'Chicken Tikka', 1, 349.00),
(12, 9, 2, 'Chicken Tikka', 2, 349.00),
(13, 10, 2, 'Chicken Tikka', 1, 349.00),
(14, 10, 1, 'Paneer Tikka', 5, 249.00),
(15, 11, 2, 'Chicken Tikka', 1, 349.00),
(16, 12, 1, 'Paneer Tikka', 1, 249.00),
(17, 13, 3, 'Butter Chicken', 1, 349.00),
(18, 14, 1, 'Paneer Tikka', 1, 249.00),
(19, 15, 1, 'Paneer Tikka', 1, 249.00),
(20, 15, 6, 'Veg Biryani', 1, 299.00),
(21, 16, 2, 'Chicken Tikka', 1, 349.00),
(22, 17, 5, 'Dal Makhani', 1, 239.00),
(23, 17, 4, 'Paneer Butter Masala', 1, 329.00),
(24, 18, 8, 'Butter Naan', 1, 59.00),
(25, 18, 4, 'Paneer Butter Masala', 1, 329.00),
(26, 19, 2, 'Chole (Chana Masala)', 1, 159.00),
(27, 20, 2, 'Chole (Chana Masala)', 1, 159.00),
(28, 21, 5, 'Dal Makhani', 1, 239.00),
(29, 21, 6, 'Veg Biryani', 1, 299.00),
(30, 22, 2, 'Chole (Chana Masala)', 1, 159.00),
(31, 23, 1, 'Paneer Tikka', 1, 249.00);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_otps`
--

CREATE TABLE `password_reset_otps` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `email` varchar(150) NOT NULL,
  `otpCode` varchar(6) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `isUsed` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_reset_otps`
--

INSERT INTO `password_reset_otps` (`id`, `userId`, `email`, `otpCode`, `expiresAt`, `isUsed`, `createdAt`) VALUES
(1, 10, 'dchauhan642@rku.ac.in', '081894', '2026-04-01 14:45:54', 1, '2026-04-01 12:43:54'),
(2, 10, 'dchauhan642@rku.ac.in', '741644', '2026-04-01 14:45:55', 1, '2026-04-01 12:43:55'),
(3, 10, 'dchauhan642@rku.ac.in', '108936', '2026-04-01 14:45:57', 1, '2026-04-01 12:43:57');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_tables`
--

CREATE TABLE `restaurant_tables` (
  `id` int(11) NOT NULL,
  `number` int(11) NOT NULL,
  `seats` int(11) NOT NULL,
  `status` enum('available','occupied','reserved') DEFAULT 'available',
  `currentOrder` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_tables`
--

INSERT INTO `restaurant_tables` (`id`, `number`, `seats`, `status`, `currentOrder`, `date`, `time`) VALUES
(1, 1, 2, 'available', NULL, NULL, NULL),
(2, 2, 2, 'available', NULL, NULL, NULL),
(3, 3, 4, 'available', NULL, NULL, NULL),
(4, 4, 4, 'available', NULL, NULL, NULL),
(5, 5, 6, 'available', NULL, NULL, NULL),
(6, 6, 6, 'available', NULL, NULL, NULL),
(7, 7, 4, 'available', NULL, NULL, NULL),
(8, 8, 4, 'available', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_table_bookings`
--

CREATE TABLE `restaurant_table_bookings` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `tableId` int(11) NOT NULL,
  `bookingDate` date NOT NULL,
  `bookingTime` time NOT NULL,
  `durationMinutes` int(11) NOT NULL DEFAULT 60,
  `startAt` datetime NOT NULL,
  `endAt` datetime NOT NULL,
  `status` enum('confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_table_bookings`
--

INSERT INTO `restaurant_table_bookings` (`id`, `userId`, `tableId`, `bookingDate`, `bookingTime`, `durationMinutes`, `startAt`, `endAt`, `status`, `notes`, `createdAt`) VALUES
(1, 2, 5, '2026-04-01', '19:00:00', 120, '2026-04-01 19:00:00', '2026-04-01 21:00:00', 'confirmed', NULL, '2026-04-01 11:47:54'),
(2, 1, 2, '2026-04-01', '17:24:00', 60, '2026-04-01 17:24:00', '2026-04-01 18:24:00', 'confirmed', NULL, '2026-04-01 11:52:21'),
(3, 1, 7, '2026-04-01', '17:32:00', 60, '2026-04-01 17:32:00', '2026-04-01 18:32:00', 'confirmed', NULL, '2026-04-01 12:02:02');

-- --------------------------------------------------------

--
-- Table structure for table `used_offers`
--

CREATE TABLE `used_offers` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `offerId` int(11) NOT NULL,
  `usedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `used_offers`
--

INSERT INTO `used_offers` (`id`, `userId`, `offerId`, `usedAt`) VALUES
(1, 1, 1, '2026-02-22 11:27:44'),
(2, 2, 1, '2026-02-22 11:53:03'),
(3, 4, 2, '2026-02-27 05:46:28');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`) VALUES
(1, 'Admin User', 'admin@hungryHouse.com', 'admin123', '9876543210', 'admin'),
(2, 'Rajesh Kumar', 'rajesh@example.com', 'rajesh123', '9876543211', 'user'),
(3, 'Priya Sharma', 'priya@example.com', 'priya123', '9876543212', 'user'),
(4, 'dev bhaiiiiiiiiiiiiii', 'dc1452007@gmail.com', '123123', '6356043009', 'user'),
(5, 'Chauhan Siddharth', 's@gmail.com', '123123', '9825280488', 'user'),
(6, 'prem', 'prem@gmail.com', '123123', '9825280488', 'user'),
(7, 'Ramanshu Dhanani', 'ramanshu@gmail.com', '123123', '8758568026', 'user'),
(8, 'Zala Krishnarajshih', 'zala@gmail.com', '456456', '7569532415', 'user'),
(9, 'Chauhan Siddharth', 'sidhu@gmail.com', '123123', '9825280488', 'user'),
(10, 'dev bhai', 'dchauhan642@rku.ac.in', 'devbhai12345', '6356043009', 'user'),
(12, 'person', 'onadoda145@rku.ac.in', '1234567', '1234567890', 'user');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `food_items`
--
ALTER TABLE `food_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `offers`
--
ALTER TABLE `offers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orderId` (`orderId`),
  ADD KEY `foodId` (`foodId`);

--
-- Indexes for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_used` (`email`,`isUsed`),
  ADD KEY `idx_user_used` (`userId`,`isUsed`);

--
-- Indexes for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `number` (`number`);

--
-- Indexes for table `restaurant_table_bookings`
--
ALTER TABLE `restaurant_table_bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_table_time` (`tableId`,`startAt`,`endAt`,`status`),
  ADD KEY `idx_user_date` (`userId`,`bookingDate`);

--
-- Indexes for table `used_offers`
--
ALTER TABLE `used_offers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`,`offerId`),
  ADD KEY `offerId` (`offerId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `food_items`
--
ALTER TABLE `food_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `offers`
--
ALTER TABLE `offers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `restaurant_table_bookings`
--
ALTER TABLE `restaurant_table_bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `used_offers`
--
ALTER TABLE `used_offers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`foodId`) REFERENCES `food_items` (`id`);

--
-- Constraints for table `used_offers`
--
ALTER TABLE `used_offers`
  ADD CONSTRAINT `used_offers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `used_offers_ibfk_2` FOREIGN KEY (`offerId`) REFERENCES `offers` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
