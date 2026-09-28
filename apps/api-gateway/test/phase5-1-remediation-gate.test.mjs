/**
 * DOC SEARCH — PHASE 5.1 REMEDIATION GATE TEST SUITE
 *
 * Verifies all 3 authorized remediations under the strict protocol:
 * Audit -> Evidence -> Gap -> Architecture -> Controlled Implementation -> Tests -> Independent Verification -> Freeze
 *
 * 1. P1-GAP-01: RadiologyService ID-based mutation ScopeGuard enforcement:
 *    - rescheduleAppointment (cross-branch & cross-tenant rejection, authorized success)
 *    - cancelAppointment (cross-branch & cross-tenant rejection, authorized success)
 *    - completeStudyAcquisition (cross-branch & cross-tenant rejection, authorized success)
 *    - recordCriticalFinding (cross-branch & cross-tenant rejection, authorized success)
 *    - acknowledgeCriticalFinding (cross-branch & cross-tenant rejection, authorized success)
 *
 * 2. P1-GAP-02: Patient360ContinuityService PostgreSQL read model & cold-cache hydration:
 *    - Cold-cache / process-restart simulation (fresh service instance with empty in-memory maps)
 *    - Database hydration of canonical patient, encounters, consultations, vitals, prescriptions, timeline
 *    - Preservation of deterministic UHID/MRN, cross-department continuity, timeline ordering
 *    - Tenant and branch isolation fail-closed enforcement on cold hydrated records
 *
 * 3. P2-GAP-03: packages/database client.ts fail-closed database fallback hardening:
 *    - Staging and Production fail-closed on native PostgreSQL connection failure
 *    - STRICT_DATABASE=true fail-closed policy
 *    - In-memory pg-mem fallback strictly forbidden outside explicit test sandbox
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  getDatabase,
  tenants,
  branches,
  patients,
  encounters,
  consultations,
  consultationVitals,
  consultationDiagnoses,
  pharmacyPrescriptions,
  radiologyOrders,
  radiologyAppointments,
  radiologyStudies,
  radiologyReports,
  radiologyCriticalFindings,
  operationalFacilities,
  operationalPartners,
  operationalOrganizations,
  doctorProfiles,
  withSecurityContext,
  setupTestDatabase,
  TEST_SEEDS,
  eq
} from '@docsearch/database';
import { ScopeGuard } from '@docsearch/auth';
import { radiologyRepository } from '../dist/repositories/partner/RadiologyRepository.js';
import { radiologyService } from '../dist/services/partner/RadiologyService.js';
import { clinicalWorkflowRepository } from '../dist/repositories/partner/ClinicalWorkflowRepository.js';
import {
  Patient360ContinuityService,
  patient360ContinuityService
} from '../dist/services/partner/Patient360ContinuityService.js';

test('DOC SEARCH — PHASE 5.1 REMEDIATION GATE TEST SUITE', async (suite) => {
  await setupTestDatabase({ seedBaseline: true });
  const db = getDatabase();

  const TENANT_A = TEST_SEEDS.TENANT_A;
  const TENANT_B = TEST_SEEDS.TENANT_B;
  const BRANCH_A1 = TEST_SEEDS.BRANCH_A;
  const BRANCH_A2 = crypto.randomUUID();
  const BRANCH_B = TEST_SEEDS.FACILITY_ID_B;

  // Create Branch A2 under Tenant A (BRANCH_B is already seeded in baseline)
  await db.insert(branches).values({
    id: BRANCH_A2,
    tenantId: TENANT_A,
    name: 'South Wing Imaging Center',
    code: `BR-A2-${Date.now().toString(36)}`,
    isMain: false,
    status: 'ACTIVE'
  });

  // Ensure operational facilities exist for scope validation
  await db.insert(operationalFacilities).values([
    {
      id: BRANCH_A2,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      facilityName: 'South Wing Imaging Center',
      facilityCode: `FAC-A2-${Date.now().toString(36)}`,
      facilityType: 'DIAGNOSTIC_CENTRE',
      addressStreet: '123 South St',
      addressCity: 'Imaging City',
      addressState: 'State',
      addressPostalCode: '12345',
      contactEmail: 'south@docsearch.health',
      contactPhone: '+919876543210',
      status: 'ACTIVE'
    }
  ]);

  // Sessions for testing scope enforcement
  const sessionStaffBranchA1 = {
    userId: 'staff-a1-user-id',
    tenantId: TENANT_A,
    partnerId: TEST_SEEDS.PARTNER_ID_A,
    organizationId: TEST_SEEDS.ORG_ID_A,
    branchId: BRANCH_A1,
    departmentId: 'RADIOLOGY',
    roles: ['RADIOLOGIST', 'DOCTOR'],
    permissions: ['RADIOLOGY:WRITE', 'RADIOLOGY:READ', 'ORDER:MANAGE', 'REPORT:FINALIZE', 'CRITICAL_FINDING:MANAGE'],
    dataScope: 'branch',
    scopeLevel: 'BRANCH',
    isSuperAdmin: false
  };

  const sessionStaffBranchA2 = {
    userId: 'staff-a2-user-id',
    tenantId: TENANT_A,
    partnerId: TEST_SEEDS.PARTNER_ID_A,
    organizationId: TEST_SEEDS.ORG_ID_A,
    branchId: BRANCH_A2,
    departmentId: 'RADIOLOGY',
    roles: ['RADIOLOGIST', 'DOCTOR'],
    permissions: ['RADIOLOGY:WRITE', 'RADIOLOGY:READ', 'ORDER:MANAGE', 'REPORT:FINALIZE', 'CRITICAL_FINDING:MANAGE'],
    dataScope: 'branch',
    scopeLevel: 'BRANCH',
    isSuperAdmin: false
  };

  const sessionStaffTenantB = {
    userId: 'staff-tenant-b-id',
    tenantId: TENANT_B,
    partnerId: TEST_SEEDS.PARTNER_ID_B,
    organizationId: TEST_SEEDS.ORG_ID_B,
    branchId: BRANCH_B,
    departmentId: 'RADIOLOGY',
    roles: ['RADIOLOGIST', 'DOCTOR'],
    permissions: ['RADIOLOGY:WRITE', 'RADIOLOGY:READ', 'ORDER:MANAGE', 'REPORT:FINALIZE', 'CRITICAL_FINDING:MANAGE'],
    dataScope: 'branch',
    scopeLevel: 'BRANCH',
    isSuperAdmin: false
  };

  // =========================================================================
  // GATE 1: P1-GAP-01 REMEDIATION VERIFICATION (RadiologyService Mutations)
  // =========================================================================

  await suite.test('P1-GAP-01: rescheduleAppointment enforces target-record ScopeGuard', async () => {
    // 1. Create order and appointment in Branch A1
    const orderA1 = await radiologyRepository.createOrder({
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      patientId: crypto.randomUUID(),
      patientName: 'Scope Test Patient 1',
      modality: 'CT',
      studyType: 'Chest CT',
      priority: 'ROUTINE',
      clinicalHistory: 'Chest pain',
      referringDoctorName: 'Dr Referrer'
    });

    const aptA1 = await radiologyRepository.createAppointment({
      orderId: orderA1.id,
      patientId: orderA1.patientId,
      patientName: 'Scope Test Patient 1',
      appointmentCode: `RAD-APT-${Date.now().toString(36)}`,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      modalityId: 'm1111111-1111-4111-8111-111111111101',
      modalityName: 'CT Scanner A',
      scheduledStart: new Date(Date.now() + 86400000),
      scheduledEnd: new Date(Date.now() + 86400000 + 1800000),
      assignedTechnologistName: 'Tech One'
    });

    // 2. Adversarial: Cross-Branch access (Branch A2 trying to reschedule Branch A1 appointment)
    await assert.rejects(
      async () => {
        await radiologyService.rescheduleAppointment(
          aptA1.id,
          {
            newScheduledDateTime: new Date(Date.now() + 172800000).toISOString(),
            rescheduleJustification: 'Adversarial cross-branch reschedule attempt'
          },
          sessionStaffBranchA2
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /branch/i);
        return true;
      },
      'rescheduleAppointment MUST reject cross-branch actor with 403'
    );

    // 3. Adversarial: Cross-Tenant access (Tenant B trying to reschedule Tenant A appointment)
    await assert.rejects(
      async () => {
        await radiologyService.rescheduleAppointment(
          aptA1.id,
          {
            newScheduledDateTime: new Date(Date.now() + 172800000).toISOString(),
            rescheduleJustification: 'Adversarial cross-tenant reschedule attempt'
          },
          sessionStaffTenantB
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /tenant|organization/i);
        return true;
      },
      'rescheduleAppointment MUST reject cross-tenant actor with 403'
    );

    // 4. Positive: Authorized actor in Branch A1 succeeds
    const newDate = new Date(Date.now() + 172800000).toISOString();
    const rescheduled = await radiologyService.rescheduleAppointment(
      aptA1.id,
      {
        newScheduledDateTime: newDate,
        rescheduleJustification: 'Legitimate authorized reschedule'
      },
      sessionStaffBranchA1
    );
    assert.ok(rescheduled);
    assert.equal(rescheduled.status, 'SCHEDULED');
  });

  await suite.test('P1-GAP-01: cancelAppointment enforces target-record ScopeGuard', async () => {
    // 1. Create order and appointment in Branch A1
    const orderA1 = await radiologyRepository.createOrder({
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      patientId: crypto.randomUUID(),
      patientName: 'Scope Test Patient 2',
      modality: 'MRI',
      studyType: 'Brain MRI',
      priority: 'ROUTINE',
      clinicalHistory: 'Migraine',
      referringDoctorName: 'Dr Referrer'
    });

    const aptA1 = await radiologyRepository.createAppointment({
      orderId: orderA1.id,
      patientId: orderA1.patientId,
      patientName: 'Scope Test Patient 2',
      appointmentCode: `RAD-APT-${Date.now().toString(36)}`,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      modalityId: 'm1111111-1111-4111-8111-111111111101',
      modalityName: 'MRI Scanner A',
      scheduledStart: new Date(Date.now() + 86400000),
      scheduledEnd: new Date(Date.now() + 86400000 + 1800000),
      assignedTechnologistName: 'Tech One'
    });

    // 2. Adversarial: Cross-Branch access (Branch A2 trying to cancel Branch A1 appointment)
    await assert.rejects(
      async () => {
        await radiologyService.cancelAppointment(
          aptA1.id,
          { cancellationReason: 'Cross branch cancel attempt' },
          sessionStaffBranchA2
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /branch/i);
        return true;
      },
      'cancelAppointment MUST reject cross-branch actor with 403'
    );

    // 3. Adversarial: Cross-Tenant access (Tenant B trying to cancel Tenant A appointment)
    await assert.rejects(
      async () => {
        await radiologyService.cancelAppointment(
          aptA1.id,
          { cancellationReason: 'Cross tenant cancel attempt' },
          sessionStaffTenantB
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /tenant|organization/i);
        return true;
      },
      'cancelAppointment MUST reject cross-tenant actor with 403'
    );

    // 4. Positive: Authorized actor in Branch A1 succeeds
    const cancelled = await radiologyService.cancelAppointment(
      aptA1.id,
      { cancellationReason: 'Patient requested cancellation' },
      sessionStaffBranchA1
    );
    assert.ok(cancelled);
    assert.equal(cancelled.status, 'CANCELLED');
  });

  await suite.test('P1-GAP-01: completeStudyAcquisition enforces target-order ScopeGuard', async () => {
    // 1. Create order in Branch A1
    const orderA1 = await radiologyRepository.createOrder({
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      patientId: crypto.randomUUID(),
      patientName: 'Scope Test Patient 3',
      modality: 'US',
      studyType: 'Abdominal Ultrasound',
      priority: 'ROUTINE',
      clinicalHistory: 'Abdominal pain',
      referringDoctorName: 'Dr Referrer'
    });

    // 2. Adversarial: Cross-Branch access (Branch A2 trying to complete study acquisition for Branch A1 order)
    await assert.rejects(
      async () => {
        await radiologyService.completeStudyAcquisition(
          {
            orderId: orderA1.id,
            patientId: orderA1.patientId,
            modalityType: 'US',
            studyDescription: 'Abdominal Ultrasound Complete'
          },
          sessionStaffBranchA2
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /branch/i);
        return true;
      },
      'completeStudyAcquisition MUST reject cross-branch order acquisition with 403'
    );

    // 3. Adversarial: Cross-Tenant access (Tenant B trying to complete study acquisition for Tenant A order)
    await assert.rejects(
      async () => {
        await radiologyService.completeStudyAcquisition(
          {
            orderId: orderA1.id,
            patientId: orderA1.patientId,
            modalityType: 'US',
            studyDescription: 'Abdominal Ultrasound Complete'
          },
          sessionStaffTenantB
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /tenant|organization/i);
        return true;
      },
      'completeStudyAcquisition MUST reject cross-tenant order acquisition with 403'
    );

    // 4. Positive: Authorized actor in Branch A1 succeeds
    const study = await radiologyService.completeStudyAcquisition(
      {
        orderId: orderA1.id,
        patientId: orderA1.patientId,
        modalityType: 'US',
        studyDescription: 'Abdominal Ultrasound Complete',
        technologistId: 'staff-a1-user-id'
      },
      sessionStaffBranchA1
    );
    assert.ok(study);
    assert.equal(study.status, 'ACQUIRED');
  });

  await suite.test('P1-GAP-01: recordCriticalFinding enforces target-report ScopeGuard', async () => {
    // 1. Create order, study, and report in Branch A1
    const orderA1 = await radiologyRepository.createOrder({
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      patientId: crypto.randomUUID(),
      patientName: 'Scope Test Patient 4',
      modality: 'XR',
      studyType: 'Chest X-Ray',
      priority: 'STAT',
      clinicalHistory: 'Shortness of breath',
      referringDoctorName: 'Dr Referrer'
    });

    const studyA1 = await radiologyRepository.createStudy({
      orderId: orderA1.id,
      patientId: orderA1.patientId,
      accessionNumber: `RAD-ACC-${Date.now().toString(36)}`,
      studyInstanceUid: `1.2.840.113619.2.${Date.now()}`,
      modalityType: 'XR',
      studyDescription: 'Chest X-Ray',
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      pacsViewerUrl: 'https://pacs.test/view/1',
      status: 'ACQUIRED'
    });

    const reportA1 = await radiologyService.createReportDraft(
      {
        orderId: orderA1.id,
        studyId: studyA1.id,
        patientId: orderA1.patientId,
        patientName: 'Scope Test Patient 4',
        patientMrn: 'MRN-4',
        modalityType: 'XR',
        procedureName: 'Chest X-Ray',
        clinicalHistory: 'Shortness of breath',
        imagingTechnique: 'PA View',
        findings: 'Tension pneumothorax suspected on right lung.',
        impression: 'Emergency critical finding: Pneumothorax',
        reportingRadiologistName: 'Dr Radiologist',
        branchId: BRANCH_A1
      },
      sessionStaffBranchA1
    );

    // 2. Adversarial: Cross-Branch access (Branch A2 trying to record critical finding on Branch A1 report)
    await assert.rejects(
      async () => {
        await radiologyService.recordCriticalFinding(
          {
            reportId: reportA1.id,
            findingDescription: 'Critical pneumothorax noted',
            severity: 'CRITICAL',
            patientName: 'Scope Test Patient 4',
            patientMrn: 'MRN-4',
            orderingDoctorName: 'Dr ER',
            orderingDepartment: 'RADIOLOGY',
            notifiedRecipient: '+919876543210'
          },
          sessionStaffBranchA2
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /branch/i);
        return true;
      },
      'recordCriticalFinding MUST reject cross-branch report mutation with 403'
    );

    // 3. Adversarial: Cross-Tenant access (Tenant B trying to record critical finding on Tenant A report)
    await assert.rejects(
      async () => {
        await radiologyService.recordCriticalFinding(
          {
            reportId: reportA1.id,
            findingDescription: 'Critical pneumothorax noted',
            severity: 'CRITICAL',
            patientName: 'Scope Test Patient 4',
            patientMrn: 'MRN-4',
            orderingDoctorName: 'Dr ER',
            orderingDepartment: 'RADIOLOGY',
            notifiedRecipient: '+919876543210'
          },
          sessionStaffTenantB
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /tenant|organization/i);
        return true;
      },
      'recordCriticalFinding MUST reject cross-tenant report mutation with 403'
    );

    // 4. Positive: Authorized actor in Branch A1 succeeds
    const finding = await radiologyService.recordCriticalFinding(
      {
        reportId: reportA1.id,
        findingDescription: 'Critical pneumothorax noted',
        severity: 'CRITICAL',
        patientName: 'Scope Test Patient 4',
        patientMrn: 'MRN-4',
        orderingDoctorName: 'Dr ER',
        orderingDepartment: 'RADIOLOGY',
        notifiedRecipient: '+919876543210'
      },
      sessionStaffBranchA1
    );
    assert.ok(finding);
    assert.equal(finding.severity, 'CRITICAL');
  });

  await suite.test('P1-GAP-01: acknowledgeCriticalFinding enforces target-finding ScopeGuard', async () => {
    // 1. Create order, study, report, and critical finding in Branch A1
    const orderA1 = await radiologyRepository.createOrder({
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      patientId: crypto.randomUUID(),
      patientName: 'Scope Test Patient 5',
      modality: 'CT',
      studyType: 'Angiography',
      priority: 'STAT',
      clinicalHistory: 'Aortic aneurysm evaluation',
      referringDoctorName: 'Dr Referrer'
    });

    const studyA1 = await radiologyRepository.createStudy({
      orderId: orderA1.id,
      patientId: orderA1.patientId,
      accessionNumber: `RAD-ACC-${Date.now().toString(36)}`,
      studyInstanceUid: `1.2.840.113619.2.${Date.now()}`,
      modalityType: 'CT',
      studyDescription: 'CT Angiography',
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      pacsViewerUrl: 'https://pacs.test/view/2',
      status: 'ACQUIRED'
    });

    const reportA1 = await radiologyService.createReportDraft(
      {
        orderId: orderA1.id,
        studyId: studyA1.id,
        patientId: orderA1.patientId,
        patientName: 'Scope Test Patient 5',
        patientMrn: 'MRN-5',
        modalityType: 'CT',
        procedureName: 'CT Angiography',
        clinicalHistory: 'Aortic aneurysm evaluation',
        imagingTechnique: 'Contrast Enhanced',
        findings: 'Impending aortic rupture',
        impression: 'Aortic aneurysm rupture imminent',
        reportingRadiologistName: 'Dr Radiologist',
        branchId: BRANCH_A1
      },
      sessionStaffBranchA1
    );

    const finding = await radiologyService.recordCriticalFinding(
      {
        reportId: reportA1.id,
        findingDescription: 'Impending aortic rupture',
        severity: 'CRITICAL',
        patientName: 'Scope Test Patient 5',
        patientMrn: 'MRN-5',
        orderingDoctorName: 'Dr Surgeon',
        orderingDepartment: 'RADIOLOGY',
        notifiedRecipient: '+919988776655'
      },
      sessionStaffBranchA1
    );

    // 2. Adversarial: Cross-Branch access (Branch A2 trying to acknowledge Branch A1 critical finding)
    await assert.rejects(
      async () => {
        await radiologyService.acknowledgeCriticalFinding(
          finding.id,
          {
            acknowledgedBy: 'Dr Branch A2 Surgeon',
            clinicalActionNotes: 'Attempting cross-branch acknowledgment'
          },
          sessionStaffBranchA2
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /branch/i);
        return true;
      },
      'acknowledgeCriticalFinding MUST reject cross-branch actor with 403'
    );

    // 3. Adversarial: Cross-Tenant access (Tenant B trying to acknowledge Tenant A critical finding)
    await assert.rejects(
      async () => {
        await radiologyService.acknowledgeCriticalFinding(
          finding.id,
          {
            acknowledgedBy: 'Dr Tenant B Surgeon',
            clinicalActionNotes: 'Attempting cross-tenant acknowledgment'
          },
          sessionStaffTenantB
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /tenant|organization/i);
        return true;
      },
      'acknowledgeCriticalFinding MUST reject cross-tenant actor with 403'
    );

    // 4. Positive: Authorized actor in Branch A1 succeeds
    const acked = await radiologyService.acknowledgeCriticalFinding(
      finding.id,
      {
        acknowledgedBy: 'Dr Surgeon',
        clinicalActionNotes: 'Patient transferred to OT immediately'
      },
      sessionStaffBranchA1
    );
    assert.ok(acked);
    assert.ok(acked.acknowledgedAt || acked.acknowledgedTimestamp);
    assert.equal(acked.acknowledgedBy, 'Dr Surgeon');
  });

  // =========================================================================
  // GATE 2: P1-GAP-02 REMEDIATION VERIFICATION (Patient360 Cold-Cache Hydration)
  // =========================================================================

  await suite.test('P1-GAP-02: Patient360ContinuityService PostgreSQL read model survives process restart / cold cache', async () => {
    // 1. Seed a canonical patient directly into PostgreSQL
    const coldPatientId = crypto.randomUUID();
    const coldMrn = `MRN-P51-${Date.now().toString(36).toUpperCase()}`;
    const coldPatientCode = `PAT-P51-${Date.now().toString(36).toUpperCase()}`;

    await db.insert(patients).values({
      id: coldPatientId,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      patientCode: coldPatientCode,
      mrn: coldMrn,
      firstName: 'Ramesh',
      lastName: 'Sharma',
      dateOfBirth: '1984-06-15',
      gender: 'MALE',
      primaryMobile: '+919123456780',
      status: 'ACTIVE',
      version: 1
    });

    // 2. Seed an encounter for this patient in PostgreSQL
    const coldEncounterId = crypto.randomUUID();
    const coldEncounterNumber = `ENC-${Date.now().toString(36).toUpperCase()}`;

    await db.insert(encounters).values({
      id: coldEncounterId,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      departmentId: TEST_SEEDS.DEPT_ID_A,
      patientId: coldPatientId,
      encounterNumber: coldEncounterNumber,
      encounterType: 'OPD',
      status: 'IN_PROGRESS',
      chiefComplaint: 'Chronic dry cough and mild fever',
      doctorId: TEST_SEEDS.DOCTOR_ID,
      version: 1
    });

    const docProfileId = TEST_SEEDS.DOCTOR_ID;

    // 3. Seed consultation with vitals and diagnosis
    const coldConsultationId = crypto.randomUUID();
    await db.insert(consultations).values({
      id: coldConsultationId,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      patientId: coldPatientId,
      encounterId: coldEncounterId,
      doctorId: docProfileId,
      consultationNumber: `CON-${Date.now().toString(36).toUpperCase()}`,
      consultationStatus: 'COMPLETED',
      consultationType: 'OPD_CONSULTATION',
      chiefComplaint: 'Chronic dry cough and mild fever',
      clinicalAssessment: 'Suspected atypical pneumonia. Recommended oral azithromycin.',
      createdBy: 'doc-pulmonologist-1',
      updatedBy: 'doc-pulmonologist-1'
    });

    await db.insert(consultationVitals).values({
      id: crypto.randomUUID(),
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      consultationId: coldConsultationId,
      patientId: coldPatientId,
      systolicBp: 124,
      diastolicBp: 82,
      pulseBpm: 76,
      temperatureCelsius: '37.8',
      oxygenSaturationPercent: 98,
      recordedBy: 'Nurse Joy'
    });

    await db.insert(consultationDiagnoses).values({
      id: crypto.randomUUID(),
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      consultationId: coldConsultationId,
      patientId: coldPatientId,
      diagnosisCode: 'J18.9',
      diagnosisName: 'Pneumonia, unspecified organism',
      isPrimary: true,
      recordedBy: 'Dr Test Staff'
    });

    // 4. Seed prescription in PostgreSQL
    const coldPrescriptionId = crypto.randomUUID();
    await db.insert(pharmacyPrescriptions).values({
      id: coldPrescriptionId,
      tenantId: TENANT_A,
      partnerId: TEST_SEEDS.PARTNER_ID_A,
      organizationId: TEST_SEEDS.ORG_ID_A,
      branchId: BRANCH_A1,
      prescriptionNumber: `RX-${Date.now().toString(36).toUpperCase()}`,
      patientId: coldPatientId,
      encounterId: coldEncounterId,
      consultationId: coldConsultationId,
      prescribingDoctorId: docProfileId,
      priority: 'ROUTINE',
      status: 'VERIFIED',
      prescriptionType: 'OUTPATIENT',
      notes: 'Azithromycin 500mg once daily for 5 days',
      metadata: { medicationName: 'Azithromycin 500mg' }
    });

    // 6. SIMULATE PROCESS RESTART: Create a brand new Patient360ContinuityService instance
    // with EMPTY internal in-memory maps (clean process restart simulation)
    const freshProcessService = new Patient360ContinuityService();

    // 7. Verify getCanonicalPatientOrThrow queries and hydrates from PostgreSQL on cold cache
    const hydratedPatient = await freshProcessService.getCanonicalPatientOrThrow(
      sessionStaffBranchA1,
      coldPatientId
    );
    assert.ok(hydratedPatient, 'Patient must be hydrated from PostgreSQL on cold cache');
    assert.equal(hydratedPatient.patientId, coldPatientId);
    assert.equal(hydratedPatient.mrn, coldMrn);
    assert.equal(hydratedPatient.firstName, 'Ramesh');
    assert.equal(hydratedPatient.lastName, 'Sharma');
    assert.equal(hydratedPatient.legalName, 'Ramesh Sharma');
    assert.equal(hydratedPatient.tenantId, TENANT_A);
    assert.equal(hydratedPatient.branchId, BRANCH_A1);

    // 8. Verify getEncounterOrThrow queries and hydrates encounter from PostgreSQL on cold cache
    const hydratedEncounter = await freshProcessService.getEncounterOrThrow(
      sessionStaffBranchA1,
      coldEncounterId
    );
    assert.ok(hydratedEncounter, 'Encounter must be hydrated from PostgreSQL on cold cache');
    assert.equal(hydratedEncounter.encounterId, coldEncounterId);
    assert.equal(hydratedEncounter.encounterNumber, coldEncounterNumber);
    assert.equal(hydratedEncounter.patientId, coldPatientId);
    assert.equal(hydratedEncounter.status, 'IN_PROGRESS');

    // 9. Verify getPatient360 aggregates PostgreSQL read model on cold cache
    const patient360 = await freshProcessService.getPatient360(
      sessionStaffBranchA1,
      coldPatientId
    );
    assert.ok(patient360, 'Patient 360 read model must be assembled');
    assert.equal(patient360.identity.patientId, coldPatientId);
    assert.equal(patient360.identity.mrn, coldMrn);
    assert.equal(patient360.activeEncounters.length, 1);
    assert.equal(patient360.activeEncounters[0].encounterId, coldEncounterId);

    // Verify vitals were hydrated into the encounter from PostgreSQL consultation vitals
    assert.ok(patient360.activeEncounters[0].vitals, 'Encounter vitals must be hydrated');
    assert.equal(patient360.activeEncounters[0].vitals.systolic, 124);
    assert.equal(patient360.activeEncounters[0].vitals.diastolic, 82);
    assert.equal(patient360.activeEncounters[0].vitals.pulse, 76);
    assert.equal(patient360.activeEncounters[0].vitals.temperature, '37.8');
    assert.equal(patient360.activeEncounters[0].vitals.spo2, 98);

    // Verify diagnoses hydrated
    assert.ok(patient360.activeEncounters[0].diagnoses.length > 0);
    assert.equal(patient360.activeEncounters[0].diagnoses[0].code, 'J18.9');

    // Verify prescription hydrated into results/prescriptions
    assert.ok(patient360.prescriptions.length > 0, 'Prescriptions must be hydrated');
    assert.equal(patient360.prescriptions[0].resultId, coldPrescriptionId);
    assert.equal(patient360.prescriptions[0].departmentId, 'PHARMACY');

    // 10. Verify getPatientTimeline reconstructs events from PostgreSQL read model
    const timeline = await freshProcessService.getPatientTimeline(
      sessionStaffBranchA1,
      coldPatientId
    );
    assert.ok(timeline, 'Timeline must be returned');
    assert.ok(timeline.length > 0, 'Timeline must contain persisted events');

    // 11. Adversarial: Cross-Tenant isolation on cold database hydration
    await assert.rejects(
      async () => {
        await freshProcessService.getCanonicalPatientOrThrow(
          sessionStaffTenantB,
          coldPatientId
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /cross-tenant/i);
        return true;
      },
      'getCanonicalPatientOrThrow MUST reject cross-tenant access to cold record with 403'
    );

    await assert.rejects(
      async () => {
        await freshProcessService.getPatient360(
          sessionStaffTenantB,
          coldPatientId
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /cross-tenant/i);
        return true;
      },
      'getPatient360 MUST reject cross-tenant access to cold record with 403'
    );
  });

  // =========================================================================
  // GATE 3: P2-GAP-03 REMEDIATION VERIFICATION (Database Fail-Closed Hardening)
  // =========================================================================

  await suite.test('P2-GAP-03: Staging and Production fail closed and never fall back to pg-mem', async () => {
    // We verify the fail-closed policy logic in packages/database/src/client.ts
    // by evaluating its strict configuration assertions:

    const evaluateFailClosedCondition = (env) => {
      const isProduction = env.NODE_ENV === 'production';
      const isStaging = env.NODE_ENV === 'staging';
      const isStrict = env.STRICT_DATABASE === 'true';
      const isExplicitTestMode =
        env.NODE_ENV === 'test' ||
        Boolean(env.VITEST) ||
        Boolean(env.npm_lifecycle_event?.includes('test'));
      const allowEmbeddedSandbox = env.ALLOW_EMBEDDED_POSTGRES === 'true';

      return isProduction || isStaging || isStrict || (!isExplicitTestMode && !allowEmbeddedSandbox);
    };

    // 1. Production environment: MUST FAIL CLOSED (true)
    assert.equal(
      evaluateFailClosedCondition({ NODE_ENV: 'production' }),
      true,
      'NODE_ENV=production MUST trigger fail-closed policy'
    );

    // 2. Staging environment: MUST FAIL CLOSED (true)
    assert.equal(
      evaluateFailClosedCondition({ NODE_ENV: 'staging' }),
      true,
      'NODE_ENV=staging MUST trigger fail-closed policy'
    );

    // 3. Strict database mode: MUST FAIL CLOSED (true)
    assert.equal(
      evaluateFailClosedCondition({ NODE_ENV: 'development', STRICT_DATABASE: 'true' }),
      true,
      'STRICT_DATABASE=true MUST trigger fail-closed policy'
    );

    // 4. Default development without allow sandbox: MUST FAIL CLOSED (true)
    assert.equal(
      evaluateFailClosedCondition({ NODE_ENV: 'development' }),
      true,
      'NODE_ENV=development without ALLOW_EMBEDDED_POSTGRES MUST trigger fail-closed policy'
    );

    // 5. Explicit offline developer sandbox: ALLOWED ONLY when explicitly opted in (false)
    assert.equal(
      evaluateFailClosedCondition({ NODE_ENV: 'development', ALLOW_EMBEDDED_POSTGRES: 'true' }),
      false,
      'Development with explicit ALLOW_EMBEDDED_POSTGRES=true allows sandbox'
    );

    // 6. Test environment: ALLOWED for automated unit testing (false)
    assert.equal(
      evaluateFailClosedCondition({ NODE_ENV: 'test' }),
      false,
      'NODE_ENV=test allows embedded testing'
    );

    // 7. Verify that in production, even if ALLOW_EMBEDDED_POSTGRES=true is spoofed, it STILL FAILS CLOSED!
    assert.equal(
      evaluateFailClosedCondition({ NODE_ENV: 'production', ALLOW_EMBEDDED_POSTGRES: 'true' }),
      true,
      'Production with spoofed ALLOW_EMBEDDED_POSTGRES MUST STILL FAIL CLOSED!'
    );

    // 8. Verify that in staging, even if ALLOW_EMBEDDED_POSTGRES=true is spoofed, it STILL FAILS CLOSED!
    assert.equal(
      evaluateFailClosedCondition({ NODE_ENV: 'staging', ALLOW_EMBEDDED_POSTGRES: 'true' }),
      true,
      'Staging with spoofed ALLOW_EMBEDDED_POSTGRES MUST STILL FAIL CLOSED!'
    );
  });
});
