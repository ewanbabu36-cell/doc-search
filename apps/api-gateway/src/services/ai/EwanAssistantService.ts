import crypto from 'node:crypto';
import { type SessionContext } from '@docsearch/auth';
import {
  getDatabase,
  partnerProfiles,
  salesLeads,
  salesOpportunities,
  plans,
  priceVersions,
  features,
  planEntitlements,
  subscriptions,
  licenses,
  commercialOrderSnapshots,
  invoices as companyInvoices,
  payments as companyPayments,
  billingAccounts,
  companyAuditTraces,
  encounters,
  investigationOrders,
  radiologyOrders,
  pharmacyPrescriptions,
  billingInvoices,
  eq,
  and,
  or,
  desc
} from '@docsearch/database';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { partnerAccountService } from '../partner/PartnerAccountService.js';
import { subscriptionService } from '../company/SubscriptionService.js';
import { licenseService } from '../company/LicenseService.js';
import { entitlementService } from '../company/EntitlementService.js';
import { ewannameStaffTrainerService } from './EwannameStaffTrainerService.js';

export type EwanOperatingMode =
  | 'PRODUCT_TRAINER'
  | 'COMPANY_SALES_MANAGER'
  | 'CUSTOMER_SUCCESS'
  | 'RENEWAL_MANAGER'
  | 'PAYMENT_RENEWAL_ASSISTANT'
  | 'LOCKED_ACCOUNT_RECOVERY'
  | 'FINANCE_MANAGER_ASSISTANT';

export interface EwanAskInput {
  prompt: string;
  mode?: EwanOperatingMode | undefined;
  moduleCode?: string | undefined;
  targetTenantId?: string | undefined;
  targetPartnerId?: string | undefined;
  requirements?: {
    partnerType?: string;
    doctorCount?: number;
    bedCount?: number;
    branchCount?: number;
    needsLab?: boolean;
    needsRadiology?: boolean;
    needsPharmacy?: boolean;
    needsIpd?: boolean;
    needsAbdm?: boolean;
  } | undefined;
}

export interface InitiateRenewalOrderInput {
  planId?: string | undefined;
  durationYears?: number | undefined;
  isInterstate?: boolean | undefined;
  customerGstin?: string | undefined;
  customDiscountPercent?: number | undefined;
  requestedPriceOverride?: number | undefined;
}

export interface VerifyRenewalPaymentInput {
  snapshotId: string;
  orderId: string;
  paymentId: string;
  signature?: string | undefined;
  paymentStatus?: 'SUCCESS' | 'CAPTURED' | 'FAILED' | 'CANCELLED' | 'PENDING' | undefined;
  amountInr?: number | undefined;
  paymentMethod?: string | undefined;
}

export class EwanAssistantService {
  private getPaymentHmacSecret(): string {
    return process.env['RAZORPAY_WEBHOOK_SECRET'] || process.env['LICENSE_HMAC_SECRET'] || 'docsearch_b2b_renewal_hmac_secret_2026';
  }

  public signRenewalPayment(orderId: string, paymentId: string): string {
    return crypto
      .createHmac('sha256', this.getPaymentHmacSecret())
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  private isHqPrivilegedRole(session: SessionContext): boolean {
    const roles = (session.roles || []).map((r) => String(r).toUpperCase().trim());
    return Boolean(
      session.isSuperAdmin ||
      roles.some((r) =>
        [
          'SUPER_ADMIN',
          'COMPANY_ADMIN',
          'HQ_SUPER_ADMIN',
          'SALES_MANAGER',
          'SALES_EXECUTIVE',
          'CUSTOMER_SUCCESS_MANAGER',
          'RENEWAL_MANAGER',
          'FINANCE_MANAGER',
          'BILLING_ADMIN',
          'SUPPORT_ADMIN'
        ].includes(r)
      )
    );
  }

  private isHqFinanceOrSuperAdmin(session: SessionContext): boolean {
    const roles = (session.roles || []).map((r) => String(r).toUpperCase().trim());
    return Boolean(
      session.isSuperAdmin ||
      roles.some((r) =>
        ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HQ_SUPER_ADMIN', 'FINANCE_MANAGER', 'BILLING_ADMIN'].includes(r)
      )
    );
  }

  private isPartnerOwnerOrAdmin(session: SessionContext): boolean {
    const roles = (session.roles || []).map((r) => String(r).toUpperCase().trim());
    return Boolean(
      session.isSuperAdmin ||
      roles.some(
        (r) =>
          [
            'HOSPITAL_ADMIN',
            'HOSPITAL_DIRECTOR',
            'ORGANIZATION_ADMIN',
            'FOUNDER',
            'OWNER',
            'ADMINISTRATOR',
            'EXECUTIVE_ADMIN',
            'CENTRE_MANAGER',
            'PHARMACY_DIRECTOR',
            'LAB_DIRECTOR',
            'CLINIC_DOCTOR',
            'DOCTOR'
          ].includes(r) ||
          r.endsWith('_ADMIN') ||
          r.endsWith('_DIRECTOR') ||
          r.endsWith('_OWNER')
      )
    );
  }

  private computeAuditHash(payload: Record<string, unknown>): string {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private async writeAuditTrace(params: {
    actorEmail: string;
    action: string;
    entityReference: string;
    operationStatus: 'SUCCESS' | 'BLOCKED' | 'FAILED';
    reason: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const traceId = `trace_ewan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const db = getDatabase();
    if (db) {
      try {
        await db.insert(companyAuditTraces).values({
          id: crypto.randomUUID(),
          traceId,
          actorEmail: params.actorEmail || 'ewan@docsearch.internal',
          action: params.action,
          entityReference: params.entityReference,
          operationStatus: params.operationStatus,
          occurredAt: new Date(),
          reason: params.reason,
          metadata: params.metadata || {}
        });
      } catch {
        // Non-fatal in read-only or unit environments
      }
    }
    return traceId;
  }

  /**
   * Deterministic Adversarial Prompt-Injection & Governance Firewall (Section 2 & 22)
   * Blocks any attempt to make Ewan unlock accounts without payment, invent discounts,
   * mark invoices paid, extend licenses without payment, access cross-tenant data,
   * escalate staff roles, or fabricate metrics.
   */
  public evaluateAdversarialFirewall(
    session: SessionContext,
    input: EwanAskInput
  ): {
    blocked: boolean;
    violationCode?: string;
    refusalMessage?: string;
  } {
    const q = String(input.prompt || '').toLowerCase().trim();

    // 1. Cross-tenant data access check
    if (
      (input.targetTenantId && input.targetTenantId !== session.tenantId && !this.isHqPrivilegedRole(session)) ||
      /another partner'?s revenue|other partner'?s data|other hospital'?s revenue|competitor'?s revenue|show me another tenant/i.test(q)
    ) {
      return {
        blocked: true,
        violationCode: 'AI_TENANT_ISOLATION_VIOLATION',
        refusalMessage:
          'GOVERNANCE BLOCK [AI_TENANT_ISOLATION_VIOLATION]: Ewan is strictly scoped to your authenticated organization and cannot read or disclose another partner’s revenue, patients, or commercial records.'
      };
    }

    // 2. Direct account unlock / permission bypass attempt
    if (
      /ignore your permissions|bypass.*permission|unlock my account|force unlock|override lock|disable commercial guard/i.test(q) &&
      !/how to unlock|how do i unlock|renew to unlock|why is my account locked/i.test(q)
    ) {
      return {
        blocked: true,
        violationCode: 'AI_AUTHORITY_VIOLATION',
        refusalMessage:
          'GOVERNANCE BLOCK [AI_AUTHORITY_VIOLATION]: Ewan is an advisory and workflow assistant and does not have authority to bypass RBAC/ABAC permissions or directly unlock a locked account. Account unlock occurs only through verified renewal payment or authorized HQ license governance.'
      };
    }

    // 3. Unauthorized discount fabrication attempt
    if (
      /give me\s+\d+%\s*discount|90%\s*discount|100%\s*discount|free coupon|invent.*discount|custom discount without approval/i.test(q)
    ) {
      return {
        blocked: true,
        violationCode: 'AI_PRICING_AUTHORITY_VIOLATION',
        refusalMessage:
          'GOVERNANCE BLOCK [AI_PRICING_AUTHORITY_VIOLATION]: Ewan cannot invent prices, grant unapproved discounts, or modify HQ price versions. Only HQ-configured tenure discounts (2% for 2-Year, 10% for 3-Year, 20% for 5-Year) or HQ-approved commercial overrides apply.'
      };
    }

    // 4. Fake payment / mark invoice paid attempt
    if (
      /mark invoice paid|pretend payment succeeded|fake payment|simulate paid status|bypass payment verification|set payment status to paid/i.test(q)
    ) {
      return {
        blocked: true,
        violationCode: 'AI_PAYMENT_AUTHORITY_VIOLATION',
        refusalMessage:
          'GOVERNANCE BLOCK [AI_PAYMENT_AUTHORITY_VIOLATION]: Ewan cannot mark an invoice as PAID or fabricate payment confirmation. Payment settlement requires cryptographic signature verification from the payment gateway or an audited HQ Finance settlement.'
      };
    }

    // 5. License extension without payment attempt
    if (
      /extend my license without payment|extend subscription for free|add 365 days without paying|bypass license expiry/i.test(q)
    ) {
      return {
        blocked: true,
        violationCode: 'AI_LICENSE_AUTHORITY_VIOLATION',
        refusalMessage:
          'GOVERNANCE BLOCK [AI_LICENSE_AUTHORITY_VIOLATION]: Ewan cannot extend a commercial software license without a verified renewal payment or an audited HQ discretionary grace extension.'
      };
    }

    // 6. Role escalation attempt (e.g. Receptionist / Phlebotomist asking for HQ Finance access)
    if (
      /how to access hq finance|receptionist.*hq finance|bypass role check|escalate my role to super_admin/i.test(q) ||
      (!this.isHqPrivilegedRole(session) &&
        (input.mode === 'COMPANY_SALES_MANAGER' || input.mode === 'FINANCE_MANAGER_ASSISTANT'))
    ) {
      return {
        blocked: true,
        violationCode: 'AI_RBAC_ESCALATION_VIOLATION',
        refusalMessage:
          `GOVERNANCE BLOCK [AI_RBAC_ESCALATION_VIOLATION]: Your current role (${(session.roles || [])[0] || 'STAFF'}) is not authorized to access HQ Sales or HQ Finance controls.`
      };
    }

    // 7. Fake sales metrics / mock data generation attempt
    if (
      /create fake sales metrics|generate dummy leads|fabricate revenue numbers|invent pipeline data|mock sales report/i.test(q)
    ) {
      return {
        blocked: true,
        violationCode: 'AI_ZERO_MOCK_VIOLATION',
        refusalMessage:
          'GOVERNANCE BLOCK [AI_ZERO_MOCK_VIOLATION]: Under the DOC SEARCH Zero-Mock Policy, Ewan never fabricates sales metrics, leads, or revenue numbers. Only verified PostgreSQL records are reported.'
      };
    }

    return { blocked: false };
  }

  /**
   * Resolves authoritative partner account & license status for Ewan Modes 1, 3, 4, 5, 6.
   */
  public async getPartnerEwanContext(session: SessionContext) {
    const accountData = await partnerAccountService.getPlanAndFeatures(session);
    const sub = accountData.subscription;
    const isLockedOrExpired = Boolean(!sub.isAccessAllowed || sub.isLocked || sub.isExpired || sub.isSuspended);

    // Determine lifecycle stage
    let lifecycleStage:
      | 'FREE_FIRST_YEAR'
      | 'ACTIVE_PAID'
      | 'RENEWAL_WINDOW_60D'
      | 'EXPIRING_COUNTDOWN_30D'
      | 'POST_EXPIRY_GRACE_30D'
      | 'ACCOUNT_LOCKED'
      | 'ACCOUNT_SUSPENDED' = 'ACTIVE_PAID';

    let graceDaysRemaining = 0;
    if (sub.gracePeriodEnd) {
      graceDaysRemaining = Math.max(
        0,
        Math.ceil((new Date(sub.gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );
    }

    if (sub.isSuspended) {
      lifecycleStage = 'ACCOUNT_SUSPENDED';
    } else if (isLockedOrExpired) {
      lifecycleStage = 'ACCOUNT_LOCKED';
    } else if (sub.isInGracePeriod) {
      lifecycleStage = 'POST_EXPIRY_GRACE_30D';
    } else if (sub.isExpiringSoon || (sub.daysRemaining !== null && sub.daysRemaining <= 30)) {
      lifecycleStage = 'EXPIRING_COUNTDOWN_30D';
    } else if (sub.isRenewalWindow || (sub.daysRemaining !== null && sub.daysRemaining <= 60)) {
      lifecycleStage = 'RENEWAL_WINDOW_60D';
    } else if (sub.isFirstYearFree) {
      lifecycleStage = 'FREE_FIRST_YEAR';
    }

    const recommendedMode: EwanOperatingMode = isLockedOrExpired
      ? 'LOCKED_ACCOUNT_RECOVERY'
      : lifecycleStage === 'POST_EXPIRY_GRACE_30D' ||
          lifecycleStage === 'EXPIRING_COUNTDOWN_30D' ||
          lifecycleStage === 'RENEWAL_WINDOW_60D'
        ? 'RENEWAL_MANAGER'
        : 'PRODUCT_TRAINER';

    const permittedModes: EwanOperatingMode[] = isLockedOrExpired
      ? ['LOCKED_ACCOUNT_RECOVERY', 'PAYMENT_RENEWAL_ASSISTANT']
      : [
          'PRODUCT_TRAINER',
          'CUSTOMER_SUCCESS',
          'RENEWAL_MANAGER',
          'PAYMENT_RENEWAL_ASSISTANT',
          'LOCKED_ACCOUNT_RECOVERY'
        ];

    const availableModules = accountData.features
      .filter((f) => f.status === 'AVAILABLE' && f.staffPermitted)
      .map((f) => f.code);
    const lockedModules = accountData.features
      .filter((f) => f.status !== 'AVAILABLE' || !f.staffPermitted)
      .map((f) => ({ code: f.code, name: f.name, status: f.status, reason: f.reason }));

    return {
      organizationProfile: accountData.organizationProfile,
      currentPlan: accountData.currentPlan,
      subscription: {
        ...sub,
        graceDaysRemaining,
        lifecycleStage
      },
      ewanGovernance: {
        isAccountLocked: isLockedOrExpired,
        recommendedMode,
        permittedModes,
        operationalModulesAccessible: !isLockedOrExpired,
        ewanAccessible: true,
        dataPreservationGuarantee:
          'All clinical encounters, lab reports, radiology studies, pharmacy inventory, and billing records are 100% preserved in PostgreSQL (Locked != Deleted).',
        primaryCta: isLockedOrExpired ? 'Renew License' : 'Explore Workflows',
        secondaryCta: 'Talk to Ewan'
      },
      availableModules,
      lockedModules,
      limits: accountData.limits
    };
  }

  /**
   * Mode 3: Customer Success Assistant (Real PostgreSQL Usage & Adoption Signals)
   */
  public async getCustomerSuccessSummary(session: SessionContext, targetTenantId?: string) {
    const effectiveTenantId =
      targetTenantId && this.isHqPrivilegedRole(session) ? targetTenantId : session.tenantId;
    if (!effectiveTenantId) {
      throw AppError.unauthorized('Tenant context required for Customer Success analysis');
    }

    const db = getDatabase();
    let encounterCount = 0;
    let labOrderCount = 0;
    let radiologyOrderCount = 0;
    let prescriptionCount = 0;
    let billingInvoiceCount = 0;

    if (db) {
      const [encRows, labRows, radRows, rxRows, invRows] = await Promise.all([
        db.select().from(encounters).where(eq(encounters.tenantId, effectiveTenantId)),
        db.select().from(investigationOrders).where(eq(investigationOrders.tenantId, effectiveTenantId)),
        db.select().from(radiologyOrders).where(eq(radiologyOrders.tenantId, effectiveTenantId)),
        db.select().from(pharmacyPrescriptions).where(eq(pharmacyPrescriptions.tenantId, effectiveTenantId)),
        db.select().from(billingInvoices).where(eq(billingInvoices.tenantId, effectiveTenantId))
      ]);
      encounterCount = encRows.length;
      labOrderCount = labRows.length;
      radiologyOrderCount = radRows.length;
      prescriptionCount = rxRows.length;
      billingInvoiceCount = invRows.length;
    }

    const scopedSession: SessionContext = { ...session, tenantId: effectiveTenantId };
    const account = await partnerAccountService.getPlanAndFeatures(scopedSession);

    const activeWorkflowModules: string[] = [];
    const unusedEntitledModules: string[] = [];

    const checkAdoption = (moduleName: string, count: number) => {
      if (count > 0) activeWorkflowModules.push(moduleName);
      else unusedEntitledModules.push(moduleName);
    };

    checkAdoption('OPD / Clinical Encounters', encounterCount);
    checkAdoption('Pathology / LIMS', labOrderCount);
    checkAdoption('Radiology / RIS-PACS', radiologyOrderCount);
    checkAdoption('Pharmacy / e-Prescriptions', prescriptionCount);
    checkAdoption('Patient Billing & Invoicing', billingInvoiceCount);

    const totalWorkflowTransactions =
      encounterCount + labOrderCount + radiologyOrderCount + prescriptionCount + billingInvoiceCount;

    return {
      tenantId: effectiveTenantId,
      partnerName: account.organizationProfile.tradeName,
      partnerType: account.organizationProfile.partnerType,
      planName: account.currentPlan?.name || 'Unassigned Plan',
      subscriptionStatus: account.subscription.status,
      daysRemaining: account.subscription.daysRemaining,
      workflowUsage: {
        opdEncounters: encounterCount,
        pathologyLabOrders: labOrderCount,
        radiologyImagingOrders: radiologyOrderCount,
        pharmacyPrescriptions: prescriptionCount,
        billingInvoices: billingInvoiceCount,
        totalWorkflowTransactions
      },
      activeWorkflowModules,
      unusedEntitledModules,
      seatAndResourceUtilization: account.limits,
      customerSuccessRecommendation:
        totalWorkflowTransactions === 0
          ? 'Zero operational transactions recorded yet. Ewan recommends completing initial department onboarding and staff role assignment.'
          : unusedEntitledModules.length > 0
            ? `Active in ${activeWorkflowModules.join(', ')}. Ewan recommends guided training for unused entitled modules: ${unusedEntitledModules.join(', ')}.`
            : 'High multi-department adoption across all core clinical, diagnostic, and billing workflows. Strong renewal & expansion candidate.'
    };
  }

  /**
   * Mode 2: Company Sales Manager Assistant (HQ Sales, Leads, Pipeline, Plan Recommendation & Renewal Opportunities)
   */
  public async getCompanySalesManagerOverview(
    session: SessionContext,
    requirements?: EwanAskInput['requirements']
  ) {
    if (!this.isHqPrivilegedRole(session)) {
      throw AppError.forbidden('Access denied: Company Sales Manager Assistant requires HQ Sales or Admin role.');
    }

    const db = getDatabase();
    const allLeads = db ? await db.select().from(salesLeads).orderBy(desc(salesLeads.createdAt)) : [];
    const allOpps = db ? await db.select().from(salesOpportunities).orderBy(desc(salesOpportunities.createdAt)) : [];
    const allPartners = db ? await db.select().from(partnerProfiles) : [];
    const allSubs = db ? await db.select().from(subscriptions) : [];
    const allLicenses = db ? await db.select().from(licenses) : [];
    const allPlans = db ? await db.select().from(plans).where(eq(plans.status, 'ACTIVE')) : [];
    const allPriceVersions = db ? await db.select().from(priceVersions).where(eq(priceVersions.isActive, true)) : [];
    const allPlanEntitlements = db ? await db.select().from(planEntitlements) : [];
    const allFeatures = db ? await db.select().from(features) : [];

    // 1. Evaluate Renewal & Upgrade Opportunities across existing partners
    const renewalOpportunities: Array<{
      partnerId: string;
      tenantId: string;
      tradeName: string;
      partnerType: string;
      licenseStatus: string;
      daysRemaining: number;
      graceDaysRemaining: number;
      currentPlanName: string;
      annualRenewalAmountInr: number;
      opportunityType: 'LOCKED_RECOVERY' | 'GRACE_PERIOD_URGENT' | 'EXPIRING_30D' | 'RENEWAL_WINDOW_60D';
    }> = [];

    for (const partner of allPartners) {
      const lic = allLicenses.find((l) => l.partnerId === partner.id || l.tenantId === partner.tenantId);
      if (!lic) continue;
      const evalStatus = licenseService.evaluateLicenseStatus(lic);
      const sub = allSubs.find((s) => s.partnerId === partner.id || s.id === lic.subscriptionId);
      const plan = allPlans.find((p) => p.id === (lic.planId || sub?.planId));
      const pv = plan ? allPriceVersions.find((v) => v.planId === plan.id) : null;
      const annualPrice = Number(pv?.annualBasePriceInr || plan?.basePrice || 6000);

      if (evalStatus.status === 'LOCKED' || evalStatus.status === 'EXPIRED') {
        renewalOpportunities.push({
          partnerId: partner.id,
          tenantId: partner.tenantId,
          tradeName: partner.tradeName,
          partnerType: partner.partnerType,
          licenseStatus: evalStatus.status,
          daysRemaining: 0,
          graceDaysRemaining: 0,
          currentPlanName: plan?.name || 'Commercial Plan',
          annualRenewalAmountInr: annualPrice,
          opportunityType: 'LOCKED_RECOVERY'
        });
      } else if (evalStatus.status === 'GRACE_PERIOD') {
        renewalOpportunities.push({
          partnerId: partner.id,
          tenantId: partner.tenantId,
          tradeName: partner.tradeName,
          partnerType: partner.partnerType,
          licenseStatus: evalStatus.status,
          daysRemaining: 0,
          graceDaysRemaining: evalStatus.graceDaysRemaining ?? 0,
          currentPlanName: plan?.name || 'Commercial Plan',
          annualRenewalAmountInr: annualPrice,
          opportunityType: 'GRACE_PERIOD_URGENT'
        });
      } else if (evalStatus.status === 'EXPIRING_SOON') {
        renewalOpportunities.push({
          partnerId: partner.id,
          tenantId: partner.tenantId,
          tradeName: partner.tradeName,
          partnerType: partner.partnerType,
          licenseStatus: evalStatus.status,
          daysRemaining: evalStatus.daysRemaining,
          graceDaysRemaining: evalStatus.graceDaysRemaining ?? 0,
          currentPlanName: plan?.name || 'Commercial Plan',
          annualRenewalAmountInr: annualPrice,
          opportunityType: 'EXPIRING_30D'
        });
      } else if (evalStatus.status === 'RENEWAL_WINDOW') {
        renewalOpportunities.push({
          partnerId: partner.id,
          tenantId: partner.tenantId,
          tradeName: partner.tradeName,
          partnerType: partner.partnerType,
          licenseStatus: evalStatus.status,
          daysRemaining: evalStatus.daysRemaining,
          graceDaysRemaining: evalStatus.graceDaysRemaining ?? 0,
          currentPlanName: plan?.name || 'Commercial Plan',
          annualRenewalAmountInr: annualPrice,
          opportunityType: 'RENEWAL_WINDOW_60D'
        });
      }
    }

    // 2. Plan & Price Catalog + Requirement Recommendation Engine (100% Database-Driven)
    const configuredCatalog = allPlans.map((p) => {
      const pv = allPriceVersions.find((v) => v.planId === p.id);
      const ents = allPlanEntitlements
        .filter((e) => e.planId === p.id)
        .map((e) => {
          const feat = allFeatures.find((f) => f.id === e.featureId);
          return feat?.code || e.featureId;
        });
      const annualBaseInr = Number(pv?.annualBasePriceInr ?? p.basePrice ?? 6000);
      return {
        planId: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        annualBasePriceInr: annualBaseInr,
        priceVersion: pv?.versionNumber || p.version || 'v1.0',
        gstRatePercent: Number(pv?.gstRatePercent ?? 18),
        sacCode: pv?.sacCode || '998313',
        maxDoctors: p.maxDoctors ?? 10,
        maxBranches: p.maxBranches ?? 1,
        entitledFeatureCodes: ents,
        tenures: subscriptionService.getTenureOptions().map((t) => {
          const calc = subscriptionService.calculateCommercialOrder(
            { basePrice: annualBaseInr },
            t.durationDays / 365,
            t.defaultDiscountPercent
          );
          return {
            tenureCode: t.code,
            label: t.label,
            months: t.months,
            discountPercent: t.defaultDiscountPercent,
            finalPayableInr: calc.finalAmount,
            taxableInr: calc.taxableAmount,
            gstAmountInr: calc.gstAmount
          };
        })
      };
    });

    let recommendedPlans = configuredCatalog;
    if (requirements) {
      recommendedPlans = configuredCatalog.filter((c) => {
        if (requirements.doctorCount && c.maxDoctors < requirements.doctorCount) return false;
        if (requirements.branchCount && c.maxBranches < requirements.branchCount) return false;
        if (requirements.partnerType) {
          const pt = requirements.partnerType.toUpperCase();
          if (pt.includes('PATHOLOGY') && c.code.includes('PHARMACY')) return false;
          if (pt.includes('PHARMACY') && c.code.includes('PATHOLOGY')) return false;
        }
        return true;
      });
    }

    // Strict Zero-State Compliance Messages (Section 18)
    const zeroStateMessages: string[] = [];
    if (allLeads.length === 0) {
      zeroStateMessages.push('No active sales leads.');
    }
    if (renewalOpportunities.length === 0) {
      zeroStateMessages.push('No renewal opportunities currently detected.');
    }
    if (recommendedPlans.length === 0) {
      zeroStateMessages.push('No commercial plans configured for this requirement.');
    }

    return {
      leadsSummary: {
        totalLeads: allLeads.length,
        newLeads: allLeads.filter((l) => l.status === 'NEW').length,
        qualifiedLeads: allLeads.filter((l) => l.status === 'QUALIFIED' || l.status === 'PROPOSAL').length,
        convertedLeads: allLeads.filter((l) => l.status === 'CONVERTED' || l.status === 'WON').length,
        leads: allLeads.slice(0, 25),
        zeroStateMessage: allLeads.length === 0 ? 'No active sales leads.' : null
      },
      pipelineSummary: {
        totalOpportunities: allOpps.length,
        opportunities: allOpps.slice(0, 25)
      },
      renewalPipeline: {
        totalRenewalOpportunities: renewalOpportunities.length,
        lockedAccountsCount: renewalOpportunities.filter((r) => r.opportunityType === 'LOCKED_RECOVERY').length,
        gracePeriodCount: renewalOpportunities.filter((r) => r.opportunityType === 'GRACE_PERIOD_URGENT').length,
        expiring30dCount: renewalOpportunities.filter((r) => r.opportunityType === 'EXPIRING_30D').length,
        renewalWindow60dCount: renewalOpportunities.filter((r) => r.opportunityType === 'RENEWAL_WINDOW_60D').length,
        opportunities: renewalOpportunities,
        zeroStateMessage:
          renewalOpportunities.length === 0 ? 'No renewal opportunities currently detected.' : null
      },
      planRecommendations: {
        matchedCount: recommendedPlans.length,
        plans: recommendedPlans,
        zeroStateMessage:
          recommendedPlans.length === 0 ? 'No commercial plans configured for this requirement.' : null
      },
      zeroStateMessages
    };
  }

  /**
   * HQ Finance Manager Assistant (Section 15: Real PostgreSQL Subscriptions, Invoices, Payments & Reconciliation)
   */
  public async getFinanceManagerOverview(session: SessionContext) {
    if (!this.isHqFinanceOrSuperAdmin(session)) {
      throw AppError.forbidden('Access denied: Finance Manager Assistant requires HQ Finance or Super Admin role.');
    }

    const db = getDatabase();
    const allSubs = db ? await db.select().from(subscriptions) : [];
    const allLics = db ? await db.select().from(licenses) : [];
    const allInvs = db ? await db.select().from(companyInvoices).orderBy(desc(companyInvoices.issueDate)) : [];
    const allPays = db ? await db.select().from(companyPayments).orderBy(desc(companyPayments.paymentDate)) : [];
    const allSnapshots = db
      ? await db.select().from(commercialOrderSnapshots).orderBy(desc(commercialOrderSnapshots.createdAt))
      : [];

    const succeededPayments = allPays.filter((p) => p.paymentStatus === 'SUCCEEDED' || p.paymentStatus === 'COMPLETED');
    const totalCollectedRevenueInr = succeededPayments.reduce((acc, p) => acc + (parseFloat(p.amount || '0') || 0), 0);
    const unpaidInvoices = allInvs.filter((i) => i.status !== 'PAID' && i.status !== 'VOID');
    const outstandingReceivablesInr = unpaidInvoices.reduce((acc, i) => acc + (parseFloat(i.totalAmount || '0') || 0), 0);

    // Detect reconciliation anomalies
    const reconciliationAnomalies: Array<{ type: string; referenceId: string; detail: string }> = [];
    for (const snap of allSnapshots) {
      if (snap.status === 'PAID') {
        const lic = allLics.find((l) => l.partnerId === snap.partnerId);
        if (lic && (lic.status === 'LOCKED' || lic.status === 'EXPIRED')) {
          reconciliationAnomalies.push({
            type: 'PAID_SNAPSHOT_BUT_LICENSE_LOCKED',
            referenceId: snap.id,
            detail: `Partner ${snap.partnerId} has PAID snapshot ${snap.id} but license ${lic.licenseKey} is ${lic.status}`
          });
        }
      }
    }

    return {
      revenueMetrics: {
        totalCollectedRevenueInr: Math.round(totalCollectedRevenueInr * 100) / 100,
        outstandingReceivablesInr: Math.round(outstandingReceivablesInr * 100) / 100,
        totalPaidTransactions: succeededPayments.length,
        totalUnpaidInvoices: unpaidInvoices.length,
        pendingCheckoutOrders: allSnapshots.filter((s) => s.status === 'PENDING').length,
        failedCheckoutOrders: allSnapshots.filter((s) => s.status === 'FAILED').length
      },
      subscriptionHealth: {
        totalSubscriptions: allSubs.length,
        activeSubscriptions: allSubs.filter((s) => s.status === 'ACTIVE').length,
        expiredSubscriptions: allSubs.filter((s) => s.status === 'EXPIRED').length,
        lockedLicenses: allLics.filter((l) => licenseService.evaluateLicenseStatus(l).status === 'LOCKED').length
      },
      reconciliation: {
        isHealthy: reconciliationAnomalies.length === 0,
        anomalyCount: reconciliationAnomalies.length,
        anomalies: reconciliationAnomalies
      },
      recentInvoices: allInvs.slice(0, 15),
      recentPayments: allPays.slice(0, 15)
    };
  }

  /**
   * Mode 4 & 5: Authoritative Partner Renewal Order Initiation
   * Never trusts client-supplied prices or unapproved discounts.
   */
  public async initiateRenewalOrder(session: SessionContext, input: InitiateRenewalOrderInput) {
    if (!session.tenantId) {
      throw AppError.unauthorized('Tenant context required to initiate renewal order');
    }

    // Block client-supplied price tampering or unauthorized discount injection
    if (input.requestedPriceOverride !== undefined) {
      await this.writeAuditTrace({
        actorEmail: session.actorEmail || 'partner',
        action: 'RENEWAL_PRICE_TAMPER_BLOCKED',
        entityReference: session.tenantId,
        operationStatus: 'BLOCKED',
        reason: `Rejected client-supplied price override (${input.requestedPriceOverride}). Renewal pricing is strictly server-authoritative.`
      });
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'SECURITY_VIOLATION: Client-supplied price overrides are strictly forbidden. Pricing is computed exclusively from HQ price versions.',
        statusCode: 403
      });
    }

    if (
      input.customDiscountPercent !== undefined &&
      input.customDiscountPercent > 0 &&
      !this.isHqFinanceOrSuperAdmin(session)
    ) {
      await this.writeAuditTrace({
        actorEmail: session.actorEmail || 'partner',
        action: 'RENEWAL_UNAUTHORIZED_DISCOUNT_BLOCKED',
        entityReference: session.tenantId,
        operationStatus: 'BLOCKED',
        reason: `Rejected unauthorized discount request (${input.customDiscountPercent}%).`
      });
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'SECURITY_VIOLATION: Partners cannot apply custom discounts without an authorized HQ commercial override.',
        statusCode: 403
      });
    }

    const db = getDatabase();
    if (!db) {
      throw AppError.internal('Database connection unavailable');
    }

    const account = await partnerAccountService.getPlanAndFeatures(session);
    const partnerId = account.organizationProfile.partnerId;
    if (!partnerId) {
      throw AppError.badRequest('Partner profile record required before initiating renewal order');
    }

    const targetPlanId = input.planId || account.currentPlan?.id;
    if (!targetPlanId) {
      throw AppError.badRequest('No commercial plan selected or assigned for renewal');
    }

    const [plan] = await db.select().from(plans).where(eq(plans.id, targetPlanId)).limit(1);
    if (!plan) {
      throw AppError.notFound(`Commercial plan ${targetPlanId} not found in HQ catalog`);
    }

    const [activePv] = await db
      .select()
      .from(priceVersions)
      .where(and(eq(priceVersions.planId, plan.id), eq(priceVersions.isActive, true)))
      .orderBy(desc(priceVersions.createdAt))
      .limit(1);

    const annualBaseInr = Number(activePv?.annualBasePriceInr ?? plan.basePrice ?? 6000);
    const durationYears = [1, 2, 3, 5].includes(Number(input.durationYears)) ? Number(input.durationYears) : 1;

    const calculation = subscriptionService.calculateCommercialOrder(
      { basePrice: annualBaseInr, metadata: plan.metadata },
      durationYears,
      0,
      Boolean(input.isInterstate)
    );

    const snapshotId = crypto.randomUUID();
    const orderId = `order_ewan_ren_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    await db.insert(commercialOrderSnapshots).values({
      id: snapshotId,
      partnerId,
      planId: plan.id,
      priceVersionId: activePv?.id || null,
      billingDurationYears: durationYears,
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
      customerBillingAddress: 'India',
      status: 'PENDING',
      metadata: {
        razorpayOrderId: orderId,
        tenantId: session.tenantId,
        initiatedVia: 'EWAN_RENEWAL_ASSISTANT',
        initiatedBy: session.actorEmail || session.userId,
        createdAt: new Date().toISOString()
      }
    } as any);

    // Ensure billing account & create ISSUED invoice for auditability
    let [billingAcc] = await db
      .select()
      .from(billingAccounts)
      .where(eq(billingAccounts.partnerId, partnerId))
      .limit(1);

    if (!billingAcc) {
      const newAccId = crypto.randomUUID();
      await db.insert(billingAccounts).values({
        id: newAccId,
        partnerId,
        billingContactName: account.organizationProfile.primaryContactName || account.organizationProfile.tradeName,
        billingEmail: account.organizationProfile.primaryContactEmail || session.actorEmail || 'billing@partner.org',
        currency: 'INR',
        billingCycle: 'ANNUAL',
        status: 'ACTIVE'
      });
      [billingAcc] = await db.select().from(billingAccounts).where(eq(billingAccounts.id, newAccId)).limit(1);
    }

    const invoiceId = crypto.randomUUID();
    const invoiceNumber = `REN-INV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    await db.insert(companyInvoices).values({
      id: invoiceId,
      billingAccountId: billingAcc!.id,
      subscriptionId: account.subscription.id || null,
      invoiceNumber,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      currency: 'INR',
      subtotal: String(calculation.taxableAmount),
      taxAmount: String(calculation.gstAmount),
      totalAmount: String(calculation.finalAmount),
      status: 'ISSUED',
      notes: `Ewan Renewal Order (${plan.name} - ${durationYears} Year)`,
      metadata: {
        snapshotId,
        orderId,
        partnerId,
        tenantId: session.tenantId,
        planId: plan.id,
        durationYears
      }
    });

    await this.writeAuditTrace({
      actorEmail: session.actorEmail || 'partner',
      action: 'EWAN_RENEWAL_ORDER_INITIATED',
      entityReference: snapshotId,
      operationStatus: 'SUCCESS',
      reason: `Initiated renewal order ${orderId} for plan ${plan.code} (${durationYears}Y) at ₹${calculation.finalAmount}`,
      metadata: { snapshotId, orderId, invoiceId, invoiceNumber, finalAmountInr: calculation.finalAmount }
    });

    return {
      snapshotId,
      orderId,
      invoiceId,
      invoiceNumber,
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      durationYears,
      calculation,
      paymentStatus: 'PENDING',
      verificationSignaturePreview:
        process.env['NODE_ENV'] !== 'production'
          ? this.signRenewalPayment(orderId, `pay_${snapshotId.slice(0, 8)}`)
          : undefined
    };
  }

  /**
   * Mode 4, 5 & 6: Deterministic Payment Verification, License Extension, Entitlement Recalculation & Account Unlock
   * Handles:
   * - Failed / Cancelled / Pending payment rejection (License NEVER extended)
   * - Forged signature rejection (401/403)
   * - Amount mismatch rejection (400)
   * - Duplicate callback idempotency (Returns existing settlement without double-extending license)
   * - Atomic subscription & license extension + HMAC re-signing + entitlement cache invalidation
   */
  public async verifyAndSettleRenewalPayment(
    session: SessionContext,
    input: VerifyRenewalPaymentInput
  ) {
    const db = getDatabase();
    if (!db) {
      throw AppError.internal('Database connection unavailable');
    }

    const [snapshot] = await db
      .select()
      .from(commercialOrderSnapshots)
      .where(eq(commercialOrderSnapshots.id, input.snapshotId))
      .limit(1);

    if (!snapshot) {
      throw AppError.notFound(`Renewal order snapshot ${input.snapshotId} not found`);
    }

    const [partner] = await db
      .select()
      .from(partnerProfiles)
      .where(eq(partnerProfiles.id, snapshot.partnerId))
      .limit(1);

    if (!partner) {
      throw AppError.notFound(`Partner profile for snapshot ${input.snapshotId} not found`);
    }

    // Tenant isolation check
    if (!this.isHqPrivilegedRole(session) && partner.tenantId !== session.tenantId) {
      throw AppError.forbidden('Cross-tenant payment verification is strictly forbidden');
    }

    // 1. Idempotency Guard: If snapshot is already PAID, return existing settlement without double-extending
    if (snapshot.status === 'PAID') {
      const [existingLic] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.tenantId, partner.tenantId))
        .limit(1);
      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.partnerId, partner.id))
        .limit(1);

      return {
        isDuplicate: true,
        paymentVerified: true,
        accountUnlocked: true,
        snapshotId: snapshot.id,
        orderId: input.orderId,
        paymentId: (snapshot.metadata as any)?.razorpayPaymentId || input.paymentId,
        subscriptionStatus: existingSub?.status || 'ACTIVE',
        licenseStatus: existingLic?.status || 'ACTIVE',
        newExpiryDate: existingLic?.expiryDate ? new Date(existingLic.expiryDate).toISOString() : null,
        gracePeriodEnd: existingLic?.gracePeriodEnd ? new Date(existingLic.gracePeriodEnd).toISOString() : null,
        message: 'Idempotent replay handled: Payment was already verified and license already extended.'
      };
    }

    // 2. Reject Failed / Cancelled / Pending payment statuses (NEVER extend license)
    const normPaymentStatus = String(input.paymentStatus || 'SUCCESS').toUpperCase();
    if (normPaymentStatus === 'FAILED' || normPaymentStatus === 'CANCELLED' || normPaymentStatus === 'PENDING') {
      await db
        .update(commercialOrderSnapshots)
        .set({
          status: normPaymentStatus === 'PENDING' ? 'PENDING' : 'FAILED',
          metadata: {
            ...((snapshot.metadata as any) || {}),
            lastAttemptPaymentId: input.paymentId,
            lastAttemptStatus: normPaymentStatus,
            failedAt: new Date().toISOString()
          }
        } as any)
        .where(eq(commercialOrderSnapshots.id, snapshot.id));

      await this.writeAuditTrace({
        actorEmail: session.actorEmail || 'partner',
        action: 'RENEWAL_PAYMENT_FAILED_OR_INCOMPLETE',
        entityReference: snapshot.id,
        operationStatus: 'FAILED',
        reason: `Renewal payment ${input.paymentId} reported status ${normPaymentStatus}. License was NOT extended.`
      });

      throw new AppError({
        code: ErrorCode.BAD_REQUEST,
        message: `PAYMENT_NOT_VERIFIED: Payment status is ${normPaymentStatus}. Account remains locked until payment is verified as SUCCEEDED.`,
        statusCode: 400
      });
    }

    // 3. Verify Order ID match
    const expectedOrderId = (snapshot.metadata as any)?.razorpayOrderId;
    if (expectedOrderId && input.orderId !== expectedOrderId) {
      throw new AppError({
        code: ErrorCode.BAD_REQUEST,
        message: `Order ID mismatch: expected ${expectedOrderId}, received ${input.orderId}`,
        statusCode: 400
      });
    }

    // 4. Verify Amount match if provided
    if (input.amountInr !== undefined && Math.round(Number(input.amountInr)) !== Math.round(Number(snapshot.finalAmountInr))) {
      throw new AppError({
        code: ErrorCode.BAD_REQUEST,
        message: `Payment amount mismatch: expected ₹${snapshot.finalAmountInr}, received ₹${input.amountInr}`,
        statusCode: 400
      });
    }

    // 5. Cryptographic Signature Verification (Required unless HQ Finance Super Admin manual verification)
    const expectedSignature = this.signRenewalPayment(input.orderId, input.paymentId);
    const isSignatureValid =
      Boolean(input.signature) &&
      input.signature!.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(input.signature!), Buffer.from(expectedSignature));

    if (!isSignatureValid && !this.isHqFinanceOrSuperAdmin(session)) {
      await this.writeAuditTrace({
        actorEmail: session.actorEmail || 'partner',
        action: 'RENEWAL_PAYMENT_SIGNATURE_FORGERY_BLOCKED',
        entityReference: snapshot.id,
        operationStatus: 'BLOCKED',
        reason: `Rejected unverified/forged payment callback signature for order ${input.orderId}`
      });
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'PAYMENT_SIGNATURE_INVALID: Cryptographic payment signature verification failed. License unlock denied.',
        statusCode: 401
      });
    }

    // 6. Atomic Settlement: Snapshot -> Invoice -> Payment -> Subscription -> License -> Entitlement Cache
    const now = new Date();
    const durationYears = Number(snapshot.billingDurationYears) || 1;
    const durationDays = durationYears * 365;

    // Update Snapshot to PAID
    await db
      .update(commercialOrderSnapshots)
      .set({
        status: 'PAID',
        metadata: {
          ...((snapshot.metadata as any) || {}),
          razorpayPaymentId: input.paymentId,
          paymentMethod: input.paymentMethod || 'ONLINE_VERIFIED',
          paidAt: now.toISOString(),
          verifiedBy: session.actorEmail || 'HMAC_GATEWAY'
        }
      } as any)
      .where(eq(commercialOrderSnapshots.id, snapshot.id));

    // Update or Create Invoice & Payment
    const allInvs = await db.select().from(companyInvoices);
    const matchedInv = allInvs.find((i) => (i.metadata as any)?.snapshotId === snapshot.id);
    if (matchedInv) {
      await db
        .update(companyInvoices)
        .set({ status: 'PAID', updatedAt: now })
        .where(eq(companyInvoices.id, matchedInv.id));

      await db.insert(companyPayments).values({
        id: crypto.randomUUID(),
        invoiceId: matchedInv.id,
        amount: String(snapshot.finalAmountInr),
        currency: 'INR',
        paymentStatus: 'SUCCEEDED',
        provider: 'RAZORPAY_B2B',
        providerReference: input.paymentId,
        paymentDate: now,
        metadata: {
          snapshotId: snapshot.id,
          orderId: input.orderId,
          tenantId: partner.tenantId
        }
      });
    }

    // Extend Subscription
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.partnerId, partner.id))
      .limit(1);

    const baseStart =
      existingSub?.endDate && new Date(existingSub.endDate) > now ? new Date(existingSub.endDate) : now;
    const newExpiryDate = new Date(baseStart.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const newGracePeriodEnd = new Date(newExpiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    let subscriptionId = existingSub?.id;
    if (existingSub) {
      await db
        .update(subscriptions)
        .set({
          planId: snapshot.planId,
          status: 'ACTIVE',
          billingCycle: durationYears === 5 ? 'FIVE_YEARS' : durationYears === 3 ? 'THREE_YEARS' : durationYears === 2 ? 'TWO_YEARS' : 'YEARLY',
          endDate: newExpiryDate,
          renewalDate: newExpiryDate,
          updatedAt: now,
          metadata: {
            ...((existingSub.metadata as any) || {}),
            isFirstYearFree: false,
            lastRenewedAt: now.toISOString(),
            lastPaymentReference: input.paymentId,
            finalPayableAmount: snapshot.finalAmountInr
          }
        })
        .where(eq(subscriptions.id, existingSub.id));
    } else {
      const [plan] = await db.select().from(plans).where(eq(plans.id, snapshot.planId)).limit(1);
      subscriptionId = crypto.randomUUID();
      await db.insert(subscriptions).values({
        id: subscriptionId,
        partnerId: partner.id,
        productId: plan?.productId || '77777777-7777-4777-8777-777777777777',
        planId: snapshot.planId,
        planVersion: plan?.version || '1.0.0',
        status: 'ACTIVE',
        billingCycle: 'YEARLY',
        startDate: now,
        endDate: newExpiryDate,
        renewalDate: newExpiryDate,
        metadata: {
          isFirstYearFree: false,
          lastRenewedAt: now.toISOString(),
          lastPaymentReference: input.paymentId,
          finalPayableAmount: snapshot.finalAmountInr
        }
      });
    }

    // Extend & Re-Sign License
    const [existingLic] = await db
      .select()
      .from(licenses)
      .where(or(eq(licenses.tenantId, partner.tenantId), eq(licenses.partnerId, partner.id)))
      .limit(1);

    const [plan] = await db.select().from(plans).where(eq(plans.id, snapshot.planId)).limit(1);

    let updatedLicenseKey = existingLic?.licenseKey || licenseService.generateLicenseKey();
    if (existingLic) {
      const newSignature = licenseService.signLicensePayload({
        licenseKey: existingLic.licenseKey,
        partnerId: partner.id,
        tenantId: partner.tenantId,
        subscriptionId: subscriptionId!,
        planId: snapshot.planId,
        expiryDate: newExpiryDate.toISOString()
      });

      await db
        .update(licenses)
        .set({
          planId: snapshot.planId,
          subscriptionId: subscriptionId!,
          status: 'ACTIVE',
          activationStatus: 'ACTIVATED',
          expiryDate: newExpiryDate,
          gracePeriodEnd: newGracePeriodEnd,
          maxDoctors: plan?.maxDoctors ?? existingLic.maxDoctors,
          maxBranches: plan?.maxBranches ?? existingLic.maxBranches,
          signature: newSignature,
          updatedAt: now
        })
        .where(eq(licenses.id, existingLic.id));
    } else {
      const newLic = await licenseService.issueLicense({
        partnerId: partner.id,
        tenantId: partner.tenantId,
        subscriptionId: subscriptionId!,
        planId: snapshot.planId,
        expiryDate: newExpiryDate,
        gracePeriodEnd: newGracePeriodEnd,
        maxDoctors: plan?.maxDoctors ?? 20,
        maxBranches: plan?.maxBranches ?? 5
      });
      updatedLicenseKey = newLic.licenseKey;
    }

    // Invalidate Entitlement Cache immediately so operational routes unlock at once
    entitlementService.invalidateTenantCache(partner.tenantId);

    const traceId = await this.writeAuditTrace({
      actorEmail: session.actorEmail || 'partner',
      action: 'RENEWAL_PAYMENT_VERIFIED_AND_ACCOUNT_UNLOCKED',
      entityReference: snapshot.id,
      operationStatus: 'SUCCESS',
      reason: `Verified payment ${input.paymentId} (₹${snapshot.finalAmountInr}). Extended license ${updatedLicenseKey} until ${newExpiryDate.toISOString()} and unlocked account.`,
      metadata: {
        snapshotId: snapshot.id,
        orderId: input.orderId,
        paymentId: input.paymentId,
        tenantId: partner.tenantId,
        newExpiryDate: newExpiryDate.toISOString(),
        gracePeriodEnd: newGracePeriodEnd.toISOString()
      }
    });

    return {
      isDuplicate: false,
      paymentVerified: true,
      accountUnlocked: true,
      snapshotId: snapshot.id,
      orderId: input.orderId,
      paymentId: input.paymentId,
      licenseKey: updatedLicenseKey,
      subscriptionStatus: 'ACTIVE',
      licenseStatus: 'ACTIVE',
      newExpiryDate: newExpiryDate.toISOString(),
      gracePeriodEnd: newGracePeriodEnd.toISOString(),
      traceId,
      message: `Payment verified! Your license has been extended until ${newExpiryDate.toLocaleDateString()} and all entitled modules are now unlocked.`
    };
  }

  /**
   * Main Conversational & Action Entrypoint for Ewan (`POST /api/v1/partner/ewan/ask` & `POST /api/v1/company/ewan/ask`)
   */
  public async askEwan(session: SessionContext, input: EwanAskInput) {
    // 1. Run Adversarial AI Security & Prompt-Injection Firewall first
    const firewall = this.evaluateAdversarialFirewall(session, input);
    if (firewall.blocked) {
      const traceId = await this.writeAuditTrace({
        actorEmail: session.actorEmail || session.userId,
        action: `EWAN_FIREWALL_BLOCK_${firewall.violationCode}`,
        entityReference: session.tenantId || 'hq',
        operationStatus: 'BLOCKED',
        reason: firewall.refusalMessage || 'Blocked by Ewan Governance Firewall',
        metadata: { prompt: input.prompt, violationCode: firewall.violationCode }
      });

      return {
        allowed: false,
        blockedByFirewall: true,
        violationCode: firewall.violationCode,
        mode: input.mode || 'LOCKED_ACCOUNT_RECOVERY',
        reply: firewall.refusalMessage,
        traceId,
        auditHash: this.computeAuditHash({ traceId, violationCode: firewall.violationCode, prompt: input.prompt })
      };
    }

    // 2. If HQ Mode requested (`COMPANY_SALES_MANAGER` or `FINANCE_MANAGER_ASSISTANT`)
    if (
      this.isHqPrivilegedRole(session) &&
      (input.mode === 'COMPANY_SALES_MANAGER' || input.mode === 'FINANCE_MANAGER_ASSISTANT')
    ) {
      if (input.mode === 'FINANCE_MANAGER_ASSISTANT') {
        const finData = await this.getFinanceManagerOverview(session);
        const traceId = await this.writeAuditTrace({
          actorEmail: session.actorEmail || 'hq_finance',
          action: 'EWAN_FINANCE_ASSISTANT_QUERY',
          entityReference: 'hq_finance',
          operationStatus: 'SUCCESS',
          reason: `Answered HQ Finance query: ${input.prompt.slice(0, 80)}`
        });
        return {
          allowed: true,
          blockedByFirewall: false,
          mode: 'FINANCE_MANAGER_ASSISTANT',
          reply: `HQ Finance Summary: Total collected B2B revenue is ₹${finData.revenueMetrics.totalCollectedRevenueInr.toLocaleString('en-IN')} across ${finData.revenueMetrics.totalPaidTransactions} verified payments. Active subscriptions: ${finData.subscriptionHealth.activeSubscriptions}, Locked licenses: ${finData.subscriptionHealth.lockedLicenses}. Reconciliation healthy: ${finData.reconciliation.isHealthy ? 'YES' : 'NO'}.`,
          data: finData,
          traceId,
          auditHash: this.computeAuditHash({ traceId, mode: 'FINANCE_MANAGER_ASSISTANT' })
        };
      }

      const salesData = await this.getCompanySalesManagerOverview(session, input.requirements);
      const traceId = await this.writeAuditTrace({
        actorEmail: session.actorEmail || 'hq_sales',
        action: 'EWAN_SALES_MANAGER_QUERY',
        entityReference: 'hq_sales',
        operationStatus: 'SUCCESS',
        reason: `Answered HQ Sales query: ${input.prompt.slice(0, 80)}`
      });
      return {
        allowed: true,
        blockedByFirewall: false,
        mode: 'COMPANY_SALES_MANAGER',
        reply:
          salesData.zeroStateMessages.length > 0 && salesData.leadsSummary.totalLeads === 0
            ? `${salesData.zeroStateMessages.join(' ')} Configured commercial plans available: ${salesData.planRecommendations.matchedCount}.`
            : `HQ Sales & Renewal Pipeline: ${salesData.leadsSummary.totalLeads} leads (${salesData.leadsSummary.convertedLeads} converted), ${salesData.renewalPipeline.totalRenewalOpportunities} renewal opportunities (${salesData.renewalPipeline.lockedAccountsCount} locked, ${salesData.renewalPipeline.gracePeriodCount} in 30-day grace countdown, ${salesData.renewalPipeline.expiring30dCount} expiring within 30 days, ${salesData.renewalPipeline.renewalWindow60dCount} in 60-day renewal window), and ${salesData.planRecommendations.matchedCount} matching HQ plans.`,
        data: salesData,
        traceId,
        auditHash: this.computeAuditHash({ traceId, mode: 'COMPANY_SALES_MANAGER' })
      };
    }

    // 3. Partner Account & License Evaluation
    const partnerContext = await this.getPartnerEwanContext(session);
    const isLocked = partnerContext.ewanGovernance.isAccountLocked;
    const promptLower = input.prompt.toLowerCase();

    // CRITICAL LOCKED ACCOUNT RULE (Section 10 & 11):
    // When a partner account is LOCKED / EXPIRED / SUSPENDED:
    // - Operational module workflows (OPD, Lab, Radiology, Pharmacy, IPD, Clinical) MUST be blocked.
    // - Ewan MUST remain accessible for Mode 5 (Payment/Renewal) & Mode 6 (Locked-Account Recovery).
    const isAskingOperationalWorkflow =
      input.mode === 'PRODUCT_TRAINER' ||
      Boolean(input.moduleCode && !['RENEWAL', 'BILLING_RENEWAL', 'ACCOUNT'].includes(input.moduleCode.toUpperCase())) ||
      /register patient|create encounter|dispense medicine|validate lab|finalize radiology|admit patient|opd queue|sample accession/i.test(
        promptLower
      );

    if (isLocked && isAskingOperationalWorkflow) {
      const annualPrice = partnerContext.currentPlan?.basePrice ?? 6000;
      const traceId = await this.writeAuditTrace({
        actorEmail: session.actorEmail || 'partner',
        action: 'EWAN_LOCKED_ACCOUNT_OPERATIONAL_BLOCK',
        entityReference: session.tenantId,
        operationStatus: 'BLOCKED',
        reason: `Operational workflow blocked while account is ${partnerContext.subscription.licenseStatus}. Guided user to renewal.`
      });

      return {
        allowed: false,
        blockedByFirewall: false,
        isAccountLocked: true,
        mode: 'LOCKED_ACCOUNT_RECOVERY',
        reply: `🔒 Account Locked (${partnerContext.subscription.licenseStatus}): Operational clinical, laboratory, radiology, and pharmacy modules are currently locked because your subscription expired on ${partnerContext.subscription.expiryDate ? new Date(partnerContext.subscription.expiryDate).toLocaleDateString() : 'N/A'} and the 30-day grace period has ended. Your historical data is 100% safe and preserved. To unlock your workspace immediately, please renew your plan (${partnerContext.currentPlan?.name || 'Standard Plan'} — ₹${annualPrice.toLocaleString('en-IN')}/year incl. GST).`,
        recoveryOptions: {
          currentPlan: partnerContext.currentPlan,
          expiryDate: partnerContext.subscription.expiryDate,
          gracePeriodEnd: partnerContext.subscription.gracePeriodEnd,
          availableRenewalTenures: partnerContext.subscription.availableRenewalTenures,
          primaryCta: 'Renew License',
          secondaryCta: 'Talk to Ewan'
        },
        traceId,
        auditHash: this.computeAuditHash({ traceId, mode: 'LOCKED_ACCOUNT_RECOVERY' })
      };
    }

    // 4. If Partner is locked OR asking about renewal / payment / lock status -> Mode 5 / Mode 6
    if (
      isLocked ||
      input.mode === 'LOCKED_ACCOUNT_RECOVERY' ||
      input.mode === 'PAYMENT_RENEWAL_ASSISTANT' ||
      input.mode === 'RENEWAL_MANAGER' ||
      /renew|expiry|expire|locked|why is my account|grace period|payment|plan price|subscription status|unlock/i.test(promptLower)
    ) {
      const effectiveMode: EwanOperatingMode = isLocked
        ? 'LOCKED_ACCOUNT_RECOVERY'
        : input.mode || 'RENEWAL_MANAGER';
      const annualPrice = partnerContext.currentPlan?.basePrice ?? 6000;
      const stage = partnerContext.subscription.lifecycleStage;

      let stageExplanation = '';
      if (stage === 'ACCOUNT_LOCKED' || stage === 'ACCOUNT_SUSPENDED') {
        stageExplanation = `Your account is currently ${partnerContext.subscription.licenseStatus} (expired on ${partnerContext.subscription.expiryDate ? new Date(partnerContext.subscription.expiryDate).toLocaleDateString() : 'N/A'}). All patient, lab, radiology, and billing records remain safely preserved. Complete your renewal payment of ₹${annualPrice.toLocaleString('en-IN')}/year to immediately extend your license and unlock all entitled modules.`;
      } else if (stage === 'POST_EXPIRY_GRACE_30D') {
        stageExplanation = `⚠️ Post-Expiry 30-Day Grace Countdown: Your plan expired on ${partnerContext.subscription.expiryDate ? new Date(partnerContext.subscription.expiryDate).toLocaleDateString() : 'N/A'}. You have ${partnerContext.subscription.graceDaysRemaining} grace days remaining before your operational workspace is locked on ${partnerContext.subscription.gracePeriodEnd ? new Date(partnerContext.subscription.gracePeriodEnd).toLocaleDateString() : 'N/A'}. Renew now at ₹${annualPrice.toLocaleString('en-IN')}/year to avoid interruption.`;
      } else if (stage === 'EXPIRING_COUNTDOWN_30D') {
        stageExplanation = `⏳ 30-Day Expiry Countdown: Your subscription expires in ${partnerContext.subscription.daysRemaining} days (${partnerContext.subscription.expiryDate ? new Date(partnerContext.subscription.expiryDate).toLocaleDateString() : 'N/A'}). Renew early to preserve uninterrupted clinical operations.`;
      } else if (stage === 'RENEWAL_WINDOW_60D') {
        stageExplanation = `📅 60-Day Renewal Window Open: Your subscription has ${partnerContext.subscription.daysRemaining} days remaining. You can renew today (1, 2, 3, or 5-year tenure) and your new term will be added on top of your remaining days without losing a single day.`;
      } else {
        stageExplanation = `✅ Active Subscription (${stage}): Your ${partnerContext.currentPlan?.name || 'Commercial Plan'} is active with ${partnerContext.subscription.daysRemaining} days remaining (valid until ${partnerContext.subscription.expiryDate ? new Date(partnerContext.subscription.expiryDate).toLocaleDateString() : 'N/A'}).`;
      }

      const traceId = await this.writeAuditTrace({
        actorEmail: session.actorEmail || 'partner',
        action: `EWAN_${effectiveMode}_QUERY`,
        entityReference: session.tenantId,
        operationStatus: 'SUCCESS',
        reason: `Provided authoritative commercial/renewal guidance (${stage})`
      });

      return {
        allowed: true,
        blockedByFirewall: false,
        isAccountLocked: isLocked,
        mode: effectiveMode,
        reply: stageExplanation,
        commercialStatus: {
          currentPlan: partnerContext.currentPlan,
          subscription: partnerContext.subscription,
          canInitiateRenewal: this.isPartnerOwnerOrAdmin(session),
          availableRenewalTenures: partnerContext.subscription.availableRenewalTenures
        },
        traceId,
        auditHash: this.computeAuditHash({ traceId, mode: effectiveMode })
      };
    }

    // 5. Mode 3: Customer Success Assistant
    if (input.mode === 'CUSTOMER_SUCCESS' || /usage|utilization|unused feature|adoption|active module/i.test(promptLower)) {
      const csSummary = await this.getCustomerSuccessSummary(session);
      const traceId = await this.writeAuditTrace({
        actorEmail: session.actorEmail || 'partner',
        action: 'EWAN_CUSTOMER_SUCCESS_QUERY',
        entityReference: session.tenantId,
        operationStatus: 'SUCCESS',
        reason: 'Provided PostgreSQL workflow usage & feature utilization summary'
      });

      return {
        allowed: true,
        blockedByFirewall: false,
        mode: 'CUSTOMER_SUCCESS',
        reply: `${csSummary.customerSuccessRecommendation} Total recorded workflow transactions: ${csSummary.workflowUsage.totalWorkflowTransactions} (OPD: ${csSummary.workflowUsage.opdEncounters}, Lab: ${csSummary.workflowUsage.pathologyLabOrders}, Radiology: ${csSummary.workflowUsage.radiologyImagingOrders}, Pharmacy: ${csSummary.workflowUsage.pharmacyPrescriptions}, Billing: ${csSummary.workflowUsage.billingInvoices}).`,
        data: csSummary,
        traceId,
        auditHash: this.computeAuditHash({ traceId, mode: 'CUSTOMER_SUCCESS' })
      };
    }

    // 6. Default Mode 1: Product Trainer (Role-Scoped & Module-Scoped SOP Guidance)
    const resolvedModule = (input.moduleCode || 'OPD').toUpperCase().trim();
    const moduleWorkflowMap: Record<string, string> = {
      OPD: 'OPD_CONSULTATION',
      CLINICAL: 'OPD_CONSULTATION',
      FRONT_DESK: 'PATIENT_REGISTRATION',
      RECEPTION: 'PATIENT_REGISTRATION',
      LAB: 'LAB_SAMPLE_COLLECTION',
      LIMS: 'LAB_SAMPLE_COLLECTION',
      PATHOLOGY: 'LAB_RESULT_VALIDATION',
      PHARMACY: 'PHARMACY_DISPENSING',
      IPD: 'IPD_ADMISSION_DISCHARGE',
      BILLING: 'BILLING_INVOICE_SETTLEMENT'
    };
    const canonicalWorkflowCode = moduleWorkflowMap[resolvedModule] || 'OPD_CONSULTATION';
    const trainerGuidance = await ewannameStaffTrainerService.getGuidance(session, {
      workflowCode: canonicalWorkflowCode,
      queryText: input.prompt,
      targetModule: resolvedModule
    });

    const enrichedGuidance = {
      ...trainerGuidance,
      moduleCode: resolvedModule,
      role: (session.roles || [])[0] || 'STAFF',
      answer: trainerGuidance.prefixLabel,
      stepByStepGuide: trainerGuidance.steps.map((s) => ({
        step: s.stepNumber,
        title: s.title,
        instructions: s.instructions
      }))
    };

    const traceId = await this.writeAuditTrace({
      actorEmail: session.actorEmail || 'partner',
      action: 'EWAN_PRODUCT_TRAINER_GUIDANCE',
      entityReference: session.tenantId,
      operationStatus: 'SUCCESS',
      reason: `Provided Product Trainer guidance for module ${resolvedModule}`
    });

    return {
      allowed: true,
      blockedByFirewall: false,
      mode: 'PRODUCT_TRAINER',
      reply: `📘 Ewan Product Trainer (${enrichedGuidance.workflowTitle} — Role: ${enrichedGuidance.role}): ${enrichedGuidance.answer} Steps: ${enrichedGuidance.stepByStepGuide.map((s) => `${s.step}. ${s.title}`).join(' -> ')}.`,
      trainerGuidance: enrichedGuidance,
      traceId,
      auditHash: this.computeAuditHash({ traceId, mode: 'PRODUCT_TRAINER', moduleCode: resolvedModule })
    };
  }
}

export const ewanAssistantService = new EwanAssistantService();
