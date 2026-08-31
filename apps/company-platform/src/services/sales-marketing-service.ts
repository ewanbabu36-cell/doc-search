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
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const res = await fetch(`${this.apiUrl}/api/v1/company/sales/leads?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch leads: ${res.statusText}`);
      return (await res.json()) as LeadDto[];
    }

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

  async getLeadById(id: string): Promise<LeadDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/sales/leads/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch lead: ${res.statusText}`);
      return (await res.json()) as LeadDto;
    }
    const lead = this.leads.find((l) => l.id === id);
    return lead ? { ...lead } : null;
  }

  async transitionLead(
    id: string,
    req: TransitionLeadRequest,
    _actorEmail = 'sales.lead@docsearch.internal'
  ): Promise<LeadDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/sales/leads/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to transition lead: ${res.statusText}`);
      return (await res.json()) as LeadDto;
    }

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

  async getOpportunities(filters?: OpportunityFilters): Promise<OpportunityDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.stage && filters.stage !== 'ALL') params.set('stage', filters.stage);
      if (filters?.partnerId) params.set('partnerId', filters.partnerId);
      if (filters?.search) params.set('search', filters.search);
      const res = await fetch(`${this.apiUrl}/api/v1/company/sales/opportunities?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch opportunities: ${res.statusText}`);
      return (await res.json()) as OpportunityDto[];
    }

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

  async getOpportunityById(id: string): Promise<OpportunityDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/sales/opportunities/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch opportunity: ${res.statusText}`);
      return (await res.json()) as OpportunityDto;
    }
    const opp = this.opportunities.find((o) => o.id === id);
    return opp ? { ...opp } : null;
  }

  async transitionOpportunity(
    id: string,
    req: TransitionOpportunityRequest,
    _actorEmail = 'sales.lead@docsearch.internal'
  ): Promise<OpportunityDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/sales/opportunities/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to transition opportunity: ${res.statusText}`);
      return (await res.json()) as OpportunityDto;
    }

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

  async getCampaigns(filters?: CampaignFilters): Promise<CampaignDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const res = await fetch(`${this.apiUrl}/api/v1/company/marketing/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch campaigns: ${res.statusText}`);
      return (await res.json()) as CampaignDto[];
    }

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

  async getCampaignById(id: string): Promise<CampaignDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/marketing/campaigns/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch campaign: ${res.statusText}`);
      return (await res.json()) as CampaignDto;
    }
    const camp = this.campaigns.find((c) => c.id === id);
    return camp ? { ...camp } : null;
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
