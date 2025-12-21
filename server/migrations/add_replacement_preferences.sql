-- Migration: Add replacement preference tracking to orders
-- Created: 2025-01-21
-- Description: Persist user replacement preferences for out-of-stock scenarios

-- ==================================
-- 1. Add replacement columns to orders table
-- ==================================

-- Add unavailable action preference
ALTER TABLE orders ADD COLUMN IF NOT EXISTS unavailable_action VARCHAR(30);

-- Add replacement product reference
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_product_id INTEGER;

-- Add replacement product snapshot details (denormalized for historical accuracy)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_product_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_vendor_name VARCHAR(255);

-- Add foreign key constraint with SET NULL on delete (if product is removed, we keep the order)
ALTER TABLE orders ADD CONSTRAINT fk_replacement_product
  FOREIGN KEY (replacement_product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Add check constraint for valid unavailable actions
ALTER TABLE orders ADD CONSTRAINT check_unavailable_action
  CHECK (unavailable_action IN ('curate', 'replace_same_vendor', 'replace_other_vendors', 'remove', NULL));

-- Create index for querying by replacement preferences
CREATE INDEX IF NOT EXISTS idx_orders_unavailable_action ON orders(unavailable_action);
CREATE INDEX IF NOT EXISTS idx_orders_replacement_product_id ON orders(replacement_product_id);

-- ==================================
-- 2. Add replacement columns to order_snapshots table
-- ==================================

ALTER TABLE order_snapshots ADD COLUMN IF NOT EXISTS unavailable_action VARCHAR(30);
ALTER TABLE order_snapshots ADD COLUMN IF NOT EXISTS replacement_product_id INTEGER;
ALTER TABLE order_snapshots ADD COLUMN IF NOT EXISTS replacement_product_name VARCHAR(255);
ALTER TABLE order_snapshots ADD COLUMN IF NOT EXISTS replacement_vendor_name VARCHAR(255);

-- ==================================
-- 3. Add documentation comments
-- ==================================

COMMENT ON COLUMN orders.unavailable_action IS 'User preference if product unavailable: curate, replace_same_vendor, replace_other_vendors, remove';
COMMENT ON COLUMN orders.replacement_product_id IS 'Reference to preferred replacement product';
COMMENT ON COLUMN orders.replacement_product_name IS 'Snapshot of replacement product name at order time';
COMMENT ON COLUMN orders.replacement_vendor_name IS 'Snapshot of replacement vendor name at order time';

-- ==================================
-- Migration complete
-- ==================================

-- To rollback this migration, run:
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_replacement_product;
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_unavailable_action;
-- ALTER TABLE orders DROP COLUMN IF EXISTS unavailable_action;
-- ALTER TABLE orders DROP COLUMN IF EXISTS replacement_product_id;
-- ALTER TABLE orders DROP COLUMN IF EXISTS replacement_product_name;
-- ALTER TABLE orders DROP COLUMN IF EXISTS replacement_vendor_name;
-- DROP INDEX IF EXISTS idx_orders_unavailable_action;
-- DROP INDEX IF EXISTS idx_orders_replacement_product_id;
-- ALTER TABLE order_snapshots DROP COLUMN IF EXISTS unavailable_action;
-- ALTER TABLE order_snapshots DROP COLUMN IF EXISTS replacement_product_id;
-- ALTER TABLE order_snapshots DROP COLUMN IF EXISTS replacement_product_name;
-- ALTER TABLE order_snapshots DROP COLUMN IF EXISTS replacement_vendor_name;
