import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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

// Target database configuration - HARDCODED FOR RENDER
const targetPool = new pg.Pool({
  host: 'dpg-d4a99t4hg0os73fts9cg-a.oregon-postgres.render.com',
  port: 5432,
  database: 'cureate_db',
  user: 'cureate_db_user',
  password: 'OSambgLFMzfl4TiOQY0EHlLSd9jHo0QE',
  ssl: {
    rejectUnauthorized: false
  }
});

const migrateDatabase = async () => {
  try {
    console.log('📦 DATABASE MIGRATION TO RENDER');
    console.log('');
    console.log('This will:');
    console.log('  1. Load schema from extracted-schema.sql');
    console.log('  2. Load data from extracted-data.sql');
    console.log('  3. Apply to Render database');
    console.log('');
    console.log('Target Database: cureate_db');
    console.log('Target Host: dpg-d4a99t4hg0os73fts9cg-a.oregon-postgres.render.com');
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
      await targetPool.end();
      process.exit(1);
    }

    if (!fs.existsSync(dataPath)) {
      console.error('❌ extracted-data.sql not found!');
      console.log('');
      console.log('Please run: npm run extract-data first');
      console.log('');
      rl.close();
      await targetPool.end();
      process.exit(1);
    }

    // Check if --yes flag is provided to skip confirmation
    const skipConfirmation = process.argv.includes('--yes');

    if (!skipConfirmation) {
      const answer = await askQuestion('⚠️  This will REPLACE all data. Type "MIGRATE" to confirm: ');

      if (answer.trim() !== 'MIGRATE') {
        console.log('❌ Migration cancelled');
        rl.close();
        await targetPool.end();
        process.exit(0);
      }
    } else {
      console.log('⚠️  Skipping confirmation (--yes flag provided)');
    }

    console.log('');
    console.log('🚀 Starting migration...');
    console.log('');

    // Read the schema file
    console.log('📋 Loading schema...');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Read the data file
    console.log('📊 Loading data...');
    let dataSQL = fs.readFileSync(dataPath, 'utf8');

    // Remove session_replication_role commands (not allowed on Render)
    dataSQL = dataSQL.replace(/SET session_replication_role = replica;/g, '');
    dataSQL = dataSQL.replace(/SET session_replication_role = DEFAULT;/g, '');

    // Fix empty arrays - PostgreSQL needs type cast for empty arrays
    // Replace ARRAY[] with ARRAY[]::integer[] for integer array columns
    dataSQL = dataSQL.replace(/ARRAY\[\]/g, 'ARRAY[]::integer[]');

    // Fix timestamp formats - convert JavaScript Date.toString() to ISO format
    // Example: 'Sun Oct 26 2025 18:13:12 GMT+0800 (Philippine Standard Time)'
    // We'll convert these to ISO format that PostgreSQL understands
    dataSQL = dataSQL.replace(/'([A-Z][a-z]{2} [A-Z][a-z]{2} \d{1,2} \d{4} \d{2}:\d{2}:\d{2}) GMT([+-]\d{4}) \([^)]+\)'/g,
      (match, datePart, offset) => {
        // Parse and convert to ISO
        const date = new Date(datePart + ' GMT' + offset);
        return `'${date.toISOString()}'`;
      }
    );

    // Execute schema
    console.log('🔨 Applying schema...');
    await targetPool.query(schemaSQL);
    console.log('  ✓ Schema applied');

    // Execute data
    console.log('📥 Importing data...');
    await targetPool.query(dataSQL);
    console.log('  ✓ Data imported');

    // Verify the migration
    console.log('');
    console.log('✅ Verifying migration...');

    const tables = ['users', 'vendors', 'products', 'orders'];
    for (const table of tables) {
      const result = await targetPool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  ✓ ${table}: ${result.rows[0].count} rows`);
    }

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');

    rl.close();
    await targetPool.end();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error during migration:', error.message);
    console.error('');
    if (error.detail) {
      console.error('Detail:', error.detail);
      console.error('');
    }
    rl.close();
    await targetPool.end();
    process.exit(1);
  }
};

migrateDatabase();
