import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

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

async function runMigration() {
  try {
    console.log('🔄 Running migration: Update ongoing to in_cart');
    console.log(`📡 Connecting to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);

    // Read the migration file
    const migrationSQL = fs.readFileSync('./server/migrations/update_ongoing_to_in_cart.sql', 'utf8');

    // Execute the migration
    const result = await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('📝 All "ongoing" statuses have been updated to "in_cart"');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n✨ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Operation failed:', error.message);
    process.exit(1);
  });
