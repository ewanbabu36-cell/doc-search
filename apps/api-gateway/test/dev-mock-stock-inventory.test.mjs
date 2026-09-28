import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';

describe('Pharmacy Development Mock Stock Verification (Without Bills)', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const PHARMACIST_ID = '77777777-7777-4777-8777-777777777777';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || PHARMACIST_ID,
      email: overrides.email || 'pharmacist@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : TEST_SEEDS.BRANCH_A,
      roles: overrides.roles || ['PHARMACIST', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'pharmacy:medications:create',
        'pharmacy:medications:read',
        'pharmacy:inventory:create',
        'pharmacy:inventory:read',
        'pharmacy:dispense:create',
        'pharmacy:orders:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  before(async () => {
    testDb = await setupTestDatabase({ seedDemoFixtures: true });
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  it('TEST 1: Production Guard blocks seeding when NODE_ENV is production', async () => {
    const origEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';
    delete process.env['ALLOW_DEV_TEST_ENDPOINTS'];

    try {
      const token = createTestToken();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/pharmacy/dev/seed-mock-stock',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.statusCode !== 403) console.log('TEST 1 body:', res.statusCode, res.body);
      assert.strictEqual(res.statusCode, 403, 'Should be 403 Forbidden in production');
      const body = JSON.parse(res.body);
      assert.match(body.error?.message || body.message, /disabled in production/i);
    } finally {
      process.env['NODE_ENV'] = origEnv;
    }
  });

  it('TEST 2: Authentication & RBAC Enforcement', async () => {
    const unauthRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dev/seed-mock-stock'
    });
    assert.strictEqual(unauthRes.statusCode, 401);

    const noPermToken = createTestToken({ permissions: ['pharmacy:inventory:read'] });
    const noPermRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dev/seed-mock-stock',
      headers: { Authorization: `Bearer ${noPermToken}` }
    });
    assert.strictEqual(noPermRes.statusCode, 403);
  });

  it('TEST 3: Seed 5 realistic mock medications into inventory without Purchase Bills', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dev/seed-mock-stock',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.seededCount, 5);
    assert.strictEqual(body.data.batches.length, 5);

    const batches = body.data.batches;
    const batchMap = new Map(batches.map(b => [b.batchNumber, b]));

    assert.ok(batchMap.has('TEST-PARA-001'), 'Paracetamol batch should exist');
    assert.strictEqual(batchMap.get('TEST-PARA-001').availableQuantity, 500);
    assert.strictEqual(batchMap.get('TEST-PARA-001').supplierReference, 'DEVELOPMENT_TEST');

    assert.ok(batchMap.has('TEST-AMOX-001'), 'Amoxicillin batch should exist');
    assert.strictEqual(batchMap.get('TEST-AMOX-001').availableQuantity, 200);

    assert.ok(batchMap.has('TEST-PANTO-001'), 'Pantoprazole batch should exist');
    assert.strictEqual(batchMap.get('TEST-PANTO-001').availableQuantity, 150);

    assert.ok(batchMap.has('TEST-AZI-001'), 'Azithromycin batch should exist');
    assert.strictEqual(batchMap.get('TEST-AZI-001').availableQuantity, 100);

    assert.ok(batchMap.has('TEST-ORS-001'), 'ORS Sachet batch should exist');
    assert.strictEqual(batchMap.get('TEST-ORS-001').availableQuantity, 300);
  });

  it('TEST 4: Batches list reflects newly seeded batches', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/batches',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const batches = body.data || body;
    const testBatches = batches.filter(b => b.supplierReference === 'DEVELOPMENT_TEST');
    assert.strictEqual(testBatches.length, 5);
  });

  it('TEST 5: Inventory aggregated levels reflect batch quantities', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/inventory-snapshot',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const snapshot = body.data || body;
    assert.ok(snapshot.batches, 'Inventory snapshot should contain batches');
    const paraBatch = snapshot.batches.find(b => b.batchNumber === 'TEST-PARA-001');
    assert.ok(paraBatch, 'Paracetamol batch should exist in inventory snapshot');
    assert.strictEqual(paraBatch.availableQuantity, 500);
  });

  it('TEST 6: Tenant Isolation — Tenant B cannot see Tenant A test stock', async () => {
    const tokenB = createTestToken({ tenantId: TENANT_B, branchId: TEST_SEEDS.BRANCH_B });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/batches',
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const batches = body.data || body;
    const tenantBTestBatches = batches.filter(b => b.supplierReference === 'DEVELOPMENT_TEST');
    assert.strictEqual(tenantBTestBatches.length, 0, 'Tenant B should not see Tenant A test batches');
  });

  it('TEST 7: Idempotent Seeding — re-seeding updates batches without corruption', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/pharmacy/dev/seed-mock-stock',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.seededCount, 5);

    const batchesRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/batches',
      headers: { Authorization: `Bearer ${token}` }
    });
    const batchesBody = JSON.parse(batchesRes.body);
    const batches = batchesBody.data || batchesBody;
    const testBatches = batches.filter(b => b.supplierReference === 'DEVELOPMENT_TEST');
    assert.strictEqual(testBatches.length, 5, 'Should not create duplicate batches on re-seed');
  });

  it('TEST 8: Clean Mock Stock — removes ONLY DEVELOPMENT_TEST data and restores state', async () => {
    const token = createTestToken();
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/v1/partner/pharmacy/dev/cleanup-mock-stock',
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(deleteRes.statusCode, 200);
    const deleteBody = JSON.parse(deleteRes.body);
    assert.strictEqual(deleteBody.success, true);
    assert.strictEqual(deleteBody.data.removedBatchesCount, 5);

    const batchesRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/pharmacy/batches',
      headers: { Authorization: `Bearer ${token}` }
    });
    const batchesBody = JSON.parse(batchesRes.body);
    const batches = batchesBody.data || batchesBody;
    const remainingTestBatches = batches.filter(b => b.supplierReference === 'DEVELOPMENT_TEST');
    assert.strictEqual(remainingTestBatches.length, 0, 'All test batches should be removed');
  });
});
