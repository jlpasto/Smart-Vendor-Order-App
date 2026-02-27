-- Migration: Add season_types and year_round_orderable columns to products table

-- Add season_types column (comma-separated TEXT, matching existing pattern for allergens/dietary_preferences)
ALTER TABLE products ADD COLUMN IF NOT EXISTS season_types TEXT;

-- Add year_round_orderable column (boolean, defaults to true)
ALTER TABLE products ADD COLUMN IF NOT EXISTS year_round_orderable BOOLEAN DEFAULT true;

-- Backfill: set season_types for existing products where seasonal = true
UPDATE products
SET season_types = 'Seasonal'
WHERE seasonal = true AND (season_types IS NULL OR season_types = '');
