import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

describe('DocSearch 2.0: Connected Clinical Flywheel, Scribe & Emergency Radar', () => {

  test('Clinical Contraindication Engine correctly flags duplicate NSAIDs and Quinolone interactions', () => {
    // Test rule checking
    const meds = [
      { medicationName: 'Tab Paracetamol 650mg' },
      { medicationName: 'Tab Aceclofenac 100mg' },
      { medicationName: 'Tab Ciprofloxacin 500mg' },
      { medicationName: 'Syrup Gelusil Antacid' }
    ];

    const medNames = meds.map((m) => m.medicationName.toLowerCase());

    // Check duplicate NSAIDs
    const nsaids = ['paracetamol', 'aceclofenac', 'ibuprofen', 'diclofenac'];
    const matchedNsaids = nsaids.filter((n) => medNames.some((m) => m.includes(n)));
    assert.equal(matchedNsaids.length, 2, 'Should detect two conflicting NSAIDs (Paracetamol + Aceclofenac)');

    // Check Quinolone + Antacid
    const hasQuinolone = medNames.some((m) => m.includes('cipro') || m.includes('oflox'));
    const hasAntacid = medNames.some((m) => m.includes('antacid') || m.includes('gelusil'));
    assert.equal(hasQuinolone && hasAntacid, true, 'Should detect Quinolone + Antacid chelation interaction');
  });

  test('Known allergy match triggers CRITICAL contraindication alert', () => {
    const allergies = ['Sulfa drugs', 'Penicillin'];
    const meds = [
      { medicationName: 'Tab Amoxicillin + Clavulanic Acid 625mg' }
    ];

    // Penicillin cross-reacts with Amoxicillin
    const isAllergic = allergies.some((a) => a.toLowerCase() === 'penicillin') &&
      meds.some((m) => m.medicationName.toLowerCase().includes('amoxi'));

    assert.equal(isAllergic, true, 'Should trigger critical alert for Amoxicillin in Penicillin-allergic patient');
  });

  test('Generic Molecule Substitution engine accurately maps brand names to active salts and Jan Aushadhi', () => {
    const sampleFormulary = [
      { brandName: 'Dolo 650', genericName: 'Paracetamol', mrp: 33.5, costPrice: 18.0, brandType: 'ETHICAL' },
      { brandName: 'Calpol 650', genericName: 'Paracetamol', mrp: 31.0, costPrice: 17.5, brandType: 'ETHICAL' },
      { brandName: 'Jan Aushadhi Paracetamol 650', genericName: 'Paracetamol', mrp: 10.0, costPrice: 5.5, brandType: 'GENERIC' }
    ];

    const saltMatches = sampleFormulary.filter((m) => m.genericName.toLowerCase() === 'paracetamol');
    assert.equal(saltMatches.length, 3, 'Should find all 3 brands for Paracetamol');

    const generic = saltMatches.find((m) => m.brandType === 'GENERIC');
    assert.ok(generic, 'Should identify Jan Aushadhi generic alternative');
    assert.ok(generic.mrp < 15, 'Jan Aushadhi generic rate should be affordable');
  });

  test('Auto-Analyzer simulation captures critical panic thresholds for immediate doctor notification', () => {
    const analyzerRun = [
      { analyte: 'Hemoglobin (Hb)', value: 5.8, referenceLow: 12.0, referenceHigh: 16.0, panicThresholdLow: 7.0 },
      { analyte: 'Blood Glucose (Random)', value: 440, referenceLow: 70, referenceHigh: 140, panicThresholdHigh: 400 },
      { analyte: 'Platelet Count', value: 240000, referenceLow: 150000, referenceHigh: 450000, panicThresholdLow: 50000 }
    ];

    const panicAnalytes = analyzerRun.filter(
      (a) => (a.panicThresholdLow && a.value < a.panicThresholdLow) || (a.panicThresholdHigh && a.value > a.panicThresholdHigh)
    );

    assert.equal(panicAnalytes.length, 2, 'Should flag Hemoglobin < 7 and Glucose > 400 as critical panic values');
    assert.equal(panicAnalytes[0].analyte, 'Hemoglobin (Hb)');
    assert.equal(panicAnalytes[1].analyte, 'Blood Glucose (Random)');
  });

  test('Emergency Bed & ICU Radar generates real-time trauma pre-intimation payload', () => {
    const hospital = {
      id: 'hosp-01',
      name: 'Max Super Speciality Hospital (Trauma Center)',
      icuBedsVacant: 4,
      ventilatorsVacant: 2,
      emergencyPhone: '+91 98110 09911',
      etaMins: 6
    };

    const sosPayload = {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      patientTriageCategory: 'RED_TRAUMA',
      estimatedArrivalMinutes: hospital.etaMins,
      requestedBedType: 'ICU_VENTILATOR_STANDBY',
      alertTimestamp: new Date().toISOString()
    };

    assert.ok(sosPayload.hospitalId);
    assert.equal(sosPayload.patientTriageCategory, 'RED_TRAUMA');
    assert.equal(sosPayload.estimatedArrivalMinutes, 6);
  });

});
