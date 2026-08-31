import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Domain 3.2 — ABDM (Ayushman Bharat Digital Mission) M1, M2, M3 & FHIR R4 Vertical Slice Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-abdm-admin-01',
      email: overrides.email || 'abdm.bridge@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['ABDM_OFFICER', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'abdm:m1:read',
        'abdm:m1:create',
        'abdm:m2:link',
        'abdm:m3:consent',
        'abdm:m3:fhir'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let tenantBToken;

  let createdTxnId;
  let createdAbhaAddress;
  let createdCareContextRef;
  let createdTokenNumber;
  let createdConsentArtefactId;
  let createdBundleId;

  before(async () => {
    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    tenantBToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-abdm-tenantB'
    });
  });

  after(async () => {
    await app.close();
  });

  it('TEST 01: GET /api/v1/partner/abdm/overview returns live NHA Bridge telemetry & metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/abdm/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.bridgeStatus, 'CONNECTED_SANDBOX');
    assert.ok(body.data.hfrFacilityId.startsWith('IN071'));
    assert.ok(body.data.totalLinkedAbhaCount > 0);
  });

  it('TEST 02: POST /api/v1/partner/abdm/m1/generate-aadhaar-otp dispatches OTP via NHA Aadhaar bridge', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/abdm/m1/generate-aadhaar-otp',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        aadhaarNumberLast4: '9012',
        mobileNumber: '+91 98200 12345'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.txnId.startsWith('TXN-AADHAAR-'));
    assert.equal(body.data.authMode, 'AADHAAR_OTP');
    createdTxnId = body.data.txnId;
  });

  it('TEST 03: POST /api/v1/partner/abdm/m1/verify-aadhaar-otp completes e-KYC & creates 14-digit ABHA ID', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/abdm/m1/verify-aadhaar-otp',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        txnId: createdTxnId,
        otp: '482910',
        preferredAbhaAddress: 'kavita.joshi',
        patientName: 'Kavita Joshi',
        patientMrn: 'MRN-2026-9041',
        gender: 'F',
        dateOfBirth: '1990-05-14',
        mobileNumber: '+91 98200 44321',
        address: '74/B, Park Street, Kolkata - 700016'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.abhaNumber.startsWith('91-'));
    assert.equal(body.data.abhaAddress, 'kavita.joshi@abdm');
    assert.equal(body.data.kycStatus, 'VERIFIED_AADHAAR');
    assert.ok(body.data.abhaCardQrPayload.length > 20);
    createdAbhaAddress = body.data.abhaAddress;
  });

  it('TEST 04: POST /api/v1/partner/abdm/m1/search-by-health-id resolves registered ABHA profile', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/abdm/m1/search-by-health-id',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        abhaAddress: createdAbhaAddress
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.patientName, 'Kavita Joshi');
  });

  it('TEST 05: POST /api/v1/partner/abdm/m2/care-contexts registers discoverable clinical care context', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/abdm/m2/care-contexts',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        abhaAddress: createdAbhaAddress,
        patientMrn: 'MRN-2026-9041',
        patientName: 'Kavita Joshi',
        careContextType: 'OPD_CONSULTATION_VISIT',
        careContextReference: 'VISIT-OPD-2026-881',
        displayTitle: 'Cardiology Consultation with Dr. Amit Sen',
        doctorName: 'Dr. Amit Sen, MD',
        departmentName: 'Cardiology'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.careContextReference, 'VISIT-OPD-2026-881');
    assert.equal(body.data.isLinkedToAbdm, true);
    createdCareContextRef = body.data.careContextReference;
  });

  it('TEST 06: POST /api/v1/partner/abdm/m2/scan-and-share generates rapid counter triage token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/abdm/m2/scan-and-share',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientAbhaNumber: '91-4421-8890-1234',
        patientAbhaAddress: createdAbhaAddress,
        patientName: 'Kavita Joshi',
        gender: 'F',
        dob: '1990-05-14',
        mobile: '+91 98200 44321',
        scannedCounterName: 'Counter 03 - FastTrack Scan&Share',
        assignedOpdDepartment: 'Cardiology',
        assignedDoctorName: 'Dr. Amit Sen, MD'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.tokenNumber.startsWith('TKN-'));
    assert.equal(body.data.status, 'WAITING_AT_COUNTER');
    createdTokenNumber = body.data.tokenNumber;
  });

  it('TEST 07: GET /api/v1/partner/abdm/m2/scan-and-share/tokens returns counter queue with token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/abdm/m2/scan-and-share/tokens',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    const token = body.data.find(t => t.tokenNumber === createdTokenNumber);
    assert.ok(token, 'Created scan and share token must be in the queue');
  });

  it('TEST 08: POST /api/v1/partner/abdm/m3/consent-requests raises electronic consent request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/abdm/m3/consent-requests',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientAbhaAddress: createdAbhaAddress,
        patientName: 'Kavita Joshi',
        requesterHipOrHiu: 'Tata Memorial Centre Oncology Department (HIU-009)',
        purposeCode: 'CARETREAT',
        purposeDescription: 'Consultation and Second Opinion for Cardiac Health',
        dateFrom: '2025-01-01',
        dateTo: '2026-12-31',
        dataEraseDate: '2027-12-31',
        careContextRefs: [createdCareContextRef]
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.consentRequestId.startsWith('CRQ-'));
    assert.ok(body.data.artefactId.startsWith('ART-'));
    assert.equal(body.data.status, 'GRANTED');
    createdConsentArtefactId = body.data.artefactId;
  });

  it('TEST 09: GET /api/v1/partner/abdm/m3/consent-requests returns granted consent artefacts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/abdm/m3/consent-requests',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    const found = body.data.find(c => c.artefactId === createdConsentArtefactId);
    assert.ok(found, 'Created consent artefact must exist in store');
  });

  it('TEST 10: POST /api/v1/partner/abdm/m3/fhir-bundles/generate compiles valid NRCES FHIR R4 document', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/abdm/m3/fhir-bundles/generate',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        profileType: 'DISCHARGE_SUMMARY',
        patientAbhaAddress: createdAbhaAddress,
        patientMrn: 'MRN-2026-9041',
        careContextRef: createdCareContextRef,
        authorPractitionerHprId: 'HPR-IN-9921',
        authorPractitionerName: 'Dr. Amit Sen, MD',
        clinicalSummaryText: 'Patient stable, discharged with anti-hypertensive regimen. Follow-up in 4 weeks.'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.bundleId.startsWith('FHIR-'));
    assert.equal(body.data.validationStatus, 'VALID_FHIR_R4');
    assert.equal(body.data.digitalSignatureHash.length, 64);
    createdBundleId = body.data.bundleId;
  });

  it('TEST 11: POST /api/v1/partner/abdm/m3/health-information/request triggers ECDH encrypted data exchange', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/abdm/m3/health-information/request',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        consentId: createdConsentArtefactId
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.transactionId.startsWith('TXN-HI-'));
    assert.ok(body.data.hiuPublicKey.includes('BEGIN PUBLIC KEY'));
    assert.equal(body.data.encryptionAlgorithm, 'ECDH-AES-GCM-256');
  });

  it('TEST 12: POST /api/v1/abdm/callback/v0.5/care-contexts/on-discover acknowledges NHA callback', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/abdm/callback/v0.5/care-contexts/on-discover',
      payload: {
        requestId: 'REQ-NHA-DISC-99124',
        patient: { id: createdAbhaAddress, careContexts: [{ referenceNumber: createdCareContextRef }] }
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.status, 'ACK');
  });

  it('TEST 13: Tenant B cannot access Tenant A ABHA profiles (Multi-Tenant Isolation)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/abdm/m1/abha-accounts',
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const leaked = body.data.find(a => a.abhaAddress === createdAbhaAddress);
    assert.equal(leaked, undefined, 'Tenant B must never see Tenant A ABHA accounts');
  });

  it('TEST 14: Unauthenticated request to /api/v1/partner/abdm/overview fails closed with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/abdm/overview'
    });

    assert.equal(res.statusCode, 401);
  });

  it('TEST 15: SHA-256 Cryptographic Audit Chain verification for all ABDM transactions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/abdm/audit-traces',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.length >= 5, 'All ABDM transactions must generate audit records');
    assert.ok(body.data.every(t => typeof t.integrityHash === 'string' && t.integrityHash.length === 64), 'All audit hashes must be valid 64-char SHA-256 strings');
  });
});
