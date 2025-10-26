import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wholesale_app',
  password: 'postgres1234',
  port: 5432,
});

async function checkVendorSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'vendors'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Current Vendor Table Schema:');
    console.log('='.repeat(80));
    result.rows.forEach(row => {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      console.log(`${row.column_name}: ${row.data_type}${length}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkVendorSchema();
