import {
  getDatabase,
  medicationCatalog,
  pharmacyBatches,
  pharmacyStockMovements,
  pharmacyDispensing,
  eq,
  and,
  desc,
  asc
} from '@docsearch/database';

export interface CreateMedicationInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  medicationCode: string;
  name: string;
  genericName: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  category?: string;
  scheduleType?: string; // SCHEDULE_H, SCHEDULE_H1, SCHEDULE_X, OTC, GENERAL
  unitPrice: number;
}

export interface ReceiveStockInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  medicationId: string;
  batchNumber: string;
  manufacturer: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  unitCost: number;
  supplierReference?: string;
}

export interface DispenseInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  prescriptionId: string;
  patientId: string;
  pharmacistId: string;
  pharmacistName: string;
  isPartial?: boolean;
  items: Array<{
    prescriptionItemId?: string;
    medicationId: string;
    batchId?: string;
    quantity: number;
    unit: string;
    dosageInstructions: string;
    isSubstituted?: boolean;
    substitutedMedicationId?: string;
  }>;
  payment?: {
    method: 'CASH' | 'CARD' | 'UPI' | 'SPLIT';
    amount: number;
  };
}

export interface StoredMedication {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  medicationCode: string;
  name: string;
  genericName: string;
  brandName: string;
  dosageForm: string;
  strength: string;
  category: string;
  scheduleType: string;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredBatch {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  medicationId: string;
  batchNumber: string;
  manufacturer: string;
  manufacturingDate: Date;
  expiryDate: Date;
  receivedQuantity: number;
  availableQuantity: number;
  unitCost: number;
  status: string; // ACTIVE, LOW_STOCK, NEAR_EXPIRY, EXPIRED, BLOCKED
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredStockMovement {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  medicationId: string;
  batchId: string;
  movementType: string; // RECEIPT, DISPENSE, RETURN, ADJUSTMENT, DAMAGE, EXPIRY
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  actorId: string;
  reason: string;
  referenceType: string;
  referenceId: string;
  occurredAt: Date;
}

export interface StoredPrescriptionQueueItem {
  id: string;
  tenantId: string;
  patientId: string;
  patientName?: string;
  encounterId?: string;
  doctorName?: string;
  items: Array<{
    medicationId: string;
    medicationName: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  status: string; // PRESCRIBED, PENDING_DISPENSING, PARTIALLY_DISPENSED, DISPENSED, CANCELLED
  prescribedAt: Date;
}

export interface StoredDispensing {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  dispensingNumber: string;
  prescriptionId: string;
  patientId: string;
  pharmacistId: string;
  pharmacistName: string;
  dispensingStatus: string;
  items: Array<{
    medicationId: string;
    batchNumber: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  totalBillAmount: number;
  paymentStatus: string;
  invoiceNumber: string;
  dispensedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PharmacyManagementRepository {
  private memMeds = new Map<string, StoredMedication[]>();
  private memBatches = new Map<string, StoredBatch[]>();
  private memMovements = new Map<string, StoredStockMovement[]>();
  private memDispensing = new Map<string, StoredDispensing[]>();
  private memPrescriptions = new Map<string, StoredPrescriptionQueueItem[]>();

  async getPrescriptionQueue(tenantId: string, status?: string): Promise<StoredPrescriptionQueueItem[]> {
    let list = this.memPrescriptions.get(tenantId) || [];
    if (status) list = list.filter(p => p.status === status);
    return list;
  }

  async addPrescriptionToQueue(tenantId: string, item: StoredPrescriptionQueueItem): Promise<void> {
    const list = this.memPrescriptions.get(tenantId) || [];
    list.unshift(item);
    this.memPrescriptions.set(tenantId, list);
  }

  async getMedications(tenantId: string, query?: string, dbClient = getDatabase()): Promise<StoredMedication[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(medicationCatalog)
          .where(eq(medicationCatalog.tenantId, tenantId))
          .orderBy(desc(medicationCatalog.createdAt));
        if (rows.length > 0) {
          let list = rows as unknown as StoredMedication[];
          if (query) {
            const q = query.toLowerCase();
            list = list.filter(m => m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q));
          }
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memMeds.get(tenantId) || [];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q));
    }
    return list;
  }

  async createMedication(input: CreateMedicationInput, dbClient = getDatabase()): Promise<StoredMedication> {
    const id = crypto.randomUUID();
    const record: StoredMedication = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      medicationCode: input.medicationCode,
      name: input.name,
      genericName: input.genericName,
      brandName: input.brandName || input.name,
      dosageForm: input.dosageForm,
      strength: input.strength,
      category: input.category || 'GENERAL',
      scheduleType: input.scheduleType || 'GENERAL',
      unitPrice: input.unitPrice || 10.0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(medicationCatalog).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          medicationCode: record.medicationCode,
          name: record.name,
          genericName: record.genericName,
          dosageForm: record.dosageForm,
          strength: record.strength,
          category: record.category
        } as unknown as typeof medicationCatalog.$inferInsert).returning();
        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const current = this.memMeds.get(input.tenantId) || [];
    current.unshift(record);
    this.memMeds.set(input.tenantId, current);
    return record;
  }

  async getBatches(tenantId: string, medicationId?: string, dbClient = getDatabase()): Promise<StoredBatch[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(pharmacyBatches)
          .where(eq(pharmacyBatches.tenantId, tenantId))
          .orderBy(asc(pharmacyBatches.expiryDate)); // FEFO
        if (rows.length > 0) {
          let list = rows as unknown as StoredBatch[];
          if (medicationId) list = list.filter(b => b.medicationId === medicationId);
          return list;
        }
      } catch {
        // Fallback
      }
    }
    let list = this.memBatches.get(tenantId) || [];
    if (medicationId) list = list.filter(b => b.medicationId === medicationId);
    // Sort FEFO (earliest expiry first)
    list.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    return list;
  }

  async receiveStock(input: ReceiveStockInput, actorId: string, dbClient = getDatabase()): Promise<StoredBatch> {
    const id = crypto.randomUUID();
    const expDate = new Date(input.expiryDate);
    const mfgDate = new Date(input.manufacturingDate);
    const now = new Date();
    const status = expDate < now ? 'EXPIRED' : 'ACTIVE';

    const record: StoredBatch = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      medicationId: input.medicationId,
      batchNumber: input.batchNumber,
      manufacturer: input.manufacturer,
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      receivedQuantity: input.quantity,
      availableQuantity: input.quantity,
      unitCost: input.unitCost,
      status,
      createdAt: now,
      updatedAt: now
    };

    // Create Stock Movement Ledger entry
    const movement: StoredStockMovement = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      partnerId: record.partnerId,
      organizationId: record.organizationId,
      branchId: record.branchId,
      medicationId: input.medicationId,
      batchId: record.id,
      movementType: 'RECEIPT',
      quantity: input.quantity,
      beforeQuantity: 0,
      afterQuantity: input.quantity,
      actorId,
      reason: 'Procurement Goods Receipt',
      referenceType: 'PURCHASE_ORDER',
      referenceId: input.supplierReference || 'PO-INITIAL',
      occurredAt: now
    };

    if (dbClient) {
      try {
        const [created] = await dbClient.insert(pharmacyBatches).values({
          id: record.id,
          tenantId: record.tenantId,
          partnerId: record.partnerId,
          organizationId: record.organizationId,
          branchId: record.branchId,
          medicationId: record.medicationId,
          batchNumber: record.batchNumber,
          manufacturer: record.manufacturer,
          manufacturingDate: record.manufacturingDate,
          expiryDate: record.expiryDate,
          receivedQuantity: record.receivedQuantity,
          availableQuantity: record.availableQuantity,
          unitCost: record.unitCost.toString(),
          status: record.status
        } as unknown as typeof pharmacyBatches.$inferInsert).returning();

        await dbClient.insert(pharmacyStockMovements).values({
          id: movement.id,
          tenantId: movement.tenantId,
          partnerId: movement.partnerId,
          organizationId: movement.organizationId,
          branchId: movement.branchId,
          medicationId: movement.medicationId,
          batchId: movement.batchId,
          movementType: movement.movementType,
          quantity: movement.quantity,
          beforeQuantity: movement.beforeQuantity,
          afterQuantity: movement.afterQuantity,
          actorId: movement.actorId,
          actorRole: 'PHARMACIST',
          reason: movement.reason,
          correlationId: `corr-${Date.now()}`,
          referenceType: movement.referenceType,
          referenceId: movement.referenceId
        } as unknown as typeof pharmacyStockMovements.$inferInsert);

        if (created) return { ...record, id: created.id };
      } catch {
        // Fallback
      }
    }

    const currentBatches = this.memBatches.get(input.tenantId) || [];
    currentBatches.unshift(record);
    this.memBatches.set(input.tenantId, currentBatches);

    const currentMovements = this.memMovements.get(input.tenantId) || [];
    currentMovements.unshift(movement);
    this.memMovements.set(input.tenantId, currentMovements);

    return record;
  }

  async dispense(input: DispenseInput, dbClient = getDatabase()): Promise<StoredDispensing> {
    // 1. Duplicate Dispense Protection Check (Pre-flight validation)
    const existingDispensing = this.memDispensing.get(input.tenantId) || [];
    const alreadyDispensed = existingDispensing.find(d => d.prescriptionId === input.prescriptionId && d.dispensingStatus === 'DISPENSED');
    if (alreadyDispensed) {
      throw new Error(`Prescription ${input.prescriptionId} has already been fully dispensed.`);
    }

    const tenantBatches = await this.getBatches(input.tenantId, undefined, dbClient);
    const now = new Date();
    const dispensingId = crypto.randomUUID();
    const dispensingNumber = `DISP-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoiceNumber = `INV-PHARM-${Math.floor(100000 + Math.random() * 900000)}`;

    const dispensedItems: StoredDispensing['items'] = [];
    let totalBillAmount = 0;

    for (const item of input.items) {
      // FEFO Batch Selection: Find active batch with earliest expiry and sufficient stock
      const validBatches = tenantBatches
        .filter(b => b.medicationId === item.medicationId && b.status === 'ACTIVE' && b.expiryDate > now && b.availableQuantity >= item.quantity)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      if (validBatches.length === 0) {
        throw new Error(`Insufficient active stock or expired batch for medication ID ${item.medicationId}`);
      }

      const selectedBatch = validBatches[0];
      if (!selectedBatch) {
        throw new Error(`Insufficient active stock or expired batch for medication ID ${item.medicationId}`);
      }
      const beforeQty = selectedBatch.availableQuantity;
      const afterQty = beforeQty - item.quantity;
      selectedBatch.availableQuantity = afterQty;
      if (afterQty === 0) selectedBatch.status = 'DEPLETED';

      const unitPrice = 25.0; // Default price
      const itemTotal = unitPrice * item.quantity;
      totalBillAmount += itemTotal;

      dispensedItems.push({
        medicationId: item.medicationId,
        batchNumber: selectedBatch.batchNumber,
        quantity: item.quantity,
        unitPrice,
        totalAmount: itemTotal
      });

      // Batch-level Stock Movement Ledger entry
      const movement: StoredStockMovement = {
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
        organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
        branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
        medicationId: item.medicationId,
        batchId: selectedBatch.id,
        movementType: 'DISPENSE',
        quantity: -item.quantity,
        beforeQuantity: beforeQty,
        afterQuantity: afterQty,
        actorId: input.pharmacistId,
        reason: `Prescription Dispensing ${dispensingNumber}`,
        referenceType: 'DISPENSING',
        referenceId: dispensingNumber,
        occurredAt: now
      };

      if (dbClient) {
        try {
          await dbClient
            .update(pharmacyBatches)
            .set({ availableQuantity: afterQty, status: afterQty === 0 ? 'DEPLETED' : 'ACTIVE', updatedAt: now })
            .where(and(eq(pharmacyBatches.tenantId, input.tenantId), eq(pharmacyBatches.id, selectedBatch.id)));

          await dbClient.insert(pharmacyStockMovements).values({
            id: movement.id,
            tenantId: movement.tenantId,
            partnerId: movement.partnerId,
            organizationId: movement.organizationId,
            branchId: movement.branchId,
            medicationId: movement.medicationId,
            batchId: movement.batchId,
            movementType: movement.movementType,
            quantity: movement.quantity,
            beforeQuantity: movement.beforeQuantity,
            afterQuantity: movement.afterQuantity,
            actorId: movement.actorId,
            actorRole: 'PHARMACIST',
            reason: movement.reason,
            correlationId: `corr-${Date.now()}`,
            referenceType: movement.referenceType,
            referenceId: movement.referenceId
          } as unknown as typeof pharmacyStockMovements.$inferInsert);
        } catch {
          // Fallback
        }
      }

      const currentMovements = this.memMovements.get(input.tenantId) || [];
      currentMovements.unshift(movement);
      this.memMovements.set(input.tenantId, currentMovements);
    }

    // Check if partial
    const isPartial = input.isPartial === true;
    const dispensingStatus = isPartial ? 'PARTIALLY_DISPENSED' : 'DISPENSED';

    const dispensingRecord: StoredDispensing = {
      id: dispensingId,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      dispensingNumber,
      prescriptionId: input.prescriptionId,
      patientId: input.patientId,
      pharmacistId: input.pharmacistId,
      pharmacistName: input.pharmacistName,
      dispensingStatus,
      items: dispensedItems,
      totalBillAmount,
      paymentStatus: 'PAID',
      invoiceNumber,
      dispensedAt: now,
      createdAt: now,
      updatedAt: now
    };

    if (dbClient) {
      try {
        await dbClient.insert(pharmacyDispensing).values({
          id: dispensingRecord.id,
          tenantId: dispensingRecord.tenantId,
          partnerId: dispensingRecord.partnerId,
          organizationId: dispensingRecord.organizationId,
          branchId: dispensingRecord.branchId,
          dispensingNumber: dispensingRecord.dispensingNumber,
          prescriptionId: dispensingRecord.prescriptionId,
          patientId: dispensingRecord.patientId,
          pharmacistId: dispensingRecord.pharmacistId,
          pharmacistName: dispensingRecord.pharmacistName,
          dispensingStatus: dispensingRecord.dispensingStatus
        } as unknown as typeof pharmacyDispensing.$inferInsert);
      } catch {
        // Fallback
      }
    }

    const currentDispensing = this.memDispensing.get(input.tenantId) || [];
    currentDispensing.unshift(dispensingRecord);
    this.memDispensing.set(input.tenantId, currentDispensing);

    return dispensingRecord;
  }

  async getStockMovements(tenantId: string, medicationId?: string): Promise<StoredStockMovement[]> {
    let list = this.memMovements.get(tenantId) || [];
    if (medicationId) list = list.filter(m => m.medicationId === medicationId);
    return list;
  }

  async getPatientMedicationHistory(tenantId: string, patientId: string): Promise<StoredDispensing[]> {
    const list = this.memDispensing.get(tenantId) || [];
    return list.filter(d => d.patientId === patientId);
  }
}

export const pharmacyManagementRepository = new PharmacyManagementRepository();
