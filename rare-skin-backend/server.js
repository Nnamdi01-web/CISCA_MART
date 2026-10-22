require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Safely require database connection module
let db;
try {
  db = require('./config/db');
} catch (e) {
  console.log('⚠️ DB config warning:', e.message);
}

// Safely require routes
const authRoutes = require('./routes/authRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const routineRoutes = require('./routes/routineRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Enable CORS for frontend cross-origin requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve uploaded images statically so the frontend and admin dashboard can load them
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Express Router for Admin Endpoints
const expressRouter = express.Router();

// GET all consultations for Admin Dashboard
expressRouter.get('/consultations', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, error: 'Database module not loaded.' });
  }

  try {
    const result = await db.query(
      `SELECT c.id, c.user_id, c.status, c.skin_type, c.skin_concern, c.concern_duration, 
              c.current_routine, c.allergies, c.created_at, 
              p.front_photo_url AS photo_url
       FROM consultations c
       LEFT JOIN consultation_photos p ON c.id = p.consultation_id
       ORDER BY c.created_at DESC`
    );

    const pending = result.rows.filter(c => c.status === 'Pending' || c.status === 'Under Review' || !c.status).length;
    const completed = result.rows.filter(c => c.status === 'Completed' || c.status === 'Paid').length;

    let totalOrders = 0;
    let totalSales = 0;
    try {
      // Summing total_amount explicitly using total_amount column
      const orderStats = await db.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM orders');
      totalOrders = parseInt(orderStats.rows[0].count) || 0;
      totalSales = parseFloat(orderStats.rows[0].total) || 0;
    } catch (e) {
      console.error('⚠️ ORDERS STATS QUERY ERROR:', e.message);
    }

    res.json({
      success: true,
      stats: { pending, completed, totalOrders, totalSales },
      consultations: result.rows
    });
  } catch (err) {
    console.error('FULL ADMIN CONSULTATIONS ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single consultation by ID (with photo join)
expressRouter.get('/consultations/:id', async (req, res) => {
  if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*, p.front_photo_url, p.left_photo_url, p.right_photo_url, 
              p.front_photo_url AS photo_url
       FROM consultations c
       LEFT JOIN consultation_photos p ON c.id = p.consultation_id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }
    res.json({ success: true, consultation: result.rows[0] });
  } catch (err) {
    console.error('FULL CONSULTATION DETAIL ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create/assign routine to a consultation
expressRouter.post('/routines', async (req, res) => {
  if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

  try {
    const targetConsultationId = req.body.consultationId || req.body.consultation_id;
    const recommendedProducts = req.body.recommendedProducts || req.body.products || [];
    const adminNotes = req.body.adminNotes || req.body.notes || '';

    if (!targetConsultationId) {
      return res.status(400).json({ success: false, error: 'consultationId is required.' });
    }

    await db.query('UPDATE consultations SET status = $1 WHERE id = $2', ['Completed', targetConsultationId]);

    const routineResult = await db.query(
      `INSERT INTO routines (consultation_id, products, admin_notes, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [targetConsultationId, JSON.stringify(recommendedProducts), adminNotes]
    );

    res.json({
      success: true,
      message: 'Routine generated and sent to customer!',
      routine: routineResult.rows[0]
    });
  } catch (err) {
    console.error('FULL ROUTINE CREATION ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create order endpoint from Payment and Checkout flow (Handles Orders + Line Items + Consultations)
app.post('/api/orders', async (req, res) => {
  if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

  try {
    const { consultation_id, total_amount, customer_email, items, payment_reference } = req.body;

    // 1. Insert into orders table using total_amount and marking status as 'paid'
    const orderResult = await db.query(
      `INSERT INTO orders (consultation_id, total_amount, amount, customer_email, payment_reference, status, created_at)
       VALUES ($1, $2, $2, $3, $4, 'paid', NOW()) RETURNING *`,
      [consultation_id || null, total_amount || 0, customer_email || '', payment_reference || '']
    );

    const newOrder = orderResult.rows[0];

    // 2. Insert items into order_items table if items exist
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [newOrder.id, item.product_id || null, item.quantity || 1, item.price || 0]
        );
      }
    }

    // 3. Update consultation status if linked
    if (consultation_id) {
      await db.query(
        'UPDATE consultations SET status = $1 WHERE id = $2',
        ['Paid', consultation_id]
      );
    }

    res.json({
      success: true,
      message: 'Order saved successfully!',
      order: newOrder
    });
  } catch (err) {
    console.error('FULL ORDER CREATION ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount routes safely
if (authRoutes) app.use('/api/auth', authRoutes);
if (consultationRoutes) {
  app.use('/api/consultations', consultationRoutes);
  app.use('/api', consultationRoutes);
}
if (routineRoutes) app.use('/api/routines', routineRoutes);
if (productRoutes) app.use('/api/products', productRoutes);
if (orderRoutes) app.use('/api/orders', orderRoutes);
if (uploadRoutes) app.use('/api/upload', uploadRoutes);
if (paymentRoutes) app.use('/api/payments', paymentRoutes);
app.use('/api/admin', expressRouter);

// Root route health check
app.get('/', async (req, res) => {
  try {
    if (db) {
      const result = await db.query('SELECT NOW()');
      return res.json({ message: 'Rare Skin Consult API is running!', dbTime: result.rows[0].now });
    }
    res.json({ message: 'Rare Skin Consult API is running without database connection.' });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});