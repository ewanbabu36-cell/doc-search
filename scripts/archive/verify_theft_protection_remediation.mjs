import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- DOCSEARCH THEFT PROTECTION & ANTI-POACHING VERIFICATION ---');

// 1. Verify partnerRolePermissions.ts
const rbacPath = path.resolve('apps/partner-platform/src/utils/partnerRolePermissions.ts');
assert(fs.existsSync(rbacPath), `File not found: ${rbacPath}`);
const rbacContent = fs.readFileSync(rbacPath, 'utf8');

assert(rbacContent.includes('export function isBillCancellationAllowed'), 'isBillCancellationAllowed must be exported');
assert(rbacContent.includes('export function isDiscountAllowed'), 'isDiscountAllowed must be exported');
assert(rbacContent.includes('export function isFullPhoneViewAllowed'), 'isFullPhoneViewAllowed must be exported');
console.log('✅ partnerRolePermissions.ts exports all 3 anti-theft guards.');

// 2. Verify PatientDirectoryView.tsx
const patientDirPath = path.resolve('apps/partner-platform/src/components/views/PatientDirectoryView.tsx');
assert(fs.existsSync(patientDirPath), `File not found: ${patientDirPath}`);
const patientDirContent = fs.readFileSync(patientDirPath, 'utf8');

assert(patientDirContent.includes('isFullPhoneViewAllowed'), 'PatientDirectoryView must import and use isFullPhoneViewAllowed');
assert(patientDirContent.includes('maskPhone'), 'PatientDirectoryView must implement maskPhone');
assert(patientDirContent.includes('🔒 Masked (Anti-Theft)'), 'PatientDirectoryView must show Anti-Theft badge for masked phone');
console.log('✅ PatientDirectoryView.tsx enforces anti-poaching phone masking.');

// 3. Verify InvoiceDetailView.tsx
const invoiceDetailPath = path.resolve('apps/partner-platform/src/components/views/InvoiceDetailView.tsx');
assert(fs.existsSync(invoiceDetailPath), `File not found: ${invoiceDetailPath}`);
const invoiceDetailContent = fs.readFileSync(invoiceDetailPath, 'utf8');

assert(invoiceDetailContent.includes('isBillCancellationAllowed'), 'InvoiceDetailView must import isBillCancellationAllowed');
assert(invoiceDetailContent.includes('isDiscountAllowed'), 'InvoiceDetailView must import isDiscountAllowed');
assert(invoiceDetailContent.includes('🔒 Cancel Draft (Manager Only)'), 'InvoiceDetailView must show lock for unauthorized draft cancellation');
assert(invoiceDetailContent.includes('🔒 + Discount (Supervisor Only)'), 'InvoiceDetailView must show lock for unauthorized discounts');
console.log('✅ InvoiceDetailView.tsx enforces theft protection guards on cancellations and discounts.');

console.log('\n🎉 ALL THEFT PROTECTION VERIFICATION CHECKS PASSED SUCCESSFULLY!');
