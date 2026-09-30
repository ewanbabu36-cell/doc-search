import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS, getDatabase, auditEvents, eq } from '@docsearch/database';

describe('BUG-009: PHI Export Audit Logging Verification', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  function createDoctorToken() {
    return signJwt({
      sub: TEST_SEEDS.DOCTOR_ID,
      email: 'doctor@docsearch.health',
      tenantId: TEST_SEEDS.TENANT_A,
      organizationId: TEST_SEEDS.TENANT_A,
      branchId: TEST_SEEDS.BRANCH_A,
      roles: ['DOCTOR'],
      permissions: ['clinical:patients:read', 'clinical:patients:create'],
      iss: ISSUER,
      aud: AUDIENCE
    }, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    testDb = await setupTestDatabase({ seedBaseline: true });
    app = await buildApp({ db: testDb.db });
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  it('TEST 1: Bulk PHI Export creates structured security audit event', async () => {
    const token = createDoctorToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients/export?format=json&reason=ANNUAL_ACCREDITATION_AUDIT',
      headers: {
        authorization: 'Bearer ' + token
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(typeof body.data.recordCount === 'number');

    // Verify structured audit event in core.audit_events
    const db = getDatabase();
    const rows = await db.select().from(auditEvents).where(eq(auditEvents.eventType, 'PHI_EXPORT'));

    assert.ok(rows.length > 0, 'PHI_EXPORT audit event must be recorded in database');
    const latestEvent = rows[rows.length - 1];

    assert.strictEqual(latestEvent.tenantId, TEST_SEEDS.TENANT_A, 'Tenant ID must match');
    assert.strictEqual(latestEvent.actorId, TEST_SEEDS.DOCTOR_ID, 'Actor ID must match');
    assert.strictEqual(latestEvent.eventType, 'PHI_EXPORT');
    assert.strictEqual(latestEvent.resourceType, 'PATIENT_EXPORT');
    assert.ok(latestEvent.metadata, 'Audit metadata must be present');
    assert.strictEqual(latestEvent.metadata.action, 'PHI_EXPORT');
    assert.strictEqual(latestEvent.metadata.reason, 'ANNUAL_ACCREDITATION_AUDIT');
    assert.strictEqual(latestEvent.metadata.format, 'json');
    assert.ok(Array.isArray(latestEvent.metadata.patientIds), 'Patient IDs array must be present');
  });

  it('TEST 2: CSV PHI Export returns valid CSV and logs audit event', async () => {
    const token = createDoctorToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/clinical/patients/export?format=csv&reason=REGULATORY_COMPLIANCE_DISHA',
      headers: {
        authorization: 'Bearer ' + token
      }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'text/csv');
    assert.ok(res.payload.includes('id,mrn,firstName,lastName'));

    const db = getDatabase();
    const rows = await db.select().from(auditEvents).where(eq(auditEvents.eventType, 'PHI_EXPORT'));
    const csvRow = rows.find(r => r.metadata?.format === 'csv');
    assert.ok(csvRow, 'Audit event with format csv must be recorded');
    assert.strictEqual(csvRow.metadata.reason, 'REGULATORY_COMPLIANCE_DISHA');
  });
});
