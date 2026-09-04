import type {
  PartnerProfileDto,
  PartnerTransitionHistoryDto,
  PartnerTransitionRequest,
  PartnerLifecycleStatus,
  PartnerType,
  PartnerClassificationDto
} from '@docsearch/api-contracts';
import { mockPartnerProfiles, mockPartnerTransitionHistory } from './mock-partner-data.js';

export const CANONICAL_PARTNER_CLASSIFICATIONS: PartnerClassificationDto[] = [
  {
    code: 'HOSPITAL_NETWORK',
    label: 'Hospital Network',
    description: 'Multi-specialty tertiary or secondary care hospital network',
    category: 'HEALTHCARE_PROVIDER',
    icon: '🏥',
    defaultPlanCode: 'PLAN_HOSPITAL_PRO',
    status: 'ACTIVE',
    sortOrder: 1
  },
  {
    code: 'CLINIC_GROUP',
    label: 'Clinic Group / Polyclinic',
    description: 'Outpatient primary and multi-specialty care clinics',
    category: 'HEALTHCARE_PROVIDER',
    icon: '🩺',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    status: 'ACTIVE',
    sortOrder: 2
  },
  {
    code: 'PHARMACY',
    label: 'Independent Pharmacy Store (Chemist & Druggist)',
    description: 'Retail allopathic medication dispensing and inventory store',
    category: 'RETAIL_HEALTHCARE',
    icon: '💊',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    status: 'ACTIVE',
    sortOrder: 3
  },
  {
    code: 'DIAGNOSTIC_LAB',
    label: 'Diagnostic Pathology Lab',
    description: 'NABL accredited pathology and clinical diagnostics',
    category: 'DIAGNOSTICS',
    icon: '🧪',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    status: 'ACTIVE',
    sortOrder: 4
  },
  {
    code: 'SURGICAL_CENTER',
    label: 'Surgical Center',
    description: 'Ambulatory day care and day-surgery pavilion',
    category: 'HEALTHCARE_PROVIDER',
    icon: '🏥',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    status: 'ACTIVE',
    sortOrder: 5
  },
  {
    code: 'INDIVIDUAL_PRACTICE',
    label: 'Individual Specialist Practice',
    description: 'Solo physician outpatient consulting room',
    category: 'HEALTHCARE_PROVIDER',
    icon: '👨‍⚕️',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    status: 'ACTIVE',
    sortOrder: 6
  }
];

export interface PartnerListFilters {
  search?: string | undefined;
  status?: PartnerLifecycleStatus | 'ALL' | undefined;
  partnerType?: PartnerType | 'ALL' | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface PartnerListResponse {
  items: PartnerProfileDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IPartnerService {
  getPartners(filters?: PartnerListFilters): Promise<PartnerListResponse>;
  getPartnerById(id: string): Promise<PartnerProfileDto | null>;
  getPartnerHistory(id: string): Promise<PartnerTransitionHistoryDto[]>;
  transitionLifecycle(
    id: string,
    req: PartnerTransitionRequest,
    actorEmail?: string
  ): Promise<PartnerProfileDto>;
  getClassifications(): Promise<PartnerClassificationDto[]>;
  addClassification(classification: PartnerClassificationDto): Promise<PartnerClassificationDto>;
}

export class PartnerService implements IPartnerService {
  private readonly apiUrl?: string | undefined;
  private classifications: PartnerClassificationDto[] = (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_partner_classifications');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return [...CANONICAL_PARTNER_CLASSIFICATIONS];
  })();
  private partners: PartnerProfileDto[] = (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_custom_partners');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return [...mockPartnerProfiles];
  })();
  private history: Record<string, PartnerTransitionHistoryDto[]> = { ...mockPartnerTransitionHistory };

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl;
  }

  async getClassifications(): Promise<PartnerClassificationDto[]> {
    try {
      const res = await fetch('/api/v1/company/partner-classifications');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          this.classifications = json.data;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('docsearch_partner_classifications', JSON.stringify(this.classifications));
            } catch {}
          }
          return [...this.classifications];
        }
      }
    } catch {
      // Fallback
    }
    return [...this.classifications];
  }

  async addClassification(classification: PartnerClassificationDto): Promise<PartnerClassificationDto> {
    try {
      const res = await fetch('/api/v1/company/partner-classifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classification)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.classifications = [...this.classifications, json.data];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('docsearch_partner_classifications', JSON.stringify(this.classifications));
            } catch {}
          }
          return json.data;
        }
      }
    } catch {}

    const created: PartnerClassificationDto = {
      ...classification,
      id: crypto.randomUUID(),
      sortOrder: this.classifications.length + 1
    };
    this.classifications = [...this.classifications, created];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_partner_classifications', JSON.stringify(this.classifications));
      } catch {}
    }
    return created;
  }

  addPartner(partner: PartnerProfileDto): PartnerProfileDto {
    this.partners = [partner, ...this.partners.filter((p) => p.id !== partner.id)];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_custom_partners', JSON.stringify(this.partners));
      } catch {}
    }
    return partner;
  }

  async getPartners(filters?: PartnerListFilters): Promise<PartnerListResponse> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.partnerType && filters.partnerType !== 'ALL') params.set('partnerType', filters.partnerType);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));

      const response = await fetch(`${this.apiUrl}/api/v1/company/partners?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch partner list: ${response.statusText}`);
      }
      return (await response.json()) as PartnerListResponse;
    }

    // Local / In-Memory Mock Implementation
    let filtered = [...this.partners];

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.legalName.toLowerCase().includes(q) ||
          p.tradeName.toLowerCase().includes(q) ||
          p.primaryContact.name.toLowerCase().includes(q) ||
          p.primaryContact.email.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== 'ALL') {
      filtered = filtered.filter((p) => p.lifecycleStatus === filters.status);
    }

    if (filters?.partnerType && filters.partnerType !== 'ALL') {
      filtered = filtered.filter((p) => p.partnerType === filters.partnerType);
    }

    const total = filtered.length;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 10;
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    return {
      items,
      total,
      page,
      pageSize
    };
  }

  async getPartnerById(id: string): Promise<PartnerProfileDto | null> {
    if (this.apiUrl) {
      const response = await fetch(`${this.apiUrl}/api/v1/company/partners/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Failed to fetch partner: ${response.statusText}`);
      return (await response.json()) as PartnerProfileDto;
    }

    const partner = this.partners.find((p) => p.id === id);
    return partner ? { ...partner } : null;
  }

  async getPartnerHistory(id: string): Promise<PartnerTransitionHistoryDto[]> {
    if (this.apiUrl) {
      const response = await fetch(`${this.apiUrl}/api/v1/company/partners/${id}/history`);
      if (!response.ok) throw new Error(`Failed to fetch partner history: ${response.statusText}`);
      return (await response.json()) as PartnerTransitionHistoryDto[];
    }

    const records = this.history[id];
    return records ? [...records] : [];
  }

  async transitionLifecycle(
    id: string,
    req: PartnerTransitionRequest,
    actorEmail = 'executive.lead@docsearch.internal'
  ): Promise<PartnerProfileDto> {
    if (this.apiUrl) {
      const response = await fetch(`${this.apiUrl}/api/v1/company/partners/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!response.ok) throw new Error(`Failed to execute lifecycle transition: ${response.statusText}`);
      return (await response.json()) as PartnerProfileDto;
    }

    const partnerIdx = this.partners.findIndex((p) => p.id === id);
    const currentPartner = this.partners[partnerIdx];
    if (partnerIdx === -1 || !currentPartner) {
      throw new Error(`Partner with ID ${id} not found`);
    }

    const fromStatus = currentPartner.lifecycleStatus;
    const toStatus = req.toStatus;

    if (fromStatus === toStatus) {
      throw new Error(`Partner is already in status ${toStatus}`);
    }

    // Create Audit Transition Record
    const transitionRecord: PartnerTransitionHistoryDto = {
      id: `trans-${Date.now()}`,
      partnerId: id,
      fromStatus,
      toStatus,
      actorEmail,
      reason: req.reason,
      timestamp: new Date().toISOString()
    };

    const currentHistory = this.history[id] ?? [];
    this.history[id] = [transitionRecord, ...currentHistory];

    // Update Partner Profile
    const updatedPartner: PartnerProfileDto = {
      ...currentPartner,
      lifecycleStatus: toStatus,
      updatedAt: new Date().toISOString()
    };

    this.partners[partnerIdx] = updatedPartner;
    return { ...updatedPartner };
  }
}

export const partnerService = new PartnerService();
