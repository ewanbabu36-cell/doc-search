import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  TEST_SEEDS,
  withSecurityContext,
  partnerGovernanceOverrides,
  licenses,
  eq
} from '@docsearch/database';

describe('Company Risk Management, P&L, Unit Economics & Leakage Prevention Engine', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const PARTNER_ID_A = TEST_SEEDS.PARTNER_ID_A;
  const PARTNER_ID_B = TEST_SEEDS.PARTNER_ID_B;
  const TENANT_B = TEST_SEEDS.TENANT_B;

  function makeToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || '99999999-9999-4999-8999-999999999999',
      email: overrides.email || 'founder@docsearch.health',
      tenantId: overrides.tenantId || TENANT_A,
      branchId: overrides.branchId || TEST_SEEDS.BRANCH_A,
      roles: overrides.roles || ['SUPER_ADMIN', 'COMPANY_ADMIN', 'CHIEF_FINANCIAL_OFFICER'],
      permissions: overrides.permissions || ['*'],
      isSuperAdmin: overrides.isSuperAdmin !== undefined ? overrides.isSuperAdmin : true,
      dataScope: 'global',
      iss: ISSUER,
      aud: AUDIENCE,
      jti: crypto.randomUUID()
    };
    return signJwt(claims, {
      secret: MASTER_SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresInSeconds: 3600
    });
  }

  let cfoToken;
  let financeManagerToken;
  let doctorToken;
  let detectedAlerts = [];

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['LICENSE_HMAC_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'test';

    testDb = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: true });
    app = await buildApp();
    await app.ready();

    cfoToken = makeToken({
      email: 'cfo@docsearch.health',
      tenantId: '00000000-0000-4000-8000-000000000000',
      branchId: '00000000-0000-0000-0000-000000000000',
      roles: ['CHIEF_FINANCIAL_OFFICER'],
      isSuperAdmin: false
    });
    financeManagerToken = makeToken({
      email: 'finmgr@docsearch.health',
      tenantId: '00000000-0000-4000-8000-000000000000',
      branchId: '00000000-0000-0000-0000-000000000000',
      roles: ['FINANCE_MANAGER'],
      permissions: ['subscriptions:create', 'subscriptions:read'],
      isSuperAdmin: false
    });
    doctorToken = makeToken({
      userId: TEST_SEEDS.DOCTOR_ID,
      email: 'doctor@docsearch.health',
      roles: ['DOCTOR'],
      permissions: ['clinical:patients:read'],
      isSuperAdmin: false
    });

    // Seed real operational risk signals into PostgreSQL / pg-mem fixtures:
    // 0. Ensure at least one clinical patient exists for Partner A unbilled encounter test
    const patRes = await testDb.pool.query(
      `SELECT id FROM clinical.patients WHERE tenant_id = $1 LIMIT 1`,
      [TENANT_A]
    );
    let riskPatientId = patRes.rows[0]?.id;
    if (!riskPatientId) {
      riskPatientId = crypto.randomUUID();
      await testDb.pool.query(
        `INSERT INTO clinical.patients (id, tenant_id, partner_id, organization_id, branch_id, mrn, patient_code, first_name, last_name, gender, date_of_birth)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Risk', 'Patient', 'MALE', '1990-01-01')`,
        [
          riskPatientId,
          TENANT_A,
          PARTNER_ID_A,
          TEST_SEEDS.ORG_ID_A,
          TEST_SEEDS.FACILITY_ID_A,
          `MRN-RISK-${Date.now()}`,
          `PAT-RISK-${Date.now()}`
        ]
      );
    }

    // 1. Overdue SaaS invoice on Partner A billing account
    const accRes = await testDb.pool.query(
      `SELECT id FROM company.billing_accounts WHERE partner_id = $1 LIMIT 1`,
      [PARTNER_ID_A]
    );
    let billingAccId = accRes.rows[0]?.id;
    if (!billingAccId) {
      billingAccId = crypto.randomUUID();
      await testDb.pool.query(
        `INSERT INTO company.billing_accounts (id, partner_id, billing_contact_name, billing_email) VALUES ($1, $2, 'Finance Director', 'billing@apollo.test')`,
        [billingAccId, PARTNER_ID_A]
      );
    }

    await testDb.pool.query(
      `INSERT INTO company.invoices (id, billing_account_id, subscription_id, invoice_number, issue_date, due_date, subtotal, tax_amount, total_amount, status)
       VALUES ($1, $2, $3, $4, now() - interval '45 days', now() - interval '15 days', '50000.00', '9000.00', '59000.00', 'OVERDUE')`,
      [crypto.randomUUID(), billingAccId, TEST_SEEDS.SUBSCRIPTION_ID_A, `INV-RISK-OVERDUE-${Date.now()}`]
    );

    // 2. Completed clinical encounter with NO invoice (unbilled clinical revenue leakage)
    await testDb.pool.query(
      `INSERT INTO clinical.encounters (id, tenant_id, partner_id, organization_id, branch_id, department_id, patient_id, encounter_number, encounter_type, status, chief_complaint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPD', 'COMPLETED', 'Post-op follow-up unbilled check')`,
      [
        crypto.randomUUID(),
        TENANT_A,
        PARTNER_ID_A,
        TEST_SEEDS.ORG_ID_A,
        TEST_SEEDS.FACILITY_ID_A,
        TEST_SEEDS.DEPT_ID_A,
        riskPatientId,
        `ENC-UNBILLED-${Date.now()}`
      ]
    );

    // 3. Expired pharmacy batch carrying positive remaining stock value
    await testDb.pool.query(
      `INSERT INTO clinical.pharmacy_batches (id, tenant_id, partner_id, organization_id, branch_id, medication_id, batch_number, manufacturer, manufacturing_date, expiry_date, received_quantity, available_quantity, unit_cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'StdPharma', now() - interval '400 days', now() - interval '10 days', 100, 40, '250.00', 'EXPIRED')`,
      [
        crypto.randomUUID(),
        TENANT_A,
        PARTNER_ID_A,
        TEST_SEEDS.ORG_ID_A,
        TEST_SEEDS.FACILITY_ID_A,
        TEST_SEEDS.MEDICATION_ID,
        `EXP-RISK-${Date.now()}`
      ]
    );
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  it('TEST 01: Enforces fail-closed auth (401 unauth, 403 DOCTOR, 200 CFO/FINANCE_MANAGER)', async () => {
    const unauth = await app.inject({
      method: 'GET',
      url: '/api/v1/company/risk-management/overview'
    });
    assert.equal(unauth.statusCode, 401);

    const forbiddenDoc = await app.inject({
      method: 'GET',
      url: '/api/v1/company/risk-management/overview',
      headers: { authorization: `Bearer ${doctorToken}` }
    });
    assert.equal(forbiddenDoc.statusCode, 403);

    const allowedCfo = await app.inject({
      method: 'GET',
      url: '/api/v1/company/risk-management/overview',
      headers: { authorization: `Bearer ${cfoToken}` }
    });
    assert.equal(allowedCfo.statusCode, 200);
    const body = JSON.parse(allowedCfo.body);
    assert.equal(body.success, true);
    assert.equal(body.data.dataSource, 'live_postgresql');
    assert.ok(body.data.pnl.overdueReceivablesInr >= 59000);
  });

  it('TEST 02: POST /costs persists COGS & OPEX and updates live P&L net profit/loss & burn', async () => {
    const negRes = await app.inject({
      method: 'POST',
      url: '/api/v1/company/risk-management/costs',
      headers: { authorization: `Bearer ${cfoToken}` },
      payload: {
        category: 'AI_INFERENCE',
        amountInr: -100
      }
    });
    assert.equal(negRes.statusCode, 400);

    const cogsRes = await app.inject({
      method: 'POST',
      url: '/api/v1/company/risk-management/costs',
      headers: { authorization: `Bearer ${cfoToken}` },
      payload: {
        category: 'AI_INFERENCE',
        partnerId: PARTNER_ID_B,
        tenantId: TENANT_B,
        amountInr: 4200,
        billingPeriod: '2026-11',
        description: 'High AI Scribe & Radiology Copilot token usage on Partner B'
      }
    });
    assert.equal(cogsRes.statusCode, 201);

    const opexRes = await app.inject({
      method: 'POST',
      url: '/api/v1/company/risk-management/costs',
      headers: { authorization: `Bearer ${cfoToken}` },
      payload: {
        category: 'PAYROLL_SUPPORT',
        amountInr: 120000,
        billingPeriod: '2026-11',
        description: 'SRE & Customer Success Payroll November 2026'
      }
    });
    assert.equal(opexRes.statusCode, 201);

    const ovRes = await app.inject({
      method: 'GET',
      url: '/api/v1/company/risk-management/overview?period=2026-11',
      headers: { authorization: `Bearer ${financeManagerToken}` }
    });
    assert.equal(ovRes.statusCode, 200);
    const ov = JSON.parse(ovRes.body).data;
    assert.ok(ov.pnl.totalCogsInr >= 4200);
    assert.ok(ov.pnl.totalOpexInr >= 120000);
    assert.ok(ov.unitMarginLeaderboard.length >= 2);
    const lossPartner = ov.unitMarginLeaderboard.find((p) => p.partnerId === PARTNER_ID_B);
    assert.ok(lossPartner, 'Partner B must appear in Unit Margin Leaderboard');
    assert.ok(lossPartner.netMarginInr < 0, 'Partner B high AI COGS + shared OPEX should yield negative unit margin');
  });

  it('TEST 03: POST /scan detects real SQL leakage across overdue invoices, unbilled encounters, negative margin & expired stock', async () => {
    const scanRes = await app.inject({
      method: 'POST',
      url: '/api/v1/company/risk-management/scan',
      headers: { authorization: `Bearer ${cfoToken}` },
      payload: {}
    });
    assert.equal(scanRes.statusCode, 200);
    const scanData = JSON.parse(scanRes.body).data;
    assert.ok(scanData.candidatesDetected >= 3);
    detectedAlerts = scanData.alerts;

    const types = new Set(detectedAlerts.map((a) => a.riskType));
    assert.ok(types.has('OVERDUE_RECEIVABLE'), 'Scanner must detect overdue B2B invoice');
    assert.ok(types.has('UNBILLED_CLINICAL_ENCOUNTER'), 'Scanner must detect completed unbilled encounter');
    assert.ok(types.has('EXPIRY_WRITEOFF'), 'Scanner must detect expired pharmacy batch loss');
    assert.ok(
      types.has('NEGATIVE_MARGIN_TENANT') || types.has('FREE_TIER_COGS_BURN'),
      'Scanner must detect negative-margin tenant'
    );
  });

  it('TEST 04: POST /alerts/:id/mitigate executes real BILLING_FREEZE and REVOKE_OVERDUE_GRACE in database', async () => {
    const overdueAlert = detectedAlerts.find(
      (a) => a.riskType === 'OVERDUE_RECEIVABLE' && a.partnerId === PARTNER_ID_A
    );
    assert.ok(overdueAlert, 'Overdue alert for Partner A must exist');

    const freezeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/risk-management/alerts/${overdueAlert.id}/mitigate`,
      headers: { authorization: `Bearer ${cfoToken}` },
      payload: {
        action: 'CONTAIN_BILLING_FREEZE',
        notes: 'Test containment of overdue receivable'
      }
    });
    assert.equal(freezeRes.statusCode, 200);
    const freezeBody = JSON.parse(freezeRes.body).data;
    assert.equal(freezeBody.alert.status, 'CONTAINED');

    // Verify real PostgreSQL persistence in partner_governance_overrides
    const [gov] = await withSecurityContext(
      testDb.db,
      { userId: '00000000-0000-4000-8000-000000000001', tenantId: TENANT_A, isSuperAdmin: true, roles: ['SUPER_ADMIN'], permissions: ['*'] },
      async (tx) => tx.select().from(partnerGovernanceOverrides).where(eq(partnerGovernanceOverrides.partnerId, PARTNER_ID_A)).limit(1)
    );
    assert.equal(gov?.billingFreeze, true, 'BILLING_FREEZE must persist in company.partner_governance_overrides');

    // Verify REVOKE_OVERDUE_GRACE suspends Partner B license in DB
    const negAlert = detectedAlerts.find((a) => a.partnerId === PARTNER_ID_B);
    assert.ok(negAlert, 'Negative margin / cost burn alert for Partner B must exist');
    const revokeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/company/risk-management/alerts/${negAlert.id}/mitigate`,
      headers: { authorization: `Bearer ${cfoToken}` },
      payload: {
        action: 'REVOKE_OVERDUE_GRACE',
        notes: 'Suspend grace on bleeding account'
      }
    });
    assert.equal(revokeRes.statusCode, 200);

    const [licB] = await withSecurityContext(
      testDb.db,
      { userId: '00000000-0000-4000-8000-000000000001', tenantId: TENANT_B, isSuperAdmin: true, roles: ['SUPER_ADMIN'], permissions: ['*'] },
      async (tx) => tx.select().from(licenses).where(eq(licenses.partnerId, PARTNER_ID_B)).limit(1)
    );
    assert.equal(licB?.status, 'SUSPENDED', 'License must transition to SUSPENDED in company.licenses');
  });

  it('TEST 05: PUT /policies enforces deal-desk RISK_CIRCUIT_BREAKER against excessive discounts', async () => {
    const putRes = await app.inject({
      method: 'PUT',
      url: '/api/v1/company/risk-management/policies',
      headers: { authorization: `Bearer ${cfoToken}` },
      payload: {
        minGrossMarginPercent: 30,
        maxDiscountPercentWithoutCfo: 15,
        autoBlockBelowMarginFloor: true
      }
    });
    assert.equal(putRes.statusCode, 200);
    const updatedPol = JSON.parse(putRes.body).data;
    assert.equal(Number(updatedPol.maxDiscountPercentWithoutCfo), 15);

    const blockedDeal = await app.inject({
      method: 'POST',
      url: '/api/v1/company/subscriptions/negotiate-deal',
      headers: { authorization: `Bearer ${financeManagerToken}` },
      payload: {
        partnerId: PARTNER_ID_A,
        planId: TEST_SEEDS.PLAN_PRO_ID,
        tenureCode: 'YEARLY',
        customDiscountPercent: 25
      }
    });
    assert.equal(blockedDeal.statusCode, 403);
    assert.match(JSON.parse(blockedDeal.body).message || '', /RISK_CIRCUIT_BREAKER/);

    // CFO with explicit override succeeds
    const approvedDeal = await app.inject({
      method: 'POST',
      url: '/api/v1/company/subscriptions/negotiate-deal',
      headers: { authorization: `Bearer ${makeToken({ roles: ['SUPER_ADMIN', 'CHIEF_FINANCIAL_OFFICER'] })}` },
      payload: {
        partnerId: PARTNER_ID_A,
        planId: TEST_SEEDS.PLAN_PRO_ID,
        tenureCode: 'YEARLY',
        customDiscountPercent: 25,
        cfoOverrideApproved: true
      }
    });
    assert.equal(approvedDeal.statusCode, 200);
  });
});
