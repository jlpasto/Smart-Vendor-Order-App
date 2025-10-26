import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create a new pool for the production database
const pool = new Pool({
  host: process.env.DB_HOST + '.oregon-postgres.render.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

const resetDatabase = async () => {
  console.log('🔄 Starting database reset...\n');
  console.log('Database:', process.env.DB_NAME);
  console.log('Host:', process.env.DB_HOST);
  console.log('\n⚠️  WARNING: This will delete ALL data in the production database!\n');

  try {
    // Step 1: Drop all existing tables
    console.log('🗑️  Step 1: Dropping existing tables...');

    await pool.query(`DROP TABLE IF EXISTS orders CASCADE;`);
    console.log('   ✓ Dropped orders table');

    await pool.query(`DROP TABLE IF EXISTS products CASCADE;`);
    console.log('   ✓ Dropped products table');

    await pool.query(`DROP TABLE IF EXISTS vendors CASCADE;`);
    console.log('   ✓ Dropped vendors table');

    await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);
    console.log('   ✓ Dropped users table');

    // Step 2: Create Users table
    console.log('\n📋 Step 2: Creating users table...');
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        id_no VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✓ Users table created');

    // Step 3: Create Vendors table with updated schema
    console.log('\n📋 Step 3: Creating vendors table...');
    await pool.query(`
      CREATE TABLE vendors (
        id SERIAL PRIMARY KEY,
        vendor_connect_id VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        website_url VARCHAR(500),
        logo_url VARCHAR(500),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        state VARCHAR(100),
        territory VARCHAR(100),
        city VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✓ Vendors table created');

    // Step 4: Create Products table with full schema
    console.log('\n📋 Step 4: Creating products table...');
    await pool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        vendor_connect_id VARCHAR(100),
        vendor_name VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_description TEXT,
        main_category VARCHAR(255),
        sub_category VARCHAR(255),
        allergens TEXT,
        dietary_preferences TEXT,
        cuisine_type VARCHAR(100),
        seasonal_and_featured VARCHAR(100),
        size VARCHAR(100),
        case_pack INTEGER,
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
        case_minimum INTEGER,
        shelf_life VARCHAR(100),
        upc VARCHAR(50),
        state VARCHAR(100),
        delivery_info TEXT,
        notes TEXT,
        product_image VARCHAR(500),
        popular BOOLEAN DEFAULT false,
        seasonal BOOLEAN DEFAULT false,
        new BOOLEAN DEFAULT false,
        category VARCHAR(100),
        order_qty INTEGER DEFAULT 0,
        stock_level INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✓ Products table created');

    // Step 5: Create Orders table
    console.log('\n📋 Step 5: Creating orders table...');
    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        batch_order_number VARCHAR(50) NOT NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
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
    console.log('   ✓ Orders table created');

    // Step 6: Create indexes for better performance
    console.log('\n📋 Step 6: Creating indexes...');
    await pool.query(`
      CREATE INDEX idx_products_vendor ON products(vendor_name);
      CREATE INDEX idx_products_vendor_connect ON products(vendor_connect_id);
      CREATE INDEX idx_products_main_category ON products(main_category);
      CREATE INDEX idx_products_sub_category ON products(sub_category);
      CREATE INDEX idx_products_category ON products(category);
      CREATE INDEX idx_products_popular ON products(popular);
      CREATE INDEX idx_products_seasonal ON products(seasonal);
      CREATE INDEX idx_products_new ON products(new);
      CREATE INDEX idx_orders_batch ON orders(batch_order_number);
      CREATE INDEX idx_orders_user_email ON orders(user_email);
      CREATE INDEX idx_orders_status ON orders(status);
      CREATE INDEX idx_orders_date ON orders(date_submitted);
      CREATE INDEX idx_vendors_name ON vendors(name);
      CREATE INDEX idx_vendors_vendor_connect ON vendors(vendor_connect_id);
      CREATE INDEX idx_vendors_state ON vendors(state);
      CREATE INDEX idx_vendors_city ON vendors(city);
      CREATE INDEX idx_vendors_territory ON vendors(territory);
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
    `);
    console.log('   ✓ All indexes created');

    console.log('\n✅ Database reset completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - All old tables dropped');
    console.log('   - Users table created');
    console.log('   - Vendors table created with updated schema');
    console.log('   - Products table created with full field set');
    console.log('   - Orders table created');
    console.log('   - All indexes created');
    console.log('\n⚠️  Note: All data has been cleared. Tables are empty and ready for import.');

  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the migration
resetDatabase();
