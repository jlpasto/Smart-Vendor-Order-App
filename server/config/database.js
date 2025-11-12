import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wholesale_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Initialize database tables
export const initDatabase = async () => {
  try {
    // Create Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        id_no VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add name and id_no columns if they don't exist (migration)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
          ALTER TABLE users ADD COLUMN name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='id_no') THEN
          ALTER TABLE users ADD COLUMN id_no VARCHAR(100);
        END IF;
      END $$;
    `);

    // Create Vendors table
    await query(`
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
    `);

    // Create Products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        vendor_name VARCHAR(255) NOT NULL,
        state VARCHAR(100),
        product_name VARCHAR(255) NOT NULL,
        product_description TEXT,
        size VARCHAR(100),
        case_pack INTEGER,
        upc VARCHAR(50),
        wholesale_case_price DECIMAL(10, 2),
        wholesale_unit_price DECIMAL(10, 2),
        retail_unit_price DECIMAL(10, 2),
        gm_percent DECIMAL(5, 2) GENERATED ALWAYS AS (
          CASE
            WHEN wholesale_unit_price > 0 THEN
              ((retail_unit_price - wholesale_unit_price) / wholesale_unit_price * 100)
            ELSE 0
          END
        ) STORED,
        order_qty INTEGER DEFAULT 0,
        stock_level INTEGER DEFAULT 0,
        product_image VARCHAR(500),
        popular BOOLEAN DEFAULT false,
        seasonal BOOLEAN DEFAULT false,
        new BOOLEAN DEFAULT false,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        batch_order_number VARCHAR(50) NOT NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
        vendor_name VARCHAR(255),
        quantity INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        user_email VARCHAR(255),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_name);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_popular ON products(popular);
      CREATE INDEX IF NOT EXISTS idx_products_seasonal ON products(seasonal);
      CREATE INDEX IF NOT EXISTS idx_products_new ON products(new);
      CREATE INDEX IF NOT EXISTS idx_orders_batch ON orders(batch_order_number);
      CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date_submitted);
      CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_orders_vendor_name ON orders(vendor_name);
      CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
      CREATE INDEX IF NOT EXISTS idx_vendors_state ON vendors(state);
      CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

export default pool;
