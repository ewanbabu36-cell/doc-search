import type {
  PartnerProfileDto,
  PartnerTransitionHistoryDto,
  PartnerTransitionRequest,
  PartnerLifecycleStatus,
  PartnerType,
  PartnerClassificationDto
} from '@docsearch/api-contracts';
import { mockPartnerProfiles, mockPartnerTransitionHistory } from './mock-partner-data.js';
import { isMockFallbackAllowed } from './api-client.js';

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

export interface RoleKycMatrixRow {
  partnerType: string;
  label: string;
  total: number;
  active: number;
  pending: number;
  underReview: number;
  actionRequired: number;
  resubmitted: number;
  approved: number;
  rejected: number;
}

export interface SlaAgingMetrics {
  lessThan24h: number;
  between24hAnd48h: number;
  between2dAnd7d: number;
  overdue7dPlus: number;
}

export interface ReviewerWorkload {
  reviewerId: string;
  name: string;
  email: string;
  activeCases: number;
  completedCases: number;
}

export interface DirectoryIntelligenceSummary {
  global: {
    totalPartners: number;
    active: number;
    inactive: number;
    onboarding: number;
    suspended: number;
    selfRegistered: number;
    kycPending: number;
    underReview: number;
    actionRequired: number;
    resubmitted: number;
    kycApproved: number;
    kycRejected: number;
    complianceVerificationRate: number;
  };
  filtered?: {
    totalPartners: number;
    active: number;
    inactive: number;
    onboarding: number;
    suspended: number;
    selfRegistered: number;
    kycPending: number;
    underReview: number;
    actionRequired: number;
    resubmitted: number;
    kycApproved: number;
    kycRejected: number;
    complianceVerificationRate: number;
  } | undefined;
  byRole: RoleKycMatrixRow[];
  roleSummaryBreakdown: Array<{ partnerType: string; label: string; count: number; percent: number }>;
  roleKycMatrix: RoleKycMatrixRow[];
  slaAging: SlaAgingMetrics;
  assignedReviewers: ReviewerWorkload[];
  lastUpdated: string;
}

export interface DirectoryQueryParams {
  search?: string | undefined;
  partnerType?: string | undefined;
  lifecycleStatus?: string | undefined;
  kycStatus?: string | undefined;
  onboardingStatus?: string | undefined;
  accountStatus?: string | undefined;
  queue?: 'all' | 'my_work' | 'unassigned' | undefined;
  slaStatus?: string | undefined;
  aging?: '<24h' | '24-48h' | '2-7d' | '>7d' | undefined;
  duplicateRisk?: boolean | string | undefined;
  registrationSource?: string | undefined;
  branchId?: string | undefined;
  dateRange?: 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'CUSTOM' | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  tenantId?: string | undefined;
  pricingTier?: 'ALL' | 'FREE' | 'PAID' | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  sortBy?: 'createdAt' | 'name' | 'status' | 'age' | 'completion' | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export interface DirectoryPartnerItem {
  id: string;
  stagedRegistrationId?: string | undefined;
  legalName: string;
  tradeName: string;
  partnerType: string;
  lifecycleStatus: string;
  verificationStatus: string;
  kycStatus: 'PENDING' | 'UNDER_REVIEW' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';
  onboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  accountStatus: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
  kycCompletionPercent: number;
  profileCompletionPercent: number;
  planTier?: string | undefined;
  monthlyFee?: number | undefined;
  licenseNumber?: string | undefined;
  leadId?: string | undefined;
  duplicateRisk: {
    hasRisk: boolean;
    signals: string[];
    potentialMatchId?: string | undefined;
  };
  tenantId: string;
  tenantSlug: string;
  primaryContact: {
    name: string;
    email: string;
    phone?: string | undefined;
    roleTitle?: string | undefined;
  };
  registeredBy: {
    userId?: string | undefined;
    name: string;
    email: string;
    role?: string | undefined;
    source: string;
  };
  assignedReviewer: {
    id?: string | undefined;
    name?: string | undefined;
    email: string;
    assignedAt?: string | undefined;
  } | null;
  branchCount: number;
  userCount: number;
  city?: string | undefined;
  state?: string | undefined;
  documentsCount: number;
  slaStatus: 'ON_TRACK' | 'ATTENTION_NEEDED' | 'OVERDUE';
  ageHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface DirectoryResponse {
  items: DirectoryPartnerItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PartnerAnalyticsSummary {
  partnerOverview: {
    totalPartners: number;
    active: number;
    inactive: number;
    suspended: number;
    selfRegistered: number;
    kycPending: number;
    underReview: number;
    actionRequired: number;
    resubmitted: number;
    kycApproved: number;
    kycRejected: number;
  };
  funnel: {
    registration: { count: number; label: string };
    lead: { count: number; label: string; conversionPercent: number };
    partner: { count: number; label: string; conversionPercent: number };
    kycUnderReview: { count: number; label: string; conversionPercent: number };
    kycApproved: { count: number; label: string; conversionPercent: number };
    onboarding: { count: number; label: string; conversionPercent: number };
    active: { count: number; label: string; conversionPercent: number };
    overallConversionRate: number;
  };
  kycAnalytics: {
    averageReviewTurnaroundHours: number;
    slaComplianceRate: number;
    overdueCases: number;
    actionRequiredCount: number;
  };
  leadAnalytics: {
    totalLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    conversionRate: number;
    bySource: Record<string, number>;
  };
  bottlenecks: {
    stageWithHighestAging: string;
    highestAgingHours: number;
    stageWithHighestBacklog: string;
    highestBacklogCount: number;
    mostBackloggedReviewer: string | null;
  };
  reviewerWorkload: ReviewerWorkload[];
  trends: {
    dailyRegistrations: Array<{ date: string; count: number }>;
    dailyApprovals: Array<{ date: string; count: number }>;
  };
  lastUpdated: string;
}

export interface Partner360Profile {
  partner: {
    id: string;
    tenantId: string;
    tenantSlug: string;
    legalName: string;
    tradeName: string;
    partnerType: string;
    lifecycleStatus: string;
    verificationStatus: string;
    onboardingStep: string;
    onboardingProgressPercent: number;
    onboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    accountStatus: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
    primaryContact: {
      name: string;
      email: string;
      phone?: string | undefined;
      roleTitle?: string | undefined;
    };
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  };
  kycDossier: {
    stagedRegistrationId?: string | undefined;
    status: string;
    submittedAt: string;
    registeredBy: {
      userId?: string | undefined;
      name: string;
      email: string;
      role?: string | undefined;
      source: string;
    };
    assignedReviewer: {
      id?: string | undefined;
      name?: string | undefined;
      email: string;
      assignedAt?: string | undefined;
    } | null;
    reviewStartedAt?: string | undefined;
    reviewStartedBy?: string | undefined;
    requestedInfoReason?: string | undefined;
    infoRequestedAt?: string | undefined;
    resubmittedAt?: string | undefined;
    rejectionReason?: string | undefined;
    approvedAt?: string | undefined;
    documents: Array<{
      documentId: string;
      documentName: string;
      documentType: string;
      sha256Hash: string;
      secureRef: string;
      uploadedAt: string;
      status?: string | undefined;
      version?: number | undefined;
      previousVersions?: Array<{
        version: number;
        documentName: string;
        sha256Hash: string;
        uploadedAt: string;
        replacedAt?: string | undefined;
      }> | undefined;
    }>;
    extractedFields: Record<string, any>;
  };
  leadInfo?: {
    leadId: string;
    organizationName?: string | undefined;
    contactName?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
    source?: string | undefined;
    status?: string | undefined;
    notes?: string | undefined;
    convertedAt?: string | undefined;
  } | null | undefined;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string;
    assignedUserEmail: string;
    notes?: string | undefined;
  }>;
  communication: Array<{
    id: string;
    channel: string;
    recipientEmail: string;
    deliveryStatus: string;
    dispatchedAt?: string | undefined;
  }>;
  scores: {
    profileCompletionPercent: number;
    kycCompletionPercent: number;
    missingProfileRequirements: string[];
    missingKycRequirements: string[];
  };
  duplicateRisk: {
    hasRisk: boolean;
    signals: string[];
    potentialMatchPartnerId?: string | undefined;
  };
  commercial: {
    subscription: any | null;
    license: any | null;
    plan: any | null;
    entitlements: Array<{ code: string; name: string; category: string; value: any }>;
  };
  branches: Array<{
    id: string;
    name: string;
    code?: string | undefined;
    isMain: boolean;
    city?: string | undefined;
  }>;
  auditTimeline: Array<{
    id: string;
    eventType: string;
    actorEmail: string;
    timestamp: string;
    metadata: Record<string, any>;
    integrityHash: string;
  }>;
  permittedActions: {
    canStartReview: boolean;
    canAssignReviewer: boolean;
    canRequestInfo: boolean;
    canResubmit: boolean;
    canApprove: boolean;
    canReject: boolean;
    canActivate: boolean;
    canSuspend: boolean;
  };
}

export interface PartnerListFilters {
  search?: string | undefined;
  status?: PartnerLifecycleStatus | 'ALL' | undefined;
  partnerType?: PartnerType | 'ALL' | undefined;
  kycStatus?: string | undefined;
  queue?: 'all' | 'my_work' | 'unassigned' | undefined;
  slaStatus?: 'ON_TRACK' | 'ATTENTION_NEEDED' | 'OVERDUE' | undefined;
  aging?: '<24h' | '24-48h' | '2-7d' | '>7d' | undefined;
  duplicateRisk?: boolean | undefined;
  registrationSource?: string | undefined;
  branchId?: string | undefined;
  dateRange?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  onboardingStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | undefined;
  accountStatus?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED' | undefined;
  pricingTier?: 'ALL' | 'FREE' | 'PAID' | undefined;
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
  getDirectoryIntelligence(filters?: DirectoryQueryParams): Promise<DirectoryIntelligenceSummary>;
  getDirectory(filters?: DirectoryQueryParams): Promise<DirectoryResponse>;
  getPartnerAnalytics(): Promise<PartnerAnalyticsSummary>;
  getPartner360(partnerId: string): Promise<Partner360Profile>;
  getPartnerById(id: string): Promise<PartnerProfileDto | null>;
  getPartnerHistory(id: string): Promise<PartnerTransitionHistoryDto[]>;
  transitionLifecycle(
    id: string,
    req: PartnerTransitionRequest,
    actorEmail?: string
  ): Promise<PartnerProfileDto>;
  getClassifications(): Promise<PartnerClassificationDto[]>;
  addClassification(classification: PartnerClassificationDto): Promise<PartnerClassificationDto>;
  checkLeadDuplicate(leadId: string): Promise<{ hasDuplicate: boolean; duplicates: any[] }>;
  createPartner(input: any): Promise<PartnerProfileDto>;
  updatePartner(partnerId: string, input: any): Promise<PartnerProfileDto>;
  deletePartner(partnerId: string): Promise<boolean>;
}

export class PartnerService implements IPartnerService {
  private readonly apiUrl?: string | undefined;
  private classifications: PartnerClassificationDto[] = [...CANONICAL_PARTNER_CLASSIFICATIONS];
  private partners: PartnerProfileDto[] = [...mockPartnerProfiles];
  private history: Record<string, PartnerTransitionHistoryDto[]> = { ...mockPartnerTransitionHistory };

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl || '';
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('docsearch_company_token') ||
        localStorage.getItem('docsearch_auth_token') ||
        localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async getDirectoryIntelligence(filters?: DirectoryQueryParams): Promise<DirectoryIntelligenceSummary> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.partnerType && filters.partnerType !== 'ALL') params.set('partnerType', filters.partnerType);
    if (filters?.lifecycleStatus && filters.lifecycleStatus !== 'ALL') params.set('lifecycleStatus', filters.lifecycleStatus);
    if (filters?.kycStatus && filters.kycStatus !== 'ALL') params.set('kycStatus', filters.kycStatus);
    if (filters?.queue) params.set('queue', filters.queue);
    if (filters?.slaStatus) params.set('slaStatus', filters.slaStatus);
    if (filters?.aging) params.set('aging', filters.aging);
    if (filters?.duplicateRisk !== undefined) params.set('duplicateRisk', String(filters.duplicateRisk));
    if (filters?.registrationSource && filters.registrationSource !== 'ALL') params.set('registrationSource', filters.registrationSource);
    if (filters?.branchId && filters.branchId !== 'ALL') params.set('branchId', filters.branchId);
    if (filters?.dateRange && filters.dateRange !== 'ALL') params.set('dateRange', filters.dateRange);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.onboardingStatus) params.set('onboardingStatus', filters.onboardingStatus);
    if (filters?.accountStatus) params.set('accountStatus', filters.accountStatus);

    const qs = params.toString();
    const url = `${this.apiUrl}/api/v1/company/partners/directory-intelligence${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch directory intelligence: ${response.statusText}`);
    }
    const json = await response.json();
    return json.data as DirectoryIntelligenceSummary;
  }

  async getDirectory(filters: DirectoryQueryParams = {}): Promise<DirectoryResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.partnerType && filters.partnerType !== 'ALL') params.set('partnerType', filters.partnerType);
    if (filters.lifecycleStatus && filters.lifecycleStatus !== 'ALL') params.set('lifecycleStatus', filters.lifecycleStatus);
    if (filters.kycStatus && filters.kycStatus !== 'ALL') params.set('kycStatus', filters.kycStatus);
    if (filters.queue) params.set('queue', filters.queue);
    if (filters.slaStatus) params.set('slaStatus', filters.slaStatus);
    if (filters.aging) params.set('aging', filters.aging);
    if (filters.duplicateRisk !== undefined) params.set('duplicateRisk', String(filters.duplicateRisk));
    if (filters.registrationSource && filters.registrationSource !== 'ALL') params.set('registrationSource', filters.registrationSource);
    if (filters.branchId && filters.branchId !== 'ALL') params.set('branchId', filters.branchId);
    if (filters.dateRange && filters.dateRange !== 'ALL') params.set('dateRange', filters.dateRange);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.onboardingStatus) params.set('onboardingStatus', filters.onboardingStatus);
    if (filters.accountStatus) params.set('accountStatus', filters.accountStatus);
    if (filters.pricingTier && filters.pricingTier !== 'ALL') params.set('pricingTier', filters.pricingTier);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    let response = await fetch(`${this.apiUrl}/api/v1/company/partners/directory?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
    if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
      response = await fetch(`${this.apiUrl}/api/v1/company/partners/directory?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch partner directory: ${response.statusText}`);
    }
    const json = await response.json();
    return {
      items: json.data || [],
      total: json.total || 0,
      page: json.page || 1,
      pageSize: json.pageSize || 20,
      totalPages: json.totalPages || 1
    };
  }

  async getPartnerAnalytics(): Promise<PartnerAnalyticsSummary> {
    const response = await fetch(`${this.apiUrl}/api/v1/company/partners/analytics`, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch partner analytics: ${response.statusText}`);
    }
    const json = await response.json();
    return json.data as PartnerAnalyticsSummary;
  }

  async checkLeadDuplicate(leadId: string): Promise<{ hasDuplicate: boolean; duplicates: any[] }> {
    const response = await fetch(`${this.apiUrl}/api/v1/company/sales/leads/${leadId}/check-duplicate`, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to check lead duplicates: ${response.statusText}`);
    }
    const json = await response.json();
    return json.data;
  }

  async getPartner360(partnerId: string): Promise<Partner360Profile> {
    const response = await fetch(`${this.apiUrl}/api/v1/company/partners/${partnerId}/360`, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch partner 360: ${response.statusText}`);
    }
    const json = await response.json();
    return json.data as Partner360Profile;
  }

  async getClassifications(): Promise<PartnerClassificationDto[]> {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/company/partner-classifications`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          this.classifications = json.data;
          return [...this.classifications];
        }
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.classifications];
  }

  async addClassification(classification: PartnerClassificationDto): Promise<PartnerClassificationDto> {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/company/partner-classifications`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(classification)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.classifications = [...this.classifications, json.data];
          return json.data;
        }
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

    const created: PartnerClassificationDto = {
      ...classification,
      id: crypto.randomUUID(),
      sortOrder: this.classifications.length + 1
    };
    this.classifications = [...this.classifications, created];
    return created;
  }

  addPartner(partner: PartnerProfileDto): PartnerProfileDto {
    this.partners = [partner, ...this.partners.filter((p) => p.id !== partner.id)];
    return partner;
  }

  private mapRawToPartnerProfileDto(item: any): PartnerProfileDto {
    const id = item.id || item.partnerId || `PRT-${Date.now().toString().slice(-6)}`;
    const name = item.tradeName || item.facilityName || item.partnerName || item.legalName || 'Healthcare Facility';
    const email = item.credentials?.userId || item.email || item.primaryContact?.email || 'admin@docsearch.health';
    const orgType = String(item.organizationType || item.classification || item.partnerType || '').toUpperCase();

    let partnerType: PartnerType = 'HOSPITAL_NETWORK';
    if (orgType.includes('PHARMACY')) partnerType = 'PHARMACY';
    else if (orgType.includes('LAB') || orgType.includes('PATHOLOGY') || orgType.includes('DIAGNOSTIC')) partnerType = 'DIAGNOSTIC_LAB';
    else if (orgType.includes('CLINIC')) partnerType = 'CLINIC_GROUP';
    else partnerType = 'HOSPITAL_NETWORK';

    const isVerified = item.status === 'APPROVED' || item.kycStatus === 'KYC_VERIFIED' || item.status === 'LIVE_ACTIVE' || item.verificationStatus === 'VERIFIED';
    const isSuspended = item.status === 'SUSPENDED' || item.lifecycleStatus === 'SUSPENDED';
    const rawKyc = item.kycStatus || item.metadata?.kycStatus || (isVerified ? 'APPROVED' : (item.status === 'REJECTED' ? 'REJECTED' : 'PENDING'));
    const kycStatus = rawKyc === 'KYC_VERIFIED' ? 'APPROVED' : rawKyc;

    const planTier = item.planTier || item.subscriptionPlan?.tier || item.metadata?.planTier || 'Free OPD Core';
    const monthlyFee = typeof item.monthlyFee === 'number'
      ? item.monthlyFee
      : (typeof item.subscriptionPlan?.monthlyFee === 'number'
        ? item.subscriptionPlan.monthlyFee
        : (typeof item.metadata?.monthlyFee === 'number' ? item.metadata.monthlyFee : 0));

    return {
      id,
      tenantId: item.tenantId || id,
      tenantSlug: item.tenantSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      legalName: item.legalName || name,
      tradeName: name,
      partnerType,
      lifecycleStatus: isSuspended ? 'SUSPENDED' : (item.lifecycleStatus || (isVerified ? 'ACTIVE' : 'ONBOARDING')),
      verificationStatus: isSuspended ? 'SUSPENDED' : (item.verificationStatus || (isVerified ? 'VERIFIED' : 'PENDING')),
      onboardingStep: (item.onboardingStep || (isVerified ? 'COMPLETED' : 'SECURITY_VERIFICATION')) as any,
      onboardingProgressPercent: item.onboardingProgressPercent ?? (isVerified ? 100 : 50),
      primaryContact: {
        name: item.contactPerson || item.name || item.primaryContact?.name || name,
        email,
        phone: item.phone || item.primaryContact?.phone || '+91 98000 00000',
        roleTitle: item.credentials?.role || item.primaryContact?.roleTitle || 'Partner Director'
      },
      branchCount: item.branchCount || 1,
      userCount: item.userCount || 4,
      metadata: {
        classification: item.organizationType || item.classification || partnerType,
        city: item.city || item.metadata?.city || 'New Delhi',
        state: item.state || item.metadata?.state || 'Delhi',
        planTier,
        monthlyFee,
        activeFeatures: item.features || item.subscriptionPlan?.activeFeatures || item.metadata?.activeFeatures,
        temporaryPassword: item.credentials?.temporaryPassword || item.metadata?.temporaryPassword,
        loginUrl: item.credentials?.loginUrl || item.metadata?.loginUrl,
        activationVoucher: id,
        kycStatus,
        assignedReviewer: item.assignedReviewer || item.metadata?.assignedReviewer || null,
        slaStatus: item.slaStatus || item.metadata?.slaStatus || (item.ageHours && item.ageHours >= 168 ? 'OVERDUE' : 'ON_TRACK'),
        ageHours: item.ageHours ?? item.metadata?.ageHours ?? 0,
        documentsCount: item.documentsCount ?? item.metadata?.documentsCount ?? 2,
        profileCompletionPercent: item.profileCompletionPercent ?? item.metadata?.profileCompletionPercent ?? 85,
        kycCompletionPercent: item.kycCompletionPercent ?? item.metadata?.kycCompletionPercent ?? 80,
        duplicateRisk: item.duplicateRisk ?? item.metadata?.duplicateRisk ?? { hasRisk: false, signals: [] },
        onboardingStatus: item.onboardingStatus || item.metadata?.onboardingStatus || (isVerified ? 'COMPLETED' : 'IN_PROGRESS'),
        accountStatus: isSuspended ? 'SUSPENDED' : (item.accountStatus || item.metadata?.accountStatus || (isVerified ? 'ACTIVE' : 'PENDING'))
      },
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    };
  }

  private matchesFilters(p: PartnerProfileDto, filters?: PartnerListFilters): boolean {
    if (!filters) return true;

    // 1. Search Query
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const meta = (p.metadata || {}) as any;
      const matchesSearch =
        p.legalName?.toLowerCase().includes(q) ||
        p.tradeName?.toLowerCase().includes(q) ||
        p.primaryContact?.name?.toLowerCase().includes(q) ||
        p.primaryContact?.email?.toLowerCase().includes(q) ||
        p.primaryContact?.phone?.includes(q) ||
        meta.city?.toLowerCase().includes(q) ||
        meta.state?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.tenantSlug?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // 2. Lifecycle Status
    if (filters.status && filters.status !== 'ALL') {
      if (p.lifecycleStatus !== filters.status) return false;
    }

    // 3. Partner Type / Classification
    if (filters.partnerType && filters.partnerType !== 'ALL') {
      if (p.partnerType !== filters.partnerType) return false;
    }

    // 4. KYC Status (Strict check against normalized status)
    if (filters.kycStatus && filters.kycStatus !== 'ALL') {
      const meta = (p.metadata || {}) as any;
      const rawKyc = meta.kycStatus || (p.verificationStatus === 'VERIFIED' ? 'APPROVED' : (p.verificationStatus === 'REJECTED' ? 'REJECTED' : 'PENDING'));
      const normKyc = (rawKyc === 'KYC_VERIFIED' || rawKyc === 'VERIFIED') ? 'APPROVED' : rawKyc;

      if (filters.kycStatus === 'PENDING') {
        if (normKyc !== 'PENDING') return false;
      } else if (filters.kycStatus === 'UNDER_REVIEW') {
        if (normKyc !== 'UNDER_REVIEW' && normKyc !== 'IN_REVIEW') return false;
      } else if (filters.kycStatus === 'ADDITIONAL_INFORMATION_REQUIRED') {
        if (normKyc !== 'ADDITIONAL_INFORMATION_REQUIRED' && normKyc !== 'ACTION_REQUIRED') return false;
      } else if (filters.kycStatus === 'RESUBMITTED') {
        if (normKyc !== 'RESUBMITTED') return false;
      } else if (filters.kycStatus === 'APPROVED') {
        if (normKyc !== 'APPROVED') return false;
      } else if (filters.kycStatus === 'REJECTED') {
        if (normKyc !== 'REJECTED') return false;
      } else {
        if (normKyc !== filters.kycStatus) return false;
      }
    }

    // 5. Work Queue
    if (filters.queue && filters.queue !== 'all') {
      const meta = (p.metadata || {}) as any;
      const hasReviewer = Boolean(meta.assignedReviewer?.email || meta.assignedReviewer?.name || meta.assignedReviewer?.id);
      if (filters.queue === 'my_work') {
        if (!hasReviewer) return false;
      } else if (filters.queue === 'unassigned') {
        if (hasReviewer) return false;
      }
    }

    // 6. SLA Aging
    if (filters.aging) {
      const meta = (p.metadata || {}) as any;
      const ageHours = typeof meta.ageHours === 'number'
        ? meta.ageHours
        : Math.max(0, Math.round((Date.now() - new Date(p.createdAt || 0).getTime()) / (1000 * 60 * 60)));

      if (filters.aging === '<24h') {
        if (ageHours >= 24) return false;
      } else if (filters.aging === '24-48h') {
        if (ageHours < 24 || ageHours >= 48) return false;
      } else if (filters.aging === '2-7d') {
        if (ageHours < 48 || ageHours >= 168) return false;
      } else if (filters.aging === '>7d') {
        if (ageHours < 168) return false;
      }
    }

    // 7. SLA Status
    if (filters.slaStatus) {
      const meta = (p.metadata || {}) as any;
      const ageHours = typeof meta.ageHours === 'number'
        ? meta.ageHours
        : Math.max(0, Math.round((Date.now() - new Date(p.createdAt || 0).getTime()) / (1000 * 60 * 60)));
      const computedSla = meta.slaStatus || (ageHours < 24 ? 'ON_TRACK' : ageHours < 48 ? 'ATTENTION_NEEDED' : 'OVERDUE');
      if (computedSla !== filters.slaStatus) return false;
    }

    // 8. Pricing Tier (Paid vs Free)
    if (filters.pricingTier && filters.pricingTier !== 'ALL') {
      const meta = (p.metadata || {}) as any;
      const fee = Number(meta.monthlyFee ?? 0);
      const plan = String(meta.planTier || '').toLowerCase();
      const isFree = fee === 0 || plan.includes('free') || plan.includes('starter') || plan.includes('foundation') || plan.includes('₹0') || plan.includes('core');

      if (filters.pricingTier === 'FREE' && !isFree) return false;
      if (filters.pricingTier === 'PAID' && isFree) return false;
    }

    // 9. Branch ID / Location
    if (filters.branchId && filters.branchId !== 'ALL') {
      const bId = filters.branchId.toLowerCase().trim();
      const meta = (p.metadata || {}) as any;
      const matchesBranch =
        p.tenantId?.toLowerCase() === bId ||
        p.tenantSlug?.toLowerCase() === bId ||
        meta.city?.toLowerCase().includes(bId) ||
        meta.state?.toLowerCase().includes(bId);
      if (!matchesBranch) return false;
    }

    return true;
  }

  async getPartners(filters?: PartnerListFilters): Promise<PartnerListResponse> {
    // 0. Load purged tombstones blacklist from localStorage
    const purgedBlacklist: string[] = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('docsearch_purged_partners') || '[]').map((s: string) => String(s).toLowerCase().trim())
      : [];

    const isPurgedCandidate = (p: any): boolean => {
      if (!purgedBlacklist.length || !p) return false;
      const pid = String(p?.id || p?.partnerId || '').toLowerCase().trim();
      const pemail = String(p?.primaryContact?.email || p?.email || '').toLowerCase().trim();
      const pname = String(p?.tradeName || p?.legalName || p?.facilityName || '').toLowerCase().trim();
      const pslug = String(p?.tenantSlug || p?.slug || '').toLowerCase().trim();

      return Boolean(
        (pid && purgedBlacklist.includes(pid)) ||
        (pemail && purgedBlacklist.includes(pemail)) ||
        (pname && purgedBlacklist.includes(pname)) ||
        (pslug && purgedBlacklist.includes(pslug))
      );
    };

    // 1. Gather all local candidates from in-memory cache and localStorage (omitting any purged records)
    const localCandidates: PartnerProfileDto[] = this.partners.filter((p) => !isPurgedCandidate(p));
    if (typeof window !== 'undefined') {
      try {
        const live = JSON.parse(localStorage.getItem('docsearch_live_partners') || '[]');
        if (Array.isArray(live)) {
          for (const l of live) {
            if (!isPurgedCandidate(l)) {
              localCandidates.push(this.mapRawToPartnerProfileDto(l));
            }
          }
        }
      } catch {}
      try {
        const reg = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
        if (Array.isArray(reg)) {
          for (const r of reg) {
            if (!isPurgedCandidate(r)) {
              localCandidates.push(this.mapRawToPartnerProfileDto(r));
            }
          }
        }
      } catch {}
    }

    let combined: PartnerProfileDto[] = [];
    let serverSuccess = false;

    // 2. Try real server-side multi-filter directory
    let unmergedLocals: PartnerProfileDto[] = [];
    try {
      const dir = await this.getDirectory({
        search: filters?.search,
        partnerType: filters?.partnerType,
        lifecycleStatus: filters?.status,
        kycStatus: filters?.kycStatus,
        queue: filters?.queue,
        slaStatus: filters?.slaStatus,
        aging: filters?.aging,
        duplicateRisk: filters?.duplicateRisk,
        registrationSource: filters?.registrationSource,
        branchId: filters?.branchId,
        dateRange: filters?.dateRange as any,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        onboardingStatus: filters?.onboardingStatus,
        accountStatus: filters?.accountStatus,
        pricingTier: filters?.pricingTier !== 'ALL' ? filters?.pricingTier : undefined,
        page: 1,
        pageSize: 1000
      });

      if (dir && Array.isArray(dir.items)) {
        serverSuccess = true;
        const serverDtos: PartnerProfileDto[] = dir.items
          .filter((item) => !isPurgedCandidate(item))
          .map((item) => ({
            id: item.id,
            tenantId: item.tenantId,
            tenantSlug: item.tenantSlug,
            legalName: item.legalName,
            tradeName: item.tradeName,
            partnerType: item.partnerType as any,
            lifecycleStatus: item.lifecycleStatus as any,
            verificationStatus: item.verificationStatus as any,
            onboardingStep: (item.kycStatus === 'APPROVED' ? 'COMPLETED' : 'SECURITY_VERIFICATION') as any,
            onboardingProgressPercent: item.kycCompletionPercent,
            primaryContact: {
              name: item.primaryContact.name,
              email: item.primaryContact.email,
              phone: item.primaryContact.phone,
              roleTitle: item.primaryContact.roleTitle
            },
            branchCount: item.branchCount,
            userCount: item.userCount,
            metadata: {
              classification: item.partnerType,
              city: item.city,
              state: item.state,
              kycStatus: item.kycStatus,
              planTier: item.planTier || 'Free OPD Core',
              monthlyFee: typeof item.monthlyFee === 'number' ? item.monthlyFee : 0,
              slaStatus: item.slaStatus,
              ageHours: item.ageHours,
              registeredBy: item.registeredBy,
              assignedReviewer: item.assignedReviewer,
              stagedRegistrationId: item.stagedRegistrationId,
              documentsCount: item.documentsCount,
              profileCompletionPercent: item.profileCompletionPercent,
              kycCompletionPercent: item.kycCompletionPercent,
              duplicateRisk: item.duplicateRisk,
              onboardingStatus: item.onboardingStatus,
              accountStatus: item.accountStatus,
              leadId: item.leadId
            },
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));

        // Merge: Seed with server items, then append any local candidates not in server
        const seenIds = new Set<string>();
        const seenEmails = new Set<string>();
        const seenNames = new Set<string>();

        serverDtos.forEach((s) => {
          if (s.id) seenIds.add(s.id.toLowerCase());
          const email = s.primaryContact?.email?.toLowerCase().trim();
          if (email && !email.includes('docsearch.health') && !email.includes('example.com')) {
            seenEmails.add(email);
          }
          const name = s.tradeName?.toLowerCase().trim();
          if (name && name !== 'healthcare facility') {
            seenNames.add(name);
          }
        });

        for (const loc of localCandidates) {
          if (isPurgedCandidate(loc)) continue;
          // Local candidate MUST also pass the active filter!
          if (!this.matchesFilters(loc, filters)) continue;

          const locId = loc.id?.toLowerCase();
          const email = loc.primaryContact?.email?.toLowerCase().trim();
          const name = loc.tradeName?.toLowerCase().trim();
          const isGenericEmail = !email || email.includes('docsearch.health') || email.includes('example.com');
          const isGenericName = !name || name === 'healthcare facility';

          const matchesId = locId && seenIds.has(locId);
          const matchesEmail = !isGenericEmail && seenEmails.has(email);
          const matchesName = !isGenericName && seenNames.has(name);

          if (!matchesId && !matchesEmail && !matchesName) {
            unmergedLocals.push(loc);
            if (locId) seenIds.add(locId);
            if (!isGenericEmail) seenEmails.add(email);
            if (!isGenericName) seenNames.add(name);
          }
        }

        combined = [...serverDtos, ...unmergedLocals];
      }
    } catch (serverErr) {
      if (!isMockFallbackAllowed()) throw serverErr;
      console.warn('Real directory query fallback:', serverErr);
    }

    if (!serverSuccess) {
      // Deduplicate local candidates
      const seen = new Set<string>();
      combined = localCandidates.filter((p) => {
        if (isPurgedCandidate(p)) return false;
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    }

    // 3. Apply comprehensive filter over combined list
    let filtered = combined.filter((p) => this.matchesFilters(p, filters));

    // 4. Default Sort: Newest created partners first (ensures freshly registered partners are prominently on Page 1)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // 5. Uniform Client-Side Pagination over the complete merged dataset
    const total = filtered.length;
    const pageSize = Math.max(1, filters?.pageSize ?? 10);
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, filters?.page ?? 1), maxPage);
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    // 6. Background auto-sync for unmerged local candidates to database (NEVER sync purged partners)
    if (serverSuccess && unmergedLocals.length > 0 && typeof window !== 'undefined') {
      setTimeout(() => {
        unmergedLocals.forEach(async (loc) => {
          if (isPurgedCandidate(loc)) return;
          try {
            await fetch(`${this.apiUrl}/api/v1/auth/self-register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                partner: {
                  id: loc.id,
                  name: loc.primaryContact?.name || loc.tradeName,
                  email: loc.primaryContact?.email,
                  phone: loc.primaryContact?.phone,
                  facilityName: loc.tradeName,
                  organizationType: loc.partnerType,
                  city: (loc.metadata as any)?.city || 'New Delhi',
                  state: (loc.metadata as any)?.state || 'Delhi',
                  planTier: (loc.metadata as any)?.planTier || 'Standard Tier',
                  status: loc.lifecycleStatus === 'ACTIVE' ? 'APPROVED' : 'PENDING'
                }
              })
            }).catch(() => {});
          } catch {}
        });
      }, 200);
    }

    return {
      items,
      total,
      page,
      pageSize
    };
  }

  async getPartnerById(id: string): Promise<PartnerProfileDto | null> {
    try {
      const p360 = await this.getPartner360(id);
      if (p360 && p360.partner) {
        return {
          id: p360.partner.id,
          tenantId: p360.partner.tenantId,
          tenantSlug: p360.partner.tenantSlug,
          legalName: p360.partner.legalName,
          tradeName: p360.partner.tradeName,
          partnerType: p360.partner.partnerType as any,
          lifecycleStatus: p360.partner.lifecycleStatus as any,
          verificationStatus: p360.partner.verificationStatus as any,
          onboardingStep: (p360.partner.onboardingStep || 'COMPLETED') as any,
          onboardingProgressPercent: p360.partner.onboardingProgressPercent,
          primaryContact: {
            name: p360.partner.primaryContact.name,
            email: p360.partner.primaryContact.email,
            phone: p360.partner.primaryContact.phone,
            roleTitle: p360.partner.primaryContact.roleTitle
          },
          branchCount: p360.branches.length || 1,
          userCount: 3,
          metadata: {
            ...p360.partner.metadata,
            kycDossier: p360.kycDossier,
            commercial: p360.commercial,
            permittedActions: p360.permittedActions
          },
          createdAt: p360.partner.createdAt,
          updatedAt: p360.partner.updatedAt
        };
      }
    } catch {}

    const partner = this.partners.find((p) => p.id === id);
    return partner ? { ...partner } : null;
  }

  async getPartnerHistory(id: string): Promise<PartnerTransitionHistoryDto[]> {
    try {
      const p360 = await this.getPartner360(id);
      if (p360 && p360.auditTimeline && p360.auditTimeline.length > 0) {
        return p360.auditTimeline.map((ev) => ({
          id: ev.id,
          partnerId: id,
          fromStatus: 'ONBOARDING' as any,
          toStatus: (['ACTIVE', 'LEAD', 'PROSPECT', 'ONBOARDING', 'VERIFICATION', 'SUSPENDED', 'OFFBOARDED'].includes(ev.eventType) ? ev.eventType : 'ACTIVE') as any,
          actorEmail: ev.actorEmail,
          reason: (ev.metadata as any)?.reason || ev.eventType,
          timestamp: ev.timestamp
        }));
      }
    } catch {}

    const records = this.history[id];
    return records ? [...records] : [];
  }

  async transitionLifecycle(
    id: string,
    req: PartnerTransitionRequest & { fromStatus?: string },
    actorEmail = 'admin@docsearch.health'
  ): Promise<PartnerProfileDto> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/company/partners/${id}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          fromStatus: req.fromStatus || 'ONBOARDING',
          toStatus: req.toStatus,
          reason: req.reason
        })
      });
      if (response.ok) {
        const json = await response.json();
        return json.data as PartnerProfileDto;
      }
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || errJson.message || `Status update failed (${response.status})`);
    } catch (err: any) {
      if (!isMockFallbackAllowed()) throw err;

      const partnerIdx = this.partners.findIndex((p) => p.id === id);
      const currentPartner = this.partners[partnerIdx];
      if (!currentPartner) {
        throw new Error(err.message || `Partner ${id} update failed`);
      }

      const fromStatus = currentPartner.lifecycleStatus;
      const toStatus = req.toStatus;

      if (fromStatus === toStatus) {
        throw new Error(`Partner is already in status ${toStatus}`);
      }

      const transitionRecord: PartnerTransitionHistoryDto = {
        id: `trans-${Date.now()}`,
        partnerId: id,
        fromStatus,
        toStatus,
        actorEmail,
        reason: req.reason,
        timestamp: new Date().toISOString()
      };

      if (!this.history[id]) {
        this.history[id] = [];
      }
      this.history[id].push(transitionRecord);

      currentPartner.lifecycleStatus = toStatus;
      currentPartner.updatedAt = new Date().toISOString();

      return { ...currentPartner };
    }
  }

  async createPartner(input: {
    legalName: string;
    tradeName?: string;
    partnerType?: string;
    lifecycleStatus?: string;
    verificationStatus?: string;
    primaryContactName: string;
    primaryContactEmail: string;
    primaryContactPhone?: string;
    primaryContactRole?: string;
    city?: string;
    state?: string;
    initialFacilityName?: string;
    metadata?: Record<string, any>;
  }): Promise<PartnerProfileDto> {
    const payload = {
      legalName: input.legalName,
      tradeName: input.tradeName || input.legalName,
      partnerType: input.partnerType || 'HOSPITAL_NETWORK',
      lifecycleStatus: input.lifecycleStatus || 'LEAD',
      verificationStatus: input.verificationStatus || 'PENDING',
      primaryContactName: input.primaryContactName,
      primaryContactEmail: input.primaryContactEmail,
      primaryContactPhone: input.primaryContactPhone,
      primaryContactRole: input.primaryContactRole || 'Hospital Administrator',
      initialFacilityName: input.initialFacilityName || input.tradeName || input.legalName,
      metadata: {
        ...(input.metadata || {}),
        city: input.city,
        state: input.state
      }
    };

    const response = await fetch(`${this.apiUrl}/api/v1/company/partners`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || errJson.message || `Partner creation failed (${response.status})`);
    }

    const json = await response.json();
    const createdPartner = json.data;

    const dto: PartnerProfileDto = {
      id: createdPartner.id,
      tenantId: createdPartner.tenantId,
      tenantSlug: createdPartner.tenantSlug || (createdPartner.tradeName || 'partner').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      legalName: createdPartner.legalName,
      tradeName: createdPartner.tradeName,
      partnerType: createdPartner.partnerType,
      lifecycleStatus: createdPartner.lifecycleStatus,
      verificationStatus: createdPartner.verificationStatus,
      onboardingStep: createdPartner.onboardingStep || 'ORGANIZATION_PROFILE',
      onboardingProgressPercent: createdPartner.onboardingProgressPercent || 0,
      primaryContact: {
        name: createdPartner.primaryContactName || input.primaryContactName,
        email: createdPartner.primaryContactEmail || input.primaryContactEmail,
        phone: createdPartner.primaryContactPhone || input.primaryContactPhone,
        roleTitle: createdPartner.primaryContactRole || input.primaryContactRole || 'Hospital Administrator'
      },
      branchCount: 1,
      userCount: 4,
      metadata: createdPartner.metadata || {},
      createdAt: createdPartner.createdAt || new Date().toISOString(),
      updatedAt: createdPartner.updatedAt || new Date().toISOString()
    };

    this.partners = [dto, ...this.partners.filter((p) => p.id !== dto.id)];
    return dto;
  }

  async updatePartner(
    partnerId: string,
    input: {
      legalName?: string;
      tradeName?: string;
      partnerType?: string;
      lifecycleStatus?: string;
      verificationStatus?: string;
      primaryContactName?: string;
      primaryContactPhone?: string;
      primaryContactEmail?: string;
      city?: string;
      state?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<PartnerProfileDto> {
    const response = await fetch(`${this.apiUrl}/api/v1/company/partners/${encodeURIComponent(partnerId)}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || errJson.message || `Partner update failed (${response.status})`);
    }

    const json = await response.json();
    const updated = json.data;

    const idx = this.partners.findIndex((p) => p.id === partnerId);
    if (idx >= 0 && this.partners[idx]) {
      this.partners[idx] = {
        ...this.partners[idx]!,
        ...updated,
        tradeName: input.tradeName || this.partners[idx]!.tradeName,
        legalName: input.legalName || this.partners[idx]!.legalName,
        lifecycleStatus: (input.lifecycleStatus || this.partners[idx]!.lifecycleStatus) as any,
        partnerType: (input.partnerType || this.partners[idx]!.partnerType) as any,
        primaryContact: {
          ...this.partners[idx]!.primaryContact,
          name: input.primaryContactName || this.partners[idx]!.primaryContact.name,
          email: input.primaryContactEmail || this.partners[idx]!.primaryContact.email,
          phone: input.primaryContactPhone || this.partners[idx]!.primaryContact.phone
        }
      };
    }

    return updated;
  }

  async deletePartner(
    partnerId: string,
    partnerDetails?: { email?: string | undefined; tradeName?: string | undefined; slug?: string | undefined }
  ): Promise<boolean> {
    const id = (partnerId || '').toLowerCase().trim();
    const email = (partnerDetails?.email || '').toLowerCase().trim();
    const tradeName = (partnerDetails?.tradeName || '').toLowerCase().trim();
    const slug = (partnerDetails?.slug || '').toLowerCase().trim();

    // 1. Pass extra hints to server so tombstone service permanently blacklists ID, email, tradeName, and slug
    try {
      const qs = new URLSearchParams();
      if (email) qs.set('email', email);
      if (tradeName) qs.set('tradeName', tradeName);
      if (slug) qs.set('slug', slug);
      const queryStr = qs.toString() ? `?${qs.toString()}` : '';

      const response = await fetch(`${this.apiUrl}/api/v1/company/partners/${encodeURIComponent(partnerId)}${queryStr}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        // Fallback to staged endpoint if needed
        await fetch(`${this.apiUrl}/api/v1/company/partners/staged/${encodeURIComponent(partnerId)}${queryStr}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });
      }
    } catch (err) {
      console.warn('Network error during deletePartner:', err);
    }

    // 2. Clean from in-memory cache
    this.partners = this.partners.filter((p) => {
      const pId = (p.id || '').toLowerCase();
      const pEmail = (p.primaryContact?.email || '').toLowerCase();
      const pName = (p.tradeName || p.legalName || '').toLowerCase();
      const pSlug = (p.tenantSlug || '').toLowerCase();
      if (id && pId === id) return false;
      if (email && pEmail === email) return false;
      if (tradeName && pName === tradeName) return false;
      if (slug && pSlug === slug) return false;
      return true;
    });
    if (this.history[partnerId]) {
      delete this.history[partnerId];
    }

    // 3. Clean from local storage across all stored partner keys and register permanent tombstone blacklist
    if (typeof window !== 'undefined') {
      try {
        // Add all identifiers to docsearch_purged_partners tombstone blacklist
        const purgedList: string[] = JSON.parse(localStorage.getItem('docsearch_purged_partners') || '[]');
        const toAdd = [id, email, tradeName, slug].filter(Boolean);
        toAdd.forEach((k) => {
          if (!purgedList.includes(k)) purgedList.push(k);
        });
        localStorage.setItem('docsearch_purged_partners', JSON.stringify(purgedList));

        const matchesDeleted = (p: any) => {
          const pId = String(p?.id || p?.partnerId || '').toLowerCase().trim();
          const pEmail = String(p?.email || p?.primaryContact?.email || '').toLowerCase().trim();
          const pName = String(p?.facilityName || p?.tradeName || p?.legalName || '').toLowerCase().trim();
          const pSlug = String(p?.tenantSlug || p?.slug || '').toLowerCase().trim();

          if (id && pId === id) return true;
          if (email && pEmail === email) return true;
          if (tradeName && pName === tradeName) return true;
          if (slug && pSlug === slug) return true;
          return false;
        };

        const reg = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
        if (Array.isArray(reg)) {
          const updatedReg = reg.filter((p: any) => !matchesDeleted(p));
          localStorage.setItem('docsearch_registered_partners', JSON.stringify(updatedReg));
        }

        const live = JSON.parse(localStorage.getItem('docsearch_live_partners') || '[]');
        if (Array.isArray(live)) {
          const updatedLive = live.filter((p: any) => !matchesDeleted(p));
          localStorage.setItem('docsearch_live_partners', JSON.stringify(updatedLive));
        }

        const q = JSON.parse(localStorage.getItem('docsearch_verification_queue') || '[]');
        if (Array.isArray(q)) {
          const updatedQ = q.filter((p: any) => !matchesDeleted(p));
          localStorage.setItem('docsearch_verification_queue', JSON.stringify(updatedQ));
        }
      } catch (e) {
        console.warn('Error purging partner from localStorage:', e);
      }
    }

    return true;
  }

  async resetPartnerPassword(
    partnerIdOrEmail: string,
    newPassword?: string
  ): Promise<{ email: string; newPassword: string; success: boolean }> {
    const isEmail = partnerIdOrEmail.includes('@');
    const payload = isEmail
      ? { email: partnerIdOrEmail, newPassword }
      : { partnerId: partnerIdOrEmail, newPassword };

    const res = await fetch(`${this.apiUrl}/api/v1/company/partners/reset-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error?.message || 'Failed to reset partner password');
    }

    const json = await res.json();
    return json.data as { email: string; newPassword: string; success: boolean };
  }

  async getPartnerStaff(partnerId: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/company/partners/${partnerId}/staff`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.warn('Failed to fetch partner staff from API:', err);
    }
    return [];
  }

  async addPartnerStaff(partnerId: string, staffData: any): Promise<any> {
    const res = await fetch(`${this.apiUrl}/api/v1/company/partners/${partnerId}/staff`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(staffData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error?.message || 'Failed to add staff member');
    }

    const json = await res.json();
    return json.data;
  }

  async updatePartnerStaffStatus(partnerId: string, staffId: string, status: string, reason?: string): Promise<any> {
    const res = await fetch(`${this.apiUrl}/api/v1/company/partners/${partnerId}/staff/${staffId}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, reason })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error?.message || 'Failed to update staff status');
    }

    const json = await res.json();
    return json.data;
  }
}

export const partnerService = new PartnerService();
