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
  const client = await pool.connect();

  try {
    console.log('🔄 Starting migration: Change product relationships to use product_connect_id...\n');

    // Start transaction
    await client.query('BEGIN');

    // Step 1: Ensure product_connect_id exists and has values
    console.log('📋 Step 1: Checking product_connect_id column...');
    const checkColumn = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name='products' AND column_name='product_connect_id';
    `);

    if (checkColumn.rows.length === 0) {
      console.log('❌ product_connect_id column does not exist. Please run rename_app_id_to_product_connect_id.js first.');
      await client.query('ROLLBACK');
      process.exit(1);
    }

    console.log('✅ product_connect_id column exists');
    console.log(`   Data Type: ${checkColumn.rows[0].data_type}`);
    console.log(`   Nullable: ${checkColumn.rows[0].is_nullable}`);

    // Step 2: Check for NULL product_connect_id values
    console.log('\n📋 Step 2: Checking for products with NULL product_connect_id...');
    const nullCheck = await client.query(`
      SELECT COUNT(*) as count FROM products WHERE product_connect_id IS NULL;
    `);

    const nullCount = parseInt(nullCheck.rows[0].count);
    console.log(`   Found ${nullCount} products with NULL product_connect_id`);

    if (nullCount > 0) {
      console.log('⚠️  WARNING: Some products have NULL product_connect_id values.');
      console.log('   These products will not be linkable in relationships.');
      console.log('   Consider populating product_connect_id for all products before proceeding.');
      console.log('\n   Do you want to auto-generate product_connect_id values for NULL entries?');
      console.log('   This will use a sequence starting from the max existing value + 1.');

      // Auto-generate product_connect_id for NULL entries
      const maxId = await client.query(`
        SELECT COALESCE(MAX(product_connect_id), 10000) as max_id FROM products WHERE product_connect_id IS NOT NULL;
      `);

      const startId = parseInt(maxId.rows[0].max_id) + 1;
      console.log(`\n🔄 Auto-generating product_connect_id starting from ${startId}...`);

      // Get all products with NULL product_connect_id
      const nullProducts = await client.query(`
        SELECT id FROM products WHERE product_connect_id IS NULL ORDER BY id;
      `);

      // Update each one with a sequential product_connect_id
      for (let i = 0; i < nullProducts.rows.length; i++) {
        const newConnectId = startId + i;
        await client.query(`
          UPDATE products
          SET product_connect_id = $1
          WHERE id = $2;
        `, [newConnectId, nullProducts.rows[i].id]);

        if ((i + 1) % 100 === 0) {
          console.log(`   Updated ${i + 1}/${nullProducts.rows.length} products...`);
        }
      }

      console.log(`✅ Auto-generated product_connect_id for ${nullProducts.rows.length} entries`);
    }

    // Step 3: Add UNIQUE constraint to product_connect_id
    console.log('\n📋 Step 3: Adding UNIQUE constraint to product_connect_id...');
    await client.query(`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_connect_id_unique;
    `);
    await client.query(`
      ALTER TABLE products ADD CONSTRAINT products_product_connect_id_unique UNIQUE (product_connect_id);
    `);
    console.log('✅ UNIQUE constraint added to product_connect_id');

    // Step 4: Make product_connect_id NOT NULL
    console.log('\n📋 Step 4: Setting product_connect_id to NOT NULL...');
    await client.query(`
      ALTER TABLE products ALTER COLUMN product_connect_id SET NOT NULL;
    `);
    console.log('✅ product_connect_id is now NOT NULL');

    // Step 5: Update orders table - Add new column and migrate data
    console.log('\n📋 Step 5: Updating orders table...');

    // Check if product_connect_id column exists in orders
    const ordersColumnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='orders' AND column_name='product_connect_id';
    `);

    if (ordersColumnCheck.rows.length === 0) {
      console.log('   Creating product_connect_id column in orders table...');
      await client.query(`
        ALTER TABLE orders ADD COLUMN product_connect_id INTEGER;
      `);
      console.log('✅ Created product_connect_id column in orders');
    }

    // Migrate data from product_id to product_connect_id
    console.log('   Migrating order data from product_id to product_connect_id...');
    const migrateResult = await client.query(`
      UPDATE orders o
      SET product_connect_id = p.product_connect_id
      FROM products p
      WHERE o.product_id = p.id AND o.product_connect_id IS NULL;
    `);
    console.log(`✅ Migrated ${migrateResult.rowCount} order records`);

    // Check for orphaned orders (orders with product_id that don't match any product)
    const orphanCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM orders o
      WHERE o.product_id IS NOT NULL
        AND o.product_connect_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = o.product_id);
    `);
    const orphanCount = parseInt(orphanCheck.rows[0].count);
    if (orphanCount > 0) {
      console.log(`⚠️  Found ${orphanCount} orphaned orders (product_id references non-existent products)`);
    }

    // Step 6: Drop old foreign key and create new one
    console.log('\n📋 Step 6: Updating foreign key constraints in orders table...');

    // Drop old foreign key
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
    `);
    console.log('✅ Dropped old product_id foreign key');

    // Create new foreign key
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_connect_id_fkey;
    `);
    await client.query(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_product_connect_id_fkey
      FOREIGN KEY (product_connect_id)
      REFERENCES products(product_connect_id)
      ON DELETE SET NULL;
    `);
    console.log('✅ Created new product_connect_id foreign key');

    // Step 7: Create index on product_connect_id in orders
    console.log('\n📋 Step 7: Creating index on orders.product_connect_id...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_product_connect_id ON orders(product_connect_id);
    `);
    console.log('✅ Index created');

    // Step 8: Update users.assigned_product_ids (documentation note)
    console.log('\n📋 Step 8: Note about users.assigned_product_ids...');
    console.log('   ℹ️  The assigned_product_ids array in users table currently stores products.id values');
    console.log('   ℹ️  This will need to be migrated to store product_connect_id values');
    console.log('   ℹ️  Migration of user assignments should be done carefully with application logic updates');

    // Check if any users have assigned products
    const userAssignCheck = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE array_length(assigned_product_ids, 1) > 0;
    `);
    const usersWithAssignments = parseInt(userAssignCheck.rows[0].count);

    if (usersWithAssignments > 0) {
      console.log(`   ⚠️  Found ${usersWithAssignments} users with product assignments`);
      console.log('   ⚠️  These will need to be migrated in application code or with a separate migration');
      console.log('   ⚠️  For now, the old IDs will remain - update your application to use product_connect_id');
    } else {
      console.log('   ✅ No users have product assignments yet');
    }

    // Step 9: Display summary of changes
    console.log('\n📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const productCount = await client.query('SELECT COUNT(*) FROM products');
    const orderCount = await client.query('SELECT COUNT(*) FROM orders WHERE product_connect_id IS NOT NULL');

    console.log(`   ✅ Products: ${productCount.rows[0].count} total`);
    console.log(`   ✅ Orders linked: ${orderCount.rows[0].count} orders now use product_connect_id`);
    console.log(`   ✅ product_connect_id is now UNIQUE and NOT NULL`);
    console.log(`   ✅ Foreign key: orders.product_connect_id -> products.product_connect_id`);
    console.log(`   ⚠️  Note: product_id column still exists in orders (for rollback safety)`);
    console.log(`   ⚠️  Note: users.assigned_product_ids needs application-level migration`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Update API routes to use product_connect_id instead of id for relationships');
    console.log('   2. Update frontend code to use product_connect_id for order relationships');
    console.log('   3. Migrate users.assigned_product_ids if needed');
    console.log('   4. After verifying everything works, you can drop the old product_id column from orders');
    console.log('   5. Update database.js schema initialization to reflect new relationships');

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed');

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('\n⚠️  Transaction rolled back - no changes were made');
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
