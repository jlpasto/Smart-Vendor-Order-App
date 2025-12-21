import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool using environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixStatusConstraint() {
  try {
    console.log('🔧 FIXING STATUS CONSTRAINT');
    console.log(`📡 Connected to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    console.log('═'.repeat(80));

    // Check current constraint
    console.log('\n1️⃣  Checking current status constraint...');
    const constraintCheck = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'orders'::regclass
      AND contype = 'c'
      AND conname LIKE '%status%'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('\n📋 Current constraint:');
      constraintCheck.rows.forEach(row => {
        console.log(`   Name: ${row.conname}`);
        console.log(`   Definition: ${row.definition}`);
      });
    }

    // Drop the old constraint
    console.log('\n2️⃣  Dropping old status constraint...');
    await pool.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    `);
    console.log('   ✓ Old constraints dropped');

    // Add new constraint with 'in_cart' status
    console.log('\n3️⃣  Adding new status constraint with "in_cart"...');
    await pool.query(`
      ALTER TABLE orders
      ADD CONSTRAINT check_order_status
      CHECK (status IN ('in_cart', 'pending', 'completed', 'cancelled'));
    `);
    console.log('   ✓ New constraint added');

    // Verify the new constraint
    console.log('\n4️⃣  Verifying new constraint...');
    const verifyResult = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'orders'::regclass
      AND contype = 'c'
      AND conname = 'check_order_status'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('\n✅ New constraint verified:');
      console.log(`   Name: ${verifyResult.rows[0].conname}`);
      console.log(`   Definition: ${verifyResult.rows[0].definition}`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Status constraint fixed successfully!');
    console.log('\n📝 Allowed statuses are now:');
    console.log('   - in_cart   (items in shopping cart)');
    console.log('   - pending   (submitted orders awaiting processing)');
    console.log('   - completed (processed orders)');
    console.log('   - cancelled (cancelled orders)');

  } catch (error) {
    console.error('\n❌ Error fixing constraint:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed\n');
  }
}

// Run the fix
fixStatusConstraint()
  .then(() => {
    console.log('✨ Operation completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Operation failed:', error.message);
    process.exit(1);
  });
