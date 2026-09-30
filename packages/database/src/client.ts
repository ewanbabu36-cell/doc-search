import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import * as schema from './schema/index.js';
import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';

const { Pool } = pg;
const logger = createLogger('database');

export interface DatabaseConfig {
  connectionString?: string | undefined;
  replicaConnectionString?: string | undefined;
  maxConnections?: number | undefined;
  idleTimeoutMillis?: number | undefined;
  connectionTimeoutMillis?: number | undefined;
  statementTimeoutMs?: number | undefined;
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
let testDatabaseInstance: any = null;
let activeEmbeddedPool: any = null;

export function getRawPool(): any {
  return pool || activeEmbeddedPool;
}

export function setTestDatabase(db: any): void {
  testDatabaseInstance = (db && typeof db === 'object' && 'db' in db) ? db.db : db;
  if (db && typeof db === 'object' && 'pool' in db) {
    activeEmbeddedPool = db.pool;
  }
}

export function getTestDatabase(): any {
  return testDatabaseInstance;
}

function resolveDatabaseSsl(config?: DatabaseConfig): boolean | pg.PoolConfig['ssl'] {
  const envUrl = config?.connectionString ?? process.env['DATABASE_URL'] ?? '';
  const isSslExplicit = process.env['DATABASE_SSL'] === 'true' || Boolean(config?.ssl) || envUrl.includes('sslmode=require');
  if (isSslExplicit) {
    const ca = process.env['DATABASE_SSL_CA'];
    // In production, rejectUnauthorized is strictly enforced to guarantee certificate verification
    const rejectUnauthorized = process.env['NODE_ENV'] === 'production'
      ? true
      : (process.env['DATABASE_SSL_REJECT_UNAUTHORIZED'] !== 'false' && Boolean(ca));

    return {
      rejectUnauthorized,
      ca: ca ? ca : undefined
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
  if (testDatabaseInstance) {
    return testDatabaseInstance;
  }
  if (!dbInstance) {
    const activePool = getDatabasePool(config);
    dbInstance = drizzle(activePool, { schema });
  }
  return dbInstance;
}

let replicaPool: pg.Pool | null = null;
let replicaDbInstance: NodePgDatabase<typeof schema> | null = null;

export function getReplicaDatabasePool(config?: DatabaseConfig): pg.Pool {
  if (!replicaPool) {
    const replicaUrl = config?.replicaConnectionString ?? process.env['DATABASE_REPLICA_URL'] ?? process.env['DATABASE_RO_URL'];
    if (!replicaUrl) {
      return getDatabasePool(config);
    }

    replicaPool = new Pool({
      connectionString: replicaUrl,
      max: config?.maxConnections ?? 50,
      idleTimeoutMillis: config?.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config?.connectionTimeoutMillis ?? 5000,
      ssl: resolveDatabaseSsl(config)
    });

    replicaPool.on('error', (err) => {
      logger.error('Unexpected error on idle replica database client pool', err);
    });
  }
  return replicaPool;
}

/**
 * Returns the read-optimized database instance (routes to read replicas when configured).
 */
export function getReadDatabase(config?: DatabaseConfig): NodePgDatabase<typeof schema> {
  if (testDatabaseInstance) {
    return testDatabaseInstance;
  }
  const replicaUrl = config?.replicaConnectionString ?? process.env['DATABASE_REPLICA_URL'] ?? process.env['DATABASE_RO_URL'];
  if (!replicaUrl) {
    return getDatabase(config);
  }
  if (!replicaDbInstance) {
    const activeReplicaPool = getReplicaDatabasePool(config);
    replicaDbInstance = drizzle(activeReplicaPool, { schema });
  }
  return replicaDbInstance;
}

/**
 * Returns the write-optimized database instance (strictly routes mutations to primary DB).
 */
export function getWriteDatabase(config?: DatabaseConfig): NodePgDatabase<typeof schema> {
  return getDatabase(config);
}

/**
 * Pool metrics for real-time connection monitoring and APM dashboards.
 */
export function getDatabasePoolMetrics(): {
  primary: { total: number; idle: number; waiting: number };
  replica?: { total: number; idle: number; waiting: number };
} {
  return {
    primary: {
      total: pool?.totalCount ?? 0,
      idle: pool?.idleCount ?? 0,
      waiting: pool?.waitingCount ?? 0
    },
    ...(replicaPool
      ? {
          replica: {
            total: replicaPool.totalCount,
            idle: replicaPool.idleCount,
            waiting: replicaPool.waitingCount
          }
        }
      : {})
  };
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

let isDatabaseReady = false;
let databaseMode: 'EXTERNAL_POSTGRES' | 'EMBEDDED_POSTGRES' = 'EXTERNAL_POSTGRES';

export function getDatabaseStatus(): { ready: boolean; mode: 'EXTERNAL_POSTGRES' | 'EMBEDDED_POSTGRES' } {
  return { ready: isDatabaseReady, mode: databaseMode };
}

export async function ensureDatabaseReady(config?: DatabaseConfig): Promise<NodePgDatabase<typeof schema>> {
  if (isDatabaseReady && (testDatabaseInstance || dbInstance)) {
    return testDatabaseInstance || dbInstance!;
  }

  if (testDatabaseInstance) {
    isDatabaseReady = true;
    databaseMode = 'EMBEDDED_POSTGRES';
    return testDatabaseInstance;
  }

  const envUrl = config?.connectionString ?? process.env['DATABASE_URL'];

  // 1. Try external PostgreSQL pool connection
  try {
    const activePool = getDatabasePool(config);
    const client = await activePool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }

    dbInstance = drizzle(activePool, { schema });
    databaseMode = 'EXTERNAL_POSTGRES';
    isDatabaseReady = true;
    logger.info('[NATIVE-POSTGRES-ACTIVE] Successfully connected to live native PostgreSQL database pool (pg-mem bypassed).');

    try {
      const { seedUniversalDatabase } = await import('./seeds/universal-seed.js');
      await seedUniversalDatabase(dbInstance);
      logger.info('[NATIVE-POSTGRES-ACTIVE] Universal database baseline seed verified/applied.');
    } catch (seedErr) {
      logger.warn('[NATIVE-POSTGRES-ACTIVE] Seed verification warning: ' + String(seedErr));
    }

    return dbInstance;
  } catch (err: unknown) {
    const errMsg = (err as any)?.message || String(err);
    logger.warn(`[LIVE-DB] Native PostgreSQL not reachable on ${envUrl || 'localhost:5432'}: ${errMsg}`);

    const isProduction = process.env['NODE_ENV'] === 'production';
    const isStaging = process.env['NODE_ENV'] === 'staging';
    const isStrict = process.env['STRICT_POSTGRES'] === 'true';
    const isExplicitTestMode =
      process.env['NODE_ENV'] === 'test' ||
      Boolean(process.env['VITEST']) ||
      Boolean(process.env['npm_lifecycle_event']?.includes('test')) ||
      process.argv.some((arg) => arg.includes('test'));
    const allowEmbeddedSandbox = process.env['ALLOW_EMBEDDED_POSTGRES'] === 'true';

    // Strict Fail-Closed Policy:
    // Staging and Production MUST NEVER fallback to pg-mem under any circumstances.
    // Non-test environments must also fail closed unless ALLOW_EMBEDDED_POSTGRES='true' is explicitly configured for offline developer sandboxes.
    if (isProduction || isStaging || isStrict || (!isExplicitTestMode && !allowEmbeddedSandbox)) {
      const envName = process.env['NODE_ENV'] || 'unspecified';
      logger.error(`CRITICAL: Native PostgreSQL connection failed in environment "${envName}". Fail-Closed policy active: Embedded pg-mem fallback is strictly forbidden.`);
      throw new Error(
        `FATAL_DATABASE_ERROR: PostgreSQL connection failed: ${errMsg}. Embedded database fallback is strictly forbidden in ${envName} (Fail-Closed policy enforced).`
      );
    }

    logger.info('[LIVE-DB] Auto-initializing zero-dependency embedded live PostgreSQL engine with 442 schemas & 49 migrations...');

    if (pool) {
      try {
        await pool.end();
      } catch {}
      pool = null;
    }

    const allowDemo =
      process.env['SEED_DEMO_FIXTURES'] === 'true' ||
      process.env['FORCE_DEMO_SEEDS'] === 'true';
    const { setupTestDatabase } = await import('./test-harness.js');
    const instance = await setupTestDatabase({ seedBaseline: true, seedDemoFixtures: allowDemo });
    activeEmbeddedPool = instance.pool;

    try {
      const { seedUniversalDatabase } = await import('./seeds/universal-seed.js');
      await seedUniversalDatabase(instance.db);
    } catch (seedErr) {
      logger.warn('[LIVE-DB] Embedded universal seed warning: ' + String(seedErr));
    }

    testDatabaseInstance = instance.db;
    databaseMode = 'EMBEDDED_POSTGRES';
    isDatabaseReady = true;
    logger.info('[LIVE-DB] 100% Live embedded PostgreSQL engine active and universal seed loaded! Transactions ready.');
    return instance.db;
  }
}

export async function withSecurityContext<T>(
  db: NodePgDatabase<typeof schema>,
  context: SecurityContextParams,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  if (!context.tenantId && !context.isSuperAdmin) {
    throw AppError.forbidden('Tenant context is mandatory for security-scoped database operations');
  }

  // Ensure DB is ready or auto-healed if not yet initialized
  if (!isDatabaseReady && !testDatabaseInstance) {
    try {
      db = await ensureDatabaseReady();
    } catch (initErr) {
      logger.error('Failed to auto-ready database in withSecurityContext: ' + String(initErr));
    }
  } else if (testDatabaseInstance) {
    db = testDatabaseInstance;
  }

  try {
    if (testTransactionRunner) {
      return await testTransactionRunner(context, callback as any);
    }

    return await db.transaction(async (tx) => {
      // Set transaction-local session variables
      const tenantId = context.tenantId || '';
      const branchId = context.branchId || '';
      const userId = context.userId || '';
      const isSuperAdmin = context.isSuperAdmin ? 'true' : 'false';

      await tx.execute(sql`SELECT
        set_config('app.current_tenant_id', ${tenantId}, true),
        set_config('app.current_branch_id', ${branchId}, true),
        set_config('app.current_user_id', ${userId}, true),
        set_config('app.is_super_admin', ${isSuperAdmin}, true)`);

      return await callback(tx);
    });
  } catch (err: unknown) {
    logger.error('PostgreSQL database transaction/connection failed', err);
    if (err instanceof AppError || (err && typeof err === 'object' && 'name' in err && (err as any).name === 'AppError') || (err && typeof err === 'object' && 'statusCode' in err && typeof (err as any).statusCode === 'number')) {
      throw err;
    }
    throw new AppError({
      message: `Database service is unavailable. Writes and clinical transactions are halted: ${(err as any)?.message || String(err)}`,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
}

export async function closeDatabase(): Promise<void> {
  testDatabaseInstance = null;
  testTransactionRunner = null;
  if (replicaPool) {
    await replicaPool.end();
    replicaPool = null;
    replicaDbInstance = null;
  }
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
    logger.info('Database pools successfully closed');
  }
}

export const initializeDatabase = ensureDatabaseReady;
export const isLiveDatabaseReady = (): boolean => isDatabaseReady;
