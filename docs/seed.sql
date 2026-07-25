-- ======================================================
-- SEED DATA FOR FARM MARKETPLACE DATABASE (CLEAN VERSION)
-- ======================================================

USE farm_marketplace_db;

-- ======================================================
-- CLEAN UP EXISTING DATA (Optional - be careful!)
-- ======================================================
-- If you want to start fresh, uncomment these lines:
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE wallet_transactions;
-- TRUNCATE TABLE orders;
-- TRUNCATE TABLE products;
-- TRUNCATE TABLE wallets;
-- TRUNCATE TABLE tenants;
-- TRUNCATE TABLE google_accounts;
-- TRUNCATE TABLE users;
-- TRUNCATE TABLE categories;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ======================================================
-- 1. CATEGORIES (Product taxonomy) - FIXED
-- ======================================================

-- First, check if categories exist
SET @category_count = (SELECT COUNT(*) FROM categories);

INSERT IGNORE INTO categories (id, name, icon, parent_id, created_at) VALUES
    -- Top-level categories
    (UUID(), 'Cattle', '🐄', NULL, NOW()),
    (UUID(), 'Goats', '🐐', NULL, NOW()),
    (UUID(), 'Sheep', '🐑', NULL, NOW()),
    (UUID(), 'Poultry', '🐔', NULL, NOW()),
    (UUID(), 'Pigs', '🐷', NULL, NOW()),
    (UUID(), 'Crops', '🌾', NULL, NOW()),
    (UUID(), 'Vegetables', '🥬', NULL, NOW()),
    (UUID(), 'Fruits', '🍎', NULL, NOW());

-- Get category IDs for subcategories
SET @crops_id = (SELECT id FROM categories WHERE name = 'Crops' LIMIT 1);
SET @veggies_id = (SELECT id FROM categories WHERE name = 'Vegetables' LIMIT 1);
SET @fruits_id = (SELECT id FROM categories WHERE name = 'Fruits' LIMIT 1);

-- Insert subcategories with IGNORE to avoid duplicates
INSERT IGNORE INTO categories (id, name, icon, parent_id, created_at) VALUES
    -- Crops subcategories
    (UUID(), 'Maize', '🌽', @crops_id, NOW()),
    (UUID(), 'Wheat', '🌾', @crops_id, NOW()),
    (UUID(), 'Sunflower', '🌻', @crops_id, NOW()),
    -- Vegetables subcategories
    (UUID(), 'Tomatoes', '🍅', @veggies_id, NOW()),
    (UUID(), 'Potatoes', '🥔', @veggies_id, NOW()),
    (UUID(), 'Onions', '🧅', @veggies_id, NOW()),
    (UUID(), 'Spinach', '🥬', @veggies_id, NOW()),
    -- Fruits subcategories
    (UUID(), 'Apples', '🍎', @fruits_id, NOW()),
    (UUID(), 'Citrus', '🍊', @fruits_id, NOW()),
    (UUID(), 'Grapes', '🍇', @fruits_id, NOW()),
    (UUID(), 'Strawberries', '🍓', @fruits_id, NOW());

-- ======================================================
-- 2. USERS (Farmers, Buyers, Admins, Drivers) - IDEMPOTENT
-- ======================================================

-- Insert users with IGNORE to avoid duplicates
INSERT IGNORE INTO users (id, email, phone, display_name, role, is_active, created_at) VALUES
    -- Farmers
    (UUID(), 'thabo.molefe@farm.co.za', '0821234561', 'Thabo Molefe', 'FARMER', TRUE, NOW()),
    (UUID(), 'lindiwe.ndlovu@farm.co.za', '0821234562', 'Lindiwe Ndlovu', 'FARMER', TRUE, NOW()),
    (UUID(), 'pieter.vandermerwe@farm.co.za', '0821234563', 'Pieter van der Merwe', 'FARMER', TRUE, NOW()),
    (UUID(), 'grace.mokoena@farm.co.za', '0821234564', 'Grace Mokoena', 'FARMER', TRUE, NOW()),
    (UUID(), 'john.dlamini@farm.co.za', '0821234565', 'John Dlamini', 'FARMER', TRUE, NOW()),
    (UUID(), 'elizabeth.masango@farm.co.za', '0821234566', 'Elizabeth Masango', 'FARMER', TRUE, NOW()),
    (UUID(), 'hendrik.joubert@farm.co.za', '0821234567', 'Hendrik Joubert', 'FARMER', TRUE, NOW()),
    (UUID(), 'mariam.mahomed@farm.co.za', '0821234568', 'Mariam Mahomed', 'FARMER', TRUE, NOW()),
    (UUID(), 'david.mabuza@farm.co.za', '0821234569', 'David Mabuza', 'FARMER', TRUE, NOW()),
    (UUID(), 'sarah.coetzee@farm.co.za', '0821234570', 'Sarah Coetzee', 'FARMER', TRUE, NOW()),
    -- Buyers
    (UUID(), 'buyer.cape@restaurant.co.za', '0821234601', 'Cape Gourmet', 'BUYER', TRUE, NOW()),
    (UUID(), 'buyer.joburg@retail.co.za', '0821234602', 'Johannesburg Fresh', 'BUYER', TRUE, NOW()),
    (UUID(), 'buyer.durban@hotel.co.za', '0821234603', 'Durban Palace Hotel', 'BUYER', TRUE, NOW()),
    (UUID(), 'buyer.pretoria@catering.co.za', '0821234604', 'Pretoria Catering Co', 'BUYER', TRUE, NOW()),
    (UUID(), 'buyer.portelizabeth@restaurant.co.za', '0821234605', 'Port Elizabeth Bistro', 'BUYER', TRUE, NOW()),
    (UUID(), 'buyer.bloemfontein@market.co.za', '0821234606', 'Bloemfontein Market', 'BUYER', TRUE, NOW()),
    (UUID(), 'buyer.pmb@restaurant.co.za', '0821234607', 'Pietermaritzburg Grill', 'BUYER', TRUE, NOW()),
    (UUID(), 'buyer.eastlondon@hotel.co.za', '0821234608', 'East London Inn', 'BUYER', TRUE, NOW()),
    -- Admin
    (UUID(), 'admin@farmhub.co.za', NULL, 'FarmHub Admin', 'ADMIN', TRUE, NOW()),
    -- Drivers
    (UUID(), 'driver.khumalo@delivery.co.za', '0821234701', 'Sipho Khumalo', 'DRIVER', TRUE, NOW()),
    (UUID(), 'driver.ngcobo@delivery.co.za', '0821234702', 'Thandi Ngcobo', 'DRIVER', TRUE, NOW()),
    (UUID(), 'driver.peterson@delivery.co.za', '0821234703', 'Jacob Peterson', 'DRIVER', TRUE, NOW());

-- ======================================================
-- 3. GET USER IDs FOR REFERENCE
-- ======================================================

SET @thabo = (SELECT id FROM users WHERE email = 'thabo.molefe@farm.co.za' LIMIT 1);
SET @lindiwe = (SELECT id FROM users WHERE email = 'lindiwe.ndlovu@farm.co.za' LIMIT 1);
SET @pieter = (SELECT id FROM users WHERE email = 'pieter.vandermerwe@farm.co.za' LIMIT 1);
SET @grace = (SELECT id FROM users WHERE email = 'grace.mokoena@farm.co.za' LIMIT 1);
SET @john = (SELECT id FROM users WHERE email = 'john.dlamini@farm.co.za' LIMIT 1);
SET @elizabeth = (SELECT id FROM users WHERE email = 'elizabeth.masango@farm.co.za' LIMIT 1);
SET @hendrik = (SELECT id FROM users WHERE email = 'hendrik.joubert@farm.co.za' LIMIT 1);
SET @mariam = (SELECT id FROM users WHERE email = 'mariam.mahomed@farm.co.za' LIMIT 1);
SET @david = (SELECT id FROM users WHERE email = 'david.mabuza@farm.co.za' LIMIT 1);
SET @sarah = (SELECT id FROM users WHERE email = 'sarah.coetzee@farm.co.za' LIMIT 1);

-- ======================================================
-- 4. TENANTS (Farm Profiles) - IDEMPOTENT
-- ======================================================

INSERT IGNORE INTO tenants (id, user_id, farm_name, farm_description, registration_number, address, latitude, longitude, contact_phone, is_verified, created_at) VALUES
    (UUID(), @thabo, 'Molefe Eggs & Poultry', 'Premium free-range eggs and broiler chickens. Family farm in Mpumalanga since 2005.', 'REG-001-2024', '123 Main St, Nelspruit, Mpumalanga', -25.4658, 30.9852, '0821234561', TRUE, NOW()),
    (UUID(), @lindiwe, 'Ndlovu Cattle Ranch', 'Specializing in Nguni cattle. Grass-fed, hormone-free beef.', 'REG-002-2024', '456 Farm Road, KwaZulu-Natal', -29.8587, 31.0218, '0821234562', TRUE, NOW()),
    (UUID(), @pieter, 'Van der Merwe Produce', 'Organic vegetables and fruits. Certified organic since 2010.', 'REG-003-2024', '789 Harvest Lane, Western Cape', -33.9249, 18.4241, '0821234563', TRUE, NOW()),
    (UUID(), @grace, 'Mokoena Goat Farm', 'Boer goats for meat and breeding. Quality stock with vaccination records.', 'REG-004-2024', '321 Karoo Road, Free State', -29.6006, 26.7736, '0821234564', TRUE, NOW()),
    (UUID(), @john, 'Dlamini Free Range', 'Pasture-raised chickens and free-range eggs. Happy hens, healthy eggs!', 'REG-005-2024', '555 Valley Drive, Eastern Cape', -33.7222, 25.4185, '0821234565', TRUE, NOW()),
    (UUID(), @elizabeth, 'Masango Sheep Farm', 'Merino sheep for wool and mutton. Sustainable farming practices.', 'REG-006-2024', '777 Plateau Road, Northern Cape', -28.7536, 24.7586, '0821234566', TRUE, NOW()),
    (UUID(), @hendrik, 'Joubert Citrus Estate', 'Oranges, lemons, and grapefruit. Export quality citrus.', 'REG-007-2024', '999 Sunshine Avenue, Limpopo', -23.4013, 29.4178, '0821234567', TRUE, NOW()),
    (UUID(), @mariam, 'Mahomed Organic Veg', 'Certified organic vegetables for restaurants and retailers.', 'REG-008-2024', '222 Green Valley, KwaZulu-Natal', -29.6000, 30.4000, '0821234568', TRUE, NOW()),
    (UUID(), @david, 'Mabuza Maize Farm', 'Large scale maize production for animal feed and human consumption.', 'REG-009-2024', '444 Golden Fields, North West', -25.7310, 27.1000, '0821234569', TRUE, NOW()),
    (UUID(), @sarah, 'Coetzee Strawberry Farm', 'Sweet strawberries for fresh market and processing.', 'REG-010-2024', '666 Berry Lane, Western Cape', -34.0000, 19.0000, '0821234570', TRUE, NOW());

-- ======================================================
-- 5. GET TENANT IDs FOR REFERENCE
-- ======================================================

SET @thabo_tenant = (SELECT id FROM tenants WHERE user_id = @thabo LIMIT 1);
SET @lindiwe_tenant = (SELECT id FROM tenants WHERE user_id = @lindiwe LIMIT 1);
SET @pieter_tenant = (SELECT id FROM tenants WHERE user_id = @pieter LIMIT 1);
SET @grace_tenant = (SELECT id FROM tenants WHERE user_id = @grace LIMIT 1);
SET @john_tenant = (SELECT id FROM tenants WHERE user_id = @john LIMIT 1);
SET @elizabeth_tenant = (SELECT id FROM tenants WHERE user_id = @elizabeth LIMIT 1);
SET @hendrik_tenant = (SELECT id FROM tenants WHERE user_id = @hendrik LIMIT 1);
SET @mariam_tenant = (SELECT id FROM tenants WHERE user_id = @mariam LIMIT 1);
SET @david_tenant = (SELECT id FROM tenants WHERE user_id = @david LIMIT 1);
SET @sarah_tenant = (SELECT id FROM tenants WHERE user_id = @sarah LIMIT 1);

-- ======================================================
-- 6. CATEGORY IDs FOR REFERENCE
-- ======================================================

SET @poultry = (SELECT id FROM categories WHERE name = 'Poultry' LIMIT 1);
SET @cattle = (SELECT id FROM categories WHERE name = 'Cattle' LIMIT 1);
SET @goats = (SELECT id FROM categories WHERE name = 'Goats' LIMIT 1);
SET @sheep = (SELECT id FROM categories WHERE name = 'Sheep' LIMIT 1);
SET @veggies = (SELECT id FROM categories WHERE name = 'Vegetables' LIMIT 1);
SET @fruits = (SELECT id FROM categories WHERE name = 'Fruits' LIMIT 1);
SET @crops = (SELECT id FROM categories WHERE name = 'Crops' LIMIT 1);

-- ======================================================
-- 7. WALLETS (Prepaid credits for farmers) - IDEMPOTENT
-- ======================================================

INSERT IGNORE INTO wallets (id, user_id, balance, total_spent, auto_topup_enabled, auto_topup_threshold, auto_topup_amount, created_at) VALUES
    (UUID(), @thabo, 150.00, 45.50, TRUE, 20.00, 100.00, NOW()),
    (UUID(), @lindiwe, 200.00, 60.00, TRUE, 30.00, 150.00, NOW()),
    (UUID(), @pieter, 80.00, 120.00, FALSE, 10.00, 50.00, NOW()),
    (UUID(), @grace, 45.00, 15.00, TRUE, 10.00, 50.00, NOW()),
    (UUID(), @john, 100.00, 30.00, FALSE, 25.00, 100.00, NOW()),
    (UUID(), @elizabeth, 60.00, 40.00, TRUE, 15.00, 75.00, NOW()),
    (UUID(), @hendrik, 250.00, 80.00, TRUE, 50.00, 200.00, NOW()),
    (UUID(), @mariam, 90.00, 25.00, FALSE, 20.00, 80.00, NOW()),
    (UUID(), @david, 300.00, 150.00, TRUE, 50.00, 250.00, NOW()),
    (UUID(), @sarah, 120.00, 35.00, FALSE, 30.00, 120.00, NOW());

-- ======================================================
-- 8. PRODUCTS (Eggs, Livestock, Crops, etc.) - NOW WITH VALID IDs
-- ======================================================

-- EGGS (Molefe Eggs & Poultry)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @thabo_tenant, @poultry, 'Free-Range Large Brown Eggs', 'Lohmann Brown', 'Premium free-range eggs. Hens are pasture-raised and fed a natural diet. Packed in 30-egg crates. Available daily.', 45.00, 'unit', 1.00, TRUE, NOW(), '["https://example.com/eggs/1.jpg", "https://example.com/eggs/2.jpg"]', 'AVAILABLE', 120, 15, NOW()),
    (UUID(), @thabo_tenant, @poultry, 'Organic Pasture-Raised Eggs', 'Hy-Line', 'Certified organic eggs from hens raised on pastures. Deep orange yolks and rich flavor. Available in 30-egg crates.', 55.00, 'unit', 1.50, TRUE, NOW(), '["https://example.com/eggs/organic1.jpg"]', 'AVAILABLE', 85, 12, NOW()),
    (UUID(), @thabo_tenant, @poultry, 'Broiler Chickens (Whole)', 'Ross 308', 'Free-range broiler chickens, pasture-raised. Average 2kg per bird. Perfect for roasting. Halal certified.', 85.00, 'unit', 1.00, TRUE, NOW(), '["https://example.com/chicken/1.jpg"]', 'AVAILABLE', 45, 8, NOW()),
    (UUID(), @thabo_tenant, @poultry, 'Large Free-Range Eggs (30 Crate)', 'Lohmann Brown', 'Our premium free-range eggs. Hens are pasture-raised, fed a natural diet. Packed in 30-egg crates. Perfect for restaurants and retailers.', 45.00, 'unit', 1.00, TRUE, NOW(), '["https://example.com/eggs/30crate.jpg"]', 'AVAILABLE', 60, 8, NOW()),
    (UUID(), @thabo_tenant, @poultry, 'Small Free-Range Eggs (30 Crate)', 'Hy-Line', 'Smaller free-range eggs, great for baking. Pasture-raised.', 35.00, 'unit', 1.00, FALSE, NULL, '["https://example.com/eggs/small.jpg"]', 'UNLISTED', 20, 3, NOW());

-- CATTLE (Ndlovu Cattle Ranch)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @lindiwe_tenant, @cattle, 'Nguni Breeding Bull', 'Nguni', 'Registered Nguni bull, excellent genetics. Suitable for breeding. Vaccination records available. 18 months old, 400kg.', 15000.00, 'unit', 5.00, TRUE, NOW(), '["https://example.com/cattle/bull.jpg"]', 'AVAILABLE', 210, 25, NOW()),
    (UUID(), @lindiwe_tenant, @cattle, 'Grass-Fed Beef (Whole Carcass)', 'Nguni Cross', 'Premium grass-fed Nguni beef. Grass-fed and finished. Marble score 4+. Available as whole carcass or half carcass.', 65.00, 'kg', 2.00, TRUE, NOW(), '["https://example.com/beef/carcass.jpg"]', 'AVAILABLE', 95, 10, NOW());

-- GOATS (Mokoena Goat Farm)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @grace_tenant, @goats, 'Boer Goat Breeding Bucks', 'Boer Goat', 'Top quality Boer goat breeding bucks. Registered stock with disease-free certification. Excellent conformation and fertility.', 8500.00, 'unit', 4.00, TRUE, NOW(), '["https://example.com/goats/buck.jpg"]', 'AVAILABLE', 140, 18, NOW()),
    (UUID(), @grace_tenant, @goats, 'Boer Goat Meat (Whole Carcass)', 'Boer Goat', 'Tender goat meat, perfect for braai and stews. Halal certified. Available whole or half.', 85.00, 'kg', 1.50, TRUE, NOW(), '["https://example.com/goats/meat.jpg"]', 'AVAILABLE', 65, 7, NOW());

-- POULTRY (Dlamini Free Range)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @john_tenant, @poultry, 'Free-Range Table Eggs', 'Hy-Line Brown', 'Pasture-raised eggs from happy hens. Known for their deep yellow yolks. Available in 6, 12, and 30 packs.', 40.00, 'unit', 0.80, TRUE, NOW(), '["https://example.com/eggs/dl1.jpg"]', 'AVAILABLE', 75, 9, NOW()),
    (UUID(), @john_tenant, @poultry, 'Pasture-Raised Whole Chicken', 'Sussex', 'Slow-growing heritage breed chickens. Pasture-raised for 12 weeks. Average 1.8kg. Exceptional flavor.', 120.00, 'unit', 1.20, TRUE, NOW(), '["https://example.com/chicken/sussex.jpg"]', 'AVAILABLE', 55, 11, NOW());

-- SHEEP (Masango Sheep Farm)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @elizabeth_tenant, @sheep, 'Merino Ewe Breeding Stock', 'Merino', 'Registered Merino ewes for breeding. Excellent wool quality and mothering ability. 2 years old, vaccinated.', 4000.00, 'unit', 3.00, TRUE, NOW(), '["https://example.com/sheep/ewe.jpg"]', 'AVAILABLE', 100, 14, NOW()),
    (UUID(), @elizabeth_tenant, @sheep, 'Merino Lamb Carcass', 'Merino', 'Premium quality lamb meat. Tender and mild. Excellent for roasting and grilling. Halal certified.', 75.00, 'kg', 1.50, TRUE, NOW(), '["https://example.com/sheep/lamb.jpg"]', 'AVAILABLE', 80, 7, NOW());

-- FRUITS (Joubert Citrus Estate)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @hendrik_tenant, @fruits, 'Valencia Oranges (Box)', 'Valencia', 'Sweet Valencia oranges perfect for fresh juice. Picked at peak ripeness. Available in 10kg boxes.', 120.00, 'kg', 1.50, TRUE, NOW(), '["https://example.com/citrus/oranges.jpg"]', 'AVAILABLE', 150, 20, NOW()),
    (UUID(), @hendrik_tenant, @fruits, 'Eureka Lemons (Box)', 'Eureka', 'Tart Eureka lemons. Perfect for cooking and preserves. Packed in 5kg boxes.', 80.00, 'kg', 1.00, TRUE, NOW(), '["https://example.com/citrus/lemons.jpg"]', 'AVAILABLE', 95, 14, NOW());

-- VEGETABLES (Mahomed Organic Veg)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @mariam_tenant, @veggies, 'Organic Tomatoes (Punnets)', 'Roma', 'Certified organic Roma tomatoes. Grown in rich soil without chemicals. Available in 250g punnets.', 25.00, 'kg', 0.75, TRUE, NOW(), '["https://example.com/veg/tomatoes.jpg"]', 'AVAILABLE', 130, 22, NOW()),
    (UUID(), @mariam_tenant, @veggies, 'Organic Spinach Bunch', 'Bloomsdale', 'Fresh organic spinach. Good source of iron and vitamins. Sold as 200g bunches.', 18.00, 'unit', 0.50, TRUE, NOW(), '["https://example.com/veg/spinach.jpg"]', 'AVAILABLE', 70, 10, NOW());

-- CROPS (Mabuza Maize Farm)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @david_tenant, @crops, 'Yellow Maize (Bulk)', 'Hybrid 501', 'High-yield yellow maize suitable for animal feed and human consumption. Available in bulk (1 ton bags).', 8.50, 'kg', 2.00, TRUE, NOW(), '["https://example.com/maize/maize.jpg"]', 'AVAILABLE', 200, 5, NOW());

-- STRAWBERRIES (Coetzee Strawberry Farm)
INSERT INTO products (id, tenant_id, category_id, name, breed, description, price, price_unit, daily_listing_fee, is_listed, listed_at, media, status, view_count, favorite_count, created_at) VALUES
    (UUID(), @sarah_tenant, @fruits, 'Fresh Strawberries (Punnets)', 'Strawberry', 'Sweet and juicy strawberries. Picked fresh daily. Available in 250g punnets.', 35.00, 'kg', 0.80, TRUE, NOW(), '["https://example.com/strawberries/1.jpg"]', 'AVAILABLE', 160, 35, NOW());

-- ======================================================
-- 9. WALLET TRANSACTIONS (Add some history)
-- ======================================================

-- Get wallet IDs
SET @thabo_wallet = (SELECT id FROM wallets WHERE user_id = @thabo LIMIT 1);
SET @lindiwe_wallet = (SELECT id FROM wallets WHERE user_id = @lindiwe LIMIT 1);
SET @pieter_wallet = (SELECT id FROM wallets WHERE user_id = @pieter LIMIT 1);
SET @grace_wallet = (SELECT id FROM wallets WHERE user_id = @grace LIMIT 1);
SET @john_wallet = (SELECT id FROM wallets WHERE user_id = @john LIMIT 1);
SET @elizabeth_wallet = (SELECT id FROM wallets WHERE user_id = @elizabeth LIMIT 1);
SET @hendrik_wallet = (SELECT id FROM wallets WHERE user_id = @hendrik LIMIT 1);
SET @mariam_wallet = (SELECT id FROM wallets WHERE user_id = @mariam LIMIT 1);
SET @david_wallet = (SELECT id FROM wallets WHERE user_id = @david LIMIT 1);
SET @sarah_wallet = (SELECT id FROM wallets WHERE user_id = @sarah LIMIT 1);

INSERT IGNORE INTO wallet_transactions (id, wallet_id, product_id, type, amount, balance_after, description, reference_id, status, created_at) VALUES
    (UUID(), @thabo_wallet, NULL, 'TOPUP', 200.00, 250.00, 'Initial wallet top-up', 'REF-001', 'COMPLETED', NOW()),
    (UUID(), @thabo_wallet, NULL, 'TOPUP', 150.00, 400.00, 'Monthly top-up', 'REF-002', 'COMPLETED', NOW()),
    (UUID(), @lindiwe_wallet, NULL, 'TOPUP', 500.00, 500.00, 'Initial top-up', 'REF-003', 'COMPLETED', NOW()),
    (UUID(), @pieter_wallet, NULL, 'TOPUP', 100.00, 100.00, 'First top-up', 'REF-004', 'COMPLETED', NOW()),
    (UUID(), @grace_wallet, NULL, 'TOPUP', 50.00, 50.00, 'Initial top-up', 'REF-005', 'COMPLETED', NOW()),
    (UUID(), @john_wallet, NULL, 'TOPUP', 100.00, 100.00, 'Top-up', 'REF-006', 'COMPLETED', NOW()),
    (UUID(), @elizabeth_wallet, NULL, 'TOPUP', 75.00, 75.00, 'Initial top-up', 'REF-007', 'COMPLETED', NOW()),
    (UUID(), @hendrik_wallet, NULL, 'TOPUP', 300.00, 300.00, 'Top-up', 'REF-008', 'COMPLETED', NOW()),
    (UUID(), @mariam_wallet, NULL, 'TOPUP', 80.00, 80.00, 'Initial top-up', 'REF-009', 'COMPLETED', NOW()),
    (UUID(), @david_wallet, NULL, 'TOPUP', 500.00, 500.00, 'Bulk top-up', 'REF-010', 'COMPLETED', NOW()),
    (UUID(), @sarah_wallet, NULL, 'TOPUP', 150.00, 150.00, 'Initial top-up', 'REF-011', 'COMPLETED', NOW());

-- ======================================================
-- 10. DEMO ORDER DATA (For testing)
-- ======================================================

SET @buyer_joburg = (SELECT id FROM users WHERE email = 'buyer.joburg@retail.co.za' LIMIT 1);
SET @buyer_cape = (SELECT id FROM users WHERE email = 'buyer.cape@restaurant.co.za' LIMIT 1);

-- Get product IDs
SET @eggs_product = (SELECT id FROM products WHERE name = 'Free-Range Large Brown Eggs' LIMIT 1);
SET @beef_product = (SELECT id FROM products WHERE name = 'Grass-Fed Beef (Whole Carcass)' LIMIT 1);

INSERT IGNORE INTO orders (id, buyer_id, farmer_id, product_id, product_price, buyer_service_fee, farmer_commission, total_amount, status, delivery_address, created_at) VALUES
    (UUID(), @buyer_joburg, @thabo, @eggs_product, 45.00, 1.35, 1.35, 47.70, 'COMPLETED', '123 Bree St, Johannesburg, 2001', NOW());

INSERT IGNORE INTO orders (id, buyer_id, farmer_id, product_id, product_price, buyer_service_fee, farmer_commission, total_amount, status, delivery_address, created_at) VALUES
    (UUID(), @buyer_cape, @lindiwe, @beef_product, 65.00, 1.95, 1.95, 68.90, 'DELIVERED', '456 Long St, Cape Town, 8001', NOW());

-- ======================================================
-- 11. VERIFICATION QUERIES
-- ======================================================

SELECT '✅ Database seeded successfully!' AS status;
SELECT CONCAT('📊 Categories: ', COUNT(*)) AS count FROM categories;
SELECT CONCAT('👥 Users: ', COUNT(*)) AS count FROM users;
SELECT CONCAT('🏠 Tenants: ', COUNT(*)) AS count FROM tenants;
SELECT CONCAT('💰 Wallets: ', COUNT(*)) AS count FROM wallets;
SELECT CONCAT('📦 Products: ', COUNT(*)) AS count FROM products;
SELECT CONCAT('📝 Orders: ', COUNT(*)) AS count FROM orders;

-- Show egg products specifically
SELECT 
    t.farm_name,
    p.name AS product_name,
    p.price,
    p.is_listed,
    p.status
FROM products p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.name LIKE '%egg%' OR p.category_id = @poultry
ORDER BY t.farm_name;

-- ======================================================
-- END OF SEED SCRIPT
-- ======================================================