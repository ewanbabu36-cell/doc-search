import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { multiFacilityBedTelemetryService } from '../../services/executive/MultiFacilityBedTelemetryService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const bedTelemetryRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Pan-India Network Bed Census
  fastify.get('/api/v1/executive/beds/network-census', { preHandler: [authenticate] }, async () => {
    return {
      success: true,
      data: multiFacilityBedTelemetryService.getNetworkCensus()
    };
  });

  // 2. List Inter-Facility Transfers
  fastify.get('/api/v1/executive/beds/transfers', { preHandler: [authenticate] }, async (request) => {
    const query = (request.query as Record<string, string>) || {};
    const status = query['status'];
    return {
      success: true,
      data: multiFacilityBedTelemetryService.listTransfers(status)
    };
  });

  // 3. Dispatch Inter-Facility Transfer & Lock Bed
  const DispatchSchema = z.object({
    transferId: z.string(),
    destinationBedId: z.string(),
    ambulanceNumber: z.string().optional(),
    clinicalHandoverSummary: z.string().optional()
  });

  fastify.post('/api/v1/executive/beds/transfers/dispatch', { preHandler: [authenticate] }, async (request) => {
    const parsed = DispatchSchema.parse(request.body || {});
    const result = multiFacilityBedTelemetryService.dispatchTransfer(parsed);
    return {
      success: true,
      data: result
    };
  });

  // 4. Complete Handover
  const CompleteSchema = z.object({
    transferId: z.string()
  });

  fastify.post('/api/v1/executive/beds/transfers/complete', { preHandler: [authenticate] }, async (request) => {
    const parsed = CompleteSchema.parse(request.body || {});
    const result = multiFacilityBedTelemetryService.completeTransfer(parsed.transferId);
    return {
      success: true,
      data: result
    };
  });
};
