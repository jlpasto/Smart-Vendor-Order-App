-- Migration: Create season_type_options table for admin-configurable season types

CREATE TABLE IF NOT EXISTS season_type_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default options
INSERT INTO season_type_options (name) VALUES
  ('Spring'),
  ('Summer'),
  ('Fall'),
  ('Winter'),
  ('Halloween'),
  ('Super Bowl')
ON CONFLICT (name) DO NOTHING;
