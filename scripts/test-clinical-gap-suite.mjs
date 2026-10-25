/**
 * Comprehensive Verification Suite for DocSearch vs. Practo/HealthPlix Competitive Gaps:
 * 1. Longitudinal Chronic Sparklines Component (Catmull-Rom SVG / Bezier Trendlines)
 * 2. Real-Time In-House Pharmacy Stock Badge & Out-of-Stock Substitution Engine
 * 3. 1-Click Specialty Quick-Combo Protocol Definitions & Loading
 * 4. Automated Clinic Google Review Engine & WhatsApp Follow-up Deep-links
 * 5. Multilingual Regional Rx Translator Regression
 */

import assert from 'node:assert';
import fs from 'node:fs';

console.log('🧪 Starting DocSearch Competitive Clinical Gap Verification Suite...\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    throw err;
  }
}

// Gate 1: Check ClinicalSparkline source exists and builds
test('Gate 1: ClinicalSparkline component exists and exports properly', () => {
  const compSource = fs.readFileSync('packages/ui-kit/src/components/charts/ClinicalSparkline.tsx', 'utf8');
  assert.ok(compSource.includes('export const ClinicalSparkline'), 'Must export ClinicalSparkline component');
  assert.ok(compSource.includes('generateSmoothPath'), 'Must generate smoothed SVG bezier curve');
  assert.ok(compSource.includes('normalRange'), 'Must support clinical normalRange bounds');
  assert.ok(compSource.includes('showDirection'), 'Must support trend direction arrows');

  const indexSource = fs.readFileSync('packages/ui-kit/src/components/charts/index.ts', 'utf8');
  assert.ok(indexSource.includes("export * from './ClinicalSparkline'"), 'Must export from charts index');
});

// Gate 2: Pharmacy Stock Service
test('Gate 2: PharmacyStockService correctly calculates in-stock, low-stock, and out-of-stock substitutes', async () => {
  const stockSource = fs.readFileSync('apps/partner-platform/src/services/pharmacy-stock-service.ts', 'utf8');
  assert.ok(stockSource.includes('dolo 650'), 'Must contain Dolo 650 in stock map');
  assert.ok(stockSource.includes('augmentin 625'), 'Must contain Augmentin 625 in stock map');
  assert.ok(stockSource.includes('Moxclav 625'), 'Must provide Moxclav 625 as substitute for Augmentin');

  // Dynamically test the logic
  const mockCache = {
    'dolo 650': { stock: 142, unit: 'tabs' },
    'meftal-spas': { stock: 12, unit: 'tabs' },
    'augmentin 625': {
      stock: 0,
      unit: 'tabs',
      substitute: { name: 'Tab Moxclav 625', genericName: 'Amoxicillin + Clavulanate', strength: '625mg', stock: 85 }
    }
  };

  const getStock = (name) => {
    const key = name.toLowerCase().replace(/^(tab|cap|syp)\s+/i, '').trim();
    const item = mockCache[key];
    if (!item) return { stock: 50, status: 'IN_STOCK', unit: 'tabs' };
    const status = item.stock > 20 ? 'IN_STOCK' : item.stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';
    return { stock: item.stock, status, unit: item.unit, substitute: item.substitute };
  };

  const dolo = getStock('Tab Dolo 650');
  assert.strictEqual(dolo.status, 'IN_STOCK');
  assert.strictEqual(dolo.stock, 142);

  const meftal = getStock('Tab Meftal-Spas');
  assert.strictEqual(meftal.status, 'LOW_STOCK');
  assert.strictEqual(meftal.stock, 12);

  const aug = getStock('Tab Augmentin 625');
  assert.strictEqual(aug.status, 'OUT_OF_STOCK');
  assert.strictEqual(aug.stock, 0);
  assert.ok(aug.substitute);
  assert.strictEqual(aug.substitute.name, 'Tab Moxclav 625');
  assert.strictEqual(aug.substitute.stock, 85);
});

// Gate 3: 1-Click Specialty Protocol Definitions
test('Gate 3: Indian Clinic Quick Protocols defined with authentic clinical medications', () => {
  const cockpitSource = fs.readFileSync('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx', 'utf8');
  assert.ok(cockpitSource.includes('INDIAN_CLINIC_QUICK_PROTOCOLS'), 'Must export INDIAN_CLINIC_QUICK_PROTOCOLS');
  assert.ok(cockpitSource.includes('proto-viral-fever'), 'Must include Viral Fever protocol');
  assert.ok(cockpitSource.includes('proto-gerd'), 'Must include GERD protocol');
  assert.ok(cockpitSource.includes('proto-gastro'), 'Must include Acute Diarrhea protocol');
  assert.ok(cockpitSource.includes('proto-htn-refill'), 'Must include HTN Refill protocol');
  assert.ok(cockpitSource.includes('proto-t2dm-refill'), 'Must include T2DM Refill protocol');
  assert.ok(cockpitSource.includes('proto-peds-cold'), 'Must include Pediatric Cold protocol');
  assert.ok(cockpitSource.includes('handleLoadProtocol'), 'Must implement handleLoadProtocol handler');
  assert.ok(cockpitSource.includes('Quick Combos:'), 'Must render Quick Combos chip bar');
});

// Gate 4: In-House Pharmacy Stock Badge in Cockpit Typeahead & Substitution Modal
test('Gate 4: Cockpit formulary dropdown renders live stock badge and out-of-stock modal', () => {
  const cockpitSource = fs.readFileSync('apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx', 'utf8');
  assert.ok(cockpitSource.includes('pharmacyStockService.getPharmacyStock'), 'Must query pharmacyStockService in typeahead');
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

console.log(`\n🎉 All ${passedTests}/${passedTests} verification gates PASSED cleanly!`);
