import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { machineFingerprintService } from '../../services/security/MachineFingerprintService.js';
import { antiTamperClockService } from '../../services/security/AntiTamperClockService.js';
import { licenseService } from '../../services/company/LicenseService.js';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { authenticate } from '../../plugins/auth-guard.js';
import { AppError } from '@docsearch/shared-core';

export async function licenseGovernanceRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/license/machine-fingerprint
   * Returns current physical hardware node fingerprint & telemetry
   */
  fastify.get('/api/v1/license/machine-fingerprint', async (_req: FastifyRequest, reply: FastifyReply) => {
    const telemetry = machineFingerprintService.getHardwareTelemetry();
    return reply.send({
      success: true,
      data: {
        fingerprint: telemetry.fingerprint,
        platform: telemetry.platform,
        arch: telemetry.arch,
        hostname: telemetry.hostname,
        cpuModel: telemetry.cpuModel,
        cpuCores: telemetry.cpuCores,
        primaryMac: telemetry.primaryMac
      }
    });
  });

  /**
   * GET /api/v1/license/status
   * Evaluates machine node-lock, clock integrity, and active license
   */
  fastify.get('/api/v1/license/status', {
    preHandler: [authenticate]
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const session = req.session;
    const currentFingerprint = machineFingerprintService.getMachineFingerprint();
    const clockStatus = antiTamperClockService.verifyClockIntegrity();

    const tenantId = session?.tenantId || '44444444-4444-4444-8444-444444444444';
    const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
    const activeLicense = tenantLicenses[0] || null;

    let evalResult = null;
    let isNodeLocked = false;
    let isSignatureValid = false;

    if (activeLicense) {
      evalResult = licenseService.evaluateLicenseStatus(activeLicense);
      isSignatureValid = licenseService.verifyLicenseSignature(activeLicense);
      const lockedFingerprint = (activeLicense.metadata as any)?.machineFingerprint;
      isNodeLocked = machineFingerprintService.verifyMachine(lockedFingerprint);
    }

    return reply.send({
      success: true,
      data: {
        machineFingerprint: currentFingerprint,
        isNodeLocked,
        clockIntegrity: clockStatus,
        activeLicense: activeLicense ? {
          id: activeLicense.id,
          licenseKey: activeLicense.licenseKey,
          status: activeLicense.status,
          planId: activeLicense.planId,
          maxDoctors: activeLicense.maxDoctors,
          maxBranches: activeLicense.maxBranches,
          expiryDate: activeLicense.expiryDate,
          evaluation: evalResult,
          isSignatureValid,
          lockedMachineFingerprint: (activeLicense.metadata as any)?.machineFingerprint || null
        } : null
      }
    });
  });

  /**
   * POST /api/v1/license/activate
   * Activates an offline cryptographic license token
   */
  fastify.post('/api/v1/license/activate', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { licenseToken?: string };
    if (!body?.licenseToken || typeof body.licenseToken !== 'string') {
      throw AppError.badRequest('licenseToken string is required for activation');
    }

    const result = await licenseService.activateOfflineLicenseToken(body.licenseToken.trim());
    return reply.send(result);
  });

  /**
   * POST /api/v1/company/license/generate
   * Generates a digitally signed offline license token (HQ Admin only)
   */
  fastify.post('/api/v1/company/license/generate', {
    preHandler: [authenticate]
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const session = req.session;
    const isAuthorized = session?.isSuperAdmin || (session?.roles && session.roles.some((r: string) => r === 'SUPER_ADMIN' || r === 'COMPANY_ADMIN'));
    if (!isAuthorized) {
      throw AppError.forbidden('Only Company HQ Admins can generate signed offline license keys');
    }

    const body = req.body as {
      partnerId?: string;
      tenantId?: string;
      tenantName?: string;
      machineFingerprint?: string;
      planTier?: string;
      validityDays?: number;
      maxDoctors?: number;
      maxBranches?: number;
      maxBeds?: number;
      features?: string[];
    };

    if (!body.machineFingerprint) {
      throw AppError.badRequest('machineFingerprint is required for hardware node-locking');
    }

    const validityDays = body.validityDays || 365;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const licenseKey = licenseService.generateLicenseKey();
    const tokenData = {
      licenseKey,
      partnerId: body.partnerId || 'default-partner',
      tenantId: body.tenantId || '44444444-4444-4444-8444-444444444444',
      tenantName: body.tenantName || 'DocSearch Licensed Clinic',
      machineFingerprint: body.machineFingerprint.trim().toUpperCase(),
      planTier: body.planTier || 'Doctor OPD Clinic Pro',
      maxSeats: 5,
      maxDoctors: body.maxDoctors ?? 5,
      maxBranches: body.maxBranches ?? 1,
      maxBeds: body.maxBeds ?? 10,
      issuedAt: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      gracePeriodDays: 15,
      features: body.features || ['OPD_CONSULTATION', 'PHARMACY_POS', 'EMR', 'DIGITAL_RX']
    };

    const licenseToken = licenseService.generateOfflineLicenseToken(tokenData);

    return reply.status(201).send({
      success: true,
      data: {
        licenseKey,
        licenseToken,
        machineFingerprint: tokenData.machineFingerprint,
        planTier: tokenData.planTier,
        expiryDate: tokenData.expiryDate,
        maxDoctors: tokenData.maxDoctors,
        formattedInstructions: `Copy this license token and paste it into Partner Platform -> Account Plan -> Offline License Activation.`
      }
    });
  });

  /**
   * POST /api/v1/license/heartbeat
   * Periodic cryptographic telemetry ping from active workstation terminals
   */
  fastify.post('/api/v1/license/heartbeat', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body || {}) as {
      licenseKey?: string;
      tenantId?: string;
      machineFingerprint?: string;
      clientTimestamp?: number;
      deviceName?: string;
    };

    let tenantId = body.tenantId;
    if (!tenantId && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const decoded = (fastify as any).jwt?.decode?.(token) || (req as any).session;
        if (decoded?.tenantId) {
          tenantId = decoded.tenantId;
        }
      } catch {}
    }

    const fingerprint = body.machineFingerprint || machineFingerprintService.getMachineFingerprint();
    const heartbeat = await licenseService.processHeartbeat({
      licenseKey: body.licenseKey,
      tenantId: tenantId || '11111111-1111-4111-8111-111111111111',
      machineFingerprint: fingerprint,
      clientTimestamp: body.clientTimestamp,
      deviceName: body.deviceName
    });

    const statusCode = heartbeat.isAccessAllowed ? 200 : 403;
    return reply.status(statusCode).send({
      success: heartbeat.success,
      data: heartbeat
    });
  });

  /**
   * POST /api/v1/license/import-file
   * Activates a license from an uploaded/dropped air-gapped .lic file envelope
   */
  fastify.post('/api/v1/license/import-file', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { envelope?: any; fileContent?: string };
    let envelope = body?.envelope;

    if (!envelope && body?.fileContent) {
      try {
        envelope = JSON.parse(body.fileContent);
      } catch {
        throw AppError.badRequest('Invalid license file: must be valid JSON');
      }
    }

    if (!envelope || typeof envelope !== 'object') {
      throw AppError.badRequest('envelope or fileContent payload is required');
    }

    const result = await licenseService.activateAirGappedEnvelope(envelope);
    return reply.send(result);
  });

  /**
   * GET /api/v1/company/licenses/:id/export-file
   * Exports an air-gapped .lic envelope file for a partner license (HQ Admin only)
   */
  fastify.get('/api/v1/company/licenses/:id/export-file', {
    preHandler: [authenticate]
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const lic = await licenseRepository.findById(id);
    if (!lic) {
      throw AppError.notFound(`License ${id} not found`);
    }

    const envelope = licenseService.generateAirGappedLicenseEnvelope(lic);
    const jsonStr = JSON.stringify(envelope, null, 2);

    return reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', `attachment; filename="docsearch-license-${lic.licenseKey}.lic"`)
      .send(jsonStr);
  });

  /**
   * POST /api/v1/company/licenses/:id/nodes/bind
   * Binds an additional physical workstation seat to a license
   */
  fastify.post('/api/v1/company/licenses/:id/nodes/bind', {
    preHandler: [authenticate]
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = (req.body || {}) as {
      deviceName: string;
      machineFingerprint: string;
      hostname?: string;
      platform?: string;
      primaryMac?: string;
    };

    if (!body.machineFingerprint) {
      throw AppError.badRequest('machineFingerprint is required to bind a device seat');
    }

    const updated = await licenseService.bindNodeSeat(id, body);
    return reply.send({
      success: true,
      data: updated,
      message: `Node seat "${body.deviceName || body.machineFingerprint}" successfully bound to license.`
    });
  });

  /**
   * POST /api/v1/company/licenses/:id/nodes/unbind
   * Unbinds / releases a physical workstation seat so it can be replaced
   */
  fastify.post('/api/v1/company/licenses/:id/nodes/unbind', {
    preHandler: [authenticate]
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = (req.body || {}) as { nodeIdOrFp: string };

    if (!body.nodeIdOrFp) {
      throw AppError.badRequest('nodeIdOrFp is required to unbind device seat');
    }

    const updated = await licenseService.unbindNodeSeat(id, body.nodeIdOrFp);
    return reply.send({
      success: true,
      data: updated,
      message: `Node seat "${body.nodeIdOrFp}" successfully unbound.`
    });
  });

  /**
   * POST /api/v1/company/licenses/:id/nodes/:nodeId/revoke
   * Revokes an individual physical workstation seat
   */
  fastify.post('/api/v1/company/licenses/:id/nodes/:nodeId/revoke', {
    preHandler: [authenticate]
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id, nodeId } = req.params as { id: string; nodeId: string };
    const body = (req.body || {}) as { reason?: string };

    const updated = await licenseService.revokeNodeSeat(id, nodeId, body.reason);
    return reply.send({
      success: true,
      data: updated,
      message: `Node seat "${nodeId}" has been REVOKED.`
    });
  });
}

