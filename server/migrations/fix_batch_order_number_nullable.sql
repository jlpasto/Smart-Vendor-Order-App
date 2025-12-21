-- Migration: Make batch_order_number nullable for cart items
-- Created: 2025-12-21
-- Description: Allow NULL for batch_order_number (required for 'ongoing' status cart items)

-- Make batch_order_number nullable
ALTER TABLE orders ALTER COLUMN batch_order_number DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN orders.batch_order_number IS 'Batch number for submitted orders. NULL for cart items (status=ongoing).';
