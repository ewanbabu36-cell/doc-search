import {
  HOSPITAL_FREE_TIER_NAME,
  HOSPITAL_PRO_TIER_NAME,
  FREE_HOSPITAL_FEATURES,
  PRO_HOSPITAL_FEATURES,
  LOCKED_HOSPITAL_MODULES_FOR_FREE_TIER,
  isHospitalFreeTier,
  isHospitalModuleLocked
} from '../packages/shared-core/dist/index.js';

const API_BASE = 'http://localhost:4000';

async function runTests() {
  console.log('\n======================================================');
  console.log('🏥 RUNNING HOSPITAL 2-TIER PLAN VERIFICATION (APPROACH A)');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check Shared-Core Entitlement Constants & Helper Functions
  console.log('--- TEST SUITE 1: Shared Core Entitlements & Helpers ---');
  assert(HOSPITAL_FREE_TIER_NAME === 'Hospital Foundation (Free OPD Core)', 'Free tier canonical name is correct');
  assert(HOSPITAL_PRO_TIER_NAME === 'Hospital Complete Enterprise Suite', 'Pro tier canonical name is correct');
  assert(FREE_HOSPITAL_FEATURES.length === 7, `Free tier has 7 features (found ${FREE_HOSPITAL_FEATURES.length})`);
  assert(PRO_HOSPITAL_FEATURES.length === 13, `Pro tier has 13 features (found ${PRO_HOSPITAL_FEATURES.length})`);
  assert(isHospitalFreeTier(HOSPITAL_FREE_TIER_NAME) === true, 'isHospitalFreeTier correctly identifies free tier');
  assert(isHospitalFreeTier(HOSPITAL_PRO_TIER_NAME) === false, 'isHospitalFreeTier correctly identifies pro tier as false');
  assert(isHospitalFreeTier('Free Plan') === true, 'isHospitalFreeTier recognizes "Free Plan"');
  assert(isHospitalFreeTier('STARTER') === true, 'isHospitalFreeTier recognizes "STARTER"');

  // Module lock checks
  assert(isHospitalModuleLocked('inpatient-management', HOSPITAL_FREE_TIER_NAME) === true, 'Inpatient ADT is locked on free tier');
  assert(isHospitalModuleLocked('operation-theatre-management', HOSPITAL_FREE_TIER_NAME) === true, 'OT is locked on free tier');
  assert(isHospitalModuleLocked('insurance-claims', HOSPITAL_FREE_TIER_NAME) === true, 'TPA Claims is locked on free tier');
  assert(isHospitalModuleLocked('patient-registration', HOSPITAL_FREE_TIER_NAME) === false, 'OPD Registration is unlocked on free tier');
  assert(isHospitalModuleLocked('clinical-consultation', HOSPITAL_FREE_TIER_NAME) === false, 'Doctor OPD desk is unlocked on free tier');
  assert(isHospitalModuleLocked('nurse-triage-station', HOSPITAL_FREE_TIER_NAME) === false, 'Nurse vitals station is unlocked on free tier');
  assert(isHospitalModuleLocked('billing-revenue-cycle', HOSPITAL_FREE_TIER_NAME) === false, 'Billing desk is unlocked on free tier');
  assert(isHospitalModuleLocked('inpatient-management', HOSPITAL_PRO_TIER_NAME) === false, 'Inpatient is unlocked on pro tier');

  // 2. Register a Hospital on Free Tier via API Gateway
  console.log('\n--- TEST SUITE 2: Self-Registration on Free Tier ---');
  const freeHospEmail = `freehosp_${Date.now()}@docsearch.health`;
  const freeRegRes = await fetch(`${API_BASE}/api/v1/auth/self-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partner: {
        email: freeHospEmail,
        password: 'Password123!',
        name: 'Dr. Vivek Sharma',
        facilityName: 'Metro Community Free Hospital',
        organizationType: 'HOSPITAL',
        planTier: HOSPITAL_FREE_TIER_NAME,
        phone: '9876543210',
        requestedPlan: {
          id: 'plan_hosp_free',
          tier: 'FREE',
          price: '₹0 / Free Forever'
        }
      },
      verificationItem: {
        submittedBy: 'Dr. Vivek Sharma',
        partnerType: 'HOSPITAL',
        partnerName: 'Metro Community Free Hospital',
        details: {
          'Registered Email': freeHospEmail,
          'Phone / Mobile': '9876543210'
        }
      }
    })
  });

  const freeRegJson = await freeRegRes.json();
  assert(freeRegRes.status === 201, `Self-register returned 201 Created (got ${freeRegRes.status})`);
  assert(freeRegJson.data?.planTier === HOSPITAL_FREE_TIER_NAME, `Registered planTier is "${HOSPITAL_FREE_TIER_NAME}"`);
  assert(freeRegJson.data?.accessibleFeatures?.length === 7, `Registered user features count is 7`);

  // 3. Test Partner-Status endpoint for Free Hospital
  console.log('\n--- TEST SUITE 3: Partner Status Verification ---');
  const statusRes = await fetch(`${API_BASE}/api/v1/auth/partner-status?email=${encodeURIComponent(freeHospEmail)}`);
  const statusJson = await statusRes.json();
  assert(statusRes.status === 200, 'Status check returned 200 OK');
  assert(statusJson.planTier === HOSPITAL_FREE_TIER_NAME, `partner-status returns planTier "${HOSPITAL_FREE_TIER_NAME}"`);

  // 4. Test 1-Click Upgrade Endpoint (/api/v1/auth/upgrade-plan)
  console.log('\n--- TEST SUITE 4: 1-Click Upgrade to Complete Enterprise Suite ---');
  const upgradeRes = await fetch(`${API_BASE}/api/v1/auth/upgrade-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: freeHospEmail,
      targetPlanTier: HOSPITAL_PRO_TIER_NAME
    })
  });

  const upgradeJson = await upgradeRes.json();
  assert(upgradeRes.status === 200, `Upgrade returned 200 OK (got ${upgradeRes.status})`);
  assert(upgradeJson.success === true, 'Upgrade reported success === true');
  assert(upgradeJson.data?.planTier === HOSPITAL_PRO_TIER_NAME, `Upgraded planTier is "${HOSPITAL_PRO_TIER_NAME}"`);
  assert(upgradeJson.data?.accessibleFeatures?.length === 13, `Upgraded features count is 13`);

  // Verify status after upgrade
  const postUpgradeStatusRes = await fetch(`${API_BASE}/api/v1/auth/partner-status?email=${encodeURIComponent(freeHospEmail)}`);
  const postUpgradeStatusJson = await postUpgradeStatusRes.json();
  assert(postUpgradeStatusJson.planTier === HOSPITAL_PRO_TIER_NAME, `Post-upgrade partner-status confirms "${HOSPITAL_PRO_TIER_NAME}"`);

  // Verify that inpatient and OT are now completely unlocked for this user
  assert(isHospitalModuleLocked('inpatient-management', postUpgradeStatusJson.planTier) === false, 'Inpatient ADT is now UNLOCKED');
  assert(isHospitalModuleLocked('operation-theatre-management', postUpgradeStatusJson.planTier) === false, 'OT is now UNLOCKED');
  assert(isHospitalModuleLocked('insurance-claims', postUpgradeStatusJson.planTier) === false, 'TPA Claims is now UNLOCKED');

  // 5. Test Registering directly on Paid Plan
  console.log('\n--- TEST SUITE 5: Direct Registration on Complete Enterprise Suite ---');
  const proHospEmail = `prohosp_${Date.now()}@docsearch.health`;
  const proRegRes = await fetch(`${API_BASE}/api/v1/auth/self-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partner: {
        email: proHospEmail,
        password: 'Password123!',
        name: 'Dr. Priya Desai',
        facilityName: 'CarePlus Multi-Specialty Hospital',
        organizationType: 'HOSPITAL',
        planTier: HOSPITAL_PRO_TIER_NAME,
        phone: '9876543211',
        requestedPlan: {
          id: 'plan_hosp_pro',
          tier: 'COMPLETE_SUITE',
          price: '₹4,999/month'
        }
      },
      verificationItem: {
        submittedBy: 'Dr. Priya Desai',
        partnerType: 'HOSPITAL',
        partnerName: 'CarePlus Multi-Specialty Hospital',
        details: {
          'Registered Email': proHospEmail,
          'Phone / Mobile': '9876543211'
        }
      }
    })
  });

  const proRegJson = await proRegRes.json();
  assert(proRegRes.status === 201, `Pro self-register returned 201 Created (got ${proRegRes.status})`);
  assert(proRegJson.data?.planTier === HOSPITAL_PRO_TIER_NAME, `Pro registered planTier is "${HOSPITAL_PRO_TIER_NAME}"`);
  assert(proRegJson.data?.accessibleFeatures?.length === 13, `Pro user has all 13 features unlocked immediately`);
  assert(isHospitalModuleLocked('inpatient-management', proRegJson.data?.planTier) === false, 'Inpatient is unlocked immediately');

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
