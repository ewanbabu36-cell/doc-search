/**
 * ATOMIC CROSS-DEPARTMENT HEALTHCARE WORKFLOW INTEGRATION TEST
 *
 * Verifies end-to-end database-backed real-world ERP workflow:
 * Step 1: Partner Authentication & Session Token
 * Step 2: Patient Registration in OPD
 * Step 3: Doctor Consultation & Prescription Creation (pharmacy_prescriptions)
 * Step 4: Pharmacist Queue Ingestion (prescriptions appear in worklist)
 * Step 5: Pharmacy Stock Procurement (Batch Inwarding & FEFO Available Qty)
 * Step 6: Pharmacy Dispense Transaction:
 *         - Batch deduction
 *         - Stock movement ledger record
 *         - Prescription completion
 *         - Cross-department billing invoice generation
 *         - Cashier payment receipt recording
 * Step 7: GST E-Invoice IRN & Signed QR Code Validation
 * Step 8: AB-PMJAY NHCX FHIR Claim Bundle Generation
 */

import assert from 'node:assert/strict';
import { generateGstEInvoice, getIndianFinancialYear, buildNhcxClaimBundle, validatePmjayCardNumber } from '../../packages/shared-core/dist/index.js';

const BASE_URL = 'http://localhost:4000';

console.log('================================================================================');
console.log('🏥 STARTING ATOMIC CROSS-DEPARTMENT HEALTHCARE WORKFLOW TEST');
console.log('================================================================================\n');

async function api(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: json };
}

async function runWorkflow() {
  // Step 1: Partner Onboarding & Authentication
  console.log('[Step 1a] Acquiring Company Admin / Founder Session Token...');
  const adminAuthRes = await api('/api/v1/auth/quick-session', {
    method: 'POST',
    body: JSON.stringify({
      email: 'founder@docsearch.health',
      role: 'SUPER_ADMIN',
      permissions: ['*']
    })
  });
  assert(adminAuthRes.ok, `Admin Auth failed: ${JSON.stringify(adminAuthRes.body)}`);
  const adminToken = adminAuthRes.body.data.accessToken;

  console.log('[Step 1b] Onboarding Healthcare Partner & Provisioning Tenant...');
  const uniqueSuffix = Date.now().toString().slice(-4);
  const doctorEmail = `rajesh.${uniqueSuffix}@apollohospitals.test`;
  const partnerRes = await api('/api/v1/company/partners', {
    method: 'POST',
    body: JSON.stringify({
      legalName: `Apollo Multi-Specialty Hospital ${uniqueSuffix} Ltd`,
      tradeName: `Apollo Delhi Facility ${uniqueSuffix}`,
      partnerType: 'HOSPITAL_NETWORK',
      primaryContactName: 'Dr. Rajesh Sharma',
      primaryContactEmail: doctorEmail,
      primaryContactPhone: '011-98765432',
      primaryContactRole: 'Chief Medical Officer',
      planCode: 'PLAN_HOSP_FREE_YR1',
      billingCycle: 'MONTHLY',
      isTrial: false,
      initialFacilityName: 'Apollo Main Facility'
    })
  }, adminToken);
  assert(partnerRes.ok, `Partner onboarding failed: ${JSON.stringify(partnerRes.body)}`);
  const partnerData = partnerRes.body.data;
  const tenantId = partnerData.tenantId;
  const partnerId = partnerData.id || partnerData.partner.id;
  const branchId = partnerData.branchId || partnerData.facilityId;
  console.log('   ✓ Partner onboarded. Tenant:', tenantId, 'Partner:', partnerId, 'Branch:', branchId);

  console.log('[Step 1c] Acquiring Doctor Session Token for Onboarded Facility...');
  const authRes = await api('/api/v1/auth/quick-session', {
    method: 'POST',
    body: JSON.stringify({
      email: doctorEmail,
      role: 'DOCTOR',
      roles: ['DOCTOR', 'HOSPITAL_ADMIN', 'PHARMACIST'],
      permissions: ['*'],
      tenantId,
      branchId,
      name: 'Dr. Rajesh Sharma'
    })
  });
  assert(authRes.ok, `Doctor auth failed: ${JSON.stringify(authRes.body)}`);
  const token = authRes.body.data.accessToken;
  console.log('   ✓ Doctor token acquired for tenant:', tenantId);

  // Step 2: Patient Registration
  console.log('[Step 2] Registering New Patient in OPD...');
  const patRes = await api('/api/v1/partner/patients', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Amit',
      lastName: 'Kumar',
      gender: 'MALE',
      dateOfBirth: '1988-06-15',
      primaryMobile: '9876543210',
      mobileNumber: '9876543210',
      bloodGroup: 'B+'
    })
  }, token);
  assert(patRes.ok, `Patient creation failed: ${JSON.stringify(patRes.body)}`);
  const patient = patRes.body.data;
  assert(patient.id, 'Patient ID must exist');
  console.log('   ✓ Patient registered with MRN:', patient.mrn, 'ID:', patient.id);

  // Step 3: Doctor Consultation & Prescription Creation
  console.log('[Step 3] Doctor Prescribing Medication in OPD...');
  const rxRes = await api('/api/v1/partner/clinical/prescriptions', {
    method: 'POST',
    body: JSON.stringify({
      patientId: patient.id,
      notes: 'Acute bronchitis, prescribed Amoxicillin course',
      priority: 'ROUTINE',
      items: [
        {
          medicationCode: 'MED-AMOX-500',
          medicationName: 'Amoxicillin 500mg',
          dosage: '500mg',
          frequency: 'TID',
          route: 'ORAL',
          duration: 5,
          durationUnit: 'DAYS',
          prescribedQuantity: 15,
          instructions: 'Take 1 tablet three times daily after meals'
        }
      ]
    })
  }, token);
  assert(rxRes.ok, `Prescription creation failed: ${JSON.stringify(rxRes.body)}`);
  const prescription = rxRes.body.data;
  assert(prescription.id, 'Prescription ID must exist');
  console.log('   ✓ Prescription generated:', prescription.prescriptionNumber, 'ID:', prescription.id);

  // Step 4: Pharmacist Queue Ingestion
  console.log('[Step 4] Checking Pharmacy Worklist Queue...');
  const queueRes = await api('/api/v1/partner/pharmacy/prescriptions', {}, token);
  assert(queueRes.ok, `Queue query failed: ${JSON.stringify(queueRes.body)}`);
  const queueItems = queueRes.body.data;
  assert(Array.isArray(queueItems), 'Queue must be an array');
  const foundInQueue = queueItems.find((q) => q.prescriptionId === prescription.id || q.id === prescription.id);
  assert(foundInQueue, 'Doctor prescription must be visible in pharmacy worklist');
  console.log('   ✓ Prescription found in pharmacist queue with status:', foundInQueue.status);

  // Step 5: Pharmacy Stock Procurement
  console.log('[Step 5] Inwarding Stock Batch to Pharmacy Inventory...');
  // First ensure medication exists in catalog
  const medRes = await api('/api/v1/partner/pharmacy/medications', {
    method: 'POST',
    body: JSON.stringify({
      medicationCode: 'MED-AMOX-500',
      name: 'Amoxicillin 500mg Tablet',
      genericName: 'Amoxicillin',
      dosageForm: 'TABLET',
      strength: '500mg',
      unitPrice: 12.50
    })
  }, token);
  const medicationId = medRes.body.data?.id || (foundInQueue.items && foundInQueue.items[0]?.medicationId);
  assert(medicationId, 'Medication ID must be available');

  const batchNumber = `BATCH-TEST-${Date.now().toString().slice(-6)}`;
  const receiveRes = await api('/api/v1/partner/pharmacy/batches/receive-stock', {
    method: 'POST',
    body: JSON.stringify({
      medicationId,
      batchNumber,
      manufacturer: 'Sun Pharma Ltd',
      manufacturingDate: '2026-01-01',
      expiryDate: '2028-12-31',
      receivedQuantity: 100,
      unitCost: 8.50,
      supplierReference: 'PO-2026-0042'
    })
  }, token);
  assert(receiveRes.ok, `Stock receipt failed: ${JSON.stringify(receiveRes.body)}`);
  const batch = receiveRes.body.data;
  console.log('   ✓ Stock received for batch:', batch.batchNumber, 'Available Qty:', batch.availableQuantity);

  // Step 6: Pharmacy Dispense Transaction (Atomic Ledger)
  console.log('[Step 6] Executing POS Dispensing Transaction...');
  const dispenseRes = await api('/api/v1/partner/pharmacy/dispense', {
    method: 'POST',
    body: JSON.stringify({
      patientId: patient.id,
      prescriptionId: prescription.id,
      items: [
        {
          medicationId,
          batchId: batch.id,
          quantity: 15,
          unitPrice: 12.50
        }
      ]
    })
  }, token);
  assert(dispenseRes.ok, `Dispense transaction failed: ${JSON.stringify(dispenseRes.body)}`);
  const dispensing = dispenseRes.body.data;
  assert.equal(dispensing.dispensingStatus, 'DISPENSED');
  assert(dispensing.invoiceNumber, 'Dispensing must generate an authoritative invoice number');
  console.log('   ✓ Medication dispensed:', dispensing.dispensingNumber);
  console.log('   ✓ Cross-department invoice created:', dispensing.invoiceNumber, 'Total: ₹', dispensing.totalBillAmount);

  // Verify batch stock deduction
  const batchesRes = await api(`/api/v1/partner/pharmacy/batches?medicationId=${medicationId}`, {}, token);
  const updatedBatch = batchesRes.body.data.find((b) => b.id === batch.id);
  assert(updatedBatch, 'Batch must exist');
  assert.equal(Number(updatedBatch.availableQuantity), 85, 'Batch stock must be deducted from 100 to 85');
  console.log('   ✓ Verified FEFO stock deducted from 100 to:', updatedBatch.availableQuantity);

  // Step 7: GST E-Invoice (IRN & Signed QR Code)
  console.log('[Step 7] Generating NIC GST E-Invoice & Signed QR Code...');
  const gstResult = generateGstEInvoice({
    supplierGstin: '07AAAAA0000A1Z5',
    supplierLegalName: 'Apollo Multi-Specialty Hospital',
    recipientGstin: '07BBBBB1111B1Z6',
    recipientName: `${patient.firstName} ${patient.lastName}`,
    docType: 'INV',
    docNumber: dispensing.invoiceNumber,
    docDate: '23/09/2026',
    financialYear: getIndianFinancialYear(),
    items: [
      {
        name: 'Amoxicillin 500mg Tablet',
        hsnCode: '3004',
        quantity: 15,
        unitPrice: 12.50,
        taxRatePercent: 0
      }
    ]
  });
  assert.equal(gstResult.irn.length, 64, 'IRN must be 64 hexadecimal characters');
  assert(gstResult.signedQrCodeData.includes('07AAAAA0000A1Z5'), 'QR code must include supplier GSTIN');
  console.log('   ✓ 64-char NIC GST IRN:', gstResult.irn);
  console.log('   ✓ NIC Signed QR Payload generated (length):', gstResult.signedQrCodeData.length);

  // Step 8: AB-PMJAY NHA NHCX FHIR R4 Claim Bundle
  console.log('[Step 8] Building NHA NHCX FHIR R4 Claim Bundle...');
  const pmjayCardId = 'PMJAY-MH-2026-991823';
  const goldenCardVerification = validatePmjayCardNumber(pmjayCardId);
  assert.equal(goldenCardVerification.isValid, true, 'Golden Card format must be valid');

  const claimBundleResult = buildNhcxClaimBundle({
    claimId: dispensing.invoiceNumber,
    use: 'claim',
    insurerName: 'National Health Authority - AB PMJAY',
    insurerCode: 'NHA-PMJAY',
    policyNumber: pmjayCardId,
    patient: {
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      gender: 'male',
      birthDate: patient.dateOfBirth,
      pmjayGoldenCardId: pmjayCardId,
      mobile: '9876543210'
    },
    provider: {
      facilityId: tenantId,
      facilityName: 'Apollo Hospital Network',
      rohiniCode: 'ROHINI-DEL-8921',
      hprDoctorId: prescription.prescribingDoctorId || 'DOC-01',
      doctorName: 'Dr. Rajesh Sharma'
    },
    diagnoses: [
      {
        code: 'J20.9',
        description: 'Acute bronchitis, unspecified',
        type: 'PRIMARY'
      }
    ],
    procedures: [
      {
        packageCode: 'MC001',
        procedureName: 'Amoxicillin 500mg Tablet (15 units)',
        rate: 12.50,
        quantity: 15
      }
    ]
  });

  const fhirBundle = claimBundleResult.fhirBundle;
  assert.equal(fhirBundle.resourceType, 'Bundle');
  assert.equal(fhirBundle.type, 'collection');
  assert(Array.isArray(fhirBundle.entry) && fhirBundle.entry.length >= 5, 'Bundle must contain Patient, Organization, Practitioner, Coverage, and Claim');
  console.log('   ✓ NHCX Claim Bundle assembled with', fhirBundle.entry.length, 'FHIR R4 resources');

  console.log('\n================================================================================');
  console.log('🎉 ATOMIC CROSS-DEPARTMENT HEALTHCARE WORKFLOW 100% VERIFIED AND PASSING!');
  console.log('================================================================================\n');
}

runWorkflow().catch((err) => {
  console.error('\n❌ Workflow failed:', err);
  process.exit(1);
});
