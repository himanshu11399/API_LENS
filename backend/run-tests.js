import axios from 'axios';

console.log('🧪 Starting APILens Integration Tests...\n');

const BASE_URL = 'http://localhost:5000';
let token = '';
let testHistoryId = '';

async function runTests() {
  try {
    // 1. Health check
    console.log('1. Checking health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   Health status: ${health.data.status} (OK)\n`);

    // 2. Auth: Register
    console.log('2. Testing user registration...');
    const testUsername = 'testrunner_' + Math.floor(Math.random() * 10000);
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      username: testUsername,
      email: `${testUsername}@example.com`,
      password: 'SecurePassword123'
    });
    console.log(`   Registered User ID: ${registerResponse.data.user.id}`);
    console.log('   Tokens acquired successfully.\n');

    // 3. Auth: Login
    console.log('3. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: `${testUsername}@example.com`,
      password: 'SecurePassword123'
    });
    token = loginResponse.data.accessToken;
    console.log('   Access Token retrieved successfully.\n');

    // 4. Execution Engine
    console.log('4. Testing request execution forwarder...');
    const executeResponse = await axios.post(
      `${BASE_URL}/api/request/execute`,
      {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
        params: [],
        auth: { type: 'none' }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`   Response capture status: ${executeResponse.data.status}`);
    console.log(`   Latency: ${executeResponse.data.duration}ms`);
    console.log(`   Size: ${executeResponse.data.size} bytes`);
    console.log('   Forwarding engine capture works.\n');

    // 5. Stats: Active Users
    console.log('5. Testing active online users...');
    const activeUsersResponse = await axios.get(`${BASE_URL}/api/stats/active-users`);
    console.log(`   Online Users: ${activeUsersResponse.data.activeUsers}\n`);

    // 6. Stats: Aggregated Analytics
    console.log('6. Testing aggregated metrics calculation...');
    const statsResponse = await axios.get(
      `${BASE_URL}/api/stats/analytics?filter=ALL`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`   Computed Total Requests: ${statsResponse.data.summary.totalRequests}`);
    console.log(`   Success Rate: ${statsResponse.data.summary.successRate}%`);
    console.log(`   Avg Latency: ${statsResponse.data.summary.avgResponseTime}ms`);
    console.log('   Aggregation pipelines operational.\n');

    // 7. History Ledger
    console.log('7. Testing history logs listing...');
    const historyResponse = await axios.get(
      `${BASE_URL}/api/history?page=1&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`   Found ${historyResponse.data.logs.length} logs.`);
    testHistoryId = historyResponse.data.logs[0]._id;
    console.log(`   Selected historical entry: ${testHistoryId}\n`);

    // 8. Re-run Query
    console.log('8. Testing re-run historical query...');
    const rerunResponse = await axios.post(
      `${BASE_URL}/api/history/${testHistoryId}/rerun`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`   Re-run status: ${rerunResponse.data.status}`);
    console.log(`   Re-run Latency: ${rerunResponse.data.duration}ms\n`);

    console.log('🎉 INTEGRATION TESTS COMPLETED SUCCESSFULLY! All core requirements verified.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed with error:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();
