-- Migration: Update 'ongoing' status to 'in_cart'
-- This migration updates all existing cart items from 'ongoing' status to 'in_cart' status

-- Update all orders with status 'ongoing' to 'in_cart'
UPDATE orders
SET status = 'in_cart'
WHERE status = 'ongoing';

-- Add a comment to document the change
COMMENT ON COLUMN orders.status IS 'Order status: in_cart, pending, completed, cancelled';
