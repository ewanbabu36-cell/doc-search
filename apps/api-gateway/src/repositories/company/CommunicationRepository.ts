import crypto from 'node:crypto';
import { eq, desc, and } from '@docsearch/database';
import {
  getDatabase,
  contentItems,
  notificationTemplates,
  notificationDispatchRecords
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('communication-repository');

export const DEFAULT_NOTIFICATION_TEMPLATES = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    code: 'PARTNER_ONBOARDING_INVITATION',
    name: 'Healthcare Partner Onboarding Invitation',
    channel: 'EMAIL_NOTIFICATION',
    subjectTemplate: 'Welcome to Doc Search — Complete Onboarding for {{partnerName}}',
    bodyTemplate: 'Dear {{primaryContactName}}, please complete your registration at {{onboardingLink}}.',
    variables: ['partnerName', 'primaryContactName', 'onboardingLink'],
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export class CommunicationRepository {
  async getContentItems(status?: string, dbClient = getDatabase()) {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for content item persistence.',
        statusCode: 500
      });
    }
    try {
      const q = dbClient.select().from(contentItems);
      const results = status
        ? await q.where(eq(contentItems.status, status)).orderBy(desc(contentItems.createdAt))
        : await q.orderBy(desc(contentItems.createdAt));
      return results || [];
    } catch (err) {
      logger.error('Failed to get content items from PostgreSQL:', { error: String(err) });
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Failed to retrieve content items from database.',
        statusCode: 503
      });
    }
  }

  async getContentItemById(id: string, dbClient = getDatabase()) {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for content item lookup.',
        statusCode: 500
      });
    }
    try {
      const results = await dbClient.select().from(contentItems).where(eq(contentItems.id, id as any));
      return results[0] || null;
    } catch (err) {
      logger.error('Failed to get content item by ID from PostgreSQL:', { error: String(err) });
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Failed to retrieve content item from database.',
        statusCode: 503
      });
    }
  }

  async updateContentItemStatus(id: string, status: string, dbClient = getDatabase()) {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for content item update.',
        statusCode: 500
      });
    }
    try {
      const results = await dbClient
        .update(contentItems)
        .set({ status, updatedAt: new Date() })
        .where(eq(contentItems.id, id as any))
        .returning();
      if (!results || results.length === 0) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Content item ${id} not found for status update.`,
          statusCode: 404
        });
      }
      return results[0];
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to update content item status in PostgreSQL:', { error: String(err) });
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Failed to update content item in database.',
        statusCode: 503
      });
    }
  }

  async getTemplates(dbClient = getDatabase()) {
    if (!dbClient) {
      return [...DEFAULT_NOTIFICATION_TEMPLATES];
    }
    try {
      const results = await dbClient.select().from(notificationTemplates).orderBy(desc(notificationTemplates.createdAt));
      if (results && results.length > 0) return results;
    } catch (err) {
      logger.warn('Failed to query notification templates from PostgreSQL:', { error: String(err) });
    }
    return [...DEFAULT_NOTIFICATION_TEMPLATES];
  }

  async getDispatchRecords(
    filters?: { contentItemId?: string; partnerId?: string; status?: string },
    dbClient = getDatabase()
  ) {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for dispatch records lookup.',
        statusCode: 500
      });
    }
    try {
      let q = dbClient.select().from(notificationDispatchRecords);
      const conditions: any[] = [];
      if (filters?.contentItemId) conditions.push(eq(notificationDispatchRecords.contentItemId, filters.contentItemId as any));
      if (filters?.partnerId) conditions.push(eq(notificationDispatchRecords.partnerId, filters.partnerId as any));
      if (filters?.status && filters.status !== 'ALL') conditions.push(eq(notificationDispatchRecords.deliveryStatus, filters.status));

      const results = conditions.length > 0
        ? await q.where(and(...conditions)).orderBy(desc(notificationDispatchRecords.createdAt))
        : await q.orderBy(desc(notificationDispatchRecords.createdAt));

      return results || [];
    } catch (err) {
      logger.error('Failed to query dispatch records from PostgreSQL:', { error: String(err) });
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Failed to query dispatch records from database.',
        statusCode: 503
      });
    }
  }

  async createDispatchRecord(data: any, dbClient = getDatabase()) {
    if (!dbClient) {
      throw new AppError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Database connection required for dispatch record persistence.',
        statusCode: 500
      });
    }
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const id = data.id && isUuid(data.id) ? data.id : crypto.randomUUID();
    const contentItemId = data.contentItemId && isUuid(data.contentItemId) ? data.contentItemId : crypto.randomUUID();
    const partnerId = data.partnerId && isUuid(data.partnerId) ? data.partnerId : null;

    try {
      const results = await dbClient.insert(notificationDispatchRecords).values({
        id: id as any,
        contentItemId: contentItemId as any,
        partnerId: partnerId as any,
        recipientEmail: data.recipientEmail || 'broadcast-distribution@partner.network',
        channel: data.channel || 'IN_APP_BANNER',
        deliveryStatus: data.deliveryStatus || 'DELIVERED',
        dispatchedAt: new Date(),
        deliveredAt: new Date(),
        metadata: data.metadata || {}
      }).returning();

      if (results && results.length > 0) {
        return results[0];
      }
      throw new Error('Insert returned no records');
    } catch (err) {
      logger.error('Failed to persist dispatch record in PostgreSQL:', { error: String(err) });
      throw new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database persistence failed for dispatch record.',
        statusCode: 503
      });
    }
  }
}

export const communicationRepository = new CommunicationRepository();
