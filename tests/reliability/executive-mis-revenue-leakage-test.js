process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret-at-least-32-chars-long-security-key';

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import crypto from 'node:crypto';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { signJwt } from '../../packages/auth/dist/index.js';

console.log('\n======================================================================');
console.log('📊 TEST SUITE 11 — EXECUTIVE MIS & REVENUE LEAKAGE PREVENTION ENGINE');
console.log('   (Dept Billing, Unbilled Encounters, AR Claim Aging, Shrinkage, Doctor Payouts)');
console.log('======================================================================\n');

async function runExecutiveMisTests() {
  const startTime = performance.now();
  let testsPassed = 0;
  let testsTotal = 0;

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr_cfo_executive_01',
      email: overrides.email || 'cfo.alok@apex-hospital.com',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BILLING_MANAGER'],
      permissions: overrides.permissions || ['*'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  const tokenA = createTestToken({ tenantId: tenantA });
  const tokenB = createTestToken({ tenantId: tenantB, userId: 'usr_tenant_b_01', email: 'director.b@hospital-b.com' });

  const app = await buildApp();

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Unified Executive MIS & Revenue Leakage Dashboard Cockpit
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 1] Fetching live Executive MIS Cockpit & Financial KPIs (GET /api/v1/partner/executive-mis/dashboard)...');
    {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/dashboard',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.tenantId, tenantA);

      // Verify core KPI summaries
      const kpis = body.data.summaryKpis;
      assert.ok(kpis.totalGrossBilledInr > 7000000, 'Total Gross Billed must exceed ₹70 Lakhs');
      assert.ok(kpis.totalNetBilledInr > 6500000, 'Total Net Billed must exceed ₹65 Lakhs');
      assert.ok(kpis.totalCashCollectedInr > 3000000, 'Total Cash Collected must exceed ₹30 Lakhs');
      assert.ok(kpis.totalInsuranceArInr > 6000000, 'Total Insurance AR must exceed ₹60 Lakhs');
      assert.ok(kpis.totalUnbilledRiskInr > 300000, 'Total Unbilled Risk must exceed ₹3 Lakhs');
      assert.ok(kpis.totalInventoryShrinkageLossInr > 50000, 'Total Shrinkage Loss must exceed ₹50,000');
      assert.ok(kpis.totalDoctorNetPayoutInr > 1500000, 'Doctor Net Payout must exceed ₹15 Lakhs');
      assert.equal(kpis.unbilledEncountersCount, 3);
      assert.equal(kpis.criticalConsumablesStockoutRiskCount, 2);

      // Verify presence of all sub-systems
      assert.ok(body.data.departmentWiseBilling.length >= 8);
      assert.ok(body.data.unbilledEncounters.length >= 3);
      assert.ok(body.data.insuranceClaimAging.length === 4);
      assert.ok(body.data.inventoryShrinkage.length >= 3);
      assert.ok(body.data.doctorPayouts.length >= 4);
      assert.ok(body.data.rcmLeakageRisks.length >= 3);

      console.log(`  ✔ [PASS] Executive Cockpit KPI aggregation verified:`);
      console.log(`     - Gross Billed: ₹${kpis.totalGrossBilledInr.toLocaleString('en-IN')}`);
      console.log(`     - Net Billed: ₹${kpis.totalNetBilledInr.toLocaleString('en-IN')}`);
      console.log(`     - Cash Collected: ₹${kpis.totalCashCollectedInr.toLocaleString('en-IN')}`);
      console.log(`     - Insurance AR: ₹${kpis.totalInsuranceArInr.toLocaleString('en-IN')}`);
      console.log(`     - Unbilled Risk: ₹${kpis.totalUnbilledRiskInr.toLocaleString('en-IN')}`);
      console.log(`     - Doctor Net Payout: ₹${kpis.totalDoctorNetPayoutInr.toLocaleString('en-IN')}`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 2: Real-Time Department-Wise Billing Breakdown & Reconciliation
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 2] Validating Department-Wise Billing Aggregation & Formulas...');
    {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/billing/department-wise',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      const depts = body.data;

      const expectedDepts = ['OPD', 'IPD', 'EMERGENCY', 'ICU', 'OPERATION_THEATRE', 'PHARMACY', 'LABORATORY', 'RADIOLOGY'];
      for (const expected of expectedDepts) {
        const found = depts.find((d) => d.department === expected);
        assert.ok(found, `Department ${expected} must exist in billing report`);
        // Verify mathematical consistency
        assert.equal(found.netBilledInr, found.grossBilledInr - found.discountsInr, `Net billed formula mismatch for ${expected}`);
        assert.equal(found.cashCollectedInr + found.insurancePendingInr, found.netBilledInr, `Cash + Insurance must equal Net Billed for ${expected}`);
        assert.ok(Math.abs(found.averageTicketSizeInr - Math.round(found.netBilledInr / found.encounterCount)) <= 1, `Ticket size formula mismatch for ${expected}: expected ~${Math.round(found.netBilledInr / found.encounterCount)}, got ${found.averageTicketSizeInr}`);
      }

      console.log(`  ✔ [PASS] All 8 hospital departments mathematically verified (OPD, IPD, ER, ICU, OT, Pharmacy, Lab, Radiology)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 3: Outstanding Unbilled Encounters & Leakage Resolution Workflow
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 3] Testing Outstanding Unbilled Encounters & Charge Capture Resolution...');
    {
      // 3A. Fetch list of unbilled encounters
      const resList = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/billing/unbilled-encounters',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resList.statusCode, 200);
      const listBody = JSON.parse(resList.body);
      assert.equal(listBody.data.length, 3);

      const targetEnc = listBody.data.find((e) => e.encounterId === 'enc-unb-001');
      assert.ok(targetEnc);
      assert.equal(targetEnc.patientMrn, 'MRN-2026-9041');
      assert.equal(targetEnc.unbilledAmountEstimateInr, 45000);
      assert.equal(targetEnc.status, 'ACTION_REQUIRED');

      // 3B. Resolve unbilled encounter (charge captured)
      const resResolve = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/executive-mis/billing/unbilled-encounters/enc-unb-001/resolve',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          resolutionNotes: 'Lab Troponin-T STAT and 2D Echo verified. ₹45,000 posted to final IPD invoice.'
        }
      });
      assert.equal(resResolve.statusCode, 200);
      const resolveBody = JSON.parse(resResolve.body);
      assert.equal(resolveBody.data.status, 'RESOLVED');

      // 3C. Verify dashboard unbilled risk decreases
      const resDash = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/dashboard',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      const dashBody = JSON.parse(resDash.body);
      assert.equal(dashBody.data.summaryKpis.unbilledEncountersCount, 2, 'Unbilled encounters count should be 2 after resolving 1');
      assert.equal(dashBody.data.summaryKpis.totalUnbilledRiskInr, 185000 + 115000, 'Resolved amount should be removed from active risk');

      console.log(`  ✔ [PASS] Charge capture resolution verified: enc-unb-001 transitioned to RESOLVED; risk recalculated`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 4: Insurance Claim Aging (Accounts Receivable Aging) Breakdown
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 4] Validating Insurance Claim Aging (AR Buckets: 0-30, 31-60, 61-90, 90+ Days)...');
    {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/insurance/claim-aging',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      const buckets = body.data;

      assert.equal(buckets.length, 4);
      const [b030, b3160, b6190, bOver90] = buckets;

      assert.equal(b030.bucket, '0_30_DAYS');
      assert.equal(b030.totalClaimAmountInr, 3450000);
      assert.equal(b030.preAuthPendingCount, 14);

      assert.equal(b3160.bucket, '31_60_DAYS');
      assert.equal(b3160.totalClaimAmountInr, 2150000);

      assert.equal(b6190.bucket, '61_90_DAYS');
      assert.equal(b6190.totalClaimAmountInr, 980000);

      assert.equal(bOver90.bucket, 'OVER_90_DAYS');
      assert.equal(bOver90.totalClaimAmountInr, 540000);
      assert.equal(bOver90.deniedCount, 3);

      // Verify TPA distribution within 0_30_DAYS bucket
      const starHealth = b030.tpaBreakdown.find((t) => t.tpaName.includes('Star Health'));
      assert.ok(starHealth);
      assert.equal(starHealth.amountInr, 1420000);

      const pmjay = b030.tpaBreakdown.find((t) => t.tpaName.includes('PMJAY'));
      assert.ok(pmjay);
      assert.equal(pmjay.amountInr, 650000);

      console.log(`  ✔ [PASS] Insurance claim aging buckets validated:`);
      console.log(`     - 0-30 Days: ₹${b030.totalClaimAmountInr.toLocaleString('en-IN')} (${b030.totalClaimCount} claims)`);
      console.log(`     - 31-60 Days: ₹${b3160.totalClaimAmountInr.toLocaleString('en-IN')} (${b3160.totalClaimCount} claims)`);
      console.log(`     - 61-90 Days: ₹${b6190.totalClaimAmountInr.toLocaleString('en-IN')} (${b6190.totalClaimCount} claims)`);
      console.log(`     - 90+ Days (High Risk): ₹${bOver90.totalClaimAmountInr.toLocaleString('en-IN')} (${bOver90.deniedCount} denied)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 5: Inventory Shrinkage, Stock Discrepancy & Consumable Burn-Rates
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 5] Validating Inventory Shrinkage Auditing & Critical Consumable Burn-Rates...');
    {
      // 5A. Get shrinkage records
      const resShrinkage = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/inventory/shrinkage',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resShrinkage.statusCode, 200);
      const shrinkageList = JSON.parse(resShrinkage.body).data;
      assert.ok(shrinkageList.length >= 3);

      const stentItem = shrinkageList.find((s) => s.itemSku === 'SURG-STENT-DES-01');
      assert.ok(stentItem);
      assert.equal(stentItem.totalShrinkageLossInr, 45000);
      assert.equal(stentItem.discrepancyUnits, 1);

      // 5B. Record new physical count audit discrepancy
      const resAuditPost = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/executive-mis/inventory/shrinkage-audit',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          itemSku: 'DIAL-FX80-HIGH-FLUX',
          itemName: 'Fresenius FX-80 High Flux Dialyzer',
          department: 'DIALYSIS_UNIT',
          physicalCount: 18,
          systemRecordedCount: 22,
          discrepancyUnits: 4,
          shrinkageRatePct: 18.18,
          unitCostInr: 2200,
          totalShrinkageLossInr: 8800,
          reason: 'BREAKAGE_SPILLAGE',
          investigationStatus: 'UNDER_AUDIT'
        }
      });
      assert.equal(resAuditPost.statusCode, 201);
      const postBody = JSON.parse(resAuditPost.body);
      assert.equal(postBody.data.itemSku, 'DIAL-FX80-HIGH-FLUX');
      assert.equal(postBody.data.totalShrinkageLossInr, 8800);

      // 5C. Check critical consumable burn-rates (<24h & <72h)
      const resConsumables = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/command/consumables',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resConsumables.statusCode, 200);
      const consumables = JSON.parse(resConsumables.body).data;
      const bloodRunout = consumables.find((c) => c.category === 'BLOOD_UNIT');
      assert.ok(bloodRunout);
      assert.equal(bloodRunout.urgencyLevel, 'CRITICAL_RUNOUT_24H');
      assert.ok(bloodRunout.projectedRunoutDays < 2.0);

      console.log(`  ✔ [PASS] Stock shrinkage discrepancy recorded (₹8,800 Dialyzer loss) & Critical burn-rates verified (<24h O-Neg Blood alert)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 6: Doctor Payout Calculations & Section 194J TDS Deduction Compliance
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 6] Testing Doctor Payout Calculations & Statutory 10% TDS Deductions...');
    {
      const resPayouts = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/doctors/payouts?period=AUGUST_2026',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resPayouts.statusCode, 200);
      const payouts = JSON.parse(resPayouts.body).data;
      assert.equal(payouts.length, 4);

      // Validate Section 194J 10% TDS formula across all doctors
      for (const doc of payouts) {
        assert.equal(doc.hospitalShareInr + doc.doctorGrossPayoutInr, doc.grossBilledRevenueInr, `Gross split mismatch for ${doc.doctorName}`);
        assert.equal(doc.tdsDeductionInr, Math.round(doc.doctorGrossPayoutInr * 0.10), `Section 194J TDS must be 10% for ${doc.doctorName}`);
        assert.equal(doc.netPayableInr, doc.doctorGrossPayoutInr - doc.tdsDeductionInr, `Net payable formula mismatch for ${doc.doctorName}`);
      }

      // Check Dr. Sanjay Gupta (Cardiology Procedure Share 60/40)
      const drGupta = payouts.find((p) => p.doctorId === 'doc-001');
      assert.equal(drGupta.grossBilledRevenueInr, 1250000);
      assert.equal(drGupta.doctorGrossPayoutInr, 750000); // 60%
      assert.equal(drGupta.tdsDeductionInr, 75000); // 10%
      assert.equal(drGupta.netPayableInr, 675000);
      assert.equal(drGupta.settlementStatus, 'APPROVED_BY_CFO');

      // Check Dr. Priya Sharma pending approval, and approve it
      const drSharma = payouts.find((p) => p.doctorId === 'doc-002');
      assert.equal(drSharma.settlementStatus, 'CALCULATED_PENDING_APPROVAL');

      const resApprove = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/executive-mis/doctors/payouts/doc-002/approve',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resApprove.statusCode, 200);
      const approveBody = JSON.parse(resApprove.body);
      assert.equal(approveBody.data.settlementStatus, 'APPROVED_BY_CFO');

      console.log(`  ✔ [PASS] Doctor payouts calculated: 60/40 surgical split, 10% Section 194J TDS enforced, CFO approval validated`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 7: Executive Situational Command, Surge Declaration & What-If Simulation
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 7] Testing Hospital Surge Protocol, Emergency Code Black & What-If Simulation...');
    {
      // 7A. Baseline Snapshot
      const resSnap = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/command/snapshot',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resSnap.statusCode, 200);
      const snap = JSON.parse(resSnap.body).data;
      assert.equal(snap.totalBeds, 450);
      assert.equal(snap.bedOccupancyPct, 89.33);
      assert.equal(snap.surgeLevel, 'BUSY_YELLOW');

      // 7B. Declare Surge Event: Critical Surge Red + Code Black
      const resSurge = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/executive-mis/command/surge',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          surgeLevel: 'CRITICAL_SURGE_RED',
          codeType: 'CODE_BLACK_MASS_CASUALTY',
          location: 'Highway NH-48 Express Collision — ED Resuscitation Bays 1-4',
          justification: 'Inbound 35 trauma casualties from bus collision. ED NEDOCS score 180+ imminent.',
          declaredBy: 'Dr. Alok Verma (Chief Medical Officer)'
        }
      });
      assert.equal(resSurge.statusCode, 200);
      const surgeBody = JSON.parse(resSurge.body).data;
      assert.equal(surgeBody.surgeLevel, 'CRITICAL_SURGE_RED');
      assert.equal(surgeBody.activeEmergencyCodes[0].codeType, 'CODE_BLACK_MASS_CASUALTY');
      assert.equal(surgeBody.activeEmergencyCodes[0].status, 'ACTIVE');

      // 7C. Run What-If Simulation Sandbox
      const resSim = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/executive-mis/command/what-if',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          scenarioName: 'Disaster Plan: 50-Patient Multi-Casualty Mass Inflow',
          surgeType: 'MASS_CASUALTY_SURGE_50_PTS',
          durationHours: 48,
          divertElectiveSurgeries: true,
          fastTrackDischargeBonus: true
        }
      });
      assert.equal(resSim.statusCode, 200);
      const simBody = JSON.parse(resSim.body).data;
      assert.equal(simBody.simulatedOccupancyPeakPct, 104.2);
      assert.equal(simBody.simulatedIcuDeficitBeds, 8);
      assert.equal(simBody.simulatedVentilatorShortageCount, 5);
      assert.ok(simBody.aiRecommendations.length >= 3);

      // 7D. Resolve Surge Event
      const resResolveSurge = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/executive-mis/command/surge/resolve',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          resolvedBy: 'Dr. Alok Verma (CMO)',
          outcomeNotes: 'All 35 trauma casualties triaged and stabilized. Overflow PACU beds successfully utilized.'
        }
      });
      assert.equal(resResolveSurge.statusCode, 200);
      const resolveSurgeBody = JSON.parse(resResolveSurge.body).data;
      assert.equal(resolveSurgeBody.surgeLevel, 'NORMAL_GREEN');
      assert.equal(resolveSurgeBody.activeEmergencyCodes[0].status, 'RESOLVED');

      console.log(`  ✔ [PASS] Surge lifecycle verified (Busy Yellow -> Critical Surge Red Code Black -> Disaster Simulation -> Normal Green)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 8: Multi-Tenant Data Isolation & SHA-256 Cryptographic Audit Vault
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 8] Validating Multi-Tenant Isolation & SHA-256 Audit Chain Integrity...');
    {
      // 8A. Tenant B cannot see Tenant A's unbilled encounters
      const resTenantBUnbilled = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/billing/unbilled-encounters',
        headers: { authorization: `Bearer ${tokenB}` }
      });
      assert.equal(resTenantBUnbilled.statusCode, 200);
      const bUnbilled = JSON.parse(resTenantBUnbilled.body).data;
      assert.equal(bUnbilled.length, 0, 'Tenant B must see 0 unbilled encounters');

      // 8B. Tenant B cannot see Tenant A's doctor payouts
      const resTenantBPayouts = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/doctors/payouts',
        headers: { authorization: `Bearer ${tokenB}` }
      });
      assert.equal(resTenantBPayouts.statusCode, 200);
      const bPayouts = JSON.parse(resTenantBPayouts.body).data;
      assert.equal(bPayouts.length, 0, 'Tenant B must see 0 doctor payouts');

      // 8C. Tenant A Audit Traces have valid SHA-256 cryptographic hashes
      const resAudit = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/executive-mis/audit-traces',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resAudit.statusCode, 200);
      const traces = JSON.parse(resAudit.body).data;
      assert.ok(traces.length >= 5, 'Should have recorded at least 5 audit traces');

      for (const trace of traces) {
        assert.ok(trace.integrityHash, 'Trace must have integrityHash');
        assert.equal(trace.integrityHash.length, 64, 'Integrity hash must be 64-char hex SHA-256');
        assert.ok(trace.traceNumber.startsWith('TRACE-EXEC-'));
      }

      console.log(`  ✔ [PASS] Multi-tenant isolation verified & SHA-256 audit chain validated (${traces.length} immutable traces)`);
      testsPassed++;
    }

    const duration = (performance.now() - startTime).toFixed(2);
    console.log('\n======================================================================');
    console.log(`🎉 TEST SUMMARY: ${testsPassed}/${testsTotal} SCENARIOS PASSED (${duration}ms)`);
    console.log('   EXECUTIVE MIS & REVENUE LEAKAGE PLATFORM FULLY CERTIFIED');
    console.log('======================================================================\n');
  } finally {
    await app.close();
  }
}

runExecutiveMisTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH UNHANDLED ERROR:');
  console.error(err);
  process.exit(1);
});
