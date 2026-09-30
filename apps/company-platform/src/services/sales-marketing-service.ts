import type {
  LeadDto,
  LeadStatus,
  OpportunityDto,
  OpportunityStage,
  CampaignDto,
  CampaignStatus,
  MarketingActivityDto,
  SalesTaskDto,
  TaskStatus,
  TransitionLeadRequest,
  TransitionOpportunityRequest
} from '@docsearch/api-contracts';
import {
  mockLeads,
  mockOpportunities,
  mockCampaigns,
  mockMarketingActivities,
  mockSalesTasks
} from './mock-sales-marketing-data.js';
import { apiCall, isMockFallbackAllowed } from './api-client.js';

export interface LeadFilters {
  status?: LeadStatus | 'ALL' | undefined;
  search?: string | undefined;
}

export interface OpportunityFilters {
  stage?: OpportunityStage | 'ALL' | undefined;
  partnerId?: string | undefined;
  search?: string | undefined;
}

export interface CampaignFilters {
  status?: CampaignStatus | 'ALL' | undefined;
  search?: string | undefined;
}

export interface TaskFilters {
  status?: TaskStatus | 'ALL' | undefined;
  assignedUserEmail?: string | undefined;
}

export interface ISalesMarketingService {
  getLeads(filters?: LeadFilters): Promise<LeadDto[]>;
  getLeadById(id: string): Promise<LeadDto | null>;
  createLead(leadData: {
    organizationName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    contactRoleTitle?: string;
    source?: string;
    status?: string;
    assignedOwnerEmail?: string;
    notes?: string;
    metadata?: Record<string, any>;
  }): Promise<LeadDto>;
  transitionLead(id: string, req: TransitionLeadRequest, actorEmail?: string): Promise<LeadDto>;
  getOpportunities(filters?: OpportunityFilters): Promise<OpportunityDto[]>;
  getOpportunityById(id: string): Promise<OpportunityDto | null>;
  transitionOpportunity(
    id: string,
    req: TransitionOpportunityRequest,
    actorEmail?: string
  ): Promise<OpportunityDto>;
  getCampaigns(filters?: CampaignFilters): Promise<CampaignDto[]>;
  getCampaignById(id: string): Promise<CampaignDto | null>;
  getMarketingActivities(filters?: { campaignId?: string; partnerId?: string; leadId?: string }): Promise<MarketingActivityDto[]>;
  getSalesTasks(filters?: TaskFilters): Promise<SalesTaskDto[]>;
  completeSalesTask(id: string): Promise<SalesTaskDto>;
}

export class SalesMarketingService implements ISalesMarketingService {
  private readonly apiUrl?: string | undefined;
  private leads: LeadDto[] = [...mockLeads];
  private opportunities: OpportunityDto[] = [...mockOpportunities];
  private campaigns: CampaignDto[] = [...mockCampaigns];
  private activities: MarketingActivityDto[] = [...mockMarketingActivities];
  private tasks: SalesTaskDto[] = [...mockSalesTasks];

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl;
  }

  async getLeads(filters?: LeadFilters): Promise<LeadDto[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      const endpoint = `/api/v1/company/sales/leads${qs ? `?${qs}` : ''}`;
      return await apiCall<LeadDto[]>(endpoint);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      let result = [...this.leads];
      if (filters?.status && filters.status !== 'ALL') {
        result = result.filter((l) => l.status === filters.status);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(
          (l) =>
            l.organizationName.toLowerCase().includes(q) ||
            l.contactName.toLowerCase().includes(q) ||
            l.contactEmail.toLowerCase().includes(q)
        );
      }
      return result;
    }
  }

  async getLeadById(id: string): Promise<LeadDto | null> {
    try {
      return await apiCall<LeadDto>(`/api/v1/company/sales/leads/${id}`);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      const lead = this.leads.find((l) => l.id === id);
      return lead ? { ...lead } : null;
    }
  }

  async createLead(leadData: {
    organizationName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    contactRoleTitle?: string;
    source?: string;
    status?: string;
    assignedOwnerEmail?: string;
    notes?: string;
    metadata?: Record<string, any>;
  }): Promise<LeadDto> {
    try {
      const created = await apiCall<LeadDto>('/api/v1/company/sales/leads', {
        method: 'POST',
        body: JSON.stringify(leadData)
      });
      if (created) {
        this.leads.unshift(created);
        return created;
      }
    } catch (err) {
      console.warn('POST /api/v1/company/sales/leads failed, creating locally:', err);
    }
    const localLead: LeadDto = {
      id: crypto.randomUUID(),
      organizationName: leadData.organizationName,
      contactName: leadData.contactName,
      contactEmail: leadData.contactEmail,
      contactPhone: leadData.contactPhone || '+91 98000 00000',
      contactRoleTitle: leadData.contactRoleTitle,
      source: (leadData.source as any) || 'INBOUND_WEB',
      status: (leadData.status as any) || 'NEW',
      assignedOwnerEmail: leadData.assignedOwnerEmail || 'sales.lead@docsearch.internal',
      notes: leadData.notes,
      metadata: leadData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.leads.unshift(localLead);
    return localLead;
  }

  async transitionLead(
    id: string,
    req: TransitionLeadRequest,
    _actorEmail = 'sales.lead@docsearch.internal'
  ): Promise<LeadDto> {
    try {
      return await apiCall<LeadDto>(`/api/v1/company/sales/leads/${id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ status: req.toStatus, notes: req.reason })
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      const idx = this.leads.findIndex((l) => l.id === id);
      const current = this.leads[idx];
      if (idx === -1 || !current) throw new Error(`Lead ${id} not found`);

      const updated: LeadDto = {
        ...current,
        status: req.toStatus,
        lastActivityDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.leads[idx] = updated;
      return { ...updated };
    }
  }

  async getOpportunities(filters?: OpportunityFilters): Promise<OpportunityDto[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.stage && filters.stage !== 'ALL') params.set('stage', filters.stage);
      if (filters?.partnerId) params.set('partnerId', filters.partnerId);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      const endpoint = `/api/v1/company/sales/opportunities${qs ? `?${qs}` : ''}`;
      return await apiCall<OpportunityDto[]>(endpoint);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      let result = [...this.opportunities];
      if (filters?.stage && filters.stage !== 'ALL') {
        result = result.filter((o) => o.stage === filters.stage);
      }
      if (filters?.partnerId) {
        result = result.filter((o) => o.partnerId === filters.partnerId);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(
          (o) =>
            o.name.toLowerCase().includes(q) ||
            (o.partnerTradeName && o.partnerTradeName.toLowerCase().includes(q))
        );
      }
      return result;
    }
  }

  async getOpportunityById(id: string): Promise<OpportunityDto | null> {
    try {
      return await apiCall<OpportunityDto>(`/api/v1/company/sales/opportunities/${id}`);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      const opp = this.opportunities.find((o) => o.id === id);
      return opp ? { ...opp } : null;
    }
  }

  async transitionOpportunity(
    id: string,
    req: TransitionOpportunityRequest,
    _actorEmail = 'sales.lead@docsearch.internal'
  ): Promise<OpportunityDto> {
    try {
      return await apiCall<OpportunityDto>(`/api/v1/company/sales/opportunities/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      const idx = this.opportunities.findIndex((o) => o.id === id);
      const current = this.opportunities[idx];
      if (idx === -1 || !current) throw new Error(`Opportunity ${id} not found`);

      const updated: OpportunityDto = {
        ...current,
        stage: req.toStage,
        lostReason: req.toStage === 'LOST' ? req.reason : current.lostReason,
        updatedAt: new Date().toISOString()
      };
      this.opportunities[idx] = updated;
      return { ...updated };
    }
  }

  async getCampaigns(filters?: CampaignFilters): Promise<CampaignDto[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      const endpoint = `/api/v1/company/marketing/campaigns${qs ? `?${qs}` : ''}`;
      return await apiCall<CampaignDto[]>(endpoint);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;

      let result = [...this.campaigns];
      if (filters?.status && filters.status !== 'ALL') {
        result = result.filter((c) => c.status === filters.status);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.targetSegment.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        );
      }
      return result;
    }
  }

  async getCampaignById(id: string): Promise<CampaignDto | null> {
    try {
      return await apiCall<CampaignDto>(`/api/v1/company/marketing/campaigns/${id}`);
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      const camp = this.campaigns.find((c) => c.id === id);
      return camp ? { ...camp } : null;
    }
  }

  async getMarketingActivities(filters?: {
    campaignId?: string;
    partnerId?: string;
    leadId?: string;
  }): Promise<MarketingActivityDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.campaignId) params.set('campaignId', filters.campaignId);
      if (filters?.partnerId) params.set('partnerId', filters.partnerId);
      if (filters?.leadId) params.set('leadId', filters.leadId);
      const res = await fetch(`${this.apiUrl}/api/v1/company/marketing/activities?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch marketing activities: ${res.statusText}`);
      return (await res.json()) as MarketingActivityDto[];
    }

    let result = [...this.activities];
    if (filters?.campaignId) {
      result = result.filter((a) => a.campaignId === filters.campaignId);
    }
    if (filters?.partnerId) {
      result = result.filter((a) => a.partnerId === filters.partnerId);
    }
    if (filters?.leadId) {
      result = result.filter((a) => a.leadId === filters.leadId);
    }
    return result;
  }

  async getSalesTasks(filters?: TaskFilters): Promise<SalesTaskDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.assignedUserEmail) params.set('assignedUserEmail', filters.assignedUserEmail);
      const res = await fetch(`${this.apiUrl}/api/v1/company/sales/tasks?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch sales tasks: ${res.statusText}`);
      return (await res.json()) as SalesTaskDto[];
    }

    let result = [...this.tasks];
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.assignedUserEmail) {
      result = result.filter((t) => t.assignedUserEmail === filters.assignedUserEmail);
    }
    return result;
  }

  async completeSalesTask(id: string): Promise<SalesTaskDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/sales/tasks/${id}/complete`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`Failed to complete task: ${res.statusText}`);
      return (await res.json()) as SalesTaskDto;
    }

    const idx = this.tasks.findIndex((t) => t.id === id);
    const current = this.tasks[idx];
    if (idx === -1 || !current) throw new Error(`Task ${id} not found`);

    const updated: SalesTaskDto = {
      ...current,
      status: 'COMPLETED',
      completionDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks[idx] = updated;
    return { ...updated };
  }
}

export const salesMarketingService = new SalesMarketingService();
