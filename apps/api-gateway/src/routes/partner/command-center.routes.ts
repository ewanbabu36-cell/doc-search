import { type FastifyPluginAsync } from 'fastify';
import { commandCenterService, type CommandCenterQueryOptions } from '../../services/partner/CommandCenterService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const partnerCommandCenterRoutes: FastifyPluginAsync = async (fastify) => {
  // Common handler for Overview
  const handleOverview = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getExecutiveOverview(request.session, query);
    return { success: true, data };
  };

  // Common handler for Patients
  const handlePatients = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getPatientAnalytics(request.session, query);
    return { success: true, data };
  };

  // Common handler for OPD
  const handleOpd = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getOpdAnalytics(request.session, query);
    return { success: true, data };
  };

  // Common handler for IPD
  const handleIpd = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getIpdAnalytics(request.session, query);
    return { success: true, data };
  };

  // Common handler for Lab
  const handleLab = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getLabAnalytics(request.session, query);
    return { success: true, data };
  };

  // Common handler for Radiology
  const handleRadiology = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getRadiologyAnalytics(request.session, query);
    return { success: true, data };
  };

  // Common handler for Pharmacy
  const handlePharmacy = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getPharmacyAnalytics(request.session, query);
    return { success: true, data };
  };

  // Common handler for Revenue
  const handleRevenue = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getRevenueAnalytics(request.session, query);
    return { success: true, data };
  };

  // Common handler for Inventory
  const handleInventory = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getInventoryAnalytics(request.session, query);
    return { success: true, data };
  };

  // Common handler for Unified Pending Queue
  const handlePendingQueue = async (request: any) => {
    const data = await commandCenterService.getUnifiedPendingQueue(request.session);
    return { success: true, data };
  };

  // Common handler for Real-time SLAs
  const handleSlas = async (request: any) => {
    const data = await commandCenterService.getRealTimeSlas(request.session);
    return { success: true, data };
  };

  // Common handler for Staff Workload
  const handleStaffWorkload = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getStaffWorkload(request.session, query);
    return { success: true, data };
  };

  // Common handler for Wholesale
  const handleWholesale = async (request: any) => {
    const data = await commandCenterService.getWholesaleAnalytics(request.session);
    return { success: true, data };
  };

  // Common handler for AI Telemetry
  const handleAiTelemetry = async (request: any) => {
    const query = request.query as CommandCenterQueryOptions;
    const data = await commandCenterService.getAiTelemetry(request.session, query);
    return { success: true, data };
  };

  // Common handler for License Status
  const handleLicense = async (request: any) => {
    const data = await commandCenterService.getLicenseStatus(request.session);
    return { success: true, data };
  };

  // Common handler for Governed CSV Export
  const handleExport = async (request: any, reply: any) => {
    const query = request.query as CommandCenterQueryOptions & { category?: string };
    const category = (query.category || 'OVERVIEW').toUpperCase();
    const csv = await commandCenterService.exportAnalyticsCsv(request.session, category, query);
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="partner_${category.toLowerCase()}_export.csv"`);
    return reply.send(csv);
  };

  // -------------------------------------------------------------------------
  // Primary Routes: /api/v1/partner/command-center/*
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/partner/command-center/overview', { preHandler: [authenticate] }, handleOverview);
  fastify.get('/api/v1/partner/command-center/patients', { preHandler: [authenticate] }, handlePatients);
  fastify.get('/api/v1/partner/command-center/opd', { preHandler: [authenticate] }, handleOpd);
  fastify.get('/api/v1/partner/command-center/ipd', { preHandler: [authenticate] }, handleIpd);
  fastify.get('/api/v1/partner/command-center/lab', { preHandler: [authenticate] }, handleLab);
  fastify.get('/api/v1/partner/command-center/radiology', { preHandler: [authenticate] }, handleRadiology);
  fastify.get('/api/v1/partner/command-center/pharmacy', { preHandler: [authenticate] }, handlePharmacy);
  fastify.get('/api/v1/partner/command-center/revenue', { preHandler: [authenticate] }, handleRevenue);
  fastify.get('/api/v1/partner/command-center/inventory', { preHandler: [authenticate] }, handleInventory);
  fastify.get('/api/v1/partner/command-center/pending-queue', { preHandler: [authenticate] }, handlePendingQueue);
  fastify.get('/api/v1/partner/command-center/slas', { preHandler: [authenticate] }, handleSlas);
  fastify.get('/api/v1/partner/command-center/staff-workload', { preHandler: [authenticate] }, handleStaffWorkload);
  fastify.get('/api/v1/partner/command-center/wholesale', { preHandler: [authenticate] }, handleWholesale);
  fastify.get('/api/v1/partner/command-center/ai-telemetry', { preHandler: [authenticate] }, handleAiTelemetry);
  fastify.get('/api/v1/partner/command-center/license', { preHandler: [authenticate] }, handleLicense);
  fastify.get('/api/v1/partner/command-center/export', { preHandler: [authenticate] }, handleExport);

  // -------------------------------------------------------------------------
  // Path Aliases: /api/v1/partner/analytics/*
  // -------------------------------------------------------------------------
  fastify.get('/api/v1/partner/analytics/overview', { preHandler: [authenticate] }, handleOverview);
  fastify.get('/api/v1/partner/analytics/patients', { preHandler: [authenticate] }, handlePatients);
  fastify.get('/api/v1/partner/analytics/opd', { preHandler: [authenticate] }, handleOpd);
  fastify.get('/api/v1/partner/analytics/ipd', { preHandler: [authenticate] }, handleIpd);
  fastify.get('/api/v1/partner/analytics/lab', { preHandler: [authenticate] }, handleLab);
  fastify.get('/api/v1/partner/analytics/radiology', { preHandler: [authenticate] }, handleRadiology);
  fastify.get('/api/v1/partner/analytics/pharmacy', { preHandler: [authenticate] }, handlePharmacy);
  fastify.get('/api/v1/partner/analytics/revenue', { preHandler: [authenticate] }, handleRevenue);
  fastify.get('/api/v1/partner/analytics/inventory', { preHandler: [authenticate] }, handleInventory);
  fastify.get('/api/v1/partner/analytics/pending-queue', { preHandler: [authenticate] }, handlePendingQueue);
  fastify.get('/api/v1/partner/analytics/slas', { preHandler: [authenticate] }, handleSlas);
  fastify.get('/api/v1/partner/analytics/staff-workload', { preHandler: [authenticate] }, handleStaffWorkload);
  fastify.get('/api/v1/partner/analytics/wholesale', { preHandler: [authenticate] }, handleWholesale);
  fastify.get('/api/v1/partner/analytics/ai-telemetry', { preHandler: [authenticate] }, handleAiTelemetry);
  fastify.get('/api/v1/partner/analytics/license', { preHandler: [authenticate] }, handleLicense);
  fastify.get('/api/v1/partner/analytics/export', { preHandler: [authenticate] }, handleExport);
};
