-- Migration: Add product_connect_id column to products table
-- This will be the unique identifier for products (instead of using the internal id)
-- Created: 2025-12-29

-- Add the column
ALTER TABLE products
ADD COLUMN product_connect_id VARCHAR(100);

-- Create unique index (enforce uniqueness after we populate it)
-- We'll add this constraint after populating the values
-- CREATE UNIQUE INDEX idx_products_product_connect_id ON products(product_connect_id);

-- Populate product_connect_id with the current id values (temporary, you can update later)
-- This ensures every product has a unique product_connect_id
UPDATE products
SET product_connect_id = 'PROD-' || LPAD(id::TEXT, 6, '0')
WHERE product_connect_id IS NULL;

-- Now add the unique constraint
ALTER TABLE products
ADD CONSTRAINT products_product_connect_id_unique UNIQUE (product_connect_id);

-- Add index for faster lookups
CREATE INDEX idx_products_product_connect_id ON products(product_connect_id);

-- Add NOT NULL constraint (after all rows have values)
ALTER TABLE products
ALTER COLUMN product_connect_id SET NOT NULL;

COMMENT ON COLUMN products.product_connect_id IS 'Unique external identifier for the product';
