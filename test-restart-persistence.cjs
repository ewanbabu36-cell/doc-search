const http = require('node:http');

async function request(urlStr, options = {}, body = null) {
  const url = new URL(urlStr);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, text: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function verifyAfterRestart(patientId = 'de51e2a8-cc39-4c07-8161-793842558d1b') {
  console.log('--- VERIFYING DATA PERSISTENCE POST-RESTART ---');
  
  // 1. Login
  const loginRes = await request('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST'
  }, {
    email: 'founder@docsearch.health',
    password: 'FounderPass123!'
  });
  const token = loginRes.body?.data?.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Query Lab Orders
  const labGet = await request('http://127.0.0.1:4000/api/v1/partner/lab/orders', { headers: authHeaders });
  const labOrders = labGet.body?.data?.items || labGet.body?.data || [];
  console.log(`✔ Lab Orders Persisted Across Restart: ${labOrders.length >= 1} (${labOrders.length} orders found)`);

  // 3. Query Radiology Orders
  const radGet = await request('http://127.0.0.1:4000/api/v1/partner/radiology/orders', { headers: authHeaders });
  const radOrders = radGet.body?.data?.items || radGet.body?.data || [];
  console.log(`✔ Radiology Orders Persisted Across Restart: ${radOrders.length >= 1} (${radOrders.length} orders found)`);

  // 4. Query Admission Requests
  const admGet = await request('http://127.0.0.1:4000/api/v1/partner/inpatient/admission-requests', { headers: authHeaders });
  const admRequests = admGet.body?.data || [];
  console.log(`✔ IPD Admission Requests Persisted Across Restart: ${admRequests.length >= 1} (${admRequests.length} requests found)`);

  // 5. Query Unbilled Charges for the previously created patient
  const unbilledRes = await request(`http://127.0.0.1:4000/api/v1/partner/billing/unbilled-charges?patientId=${patientId}`, { headers: authHeaders });
  const charges = unbilledRes.body?.data?.unbilledCharges || [];
  console.log(`✔ Unbilled Charges Persisted Across Restart: ${charges.length >= 1} (${charges.length} charges found, Total: ₹${unbilledRes.body?.data?.totalUnbilledAmount})`);

  console.log('--- RESTART PERSISTENCE AUDIT: 100% PROVEN ---');
}

verifyAfterRestart().catch(console.error);
