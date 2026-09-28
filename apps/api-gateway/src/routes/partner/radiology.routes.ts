import { type FastifyPluginAsync } from 'fastify';
import { radiologyService } from '../../services/partner/RadiologyService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import { requireModuleCommercialAccess } from '../../plugins/commercial-guard.js';
import type { RadiologyInputRecord } from '../../services/partner/RadiologyService.js';

export const radiologyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireModuleCommercialAccess('RADIOLOGY_PACS'));

  // 1. Overview & Analytics
  fastify.get(
    '/api/v1/partner/radiology/overview',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getOverviewMetrics(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/analytics',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getAnalytics(request.session);
      return { success: true, data };
    }
  );

  // 2. Department, Modalities & Procedures
  fastify.get(
    '/api/v1/partner/radiology/department',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getDepartment(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/department',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const dept = await radiologyService.createDepartment(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: dept, ...dept });
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/modalities',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getModalities(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/modalities',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const modality = await radiologyService.createModality(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: modality, ...modality });
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/procedures',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getProcedures(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/procedures',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const proc = await radiologyService.createProcedure(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: proc, ...proc });
    }
  );

  // 3. Orders
  fastify.get(
    '/api/v1/partner/radiology/orders',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const query = request.query as { branchId?: string; status?: string; priority?: string; limit?: number; offset?: number };
      const res = await radiologyService.getOrders(query, request.session);
      return { success: true, data: res.items, items: res.items, total: res.total };
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/orders/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const order = await radiologyService.getOrderById(id, request.session);
      return reply.send({ success: true, data: order, ...order });
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/orders',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const order = await radiologyService.createOrder(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: order, ...order });
    }
  );

  fastify.patch(
    '/api/v1/partner/radiology/orders/:id/status',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { fromStatus, toStatus } = request.body as { fromStatus: string; toStatus: string };
      const updated = await radiologyService.updateOrderStatus(id, fromStatus, toStatus, request.session);
      return reply.send({ success: true, data: updated, ...updated });
    }
  );

  // 4. Appointments & Scheduling
  fastify.get(
    '/api/v1/partner/radiology/appointments',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const { branchId } = request.query as { branchId?: string };
      const data = await radiologyService.getAppointments(request.session, branchId);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/appointments',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const app = await radiologyService.scheduleAppointment(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: app, ...app });
    }
  );

  fastify.patch(
    '/api/v1/partner/radiology/appointments/:id/reschedule',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const app = await radiologyService.rescheduleAppointment(id, request.body as RadiologyInputRecord, request.session);
      return reply.send({ success: true, data: app, ...app });
    }
  );

  fastify.patch(
    '/api/v1/partner/radiology/appointments/:id/cancel',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const app = await radiologyService.cancelAppointment(id, request.body as RadiologyInputRecord, request.session);
      return reply.send({ success: true, data: app, ...app });
    }
  );

  // 5. Preparation Records
  fastify.get(
    '/api/v1/partner/radiology/preparation-records',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getPreparationRecords(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/preparation-records',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const prep = await radiologyService.recordPreparation(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: prep, ...prep });
    }
  );

  // 6. Studies & Accessions
  fastify.get(
    '/api/v1/partner/radiology/studies',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getStudies(request.session);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/studies/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const study = await radiologyService.getStudyById(id, request.session);
      return reply.send({ success: true, data: study, ...study });
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/studies',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const study = await radiologyService.completeStudyAcquisition(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: study, ...study });
    }
  );

  // 6.1 DICOM Series
  fastify.get(
    '/api/v1/partner/radiology/studies/:studyId/series',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const { studyId } = request.params as { studyId: string };
      const data = await radiologyService.getSeriesByStudy(studyId, request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/series',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const series = await radiologyService.createSeries(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: series, ...series });
    }
  );

  // 6.2 DICOM Instances
  fastify.get(
    '/api/v1/partner/radiology/series/:seriesId/instances',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const { seriesId } = request.params as { seriesId: string };
      const data = await radiologyService.getInstancesBySeries(seriesId, request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/instances',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const instance = await radiologyService.createInstance(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: instance, ...instance });
    }
  );

  // 7. Reports
  fastify.get(
    '/api/v1/partner/radiology/reports',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const { studyId } = request.query as { studyId?: string };
      const data = await radiologyService.getReports(request.session, studyId);
      return { success: true, data };
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/reports/:id',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const report = await radiologyService.getReportById(id, request.session);
      return reply.send({ success: true, data: report, ...report });
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/reports/:id/amendments',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await radiologyService.getReportAmendments(id, request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/reports',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const report = await radiologyService.createReportDraft(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: report, ...report });
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/reports/:id/finalize',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const report = await radiologyService.finalizeReport(id, request.body as RadiologyInputRecord, request.session);
      return reply.send({ success: true, data: report, ...report });
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/reports/:id/amend',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const report = await radiologyService.amendReport(id, request.body as RadiologyInputRecord, request.session);
      return reply.send({ success: true, data: report, ...report });
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/reports/:id/review',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const report = await radiologyService.reviewReport(id, (request.body || {}) as RadiologyInputRecord, request.session);
      return reply.send({ success: true, data: report, ...report });
    }
  );

  // 7.1 Radiology Procedure Billing (P1-03)
  fastify.post(
    '/api/v1/partner/radiology/orders/:id/bill',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const billing = await radiologyService.billRadiologyOrder(id, (request.body || {}) as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: billing, ...billing });
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/orders/:id/invoice',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const billing = await radiologyService.getOrderInvoice(id, request.session);
      return reply.send({ success: true, data: billing, ...billing });
    }
  );

  // 8. Critical Findings
  fastify.get(
    '/api/v1/partner/radiology/critical-findings',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getCriticalFindings(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/critical-findings',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const finding = await radiologyService.recordCriticalFinding(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: finding, ...finding });
    }
  );

  fastify.patch(
    '/api/v1/partner/radiology/critical-findings/:id/acknowledge',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const finding = await radiologyService.acknowledgeCriticalFinding(id, request.body as RadiologyInputRecord, request.session);
      return reply.send({ success: true, data: finding, ...finding });
    }
  );

  // 9. Quality Events & Audit Traces
  fastify.get(
    '/api/v1/partner/radiology/quality-events',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getQualityEvents(request.session);
      return { success: true, data };
    }
  );

  fastify.post(
    '/api/v1/partner/radiology/quality-events',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'create')]
    },
    async (request, reply) => {
      const event = await radiologyService.recordQualityEvent(request.body as RadiologyInputRecord, request.session);
      return reply.status(201).send({ success: true, data: event, ...event });
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/audit-traces',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const data = await radiologyService.getAuditTraces(request.session);
      return { success: true, data };
    }
  );
};
