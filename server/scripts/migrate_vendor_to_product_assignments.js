import { query } from '../config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration Script: Convert Vendor Assignments to Product Assignments
 *
 * This script migrates existing vendor-based assignments to product-based assignments.
 * It fetches all products from each user's assigned vendors and assigns those products directly.
 *
 * Usage: node server/scripts/migrate_vendor_to_product_assignments.js
 */

async function migrateVendorToProductAssignments() {
  console.log('🚀 Starting migration: Vendor assignments → Product assignments\n');

  try {
    // Step 1: Add the new column if it doesn't exist
    console.log('Step 1: Adding assigned_product_ids column...');
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_product_ids INTEGER[] DEFAULT '{}';
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_assigned_product_ids ON users USING GIN(assigned_product_ids);
    `);

    console.log('✅ Column and index created\n');

    // Step 2: Get all buyers with vendor assignments
    console.log('Step 2: Fetching buyers with vendor assignments...');
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
      console.log('ℹ️  No buyers with vendor assignments found. Migration complete.');
      return;
    }

    // Step 3: Migrate each user
    console.log('Step 3: Migrating each buyer...\n');
    let successCount = 0;
    let warningCount = 0;

    for (const user of usersResult.rows) {
      console.log(`👤 Processing: ${user.name || user.email} (ID: ${user.id})`);
      console.log(`   Assigned vendors: ${user.assigned_vendor_ids.length} vendor(s)`);

      // Get all products from the user's assigned vendors
      const productsResult = await query(`
        SELECT ARRAY_AGG(DISTINCT id) as product_ids
        FROM products
        WHERE vendor_id = ANY($1)
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

    // Step 4: Verification
    console.log('Step 4: Verification\n');
    console.log('═'.repeat(60));
    console.log('Migration Summary:');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount} buyers`);
    console.log(`⚠️  Warnings (no products): ${warningCount} buyers`);
    console.log(`📊 Total processed: ${usersResult.rows.length} buyers\n`);

    // Show detailed verification
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

    console.log('Detailed Verification:');
    console.log('─'.repeat(60));
    verificationResult.rows.forEach(row => {
      console.log(`ID: ${row.id} | ${row.name || row.email}`);
      console.log(`  Vendors: ${row.vendor_count || 0} → Products: ${row.product_count || 0}`);
    });
    console.log('─'.repeat(60));

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Deploy backend code changes');
    console.log('2. Deploy frontend code changes');
    console.log('3. Test thoroughly with buyers');
    console.log('4. After verification, you can drop the assigned_vendor_ids column\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the migration
migrateVendorToProductAssignments()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
