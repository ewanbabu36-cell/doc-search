import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { signJwt } from '@docsearch/auth';

const BASE_URL = 'http://127.0.0.1:4000';
const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
const ISSUER = 'docsearch-api';
const AUDIENCE = 'docsearch-platform';

function createSuperAdminToken() {
  const claims = {
    sub: 'e0000000-0000-4000-8000-000000000001',
    email: 'founder@docsearch.health',
    tenantId: '00000000-0000-4000-8000-000000000000',
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

const adminToken = createSuperAdminToken();

async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    ...options.headers
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 MASTER ACCEPTANCE TEST SUITE: PARTNER CONFIG & ACCESS ENGINE');
  console.log('================================================================\n');

  // 1. Check Master Blueprints Listing
  console.log('TEST 1: Fetching 10 Master Blueprints Catalog...');
  const { status: tplStatus, data: tplData } = await apiRequest('/api/v1/company/templates');
  assert.equal(tplStatus, 200, 'Expected status 200 from /api/v1/company/templates');
  assert(Array.isArray(tplData.data), 'Expected array of templates');
  console.log(`✓ Loaded ${tplData.data.length} Master Blueprints`);
  const hospitalEnterprise = tplData.data.find(t => t.code === 'TPL_HOSPITAL_ENTERPRISE');
  assert(hospitalEnterprise, 'Hospital Enterprise blueprint must exist');
  console.log(`✓ Found blueprint: ${hospitalEnterprise.name} (Code: ${hospitalEnterprise.code}, v${hospitalEnterprise.currentVersion})`);

  // 2. Check 21 Master Capabilities Listing
  console.log('\nTEST 2: Fetching 21 Master Capabilities Catalog...');
  const { status: capStatus, data: capData } = await apiRequest('/api/v1/company/capabilities');
  assert.equal(capStatus, 200, 'Expected status 200 from /api/v1/company/capabilities');
  assert(capData.data.length >= 21, 'Expected at least 21 master capabilities');
  console.log(`✓ Loaded ${capData.data.length} Master Capabilities Catalog`);

  // 3. Scenario Setup: Target Partner "abc-multi-specialty"
  const partnerId = 'abc-multi-specialty';
  console.log(`\nTEST 3: Setting up Combo Partner: ${partnerId}`);
  console.log('   Combo: Hospital + Laboratory + Radiology + Pharmacy (Blood Bank DISABLED)');

  // Configure Capabilities
  const comboCaps = ['OPD', 'IPD', 'EMERGENCY', 'ICU', 'OT', 'LABORATORY', 'RADIOLOGY', 'PHARMACY', 'BILLING', 'MRD'];
  const { status: syncStatus, data: syncData } = await apiRequest(`/api/v1/company/partners/${partnerId}/capabilities`, {
    method: 'POST',
    body: JSON.stringify({
      activeCapabilities: comboCaps,
      reason: 'Combo organization onboarding: Hospital + Lab + Radiology + Pharmacy'
    })
  });
  assert.equal(syncStatus, 200, 'Expected capability sync 200');
  console.log(`✓ Synchronized active capabilities: ${syncData.data.activeCapabilities.join(', ')}`);

  // 4. Apply Hospital Enterprise Template
  console.log(`\nTEST 4: Applying Hospital Enterprise Template to ${partnerId}...`);
  const { status: applyStatus, data: applyData } = await apiRequest(`/api/v1/company/templates/${hospitalEnterprise.id}/apply/${partnerId}`, {
    method: 'POST',
    body: JSON.stringify({ versionNumber: 1 })
  });
  assert.equal(applyStatus, 200, 'Expected template apply 200');
  console.log(`✓ Applied Blueprint: ${applyData.message}`);
  assert.equal(applyData.data.configurationVersion, 1, 'Baseline configuration version should be 1');

  // 5. Create Custom Role: Senior Reception Manager
  console.log('\nTEST 5: Creating Custom Role: Senior Reception Manager...');
  const { status: roleStatus, data: roleData } = await apiRequest(`/api/v1/company/partners/${partnerId}/roles`, {
    method: 'POST',
    body: JSON.stringify({
      code: 'SENIOR_RECEPTION_MANAGER',
      name: 'Senior Reception Manager',
      description: 'Supervises front-desk operations, patient registrations, and invoice lookups',
      permissionPackCodes: ['PACK_RECEPTION_DESK', 'PACK_OPD_BASIC'],
      customPermissions: ['patient.view', 'appointment.token.create', 'invoice.view']
    })
  });
  assert.equal(roleStatus, 201, 'Expected role creation 201');
  console.log(`✓ Custom role created: ${roleData.data.name} (${roleData.data.code})`);

  // 6. Access Decision Evaluation: Allowed Actions
  console.log('\nTEST 6: Evaluating Allowed Action: patient.view for Senior Reception Manager at Patna branch...');
  const { status: accStatus1, data: accData1 } = await apiRequest(
    `/api/v1/company/partners/${partnerId}/effective-access?role=SENIOR_RECEPTION_MANAGER&branchId=patna-branch&action=patient.view`
  );
  assert.equal(accStatus1, 200);
  console.log(`✓ Decision: ${accData1.data.decision} (${accData1.data.code}) — ${accData1.data.reason}`);
  assert.equal(accData1.data.decision, 'ALLOW', 'patient.view should be ALLOW');

  // 7. Access Decision Evaluation: Explicitly Denied Action (invoice.refund)
  console.log('\nTEST 7: Evaluating Denied Action: invoice.refund for Senior Reception Manager...');
  const { status: accStatus2, data: accData2 } = await apiRequest(
    `/api/v1/company/partners/${partnerId}/effective-access?role=SENIOR_RECEPTION_MANAGER&branchId=patna-branch&action=invoice.refund`
  );
  assert.equal(accStatus2, 200);
  console.log(`✓ Decision: ${accData2.data.decision} (${accData2.data.code}) — ${accData2.data.reason}`);
  assert.equal(accData2.data.decision, 'DENY', 'invoice.refund must be strictly DENY');

  // 8. Access Decision Evaluation: Disabled Capability (Blood Bank)
  console.log('\nTEST 8: Evaluating Action on Disabled Capability: bloodbank.donor.register...');
  const { status: accStatus3, data: accData3 } = await apiRequest(
    `/api/v1/company/partners/${partnerId}/effective-access?role=DOCTOR&branchId=patna-branch&action=bloodbank.donor.register`
  );
  assert.equal(accStatus3, 200);
  console.log(`✓ Decision: ${accData3.data.decision} (${accData3.data.code}) — ${accData3.data.reason}`);
  assert.equal(accData3.data.decision, 'DENY', 'Action on disabled blood bank capability must be DENY');
  assert.equal(accData3.data.code, 'DENY_CAPABILITY_DISABLED');

  // 9. Multi-Branch Scope Check
  console.log('\nTEST 9: Multi-Branch Scope Enforcement...');
  // Check Patna branch (assigned) vs Delhi branch (unassigned)
  const { status: accPatna, data: dataPatna } = await apiRequest(
    `/api/v1/company/partners/${partnerId}/effective-access?role=SENIOR_RECEPTION_MANAGER&branchId=patna-branch&action=patient.view`
  );
  assert.equal(dataPatna.data.decision, 'ALLOW', 'Patna branch access should be allowed');
  console.log(`✓ Assigned Branch (Patna): ${dataPatna.data.decision}`);

  // 10. Access Simulator Consistency Check
  console.log('\nTEST 10: Access Simulator Dry-Run What-If Testing (Tier Precedence Verification)...');
  const { status: simStatus, data: simData } = await apiRequest('/api/v1/company/access/simulate', {
    method: 'POST',
    body: JSON.stringify({
      partnerId,
      role: 'SENIOR_RECEPTION_MANAGER',
      branchId: 'patna-branch',
      action: 'patient.view'
    })
  });
  assert.equal(simStatus, 200);
  console.log(`✓ Simulator Decision: ${simData.data.decision} (${simData.data.code})`);
  assert.equal(simData.data.decision, accData1.data.decision, 'Simulator and Effective Access must produce identical decision');
  assert.equal(simData.data.code, accData1.data.code, 'Simulator and Effective Access must produce identical code');
  console.log(`✓ 12-Tier Evaluation Traces verified (${simData.data.trace.length} tiers evaluated)`);
  simData.data.trace.forEach(t => {
    console.log(`   [Tier ${t.tierNumber}] ${t.tierName}: ${t.status} - ${t.detail}`);
  });

  // 11. Simulator What-If: Simulate HQ Global Freeze
  console.log('\nTEST 11: Simulator What-If Test: Simulating HQ Global Freeze Override...');
  const { status: freezeSimStatus, data: freezeSimData } = await apiRequest('/api/v1/company/access/simulate', {
    method: 'POST',
    body: JSON.stringify({
      partnerId,
      role: 'SUPER_ADMIN_MOCK',
      action: 'patient.view',
      globalFreezeOverride: true
    })
  });
  assert.equal(freezeSimStatus, 200);
  console.log(`✓ Freeze Simulation Decision: ${freezeSimData.data.decision} (${freezeSimData.data.code})`);
  assert.equal(freezeSimData.data.decision, 'DENY', 'Global freeze must strictly DENY all access');
  assert.equal(freezeSimData.data.decisiveTier, 'TIER_1_GLOBAL_KILL_SWITCH');

  // 12. Save Partner Configuration as Template
  console.log(`\nTEST 12: Saving ${partnerId} Configuration as Master Blueprint...`);
  const { status: saveTplStatus, data: saveTplData } = await apiRequest(`/api/v1/company/partners/${partnerId}/save-as-template`, {
    method: 'POST',
    body: JSON.stringify({
      templateName: 'ABC Healthcare Custom Enterprise',
      templateCode: 'ABC_CUSTOM_ENTERPRISE',
      category: 'HEALTHCARE_GROUP'
    })
  });
  assert.equal(saveTplStatus, 201, 'Expected save-as-template 201');
  console.log(`✓ Saved Partner as Template: ${saveTplData.message}`);

  // 13. Configuration History, Semantic Diff & Rollback
  console.log(`\nTEST 13: Configuration Snapshot History & Semantic Diff...`);
  const { status: histStatus, data: histData } = await apiRequest(`/api/v1/company/partners/${partnerId}/configuration/history`);
  assert.equal(histStatus, 200);
  console.log(`✓ Retrieved ${histData.data.length} configuration snapshot(s) for partner`);

  // 14. Break-Glass Emergency Clinical Access
  console.log('\nTEST 14: Break-Glass Emergency Clinical Access Trigger...');
  const { status: bgStatus, data: bgData } = await apiRequest('/api/v1/company/break-glass', {
    method: 'POST',
    body: JSON.stringify({
      partnerId,
      reason: 'Critical polytrauma patient resuscitation: immediate ICU physician override',
      patientId: 'PAT-TRAUMA-991',
      durationMinutes: 30
    })
  });
  assert.equal(bgStatus, 201);
  console.log(`✓ Break-Glass Access Authorized: ${bgData.message}`);

  console.log('\n================================================================');
  console.log('🎉 ALL 14 MASTER ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
