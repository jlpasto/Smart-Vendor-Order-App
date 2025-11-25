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

async function clearAvaProducts() {
  try {
    const result = await pool.query(
      `UPDATE users
       SET assigned_product_ids = $1
       WHERE email = $2
       RETURNING id, email, name, assigned_product_ids`,
      [[], 'ava@demo.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ Successfully cleared product assignments for ava@demo.com');
      console.log('Updated user:', result.rows[0]);
    } else {
      console.log('❌ No user found with email: ava@demo.com');
    }
  } catch (error) {
    console.error('❌ Error clearing product assignments:', error);
  } finally {
    await pool.end();
  }
}

clearAvaProducts();
