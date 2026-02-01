-- Migration: Add validation fields to orders table for cart validation
-- Date: 2026-02-01
-- Description: Add product validation fields to orders table so cart items can show validation warnings

-- ==================================
-- 1. Add validation columns to orders table
-- ==================================

-- Add is_split_case column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS is_split_case BOOLEAN DEFAULT false;

-- Add case_pack column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS case_pack INTEGER;

-- Add minimum_units column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS minimum_units INTEGER;

-- Add case_minimum column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS case_minimum INTEGER;

-- Add minimum_cost column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS minimum_cost NUMERIC(10, 2);

-- Add product_image column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS product_image VARCHAR(500);

-- Add pricing mode columns (if not already present)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(10) DEFAULT 'case';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS case_price NUMERIC(10, 2);

-- Add vendor_connect_id column (if not already present)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS vendor_connect_id VARCHAR(100);

-- Add unavailable action columns (if not already present)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS unavailable_action VARCHAR(50) DEFAULT 'curate';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS replacement_product_id INTEGER;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS replacement_product_name VARCHAR(255);

-- ==================================
-- 2. Add comments for documentation
-- ==================================

COMMENT ON COLUMN orders.is_split_case IS 'Indicates if the product can be sold in split cases';
COMMENT ON COLUMN orders.case_pack IS 'Number of units in a case pack';
COMMENT ON COLUMN orders.minimum_units IS 'Minimum number of units required for order';
COMMENT ON COLUMN orders.case_minimum IS 'Minimum number of cases required for order';
COMMENT ON COLUMN orders.minimum_cost IS 'Minimum cost threshold for the product';
COMMENT ON COLUMN orders.product_image IS 'URL to product image';
COMMENT ON COLUMN orders.pricing_mode IS 'Pricing mode: case or unit';
COMMENT ON COLUMN orders.unit_price IS 'Price per unit';
COMMENT ON COLUMN orders.case_price IS 'Price per case';
COMMENT ON COLUMN orders.vendor_connect_id IS 'Vendor Connect ID from vendor system';
COMMENT ON COLUMN orders.unavailable_action IS 'Action to take if product is unavailable: curate, replace_same_vendor, replace_other_vendors, remove';
COMMENT ON COLUMN orders.replacement_product_id IS 'ID of replacement product if unavailable';
COMMENT ON COLUMN orders.replacement_product_name IS 'Name of replacement product if unavailable';

-- ==================================
-- Migration complete
-- ==================================

-- To apply this migration, run:
-- psql -U your_username -d your_database -f add_validation_fields_to_orders.sql
