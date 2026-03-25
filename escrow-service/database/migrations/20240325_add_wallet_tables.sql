-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `transaction_id` char(36) NOT NULL,
  `wallet_id` char(36) NOT NULL,
  `type` enum('credit','debit','conversion') NOT NULL,
  `amount` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `reference_id` char(36) DEFAULT NULL,
  `reference_type` enum('payment_event','conversion','manual_adjustment') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `wallet_id` (`wallet_id`),
  KEY `reference_id` (`reference_id`),
  CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `freelancer_wallets` (`wallet_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Wallet Conversions Table
CREATE TABLE IF NOT EXISTS `wallet_conversions` (
  `conversion_id` char(36) NOT NULL,
  `freelancer_id` char(36) NOT NULL,
  `internal_amount` int NOT NULL,
  `real_amount` int NOT NULL,
  `status` enum('pending','processed','cancelled') DEFAULT 'pending',
  `conversion_rate` decimal(10,4) DEFAULT '1.0000',
  `fees` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`conversion_id`),
  KEY `freelancer_id` (`freelancer_id`),
  KEY `status` (`status`),
  CONSTRAINT `wallet_conversions_ibfk_1` FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Update Freelancer Wallets Table
ALTER TABLE `freelancer_wallets` 
ADD COLUMN `available_balance` int DEFAULT '0' AFTER `balance`,
ADD COLUMN `pending_balance` int DEFAULT '0' AFTER `available_balance`,
ADD COLUMN `wallet_type` enum('internal','real') DEFAULT 'internal' AFTER `pending_balance`;
