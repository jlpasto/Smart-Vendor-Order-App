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

let lastCheckTime = new Date();

async function monitorCartOperations() {
  try {
    console.clear();
    console.log('🔍 REAL-TIME CART MONITORING');
    console.log(`📡 Connected to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(80));

    // Get current cart items
    const cartResult = await pool.query(`
      SELECT
        id,
        user_email,
        product_name,
        vendor_name,
        quantity,
        amount,
        pricing_mode,
        status,
        cart_created_at,
        updated_at
      FROM orders
      WHERE status = 'in_cart'
      ORDER BY cart_created_at DESC
    `);

    console.log(`\n🛒 CURRENT CART ITEMS: ${cartResult.rows.length}`);

    if (cartResult.rows.length === 0) {
      console.log('\n📭 Cart is empty. Waiting for items to be added...');
    } else {
      console.log('');
      cartResult.rows.forEach((item, index) => {
        const createdTime = new Date(item.cart_created_at).toLocaleString();
        const updatedTime = new Date(item.updated_at).toLocaleString();
        console.log(`${index + 1}. ${item.product_name}`);
        console.log(`   User: ${item.user_email}`);
        console.log(`   Vendor: ${item.vendor_name}`);
        console.log(`   Quantity: ${item.quantity} (${item.pricing_mode})`);
        console.log(`   Amount: $${item.amount}`);
        console.log(`   Created: ${createdTime}`);
        console.log(`   Updated: ${updatedTime}`);
        console.log(`   ID: ${item.id}`);
        console.log('');
      });
    }

    // Get recent changes (items created or updated in last 10 seconds)
    const recentChanges = await pool.query(`
      SELECT
        id,
        user_email,
        product_name,
        quantity,
        status,
        cart_created_at,
        updated_at
      FROM orders
      WHERE status = 'in_cart'
        AND (cart_created_at > $1 OR updated_at > $1)
      ORDER BY GREATEST(cart_created_at, updated_at) DESC
    `, [lastCheckTime]);

    if (recentChanges.rows.length > 0) {
      console.log('🆕 RECENT CHANGES:');
      recentChanges.rows.forEach(item => {
        const isNew = new Date(item.cart_created_at) > lastCheckTime;
        const action = isNew ? '➕ ADDED' : '✏️  UPDATED';
        console.log(`${action}: ${item.product_name} (qty: ${item.quantity}) - ${item.user_email}`);
      });
      console.log('');
    }

    lastCheckTime = new Date();

    console.log('═'.repeat(80));
    console.log('\n💡 TIP: Add items to cart in the UI and watch them appear here!');
    console.log('⏱️  Refreshing every 3 seconds... (Press Ctrl+C to stop)');

  } catch (error) {
    console.error('\n❌ Error monitoring cart:', error);
  }
}

// Monitor every 3 seconds
console.log('Starting cart monitor...\n');
monitorCartOperations();
const intervalId = setInterval(monitorCartOperations, 3000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Stopping monitor...');
  clearInterval(intervalId);
  await pool.end();
  console.log('🔌 Database connection closed');
  console.log('👋 Goodbye!\n');
  process.exit(0);
});
