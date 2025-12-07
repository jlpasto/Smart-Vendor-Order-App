-- Migration: Add order modification tracking tables and columns
-- Created: 2025-01-05
-- Description: Enable admin order editing with full audit trail

-- ==================================
-- 1. Add new columns to orders table
-- ==================================

-- Add pricing mode column (unit or case)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(10) DEFAULT 'case';

-- Add unit and case prices at time of order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS case_price DECIMAL(10, 2);

-- Add modification tracking flags
ALTER TABLE orders ADD COLUMN IF NOT EXISTS modified_by_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS modification_count INTEGER DEFAULT 0;

-- ==================================
-- 2. Create order_history table
-- ==================================

CREATE TABLE IF NOT EXISTS order_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  batch_order_number VARCHAR(50) NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  admin_notes TEXT,
  changed_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_by_admin_email VARCHAR(255),
  change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for order_history
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_batch ON order_history(batch_order_number);
CREATE INDEX IF NOT EXISTS idx_order_history_timestamp ON order_history(change_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_order_history_change_type ON order_history(change_type);

-- ==================================
-- 3. Create order_snapshots table
-- ==================================

CREATE TABLE IF NOT EXISTS order_snapshots (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  batch_order_number VARCHAR(50) NOT NULL,
  snapshot_type VARCHAR(20) NOT NULL CHECK (snapshot_type IN ('original', 'current')),
  product_connect_id INTEGER,
  product_name VARCHAR(255),
  vendor_name VARCHAR(255),
  quantity INTEGER,
  pricing_mode VARCHAR(10),
  unit_price DECIMAL(10, 2),
  case_price DECIMAL(10, 2),
  amount DECIMAL(10, 2),
  snapshot_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for order_snapshots
CREATE INDEX IF NOT EXISTS idx_order_snapshots_order_id ON order_snapshots(order_id);
CREATE INDEX IF NOT EXISTS idx_order_snapshots_batch ON order_snapshots(batch_order_number);
CREATE INDEX IF NOT EXISTS idx_order_snapshots_type ON order_snapshots(snapshot_type);

-- ==================================
-- 4. Add comments for documentation
-- ==================================

COMMENT ON TABLE order_history IS 'Audit trail of all changes made to orders by admins';
COMMENT ON TABLE order_snapshots IS 'Stores original and modified order states for comparison';

COMMENT ON COLUMN orders.pricing_mode IS 'How the item was priced: unit or case';
COMMENT ON COLUMN orders.unit_price IS 'Price per unit at time of order';
COMMENT ON COLUMN orders.case_price IS 'Price per case at time of order';
COMMENT ON COLUMN orders.modified_by_admin IS 'Flag indicating if admin has modified this order';
COMMENT ON COLUMN orders.modification_count IS 'Number of times this order has been modified';

COMMENT ON COLUMN order_history.change_type IS 'Type of change: quantity_changed, price_changed, pricing_mode_changed, amount_changed, item_added, item_removed, status_changed, note_added';
COMMENT ON COLUMN order_snapshots.snapshot_type IS 'original = initial order state, current = latest modified state';

-- ==================================
-- 5. Grant permissions (if needed)
-- ==================================

-- Grant necessary permissions to application user
-- Uncomment and modify if you have specific database users
-- GRANT SELECT, INSERT, UPDATE, DELETE ON order_history TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON order_snapshots TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE order_history_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE order_snapshots_id_seq TO your_app_user;

-- ==================================
-- Migration complete
-- ==================================

-- To rollback this migration, run:
-- DROP TABLE IF EXISTS order_history CASCADE;
-- DROP TABLE IF EXISTS order_snapshots CASCADE;
-- ALTER TABLE orders DROP COLUMN IF EXISTS pricing_mode;
-- ALTER TABLE orders DROP COLUMN IF EXISTS unit_price;
-- ALTER TABLE orders DROP COLUMN IF EXISTS case_price;
-- ALTER TABLE orders DROP COLUMN IF EXISTS modified_by_admin;
-- ALTER TABLE orders DROP COLUMN IF EXISTS modification_count;
