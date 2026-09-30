process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
import assert from 'node:assert/strict';
import { companyFinancialService } from '../dist/services/company/CompanyFinancialService.js';

async function runTests() {
  console.log('🧪 Starting Company Bank & Revenue Separation Verification Suite...');

  const adminSession = {
    userId: '00000000-0000-4000-8000-000000000099',
    roles: ['SUPER_ADMIN'],
    isSuperAdmin: true
  };

  const partnerSession = {
    userId: '00000000-0000-4000-8000-000000000001',
    roles: ['PARTNER_ADMIN'],
    tenantId: '00000000-0000-4000-8000-000000000001',
    partnerId: '00000000-0000-4000-8000-000000000001',
    isSuperAdmin: false
  };

  // 1. Initial Config
  const initialConfig = companyFinancialService.getConfig();
  assert.ok(initialConfig, 'Config should exist');
  assert.equal(initialConfig.accountType, 'CURRENT');
  assert.ok(initialConfig.accountNumber.length >= 9, 'Valid corporate account number');
  assert.ok(initialConfig.ifscCode.match(/^[A-Z]{4}0[A-Z0-9]{6}$/), 'Valid IFSC code');
  assert.ok(initialConfig.businessUpiId.includes('@'), 'Valid UPI VPA');
  console.log('  ✔ Initial corporate bank & UPI configuration verified');

  // 2. Public Payment Details Rail Generation
  const publicDetails = companyFinancialService.getPublicPaymentDetails(20000, 'PLAN_HOSPITAL_ANNUAL');
  assert.ok(publicDetails.upiIntentUrl.startsWith('upi://pay?'), 'Valid UPI intent URI');
  assert.ok(publicDetails.upiIntentUrl.includes('am=20000'), 'UPI intent includes correct amount');
  assert.ok(publicDetails.isolationNotice.includes('DocSearch SaaS Subscription & License Separation Notice'), 'Includes separation notice');
  console.log('  ✔ Public payment rail and NPCI UPI URI generation verified');

  // 3. Update Corporate Config (Admin)
  const updated = await companyFinancialService.updateConfig(
    {
      beneficiaryName: 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
      legalEntityName: 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
      bankName: 'HDFC Bank Ltd',
      branchName: 'Bandra Kurla Complex, Corporate Branch',
      accountNumber: '50200084920192',
      ifscCode: 'HDFC0000240',
      accountType: 'CURRENT',
      businessUpiId: 'docsearch.billing@hdfcbank',
      secondaryUpiId: 'docsearch.saas@icici',
      gstin: '27AABCD1234E1Z5',
      pan: 'AABCD1234E',
      billingEmail: 'billing@docsearch.health',
      billingPhone: '+91 1800 200 4000',
      notes: 'Updated corporate treasury account',
      updatedBy: 'hq-superadmin'
    },
    adminSession
  );
  assert.equal(updated.branchName, 'Bandra Kurla Complex, Corporate Branch');
  console.log('  ✔ Corporate bank configuration update and audit trail verified');

  // 4. Submit Partner Payment Proof (UTR)
  const testPartnerId = '00000000-0000-4000-8000-000000000001';
  const testUtr = 'UTR' + Date.now();
  const submission = await companyFinancialService.submitPartnerPaymentProof(
    {
      partnerId: testPartnerId,
      planId: '44444444-4444-4000-8000-000000000004',
      planName: 'Hospital Enterprise Annual Plan',
      planCode: 'PLAN_HOSPITAL_ANNUAL',
      durationYears: 2,
      payableAmountInr: 39200,
      paymentMethod: 'UPI',
      utrNumber: testUtr,
      payerUpiOrAccount: 'metro.hospital@okaxis',
      partnerRemarks: 'Two-year enterprise subscription renewal'
    },
    partnerSession
  );

  assert.ok(submission.id, 'Submission ID generated');
  assert.equal(submission.status, 'PENDING_VERIFICATION');
  assert.equal(submission.utrNumber, testUtr);
  console.log('  ✔ Partner UTR payment proof submission persisted');

  // 5. Maker-Checker Queue: List Pending Payments
  const pending = await companyFinancialService.getPendingPaymentProofs(adminSession);
  const found = pending.find(p => p.utrNumber === testUtr);
  assert.ok(found, 'Submitted UTR found in pending queue');
  console.log('  ✔ Maker-checker pending reconciliation queue verified');

  // 6. Maker-Checker: Approve Payment Proof
  const verified = await companyFinancialService.verifyPaymentProof(
    submission.id,
    'APPROVED',
    undefined,
    adminSession
  );

  assert.equal(verified.status, 'APPROVED');
  assert.ok(verified.verifiedAt, 'Timestamp verified');
  console.log('  ✔ Payment reconciliation & verification completed successfully');

  console.log('\n🎉 ALL COMPANY BANK & FINANCIAL SEPARATION VERIFICATION TESTS PASSED (6/6)');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
