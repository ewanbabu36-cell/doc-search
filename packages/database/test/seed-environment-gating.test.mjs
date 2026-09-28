import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupTestDatabase,
  seedUniversalDatabase,
  seedWorkflowDatabase,
  UNIVERSAL_SEED_IDS,
  products,
  plans,
  legalEntities,
  workflowDefinitions,
  workflowVersions,
  tenants,
  inpatientBeds,
  eq
} from '../dist/index.js';

describe('Database Seed Script & Environment Gating Suite', () => {
  it('Production Mode (NODE_ENV=production): seeds authoritative system masters and skips demo fixtures', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalDemo = process.env.SEED_DEMO_FIXTURES;
    const originalForce = process.env.FORCE_DEMO_SEEDS;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.SEED_DEMO_FIXTURES;
      delete process.env.FORCE_DEMO_SEEDS;

      const harness = await setupTestDatabase({ seedBaseline: false });
      const db = harness.db;

      // Run universal seed under production gating
      await seedUniversalDatabase(db);

      // Verify System Masters are present
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.id, UNIVERSAL_SEED_IDS.PRODUCT_CORE_ID));
      assert.ok(prod, 'Master product PROD_HEALTHCARE_SUITE must be seeded in production');
      assert.equal(prod.code, 'PROD_HEALTHCARE_SUITE');

      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, UNIVERSAL_SEED_IDS.PLAN_ENTERPRISE_ID));
      assert.ok(plan, 'Master plan PLAN_ENTERPRISE_NETWORK must be seeded in production');

      const [hq] = await db
        .select()
        .from(legalEntities)
        .where(eq(legalEntities.id, UNIVERSAL_SEED_IDS.LEGAL_ENTITY_ID));
      assert.ok(hq, 'Doc Search company HQ legal entity must be seeded in production');

      const wfList = await db.select().from(workflowDefinitions);
      assert.ok(wfList.length >= 3, 'Master workflows (Hospital, Pathology, Pharmacy) must be seeded in production');

      // Verify Demo Fixtures are NOT seeded
      const demoBeds = await db.select().from(inpatientBeds);
      assert.equal(demoBeds.length, 0, 'Fake inpatient beds must NOT be seeded in production mode');
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalDemo !== undefined) process.env.SEED_DEMO_FIXTURES = originalDemo;
      if (originalForce !== undefined) process.env.FORCE_DEMO_SEEDS = originalForce;
    }
  });

  it('Demo / Test Mode: seeds both system masters and demo fixtures', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalDemo = process.env.SEED_DEMO_FIXTURES;
    try {
      process.env.NODE_ENV = 'test';
      process.env.SEED_DEMO_FIXTURES = 'true';

      const harness = await setupTestDatabase({ seedBaseline: false });
      const db = harness.db;

      await seedUniversalDatabase(db);

      // Verify demo fixtures ARE seeded
      const [demoTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, UNIVERSAL_SEED_IDS.TENANT_ID));
      assert.ok(demoTenant, 'Demo tenant must be seeded in test/dev mode');
      assert.equal(demoTenant.name, 'Doc Search Healthcare Platform');

      const demoBeds = await db.select().from(inpatientBeds);
      assert.ok(demoBeds.length >= 4, 'Demo inpatient beds must be seeded in test/dev mode');
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalDemo !== undefined) process.env.SEED_DEMO_FIXTURES = originalDemo;
      else delete process.env.SEED_DEMO_FIXTURES;
    }
  });

  it('Workflow Seed Idempotency: re-running seedWorkflowDatabase preserves versions and causes no duplicate errors', async () => {
    const harness = await setupTestDatabase({ seedBaseline: false });
    const db = harness.db;

    // First run
    await seedWorkflowDatabase(db);
    const count1 = (await db.select().from(workflowVersions)).length;
    assert.ok(count1 >= 3, 'Initial workflow versions must be created');

    // Second run (idempotent replay)
    await seedWorkflowDatabase(db);
    const count2 = (await db.select().from(workflowVersions)).length;
    assert.equal(count2, count1, 'Re-running seedWorkflowDatabase must be 100% idempotent without duplicate versions');
  });
});
