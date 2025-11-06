import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Complete Production Migration Script
 *
 * This script runs both backup and migration in sequence.
 *
 * Usage: node server/scripts/migrate_production_complete.js
 */

console.log('═══════════════════════════════════════════════════════════');
console.log('   COMPLETE PRODUCTION MIGRATION');
console.log('   Backup + Migration in One Script');
console.log('═══════════════════════════════════════════════════════════\n');

async function runCompleteMigration() {
  try {
    // Step 1: Run backup
    console.log('📦 Step 1/2: Running backup script...\n');
    console.log('─'.repeat(60));

    const backupScript = path.join(__dirname, 'backup_production_users.js');
    const { stdout: backupOutput, stderr: backupError } = await execPromise(`node "${backupScript}"`);

    console.log(backupOutput);
    if (backupError) {
      console.error('Backup warnings:', backupError);
    }

    console.log('─'.repeat(60));
    console.log('✅ Backup completed\n');

    // Step 2: Run migration
    console.log('🚀 Step 2/2: Running migration script...\n');
    console.log('─'.repeat(60));

    const migrationScript = path.join(__dirname, 'migrate_production_database.js');

    // Note: This will prompt for user confirmation
    // We can't fully automate the prompts, so we'll just start the process
    console.log('⚠️  The migration script will now ask for your confirmation.\n');
    console.log('Please answer the prompts to continue...\n');

    // Use spawn instead of exec to allow interactive prompts
    const { spawn } = await import('child_process');
    const migrationProcess = spawn('node', [migrationScript], {
      stdio: 'inherit', // This allows the child process to use parent's stdin/stdout
      shell: true
    });

    migrationProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('   MIGRATION COMPLETE!');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('✅ Backup created');
        console.log('✅ Database migrated');
        console.log('\nYour production database is now using product-based assignments!\n');
        process.exit(0);
      } else {
        console.error(`\n❌ Migration process exited with code ${code}`);
        process.exit(code);
      }
    });

  } catch (error) {
    console.error('\n❌ Error during migration process:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the complete migration
runCompleteMigration();
