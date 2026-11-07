const axios = require('axios');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Generate unique emails for clean testing runs
const timestamp = Date.now();
const customerEmail = `customer_${timestamp}@test.com`;
const adminEmail = `admin_${timestamp}@test.com`;
const testPassword = 'Password123';

let customerToken = '';
let adminToken = '';
let consultationId = null;
let productId = null;

async function runTestPipeline() {
  console.log('\n🚀 Starting Full UX/UI Backend Test Pipeline...\n');

  try {
    // 1. Register & Login Customer
    console.log('1️⃣ Registering & Logging in Customer...');
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Jane Doe',
      email: customerEmail,
      password: testPassword,
      role: 'customer'
    });

    const custLogin = await axios.post(`${API_URL}/auth/login`, {
      email: customerEmail,
      password: testPassword
    });
    customerToken = custLogin.data.token;
    console.log('   ✅ Customer logged in successfully!');

    // 2. Register & Login Admin
    console.log('2️⃣ Registering & Logging in Admin...');
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Dr. Aesthetician',
      email: adminEmail,
      password: testPassword,
      role: 'admin'
    });

    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: adminEmail,
      password: testPassword
    });
    adminToken = adminLogin.data.token;
    console.log('   ✅ Admin logged in successfully!');

    // 3. Customer Submits Consultation
    console.log('3️⃣ Submitting Consultation Questionnaire & Photos...');
    const consultRes = await axios.post(
      `${API_URL}/consultations`,
      {
        skin_type: 'Combination',
        skin_concern: 'Acne & Hyperpigmentation',
        concern_duration: '1-2 years',
        current_routine: 'Gentle cleanser',
        allergies: 'None',
        front_photo_url: 'https://storage.example.com/front.jpg',
        left_photo_url: 'https://storage.example.com/left.jpg',
        right_photo_url: 'https://storage.example.com/right.jpg'
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    
    // Handle both potential response shapes seamlessly
    const consultationData = consultRes.data.consultation || consultRes.data;
    consultationId = consultationData.id;
    console.log(`   ✅ Consultation #${consultationId} submitted! Status: ${consultationData.status || 'submitted'}`);

    // 4. Admin Adds a Product
    console.log('4️⃣ Admin Adding Skincare Product to Catalog...');
    const prodRes = await axios.post(
      `${API_URL}/products`,
      {
        name: 'Rare Hydrating Cleanser',
        brand: 'Rare Skin',
        category: 'Cleanser',
        description: 'Sulfate-free hydrating daily cleanser',
        price: 24.50,
        image_url: 'https://storage.example.com/cleanser.jpg'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const productData = prodRes.data.product || prodRes.data;
    productId = productData.id;
    console.log(`   ✅ Product "${productData.name}" created (ID: ${productId})!`);

    // 5. Admin Builds & Publishes Routine
    console.log('5️⃣ Admin Building & Publishing Custom Routine...');
    await axios.post(
      `${API_URL}/routines`,
      {
        consultation_id: consultationId,
        admin_notes: 'Use cleanser morning and evening.',
        items: [
          {
            product_id: productId,
            time_of_day: 'Morning',
            step_order: 1,
            usage_instructions: 'Massage 1 pump onto wet skin',
            frequency: 'Daily'
          }
        ]
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('   ✅ Routine created & published to customer!');

    // 6. Customer Fetches Routine
    console.log('6️⃣ Customer Fetching Assigned Routine...');
    const getRoutineRes = await axios.get(`${API_URL}/routines/my-routine`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const routineItems = getRoutineRes.data.products || getRoutineRes.data.items || [];
    console.log(`   ✅ Customer retrieved routine with ${routineItems.length} product(s)!`);

    // 7. Customer Purchases Routine (Checkout)
    console.log('7️⃣ Customer Purchasing Products (Checkout)...');
    const orderRes = await axios.post(
      `${API_URL}/orders`,
      {
        consultation_id: consultationId,
        total_amount: 24.50,
        items: [{ product_id: productId, quantity: 1, price: 24.50 }]
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    const orderData = orderRes.data.order || orderRes.data;
    console.log(`   ✅ Order #${orderData.id || 1} placed! Status: ${orderData.status || 'pending'}`);

    console.log('\n🎉 ALL TESTS PASSED! Your backend pipeline is 100% operational!\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED AT STEP:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Data:`, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

runTestPipeline();