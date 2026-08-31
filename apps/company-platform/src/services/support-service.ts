import type {
  SupportTicketDto,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketCommentDto,
  PartnerHealthDto,
  SuccessCheckinDto,
  TransitionTicketRequest,
  CreateTicketCommentRequest
} from '@docsearch/api-contracts';
import {
  mockSupportTickets,
  mockTicketComments,
  mockPartnerHealth,
  mockSuccessCheckins
} from './mock-support-data.js';

export interface TicketFilters {
  status?: TicketStatus | 'ALL' | undefined;
  priority?: TicketPriority | 'ALL' | undefined;
  category?: TicketCategory | 'ALL' | undefined;
  partnerId?: string | undefined;
  search?: string | undefined;
}

export interface ISupportService {
  getTickets(filters?: TicketFilters): Promise<SupportTicketDto[]>;
  getTicketById(id: string): Promise<SupportTicketDto | null>;
  getTicketComments(ticketId: string): Promise<TicketCommentDto[]>;
  addTicketComment(
    req: CreateTicketCommentRequest,
    authorEmail?: string,
    authorName?: string
  ): Promise<TicketCommentDto>;
  transitionTicket(
    id: string,
    req: TransitionTicketRequest,
    actorEmail?: string
  ): Promise<SupportTicketDto>;
  getPartnerHealth(partnerId?: string): Promise<PartnerHealthDto[]>;
  getSuccessCheckins(partnerId?: string): Promise<SuccessCheckinDto[]>;
}

export class SupportService implements ISupportService {
  private readonly apiUrl?: string | undefined;
  private tickets: SupportTicketDto[] = [...mockSupportTickets];
  private comments: TicketCommentDto[] = [...mockTicketComments];
  private healthProfiles: PartnerHealthDto[] = [...mockPartnerHealth];
  private checkins: SuccessCheckinDto[] = [...mockSuccessCheckins];

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl;
  }

  async getTickets(filters?: TicketFilters): Promise<SupportTicketDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.priority && filters.priority !== 'ALL') params.set('priority', filters.priority);
      if (filters?.category && filters.category !== 'ALL') params.set('category', filters.category);
      if (filters?.partnerId) params.set('partnerId', filters.partnerId);
      if (filters?.search) params.set('search', filters.search);
      const res = await fetch(`${this.apiUrl}/api/v1/company/support/tickets?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch support tickets: ${res.statusText}`);
      return (await res.json()) as SupportTicketDto[];
    }

    let result = [...this.tickets];
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'ALL') {
      result = result.filter((t) => t.category === filters.category);
    }
    if (filters?.partnerId) {
      result = result.filter((t) => t.partnerId === filters.partnerId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.partnerTradeName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }

  async getTicketById(id: string): Promise<SupportTicketDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/support/tickets/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch ticket: ${res.statusText}`);
      return (await res.json()) as SupportTicketDto;
    }
    const ticket = this.tickets.find((t) => t.id === id);
    return ticket ? { ...ticket } : null;
  }

  async getTicketComments(ticketId: string): Promise<TicketCommentDto[]> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/support/tickets/${ticketId}/comments`);
      if (!res.ok) throw new Error(`Failed to fetch ticket comments: ${res.statusText}`);
      return (await res.json()) as TicketCommentDto[];
    }
    return this.comments.filter((c) => c.ticketId === ticketId);
  }

  async addTicketComment(
    req: CreateTicketCommentRequest,
    authorEmail = 'csm.lead@docsearch.internal',
    authorName = 'Customer Success Lead'
  ): Promise<TicketCommentDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/support/tickets/${req.ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to create comment: ${res.statusText}`);
      return (await res.json()) as TicketCommentDto;
    }

    const newComment: TicketCommentDto = {
      id: `tcom-${Date.now()}`,
      ticketId: req.ticketId,
      authorEmail,
      authorName,
      isInternalOnly: req.isInternalOnly,
      content: req.content,
      createdAt: new Date().toISOString()
    };
    this.comments.push(newComment);
    return { ...newComment };
  }

  async transitionTicket(
    id: string,
    req: TransitionTicketRequest,
    _actorEmail = 'csm.lead@docsearch.internal'
  ): Promise<SupportTicketDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/support/tickets/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to transition ticket: ${res.statusText}`);
      return (await res.json()) as SupportTicketDto;
    }

    const idx = this.tickets.findIndex((t) => t.id === id);
    const current = this.tickets[idx];
    if (idx === -1 || !current) throw new Error(`Ticket ${id} not found`);

    const updated: SupportTicketDto = {
      ...current,
      status: req.toStatus,
      resolutionNotes: req.toStatus === 'RESOLVED' || req.toStatus === 'CLOSED' ? req.resolutionNotes ?? req.reason : current.resolutionNotes,
      resolvedDate: req.toStatus === 'RESOLVED' || req.toStatus === 'CLOSED' ? new Date().toISOString() : current.resolvedDate,
      updatedAt: new Date().toISOString()
    };
    this.tickets[idx] = updated;
    return { ...updated };
  }

  async getPartnerHealth(partnerId?: string): Promise<PartnerHealthDto[]> {
    if (this.apiUrl) {
      const url = partnerId
        ? `${this.apiUrl}/api/v1/company/support/partner-health?partnerId=${partnerId}`
        : `${this.apiUrl}/api/v1/company/support/partner-health`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch partner health: ${res.statusText}`);
      return (await res.json()) as PartnerHealthDto[];
    }

    if (partnerId) {
      return this.healthProfiles.filter((h) => h.partnerId === partnerId);
    }
    return [...this.healthProfiles];
  }

  async getSuccessCheckins(partnerId?: string): Promise<SuccessCheckinDto[]> {
    if (this.apiUrl) {
      const url = partnerId
        ? `${this.apiUrl}/api/v1/company/support/checkins?partnerId=${partnerId}`
        : `${this.apiUrl}/api/v1/company/support/checkins`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch success checkins: ${res.statusText}`);
      return (await res.json()) as SuccessCheckinDto[];
    }

    if (partnerId) {
      return this.checkins.filter((c) => c.partnerId === partnerId);
    }
    return [...this.checkins];
  }
}

export const supportService = new SupportService();
