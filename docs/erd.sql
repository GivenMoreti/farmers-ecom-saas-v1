-- ======================================================
-- DATABASE
-- ======================================================

CREATE DATABASE IF NOT EXISTS farm_marketplace_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE farm_marketplace_db;

-- ======================================================
-- 1. USERS
-- ======================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    role ENUM('FARMER', 'BUYER', 'ADMIN', 'DRIVER')
        NOT NULL DEFAULT 'BUYER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 2. GOOGLE ACCOUNTS
-- ======================================================

CREATE TABLE IF NOT EXISTS google_accounts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    google_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    picture_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_google_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_google_accounts_google_id (google_id),
    INDEX idx_google_accounts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 3. TENANTS
-- ======================================================

CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    farm_description TEXT,
    registration_number VARCHAR(100),
    address VARCHAR(500),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    contact_phone VARCHAR(20),
    logo_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tenant_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_tenants_user_id (user_id),
    INDEX idx_tenants_location (latitude, longitude),
    INDEX idx_tenants_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 4. WALLETS
-- ======================================================

CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    auto_topup_enabled BOOLEAN DEFAULT FALSE,
    auto_topup_threshold DECIMAL(10,2) DEFAULT 20.00,
    auto_topup_amount DECIMAL(10,2) DEFAULT 100.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_wallet_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_wallets_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 5. CATEGORIES
-- ======================================================

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    parent_id VARCHAR(36),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_category_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,

    INDEX idx_categories_parent_id (parent_id),
    INDEX idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 6. PRODUCTS
-- ======================================================

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,

    name VARCHAR(255) NOT NULL,
    breed VARCHAR(100),

    description TEXT,

    price DECIMAL(10,2) NOT NULL,
    price_unit ENUM('unit','kg','ton')
        DEFAULT 'unit',

    daily_listing_fee DECIMAL(10,2)
        DEFAULT 1.00,

    is_listed BOOLEAN DEFAULT FALSE,

    listed_at DATETIME NULL,
    sold_at DATETIME NULL,
    unlisted_at DATETIME NULL,

    media JSON,

    status ENUM(
        'AVAILABLE',
        'SOLD',
        'UNLISTED',
        'DELETED'
    ) DEFAULT 'AVAILABLE',

    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    INDEX idx_products_tenant_id (tenant_id),
    INDEX idx_products_category_id (category_id),
    INDEX idx_products_is_listed (is_listed),
    INDEX idx_products_status (status),
    INDEX idx_products_price (price),
    INDEX idx_products_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================
-- 7. WALLET TRANSACTIONS
-- ======================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36),

    type ENUM(
        'TOPUP',
        'LISTING_FEE',
        'BUYER_FEE',
        'COMMISSION',
        'REFUND',
        'WITHDRAWAL'
    ) NOT NULL,

    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,

    description VARCHAR(255),
    reference_id VARCHAR(255),

    status ENUM(
        'PENDING',
        'COMPLETED',
        'FAILED'
    ) DEFAULT 'PENDING',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wallet_tx_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_wallet_tx_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL,

    INDEX idx_wallet_transactions_wallet_id (wallet_id),
    INDEX idx_wallet_transactions_type (type),
    INDEX idx_wallet_transactions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
