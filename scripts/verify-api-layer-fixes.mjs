import http from 'http';

async function getAuthToken() {
  const res = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@docsearch.health', password: 'DoctorPass123!' })
  });
  const data = await res.json();
  return data?.data?.accessToken;
}

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 4000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 4000
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: json });
          } catch {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TIMEOUT'));
    });
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('🧪 VERIFYING API LAYER FIXES');
  console.log('====================================================\n');

  const token = await getAuthToken();
  if (!token) {
    console.error('Failed to obtain auth token');
    process.exit(1);
  }

  let passed = 0;
  let total = 0;

  // Test 1: Dynamic Query Permutations - Procurement Purchase Orders with departments
  total++;
  try {
    const res = await makeRequest(
      'GET',
      '/api/v1/partner/procurement/purchase-orders?departments=ICU,Emergency,Pharmacy&status=APPROVED',
      { 'Authorization': `Bearer ${token}` }
    );
    if (res.statusCode === 200 && res.data.success && Array.isArray(res.data.data)) {
      console.log('  ✓ Test 1 Passed: Procurement purchase-orders accepts dynamic department & status query permutations.');
      passed++;
    } else {
      console.log('  ✗ Test 1 Failed:', res);
    }
  } catch (err) {
    console.log('  ✗ Test 1 Exception:', err.message);
  }

  // Test 2: Dynamic Query Permutations - Bed Turnaround Metrics with departments
  total++;
  try {
    const res = await makeRequest(
      'GET',
      '/api/v1/partner/bed-turnaround/turnaround-metrics?departments=ICU,OT,ER',
      { 'Authorization': `Bearer ${token}` }
    );
    if (
      res.statusCode === 200 &&
      res.data.success &&
      res.data.data.filterApplied?.departments?.includes('ICU')
    ) {
      console.log('  ✓ Test 2 Passed: Bed turnaround-metrics parses multi-department comma separated arrays in dynamic SQL.');
      passed++;
    } else {
      console.log('  ✗ Test 2 Failed:', res);
    }
  } catch (err) {
    console.log('  ✗ Test 2 Exception:', err.message);
  }

  // Test 3: Local Hardware Agent Offline -> Automatic Cloud Spooling
  total++;
  try {
    const res = await makeRequest(
      'POST',
      '/api/v1/partner/hardware/printer/test-receipt',
      { 'Authorization': `Bearer ${token}` },
      {
        paperWidth: '80MM',
        agentUrl: 'http://127.0.0.1:19999' // deliberately offline port
      }
    );
    if (
      res.statusCode === 200 &&
      res.data.success &&
      res.data.spooled &&
      res.data.status === 'SPOOLED_CLOUD' &&
      res.data.jobId
    ) {
      console.log('  ✓ Test 3 Passed: Offline LHA triggers automatic cloud spooling without connection timeout.');
      passed++;
    } else {
      console.log('  ✗ Test 3 Failed:', res);
    }
  } catch (err) {
    console.log('  ✗ Test 3 Exception:', err.message);
  }

  // Test 4: Cloud Spool Queue Polling & Retrieval
  total++;
  try {
    const res = await makeRequest(
      'GET',
      '/api/v1/partner/hardware/print-queue',
      { 'Authorization': `Bearer ${token}` }
    );
    if (res.statusCode === 200 && res.data.success && res.data.data.spooledCount >= 1) {
      console.log('  ✓ Test 4 Passed: Cloud print queue stores and surfaces spooled jobs for terminal retrieval.');
      passed++;
    } else {
      console.log('  ✗ Test 4 Failed:', res);
    }
  } catch (err) {
    console.log('  ✗ Test 4 Exception:', err.message);
  }

  // Test 5: Universal Error Payload Normalizer - No "undefined" error toasts
  total++;
  try {
    const res = await makeRequest(
      'POST',
      '/api/v1/partner/procurement/vendors',
      { 'Authorization': `Bearer ${token}` },
      { invalid: true } // missing vendorName
    );
    const hasSuccessFalse = res.data?.success === false;
    const hasErrorCode = typeof res.data?.error?.code === 'string';
    const hasErrorMessage = typeof res.data?.error?.message === 'string';
    const hasTopMessage = typeof res.data?.message === 'string';

    if (
      res.statusCode === 400 &&
      hasSuccessFalse &&
      hasErrorCode &&
      hasErrorMessage &&
      hasTopMessage
    ) {
      console.log(
        `  ✓ Test 5 Passed: Error payload harmonized: error.code="${res.data.error.code}", error.message="${res.data.error.message}". Toast parser will never render "undefined".`
      );
      passed++;
    } else {
      console.log('  ✗ Test 5 Failed:', res);
    }
  } catch (err) {
    console.log('  ✗ Test 5 Exception:', err.message);
  }

  console.log(`\nRESULTS: ${passed}/${total} TESTS PASSED.`);
  process.exit(passed === total ? 0 : 1);
}

run();
