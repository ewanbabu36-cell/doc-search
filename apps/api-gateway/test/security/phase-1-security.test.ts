import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('PHASE 1 — Security & RBAC Hardening Test Suite', () => {
  let app: any;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const BRANCH_A1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const BRANCH_A2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  function createToken(options: {
    userId?: string;
    email?: string;
    tenantId?: string;
    branchId?: string;
    roles?: string[];
    permissions?: string[];
  } = {}) {
    return signJwt(
      {
        sub: options.userId || 'usr-test-01',
        email: options.email || 'user@docsearch.health',
        tenantId: options.tenantId !== undefined ? options.tenantId : TENANT_A,
        branchId: options.branchId !== undefined ? options.branchId : BRANCH_A1,
        roles: options.roles || ['STAFF_NURSE'],
        permissions: options.permissions || ['clinical:patients:read'],
        iss: ISSUER,
        aud: AUDIENCE
      },
      { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 }
    );
  }

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'test';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  // 1. TENANT ISOLATION & MISMATCH REJECTION
  describe('Tenant Isolation Enforcement', () => {
    it('Reject mismatched client-supplied tenantId in request body with HTTP 403 TENANT_ACCESS_DENIED', async () => {
      const token = createToken({ tenantId: TENANT_A, permissions: ['clinical:patients:create'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/patients',
        headers: { Authorization: 'Bearer ' + token },
        payload: { tenantId: TENANT_B, firstName: 'Illegal', lastName: 'Intruder', gender: 'MALE' }
      });
      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'TENANT_ACCESS_DENIED');
    });

    it('Reject mismatched client-supplied tenantId in query params with HTTP 403 TENANT_ACCESS_DENIED', async () => {
      const token = createToken({ tenantId: TENANT_A, permissions: ['clinical:patients:read'] });
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/patients?tenantId=' + TENANT_B,
        headers: { Authorization: 'Bearer ' + token }
      });
      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'TENANT_ACCESS_DENIED');
    });

    it('Reject mismatched client-supplied x-tenant-id header with HTTP 403 TENANT_ACCESS_DENIED', async () => {
      const token = createToken({ tenantId: TENANT_A, permissions: ['clinical:patients:read'] });
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/patients',
        headers: { Authorization: 'Bearer ' + token, 'x-tenant-id': TENANT_B }
      });
      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'TENANT_ACCESS_DENIED');
    });
  });

  // 2. BRANCH ISOLATION & SCOPE ENFORCEMENT
  describe('Branch Isolation Enforcement', () => {
    it('Reject branch-scoped user attempting cross-branch access in body with HTTP 403 BRANCH_ACCESS_DENIED', async () => {
      const token = createToken({ tenantId: TENANT_A, branchId: BRANCH_A1, roles: ['STAFF_NURSE'], permissions: ['clinical:patients:create'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/patients',
        headers: { Authorization: 'Bearer ' + token },
        payload: { branchId: BRANCH_A2, firstName: 'Branch', lastName: 'Crosser', gender: 'FEMALE' }
      });
      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'BRANCH_ACCESS_DENIED');
    });

    it('Reject branch-scoped user attempting cross-branch access via x-branch-id header with HTTP 403 BRANCH_ACCESS_DENIED', async () => {
      const token = createToken({ tenantId: TENANT_A, branchId: BRANCH_A1, roles: ['STAFF_NURSE'], permissions: ['clinical:patients:read'] });
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/patients',
        headers: { Authorization: 'Bearer ' + token, 'x-branch-id': BRANCH_A2 }
      });
      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'BRANCH_ACCESS_DENIED');
    });

    it('Allow tenant-level admin to specify branch in body without HTTP 403', async () => {
      const token = createToken({ tenantId: TENANT_A, branchId: BRANCH_A1, roles: ['HOSPITAL_ADMIN'], permissions: ['clinical:patients:create'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/patients',
        headers: { Authorization: 'Bearer ' + token },
        payload: { branchId: BRANCH_A2, firstName: 'Valid', lastName: 'AdminCreated' }
      });
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'VALIDATION_ERROR');
    });
  });

  // 3. NEVER TRUST CLIENT IDENTITY / ROLE TAMPERING
  describe('Client Identity Protection', () => {
    it('Client-supplied role in payload is completely ignored and server permissions are enforced', async () => {
      const token = createToken({ roles: ['STAFF_NURSE'], permissions: ['clinical:patients:read'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/billing/invoices',
        headers: { Authorization: 'Bearer ' + token },
        payload: { role: 'HOSPITAL_ADMIN', roles: ['HOSPITAL_ADMIN', 'COMPANY_ADMIN'], userId: '00000000-0000-0000-0000-000000000001', patientId: 'pat-1', encounterId: 'enc-1', billingType: 'SELF_PAY' }
      });
      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'INSUFFICIENT_PERMISSIONS');
    });
  });

  // 4. PHARMACY ROUTE RBAC ENFORCEMENT
  describe('Pharmacy RBAC Permission Mapping', () => {
    it('Blocks user lacking pharmacy:dispense permission from dispensing (HTTP 403)', async () => {
      const nurseToken = createToken({ roles: ['STAFF_NURSE'], permissions: ['clinical:patients:read', 'clinical:encounters:read'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/pharmacy/dispense',
        headers: { Authorization: 'Bearer ' + nurseToken },
        payload: { patientId: 'pat-1', dispenseType: 'DIRECT_WALKIN', items: [{ medicationId: 'med-1', batchId: 'batch-1', quantity: 2 }] }
      });
      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'INSUFFICIENT_PERMISSIONS');
    });

    it('Allows pharmacist with pharmacy:dispense permission to reach request validation', async () => {
      const pharmacistToken = createToken({ roles: ['PHARMACIST'], permissions: ['pharmacy:dispense:create', 'pharmacy:dispense', 'pharmacy:inventory:read'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/pharmacy/dispense',
        headers: { Authorization: 'Bearer ' + pharmacistToken },
        payload: { patientId: 'pat-1' }
      });
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'VALIDATION_ERROR');
    });
  });

  // 5. BILLING ROUTE RBAC ENFORCEMENT
  describe('Billing RBAC Permission Mapping', () => {
    it('Blocks user lacking billing:invoices:create from creating invoice (HTTP 403)', async () => {
      const labTechToken = createToken({ roles: ['LAB_TECHNICIAN'], permissions: ['lab:orders:read', 'lab:results:create'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/billing/invoices',
        headers: { Authorization: 'Bearer ' + labTechToken },
        payload: { patientId: 'pat-1', encounterId: 'enc-1', billingType: 'SELF_PAY' }
      });
      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'INSUFFICIENT_PERMISSIONS');
    });

    it('Allows billing officer with billing:invoices:create to reach validation', async () => {
      const billingToken = createToken({ roles: ['BILLING_OFFICER'], permissions: ['billing:invoices:create', 'billing:invoices:read'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/billing/invoices',
        headers: { Authorization: 'Bearer ' + billingToken },
        payload: { patientId: 'pat-1' }
      });
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'VALIDATION_ERROR');
    });
  });

  // 6. REQUEST VALIDATION ARCHITECTURE ENFORCEMENT (HTTP 400)
  describe('Domain Request Validation Enforcement', () => {
    it('Clinical: Rejects patient registration with missing required fields with HTTP 400', async () => {
      const token = createToken({ permissions: ['clinical:patients:create'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/patients',
        headers: { Authorization: 'Bearer ' + token },
        payload: { mobileNumber: '9999999999' }
      });
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'VALIDATION_ERROR');
    });

    it('Lab: Rejects lab order creation with missing patientId with HTTP 400', async () => {
      const token = createToken({ permissions: ['lab:orders:create'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/lab/orders',
        headers: { Authorization: 'Bearer ' + token },
        payload: { testCode: 'CBC' }
      });
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'VALIDATION_ERROR');
    });

    it('Pharmacy: Rejects stock receipt with non-positive quantity with HTTP 400', async () => {
      const token = createToken({ permissions: ['pharmacy:inventory:create'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/pharmacy/batches/receive-stock',
        headers: { Authorization: 'Bearer ' + token },
        payload: { medicationId: 'med-123', batchNumber: 'BATCH-001', expiryDate: '2027-12-31', quantity: -5, unitCost: 10 }
      });
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'VALIDATION_ERROR');
    });

    it('Billing: Rejects invoice creation with invalid billingType with HTTP 400', async () => {
      const token = createToken({ permissions: ['billing:invoices:create'] });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/billing/invoices',
        headers: { Authorization: 'Bearer ' + token },
        payload: { patientId: 'pat-1', encounterId: 'enc-1', billingType: 'UNSUPPORTED_TYPE' }
      });
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'VALIDATION_ERROR');
    });
  });

  // 7. PROTECTED ROUTE BACKEND AUTHORIZATION & UNAUTHENTICATED REJECTION
  describe('Backend Authorization Coverage', () => {
    it('Blocks unauthenticated call to /api/v1/partner/patients with HTTP 401 UNAUTHORIZED', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/partner/patients' });
      assert.strictEqual(res.statusCode, 401);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
    });

    it('Blocks unauthenticated call to /api/v1/company/integration/webhooks/dispatch-test with HTTP 401 UNAUTHORIZED', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/company/integration/webhooks/dispatch-test', payload: { webhookId: 'WH-1' } });
      assert.strictEqual(res.statusCode, 401);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
    });

    it('Blocks unauthenticated call to /api/v1/compliance/documents/requirements with HTTP 401 UNAUTHORIZED', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/compliance/documents/requirements' });
      assert.strictEqual(res.statusCode, 401);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
    });

    it('Blocks unauthenticated call to /api/v1/compliance/documents/upload with HTTP 401 UNAUTHORIZED', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/compliance/documents/upload', payload: {} });
      assert.strictEqual(res.statusCode, 401);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
    });
  });
});