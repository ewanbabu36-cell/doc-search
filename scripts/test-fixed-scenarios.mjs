import {
  VIEWPORTS,
  ensureChrome,
  closeChrome,
  createRoleAuth,
  runBrowserScenario
} from './category-5-cdp-helpers.mjs';

async function main() {
  await ensureChrome();

  const scenarios = [
    {
      name: 'partner_doctor_opd_one_flow_express',
      role: 'DOCTOR',
      orgType: 'CLINIC',
      module: 'opd-one-flow-express',
      url: 'http://localhost:5173/?module=opd-one-flow-express'
    },
    {
      name: 'partner_doctor_my_smart_desk',
      role: 'DOCTOR',
      orgType: 'CLINIC',
      module: 'my-smart-desk',
      url: 'http://localhost:5173/?module=my-smart-desk'
    },
    {
      name: 'independent_session_a_doctor',
      role: 'DOCTOR',
      orgType: 'HOSPITAL',
      module: 'clinical-consultation',
      url: 'http://localhost:5173/?module=clinical-consultation'
    },
    {
      name: 'independent_session_b_pharmacy',
      role: 'PHARMACIST',
      orgType: 'PHARMACY',
      module: 'pharmacy-medication',
      url: 'http://localhost:5173/?module=pharmacy-medication'
    },
    {
      name: 'partner_session_logged_out',
      url: 'http://localhost:5173',
      setupStorage: `
        localStorage.clear();
        localStorage.setItem('docsearch_logged_out', 'true');
      `
    }
  ];

  let allPass = true;

  for (const s of scenarios) {
    const auth = s.role ? createRoleAuth(s.role, s.orgType, s.module) : s.setupStorage;
    const res = await runBrowserScenario({
      url: s.url,
      viewport: VIEWPORTS.desktop_1080,
      setupStorage: auth,
      scenarioName: s.name
    });

    console.log(`\nScenario: ${s.name}`);
    console.log(`Success: ${res.success}`);
    console.log(`BodyLength: ${res.dom?.bodyLength}`);
    console.log(`Console Errors (${res.consoleErrors?.length || 0}):`, res.consoleErrors);
    console.log(`Exceptions (${res.uncaughtExceptions?.length || 0}):`, res.uncaughtExceptions);

    if (!res.success || (res.consoleErrors?.length || 0) > 0 || (res.uncaughtExceptions?.length || 0) > 0) {
      allPass = false;
    }
  }

  closeChrome();
  console.log('\n===========================================');
  console.log(`ALL 5 TARGETED SCENARIOS PASSED: ${allPass}`);
  console.log('===========================================');
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
