-- Migration: Add product_connect_id to orders table
-- This allows orders to reference products by their product_connect_id instead of internal id
-- Created: 2025-12-29

-- Add the column
ALTER TABLE orders
ADD COLUMN product_connect_id VARCHAR(100);

-- Populate product_connect_id for existing orders that have a product_id
UPDATE orders o
SET product_connect_id = p.product_connect_id
FROM products p
WHERE o.product_id = p.id
  AND o.product_connect_id IS NULL;

-- Add index for faster lookups
CREATE INDEX idx_orders_product_connect_id ON orders(product_connect_id);

-- Add comment
COMMENT ON COLUMN orders.product_connect_id IS 'External product identifier - references products.product_connect_id';

-- Show migration results
SELECT
  COUNT(*) as total_orders,
  COUNT(product_id) as with_product_id,
  COUNT(product_connect_id) as with_product_connect_id,
  COUNT(*) FILTER (WHERE product_id IS NOT NULL AND product_connect_id IS NULL) as missing_product_connect_id
FROM orders;
