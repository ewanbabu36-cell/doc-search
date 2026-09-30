import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase } from '@docsearch/database';

describe('DOC SEARCH Phase 7: LIMS / Pathology Master Controlled Verification Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const BRANCH_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const BRANCH_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const DOCTOR_ID = '99999999-9999-4999-8999-999999999999';
  const PATHOLOGIST_ID = '77777777-7777-4777-8777-777777777777';
  const TECH_ID = '66666666-6666-4666-8666-666666666666';

  function createToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || DOCTOR_ID,
      email: overrides.email || 'pathologist@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : TENANT_A,
      branchId: overrides.branchId !== undefined ? overrides.branchId : BRANCH_A,
      roles: overrides.roles || ['PATHOLOGIST', 'DOCTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'clinical:patients:create',
        'clinical:patients:read',
        'lab:orders:create',
        'lab:orders:read',
        'lab:orders:update',
        'lab:orders:print',
        'lab:specimens:create',
        'lab:specimens:read',
        'lab:specimens:update',
        'lab:results:create',
        'lab:results:read',
        'lab:results:update',
        'lab:results:validate'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let patientId;
  let patientMrn;
  let primaryOrderId;
  let primaryOrderNumber;
  let primaryBarcode;
  let rejectedOrderId;
  let catalogTestId;
  let panelId;

  before(async () => {
    testDb = await setupTestDatabase();
    process.env['JWT_SECRET'] = MASTER_SECRET;
    process.env['NODE_ENV'] = 'development';
    app = await buildApp({ db: testDb });
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
    if (testDb) await testDb.cleanup();
  });

  // =========================================================================
  // SETUP: REGISTER PATIENT IN CLINICAL MODULE
  // =========================================================================
  it('SETUP: Register patient in clinical domain', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/clinical/patients',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Anita',
        lastName: 'Rao',
        gender: 'FEMALE',
        dateOfBirth: '1988-04-15',
        mobileNumber: '+91-9876543210',
        bloodGroup: 'B_POSITIVE'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.ok(body.data.mrn);
    patientId = body.data.id;
    patientMrn = body.data.mrn;
  });

  // =========================================================================
  // PRIMARY 10-STEP LIFECYCLE
  // ORDER → SAMPLE → ACCESSION → PROCESSING → RESULT → TECH VALIDATION → PATH VALIDATION → REVIEW → REPORT → DELIVERY
  // =========================================================================

  it('STEP 1: Doctor places laboratory investigation order (POST /api/v1/partner/lab/orders)', async () => {
    const token = createToken({ userId: DOCTOR_ID, roles: ['DOCTOR'] });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/orders',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        patientId,
        patientMrn,
        patientName: 'Anita Rao',
        orderingDoctorId: DOCTOR_ID,
        orderingDoctorName: 'Dr. Rajesh Sharma, MD',
        testCode: 'CBC',
        testName: 'Complete Blood Count with Differential',
        category: 'HEMATOLOGY',
        priority: 'ROUTINE',
        clinicalIndication: 'Pre-operative routine screening'
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.ok(body.data.orderNumber);
    assert.strictEqual(body.data.status, 'ORDERED');
    assert.strictEqual(body.data.testCode, 'CBC');
    primaryOrderId = body.data.id;
    primaryOrderNumber = body.data.orderNumber;
  });

  it('STEP 2: Phlebotomist collects specimen sample (POST /api/v1/partner/lab/orders/:id/collect-sample)', async () => {
    const token = createToken({ userId: TECH_ID, roles: ['LAB_TECHNICIAN'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/collect-sample`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        specimenType: 'WHOLE_BLOOD',
        containerType: 'EDTA_LAVENDER_TOP',
        collectionSite: 'LEFT_ANTECUBITAL_FOSSA',
        collectedBy: 'Nurse Sunita / Phlebotomist',
        collectionNotes: 'Clean venipuncture, 3 mL drawn without hemolysis'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'SAMPLE_COLLECTED');
    assert.ok(body.data.specimens && body.data.specimens.length > 0);
    const spec = body.data.specimens[0];
    assert.ok(spec.accessionNumber || spec.barcode);
    primaryBarcode = spec.accessionNumber || spec.barcode;
  });

  it('STEP 3: Central Lab accessions specimen at receiving station (POST /api/v1/partner/lab/orders/:id/accession)', async () => {
    const token = createToken({ userId: TECH_ID, roles: ['LAB_TECHNICIAN'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/accession`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        workstationId: 'WS-HEM-RECV-01',
        qualityRemarks: 'Specimen intact, no clots, tube correctly labeled',
        receivedBy: TECH_ID
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'ACCESSIONED');
    assert.strictEqual(body.data.metadata.accessionedBy, TECH_ID);
    assert.strictEqual(body.data.metadata.workstationId, 'WS-HEM-RECV-01');
  });

  it('STEP 4: Technologist starts analyzer run / specimen processing (POST /api/v1/partner/lab/orders/:id/process)', async () => {
    const token = createToken({ userId: TECH_ID, roles: ['LAB_TECHNICIAN'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/process`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        analyzerId: 'ANALYZER-SYS-XN550',
        workstationId: 'WS-HEM-01',
        technicianId: TECH_ID,
        notes: 'Loaded on Sysmex XN-550 automated hematology analyzer'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'PROCESSING');
    assert.strictEqual(body.data.metadata.analyzerId, 'ANALYZER-SYS-XN550');
  });

  it('STEP 5: Record structured laboratory analyte results (POST /api/v1/partner/lab/orders/:id/results)', async () => {
    const token = createToken({ userId: TECH_ID, roles: ['LAB_TECHNICIAN'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/results`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        enteredBy: TECH_ID,
        results: [
          {
            parameterCode: 'HGB',
            parameterName: 'Hemoglobin',
            value: 13.8,
            numericValue: 13.8,
            unit: 'g/dL',
            referenceRange: '12.0 - 16.0',
            abnormalFlag: 'NORMAL'
          },
          {
            parameterCode: 'WBC',
            parameterName: 'White Blood Cell Count',
            value: 7.2,
            numericValue: 7.2,
            unit: '10^3/uL',
            referenceRange: '4.0 - 10.0',
            abnormalFlag: 'NORMAL'
          },
          {
            parameterCode: 'PLT',
            parameterName: 'Platelet Count',
            value: 280,
            numericValue: 280,
            unit: '10^3/uL',
            referenceRange: '150 - 450',
            abnormalFlag: 'NORMAL'
          }
        ]
      }
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'RESULT_ENTERED');
    assert.strictEqual(body.data.results.length, 3);
    assert.strictEqual(body.data.isCritical, false);
  });

  it('STEP 6: Technical Validation by Lab Technologist (POST /api/v1/partner/lab/orders/:id/technical-validate)', async () => {
    const token = createToken({ userId: TECH_ID, roles: ['LAB_TECHNICIAN'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/technical-validate`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        technicianId: TECH_ID,
        isAccepted: true,
        comments: 'Delta check passed against baseline. Instrument flags clear. IQC normal.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'TECHNICAL_VALIDATED');
    assert.strictEqual(body.data.metadata.technicalValidation.isAccepted, true);
    assert.strictEqual(body.data.metadata.technicalValidation.technicianId, TECH_ID);
  });

  it('STEP 7: Pathologist Clinical Validation with Digital Signature (POST /api/v1/partner/lab/orders/:id/pathologist-validate)', async () => {
    const token = createToken({ userId: PATHOLOGIST_ID, roles: ['PATHOLOGIST'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/pathologist-validate`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        pathologistId: PATHOLOGIST_ID,
        pathologistName: 'Dr. Shalini Deshmukh, MD (Pathology)',
        digitalSignature: 'SIG-SHA256-PATH-DESHMUKH-20260926-VALIDATED',
        clinicalImpression: 'Normocytic normochromic blood picture. All hematological parameters within reference limits.',
        recommendations: 'Clinical correlation recommended.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'VERIFIED');
    assert.strictEqual(body.data.verifiedBy, PATHOLOGIST_ID);
    assert.ok(body.data.report);
    assert.strictEqual(body.data.report.reportNumber, `REP-${primaryOrderNumber}`);
    assert.strictEqual(body.data.metadata.pathologistValidation.digitalSignature, 'SIG-SHA256-PATH-DESHMUKH-20260926-VALIDATED');
  });

  it('STEP 8: Attending Doctor Clinical Review (PATCH /api/v1/partner/lab/orders/:id/review)', async () => {
    const token = createToken({ userId: DOCTOR_ID, roles: ['DOCTOR'] });
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/review`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        doctorNotes: 'Reviewed pre-op CBC. Patient cleared for elective surgical procedure.'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'COMPLETED');
    assert.strictEqual(body.data.doctorNotes, 'Reviewed pre-op CBC. Patient cleared for elective surgical procedure.');
  });

  it('STEP 9: Final Report Delivery to Patient Portal & EMR (POST /api/v1/partner/lab/orders/:id/deliver)', async () => {
    const token = createToken({ userId: TECH_ID, roles: ['LAB_TECHNICIAN'] });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/deliver`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        deliveryChannel: 'PATIENT_PORTAL',
        recipient: 'anita.rao@example.com',
        deliveredBy: TECH_ID,
        notes: 'Dispatched to Patient Portal and sent SMS intimation'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'DELIVERED');
    assert.strictEqual(body.data.metadata.delivery.deliveryChannel, 'PATIENT_PORTAL');
    assert.strictEqual(body.data.metadata.delivery.recipient, 'anita.rao@example.com');
  });

  it('STEP 10: Authoritative Order Report Retrieval (GET /api/v1/partner/lab/orders/:id/report)', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/report`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.orderId, primaryOrderId);
    assert.strictEqual(body.data.orderNumber, primaryOrderNumber);
    assert.strictEqual(body.data.patient.id, patientId);
    assert.strictEqual(body.data.test.code, 'CBC');
    assert.strictEqual(body.data.results.length, 3);
    assert.ok(body.data.report);
    assert.strictEqual(body.data.validation.verifiedBy, PATHOLOGIST_ID);
    assert.strictEqual(body.data.delivery.deliveryChannel, 'PATIENT_PORTAL');
  });

  it('STEP 11: Barcode / Accession Direct Lookup (GET /api/v1/partner/lab/barcodes/:barcode)', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/lab/barcodes/${primaryBarcode}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.order.id, primaryOrderId);
    assert.strictEqual(body.data.order.orderNumber, primaryOrderNumber);
    assert.ok(body.data.specimen);
  });

  // =========================================================================
  // SPECIMEN REJECTION & LINEAGE-PRESERVING RECOLLECTION
  // =========================================================================
  it('STEP 12: Specimen Rejection & Lineage-Preserving Recollection Workflow', async () => {
    const doctorToken = createToken({ userId: DOCTOR_ID, roles: ['DOCTOR'] });
    const techToken = createToken({ userId: TECH_ID, roles: ['LAB_TECHNICIAN'] });

    // 1. Create order
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/orders',
      headers: { Authorization: `Bearer ${doctorToken}` },
      payload: {
        patientId,
        testCode: 'LFT',
        testName: 'Liver Function Test',
        category: 'BIOCHEMISTRY'
      }
    });
    assert.strictEqual(createRes.statusCode, 201);
    rejectedOrderId = JSON.parse(createRes.body).data.id;

    // 2. Collect sample
    const collectRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${rejectedOrderId}/collect-sample`,
      headers: { Authorization: `Bearer ${techToken}` },
      payload: {
        specimenType: 'SERUM',
        containerType: 'SST_GOLD_TOP'
      }
    });
    assert.strictEqual(collectRes.statusCode, 200);
    const firstSpecimen = JSON.parse(collectRes.body).data.specimens[0];
    const firstBarcode = firstSpecimen.accessionNumber || firstSpecimen.barcode;

    // 3. Reject sample
    const rejectRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${rejectedOrderId}/reject`,
      headers: { Authorization: `Bearer ${techToken}` },
      payload: {
        rejectionReason: 'GROSS_HEMOLYSIS_ICTERUS',
        remarks: 'Severe 4+ hemolysis, specimen unsuitable for colorimetric assay',
        rejectedBy: TECH_ID
      }
    });
    assert.strictEqual(rejectRes.statusCode, 200);
    const rejectedBody = JSON.parse(rejectRes.body);
    assert.strictEqual(rejectedBody.data.status, 'SAMPLE_REJECTED');
    assert.strictEqual(rejectedBody.data.metadata.rejection.rejectionReason, 'GROSS_HEMOLYSIS_ICTERUS');

    // 4. Request recollection
    const recollectRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${rejectedOrderId}/recollect`,
      headers: { Authorization: `Bearer ${techToken}` },
      payload: {
        previousSpecimenId: firstSpecimen.id,
        specimenType: 'SERUM',
        containerType: 'SST_GOLD_TOP',
        requestedBy: TECH_ID,
        notes: 'Recollect fresh non-hemolyzed SST tube immediately'
      }
    });
    assert.strictEqual(recollectRes.statusCode, 200);
    const recollectBody = JSON.parse(recollectRes.body);
    assert.strictEqual(recollectBody.data.status, 'RECOLLECTION_REQUESTED');
    const newBarcode = recollectBody.data.metadata.activeSpecimenBarcode;
    assert.ok(newBarcode);
    assert.notStrictEqual(newBarcode, firstBarcode);

    // Verify lookup by new barcode
    const lookupRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/lab/barcodes/${newBarcode}`,
      headers: { Authorization: `Bearer ${techToken}` }
    });
    assert.strictEqual(lookupRes.statusCode, 200);
    assert.strictEqual(JSON.parse(lookupRes.body).data.order.id, rejectedOrderId);
  });

  // =========================================================================
  // 5,000+ SCALABLE CATALOG & PANELS ARCHITECTURE
  // =========================================================================
  it('STEP 13: Scalable Catalog Management with SQL Pagination & Search', async () => {
    const token = createToken();

    // 1. Create Catalog Test
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/catalog',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        testCode: 'SER-K-01',
        testName: 'Serum Potassium (K+)',
        shortName: 'Potassium',
        category: 'BIOCHEMISTRY',
        department: 'PATHOLOGY',
        specimenType: 'SERUM',
        sampleVolume: '1 mL',
        turnaroundTargetHours: 2,
        fastingRequired: false,
        clinicalDescription: 'Quantitative measurement of serum potassium electrolyte level.'
      }
    });
    assert.strictEqual(createRes.statusCode, 201);
    const created = JSON.parse(createRes.body).data;
    assert.strictEqual(created.testCode, 'SER-K-01');
    catalogTestId = created.id;

    // 2. Update Catalog Test
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/partner/lab/catalog/${catalogTestId}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        turnaroundTargetHours: 1,
        sampleVolume: '1.5 mL'
      }
    });
    assert.strictEqual(updateRes.statusCode, 200);
    const updated = JSON.parse(updateRes.body).data;
    assert.strictEqual(updated.turnaroundTargetHours, 1);
    assert.strictEqual(updated.sampleVolume, '1.5 mL');

    // 3. Paginated Catalog Query
    const searchRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/lab/catalog?page=1&limit=5&category=BIOCHEMISTRY',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(searchRes.statusCode, 200);
    const searchBody = JSON.parse(searchRes.body).data;
    assert.ok(Array.isArray(searchBody.items));
    assert.ok(typeof searchBody.total === 'number');
    assert.strictEqual(searchBody.page, 1);
    assert.strictEqual(searchBody.limit, 5);
    assert.ok(searchBody.items.some((i) => i.testCode === 'SER-K-01'));
  });

  it('STEP 14: Panel Configuration with Multiple Linked Catalog Tests', async () => {
    const token = createToken();

    // Create Panel
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/panels',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        panelCode: 'ELEC-PANEL-01',
        panelName: 'Serum Electrolytes Profile (Na/K/Cl)',
        category: 'BIOCHEMISTRY',
        description: 'Comprehensive electrolyte analysis panel',
        testIds: [catalogTestId]
      }
    });

    assert.strictEqual(createRes.statusCode, 201);
    const panelBody = JSON.parse(createRes.body).data;
    assert.strictEqual(panelBody.panelCode, 'ELEC-PANEL-01');
    panelId = panelBody.id;

    // Retrieve panels
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/lab/panels',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(getRes.statusCode, 200);
    const panels = JSON.parse(getRes.body).data;
    assert.ok(panels.some((p) => p.panelCode === 'ELEC-PANEL-01'));
  });

  // =========================================================================
  // CDSS CRITICAL PANIC VALUES & VERBAL INTIMATION
  // =========================================================================
  it('STEP 15: CDSS Critical Panic Value Automatic Detection & Read-Back Intimation', async () => {
    const doctorToken = createToken({ userId: DOCTOR_ID, roles: ['DOCTOR'] });
    const techToken = createToken({ userId: TECH_ID, roles: ['LAB_TECHNICIAN'] });

    // 1. Create order
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/orders',
      headers: { Authorization: `Bearer ${doctorToken}` },
      payload: {
        patientId,
        testCode: 'K',
        testName: 'Serum Potassium',
        category: 'BIOCHEMISTRY',
        priority: 'STAT'
      }
    });
    const critOrderId = JSON.parse(orderRes.body).data.id;

    // 2. Enter critical panic value: Potassium 6.8 mmol/L (Critical Max is 6.2)
    const resultRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${critOrderId}/results`,
      headers: { Authorization: `Bearer ${techToken}` },
      payload: {
        results: [
          {
            parameterCode: 'K',
            parameterName: 'Serum Potassium',
            value: 6.8,
            numericValue: 6.8,
            unit: 'mmol/L',
            referenceRange: '3.5 - 5.1'
          }
        ]
      }
    });

    assert.strictEqual(resultRes.statusCode, 201);
    const resultBody = JSON.parse(resultRes.body).data;
    assert.strictEqual(resultBody.isCritical, true);
    assert.strictEqual(resultBody.results[0].abnormalFlag, 'CRITICAL_HIGH');

    // 3. Log Mandatory NABL Verbal Intimation
    const intimateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${critOrderId}/panic-intimation`,
      headers: { Authorization: `Bearer ${techToken}` },
      payload: {
        doctorName: 'Dr. Rajesh Sharma, MD',
        doctorPhone: '+91-9876500000',
        callerStaffName: 'Lab Tech Vivek',
        readBackConfirmed: true,
        criticalParameters: ['Serum Potassium = 6.8 mmol/L (CRITICAL_HIGH)'],
        notes: 'Read-back verified telephonically. Physician instructed emergent 12-lead ECG and calcium gluconate.'
      }
    });

    assert.strictEqual(intimateRes.statusCode, 200);
    const intimateBody = JSON.parse(intimateRes.body);
    assert.strictEqual(intimateBody.success, true);
    assert.strictEqual(intimateBody.data.panicIntimation.status, 'VERBAL_READBACK_CONFIRMED');
    assert.strictEqual(intimateBody.data.panicIntimation.readBackConfirmed, true);
  });

  // =========================================================================
  // LIS HARDWARE WESTGARD MULTIRULE QUALITY CONTROL (QC)
  // =========================================================================
  it('STEP 16: LIS Hardware Westgard Multirule QC Evaluation (Normal & Violation Runs)', async () => {
    const token = createToken();

    // 1. Normal QC Run: target 14.0, SD 0.5, measured 14.1 -> z-score = 0.200 (PASSED)
    const normalRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/qc/evaluate',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        analyzerId: 'ANALYZER-SYS-XN550',
        testCode: 'HGB',
        targetMean: 14.0,
        standardDeviation: 0.5,
        measuredValue: 14.1,
        lotNumber: 'LOT-QC-2026-N01'
      }
    });
    assert.strictEqual(normalRes.statusCode, 200);
    const normalBody = JSON.parse(normalRes.body).data;
    assert.strictEqual(normalBody.westgardStatus, 'PASSED');
    assert.strictEqual(normalBody.violatedRules.length, 0);

    // 2. 1_3s Rule Violation: target 14.0, SD 0.5, measured 16.0 -> z-score = 4.000 (> 3.0 SD violation)
    const violationRes = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/lab/qc/evaluate',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        analyzerId: 'ANALYZER-SYS-XN550',
        testCode: 'HGB',
        targetMean: 14.0,
        standardDeviation: 0.5,
        measuredValue: 16.0,
        lotNumber: 'LOT-QC-2026-N01'
      }
    });
    assert.strictEqual(violationRes.statusCode, 200);
    const violationBody = JSON.parse(violationRes.body).data;
    assert.strictEqual(violationBody.westgardStatus, 'REJECTED_VIOLATION');
    assert.ok(violationBody.violatedRules.includes('1_3s'));
    assert.ok(violationBody.recommendation);
  });

  // =========================================================================
  // PDF REPORT GENERATION (ISO 32000-1 BINARY PDF)
  // =========================================================================
  it('STEP 17: Official Diagnostic Report PDF Generation (GET /api/v1/partner/lab/orders/:id/pdf)', async () => {
    const token = createToken();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/pdf`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');
    // Check PDF magic header %PDF-
    const rawBuffer = res.rawPayload;
    assert.ok(rawBuffer.length > 500);
    const magic = rawBuffer.subarray(0, 5).toString('ascii');
    assert.strictEqual(magic, '%PDF-');
  });

  // =========================================================================
  // ADVERSARIAL SECURITY & SCOPEGUARD TENANT ISOLATION
  // =========================================================================
  it('STEP 18: Adversarial Security - Cross-Tenant Accession & Validation Blocked Fail-Closed', async () => {
    // Tenant B token attempting mutations on Tenant A order
    const tenantBToken = createToken({
      tenantId: TENANT_B,
      branchId: BRANCH_B,
      userId: '22222222-9999-4222-8222-999999999999'
    });

    // 1. Cross-tenant accession attempt
    const accessionRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/accession`,
      headers: { Authorization: `Bearer ${tenantBToken}` },
      payload: { receivedBy: 'Hacker Tech' }
    });
    assert.ok(accessionRes.statusCode === 403 || accessionRes.statusCode === 404);

    // 2. Cross-tenant validation attempt
    const validateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/pathologist-validate`,
      headers: { Authorization: `Bearer ${tenantBToken}` },
      payload: { pathologistId: 'HACKER-PATHOLOGIST' }
    });
    assert.ok(validateRes.statusCode === 403 || validateRes.statusCode === 404);

    // 3. Cross-tenant barcode lookup
    const barcodeRes = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/lab/barcodes/${primaryBarcode}`,
      headers: { Authorization: `Bearer ${tenantBToken}` }
    });
    assert.ok(barcodeRes.statusCode === 403 || barcodeRes.statusCode === 404);
  });

  it('STEP 19: Adversarial Security - Unauthorized Role Blocked from Pathologist Validation', async () => {
    // User with only reception permissions attempting pathologist clinical validation
    const unauthReceptionToken = createToken({
      userId: '55555555-5555-4555-8555-555555555555',
      roles: ['RECEPTIONIST'],
      permissions: ['clinical:patients:read', 'lab:orders:read']
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/lab/orders/${primaryOrderId}/pathologist-validate`,
      headers: { Authorization: `Bearer ${unauthReceptionToken}` },
      payload: {
        pathologistId: 'RECEPTIONIST-PRETENDING',
        clinicalImpression: 'Illegal attempt to validate lab results'
      }
    });

    assert.strictEqual(res.statusCode, 403);
  });
});
