-- Update all products with empty or null images to use the placeholder image
-- Run this script in your PostgreSQL database

UPDATE products
SET product_image = 'https://connect.cureate.co/assets/layout/product_placeholder-bad273c886e8a66164d91ed147868c9189aa626a1c3960a14adcccbac595afa1.png'
WHERE product_image IS NULL
   OR product_image = ''
   OR product_image = 'null';

-- Show count of updated products
SELECT COUNT(*) as updated_count
FROM products
WHERE product_image = 'https://connect.cureate.co/assets/layout/product_placeholder-bad273c886e8a66164d91ed147868c9189aa626a1c3960a14adcccbac595afa1.png';
