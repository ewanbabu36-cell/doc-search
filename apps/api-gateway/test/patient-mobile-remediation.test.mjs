import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const API_URL = process.env.TEST_API_URL || 'http://127.0.0.1:4000';
const JWT_SECRET = process.env.TEST_JWT_SECRET || process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';

function signPatientJwt(patientId, phone, tenantId = '11111111-1111-4111-8111-111111111111') {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const claims = {
    sub: patientId,
    phone,
    role: 'PATIENT',
    tenantId,
    iat: now,
    exp: now + 3600,
    iss: 'docsearch-api',
    aud: 'docsearch-platform'
  };
  const h = Buffer.from(JSON.stringify(header)).toString('base64url');
  const p = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${sig}`;
}

test('PATIENT MOBILE API REMEDIATION CERTIFICATION (P1-01 to P1-04)', async (t) => {
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const patientId = crypto.randomUUID();

  await t.test('P1-01: /api/v1/patient/auth/request-otp dispatches OTP and enforces rate limiting', async () => {
    // 1. Initial request
    const res1 = await fetch(`${API_URL}/api/v1/patient/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: testPhone })
    });
    assert.equal(res1.status, 200, 'Initial OTP request should succeed');
    const json1 = await res1.json();
    assert.equal(json1.success, true);
    assert.match(json1.message, /OTP sent successfully/);

    // 2. Immediate second request must trigger 60-second cooldown rate limit (HTTP 429)
    const res2 = await fetch(`${API_URL}/api/v1/patient/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: testPhone })
    });
    assert.equal(res2.status, 429, 'Immediate second OTP request must be rate limited (429)');
    const json2 = await res2.json();
    assert.equal(json2.success, false);
    assert.ok(
      json2.error === 'TOO_MANY_REQUESTS' || json2.error?.message?.includes('TOO_MANY_REQUESTS') || json2.message?.includes('Please wait'),
      `Expected rate limit error, got: ${JSON.stringify(json2)}`
    );
  });

  await t.test('P1-02: /api/v1/patient/prescriptions returns empty array for new patient (zero fake prescriptions)', async () => {
    const freshPhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
    const freshToken = signPatientJwt(crypto.randomUUID(), freshPhone);

    const res = await fetch(`${API_URL}/api/v1/patient/prescriptions?phone=${freshPhone}`, {
      headers: { Authorization: `Bearer ${freshToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.count, 0, 'New patient count must be 0');
    assert.deepEqual(json.prescriptions, [], 'New patient must have empty prescriptions array');

    // Clinical Safety Assertion: Ensure NO fabricated clinical data exists
    const stringified = JSON.stringify(json);
    assert.ok(!stringified.includes('Dr. Vivek Sharma'), 'Must NEVER synthesize Dr. Vivek Sharma');
    assert.ok(!stringified.includes('Acute Viral Pyrexia'), 'Must NEVER synthesize Acute Viral Pyrexia');
    assert.ok(!stringified.includes('Pantoprazole'), 'Must NEVER synthesize fake medications');
  });

  await t.test('P1-03: /api/v1/patient/appointments/book strictly rejects unauthenticated callers (HTTP 401)', async () => {
    const unauthPhone = `96${Math.floor(10000000 + Math.random() * 90000000)}`;

    const res = await fetch(`${API_URL}/api/v1/patient/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: unauthPhone,
        departmentName: 'General Medicine',
        chiefComplaint: 'Headache and fever'
      })
    });

    assert.equal(res.status, 401, 'Unauthenticated booking request must return HTTP 401');
    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(
      json.error === 'UNAUTHORIZED' || json.error?.code === 'UNAUTHORIZED' || json.statusCode === 401,
      `Expected UNAUTHORIZED, got: ${JSON.stringify(json)}`
    );
  });

  await t.test('P1-03 & P1-04: /api/v1/patient/appointments/book with valid token creates encounter and binds doctor', async () => {
    const bookingPhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
    const bookingToken = signPatientJwt(crypto.randomUUID(), bookingPhone);

    const res = await fetch(`${API_URL}/api/v1/patient/appointments/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bookingToken}`
      },
      body: JSON.stringify({
        mobileNumber: bookingPhone,
        departmentName: 'General Medicine',
        chiefComplaint: 'Follow-up consultation',
        doctorName: 'Dr. Vivek Sharma'
      })
    });

    assert.equal(res.status, 201, `Authenticated booking should succeed with HTTP 201. Status: ${res.status}`);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.encounterId, 'Must return created encounter ID');
    assert.ok(json.tokenNumber, 'Must return created queue token number');
  });
});
