import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestUser() {
  try {
    const email = 'testbuyer@test.com';
    const password = 'test123';
    const name = 'Test Buyer';
    const role = 'buyer';

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      console.log('User already exists, updating password...');
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      console.log('✅ Test user password updated');
    } else {
      console.log('Creating new test user...');
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, name, role]
      );
      console.log('✅ Test user created');
    }

    console.log('\nTest User Credentials:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  Role:', role);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
