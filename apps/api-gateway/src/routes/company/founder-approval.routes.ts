import { type FastifyPluginAsync } from 'fastify';
import { founderApprovalService } from '../../services/company/FounderApprovalService.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { AppError } from '@docsearch/shared-core';

export const founderApprovalRoutes: FastifyPluginAsync = async (fastify) => {
  const founderAdminGuard = async (request: any) => {
    const session = request.session;
    const isFounder = Boolean(
      session?.isSuperAdmin ||
      session?.roles?.some((r: string) => ['SUPER_ADMIN', 'SUPER_ADMIN_FOUNDER', 'FOUNDER'].includes(r)) ||
      session?.actorEmail === 'founder@docsearch.health' ||
      session?.actorEmail === 'meraj@docsearch.health'
    );
    if (!isFounder) {
      throw AppError.forbidden('Access Denied: Only Founder / Super Admin has authority to approve or reject requests.');
    }
  };

  // Handler 1: List approval requests
  const handleGetApprovals = async (request: any) => {
    const query = request.query as { status?: string };
    const data = await founderApprovalService.getApprovals(request.session, query?.status);
    return { success: true, data };
  };

  // Handler 2: Submit any form for Founder approval
  const handleSubmitForm = async (request: any, reply: any) => {
    const body = request.body as {
      entityType: string;
      taskTitle: string;
      payloadData: Record<string, unknown>;
      submitterName?: string;
    };

    const result = await founderApprovalService.submitForm(body, request.session);
    reply.status(201);
    return { success: true, data: result };
  };

  // Handler 3: Founder approves request (Only Founder MERAJ SHARIF)
  const handleApprove = async (request: any) => {
    const { id } = request.params as { id: string };
    const body = (request.body as { remarks?: string }) || {};
    const result = await founderApprovalService.approveRequest(id, request.session, body.remarks);
    return result;
  };

  // Handler 4: Founder rejects request (Only Founder MERAJ SHARIF)
  const handleReject = async (request: any) => {
    const { id } = request.params as { id: string };
    const body = (request.body as { remarks: string }) || { remarks: 'Rejected by Founder' };
    const result = await founderApprovalService.rejectRequest(id, request.session, body.remarks);
    return result;
  };

  // 1. Company platform routes
  fastify.get('/api/v1/company/approvals', { preHandler: [authenticate] }, handleGetApprovals);
  fastify.post('/api/v1/company/approvals/submit', { preHandler: [authenticate] }, handleSubmitForm);
  fastify.post('/api/v1/company/approvals/:id/approve', { preHandler: [authenticate, founderAdminGuard] }, handleApprove);
  fastify.post('/api/v1/company/approvals/:id/reject', { preHandler: [authenticate, founderAdminGuard] }, handleReject);

  // 2. Partner platform routes
  fastify.get('/api/v1/partner/approvals', { preHandler: [authenticate] }, handleGetApprovals);
  fastify.post('/api/v1/partner/approvals/submit', { preHandler: [authenticate] }, handleSubmitForm);
  fastify.post('/api/v1/partner/approvals/:id/approve', { preHandler: [authenticate, founderAdminGuard] }, handleApprove);
  fastify.post('/api/v1/partner/approvals/:id/reject', { preHandler: [authenticate, founderAdminGuard] }, handleReject);

  // 3. Universal cross-platform routes
  fastify.get('/api/v1/approvals', { preHandler: [authenticate] }, handleGetApprovals);
  fastify.post('/api/v1/approvals/submit', { preHandler: [authenticate] }, handleSubmitForm);
  fastify.post('/api/v1/approvals/:id/approve', { preHandler: [authenticate, founderAdminGuard] }, handleApprove);
  fastify.post('/api/v1/approvals/:id/reject', { preHandler: [authenticate, founderAdminGuard] }, handleReject);
};
