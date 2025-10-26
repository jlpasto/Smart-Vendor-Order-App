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

const verifySchema = async () => {
  console.log('🔍 Verifying production orders table schema...\n');

  try {
    // Get column information
    const columnsResult = await pool.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name IN ('vendor_id', 'vendor_name')
      ORDER BY ordinal_position
    `);

    console.log('📋 Vendor columns in orders table:');
    columnsResult.rows.forEach(col => {
      console.log(`\n   Column: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log(`   Default: ${col.column_default || 'NULL'}`);
    });

    // Check foreign key constraints
    const fkResult = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
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
      AND kcu.column_name = 'vendor_id'
      AND tc.constraint_type = 'FOREIGN KEY'
    `);

    console.log('\n\n🔗 Foreign key constraints:');
    if (fkResult.rows.length > 0) {
      fkResult.rows.forEach(fk => {
        console.log(`\n   ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
        console.log(`   On Delete: ${fk.delete_rule}`);
      });
    } else {
      console.log('   ⚠️  No foreign key constraint found on vendor_id');
    }

    // Check indexes
    const indexResult = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'orders'
      AND (indexname LIKE '%vendor%' OR indexdef LIKE '%vendor%')
    `);

    console.log('\n\n📑 Indexes on vendor columns:');
    if (indexResult.rows.length > 0) {
      indexResult.rows.forEach(idx => {
        console.log(`\n   ${idx.indexname}`);
        console.log(`   ${idx.indexdef}`);
      });
    } else {
      console.log('   ⚠️  No indexes found on vendor columns');
    }

    // Check sample data
    const sampleResult = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(vendor_id) as with_vendor_id,
        COUNT(vendor_name) as with_vendor_name,
        COUNT(CASE WHEN vendor_id IS NULL THEN 1 END) as missing_vendor_id,
        COUNT(CASE WHEN vendor_name IS NULL THEN 1 END) as missing_vendor_name
      FROM orders
    `);

    console.log('\n\n📊 Data statistics:');
    const stats = sampleResult.rows[0];
    console.log(`   Total orders: ${stats.total_orders}`);
    console.log(`   Orders with vendor_id: ${stats.with_vendor_id} (${((stats.with_vendor_id/stats.total_orders)*100).toFixed(1)}%)`);
    console.log(`   Orders with vendor_name: ${stats.with_vendor_name} (${((stats.with_vendor_name/stats.total_orders)*100).toFixed(1)}%)`);
    console.log(`   Missing vendor_id: ${stats.missing_vendor_id}`);
    console.log(`   Missing vendor_name: ${stats.missing_vendor_name}`);

    console.log('\n✅ Schema verification complete!');

  } catch (error) {
    console.error('\n❌ Error verifying schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

verifySchema();
