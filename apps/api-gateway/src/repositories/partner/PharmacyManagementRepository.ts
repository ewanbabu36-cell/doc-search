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
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('pharmacy-management-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for pharmacy transaction');
    throw new AppError({
      message: 'Database service is unavailable. Pharmacy transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

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
  prescriptionId?: string;
  encounterId?: string;
  patientId: string;
  pharmacistId?: string;
  pharmacistName?: string;
  isPartial?: boolean;
  items: Array<{
    prescriptionItemId?: string;
    medicationId?: string;
    drugCode?: string;
    batchId?: string;
    quantity: number;
    unit?: string;
    dosageInstructions?: string;
    dosage?: string;
    isSubstituted?: boolean;
    substitutionReason?: string;
  }>;
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
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'QUARANTINED';
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
  movementType: 'RECEIPT' | 'DISPENSE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  actorId: string;
  actorRole?: string;
  reason: string;
  correlationId?: string;
  referenceType: string;
  referenceId: string;
  occurredAt: Date;
}

export interface StoredDispensingItem {
  medicationId: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
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
  dispensingStatus: 'DISPENSED' | 'PARTIALLY_DISPENSED' | 'CANCELLED';
  items: StoredDispensingItem[];
  totalBillAmount: number;
  paymentStatus: 'PAID' | 'PENDING';
  invoiceNumber: string;
  dispensedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredPrescriptionQueueItem {
  id: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  prescribedAt: Date;
  status: 'PENDING' | 'DISPENSED' | 'CANCELLED';
  itemsCount: number;
}

export class PharmacyManagementRepository {
  async getPrescriptionQueue(tenantId: string, status?: string, dbClient = getDatabase()): Promise<StoredPrescriptionQueueItem[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(pharmacyDispensing)
        .where(eq(pharmacyDispensing.tenantId, tenantId))
        .orderBy(desc(pharmacyDispensing.createdAt));

      const list: StoredPrescriptionQueueItem[] = (rows || []).map((r: any) => ({
        id: r.id,
        encounterId: r.prescriptionId || r.id,
        patientId: r.patientId,
        patientName: 'Patient',
        doctorId: r.pharmacistId,
        doctorName: r.pharmacistName || 'Pharmacist',
        prescribedAt: r.createdAt || new Date(),
        status: r.dispensingStatus === 'DISPENSED' ? 'DISPENSED' : 'PENDING',
        itemsCount: 1
      }));

      if (status) return list.filter(p => p.status === status);
      return list;
    } catch (err) {
      logger.error('Failed to query prescription queue from database', err);
      throw new AppError({
        message: 'Database query failed. Prescription queue unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getMedications(tenantId: string, query?: string, dbClient = getDatabase()): Promise<StoredMedication[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(medicationCatalog)
        .where(eq(medicationCatalog.tenantId, tenantId))
        .orderBy(desc(medicationCatalog.createdAt));

      let list = (rows || []) as unknown as StoredMedication[];
      if (query) {
        const q = query.toLowerCase();
        list = list.filter(m => (m.name && m.name.toLowerCase().includes(q)) || (m.genericName && m.genericName.toLowerCase().includes(q)));
      }
      return list;
    } catch (err) {
      logger.error('Failed to query medications from database', err);
      throw new AppError({
        message: 'Database query failed. Medication catalog lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createMedication(input: CreateMedicationInput, dbClient = getDatabase()): Promise<StoredMedication> {
    const db = requireDb(dbClient);
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

    try {
      const [created] = await db.insert(medicationCatalog).values({
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

      return { ...record, id: created ? created.id : record.id };
    } catch (err) {
      logger.error('Failed to create medication in database', err);
      throw new AppError({
        message: 'Database persistence failed. Medication creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getBatches(tenantId: string, medicationId?: string, dbClient = getDatabase()): Promise<StoredBatch[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(pharmacyBatches)
        .where(eq(pharmacyBatches.tenantId, tenantId))
        .orderBy(asc(pharmacyBatches.expiryDate));

      let list = (rows || []) as unknown as StoredBatch[];
      if (medicationId) list = list.filter(b => b.medicationId === medicationId);
      return list;
    } catch (err) {
      logger.error('Failed to query pharmacy batches from database', err);
      throw new AppError({
        message: 'Database query failed. Inventory batches unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async receiveStock(input: ReceiveStockInput, actorId: string, dbClient = getDatabase()): Promise<StoredBatch> {
    const db = requireDb(dbClient);
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

    try {
      const [created] = await db.insert(pharmacyBatches).values({
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

      await db.insert(pharmacyStockMovements).values({
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

      return { ...record, id: created ? created.id : record.id };
    } catch (err) {
      logger.error('Failed to receive stock in database', err);
      throw new AppError({
        message: 'Database persistence failed. Stock receipt aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async dispense(input: DispenseInput, dbClient = getDatabase()): Promise<StoredDispensing> {
    const db = requireDb(dbClient);
    const now = new Date();
    const dispensingId = crypto.randomUUID();
    const dispensingNumber = `DISP-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoiceNumber = `INV-PHARM-${Math.floor(100000 + Math.random() * 900000)}`;
    const prescriptionId = input.prescriptionId || input.encounterId || `RX-${Date.now()}`;

    const dispensedItems: StoredDispensing['items'] = [];
    let totalBillAmount = 0;

    for (const item of input.items) {
      const medId = item.medicationId || item.drugCode || 'MED-GENERIC';
      const unitPrice = 25.0;
      const itemTotal = unitPrice * item.quantity;
      totalBillAmount += itemTotal;

      // Concurrency & Stock Validation: Lock batch row FOR UPDATE
      let batchRow: any = null;
      if (item.batchId) {
        let q: any = db
          .select()
          .from(pharmacyBatches)
          .where(and(eq(pharmacyBatches.id, item.batchId), eq(pharmacyBatches.tenantId, input.tenantId)));
        if (typeof q.for === 'function') q = q.for('update');
        const rows = await q;
        batchRow = rows && rows[0];
      } else if (item.medicationId) {
        // FEFO batch allocation: earliest expiring active batch with stock
        let q: any = db
          .select()
          .from(pharmacyBatches)
          .where(
            and(
              eq(pharmacyBatches.medicationId, item.medicationId),
              eq(pharmacyBatches.tenantId, input.tenantId),
              eq(pharmacyBatches.status, 'ACTIVE')
            )
          )
          .orderBy(asc(pharmacyBatches.expiryDate));
        if (typeof q.for === 'function') q = q.for('update');
        const rows = await q;
        if (rows && rows.length > 0) {
          batchRow = rows.find((b: any) => Number(b.availableQuantity ?? b.available_quantity ?? 0) >= item.quantity) || rows[0];
        }
      }

      if (!batchRow) {
        throw new AppError({
          message: 'Insufficient pharmacy stock available to fulfill dispensing order',
          code: ErrorCode.INSUFFICIENT_PHARMACY_STOCK,
          statusCode: 409
        });
      }

      const availableQty = Number(batchRow.availableQuantity ?? batchRow.available_quantity ?? 0);
      if (availableQty < item.quantity) {
        throw new AppError({
          message: `Insufficient pharmacy stock available to fulfill dispensing order: requested ${item.quantity}, available ${availableQty}`,
          code: ErrorCode.INSUFFICIENT_PHARMACY_STOCK,
          statusCode: 409
        });
      }

      const newAvailableQty = availableQty - item.quantity;
      const newStatus = newAvailableQty === 0 ? 'DEPLETED' : (batchRow.status || 'ACTIVE');

      await db
        .update(pharmacyBatches)
        .set({
          availableQuantity: newAvailableQty,
          status: newStatus,
          updatedAt: now
        } as any)
        .where(eq(pharmacyBatches.id, batchRow.id));

      dispensedItems.push({
        medicationId: batchRow.medicationId || medId,
        batchNumber: batchRow.batchNumber || item.batchId || `BATCH-${now.getFullYear()}-01`,
        quantity: item.quantity,
        unitPrice,
        totalAmount: itemTotal
      });

      const movementId = crypto.randomUUID();
      try {
        await db.insert(pharmacyStockMovements).values({
          id: movementId,
          tenantId: input.tenantId,
          partnerId: input.partnerId || batchRow.partnerId || '00000000-0000-4000-8000-000000000001',
          organizationId: input.organizationId || batchRow.organizationId || '00000000-0000-4000-8000-000000000002',
          branchId: input.branchId || batchRow.branchId || '00000000-0000-4000-8000-000000000003',
          medicationId: batchRow.medicationId || medId,
          batchId: batchRow.id,
          movementType: 'DISPENSE',
          quantity: -item.quantity,
          beforeQuantity: availableQty,
          afterQuantity: newAvailableQty,
          actorId: input.pharmacistId || 'PHARMACIST-OPD',
          actorRole: 'PHARMACIST',
          reason: `Prescription Dispensing ${dispensingNumber}`,
          correlationId: `corr-${Date.now()}`,
          referenceType: 'DISPENSING',
          referenceId: dispensingNumber
        } as unknown as typeof pharmacyStockMovements.$inferInsert);
      } catch (e) {
        logger.warn('Stock movement insertion note', { error: String(e) });
      }
    }

    const dispensingStatus = input.isPartial ? 'PARTIALLY_DISPENSED' : 'DISPENSED';
    const dispensingRecord: StoredDispensing = {
      id: dispensingId,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || '00000000-0000-4000-8000-000000000003',
      dispensingNumber,
      prescriptionId,
      patientId: input.patientId,
      pharmacistId: input.pharmacistId || 'PHARMACIST-OPD',
      pharmacistName: input.pharmacistName || 'Duty Pharmacist',
      dispensingStatus,
      items: dispensedItems,
      totalBillAmount,
      paymentStatus: 'PAID',
      invoiceNumber,
      dispensedAt: now,
      createdAt: now,
      updatedAt: now
    };

    try {
      await db.insert(pharmacyDispensing).values({
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

      return dispensingRecord;
    } catch (err) {
      if (err instanceof AppError || (err && typeof err === 'object' && ('code' in err || 'statusCode' in err))) {
        throw err;
      }
      logger.error('Failed to record dispensing in database', err);
      throw new AppError({
        message: 'Database persistence failed. Medication dispensing aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getStockMovements(tenantId: string, medicationId?: string, dbClient = getDatabase()): Promise<StoredStockMovement[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(pharmacyStockMovements)
        .where(eq(pharmacyStockMovements.tenantId, tenantId))
        .orderBy(desc(pharmacyStockMovements.occurredAt));

      let list = (rows || []) as unknown as StoredStockMovement[];
      if (medicationId) list = list.filter(m => m.medicationId === medicationId);
      return list;
    } catch (err) {
      logger.error('Failed to query stock movements from database', err);
      throw new AppError({
        message: 'Database query failed. Stock movements unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPatientMedicationHistory(tenantId: string, patientId: string, dbClient = getDatabase()): Promise<StoredDispensing[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(pharmacyDispensing)
        .where(and(eq(pharmacyDispensing.tenantId, tenantId), eq(pharmacyDispensing.patientId, patientId)))
        .orderBy(desc(pharmacyDispensing.createdAt));

      return (rows || []) as unknown as StoredDispensing[];
    } catch (err) {
      logger.error('Failed to query patient medication history from database', err);
      throw new AppError({
        message: 'Database query failed. Medication history unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }
}

export const pharmacyManagementRepository = new PharmacyManagementRepository();
