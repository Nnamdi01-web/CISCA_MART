require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runPaymentTest() {
  try {
    console.log('--- STARTING PAYMENT INTEGRATION TEST ---');

    // Step 1: Login using the credentials registered in register-test-user.js
    console.log('\n1. Logging in test user...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'client_test@example.com',
      password: 'TestPassword123!'
    });

    const token = loginRes.data.token || loginRes.data.access_token;
    console.log('✅ Authenticated & acquired token');

    // Step 2: Initialize Payment (₦26,500 total from screen 8)
    console.log('\n2. Initializing payment of ₦26,500...');
    const initRes = await axios.post(
      `${BASE_URL}/payments/initialize`, // adjust to '/payments/initialize' if your server.js uses plural
      { amount: 26500 },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { authorization_url, reference } = initRes.data;

    console.log('✅ Payment Initialized!');
    console.log('📌 Reference Code:', reference);
    console.log('\n👉 OPEN THIS URL IN YOUR BROWSER TO COMPLETE PAYMENT:');
    console.log(authorization_url);

    console.log('\n--- NEXT STEP ---');
    console.log('1. Open the URL above in your browser.');
    console.log('2. Click "Success" on the Paystack test screen.');
    console.log(`3. We will verify using reference: ${reference}`);
  } catch (err) {
    console.error('❌ Payment Test Failed:', err.response?.data || err.message);
  }
}

runPaymentTest();