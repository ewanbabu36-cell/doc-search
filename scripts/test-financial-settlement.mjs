import pg from 'pg';
import { notificationDispatchService } from '../apps/api-gateway/dist/services/notification-dispatch.service.js';
import { signJwt } from '../packages/auth/dist/index.js';

const API_BASE = 'http://127.0.0.1:4000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const client = new pg.Client({ connectionString: DB_URL });

const authToken = signJwt({
  sub: 'usr-fin-001',
  userId: 'usr-fin-001',
  tenantId: '6855be07-5298-4148-a571-c51ac49ac7f3',
  roles: ['HOSPITAL_ADMIN', 'FINANCE_CONTROLLER', 'SUPER_ADMIN'],
  permissions: ['*'],
  email: 'finance@docsearch.health'
}, {
  secret: process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade',
  issuer: 'docsearch-api',
  audience: 'docsearch-platform',
  expiresInSeconds: 3600
});

async function main() {
  await client.connect();
  console.log('--- PB-03 / PB-04 / PB-05 FINANCIAL SETTLEMENT & STATUTORY TDS AUDIT ---');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  // Test Case 1: Standard Professional Medical Consultant (Section 194J - 10%)
  const case1 = await fetch(`${API_BASE}/api/v1/partner/billing/doctor-payouts/settlements/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      doctorName: 'Dr. Vivek Sharma (MS Gen Surg)',
      grossBilled: 20000,
      opdConsultationCutPct: 70.0,
      payeeTaxCategory: 'SECTION_194J_PROFESSIONAL',
      hasValidPan: true
    })
  }).then(r => r.json());
  console.log('\nCase 1: Standard 194J (10% TDS):');
  console.log(`- Doctor Gross: ₹${case1.data?.grossEarnings}, TDS: ₹${case1.data?.tdsDeducted} (${case1.data?.tdsRate}%), Net: ₹${case1.data?.netPayableToDoctor}`);
  console.log(`- Statutory Section: ${case1.data?.statutorySection}`);

  // Test Case 2: Technical Bio-Medical / Diagnostic Equipment Consultant (Section 194J - 2%)
  const case2 = await fetch(`${API_BASE}/api/v1/partner/billing/doctor-payouts/settlements/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      doctorName: 'Dr. Neha Kapoor (Biomedical Tech Lead)',
      grossBilled: 50000,
      opdConsultationCutPct: 80.0,
      payeeTaxCategory: 'SECTION_194J_TECHNICAL',
      hasValidPan: true
    })
  }).then(r => r.json());
  console.log('\nCase 2: Technical 194J (2% TDS):');
  console.log(`- Doctor Gross: ₹${case2.data?.grossEarnings}, TDS: ₹${case2.data?.tdsDeducted} (${case2.data?.tdsRate}%), Net: ₹${case2.data?.netPayableToDoctor}`);
  console.log(`- Statutory Section: ${case2.data?.statutorySection}`);

  // Test Case 3: Payee without PAN - Section 206AA Penalty Rate (20%)
  const case3 = await fetch(`${API_BASE}/api/v1/partner/billing/doctor-payouts/settlements/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      doctorName: 'Visiting Locum Specialist (PAN Absent)',
      grossBilled: 30000,
      opdConsultationCutPct: 75.0,
      payeeTaxCategory: 'SECTION_194J_PROFESSIONAL',
      hasValidPan: false
    })
  }).then(r => r.json());
  console.log('\nCase 3: Missing PAN Section 206AA (20% TDS):');
  console.log(`- Doctor Gross: ₹${case3.data?.grossEarnings}, TDS: ₹${case3.data?.tdsDeducted} (${case3.data?.tdsRate}%), Net: ₹${case3.data?.netPayableToDoctor}`);
  console.log(`- Statutory Section: ${case3.data?.statutorySection}`);

  // Test Case 4: Lower Deduction Certificate under Section 197 (1.5%)
  const case4 = await fetch(`${API_BASE}/api/v1/partner/billing/doctor-payouts/settlements/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      doctorName: 'Senior Super-Specialist (Cert 197)',
      grossBilled: 100000,
      opdConsultationCutPct: 85.0,
      payeeTaxCategory: 'SECTION_197_LOWER_DEDUCTION',
      lowerTdsRate: 1.5,
      certificate197Number: 'IT-CERT-197-2026-9901A',
      hasValidPan: true
    })
  }).then(r => r.json());
  console.log('\nCase 4: Section 197 Lower Deduction Certificate (1.5% TDS):');
  console.log(`- Doctor Gross: ₹${case4.data?.grossEarnings}, TDS: ₹${case4.data?.tdsDeducted} (${case4.data?.tdsRate}%), Net: ₹${case4.data?.netPayableToDoctor}`);
  console.log(`- Statutory Section: ${case4.data?.statutorySection}`);

  // Assertions for Dynamic TDS
  const pass1 = case1.data?.tdsRate === 10 && case1.data?.tdsDeducted > 0;
  const pass2 = case2.data?.tdsRate === 2 && case2.data?.tdsDeducted > 0;
  const pass3 = case3.data?.tdsRate === 20 && case3.data?.tdsDeducted > 0;
  const pass4 = case4.data?.tdsRate === 1.5 && case4.data?.tdsDeducted > 0;

  // Test Case 5: WhatsApp Delivery Webhook States (SENT vs DELIVERED vs READ vs FAILED)
  console.log('\n[WhatsApp Meta Cloud API Webhook DLR Processing]');
  
  const mockWebhookSent = {
    entry: [{ changes: [{ value: { statuses: [{ id: 'wamid_test_001', status: 'sent' }] } }] }]
  };
  const mockWebhookDelivered = {
    entry: [{ changes: [{ value: { statuses: [{ id: 'wamid_test_002', status: 'delivered' }] } }] }]
  };
  const mockWebhookFailed = {
    entry: [{ changes: [{ value: { statuses: [{ id: 'wamid_test_003', status: 'failed' }] } }] }]
  };

  const resSent = notificationDispatchService.processDeliveryWebhook('META_WHATSAPP', mockWebhookSent);
  const resDelivered = notificationDispatchService.processDeliveryWebhook('META_WHATSAPP', mockWebhookDelivered);
  const resFailed = notificationDispatchService.processDeliveryWebhook('META_WHATSAPP', mockWebhookFailed);

  console.log('Processed Sent Status:', resSent.status);
  console.log('Processed Delivered Status:', resDelivered.status);
  console.log('Processed Failed Status:', resFailed.status);

  const passWebhook = resSent.status === 'SENT' && resDelivered.status === 'DELIVERED' && resFailed.status === 'FAILED';

  await client.end();

  if (pass1 && pass2 && pass3 && pass4 && passWebhook) {
    console.log('\n🏆 PB-03 / PB-04 / PB-05 FINANCIAL & TDS STATUTORY AUDIT PASSED!');
    process.exit(0);
  } else {
    console.error('\n❌ FINANCIAL & TDS STATUTORY AUDIT FAILED!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in financial settlement test:', err);
  process.exit(1);
});
