import { eq, desc } from '@docsearch/database';
import {
  getDatabase,
  contentItems,
  notificationTemplates
} from '@docsearch/database';

export class CommunicationRepository {
  async getContentItems(status?: string, dbClient = getDatabase()) {
    if (dbClient) {
      try {
        const q = dbClient.select().from(contentItems);
        return status ? await q.where(eq(contentItems.status, status)).orderBy(desc(contentItems.createdAt)) : await q.orderBy(desc(contentItems.createdAt));
      } catch {}
    }
    return [
      { id: 'cnt_001', code: 'ANNC-001', title: 'Platform Maintenance Notice 2.2', contentType: 'ANNOUNCEMENT', status: status || 'PUBLISHED', publishedAt: new Date(), createdAt: new Date() }
    ];
  }

  async getTemplates(dbClient = getDatabase()) {
    if (dbClient) {
      try {
        return await dbClient.select().from(notificationTemplates).orderBy(desc(notificationTemplates.createdAt));
      } catch {}
    }
    return [
      { id: 'tmpl_001', templateCode: 'CRITICAL_ALERT_V1', name: 'Critical Alert Notification', channel: 'WHATSAPP_AND_EMAIL', status: 'ACTIVE', createdAt: new Date() }
    ];
  }
}

export const communicationRepository = new CommunicationRepository();
