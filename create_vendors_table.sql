-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  state VARCHAR(100),
  city VARCHAR(100),
  website_url VARCHAR(500),
  logo_url VARCHAR(500),
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_state ON vendors(state);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);

-- Insert some sample vendors for testing
INSERT INTO vendors (name, state, city, website_url, logo_url, description, email, phone) VALUES
('2Betties', 'CA', 'Los Angeles', 'https://2betties.com', 'https://via.placeholder.com/100/4A90E2/ffffff?text=2B', 'Premium artisanal snacks and treats', 'contact@2betties.com', '(555) 123-4567'),
('Absurd Snacks', 'TX', 'Austin', 'http://absurdsnacks.com', 'https://via.placeholder.com/100/F5A623/ffffff?text=AS', 'Unique and creative snack combinations', 'info@absurdsnacks.com', '(555) 234-5678'),
('Accents', 'NY', 'New York', 'https://accentsgrill.com', 'https://via.placeholder.com/100/7ED321/ffffff?text=AC', 'Gourmet food products and seasonings', 'hello@accentsgrill.com', '(555) 345-6789'),
('Amazi Foods', 'WA', 'Seattle', 'https://amazifoods.com', 'https://via.placeholder.com/100/BD10E0/ffffff?text=AF', 'Organic and sustainable food products', 'contact@amazifoods.com', '(555) 456-7890'),
('Amelia Creamery', 'NC', 'Asheville', 'http://ameliacreamery.com', 'https://via.placeholder.com/100/F8E71C/ffffff?text=AC', 'Artisan dairy and cheese products', 'info@ameliacreamery.com', '(555) 567-8901')
ON CONFLICT DO NOTHING;

-- Display success message
SELECT 'Vendors table created successfully!' as status;
SELECT COUNT(*) as total_vendors FROM vendors;
