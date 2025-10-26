import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wholesale_app',
  password: 'postgres1234',
  port: 5432,
});

async function checkVendorLogos() {
  try {
    const result = await pool.query('SELECT id, name, logo_url FROM vendors LIMIT 10');

    console.log('\n📊 Vendors in database:');
    console.log('='.repeat(100));

    if (result.rows.length === 0) {
      console.log('❌ No vendors found in database');
    } else {
      result.rows.forEach(row => {
        console.log(`\nID: ${row.id}`);
        console.log(`Name: ${row.name}`);
        console.log(`Logo URL: ${row.logo_url || 'NULL/EMPTY'}`);
        console.log('-'.repeat(100));
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkVendorLogos();
