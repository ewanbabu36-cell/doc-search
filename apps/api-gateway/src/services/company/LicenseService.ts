import crypto from 'node:crypto';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { entitlementService } from './EntitlementService.js';
import { sessionRevocationService } from '../core/SessionRevocationService.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase, type License, type NewLicense } from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';
import { env } from '../../config/env.js';
import { machineFingerprintService } from '../security/MachineFingerprintService.js';
import { antiTamperClockService } from '../security/AntiTamperClockService.js';

export interface BoundNodeSeat {
  nodeId: string;
  deviceName: string;
  machineFingerprint: string;
  platform?: string | undefined;
  hostname?: string | undefined;
  primaryMac?: string | undefined;
  boundAt: string;
  lastHeartbeatAt: string;
  status: 'ACTIVE' | 'BOUND' | 'SUSPENDED' | 'REVOKED';
}

export interface AirGappedLicenseEnvelope {
  format: 'DOCSEARCH_AIRGAP_ENVELOPE_V1';
  licenseKey: string;
  partnerId: string;
  tenantId: string;
  tenantName: string;
  planTier: string;
  maxSeats: number;
  boundNodes: BoundNodeSeat[];
  maxDoctors: number;
  maxBranches: number;
  maxConcurrentUsers: number;
  issuedAt: string;
  expiryDate: string;
  gracePeriodDays: number;
  features: string[];
  signature: string;
}

export interface OfflineLicenseTokenData {
  licenseKey: string;
  partnerId: string;
  tenantId: string;
  tenantName: string;
  machineFingerprint: string;
  planTier: string;
  maxSeats?: number;
  boundNodes?: BoundNodeSeat[];
  maxDoctors: number;
  maxBranches: number;
  maxBeds: number;
  issuedAt: string;
  expiryDate: string;
  gracePeriodDays: number;
  features: string[];
}

export interface IssueLicenseInput {
  partnerId: string;
  tenantId: string;
  subscriptionId: string;
  planId: string;
  licenseType?: string;
  maxConcurrentUsers?: number;
  maxDoctors?: number;
  maxBranches?: number;
  startDate?: Date;
  expiryDate: Date;
  gracePeriodEnd?: Date;
  metadata?: Record<string, any>;
}

export class LicenseService {
  private getSecret(): string {
    return process.env['LICENSE_HMAC_SECRET'] || env.JWT_SECRET;
  }

  generateLicenseKey(prefix = 'LIC'): string {
    const year = new Date().getUTCFullYear();
    const part1 = crypto.randomBytes(4).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${year}-${part1}-${part2}`;
  }

  signLicensePayload(payload: {
    licenseKey: string;
    partnerId: string;
    tenantId: string;
    subscriptionId: string;
    planId: string;
    expiryDate: string;
  }): string {
    const hmac = crypto.createHmac('sha256', this.getSecret());
    const dataToSign = `${payload.licenseKey}:${payload.partnerId}:${payload.tenantId}:${payload.subscriptionId}:${payload.planId}:${payload.expiryDate}`;
    return hmac.update(dataToSign).digest('hex');
  }

  verifyLicenseSignature(license: License): boolean {
    if (!license || !license.signature || typeof license.signature !== 'string') {
      return false;
    }

    const rawSig = license.signature.trim();
    if (!/^[0-9a-f]{64}$/i.test(rawSig)) {
      return false;
    }

    if (!license.licenseKey || !license.partnerId || !license.tenantId || !license.subscriptionId || !license.planId || !license.expiryDate) {
      return false;
    }

    const expiryDateObj = new Date(license.expiryDate);
    if (Number.isNaN(expiryDateObj.getTime())) {
      return false;
    }

    const expectedSig = this.signLicensePayload({
      licenseKey: license.licenseKey,
      partnerId: license.partnerId,
      tenantId: license.tenantId,
      subscriptionId: license.subscriptionId,
      planId: license.planId,
      expiryDate: expiryDateObj.toISOString()
    });

    try {
      const sigBuf = Buffer.from(rawSig, 'hex');
      const expBuf = Buffer.from(expectedSig, 'hex');
      if (sigBuf.length === 32 && expBuf.length === 32 && crypto.timingSafeEqual(sigBuf, expBuf)) {
        return true;
      }
    } catch {
      // Fall through to canonical identity HMAC check
    }

    // Also support canonical identity HMAC independent of DB timestamp precision formatting
    try {
      const canonicalIdentity = `${license.licenseKey}:${license.partnerId}:${license.tenantId}:${license.subscriptionId}:${license.planId}`;
      const canonicalHmac = crypto.createHmac('sha256', this.getSecret()).update(canonicalIdentity).digest('hex');
      const sigBuf = Buffer.from(rawSig, 'hex');
      const canBuf = Buffer.from(canonicalHmac, 'hex');
      if (sigBuf.length === 32 && canBuf.length === 32 && crypto.timingSafeEqual(sigBuf, canBuf)) {
        return true;
      }
    } catch {
      // Fall through
    }

    return false;
  }


  evaluateLicenseStatus(
    license: License,
    asOf: Date = new Date()
  ): {
    status: 'ACTIVE' | 'FREE_ACTIVE' | 'RENEWAL_WINDOW' | 'EXPIRING_SOON' | 'GRACE_PERIOD' | 'EXPIRED' | 'LOCKED' | 'SUSPENDED' | 'REVOKED';
    isAccessAllowed: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
    graceDaysRemaining?: number;
  } {
    const normStatus = String(license.status || '').toUpperCase();
    if (
      normStatus === 'SUSPENDED' ||
      normStatus === 'REVOKED' ||
      normStatus === 'EXPIRED' ||
      normStatus === 'LOCKED' ||
      normStatus === 'CANCELLED' ||
      normStatus === 'TERMINATED'
    ) {
      return {
        status: normStatus as any,
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0,
        graceDaysRemaining: 0
      };
    }

    const expiryTime = new Date(license.expiryDate).getTime();
    const nowTime = asOf.getTime();
    const graceTime = license.gracePeriodEnd ? new Date(license.gracePeriodEnd).getTime() : expiryTime;

    const msRemaining = expiryTime - nowTime;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const graceMsRemaining = graceTime - nowTime;
    const graceDaysRemaining = Math.max(0, Math.ceil(graceMsRemaining / (1000 * 60 * 60 * 24)));

    if (nowTime >= graceTime) {
      return {
        status: 'LOCKED',
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0,
        graceDaysRemaining: 0
      };
    }

    if (nowTime >= expiryTime && nowTime < graceTime) {
      return {
        status: 'GRACE_PERIOD',
        isAccessAllowed: true,
        isInGracePeriod: true,
        daysRemaining: 0,
        graceDaysRemaining
      };
    }

    // 30 days before expiry: visible countdown
    if (daysRemaining <= 30) {
      return {
        status: 'EXPIRING_SOON',
        isAccessAllowed: true,
        isInGracePeriod: false,
        daysRemaining,
        graceDaysRemaining
      };
    }

    // 60 days before expiry: begin renewal alerts
    if (daysRemaining <= 60) {
      return {
        status: 'RENEWAL_WINDOW',
        isAccessAllowed: true,
        isInGracePeriod: false,
        daysRemaining,
        graceDaysRemaining
      };
    }

    return {
      status: (license.status === 'FREE_ACTIVE' ? 'FREE_ACTIVE' : 'ACTIVE') as any,
      isAccessAllowed: true,
      isInGracePeriod: false,
      daysRemaining,
      graceDaysRemaining
    };
  }

  async issueLicense(input: IssueLicenseInput, tx?: any): Promise<License> {
    const licenseKey = this.generateLicenseKey();
    const startDate = input.startDate || new Date();
    const expiryIso = input.expiryDate.toISOString();
    const defaultGraceEnd = new Date(input.expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const signature = this.signLicensePayload({
      licenseKey,
      partnerId: input.partnerId,
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      planId: input.planId,
      expiryDate: expiryIso
    });

    const newLicenseData: NewLicense = {
      id: crypto.randomUUID(),
      licenseKey,
      partnerId: input.partnerId,
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      planId: input.planId,
      licenseType: input.licenseType ?? 'COMMERCIAL',
      status: 'ACTIVE',
      activationStatus: 'ACTIVATED',
      maxConcurrentUsers: input.maxConcurrentUsers ?? 50,
      maxDoctors: input.maxDoctors ?? 20,
      maxBranches: input.maxBranches ?? 5,
      issuedAt: new Date(),
      startDate,
      expiryDate: input.expiryDate,
      gracePeriodEnd: input.gracePeriodEnd || defaultGraceEnd,
      signature,
      metadata: input.metadata || {}
    };

    return licenseRepository.create(newLicenseData, tx);
  }

  async renewLicense(
    licenseId: string,
    newExpiryDate: Date,
    newGracePeriodEnd: Date | null,
    tx?: any
  ): Promise<License> {
    const existing = await licenseRepository.findById(licenseId, tx);
    if (!existing) {
      throw AppError.notFound(`License ${licenseId} not found`);
    }

    const expiryIso = newExpiryDate.toISOString();
    const effectiveGraceEnd = newGracePeriodEnd || new Date(newExpiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const signature = this.signLicensePayload({
      licenseKey: existing.licenseKey,
      partnerId: existing.partnerId,
      tenantId: existing.tenantId,
      subscriptionId: existing.subscriptionId,
      planId: existing.planId,
      expiryDate: expiryIso
    });

    const updated = await licenseRepository.update(
      licenseId,
      {
        expiryDate: newExpiryDate,
        gracePeriodEnd: effectiveGraceEnd,
        status: 'ACTIVE',
        activationStatus: 'ACTIVATED',
        signature
      },
      tx
    );

    if (existing.tenantId) {
      entitlementService.invalidateTenantCache(existing.tenantId);
    }

    return updated;
  }

  async updateLimits(
    licenseId: string,
    limits: {
      planId?: string;
      maxConcurrentUsers?: number;
      maxDoctors?: number;
      maxBranches?: number;
    },
    tx?: any
  ): Promise<License> {
    const existing = await licenseRepository.findById(licenseId, tx);
    if (!existing) {
      throw AppError.notFound(`License ${licenseId} not found`);
    }

    const planId = limits.planId || existing.planId;
    const expiryIso = new Date(existing.expiryDate).toISOString();

    const signature = this.signLicensePayload({
      licenseKey: existing.licenseKey,
      partnerId: existing.partnerId,
      tenantId: existing.tenantId,
      subscriptionId: existing.subscriptionId,
      planId,
      expiryDate: expiryIso
    });

    return licenseRepository.update(
      licenseId,
      {
        planId,
        maxConcurrentUsers: limits.maxConcurrentUsers ?? existing.maxConcurrentUsers,
        maxDoctors: limits.maxDoctors ?? existing.maxDoctors,
        maxBranches: limits.maxBranches ?? existing.maxBranches,
        signature
      },
      tx
    );
  }

  async revokeLicense(licenseId: string, reasonOrTx?: any, tx?: any): Promise<License> {
    const reason = typeof reasonOrTx === 'string' ? reasonOrTx : 'License revoked by HQ command';
    const dbTx = typeof reasonOrTx === 'object' && reasonOrTx !== null ? reasonOrTx : tx;
    const existing = await licenseRepository.findById(licenseId, dbTx);
    const updated = await licenseRepository.update(
      licenseId,
      {
        status: 'REVOKED',
        activationStatus: 'REVOKED'
      },
      dbTx
    );
    if (existing?.tenantId) {
      sessionRevocationService.revokeTenant(existing.tenantId, reason).catch(() => {});
      entitlementService.invalidateTenantCache(existing.tenantId);
    }
    return updated;
  }

  async suspendLicense(licenseId: string, reasonOrTx?: any, tx?: any): Promise<License> {
    const reason = typeof reasonOrTx === 'string' ? reasonOrTx : 'License suspended by HQ command';
    const dbTx = typeof reasonOrTx === 'object' && reasonOrTx !== null ? reasonOrTx : tx;
    const existing = await licenseRepository.findById(licenseId, dbTx);
    const updated = await licenseRepository.update(
      licenseId,
      {
        status: 'SUSPENDED',
        activationStatus: 'SUSPENDED'
      },
      dbTx
    );
    if (existing?.tenantId) {
      sessionRevocationService.revokeTenant(existing.tenantId, reason).catch(() => {});
      entitlementService.invalidateTenantCache(existing.tenantId);
    }
    return updated;
  }

  async reactivateLicense(licenseId: string, tx?: any): Promise<License> {
    const existing = await licenseRepository.findById(licenseId, tx);
    if (!existing) {
      throw AppError.notFound(`License ${licenseId} not found`);
    }

    const expiryIso = new Date(existing.expiryDate).toISOString();
    const signature = this.signLicensePayload({
      licenseKey: existing.licenseKey,
      partnerId: existing.partnerId,
      tenantId: existing.tenantId,
      subscriptionId: existing.subscriptionId,
      planId: existing.planId,
      expiryDate: expiryIso
    });

    const updated = await licenseRepository.update(
      licenseId,
      {
        status: 'ACTIVE',
        activationStatus: 'ACTIVATED',
        signature
      },
      tx
    );

    if (existing?.tenantId) {
      entitlementService.invalidateTenantCache(existing.tenantId);
    }
    return updated;
  }

  async getLicenses(session: SessionContext): Promise<License[]> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      if (session.isSuperAdmin || (session.roles && session.roles.includes('SUPER_ADMIN'))) {
        return licenseRepository.findMany(tx);
      }
      return licenseRepository.findByTenantId(session.tenantId, tx);
    });
  }

  async getLicenseById(licenseId: string, session: SessionContext): Promise<License> {
    return withSecurityContext(getDatabase(), session, async (tx) => {
      const lic = await licenseRepository.findById(licenseId, tx);
      if (!lic) {
        throw AppError.notFound(`License ${licenseId} not found`);
      }
      if (!session.isSuperAdmin && (!session.roles || !session.roles.includes('SUPER_ADMIN')) && lic.tenantId !== session.tenantId) {
        throw AppError.forbidden('Unauthorized access to commercial license');
      }
      return lic;
    });
  }

  /**
   * Generates a tamper-proof cryptographically signed offline license token.
   */
  generateOfflineLicenseToken(data: OfflineLicenseTokenData): string {
    const json = JSON.stringify(data);
    const payloadB64 = Buffer.from(json, 'utf8').toString('base64url');
    const hmac = crypto.createHmac('sha256', this.getSecret());
    const signature = hmac.update(payloadB64).digest('hex');
    return `DSLIC.${payloadB64}.${signature}`;
  }

  /**
   * Verifies the cryptographic integrity of an offline license token string.
   */
  verifyOfflineLicenseToken(tokenString: string): { valid: boolean; data?: OfflineLicenseTokenData; error?: string } {
    const parts = tokenString.trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'DSLIC' || !parts[1] || !parts[2]) {
      return { valid: false, error: 'Invalid license format. Must be DSLIC.<payload>.<signature>' };
    }

    const [, payloadB64, providedSig] = parts;
    const hmac = crypto.createHmac('sha256', this.getSecret());
    const expectedSig = hmac.update(payloadB64!).digest('hex');

    const providedBuf = Buffer.from(providedSig!);
    const expectedBuf = Buffer.from(expectedSig);

    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return { valid: false, error: 'Cryptographic signature mismatch! License token has been tampered with or modified.' };
    }

    try {
      const jsonStr = Buffer.from(payloadB64!, 'base64url').toString('utf8');
      const data = JSON.parse(jsonStr) as OfflineLicenseTokenData;
      return { valid: true, data };
    } catch {
      return { valid: false, error: 'Malformed license payload JSON' };
    }
  }

  /**
   * Activates an offline license token against the physical machine node and monotonic clock.
   */
  async activateOfflineLicenseToken(
    tokenString: string,
    _session?: SessionContext
  ): Promise<{ success: boolean; data: any; message: string }> {
    const verified = this.verifyOfflineLicenseToken(tokenString);
    if (!verified.valid || !verified.data) {
      throw AppError.badRequest(verified.error || 'Invalid license token');
    }

    const { data } = verified;

    // 1. Hardware Node-Lock Verification
    const currentHardware = machineFingerprintService.getMachineFingerprint();
    const isSingleMatch = machineFingerprintService.verifyMachine(data.machineFingerprint);
    const isBoundInList = data.boundNodes?.some((n) => n.machineFingerprint === currentHardware);
    const hasOpenSeat = (data.maxSeats ?? 5) > (data.boundNodes?.length ?? 0);

    if (!isSingleMatch && !isBoundInList && !hasOpenSeat) {
      throw AppError.forbidden(
        `Hardware Node-Lock Violation: This license is cryptographically bound to hardware "${data.machineFingerprint}", but this computer is "${currentHardware}". Unauthorized device cloning blocked.`
      );
    }

    // 2. Anti-Clock Tampering Monotonic Ledger Verification
    const clockStatus = antiTamperClockService.verifyClockIntegrity();
    if (clockStatus.isTampered) {
      throw AppError.forbidden(
        clockStatus.message || 'System clock rollback detected. License activation rejected to preserve security.'
      );
    }

    // 3. Expiry Verification against current time
    const expiryTime = new Date(data.expiryDate).getTime();
    if (Date.now() >= expiryTime) {
      throw AppError.badRequest(
        `License Expired: This offline license expired on ${new Date(data.expiryDate).toLocaleDateString()}. Contact DocSearch HQ for a renewal key.`
      );
    }

    // 4. Update or Insert License Record
    const expiryDate = new Date(data.expiryDate);
    const gracePeriodEnd = new Date(expiryDate.getTime() + data.gracePeriodDays * 24 * 60 * 60 * 1000);

    const existingLicenses = await licenseRepository.findByTenantId(data.tenantId);
    let activeLic = existingLicenses[0];

    const telemetry = machineFingerprintService.getHardwareTelemetry();
    const existingMeta = (activeLic?.metadata || {}) as any;
    let boundNodes: BoundNodeSeat[] = Array.isArray(data.boundNodes) && data.boundNodes.length > 0
      ? [...data.boundNodes]
      : (Array.isArray(existingMeta.boundNodes) ? [...existingMeta.boundNodes] : []);

    const existingSeat = boundNodes.find((n) => n.machineFingerprint === currentHardware);
    if (!existingSeat) {
      boundNodes.push({
        nodeId: `node-${crypto.randomUUID().slice(0, 8)}`,
        deviceName: `${telemetry.hostname || 'Terminal'} Seat ${boundNodes.length + 1}`,
        machineFingerprint: currentHardware,
        hostname: telemetry.hostname,
        platform: telemetry.platform,
        primaryMac: telemetry.primaryMac,
        boundAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        status: 'ACTIVE'
      });
    }

    if (activeLic) {
      await licenseRepository.update(activeLic.id, {
        licenseKey: data.licenseKey,
        status: 'ACTIVE',
        activationStatus: 'ACTIVATED',
        maxDoctors: data.maxDoctors,
        maxBranches: data.maxBranches,
        expiryDate,
        gracePeriodEnd,
        signature: this.signLicensePayload({
          licenseKey: data.licenseKey,
          partnerId: data.partnerId,
          tenantId: data.tenantId,
          subscriptionId: activeLic.subscriptionId || 'sub-offline',
          planId: activeLic.planId || 'plan-offline',
          expiryDate: expiryDate.toISOString()
        }),
        metadata: {
          ...existingMeta,
          machineFingerprint: data.machineFingerprint,
          planTier: data.planTier,
          features: data.features,
          maxSeats: data.maxSeats ?? 5,
          boundNodes,
          activatedOfflineAt: new Date().toISOString(),
          activatedOnNode: currentHardware
        }
      });
    }

    entitlementService.invalidateTenantCache(data.tenantId);

    return {
      success: true,
      data: {
        licenseKey: data.licenseKey,
        tenantName: data.tenantName,
        machineFingerprint: data.machineFingerprint,
        currentDevice: currentHardware,
        planTier: data.planTier,
        maxDoctors: data.maxDoctors,
        maxBranches: data.maxBranches,
        maxSeats: data.maxSeats ?? 5,
        seatsUsed: boundNodes.length,
        expiryDate: data.expiryDate,
        nodeLocked: true
      },
      message: `✓ Software License successfully activated and node-locked to this device (${currentHardware}) until ${new Date(data.expiryDate).toLocaleDateString()}!`
    };
  }

  /**
   * Binds an additional physical workstation seat to an active multi-seat license.
   */
  async bindNodeSeat(
    licenseId: string,
    node: {
      deviceName: string;
      machineFingerprint: string;
      hostname?: string | undefined;
      platform?: string | undefined;
      primaryMac?: string | undefined;
    },
    tx?: any
  ): Promise<License> {
    const existing = await licenseRepository.findById(licenseId, tx);
    if (!existing) {
      throw AppError.notFound(`License ${licenseId} not found`);
    }

    const meta = (existing.metadata || {}) as any;
    const maxSeats = Number(meta.maxSeats) || 5;
    const boundNodes: BoundNodeSeat[] = Array.isArray(meta.boundNodes) ? [...meta.boundNodes] : [];

    const normalizedFp = node.machineFingerprint.trim().toUpperCase();
    const existingIdx = boundNodes.findIndex((n) => n.machineFingerprint === normalizedFp);
    const nowIso = new Date().toISOString();

    if (existingIdx >= 0) {
      boundNodes[existingIdx] = {
        ...boundNodes[existingIdx]!,
        deviceName: node.deviceName || boundNodes[existingIdx]!.deviceName,
        hostname: node.hostname || boundNodes[existingIdx]!.hostname,
        platform: node.platform || boundNodes[existingIdx]!.platform,
        primaryMac: node.primaryMac || boundNodes[existingIdx]!.primaryMac,
        lastHeartbeatAt: nowIso,
        status: 'ACTIVE'
      };
    } else {
      if (boundNodes.filter((n) => n.status !== 'REVOKED').length >= maxSeats) {
        throw AppError.badRequest(
          `Seat limit reached: All ${maxSeats} authorized device seats are currently bound. Unbind or upgrade to add more terminals.`
        );
      }
      boundNodes.push({
        nodeId: `node-${crypto.randomUUID().slice(0, 8)}`,
        deviceName: node.deviceName || `Terminal ${boundNodes.length + 1}`,
        machineFingerprint: normalizedFp,
        hostname: node.hostname || 'Unknown-Host',
        platform: node.platform || 'Unknown-OS',
        primaryMac: node.primaryMac || '',
        boundAt: nowIso,
        lastHeartbeatAt: nowIso,
        status: 'ACTIVE'
      });
    }

    const updatedMetadata = {
      ...meta,
      maxSeats,
      boundNodes,
      machineFingerprint: boundNodes[0]?.machineFingerprint || meta.machineFingerprint || normalizedFp,
      updatedAt: nowIso
    };

    return licenseRepository.update(licenseId, { metadata: updatedMetadata }, tx);
  }

  /**
   * Releases/unbinds a physical workstation seat so it can be replaced.
   */
  async unbindNodeSeat(licenseId: string, nodeIdOrFp: string, tx?: any): Promise<License> {
    const existing = await licenseRepository.findById(licenseId, tx);
    if (!existing) {
      throw AppError.notFound(`License ${licenseId} not found`);
    }

    const meta = (existing.metadata || {}) as any;
    const boundNodes: BoundNodeSeat[] = Array.isArray(meta.boundNodes) ? [...meta.boundNodes] : [];

    const filtered = boundNodes.filter(
      (n) => n.nodeId !== nodeIdOrFp && n.machineFingerprint !== nodeIdOrFp.toUpperCase()
    );

    const updatedMetadata = {
      ...meta,
      boundNodes: filtered,
      machineFingerprint: filtered[0]?.machineFingerprint || null
    };

    return licenseRepository.update(licenseId, { metadata: updatedMetadata }, tx);
  }

  /**
   * Revokes an individual physical workstation seat.
   */
  async revokeNodeSeat(licenseId: string, nodeIdOrFp: string, reason?: string, tx?: any): Promise<License> {
    const existing = await licenseRepository.findById(licenseId, tx);
    if (!existing) {
      throw AppError.notFound(`License ${licenseId} not found`);
    }

    const meta = (existing.metadata || {}) as any;
    const boundNodes: BoundNodeSeat[] = Array.isArray(meta.boundNodes) ? [...meta.boundNodes] : [];

    const targetIdx = boundNodes.findIndex(
      (n) => n.nodeId === nodeIdOrFp || n.machineFingerprint === nodeIdOrFp.toUpperCase()
    );

    if (targetIdx >= 0) {
      boundNodes[targetIdx] = {
        ...boundNodes[targetIdx]!,
        status: 'REVOKED'
      };
    }

    const auditTrail = Array.isArray(meta.auditTrail) ? [...meta.auditTrail] : [];
    auditTrail.push({
      action: 'NODE_SEAT_REVOKED',
      target: nodeIdOrFp,
      reason: reason || 'Revoked by HQ Command',
      timestamp: new Date().toISOString()
    });

    const updatedMetadata = {
      ...meta,
      boundNodes,
      auditTrail
    };

    return licenseRepository.update(licenseId, { metadata: updatedMetadata }, tx);
  }

  /**
   * Processes a dynamic cryptographic heartbeat from an active terminal.
   */
  async processHeartbeat(input: {
    licenseKey?: string | undefined;
    tenantId?: string | undefined;
    machineFingerprint: string;
    clientTimestamp?: number | undefined;
    deviceName?: string | undefined;
  }): Promise<{
    success: boolean;
    status: 'ACTIVE' | 'FREE_ACTIVE' | 'RENEWAL_WINDOW' | 'EXPIRING_SOON' | 'GRACE_PERIOD' | 'EXPIRED' | 'LOCKED' | 'REVOKED' | 'SUSPENDED';
    isAccessAllowed: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
    nodeStatus: 'ACTIVE' | 'UNBOUND' | 'REVOKED' | 'UNKNOWN';
    seatsUsed: number;
    maxSeats: number;
    message: string;
  }> {
    let license: License | null = null;
    if (input.licenseKey) {
      license = await licenseRepository.findByKey(input.licenseKey);
      if (!license) {
        return {
          success: false,
          status: 'REVOKED',
          isAccessAllowed: false,
          isInGracePeriod: false,
          daysRemaining: 0,
          nodeStatus: 'UNKNOWN',
          seatsUsed: 0,
          maxSeats: 0,
          message: 'Invalid or unassigned commercial license key.'
        };
      }
    } else if (input.tenantId) {
      const lics = await licenseRepository.findByTenantId(input.tenantId);
      license = lics[0] || null;
    }

    if (!license) {
      return {
        success: false,
        status: 'REVOKED',
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0,
        nodeStatus: 'UNKNOWN',
        seatsUsed: 0,
        maxSeats: 0,
        message: 'COMMERCIAL_ACCESS_DENIED: No active commercial license found for this organization.'
      };
    }

    // 1. License status check
    const normLicStatus = String(license.status || '').toUpperCase();
    if (
      normLicStatus === 'REVOKED' ||
      normLicStatus === 'SUSPENDED' ||
      normLicStatus === 'EXPIRED' ||
      normLicStatus === 'LOCKED' ||
      normLicStatus === 'CANCELLED' ||
      normLicStatus === 'TERMINATED'
    ) {
      return {
        success: false,
        status: normLicStatus as any,
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0,
        nodeStatus: 'REVOKED',
        seatsUsed: 0,
        maxSeats: 0,
        message: `Commercial software license has been ${normLicStatus} by DOC SEARCH HQ Command.`
      };
    }

    // 2. Anti-Clock Tampering Monotonic Ledger Verification
    const clockStatus = antiTamperClockService.verifyClockIntegrity(input.clientTimestamp || Date.now());
    if (clockStatus.isTampered) {
      return {
        success: false,
        status: 'SUSPENDED',
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0,
        nodeStatus: 'REVOKED',
        seatsUsed: 0,
        maxSeats: 0,
        message: clockStatus.message || 'System clock rewind detected. Node locked to protect data integrity.'
      };
    }

    // 3. Node-Lock Verification in metadata
    const meta = (license.metadata || {}) as any;
    const maxSeats = Number(meta.maxSeats) || 5;
    const boundNodes: BoundNodeSeat[] = Array.isArray(meta.boundNodes) ? [...meta.boundNodes] : [];
    const normalizedFp = input.machineFingerprint.trim().toUpperCase();

    const targetNode = boundNodes.find((n) => n.machineFingerprint === normalizedFp);
    let nodeStatus: 'ACTIVE' | 'UNBOUND' | 'REVOKED' | 'UNKNOWN' = 'UNBOUND';

    if (targetNode) {
      if (targetNode.status === 'REVOKED') {
        return {
          success: false,
          status: 'REVOKED',
          isAccessAllowed: false,
          isInGracePeriod: false,
          daysRemaining: 0,
          nodeStatus: 'REVOKED',
          seatsUsed: boundNodes.filter((n) => n.status === 'ACTIVE').length,
          maxSeats,
          message: `This physical terminal (${normalizedFp}) has been specifically revoked by DOC SEARCH HQ.`
        };
      }
      nodeStatus = 'ACTIVE';
      targetNode.lastHeartbeatAt = new Date().toISOString();
      if (input.deviceName) targetNode.deviceName = input.deviceName;

      // Update in DB asynchronously
      licenseRepository.update(license.id, { metadata: { ...meta, boundNodes } }).catch(() => {});
    } else {
      // Check legacy single fingerprint
      if (meta.machineFingerprint && meta.machineFingerprint.toUpperCase() === normalizedFp) {
        nodeStatus = 'ACTIVE';
      }
    }

    // 4. Expiry / Grace evaluation
    const evalResult = this.evaluateLicenseStatus(license);

    return {
      success: evalResult.isAccessAllowed,
      status: evalResult.status,
      isAccessAllowed: evalResult.isAccessAllowed,
      isInGracePeriod: evalResult.isInGracePeriod,
      daysRemaining: evalResult.daysRemaining,
      nodeStatus,
      seatsUsed: boundNodes.filter((n) => n.status === 'ACTIVE').length,
      maxSeats,
      message: evalResult.isAccessAllowed
        ? `Node operational. ${evalResult.daysRemaining} days remaining on license.`
        : 'License expired or grace period elapsed.'
    };
  }

  /**
   * Generates a tamper-proof air-gapped license package (.lic envelope).
   */
  generateAirGappedLicenseEnvelope(license: License): AirGappedLicenseEnvelope {
    const meta = (license.metadata || {}) as any;
    const payload = {
      format: 'DOCSEARCH_AIRGAP_ENVELOPE_V1' as const,
      licenseKey: license.licenseKey,
      partnerId: license.partnerId,
      tenantId: license.tenantId,
      tenantName: meta.tenantName || 'DocSearch Licensed Facility',
      planTier: meta.planTier || 'Enterprise Healthcare Edition',
      maxSeats: Number(meta.maxSeats) || 5,
      boundNodes: Array.isArray(meta.boundNodes) ? meta.boundNodes : [],
      maxDoctors: license.maxDoctors,
      maxBranches: license.maxBranches,
      maxConcurrentUsers: license.maxConcurrentUsers,
      issuedAt: new Date(license.issuedAt).toISOString(),
      expiryDate: new Date(license.expiryDate).toISOString(),
      gracePeriodDays: 15,
      features: Array.isArray(meta.features)
        ? meta.features
        : ['OPD_CONSULTATION', 'PHARMACY_POS', 'EMR', 'DIGITAL_RX', 'LAB_LIMS']
    };

    const hmac = crypto.createHmac('sha256', this.getSecret());
    const canonicalStr = `${payload.licenseKey}:${payload.partnerId}:${payload.tenantId}:${payload.expiryDate}:${payload.maxSeats}:${payload.maxDoctors}`;
    const signature = hmac.update(canonicalStr).digest('hex');

    return {
      ...payload,
      signature
    };
  }

  /**
   * Verifies the cryptographic integrity of an air-gapped license envelope.
   */
  verifyAirGappedEnvelope(envelope: AirGappedLicenseEnvelope): { valid: boolean; error?: string } {
    if (envelope.format !== 'DOCSEARCH_AIRGAP_ENVELOPE_V1' || !envelope.signature) {
      return { valid: false, error: 'Invalid air-gapped license envelope format' };
    }

    const hmac = crypto.createHmac('sha256', this.getSecret());
    const canonicalStr = `${envelope.licenseKey}:${envelope.partnerId}:${envelope.tenantId}:${envelope.expiryDate}:${envelope.maxSeats}:${envelope.maxDoctors}`;
    const expectedSig = hmac.update(canonicalStr).digest('hex');

    const providedBuf = Buffer.from(envelope.signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return { valid: false, error: 'Cryptographic signature mismatch! File has been tampered with or modified.' };
    }

    return { valid: true };
  }

  /**
   * Activates an air-gapped license envelope file.
   */
  async activateAirGappedEnvelope(
    envelope: AirGappedLicenseEnvelope,
    _session?: SessionContext
  ): Promise<{ success: boolean; data: any; message: string }> {
    const verified = this.verifyAirGappedEnvelope(envelope);
    if (!verified.valid) {
      throw AppError.badRequest(verified.error || 'Invalid envelope signature');
    }

    const clockStatus = antiTamperClockService.verifyClockIntegrity();
    if (clockStatus.isTampered) {
      throw AppError.forbidden(clockStatus.message || 'System clock rollback detected.');
    }

    if (Date.now() >= new Date(envelope.expiryDate).getTime()) {
      throw AppError.badRequest(
        `License Expired: This license file expired on ${new Date(envelope.expiryDate).toLocaleDateString()}.`
      );
    }

    const currentFp = machineFingerprintService.getMachineFingerprint();
    const expiryDate = new Date(envelope.expiryDate);
    const gracePeriodEnd = new Date(expiryDate.getTime() + envelope.gracePeriodDays * 24 * 60 * 60 * 1000);

    const existingLicenses = await licenseRepository.findByTenantId(envelope.tenantId);
    let activeLic = existingLicenses[0];

    let boundNodes = Array.isArray(envelope.boundNodes) ? [...envelope.boundNodes] : [];
    const isAlreadyBound = boundNodes.some((n) => n.machineFingerprint === currentFp);

    if (!isAlreadyBound) {
      if (boundNodes.filter((n) => n.status !== 'REVOKED').length >= envelope.maxSeats) {
        throw AppError.forbidden(
          `All ${envelope.maxSeats} authorized hardware seats in this license are already claimed. Contact HQ to increase seats.`
        );
      }
      const telemetry = machineFingerprintService.getHardwareTelemetry();
      boundNodes.push({
        nodeId: `node-${crypto.randomUUID().slice(0, 8)}`,
        deviceName: `${telemetry.hostname || 'Terminal'} Seat ${boundNodes.length + 1}`,
        machineFingerprint: currentFp,
        hostname: telemetry.hostname,
        platform: telemetry.platform,
        primaryMac: telemetry.primaryMac,
        boundAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        status: 'ACTIVE'
      });
    }

    if (activeLic) {
      await licenseRepository.update(activeLic.id, {
        licenseKey: envelope.licenseKey,
        status: 'ACTIVE',
        activationStatus: 'ACTIVATED',
        maxDoctors: envelope.maxDoctors,
        maxBranches: envelope.maxBranches,
        maxConcurrentUsers: envelope.maxConcurrentUsers,
        expiryDate,
        gracePeriodEnd,
        signature: this.signLicensePayload({
          licenseKey: envelope.licenseKey,
          partnerId: envelope.partnerId,
          tenantId: envelope.tenantId,
          subscriptionId: activeLic.subscriptionId || 'sub-airgap',
          planId: activeLic.planId || 'plan-airgap',
          expiryDate: expiryDate.toISOString()
        }),
        metadata: {
          tenantName: envelope.tenantName,
          planTier: envelope.planTier,
          maxSeats: envelope.maxSeats,
          boundNodes,
          machineFingerprint: currentFp,
          features: envelope.features,
          activatedAirgapAt: new Date().toISOString()
        }
      });
    }

    entitlementService.invalidateTenantCache(envelope.tenantId);

    return {
      success: true,
      data: {
        licenseKey: envelope.licenseKey,
        tenantName: envelope.tenantName,
        planTier: envelope.planTier,
        currentDeviceBound: currentFp,
        seatsUsed: boundNodes.length,
        maxSeats: envelope.maxSeats,
        expiryDate: envelope.expiryDate
      },
      message: `✓ Software License successfully activated via Air-Gapped package and bound to ${currentFp}!`
    };
  }
}

export const licenseService = new LicenseService();

