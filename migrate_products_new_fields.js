import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wholesale_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  try {
    console.log('Adding new columns to products table...');

    // Add product_connect_id - unique numeric identifier for product
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS product_connect_id INTEGER;
    `);
    console.log('✅ Added product_connect_id column');

    // Add vendor_connect_id
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_connect_id VARCHAR(50);
    `);
    console.log('✅ Added vendor_connect_id column');

    // Add main_category
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS main_category VARCHAR(100);
    `);
    console.log('✅ Added main_category column');

    // Add sub_category
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);
    `);
    console.log('✅ Added sub_category column');

    // Add allergens
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens TEXT;
    `);
    console.log('✅ Added allergens column');

    // Add dietary_preferences
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_preferences TEXT;
    `);
    console.log('✅ Added dietary_preferences column');

    // Add cuisine_type
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(100);
    `);
    console.log('✅ Added cuisine_type column');

    // Add seasonal_and_featured (replacing seasonal boolean)
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seasonal_and_featured VARCHAR(50);
    `);
    console.log('✅ Added seasonal_and_featured column');

    // Add case_minimum
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS case_minimum INTEGER;
    `);
    console.log('✅ Added case_minimum column');

    // Add shelf_life
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life VARCHAR(255);
    `);
    console.log('✅ Added shelf_life column');

    // Add delivery_info
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_info TEXT;
    `);
    console.log('✅ Added delivery_info column');

    // Add notes
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    console.log('✅ Added notes column');

    // Rename product_description to notes if needed
    // (keeping product_description as well for backward compatibility)

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew columns added:');
    console.log('- product_connect_id (INTEGER)');
    console.log('- vendor_connect_id (VARCHAR)');
    console.log('- main_category (VARCHAR)');
    console.log('- sub_category (VARCHAR)');
    console.log('- allergens (TEXT)');
    console.log('- dietary_preferences (TEXT)');
    console.log('- cuisine_type (VARCHAR)');
    console.log('- seasonal_and_featured (VARCHAR)');
    console.log('- case_minimum (INTEGER)');
    console.log('- shelf_life (VARCHAR)');
    console.log('- delivery_info (TEXT)');
    console.log('- notes (TEXT)');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
