-- Migration: Add seasonal column to products table
-- Date: 2025-01-11

-- Add the seasonal column if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS seasonal BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_seasonal ON products(seasonal);

-- Optional: Set some initial products as seasonal (uncomment if needed)
-- UPDATE products
-- SET seasonal = true
-- WHERE category IN ('Fall Harvest', 'Winter Specials', 'Spring Collection', 'Summer Fruits');

COMMENT ON COLUMN products.seasonal IS 'Indicates if the product is currently in season';