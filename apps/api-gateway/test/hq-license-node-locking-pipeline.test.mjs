import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  partnerProfiles,
  subscriptions,
  licenses,
  eq
} from '@docsearch/database';
import { machineFingerprintService } from '../dist/services/security/MachineFingerprintService.js';
import { licenseService } from '../dist/services/company/LicenseService.js';

describe('HQ Central Control: Enterprise Node-Locking, Multi-Seat, Renewal & Remote Kill-Switch 5-Stage Pipeline', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const SUPER_ADMIN_ID = '99999999-9999-4999-8999-999999999999';
  const COMPANY_TENANT_ID = TEST_SEEDS.TENANT_A;
  const PARTNER_TENANT_ID = TEST_SEEDS.TENANT_B;
  const PARTNER_ID = TEST_SEEDS.PARTNER_ID_B;

  function createCompanyAdminToken() {
    const claims = {
      sub: SUPER_ADMIN_ID,
      email: 'admin@docsearch.health',
      tenantId: COMPANY_TENANT_ID,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
      permissions: [
        'partners:read',
        'partners:create',
        'partners:update',
        'subscriptions:read',
        'subscriptions:create',
        'subscriptions:update'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createPartnerToken() {
    const claims = {
      sub: crypto.randomUUID(),
      email: 'hospital.admin@partner.health',
      tenantId: PARTNER_TENANT_ID,
      partnerId: PARTNER_ID,
      roles: ['HOSPITAL_ADMIN'],
      permissions: ['clinical:patients:read'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['LICENSE_HMAC_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  let currentMachineFingerprint;
  let testLicenseId;
  let testLicenseKey;
  let exportedEnvelope;

  // =========================================================================
  // STAGE 1: Machine Fingerprint Discovery & Hardware Profile Extraction
  // =========================================================================
  it('STAGE 1: GET /api/v1/license/machine-fingerprint returns deterministic hardware node telemetry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/license/machine-fingerprint'
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.fingerprint, 'Fingerprint must be returned');
    assert.match(body.data.fingerprint, /^MPR-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/, 'Fingerprint matches format');
    assert.ok(body.data.platform, 'Platform present');
    assert.ok(body.data.arch, 'Arch present');
    assert.ok(body.data.hostname, 'Hostname present');
    assert.ok(body.data.primaryMac, 'Primary MAC present');

    currentMachineFingerprint = body.data.fingerprint;
  });

  // =========================================================================
  // STAGE 2: HQ Seat Allocation & Subscription Provisioning
  // =========================================================================
  it('STAGE 2: POST /api/v1/company/license/generate creates signed token with multi-seat quota', async () => {
    const adminToken = createCompanyAdminToken();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/license/generate',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        partnerId: PARTNER_ID,
        tenantId: PARTNER_TENANT_ID,
        tenantName: 'Apollo City Hospital Whitefield',
        machineFingerprint: currentMachineFingerprint,
        planTier: 'Hospital Enterprise Edition',
        maxSeats: 5,
        validityDays: 365,
        maxDoctors: 25,
        maxBranches: 3
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.licenseKey.startsWith('LIC-2026-'));
    assert.ok(body.data.licenseToken.startsWith('DSLIC.'));
    assert.strictEqual(body.data.machineFingerprint, currentMachineFingerprint);
    assert.strictEqual(body.data.planTier, 'Hospital Enterprise Edition');
    assert.strictEqual(body.data.maxDoctors, 25);

    testLicenseKey = body.data.licenseKey;

    // Create a real DB license row for full lifecycle testing
    const createdLic = await licenseService.issueLicense({
      partnerId: PARTNER_ID,
      tenantId: PARTNER_TENANT_ID,
      subscriptionId: crypto.randomUUID(),
      planId: crypto.randomUUID(),
      licenseType: 'COMMERCIAL',
      maxDoctors: 25,
      maxBranches: 3,
      maxConcurrentUsers: 50,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      gracePeriodEnd: new Date(Date.now() + 380 * 24 * 60 * 60 * 1000),
      metadata: {
        tenantName: 'Apollo City Hospital Whitefield',
        planTier: 'Hospital Enterprise Edition',
        maxSeats: 5,
        machineFingerprint: currentMachineFingerprint,
        boundNodes: [
          {
            nodeId: 'node-primary',
            deviceName: 'OPD Reception Desk 1',
            machineFingerprint: currentMachineFingerprint,
            boundAt: new Date().toISOString(),
            lastHeartbeatAt: new Date().toISOString(),
            status: 'ACTIVE'
          }
        ]
      }
    });

    testLicenseId = createdLic.id;

    // Bind additional device seat via API
    const bindRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${testLicenseId}/nodes/bind`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: {
        deviceName: 'Doctor 1 Consultation Terminal',
        machineFingerprint: 'MPR-ABCD-1234-5678',
        hostname: 'DOC-DESK-01'
      }
    });

    assert.strictEqual(bindRes.statusCode, 200);
    const bindBody = JSON.parse(bindRes.body);
    assert.strictEqual(bindBody.success, true);
    assert.ok(bindBody.data.metadata.boundNodes.length >= 2, 'Two seats bound');
  });

  // =========================================================================
  // STAGE 3: Cryptographic Node-Locking & Air-Gapped Handshake (.lic export & import)
  // =========================================================================
  it('STAGE 3: GET /export-file and POST /import-file verifies air-gapped cryptographic envelope', async () => {
    const adminToken = createCompanyAdminToken();

    // 1. Export .lic file
    const exportRes = await app.inject({
      method: 'GET',
      url: `/api/v1/company/licenses/${testLicenseId}/export-file`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(exportRes.statusCode, 200);
    assert.ok(exportRes.headers['content-disposition'].includes('.lic'));
    exportedEnvelope = JSON.parse(exportRes.body);
    assert.strictEqual(exportedEnvelope.format, 'DOCSEARCH_AIRGAP_ENVELOPE_V1');
    assert.strictEqual(exportedEnvelope.tenantId, PARTNER_TENANT_ID);
    assert.ok(exportedEnvelope.signature, 'Cryptographic signature present');

    // 2. Import .lic file on partner terminal
    const importRes = await app.inject({
      method: 'POST',
      url: '/api/v1/license/import-file',
      headers: { 'Content-Type': 'application/json' },
      payload: { envelope: exportedEnvelope }
    });

    assert.strictEqual(importRes.statusCode, 200);
    const importBody = JSON.parse(importRes.body);
    assert.strictEqual(importBody.success, true);
    assert.strictEqual(importBody.data.currentDeviceBound, currentMachineFingerprint);
    assert.strictEqual(importBody.data.maxSeats, 5);

    // 3. Tamper Detection: Altering envelope content invalidates HMAC signature
    const tamperedEnvelope = {
      ...exportedEnvelope,
      maxDoctors: 99999 // Malicious modification
    };

    const tamperedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/license/import-file',
      headers: { 'Content-Type': 'application/json' },
      payload: { envelope: tamperedEnvelope }
    });

    assert.strictEqual(tamperedRes.statusCode, 400);
    assert.ok(tamperedRes.body.includes('signature mismatch') || tamperedRes.body.includes('tampered'));
  });

  // =========================================================================
  // STAGE 4: Real-Time Heartbeat, Grace Countdown & Clock Drift Defense
  // =========================================================================
  it('STAGE 4: POST /api/v1/license/heartbeat verifies active node health and blocks clock rollback', async () => {
    // 1. Normal valid heartbeat
    const beatRes = await app.inject({
      method: 'POST',
      url: '/api/v1/license/heartbeat',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        tenantId: PARTNER_TENANT_ID,
        machineFingerprint: currentMachineFingerprint,
        clientTimestamp: Date.now()
      }
    });

    assert.strictEqual(beatRes.statusCode, 200);
    const beatBody = JSON.parse(beatRes.body);
    assert.strictEqual(beatBody.success, true);
    assert.strictEqual(beatBody.data.isAccessAllowed, true);
    assert.strictEqual(beatBody.data.status, 'ACTIVE');
    assert.ok(beatBody.data.daysRemaining > 300);
    assert.strictEqual(beatBody.data.nodeStatus, 'ACTIVE');

    // Verify lastHeartbeatAt recorded in PostgreSQL
    const [dbLic] = await testDb.db.select().from(licenses).where(eq(licenses.id, testLicenseId));
    assert.ok(dbLic.metadata.boundNodes.some((n) => n.machineFingerprint === currentMachineFingerprint));

    // 2. Anti-Clock Tampering Defense: Client attempts rewind by 3 hours
    const rollbackRes = await app.inject({
      method: 'POST',
      url: '/api/v1/license/heartbeat',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        tenantId: PARTNER_TENANT_ID,
        machineFingerprint: currentMachineFingerprint,
        clientTimestamp: Date.now() - 3 * 60 * 60 * 1000 // 3 hours in past
      }
    });

    assert.strictEqual(rollbackRes.statusCode, 403);
    const rollbackBody = JSON.parse(rollbackRes.body);
    assert.strictEqual(rollbackBody.success, false);
    assert.strictEqual(rollbackBody.data.status, 'SUSPENDED');
    assert.ok(rollbackBody.data.message.includes('System clock rewind detected') || rollbackBody.data.message.includes('clock'));
  });

  // =========================================================================
  // STAGE 5: Instant Remote Kill-Switch, Revocation & 1-Click Renewal
  // =========================================================================
  it('STAGE 5: POST /revoke locks partner instantly, /renew extends validity, /reactivate restores access', async () => {
    const adminToken = createCompanyAdminToken();

    // 1. Remote Kill-Switch Execution
    const revokeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${testLicenseId}/revoke`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: { reason: 'Suspected security breach on partner workstation' }
    });

    assert.strictEqual(revokeRes.statusCode, 200);

    // 2. Heartbeat immediately blocked with 403 FORBIDDEN
    const blockedBeatRes = await app.inject({
      method: 'POST',
      url: '/api/v1/license/heartbeat',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        tenantId: PARTNER_TENANT_ID,
        machineFingerprint: currentMachineFingerprint,
        clientTimestamp: Date.now()
      }
    });

    assert.strictEqual(blockedBeatRes.statusCode, 403);
    const blockedBody = JSON.parse(blockedBeatRes.body);
    assert.strictEqual(blockedBody.success, false);
    assert.strictEqual(blockedBody.data.status, 'REVOKED');
    assert.strictEqual(blockedBody.data.isAccessAllowed, false);
    assert.ok(blockedBody.data.message.includes('REVOKED'));

    // 3. 1-Click Validity Extension (+365 Days)
    const [preRenewLic] = await testDb.db.select().from(licenses).where(eq(licenses.id, testLicenseId));
    const preExpiry = new Date(preRenewLic.expiryDate).getTime();

    const renewRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${testLicenseId}/renew`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: { extensionDays: 365 }
    });

    assert.strictEqual(renewRes.statusCode, 200);
    const renewBody = JSON.parse(renewRes.body);
    assert.strictEqual(renewBody.success, true);
    const postExpiry = new Date(renewBody.data.expiryDate).getTime();
    assert.ok(postExpiry > preExpiry, 'Expiry date extended');

    // 4. 1-Click Reactivate
    const reactivateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${testLicenseId}/reactivate`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(reactivateRes.statusCode, 200);

    // 5. Subsequent Heartbeat now returns 200 OK & Access Restored
    const restoredBeatRes = await app.inject({
      method: 'POST',
      url: '/api/v1/license/heartbeat',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        tenantId: PARTNER_TENANT_ID,
        machineFingerprint: currentMachineFingerprint,
        clientTimestamp: Date.now()
      }
    });

    assert.strictEqual(restoredBeatRes.statusCode, 200);
    const restoredBody = JSON.parse(restoredBeatRes.body);
    assert.strictEqual(restoredBody.success, true);
    assert.strictEqual(restoredBody.data.isAccessAllowed, true);
    assert.strictEqual(restoredBody.data.status, 'ACTIVE');
  });

  // Individual Device Seat Revocation
  it('STAGE 5 (Sub-Node): POST /nodes/:nodeId/revoke specifically revokes single workstation seat without killing facility', async () => {
    const adminToken = createCompanyAdminToken();

    // Revoke specifically the secondary seat
    const revokeNodeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/licenses/${testLicenseId}/nodes/MPR-ABCD-1234-5678/revoke`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      payload: { reason: 'Secondary workstation decommissioned' }
    });

    assert.strictEqual(revokeNodeRes.statusCode, 200);

    // Heartbeat from revoked secondary seat is blocked
    const secondaryBeatRes = await app.inject({
      method: 'POST',
      url: '/api/v1/license/heartbeat',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        tenantId: PARTNER_TENANT_ID,
        machineFingerprint: 'MPR-ABCD-1234-5678',
        clientTimestamp: Date.now()
      }
    });

    assert.strictEqual(secondaryBeatRes.statusCode, 403);
    const secondaryBody = JSON.parse(secondaryBeatRes.body);
    assert.strictEqual(secondaryBody.data.status, 'REVOKED');
    assert.ok(secondaryBody.data.message.includes('specifically revoked'));

    // Meanwhile, primary seat still has access
    const primaryBeatRes = await app.inject({
      method: 'POST',
      url: '/api/v1/license/heartbeat',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        tenantId: PARTNER_TENANT_ID,
        machineFingerprint: currentMachineFingerprint,
        clientTimestamp: Date.now()
      }
    });

    assert.strictEqual(primaryBeatRes.statusCode, 200);
    assert.strictEqual(JSON.parse(primaryBeatRes.body).data.isAccessAllowed, true);
  });
});
