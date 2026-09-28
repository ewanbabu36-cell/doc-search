import {
  commandCenterRepository,
  type DateRange
} from '../../repositories/partner/CommandCenterRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { wholesaleInvoiceIngestionService } from './WholesaleInvoiceIngestionService.js';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

const logger = createLogger('command-center-service');

export interface CommandCenterQueryOptions {
  period?: string;
  customStart?: string;
  customEnd?: string;
  branchId?: string;
  departmentId?: string;
}

export class CommandCenterService {
  private validateSession(session: SessionContext): string {
    if (!session || !session.tenantId) {
      throw new AppError({
        message: 'Unauthorized: Valid tenant session required for Command Center',
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED
      });
    }
    return session.tenantId;
  }

  private resolveRange(options: CommandCenterQueryOptions = {}): DateRange {
    return commandCenterRepository.resolveDateRange(
      options.period,
      options.customStart,
      options.customEnd
    );
  }

  // 1. Unified Executive Overview
  async getExecutiveOverview(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);

    logger.info('Fetching Executive Command Center Overview', { tenantId, period: range.periodName });

    const [overview, wholesale] = await Promise.all([
      commandCenterRepository.getExecutiveOverview(tenantId, range),
      this.getWholesaleAnalytics(session).catch(err => {
        logger.warn('Wholesale analytics non-blocking fetch failed', { error: String(err) });
        return null;
      })
    ]);

    try {
      await auditRepository.recordEvent({
        tenantId,
        eventType: 'COMMAND_CENTER_EXECUTIVE_VIEW',
        resourceType: 'ANALYTICS_DASHBOARD',
        resourceId: tenantId,
        metadata: { period: range.periodName }
      }, session);
    } catch (e) {
      logger.warn('Audit logging failed non-blockingly', { error: String(e) });
    }

    return {
      ...overview,
      wholesale: wholesale?.kpi || null
    };
  }

  // 2. Patient Volume & Encounters Analytics
  async getPatientAnalytics(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getPatientAnalytics(tenantId, range);
  }

  // 3. Outpatient (OPD) Analytics
  async getOpdAnalytics(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getOpdAnalytics(tenantId, range);
  }

  // 4. Inpatient (IPD) Analytics
  async getIpdAnalytics(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getIpdAnalytics(tenantId, range);
  }

  // 5. Lab / Pathology (LIMS) Analytics
  async getLabAnalytics(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getLabAnalytics(tenantId, range);
  }

  // 6. Radiology (RIS/PACS) Analytics
  async getRadiologyAnalytics(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getRadiologyAnalytics(tenantId, range);
  }

  // 7. Pharmacy Analytics
  async getPharmacyAnalytics(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getPharmacyAnalytics(tenantId, range);
  }

  // 8. Financial & Billing Analytics
  async getRevenueAnalytics(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getRevenueAnalytics(tenantId, range);
  }

  // 9. Supply Chain & Inventory Analytics
  async getInventoryAnalytics(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getInventoryAnalytics(tenantId, range);
  }

  // 10. Unified Cross-Department Pending Work Queue
  async getUnifiedPendingQueue(session: SessionContext) {
    const tenantId = this.validateSession(session);
    return commandCenterRepository.getUnifiedPendingQueue(tenantId);
  }

  // 11. Real-Time Operational SLAs & Escalations
  async getRealTimeSlas(session: SessionContext) {
    const tenantId = this.validateSession(session);
    return commandCenterRepository.getRealTimeSlas(tenantId);
  }

  // 12. Staff Productivity & Clinical Workload
  async getStaffWorkload(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getStaffWorkload(tenantId, range);
  }

  // 13. Wholesale Pharmacy Analytics (B2B)
  async getWholesaleAnalytics(session: SessionContext) {
    const tenantId = this.validateSession(session);
    logger.debug('Fetching wholesale analytics', { tenantId });

    let customers: any[] = [];
    let salesOrders: any[] = [];

    try {
      customers = await wholesaleInvoiceIngestionService.getWholesaleCustomers(session);
    } catch (err) {
      logger.warn('Failed to retrieve wholesale customers', { error: String(err) });
    }

    try {
      salesOrders = await wholesaleInvoiceIngestionService.getWholesaleSalesOrders(session);
    } catch (err) {
      logger.warn('Failed to retrieve wholesale sales orders', { error: String(err) });
    }

    const totalOrders = salesOrders.length;
    let totalWholesaleRevenue = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;

    for (const order of salesOrders) {
      const amount = Number(order.totalAmount || order.finalAmount || 0);
      totalWholesaleRevenue += amount;
      const status = (order.status || 'PENDING').toUpperCase();
      if (status === 'PAID' || status === 'COMPLETED') {
        paidOrdersCount++;
      } else {
        pendingOrdersCount++;
      }
    }

    const avgOrderValue = totalOrders > 0
      ? Number((totalWholesaleRevenue / totalOrders).toFixed(2))
      : 0;

    return {
      kpi: {
        totalWholesaleCustomers: customers.length,
        totalWholesaleSalesOrders: totalOrders,
        totalWholesaleRevenue,
        paidOrdersCount,
        pendingOrdersCount,
        avgOrderValue
      },
      recentOrders: salesOrders.slice(0, 10),
      dataQuality: totalOrders > 0 || customers.length > 0 ? 'LIVE_DATABASE' : 'NO_DATA'
    };
  }

  // 14. AI Telemetry & Usage Analytics
  async getAiTelemetry(session: SessionContext, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    return commandCenterRepository.getAiTelemetry(tenantId, range);
  }

  // 15. Partner License & Subscription Status
  async getLicenseStatus(session: SessionContext) {
    const tenantId = this.validateSession(session);
    return commandCenterRepository.getLicenseStatus(tenantId);
  }

  // 16. Governed CSV Export
  async exportAnalyticsCsv(session: SessionContext, category: string, options: CommandCenterQueryOptions = {}) {
    const tenantId = this.validateSession(session);
    const range = this.resolveRange(options);
    const cat = (category || 'OVERVIEW').toUpperCase();

    let data: any = null;
    if (cat === 'OVERVIEW') {
      data = await this.getExecutiveOverview(session, options);
    } else if (cat === 'PATIENTS') {
      data = await this.getPatientAnalytics(session, options);
    } else if (cat === 'OPD') {
      data = await this.getOpdAnalytics(session, options);
    } else if (cat === 'IPD') {
      data = await this.getIpdAnalytics(session, options);
    } else if (cat === 'LAB') {
      data = await this.getLabAnalytics(session, options);
    } else if (cat === 'RADIOLOGY') {
      data = await this.getRadiologyAnalytics(session, options);
    } else if (cat === 'PHARMACY') {
      data = await this.getPharmacyAnalytics(session, options);
    } else if (cat === 'REVENUE') {
      data = await this.getRevenueAnalytics(session, options);
    } else if (cat === 'INVENTORY') {
      data = await this.getInventoryAnalytics(session, options);
    } else {
      data = await this.getExecutiveOverview(session, options);
    }

    try {
      await auditRepository.recordEvent({
        tenantId,
        eventType: 'COMMAND_CENTER_EXPORT',
        resourceType: 'ANALYTICS_CSV_EXPORT',
        resourceId: tenantId,
        metadata: { category: cat, period: range.periodName }
      }, session);
    } catch (e) {
      logger.warn('Export audit event logging failed non-blockingly', { error: String(e) });
    }

    return commandCenterRepository.generateCsvExport(cat, data);
  }
}

export const commandCenterService = new CommandCenterService();
