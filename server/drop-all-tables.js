import pg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

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

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('render') ? {
    rejectUnauthorized: false
  } : undefined
});

const dropAllTables = async () => {
  try {
    console.log('⚠️  DROP ALL TABLES WARNING ⚠️');
    console.log('This will DELETE ALL TABLES and DATA!');
    console.log('');
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log('');

    const answer = await askQuestion('Type "DROP" to confirm: ');

    if (answer.trim() !== 'DROP') {
      console.log('❌ Operation cancelled');
      rl.close();
      await pool.end();
      process.exit(0);
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
    console.log('Next step: Run "npm run migrate-db" to recreate with new schema and data');
    console.log('');

    rl.close();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error dropping tables:', error);
    console.error('');
    rl.close();
    await pool.end();
    process.exit(1);
  }
};

console.log('');
dropAllTables();
