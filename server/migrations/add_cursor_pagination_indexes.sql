-- Migration: Add indexes for cursor-based pagination
-- Purpose: Optimize cursor-based queries for infinite scrolling
-- Created: 2025-01-28

-- Drop indexes if they exist (for re-running migration)
DROP INDEX IF EXISTS idx_products_vendor_id;
DROP INDEX IF EXISTS idx_products_name_id;
DROP INDEX IF EXISTS idx_products_case_price_id;
DROP INDEX IF EXISTS idx_products_unit_price_id;
DROP INDEX IF EXISTS idx_products_retail_price_id;
DROP INDEX IF EXISTS idx_products_gm_id;

-- Create composite indexes for cursor-based pagination
-- These indexes include the sort field + id for efficient cursor queries

-- For sorting by vendor_name (default sort)
CREATE INDEX idx_products_vendor_id ON products(vendor_name, id);

-- For sorting by product_name
CREATE INDEX idx_products_name_id ON products(product_name, id);

-- For sorting by wholesale_case_price
CREATE INDEX idx_products_case_price_id ON products(wholesale_case_price, id);

-- For sorting by wholesale_unit_price
CREATE INDEX idx_products_unit_price_id ON products(wholesale_unit_price, id);

-- For sorting by retail_unit_price
CREATE INDEX idx_products_retail_price_id ON products(retail_unit_price, id);

-- For sorting by gm_percent
CREATE INDEX idx_products_gm_id ON products(gm_percent, id);

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'products'
    AND indexname LIKE 'idx_products_%'
ORDER BY
    indexname;
