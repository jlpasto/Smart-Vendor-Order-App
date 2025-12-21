-- Migration: Add cart persistence to orders table
-- Created: 2025-01-21
-- Description: Add 'ongoing' status for cart items and cart_created_at timestamp

-- ==================================
-- 1. Update CHECK constraint to allow 'ongoing' status
-- ==================================

-- Drop existing constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;

-- Add new constraint with 'ongoing' status
ALTER TABLE orders ADD CONSTRAINT check_order_status
  CHECK (status IN ('ongoing', 'pending', 'completed', 'cancelled'));

-- ==================================
-- 2. Add cart_created_at timestamp column
-- ==================================

-- Add column with default current timestamp
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ==================================
-- 3. Add indexes for querying ongoing carts
-- ==================================

-- Composite index for filtering carts by status and user
CREATE INDEX IF NOT EXISTS idx_orders_status_user ON orders(status, user_id);

-- Partial index for cart creation timestamp (only for ongoing items)
CREATE INDEX IF NOT EXISTS idx_orders_cart_created ON orders(cart_created_at) WHERE status = 'ongoing';

-- ==================================
-- 4. Add documentation comments
-- ==================================

COMMENT ON COLUMN orders.cart_created_at IS 'Timestamp when item was added to cart (for ongoing status)';
COMMENT ON CONSTRAINT check_order_status ON orders IS 'Valid order statuses: ongoing (in cart), pending (submitted), completed, cancelled';

-- ==================================
-- 5. Update existing rows to have cart_created_at
-- ==================================

-- For existing orders (pending/completed/cancelled), set cart_created_at to date_submitted
UPDATE orders
SET cart_created_at = date_submitted
WHERE cart_created_at IS NULL AND date_submitted IS NOT NULL;

-- For any remaining rows without timestamps, use current time
UPDATE orders
SET cart_created_at = CURRENT_TIMESTAMP
WHERE cart_created_at IS NULL;

-- ==================================
-- Migration complete
-- ==================================

-- Status value meanings:
-- 'ongoing'    - Item in user's cart, not yet submitted
-- 'pending'    - Order submitted, awaiting admin processing
-- 'completed'  - Order fulfilled by admin
-- 'cancelled'  - Order rejected/cancelled by admin

-- ==================================
-- Rollback instructions
-- ==================================

-- To rollback this migration, run:
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;
-- ALTER TABLE orders ADD CONSTRAINT check_order_status
--   CHECK (status IN ('pending', 'completed', 'cancelled'));
-- ALTER TABLE orders DROP COLUMN IF EXISTS cart_created_at;
-- DROP INDEX IF EXISTS idx_orders_status_user;
-- DROP INDEX IF EXISTS idx_orders_cart_created;
-- DELETE FROM orders WHERE status = 'ongoing';
