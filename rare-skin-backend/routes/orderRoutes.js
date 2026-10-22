const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   POST /api/orders
// @desc    Create new order for routine products
router.post('/', async (req, res) => {
  const { consultation_id, total_amount, items, payment_reference, customer_email } = req.body; 

  try {
    // 1. Create Order in Supabase (matching your actual table columns without user_id)
    const newOrder = await db.query(
      `INSERT INTO orders (consultation_id, total_amount, amount, customer_email, payment_reference, status, created_at)
       VALUES ($1, $2, $2, $3, $4, 'Paid', NOW())
       RETURNING *`,
      [consultation_id || null, total_amount || 0, customer_email || '', payment_reference || `REF_${Date.now()}`]
    );

    const orderId = newOrder.rows[0].id;

    // 2. Insert Order Items if they exist
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.product_id, item.quantity, item.price]
        );
      }
    }

    // 3. Mark consultation status as completed if applicable
    if (consultation_id) {
      await db.query(
        `UPDATE consultations SET status = 'Completed' WHERE id = $1`,
        [consultation_id]
      );
    }

    res.status(201).json({
      message: 'Order placed successfully!',
      order: newOrder.rows[0]
    });
  } catch (err) {
    console.error('Order Creation Error:', err.message);
    res.status(500).json({ error: 'Failed to process order: ' + err.message });
  }
});

module.exports = router;