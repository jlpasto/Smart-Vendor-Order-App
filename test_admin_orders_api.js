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

async function testAdminOrdersAPI() {
  try {
    console.log('🧪 TESTING ADMIN ORDERS API');
    console.log(`📡 Connected to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    console.log('═'.repeat(80));

    // Test 1: Simulate the /api/orders/all endpoint with NO status filter
    console.log('\n1️⃣  Testing /api/orders/all with NO status filter (default behavior)');
    console.log('   This simulates: GET /api/orders/all');

    const allOrdersQuery = `
      SELECT o.*, p.category, u.name as user_name
      FROM orders o
      LEFT JOIN products p ON o.product_connect_id = p.product_connect_id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
        AND o.status != 'in_cart'
      ORDER BY o.date_submitted DESC
    `;

    const allOrdersResult = await pool.query(allOrdersQuery);
    console.log(`   📦 Result: ${allOrdersResult.rows.length} orders`);

    if (allOrdersResult.rows.length > 0) {
      console.log('\n   Sample orders:');
      allOrdersResult.rows.slice(0, 3).forEach((order, i) => {
        console.log(`   ${i + 1}. ${order.product_name} - Status: ${order.status}`);
      });
    } else {
      console.log('   ℹ️  No orders found (cart items are excluded by default)');
    }

    // Test 2: Simulate the /api/orders/all endpoint WITH status=in_cart filter
    console.log('\n2️⃣  Testing /api/orders/all with status=in_cart filter');
    console.log('   This simulates: GET /api/orders/all?status=in_cart');

    const cartOrdersQuery = `
      SELECT o.*, p.category, u.name as user_name
      FROM orders o
      LEFT JOIN products p ON o.product_connect_id = p.product_connect_id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
        AND o.status = 'in_cart'
      ORDER BY o.cart_created_at DESC
    `;

    const cartOrdersResult = await pool.query(cartOrdersQuery);
    console.log(`   🛒 Result: ${cartOrdersResult.rows.length} cart items`);

    if (cartOrdersResult.rows.length > 0) {
      console.log('\n   Cart items found:');
      cartOrdersResult.rows.forEach((order, i) => {
        console.log(`\n   ${i + 1}. ${order.product_name}`);
        console.log(`      User: ${order.user_email} (Name: ${order.user_name})`);
        console.log(`      Vendor: ${order.vendor_name}`);
        console.log(`      Quantity: ${order.quantity} (${order.pricing_mode})`);
        console.log(`      Amount: $${order.amount}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Batch: ${order.batch_order_number || 'NULL (correct)'}`);
        console.log(`      Created: ${order.cart_created_at}`);
      });
    } else {
      console.log('   ℹ️  No cart items found');
    }

    // Test 3: Check all statuses in database
    console.log('\n3️⃣  Checking all order statuses in database');
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n   📊 Orders by status:');
    statusResult.rows.forEach(row => {
      console.log(`      ${row.status}: ${row.count} orders`);
    });

    // Test 4: Check if batch_order_number affects grouping
    console.log('\n4️⃣  Checking batch_order_number for cart items');
    const batchCheck = await pool.query(`
      SELECT
        id,
        user_email,
        product_name,
        batch_order_number,
        status
      FROM orders
      WHERE status = 'in_cart'
      ORDER BY id
    `);

    if (batchCheck.rows.length > 0) {
      console.log('\n   📦 Cart items batch_order_number values:');
      batchCheck.rows.forEach(row => {
        const batchDisplay = row.batch_order_number ? row.batch_order_number : 'NULL ✓';
        console.log(`      ${row.user_email} - ${row.product_name}: ${batchDisplay}`);
      });
    }

    // Test 5: Expected grouping key
    console.log('\n5️⃣  Expected grouping for frontend');
    if (batchCheck.rows.length > 0) {
      const sampleCart = batchCheck.rows[0];
      const groupKey = sampleCart.batch_order_number || `CART-${sampleCart.user_email}`;
      console.log(`\n   Sample cart item will be grouped as: "${groupKey}"`);
      console.log(`   Display name will be: "${sampleCart.user_name || sampleCart.user_email.split('@')[0]}'s Cart"`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 SUMMARY:');
    console.log(`   - Total orders (excluding cart): ${allOrdersResult.rows.length}`);
    console.log(`   - Cart items (in_cart status): ${cartOrdersResult.rows.length}`);

    if (cartOrdersResult.rows.length === 0) {
      console.log('\n⚠️  NO CART ITEMS FOUND!');
      console.log('   Possible reasons:');
      console.log('   1. No items have been added to cart yet');
      console.log('   2. Items were added but cleared');
      console.log('   3. Run: node simulate_add_to_cart.js to add a test item');
    } else {
      console.log('\n✅ Cart items found! They should appear in Admin Manage Orders');
      console.log('   when you select "In Cart" from the status dropdown.');
    }

  } catch (error) {
    console.error('\n❌ Error testing API:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed\n');
  }
}

// Run the test
testAdminOrdersAPI()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
