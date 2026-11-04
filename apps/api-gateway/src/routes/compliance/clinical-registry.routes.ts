import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { nmcPhysicianVerificationService } from '../../services/compliance/NmcPhysicianVerificationService.js';
import { clinicalOrderSetPublisherService } from '../../services/compliance/ClinicalOrderSetPublisherService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const clinicalRegistryRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Verify Physician by NMC Registration Number
  fastify.get('/api/v1/compliance/nmc/verify/:regNumber', { preHandler: [authenticate] }, async (request) => {
    const params = request.params as { regNumber: string };
    const query = (request.query as Record<string, string>) || {};
    const result = nmcPhysicianVerificationService.verifyPhysician(params.regNumber, query['stateCouncil']);
    return {
      success: result.found,
      data: result
    };
  });

  // 2. List Verified Physicians
  fastify.get('/api/v1/compliance/nmc/physicians', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as Record<string, string>) || {};
    const list = nmcPhysicianVerificationService.listPhysicians(query['status']);
    return {
      success: true,
      data: list
    };
  });

  // 3. Register New Doctor Verification Record
  const RegisterPhysicianSchema = z.object({
    registrationNumber: z.string(),
    stateMedicalCouncil: z.enum([
      'NMC_CENTRAL',
      'DMC_DELHI',
      'KMC_KARNATAKA',
      'MMC_MAHARASHTRA',
      'TNMC_TAMIL_NADU',
      'WBMC_WEST_BENGAL'
    ]),
    doctorFullName: z.string(),
    fatherName: z.string(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    dateOfBirth: z.string(),
    yearOfRegistration: z.number(),
    primaryQualification: z.string(),
    primaryUniversity: z.string(),
    primaryPassingYear: z.number(),
    associatedHospital: z.string().optional()
  });

  fastify.post('/api/v1/compliance/nmc/register', { preHandler: [authenticate] }, async (request) => {
    const parsed = RegisterPhysicianSchema.parse(request.body || {});
    const record = nmcPhysicianVerificationService.registerDoctorVerification(parsed);
    return {
      success: true,
      data: record
    };
  });

  // 4. List Clinical Order Sets
  fastify.get('/api/v1/compliance/order-sets', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as Record<string, string>) || {};
    const sets = clinicalOrderSetPublisherService.listOrderSets(query['domain'] || query['status']);
    return {
      success: true,
      data: sets
    };
  });

  // 5. Publish & Sign-Off Clinical Order Set
  const PublishSchema = z.object({
    id: z.string(),
    approvedBy: z.string(),
    designation: z.string()
  });

  fastify.post('/api/v1/compliance/order-sets/publish', { preHandler: [authenticate] }, async (request) => {
    const parsed = PublishSchema.parse(request.body || {});
    const result = clinicalOrderSetPublisherService.publishAndSignoffOrderSet({
      id: parsed.id,
      approvedBy: parsed.approvedBy,
      designation: parsed.designation
    });
    return {
      success: result.success,
      data: result
    };
  });

  // 6. Broadcast Order Set to Network EMR Nodes
  const BroadcastSchema = z.object({
    id: z.string()
  });

  fastify.post('/api/v1/compliance/order-sets/broadcast', { preHandler: [authenticate] }, async (request) => {
    const parsed = BroadcastSchema.parse(request.body || {});
    const result = clinicalOrderSetPublisherService.broadcastToTenants(parsed.id);
    return {
      success: result.success,
      data: result
    };
  });
};
