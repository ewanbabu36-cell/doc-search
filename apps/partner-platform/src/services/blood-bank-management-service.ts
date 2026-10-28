import { apiRequest } from './api-client.js';
import type {
  BloodBankFacilityDto,
  BloodDonorDto,
  BloodDonorScreeningDto,
  BloodDonationDto,
  BloodTestRecordDto,
  BloodComponentDto,
  BloodRequestDto,
  BloodCrossmatchDto,
  BloodIssueDto,
  TransfusionRecordDto,
  TransfusionReactionDto,
  BloodQualityCheckDto,
  BloodStorageTemperatureLogDto,
  BloodDiscardRecordDto,
  BloodBankAuditTraceDto,
  BloodBankOverviewMetricsDto,
  BloodBankAnalyticsDto,
  CreateDonorRequest,
  ScreenDonorRequest,
  CreateDonationRequest,
  RecordBloodTestRequest,
  ReleaseBloodUnitRequest,
  CreateComponentRequest,
  CreateBloodRequestRequest,
  CreateCrossmatchRequest,
  ReserveBloodUnitRequest,
  IssueBloodUnitRequest,
  RecordTransfusionRequest,
  RecordTransfusionObservationRequest,
  ReportTransfusionReactionRequest,
  ReturnBloodUnitRequest,
  DiscardBloodUnitRequest,
  CreateQualityCheckRequest,
  RecordTemperatureRequest,
  ResolveStorageExcursionRequest
} from '@docsearch/api-contracts';

export interface IBloodBankManagementService {
  getOverviewMetrics(tenantId: string): Promise<BloodBankOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<BloodBankAnalyticsDto>;
  getFacility(tenantId: string): Promise<BloodBankFacilityDto>;
  getDonors(tenantId: string): Promise<BloodDonorDto[]>;
  getScreenings(tenantId: string): Promise<BloodDonorScreeningDto[]>;
  getDonations(tenantId: string): Promise<BloodDonationDto[]>;
  getTests(tenantId: string): Promise<BloodTestRecordDto[]>;
  getComponents(tenantId: string): Promise<BloodComponentDto[]>;
  getRequests(tenantId: string): Promise<BloodRequestDto[]>;
  getCrossmatches(tenantId: string): Promise<BloodCrossmatchDto[]>;
  getIssues(tenantId: string): Promise<BloodIssueDto[]>;
  getTransfusions(tenantId: string): Promise<TransfusionRecordDto[]>;
  getReactions(tenantId: string): Promise<TransfusionReactionDto[]>;
  getQualityChecks(tenantId: string): Promise<BloodQualityCheckDto[]>;
  getTemperatureLogs(tenantId: string): Promise<BloodStorageTemperatureLogDto[]>;
  getDiscards(tenantId: string): Promise<BloodDiscardRecordDto[]>;
  getAuditTraces(tenantId: string): Promise<BloodBankAuditTraceDto[]>;

  createDonor(req: CreateDonorRequest): Promise<BloodDonorDto>;
  screenDonor(req: ScreenDonorRequest): Promise<BloodDonorScreeningDto>;
  createDonation(req: CreateDonationRequest): Promise<BloodDonationDto>;
  recordBloodTest(req: RecordBloodTestRequest): Promise<BloodTestRecordDto>;
  releaseBloodUnit(req: ReleaseBloodUnitRequest): Promise<BloodComponentDto>;
  createComponent(req: CreateComponentRequest): Promise<BloodComponentDto>;
  createBloodRequest(req: CreateBloodRequestRequest): Promise<BloodRequestDto>;
  createCrossmatch(req: CreateCrossmatchRequest): Promise<BloodCrossmatchDto>;
  reserveBloodUnit(req: ReserveBloodUnitRequest): Promise<BloodRequestDto>;
  issueBloodUnit(req: IssueBloodUnitRequest): Promise<BloodIssueDto>;
  recordTransfusion(req: RecordTransfusionRequest): Promise<TransfusionRecordDto>;
  recordTransfusionObservation(req: RecordTransfusionObservationRequest): Promise<TransfusionRecordDto>;
  reportTransfusionReaction(req: ReportTransfusionReactionRequest): Promise<TransfusionReactionDto>;
  returnBloodUnit(req: ReturnBloodUnitRequest): Promise<void>;
  discardBloodUnit(req: DiscardBloodUnitRequest): Promise<BloodDiscardRecordDto>;
  createQualityCheck(req: CreateQualityCheckRequest): Promise<BloodQualityCheckDto>;
  recordTemperature(req: RecordTemperatureRequest): Promise<BloodStorageTemperatureLogDto>;
  resolveStorageExcursion(req: ResolveStorageExcursionRequest): Promise<void>;
}

export class BloodBankManagementService implements IBloodBankManagementService {
  public async getOverviewMetrics(tenantId: string): Promise<BloodBankOverviewMetricsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const components = await this.getComponents(tenantId).catch(() => []);
    const available = components.filter(c => c.status === 'RELEASED_USABLE');
    const prbc = available.filter(c => c.componentType === 'PACKED_RED_BLOOD_CELLS_PRBC').length;
    const platelet = available.filter(c => c.componentType === 'RANDOM_DONOR_PLATELETS_RDP' || c.componentType === 'SINGLE_DONOR_PLATELETS_SDP').length;
    const ffp = available.filter(c => c.componentType === 'FRESH_FROZEN_PLASMA_FFP').length;

    return {
      totalAvailableUnits: available.length,
      quarantineUnitsCount: components.filter(c => c.status === 'QUARANTINED' || c.status === 'TESTING_IN_PROGRESS').length,
      prbcStockCount: prbc,
      plateletStockCount: platelet,
      ffpStockCount: ffp,
      pendingRequestsCount: 1,
      activeCrossmatchesCount: 1,
      todaysTransfusionsCount: 2,
      reactionCasesUnderReview: 0,
      criticalLowBloodGroups: prbc < 5 ? ['O_NEGATIVE'] : []
    };
  }

  public async getAnalytics(_tenantId: string): Promise<BloodBankAnalyticsDto> {
    return {
      inventoryByBloodGroup: [],
      transfusionsByDepartment: [],
      monthlyDonationTrends: [],
      wastageReasons: []
    };
  }

  public async getFacility(_tenantId: string): Promise<BloodBankFacilityDto> {
    return {
      id: 'bb-facility-01',
      tenantId: 'default',
      partnerId: 'default',
      organizationId: 'default',
      branchId: 'default',
      facilityCode: 'BB-CENTRAL',
      facilityName: 'Central Blood Transfusion Centre',
      licenseNumber: 'LIC/BB/2026/0991',
      medicalDirectorName: 'Dr. Blood Director',
      headTechnologistName: 'Sr. Blood Technologist',
      storageLocationName: 'Refrigerated Storage Room 1',
      totalAvailableUnits: 25,
      quarantineUnits: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  public async getDonors(tenantId: string): Promise<BloodDonorDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BloodDonorDto[]>('/api/v1/partner/blood-bank/donors');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getScreenings(_tenantId: string): Promise<BloodDonorScreeningDto[]> {
    const res = await apiRequest<BloodDonorScreeningDto[]>('/api/v1/partner/blood-bank/screenings');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getDonations(_tenantId: string): Promise<BloodDonationDto[]> {
    const res = await apiRequest<BloodDonationDto[]>('/api/v1/partner/blood-bank/donations');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getTests(_tenantId: string): Promise<BloodTestRecordDto[]> {
    const res = await apiRequest<BloodTestRecordDto[]>('/api/v1/partner/blood-bank/tests');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getComponents(tenantId: string): Promise<BloodComponentDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BloodComponentDto[]>('/api/v1/partner/blood-bank/components');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getRequests(tenantId: string): Promise<BloodRequestDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BloodRequestDto[]>('/api/v1/partner/blood-bank/requests');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getCrossmatches(_tenantId: string): Promise<BloodCrossmatchDto[]> {
    const res = await apiRequest<BloodCrossmatchDto[]>('/api/v1/partner/blood-bank/crossmatches');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getIssues(_tenantId: string): Promise<BloodIssueDto[]> {
    const res = await apiRequest<BloodIssueDto[]>('/api/v1/partner/blood-bank/issues');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getTransfusions(_tenantId: string): Promise<TransfusionRecordDto[]> {
    const res = await apiRequest<TransfusionRecordDto[]>('/api/v1/partner/blood-bank/transfusions');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getReactions(_tenantId: string): Promise<TransfusionReactionDto[]> {
    const res = await apiRequest<TransfusionReactionDto[]>('/api/v1/partner/blood-bank/reactions');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getQualityChecks(_tenantId: string): Promise<BloodQualityCheckDto[]> {
    const res = await apiRequest<BloodQualityCheckDto[]>('/api/v1/partner/blood-bank/quality-checks');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getTemperatureLogs(_tenantId: string): Promise<BloodStorageTemperatureLogDto[]> {
    const res = await apiRequest<BloodStorageTemperatureLogDto[]>('/api/v1/partner/blood-bank/temperature-logs');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getDiscards(_tenantId: string): Promise<BloodDiscardRecordDto[]> {
    const res = await apiRequest<BloodDiscardRecordDto[]>('/api/v1/partner/blood-bank/discards');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async getAuditTraces(_tenantId: string): Promise<BloodBankAuditTraceDto[]> {
    const res = await apiRequest<BloodBankAuditTraceDto[]>('/api/v1/partner/blood-bank/audit-traces');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createDonor(req: CreateDonorRequest): Promise<BloodDonorDto> {
    const res = await apiRequest<BloodDonorDto>('/api/v1/partner/blood-bank/donors', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodDonorDto;
  }

  public async screenDonor(req: ScreenDonorRequest): Promise<BloodDonorScreeningDto> {
    const res = await apiRequest<BloodDonorScreeningDto>('/api/v1/partner/blood-bank/screenings', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodDonorScreeningDto;
  }

  public async createDonation(req: CreateDonationRequest): Promise<BloodDonationDto> {
    const res = await apiRequest<BloodDonationDto>('/api/v1/partner/blood-bank/donations', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodDonationDto;
  }

  public async recordBloodTest(req: RecordBloodTestRequest): Promise<BloodTestRecordDto> {
    const res = await apiRequest<BloodTestRecordDto>('/api/v1/partner/blood-bank/tests', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodTestRecordDto;
  }

  public async releaseBloodUnit(req: ReleaseBloodUnitRequest): Promise<BloodComponentDto> {
    const res = await apiRequest<BloodComponentDto>(`/api/v1/partner/blood-bank/units/${req.unitId}/release`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodComponentDto;
  }

  public async createComponent(req: CreateComponentRequest): Promise<BloodComponentDto> {
    const res = await apiRequest<BloodComponentDto>('/api/v1/partner/blood-bank/components', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodComponentDto;
  }

  public async createBloodRequest(req: CreateBloodRequestRequest): Promise<BloodRequestDto> {
    const res = await apiRequest<BloodRequestDto>('/api/v1/partner/blood-bank/requests', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodRequestDto;
  }

  public async createCrossmatch(req: CreateCrossmatchRequest): Promise<BloodCrossmatchDto> {
    const res = await apiRequest<BloodCrossmatchDto>('/api/v1/partner/blood-bank/crossmatches', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodCrossmatchDto;
  }

  public async reserveBloodUnit(req: ReserveBloodUnitRequest): Promise<BloodRequestDto> {
    const res = await apiRequest<BloodRequestDto>(`/api/v1/partner/blood-bank/requests/${req.requestId}/reserve`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodRequestDto;
  }

  public async issueBloodUnit(req: IssueBloodUnitRequest): Promise<BloodIssueDto> {
    const res = await apiRequest<BloodIssueDto>('/api/v1/partner/blood-bank/issues', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodIssueDto;
  }

  public async recordTransfusion(req: RecordTransfusionRequest): Promise<TransfusionRecordDto> {
    const res = await apiRequest<TransfusionRecordDto>('/api/v1/partner/blood-bank/transfusions', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as TransfusionRecordDto;
  }

  public async recordTransfusionObservation(req: RecordTransfusionObservationRequest): Promise<TransfusionRecordDto> {
    const res = await apiRequest<TransfusionRecordDto>(`/api/v1/partner/blood-bank/transfusions/${req.transfusionId}/observations`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as TransfusionRecordDto;
  }

  public async reportTransfusionReaction(req: ReportTransfusionReactionRequest): Promise<TransfusionReactionDto> {
    const res = await apiRequest<TransfusionReactionDto>('/api/v1/partner/blood-bank/reactions', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as TransfusionReactionDto;
  }

  public async returnBloodUnit(req: ReturnBloodUnitRequest): Promise<void> {
    await apiRequest<void>('/api/v1/partner/blood-bank/returns', {
      method: 'POST',
      body: JSON.stringify(req)
    });
  }

  public async discardBloodUnit(req: DiscardBloodUnitRequest): Promise<BloodDiscardRecordDto> {
    const res = await apiRequest<BloodDiscardRecordDto>('/api/v1/partner/blood-bank/discards', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodDiscardRecordDto;
  }

  public async createQualityCheck(req: CreateQualityCheckRequest): Promise<BloodQualityCheckDto> {
    const res = await apiRequest<BloodQualityCheckDto>('/api/v1/partner/blood-bank/quality-checks', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodQualityCheckDto;
  }

  public async recordTemperature(req: RecordTemperatureRequest): Promise<BloodStorageTemperatureLogDto> {
    const res = await apiRequest<BloodStorageTemperatureLogDto>('/api/v1/partner/blood-bank/temperature-logs', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as BloodStorageTemperatureLogDto;
  }

  public async resolveStorageExcursion(req: ResolveStorageExcursionRequest): Promise<void> {
    await apiRequest<void>('/api/v1/partner/blood-bank/storage-excursions/resolve', {
      method: 'POST',
      body: JSON.stringify(req)
    });
  }
}

export const bloodBankManagementService = new BloodBankManagementService();
