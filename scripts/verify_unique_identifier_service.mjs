import assert from 'node:assert';
import { uniqueIdentifierService } from '../apps/partner-platform/dist/services/unique-identifier-service.js';

console.log('🧪 Starting Centralized Unique Identifier Service Verification...');

// 1. Verify UHID Generation & Monotonic Sequence
const uhid1 = uniqueIdentifierService.generateUhid('tenant-test', 2026);
const uhid2 = uniqueIdentifierService.generateUhid('tenant-test', 2026);
console.log(`  Generated UHID 1: ${uhid1}`);
console.log(`  Generated UHID 2: ${uhid2}`);

assert.ok(uhid1.startsWith('UHID-2026-000001'), 'First UHID should start with UHID-2026-000001');
assert.ok(uhid2.startsWith('UHID-2026-000002'), 'Second UHID should start with UHID-2026-000002');
assert(uniqueIdentifierService.isValidUhid(uhid1), 'uhid1 should be valid');
assert(uniqueIdentifierService.isValidUhid(uhid2), 'uhid2 should be valid');
assert(!uniqueIdentifierService.isValidUhid('INVALID-123'), 'Invalid string should fail validation');
assert(!uniqueIdentifierService.isValidUhid('UHID-26-01'), 'Malformed UHID should fail validation');
console.log('  ✓ Verified UHID Atomic Sequence & Validation');

// 2. Verify Staff Code Generation
const docCode = uniqueIdentifierService.generateStaffCode('DOCTOR', 'CARD', 2026);
const nurseCode = uniqueIdentifierService.generateStaffCode('NURSE', undefined, 2026);
const pharmCode = uniqueIdentifierService.generateStaffCode('PHARMACIST', undefined, 2026);
const labCode = uniqueIdentifierService.generateStaffCode('LAB_TECHNICIAN', undefined, 2026);

console.log(`  Doctor Code: ${docCode}`);
console.log(`  Nurse Code: ${nurseCode}`);
console.log(`  Pharmacist Code: ${pharmCode}`);
console.log(`  Lab Code: ${labCode}`);

assert.strictEqual(docCode, 'DOC-CARD-2026-001', 'Doctor code should follow DOC-CARD-2026-001');
assert.strictEqual(nurseCode, 'NUR-2026-001', 'Nurse code should follow NUR-2026-001');
assert.strictEqual(pharmCode, 'PHARM-2026-001', 'Pharmacist code should follow PHARM-2026-001');
assert.strictEqual(labCode, 'LAB-2026-001', 'Lab code should follow LAB-2026-001');
console.log('  ✓ Verified Staff Codes across all clinical roles');

// 3. Verify Partner Code Generation
const clinicCode = uniqueIdentifierService.generatePartnerCode('CLINIC', 'Sharma', 2026);
const pharmacyCode = uniqueIdentifierService.generatePartnerCode('PHARMACY', 'CityMed', 2026);
const labPartnerCode = uniqueIdentifierService.generatePartnerCode('PATHOLOGY', 'ShreeRam', 2026);

assert.strictEqual(clinicCode, 'CLINIC-SHARMA-2026', 'Clinic code should be CLINIC-SHARMA-2026');
assert.strictEqual(pharmacyCode, 'PHARM-CITYMED-2026', 'Pharmacy code should be PHARM-CITYMED-2026');
assert.strictEqual(labPartnerCode, 'LAB-SHREERAM-2026', 'Lab code should be LAB-SHREERAM-2026');
console.log('  ✓ Verified Partner Codes for Clinic, Pharmacy, and Pathology');

// 4. Verify OPD Token & Encounter Number
const opdToken1 = uniqueIdentifierService.generateOpdToken('fac-test');
const opdToken2 = uniqueIdentifierService.generateOpdToken('fac-test');

console.log(`  OPD Token 1: ${opdToken1.tokenDisplay} (${opdToken1.encounterNumber})`);
console.log(`  OPD Token 2: ${opdToken2.tokenDisplay} (${opdToken2.encounterNumber})`);

assert.strictEqual(opdToken1.tokenDisplay, 'TK-01', 'First token should be TK-01');
assert.strictEqual(opdToken2.tokenDisplay, 'TK-02', 'Second token should be TK-02');
assert(opdToken1.encounterNumber.startsWith('ENC-OPD-'), 'Encounter number should start with ENC-OPD-');
console.log('  ✓ Verified Daily OPD Token & Encounter Number Generation');

// 5. Verify Orders & Invoices
const labOrder = uniqueIdentifierService.generateLabOrderNumber('fac-test');
const rxNum = uniqueIdentifierService.generatePrescriptionNumber('doc-1');
const invNum = uniqueIdentifierService.generateInvoiceNumber('PHARMACY');

console.log(`  Lab Order: ${labOrder}`);
console.log(`  Prescription: ${rxNum}`);
console.log(`  Invoice: ${invNum}`);

assert(labOrder.startsWith('LAB-ORD-'), 'Lab order should start with LAB-ORD-');
assert(rxNum.startsWith('RX-'), 'Prescription should start with RX-');
assert(invNum.startsWith('INV-PHARMACY-'), 'Invoice should start with INV-PHARMACY-');
console.log('  ✓ Verified Lab Orders, Prescriptions, and Invoices');

// 6. Verify Identifier Parser
const parsedUhid = uniqueIdentifierService.parseIdentifier(uhid1);
assert.strictEqual(parsedUhid.type, 'UHID');
assert.strictEqual(parsedUhid.year, 2026);
assert.strictEqual(parsedUhid.sequence, 1);
assert.strictEqual(parsedUhid.isValid, true);

const parsedToken = uniqueIdentifierService.parseIdentifier('TK-05');
assert.strictEqual(parsedToken.type, 'TOKEN');
assert.strictEqual(parsedToken.sequence, 5);

console.log('  ✓ Verified Identifier Parser');

console.log('🎉 All Centralized Unique Identifier Service Verifications Passed Cleanly!');
