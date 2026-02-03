import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// Generate random password
const generatePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Generate unique alphanumeric access code
const generateAccessCode = async () => {
  const length = 8;
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I

  let attempts = 0;
  while (attempts < 10) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Check if code already exists
    const existing = await query('SELECT id FROM users WHERE access_code = $1', [code]);
    if (existing.rows.length === 0) {
      return code;
    }
    attempts++;
  }
  throw new Error('Failed to generate unique access code');
};

// Helper function to parse cell values
function parseCellValue(value) {
  if (value === null || value === undefined || value === '') return false;

  const strValue = String(value).trim().toLowerCase();

  // Truthy values
  if (['1', 'true', 'yes', 'y', '✓', 'x'].includes(strValue)) return true;

  // Falsy values
  if (['0', 'false', 'no', 'n', ''].includes(strValue)) return false;

  // Numeric comparison
  return parseFloat(value) !== 0;
}

// Get current user's profile (Any authenticated user)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, access_code, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update current user's profile (Any authenticated user)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, access_code } = req.body;
    const userId = req.user.id;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email !== undefined) {
      // Check if email already exists for another user
      const existingUser = await query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
        [email, userId]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (access_code !== undefined) {
      // Check if access code already exists for another user
      const existingCode = await query(
        'SELECT id FROM users WHERE UPPER(access_code) = UPPER($1) AND id != $2',
        [access_code, userId]
      );
      if (existingCode.rows.length > 0) {
        return res.status(400).json({ error: 'Access code already in use' });
      }
      updates.push(`access_code = $${paramCount}`);
      values.push(access_code.toUpperCase());
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, email, access_code, role`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Get all buyers (Admin only) - excludes admin and superadmin users
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, access_code, id_no, territory, role, assigned_vendor_ids, assigned_product_ids, created_at
       FROM users
       WHERE role = 'buyer'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Export buyer-product assignments as matrix (Admin only)
router.get('/export-assignments', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    // Debug: Check all users and their roles
    const allUsersResult = await query('SELECT id, name, email, role FROM users');
    console.log('Export: All users in database:', allUsersResult.rows);

    // Step 1: Get all buyers with their assignments
    const buyersResult = await query(
      'SELECT id, name, email, territory, assigned_product_ids FROM users WHERE role = $1 ORDER BY id ASC',
      ['buyer']
    );
    const buyers = buyersResult.rows;
    console.log('Export: Found buyers with role=buyer:', buyers.length, buyers);

    // Step 2: Get all products
    const productsResult = await query(
      `SELECT product_connect_id, product_name, vendor_name
       FROM products
       WHERE product_connect_id IS NOT NULL
       ORDER BY vendor_name ASC, product_name ASC`
    );
    const products = productsResult.rows;
    console.log('Export: Found products:', products.length);

    // Step 3: Build matrix (product-centric: rows = products, cols = buyers)
    const matrixData = products.map(product => {
      const row = {
        product_connect_id: product.product_connect_id,
        product_name: product.product_name,
        vendor_name: product.vendor_name
      };

      // For each buyer, check if product is assigned
      buyers.forEach(buyer => {
        const assignedIds = buyer.assigned_product_ids || [];
        const isAssigned = assignedIds.includes(product.product_connect_id);
        row[`buyer_${buyer.id}`] = isAssigned ? 1 : 0;
      });

      return row;
    });

    // Step 4: Include buyer metadata for frontend to use in column headers
    const buyerMetadata = buyers.map(buyer => ({
      id: buyer.id,
      name: buyer.name || buyer.email,
      email: buyer.email,
      territory: buyer.territory || ''
    }));

    console.log('Export: Sending response with buyers:', buyerMetadata.length);
    res.json({
      matrix: matrixData,
      buyers: buyerMetadata
    });
  } catch (error) {
    console.error('Error exporting assignments:', error);
    res.status(500).json({ error: 'Error exporting assignments' });
  }
});

// Import buyer-product assignments from matrix (Admin only)
router.post('/bulk-assign-products', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'No assignment data provided' });
    }

    const errors = [];
    let buyers_updated = 0;
    const products_processed = new Set();

    // Step 1: Extract buyer IDs from column headers
    const buyerIds = new Set();
    assignments.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key.startsWith('buyer_')) {
          buyerIds.add(parseInt(key.replace('buyer_', '')));
        }
      });
    });

    // Step 2: Validate all buyer IDs exist
    const buyerCheck = await query(
      'SELECT id FROM users WHERE id = ANY($1) AND role = $2',
      [Array.from(buyerIds), 'buyer']
    );
    const validBuyerIds = buyerCheck.rows.map(r => r.id);
    const invalidBuyerIds = Array.from(buyerIds).filter(id => !validBuyerIds.includes(id));

    invalidBuyerIds.forEach(id => {
      errors.push(`Buyer ID ${id} not found in database or is not a buyer`);
    });

    // Step 3: Extract and validate product IDs
    const productIds = assignments
      .map(row => row.product_connect_id)
      .filter(id => id !== null && id !== undefined && id !== '');

    const productCheck = await query(
      'SELECT product_connect_id FROM products WHERE product_connect_id = ANY($1)',
      [productIds]
    );
    const validProductIds = productCheck.rows.map(r => r.product_connect_id);
    const invalidProductIds = productIds.filter(id => !validProductIds.includes(id));

    invalidProductIds.forEach((id, index) => {
      const rowNum = assignments.findIndex(row => row.product_connect_id === id) + 2;
      errors.push(`Row ${rowNum}: Product Connect ID ${id} not found in database`);
    });

    // Step 4: Process each valid buyer
    for (const buyerId of validBuyerIds) {
      const assignedProducts = [];

      // Collect all products assigned to this buyer
      assignments.forEach(row => {
        const productId = row.product_connect_id;

        // Skip invalid products
        if (!validProductIds.includes(productId)) {
          return;
        }

        products_processed.add(productId);

        const cellValue = row[`buyer_${buyerId}`];

        // Parse cell value: 1, "1", true, "✓" = assigned
        const isAssigned = parseCellValue(cellValue);

        if (isAssigned) {
          assignedProducts.push(productId);
        }
      });

      // Step 5: Update buyer's assigned products
      await query(
        'UPDATE users SET assigned_product_ids = $1 WHERE id = $2',
        [assignedProducts, buyerId]
      );

      buyers_updated++;
    }

    res.json({
      success: true,
      buyers_updated,
      products_processed: products_processed.size,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error bulk assigning products:', error);
    res.status(500).json({ error: 'Error bulk assigning products: ' + error.message });
  }
});

// ============================================
// SUPERADMIN ENDPOINTS - Manage Admin Users
// These must come BEFORE /:id routes
// ============================================

// Get all admin users (Superadmin only)
router.get('/admins', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, created_at FROM users
       WHERE role IN ('admin', 'superadmin')
       ORDER BY role DESC, created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Error fetching admin users' });
  }
});

// Create admin user (Superadmin only)
router.post('/admin', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Validate role if provided (only admin or superadmin allowed)
    const validRoles = ['admin', 'superadmin'];
    const finalRole = role && validRoles.includes(role) ? role : 'admin';

    // Check if username already exists (case-insensitive)
    const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Use provided password or generate random one
    const finalPassword = password || generatePassword();

    // Hash the password with bcrypt before storing
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const result = await query(
      `INSERT INTO users (email, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, hashedPassword, finalRole]
    );

    // Return the created admin user with the PLAINTEXT password (only in response, not stored)
    res.status(201).json({
      ...result.rows[0],
      password: finalPassword // Include plaintext password in response so superadmin can share it
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Error creating admin user' });
  }
});

// Delete admin user (Superadmin only)
router.delete('/admin/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Only allow deleting admin users, not superadmins
    const userCheck = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userCheck.rows[0].role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete superadmin users' });
    }
    if (userCheck.rows[0].role !== 'admin') {
      return res.status(400).json({ error: 'This endpoint is only for deleting admin users' });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Admin user deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ error: 'Error deleting admin user' });
  }
});

// Get single user (Admin only)
router.get('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, name, email, access_code, id_no, territory, role, assigned_vendor_ids, assigned_product_ids, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Create user (Admin only)
router.post('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, password } = req.body;

    // Name is required for buyers
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate unique access code
    const accessCode = await generateAccessCode();

    // Auto-generate email using access code (for internal system use)
    const email = `buyer_${accessCode.toLowerCase()}@internal.local`;

    // Use provided password or generate random one
    const finalPassword = password || generatePassword();

    // Hash the password with bcrypt before storing
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const result = await query(
      `INSERT INTO users (name, email, password, access_code, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, access_code, role, created_at`,
      [name.trim(), email, hashedPassword, accessCode, 'buyer']
    );

    // Return the created user with the PLAINTEXT password and access code
    res.status(201).json({
      ...result.rows[0],
      password: finalPassword // Include plaintext password in response so admin can share it
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, id_no, territory, password, role, assigned_vendors, assigned_products } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email !== undefined) {
      // Check if email already exists for another user
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (id_no !== undefined) {
      updates.push(`id_no = $${paramCount}`);
      values.push(id_no);
      paramCount++;
    }

    if (territory !== undefined) {
      updates.push(`territory = $${paramCount}`);
      values.push(territory);
      paramCount++;
    }

    if (password !== undefined) {
      // Hash the password with bcrypt before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (assigned_vendors !== undefined) {
      // Validate vendor IDs exist in vendors table
      if (Array.isArray(assigned_vendors) && assigned_vendors.length > 0) {
        const vendorCheck = await query(
          'SELECT id FROM vendors WHERE id = ANY($1)',
          [assigned_vendors]
        );

        const validVendorIds = vendorCheck.rows.map(row => row.id);
        const invalidVendorIds = assigned_vendors.filter(id => !validVendorIds.includes(id));

        if (invalidVendorIds.length > 0) {
          return res.status(400).json({
            error: `Invalid vendor IDs: ${invalidVendorIds.join(', ')}`
          });
        }
      }

      updates.push(`assigned_vendor_ids = $${paramCount}`);
      values.push(assigned_vendors || []);
      paramCount++;
    }

    if (assigned_products !== undefined) {
      // Validate product_connect_ids exist in products table
      if (Array.isArray(assigned_products) && assigned_products.length > 0) {
        const productCheck = await query(
          'SELECT product_connect_id FROM products WHERE product_connect_id = ANY($1)',
          [assigned_products]
        );

        const validProductIds = productCheck.rows.map(row => row.product_connect_id);
        const invalidProductIds = assigned_products.filter(id => !validProductIds.includes(id));

        if (invalidProductIds.length > 0) {
          return res.status(400).json({
            error: `Invalid product IDs: ${invalidProductIds.join(', ')}`
          });
        }
      }

      updates.push(`assigned_product_ids = $${paramCount}`);
      values.push(assigned_products || []);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, email, access_code, id_no, territory, role, assigned_vendor_ids, assigned_product_ids, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

export default router;
