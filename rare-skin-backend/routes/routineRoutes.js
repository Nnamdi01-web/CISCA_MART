const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// @route   POST /api/routines
// @desc    Admin creates/assigns a routine to a consultation
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { consultation_id, admin_notes, items } = req.body; 

  try {
    const newRoutine = await db.query(
      `INSERT INTO routines (consultation_id, admin_notes)
       VALUES ($1, $2)
       RETURNING *`,
      [consultation_id, admin_notes]
    );

    const routineId = newRoutine.rows[0].id;

    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO routine_items (routine_id, product_id, time_of_day, step_order, usage_instructions, frequency)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            routineId, 
            item.product_id, 
            item.time_of_day, 
            item.step_order, 
            item.usage_instructions, 
            item.frequency
          ]
        );
      }
    }

    await db.query(
      `UPDATE consultations SET status = 'Completed' WHERE id = $1`,
      [consultation_id]
    );

    res.status(201).json({
      success: true,
      message: 'Routine created and published successfully!',
      routine: newRoutine.rows[0]
    });
  } catch (err) {
    console.error('Create Routine Error:', err);
    res.status(500).json({ success: false, error: 'Failed to create routine.' });
  }
});

// @route   GET /api/routines/:consultationId
// @desc    Fetch routine details directly by consultation ID (For ViewRoutine.jsx)
// @access  Public / Customer
router.get('/:consultationId', async (req, res) => {
  const { consultationId } = req.params;

  try {
    // 1. Fetch routine from routines table
    const routineResult = await db.query(
      `SELECT * FROM routines WHERE consultation_id = $1 ORDER BY id DESC LIMIT 1`,
      [consultationId]
    );

    if (routineResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Routine not found yet.' });
    }

    const routine = routineResult.rows[0];
    let productList = [];

    // Check if products are stored directly as JSON in the routines table
    if (routine.products) {
      productList = typeof routine.products === 'string' 
        ? JSON.parse(routine.products) 
        : routine.products;
    } else {
      // Fallback: Query routine_items if using separate tables
      try {
        const itemsResult = await db.query(
          `SELECT ri.*, p.name, p.brand, p.category, p.price, p.image_url, p.description
           FROM routine_items ri
           JOIN products p ON ri.product_id = p.id
           WHERE ri.routine_id = $1
           ORDER BY ri.time_of_day, ri.step_order ASC`,
          [routine.id]
        );
        productList = itemsResult.rows;
      } catch (itemErr) {
        console.warn('Could not query routine_items:', itemErr.message);
      }
    }

    return res.json({
      success: true,
      routine: {
        id: routine.id,
        admin_notes: routine.admin_notes || routine.notes || '',
        products: productList
      }
    });
  } catch (err) {
    console.error('Fetch Consultation Routine Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;