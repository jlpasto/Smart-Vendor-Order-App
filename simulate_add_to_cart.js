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

async function simulateAddToCart() {
  try {
    console.log('🧪 SIMULATING ADD TO CART');
    console.log(`📡 Connected to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    console.log('═'.repeat(80));

    // Get a test user
    const userResult = await pool.query(`
      SELECT id, email, name
      FROM users
      WHERE role = 'buyer'
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('\n❌ No buyer users found in database!');
      console.log('   Please create a buyer user first.');
      return;
    }

    const testUser = userResult.rows[0];
    console.log(`\n👤 Using test user: ${testUser.email} (ID: ${testUser.id})`);

    // Get a test product
    const productResult = await pool.query(`
      SELECT id, product_connect_id, product_name, vendor_name, wholesale_case_price, wholesale_unit_price
      FROM products
      LIMIT 1
    `);

    if (productResult.rows.length === 0) {
      console.log('\n❌ No products found in database!');
      console.log('   Please add products first.');
      return;
    }

    const testProduct = productResult.rows[0];
    console.log(`\n📦 Using test product: ${testProduct.product_name}`);
    console.log(`   Vendor: ${testProduct.vendor_name}`);
    console.log(`   Case Price: $${testProduct.wholesale_case_price}`);
    console.log(`   Unit Price: $${testProduct.wholesale_unit_price}`);

    // Simulate adding to cart
    console.log('\n💾 Inserting cart item...');

    const quantity = 2;
    const pricingMode = 'case';
    const price = pricingMode === 'unit' ? testProduct.wholesale_unit_price : testProduct.wholesale_case_price;
    const amount = parseFloat((price * quantity).toFixed(2));

    const insertResult = await pool.query(
      `INSERT INTO orders (
        user_id, user_email, product_id, product_name, vendor_name,
        quantity, amount, pricing_mode, unit_price, case_price,
        status, cart_created_at,
        product_connect_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'in_cart', CURRENT_TIMESTAMP, $11)
      RETURNING *`,
      [
        testUser.id,
        testUser.email,
        testProduct.id,
        testProduct.product_name,
        testProduct.vendor_name,
        quantity,
        amount,
        pricingMode,
        testProduct.wholesale_unit_price,
        testProduct.wholesale_case_price,
        testProduct.product_connect_id
      ]
    );

    const cartItem = insertResult.rows[0];

    console.log('\n✅ Cart item created successfully!');
    console.log('\n📋 Cart Item Details:');
    console.log(`   ID: ${cartItem.id}`);
    console.log(`   User: ${cartItem.user_email}`);
    console.log(`   Product: ${cartItem.product_name}`);
    console.log(`   Vendor: ${cartItem.vendor_name}`);
    console.log(`   Quantity: ${cartItem.quantity} (${cartItem.pricing_mode})`);
    console.log(`   Amount: $${cartItem.amount}`);
    console.log(`   Status: ${cartItem.status}`);
    console.log(`   Created At: ${cartItem.cart_created_at}`);
    console.log(`   Batch Number: ${cartItem.batch_order_number || 'NULL (correct for cart)'}`);

    // Verify it was saved
    console.log('\n🔍 Verifying cart item was saved...');
    const verifyResult = await pool.query(`
      SELECT * FROM orders
      WHERE id = $1 AND status = 'in_cart'
    `, [cartItem.id]);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Verified: Cart item exists in database');
    } else {
      console.log('❌ ERROR: Cart item not found in database!');
    }

    // Check all cart items for this user
    console.log(`\n🛒 All cart items for ${testUser.email}:`);
    const allCartResult = await pool.query(`
      SELECT id, product_name, quantity, amount, cart_created_at
      FROM orders
      WHERE user_id = $1 AND status = 'in_cart'
      ORDER BY cart_created_at DESC
    `, [testUser.id]);

    allCartResult.rows.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.product_name} (qty: ${item.quantity}, $${item.amount})`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n✨ Simulation completed successfully!');
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Login as:', testUser.email);
    console.log('   2. Check your cart - you should see the item we just added');
    console.log('   3. Try adding more items through the UI');
    console.log('   4. Refresh the page to verify items persist');

  } catch (error) {
    console.error('\n❌ Error simulating add to cart:', error);
    console.error('Details:', error.message);
    throw error;
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed\n');
  }
}

// Run the simulation
simulateAddToCart()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Simulation failed');
    process.exit(1);
  });
