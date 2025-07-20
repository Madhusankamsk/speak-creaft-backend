const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAdminLogin() {
    try {
        console.log('🔍 Testing Admin Login...\n');

        // Step 1: Create admin account
        console.log('1️⃣ Creating admin account...');
        const createResponse = await axios.post(`${BASE_URL}/api/admin/register`, {
            name: 'Test Admin',
            email: 'testadmin@speakcraft.com',
            password: 'test123456',
            role: 'admin'
        });
        console.log('✅ Admin created successfully');
        console.log('Response:', JSON.stringify(createResponse.data, null, 2));
        console.log('');

        // Step 2: Test admin login
        console.log('2️⃣ Testing admin login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
            email: 'testadmin@speakcraft.com',
            password: 'test123456'
        });
        console.log('✅ Login successful');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
        console.log('');

        // Step 3: Test token verification
        console.log('3️⃣ Testing token verification...');
        const token = loginResponse.data.data.token;
        const verifyResponse = await axios.get(`${BASE_URL}/api/admin/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Token verification successful');
        console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));
        console.log('');

        // Step 4: Test dashboard stats
        console.log('4️⃣ Testing dashboard stats...');
        const statsResponse = await axios.get(`${BASE_URL}/api/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Dashboard stats retrieved');
        console.log('Response:', JSON.stringify(statsResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testAdminLogin(); 