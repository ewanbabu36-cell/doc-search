import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptEnvelopeField,
  decryptEnvelopeField,
  isEnvelopeEncrypted,
  encryptSensitiveClinicalRecord,
  decryptSensitiveClinicalRecord,
  SENSITIVE_ENVELOPE_FIELDS
} from '../../../packages/shared-core/dist/security/envelope-encryption.js';
import {
  HOSPITAL_MASTER_WORKSTATION_WHITELIST,
  verifyMeshPacketSecurity
} from '../../../packages/shared-core/dist/security/p2p-mesh-security.js';

test('🛡️ Data Layer & Zero-Trust Infrastructure Suite', async (t) => {

  // --------------------------------------------------------------------------
  // 1. PostgreSQL Engine-Level Row-Level Security (RLS) Logic
  // --------------------------------------------------------------------------
  await t.test('1. PostgreSQL Engine-Level RLS: Session context isolation logic', () => {
    const tenantHospitalA = '11111111-1111-4111-8111-111111111111';
    const tenantHospitalB = '22222222-2222-4222-8222-222222222222';

    // Mock SQL dataset in PostgreSQL table clinical.patients
    const allDatabaseRows = [
      { id: 'pat-1', tenantId: tenantHospitalA, name: 'Aarav Mehta', condition: 'Type 2 Diabetes' },
      { id: 'pat-2', tenantId: tenantHospitalA, name: 'Sunita Roy', condition: 'Hypertension' },
      { id: 'pat-3', tenantId: tenantHospitalB, name: 'Kavita Verma', condition: 'Asthma' },
      { id: 'pat-4', tenantId: tenantHospitalB, name: 'Vikram Joshi', condition: 'CAD Post-CABG' }
    ];

    // Engine RLS Policy evaluator simulation:
    // USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
    const evaluateRlsPolicy = (row, sessionContext) => {
      if (sessionContext.isSuperAdmin) return true;
      if (!sessionContext.appCurrentTenantId) return false;
      return row.tenantId === sessionContext.appCurrentTenantId;
    };

    // Scenario A: Developer queries SELECT * FROM clinical.patients without WHERE tenant_id
    // But connection session context is set to Hospital A
    const sessionHospitalA = {
      appCurrentTenantId: tenantHospitalA,
      isSuperAdmin: false
    };

    const hospitalAVisibleRows = allDatabaseRows.filter(row => evaluateRlsPolicy(row, sessionHospitalA));

    // Zero-Leakage Assertion: Only Hospital A rows returned
    assert.equal(hospitalAVisibleRows.length, 2);
    assert.ok(hospitalAVisibleRows.every(r => r.tenantId === tenantHospitalA));
    assert.ok(!hospitalAVisibleRows.some(r => r.name === 'Kavita Verma'), 'Hospital B patient must never leak into Hospital A');

    // Scenario B: Query from Hospital B context
    const sessionHospitalB = {
      appCurrentTenantId: tenantHospitalB,
      isSuperAdmin: false
    };
    const hospitalBVisibleRows = allDatabaseRows.filter(row => evaluateRlsPolicy(row, sessionHospitalB));
    assert.equal(hospitalBVisibleRows.length, 2);
    assert.ok(hospitalBVisibleRows.every(r => r.tenantId === tenantHospitalB));
    assert.ok(!hospitalBVisibleRows.some(r => r.name === 'Aarav Mehta'), 'Hospital A patient must never leak into Hospital B');

    // Scenario C: Query with empty tenant context (non-superadmin) -> 0 rows returned
    const sessionUnauthenticated = {
      appCurrentTenantId: '',
      isSuperAdmin: false
    };
    const unauthVisibleRows = allDatabaseRows.filter(row => evaluateRlsPolicy(row, sessionUnauthenticated));
    assert.equal(unauthVisibleRows.length, 0, 'Empty tenant context must result in zero row disclosure');

    // Scenario D: Superadmin / Auditor context
    const sessionSuperAdmin = {
      appCurrentTenantId: '',
      isSuperAdmin: true
    };
    const superAdminRows = allDatabaseRows.filter(row => evaluateRlsPolicy(row, sessionSuperAdmin));
    assert.equal(superAdminRows.length, 4, 'Superadmin context has global visibility');
  });

  // --------------------------------------------------------------------------
  // 2. Field-Level Envelope Encryption (AES-256-GCM) at Rest
  // --------------------------------------------------------------------------
  await t.test('2. Field-Level AES-256-GCM Envelope Encryption for sensitive clinical & financial attributes', () => {
    const sensitiveRecord = {
      uhid: 'UHID-2026-9041',
      patientName: 'Ramesh Kumar',
      psychiatric_notes: 'Patient diagnosed with Major Depressive Disorder with suicidal ideation in 2024. Stabilized on Sertraline 50mg.',
      hiv_serology_status: 'REACTIVE_CONFIRMED_WESTERN_BLOT',
      cancer_staging: 'Stage III-B Invasive Ductal Carcinoma (HER2-positive, ER/PR negative)',
      billing_credit_card_tokens: 'tok_hdfc_visa_4242_vault_9012'
    };

    // Assert that standard list contains all 4 required fields
    assert.ok(SENSITIVE_ENVELOPE_FIELDS.includes('psychiatric_notes'));
    assert.ok(SENSITIVE_ENVELOPE_FIELDS.includes('hiv_serology_status'));
    assert.ok(SENSITIVE_ENVELOPE_FIELDS.includes('cancer_staging'));
    assert.ok(SENSITIVE_ENVELOPE_FIELDS.includes('billing_credit_card_tokens'));

    // Step A: Encrypt the record
    const encryptedRecord = encryptSensitiveClinicalRecord(sensitiveRecord);

    // Assert that non-sensitive fields are untouched
    assert.equal(encryptedRecord.uhid, 'UHID-2026-9041');
    assert.equal(encryptedRecord.patientName, 'Ramesh Kumar');

    // Assert that all 4 sensitive fields are encrypted with the envelope token format
    for (const field of SENSITIVE_ENVELOPE_FIELDS) {
      const val = encryptedRecord[field];
      assert.ok(isEnvelopeEncrypted(val), `${field} must be envelope encrypted`);
      assert.ok(val.startsWith('enc:v1:aes-256-gcm:'), `${field} must start with standard envelope header`);
      assert.ok(!val.includes(sensitiveRecord[field]), `${field} plaintext must not appear in encrypted token`);
    }

    // Step B: Decrypt the record
    const decryptedRecord = decryptSensitiveClinicalRecord(encryptedRecord);

    // Assert that all fields are faithfully recovered
    assert.equal(decryptedRecord.psychiatric_notes, sensitiveRecord.psychiatric_notes);
    assert.equal(decryptedRecord.hiv_serology_status, sensitiveRecord.hiv_serology_status);
    assert.equal(decryptedRecord.cancer_staging, sensitiveRecord.cancer_staging);
    assert.equal(decryptedRecord.billing_credit_card_tokens, sensitiveRecord.billing_credit_card_tokens);

    // Step C: Tamper detection test (GCM authentication tag verification)
    const originalToken = encryptedRecord.psychiatric_notes;
    // Corrupt the ciphertext by flipping the last character
    const tamperedToken = originalToken.slice(0, -1) + (originalToken.endsWith('a') ? 'b' : 'a');

    assert.throws(() => {
      decryptEnvelopeField(tamperedToken);
    }, /Unsupported state or unable to authenticate data|Invalid envelope encryption token structure/, 'Tampered ciphertext must be rejected by GCM tag verification');
  });

  // --------------------------------------------------------------------------
  // 3. P2P Mesh Network Rogue Node Rejection (Workstation Key Pinning)
  // --------------------------------------------------------------------------
  await t.test('3. P2P Mesh Network Workstation Key Pinning & Rogue Node Rejection', () => {
    // Verify master whitelist length
    assert.equal(HOSPITAL_MASTER_WORKSTATION_WHITELIST.length, 5);

    // Test 1: Authentic Doctor Desk OPD-03 broadcast packet
    const authenticPacket = {
      originNodeId: 'NODE-DOC-03',
      originIp: '192.168.1.102',
      originMac: '00:1A:2B:3C:4D:6F',
      ed25519PublicKey: 'ed25519:doc03:7f14b901a5c48831e78c091',
      txHash: '0x7f1190bc41a982df034',
      actionType: 'EMERGENCY_PRESCRIPTION',
      payload: 'Inj Tranexamic Acid 1g IV Stat',
      signature: 'sig_ed25519_84fa91bc334455667788',
      timestamp: new Date().toISOString()
    };

    const validResult = verifyMeshPacketSecurity(authenticPacket);
    assert.equal(validResult.accepted, true, 'Pre-enrolled workstation packet must be accepted');
    assert.equal(validResult.code, 'VERIFIED_PEER');
    assert.equal(validResult.enrolledTerminal?.terminalId, 'NODE-DOC-03');

    // Test 2: Rogue Hacker Node attempting unauthorized Wi-Fi injection
    const roguePacket = {
      originNodeId: 'ROGUE-HACKER-X',
      originIp: '192.168.1.244',
      ed25519PublicKey: 'ed25519:untrusted:deadbeef778899',
      txHash: '0xdeadbeef8899',
      actionType: 'EMERGENCY_PRESCRIPTION',
      payload: 'Forged Prescription: Tab Morphine 100mg IV Stat',
      signature: 'sig_ed25519_forged_hash',
      timestamp: new Date().toISOString()
    };

    const rogueResult = verifyMeshPacketSecurity(roguePacket);
    assert.equal(rogueResult.accepted, false, 'Unwhitelisted rogue node must be rejected');
    assert.equal(rogueResult.code, 'ROGUE_KEY_UNKNOWN');
    assert.equal(rogueResult.auditFlag, 'CRITICAL_SECURITY_ALERT');
    assert.ok(rogueResult.reason?.includes('not enrolled in hospital master whitelist'));

    // Test 3: Spoofed Node ID with wrong/unauthorized Public Key
    const spoofedPacket = {
      originNodeId: 'NODE-REC-01', // Claiming to be Reception Desk
      originIp: '192.168.1.199',
      ed25519PublicKey: 'ed25519:fake:c0ffee1234567890', // But presenting a fake key
      txHash: '0x9988776655',
      actionType: 'OFFLINE_UHID_REGISTRATION',
      payload: 'Fake UHID injection',
      signature: 'sig_ed25519_fake_sig',
      timestamp: new Date().toISOString()
    };

    const spoofResult = verifyMeshPacketSecurity(spoofedPacket);
    assert.equal(spoofResult.accepted, false, 'Key Pinning mismatch must reject spoofed packet');
    assert.equal(spoofResult.code, 'ROGUE_KEY_UNKNOWN');
    assert.ok(spoofResult.reason?.includes('Key Pinning Mismatch'));

    // Test 4: Missing or invalid signature
    const unsignedPacket = {
      ...authenticPacket,
      signature: 'invalid_raw_signature_format'
    };
    const unsignedResult = verifyMeshPacketSecurity(unsignedPacket);
    assert.equal(unsignedResult.accepted, false);
    assert.equal(unsignedResult.code, 'FORGED_SIGNATURE');
  });

});
