import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { query } from './config/database.js';

const usernamesToPromote = ['Micks', 'Amy', 'Kelly', 'Kim'];

async function promoteToSuperAdmin() {
  try {
    console.log('Promoting users to superadmin...\n');

    for (const username of usernamesToPromote) {
      // Find user by username (case-insensitive)
      const result = await query(
        'SELECT id, email, role FROM users WHERE LOWER(email) = LOWER($1)',
        [username]
      );

      if (result.rows.length === 0) {
        console.log(`User "${username}" not found in database.`);
        continue;
      }

      const user = result.rows[0];

      if (user.role === 'superadmin') {
        console.log(`User "${username}" is already a superadmin.`);
        continue;
      }

      // Update user role to superadmin
      await query(
        'UPDATE users SET role = $1 WHERE id = $2',
        ['superadmin', user.id]
      );

      console.log(`Successfully promoted "${username}" from "${user.role}" to superadmin.`);
    }

    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

promoteToSuperAdmin();
