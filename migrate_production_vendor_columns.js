import pg from 'pg';

const { Pool } = pg;

// Production database credentials (hardcoded for this migration)
const pool = new Pool({
  host: 'dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com',
  port: 5432,
  database: 'wholesale_app_4csh',
  user: 'wholesale_app_4csh_user',
  password: 'lrmooKVMVwidUWaMYBNni3daraps5upq',
  ssl: {
    rejectUnauthorized: false
  }
});

const migrateProduction = async () => {
  console.log('🔄 Running production migration: Add vendor columns to orders...\n');
  console.log('Database: wholesale_app_4csh');
  console.log('Host: dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com');
  console.log('\n⚠️  WARNING: This will modify the PRODUCTION database!\n');

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

    // Step 5: Backfill vendor data
    console.log('\n📋 Step 5: Backfilling vendor data...');

    // Update vendor_name from products
    const nameUpdateResult = await pool.query(`
      UPDATE orders o
      SET vendor_name = p.vendor_name
      FROM products p
      WHERE o.product_id = p.id
      AND o.vendor_name IS NULL
      AND p.vendor_name IS NOT NULL
    `);
    console.log(`   ✓ Updated vendor_name for ${nameUpdateResult.rowCount} orders`);

    // Update vendor_id from vendors table
    const idUpdateResult = await pool.query(`
      UPDATE orders o
      SET vendor_id = v.id
      FROM vendors v
      WHERE LOWER(o.vendor_name) = LOWER(v.name)
      AND o.vendor_id IS NULL
      AND o.vendor_name IS NOT NULL
    `);
    console.log(`   ✓ Updated vendor_id for ${idUpdateResult.rowCount} orders`);

    // Step 6: Final verification
    console.log('\n📋 Step 6: Verifying results...');
    const finalCheck = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(vendor_name) as orders_with_name,
        COUNT(vendor_id) as orders_with_id,
        COUNT(CASE WHEN vendor_name IS NULL THEN 1 END) as missing_name,
        COUNT(CASE WHEN vendor_id IS NULL THEN 1 END) as missing_id
      FROM orders
    `);

    const stats = finalCheck.rows[0];
    console.log(`   Total orders: ${stats.total_orders}`);
    console.log(`   Orders with vendor_name: ${stats.orders_with_name}`);
    console.log(`   Orders with vendor_id: ${stats.orders_with_id}`);

    console.log('\n✅ Production migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Added vendor_id column (INTEGER, FK to vendors)');
    console.log('   - Added vendor_name column (VARCHAR(255))');
    console.log('   - Created indexes for both columns');
    console.log(`   - Backfilled ${nameUpdateResult.rowCount} orders with vendor_name`);
    console.log(`   - Backfilled ${idUpdateResult.rowCount} orders with vendor_id`);

    if (stats.missing_name > 0 || stats.missing_id > 0) {
      console.log('\n⚠️  Note:');
      if (stats.missing_name > 0) {
        console.log(`   - ${stats.missing_name} orders missing vendor_name (product may be deleted)`);
      }
      if (stats.missing_id > 0) {
        console.log(`   - ${stats.missing_id} orders missing vendor_id (vendor not in vendors table)`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error running production migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the migration
migrateProduction();
