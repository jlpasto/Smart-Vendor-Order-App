import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wholesale_app',
  password: 'postgres1234',
  port: 5432,
});

async function deleteAllVendors() {
  try {
    const result = await pool.query('DELETE FROM vendors');
    console.log(`✅ Successfully deleted ${result.rowCount} vendors from the database.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting vendors:', error);
    process.exit(1);
  }
}

deleteAllVendors();
