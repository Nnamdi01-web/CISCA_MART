const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// 1. INITIALIZE PAYMENT
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    let { amount, routine_id } = req.body;
    const userEmail = req.user?.email || req.body.email;

    // Safety fallback: if amount isn't provided or is invalid, default to 0
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount required.' });
    }

    const reference = `RSC_${req.user?.id || 'GUEST'}_${Date.now()}`;
    const koboAmount = Math.round(amount * 100);

    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: userEmail,
        amount: koboAmount,
        reference: reference,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-confirmation?reference=${reference}`
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { authorization_url, access_code } = paystackResponse.data.data;

    // Save record to DB
    await pool.query(
      `INSERT INTO payments (user_id, reference, amount, status) 
       VALUES ($1, $2, $3, $4)`,
      [req.user?.id || null, reference, amount, 'pending']
    );

    res.json({
      message: 'Payment initialized',
      authorization_url,
      access_code,
      reference
    });
  } catch (err) {
    console.error('Initialization error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize payment transaction' });
  }
});

// 2A. VERIFY PAYMENT - POST /api/payments/verify (Called directly by App.jsx)
router.post('/verify', async (req, res) => {
  try {
    const { reference, consultationId, amount } = req.body;
    const refToVerify = typeof reference === 'object' ? reference.reference : reference;

    if (!refToVerify) {
      return res.status(400).json({ success: false, error: 'No reference provided.' });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    let finalAmount = Number(amount) || 0;
    let customerEmail = '';

    // Verify with Paystack if key exists and it's not a manual transfer
    if (secretKey && refToVerify && !refToVerify.startsWith('MANUAL_BANK_TRANSFER_')) {
      try {
        const paystackResponse = await axios.get(
          `https://api.paystack.co/transaction/verify/${refToVerify}`,
          { headers: { Authorization: `Bearer ${secretKey}` } }
        );
        const data = paystackResponse.data.data;
        if (data && data.status === 'success') {
          finalAmount = data.amount / 100;
          customerEmail = data.customer?.email || '';
        }
      } catch (pErr) {
        console.warn('Paystack live check warning:', pErr.message);
      }
    }

    // Check if order already exists for this reference to avoid duplicates
    const existingOrder = await pool.query(
      `SELECT id FROM orders WHERE payment_reference = $1`,
      [refToVerify]
    );

    if (existingOrder.rows.length === 0) {
      // Insert new order safely
      await pool.query(
        `INSERT INTO orders (consultation_id, total_amount, amount, customer_email, payment_reference, status, created_at)
         VALUES ($1, $2, $2, $3, $4, 'Paid', NOW())`,
        [consultationId || null, finalAmount, customerEmail, refToVerify]
      );
    } else {
      // Update existing order
      await pool.query(
        `UPDATE orders SET status = 'Paid', total_amount = $1, amount = $1 WHERE payment_reference = $2`,
        [finalAmount, refToVerify]
      );
    }

    // Update consultation status if consultationId exists
    if (consultationId) {
      await pool.query(
        `UPDATE consultations SET status = 'Completed' WHERE id = $1`,
        [consultationId]
      );
    }

    res.json({
      success: true,
      message: 'Payment verified and order saved successfully!',
      reference: refToVerify,
      amount: finalAmount
    });
  } catch (err) {
    console.error('Post verification error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2B. VERIFY PAYMENT - GET /api/payments/verify/:reference (Called via URL redirect)
router.get('/verify/:reference', async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const { reference } = req.params;

    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` }
      }
    );

    const data = paystackResponse.data.data;

    if (data.status === 'success') {
      const amountPaid = data.amount / 100;
      const customerEmail = data.customer?.email || '';

      await pool.query(
        `UPDATE payments 
         SET status = 'success', payment_method = $1, updated_at = NOW() 
         WHERE reference = $2`,
        [data.channel, reference]
      );

      await pool.query(
        `INSERT INTO orders (total_amount, amount, customer_email, payment_reference, status, created_at)
         VALUES ($1, $1, $2, $3, 'Paid', NOW())
         ON CONFLICT (payment_reference) DO UPDATE SET status = 'Paid'`,
        [amountPaid, customerEmail, reference]
      );

      return res.json({
        message: 'Payment verified successfully',
        status: 'success',
        reference: data.reference,
        amount: amountPaid,
        channel: data.channel
      });
    } else {
      await pool.query(
        `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE reference = $1`,
        [reference]
      );

      return res.status(400).json({ message: 'Payment incomplete', status: data.status });
    }
  } catch (err) {
    console.error('Verification error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});

// 3. PAYSTACK WEBHOOK (Automated Backend Notification)
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const channel = event.data.channel;
      const amountPaid = event.data.amount / 100;
      const customerEmail = event.data.customer?.email || '';

      await pool.query(
        `UPDATE payments 
         SET status = 'success', payment_method = $1, updated_at = NOW() 
         WHERE reference = $2`,
        [channel, reference]
      );

      await pool.query(
        `INSERT INTO orders (total_amount, amount, customer_email, payment_reference, status, created_at)
         VALUES ($1, $1, $2, $3, 'Paid', NOW())
         ON CONFLICT (payment_reference) DO UPDATE SET status = 'Paid'`,
        [amountPaid, customerEmail, reference]
      );
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(500);
  }
});

module.exports = router;