import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runMigration() {
  console.log('🚀 Starting database migration...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_order_modifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔄 Executing migration...');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\nNew columns added to orders table:');
    console.log('  - pricing_mode (VARCHAR)');
    console.log('  - unit_price (DECIMAL)');
    console.log('  - case_price (DECIMAL)');
    console.log('  - modified_by_admin (BOOLEAN)');
    console.log('  - modification_count (INTEGER)');
    console.log('\nNew tables created:');
    console.log('  - order_history (audit trail)');
    console.log('  - order_snapshots (before/after comparison)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n✅ Database connection closed');
  }
}

runMigration();
