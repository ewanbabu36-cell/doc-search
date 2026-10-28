import fs from 'fs';

function printDef(file, name) {
  const c = fs.readFileSync(file, 'utf8');
  const idx = c.indexOf(name);
  if (idx !== -1) {
    console.log(`=== ${name} in ${file} ===`);
    console.log(c.slice(idx, idx + 400));
  }
}

printDef('packages/api-contracts/src/partner-platform/insurance-claims-management.schema.ts', 'ReconcileSettlementRequest');
printDef('packages/api-contracts/src/partner-platform/insurance-claims-management.schema.ts', 'PatientInsuranceHistoryDto');
printDef('packages/api-contracts/src/partner-platform/insurance-claims-management.schema.ts', 'InsuranceReconciliationDto');
printDef('packages/api-contracts/src/partner-platform/billing-management.schema.ts', 'AllocatePaymentRequest');
printDef('packages/api-contracts/src/partner-platform/billing-management.schema.ts', 'IssueReceiptRequest');
printDef('packages/api-contracts/src/partner-platform/billing-management.schema.ts', 'SearchBillingInvoicesRequest');
printDef('packages/api-contracts/src/partner-platform/billing-management.schema.ts', 'BillingReceiptDto');
