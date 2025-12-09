import { query } from './server/config/database.js';

async function fixAvaRole() {
  try {
    console.log("Updating AVA's role from 'user' to 'buyer'...");

    const result = await query(
      "UPDATE users SET role = 'buyer' WHERE email = 'ava@demo.com' RETURNING id, name, email, role",
    );

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated AVA:');
      console.table(result.rows);
    } else {
      console.log('⚠️  No user found with email ava@demo.com');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAvaRole();
