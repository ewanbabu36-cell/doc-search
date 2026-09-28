import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../schema/index.js';
import { AppError } from '@docsearch/shared-core';

export interface TenantContextOptions {
  branchId?: string;
  userId?: string;
  isSuperAdmin?: boolean;
}

/**
 * Sets session transaction-local variables directly on the PostgreSQL connection/transaction
 * to activate engine-level Row-Level Security (RLS).
 */
export async function setLocalTenantContext(
  executor: { execute: (query: any) => Promise<any> },
  tenantId: string,
  options?: TenantContextOptions
): Promise<void> {
  if (!tenantId && !options?.isSuperAdmin) {
    throw AppError.forbidden('Tenant ID is required to set PostgreSQL engine RLS context');
  }

  const sanitizedTenant = (tenantId || '').replace(/'/g, "''");
  const sanitizedBranch = (options?.branchId || '').replace(/'/g, "''");
  const sanitizedUser = (options?.userId || '').replace(/'/g, "''");
  const isSuperAdmin = options?.isSuperAdmin ? 'true' : 'false';

  await executor.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${sanitizedTenant}';`));
  await executor.execute(sql.raw(`SET LOCAL app.current_branch_id = '${sanitizedBranch}';`));
  await executor.execute(sql.raw(`SET LOCAL app.current_user_id = '${sanitizedUser}';`));
  await executor.execute(sql.raw(`SET LOCAL app.is_super_admin = '${isSuperAdmin}';`));
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
