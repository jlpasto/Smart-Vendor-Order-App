-- Migration: Add active, active_start_date, and active_end_date columns to products table
-- Date: 2026-02-19

-- Add active column (boolean, defaults to true)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add active_start_date column (date, nullable)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS active_start_date DATE;

-- Add active_end_date column (date, nullable)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS active_end_date DATE;

-- Add index for active column (used for buyer filtering)
CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);

-- Add comments for documentation
COMMENT ON COLUMN products.active IS 'Whether the product is currently active and visible to buyers';
COMMENT ON COLUMN products.active_start_date IS 'Start date for seasonal/featured product availability';
COMMENT ON COLUMN products.active_end_date IS 'End date for seasonal/featured product availability';
