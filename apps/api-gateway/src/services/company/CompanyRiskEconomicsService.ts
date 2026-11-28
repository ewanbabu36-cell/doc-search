import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import type { SessionContext } from '@docsearch/auth';
import type { RiskLeakageAlert, RiskPreventionPolicy, CompanyCostLedgerEntry } from '@docsearch/database';
import { riskManagementRepository, type RiskSnapshotRawData } from '../../repositories/company/RiskManagementRepository.js';
import { partnerGovernanceService } from './PartnerGovernanceService.js';
import { usageQuotaThrottlerService } from './UsageQuotaThrottlerService.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

const logger = createLogger('company-risk-economics-service');

export type CostCategory =
  | 'CLOUD_INFRA'
  | 'AI_INFERENCE'
  | 'SMS_WHATSAPP'
  | 'GATEWAY_MDR'
  | 'PAYROLL_SUPPORT'
  | 'MARKETING_CAC'
  | 'REFUND_WRITEOFF';

export type MitigationAction =
  | 'CONTAIN_BILLING_FREEZE'
  | 'CONTAIN_THROTTLE_QUOTA'
  | 'REVOKE_OVERDUE_GRACE'
  | 'ISSUE_RECOVERY_NOTICE'
  | 'MARK_RESOLVED'
  | 'DISMISS';

const ALL_COST_CATEGORIES: CostCategory[] = [
  'CLOUD_INFRA',
  'AI_INFERENCE',
  'SMS_WHATSAPP',
  'GATEWAY_MDR',
  'PAYROLL_SUPPORT',
  'MARKETING_CAC',
  'REFUND_WRITEOFF'
];

const COGS_CATEGORIES = new Set<string>(['CLOUD_INFRA', 'AI_INFERENCE', 'SMS_WHATSAPP', 'GATEWAY_MDR']);

function num(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const parsed = Number.parseFloat(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function getBillingPeriodKey(d: Date = new Date()): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function computeSubscriptionMonthlyInr(sub: any, plan: any): { monthlyInr: number; annualDiscountLossInr: number; customDiscountPct: number } {
  const meta = (sub?.metadata || {}) as Record<string, any>;
  const cycle = String(sub?.billingCycle || 'MONTHLY').toUpperCase();
  const baseAnnual = num(plan?.basePrice);
  const isFree =
    Boolean(meta['isFirstYearFree']) ||
    Boolean(meta['zeroSoftwareFees']) ||
    String(plan?.code || '').includes('FREE') ||
    cycle === 'PROMOTIONAL_FREE_1_YEAR';

  if (isFree) {
    return {
      monthlyInr: 0,
      annualDiscountLossInr: Math.max(0, baseAnnual),
      customDiscountPct: baseAnnual > 0 ? 100 : 0
    };
  }

  // Prefer authoritative deal desk negotiated amounts if stored on subscription metadata
  if (num(meta['monthlyEffectivePrice']) > 0) {
    const totalGross = num(meta['totalGrossAmount']);
    const finalPayable = num(meta['finalPayableAmount']);
    const totalDisc = Math.max(0, num(meta['totalDiscountAmount']) || (totalGross - finalPayable));
    const discPct = totalGross > 0 ? round2((totalDisc / totalGross) * 100) : num(meta['customDiscountPercent']);
    return {
      monthlyInr: round2(num(meta['monthlyEffectivePrice'])),
      annualDiscountLossInr: round2(totalDisc / Math.max(1, (num(meta['tenureMonths']) || 12) / 12)),
      customDiscountPct: round2(discPct)
    };
  }

  // Plan basePrice in seed catalogs is annual for *_ANNUAL* or monthly for MONTHLY
  const interval = String(plan?.billingInterval || 'MONTHLY').toUpperCase();
  let monthlyInr = interval === 'ANNUAL' || interval === 'YEARLY' ? baseAnnual / 12 : baseAnnual;
  if (cycle === 'ANNUAL' || cycle === 'YEARLY') {
    monthlyInr = baseAnnual >= 12000 ? baseAnnual / 12 : baseAnnual;
  }

  return {
    monthlyInr: round2(Math.max(0, monthlyInr)),
    annualDiscountLossInr: round2(Math.max(0, num(meta['discountAmount']) || num(meta['totalDiscountAmount']))),
    customDiscountPct: round2(num(meta['customDiscountPercent']))
  };
}

export interface PartnerUnitEconomics {
  partnerId: string;
  tenantId: string;
  partnerName: string;
  partnerType: string;
  lifecycleStatus: string;
  planCode: string;
  planName: string;
  licenseStatus: string;
  isFreeTier: boolean;
  contractedMrrInr: number;
  collectedRevenueInr: number;
  pendingReceivableInr: number;
  overdueReceivableInr: number;
  attributedCostInr: number;
  cogsInr: number;
  opexInr: number;
  netMarginInr: number;
  grossMarginPercent: number | null;
  clinicalGmvInr: number;
  clinicalCollectedInr: number;
  clinicalDiscountsInr: number;
  clinicalRefundsInr: number;
  refundRatePercent: number;
  unbilledCompletedEncounters: number;
  expiredBatchLossInr: number;
  openAlertCount: number;
  riskStatus: 'PROFITABLE' | 'THIN_MARGIN' | 'LOSS_MAKING' | 'FREE_BURN';
}

export interface CompanyRiskOverview {
  dataSource: 'live_postgresql';
  billingPeriod: string;
  isEmptyDatabase: boolean;
  pnl: {
    contractedMrrInr: number;
    contractedArrInr: number;
    collectedCashInr: number;
    pendingReceivablesInr: number;
    overdueReceivablesInr: number;
    discountWaiverLossInr: number;
    partnerClinicalGmvInr: number;
    partnerClinicalCollectedInr: number;
    partnerClinicalRefundsInr: number;
    platformTakeRateInr: number;
    tdsSection194OInr: number;
    totalRecognizedRevenueInr: number;
    totalCogsInr: number;
    totalOpexInr: number;
    totalCostInr: number;
    netProfitLossInr: number;
    grossMarginPercent: number;
    ebitdaMarginPercent: number;
    monthlyBurnRateInr: number;
    totalDirectLeakageExposureInr: number;
  };
  costBreakdown: Array<{
    category: CostCategory;
    isCogs: boolean;
    amountInr: number;
    entryCount: number;
  }>;
  partnerSummary: {
    totalPartners: number;
    paidPartners: number;
    freeTierPartners: number;
    lossMakingPartners: number;
    overduePartners: number;
  };
  unitMarginLeaderboard: PartnerUnitEconomics[];
  openAlertsSummary: {
    totalOpen: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalEstimatedLossInr: number;
    totalMonthlyBurnInr: number;
  };
  activePolicy: RiskPreventionPolicy;
  generatedAt: string;
}

export class CompanyRiskEconomicsService {
  private buildPartnerAnalytics(raw: RiskSnapshotRawData, billingPeriod?: string): {
    overview: CompanyRiskOverview;
    unbilledEncounters: Array<any>;
    expiredBatches: Array<any>;
    overdueCompanyInvoices: Array<any>;
  } {
    const now = new Date();
    const activePeriod = billingPeriod || getBillingPeriodKey(now);
    const minMarginFloor = num(raw.policy.minGrossMarginPercent);
    const freeTierCogsCap = num(raw.policy.freeTierMonthlyCogsCapInr);

    const planById = new Map(raw.plans.map((p) => [p.id, p]));
    const billingAccById = new Map(raw.billingAccounts.map((ba) => [ba.id, ba]));

    // Map company invoices to partners via billingAccountId
    const companyInvByPartner = new Map<string, Array<typeof raw.companyInvoices[number]>>();
    const companyInvIdToPartner = new Map<string, string>();
    for (const inv of raw.companyInvoices) {
      const ba = billingAccById.get(inv.billingAccountId);
      if (ba) {
        companyInvIdToPartner.set(inv.id, ba.partnerId);
        const list = companyInvByPartner.get(ba.partnerId) || [];
        list.push(inv);
        companyInvByPartner.set(ba.partnerId, list);
      }
    }

    // Company cash payments
    const paidStatuses = new Set(['PAID', 'COMPLETED', 'SUCCESS', 'SETTLED']);
    const collectedByPartner = new Map<string, number>();
    let totalCollectedCashInr = 0;
    for (const pay of raw.companyPayments) {
      if (!paidStatuses.has(String(pay.paymentStatus || '').toUpperCase())) continue;
      const amt = num(pay.amount);
      totalCollectedCashInr += amt;
      const pId = companyInvIdToPartner.get(pay.invoiceId);
      if (pId) {
        collectedByPartner.set(pId, (collectedByPartner.get(pId) || 0) + amt);
      }
    }

    // Pending & Overdue company receivables
    const settledInvStatuses = new Set(['PAID', 'CANCELLED', 'VOIDED']);
    const overdueCompanyInvoices: Array<any> = [];
    let totalPendingReceivablesInr = 0;
    let totalOverdueReceivablesInr = 0;
    const pendingByPartner = new Map<string, number>();
    const overdueByPartner = new Map<string, number>();

    for (const inv of raw.companyInvoices) {
      const st = String(inv.status || '').toUpperCase();
      if (settledInvStatuses.has(st)) continue;
      const amt = num(inv.totalAmount);
      const isOverdue = st === 'OVERDUE' || (inv.dueDate && new Date(inv.dueDate).getTime() < now.getTime());
      const pId = companyInvIdToPartner.get(inv.id);
      totalPendingReceivablesInr += amt;
      if (pId) pendingByPartner.set(pId, (pendingByPartner.get(pId) || 0) + amt);
      if (isOverdue) {
        totalOverdueReceivablesInr += amt;
        if (pId) overdueByPartner.set(pId, (overdueByPartner.get(pId) || 0) + amt);
        overdueCompanyInvoices.push({ ...inv, partnerId: pId || null, amountNum: amt });
      }
    }

    // Period costs & unattributed shared OPEX
    const filteredCosts = billingPeriod
      ? raw.costLedger.filter((c) => c.billingPeriod === billingPeriod)
      : raw.costLedger;

    const costByCategory = new Map<CostCategory, { amount: number; count: number }>();
    for (const cat of ALL_COST_CATEGORIES) {
      costByCategory.set(cat, { amount: 0, count: 0 });
    }

    const directCogsByPartner = new Map<string, number>();
    const directOpexByPartner = new Map<string, number>();
    let totalCogsInr = 0;
    let totalOpexInr = 0;
    let sharedOpexPoolInr = 0;

    for (const entry of filteredCosts) {
      const cat = String(entry.category || 'CLOUD_INFRA') as CostCategory;
      const amt = num(entry.amountInr);
      const bucket = costByCategory.get(cat) || { amount: 0, count: 0 };
      bucket.amount += amt;
      bucket.count += 1;
      costByCategory.set(cat, bucket);

      const isCogs = COGS_CATEGORIES.has(cat);
      if (isCogs) totalCogsInr += amt;
      else totalOpexInr += amt;

      const resolvedPartnerId =
        entry.partnerId ||
        (entry.tenantId ? raw.partners.find((p) => p.tenantId === entry.tenantId)?.id : undefined);

      if (resolvedPartnerId) {
        if (isCogs) {
          directCogsByPartner.set(resolvedPartnerId, (directCogsByPartner.get(resolvedPartnerId) || 0) + amt);
        } else {
          directOpexByPartner.set(resolvedPartnerId, (directOpexByPartner.get(resolvedPartnerId) || 0) + amt);
        }
      } else {
        sharedOpexPoolInr += amt;
      }
    }

    // Include clinical refund write-offs/losses & clinical GMV metrics per tenant
    const clinicalGmvByTenant = new Map<string, number>();
    const clinicalCollectedByTenant = new Map<string, number>();
    const clinicalDiscountsByTenant = new Map<string, number>();
    const clinicalRefundsByTenant = new Map<string, number>();
    const billedEncounterIds = new Set<string>();

    let partnerClinicalGmvInr = 0;
    let partnerClinicalCollectedInr = 0;
    for (const inv of raw.clinicalInvoices) {
      const st = String(inv.status || '').toUpperCase();
      if (st === 'CANCELLED' || st === 'VOIDED') continue;
      if (inv.encounterId) billedEncounterIds.add(inv.encounterId);
      const tot = num(inv.totalAmount);
      const paid = num(inv.paidAmount);
      partnerClinicalGmvInr += tot;
      partnerClinicalCollectedInr += paid;
      clinicalGmvByTenant.set(inv.tenantId, (clinicalGmvByTenant.get(inv.tenantId) || 0) + tot);
      clinicalCollectedByTenant.set(inv.tenantId, (clinicalCollectedByTenant.get(inv.tenantId) || 0) + paid);
    }

    let clinicalDiscountLossInr = 0;
    for (const disc of raw.clinicalDiscounts) {
      const dAmt = num(disc.discountAmount);
      clinicalDiscountLossInr += dAmt;
      clinicalDiscountsByTenant.set(disc.tenantId, (clinicalDiscountsByTenant.get(disc.tenantId) || 0) + dAmt);
    }

    let partnerClinicalRefundsInr = 0;
    for (const ref of raw.clinicalRefunds) {
      if (String(ref.status || '').toUpperCase() === 'REJECTED' || String(ref.status || '').toUpperCase() === 'CANCELLED') {
        continue;
      }
      const rAmt = num(ref.amount);
      partnerClinicalRefundsInr += rAmt;
      clinicalRefundsByTenant.set(ref.tenantId, (clinicalRefundsByTenant.get(ref.tenantId) || 0) + rAmt);
    }

    // Completed clinical encounters without an invoice -> revenue leakage
    const unbilledByTenant = new Map<string, number>();
    const unbilledEncounters: Array<any> = [];
    for (const enc of raw.completedEncounters) {
      if (!billedEncounterIds.has(enc.id)) {
        unbilledByTenant.set(enc.tenantId, (unbilledByTenant.get(enc.tenantId) || 0) + 1);
        unbilledEncounters.push(enc);
      }
    }

    // Expired pharmacy batches with unsold stock
    const expiredLossByTenant = new Map<string, number>();
    const expiredBatches: Array<any> = [];
    for (const batch of raw.pharmacyBatches) {
      const isExp =
        String(batch.status || '').toUpperCase() === 'EXPIRED' ||
        (batch.expiryDate && new Date(batch.expiryDate).getTime() < now.getTime());
      if (isExp && (batch.availableQuantity || 0) > 0) {
        const loss = (batch.availableQuantity || 0) * num(batch.unitCost);
        expiredLossByTenant.set(batch.tenantId, (expiredLossByTenant.get(batch.tenantId) || 0) + loss);
        expiredBatches.push({ ...batch, expiryLossInr: round2(loss) });
      }
    }

    // Open alerts count by partner
    const openAlertsByPartner = new Map<string, number>();
    let openCritical = 0;
    let openHigh = 0;
    let openMedium = 0;
    let openLow = 0;
    let openEstLoss = 0;
    let openMonthlyBurn = 0;

    for (const al of raw.alerts) {
      if (al.status === 'OPEN') {
        if (al.partnerId) {
          openAlertsByPartner.set(al.partnerId, (openAlertsByPartner.get(al.partnerId) || 0) + 1);
        }
        const sev = String(al.severity || 'MEDIUM').toUpperCase();
        if (sev === 'CRITICAL') openCritical++;
        else if (sev === 'HIGH') openHigh++;
        else if (sev === 'LOW') openLow++;
        else openMedium++;
        openEstLoss += num(al.estimatedLossInr);
        openMonthlyBurn += num(al.monthlyBurnInr);
      }
    }

    // Per-Partner Unit Economics Leaderboard
    const partnerCount = Math.max(1, raw.partners.length);
    const sharedOpexPerPartner = sharedOpexPoolInr / partnerCount;

    let contractedMrrInr = 0;
    let subscriptionDiscountLossInr = 0;
    let paidPartners = 0;
    let freeTierPartners = 0;
    let lossMakingPartners = 0;
    let overduePartners = 0;

    const unitMarginLeaderboard: PartnerUnitEconomics[] = raw.partners.map((partner) => {
      const sub =
        raw.subscriptions.find((s) => s.partnerId === partner.id && s.status === 'ACTIVE') ||
        raw.subscriptions.find((s) => s.partnerId === partner.id);
      const lic =
        raw.licenses.find((l) => l.partnerId === partner.id && (l.status === 'ACTIVE' || l.status === 'FREE_ACTIVE')) ||
        raw.licenses.find((l) => l.partnerId === partner.id);
      const plan = sub ? planById.get(sub.planId) : lic ? planById.get(lic.planId) : undefined;

      const subPricing = sub ? computeSubscriptionMonthlyInr(sub, plan) : { monthlyInr: 0, annualDiscountLossInr: 0, customDiscountPct: 0 };
      const isFreeTier =
        subPricing.monthlyInr === 0 ||
        String(lic?.status || '').toUpperCase() === 'FREE_ACTIVE' ||
        String(plan?.code || '').includes('FREE');

      if (isFreeTier) freeTierPartners++;
      else paidPartners++;

      contractedMrrInr += subPricing.monthlyInr;
      subscriptionDiscountLossInr += subPricing.annualDiscountLossInr;

      const collected = round2(collectedByPartner.get(partner.id) || 0);
      const pending = round2(pendingByPartner.get(partner.id) || 0);
      const overdue = round2(overdueByPartner.get(partner.id) || 0);
      if (overdue > 0) overduePartners++;

      const cogs = round2(directCogsByPartner.get(partner.id) || 0);
      const directOpex = directOpexByPartner.get(partner.id) || 0;
      const opex = round2(directOpex + (raw.partners.length > 0 ? sharedOpexPerPartner : 0));
      const attributedCost = round2(cogs + opex);

      // Monthly recognized revenue for this tenant uses contracted MRR or collected share
      const tenantRev = subPricing.monthlyInr > 0 ? subPricing.monthlyInr : collected;
      const netMarginInr = round2(tenantRev - attributedCost);
      const grossMarginPercent = tenantRev > 0 ? round2(((tenantRev - cogs) / tenantRev) * 100) : attributedCost > 0 ? -100 : null;

      const clinGmv = round2(clinicalGmvByTenant.get(partner.tenantId) || 0);
      const clinColl = round2(clinicalCollectedByTenant.get(partner.tenantId) || 0);
      const clinDisc = round2(clinicalDiscountsByTenant.get(partner.tenantId) || 0);
      const clinRef = round2(clinicalRefundsByTenant.get(partner.tenantId) || 0);
      const refundRatePercent = clinGmv > 0 ? round2((clinRef / clinGmv) * 100) : 0;

      const isLoss =
        netMarginInr < 0 ||
        (grossMarginPercent !== null && grossMarginPercent < minMarginFloor) ||
        (isFreeTier && cogs > freeTierCogsCap);

      let riskStatus: PartnerUnitEconomics['riskStatus'] = 'PROFITABLE';
      if (isFreeTier && attributedCost > 0) {
        riskStatus = 'FREE_BURN';
        lossMakingPartners++;
      } else if (netMarginInr < 0) {
        riskStatus = 'LOSS_MAKING';
        lossMakingPartners++;
      } else if (grossMarginPercent !== null && grossMarginPercent < minMarginFloor) {
        riskStatus = 'THIN_MARGIN';
      }

      if (isLoss && riskStatus === 'PROFITABLE') {
        riskStatus = 'LOSS_MAKING';
        lossMakingPartners++;
      }

      return {
        partnerId: partner.id,
        tenantId: partner.tenantId,
        partnerName: partner.tradeName || partner.legalName,
        partnerType: partner.partnerType,
        lifecycleStatus: partner.lifecycleStatus,
        planCode: plan?.code || 'UNASSIGNED',
        planName: plan?.name || 'No Plan Assigned',
        licenseStatus: lic?.status || 'NONE',
        isFreeTier,
        contractedMrrInr: subPricing.monthlyInr,
        collectedRevenueInr: collected,
        pendingReceivableInr: pending,
        overdueReceivableInr: overdue,
        attributedCostInr: attributedCost,
        cogsInr: cogs,
        opexInr: opex,
        netMarginInr,
        grossMarginPercent,
        clinicalGmvInr: clinGmv,
        clinicalCollectedInr: clinColl,
        clinicalDiscountsInr: clinDisc,
        clinicalRefundsInr: clinRef,
        refundRatePercent,
        unbilledCompletedEncounters: unbilledByTenant.get(partner.tenantId) || 0,
        expiredBatchLossInr: round2(expiredLossByTenant.get(partner.tenantId) || 0),
        openAlertCount: openAlertsByPartner.get(partner.id) || 0,
        riskStatus
      };
    });

    // Sort worst margin / highest cash burn first so admins immediately act on bleeding tenants
    unitMarginLeaderboard.sort((a, b) => a.netMarginInr - b.netMarginInr);

    // Company Take-Rate on Clinical GMV (2.5% standard platform rail take-rate + Sec 194O 0.1% TDS)
    const platformTakeRateInr = round2(partnerClinicalGmvInr * 0.025);
    const tdsSection194OInr = round2(partnerClinicalGmvInr * 0.001);

    const totalRecognizedRevenueInr = round2(Math.max(totalCollectedCashInr, contractedMrrInr) + platformTakeRateInr);
    const totalCostInr = round2(totalCogsInr + totalOpexInr);
    const netProfitLossInr = round2(totalRecognizedRevenueInr - totalCostInr);
    const grossProfit = totalRecognizedRevenueInr - totalCogsInr;
    const grossMarginPercent =
      totalRecognizedRevenueInr > 0 ? round2((grossProfit / totalRecognizedRevenueInr) * 100) : 0;
    const ebitdaMarginPercent =
      totalRecognizedRevenueInr > 0 ? round2((netProfitLossInr / totalRecognizedRevenueInr) * 100) : 0;
    const monthlyBurnRateInr = netProfitLossInr < 0 ? round2(Math.abs(netProfitLossInr)) : 0;

    const totalDiscountWaiverLossInr = round2(subscriptionDiscountLossInr + clinicalDiscountLossInr);
    const unbilledLeakageEst = round2(unbilledEncounters.length * 750);
    const expiredWriteoffTotal = round2(expiredBatches.reduce((sum, b) => sum + num(b.expiryLossInr), 0));
    const totalDirectLeakageExposureInr = round2(
      totalOverdueReceivablesInr +
        totalDiscountWaiverLossInr +
        partnerClinicalRefundsInr +
        unbilledLeakageEst +
        expiredWriteoffTotal
    );

    const costBreakdown = ALL_COST_CATEGORIES.map((category) => {
      const b = costByCategory.get(category) || { amount: 0, count: 0 };
      return {
        category,
        isCogs: COGS_CATEGORIES.has(category),
        amountInr: round2(b.amount),
        entryCount: b.count
      };
    });

    const isEmptyDatabase =
      raw.partners.length === 0 &&
      raw.costLedger.length === 0 &&
      raw.companyInvoices.length === 0 &&
      raw.clinicalInvoices.length === 0;

    return {
      overview: {
        dataSource: 'live_postgresql',
        billingPeriod: activePeriod,
        isEmptyDatabase,
        pnl: {
          contractedMrrInr: round2(contractedMrrInr),
          contractedArrInr: round2(contractedMrrInr * 12),
          collectedCashInr: round2(totalCollectedCashInr),
          pendingReceivablesInr: round2(totalPendingReceivablesInr),
          overdueReceivablesInr: round2(totalOverdueReceivablesInr),
          discountWaiverLossInr: totalDiscountWaiverLossInr,
          partnerClinicalGmvInr: round2(partnerClinicalGmvInr),
          partnerClinicalCollectedInr: round2(partnerClinicalCollectedInr),
          partnerClinicalRefundsInr: round2(partnerClinicalRefundsInr),
          platformTakeRateInr,
          tdsSection194OInr,
          totalRecognizedRevenueInr,
          totalCogsInr: round2(totalCogsInr),
          totalOpexInr: round2(totalOpexInr),
          totalCostInr,
          netProfitLossInr,
          grossMarginPercent,
          ebitdaMarginPercent,
          monthlyBurnRateInr,
          totalDirectLeakageExposureInr
        },
        costBreakdown,
        partnerSummary: {
          totalPartners: raw.partners.length,
          paidPartners,
          freeTierPartners,
          lossMakingPartners,
          overduePartners
        },
        unitMarginLeaderboard,
        openAlertsSummary: {
          totalOpen: openCritical + openHigh + openMedium + openLow,
          critical: openCritical,
          high: openHigh,
          medium: openMedium,
          low: openLow,
          totalEstimatedLossInr: round2(openEstLoss),
          totalMonthlyBurnInr: round2(openMonthlyBurn)
        },
        activePolicy: raw.policy,
        generatedAt: now.toISOString()
      },
      unbilledEncounters,
      expiredBatches,
      overdueCompanyInvoices
    };
  }

  async getOverview(session: SessionContext, billingPeriod?: string): Promise<CompanyRiskOverview> {
    const raw = await riskManagementRepository.loadFullRiskSnapshot(session);
    return this.buildPartnerAnalytics(raw, billingPeriod).overview;
  }

  async recordCostEntry(
    input: {
      category: CostCategory;
      partnerId?: string | null | undefined;
      tenantId?: string | null | undefined;
      amountInr: number;
      billingPeriod?: string | undefined;
      source?: string | undefined;
      description?: string | undefined;
      metadata?: Record<string, any> | undefined;
    },
    session: SessionContext
  ): Promise<CompanyCostLedgerEntry> {
    if (!Number.isFinite(input.amountInr) || input.amountInr <= 0) {
      throw AppError.badRequest('Cost amountInr must be a finite positive number.');
    }

    const period = input.billingPeriod || getBillingPeriodKey(new Date());
    const created = await riskManagementRepository.insertCostEntry(
      {
        ...input,
        billingPeriod: period
      },
      session
    );

    await Promise.all([
      auditRepository.recordEvent(
        {
          eventType: 'COMPANY_COST_LEDGER_RECORDED',
          resourceType: 'company_cost_ledger',
          resourceId: created.id,
          tenantId: created.tenantId || session.tenantId,
          metadata: {
            category: created.category,
            partnerId: created.partnerId,
            amountInr: created.amountInr,
            billingPeriod: created.billingPeriod,
            source: created.source
          }
        },
        { ...session, branchId: undefined, tenantId: created.tenantId || session.tenantId }
      ),
      riskManagementRepository.recordCompanyAuditTrace(
        {
          action: 'COMPANY_COST_RECORDED',
          entityReference: `cost:${created.id}`,
          reason: `Recorded ₹${created.amountInr} under ${created.category} (${created.billingPeriod})`,
          metadata: { category: created.category, partnerId: created.partnerId, amountInr: created.amountInr }
        },
        session
      )
    ]);

    return created;
  }

  async listCostEntries(
    filters: { category?: string | undefined; billingPeriod?: string | undefined; partnerId?: string | undefined },
    session: SessionContext
  ) {
    return riskManagementRepository.listCostEntries(filters, session);
  }

  async runLeakageScan(session: SessionContext) {
    const raw = await riskManagementRepository.loadFullRiskSnapshot(session);
    const { overview, unbilledEncounters, expiredBatches, overdueCompanyInvoices } = this.buildPartnerAnalytics(raw);
    const policy = raw.policy;
    const minMargin = num(policy.minGrossMarginPercent);
    const maxDiscPct = num(policy.maxDiscountPercentWithoutCfo);
    const maxGraceDays = Number(policy.maxGraceDaysBeforeThrottle || 7);
    const freeTierCogsCap = num(policy.freeTierMonthlyCogsCapInr);
    const refundThresholdPct = num(policy.partnerRefundSpikeThresholdPercent);
    const nowMs = Date.now();

    const candidates: Array<{
      riskType: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      partnerId?: string | null | undefined;
      tenantId?: string | null | undefined;
      title: string;
      summary: string;
      estimatedLossInr: number;
      monthlyBurnInr: number;
      evidenceJson: Record<string, any>;
      preventionRuleCode?: string | undefined;
      fingerprint: string;
    }> = [];

    const partnerByTenant = new Map(raw.partners.map((p) => [p.tenantId, p]));
    const partnerById = new Map(raw.partners.map((p) => [p.id, p]));

    // 1 & 2: Negative Margin Tenants & Free-Tier COGS Burn
    for (const p of overview.unitMarginLeaderboard) {
      if (p.isFreeTier && p.cogsInr > freeTierCogsCap) {
        const burnOverCap = round2(p.cogsInr - freeTierCogsCap);
        candidates.push({
          riskType: 'FREE_TIER_COGS_BURN',
          severity: burnOverCap > freeTierCogsCap ? 'CRITICAL' : 'HIGH',
          partnerId: p.partnerId,
          tenantId: p.tenantId,
          title: `Free-Tier COGS Burn Cap Breached: ${p.partnerName}`,
          summary: `Partner "${p.partnerName}" (${p.planCode}) incurred ₹${p.cogsInr.toLocaleString('en-IN')} direct COGS vs configured free-tier monthly cap ₹${freeTierCogsCap.toLocaleString('en-IN')}.`,
          estimatedLossInr: round2(p.attributedCostInr),
          monthlyBurnInr: round2(p.attributedCostInr),
          evidenceJson: {
            planCode: p.planCode,
            cogsInr: p.cogsInr,
            freeTierCogsCapInr: freeTierCogsCap,
            attributedCostInr: p.attributedCostInr
          },
          preventionRuleCode: 'FREE_TIER_COGS_CAP',
          fingerprint: `FREE_TIER_COGS_BURN:${p.partnerId}`
        });
      } else if (p.netMarginInr < 0 || (p.grossMarginPercent !== null && p.grossMarginPercent < minMargin)) {
        const shortfall = Math.max(0, round2(-p.netMarginInr));
        candidates.push({
          riskType: 'NEGATIVE_MARGIN_TENANT',
          severity: p.netMarginInr < -5000 ? 'CRITICAL' : 'HIGH',
          partnerId: p.partnerId,
          tenantId: p.tenantId,
          title: `Negative/Sub-Floor Unit Margin: ${p.partnerName}`,
          summary: `Monthly revenue ₹${p.contractedMrrInr.toLocaleString('en-IN')} vs attributed cost ₹${p.attributedCostInr.toLocaleString('en-IN')} yields net margin ₹${p.netMarginInr.toLocaleString('en-IN')} (below ${minMargin}% floor).`,
          estimatedLossInr: shortfall,
          monthlyBurnInr: shortfall,
          evidenceJson: {
            contractedMrrInr: p.contractedMrrInr,
            cogsInr: p.cogsInr,
            opexInr: p.opexInr,
            netMarginInr: p.netMarginInr,
            grossMarginPercent: p.grossMarginPercent,
            minMarginFloorPercent: minMargin
          },
          preventionRuleCode: 'MIN_GROSS_MARGIN_FLOOR',
          fingerprint: `NEGATIVE_MARGIN_TENANT:${p.partnerId}`
        });
      }

      // 6. Refund / Void Spike
      if (p.clinicalGmvInr > 0 && p.refundRatePercent > refundThresholdPct) {
        candidates.push({
          riskType: 'HIGH_REFUND_VOID_SPIKE',
          severity: p.refundRatePercent >= 30 ? 'CRITICAL' : 'HIGH',
          partnerId: p.partnerId,
          tenantId: p.tenantId,
          title: `High Clinical Refund Spike (${p.refundRatePercent}%): ${p.partnerName}`,
          summary: `Partner issued ₹${p.clinicalRefundsInr.toLocaleString('en-IN')} in refunds against ₹${p.clinicalGmvInr.toLocaleString('en-IN')} billed (${p.refundRatePercent}% > ${refundThresholdPct}% threshold).`,
          estimatedLossInr: p.clinicalRefundsInr,
          monthlyBurnInr: 0,
          evidenceJson: {
            clinicalGmvInr: p.clinicalGmvInr,
            clinicalRefundsInr: p.clinicalRefundsInr,
            refundRatePercent: p.refundRatePercent,
            thresholdPercent: refundThresholdPct
          },
          preventionRuleCode: 'REFUND_SPIKE_THRESHOLD',
          fingerprint: `HIGH_REFUND_VOID_SPIKE:${p.partnerId}`
        });
      }
    }

    // 3. Overdue Receivables (Company B2B Invoices)
    for (const inv of overdueCompanyInvoices) {
      const p = inv.partnerId ? partnerById.get(inv.partnerId) : null;
      const daysPastDue = inv.dueDate ? Math.max(1, Math.floor((nowMs - new Date(inv.dueDate).getTime()) / 86400000)) : 1;
      candidates.push({
        riskType: 'OVERDUE_RECEIVABLE',
        severity: daysPastDue > 30 || inv.amountNum >= 50000 ? 'CRITICAL' : 'HIGH',
        partnerId: inv.partnerId,
        tenantId: p?.tenantId || null,
        title: `Overdue SaaS Invoice ${inv.invoiceNumber} (₹${inv.amountNum.toLocaleString('en-IN')})`,
        summary: `B2B Invoice ${inv.invoiceNumber} is ${daysPastDue} day(s) past due. Uncollected cash receivable increases DSO and bad-debt risk.`,
        estimatedLossInr: inv.amountNum,
        monthlyBurnInr: 0,
        evidenceJson: {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          daysPastDue,
          status: inv.status
        },
        preventionRuleCode: 'AUTO_THROTTLE_OVERDUE',
        fingerprint: `OVERDUE_RECEIVABLE:${inv.id}`
      });
    }

    // 4. Excessive Discounts (Subscriptions & Clinical Invoices)
    for (const sub of raw.subscriptions) {
      const plan = raw.plans.find((pl) => pl.id === sub.planId);
      const p = partnerById.get(sub.partnerId);
      const calc = computeSubscriptionMonthlyInr(sub, plan);
      const isNonPromoDiscount = !String(plan?.code || '').includes('FREE') && calc.customDiscountPct > maxDiscPct;
      if (isNonPromoDiscount) {
        candidates.push({
          riskType: 'EXCESSIVE_DISCOUNT',
          severity: calc.customDiscountPct >= 35 ? 'HIGH' : 'MEDIUM',
          partnerId: sub.partnerId,
          tenantId: p?.tenantId || null,
          title: `Subscription Discount Breach (${calc.customDiscountPct}%): ${p?.tradeName || sub.partnerId}`,
          summary: `Negotiated discount ${calc.customDiscountPct}% exceeds CFO guardrail limit (${maxDiscPct}%). Annual revenue leakage: ₹${calc.annualDiscountLossInr.toLocaleString('en-IN')}.`,
          estimatedLossInr: calc.annualDiscountLossInr,
          monthlyBurnInr: round2(calc.annualDiscountLossInr / 12),
          evidenceJson: {
            subscriptionId: sub.id,
            planCode: plan?.code,
            discountPercent: calc.customDiscountPct,
            maxAllowedWithoutCfo: maxDiscPct,
            annualDiscountLossInr: calc.annualDiscountLossInr
          },
          preventionRuleCode: 'MAX_DISCOUNT_CFO_GUARDRAIL',
          fingerprint: `EXCESSIVE_DISCOUNT_SUB:${sub.id}`
        });
      }
    }

    for (const disc of raw.clinicalDiscounts) {
      const inv = raw.clinicalInvoices.find((i) => i.id === disc.invoiceId);
      const subtotal = inv ? num(inv.subtotal) : 0;
      const pct =
        String(disc.discountType || '').toUpperCase() === 'PERCENTAGE'
          ? num(disc.discountValue)
          : subtotal > 0
            ? round2((num(disc.discountAmount) / subtotal) * 100)
            : 0;

      if (pct > maxDiscPct) {
        const p = partnerByTenant.get(disc.tenantId);
        candidates.push({
          riskType: 'EXCESSIVE_DISCOUNT',
          severity: pct >= 40 ? 'HIGH' : 'MEDIUM',
          partnerId: disc.partnerId || p?.id || null,
          tenantId: disc.tenantId,
          title: `Excessive Clinical Invoice Discount (${pct}%)`,
          summary: `Invoice discount ₹${num(disc.discountAmount).toLocaleString('en-IN')} (${pct}%) exceeded threshold ${maxDiscPct}%. Approved by: ${disc.approvedBy}.`,
          estimatedLossInr: num(disc.discountAmount),
          monthlyBurnInr: 0,
          evidenceJson: {
            discountId: disc.id,
            invoiceId: disc.invoiceId,
            discountAmountInr: num(disc.discountAmount),
            discountPercent: pct,
            approvedBy: disc.approvedBy,
            reason: disc.reason
          },
          preventionRuleCode: 'MAX_DISCOUNT_CFO_GUARDRAIL',
          fingerprint: `EXCESSIVE_DISCOUNT_CLIN:${disc.id}`
        });
      }
    }

    // 5. Unbilled Completed Clinical Encounters
    const unbilledByPartnerMap = new Map<string, { partnerId: string | null; tenantId: string; count: number; sampleIds: string[] }>();
    for (const enc of unbilledEncounters) {
      const resolvedPid =
        enc.partnerId && partnerById.has(enc.partnerId)
          ? enc.partnerId
          : partnerByTenant.get(enc.tenantId)?.id || null;
      const bucket = unbilledByPartnerMap.get(enc.tenantId) || {
        partnerId: resolvedPid,
        tenantId: enc.tenantId,
        count: 0,
        sampleIds: [] as string[]
      };
      bucket.count += 1;
      if (bucket.sampleIds.length < 10) bucket.sampleIds.push(enc.encounterNumber || enc.id);
      unbilledByPartnerMap.set(enc.tenantId, bucket);
    }

    for (const [tenantId, grp] of unbilledByPartnerMap.entries()) {
      const p = partnerByTenant.get(tenantId);
      const estLoss = round2(grp.count * 750);
      candidates.push({
        riskType: 'UNBILLED_CLINICAL_ENCOUNTER',
        severity: grp.count >= 5 ? 'HIGH' : 'MEDIUM',
        partnerId: grp.partnerId,
        tenantId,
        title: `${grp.count} Completed Encounter(s) Missing Billing Invoice`,
        summary: `${p?.tradeName || tenantId} has ${grp.count} COMPLETED clinical encounter(s) without an associated invoice in clinical.billing_invoices.`,
        estimatedLossInr: estLoss,
        monthlyBurnInr: 0,
        evidenceJson: {
          unbilledCount: grp.count,
          estimatedAvgConsultFeeInr: 750,
          sampleEncounters: grp.sampleIds
        },
        preventionRuleCode: 'ENCOUNTER_BILLING_COMPLETENESS',
        fingerprint: `UNBILLED_ENCOUNTER:${tenantId}`
      });
    }

    // 7. License / Grace Expiry & Churn Risk & Quota Overruns
    for (const lic of raw.licenses) {
      const p = partnerById.get(lic.partnerId);
      const expMs = lic.expiryDate ? new Date(lic.expiryDate).getTime() : nowMs;
      const graceMs = lic.gracePeriodEnd ? new Date(lic.gracePeriodEnd).getTime() : expMs;
      const daysPastExpiry = Math.floor((nowMs - expMs) / 86400000);
      const daysToExpiry = Math.ceil((expMs - nowMs) / 86400000);

      if (
        (lic.status === 'GRACE_PERIOD' && daysPastExpiry > maxGraceDays) ||
        (nowMs > expMs && nowMs < graceMs && daysPastExpiry > maxGraceDays)
      ) {
        candidates.push({
          riskType: 'OVERDUE_RECEIVABLE',
          severity: 'CRITICAL',
          partnerId: lic.partnerId,
          tenantId: lic.tenantId,
          title: `Grace Period Exceeded ${maxGraceDays}d SLA: ${p?.tradeName || lic.licenseKey}`,
          summary: `License ${lic.licenseKey} has operated ${daysPastExpiry}d past expiry (policy cap: ${maxGraceDays}d). Eligible for automated grace revocation.`,
          estimatedLossInr: 2500,
          monthlyBurnInr: 2500,
          evidenceJson: {
            licenseId: lic.id,
            licenseKey: lic.licenseKey,
            daysPastExpiry,
            maxGraceDaysBeforeThrottle: maxGraceDays
          },
          preventionRuleCode: 'MAX_GRACE_PERIOD_SLA',
          fingerprint: `GRACE_SLA_BREACH:${lic.id}`
        });
      } else if (daysToExpiry > 0 && daysToExpiry <= 15 && lic.status !== 'SUSPENDED' && lic.status !== 'REVOKED') {
        candidates.push({
          riskType: 'CHURN_RISK',
          severity: daysToExpiry <= 5 ? 'HIGH' : 'MEDIUM',
          partnerId: lic.partnerId,
          tenantId: lic.tenantId,
          title: `Renewal Window / Churn Risk (${daysToExpiry}d left): ${p?.tradeName || lic.licenseKey}`,
          summary: `License ${lic.licenseKey} expires in ${daysToExpiry} day(s) on ${new Date(expMs).toISOString().slice(0, 10)}.`,
          estimatedLossInr: 2000,
          monthlyBurnInr: 0,
          evidenceJson: {
            licenseId: lic.id,
            licenseKey: lic.licenseKey,
            daysToExpiry,
            expiryDate: lic.expiryDate
          },
          preventionRuleCode: 'RENEWAL_CHURN_WATCH',
          fingerprint: `CHURN_EXPIRY:${lic.id}`
        });
      }
    }

    // 8. Pharmacy Expired Inventory Write-Offs
    const expByTenant = new Map<string, { partnerId: string | null; loss: number; batchCount: number; samples: string[] }>();
    for (const batch of expiredBatches) {
      const resolvedBatchPid =
        batch.partnerId && partnerById.has(batch.partnerId)
          ? batch.partnerId
          : partnerByTenant.get(batch.tenantId)?.id || null;
      const bucket = expByTenant.get(batch.tenantId) || {
        partnerId: resolvedBatchPid,
        loss: 0,
        batchCount: 0,
        samples: [] as string[]
      };
      bucket.loss += num(batch.expiryLossInr);
      bucket.batchCount += 1;
      if (bucket.samples.length < 5) bucket.samples.push(batch.batchNumber);
      expByTenant.set(batch.tenantId, bucket);
    }

    for (const [tenantId, grp] of expByTenant.entries()) {
      candidates.push({
        riskType: 'EXPIRY_WRITEOFF',
        severity: grp.loss >= 10000 ? 'HIGH' : 'MEDIUM',
        partnerId: grp.partnerId,
        tenantId,
        title: `Expired Pharmacy Stock Write-Off Risk (${grp.batchCount} batch(es))`,
        summary: `${grp.batchCount} expired pharmacy batch(es) still carry unsold cost value ₹${round2(grp.loss).toLocaleString('en-IN')}.`,
        estimatedLossInr: round2(grp.loss),
        monthlyBurnInr: 0,
        evidenceJson: {
          expiredBatchCount: grp.batchCount,
          stockValueLossInr: round2(grp.loss),
          sampleBatches: grp.samples
        },
        preventionRuleCode: 'FEFO_EXPIRY_CONTROL',
        fingerprint: `EXPIRY_WRITEOFF:${tenantId}`
      });
    }

    const persisted = await riskManagementRepository.upsertAlerts(candidates, session);

    await Promise.all([
      auditRepository.recordEvent(
        {
          eventType: 'RISK_LEAKAGE_SCAN_COMPLETED',
          resourceType: 'risk_leakage_alerts',
          resourceId: 'company-risk-scan',
          tenantId: session.tenantId,
          metadata: {
            candidatesDetected: candidates.length,
            insertedCount: persisted.insertedCount,
            updatedCount: persisted.updatedCount
          }
        },
        { ...session, branchId: undefined }
      ),
      riskManagementRepository.recordCompanyAuditTrace(
        {
          action: 'RISK_LEAKAGE_SCAN_EXECUTED',
          entityReference: 'risk-management:scan',
          reason: `Executed live SQL risk scan: ${candidates.length} signals detected (${persisted.insertedCount} new, ${persisted.updatedCount} updated OPEN)`,
          metadata: {
            candidatesDetected: candidates.length,
            insertedCount: persisted.insertedCount,
            updatedCount: persisted.updatedCount
          }
        },
        session
      )
    ]);

    return {
      scannedAt: new Date().toISOString(),
      candidatesDetected: candidates.length,
      insertedCount: persisted.insertedCount,
      updatedCount: persisted.updatedCount,
      totalAlerts: persisted.alerts.length,
      openAlerts: persisted.alerts.filter((a) => a.status === 'OPEN').length,
      alerts: persisted.alerts
    };
  }

  async listAlerts(
    filters: { status?: string | undefined; severity?: string | undefined; riskType?: string | undefined; partnerId?: string | undefined },
    session: SessionContext
  ): Promise<RiskLeakageAlert[]> {
    return riskManagementRepository.listAlerts(filters, session);
  }

  async mitigateAlert(
    alertId: string,
    input: { action: MitigationAction; notes?: string | undefined },
    session: SessionContext
  ): Promise<{ alert: RiskLeakageAlert; executionDetails: Record<string, any> }> {
    const existing = await riskManagementRepository.findAlertById(alertId, session);
    if (!existing) {
      throw AppError.notFound(`Risk alert ${alertId} not found`);
    }

    const actor = session.actorEmail || session.userId || 'COMPANY_RISK_ADMIN';
    const notes = input.notes || `Containment executed via Risk Management Engine: ${input.action}`;
    const executionDetails: Record<string, any> = { action: input.action, partnerId: existing.partnerId };

    let nextStatus: 'CONTAINED' | 'RESOLVED' | 'DISMISSED' = 'CONTAINED';

    if (input.action === 'CONTAIN_BILLING_FREEZE') {
      if (!existing.partnerId) {
        throw AppError.badRequest('Cannot engage BILLING_FREEZE on an alert without a target partnerId.');
      }
      const ks = await partnerGovernanceService.triggerKillSwitch(
        existing.partnerId,
        'BILLING_FREEZE',
        true,
        notes,
        actor
      );
      executionDetails['killSwitches'] = ks;
    } else if (input.action === 'CONTAIN_THROTTLE_QUOTA') {
      if (!existing.partnerId) {
        throw AppError.badRequest('Cannot throttle partner quotas on an alert without a target partnerId.');
      }
      const policy = await riskManagementRepository.ensureActivePolicy(session);
      const quotas = await partnerGovernanceService.updateQuotas(
        existing.partnerId,
        { monthlyWhatsAppCredits: 0, storageQuotaGb: 1 },
        `Risk containment throttle: ${notes}`,
        actor
      );
      await usageQuotaThrottlerService.updateQuotaLimits({
        partnerId: existing.partnerId,
        whatsappLimit: 0,
        aiScribeLimitMinutes: 0,
        isUnlimitedVip: false
      });
      executionDetails['throttledQuotas'] = quotas;
      executionDetails['freeTierCogsCapInr'] = num(policy.freeTierMonthlyCogsCapInr);
    } else if (input.action === 'REVOKE_OVERDUE_GRACE') {
      if (!existing.partnerId) {
        throw AppError.badRequest('Cannot revoke grace license without a target partnerId.');
      }
      const suspendedCount = await riskManagementRepository.suspendOverdueLicensesForPartner(
        existing.partnerId,
        `Risk Engine grace revocation: ${notes}`,
        session
      );
      executionDetails['suspendedLicensesCount'] = suspendedCount;
    } else if (input.action === 'ISSUE_RECOVERY_NOTICE') {
      executionDetails['recoveryNoticeLogged'] = true;
      executionDetails['noticeChannel'] = 'AUDIT_AND_ADMIN_NOTICE';
    } else if (input.action === 'MARK_RESOLVED') {
      nextStatus = 'RESOLVED';
    } else if (input.action === 'DISMISS') {
      nextStatus = 'DISMISSED';
    }

    const updatedAlert = await riskManagementRepository.markAlertMitigated(
      alertId,
      {
        status: nextStatus,
        mitigationAction: input.action,
        mitigationNotes: notes
      },
      session
    );

    await Promise.all([
      auditRepository.recordEvent(
        {
          eventType: 'RISK_LEAKAGE_CONTAINMENT_EXECUTED',
          resourceType: 'risk_leakage_alert',
          resourceId: updatedAlert.id,
          tenantId: existing.tenantId || session.tenantId,
          metadata: {
            riskType: existing.riskType,
            action: input.action,
            status: nextStatus,
            partnerId: existing.partnerId,
            estimatedLossInr: existing.estimatedLossInr,
            executionDetails
          }
        },
        { ...session, branchId: undefined, tenantId: existing.tenantId || session.tenantId }
      ),
      riskManagementRepository.recordCompanyAuditTrace(
        {
          action: `RISK_MITIGATION_${input.action}`,
          entityReference: `risk_alert:${updatedAlert.id}`,
          reason: notes,
          metadata: { partnerId: existing.partnerId, riskType: existing.riskType, executionDetails }
        },
        session
      )
    ]);

    logger.warn(`Risk alert ${alertId} (${existing.riskType}) transitioned to ${nextStatus} via ${input.action}`);
    return { alert: updatedAlert, executionDetails };
  }

  async getPolicy(session?: SessionContext): Promise<RiskPreventionPolicy> {
    return riskManagementRepository.ensureActivePolicy(session);
  }

  async updatePolicy(
    input: {
      policyName?: string | undefined;
      minGrossMarginPercent?: number | undefined;
      maxDiscountPercentWithoutCfo?: number | undefined;
      maxGraceDaysBeforeThrottle?: number | undefined;
      freeTierMonthlyCogsCapInr?: number | undefined;
      partnerRefundSpikeThresholdPercent?: number | undefined;
      autoThrottleUnpaidOverdue?: boolean | undefined;
      autoBlockBelowMarginFloor?: boolean | undefined;
      isActive?: boolean | undefined;
    },
    session: SessionContext
  ): Promise<RiskPreventionPolicy> {
    const updated = await riskManagementRepository.updatePolicy(input, session);

    await Promise.all([
      auditRepository.recordEvent(
        {
          eventType: 'RISK_PREVENTION_POLICY_UPDATED',
          resourceType: 'risk_prevention_policies',
          resourceId: updated.id,
          tenantId: session.tenantId,
          metadata: {
            minGrossMarginPercent: updated.minGrossMarginPercent,
            maxDiscountPercentWithoutCfo: updated.maxDiscountPercentWithoutCfo,
            freeTierMonthlyCogsCapInr: updated.freeTierMonthlyCogsCapInr,
            maxGraceDaysBeforeThrottle: updated.maxGraceDaysBeforeThrottle,
            autoBlockBelowMarginFloor: updated.autoBlockBelowMarginFloor,
            autoThrottleUnpaidOverdue: updated.autoThrottleUnpaidOverdue
          }
        },
        { ...session, branchId: undefined }
      ),
      riskManagementRepository.recordCompanyAuditTrace(
        {
          action: 'RISK_PREVENTION_POLICY_UPDATED',
          entityReference: `risk_policy:${updated.policyCode}`,
          reason: `Updated prevention guardrails: maxDiscount=${updated.maxDiscountPercentWithoutCfo}%, minMargin=${updated.minGrossMarginPercent}%`,
          metadata: input
        },
        session
      )
    ]);

    return updated;
  }

  /**
   * Real-time circuit breaker called by deal-desk negotiations to prevent margin-negative discounting
   * unless explicitly authorized by CHIEF_FINANCIAL_OFFICER / SUPER_ADMIN with CFO override approval.
   */
  async enforceDealDiscountGuardrail(params: {
    totalGrossInr: number;
    finalPayableInr: number;
    cfoOverrideApproved?: boolean | undefined;
    session: SessionContext;
  }): Promise<void> {
    const policy = await riskManagementRepository.ensureActivePolicy(params.session);
    if (!policy.isActive || !policy.autoBlockBelowMarginFloor) {
      return;
    }

    if (params.totalGrossInr <= 0) {
      return;
    }

    const effectiveDiscountPercent = round2(
      ((params.totalGrossInr - params.finalPayableInr) / params.totalGrossInr) * 100
    );
    const effectiveRetainedPercent = round2((params.finalPayableInr / params.totalGrossInr) * 100);
    const maxAllowedPct = num(policy.maxDiscountPercentWithoutCfo);
    const minMarginPct = num(policy.minGrossMarginPercent);

    const callerRoles = (params.session.roles || []).map((r) => String(r).toUpperCase());
    const hasCfoAuthority =
      Boolean(params.session.isSuperAdmin) ||
      callerRoles.includes('CHIEF_FINANCIAL_OFFICER') ||
      callerRoles.includes('SUPER_ADMIN');

    if (effectiveDiscountPercent > maxAllowedPct && (!hasCfoAuthority || params.cfoOverrideApproved !== true)) {
      if (effectiveRetainedPercent < minMarginPct && !params.cfoOverrideApproved) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          statusCode: 403,
          message: `RISK_CIRCUIT_BREAKER: Deal discount (${effectiveDiscountPercent}%) breaches CFO discount cap (${maxAllowedPct}%) and drops realized price below ${minMarginPct}% margin floor.`
        });
      }
      if (!hasCfoAuthority || params.cfoOverrideApproved === false) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          statusCode: 403,
          message: `RISK_CIRCUIT_BREAKER: Discount (${effectiveDiscountPercent}%) exceeds ${maxAllowedPct}% limit and requires explicit CFO / Super Admin override.`
        });
      }
    }
  }
}

export const companyRiskEconomicsService = new CompanyRiskEconomicsService();
