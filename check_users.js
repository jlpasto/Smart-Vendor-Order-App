import { query } from './server/config/database.js';

async function checkUsers() {
  try {
    console.log('=== Checking all users in database ===');
    const result = await query('SELECT id, name, email, role FROM users ORDER BY id');
    console.log(`Found ${result.rows.length} users:`);
    console.table(result.rows);

    console.log('\n=== Checking buyers specifically ===');
    const buyersResult = await query("SELECT id, name, email, role FROM users WHERE role = 'buyer'");
    console.log(`Found ${buyersResult.rows.length} users with role='buyer':`);
    console.table(buyersResult.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
