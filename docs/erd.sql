-- ======================================================
-- 1. USERS (Core authentication & roles)
-- ======================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NULL,
    display_name VARCHAR(255) NOT NULL,
    role ENUM('FARMER', 'BUYER', 'ADMIN', 'DRIVER') NOT NULL DEFAULT 'BUYER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 2. GOOGLE_ACCOUNTS (OAuth2 identity linking)
-- ======================================================
CREATE TABLE IF NOT EXISTS google_accounts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_google_accounts_google_id (google_id),
    INDEX idx_google_accounts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 3. TENANTS (Farm profiles for FARMER role)
-- ======================================================
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    farm_description TEXT,
    registration_number VARCHAR(100),
    address VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_phone VARCHAR(20),
    logo_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tenants_user_id (user_id),
    INDEX idx_tenants_location (latitude, longitude),
    INDEX idx_tenants_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 4. WALLETS (Prepaid credits for farmers)
-- ======================================================
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    auto_topup_enabled BOOLEAN DEFAULT FALSE,
    auto_topup_threshold DECIMAL(10, 2) DEFAULT 20.00,
    auto_topup_amount DECIMAL(10, 2) DEFAULT 100.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_wallets_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 5. WALLET_TRANSACTIONS (Audit log for all wallet movements)
-- ======================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    wallet_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NULL,
    type ENUM('TOPUP', 'LISTING_FEE', 'BUYER_FEE', 'COMMISSION', 'REFUND', 'WITHDRAWAL') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(255) NULL,
    status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_wallet_transactions_wallet_id (wallet_id),
    INDEX idx_wallet_transactions_type (type),
    INDEX idx_wallet_transactions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 6. CATEGORIES (Product taxonomy)
-- ======================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    parent_id VARCHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_parent_id (parent_id),
    INDEX idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 7. PRODUCTS (The core listing/ads)
-- ======================================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(100) NULL COMMENT 'Livestock breed',
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    price_unit ENUM('unit', 'kg', 'ton') DEFAULT 'unit',
    daily_listing_fee DECIMAL(10, 2) DEFAULT 1.00,
    is_listed BOOLEAN DEFAULT FALSE,
    listed_at DATETIME NULL,
    sold_at DATETIME NULL,
    unlisted_at DATETIME NULL,
    media JSON NULL COMMENT 'Array of image URLs',
    status ENUM('AVAILABLE', 'SOLD', 'UNLISTED', 'DELETED') DEFAULT 'AVAILABLE',
    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_products_tenant_id (tenant_id),
    INDEX idx_products_category_id (category_id),
    INDEX idx_products_is_listed (is_listed),
    INDEX idx_products_status (status),
    INDEX idx_products_price (price),
    INDEX idx_products_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 8. LIVESTOCK_DETAILS (1:1 extension for livestock products)
-- ======================================================
CREATE TABLE IF NOT EXISTS livestock_details (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL UNIQUE,
    species ENUM('CATTLE', 'GOAT', 'SHEEP', 'PIG', 'POULTRY', 'OTHER') NOT NULL,
    breed_name VARCHAR(100),
    age_months INT,
    weight_kg DECIMAL(10, 2),
    vaccination_status ENUM('VACCINATED', 'PARTIAL', 'UNVACCINATED') DEFAULT 'UNVACCINATED',
    is_pregnant BOOLEAN DEFAULT FALSE,
    is_breeding_age BOOLEAN DEFAULT FALSE,
    health_certificate_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_livestock_details_species (species),
    INDEX idx_livestock_details_breed_name (breed_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 9. CROP_DETAILS (1:1 extension for crop products)
-- ======================================================
CREATE TABLE IF NOT EXISTS crop_details (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL UNIQUE,
    quantity_kg DECIMAL(10, 2),
    harvest_date DATE,
    growing_method ENUM('ORGANIC', 'CONVENTIONAL', 'HYDROPONIC') DEFAULT 'CONVENTIONAL',
    storage_condition VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_crop_details_harvest_date (harvest_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 10. FAVORITES (Buyer watchlist)
-- ======================================================
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, product_id),
    INDEX idx_favorites_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 11. ORDERS (Core transaction table)
-- ======================================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    buyer_id VARCHAR(36) NOT NULL,
    farmer_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    buyer_service_fee DECIMAL(10, 2) NOT NULL COMMENT '3% paid by buyer',
    farmer_commission DECIMAL(10, 2) NOT NULL COMMENT '3% deducted from farmer payout',
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('CART', 'PENDING_PAYMENT', 'PAID', 'ESCROW_HELD', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED') DEFAULT 'CART',
    delivery_address VARCHAR(500),
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    delivery_instructions TEXT,
    paid_at DATETIME NULL,
    delivered_at DATETIME NULL,
    completed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_orders_buyer_id (buyer_id),
    INDEX idx_orders_farmer_id (farmer_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 12. ESCROW_TRANSACTIONS (Middleman money holding)
-- ======================================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL UNIQUE,
    held_amount DECIMAL(10, 2) NOT NULL,
    buyer_fee_held DECIMAL(10, 2) NOT NULL,
    farmer_commission_held DECIMAL(10, 2) NOT NULL,
    platform_revenue DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'HELD', 'RELEASED_TO_FARMER', 'RELEASED_TO_PLATFORM', 'REFUNDED') DEFAULT 'PENDING',
    released_at DATETIME NULL,
    refunded_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_escrow_transactions_order_id (order_id),
    INDEX idx_escrow_transactions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 13. PAYMENT_TRANSACTIONS (Ozow integration log)
-- ======================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) NULL,
    ozow_transaction_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('WALLET_TOPUP', 'BUYER_PAYMENT', 'FARMER_PAYOUT') NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    ozow_response JSON,
    processed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_payment_transactions_user_id (user_id),
    INDEX idx_payment_transactions_order_id (order_id),
    INDEX idx_payment_transactions_ozow_tx (ozow_transaction_id),
    INDEX idx_payment_transactions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 14. VEHICLES (For delivery logistics)
-- ======================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    registration VARCHAR(50) NOT NULL,
    model VARCHAR(255),
    capacity_kg DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_vehicles_tenant_id (tenant_id),
    INDEX idx_vehicles_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 15. DELIVERIES (Order fulfillment tracking)
-- ======================================================
CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    status ENUM('SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED') DEFAULT 'SCHEDULED',
    scheduled_date DATETIME NOT NULL,
    picked_up_at DATETIME NULL,
    delivered_at DATETIME NULL,
    proof_of_delivery_url VARCHAR(500),
    failure_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    INDEX idx_deliveries_order_id (order_id),
    INDEX idx_deliveries_driver_id (driver_id),
    INDEX idx_deliveries_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 16. REVIEWS (Ratings for trust)
-- ======================================================
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'One review per completed order',
    reviewer_id VARCHAR(36) NOT NULL,
    reviewee_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reviews_reviewer_id (reviewer_id),
    INDEX idx_reviews_reviewee_id (reviewee_id),
    INDEX idx_reviews_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 17. CHAT_ROOMS (Between buyer and farmer for a product)
-- ======================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    buyer_id VARCHAR(36) NOT NULL,
    farmer_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    last_message_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_chat_room (buyer_id, farmer_id, product_id),
    INDEX idx_chat_rooms_buyer_id (buyer_id),
    INDEX idx_chat_rooms_farmer_id (farmer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 18. MESSAGES (Individual chat messages)
-- ======================================================
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    room_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('TEXT', 'IMAGE', 'LOCATION') DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_room_id (room_id),
    INDEX idx_messages_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 19. NOTIFICATIONS (User alerts)
-- ======================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type ENUM('ORDER_PLACED', 'PAYMENT_RECEIVED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'LOW_BALANCE', 'PRODUCT_UNLISTED', 'NEW_MESSAGE') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSON NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 20. DOMAIN_EVENTS (Outbox pattern for async processing)
-- ======================================================
CREATE TABLE IF NOT EXISTS domain_events (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    event_type VARCHAR(255) NOT NULL,
    payload JSON NOT NULL,
    status ENUM('PENDING', 'PUBLISHED', 'FAILED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME NULL,
    INDEX idx_domain_events_status (status),
    INDEX idx_domain_events_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;