import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
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
  const isSslExplicit = process.env['DATABASE_SSL'] === 'true' || Boolean(config?.ssl) || envUrl.includes('sslmode=require');

  if (isSslExplicit) {
    return {
      rejectUnauthorized: false
    };
  }

  return false;
}

export function getDatabasePool(config?: DatabaseConfig): pg.Pool {
  if (!pool) {
    const envUrl = process.env['DATABASE_URL'];
    const connectionString = config?.connectionString ?? envUrl;

    if (!connectionString) {
      logger.warn('[WARN] No DATABASE_URL supplied in environment variables.');
    }

    pool = new Pool({
      connectionString: connectionString || undefined,
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
let testTransactionRunner: ((context: SecurityContextParams, cb: (tx: any) => Promise<any>) => Promise<any>) | null = null;

export function setTestTransactionRunner(runner: typeof testTransactionRunner): void {
  testTransactionRunner = runner;
}

export async function withSecurityContext<T>(
  db: NodePgDatabase<typeof schema>,
  context: SecurityContextParams,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  if (!context.tenantId && !context.isSuperAdmin) {
    throw AppError.forbidden('Tenant context is mandatory for security-scoped database operations');
  }

  if (testTransactionRunner) {
    return await testTransactionRunner(context, callback as any);
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
    logger.error('PostgreSQL database transaction/connection failed', err);
    if (err instanceof AppError || (err && typeof err === 'object' && ('code' in err || 'statusCode' in err))) {
      throw err;
    }
    throw new AppError({
      message: 'Database service is unavailable. Writes and clinical transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
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
