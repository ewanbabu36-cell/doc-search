import crypto from 'node:crypto';
import {
  getDatabase,
  medicationCatalog,
  pharmacyBatches,
  pharmacyStockMovements,
  pharmacyInventory,
  pharmacyDispensing,
  pharmacyDispensingItems,
  pharmacyReturns,
  pharmacyStockAdjustments,
  pharmacyPrescriptions,
  pharmacyPrescriptionItems,
  patients,
  doctorProfiles,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  branches,
  partnerProfiles,
  billingInvoices,
  billingInvoiceItems,
  billingPayments,
  billingReceipts,
  encounters,
  eq,
  and,
  or,
  inArray,
  desc,
  asc
} from '@docsearch/database';

import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { staffAdministrationRepository } from './StaffAdministrationRepository.js';

const logger = createLogger('pharmacy-management-repository');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

async function resolvePartnerAndOrg(
  db: any,
  tenantId: string,
  providedPartnerId?: string,
  providedOrgId?: string
): Promise<{ partnerId: string; organizationId: string }> {
  if (!tenantId || !UUID_REGEX.test(tenantId)) {
    throw new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'A valid tenantId UUID is required to resolve operational hierarchy.',
      statusCode: 400
    });
  }

  let partnerId: string | null = null;
  let organizationId: string | null = null;

  if (providedPartnerId) {
    const [p] = await db
      .select({ id: operationalPartners.id, tenantId: operationalPartners.tenantId })
      .from(operationalPartners)
      .where(eq(operationalPartners.id, providedPartnerId))
      .limit(1);
    if (!p) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Operational partner '${providedPartnerId}' does not exist.`,
        statusCode: 404
      });
    }
    if (p.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Operational partner '${providedPartnerId}' does not belong to tenant '${tenantId}'.`,
        statusCode: 403
      });
    }
    partnerId = p.id;
  } else {
    const [p] = await db
      .select({ id: operationalPartners.id })
      .from(operationalPartners)
      .where(eq(operationalPartners.tenantId, tenantId))
      .limit(1);
    if (p?.id) partnerId = p.id;
  }

  if (providedOrgId) {
    const [o] = await db
      .select({ id: operationalOrganizations.id, tenantId: operationalOrganizations.tenantId })
      .from(operationalOrganizations)
      .where(eq(operationalOrganizations.id, providedOrgId))
      .limit(1);
    if (!o) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Operational organization '${providedOrgId}' does not exist.`,
        statusCode: 404
      });
    }
    if (o.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Operational organization '${providedOrgId}' does not belong to tenant '${tenantId}'.`,
        statusCode: 403
      });
    }
    organizationId = o.id;
  } else {
    const [o] = await db
      .select({ id: operationalOrganizations.id })
      .from(operationalOrganizations)
      .where(eq(operationalOrganizations.tenantId, tenantId))
      .limit(1);
    if (o?.id) organizationId = o.id;
  }

  if (!partnerId || !organizationId) {
    const [profile] = await db
      .select({ id: partnerProfiles.id })
      .from(partnerProfiles)
      .where(eq(partnerProfiles.tenantId, tenantId))
      .limit(1);
    if (profile?.id) {
      const defaults = await staffAdministrationRepository.ensureDefaults(db, tenantId);
      partnerId = partnerId || defaults.partnerId;
      organizationId = organizationId || defaults.organizationId;
    }
  }

  if (!partnerId || !organizationId) {
    throw new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `Operational partner and organization hierarchy is not provisioned for tenant '${tenantId}'.`,
      statusCode: 404
    });
  }

  return {
    partnerId,
    organizationId
  };
}

async function resolveBranchId(db: any, tenantId: string, providedBranchId?: string): Promise<string> {
  if (providedBranchId) {
    if (!UUID_REGEX.test(providedBranchId)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid branchId UUID format: '${providedBranchId}'.`,
        statusCode: 400
      });
    }
    const [fac] = await db
      .select({ id: operationalFacilities.id, tenantId: operationalFacilities.tenantId })
      .from(operationalFacilities)
      .where(eq(operationalFacilities.id, providedBranchId))
      .limit(1);
    if (fac) {
      if (fac.tenantId !== tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Branch '${providedBranchId}' does not belong to tenant '${tenantId}'.`,
          statusCode: 403
        });
      }
      return fac.id;
    }

    const [coreBranch] = await db
      .select({ id: branches.id, tenantId: branches.tenantId, name: branches.name, code: branches.code })
      .from(branches)
      .where(eq(branches.id, providedBranchId))
      .limit(1);
    if (coreBranch) {
      if (coreBranch.tenantId !== tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Branch '${providedBranchId}' does not belong to tenant '${tenantId}'.`,
          statusCode: 403
        });
      }
      const { partnerId, organizationId } = await resolvePartnerAndOrg(db, tenantId);
      await db
        .insert(operationalFacilities)
        .values({
          id: coreBranch.id,
          tenantId,
          partnerId,
          organizationId,
          facilityCode: coreBranch.code || `FAC-${coreBranch.id.slice(0, 8).toUpperCase()}`,
          facilityName: coreBranch.name || `Branch ${coreBranch.id.slice(0, 8)}`,
          facilityType: 'PHARMACY_OUTLET',
          addressStreet: 'Registered Facility Address',
          addressCity: 'Registered City',
          addressState: 'Registered State',
          addressPostalCode: '000000',
          contactEmail: `branch.${coreBranch.id.slice(0, 6)}@partner.local`,
          contactPhone: '+91-9800000000',
          status: 'ACTIVE'
        })
        .onConflictDoNothing();
      return coreBranch.id;
    }

    throw new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `Operational branch/facility '${providedBranchId}' does not exist for tenant '${tenantId}'.`,
      statusCode: 404
    });
  }

  await resolvePartnerAndOrg(db, tenantId);
  const [fac] = await db
    .select({ id: operationalFacilities.id })
    .from(operationalFacilities)
    .where(eq(operationalFacilities.tenantId, tenantId))
    .limit(1);
  if (fac?.id) return fac.id;

  throw new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `No operational branch/facility is provisioned for tenant '${tenantId}'.`,
    statusCode: 404
  });
}

async function resolveDepartmentId(db: any, tenantId: string, providedDeptId?: string): Promise<string> {
  if (providedDeptId) {
    if (!UUID_REGEX.test(providedDeptId)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid departmentId UUID format: '${providedDeptId}'.`,
        statusCode: 400
      });
    }
    const [dept] = await db
      .select({ id: operationalDepartments.id, tenantId: operationalDepartments.tenantId })
      .from(operationalDepartments)
      .where(eq(operationalDepartments.id, providedDeptId))
      .limit(1);
    if (!dept) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Operational department '${providedDeptId}' does not exist for tenant '${tenantId}'.`,
        statusCode: 404
      });
    }
    if (dept.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Operational department '${providedDeptId}' does not belong to tenant '${tenantId}'.`,
        statusCode: 403
      });
    }
    return dept.id;
  }

  await resolvePartnerAndOrg(db, tenantId);
  const [dept] = await db
    .select({ id: operationalDepartments.id })
    .from(operationalDepartments)
    .where(eq(operationalDepartments.tenantId, tenantId))
    .limit(1);
  if (dept?.id) return dept.id;

  throw new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `No operational department is provisioned for tenant '${tenantId}'.`,
    statusCode: 404
  });
}

async function resolveDoctorId(db: any, tenantId: string, providedDocId?: string): Promise<string> {
  if (providedDocId) {
    if (!UUID_REGEX.test(providedDocId)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid doctorId UUID format: '${providedDocId}'.`,
        statusCode: 400
      });
    }
    const [doc] = await db
      .select({ id: doctorProfiles.id, tenantId: doctorProfiles.tenantId })
      .from(doctorProfiles)
      .where(or(eq(doctorProfiles.id, providedDocId), eq(doctorProfiles.staffId, providedDocId)))
      .limit(1);
    if (!doc) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Doctor profile '${providedDocId}' does not exist for tenant '${tenantId}'.`,
        statusCode: 404
      });
    }
    if (doc.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Doctor profile '${providedDocId}' does not belong to tenant '${tenantId}'.`,
        statusCode: 403
      });
    }
    return doc.id;
  }

  await resolvePartnerAndOrg(db, tenantId);
  const [doc] = await db
    .select({ id: doctorProfiles.id })
    .from(doctorProfiles)
    .where(eq(doctorProfiles.tenantId, tenantId))
    .limit(1);
  if (doc?.id) return doc.id;

  throw new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `No doctor profile is provisioned for tenant '${tenantId}'.`,
    statusCode: 404
  });
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
  branchId?: string | undefined;
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
  supplierReference?: string | undefined;
  purchaseReference?: string | undefined;
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
  receiptNumber?: string | undefined;
  dispensedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReturnInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  dispensingId: string;
  patientId?: string | undefined;
  medicationId?: string | undefined;
  batchId?: string | undefined;
  quantity: number;
  returnReason: string;
  condition?: string | undefined;
  disposition?: ('RESTOCK' | 'QUARANTINE_FOR_DESTRUCTION' | 'RETURN_TO_MANUFACTURER') | undefined;
  actorId: string;
  actorRole?: string | undefined;
  notes?: string | undefined;
}

export interface StoredReturn {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  returnNumber: string;
  dispensingId: string;
  patientId: string;
  medicationId: string;
  batchId: string;
  quantity: number;
  returnReason: string;
  condition: string;
  disposition: string;
  actorId: string;
  actorRole: string;
  notes?: string | null | undefined;
  occurredAt: Date;
}

export interface CreateStockAdjustmentInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  medicationId: string;
  batchId: string;
  reason: string;
  justification: string;
  adjustmentQuantity: number;
  actorId: string;
  actorRole?: string | undefined;
  approvedBy?: string | undefined;
}

export interface StoredStockAdjustment {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  adjustmentNumber: string;
  medicationId: string;
  batchId: string;
  reason: string;
  justification: string;
  beforeQuantity: number;
  adjustmentQuantity: number;
  afterQuantity: number;
  actorId: string;
  actorRole: string;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  occurredAt: Date;
}

export interface BatchRecallResult {
  batchId: string;
  batchNumber: string;
  status: string;
  blockReason: string;
  blockedAt: Date;
  quarantinedQuantity: number;
  affectedDispensations: Array<{
    dispensingId: string;
    dispensingNumber: string;
    patientId: string;
    quantity: number;
    dispensedAt: Date;
  }>;
}

export interface StoredPrescriptionQueueItem {
  id: string;
  encounterId: string;
  prescriptionId?: string | undefined;
  prescriptionNumber?: string | undefined;
  patientId: string;
  patientName: string;
  patientMrn?: string | undefined;
  doctorId: string;
  doctorName: string;
  prescribedAt: Date;
  status: 'PENDING' | 'DISPENSED' | 'CANCELLED';
  itemsCount: number;
  items?: Array<{
    id: string;
    medicationId: string;
    medicationName?: string | undefined;
    dosage?: string | undefined;
    frequency?: string | undefined;
    route?: string | undefined;
    duration?: number | undefined;
    durationUnit?: string | undefined;
    prescribedQuantity: number;
    dispensedQuantity?: number | undefined;
    remainingQuantity?: number | undefined;
    instructions?: string | undefined;
    fulfillmentStatus?: string | undefined;
  }> | undefined;
}

export class PharmacyManagementRepository {
  async getPrescriptionQueue(tenantId: string, status?: string, dbClient = getDatabase()): Promise<StoredPrescriptionQueueItem[]> {
    const db = requireDb(dbClient);
    try {
      const rxRows = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(eq(pharmacyPrescriptions.tenantId, tenantId))
        .orderBy(desc(pharmacyPrescriptions.createdAt));

      const list: StoredPrescriptionQueueItem[] = [];
      const handledPrescriptionIds = new Set<string>();

      for (const p of rxRows || []) {
        handledPrescriptionIds.add(p.id);
        let rxItems: any[] = [];
        let patientName = 'Patient';
        let patientMrn = '';
        let doctorName = 'Doctor';

        try {
          const items = await db
            .select()
            .from(pharmacyPrescriptionItems)
            .where(and(eq(pharmacyPrescriptionItems.tenantId, tenantId), eq(pharmacyPrescriptionItems.prescriptionId, p.id)));
          rxItems = items || [];
        } catch (e) {
          logger.warn('Failed to load prescription items', { id: p.id, error: e });
        }

        if (p.patientId) {
          try {
            const [pt] = await db
              .select()
              .from(patients)
              .where(and(eq(patients.tenantId, tenantId), eq(patients.id, p.patientId)));
            if (pt) {
              patientName = `${pt.firstName || ''} ${pt.lastName || ''}`.trim() || (pt as any).fullName || 'Patient';
              patientMrn = pt.mrn || '';
            }
          } catch {}
        }

        if (p.prescribingDoctorId) {
          try {
            const [doc] = await db
              .select()
              .from(doctorProfiles)
              .where(and(eq(doctorProfiles.tenantId, tenantId), eq(doctorProfiles.id, p.prescribingDoctorId)));
            if (doc) {
              doctorName = (doc as any).fullName || (doc as any).displayName || (doc as any).name || doctorName;
            }
          } catch {}
        }

        const isCompleted = p.status === 'COMPLETED' || p.status === 'DISPENSED';
        const displayStatus: 'PENDING' | 'DISPENSED' | 'CANCELLED' = isCompleted ? 'DISPENSED' : (p.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING');

        list.push({
          id: p.id,
          encounterId: p.encounterId || p.id,
          prescriptionId: p.id,
          prescriptionNumber: p.prescriptionNumber || `RX-${p.id.substring(0, 8)}`,
          patientId: p.patientId,
          patientName,
          patientMrn: patientMrn || undefined,
          doctorId: p.prescribingDoctorId || '',
          doctorName,
          prescribedAt: p.prescribedAt || p.createdAt || new Date(),
          status: displayStatus,
          itemsCount: rxItems.length > 0 ? rxItems.length : 1,
          items: rxItems.map((it: any) => ({
            id: it.id,
            medicationId: it.medicationId,
            medicationName: it.metadata?.medicationName || it.metadata?.drugName || it.medicationName || 'Medication',
            dosage: it.dosage,
            frequency: it.frequency,
            route: it.route,
            duration: it.duration,
            durationUnit: it.durationUnit,
            prescribedQuantity: it.prescribedQuantity,
            dispensedQuantity: it.dispensedQuantity || 0,
            remainingQuantity: it.remainingQuantity ?? it.prescribedQuantity,
            instructions: it.instructions,
            fulfillmentStatus: it.fulfillmentStatus || 'PENDING'
          }))
        });
      }

      // Also include any over-the-counter walk-in dispensing records that were not from a prior prescription
      try {
        const dispensingRows = await db
          .select()
          .from(pharmacyDispensing)
          .where(eq(pharmacyDispensing.tenantId, tenantId))
          .orderBy(desc(pharmacyDispensing.createdAt));

        for (const d of dispensingRows || []) {
          if (d.prescriptionId && handledPrescriptionIds.has(d.prescriptionId)) {
            continue;
          }
          let patientName = 'Walk-in Patient';
          if (d.patientId) {
            try {
              const [pt] = await db
                .select()
                .from(patients)
                .where(and(eq(patients.tenantId, tenantId), eq(patients.id, d.patientId)));
              if (pt) {
                patientName = `${pt.firstName || ''} ${pt.lastName || ''}`.trim() || 'Walk-in Patient';
              }
            } catch {}
          }

          list.push({
            id: d.id,
            encounterId: d.id,
            prescriptionId: d.prescriptionId || undefined,
            prescriptionNumber: `POS-${d.dispensingNumber || d.id.substring(0, 8)}`,
            patientId: d.patientId,
            patientName,
            doctorId: d.pharmacistId,
            doctorName: d.pharmacistName || 'Duty Pharmacist',
            prescribedAt: d.createdAt || new Date(),
            status: d.dispensingStatus === 'DISPENSED' ? 'DISPENSED' : 'PENDING',
            itemsCount: 1,
            items: []
          });
        }
      } catch (dispErr) {
        logger.warn('Could not load extra dispensing rows for queue', { error: dispErr });
      }

      if (status) return list.filter(p => p.status === status || (status === 'PENDING' && p.status !== 'DISPENSED'));
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

  async getPrescriptionById(tenantId: string, prescriptionId: string, dbClient = getDatabase()): Promise<StoredPrescriptionQueueItem | null> {
    const db = requireDb(dbClient);
    try {
      const [p] = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.id, prescriptionId)));

      if (!p) {
        return null;
      }

      let rxItems: any[] = [];
      let patientName = 'Patient';
      let patientMrn = '';
      let doctorName = 'Doctor';

      try {
        const items = await db
          .select()
          .from(pharmacyPrescriptionItems)
          .where(and(eq(pharmacyPrescriptionItems.tenantId, tenantId), eq(pharmacyPrescriptionItems.prescriptionId, p.id)));
        rxItems = items || [];
      } catch (e) {
        logger.warn('Failed to load prescription items', { id: p.id, error: e });
      }

      if (p.patientId) {
        try {
          const [pt] = await db
            .select()
            .from(patients)
            .where(and(eq(patients.tenantId, tenantId), eq(patients.id, p.patientId)));
          if (pt) {
            patientName = `${pt.firstName || ''} ${pt.lastName || ''}`.trim() || (pt as any).fullName || 'Patient';
            patientMrn = pt.mrn || '';
          }
        } catch {}
      }

      if (p.prescribingDoctorId) {
        try {
          const [doc] = await db
            .select()
            .from(doctorProfiles)
            .where(and(eq(doctorProfiles.tenantId, tenantId), eq(doctorProfiles.id, p.prescribingDoctorId)));
          if (doc) {
            doctorName = (doc as any).fullName || (doc as any).displayName || (doc as any).name || doctorName;
          }
        } catch {}
      }

      const isCompleted = p.status === 'COMPLETED' || p.status === 'DISPENSED';
      const displayStatus: 'PENDING' | 'DISPENSED' | 'CANCELLED' = isCompleted ? 'DISPENSED' : (p.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING');

      return {
        id: p.id,
        encounterId: p.encounterId || p.id,
        prescriptionId: p.id,
        prescriptionNumber: p.prescriptionNumber || `RX-${p.id.substring(0, 8)}`,
        patientId: p.patientId,
        patientName,
        patientMrn: patientMrn || undefined,
        doctorId: p.prescribingDoctorId || '',
        doctorName,
        prescribedAt: p.prescribedAt || p.createdAt || new Date(),
        status: displayStatus,
        itemsCount: rxItems.length > 0 ? rxItems.length : 1,
        items: rxItems.map((it: any) => ({
          id: it.id,
          medicationId: it.medicationId,
          medicationName: it.metadata?.medicationName || it.metadata?.drugName || it.medicationName || 'Medication',
          dosage: it.dosage,
          frequency: it.frequency,
          route: it.route,
          duration: it.duration,
          prescribedQuantity: it.prescribedQuantity,
          dispensedQuantity: it.dispensedQuantity,
          instructions: it.instructions,
          fulfillmentStatus: it.fulfillmentStatus || 'PENDING'
        }))
      };
    } catch (err) {
      logger.error('Failed to query prescription by ID from database', err);
      throw new AppError({
        message: 'Database query failed. Prescription lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getInventory(tenantId: string, branchId?: string, dbClient = getDatabase()): Promise<any[]> {
    const db = requireDb(dbClient);
    try {
      const [meds, allBatches] = await Promise.all([
        this.getMedications(tenantId, undefined, db),
        this.getBatches(tenantId, undefined, db)
      ]);

      const batchesByMedId = new Map<string, StoredBatch[]>();
      for (const b of allBatches) {
        if (branchId && b.branchId && b.branchId !== branchId) continue;
        const bList = batchesByMedId.get(b.medicationId) || [];
        bList.push(b);
        batchesByMedId.set(b.medicationId, bList);
      }

      const effectiveDefaultBranchId = branchId || (await resolveBranchId(db, tenantId));
      return meds.map((m) => {
        const medBatches = batchesByMedId.get(m.id) || [];
        const availableQty = medBatches.reduce((acc, b) => acc + (b.status === 'ACTIVE' ? Number(b.availableQuantity || 0) : 0), 0);
        const reorderLevel = 50;
        return {
          id: m.id,
          tenantId: m.tenantId,
          partnerId: m.partnerId,
          organizationId: m.organizationId,
          branchId: m.branchId || effectiveDefaultBranchId,
          medicationId: m.id,
          medicationCode: m.medicationCode,
          genericName: m.genericName,
          brandName: m.brandName || m.name,
          strength: m.strength,
          dosageForm: m.dosageForm,
          category: m.category || 'GENERAL',
          controlledMedication: m.scheduleType === 'SCHEDULE_H' || m.scheduleType === 'SCHEDULE_X',
          availableQuantity: availableQty,
          reservedQuantity: 0,
          damagedQuantity: 0,
          expiredQuantity: medBatches.filter(b => b.status === 'EXPIRED').reduce((acc, b) => acc + Number(b.availableQuantity || 0), 0),
          reorderLevel,
          reorderQuantity: 200,
          isLowStock: availableQty <= reorderLevel,
          batches: medBatches.map(b => ({
            id: b.id,
            tenantId: b.tenantId,
            partnerId: b.partnerId,
            organizationId: b.organizationId,
            branchId: b.branchId,
            medicationId: b.medicationId,
            medicationCode: m.medicationCode,
            medicationName: `${m.genericName} (${m.strength})`,
            batchNumber: b.batchNumber,
            manufacturer: b.manufacturer,
            manufacturingDate: b.manufacturingDate instanceof Date ? b.manufacturingDate.toISOString() : String(b.manufacturingDate),
            expiryDate: b.expiryDate instanceof Date ? b.expiryDate.toISOString() : String(b.expiryDate),
            receivedQuantity: Number(b.receivedQuantity),
            availableQuantity: Number(b.availableQuantity),
            reservedQuantity: 0,
            unitCost: Number(b.unitCost),
            purchaseReference: b.purchaseReference,
            supplierReference: b.supplierReference,
            status: b.status,
            daysToExpiry: Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
            updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : String(b.updatedAt)
          })),
          lastStockMovementAt: new Date().toISOString(),
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
          updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : String(m.updatedAt)
        };
      });
    } catch (err) {
      logger.error('Failed to query inventory', err);
      throw new AppError({
        message: 'Database query failed. Inventory unavailable.',
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
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, (input as any).branchId);
    const record: StoredMedication = {
      id,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
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
      const [existing] = await db
        .select()
        .from(medicationCatalog)
        .where(and(eq(medicationCatalog.tenantId, input.tenantId), eq(medicationCatalog.medicationCode, input.medicationCode)));
      if (existing) {
        await db
          .update(medicationCatalog)
          .set({
            genericName: record.genericName,
            brandName: record.brandName,
            dosageForm: record.dosageForm,
            strength: record.strength,
            category: record.category,
            metadata: {
              name: record.name,
              unitPrice: record.unitPrice
            },
            updatedAt: new Date()
          } as any)
          .where(eq(medicationCatalog.id, existing.id));
        return { ...record, id: existing.id };
      }
    } catch {
      // fallback to insert
    }

    try {
      const [created] = await db.insert(medicationCatalog).values({
        id: record.id,
        tenantId: record.tenantId,
        partnerId: record.partnerId,
        organizationId: record.organizationId,
        branchId: record.branchId,
        medicationCode: record.medicationCode,
        genericName: record.genericName,
        brandName: record.brandName || record.name,
        dosageForm: record.dosageForm,
        strength: record.strength,
        manufacturer: (input as any).manufacturer || 'Cipla Therapeutics Ltd',
        category: record.category,
        metadata: {
          name: record.name,
          unitPrice: record.unitPrice
        }
      } as unknown as typeof medicationCatalog.$inferInsert).returning();

      return { ...record, id: created ? created.id : record.id };
    } catch (err: any) {
      logger.error('Failed to create medication in database', err);
      throw new AppError({
        message: `Database persistence failed. Medication creation aborted: ${err?.message || String(err)}`,
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

  async receiveStock(input: ReceiveStockInput, actorId: string = 'PHARMACIST-OPD', dbClient = getDatabase()): Promise<StoredBatch> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const expDate = input.expiryDate ? new Date(input.expiryDate) : new Date(Date.now() + 365 * 24 * 3600 * 1000);
    const mfgDate = input.manufacturingDate ? new Date(input.manufacturingDate) : new Date();
    const now = new Date();
    const status = expDate < now ? 'EXPIRED' : 'ACTIVE';
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);

    const qty = Number(input.quantity ?? (input as any).quantityReceived ?? 0);
    const unitCost = Number(input.unitCost ?? 1.0);

    const record: StoredBatch = {
      id,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      medicationId: input.medicationId,
      batchNumber: input.batchNumber,
      manufacturer: input.manufacturer || 'Standard Pharma Ltd',
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      receivedQuantity: qty,
      availableQuantity: qty,
      unitCost,
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

    const runInTx = typeof (db as any).transaction === 'function' ? (fn: (tx: any) => Promise<any>) => (db as any).transaction(fn) : (fn: (tx: any) => Promise<any>) => fn(db);

    try {
      return await runInTx(async (tx: any) => {
        const [created] = await tx.insert(pharmacyBatches).values({
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

        await tx.insert(pharmacyStockMovements).values({
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
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
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
    const isUuid = (val?: string): boolean => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const dispensedItems: StoredDispensing['items'] = [];
    let totalBillAmount = 0;

    const runInTx = typeof (db as any).transaction === 'function' ? (fn: (tx: any) => Promise<any>) => (db as any).transaction(fn) : (fn: (tx: any) => Promise<any>) => fn(db);

    try {
      return await runInTx(async (tx: any) => {
        const { partnerId, organizationId } = await resolvePartnerAndOrg(tx, input.tenantId, input.partnerId, input.organizationId);
        const branchId = await resolveBranchId(tx, input.tenantId, input.branchId);

        for (const item of input.items) {
          const medId = item.medicationId || item.drugCode || 'MED-GENERIC';

          // Concurrency & Stock Validation: Lock batch row FOR UPDATE
          let batchRow: any = null;
          if (item.batchId) {
            let q: any = tx
              .select()
              .from(pharmacyBatches)
              .where(and(eq(pharmacyBatches.id, item.batchId), eq(pharmacyBatches.tenantId, input.tenantId)));
            if (typeof q.for === 'function') q = q.for('update');
            const rows = await q;
            batchRow = rows && rows[0];
          } else if (item.medicationId) {
            // FEFO batch allocation: earliest expiring active batch with stock
            let q: any = tx
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

          if (batchRow.status === 'BLOCKED') {
            throw new AppError({
              message: `Batch '${batchRow.batchNumber}' is blocked/recalled: ${batchRow.blockReason || 'Safety block in effect'}. Dispensing rejected.`,
              code: ErrorCode.BAD_REQUEST,
              statusCode: 400
            });
          }

          if (batchRow.status === 'EXPIRED' || new Date(batchRow.expiryDate) < now) {
            throw new AppError({
              message: `Batch '${batchRow.batchNumber}' has expired. Dispensing rejected.`,
              code: ErrorCode.BAD_REQUEST,
              statusCode: 400
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

          // Authoritative Dynamic Pricing Lookup
          let unitPrice = 25.0;
          try {
            const [medRow] = await tx
              .select()
              .from(medicationCatalog)
              .where(and(eq(medicationCatalog.id, batchRow.medicationId || medId), eq(medicationCatalog.tenantId, input.tenantId)));
            const catalogPrice = Number((medRow as any)?.metadata?.unitPrice ?? (medRow as any)?.unitPrice ?? (medRow as any)?.unit_price);
            if (catalogPrice > 0) {
              unitPrice = catalogPrice;
            } else if (batchRow.unitCost && Number(batchRow.unitCost) > 0) {
              unitPrice = Math.round(Number(batchRow.unitCost) * 1.25 * 100) / 100;
            }
          } catch {
            if (batchRow.unitCost && Number(batchRow.unitCost) > 0) {
              unitPrice = Math.round(Number(batchRow.unitCost) * 1.25 * 100) / 100;
            }
          }

          const itemTotal = Math.round(unitPrice * item.quantity * 100) / 100;
          totalBillAmount += itemTotal;

          const newAvailableQty = availableQty - item.quantity;
          const newStatus = newAvailableQty === 0 ? 'DEPLETED' : (batchRow.status || 'ACTIVE');

          await tx
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
          await tx.insert(pharmacyStockMovements).values({
            id: movementId,
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            branchId,
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
        }

        totalBillAmount = Math.round(totalBillAmount * 100) / 100;
        const dispensingStatus = input.isPartial ? 'PARTIALLY_DISPENSED' : 'DISPENSED';

        // 1. Authoritative Encounter Resolution
        let validEncounterId: string | null = null;
        if (input.encounterId && isUuid(input.encounterId)) {
          validEncounterId = input.encounterId;
        }
        if (!validEncounterId) {
          try {
            const [enc] = await tx
              .select()
              .from(encounters)
              .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.patientId, input.patientId)))
              .orderBy(desc(encounters.createdAt))
              .limit(1);
            if (enc) validEncounterId = enc.id;
          } catch {
            // ignore
          }
        }
        if (!validEncounterId) {
          validEncounterId = crypto.randomUUID();
          const deptId = await resolveDepartmentId(tx, input.tenantId);
          try {
            await tx.insert(encounters).values({
              id: validEncounterId,
              tenantId: input.tenantId,
              partnerId,
              organizationId,
              branchId,
              departmentId: deptId,
              patientId: input.patientId,
              encounterNumber: `ENC-PHARM-${Math.floor(100000 + Math.random() * 900000)}`,
              encounterType: 'OPD',
              status: 'COMPLETED',
              chiefComplaint: 'Walk-in Pharmacy Dispensing',
              createdAt: now,
              updatedAt: now
            } as any);
          } catch (encErr) {
            logger.warn('Could not create default encounter for pharmacy dispensing', { error: String(encErr) });
          }
        }

        // 2. Authoritative Prescription Resolution (Foreign Key Compliance)
        let resolvedPrescriptionId = isUuid(input.prescriptionId) ? input.prescriptionId! : null;
        let prescriptionExists = false;
        let existingPrescriptionRow: any = null;
        if (resolvedPrescriptionId) {
          try {
            const [p] = await tx.select().from(pharmacyPrescriptions).where(eq(pharmacyPrescriptions.id, resolvedPrescriptionId));
            if (p) {
              prescriptionExists = true;
              existingPrescriptionRow = p;
            }
          } catch {
            prescriptionExists = false;
          }
        }

        if (existingPrescriptionRow && existingPrescriptionRow.status === 'DISPENSED') {
          throw new AppError({
            message: `Prescription ${resolvedPrescriptionId} has already been fully dispensed`,
            code: ErrorCode.BAD_REQUEST,
            statusCode: 500
          });
        }

        if (!prescriptionExists) {
          if (!resolvedPrescriptionId) {
            resolvedPrescriptionId = crypto.randomUUID();
          }
          const rxNumber = `RX-POS-${Math.floor(100000 + Math.random() * 900000)}`;
          const resolvedDoctorId = await resolveDoctorId(tx, input.tenantId, (input as any).doctorId);

          await tx.insert(pharmacyPrescriptions).values({
            id: resolvedPrescriptionId,
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            branchId,
            prescriptionNumber: rxNumber,
            patientId: input.patientId,
            encounterId: validEncounterId,
            prescribingDoctorId: resolvedDoctorId,
            priority: 'ROUTINE',
            status: input.isPartial ? 'PARTIALLY_DISPENSED' : 'DISPENSED',
            notes: 'Walk-in / POS Pharmacy Dispensing Order',
            prescribedAt: now,
            createdAt: now,
            updatedAt: now
          } as any);
        } else if (existingPrescriptionRow) {
          const nextStatus = input.isPartial ? 'PARTIALLY_DISPENSED' : 'DISPENSED';
          await tx
            .update(pharmacyPrescriptions)
            .set({ status: nextStatus, updatedAt: now } as any)
            .where(eq(pharmacyPrescriptions.id, existingPrescriptionRow.id));
        }

        const dispensingRecord: StoredDispensing = {
          id: dispensingId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          dispensingNumber,
          prescriptionId: resolvedPrescriptionId!,
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


        await tx.insert(pharmacyDispensing).values({
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

        const pharmacyInvoiceId = crypto.randomUUID();
        await tx.insert(billingInvoices).values({
          id: pharmacyInvoiceId,
          tenantId: dispensingRecord.tenantId,
          partnerId: dispensingRecord.partnerId,
          organizationId: dispensingRecord.organizationId,
          branchId: dispensingRecord.branchId,
          patientId: dispensingRecord.patientId,
          encounterId: validEncounterId,
          invoiceNumber,
          invoiceType: 'PHARMACY',
          status: 'PAID',
          subtotal: totalBillAmount.toFixed(2),
          discountTotal: '0.00',
          taxTotal: '0.00',
          roundingAdjustment: '0.00',
          totalAmount: totalBillAmount.toFixed(2),
          paidAmount: totalBillAmount.toFixed(2),
          dueAmount: '0.00',
          currency: 'INR',
          metadata: {
            dispensingId,
            dispensingNumber,
            prescriptionId: resolvedPrescriptionId!
          }
        } as unknown as typeof billingInvoices.$inferInsert);

        for (const it of dispensedItems) {
          await tx.insert(billingInvoiceItems).values({
            id: crypto.randomUUID(),
            tenantId: dispensingRecord.tenantId,
            invoiceId: pharmacyInvoiceId,
            serviceCode: 'PHARMACY',
            description: `Pharmacy Dispensed: ${it.medicationId} (Batch: ${it.batchNumber})`,
            quantity: it.quantity.toFixed(2),
            unitPrice: it.unitPrice.toFixed(2),
            grossAmount: it.totalAmount.toFixed(2),
            discountAmount: '0.00',
            taxAmount: '0.00',
            netAmount: it.totalAmount.toFixed(2)
          } as unknown as typeof billingInvoiceItems.$inferInsert);
        }

        // Generate authoritative receipt and payment record
        const paymentId = crypto.randomUUID();
        const receiptNumber = `REC-PHARM-${Math.floor(100000 + Math.random() * 900000)}`;
        await tx.insert(billingPayments).values({
          id: paymentId,
          tenantId: dispensingRecord.tenantId,
          partnerId: dispensingRecord.partnerId,
          organizationId: dispensingRecord.organizationId,
          branchId: dispensingRecord.branchId,
          invoiceId: pharmacyInvoiceId,
          patientId: dispensingRecord.patientId,
          paymentNumber: `PMT-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: totalBillAmount.toFixed(2),
          paymentMethod: 'CASH',
          currency: 'INR',
          status: 'SUCCESS',
          receivedBy: dispensingRecord.pharmacistId,
          receivedAt: now
        } as unknown as typeof billingPayments.$inferInsert);

        await tx.insert(billingReceipts).values({
          id: crypto.randomUUID(),
          tenantId: dispensingRecord.tenantId,
          partnerId: dispensingRecord.partnerId,
          organizationId: dispensingRecord.organizationId,
          branchId: dispensingRecord.branchId,
          paymentId,
          invoiceId: pharmacyInvoiceId,
          patientId: dispensingRecord.patientId,
          receiptNumber,
          amount: totalBillAmount.toFixed(2),
          paymentMethod: 'CASH',
          issuedBy: dispensingRecord.pharmacistId,
          issuedAt: now,
          status: 'ISSUED'
        } as unknown as typeof billingReceipts.$inferInsert);

        dispensingRecord.receiptNumber = receiptNumber;
        return dispensingRecord;
      });
    } catch (err) {
      if (err instanceof AppError || (err && typeof err === 'object' && ('code' in err || 'statusCode' in err))) {
        throw err;
      }
      logger.error('Failed to record dispensing in database', err);
      throw new AppError({
        message: `Database persistence failed. Medication dispensing aborted: ${(err as any)?.message || String(err)}`,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createReturn(input: CreateReturnInput, dbClient = getDatabase()): Promise<StoredReturn> {
    const db = requireDb(dbClient);
    const now = new Date();
    const returnId = crypto.randomUUID();
    const returnNumber = `RTN-${Math.floor(100000 + Math.random() * 900000)}`;

    const runInTx = typeof (db as any).transaction === 'function' ? (fn: (tx: any) => Promise<any>) => (db as any).transaction(fn) : (fn: (tx: any) => Promise<any>) => fn(db);

    try {
      return await runInTx(async (tx: any) => {
        // 1. Validate Dispensing Record
        const [dispensing] = await tx
          .select()
          .from(pharmacyDispensing)
          .where(and(eq(pharmacyDispensing.id, input.dispensingId), eq(pharmacyDispensing.tenantId, input.tenantId)))
          .limit(1);

        if (!dispensing) {
          throw new AppError({
            message: `Dispensing record '${input.dispensingId}' not found for tenant '${input.tenantId}'.`,
            code: ErrorCode.NOT_FOUND,
            statusCode: 404
          });
        }

        const patientId = input.patientId || dispensing.patientId;
        const { partnerId, organizationId } = await resolvePartnerAndOrg(tx, input.tenantId, input.partnerId || dispensing.partnerId, input.organizationId || dispensing.organizationId);
        const branchId = await resolveBranchId(tx, input.tenantId, input.branchId || dispensing.branchId);

        // 2. Validate Dispensing Items & Batch
        const dispItems = await tx
          .select()
          .from(pharmacyDispensingItems)
          .where(eq(pharmacyDispensingItems.dispensingId, input.dispensingId));

        let targetBatchId = input.batchId;
        let targetMedicationId = input.medicationId;

        if (!targetBatchId && dispItems.length > 0) {
          targetBatchId = dispItems[0].batchId;
          targetMedicationId = targetMedicationId || dispItems[0].medicationId;
        }

        if (!targetBatchId) {
          const [mov] = await tx
            .select()
            .from(pharmacyStockMovements)
            .where(
              and(
                eq(pharmacyStockMovements.referenceId, dispensing.dispensingNumber),
                eq(pharmacyStockMovements.movementType, 'DISPENSE'),
                eq(pharmacyStockMovements.tenantId, input.tenantId)
              )
            )
            .limit(1);
          if (mov) {
            targetBatchId = mov.batchId;
            targetMedicationId = targetMedicationId || mov.medicationId;
          }
        }

        if (!targetBatchId) {
          throw new AppError({
            message: 'Batch ID is required for medication return.',
            code: ErrorCode.VALIDATION_ERROR,
            statusCode: 400
          });
        }

        // Lock batch row FOR UPDATE
        let q: any = tx
          .select()
          .from(pharmacyBatches)
          .where(and(eq(pharmacyBatches.id, targetBatchId), eq(pharmacyBatches.tenantId, input.tenantId)));
        if (typeof q.for === 'function') q = q.for('update');
        const [batch] = await q;

        if (!batch) {
          throw new AppError({
            message: `Batch '${targetBatchId}' not found for return processing.`,
            code: ErrorCode.NOT_FOUND,
            statusCode: 404
          });
        }

        const medId = targetMedicationId || batch.medicationId;
        const condition = input.condition || 'INTACT_SEALED';
        const disposition = input.disposition || (condition === 'INTACT_SEALED' ? 'RESTOCK' : 'QUARANTINE_FOR_DESTRUCTION');

        const beforeQty = batch.availableQuantity;
        let afterQty = beforeQty;

        if (disposition === 'RESTOCK' && condition === 'INTACT_SEALED') {
          afterQty = beforeQty + input.quantity;
          const newStatus = afterQty > 0 && batch.status === 'DEPLETED' ? 'ACTIVE' : batch.status;
          await tx
            .update(pharmacyBatches)
            .set({ availableQuantity: afterQty, status: newStatus, updatedAt: now } as any)
            .where(eq(pharmacyBatches.id, batch.id));
        }

        // 3. Append to Pharmacy Stock Movement Ledger
        const movementId = crypto.randomUUID();
        await tx.insert(pharmacyStockMovements).values({
          id: movementId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          medicationId: medId,
          batchId: batch.id,
          movementType: 'RETURN',
          quantity: disposition === 'RESTOCK' ? input.quantity : 0,
          beforeQuantity: beforeQty,
          afterQuantity: afterQty,
          actorId: input.actorId,
          actorRole: input.actorRole || 'PHARMACIST',
          reason: `Return: ${input.returnReason} (${disposition})`,
          correlationId: `corr-return-${Date.now()}`,
          referenceType: 'RETURN',
          referenceId: returnNumber,
          metadata: {
            condition,
            disposition,
            dispensingId: input.dispensingId,
            notes: input.notes
          }
        } as unknown as typeof pharmacyStockMovements.$inferInsert);

        // 4. Insert into pharmacy_returns
        await tx.insert(pharmacyReturns).values({
          id: returnId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          returnNumber,
          dispensingId: input.dispensingId,
          patientId,
          medicationId: medId,
          batchId: batch.id,
          quantity: input.quantity,
          returnReason: input.returnReason,
          condition,
          disposition,
          actorId: input.actorId,
          actorRole: input.actorRole || 'PHARMACIST',
          notes: input.notes || null,
          metadata: {
            batchNumber: batch.batchNumber,
            beforeQuantity: beforeQty,
            afterQuantity: afterQty
          },
          occurredAt: now
        } as unknown as typeof pharmacyReturns.$inferInsert);

        return {
          id: returnId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          returnNumber,
          dispensingId: input.dispensingId,
          patientId,
          medicationId: medId,
          batchId: batch.id,
          quantity: input.quantity,
          returnReason: input.returnReason,
          condition,
          disposition,
          actorId: input.actorId,
          actorRole: input.actorRole || 'PHARMACIST',
          notes: input.notes || null,
          occurredAt: now
        };
      });
    } catch (err) {
      if (err instanceof AppError || (err && typeof err === 'object' && ('code' in err || 'statusCode' in err))) {
        throw err;
      }
      logger.error('Failed to process medication return in database', err);
      throw new AppError({
        message: `Database persistence failed. Medication return aborted: ${(err as any)?.message || String(err)}`,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getReturns(tenantId: string, branchId?: string, dbClient = getDatabase()): Promise<StoredReturn[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(pharmacyReturns)
        .where(eq(pharmacyReturns.tenantId, tenantId))
        .orderBy(desc(pharmacyReturns.occurredAt));

      let list = (rows || []) as unknown as StoredReturn[];
      if (branchId) list = list.filter(r => r.branchId === branchId);
      return list;
    } catch (err) {
      logger.error('Failed to query pharmacy returns from database', err);
      throw new AppError({
        message: 'Database query failed. Pharmacy returns unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createStockAdjustment(input: CreateStockAdjustmentInput, dbClient = getDatabase()): Promise<StoredStockAdjustment> {
    const db = requireDb(dbClient);
    const now = new Date();
    const adjustmentId = crypto.randomUUID();
    const adjustmentNumber = `ADJ-${Math.floor(100000 + Math.random() * 900000)}`;

    const runInTx = typeof (db as any).transaction === 'function' ? (fn: (tx: any) => Promise<any>) => (db as any).transaction(fn) : (fn: (tx: any) => Promise<any>) => fn(db);

    try {
      return await runInTx(async (tx: any) => {
        const { partnerId, organizationId } = await resolvePartnerAndOrg(tx, input.tenantId, input.partnerId, input.organizationId);
        const branchId = await resolveBranchId(tx, input.tenantId, input.branchId);

        // Lock batch row FOR UPDATE
        let q: any = tx
          .select()
          .from(pharmacyBatches)
          .where(and(eq(pharmacyBatches.id, input.batchId), eq(pharmacyBatches.tenantId, input.tenantId)));
        if (typeof q.for === 'function') q = q.for('update');
        const [batch] = await q;

        if (!batch) {
          throw new AppError({
            message: `Batch '${input.batchId}' not found for adjustment.`,
            code: ErrorCode.NOT_FOUND,
            statusCode: 404
          });
        }

        const beforeQty = batch.availableQuantity;
        const afterQty = beforeQty + input.adjustmentQuantity;

        if (afterQty < 0) {
          throw new AppError({
            message: `Adjustment quantity (${input.adjustmentQuantity}) cannot reduce available stock below 0 (current: ${beforeQty}).`,
            code: ErrorCode.VALIDATION_ERROR,
            statusCode: 400
          });
        }

        const newStatus = afterQty === 0 ? 'DEPLETED' : (batch.status === 'DEPLETED' && afterQty > 0 ? 'ACTIVE' : batch.status);

        await tx
          .update(pharmacyBatches)
          .set({ availableQuantity: afterQty, status: newStatus, updatedAt: now } as any)
          .where(eq(pharmacyBatches.id, batch.id));

        // Insert into pharmacy_stock_movements
        await tx.insert(pharmacyStockMovements).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          medicationId: input.medicationId,
          batchId: batch.id,
          movementType: 'ADJUSTMENT',
          quantity: input.adjustmentQuantity,
          beforeQuantity: beforeQty,
          afterQuantity: afterQty,
          actorId: input.actorId,
          actorRole: input.actorRole || 'PHARMACIST',
          reason: `Adjustment: ${input.reason} (${input.justification})`,
          correlationId: `corr-adj-${Date.now()}`,
          referenceType: 'STOCK_ADJUSTMENT',
          referenceId: adjustmentNumber
        } as unknown as typeof pharmacyStockMovements.$inferInsert);

        // Insert into pharmacy_stock_adjustments
        await tx.insert(pharmacyStockAdjustments).values({
          id: adjustmentId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          adjustmentNumber,
          medicationId: input.medicationId,
          batchId: batch.id,
          reason: input.reason,
          justification: input.justification,
          beforeQuantity: beforeQty,
          adjustmentQuantity: input.adjustmentQuantity,
          afterQuantity: afterQty,
          actorId: input.actorId,
          actorRole: input.actorRole || 'PHARMACIST',
          approvedBy: input.approvedBy || null,
          approvedAt: input.approvedBy ? now : null,
          occurredAt: now
        } as unknown as typeof pharmacyStockAdjustments.$inferInsert);

        return {
          id: adjustmentId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          adjustmentNumber,
          medicationId: input.medicationId,
          batchId: batch.id,
          reason: input.reason,
          justification: input.justification,
          beforeQuantity: beforeQty,
          adjustmentQuantity: input.adjustmentQuantity,
          afterQuantity: afterQty,
          actorId: input.actorId,
          actorRole: input.actorRole || 'PHARMACIST',
          approvedBy: input.approvedBy || null,
          approvedAt: input.approvedBy ? now : null,
          occurredAt: now
        };
      });
    } catch (err) {
      if (err instanceof AppError || (err && typeof err === 'object' && ('code' in err || 'statusCode' in err))) {
        throw err;
      }
      logger.error('Failed to create stock adjustment in database', err);
      throw new AppError({
        message: `Database persistence failed. Stock adjustment aborted: ${(err as any)?.message || String(err)}`,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getAdjustments(tenantId: string, branchId?: string, dbClient = getDatabase()): Promise<StoredStockAdjustment[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(pharmacyStockAdjustments)
        .where(eq(pharmacyStockAdjustments.tenantId, tenantId))
        .orderBy(desc(pharmacyStockAdjustments.occurredAt));

      let list = (rows || []) as unknown as StoredStockAdjustment[];
      if (branchId) list = list.filter(a => a.branchId === branchId);
      return list;
    } catch (err) {
      logger.error('Failed to query pharmacy stock adjustments from database', err);
      throw new AppError({
        message: 'Database query failed. Pharmacy adjustments unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createBatchRecall(batchId: string, reason: string, actorId: string, tenantId: string, dbClient = getDatabase()): Promise<BatchRecallResult> {
    const db = requireDb(dbClient);
    const now = new Date();

    const runInTx = typeof (db as any).transaction === 'function' ? (fn: (tx: any) => Promise<any>) => (db as any).transaction(fn) : (fn: (tx: any) => Promise<any>) => fn(db);

    try {
      return await runInTx(async (tx: any) => {
        let q: any = tx
          .select()
          .from(pharmacyBatches)
          .where(and(eq(pharmacyBatches.id, batchId), eq(pharmacyBatches.tenantId, tenantId)));
        if (typeof q.for === 'function') q = q.for('update');
        const [batch] = await q;

        if (!batch) {
          throw new AppError({
            message: `Batch '${batchId}' not found for recall.`,
            code: ErrorCode.NOT_FOUND,
            statusCode: 404
          });
        }

        // 1. Immediately block the batch
        await tx
          .update(pharmacyBatches)
          .set({
            status: 'BLOCKED',
            blockReason: `RECALL: ${reason}`,
            blockedBy: actorId,
            blockedAt: now,
            updatedAt: now
          } as any)
          .where(eq(pharmacyBatches.id, batch.id));

        // 2. Append to pharmacy_stock_movements (Quarantine)
        await tx.insert(pharmacyStockMovements).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: batch.partnerId,
          organizationId: batch.organizationId,
          branchId: batch.branchId,
          medicationId: batch.medicationId,
          batchId: batch.id,
          movementType: 'EXPIRY',
          quantity: 0,
          beforeQuantity: batch.availableQuantity,
          afterQuantity: batch.availableQuantity,
          actorId,
          actorRole: 'PHARMACIST',
          reason: `Batch Recall Quarantined: ${reason}`,
          correlationId: `corr-recall-${Date.now()}`,
          referenceType: 'BATCH_RECALL',
          referenceId: batch.batchNumber,
          metadata: {
            quarantinedQuantity: batch.availableQuantity,
            recallReason: reason
          }
        } as unknown as typeof pharmacyStockMovements.$inferInsert);

        // 3. Query all affected dispensations for recall traceability
        const dispItems = await tx
          .select()
          .from(pharmacyDispensingItems)
          .where(eq(pharmacyDispensingItems.batchId, batch.id));

        const affectedDispensations: BatchRecallResult['affectedDispensations'] = [];
        for (const item of dispItems || []) {
          const [disp] = await tx
            .select()
            .from(pharmacyDispensing)
            .where(eq(pharmacyDispensing.id, item.dispensingId))
            .limit(1);
          if (disp) {
            affectedDispensations.push({
              dispensingId: disp.id,
              dispensingNumber: disp.dispensingNumber,
              patientId: disp.patientId,
              quantity: item.quantity,
              dispensedAt: disp.createdAt
            });
          }
        }

        if (affectedDispensations.length === 0) {
          const movements = await tx
            .select()
            .from(pharmacyStockMovements)
            .where(
              and(
                eq(pharmacyStockMovements.batchId, batch.id),
                eq(pharmacyStockMovements.movementType, 'DISPENSE'),
                eq(pharmacyStockMovements.tenantId, tenantId)
              )
            );
          for (const m of movements || []) {
            if (m.referenceId) {
              const [disp] = await tx
                .select()
                .from(pharmacyDispensing)
                .where(
                  and(
                    eq(pharmacyDispensing.dispensingNumber, m.referenceId),
                    eq(pharmacyDispensing.tenantId, tenantId)
                  )
                )
                .limit(1);
              if (disp) {
                affectedDispensations.push({
                  dispensingId: disp.id,
                  dispensingNumber: disp.dispensingNumber,
                  patientId: disp.patientId,
                  quantity: Math.abs(Number(m.quantity)),
                  dispensedAt: (disp as any).createdAt || m.occurredAt
                });
              }
            }
          }
        }

        return {
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          status: 'BLOCKED',
          blockReason: `RECALL: ${reason}`,
          blockedAt: now,
          quarantinedQuantity: batch.availableQuantity,
          affectedDispensations
        };
      });
    } catch (err) {
      if (err instanceof AppError || (err && typeof err === 'object' && ('code' in err || 'statusCode' in err))) {
        throw err;
      }
      logger.error('Failed to create batch recall in database', err);
      throw new AppError({
        message: `Database persistence failed. Batch recall aborted: ${(err as any)?.message || String(err)}`,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async unblockBatch(batchId: string, _actorId: string, tenantId: string, dbClient = getDatabase()): Promise<StoredBatch> {
    const db = requireDb(dbClient);
    const now = new Date();

    const [batch] = await db
      .select()
      .from(pharmacyBatches)
      .where(and(eq(pharmacyBatches.id, batchId), eq(pharmacyBatches.tenantId, tenantId)))
      .limit(1);

    if (!batch) {
      throw new AppError({
        message: `Batch '${batchId}' not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const nextStatus = batch.availableQuantity > 0 ? 'ACTIVE' : 'DEPLETED';

    await db
      .update(pharmacyBatches)
      .set({
        status: nextStatus,
        blockReason: null,
        blockedBy: null,
        blockedAt: null,
        updatedAt: now
      } as any)
      .where(eq(pharmacyBatches.id, batch.id));

    return {
      ...(batch as unknown as StoredBatch),
      status: nextStatus,
      updatedAt: now
    };
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

  async getInventorySnapshot(tenantId: string, dbClient = getDatabase()): Promise<{
    medications: StoredMedication[];
    batches: StoredBatch[];
    snapshotAt: string;
  }> {
    const db = requireDb(dbClient);
    try {
      const [meds, batches] = await Promise.all([
        this.getMedications(tenantId, undefined, db),
        this.getBatches(tenantId, undefined, db)
      ]);
      return {
        medications: meds,
        batches: batches.filter((b) => b.status === 'ACTIVE' || Number(b.availableQuantity) > 0),
        snapshotAt: new Date().toISOString()
      };
    } catch (err) {
      logger.error('Failed to get inventory snapshot', err);
      throw new AppError({
        message: 'Database query failed. Inventory snapshot unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  private syncedOfflineInvoiceIds: Set<string> = new Set<string>();

  async syncOfflineInvoices(
    tenantId: string,
    invoices: Array<{
      clientInvoiceId: string;
      invoiceNumber: string;
      patientName: string;
      patientPhone?: string | undefined;
      patientUhid?: string | undefined;
      doctorName?: string | undefined;
      doctorNmcReg?: string | undefined;
      paymentMode?: string | undefined;
      createdAt: string;
      items: Array<{
        medicationId?: string | undefined;
        batchId?: string | undefined;
        batchNumber?: string | undefined;
        quantity: number;
        unitPrice: number;
      }>;
      grandTotal: number;
    }>,
    pharmacistId: string,
    dbClient = getDatabase()
  ): Promise<{
    syncedCount: number;
    duplicateCount: number;
    results: Array<{
      clientInvoiceId: string;
      invoiceNumber: string;
      status: 'SYNCED' | 'ALREADY_SYNCED' | 'FAILED';
      duplicate: boolean;
      error?: string;
    }>;
  }> {
    const db = requireDb(dbClient);
    const results: Array<{
      clientInvoiceId: string;
      invoiceNumber: string;
      status: 'SYNCED' | 'ALREADY_SYNCED' | 'FAILED';
      duplicate: boolean;
      error?: string;
    }> = [];
    let syncedCount = 0;
    let duplicateCount = 0;
    const isUuid = (val?: string): boolean => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    for (const inv of invoices) {
      try {
        // Idempotency: Check both in-memory set and database records
        const isDuplicateInMemory = this.syncedOfflineInvoiceIds.has(inv.clientInvoiceId) || this.syncedOfflineInvoiceIds.has(inv.invoiceNumber);
        let existingInDb = false;

        if (isUuid(tenantId)) {
          try {
            const existing = await db
              .select({ id: pharmacyDispensing.id })
              .from(pharmacyDispensing)
              .where(
                and(
                  eq(pharmacyDispensing.tenantId, tenantId),
                  eq(pharmacyDispensing.dispensingNumber, `DISP-OFF-${inv.invoiceNumber}`)
                )
              )
              .limit(1);
            existingInDb = !!(existing && existing.length > 0);
          } catch {}
        }

        if (isDuplicateInMemory || existingInDb) {
          results.push({
            clientInvoiceId: inv.clientInvoiceId,
            invoiceNumber: inv.invoiceNumber,
            status: 'ALREADY_SYNCED',
            duplicate: true
          });
          duplicateCount++;
          continue;
        }

        this.syncedOfflineInvoiceIds.add(inv.clientInvoiceId);
        this.syncedOfflineInvoiceIds.add(inv.invoiceNumber);

        // Process batch deductions
        const { partnerId, organizationId } = await resolvePartnerAndOrg(db, tenantId);
        const branchId = await resolveBranchId(db, tenantId);
        const now = new Date();

        for (const it of inv.items) {
          if ((it.batchId && isUuid(it.batchId)) || (it.medicationId && isUuid(it.medicationId))) {
            try {
              let batch: any = null;
              if (it.batchId && isUuid(it.batchId)) {
                const [b] = await db
                  .select()
                  .from(pharmacyBatches)
                  .where(and(eq(pharmacyBatches.id, it.batchId), eq(pharmacyBatches.tenantId, tenantId)))
                  .limit(1);
                batch = b;
              } else if (it.medicationId) {
                const [b] = await db
                  .select()
                  .from(pharmacyBatches)
                  .where(and(eq(pharmacyBatches.medicationId, it.medicationId), eq(pharmacyBatches.tenantId, tenantId)))
                  .orderBy(asc(pharmacyBatches.expiryDate))
                  .limit(1);
                batch = b;
              }

              if (batch) {
                const currentAvailable = Number(batch.availableQuantity ?? 0);
                const nextQty = Math.max(0, currentAvailable - it.quantity);
                await db
                  .update(pharmacyBatches)
                  .set({
                    availableQuantity: nextQty,
                    status: nextQty === 0 ? 'DEPLETED' : batch.status,
                    updatedAt: now
                  } as any)
                  .where(eq(pharmacyBatches.id, batch.id));

                await db.insert(pharmacyStockMovements).values({
                  id: crypto.randomUUID(),
                  tenantId,
                  partnerId,
                  organizationId,
                  branchId,
                  medicationId: batch.medicationId,
                  batchId: batch.id,
                  movementType: 'DISPENSATION',
                  quantity: it.quantity,
                  beforeQuantity: currentAvailable,
                  afterQuantity: nextQty,
                  actorId: pharmacistId,
                  actorRole: 'PHARMACIST',
                  reason: `Offline Billing PWA Sync: ${inv.invoiceNumber}`,
                  correlationId: `corr-off-${inv.clientInvoiceId.slice(0, 8)}`,
                  referenceType: 'DISPENSATION',
                  referenceId: inv.invoiceNumber,
                  occurredAt: now
                } as any);
              }
            } catch (errBatch) {
              logger.warn('Non-blocking offline batch decrement notice', { invoice: inv.invoiceNumber, err: errBatch });
            }
          }
        }

        // Record offline dispensing event
        const placeholderRxId = crypto.randomUUID();
        const placeholderEncId = crypto.randomUUID();
        const deptId = await resolveDepartmentId(db, tenantId);

        let patientId: string | null = null;
        try {
          const [foundPt] = await db.select({ id: patients.id }).from(patients).where(eq(patients.tenantId, tenantId)).limit(1);
          if (foundPt?.id) patientId = foundPt.id;
        } catch {}
        if (!patientId) {
          const newPtId = crypto.randomUUID();
          await db.insert(patients).values({
            id: newPtId,
            tenantId,
            partnerId,
            organizationId,
            branchId,
            mrn: `MRN-POS-${inv.invoiceNumber}`,
            firstName: inv.patientName || 'Counter',
            lastName: 'Customer',
            dateOfBirth: '1990-01-01',
            gender: 'UNKNOWN',
            phoneNumber: inv.patientPhone || '+919000000000',
            status: 'ACTIVE'
          } as any).onConflictDoNothing();
          patientId = newPtId;
        }

        try {
          await db.insert(encounters).values({
            id: placeholderEncId,
            tenantId,
            partnerId,
            organizationId,
            branchId,
            departmentId: deptId,
            patientId,
            encounterNumber: `ENC-OFF-${inv.invoiceNumber}`,
            encounterType: 'OPD',
            status: 'COMPLETED',
            chiefComplaint: `Offline PWA Counter Dispense (${inv.patientName || 'Walk-in'})`,
            createdAt: now,
            updatedAt: now
          } as any);

          await db.insert(pharmacyPrescriptions).values({
            id: placeholderRxId,
            tenantId,
            partnerId,
            organizationId,
            branchId,
            prescriptionNumber: `RX-OFF-${inv.invoiceNumber}`,
            patientId,
            encounterId: placeholderEncId,
            prescribingDoctorId: await resolveDoctorId(db, tenantId),
            priority: 'ROUTINE',
            status: 'DISPENSED',
            notes: `Offline PWA Prescription (${inv.doctorName || 'Walk-in Prescriber'})`,
            prescribedAt: now,
            createdAt: now,
            updatedAt: now
          } as any);

          await db.insert(pharmacyDispensing).values({
            id: crypto.randomUUID(),
            tenantId,
            partnerId,
            organizationId,
            branchId,
            dispensingNumber: `DISP-OFF-${inv.invoiceNumber}`,
            prescriptionId: placeholderRxId,
            patientId,
            pharmacistId,
            pharmacistName: 'PWA Offline Sync Pharmacist',
            dispensingStatus: 'DISPENSED',
            dispensingMode: 'OUTPATIENT_COUNTER',
            counselingProvided: true,
            dispensedAt: new Date(inv.createdAt || Date.now()),
            metadata: {
              offlineSync: true,
              clientInvoiceId: inv.clientInvoiceId,
              invoiceNumber: inv.invoiceNumber,
              patientName: inv.patientName,
              patientPhone: inv.patientPhone,
              patientUhid: inv.patientUhid,
              doctorName: inv.doctorName,
              doctorNmcReg: inv.doctorNmcReg,
              paymentMode: inv.paymentMode,
              grandTotal: inv.grandTotal,
              itemCount: inv.items?.length || 0,
              syncedAt: now.toISOString()
            },
            createdAt: now,
            updatedAt: now
          } as any);
        } catch (insertErr) {
          logger.warn('Non-blocking offline sync record creation warning', { invoice: inv.invoiceNumber, error: insertErr });
        }

        results.push({
          clientInvoiceId: inv.clientInvoiceId,
          invoiceNumber: inv.invoiceNumber,
          status: 'SYNCED',
          duplicate: false
        });
        syncedCount++;
      } catch (errInv) {
        logger.error('Failed to sync offline invoice', { invoice: inv.invoiceNumber, error: errInv });
        results.push({
          clientInvoiceId: inv.clientInvoiceId,
          invoiceNumber: inv.invoiceNumber,
          status: 'FAILED',
          duplicate: false,
          error: errInv instanceof Error ? errInv.message : String(errInv)
        });
      }
    }

    return {
      syncedCount,
      duplicateCount,
      results
    };
  }

  /**
   * DEVELOPMENT/TEST ONLY: Seed realistic mock stock without purchase bills.
   * Strictly isolated with source: 'DEVELOPMENT_TEST' marker.
   */
  async seedDevMockStock(
    tenantId: string,
    providedBranchId?: string,
    actorId = 'dev-tester@docsearch.local',
    dbClient = getDatabase()
  ): Promise<{
    success: boolean;
    seededCount: number;
    batches: StoredBatch[];
    medicationsCreated: number;
  }> {
    const db = requireDb(dbClient);
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, tenantId);
    const branchId = await resolveBranchId(db, tenantId, providedBranchId);
    const now = new Date();

    const DEV_MOCK_STOCK_ITEMS = [
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
        expiry: '2027-12-31T23:59:59.000Z',
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
        expiry: '2027-10-31T23:59:59.000Z',
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
        expiry: '2028-01-31T23:59:59.000Z',
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
        expiry: '2027-09-30T23:59:59.000Z',
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
        expiry: '2028-03-31T23:59:59.000Z',
        manufacturer: 'TEST-MANUFACTURER',
        category: 'GENERAL'
      }
    ];

    const seededBatches: StoredBatch[] = [];
    let medicationsCreated = 0;

    for (const item of DEV_MOCK_STOCK_ITEMS) {
      // 1. Resolve medicine master record without creating duplicates
      let medId: string | null = null;

      const existingMeds = await db
        .select()
        .from(medicationCatalog)
        .where(eq(medicationCatalog.tenantId, tenantId));

      const matchedMed = (existingMeds || []).find((m: any) => {
        if (m.medicationCode && m.medicationCode.toLowerCase() === item.code.toLowerCase()) return true;
        if (m.genericName && m.genericName.toLowerCase().includes(item.generic.toLowerCase())) {
          if (!item.strength || (m.strength && m.strength.toLowerCase().replace(/\s/g, '').includes(item.strength.toLowerCase().replace(/\s/g, '')))) {
            return true;
          }
        }
        if (m.brandName && m.brandName.toLowerCase().includes(item.name.toLowerCase())) return true;
        return false;
      });

      if (matchedMed) {
        medId = matchedMed.id;
      } else {
        const newMedId = crypto.randomUUID();
        await db.insert(medicationCatalog).values({
          id: newMedId,
          tenantId,
          partnerId,
          organizationId,
          branchId,
          medicationCode: item.code,
          genericName: item.generic,
          brandName: item.name,
          strength: item.strength,
          dosageForm: item.dosageForm,
          route: 'ORAL',
          packSize: 1,
          unitOfMeasure: item.unit,
          manufacturer: item.manufacturer,
          category: 'DEVELOPMENT_TEST',
          controlledMedication: false,
          prescriptionRequired: false,
          status: 'ACTIVE',
          therapeuticClass: 'DEVELOPMENT_TEST',
          metadata: {
            name: item.name,
            source: 'DEVELOPMENT_TEST',
            isDevMock: true,
            unitPrice: item.sellingPrice
          },
          createdAt: now,
          updatedAt: now
        } as unknown as typeof medicationCatalog.$inferInsert);

        medId = newMedId;
        medicationsCreated++;
      }

      // 2. Check if batch already exists for this branch & medication
      const existingBatches = await db
        .select()
        .from(pharmacyBatches)
        .where(
          and(
            eq(pharmacyBatches.tenantId, tenantId),
            eq(pharmacyBatches.branchId, branchId),
            eq(pharmacyBatches.medicationId, medId),
            eq(pharmacyBatches.batchNumber, item.batch)
          )
        );

      let batchRecord: StoredBatch;

      if (existingBatches && existingBatches.length > 0) {
        // Idempotent update
        const b = existingBatches[0] as unknown as StoredBatch;
        await db
          .update(pharmacyBatches)
          .set({
            availableQuantity: item.quantity,
            receivedQuantity: item.quantity,
            supplierReference: 'DEVELOPMENT_TEST',
            purchaseReference: 'DEVELOPMENT_TEST',
            unitCost: item.purchasePrice.toFixed(2),
            status: 'ACTIVE',
            metadata: {
              source: 'DEVELOPMENT_TEST',
              isDevMockStock: true,
              sellingPrice: item.sellingPrice
            },
            updatedAt: now
          } as any)
          .where(eq(pharmacyBatches.id, b.id));

        batchRecord = {
          ...b,
          availableQuantity: item.quantity,
          receivedQuantity: item.quantity,
          unitCost: item.purchasePrice,
          purchaseReference: 'DEVELOPMENT_TEST',
          supplierReference: 'DEVELOPMENT_TEST',
          updatedAt: now
        };
      } else {
        const batchId = crypto.randomUUID();
        const expDate = new Date(item.expiry);
        const mfgDate = new Date('2026-01-01T00:00:00.000Z');

        await db.insert(pharmacyBatches).values({
          id: batchId,
          tenantId,
          partnerId,
          organizationId,
          branchId,
          medicationId: medId,
          batchNumber: item.batch,
          manufacturer: item.manufacturer,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          receivedQuantity: item.quantity,
          availableQuantity: item.quantity,
          reservedQuantity: 0,
          unitCost: item.purchasePrice.toFixed(2),
          purchaseReference: 'DEVELOPMENT_TEST',
          supplierReference: 'DEVELOPMENT_TEST',
          status: 'ACTIVE',
          metadata: {
            source: 'DEVELOPMENT_TEST',
            isDevMockStock: true,
            sellingPrice: item.sellingPrice
          },
          createdAt: now,
          updatedAt: now
        } as unknown as typeof pharmacyBatches.$inferInsert);

        batchRecord = {
          id: batchId,
          tenantId,
          partnerId,
          organizationId,
          branchId,
          medicationId: medId,
          batchNumber: item.batch,
          manufacturer: item.manufacturer,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          receivedQuantity: item.quantity,
          availableQuantity: item.quantity,
          unitCost: item.purchasePrice,
          purchaseReference: 'DEVELOPMENT_TEST',
          supplierReference: 'DEVELOPMENT_TEST',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        };

        // 3. Insert Legitimate Stock Movement Ledger Entry
        await db.insert(pharmacyStockMovements).values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId,
          organizationId,
          branchId,
          medicationId: medId,
          batchId,
          movementType: 'RECEIPT',
          quantity: item.quantity,
          beforeQuantity: 0,
          afterQuantity: item.quantity,
          actorId,
          actorRole: 'PHARMACIST',
          reason: 'Development Mock Stock Intake (DEVELOPMENT_TEST)',
          correlationId: `DEV-CORR-${Date.now()}-${item.batch}`,
          referenceType: 'DEVELOPMENT_TEST',
          referenceId: 'DEV-TEST-MOCK-STOCK',
          occurredAt: now,
          metadata: {
            source: 'DEVELOPMENT_TEST',
            isDevMockStock: true,
            batchNumber: item.batch
          }
        } as unknown as typeof pharmacyStockMovements.$inferInsert);
      }

      // 4. Update or Insert branch pharmacy_inventory
      try {
        const [existingInv] = await db
          .select()
          .from(pharmacyInventory)
          .where(
            and(
              eq(pharmacyInventory.tenantId, tenantId),
              eq(pharmacyInventory.branchId, branchId),
              eq(pharmacyInventory.medicationId, medId)
            )
          );

        if (existingInv) {
          await db
            .update(pharmacyInventory)
            .set({
              availableQuantity: existingInv.availableQuantity + item.quantity,
              lastStockMovementAt: now,
              updatedAt: now
            })
            .where(eq(pharmacyInventory.id, existingInv.id));
        } else {
          await db.insert(pharmacyInventory).values({
            id: crypto.randomUUID(),
            tenantId,
            partnerId,
            organizationId,
            branchId,
            medicationId: medId,
            availableQuantity: item.quantity,
            reservedQuantity: 0,
            damagedQuantity: 0,
            expiredQuantity: 0,
            reorderLevel: 50,
            reorderQuantity: 200,
            lastStockMovementAt: now,
            metadata: {
              source: 'DEVELOPMENT_TEST'
            },
            createdAt: now,
            updatedAt: now
          } as unknown as typeof pharmacyInventory.$inferInsert);
        }
      } catch (invErr) {
        logger.warn('Non-fatal inventory aggregate table update notice', { error: String(invErr) });
      }

      seededBatches.push(batchRecord);
    }

    return {
      success: true,
      seededCount: seededBatches.length,
      batches: seededBatches,
      medicationsCreated
    };
  }

  /**
   * DEVELOPMENT/TEST ONLY: Cleanup development test stock.
   * Removes ONLY records marked as DEVELOPMENT_TEST.
   * Real medicines, real batches, real transactions remain 100% untouched.
   */
  async cleanupDevMockStock(
    tenantId: string,
    _providedBranchId?: string,
    dbClient = getDatabase()
  ): Promise<{
    success: boolean;
    removedBatchesCount: number;
    removedMovementsCount: number;
    removedMedicationsCount: number;
  }> {
    const db = requireDb(dbClient);
    const testBatchNumbers = ['TEST-PARA-001', 'TEST-AMOX-001', 'TEST-PANTO-001', 'TEST-AZI-001', 'TEST-ORS-001'];

    // 1. Find test batches
    const batches = await db
      .select({ id: pharmacyBatches.id, medicationId: pharmacyBatches.medicationId, branchId: pharmacyBatches.branchId })
      .from(pharmacyBatches)
      .where(
        and(
          eq(pharmacyBatches.tenantId, tenantId),
          or(
            eq(pharmacyBatches.supplierReference, 'DEVELOPMENT_TEST'),
            eq(pharmacyBatches.purchaseReference, 'DEVELOPMENT_TEST'),
            inArray(pharmacyBatches.batchNumber, testBatchNumbers)
          )
        )
      );

    const batchIds = (batches || []).map((b: any) => b.id);
    const medicationIds = Array.from(new Set((batches || []).map((b: any) => b.medicationId as string)));

    // 2. Delete test stock movements
    let removedMovementsCount = 0;
    try {
      const deletedMovs = await db
        .delete(pharmacyStockMovements)
        .where(
          and(
            eq(pharmacyStockMovements.tenantId, tenantId),
            or(
              eq(pharmacyStockMovements.referenceType, 'DEVELOPMENT_TEST'),
              eq(pharmacyStockMovements.referenceId, 'DEV-TEST-MOCK-STOCK'),
              batchIds.length > 0 ? inArray(pharmacyStockMovements.batchId, batchIds) : eq(pharmacyStockMovements.id, '00000000-0000-0000-0000-000000000000')
            )
          )
        )
        .returning();
      removedMovementsCount = deletedMovs ? deletedMovs.length : 0;
    } catch (e) {
      logger.warn('Cleanup stock movements notice', { error: String(e) });
    }

    // 3. Delete test batches
    let removedBatchesCount = 0;
    if (batchIds.length > 0) {
      const deletedBatches = await db
        .delete(pharmacyBatches)
        .where(
          and(
            eq(pharmacyBatches.tenantId, tenantId),
            inArray(pharmacyBatches.id, batchIds)
          )
        )
        .returning();
      removedBatchesCount = deletedBatches ? deletedBatches.length : 0;
    }

    // 4. Update/recalculate pharmacy_inventory for affected medications
    for (const mId of medicationIds) {
      try {
        const remainingBatches = await db
          .select({ availableQuantity: pharmacyBatches.availableQuantity })
          .from(pharmacyBatches)
          .where(
            and(
              eq(pharmacyBatches.tenantId, tenantId),
              eq(pharmacyBatches.medicationId, mId)
            )
          );
        const totalRemaining = (remainingBatches || []).reduce((sum: number, b: any) => sum + (b.availableQuantity || 0), 0);

        if (totalRemaining > 0) {
          await db
            .update(pharmacyInventory)
            .set({ availableQuantity: totalRemaining, updatedAt: new Date() })
            .where(
              and(
                eq(pharmacyInventory.tenantId, tenantId),
                eq(pharmacyInventory.medicationId, mId)
              )
            );
        } else {
          // If no remaining batches, and the medication itself is dev test, delete inventory row
          await db
            .delete(pharmacyInventory)
            .where(
              and(
                eq(pharmacyInventory.tenantId, tenantId),
                eq(pharmacyInventory.medicationId, mId)
              )
            );
        }
      } catch {}
    }

    // 5. Delete test-created medication catalog items ONLY (never delete real medicines!)
    let removedMedicationsCount = 0;
    try {
      const deletedMeds = await db
        .delete(medicationCatalog)
        .where(
          and(
            eq(medicationCatalog.tenantId, tenantId),
            eq(medicationCatalog.category, 'DEVELOPMENT_TEST')
          )
        )
        .returning();
      removedMedicationsCount = deletedMeds ? deletedMeds.length : 0;
    } catch (e) {
      logger.warn('Cleanup dev medication catalog notice', { error: String(e) });
    }

    return {
      success: true,
      removedBatchesCount,
      removedMovementsCount,
      removedMedicationsCount
    };
  }
}

export const pharmacyManagementRepository = new PharmacyManagementRepository();
