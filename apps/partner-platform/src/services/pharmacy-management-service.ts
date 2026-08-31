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
}

export class PharmacyManagementService implements IPharmacyManagementService {
  private catalog: MedicationCatalogDto[] = [...MOCK_MEDICATION_CATALOG];
  private batches: PharmacyBatchDto[] = [...MOCK_PHARMACY_BATCHES];
  private inventory: PharmacyInventoryDto[] = [...MOCK_PHARMACY_INVENTORY];
  private prescriptions: PharmacyPrescriptionDto[] = [...MOCK_PHARMACY_PRESCRIPTIONS];
  private dispensing: PharmacyDispensingDto[] = [...MOCK_PHARMACY_DISPENSING];
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
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
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
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.catalog.unshift(res.data);
        return res.data;
      }
    } catch {
      // Fallback
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

    this.recordAudit(req.tenantId, med.partnerId, med.organizationId, med.branchId, req.actorId, req.actorRole, 'MEDICATION_CATALOG_UPDATED', 'MEDICATION_CATALOG', med.id, req.justification, previousSnapshot as unknown as Record<string, unknown>, med as unknown as Record<string, unknown>);

    return med;
  }

  async getPrescriptionQueue(req: SearchPharmacyOrdersRequest): Promise<PharmacyPrescriptionDto[]> {
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

  async getPrescriptionById(tenantId: string, prescriptionId: string): Promise<PharmacyPrescriptionDto | null> {
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
        return res.data;
      }
    } catch {
      // Fallback
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
    let result = this.inventory.filter((i) => i.tenantId === tenantId);
    if (branchId) result = result.filter((i) => i.branchId === branchId);
    return result;
  }

  async getBatches(tenantId: string, branchId?: string, medicationId?: string): Promise<PharmacyBatchDto[]> {
    try {
      const mId = medicationId ? `?medicationId=${encodeURIComponent(medicationId)}` : '';
      const res = await apiRequest<PharmacyBatchDto[]>(`/api/v1/partner/pharmacy/batches${mId}`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    let result = this.batches.filter((b) => b.tenantId === tenantId);
    if (branchId) result = result.filter((b) => b.branchId === branchId);
    if (medicationId) result = result.filter((b) => b.medicationId === medicationId);
    return result;
  }

  async receiveStock(req: ReceiveStockRequest): Promise<PharmacyBatchDto> {
    try {
      const res = await apiRequest<PharmacyBatchDto>('/api/v1/partner/pharmacy/batches/receive-stock', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.batches.unshift(res.data);
        return res.data;
      }
    } catch {
      // Fallback
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
    let list = this.movements.filter((m) => m.tenantId === tenantId);
    if (branchId) list = list.filter((m) => m.branchId === branchId);
    return list;
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
}

export const pharmacyManagementService = new PharmacyManagementService();
