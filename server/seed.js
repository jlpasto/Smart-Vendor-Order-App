import { query, initDatabase } from './config/database.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Initialize database tables
    await initDatabase();

    // Check if admin already exists
    const existingAdmin = await query('SELECT * FROM users WHERE email = $1', ['admin@wholesalehub.com']);

    if (existingAdmin.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        ['admin@wholesalehub.com', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created: admin@wholesalehub.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Sample products data
    const products = [
      {
        vendor_name: 'Premium Snacks Co',
        state: 'California',
        product_name: 'Organic Potato Chips - Sea Salt',
        product_description: 'Crispy organic potato chips made with sea salt. Perfect for health-conscious snackers.',
        size: '5 oz',
        case_pack: 12,
        upc: '123456789012',
        wholesale_case_price: 36.00,
        wholesale_unit_price: 3.00,
        retail_unit_price: 4.99,
        order_qty: 0,
        stock_level: 500,
        product_image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
        popular: true,
        new: false,
        category: 'Snacks'
      },
      {
        vendor_name: 'Beverage Masters',
        state: 'Texas',
        product_name: 'Sparkling Water - Mixed Berry',
        product_description: 'Zero calorie sparkling water with natural berry flavor. No artificial sweeteners.',
        size: '16 oz',
        case_pack: 24,
        upc: '234567890123',
        wholesale_case_price: 24.00,
        wholesale_unit_price: 1.00,
        retail_unit_price: 1.99,
        order_qty: 0,
        stock_level: 1000,
        product_image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
        popular: true,
        new: true,
        category: 'Beverages'
      },
      {
        vendor_name: 'Healthy Grains Inc',
        state: 'Oregon',
        product_name: 'Quinoa & Ancient Grains Mix',
        product_description: 'Premium blend of quinoa, amaranth, and millet. High in protein and fiber.',
        size: '2 lb',
        case_pack: 6,
        upc: '345678901234',
        wholesale_case_price: 54.00,
        wholesale_unit_price: 9.00,
        retail_unit_price: 14.99,
        order_qty: 0,
        stock_level: 200,
        product_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        popular: false,
        new: true,
        category: 'Grains'
      },
      {
        vendor_name: 'Sweet Treats LLC',
        state: 'New York',
        product_name: 'Artisan Dark Chocolate Bars',
        product_description: '70% cacao dark chocolate bars. Fair trade certified and ethically sourced.',
        size: '3.5 oz',
        case_pack: 20,
        upc: '456789012345',
        wholesale_case_price: 60.00,
        wholesale_unit_price: 3.00,
        retail_unit_price: 5.99,
        order_qty: 0,
        stock_level: 300,
        product_image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400',
        popular: true,
        new: false,
        category: 'Confectionery'
      },
      {
        vendor_name: 'Nutty Delights',
        state: 'Georgia',
        product_name: 'Mixed Nuts - Lightly Salted',
        product_description: 'Premium mix of almonds, cashews, and pecans. Lightly salted for perfect flavor.',
        size: '12 oz',
        case_pack: 12,
        upc: '567890123456',
        wholesale_case_price: 72.00,
        wholesale_unit_price: 6.00,
        retail_unit_price: 9.99,
        order_qty: 0,
        stock_level: 400,
        product_image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400',
        popular: true,
        new: false,
        category: 'Nuts'
      },
      {
        vendor_name: 'Green Valley Foods',
        state: 'Washington',
        product_name: 'Organic Pasta - Whole Wheat',
        product_description: '100% organic whole wheat pasta. Perfect for health-conscious families.',
        size: '1 lb',
        case_pack: 12,
        upc: '678901234567',
        wholesale_case_price: 30.00,
        wholesale_unit_price: 2.50,
        retail_unit_price: 3.99,
        order_qty: 0,
        stock_level: 600,
        product_image: 'https://images.unsplash.com/photo-1551462147-37abc224bce4?w=400',
        popular: false,
        new: false,
        category: 'Pasta'
      },
      {
        vendor_name: 'Premium Snacks Co',
        state: 'California',
        product_name: 'Organic Tortilla Chips',
        product_description: 'Stone-ground organic corn tortilla chips. Perfect for dips and snacking.',
        size: '13 oz',
        case_pack: 12,
        upc: '789012345678',
        wholesale_case_price: 42.00,
        wholesale_unit_price: 3.50,
        retail_unit_price: 5.49,
        order_qty: 0,
        stock_level: 450,
        product_image: 'https://images.unsplash.com/photo-1613919119384-7e5c4f7e5034?w=400',
        popular: true,
        new: true,
        category: 'Snacks'
      },
      {
        vendor_name: 'Beverage Masters',
        state: 'Texas',
        product_name: 'Cold Brew Coffee - Original',
        product_description: 'Smooth cold brew coffee. Ready to drink, no dilution needed.',
        size: '32 oz',
        case_pack: 12,
        upc: '890123456789',
        wholesale_case_price: 48.00,
        wholesale_unit_price: 4.00,
        retail_unit_price: 6.99,
        order_qty: 0,
        stock_level: 250,
        product_image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
        popular: false,
        new: true,
        category: 'Beverages'
      },
      {
        vendor_name: 'Sweet Treats LLC',
        state: 'New York',
        product_name: 'Gourmet Cookies - Assorted',
        product_description: 'Premium assorted cookies including chocolate chip, oatmeal, and sugar cookies.',
        size: '16 oz',
        case_pack: 8,
        upc: '901234567890',
        wholesale_case_price: 56.00,
        wholesale_unit_price: 7.00,
        retail_unit_price: 11.99,
        order_qty: 0,
        stock_level: 180,
        product_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
        popular: true,
        new: false,
        category: 'Bakery'
      },
      {
        vendor_name: 'Healthy Grains Inc',
        state: 'Oregon',
        product_name: 'Organic Steel Cut Oats',
        product_description: 'Premium organic steel cut oats. High in fiber and perfect for a healthy breakfast.',
        size: '2 lb',
        case_pack: 6,
        upc: '012345678901',
        wholesale_case_price: 36.00,
        wholesale_unit_price: 6.00,
        retail_unit_price: 9.49,
        order_qty: 0,
        stock_level: 350,
        product_image: 'https://images.unsplash.com/photo-1574254606148-29c55d0ad03c?w=400',
        popular: false,
        new: false,
        category: 'Grains'
      }
    ];

    // Check if products already exist
    const existingProducts = await query('SELECT COUNT(*) FROM products');
    const productCount = parseInt(existingProducts.rows[0].count);

    if (productCount === 0) {
      console.log('📦 Inserting sample products...');

      for (const product of products) {
        await query(
          `INSERT INTO products (
            vendor_name, state, product_name, product_description, size, case_pack,
            upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
            order_qty, stock_level, product_image, popular, new, category
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            product.vendor_name,
            product.state,
            product.product_name,
            product.product_description,
            product.size,
            product.case_pack,
            product.upc,
            product.wholesale_case_price,
            product.wholesale_unit_price,
            product.retail_unit_price,
            product.order_qty,
            product.stock_level,
            product.product_image,
            product.popular,
            product.new,
            product.category
          ]
        );
      }

      console.log(`✅ ${products.length} sample products inserted`);
    } else {
      console.log(`ℹ️ ${productCount} products already exist in database`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Admin: admin@wholesalehub.com / admin123');
    console.log('   - Products: 10 sample products');
    console.log('\n🚀 Run "npm run dev" to start the application\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
