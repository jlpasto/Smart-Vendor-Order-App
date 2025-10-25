import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Bulk import vendors (Admin only) - MUST be before /:id route
router.post('/bulk-import', authenticate, requireAdmin, async (req, res) => {
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
        // Validate required fields
        if (!vendor.name || vendor.name.trim() === '') {
          errors.push(`Row ${i + 1}: Vendor name is required`);
          failed++;
          continue;
        }

        // Check if vendor has an ID and if it exists in the database
        if (vendor.id && vendor.id !== '') {
          const checkResult = await query('SELECT id FROM vendors WHERE id = $1', [vendor.id]);

          if (checkResult.rows.length === 0) {
            // ID provided but doesn't exist - create new vendor
            const result = await query(
              `INSERT INTO vendors (
                name, state, city, website_url, logo_url, description, email, phone
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id`,
              [
                vendor.name,
                vendor.state || null,
                vendor.city || null,
                vendor.website_url || null,
                vendor.logo_url || null,
                vendor.description || null,
                vendor.email || null,
                vendor.phone || null
              ]
            );
            created++;
          } else {
            // ID exists - update existing vendor
            await query(
              `UPDATE vendors SET
                name = $1, state = $2, city = $3, website_url = $4,
                logo_url = $5, description = $6, email = $7, phone = $8,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $9`,
              [
                vendor.name,
                vendor.state || null,
                vendor.city || null,
                vendor.website_url || null,
                vendor.logo_url || null,
                vendor.description || null,
                vendor.email || null,
                vendor.phone || null,
                vendor.id
              ]
            );
            updated++;
          }
        } else {
          // No ID provided - create new vendor
          await query(
            `INSERT INTO vendors (
              name, state, city, website_url, logo_url, description, email, phone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              vendor.name,
              vendor.state || null,
              vendor.city || null,
              vendor.website_url || null,
              vendor.logo_url || null,
              vendor.description || null,
              vendor.email || null,
              vendor.phone || null
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

// Get all vendors (public - anyone can view)
router.get('/', async (req, res) => {
  try {
    const { search, state, city } = req.query;

    let queryText = 'SELECT * FROM vendors WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    // Add search filter
    if (search) {
      queryText += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR city ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Add state filter
    if (state) {
      queryText += ` AND state = $${paramCount}`;
      queryParams.push(state);
      paramCount++;
    }

    // Add city filter
    if (city) {
      queryText += ` AND city = $${paramCount}`;
      queryParams.push(city);
      paramCount++;
    }

    queryText += ' ORDER BY name ASC';

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Error fetching vendors' });
  }
});

// Get single vendor (public)
router.get('/:id', async (req, res) => {
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

// Get unique states (for filters)
router.get('/filters/states', async (req, res) => {
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

// Get unique cities (for filters)
router.get('/filters/cities', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT city FROM vendors WHERE city IS NOT NULL ORDER BY city'
    );
    res.json(result.rows.map(row => row.city));
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Error fetching cities' });
  }
});

// Create vendor (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      state,
      city,
      website_url,
      logo_url,
      description,
      email,
      phone
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Vendor name is required' });
    }

    const result = await query(
      `INSERT INTO vendors (
        name, state, city, website_url, logo_url, description, email, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, state, city, website_url, logo_url, description, email, phone]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Error creating vendor' });
  }
});

// Update vendor (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      state,
      city,
      website_url,
      logo_url,
      description,
      email,
      phone
    } = req.body;

    const result = await query(
      `UPDATE vendors SET
        name = $1, state = $2, city = $3, website_url = $4,
        logo_url = $5, description = $6, email = $7, phone = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [name, state, city, website_url, logo_url, description, email, phone, id]
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
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
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
