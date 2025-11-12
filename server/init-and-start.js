import { initDatabase } from './config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const initializeApp = async () => {
  try {
    console.log('🔧 Initializing database...');

    // Initialize database tables
    await initDatabase();

    console.log('✅ Database initialization complete');
    console.log('🚀 Starting server...');

    // Import and start the server after database is initialized
    await import('./index.js');

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
};

initializeApp();
