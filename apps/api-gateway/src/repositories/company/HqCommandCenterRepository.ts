import {
  getDatabase,
  tenants,
  partnerProfiles,
  operationalPartners,
  partnerOnboardingStagedRegistrations,
  subscriptions,
  licenses,
  plans,
  commercialOrderSnapshots,
  auditEvents,
  revocations,
  founderApprovalRequests,
  patients,
  encounters,
  inpatientAdmissions,
  investigationOrders,
  radiologyOrders,
  pharmacyDispensing,
  desc
} from '@docsearch/database';
import { AppError, createLogger } from '@docsearch/shared-core';

const logger = createLogger('hq-command-center-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for HQ command center queries');
    throw new AppError({
      message: 'Database connection unavailable',
      statusCode: 500
    });
  }
  return dbClient;
}

export interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  periodName: string;
}

export class HqCommandCenterRepository {
  /**
   * Helper to compute standard date range bounds and matching previous comparison period.
   */
  resolveDateRange(period?: string, customStart?: string, customEnd?: string): DateRange {
    const now = new Date();
    const periodLower = (period || 'THIS_MONTH').toUpperCase();
    let start: Date;
    let end: Date = now;

    if (periodLower === 'TODAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (periodLower === 'YESTERDAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (periodLower === 'LAST_7_DAYS') {
      start = new Date(now.getTime() - 7 * 86400000);
    } else if (periodLower === 'LAST_30_DAYS') {
      start = new Date(now.getTime() - 30 * 86400000);
    } else if (periodLower === 'PREVIOUS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (periodLower === 'CUSTOM' && customStart) {
      start = new Date(customStart);
      end = customEnd ? new Date(customEnd) : now;
    } else {
      // Default: THIS_MONTH
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const durationMs = Math.max(86400000, end.getTime() - start.getTime());
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(start.getTime() - durationMs);

    return {
      start,
      end,
      prevStart,
      prevEnd,
      periodName: periodLower
    };
  }

  // =========================================================================
  // 1. PARTNER LIFECYCLE & ONBOARDING ANALYTICS
  // =========================================================================

  async getPartnerLifecycleAnalytics(range: DateRange) {
    const db = requireDb();

    // Fetch all partner profiles and operational partners
    let allProfiles: any[] = [];
    try {
      allProfiles = await db.select().from(partnerProfiles).orderBy(desc(partnerProfiles.createdAt));
    } catch (err) {
      logger.warn('Could not query partnerProfiles, trying operationalPartners', { error: String(err) });
    }

    let allOpPartners: any[] = [];
    try {
      allOpPartners = await db.select().from(operationalPartners).orderBy(desc(operationalPartners.createdAt));
    } catch (err) {
      logger.warn('Could not query operationalPartners', { error: String(err) });
    }

    let stagedRegistrations: any[] = [];
    try {
      stagedRegistrations = await db.select().from(partnerOnboardingStagedRegistrations).orderBy(desc(partnerOnboardingStagedRegistrations.createdAt));
    } catch (err) {
      logger.warn('Could not query partnerOnboardingStagedRegistrations', { error: String(err) });
    }

    // Unify partners list
    const partnerMap = new Map<string, any>();
    for (const op of allOpPartners) {
      partnerMap.set(op.id, {
        id: op.id,
        tenantId: op.tenantId,
        legalName: op.legalBusinessName,
        partnerType: op.partnerType,
        operatingModel: op.operatingModel || 'STANDARD',
        status: (op.status || 'ONBOARDING').toUpperCase(),
        contactEmail: op.contactEmail,
        createdAt: op.createdAt
      });
    }
    for (const p of allProfiles) {
      if (!partnerMap.has(p.id)) {
        partnerMap.set(p.id, {
          id: p.id,
          tenantId: p.tenantId,
          legalName: p.legalName,
          partnerType: p.partnerType,
          operatingModel: p.operatingModel || 'STANDARD',
          status: (p.lifecycleStatus || 'ONBOARDING').toUpperCase(),
          contactEmail: p.primaryContactEmail,
          createdAt: p.createdAt
        });
      }
    }

    const partners = Array.from(partnerMap.values());
    const totalPartners = partners.length;

    // Filter by period
    const inPeriod = partners.filter(p => p.createdAt && new Date(p.createdAt) >= range.start && new Date(p.createdAt) <= range.end);
    const inPrevPeriod = partners.filter(p => p.createdAt && new Date(p.createdAt) >= range.prevStart && new Date(p.createdAt) <= range.prevEnd);

    // Status breakdown
    const byStatus = {
      ACTIVE: partners.filter(p => p.status === 'ACTIVE' || p.status === 'VERIFIED').length,
      ONBOARDING: partners.filter(p => p.status === 'ONBOARDING' || p.status === 'LEAD' || p.status === 'PENDING').length,
      SUSPENDED: partners.filter(p => p.status === 'SUSPENDED' || p.status === 'LOCKED').length,
      TERMINATED: partners.filter(p => p.status === 'TERMINATED' || p.status === 'INACTIVE' || p.status === 'REJECTED').length
    };

    // Type breakdown
    const byPartnerType: Record<string, number> = {};
    for (const p of partners) {
      const pType = p.partnerType || 'OTHER';
      byPartnerType[pType] = (byPartnerType[pType] || 0) + 1;
    }

    // Pending Staged Registrations (Awaiting HQ Review)
    const pendingStaged = stagedRegistrations.filter(r => (r.status || '').toUpperCase() === 'PENDING');
    const recentStaged = stagedRegistrations.slice(0, 10).map(r => ({
      id: r.id,
      organizationName: r.organizationName,
      organizationType: r.organizationType,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone,
      status: r.status,
      registeredByEmail: r.registeredByEmail,
      createdAt: r.createdAt
    }));

    // Growth calculation with division-by-zero protection
    const newPartnersCount = inPeriod.length;
    const prevNewPartnersCount = inPrevPeriod.length;
    const growthPercent = prevNewPartnersCount > 0
      ? Number((((newPartnersCount - prevNewPartnersCount) / prevNewPartnersCount) * 100).toFixed(1))
      : null;

    return {
      kpi: {
        totalPartners,
        activePartners: byStatus.ACTIVE,
        onboardingPartners: byStatus.ONBOARDING,
        suspendedPartners: byStatus.SUSPENDED,
        terminatedPartners: byStatus.TERMINATED,
        pendingReviewCount: pendingStaged.length,
        newRegistrationsInRange: newPartnersCount,
        growthPercent
      },
      distributions: {
        byStatus,
        byPartnerType
      },
      stagedRegistrations: {
        totalPending: pendingStaged.length,
        recent: recentStaged
      },
      dataQuality: totalPartners > 0 || stagedRegistrations.length > 0 ? 'LIVE_DATABASE' : 'NO_DATA',
      range
    };
  }

  // =========================================================================
  // 2. LICENSING & SUBSCRIPTION ANALYTICS
  // =========================================================================

  async getLicensingSubscriptionAnalytics(range: DateRange) {
    const db = requireDb();

    let allSubscriptions: any[] = [];
    try {
      allSubscriptions = await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
    } catch (err) {
      logger.warn('Could not query subscriptions', { error: String(err) });
    }

    let allLicenses: any[] = [];
    try {
      allLicenses = await db.select().from(licenses).orderBy(desc(licenses.createdAt));
    } catch (err) {
      logger.warn('Could not query licenses', { error: String(err) });
    }

    let allPlans: any[] = [];
    try {
      allPlans = await db.select().from(plans);
    } catch (err) {
      logger.warn('Could not query plans', { error: String(err) });
    }

    const planMap = new Map<string, any>();
    for (const pl of allPlans) {
      planMap.set(pl.id, pl);
    }

    const totalSubscriptions = allSubscriptions.length;
    const now = new Date();

    // Subscriptions status distribution
    const subStatusCount: Record<string, number> = {
      ACTIVE: 0,
      TRIAL: 0,
      PENDING: 0,
      EXPIRED: 0,
      CANCELLED: 0
    };
    for (const sub of allSubscriptions) {
      const status = (sub.status || 'PENDING').toUpperCase();
      subStatusCount[status] = (subStatusCount[status] || 0) + 1;
    }

    // License expiry analysis
    let expiringIn7Days = 0;
    let expiringIn30Days = 0;
    let expiringIn60Days = 0;
    let expiredLicenses = 0;
    let activeLicenses = 0;

    const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 86400000);
    const sixtyDaysLater = new Date(now.getTime() + 60 * 86400000);

    for (const lic of allLicenses) {
      const expiry = lic.expiryDate ? new Date(lic.expiryDate) : null;
      const status = (lic.status || 'ACTIVE').toUpperCase();

      if (status === 'ACTIVE') {
        activeLicenses++;
      }

      if (expiry) {
        if (expiry < now) {
          expiredLicenses++;
        } else if (expiry <= sevenDaysLater) {
          expiringIn7Days++;
        } else if (expiry <= thirtyDaysLater) {
          expiringIn30Days++;
        } else if (expiry <= sixtyDaysLater) {
          expiringIn60Days++;
        }
      }
    }

    // Plan distribution
    const planDistribution: Record<string, { planName: string; planCode: string; count: number; totalBasePrice: number }> = {};
    for (const sub of allSubscriptions) {
      const p = planMap.get(sub.planId);
      const planCode = p?.code || 'CUSTOM';
      const planName = p?.name || 'Standard Tier';
      const basePrice = p?.basePrice || 0;

      if (!planDistribution[planCode]) {
        planDistribution[planCode] = {
          planName,
          planCode,
          count: 0,
          totalBasePrice: 0
        };
      }
      planDistribution[planCode].count++;
      planDistribution[planCode].totalBasePrice += basePrice;
    }

    // Recent licenses with details
    const recentLicenses = allLicenses.slice(0, 10).map(lic => {
      const p = planMap.get(lic.planId);
      return {
        id: lic.id,
        licenseKey: lic.licenseKey ? `${lic.licenseKey.slice(0, 8)}...${lic.licenseKey.slice(-4)}` : 'N/A',
        partnerId: lic.partnerId,
        tenantId: lic.tenantId,
        planName: p?.name || 'Standard',
        status: lic.status,
        maxDoctors: lic.maxDoctors,
        maxBranches: lic.maxBranches,
        issuedAt: lic.issuedAt,
        expiryDate: lic.expiryDate
      };
    });

    return {
      kpi: {
        totalSubscriptions,
        activeSubscriptions: subStatusCount['ACTIVE'] || 0,
        trialSubscriptions: subStatusCount['TRIAL'] || 0,
        pendingSubscriptions: subStatusCount['PENDING'] || 0,
        totalLicenses: allLicenses.length,
        activeLicenses,
        expiredLicenses,
        expiringIn7Days,
        expiringIn30Days,
        expiringIn60Days
      },
      distributions: {
        bySubscriptionStatus: subStatusCount,
        byPlan: Object.values(planDistribution)
      },
      recentLicenses,
      dataQuality: allSubscriptions.length > 0 || allLicenses.length > 0 ? 'LIVE_DATABASE' : 'NO_DATA',
      range
    };
  }

  // =========================================================================
  // 3. HQ FINANCIAL & SUBSCRIPTION REVENUE ANALYTICS
  // =========================================================================

  async getHqFinancialAnalytics(range: DateRange) {
    const db = requireDb();

    let allOrders: any[] = [];
    try {
      allOrders = await db.select().from(commercialOrderSnapshots).orderBy(desc(commercialOrderSnapshots.createdAt));
    } catch (err) {
      logger.warn('Could not query commercialOrderSnapshots', { error: String(err) });
    }

    let allSubscriptions: any[] = [];
    try {
      allSubscriptions = await db.select().from(subscriptions);
    } catch (err) {
      logger.warn('Could not query subscriptions', { error: String(err) });
    }

    let allPlans: any[] = [];
    try {
      allPlans = await db.select().from(plans);
    } catch (err) {
      logger.warn('Could not query plans', { error: String(err) });
    }

    const planMap = new Map<string, any>();
    for (const pl of allPlans) planMap.set(pl.id, pl);

    // Sum up revenue from commercial snapshots
    let totalGrossRevenue = 0;
    let totalTaxAmount = 0;
    let totalDiscountAmount = 0;
    let totalNetRevenue = 0;
    let totalPendingReceivables = 0;

    let periodGrossRevenue = 0;
    let periodNetRevenue = 0;
    let prevPeriodNetRevenue = 0;

    const revenueByPlan: Record<string, { planName: string; planCode: string; totalRevenue: number; ordersCount: number }> = {};
    const revenueByDuration: Record<string, number> = { '1_YEAR': 0, '2_YEARS': 0, '3_YEARS': 0, '5_YEARS': 0 };

    for (const ord of allOrders) {
      const gross = Number(ord.grossAmountInr || 0);
      const tax = Number(ord.cgstAmountInr || 0) + Number(ord.sgstAmountInr || 0) + Number(ord.igstAmountInr || 0);
      const discount = Number(ord.discountAmountInr || 0);
      const finalAmt = Number(ord.finalAmountInr || 0);
      const status = (ord.status || 'PENDING').toUpperCase();
      const createdAt = ord.createdAt ? new Date(ord.createdAt) : null;

      if (status === 'PAID') {
        totalGrossRevenue += gross;
        totalTaxAmount += tax;
        totalDiscountAmount += discount;
        totalNetRevenue += finalAmt;

        const durKey = `${ord.billingDurationYears || 1}_YEAR${(ord.billingDurationYears || 1) > 1 ? 'S' : ''}`;
        revenueByDuration[durKey] = (revenueByDuration[durKey] || 0) + finalAmt;

        const p = planMap.get(ord.planId);
        const planCode = p?.code || 'UNKNOWN';
        const planName = p?.name || 'Standard Tier';

        if (!revenueByPlan[planCode]) {
          revenueByPlan[planCode] = { planName, planCode, totalRevenue: 0, ordersCount: 0 };
        }
        revenueByPlan[planCode].totalRevenue += finalAmt;
        revenueByPlan[planCode].ordersCount++;

        if (createdAt && createdAt >= range.start && createdAt <= range.end) {
          periodGrossRevenue += gross;
          periodNetRevenue += finalAmt;
        } else if (createdAt && createdAt >= range.prevStart && createdAt <= range.prevEnd) {
          prevPeriodNetRevenue += finalAmt;
        }
      } else if (status === 'PENDING') {
        totalPendingReceivables += finalAmt;
      }
    }

    // If commercial snapshots are empty, check if subscriptions have plan values
    if (allOrders.length === 0 && allSubscriptions.length > 0) {
      for (const sub of allSubscriptions) {
        if (sub.status === 'ACTIVE') {
          const p = planMap.get(sub.planId);
          const base = Number(p?.basePrice || 0);
          totalNetRevenue += base;
        }
      }
    }

    const growthPercent = prevPeriodNetRevenue > 0
      ? Number((((periodNetRevenue - prevPeriodNetRevenue) / prevPeriodNetRevenue) * 100).toFixed(1))
      : null;

    return {
      revenueType: 'HQ_SUBSCRIPTION_LICENSING',
      kpi: {
        totalNetRevenue,
        totalGrossRevenue,
        totalTaxAmount,
        totalDiscountAmount,
        totalPendingReceivables,
        periodGrossRevenue,
        periodNetRevenue,
        growthPercent
      },
      distributions: {
        byPlan: Object.values(revenueByPlan),
        byDuration: revenueByDuration
      },
      dataQuality: allOrders.length > 0 || totalNetRevenue > 0 ? 'LIVE_DATABASE' : 'NO_DATA',
      range
    };
  }

  // =========================================================================
  // 4. CROSS-TENANT PLATFORM CLINICAL THROUGHPUT
  // =========================================================================

  async getPlatformCrossTenantClinicalThroughput(range: DateRange) {
    const db = requireDb();

    // Query across all tenants
    let allPatients: any[] = [];
    try {
      allPatients = await db.select({ id: patients.id, tenantId: patients.tenantId, createdAt: patients.createdAt }).from(patients);
    } catch (err) {
      logger.warn('Could not query cross-tenant patients', { error: String(err) });
    }

    let allEncounters: any[] = [];
    try {
      allEncounters = await db.select({ id: encounters.id, tenantId: encounters.tenantId, type: encounters.encounterType, status: encounters.status, createdAt: encounters.createdAt }).from(encounters);
    } catch (err) {
      logger.warn('Could not query cross-tenant encounters', { error: String(err) });
    }

    let allAdmissions: any[] = [];
    try {
      allAdmissions = await db.select({ id: inpatientAdmissions.id, tenantId: inpatientAdmissions.tenantId, status: inpatientAdmissions.status, admissionDate: inpatientAdmissions.admissionDateTime }).from(inpatientAdmissions);
    } catch (err) {
      logger.warn('Could not query cross-tenant inpatientAdmissions', { error: String(err) });
    }

    let allLabOrders: any[] = [];
    try {
      allLabOrders = await db.select({ id: investigationOrders.id, tenantId: investigationOrders.tenantId, status: investigationOrders.status, createdAt: investigationOrders.createdAt }).from(investigationOrders);
    } catch (err) {
      logger.warn('Could not query cross-tenant investigationOrders', { error: String(err) });
    }

    let allRadOrders: any[] = [];
    try {
      allRadOrders = await db.select({ id: radiologyOrders.id, tenantId: radiologyOrders.tenantId, status: radiologyOrders.status, createdAt: radiologyOrders.orderedAt }).from(radiologyOrders);
    } catch (err) {
      logger.warn('Could not query cross-tenant radiologyOrders', { error: String(err) });
    }

    let allDispenses: any[] = [];
    try {
      allDispenses = await db.select({ id: pharmacyDispensing.id, tenantId: pharmacyDispensing.tenantId, status: pharmacyDispensing.dispensingStatus, createdAt: pharmacyDispensing.createdAt }).from(pharmacyDispensing);
    } catch (err) {
      logger.warn('Could not query cross-tenant pharmacyDispensing', { error: String(err) });
    }

    // Totals
    const totalPatients = allPatients.length;
    const totalEncounters = allEncounters.length;
    const totalAdmissions = allAdmissions.length;
    const totalLabOrders = allLabOrders.length;
    const totalRadOrders = allRadOrders.length;
    const totalDispenses = allDispenses.length;

    // Period specific throughput
    const periodPatients = allPatients.filter(p => p.createdAt && new Date(p.createdAt) >= range.start && new Date(p.createdAt) <= range.end).length;
    const periodEncounters = allEncounters.filter(e => e.createdAt && new Date(e.createdAt) >= range.start && new Date(e.createdAt) <= range.end).length;
    const periodLabOrders = allLabOrders.filter(l => l.createdAt && new Date(l.createdAt) >= range.start && new Date(l.createdAt) <= range.end).length;
    const periodRadOrders = allRadOrders.filter(r => r.createdAt && new Date(r.createdAt) >= range.start && new Date(r.createdAt) <= range.end).length;
    const periodDispenses = allDispenses.filter(d => d.createdAt && new Date(d.createdAt) >= range.start && new Date(d.createdAt) <= range.end).length;

    // Active tenants represented in clinical throughput
    const activeTenantIds = new Set<string>();
    for (const e of allEncounters) if (e.tenantId) activeTenantIds.add(e.tenantId);
    for (const p of allPatients) if (p.tenantId) activeTenantIds.add(p.tenantId);

    const hasData = totalPatients > 0 || totalEncounters > 0 || totalLabOrders > 0;

    return {
      kpi: {
        totalPatients,
        totalEncounters,
        totalAdmissions,
        totalLabOrders,
        totalRadOrders,
        totalDispenses,
        periodPatients,
        periodEncounters,
        periodLabOrders,
        periodRadOrders,
        periodDispenses,
        activeTenantsWithClinicalLoad: activeTenantIds.size
      },
      dataQuality: hasData ? 'LIVE_DATABASE' : 'NO_DATA',
      range
    };
  }

  // =========================================================================
  // 5. PLATFORM SECURITY & GOVERNANCE TELEMETRY
  // =========================================================================

  async getSecurityGovernanceTelemetry(range: DateRange) {
    const db = requireDb();

    let allAudits: any[] = [];
    try {
      allAudits = await db.select().from(auditEvents).orderBy(desc(auditEvents.timestamp));
    } catch (err) {
      logger.warn('Could not query auditEvents', { error: String(err) });
    }

    let allRevocations: any[] = [];
    try {
      allRevocations = await db.select().from(revocations);
    } catch (err) {
      logger.warn('Could not query revocations', { error: String(err) });
    }

    let allFounderRequests: any[] = [];
    try {
      allFounderRequests = await db.select().from(founderApprovalRequests).orderBy(desc(founderApprovalRequests.createdAt));
    } catch (err) {
      logger.warn('Could not query founderApprovalRequests', { error: String(err) });
    }

    // Filter audits within period
    const periodAudits = allAudits.filter(a => {
      const ts = a.timestamp ? new Date(a.timestamp) : null;
      return ts && ts >= range.start && ts <= range.end;
    });

    const severityBreakdown: Record<string, number> = {
      CRITICAL: 0,
      ERROR: 0,
      WARN: 0,
      INFO: 0
    };
    const actionBreakdown: Record<string, number> = {};

    for (const audit of periodAudits) {
      const sev = (audit.severity || 'INFO').toUpperCase();
      severityBreakdown[sev] = (severityBreakdown[sev] || 0) + 1;

      const act = audit.action || 'UNKNOWN_ACTION';
      actionBreakdown[act] = (actionBreakdown[act] || 0) + 1;
    }

    // Founder approval breakdown
    const founderPending = allFounderRequests.filter(r => (r.approvalStatus || '').includes('PENDING')).length;
    const founderApproved = allFounderRequests.filter(r => (r.approvalStatus || '') === 'APPROVED').length;
    const founderRejected = allFounderRequests.filter(r => (r.approvalStatus || '') === 'REJECTED').length;

    const recentFounderRequests = allFounderRequests.slice(0, 10).map(r => ({
      id: r.id,
      requestNumber: r.requestNumber,
      entityType: r.entityType,
      taskTitle: r.taskTitle,
      submitterName: r.submitterName,
      submitterEmail: r.submitterEmail,
      submitterRole: r.submitterRole,
      approvalStatus: r.approvalStatus,
      createdAt: r.createdAt
    }));

    const recentCriticalAudits = periodAudits
      .filter(a => (a.severity || '').toUpperCase() === 'CRITICAL' || (a.severity || '').toUpperCase() === 'ERROR')
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        action: a.action,
        actorEmail: a.actorEmail,
        resourceType: a.resourceType,
        severity: a.severity,
        timestamp: a.timestamp
      }));

    return {
      kpi: {
        totalAuditEvents: allAudits.length,
        periodAuditEvents: periodAudits.length,
        activeRevocations: allRevocations.length,
        totalFounderRequests: allFounderRequests.length,
        pendingFounderApprovals: founderPending,
        approvedFounderApprovals: founderApproved,
        rejectedFounderApprovals: founderRejected,
        criticalSecurityEvents: severityBreakdown['CRITICAL'] || 0
      },
      distributions: {
        bySeverity: severityBreakdown,
        byAction: actionBreakdown
      },
      recentCriticalAudits,
      recentFounderRequests,
      dataQuality: allAudits.length > 0 || allFounderRequests.length > 0 ? 'LIVE_DATABASE' : 'NO_DATA',
      range
    };
  }

  // =========================================================================
  // 6. PLATFORM OPERATIONAL HEALTH
  // =========================================================================

  async getPlatformOperationalHealth() {
    const db = requireDb();

    let dbStatus = 'UNKNOWN';
    let totalTenants = 0;

    try {
      const tenantList = await db.select({ id: tenants.id }).from(tenants);
      totalTenants = tenantList.length;
      dbStatus = 'HEALTHY';
    } catch (err) {
      dbStatus = 'DEGRADED';
      logger.error('Failed operational health ping to tenants table', { error: String(err) });
    }

    return {
      status: dbStatus === 'HEALTHY' ? 'OPERATIONAL' : 'DEGRADED',
      database: {
        status: dbStatus,
        driver: 'pg-drizzle',
        connected: dbStatus === 'HEALTHY'
      },
      platform: {
        totalTenants,
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      },
      dataQuality: 'LIVE_DATABASE'
    };
  }

  // =========================================================================
  // 7. EXECUTIVE HQ OVERVIEW
  // =========================================================================

  async getExecutiveHqOverview(range: DateRange) {
    const [partnerLifecycle, licensing, financial, throughput, security, health] = await Promise.all([
      this.getPartnerLifecycleAnalytics(range),
      this.getLicensingSubscriptionAnalytics(range),
      this.getHqFinancialAnalytics(range),
      this.getPlatformCrossTenantClinicalThroughput(range),
      this.getSecurityGovernanceTelemetry(range),
      this.getPlatformOperationalHealth()
    ]);

    return {
      summary: {
        activePartners: partnerLifecycle.kpi.activePartners,
        totalPartners: partnerLifecycle.kpi.totalPartners,
        pendingOnboarding: partnerLifecycle.kpi.pendingReviewCount,
        activeSubscriptions: licensing.kpi.activeSubscriptions,
        expiringLicenses7d: licensing.kpi.expiringIn7Days,
        totalHqRevenue: financial.kpi.totalNetRevenue,
        periodHqRevenue: financial.kpi.periodNetRevenue,
        revenueGrowthPercent: financial.kpi.growthPercent,
        platformPatients: throughput.kpi.totalPatients,
        platformEncounters: throughput.kpi.totalEncounters,
        criticalSecurityAlerts: security.kpi.criticalSecurityEvents,
        pendingFounderApprovals: security.kpi.pendingFounderApprovals,
        platformStatus: health.status
      },
      partnerLifecycle,
      licensing,
      financial,
      throughput,
      security,
      health,
      range
    };
  }
}

export const hqCommandCenterRepository = new HqCommandCenterRepository();
