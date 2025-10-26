import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wholesale_app',
  password: 'postgres1234',
  port: 5432,
});

async function migrateVendors() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Starting vendor table migration...\n');

    // Add new columns
    console.log('➕ Adding vendor_connect_id column...');
    await client.query(`
      ALTER TABLE vendors
      ADD COLUMN IF NOT EXISTS vendor_connect_id VARCHAR(50);
    `);

    console.log('➕ Adding address column...');
    await client.query(`
      ALTER TABLE vendors
      ADD COLUMN IF NOT EXISTS address TEXT;
    `);

    console.log('➕ Adding territory column...');
    await client.query(`
      ALTER TABLE vendors
      ADD COLUMN IF NOT EXISTS territory VARCHAR(100);
    `);

    // Drop columns that are not in the new schema
    console.log('➖ Dropping city column...');
    await client.query(`
      ALTER TABLE vendors
      DROP COLUMN IF EXISTS city;
    `);

    console.log('➖ Dropping description column...');
    await client.query(`
      ALTER TABLE vendors
      DROP COLUMN IF EXISTS description;
    `);

    await client.query('COMMIT');

    console.log('\n✅ Vendor table migration completed successfully!');
    console.log('\n📊 New vendor schema:');
    console.log('   - id');
    console.log('   - vendor_connect_id (NEW)');
    console.log('   - name');
    console.log('   - website_url');
    console.log('   - logo_url');
    console.log('   - phone');
    console.log('   - email');
    console.log('   - address (NEW)');
    console.log('   - state');
    console.log('   - territory (NEW)');
    console.log('   - created_at');
    console.log('   - updated_at');

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrateVendors();
