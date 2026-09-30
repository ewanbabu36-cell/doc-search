import {
  hqCommandCenterRepository,
  type DateRange
} from '../../repositories/company/HqCommandCenterRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

const logger = createLogger('hq-command-center-service');

export interface HqQueryOptions {
  period?: string;
  customStart?: string;
  customEnd?: string;
}

export class HqCommandCenterService {
  private validateHqSession(session: SessionContext): void {
    if (!session || !session.userId) {
      throw new AppError({
        message: 'Unauthorized: Authentication required for HQ Command Center',
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED
      });
    }

    // Role check: Ensure user possesses company / HQ administrative or auditor authorization
    const userRoles = (session.roles || []).map(r => r.toUpperCase());
    const authorizedRoles = [
      'COMPANY_ADMIN',
      'COMPANY_STAFF',
      'FOUNDER',
      'CHIEF_MEDICAL_OFFICER',
      'OPERATIONS_DIRECTOR',
      'AUDITOR',
      'SUPER_ADMIN',
      'ADMIN'
    ];

    const hasHqRole = userRoles.some(r => authorizedRoles.includes(r)) || session.permissions?.some(p => p.startsWith('hq:') || p.startsWith('company:'));
    if (!hasHqRole) {
      logger.warn('Forbidden access attempt to HQ Command Center', {
        userId: session.userId,
        roles: session.roles
      });
      throw new AppError({
        message: 'Forbidden: Insufficient privileges for HQ Governance and Analytics Command Center',
        statusCode: 403,
        code: ErrorCode.FORBIDDEN
      });
    }
  }

  private resolveRange(options: HqQueryOptions = {}): DateRange {
    return hqCommandCenterRepository.resolveDateRange(
      options.period,
      options.customStart,
      options.customEnd
    );
  }

  async getExecutiveHqOverview(session: SessionContext, options: HqQueryOptions = {}) {
    this.validateHqSession(session);
    const range = this.resolveRange(options);

    logger.info('Fetching HQ Command Center Executive Overview', {
      actorId: session.userId,
      period: range.periodName
    });

    const overview = await hqCommandCenterRepository.getExecutiveHqOverview(range);

    try {
      await auditRepository.recordEvent({
        tenantId: session.tenantId || '00000000-0000-0000-0000-000000000000',
        eventType: 'HQ_COMMAND_CENTER_VIEW',
        resourceType: 'HQ_EXECUTIVE_DASHBOARD',
        resourceId: 'hq-master',
        metadata: { period: range.periodName }
      }, session);
    } catch (e) {
      logger.warn('HQ audit log non-blocking failure', { error: String(e) });
    }

    return overview;
  }

  async getPartnerLifecycleAnalytics(session: SessionContext, options: HqQueryOptions = {}) {
    this.validateHqSession(session);
    const range = this.resolveRange(options);
    return hqCommandCenterRepository.getPartnerLifecycleAnalytics(range);
  }

  async getLicensingSubscriptionAnalytics(session: SessionContext, options: HqQueryOptions = {}) {
    this.validateHqSession(session);
    const range = this.resolveRange(options);
    return hqCommandCenterRepository.getLicensingSubscriptionAnalytics(range);
  }

  async getHqFinancialAnalytics(session: SessionContext, options: HqQueryOptions = {}) {
    this.validateHqSession(session);
    const range = this.resolveRange(options);
    return hqCommandCenterRepository.getHqFinancialAnalytics(range);
  }

  async getPlatformCrossTenantClinicalThroughput(session: SessionContext, options: HqQueryOptions = {}) {
    this.validateHqSession(session);
    const range = this.resolveRange(options);
    return hqCommandCenterRepository.getPlatformCrossTenantClinicalThroughput(range);
  }

  async getSecurityGovernanceTelemetry(session: SessionContext, options: HqQueryOptions = {}) {
    this.validateHqSession(session);
    const range = this.resolveRange(options);
    return hqCommandCenterRepository.getSecurityGovernanceTelemetry(range);
  }

  async getPlatformOperationalHealth(session: SessionContext) {
    this.validateHqSession(session);
    return hqCommandCenterRepository.getPlatformOperationalHealth();
  }

  async exportHqCsv(session: SessionContext, category: string, options: HqQueryOptions = {}) {
    this.validateHqSession(session);
    const range = this.resolveRange(options);
    const cat = (category || 'REVENUE').toUpperCase();

    const rows: string[][] = [];
    if (cat === 'PARTNERS') {
      const data = await this.getPartnerLifecycleAnalytics(session, options);
      rows.push(['Metric', 'Value']);
      rows.push(['Total Partners', String(data.kpi.totalPartners)]);
      rows.push(['Active Partners', String(data.kpi.activePartners)]);
      rows.push(['Onboarding Partners', String(data.kpi.onboardingPartners)]);
      rows.push(['Suspended Partners', String(data.kpi.suspendedPartners)]);
      rows.push(['Pending Review Registrations', String(data.kpi.pendingReviewCount)]);
    } else if (cat === 'LICENSES') {
      const data = await this.getLicensingSubscriptionAnalytics(session, options);
      rows.push(['Metric', 'Value']);
      rows.push(['Total Subscriptions', String(data.kpi.totalSubscriptions)]);
      rows.push(['Active Licenses', String(data.kpi.activeLicenses)]);
      rows.push(['Expiring In 30 Days', String(data.kpi.expiringIn30Days)]);
      rows.push(['Expired Licenses', String(data.kpi.expiredLicenses)]);
    } else {
      const data = await this.getHqFinancialAnalytics(session, options);
      rows.push(['Metric', 'Value (INR)']);
      rows.push(['Total Net Revenue', String(data.kpi.totalNetRevenue)]);
      rows.push(['Total Gross Revenue', String(data.kpi.totalGrossRevenue)]);
      rows.push(['Total Tax Amount', String(data.kpi.totalTaxAmount)]);
      rows.push(['Pending Receivables', String(data.kpi.totalPendingReceivables)]);
    }

    try {
      await auditRepository.recordEvent({
        tenantId: session.tenantId || '00000000-0000-0000-0000-000000000000',
        eventType: 'HQ_COMMAND_CENTER_EXPORT',
        resourceType: 'HQ_CSV_EXPORT',
        resourceId: 'hq-master',
        metadata: { category: cat, period: range.periodName }
      }, session);
    } catch (e) {
      logger.warn('HQ export audit log non-blocking failure', { error: String(e) });
    }

    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }
}

export const hqCommandCenterService = new HqCommandCenterService();
