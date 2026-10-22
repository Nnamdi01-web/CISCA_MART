require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkConnection() {
  console.log("Testing connection...");
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ SUCCESS! The database is connected.');
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

checkConnection();