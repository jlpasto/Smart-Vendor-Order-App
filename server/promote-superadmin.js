import dotenv from 'dotenv';
import { query } from './config/database.js';

dotenv.config();

const EMAIL_TO_PROMOTE = 'admin@demo.com';

async function promoteSuperAdmin() {
  try {
    console.log(`\nPromoting ${EMAIL_TO_PROMOTE} to superadmin...\n`);

    // First, update the role constraint to include 'superadmin'
    console.log('Updating database constraint to allow superadmin role...');
    await query(`
      DO $$
      BEGIN
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('buyer', 'admin', 'superadmin', 'user'));
      EXCEPTION
        WHEN OTHERS THEN NULL;
      END $$;
    `);
    console.log('Constraint updated successfully!\n');

    // Check if user exists
    const userCheck = await query('SELECT id, name, email, role FROM users WHERE email = $1', [EMAIL_TO_PROMOTE]);

    if (userCheck.rows.length === 0) {
      console.log(`Error: User with email ${EMAIL_TO_PROMOTE} not found.`);
      process.exit(1);
    }

    const user = userCheck.rows[0];
    console.log(`Found user: ${user.name || user.email} (current role: ${user.role})`);

    if (user.role === 'superadmin') {
      console.log('User is already a superadmin!');
      process.exit(0);
    }

    // Update role to superadmin
    await query('UPDATE users SET role = $1 WHERE email = $2', ['superadmin', EMAIL_TO_PROMOTE]);

    console.log(`\nSuccess! ${EMAIL_TO_PROMOTE} has been promoted to superadmin.`);
    console.log('\nYou can now:');
    console.log('1. Restart your server');
    console.log('2. Log out and log back in');
    console.log('3. You should see the "Manage Admins" tab in the navigation\n');

    process.exit(0);
  } catch (error) {
    console.error('Error promoting user:', error.message);
    process.exit(1);
  }
}

promoteSuperAdmin();
