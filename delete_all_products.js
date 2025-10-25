import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wholesale_app',
  password: 'postgres1234',
  port: 5432,
});

async function deleteAllProducts() {
  try {
    const result = await pool.query('DELETE FROM products');
    console.log(`✅ Successfully deleted ${result.rowCount} products from the database.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting products:', error);
    process.exit(1);
  }
}

deleteAllProducts();
