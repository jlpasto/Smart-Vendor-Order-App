import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Production Database Backup Script
 *
 * This script backs up the users table before migration.
 *
 * Usage: node server/scripts/backup_production_users.js
 */

// Production database credentials
const PRODUCTION_CONFIG = {
  host: 'dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com',
  port: 5432,
  database: 'wholesale_app_4csh',
  user: 'wholesale_app_4csh_user',
  password: 'lrmooKVMVwidUWaMYBNni3daraps5upq',
  ssl: {
    rejectUnauthorized: false
  }
};

async function backupUsers() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PRODUCTION DATABASE BACKUP');
  console.log('   Users Table Backup');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = new Client(PRODUCTION_CONFIG);

  try {
    // Connect to database
    console.log('📡 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Fetch all users
    console.log('📥 Fetching all users...');
    const result = await client.query(`
      SELECT
        id,
        name,
        email,
        id_no,
        role,
        assigned_vendor_ids,
        created_at
      FROM users
      ORDER BY id
    `);

    console.log(`✅ Retrieved ${result.rows.length} users\n`);

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `users_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // Write backup file
    console.log('💾 Writing backup file...');
    fs.writeFileSync(filepath, JSON.stringify({
      backup_date: new Date().toISOString(),
      database: PRODUCTION_CONFIG.database,
      total_users: result.rows.length,
      users: result.rows
    }, null, 2));

    console.log(`✅ Backup saved to: ${filepath}\n`);

    // Display summary
    console.log('Backup Summary:');
    console.log('─'.repeat(60));
    console.log(`Total Users: ${result.rows.length}`);

    const roleStats = result.rows.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    const usersWithVendorAssignments = result.rows.filter(u =>
      u.assigned_vendor_ids && u.assigned_vendor_ids.length > 0
    ).length;

    console.log(`\nUsers with vendor assignments: ${usersWithVendorAssignments}`);
    console.log('─'.repeat(60));

    console.log('\n🎉 Backup completed successfully!\n');
    console.log('To restore from this backup (if needed):');
    console.log(`  1. Open ${filename}`);
    console.log('  2. Use the data to manually restore user records\n');

  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run backup
backupUsers()
  .then(() => {
    console.log('Exiting...\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
