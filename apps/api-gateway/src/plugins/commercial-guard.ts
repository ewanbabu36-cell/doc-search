import { type FastifyRequest, type FastifyReply } from 'fastify';
import { licenseRepository } from '../repositories/company/LicenseRepository.js';
import { licenseService } from '../services/company/LicenseService.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

/**
 * Enforces valid commercial subscription and software license on partner/tenant requests.
 * Completely blocks expired, suspended, or revoked subscriptions.
 */
export async function requireActiveCommercialAccess(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const session = request.session;
  if (!session) {
    throw AppError.unauthorized('Authentication required');
  }

  // Super admins and company admins bypass tenant license gates for administration
  if (
    session.isSuperAdmin ||
    (session.roles && (session.roles.includes('SUPER_ADMIN') || session.roles.includes('COMPANY_ADMIN')))
  ) {
    return;
  }

  const tenantId = session.tenantId;
  if (!tenantId) {
    throw AppError.forbidden('Tenant context required for commercial verification');
  }

  // Look up license
  const tenantLicenses = await licenseRepository.findByTenantId(tenantId);
  const license = tenantLicenses.find(
    (l) => l.status === 'ACTIVE' || l.status === 'EXPIRING_SOON' || l.status === 'GRACE_PERIOD' || l.status === 'EXPIRED' || l.status === 'SUSPENDED'
  ) || tenantLicenses[0];

  if (!license) {
    throw new AppError({
      message: 'No commercial license found for this organization.',
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  }

  // Verify HMAC signature
  const isSignatureValid = licenseService.verifyLicenseSignature(license);
  if (!isSignatureValid) {
    throw new AppError({
      message: 'Commercial license signature verification failed. Cryptographic tampering detected.',
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  }

  const evaluation = licenseService.evaluateLicenseStatus(license);

  if (!evaluation.isAccessAllowed) {
    throw new AppError({
      message: `Commercial access suspended: Subscription is ${evaluation.status}. Please renew your plan.`,
      code: ErrorCode.FORBIDDEN,
      statusCode: 403
    });
  }

  if (evaluation.isInGracePeriod) {
    reply.header('x-commercial-grace-period', 'true');
    reply.header('x-commercial-warning', 'Subscription expired. You are operating in a grace period.');
  } else if (evaluation.status === 'EXPIRING_SOON') {
    reply.header('x-commercial-expiring-soon', 'true');
    reply.header('x-commercial-days-remaining', String(evaluation.daysRemaining));
  }
}
