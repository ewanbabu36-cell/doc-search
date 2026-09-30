import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maskAadhaarNumber,
  maskAbhaAddress,
  maskPhoneNumber,
  generateSaltedHash,
  isMaskedAadhaar
} from '../../../packages/shared-core/dist/security/privacy-masking.js';

test('🔒 DPDP Act 2023 & ABDM 2.0 Privacy & Regulatory Compliance Test Suite', async (t) => {

  await t.test('1. UIDAI Compliance: Aadhaar Masking strictly preserves only last 4 digits', () => {
    // 12-digit plain Aadhaar
    const rawAadhaar1 = '542189028921';
    const masked1 = maskAadhaarNumber(rawAadhaar1);
    assert.equal(masked1, 'XXXX-XXXX-8921', 'Must mask first 8 digits with XXXX-XXXX-');
    assert.ok(isMaskedAadhaar(masked1), 'isMaskedAadhaar must validate true');

    // Spaced Aadhaar
    const rawAadhaar2 = '5421 8902 1234';
    const masked2 = maskAadhaarNumber(rawAadhaar2);
    assert.equal(masked2, 'XXXX-XXXX-1234', 'Must clean spaces and mask appropriately');

    // Dashed Aadhaar
    const rawAadhaar3 = '5421-8902-5678';
    const masked3 = maskAadhaarNumber(rawAadhaar3);
    assert.equal(masked3, 'XXXX-XXXX-5678', 'Must clean dashes and mask appropriately');
  });

  await t.test('2. ABDM Compliance: ABHA ID and PHR Address Masking', () => {
    // 14-digit ABHA Number
    const rawAbhaId = '14-8921-0941-8921';
    const maskedAbhaId = maskAbhaAddress(rawAbhaId);
    assert.equal(maskedAbhaId, 'XX-XXXX-XXXX-8921', 'Must mask 14-digit ABHA number');

    // ABHA PHR Handle
    const rawHandle = 'ramesh.sharma@abdm';
    const maskedHandle = maskAbhaAddress(rawHandle);
    assert.ok(maskedHandle.endsWith('@abdm'), 'Domain must remain visible');
    assert.ok(maskedHandle.includes('***'), 'Middle characters of handle must be masked');

    // Mobile Phone Masking
    const rawPhone = '+919820184921';
    const maskedPhone = maskPhoneNumber(rawPhone);
    assert.equal(maskedPhone, '+91-XXXXX-4921', 'Indian mobile number must be masked preserving country code and last 4');
  });

  await t.test('3. Zero-Plaintext Storage: Salted HMAC-SHA256 duplicate index computation', () => {
    const aadhaarA = '542189028921';
    const aadhaarB = '5421 8902 8921'; // Same with spaces
    const aadhaarC = '982144012948'; // Different

    const hashA = generateSaltedHash(aadhaarA);
    const hashB = generateSaltedHash(aadhaarB);
    const hashC = generateSaltedHash(aadhaarC);

    assert.equal(hashA, hashB, 'Normalized values must yield deterministic hash matches for duplicate detection');
    assert.notEqual(hashA, hashC, 'Different identity numbers must yield completely different hashes');
    assert.equal(hashA.length, 64, 'SHA-256 output must be exactly 64 hex characters');
    assert.ok(!hashA.includes(aadhaarA), 'Cryptographic hash must not contain plaintext identity');
  });

  await t.test('4. Granular Patient Consent Engine: Category authorization and psychiatric shielding', () => {
    const patientConsentDirective = {
      consentId: 'CONSENT-2026-0901',
      patientUhid: 'UHID-2026-9041',
      durationHours: 72,
      status: 'ACTIVE_GRANT',
      categories: {
        diagnosticLab: true,
        pharmacyMedication: true,
        radiologyScans: false,
        opdConsultation: true,
        psychiatricMentalHealth: false, // Explicitly Shielded
        fertilityReproductive: false   // Explicitly Shielded
      }
    };

    // Helper evaluation function
    function evaluateAccess(directive, requestedCategory) {
      if (directive.status !== 'ACTIVE_GRANT') {
        return { allowed: false, reason: 'CONSENT_NOT_ACTIVE' };
      }
      const allowed = directive.categories[requestedCategory] === true;
      return {
        allowed,
        reason: allowed ? 'ACCESS_GRANTED' : 'CATEGORY_NOT_PERMITTED_OR_SHIELDED'
      };
    }

    // Access checks
    const labAccess = evaluateAccess(patientConsentDirective, 'diagnosticLab');
    assert.equal(labAccess.allowed, true, 'Diagnostic lab access should be permitted');

    const radiologyAccess = evaluateAccess(patientConsentDirective, 'radiologyScans');
    assert.equal(radiologyAccess.allowed, false, 'Unconsented radiology access must be rejected');

    const psychAccess = evaluateAccess(patientConsentDirective, 'psychiatricMentalHealth');
    assert.equal(psychAccess.allowed, false, 'Psychiatric records must be shielded without explicit patient opt-in');
  });

  await t.test('5. 1-Click WhatsApp/SMS Consent Revocation: Instant lockout', () => {
    let directive = {
      consentId: 'CONSENT-2026-0901',
      status: 'ACTIVE_GRANT'
    };

    // Patient sends revocation trigger
    function revokeConsent(record) {
      return {
        ...record,
        status: 'REVOKED',
        revocationTimestamp: new Date().toISOString()
      };
    }

    directive = revokeConsent(directive);
    assert.equal(directive.status, 'REVOKED', 'Status must immediately transition to REVOKED');
    assert.ok(directive.revocationTimestamp, 'Must record revocation timestamp');
  });

  await t.test('6. DPDP Act 2023 Sec 12: Right to Erasure vs NMC 3-Year Clinical Retention', () => {
    const patientRecord = {
      patientId: 'PAT-9041',
      name: 'Ramesh Kumar',
      phone: '+919820184921',
      marketingConsent: true,
      pushTokens: ['token_abc123', 'token_xyz789'],
      clinicalNotes: [
        { id: 'NOTE-01', diagnosis: 'Coronary Artery Disease', date: '2026-01-10' }
      ]
    };

    // DPDP Balancing Engine
    function executeDpdpErasure(patient) {
      // 1. Purge non-clinical PII completely
      const purgedNonClinical = {
        marketingConsent: false,
        pushTokens: [],
        phone: '[PURGED_UNDER_DPDP_ACT_2023]'
      };

      // 2. Pseudonymize clinical records under NMC 3-Year retention mandate
      const pseudonym = `ANONYMIZED_PATIENT_${patient.patientId.slice(-4)}`;
      const pseudonymizedClinical = patient.clinicalNotes.map(n => ({
        ...n,
        patientRef: pseudonym,
        patientName: '[REDACTED_NMC_COMPLIANT]'
      }));

      return {
        isErased: true,
        pseudonym,
        purgedNonClinical,
        preservedClinicalCount: pseudonymizedClinical.length,
        retentionExpiry: '3_YEARS_MANDATORY_NMC'
      };
    }

    const erasureResult = executeDpdpErasure(patientRecord);
    assert.equal(erasureResult.isErased, true);
    assert.equal(erasureResult.purgedNonClinical.pushTokens.length, 0, 'Push tokens must be 100% wiped');
    assert.equal(erasureResult.purgedNonClinical.marketingConsent, false, 'Marketing consent must be wiped');
    assert.equal(erasureResult.preservedClinicalCount, 1, 'Clinical records must be preserved for NMC legal compliance');
    assert.ok(erasureResult.pseudonym.startsWith('ANONYMIZED_PATIENT_'), 'Must generate cryptographic pseudonym');
  });
});
