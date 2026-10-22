const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testRoutineFlow() {
  try {
    console.log('--- STARTING FULL ROUTINE FLOW TEST ---');

    const timestamp = Date.now();

    // 1a. Log in with the Existing Admin User (client_test@example.com)
    console.log('1a. Logging in as Admin (client_test@example.com)...');
    
    let adminToken;
    try {
      const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'client_test@example.com',
        password: 'TestPassword123!'
      });
      adminToken = adminLoginRes.data.token || adminLoginRes.data.accessToken || adminLoginRes.data.data?.token;
    } catch (e) {
      console.error('❌ Admin login failed. Make sure you updated role = admin for client_test@example.com in SQL.');
      throw e;
    }
    console.log('✅ Admin Token acquired!');

    // 1b. Register a new Customer User for the test consultation
    const customerUser = {
      email: `customer_${timestamp}@example.com`,
      password: 'Password123!',
      full_name: 'Test Customer'
    };

    console.log(`\n1b. Registering Customer (${customerUser.email})...`);
    const custRegRes = await axios.post(`${BASE_URL}/auth/register`, customerUser);
    let customerToken = custRegRes.data.token || custRegRes.data.accessToken || custRegRes.data.data?.token;

    if (!customerToken) {
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: customerUser.email,
        password: customerUser.password
      });
      customerToken = loginRes.data.token || loginRes.data.accessToken || loginRes.data.data?.token;
    }
    console.log('✅ Customer Token acquired!');

    // 2. Submit Consultation (as Customer)
    console.log('\n2. Submitting test consultation...');
    const consultRes = await axios.post(
      `${BASE_URL}/consultations`,
      {
        skin_type: 'Oily',
        concerns: 'Acne and Hyperpigmentation',
        photo_urls: ['https://via.placeholder.com/150']
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );

    const consultationId = consultRes.data.consultation?.id || consultRes.data.id;
    console.log(`✅ Consultation created with ID: ${consultationId}`);

    // 3. Check Pending Status (as Customer)
    console.log('\n3. Customer checking routine before Admin review...');
    const preCheck = await axios.get(`${BASE_URL}/routines/my-routine`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('✅ Status response:', preCheck.data);

    // 4. Admin Assigns Routine Products (USING ADMIN TOKEN)
    console.log('\n4. Assigning routine products (as Admin)...');
    
    const createRoutineRes = await axios.post(
      `${BASE_URL}/routines`,
      {
        consultation_id: consultationId,
        admin_notes: 'Use cleanser twice daily followed by sunscreen in the morning.',
        items: [
          { product_id: 1, time_of_day: 'morning', step_order: 1, usage_instructions: 'Apply 2 pumps', frequency: 'daily' }
        ]
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    console.log('✅ Routine published:', createRoutineRes.data.message || createRoutineRes.data);

    // 5. Customer Fetches Complete Routine & Total Price
    console.log('\n5. Customer fetching completed routine...');
    const finalCheck = await axios.get(`${BASE_URL}/routines/my-routine`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    console.log('\n🎉 SUCCESS! Final Routine Payload:');
    console.log(JSON.stringify(finalCheck.data, null, 2));

  } catch (err) {
    console.error('❌ Test failed with error:');
    if (err.response) {
      console.error('Status Code:', err.response.status);
      console.error('Response Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

testRoutineFlow();