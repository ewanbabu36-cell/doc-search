import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as schema from '../schema/index.js';
import { AppError, ErrorCode } from '@docsearch/shared-core';

export interface TenantContextOptions {
  branchId?: string | undefined;
  userId?: string | undefined;
  isSuperAdmin?: boolean | undefined;
}

/**
 * Retrieves the cryptographic RLS HMAC secret from the environment.
 * P0-01 Remediation: Zero hardcoded production secrets in source code.
 */
export function getRlsSigningKey(): string {
  let secret = process.env['DATABASE_CONTEXT_SECRET'];
  if (!secret || secret.trim().length < 32) {
    try {
      const candidatePaths = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve('D:/DOC SEARCH/.env')
      ];
      for (const envPath of candidatePaths) {
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, 'utf8');
          const match = content.match(/^DATABASE_CONTEXT_SECRET=(.+)$/m);
          if (match && match[1]?.trim()) {
            secret = match[1].trim();
            process.env['DATABASE_CONTEXT_SECRET'] = secret;
            break;
          }
        }
      }
    } catch {}
  }

  if (!secret || secret.trim().length < 32) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new AppError({
        message: 'DATABASE_CONTEXT_SECRET must be configured with at least 32 characters in production.',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }
    throw new AppError({
      message: 'DATABASE_CONTEXT_SECRET environment variable is missing or insecure. Configure DATABASE_CONTEXT_SECRET in your environment or .env file.',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      statusCode: 500
    });
  }
  return secret.trim();
}

/**
 * Computes unforgeable cryptographic HMAC signature for tenant context assertions.
 */
export function computeContextSignature(
  tenantId: string,
  branchId?: string,
  isSuperAdmin?: boolean,
  overrideKey?: string
): string {
  const key = overrideKey || getRlsSigningKey();
  const payload = `${tenantId || ''}:${branchId || ''}:${isSuperAdmin ? 'true' : 'false'}`;
  return crypto.createHmac('sha256', key).update(payload).digest('hex');
}

/**
 * Sets session transaction-local variables directly on the PostgreSQL connection/transaction
 * using cryptographically verified context to activate engine-level Row-Level Security (RLS).
 * Rejects caller-settable GUC spoofing (SEC-001).
 */
export async function setLocalTenantContext(
  executor: { execute: (query: any) => Promise<any> },
  tenantId: string,
  options?: TenantContextOptions
): Promise<void> {
  if (!tenantId && !options?.isSuperAdmin) {
    throw AppError.forbidden('Tenant ID is required to set PostgreSQL engine RLS context');
  }

  const tenantVal = tenantId || '';
  const branchVal = options?.branchId || '';
  const userVal = options?.userId || '';
  const isSuper = Boolean(options?.isSuperAdmin);
  const signature = computeContextSignature(tenantVal, branchVal, isSuper);

  await executor.execute(sql`SELECT
    core.verify_and_set_context(${tenantVal}, ${branchVal}, ${isSuper}, ${signature}),
    set_config('app.current_user_id', ${userVal}, true)`);
}

/**
 * Executes a callback within a PostgreSQL transaction where engine-level RLS is enforced.
 * Even if a query does not explicitly specify a WHERE tenant_id = ... condition,
 * the PostgreSQL engine intercepts and returns ONLY rows belonging to this tenant.
 */
export async function withEngineRlsContext<T>(
  db: NodePgDatabase<typeof schema>,
  tenantId: string,
  callback: (tx: any) => Promise<T>,
  options?: TenantContextOptions
): Promise<T> {
  return await db.transaction(async (tx) => {
    await setLocalTenantContext(tx, tenantId, options);
    return await callback(tx);
  });
}
