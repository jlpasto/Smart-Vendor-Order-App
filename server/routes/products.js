import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

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

// Get all products for export (Admin only) - returns all filtered products without pagination
router.get('/export', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const {
      search,
      vendor,
      state,
      sort,
      order,
      // Advanced filters
      id,
      vendor_connect_id,
      product_name,
      main_categories,
      sub_categories,
      allergens,
      dietary_preferences,
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
      notes
    } = req.query;

    let queryText = 'SELECT * FROM products WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Add search filter
    if (search) {
      queryText += ` AND (product_name ILIKE $${paramCount} OR vendor_name ILIKE $${paramCount} OR category ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Text filters
    if (id) {
      queryText += ` AND id = $${paramCount}`;
      queryParams.push(parseInt(id));
      paramCount++;
    }

    if (vendor_connect_id) {
      queryText += ` AND vendor_connect_id = $${paramCount}`;
      queryParams.push(vendor_connect_id);
      paramCount++;
    }

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

    if (upc) {
      queryText += ` AND upc = $${paramCount}`;
      queryParams.push(upc);
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

    // Multi-select filters
    if (vendor) {
      try {
        const vendorArray = JSON.parse(vendor);
        if (Array.isArray(vendorArray) && vendorArray.length > 0) {
          queryText += ` AND vendor_name = ANY($${paramCount})`;
          queryParams.push(vendorArray);
          paramCount++;
        }
      } catch (e) {
        queryText += ` AND vendor_name = $${paramCount}`;
        queryParams.push(vendor);
        paramCount++;
      }
    }

    if (main_categories) {
      try {
        const categoriesArray = JSON.parse(main_categories);
        if (Array.isArray(categoriesArray) && categoriesArray.length > 0) {
          queryText += ` AND main_category = ANY($${paramCount})`;
          queryParams.push(categoriesArray);
          paramCount++;
        }
      } catch (e) {}
    }

    if (sub_categories) {
      try {
        const subCategoriesArray = JSON.parse(sub_categories);
        if (Array.isArray(subCategoriesArray) && subCategoriesArray.length > 0) {
          queryText += ` AND sub_category = ANY($${paramCount})`;
          queryParams.push(subCategoriesArray);
          paramCount++;
        }
      } catch (e) {}
    }

    // Dropdown filters
    if (state) {
      queryText += ` AND state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    if (cuisine_type) {
      try {
        const cuisineArray = JSON.parse(cuisine_type);
        if (Array.isArray(cuisineArray) && cuisineArray.length > 0) {
          queryText += ` AND cuisine_type = ANY($${paramCount})`;
          queryParams.push(cuisineArray);
          paramCount++;
        }
      } catch (e) {
        queryText += ` AND cuisine_type = $${paramCount}`;
        queryParams.push(cuisine_type);
        paramCount++;
      }
    }

    if (seasonal_featured) {
      queryText += ` AND seasonal_and_featured = $${paramCount}`;
      queryParams.push(seasonal_featured);
      paramCount++;
    }

    // Allergens and dietary preferences (comma-separated fields)
    if (allergens) {
      try {
        const allergensArray = JSON.parse(allergens);
        if (Array.isArray(allergensArray) && allergensArray.length > 0) {
          const allergenConditions = allergensArray.map(() => {
            const condition = `allergens ILIKE $${paramCount}`;
            paramCount++;
            return condition;
          });
          queryText += ` AND (${allergenConditions.join(' OR ')})`;
          allergensArray.forEach(allergen => {
            queryParams.push(`%${allergen}%`);
          });
        }
      } catch (e) {}
    }

    if (dietary_preferences) {
      try {
        const dietaryArray = JSON.parse(dietary_preferences);
        if (Array.isArray(dietaryArray) && dietaryArray.length > 0) {
          const dietaryConditions = dietaryArray.map(() => {
            const condition = `dietary_preferences ILIKE $${paramCount}`;
            paramCount++;
            return condition;
          });
          queryText += ` AND (${dietaryConditions.join(' OR ')})`;
          dietaryArray.forEach(pref => {
            queryParams.push(`%${pref}%`);
          });
        }
      } catch (e) {}
    }

    // Range filters
    if (case_pack_min) {
      queryText += ` AND CAST(case_pack AS NUMERIC) >= $${paramCount}`;
      queryParams.push(parseFloat(case_pack_min));
      paramCount++;
    }

    if (case_pack_max) {
      queryText += ` AND CAST(case_pack AS NUMERIC) <= $${paramCount}`;
      queryParams.push(parseFloat(case_pack_max));
      paramCount++;
    }

    if (price_min) {
      queryText += ` AND CAST(wholesale_case_price AS NUMERIC) >= $${paramCount}`;
      queryParams.push(parseFloat(price_min));
      paramCount++;
    }

    if (price_max) {
      queryText += ` AND CAST(wholesale_case_price AS NUMERIC) <= $${paramCount}`;
      queryParams.push(parseFloat(price_max));
      paramCount++;
    }

    if (unit_price_min) {
      queryText += ` AND CAST(wholesale_unit_price AS NUMERIC) >= $${paramCount}`;
      queryParams.push(parseFloat(unit_price_min));
      paramCount++;
    }

    if (unit_price_max) {
      queryText += ` AND CAST(wholesale_unit_price AS NUMERIC) <= $${paramCount}`;
      queryParams.push(parseFloat(unit_price_max));
      paramCount++;
    }

    if (msrp_min) {
      queryText += ` AND CAST(retail_unit_price AS NUMERIC) >= $${paramCount}`;
      queryParams.push(parseFloat(msrp_min));
      paramCount++;
    }

    if (msrp_max) {
      queryText += ` AND CAST(retail_unit_price AS NUMERIC) <= $${paramCount}`;
      queryParams.push(parseFloat(msrp_max));
      paramCount++;
    }

    if (gm_min) {
      queryText += ` AND CAST(gm_percent AS NUMERIC) >= $${paramCount}`;
      queryParams.push(parseFloat(gm_min));
      paramCount++;
    }

    if (gm_max) {
      queryText += ` AND CAST(gm_percent AS NUMERIC) <= $${paramCount}`;
      queryParams.push(parseFloat(gm_max));
      paramCount++;
    }

    if (case_minimum_min) {
      queryText += ` AND CAST(case_minimum AS NUMERIC) >= $${paramCount}`;
      queryParams.push(parseFloat(case_minimum_min));
      paramCount++;
    }

    if (case_minimum_max) {
      queryText += ` AND CAST(case_minimum AS NUMERIC) <= $${paramCount}`;
      queryParams.push(parseFloat(case_minimum_max));
      paramCount++;
    }

    // Sorting
    const sortField = sort || 'vendor_name';
    const sortOrder = order || 'asc';

    // Validate sort field
    const allowedSortFields = ['product_name', 'vendor_name', 'wholesale_case_price', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'vendor_name';
    const validSortOrder = (sortOrder === 'desc') ? 'DESC' : 'ASC';

    queryText += ` ORDER BY ${validSortField} ${validSortOrder}`;

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products for export:', error);
    res.status(500).json({ error: 'Error fetching products for export' });
  }
});

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
      limit,
      // Admin-only filter to fetch products for a specific buyer
      buyerEmail
    } = req.query;

    // Pagination setup
    const pageLimit = limit ? Math.min(parseInt(limit), 100) : null; // Max 100 items per request
    const useCursorPagination = cursor !== undefined || limit !== undefined;

    let queryText = 'SELECT p.*, v.about as vendor_about, v.story as vendor_story, v.logo_url as vendor_logo, v.website_url as vendor_website FROM products p LEFT JOIN vendors v ON p.vendor_connect_id = v.vendor_connect_id WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Apply product filtering for non-admin users (buyers) OR for admin filtering by specific buyer
    const isAdminRole = req.user.role === 'admin' || req.user.role === 'superadmin';
    if ((req.user && !isAdminRole) || (isAdminRole && buyerEmail)) {
      // Determine which user to get assignments for
      let targetUserId;
      if (isAdminRole && buyerEmail) {
        // Admin is fetching products for a specific buyer
        const buyerResult = await query(
          'SELECT id FROM users WHERE email = $1 AND role = $2',
          [buyerEmail, 'buyer']
        );
        if (buyerResult.rows.length === 0) {
          return res.status(404).json({ error: 'Buyer not found' });
        }
        targetUserId = buyerResult.rows[0].id;
      } else {
        // Regular buyer fetching their own products
        targetUserId = req.user.id;
      }

      // Get user's assigned product IDs
      const userResult = await query(
        'SELECT assigned_product_ids FROM users WHERE id = $1',
        [targetUserId]
      );

      if (userResult.rows.length > 0) {
        const assignedProductIds = userResult.rows[0].assigned_product_ids;

        // If user has assigned product IDs, filter products by those product_connect_ids
        if (assignedProductIds && assignedProductIds.length > 0) {
          queryText += ` AND p.product_connect_id = ANY($${paramCount})`;
          queryParams.push(assignedProductIds);
          paramCount++;
        } else {
          // If no products assigned, return empty result set
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
      queryText += ` AND (p.${sortField}, p.id) ${operator} ($${paramCount}, $${paramCount + 1})`;
      queryParams.push(cursorData[sortField], cursorData.id);
      paramCount += 2;
    }

    // Add search filter
    if (search) {
      queryText += ` AND (p.product_name ILIKE $${paramCount} OR p.product_description ILIKE $${paramCount} OR p.vendor_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Text exact match filters
    if (id) {
      queryText += ` AND p.id = $${paramCount}`;
      queryParams.push(id);
      paramCount++;
    }

    if (vendor_connect_id) {
      queryText += ` AND p.vendor_connect_id = $${paramCount}`;
      queryParams.push(vendor_connect_id);
      paramCount++;
    }

    if (upc) {
      queryText += ` AND p.upc = $${paramCount}`;
      queryParams.push(upc);
      paramCount++;
    }

    // Text contains filters
    if (product_name) {
      queryText += ` AND p.product_name ILIKE $${paramCount}`;
      queryParams.push(`%${product_name}%`);
      paramCount++;
    }

    if (size) {
      queryText += ` AND p.size ILIKE $${paramCount}`;
      queryParams.push(`%${size}%`);
      paramCount++;
    }

    if (shelf_life) {
      queryText += ` AND p.shelf_life ILIKE $${paramCount}`;
      queryParams.push(`%${shelf_life}%`);
      paramCount++;
    }

    if (delivery_info) {
      queryText += ` AND p.delivery_info ILIKE $${paramCount}`;
      queryParams.push(`%${delivery_info}%`);
      paramCount++;
    }

    if (notes) {
      queryText += ` AND p.notes ILIKE $${paramCount}`;
      queryParams.push(`%${notes}%`);
      paramCount++;
    }

    // Vendor filter (multi-select array)
    if (vendor) {
      try {
        const vendorArray = Array.isArray(vendor) ? vendor : JSON.parse(vendor);
        if (vendorArray.length > 0) {
          queryText += ` AND p.vendor_name = ANY($${paramCount})`;
          queryParams.push(vendorArray);
          paramCount++;
        }
      } catch (e) {
        // Fallback for backward compatibility: treat as single string
        queryText += ` AND p.vendor_name = $${paramCount}`;
        queryParams.push(vendor);
        paramCount++;
      }
    }

    if (state) {
      queryText += ` AND p.state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    if (category) {
      queryText += ` AND p.category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (cuisine_type) {
      try {
        const cuisineArray = JSON.parse(cuisine_type);
        if (Array.isArray(cuisineArray) && cuisineArray.length > 0) {
          queryText += ` AND p.cuisine_type = ANY($${paramCount})`;
          queryParams.push(cuisineArray);
          paramCount++;
        }
      } catch (e) {
        queryText += ` AND p.cuisine_type = $${paramCount}`;
        queryParams.push(cuisine_type);
        paramCount++;
      }
    }

    if (seasonal_featured) {
      queryText += ` AND p.seasonal_featured = $${paramCount}`;
      queryParams.push(seasonal_featured);
      paramCount++;
    }

    // Multi-select filters (arrays)
    if (main_categories) {
      try {
        const categoriesArray = JSON.parse(main_categories);
        if (categoriesArray.length > 0) {
          queryText += ` AND p.main_category = ANY($${paramCount})`;
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
          queryText += ` AND p.sub_category = ANY($${paramCount})`;
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
            const condition = `p.allergens ILIKE $${paramCount}`;
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
            const condition = `p.dietary_preferences ILIKE $${paramCount}`;
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
      queryText += ` AND CAST(p.case_pack AS NUMERIC) >= $${paramCount}`;
      queryParams.push(case_pack_min);
      paramCount++;
    }

    if (case_pack_max) {
      queryText += ` AND CAST(p.case_pack AS NUMERIC) <= $${paramCount}`;
      queryParams.push(case_pack_max);
      paramCount++;
    }

    if (price_min) {
      queryText += ` AND p.wholesale_case_price >= $${paramCount}`;
      queryParams.push(price_min);
      paramCount++;
    }

    if (price_max) {
      queryText += ` AND p.wholesale_case_price <= $${paramCount}`;
      queryParams.push(price_max);
      paramCount++;
    }

    if (unit_price_min) {
      queryText += ` AND p.wholesale_unit_price >= $${paramCount}`;
      queryParams.push(unit_price_min);
      paramCount++;
    }

    if (unit_price_max) {
      queryText += ` AND p.wholesale_unit_price <= $${paramCount}`;
      queryParams.push(unit_price_max);
      paramCount++;
    }

    if (msrp_min) {
      queryText += ` AND p.retail_unit_price >= $${paramCount}`;
      queryParams.push(msrp_min);
      paramCount++;
    }

    if (msrp_max) {
      queryText += ` AND p.retail_unit_price <= $${paramCount}`;
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
      queryText += ` AND p.popular = true`;
    }

    if (seasonal === 'true') {
      queryText += ` AND p.seasonal = true`;
    }

    if (isNew === 'true') {
      queryText += ` AND p.new = true`;
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
    queryText += ` ORDER BY p.${validSortField} ${validSortOrder}, p.id ${validSortOrder}`;

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
router.get('/ids', authenticate, requireSuperAdmin, async (req, res) => {
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
      try {
        const cuisineArray = JSON.parse(cuisine_type);
        if (Array.isArray(cuisineArray) && cuisineArray.length > 0) {
          queryText += ` AND cuisine_type = ANY($${paramCount})`;
          queryParams.push(cuisineArray);
          paramCount++;
        }
      } catch (e) {
        queryText += ` AND cuisine_type = $${paramCount}`;
        queryParams.push(cuisine_type);
        paramCount++;
      }
    }

    if (seasonal_featured) {
      queryText += ` AND seasonal_and_featured = $${paramCount}`;
      queryParams.push(seasonal_featured);
      paramCount++;
    }

    // Boolean filters
    if (popular === 'true') {
      queryText += ` AND p.popular = true`;
    }

    if (seasonal === 'true') {
      queryText += ` AND p.seasonal = true`;
    }

    if (isNew === 'true') {
      queryText += ` AND p.new = true`;
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

// Get products grouped by vendor (for product assignment UI)
// IMPORTANT: This must come BEFORE /:id route to avoid matching "grouped-by-vendor" as an ID
// Returns product_connect_id for each product
router.get('/grouped-by-vendor', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    // Get all products grouped by vendor_name
    const productsResult = await query(`
      SELECT
        id,
        product_connect_id,
        product_name,
        vendor_name,
        vendor_connect_id,
        size,
        wholesale_case_price,
        wholesale_unit_price,
        retail_unit_price,
        product_image,
        main_category,
        sub_category
      FROM products
      WHERE vendor_name IS NOT NULL AND vendor_name != ''
      ORDER BY vendor_name ASC, product_name ASC
    `);

    // Group products by vendor_name
    const vendorMap = new Map();

    productsResult.rows.forEach(product => {
      const vendorName = product.vendor_name;

      if (!vendorMap.has(vendorName)) {
        vendorMap.set(vendorName, {
          id: vendorName, // Use vendor_name as ID since we're grouping by name
          name: vendorName,
          logo_url: null,
          website_url: null,
          products: [],
          product_count: 0
        });
      }

      const vendor = vendorMap.get(vendorName);
      vendor.products.push({
        id: product.id,
        product_connect_id: product.product_connect_id,
        product_name: product.product_name,
        vendor_connect_id: product.vendor_connect_id,
        size: product.size,
        wholesale_case_price: product.wholesale_case_price,
        wholesale_unit_price: product.wholesale_unit_price,
        retail_unit_price: product.retail_unit_price,
        product_image: product.product_image,
        main_category: product.main_category,
        sub_category: product.sub_category
      });
      vendor.product_count++;
    });

    // Convert map to array
    const vendors = Array.from(vendorMap.values());

    res.json({
      vendors: vendors,
      total_vendors: vendors.length,
      total_products: productsResult.rows.length
    });
  } catch (error) {
    console.error('Error fetching products grouped by vendor:', error);
    res.status(500).json({ error: 'Error fetching products grouped by vendor' });
  }
});

// Get similar products by category
router.get('/:id/similar', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, sameVendorOnly } = req.query;
    const onlySameVendor = sameVendorOnly === 'true';

    // First, get the original product to find its categories and vendor
    const productResult = await query(
      'SELECT id, sub_category, main_category, vendor_name, vendor_connect_id FROM products WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];
    let similarProducts = [];

    // Build vendor filter condition - handle NULL vendor_connect_id
    let vendorCondition, vendorParams;
    if (onlySameVendor) {
      // Same vendor: match by vendor_name as fallback if vendor_connect_id is null
      if (product.vendor_connect_id) {
        vendorCondition = 'AND (p.vendor_connect_id = $4 OR (p.vendor_connect_id IS NULL AND p.vendor_name = $5))';
        vendorParams = [product.vendor_connect_id, product.vendor_name];
      } else {
        vendorCondition = 'AND p.vendor_name = $4';
        vendorParams = [product.vendor_name];
      }
    } else {
      // Other vendors: exclude current vendor by vendor_name
      if (product.vendor_connect_id) {
        vendorCondition = 'AND p.vendor_connect_id != $4 AND (p.vendor_connect_id IS NOT NULL OR p.vendor_name != $5)';
        vendorParams = [product.vendor_connect_id, product.vendor_name];
      } else {
        vendorCondition = 'AND p.vendor_name != $4';
        vendorParams = [product.vendor_name];
      }
    }

    // Try to find products with same sub_category first
    if (product.sub_category) {
      const subCategoryResult = await query(
        `SELECT p.*, v.about as vendor_about, v.story as vendor_story, v.logo_url as vendor_logo, v.website_url as vendor_website
         FROM products p
         LEFT JOIN vendors v ON p.vendor_connect_id = v.vendor_connect_id
         WHERE p.sub_category = $1 AND p.id != $2 ${vendorCondition}
         ORDER BY p.product_name ASC
         LIMIT $3`,
        [product.sub_category, id, parseInt(limit), ...vendorParams]
      );
      similarProducts = subCategoryResult.rows;
    }

    // If no products found with sub_category, try main_category
    if (similarProducts.length === 0 && product.main_category) {
      const mainCategoryResult = await query(
        `SELECT p.*, v.about as vendor_about, v.story as vendor_story, v.logo_url as vendor_logo, v.website_url as vendor_website
         FROM products p
         LEFT JOIN vendors v ON p.vendor_connect_id = v.vendor_connect_id
         WHERE p.main_category = $1 AND p.id != $2 ${vendorCondition}
         ORDER BY p.product_name ASC
         LIMIT $3`,
        [product.main_category, id, parseInt(limit), ...vendorParams]
      );
      similarProducts = mainCategoryResult.rows;
    }

    res.json({
      originalProduct: product,
      similarProducts,
      matchedBy: similarProducts.length > 0
        ? (product.sub_category && similarProducts.length > 0 ? 'sub_category' : 'main_category')
        : null,
      sameVendorOnly: onlySameVendor
    });
  } catch (error) {
    console.error('Error fetching similar products:', error);
    res.status(500).json({ error: 'Error fetching similar products' });
  }
});

// Get single product
// IMPORTANT: This must come AFTER specific routes like /grouped-by-vendor and /:id/similar
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to fetch by product_connect_id first (if numeric), fallback to id
    const isNumeric = /^\d+$/.test(id);
    let result;

    if (isNumeric) {
      // Try product_connect_id first
      result = await query('SELECT * FROM products WHERE product_connect_id = $1', [id]);

      // If not found, try id
      if (result.rows.length === 0) {
        result = await query('SELECT * FROM products WHERE id = $1', [id]);
      }
    } else {
      // Not numeric, only try id
      result = await query('SELECT * FROM products WHERE id = $1', [id]);
    }

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
router.post('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const {
      product_connect_id,
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
      category,
      is_split_case,
      minimum_units,
      minimum_cost
    } = req.body;

    const result = await query(
      `INSERT INTO products (
        product_connect_id, vendor_name, state, product_name, product_description, size, case_pack,
        upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
        order_qty, stock_level, product_image, popular, new, category,
        is_split_case, minimum_units, minimum_cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        product_connect_id || null, vendor_name, state, product_name, product_description, size, case_pack || null,
        upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
        order_qty || 0, stock_level || 0, product_image, popular || false,
        isNew || false, category,
        is_split_case !== undefined ? is_split_case : false,
        minimum_units || null,
        minimum_cost || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error creating product' });
  }
});

// Update product (Admin only)
router.put('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_connect_id,
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
      category,
      is_split_case,
      minimum_units,
      minimum_cost
    } = req.body;

    const result = await query(
      `UPDATE products SET
        product_connect_id = $1, vendor_name = $2, state = $3, product_name = $4, product_description = $5,
        size = $6, case_pack = $7, upc = $8, wholesale_case_price = $9,
        wholesale_unit_price = $10, retail_unit_price = $11, order_qty = $12,
        stock_level = $13, product_image = $14, popular = $15, new = $16,
        category = $17, is_split_case = $18, minimum_units = $19, minimum_cost = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21
      RETURNING *`,
      [
        product_connect_id || null, vendor_name, state, product_name, product_description, size, case_pack || null,
        upc, wholesale_case_price, wholesale_unit_price, retail_unit_price,
        order_qty || 0, stock_level || 0, product_image, popular || false, isNew || false, category,
        is_split_case !== undefined ? is_split_case : false,
        minimum_units || null,
        minimum_cost || null,
        id
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
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
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
router.post('/bulk-delete', authenticate, requireSuperAdmin, async (req, res) => {
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
router.post('/bulk-import', authenticate, requireSuperAdmin, async (req, res) => {
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
          product_connect_id: product['Product Connect ID'] || product.product_connect_id || null,
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
          product_image: product['Image'] || product.product_image || 'https://connect.cureate.co/assets/layout/product_placeholder-bad273c886e8a66164d91ed147868c9189aa626a1c3960a14adcccbac595afa1.png',
          // New fields
          is_split_case: product['Is Split Case'] || product.is_split_case || false,
          minimum_units: product['Minimum Units'] || product.minimum_units || null,
          minimum_cost: product['Minimum Cost'] || product.minimum_cost || null,
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

        // Check if product has an ID or product_connect_id (update) or not (create)
        let existingProduct = null;

        // First try to find by id if provided
        if (productData.id && productData.id !== '') {
          const checkResult = await query('SELECT id FROM products WHERE id = $1', [productData.id]);
          if (checkResult.rows.length > 0) {
            existingProduct = checkResult.rows[0];
          }
        }

        // If not found by id, try by product_connect_id
        if (!existingProduct && productData.product_connect_id && productData.product_connect_id !== '') {
          const checkResult = await query('SELECT id FROM products WHERE product_connect_id = $1', [productData.product_connect_id]);
          if (checkResult.rows.length > 0) {
            existingProduct = checkResult.rows[0];
          }
        }

        if ((productData.id && productData.id !== '') || (productData.product_connect_id && productData.product_connect_id !== '')) {
          // Update mode requested
          if (!existingProduct) {
            // Product not found, create as new product (this is expected behavior)
            // No error message needed as creating new products is intentional
            await query(
              `INSERT INTO products (
                product_connect_id, vendor_connect_id, vendor_name, product_name, main_category, sub_category,
                allergens, dietary_preferences, cuisine_type, seasonal_and_featured, size, case_pack,
                wholesale_case_price, wholesale_unit_price, retail_unit_price, case_minimum, shelf_life,
                upc, state, delivery_info, notes, product_image, popular, seasonal, new, category, product_description,
                is_split_case, minimum_units, minimum_cost
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)`,
              [
                productData.product_connect_id, productData.vendor_connect_id, productData.vendor_name, productData.product_name,
                productData.main_category, productData.sub_category, productData.allergens, productData.dietary_preferences,
                productData.cuisine_type, productData.seasonal_and_featured, productData.size, productData.case_pack,
                productData.wholesale_case_price, productData.wholesale_unit_price, productData.retail_unit_price,
                productData.case_minimum, productData.shelf_life, productData.upc, productData.state,
                productData.delivery_info, productData.notes, productData.product_image,
                popular, seasonal, isNew, productData.category, productData.product_description,
                productData.is_split_case, productData.minimum_units, productData.minimum_cost
              ]
            );
            created++;
          } else {
            // Update existing product (found by id or product_connect_id)
            await query(
              `UPDATE products SET
                product_connect_id = $1, vendor_connect_id = $2, vendor_name = $3, product_name = $4, main_category = $5, sub_category = $6,
                allergens = $7, dietary_preferences = $8, cuisine_type = $9, seasonal_and_featured = $10, size = $11, case_pack = $12,
                wholesale_case_price = $13, wholesale_unit_price = $14, retail_unit_price = $15, case_minimum = $16, shelf_life = $17,
                upc = $18, state = $19, delivery_info = $20, notes = $21, product_image = $22, popular = $23, seasonal = $24,
                new = $25, category = $26, product_description = $27, is_split_case = $28, minimum_units = $29, minimum_cost = $30,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $31`,
              [
                productData.product_connect_id, productData.vendor_connect_id, productData.vendor_name, productData.product_name,
                productData.main_category, productData.sub_category, productData.allergens, productData.dietary_preferences,
                productData.cuisine_type, productData.seasonal_and_featured, productData.size, productData.case_pack,
                productData.wholesale_case_price, productData.wholesale_unit_price, productData.retail_unit_price,
                productData.case_minimum, productData.shelf_life, productData.upc, productData.state,
                productData.delivery_info, productData.notes, productData.product_image,
                popular, seasonal, isNew, productData.category, productData.product_description,
                productData.is_split_case, productData.minimum_units, productData.minimum_cost,
                existingProduct.id
              ]
            );
            updated++;
          }
        } else {
          // Create new product (no ID provided)
          await query(
            `INSERT INTO products (
              product_connect_id, vendor_connect_id, vendor_name, product_name, main_category, sub_category,
              allergens, dietary_preferences, cuisine_type, seasonal_and_featured, size, case_pack,
              wholesale_case_price, wholesale_unit_price, retail_unit_price, case_minimum, shelf_life,
              upc, state, delivery_info, notes, product_image, popular, seasonal, new, category, product_description,
              is_split_case, minimum_units, minimum_cost
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)`,
            [
              productData.product_connect_id, productData.vendor_connect_id, productData.vendor_name, productData.product_name,
              productData.main_category, productData.sub_category, productData.allergens, productData.dietary_preferences,
              productData.cuisine_type, productData.seasonal_and_featured, productData.size, productData.case_pack,
              productData.wholesale_case_price, productData.wholesale_unit_price, productData.retail_unit_price,
              productData.case_minimum, productData.shelf_life, productData.upc, productData.state,
              productData.delivery_info, productData.notes, productData.product_image,
              popular, seasonal, isNew, productData.category, productData.product_description,
              productData.is_split_case, productData.minimum_units, productData.minimum_cost
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
