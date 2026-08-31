import { type FastifyPluginAsync } from 'fastify';
import { radiologyService } from '../../services/partner/RadiologyService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import type { RadiologyInputRecord } from '../../services/partner/RadiologyService.js';

export const radiologyRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Overview & Analytics
  fastify.get(
    '/api/v1/partner/radiology/overview',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      return radiologyService.getOverviewMetrics(request.session);
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/analytics',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      return radiologyService.getAnalytics(request.session);
    }
  );

  // 2. Department, Modalities & Procedures
  fastify.get(
    '/api/v1/partner/radiology/department',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      return radiologyService.getDepartment(request.session);
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/modalities',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      return radiologyService.getModalities(request.session);
    }
  );

  fastify.get(
    '/api/v1/partner/radiology/procedures',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      return radiologyService.getProcedures(request.session);
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
      return radiologyService.getAppointments(request.session, branchId);
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
      return radiologyService.getPreparationRecords(request.session);
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
      return radiologyService.getStudies(request.session);
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

  // 7. Reports
  fastify.get(
    '/api/v1/partner/radiology/reports',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      const { studyId } = request.query as { studyId?: string };
      return radiologyService.getReports(request.session, studyId);
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

  // 8. Critical Findings
  fastify.get(
    '/api/v1/partner/radiology/critical-findings',
    {
      preHandler: [authenticate, requirePermission('clinical:radiology', 'read')]
    },
    async (request) => {
      return radiologyService.getCriticalFindings(request.session);
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
      return radiologyService.getQualityEvents(request.session);
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
      return radiologyService.getAuditTraces(request.session);
    }
  );
};
