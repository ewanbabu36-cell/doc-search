import http from 'http';

function makeRequest({ method = 'GET', path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('=== RUNNING COMPREHENSIVE TOKEN MISMATCH E2E AUDIT ===\n');

  // 1. Health check
  const health = await makeRequest({ path: '/health' });
  console.log(`[1] API Gateway Health: status=${health.status}, liveness=${health.body?.status}`);

  // 2. Real Doctor Login (/api/v1/auth/login)
  const login = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/login',
    body: {
      email: 'doctor@docsearch.health',
      password: 'DoctorPass123!'
    }
  });
  console.log(`[2] Doctor Login: status=${login.status}, tokenPresent=${!!login.body?.data?.accessToken}`);
  const validToken = login.body?.data?.accessToken;
  const tenantId = login.body?.data?.user?.tenantId;

  if (!validToken) {
    console.error('Failed to obtain valid token from login:', login.body);
    process.exit(1);
  }

  // 3. Protected Route: /api/v1/partner/account/plan-and-features with Standard 'Bearer <token>'
  const resStd = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'Authorization': `Bearer ${validToken}`, 'x-tenant-id': tenantId }
  });
  console.log(`[3] Protected Route with Bearer (Standard uppercase): status=${resStd.status}, ok=${resStd.status === 200}`);

  // 4. Protected Route with Lowercase 'bearer <token>'
  const resLower = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'Authorization': `bearer ${validToken}`, 'x-tenant-id': tenantId }
  });
  console.log(`[4] Protected Route with lowercase 'bearer ': status=${resLower.status}, ok=${resLower.status === 200}`);

  // 5. Protected Route with Direct JWT (no Bearer prefix)
  const resDirectJwt = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'Authorization': validToken, 'x-tenant-id': tenantId }
  });
  console.log(`[5] Protected Route with direct JWT: status=${resDirectJwt.status}, ok=${resDirectJwt.status === 200}`);

  // 6. Protected Route with 'x-auth-token' header
  const resXAuth = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'x-auth-token': validToken, 'x-tenant-id': tenantId }
  });
  console.log(`[6] Protected Route with 'x-auth-token': status=${resXAuth.status}, ok=${resXAuth.status === 200}`);

  // 7. Protected Route with 'x-access-token' header
  const resXAccess = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'x-access-token': validToken, 'x-tenant-id': tenantId }
  });
  console.log(`[7] Protected Route with 'x-access-token': status=${resXAccess.status}, ok=${resXAccess.status === 200}`);

  // 8. Protected Route with Cookie 'docsearch_auth_token'
  const resCookieAuth = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'Cookie': `docsearch_auth_token=${validToken}`, 'x-tenant-id': tenantId }
  });
  console.log(`[8] Protected Route with Cookie 'docsearch_auth_token': status=${resCookieAuth.status}, ok=${resCookieAuth.status === 200}`);

  // 9. Guard Against 'Bearer null' on Protected Route
  const resBearerNull = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'Authorization': 'Bearer null' }
  });
  console.log(`[9] Guard 'Bearer null': status=${resBearerNull.status} (expected 401), cleanError=${resBearerNull.status === 401}`);

  // 10. Guard Against 'Bearer undefined' on Protected Route
  const resBearerUndef = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'Authorization': 'Bearer undefined' }
  });
  console.log(`[10] Guard 'Bearer undefined': status=${resBearerUndef.status} (expected 401), cleanError=${resBearerUndef.status === 401}`);

  // 11. Guard Against 'Bearer [object Object]' on Protected Route
  const resBearerObj = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'Authorization': 'Bearer [object Object]' }
  });
  console.log(`[11] Guard 'Bearer [object Object]': status=${resBearerObj.status} (expected 401), cleanError=${resBearerObj.status === 401}`);

  // 12. Guard Against 'Bearer ' (empty) on Protected Route
  const resBearerEmpty = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'Authorization': 'Bearer ' }
  });
  console.log(`[12] Guard 'Bearer ': status=${resBearerEmpty.status} (expected 401), cleanError=${resBearerEmpty.status === 401}`);

  // 13. Guard Against 'x-auth-token: null' on Protected Route
  const resXAuthNull = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: { 'x-auth-token': 'null' }
  });
  console.log(`[13] Guard 'x-auth-token: null': status=${resXAuthNull.status} (expected 401), cleanError=${resXAuthNull.status === 401}`);

  // 14. Partner Status Route (/api/v1/auth/partner-status) with Bearer token
  const resPartnerStatusBearer = await makeRequest({
    path: '/api/v1/auth/partner-status',
    headers: { 'Authorization': `Bearer ${validToken}` }
  });
  console.log(`[14] Partner Status with Bearer token: status=${resPartnerStatusBearer.status}, approved=${resPartnerStatusBearer.body?.isApproved}`);

  // 15. Partner Status Route (/api/v1/auth/partner-status) with 'Bearer null' Guard
  const resPartnerStatusNull = await makeRequest({
    path: '/api/v1/auth/partner-status',
    headers: { 'Authorization': 'Bearer null' }
  });
  console.log(`[15] Partner Status with 'Bearer null' Guard: status=${resPartnerStatusNull.status} (expected 401), cleanError=${resPartnerStatusNull.status === 401}`);

  // 16. Doctor Reels Public Feed
  const resReels = await makeRequest({
    path: '/api/v1/reels'
  });
  console.log(`[16] Doctor Reels Public Feed: status=${resReels.status}, count=${resReels.body?.count || 0}`);

  // 17. Doctor Reels Presigned Upload
  const resUpload = await makeRequest({
    method: 'POST',
    path: '/api/v1/reels/presigned-upload',
    headers: { 'Authorization': `Bearer ${validToken}` },
    body: { fileName: 'my-awareness-video.mp4', fileType: 'video/mp4', durationSeconds: 45 }
  });
  console.log(`[17] Doctor Reels Presigned Upload: status=${resUpload.status}, ok=${resUpload.status === 200}`);

  // Evaluation
  const allTestsPassed = (
    resStd.status === 200 &&
    resLower.status === 200 &&
    resDirectJwt.status === 200 &&
    resXAuth.status === 200 &&
    resXAccess.status === 200 &&
    resCookieAuth.status === 200 &&
    resBearerNull.status === 401 &&
    resBearerUndef.status === 401 &&
    resBearerObj.status === 401 &&
    resBearerEmpty.status === 401 &&
    resXAuthNull.status === 401 &&
    resPartnerStatusBearer.status === 200 &&
    resPartnerStatusNull.status === 401 &&
    resReels.status === 200 &&
    resUpload.status === 200
  );

  console.log('\n======================================================');
  console.log(`OVERALL E2E TOKEN AUDIT RESULT: ${allTestsPassed ? 'ALL PASSED (100% SUCCESS)' : 'FAILED'}`);
  console.log('======================================================');

  if (!allTestsPassed) process.exit(1);
}

run().catch(e => {
  console.error('Fatal error during test:', e);
  process.exit(1);
});
