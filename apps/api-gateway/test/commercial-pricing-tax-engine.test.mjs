import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { setupTestDatabase, getDatabase, plans, priceVersions, eq } from '@docsearch/database';

describe('Authoritative Commercial Pricing, Tenure Discounts & Backward GST Engine Suite', () => {
  let app;
  let testDb;

  before(async () => {
    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  it('1. GET /api/v1/commercial/plans exposes all 4 authoritative partner plans with GST-inclusive pricing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/plans'
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));

    const pathPlan = json.data.find((p) => p.code === 'PLAN_PATHOLOGY_ANNUAL');
    const pharmPlan = json.data.find((p) => p.code === 'PLAN_PHARMACY_ANNUAL');
    const clinicPlan = json.data.find((p) => p.code === 'PLAN_SOLO_CLINIC_ANNUAL');
    const hospPlan = json.data.find((p) => p.code === 'PLAN_HOSPITAL_ANNUAL');

    assert.ok(pathPlan, 'Pathology plan must exist');
    assert.equal(pathPlan.annualBasePriceInr, 6000, 'Pathology annual price must be ₹6,000');
    assert.equal(pathPlan.gstInclusive, true);
    assert.equal(pathPlan.sacCode, '998313');

    assert.ok(pharmPlan, 'Pharmacy plan must exist');
    assert.equal(pharmPlan.annualBasePriceInr, 6000, 'Pharmacy annual price must be ₹6,000');

    assert.ok(clinicPlan, 'Solo clinic plan must exist');
    assert.equal(clinicPlan.annualBasePriceInr, 6000, 'Solo clinic annual price must be ₹6,000');

    assert.ok(hospPlan, 'Hospital plan must exist');
    assert.equal(hospPlan.annualBasePriceInr, 20000, 'Hospital annual price must be ₹20,000');
    assert.equal(hospPlan.sacCode, '998313');
  });

  it('2. Enforces 0% discount on 1-Year tenure with intra-state backward GST (₹20,000 Hospital)', async () => {
    const db = getDatabase();
    const [hospPlan] = await db.select().from(plans).where(eq(plans.code, 'PLAN_HOSPITAL_ANNUAL')).limit(1);
    assert.ok(hospPlan);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      payload: {
        planId: hospPlan.id,
        durationYears: 1,
        isInterstate: false
      }
    });

    assert.equal(res.statusCode, 200);
    const { data } = JSON.parse(res.body);

    assert.equal(data.durationYears, 1);
    assert.equal(data.annualBasePriceInr, 20000);
    assert.equal(data.grossAmountInr, 20000);
    assert.equal(data.discountRatePercent, 0, '1-Year discount must be 0%');
    assert.equal(data.discountAmountInr, 0);
    assert.equal(data.finalAmountInr, 20000);

    // Backward GST: 20000 / 1.18 = 16949.15
    assert.equal(data.taxableAmountInr, 16949.15);
    // GST total: 3050.85 -> CGST 1525.43, SGST 1525.42
    assert.equal(data.cgstAmountInr, 1525.43);
    assert.equal(data.sgstAmountInr, 1525.42);
    assert.equal(data.igstAmountInr, 0);
    assert.equal(
      Math.round((data.taxableAmountInr + data.cgstAmountInr + data.sgstAmountInr) * 100) / 100,
      data.finalAmountInr,
      'Taxable + CGST + SGST must exactly equal final payable amount'
    );
  });

  it('3. Enforces 2% discount on 2-Year tenure with inter-state backward GST (₹20,000 Hospital)', async () => {
    const db = getDatabase();
    const [hospPlan] = await db.select().from(plans).where(eq(plans.code, 'PLAN_HOSPITAL_ANNUAL')).limit(1);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      payload: {
        planId: hospPlan.id,
        durationYears: 2,
        isInterstate: true
      }
    });

    assert.equal(res.statusCode, 200);
    const { data } = JSON.parse(res.body);

    assert.equal(data.durationYears, 2);
    assert.equal(data.grossAmountInr, 40000);
    assert.equal(data.discountRatePercent, 2, '2-Year discount must be 2%');
    assert.equal(data.discountAmountInr, 800, '2% of 40,000 is 800');
    assert.equal(data.finalAmountInr, 39200);

    // Backward GST on 39,200: 39200 / 1.18 = 33220.34
    assert.equal(data.taxableAmountInr, 33220.34);
    assert.equal(data.cgstAmountInr, 0);
    assert.equal(data.sgstAmountInr, 0);
    assert.equal(data.igstAmountInr, 5979.66);
    assert.equal(
      Math.round((data.taxableAmountInr + data.igstAmountInr) * 100) / 100,
      data.finalAmountInr,
      'Taxable + IGST must exactly equal final payable amount'
    );
  });

  it('4. Enforces 10% discount on 3-Year tenure (₹6,000 Clinic Plan)', async () => {
    const db = getDatabase();
    const [clinicPlan] = await db.select().from(plans).where(eq(plans.code, 'PLAN_SOLO_CLINIC_ANNUAL')).limit(1);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      payload: {
        planId: clinicPlan.id,
        durationYears: 3,
        isInterstate: false
      }
    });

    assert.equal(res.statusCode, 200);
    const { data } = JSON.parse(res.body);

    assert.equal(data.durationYears, 3);
    assert.equal(data.annualBasePriceInr, 6000);
    assert.equal(data.grossAmountInr, 18000);
    assert.equal(data.discountRatePercent, 10, '3-Year discount must be 10%');
    assert.equal(data.discountAmountInr, 1800, '10% of 18,000 is 1,800');
    assert.equal(data.finalAmountInr, 16200);

    // 16200 / 1.18 = 13728.81
    assert.equal(data.taxableAmountInr, 13728.81);
    assert.equal(data.cgstAmountInr, 1235.6);
    assert.equal(data.sgstAmountInr, 1235.59);
    assert.equal(
      Math.round((data.taxableAmountInr + data.cgstAmountInr + data.sgstAmountInr) * 100) / 100,
      data.finalAmountInr
    );
  });

  it('5. Enforces 20% discount on 5-Year tenure (₹6,000 Pathology Plan)', async () => {
    const db = getDatabase();
    const [pathPlan] = await db.select().from(plans).where(eq(plans.code, 'PLAN_PATHOLOGY_ANNUAL')).limit(1);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      payload: {
        planId: pathPlan.id,
        durationYears: 5,
        isInterstate: false
      }
    });

    assert.equal(res.statusCode, 200);
    const { data } = JSON.parse(res.body);

    assert.equal(data.durationYears, 5);
    assert.equal(data.grossAmountInr, 30000);
    assert.equal(data.discountRatePercent, 20, '5-Year discount must be 20%');
    assert.equal(data.discountAmountInr, 6000, '20% of 30,000 is 6,000');
    assert.equal(data.finalAmountInr, 24000);

    // 24000 / 1.18 = 20338.98
    assert.equal(data.taxableAmountInr, 20338.98);
    assert.equal(data.cgstAmountInr, 1830.51);
    assert.equal(data.sgstAmountInr, 1830.51);
    assert.equal(
      Math.round((data.taxableAmountInr + data.cgstAmountInr + data.sgstAmountInr) * 100) / 100,
      data.finalAmountInr
    );
  });

  it('6. Rejects invalid tenure durations (e.g. 0, 4, or 6 years)', async () => {
    const db = getDatabase();
    const [hospPlan] = await db.select().from(plans).where(eq(plans.code, 'PLAN_HOSPITAL_ANNUAL')).limit(1);

    const resOver = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      payload: {
        planId: hospPlan.id,
        durationYears: 6
      }
    });
    assert.equal(resOver.statusCode, 400);

    const resFour = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      payload: {
        planId: hospPlan.id,
        durationYears: 4
      }
    });
    assert.equal(resFour.statusCode, 400);

    const resZero = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/calculate-order',
      payload: {
        planId: hospPlan.id,
        durationYears: 0
      }
    });
    assert.equal(resZero.statusCode, 400);
  });
});
