import fs from 'fs';
import path from 'path';

function searchInDir(dir, needle) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchInDir(full, needle);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes(needle)) {
        console.log(`Found "${needle}" in ${full}`);
      }
    }
  }
}

searchInDir('packages/api-contracts/src', 'ReconcileSettlementRequest');
searchInDir('packages/api-contracts/src', 'PatientInsuranceHistoryDto');
searchInDir('packages/api-contracts/src', 'AllocatePaymentRequest');
searchInDir('packages/api-contracts/src', 'IssueReceiptRequest');
searchInDir('packages/api-contracts/src', 'SearchBillingInvoicesRequest');
