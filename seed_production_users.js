import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Production database credentials
const pool = new Pool({
  host: 'dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com',
  port: 5432,
  database: 'wholesale_app_4csh',
  user: 'wholesale_app_4csh_user',
  password: 'lrmooKVMVwidUWaMYBNni3daraps5upq',
  ssl: {
    rejectUnauthorized: false
  }
});

const seedUsers = async () => {
  console.log('👥 Seeding production users...\n');

  try {
    // Check if users already exist
    const checkResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(checkResult.rows[0].count);

    console.log(`📊 Current users in database: ${userCount}`);

    if (userCount > 0) {
      console.log('\n⚠️  Users already exist. Do you want to continue? (This will add more users)');
      console.log('   If you want to reset, run reset_production_database.js first.\n');
    }

    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin user
    console.log('\n👨‍💼 Creating admin user...');
    const adminResult = await pool.query(
      `INSERT INTO users (email, password, role, name, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         name = EXCLUDED.name
       RETURNING id, email, role, name`,
      ['admin@demo.com', hashedPassword, 'admin', 'Admin User']
    );
    console.log(`✓ Admin user created/updated: ${adminResult.rows[0].email} (ID: ${adminResult.rows[0].id})`);

    // Create regular test user
    console.log('\n👤 Creating regular user...');
    const userResult = await pool.query(
      `INSERT INTO users (email, password, role, name, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         name = EXCLUDED.name
       RETURNING id, email, role, name`,
      ['user@demo.com', hashedPassword, 'user', 'Regular User']
    );
    console.log(`✓ Regular user created/updated: ${userResult.rows[0].email} (ID: ${userResult.rows[0].id})`);

    // Verify users
    console.log('\n📋 Verifying users in database...');
    const allUsers = await pool.query('SELECT id, email, role, name FROM users ORDER BY id');
    console.log('\nAll users:');
    allUsers.rows.forEach(user => {
      console.log(`  ID: ${user.id} | ${user.email} | Role: ${user.role} | Name: ${user.name}`);
    });

    console.log('\n✅ Production users seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin@demo.com / password123');
    console.log('   User:  user@demo.com / password123');

  } catch (error) {
    console.error('\n❌ Error seeding users:', error);
    console.error('Error details:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

seedUsers();
