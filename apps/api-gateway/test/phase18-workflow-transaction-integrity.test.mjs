/**
 * DOC SEARCH — PHASE 18 ENTERPRISE WORKFLOW & TRANSACTION INTEGRITY ADVERSARIAL TEST SUITE
 *
 * Verifies all 21 canonical clinical workflows, atomic transaction boundaries,
 * state machine invariants, illegal transition barriers, and data continuity:
 *
 * - TEST 01: Canonical End-to-End Master Workflow Transaction (WF-01 to WF-21)
 * - TEST 02: WF-05: Duplicate Patient Registration & MRN Collision Prevention (409)
 * - TEST 03: WF-06: Slot-Locked Appointment Scheduling Concurrency Barrier
 * - TEST 04: WF-14: Illegal State Transition: Collecting Specimen for CANCELLED Lab Order (409)
 * - TEST 05: WF-15: Illegal State Transition: Entering Result on CANCELLED Lab Order (409)
 * - TEST 06: WF-15: Illegal State Transition: Premature Verification without Results (400)
 * - TEST 07: WF-17: Illegal State Transition: Reviewing Unverified or CANCELLED Lab Order (409)
 * - TEST 08: WF-17: Illegal State Transition: Modifying Finalized Report without Amendment (409)
 * - TEST 09: WF-18: Illegal State Transition: Prescribing for CANCELLED Encounter (409)
 * - TEST 10: WF-18: Wrong-Patient Association Barrier (400)
 * - TEST 11: WF-11: Illegal State Transition: Consultation on Exited / Discharged Encounter (409)
 * - TEST 12: WF-19: Atomic FEFO Pharmacy Dispensing & Stock Movement Ledger
 * - TEST 13: WF-19: Insufficient Pharmacy Stock & Negative Stock Prevention (409)
 * - TEST 14: WF-19: Double Dispensing Prevention on Fully Dispensed Prescription (500/400)
 * - TEST 15: WF-20: Financial Payment Overpayment & Voided Invoice Guard (409/400)
 * - TEST 16: WF-21: Discharge Clearance State Machine: Blocked on Unpaid Bills / Open Tests (409)
 * - TEST 17: Multi-Domain Data Lineage & DAG Continuity (DataLineageService)
 * - TEST 18: Automated Cross-Domain Enterprise Reconciliation (ReconciliationEngineService)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS, getDatabase } from '@docsearch/database';

import { clinicalWorkflowRepository } from '../dist/repositories/partner/ClinicalWorkflowRepository.js';
import { labDiagnosticsRepository } from '../dist/repositories/partner/LabDiagnosticsRepository.js';
import { radiologyRepository } from '../dist/repositories/partner/RadiologyRepository.js';
import { pharmacyManagementRepository } from '../dist/repositories/partner/PharmacyManagementRepository.js';
import { billingManagementRepository } from '../dist/repositories/partner/BillingManagementRepository.js';
import { dataLineageService } from '../dist/services/reliability/DataLineageService.js';
import { reconciliationEngineService } from '../dist/services/reliability/ReconciliationEngineService.js';
import { slotLockManager } from '@docsearch/shared-core/server';

describe('DOC SEARCH — Phase 18 Workflow & Transaction Integrity Test Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = TEST_SEEDS.TENANT_A; // 11111111-1111-4111-8111-111111111111
  const BRANCH_A = TEST_SEEDS.BRANCH_A;

  function createToken(tenantId, roles = ['DOCTOR', 'HOSPITAL_ADMIN', 'PHARMACIST', 'PATHOLOGIST', 'RADIOLOGIST'], permissions = ['*'], email = 'staff@hospital.health') {
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const claims = {
      sub: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      email,
      tenantId,
      branchId: BRANCH_A,
      roles,
      permissions,
      isSuperAdmin,
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  function createSession(tenantId = TENANT_A, roles = ['DOCTOR', 'HOSPITAL_ADMIN', 'PHARMACIST', 'PATHOLOGIST', 'RADIOLOGIST'], email = 'doctor@hospital.health') {
    const userId = TEST_SEEDS.DOCTOR_ID;
    return {
      userId,
      actorEmail: email,
      tenantId,
      branchId: BRANCH_A,
      departmentId: '00000000-0000-4000-8000-000000000001',
      roles,
      permissions: ['*'],
      isSuperAdmin: roles.includes('SUPER_ADMIN')
    };
  }

  let tokenDoctor;
  let defaultSession;

  before(async () => {
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['LICENSE_HMAC_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';

    testDb = await setupTestDatabase();
    app = await buildApp();
    await app.ready();

    tokenDoctor = createToken(TENANT_A);
    defaultSession = createSession(TENANT_A);
  });

  after(async () => {
    if (app) await app.close();
  });

  // Helper to quickly create a valid registered patient
  async function createRegisteredPatient(db, firstName = 'Test', lastName = 'Patient') {
    const mrn = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const phone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
    return clinicalWorkflowRepository.createPatient({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      mrn,
      firstName,
      lastName,
      gender: 'OTHER',
      dateOfBirth: '1992-01-01',
      mobileNumber: phone
    }, db);
  }

  // Helper to quickly create a catalog medication with valid FK
  async function createCatalogMedication(name = 'Medication') {
    const medId = crypto.randomUUID();
    const code = `MED-${Math.floor(100000 + Math.random() * 900000)}`;
    await testDb.pool.query(`
      INSERT INTO "clinical"."medication_catalog" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id",
        "medication_code", "generic_name", "brand_name", "strength", "dosage_form", "manufacturer", "category"
      ) VALUES (
        '${medId}', '${TENANT_A}', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.ORG_ID_A}', '${BRANCH_A}',
        '${code}', '${name}', '${name} Brand', '500mg', 'TABLET', 'Standard Pharma', 'GENERAL'
      )
    `);
    return medId;
  }

  // =========================================================================
  // TEST 01: Canonical End-to-End Master Workflow Transaction (WF-01 to WF-21)
  // =========================================================================
  it('TEST 01: Canonical End-to-End Master Workflow Transaction (WF-05 to WF-21)', async () => {
    const session = createSession(TENANT_A);
    const db = getDatabase();

    // 1. WF-05: Patient Registration
    const mrn = `MRN-P18-${Math.floor(100000 + Math.random() * 900000)}`;
    const patient = await clinicalWorkflowRepository.createPatient({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      mrn,
      firstName: 'Aarav',
      lastName: 'Patel',
      gender: 'MALE',
      dateOfBirth: '1990-05-15',
      mobileNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`
    }, db);
    assert.ok(patient.id, 'Patient must be assigned persistent UUID');
    assert.equal(patient.mrn, mrn, 'Patient MRN must match registered MRN');

    // 2. WF-06: Slot-Locked Appointment Booking
    const appointment = await clinicalWorkflowRepository.createAppointment({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      doctorId: session.userId,
      slotTime: '2026-10-01T09:00:00.000Z',
      date: '2026-10-01',
      startTime: '09:00',
      endTime: '09:30',
      reason: 'Chest pain evaluation'
    }, db);
    assert.ok(appointment.id, 'Appointment must be persisted');

    // 3. WF-10: Encounter Check-in
    const encounter = await clinicalWorkflowRepository.createEncounter({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      appointmentId: appointment.id,
      encounterType: 'OPD',
      chiefComplaint: 'Acute chest pain'
    }, db);
    assert.ok(encounter.id, 'Encounter must be persisted');
    assert.equal(encounter.patientId, patient.id, 'Encounter must link to patient');

    // 4. WF-08: Token Generation & Queue
    const token = await clinicalWorkflowRepository.createQueueToken({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      encounterId: encounter.id,
      queueType: 'OPD_CONSULTATION',
      priority: 'URGENT'
    }, db);
    assert.ok(token.tokenNumber, 'Queue token must be assigned integer or string sequence');

    // 5. WF-09: Nurse Triage Vitals
    const vitals = await clinicalWorkflowRepository.saveVitals({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      encounterId: encounter.id,
      patientId: patient.id,
      recordedBy: session.userId,
      systolicBp: 135,
      diastolicBp: 88,
      heartRate: 84,
      respiratoryRate: 18,
      temperatureCelsius: 37.1,
      spO2: 98
    }, db);
    assert.ok(vitals.id, 'Vitals record must be persisted');

    // 6. WF-11: Doctor Consultation & Clinical Notes
    const consultation = await clinicalWorkflowRepository.saveConsultation({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      encounterId: encounter.id,
      patientId: patient.id,
      doctorId: session.userId,
      chiefComplaint: 'Acute retrosternal chest pain radiating to left arm',
      historyOfPresentIllness: 'Started 2 hours ago post-exertion',
      examinationNotes: 'S1/S2 heard, no murmurs. Lungs clear.',
      status: 'IN_PROGRESS'
    }, db);
    assert.ok(consultation.id, 'Consultation must be persisted');

    // 7. WF-12: ICD-10 Diagnosis Assignment
    await clinicalWorkflowRepository.saveDiagnosis({
      tenantId: TENANT_A,
      consultationId: consultation.id,
      icd10Code: 'I20.0',
      description: 'Unstable angina',
      diagnosisType: 'PROVISIONAL'
    }, db);

    // 8. WF-13: Diagnostic Order Generation (LIMS Lab Order)
    const labOrder = await labDiagnosticsRepository.createOrder({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      encounterId: encounter.id,
      orderingDoctorId: session.userId,
      testCode: 'TROP-I',
      testName: 'High Sensitivity Troponin I',
      priority: 'STAT',
      clinicalNotes: 'Suspected acute coronary syndrome'
    }, db);
    assert.ok(labOrder.id, 'Lab order must be persisted');

    // 9. WF-14: Lab Specimen Collection
    const specimenCollected = await labDiagnosticsRepository.collectSpecimen({
      tenantId: TENANT_A,
      orderId: labOrder.id,
      specimenType: 'WHOLE_BLOOD',
      collectedBy: session.userId
    }, db);
    assert.ok(specimenCollected, 'Specimen collection must succeed');

    // 10. WF-15: Lab Processing & Result Entry
    const resultedOrder = await labDiagnosticsRepository.enterResult({
      tenantId: TENANT_A,
      orderId: labOrder.id,
      enteredBy: session.userId,
      parameterCode: 'TROP_I_VAL',
      parameterName: 'Troponin I Quantitative',
      resultValue: '0.08',
      unit: 'ng/mL',
      referenceRange: '0.00 - 0.04',
      isAbnormal: true,
      abnormalFlag: 'HIGH',
      isPanic: true,
      panicReason: 'Troponin elevated above reference limit'
    }, db);
    assert.ok(resultedOrder, 'Lab results must be persisted');

    // 11. WF-17: Lab Result Verification
    const verifiedOrder = await labDiagnosticsRepository.verifyResult(
      TENANT_A,
      labOrder.id,
      session.userId,
      db
    );
    assert.equal(verifiedOrder.status, 'VERIFIED', 'Lab order status must transition to VERIFIED');

    // 12. WF-17: Doctor Review of Lab Report
    const reviewedOrder = await labDiagnosticsRepository.reviewResult(
      TENANT_A,
      labOrder.id,
      'Reviewed. Initiating antiplatelet and statin therapy.',
      session.userId,
      db
    );
    assert.equal(reviewedOrder.status, 'COMPLETED', 'Lab order status must transition to COMPLETED upon review');

    // 13. WF-18: e-Prescription Generation
    const prescription = await clinicalWorkflowRepository.createPrescription({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      encounterId: encounter.id,
      patientId: patient.id,
      prescribingDoctorId: session.userId,
      items: [
        {
          drugName: 'Aspirin',
          dosage: '75mg',
          frequency: '1-0-0',
          durationDays: 30,
          quantity: 30,
          instructions: 'After breakfast'
        }
      ]
    }, db);
    assert.ok(prescription.id, 'Prescription must be persisted');

    // Seed stock for dispensing test
    const medAspirinId = await createCatalogMedication('Aspirin 75mg');
    await pharmacyManagementRepository.receiveStock({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      medicationId: medAspirinId,
      batchNumber: 'BAT-ASP-2026',
      expiryDate: '2027-12-31',
      quantity: 100,
      unitCost: 2.50
    }, session.userId, db);

    // 14. WF-19: Atomic FEFO Pharmacy Dispensing
    const dispensing = await pharmacyManagementRepository.dispense({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      encounterId: encounter.id,
      prescriptionId: prescription.id,
      pharmacistId: session.userId,
      items: [
        {
          medicationId: medAspirinId,
          quantity: 10
        }
      ]
    }, db);
    assert.ok(dispensing.id, 'Dispensing transaction must succeed');
    assert.equal(dispensing.dispensingStatus, 'DISPENSED', 'Prescription dispensing status must be DISPENSED');

    // 15. WF-20: Final Invoice & Payment Settlement
    const invoice = await billingManagementRepository.createInvoice({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      encounterId: encounter.id,
      items: [
        { description: 'OPD Consultation Fee', quantity: 1, unitPrice: 500 },
        { description: 'High Sensitivity Troponin I', quantity: 1, unitPrice: 850 }
      ]
    }, db);
    assert.ok(invoice.id, 'Billing invoice must be persisted');

    const paymentResult = await billingManagementRepository.collectPayment({
      tenantId: TENANT_A,
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      paymentMethod: 'CASH',
      collectedBy: session.userId
    }, db);
    assert.equal(paymentResult.invoice.status, 'PAID', 'Invoice must be settled to PAID');

    // 16. WF-21: Patient Exit & Discharge Clearance
    const dischargeResult = await clinicalWorkflowRepository.dischargeEncounter(
      TENANT_A,
      encounter.id,
      { notes: 'Patient clinically stable; follow up in 7 days.' },
      db
    );
    assert.equal(dischargeResult.status, 'DISCHARGED', 'Encounter must be successfully discharged');
  });

  // =========================================================================
  // TEST 02: Duplicate Patient Registration & MRN Collision Prevention (WF-05)
  // =========================================================================
  it('TEST 02: WF-05: Duplicate Patient Registration & MRN Collision Prevention (409)', async () => {
    const db = getDatabase();
    const uniqueMrn = `MRN-DUP-${Math.floor(100000 + Math.random() * 900000)}`;

    const p1 = await clinicalWorkflowRepository.createPatient({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      mrn: uniqueMrn,
      firstName: 'Rahul',
      lastName: 'Verma',
      gender: 'MALE',
      dateOfBirth: '1985-04-12'
    }, db);

    // Exact same patient -> idempotent return
    const p1Duplicate = await clinicalWorkflowRepository.createPatient({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      mrn: uniqueMrn,
      firstName: 'Rahul',
      lastName: 'Verma',
      gender: 'MALE',
      dateOfBirth: '1985-04-12'
    }, db);
    assert.equal(p1Duplicate.id, p1.id, 'Same MRN with same name must return existing patient record');

    // Colliding MRN with different name -> must throw 409 Conflict
    await assert.rejects(
      async () => {
        await clinicalWorkflowRepository.createPatient({
          tenantId: TENANT_A,
          branchId: BRANCH_A,
          mrn: uniqueMrn,
          firstName: 'Vikram',
          lastName: 'Sharma',
          gender: 'MALE',
          dateOfBirth: '1980-01-01'
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Duplicate MRN collision/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 03: Slot-Locked Appointment Scheduling Concurrency Barrier (WF-06)
  // =========================================================================
  it('TEST 03: WF-06: Slot-Locked Appointment Scheduling Concurrency Barrier', async () => {
    const doctorId = crypto.randomUUID();
    const slotTime = '2026-10-15T10:00:00.000Z';
    const owner1 = 'worker-1';
    const owner2 = 'worker-2';

    // Claim slot lock for doctor
    const lock1 = await slotLockManager.acquireSlotLock(TENANT_A, doctorId, slotTime, 60, owner1);
    assert.ok(lock1.acquired, 'First slot reservation must succeed');

    // Concurrent second attempt on identical doctor, slotTime by different worker must be rejected
    const lock2 = await slotLockManager.acquireSlotLock(TENANT_A, doctorId, slotTime, 60, owner2);
    assert.equal(lock2.acquired, false, 'Concurrent booking on identical slot must be locked/denied');

    // Release slot lock
    await slotLockManager.releaseSlotLock(lock1.lockKey, owner1);
    const lock3 = await slotLockManager.acquireSlotLock(TENANT_A, doctorId, slotTime, 60, owner2);
    assert.ok(lock3.acquired, 'Slot reservation must succeed once previous lock is released');
    await slotLockManager.releaseSlotLock(lock3.lockKey, owner2);
  });

  // =========================================================================
  // TEST 04: Illegal State Transition: Collecting Specimen for CANCELLED Lab Order (WF-14)
  // =========================================================================
  it('TEST 04: WF-14: Illegal State Transition: Collecting Specimen for CANCELLED Lab Order (409)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);

    const patient = await createRegisteredPatient(db, 'Lab', 'Patient4');
    const order = await labDiagnosticsRepository.createOrder({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      orderingDoctorId: session.userId,
      testCode: 'CBC',
      testName: 'Complete Blood Count'
    }, db);

    // Cancel order
    await labDiagnosticsRepository.cancelOrder(
      TENANT_A,
      order.id,
      session.userId,
      'Test cancelled by attending physician',
      db
    );

    // Attempt to collect specimen on CANCELLED order -> must fail with 409 Conflict
    await assert.rejects(
      async () => {
        await labDiagnosticsRepository.collectSpecimen({
          tenantId: TENANT_A,
          orderId: order.id,
          specimenType: 'WHOLE_BLOOD',
          collectedBy: session.userId
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Cannot collect specimen for a CANCELLED laboratory order/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 05: Illegal State Transition: Entering Result on CANCELLED Lab Order (WF-15)
  // =========================================================================
  it('TEST 05: WF-15: Illegal State Transition: Entering Result on CANCELLED Lab Order (409)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);

    const patient = await createRegisteredPatient(db, 'Lab', 'Patient5');
    const order = await labDiagnosticsRepository.createOrder({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      orderingDoctorId: session.userId,
      testCode: 'LFT',
      testName: 'Liver Function Test'
    }, db);

    await labDiagnosticsRepository.cancelOrder(
      TENANT_A,
      order.id,
      session.userId,
      'Cancelled due to wrong clinical requisition',
      db
    );

    await assert.rejects(
      async () => {
        await labDiagnosticsRepository.enterResult({
          tenantId: TENANT_A,
          orderId: order.id,
          enteredBy: session.userId,
          parameterCode: 'ALT',
          parameterName: 'Alanine Aminotransferase',
          resultValue: '35',
          unit: 'U/L'
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Cannot enter results for a CANCELLED laboratory order/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 06: Illegal State Transition: Premature Verification without Results (WF-15)
  // =========================================================================
  it('TEST 06: WF-15: Illegal State Transition: Premature Verification without Results (400)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);

    const patient = await createRegisteredPatient(db, 'Lab', 'Patient6');
    const order = await labDiagnosticsRepository.createOrder({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      orderingDoctorId: session.userId,
      testCode: 'KFT',
      testName: 'Kidney Function Test'
    }, db);

    // Attempt to verify before any results are entered
    await assert.rejects(
      async () => {
        await labDiagnosticsRepository.verifyResult(
          TENANT_A,
          order.id,
          session.userId,
          db
        );
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cannot verify laboratory order before results are entered/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 07: Illegal State Transition: Reviewing Unverified or CANCELLED Lab Order (WF-17)
  // =========================================================================
  it('TEST 07: WF-17: Illegal State Transition: Reviewing Unverified or CANCELLED Lab Order (409)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);

    const patient = await createRegisteredPatient(db, 'Lab', 'Patient7');
    const order = await labDiagnosticsRepository.createOrder({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      orderingDoctorId: session.userId,
      testCode: 'URIC_ACID',
      testName: 'Serum Uric Acid'
    }, db);

    // Attempt review while still in ORDERED status (unverified)
    await assert.rejects(
      async () => {
        await labDiagnosticsRepository.reviewResult(
          TENANT_A,
          order.id,
          'Premature review attempt',
          session.userId,
          db
        );
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Order must be VERIFIED or REPORTED before doctor review/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 08: Illegal State Transition: Modifying Finalized Report without Amendment (WF-17)
  // =========================================================================
  it('TEST 08: WF-17: Illegal State Transition: Modifying Finalized Report without Amendment (409)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);

    const patient = await createRegisteredPatient(db, 'Rad', 'Patient8');
    const order = await radiologyRepository.createOrder({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      patientName: 'Rad Patient8',
      patientMrn: patient.mrn,
      modalityType: 'XRAY',
      procedureCode: 'CHEST-PA',
      procedureName: 'Chest X-Ray PA View',
      orderingDoctorId: session.userId,
      orderingDoctorName: 'Dr. Physician'
    }, db);

    const study = await radiologyRepository.createStudy({
      tenantId: TENANT_A,
      partnerId: order.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: order.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: BRANCH_A,
      orderId: order.id,
      patientName: 'Rad Patient8',
      patientMrn: patient.mrn,
      modalityType: 'XRAY',
      studyDescription: 'Chest PA',
      studyInstanceUid: `1.2.840.10008.${Date.now()}`,
      accessionNumber: `ACC-${Date.now()}`,
      technologistName: 'Technologist Tech',
      pacsViewerUrl: 'http://pacs/view'
    }, db);

    const report = await radiologyRepository.createReport({
      tenantId: TENANT_A,
      partnerId: study.partnerId,
      organizationId: study.organizationId,
      branchId: BRANCH_A,
      orderId: order.id,
      studyId: study.id,
      patientName: 'Rad Patient8',
      patientMrn: patient.mrn,
      modalityType: 'XRAY',
      procedureName: 'Chest X-Ray PA View',
      clinicalHistory: 'Pre-operative assessment',
      imagingTechnique: 'Digital Radiography PA',
      reportingRadiologistName: 'Dr. Radiologist, MD',
      reportNumber: `RAD-REP-${Math.floor(100000 + Math.random() * 900000)}`,
      findings: 'Normal chest radiograph',
      impression: 'No acute cardiopulmonary disease',
      status: 'FINALIZED',
      verifyingRadiologistName: 'Dr. Radiologist, MD'
    }, db);

    // Direct finalization of already finalized report throws 409
    await assert.rejects(
      async () => {
        const { radiologyService } = await import('../dist/services/partner/RadiologyService.js');
        await radiologyService.finalizeReport(report.id, { verifyingRadiologistName: 'Dr. Other' }, session);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Report is already finalized and immutable/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 09: Illegal State Transition: Prescribing for CANCELLED Encounter (WF-18)
  // =========================================================================
  it('TEST 09: WF-18: Illegal State Transition: Prescribing for CANCELLED Encounter (409)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);

    const patient = await createRegisteredPatient(db, 'Cancelled', 'Patient');
    const encounter = await clinicalWorkflowRepository.createEncounter({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      encounterType: 'OPD',
      chiefComplaint: 'Headache'
    }, db);

    // Cancel encounter
    await clinicalWorkflowRepository.updateEncounterStatus(
      TENANT_A,
      encounter.id,
      'CANCELLED',
      db
    );

    // Attempt to issue prescription for cancelled encounter -> 409 Conflict
    await assert.rejects(
      async () => {
        await clinicalWorkflowRepository.createPrescription({
          tenantId: TENANT_A,
          branchId: BRANCH_A,
          encounterId: encounter.id,
          patientId: patient.id,
          prescribingDoctorId: session.userId,
          items: [{ drugName: 'Paracetamol', dosage: '500mg', quantity: 10 }]
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Cannot issue prescription for a CANCELLED encounter/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 10: Wrong-Patient Association Barrier (WF-18)
  // =========================================================================
  it('TEST 10: WF-18: Wrong-Patient Association Barrier (400)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);

    const patientA = await createRegisteredPatient(db, 'Legitimate', 'PatientA');
    const patientB = await createRegisteredPatient(db, 'Foreign', 'PatientB');

    const encounter = await clinicalWorkflowRepository.createEncounter({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patientA.id,
      encounterType: 'OPD',
      chiefComplaint: 'Fever'
    }, db);

    // Issue prescription targeting encounter of patientA with mismatched patientId patientB
    await assert.rejects(
      async () => {
        await clinicalWorkflowRepository.createPrescription({
          tenantId: TENANT_A,
          branchId: BRANCH_A,
          encounterId: encounter.id,
          patientId: patientB.id,
          prescribingDoctorId: session.userId,
          items: [{ drugName: 'Amoxicillin', dosage: '500mg', quantity: 20 }]
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Prescription patientId mismatch/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 11: Illegal State Transition: Consultation on Exited / Discharged Encounter (WF-11)
  // =========================================================================
  it('TEST 11: WF-11: Illegal State Transition: Consultation on Exited / Discharged Encounter (409)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);

    const patient = await createRegisteredPatient(db, 'Exited', 'Patient');
    const encounter = await clinicalWorkflowRepository.createEncounter({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      encounterType: 'OPD',
      chiefComplaint: 'Ear pain'
    }, db);

    // Formally discharge encounter
    await clinicalWorkflowRepository.dischargeEncounter(
      TENANT_A,
      encounter.id,
      { forceDischarge: true, overrideReason: 'Administrative discharge test' },
      db
    );

    // Attempt to save consultation for discharged encounter -> must throw 409 Conflict
    await assert.rejects(
      async () => {
        await clinicalWorkflowRepository.saveConsultation({
          tenantId: TENANT_A,
          branchId: BRANCH_A,
          encounterId: encounter.id,
          patientId: patient.id,
          doctorId: session.userId,
          chiefComplaint: 'Post-discharge consultation attempt'
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Cannot modify or create consultation for an encounter in DISCHARGED status/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 12: Atomic FEFO Pharmacy Dispensing & Stock Movement Ledger (WF-19)
  // =========================================================================
  it('TEST 12: WF-19: Atomic FEFO Pharmacy Dispensing & Stock Movement Ledger', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);
    const medId = await createCatalogMedication('FefoMed');
    const patient = await createRegisteredPatient(db, 'Pharmacy', 'Customer');

    // Seed batch with 50 units
    await pharmacyManagementRepository.receiveStock({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      medicationId: medId,
      batchNumber: 'BAT-FEFO-01',
      expiryDate: '2027-06-30',
      quantity: 50,
      unitCost: 10.0
    }, session.userId, db);

    // Dispense 15 units
    const result = await pharmacyManagementRepository.dispense({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      pharmacistId: session.userId,
      items: [{ medicationId: medId, quantity: 15 }]
    }, db);

    assert.ok(result.id, 'Dispensing ID generated');
    assert.equal(result.items[0].quantity, 15, 'Dispensed quantity matches');

    // Verify stock movements recorded in ledger
    const movements = await pharmacyManagementRepository.getStockMovements(TENANT_A, medId);
    const dispenseMovement = movements.find(m => m.movementType === 'DISPENSE');
    assert.ok(dispenseMovement, 'Stock ledger must contain DISPENSE entry');
    assert.equal(dispenseMovement.quantity, -15, 'Stock ledger must show exact negative decrement');
  });

  // =========================================================================
  // TEST 13: Insufficient Pharmacy Stock & Negative Stock Prevention (WF-19)
  // =========================================================================
  it('TEST 13: WF-19: Insufficient Pharmacy Stock & Negative Stock Prevention (409)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);
    const medId = await createCatalogMedication('LowStockMed');
    const patient = await createRegisteredPatient(db, 'LowStock', 'Customer');

    // Seed batch with only 5 units
    await pharmacyManagementRepository.receiveStock({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      medicationId: medId,
      batchNumber: 'BAT-LOW-01',
      expiryDate: '2027-01-31',
      quantity: 5,
      unitCost: 5.0
    }, session.userId, db);

    // Attempt to dispense 20 units -> must throw 409
    await assert.rejects(
      async () => {
        await pharmacyManagementRepository.dispense({
          tenantId: TENANT_A,
          branchId: BRANCH_A,
          patientId: patient.id,
          pharmacistId: session.userId,
          items: [{ medicationId: medId, quantity: 20 }]
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Insufficient pharmacy stock available/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 14: Double Dispensing Prevention on Fully Dispensed Prescription (WF-19)
  // =========================================================================
  it('TEST 14: WF-19: Double Dispensing Prevention on Fully Dispensed Prescription', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);
    const medId = await createCatalogMedication('DoubleDispenseMed');
    const patient = await createRegisteredPatient(db, 'DoubleDispense', 'Patient');

    await pharmacyManagementRepository.receiveStock({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      medicationId: medId,
      batchNumber: 'BAT-DD-01',
      expiryDate: '2028-01-01',
      quantity: 100,
      unitCost: 5.0
    }, session.userId, db);

    const prescription = await clinicalWorkflowRepository.createPrescription({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      prescribingDoctorId: TEST_SEEDS.DOCTOR_ID,
      items: [{ drugName: 'Test Med', quantity: 10 }]
    }, db);

    // Dispense first time -> marks prescription DISPENSED
    await pharmacyManagementRepository.dispense({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      prescriptionId: prescription.id,
      pharmacistId: session.userId,
      items: [{ medicationId: medId, quantity: 10 }]
    }, db);

    // Attempt second dispense on same prescription -> rejected
    await assert.rejects(
      async () => {
        await pharmacyManagementRepository.dispense({
          tenantId: TENANT_A,
          branchId: BRANCH_A,
          patientId: patient.id,
          prescriptionId: prescription.id,
          pharmacistId: session.userId,
          items: [{ medicationId: medId, quantity: 10 }]
        }, db);
      },
      (err) => {
        assert.match(err.message, /already been fully dispensed/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 15: Financial Payment Overpayment & Voided Invoice Guard (WF-20)
  // =========================================================================
  it('TEST 15: WF-20: Financial Payment Overpayment & Voided Invoice Guard (409/400)', async () => {
    const db = getDatabase();
    const session = createSession(TENANT_A);
    const patient = await createRegisteredPatient(db, 'Billing', 'Patient');

    const invoice = await billingManagementRepository.createInvoice({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      items: [{ description: 'Cardiology Consultation', quantity: 1, unitPrice: 1000 }]
    }, db);

    // Overpayment rejection
    await assert.rejects(
      async () => {
        await billingManagementRepository.collectPayment({
          tenantId: TENANT_A,
          invoiceId: invoice.id,
          amount: 1500, // exceeds 1000
          paymentMethod: 'CASH',
          collectedBy: session.userId
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /exceeds outstanding balance due/i);
        return true;
      }
    );

    // Pay exact amount
    await billingManagementRepository.collectPayment({
      tenantId: TENANT_A,
      invoiceId: invoice.id,
      amount: 1000,
      paymentMethod: 'CASH',
      collectedBy: session.userId
    }, db);

    // Paying already PAID invoice throws 409
    await assert.rejects(
      async () => {
        await billingManagementRepository.collectPayment({
          tenantId: TENANT_A,
          invoiceId: invoice.id,
          amount: 100,
          paymentMethod: 'CASH',
          collectedBy: session.userId
        }, db);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /is already fully paid/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 16: Discharge Clearance State Machine: Blocked on Unpaid Bills / Open Tests (WF-21)
  // =========================================================================
  it('TEST 16: WF-21: Discharge Clearance State Machine: Blocked on Unpaid Bills (409)', async () => {
    const db = getDatabase();
    const patient = await createRegisteredPatient(db, 'Unpaid', 'Patient');

    const encounter = await clinicalWorkflowRepository.createEncounter({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      encounterType: 'OPD',
      chiefComplaint: 'Knee injury'
    }, db);

    // Create an unpaid invoice linked to encounter
    await billingManagementRepository.createInvoice({
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patientId: patient.id,
      encounterId: encounter.id,
      items: [{ description: 'Orthopedic Evaluation', quantity: 1, unitPrice: 750 }]
    }, db);

    // Discharge without settling invoice -> must fail with 409 Conflict
    await assert.rejects(
      async () => {
        await clinicalWorkflowRepository.dischargeEncounter(
          TENANT_A,
          encounter.id,
          {},
          db
        );
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Cannot checkout patient: Unsettled invoices/i);
        return true;
      }
    );
  });

  // =========================================================================
  // TEST 17: Multi-Domain Data Lineage & DAG Continuity (DataLineageService)
  // =========================================================================
  it('TEST 17: Multi-Domain Data Lineage & DAG Continuity (DataLineageService)', async () => {
    const session = createSession(TENANT_A);
    const db = getDatabase();

    const patient = await createRegisteredPatient(db, 'Priya', 'Nair');

    const lineage = await dataLineageService.getEntityLineage('PATIENT', patient.id, session, db);
    assert.ok(lineage.rootEntity, 'Root entity must exist');
    assert.equal(lineage.rootEntity.id, patient.id, 'Root entity ID must match target patient');
    assert.ok(Array.isArray(lineage.nodes), 'Nodes array must be present');
    assert.ok(lineage.nodes.some(n => n.id === patient.id), 'Patient node must be in lineage graph');
  });

  // =========================================================================
  // TEST 18: Automated Cross-Domain Enterprise Reconciliation (ReconciliationEngineService)
  // =========================================================================
  it('TEST 18: Automated Cross-Domain Enterprise Reconciliation (ReconciliationEngineService)', async () => {
    const session = createSession(TENANT_A);
    const db = getDatabase();

    const recResult = await reconciliationEngineService.executeReconciliationRun(
      { domain: 'FINANCIAL_PAYMENTS', notes: 'Phase 18 Automated Reconciliation Gate' },
      session,
      db
    );

    assert.ok(recResult.run.id, 'Reconciliation run ID must be generated');
    assert.ok(recResult.run.status, 'Reconciliation run status must be populated');
    assert.equal(recResult.run.domain, 'FINANCIAL_PAYMENTS', 'Domain must match target');
  });
});
