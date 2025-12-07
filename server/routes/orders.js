import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendOrderConfirmation, sendStatusUpdateEmail } from '../utils/email.js';

const router = express.Router();

// Health check endpoint for debugging
router.get('/health', authenticate, async (req, res) => {
  try {
    // Test database connection
    const dbTest = await query('SELECT 1 as test');

    res.json({
      status: 'OK',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      },
      database: dbTest.rows.length > 0 ? 'Connected' : 'Error',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      stack: error.stack
    });
  }
});

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

// Get products for reordering from batch (for "Buy Again" feature)
router.get('/batch/:batchNumber/products', authenticate, async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const userEmail = req.user.email;

    // Get all orders in the batch with current product details
    const result = await query(
      `SELECT
        o.product_connect_id,
        o.product_name as ordered_product_name,
        o.quantity as quantity_ordered,
        p.id,
        p.product_connect_id,
        p.product_name,
        p.vendor_name,
        p.wholesale_case_price,
        p.wholesale_unit_price,
        p.product_image,
        p.product_description,
        p.size,
        p.case_pack,
        p.upc,
        p.retail_unit_price,
        p.stock_level,
        p.category,
        p.main_category,
        p.sub_category,
        p.state
      FROM orders o
      LEFT JOIN products p ON o.product_connect_id = p.product_connect_id
      WHERE o.batch_order_number = $1 AND o.user_email = $2
      ORDER BY o.id`,
      [batchNumber, userEmail]
    );

    // Separate available products from unavailable ones
    const products = [];
    const unavailable = [];

    result.rows.forEach(row => {
      if (row.id) {
        // Product still exists in catalog
        products.push({
          id: row.id,
          product_name: row.product_name,
          vendor_name: row.vendor_name,
          wholesale_case_price: row.wholesale_case_price,
          wholesale_unit_price: row.wholesale_unit_price,
          product_image: row.product_image,
          product_description: row.product_description,
          size: row.size,
          case_pack: row.case_pack,
          upc: row.upc,
          retail_unit_price: row.retail_unit_price,
          stock_level: row.stock_level,
          category: row.category,
          main_category: row.main_category,
          sub_category: row.sub_category,
          state: row.state,
          quantity_ordered: row.quantity_ordered
        });
      } else {
        // Product no longer exists
        unavailable.push({
          product_connect_id: row.product_connect_id,
          product_name: row.ordered_product_name,
          reason: 'Product no longer available in catalog'
        });
      }
    });

    res.json({
      products,
      unavailable,
      total_items: result.rows.length,
      available_count: products.length,
      unavailable_count: unavailable.length
    });
  } catch (error) {
    console.error('Error fetching batch products:', error);
    res.status(500).json({ error: 'Error fetching batch products for reorder' });
  }
});

// Submit new order (batch of items)
router.post('/submit', authenticate, async (req, res) => {
  try {
    console.log('📦 Order submission started');
    console.log('User:', req.user);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { items } = req.body; // Array of cart items
    const userEmail = req.user.email;
    const userId = req.user.id;

    console.log(`👤 User: ${userEmail} (ID: ${userId})`);
    console.log(`📋 Items count: ${items?.length || 0}`);

    if (!items || items.length === 0) {
      console.log('❌ No items in order');
      return res.status(400).json({ error: 'No items in order' });
    }

    const batchNumber = generateBatchNumber();
    console.log(`🎫 Generated batch number: ${batchNumber}`);
    const createdOrders = [];

    // Insert each item as an order
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n📦 Processing item ${i + 1}/${items.length}:`, item.product_name);

      // Extract pricing information
      const pricingMode = item.pricing_mode || 'case';
      const unitPrice = parseFloat(item.wholesale_unit_price || 0);
      const casePrice = parseFloat(item.wholesale_case_price || 0);

      // Calculate amount based on pricing mode
      const price = pricingMode === 'unit' ? unitPrice : casePrice;
      const amount = parseFloat((price * item.quantity).toFixed(2));

      console.log(`💰 Pricing Mode: ${pricingMode}, Unit Price: ${unitPrice}, Case Price: ${casePrice}`);
      console.log(`💰 Price: ${price}, Quantity: ${item.quantity}, Amount: ${amount}`);

      // Get vendor_id by looking up vendor_name in vendors table
      let vendorId = null;
      const vendorName = item.vendor_name;
      console.log(`🏪 Vendor: ${vendorName}`);

      if (vendorName) {
        try {
          const vendorResult = await query(
            'SELECT vendor_connect_id FROM vendors WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [vendorName]
          );
          if (vendorResult.rows.length > 0) {
            vendorId = vendorResult.rows[0].vendor_connect_id;
            console.log(`✓ Vendor ID found: ${vendorId}`);
          } else {
            console.log(`⚠️  Vendor "${vendorName}" not found in vendors table`);
          }
        } catch (vendorError) {
          console.error('❌ Error looking up vendor:', vendorError);
          // Continue with null vendor_id
        }
      }

      console.log(`💾 Inserting order into database...`);
      const result = await query(
        `INSERT INTO orders (
          batch_order_number, product_connect_id, product_name, vendor_connect_id, vendor_name,
          quantity, amount, pricing_mode, unit_price, case_price,
          status, user_email, user_id, date_submitted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          batchNumber,
          item.product_connect_id,
          item.product_name,
          vendorId,
          vendorName,
          item.quantity,
          amount,
          pricingMode,
          unitPrice,
          casePrice,
          'pending',
          userEmail,
          userId
        ]
      );

      const createdOrder = result.rows[0];
      console.log(`✓ Order inserted with ID: ${createdOrder.id}`);

      // Create original snapshot for audit trail
      console.log(`📸 Creating original snapshot...`);
      await query(
        `INSERT INTO order_snapshots (
          order_id, batch_order_number, snapshot_type,
          product_connect_id, product_name, vendor_name,
          quantity, pricing_mode, unit_price, case_price, amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          createdOrder.id,
          batchNumber,
          'original',
          item.product_connect_id,
          item.product_name,
          vendorName,
          item.quantity,
          pricingMode,
          unitPrice,
          casePrice,
          amount
        ]
      );
      console.log(`✓ Original snapshot created`);

      createdOrders.push(createdOrder);
    }

    console.log(`\n✅ All ${createdOrders.length} orders inserted successfully`);

    // Send email confirmation
    console.log('\n📧 Sending email confirmation...');
    try {
      await sendOrderConfirmation(userEmail, batchNumber, createdOrders);
      console.log('✓ Email sent successfully');
    } catch (emailError) {
      console.error('⚠️  Error sending order confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    console.log('\n🎉 Order submission completed successfully!');
    res.status(201).json({
      message: 'Order submitted successfully',
      batchNumber,
      orders: createdOrders
    });
  } catch (error) {
    console.error('\n❌❌❌ ERROR SUBMITTING ORDER ❌❌❌');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Error submitting order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all orders (Admin only)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { vendor, vendor_id, status, startDate, endDate } = req.query;

    let queryText = `
      SELECT o.*, p.category
      FROM orders o
      LEFT JOIN products p ON o.product_connect_id = p.product_connect_id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 1;

    // Filter by vendor_id (preferred) or vendor_name
    if (vendor_id) {
      queryText += ` AND o.vendor_id = $${paramCount}`;
      queryParams.push(vendor_id);
      paramCount++;
    } else if (vendor) {
      queryText += ` AND o.vendor_name = $${paramCount}`;
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

// ============================================
// ORDER MODIFICATION ENDPOINTS (Admin only)
// ============================================

// Helper function to log order changes
const logOrderChange = async (orderId, batchNumber, changeType, fieldChanged, oldValue, newValue, adminNotes, adminId, adminEmail) => {
  try {
    await query(`
      INSERT INTO order_history
      (order_id, batch_order_number, change_type, field_changed, old_value, new_value, admin_notes, changed_by_admin_id, changed_by_admin_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [orderId, batchNumber, changeType, fieldChanged, String(oldValue), String(newValue), adminNotes, adminId, adminEmail]);
  } catch (error) {
    console.error('Error logging order change:', error);
  }
};

// Helper function to calculate amount
const calculateAmount = (quantity, pricingMode, unitPrice, casePrice) => {
  const price = pricingMode === 'unit' ? unitPrice : casePrice;
  return parseFloat((price * quantity).toFixed(2));
};

// Modify individual order (Admin only)
router.patch('/:id/modify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, pricing_mode, unit_price, case_price, admin_notes } = req.body;

    // Fetch current order
    const currentResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = currentResult.rows[0];
    const changes = [];

    // Track what changed
    if (quantity !== undefined && quantity !== currentOrder.quantity) {
      changes.push({ field: 'quantity', old: currentOrder.quantity, new: quantity });
    }
    if (pricing_mode !== undefined && pricing_mode !== currentOrder.pricing_mode) {
      changes.push({ field: 'pricing_mode', old: currentOrder.pricing_mode, new: pricing_mode });
    }
    if (unit_price !== undefined && parseFloat(unit_price) !== parseFloat(currentOrder.unit_price || 0)) {
      changes.push({ field: 'unit_price', old: currentOrder.unit_price, new: unit_price });
    }
    if (case_price !== undefined && parseFloat(case_price) !== parseFloat(currentOrder.case_price || 0)) {
      changes.push({ field: 'case_price', old: currentOrder.case_price, new: case_price });
    }

    if (changes.length === 0 && !admin_notes) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    // Calculate new amount
    const newQuantity = quantity !== undefined ? quantity : currentOrder.quantity;
    const newPricingMode = pricing_mode !== undefined ? pricing_mode : currentOrder.pricing_mode;
    const newUnitPrice = unit_price !== undefined ? parseFloat(unit_price) : parseFloat(currentOrder.unit_price || 0);
    const newCasePrice = case_price !== undefined ? parseFloat(case_price) : parseFloat(currentOrder.case_price || 0);
    const newAmount = calculateAmount(newQuantity, newPricingMode, newUnitPrice, newCasePrice);

    if (newAmount !== parseFloat(currentOrder.amount)) {
      changes.push({ field: 'amount', old: currentOrder.amount, new: newAmount });
    }

    // Update order
    const updateResult = await query(`
      UPDATE orders SET
        quantity = $1,
        pricing_mode = $2,
        unit_price = $3,
        case_price = $4,
        amount = $5,
        modified_by_admin = TRUE,
        modification_count = modification_count + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [newQuantity, newPricingMode, newUnitPrice, newCasePrice, newAmount, id]);

    const updatedOrder = updateResult.rows[0];

    // Log all changes
    for (const change of changes) {
      await logOrderChange(
        id,
        currentOrder.batch_order_number,
        `${change.field}_changed`,
        change.field,
        change.old,
        change.new,
        admin_notes,
        req.user.id,
        req.user.email
      );
    }

    // Log manual note if provided
    if (admin_notes && changes.length === 0) {
      await logOrderChange(
        id,
        currentOrder.batch_order_number,
        'note_added',
        null,
        null,
        null,
        admin_notes,
        req.user.id,
        req.user.email
      );
    }

    res.json({
      success: true,
      message: 'Order modified successfully',
      order: updatedOrder,
      changes: changes
    });
  } catch (error) {
    console.error('Error modifying order:', error);
    res.status(500).json({ error: 'Error modifying order' });
  }
});

// Add item to existing batch (Admin only)
router.post('/batch/:batchNumber/add-item', authenticate, requireAdmin, async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const { product_connect_id, product_name, vendor_name, quantity, pricing_mode, unit_price, case_price, admin_notes } = req.body;

    // Validate batch exists
    const batchCheck = await query('SELECT user_email, user_id FROM orders WHERE batch_order_number = $1 LIMIT 1', [batchNumber]);
    if (batchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const { user_email, user_id } = batchCheck.rows[0];

    // Get vendor_id
    let vendorId = null;
    if (vendor_name) {
      const vendorResult = await query('SELECT id FROM vendors WHERE LOWER(name) = LOWER($1) LIMIT 1', [vendor_name]);
      if (vendorResult.rows.length > 0) {
        vendorId = vendorResult.rows[0].id;
      }
    }

    // Calculate amount
    const amount = calculateAmount(quantity, pricing_mode, parseFloat(unit_price), parseFloat(case_price));

    // Insert new order
    const result = await query(`
      INSERT INTO orders (
        batch_order_number, product_connect_id, product_name, vendor_id, vendor_name,
        quantity, amount, pricing_mode, unit_price, case_price,
        status, user_email, user_id, modified_by_admin, date_submitted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, TRUE, CURRENT_TIMESTAMP)
      RETURNING *
    `, [batchNumber, product_connect_id, product_name, vendorId, vendor_name, quantity, amount, pricing_mode, unit_price, case_price, user_email, user_id]);

    const newOrder = result.rows[0];

    // Create snapshot for new item
    await query(`
      INSERT INTO order_snapshots (
        order_id, batch_order_number, snapshot_type,
        product_connect_id, product_name, vendor_name,
        quantity, pricing_mode, unit_price, case_price, amount
      ) VALUES ($1, $2, 'original', $3, $4, $5, $6, $7, $8, $9, $10)
    `, [newOrder.id, batchNumber, product_connect_id, product_name, vendor_name, quantity, pricing_mode, unit_price, case_price, amount]);

    // Log change
    await logOrderChange(
      newOrder.id,
      batchNumber,
      'item_added',
      'product_name',
      null,
      product_name,
      admin_notes || `Added ${product_name} to batch`,
      req.user.id,
      req.user.email
    );

    res.status(201).json({
      message: 'Item added to batch successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Error adding item to batch:', error);
    res.status(500).json({ error: 'Error adding item to batch' });
  }
});

// Remove item from batch (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    // Fetch order to delete
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check if this is the last item in batch
    const batchCount = await query('SELECT COUNT(*) as count FROM orders WHERE batch_order_number = $1', [order.batch_order_number]);
    if (parseInt(batchCount.rows[0].count) === 1) {
      return res.status(400).json({ error: 'Cannot remove the last item from a batch. Cancel the entire batch instead.' });
    }

    // Log removal before deleting
    await logOrderChange(
      id,
      order.batch_order_number,
      'item_removed',
      'product_name',
      order.product_name,
      null,
      admin_notes || `Removed ${order.product_name} from batch`,
      req.user.id,
      req.user.email
    );

    // Delete order (cascade will delete snapshots and history)
    await query('DELETE FROM orders WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Order item removed successfully'
    });
  } catch (error) {
    console.error('Error removing order:', error);
    res.status(500).json({ error: 'Error removing order' });
  }
});

// Get order modification history (Admin only)
router.get('/:id/history', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch order
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Fetch original snapshot
    const snapshotResult = await query(
      'SELECT * FROM order_snapshots WHERE order_id = $1 AND snapshot_type = $2',
      [id, 'original']
    );

    // Fetch all history
    const historyResult = await query(
      'SELECT * FROM order_history WHERE order_id = $1 ORDER BY change_timestamp DESC',
      [id]
    );

    res.json({
      order: order,
      original_snapshot: snapshotResult.rows[0] || null,
      history: historyResult.rows
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Error fetching order history' });
  }
});

// Get batch modification history (Admin only)
router.get('/batch/:batchNumber/history', authenticate, requireAdmin, async (req, res) => {
  try {
    const { batchNumber } = req.params;

    // Fetch all orders in batch
    const ordersResult = await query(
      'SELECT * FROM orders WHERE batch_order_number = $1 ORDER BY id',
      [batchNumber]
    );

    if (ordersResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Fetch all history for this batch
    const historyResult = await query(
      'SELECT * FROM order_history WHERE batch_order_number = $1 ORDER BY change_timestamp DESC',
      [batchNumber]
    );

    // Calculate summary
    const summary = {
      total_modifications: historyResult.rows.length,
      items_added: historyResult.rows.filter(h => h.change_type === 'item_added').length,
      items_removed: historyResult.rows.filter(h => h.change_type === 'item_removed').length,
      last_modified: historyResult.rows.length > 0 ? historyResult.rows[0].change_timestamp : null
    };

    res.json({
      batch_number: batchNumber,
      items: ordersResult.rows,
      all_changes: historyResult.rows,
      summary: summary
    });
  } catch (error) {
    console.error('Error fetching batch history:', error);
    res.status(500).json({ error: 'Error fetching batch history' });
  }
});

export default router;
