-- Migration: Add proper vendor relationships using IDs
-- Date: 2025-10-29
-- Description: Adds vendor_id foreign key to products and uses IDs for buyer-vendor assignments

-- Step 1: Add vendor_id column to products table
ALTER TABLE products ADD COLUMN vendor_id INTEGER;

-- Step 2: Populate vendor_id based on vendor_name
-- This matches products to vendors by name
UPDATE products p
SET vendor_id = v.id
FROM vendors v
WHERE p.vendor_name = v.name;

-- Step 3: For products without matching vendor, create vendor record
-- Insert missing vendors into vendors table
INSERT INTO vendors (name)
SELECT DISTINCT vendor_name
FROM products
WHERE vendor_id IS NULL AND vendor_name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 4: Update remaining products with newly created vendor IDs
UPDATE products p
SET vendor_id = v.id
FROM vendors v
WHERE p.vendor_name = v.name AND p.vendor_id IS NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE products
ADD CONSTRAINT fk_products_vendor
FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- Step 6: Create index on vendor_id for fast lookups
CREATE INDEX idx_products_vendor_id ON products(vendor_id);

-- Step 7: Update users table to use vendor IDs (INTEGER array)
ALTER TABLE users ADD COLUMN assigned_vendor_ids INTEGER[] DEFAULT '{}';

-- Step 8: Create GIN index for efficient array operations
CREATE INDEX idx_users_assigned_vendor_ids ON users USING GIN(assigned_vendor_ids);

-- Step 9: Add documentation
COMMENT ON COLUMN products.vendor_id IS 'Foreign key reference to vendors table. Links product to its vendor.';
COMMENT ON COLUMN users.assigned_vendor_ids IS 'Array of vendor IDs (integers) assigned to this buyer. Empty array means buyer has access to all vendors (no restrictions).';

-- Note: We keep vendor_name in products for backward compatibility and display purposes
-- But vendor_id is now the source of truth for relationships

-- Verification queries:
-- Check vendor_id population:
-- SELECT COUNT(*) as total, COUNT(vendor_id) as with_vendor_id FROM products;
--
-- Check vendor assignment:
-- SELECT id, email, assigned_vendor_ids FROM users WHERE assigned_vendor_ids != '{}';
--
-- Get products for a buyer:
-- SELECT p.* FROM products p WHERE p.vendor_id = ANY((SELECT assigned_vendor_ids FROM users WHERE id = 1));
