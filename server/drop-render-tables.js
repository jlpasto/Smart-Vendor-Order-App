import pg from 'pg';
import readline from 'readline';

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

// Render database configuration - HARDCODED
const pool = new pg.Pool({
  host: 'dpg-d4a99t4hg0os73fts9cg-a.oregon-postgres.render.com',
  port: 5432,
  database: 'cureate_db',
  user: 'cureate_db_user',
  password: 'OSambgLFMzfl4TiOQY0EHlLSd9jHo0QE',
  ssl: {
    rejectUnauthorized: false
  }
});

const dropAllTables = async () => {
  try {
    console.log('⚠️  DROP ALL TABLES ON RENDER DATABASE ⚠️');
    console.log('This will DELETE ALL TABLES and DATA!');
    console.log('');
    console.log('Database: cureate_db');
    console.log('Host: dpg-d4a99t4hg0os73fts9cg-a.oregon-postgres.render.com');
    console.log('');

    // Check if --yes flag is provided to skip confirmation
    const skipConfirmation = process.argv.includes('--yes');

    if (!skipConfirmation) {
      const answer = await askQuestion('Type "DROP" to confirm: ');

      if (answer.trim() !== 'DROP') {
        console.log('❌ Operation cancelled');
        rl.close();
        await pool.end();
        process.exit(0);
      }
    } else {
      console.log('⚠️  Skipping confirmation (--yes flag provided)');
    }

    console.log('');
    console.log('🗑️  Dropping all tables...');

    // Drop tables in correct order (respect foreign keys)
    await pool.query('DROP TABLE IF EXISTS orders CASCADE');
    console.log('  ✓ Dropped orders');

    await pool.query('DROP TABLE IF EXISTS products CASCADE');
    console.log('  ✓ Dropped products');

    await pool.query('DROP TABLE IF EXISTS vendors CASCADE');
    console.log('  ✓ Dropped vendors');

    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('  ✓ Dropped users');

    console.log('');
    console.log('✅ All tables dropped successfully!');
    console.log('');
    console.log('Next step: Run "npm run migrate-to-render --yes" to apply schema and data');
    console.log('');

    rl.close();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error dropping tables:', error.message);
    console.error('');
    rl.close();
    await pool.end();
    process.exit(1);
  }
};

console.log('');
dropAllTables();
