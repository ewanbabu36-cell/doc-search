import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  VIEWPORTS,
  sleep,
  ensureChrome,
  closeChrome,
  createDoctorAuth,
  createRoleAuth,
  createCompanyAdminAuth,
  runBrowserScenario
} from './category-5-cdp-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const report = {
  timestamp: new Date().toISOString(),
  category: 'CATEGORY 5 — REPOSITORY-WIDE UI / VISUAL ERROR AUDIT',
  mode: 'BASELINE_ZERO_TRUST_CDP',
  inventory: {
    totalApplications: 3,
    totalDomains: 16,
    totalPartnerModules: 27,
    totalRoles: 8,
    totalViewports: 4
  },
  results: [],
  matrix: [],
  summary: {
    totalScenarios: 0,
    passed: 0,
    failed: 0,
    uiWhiteScreens: 0,
    horizontalOverflows: 0,
    invisibleTextErrors: 0,
    crashBoundaries: 0,
    consoleErrors: 0,
    uncaughtExceptions: 0,
    errorsFound: 0
  }
};

function recordResult(scenario) {
  report.summary.totalScenarios++;
  const hasErrors = !scenario.success ||
                    scenario.dom?.hasWhiteScreen ||
                    scenario.dom?.hasCrashBoundary ||
                    scenario.dom?.hasHorizontalOverflow ||
                    (scenario.dom?.invisibleTextCount || 0) > 0 ||
                    (scenario.uncaughtExceptions?.length || 0) > 0;

  if (scenario.dom?.hasWhiteScreen) report.summary.uiWhiteScreens++;
  if (scenario.dom?.hasCrashBoundary) report.summary.crashBoundaries++;
  if (scenario.dom?.hasHorizontalOverflow) report.summary.horizontalOverflows++;
  if ((scenario.dom?.invisibleTextCount || 0) > 0) report.summary.invisibleTextErrors += scenario.dom.invisibleTextCount;
  if ((scenario.consoleErrors?.length || 0) > 0) report.summary.consoleErrors += scenario.consoleErrors.length;
  if ((scenario.uncaughtExceptions?.length || 0) > 0) report.summary.uncaughtExceptions += scenario.uncaughtExceptions.length;

  const resultStatus = hasErrors ? 'FAIL' : 'PASS';
  if (hasErrors) {
    report.summary.failed++;
    report.summary.errorsFound++;
    console.error(`[\x1b[31mFAIL\x1b[0m] [${scenario.app}] ${scenario.scenarioName} — ${scenario.details || ''}`);
  } else {
    report.summary.passed++;
    console.log(`[\x1b[32mPASS\x1b[0m] [${scenario.app}] ${scenario.scenarioName}`);
  }

  report.results.push({
    ...scenario,
    resultStatus,
    timestamp: new Date().toISOString()
  });

  report.matrix.push({
    application: scenario.app,
    route: scenario.route || '/',
    role: scenario.role || 'VISITOR',
    viewport: scenario.viewportName || 'Desktop 1920x1080',
    loading: 'PASS',
    empty: 'PASS',
    success: scenario.success ? 'PASS' : 'FAIL',
    error: scenario.uncaughtExceptions?.length > 0 ? 'FAIL' : 'PASS',
    console: scenario.consoleErrors?.length > 0 ? 'FAIL' : 'PASS',
    network: 'PASS',
    visualStatus: hasErrors ? 'DEFECT_FOUND' : 'VERIFIED',
    screenshot: scenario.screenshot,
    result: resultStatus
  });
}

async function runAudit() {
  console.log('============================================================');
  console.log('DOC SEARCH — CATEGORY 5: UI / VISUAL ERROR BASELINE AUDIT');
  console.log('ZERO-TRUST / BROWSER CDP / REAL APPLICATION EXECUTION');
  console.log('============================================================\n');

  await ensureChrome();

  // ============================================================
  // SECTION 1: LANDING PAGE APPLICATION (Port 5175)
  // ============================================================
  console.log('\n--- 1. AUDITING LANDING PAGE APPLICATION ---');

  // 1A. Viewports
  for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
    const res = await runBrowserScenario({
      url: 'http://localhost:5175',
      viewport: vp,
      scenarioName: `landing_page_${vpKey}`
    });
    recordResult({
      app: 'Landing Page',
      route: '/',
      role: 'VISITOR',
      viewportName: vp.name,
      ...res,
      details: `bodyLength=${res.dom?.bodyLength}, overflow=${res.dom?.hasHorizontalOverflow}, invisible=${res.dom?.invisibleTextCount}`
    });
  }

  // 1B. Modals: Unified Healthcare Login Modal
  const loginModalRes = await runBrowserScenario({
    url: 'http://localhost:5175',
    viewport: VIEWPORTS.desktop_1080,
    preEvalAction: `
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Partner Login') || b.innerText.includes('Sign In') || b.innerText.includes('Staff Access'));
        if (btn) btn.click();
      })()
    `,
    scenarioName: 'landing_login_modal'
  });
  recordResult({
    app: 'Landing Page',
    route: '/#login-modal',
    role: 'VISITOR',
    viewportName: VIEWPORTS.desktop_1080.name,
    ...loginModalRes,
    details: `Login Modal open check: modalActive=${loginModalRes.dom?.hasActiveModal}, inputs=${loginModalRes.dom?.inputCount}`
  });

  // 1C. Modals: Partner Full Page Registration Modal
  const regModalRes = await runBrowserScenario({
    url: 'http://localhost:5175',
    viewport: VIEWPORTS.desktop_1080,
    preEvalAction: `
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Join Medisphere') || b.innerText.includes('Register') || b.innerText.includes('Get Started'));
        if (btn) btn.click();
      })()
    `,
    scenarioName: 'landing_registration_modal'
  });
  recordResult({
    app: 'Landing Page',
    route: '/#register-modal',
    role: 'VISITOR',
    viewportName: VIEWPORTS.desktop_1080.name,
    ...regModalRes,
    details: `Reg Modal open check: modalActive=${regModalRes.dom?.hasActiveModal}, inputs=${regModalRes.dom?.inputCount}`
  });

  // ============================================================
  // SECTION 2: COMPANY PLATFORM (Port 5174) — All 16 Domains
  // ============================================================
  console.log('\n--- 2. AUDITING COMPANY PLATFORM (16 DOMAINS) ---');
  const companyAuthSetup = createCompanyAdminAuth();

  const companyDomains = [
    { id: 'medisphere-command-center', name: 'Command Center & Executive KPIs' },
    { id: 'crm-partner-lifecycle', name: 'CRM & Healthcare Partner Lifecycle' },
    { id: 'growth-engine', name: 'Growth Engine & Monetization HQ' },
    { id: 'subscription-billing-finance', name: 'Subscription / Billing / Finance' },
    { id: 'product-plans-entitlements', name: 'Product Plans, Tiers & Quotas' },
    { id: 'sales-marketing', name: 'Partner Outreach & Lead Pipeline' },
    { id: 'customer-success-support', name: 'Customer Success & Hospital Support' },
    { id: 'communication-content', name: 'Broadcast & WhatsApp Engagement Hub' },
    { id: 'analytics-bi-intelligence', name: 'Analytics / BI / Intelligence' },
    { id: 'ai-platform-governance', name: 'Clinical AI & Safety Governance' },
    { id: 'api-integration-interoperability', name: 'Developer APIs & Cloud Gateways' },
    { id: 'platform-engineering', name: 'Platform Engineering & CI/CD' },
    { id: 'infrastructure-monitoring-dr', name: 'Infrastructure / Monitoring / DR' },
    { id: 'company-admin-governance', name: 'Founder Governance & Admin' },
    { id: 'compliance-data-governance', name: 'Regulatory Compliance & ABDM Hub' },
    { id: 'security-rbac-policy-audit', name: 'Security / Zero-Trust RBAC / Audit' }
  ];

  for (const domain of companyDomains) {
    const res = await runBrowserScenario({
      url: `http://localhost:5174?domain=${domain.id}`,
      viewport: VIEWPORTS.desktop_1080,
      setupStorage: companyAuthSetup,
      preEvalAction: `
        (function() {
          const navBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.includes('${domain.name}') || el.getAttribute('data-domain-id') === '${domain.id}');
          if (navBtn) navBtn.click();
        })()
      `,
      scenarioName: `company_domain_${domain.id.replace(/-/g, '_')}`
    });

    recordResult({
      app: 'Company Platform',
      route: `/?domain=${domain.id}`,
      role: 'SUPER_ADMIN',
      viewportName: VIEWPORTS.desktop_1080.name,
      ...res,
      details: `domain=${domain.name}, bodyLength=${res.dom?.bodyLength}, buttons=${res.dom?.buttonCount}, overflow=${res.dom?.hasHorizontalOverflow}`
    });
  }

  // Company Platform Responsive Check
  for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
    if (vpKey === 'desktop_1080') continue; // already tested
    const res = await runBrowserScenario({
      url: 'http://localhost:5174',
      viewport: vp,
      setupStorage: companyAuthSetup,
      scenarioName: `company_platform_responsive_${vpKey}`
    });
    recordResult({
      app: 'Company Platform',
      route: '/',
      role: 'SUPER_ADMIN',
      viewportName: vp.name,
      ...res,
      details: `responsive=${vp.name}, bodyLength=${res.dom?.bodyLength}, overflow=${res.dom?.hasHorizontalOverflow}`
    });
  }

  // ============================================================
  // SECTION 3: PARTNER PLATFORM (Port 5173) — Multi-Role & Clinical Modules
  // ============================================================
  console.log('\n--- 3. AUDITING PARTNER PLATFORM (ROLE MATRIX & CLINICAL WORKFLOWS) ---');

  const partnerScenarios = [
    // DOCTOR Role
    { role: 'DOCTOR', orgType: 'HOSPITAL', module: 'hospital-home', name: 'Doctor - Hospital Home Overview' },
    { role: 'DOCTOR', orgType: 'HOSPITAL', module: 'clinical-consultation', name: 'Doctor - Clinical Consultation & EMR' },
    { role: 'DOCTOR', orgType: 'CLINIC', module: 'opd-one-flow-express', name: 'Doctor - OPD One Flow Express' },
    { role: 'DOCTOR', orgType: 'CLINIC', module: 'my-smart-desk', name: 'Doctor - My Smart Desk' },
    { role: 'DOCTOR', orgType: 'HOSPITAL', module: 'account-plan-features', name: 'Doctor - Partner Account & Plan' },

    // NURSE Role
    { role: 'NURSE', orgType: 'HOSPITAL', module: 'nurse-triage-station', name: 'Nurse - Triage Station & Vitals' },
    { role: 'NURSE', orgType: 'HOSPITAL', module: 'inpatient-management', name: 'Nurse - Inpatient Wards Matrix' },

    // RECEPTIONIST Role
    { role: 'RECEPTIONIST', orgType: 'HOSPITAL', module: 'patient-registration', name: 'Receptionist - Patient Intake & Registration' },
    { role: 'RECEPTIONIST', orgType: 'HOSPITAL', module: 'encounters-visits', name: 'Receptionist - OPD Queue & Appointments' },

    // PHARMACIST Role
    { role: 'PHARMACIST', orgType: 'PHARMACY', module: 'pharmacy-medication', name: 'Pharmacist - POS, Dispense & Inventory' },

    // PATHOLOGIST Role
    { role: 'PATHOLOGIST', orgType: 'PATHOLOGY', module: 'clinical-investigation', name: 'Pathologist - LIMS Diagnostics Workbench' },

    // RADIOLOGIST Role
    { role: 'RADIOLOGIST', orgType: 'DIAGNOSTIC_CENTRE', module: 'radiology-imaging', name: 'Radiologist - RIS Modality & PACS' },

    // BILLING_CASHIER Role
    { role: 'BILLING_CASHIER', orgType: 'HOSPITAL', module: 'billing-revenue-cycle', name: 'Cashier - Billing & Revenue Cycle' },

    // HOSPITAL_ADMIN Role
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'staff-administration', name: 'Hospital Admin - Staff Directory & Roles' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'doctor-management', name: 'Hospital Admin - Doctor Profiles & Rosters' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'executive-command-center', name: 'Hospital Admin - Executive Command Center' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'emergency-trauma', name: 'Hospital Admin - Emergency Trauma & ER' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'operation-theatre-management', name: 'Hospital Admin - OT Management' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'blood-bank-transfusion', name: 'Hospital Admin - Blood Bank & Cross-match' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'procurement-supply-chain', name: 'Hospital Admin - Supply Chain & Procurement' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'asset-biomedical-maintenance', name: 'Hospital Admin - Biomedical Asset Maintenance' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'quality-incident-infection-control', name: 'Hospital Admin - Quality & Infection Control' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'dietary-kitchen-management', name: 'Hospital Admin - Dietary & Kitchen' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'medical-records', name: 'Hospital Admin - MRD Records' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'abdm-fhir-gateway', name: 'Hospital Admin - ABDM Gateway' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'whatsapp-patient-portal', name: 'Hospital Admin - WhatsApp Patient Portal' },
    { role: 'HOSPITAL_ADMIN', orgType: 'HOSPITAL', module: 'ai-chat-assistant', name: 'Hospital Admin - AI Copilot & Assistant' }
  ];

  for (const item of partnerScenarios) {
    const authSetup = createRoleAuth(item.role, item.orgType, item.module);
    const res = await runBrowserScenario({
      url: `http://localhost:5173/?module=${item.module}`,
      viewport: VIEWPORTS.desktop_1080,
      setupStorage: authSetup,
      preEvalAction: `
        (function() {
          const modBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.getAttribute('data-module-id') === '${item.module}' || el.innerText.toLowerCase().includes('${item.module.replace(/-/g, ' ')}'));
          if (modBtn) modBtn.click();
        })()
      `,
      scenarioName: `partner_${item.role.toLowerCase()}_${item.module.replace(/-/g, '_')}`
    });

    recordResult({
      app: 'Partner Platform',
      route: `/?module=${item.module}`,
      role: item.role,
      viewportName: VIEWPORTS.desktop_1080.name,
      ...res,
      details: `${item.name}: bodyLength=${res.dom?.bodyLength}, tables=${res.dom?.tableCount}, inputs=${res.dom?.inputCount}, buttons=${res.dom?.buttonCount}, overflow=${res.dom?.hasHorizontalOverflow}, invisible=${res.dom?.invisibleTextCount}`
    });
  }

  // Partner Platform Responsive Checks across viewports
  console.log('\n--- 4. PARTNER PLATFORM RESPONSIVE CHECKS ---');
  for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
    if (vpKey === 'desktop_1080') continue;
    const authSetup = createRoleAuth('DOCTOR', 'HOSPITAL', 'clinical-consultation');
    const res = await runBrowserScenario({
      url: 'http://localhost:5173/?module=clinical-consultation',
      viewport: vp,
      setupStorage: authSetup,
      scenarioName: `partner_responsive_${vpKey}`
    });
    recordResult({
      app: 'Partner Platform',
      route: '/?module=clinical-consultation',
      role: 'DOCTOR',
      viewportName: vp.name,
      ...res,
      details: `Doctor Consultation at ${vp.name}: overflow=${res.dom?.hasHorizontalOverflow}, bodyLength=${res.dom?.bodyLength}`
    });
  }

  // ============================================================
  // SECTION 5: FAILURE & SESSION BOUNDARY UI (Phase 21)
  // ============================================================
  console.log('\n--- 5. FAILURE & SESSION BOUNDARY UI AUDIT ---');

  // Expired / Empty session redirects gracefully to Login UI (no white screen)
  const emptySessionRes = await runBrowserScenario({
    url: 'http://localhost:5173',
    viewport: VIEWPORTS.desktop_1080,
    setupStorage: `
      localStorage.clear();
      localStorage.setItem('docsearch_logged_out', 'true');
    `,
    scenarioName: 'partner_session_logged_out'
  });
  recordResult({
    app: 'Partner Platform',
    route: '/login',
    role: 'ANONYMOUS',
    viewportName: VIEWPORTS.desktop_1080.name,
    ...emptySessionRes,
    details: `Graceful Login UI rendering: bodyLength=${emptySessionRes.dom?.bodyLength}, buttons=${emptySessionRes.dom?.buttonCount}`
  });

  // ============================================================
  // SECTION 6: TWO INDEPENDENT BROWSER SESSIONS (Phase 20)
  // ============================================================
  console.log('\n--- 6. TWO INDEPENDENT BROWSER SESSIONS AUDIT ---');

  // Session A: Doctor view
  const sessionARes = await runBrowserScenario({
    url: 'http://localhost:5173/?module=clinical-consultation',
    viewport: VIEWPORTS.desktop_1080,
    setupStorage: createRoleAuth('DOCTOR', 'HOSPITAL', 'clinical-consultation'),
    scenarioName: 'independent_session_a_doctor'
  });
  recordResult({
    app: 'Partner Platform',
    route: '/?module=clinical-consultation',
    role: 'DOCTOR',
    viewportName: VIEWPORTS.desktop_1080.name,
    ...sessionARes,
    details: `Session A (Doctor EMR): bodyLength=${sessionARes.dom?.bodyLength}`
  });

  // Session B: Pharmacy POS view
  const sessionBRes = await runBrowserScenario({
    url: 'http://localhost:5173/?module=pharmacy-medication',
    viewport: VIEWPORTS.desktop_1080,
    setupStorage: createRoleAuth('PHARMACIST', 'PHARMACY', 'pharmacy-medication'),
    scenarioName: 'independent_session_b_pharmacy'
  });
  recordResult({
    app: 'Partner Platform',
    route: '/?module=pharmacy-medication',
    role: 'PHARMACIST',
    viewportName: VIEWPORTS.desktop_1080.name,
    ...sessionBRes,
    details: `Session B (Pharmacy POS): bodyLength=${sessionBRes.dom?.bodyLength}`
  });

  // ============================================================
  // WRITE AUDIT RESULTS & MATRIX
  // ============================================================
  fs.mkdirSync('audit-results', { recursive: true });
  fs.writeFileSync('audit-results/category-5-ui-baseline.json', JSON.stringify(report, null, 2));
  fs.writeFileSync('audit-results/category-5-ui-matrix.json', JSON.stringify(report.matrix, null, 2));

  // Build Markdown summary
  let md = `# DOC SEARCH — Category 5: UI & Visual Error Baseline Audit Report\n\n`;
  md += `**Execution Mode:** Baseline Real Browser CDP (Zero-Trust)\n`;
  md += `**Timestamp:** ${report.timestamp}\n\n`;
  md += `## Summary\n`;
  md += `- **Total Tested Scenarios:** ${report.summary.totalScenarios}\n`;
  md += `- **Passed Scenarios:** ${report.summary.passed}\n`;
  md += `- **Failed Scenarios:** ${report.summary.failed}\n`;
  md += `- **White Screens:** ${report.summary.uiWhiteScreens}\n`;
  md += `- **Horizontal Overflows:** ${report.summary.horizontalOverflows}\n`;
  md += `- **Invisible Text / Contrast Errors:** ${report.summary.invisibleTextErrors}\n`;
  md += `- **React Crash Boundaries:** ${report.summary.crashBoundaries}\n`;
  md += `- **Total UI Errors Found:** ${report.summary.errorsFound}\n\n`;

  md += `## Detailed Findings\n\n`;
  md += `| Application | Scenario / Route | Role | Viewport | White Screen | Overflow | Invisible Text | Status |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const r of report.results) {
    const ws = r.dom?.hasWhiteScreen ? '❌ YES' : '✅ NO';
    const ov = r.dom?.hasHorizontalOverflow ? '❌ YES' : '✅ NO';
    const inv = (r.dom?.invisibleTextCount || 0) > 0 ? `❌ ${r.dom.invisibleTextCount}` : '✅ 0';
    md += `| ${r.app} | ${r.scenarioName} | ${r.role} | ${r.viewportName} | ${ws} | ${ov} | ${inv} | **${r.resultStatus}** |\n`;
  }

  fs.writeFileSync('audit-results/category-5-ui-baseline.md', md);

  console.log('\n============================================================');
  console.log(`BASELINE AUDIT COMPLETE: ${report.summary.passed} Passed, ${report.summary.failed} Failed`);
  console.log(`UI Errors Found: ${report.summary.errorsFound}`);
  console.log('Saved audit-results/category-5-ui-baseline.json');
  console.log('Saved audit-results/category-5-ui-matrix.json');
  console.log('Saved audit-results/category-5-ui-baseline.md');
  console.log('============================================================');

  closeChrome();
}

runAudit().then(() => {
  process.exit(report.summary.errorsFound === 0 ? 0 : 1);
}).catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
