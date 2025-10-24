-- Add seasonal column to products table if it doesn't exist
-- Run this script to fix the import error

-- Check if column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'seasonal'
    ) THEN
        ALTER TABLE products ADD COLUMN seasonal BOOLEAN DEFAULT false;
        RAISE NOTICE 'Column seasonal added successfully';
    ELSE
        RAISE NOTICE 'Column seasonal already exists';
    END IF;
END $$;
