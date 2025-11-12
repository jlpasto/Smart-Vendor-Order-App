import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Target database configuration (from .env)
const targetPool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('render') ? {
    rejectUnauthorized: false
  } : undefined
});

const migrateDatabase = async () => {
  try {
    console.log('📦 DATABASE MIGRATION TOOL');
    console.log('');
    console.log('This will:');
    console.log('  1. Load schema from extracted-schema.sql');
    console.log('  2. Load data from extracted-data.sql');
    console.log('  3. Apply to target database');
    console.log('');
    console.log(`Target Database: ${process.env.DB_NAME}`);
    console.log(`Target Host: ${process.env.DB_HOST}`);
    console.log('');

    // Check if files exist
    const schemaPath = path.join(__dirname, 'extracted-schema.sql');
    const dataPath = path.join(__dirname, 'extracted-data.sql');

    if (!fs.existsSync(schemaPath)) {
      console.error('❌ extracted-schema.sql not found!');
      console.log('');
      console.log('Please run: npm run extract-schema first');
      console.log('');
      rl.close();
      process.exit(1);
    }

    if (!fs.existsSync(dataPath)) {
      console.error('❌ extracted-data.sql not found!');
      console.log('');
      console.log('Please run: npm run extract-data first');
      console.log('');
      rl.close();
      process.exit(1);
    }

    const answer = await askQuestion('⚠️  This will REPLACE all data. Type "MIGRATE" to confirm: ');

    if (answer.trim() !== 'MIGRATE') {
      console.log('❌ Operation cancelled');
      rl.close();
      process.exit(0);
    }

    console.log('');
    console.log('📖 Reading schema file...');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📖 Reading data file...');
    const dataSQL = fs.readFileSync(dataPath, 'utf8');

    console.log('');
    console.log('🔨 Applying schema...');
    await targetPool.query(schemaSQL);
    console.log('✅ Schema applied successfully');

    console.log('');
    console.log('📥 Importing data...');
    await targetPool.query(dataSQL);
    console.log('✅ Data imported successfully');

    console.log('');
    console.log('🔍 Verifying migration...');

    // Count rows in each table
    const tablesResult = await targetPool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('');
    console.log('📊 Table row counts:');
    for (const table of tablesResult.rows) {
      const countResult = await targetPool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      const count = countResult.rows[0].count;
      console.log(`  ${table.table_name}: ${count} rows`);
    }

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('🎉 Your database is ready to use!');
    console.log('');

    await targetPool.end();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error during migration:', error);
    console.error('');
    await targetPool.end();
    rl.close();
    process.exit(1);
  }
};

console.log('');
migrateDatabase();
