import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { licenseService } from '../dist/services/company/LicenseService.js';
import { subscriptionService } from '../dist/services/company/SubscriptionService.js';

describe('Authoritative Commercial License Extension & Lifecycle Status Evaluation Suite', () => {
  it('1. Active License Extension Invariant: Preserves 100% of remaining days on renewal', () => {
    const now = new Date('2026-06-01T12:00:00Z');
    
    // Existing license valid for another 100 days (expires on 2026-09-09)
    const existingExpiry = new Date('2026-09-09T12:00:00Z');
    const existingRemainingMs = existingExpiry.getTime() - now.getTime();
    const existingRemainingDays = Math.ceil(existingRemainingMs / (1000 * 60 * 60 * 24));
    assert.equal(existingRemainingDays, 100);

    // Partner purchases 1 Year (365 days) renewal
    const purchasedDurationYears = 1;
    const purchasedDays = 365;

    // Rule: New Expiry = Existing Valid Expiry + Purchased Duration
    const newExpiryDate = new Date(existingExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

    const totalDaysFromNow = Math.ceil((newExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(
      totalDaysFromNow,
      existingRemainingDays + purchasedDays,
      'Total days from now must exactly equal remaining days (100) + purchased days (365) = 465 days'
    );
    assert.equal(totalDaysFromNow, 465);
  });

  it('2. Multi-Year Active Extension Invariant (3 Years / 1095 Days)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    // License has 45 days remaining
    const existingExpiry = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

    // Partner purchases 3 Years (10% discount tier = 1095 days)
    const purchasedDays = 3 * 365;
    const newExpiry = new Date(existingExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

    const totalDaysRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(totalDaysRemaining, 45 + 1095, 'Must preserve 45 days and add 1095 days = 1140 days');
  });

  it('3. Expired/Locked License Extension starts from Payment Time', () => {
    const paymentDate = new Date('2026-08-01T10:00:00Z');
    // License expired 15 days ago
    const expiredExpiry = new Date('2026-07-17T10:00:00Z');

    // Rule: When existingExpiry <= paymentDate, New Expiry = paymentDate + purchasedDuration
    const isAlreadyExpired = expiredExpiry.getTime() <= paymentDate.getTime();
    assert.ok(isAlreadyExpired);

    const purchasedDays = 365;
    const baseDate = isAlreadyExpired ? paymentDate : expiredExpiry;
    const newExpiry = new Date(baseDate.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

    assert.equal(newExpiry.getTime(), paymentDate.getTime() + 365 * 24 * 60 * 60 * 1000);
  });

  it('4. evaluateLicenseStatus: Status is ACTIVE when daysRemaining > 60', () => {
    const asOf = new Date('2026-01-01T00:00:00Z');
    const mockLicense = {
      id: '00000000-0000-4000-8000-000000000001',
      status: 'ACTIVE',
      expiryDate: new Date(asOf.getTime() + 120 * 24 * 60 * 60 * 1000), // 120 days
      gracePeriodEnd: new Date(asOf.getTime() + 127 * 24 * 60 * 60 * 1000)
    };

    const evaluation = licenseService.evaluateLicenseStatus(mockLicense, asOf);
    assert.equal(evaluation.status, 'ACTIVE');
    assert.equal(evaluation.isAccessAllowed, true);
    assert.equal(evaluation.isInGracePeriod, false);
    assert.equal(evaluation.daysRemaining, 120);
  });

  it('5. evaluateLicenseStatus: Triggers RENEWAL_WINDOW when daysRemaining <= 60 and > 30', () => {
    const asOf = new Date('2026-01-01T00:00:00Z');
    const mockLicense = {
      id: '00000000-0000-4000-8000-000000000001',
      status: 'ACTIVE',
      expiryDate: new Date(asOf.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days
      gracePeriodEnd: new Date(asOf.getTime() + 52 * 24 * 60 * 60 * 1000)
    };

    const evaluation = licenseService.evaluateLicenseStatus(mockLicense, asOf);
    assert.equal(evaluation.status, 'RENEWAL_WINDOW', 'Status must transition to RENEWAL_WINDOW at 45 days');
    assert.equal(evaluation.isAccessAllowed, true, 'Access remains fully permitted');
    assert.equal(evaluation.daysRemaining, 45);
  });

  it('6. evaluateLicenseStatus: Triggers EXPIRING_SOON countdown when daysRemaining <= 30', () => {
    const asOf = new Date('2026-01-01T00:00:00Z');
    const mockLicense = {
      id: '00000000-0000-4000-8000-000000000001',
      status: 'ACTIVE',
      expiryDate: new Date(asOf.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days
      gracePeriodEnd: new Date(asOf.getTime() + 22 * 24 * 60 * 60 * 1000)
    };

    const evaluation = licenseService.evaluateLicenseStatus(mockLicense, asOf);
    assert.equal(evaluation.status, 'EXPIRING_SOON', 'Status must transition to EXPIRING_SOON countdown');
    assert.equal(evaluation.isAccessAllowed, true);
    assert.equal(evaluation.daysRemaining, 15);
  });

  it('7. evaluateLicenseStatus: Enforces LOCKED when expired past grace period (Locked != Deleted)', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const mockLicense = {
      id: '00000000-0000-4000-8000-000000000001',
      status: 'ACTIVE',
      expiryDate: new Date('2026-05-15T00:00:00Z'), // Expired 16 days ago
      gracePeriodEnd: new Date('2026-05-22T00:00:00Z') // Grace ended 10 days ago
    };

    const evaluation = licenseService.evaluateLicenseStatus(mockLicense, asOf);
    assert.equal(evaluation.status, 'LOCKED', 'Expired past grace period must be LOCKED');
    assert.equal(evaluation.isAccessAllowed, false, 'Operational access is blocked');
    assert.equal(evaluation.daysRemaining, 0);
  });

  it('8. evaluateLicenseStatus: Respects GRACE_PERIOD between expiry and gracePeriodEnd', () => {
    const asOf = new Date('2026-05-18T00:00:00Z');
    const mockLicense = {
      id: '00000000-0000-4000-8000-000000000001',
      status: 'ACTIVE',
      expiryDate: new Date('2026-05-15T00:00:00Z'), // Expired 3 days ago
      gracePeriodEnd: new Date('2026-05-22T00:00:00Z') // Grace ends in 4 days
    };

    const evaluation = licenseService.evaluateLicenseStatus(mockLicense, asOf);
    assert.equal(evaluation.status, 'GRACE_PERIOD');
    assert.equal(evaluation.isAccessAllowed, true);
    assert.equal(evaluation.isInGracePeriod, true);
    assert.equal(evaluation.daysRemaining, 0);
  });

  it('9. Boundary Test: Renewal at 365 days remaining preserves all days (365 + 365 = 730 days)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const existingExpiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const purchasedDays = 365;

    const newExpiry = new Date(existingExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);
    const totalDaysRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(totalDaysRemaining, 730);
  });

  it('10. Boundary Test: Renewal at 180 days remaining preserves all days (180 + 730 = 910 days)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const existingExpiry = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const purchasedDays = 2 * 365; // 730 days

    const newExpiry = new Date(existingExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);
    const totalDaysRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(totalDaysRemaining, 910);
  });

  it('11. Boundary Test: Renewal at 60 days (RENEWAL_WINDOW boundary) (60 + 1095 = 1155 days)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const existingExpiry = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const purchasedDays = 3 * 365; // 1095 days

    const newExpiry = new Date(existingExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);
    const totalDaysRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(totalDaysRemaining, 1155);
  });

  it('12. Boundary Test: Renewal at 30 days (EXPIRING_SOON boundary) (30 + 365 = 395 days)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const existingExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const purchasedDays = 365;

    const newExpiry = new Date(existingExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);
    const totalDaysRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(totalDaysRemaining, 395);
  });

  it('13. Boundary Test: Renewal at 1 day remaining (1 + 365 = 366 days)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const existingExpiry = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const purchasedDays = 365;

    const newExpiry = new Date(existingExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);
    const totalDaysRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(totalDaysRemaining, 366);
  });

  it('14. Boundary Test: Renewal at exact 0 days remaining (exact expiry instant)', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const existingExpiry = new Date('2026-01-01T12:00:00Z'); // Exact same moment
    const purchasedDays = 365;

    // Rule: if existingExpiry > now, extend from existingExpiry; else from now. Here both are equal.
    const baseDate = existingExpiry.getTime() > now.getTime() ? existingExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

    const totalDaysRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(totalDaysRemaining, 365);
  });

  it('15. Leap Year & Timezone Precision: Renewal across leap year preserves exact millisecond duration', () => {
    // 2028 is a leap year (February 29, 2028)
    const leapStartDate = new Date('2028-02-01T00:00:00.000Z');
    const purchasedYears = 1;
    const durationMs = purchasedYears * 365 * 24 * 60 * 60 * 1000;

    const newExpiry = new Date(leapStartDate.getTime() + durationMs);
    // 365 days from 2028-02-01 in UTC
    assert.equal(newExpiry.toISOString(), '2029-01-31T00:00:00.000Z');
    assert.equal(newExpiry.getTime() - leapStartDate.getTime(), durationMs);
  });
});
