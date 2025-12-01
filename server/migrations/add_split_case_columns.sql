-- Migration: Add is_split_case, minimum_units, and minimum_cost columns to products table
-- Date: 2025-12-02

-- Add is_split_case column (accepts true/false, 1/0)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_split_case BOOLEAN DEFAULT false;

-- Add minimum_units column (accepts integer)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS minimum_units INTEGER;

-- Add minimum_cost column (accepts decimal)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS minimum_cost NUMERIC(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN products.is_split_case IS 'Indicates if the product can be sold in split cases';
COMMENT ON COLUMN products.minimum_units IS 'Minimum number of units required for order';
COMMENT ON COLUMN products.minimum_cost IS 'Minimum cost threshold for the product';
