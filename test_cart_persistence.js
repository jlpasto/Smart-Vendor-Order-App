import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool using environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testCartPersistence() {
  try {
    console.log('🧪 Testing Cart Persistence');
    console.log(`📡 Connected to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    console.log('═'.repeat(80));

    // Test 1: Check if orders table has cart_created_at column
    console.log('\n1️⃣  Checking orders table structure...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Orders table columns:');
    columnsResult.rows.forEach(col => {
      const required = col.is_nullable === 'NO' ? '(required)' : '(optional)';
      console.log(`   - ${col.column_name}: ${col.data_type} ${required}`);
    });

    const hasCartCreatedAt = columnsResult.rows.some(col => col.column_name === 'cart_created_at');
    const hasProductId = columnsResult.rows.some(col => col.column_name === 'product_id');

    if (!hasCartCreatedAt) {
      console.log('\n❌ ISSUE: cart_created_at column is missing!');
      console.log('   This column is needed for cart persistence.');
    } else {
      console.log('\n✅ cart_created_at column exists');
    }

    if (!hasProductId) {
      console.log('\n❌ ISSUE: product_id column is missing!');
      console.log('   This column is needed to identify products in cart.');
    } else {
      console.log('\n✅ product_id column exists');
    }

    // Test 2: Check current cart items
    console.log('\n2️⃣  Checking current cart items (status = in_cart)...');
    const cartItemsResult = await pool.query(`
      SELECT
        id,
        user_id,
        user_email,
        product_id,
        product_name,
        vendor_name,
        quantity,
        amount,
        pricing_mode,
        status,
        cart_created_at,
        date_submitted,
        batch_order_number
      FROM orders
      WHERE status = 'in_cart'
      ORDER BY cart_created_at DESC
    `);

    if (cartItemsResult.rows.length === 0) {
      console.log('\n📭 No cart items found in database');
      console.log('   This is expected if no one has added items to cart yet.');
    } else {
      console.log(`\n🛒 Found ${cartItemsResult.rows.length} cart items:`);
      cartItemsResult.rows.forEach((item, index) => {
        console.log(`\n   Item ${index + 1}:`);
        console.log(`   - ID: ${item.id}`);
        console.log(`   - User: ${item.user_email} (ID: ${item.user_id})`);
        console.log(`   - Product: ${item.product_name} (ID: ${item.product_id})`);
        console.log(`   - Vendor: ${item.vendor_name}`);
        console.log(`   - Quantity: ${item.quantity} (${item.pricing_mode})`);
        console.log(`   - Amount: $${item.amount}`);
        console.log(`   - Created: ${item.cart_created_at}`);
        console.log(`   - Status: ${item.status}`);
        console.log(`   - Batch Number: ${item.batch_order_number || 'NULL (correct for cart)'}`);
      });
    }

    // Test 3: Check for any 'ongoing' status items that should be 'in_cart'
    console.log('\n3️⃣  Checking for old "ongoing" status items...');
    const ongoingResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status = 'ongoing'
    `);

    if (parseInt(ongoingResult.rows[0].count) > 0) {
      console.log(`\n⚠️  WARNING: Found ${ongoingResult.rows[0].count} items with status 'ongoing'`);
      console.log('   These should be updated to "in_cart"');
    } else {
      console.log('\n✅ No items with old "ongoing" status');
    }

    // Test 4: Check users table
    console.log('\n4️⃣  Checking users in database...');
    const usersResult = await pool.query(`
      SELECT id, email, name, role
      FROM users
      ORDER BY id
    `);

    console.log(`\n👥 Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id}, Role: ${user.role})`);
    });

    // Test 5: Check if batch_order_number is nullable for cart items
    console.log('\n5️⃣  Checking batch_order_number constraint...');
    const constraintResult = await pool.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name = 'batch_order_number'
    `);

    if (constraintResult.rows[0].is_nullable === 'YES') {
      console.log('\n✅ batch_order_number is nullable (correct for cart items)');
    } else {
      console.log('\n❌ ISSUE: batch_order_number is NOT nullable');
      console.log('   Cart items need NULL batch_order_number before submission');
    }

    // Test 6: Summary and recommendations
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 SUMMARY:');

    const issues = [];
    const warnings = [];

    if (!hasCartCreatedAt) {
      issues.push('Missing cart_created_at column');
    }
    if (!hasProductId) {
      issues.push('Missing product_id column');
    }
    if (constraintResult.rows[0].is_nullable === 'NO') {
      issues.push('batch_order_number should be nullable for cart items');
    }
    if (parseInt(ongoingResult.rows[0].count) > 0) {
      warnings.push(`${ongoingResult.rows[0].count} items still have 'ongoing' status`);
    }

    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('\n✅ All checks passed! Cart persistence should work correctly.');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Add an item to cart in the UI');
    console.log('   2. Check the server console logs for "💾 Inserting new cart item"');
    console.log('   3. Run this script again to verify the item was saved');
    console.log('   4. Refresh the page and check if items persist');

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testCartPersistence()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
