-- Migration: Update 'user' role to 'buyer'
-- Date: 2025-10-30
-- Description: Renames the 'user' role to 'buyer' for better clarity

-- Step 1: Update existing users with 'user' role to 'buyer'
UPDATE users SET role = 'buyer' WHERE role = 'user';

-- Step 2: Drop the old CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Add new CHECK constraint with 'buyer' instead of 'user'
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('buyer', 'admin'));

-- Verification query
-- Run this to verify the changes:
-- SELECT role, COUNT(*) FROM users GROUP BY role;
