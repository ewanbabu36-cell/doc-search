import { subscriptionRepository } from '../../repositories/company/SubscriptionRepository.js';
import { productRepository } from '../../repositories/company/ProductRepository.js';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { licenseService } from './LicenseService.js';
import { entitlementService } from './EntitlementService.js';
import { sessionRevocationService } from '../core/SessionRevocationService.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import {
  withSecurityContext,
  getDatabase,
  partnerPlanAssignments,
  commercialOrderSnapshots,
  subscriptions,
  licenses,
  invoices,
  payments,
  eq,
  and,
  type Subscription,
  type NewSubscription
} from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';

export type BillingCycleType =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'PROMOTIONAL_FREE_1_YEAR'
  | 'HALF_YEARLY'
  | 'YEARLY'
  | 'TWO_YEARS'
  | 'THREE_YEARS'
  | 'FIVE_YEARS';

export interface CreateSubscriptionInput {
  partnerId: string;
  productId: string;
  planId: string;
  planVersion?: string | undefined;
  billingCycle?: BillingCycleType | string | undefined;
  isTrial?: boolean | undefined;
  isFirstYearFree?: boolean | undefined;
  metadata?: Record<string, any> | undefined;
}

export class SubscriptionService {
  async getSubscriptions(session: SessionContext): Promise<Subscription[]> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return subscriptionRepository.findMany(tx);
    });
  }

  async getSubscriptionById(id: string, session: SessionContext): Promise<Subscription> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const sub = await subscriptionRepository.findById(id, tx);
      if (!sub) {
        throw AppError.notFound(`Subscription ${id} not found`);
      }
      return sub;
    });
  }

  async getSubscriptionByPartnerId(partnerId: string, session: SessionContext): Promise<Subscription | null> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      return subscriptionRepository.findByPartnerId(partnerId, tx);
    });
  }

  /**
   * Authoritative dynamic date calculation based on database-driven plan metadata
   */
  calculateSubscriptionDates(
    plan: { metadata?: any },
    billingCycle: string = 'MONTHLY',
    isTrial = false,
    startDate: Date = new Date()
  ): { startDate: Date; endDate: Date; renewalDate: Date; gracePeriodEnd: Date } {
    const meta = (plan.metadata || {}) as Record<string, any>;
    const trialDays = Number(meta['trialDays']) || 14;
    const graceDays = Number(meta['gracePeriodDays']) || 30;

    let durationDays: number;
    if (isTrial) {
      durationDays = trialDays;
    } else {
      switch (billingCycle) {
        case 'FIVE_YEARS':
          durationDays = 1825; // 5 * 365
          break;
        case 'THREE_YEARS':
          durationDays = 1095; // 3 * 365
          break;
        case 'TWO_YEARS':
          durationDays = 730;  // 2 * 365
          break;
        case 'YEARLY':
        case 'ANNUAL':
        case 'PROMOTIONAL_FREE_1_YEAR':
          durationDays = 365;
          break;
        case 'HALF_YEARLY':
          durationDays = 180;
          break;
        case 'QUARTERLY':
          durationDays = 90;
          break;
        case 'MONTHLY':
        default:
          durationDays = 30;
          break;
      }
    }

    const startMs = startDate.getTime();
    const endMs = startMs + durationDays * 24 * 60 * 60 * 1000;
    const endDate = new Date(endMs);
    const renewalDate = new Date(endMs);
    const graceMs = endMs + graceDays * 24 * 60 * 60 * 1000;
    const gracePeriodEnd = new Date(graceMs);

    return { startDate, endDate, renewalDate, gracePeriodEnd };
  }

  getTenureOptions() {
    return [
      {
        code: 'YEARLY',
        label: '1 Year (12 Months)',
        months: 12,
        durationDays: 365,
        defaultDiscountPercent: 0,
        badge: '⭐ Standard 1-Year',
        description: 'Standard 1-year annual plan with 0% discount'
      },
      {
        code: 'TWO_YEARS',
        label: '2 Years (24 Months)',
        months: 24,
        durationDays: 730,
        defaultDiscountPercent: 2,
        badge: '🏆 2-Year Plan',
        description: 'Approved 2-year plan with 2% discount'
      },
      {
        code: 'THREE_YEARS',
        label: '3 Years (36 Months)',
        months: 36,
        durationDays: 1095,
        defaultDiscountPercent: 10,
        badge: '💎 3-Year Enterprise',
        description: 'Approved 3-year plan with 10% discount'
      },
      {
        code: 'FIVE_YEARS',
        label: '5 Years (60 Months)',
        months: 60,
        durationDays: 1825,
        defaultDiscountPercent: 20,
        badge: '👑 5-Year Institutional',
        description: 'Approved 5-year plan with 20% discount'
      },
      {
        code: 'HALF_YEARLY',
        label: 'Half-Yearly (6 Months)',
        months: 6,
        durationDays: 180,
        defaultDiscountPercent: 0,
        badge: 'Flexible',
        description: 'Optional 6-month flexibility (0% discount)'
      }
    ];
  }

  calculateCommercialOrder(
    plan: { basePrice?: number | null; metadata?: any },
    durationYears: number = 1,
    customDiscountPercent: number = 0,
    isInterstate: boolean = false
  ) {
    const annualBasePrice = Number(plan.basePrice) || 6000;
    const years = durationYears || 1;
    let defaultDiscountPercent = 0;
    if (years >= 5) defaultDiscountPercent = 20;
    else if (years >= 3) defaultDiscountPercent = 10;
    else if (years >= 2) defaultDiscountPercent = 2;
    else defaultDiscountPercent = 0;

    const discountRate = customDiscountPercent > 0 ? customDiscountPercent : defaultDiscountPercent;
    const grossAmount = Math.round(annualBasePrice * years);
    const discountAmount = Math.round(grossAmount * (discountRate / 100));
    const finalAmount = Math.max(0, grossAmount - discountAmount);

    // GST-inclusive backward calculation (18% SAC 998313)
    const taxableAmount = Math.round((finalAmount / 1.18) * 100) / 100;
    const gstAmount = Math.round((finalAmount - taxableAmount) * 100) / 100;
    const cgst = isInterstate ? 0 : Math.round((gstAmount / 2) * 100) / 100;
    const sgst = isInterstate ? 0 : Math.round((gstAmount - cgst) * 100) / 100;
    const igst = isInterstate ? gstAmount : 0;

    return {
      annualBasePrice,
      annualBasePriceInr: annualBasePrice,
      durationYears: years,
      durationDays: years * 365,
      grossAmount,
      grossAmountInr: grossAmount,
      discountRate,
      discountRatePercent: discountRate,
      discountAmount,
      discountAmountInr: discountAmount,
      finalAmount,
      finalAmountInr: finalAmount,
      taxableAmount,
      taxableAmountInr: taxableAmount,
      gstAmount,
      gstAmountInr: gstAmount,
      gstRatePercent: 18,
      sacCode: '998313',
      cgst,
      cgstAmountInr: cgst,
      sgst,
      sgstAmountInr: sgst,
      igst,
      igstAmountInr: igst,
      currency: 'INR'
    };
  }

  async negotiatePartnerDeal(
    input: {
      partnerId: string;
      planId: string;
      tenureCode: 'HALF_YEARLY' | 'YEARLY' | 'TWO_YEARS' | 'THREE_YEARS' | 'FIVE_YEARS';
      customDiscountAmount?: number | undefined;
      customDiscountPercent?: number | undefined;
      agreedLumpSum?: number | undefined;
      paymentTerms?: string | undefined;
      negotiationNotes?: string | undefined;
    },
    session: SessionContext
  ) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const plan = await productRepository.findPlanById(input.planId, tx);
      if (!plan) {
        throw AppError.badRequest(`Plan ${input.planId} not found`);
      }

      const tenure = this.getTenureOptions().find((t) => t.code === input.tenureCode);
      if (!tenure) {
        throw AppError.badRequest(`Invalid tenure code ${input.tenureCode}`);
      }

      const annualBasePrice = Number(plan.basePrice) || 6000;
      const years = tenure.durationDays / 365;
      const totalGross = Math.round(annualBasePrice * years);
      const defaultTenureDiscountAmount = Math.round(totalGross * (tenure.defaultDiscountPercent / 100));
      const subtotalAfterTenureDiscount = totalGross - defaultTenureDiscountAmount;

      let finalPayable = subtotalAfterTenureDiscount;
      let totalDiscountAmount = defaultTenureDiscountAmount;

      if (input.agreedLumpSum !== undefined && input.agreedLumpSum !== null && input.agreedLumpSum >= 0) {
        finalPayable = Math.round(input.agreedLumpSum);
        totalDiscountAmount = totalGross - finalPayable;
      } else {
        const flatDiscount = Math.max(0, Number(input.customDiscountAmount) || 0);
        const percentDiscount = Math.max(0, Number(input.customDiscountPercent) || 0);
        const percentDiscountAmount = Math.round(subtotalAfterTenureDiscount * (percentDiscount / 100));
        const customTotalDiscount = flatDiscount + percentDiscountAmount;
        finalPayable = Math.max(0, subtotalAfterTenureDiscount - customTotalDiscount);
        totalDiscountAmount = defaultTenureDiscountAmount + customTotalDiscount;
      }

      const monthlyEffectivePrice = Math.round(finalPayable / tenure.months);
      const { startDate, endDate, renewalDate } = this.calculateSubscriptionDates(
        plan,
        input.tenureCode,
        false
      );

      // Check for existing subscription
      let sub = await subscriptionRepository.findByPartnerId(input.partnerId, tx);
      const dealMetadata = {
        isFirstYearFree: false,
        tenureCode: tenure.code,
        tenureLabel: tenure.label,
        tenureMonths: tenure.months,
        monthlyBasePrice: Math.round(annualBasePrice / 12),
        totalGrossAmount: totalGross,
        defaultTenureDiscountPercent: tenure.defaultDiscountPercent,
        defaultTenureDiscountAmount,
        customDiscountAmount: input.customDiscountAmount || 0,
        customDiscountPercent: input.customDiscountPercent || 0,
        agreedLumpSum: input.agreedLumpSum ?? null,
        totalDiscountAmount,
        finalPayableAmount: finalPayable,
        monthlyEffectivePrice,
        paymentTerms: input.paymentTerms || 'FULL_UPFRONT',
        negotiationNotes: input.negotiationNotes || '',
        negotiatedBy: session.actorEmail || 'HQ_ADMIN',
        negotiatedAt: new Date().toISOString()
      };

      if (sub) {
        const updated = await subscriptionRepository.update(
          sub.id,
          {
            planId: input.planId,
            billingCycle: tenure.code,
            startDate,
            endDate,
            renewalDate,
            status: 'ACTIVE',
            metadata: {
              ...(sub.metadata || {}),
              ...dealMetadata
            }
          },
          tx
        );
        sub = updated;
      } else {
        sub = await subscriptionRepository.create(
          {
            id: crypto.randomUUID(),
            partnerId: input.partnerId,
            productId: plan.productId,
            planId: input.planId,
            planVersion: plan.version || '1.0.0',
            status: 'ACTIVE',
            billingCycle: tenure.code,
            startDate,
            endDate,
            renewalDate,
            metadata: dealMetadata
          },
          tx
        );
      }

      await auditRepository.recordEvent(
        {
          eventType: 'SUBSCRIPTION_DEAL_NEGOTIATED',
          resourceType: 'SUBSCRIPTION',
          resourceId: sub.id,
          metadata: {
            partnerId: input.partnerId,
            planId: input.planId,
            tenureCode: tenure.code,
            finalPayableAmount: finalPayable,
            paymentTerms: input.paymentTerms
          }
        },
        session,
        tx
      );

      return {
        subscription: sub,
        dealSummary: {
          planName: plan.name,
          tenure: tenure.label,
          months: tenure.months,
          monthlyBasePrice: Math.round(annualBasePrice / 12),
          totalGross,
          totalDiscountAmount,
          finalPayable,
          monthlyEffectivePrice,
          paymentTerms: input.paymentTerms || 'FULL_UPFRONT',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };
    });
  }

  async createSubscription(
    input: CreateSubscriptionInput,
    session: SessionContext,
    tx?: any
  ): Promise<Subscription> {
    const runner = async (dbTx: any) => {
      const plan = await productRepository.findPlanById(input.planId, dbTx);
      if (!plan) {
        throw AppError.badRequest(`Plan ${input.planId} does not exist in authoritative catalog`);
      }

      const planMeta = (plan.metadata || {}) as Record<string, any>;
      const cycle = input.isFirstYearFree
        ? 'PROMOTIONAL_FREE_1_YEAR'
        : input.billingCycle || (planMeta['billingCadence'] as any) || 'MONTHLY';
      const { startDate, endDate, renewalDate } = this.calculateSubscriptionDates(
        plan,
        cycle,
        Boolean(input.isTrial)
      );

      const status = input.isTrial ? 'TRIAL' : 'ACTIVE';

      const newSubData: NewSubscription = {
        id: crypto.randomUUID(),
        partnerId: input.partnerId,
        productId: input.productId,
        planId: input.planId,
        planVersion: input.planVersion || plan.version || '1.0.0',
        status,
        billingCycle: cycle,
        startDate,
        renewalDate,
        endDate,
        metadata: {
          ...input.metadata,
          isTrial: Boolean(input.isTrial),
          isFirstYearFree: Boolean(input.isFirstYearFree),
          freePeriodStartDate: input.isFirstYearFree ? startDate.toISOString() : null,
          freePeriodEndDate: input.isFirstYearFree ? endDate.toISOString() : null,
          basePrice: planMeta['basePrice'],
          currency: planMeta['currency'] || 'INR'
        }
      };

      const created = await subscriptionRepository.create(newSubData, dbTx);

      await auditRepository.recordEvent(
        {
          eventType: 'SUBSCRIPTION_CREATED',
          resourceType: 'SUBSCRIPTION',
          resourceId: created.id,
          tenantId: session.tenantId,
          metadata: {
            partnerId: input.partnerId,
            planId: input.planId,
            status,
            billingCycle: cycle,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        },
        session,
        dbTx
      );

      return created;
    };

    if (tx) {
      return runner(tx);
    }
    return withSecurityContext(getDatabase(), session, runner);
  }

  async renewSubscription(
    subscriptionId: string,
    options: { billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | undefined; paymentReference?: string | undefined } = {},
    session: SessionContext
  ): Promise<{ subscription: Subscription; license: any }> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const sub = await subscriptionRepository.findById(subscriptionId, tx);
      if (!sub) {
        throw AppError.notFound(`Subscription ${subscriptionId} not found`);
      }

      const plan = await productRepository.findPlanById(sub.planId, tx);
      if (!plan) {
        throw AppError.badRequest(`Plan ${sub.planId} not found for renewal`);
      }

      const cycle = options.billingCycle || (sub.billingCycle as any) || 'MONTHLY';
      const now = new Date();

      // If current endDate is in the future, extend from endDate; otherwise extend from now
      const baseStart = sub.endDate && new Date(sub.endDate) > now ? new Date(sub.endDate) : now;
      const { endDate: newEndDate, renewalDate: newRenewalDate, gracePeriodEnd } =
        this.calculateSubscriptionDates(plan, cycle, false, baseStart);

      const updatedSub = await subscriptionRepository.update(
        subscriptionId,
        {
          status: 'ACTIVE',
          billingCycle: cycle,
          renewalDate: newRenewalDate,
          endDate: newEndDate,
          metadata: {
            ...(sub.metadata as any),
            lastRenewedAt: now.toISOString(),
            lastPaymentReference: options.paymentReference || null
          }
        },
        tx
      );

      // Extend linked license
      const lic = await licenseRepository.findBySubscriptionId(subscriptionId, tx);
      let updatedLic = null;
      if (lic) {
        updatedLic = await licenseService.renewLicense(lic.id, newEndDate, gracePeriodEnd, tx);
      }

      await auditRepository.recordEvent(
        {
          eventType: 'SUBSCRIPTION_RENEWED',
          resourceType: 'SUBSCRIPTION',
          resourceId: subscriptionId,
          tenantId: session.tenantId,
          metadata: {
            partnerId: sub.partnerId,
            planId: sub.planId,
            newEndDate: newEndDate.toISOString(),
            paymentReference: options.paymentReference
          }
        },
        session,
        tx
      );

      return { subscription: updatedSub, license: updatedLic };
    });
  }

  async changePlan(
    subscriptionId: string,
    input: { planId?: string | undefined; planCode?: string | undefined; reason?: string | undefined },
    session: SessionContext
  ): Promise<{ subscription: Subscription; license: any }> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const sub = await subscriptionRepository.findById(subscriptionId, tx);
      if (!sub) {
        throw AppError.notFound(`Subscription ${subscriptionId} not found`);
      }

      let targetPlan = null;
      if (input.planId) {
        targetPlan = await productRepository.findPlanById(input.planId, tx);
      } else if (input.planCode) {
        targetPlan = await productRepository.findPlanByCode(input.planCode, tx);
      }

      if (!targetPlan) {
        throw AppError.badRequest('Target plan not found in authoritative catalog');
      }

      const planMeta = (targetPlan.metadata || {}) as Record<string, any>;
      const now = new Date();

      // Update subscription
      const updatedSub = await subscriptionRepository.update(
        subscriptionId,
        {
          planId: targetPlan.id,
          planVersion: targetPlan.version,
          metadata: {
            ...(sub.metadata as any),
            previousPlanId: sub.planId,
            planChangedAt: now.toISOString(),
            planChangeReason: input.reason || 'Upgrade/Downgrade requested'
          }
        },
        tx
      );

      // Update partnerPlanAssignments
      try {
        await tx
          .update(partnerPlanAssignments)
          .set({
            planId: targetPlan.id,
            assignmentStatus: 'ACTIVE',
            updatedAt: now
          })
          .where(
            and(
              eq(partnerPlanAssignments.partnerId, sub.partnerId),
              eq(partnerPlanAssignments.productId, sub.productId)
            )
          );
      } catch {}

      // Update linked license limits
      const lic = await licenseRepository.findBySubscriptionId(subscriptionId, tx);
      let updatedLic = null;
      if (lic) {
        updatedLic = await licenseService.updateLimits(
          lic.id,
          {
            planId: targetPlan.id,
            maxConcurrentUsers: planMeta['maxConcurrentUsers'],
            maxDoctors: planMeta['maxDoctors'],
            maxBranches: planMeta['maxBranches']
          },
          tx
        );
      }

      await auditRepository.recordEvent(
        {
          eventType: 'SUBSCRIPTION_PLAN_CHANGED',
          resourceType: 'SUBSCRIPTION',
          resourceId: subscriptionId,
          tenantId: session.tenantId,
          metadata: {
            partnerId: sub.partnerId,
            oldPlanId: sub.planId,
            newPlanId: targetPlan.id,
            newPlanCode: targetPlan.code,
            reason: input.reason
          }
        },
        session,
        tx
      );

      return { subscription: updatedSub, license: updatedLic };
    });
  }

  async cancelSubscription(
    subscriptionId: string,
    reason: string,
    session: SessionContext
  ): Promise<Subscription> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const sub = await subscriptionRepository.findById(subscriptionId, tx);
      if (!sub) {
        throw AppError.notFound(`Subscription ${subscriptionId} not found`);
      }

      const now = new Date();
      const updated = await subscriptionRepository.update(
        subscriptionId,
        {
          status: 'CANCELLED',
          cancellationDate: now,
          cancellationReason: reason
        },
        tx
      );

      const lic = await licenseRepository.findBySubscriptionId(subscriptionId, tx);
      if (lic) {
        await licenseService.revokeLicense(lic.id, tx);
      }

      await auditRepository.recordEvent(
        {
          eventType: 'SUBSCRIPTION_CANCELLED',
          resourceType: 'SUBSCRIPTION',
          resourceId: subscriptionId,
          tenantId: session.tenantId,
          metadata: {
            partnerId: sub.partnerId,
            reason
          }
        },
        session,
        tx
      );

      return updated;
    });
  }

  async suspendSubscription(
    subscriptionId: string,
    reason: string,
    session: SessionContext
  ): Promise<Subscription> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const sub = await subscriptionRepository.findById(subscriptionId, tx);
      if (!sub) {
        throw AppError.notFound(`Subscription ${subscriptionId} not found`);
      }

      const updated = await subscriptionRepository.update(
        subscriptionId,
        {
          status: 'SUSPENDED',
          metadata: { ...((sub.metadata || {}) as any), suspensionReason: reason, suspendedAt: new Date().toISOString() }
        },
        tx
      );

      const lic = await licenseRepository.findBySubscriptionId(subscriptionId, tx);
      if (lic) {
        await licenseService.suspendLicense(lic.id, reason, tx);
      }

      if (session.tenantId) {
        sessionRevocationService.revokeTenant(session.tenantId, reason).catch(() => {});
        entitlementService.invalidateTenantCache(session.tenantId);
      }

      await auditRepository.recordEvent(
        {
          eventType: 'SUBSCRIPTION_SUSPENDED',
          resourceType: 'SUBSCRIPTION',
          resourceId: subscriptionId,
          tenantId: session.tenantId,
          metadata: {
            partnerId: sub.partnerId,
            reason
          }
        },
        session,
        tx
      );

      return updated;
    });
  }

  async reactivateSubscription(
    subscriptionId: string,
    session: SessionContext
  ): Promise<Subscription> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const sub = await subscriptionRepository.findById(subscriptionId, tx);
      if (!sub) {
        throw AppError.notFound(`Subscription ${subscriptionId} not found`);
      }

      const updated = await subscriptionRepository.update(
        subscriptionId,
        {
          status: 'ACTIVE'
        },
        tx
      );

      const lic = await licenseRepository.findBySubscriptionId(subscriptionId, tx);
      if (lic) {
        await licenseService.reactivateLicense(lic.id, tx);
      }

      if (session.tenantId) {
        entitlementService.invalidateTenantCache(session.tenantId);
      }

      await auditRepository.recordEvent(
        {
          eventType: 'SUBSCRIPTION_REACTIVATED',
          resourceType: 'SUBSCRIPTION',
          resourceId: subscriptionId,
          tenantId: session.tenantId,
          metadata: {
            partnerId: sub.partnerId
          }
        },
        session,
        tx
      );

      return updated;
    });
  }

  async reconcileExpiries(
    session: SessionContext
  ): Promise<{ active: number; expiringSoon: number; inGracePeriod: number; expired: number }> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const activeSubs = await subscriptionRepository.findActiveOrTrial(tx);
      const counts = { active: 0, expiringSoon: 0, inGracePeriod: 0, expired: 0 };
      const now = new Date();

      for (const sub of activeSubs) {
        const lic = await licenseRepository.findBySubscriptionId(sub.id, tx);
        if (!lic) continue;

        const evaluation = licenseService.evaluateLicenseStatus(lic, now);

        if ((evaluation.status === 'EXPIRED' || evaluation.status === 'LOCKED') && sub.status !== 'EXPIRED' && sub.status !== 'LOCKED') {
          await subscriptionRepository.update(sub.id, { status: 'EXPIRED' }, tx);
          await licenseRepository.update(lic.id, { status: 'LOCKED' }, tx);
          entitlementService.invalidateTenantCache(lic.tenantId);
          counts.expired++;

          await auditRepository.recordEvent(
            {
              eventType: 'SUBSCRIPTION_EXPIRED',
              resourceType: 'SUBSCRIPTION',
              resourceId: sub.id,
              tenantId: lic.tenantId,
              metadata: { partnerId: sub.partnerId, licenseStatus: 'LOCKED' }
            },
            session,
            tx
          );
        } else if (evaluation.status === 'GRACE_PERIOD' && sub.status !== 'GRACE_PERIOD') {
          await subscriptionRepository.update(sub.id, { status: 'GRACE_PERIOD' }, tx);
          await licenseRepository.update(lic.id, { status: 'GRACE_PERIOD' }, tx);
          counts.inGracePeriod++;
        } else if (evaluation.status === 'EXPIRING_SOON' && sub.status !== 'EXPIRING_SOON') {
          await subscriptionRepository.update(sub.id, { status: 'EXPIRING_SOON' }, tx);
          await licenseRepository.update(lic.id, { status: 'EXPIRING_SOON' }, tx);
          counts.expiringSoon++;
        } else if (evaluation.status === 'ACTIVE') {
          counts.active++;
        }
      }

      return counts;
    });
  }

  async reconcileCommercialIntegrity(session: SessionContext) {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const anomalies: Array<{
        type: string;
        severity: 'CRITICAL' | 'WARNING';
        partnerId: string;
        details: string;
      }> = [];

      // 1. Check snapshots that are marked PAID
      const paidSnapshots = await tx
        .select()
        .from(commercialOrderSnapshots)
        .where(eq(commercialOrderSnapshots.status, 'PAID'));

      for (const snap of paidSnapshots) {
        const subs = await tx
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.partnerId, snap.partnerId));

        const sub = subs[0];
        if (!sub || sub.status !== 'ACTIVE') {
          anomalies.push({
            type: 'PAID_BUT_NOT_ACTIVATED',
            severity: 'CRITICAL',
            partnerId: snap.partnerId,
            details: `Commercial snapshot ${snap.id} is PAID, but partner subscription is not active.`
          });
        }

        const lics = await tx
          .select()
          .from(licenses)
          .where(eq(licenses.partnerId, snap.partnerId));

        const lic = lics[0];
        if (!lic || new Date(lic.expiryDate) < new Date()) {
          anomalies.push({
            type: 'PAID_BUT_LICENSE_NOT_EXTENDED',
            severity: 'CRITICAL',
            partnerId: snap.partnerId,
            details: `Commercial snapshot ${snap.id} is PAID for ${snap.billingDurationYears} Year(s), but license is expired or missing.`
          });
        }
      }

      // 2. Check for payments without invoices
      const allPayments = await tx.select().from(payments);
      const allInvoices = await tx.select().from(invoices);
      const invoiceIds = new Set(allInvoices.map((i) => i.id));
      for (const pay of allPayments) {
        if (pay.invoiceId && !invoiceIds.has(pay.invoiceId)) {
          anomalies.push({
            type: 'PAYMENT_WITHOUT_INVOICE',
            severity: 'CRITICAL',
            partnerId: 'system',
            details: `Payment ${pay.id} references non-existent invoice ${pay.invoiceId}`
          });
        }
      }

      // 3. Check for Subscription vs License state mismatches
      const allSubs = await tx.select().from(subscriptions);
      for (const sub of allSubs) {
        const lics = await tx.select().from(licenses).where(eq(licenses.subscriptionId, sub.id));
        const lic = lics[0];
        if (lic && sub.status === 'ACTIVE' && lic.status === 'LOCKED') {
          anomalies.push({
            type: 'SUBSCRIPTION_LICENSE_STATE_MISMATCH',
            severity: 'WARNING',
            partnerId: sub.partnerId,
            details: `Subscription ${sub.id} is ACTIVE but linked license ${lic.id} is LOCKED.`
          });
        }
      }

      return {
        timestamp: new Date().toISOString(),
        scannedSnapshots: paidSnapshots.length,
        scannedSubscriptions: allSubs.length,
        scannedPayments: allPayments.length,
        anomalyCount: anomalies.length,
        isClean: anomalies.length === 0,
        anomalies
      };
    });
  }
}

export const subscriptionService = new SubscriptionService();
