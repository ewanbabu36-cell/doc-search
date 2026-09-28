import { apiRequest, isMockFallbackAllowed } from './api-client.js';
import { pharmacyOfflineStorageService } from './pharmacy-offline-storage-service.js';
import { pharmacyRevenueGallaService } from './pharmacy-revenue-galla-service.js';
import { cdscoInspectionAuditService } from './cdsco-inspection-audit-service.js';

function loadStored<T>(key: string, fallback: T[]): T[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
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
import {
  MOCK_MEDICATION_CATALOG,
  MOCK_PHARMACY_BATCHES,
  MOCK_PHARMACY_INVENTORY,
  MOCK_PHARMACY_PRESCRIPTIONS,
  MOCK_PHARMACY_DISPENSING,
  MOCK_PHARMACY_STOCK_MOVEMENTS,
  MOCK_PHARMACY_SUBSTITUTIONS,
  MOCK_PHARMACY_RETURNS,
  MOCK_PHARMACY_ADJUSTMENTS,
  MOCK_PHARMACY_AUDIT_TRACES
} from './mock-pharmacy-data.js';
import { MOCK_TENANT_ID } from './mock-partner-foundation-data.js';

export interface IPharmacyManagementService {
  getOverview(tenantId: string, branchId?: string): Promise<PharmacyOverviewDto>;
  getMedicationCatalog(tenantId: string, searchTerm?: string): Promise<MedicationCatalogDto[]>;
  createMedication(req: CreateMedicationRequest): Promise<MedicationCatalogDto>;
  updateMedication(req: UpdateCatalogMedicationRequest): Promise<MedicationCatalogDto>;
  getPrescriptionQueue(req: SearchPharmacyOrdersRequest): Promise<PharmacyPrescriptionDto[]>;
  getPrescriptionById(tenantId: string, prescriptionId: string): Promise<PharmacyPrescriptionDto | null>;
  verifyPrescription(req: VerifyPrescriptionRequest): Promise<PharmacyPrescriptionDto>;
  reserveStock(req: ReserveStockRequest): Promise<PharmacyPrescriptionDto>;
  dispenseMedication(req: DispenseMedicationRequest): Promise<PharmacyDispensingDto>;
  partialDispenseMedication(req: PartialDispenseMedicationRequest): Promise<PharmacyDispensingDto>;
  getInventory(tenantId: string, branchId?: string): Promise<PharmacyInventoryDto[]>;
  getBatches(tenantId: string, branchId?: string, medicationId?: string): Promise<PharmacyBatchDto[]>;
  receiveStock(req: ReceiveStockRequest): Promise<PharmacyBatchDto>;
  transferStock(req: TransferStockRequest): Promise<PharmacyBatchDto>;
  blockBatch(req: BlockBatchRequest): Promise<PharmacyBatchDto>;
  unblockBatch(req: UnblockBatchRequest): Promise<PharmacyBatchDto>;
  getStockMovements(tenantId: string, branchId?: string): Promise<typeof MOCK_PHARMACY_STOCK_MOVEMENTS>;
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

function getInitialPharmacyBatches(): PharmacyBatchDto[] {
  return loadStored<PharmacyBatchDto>("docsearch_pharmacy_batches", []);
}

function getInitialPharmacyInventory(_initialBatches: PharmacyBatchDto[]): PharmacyInventoryDto[] {
  return loadStored<PharmacyInventoryDto>("docsearch_pharmacy_inventory", []);
}

export class PharmacyManagementService implements IPharmacyManagementService {
  private catalog: MedicationCatalogDto[] = loadStored("docsearch_pharmacy_catalog", MOCK_MEDICATION_CATALOG);
  private batches: PharmacyBatchDto[] = getInitialPharmacyBatches();
  private inventory: PharmacyInventoryDto[] = getInitialPharmacyInventory(this.batches);
  private prescriptions: PharmacyPrescriptionDto[] = loadStored("docsearch_pharmacy_prescriptions", MOCK_PHARMACY_PRESCRIPTIONS);
  private dispensing: PharmacyDispensingDto[] = loadStored("docsearch_pharmacy_dispensing", MOCK_PHARMACY_DISPENSING);
  private movements = [...MOCK_PHARMACY_STOCK_MOVEMENTS];
  private substitutions: PharmacySubstitutionRequestDto[] = [...MOCK_PHARMACY_SUBSTITUTIONS];
  private returns: PharmacyReturnDto[] = [...MOCK_PHARMACY_RETURNS];
  private adjustments: PharmacyStockAdjustmentDto[] = [...MOCK_PHARMACY_ADJUSTMENTS];
  private audits: PharmacyAuditTraceDto[] = [...MOCK_PHARMACY_AUDIT_TRACES];

  async getOverview(_tenantId: string, _branchId?: string): Promise<PharmacyOverviewDto> {
    const pendingVerification = this.prescriptions.filter((p) => p.status === 'CREATED' || p.status === 'RECEIVED_BY_PHARMACY' || p.status === 'UNDER_REVIEW').length;
    const readyForDispense = this.prescriptions.filter((p) => p.status === 'READY_FOR_DISPENSING' || p.status === 'VERIFIED' || p.status === 'STOCK_RESERVED').length;
    const dispensedToday = this.prescriptions.filter((p) => p.status === 'DISPENSED' || p.status === 'COMPLETED').length;
    const partiallyDispensed = this.prescriptions.filter((p) => p.status === 'PARTIALLY_DISPENSED').length;
    const lowStock = this.inventory.filter((i) => i.availableQuantity <= i.reorderLevel).length;
    const nearExpiry = this.batches.filter((b) => b.daysToExpiry >= 0 && b.daysToExpiry <= 60).length;

    return {
      prescriptionsToday: this.prescriptions.length,
      pendingVerificationCount: pendingVerification,
      readyForDispensingCount: readyForDispense,
      dispensedTodayCount: dispensedToday,
      partiallyDispensedCount: partiallyDispensed,
      lowStockAlertsCount: lowStock,
      nearExpiryBatchesCount: nearExpiry,
      criticalExceptionsCount: this.substitutions.filter((s) => s.status === 'PENDING_APPROVAL').length
    };
  }

  async getMedicationCatalog(tenantId: string, searchTerm?: string): Promise<MedicationCatalogDto[]> {
    try {
      const q = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '';
      const res = await apiRequest<MedicationCatalogDto[]>(`/api/v1/partner/pharmacy/medications${q}`);
      if (res.success && Array.isArray(res.data)) {
        const backendIds = new Set(res.data.map((m) => m.id));
        const localOnly = this.catalog.filter((m) => !backendIds.has(m.id));
        const merged = [...res.data, ...localOnly];
        let result = merged.filter((m) => m.tenantId === tenantId);
        if (searchTerm && searchTerm.trim().length > 0) {
          const term = searchTerm.toLowerCase();
          result = result.filter(
            (m) =>
              m.genericName.toLowerCase().includes(term) ||
              m.brandName.toLowerCase().includes(term) ||
              m.medicationCode.toLowerCase().includes(term) ||
              m.category.toLowerCase().includes(term)
          );
        }
        return result;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    let result = this.catalog.filter((m) => m.tenantId === tenantId);
    if (searchTerm && searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.genericName.toLowerCase().includes(term) ||
          m.brandName.toLowerCase().includes(term) ||
          m.medicationCode.toLowerCase().includes(term) ||
          m.category.toLowerCase().includes(term)
      );
    }
    return result;
  }

  async createMedication(req: CreateMedicationRequest): Promise<MedicationCatalogDto> {
    try {
      const res = await apiRequest<MedicationCatalogDto>('/api/v1/partner/pharmacy/medications', {
        method: 'POST',
        body: JSON.stringify({
          ...req,
          name: (req as any).name || req.brandName || req.genericName || 'Medication'
        })
      });
      if (res.success && res.data) {
        this.catalog.unshift(res.data);
        saveStored("docsearch_pharmacy_catalog", this.catalog);
        return res.data;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    const now = new Date().toISOString();
    const newMed: MedicationCatalogDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      medicationCode: req.medicationCode,
      genericName: req.genericName,
      brandName: req.brandName,
      strength: req.strength,
      dosageForm: req.dosageForm,
      route: req.route,
      packSize: req.packSize,
      unitOfMeasure: req.unitOfMeasure,
      manufacturer: req.manufacturer,
      category: req.category,
      controlledMedication: req.controlledMedication,
      prescriptionRequired: req.prescriptionRequired,
      status: 'ACTIVE',
      therapeuticClass: req.therapeuticClass,
      storageConditions: req.storageConditions,
      variants: [],
      createdAt: now,
      updatedAt: now
    };

    this.catalog.unshift(newMed);
    saveStored("docsearch_pharmacy_catalog", this.catalog);
    this.recordAudit(req.tenantId, req.partnerId, req.organizationId, req.branchId, req.actorId, req.actorRole, 'MEDICATION_CATALOG_CREATED', 'MEDICATION_CATALOG', newMed.id, req.justification, undefined, newMed as unknown as Record<string, unknown>);

    return newMed;
  }

  async updateMedication(req: UpdateCatalogMedicationRequest): Promise<MedicationCatalogDto> {
    const med = this.catalog.find((m) => m.id === req.medicationId && m.tenantId === req.tenantId);
    if (!med) throw new Error('Medication not found in catalog');

    const previousSnapshot = { ...med };
    if (req.genericName) med.genericName = req.genericName;
    if (req.brandName) med.brandName = req.brandName;
    if (req.strength) med.strength = req.strength;
    if (req.dosageForm) med.dosageForm = req.dosageForm;
    if (req.route) med.route = req.route;
    if (req.packSize) med.packSize = req.packSize;
    if (req.unitOfMeasure) med.unitOfMeasure = req.unitOfMeasure;
    if (req.manufacturer) med.manufacturer = req.manufacturer;
    if (req.category) med.category = req.category;
    if (req.controlledMedication !== undefined) med.controlledMedication = req.controlledMedication;
    if (req.prescriptionRequired !== undefined) med.prescriptionRequired = req.prescriptionRequired;
    if (req.status) med.status = req.status;
    if (req.storageConditions) med.storageConditions = req.storageConditions;
    med.updatedAt = new Date().toISOString();
    saveStored("docsearch_pharmacy_catalog", this.catalog);

    this.recordAudit(req.tenantId, med.partnerId, med.organizationId, med.branchId, req.actorId, req.actorRole, 'MEDICATION_CATALOG_UPDATED', 'MEDICATION_CATALOG', med.id, req.justification, previousSnapshot as unknown as Record<string, unknown>, med as unknown as Record<string, unknown>);

    return med;
  }

  async getPrescriptionQueue(req: SearchPharmacyOrdersRequest): Promise<PharmacyPrescriptionDto[]> {
    try {
      const query = new URLSearchParams();
      if (req.status) query.set('status', req.status);
      const q = query.toString() ? `?${query.toString()}` : '';
      const res = await apiRequest<PharmacyPrescriptionDto[]>(`/api/v1/partner/pharmacy/prescriptions${q}`);
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    if (isMockFallbackAllowed()) {
      let list = this.prescriptions.filter((p) => p.tenantId === req.tenantId);
      if (req.branchId) list = list.filter((p) => p.branchId === req.branchId);
      if (req.status) list = list.filter((p) => p.status === req.status);
      if (req.priority) list = list.filter((p) => p.priority === req.priority);
      if (req.patientId) list = list.filter((p) => p.patientId === req.patientId);
      if (req.searchTerm && req.searchTerm.trim().length > 0) {
        const term = req.searchTerm.toLowerCase();
        list = list.filter(
          (p) =>
            p.prescriptionNumber.toLowerCase().includes(term) ||
            p.patientName.toLowerCase().includes(term) ||
            p.patientMrn.toLowerCase().includes(term) ||
            p.prescribingDoctorName.toLowerCase().includes(term)
        );
      }
      return list;
    }
    return [];
  }

  async getPrescriptionById(tenantId: string, prescriptionId: string): Promise<PharmacyPrescriptionDto | null> {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/pharmacy/prescriptions/${encodeURIComponent(prescriptionId)}`);
      if (res.success && res.data) {
        const item = res.data;
        const mapped: PharmacyPrescriptionDto = {
          id: item.id || item.prescriptionId,
          tenantId: item.tenantId || tenantId,
          partnerId: item.partnerId || '22222222-2222-4222-8222-222222222201',
          organizationId: item.organizationId || '44444444-4444-4444-8444-444444444401',
          organizationName: item.organizationName || 'Clinical Healthcare Facility',
          branchId: item.branchId || '88888888-1111-4888-8888-111111111101',
          branchName: item.branchName || 'Main Hospital Branch',
          prescriptionNumber: item.prescriptionNumber || `RX-${(item.id || '').substring(0, 8)}`,
          patientId: item.patientId || '55555555-5555-4555-8555-555555555501',
          patientName: item.patientName || 'Patient',
          patientMrn: item.patientMrn || '',
          patientAllergies: item.patientAllergies || [],
          encounterId: item.encounterId || item.id,
          encounterNumber: item.encounterNumber || 'ENC-DEFAULT',
          prescribingDoctorId: item.doctorId || '61111111-1111-4111-8111-111111111101',
          prescribingDoctorName: item.doctorName || 'Doctor',
          priority: (item.priority || 'ROUTINE') as any,
          status: (item.status === 'DISPENSED' ? 'DISPENSED' : item.status === 'CANCELLED' ? 'CANCELLED' : 'READY_FOR_DISPENSING') as any,
          prescriptionType: 'OUTPATIENT',
          items: (item.items || []).map((it: any) => ({
            id: it.id || crypto.randomUUID(),
            prescriptionId: item.id || item.prescriptionId,
            medicationId: it.medicationId || '00000000-0000-4000-8000-000000000001',
            medicationName: it.medicationName || 'Medication',
            genericName: it.genericName || it.medicationName || 'Generic',
            strength: it.strength || '500mg',
            dosageForm: it.dosageForm || 'TABLET',
            prescribedQuantity: it.prescribedQuantity || 10,
            unit: it.unit || 'TAB',
            dosage: it.dosage || '1 tab',
            frequency: it.frequency || '1-0-1',
            route: it.route || 'ORAL',
            duration: typeof it.duration === 'number' ? it.duration : 5,
            durationUnit: 'DAYS',
            prn: false,
            substitutionAllowed: true,
            fulfillmentStatus: (it.fulfillmentStatus || 'PENDING') as any,
            dispensedQuantity: it.dispensedQuantity || 0,
            remainingQuantity: (it.prescribedQuantity || 10) - (it.dispensedQuantity || 0),
            instructions: it.instructions || '',
            createdAt: item.prescribedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })),
          prescribedAt: item.prescribedAt || new Date().toISOString(),
          createdAt: item.prescribedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const idx = this.prescriptions.findIndex((p) => p.id === mapped.id);
        if (idx >= 0) {
          this.prescriptions[idx] = mapped;
        } else {
          this.prescriptions.push(mapped);
        }
        return mapped;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
    }
    return this.prescriptions.find((p) => p.id === prescriptionId && p.tenantId === tenantId) || null;
  }

  async verifyPrescription(req: VerifyPrescriptionRequest): Promise<PharmacyPrescriptionDto> {
    const rx = this.prescriptions.find((p) => p.id === req.prescriptionId && p.tenantId === req.tenantId);
    if (!rx) throw new Error('Prescription order not found');

    const previousSnapshot = { ...rx };
    const now = new Date().toISOString();
    rx.status = 'READY_FOR_DISPENSING';
    rx.verifiedByPharmacistId = req.pharmacistId;
    rx.verifiedByPharmacistName = req.pharmacistName;
    rx.verifiedAt = now;
    rx.verificationNotes = req.verificationNotes;
    rx.updatedAt = now;

    this.recordAudit(req.tenantId, rx.partnerId, rx.organizationId, rx.branchId, req.actorId, req.actorRole, 'PRESCRIPTION_VERIFIED_BY_PHARMACIST', 'PHARMACY_PRESCRIPTION', rx.id, req.justification, previousSnapshot as unknown as Record<string, unknown>, rx as unknown as Record<string, unknown>, rx.id, rx.patientId);

    return rx;
  }

  async reserveStock(req: ReserveStockRequest): Promise<PharmacyPrescriptionDto> {
    const rx = this.prescriptions.find((p) => p.id === req.prescriptionId && p.tenantId === req.tenantId);
    if (!rx) throw new Error('Prescription order not found');

    const item = rx.items.find((i) => i.id === req.prescriptionItemId);
    if (!item) throw new Error('Prescription item not found');

    const batch = this.batches.find((b) => b.id === req.batchId);
    if (!batch) throw new Error('Batch not found');
    if (batch.availableQuantity < req.quantity) throw new Error('Insufficient batch stock for reservation');

    batch.availableQuantity -= req.quantity;
    batch.reservedQuantity += req.quantity;
    item.fulfillmentStatus = 'RESERVED';
    rx.status = 'STOCK_RESERVED';
    rx.updatedAt = new Date().toISOString();

    return rx;
  }

  async dispenseMedication(req: DispenseMedicationRequest): Promise<PharmacyDispensingDto> {
    try {
      const res = await apiRequest<PharmacyDispensingDto>('/api/v1/partner/pharmacy/dispense', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.dispensing.unshift(res.data);
        saveStored("docsearch_pharmacy_dispensing", this.dispensing);
        return res.data;
      }
      if (!isMockFallbackAllowed() && res.error) {
        throw new Error(res.error.message || 'Failed to dispense medication on server');
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    const rx = this.prescriptions.find((p) => p.id === req.prescriptionId && p.tenantId === req.tenantId);
    if (!rx) throw new Error('Prescription order not found');

    const now = new Date().toISOString();
    const dispensingId = crypto.randomUUID();
    const dispensingNumber = `DSP-2026-${String(this.dispensing.length + 1).padStart(6, '0')}`;

    const dispensingItems = req.items.map((itemReq) => {
      const rxItem = rx.items.find((i) => i.id === itemReq.prescriptionItemId);
      if (!rxItem) throw new Error(`Prescription item ${itemReq.prescriptionItemId} not found`);

      const batch = this.batches.find((b) => b.id === itemReq.batchId);
      if (!batch) throw new Error(`Batch ${itemReq.batchId} not found`);
      if (batch.availableQuantity < itemReq.quantity && batch.reservedQuantity < itemReq.quantity) {
        throw new Error(`Insufficient batch available stock for ${rxItem.medicationName}`);
      }

      // Deduct from batch
      const beforeQty = batch.availableQuantity;
      if (batch.reservedQuantity >= itemReq.quantity) {
        batch.reservedQuantity -= itemReq.quantity;
      } else {
        batch.availableQuantity -= itemReq.quantity;
      }
      const afterQty = batch.availableQuantity;

      // Update Inventory
      const inv = this.inventory.find((i) => i.medicationId === itemReq.medicationId && i.branchId === req.branchId);
      if (inv) {
        inv.availableQuantity = Math.max(0, inv.availableQuantity - itemReq.quantity);
        inv.lastStockMovementAt = now;
      }

      // Record Stock Movement Ledger
      this.movements.unshift({
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId: req.partnerId,
        organizationId: req.organizationId,
        branchId: req.branchId,
        medicationId: itemReq.medicationId,
        medicationName: rxItem.medicationName,
        batchId: itemReq.batchId,
        batchNumber: batch.batchNumber,
        movementType: 'DISPENSE',
        quantity: -itemReq.quantity,
        beforeQuantity: beforeQty,
        afterQuantity: afterQty,
        actorId: req.actorId,
        actorRole: req.actorRole,
        reason: `Prescription fulfillment: ${rx.prescriptionNumber}`,
        correlationId: `CORR-DSP-${dispensingNumber}`,
        referenceType: 'DISPENSING',
        referenceId: dispensingNumber,
        occurredAt: now
      });

      // Update prescription item fulfilled amounts
      rxItem.dispensedQuantity += itemReq.quantity;
      rxItem.remainingQuantity = Math.max(0, rxItem.prescribedQuantity - rxItem.dispensedQuantity);
      rxItem.fulfillmentStatus = rxItem.remainingQuantity === 0 ? 'FULFILLED' : 'PARTIALLY_DISPENSED';

      return {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        dispensingId,
        prescriptionItemId: itemReq.prescriptionItemId,
        medicationId: itemReq.medicationId,
        medicationName: rxItem.medicationName,
        batchId: itemReq.batchId,
        batchNumber: batch.batchNumber,
        quantity: itemReq.quantity,
        unit: rxItem.unit,
        dosageInstructions: itemReq.dosageInstructions,
        isSubstituted: itemReq.isSubstituted,
        substitutedMedicationId: itemReq.substitutedMedicationId,
        pharmacistNotes: itemReq.pharmacistNotes,
        createdAt: now,
        updatedAt: now
      };
    });

    // Check overall prescription completion
    const allFulfilled = rx.items.every((i) => i.fulfillmentStatus === 'FULFILLED');
    rx.status = allFulfilled ? 'COMPLETED' : 'PARTIALLY_DISPENSED';
    rx.updatedAt = now;

    const dispensingRecord: PharmacyDispensingDto = {
      id: dispensingId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      dispensingNumber,
      prescriptionId: req.prescriptionId,
      prescriptionNumber: rx.prescriptionNumber,
      patientId: req.patientId,
      patientName: rx.patientName,
      patientMrn: rx.patientMrn,
      pharmacistId: req.pharmacistId,
      pharmacistName: req.pharmacistName,
      dispensingStatus: allFulfilled ? 'DISPENSED' : 'PARTIALLY_DISPENSED',
      dispensingMode: req.dispensingMode,
      counselingProvided: req.counselingProvided,
      counselingNotes: req.counselingNotes,
      items: dispensingItems,
      dispensedAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.dispensing.unshift(dispensingRecord);
    saveStored("docsearch_pharmacy_batches", this.batches);
    saveStored("docsearch_pharmacy_inventory", this.inventory);
    saveStored("docsearch_pharmacy_prescriptions", this.prescriptions);
    saveStored("docsearch_pharmacy_dispensing", this.dispensing);
    this.recordAudit(req.tenantId, req.partnerId, req.organizationId, req.branchId, req.actorId, req.actorRole, allFulfilled ? 'MEDICATION_DISPENSED' : 'PARTIAL_DISPENSING_COMMITTED', 'PHARMACY_DISPENSING', dispensingId, req.justification, undefined, dispensingRecord as unknown as Record<string, unknown>, rx.id, rx.patientId);

    return dispensingRecord;
  }

  async partialDispenseMedication(req: PartialDispenseMedicationRequest): Promise<PharmacyDispensingDto> {
    return this.dispenseMedication({
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      prescriptionId: req.prescriptionId,
      patientId: req.patientId,
      pharmacistId: req.pharmacistId,
      pharmacistName: req.pharmacistName,
      dispensingMode: req.dispensingMode,
      counselingProvided: req.counselingProvided,
      counselingNotes: `${req.counselingNotes || ''} [Partial Reason: ${req.partialFulfillmentReason}]`.trim(),
      items: req.items,
      actorId: req.actorId,
      actorRole: req.actorRole,
      justification: req.justification
    });
  }

  async getInventory(tenantId: string, branchId?: string): Promise<PharmacyInventoryDto[]> {
    try {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
      const res = await apiRequest<PharmacyInventoryDto[]>(`/api/v1/partner/pharmacy/inventory${q}`);
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    if (isMockFallbackAllowed()) {
      let result = this.inventory.filter((i) => !tenantId || tenantId === 'default' || i.tenantId === tenantId || i.tenantId === MOCK_TENANT_ID);
      if (result.length === 0 && this.inventory.length > 0) result = this.inventory;
      if (branchId) result = result.filter((i) => !i.branchId || i.branchId === branchId);
      return result;
    }
    return [];
  }

  async getBatches(tenantId: string, branchId?: string, medicationId?: string): Promise<PharmacyBatchDto[]> {
    try {
      const query = new URLSearchParams();
      if (medicationId) query.set('medicationId', medicationId);
      if (branchId) query.set('branchId', branchId);
      const q = query.toString() ? `?${query.toString()}` : '';
      const res = await apiRequest<PharmacyBatchDto[]>(`/api/v1/partner/pharmacy/batches${q}`);
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    if (isMockFallbackAllowed()) {
      let result = this.batches.filter((b) => !tenantId || tenantId === 'default' || b.tenantId === tenantId || b.tenantId === MOCK_TENANT_ID);
      if (result.length === 0 && this.batches.length > 0) result = this.batches;
      if (branchId) result = result.filter((b) => !b.branchId || b.branchId === branchId);
      if (medicationId) result = result.filter((b) => b.medicationId === medicationId);
      return result;
    }
    return [];
  }

  async receiveStock(req: ReceiveStockRequest): Promise<PharmacyBatchDto> {
    try {
      const res = await apiRequest<PharmacyBatchDto>('/api/v1/partner/pharmacy/batches/receive-stock', {
        method: 'POST',
        body: JSON.stringify({
          ...req,
          quantity: req.receivedQuantity ?? (req as any).quantity,
          receivedQuantity: req.receivedQuantity ?? (req as any).quantity,
          unitCost: req.unitCost ?? (req as any).unitCostPrice ?? 0,
          unitCostPrice: req.unitCost ?? (req as any).unitCostPrice ?? 0,
          manufacturer: req.manufacturer || 'Standard Pharma',
          manufacturingDate: req.manufacturingDate || '2026-01-01'
        })
      });
      if (res.success && res.data) {
        this.batches.unshift(res.data);
        saveStored("docsearch_pharmacy_batches", this.batches);
        return res.data;
      }
      if (!isMockFallbackAllowed() && res.error) {
        throw new Error(res.error.message || 'Failed to receive stock on server');
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    const now = new Date().toISOString();
    const batchId = crypto.randomUUID();
    const med = this.catalog.find((m) => m.id === req.medicationId);
    const medName = med ? `${med.genericName} (${med.strength})` : 'Catalog Item';

    // Calculate days to expiry
    const expDate = new Date(req.expiryDate);
    const diffTime = expDate.getTime() - new Date().getTime();
    const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const newBatch: PharmacyBatchDto = {
      id: batchId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      medicationId: req.medicationId,
      medicationCode: med?.medicationCode || 'MED-GEN',
      medicationName: medName,
      batchNumber: req.batchNumber,
      manufacturer: req.manufacturer,
      manufacturingDate: req.manufacturingDate,
      expiryDate: req.expiryDate,
      receivedQuantity: req.receivedQuantity,
      availableQuantity: req.receivedQuantity,
      reservedQuantity: 0,
      unitCost: req.unitCost,
      purchaseReference: req.purchaseReference,
      supplierReference: req.supplierReference,
      status: daysToExpiry <= 0 ? 'EXPIRED' : daysToExpiry <= 60 ? 'NEAR_EXPIRY' : 'ACTIVE',
      daysToExpiry,
      createdAt: now,
      updatedAt: now
    };

    this.batches.unshift(newBatch);

    // Update aggregated branch inventory
    let inv = this.inventory.find((i) => i.medicationId === req.medicationId && i.branchId === req.branchId);
    if (!inv && med) {
      inv = {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId: req.partnerId,
        organizationId: req.organizationId,
        branchId: req.branchId,
        medicationId: req.medicationId,
        medicationCode: med.medicationCode,
        genericName: med.genericName,
        brandName: med.brandName,
        strength: med.strength,
        dosageForm: med.dosageForm,
        category: med.category,
        controlledMedication: med.controlledMedication,
        availableQuantity: req.receivedQuantity,
        reservedQuantity: 0,
        damagedQuantity: 0,
        expiredQuantity: 0,
        reorderLevel: 50,
        reorderQuantity: 200,
        isLowStock: req.receivedQuantity <= 50,
        batches: [newBatch],
        lastStockMovementAt: now,
        createdAt: now,
        updatedAt: now
      };
      this.inventory.unshift(inv);
    } else if (inv) {
      inv.availableQuantity += req.receivedQuantity;
      inv.isLowStock = inv.availableQuantity <= inv.reorderLevel;
      inv.lastStockMovementAt = now;
      inv.batches.unshift(newBatch);
    }

    // Ledger Movement
    this.movements.unshift({
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      medicationId: req.medicationId,
      medicationName: medName,
      batchId,
      batchNumber: req.batchNumber,
      movementType: 'RECEIPT',
      quantity: req.receivedQuantity,
      beforeQuantity: 0,
      afterQuantity: req.receivedQuantity,
      actorId: req.actorId,
      actorRole: req.actorRole,
      reason: `Stock receipt intake: PO ${req.purchaseReference || 'DIRECT'}`,
      correlationId: `CORR-RCV-${batchId.slice(0, 8)}`,
      referenceType: 'PURCHASE_ORDER',
      referenceId: req.purchaseReference,
      occurredAt: now
    });

    this.recordAudit(req.tenantId, req.partnerId, req.organizationId, req.branchId, req.actorId, req.actorRole, 'STOCK_BATCH_RECEIVED', 'PHARMACY_BATCH', batchId, req.justification, undefined, newBatch as unknown as Record<string, unknown>);

    return newBatch;
  }

  async transferStock(req: TransferStockRequest): Promise<PharmacyBatchDto> {
    const batch = this.batches.find((b) => b.id === req.batchId && b.tenantId === req.tenantId);
    if (!batch) throw new Error('Source batch not found');
    if (batch.availableQuantity < req.quantity) throw new Error('Insufficient stock for branch transfer');

    const now = new Date().toISOString();
    const beforeQty = batch.availableQuantity;
    batch.availableQuantity -= req.quantity;
    batch.updatedAt = now;

    // Movement Out
    this.movements.unshift({
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.sourceBranchId,
      medicationId: req.medicationId,
      medicationName: batch.medicationName,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      movementType: 'TRANSFER_OUT',
      quantity: -req.quantity,
      beforeQuantity: beforeQty,
      afterQuantity: batch.availableQuantity,
      actorId: req.actorId,
      actorRole: req.actorRole,
      reason: `Inter-facility stock transfer to branch ${req.destinationBranchId}`,
      correlationId: `CORR-XFER-${batch.id.slice(0, 8)}`,
      referenceType: 'STOCK_TRANSFER',
      occurredAt: now
    });

    return batch;
  }

  async blockBatch(req: BlockBatchRequest): Promise<PharmacyBatchDto> {
    const batch = this.batches.find((b) => b.id === req.batchId && b.tenantId === req.tenantId);
    if (!batch) throw new Error('Batch not found');

    const previousSnapshot = { ...batch };
    const now = new Date().toISOString();
    batch.status = 'BLOCKED';
    batch.blockReason = req.blockReason;
    batch.blockedBy = req.actorId;
    batch.blockedAt = now;
    batch.updatedAt = now;

    this.recordAudit(req.tenantId, batch.partnerId, batch.organizationId, batch.branchId, req.actorId, req.actorRole, 'BATCH_QUARANTINE_BLOCKED', 'PHARMACY_BATCH', batch.id, req.justification, previousSnapshot as unknown as Record<string, unknown>, batch as unknown as Record<string, unknown>);

    return batch;
  }

  async unblockBatch(req: UnblockBatchRequest): Promise<PharmacyBatchDto> {
    const batch = this.batches.find((b) => b.id === req.batchId && b.tenantId === req.tenantId);
    if (!batch) throw new Error('Batch not found');

    const previousSnapshot = { ...batch };
    const now = new Date().toISOString();
    batch.status = 'ACTIVE';
    batch.blockReason = undefined;
    batch.blockedBy = undefined;
    batch.blockedAt = undefined;
    batch.updatedAt = now;

    this.recordAudit(req.tenantId, batch.partnerId, batch.organizationId, batch.branchId, req.actorId, req.actorRole, 'BATCH_UNBLOCKED_RELEASED', 'PHARMACY_BATCH', batch.id, req.justification, previousSnapshot as unknown as Record<string, unknown>, batch as unknown as Record<string, unknown>);

    return batch;
  }

  async getStockMovements(tenantId: string, branchId?: string): Promise<typeof MOCK_PHARMACY_STOCK_MOVEMENTS> {
    try {
      const res = await apiRequest<typeof MOCK_PHARMACY_STOCK_MOVEMENTS>('/api/v1/partner/pharmacy/stock-movements');
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    if (isMockFallbackAllowed()) {
      let list = this.movements.filter((m) => m.tenantId === tenantId);
      if (branchId) list = list.filter((m) => m.branchId === branchId);
      return list;
    }
    return [];
  }

  async createReturn(req: CreateReturnRequest): Promise<PharmacyReturnDto> {
    const now = new Date().toISOString();
    const returnId = crypto.randomUUID();
    const returnNumber = `RET-2026-${String(this.returns.length + 1).padStart(6, '0')}`;
    const med = this.catalog.find((m) => m.id === req.medicationId);
    const batch = this.batches.find((b) => b.id === req.batchId);

    const ret: PharmacyReturnDto = {
      id: returnId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      returnNumber,
      dispensingId: req.dispensingId,
      patientId: req.patientId,
      patientName: 'Patient Return',
      patientMrn: 'DS-MRN',
      medicationId: req.medicationId,
      medicationName: med?.genericName || 'Medication Item',
      batchId: req.batchId,
      batchNumber: batch?.batchNumber || 'UNKNOWN-BATCH',
      quantity: req.quantity,
      returnReason: req.returnReason,
      condition: req.condition,
      disposition: req.disposition,
      actorId: req.actorId,
      actorRole: req.actorRole,
      notes: req.notes,
      occurredAt: now
    };

    this.returns.unshift(ret);

    // If restockable, restore batch available qty
    if (req.disposition === 'RESTOCK' && batch) {
      batch.availableQuantity += req.quantity;
      this.movements.unshift({
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId: req.partnerId,
        organizationId: req.organizationId,
        branchId: req.branchId,
        medicationId: req.medicationId,
        medicationName: med?.genericName || 'Medication Item',
        batchId: req.batchId,
        batchNumber: batch.batchNumber,
        movementType: 'RETURN',
        quantity: req.quantity,
        beforeQuantity: batch.availableQuantity - req.quantity,
        afterQuantity: batch.availableQuantity,
        actorId: req.actorId,
        actorRole: req.actorRole,
        reason: `Restocked medication return: ${returnNumber}`,
        correlationId: `CORR-RET-${returnId.slice(0, 8)}`,
        referenceType: 'RETURN',
        referenceId: returnNumber,
        occurredAt: now
      });
    }

    this.recordAudit(req.tenantId, req.partnerId, req.organizationId, req.branchId, req.actorId, req.actorRole, 'MEDICATION_RETURN_LOGGED', 'PHARMACY_RETURN', returnId, req.justification, undefined, ret as unknown as Record<string, unknown>, undefined, req.patientId);

    return ret;
  }

  async getReturns(tenantId: string, branchId?: string): Promise<PharmacyReturnDto[]> {
    let list = this.returns.filter((r) => r.tenantId === tenantId);
    if (branchId) list = list.filter((r) => r.branchId === branchId);
    return list;
  }

  async createStockAdjustment(req: CreateStockAdjustmentRequest): Promise<PharmacyStockAdjustmentDto> {
    const batch = this.batches.find((b) => b.id === req.batchId && b.tenantId === req.tenantId);
    if (!batch) throw new Error('Batch not found for adjustment');

    const now = new Date().toISOString();
    const adjustmentId = crypto.randomUUID();
    const adjustmentNumber = `ADJ-2026-${String(this.adjustments.length + 1).padStart(6, '0')}`;
    const beforeQty = batch.availableQuantity;
    const afterQty = Math.max(0, beforeQty + req.adjustmentQuantity);

    batch.availableQuantity = afterQty;
    batch.updatedAt = now;

    const adj: PharmacyStockAdjustmentDto = {
      id: adjustmentId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      adjustmentNumber,
      medicationId: req.medicationId,
      medicationName: batch.medicationName,
      batchId: req.batchId,
      batchNumber: batch.batchNumber,
      reason: req.reason,
      justification: req.justification,
      beforeQuantity: beforeQty,
      adjustmentQuantity: req.adjustmentQuantity,
      afterQuantity: afterQty,
      actorId: req.actorId,
      actorRole: req.actorRole,
      occurredAt: now
    };

    this.adjustments.unshift(adj);

    // Record Ledger Movement
    this.movements.unshift({
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      medicationId: req.medicationId,
      medicationName: batch.medicationName,
      batchId: req.batchId,
      batchNumber: batch.batchNumber,
      movementType: 'ADJUSTMENT',
      quantity: req.adjustmentQuantity,
      beforeQuantity: beforeQty,
      afterQuantity: afterQty,
      actorId: req.actorId,
      actorRole: req.actorRole,
      reason: `Stock adjustment: ${req.reason} (${req.justification})`,
      correlationId: `CORR-ADJ-${adjustmentId.slice(0, 8)}`,
      referenceType: 'STOCK_ADJUSTMENT',
      referenceId: adjustmentNumber,
      occurredAt: now
    });

    this.recordAudit(req.tenantId, req.partnerId, req.organizationId, req.branchId, req.actorId, req.actorRole, 'STOCK_ADJUSTMENT_EXECUTED', 'PHARMACY_STOCK_ADJUSTMENT', adjustmentId, req.justification, { beforeQuantity: beforeQty }, adj as unknown as Record<string, unknown>);

    return adj;
  }

  async getAdjustments(tenantId: string, branchId?: string): Promise<PharmacyStockAdjustmentDto[]> {
    let list = this.adjustments.filter((a) => a.tenantId === tenantId);
    if (branchId) list = list.filter((a) => a.branchId === branchId);
    return list;
  }

  async createSubstitutionRequest(req: CreateSubstitutionRequest): Promise<PharmacySubstitutionRequestDto> {
    const rx = this.prescriptions.find((p) => p.id === req.prescriptionId && p.tenantId === req.tenantId);
    if (!rx) throw new Error('Prescription order not found');

    const origMed = this.catalog.find((m) => m.id === req.originalMedicationId);
    const reqMed = this.catalog.find((m) => m.id === req.requestedMedicationId);
    const now = new Date().toISOString();
    const subId = crypto.randomUUID();

    const sub: PharmacySubstitutionRequestDto = {
      id: subId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      prescriptionId: req.prescriptionId,
      prescriptionNumber: rx.prescriptionNumber,
      prescriptionItemId: req.prescriptionItemId,
      originalMedicationId: req.originalMedicationId,
      originalMedicationName: origMed?.genericName || 'Original Medication',
      requestedMedicationId: req.requestedMedicationId,
      requestedMedicationName: reqMed?.genericName || 'Requested Substitute',
      reason: req.reason,
      justification: req.justification,
      pharmacistId: req.pharmacistId,
      pharmacistName: req.pharmacistName,
      doctorApprovalRequired: req.doctorApprovalRequired,
      status: 'PENDING_APPROVAL',
      createdAt: now,
      updatedAt: now
    };

    this.substitutions.unshift(sub);
    rx.status = 'UNDER_REVIEW';

    this.recordAudit(req.tenantId, req.partnerId, req.organizationId, req.branchId, req.actorId, req.actorRole, 'SUBSTITUTION_REQUESTED', 'PHARMACY_SUBSTITUTION', subId, req.justification, undefined, sub as unknown as Record<string, unknown>, rx.id, rx.patientId);

    return sub;
  }

  async approveSubstitution(req: ApproveSubstitutionRequest): Promise<PharmacySubstitutionRequestDto> {
    const sub = this.substitutions.find((s) => s.id === req.requestId && s.tenantId === req.tenantId);
    if (!sub) throw new Error('Substitution request not found');

    const now = new Date().toISOString();
    sub.status = 'APPROVED';
    sub.approvedByDoctorId = req.approvedByDoctorId;
    sub.approvedByDoctorName = req.approvedByDoctorName;
    sub.approvalNotes = req.approvalNotes;
    sub.actionedAt = now;
    sub.updatedAt = now;

    // Update prescription item medication reference
    const rx = this.prescriptions.find((p) => p.id === sub.prescriptionId);
    if (rx) {
      const item = rx.items.find((i) => i.id === sub.prescriptionItemId);
      if (item) {
        item.medicationId = sub.requestedMedicationId;
        item.medicationName = sub.requestedMedicationName;
        item.substitutionReason = sub.reason;
      }
      rx.status = 'READY_FOR_DISPENSING';
    }

    this.recordAudit(req.tenantId, sub.partnerId, sub.organizationId, sub.branchId, req.actorId, req.actorRole, 'SUBSTITUTION_APPROVED_BY_PHYSICIAN', 'PHARMACY_SUBSTITUTION', sub.id, req.justification, undefined, sub as unknown as Record<string, unknown>);

    return sub;
  }

  async rejectSubstitution(req: RejectSubstitutionRequest): Promise<PharmacySubstitutionRequestDto> {
    const sub = this.substitutions.find((s) => s.id === req.requestId && s.tenantId === req.tenantId);
    if (!sub) throw new Error('Substitution request not found');

    const now = new Date().toISOString();
    sub.status = 'REJECTED';
    sub.approvedByDoctorId = req.rejectedByDoctorId;
    sub.approvalNotes = req.rejectionReason;
    sub.actionedAt = now;
    sub.updatedAt = now;

    this.recordAudit(req.tenantId, sub.partnerId, sub.organizationId, sub.branchId, req.actorId, req.actorRole, 'SUBSTITUTION_REJECTED_BY_PHYSICIAN', 'PHARMACY_SUBSTITUTION', sub.id, req.justification, undefined, sub as unknown as Record<string, unknown>);

    return sub;
  }

  async getSubstitutionRequests(tenantId: string, branchId?: string): Promise<PharmacySubstitutionRequestDto[]> {
    let list = this.substitutions.filter((s) => s.tenantId === tenantId);
    if (branchId) list = list.filter((s) => s.branchId === branchId);
    return list;
  }

  async getPatientMedicationHistory(tenantId: string, patientId: string): Promise<{ prescriptions: PharmacyPrescriptionDto[]; dispensing: PharmacyDispensingDto[] }> {
    try {
      const res = await apiRequest<{ prescriptions: PharmacyPrescriptionDto[]; dispensing: PharmacyDispensingDto[] }>(`/api/v1/partner/patients/${encodeURIComponent(patientId)}/medication-history`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    const rxList = this.prescriptions.filter((p) => p.patientId === patientId && p.tenantId === tenantId);
    const dispList = this.dispensing.filter((d) => d.patientId === patientId && d.tenantId === tenantId);
    return { prescriptions: rxList, dispensing: dispList };
  }

  async getAuditTraces(req: QueryPharmacyAuditRequest): Promise<PharmacyAuditTraceDto[]> {
    let list = this.audits.filter((a) => a.tenantId === req.tenantId);
    if (req.branchId) list = list.filter((a) => a.branchId === req.branchId);
    if (req.prescriptionId) list = list.filter((a) => a.prescriptionId === req.prescriptionId);
    if (req.patientId) list = list.filter((a) => a.patientId === req.patientId);
    if (req.action) list = list.filter((a) => a.action === req.action);
    return list;
  }

  async cancelPrescription(req: CancelPrescriptionRequest): Promise<PharmacyPrescriptionDto> {
    const rx = this.prescriptions.find((p) => p.id === req.prescriptionId && p.tenantId === req.tenantId);
    if (!rx) throw new Error('Prescription order not found');

    const previousSnapshot = { ...rx };
    const now = new Date().toISOString();
    rx.status = 'CANCELLED';
    rx.cancellationReason = req.cancellationReason;
    rx.cancelledBy = req.actorId;
    rx.cancelledAt = now;
    rx.updatedAt = now;

    this.recordAudit(req.tenantId, rx.partnerId, rx.organizationId, rx.branchId, req.actorId, req.actorRole, 'PRESCRIPTION_CANCELLED', 'PHARMACY_PRESCRIPTION', rx.id, req.justification, previousSnapshot as unknown as Record<string, unknown>, rx as unknown as Record<string, unknown>, rx.id, rx.patientId);

    return rx;
  }

  async reverseDispensing(req: ReverseDispensingRequest): Promise<PharmacyDispensingDto> {
    const disp = this.dispensing.find((d) => d.id === req.dispensingId && d.tenantId === req.tenantId);
    if (!disp) throw new Error('Dispensing transaction not found');

    const previousSnapshot = { ...disp };
    const now = new Date().toISOString();
    disp.dispensingStatus = 'REVERSED';
    disp.reversalReason = req.reversalReason;
    disp.reversedBy = req.actorId;
    disp.reversedAt = now;
    disp.updatedAt = now;

    // Restore stock to batches
    for (const item of disp.items) {
      const batch = this.batches.find((b) => b.id === item.batchId);
      if (batch) {
        batch.availableQuantity += item.quantity;
        this.movements.unshift({
          id: crypto.randomUUID(),
          tenantId: req.tenantId,
          partnerId: disp.partnerId,
          organizationId: disp.organizationId,
          branchId: disp.branchId,
          medicationId: item.medicationId,
          medicationName: item.medicationName,
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          movementType: 'REVERSAL',
          quantity: item.quantity,
          beforeQuantity: batch.availableQuantity - item.quantity,
          afterQuantity: batch.availableQuantity,
          actorId: req.actorId,
          actorRole: req.actorRole,
          reason: `Dispensing reversal: ${req.reversalReason}`,
          correlationId: `CORR-REV-${disp.id.slice(0, 8)}`,
          referenceType: 'DISPENSING',
          referenceId: disp.dispensingNumber,
          occurredAt: now
        });
      }
    }

    this.recordAudit(req.tenantId, disp.partnerId, disp.organizationId, disp.branchId, req.actorId, req.actorRole, 'DISPENSING_REVERSED', 'PHARMACY_DISPENSING', disp.id, req.justification, previousSnapshot as unknown as Record<string, unknown>, disp as unknown as Record<string, unknown>, disp.prescriptionId, disp.patientId);

    return disp;
  }

  private recordAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string,
    branchId: string | undefined,
    actorId: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    targetEntityId: string,
    justification: string,
    previousSnapshot?: Record<string, unknown>,
    newSnapshot?: Record<string, unknown>,
    prescriptionId?: string,
    patientId?: string
  ): void {
    const traceId = `TRC-PHARM-2026-${String(this.audits.length + 1).padStart(6, '0')}`;
    this.audits.unshift({
      id: crypto.randomUUID(),
      tenantId,
      partnerId,
      organizationId,
      branchId,
      traceId,
      correlationId: `CORR-${crypto.randomUUID().slice(0, 8)}`,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetEntityId,
      prescriptionId,
      patientId,
      previousSnapshot,
      newSnapshot,
      justification,
      operationStatus: 'SUCCESS',
      occurredAt: new Date().toISOString()
    });
  }

  async getAllDispensingRecords(tenantId?: string): Promise<PharmacyDispensingDto[]> {
    if (tenantId) {
      return this.dispensing.filter((d) => d.tenantId === tenantId);
    }
    return [...this.dispensing];
  }

  async clearPharmacyData(_tenantId?: string): Promise<void> {
    this.batches = [];
    this.inventory = [];
    this.dispensing = [];
    this.prescriptions = [];

    if (typeof window !== 'undefined') {
      const keysToPurge = [
        'docsearch_pharmacy_invoices',
        'docsearch_pharmacy_galla_handovers',
        'docsearch_schedule_h1_records',
        'docsearch_cdsco_audit_records',
        'docsearch_cdsco_controlled_records',
        'docsearch_cdsco_frequent_doctors',
        'docsearch_pending_doctor_prescriptions',
        'docsearch_pharmacy_pos_draft',
        'docsearch_pharmacy_sales_history',
        'docsearch_pharmacy_batches',
        'docsearch_pharmacy_inventory',
        'docsearch_pharmacy_dispensing',
        'docsearch_pharmacy_offline_queue',
        'docsearch_offline_invoices_backup',
        'docsearch_simulate_offline_mode',
        'docsearch_wholesale_inward_history',
        'docsearch_wholesale_shortfalls',
        'docsearch_pharmacy_catalog',
        'docsearch_pharmacy_movements'
      ];
      for (const k of keysToPurge) {
        try {
          window.localStorage.removeItem(k);
        } catch {}
      }

      try {
        await pharmacyOfflineStorageService.clearAllOfflineData();
      } catch {}

      try {
        pharmacyRevenueGallaService.clearAll();
      } catch {}

      try {
        cdscoInspectionAuditService.clearAll();
      } catch {}

      window.dispatchEvent(new Event('docsearch_billing_updated'));
      window.dispatchEvent(new Event('docsearch_galla_updated'));
      window.dispatchEvent(new Event('docsearch_prescriptions_updated'));
      window.dispatchEvent(new Event('docsearch_cdsco_updated'));
      window.dispatchEvent(new Event('docsearch_inventory_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  }

  async resetToCleanFormulary(_tenantId?: string): Promise<void> {
    this.batches = [...MOCK_PHARMACY_BATCHES];
    this.inventory = [...MOCK_PHARMACY_INVENTORY];
    this.dispensing = [...MOCK_PHARMACY_DISPENSING];
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
    try {
      const res = await apiRequest<any>('/api/v1/partner/pharmacy/invoices/ingest-wholesale', {
        method: 'POST',
        body: JSON.stringify({
          rawContent: typeof params.invoice === 'string' ? params.invoice : JSON.stringify(params.invoice),
          partnerId: params.partnerId,
          organizationId: params.organizationId,
          branchId: params.branchId
        })
      });
      if (!res.success && !isMockFallbackAllowed() && res.error) {
        throw new Error(res.error.message || 'Failed to ingest wholesale invoice on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Wholesale invoice ingestion network error');
      }
    }

    const inv = params.invoice;
    const now = new Date().toISOString();
    const grnNumber = inv?.grnNumber || `GRN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    let count = 0;

    if (inv && Array.isArray(inv.items)) {
      for (const item of inv.items) {
        // 1. Resolve item attributes
        const rawBrand = item.matchedBrandName || item.rawItemDescription || 'Medicine';
        const brandName = String(rawBrand).trim();
        const genericName = item.genericName || brandName;
        const batchNumber = String(item.batchNumber || `BTH-${Date.now()}-${count + 1}`).trim();
        const expiryDate = item.expiryDate || '2028-12-31';

        // Accepted quantity is the good quantity entering inventory (received - damaged)
        const billed = Number(item.billedQuantity || 0);
        const free = Number(item.freeQuantity || 0);
        const expected = Number(item.expectedQuantity ?? (billed + free));
        const received = Number(item.receivedQuantity ?? expected);
        const damaged = Number(item.damagedQuantity || 0);
        const acceptedQty = Number(item.acceptedQuantity ?? Math.max(0, received - damaged));

        // Skip items where accepted quantity is 0 (all damaged or short)
        if (acceptedQty <= 0) continue;

        const unitCost = Number(item.unitCostPtr ?? item.effectiveUnitCost ?? 50);
        const hsnCode = item.hsnCode || '30049099';
        const dosageForm = item.dosageForm || (brandName.toLowerCase().includes('syrup') ? 'SYRUP' : brandName.toLowerCase().includes('inj') ? 'INJECTION' : 'TABLET');
        const manufacturer = item.manufacturer || inv.distributorName || 'Pharma Stockist';

        // 2. Resolve or create medication in this.catalog
        let med = this.catalog.find(
          (m) =>
            m.tenantId === params.tenantId &&
            (m.brandName.toLowerCase() === brandName.toLowerCase() || m.id === item.matchedMedicationId)
        );

        if (!med) {
          const newMed: MedicationCatalogDto = {
            id: item.matchedMedicationId || `med-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'item'}`,
            tenantId: params.tenantId,
            partnerId: params.partnerId,
            organizationId: params.organizationId,
            branchId: params.branchId,
            medicationCode: `MED-${hsnCode.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
            genericName: genericName,
            brandName: brandName,
            strength: item.packConfiguration || 'Standard Dosage',
            dosageForm: dosageForm,
            route: dosageForm === 'INJECTION' ? 'INTRAVENOUS' : 'ORAL',
            packSize: item.packUnits || 10,
            unitOfMeasure: 'PACK',
            manufacturer: manufacturer,
            category: 'GENERAL',
            controlledMedication: false,
            prescriptionRequired: false,
            status: 'ACTIVE',
            therapeuticClass: 'Wholesale Formulary',
            storageConditions: 'Store below 25°C in a dry place',
            variants: [],
            createdAt: now,
            updatedAt: now
          };
          this.catalog.unshift(newMed);
          med = newMed;
        }

        const currentMed: MedicationCatalogDto = med;

        // 3. Compute days to expiry
        const expDateObj = new Date(expiryDate);
        const daysToExpiry = isNaN(expDateObj.getTime())
          ? 365
          : Math.ceil((expDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // 4. Create or increment batch in this.batches
        const existingBatch = this.batches.find(
          (b) =>
            b.tenantId === params.tenantId &&
            b.batchNumber.toLowerCase() === batchNumber.toLowerCase() &&
            (b.medicationId === currentMed.id || b.medicationName.toLowerCase().includes(brandName.toLowerCase()))
        );

        if (existingBatch) {
          existingBatch.receivedQuantity = (existingBatch.receivedQuantity || 0) + acceptedQty;
          existingBatch.availableQuantity = (existingBatch.availableQuantity || 0) + acceptedQty;
          existingBatch.unitCost = String(unitCost);
          existingBatch.expiryDate = expiryDate;
          existingBatch.daysToExpiry = daysToExpiry;
          existingBatch.status = daysToExpiry < 0 ? 'EXPIRED' : 'ACTIVE';
          existingBatch.updatedAt = now;
        } else {
          const batchId = `batch-${batchNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${count}`;
          const newBatch: PharmacyBatchDto = {
            id: batchId,
            tenantId: params.tenantId,
            partnerId: params.partnerId,
            organizationId: params.organizationId,
            branchId: params.branchId,
            medicationId: currentMed.id,
            medicationCode: currentMed.medicationCode,
            medicationName: `${currentMed.brandName} (${currentMed.genericName})`,
            batchNumber: batchNumber,
            manufacturer: manufacturer,
            manufacturingDate: '2024-01-01',
            expiryDate: expiryDate,
            receivedQuantity: acceptedQty,
            availableQuantity: acceptedQty,
            reservedQuantity: 0,
            unitCost: String(unitCost),
            daysToExpiry: daysToExpiry,
            status: daysToExpiry < 0 ? 'EXPIRED' : 'ACTIVE',
            createdAt: now,
            updatedAt: now
          };
          this.batches.unshift(newBatch);
        }

        // 5. Update or create inventory in this.inventory
        const existingInv = this.inventory.find(
          (i) =>
            i.tenantId === params.tenantId &&
            (i.medicationId === currentMed.id || i.medicationCode === currentMed.medicationCode)
        );

        if (existingInv) {
          existingInv.availableQuantity = (existingInv.availableQuantity || 0) + acceptedQty;
          existingInv.isLowStock = existingInv.availableQuantity <= (existingInv.reorderLevel || 20);
          existingInv.lastStockMovementAt = now;
          existingInv.updatedAt = now;
        } else {
          const newInv: PharmacyInventoryDto = {
            id: `inv-${currentMed.id}-${Date.now()}`,
            tenantId: params.tenantId,
            partnerId: params.partnerId,
            organizationId: params.organizationId,
            branchId: params.branchId,
            medicationId: currentMed.id,
            medicationCode: currentMed.medicationCode,
            genericName: currentMed.genericName,
            brandName: currentMed.brandName,
            strength: currentMed.strength,
            dosageForm: currentMed.dosageForm,
            category: currentMed.category,
            controlledMedication: currentMed.controlledMedication,
            availableQuantity: acceptedQty,
            reservedQuantity: 0,
            damagedQuantity: 0,
            expiredQuantity: 0,
            reorderLevel: 20,
            reorderQuantity: 50,
            isLowStock: false,
            batches: [],
            lastStockMovementAt: now,
            createdAt: now,
            updatedAt: now
          };
          this.inventory.unshift(newInv);
        }

        // 6. Record Stock Movement Ledger
        this.movements.unshift({
          id: `mov-inward-${Date.now()}-${count}`,
          tenantId: params.tenantId,
          partnerId: params.partnerId,
          organizationId: params.organizationId,
          branchId: params.branchId,
          medicationId: currentMed.id,
          medicationName: currentMed.brandName,
          batchId: `batch-${batchNumber}`,
          batchNumber: batchNumber,
          movementType: 'RECEIPT',
          quantity: acceptedQty,
          beforeQuantity: 0,
          afterQuantity: acceptedQty,
          actorId: params.actorId,
          actorRole: params.actorRole,
          reason: `Wholesale GRN Inward: ${inv.distributorName} (${inv.invoiceNumber})`,
          correlationId: `CORR-GRN-${grnNumber}`,
          referenceType: 'WHOLESALE_INVOICE',
          referenceId: inv.invoiceNumber,
          occurredAt: now
        } as any);

        count++;
      }
    }

    // 7. Persist to LocalStorage
    saveStored("docsearch_pharmacy_batches", this.batches);
    saveStored("docsearch_pharmacy_inventory", this.inventory);
    saveStored("docsearch_pharmacy_catalog", this.catalog);
    saveStored("docsearch_pharmacy_movements", this.movements);

    // 8. Record Inward Register History & Shortfall Claims
    try {
      const history = loadStored<any>("docsearch_wholesale_inward_history", []);
      history.unshift({
        ...inv,
        grnNumber,
        inwardedAt: now,
        inwardedBy: params.actorId,
        inwardedBatchesCount: count
      });
      saveStored("docsearch_wholesale_inward_history", history);

      const shortfallItems = (inv.items || []).filter(
        (it: any) => (Number(it.shortfallQuantity || 0) > 0 || Number(it.damagedQuantity || 0) > 0)
      );
      if (shortfallItems.length > 0) {
        const shortfalls = loadStored<any>("docsearch_wholesale_shortfalls", []);
        shortfalls.unshift({
          id: `shortfall-${Date.now()}`,
          grnNumber,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          distributorName: inv.distributorName,
          distributorGstin: inv.distributorGstin,
          distributorDlNo: inv.distributorDlNo,
          items: shortfallItems,
          totalClaimAmount: inv.totalShortfallClaimAmount || shortfallItems.reduce((s: number, it: any) => s + (Number(it.claimAmount) || 0), 0),
          createdAt: now,
          status: 'PENDING_CREDIT_NOTE'
        });
        saveStored("docsearch_wholesale_shortfalls", shortfalls);
      }
    } catch {}

    // 9. Update PWA IndexedDB Cache
    try {
      await pharmacyOfflineStorageService.cacheInventorySnapshot(
        this.catalog as any,
        this.batches as any
      );
    } catch {}

    // 10. Attempt Backend Sync
    try {
      await apiRequest('/api/v1/partner/pharmacy/invoices/ingest-wholesale', {
        method: 'POST',
        body: JSON.stringify({
          rawContent: inv.rawInvoiceText || undefined,
          partnerId: params.partnerId,
          organizationId: params.organizationId,
          branchId: params.branchId
        })
      });
    } catch {}

    // 11. Broadcast update events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('docsearch_inventory_updated', { detail: { count, invoiceNumber: inv?.invoiceNumber, grnNumber } }));
      window.dispatchEvent(new CustomEvent('docsearch_batches_updated'));
      window.dispatchEvent(new CustomEvent('docsearch_billing_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      inwardedBatchesCount: count,
      invoiceNumber: inv?.invoiceNumber || `INV-INWARD-${Date.now()}`,
      grnNumber
    };
  }

  async directPosDispense(params: any): Promise<{ success: boolean; dispensingId: string; totalAmount: number }> {
    const dispId = `disp-pos-${Date.now()}`;
    const now = new Date().toISOString();
    let total = 0;

    // 1. Authoritative Backend Database Persistence via PostgreSQL Transaction
    try {
      await apiRequest<any>('/api/v1/partner/pharmacy/dispense', {
        method: 'POST',
        body: JSON.stringify({
          patientId: params.patientId || params.patientPhone || 'WALKIN-PATIENT',
          prescriptionId: params.prescriptionId,
          doctorId: params.doctorId,
          items: params.items.map((i: any) => {
            const packUnits = i.packUnits || 10;
            const decimalQty = i.isLoose ? Math.max(0.01, Math.round((i.quantity / packUnits) * 100) / 100) : i.quantity;
            return {
              medicationId: i.medicationId,
              batchId: i.batchId,
              quantity: decimalQty,
              unitPrice: i.unitPrice
            };
          })
        })
      });
    } catch (apiErr) {
      console.warn('[Pharmacy POS] Backend database sync notice (offline/mock active):', apiErr);
    }

    // 2. Perform accurate fractional stock reduction & ledger updates
    for (const item of params.items) {
      total += item.quantity * item.unitPrice;
      const b = this.batches.find((b) => b.id === item.batchId);
      if (b) {
        const packUnits = item.packUnits || 10;
        const deductQty = item.isLoose ? (item.quantity / packUnits) : item.quantity;
        const beforeQty = b.availableQuantity;
        b.availableQuantity = Math.max(0, Math.round((b.availableQuantity - deductQty) * 100) / 100);
        b.status = b.availableQuantity === 0 ? 'DEPLETED' : b.status;
        b.updatedAt = now;

        // Synchronize catalog inventory level
        const inv = this.inventory.find((i) => i.medicationId === item.medicationId && (!params.branchId || i.branchId === params.branchId));
        if (inv) {
          inv.availableQuantity = Math.max(0, Math.round((inv.availableQuantity - deductQty) * 100) / 100);
          inv.lastStockMovementAt = now;
        }

        // Record stock movement ledger entry
        this.movements.unshift({
          id: crypto.randomUUID(),
          tenantId: params.tenantId || b.tenantId,
          partnerId: params.partnerId || b.partnerId,
          organizationId: params.organizationId || b.organizationId,
          branchId: params.branchId || b.branchId,
          medicationId: item.medicationId,
          medicationName: b.medicationName || 'Medication',
          batchId: item.batchId,
          batchNumber: b.batchNumber,
          movementType: 'DISPENSE',
          quantity: -deductQty,
          beforeQuantity: beforeQty,
          afterQuantity: b.availableQuantity,
          actorId: params.pharmacistName || 'PHARMACIST-POS',
          actorRole: 'PHARMACIST',
          reason: `POS Counter Dispensing ${dispId} (${item.isLoose ? `${item.quantity} loose tabs` : `${item.quantity} packs`})`,
          correlationId: `CORR-POS-${dispId}`,
          referenceType: 'DISPENSING',
          referenceId: dispId,
          occurredAt: now
        });
      }
    }

    // 3. Record in dispensing history
    this.dispensing.unshift({
      id: dispId,
      tenantId: params.tenantId || 'tenant-default',
      partnerId: params.partnerId || 'partner-default',
      organizationId: params.organizationId || 'org-default',
      branchId: params.branchId || 'branch-default',
      dispensingNumber: `DSP-POS-${Math.floor(100000 + Math.random() * 900000)}`,
      prescriptionId: params.prescriptionId || 'WALKIN-RX',
      prescriptionNumber: params.prescriptionId || 'POS-DIRECT-COUNTER',
      patientId: params.patientPhone || 'WALKIN-PATIENT',
      patientName: params.patientName || 'Walk-in Customer',
      patientMrn: params.patientMrn || 'MRN-WALKIN',
      pharmacistId: params.pharmacistName || 'PHARMACIST',
      pharmacistName: params.pharmacistName || 'Registered Pharmacist',
      dispensedAt: now,
      dispensingStatus: 'DISPENSED',
      dispensingMode: 'OUTPATIENT_COUNTER',
      counselingProvided: true,
      counselingNotes: 'Counter dispensing counseling provided on dosage frequency and storage instructions.',
      items: params.items.map((i: any) => ({
        id: crypto.randomUUID(),
        tenantId: params.tenantId || 'tenant-default',
        dispensingId: dispId,
        prescriptionItemId: crypto.randomUUID(),
        medicationId: i.medicationId,
        medicationName: i.medicationName || 'Medicine',
        batchId: i.batchId,
        batchNumber: i.batchNumber || 'BATCH',
        quantity: i.quantity,
        unit: i.isLoose ? 'Tabs' : 'Strip',
        dosageInstructions: i.isLoose ? 'Loose Cut Tablets' : 'Full Strip',
        isSubstituted: Boolean(i.isSubstituted),
        createdAt: now,
        updatedAt: now
      })),
      createdAt: now,
      updatedAt: now
    });

    // 4. Critical: Persist all mutated states to localStorage so F5 refresh has ZERO data loss
    saveStored("docsearch_pharmacy_batches", this.batches);
    saveStored("docsearch_pharmacy_inventory", this.inventory);
    saveStored("docsearch_pharmacy_dispensing", this.dispensing);
    saveStored("docsearch_pharmacy_movements", this.movements);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('docsearch_billing_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      dispensingId: dispId,
      totalAmount: total
    };
  }

  /**
   * DEVELOPMENT/TEST ONLY: Populate realistic mock stock without purchase bills.
   * Creates legitimate batches, stock ledger receipts, and updates inventory.
   * Clearly marked with 'DEVELOPMENT_TEST' marker.
   */
  async seedDevMockStock(params: {
    tenantId: string;
    partnerId: string;
    organizationId: string;
    branchId: string;
    actorId?: string;
    actorRole?: string;
  }): Promise<{ success: boolean; seededCount: number; batches: PharmacyBatchDto[] }> {
    const now = new Date().toISOString();
    const actorId = params.actorId || 'dev-tester@docsearch.local';
    const actorRole = params.actorRole || 'PHARMACIST';

    const DEV_MOCK_ITEMS = [
      {
        name: 'Paracetamol 500 mg',
        generic: 'Paracetamol',
        code: 'TEST-PARA-500',
        batch: 'TEST-PARA-001',
        quantity: 500,
        unit: 'TABLET',
        dosageForm: 'TABLET',
        strength: '500 mg',
        purchasePrice: 1.20,
        sellingPrice: 2.00,
        expiry: '2027-12-31',
        manufacturer: 'TEST-MANUFACTURER',
        category: 'ANALGESIC'
      },
      {
        name: 'Amoxicillin 500 mg',
        generic: 'Amoxicillin',
        code: 'TEST-AMOX-500',
        batch: 'TEST-AMOX-001',
        quantity: 200,
        unit: 'CAPSULE',
        dosageForm: 'CAPSULE',
        strength: '500 mg',
        purchasePrice: 4.00,
        sellingPrice: 6.00,
        expiry: '2027-10-31',
        manufacturer: 'TEST-MANUFACTURER',
        category: 'ANTIBIOTIC'
      },
      {
        name: 'Pantoprazole 40 mg',
        generic: 'Pantoprazole',
        code: 'TEST-PANTO-40',
        batch: 'TEST-PANTO-001',
        quantity: 150,
        unit: 'TABLET',
        dosageForm: 'TABLET',
        strength: '40 mg',
        purchasePrice: 3.00,
        sellingPrice: 5.00,
        expiry: '2028-01-31',
        manufacturer: 'TEST-MANUFACTURER',
        category: 'GASTROINTESTINAL'
      },
      {
        name: 'Azithromycin 500 mg',
        generic: 'Azithromycin',
        code: 'TEST-AZI-500',
        batch: 'TEST-AZI-001',
        quantity: 100,
        unit: 'TABLET',
        dosageForm: 'TABLET',
        strength: '500 mg',
        purchasePrice: 8.00,
        sellingPrice: 12.00,
        expiry: '2027-09-30',
        manufacturer: 'TEST-MANUFACTURER',
        category: 'ANTIBIOTIC'
      },
      {
        name: 'ORS Sachet',
        generic: 'Oral Rehydration Salts',
        code: 'TEST-ORS-SACHET',
        batch: 'TEST-ORS-001',
        quantity: 300,
        unit: 'SACHET',
        dosageForm: 'SACHET',
        strength: 'Standard Formula',
        purchasePrice: 8.00,
        sellingPrice: 12.00,
        expiry: '2028-03-31',
        manufacturer: 'TEST-MANUFACTURER',
        category: 'GENERAL'
      }
    ];

    // 1. Attempt Backend Sync
    try {
      await apiRequest('/api/v1/partner/pharmacy/dev/seed-mock-stock', {
        method: 'POST',
        body: JSON.stringify({
          branchId: params.branchId
        })
      });
    } catch {}

    // 2. Client-side Local State & Offline Cache Synchronization
    const seededBatches: PharmacyBatchDto[] = [];

    for (const item of DEV_MOCK_ITEMS) {
      // Find or create in catalog
      let med = this.catalog.find(
        (m) =>
          m.tenantId === params.tenantId &&
          (m.medicationCode.toLowerCase() === item.code.toLowerCase() ||
           m.genericName.toLowerCase().includes(item.generic.toLowerCase()) ||
           m.brandName.toLowerCase().includes(item.name.toLowerCase()))
      );

      if (!med) {
        const newMed: MedicationCatalogDto = {
          id: `med-${item.code.toLowerCase()}`,
          tenantId: params.tenantId,
          partnerId: params.partnerId,
          organizationId: params.organizationId,
          branchId: params.branchId,
          medicationCode: item.code,
          genericName: item.generic,
          brandName: item.name,
          strength: item.strength,
          dosageForm: (item.dosageForm || 'TABLET') as any,
          route: 'ORAL',
          packSize: 1,
          unitOfMeasure: item.unit,
          manufacturer: item.manufacturer,
          category: (item.category || 'GENERAL') as any,
          controlledMedication: false,
          prescriptionRequired: false,
          status: 'ACTIVE',
          therapeuticClass: 'DEVELOPMENT_TEST',
          storageConditions: 'Store below 25°C',
          variants: [],
          createdAt: now,
          updatedAt: now
        };
        this.catalog.unshift(newMed);
        med = newMed;
      }

      const currentMed: MedicationCatalogDto = med;
      const expDateObj = new Date(item.expiry);
      const daysToExpiry = Math.ceil((expDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Check existing batch
      let existingBatch = this.batches.find(
        (b) =>
          b.tenantId === params.tenantId &&
          b.batchNumber.toLowerCase() === item.batch.toLowerCase() &&
          b.medicationId === currentMed.id
      );

      if (existingBatch) {
        existingBatch.availableQuantity = item.quantity;
        existingBatch.receivedQuantity = item.quantity;
        existingBatch.unitCost = String(item.purchasePrice);
        existingBatch.expiryDate = item.expiry;
        existingBatch.daysToExpiry = daysToExpiry;
        existingBatch.supplierReference = 'DEVELOPMENT_TEST';
        existingBatch.purchaseReference = 'DEVELOPMENT_TEST';
        existingBatch.updatedAt = now;
        seededBatches.push(existingBatch);
      } else {
        const newBatch: PharmacyBatchDto = {
          id: `batch-${item.batch.toLowerCase()}-${Date.now()}`,
          tenantId: params.tenantId,
          partnerId: params.partnerId,
          organizationId: params.organizationId,
          branchId: params.branchId,
          medicationId: currentMed.id,
          medicationCode: currentMed.medicationCode,
          medicationName: `${currentMed.brandName} (${currentMed.genericName})`,
          batchNumber: item.batch,
          manufacturer: item.manufacturer,
          manufacturingDate: '2026-01-01',
          expiryDate: item.expiry,
          receivedQuantity: item.quantity,
          availableQuantity: item.quantity,
          reservedQuantity: 0,
          unitCost: String(item.purchasePrice),
          purchaseReference: 'DEVELOPMENT_TEST',
          supplierReference: 'DEVELOPMENT_TEST',
          daysToExpiry,
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        };
        this.batches.unshift(newBatch);
        seededBatches.push(newBatch);
      }

      // Update or create in inventory
      let existingInv = this.inventory.find(
        (i) =>
          i.tenantId === params.tenantId &&
          (i.medicationId === currentMed.id || i.medicationCode === currentMed.medicationCode)
      );

      if (existingInv) {
        existingInv.availableQuantity += item.quantity;
        existingInv.isLowStock = existingInv.availableQuantity <= (existingInv.reorderLevel || 50);
        existingInv.lastStockMovementAt = now;
        existingInv.updatedAt = now;
      } else {
        const newInv: PharmacyInventoryDto = {
          id: `inv-${currentMed.id}-${Date.now()}`,
          tenantId: params.tenantId,
          partnerId: params.partnerId,
          organizationId: params.organizationId,
          branchId: params.branchId,
          medicationId: currentMed.id,
          medicationCode: currentMed.medicationCode,
          genericName: currentMed.genericName,
          brandName: currentMed.brandName,
          strength: currentMed.strength,
          dosageForm: currentMed.dosageForm,
          category: currentMed.category,
          controlledMedication: currentMed.controlledMedication,
          availableQuantity: item.quantity,
          reservedQuantity: 0,
          damagedQuantity: 0,
          expiredQuantity: 0,
          reorderLevel: 50,
          reorderQuantity: 200,
          isLowStock: false,
          batches: [],
          lastStockMovementAt: now,
          createdAt: now,
          updatedAt: now
        };
        this.inventory.unshift(newInv);
      }

      // Record Stock Movement Ledger
      this.movements.unshift({
        id: `mov-dev-${Date.now()}-${item.batch}`,
        tenantId: params.tenantId,
        partnerId: params.partnerId,
        organizationId: params.organizationId,
        branchId: params.branchId,
        medicationId: currentMed.id,
        medicationName: currentMed.brandName,
        batchId: `batch-${item.batch.toLowerCase()}`,
        batchNumber: item.batch,
        movementType: 'RECEIPT',
        quantity: item.quantity,
        beforeQuantity: 0,
        afterQuantity: item.quantity,
        actorId,
        actorRole,
        reason: 'Development Mock Stock Intake (DEVELOPMENT_TEST)',
        correlationId: `CORR-DEV-${item.batch}`,
        referenceType: 'DEVELOPMENT_TEST',
        referenceId: 'DEV-TEST-MOCK-STOCK',
        occurredAt: now
      } as any);
    }

    // Persist to local storage
    saveStored("docsearch_pharmacy_batches", this.batches);
    saveStored("docsearch_pharmacy_inventory", this.inventory);
    saveStored("docsearch_pharmacy_catalog", this.catalog);
    saveStored("docsearch_pharmacy_movements", this.movements);

    // Update PWA offline cache
    try {
      await pharmacyOfflineStorageService.cacheInventorySnapshot(
        this.catalog as any,
        this.batches as any
      );
    } catch {}

    // Broadcast update events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('docsearch_inventory_updated', { detail: { count: seededBatches.length, source: 'DEVELOPMENT_TEST' } }));
      window.dispatchEvent(new CustomEvent('docsearch_batches_updated'));
      window.dispatchEvent(new CustomEvent('docsearch_billing_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      seededCount: seededBatches.length,
      batches: seededBatches
    };
  }

  /**
   * DEVELOPMENT/TEST ONLY: Remove ONLY development mock stock marked DEVELOPMENT_TEST.
   */
  async cleanupDevMockStock(tenantId: string): Promise<{ success: boolean; removedBatchesCount: number }> {
    const testBatchNumbers = new Set(['TEST-PARA-001', 'TEST-AMOX-001', 'TEST-PANTO-001', 'TEST-AZI-001', 'TEST-ORS-001']);

    // Attempt backend cleanup
    try {
      await apiRequest('/api/v1/partner/pharmacy/dev/cleanup-mock-stock', {
        method: 'DELETE'
      });
    } catch {}

    const initialBatchesCount = this.batches.length;

    // Filter out test batches
    this.batches = this.batches.filter(
      (b) =>
        !(
          b.tenantId === tenantId &&
          (b.supplierReference === 'DEVELOPMENT_TEST' ||
           b.purchaseReference === 'DEVELOPMENT_TEST' ||
           testBatchNumbers.has(b.batchNumber))
        )
    );

    const removedBatchesCount = initialBatchesCount - this.batches.length;

    // Filter out test stock movements
    this.movements = this.movements.filter(
      (m: any) =>
        !(
          m.tenantId === tenantId &&
          (m.referenceType === 'DEVELOPMENT_TEST' ||
           m.referenceId === 'DEV-TEST-MOCK-STOCK' ||
           testBatchNumbers.has(m.batchNumber))
        )
    );

    // Filter out test catalog items
    this.catalog = this.catalog.filter(
      (m) =>
        !(
          m.tenantId === tenantId &&
          ((m.category as string) === 'DEVELOPMENT_TEST' || m.therapeuticClass === 'DEVELOPMENT_TEST')
        )
    );

    // Recalculate inventory
    for (const inv of this.inventory) {
      if (inv.tenantId === tenantId) {
        const activeBatches = this.batches.filter(
          (b) => b.tenantId === tenantId && (b.medicationId === inv.medicationId || b.medicationCode === inv.medicationCode)
        );
        inv.availableQuantity = activeBatches.reduce((s, b) => s + (b.availableQuantity || 0), 0);
        inv.isLowStock = inv.availableQuantity <= (inv.reorderLevel || 50);
      }
    }

    // Persist
    saveStored("docsearch_pharmacy_batches", this.batches);
    saveStored("docsearch_pharmacy_inventory", this.inventory);
    saveStored("docsearch_pharmacy_catalog", this.catalog);
    saveStored("docsearch_pharmacy_movements", this.movements);

    try {
      await pharmacyOfflineStorageService.cacheInventorySnapshot(
        this.catalog as any,
        this.batches as any
      );
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('docsearch_inventory_updated', { detail: { count: 0, cleaned: true } }));
      window.dispatchEvent(new CustomEvent('docsearch_batches_updated'));
      window.dispatchEvent(new CustomEvent('docsearch_billing_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      removedBatchesCount
    };
  }
}

export const pharmacyManagementService = new PharmacyManagementService();
