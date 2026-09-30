import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { licenseService } from '../dist/services/company/LicenseService.js';
import { signJwt } from '@docsearch/auth';
import {
  setupTestDatabase,
  eq,
  partnerProfiles,
  subscriptions,
  licenses
} from '@docsearch/database';

describe('DOC SEARCH Phase 8: Radiology / RIS / PACS Master Controlled Verification Suite (33 Scenarios)', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const EMPTY_TENANT = TENANT_B;
  const UNLICENSED_TENANT = '66666666-6666-4666-8666-666666666666';

  const BRANCH_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const BRANCH_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const BRANCH_EMPTY = BRANCH_B;

  const DOCTOR_ID = '99999999-9999-4999-8999-999999999999';
  const RADIOLOGIST_ID = '88888888-8888-4888-8888-888888888888';
  const TECH_ID = '55555555-5555-4555-8555-555555555555';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || RADIOLOGIST_ID,
      email: overrides.email || 'radiologist@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      roles: overrides.roles || ['RADIOLOGIST', 'HOD_RADIOLOGIST', 'DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'clinical:appointments:create',
        'clinical:appointments:read',
        'clinical:appointments:update',
        'clinical:encounters:create',
        'clinical:encounters:read',
        'clinical:encounters:update',
        'clinical:consultations:create',
        'clinical:consultations:read',
        'clinical:consultations:update',
        'clinical:radiology:read',
        'clinical:radiology:create',
        'clinical:radiology:update',
        'clinical:radiology:delete'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let departmentId;
  let xrayModalityId;
  let ctModalityId;
  let mriModalityId;
  let usgModalityId;
  let mammoModalityId;
  let ctProcedureId;

  let patientId;
  let patientMrn;
  let encounterId;
  let bridgedOrderId;
  let routineOrderId;
  let urgentOrderId;
  let statOrderId;

  let appointmentId;
  let cancellableAppointmentId;

  let ctStudyId;
  let ctSeriesId;
  let ctInstanceId;
  let reportId;
  let criticalFindingId;
  let zeroStateSnapshot;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';

    app = await buildApp({ db: testDb });
    await app.ready();

    const token = createTestToken();

    // Capture authentic empty zero-state on TENANT_A BEFORE provisioning any radiology records
    const [zDept, zMod, zOrd, zOv] = await Promise.all([
      app.inject({ method: 'GET', url: '/api/v1/partner/radiology/department', headers: { Authorization: `Bearer ${token}` } }),
      app.inject({ method: 'GET', url: '/api/v1/partner/radiology/modalities', headers: { Authorization: `Bearer ${token}` } }),
      app.inject({ method: 'GET', url: '/api/v1/partner/radiology/orders', headers: { Authorization: `Bearer ${token}` } }),
      app.inject({ method: 'GET', url: '/api/v1/partner/radiology/overview', headers: { Authorization: `Bearer ${token}` } })
    ]);
    zeroStateSnapshot = {
      deptStatus: zDept.statusCode,
      deptBody: JSON.parse(zDept.body),
      modStatus: zMod.statusCode,
      modBody: JSON.parse(zMod.body),
      ordStatus: zOrd.statusCode,
      ordBody: JSON.parse(zOrd.body),
      ovStatus: zOv.statusCode,
      ovBody: JSON.parse(zOv.body)
    };

    // Provision Department, 5 Modalities, and Procedure Catalog for TENANT_A
    const deptRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/department',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        departmentCode: 'RAD-CORE-01',
        departmentName: 'Department of Radiology & Advanced Imaging',
        aerbLicenseNumber: 'AERB/ISD/2026/8801',
        pcpndtRegistrationNumber: 'PCPNDT/MH/2026/1102',
        pacsAeTitle: 'DOCSEARCH_PACS_SCP',
        dicomPort: 11112,
        headRadiologistName: 'Dr. Vikramaditya Sen, MD',
        radiationSafetyOfficerName: 'Mr. S. K. Nair, RSO'
      }
    });
    const deptBody = JSON.parse(deptRes.body);
    departmentId = deptBody.id || deptBody.data?.id;

    const modalitiesToSeed = [
      { code: 'XR-01', name: 'Philips DigitalDiagnost C90 DR', type: 'X_RAY_DIGITAL_RADIOGRAPHY', ae: 'XR_PHILIPS_01', room: 'R-101' },
      { code: 'CT-01', name: 'Siemens SOMATOM Force 128-Slice CT', type: 'COMPUTED_TOMOGRAPHY_CT', ae: 'CT_SIEMENS_01', room: 'R-102' },
      { code: 'MR-01', name: 'GE Signa Architect 3.0T MRI', type: 'MAGNETIC_RESR_IMAGING_MRI', ae: 'MR_GE_3T_01', room: 'R-103' },
      { code: 'US-01', name: 'GE Voluson E10 4D Ultrasound', type: 'ULTRASOUND_SONOGRAPHY_USG', ae: 'US_VOLUSON_01', room: 'R-104' },
      { code: 'MG-01', name: 'Hologic Selenia Dimensions 3D Mammography', type: 'MAMMOGRAPHY', ae: 'MG_HOLOGIC_01', room: 'R-105' }
    ];

    for (const m of modalitiesToSeed) {
      const mRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/radiology/modalities',
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          departmentId,
          modalityCode: m.code,
          modalityName: m.name,
          modalityType: m.type,
          manufacturerModel: m.name,
          dicomAeTitle: m.ae,
          roomNumber: m.room,
          dailySlotCapacity: 32
        }
      });
      const mBody = JSON.parse(mRes.body);
      const id = mBody.id || mBody.data?.id;
      if (m.code === 'XR-01') xrayModalityId = id;
      if (m.code === 'CT-01') ctModalityId = id;
      if (m.code === 'MR-01') mriModalityId = id;
      if (m.code === 'US-01') usgModalityId = id;
      if (m.code === 'MG-01') mammoModalityId = id;
    }

    const procRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/procedures',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        procedureCode: 'PROC-CT-CHEST-HRCT',
        procedureName: 'HRCT Chest (High Resolution Computed Tomography)',
        modalityType: 'COMPUTED_TOMOGRAPHY_CT',
        bodyRegion: 'THORAX',
        requiresContrast: false,
        requiresFasting: false,
        estimatedDurationMinutes: 20,
        standardTurnaroundHours: 4,
        standardChargeAmount: '4500.00'
      }
    });
    const procBody = JSON.parse(procRes.body);
    ctProcedureId = procBody.id || procBody.data?.id;

    // Register real patient & OPD encounter for OPD -> Radiology continuity
    const patRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Rohan',
        lastName: 'Deshmukh',
        gender: 'MALE',
        dateOfBirth: '1985-04-12',
        mobileNumber: '+91-9820112233',
        bloodGroup: 'B_POSITIVE'
      }
    });
    const patBody = JSON.parse(patRes.body);
    patientId = patBody.data.id;
    patientMrn = patBody.data.mrn;

    const apptRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/appointments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        doctorId: DOCTOR_ID,
        slotTime: '2026-10-20T09:00:00.000Z',
        appointmentType: 'OPD',
        reason: 'Acute dyspnea and pleuritic chest pain'
      }
    });
    const opdApptId = JSON.parse(apptRes.body).data.id;

    const checkInRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/clinical/appointments/${opdApptId}/check-in`,
      headers: { Authorization: `Bearer ${token}` }
    });
    encounterId = JSON.parse(checkInRes.body).data.encounter.id;
  });

  after(async () => {
    if (app) await app.close();
    if (testDb?.cleanup) await testDb.cleanup();
  });

  // =========================================================================
  // 1. DOCTOR CREATES IMAGING ORDER (OPD CONSULTATION BRIDGE + DIRECT)
  // =========================================================================
  it('01. Doctor creates imaging order via OPD Consultation Bridge (P0-03) and persists in radiology_orders without duplicates', async () => {
    const token = createTestToken({ userId: DOCTOR_ID, roles: ['DOCTOR'] });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        encounterId,
        patientId,
        doctorId: DOCTOR_ID,
        chiefComplaint: 'Suspected interstitial lung disease',
        assessmentNotes: 'Bilateral basal crepitations',
        imagingOrders: [
          {
            procedureId: ctProcedureId,
            procedureName: 'HRCT Chest (High Resolution Computed Tomography)',
            modalityType: 'COMPUTED_TOMOGRAPHY_CT',
            priority: 'URGENT_WITHIN_4_HOURS',
            clinicalIndication: 'Evaluate interstitial lung parenchymal changes'
          }
        ]
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body.data.radiologyOrders));
    assert.strictEqual(body.data.radiologyOrders.length, 1);
    bridgedOrderId = body.data.radiologyOrders[0].id;
    assert.ok(bridgedOrderId);

    // Verify idempotency / no duplicate order creation on repeat save
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/consultations',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        encounterId,
        patientId,
        doctorId: DOCTOR_ID,
        chiefComplaint: 'Suspected interstitial lung disease',
        imagingOrders: [
          {
            procedureId: ctProcedureId,
            procedureName: 'HRCT Chest (High Resolution Computed Tomography)',
            modalityType: 'COMPUTED_TOMOGRAPHY_CT'
          }
        ]
      }
    });
    const dupBody = JSON.parse(dupRes.body);
    assert.strictEqual(dupBody.data.radiologyOrders[0].id, bridgedOrderId);
  });

  // =========================================================================
  // 2. ROUTINE / URGENT / STAT PRIORITY ORDERS
  // =========================================================================
  it('02. Supports ROUTINE, URGENT, and STAT priority radiology orders with PostgreSQL persistence', async () => {
    const token = createTestToken();
    const priorities = ['ROUTINE_ELECTIVE', 'URGENT_WITHIN_4_HOURS', 'STAT_EMERGENCY_IMMEDIATE'];
    const createdIds = [];

    for (const priority of priorities) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/radiology/orders',
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          patientId,
          patientName: 'Rohan Deshmukh',
          patientMrn,
          encounterId,
          orderingDoctorName: 'Dr. Rajesh Sharma, MD',
          orderingDepartment: 'Pulmonology',
          procedureId: ctProcedureId,
          procedureName: 'HRCT Chest (High Resolution Computed Tomography)',
          modalityType: 'COMPUTED_TOMOGRAPHY_CT',
          priority,
          clinicalIndication: `Clinical priority verification (${priority})`
        }
      });
      assert.strictEqual(res.statusCode, 201);
      const order = JSON.parse(res.body).data;
      assert.strictEqual(order.priority, priority);
      createdIds.push(order.id);
    }

    routineOrderId = createdIds[0];
    urgentOrderId = createdIds[1];
    statOrderId = createdIds[2];
    assert.ok(routineOrderId && urgentOrderId && statOrderId);
  });

  // =========================================================================
  // 3 - 7. FIVE-MODALITY CAPABILITIES (X-RAY, CT, MRI, ULTRASOUND, MAMMOGRAPHY)
  // =========================================================================
  it('03. X-Ray workflow persists structured view and laterality metadata', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/studies',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: routineOrderId,
        modalityType: 'X_RAY_DIGITAL_RADIOGRAPHY',
        studyDescription: 'Digital Chest Radiography PA & Lateral',
        view: 'PA_AND_LATERAL',
        laterality: 'BILATERAL'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const study = JSON.parse(res.body).data;
    assert.strictEqual(study.modalityMetadata.modalityCategory, 'X_RAY');
    assert.strictEqual(study.modalityMetadata.view, 'PA_AND_LATERAL');
    assert.strictEqual(study.modalityMetadata.laterality, 'BILATERAL');
  });

  it('04. CT workflow persists contrast, slice thickness, and radiation DLP metadata', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/studies',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: bridgedOrderId,
        modalityType: 'COMPUTED_TOMOGRAPHY_CT',
        studyDescription: 'HRCT Chest Volumetric Acquisition',
        contrast: false,
        sliceThickness: '0.625mm',
        radiationDoseDlpMgyCm: '285.40'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const study = JSON.parse(res.body).data;
    ctStudyId = study.id;
    assert.strictEqual(study.modalityMetadata.modalityCategory, 'CT');
    assert.strictEqual(study.modalityMetadata.sliceThickness, '0.625mm');
    assert.strictEqual(study.modalityMetadata.radiationDlp, '285.40');
  });

  it('05. MRI workflow persists pulse sequences, field strength, and metal safety clearance', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/studies',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: urgentOrderId,
        modalityType: 'MAGNETIC_RESONANCE_IMAGING_MRI',
        studyDescription: 'MRI Brain Multiplanar 3.0T',
        sequences: ['T1_MPRAGE', 'T2_TSE', 'FLAIR', 'DWI_ADC'],
        fieldStrength: '3.0T',
        mriMetalScreeningCleared: true
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const study = JSON.parse(res.body).data;
    assert.strictEqual(study.modalityMetadata.modalityCategory, 'MRI');
    assert.strictEqual(study.modalityMetadata.fieldStrength, '3.0T');
    assert.strictEqual(study.modalityMetadata.metalSafetyClearance, true);
    assert.ok(study.modalityMetadata.sequences.includes('FLAIR'));
  });

  it('06. Ultrasound workflow persists structured organ and hemodynamic study measurements', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/studies',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: statOrderId,
        modalityType: 'ULTRASOUND_SONOGRAPHY_USG',
        studyDescription: 'USG Whole Abdomen & Hepatobiliary',
        organMeasurements: { liverSpanCm: 14.1, portalVeinDiameterMm: 10.5, spleenLengthCm: 9.8 },
        studyMeasurements: { hepaticArteryResistiveIndex: 0.64 }
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const study = JSON.parse(res.body).data;
    assert.strictEqual(study.modalityMetadata.modalityCategory, 'ULTRASOUND');
    assert.strictEqual(study.modalityMetadata.organMeasurements.liverSpanCm, 14.1);
  });

  it('07. Mammography workflow persists laterality, views, breast density, and preliminary BI-RADS', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/studies',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: routineOrderId,
        modalityType: 'MAMMOGRAPHY',
        studyDescription: 'Bilateral Digital Breast Tomosynthesis',
        laterality: 'BILATERAL',
        views: ['CC', 'MLO'],
        breastDensity: 'ACR_C_HETEROGENEOUSLY_DENSE',
        preliminaryBiRads: 'BI_RADS_2_BENIGN'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const study = JSON.parse(res.body).data;
    assert.strictEqual(study.modalityMetadata.modalityCategory, 'MAMMOGRAPHY');
    assert.strictEqual(study.modalityMetadata.breastDensity, 'ACR_C_HETEROGENEOUSLY_DENSE');
    assert.strictEqual(study.modalityMetadata.preliminaryBiRads, 'BI_RADS_2_BENIGN');
  });

  // =========================================================================
  // 8 - 11. SCHEDULING, CONFLICT PREVENTION, RESCHEDULING, CANCELLATION
  // =========================================================================
  it('08. Schedules radiology appointment on tenant-validated modality without hardcoded UUIDs (P1-05)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/appointments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: bridgedOrderId,
        modalityId: ctModalityId,
        patientName: 'Rohan Deshmukh',
        patientMrn,
        roomNumber: 'R-102',
        scheduledStart: '2026-11-10T09:00:00.000Z',
        scheduledEnd: '2026-11-10T09:30:00.000Z',
        assignedTechnologistName: 'Rajesh Kumar, RT'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const appt = JSON.parse(res.body).data;
    appointmentId = appt.id;
    assert.strictEqual(appt.modalityId, ctModalityId);
  });

  it('09. Conflict prevention blocks overlapping booking on same modality with 409 Conflict', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/appointments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: urgentOrderId,
        modalityId: ctModalityId,
        patientName: 'Rohan Deshmukh',
        patientMrn,
        roomNumber: 'R-102',
        scheduledStart: '2026-11-10T09:10:00.000Z',
        scheduledEnd: '2026-11-10T09:40:00.000Z'
      }
    });

    assert.strictEqual(res.statusCode, 409);
  });

  it('10. Reschedules radiology appointment cleanly to non-conflicting window', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/appointments/${appointmentId}/reschedule`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        newScheduledDateTime: '2026-11-10T11:00:00.000Z',
        rescheduleJustification: 'Patient arrived after morning fasting completion'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const updated = JSON.parse(res.body).data;
    assert.strictEqual(new Date(updated.scheduledStart).toISOString(), '2026-11-10T11:00:00.000Z');
  });

  it('11. Cancels radiology appointment and persists CANCELLED status', async () => {
    const token = createTestToken();
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/appointments',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: routineOrderId,
        modalityId: xrayModalityId,
        patientName: 'Rohan Deshmukh',
        patientMrn,
        roomNumber: 'R-101',
        scheduledStart: '2026-11-10T14:00:00.000Z',
        scheduledEnd: '2026-11-10T14:30:00.000Z'
      }
    });
    cancellableAppointmentId = JSON.parse(createRes.body).data.id;

    const cancelRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/appointments/${cancellableAppointmentId}/cancel`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        cancellationReason: 'Duplicate chest X-ray no longer needed after HRCT'
      }
    });

    assert.strictEqual(cancelRes.statusCode, 200);
    assert.strictEqual(JSON.parse(cancelRes.body).data.status, 'CANCELLED');
  });

  // =========================================================================
  // 12 - 14. CLINICAL SAFETY GATES (MRI METAL, PREGNANCY/RADIATION, CT CONTRAST/eGFR)
  // =========================================================================
  it('12. MRI safety gate blocks preparation/acquisition when metal screening is not cleared (400)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/preparation-records',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: urgentOrderId,
        modalityType: 'MAGNETIC_RESONANCE_IMAGING_MRI',
        patientName: 'Rohan Deshmukh',
        mriMetalScreeningCleared: false
      }
    });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.includes('MRI safety gate failed'));
  });

  it('13. Ionizing radiation safety gate blocks preparation when pregnancy screening is not negative (400)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/preparation-records',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: bridgedOrderId,
        modalityType: 'COMPUTED_TOMOGRAPHY_CT',
        patientName: 'Priya Verma',
        pregnancyStatusConfirmedNegative: false
      }
    });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.includes('Radiation safety gate failed'));
  });

  it('14. CT contrast safety gate blocks preparation when renal eGFR is inadequate (< 30) (400)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/preparation-records',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        orderId: bridgedOrderId,
        modalityType: 'COMPUTED_TOMOGRAPHY_CT',
        patientName: 'Rohan Deshmukh',
        requiresContrast: true,
        renalEgfrResult: '21 mL/min/1.73m2',
        renalEgfrAdequate: false
      }
    });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.includes('Contrast safety gate failed'));
  });

  // =========================================================================
  // 15 - 17. DICOM STUDY -> SERIES -> INSTANCES HIERARCHY (P1-01, P1-02, P2-02)
  // =========================================================================
  it('15. Verifies Study persistence with standards-compliant DICOM UID root (1.2.840.10008.2026.1)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/studies/${ctStudyId}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const study = JSON.parse(res.body).data;
    assert.ok(study.studyInstanceUid.startsWith('1.2.840.10008.2026.1.'));
  });

  it('16. Creates DICOM Series (imaging_series) linked to Radiology Study (P1-01)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/series',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        studyId: ctStudyId,
        seriesNumber: 1,
        modality: 'CT',
        seriesDescription: 'Lung Window 0.625mm High Resolution Kernel',
        bodyPartExamined: 'CHEST',
        protocolName: 'HRCT_THORAX_VOLUMETRIC',
        numberOfInstances: 320
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const series = JSON.parse(res.body).data;
    ctSeriesId = series.id;
    assert.strictEqual(series.studyId, ctStudyId);
    assert.ok(series.seriesInstanceUid.startsWith('1.2.840.10008.2026.2.'));
  });

  it('17. Creates DICOM Instance (imaging_instances) linked to Series with SOP Instance UID & pixel metadata (P1-02)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/instances',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        studyId: ctStudyId,
        seriesId: ctSeriesId,
        instanceNumber: 1,
        sopClassUid: '1.2.840.10008.5.1.4.1.1.2',
        rows: 512,
        columns: 512,
        bitsAllocated: 16,
        bitsStored: 12,
        windowCenter: '-600',
        windowWidth: '1500',
        sliceThickness: '0.625',
        sliceLocation: '-124.5'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const inst = JSON.parse(res.body).data;
    ctInstanceId = inst.id;
    assert.strictEqual(inst.seriesId, ctSeriesId);
    assert.strictEqual(inst.studyId, ctStudyId);
    assert.ok(inst.sopInstanceUid.startsWith('1.2.840.10008.2026.3.'));
  });

  // =========================================================================
  // 18 - 21. RADIOLOGIST DRAFT, FINALIZATION, DIGITAL SIGNATURE, IMMUTABLE AMENDMENT
  // =========================================================================
  it('18. Creates structured Radiologist Report Draft linked to Study & Order', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/reports',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        studyId: ctStudyId,
        orderId: bridgedOrderId,
        patientName: 'Rohan Deshmukh',
        patientMrn,
        modalityType: 'COMPUTED_TOMOGRAPHY_CT',
        procedureName: 'HRCT Chest (High Resolution Computed Tomography)',
        clinicalHistory: 'Progressive dyspnea',
        imagingTechnique: 'Volumetric 0.625mm thin-section reconstruction',
        findings: 'Subpleural reticular opacities in bilateral lower lobes with minimal traction bronchiectasis.',
        impression: 'Early fibrotic interstitial lung pattern (UIP-like features).',
        recommendations: 'Pulmonology correlation and PFT/DLCO.',
        hasCriticalFinding: true,
        reportingRadiologistName: 'Dr. Vikramaditya Sen, MD'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const report = JSON.parse(res.body).data;
    reportId = report.id;
    assert.strictEqual(report.status, 'DRAFT');
  });

  it('19. Finalizes report with cryptographic Digital Signature', async () => {
    const token = createTestToken();
    const finRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/radiology/reports/${reportId}/finalize`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        verifyingRadiologistName: 'Dr. Vikramaditya Sen, MD (HOD Radiology)'
      }
    });

    assert.strictEqual(finRes.statusCode, 200);
    const finalized = JSON.parse(finRes.body).data;
    assert.strictEqual(finalized.status, 'FINALIZED');
    assert.ok(finalized.digitalSignature.startsWith('SIG_RAD_SHA256_'));
    assert.strictEqual(finalized.signedBy, 'Dr. Vikramaditya Sen, MD (HOD Radiology)');
  });

  it('20. Blocks repeat finalization on already-finalized report with 409 Conflict', async () => {
    const token = createTestToken();
    const dupFin = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/radiology/reports/${reportId}/finalize`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {}
    });
    assert.strictEqual(dupFin.statusCode, 409);
  });

  it('21. Performs immutable Report Amendment (v1 -> v2) preserving original findings in radiology_report_amendments (P2-01)', async () => {
    const token = createTestToken();
    const amendRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/radiology/reports/${reportId}/amend`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amendmentReason: 'Added quantitative honeycombing score and mediastinal lymph node measurement.',
        findings: 'Subpleural reticular opacities with basal honeycombing (<5%) and 11mm subcarinal node.',
        impression: 'Definite UIP pattern with mild reactive mediastinal adenopathy.',
        verifyingRadiologistName: 'Dr. Vikramaditya Sen, MD'
      }
    });

    assert.strictEqual(amendRes.statusCode, 200);
    const amended = JSON.parse(amendRes.body).data;
    assert.strictEqual(amended.status, 'AMENDED');
    assert.strictEqual(amended.version, 2);

    const historyRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/reports/${reportId}/amendments`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(historyRes.statusCode, 200);
    const historyBody = JSON.parse(historyRes.body);
    const amendments = Array.isArray(historyBody) ? historyBody : (historyBody.data || []);
    assert.strictEqual(amendments.length, 1);
    assert.strictEqual(amendments[0].versionFrom, 1);
    assert.strictEqual(amendments[0].versionTo, 2);
    assert.ok(amendments[0].previousFindings.includes('Subpleural reticular opacities in bilateral lower lobes'));
  });

  // =========================================================================
  // 22 - 24. CRITICAL FINDING ALERT, CLINICIAN ACKNOWLEDGEMENT & VERBAL READ-BACK
  // =========================================================================
  it('22. Flags Critical Finding Alert linked to finalized radiology report', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/radiology/critical-findings',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        reportId,
        patientName: 'Rohan Deshmukh',
        patientMrn,
        orderingDoctorName: 'Dr. Rajesh Sharma, MD',
        orderingDepartment: 'Pulmonology',
        findingDescription: 'Suspected small loculated pneumothorax on apical slice.',
        severity: 'CRITICAL_LIFE_THREATENING',
        flaggedByRadiologist: 'Dr. Vikramaditya Sen, MD',
        notifiedRecipient: 'Dr. Rajesh Sharma, MD'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const finding = JSON.parse(res.body).data;
    criticalFindingId = finding.id;
    assert.strictEqual(finding.status, 'FLAGGED_PENDING_NOTIFICATION');
  });

  it('23. Records Clinician Acknowledgement of critical radiology finding', async () => {
    const token = createTestToken({ userId: DOCTOR_ID, roles: ['DOCTOR'] });
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/radiology/critical-findings/${criticalFindingId}/acknowledge`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        acknowledgedBy: 'Dr. Rajesh Sharma, MD',
        readBackIntimationRecord: 'Verbal read-back verified by Dr. Rajesh Sharma at 16:45 IST; chest tube tray on standby.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const ack = JSON.parse(res.body).data;
    assert.strictEqual(ack.status, 'ACKNOWLEDGED_BY_CLINICIAN');
  });

  it('24. Persists and retrieves Verbal Read-Back / Intimation record in PostgreSQL', async () => {
    const token = createTestToken({ userId: DOCTOR_ID, roles: ['DOCTOR'] });
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/radiology/critical-findings',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(listRes.statusCode, 200);
    const listBody = JSON.parse(listRes.body);
    const list = Array.isArray(listBody) ? listBody : (listBody.data || []);
    const found = list.find((f) => f.id === criticalFindingId);
    assert.ok(found);
    assert.strictEqual(found.readBackVerified, true);
    assert.ok(found.readBackIntimationRecord.includes('Verbal read-back verified by Dr. Rajesh Sharma'));
  });

  // =========================================================================
  // 25 & 26. DOCTOR REVIEW & PATIENT 360 CONTINUITY
  // =========================================================================
  it('25. Records ordering Doctor Review & clinical correlation on finalized report', async () => {
    const token = createTestToken({ userId: DOCTOR_ID, roles: ['DOCTOR'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/radiology/reports/${reportId}/review`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        reviewedByDoctorName: 'Dr. Rajesh Sharma, MD',
        clinicalCorrelationNotes: 'HRCT findings discussed with patient; antifibrotic therapy initiated.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const reviewed = JSON.parse(res.body).data;
    assert.strictEqual(reviewed.doctorReview.reviewedByDoctorName, 'Dr. Rajesh Sharma, MD');
    assert.strictEqual(reviewed.doctorReview.deliveryStatus, 'DELIVERED_TO_CLINICIAN_AND_PATIENT_360');
  });

  it('26. Integrates Radiology Orders, Studies, and Finalized Reports into Patient 360 Clinical Timeline (P1-04)', async () => {
    const token = createTestToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/clinical/patients/${patientId}/history`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const history = JSON.parse(res.body).data;
    assert.ok(Array.isArray(history.radiologyOrders) && history.radiologyOrders.length >= 1);
    assert.ok(Array.isArray(history.radiologyStudies) && history.radiologyStudies.length >= 1);
    assert.ok(Array.isArray(history.radiologyReports) && history.radiologyReports.length >= 1);
    assert.ok(history.timeline.some((e) => e.type === 'RADIOLOGY_ORDER'));
    assert.ok(history.timeline.some((e) => e.type === 'RADIOLOGY_STUDY'));
    assert.ok(history.timeline.some((e) => e.type === 'RADIOLOGY_REPORT'));
  });

  // =========================================================================
  // 27. RADIOLOGY BILLING CONTINUITY (P1-03)
  // =========================================================================
  it('27. Generates RADIOLOGY invoice line item from configured procedure catalog price without hardcoding (P1-03)', async () => {
    const token = createTestToken();
    const billRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/radiology/orders/${bridgedOrderId}/bill`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { paymentStatus: 'PAID' }
    });

    assert.strictEqual(billRes.statusCode, 201);
    const billed = JSON.parse(billRes.body).data;
    assert.strictEqual(billed.category, 'RADIOLOGY');
    assert.strictEqual(billed.chargedAmount, '4500.00');
    assert.strictEqual(billed.lineItem.serviceCode, 'PROC-CT-CHEST-HRCT');

    const getInvRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/orders/${bridgedOrderId}/invoice`,
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(getInvRes.statusCode, 200);
    const invData = JSON.parse(getInvRes.body).data;
    assert.strictEqual(invData.invoice.totalAmount, '4500.00');
    assert.strictEqual(invData.category, 'RADIOLOGY');
  });

  // =========================================================================
  // 28. EMPTY-PARTNER ZERO-STATE VERIFICATION (P0-01)
  // =========================================================================
  it('28. Empty partner account returns authentic zero-state with no mock fallbacks', async () => {
    assert.strictEqual(zeroStateSnapshot.deptStatus, 200);
    assert.ok(zeroStateSnapshot.deptBody === null || zeroStateSnapshot.deptBody?.data === null);

    assert.strictEqual(zeroStateSnapshot.modStatus, 200);
    const modItems = Array.isArray(zeroStateSnapshot.modBody) ? zeroStateSnapshot.modBody : zeroStateSnapshot.modBody.data;
    assert.deepStrictEqual(modItems, []);

    assert.strictEqual(zeroStateSnapshot.ordStatus, 200);
    assert.deepStrictEqual(zeroStateSnapshot.ordBody.items, []);
    assert.strictEqual(zeroStateSnapshot.ordBody.total, 0);

    assert.strictEqual(zeroStateSnapshot.ovStatus, 200);
    const ov = zeroStateSnapshot.ovBody.data || zeroStateSnapshot.ovBody;
    assert.strictEqual(ov.totalOrdersCount, 0);
    assert.strictEqual(ov.completedStudiesTodayCount, 0);
    assert.strictEqual(ov.finalizedReportsCount, 0);
  });

  // =========================================================================
  // 29 - 33. CROSS-TENANT ISOLATION, RBAC & COMMERCIAL ENTITLEMENT ENFORCEMENT
  // =========================================================================
  it('29. Cross-tenant order access by Tenant B is denied (403/404)', async () => {
    const tenantBToken = createTestToken({ tenantId: TENANT_B, branchId: BRANCH_B });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/orders/${bridgedOrderId}`,
      headers: { Authorization: `Bearer ${tenantBToken}` }
    });
    assert.ok([403, 404].includes(res.statusCode));
  });

  it('30. Cross-tenant study access by Tenant B is denied (403/404)', async () => {
    const tenantBToken = createTestToken({ tenantId: TENANT_B, branchId: BRANCH_B });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/studies/${ctStudyId}`,
      headers: { Authorization: `Bearer ${tenantBToken}` }
    });
    assert.ok([403, 404].includes(res.statusCode));
  });

  it('31. Cross-tenant report access by Tenant B is denied (403/404)', async () => {
    const tenantBToken = createTestToken({ tenantId: TENANT_B, branchId: BRANCH_B });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/radiology/reports/${reportId}`,
      headers: { Authorization: `Bearer ${tenantBToken}` }
    });
    assert.ok([403, 404].includes(res.statusCode));
  });

  it('32. RBAC enforcement denies RADIOLOGY_TECHNOLOGIST from finalizing radiologist reports (403 Forbidden) (P0-04)', async () => {
    const techToken = createTestToken({
      userId: TECH_ID,
      roles: ['RADIOLOGY_TECHNOLOGIST'],
      permissions: ['clinical:radiology:read', 'clinical:radiology:create', 'clinical:radiology:update']
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/radiology/reports/${reportId}/finalize`,
      headers: { Authorization: `Bearer ${techToken}` },
      payload: {}
    });
    assert.strictEqual(res.statusCode, 403);
  });

  it('33. Commercial entitlement guard blocks unlicensed tenant with 403 COMMERCIAL_ACCESS_DENIED (P0-02)', async () => {
    const unlicensedToken = createTestToken({
      tenantId: UNLICENSED_TENANT,
      branchId: UNLICENSED_TENANT,
      roles: ['HOSPITAL_ADMIN', 'RADIOLOGIST']
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/radiology/overview',
      headers: { Authorization: `Bearer ${unlicensedToken}` }
    });
    assert.strictEqual(res.statusCode, 403);
  });
});
