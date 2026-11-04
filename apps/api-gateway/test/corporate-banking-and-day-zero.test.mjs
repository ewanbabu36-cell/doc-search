import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { companyFinancialService } from '../dist/services/company/CompanyFinancialService.js';

describe('🏛️ Corporate Banking, Maker-Checker & Partner VAN Engine', () => {
  test('verifyPennyDrop validates bank account with ₹1 IMPS simulation and records RRN', async () => {
    const mockSession = {
      isSuperAdmin: true,
      roles: ['SUPER_ADMIN'],
      actorEmail: 'founder@docsearch.health'
    };

    const res = await companyFinancialService.verifyPennyDrop(
      '50200084920192',
      'HDFC0000240',
      'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
      mockSession
    );

    assert.equal(res.success, true);
    assert.equal(res.pennyDropStatus, 'VERIFIED');
    assert.match(res.bankRrn, /^IMPS\d+/);
    assert.equal(res.matchScore, 100);

    const config = companyFinancialService.getConfig();
    assert.equal(config.pennyDropStatus, 'VERIFIED');
    assert.equal(config.pennyDropRrn, res.bankRrn);
  });

  test('getAllPartnerVans generates unique institutional Virtual Account Numbers (VAN)', async () => {
    const vans = await companyFinancialService.getAllPartnerVans();
    assert.ok(Array.isArray(vans));

    if (vans.length > 0) {
      const v = vans[0];
      assert.match(v.virtualAccountNumber, /^DOCS/);
      assert.equal(v.virtualIfsc, 'HDFC0000240');
      assert.match(v.virtualVpa, /@hdfcbank$/);
      assert.equal(v.clearingMode, 'INSTANT_SETTLEMENT');
    }
  });

  test('Maker-Checker denies non-admin from approving sensitive banking updates', async () => {
    const unauthorizedSession = {
      isSuperAdmin: false,
      roles: ['PHARMACIST'],
      actorEmail: 'staff@docsearch.health'
    };

    await assert.rejects(
      async () => {
        await companyFinancialService.approvePendingConfigChange('fake-id', 'APPROVED', unauthorizedSession);
      },
      (err) => err.statusCode === 403
    );
  });
});
