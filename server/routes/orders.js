import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendOrderConfirmation, sendStatusUpdateEmail } from '../utils/email.js';

const router = express.Router();

// Generate batch order number
const generateBatchNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = now.getTime().toString().slice(-6);
  return `BATCH-${year}-${timestamp}`;
};

// Get all orders for current user
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { startDate, endDate } = req.query;

    let queryText = `
      SELECT * FROM orders
      WHERE user_email = $1
    `;
    const queryParams = [userEmail];
    let paramCount = 2;

    if (startDate) {
      queryText += ` AND date_submitted >= $${paramCount}`;
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND date_submitted <= $${paramCount}`;
      queryParams.push(endDate);
      paramCount++;
    }

    queryText += ' ORDER BY date_submitted DESC';

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Get all batch orders for current user (grouped)
router.get('/my-batches', authenticate, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { startDate, endDate } = req.query;

    let queryText = `
      SELECT
        batch_order_number,
        MIN(date_submitted) as date_submitted,
        MAX(status) as status,
        MAX(notes) as notes,
        SUM(amount) as total_amount,
        COUNT(*) as item_count
      FROM orders
      WHERE user_email = $1
    `;
    const queryParams = [userEmail];
    let paramCount = 2;

    if (startDate) {
      queryText += ` AND date_submitted >= $${paramCount}`;
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND date_submitted <= $${paramCount}`;
      queryParams.push(endDate);
      paramCount++;
    }

    queryText += `
      GROUP BY batch_order_number
      ORDER BY MIN(date_submitted) DESC
    `;

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching batch orders:', error);
    res.status(500).json({ error: 'Error fetching batch orders' });
  }
});

// Get orders by batch number
router.get('/batch/:batchNumber', authenticate, async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const userEmail = req.user.email;

    const result = await query(
      'SELECT * FROM orders WHERE batch_order_number = $1 AND user_email = $2 ORDER BY id',
      [batchNumber, userEmail]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching batch orders:', error);
    res.status(500).json({ error: 'Error fetching batch orders' });
  }
});

// Submit new order (batch of items)
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { items } = req.body; // Array of cart items
    const userEmail = req.user.email;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    const batchNumber = generateBatchNumber();
    const createdOrders = [];

    // Insert each item as an order
    for (const item of items) {
      const price = item.wholesale_case_price || item.wholesale_unit_price || 0;
      const amount = price * item.quantity;

      const result = await query(
        `INSERT INTO orders (
          batch_order_number, product_id, product_name, quantity, amount,
          status, user_email, user_id, date_submitted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          batchNumber,
          item.id,
          item.product_name,
          item.quantity,
          amount,
          'pending',
          userEmail,
          userId
        ]
      );

      createdOrders.push(result.rows[0]);
    }

    // Send email confirmation
    try {
      await sendOrderConfirmation(userEmail, batchNumber, createdOrders);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      message: 'Order submitted successfully',
      batchNumber,
      orders: createdOrders
    });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ error: 'Error submitting order' });
  }
});

// Get all orders (Admin only)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { vendor, status, startDate, endDate } = req.query;

    let queryText = `
      SELECT o.*, p.vendor_name, p.category
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 1;

    if (vendor) {
      queryText += ` AND p.vendor_name = $${paramCount}`;
      queryParams.push(vendor);
      paramCount++;
    }

    if (status) {
      queryText += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    if (startDate) {
      queryText += ` AND o.date_submitted >= $${paramCount}`;
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND o.date_submitted <= $${paramCount}`;
      queryParams.push(endDate);
      paramCount++;
    }

    queryText += ' ORDER BY o.date_submitted DESC';

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Error fetching all orders' });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE orders SET
        status = $1,
        notes = COALESCE($2, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Send status update email
    try {
      await sendStatusUpdateEmail(order.user_email, order, status, notes);
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Error updating order status' });
  }
});

// Update batch status (Admin only)
router.patch('/batch/:batchNumber/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE orders SET
        status = $1,
        notes = COALESCE($2, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE batch_order_number = $3
      RETURNING *`,
      [status, notes, batchNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Send email to user
    const userEmail = result.rows[0].user_email;
    try {
      await sendStatusUpdateEmail(userEmail, result.rows[0], status, notes);
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
    }

    res.json({
      message: 'Batch status updated successfully',
      orders: result.rows
    });
  } catch (error) {
    console.error('Error updating batch status:', error);
    res.status(500).json({ error: 'Error updating batch status' });
  }
});

// Get order statistics (Admin only)
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(DISTINCT batch_order_number) as total_batches,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(amount) as total_revenue,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_revenue
      FROM orders
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Error fetching order stats' });
  }
});

export default router;
