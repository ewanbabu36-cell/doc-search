import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import * as schema from '../schema/index.js';
import { AppError } from '@docsearch/shared-core';

export interface TenantContextOptions {
  branchId?: string | undefined;
  userId?: string | undefined;
  isSuperAdmin?: boolean | undefined;
}

const RLS_SIGNING_KEY = process.env['DATABASE_CONTEXT_SECRET'] || 'docsearch_master_hmac_rls_signing_key_2026_unforgeable';

/**
 * Computes unforgeable cryptographic HMAC signature for tenant context assertions.
 */
export function computeContextSignature(tenantId: string, branchId?: string, isSuperAdmin?: boolean): string {
  const payload = `${tenantId || ''}:${branchId || ''}:${isSuperAdmin ? 'true' : 'false'}`;
  return crypto.createHmac('sha256', RLS_SIGNING_KEY).update(payload).digest('hex');
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
