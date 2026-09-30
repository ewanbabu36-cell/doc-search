import { Client } from 'pg';

const BASE_URL = process.env.API_URL || 'http://localhost:4000';
const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

const results = [];

function record(name, passed, details = '') {
  results.push({ name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name} ${details ? `(${details})` : ''}`);
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function getDbClient() {
  const client = new Client({ connectionString: PG_CONN });
  await client.connect();
  return client;
}

async function runVerification() {
  console.log('========================================================================');
  console.log('DOC SEARCH CATEGORY 11: AUTHENTICATION LIFECYCLE VERIFICATION SUITE');
  console.log(`Target: ${BASE_URL} | Database: Native PostgreSQL 18.4`);
  console.log('========================================================================\n');

  let pg;
  try {
    pg = await getDbClient();
    console.log('Connected to Native PostgreSQL 18.4 on Port 5432.\n');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  try {
    // ------------------------------------------------------------------------
    // STAGE 1: SuperAdmin / Founder Authentication
    // ------------------------------------------------------------------------
    console.log('--- STAGE 1: SuperAdmin / Founder Authentication ---');
    const founderLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'founder@docsearch.health', password: 'FounderPass123!' })
    });
    const founderPass = founderLogin.status === 200 && founderLogin.data?.success && founderLogin.data?.data?.accessToken;
    record('SuperAdmin Login (founder@docsearch.health)', founderPass, `HTTP ${founderLogin.status}`);
    const founderToken = founderLogin.data?.data?.accessToken;

    // ------------------------------------------------------------------------
    // STAGE 2: Partner Registration & KYC Approval Gate
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 2: Partner Registration & KYC Approval Gate ---');

    const partnerRegistrations = [
      {
        email: 'doctor@cityclinic.org',
        pass: 'Doctor@123',
        name: 'Dr. Ramesh Sharma',
        type: 'CLINIC',
        facility: 'City Healthcare Clinic',
        role: 'CLINIC_DOCTOR',
        plan: 'Clinic Founding Partner (1st Year Free)'
      },
      {
        email: 'pharmacist@lifecare.com',
        pass: 'Pharma@123',
        name: 'Suresh Patel',
        type: 'PHARMACY',
        facility: 'LifeCare Pharmacy & Retail',
        role: 'PHARMACIST',
        plan: 'Pharmacy Pro & WhatsApp POS'
      },
      {
        email: 'labtech@metropolis.com',
        pass: 'LabTech@123',
        name: 'Anjali Verma',
        type: 'PATHOLOGY',
        facility: 'Metropolis Diagnostics Lab',
        role: 'LAB_TECHNICIAN',
        plan: 'Pathology Pro & Barcode LIMS'
      }
    ];

    for (const p of partnerRegistrations) {
      const regRes = await request('/api/v1/auth/self-register', {
        method: 'POST',
        body: JSON.stringify({
          partner: {
            email: p.email,
            password: p.pass,
            name: p.name,
            organizationType: p.type,
            facilityName: p.facility,
            role: p.role
          }
        })
      });

      const regOk = (regRes.status === 200 || regRes.status === 201) && regRes.data?.success;
      record(`Self-Registration for ${p.role} (${p.email})`, regOk, `HTTP ${regRes.status}`);

      // Approve in verification queue using founder token
      const dbId = regRes.data?.dbId;
      if (dbId) {
        const approveRes = await request(`/api/v1/auth/verification-queue/${dbId}/approve`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${founderToken}` },
          body: JSON.stringify({ assignedPlan: p.plan })
        });
        record(`HQ KYC Approval for ${p.facility}`, approveRes.status === 200, `HTTP ${approveRes.status}`);
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 3: Positive Authentication Matrix
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 3: Positive Authentication Matrix ---');

    let doctorSession = null;
    let pharmaSession = null;
    let labtechSession = null;

    for (const p of partnerRegistrations) {
      const loginRes = await request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: p.email, password: p.pass })
      });

      const loginOk = loginRes.status === 200 && loginRes.data?.success && loginRes.data?.data?.accessToken && loginRes.data?.data?.refreshToken;
      record(`Positive Login for ${p.role} (${p.email})`, loginOk, `HTTP ${loginRes.status}`);

      if (p.role === 'CLINIC_DOCTOR') doctorSession = loginRes.data?.data;
      if (p.role === 'PHARMACIST') pharmaSession = loginRes.data?.data;
      if (p.role === 'LAB_TECHNICIAN') labtechSession = loginRes.data?.data;
    }

    // ------------------------------------------------------------------------
    // STAGE 4: PostgreSQL Native Session Persistence
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 4: Native PostgreSQL Session Persistence ---');
    const dbSessionRes = await pg.query(
      'SELECT id, user_id, tenant_id, token_family_id, revoked_at, created_at FROM core.sessions ORDER BY created_at DESC LIMIT 5;'
    );
    const hasSessionsInDb = dbSessionRes.rows.length >= 3;
    record(
      'Database core.sessions contains persisted rows',
      hasSessionsInDb,
      `Found ${dbSessionRes.rows.length} sessions in PostgreSQL`
    );

    // ------------------------------------------------------------------------
    // STAGE 5: Negative Login Enforcement
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 5: Negative Login Enforcement ---');

    // 5a. Incorrect password
    const badPassRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'doctor@cityclinic.org', password: 'IncorrectPassword999!' })
    });
    record('Rejection on incorrect password', badPassRes.status === 401, `HTTP ${badPassRes.status}`);

    // 5b. Non-existent user
    const nonExistentRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ghost.user@nonexistent.domain', password: 'AnyPassword123!' })
    });
    record('Rejection on non-existent account', nonExistentRes.status === 401, `HTTP ${nonExistentRes.status}`);

    // 5c. SQL Injection resilience
    const sqliRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: "' OR '1'='1' --", password: "' OR '1'='1' --" })
    });
    record('SQL Injection payload safely rejected', sqliRes.status === 400 || sqliRes.status === 401, `HTTP ${sqliRes.status}`);

    // ------------------------------------------------------------------------
    // STAGE 6: Cryptographic Token Verification on Protected Route
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 6: Cryptographic Token Verification ---');

    // 6a. Valid access token
    const meRes = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorSession.accessToken}` }
    });
    const validMe = meRes.status === 200 && (meRes.data?.data?.email === 'doctor@cityclinic.org' || meRes.data?.data?.user?.email === 'doctor@cityclinic.org');
    record('Valid access token authorizes GET /api/v1/auth/me', validMe, `HTTP ${meRes.status}`);

    // 6b. Tampered token signature
    const parts = doctorSession.accessToken.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.tampered_signature_bytes`;
    const tamperedRes = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    record('Tampered JWT signature rejected with 401', tamperedRes.status === 401, `HTTP ${tamperedRes.status}`);

    // 6c. Missing token
    const missingRes = await request('/api/v1/auth/me', { method: 'GET' });
    record('Missing Authorization header rejected with 401', missingRes.status === 401, `HTTP ${missingRes.status}`);

    // 6d. Malformed token format
    const malformedRes = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer totally_invalid_not_a_jwt' }
    });
    record('Malformed token rejected with 401', malformedRes.status === 401, `HTTP ${malformedRes.status}`);

    // ------------------------------------------------------------------------
    // STAGE 7: Refresh Token Flow & Rotation Security
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 7: Refresh Token Rotation & Reuse Detection ---');

    const refreshRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: doctorSession.refreshToken })
    });

    const refreshSuccess =
      refreshRes.status === 200 &&
      refreshRes.data?.data?.accessToken &&
      refreshRes.data?.data?.refreshToken &&
      refreshRes.data.data.refreshToken !== doctorSession.refreshToken;

    record('Refresh token rotated successfully with new tokens', refreshSuccess, `HTTP ${refreshRes.status}`);

    const rotatedAccessToken = refreshRes.data?.data?.accessToken;

    // Verify new access token works
    const rotatedMeRes = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${rotatedAccessToken}` }
    });
    record('Rotated access token authorizes protected API', rotatedMeRes.status === 200, `HTTP ${rotatedMeRes.status}`);

    // REUSE DETECTION: Try to use the old refresh token again
    const reuseRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: doctorSession.refreshToken })
    });
    const reuseBlocked = reuseRes.status === 401 || reuseRes.status === 403;
    record('Refresh token reuse detected and rejected', reuseBlocked, `HTTP ${reuseRes.status}`);

    // ------------------------------------------------------------------------
    // STAGE 8: Real Logout & Instant Revocation
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 8: Real Logout & Instant Revocation ---');

    // Call POST /api/v1/auth/logout with the Pharmacist Bearer token
    const preLogoutMe = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${pharmaSession.accessToken}` }
    });
    record('Pharmacist pre-logout token is valid', preLogoutMe.status === 200, `HTTP ${preLogoutMe.status}`);

    const logoutRes = await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pharmaSession.accessToken}` }
    });
    record('POST /api/v1/auth/logout returns 200', logoutRes.status === 200, `HTTP ${logoutRes.status}`);

    // CRITICAL INVARIANT: The same token MUST now be rejected with 401 Unauthorized!
    const postLogoutMe = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${pharmaSession.accessToken}` }
    });
    record(
      'Post-logout token IMMEDIATELY rejected with 401 Unauthorized',
      postLogoutMe.status === 401,
      `HTTP ${postLogoutMe.status} (Expected 401)`
    );

    // Verify database revocation record exists
    const dbRevocations = await pg.query(
      "SELECT id, target_type, target_id, reason, revoked_at FROM core.revocations WHERE target_type = 'SESSION' ORDER BY revoked_at DESC LIMIT 1;"
    );
    const hasDbRevocation = dbRevocations.rows.length > 0;
    record('PostgreSQL core.revocations records session termination', hasDbRevocation, `Target ID: ${dbRevocations.rows[0]?.target_id}`);

    // ------------------------------------------------------------------------
    // STAGE 9: Password Change & Stale Session Invalidation
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 9: Password Change & Session Invalidation ---');

    // Pre-change token works
    const prePassToken = labtechSession.accessToken;
    const prePassMe = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${prePassToken}` }
    });
    record('Pre-password-change token works', prePassMe.status === 200, `HTTP ${prePassMe.status}`);

    // Change password
    const changePassRes = await request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'labtech@metropolis.com',
        currentPassword: 'LabTech@123',
        newPassword: 'LabTech@456New!'
      })
    });
    record('Password changed successfully', changePassRes.status === 200, `HTTP ${changePassRes.status}`);

    // CRITICAL INVARIANT: Token issued before password change MUST be rejected!
    const postPassOldToken = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${prePassToken}` }
    });
    record(
      'Pre-change token invalidated after password update',
      postPassOldToken.status === 401,
      `HTTP ${postPassOldToken.status} (Expected 401)`
    );

    // Old password should fail login
    const oldPassLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'labtech@metropolis.com', password: 'LabTech@123' })
    });
    record('Old password rejected on new login attempt', oldPassLogin.status === 401, `HTTP ${oldPassLogin.status}`);

    // New password should succeed
    const newPassLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'labtech@metropolis.com', password: 'LabTech@456New!' })
    });
    record('New password authenticates successfully', newPassLogin.status === 200, `HTTP ${newPassLogin.status}`);

    // Revert password back
    await request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'labtech@metropolis.com',
        currentPassword: 'LabTech@456New!',
        newPassword: 'LabTech@123'
      })
    });

    // ------------------------------------------------------------------------
    // STAGE 10: Re-Login & Session Lifecycle Closure
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 10: Re-Login & Lifecycle Closure ---');
    const reloginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'pharmacist@lifecare.com', password: 'Pharma@123' })
    });
    const reloginOk = reloginRes.status === 200 && reloginRes.data?.data?.accessToken;
    record('Logged-out user can cleanly re-authenticate', reloginOk, `HTTP ${reloginRes.status}`);

    const reloginMe = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${reloginRes.data?.data?.accessToken}` }
    });
    record('Fresh session after re-login works normally', reloginMe.status === 200, `HTTP ${reloginMe.status}`);

    // ------------------------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------------------------
    console.log('\n========================================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================================================');

    if (failed > 0) {
      console.error('\n❌ CATEGORY 11 AUTHENTICATION SUITE FAILED!');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL CATEGORY 11 AUTHENTICATION INVARIANTS VERIFIED 100%!');
      process.exit(0);
    }
  } finally {
    await pg.end();
  }
}

runVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
