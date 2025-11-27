const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'wholesale-orders.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking products with case_pack field...\n');

db.all('SELECT id, product_name, case_pack, case_minimum, vendor_name FROM products LIMIT 10', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Sample products:');
    console.table(rows);

    // Count how many products have case_pack set
    db.get('SELECT COUNT(*) as total, SUM(CASE WHEN case_pack IS NOT NULL AND case_pack > 0 THEN 1 ELSE 0 END) as with_case_pack FROM products', [], (err, counts) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('\nSummary:');
        console.log(`Total products: ${counts.total}`);
        console.log(`Products with case_pack: ${counts.with_case_pack}`);
        console.log(`Products without case_pack: ${counts.total - counts.with_case_pack}`);
      }
      db.close();
    });
  }
});
