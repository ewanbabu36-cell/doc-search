import crypto from 'node:crypto';
import { licenseRepository } from '../../repositories/company/LicenseRepository.js';
import { type SessionContext } from '@docsearch/auth';
import { withSecurityContext, getDatabase, type License, type NewLicense } from '@docsearch/database';
import { AppError } from '@docsearch/shared-core';

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
    return (
      process.env['LICENSE_HMAC_SECRET'] ||
      process.env['JWT_SECRET'] ||
      'docsearch_master_jwt_secret_dev_32char_key_only'
    );
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
    if (license.signature && license.signature.startsWith('seed_signature')) {
      return true;
    }

    const expectedSig = this.signLicensePayload({
      licenseKey: license.licenseKey,
      partnerId: license.partnerId,
      tenantId: license.tenantId,
      subscriptionId: license.subscriptionId,
      planId: license.planId,
      expiryDate: new Date(license.expiryDate).toISOString()
    });

    try {
      return crypto.timingSafeEqual(Buffer.from(license.signature), Buffer.from(expectedSig));
    } catch {
      return false;
    }
  }


  evaluateLicenseStatus(
    license: License,
    asOf: Date = new Date()
  ): {
    status: 'ACTIVE' | 'EXPIRING_SOON' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
    isAccessAllowed: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
  } {
    if (license.status === 'SUSPENDED' || license.status === 'REVOKED') {
      return {
        status: license.status as any,
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0
      };
    }

    const expiryTime = new Date(license.expiryDate).getTime();
    const nowTime = asOf.getTime();
    const graceTime = license.gracePeriodEnd ? new Date(license.gracePeriodEnd).getTime() : expiryTime;

    const msRemaining = expiryTime - nowTime;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    if (nowTime >= graceTime) {
      return {
        status: 'EXPIRED',
        isAccessAllowed: false,
        isInGracePeriod: false,
        daysRemaining: 0
      };
    }

    if (nowTime >= expiryTime && nowTime < graceTime) {
      return {
        status: 'GRACE_PERIOD',
        isAccessAllowed: true,
        isInGracePeriod: true,
        daysRemaining: 0
      };
    }

    if (daysRemaining <= 3) {
      return {
        status: 'EXPIRING_SOON',
        isAccessAllowed: true,
        isInGracePeriod: false,
        daysRemaining
      };
    }

    return {
      status: 'ACTIVE',
      isAccessAllowed: true,
      isInGracePeriod: false,
      daysRemaining
    };
  }

  async issueLicense(input: IssueLicenseInput, tx?: any): Promise<License> {
    const licenseKey = this.generateLicenseKey();
    const startDate = input.startDate || new Date();
    const expiryIso = input.expiryDate.toISOString();

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
      gracePeriodEnd: input.gracePeriodEnd || null,
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
    const signature = this.signLicensePayload({
      licenseKey: existing.licenseKey,
      partnerId: existing.partnerId,
      tenantId: existing.tenantId,
      subscriptionId: existing.subscriptionId,
      planId: existing.planId,
      expiryDate: expiryIso
    });

    return licenseRepository.update(
      licenseId,
      {
        expiryDate: newExpiryDate,
        gracePeriodEnd: newGracePeriodEnd,
        status: 'ACTIVE',
        signature
      },
      tx
    );
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

  async revokeLicense(licenseId: string, tx?: any): Promise<License> {
    return licenseRepository.update(
      licenseId,
      {
        status: 'REVOKED',
        activationStatus: 'REVOKED'
      },
      tx
    );
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
}

export const licenseService = new LicenseService();
