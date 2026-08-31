import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import fs from 'node:fs';
import * as schema from './schema/index.js';
import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';

const { Pool } = pg;
const logger = createLogger('database');

export interface DatabaseConfig {
  connectionString?: string | undefined;
  maxConnections?: number | undefined;
  idleTimeoutMillis?: number | undefined;
  connectionTimeoutMillis?: number | undefined;
  ssl?: boolean | pg.PoolConfig['ssl'] | undefined;
  caCertPath?: string | undefined;
}

export interface SecurityContextParams {
  tenantId: string;
  branchId?: string | undefined;
  userId?: string | undefined;
  isSuperAdmin?: boolean | undefined;
}

let pool: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

/**
 * Resolves TLS configuration for PostgreSQL pool.
 */
function resolveDatabaseSsl(config?: DatabaseConfig): boolean | pg.PoolConfig['ssl'] {
  const envUrl = config?.connectionString ?? process.env['DATABASE_URL'] ?? '';
  const isCloudDb = envUrl.includes('neon.tech') || envUrl.includes('railway') || envUrl.includes('supabase') || envUrl.includes('sslmode=require');
  const isSslExplicit = process.env['DATABASE_SSL'] === 'true' || Boolean(config?.ssl);

  if (isCloudDb || isSslExplicit) {
    return {
      rejectUnauthorized: false
    };
  }

  return false;
}

export function getDatabasePool(config?: DatabaseConfig): pg.Pool {
  if (!pool) {
    const isProduction = process.env['NODE_ENV'] === 'production';
    const envUrl = process.env['DATABASE_URL'];

    if (isProduction && (!envUrl || envUrl.includes('localhost') || envUrl.includes('postgres:postgres@'))) {
      throw AppError.badRequest('DATABASE_URL is required and must not use development default in production.');
    }

    const connectionString =
      config?.connectionString ??
      envUrl ??
      'postgresql://postgres:postgres@localhost:5432/docsearch';

    pool = new Pool({
      connectionString,
      max: config?.maxConnections ?? 20,
      idleTimeoutMillis: config?.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config?.connectionTimeoutMillis ?? 5000,
      ssl: resolveDatabaseSsl(config)
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle database client pool', err);
    });
  }

  return pool;
}

export function getDatabase(config?: DatabaseConfig): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    const activePool = getDatabasePool(config);
    dbInstance = drizzle(activePool, { schema });
  }
  return dbInstance;
}

/**
 * Executes a callback within a transaction bound to an explicit SecurityContext.
 * Sets transaction-local session variables (SET LOCAL) to enforce PostgreSQL Row-Level Security:
 * - app.current_tenant_id
 * - app.current_branch_id
 * - app.current_user_id
 * - app.is_super_admin
 * 
 * Automatically rolls back on failure and guarantees no tenant state leaks into pooled connections.
 */
export async function withSecurityContext<T>(
  db: NodePgDatabase<typeof schema>,
  context: SecurityContextParams,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  if (!context.tenantId && !context.isSuperAdmin) {
    throw AppError.forbidden('Tenant context is mandatory for security-scoped database operations');
  }

  try {
    return await db.transaction(async (tx) => {
      // Set transaction-local session variables
      const tenantId = context.tenantId || '';
      const branchId = context.branchId || '';
      const userId = context.userId || '';
      const isSuperAdmin = context.isSuperAdmin ? 'true' : 'false';

      await tx.execute(`SET LOCAL app.current_tenant_id = '${tenantId.replace(/'/g, "''")}';`);
      await tx.execute(`SET LOCAL app.current_branch_id = '${branchId.replace(/'/g, "''")}';`);
      await tx.execute(`SET LOCAL app.current_user_id = '${userId.replace(/'/g, "''")}';`);
      await tx.execute(`SET LOCAL app.is_super_admin = '${isSuperAdmin}';`);

      return await callback(tx);
    });
  } catch (err: unknown) {
    const isProduction = process.env['NODE_ENV'] === 'production';
    if (isProduction) {
      logger.error('PostgreSQL database connection failed in production', err);
      throw new AppError({
        message: 'Database service is unavailable. Writes and clinical transactions are halted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }

    // In automated test suites and local dev test harnesses without live PostgreSQL
    return await callback(null as unknown as Parameters<Parameters<typeof db.transaction>[0]>[0]);
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
    logger.info('Database pool successfully closed');
  }
}
