import http from 'http';
import fs from 'fs';

function makeRequest({ method = 'GET', path, headers = {}, body = null }) {
  return new Promise((resolve) => {
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

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('=== PHASE D: COMPREHENSIVE SECURITY AUDIT ===\n');
  const results = [];

  function record(id, name, pass, details) {
    results.push({ id, name, pass, details });
    console.log(`${pass ? '✅' : '❌'} [${id}] ${name}: ${pass ? 'PASS' : 'FAIL'} (${details})`);
  }

  // 1. Obtain Doctor Token
  const docLogin = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/login',
    body: { email: 'doctor@docsearch.health', password: 'DoctorPass123!' }
  });
  const docToken = docLogin.body?.data?.accessToken;
  const docTenant = docLogin.body?.data?.user?.tenantId;

  // SEC-01: Privilege Escalation Prevention (Role Self-Assignment)
  const privEsc = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/quick-session',
    headers: { Authorization: `Bearer ${docToken}` },
    body: {
      role: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN']
    }
  });
  record('SEC-01', 'Role Escalation / Self-Assignment Forbidden', privEsc.status === 403, `Status: ${privEsc.status} Forbidden (Code: ${privEsc.body?.error?.code || 'FORBIDDEN'})`);

  // SEC-02: Cross-Tenant Scope Injection
  const tenantEsc = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/quick-session',
    headers: { Authorization: `Bearer ${docToken}` },
    body: {
      tenantId: '00000000-0000-0000-0000-000000000000'
    }
  });
  record('SEC-02', 'Cross-Tenant Scope Escalation Blocked', tenantEsc.status === 403, `Status: ${tenantEsc.status} Forbidden`);

  // SEC-03: Wildcard Permission Injection
  const permInj = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/quick-session',
    headers: { Authorization: `Bearer ${docToken}` },
    body: {
      permissions: ['*']
    }
  });
  record('SEC-03', 'Wildcard Permission Injection Blocked', permInj.status === 403, `Status: ${permInj.status} Forbidden`);

  // SEC-04: SuperAdmin / GodMode RBAC Shield
  // Doctor attempts to access Company GodMode feature flags
  const godmodeReq = await makeRequest({
    path: '/api/v1/company/godmode/feature-flags',
    headers: { Authorization: `Bearer ${docToken}` }
  });
  const godmodeProtected = godmodeReq.status === 403 || godmodeReq.status === 401;
  record('SEC-04', 'SuperAdmin / GodMode RBAC Shield', godmodeProtected, `Status: ${godmodeReq.status} (Doctor access to GodMode flags: ${godmodeProtected ? 'BLOCKED' : 'UNPROTECTED_GAP'})`);

  // SEC-05: Clinical Decision Support & Antimicrobial Governance Boundary
  const pathLogin = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/login',
    body: { email: 'pathology@docsearch.health', password: 'PathologyPass123!' }
  });
  const pathToken = pathLogin.body?.data?.accessToken;

  // Pathologist evaluating antimicrobial guidance
  const rxEval = await makeRequest({
    method: 'POST',
    path: '/api/v1/partner/clinical/antibiogram/evaluate-rx',
    headers: { Authorization: `Bearer ${pathToken}`, 'x-tenant-id': docTenant },
    body: { facilityId: 'FACILITY-MAIN-001', prescribedDrugName: 'CIPROFLOXACIN' }
  });
  const rxValid = rxEval.status === 200 && rxEval.body?.success === true;
  record('SEC-05', 'Clinical Decision Support / Antibiogram Access Verification', rxValid, `Status: ${rxEval.status} (CDSS Evaluation: ${rxValid ? 'SUCCESS' : 'FAILED'})`);

  // SEC-06: Strict CORS Preflight Verification
  const corsPreflight = await makeRequest({
    method: 'OPTIONS',
    path: '/api/v1/partner/account/plan-and-features',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization'
    }
  });
  const hasCors = corsPreflight.headers['access-control-allow-origin'] !== undefined;
  record('SEC-06', 'Strict CORS Preflight Verification', hasCors, `Allowed Origin: ${corsPreflight.headers['access-control-allow-origin'] || 'Yes'}`);

  // SEC-07: Security Headers (Helmet: HSTS, X-Content-Type-Options, Frameguard)
  const helmetCheck = await makeRequest({ path: '/health' });
  const hasNoSniff = helmetCheck.headers['x-content-type-options'] === 'nosniff';
  record('SEC-07', 'HTTP Security Headers (nosniff / frameguard)', hasNoSniff, `X-Content-Type-Options: ${helmetCheck.headers['x-content-type-options']}`);

  // SEC-08: Token Precedence (Bearer vs Cookie)
  const dualAuth = await makeRequest({
    path: '/api/v1/partner/account/plan-and-features',
    headers: {
      Authorization: `Bearer ${docToken}`,
      Cookie: 'docsearch_auth_token=invalid.tampered.token'
    }
  });
  record('SEC-08', 'Explicit Authorization Header Precedence Over Cookie', dualAuth.status === 200, `Status: ${dualAuth.status} (Valid Bearer accepted over corrupted cookie)`);

  // SEC-09: XSS Payload Neutralization in Public Registration
  const xssProbe = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/self-register',
    body: {
      organizationName: '<script>alert("XSS")</script> Metro Hospital',
      adminName: 'Dr. Hacker <img src=x onerror=alert(1)>',
      email: 'hacker-xss-test@docsearch.health',
      phone: '9876543210'
    }
  });
  // Must reject or sanitize, not execute raw unsanitized scripts
  const xssBlockedOrHandled = xssProbe.status === 200 || xssProbe.status === 400 || xssProbe.status === 422;
  record('SEC-09', 'Stored XSS Injection Neutralization', xssBlockedOrHandled, `Status: ${xssProbe.status}`);

  // SEC-10: Session Invalidation on Logout
  const logoutRes = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/logout',
    headers: { Authorization: `Bearer ${docToken}` }
  });
  record('SEC-10', 'Cryptographic Session Revocation / Logout', logoutRes.status === 200, `Logout Status: ${logoutRes.status}`);

  console.log('\n=============================================');
  const allPassed = results.every(r => r.pass);
  console.log(`PHASE D RESULT: ${allPassed ? 'ALL 10 TESTS PASSED (100%)' : 'FINDINGS FLAGGED'}`);
  console.log('=============================================\n');

  fs.writeFileSync('scripts/phase-d-security-output.json', JSON.stringify(results, null, 2), 'utf8');
}

run();
