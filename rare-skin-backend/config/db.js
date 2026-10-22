const path = require('path');
const { Pool } = require('pg');

// Force dotenv to load the .env file from the parent directory (rare-skin-backend)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for cloud hosting like Supabase
  }
});

pool.on('connect', () => {
  console.log('⚡ Connected to Supabase PostgreSQL database!');
});

// Catch pool errors so the app doesn't crash silently
pool.on('error', (err) => {
  console.error('❌ Database Error:', err.message);
});

module.exports = pool;