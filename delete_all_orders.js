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

async function deleteAllOrders() {
  try {
    console.log('🗑️  Starting to delete all orders from the database...');
    console.log(`📡 Connecting to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);

    // Delete in correct order due to foreign key constraints
    console.log('\n1️⃣  Deleting order snapshots...');
    const snapshotsResult = await pool.query('DELETE FROM order_snapshots RETURNING id');
    console.log(`   ✓ Deleted ${snapshotsResult.rowCount} order snapshots`);

    console.log('\n2️⃣  Deleting order history...');
    const historyResult = await pool.query('DELETE FROM order_history RETURNING id');
    console.log(`   ✓ Deleted ${historyResult.rowCount} history records`);

    console.log('\n3️⃣  Deleting all orders...');
    const ordersResult = await pool.query('DELETE FROM orders RETURNING id');
    console.log(`   ✓ Deleted ${ordersResult.rowCount} orders`);

    console.log('\n✅ All orders successfully deleted!');
    console.log('\n📊 Summary:');
    console.log(`   - Orders: ${ordersResult.rowCount}`);
    console.log(`   - History records: ${historyResult.rowCount}`);
    console.log(`   - Snapshots: ${snapshotsResult.rowCount}`);
    console.log(`   - Total records deleted: ${ordersResult.rowCount + historyResult.rowCount + snapshotsResult.rowCount}`);

  } catch (error) {
    console.error('\n❌ Error deleting orders:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the deletion
deleteAllOrders()
  .then(() => {
    console.log('\n✨ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Operation failed:', error.message);
    process.exit(1);
  });
