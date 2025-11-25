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

async function migrate() {
  try {
    console.log('🔄 Starting migration: Rename app_id to product_connect_id...\n');

    // Check if app_id column exists
    const checkAppId = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name='products' AND column_name='app_id';
    `);

    // Check if product_connect_id already exists
    const checkProductConnectId = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name='products' AND column_name='product_connect_id';
    `);

    if (checkProductConnectId.rows.length > 0) {
      console.log('✅ product_connect_id column already exists');
      console.log(`   Current data type: ${checkProductConnectId.rows[0].data_type}`);

      // Check if we need to change the data type to INTEGER
      if (checkProductConnectId.rows[0].data_type !== 'integer') {
        console.log('🔄 Converting product_connect_id to INTEGER data type...');
        await pool.query(`
          ALTER TABLE products
          ALTER COLUMN product_connect_id TYPE INTEGER USING product_connect_id::INTEGER;
        `);
        console.log('✅ Data type converted to INTEGER');
      }
    } else if (checkAppId.rows.length > 0) {
      console.log('📋 Found app_id column with data type:', checkAppId.rows[0].data_type);

      // Rename app_id to product_connect_id
      console.log('🔄 Renaming app_id to product_connect_id...');
      await pool.query(`
        ALTER TABLE products RENAME COLUMN app_id TO product_connect_id;
      `);
      console.log('✅ Column renamed successfully');

      // Convert data type to INTEGER if it's not already
      if (checkAppId.rows[0].data_type !== 'integer') {
        console.log('🔄 Converting product_connect_id to INTEGER data type...');
        await pool.query(`
          ALTER TABLE products
          ALTER COLUMN product_connect_id TYPE INTEGER USING product_connect_id::INTEGER;
        `);
        console.log('✅ Data type converted to INTEGER');
      }
    } else {
      // Neither column exists, create product_connect_id
      console.log('📋 Neither app_id nor product_connect_id exists');
      console.log('🔄 Creating product_connect_id column...');
      await pool.query(`
        ALTER TABLE products ADD COLUMN product_connect_id INTEGER;
      `);
      console.log('✅ product_connect_id column created as INTEGER');
    }

    // Create index for performance
    console.log('🔄 Creating index on product_connect_id...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_product_connect_id ON products(product_connect_id);
    `);
    console.log('✅ Index created successfully');

    // Display final column info
    const finalCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name='products' AND column_name='product_connect_id';
    `);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Final column details:');
    console.log(`   Column: ${finalCheck.rows[0].column_name}`);
    console.log(`   Data Type: ${finalCheck.rows[0].data_type}`);
    console.log(`   Nullable: ${finalCheck.rows[0].is_nullable}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

migrate();
