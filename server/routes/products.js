import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Cursor encoding/decoding utilities
const encodeCursor = (lastItem, sortField) => {
  const cursorData = {
    [sortField]: lastItem[sortField],
    id: lastItem.id
  };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
};

const decodeCursor = (cursor) => {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

// Get all products with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search,
      vendor,
      state,
      category,
      popular,
      seasonal,
      new: isNew,
      // New filters
      id,
      vendor_connect_id,
      product_name,
      main_categories, // JSON array
      sub_categories, // JSON array
      allergens, // JSON array
      dietary_preferences, // JSON array
      cuisine_type,
      seasonal_featured,
      size,
      upc,
      case_pack_min,
      case_pack_max,
      price_min,
      price_max,
      unit_price_min,
      unit_price_max,
      msrp_min,
      msrp_max,
      gm_min,
      gm_max,
      case_minimum_min,
      case_minimum_max,
      shelf_life,
      delivery_info,
      notes,
      // Sorting
      sort,
      order,
      // Cursor-based pagination
      cursor,
      limit
    } = req.query;

    // Pagination setup
    const pageLimit = limit ? Math.min(parseInt(limit), 100) : null; // Max 100 items per request
    const useCursorPagination = cursor !== undefined || limit !== undefined;

    let queryText = 'SELECT * FROM products WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Apply vendor filtering for non-admin users (buyers)
    if (req.user && req.user.role !== 'admin') {
      // Get user's assigned vendor IDs
      const userResult = await query(
        'SELECT assigned_vendor_ids FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length > 0) {
        const assignedVendorIds = userResult.rows[0].assigned_vendor_ids;

        // If user has assigned vendor IDs, filter products by those vendor IDs
        if (assignedVendorIds && assignedVendorIds.length > 0) {
          queryText += ` AND vendor_id = ANY($${paramCount})`;
          queryParams.push(assignedVendorIds);
          paramCount++;
        } else {
          // If no vendors assigned, return empty result set
          return res.json(useCursorPagination ? {
            items: [],
            pagination: { limit: pageLimit, nextCursor: null, hasMore: false },
            meta: { count: 0, sortField: sort || 'vendor_name', sortOrder: order || 'asc' }
          } : []);
        }
      }
    }

    // Decode and apply cursor if provided
    if (cursor) {
      const cursorData = decodeCursor(cursor);
      if (!cursorData) {
        return res.status(400).json({ error: 'Invalid cursor' });
      }

      // Determine sort field and order
      const sortField = sort || 'vendor_name';
      const sortOrder = order || 'asc';
      const operator = sortOrder.toLowerCase() === 'asc' ? '>' : '<';

      // Apply cursor condition
      queryText += ` AND (${sortField}, id) ${operator} ($${paramCount}, $${paramCount + 1})`;
      queryParams.push(cursorData[sortField], cursorData.id);
      paramCount += 2;
    }

    // Add search filter
    if (search) {
      queryText += ` AND (product_name ILIKE $${paramCount} OR product_description ILIKE $${paramCount} OR vendor_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Text exact match filters
    if (id) {
      queryText += ` AND id = $${paramCount}`;
      queryParams.push(id);
      paramCount++;
    }

    if (vendor_connect_id) {
      queryText += ` AND vendor_connect_id = $${paramCount}`;
      queryParams.push(vendor_connect_id);
      paramCount++;
    }

    if (upc) {
      queryText += ` AND upc = $${paramCount}`;
      queryParams.push(upc);
      paramCount++;
    }

    // Text contains filters
    if (product_name) {
      queryText += ` AND product_name ILIKE $${paramCount}`;
      queryParams.push(`%${product_name}%`);
      paramCount++;
    }

    if (size) {
      queryText += ` AND size ILIKE $${paramCount}`;
      queryParams.push(`%${size}%`);
      paramCount++;
    }

    if (shelf_life) {
      queryText += ` AND shelf_life ILIKE $${paramCount}`;
      queryParams.push(`%${shelf_life}%`);
      paramCount++;
    }

    if (delivery_info) {
      queryText += ` AND delivery_info ILIKE $${paramCount}`;
      queryParams.push(`%${delivery_info}%`);
      paramCount++;
    }

    if (notes) {
      queryText += ` AND notes ILIKE $${paramCount}`;
      queryParams.push(`%${notes}%`);
      paramCount++;
    }

    // Single select filters
    if (vendor) {
      queryText += ` AND vendor_name = $${paramCount}`;
      queryParams.push(vendor);
      paramCount++;
    }

    if (state) {
      queryText += ` AND state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    if (category) {
      queryText += ` AND category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (cuisine_type) {
      queryText += ` AND cuisine_type = $${paramCount}`;
      queryParams.push(cuisine_type);
      paramCount++;
    }

    if (seasonal_featured) {
      queryText += ` AND seasonal_featured = $${paramCount}`;
      queryParams.push(seasonal_featured);
      paramCount++;
    }

    // Multi-select filters (arrays)
    if (main_categories) {
      try {
        const categoriesArray = JSON.parse(main_categories);
        if (categoriesArray.length > 0) {
          queryText += ` AND main_category = ANY($${paramCount})`;
          queryParams.push(categoriesArray);
          paramCount++;
        }
      } catch (e) {
        console.error('Error parsing main_categories:', e);
      }
    }

    if (sub_categories) {
      try {
        const subCategoriesArray = JSON.parse(sub_categories);
        if (subCategoriesArray.length > 0) {
          queryText += ` AND sub_category = ANY($${paramCount})`;
          queryParams.push(subCategoriesArray);
          paramCount++;
        }
      } catch (e) {
        console.error('Error parsing sub_categories:', e);
      }
    }

    // Allergens filter (comma-separated, match any)
    if (allergens) {
      try {
        const allergensArray = JSON.parse(allergens);
        if (allergensArray.length > 0) {
          const allergenConditions = allergensArray.map(() => {
            const condition = `allergens ILIKE $${paramCount}`;
            paramCount++;
            return condition;
          });
          queryParams.push(...allergensArray.map(a => `%${a}%`));
          queryText += ` AND (${allergenConditions.join(' OR ')})`;
        }
      } catch (e) {
        console.error('Error parsing allergens:', e);
      }
    }

    // Dietary preferences filter (comma-separated, match any)
    if (dietary_preferences) {
      try {
        const dietaryArray = JSON.parse(dietary_preferences);
        if (dietaryArray.length > 0) {
          const dietaryConditions = dietaryArray.map(() => {
            const condition = `dietary_preferences ILIKE $${paramCount}`;
            paramCount++;
            return condition;
          });
          queryParams.push(...dietaryArray.map(d => `%${d}%`));
          queryText += ` AND (${dietaryConditions.join(' OR ')})`;
        }
      } catch (e) {
        console.error('Error parsing dietary_preferences:', e);
      }
    }

    // Range filters
    if (case_pack_min) {
      queryText += ` AND CAST(case_pack AS NUMERIC) >= $${paramCount}`;
      queryParams.push(case_pack_min);
      paramCount++;
    }

    if (case_pack_max) {
      queryText += ` AND CAST(case_pack AS NUMERIC) <= $${paramCount}`;
      queryParams.push(case_pack_max);
      paramCount++;
    }

    if (price_min) {
      queryText += ` AND wholesale_case_price >= $${paramCount}`;
      queryParams.push(price_min);
      paramCount++;
    }

    if (price_max) {
      queryText += ` AND wholesale_case_price <= $${paramCount}`;
      queryParams.push(price_max);
      paramCount++;
    }

    if (unit_price_min) {
      queryText += ` AND wholesale_unit_price >= $${paramCount}`;
      queryParams.push(unit_price_min);
      paramCount++;
    }

    if (unit_price_max) {
      queryText += ` AND wholesale_unit_price <= $${paramCount}`;
      queryParams.push(unit_price_max);
      paramCount++;
    }

    if (msrp_min) {
      queryText += ` AND retail_unit_price >= $${paramCount}`;
      queryParams.push(msrp_min);
      paramCount++;
    }

    if (msrp_max) {
      queryText += ` AND retail_unit_price <= $${paramCount}`;
      queryParams.push(msrp_max);
      paramCount++;
    }

    if (gm_min) {
      queryText += ` AND gm_percent >= $${paramCount}`;
      queryParams.push(gm_min);
      paramCount++;
    }

    if (gm_max) {
      queryText += ` AND gm_percent <= $${paramCount}`;
      queryParams.push(gm_max);
      paramCount++;
    }

    if (case_minimum_min) {
      queryText += ` AND CAST(case_minimum AS NUMERIC) >= $${paramCount}`;
      queryParams.push(case_minimum_min);
      paramCount++;
    }

    if (case_minimum_max) {
      queryText += ` AND CAST(case_minimum AS NUMERIC) <= $${paramCount}`;
      queryParams.push(case_minimum_max);
      paramCount++;
    }

    // Boolean filters
    if (popular === 'true') {
      queryText += ` AND popular = true`;
    }

    if (seasonal === 'true') {
      queryText += ` AND seasonal = true`;
    }

    if (isNew === 'true') {
      queryText += ` AND new = true`;
    }

    // Sorting
    const sortField = sort || 'vendor_name'; // Default sort by vendor_name for cursor pagination
    const sortOrder = order || 'asc'; // Default ascending (A-Z)

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['product_name', 'vendor_name', 'wholesale_case_price', 'wholesale_unit_price', 'retail_unit_price', 'gm_percent', 'created_at', 'category', 'state'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'vendor_name';

    // Validate sort order
    const validSortOrder = (sortOrder === 'desc') ? 'DESC' : 'ASC';

    // Add ORDER BY with id as tiebreaker for cursor pagination
    queryText += ` ORDER BY ${validSortField} ${validSortOrder}, id ${validSortOrder}`;

    // Add LIMIT for cursor pagination (request one extra to check if there are more)
    if (useCursorPagination && pageLimit) {
      queryText += ` LIMIT ${pageLimit + 1}`;
    }

    const result = await query(queryText, queryParams);

    // Handle cursor pagination response
    if (useCursorPagination && pageLimit) {
      const hasMore = result.rows.length > pageLimit;
      const items = hasMore ? result.rows.slice(0, pageLimit) : result.rows;

      // Generate next cursor
      let nextCursor = null;
      if (hasMore && items.length > 0) {
        const lastItem = items[items.length - 1];
        nextCursor = encodeCursor(lastItem, validSortField);
      }

      res.json({
        items,
        pagination: {
          limit: pageLimit,
          nextCursor,
          hasMore
        },
        meta: {
          count: items.length,
          sortField: validSortField,
          sortOrder: validSortOrder
        }
      });
    } else {
      // Backward compatibility: return array for non-cursor pagination
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Get all product IDs (for "Select All Pages" feature)
router.get('/ids', authenticate, requireAdmin, async (req, res) => {
  try {
    // Use the same filtering logic as the main GET endpoint
    const {
      search,
      vendor,
      state,
      category,
      popular,
      seasonal,
      new: isNew,
      id, vendor_connect_id, product_name, upc, size,
      main_categories, sub_categories, allergens, dietary_preferences,
      cuisine_type, seasonal_featured,
      case_pack_min, case_pack_max, price_min, price_max,
      unit_price_min, unit_price_max, msrp_min, msrp_max,
      gm_min, gm_max, case_minimum_min, case_minimum_max,
      shelf_life, delivery_info, notes
    } = req.query;

    let queryText = 'SELECT id FROM products WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Global search
    if (search) {
      queryText += ` AND (product_name ILIKE $${paramCount} OR product_description ILIKE $${paramCount} OR vendor_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Text exact match filters
    if (id) {
      queryText += ` AND id = $${paramCount}`;
      queryParams.push(id);
      paramCount++;
    }

    if (vendor_connect_id) {
      queryText += ` AND vendor_connect_id = $${paramCount}`;
      queryParams.push(vendor_connect_id);
      paramCount++;
    }

    if (upc) {
      queryText += ` AND upc = $${paramCount}`;
      queryParams.push(upc);
      paramCount++;
    }

    // Text contains filters
    if (product_name) {
      queryText += ` AND product_name ILIKE $${paramCount}`;
      queryParams.push(`%${product_name}%`);
      paramCount++;
    }

    if (size) {
      queryText += ` AND size ILIKE $${paramCount}`;
      queryParams.push(`%${size}%`);
      paramCount++;
    }

    if (shelf_life) {
      queryText += ` AND shelf_life ILIKE $${paramCount}`;
      queryParams.push(`%${shelf_life}%`);
      paramCount++;
    }

    if (delivery_info) {
      queryText += ` AND delivery_info ILIKE $${paramCount}`;
      queryParams.push(`%${delivery_info}%`);
      paramCount++;
    }

    if (notes) {
      queryText += ` AND notes ILIKE $${paramCount}`;
      queryParams.push(`%${notes}%`);
      paramCount++;
    }

    // Single select filters
    if (vendor) {
      queryText += ` AND vendor_name = $${paramCount}`;
      queryParams.push(vendor);
      paramCount++;
    }

    if (state) {
      queryText += ` AND state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    if (category) {
      queryText += ` AND category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (cuisine_type) {
      queryText += ` AND cuisine_type = $${paramCount}`;
      queryParams.push(cuisine_type);
      paramCount++;
    }

    if (seasonal_featured) {
      queryText += ` AND seasonal_and_featured = $${paramCount}`;
      queryParams.push(seasonal_featured);
      paramCount++;
    }

    // Boolean filters
    if (popular === 'true') {
      queryText += ` AND popular = true`;
    }

    if (seasonal === 'true') {
      queryText += ` AND seasonal = true`;
    }

    if (isNew === 'true') {
      queryText += ` AND new = true`;
    }

    // Multi-select filters
    if (main_categories) {
      try {
        const categoriesArray = JSON.parse(main_categories);
        if (categoriesArray.length > 0) {
          queryText += ` AND main_category = ANY($${paramCount})`;
          queryParams.push(categoriesArray);
          paramCount++;
        }
      } catch (e) {
        console.error('Error parsing main_categories:', e);
      }
    }

    if (sub_categories) {
      try {
        const subCategoriesArray = JSON.parse(sub_categories);
        if (subCategoriesArray.length > 0) {
          queryText += ` AND sub_category = ANY($${paramCount})`;
          queryParams.push(subCategoriesArray);
          paramCount++;
        }
      } catch (e) {
        console.error('Error parsing sub_categories:', e);
      }
    }

    if (allergens) {
      try {
        const allergensArray = JSON.parse(allergens);
        if (allergensArray.length > 0) {
          const allergenConditions = allergensArray.map(() => {
            const condition = `allergens ILIKE $${paramCount}`;
            paramCount++;
            return condition;
          });
          queryParams.push(...allergensArray.map(a => `%${a}%`));
          queryText += ` AND (${allergenConditions.join(' OR ')})`;
        }
      } catch (e) {
        console.error('Error parsing allergens:', e);
      }
    }

    if (dietary_preferences) {
      try {
        const dietaryArray = JSON.parse(dietary_preferences);
        if (dietaryArray.length > 0) {
          const dietaryConditions = dietaryArray.map(() => {
            const condition = `dietary_preferences ILIKE $${paramCount}`;
            paramCount++;
            return condition;
          });
          queryParams.push(...dietaryArray.map(d => `%${d}%`));
          queryText += ` AND (${dietaryConditions.join(' OR ')})`;
        }
      } catch (e) {
        console.error('Error parsing dietary_preferences:', e);
      }
    }

    queryText += ' ORDER BY id';

    const result = await query(queryText, queryParams);
    const productIds = result.rows.map(row => row.id);

    res.json({
      count: productIds.length,
      productIds
    });
  } catch (error) {
    console.error('Error fetching product IDs:', error);
    res.status(500).json({ error: 'Error fetching product IDs' });
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

// Get unique main categories
router.get('/filters/main-categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT main_category FROM products WHERE main_category IS NOT NULL ORDER BY main_category'
    );
    res.json(result.rows.map(row => row.main_category));
  } catch (error) {
    console.error('Error fetching main categories:', error);
    res.status(500).json({ error: 'Error fetching main categories' });
  }
});

// Get unique sub-categories
router.get('/filters/sub-categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT sub_category FROM products WHERE sub_category IS NOT NULL ORDER BY sub_category'
    );
    res.json(result.rows.map(row => row.sub_category));
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    res.status(500).json({ error: 'Error fetching sub-categories' });
  }
});

// Get unique allergens (parse comma-separated values)
router.get('/filters/allergens', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT allergens FROM products WHERE allergens IS NOT NULL AND allergens != \'\''
    );
    const allergensSet = new Set();
    result.rows.forEach(row => {
      const allergens = row.allergens.split(',').map(a => a.trim()).filter(a => a);
      allergens.forEach(a => allergensSet.add(a));
    });
    res.json(Array.from(allergensSet).sort());
  } catch (error) {
    console.error('Error fetching allergens:', error);
    res.status(500).json({ error: 'Error fetching allergens' });
  }
});

// Get unique dietary preferences (parse comma-separated values)
router.get('/filters/dietary-preferences', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT dietary_preferences FROM products WHERE dietary_preferences IS NOT NULL AND dietary_preferences != \'\''
    );
    const preferencesSet = new Set();
    result.rows.forEach(row => {
      const preferences = row.dietary_preferences.split(',').map(p => p.trim()).filter(p => p);
      preferences.forEach(p => preferencesSet.add(p));
    });
    res.json(Array.from(preferencesSet).sort());
  } catch (error) {
    console.error('Error fetching dietary preferences:', error);
    res.status(500).json({ error: 'Error fetching dietary preferences' });
  }
});

// Get unique cuisine types
router.get('/filters/cuisine-types', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT cuisine_type FROM products WHERE cuisine_type IS NOT NULL ORDER BY cuisine_type'
    );
    res.json(result.rows.map(row => row.cuisine_type));
  } catch (error) {
    console.error('Error fetching cuisine types:', error);
    res.status(500).json({ error: 'Error fetching cuisine types' });
  }
});

// Get unique seasonal/featured values
router.get('/filters/seasonal-featured', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT seasonal_featured FROM products WHERE seasonal_featured IS NOT NULL ORDER BY seasonal_featured'
    );
    res.json(result.rows.map(row => row.seasonal_featured));
  } catch (error) {
    console.error('Error fetching seasonal/featured values:', error);
    res.status(500).json({ error: 'Error fetching seasonal/featured values' });
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

// Bulk delete products (Admin only)
router.post('/bulk-delete', authenticate, requireAdmin, async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'No product IDs provided' });
    }

    // Create parameterized query for bulk delete
    const placeholders = productIds.map((_, index) => `$${index + 1}`).join(',');
    const result = await query(
      `DELETE FROM products WHERE id IN (${placeholders}) RETURNING id, product_name`,
      productIds
    );

    res.json({
      message: `${result.rows.length} product(s) deleted successfully`,
      deleted: result.rows.length,
      products: result.rows
    });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    res.status(500).json({ error: 'Error deleting products' });
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
        // Map Excel column names to database fields
        const productData = {
          id: product['ID'] || product.id || null,
          vendor_connect_id: product['Vendor Connect ID'] || product.vendor_connect_id || null,
          vendor_name: product['Vendor Name'] || product.vendor_name,
          product_name: product['Product Name'] || product.product_name,
          main_category: product['Main Category'] || product.main_category || null,
          sub_category: product['Sub-Category'] || product.sub_category || null,
          allergens: product['Allergens'] || product.allergens || null,
          dietary_preferences: product['Dietary Preferences'] || product.dietary_preferences || null,
          cuisine_type: product['Cuisine Type'] || product.cuisine_type || null,
          seasonal_and_featured: product['Seasonal and Featured'] || product.seasonal_and_featured || null,
          size: product['Size'] || product.size || null,
          case_pack: product['Case Pack'] || product.case_pack || null,
          wholesale_case_price: product['Wholesale Case Price'] || product.wholesale_case_price || 0,
          wholesale_unit_price: product['Wholesale Unit Price'] || product.wholesale_unit_price || 0,
          retail_unit_price: product['Retail Unit Price (MSRP)'] || product.retail_unit_price || 0,
          case_minimum: product['Case Minimum'] || product.case_minimum || null,
          shelf_life: product['Shelf Life'] || product.shelf_life || null,
          upc: product['UPC'] || product.upc || null,
          state: product['State'] || product.state || null,
          delivery_info: product['Delivery Info'] || product.delivery_info || null,
          notes: product['Notes'] || product.notes || null,
          product_image: product['Image'] || product.product_image || null,
          // Legacy fields for backward compatibility
          category: product.category || product['Main Category'] || product.main_category || null,
          product_description: product.product_description || product['Notes'] || product.notes || null
        };

        // Validate required fields
        if (!productData.product_name || !productData.vendor_name) {
          errors.push(`Row ${i + 1}: Missing required fields (Product Name, Vendor Name)`);
          failed++;
          continue;
        }

        // Clean price values (remove $ signs and convert to numbers)
        const cleanPrice = (value) => {
          if (!value) return 0;
          if (typeof value === 'number') return value;
          return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
        };

        productData.wholesale_case_price = cleanPrice(productData.wholesale_case_price);
        productData.wholesale_unit_price = cleanPrice(productData.wholesale_unit_price);
        productData.retail_unit_price = cleanPrice(productData.retail_unit_price);

        // Map "Seasonal and Featured" column to boolean flags
        const seasonalFeatured = (productData.seasonal_and_featured || '').toLowerCase();
        const popular = seasonalFeatured.includes('featured');
        const seasonal = seasonalFeatured.includes('seasonal');
        const isNew = seasonalFeatured.includes('new');

        // Check if product has an ID (update) or not (create)
        if (productData.id && productData.id !== '') {
          // Update existing product
          const checkResult = await query('SELECT id FROM products WHERE id = $1', [productData.id]);

          if (checkResult.rows.length === 0) {
            errors.push(`Row ${i + 1}: Product with ID ${productData.id} not found. Creating new product instead.`);

            // Create as new product
            await query(
              `INSERT INTO products (
                vendor_connect_id, vendor_name, product_name, main_category, sub_category,
                allergens, dietary_preferences, cuisine_type, seasonal_and_featured, size, case_pack,
                wholesale_case_price, wholesale_unit_price, retail_unit_price, case_minimum, shelf_life,
                upc, state, delivery_info, notes, product_image, popular, seasonal, new, category, product_description
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
              [
                productData.vendor_connect_id, productData.vendor_name, productData.product_name,
                productData.main_category, productData.sub_category, productData.allergens, productData.dietary_preferences,
                productData.cuisine_type, productData.seasonal_and_featured, productData.size, productData.case_pack,
                productData.wholesale_case_price, productData.wholesale_unit_price, productData.retail_unit_price,
                productData.case_minimum, productData.shelf_life, productData.upc, productData.state,
                productData.delivery_info, productData.notes, productData.product_image,
                popular, seasonal, isNew, productData.category, productData.product_description
              ]
            );
            created++;
          } else {
            // Update existing product
            await query(
              `UPDATE products SET
                vendor_connect_id = $1, vendor_name = $2, product_name = $3, main_category = $4, sub_category = $5,
                allergens = $6, dietary_preferences = $7, cuisine_type = $8, seasonal_and_featured = $9, size = $10, case_pack = $11,
                wholesale_case_price = $12, wholesale_unit_price = $13, retail_unit_price = $14, case_minimum = $15, shelf_life = $16,
                upc = $17, state = $18, delivery_info = $19, notes = $20, product_image = $21, popular = $22, seasonal = $23,
                new = $24, category = $25, product_description = $26, updated_at = CURRENT_TIMESTAMP
              WHERE id = $27`,
              [
                productData.vendor_connect_id, productData.vendor_name, productData.product_name,
                productData.main_category, productData.sub_category, productData.allergens, productData.dietary_preferences,
                productData.cuisine_type, productData.seasonal_and_featured, productData.size, productData.case_pack,
                productData.wholesale_case_price, productData.wholesale_unit_price, productData.retail_unit_price,
                productData.case_minimum, productData.shelf_life, productData.upc, productData.state,
                productData.delivery_info, productData.notes, productData.product_image,
                popular, seasonal, isNew, productData.category, productData.product_description,
                productData.id
              ]
            );
            updated++;
          }
        } else {
          // Create new product (no ID provided)
          await query(
            `INSERT INTO products (
              vendor_connect_id, vendor_name, product_name, main_category, sub_category,
              allergens, dietary_preferences, cuisine_type, seasonal_and_featured, size, case_pack,
              wholesale_case_price, wholesale_unit_price, retail_unit_price, case_minimum, shelf_life,
              upc, state, delivery_info, notes, product_image, popular, seasonal, new, category, product_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
            [
              productData.vendor_connect_id, productData.vendor_name, productData.product_name,
              productData.main_category, productData.sub_category, productData.allergens, productData.dietary_preferences,
              productData.cuisine_type, productData.seasonal_and_featured, productData.size, productData.case_pack,
              productData.wholesale_case_price, productData.wholesale_unit_price, productData.retail_unit_price,
              productData.case_minimum, productData.shelf_life, productData.upc, productData.state,
              productData.delivery_info, productData.notes, productData.product_image,
              popular, seasonal, isNew, productData.category, productData.product_description
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
