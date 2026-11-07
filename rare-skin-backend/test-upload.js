const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

async function runUploadTest() {
  try {
    console.log('--- STARTING UPLOAD ROUTE TEST ---');

    const timestamp = Date.now();
    const testUser = {
      email: `upload_test_${timestamp}@example.com`,
      password: 'Password123!',
      full_name: 'Photo Test User'
    };

    // 1. Register temporary test user
    await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✅ Registered test user');

    // 2. Login to obtain valid JWT Token
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    const token = loginRes.data.token;
    console.log('✅ Authenticated & acquired JWT token');

    // 3. Create a small dummy image buffer
    const dummyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const tempFilePath = path.join(__dirname, 'temp_test_image.png');
    fs.writeFileSync(tempFilePath, dummyImageBuffer);

    // 4. Prepare FormData payload
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(tempFilePath));

    // 5. Send POST request to /api/upload
    const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Photo Upload Successful!');
    console.log('📸 Uploaded Photo Public URL:', uploadRes.data.photoUrl);

    // Clean up temporary local file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    console.log('--- UPLOAD TEST COMPLETED SUCCESSFULLY ---');

  } catch (err) {
    console.error('❌ Upload Test Failed:', err.response?.data || err.message);
  }
}

runUploadTest();