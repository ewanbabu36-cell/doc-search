import type {
  ContentItemDto,
  ContentType,
  ContentStatus,
  NotificationTemplateDto,
  DispatchRecordDto,
  DeliveryStatus,
  TransitionContentStatusRequest,
  TriggerDispatchRequest
} from '@docsearch/api-contracts';
import {
  mockContentItems,
  mockNotificationTemplates,
  mockDispatchRecords
} from './mock-communication-data.js';
import { apiCall, isMockFallbackAllowed } from './api-client.js';

export interface ContentFilters {
  type?: ContentType | 'ALL' | undefined;
  status?: ContentStatus | 'ALL' | undefined;
  search?: string | undefined;
}

export interface DispatchFilters {
  contentItemId?: string | undefined;
  partnerId?: string | undefined;
  status?: DeliveryStatus | 'ALL' | undefined;
}

export interface ICommunicationService {
  getContentItems(filters?: ContentFilters): Promise<ContentItemDto[]>;
  getContentItemById(id: string): Promise<ContentItemDto | null>;
  transitionContentStatus(
    id: string,
    req: TransitionContentStatusRequest,
    actorEmail?: string
  ): Promise<ContentItemDto>;
  getNotificationTemplates(): Promise<NotificationTemplateDto[]>;
  getDispatchRecords(filters?: DispatchFilters): Promise<DispatchRecordDto[]>;
  triggerDispatch(req: TriggerDispatchRequest, actorEmail?: string): Promise<DispatchRecordDto>;
}

export class CommunicationService implements ICommunicationService {
  private items: ContentItemDto[] = [...mockContentItems];
  private templates: NotificationTemplateDto[] = [...mockNotificationTemplates];
  private dispatches: DispatchRecordDto[] = [...mockDispatchRecords];

  constructor(_apiUrl?: string | undefined) {}

  async getContentItems(filters?: ContentFilters): Promise<ContentItemDto[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== 'ALL') params.set('type', filters.type);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      const endpoint = `/api/v1/company/communication/items${qs ? `?${qs}` : ''}`;
      return await apiCall<ContentItemDto[]>(endpoint);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      let result = [...this.items];
      if (filters?.type && filters.type !== 'ALL') {
        result = result.filter((i) => i.type === filters.type);
      }
      if (filters?.status && filters.status !== 'ALL') {
        result = result.filter((i) => i.status === filters.status);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.slug.toLowerCase().includes(q) ||
            i.summary.toLowerCase().includes(q)
        );
      }
      return result;
    }
  }

  async getContentItemById(id: string): Promise<ContentItemDto | null> {
    try {
      return await apiCall<ContentItemDto>(`/api/v1/company/communication/items/${id}`);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      const item = this.items.find((i) => i.id === id);
      return item ? { ...item } : null;
    }
  }

  async transitionContentStatus(
    id: string,
    req: TransitionContentStatusRequest,
    _actorEmail = 'comms.lead@docsearch.internal'
  ): Promise<ContentItemDto> {
    try {
      return await apiCall<ContentItemDto>(`/api/v1/company/communication/items/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      const idx = this.items.findIndex((i) => i.id === id);
      const current = this.items[idx];
      if (idx === -1 || !current) throw new Error(`Content item ${id} not found`);

      const updated: ContentItemDto = {
        ...current,
        status: req.toStatus,
        publishedAt: req.toStatus === 'PUBLISHED' ? new Date().toISOString() : current.publishedAt,
        updatedAt: new Date().toISOString()
      };
      this.items[idx] = updated;
      return { ...updated };
    }
  }

  async getNotificationTemplates(): Promise<NotificationTemplateDto[]> {
    try {
      return await apiCall<NotificationTemplateDto[]>('/api/v1/company/communication/templates');
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      return [...this.templates];
    }
  }

  async getDispatchRecords(filters?: DispatchFilters): Promise<DispatchRecordDto[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.contentItemId) params.set('contentItemId', filters.contentItemId);
      if (filters?.partnerId) params.set('partnerId', filters.partnerId);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      const qs = params.toString();
      const endpoint = `/api/v1/company/communication/dispatches${qs ? `?${qs}` : ''}`;
      return await apiCall<DispatchRecordDto[]>(endpoint);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      let result = [...this.dispatches];
      if (filters?.contentItemId) {
        result = result.filter((d) => d.contentItemId === filters.contentItemId);
      }
      if (filters?.partnerId) {
        result = result.filter((d) => d.partnerId === filters.partnerId);
      }
      if (filters?.status && filters.status !== 'ALL') {
        result = result.filter((d) => d.deliveryStatus === filters.status);
      }
      return result;
    }
  }

  async triggerDispatch(
    req: TriggerDispatchRequest,
    _actorEmail = 'comms.lead@docsearch.internal'
  ): Promise<DispatchRecordDto> {
    try {
      return await apiCall<DispatchRecordDto>('/api/v1/company/communication/dispatch', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      const item = this.items.find((i) => i.id === req.contentItemId);
      const newRecord: DispatchRecordDto = {
        id: `disp-${Date.now()}`,
        contentItemId: req.contentItemId,
        contentItemTitle: item ? item.title : 'Platform Broadcast',
        recipientEmail: 'broadcast-distribution@partner.network',
        channel: req.channel,
        deliveryStatus: 'DELIVERED',
        dispatchedAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        metadata: {},
        createdAt: new Date().toISOString()
      };
      this.dispatches.unshift(newRecord);
      return { ...newRecord };
    }
  }
}

export const communicationService = new CommunicationService();
