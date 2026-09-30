import crypto from 'node:crypto';
import {
  getDatabase,
  deviceRegistry,
  desc,
  eq,
  and,
  type DeviceRegistryRecord
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

const logger = createLogger('device-governance-service');

export interface EnrollDeviceInput {
  deviceName: string;
  deviceType?: 'WORKSTATION' | 'MOBILE_TERMINAL' | 'TABLET' | 'KIOSK' | 'SCANNER' | 'ANALYZER_GATEWAY' | undefined;
  hardwareFingerprint: string;
  osInfo?: string | undefined;
  appVersion?: string | undefined;
  ipAddress?: string | undefined;
  branchId?: string | undefined;
}

export interface DeviceHeartbeatInput {
  deviceCode: string;
  deviceToken: string;
  ipAddress?: string | undefined;
  appVersion?: string | undefined;
}

export class DeviceGovernanceService {
  /**
   * Enrolls a clinical workstation, mobile terminal, or diagnostic kiosk with hardware fingerprinting.
   */
  async enrollDevice(
    input: EnrollDeviceInput,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;
    const branchId = input.branchId || scope.branchId || null;

    if (!input.hardwareFingerprint || !input.hardwareFingerprint.trim()) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'hardwareFingerprint is mandatory for cryptographic device binding.',
        statusCode: 400
      });
    }

    const deviceCode = `DEV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const plainToken = crypto.randomBytes(32).toString('hex');
    const deviceTokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    const enrolledBy = session.actorEmail || session.userId || 'DEVICE_ADMIN';

    const [device] = await db
      .insert(deviceRegistry)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        branchId,
        deviceCode,
        deviceName: input.deviceName,
        deviceType: input.deviceType || 'WORKSTATION',
        hardwareFingerprint: input.hardwareFingerprint.trim(),
        deviceTokenHash,
        osInfo: input.osInfo || null,
        appVersion: input.appVersion || '1.0.0',
        ipAddress: input.ipAddress || null,
        status: 'AUTHORIZED',
        enrolledBy,
        enrolledAt: new Date(),
        lastHeartbeatAt: new Date()
      })
      .returning();

    if (!device) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to enroll device in registry.',
        statusCode: 500
      });
    }

    await auditRepository.recordEvent({
      eventType: 'DEVICE_ENROLLED',
      resourceType: 'device_registry',
      resourceId: device.id,
      tenantId,
      branchId: branchId || session.branchId,
      metadata: {
        deviceCode,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        hardwareFingerprint: device.hardwareFingerprint
      }
    }, session, db);

    return {
      device,
      deviceToken: plainToken
    };
  }

  /**
   * Records a heartbeat from an enrolled device and verifies its cryptographic token.
   * Fails closed if the device has been revoked or suspended.
   */
  async recordHeartbeat(
    input: DeviceHeartbeatInput,
    tenantId: string,
    db = getDatabase()
  ) {
    const [device] = await db
      .select()
      .from(deviceRegistry)
      .where(and(eq(deviceRegistry.deviceCode, input.deviceCode), eq(deviceRegistry.tenantId, tenantId)))
      .limit(1);

    if (!device) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Device not registered in this tenant.',
        statusCode: 404
      });
    }

    // Verify token hash
    const incomingHash = crypto.createHash('sha256').update(input.deviceToken).digest('hex');
    if (incomingHash !== device.deviceTokenHash) {
      logger.warn('Device heartbeat token mismatch', { deviceCode: input.deviceCode, tenantId });
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Device authentication failed: invalid device token.',
        statusCode: 401
      });
    }

    // Fail closed if device is revoked or suspended
    if (device.status === 'REVOKED') {
      logger.error('Revoked device attempted heartbeat', { deviceCode: input.deviceCode, tenantId });
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Device access revoked. Contact hospital system administrator.',
        statusCode: 401
      });
    }

    if (device.status === 'SUSPENDED') {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: 'Device is temporarily suspended.',
        statusCode: 403
      });
    }

    const now = new Date();
    const [updated] = await db
      .update(deviceRegistry)
      .set({
        lastHeartbeatAt: now,
        ipAddress: input.ipAddress || device.ipAddress,
        appVersion: input.appVersion || device.appVersion
      })
      .where(eq(deviceRegistry.id, device.id))
      .returning();

    if (!updated) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to update heartbeat.',
        statusCode: 500
      });
    }

    return {
      success: true,
      deviceCode: updated.deviceCode,
      status: updated.status,
      lastHeartbeatAt: updated.lastHeartbeatAt
    };
  }

  /**
   * Instantly revokes a device's authorization (Fail-Closed).
   * Subsequent heartbeats or device requests are immediately rejected.
   */
  async revokeDevice(
    deviceId: string,
    reason: string,
    session: SessionContext,
    db = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    if (!reason || !reason.trim()) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Revocation reason is mandatory.',
        statusCode: 400
      });
    }

    const [device] = await db
      .select()
      .from(deviceRegistry)
      .where(
        and(
          deviceId.includes('-') ? eq(deviceRegistry.id, deviceId) : eq(deviceRegistry.deviceCode, deviceId),
          eq(deviceRegistry.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!device) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Device not found in tenant scope.',
        statusCode: 404
      });
    }

    const [updated] = await db
      .update(deviceRegistry)
      .set({
        status: 'REVOKED',
        revokedAt: new Date(),
        revocationReason: reason.trim()
      })
      .where(eq(deviceRegistry.id, device.id))
      .returning();

    if (!updated) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to revoke device.',
        statusCode: 500
      });
    }

    await auditRepository.recordEvent({
      eventType: 'DEVICE_REVOKED',
      resourceType: 'device_registry',
      resourceId: device.id,
      tenantId,
      branchId: device.branchId || session.branchId,
      metadata: {
        deviceCode: device.deviceCode,
        deviceName: device.deviceName,
        revocationReason: reason.trim(),
        revokedBy: session.actorEmail || session.userId
      }
    }, session, db);

    return updated;
  }

  /**
   * Lists all devices registered in the tenant.
   */
  async listDevices(
    session: SessionContext,
    db = getDatabase()
  ): Promise<DeviceRegistryRecord[]> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    return db
      .select()
      .from(deviceRegistry)
      .where(eq(deviceRegistry.tenantId, scope.tenantId))
      .orderBy(desc(deviceRegistry.enrolledAt));
  }
}

export const deviceGovernanceService = new DeviceGovernanceService();
