import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create a new pool for the database
const pool = new Pool({
  host: process.env.DB_HOST + (process.env.NODE_ENV === 'production' ? '.oregon-postgres.render.com' : ''),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

const addVendorColumns = async () => {
  console.log('🔄 Adding vendor columns to orders table...\n');
  console.log('Database:', process.env.DB_NAME);
  console.log('Host:', process.env.DB_HOST);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('\n');

  try {
    // Step 1: Check if columns already exist
    console.log('📋 Step 1: Checking if vendor columns exist...');
    const checkColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name IN ('vendor_id', 'vendor_name')
    `);

    if (checkColumns.rows.length > 0) {
      console.log('   ⚠️  Vendor columns already exist. Skipping migration.');
      const existingColumns = checkColumns.rows.map(r => r.column_name).join(', ');
      console.log(`   Found: ${existingColumns}`);
      return;
    }

    // Step 2: Add vendor_id column
    console.log('\n📋 Step 2: Adding vendor_id column...');
    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL;
    `);
    console.log('   ✓ vendor_id column added');

    // Step 3: Add vendor_name column
    console.log('\n📋 Step 3: Adding vendor_name column...');
    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN vendor_name VARCHAR(255);
    `);
    console.log('   ✓ vendor_name column added');

    // Step 4: Create indexes
    console.log('\n📋 Step 4: Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
    `);
    console.log('   ✓ Index on vendor_id created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_vendor_name ON orders(vendor_name);
    `);
    console.log('   ✓ Index on vendor_name created');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Added vendor_id column (INTEGER, FK to vendors)');
    console.log('   - Added vendor_name column (VARCHAR(255))');
    console.log('   - Created indexes for both columns');
    console.log('\n⚠️  Note: Existing orders will have NULL vendor values.');
    console.log('   Run backfill_vendor_in_orders.js to populate vendor data.');

  } catch (error) {
    console.error('\n❌ Error adding vendor columns:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the migration
addVendorColumns();
