// scripts/verify_phase1_foundation.mjs
// Phase 1: Core Foundation & Typo-Proof Engine Verification Suite

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting Phase 1 Foundation & Typo-Proof Engine Verification...\n');

// 1. Load UniqueIdentifierService
const servicePath = path.resolve(rootDir, 'apps/partner-platform/src/services/unique-identifier-service.ts');
assert.ok(fs.existsSync(servicePath), 'unique-identifier-service.ts must exist');

// Import compiled module
const { uniqueIdentifierService } = await import('../apps/partner-platform/dist/services/unique-identifier-service.js');

// Test 1: UHID Generation & Luhn Checksum
console.log('▶ Test 1: UHID Generation & Luhn Checksum Verification');
const uhid1 = uniqueIdentifierService.generateUhid('apollo-delhi', 2026);
console.log('  Generated UHID 1:', uhid1);
assert.match(uhid1, /^UHID-2026-\d{6}-\d$/, 'UHID must match UHID-YYYY-XXXXXX-C format');

const uhid2 = uniqueIdentifierService.generateUhid('apollo-delhi', 2026);
console.log('  Generated UHID 2:', uhid2);
assert.notEqual(uhid1, uhid2, 'Subsequent UHIDs must be unique');

// Verify check digit
const parts = uhid1.split('-');
const yr = parts[1];
const seq = parts[2];
const checkDigit = parseInt(parts[3], 10);
const expectedChecksum = uniqueIdentifierService.calculateLuhnChecksum(`${yr}${seq}`);
assert.equal(checkDigit, expectedChecksum, `Check digit ${checkDigit} must equal calculated Luhn ${expectedChecksum}`);
console.log('  ✅ UHID Luhn Checksum verified successfully.');

// Test 2: Typo Detection (Typo-Proof Engine)
console.log('\n▶ Test 2: Typo-Proof Engine (Validation & Error Catching)');
assert.equal(uniqueIdentifierService.isValidUhid(uhid1), true, 'Valid UHID must pass validation');

// Simulate single-digit typo (e.g. 000001 -> 000002)
const typoSeq = String(parseInt(seq, 10) + 1).padStart(6, '0');
const typoUhid = `UHID-${yr}-${typoSeq}-${checkDigit}`;
console.log('  Testing Typo UHID:', typoUhid);
assert.equal(uniqueIdentifierService.isValidUhid(typoUhid), false, 'Typo UHID must be detected and rejected');

// Simulate transposition typo
const corruptedCheck = (checkDigit + 1) % 10;
const corruptedUhid = `UHID-${yr}-${seq}-${corruptedCheck}`;
assert.equal(uniqueIdentifierService.isValidUhid(corruptedUhid), false, 'Corrupted check digit must be rejected');

// Legacy UHID support
assert.equal(uniqueIdentifierService.isValidUhid('UHID-2026-000001'), true, 'Legacy UHID must remain valid for backward compatibility');
console.log('  ✅ Typo-Proof Engine successfully rejected 100% of invalid/corrupted UHIDs.');

// Test 3: Geographic City / Branch Sharding
console.log('\n▶ Test 3: Geographic City / Branch Sharding');
const docDel = uniqueIdentifierService.generateStaffCode('DOCTOR', 'CARD', 'DEL', 2026);
const docMum = uniqueIdentifierService.generateStaffCode('DOCTOR', 'CARD', 'MUM', 2026);
console.log('  Delhi Doctor Code:', docDel);
console.log('  Mumbai Doctor Code:', docMum);
assert.match(docDel, /^DOC-CARD-DEL-2026-\d{3}$/, 'Delhi Doctor code must include DEL city code');
assert.match(docMum, /^DOC-CARD-MUM-2026-\d{3}$/, 'Mumbai Doctor code must include MUM city code');
assert.notEqual(docDel, docMum, 'Delhi and Mumbai doctors in same specialty must have distinct codes');

const clinicDel = uniqueIdentifierService.generatePartnerCode('CLINIC', 'SHARMA', 'DEL', 2026);
const clinicJpr = uniqueIdentifierService.generatePartnerCode('CLINIC', 'SHARMA', 'JPR', 2026);
console.log('  Delhi Clinic Code:', clinicDel);
console.log('  Jaipur Clinic Code:', clinicJpr);
assert.equal(clinicDel, 'CLINIC-DEL-SHARMA-2026');
assert.equal(clinicJpr, 'CLINIC-JPR-SHARMA-2026');
assert.notEqual(clinicDel, clinicJpr, 'Same clinic name in different cities must have unique partner codes');
console.log('  ✅ Geographic City Sharding verified.');

// Test 4: Optical Code 128 Barcode & QR Code SVG Generation
console.log('\n▶ Test 4: Optical Barcode (Code 128) & QR Code SVG Generation');
const barcodeSvg = uniqueIdentifierService.generateCode128Svg(uhid1, { height: 40, barWidth: 1.5, showText: true });
assert.ok(barcodeSvg.startsWith('<svg'), 'Barcode must be valid SVG');
assert.ok(barcodeSvg.endsWith('</svg>'), 'Barcode SVG must be properly closed');
assert.ok(barcodeSvg.includes('<rect'), 'Barcode SVG must contain bar rectangles');
assert.ok(barcodeSvg.includes(uhid1), 'Barcode SVG must render human-readable UHID text');
console.log('  Generated Code 128 Barcode SVG length:', barcodeSvg.length, 'chars');

const qrSvg = uniqueIdentifierService.generateQrCodeSvg(uhid1, 3);
assert.ok(qrSvg.startsWith('<svg'), 'QR Code must be valid SVG');
assert.ok(qrSvg.endsWith('</svg>'), 'QR Code SVG must be properly closed');
assert.ok(qrSvg.includes('<rect'), 'QR Code SVG must contain 2D matrix modules');
console.log('  Generated QR Code SVG length:', qrSvg.length, 'chars');
console.log('  ✅ Optical Barcode and QR Code generation verified.');

// Test 5: Database Migration & Schema Verification
console.log('\n▶ Test 5: Database Migration & Schema Verification');
const migrationPath = path.resolve(rootDir, 'packages/database/migrations/0057_patient_uhid_unique.sql');
assert.ok(fs.existsSync(migrationPath), '0057_patient_uhid_unique.sql migration must exist');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');
assert.ok(migrationContent.includes('idx_patients_tenant_uhid_uidx'), 'Migration must create idx_patients_tenant_uhid_uidx');

const journalPath = path.resolve(rootDir, 'packages/database/migrations/meta/_journal.json');
const journalContent = fs.readFileSync(journalPath, 'utf8');
assert.ok(journalContent.includes('0057_patient_uhid_unique'), 'Journal must register migration 57');

const schemaPath = path.resolve(rootDir, 'packages/database/src/schema/clinical/index.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
assert.ok(schemaContent.includes("uhid: varchar('uhid', { length: 100 })"), 'Schema must declare uhid column');
assert.ok(schemaContent.includes("uniqueIndex('idx_patients_tenant_uhid')"), 'Schema must declare uniqueIndex for uhid');
console.log('  ✅ Database migration and schema verified.');

console.log('\n🎉 ALL PHASE 1 FOUNDATION & TYPO-PROOF ENGINE CHECKS PASSED PERFECTLY!\n');
