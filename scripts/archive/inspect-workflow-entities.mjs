import fs from 'node:fs';

const c = fs.readFileSync('apps/api-gateway/src/repositories/partner/BillingManagementRepository.ts', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('async ') && (l.includes('Invoice') || l.includes('invoice') || l.includes('Payment') || l.includes('payment') || l.includes('cancel') || l.includes('void') || l.includes('refund') || l.includes('status'))) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
