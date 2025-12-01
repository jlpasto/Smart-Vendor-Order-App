import { query } from './server/config/database.js';

const placeholderUrl = 'https://connect.cureate.co/assets/layout/product_placeholder-bad273c886e8a66164d91ed147868c9189aa626a1c3960a14adcccbac595afa1.png';

async function updateProductImages() {
  try {
    console.log('Updating product images...');

    // Update products with NULL, empty string, or 'null' as image
    const result = await query(
      `UPDATE products
       SET product_image = $1
       WHERE product_image IS NULL
          OR product_image = ''
          OR product_image = 'null'`,
      [placeholderUrl]
    );

    console.log(`\n✓ Successfully updated ${result.rowCount} product(s) with placeholder image\n`);

    // Show some examples of updated products
    const examples = await query(
      `SELECT id, product_name, product_image
       FROM products
       WHERE product_image = $1
       LIMIT 5`,
      [placeholderUrl]
    );

    if (examples.rows.length > 0) {
      console.log('Example products with placeholder image:');
      examples.rows.forEach(row => {
        console.log(`  - ${row.product_name} (ID: ${row.id})`);
      });
    }

    console.log('\n✓ Update completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error updating product images:', error);
    process.exit(1);
  }
}

updateProductImages();
