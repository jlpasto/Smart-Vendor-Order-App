-- Migration: Add product-based assignments to replace vendor-based assignments
-- Date: 2025-01-07
-- Description: Adds assigned_product_ids column to users table and provides data migration

-- ============================================================================
-- STEP 1: Add new column for product assignments
-- ============================================================================

-- Add assigned_product_ids column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_product_ids INTEGER[] DEFAULT '{}';

-- Create GIN index for efficient array operations
CREATE INDEX IF NOT EXISTS idx_users_assigned_product_ids ON users USING GIN(assigned_product_ids);

-- Add column comment
COMMENT ON COLUMN users.assigned_product_ids IS 'Array of product IDs (integers) assigned to this buyer. Empty array means buyer has no access to any products.';

-- ============================================================================
-- STEP 2: Data Migration (Convert vendor assignments to product assignments)
-- ============================================================================

-- For each user with assigned vendors, assign all products from those vendors
-- This preserves existing access patterns during migration

DO $$
DECLARE
    user_record RECORD;
    product_ids INTEGER[];
BEGIN
    -- Loop through all users who have vendor assignments
    FOR user_record IN
        SELECT id, email, assigned_vendor_ids
        FROM users
        WHERE assigned_vendor_ids IS NOT NULL
        AND array_length(assigned_vendor_ids, 1) > 0
    LOOP
        -- Get all product IDs from the assigned vendors
        SELECT array_agg(DISTINCT p.id)
        INTO product_ids
        FROM products p
        WHERE p.vendor_id = ANY(user_record.assigned_vendor_ids);

        -- Update user with the product IDs
        IF product_ids IS NOT NULL THEN
            UPDATE users
            SET assigned_product_ids = product_ids
            WHERE id = user_record.id;

            RAISE NOTICE 'Migrated user % (ID: %) - Assigned % products from % vendors',
                user_record.email,
                user_record.id,
                array_length(product_ids, 1),
                array_length(user_record.assigned_vendor_ids, 1);
        ELSE
            RAISE NOTICE 'User % (ID: %) has assigned vendors but no products found',
                user_record.email,
                user_record.id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Product assignment migration completed';
END $$;

-- ============================================================================
-- STEP 3: Verification Queries (Optional - for manual verification)
-- ============================================================================

-- Check migration results
-- SELECT
--     id,
--     email,
--     role,
--     array_length(assigned_vendor_ids, 1) as vendor_count,
--     array_length(assigned_product_ids, 1) as product_count
-- FROM users
-- WHERE role = 'buyer'
-- ORDER BY id;

-- ============================================================================
-- STEP 4: Cleanup (Optional - Run after verifying everything works)
-- ============================================================================

-- IMPORTANT: Only run these commands AFTER you have thoroughly tested
-- the new product-based assignment system and confirmed it works correctly.

-- Drop the old vendor assignments column (UNCOMMENT WHEN READY)
-- ALTER TABLE users DROP COLUMN IF EXISTS assigned_vendor_ids;

-- Drop the old index (UNCOMMENT WHEN READY)
-- DROP INDEX IF EXISTS idx_users_assigned_vendor_ids;

-- ============================================================================
-- ROLLBACK SCRIPT (In case you need to revert)
-- ============================================================================

-- To rollback this migration:
-- 1. DROP COLUMN assigned_product_ids:
--    ALTER TABLE users DROP COLUMN IF EXISTS assigned_product_ids;
--
-- 2. DROP INDEX:
--    DROP INDEX IF EXISTS idx_users_assigned_product_ids;
--
-- 3. The assigned_vendor_ids column should still exist unless you ran STEP 4 cleanup
