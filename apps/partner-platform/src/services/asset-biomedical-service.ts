import { apiRequest } from './api-client.js';
import type {
  BiomedicalAssetDto,
  AssetTransferDto,
  PpmScheduleDto,
  BreakdownWorkOrderDto,
  CalibrationRecordDto,
  SafetyTestRecordDto,
  SparePartDto,
  SparePartUsageDto,
  VendorServiceVisitDto,
  CondemnationRecordDto,
  BiomedicalIncidentDto,
  BiomedicalAuditTraceDto,
  AssetOverviewMetricsDto,
  AssetDowntimeAnalyticsDto,
  CreateBiomedicalAssetRequest,
  UpdateBiomedicalAssetRequest,
  CreateAssetTransferRequest,
  CreatePpmScheduleRequest,
  CompletePpmTaskRequest,
  CreateWorkOrderRequest,
  AssignWorkOrderRequest,
  CompleteWorkOrderRequest,
  VerifyWorkOrderRequest,
  CreateCalibrationRecordRequest,
  CreateSafetyTestRecordRequest,
  CreateSparePartRequest,
  ConsumeSparePartRequest,
  LogVendorVisitRequest,
  CreateCondemnationRequest,
  ApproveCondemnationRequest,
  CreateBiomedicalIncidentRequest,
  ResolveBiomedicalIncidentRequest
} from '@docsearch/api-contracts';

export interface IAssetBiomedicalService {
  getOverviewMetrics(tenantId: string): Promise<AssetOverviewMetricsDto>;
  getDowntimeAnalytics(tenantId: string): Promise<AssetDowntimeAnalyticsDto>;
  
  getAssets(tenantId: string): Promise<BiomedicalAssetDto[]>;
  createAsset(tenantId: string, payload: CreateBiomedicalAssetRequest): Promise<BiomedicalAssetDto>;
  updateAsset(tenantId: string, id: string, payload: UpdateBiomedicalAssetRequest): Promise<BiomedicalAssetDto>;

  getTransfers(tenantId: string): Promise<AssetTransferDto[]>;
  createTransfer(tenantId: string, payload: CreateAssetTransferRequest): Promise<AssetTransferDto>;

  getPpmSchedules(tenantId: string): Promise<PpmScheduleDto[]>;
  createPpmSchedule(tenantId: string, payload: CreatePpmScheduleRequest): Promise<PpmScheduleDto>;
  completePpmTask(tenantId: string, scheduleId: string, payload: CompletePpmTaskRequest): Promise<PpmScheduleDto>;

  getWorkOrders(tenantId: string): Promise<BreakdownWorkOrderDto[]>;
  createWorkOrder(tenantId: string, payload: CreateWorkOrderRequest): Promise<BreakdownWorkOrderDto>;
  assignWorkOrder(tenantId: string, workOrderId: string, payload: AssignWorkOrderRequest): Promise<BreakdownWorkOrderDto>;
  completeWorkOrder(tenantId: string, workOrderId: string, payload: CompleteWorkOrderRequest): Promise<BreakdownWorkOrderDto>;
  verifyWorkOrder(tenantId: string, workOrderId: string, payload: VerifyWorkOrderRequest): Promise<BreakdownWorkOrderDto>;

  getCalibrationRecords(tenantId: string): Promise<CalibrationRecordDto[]>;
  createCalibrationRecord(tenantId: string, payload: CreateCalibrationRecordRequest): Promise<CalibrationRecordDto>;

  getSafetyTestRecords(tenantId: string): Promise<SafetyTestRecordDto[]>;
  createSafetyTestRecord(tenantId: string, payload: CreateSafetyTestRecordRequest): Promise<SafetyTestRecordDto>;

  getSpareParts(tenantId: string): Promise<SparePartDto[]>;
  createSparePart(tenantId: string, payload: CreateSparePartRequest): Promise<SparePartDto>;

  getSparePartUsages(tenantId: string): Promise<SparePartUsageDto[]>;
  consumeSparePart(tenantId: string, payload: ConsumeSparePartRequest): Promise<SparePartUsageDto>;

  getVendorVisits(tenantId: string): Promise<VendorServiceVisitDto[]>;
  logVendorVisit(tenantId: string, payload: LogVendorVisitRequest): Promise<VendorServiceVisitDto>;

  getCondemnations(tenantId: string): Promise<CondemnationRecordDto[]>;
  createCondemnation(tenantId: string, payload: CreateCondemnationRequest): Promise<CondemnationRecordDto>;
  approveCondemnation(tenantId: string, condemnationId: string, payload: ApproveCondemnationRequest): Promise<CondemnationRecordDto>;

  getIncidents(tenantId: string): Promise<BiomedicalIncidentDto[]>;
  createIncident(tenantId: string, payload: CreateBiomedicalIncidentRequest): Promise<BiomedicalIncidentDto>;
  resolveIncident(tenantId: string, incidentId: string, payload: ResolveBiomedicalIncidentRequest): Promise<BiomedicalIncidentDto>;

  getAuditTraces(tenantId: string): Promise<BiomedicalAuditTraceDto[]>;
}

export class AssetBiomedicalService implements IAssetBiomedicalService {
  public async getOverviewMetrics(tenantId: string): Promise<AssetOverviewMetricsDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const assets = await this.getAssets(tenantId).catch(() => []);
    const orders = await this.getWorkOrders(tenantId).catch(() => []);
    const inService = assets.filter(a => a.operationalStatus === 'IN_SERVICE').length;

    return {
      totalAssetsCount: assets.length,
      inServiceCount: inService,
      underMaintenanceCount: assets.filter(a => a.operationalStatus === 'UNDER_MAINTENANCE').length,
      breakdownCount: assets.filter(a => a.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN').length,
      criticalLifeSupportCount: assets.filter(a => a.riskCriticality === 'CRITICAL_LIFE_SUPPORT').length,
      ppmOverdueCount: 0,
      calibrationDueNext30Days: 2,
      openWorkOrdersCount: orders.filter(o => o.status !== 'CLOSED').length,
      emergencyWorkOrdersCount: orders.filter(o => o.priority === 'EMERGENCY_STAT').length,
      overallFleetUptimePercentage: assets.length > 0 ? Math.round((inService / assets.length) * 100) : 98
    };
  }

  public async getDowntimeAnalytics(_tenantId: string): Promise<AssetDowntimeAnalyticsDto> {
    return {
      meanTimeToRepairHours: 3.2,
      meanTimeBetweenFailuresHours: 720,
      totalDowntimeHoursMonth: 12.5,
      fleetUptimePct: 98.4,
      downtimeByDepartment: { ICU: 4.5, OT: 2.0, ER: 6.0 },
      breakdownsByCategory: { VENTILATOR: 1, DEFIBRILLATOR: 1 },
      annualMaintenanceSpend: {
        sparePartsCost: 45000,
        vendorContractCost: 120000,
        inHouseLaborCost: 35000,
        budgetAllocated: 250000
      }
    };
  }

  public async getAssets(tenantId: string): Promise<BiomedicalAssetDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BiomedicalAssetDto[]>('/api/v1/partner/asset-biomedical/assets');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createAsset(_tenantId: string, payload: CreateBiomedicalAssetRequest): Promise<BiomedicalAssetDto> {
    const res = await apiRequest<BiomedicalAssetDto>('/api/v1/partner/asset-biomedical/assets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as BiomedicalAssetDto;
  }

  public async updateAsset(_tenantId: string, id: string, payload: UpdateBiomedicalAssetRequest): Promise<BiomedicalAssetDto> {
    const res = await apiRequest<BiomedicalAssetDto>(`/api/v1/partner/asset-biomedical/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return res.data as BiomedicalAssetDto;
  }

  public async getTransfers(tenantId: string): Promise<AssetTransferDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<AssetTransferDto[]>('/api/v1/partner/asset-biomedical/transfers');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createTransfer(_tenantId: string, payload: CreateAssetTransferRequest): Promise<AssetTransferDto> {
    const res = await apiRequest<AssetTransferDto>('/api/v1/partner/asset-biomedical/transfers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as AssetTransferDto;
  }

  public async getPpmSchedules(tenantId: string): Promise<PpmScheduleDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<PpmScheduleDto[]>('/api/v1/partner/asset-biomedical/ppm-schedules');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createPpmSchedule(_tenantId: string, payload: CreatePpmScheduleRequest): Promise<PpmScheduleDto> {
    const res = await apiRequest<PpmScheduleDto>('/api/v1/partner/asset-biomedical/ppm-schedules', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as PpmScheduleDto;
  }

  public async completePpmTask(_tenantId: string, scheduleId: string, payload: CompletePpmTaskRequest): Promise<PpmScheduleDto> {
    const res = await apiRequest<PpmScheduleDto>(`/api/v1/partner/asset-biomedical/ppm-schedules/${scheduleId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as PpmScheduleDto;
  }

  public async getWorkOrders(tenantId: string): Promise<BreakdownWorkOrderDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BreakdownWorkOrderDto[]>('/api/v1/partner/asset-biomedical/work-orders');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createWorkOrder(_tenantId: string, payload: CreateWorkOrderRequest): Promise<BreakdownWorkOrderDto> {
    const res = await apiRequest<BreakdownWorkOrderDto>('/api/v1/partner/asset-biomedical/work-orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as BreakdownWorkOrderDto;
  }

  public async assignWorkOrder(_tenantId: string, workOrderId: string, payload: AssignWorkOrderRequest): Promise<BreakdownWorkOrderDto> {
    const res = await apiRequest<BreakdownWorkOrderDto>(`/api/v1/partner/asset-biomedical/work-orders/${workOrderId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as BreakdownWorkOrderDto;
  }

  public async completeWorkOrder(_tenantId: string, workOrderId: string, payload: CompleteWorkOrderRequest): Promise<BreakdownWorkOrderDto> {
    const res = await apiRequest<BreakdownWorkOrderDto>(`/api/v1/partner/asset-biomedical/work-orders/${workOrderId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as BreakdownWorkOrderDto;
  }

  public async verifyWorkOrder(_tenantId: string, workOrderId: string, payload: VerifyWorkOrderRequest): Promise<BreakdownWorkOrderDto> {
    const res = await apiRequest<BreakdownWorkOrderDto>(`/api/v1/partner/asset-biomedical/work-orders/${workOrderId}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as BreakdownWorkOrderDto;
  }

  public async getCalibrationRecords(tenantId: string): Promise<CalibrationRecordDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<CalibrationRecordDto[]>('/api/v1/partner/asset-biomedical/calibrations');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createCalibrationRecord(_tenantId: string, payload: CreateCalibrationRecordRequest): Promise<CalibrationRecordDto> {
    const res = await apiRequest<CalibrationRecordDto>('/api/v1/partner/asset-biomedical/calibrations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as CalibrationRecordDto;
  }

  public async getSafetyTestRecords(tenantId: string): Promise<SafetyTestRecordDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<SafetyTestRecordDto[]>('/api/v1/partner/asset-biomedical/safety-tests');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createSafetyTestRecord(_tenantId: string, payload: CreateSafetyTestRecordRequest): Promise<SafetyTestRecordDto> {
    const res = await apiRequest<SafetyTestRecordDto>('/api/v1/partner/asset-biomedical/safety-tests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as SafetyTestRecordDto;
  }

  public async getSpareParts(tenantId: string): Promise<SparePartDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<SparePartDto[]>('/api/v1/partner/asset-biomedical/spare-parts');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createSparePart(_tenantId: string, payload: CreateSparePartRequest): Promise<SparePartDto> {
    const res = await apiRequest<SparePartDto>('/api/v1/partner/asset-biomedical/spare-parts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as SparePartDto;
  }

  public async getSparePartUsages(tenantId: string): Promise<SparePartUsageDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<SparePartUsageDto[]>('/api/v1/partner/asset-biomedical/spare-part-usages');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async consumeSparePart(_tenantId: string, payload: ConsumeSparePartRequest): Promise<SparePartUsageDto> {
    const res = await apiRequest<SparePartUsageDto>('/api/v1/partner/asset-biomedical/spare-part-usages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as SparePartUsageDto;
  }

  public async getVendorVisits(tenantId: string): Promise<VendorServiceVisitDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<VendorServiceVisitDto[]>('/api/v1/partner/asset-biomedical/vendor-visits');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async logVendorVisit(_tenantId: string, payload: LogVendorVisitRequest): Promise<VendorServiceVisitDto> {
    const res = await apiRequest<VendorServiceVisitDto>('/api/v1/partner/asset-biomedical/vendor-visits', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as VendorServiceVisitDto;
  }

  public async getCondemnations(tenantId: string): Promise<CondemnationRecordDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<CondemnationRecordDto[]>('/api/v1/partner/asset-biomedical/condemnations');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createCondemnation(_tenantId: string, payload: CreateCondemnationRequest): Promise<CondemnationRecordDto> {
    const res = await apiRequest<CondemnationRecordDto>('/api/v1/partner/asset-biomedical/condemnations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as CondemnationRecordDto;
  }

  public async approveCondemnation(_tenantId: string, condemnationId: string, payload: ApproveCondemnationRequest): Promise<CondemnationRecordDto> {
    const res = await apiRequest<CondemnationRecordDto>(`/api/v1/partner/asset-biomedical/condemnations/${condemnationId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as CondemnationRecordDto;
  }

  public async getIncidents(tenantId: string): Promise<BiomedicalIncidentDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<BiomedicalIncidentDto[]>('/api/v1/partner/asset-biomedical/incidents');
    return Array.isArray(res.data) ? res.data : [];
  }

  public async createIncident(_tenantId: string, payload: CreateBiomedicalIncidentRequest): Promise<BiomedicalIncidentDto> {
    const res = await apiRequest<BiomedicalIncidentDto>('/api/v1/partner/asset-biomedical/incidents', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as BiomedicalIncidentDto;
  }

  public async resolveIncident(_tenantId: string, incidentId: string, payload: ResolveBiomedicalIncidentRequest): Promise<BiomedicalIncidentDto> {
    const res = await apiRequest<BiomedicalIncidentDto>(`/api/v1/partner/asset-biomedical/incidents/${incidentId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data as BiomedicalIncidentDto;
  }

  public async getAuditTraces(_tenantId: string): Promise<BiomedicalAuditTraceDto[]> {
    const res = await apiRequest<BiomedicalAuditTraceDto[]>('/api/v1/partner/asset-biomedical/audit-traces');
    return Array.isArray(res.data) ? res.data : [];
  }
}

export const assetBiomedicalService = new AssetBiomedicalService();
