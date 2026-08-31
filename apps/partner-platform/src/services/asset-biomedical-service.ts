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

import {
  mockBiomedicalAssets,
  mockAssetTransfers,
  mockPpmSchedules,
  mockBreakdownWorkOrders,
  mockCalibrationRecords,
  mockSafetyTestRecords,
  mockSpareParts,
  mockSparePartUsages,
  mockVendorVisits,
  mockCondemnations,
  mockBiomedicalIncidents,
  mockBiomedicalAuditTraces,
  mockBiomedicalOverviewMetrics,
  mockDowntimeAnalytics
} from './mock-asset-biomedical-data.js';

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
  private assets: BiomedicalAssetDto[] = [...mockBiomedicalAssets];
  private transfers: AssetTransferDto[] = [...mockAssetTransfers];
  private ppmSchedules: PpmScheduleDto[] = [...mockPpmSchedules];
  private workOrders: BreakdownWorkOrderDto[] = [...mockBreakdownWorkOrders];
  private calibrationRecords: CalibrationRecordDto[] = [...mockCalibrationRecords];
  private safetyTestRecords: SafetyTestRecordDto[] = [...mockSafetyTestRecords];
  private spareParts: SparePartDto[] = [...mockSpareParts];
  private sparePartUsages: SparePartUsageDto[] = [...mockSparePartUsages];
  private vendorVisits: VendorServiceVisitDto[] = [...mockVendorVisits];
  private condemnations: CondemnationRecordDto[] = [...mockCondemnations];
  private incidents: BiomedicalIncidentDto[] = [...mockBiomedicalIncidents];
  private auditTraces: BiomedicalAuditTraceDto[] = [...mockBiomedicalAuditTraces];

  private appendAudit(
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    actorName = 'Er. Rajesh Nair',
    actorRole = 'BIOMEDICAL_ENGINEER'
  ) {
    const traceNumber = `TRACE-ASSET-${Math.floor(10000 + Math.random() * 90000)}`;
    const trace: BiomedicalAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId: '11111111-1111-4111-8111-111111111111',
      traceNumber,
      action,
      entityType,
      entityId,
      entityCode,
      actorName,
      actorRole,
      justification,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(_tenantId: string): Promise<AssetOverviewMetricsDto> {
    const inService = this.assets.filter((a) => a.operationalStatus === 'IN_SERVICE').length;
    const underMaint = this.assets.filter((a) => a.operationalStatus === 'UNDER_MAINTENANCE').length;
    const breakdown = this.assets.filter((a) => a.operationalStatus === 'OUT_OF_SERVICE_BREAKDOWN').length;
    const critical = this.assets.filter((a) => a.riskCriticality === 'CRITICAL_LIFE_SUPPORT').length;
    const ppmOverdue = this.ppmSchedules.filter((p) => p.status === 'OVERDUE').length;
    const openWOs = this.workOrders.filter((w) => w.status !== 'CLOSED').length;
    const emWOs = this.workOrders.filter((w) => w.priority === 'EMERGENCY_STAT' && w.status !== 'CLOSED').length;

    return {
      ...mockBiomedicalOverviewMetrics,
      totalAssetsCount: this.assets.length,
      inServiceCount: inService,
      underMaintenanceCount: underMaint,
      breakdownCount: breakdown,
      criticalLifeSupportCount: critical,
      ppmOverdueCount: ppmOverdue,
      openWorkOrdersCount: openWOs,
      emergencyWorkOrdersCount: emWOs
    };
  }

  async getDowntimeAnalytics(_tenantId: string): Promise<AssetDowntimeAnalyticsDto> {
    return { ...mockDowntimeAnalytics };
  }

  async getAssets(_tenantId: string): Promise<BiomedicalAssetDto[]> {
    return [...this.assets];
  }

  async createAsset(tenantId: string, payload: CreateBiomedicalAssetRequest): Promise<BiomedicalAssetDto> {
    const asset: BiomedicalAssetDto = {
      id: crypto.randomUUID(),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      assetCode: payload.assetCode,
      assetName: payload.assetName,
      modelNumber: payload.modelNumber,
      serialNumber: payload.serialNumber,
      manufacturer: payload.manufacturer,
      category: payload.category,
      riskCriticality: payload.riskCriticality,
      operationalStatus: 'IN_SERVICE',
      departmentName: payload.departmentName,
      physicalLocation: payload.physicalLocation,
      installationDate: payload.installationDate,
      purchaseDate: payload.purchaseDate,
      purchaseCost: payload.purchaseCost,
      currentValue: payload.purchaseCost,
      warrantyExpiryDate: payload.warrantyExpiryDate,
      contractType: payload.contractType,
      contractVendorName: payload.contractVendorName,
      ppmFrequency: payload.ppmFrequency,
      nextPpmDueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0] || '2026-11-30',
      calibrationFrequencyMonths: payload.calibrationFrequencyMonths,
      nextCalibrationDueDate: new Date(Date.now() + payload.calibrationFrequencyMonths * 30 * 86400000).toISOString().split('T')[0] || '2027-08-30',
      calibrationStatus: 'CALIBRATED_PASS',
      electricalSafetyCertified: true,
      qrCodeIdentifier: `QR-BME-${payload.assetCode}`,
      responsibleBiomedicalEngineer: payload.responsibleBiomedicalEngineer,
      uptimePercentage: 100.0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.assets.unshift(asset);
    this.appendAudit('REGISTER_ASSET', 'BIOMEDICAL_ASSET', asset.id, asset.assetCode, 'New hospital equipment commissioned and tagged');
    return asset;
  }

  async updateAsset(_tenantId: string, id: string, payload: UpdateBiomedicalAssetRequest): Promise<BiomedicalAssetDto> {
    const idx = this.assets.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Asset not found');
    const existing = this.assets[idx];
    if (!existing) throw new Error('Asset not found');

    const updated: BiomedicalAssetDto = {
      id: existing.id,
      tenantId: existing.tenantId,
      partnerId: existing.partnerId,
      organizationId: existing.organizationId,
      branchId: existing.branchId,
      assetCode: existing.assetCode,
      assetName: payload.assetName ?? existing.assetName,
      modelNumber: existing.modelNumber,
      serialNumber: existing.serialNumber,
      manufacturer: existing.manufacturer,
      category: existing.category,
      riskCriticality: existing.riskCriticality,
      operationalStatus: payload.operationalStatus ?? existing.operationalStatus,
      departmentName: payload.departmentName ?? existing.departmentName,
      physicalLocation: payload.physicalLocation ?? existing.physicalLocation,
      installationDate: existing.installationDate,
      purchaseDate: existing.purchaseDate,
      purchaseCost: existing.purchaseCost,
      currentValue: existing.currentValue,
      warrantyExpiryDate: existing.warrantyExpiryDate,
      contractType: payload.contractType ?? existing.contractType,
      contractVendorName: payload.contractVendorName ?? existing.contractVendorName,
      contractExpiryDate: existing.contractExpiryDate,
      ppmFrequency: existing.ppmFrequency,
      lastPpmDate: existing.lastPpmDate,
      nextPpmDueDate: existing.nextPpmDueDate,
      calibrationFrequencyMonths: existing.calibrationFrequencyMonths,
      lastCalibrationDate: existing.lastCalibrationDate,
      nextCalibrationDueDate: existing.nextCalibrationDueDate,
      calibrationStatus: existing.calibrationStatus,
      electricalSafetyCertified: existing.electricalSafetyCertified,
      qrCodeIdentifier: existing.qrCodeIdentifier,
      responsibleBiomedicalEngineer: payload.responsibleBiomedicalEngineer ?? existing.responsibleBiomedicalEngineer,
      uptimePercentage: existing.uptimePercentage,
      isActive: existing.isActive,
      createdAt: existing.createdAt
    };
    this.assets[idx] = updated;
    this.appendAudit('UPDATE_ASSET', 'BIOMEDICAL_ASSET', updated.id, updated.assetCode, 'Asset parameters and operational status updated');
    return updated;
  }

  async getTransfers(_tenantId: string): Promise<AssetTransferDto[]> {
    return [...this.transfers];
  }

  async createTransfer(tenantId: string, payload: CreateAssetTransferRequest): Promise<AssetTransferDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');

    const transfer: AssetTransferDto = {
      id: crypto.randomUUID(),
      tenantId,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      fromDepartment: asset.departmentName,
      fromLocation: asset.physicalLocation,
      toDepartment: payload.toDepartment,
      toLocation: payload.toLocation,
      transferReason: payload.transferReason,
      initiatedBy: payload.initiatedBy,
      approvedBy: payload.approvedBy,
      transferDate: new Date().toISOString().split('T')[0] || '2026-08-30',
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    this.transfers.unshift(transfer);

    // Update asset location
    asset.departmentName = payload.toDepartment;
    asset.physicalLocation = payload.toLocation;

    this.appendAudit('TRANSFER_ASSET', 'ASSET_TRANSFER', transfer.id, asset.assetCode, `Transferred to ${payload.toDepartment} (${payload.toLocation})`);
    return transfer;
  }

  async getPpmSchedules(_tenantId: string): Promise<PpmScheduleDto[]> {
    return [...this.ppmSchedules];
  }

  async createPpmSchedule(tenantId: string, payload: CreatePpmScheduleRequest): Promise<PpmScheduleDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');

    const schedule: PpmScheduleDto = {
      id: crypto.randomUUID(),
      tenantId,
      scheduleCode: `PPM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      departmentName: asset.departmentName,
      frequency: payload.frequency,
      scheduledDueDate: payload.scheduledDueDate,
      assignedEngineer: payload.assignedEngineer,
      tasksChecklist: payload.tasksChecklist,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    };
    this.ppmSchedules.unshift(schedule);
    this.appendAudit('SCHEDULE_PPM', 'PPM_SCHEDULE', schedule.id, schedule.scheduleCode, 'Preventive maintenance task scheduled');
    return schedule;
  }

  async completePpmTask(_tenantId: string, scheduleId: string, payload: CompletePpmTaskRequest): Promise<PpmScheduleDto> {
    const idx = this.ppmSchedules.findIndex((p) => p.id === scheduleId);
    if (idx === -1) throw new Error('PPM schedule not found');
    const existing = this.ppmSchedules[idx];
    if (!existing) throw new Error('PPM schedule not found');

    const updated: PpmScheduleDto = {
      ...existing,
      status: payload.passedInspection ? 'COMPLETED_PASS' : 'COMPLETED_WITH_OBSERVATIONS',
      completedDate: new Date().toISOString().split('T')[0] || '2026-08-30',
      servicingNotes: payload.servicingNotes,
      partsReplaced: payload.partsReplaced
    };
    this.ppmSchedules[idx] = updated;

    // Update asset last PPM
    const asset = this.assets.find((a) => a.id === existing.assetId);
    if (asset) {
      asset.lastPpmDate = updated.completedDate;
      asset.nextPpmDueDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0] || '2026-11-30';
    }

    this.appendAudit('COMPLETE_PPM', 'PPM_SCHEDULE', updated.id, updated.scheduleCode, 'Preventive maintenance servicing finalized');
    return updated;
  }

  async getWorkOrders(_tenantId: string): Promise<BreakdownWorkOrderDto[]> {
    return [...this.workOrders];
  }

  async createWorkOrder(tenantId: string, payload: CreateWorkOrderRequest): Promise<BreakdownWorkOrderDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');

    const wo: BreakdownWorkOrderDto = {
      id: crypto.randomUUID(),
      tenantId,
      workOrderNumber: `WO-BME-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      departmentName: payload.departmentName,
      roomBedLocation: payload.roomBedLocation,
      reportedByClinician: payload.reportedByClinician,
      reportedTime: new Date().toISOString(),
      problemDescription: payload.problemDescription,
      priority: payload.priority,
      status: 'OPEN_REPORTED',
      clinicalImpactLevel: payload.clinicalImpactLevel,
      sparePartsCost: 0,
      laborHours: 0,
      downtimeHours: 0,
      createdAt: new Date().toISOString()
    };
    this.workOrders.unshift(wo);

    // Update asset operational status to breakdown if urgent or emergency
    if (payload.priority === 'EMERGENCY_STAT' || payload.priority === 'URGENT') {
      asset.operationalStatus = 'OUT_OF_SERVICE_BREAKDOWN';
    }

    this.appendAudit('CREATE_WORK_ORDER', 'WORK_ORDER', wo.id, wo.workOrderNumber, `Breakdown logged: ${payload.problemDescription}`);
    return wo;
  }

  async assignWorkOrder(_tenantId: string, workOrderId: string, payload: AssignWorkOrderRequest): Promise<BreakdownWorkOrderDto> {
    const idx = this.workOrders.findIndex((w) => w.id === workOrderId);
    if (idx === -1) throw new Error('Work order not found');
    const existing = this.workOrders[idx];
    if (!existing) throw new Error('Work order not found');

    const updated: BreakdownWorkOrderDto = {
      ...existing,
      status: 'ASSIGNED',
      assignedEngineer: payload.assignedEngineer,
      assignedTime: new Date().toISOString()
    };
    this.workOrders[idx] = updated;
    this.appendAudit('ASSIGN_WORK_ORDER', 'WORK_ORDER', updated.id, updated.workOrderNumber, `Assigned to ${payload.assignedEngineer}`);
    return updated;
  }

  async completeWorkOrder(_tenantId: string, workOrderId: string, payload: CompleteWorkOrderRequest): Promise<BreakdownWorkOrderDto> {
    const idx = this.workOrders.findIndex((w) => w.id === workOrderId);
    if (idx === -1) throw new Error('Work order not found');
    const existing = this.workOrders[idx];
    if (!existing) throw new Error('Work order not found');

    const updated: BreakdownWorkOrderDto = {
      ...existing,
      status: 'COMPLETED',
      rootCauseAnalysis: payload.rootCauseAnalysis,
      correctiveActionTaken: payload.correctiveActionTaken,
      laborHours: payload.laborHours,
      sparePartsCost: payload.sparePartsCost,
      completedAt: new Date().toISOString()
    };
    this.workOrders[idx] = updated;

    // Restore asset operational status to standby for clinical verification
    const asset = this.assets.find((a) => a.id === existing.assetId);
    if (asset) {
      asset.operationalStatus = 'STANDBY_READY';
    }

    this.appendAudit('COMPLETE_WORK_ORDER', 'WORK_ORDER', updated.id, updated.workOrderNumber, 'Corrective maintenance completed; awaiting clinician verification');
    return updated;
  }

  async verifyWorkOrder(_tenantId: string, workOrderId: string, payload: VerifyWorkOrderRequest): Promise<BreakdownWorkOrderDto> {
    const idx = this.workOrders.findIndex((w) => w.id === workOrderId);
    if (idx === -1) throw new Error('Work order not found');
    const existing = this.workOrders[idx];
    if (!existing) throw new Error('Work order not found');

    const updated: BreakdownWorkOrderDto = {
      ...existing,
      status: 'CLOSED',
      verifiedByClinicianName: payload.verifiedByClinicianName,
      verifiedAt: new Date().toISOString()
    };
    this.workOrders[idx] = updated;

    // Return asset to active IN_SERVICE
    const asset = this.assets.find((a) => a.id === existing.assetId);
    if (asset) {
      asset.operationalStatus = 'IN_SERVICE';
    }

    this.appendAudit('VERIFY_WORK_ORDER', 'WORK_ORDER', updated.id, updated.workOrderNumber, `Clinician verification signed by ${payload.verifiedByClinicianName}`);
    return updated;
  }

  async getCalibrationRecords(_tenantId: string): Promise<CalibrationRecordDto[]> {
    return [...this.calibrationRecords];
  }

  async createCalibrationRecord(tenantId: string, payload: CreateCalibrationRecordRequest): Promise<CalibrationRecordDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');

    const cal: CalibrationRecordDto = {
      id: crypto.randomUUID(),
      tenantId,
      certificateNumber: `CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      calibrationDate: payload.calibrationDate,
      validUntilDate: payload.validUntilDate,
      calibratedByAgency: payload.calibratedByAgency,
      leadMetrologistName: payload.leadMetrologistName,
      traceableStandardsUsed: payload.traceableStandardsUsed,
      tolerancesObserved: payload.tolerancesObserved,
      status: payload.status,
      safetyTestPassed: payload.safetyTestPassed,
      remarks: payload.remarks,
      createdAt: new Date().toISOString()
    };
    this.calibrationRecords.unshift(cal);

    asset.lastCalibrationDate = payload.calibrationDate;
    asset.nextCalibrationDueDate = payload.validUntilDate;
    asset.calibrationStatus = payload.status;

    this.appendAudit('RECORD_CALIBRATION', 'CALIBRATION_RECORD', cal.id, cal.certificateNumber, 'Metrology calibration certificate recorded');
    return cal;
  }

  async getSafetyTestRecords(_tenantId: string): Promise<SafetyTestRecordDto[]> {
    return [...this.safetyTestRecords];
  }

  async createSafetyTestRecord(tenantId: string, payload: CreateSafetyTestRecordRequest): Promise<SafetyTestRecordDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');

    const rec: SafetyTestRecordDto = {
      id: crypto.randomUUID(),
      tenantId,
      testCode: `EST-${Math.floor(10000 + Math.random() * 90000)}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      testType: payload.testType,
      testStandard: payload.testStandard,
      earthResistanceOhms: payload.earthResistanceOhms,
      chassisLeakageMicroAmps: payload.chassisLeakageMicroAmps,
      patientLeakageMicroAmps: payload.patientLeakageMicroAmps,
      insulationResistanceMOhm: payload.insulationResistanceMOhm,
      testedByEngineer: payload.testedByEngineer,
      testDate: payload.testDate,
      testPassed: payload.testPassed,
      remarks: payload.remarks,
      createdAt: new Date().toISOString()
    };
    this.safetyTestRecords.unshift(rec);
    this.appendAudit('RECORD_SAFETY_TEST', 'SAFETY_TEST', rec.id, rec.testCode, `Electrical safety test: ${payload.testStandard}`);
    return rec;
  }

  async getSpareParts(_tenantId: string): Promise<SparePartDto[]> {
    return [...this.spareParts];
  }

  async createSparePart(tenantId: string, payload: CreateSparePartRequest): Promise<SparePartDto> {
    const sp: SparePartDto = {
      id: crypto.randomUUID(),
      tenantId,
      partCode: payload.partCode,
      partName: payload.partName,
      compatibleModels: payload.compatibleModels,
      manufacturer: payload.manufacturer,
      quantityOnHand: payload.quantityOnHand,
      minimumThresholdQuantity: payload.minimumThresholdQuantity,
      unitCost: payload.unitCost,
      storageBinLocation: payload.storageBinLocation,
      isCriticalSpare: payload.isCriticalSpare,
      leadTimeDays: payload.leadTimeDays,
      createdAt: new Date().toISOString()
    };
    this.spareParts.unshift(sp);
    this.appendAudit('REGISTER_SPARE_PART', 'SPARE_PART', sp.id, sp.partCode, 'New biomedical replacement part added to inventory');
    return sp;
  }

  async getSparePartUsages(_tenantId: string): Promise<SparePartUsageDto[]> {
    return [...this.sparePartUsages];
  }

  async consumeSparePart(tenantId: string, payload: ConsumeSparePartRequest): Promise<SparePartUsageDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');
    const part = this.spareParts.find((p) => p.id === payload.partId);
    if (!part) throw new Error('Part not found');

    if (part.quantityOnHand < payload.quantityUsed) {
      throw new Error('Insufficient quantity on hand');
    }
    part.quantityOnHand -= payload.quantityUsed;

    const usage: SparePartUsageDto = {
      id: crypto.randomUUID(),
      tenantId,
      usageCode: `USE-BME-${Math.floor(10000 + Math.random() * 90000)}`,
      workOrderId: payload.workOrderId,
      assetId: asset.id,
      assetCode: asset.assetCode,
      partId: part.id,
      partCode: part.partCode,
      partName: part.partName,
      quantityUsed: payload.quantityUsed,
      unitCost: part.unitCost,
      totalCost: part.unitCost * payload.quantityUsed,
      usedByEngineer: payload.usedByEngineer,
      usageDate: new Date().toISOString().split('T')[0] || '2026-08-30',
      createdAt: new Date().toISOString()
    };
    this.sparePartUsages.unshift(usage);
    this.appendAudit('CONSUME_SPARE_PART', 'SPARE_PART_USAGE', usage.id, usage.usageCode, `Consumed ${payload.quantityUsed}x ${part.partName}`);
    return usage;
  }

  async getVendorVisits(_tenantId: string): Promise<VendorServiceVisitDto[]> {
    return [...this.vendorVisits];
  }

  async logVendorVisit(tenantId: string, payload: LogVendorVisitRequest): Promise<VendorServiceVisitDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');

    const visit: VendorServiceVisitDto = {
      id: crypto.randomUUID(),
      tenantId,
      visitCode: `VIS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      vendorName: payload.vendorName,
      serviceEngineerName: payload.serviceEngineerName,
      contactPhone: payload.contactPhone,
      visitType: payload.visitType,
      visitDate: payload.visitDate,
      serviceReportNumber: payload.serviceReportNumber,
      serviceSummary: payload.serviceSummary,
      serviceCost: payload.serviceCost,
      vendorPerformanceRating: payload.vendorPerformanceRating,
      hospitalSupervisorName: payload.hospitalSupervisorName,
      createdAt: new Date().toISOString()
    };
    this.vendorVisits.unshift(visit);
    this.appendAudit('LOG_VENDOR_VISIT', 'VENDOR_VISIT', visit.id, visit.visitCode, `OEM visit recorded for ${payload.vendorName}`);
    return visit;
  }

  async getCondemnations(_tenantId: string): Promise<CondemnationRecordDto[]> {
    return [...this.condemnations];
  }

  async createCondemnation(tenantId: string, payload: CreateCondemnationRequest): Promise<CondemnationRecordDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');

    const cond: CondemnationRecordDto = {
      id: crypto.randomUUID(),
      tenantId,
      condemnationCode: `COND-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      departmentName: asset.departmentName,
      purchaseYear: asset.purchaseDate.substring(0, 4),
      cumulativeMaintenanceCost: 150000,
      reasonForCondemnation: payload.reasonForCondemnation,
      condemnationBoardChairman: payload.condemnationBoardChairman,
      estimatedScrapValue: payload.estimatedScrapValue,
      hazardousDisposalProtocol: payload.hazardousDisposalProtocol,
      status: 'PROPOSED',
      createdAt: new Date().toISOString()
    };
    this.condemnations.unshift(cond);
    this.appendAudit('PROPOSE_CONDEMNATION', 'CONDEMNATION', cond.id, cond.condemnationCode, 'Equipment proposed for condemnation/scrap');
    return cond;
  }

  async approveCondemnation(_tenantId: string, condemnationId: string, payload: ApproveCondemnationRequest): Promise<CondemnationRecordDto> {
    const idx = this.condemnations.findIndex((c) => c.id === condemnationId);
    if (idx === -1) throw new Error('Condemnation record not found');
    const existing = this.condemnations[idx];
    if (!existing) throw new Error('Condemnation record not found');

    const updated: CondemnationRecordDto = {
      ...existing,
      status: payload.status,
      approvedDate: new Date().toISOString().split('T')[0] || '2026-08-30'
    };
    this.condemnations[idx] = updated;

    // Decommission asset
    const asset = this.assets.find((a) => a.id === existing.assetId);
    if (asset) {
      asset.operationalStatus = 'DECOMMISSIONED_CONDEMNED';
      asset.isActive = false;
    }

    this.appendAudit('APPROVE_CONDEMNATION', 'CONDEMNATION', updated.id, updated.condemnationCode, `Condemnation board approval: ${payload.status}`);
    return updated;
  }

  async getIncidents(_tenantId: string): Promise<BiomedicalIncidentDto[]> {
    return [...this.incidents];
  }

  async createIncident(tenantId: string, payload: CreateBiomedicalIncidentRequest): Promise<BiomedicalIncidentDto> {
    const asset = this.assets.find((a) => a.id === payload.assetId);
    if (!asset) throw new Error('Asset not found');

    const inc: BiomedicalIncidentDto = {
      id: crypto.randomUUID(),
      tenantId,
      incidentCode: `BME-INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      departmentName: payload.departmentName,
      incidentDateTime: payload.incidentDateTime,
      severity: payload.severity,
      patientInvolved: payload.patientInvolved,
      patientMrn: payload.patientMrn,
      incidentSummary: payload.incidentSummary,
      initialActionTaken: payload.initialActionTaken,
      investigatingOfficer: payload.investigatingOfficer,
      isResolved: false,
      createdAt: new Date().toISOString()
    };
    this.incidents.unshift(inc);
    this.appendAudit('REPORT_INCIDENT', 'BIOMEDICAL_INCIDENT', inc.id, inc.incidentCode, `Equipment safety incident: ${payload.incidentSummary}`);
    return inc;
  }

  async resolveIncident(_tenantId: string, incidentId: string, payload: ResolveBiomedicalIncidentRequest): Promise<BiomedicalIncidentDto> {
    const idx = this.incidents.findIndex((i) => i.id === incidentId);
    if (idx === -1) throw new Error('Incident not found');
    const existing = this.incidents[idx];
    if (!existing) throw new Error('Incident not found');

    const updated: BiomedicalIncidentDto = {
      ...existing,
      rootCause: payload.rootCause,
      capaActionPlan: payload.capaActionPlan,
      isResolved: true,
      resolvedAt: new Date().toISOString()
    };
    this.incidents[idx] = updated;
    this.appendAudit('RESOLVE_INCIDENT', 'BIOMEDICAL_INCIDENT', updated.id, updated.incidentCode, `Incident RCA and CAPA finalized by ${payload.resolvedBy}`);
    return updated;
  }

  async getAuditTraces(_tenantId: string): Promise<BiomedicalAuditTraceDto[]> {
    return [...this.auditTraces];
  }
}

export const assetBiomedicalService = new AssetBiomedicalService();
