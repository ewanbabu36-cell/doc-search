import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://127.0.0.1:4000';
const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

// Dynamic import of signJwt from auth package
const { signJwt } = await import('file:///C:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/auth/dist/index.js');

function createAdminToken() {
  const claims = {
    sub: '99999999-9999-4999-8999-999999999999',
    email: 'superadmin@docsearch.health',
    tenantId: '11111111-1111-4111-8111-111111111111',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    permissions: ['*'],
    isSuperAdmin: true,
    dataScope: 'global',
    iss: ISSUER,
    aud: AUDIENCE,
    jti: crypto.randomUUID()
  };
  return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('🧪 DOC SEARCH — PROFILE CREATE/DELETE RESURRECTION REGRESSION SUITE');
  console.log('============================================================\n');

  const token = createAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  let passed = 0;
  let failed = 0;

  async function testStep(name, fn) {
    try {
      process.stdout.write(`[TEST] ${name} ... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error(`       Error: ${err.message}`);
      if (err.stack) console.error(`       ${err.stack.split('\n').slice(1, 4).join('\n       ')}`);
      failed++;
    }
  }

  // TEST 1: System Readiness
  await testStep('System Health & API Gateway connectivity', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/company/partners/directory?pageSize=5`, { headers });
    assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
  });

  // TEST 2: Authoritative Partner Creation
  const testEmail = `audit.partner.${Date.now()}@docsearch.health`;
  const legalName = `Apollo Apex MultiSpecialty Hospital ${Date.now() % 10000}`;
  const tradeName = `Apollo Apex ${Date.now() % 10000}`;
  let createdPartnerId = '';
  let createdTenantId = '';

  await testStep('POST /api/v1/company/partners — Create partner profile with ACID transaction', async () => {
    const payload = {
      legalName,
      tradeName,
      partnerType: 'HOSPITAL_NETWORK',
      lifecycleStatus: 'LEAD',
      verificationStatus: 'VERIFIED',
      primaryContactName: 'Dr. Suresh Chandra',
      primaryContactEmail: testEmail,
      primaryContactPhone: '+91 98765 43210',
      primaryContactRole: 'Medical Director',
      city: 'Hyderabad',
      state: 'Telangana',
      initialFacilityName: `${tradeName} Super Facility`
    };

    const res = await fetch(`${BASE_URL}/api/v1/company/partners`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201, `Expected 201 Created, got ${res.status}`);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.id, 'Partner ID must be present');
    assert.ok(json.data.tenantId, 'Tenant ID must be present');
    assert.equal(json.data.primaryContactEmail, testEmail);

    createdPartnerId = json.data.id;
    createdTenantId = json.data.tenantId;
  });

  // TEST 3: Immediate Directory Search
  await testStep('GET /api/v1/company/partners/directory — Verify created partner appears in directory', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/company/partners/directory?search=${encodeURIComponent(tradeName)}`, {
      headers
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.length >= 1, 'Created partner must appear in directory');

    const match = json.data.find((p) => p.id === createdPartnerId || p.primaryContact?.email === testEmail);
    assert.ok(match, 'Matching partner record must be returned');
    assert.equal(match.tradeName, tradeName);
    assert.equal(match.primaryContact.email, testEmail);
  });

  // TEST 4: Profile Details Update (PATCH)
  const updatedTradeName = `${tradeName} SuperCare`;
  await testStep('PATCH /api/v1/company/partners/:id — Update partner trade name, status, and city', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/company/partners/${createdPartnerId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        tradeName: updatedTradeName,
        city: 'Bengaluru',
        state: 'Karnataka',
        lifecycleStatus: 'ACTIVE'
      })
    });

    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const json = await res.json();
    assert.equal(json.success, true);

    // Verify change in directory
    const dirRes = await fetch(`${BASE_URL}/api/v1/company/partners/directory?search=${encodeURIComponent(updatedTradeName)}`, {
      headers
    });
    const dirJson = await dirRes.json();
    const updated = dirJson.data.find((p) => p.id === createdPartnerId);
    assert.ok(updated, 'Updated partner must be found in directory');
    assert.equal(updated.tradeName, updatedTradeName);
    assert.equal(updated.city, 'Bengaluru');
    assert.equal(updated.lifecycleStatus, 'ACTIVE');
  });

  // TEST 5: Permanent Cascade Purge & Instant Absence
  await testStep('DELETE /api/v1/company/partners/:id — Permanently purge partner profile', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/company/partners/${createdPartnerId}`, {
      method: 'DELETE',
      headers
    });

    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.message.includes('permanently purged'));

    // Instant absence check
    const dirRes = await fetch(`${BASE_URL}/api/v1/company/partners/directory?search=${encodeURIComponent(updatedTradeName)}`, {
      headers
    });
    const dirJson = await dirRes.json();
    const stillPresent = dirJson.data.filter(
      (p) => p.id === createdPartnerId || p.primaryContact?.email === testEmail || p.tradeName === updatedTradeName
    );
    assert.equal(stillPresent.length, 0, 'Purged partner must immediately disappear from directory');
  });

  // TEST 6: CORE RESURRECTION STRESS TEST (Repeated background sync triggers)
  await testStep('CORE TEST: Background sync triggers must NEVER resurrect purged partner', async () => {
    // Fire multiple rapid requests to directory and directory-intelligence
    // Each of these endpoints internally triggers partnerSyncService.syncApprovedPartnersToDatabase()
    for (let i = 0; i < 5; i++) {
      await fetch(`${BASE_URL}/api/v1/company/partners/directory`, { headers });
      await fetch(`${BASE_URL}/api/v1/company/partners/directory-intelligence`, { headers });
    }

    // Now verify that the purged partner is STILL completely gone
    const dirRes = await fetch(`${BASE_URL}/api/v1/company/partners/directory?search=${encodeURIComponent(updatedTradeName)}`, {
      headers
    });
    const dirJson = await dirRes.json();
    const resurrected = dirJson.data.filter(
      (p) => p.id === createdPartnerId || p.primaryContact?.email === testEmail || p.tradeName === updatedTradeName
    );
    assert.equal(resurrected.length, 0, 'Purged partner must NEVER resurrect after multiple background sync runs');
  });

  // TEST 7: Staged Lead Cascade & Orphan Prevention
  const orphanLeadEmail = `orphan.lead.${Date.now()}@docsearch.health`;
  const orphanOrgName = `Orphan Lead Hospital ${Date.now() % 10000}`;
  let stagedLeadId = '';

  await testStep('Staged Lead Lifecycle: Registration -> Purge -> Zero Resurrection', async () => {
    // 1. Self-register staged lead
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register-partner-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: orphanLeadEmail,
        plainPassword: 'Password123!',
        tenantName: orphanOrgName,
        firstName: 'Dr. Orphan',
        lastName: 'Director',
        phone: '+91 97777 66666',
        organizationType: 'HOSPITAL'
      })
    });

    assert.equal(regRes.status, 201, `Registration should return 201, got ${regRes.status}`);
    const regJson = await regRes.json();
    assert.ok(regJson.data.id, 'Registration ID must be present');
    stagedLeadId = regJson.data.id;

    // 2. Verify it appears in directory as staged lead
    const dirRes1 = await fetch(`${BASE_URL}/api/v1/company/partners/directory?search=${encodeURIComponent(orphanOrgName)}`, {
      headers
    });
    const dirJson1 = await dirRes1.json();
    const foundLead = dirJson1.data.find((p) => p.primaryContact?.email === orphanLeadEmail || p.legalName === orphanOrgName);
    assert.ok(foundLead, 'Staged lead must appear in directory before deletion');

    // 3. Purge using staged ID
    const delRes = await fetch(`${BASE_URL}/api/v1/company/partners/${stagedLeadId}`, {
      method: 'DELETE',
      headers
    });
    assert.equal(delRes.status, 200, `Purge should return 200, got ${delRes.status}`);

    // 4. Verify immediate absence
    const dirRes2 = await fetch(`${BASE_URL}/api/v1/company/partners/directory?search=${encodeURIComponent(orphanOrgName)}`, {
      headers
    });
    const dirJson2 = await dirRes2.json();
    const stillThere = dirJson2.data.filter((p) => p.primaryContact?.email === orphanLeadEmail || p.legalName === orphanOrgName);
    assert.equal(stillThere.length, 0, 'Staged lead must immediately disappear from directory');

    // 5. Trigger sync cycles and assert zero resurrection
    for (let i = 0; i < 3; i++) {
      await fetch(`${BASE_URL}/api/v1/company/partners/directory`, { headers });
      await fetch(`${BASE_URL}/api/v1/company/partners/directory-intelligence`, { headers });
    }

    const dirRes3 = await fetch(`${BASE_URL}/api/v1/company/partners/directory?search=${encodeURIComponent(orphanOrgName)}`, {
      headers
    });
    const dirJson3 = await dirRes3.json();
    const orphanResurrected = dirJson3.data.filter((p) => p.primaryContact?.email === orphanLeadEmail || p.legalName === orphanOrgName);
    assert.equal(orphanResurrected.length, 0, 'Staged lead must NEVER resurrect as an orphan directory entry');
  });

  // TEST 8: Tombstone File Integrity on Disk
  await testStep('Disk Tombstone Registry: Verify purged partners are recorded in purged_partners.json', async () => {
    const tombstoneFile = path.resolve(__dirname, '../data/purged_partners.json');
    assert.ok(fs.existsSync(tombstoneFile), 'purged_partners.json must exist on disk');

    const raw = fs.readFileSync(tombstoneFile, 'utf-8');
    const tombstones = JSON.parse(raw);
    assert.ok(Array.isArray(tombstones), 'Tombstones must be an array');
    assert.ok(tombstones.length >= 2, 'Tombstones file must contain at least 2 entries');

    const foundTestPartner = tombstones.some((t) =>
      t.ids?.includes(createdPartnerId.toLowerCase()) ||
      t.emails?.includes(testEmail.toLowerCase()) ||
      t.names?.some((n) => n.toLowerCase().includes(tradeName.toLowerCase()))
    );
    assert.ok(foundTestPartner, 'Tombstone for created partner must be recorded on disk');

    const foundOrphanLead = tombstones.some((t) =>
      t.ids?.includes(stagedLeadId.toLowerCase()) ||
      t.emails?.includes(orphanLeadEmail.toLowerCase()) ||
      t.names?.some((n) => n.toLowerCase().includes(orphanOrgName.toLowerCase()))
    );
    assert.ok(foundOrphanLead, 'Tombstone for staged lead must be recorded on disk');
  });

  console.log('\n============================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
