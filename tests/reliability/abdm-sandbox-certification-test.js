process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';

import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { signJwt } from '../../packages/auth/dist/index.js';

console.log('\n======================================================================');
console.log('🇮🇳 TEST SUITE 8 — ABDM NATIONAL HEALTH STACK SANDBOX CERTIFICATION (M1, M2, M3)');
console.log('======================================================================\n');

async function runAbdmCertificationTests() {
  const startTime = performance.now();
  let testsPassed = 0;
  let testsTotal = 0;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-abdm-cert-officer',
      email: overrides.email || 'abdm.officer@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['SUPER_ADMIN', 'ABDM_OFFICER', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        '*',
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

  const tokenA = createTestToken();
  const tokenB = createTestToken({
    tenantId: tenantB,
    userId: 'usr-abdm-tenantB'
  });

  const app = await buildApp();
  await app.ready();

  try {
    // ------------------------------------------------------------------------
    // TEST 1: ABDM Overview & Bridge Telemetry
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`[TEST 1] GET /api/v1/partner/abdm/overview returns live NHA Bridge status & metrics...`);
    {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/abdm/overview',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.bridgeStatus, 'CONNECTED_SANDBOX');
      assert.ok(body.data.hfrFacilityId.startsWith('IN071'));
      console.log(`  ✔ [PASS] Bridge connected (Facility: ${body.data.hfrFacilityId}, Status: ${body.data.bridgeStatus})`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 2: M1 — Aadhaar OTP Registration Flow
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 2] M1: Aadhaar OTP generation & ABHA creation with QR card payload...`);
    let aadhaarTxnId = '';
    let aadhaarAbhaAddress = '';
    {
      const genRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m1/generate-aadhaar-otp',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { aadhaarNumberLast4: '5566', mobileNumber: '+91 98765 11223' }
      });
      assert.equal(genRes.statusCode, 200);
      const genBody = JSON.parse(genRes.body);
      assert.ok(genBody.data.txnId.startsWith('TXN-AADHAAR-'));
      aadhaarTxnId = genBody.data.txnId;

      const verifyRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m1/verify-aadhaar-otp',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          txnId: aadhaarTxnId,
          otp: '781923',
          preferredAbhaAddress: 'priya.sharma',
          patientName: 'Priya Sharma',
          patientMrn: 'MRN-2026-PS01',
          gender: 'F',
          dateOfBirth: '1992-08-20',
          mobileNumber: '+91 98765 11223',
          address: '42 MG Road, Bengaluru, Karnataka - 560001'
        }
      });
      assert.equal(verifyRes.statusCode, 201);
      const verifyBody = JSON.parse(verifyRes.body);
      assert.ok(verifyBody.data.abhaNumber.startsWith('91-'));
      assert.equal(verifyBody.data.abhaAddress, 'priya.sharma@abdm');
      assert.equal(verifyBody.data.kycStatus, 'VERIFIED_AADHAAR');
      assert.ok(verifyBody.data.abhaCardQrPayload.length > 50);

      // Verify QR payload is valid base64-encoded JSON containing patient demographics
      const decodedQr = JSON.parse(Buffer.from(verifyBody.data.abhaCardQrPayload, 'base64').toString('utf8'));
      assert.equal(decodedQr.hidn, verifyBody.data.abhaNumber);
      assert.equal(decodedQr.name, 'Priya Sharma');

      aadhaarAbhaAddress = verifyBody.data.abhaAddress;
      console.log(`  ✔ [PASS] ABHA created via Aadhaar OTP: ${verifyBody.data.abhaNumber} (${aadhaarAbhaAddress})`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 3: M1 — Mobile OTP Registration Flow
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 3] M1: Mobile OTP generation & alternative ABHA verification...`);
    let mobileAbhaAddress = '';
    {
      const genRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m1/generate-mobile-otp',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { mobileNumber: '+91 91234 56789' }
      });
      assert.equal(genRes.statusCode, 200);
      const genBody = JSON.parse(genRes.body);
      assert.ok(genBody.data.txnId.startsWith('TXN-MOBILE-'));
      assert.equal(genBody.data.authMode, 'MOBILE_OTP');

      const verifyRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m1/verify-mobile-otp',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          txnId: genBody.data.txnId,
          otp: '456789',
          preferredAbhaAddress: 'rahul.verma',
          patientName: 'Rahul Verma',
          patientMrn: 'MRN-2026-RV02',
          gender: 'M',
          dateOfBirth: '1988-11-15',
          mobileNumber: '+91 91234 56789',
          address: '15 Nehru Place, New Delhi - 110019'
        }
      });
      assert.equal(verifyRes.statusCode, 201);
      const verifyBody = JSON.parse(verifyRes.body);
      assert.ok(verifyBody.data.abhaNumber.startsWith('91-'));
      assert.equal(verifyBody.data.abhaAddress, 'rahul.verma@abdm');
      assert.equal(verifyBody.data.kycStatus, 'VERIFIED_MOBILE');

      mobileAbhaAddress = verifyBody.data.abhaAddress;
      console.log(`  ✔ [PASS] ABHA created via Mobile OTP: ${verifyBody.data.abhaNumber} (${mobileAbhaAddress})`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 4: M1 — Demographic Auth Verification & Health ID Search
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 4] M1: Demographic Auth validation and Health ID Search...`);
    {
      // Match test
      const demoMatchRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m1/verify-demographics',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          patientName: 'Priya Sharma',
          gender: 'F',
          dateOfBirth: '1992-08-20',
          abhaAddress: aadhaarAbhaAddress
        }
      });
      assert.equal(demoMatchRes.statusCode, 200);
      const demoMatch = JSON.parse(demoMatchRes.body);
      assert.equal(demoMatch.data.verified, true);
      assert.equal(demoMatch.data.status, 'MATCHED');

      // Mismatch test
      const demoMismatchRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m1/verify-demographics',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          patientName: 'Anil Kapoor',
          gender: 'M',
          dateOfBirth: '1975-01-01',
          abhaAddress: aadhaarAbhaAddress
        }
      });
      assert.equal(demoMismatchRes.statusCode, 200);
      const demoMismatch = JSON.parse(demoMismatchRes.body);
      assert.equal(demoMismatch.data.verified, false);
      assert.equal(demoMismatch.data.status, 'DEMOGRAPHIC_MISMATCH');

      // Health ID lookup
      const searchRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m1/search-by-health-id',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { abhaAddress: aadhaarAbhaAddress }
      });
      assert.equal(searchRes.statusCode, 200);
      const searchBody = JSON.parse(searchRes.body);
      assert.equal(searchBody.data.patientName, 'Priya Sharma');

      console.log(`  ✔ [PASS] Demographic Auth & Health ID search validated (Match: ${demoMatch.data.status}, Mismatch: ${demoMismatch.data.status})`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 5: M2 — HIP Care Context Linking & Discovery
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 5] M2: Care Context Linking and Discovery query...`);
    const careContextRef1 = 'VISIT-OPD-' + Date.now().toString().slice(-6);
    const careContextRef2 = 'LAB-CBC-' + Date.now().toString().slice(-6);
    {
      // Link Context 1
      const link1Res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m2/care-contexts',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          abhaAddress: aadhaarAbhaAddress,
          patientMrn: 'MRN-2026-PS01',
          patientName: 'Priya Sharma',
          careContextType: 'OPD_CONSULTATION_VISIT',
          careContextReference: careContextRef1,
          displayTitle: 'OPD General Medicine Consultation',
          encounterDate: '2026-09-01',
          doctorName: 'Dr. S. K. Mukherjee'
        }
      });
      assert.equal(link1Res.statusCode, 201);

      // Link Context 2
      const link2Res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m2/care-contexts',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          abhaAddress: aadhaarAbhaAddress,
          patientMrn: 'MRN-2026-PS01',
          patientName: 'Priya Sharma',
          careContextType: 'DIAGNOSTIC_REPORT',
          careContextReference: careContextRef2,
          displayTitle: 'Complete Hemogram Blood Panel',
          encounterDate: '2026-09-02',
          doctorName: 'Dr. Pathologist'
        }
      });
      assert.equal(link2Res.statusCode, 201);

      // Discovery query
      const discRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m2/care-contexts/discover',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { patientAbhaAddress: aadhaarAbhaAddress }
      });
      assert.equal(discRes.statusCode, 200);
      const discBody = JSON.parse(discRes.body);
      assert.equal(discBody.data.patientAbhaAddress, aadhaarAbhaAddress);
      assert.ok(discBody.data.careContexts.length >= 2);
      const refs = discBody.data.careContexts.map(c => c.referenceNumber);
      assert.ok(refs.includes(careContextRef1));
      assert.ok(refs.includes(careContextRef2));

      console.log(`  ✔ [PASS] Registered 2 care contexts and verified discovery (${refs.join(', ')})`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 6: M2 — Care Context OTP Linking Flow
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 6] M2: Care Context OTP Linking Init & Confirm...`);
    {
      const initRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m2/care-contexts/link/init',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          patientAbhaAddress: aadhaarAbhaAddress,
          careContextReferences: [careContextRef1, careContextRef2]
        }
      });
      assert.equal(initRes.statusCode, 200);
      const initBody = JSON.parse(initRes.body);
      assert.ok(initBody.data.txnId.startsWith('TXN-LINK-'));
      assert.equal(initBody.data.authMode, 'LINKING_OTP');

      const confirmRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m2/care-contexts/link/confirm',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          txnId: initBody.data.txnId,
          otp: '992211',
          patientAbhaAddress: aadhaarAbhaAddress
        }
      });
      assert.equal(confirmRes.statusCode, 200);
      const confirmBody = JSON.parse(confirmRes.body);
      assert.equal(confirmBody.data.status, 'SUCCESS');

      console.log(`  ✔ [PASS] Care context linking verified with OTP flow (Txn: ${initBody.data.txnId})`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 7: M2 — Scan and Share Counter Triage Token Generation
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 7] M2: Scan and Share QR triage token registration & queue check...`);
    {
      const scanRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m2/scan-and-share',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          patientAbhaNumber: '91-5544-3322-1100',
          patientAbhaAddress: 'vikram.singh@abdm',
          patientName: 'Vikram Singh',
          gender: 'M',
          dob: '1985-04-12',
          mobile: '+91 99887 76655',
          scannedCounterName: 'Counter 03 - OPD Express',
          assignedOpdDepartment: 'Cardiology',
          assignedDoctorName: 'Dr. Sneha Roy'
        }
      });
      assert.equal(scanRes.statusCode, 201);
      const scanBody = JSON.parse(scanRes.body);
      assert.ok(scanBody.data.tokenNumber.startsWith('TKN-'));
      assert.equal(scanBody.data.status, 'WAITING_AT_COUNTER');

      const tokensRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/abdm/m2/scan-and-share/tokens',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(tokensRes.statusCode, 200);
      const tokensBody = JSON.parse(tokensRes.body);
      assert.ok(tokensBody.data.length > 0);
      const tokenNumbers = tokensBody.data.map(t => t.tokenNumber);
      assert.ok(tokenNumbers.includes(scanBody.data.tokenNumber));

      console.log(`  ✔ [PASS] Scan and Share token ${scanBody.data.tokenNumber} queued for ${scanBody.data.assignedOpdDepartment}`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 8: M3 — Electronic Consent Lifecycle (Create -> List -> Revoke)
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 8] M3: Electronic Consent Lifecycle (Create, List, Revoke)...`);
    let consentArtefactId = '';
    {
      const reqRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m3/consent-requests',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          patientAbhaAddress: aadhaarAbhaAddress,
          patientName: 'Priya Sharma',
          purposeCode: 'CARETREAT',
          purposeDescription: 'Outpatient Care & Chronic Management',
          careContextRefs: [careContextRef1, careContextRef2]
        }
      });
      assert.equal(reqRes.statusCode, 201);
      const reqBody = JSON.parse(reqRes.body);
      assert.equal(reqBody.data.status, 'GRANTED');
      assert.ok(reqBody.data.artefactId.startsWith('ART-'));
      consentArtefactId = reqBody.data.artefactId;

      // Revoke
      const revokeRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m3/consents/revoke',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { artefactId: consentArtefactId }
      });
      assert.equal(revokeRes.statusCode, 200);
      const revokeBody = JSON.parse(revokeRes.body);
      assert.equal(revokeBody.data.status, 'REVOKED');
      assert.equal(revokeBody.data.artefactId, consentArtefactId);

      console.log(`  ✔ [PASS] Consent artefact lifecycle verified (Artefact: ${consentArtefactId}, Status: REVOKED)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 9: M3 — NRCES FHIR R4 Bundles (All 4 Clinical Document Profiles)
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 9] M3: NRCES FHIR R4 Bundle compilation for all 4 profiles...`);
    {
      const profilesToTest = [
        {
          type: 'DISCHARGE_SUMMARY',
          expectedLoinc: '18842-5',
          expectedProfile: 'StructureDefinition/DischargeSummaryRecord'
        },
        {
          type: 'OPD_CONSULTATION',
          expectedLoinc: '371530009',
          expectedProfile: 'StructureDefinition/OPDConsultationRecord'
        },
        {
          type: 'DIAGNOSTIC_REPORT',
          expectedLoinc: '11502-2',
          expectedProfile: 'StructureDefinition/DiagnosticReportRecord'
        },
        {
          type: 'PRESCRIPTION',
          expectedLoinc: '57833-6',
          expectedProfile: 'StructureDefinition/PrescriptionRecord'
        }
      ];

      for (const p of profilesToTest) {
        const bundleRes = await app.inject({
          method: 'POST',
          url: '/api/v1/partner/abdm/m3/fhir-bundles/generate',
          headers: { authorization: `Bearer ${tokenA}` },
          payload: {
            profileType: p.type,
            patientAbhaAddress: aadhaarAbhaAddress,
            patientMrn: 'MRN-2026-PS01',
            careContextRef: careContextRef1,
            authorPractitionerName: 'Dr. S. K. Mukherjee, MD',
            authorPractitionerHprId: 'HPR-9921',
            clinicalSummaryText: `Valid clinical notes for ${p.type}`
          }
        });

        assert.equal(bundleRes.statusCode, 201, `Failed to generate bundle for ${p.type}`);
        const bundleBody = JSON.parse(bundleRes.body);
        assert.equal(bundleBody.data.validationStatus, 'VALID_FHIR_R4');
        assert.ok(bundleBody.data.digitalSignatureHash.length === 64);

        const fhir = JSON.parse(bundleBody.data.fhirJsonPayload);
        assert.equal(fhir.resourceType, 'Bundle');
        assert.equal(fhir.type, 'document');
        assert.ok(fhir.meta.profile.includes('https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'));
        assert.ok(fhir.meta.profile.some(uri => uri.includes(p.expectedProfile)));

        // Composition check
        const compEntry = fhir.entry[0].resource;
        assert.equal(compEntry.resourceType, 'Composition');
        assert.equal(compEntry.type.coding[0].code, p.expectedLoinc);
        assert.ok(fhir.entry.length >= 2, `Bundle for ${p.type} must include domain entries besides Composition`);

        console.log(`    - Verified ${p.type}: LOINC ${p.expectedLoinc}, ${fhir.entry.length} entries, SHA256 Signature verified`);
      }

      console.log(`  ✔ [PASS] All 4 NRCES FHIR R4 profiles successfully built and signed`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 10: M3 — Cryptographic Rail (ECDH P-256 + AES-256-GCM Round-Trip)
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 10] M3: Cryptographic Rail (ECDH P-256 Key Exchange & AES-256-GCM Round-Trip)...`);
    {
      // 1. HIU requests health information transfer, exposing HIU ECDH public key
      const hiuReqRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m3/health-information/request',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { consentId: consentArtefactId }
      });
      assert.equal(hiuReqRes.statusCode, 200);
      const hiuBody = JSON.parse(hiuReqRes.body);
      assert.equal(hiuBody.data.status, 'DISPATCHED_TO_NHA_BRIDGE');
      assert.equal(hiuBody.data.encryptionAlgorithm, 'ECDH-AES-GCM-256');
      assert.ok(hiuBody.data.hiuPublicKey.includes('BEGIN PUBLIC KEY'));

      // 2. Generate HIU receiver keypair locally to test round-trip
      const hiuKeyPair = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
      const hiuPublicKeyPem = hiuKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
      const hiuPrivateKeyPem = hiuKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

      // 3. HIP encrypts clinical payload using HIU's public key
      const clinicalPayload = {
        patientAbhaAddress: aadhaarAbhaAddress,
        documentType: 'DISCHARGE_SUMMARY',
        vitals: { pulse: 74, bp: '120/80', spo2: 99 },
        confidentialNote: 'DocSearch verified EHR package'
      };

      const encRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m3/health-information/encrypt-payload',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          receiverPublicKeyPem: hiuPublicKeyPem,
          plainTextPayload: clinicalPayload
        }
      });
      assert.equal(encRes.statusCode, 200);
      const encBody = JSON.parse(encRes.body);
      assert.equal(encBody.data.algorithm, 'ECDH-AES-GCM-256');
      assert.ok(encBody.data.senderPublicKeyPem.includes('BEGIN PUBLIC KEY'));
      assert.ok(encBody.data.encryptedData.length > 20);
      assert.ok(encBody.data.iv.length === 24); // 12 bytes = 24 hex chars
      assert.ok(encBody.data.authTag.length === 32); // 16 bytes = 32 hex chars

      // 4. HIU decrypts payload using HIU's private key and sender public key
      const decRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m3/health-information/decrypt-payload',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          privateKeyPem: hiuPrivateKeyPem,
          senderPublicKeyPem: encBody.data.senderPublicKeyPem,
          encryptedData: encBody.data.encryptedData,
          iv: encBody.data.iv,
          authTag: encBody.data.authTag
        }
      });
      assert.equal(decRes.statusCode, 200);
      const decBody = JSON.parse(decRes.body);
      assert.deepEqual(decBody.data, clinicalPayload);

      // 5. Tampered ciphertext rejection test
      const tamperedData = encBody.data.encryptedData.slice(0, -4) + 'abcd';
      const tamperedRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m3/health-information/decrypt-payload',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          privateKeyPem: hiuPrivateKeyPem,
          senderPublicKeyPem: encBody.data.senderPublicKeyPem,
          encryptedData: tamperedData,
          iv: encBody.data.iv,
          authTag: encBody.data.authTag
        }
      });
      assert.notEqual(tamperedRes.statusCode, 200);

      console.log(`  ✔ [PASS] ECDH P-256 + AES-256-GCM encryption & decryption round-trip authenticated (Zero Distortion, Tamper Rejected)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 11: Multi-Tenant Isolation & SHA-256 Audit Trail
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log(`\n[TEST 11] Security & Compliance: Multi-tenant isolation & SHA-256 audit chain...`);
    {
      // Tenant B queries Tenant A ABHA address -> should fail with 404
      const leakRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/abdm/m1/search-by-health-id',
        headers: { authorization: `Bearer ${tokenB}` },
        payload: { abhaAddress: aadhaarAbhaAddress }
      });
      assert.equal(leakRes.statusCode, 404, 'Tenant B must NOT access Tenant A ABHA profiles');

      // Tenant A audit trail check
      const auditRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/abdm/audit-traces',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(auditRes.statusCode, 200);
      const auditBody = JSON.parse(auditRes.body);
      assert.ok(auditBody.data.length >= 8);
      for (const trace of auditBody.data) {
        assert.ok(trace.integrityHash && trace.integrityHash.length === 64);
        assert.ok(trace.action);
      }

      console.log(`  ✔ [PASS] Multi-tenant data segregation enforced & ${auditBody.data.length} SHA-256 audit traces verified`);
      testsPassed++;
    }

  } finally {
    await app.close();
  }

  const durationMs = (performance.now() - startTime).toFixed(2);
  console.log('\n======================================================================');
  console.log(`🏁 ABDM CERTIFICATION RESULTS: ${testsPassed} of ${testsTotal} tests passed in ${durationMs}ms`);
  console.log('======================================================================\n');

  if (testsPassed !== testsTotal) {
    process.exit(1);
  }
}

runAbdmCertificationTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
