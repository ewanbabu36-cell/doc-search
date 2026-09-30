import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { subscriptionService } from '../../services/company/SubscriptionService.js';
import { licenseService } from '../../services/company/LicenseService.js';
import { commercialFinanceService } from '../../services/company/CommercialFinanceService.js';
import { billingManagementService } from '../../services/partner/BillingManagementService.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import {
  getDatabase,
  commercialOrderSnapshots,
  priceVersions,
  partnerProfiles,
  plans,
  products,
  subscriptions,
  licenses,
  tenants,
  partnerClassifications,
  commercialOverrides,
  companyAuditTraces,
  invoices,
  features,
  planEntitlements,
  eq,
  desc,
  asc
} from '@docsearch/database';
import crypto from 'node:crypto';

// Audit helper for server-authoritative commercial mutations
async function recordCommercialAuditTrace(
  db: any,
  params: {
    actorEmail: string;
    action: string;
    entityReference: string;
    reason: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    await db.insert(companyAuditTraces).values({
      id: crypto.randomUUID(),
      traceId: `trace_com_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      actorEmail: params.actorEmail,
      action: params.action,
      entityReference: params.entityReference,
      operationStatus: 'SUCCESS',
      occurredAt: new Date(),
      reason: params.reason,
      metadata: params.metadata || {}
    });
  } catch (err) {
    console.warn('[WARN] Failed to write company_audit_traces record:', err);
  }
}

const APPROVED_DURATIONS = [1, 2, 3, 5] as const;

const CalculateOrderSchema = z.object({
  planId: z.string().uuid(),
  durationYears: z
    .number()
    .int()
    .refine((v) => APPROVED_DURATIONS.includes(v as any), {
      message: 'Approved billing duration must be 1, 2, 3, or 5 years'
    })
    .default(1),
  customDiscountPercent: z.number().min(0).max(100).optional().default(0),
  isInterstate: z.boolean().optional().default(false),
  customerGstin: z.string().optional()
});

const CreateCheckoutOrderSchema = z.object({
  partnerId: z.string().uuid(),
  planId: z.string().uuid(),
  durationYears: z
    .number()
    .int()
    .refine((v) => APPROVED_DURATIONS.includes(v as any), {
      message: 'Approved billing duration must be 1, 2, 3, or 5 years'
    })
    .default(1),
  customDiscountPercent: z.number().min(0).max(100).optional().default(0),
  isInterstate: z.boolean().optional().default(false),
  customerGstin: z.string().optional(),
  customerBillingAddress: z.string().optional().default('India')
});

export const commercialRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/commercial/plans - Public/Partner accessible list of commercial plans with GST-inclusive pricing
  fastify.get('/api/v1/commercial/plans', async (_request, reply) => {
    const db = getDatabase();
    const activePlans = await db.select().from(plans).where(eq(plans.status, 'ACTIVE'));
    const activeVersions = await db.select().from(priceVersions).where(eq(priceVersions.isActive, true));

    const enriched = activePlans.map((plan) => {
      const pv = activeVersions.find((v) => v.planId === plan.id);
      return {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        annualBasePriceInr: pv ? pv.annualBasePriceInr : (plan.basePrice || 6000),
        currency: 'INR',
        billingInterval: 'ANNUAL',
        priceVersion: pv ? pv.versionNumber : 'v1.0',
        gstInclusive: true,
        sacCode: pv?.sacCode || '998313'
      };
    });

    return reply.status(200).send({
      success: true,
      data: enriched
    });
  });

  // POST /api/v1/commercial/calculate-order - Server-authoritative order calculation
  fastify.post('/api/v1/commercial/calculate-order', async (request, reply) => {
    const parseResult = CalculateOrderSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new AppError({
        message: 'Invalid calculate-order payload',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    const { planId, durationYears, customDiscountPercent, isInterstate } = parseResult.data;
    const db = getDatabase();
    const plan = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan[0]) {
      throw AppError.notFound(`Plan ${planId} not found`);
    }

    const reqSession = (request as any).session;
    const isPrivilegedAdminCalc = Boolean(
      reqSession?.isSuperAdmin ||
      reqSession?.roles?.includes('SUPER_ADMIN') ||
      reqSession?.roles?.includes('COMPANY_ADMIN')
    );
    const effectiveDiscountCalc = isPrivilegedAdminCalc ? (customDiscountPercent || 0) : 0;

    const calculation = subscriptionService.calculateCommercialOrder(
      plan[0],
      durationYears,
      effectiveDiscountCalc,
      isInterstate
    );

    return reply.status(200).send({
      success: true,
      data: calculation
    });
  });

  // POST /api/v1/commercial/create-checkout-order - Generates checkout order & snapshot
  fastify.post(
    '/api/v1/commercial/create-checkout-order',
    {
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const parseResult = CreateCheckoutOrderSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          message: 'Invalid create-checkout-order payload',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      const input = parseResult.data;
      const db = getDatabase();

      // Verify partner
      const partner = await db.select().from(partnerProfiles).where(eq(partnerProfiles.id, input.partnerId)).limit(1);
      if (!partner[0]) {
        throw AppError.notFound(`Partner ${input.partnerId} not found`);
      }

      // Verify plan
      const plan = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
      if (!plan[0]) {
        throw AppError.notFound(`Plan ${input.planId} not found`);
      }

      // Multi-tenant isolation & authorization: Untrusted partner clients cannot act for other organizations
      const session = (request as any).session;
      const isPrivilegedAdmin = Boolean(
        session?.isSuperAdmin ||
        session?.roles?.includes('SUPER_ADMIN') ||
        session?.roles?.includes('COMPANY_ADMIN')
      );

      if (!isPrivilegedAdmin && session?.tenantId && partner[0].tenantId !== session.tenantId) {
        throw new AppError({
          message: 'Access denied: Cannot initiate commercial checkout for another organization',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }

      const effectiveCustomDiscount = isPrivilegedAdmin ? (input.customDiscountPercent || 0) : 0;

      const calculation = subscriptionService.calculateCommercialOrder(
        plan[0],
        input.durationYears,
        effectiveCustomDiscount,
        input.isInterstate
      );

      // Check active price version
      const activePv = await db
        .select()
        .from(priceVersions)
        .where(eq(priceVersions.planId, input.planId))
        .orderBy(desc(priceVersions.createdAt))
        .limit(1);

      const snapshotId = crypto.randomUUID();
      const rzpOrderId = `order_docsearch_b2b_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const newSnapshot = {
        id: snapshotId,
        partnerId: input.partnerId,
        planId: input.planId,
        priceVersionId: activePv[0]?.id || null,
        billingDurationYears: calculation.durationYears,
        annualBasePriceInr: calculation.annualBasePrice,
        grossAmountInr: calculation.grossAmount,
        discountRatePercent: calculation.discountRate,
        discountAmountInr: calculation.discountAmount,
        taxableAmountInr: calculation.taxableAmount,
        taxRatePercent: calculation.gstRatePercent,
        cgstAmountInr: calculation.cgst,
        sgstAmountInr: calculation.sgst,
        igstAmountInr: calculation.igst,
        finalAmountInr: calculation.finalAmount,
        currency: 'INR',
        isInterstate: Boolean(input.isInterstate),
        customerGstin: input.customerGstin || null,
        customerBillingAddress: input.customerBillingAddress,
        status: 'PENDING',
        metadata: {
          razorpayOrderId: rzpOrderId,
          requestedBy: (request as any).session?.actorEmail || 'partner',
          createdAt: new Date().toISOString()
        }
      };

      await db.insert(commercialOrderSnapshots).values(newSnapshot as any);

      return reply.status(201).send({
        success: true,
        data: {
          snapshotId,
          orderId: rzpOrderId,
          razorpayOrderId: rzpOrderId,
          amountInPaisa: calculation.finalAmount * 100,
          currency: 'INR',
          calculation,
          partnerTradeName: partner[0].tradeName,
          keyId: process.env['RAZORPAY_KEY_ID'] || 'rzp_test_docsearch_mock',
          notes: {
            snapshotId,
            partnerId: input.partnerId
          }
        }
      });
    }
  );

  const requireHqAdmin = async (request: any) => {
    const session = request.session;
    const isAdmin = Boolean(
      session?.isSuperAdmin ||
      session?.roles?.includes('SUPER_ADMIN') ||
      session?.roles?.includes('COMPANY_ADMIN') ||
      session?.roles?.includes('HQ_ADMIN')
    );
    if (!isAdmin) {
      throw new AppError({
        message: 'Access denied: HQ Company Admin privileges required for commercial administration',
        code: ErrorCode.FORBIDDEN,
        statusCode: 403
      });
    }
  };

  // GET /api/v1/commercial/hq/pipeline - HQ Enterprise Commercial Lifecycle & Payment Pipeline
  fastify.get(
    '/api/v1/commercial/hq/pipeline',
    {
      preHandler: [authenticate, requireHqAdmin]
    },
    async (request, reply) => {
      const query = request.query as {
        compoundFilter?: string;
        paymentStatus?: string;
        licenseStatus?: string;
        partnerType?: string;
        stage?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
      };

      const db = getDatabase();
      const allPartners = await db.select().from(partnerProfiles);
      const allSubs = await db.select().from(subscriptions);
      const allLicenses = await db.select().from(licenses);
      const allSnapshots = await db.select().from(commercialOrderSnapshots);
      const allPlans = await db.select().from(plans);

      let totalRevenueInr = 0;
      let countPaid = 0;
      let countFree = 0;
      let countNeverPaid = 0;
      let countPaymentPending = 0;
      let countRenewalDue = 0;
      let countExpiringSoon = 0;
      let countExpired = 0;
      let countLocked = 0;

      const pipelineItems = allPartners.map((partner) => {
        const partnerSub = allSubs.find((s) => s.partnerId === partner.id);
        const partnerLic = allLicenses.find((l) => l.partnerId === partner.id);
        const partnerSnapshots = allSnapshots.filter((s) => s.partnerId === partner.id);
        const plan = partnerSub ? allPlans.find((p) => p.id === partnerSub.planId) : null;

        const evaluatedLic = partnerLic
          ? licenseService.evaluateLicenseStatus(partnerLic)
          : { status: 'UNKNOWN', daysRemaining: 0, isAccessAllowed: false };

        const hasPaidSnapshot = partnerSnapshots.some((s) => s.status === 'PAID');
        const hasPendingSnapshot = partnerSnapshots.some((s) => s.status === 'PENDING');
        const hasFailedSnapshot = partnerSnapshots.some((s) => s.status === 'FAILED');

        const latestPaidSnapshot = partnerSnapshots
          .filter((s) => s.status === 'PAID')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        const totalPaidAmount = partnerSnapshots
          .filter((s) => s.status === 'PAID')
          .reduce((sum, s) => sum + (s.finalAmountInr || 0), 0);

        totalRevenueInr += totalPaidAmount;

        const isFreePeriod = Boolean((partnerSub?.metadata as any)?.isFirstYearFree);

        // Payment status definition
        let paymentStatus: 'PAID' | 'NOT_PAID' | 'FREE_PERIOD' | 'PENDING' | 'FAILED' | 'NEVER_PAID' = 'NEVER_PAID';
        if (hasPaidSnapshot) {
          paymentStatus = 'PAID';
          countPaid++;
        } else if (hasPendingSnapshot) {
          paymentStatus = 'PENDING';
          countPaymentPending++;
        } else if (hasFailedSnapshot) {
          paymentStatus = 'FAILED';
        } else if (isFreePeriod && evaluatedLic.daysRemaining > 0) {
          paymentStatus = 'FREE_PERIOD';
          countFree++;
        } else {
          paymentStatus = 'NEVER_PAID';
          countNeverPaid++;
        }

        // License status definition
        const licenseStatus = evaluatedLic.status; // ACTIVE, RENEWAL_WINDOW, EXPIRING_SOON, GRACE_PERIOD, LOCKED

        // Pipeline stage definition
        let stage: 'TRIAL_365' | 'RENEWAL_60D' | 'EXPIRING_30D' | 'GRACE_PERIOD' | 'LOCKED' | 'RENEWED' = 'TRIAL_365';
        if (hasPaidSnapshot) {
          stage = 'RENEWED';
        } else if (evaluatedLic.status === 'LOCKED') {
          stage = 'LOCKED';
          countLocked++;
        } else if (evaluatedLic.status === 'GRACE_PERIOD') {
          stage = 'GRACE_PERIOD';
          countExpired++;
        } else if (evaluatedLic.daysRemaining <= 30) {
          stage = 'EXPIRING_30D';
          countExpiringSoon++;
        } else if (evaluatedLic.daysRemaining <= 60) {
          stage = 'RENEWAL_60D';
          countRenewalDue++;
        } else {
          stage = 'TRIAL_365';
        }

        const lastPayment = latestPaidSnapshot ? {
          date: latestPaidSnapshot.createdAt,
          method: (latestPaidSnapshot.metadata as any)?.paymentMethod || 'RAZORPAY',
          transactionReference: (latestPaidSnapshot.metadata as any)?.transactionReference ||
            (latestPaidSnapshot.metadata as any)?.razorpayPaymentId ||
            latestPaidSnapshot.id,
          amountInr: latestPaidSnapshot.finalAmountInr
        } : null;

        return {
          partnerId: partner.id,
          tenantId: partner.tenantId,
          legalName: partner.legalName,
          tradeName: partner.tradeName,
          partnerType: partner.partnerType,
          primaryContactName: partner.primaryContactName,
          primaryContactEmail: partner.primaryContactEmail,
          primaryContactPhone: partner.primaryContactPhone,
          isVerified: partner.verificationStatus === 'VERIFIED',
          registrationDate: partner.createdAt,
          subscription: partnerSub ? {
            id: partnerSub.id,
            planId: partnerSub.planId,
            planName: plan?.name || 'Standard Healthcare Plan',
            planCode: plan?.code || 'PLAN_ANNUAL',
            annualBasePriceInr: plan?.basePrice || 6000,
            billingCycle: partnerSub.billingCycle,
            status: partnerSub.status,
            startDate: partnerSub.startDate,
            endDate: partnerSub.endDate,
            renewalDate: partnerSub.renewalDate,
            isFirstYearFree: isFreePeriod
          } : null,
          license: partnerLic ? {
            id: partnerLic.id,
            licenseKey: partnerLic.licenseKey,
            status: evaluatedLic.status,
            daysRemaining: evaluatedLic.daysRemaining,
            expiryDate: partnerLic.expiryDate,
            gracePeriodEnd: partnerLic.gracePeriodEnd,
            isAccessAllowed: evaluatedLic.isAccessAllowed
          } : null,
          paymentStatus,
          licenseStatus,
          stage,
          totalPaidAmountInr: totalPaidAmount,
          lastPayment,
          nextRenewalDate: partnerLic?.expiryDate || partnerSub?.endDate || null,
          assignedHqOwner: (partner.metadata as any)?.assignedHqOwner || 'HQ Operations',
          lastActivityAt: latestPaidSnapshot?.createdAt || partner.updatedAt || partner.createdAt,
          latestSnapshotId: latestPaidSnapshot?.id || partnerSnapshots[0]?.id || null,
          createdAt: partner.createdAt
        };
      });

      // ── Server-Side Filter Execution ──────────────────────────────
      let filtered = pipelineItems;

      // 1. Compound Preset Filters ("Who Paid / Who Did Not Pay")
      if (query.compoundFilter && query.compoundFilter !== 'ALL') {
        switch (query.compoundFilter) {
          case 'FREE_EXPIRED_UNPAID':
            filtered = filtered.filter(
              (i) => i.subscription?.isFirstYearFree && (i.license?.daysRemaining ?? 0) <= 0 && i.totalPaidAmountInr === 0
            );
            break;
          case 'EXPIRING_60D_NEVER_PAID':
            filtered = filtered.filter(
              (i) => (i.license?.daysRemaining ?? 0) <= 60 && (i.license?.daysRemaining ?? 0) > 0 && i.totalPaidAmountInr === 0
            );
            break;
          case 'PAYMENT_FAILED_ACTIVE':
            filtered = filtered.filter(
              (i) => i.paymentStatus === 'FAILED' && (i.license?.daysRemaining ?? 0) > 0
            );
            break;
          case 'CURRENTLY_PAID':
            filtered = filtered.filter((i) => i.paymentStatus === 'PAID');
            break;
          case 'NEVER_PAID':
            filtered = filtered.filter((i) => i.totalPaidAmountInr === 0 && i.paymentStatus !== 'FREE_PERIOD');
            break;
          case 'LOCKED_UNPAID':
            filtered = filtered.filter((i) => i.stage === 'LOCKED');
            break;
        }
      }

      // 2. Discrete Payment Status Filter
      if (query.paymentStatus && query.paymentStatus !== 'ALL') {
        if (query.paymentStatus === 'NOT_PAID') {
          filtered = filtered.filter((i) => i.paymentStatus === 'NEVER_PAID' || i.paymentStatus === 'FAILED');
        } else {
          filtered = filtered.filter((i) => (i.paymentStatus as string) === query.paymentStatus);
        }
      }

      // 3. License Status Filter
      if (query.licenseStatus && query.licenseStatus !== 'ALL') {
        filtered = filtered.filter((i) => i.licenseStatus === query.licenseStatus);
      }

      // 4. Partner Type Filter
      if (query.partnerType && query.partnerType !== 'ALL') {
        filtered = filtered.filter((i) => i.partnerType === query.partnerType);
      }

      // 5. Stage Filter
      if (query.stage && query.stage !== 'ALL') {
        filtered = filtered.filter((i) => i.stage === query.stage);
      }

      // 6. Search across 8 core dimensions
      if (query.search && query.search.trim()) {
        const q = query.search.toLowerCase().trim();
        filtered = filtered.filter((i) =>
          i.legalName?.toLowerCase().includes(q) ||
          i.tradeName?.toLowerCase().includes(q) ||
          i.partnerId?.toLowerCase().includes(q) ||
          i.tenantId?.toLowerCase().includes(q) ||
          i.primaryContactName?.toLowerCase().includes(q) ||
          i.primaryContactEmail?.toLowerCase().includes(q) ||
          i.primaryContactPhone?.includes(q) ||
          i.license?.licenseKey?.toLowerCase().includes(q)
        );
      }

      // 7. Server-Side Sorting
      if (query.sortBy) {
        const order = query.sortOrder === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
          if (query.sortBy === 'expiryDate') {
            const timeA = a.license?.expiryDate ? new Date(a.license.expiryDate).getTime() : 0;
            const timeB = b.license?.expiryDate ? new Date(b.license.expiryDate).getTime() : 0;
            return (timeA - timeB) * order;
          }
          if (query.sortBy === 'daysRemaining') {
            return ((a.license?.daysRemaining ?? 0) - (b.license?.daysRemaining ?? 0)) * order;
          }
          if (query.sortBy === 'amount') {
            return (a.totalPaidAmountInr - b.totalPaidAmountInr) * order;
          }
          if (query.sortBy === 'createdAt' || query.sortBy === 'registrationDate') {
            return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
          }
          return (a.tradeName.localeCompare(b.tradeName)) * order;
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          items: filtered,
          metrics: {
            totalPartners: pipelineItems.length,
            filteredCount: filtered.length,
            totalFree: countFree,
            totalPaid: countPaid,
            totalPaymentPending: countPaymentPending,
            totalRenewalDue: countRenewalDue,
            totalExpiringSoon: countExpiringSoon,
            totalExpired: countExpired,
            totalLocked: countLocked,
            totalNeverPaid: countNeverPaid,
            totalRevenueInr
          }
        }
      });
    }
  );

  // GET /api/v1/commercial/hq/partner/:id - 360° Commercial Detail Dossier (7 Sections)
  fastify.get(
    '/api/v1/commercial/hq/partner/:id',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDatabase();

      const [partner] = await db.select().from(partnerProfiles).where(eq(partnerProfiles.id, id)).limit(1);
      if (!partner) throw AppError.notFound(`Partner ${id} not found`);

      // Tenant isolation: Only super admin, company admin, or the partner's own tenant can view this dossier
      const session = (request as any).session;
      const isPrivilegedAdmin = Boolean(
        session?.isSuperAdmin ||
        session?.roles?.includes('SUPER_ADMIN') ||
        session?.roles?.includes('COMPANY_ADMIN')
      );
      if (!isPrivilegedAdmin && (!session?.tenantId || session.tenantId !== partner.tenantId)) {
        throw new AppError({
          message: 'Access denied: Cannot view commercial dossier of another organization',
          code: ErrorCode.FORBIDDEN,
          statusCode: 403
        });
      }

      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, partner.tenantId)).limit(1);
      const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.partnerId, id)).limit(1);
      const [lic] = await db.select().from(licenses).where(eq(licenses.partnerId, id)).limit(1);
      const plan = sub ? (await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1))[0] : null;

      const activePv = plan
        ? (await db.select().from(priceVersions).where(eq(priceVersions.planId, plan.id)).orderBy(desc(priceVersions.createdAt)).limit(1))[0]
        : null;

      const snapshots = await db
        .select()
        .from(commercialOrderSnapshots)
        .where(eq(commercialOrderSnapshots.partnerId, id))
        .orderBy(desc(commercialOrderSnapshots.createdAt));

      const partnerInvoices = sub
        ? await db
            .select()
            .from(invoices)
            .where(eq(invoices.subscriptionId, sub.id))
            .orderBy(desc(invoices.issueDate))
        : [];

      const overrides = await db
        .select()
        .from(commercialOverrides)
        .where(eq(commercialOverrides.partnerId, id))
        .orderBy(desc(commercialOverrides.createdAt));

      const auditLogs = await db
        .select()
        .from(companyAuditTraces)
        .where(eq(companyAuditTraces.entityReference, id))
        .orderBy(desc(companyAuditTraces.occurredAt));

      // Entitlements
      const planEnts = plan
        ? await db.select().from(planEntitlements).where(eq(planEntitlements.planId, plan.id))
        : [];
      const allFeats = await db.select().from(features);

      const featureList = planEnts.map((pe) => {
        const feat = allFeats.find((f) => f.id === pe.featureId);
        return {
          code: feat?.code || pe.featureId,
          name: feat?.name || 'Feature',
          category: feat?.category || 'MODULE_ACCESS',
          entitlementType: pe.entitlementType,
          value: pe.value
        };
      });

      const evaluatedLic = lic
        ? licenseService.evaluateLicenseStatus(lic)
        : { status: 'UNKNOWN', daysRemaining: 0, isAccessAllowed: false };

      return reply.status(200).send({
        success: true,
        data: {
          partner: {
            id: partner.id,
            tenantId: partner.tenantId,
            tenantName: tenant?.name || partner.tradeName,
            legalName: partner.legalName,
            tradeName: partner.tradeName,
            partnerType: partner.partnerType,
            verificationStatus: partner.verificationStatus,
            primaryContactName: partner.primaryContactName,
            primaryContactEmail: partner.primaryContactEmail,
            primaryContactPhone: partner.primaryContactPhone,
            gstin: (partner.metadata as any)?.gstin || null,
            assignedHqOwner: (partner.metadata as any)?.assignedHqOwner || 'HQ Operations',
            registrationDate: partner.createdAt
          },
          commercial: {
            plan: plan ? {
              id: plan.id,
              code: plan.code,
              name: plan.name,
              description: plan.description,
              annualBasePriceInr: plan.basePrice,
              billingInterval: plan.billingInterval
            } : null,
            priceVersion: activePv ? {
              id: activePv.id,
              versionNumber: activePv.versionNumber,
              annualBasePriceInr: activePv.annualBasePriceInr,
              gstRatePercent: activePv.gstRatePercent,
              sacCode: activePv.sacCode
            } : null,
            subscription: sub ? {
              id: sub.id,
              status: sub.status,
              billingCycle: sub.billingCycle,
              startDate: sub.startDate,
              endDate: sub.endDate,
              renewalDate: sub.renewalDate,
              isFirstYearFree: Boolean((sub.metadata as any)?.isFirstYearFree)
            } : null,
            activeOverride: overrides.find((o) => o.status === 'ACTIVE') || null
          },
          license: lic ? {
            id: lic.id,
            licenseKey: lic.licenseKey,
            status: evaluatedLic.status,
            daysRemaining: evaluatedLic.daysRemaining,
            expiryDate: lic.expiryDate,
            gracePeriodEnd: lic.gracePeriodEnd,
            isAccessAllowed: evaluatedLic.isAccessAllowed
          } : null,
          payments: snapshots,
          invoices: partnerInvoices,
          entitlements: featureList,
          auditLogs
        }
      });
    }
  );

  // POST /api/v1/commercial/hq/plans - HQ Plan Creation
  fastify.post(
    '/api/v1/commercial/hq/plans',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const PlanCreateSchema = z.object({
        code: z.string().min(3),
        name: z.string().min(3),
        description: z.string().min(5),
        annualBasePriceInr: z.number().int().min(1),
        maxDoctors: z.number().int().default(5),
        maxBranches: z.number().int().default(1),
        storageQuotaGb: z.number().int().default(10),
        monthlyWhatsAppCredits: z.number().int().default(500),
        sacCode: z.string().default('998313'),
        metadata: z.record(z.any()).optional().default({})
      });

      const body = PlanCreateSchema.parse(request.body);
      const db = getDatabase();

      const [prod] = await db.select().from(products).where(eq(products.code, 'DOCSEARCH_HEALTHCARE_OS')).limit(1);
      const productId = prod?.id || '77777777-7777-4777-8777-777777777777';

      const planId = crypto.randomUUID();
      await db.insert(plans).values({
        id: planId,
        productId,
        code: body.code,
        name: body.name,
        description: body.description,
        status: 'ACTIVE',
        version: '1.0.0',
        basePrice: body.annualBasePriceInr,
        currency: 'INR',
        billingInterval: 'ANNUAL',
        maxDoctors: body.maxDoctors,
        maxBranches: body.maxBranches,
        storageQuotaGb: body.storageQuotaGb,
        monthlyWhatsAppCredits: body.monthlyWhatsAppCredits,
        metadata: body.metadata
      });

      const priceVerId = crypto.randomUUID();
      await db.insert(priceVersions).values({
        id: priceVerId,
        planId,
        versionNumber: 'v1.0',
        annualBasePriceInr: body.annualBasePriceInr,
        sacCode: body.sacCode,
        isActive: true,
        metadata: { createdBy: (request as any).session?.actorEmail || 'hq_admin' }
      });

      const actorEmail = (request as any).session?.actorEmail || 'hq_admin@docsearch.internal';
      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'PLAN_CREATED',
        entityReference: planId,
        reason: `Created commercial plan ${body.code} with ₹${body.annualBasePriceInr}/yr base price`,
        metadata: { planCode: body.code, annualBasePriceInr: body.annualBasePriceInr }
      });

      return reply.status(201).send({
        success: true,
        data: { planId, code: body.code, name: body.name, annualBasePriceInr: body.annualBasePriceInr }
      });
    }
  );

  // PUT /api/v1/commercial/hq/plans/:id - HQ Plan Update
  fastify.put(
    '/api/v1/commercial/hq/plans/:id',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const PlanUpdateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        annualBasePriceInr: z.number().int().optional(),
        maxDoctors: z.number().int().optional(),
        maxBranches: z.number().int().optional(),
        status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
        metadata: z.record(z.any()).optional()
      });

      const body = PlanUpdateSchema.parse(request.body);
      const db = getDatabase();

      const [existingPlan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
      if (!existingPlan) throw AppError.notFound(`Plan ${id} not found`);

      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.description) updateData.description = body.description;
      if (body.status) updateData.status = body.status;
      if (body.maxDoctors !== undefined) updateData.maxDoctors = body.maxDoctors;
      if (body.maxBranches !== undefined) updateData.maxBranches = body.maxBranches;
      if (body.metadata) updateData.metadata = { ...(existingPlan.metadata as any), ...body.metadata };
      if (body.annualBasePriceInr !== undefined) updateData.basePrice = body.annualBasePriceInr;
      updateData.updatedAt = new Date();

      await db.update(plans).set(updateData).where(eq(plans.id, id));

      const actorEmail = (request as any).session?.actorEmail || 'hq_admin@docsearch.internal';

      // Price version bump for immutability
      if (body.annualBasePriceInr !== undefined && body.annualBasePriceInr !== existingPlan.basePrice) {
        await db.update(priceVersions).set({ isActive: false }).where(eq(priceVersions.planId, id));

        const newPvId = crypto.randomUUID();
        const newVersionNumber = `v1.${Date.now().toString().slice(-3)}`;
        await db.insert(priceVersions).values({
          id: newPvId,
          planId: id,
          versionNumber: newVersionNumber,
          annualBasePriceInr: body.annualBasePriceInr,
          sacCode: '998313',
          isActive: true,
          metadata: { updatedBy: actorEmail }
        });

        await recordCommercialAuditTrace(db, {
          actorEmail,
          action: 'PRICE_VERSION_CREATED',
          entityReference: id,
          reason: `Bumped price version to ${newVersionNumber} at ₹${body.annualBasePriceInr}/yr`,
          metadata: { oldPrice: existingPlan.basePrice, newPrice: body.annualBasePriceInr }
        });
      }

      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'PLAN_UPDATED',
        entityReference: id,
        reason: `Updated plan ${existingPlan.code}`,
        metadata: body
      });

      return reply.status(200).send({
        success: true,
        message: 'Plan and price version updated successfully'
      });
    }
  );

  // DELETE /api/v1/commercial/hq/plans/:id - HQ Plan Archival / Soft Delete
  fastify.delete(
    '/api/v1/commercial/hq/plans/:id',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDatabase();

      const [existingPlan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
      if (!existingPlan) throw AppError.notFound(`Plan ${id} not found`);

      await db.update(plans).set({ status: 'ARCHIVED', updatedAt: new Date() }).where(eq(plans.id, id));
      await db.update(priceVersions).set({ isActive: false }).where(eq(priceVersions.planId, id));

      const actorEmail = (request as any).session?.actorEmail || 'hq_admin@docsearch.internal';
      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'PLAN_ARCHIVED',
        entityReference: id,
        reason: `Soft-archived plan ${existingPlan.code} to preserve historical orders and subscriptions`,
        metadata: { code: existingPlan.code }
      });

      return reply.status(200).send({
        success: true,
        message: `Plan ${existingPlan.code} archived successfully`
      });
    }
  );

  // POST /api/v1/commercial/hq/extend-grace - Discretionary Grace Period Extension
  fastify.post(
    '/api/v1/commercial/hq/extend-grace',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const Schema = z.object({
        partnerId: z.string().uuid(),
        additionalDays: z.number().int().min(1).max(60).default(7),
        reason: z.string().min(5)
      });
      const body = Schema.parse(request.body);
      const db = getDatabase();

      const [license] = await db.select().from(licenses).where(eq(licenses.partnerId, body.partnerId)).limit(1);
      if (!license) throw AppError.notFound(`License for partner ${body.partnerId} not found`);

      const baseTime = license.gracePeriodEnd ? new Date(license.gracePeriodEnd).getTime() : Date.now();
      const newGraceEnd = new Date(baseTime + body.additionalDays * 24 * 60 * 60 * 1000);

      const actorEmail = (request as any).session?.actorEmail || 'hq_admin@docsearch.internal';

      await db.update(licenses).set({
        gracePeriodEnd: newGraceEnd,
        metadata: {
          ...((license.metadata as any) || {}),
          lastGraceExtension: {
            extendedBy: actorEmail,
            additionalDays: body.additionalDays,
            reason: body.reason,
            timestamp: new Date().toISOString()
          }
        },
        updatedAt: new Date()
      }).where(eq(licenses.id, license.id));

      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'GRACE_GRANTED',
        entityReference: body.partnerId,
        reason: `Discretionary grace extended +${body.additionalDays} days: ${body.reason}`,
        metadata: { additionalDays: body.additionalDays, newGraceEnd }
      });

      return reply.status(200).send({
        success: true,
        data: {
          partnerId: body.partnerId,
          gracePeriodEnd: newGraceEnd,
          message: `Grace period extended by ${body.additionalDays} days`
        }
      });
    }
  );

  // POST /api/v1/commercial/hq/record-offline-payment - HQ Manual Offline Payment Recording
  fastify.post(
    '/api/v1/commercial/hq/record-offline-payment',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const Schema = z.object({
        partnerId: z.string().uuid(),
        planId: z.string().uuid(),
        durationYears: z.number().int().min(1).max(5).default(1),
        paymentMethod: z.enum(['NEFT', 'RTGS', 'CHEQUE', 'DIRECT_BANK_TRANSFER', 'CASH', 'UPI_OFFLINE']),
        transactionReference: z.string().min(3),
        customerBillingAddress: z.string().optional().default('India'),
        isInterstate: z.boolean().optional().default(false),
        notes: z.string().optional().default('Offline B2B settlement recorded by HQ')
      });
      const body = Schema.parse(request.body);
      const db = getDatabase();

      const [plan] = await db.select().from(plans).where(eq(plans.id, body.planId)).limit(1);
      if (!plan) throw AppError.notFound(`Plan ${body.planId} not found`);

      const calculation = subscriptionService.calculateCommercialOrder(
        plan,
        body.durationYears,
        0,
        body.isInterstate
      );

      const snapshotId = crypto.randomUUID();
      const offlineOrderId = `order_offline_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const paymentTransactionId = `pay_offline_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const actorEmail = (request as any).session?.actorEmail || 'hq_finance@docsearch.internal';

      await db.insert(commercialOrderSnapshots).values({
        id: snapshotId,
        partnerId: body.partnerId,
        planId: body.planId,
        billingDurationYears: calculation.durationYears,
        annualBasePriceInr: calculation.annualBasePrice,
        grossAmountInr: calculation.grossAmount,
        discountRatePercent: calculation.discountRate,
        discountAmountInr: calculation.discountAmount,
        taxableAmountInr: calculation.taxableAmount,
        taxRatePercent: calculation.gstRatePercent,
        cgstAmountInr: calculation.cgst,
        sgstAmountInr: calculation.sgst,
        igstAmountInr: calculation.igst,
        finalAmountInr: calculation.finalAmount,
        currency: 'INR',
        isInterstate: Boolean(body.isInterstate),
        customerBillingAddress: body.customerBillingAddress,
        status: 'PENDING',
        metadata: {
          razorpayOrderId: offlineOrderId,
          paymentMethod: body.paymentMethod,
          transactionReference: body.transactionReference,
          notes: body.notes,
          recordedBy: actorEmail
        }
      } as any);

      // Settle atomically via billingManagementService
      const paymentEntity = {
        id: paymentTransactionId,
        order_id: offlineOrderId,
        amount: calculation.finalAmount * 100,
        currency: 'INR',
        method: body.paymentMethod,
        email: actorEmail,
        notes: {
          snapshotId
        }
      };

      const settlementResult = await billingManagementService.processB2BCommercialWebhookPayment(paymentEntity, snapshotId);

      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'OFFLINE_PAYMENT_SETTLED',
        entityReference: body.partnerId,
        reason: `Settled offline ${body.paymentMethod} payment (₹${calculation.finalAmount}): ${body.transactionReference}`,
        metadata: {
          snapshotId,
          paymentTransactionId,
          amountPaid: calculation.finalAmount,
          transactionReference: body.transactionReference
        }
      });

      return reply.status(200).send({
        success: true,
        data: {
          snapshotId,
          paymentTransactionId,
          amountPaid: calculation.finalAmount,
          settlementResult,
          message: 'Offline payment successfully recorded; license extended and B2B invoice issued.'
        }
      });
    }
  );

  // ── Partner Classifications Catalog Endpoints (HQ Controllable) ──
  // GET /api/v1/commercial/hq/partner-types
  fastify.get(
    '/api/v1/commercial/hq/partner-types',
    { preHandler: [authenticate, requireHqAdmin] },
    async (_request, reply) => {
      const db = getDatabase();
      const list = await db
        .select()
        .from(partnerClassifications)
        .orderBy(asc(partnerClassifications.sortOrder));

      return reply.status(200).send({
        success: true,
        data: list
      });
    }
  );

  // POST /api/v1/commercial/hq/partner-types
  fastify.post(
    '/api/v1/commercial/hq/partner-types',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const Schema = z.object({
        code: z.string().min(2),
        label: z.string().min(2),
        description: z.string().optional().default(''),
        category: z.string().default('HEALTHCARE_PROVIDER'),
        icon: z.string().optional().default('🏥'),
        defaultPlanCode: z.string().optional(),
        sortOrder: z.number().int().default(0),
        metadata: z.record(z.any()).optional().default({})
      });

      const body = Schema.parse(request.body);
      const db = getDatabase();

      const newId = crypto.randomUUID();
      await db.insert(partnerClassifications).values({
        id: newId,
        code: body.code.toUpperCase(),
        label: body.label,
        description: body.description,
        category: body.category,
        icon: body.icon,
        defaultPlanCode: body.defaultPlanCode,
        sortOrder: body.sortOrder,
        status: 'ACTIVE',
        metadata: body.metadata
      });

      const actorEmail = (request as any).session?.actorEmail || 'hq_admin@docsearch.internal';
      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'PARTNER_TYPE_CREATED',
        entityReference: newId,
        reason: `Created partner classification ${body.code}`,
        metadata: body
      });

      return reply.status(201).send({
        success: true,
        data: { id: newId, ...body }
      });
    }
  );

  // PUT /api/v1/commercial/hq/partner-types/:id
  fastify.put(
    '/api/v1/commercial/hq/partner-types/:id',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const Schema = z.object({
        label: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        defaultPlanCode: z.string().optional(),
        sortOrder: z.number().int().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
        metadata: z.record(z.any()).optional()
      });

      const body = Schema.parse(request.body);
      const db = getDatabase();

      const [existing] = await db.select().from(partnerClassifications).where(eq(partnerClassifications.id, id)).limit(1);
      if (!existing) throw AppError.notFound(`Partner classification ${id} not found`);

      const updateData: any = { ...body, updatedAt: new Date() };
      await db.update(partnerClassifications).set(updateData).where(eq(partnerClassifications.id, id));

      const actorEmail = (request as any).session?.actorEmail || 'hq_admin@docsearch.internal';
      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'PARTNER_TYPE_UPDATED',
        entityReference: id,
        reason: `Updated partner classification ${existing.code}`,
        metadata: body
      });

      return reply.status(200).send({
        success: true,
        message: 'Partner classification updated successfully'
      });
    }
  );

  // DELETE /api/v1/commercial/hq/partner-types/:id (Soft-deactivate)
  fastify.delete(
    '/api/v1/commercial/hq/partner-types/:id',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDatabase();

      const [existing] = await db.select().from(partnerClassifications).where(eq(partnerClassifications.id, id)).limit(1);
      if (!existing) throw AppError.notFound(`Partner classification ${id} not found`);

      await db.update(partnerClassifications).set({ status: 'INACTIVE', updatedAt: new Date() }).where(eq(partnerClassifications.id, id));

      const actorEmail = (request as any).session?.actorEmail || 'hq_admin@docsearch.internal';
      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'PARTNER_TYPE_ARCHIVED',
        entityReference: id,
        reason: `Deactivated partner classification ${existing.code}`,
        metadata: { code: existing.code }
      });

      return reply.status(200).send({
        success: true,
        message: `Partner classification ${existing.code} deactivated successfully`
      });
    }
  );

  // ── Commercial Negotiated Pricing Overrides Endpoints (HQ Controllable) ──
  // GET /api/v1/commercial/hq/overrides
  fastify.get(
    '/api/v1/commercial/hq/overrides',
    { preHandler: [authenticate, requireHqAdmin] },
    async (_request, reply) => {
      const db = getDatabase();
      const list = await db
        .select()
        .from(commercialOverrides)
        .orderBy(desc(commercialOverrides.createdAt));

      return reply.status(200).send({
        success: true,
        data: list
      });
    }
  );

  // POST /api/v1/commercial/hq/overrides
  fastify.post(
    '/api/v1/commercial/hq/overrides',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const Schema = z.object({
        partnerId: z.string().uuid(),
        planId: z.string().uuid(),
        priceVersionId: z.string().uuid().optional(),
        overrideType: z.enum(['FIXED_PRICE', 'PERCENTAGE_DISCOUNT']).default('FIXED_PRICE'),
        overrideValue: z.number().int().min(1),
        validUntil: z.string().optional(),
        reason: z.string().min(5),
        approvedBy: z.string().min(3)
      });

      const body = Schema.parse(request.body);
      const db = getDatabase();

      const newId = crypto.randomUUID();
      await db.insert(commercialOverrides).values({
        id: newId,
        partnerId: body.partnerId,
        planId: body.planId,
        priceVersionId: body.priceVersionId || null,
        overrideType: body.overrideType,
        overrideValue: body.overrideValue,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        reason: body.reason,
        approvedBy: body.approvedBy,
        approvalTimestamp: new Date(),
        status: 'ACTIVE'
      });

      const actorEmail = (request as any).session?.actorEmail || 'hq_sales@docsearch.internal';
      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'COMMERCIAL_OVERRIDE_CREATED',
        entityReference: body.partnerId,
        reason: `Granted negotiated commercial override (${body.overrideType} ${body.overrideValue}): ${body.reason}`,
        metadata: body
      });

      return reply.status(201).send({
        success: true,
        data: { id: newId, ...body }
      });
    }
  );

  // DELETE /api/v1/commercial/hq/overrides/:id (Revoke override)
  fastify.delete(
    '/api/v1/commercial/hq/overrides/:id',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDatabase();

      const [existing] = await db.select().from(commercialOverrides).where(eq(commercialOverrides.id, id)).limit(1);
      if (!existing) throw AppError.notFound(`Commercial override ${id} not found`);

      await db.update(commercialOverrides).set({ status: 'REVOKED', updatedAt: new Date() }).where(eq(commercialOverrides.id, id));

      const actorEmail = (request as any).session?.actorEmail || 'hq_admin@docsearch.internal';
      await recordCommercialAuditTrace(db, {
        actorEmail,
        action: 'COMMERCIAL_OVERRIDE_REVOKED',
        entityReference: existing.partnerId,
        reason: `Revoked commercial override ${id}`,
        metadata: { overrideId: id }
      });

      return reply.status(200).send({
        success: true,
        message: 'Commercial override revoked successfully'
      });
    }
  );

  // ==========================================
  // PHASE 11: HQ COMMERCIAL FINANCE & LICENSING
  // ==========================================

  // GET /api/v1/commercial/hq/pricing (List versioned pricing for all plans)
  fastify.get(
    '/api/v1/commercial/hq/pricing',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const data = await commercialFinanceService.getPlanPricing((request as any).session);
      return reply.status(200).send({ success: true, data });
    }
  );

  // POST /api/v1/commercial/hq/pricing (Create new authoritative plan price version)
  fastify.post(
    '/api/v1/commercial/hq/pricing',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const Schema = z.object({
        planId: z.string().uuid(),
        versionNumber: z.string().min(1),
        annualBasePriceInr: z.number().positive(),
        gstRatePercent: z.number().nonnegative().optional(),
        sacCode: z.string().optional(),
        taxInclusive: z.boolean().optional()
      });

      const body = Schema.parse(request.body);
      const data = await commercialFinanceService.createPriceVersion(body, (request as any).session);
      return reply.status(201).send({ success: true, data });
    }
  );

  // POST /api/v1/commercial/hq/invoices/generate (B2B Partner Subscription Invoice)
  fastify.post(
    '/api/v1/commercial/hq/invoices/generate',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const Schema = z.object({
        partnerId: z.string().uuid(),
        planId: z.string().uuid(),
        durationYears: z.number().int().positive().optional().default(1)
      });

      const body = Schema.parse(request.body);
      const data = await commercialFinanceService.generatePartnerInvoice(
        body.partnerId,
        body.planId,
        body.durationYears,
        (request as any).session
      );
      return reply.status(201).send({ success: true, data });
    }
  );

  // POST /api/v1/commercial/hq/invoices/:id/payments (Authoritative B2B Payment & Atomic License Extension)
  fastify.post(
    '/api/v1/commercial/hq/invoices/:id/payments',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const Schema = z.object({
        amount: z.number().positive(),
        provider: z.string().optional(),
        providerReference: z.string().optional(),
        paymentMethod: z.string().optional(),
        notes: z.string().optional()
      });

      const body = Schema.parse(request.body);
      const data = await commercialFinanceService.recordCommercialPayment(
        id,
        body,
        (request as any).session
      );
      return reply.status(201).send({ success: true, data });
    }
  );

  // GET /api/v1/commercial/hq/dashboard/revenue (Real PostgreSQL commercial revenue metrics)
  fastify.get(
    '/api/v1/commercial/hq/dashboard/revenue',
    { preHandler: [authenticate, requireHqAdmin] },
    async (request, reply) => {
      const data = await commercialFinanceService.getCommercialRevenueDashboard((request as any).session);
      return reply.status(200).send({ success: true, data });
    }
  );
};
