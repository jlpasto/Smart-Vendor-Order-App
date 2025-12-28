import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ==================================
// GET /api/cart - Get current user's cart
// ==================================
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📦 Fetching cart for user ${userId} (${req.user.email})`);

    const result = await query(
      `SELECT * FROM orders
       WHERE user_id = $1 AND status = 'in_cart'
       ORDER BY cart_created_at DESC`,
      [userId]
    );

    const cart = result.rows;
    console.log(`✓ Found ${cart.length} items in cart`);

    res.json({
      success: true,
      cart: cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================================
// POST /api/cart/add - Add item to cart
// ==================================
router.post('/add', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const {
      product_id,
      product_name,
      vendor_name,
      quantity,
      pricing_mode,
      unit_price,
      case_price,
      unavailable_action,
      replacement_product_id,
      replacement_product_name
    } = req.body;

    console.log(`➕ Adding to cart for user ${userId}: ${product_name} (qty: ${quantity})`);

    // Validate required fields
    if (!product_id) {
      console.error('❌ Missing product_id in cart add request');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: product_id'
      });
    }

    if (!product_name || !quantity || !pricing_mode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: product_name, quantity, pricing_mode'
      });
    }

    // Look up vendor_connect_id from vendor_name
    let vendorId = null;
    if (vendor_name) {
      try {
        const vendorResult = await query(
          'SELECT vendor_connect_id FROM vendors WHERE LOWER(name) = LOWER($1) LIMIT 1',
          [vendor_name]
        );
        if (vendorResult.rows.length > 0) {
          vendorId = vendorResult.rows[0].vendor_connect_id;
          console.log(`✓ Vendor ID found: ${vendorId}`);
        }
      } catch (vendorError) {
        console.error('Error looking up vendor:', vendorError);
      }
    }

    // Calculate amount based on pricing mode
    const price = pricing_mode === 'unit' ? parseFloat(unit_price || 0) : parseFloat(case_price || 0);
    const amount = parseFloat((price * quantity).toFixed(2));

    // Check if this exact product is already in the user's cart
    const existingResult = await query(
      `SELECT * FROM orders
       WHERE user_id = $1 AND product_id = $2 AND status = 'in_cart'
       LIMIT 1`,
      [userId, product_id]
    );

    let cartItem;

    if (existingResult.rows.length > 0) {
      // Update existing cart item - increase quantity
      const existing = existingResult.rows[0];
      const newQuantity = existing.quantity + quantity;
      const newAmount = parseFloat((price * newQuantity).toFixed(2));

      console.log(`📝 Updating existing cart item - new quantity: ${newQuantity}`);

      const updateResult = await query(
        `UPDATE orders SET
          quantity = $1,
          amount = $2,
          pricing_mode = $3,
          unit_price = $4,
          case_price = $5,
          unavailable_action = $6,
          replacement_product_id = $7,
          replacement_product_name = $8,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [
          newQuantity,
          newAmount,
          pricing_mode,
          unit_price,
          case_price,
          unavailable_action || 'curate',
          replacement_product_id,
          replacement_product_name,
          existing.id,
          userId
        ]
      );

      cartItem = updateResult.rows[0];
    } else {
      // Insert new cart item
      console.log(`💾 Inserting new cart item`);

      const insertResult = await query(
        `INSERT INTO orders (
          user_id, user_email, product_id, product_name, vendor_connect_id, vendor_name,
          quantity, amount, pricing_mode, unit_price, case_price,
          status, cart_created_at,
          unavailable_action, replacement_product_id, replacement_product_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'in_cart', CURRENT_TIMESTAMP, $12, $13, $14)
        RETURNING *`,
        [
          userId,
          userEmail,
          product_id,
          product_name,
          vendorId,
          vendor_name,
          quantity,
          amount,
          pricing_mode,
          unit_price,
          case_price,
          unavailable_action || 'curate',
          replacement_product_id,
          replacement_product_name
        ]
      );

      cartItem = insertResult.rows[0];
    }

    console.log(`✓ Cart item saved with ID: ${cartItem.id}`);

    res.status(201).json({
      success: true,
      cartItem: cartItem,
      message: 'Item added to cart'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================================
// PATCH /api/cart/:id - Update cart item
// ==================================
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;

    const {
      quantity,
      pricing_mode,
      unit_price,
      case_price,
      unavailable_action,
      replacement_product_id,
      replacement_product_name
    } = req.body;

    console.log(`📝 Updating cart item ${cartItemId} for user ${userId}`);

    // Verify item belongs to user and is in cart (status='in_cart')
    const checkResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = \'in_cart\'',
      [cartItemId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found or does not belong to you'
      });
    }

    const currentItem = checkResult.rows[0];

    // Calculate new amount if quantity or pricing changed
    const newQuantity = quantity !== undefined ? quantity : currentItem.quantity;
    const newPricingMode = pricing_mode !== undefined ? pricing_mode : currentItem.pricing_mode;
    const newUnitPrice = unit_price !== undefined ? parseFloat(unit_price) : parseFloat(currentItem.unit_price || 0);
    const newCasePrice = case_price !== undefined ? parseFloat(case_price) : parseFloat(currentItem.case_price || 0);

    const price = newPricingMode === 'unit' ? newUnitPrice : newCasePrice;
    const newAmount = parseFloat((price * newQuantity).toFixed(2));

    // Update the cart item
    const updateResult = await query(
      `UPDATE orders SET
        quantity = $1,
        pricing_mode = $2,
        unit_price = $3,
        case_price = $4,
        amount = $5,
        unavailable_action = COALESCE($6, unavailable_action),
        replacement_product_id = COALESCE($7, replacement_product_id),
        replacement_product_name = COALESCE($8, replacement_product_name),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        newQuantity,
        newPricingMode,
        newUnitPrice,
        newCasePrice,
        newAmount,
        unavailable_action,
        replacement_product_id,
        replacement_product_name,
        cartItemId,
        userId
      ]
    );

    const updatedItem = updateResult.rows[0];
    console.log(`✓ Cart item ${cartItemId} updated successfully`);

    res.json({
      success: true,
      cartItem: updatedItem,
      message: 'Cart item updated'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================================
// DELETE /api/cart/:id - Remove item from cart
// ==================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;

    console.log(`🗑️  Removing cart item ${cartItemId} for user ${userId}`);

    const result = await query(
      'DELETE FROM orders WHERE id = $1 AND user_id = $2 AND status = \'in_cart\' RETURNING *',
      [cartItemId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found or does not belong to you'
      });
    }

    console.log(`✓ Cart item ${cartItemId} removed successfully`);

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove cart item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================================
// DELETE /api/cart/clear - Clear entire cart
// ==================================
router.delete('/clear/all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🗑️  Clearing cart for user ${userId}`);

    const result = await query(
      'DELETE FROM orders WHERE user_id = $1 AND status = \'in_cart\' RETURNING id',
      [userId]
    );

    console.log(`✓ Removed ${result.rows.length} items from cart`);

    res.json({
      success: true,
      itemsRemoved: result.rows.length,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
