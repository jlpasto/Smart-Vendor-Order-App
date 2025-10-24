import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      vendor,
      state,
      category,
      popular,
      new: isNew
    } = req.query;

    let queryText = 'SELECT * FROM products WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Add search filter
    if (search) {
      queryText += ` AND (product_name ILIKE $${paramCount} OR product_description ILIKE $${paramCount} OR vendor_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Add vendor filter
    if (vendor) {
      queryText += ` AND vendor_name = $${paramCount}`;
      queryParams.push(vendor);
      paramCount++;
    }

    // Add state filter
    if (state) {
      queryText += ` AND state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    // Add category filter
    if (category) {
      queryText += ` AND category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    // Add popular filter
    if (popular === 'true') {
      queryText += ` AND popular = true`;
    }

    // Add new filter
    if (isNew === 'true') {
      queryText += ` AND new = true`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

// Get unique vendors
router.get('/filters/vendors', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT vendor_name FROM products ORDER BY vendor_name'
    );
    res.json(result.rows.map(row => row.vendor_name));
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Error fetching vendors' });
  }
});

// Get unique states
router.get('/filters/states', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT state FROM products WHERE state IS NOT NULL ORDER BY state'
    );
    res.json(result.rows.map(row => row.state));
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Error fetching states' });
  }
});

// Get unique categories
router.get('/filters/categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
    );
    res.json(result.rows.map(row => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// Create product (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      vendor_name,
      state,
      product_name,
      product_description,
      size,
      case_pack,
      upc,
      wholesale_case_price,
      wholesale_unit_price,
      retail_unit_price,
      order_qty,
      stock_level,
      product_image,
      popular,
      new: isNew,
      category
    } = req.body;

    const result = await query(
      `INSERT INTO products (
        vendor_name, state, product_name, product_description, size, case_pack,
        upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
        order_qty, stock_level, product_image, popular, new, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        vendor_name, state, product_name, product_description, size, case_pack,
        upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
        order_qty || 0, stock_level || 0, product_image, popular || false,
        isNew || false, category
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error creating product' });
  }
});

// Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendor_name,
      state,
      product_name,
      product_description,
      size,
      case_pack,
      upc,
      wholesale_case_price,
      wholesale_unit_price,
      retail_unit_price,
      order_qty,
      stock_level,
      product_image,
      popular,
      new: isNew,
      category
    } = req.body;

    const result = await query(
      `UPDATE products SET
        vendor_name = $1, state = $2, product_name = $3, product_description = $4,
        size = $5, case_pack = $6, upc = $7, wholesale_case_price = $8,
        wholesale_unit_price = $9, retail_unit_price = $10, order_qty = $11,
        stock_level = $12, product_image = $13, popular = $14, new = $15,
        category = $16, updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *`,
      [
        vendor_name, state, product_name, product_description, size, case_pack,
        upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
        order_qty, stock_level, product_image, popular, isNew, category, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error updating product' });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Bulk import products (Admin only)
router.post('/bulk-import', authenticate, requireAdmin, async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid products data. Expected an array of products.' });
    }

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        // Validate required fields
        if (!product.product_name || !product.vendor_name) {
          errors.push(`Row ${i + 1}: Missing required fields (product_name, vendor_name)`);
          failed++;
          continue;
        }

        // Parse boolean values (handle "true", "false", 1, 0, true, false)
        const parseBool = (value) => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
          }
          return value === 1 || value === true;
        };

        const popular = parseBool(product.popular);
        const seasonal = parseBool(product.seasonal);
        const isNew = parseBool(product.new);

        // Check if product has an ID (update) or not (create)
        if (product.id && product.id !== '') {
          // Update existing product
          const checkResult = await query('SELECT id FROM products WHERE id = $1', [product.id]);

          if (checkResult.rows.length === 0) {
            errors.push(`Row ${i + 1}: Product with ID ${product.id} not found. Creating new product instead.`);

            // Create as new product
            await query(
              `INSERT INTO products (
                vendor_name, state, product_name, product_description, size, case_pack,
                upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
                order_qty, stock_level, product_image, popular, seasonal, new, category
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
              [
                product.vendor_name,
                product.state || null,
                product.product_name,
                product.product_description || null,
                product.size || null,
                product.case_pack || null,
                product.upc || null,
                product.wholesale_case_price || 0,
                product.wholesale_unit_price || 0,
                product.retail_unit_price || 0,
                product.order_qty || 0,
                product.stock_level || 0,
                product.product_image || null,
                popular,
                seasonal,
                isNew,
                product.category || null
              ]
            );
            created++;
          } else {
            // Update existing product
            await query(
              `UPDATE products SET
                vendor_name = $1, state = $2, product_name = $3, product_description = $4,
                size = $5, case_pack = $6, upc = $7, wholesale_case_price = $8,
                wholesale_unit_price = $9, retail_unit_price = $10, order_qty = $11,
                stock_level = $12, product_image = $13, popular = $14, seasonal = $15, new = $16,
                category = $17, updated_at = CURRENT_TIMESTAMP
              WHERE id = $18`,
              [
                product.vendor_name,
                product.state || null,
                product.product_name,
                product.product_description || null,
                product.size || null,
                product.case_pack || null,
                product.upc || null,
                product.wholesale_case_price || 0,
                product.wholesale_unit_price || 0,
                product.retail_unit_price || 0,
                product.order_qty || 0,
                product.stock_level || 0,
                product.product_image || null,
                popular,
                seasonal,
                isNew,
                product.category || null,
                product.id
              ]
            );
            updated++;
          }
        } else {
          // Create new product (no ID provided)
          await query(
            `INSERT INTO products (
              vendor_name, state, product_name, product_description, size, case_pack,
              upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
              order_qty, stock_level, product_image, popular, seasonal, new, category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
              product.vendor_name,
              product.state || null,
              product.product_name,
              product.product_description || null,
              product.size || null,
              product.case_pack || null,
              product.upc || null,
              product.wholesale_case_price || 0,
              product.wholesale_unit_price || 0,
              product.retail_unit_price || 0,
              product.order_qty || 0,
              product.stock_level || 0,
              product.product_image || null,
              popular,
              seasonal,
              isNew,
              product.category || null
            ]
          );
          created++;
        }
      } catch (productError) {
        console.error(`Error processing product at row ${i + 1}:`, productError);
        errors.push(`Row ${i + 1}: ${productError.message}`);
        failed++;
      }
    }

    res.json({
      success: true,
      created,
      updated,
      failed,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk importing products:', error);
    res.status(500).json({ error: 'Error bulk importing products: ' + error.message });
  }
});

export default router;
