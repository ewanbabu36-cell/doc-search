import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase } from '@docsearch/database';

describe('Founder Approval Governance Workflow: Strict Sign-off Enforcement', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_ID = '11111111-1111-4111-8111-111111111111';

  function createToken(role, email, isSuperAdmin = false) {
    const claims = {
      sub: crypto.randomUUID(),
      email: email,
      tenantId: TENANT_ID,
      roles: [role],
      permissions: ['*'],
      isSuperAdmin: isSuperAdmin,
      dataScope: 'global',
      iss: ISSUER,
      aud: AUDIENCE,
      jti: crypto.randomUUID()
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['JWT_ISSUER'] = ISSUER;
    process.env['JWT_AUDIENCE'] = AUDIENCE;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  let salesSubmissionId = null;

  // STEP 1: Rohit Verma (Field Sales Rep) fills and submits a form
  it('1. Rohit Verma submits a clinic onboarding form -> enters PENDING_FOUNDER_APPROVAL (Task NOT complete)', async () => {
    const salesToken = createToken('FIELD_SALES_REP', 'sales@docsearch.health', false);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/approvals/submit',
      headers: { authorization: `Bearer ${salesToken}` },
      payload: {
        entityType: 'CLINIC_LEAD',
        taskTitle: 'Quick 2-Min Clinic Onboarding: Apex Care Center (Discretionary ₹100 Discount)',
        submitterName: 'Rohit Verma',
        payloadData: {
          clinicName: 'Apex Care Center',
          contactDoctor: 'Dr. Sunita Patel',
          discountOfferedInr: 100,
          geoCoordinates: '28.5355, 77.3910'
        }
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.approvalStatus, 'PENDING_FOUNDER_APPROVAL');
    assert.equal(body.data.taskStatus, 'AWAITING_FOUNDER_APPROVAL');
    assert.equal(body.data.isImmediateCompleted, false);
    assert.ok(body.data.message.includes('PENDING FOUNDER APPROVAL'));
    salesSubmissionId = body.data.id;
  });

  // STEP 2: Rohit Verma tries to approve his own submission -> REJECTED 403 FORBIDDEN
  it('2. Rohit Verma attempts to approve submission -> BLOCKED with 403 Forbidden', async () => {
    const salesToken = createToken('FIELD_SALES_REP', 'sales@docsearch.health', false);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/company/approvals/${salesSubmissionId}/approve`,
      headers: { authorization: `Bearer ${salesToken}` },
      payload: { remarks: 'Self-approving my own lead' }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.payload);
    assert.ok(body.error.message.includes('Only Founder MERAJ SHARIF has the authority to approve'));
  });

  // STEP 3: Founder MERAJ SHARIF reviews and approves -> Task is COMPLETED
  it('3. Founder MERAJ SHARIF approves the request -> status transitions to APPROVED and task completes', async () => {
    const founderToken = createToken('SUPER_ADMIN', 'founder@docsearch.health', true);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/company/approvals/${salesSubmissionId}/approve`,
      headers: { authorization: `Bearer ${founderToken}` },
      payload: { remarks: 'Lead verified and ₹100 discount approved by Founder MERAJ SHARIF.' }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.approvalStatus, 'APPROVED_BY_FOUNDER');
    assert.equal(body.data.taskStatus, 'COMPLETED');
    assert.ok(body.message.includes('COMPLETED'));
  });

  // STEP 4: Founder directly submits a form -> Auto-completes immediately
  it('4. Founder MERAJ SHARIF submits a corporate update -> auto-approved and completed immediately', async () => {
    const founderToken = createToken('SUPER_ADMIN', 'founder@docsearch.health', true);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/company/approvals/submit',
      headers: { authorization: `Bearer ${founderToken}` },
      payload: {
        entityType: 'CORPORATE_POLICY',
        taskTitle: 'Executive Policy Sign-off: Nationwide Diagnostic Integration',
        submitterName: 'MERAJ SHARIF',
        payloadData: { policyRef: 'POL-2026-HQ-01', scope: 'GLOBAL' }
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.approvalStatus, 'APPROVED_BY_FOUNDER');
    assert.equal(body.data.taskStatus, 'COMPLETED');
    assert.equal(body.data.isImmediateCompleted, true);
  });
});
