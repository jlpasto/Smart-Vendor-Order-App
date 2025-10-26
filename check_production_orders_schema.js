import pg from 'pg';

const { Pool } = pg;

// Production database credentials
const pool = new Pool({
  host: 'dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com',
  port: 5432,
  database: 'wholesale_app_4csh',
  user: 'wholesale_app_4csh_user',
  password: 'lrmooKVMVwidUWaMYBNni3daraps5upq',
  ssl: {
    rejectUnauthorized: false
  }
});

const checkSchema = async () => {
  console.log('🔍 Checking production orders table schema...\n');

  try {
    // Get all columns for orders table
    const columnsResult = await pool.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);

    console.log('📋 Orders table columns in PRODUCTION:\n');
    console.log('Column Name                  | Data Type              | Nullable | Default');
    console.log('----------------------------|------------------------|----------|------------------');
    columnsResult.rows.forEach(col => {
      const name = col.column_name.padEnd(27);
      const type = col.data_type.padEnd(22);
      const nullable = col.is_nullable.padEnd(8);
      const defaultVal = (col.column_default || 'NULL').substring(0, 16);
      console.log(`${name} | ${type} | ${nullable} | ${defaultVal}`);
    });

    // Check for specific required columns
    console.log('\n\n✅ Checking for required columns:\n');
    const requiredColumns = [
      'id', 'batch_order_number', 'product_id', 'product_name',
      'vendor_id', 'vendor_name', 'quantity', 'amount',
      'status', 'user_email', 'user_id', 'date_submitted'
    ];

    const existingColumns = columnsResult.rows.map(r => r.column_name);

    requiredColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`   ${exists ? '✓' : '✗'} ${col}${exists ? '' : ' - MISSING!'}`);
    });

    // Check foreign keys
    console.log('\n\n🔗 Foreign key constraints:\n');
    const fkResult = await pool.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'orders'
      AND tc.constraint_type = 'FOREIGN KEY'
    `);

    if (fkResult.rows.length > 0) {
      fkResult.rows.forEach(fk => {
        console.log(`   ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
        console.log(`   On Delete: ${fk.delete_rule}`);
      });
    } else {
      console.log('   ⚠️  No foreign key constraints found');
    }

    // Check indexes
    console.log('\n\n📑 Indexes:\n');
    const indexResult = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'orders'
      ORDER BY indexname
    `);

    if (indexResult.rows.length > 0) {
      indexResult.rows.forEach(idx => {
        console.log(`   ${idx.indexname}`);
      });
    } else {
      console.log('   ⚠️  No indexes found');
    }

    // Sample data check
    console.log('\n\n📊 Sample data:\n');
    const sampleResult = await pool.query(`
      SELECT COUNT(*) as total_orders
      FROM orders
    `);
    console.log(`   Total orders: ${sampleResult.rows[0].total_orders}`);

    console.log('\n✅ Schema check complete!');

  } catch (error) {
    console.error('\n❌ Error checking schema:', error);
    console.error('Error details:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

checkSchema();
