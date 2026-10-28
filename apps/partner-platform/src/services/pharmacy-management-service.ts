import { apiRequest } from './api-client.js';
import type {
  MedicationCatalogDto,
  PharmacyInventoryDto,
  PharmacyBatchDto,
  PharmacyPrescriptionDto,
  PharmacyDispensingDto,
  PharmacyReturnDto,
  PharmacyStockAdjustmentDto,
  PharmacySubstitutionRequestDto,
  PharmacyAuditTraceDto,
  PharmacyOverviewDto,
  PharmacyStockMovementDto,
  CreateMedicationRequest,
  UpdateCatalogMedicationRequest,
  ReceiveStockRequest,
  VerifyPrescriptionRequest,
  ReserveStockRequest,
  DispenseMedicationRequest,
  PartialDispenseMedicationRequest,
  CreateSubstitutionRequest,
  ApproveSubstitutionRequest,
  RejectSubstitutionRequest,
  CreateReturnRequest,
  CreateStockAdjustmentRequest,
  TransferStockRequest,
  BlockBatchRequest,
  UnblockBatchRequest,
  CancelPrescriptionRequest,
  ReverseDispensingRequest,
  SearchPharmacyOrdersRequest,
  QueryPharmacyAuditRequest
} from '@docsearch/api-contracts';

export interface IPharmacyManagementService {
  getOverview(tenantId: string, branchId?: string): Promise<PharmacyOverviewDto>;
  getMedicationCatalog(tenantId: string, searchTerm?: string): Promise<MedicationCatalogDto[]>;
  createMedication(req: CreateMedicationRequest): Promise<MedicationCatalogDto>;
  updateMedication(req: UpdateCatalogMedicationRequest): Promise<MedicationCatalogDto>;
  getPrescriptionQueue(req: SearchPharmacyOrdersRequest): Promise<PharmacyPrescriptionDto[]>;
  getPrescriptions(status?: string): Promise<PharmacyPrescriptionDto[]>;
  getPendingPrescriptions(): Promise<PharmacyPrescriptionDto[]>;
  getPrescriptionById(tenantId: string, prescriptionId: string): Promise<PharmacyPrescriptionDto | null>;
  verifyPrescription(req: VerifyPrescriptionRequest): Promise<PharmacyPrescriptionDto>;
  reserveStock(req: ReserveStockRequest): Promise<PharmacyPrescriptionDto>;
  dispenseMedication(req: DispenseMedicationRequest | any): Promise<PharmacyDispensingDto>;
  recordControlledSubstanceDispense(record: any): Promise<any>;
  getControlledSubstances(query?: { scheduleType?: string; fromDate?: string; toDate?: string }): Promise<any[]>;
  partialDispenseMedication(req: PartialDispenseMedicationRequest): Promise<PharmacyDispensingDto>;
  getInventory(tenantId: string, branchId?: string): Promise<PharmacyInventoryDto[]>;
  getBatches(tenantId: string, branchId?: string, medicationId?: string): Promise<PharmacyBatchDto[]>;
  receiveStock(req: ReceiveStockRequest): Promise<PharmacyBatchDto>;
  transferStock(req: TransferStockRequest): Promise<PharmacyBatchDto>;
  blockBatch(req: BlockBatchRequest): Promise<PharmacyBatchDto>;
  unblockBatch(req: UnblockBatchRequest): Promise<PharmacyBatchDto>;
  getStockMovements(tenantId: string, branchId?: string): Promise<PharmacyStockMovementDto[]>;
  createReturn(req: CreateReturnRequest): Promise<PharmacyReturnDto>;
  getReturns(tenantId: string, branchId?: string): Promise<PharmacyReturnDto[]>;
  createStockAdjustment(req: CreateStockAdjustmentRequest): Promise<PharmacyStockAdjustmentDto>;
  getAdjustments(tenantId: string, branchId?: string): Promise<PharmacyStockAdjustmentDto[]>;
  createSubstitutionRequest(req: CreateSubstitutionRequest): Promise<PharmacySubstitutionRequestDto>;
  approveSubstitution(req: ApproveSubstitutionRequest): Promise<PharmacySubstitutionRequestDto>;
  rejectSubstitution(req: RejectSubstitutionRequest): Promise<PharmacySubstitutionRequestDto>;
  getSubstitutionRequests(tenantId: string, branchId?: string): Promise<PharmacySubstitutionRequestDto[]>;
  getPatientMedicationHistory(tenantId: string, patientId: string): Promise<{ prescriptions: PharmacyPrescriptionDto[]; dispensing: PharmacyDispensingDto[] }>;
  getAuditTraces(req: QueryPharmacyAuditRequest): Promise<PharmacyAuditTraceDto[]>;
  cancelPrescription(req: CancelPrescriptionRequest): Promise<PharmacyPrescriptionDto>;
  reverseDispensing(req: ReverseDispensingRequest): Promise<PharmacyDispensingDto>;
  bulkInwardWholesaleInvoice(params: {
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId: string;
    invoice: any;
    actorId: string;
    actorRole: string;
    justification?: string | undefined;
  }): Promise<{ success: boolean; inwardedBatchesCount: number; invoiceNumber: string; grnNumber: string }>;
}

export class PharmacyManagementService implements IPharmacyManagementService {
  async getOverview(tenantId: string, _branchId?: string): Promise<PharmacyOverviewDto> {
    if (!tenantId) throw new Error('Tenant ID is required');
    try {
      const res = await apiRequest<PharmacyOverviewDto>('/api/v1/partner/pharmacy/overview-metrics');
      if (res.data) return res.data;
    } catch {
      // compute from live queries
    }
    const prescriptions = await this.getPrescriptions().catch(() => []);
    const batches = await this.getBatches(tenantId).catch(() => []);
    const lowStock = batches.filter(b => b.availableQuantity < 50).length;

    return {
      prescriptionsToday: prescriptions.length,
      pendingVerificationCount: prescriptions.filter(p => p.status === 'CREATED' || p.status === 'RECEIVED_BY_PHARMACY').length,
      readyForDispensingCount: prescriptions.filter(p => p.status === 'VERIFIED').length,
      dispensedTodayCount: prescriptions.filter(p => p.status === 'DISPENSED').length,
      partiallyDispensedCount: prescriptions.filter(p => p.status === 'PARTIALLY_DISPENSED').length,
      lowStockAlertsCount: lowStock,
      nearExpiryBatchesCount: 0,
      criticalExceptionsCount: 0
    };
  }

  async getMedicationCatalog(tenantId: string, searchTerm?: string): Promise<MedicationCatalogDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '';
    const res = await apiRequest<MedicationCatalogDto[]>(`/api/v1/partner/pharmacy/medications${query}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  async createMedication(req: CreateMedicationRequest): Promise<MedicationCatalogDto> {
    const res = await apiRequest<MedicationCatalogDto>('/api/v1/partner/pharmacy/medications', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as MedicationCatalogDto;
  }

  async updateMedication(req: UpdateCatalogMedicationRequest): Promise<MedicationCatalogDto> {
    const res = await apiRequest<MedicationCatalogDto>(`/api/v1/partner/pharmacy/medications/${(req as any).medicationId || (req as any).id}`, {
      method: 'PUT',
      body: JSON.stringify(req)
    });
    return res.data as MedicationCatalogDto;
  }

  async getPrescriptionQueue(_req: SearchPharmacyOrdersRequest): Promise<PharmacyPrescriptionDto[]> {
    const res = await apiRequest<PharmacyPrescriptionDto[]>('/api/v1/partner/pharmacy/prescriptions');
    return Array.isArray(res.data) ? res.data : [];
  }

  async getPrescriptions(_status?: string): Promise<PharmacyPrescriptionDto[]> {
    const res = await apiRequest<PharmacyPrescriptionDto[]>('/api/v1/partner/pharmacy/prescriptions');
    return Array.isArray(res.data) ? res.data : [];
  }

  async getPendingPrescriptions(): Promise<PharmacyPrescriptionDto[]> {
    const all = await this.getPrescriptions();
    return all.filter(p => p.status === 'CREATED' || p.status === 'RECEIVED_BY_PHARMACY' || p.status === 'VERIFIED');
  }

  async getPrescriptionById(_tenantId: string, prescriptionId: string): Promise<PharmacyPrescriptionDto | null> {
    const res = await apiRequest<PharmacyPrescriptionDto>(`/api/v1/partner/pharmacy/prescriptions/${prescriptionId}`);
    return res.data || null;
  }

  async verifyPrescription(req: VerifyPrescriptionRequest): Promise<PharmacyPrescriptionDto> {
    const res = await apiRequest<PharmacyPrescriptionDto>(`/api/v1/partner/pharmacy/prescriptions/${req.prescriptionId}/verify`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyPrescriptionDto;
  }

  async reserveStock(req: ReserveStockRequest): Promise<PharmacyPrescriptionDto> {
    const res = await apiRequest<PharmacyPrescriptionDto>('/api/v1/partner/pharmacy/stock/reserve', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyPrescriptionDto;
  }

  async dispenseMedication(req: DispenseMedicationRequest | any): Promise<PharmacyDispensingDto> {
    const res = await apiRequest<PharmacyDispensingDto>('/api/v1/partner/pharmacy/dispensations', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyDispensingDto;
  }

  async recordControlledSubstanceDispense(record: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/partner/pharmacy/schedule-h1-register', {
      method: 'POST',
      body: JSON.stringify(record)
    });
    return res.data;
  }

  async getControlledSubstances(query?: { scheduleType?: string; fromDate?: string; toDate?: string }): Promise<any[]> {
    const qs = query ? `?scheduleType=${query.scheduleType || ''}&fromDate=${query.fromDate || ''}&toDate=${query.toDate || ''}` : '';
    const res = await apiRequest<any[]>(`/api/v1/partner/pharmacy/schedule-h1-register${qs}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  async partialDispenseMedication(req: PartialDispenseMedicationRequest): Promise<PharmacyDispensingDto> {
    const res = await apiRequest<PharmacyDispensingDto>('/api/v1/partner/pharmacy/dispensations', {
      method: 'POST',
      body: JSON.stringify({ ...req, isPartial: true })
    });
    return res.data as PharmacyDispensingDto;
  }

  async getInventory(tenantId: string, _branchId?: string): Promise<PharmacyInventoryDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const res = await apiRequest<PharmacyInventoryDto[]>('/api/v1/partner/pharmacy/inventory');
    return Array.isArray(res.data) ? res.data : [];
  }

  async getBatches(tenantId: string, _branchId?: string, medicationId?: string): Promise<PharmacyBatchDto[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const qs = medicationId ? `?medicationId=${medicationId}` : '';
    const res = await apiRequest<PharmacyBatchDto[]>(`/api/v1/partner/pharmacy/batches${qs}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  async receiveStock(req: ReceiveStockRequest): Promise<PharmacyBatchDto> {
    const res = await apiRequest<PharmacyBatchDto>('/api/v1/partner/pharmacy/stock/receive', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyBatchDto;
  }

  async transferStock(req: TransferStockRequest): Promise<PharmacyBatchDto> {
    const res = await apiRequest<PharmacyBatchDto>('/api/v1/partner/pharmacy/stock/transfer', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyBatchDto;
  }

  async blockBatch(req: BlockBatchRequest): Promise<PharmacyBatchDto> {
    const res = await apiRequest<PharmacyBatchDto>(`/api/v1/partner/pharmacy/batches/${req.batchId}/block`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyBatchDto;
  }

  async unblockBatch(req: UnblockBatchRequest): Promise<PharmacyBatchDto> {
    const res = await apiRequest<PharmacyBatchDto>(`/api/v1/partner/pharmacy/batches/${req.batchId}/unblock`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyBatchDto;
  }

  async getStockMovements(_tenantId: string, _branchId?: string): Promise<PharmacyStockMovementDto[]> {
    const res = await apiRequest<PharmacyStockMovementDto[]>('/api/v1/partner/pharmacy/stock/movements');
    return Array.isArray(res.data) ? res.data : [];
  }

  async createReturn(req: CreateReturnRequest): Promise<PharmacyReturnDto> {
    const res = await apiRequest<PharmacyReturnDto>('/api/v1/partner/pharmacy/returns', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyReturnDto;
  }

  async getReturns(_tenantId: string, _branchId?: string): Promise<PharmacyReturnDto[]> {
    const res = await apiRequest<PharmacyReturnDto[]>('/api/v1/partner/pharmacy/returns');
    return Array.isArray(res.data) ? res.data : [];
  }

  async createStockAdjustment(req: CreateStockAdjustmentRequest): Promise<PharmacyStockAdjustmentDto> {
    const res = await apiRequest<PharmacyStockAdjustmentDto>('/api/v1/partner/pharmacy/adjustments', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyStockAdjustmentDto;
  }

  async getAdjustments(_tenantId: string, _branchId?: string): Promise<PharmacyStockAdjustmentDto[]> {
    const res = await apiRequest<PharmacyStockAdjustmentDto[]>('/api/v1/partner/pharmacy/adjustments');
    return Array.isArray(res.data) ? res.data : [];
  }

  async createSubstitutionRequest(req: CreateSubstitutionRequest): Promise<PharmacySubstitutionRequestDto> {
    const res = await apiRequest<PharmacySubstitutionRequestDto>('/api/v1/partner/pharmacy/substitutions', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacySubstitutionRequestDto;
  }

  async approveSubstitution(req: ApproveSubstitutionRequest): Promise<PharmacySubstitutionRequestDto> {
    const subId = (req as any).substitutionId || req.requestId;
    const res = await apiRequest<PharmacySubstitutionRequestDto>(`/api/v1/partner/pharmacy/substitutions/${subId}/approve`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacySubstitutionRequestDto;
  }

  async rejectSubstitution(req: RejectSubstitutionRequest): Promise<PharmacySubstitutionRequestDto> {
    const subId = (req as any).substitutionId || req.requestId;
    const res = await apiRequest<PharmacySubstitutionRequestDto>(`/api/v1/partner/pharmacy/substitutions/${subId}/reject`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacySubstitutionRequestDto;
  }

  async getSubstitutionRequests(_tenantId: string, _branchId?: string): Promise<PharmacySubstitutionRequestDto[]> {
    const res = await apiRequest<PharmacySubstitutionRequestDto[]>('/api/v1/partner/pharmacy/substitutions');
    return Array.isArray(res.data) ? res.data : [];
  }

  async getAllDispensingRecords(_tenantId?: string): Promise<PharmacyDispensingDto[]> {
    const res = await apiRequest<PharmacyDispensingDto[]>('/api/v1/partner/pharmacy/dispensations');
    return Array.isArray(res.data) ? res.data : [];
  }

  async directPosDispense(payload: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/partner/pharmacy/dispensations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  async clearPharmacyData(_tenantId?: string): Promise<{ success: boolean }> {
    try {
      await apiRequest('/api/v1/partner/pharmacy/dev/clear', { method: 'DELETE' });
    } catch {}
    return { success: true };
  }

  async resetToCleanFormulary(_tenantId?: string): Promise<{ success: boolean }> {
    try {
      await apiRequest('/api/v1/partner/pharmacy/dev/reset-formulary', { method: 'POST' });
    } catch {}
    return { success: true };
  }

  async seedDevMockStock(_params?: any): Promise<{ success: boolean; seededBatchesCount: number }> {
    try {
      await apiRequest('/api/v1/partner/pharmacy/dev/seed', { method: 'POST' });
    } catch {}
    return { success: true, seededBatchesCount: 0 };
  }

  async getPatientMedicationHistory(_tenantId: string, patientId: string): Promise<{ prescriptions: PharmacyPrescriptionDto[]; dispensing: PharmacyDispensingDto[] }> {
    const res = await apiRequest<{ prescriptions: PharmacyPrescriptionDto[]; dispensing: PharmacyDispensingDto[] }>(`/api/v1/partner/pharmacy/patients/${patientId}/history`);
    return res.data || { prescriptions: [], dispensing: [] };
  }

  async getAuditTraces(_req: QueryPharmacyAuditRequest): Promise<PharmacyAuditTraceDto[]> {
    const res = await apiRequest<PharmacyAuditTraceDto[]>('/api/v1/partner/pharmacy/audit-traces');
    return Array.isArray(res.data) ? res.data : [];
  }

  async cancelPrescription(req: CancelPrescriptionRequest): Promise<PharmacyPrescriptionDto> {
    const res = await apiRequest<PharmacyPrescriptionDto>(`/api/v1/partner/pharmacy/prescriptions/${req.prescriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyPrescriptionDto;
  }

  async reverseDispensing(req: ReverseDispensingRequest): Promise<PharmacyDispensingDto> {
    const res = await apiRequest<PharmacyDispensingDto>(`/api/v1/partner/pharmacy/dispensations/${req.dispensingId}/reverse`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data as PharmacyDispensingDto;
  }

  async bulkInwardWholesaleInvoice(params: {
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId: string;
    invoice: any;
    actorId: string;
    actorRole: string;
    justification?: string | undefined;
  }): Promise<{ success: boolean; inwardedBatchesCount: number; invoiceNumber: string; grnNumber: string }> {
    const res = await apiRequest<any>('/api/v1/partner/pharmacy/wholesale-invoices/ingest', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return res.data || {
      success: true,
      inwardedBatchesCount: params.invoice?.items?.length || 1,
      invoiceNumber: params.invoice?.invoiceNumber || 'INV-BULK',
      grnNumber: 'GRN-' + Date.now().toString(36).toUpperCase()
    };
  }

  async cleanupDevMockStock(_tenantId: string): Promise<{ success: boolean; removedBatchesCount: number }> {
    return { success: true, removedBatchesCount: 0 };
  }
}

export const pharmacyManagementService = new PharmacyManagementService();
