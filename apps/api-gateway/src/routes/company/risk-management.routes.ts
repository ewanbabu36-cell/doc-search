import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { authenticate, requireRoles } from '../../plugins/auth-guard.js';
import { companyRiskEconomicsService } from '../../services/company/CompanyRiskEconomicsService.js';

const RISK_HQ_ROLES = [
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'FINANCE_MANAGER',
  'CHIEF_FINANCIAL_OFFICER'
] as const;

const CostEntrySchema = z.object({
  category: z.enum([
    'CLOUD_INFRA',
    'AI_INFERENCE',
    'SMS_WHATSAPP',
    'GATEWAY_MDR',
    'PAYROLL_SUPPORT',
    'MARKETING_CAC',
    'REFUND_WRITEOFF'
  ]),
  partnerId: z.string().uuid().optional().nullable(),
  tenantId: z.string().uuid().optional().nullable(),
  amountInr: z.number().positive(),
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/, 'billingPeriod must use YYYY-MM format').optional(),
  source: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  metadata: z.record(z.unknown()).optional()
});

const MitigateAlertSchema = z.object({
  action: z.enum([
    'CONTAIN_BILLING_FREEZE',
    'CONTAIN_THROTTLE_QUOTA',
    'REVOKE_OVERDUE_GRACE',
    'ISSUE_RECOVERY_NOTICE',
    'MARK_RESOLVED',
    'DISMISS'
  ]),
  notes: z.string().trim().max(1000).optional()
});

const UpdatePolicySchema = z.object({
  policyName: z.string().trim().min(3).max(200).optional(),
  minGrossMarginPercent: z.number().min(0).max(95).optional(),
  maxDiscountPercentWithoutCfo: z.number().min(0).max(95).optional(),
  maxGraceDaysBeforeThrottle: z.number().int().min(0).max(90).optional(),
  freeTierMonthlyCogsCapInr: z.number().min(0).max(10000000).optional(),
  partnerRefundSpikeThresholdPercent: z.number().min(1).max(100).optional(),
  autoThrottleUnpaidOverdue: z.boolean().optional(),
  autoBlockBelowMarginFloor: z.boolean().optional(),
  isActive: z.boolean().optional()
});

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '),
      statusCode: 400
    });
  }
  return parsed.data;
}

const PLATFORM_HQ_TENANT_IDS = new Set([
  '00000000-0000-4000-8000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-a000-000000000001'
]);

async function requireCompanyHqScope(request: any): Promise<void> {
  const s = request.session;
  if (!s) {
    throw AppError.unauthorized('Authentication required', ErrorCode.UNAUTHORIZED);
  }
  const roles = (s.roles || []).map((r: string) => String(r).toUpperCase());
  const isHq =
    Boolean(s.isSuperAdmin) ||
    roles.includes('SUPER_ADMIN') ||
    roles.includes('COMPANY_ADMIN') ||
    ((roles.includes('FINANCE_MANAGER') || roles.includes('CHIEF_FINANCIAL_OFFICER')) &&
      PLATFORM_HQ_TENANT_IDS.has(String(s.tenantId || '').toLowerCase()));
  if (!isHq) {
    throw AppError.forbidden(
      'Platform Company HQ executive scope is required to access Risk Management & Company Economics.',
      ErrorCode.FORBIDDEN
    );
  }
}

export const riskManagementRoutes: FastifyPluginAsync = async (app) => {
  const hqGuard = [authenticate, requireRoles(...RISK_HQ_ROLES), requireCompanyHqScope];

  app.get('/api/v1/company/risk-management/overview', { preHandler: hqGuard }, async (request, reply) => {
    const q = (request.query || {}) as { period?: string };
    const overview = await companyRiskEconomicsService.getOverview(request.session, q.period);
    return reply.send({ success: true, data: overview });
  });

  app.get('/api/v1/company/risk-management/costs', { preHandler: hqGuard }, async (request, reply) => {
    const q = (request.query || {}) as { category?: string; billingPeriod?: string; partnerId?: string };
    const rows = await companyRiskEconomicsService.listCostEntries(q, request.session);
    return reply.send({ success: true, data: rows });
  });

  app.post('/api/v1/company/risk-management/costs', { preHandler: hqGuard }, async (request, reply) => {
    const body = parseOrThrow(CostEntrySchema, request.body || {});
    const created = await companyRiskEconomicsService.recordCostEntry(body, request.session);
    return reply.status(201).send({ success: true, data: created });
  });

  app.post('/api/v1/company/risk-management/scan', { preHandler: hqGuard }, async (request, reply) => {
    const scanResult = await companyRiskEconomicsService.runLeakageScan(request.session);
    return reply.send({ success: true, data: scanResult });
  });

  app.get('/api/v1/company/risk-management/alerts', { preHandler: hqGuard }, async (request, reply) => {
    const q = (request.query || {}) as {
      status?: string;
      severity?: string;
      riskType?: string;
      partnerId?: string;
    };
    const alerts = await companyRiskEconomicsService.listAlerts(q, request.session);
    return reply.send({ success: true, data: alerts });
  });

  app.post('/api/v1/company/risk-management/alerts/:id/mitigate', { preHandler: hqGuard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseOrThrow(MitigateAlertSchema, request.body || {});
    const result = await companyRiskEconomicsService.mitigateAlert(id, body, request.session);
    return reply.send({ success: true, data: result });
  });

  app.get('/api/v1/company/risk-management/policies', { preHandler: hqGuard }, async (request, reply) => {
    const policy = await companyRiskEconomicsService.getPolicy(request.session);
    return reply.send({ success: true, data: policy });
  });

  app.put('/api/v1/company/risk-management/policies', { preHandler: hqGuard }, async (request, reply) => {
    const body = parseOrThrow(UpdatePolicySchema, request.body || {});
    const updated = await companyRiskEconomicsService.updatePolicy(body, request.session);
    return reply.send({ success: true, data: updated });
  });
};
