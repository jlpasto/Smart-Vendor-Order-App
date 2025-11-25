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

async function testAdminProductsQuery() {
  try {
    // This is the same query the admin products page would run
    const result = await pool.query(`
      SELECT p.*, v.about as vendor_about, v.story as vendor_story, v.logo_url as vendor_logo, v.website_url as vendor_website
      FROM products p
      LEFT JOIN vendors v ON p.vendor_connect_id = v.vendor_connect_id
      WHERE 1=1
      ORDER BY p.vendor_name ASC, p.id ASC
    `);

    console.log(`✅ Query executed successfully`);
    console.log(`📦 Total products returned: ${result.rows.length}`);

    if (result.rows.length > 0) {
      console.log('\n📋 First 3 products:');
      result.rows.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_name} (ID: ${product.id}) - ${product.vendor_name}`);
      });
    } else {
      console.log('❌ No products found!');
    }

    // Also test what a buyer would see (with assigned_product_ids filter)
    const buyerResult = await pool.query(`
      SELECT assigned_product_ids FROM users WHERE email = 'ava@demo.com'
    `);

    console.log(`\n👤 Buyer (ava@demo.com) assigned products: ${JSON.stringify(buyerResult.rows[0]?.assigned_product_ids || [])}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testAdminProductsQuery();
