import { query } from './config/database.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('👤 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@wholesalehub.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('ℹ️  Admin user already exists: admin@wholesalehub.com');
      console.log('');
      console.log('To reset the password, you can:');
      console.log('  1. Delete the user from the database');
      console.log('  2. Run this script again');
      console.log('  Or use the password reset feature in the app');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
      ['admin@wholesalehub.com', hashedPassword, 'admin']
    );

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: admin@wholesalehub.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password in production!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
