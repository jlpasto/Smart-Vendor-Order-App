import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wholesale_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('render') || process.env.DB_HOST?.includes('amazonaws') ? {
    rejectUnauthorized: false
  } : false
});

async function checkAdminRole() {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role FROM users WHERE email = $1`,
      ['admin@demo.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ Admin user found:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ No admin user found with email: admin@demo.com');
    }

    // Also count total products
    const productCount = await pool.query('SELECT COUNT(*) as total FROM products');
    console.log(`\n📦 Total products in database: ${productCount.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAdminRole();
