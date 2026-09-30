import { type FastifyPluginAsync } from 'fastify';
import { hqCommandCenterService, type HqQueryOptions } from '../../services/company/HqCommandCenterService.js';
import { authenticate, requireRoles } from '../../plugins/auth-guard.js';

export const hqCommandCenterRoutes: FastifyPluginAsync = async (fastify) => {
  const hqAdminGuard = [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')];

  // Overview Handler
  const handleOverview = async (request: any) => {
    const query = request.query as HqQueryOptions;
    const data = await hqCommandCenterService.getExecutiveHqOverview(request.session, query);
    return { success: true, data };
  };

  // Partners Lifecycle Handler
  const handlePartners = async (request: any) => {
    const query = request.query as HqQueryOptions;
    const data = await hqCommandCenterService.getPartnerLifecycleAnalytics(request.session, query);
    return { success: true, data };
  };

  // Licensing & Subscriptions Handler
  const handleLicenses = async (request: any) => {
    const query = request.query as HqQueryOptions;
    const data = await hqCommandCenterService.getLicensingSubscriptionAnalytics(request.session, query);
    return { success: true, data };
  };

  // HQ Financial Handler
  const handleRevenue = async (request: any) => {
    const query = request.query as HqQueryOptions;
    const data = await hqCommandCenterService.getHqFinancialAnalytics(request.session, query);
    return { success: true, data };
  };

  // Platform Clinical Throughput Handler
  const handleThroughput = async (request: any) => {
    const query = request.query as HqQueryOptions;
    const data = await hqCommandCenterService.getPlatformCrossTenantClinicalThroughput(request.session, query);
    return { success: true, data };
  };

  // Security Governance Telemetry Handler
  const handleSecurity = async (request: any) => {
    const query = request.query as HqQueryOptions;
    const data = await hqCommandCenterService.getSecurityGovernanceTelemetry(request.session, query);
    return { success: true, data };
  };

  // Operational Health Handler
  const handleHealth = async (request: any) => {
    const data = await hqCommandCenterService.getPlatformOperationalHealth(request.session);
    return { success: true, data };
  };

  // HQ CSV Export Handler
  const handleExport = async (request: any, reply: any) => {
    const query = request.query as HqQueryOptions & { category?: string };
    const category = (query.category || 'REVENUE').toUpperCase();
    const csv = await hqCommandCenterService.exportHqCsv(request.session, category, query);
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="hq_${category.toLowerCase()}_export.csv"`);
    return reply.send(csv);
  };

  // -------------------------------------------------------------------------
  // Primary Routes: /api/v1/hq/command-center/*
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/hq/command-center/overview', { preHandler: hqAdminGuard }, handleOverview);
  fastify.get('/api/v1/hq/command-center/partners', { preHandler: hqAdminGuard }, handlePartners);
  fastify.get('/api/v1/hq/command-center/licenses', { preHandler: hqAdminGuard }, handleLicenses);
  fastify.get('/api/v1/hq/command-center/revenue', { preHandler: hqAdminGuard }, handleRevenue);
  fastify.get('/api/v1/hq/command-center/throughput', { preHandler: hqAdminGuard }, handleThroughput);
  fastify.get('/api/v1/hq/command-center/security', { preHandler: hqAdminGuard }, handleSecurity);
  fastify.get('/api/v1/hq/command-center/health', { preHandler: hqAdminGuard }, handleHealth);
  fastify.get('/api/v1/hq/command-center/export', { preHandler: hqAdminGuard }, handleExport);

  // -------------------------------------------------------------------------
  // Path Aliases: /api/v1/company/command-center/* & /api/v1/hq/analytics/*
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/company/command-center/overview', { preHandler: hqAdminGuard }, handleOverview);
  fastify.get('/api/v1/company/command-center/partners', { preHandler: hqAdminGuard }, handlePartners);
  fastify.get('/api/v1/company/command-center/licenses', { preHandler: hqAdminGuard }, handleLicenses);
  fastify.get('/api/v1/company/command-center/revenue', { preHandler: hqAdminGuard }, handleRevenue);
  fastify.get('/api/v1/company/command-center/throughput', { preHandler: hqAdminGuard }, handleThroughput);
  fastify.get('/api/v1/company/command-center/security', { preHandler: hqAdminGuard }, handleSecurity);
  fastify.get('/api/v1/company/command-center/health', { preHandler: hqAdminGuard }, handleHealth);
  fastify.get('/api/v1/company/command-center/export', { preHandler: hqAdminGuard }, handleExport);

  fastify.get('/api/v1/hq/analytics/overview', { preHandler: hqAdminGuard }, handleOverview);
  fastify.get('/api/v1/hq/analytics/partners', { preHandler: hqAdminGuard }, handlePartners);
  fastify.get('/api/v1/hq/analytics/licenses', { preHandler: hqAdminGuard }, handleLicenses);
  fastify.get('/api/v1/hq/analytics/revenue', { preHandler: hqAdminGuard }, handleRevenue);
  fastify.get('/api/v1/hq/analytics/throughput', { preHandler: hqAdminGuard }, handleThroughput);
  fastify.get('/api/v1/hq/analytics/security', { preHandler: hqAdminGuard }, handleSecurity);
  fastify.get('/api/v1/hq/analytics/health', { preHandler: hqAdminGuard }, handleHealth);
  fastify.get('/api/v1/hq/analytics/export', { preHandler: hqAdminGuard }, handleExport);
};
