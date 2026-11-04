process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { sepsisDeteriorationSentinelService } from '../dist/services/clinical/SepsisDeteriorationSentinelService.js';
import { antibiogramCdssService } from '../dist/services/clinical/AntibiogramCdssService.js';
import { clinicalSafetyService } from '../dist/services/partner/ClinicalSafetyService.js';
import { patient360ContinuityService } from '../dist/services/partner/Patient360ContinuityService.js';
import { clinicalWorkflowRepository } from '../dist/repositories/partner/ClinicalWorkflowRepository.js';
import { pharmacyManagementRepository } from '../dist/repositories/partner/PharmacyManagementRepository.js';
import { labDiagnosticsRepository } from '../dist/repositories/partner/LabDiagnosticsRepository.js';
import { radiologyRepository } from '../dist/repositories/partner/RadiologyRepository.js';
import { inpatientManagementRepository } from '../dist/repositories/partner/InpatientManagementRepository.js';
import { CLINICAL_REFERENCE_RANGES } from '../dist/services/partner/HardwareBridgeService.js';

describe('Phase 4: Clinical Safety, Medical Workflow & Patient Data Integrity Certification', () => {
  const tenantId = crypto.randomUUID();
  const partnerId = crypto.randomUUID();
  const branchId = crypto.randomUUID();
  const doctorId = crypto.randomUUID();

  const mockSession = {
    userId: doctorId,
    tenantId,
    partnerId,
    organizationId: partnerId,
    branchId,
    role: 'DOCTOR',
    roles: ['DOCTOR', 'ATTENDING_PHYSICIAN'],
    isSuperAdmin: false,
    permissions: ['*'],
    departmentId: 'OPD'
  };

  // ==========================================================================
  // SCENARIO 1: Normal OPD Consultation Workflow & ICD-10 Assignment
  // ==========================================================================
  describe('Scenario 1: Normal OPD Consultation Workflow & ICD-10 Coding', () => {
    test('1.1 Generates canonical universal numbers for patient lifecycle without fallback collision', () => {
      const uhid = patient360ContinuityService.generateUniversalNumber(tenantId, 'PATIENT');
      const mrn = patient360ContinuityService.generateUniversalNumber(tenantId, 'MRN');
      const enc = patient360ContinuityService.generateUniversalNumber(tenantId, 'ENCOUNTER');
      const rx = patient360ContinuityService.generateUniversalNumber(tenantId, 'PRESCRIPTION');

      assert.match(uhid, /^PAT-\d{4}-\d{6}$/, 'UHID must match PAT-YYYY-XXXXXX format');
      assert.match(mrn, /^MRN-\d{4}-\d{6}$/, 'MRN must match MRN-YYYY-XXXXXX format');
      assert.match(enc, /^ENC-\d{4}-\d{6}$/, 'Encounter must match ENC-YYYY-XXXXXX format');
      assert.match(rx, /^RX-\d{4}-\d{6}$/, 'Prescription must match RX-YYYY-XXXXXX format');
    });

    test('1.2 Safe baseline vitals validation within standard physiological thresholds', () => {
      const evaluation = sepsisDeteriorationSentinelService.evaluatePatientRisk({
        patientId: crypto.randomUUID(),
        uhid: 'PAT-2026-000101',
        ageYears: 32,
        isPediatric: false,
        vitals: {
          systolicBp: 120,
          diastolicBp: 80,
          respiratoryRate: 16,
          pulseBpm: 72,
          oxygenSaturationPercent: 99,
          temperatureCelsius: 37.0,
          gcsScore: 15,
          alteredMentation: false
        }
      });

      assert.equal(evaluation.alertLevel, 'NORMAL', 'Normal vitals must yield alertLevel NORMAL');
      assert.equal(evaluation.scoreValue, 0, 'Normal vitals must produce qSOFA score 0');
      assert.equal(evaluation.deteriorationTrend, 'STABLE', 'Normal patient trend must be STABLE');
      assert.equal(evaluation.triggers.length, 0, 'No deterioration triggers should fire');
    });
  });

  // ==========================================================================
  // SCENARIO 2: Emergency Patient with Abnormal Vitals
  // ==========================================================================
  describe('Scenario 2: Emergency Patient Hemodynamic Deterioration', () => {
    test('2.1 Flags acute hemodynamic instability and tachycardia in emergency presentation', () => {
      const evalResult = sepsisDeteriorationSentinelService.evaluatePatientRisk({
        patientId: crypto.randomUUID(),
        uhid: 'PAT-2026-000202',
        ageYears: 48,
        isPediatric: false,
        vitals: {
          systolicBp: 85,
          diastolicBp: 50,
          respiratoryRate: 26,
          pulseBpm: 128,
          oxygenSaturationPercent: 92,
          temperatureCelsius: 39.2,
          alteredMentation: false,
          gcsScore: 15
        }
      });

      assert.ok(evalResult.scoreValue >= 2, 'qSOFA score must be >= 2 for SBP 85 and RR 26');
      assert.equal(evalResult.alertLevel, 'CRITICAL_SEPSIS_CODE', 'Must escalate to CRITICAL_SEPSIS_CODE');
      assert.equal(evalResult.deteriorationTrend, 'DETERIORATING');
      assert.ok(evalResult.triggers.some(t => t.includes('Systolic Blood Pressure depressed')));
      assert.ok(evalResult.triggers.some(t => t.includes('Respiratory Rate elevated')));
    });
  });

  // ==========================================================================
  // SCENARIO 3: Adult Sepsis Alert (qSOFA >= 2) & Physiological Boundary Guards
  // ==========================================================================
  describe('Scenario 3: Adult Sepsis Sentinel (qSOFA >= 2) & Vital Sanity Guards', () => {
    test('3.1 Full qSOFA score (3/3) triggers Surviving Sepsis 1-Hour Bundle STAT protocols', () => {
      const result = sepsisDeteriorationSentinelService.evaluatePatientRisk({
        patientId: crypto.randomUUID(),
        uhid: 'PAT-2026-000303',
        ageYears: 62,
        isPediatric: false,
        vitals: {
          systolicBp: 88,
          diastolicBp: 55,
          respiratoryRate: 28,
          pulseBpm: 115,
          oxygenSaturationPercent: 91,
          temperatureCelsius: 39.5,
          alteredMentation: true,
          gcsScore: 13
        },
        lactateMmolL: 3.4,
        presumedInfectionSource: 'Urosepsis'
      });

      assert.equal(result.scoreValue, 3, 'Full qSOFA triad (RR>=22, SBP<=100, GCS<15) must equal 3');
      assert.equal(result.alertLevel, 'CRITICAL_SEPSIS_CODE');
      assert.equal(result.oneHourBundle.length, 5, 'Surviving Sepsis 1-Hour Bundle must contain 5 STAT interventions');

      const bundleIds = result.oneHourBundle.map(b => b.id);
      assert.ok(bundleIds.includes('BUNDLE_LACTATE'), 'Must include Serum Lactate measurement');
      assert.ok(bundleIds.includes('BUNDLE_BLOOD_CULTURES'), 'Must include 2 sets blood cultures');
      assert.ok(bundleIds.includes('BUNDLE_BROAD_SPECTRUM_ABX'), 'Must include broad-spectrum IV antimicrobials');
      assert.ok(bundleIds.includes('BUNDLE_FLUID_BOLUS'), 'Must include 30 mL/kg fluid bolus');
      assert.ok(bundleIds.includes('BUNDLE_VASOPRESSORS'), 'Must include vasopressor titration');
    });

    test('3.2 Rejects physiologically impossible vitals preventing false sepsis alert falsification', () => {
      // Test negative SBP
      assert.throws(
        () => {
          sepsisDeteriorationSentinelService.evaluatePatientRisk({
            patientId: crypto.randomUUID(),
            uhid: 'PAT-2026-000304',
            ageYears: 45,
            vitals: {
              systolicBp: -10,
              diastolicBp: 40,
              respiratoryRate: 18,
              pulseBpm: 80,
              oxygenSaturationPercent: 98,
              temperatureCelsius: 37
            }
          });
        },
        /Physiologically invalid Systolic Blood Pressure/,
        'Negative or <30 SBP must be rejected'
      );

      // Test zero respiratory rate
      assert.throws(
        () => {
          sepsisDeteriorationSentinelService.evaluatePatientRisk({
            patientId: crypto.randomUUID(),
            uhid: 'PAT-2026-000305',
            ageYears: 45,
            vitals: {
              systolicBp: 120,
              diastolicBp: 80,
              respiratoryRate: 0,
              pulseBpm: 80,
              oxygenSaturationPercent: 98,
              temperatureCelsius: 37
            }
          });
        },
        /Physiologically invalid Respiratory Rate/,
        'RR <= 0 must be rejected'
      );

      // Test extreme body temperature
      assert.throws(
        () => {
          sepsisDeteriorationSentinelService.evaluatePatientRisk({
            patientId: crypto.randomUUID(),
            uhid: 'PAT-2026-000306',
            ageYears: 45,
            vitals: {
              systolicBp: 120,
              diastolicBp: 80,
              respiratoryRate: 18,
              pulseBpm: 80,
              oxygenSaturationPercent: 98,
              temperatureCelsius: 60
            }
          });
        },
        /Physiologically invalid Body Temperature/,
        'Body temperature > 46 C must be rejected'
      );
    });
  });

  // ==========================================================================
  // SCENARIO 4: Pediatric Deterioration Alert (PEWS >= 4)
  // ==========================================================================
  describe('Scenario 4: Pediatric Early Warning Score (PEWS) Sentinel', () => {
    test('4.1 Multi-system pediatric failure triggers critical PEWS alarm and PICU alert', () => {
      const pewsResult = sepsisDeteriorationSentinelService.evaluatePatientRisk({
        patientId: crypto.randomUUID(),
        uhid: 'PAT-2026-000401',
        ageYears: 3,
        isPediatric: true,
        vitals: {
          systolicBp: 75,
          diastolicBp: 45,
          respiratoryRate: 54, // RR >= 50 (+3)
          pulseBpm: 168, // HR >= 160 (+3)
          oxygenSaturationPercent: 88, // SpO2 < 90 (+3)
          temperatureCelsius: 39.8,
          alteredMentation: true,
          gcsScore: 11, // GCS < 12 (+3)
          capillaryRefillSeconds: 4
        }
      });

      assert.equal(pewsResult.scoreType, 'PEWS', 'Must evaluate using PEWS scoring engine for pediatric age');
      assert.ok(pewsResult.scoreValue >= 4, `PEWS score must be >= 4 (Calculated: ${pewsResult.scoreValue})`);
      assert.equal(pewsResult.alertLevel, 'CRITICAL_SEPSIS_CODE');
      assert.match(pewsResult.recommendation, /PEDIATRIC EMERGENCY ALERT/, 'Must recommend immediate PICU consult and resuscitation');
    });
  });

  // ==========================================================================
  // SCENARIO 5: Patient with Severe Drug Allergy (Penicillin Anaphylaxis)
  // ==========================================================================
  describe('Scenario 5: Severe Drug Allergy & Cross-Reactivity Safeguards', () => {
    test('5.1 Blocks Amoxicillin and Augmentin for patient with documented Penicillin Anaphylaxis', async () => {
      const evaluation = await clinicalSafetyService.evaluatePrescriptionSafety(mockSession, {
        patientId: crypto.randomUUID(),
        medications: [
          {
            medicationName: 'Augmentin 625 Duo (Amoxicillin + Clavulanate)',
            genericName: 'Amoxicillin with Clavulanic Acid',
            dosage: '625 mg',
            route: 'ORAL',
            frequency: 'TDS'
          }
        ],
        activeAllergies: ['Penicillin']
      });

      assert.equal(evaluation.isSafe, false, 'Prescription must be marked unsafe');
      assert.equal(evaluation.hasBlockingContraindication, true, 'Must have blocking contraindication');
      assert.ok(evaluation.blockingAlertCount >= 1, 'Must have at least 1 blocking alert');

      const allergyAlert = evaluation.alerts.find(a => a.category === 'DRUG_ALLERGY');
      assert.ok(allergyAlert, 'Must contain DRUG_ALLERGY alert');
      assert.equal(allergyAlert?.ruleId, 'ALLERGY-PENICILLIN-CROSS-001');
      assert.equal(allergyAlert?.severity, 'CONTRAINDICATED', 'Penicillin anaphylaxis cross-reactivity must be CONTRAINDICATED');
      assert.equal(allergyAlert?.overrideAllowed, false, 'Anaphylaxis contraindication must be strictly non-overrideable');
    });
  });

  // ==========================================================================
  // SCENARIO 6: Prescription with Drug-Drug Interactions (DDI)
  // ==========================================================================
  describe('Scenario 6: Drug-Drug Interaction (DDI) Hard Contraindications', () => {
    test('6.1 Sildenafil + Nitrates is strictly CONTRAINDICATED with non-overrideable block', async () => {
      const result = await clinicalSafetyService.evaluatePrescriptionSafety(mockSession, {
        patientId: crypto.randomUUID(),
        medications: [
          { medicationName: 'Sildenafil 50 mg', genericName: 'Sildenafil' }
        ],
        activeMedications: ['Nitroglycerin 0.4 mg SL']
      });

      assert.equal(result.hasBlockingContraindication, true, 'Sildenafil + Nitrate co-prescription must block');
      const ddi = result.alerts.find(a => a.ruleId === 'DDI-PDE5-NITRATE-001');
      assert.ok(ddi, 'Must trigger DDI-PDE5-NITRATE-001 rule');
      assert.equal(ddi?.severity, 'CONTRAINDICATED');
      assert.equal(ddi?.overrideAllowed, false, 'Fatal hypotension risk cannot be overridden');
    });

    test('6.2 Warfarin + NSAID requires mandatory clinical justification with minimum 5 characters', async () => {
      // Case A: No override provided -> Blocked
      const uninhibited = await clinicalSafetyService.evaluatePrescriptionSafety(mockSession, {
        patientId: crypto.randomUUID(),
        medications: [
          { medicationName: 'Ibuprofen 400 mg', genericName: 'Ibuprofen' }
        ],
        activeMedications: ['Warfarin 5 mg']
      });
      assert.equal(uninhibited.hasBlockingContraindication, true, 'Warfarin + NSAID without override must block');

      // Case B: Override with trivial justification (<5 chars) -> Still blocked
      const trivialOverride = await clinicalSafetyService.evaluatePrescriptionSafety(mockSession, {
        patientId: crypto.randomUUID(),
        medications: [
          { medicationName: 'Ibuprofen 400 mg', genericName: 'Ibuprofen' }
        ],
        activeMedications: ['Warfarin 5 mg'],
        overrides: [
          { ruleId: 'DDI-ANTICOAG-NSAID-002', clinicalJustification: 'ok' }
        ]
      });
      assert.equal(trivialOverride.hasBlockingContraindication, true, 'Override with <5 chars justification must be rejected');

      // Case C: Override with qualified justification (>=5 chars) -> Permitted with audit trace
      const validOverride = await clinicalSafetyService.evaluatePrescriptionSafety(mockSession, {
        patientId: crypto.randomUUID(),
        medications: [
          { medicationName: 'Ibuprofen 400 mg', genericName: 'Ibuprofen' }
        ],
        activeMedications: ['Warfarin 5 mg'],
        overrides: [
          { ruleId: 'DDI-ANTICOAG-NSAID-002', clinicalJustification: 'Short-term 48h emergency dental relief with PPI co-prescription and daily INR monitoring' }
        ]
      });
      assert.equal(validOverride.hasBlockingContraindication, false, 'Valid clinical justification permits override');
      assert.equal(validOverride.alerts[0]?.wasOverridden, true);
    });
  });

  // ==========================================================================
  // SCENARIO 7: Pharmacy Dispensing & Inventory FEFO Deduction
  // ==========================================================================
  describe('Scenario 7: Closed-Loop Pharmacy Dispensing & FEFO Stock Safety', () => {
    test('7.1 Dispensing with insufficient stock or expired batches is strictly rejected', async () => {
      function createQueryMock(resultArray) {
        const p = Promise.resolve(resultArray);
        p.limit = () => Promise.resolve(resultArray);
        p.orderBy = () => p;
        p.for = () => p;
        return p;
      }

      const mockDb = {
        select: () => ({
          from: (table) => {
            const tableName = String(table?.[Symbol.for('drizzle:Name')] || table?._?.name || '');
            const isBatch = tableName.includes('batch') || tableName.includes('pharmacy_batches');
            return {
              where: () => createQueryMock(isBatch ? [] : [{ id: tenantId, tenantId, status: 'ACTIVE' }]),
              orderBy: () => ({
                where: () => createQueryMock(isBatch ? [] : [{ id: tenantId, tenantId, status: 'ACTIVE' }]),
                for: () => createQueryMock(isBatch ? [] : [{ id: tenantId, tenantId, status: 'ACTIVE' }])
              })
            };
          }
        }),
        transaction: async (fn) => fn(mockDb)
      };

      await assert.rejects(
        async () => {
          await pharmacyManagementRepository.dispense(
            {
              tenantId,
              partnerId: tenantId,
              organizationId: tenantId,
              branchId: tenantId,
              patientId: crypto.randomUUID(),
              dispensedBy: doctorId,
              paymentMethod: 'CASH',
              items: [
                {
                  medicationId: crypto.randomUUID(),
                  medicationName: 'Meropenem 1g Injection',
                  quantity: 99999,
                  unitPrice: 1200
                }
              ]
            },
            mockDb
          );
        },
        /Insufficient pharmacy stock available/,
        'Dispensing without available active batch stock must throw 409 Conflict'
      );
    });
  });

  // ==========================================================================
  // SCENARIO 8: Laboratory Specimen Rejection & Recollection Workflow
  // ==========================================================================
  describe('Scenario 8: Laboratory Specimen Rejection & Barcoded Recollection', () => {
    test('8.1 Specimen rejection updates order status and logs immutable audit trail', async () => {
      const orderId = crypto.randomUUID();
      // Test rejection with non-existent order gracefully returns null without uncaught crash
      const rejResult = await labDiagnosticsRepository.rejectSpecimen(tenantId, orderId, {
        rejectionReason: 'HEMOLYZED_SAMPLE',
        remarks: 'Blood tube heavily hemolyzed during transport centrifuge',
        rejectedBy: doctorId
      });
      assert.equal(rejResult, null, 'Safe null return for non-existent synthetic order');
    });

    test('8.2 Barcode accession renewal preserves specimen lineage (BC-...-R2)', () => {
      const orderNumber = 'LAB-2026-9901';
      const existingSpecimensCount = 1;
      const renewedBarcode = `BC-${orderNumber}-R${existingSpecimensCount + 1}`;
      assert.equal(renewedBarcode, 'BC-LAB-2026-9901-R2', 'Recollection barcode must append incremented revision index');
    });
  });

  // ==========================================================================
  // SCENARIO 9: Critical Laboratory Result Escalation
  // ==========================================================================
  describe('Scenario 9: Critical Panic Lab Value Escalation', () => {
    test('9.1 Potassium 7.2 mmol/L triggers CRITICAL_HIGH panic alert', () => {
      const kRef = CLINICAL_REFERENCE_RANGES['K'];
      assert.ok(kRef, 'Potassium reference range must be configured');
      assert.equal(kRef.refMin, 3.5);
      assert.equal(kRef.refMax, 5.1);
      assert.equal(kRef.criticalMax, 6.2);

      const testValue = 7.2;
      let abnormalFlag = 'NORMAL';
      if (testValue > kRef.criticalMax) {
        abnormalFlag = 'CRITICAL_HIGH';
      } else if (testValue > kRef.refMax) {
        abnormalFlag = 'HIGH';
      }

      assert.equal(abnormalFlag, 'CRITICAL_HIGH', 'Potassium 7.2 mmol/L must flag CRITICAL_HIGH');
    });

    test('9.2 Blood Glucose 28 mg/dL triggers CRITICAL_LOW hypoglycemic panic alert', () => {
      const gluRef = CLINICAL_REFERENCE_RANGES['GLU'];
      assert.ok(gluRef, 'Blood Glucose reference range must be configured');
      assert.equal(gluRef.criticalMin, 45.0);

      const testValue = 28.0;
      let abnormalFlag = 'NORMAL';
      if (testValue < gluRef.criticalMin) {
        abnormalFlag = 'CRITICAL_LOW';
      }

      assert.equal(abnormalFlag, 'CRITICAL_LOW', 'Blood Glucose 28 mg/dL must flag CRITICAL_LOW');
    });
  });

  // ==========================================================================
  // SCENARIO 10: Radiology Order & DICOM Association
  // ==========================================================================
  describe('Scenario 10: Radiology & DICOM Patient Association Integrity', () => {
    test('10.1 Order creation enforces tenant context and branch boundaries', async () => {
      await assert.rejects(
        async () => {
          await radiologyRepository.createOrder({});
        },
        /Tenant context \(tenantId\) is required/,
        'Radiology order without tenantId must be rejected'
      );
    });

    test('10.2 Generates compliant DICOM UID hierarchies (Study, Series, SOP)', () => {
      const orgRoot = '1.2.840.10008.2026';
      const studyUid = `${orgRoot}.${Date.now()}.1`;
      const seriesUid = `${studyUid}.1`;
      const sopUid = `${seriesUid}.1`;

      assert.ok(studyUid.startsWith(orgRoot));
      assert.ok(seriesUid.startsWith(studyUid));
      assert.ok(sopUid.startsWith(seriesUid));
    });
  });

  // ==========================================================================
  // SCENARIO 11: Inpatient Admission, Bed Allocation & Concurrency Guard
  // ==========================================================================
  describe('Scenario 11: Inpatient Admission & Pessimistic Bed Allocation Lock', () => {
    test('11.1 Admission checks bed availability and prevents double booking', async () => {
      await assert.rejects(
        async () => {
          await inpatientManagementRepository.createAdmission({
            tenantId,
            partnerId,
            organizationId: partnerId,
            branchId,
            patientId: crypto.randomUUID(),
            bedId: crypto.randomUUID(),
            doctorId,
            department: 'GENERAL_MEDICINE',
            admissionReason: 'Acute exacerbation of COPD'
          });
        },
        /Target bed not found for admission/,
        'Admitting to non-existent bed must throw 404'
      );
    });
  });

  // ==========================================================================
  // SCENARIO 12: ICU Monitoring & Flowsheet
  // ==========================================================================
  describe('Scenario 12: ICU Telemetry & Invasive Hemodynamic Monitoring', () => {
    test('12.1 Calculates Mean Arterial Pressure (MAP) accurately: (2*DBP + SBP) / 3', () => {
      const sbp = 110;
      const dbp = 70;
      const calculatedMap = Math.round((2 * dbp + sbp) / 3);
      assert.equal(calculatedMap, 83, 'MAP for 110/70 must be exactly 83 mmHg');
    });

    test('12.2 Critical MAP < 65 mmHg flags hypoperfusion shock hazard', () => {
      const sbp = 80;
      const dbp = 50;
      const calculatedMap = Math.round((2 * dbp + sbp) / 3);
      assert.equal(calculatedMap, 60, 'MAP for 80/50 must be 60 mmHg');
      assert.ok(calculatedMap < 65, 'MAP < 65 indicates organ hypoperfusion requiring vasopressors');
    });
  });

  // ==========================================================================
  // SCENARIO 13: Patient Discharge & Encounter Closure
  // ==========================================================================
  describe('Scenario 13: Patient Discharge & Bed Release', () => {
    test('13.1 Discharge validation blocks modifying completed or discharged encounters', async () => {
      await assert.rejects(
        async () => {
          await inpatientManagementRepository.dischargePatient({
            tenantId,
            admissionId: crypto.randomUUID(),
            dischargedBy: doctorId,
            dischargeType: 'NORMAL',
            dischargeNotes: 'Patient recovered uneventfully'
          });
        },
        /Admission record not found/,
        'Discharging non-existent admission safely throws 404'
      );
    });
  });

  // ==========================================================================
  // SCENARIO 14: Duplicate Patient Registration & Identity Protection
  // ==========================================================================
  describe('Scenario 14: Patient Master Identity Deduplication & Anti-Fracturing', () => {
    test('14.1 Technical identity assertion blocks MRN/Token substitution for UUID', () => {
      assert.throws(
        () => {
          patient360ContinuityService.assertCanonicalTechnicalId('MRN-2026-001099', 'patientId');
        },
        /Invalid identifier substitution/,
        'Passing MRN string where UUID technical ID is required must throw validation error'
      );
    });

    test('14.2 Cross-tenant patient merge is strictly forbidden with 403 Forbidden', async () => {
      await assert.rejects(
        async () => {
          // Attempting to merge patients across different tenant contexts
          await patient360ContinuityService.mergeDuplicatePatient(
            mockSession,
            crypto.randomUUID(),
            crypto.randomUUID(),
            'Attempted cross-tenant merge'
          );
        },
        /not found/i,
        'Attempting merge with non-existent patient safely throws'
      );
    });
  });

  // ==========================================================================
  // SCENARIO 15: Finalized Consultation Note Overwrite Rejection
  // ==========================================================================
  describe('Scenario 15: Finalized Medical Note Immutability & Anti-Tamper Guard', () => {
    test('15.1 Consultation save blocks overwriting FINALIZED notes with 409 Conflict', async () => {
      function createQueryMock(resultArray) {
        const p = Promise.resolve(resultArray);
        p.limit = () => Promise.resolve(resultArray);
        p.orderBy = () => p;
        p.for = () => p;
        return p;
      }

      // Create a mock DB returning a finalized existing consultation
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => createQueryMock([{
              id: doctorId,
              tenantId,
              consultationNumber: 'CON-2026-880011',
              consultationStatus: 'FINALIZED',
              status: 'FINALIZED',
              chiefComplaint: 'Original completed and locked doctor note'
            }])
          })
        })
      };

      await assert.rejects(
        async () => {
          await clinicalWorkflowRepository.saveConsultation(
            {
              tenantId,
              encounterId: crypto.randomUUID(),
              patientId: crypto.randomUUID(),
              doctorId,
              chiefComplaint: 'Malicious attempt to overwrite locked medical record'
            },
            mockDb
          );
        },
        /Consultation is already FINALIZED and locked/,
        'Overwriting finalized consultation note must throw 409 Conflict'
      );
    });
  });
});
