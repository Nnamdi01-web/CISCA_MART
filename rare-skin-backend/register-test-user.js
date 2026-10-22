require('dotenv').config();
const axios = require('axios');

async function registerTestUser() {
  try {
    console.log('Registering test user...');
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Client Test User',
      email: 'client_test@example.com',
      password: 'TestPassword123!'
    });

    console.log('✅ User registered successfully!');
    console.log('Response:', response.data);
    console.log('\nYou can now use these credentials in test-payment.js:');
    console.log('Email: client_test@example.com');
    console.log('Password: TestPassword123!');
  } catch (err) {
    if (err.response?.data?.error?.includes('already exists') || err.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ User client_test@example.com already exists. You can use it right away!');
      console.log('Email: client_test@example.com');
      console.log('Password: TestPassword123!');
    } else {
      console.error('❌ Registration failed:', err.response?.data || err.message);
    }
  }
}

registerTestUser();