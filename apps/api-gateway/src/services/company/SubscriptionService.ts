import { subscriptionRepository } from '../../repositories/company/SubscriptionRepository.js';
import { productRepository } from '../../repositories/company/ProductRepository.js';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { licenseService } from './LicenseService.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';
import { type SessionContext } from '@docsearch/auth';
import {
  withSecurityContext,
  getDatabase,
  partnerPlanAssignments,
  eq,
  and,
  type Subscription,
  type NewSubscription
} from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';

export interface CreateSubscriptionInput {
  partnerId: string;
  productId: string;
  planId: string;
  planVersion?: string | undefined;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | undefined;
  isTrial?: boolean | undefined;
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
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' = 'MONTHLY',
    isTrial = false,
    startDate: Date = new Date()
  ): { startDate: Date; endDate: Date; renewalDate: Date; gracePeriodEnd: Date } {
    const meta = (plan.metadata || {}) as Record<string, any>;
    const trialDays = Number(meta['trialDays']) || 14;
    const graceDays = Number(meta['gracePeriodDays']) || 7;

    let durationDays: number;
    if (isTrial) {
      durationDays = trialDays;
    } else {
      switch (billingCycle) {
        case 'ANNUAL':
          durationDays = 365;
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
      const cycle = input.billingCycle || (planMeta['billingCadence'] as any) || 'MONTHLY';
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

        if (evaluation.status === 'EXPIRED' && sub.status !== 'EXPIRED') {
          await subscriptionRepository.update(sub.id, { status: 'EXPIRED' }, tx);
          await licenseRepository.update(lic.id, { status: 'EXPIRED' }, tx);
          counts.expired++;

          await auditRepository.recordEvent(
            {
              eventType: 'SUBSCRIPTION_EXPIRED',
              resourceType: 'SUBSCRIPTION',
              resourceId: sub.id,
              tenantId: lic.tenantId,
              metadata: { partnerId: sub.partnerId }
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
}

export const subscriptionService = new SubscriptionService();
