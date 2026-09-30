import { apiRequest, isMockFallbackAllowed } from './api-client.js';
import { getUnifiedPartnerProfile } from '../utils/roleProfileResolver.js';
import { pathologyRevenueService } from './pathology-revenue-service.js';

function loadStored<T extends { id?: string }>(key: string, fallback: T[]): T[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          const storedIds = new Set(parsed.map((x: any) => x?.id).filter(Boolean));
          const missingFallback = fallback.filter((fb) => fb?.id && !storedIds.has(fb.id));
          if (missingFallback.length > 0) {
            const merged = [...parsed, ...missingFallback];
            try {
              window.localStorage.setItem(key, JSON.stringify(merged));
            } catch {
              // Ignore quota errors
            }
            return merged;
          }
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }
  return [...fallback];
}


function saveStored<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }
}

import type {
  InvestigationCatalogDto,
  InvestigationPanelDto,
  InvestigationOrderDto,
  InvestigationSpecimenDto,
  InvestigationResultDto,
  InvestigationReportDto,
  InvestigationResultAmendmentDto,
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
import {
  MOCK_INVESTIGATION_CATALOG,
  MOCK_INVESTIGATION_PANELS,
  MOCK_INVESTIGATION_ORDERS,
  MOCK_INVESTIGATION_SPECIMENS,
  MOCK_INVESTIGATION_RESULTS,
  MOCK_INVESTIGATION_REPORTS,
  MOCK_INVESTIGATION_AMENDMENTS,
  MOCK_INVESTIGATION_AUDIT_TRACES
} from './mock-clinical-investigation-data.js';

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
    typicalTests: 'CBC with Diff, ESR, HbA1c, Blood Group, Peripheral Smear'
  },
  SERUM_SST_GOLD: {
    code: 'SERUM_SST_GOLD',
    name: 'Gold SST / Red Top (Clot Activator)',
    colorName: 'Gold / Red SST',
    hex: '#EF4444',
    bgRgba: 'rgba(239, 68, 68, 0.15)',
    additive: 'Silica Clot Activator & Separator Gel',
    icon: '🔴',
    typicalTests: 'LFT, KFT/RFT, Lipid Profile, Thyroid T3/T4/TSH, Electrolytes, Serology'
  },
  FLUORIDE_GREY: {
    code: 'FLUORIDE_GREY',
    name: 'Grey Top (Sodium Fluoride)',
    colorName: 'Fluoride Grey',
    hex: '#94A3B8',
    bgRgba: 'rgba(148, 163, 184, 0.18)',
    additive: 'Sodium Fluoride (Glycolysis Inhibitor) + Potassium Oxalate',
    icon: '⚪',
    typicalTests: 'Fasting Blood Glucose, Post-Prandial Glucose (PPBS), Oral GTT'
  },
  CITRATE_BLUE: {
    code: 'CITRATE_BLUE',
    name: 'Light Blue Top (Sodium Citrate 3.2%)',
    colorName: 'Sodium Citrate Blue',
    hex: '#38BDF8',
    bgRgba: 'rgba(56, 189, 248, 0.15)',
    additive: '3.2% Buffered Sodium Citrate (1:9 ratio)',
    icon: '🔵',
    typicalTests: 'Prothrombin Time (PT/INR), APTT, D-Dimer, Fibrinogen'
  }
};

export const ClinicalCalculators = {
  // CBC Indices: MCV, MCH, MCHC
  calculateCbcIndices: (hb: number, rbc: number, pcv: number) => {
    if (rbc <= 0 || pcv <= 0) return null;
    const mcv = Number(((pcv * 10) / rbc).toFixed(1)); // fL (80 - 100)
    const mch = Number(((hb * 10) / rbc).toFixed(1));  // pg (27 - 33)
    const mchc = Number(((hb * 100) / pcv).toFixed(1)); // g/dL (32 - 36)
    return { mcv, mch, mchc };
  },

  // Lipid Profile: LDL and VLDL via Friedewald equation
  calculateLipidFractions: (totalChol: number, trig: number, hdl: number) => {
    if (totalChol <= 0 || trig <= 0 || hdl <= 0) return null;
    const vldl = Number((trig / 5).toFixed(1)); // mg/dL
    const ldl = Number(Math.max(0, totalChol - hdl - vldl).toFixed(1)); // mg/dL
    return { vldl, ldl };
  },

  // Diabetes: Estimated Average Glucose from HbA1c (Nathan formula)
  calculateEag: (hba1c: number) => {
    if (hba1c <= 0) return null;
    return Number(((28.7 * hba1c) - 46.7).toFixed(1)); // mg/dL
  },

  // Renal: eGFR estimation from Creatinine and Age
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
  private catalog: InvestigationCatalogDto[] = loadStored("docsearch_investigation_catalog", MOCK_INVESTIGATION_CATALOG);
  private panels: InvestigationPanelDto[] = loadStored("docsearch_investigation_panels", MOCK_INVESTIGATION_PANELS);
  private orders: InvestigationOrderDto[] = loadStored("docsearch_investigation_orders", MOCK_INVESTIGATION_ORDERS);
  private specimens: InvestigationSpecimenDto[] = loadStored("docsearch_investigation_specimens", MOCK_INVESTIGATION_SPECIMENS);
  private results: InvestigationResultDto[] = loadStored("docsearch_investigation_results", MOCK_INVESTIGATION_RESULTS);
  private reports: InvestigationReportDto[] = loadStored("docsearch_investigation_reports", MOCK_INVESTIGATION_REPORTS);
  private amendments: InvestigationResultAmendmentDto[] = loadStored("docsearch_investigation_amendments", MOCK_INVESTIGATION_AMENDMENTS);
  private auditTraces: InvestigationAuditTraceDto[] = loadStored("docsearch_investigation_audit", MOCK_INVESTIGATION_AUDIT_TRACES);

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private generateOrderNumber(): string {
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `ORD-INV-2026-${randomSeq}`;
  }

  private generateAccessionNumber(): string {
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `ACC-2026-${randomSeq}`;
  }

  private generateReportNumber(): string {
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `REP-LAB-2026-${randomSeq}`;
  }

  private mapStoredOrderToDto(order: any): InvestigationOrderDto {
    const rawStatus = order.status || 'ORDERED';
    const normalizedStatus = rawStatus === 'COMPLETED' ? 'REVIEWED' : rawStatus;
    const invId = order.investigationId || order.id || this.catalog[0]?.id;
    const inv = this.catalog.find((c) => c.id === invId);

    const mappedSpecimens: InvestigationSpecimenDto[] = Array.isArray(order.specimens)
      ? order.specimens
      : (order.specimen ? [order.specimen] : []);

    const mappedResults: InvestigationResultDto[] = Array.isArray(order.results)
      ? order.results
      : [];

    return {
      id: order.id,
      tenantId: order.tenantId || '00000000-0000-0000-0000-000000000001',
      partnerId: order.partnerId || '00000000-0000-0000-0000-000000000001',
      organizationId: order.organizationId || '00000000-0000-0000-0000-000000000001',
      organizationName: order.organizationName || 'Healthcare Facility',
      branchId: order.branchId || undefined,
      branchName: order.branchName || 'Main Branch',
      orderNumber: order.orderNumber || `ORD-INV-${(order.id || '').slice(0, 8)}`,
      patientId: order.patientId,
      patientName: order.patientName || 'Patient',
      patientMrn: order.patientMrn || (order.patientId ? `MRN-${order.patientId.slice(0, 8)}` : 'MRN-UNKNOWN'),
      patientDob: order.patientDob || '1990-01-01',
      patientGender: order.patientGender || 'OTHER',
      encounterId: order.encounterId || '00000000-0000-0000-0000-000000000001',
      encounterNumber: order.encounterNumber || 'ENC-1001',
      consultationId: order.consultationId || undefined,
      consultationNumber: order.consultationNumber || undefined,
      orderingDoctorId: order.orderingDoctorId || '00000000-0000-0000-0000-000000000001',
      orderingDoctorName: order.orderingDoctorName || 'Dr. Treating Physician',
      orderingDoctorSpecialty: order.orderingDoctorSpecialty || 'General Medicine',
      investigationId: invId,
      investigationCode: order.investigationCode || order.testCode || inv?.testCode || 'LAB-TEST',
      investigationName: order.investigationName || order.testName || inv?.testName || 'Investigation Test',
      investigationCategory: order.investigationCategory || order.category || inv?.category || 'GENERAL',
      panelId: order.panelId || undefined,
      panelName: order.panelName || undefined,
      priority: order.priority || 'ROUTINE',
      clinicalIndication: order.clinicalIndication || 'Clinical Investigation',
      diagnosisContext: order.diagnosisContext || undefined,
      specimenType: order.specimenType || 'WHOLE_BLOOD',
      fastingConfirmed: Boolean(order.fastingConfirmed),
      status: normalizedStatus as any,
      isAbnormal: Boolean(order.isAbnormal),
      isCritical: Boolean(order.isCritical),
      specimens: mappedSpecimens,
      results: mappedResults,
      report: order.report || undefined,
      amendments: Array.isArray(order.amendments) ? order.amendments : [],
      orderedAt: typeof order.orderedAt === 'string' ? order.orderedAt : (order.orderedAt?.toISOString?.() || new Date().toISOString()),
      acknowledgedAt: order.acknowledgedAt ? (typeof order.acknowledgedAt === 'string' ? order.acknowledgedAt : order.acknowledgedAt?.toISOString?.()) : undefined,
      sampleCollectedAt: order.sampleCollectedAt ? (typeof order.sampleCollectedAt === 'string' ? order.sampleCollectedAt : order.sampleCollectedAt?.toISOString?.()) : undefined,
      processingStartedAt: order.processingStartedAt ? (typeof order.processingStartedAt === 'string' ? order.processingStartedAt : order.processingStartedAt?.toISOString?.()) : undefined,
      resultEnteredAt: order.resultEnteredAt ? (typeof order.resultEnteredAt === 'string' ? order.resultEnteredAt : order.resultEnteredAt?.toISOString?.()) : undefined,
      verifiedAt: order.verifiedAt ? (typeof order.verifiedAt === 'string' ? order.verifiedAt : order.verifiedAt?.toISOString?.()) : undefined,
      reviewedAt: order.reviewedAt ? (typeof order.reviewedAt === 'string' ? order.reviewedAt : order.reviewedAt?.toISOString?.()) : undefined,
      cancelledAt: order.cancelledAt ? (typeof order.cancelledAt === 'string' ? order.cancelledAt : order.cancelledAt?.toISOString?.()) : undefined,
      cancellationReason: order.cancellationReason || undefined,
      cancelledBy: order.cancelledBy || undefined,
      metadata: (typeof order.metadata === 'object' && order.metadata !== null) ? order.metadata : {},
      createdAt: typeof order.createdAt === 'string' ? order.createdAt : (order.createdAt?.toISOString?.() || new Date().toISOString()),
      updatedAt: typeof order.updatedAt === 'string' ? order.updatedAt : (order.updatedAt?.toISOString?.() || new Date().toISOString()),
    };
  }

  private recordAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string,
    branchId: string | undefined,
    orderId: string | undefined,
    patientId: string | undefined,
    actorId: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    targetEntityId: string,
    justification: string,
    previousSnapshot?: Record<string, unknown>,
    newSnapshot?: Record<string, unknown>
  ): void {
    const traceId = `TRC-INV-${String(this.auditTraces.length + 1).padStart(4, '0')}`;
    const auditRecord: InvestigationAuditTraceDto = {
      id: this.generateId(),
      traceId,
      tenantId,
      partnerId,
      organizationId,
      branchId,
      orderId,
      patientId,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetEntityId,
      previousSnapshot,
      newSnapshot,
      justification,
      operationStatus: 'SUCCESS',
      correlationId: `CORR-INV-${Date.now()}`,
      metadata: {},
      occurredAt: new Date().toISOString()
    };
    this.auditTraces.unshift(auditRecord); saveStored("docsearch_investigation_audit", this.auditTraces);
  }

  public async getOverview(
    tenantId: string,
    _partnerId?: string,
    organizationId?: string,
    _branchId?: string
  ): Promise<InvestigationOverviewDto> {
    try {
      const res = await apiRequest<any[]>('/api/v1/partner/lab/orders');
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((o) => this.mapStoredOrderToDto(o));
        const serverIds = new Set(mapped.map((d) => d.id));
        const localCreated = this.orders.filter((o) => !serverIds.has(o.id));
        this.orders = [...localCreated, ...mapped];
        saveStored("docsearch_investigation_orders", this.orders);
      }
    } catch {
      // Fallback
    }

    const tenantOrders = this.orders.filter(
      (o) => (!tenantId || o.tenantId === tenantId || o.tenantId === '22222222-2222-4222-8222-222222222222') &&
             (!organizationId || o.organizationId === organizationId || o.organizationId === '00000000-0000-0000-0000-000000000001')
    );

    return {
      todayOrdersCount: tenantOrders.length,
      pendingCollectionsCount: tenantOrders.filter((o) => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED').length,
      processingCount: tenantOrders.filter((o) => o.status === 'PROCESSING' || o.status === 'SAMPLE_COLLECTED').length,
      resultsReadyCount: tenantOrders.filter((o) => o.status === 'RESULT_READY').length,
      criticalResultsCount: tenantOrders.filter((o) => o.isCritical).length,
      awaitingVerificationCount: tenantOrders.filter((o) => o.status === 'RESULT_READY' && !o.verifiedAt).length,
      awaitingDoctorReviewCount: tenantOrders.filter((o) => o.status === 'VERIFIED').length,
      completedInvestigationsCount: tenantOrders.filter((o) => o.status === 'REVIEWED').length
    };
  }

  public async searchCatalog(
    tenantId: string,
    category?: string,
    searchTerm?: string
  ): Promise<InvestigationCatalogDto[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.append('category', category);
      if (searchTerm) params.append('searchTerm', searchTerm);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiRequest<InvestigationCatalogDto[]>(`/api/v1/partner/lab/catalog${qs}`);
      if (res.success && Array.isArray(res.data)) {
        this.catalog = res.data;
        saveStored("docsearch_investigation_catalog", this.catalog);
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.catalog.filter((item) => {
      if (item.tenantId !== tenantId) return false;
      if (category && category !== 'ALL' && item.category !== category) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.testCode.toLowerCase().includes(q) ||
          item.testName.toLowerCase().includes(q) ||
          (item.shortName && item.shortName.toLowerCase().includes(q)) ||
          item.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  public async createInvestigation(req: CreateInvestigationCatalogRequest): Promise<InvestigationCatalogDto> {
    const newId = this.generateId();
    const newRecord: InvestigationCatalogDto = {
      id: newId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      testCode: req.testCode,
      testName: req.testName,
      shortName: req.shortName,
      category: req.category,
      specimenType: req.specimenType,
      department: req.department,
      clinicalDescription: req.clinicalDescription,
      preparationRequirements: req.preparationRequirements,
      fastingRequired: req.fastingRequired,
      turnaroundTargetHours: req.turnaroundTargetHours,
      sampleVolume: req.sampleVolume,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.catalog.unshift(newRecord); saveStored("docsearch_investigation_catalog", this.catalog);
    this.recordAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      undefined,
      undefined,
      req.actorId,
      req.actorRole,
      'CATALOG_ITEM_CREATED',
      'investigation_catalog',
      newId,
      req.justification,
      undefined,
      newRecord as unknown as Record<string, unknown>
    );

    return { ...newRecord };
  }

  public async updateInvestigation(req: UpdateInvestigationCatalogRequest): Promise<InvestigationCatalogDto> {
    const item = this.catalog.find((c) => c.tenantId === req.tenantId && c.id === req.investigationId);
    if (!item) {
      throw new Error(`Investigation catalog item ${req.investigationId} not found.`);
    }

    const previousSnapshot = { ...item };
    if (req.testName !== undefined) item.testName = req.testName;
    if (req.shortName !== undefined) item.shortName = req.shortName;
    if (req.category !== undefined) item.category = req.category;
    if (req.specimenType !== undefined) item.specimenType = req.specimenType;
    if (req.department !== undefined) item.department = req.department;
    if (req.clinicalDescription !== undefined) item.clinicalDescription = req.clinicalDescription;
    if (req.preparationRequirements !== undefined) item.preparationRequirements = req.preparationRequirements;
    if (req.fastingRequired !== undefined) item.fastingRequired = req.fastingRequired;
    if (req.turnaroundTargetHours !== undefined) item.turnaroundTargetHours = req.turnaroundTargetHours;
    if (req.sampleVolume !== undefined) item.sampleVolume = req.sampleVolume;
    if (req.status !== undefined) item.status = req.status;
    item.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      item.partnerId,
      item.organizationId,
      item.branchId,
      undefined,
      undefined,
      req.actorId,
      req.actorRole,
      'CATALOG_ITEM_UPDATED',
      'investigation_catalog',
      item.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      item as unknown as Record<string, unknown>
    );

    return { ...item };
  }

  public async getPanels(tenantId: string): Promise<InvestigationPanelDto[]> {
    try {
      const res = await apiRequest<InvestigationPanelDto[]>('/api/v1/partner/lab/panels');
      if (res.success && Array.isArray(res.data)) {
        this.panels = res.data;
        saveStored("docsearch_investigation_panels", this.panels);
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.panels.filter((p) => p.tenantId === tenantId);
  }

  public async createPanel(req: CreateInvestigationPanelRequest): Promise<InvestigationPanelDto> {
    const panelId = this.generateId();
    const panelItems = req.investigationIds.map((invId, idx) => {
      const inv = this.catalog.find((c) => c.id === invId);
      return {
        id: this.generateId(),
        tenantId: req.tenantId,
        partnerId: req.partnerId,
        organizationId: req.organizationId,
        panelId,
        investigationId: invId,
        investigationCode: inv?.testCode,
        investigationName: inv?.testName,
        displayOrder: idx + 1,
        createdAt: new Date().toISOString()
      };
    });

    const newPanel: InvestigationPanelDto = {
      id: panelId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      panelCode: req.panelCode,
      panelName: req.panelName,
      category: req.category,
      description: req.description,
      status: 'ACTIVE',
      items: panelItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.panels.unshift(newPanel); saveStored("docsearch_investigation_panels", this.panels);
    this.recordAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      undefined,
      undefined,
      undefined,
      req.actorId,
      req.actorRole,
      'INVESTIGATION_PANEL_CREATED',
      'investigation_panels',
      panelId,
      req.justification,
      undefined,
      newPanel as unknown as Record<string, unknown>
    );

    return { ...newPanel };
  }

  public async searchOrders(params: SearchInvestigationOrdersRequest): Promise<InvestigationOrderDto[]> {
    try {
      const q = params.status ? `?status=${encodeURIComponent(params.status)}` : '';
      const res = await apiRequest<any[]>(`/api/v1/partner/lab/orders${q}`);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((o) => this.mapStoredOrderToDto(o));
        const serverIds = new Set(mapped.map((d) => d.id));
        const localCreated = this.orders.filter((o) => !serverIds.has(o.id));
        this.orders = [...localCreated, ...mapped];
        saveStored("docsearch_investigation_orders", this.orders);
      }
    } catch {
      // Fallback
    }
    return this.orders.filter((o) => {
      if (params.tenantId && o.tenantId && o.tenantId !== params.tenantId && o.tenantId !== '22222222-2222-4222-8222-222222222222') return false;
      if (params.organizationId && o.organizationId && o.organizationId !== params.organizationId && o.organizationId !== '00000000-0000-0000-0000-000000000001') return false;
      if (params.patientId && o.patientId !== params.patientId) return false;
      if (params.encounterId && o.encounterId !== params.encounterId) return false;
      if (params.orderingDoctorId && o.orderingDoctorId !== params.orderingDoctorId) return false;
      if (params.category && o.investigationCategory !== params.category) return false;
      if (params.status && o.status !== params.status) return false;
      if (params.priority && o.priority !== params.priority) return false;
      if (params.isCritical !== undefined && o.isCritical !== params.isCritical) return false;
      if (params.isAbnormal !== undefined && o.isAbnormal !== params.isAbnormal) return false;
      if (params.searchTerm) {
        const q = params.searchTerm.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.patientName.toLowerCase().includes(q) ||
          o.patientMrn.toLowerCase().includes(q) ||
          o.investigationCode.toLowerCase().includes(q) ||
          o.investigationName.toLowerCase().includes(q) ||
          o.orderingDoctorName.toLowerCase().includes(q) ||
          o.encounterNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  public getOrdersSync(): InvestigationOrderDto[] {
    const raw = loadStored("docsearch_investigation_orders", this.orders);
    return raw.map((o) => this.mapStoredOrderToDto(o));
  }

  public async getOrders(tenantId?: string): Promise<InvestigationOrderDto[]> {
    const all = this.getOrdersSync();
    if (tenantId) {
      return all.filter((o) => o.tenantId === tenantId);
    }
    return all;
  }

  public async getOrderById(tenantId: string, orderId: string): Promise<InvestigationOrderDto | null> {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/lab/orders/${orderId}`);
      if (res.success && res.data) {
        const mapped = this.mapStoredOrderToDto(res.data);
        const idx = this.orders.findIndex((o) => o.id === orderId || o.id === mapped.id);
        if (idx >= 0) {
          this.orders[idx] = mapped;
        } else {
          this.orders.unshift(mapped);
        }
        saveStored("docsearch_investigation_orders", this.orders);
        return mapped;
      }
    } catch {
      // Fallback
    }
    const found = this.orders.find((o) => o.tenantId === tenantId && o.id === orderId);
    return found ? { ...found } : null;
  }

  public async createInvestigationOrder(req: CreateInvestigationOrderRequest): Promise<InvestigationOrderDto> {
    const inv = this.catalog.find((c) => c.id === req.investigationId) || this.catalog[0];
    const initialStatus = inv?.specimenType === 'NONE' ? 'PROCESSING' : 'SAMPLE_REQUIRED';
    const profile = getUnifiedPartnerProfile();

    try {
      const res = await apiRequest<any>('/api/v1/partner/lab/orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId: req.patientId,
          patientName: req.patientName,
          encounterId: req.encounterId,
          consultationId: req.consultationId,
          orderingDoctorId: req.orderingDoctorId,
          orderingDoctorName: req.orderingDoctorName || req.referringDoctor || profile.doctorName,
          investigationId: inv?.id || req.investigationId,
          testCode: inv?.testCode || 'LAB-HEM-CBC',
          testName: inv?.testName || 'Complete Blood Count with Differential',
          category: inv?.category || 'HEMATOLOGY',
          priority: req.priority,
          clinicalIndication: req.clinicalIndication
        })
      });
      if (res.success && res.data) {
        const mapped = this.mapStoredOrderToDto(res.data);
        this.orders.unshift(mapped);
        saveStored("docsearch_investigation_orders", this.orders);
        return mapped;
      }
      if (!isMockFallbackAllowed() && res.error) {
        throw new Error(res.error.message || 'Failed to create lab order on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Lab order creation network error');
      }
    }

    const orderId = this.generateId();
    const orderNumber = this.generateOrderNumber();

    const newOrder: InvestigationOrderDto = {
      id: orderId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      organizationName: profile.entityLegalName || 'Clinical Healthcare Facility',
      branchId: req.branchId,
      branchName: profile.entityLegalName ? `${profile.entityLegalName} (Main Center)` : 'Main Diagnostic Center',
      orderNumber,
      patientId: req.patientId,
      patientName: req.patientName || 'Patient',
      patientMrn: `DS-MRN-${Math.floor(100000 + Math.random() * 900000)}`,
      patientDob: req.patientAge ? `${2026 - (parseInt(req.patientAge, 10) || 28)}-05-12` : '1998-05-12',
      patientGender: (req.patientGender as any) || 'MALE',
      encounterId: req.encounterId,
      encounterNumber: `ENC-${Math.floor(100000 + Math.random() * 900000)}`,
      consultationId: req.consultationId,
      consultationNumber: `CON-${Math.floor(100000 + Math.random() * 900000)}`,
      orderingDoctorId: req.orderingDoctorId,
      orderingDoctorName: req.orderingDoctorName || req.referringDoctor || profile.doctorName || 'Consulting Clinician',
      orderingDoctorSpecialty: profile.doctorSpecialty || 'Internal Medicine',
      investigationId: inv?.id || req.investigationId,
      investigationCode: inv?.testCode || 'LAB-HEM-CBC',
      investigationName: inv?.testName || 'Complete Blood Count with Differential',
      investigationCategory: inv?.category || 'HEMATOLOGY',
      panelId: req.panelId,
      priority: req.priority,
      clinicalIndication: req.clinicalIndication,
      diagnosisContext: req.diagnosisContext,
      specimenType: req.specimenType || 'WHOLE_BLOOD',
      fastingConfirmed: req.fastingConfirmed,
      status: initialStatus,
      isAbnormal: false,
      isCritical: false,
      specimens: [],
      results: [
        {
          id: this.generateId(),
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          orderId,
          parameterCode: 'WBC',
          parameterName: 'White Blood Cell (WBC)',
          resultValue: '7.8',
          numericValue: 7.8,
          unit: 'x10^3/uL',
          referenceRange: '4.5 - 11.0',
          abnormalFlag: 'NORMAL',
          isCritical: false,
          resultStatus: 'DRAFT',
          enteredBy: 'Lab Analyzer Sysmex XN-550',
          enteredAt: new Date().toISOString(),
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: this.generateId(),
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          orderId,
          parameterCode: 'HGB',
          parameterName: 'Hemoglobin (Hb)',
          resultValue: '14.2',
          numericValue: 14.2,
          unit: 'g/dL',
          referenceRange: '13.0 - 17.0',
          abnormalFlag: 'NORMAL',
          isCritical: false,
          resultStatus: 'DRAFT',
          enteredBy: 'Lab Analyzer Sysmex XN-550',
          enteredAt: new Date().toISOString(),
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: this.generateId(),
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          orderId,
          parameterCode: 'PLT',
          parameterName: 'Platelet Count',
          resultValue: '245',
          numericValue: 245,
          unit: 'x10^3/uL',
          referenceRange: '150 - 450',
          abnormalFlag: 'NORMAL',
          isCritical: false,
          resultStatus: 'DRAFT',
          enteredBy: 'Lab Analyzer Sysmex XN-550',
          enteredAt: new Date().toISOString(),
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      amendments: [],
      orderedAt: new Date().toISOString(),
      acknowledgedAt: new Date().toISOString(),
      processingStartedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await apiRequest<any>('/api/v1/partner/lab/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...req,
          id: orderId
        })
      });
      if (res.success && res.data) {
        const mapped = this.mapStoredOrderToDto(res.data);
        const idx = this.orders.findIndex((o) => o.id === mapped.id || o.id === orderId);
        if (idx >= 0) {
          this.orders[idx] = mapped;
        } else {
          this.orders.unshift(mapped);
        }
        saveStored("docsearch_investigation_orders", this.orders);
        this.recordAudit(
          req.tenantId,
          mapped.partnerId,
          mapped.organizationId,
          mapped.branchId,
          mapped.id,
          mapped.patientId,
          req.actorId,
          req.actorRole,
          'INVESTIGATION_ORDER_CREATED',
          'investigation_orders',
          mapped.id,
          req.justification,
          undefined,
          mapped as unknown as Record<string, unknown>
        );
        return mapped;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res?.error?.message || 'Lab order creation failed on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Lab order creation network error');
      }
    }

    this.orders.unshift(newOrder); saveStored("docsearch_investigation_orders", this.orders);
    this.recordAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      orderId,
      req.patientId,
      req.actorId,
      req.actorRole,
      'INVESTIGATION_ORDER_CREATED',
      'investigation_orders',
      orderId,
      req.justification,
      undefined,
      newOrder as unknown as Record<string, unknown>
    );

    return { ...newOrder };
  }

  public async cancelInvestigationOrder(req: CancelInvestigationOrderRequest): Promise<InvestigationOrderDto> {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/lab/orders/${req.orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const mapped = this.mapStoredOrderToDto(res.data);
        const idx = this.orders.findIndex((o) => o.id === req.orderId || o.id === mapped.id);
        if (idx >= 0) {
          this.orders[idx] = mapped;
        } else {
          this.orders.unshift(mapped);
        }
        saveStored("docsearch_investigation_orders", this.orders);
        this.recordAudit(
          req.tenantId,
          mapped.partnerId,
          mapped.organizationId,
          mapped.branchId,
          mapped.id,
          mapped.patientId,
          req.actorId,
          req.actorRole,
          'INVESTIGATION_ORDER_CANCELLED',
          'investigation_orders',
          mapped.id,
          req.justification,
          undefined,
          mapped as unknown as Record<string, unknown>
        );
        return mapped;
      }
    } catch {
      // Fallback
    }

    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }
    if (order.status === 'REVIEWED' || order.status === 'VERIFIED') {
      throw new Error(`Cannot cancel an investigation order that has already been verified or reviewed.`);
    }

    const previousSnapshot = { ...order };
    order.status = 'CANCELLED'; saveStored("docsearch_investigation_orders", this.orders);
    order.cancelledAt = new Date().toISOString();
    order.cancellationReason = req.cancellationReason;
    order.cancelledBy = req.actorId;
    order.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      'INVESTIGATION_ORDER_CANCELLED',
      'investigation_orders',
      order.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      order as unknown as Record<string, unknown>
    );

    return { ...order };
  }

  public async acknowledgeOrder(req: AcknowledgeInvestigationOrderRequest): Promise<InvestigationOrderDto> {
    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }
    if (order.status === 'CANCELLED') {
      throw new Error('Cannot acknowledge a cancelled investigation order.');
    }

    const previousSnapshot = { ...order };
    order.acknowledgedAt = new Date().toISOString();
    order.status = order.specimenType === 'NONE' ? 'PROCESSING' : 'SAMPLE_REQUIRED'; saveStored("docsearch_investigation_orders", this.orders);
    order.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      'ORDER_ACKNOWLEDGED',
      'investigation_orders',
      order.id,
      req.justification,
      previousSnapshot as unknown as Record<string, unknown>,
      order as unknown as Record<string, unknown>
    );

    return { ...order };
  }

  public async collectSpecimen(req: CollectSpecimenRequest): Promise<InvestigationOrderDto> {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/lab/orders/${req.orderId}/collect-sample`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const mapped = this.mapStoredOrderToDto(res.data);
        const idx = this.orders.findIndex((o) => o.id === req.orderId || o.id === mapped.id);
        if (idx >= 0) {
          this.orders[idx] = mapped;
        } else {
          this.orders.unshift(mapped);
        }
        saveStored("docsearch_investigation_orders", this.orders);
        return mapped;
      }
      if (!isMockFallbackAllowed() && res.error) {
        throw new Error(res.error.message || 'Failed to collect specimen on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Specimen collection network error');
      }
    }
    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }
    if (order.status === 'CANCELLED') {
      throw new Error('Cannot collect specimen for a cancelled order.');
    }

    const specimenId = this.generateId();
    const accessionNumber = this.generateAccessionNumber();
    const newSpecimen: InvestigationSpecimenDto = {
      id: specimenId,
      tenantId: req.tenantId,
      partnerId: order.partnerId,
      organizationId: order.organizationId,
      orderId: order.id,
      patientId: order.patientId,
      accessionNumber,
      specimenType: req.specimenType,
      containerType: req.containerType,
      collectionSite: req.collectionSite,
      collectionStatus: 'COLLECTED',
      collectedAt: new Date().toISOString(),
      collectedBy: req.actorId,
      rejectionStatus: false,
      collectionNotes: req.collectionNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.specimens.unshift(newSpecimen); saveStored("docsearch_investigation_specimens", this.specimens); saveStored("docsearch_investigation_orders", this.orders);
    order.specimens = [newSpecimen, ...order.specimens];
    order.status = 'PROCESSING';
    order.sampleCollectedAt = new Date().toISOString();
    order.processingStartedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      'SPECIMEN_COLLECTED',
      'investigation_specimens',
      specimenId,
      req.justification,
      undefined,
      newSpecimen as unknown as Record<string, unknown>
    );

    return { ...order };
  }

  public async rejectSpecimen(req: RejectSpecimenRequest): Promise<InvestigationOrderDto> {
    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }
    const specimen = this.specimens.find((s) => s.id === req.specimenId);
    if (!specimen) {
      throw new Error(`Specimen ${req.specimenId} not found.`);
    }

    specimen.collectionStatus = 'REJECTED';
    specimen.rejectionStatus = true;
    specimen.rejectionReason = req.rejectionReason;
    specimen.rejectedAt = new Date().toISOString();
    specimen.rejectedBy = req.actorId;
    specimen.updatedAt = new Date().toISOString();

    // Order status reverts to SAMPLE_REQUIRED
    order.status = 'SAMPLE_REQUIRED'; saveStored("docsearch_investigation_orders", this.orders);
    order.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      'SPECIMEN_REJECTED',
      'investigation_specimens',
      specimen.id,
      req.justification,
      undefined,
      specimen as unknown as Record<string, unknown>
    );

    return { ...order };
  }

  public async enterResults(req: EnterInvestigationResultRequest): Promise<InvestigationOrderDto> {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/lab/orders/${req.orderId}/results`, {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const mapped = this.mapStoredOrderToDto(res.data);
        const idx = this.orders.findIndex((o) => o.id === req.orderId || o.id === mapped.id);
        if (idx >= 0) {
          this.orders[idx] = mapped;
        } else {
          this.orders.unshift(mapped);
        }
        saveStored("docsearch_investigation_orders", this.orders);
        return mapped;
      }
      if (!isMockFallbackAllowed() && res.error) {
        throw new Error(res.error.message || 'Failed to enter lab results on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Lab results entry network error');
      }
    }
    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }
    if (order.status === 'CANCELLED') {
      throw new Error('Cannot enter results for a cancelled order.');
    }

    let hasAbnormal = false;
    let hasCritical = false;

    const newResultItems: InvestigationResultDto[] = req.results.map((item) => {
      const isCrit = item.isCritical || item.abnormalFlag === 'CRITICAL_HIGH' || item.abnormalFlag === 'CRITICAL_LOW';
      const isAbn = isCrit || item.abnormalFlag === 'HIGH' || item.abnormalFlag === 'LOW' || item.abnormalFlag === 'ABNORMAL';
      if (isAbn) hasAbnormal = true;
      if (isCrit) hasCritical = true;

      const resId = this.generateId();
      const resDto: InvestigationResultDto = {
        id: resId,
        tenantId: req.tenantId,
        partnerId: order.partnerId,
        organizationId: order.organizationId,
        orderId: order.id,
        specimenId: req.specimenId,
        parameterCode: item.parameterCode,
        parameterName: item.parameterName,
        resultValue: item.resultValue,
        numericValue: item.numericValue,
        unit: item.unit,
        referenceRange: item.referenceRange,
        referenceMin: item.referenceMin,
        referenceMax: item.referenceMax,
        criticalMin: item.criticalMin,
        criticalMax: item.criticalMax,
        abnormalFlag: item.abnormalFlag,
        isCritical: isCrit,
        qualitativeInterpretation: item.qualitativeInterpretation,
        resultStatus: 'COMPLETED',
        enteredBy: req.actorId,
        enteredAt: new Date().toISOString(),
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.results.unshift(resDto);
      return resDto;
    });

    order.results = newResultItems;
    order.status = 'RESULT_READY';
    order.isAbnormal = hasAbnormal;
    order.isCritical = hasCritical;
    order.resultEnteredAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      hasCritical ? 'CRITICAL_RESULT_ENTERED' : 'RESULTS_ENTERED',
      'investigation_results',
      order.id,
      req.justification,
      undefined,
      { resultsCount: newResultItems.length, hasCritical, hasAbnormal }
    );

    return { ...order };
  }

  public async verifyResults(req: VerifyInvestigationResultRequest): Promise<InvestigationOrderDto> {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/lab/orders/${req.orderId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const mapped = this.mapStoredOrderToDto(res.data);
        const idx = this.orders.findIndex((o) => o.id === req.orderId || o.id === mapped.id);
        if (idx >= 0) {
          this.orders[idx] = mapped;
        } else {
          this.orders.unshift(mapped);
        }
        saveStored("docsearch_investigation_orders", this.orders);
        return mapped;
      }
      if (!isMockFallbackAllowed() && res.error) {
        throw new Error(res.error.message || 'Failed to verify lab results on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Lab verification network error');
      }
    }
    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }
    if (order.status === 'CANCELLED') {
      throw new Error('Cannot verify results for a cancelled order.');
    }

    order.results.forEach((r) => {
      r.resultStatus = 'VERIFIED';
      r.verifiedBy = req.verifyingPathologist;
      r.verifiedAt = new Date().toISOString();
      r.updatedAt = new Date().toISOString();
    });

    order.status = 'VERIFIED'; saveStored("docsearch_investigation_orders", this.orders);
    order.verifiedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Auto-create final/preliminary report if not already present
    if (!order.report) {
      const reportNumber = this.generateReportNumber();
      const reportId = this.generateId();
      const newReport: InvestigationReportDto = {
        id: reportId,
        tenantId: req.tenantId,
        partnerId: order.partnerId,
        organizationId: order.organizationId,
        orderId: order.id,
        patientId: order.patientId,
        reportNumber,
        reportTitle: `Diagnostic Report: ${order.investigationName}`,
        clinicalFindings: order.results.map((r) => `${r.parameterName}: ${r.resultValue} ${r.unit ?? ''} [${r.abnormalFlag}]`).join(' | '),
        impression: req.clinicalImpression ?? (order.isCritical ? 'CRITICAL ABNORMALITY CONFIRMED' : 'Diagnostic findings verified by pathologist.'),
        recommendations: req.recommendations,
        reportingClinician: req.actorId,
        verifyingPathologist: req.verifyingPathologist,
        reportStatus: 'FINAL',
        reportVersion: 1,
        finalizedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.reports.unshift(newReport);
      order.report = newReport;
      saveStored("docsearch_investigation_reports", this.reports);
      saveStored("docsearch_investigation_orders", this.orders);
    }

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      'RESULTS_VERIFIED',
      'investigation_orders',
      order.id,
      req.justification,
      undefined,
      { verifiedBy: req.verifyingPathologist, isCritical: order.isCritical }
    );

    return { ...order };
  }

  public async finalizeReport(req: FinalizeInvestigationReportRequest): Promise<InvestigationOrderDto> {
    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }

    const reportNumber = this.generateReportNumber();
    const reportId = this.generateId();
    const newReport: InvestigationReportDto = {
      id: reportId,
      tenantId: req.tenantId,
      partnerId: order.partnerId,
      organizationId: order.organizationId,
      orderId: order.id,
      patientId: order.patientId,
      reportNumber,
      reportTitle: req.reportTitle,
      clinicalFindings: req.clinicalFindings,
      impression: req.impression,
      recommendations: req.recommendations,
      reportingClinician: req.reportingClinician,
      verifyingPathologist: req.verifyingPathologist,
      reportStatus: 'FINAL',
      reportVersion: 1,
      finalizedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reports.unshift(newReport);
    order.report = newReport;
    order.status = 'VERIFIED';
    order.verifiedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    saveStored("docsearch_investigation_reports", this.reports);
    saveStored("docsearch_investigation_orders", this.orders);

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      'REPORT_FINALIZED',
      'investigation_reports',
      reportId,
      req.justification,
      undefined,
      newReport as unknown as Record<string, unknown>
    );

    return { ...order };
  }

  public async reviewResults(req: ReviewInvestigationResultRequest): Promise<InvestigationOrderDto> {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/lab/orders/${req.orderId}/review`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const mapped = this.mapStoredOrderToDto(res.data);
        const idx = this.orders.findIndex((o) => o.id === req.orderId || o.id === mapped.id);
        if (idx >= 0) {
          this.orders[idx] = mapped;
        } else {
          this.orders.unshift(mapped);
        }
        saveStored("docsearch_investigation_orders", this.orders);
        return mapped;
      }
    } catch {
      // Fallback
    }
    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }

    order.status = 'REVIEWED'; saveStored("docsearch_investigation_orders", this.orders);
    order.reviewedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    if (order.report) {
      order.report.reviewedByDoctorAt = new Date().toISOString();
      order.report.reviewingDoctor = req.reviewingDoctor;
      order.report.doctorReviewNotes = req.doctorReviewNotes;
      order.report.updatedAt = new Date().toISOString();
    }

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      'RESULTS_REVIEWED_BY_DOCTOR',
      'investigation_orders',
      order.id,
      req.justification,
      undefined,
      { reviewingDoctor: req.reviewingDoctor, notes: req.doctorReviewNotes }
    );

    return { ...order };
  }

  public async amendResult(req: AmendInvestigationResultRequest): Promise<InvestigationOrderDto> {
    const order = this.orders.find((o) => o.tenantId === req.tenantId && o.id === req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found.`);
    }
    const result = order.results.find((r) => r.id === req.resultId);
    if (!result) {
      throw new Error(`Result item ${req.resultId} not found in order ${req.orderId}.`);
    }

    const previousValue = result.resultValue;
    const previousFlag = result.abnormalFlag;

    const amendmentId = this.generateId();
    const newAmendment: InvestigationResultAmendmentDto = {
      id: amendmentId,
      tenantId: req.tenantId,
      partnerId: order.partnerId,
      organizationId: order.organizationId,
      orderId: order.id,
      resultId: result.id,
      reportId: order.report?.id,
      amendmentNumber: order.amendments.length + 1,
      previousValue,
      newValue: req.newValue,
      previousAbnormalFlag: previousFlag,
      newAbnormalFlag: req.newAbnormalFlag ?? previousFlag,
      reason: req.amendmentReason,
      amendedBy: req.actorId,
      amendedRole: req.actorRole,
      amendedAt: new Date().toISOString()
    };

    this.amendments.unshift(newAmendment);
    order.amendments = [newAmendment, ...order.amendments];

    // Apply mutation to result item
    result.resultValue = req.newValue;
    const parsedNum = parseFloat(req.newValue);
    if (!isNaN(parsedNum)) {
      result.numericValue = parsedNum;
    }
    if (req.newAbnormalFlag) {
      result.abnormalFlag = req.newAbnormalFlag;
      result.isCritical = req.newAbnormalFlag === 'CRITICAL_HIGH' || req.newAbnormalFlag === 'CRITICAL_LOW';
    }
    result.version += 1;
    result.resultStatus = 'AMENDED';
    result.updatedAt = new Date().toISOString();

    // Re-evaluate order critical & abnormal flags
    order.isAbnormal = order.results.some((r) => r.abnormalFlag !== 'NORMAL');
    order.isCritical = order.results.some((r) => r.isCritical);
    order.updatedAt = new Date().toISOString();

    this.recordAudit(
      req.tenantId,
      order.partnerId,
      order.organizationId,
      order.branchId,
      order.id,
      order.patientId,
      req.actorId,
      req.actorRole,
      'RESULT_AMENDED',
      'investigation_result_amendments',
      amendmentId,
      req.justification,
      { previousValue, previousFlag },
      { newValue: req.newValue, newFlag: req.newAbnormalFlag, reason: req.amendmentReason }
    );

    return { ...order };
  }

  public async getPatientInvestigationHistory(tenantId: string, patientId: string): Promise<InvestigationOrderDto[]> {
    const local = this.orders.filter((o) => (!tenantId || o.tenantId === tenantId) && o.patientId === patientId);
    try {
      const res = await apiRequest<any[]>(`/api/v1/partner/patients/${patientId}/lab-history`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((o) => this.mapStoredOrderToDto(o));
        const serverIds = new Set(mapped.map((d) => d.id));
        return [...mapped, ...local.filter((l) => !serverIds.has(l.id))];
      }
    } catch {
      // Fallback
    }
    return local;
  }

  public async getReports(tenantId?: string): Promise<InvestigationReportDto[]> {
    if (!tenantId) return [...this.reports];
    return this.reports.filter((r) => r.tenantId === tenantId);
  }

  public registerDirectWalkInOrder(order: InvestigationOrderDto): void {
    const existingIdx = this.orders.findIndex((o) => o.id === order.id);
    if (existingIdx >= 0) {
      this.orders[existingIdx] = order;
    } else {
      this.orders.unshift(order);
    }
    saveStored("docsearch_investigation_orders", this.orders);

    if (order.report) {
      const repIdx = this.reports.findIndex((r) => r.id === order.report!.id);
      if (repIdx >= 0) {
        this.reports[repIdx] = order.report;
      } else {
        this.reports.unshift(order.report);
      }
      saveStored("docsearch_investigation_reports", this.reports);
    }

    // Persist live to backend API Gateway for multi-user / permanent durability
    try {
      void apiRequest('/api/v1/partner/lab/orders', {
        method: 'POST',
        body: JSON.stringify({
          id: order.id,
          patientId: order.patientId,
          patientName: order.patientName,
          patientMrn: order.patientMrn,
          patientGender: order.patientGender,
          patientPhone: (order.metadata as any)?.patientPhone || '+91 98765 00000',
          testCode: order.investigationCode,
          testName: order.investigationName,
          category: order.investigationCategory,
          priority: order.priority,
          clinicalIndication: order.clinicalIndication,
          orderingDoctorName: order.orderingDoctorName,
          metadata: order.metadata
        })
      });
    } catch {
      // Async sync
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('docsearch_orders_updated'));
    }
  }

  public updateDirectWalkInOrder(order: InvestigationOrderDto): void {
    this.registerDirectWalkInOrder(order);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('docsearch_orders_updated'));
    }
  }

  public updateOrderBilling(orderId: string, billingData: {
    invoiceNumber: string;
    billedAmount: number;
    paidAmount: number;
    paymentMode: string;
    balanceDue?: number;
  }): InvestigationOrderDto | null {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) return null;

    const existing = this.orders[idx]!;
    const updated: InvestigationOrderDto = {
      ...existing,
      metadata: {
        ...(existing.metadata || {}),
        billingStatus: 'BILLED',
        invoiceNumber: billingData.invoiceNumber,
        billedAmount: billingData.billedAmount,
        paidAmount: billingData.paidAmount,
        paymentMode: billingData.paymentMode,
        balanceDue: billingData.balanceDue || 0,
        billedAt: new Date().toISOString()
      }
    };
    this.orders[idx] = updated;
    saveStored("docsearch_investigation_orders", this.orders);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('docsearch_orders_updated'));
    }
    return updated;
  }

  public clearAllMockAndTestData(): void {
    this.orders = [];
    this.specimens = [];
    this.results = [];
    this.reports = [];
    this.amendments = [];
    this.auditTraces = [];

    saveStored("docsearch_investigation_orders", []);
    saveStored("docsearch_investigation_specimens", []);
    saveStored("docsearch_investigation_results", []);
    saveStored("docsearch_investigation_reports", []);
    saveStored("docsearch_investigation_amendments", []);
    saveStored("docsearch_investigation_audit", []);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem("docsearch_referral_transactions");
      } catch {
        // Ignore quota
      }
    }

    pathologyRevenueService.clearAllInvoices();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('docsearch_orders_updated'));
      window.dispatchEvent(new Event('docsearch_billing_updated'));
    }
  }

  public async logPanicIntimation(orderId: string, payload: Partial<PanicIntimationRecord>): Promise<any> {
    const intimationRecord = {
      orderId,
      doctorName: payload.doctorName || 'Dr. Attending Physician',
      doctorPhone: payload.doctorPhone || '+91 98765 00000',
      callerStaffName: payload.callerStaffName || 'Duty Technologist',
      readBackConfirmed: Boolean(payload.readBackConfirmed !== false),
      criticalParameters: payload.criticalParameters || [],
      intimatedAt: new Date().toISOString(),
      notes: payload.notes || 'Verbal telephonic notification completed and read-back confirmed.'
    };

    let serverData: any = null;
    try {
      const res = await apiRequest<any>(`/api/v1/partner/lab/orders/${orderId}/panic-intimation`, {
        method: 'POST',
        body: JSON.stringify(intimationRecord)
      });
      if (res.success && res.data) {
        serverData = res.data;
      }
    } catch (err) {
      console.warn('[Lab Diagnostics] Backend panic intimation sync notice (offline/mock active):', err);
    }

    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.metadata = {
        ...(order.metadata || {}),
        panicIntimation: intimationRecord,
        isPanicIntimated: true,
        isCritical: true
      };
      saveStored("docsearch_investigation_orders", this.orders);
    }

    return serverData || { orderId, panicIntimation: intimationRecord };
  }

  public async getAuditTraces(params: QueryInvestigationAuditRequest): Promise<InvestigationAuditTraceDto[]> {
    return this.auditTraces.filter((trace) => {
      if (trace.tenantId !== params.tenantId) return false;
      if (params.orderId && trace.orderId !== params.orderId) return false;
      if (params.patientId && trace.patientId !== params.patientId) return false;
      if (params.actorId && trace.actorId !== params.actorId) return false;
      if (params.action && trace.action !== params.action) return false;
      return true;
    });
  }
}

export const clinicalInvestigationService = new ClinicalInvestigationService();
