import { type FastifyPluginAsync } from 'fastify';
import { emergencyManagementService } from '../../services/partner/EmergencyManagementService.js';
import { authenticate, requirePermission } from '../../plugins/auth-guard.js';
import {
  type EmergencyRegistrationInput,
  type EmergencyTriageInput,
  type EmergencyTreatmentInput,
  type EmergencyDispositionInput
} from '../../repositories/partner/EmergencyManagementRepository.js';

export const emergencyManagementRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Emergency Work Queue
  fastify.get(
    '/api/v1/partner/emergency/queue',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'read')]
    },
    async (request) => {
      const query = request.query as { status?: string; priority?: string };
      const data = await emergencyManagementService.getQueue(request.session, query?.status, query?.priority);
      return { success: true, data };
    }
  );

  // 2. Emergency Registration
  fastify.post(
    '/api/v1/partner/emergency/registrations',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const payload = request.body as Omit<EmergencyRegistrationInput, 'tenantId'>;
      const data = await emergencyManagementService.registerEmergencyPatient(payload, request.session);
      reply.status(201);
      return { success: true, data };
    }
  );

  // 3. Record Triage Assessment
  fastify.post(
    '/api/v1/partner/emergency/encounters/:id/triage',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<EmergencyTriageInput, 'tenantId' | 'encounterId' | 'triageNurseId'>;
      const data = await emergencyManagementService.recordTriage({
        ...payload,
        encounterId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ENCOUNTER_NOT_FOUND', message: 'Emergency encounter not found' } };
      }
      return { success: true, data };
    }
  );

  // 4. Record Emergency Treatment & Orders
  fastify.post(
    '/api/v1/partner/emergency/encounters/:id/treatments',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'create')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<EmergencyTreatmentInput, 'tenantId' | 'encounterId' | 'clinicianId'>;
      const data = await emergencyManagementService.recordTreatment({
        ...payload,
        encounterId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ENCOUNTER_NOT_FOUND', message: 'Emergency encounter not found' } };
      }
      return { success: true, data };
    }
  );

  // 5. Emergency Disposition
  fastify.post(
    '/api/v1/partner/emergency/encounters/:id/disposition',
    {
      preHandler: [authenticate, requirePermission('clinical:encounters', 'update')]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<EmergencyDispositionInput, 'tenantId' | 'encounterId' | 'clinicianId'>;
      const data = await emergencyManagementService.recordDisposition({
        ...payload,
        encounterId: id
      }, request.session);
      if (!data) {
        reply.status(404);
        return { success: false, error: { code: 'ENCOUNTER_NOT_FOUND', message: 'Emergency encounter not found' } };
      }
      return { success: true, data };
    }
  );

  // 6. Patient Emergency History
  fastify.get(
    '/api/v1/partner/patients/:id/emergency-history',
    {
      preHandler: [authenticate, requirePermission('clinical:patients', 'read')]
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await emergencyManagementService.getPatientEmergencyHistory(request.session, id);
      return { success: true, data };
    }
  );
};
