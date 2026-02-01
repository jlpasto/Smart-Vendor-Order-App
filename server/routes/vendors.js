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

// Bulk import vendors (Admin only) - MUST be before /:id route
router.post('/bulk-import', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { vendors } = req.body;

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return res.status(400).json({ error: 'No vendors data provided' });
    }

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < vendors.length; i++) {
      const vendor = vendors[i];

      try {
        // Map Excel column names to database fields
        const vendorData = {
          vendor_connect_id: vendor['Vendor Connect ID'] ? parseInt(vendor['Vendor Connect ID']) : null,
          name: vendor['Vendor Name'] || null,
          website_url: vendor['URL'] || null,
          logo_url: vendor['Logo'] || null,
          phone: vendor['Phone'] || null,
          email: vendor['Email'] || null,
          address: vendor['Address'] || null,
          city: vendor['City'] || null,
          state: vendor['State'] || null,
          territory: vendor['Territory'] || null,
          about: vendor['About'] || null,
          story: vendor['Story'] || null
        };

        // Debug log for first row to help troubleshoot
        if (i === 0) {
          console.log('First vendor row columns:', Object.keys(vendor));
          console.log('Mapped vendor data:', vendorData);
        }

        // Validate required fields
        if (!vendorData.name || vendorData.name.trim() === '') {
          console.log(`Row ${i + 1} failed - columns available:`, Object.keys(vendor));
          errors.push(`Row ${i + 1}: Vendor Name is required`);
          failed++;
          continue;
        }

        if (!vendorData.vendor_connect_id || isNaN(vendorData.vendor_connect_id)) {
          errors.push(`Row ${i + 1}: Vendor Connect ID is required and must be a valid integer`);
          failed++;
          continue;
        }

        // Check if vendor exists by vendor_connect_id
        let existingVendor = null;

        if (vendorData.vendor_connect_id) {
          // Check by vendor_connect_id (primary key)
          const checkResult = await query('SELECT vendor_connect_id FROM vendors WHERE vendor_connect_id = $1', [vendorData.vendor_connect_id]);
          if (checkResult.rows.length > 0) {
            existingVendor = checkResult.rows[0];
          }
        }

        if (existingVendor) {
          // Vendor exists - update it
          await query(
            `UPDATE vendors SET
              name = $1, website_url = $2, logo_url = $3,
              phone = $4, email = $5, address = $6, city = $7, state = $8, territory = $9,
              about = $10, story = $11, updated_at = CURRENT_TIMESTAMP
            WHERE vendor_connect_id = $12`,
            [
              vendorData.name,
              vendorData.website_url,
              vendorData.logo_url,
              vendorData.phone,
              vendorData.email,
              vendorData.address,
              vendorData.city,
              vendorData.state,
              vendorData.territory,
              vendorData.about,
              vendorData.story,
              vendorData.vendor_connect_id
            ]
          );
          updated++;
        } else {
          // Vendor doesn't exist - create new one
          await query(
            `INSERT INTO vendors (
              vendor_connect_id, name, website_url, logo_url, phone, email, address, city, state, territory, about, story
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              vendorData.vendor_connect_id,
              vendorData.name,
              vendorData.website_url,
              vendorData.logo_url,
              vendorData.phone,
              vendorData.email,
              vendorData.address,
              vendorData.city,
              vendorData.state,
              vendorData.territory,
              vendorData.about,
              vendorData.story
            ]
          );
          created++;
        }
      } catch (error) {
        console.error(`Error processing vendor at row ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: ${error.message}`);
        failed++;
      }
    }

    res.json({
      success: true,
      created,
      updated,
      failed,
      total: vendors.length,
      errors
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Error importing vendors: ' + error.message });
  }
});

// Get all vendors for export (Admin only) - returns all vendors without pagination
router.get('/export', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { search, state, territory, sort, order } = req.query;

    let queryText = 'SELECT * FROM vendors WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Add search filter
    if (search) {
      queryText += ` AND (name ILIKE $${paramCount} OR address ILIKE $${paramCount} OR territory ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Add state filter
    if (state) {
      queryText += ` AND state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    // Add territory filter
    if (territory) {
      queryText += ` AND territory = $${paramCount}`;
      queryParams.push(territory);
      paramCount++;
    }

    // Sorting
    const sortField = sort || 'name';
    const sortOrder = order || 'asc';

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['name', 'state', 'territory', 'vendor_connect_id', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'name';
    const validSortOrder = (sortOrder === 'desc') ? 'DESC' : 'ASC';

    queryText += ` ORDER BY ${validSortField} ${validSortOrder}`;

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendors for export:', error);
    res.status(500).json({ error: 'Error fetching vendors for export' });
  }
});

// Get all vendors (Admin only)
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { search, state, territory, cursor, limit, sort, order } = req.query;

    // Pagination setup
    const pageLimit = limit ? Math.min(parseInt(limit), 100) : null; // Max 100 items per request
    const useCursorPagination = cursor !== undefined || limit !== undefined;

    let queryText = 'SELECT * FROM vendors WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Decode and apply cursor if provided
    if (cursor) {
      const cursorData = decodeCursor(cursor);
      if (!cursorData) {
        return res.status(400).json({ error: 'Invalid cursor' });
      }

      // Determine sort field and order
      const sortField = sort || 'name';
      const sortOrder = order || 'asc';
      const operator = sortOrder.toLowerCase() === 'asc' ? '>' : '<';

      // Apply cursor condition
      queryText += ` AND (${sortField}, id) ${operator} ($${paramCount}, $${paramCount + 1})`;
      queryParams.push(cursorData[sortField], cursorData.id);
      paramCount += 2;
    }

    // Add search filter
    if (search) {
      queryText += ` AND (name ILIKE $${paramCount} OR address ILIKE $${paramCount} OR territory ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Add state filter
    if (state) {
      queryText += ` AND state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    // Add territory filter
    if (territory) {
      queryText += ` AND territory = $${paramCount}`;
      queryParams.push(territory);
      paramCount++;
    }

    // Sorting
    const sortField = sort || 'name'; // Default sort by name
    const sortOrder = order || 'asc'; // Default ascending (A-Z)

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['name', 'state', 'territory', 'vendor_connect_id', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'name';

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
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Error fetching vendors' });
  }
});

// Get single vendor (Admin only)
router.get('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM vendors WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Error fetching vendor' });
  }
});

// Get unique states (for filters) - Admin only
router.get('/filters/states', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT state FROM vendors WHERE state IS NOT NULL ORDER BY state'
    );
    res.json(result.rows.map(row => row.state));
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Error fetching states' });
  }
});

// Get unique territories (for filters) - Admin only
router.get('/filters/territories', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT territory FROM vendors WHERE territory IS NOT NULL ORDER BY territory'
    );
    res.json(result.rows.map(row => row.territory));
  } catch (error) {
    console.error('Error fetching territories:', error);
    res.status(500).json({ error: 'Error fetching territories' });
  }
});

// Create vendor (Admin only)
router.post('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const {
      vendor_connect_id,
      name,
      website_url,
      logo_url,
      phone,
      email,
      address,
      city,
      state,
      territory,
      about,
      story
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Vendor name is required' });
    }

    // Convert vendor_connect_id to integer if provided
    const vendorConnectIdInt = vendor_connect_id ? parseInt(vendor_connect_id) : null;

    const result = await query(
      `INSERT INTO vendors (
        vendor_connect_id, name, website_url, logo_url, phone, email, address, city, state, territory, about, story
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [vendorConnectIdInt, name, website_url, logo_url, phone, email, address, city, state, territory, about, story]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Error creating vendor' });
  }
});

// Update vendor (Admin only)
router.put('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendor_connect_id,
      name,
      website_url,
      logo_url,
      phone,
      email,
      address,
      city,
      state,
      territory,
      about,
      story
    } = req.body;

    // Convert vendor_connect_id to integer if provided
    const vendorConnectIdInt = vendor_connect_id ? parseInt(vendor_connect_id) : null;

    const result = await query(
      `UPDATE vendors SET
        vendor_connect_id = $1, name = $2, website_url = $3, logo_url = $4,
        phone = $5, email = $6, address = $7, city = $8, state = $9, territory = $10,
        about = $11, story = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
      [vendorConnectIdInt, name, website_url, logo_url, phone, email, address, city, state, territory, about, story, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Error updating vendor' });
  }
});

// Delete vendor (Admin only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM vendors WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Error deleting vendor' });
  }
});

export default router;
