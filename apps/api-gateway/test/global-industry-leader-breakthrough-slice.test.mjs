import test from 'node:test';
import assert from 'node:assert/strict';

import { sepsisDeteriorationSentinelService } from '../dist/services/clinical/SepsisDeteriorationSentinelService.js';
import { antibiogramCdssService } from '../dist/services/clinical/AntibiogramCdssService.js';
import { chronicRefillPredictorService } from '../dist/services/patient/ChronicRefillPredictorService.js';
import { platformRevenueWaterfallService } from '../dist/services/finance/PlatformRevenueWaterfallService.js';

test('🌟 BREAKTHROUGH 1: Autonomous Sepsis & Clinical Deterioration Sentinel (qSOFA + PEWS)', async (t) => {
  await t.test('calculates adult qSOFA and triggers critical 1-hour bundle when score >= 2', () => {
    const result = sepsisDeteriorationSentinelService.evaluatePatientRisk({
      patientId: 'PT-ADULT-101',
      uhid: 'UHID-2026-9901',
      ageYears: 62,
      isPediatric: false,
      bedId: 'ICU-BED-02',
      vitals: {
        systolicBp: 92, // <= 100 (+1)
        diastolicBp: 56,
        respiratoryRate: 26, // >= 22 (+1)
        pulseBpm: 114,
        oxygenSaturationPercent: 92,
        temperatureCelsius: 39.2,
        alteredMentation: true, // (+1)
        gcsScore: 13
      },
      lactateMmolL: 3.4,
      presumedInfectionSource: 'Community Acquired Pneumonia'
    });

    assert.equal(result.scoreType, 'qSOFA');
    assert.equal(result.scoreValue, 3, 'Adult qSOFA must calculate 3 points');
    assert.equal(result.alertLevel, 'CRITICAL_SEPSIS_CODE');
    assert.equal(result.deteriorationTrend, 'DETERIORATING');
    assert.equal(result.oneHourBundle.length, 5, 'Surviving Sepsis Campaign 1-Hour bundle must contain 5 checklist items');

    const lactateStep = result.oneHourBundle.find((b) => b.id === 'BUNDLE_LACTATE');
    assert.ok(lactateStep, 'Must include lactate measurement step');
    assert.equal(lactateStep.isCompleted, true, 'Lactate >= 3.4 marks step evaluated');
  });

  await t.test('calculates pediatric PEWS scoring with multi-system deterioration triggers', () => {
    const pedsResult = sepsisDeteriorationSentinelService.evaluatePatientRisk({
      patientId: 'PT-PEDS-202',
      uhid: 'UHID-2026-P01',
      ageYears: 4,
      isPediatric: true,
      vitals: {
        systolicBp: 82,
        diastolicBp: 48,
        respiratoryRate: 46, // >= 40 (+2)
        pulseBpm: 155, // >= 140 (+2)
        oxygenSaturationPercent: 92,
        temperatureCelsius: 39.6,
        gcsScore: 13 // (+2)
      }
    });

    assert.equal(pedsResult.scoreType, 'PEWS');
    assert.ok(pedsResult.scoreValue >= 4, `PEWS must flag severe risk for high tachypnea and tachycardia: ${pedsResult.scoreValue}`);
    assert.equal(pedsResult.alertLevel, 'CRITICAL_SEPSIS_CODE');
  });
});

test('🌟 BREAKTHROUGH 2: Closed-Loop Hospital Antibiogram CDSS Engine', async (t) => {
  await t.test('evaluates institutional resistance and flags high-risk empiric antibiotic failure', () => {
    const evaluation = antibiogramCdssService.evaluatePrescription({
      facilityId: 'default-facility',
      prescribedDrugName: 'Ciprofloxacin 500mg'
    });

    assert.ok(evaluation.facilityResistanceRate >= 70, 'Ciprofloxacin resistance in E. coli must exceed 70%');
    assert.equal(evaluation.alertSeverity, 'CRITICAL_RESISTANCE_WARNING');
    assert.ok(evaluation.recommendedAlternatives.length > 0, 'Must recommend high-sensitivity hospital alternatives');

    const amikacinAlt = evaluation.recommendedAlternatives.find((a) => a.drugName.includes('Amikacin'));
    assert.ok(amikacinAlt, 'Must suggest Amikacin alternative');
    assert.ok(amikacinAlt.sensitivityRate >= 80, 'Alternative must offer >80% sensitivity');
  });

  await t.test('approves compliant narrow-spectrum agents with low facility resistance', () => {
    const safeEval = antibiogramCdssService.evaluatePrescription({
      facilityId: 'default-facility',
      prescribedDrugName: 'Nitrofurantoin'
    });

    assert.ok(safeEval.facilitySensitivityRate >= 90, 'Nitrofurantoin must retain >90% sensitivity in E. coli');
    assert.equal(safeEval.alertSeverity, 'SAFE');
  });
});

test('🌟 BREAKTHROUGH 3: 1-Tap Chronic Dawa Smart-Refill Flywheel & Household Health Scorecard', async (t) => {
  await t.test('identifies chronic medicine stock exhaustion and formulates discounted 1-tap reorder', () => {
    const status = chronicRefillPredictorService.getChronicRefillStatus('PT-USER-778');

    assert.equal(status.isRefillDue, true, 'Exhaustion <= 4 days must trigger refill due');
    assert.ok(status.activeChronicMeds.length >= 3, 'Must track multi-condition chronic therapy');
    assert.ok(status.netPayableInr < status.subtotalInr, 'Must include chronic patient recurring discount');

    const order = chronicRefillPredictorService.createRefillOrder({
      patientId: 'PT-USER-778',
      medicationNames: status.activeChronicMeds.map((m) => m.medicationName),
      deliveryAddress: status.defaultDeliveryAddress,
      paymentMethod: 'UPI_INSTANT'
    });

    assert.equal(order.status, 'CONFIRMED');
    assert.ok(order.orderId.startsWith('CR-ORD-'));
    assert.equal(order.whatsappConfirmationSent, true);
  });

  await t.test('computes composite household wellness index (0-100) across family members', () => {
    const scorecard = chronicRefillPredictorService.getHouseholdHealthScore('HH-9921');

    assert.equal(scorecard.tier, 'ELITE_HEALTH_FAMILY');
    assert.ok(scorecard.overallScore >= 80, 'Scorecard must calculate comprehensive compliance score');
    assert.equal(scorecard.members.length, 3, 'Must track 3 household family members');
    assert.ok(scorecard.breakdown.medicationAdherencePoints > 0);
  });
});

test('🌟 BREAKTHROUGH 4: Stripe Connect Gross-to-Net Revenue Take-Rate Waterfall & Section 194O Ledger', async (t) => {
  await t.test('calculates Gross-to-Net revenue waterfall across IPD, OPD, Pharmacy and Labs', () => {
    const waterfall = platformRevenueWaterfallService.getRevenueWaterfall();

    assert.ok(waterfall.totalGrossGmvInr > 9000000, 'Gross GMV must exceed 90 Lakhs');
    assert.ok(waterfall.platformNetRevenueInr > 0, 'Platform take rate must be positive');
    assert.ok(waterfall.deductions.tdsSection194OInr > 0, 'Section 194O 1% TDS must be deducted');
    assert.equal(waterfall.complianceStatus, '100% SECTION 194O COMPLIANT');
    assert.equal(waterfall.streams.length, 4, 'Must break down 4 distinct GMV streams');
  });

  await t.test('generates electronic Form 26Q and GSTR-1 compliant partner ledgers', () => {
    const ledger = platformRevenueWaterfallService.getTdsGstr1Ledger();

    assert.ok(ledger.length >= 3, 'Must contain partner settlement records');
    for (const record of ledger) {
      assert.ok(record.pan && record.pan.length === 10, 'Valid 10-char PAN required for Section 194O');
      assert.ok(record.gstin && record.gstin.length === 15, 'Valid 15-char GSTIN required for GSTR-1');
      assert.equal(record.tdsDeductedInr, Math.round(record.grossTransactionValueInr * 0.01), 'TDS must equal 1% of gross');
    }
  });
});
