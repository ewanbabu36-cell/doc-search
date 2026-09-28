import { eq, desc, and } from '@docsearch/database';
import {
  getDatabase,
  contentItems,
  notificationTemplates,
  notificationDispatchRecords
} from '@docsearch/database';

export const DEFAULT_NOTIFICATION_TEMPLATES = [
  {
    id: 'tmpl-001',
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
  private inMemoryDispatches: any[] = [];
  private inMemoryItems: any[] = [];

  async getContentItems(status?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(contentItems);
        const results = status
          ? await q.where(eq(contentItems.status, status)).orderBy(desc(contentItems.createdAt))
          : await q.orderBy(desc(contentItems.createdAt));
        if (results && results.length > 0) return results;
      } catch {}
    }
    return status
      ? this.inMemoryItems.filter((i) => i.status === status)
      : [...this.inMemoryItems];
  }

  async getContentItemById(id: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const results = await dbClient.select().from(contentItems).where(eq(contentItems.id, id as any));
        if (results && results.length > 0) return results[0];
      } catch {}
    }
    return this.inMemoryItems.find((i) => i.id === id) || null;
  }

  async updateContentItemStatus(id: string, status: string, dbClient = getDatabase()) {
    const now = new Date().toISOString();
    if (dbClient) {
      try {
        const results = await dbClient
          .update(contentItems)
          .set({ status, updatedAt: new Date() })
          .where(eq(contentItems.id, id as any))
          .returning();
        if (results && results.length > 0) return results[0];
      } catch {}
    }
    const idx = this.inMemoryItems.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.inMemoryItems[idx] = {
        ...this.inMemoryItems[idx],
        status,
        updatedAt: now
      };
      return this.inMemoryItems[idx];
    }
    return { id, status, updatedAt: now };
  }

  async getTemplates(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const results = await dbClient.select().from(notificationTemplates).orderBy(desc(notificationTemplates.createdAt));
        if (results && results.length > 0) return results;
      } catch {}
    }
    return [...DEFAULT_NOTIFICATION_TEMPLATES];
  }

  async getDispatchRecords(
    filters?: { contentItemId?: string; partnerId?: string; status?: string },
    dbClient = getDatabase()
  ) {
    if (dbClient) {
      try {
        let q = dbClient.select().from(notificationDispatchRecords);
        const conditions: any[] = [];
        if (filters?.contentItemId) conditions.push(eq(notificationDispatchRecords.contentItemId, filters.contentItemId as any));
        if (filters?.partnerId) conditions.push(eq(notificationDispatchRecords.partnerId, filters.partnerId as any));
        if (filters?.status && filters.status !== 'ALL') conditions.push(eq(notificationDispatchRecords.deliveryStatus, filters.status));

        const results = conditions.length > 0
          ? await q.where(and(...conditions)).orderBy(desc(notificationDispatchRecords.createdAt))
          : await q.orderBy(desc(notificationDispatchRecords.createdAt));

        if (results) return results;
      } catch {}
    }
    let res = [...this.inMemoryDispatches];
    if (filters?.contentItemId) res = res.filter((d) => d.contentItemId === filters.contentItemId);
    if (filters?.partnerId) res = res.filter((d) => d.partnerId === filters.partnerId);
    if (filters?.status && filters.status !== 'ALL') res = res.filter((d) => d.deliveryStatus === filters.status);
    return res;
  }

  async createDispatchRecord(data: any, dbClient = getDatabase()) {
    const now = new Date().toISOString();
    const record = {
      id: data.id || `disp-${Date.now()}`,
      contentItemId: data.contentItemId,
      contentItemTitle: data.contentItemTitle || 'Platform Broadcast',
      partnerId: data.partnerId || null,
      recipientEmail: data.recipientEmail || 'broadcast-distribution@partner.network',
      channel: data.channel || 'IN_APP_BANNER',
      deliveryStatus: 'DELIVERED',
      dispatchedAt: now,
      deliveredAt: now,
      failureReason: null,
      metadata: data.metadata || {},
      createdAt: now
    };

    if (dbClient) {
      try {
        const results = await dbClient.insert(notificationDispatchRecords).values({
          id: record.id as any,
          contentItemId: record.contentItemId as any,
          partnerId: record.partnerId as any,
          recipientEmail: record.recipientEmail,
          channel: record.channel,
          deliveryStatus: record.deliveryStatus,
          dispatchedAt: new Date(),
          deliveredAt: new Date(),
          metadata: record.metadata
        }).returning();
        if (results && results.length > 0) return results[0];
      } catch {}
    }

    this.inMemoryDispatches.unshift(record);
    return record;
  }
}

export const communicationRepository = new CommunicationRepository();

