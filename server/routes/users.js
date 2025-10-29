import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

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

// Get all users (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, id_no, role, assigned_vendor_ids, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get single user (Admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, name, email, id_no, role, assigned_vendor_ids, created_at FROM users WHERE id = $1',
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
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, id_no, password } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Use provided password or generate random one
    const finalPassword = password || generatePassword();

    const result = await query(
      `INSERT INTO users (name, email, password, id_no, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, id_no, role, created_at`,
      [name, email, finalPassword, id_no, 'user']
    );

    // Return the created user with the password
    res.status(201).json({
      ...result.rows[0],
      password: finalPassword // Include password in response so admin can share it
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, id_no, password, role, assigned_vendors } = req.body;

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

    if (password !== undefined) {
      updates.push(`password = $${paramCount}`);
      values.push(password);
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

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, email, id_no, role, assigned_vendor_ids, created_at`,
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
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
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
