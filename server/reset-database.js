import { query } from './config/database.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const resetDatabase = async () => {
  try {
    console.log('⚠️  DATABASE RESET WARNING ⚠️');
    console.log('This will DROP all existing tables and recreate them.');
    console.log('ALL DATA WILL BE LOST!');
    console.log('');
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log('');

    const answer = await askQuestion('Type "RESET" to confirm (or anything else to cancel): ');

    if (answer.trim() !== 'RESET') {
      console.log('❌ Operation cancelled');
      rl.close();
      process.exit(0);
    }

    console.log('');
    console.log('🗑️  Dropping existing tables...');

    // Drop tables in correct order (foreign key dependencies)
    await query('DROP TABLE IF EXISTS orders CASCADE');
    console.log('  ✓ Dropped orders table');

    await query('DROP TABLE IF EXISTS products CASCADE');
    console.log('  ✓ Dropped products table');

    await query('DROP TABLE IF EXISTS vendors CASCADE');
    console.log('  ✓ Dropped vendors table');

    await query('DROP TABLE IF EXISTS users CASCADE');
    console.log('  ✓ Dropped users table');

    console.log('');
    console.log('🔨 Creating tables with updated schema...');

    // Create Users table
    await query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        id_no VARCHAR(100),
        role VARCHAR(20) DEFAULT 'buyer' CHECK (role IN ('buyer', 'admin')),
        assigned_vendor_ids INTEGER[] DEFAULT '{}',
        assigned_product_ids INTEGER[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Created users table');

    // Create Vendors table
    await query(`
      CREATE TABLE vendors (
        id SERIAL PRIMARY KEY,
        vendor_connect_id VARCHAR(100) UNIQUE,
        name VARCHAR(255) NOT NULL,
        state VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        territory VARCHAR(100),
        website_url VARCHAR(500),
        logo_url VARCHAR(500),
        description TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Created vendors table');

    // Create Products table
    await query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_products_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ Created products table');

    // Create Orders table
    await query(`
      CREATE TABLE orders (
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
      )
    `);
    console.log('  ✓ Created orders table');

    console.log('');
    console.log('📊 Creating indexes...');

    // Basic indexes
    await query(`
      CREATE INDEX idx_products_vendor ON products(vendor_name);
      CREATE INDEX idx_products_vendor_id ON products(vendor_id);
      CREATE INDEX idx_products_category ON products(category);
      CREATE INDEX idx_products_popular ON products(popular);
      CREATE INDEX idx_products_seasonal ON products(seasonal);
      CREATE INDEX idx_products_new ON products(new);
      CREATE INDEX idx_orders_batch ON orders(batch_order_number);
      CREATE INDEX idx_orders_user_email ON orders(user_email);
      CREATE INDEX idx_orders_status ON orders(status);
      CREATE INDEX idx_orders_date ON orders(date_submitted);
      CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
      CREATE INDEX idx_orders_vendor_name ON orders(vendor_name);
      CREATE INDEX idx_vendors_name ON vendors(name);
      CREATE INDEX idx_vendors_state ON vendors(state);
      CREATE INDEX idx_vendors_city ON vendors(city);
    `);
    console.log('  ✓ Created basic indexes');

    // Composite indexes for cursor pagination
    await query(`
      CREATE INDEX idx_products_vendor_name_id ON products(vendor_name, id);
      CREATE INDEX idx_products_name_id ON products(product_name, id);
      CREATE INDEX idx_products_case_price_id ON products(wholesale_case_price, id);
      CREATE INDEX idx_products_unit_price_id ON products(wholesale_unit_price, id);
      CREATE INDEX idx_products_retail_price_id ON products(retail_unit_price, id);
      CREATE INDEX idx_products_gm_id ON products(gm_percent, id);
    `);
    console.log('  ✓ Created cursor pagination indexes');

    // GIN indexes for array columns
    await query(`
      CREATE INDEX idx_users_assigned_vendor_ids ON users USING GIN(assigned_vendor_ids);
      CREATE INDEX idx_users_assigned_product_ids ON users USING GIN(assigned_product_ids);
    `);
    console.log('  ✓ Created GIN indexes for assignments');

    console.log('');
    console.log('👤 Creating admin user...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
      ['admin@wholesalehub.com', hashedPassword, 'admin']
    );
    console.log('  ✓ Admin user created: admin@wholesalehub.com / admin123');

    console.log('');
    console.log('✅ Database reset completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  - Run "npm run seed" to add sample data (optional)');
    console.log('  - Or import your vendors and products via the admin panel');
    console.log('');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error resetting database:', error);
    console.error('');
    rl.close();
    process.exit(1);
  }
};

console.log('');
resetDatabase();
