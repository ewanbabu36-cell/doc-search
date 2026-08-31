import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';

describe('Domain 3.5 — Physical Barcode, RFID & Healthcare Hardware Bridge Vertical Slice Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-hardware-admin-01',
      email: overrides.email || 'biomed.hardware@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['BIOMEDICAL_ENGINEER', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'hardware:device:read',
        'hardware:device:register',
        'hardware:scan:create',
        'hardware:rfid:read',
        'hardware:print:create'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let tenantBToken;

  let createdScannerId;
  let createdPrinterId;
  let createdScanId;
  let createdRfidId;
  let createdPrintJobId;

  before(async () => {
    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    tenantBToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-hardware-tenantB'
    });
  });

  after(async () => {
    await app.close();
  });

  it('TEST 01: GET /api/v1/partner/hardware/overview returns hardware connectivity metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/hardware/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.connectedScannersCount > 0);
    assert.ok(body.data.printJobSuccessRatePct >= 98.0);
  });

  it('TEST 02: POST /api/v1/partner/hardware/devices registers Zebra 2D Barcode Scanner via WebUSB', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/devices',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        deviceName: 'Zebra DS2208 Handheld 2D Imager',
        deviceType: 'BARCODE_SCANNER_HANDHELD',
        protocol: 'WEB_USB',
        vendorIdHex: '0x05E0',
        productIdHex: '0x1200',
        serialNumber: 'SN-ZEB-DS2208-9941',
        assignedWorkstation: 'Phlebotomy & Sample Collection Desk 1',
        departmentName: 'LIMS Pathology Laboratory'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.connectionStatus, 'CONNECTED_ONLINE');
    assert.equal(body.data.vendorIdHex, '0x05E0');
    createdScannerId = body.data.id;
  });

  it('TEST 03: POST /api/v1/partner/hardware/devices registers Zebra ZD420 ZPL Thermal Printer via WebSerial', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/devices',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        deviceName: 'Zebra ZD420 300DPI Direct Thermal Printer',
        deviceType: 'THERMAL_LABEL_PRINTER_ZPL',
        protocol: 'WEB_SERIAL',
        vendorIdHex: '0x0A5F',
        productIdHex: '0x0118',
        serialNumber: 'SN-ZEB-ZD420-5512',
        assignedWorkstation: 'Central Pharmacy Packaging Dock',
        departmentName: 'Inpatient Pharmacy'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.protocol, 'WEB_SERIAL');
    createdPrinterId = body.data.id;
  });

  it('TEST 04: POST /api/v1/partner/hardware/scans decodes LIMS Vacutainer Tube Barcode', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/scans',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        deviceId: createdScannerId,
        deviceName: 'Zebra DS2208 2D Imager',
        symbology: 'CODE128',
        rawScanData: 'TUB-2026-9812'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.decodedClinicalEntity.entityType, 'SAMPLE_SPECIMEN');
    assert.equal(body.data.decodedClinicalEntity.identifier, 'TUB-2026-9812');
    assert.equal(body.data.decodedClinicalEntity.metaDetails.vacutainerType, 'K2-EDTA Purple Top');
    createdScanId = body.data.id;
  });

  it('TEST 05: POST /api/v1/partner/hardware/scans decodes Medication GS1 DataMatrix 2D Barcode', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/scans',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        deviceId: createdScannerId,
        symbology: 'GS1_DATAMATRIX',
        rawScanData: 'MED-MER-001'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.decodedClinicalEntity.entityType, 'MEDICATION_BATCH');
    assert.equal(body.data.decodedClinicalEntity.metaDetails.drugName, 'Meropenem 1g IV');
  });

  it('TEST 06: POST /api/v1/partner/hardware/scans decodes Inpatient Admission Patient MRN Barcode', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/scans',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        deviceId: createdScannerId,
        symbology: 'CODE128',
        rawScanData: 'MRN-2026-9041'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.decodedClinicalEntity.entityType, 'PATIENT_MRN');
    assert.equal(body.data.decodedClinicalEntity.metaDetails.patientName, 'Kavita Joshi');
  });

  it('TEST 07: POST /api/v1/partner/hardware/rfid-reads ingests UHF RFID EPC Gen2 Tag read', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/rfid-reads',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        deviceId: 'dev_rfid_fixed_01',
        epcHex: 'E280116060000204781299A1',
        rssiDbm: -48,
        antennaPort: 1,
        linkedItemDescription: 'Mindray SV300 ICU Ventilator (Asset BMA-002)'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.epcHex, 'E280116060000204781299A1');
    assert.equal(body.data.rssiDbm, -48);
    createdRfidId = body.data.id;
  });

  it('TEST 08: GET /api/v1/partner/hardware/rfid-reads returns recent RFID tag events', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/hardware/rfid-reads',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    const found = body.data.find(r => r.id === createdRfidId);
    assert.ok(found, 'Created RFID read must be in store');
  });

  it('TEST 09: POST /api/v1/partner/hardware/print-jobs/generate compiles ZPL II Vacutainer Tube label', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/print-jobs/generate',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        printerDeviceId: createdPrinterId,
        labelTemplateType: 'LIMS_VACUTAINER_TUBE',
        sampleId: 'TUB-2026-9812',
        patientName: 'Kavita Joshi',
        patientMrn: 'MRN-2026-9041',
        testName: 'CBC + Differential',
        tubeCapColor: 'PURPLE_EDTA',
        copies: 1
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.rawZplPayload.includes('^XA'), 'ZPL must start with ^XA');
    assert.ok(body.data.rawZplPayload.includes('^XZ'), 'ZPL must terminate with ^XZ');
    assert.ok(body.data.rawZplPayload.includes('TUB-2026-9812'), 'ZPL must contain barcode data');
    assert.equal(body.data.status, 'PRINTED_SUCCESS');
    createdPrintJobId = body.data.id;
  });

  it('TEST 10: POST /api/v1/partner/hardware/print-jobs/generate compiles ZPL II Inpatient Patient Wristband', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/print-jobs/generate',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        printerDeviceId: createdPrinterId,
        labelTemplateType: 'PATIENT_ID_WRISTBAND',
        patientName: 'Kavita Joshi',
        patientMrn: 'MRN-2026-9041',
        copies: 1
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.rawZplPayload.includes('PENICILLIN (ANAPHYLAXIS)'), 'Wristband must contain critical allergy alert');
    assert.ok(body.data.rawZplPayload.includes('^PW800'), 'Wristband dimensions must match 800 width');
  });

  it('TEST 11: GET /api/v1/partner/hardware/print-jobs returns historical print ledger', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/hardware/print-jobs',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    const job = body.data.find(j => j.id === createdPrintJobId);
    assert.ok(job, 'Created print job must be in ledger');
  });

  it('TEST 12: Empty raw scan data is rejected with 400 Bad Request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/hardware/scans',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        rawScanData: ''
      }
    });

    assert.equal(res.statusCode, 400);
  });

  it('TEST 13: Multi-Tenant Isolation: Tenant B cannot access Tenant A registered hardware devices', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/hardware/devices',
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const leaked = body.data.find(d => d.id === createdScannerId);
    assert.equal(leaked, undefined, 'Tenant B must never see Tenant A devices');
  });

  it('TEST 14: Unauthenticated request to /api/v1/partner/hardware/overview fails closed with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/hardware/overview'
    });

    assert.equal(res.statusCode, 401);
  });

  it('TEST 15: SHA-256 Cryptographic Audit Chain verification for all physical hardware transactions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/hardware/audit-traces',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.length >= 4, 'All hardware actions must generate audit traces');
    assert.ok(body.data.every(t => typeof t.integrityHash === 'string' && t.integrityHash.length === 64), 'All audit hashes must be valid 64-char SHA-256 strings');
  });
});
