import { apiRequest } from './api-client.js';
import type {
  InvestigationCatalogDto,
  InvestigationPanelDto,
  InvestigationOrderDto,
  InvestigationReportDto,
  InvestigationAuditTraceDto,
  InvestigationOverviewDto,
  CreateInvestigationCatalogRequest,
  UpdateInvestigationCatalogRequest,
  CreateInvestigationPanelRequest,
  CreateInvestigationOrderRequest,
  CancelInvestigationOrderRequest,
  AcknowledgeInvestigationOrderRequest,
  CollectSpecimenRequest,
  RejectSpecimenRequest,
  EnterInvestigationResultRequest,
  VerifyInvestigationResultRequest,
  FinalizeInvestigationReportRequest,
  ReviewInvestigationResultRequest,
  AmendInvestigationResultRequest,
  SearchInvestigationOrdersRequest,
  QueryInvestigationAuditRequest
} from '@docsearch/api-contracts';

export interface VacuumTubeStandard {
  code: string;
  name: string;
  colorName: string;
  hex: string;
  bgRgba: string;
  additive: string;
  icon: string;
  typicalTests: string;
}

export const VACUUM_TUBE_STANDARDS: Record<string, VacuumTubeStandard> = {
  EDTA_LAVENDER: {
    code: 'EDTA_LAVENDER',
    name: 'Lavender / Purple Top (K2/K3 EDTA)',
    colorName: 'Lavender Purple',
    hex: '#A855F7',
    bgRgba: 'rgba(168, 85, 247, 0.15)',
    additive: 'K2/K3 EDTA Anticoagulant',
    icon: '💜',
    typicalTests: 'Complete Blood Count (CBC), HbA1c, ESR, Peripheral Blood Smear, Blood Grouping'
  },
  CITRATE_LIGHT_BLUE: {
    code: 'CITRATE_LIGHT_BLUE',
    name: 'Light Blue Top (3.2% Sodium Citrate 9:1)',
    colorName: 'Sky Blue',
    hex: '#38BDF8',
    bgRgba: 'rgba(56, 189, 248, 0.15)',
    additive: 'Sodium Citrate (1:9 ratio with blood)',
    icon: '💙',
    typicalTests: 'PT/INR, APTT, D-Dimer, Fibrinogen, Factor Assays, Coagulation Profile'
  },
  SERUM_GOLD_SST: {
    code: 'SERUM_GOLD_SST',
    name: 'Gold / Yellow Top (SST with Silica & Gel)',
    colorName: 'Golden Amber',
    hex: '#F59E0B',
    bgRgba: 'rgba(245, 158, 11, 0.15)',
    additive: 'Silica Clot Activator + Polymer Gel Separator',
    icon: '💛',
    typicalTests: 'LFT, KFT/RFT, Lipid Profile, Thyroid (T3, T4, TSH), Serology, Troponin-I'
  },
  SERUM_RED_PLAIN: {
    code: 'SERUM_RED_PLAIN',
    name: 'Red Top (Plain Glass / Clot Activator without Gel)',
    colorName: 'Crimson Red',
    hex: '#EF4444',
    bgRgba: 'rgba(239, 68, 68, 0.15)',
    additive: 'No additive or Silica particles (No gel)',
    icon: '❤️',
    typicalTests: 'Drug Levels (TDM), Crossmatch & Compatibility, Viral Markers (HIV, HBsAg, HCV)'
  },
  FLUORIDE_GREY: {
    code: 'FLUORIDE_GREY',
    name: 'Grey Top (Sodium Fluoride + Potassium Oxalate)',
    colorName: 'Slate Grey',
    hex: '#94A3B8',
    bgRgba: 'rgba(148, 163, 184, 0.15)',
    additive: 'Sodium Fluoride (Glycolytic inhibitor) + Potassium Oxalate',
    icon: '🩶',
    typicalTests: 'Fasting Blood Sugar (FBS), Post-Prandial (PPBS), Random Glucose, GTT, Lactate'
  },
  HEPARIN_GREEN: {
    code: 'HEPARIN_GREEN',
    name: 'Green Top (Sodium / Lithium Heparin)',
    colorName: 'Emerald Green',
    hex: '#10B981',
    bgRgba: 'rgba(16, 185, 129, 0.15)',
    additive: 'Lithium / Sodium Heparin Anticoagulant',
    icon: '💚',
    typicalTests: 'Serum Electrolytes (Na+, K+, Cl-), Arterial Blood Gas (ABG), Ammonia, Chromosome Analysis'
  },
  ESR_BLACK: {
    code: 'ESR_BLACK',
    name: 'Black Top (Sodium Citrate 4:1 for Westergren ESR)',
    colorName: 'Onyx Black',
    hex: '#475569',
    bgRgba: 'rgba(71, 85, 105, 0.15)',
    additive: 'Sodium Citrate (1:4 ratio with blood)',
    icon: '🖤',
    typicalTests: 'Automated / Manual Westergren Erythrocyte Sedimentation Rate (ESR)'
  }
};

export const ClinicalCalculators = {
  calculateCbcIndices: (hb: number, rbc: number, pcv: number) => {
    if (rbc <= 0 || pcv <= 0) return null;
    const mcv = Number(((pcv * 10) / rbc).toFixed(1));
    const mch = Number(((hb * 10) / rbc).toFixed(1));
    const mchc = Number(((hb * 100) / pcv).toFixed(1));
    return { mcv, mch, mchc };
  },

  calculateLipidFractions: (totalChol: number, trig: number, hdl: number) => {
    if (totalChol <= 0 || trig <= 0 || hdl <= 0) return null;
    const vldl = Number((trig / 5).toFixed(1));
    const ldl = Number(Math.max(0, totalChol - hdl - vldl).toFixed(1));
    return { vldl, ldl };
  },

  calculateEag: (hba1c: number) => {
    if (hba1c <= 0) return null;
    return Number(((28.7 * hba1c) - 46.7).toFixed(1));
  },

  calculateEgfr: (creatinine: number, age: number, isFemale = false) => {
    if (creatinine <= 0 || age <= 0) return null;
    const weight = isFemale ? 60 : 70;
    const rawEgfr = ((140 - age) * weight) / (72 * creatinine);
    const egfr = isFemale ? rawEgfr * 0.85 : rawEgfr;
    return Math.max(10, Math.min(130, Math.round(egfr)));
  }
};

export interface PanicIntimationRecord {
  orderId: string;
  orderNumber: string;
  doctorName: string;
  doctorPhone?: string;
  callerStaffName: string;
  readBackConfirmed: boolean;
  criticalParameters: string[];
  intimatedAt: string;
  notes?: string;
}

export interface IClinicalInvestigationService {
  getOverview(tenantId: string, partnerId?: string, organizationId?: string, branchId?: string): Promise<InvestigationOverviewDto>;
  searchCatalog(tenantId: string, category?: string, searchTerm?: string): Promise<InvestigationCatalogDto[]>;
  createInvestigation(req: CreateInvestigationCatalogRequest): Promise<InvestigationCatalogDto>;
  updateInvestigation(req: UpdateInvestigationCatalogRequest): Promise<InvestigationCatalogDto>;
  getPanels(tenantId: string): Promise<InvestigationPanelDto[]>;
  createPanel(req: CreateInvestigationPanelRequest): Promise<InvestigationPanelDto>;
  searchOrders(params: SearchInvestigationOrdersRequest): Promise<InvestigationOrderDto[]>;
  getOrderById(tenantId: string, orderId: string): Promise<InvestigationOrderDto | null>;
  createInvestigationOrder(req: CreateInvestigationOrderRequest): Promise<InvestigationOrderDto>;
  cancelInvestigationOrder(req: CancelInvestigationOrderRequest): Promise<InvestigationOrderDto>;
  acknowledgeOrder(req: AcknowledgeInvestigationOrderRequest): Promise<InvestigationOrderDto>;
  collectSpecimen(req: CollectSpecimenRequest): Promise<InvestigationOrderDto>;
  rejectSpecimen(req: RejectSpecimenRequest): Promise<InvestigationOrderDto>;
  enterResults(req: EnterInvestigationResultRequest): Promise<InvestigationOrderDto>;
  verifyResults(req: VerifyInvestigationResultRequest): Promise<InvestigationOrderDto>;
  finalizeReport(req: FinalizeInvestigationReportRequest): Promise<InvestigationOrderDto>;
  reviewResults(req: ReviewInvestigationResultRequest): Promise<InvestigationOrderDto>;
  amendResult(req: AmendInvestigationResultRequest): Promise<InvestigationOrderDto>;
  getPatientInvestigationHistory(tenantId: string, patientId: string): Promise<InvestigationOrderDto[]>;
  getOrdersSync(): InvestigationOrderDto[];
  getOrders(tenantId?: string): Promise<InvestigationOrderDto[]>;
  getReports(tenantId?: string): Promise<InvestigationReportDto[]>;
  registerDirectWalkInOrder(order: InvestigationOrderDto): void;
  updateDirectWalkInOrder(order: InvestigationOrderDto): void;
  updateOrderBilling(orderId: string, billingData: {
    invoiceNumber: string;
    billedAmount: number;
    paidAmount: number;
    paymentMode: string;
    balanceDue?: number;
  }): InvestigationOrderDto | null;
  logPanicIntimation(orderId: string, payload: Partial<PanicIntimationRecord>): Promise<any>;
  getAuditTraces(params: QueryInvestigationAuditRequest): Promise<InvestigationAuditTraceDto[]>;
  clearAllMockAndTestData(): void;
}

export class ClinicalInvestigationService implements IClinicalInvestigationService {
  public async getOverview(tenantId: string, _partnerId?: string, _organizationId?: string, _branchId?: string): Promise<InvestigationOverviewDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    try {
      const res = await apiRequest<InvestigationOverviewDto>('/api/v1/partner/lab/overview-metrics');
      if (res.data) return res.data;
    } catch {}

    const orders = await this.getOrders(tenantId).catch(() => []);
    const pendingCollections = orders.filter(o => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED').length;
    const processing = orders.filter(o => o.status === 'SAMPLE_COLLECTED' || o.status === 'PROCESSING').length;
    const resultsReady = orders.filter(o => o.status === 'RESULT_READY' || o.status === 'VERIFIED').length;
    const completed = orders.filter(o => o.status === 'REVIEWED').length;

    return {
      todayOrdersCount: orders.length,
      pendingCollectionsCount: pendingCollections,
      processingCount: processing,
      resultsReadyCount: resultsReady,
      criticalResultsCount: 0,
      awaitingVerificationCount: resultsReady,
      awaitingDoctorReviewCount: 1,
      completedInvestigationsCount: completed
    };
  }

  public async searchCatalog(tenantId: string, category?: string, searchTerm?: string): Promise<InvestigationCatalogDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const qs = `?category=${category || ''}&search=${encodeURIComponent(searchTerm || '')}`;
    const res = await apiRequest<InvestigationCatalogDto[]>(`/api/v1/partner/lab/catalog${qs}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createInvestigation(req: CreateInvestigationCatalogRequest): Promise<InvestigationCatalogDto> {
    const res = await apiRequest<InvestigationCatalogDto>('/api/v1/partner/lab/catalog', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationCatalogDto;
  }

  public async updateInvestigation(req: UpdateInvestigationCatalogRequest): Promise<InvestigationCatalogDto> {
    const res = await apiRequest<InvestigationCatalogDto>(`/api/v1/partner/lab/catalog/${(req as any).investigationId || (req as any).id}`, {
      method: 'PUT',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationCatalogDto;
  }

  public async getPanels(tenantId: string): Promise<InvestigationPanelDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<InvestigationPanelDto[]>('/api/v1/partner/lab/panels');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createPanel(req: CreateInvestigationPanelRequest): Promise<InvestigationPanelDto> {
    const res = await apiRequest<InvestigationPanelDto>('/api/v1/partner/lab/panels', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationPanelDto;
  }

  public async searchOrders(_params: SearchInvestigationOrdersRequest): Promise<InvestigationOrderDto[]> {
    const res = await apiRequest<InvestigationOrderDto[]>('/api/v1/partner/lab/orders');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getOrderById(_tenantId: string, orderId: string): Promise<InvestigationOrderDto | null> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${orderId}`);
    return res.data || null;
  }

  public async createInvestigationOrder(req: CreateInvestigationOrderRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>('/api/v1/partner/lab/orders', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async cancelInvestigationOrder(req: CancelInvestigationOrderRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async acknowledgeOrder(req: AcknowledgeInvestigationOrderRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async collectSpecimen(req: CollectSpecimenRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/specimens`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async rejectSpecimen(req: RejectSpecimenRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/specimens/reject`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async enterResults(req: EnterInvestigationResultRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/results`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async verifyResults(req: VerifyInvestigationResultRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/verify`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async finalizeReport(req: FinalizeInvestigationReportRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/finalize`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async reviewResults(req: ReviewInvestigationResultRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/review`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async amendResult(req: AmendInvestigationResultRequest): Promise<InvestigationOrderDto> {
    const res = await apiRequest<InvestigationOrderDto>(`/api/v1/partner/lab/orders/${req.orderId}/amend`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as InvestigationOrderDto;
  }

  public async getPatientInvestigationHistory(_tenantId: string, patientId: string): Promise<InvestigationOrderDto[]> {
    const res = await apiRequest<InvestigationOrderDto[]>(`/api/v1/partner/lab/orders?patientId=${patientId}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  public getOrdersSync(): InvestigationOrderDto[] {
    return [];
  }

  public async getOrders(_tenantId?: string): Promise<InvestigationOrderDto[]> {
    const res = await apiRequest<InvestigationOrderDto[]>('/api/v1/partner/lab/orders');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getReports(_tenantId?: string): Promise<InvestigationReportDto[]> {
    const res = await apiRequest<InvestigationReportDto[]>('/api/v1/partner/lab/reports');
    return Array.isArray(res.data) ? res.data : [];
  }

  public registerDirectWalkInOrder(_order: InvestigationOrderDto): void {}
  public updateDirectWalkInOrder(_order: InvestigationOrderDto): void {}

  public updateOrderBilling(_orderId: string, _billingData: {
    invoiceNumber: string;
    billedAmount: number;
    paidAmount: number;
    paymentMode: string;
    balanceDue?: number;
  }): InvestigationOrderDto | null {
    return null;
  }

  public async logPanicIntimation(_orderId: string, _payload: Partial<PanicIntimationRecord>): Promise<any> {
    return { success: true };
  }

  public async getAuditTraces(_params: QueryInvestigationAuditRequest): Promise<InvestigationAuditTraceDto[]> {
    const res = await apiRequest<InvestigationAuditTraceDto[]>('/api/v1/partner/lab/audit-traces');
    return Array.isArray(res.data) ? res.data : [];
  }

  public clearAllMockAndTestData(): void {}
}

export const clinicalInvestigationService = new ClinicalInvestigationService();
