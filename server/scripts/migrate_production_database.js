import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

/**
 * Production Database Migration Script
 *
 * This script migrates the PRODUCTION database to add product-based assignments.
 *
 * IMPORTANT: This will run on your HOSTED PostgreSQL database!
 *
 * Usage: node server/scripts/migrate_production_database.js
 */

// Production database credentials
const PRODUCTION_CONFIG = {
  host: 'dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com',
  port: 5432,
  database: 'wholesale_app_4csh',
  user: 'wholesale_app_4csh_user',
  password: 'lrmooKVMVwidUWaMYBNni3daraps5upq',
  ssl: {
    rejectUnauthorized: false // Required for Render.com hosted databases
  }
};

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function migrateProductionDatabase() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PRODUCTION DATABASE MIGRATION');
  console.log('   Product-Based Assignments Migration');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('⚠️  WARNING: This will modify your PRODUCTION database!\n');
  console.log('Database Details:');
  console.log(`  Host: ${PRODUCTION_CONFIG.host}`);
  console.log(`  Database: ${PRODUCTION_CONFIG.database}`);
  console.log(`  User: ${PRODUCTION_CONFIG.user}\n`);

  // Ask for confirmation
  const confirm1 = await question('Are you sure you want to continue? (yes/no): ');
  if (confirm1.toLowerCase() !== 'yes') {
    console.log('\n❌ Migration cancelled by user.');
    rl.close();
    process.exit(0);
  }

  const confirm2 = await question('\nHave you backed up your database? (yes/no): ');
  if (confirm2.toLowerCase() !== 'yes') {
    console.log('\n❌ Please backup your database first!');
    console.log('   You can backup using Render.com dashboard or pg_dump command.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🚀 Starting migration...\n');

  // Create database client
  const client = new Client(PRODUCTION_CONFIG);

  try {
    // Connect to database
    console.log('📡 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Step 1: Add the new column
    console.log('Step 1: Adding assigned_product_ids column...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_product_ids INTEGER[] DEFAULT '{}';
    `);
    console.log('✅ Column added\n');

    // Step 2: Create index
    console.log('Step 2: Creating GIN index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_assigned_product_ids
      ON users USING GIN(assigned_product_ids);
    `);
    console.log('✅ Index created\n');

    // Step 3: Get all buyers with vendor assignments
    console.log('Step 3: Fetching buyers with vendor assignments...');
    const usersResult = await client.query(`
      SELECT id, email, name, assigned_vendor_ids
      FROM users
      WHERE role = 'buyer'
      AND assigned_vendor_ids IS NOT NULL
      AND array_length(assigned_vendor_ids, 1) > 0
      ORDER BY id
    `);

    console.log(`Found ${usersResult.rows.length} buyers with vendor assignments\n`);

    if (usersResult.rows.length === 0) {
      console.log('ℹ️  No buyers with vendor assignments found. Skipping data migration.\n');
    } else {
      // Step 4: Migrate each user
      console.log('Step 4: Migrating each buyer...\n');
      let successCount = 0;
      let warningCount = 0;

      for (const user of usersResult.rows) {
        console.log(`👤 Processing: ${user.name || user.email} (ID: ${user.id})`);
        console.log(`   Assigned vendors: ${user.assigned_vendor_ids.length} vendor(s)`);

        // Get all products from the user's assigned vendors
        const productsResult = await client.query(`
          SELECT ARRAY_AGG(DISTINCT id) as product_ids
          FROM products
          WHERE vendor_id = ANY($1::INTEGER[])
        `, [user.assigned_vendor_ids]);

        const productIds = productsResult.rows[0]?.product_ids || [];

        if (productIds.length > 0) {
          // Update user with product IDs
          await client.query(`
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
    const verificationResult = await client.query(`
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

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. ✅ Database migration complete');
    console.log('2. 🚀 Your deployed backend should automatically use the new system');
    console.log('3. 🧪 Test with a buyer account to verify product filtering');
    console.log('4. 📱 Test the admin UI to assign products');
    console.log('5. ⏳ Monitor for 1-2 weeks before dropping old column\n');

    console.log('Optional cleanup (run after thorough testing):');
    console.log('  ALTER TABLE users DROP COLUMN assigned_vendor_ids;\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error details:');
    console.error(error);
    console.log('\n⚠️  Your database has NOT been fully migrated.');
    console.log('   Please review the error and try again.');
    console.log('   The migration is designed to be safe to re-run.\n');
    process.exit(1);
  } finally {
    // Close database connection
    await client.end();
    rl.close();
  }
}

// Run the migration
console.log('\n');
migrateProductionDatabase()
  .then(() => {
    console.log('Exiting...\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
