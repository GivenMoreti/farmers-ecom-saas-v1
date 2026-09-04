-- ======================================================
-- SEED: CATEGORIES
-- ======================================================
-- Run this after erd.sql. It's a manual/SQL-client equivalent of
-- backend/.../config/CategorySeeder.java, which does the same thing
-- automatically on app startup — this script exists for when you want the
-- data in place without starting the backend first (e.g. right after
-- dropping and recreating the database).
--
-- Idempotent: only inserts when the categories table is completely empty,
-- matching CategorySeeder's own guard, so it's safe to run more than once.

USE farm_marketplace_db;

INSERT INTO categories (id, name, description, is_active, created_at, updated_at)
SELECT * FROM (
    SELECT UUID() AS id, 'cattle'  AS name, NULL AS description, TRUE AS is_active, NOW() AS created_at, NOW() AS updated_at
    UNION ALL SELECT UUID(), 'goats',   NULL, TRUE, NOW(), NOW()
    UNION ALL SELECT UUID(), 'sheep',   NULL, TRUE, NOW(), NOW()
    UNION ALL SELECT UUID(), 'poultry', NULL, TRUE, NOW(), NOW()
    UNION ALL SELECT UUID(), 'pigs',    NULL, TRUE, NOW(), NOW()
    UNION ALL SELECT UUID(), 'crops',   NULL, TRUE, NOW(), NOW()
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM categories);
