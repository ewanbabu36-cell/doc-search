import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting DocSearch Competitive Clinical Gap & Resilience Verification Suite...\n');

let passedTests = 0;
const testQueue = [];

function test(name, fn) {
  testQueue.push({ name, fn });
}

// Gate 1: ClinicalSparkline export and rendering verification
test('Gate 1: ClinicalSparkline component exists and exports properly', () => {
  const componentPath = path.resolve('packages/ui-kit/src/components/charts/ClinicalSparkline.tsx');
  assert.ok(fs.existsSync(componentPath), 'ClinicalSparkline.tsx must exist');
  const source = fs.readFileSync(componentPath, 'utf8');
  assert.ok(source.includes('export interface ClinicalSparklineProps'), 'Must export ClinicalSparklineProps');
  assert.ok(source.includes('export const ClinicalSparkline'), 'Must export ClinicalSparkline');
  assert.ok(source.includes('<svg'), 'Must render SVG');
  assert.ok(source.includes('generateSmoothPath'), 'Must generate smooth Catmull-Rom path');

  // Verify exports in package
  const barrelPath = path.resolve('packages/ui-kit/src/components/charts/index.ts');
  const barrelSource = fs.readFileSync(barrelPath, 'utf8');
  assert.ok(barrelSource.includes("export * from './ClinicalSparkline'"), 'Charts barrel must export ClinicalSparkline');
});

// Gate 2: In-House Pharmacy Stock Service and Generic Substitutions
test('Gate 2: PharmacyStockService correctly calculates in-stock, low-stock, and out-of-stock substitutes', async () => {
  const { pharmacyStockService } = await import(
    `file://${process.cwd().replace(/\\/g, '/')}/apps/partner-platform/src/services/pharmacy-stock-service.ts`
  );

  // Paracetamol 650 (Dolo 650) is in stock
  const doloStock = pharmacyStockService.getPharmacyStock('Tab Dolo 650', 'Paracetamol');
  assert.strictEqual(doloStock.status, 'IN_STOCK');
  assert.ok(doloStock.stock > 10, 'Dolo 650 should have > 10 tabs in stock');

  // Augmentin 625 is OUT_OF_STOCK, must suggest Moxclav 625
  const augStock = pharmacyStockService.getPharmacyStock('Tab Augmentin 625', 'Amoxicillin and Clavulanate');
  assert.strictEqual(augStock.status, 'OUT_OF_STOCK');
  assert.ok(augStock.substitute !== undefined, 'Augmentin must suggest a substitute');
  assert.strictEqual(augStock.substitute.name, 'Tab Moxclav 625');
  assert.ok(augStock.substitute.stock > 0, 'Substitute must be in stock');

  // Stock update verification
  const prevStock = doloStock.stock;
  pharmacyStockService.updatePharmacyStock('Tab Dolo 650', -5);
  const updatedStock = pharmacyStockService.getPharmacyStock('Tab Dolo 650');
  assert.strictEqual(updatedStock.stock, prevStock - 5, 'Dolo 650 stock should decrement by 5');
});

// Gate 3: Standard Indian Clinic Quick-Protocols
test('Gate 3: Indian Clinic Quick Protocols defined with authentic clinical medications', () => {
  const cockpitSource = fs.readFileSync('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx', 'utf8');
  assert.ok(cockpitSource.includes('INDIAN_CLINIC_QUICK_PROTOCOLS'), 'Must export INDIAN_CLINIC_QUICK_PROTOCOLS');
  assert.ok(cockpitSource.includes('proto-viral-fever'), 'Must include Viral Fever protocol');
  assert.ok(cockpitSource.includes('proto-gerd'), 'Must include GERD protocol');
  assert.ok(cockpitSource.includes('proto-gastro'), 'Must include Acute Diarrhea protocol');
  assert.ok(cockpitSource.includes('proto-htn-refill'), 'Must include HTN protocol');
  assert.ok(cockpitSource.includes('proto-t2dm-refill'), 'Must include T2DM protocol');
  assert.ok(cockpitSource.includes('proto-peds-cold'), 'Must include Pediatric Cold protocol');
  assert.ok(cockpitSource.includes('handleLoadProtocol'), 'Must implement handleLoadProtocol handler');
});

// Gate 4: Fast Medicine Adder & Cockpit Stock Badges
test('Gate 4: Cockpit formulary dropdown renders live stock badge and out-of-stock modal', () => {
  const cockpitSource = fs.readFileSync('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx', 'utf8');
  assert.ok(cockpitSource.includes('pharmacyStockService.getPharmacyStock'), 'Must check stock on medication');
  assert.ok(cockpitSource.includes('🟢 In Stock:'), 'Must render green in-stock badge');
  assert.ok(cockpitSource.includes('🟡 Low Stock:'), 'Must render yellow low-stock badge');
  assert.ok(cockpitSource.includes('🔴 Out of Stock'), 'Must render red out-of-stock badge');
  assert.ok(cockpitSource.includes('outOfStockPrompt'), 'Must maintain outOfStockPrompt state');
  assert.ok(cockpitSource.includes('In-House Pharmacy Stock-Out Alert'), 'Must render stock-out modal');
  assert.ok(cockpitSource.includes('RECOMMENDED IN-STOCK COUNTER SUBSTITUTE'), 'Must offer recommended substitute');
});

// Gate 5: Longitudinal Vitals Sparklines in Cockpit
test('Gate 5: Cockpit calculates longitudinal sparklines for BP, Glucose, Weight, and HbA1c', () => {
  const cockpitSource = fs.readFileSync('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx', 'utf8');
  assert.ok(cockpitSource.includes('sparklineVitals'), 'Must compute sparklineVitals useMemo');
  assert.ok(cockpitSource.includes('bpSysData'), 'Must track bpSysData array');
  assert.ok(cockpitSource.includes('sugarData'), 'Must track sugarData array');
  assert.ok(cockpitSource.includes('weightData'), 'Must track weightData array');
  assert.ok(cockpitSource.includes('hba1cData'), 'Must track hba1cData array');
  assert.ok(cockpitSource.includes('LONGITUDINAL CLINICAL TRAJECTORY & CHRONIC SPARKLINES'), 'Must render sparklines tray header');
  assert.ok(cockpitSource.includes('<ClinicalSparkline'), 'Must render ClinicalSparkline components');
});

// Gate 6: Front Desk Automated Google Review Reputation Engine
test('Gate 6: FrontDeskWorkstationView integrates Google Review auto-engine on PRESCRIPTION_ISSUED', () => {
  const frontDeskSource = fs.readFileSync('apps/partner-platform/src/components/views/FrontDeskWorkstationView.tsx', 'utf8');
  assert.ok(frontDeskSource.includes('clinicGoogleReviewUrl'), 'Must maintain clinicGoogleReviewUrl state');
  assert.ok(frontDeskSource.includes('autoGoogleReviewEnabled'), 'Must maintain autoGoogleReviewEnabled state');
  assert.ok(frontDeskSource.includes('googleReviewModalData'), 'Must maintain googleReviewModalData state');
  assert.ok(frontDeskSource.includes('PRESCRIPTION_ISSUED'), 'Must listen to PRESCRIPTION_ISSUED');
  assert.ok(frontDeskSource.includes('Please take 10 seconds to share your experience on our Google Business page'), 'Must format Google review request message');
  assert.ok(frontDeskSource.includes('Clinic Google Business Reputation Engine'), 'Must render review settings modal');
  assert.ok(frontDeskSource.includes('Send WhatsApp Review Link'), 'Must provide 1-click WhatsApp review link');
});

// Gate 7: Regional Prescription Translator Regression
test('Gate 7: Regional translator produces correct Indic and Romanized strings', async () => {
  const { translateDosageInstructions } = await import(
    `file://${process.cwd().replace(/\\/g, '/')}/apps/partner-platform/src/utils/regional-prescription-translator.ts`
  );

  const hi = translateDosageInstructions({
    frequency: '1-0-1',
    timing: 'AFTER_FOOD',
    duration: 5,
    lang: 'HI'
  });
  assert.ok(hi.nativeScript.includes('खाने के बाद'), 'Hindi native script must include खाने के बाद');
  assert.ok(hi.romanized.includes('Khane ke baad'), 'Hindi romanized must include Khane ke baad');

  const bn = translateDosageInstructions({
    frequency: '1-0-0',
    timing: 'BEFORE_FOOD',
    duration: 7,
    lang: 'BN'
  });
  assert.ok(bn.nativeScript.includes('খাওয়ার আগে'), 'Bengali native script must include খাওয়ার আগে');
  assert.ok(bn.romanized.toLowerCase().includes('aage'), 'Bengali romanized must include aage');

  const ta = translateDosageInstructions({
    frequency: '1-1-1',
    timing: 'AFTER_FOOD',
    duration: 3,
    lang: 'TA'
  });
  assert.ok(ta.nativeScript.includes('உணவுக்குப் பின்'), 'Tamil native script must include உணவுக்குப் பின்');
});

// Gate 8: Doctor Custom Quick-Protocols Saving and Loading
test('Gate 8: Cockpit provides custom protocol saving, storage, and 1-click combo bar', () => {
  const cockpitSource = fs.readFileSync('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx', 'utf8');
  assert.ok(cockpitSource.includes('docsearch_custom_doctor_protocols'), 'Must persist custom protocols in localStorage');
  assert.ok(cockpitSource.includes('customProtocols'), 'Must maintain customProtocols state');
  assert.ok(cockpitSource.includes('isCustomProtoModalOpen'), 'Must maintain isCustomProtoModalOpen state');
  assert.ok(cockpitSource.includes('handleSaveCurrentAsProtocol'), 'Must implement handleSaveCurrentAsProtocol handler');
  assert.ok(cockpitSource.includes('handleDeleteCustomProtocol'), 'Must implement handleDeleteCustomProtocol handler');
  assert.ok(cockpitSource.includes('Custom Combo'), 'Must render Custom Combo button');
  assert.ok(cockpitSource.includes('Save As 1-Click Quick Combo'), 'Must render custom combo modal dialog');
});

// Gate 9: Zero-Crash React.Suspense & Concurrent Transition Safety
test('Gate 9: Partner Platform enforces 100% Suspense coverage and startTransition concurrency', () => {
  // Check main.tsx root boundary
  const mainSource = fs.readFileSync('apps/partner-platform/src/main.tsx', 'utf8');
  assert.ok(mainSource.includes('<React.Suspense'), 'main.tsx must wrap App with root React.Suspense boundary');
  assert.ok(mainSource.includes('React.startTransition'), 'main.tsx must wrap login and staff-switch in startTransition');

  // Check PartnerPlatformShell.tsx for 0 Suspense depth violations across all lazy components
  const shellSource = fs.readFileSync('apps/partner-platform/src/components/PartnerPlatformShell.tsx', 'utf8');
  const lines = shellSource.split('\n');
  const lazyMatches = [...shellSource.matchAll(/const\s+([A-Za-z0-9_]+)\s*=\s*React\.lazy/g)].map(m => m[1]);
  assert.ok(lazyMatches.length >= 60, 'Must track all code-split lazy modules');

  for (const comp of lazyMatches) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<' + comp)) {
        let depth = 0;
        for (let j = 0; j <= i; j++) {
          if (lines[j].includes('<React.Suspense') || lines[j].includes('<Suspense')) depth++;
          if (lines[j].includes('</React.Suspense>') || lines[j].includes('</Suspense>')) depth--;
        }
        assert.ok(depth > 0, `Component <${comp}> at line ${i + 1} must be inside a React.Suspense boundary`);
      }
    }
  }

  // Profile update guard modal must be conditionally rendered
  assert.ok(shellSource.includes('{isProfileGuardAlertOpen && ('), 'ProfileUpdateRequiredAlertModal must be conditionally rendered');
});

async function run() {
  for (const { name, fn } of testQueue) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✕ ${name}`);
      console.error(`    ${err.message}`);
      process.exit(1);
    }
  }
  console.log(`\n🎉 All ${passedTests}/${testQueue.length} verification gates PASSED cleanly!`);
}

run();
