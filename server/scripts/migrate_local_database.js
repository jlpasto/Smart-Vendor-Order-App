import { query } from '../config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Local Database Migration Script
 *
 * This script migrates your LOCAL development database.
 *
 * Usage: node server/scripts/migrate_local_database.js
 */

async function migrateLocalDatabase() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   LOCAL DATABASE MIGRATION');
  console.log('   Product-Based Assignments Migration');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Database Details:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'wholesale_app'}`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}\n`);

  console.log('🚀 Starting migration...\n');

  try {
    // Step 1: Add the new column
    console.log('Step 1: Adding assigned_product_ids column...');
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_product_ids INTEGER[] DEFAULT '{}';
    `);
    console.log('✅ Column added\n');

    // Step 2: Create index
    console.log('Step 2: Creating GIN index...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_assigned_product_ids
      ON users USING GIN(assigned_product_ids);
    `);
    console.log('✅ Index created\n');

    // Step 3: Get all buyers with vendor assignments
    console.log('Step 3: Fetching buyers with vendor assignments...');
    const usersResult = await query(`
      SELECT id, email, name, assigned_vendor_ids
      FROM users
      WHERE role = 'buyer'
      AND assigned_vendor_ids IS NOT NULL
      AND array_length(assigned_vendor_ids, 1) > 0
      ORDER BY id
    `);

    console.log(`Found ${usersResult.rows.length} buyers with vendor assignments\n`);

    if (usersResult.rows.length === 0) {
      console.log('ℹ️  No buyers with vendor assignments found. Migration complete.\n');
    } else {
      // Step 4: Migrate each user
      console.log('Step 4: Migrating each buyer...\n');
      let successCount = 0;
      let warningCount = 0;

      for (const user of usersResult.rows) {
        console.log(`👤 Processing: ${user.name || user.email} (ID: ${user.id})`);
        console.log(`   Assigned vendors: ${user.assigned_vendor_ids.length} vendor(s)`);

        // Get all products from the user's assigned vendors
        const productsResult = await query(`
          SELECT ARRAY_AGG(DISTINCT id) as product_ids
          FROM products
          WHERE vendor_id = ANY($1::INTEGER[])
        `, [user.assigned_vendor_ids]);

        const productIds = productsResult.rows[0]?.product_ids || [];

        if (productIds.length > 0) {
          // Update user with product IDs
          await query(`
            UPDATE users
            SET assigned_product_ids = $1
            WHERE id = $2
          `, [productIds, user.id]);

          console.log(`   ✅ Assigned ${productIds.length} products`);
          successCount++;
        } else {
          console.log(`   ⚠️  Warning: No products found for assigned vendors`);
          warningCount++;
        }
        console.log('');
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log('Migration Summary:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`✅ Successfully migrated: ${successCount} buyers`);
      console.log(`⚠️  Warnings (no products): ${warningCount} buyers`);
      console.log(`📊 Total processed: ${usersResult.rows.length} buyers\n`);
    }

    // Step 5: Verification
    console.log('Step 5: Verification\n');
    const verificationResult = await query(`
      SELECT
        id,
        email,
        name,
        role,
        array_length(assigned_vendor_ids, 1) as vendor_count,
        array_length(assigned_product_ids, 1) as product_count
      FROM users
      WHERE role = 'buyer'
      AND (
        array_length(assigned_vendor_ids, 1) > 0
        OR array_length(assigned_product_ids, 1) > 0
      )
      ORDER BY id
    `);

    if (verificationResult.rows.length > 0) {
      console.log('Detailed Verification:');
      console.log('─'.repeat(60));
      verificationResult.rows.forEach(row => {
        console.log(`ID: ${row.id} | ${row.name || row.email}`);
        console.log(`  Vendors: ${row.vendor_count || 0} → Products: ${row.product_count || 0}`);
      });
      console.log('─'.repeat(60));
    }

    console.log('\n🎉 Local database migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. ✅ Your local dev server should now work without errors');
    console.log('2. 🧪 Test the admin UI locally');
    console.log('3. 🚀 When ready, run production migration\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error details:');
    console.error(error);
    console.log('\n⚠️  Please check the error and try again.\n');
    process.exit(1);
  }
}

// Run the migration
migrateLocalDatabase()
  .then(() => {
    console.log('Exiting...\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
