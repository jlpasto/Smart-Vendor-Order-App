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

const backfillVendorData = async () => {
  console.log('🔄 Backfilling vendor data in orders table...\n');
  console.log('Database:', process.env.DB_NAME);
  console.log('Host:', process.env.DB_HOST);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('\n');

  try {
    // Step 1: Check how many orders need backfilling
    console.log('📋 Step 1: Checking orders without vendor data...');
    const checkResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE vendor_name IS NULL OR vendor_id IS NULL
    `);

    const ordersToUpdate = parseInt(checkResult.rows[0].count);
    console.log(`   Found ${ordersToUpdate} orders without vendor data`);

    if (ordersToUpdate === 0) {
      console.log('   ✅ All orders already have vendor data!');
      return;
    }

    // Step 2: Update vendor_name from products table
    console.log('\n📋 Step 2: Updating vendor_name from products...');
    const nameUpdateResult = await pool.query(`
      UPDATE orders o
      SET vendor_name = p.vendor_name
      FROM products p
      WHERE o.product_id = p.id
      AND o.vendor_name IS NULL
      AND p.vendor_name IS NOT NULL
    `);
    console.log(`   ✓ Updated vendor_name for ${nameUpdateResult.rowCount} orders`);

    // Step 3: Update vendor_id from vendors table
    console.log('\n📋 Step 3: Updating vendor_id from vendors table...');
    const idUpdateResult = await pool.query(`
      UPDATE orders o
      SET vendor_id = v.id
      FROM vendors v
      WHERE LOWER(o.vendor_name) = LOWER(v.name)
      AND o.vendor_id IS NULL
      AND o.vendor_name IS NOT NULL
    `);
    console.log(`   ✓ Updated vendor_id for ${idUpdateResult.rowCount} orders`);

    // Step 4: Check final status
    console.log('\n📋 Step 4: Verifying results...');
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
    console.log(`   Missing vendor_name: ${stats.missing_name}`);
    console.log(`   Missing vendor_id: ${stats.missing_id}`);

    console.log('\n✅ Backfill completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${nameUpdateResult.rowCount} orders got vendor_name from products`);
    console.log(`   - ${idUpdateResult.rowCount} orders got vendor_id from vendors table`);

    if (stats.missing_name > 0 || stats.missing_id > 0) {
      console.log('\n⚠️  Note:');
      if (stats.missing_name > 0) {
        console.log(`   - ${stats.missing_name} orders still missing vendor_name (product may be deleted)`);
      }
      if (stats.missing_id > 0) {
        console.log(`   - ${stats.missing_id} orders missing vendor_id (vendor not in vendors table)`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error backfilling vendor data:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the backfill
backfillVendorData();
