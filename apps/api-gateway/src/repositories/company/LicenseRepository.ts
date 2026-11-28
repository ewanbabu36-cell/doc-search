import crypto from 'node:crypto';
import { eq, desc, ensureDatabaseReady, getDatabaseStatus, withSecurityContext } from '@docsearch/database';
import { getDatabase, licenses, type License, type NewLicense } from '@docsearch/database';
import type { SessionContext } from '@docsearch/auth';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { isValidUuid } from '../../utils/uuid-guard.js';

const logger = createLogger('license-repository');

type LicenseDbClient = NonNullable<ReturnType<typeof getDatabase>>;

export class LicenseRepository {
  private async runScoped<T>(
    dbClient: any,
    tenantId: string | null | undefined,
    isSuperAdmin: boolean,
    fn: (tx: LicenseDbClient) => Promise<T>
  ): Promise<T> {
    const rootDb = getDatabase();
    if (dbClient && rootDb && dbClient === rootDb) {
      const scopedSession: SessionContext = {
        userId: '00000000-0000-4000-8000-000000000001',
        tenantId: tenantId && isValidUuid(tenantId) ? tenantId : '00000000-0000-4000-8000-000000000000',
        roles: isSuperAdmin ? ['SUPER_ADMIN'] : [],
        permissions: [],
        dataScope: isSuperAdmin ? 'global' : 'tenant',
        sessionId: 'license-repo-scoped',
        actorEmail: 'system@docsearch.internal',
        isSuperAdmin
      };
      return withSecurityContext(rootDb, scopedSession, (tx) => fn(tx as unknown as LicenseDbClient));
    }
    return fn(dbClient as LicenseDbClient);
  }

  async findMany(dbClient = getDatabase()): Promise<License[]> {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for license querying.',
        statusCode: 500
      });
    }
    try {
      return await this.runScoped(dbClient, null, true, (tx) =>
        tx.select().from(licenses).orderBy(desc(licenses.createdAt))
      );
    } catch (err) {
      logger.error('Failed to query licenses from PostgreSQL:', err);
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database query failed for licenses.',
        statusCode: 503
      });
    }
  }

  async findById(licenseId: string, dbClient = getDatabase()): Promise<License | null> {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for license lookup.',
        statusCode: 500
      });
    }
    try {
      const [lic] = await this.runScoped(dbClient, null, true, (tx) =>
        tx
          .select()
          .from(licenses)
          .where(eq(licenses.id, licenseId))
          .limit(1)
      );
      return lic || null;
    } catch (err) {
      logger.error('Failed to find license by ID from PostgreSQL:', err);
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database query failed for license by ID.',
        statusCode: 503
      });
    }
  }

  async findByKey(licenseKey: string, dbClient = getDatabase()): Promise<License | null> {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for license lookup.',
        statusCode: 500
      });
    }
    try {
      const [lic] = await this.runScoped(dbClient, null, true, (tx) =>
        tx
          .select()
          .from(licenses)
          .where(eq(licenses.licenseKey, licenseKey))
          .limit(1)
      );
      return lic || null;
    } catch (err) {
      logger.error('Failed to find license by key from PostgreSQL:', err);
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database query failed for license by key.',
        statusCode: 503
      });
    }
  }

  async findBySubscriptionId(subscriptionId: string, dbClient = getDatabase()): Promise<License | null> {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for license lookup.',
        statusCode: 500
      });
    }
    try {
      const [lic] = await this.runScoped(dbClient, null, true, (tx) =>
        tx
          .select()
          .from(licenses)
          .where(eq(licenses.subscriptionId, subscriptionId))
          .orderBy(desc(licenses.createdAt))
          .limit(1)
      );
      return lic || null;
    } catch (err) {
      logger.error('Failed to find license by subscription ID from PostgreSQL:', err);
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database query failed for license by subscription ID.',
        statusCode: 503
      });
    }
  }

  async findByPartnerId(partnerId: string, dbClient = getDatabase()): Promise<License[]> {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for license lookup.',
        statusCode: 500
      });
    }
    try {
      return await this.runScoped(dbClient, null, true, (tx) =>
        tx
          .select()
          .from(licenses)
          .where(eq(licenses.partnerId, partnerId))
          .orderBy(desc(licenses.createdAt))
      );
    } catch (err) {
      logger.error('Failed to find licenses by partner ID from PostgreSQL:', err);
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database query failed for licenses by partner ID.',
        statusCode: 503
      });
    }
  }

  async findByTenantId(tenantId: string, dbClient = getDatabase()): Promise<License[]> {
    if (!isValidUuid(tenantId)) {
      return [];
    }
    let client = dbClient;
    if (!getDatabaseStatus().ready) {
      try {
        client = await ensureDatabaseReady();
      } catch {}
    }
    if (!client) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database client unavailable for license lookup.',
        statusCode: 500
      });
    }
    try {
      return await this.runScoped(client, tenantId, false, (tx) =>
        tx
          .select()
          .from(licenses)
          .where(eq(licenses.tenantId, tenantId))
          .orderBy(desc(licenses.createdAt))
      );
    } catch (err) {
      logger.error('Failed to find licenses by tenant ID from PostgreSQL:', err);
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database query failed for licenses by tenant ID.',
        statusCode: 503
      });
    }
  }

  async create(data: NewLicense, dbClient = getDatabase()): Promise<License> {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database client required for license creation.',
        statusCode: 500
      });
    }
    const id = data.id || crypto.randomUUID();
    const now = new Date();
    try {
      const [created] = await this.runScoped(dbClient, data.tenantId, !data.tenantId, (tx) =>
        tx
          .insert(licenses)
          .values({
            ...data,
            id,
            createdAt: (data as any).createdAt || now,
            updatedAt: (data as any).updatedAt || now
          })
          .returning()
      );

      if (!created) {
        throw new Error('Insert license returned no rows');
      }
      return created;
    } catch (err) {
      logger.error('Failed to persist license in PostgreSQL:', err);
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database persistence failed. License creation aborted.',
        statusCode: 503
      });
    }
  }

  async update(licenseId: string, data: Partial<NewLicense>, dbClient = getDatabase()): Promise<License> {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database client required for license update.',
        statusCode: 500
      });
    }
    try {
      const [updated] = await this.runScoped(dbClient, data.tenantId, !data.tenantId, (tx) =>
        tx
          .update(licenses)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(licenses.id, licenseId))
          .returning()
      );

      if (!updated) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `License ${licenseId} not found for update.`,
          statusCode: 404
        });
      }
      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Failed to update license ${licenseId} in PostgreSQL:`, err);
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: `Database update failed for license ${licenseId}.`,
        statusCode: 503
      });
    }
  }
}

export const licenseRepository = new LicenseRepository();
