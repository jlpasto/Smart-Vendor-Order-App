import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wholesale_app',
  password: 'postgres1234',
  port: 5432,
});

async function checkProducts() {
  try {
    const result = await pool.query('SELECT id, product_name, product_image FROM products LIMIT 5');
    console.log('\n📦 Products in database:');
    console.log('='.repeat(80));
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Name: ${row.product_name}`);
      console.log(`Image: ${row.product_image || 'NULL'}`);
      console.log('-'.repeat(80));
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProducts();
