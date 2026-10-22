const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ensure the routines table has the products column
const ensureProductsColumn = async () => {
  try {
    await db.query(`ALTER TABLE routines ADD COLUMN IF NOT EXISTS products JSONB;`);
  } catch (err) {
    console.error("Column check error:", err.message);
  }
};
ensureProductsColumn();

// GET /api/admin/consultations
router.get('/consultations', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM consultations ORDER BY created_at DESC`
    );

    const pending = result.rows.filter(c => c.status === 'Pending' || c.status === 'Under Review' || !c.status).length;
    const completed = result.rows.filter(c => c.status === 'Completed').length;

    // Fetch dynamic order stats combined from both public.orders and public.payments
    const orderStatsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.orders) + (SELECT COUNT(*) FROM public.payments) AS total_orders,
        COALESCE((SELECT SUM(COALESCE(total_amount, amount, 0)) FROM public.orders), 0) + 
        COALESCE((SELECT SUM(COALESCE(amount, 0)) FROM public.payments), 0) AS total_sales
    `);

    // 🔍 DEBUG: Prints directly to your backend terminal window
    console.log("🔍 DEBUG COMBINED ORDER STATS:", orderStatsResult.rows);

    const totalOrders = parseInt(orderStatsResult.rows[0].total_orders || 0);
    const totalSales = parseFloat(orderStatsResult.rows[0].total_sales || 0);

    res.json({
      success: true,
      stats: { pending, completed, totalOrders, totalSales },
      consultations: result.rows
    });
  } catch (err) {
    console.error('Admin Consultations Route Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/consultations/:id
router.get('/consultations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM consultations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }
    res.json({ success: true, consultation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/routines
router.post('/routines', async (req, res) => {
  try {
    const { consultationId, recommendedProducts, adminNotes } = req.body;
    
    // Update consultation status to Completed
    await db.query('UPDATE consultations SET status = $1 WHERE id = $2', ['Completed', consultationId]);

    // Insert routine into database
    const routineResult = await db.query(
      `INSERT INTO routines (consultation_id, products, admin_notes, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [consultationId, JSON.stringify(recommendedProducts), adminNotes]
    );

    res.json({
      success: true,
      message: 'Routine generated and sent to customer!',
      routine: routineResult.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;