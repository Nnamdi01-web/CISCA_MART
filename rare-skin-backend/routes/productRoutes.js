const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/products
// @desc    Get all skincare products (Public / Available for Admin to pick)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await db.query('SELECT * FROM products ORDER BY name ASC');
    res.json(products.rows);
  } catch (err) {
    console.error('Fetch Products Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// @route   POST /api/products
// @desc    Admin adds a new product to the catalog
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, brand, category, description, price, image_url } = req.body;

  try {
    const newProduct = await db.query(
      `INSERT INTO products (name, brand, category, description, price, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, brand, category, description, price, image_url]
    );

    res.status(201).json({
      message: 'Product added successfully!',
      product: newProduct.rows[0]
    });
  } catch (err) {
    console.error('Add Product Error:', err.message);
    res.status(500).json({ error: 'Failed to add product.' });
  }
});

module.exports = router;