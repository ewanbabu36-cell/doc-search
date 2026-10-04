import crypto from 'node:crypto';
import {
  getDatabase,
  investigationOrders,
  investigationSpecimens,
  investigationResults,
  investigationResultAmendments,
  investigationReports,
  investigationCatalog,
  investigationPanels,
  investigationPanelItems,
  investigationAuditTraces,
  criticalPanicValueAlerts,
  doctorProfiles,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  operationalStaff,
  branches,
  partnerProfiles,
  patients,
  encounters,
  eq,
  or,
  and,
  desc,
  asc,
  ilike,
  sql
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { staffAdministrationRepository } from './StaffAdministrationRepository.js';
import { evaluateWestgardRules, CLINICAL_REFERENCE_RANGES } from '../../services/partner/HardwareBridgeService.js';

const logger = createLogger('lab-diagnostics-repository');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for lab diagnostics transaction');
    throw new AppError({
      message: 'Database service is unavailable. Lab diagnostics transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

function runInTx<T>(db: any, fn: (tx: any) => Promise<T>): Promise<T> {
  return typeof db.transaction === 'function' ? db.transaction(fn) : fn(db);
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

  if (providedPartnerId && UUID_REGEX.test(providedPartnerId)) {
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

  if (providedOrgId && UUID_REGEX.test(providedOrgId)) {
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
          facilityType: 'DIAGNOSTIC_CENTER',
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

async function resolveDoctorId(db: any, tenantId: string, providedDoctorId?: string): Promise<string> {
  if (providedDoctorId) {
    if (!UUID_REGEX.test(providedDoctorId)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid doctorId UUID format: '${providedDoctorId}'.`,
        statusCode: 400
      });
    }
    const [doc] = await db
      .select({ id: doctorProfiles.id, tenantId: doctorProfiles.tenantId })
      .from(doctorProfiles)
      .where(or(eq(doctorProfiles.id, providedDoctorId), eq(doctorProfiles.staffId, providedDoctorId)))
      .limit(1);
    if (doc) {
      if (doc.tenantId !== tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Doctor profile '${providedDoctorId}' does not belong to tenant '${tenantId}'.`,
          statusCode: 403
        });
      }
      return doc.id;
    }

    // Check if providedDoctorId belongs to operationalStaff
    const [staff] = await db
      .select()
      .from(operationalStaff)
      .where(eq(operationalStaff.id, providedDoctorId))
      .limit(1);
    if (staff) {
      if (staff.tenantId !== tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Doctor staff member '${providedDoctorId}' does not belong to tenant '${tenantId}'.`,
          statusCode: 403
        });
      }
      const newDocId = crypto.randomUUID();
      const hierarchy = await resolvePartnerAndOrg(db, tenantId);
      const branchId = await resolveBranchId(db, tenantId);
      try {
        await db.insert(doctorProfiles).values({
          id: newDocId,
          tenantId,
          partnerId: hierarchy.partnerId,
          organizationId: hierarchy.organizationId,
          branchId,
          staffId: staff.id,
          doctorCode: `DOC-${staff.staffCode || staff.id.slice(0, 6).toUpperCase()}`,
          status: 'ACTIVE'
        });
        return newDocId;
      } catch {
        return newDocId;
      }
    }
  }

  await resolvePartnerAndOrg(db, tenantId);
  const [doc] = await db
    .select({ id: doctorProfiles.id })
    .from(doctorProfiles)
    .where(eq(doctorProfiles.tenantId, tenantId))
    .limit(1);
  if (doc?.id) return doc.id;

  // Auto-provision a default physician profile for this tenant if none exists
  const hierarchy = await resolvePartnerAndOrg(db, tenantId);
  const branchId = await resolveBranchId(db, tenantId);
  const autoDocId = crypto.randomUUID();
  try {
    await db.insert(doctorProfiles).values({
      id: autoDocId,
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      branchId,
      doctorCode: `DOC-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ACTIVE'
    });
    return autoDocId;
  } catch {
    return autoDocId;
  }
}

async function resolveEncounterId(
  db: any,
  tenantId: string,
  partnerId: string,
  organizationId: string,
  branchId: string,
  patientId: string,
  doctorId: string,
  providedEncounterId?: string
): Promise<string> {
  if (providedEncounterId && UUID_REGEX.test(providedEncounterId)) {
    const [enc] = await db
      .select({ id: encounters.id, tenantId: encounters.tenantId })
      .from(encounters)
      .where(eq(encounters.id, providedEncounterId))
      .limit(1);
    if (enc) {
      if (enc.tenantId !== tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Encounter '${providedEncounterId}' does not belong to tenant '${tenantId}'.`,
          statusCode: 403
        });
      }
      return enc.id;
    }
  }

  // Look for any existing encounter for this patient within this tenant
  const [enc] = await db
    .select({ id: encounters.id })
    .from(encounters)
    .where(and(eq(encounters.tenantId, tenantId), eq(encounters.patientId, patientId)))
    .orderBy(desc(encounters.createdAt))
    .limit(1);
  if (enc?.id) return enc.id;

  // Create an active diagnostic encounter dynamically for this tenant's patient
  const [d] = await db
    .select({ id: operationalDepartments.id })
    .from(operationalDepartments)
    .where(eq(operationalDepartments.tenantId, tenantId))
    .limit(1);
  if (!d?.id) {
    throw new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `No operational department is provisioned for tenant '${tenantId}' to create a diagnostic encounter.`,
      statusCode: 404
    });
  }

  const newEncId = crypto.randomUUID();
  await db.insert(encounters).values({
    id: newEncId,
    tenantId,
    partnerId,
    organizationId,
    branchId,
    departmentId: d.id,
    patientId,
    doctorId,
    encounterNumber: `ENC-LAB-${Math.floor(100000 + Math.random() * 900000)}`,
    encounterType: 'OPD',
    status: 'IN_CONSULTATION',
    chiefComplaint: 'Diagnostic laboratory investigation'
  } as any);
  return newEncId;
}

async function resolveInvestigationCatalogId(
  db: any,
  tenantId: string,
  _partnerId?: string,
  _organizationId?: string,
  _branchId?: string,
  testCode?: string,
  testName?: string,
  _category?: string,
  providedInvestigationId?: string
): Promise<string> {
  if (providedInvestigationId) {
    if (!UUID_REGEX.test(providedInvestigationId)) {
      throw new AppError({
        code: ErrorCode.BAD_REQUEST,
        message: `Invalid investigation catalog UUID format: '${providedInvestigationId}'`,
        statusCode: 400
      });
    }
    const [item] = await db
      .select({ id: investigationCatalog.id, tenantId: investigationCatalog.tenantId })
      .from(investigationCatalog)
      .where(eq(investigationCatalog.id, providedInvestigationId))
      .limit(1);

    if (!item) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Investigation catalog item '${providedInvestigationId}' not found.`,
        statusCode: 404
      });
    }

    if (item.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Investigation catalog item '${providedInvestigationId}' does not belong to tenant '${tenantId}'.`,
        statusCode: 403
      });
    }
    return item.id;
  }

  if (testCode) {
    const [item] = await db
      .select({ id: investigationCatalog.id })
      .from(investigationCatalog)
      .where(and(eq(investigationCatalog.tenantId, tenantId), eq(investigationCatalog.testCode, testCode)))
      .limit(1);
    if (item?.id) return item.id;
    throw new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `Investigation test code '${testCode}' not found in catalog for tenant '${tenantId}'.`,
      statusCode: 404
    });
  }

  if (testName) {
    const [item] = await db
      .select({ id: investigationCatalog.id })
      .from(investigationCatalog)
      .where(and(eq(investigationCatalog.tenantId, tenantId), ilike(investigationCatalog.testName, testName.trim())))
      .limit(1);
    if (item?.id) return item.id;

    const [fuzzy] = await db
      .select({ id: investigationCatalog.id })
      .from(investigationCatalog)
      .where(and(eq(investigationCatalog.tenantId, tenantId), ilike(investigationCatalog.testName, `%${testName.trim()}%`)))
      .limit(1);
    if (fuzzy?.id) return fuzzy.id;

    throw new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `Investigation test '${testName}' not found in catalog for tenant '${tenantId}'.`,
      statusCode: 404
    });
  }

  throw new AppError({
    code: ErrorCode.BAD_REQUEST,
    message: 'Investigation order must provide a valid investigationId, testCode, or testName matching the tenant catalog.',
    statusCode: 400
  });
}

export interface CreateLabOrderInput {
  id?: string | undefined;
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  patientId: string;
  patientName?: string | undefined;
  patientMrn?: string | undefined;
  patientAge?: string | undefined;
  patientGender?: string | undefined;
  patientPhone?: string | undefined;
  encounterId?: string | undefined;
  encounterNumber?: string | undefined;
  consultationId?: string | undefined;
  orderingDoctorId?: string | undefined;
  orderingDoctorName?: string | undefined;
  investigationId?: string | undefined;
  testCode?: string | undefined;
  testName?: string | undefined;
  tests?: string[] | undefined;
  category?: string | undefined;
  priority?: string | undefined;
  clinicalIndication?: string | undefined;
  clinicalNotes?: string | undefined;
  instructions?: string | undefined;
  billingPolicy?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface CollectSpecimenInput {
  tenantId: string;
  orderId: string;
  patientId?: string | undefined;
  specimenType: string;
  containerType?: string | undefined;
  collectionSite?: string | undefined;
  collectedBy: string;
  collectionNotes?: string | undefined;
  deferredBilling?: boolean | undefined;
  isEmergency?: boolean | undefined;
}

export interface EnterResultItem {
  parameterCode?: string | undefined;
  parameterName?: string | undefined;
  testCode?: string | undefined;
  resultValue?: string | undefined;
  value?: string | number | undefined;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRange?: string | undefined;
  refRange?: string | undefined;
  abnormalFlag?: string | undefined;
  flag?: string | undefined;
  notes?: string | undefined;
  isCritical?: boolean | undefined;
  qualitativeInterpretation?: string | undefined;
}

export interface EnterResultInput {
  tenantId: string;
  orderId: string;
  specimenId?: string | undefined;
  parameterCode?: string | undefined;
  parameterName?: string | undefined;
  resultValue?: string | undefined;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRange?: string | undefined;
  abnormalFlag?: string | undefined;
  notes?: string | undefined;
  enteredBy?: string | undefined;
  results?: EnterResultItem[] | undefined;
}

export interface StoredLabOrder {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  organizationName?: string | undefined;
  branchId?: string | undefined;
  branchName?: string | undefined;
  patientId: string;
  patientName?: string | undefined;
  patientMrn?: string | undefined;
  patientGender?: string | undefined;
  patientDob?: string | undefined;
  encounterId?: string | undefined;
  encounterNumber?: string | undefined;
  consultationId?: string | undefined;
  orderNumber: string;
  investigationId?: string | undefined;
  testCode: string;
  testName: string;
  investigationCode?: string | undefined;
  investigationName?: string | undefined;
  category: string;
  investigationCategory?: string | undefined;
  priority: string;
  status: string;
  clinicalIndication?: string | undefined;
  instructions?: string | undefined;
  orderingDoctorId: string;
  orderingDoctorName?: string | undefined;
  orderedAt: Date;
  updatedAt: Date;
  specimen?: any;
  specimens: any[];
  results: any[];
  report?: any;
  verifiedBy?: string | undefined;
  verifiedAt?: Date | undefined;
  reviewedBy?: string | undefined;
  reviewedAt?: Date | undefined;
  doctorNotes?: string | undefined;
  cancelledAt?: Date | undefined;
  cancelledBy?: string | undefined;
  cancellationReason?: string | undefined;
  isAbnormal?: boolean | undefined;
  isCritical?: boolean | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface AccessionSpecimenInput {
  specimenId?: string | undefined;
  containerType?: string | undefined;
  collectionSite?: string | undefined;
  receivedBy: string;
  qualityRemarks?: string | undefined;
  workstationId?: string | undefined;
}

export interface StartProcessingInput {
  analyzerId?: string | undefined;
  workstationId?: string | undefined;
  technicianId?: string | undefined;
  notes?: string | undefined;
}

export interface RejectSpecimenInput {
  specimenId?: string | undefined;
  rejectionReason: string;
  remarks?: string | undefined;
  rejectedBy: string;
}

export interface RecollectSpecimenInput {
  previousSpecimenId?: string | undefined;
  specimenType?: string | undefined;
  containerType?: string | undefined;
  requestedBy: string;
  notes?: string | undefined;
}

export interface TechnicalValidateInput {
  technicianId: string;
  isAccepted: boolean;
  comments?: string | undefined;
  rejectionReason?: string | undefined;
}

export interface PathologistValidateInput {
  pathologistId: string;
  pathologistName?: string | undefined;
  digitalSignature?: string | undefined;
  clinicalImpression?: string | undefined;
  recommendations?: string | undefined;
}

export interface DeliverReportInput {
  deliveryChannel: 'PATIENT_PORTAL' | 'PHYSICIAN_EMR' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PRINT' | string;
  recipient: string;
  deliveredBy?: string | undefined;
  notes?: string | undefined;
}

export interface CreateCatalogTestInput {
  testCode: string;
  testName: string;
  shortName?: string | undefined;
  category?: string | undefined;
  department?: string | undefined;
  specimenType?: string | undefined;
  sampleVolume?: string | undefined;
  turnaroundTargetHours?: number | undefined;
  fastingRequired?: boolean | undefined;
  preparationRequirements?: string | undefined;
  clinicalDescription?: string | undefined;
  status?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface CreatePanelInput {
  panelCode: string;
  panelName: string;
  category?: string | undefined;
  description?: string | undefined;
  testIds: string[];
}

export interface LabQcEvaluationInput {
  analyzerId: string;
  testCode: string;
  targetMean: number;
  standardDeviation: number;
  measuredValue: number;
  lotNumber?: string | undefined;
  operatorId?: string | undefined;
  historyZScores?: number[] | undefined;
}

export class LabDiagnosticsRepository {
  async searchOrders(
    tenantId: string,
    status?: string | undefined,
    patientId?: string | undefined,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(investigationOrders)
        .where(eq(investigationOrders.tenantId, tenantId))
        .orderBy(desc(investigationOrders.createdAt));

      // Batch load specimens
      let specimensMap: Record<string, any[]> = {};
      try {
        const specRows = await db
          .select()
          .from(investigationSpecimens)
          .where(eq(investigationSpecimens.tenantId, tenantId));
        (specRows || []).forEach((s: any) => {
          const arr = specimensMap[s.orderId] || [];
          arr.push(s);
          specimensMap[s.orderId] = arr;
        });
      } catch {}

      // Batch load patient demographics
      let patientsMap: Record<string, any> = {};
      try {
        const patRows = await db
          .select({
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
            mrn: patients.mrn,
            gender: patients.gender,
            dateOfBirth: patients.dateOfBirth
          })
          .from(patients)
          .where(eq(patients.tenantId, tenantId));
        (patRows || []).forEach((p: any) => {
          patientsMap[p.id] = p;
        });
      } catch {}

      // Batch load reports
      let reportsMap: Record<string, any> = {};
      try {
        const repRows = await db
          .select()
          .from(investigationReports)
          .where(eq(investigationReports.tenantId, tenantId));
        (repRows || []).forEach((r: any) => {
          if (r.orderId) reportsMap[r.orderId] = r;
        });
      } catch {}

      // Batch load results from authoritative investigationResults table
      let resultsMap: Record<string, any[]> = {};
      try {
        const resRows = await db
          .select()
          .from(investigationResults)
          .where(eq(investigationResults.tenantId, tenantId))
          .orderBy(asc(investigationResults.createdAt));
        (resRows || []).forEach((r: any) => {
          const arr = resultsMap[r.orderId] || [];
          arr.push(r);
          resultsMap[r.orderId] = arr;
        });
      } catch {}

      let list = (rows || []).map((row: any) => {
        const meta = (typeof row.metadata === 'object' && row.metadata !== null) ? row.metadata : {};
        const pat = patientsMap[row.patientId];
        const orderSpecs = specimensMap[row.id] || (meta.specimens || []);
        const primarySpec = orderSpecs[0] || (meta.specimen || undefined);
        const testName = meta.testName || row.clinicalIndication || 'Investigation';
        const testCode = meta.testCode || 'LAB-TEST';
        const category = meta.category || 'HEMATOLOGY';

        return {
          ...row,
          testName,
          testCode,
          investigationName: testName,
          investigationCode: testCode,
          category,
          investigationCategory: category,
          priority: row.priority || 'ROUTINE',
          status: row.status || 'ORDERED',
          departmentId: (row as any).departmentId || meta.departmentId || meta.orderingDepartment || meta.department || undefined,
          orderingDepartment: (row as any).orderingDepartment || meta.orderingDepartment || meta.departmentId || meta.department || undefined,
          patientName: pat ? `${pat.firstName || ''} ${pat.lastName || ''}`.trim() : (meta.patientName || 'Patient'),
          patientMrn: pat ? pat.mrn : (meta.patientMrn || 'MRN-UNKNOWN'),
          patientGender: pat ? pat.gender : (meta.patientGender || 'MALE'),
          patientDob: pat?.dateOfBirth ? new Date(pat.dateOfBirth).toISOString() : (meta.patientDob || undefined),
          orderingDoctorName: meta.orderingDoctorName || 'Dr. Rajesh Sharma, MD',
          encounterNumber: meta.encounterNumber || 'ENC-LAB-01',
          orderedAt: row.orderedAt || row.createdAt,
          specimen: primarySpec,
          specimens: orderSpecs,
          results: resultsMap[row.id] || meta.results || row.results || [],
          report: reportsMap[row.id] || meta.report || undefined,
          isAbnormal: row.isAbnormal ?? meta.isAbnormal ?? false,
          isCritical: row.isCritical ?? meta.isCritical ?? false
        } as StoredLabOrder;
      });

      if (status) list = list.filter(o => o.status === status);
      if (patientId) list = list.filter(o => o.patientId === patientId);
      return list;
    } catch (err) {
      logger.error('Failed to query lab orders from database', err);
      throw new AppError({
        message: 'Database query failed. Lab orders lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getOrderById(
    tenantId: string,
    orderId: string,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(investigationOrders)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      if (!found) return null;

      let specRows: any[] = [];
      try {
        specRows = await db
          .select()
          .from(investigationSpecimens)
          .where(and(eq(investigationSpecimens.tenantId, tenantId), eq(investigationSpecimens.orderId, orderId)));
      } catch {}

      // Try fetching patient demographics
      let pat: any = null;
      try {
        const [p] = await db
          .select({
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
            mrn: patients.mrn,
            gender: patients.gender,
            dateOfBirth: patients.dateOfBirth
          })
          .from(patients)
          .where(and(eq(patients.tenantId, tenantId), eq(patients.id, (found as any).patientId)))
          .limit(1);
        pat = p;
      } catch {}

      // Try fetching report if present
      let rep: any = null;
      try {
        const [r] = await db
          .select()
          .from(investigationReports)
          .where(and(eq(investigationReports.tenantId, tenantId), eq(investigationReports.orderId, orderId)))
          .limit(1);
        rep = r;
      } catch {}

      // Try fetching results from investigationResults table
      let resultRows: any[] = [];
      try {
        resultRows = await db
          .select()
          .from(investigationResults)
          .where(and(eq(investigationResults.tenantId, tenantId), eq(investigationResults.orderId, orderId)))
          .orderBy(asc(investigationResults.createdAt));
      } catch {}

      const meta = (typeof (found as any).metadata === 'object' && (found as any).metadata !== null) ? (found as any).metadata : {};
      const testName = meta.testName || (found as any).clinicalIndication || 'Investigation';
      const testCode = meta.testCode || 'LAB-TEST';
      const category = meta.category || 'HEMATOLOGY';
      const specimens = specRows.length > 0 ? specRows : (meta.specimens || []);
      const primarySpec = specimens[0] || (meta.specimen || undefined);

      const order = {
        ...found,
        testName,
        testCode,
        investigationName: testName,
        investigationCode: testCode,
        category,
        investigationCategory: category,
        departmentId: (found as any).departmentId || meta.departmentId || meta.orderingDepartment || meta.department || undefined,
        orderingDepartment: (found as any).orderingDepartment || meta.orderingDepartment || meta.departmentId || meta.department || undefined,
        priority: (found as any).priority || 'ROUTINE',
        status: (found as any).status || 'ORDERED',
        patientName: pat ? `${pat.firstName || ''} ${pat.lastName || ''}`.trim() : (meta.patientName || 'Patient'),
        patientMrn: pat ? pat.mrn : (meta.patientMrn || 'MRN-UNKNOWN'),
        patientGender: pat ? pat.gender : (meta.patientGender || 'MALE'),
        patientDob: pat?.dateOfBirth ? new Date(pat.dateOfBirth).toISOString() : (meta.patientDob || undefined),
        orderingDoctorName: meta.orderingDoctorName || 'Dr. Rajesh Sharma, MD',
        encounterNumber: meta.encounterNumber || 'ENC-LAB-01',
        orderedAt: (found as any).orderedAt || (found as any).createdAt,
        specimen: primarySpec,
        specimens,
        results: resultRows.length > 0 ? resultRows : (meta.results || (found as any).results || []),
        report: rep || meta.report || undefined,
        verifiedBy: (found as any).verifiedBy || meta.verifiedBy || meta.pathologistValidation?.pathologistId || (rep?.verifyingPathologist) || undefined,
        verifiedAt: (found as any).verifiedAt || meta.verifiedAt || meta.pathologistValidation?.validatedAt || (rep?.finalizedAt) || undefined,
        reviewedBy: (found as any).reviewedBy || meta.reviewedBy || undefined,
        reviewedAt: (found as any).reviewedAt || meta.reviewedAt || undefined,
        doctorNotes: (found as any).doctorNotes || meta.doctorNotes || undefined,
        isAbnormal: (found as any).isAbnormal ?? meta.isAbnormal ?? false,
        isCritical: (found as any).isCritical ?? meta.isCritical ?? false
      } as unknown as StoredLabOrder;

      return order;
    } catch (err) {
      logger.error('Failed to query lab order by ID from database', err);
      throw new AppError({
        message: 'Database query failed. Lab order lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createOrder(
    input: CreateLabOrderInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder> {
    const db = requireDb(dbClient);
    const id = input.id || crypto.randomUUID();
    const orderNumber = `ORD-INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const testName = input.testName || (Array.isArray(input.tests) ? input.tests.join(', ') : 'Complete Blood Count (CBC)');
    const testCode = input.testCode || 'CBC-FULL';
    const category = input.category || 'HEMATOLOGY';

    // 1. Dynamic Foreign Key Entity Resolution
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const validDoctorId = await resolveDoctorId(db, input.tenantId, input.orderingDoctorId);
    const validEncounterId = await resolveEncounterId(
      db,
      input.tenantId,
      partnerId,
      organizationId,
      branchId,
      input.patientId,
      validDoctorId,
      input.encounterId
    );
    const validInvestigationId = await resolveInvestigationCatalogId(
      db,
      input.tenantId,
      partnerId,
      organizationId,
      branchId,
      testCode,
      testName,
      category,
      input.investigationId
    );

    // Try fetching patient demographics to embed
    let patientName = input.patientName || 'Rahul Kumar';
    let patientMrn = input.patientMrn || 'MRN-UNKNOWN';
    let patientGender = input.patientGender || 'MALE';
    try {
      const [pat] = await db
        .select({
          firstName: patients.firstName,
          lastName: patients.lastName,
          mrn: patients.mrn,
          gender: patients.gender
        })
        .from(patients)
        .where(and(eq(patients.tenantId, input.tenantId), eq(patients.id, input.patientId)))
        .limit(1);
      if (pat) {
        patientName = `${pat.firstName || ''} ${pat.lastName || ''}`.trim() || patientName;
        patientMrn = pat.mrn || patientMrn;
        patientGender = pat.gender || patientGender;
      }
    } catch {}

    const resolvedDept =
      (input as any).departmentId ||
      (input as any).orderingDepartment ||
      (input.metadata as any)?.departmentId ||
      (input.metadata as any)?.orderingDepartment;

    const orderData: StoredLabOrder = {
      id,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      ...(resolvedDept ? { departmentId: resolvedDept, orderingDepartment: resolvedDept } : {}),
      patientId: input.patientId,
      patientName,
      patientMrn,
      patientGender,
      encounterId: validEncounterId,
      orderNumber,
      investigationId: validInvestigationId,
      testCode,
      testName,
      investigationCode: testCode,
      investigationName: testName,
      category,
      investigationCategory: category,
      priority: input.priority || 'ROUTINE',
      status: 'ORDERED',
      clinicalIndication: input.clinicalIndication || input.clinicalNotes || 'Routine diagnostic workup',
      instructions: input.instructions,
      orderingDoctorId: validDoctorId,
      orderingDoctorName: input.orderingDoctorName || 'Dr. Rajesh Sharma, MD',
      orderedAt: now,
      updatedAt: now,
      specimens: [],
      results: []
    };

    try {
      await db.insert(investigationOrders).values({
        id: orderData.id,
        tenantId: orderData.tenantId,
        partnerId: orderData.partnerId,
        organizationId: orderData.organizationId,
        branchId: orderData.branchId,
        orderNumber: orderData.orderNumber,
        patientId: orderData.patientId,
        encounterId: orderData.encounterId,
        orderingDoctorId: orderData.orderingDoctorId,
        investigationId: validInvestigationId,
        clinicalIndication: orderData.clinicalIndication,
        priority: orderData.priority,
        status: 'ORDERED',
        metadata: {
          testName: orderData.testName,
          testCode: orderData.testCode,
          category: orderData.category,
          ...(resolvedDept ? { departmentId: resolvedDept, orderingDepartment: resolvedDept } : {}),
          patientName,
          patientMrn,
          patientGender,
          orderingDoctorName: orderData.orderingDoctorName,
          instructions: orderData.instructions,
          billingPolicy: input.billingPolicy || 'STANDARD',
          ...(input.metadata || {})
        },
        createdAt: now,
        updatedAt: now
      } as any);

      return orderData;
    } catch (err: any) {
      logger.error('Failed to create lab order in database', err);
      throw new AppError({
        message: `Database persistence failed. Lab order creation aborted: ${err?.message || String(err)}`,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async collectSpecimen(
    input: CollectSpecimenInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);

    const order = await this.getOrderById(input.tenantId, input.orderId, db);
    if (!order) {
      throw new AppError({
        message: `Investigation order ${input.orderId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const currentOrderStatus = String(order.status || '').toUpperCase();
    const NON_COLLECTABLE_STATUSES = [
      'CANCELLED',
      'RESULT_ENTERED',
      'TECHNICAL_VALIDATED',
      'VERIFIED',
      'COMPLETED',
      'DELIVERED',
      'REPORT_RELEASED',
      'FINALIZED'
    ];
    if (NON_COLLECTABLE_STATUSES.includes(currentOrderStatus)) {
      throw new AppError({
        message: `Cannot collect specimen for a laboratory order in '${currentOrderStatus}' status.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
    const billingPolicy = orderMeta.billingPolicy || orderMeta.billing_policy || 'STANDARD';
    const isPaymentRequiredBeforeSample =
      billingPolicy === 'PAYMENT_REQUIRED_BEFORE_SAMPLE' ||
      orderMeta.requirePaymentBeforeSample === true;

    if (isPaymentRequiredBeforeSample && !input.deferredBilling && !input.isEmergency) {
      const billingStatus = (orderMeta.billingStatus || orderMeta.billing_status || '').toUpperCase();
      if (billingStatus !== 'PAID' && billingStatus !== 'BILLED') {
        throw new AppError({
          message: `Specimen collection rejected: Payment is strictly required prior to sample collection under order billing policy (status: ${billingStatus || 'UNBILLED'}).`,
          code: ErrorCode.BAD_REQUEST,
          statusCode: 402
        });
      }
    }

    const accessionNumber = `ACC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const specimenData = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      orderId: input.orderId,
      accessionNumber,
      specimenType: input.specimenType,
      containerType: input.containerType || 'EDTA_LAVENDER',
      collectedBy: input.collectedBy,
      collectedAt: now,
      status: 'RECEIVED'
    };

    try {
      return await runInTx(db, async (tx: any) => {
        const resolvedHierarchy = (!order.partnerId || !order.organizationId)
          ? await resolvePartnerAndOrg(tx, specimenData.tenantId)
          : { partnerId: order.partnerId, organizationId: order.organizationId };
        await tx.insert(investigationSpecimens).values({
          id: specimenData.id,
          tenantId: specimenData.tenantId,
          partnerId: order.partnerId || resolvedHierarchy.partnerId,
          organizationId: order.organizationId || resolvedHierarchy.organizationId,
          orderId: specimenData.orderId,
          patientId: input.patientId || order.patientId,
          accessionNumber: specimenData.accessionNumber,
          specimenType: specimenData.specimenType,
          containerType: specimenData.containerType,
          collectionStatus: 'COLLECTED',
          collectedAt: now,
          createdAt: now,
          updatedAt: now
        } as any);

        await tx
          .update(investigationOrders)
          .set({ status: 'SAMPLE_COLLECTED', updatedAt: now } as any)
          .where(and(eq(investigationOrders.tenantId, input.tenantId), eq(investigationOrders.id, input.orderId)));

        return await this.getOrderById(input.tenantId, input.orderId, tx);
      });
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to create lab order in database', err);
      throw new AppError({
        message: `Database persistence failed. Lab order creation aborted: ${err?.message || String(err)}`,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async enterResult(
    input: EnterResultInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(input.tenantId, input.orderId, db);
    if (!order) return null;

    const currentOrderStatus = String(order.status || '').toUpperCase();
    if (currentOrderStatus === 'CANCELLED') {
      throw new AppError({
        message: 'Cannot enter results for a CANCELLED laboratory order.',
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }
    if (['VERIFIED', 'COMPLETED', 'FINALIZED', 'RELEASED'].includes(currentOrderStatus)) {
      throw new AppError({
        message: `Cannot directly overwrite results on a ${currentOrderStatus} laboratory order. Use formal result amendment workflow.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const now = new Date();
    const itemsToInsert: any[] = [];
    let hasAbnormal = false;
    let hasCritical = false;

    const processItem = (r: EnterResultItem, defaultName: string) => {
      let flag = (r.abnormalFlag || r.flag || 'NORMAL').toUpperCase();
      let isCrit = Boolean(r.isCritical) || flag === 'CRITICAL_HIGH' || flag === 'CRITICAL_LOW' || flag === 'CRITICAL';
      const paramCode = (r.parameterCode || r.testCode || 'PARAM').toUpperCase();
      const numVal = r.numericValue ?? (typeof r.value === 'number' ? r.value : (r.resultValue !== undefined && !isNaN(parseFloat(r.resultValue)) ? parseFloat(r.resultValue) : undefined));

      const refDef = (CLINICAL_REFERENCE_RANGES as any)[paramCode];
      if (refDef && numVal !== undefined && !isNaN(numVal)) {
        if (refDef.criticalMin !== undefined && numVal < refDef.criticalMin) {
          isCrit = true;
          flag = 'CRITICAL_LOW';
        } else if (refDef.criticalMax !== undefined && numVal > refDef.criticalMax) {
          isCrit = true;
          flag = 'CRITICAL_HIGH';
        } else if (refDef.refMin !== undefined && numVal < refDef.refMin) {
          flag = 'LOW';
        } else if (refDef.refMax !== undefined && numVal > refDef.refMax) {
          flag = 'HIGH';
        }
      }

      const isAbn = isCrit || flag === 'HIGH' || flag === 'LOW' || flag === 'ABNORMAL';
      if (isAbn) hasAbnormal = true;
      if (isCrit) hasCritical = true;

      return {
        id: crypto.randomUUID(),
        parameterCode: r.parameterCode || r.testCode || 'PARAM',
        parameterName: r.parameterName || r.testCode || defaultName,
        resultValue: r.resultValue ?? String(r.value ?? ''),
        numericValue: numVal,
        unit: r.unit || refDef?.unit || 'g/dL',
        referenceRange: r.referenceRange || r.refRange || (refDef ? `${refDef.refMin} - ${refDef.refMax}` : '13.5 - 17.5'),
        abnormalFlag: flag,
        isCritical: isCrit,
        qualitativeInterpretation: r.qualitativeInterpretation || r.notes || refDef?.clinicalRisk,
        enteredBy: input.enteredBy || 'LAB_SUPERVISOR',
        enteredAt: now
      };
    };

    if (Array.isArray(input.results) && input.results.length > 0) {
      input.results.forEach((r) => {
        itemsToInsert.push(processItem(r, 'Test Parameter'));
      });
    } else if (input.parameterName && input.resultValue) {
      itemsToInsert.push(
        processItem(
          {
            parameterCode: input.parameterCode,
            parameterName: input.parameterName,
            resultValue: input.resultValue,
            numericValue: input.numericValue,
            unit: input.unit,
            referenceRange: input.referenceRange,
            abnormalFlag: input.abnormalFlag,
            notes: input.notes
          },
          input.parameterName
        )
      );
    }

    try {
      return await runInTx(db, async (tx: any) => {
        const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
        const newResults = [...(orderMeta.results || []), ...itemsToInsert];

        // 1. Relational insert into investigationResults table
        for (const item of itemsToInsert) {
          try {
            await tx.insert(investigationResults).values({
              id: item.id,
              tenantId: input.tenantId,
              partnerId: order.partnerId,
              organizationId: order.organizationId,
              orderId: input.orderId,
              specimenId: input.specimenId || (order.specimen?.id || null),
              parameterCode: item.parameterCode,
              parameterName: item.parameterName,
              resultValue: item.resultValue,
              numericValue: item.numericValue !== undefined ? String(item.numericValue) : null,
              unit: item.unit,
              referenceRange: item.referenceRange,
              abnormalFlag: item.abnormalFlag,
              isCritical: item.isCritical,
              qualitativeInterpretation: item.qualitativeInterpretation,
              resultStatus: 'COMPLETED',
              enteredBy: item.enteredBy,
              enteredAt: now
            } as any);
          } catch {
            // Proceed if relational table not yet migrated
          }

          // 1b. CDSS Critical panic value alert insert
          if (item.isCritical) {
            try {
              await tx.insert(criticalPanicValueAlerts).values({
                id: crypto.randomUUID(),
                tenantId: input.tenantId,
                partnerId: order.partnerId,
                organizationId: order.organizationId,
                branchId: order.branchId || order.organizationId,
                patientMrn: order.patientMrn || 'MRN-PENDING',
                patientName: order.patientName || 'Laboratory Patient',
                location: order.branchName || 'Central Laboratory',
                testName: item.parameterName || order.testName,
                measuredValue: String(item.resultValue),
                referenceNormalRange: item.referenceRange,
                panicThreshold: item.referenceRange,
                category: order.category || 'HEMATOLOGY',
                urgencyLevel: 'STAT_CRITICAL',
                clinicalRiskSummary: item.qualitativeInterpretation || 'Critical panic value breached. Immediate physician notification mandatory.',
                communicatedToDoctor: false,
                doctorName: order.orderingDoctorName || 'Attending Physician',
                alertTimestamp: now,
                createdAt: now
              } as any);
            } catch (critErr: any) {
              logger.warn('Failed to insert criticalPanicValueAlerts record', { error: critErr?.message || String(critErr) });
            }
          }
        }

        // 2. Update order status and JSONB metadata
        await tx
          .update(investigationOrders)
          .set({
            status: 'RESULT_ENTERED',
            isAbnormal: hasAbnormal,
            isCritical: hasCritical,
            resultEnteredAt: now,
            metadata: {
              ...orderMeta,
              results: newResults,
              isAbnormal: hasAbnormal,
              isCritical: hasCritical
            },
            updatedAt: now
          } as any)
          .where(and(eq(investigationOrders.tenantId, input.tenantId), eq(investigationOrders.id, input.orderId)));

        // 3. Write audit trace
        try {
          await tx.insert(investigationAuditTraces).values({
            id: crypto.randomUUID(),
            traceId: 'TRACE-' + crypto.randomUUID(),
            tenantId: input.tenantId,
            partnerId: order.partnerId,
            organizationId: order.organizationId,
            branchId: order.branchId || null,
            orderId: input.orderId,
            patientId: order.patientId,
            actorId: input.enteredBy || 'LAB_SUPERVISOR',
            actorRole: 'LAB_SUPERVISOR',
            action: 'RESULT_ENTERED',
            targetEntity: 'INVESTIGATION_ORDER',
            targetEntityId: input.orderId,
            justification: hasCritical ? 'CDSS detected critical panic value abnormality' : 'Laboratory results entered',
            operationStatus: 'SUCCESS',
            correlationId: crypto.randomUUID(),
            metadata: { hasCritical, hasAbnormal, count: itemsToInsert.length },
            occurredAt: now
          } as any);
        } catch {}

        return await this.getOrderById(input.tenantId, input.orderId, tx);
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to enter lab results in database', err);
      throw new AppError({
        message: 'Database update failed. Result entry aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async verifyResult(
    tenantId: string,
    orderId: string,
    verifiedBy: string,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const now = new Date();
    try {
      return await runInTx(db, async (tx: any) => {
        const order = await this.getOrderById(tenantId, orderId, tx);
        if (!order) return null;

        const currentOrderStatus = String(order.status || '').toUpperCase();
        if (currentOrderStatus === 'CANCELLED') {
          throw new AppError({
            message: 'Cannot verify a CANCELLED laboratory order.',
            code: ErrorCode.CONFLICT,
            statusCode: 409
          });
        }

        const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
        const rawResults = (order?.results && order.results.length > 0) ? order.results : (orderMeta.results || []);
        if (!Array.isArray(rawResults) || rawResults.length === 0) {
          throw new AppError({
            message: 'Cannot verify laboratory order before results are entered.',
            code: ErrorCode.BAD_REQUEST,
            statusCode: 400
          });
        }
        const verifiedResults = rawResults.map((r: any) => ({
          ...r,
          verifiedBy,
          verifiedAt: now
        }));

        // 1. Update investigationResults table
        try {
          await tx
            .update(investigationResults)
            .set({
              resultStatus: 'VERIFIED',
              verifiedBy,
              verifiedAt: now,
              updatedAt: now
            } as any)
            .where(and(eq(investigationResults.tenantId, tenantId), eq(investigationResults.orderId, orderId)));
        } catch {}

        // 2. Create official diagnostic report in investigationReports table
        const reportNumber = `REP-${order.orderNumber}`;
        const reportId = crypto.randomUUID();
        const reportPayload = {
          id: reportId,
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          orderId: order.id,
          patientId: order.patientId,
          reportNumber,
          reportTitle: `Diagnostic Report: ${order.investigationName || order.testName}`,
          clinicalFindings: verifiedResults.map((r: any) => `${r.parameterName}: ${r.resultValue} ${r.unit || ''} [${r.abnormalFlag || 'NORMAL'}]`).join(' | '),
          impression: order.isCritical ? 'CRITICAL ANALYTE ABNORMALITY CONFIRMED' : 'All analytes clinically validated and signed off by laboratory pathologist.',
          reportingClinician: verifiedBy,
          verifyingPathologist: verifiedBy,
          reportStatus: 'FINAL',
          finalizedAt: now,
          metadata: { verifiedBy, orderNumber: order.orderNumber }
        };

        try {
          await tx.insert(investigationReports).values(reportPayload as any);
        } catch {
          // If already exists or schema mismatch, continue
        }

        // 3. Update investigationOrders
        await tx
          .update(investigationOrders)
          .set({
            status: 'VERIFIED',
            verifiedAt: now,
            metadata: {
              ...orderMeta,
              results: verifiedResults,
              verifiedBy,
              verifiedAt: now,
              report: reportPayload
            },
            updatedAt: now
          } as any)
          .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

        const updated = await this.getOrderById(tenantId, orderId, tx);
        if (updated) {
          updated.status = 'VERIFIED';
          updated.verifiedBy = verifiedBy;
          updated.verifiedAt = now;
          updated.results = verifiedResults;
          updated.report = reportPayload;
        }
        return updated;
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to verify lab results in database', err);
      throw new AppError({
        message: 'Database update failed. Pathologist verification aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async reviewResult(
    tenantId: string,
    orderId: string,
    doctorNotesOrUserId: any,
    sessionOrDoctorNotes: any,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const now = new Date();
    let doctorNotes: string | undefined;
    let userId = 'DOCTOR-ATTENDING';
    if (typeof doctorNotesOrUserId === 'string' && typeof sessionOrDoctorNotes === 'string') {
      userId = doctorNotesOrUserId;
      doctorNotes = sessionOrDoctorNotes;
    } else if (typeof doctorNotesOrUserId === 'string') {
      doctorNotes = doctorNotesOrUserId;
      if (typeof sessionOrDoctorNotes === 'object' && sessionOrDoctorNotes?.userId) {
        userId = sessionOrDoctorNotes.userId;
      }
    } else if (typeof sessionOrDoctorNotes === 'string') {
      doctorNotes = sessionOrDoctorNotes;
    }

    try {
      const order = await this.getOrderById(tenantId, orderId, db);
      if (!order) return null;

      const currentOrderStatus = String(order.status || '').toUpperCase();
      if (currentOrderStatus === 'CANCELLED') {
        throw new AppError({
          message: 'Cannot review a CANCELLED laboratory order.',
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }
      if (!['VERIFIED', 'RESULTED', 'REPORTED', 'COMPLETED'].includes(currentOrderStatus)) {
        throw new AppError({
          message: `Cannot review laboratory order in '${currentOrderStatus}' status. Order must be VERIFIED or REPORTED before doctor review.`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }

      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};

      // Also update report review timestamp if report exists
      try {
        await db
          .update(investigationReports)
          .set({
            reviewedByDoctorAt: now,
            reviewingDoctor: userId,
            doctorReviewNotes: doctorNotes,
            updatedAt: now
          } as any)
          .where(and(eq(investigationReports.tenantId, tenantId), eq(investigationReports.orderId, orderId)));
      } catch {}

      await db
        .update(investigationOrders)
        .set({
          status: 'COMPLETED',
          reviewedAt: now,
          metadata: {
            ...orderMeta,
            reviewedBy: userId,
            reviewedAt: now,
            doctorNotes
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      const updated = await this.getOrderById(tenantId, orderId, db);
      if (updated) {
        updated.status = 'COMPLETED';
        updated.reviewedBy = userId;
        updated.reviewedAt = now;
        updated.doctorNotes = doctorNotes;
        (updated as any).review = {
          reviewedBy: userId,
          reviewedAt: now,
          doctorNotes
        };
      }
      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to review lab results in database', err);
      throw new AppError({
        message: 'Database update failed. Doctor review aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async cancelOrder(
    tenantId: string,
    orderId: string,
    cancelledBy: string,
    cancellationReason: string,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const now = new Date();
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) return null;

    const currentOrderStatus = String(order.status || '').toUpperCase();
    if (['VERIFIED', 'COMPLETED', 'DELIVERED', 'REPORT_RELEASED', 'FINALIZED'].includes(currentOrderStatus)) {
      throw new AppError({
        message: `Cannot cancel an investigation order that has already reached '${currentOrderStatus}' status.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    if (currentOrderStatus === 'CANCELLED') {
      throw new AppError({
        message: 'Investigation order is already cancelled.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};

    try {
      await db
        .update(investigationOrders)
        .set({
          status: 'CANCELLED',
          cancelledAt: now,
          cancelledBy,
          cancellationReason,
          metadata: {
            ...orderMeta,
            cancelledAt: now,
            cancelledBy,
            cancellationReason
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      return await this.getOrderById(tenantId, orderId, db);
    } catch (err) {
      logger.error('Failed to cancel lab order in database', err);
      throw new AppError({
        message: 'Database update failed. Order cancellation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async searchCatalog(
    tenantId: string,
    categoryOrOptions?: string | { page?: number | undefined; limit?: number | undefined; category?: string | undefined; searchTerm?: string | undefined; status?: string | undefined } | undefined,
    searchTermOrDb?: string | any,
    maybeDbClient = getDatabase()
  ): Promise<any> {
    let category: string | undefined;
    let searchTerm: string | undefined;
    let status: string | undefined;
    let page = 1;
    let limit = 50;
    let dbClient = maybeDbClient;

    if (typeof categoryOrOptions === 'object' && categoryOrOptions !== null) {
      page = categoryOrOptions.page || 1;
      limit = categoryOrOptions.limit || 50;
      category = categoryOrOptions.category;
      searchTerm = categoryOrOptions.searchTerm;
      status = categoryOrOptions.status;
      if (searchTermOrDb && typeof searchTermOrDb.select === 'function') {
        dbClient = searchTermOrDb;
      }
    } else {
      category = categoryOrOptions;
      if (typeof searchTermOrDb === 'string') {
        searchTerm = searchTermOrDb;
      } else if (searchTermOrDb && typeof searchTermOrDb.select === 'function') {
        dbClient = searchTermOrDb;
      }
    }

    const db = requireDb(dbClient);
    try {
      const conditions: any[] = [eq(investigationCatalog.tenantId, tenantId)];
      if (category && category !== 'ALL') {
        conditions.push(eq(investigationCatalog.category, category));
      }
      if (status && status !== 'ALL') {
        conditions.push(eq(investigationCatalog.status, status));
      }
      if (searchTerm && searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        conditions.push(
          or(
            ilike(investigationCatalog.testCode, term),
            ilike(investigationCatalog.testName, term),
            ilike(investigationCatalog.department, term)
          )
        );
      }

      const whereClause = and(...conditions);

      // Get count
      const countRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(investigationCatalog)
        .where(whereClause);
      const total = Number(countRows[0]?.count || 0);

      // Get page items
      const offset = (page - 1) * limit;
      const items = await db
        .select()
        .from(investigationCatalog)
        .where(whereClause)
        .orderBy(asc(investigationCatalog.testName))
        .limit(limit)
        .offset(offset);

      if (typeof categoryOrOptions === 'string' || categoryOrOptions === undefined) {
        return items || [];
      }

      return {
        items: items || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch {
      if (typeof categoryOrOptions === 'string' || categoryOrOptions === undefined) {
        return [];
      }
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  async getPanels(
    tenantId: string,
    dbClient = getDatabase()
  ) {
    const db = requireDb(dbClient);
    try {
      const panels = await db
        .select()
        .from(investigationPanels)
        .where(eq(investigationPanels.tenantId, tenantId));

      let itemsMap: Record<string, any[]> = {};
      try {
        const items = await db
          .select()
          .from(investigationPanelItems)
          .where(eq(investigationPanelItems.tenantId, tenantId));
        (items || []).forEach((it: any) => {
          const arr = itemsMap[it.panelId] || [];
          arr.push(it);
          itemsMap[it.panelId] = arr;
        });
      } catch {}

      return (panels || []).map((p: any) => ({
        ...p,
        items: itemsMap[p.id] || []
      }));
    } catch {
      return [];
    }
  }

  async createCatalogTest(
    tenantId: string,
    input: CreateCatalogTestInput,
    dbClient = getDatabase()
  ): Promise<any> {
    const db = requireDb(dbClient);
    const now = new Date();
    const testId = crypto.randomUUID();

    const hierarchy = await resolvePartnerAndOrg(db, tenantId);

    const payload = {
      id: testId,
      tenantId,
      partnerId: hierarchy.partnerId,
      organizationId: hierarchy.organizationId,
      testCode: input.testCode.toUpperCase().trim(),
      testName: input.testName.trim(),
      shortName: input.shortName || input.testName.trim(),
      category: input.category || 'HEMATOLOGY',
      department: input.department || 'PATHOLOGY',
      specimenType: input.specimenType || 'WHOLE_BLOOD',
      sampleVolume: input.sampleVolume || '2 mL',
      turnaroundTargetHours: input.turnaroundTargetHours || 4,
      fastingRequired: input.fastingRequired ? 'TRUE' : 'FALSE',
      preparationRequirements: input.preparationRequirements || null,
      clinicalDescription: input.clinicalDescription || null,
      status: input.status || 'ACTIVE',
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    };

    await db.insert(investigationCatalog).values(payload as any);
    const inserted = await db.select().from(investigationCatalog).where(and(eq(investigationCatalog.tenantId, tenantId), eq(investigationCatalog.id, testId))).limit(1);
    return inserted[0] || payload;
  }

  async updateCatalogTest(
    tenantId: string,
    testId: string,
    input: Partial<CreateCatalogTestInput>,
    dbClient = getDatabase()
  ): Promise<any> {
    const db = requireDb(dbClient);
    const now = new Date();

    const updateFields: any = { updatedAt: now };
    if (input.testName) updateFields.testName = input.testName;
    if (input.shortName) updateFields.shortName = input.shortName;
    if (input.category) updateFields.category = input.category;
    if (input.department) updateFields.department = input.department;
    if (input.specimenType) updateFields.specimenType = input.specimenType;
    if (input.sampleVolume) updateFields.sampleVolume = input.sampleVolume;
    if (input.turnaroundTargetHours !== undefined) updateFields.turnaroundTargetHours = input.turnaroundTargetHours;
    if (input.fastingRequired !== undefined) updateFields.fastingRequired = input.fastingRequired ? 'TRUE' : 'FALSE';
    if (input.preparationRequirements !== undefined) updateFields.preparationRequirements = input.preparationRequirements;
    if (input.clinicalDescription !== undefined) updateFields.clinicalDescription = input.clinicalDescription;
    if (input.status) updateFields.status = input.status;
    if (input.metadata) updateFields.metadata = input.metadata;

    await db
      .update(investigationCatalog)
      .set(updateFields)
      .where(and(eq(investigationCatalog.tenantId, tenantId), eq(investigationCatalog.id, testId)));

    const updated = await db.select().from(investigationCatalog).where(and(eq(investigationCatalog.tenantId, tenantId), eq(investigationCatalog.id, testId))).limit(1);
    return updated[0] || null;
  }

  async createPanel(
    tenantId: string,
    input: CreatePanelInput,
    dbClient = getDatabase()
  ): Promise<any> {
    const db = requireDb(dbClient);
    const now = new Date();
    const panelId = crypto.randomUUID();
    const hierarchy = await resolvePartnerAndOrg(db, tenantId);

    return await runInTx(db, async (tx: any) => {
      await tx.insert(investigationPanels).values({
        id: panelId,
        tenantId,
        partnerId: hierarchy.partnerId,
        organizationId: hierarchy.organizationId,
        panelCode: input.panelCode.toUpperCase().trim(),
        panelName: input.panelName.trim(),
        category: input.category || 'HEMATOLOGY',
        description: input.description || null,
        status: 'ACTIVE',
        metadata: { testIds: input.testIds },
        createdAt: now,
        updatedAt: now
      } as any);

      if (Array.isArray(input.testIds)) {
        for (let i = 0; i < input.testIds.length; i++) {
          try {
            await tx.insert(investigationPanelItems).values({
              id: crypto.randomUUID(),
              tenantId,
              partnerId: hierarchy.partnerId,
              organizationId: hierarchy.organizationId,
              panelId,
              investigationId: input.testIds[i],
              displayOrder: i + 1,
              createdAt: now
            } as any);
          } catch {}
        }
      }

      const rows = await tx.select().from(investigationPanels).where(and(eq(investigationPanels.tenantId, tenantId), eq(investigationPanels.id, panelId))).limit(1);
      const panel = rows[0] || { id: panelId, panelCode: input.panelCode, panelName: input.panelName };
      return { ...panel, testIds: input.testIds };
    });
  }

  async accessionSpecimen(
    tenantId: string,
    orderId: string,
    input: AccessionSpecimenInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) return null;
    if (order.status === 'CANCELLED') {
      throw new AppError({
        message: 'Cannot accession a cancelled investigation order.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const now = new Date();
    return await runInTx(db, async (tx: any) => {
      try {
        await tx
          .update(investigationSpecimens)
          .set({
            collectionStatus: 'ACCESSIONED',
            receivedAt: now,
            receivedBy: input.receivedBy,
            workstationId: input.workstationId || null,
            qualityRemarks: input.qualityRemarks || null,
            updatedAt: now
          } as any)
          .where(and(eq(investigationSpecimens.tenantId, tenantId), eq(investigationSpecimens.orderId, orderId)));
      } catch {}

      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
      await tx
        .update(investigationOrders)
        .set({
          status: 'ACCESSIONED',
          metadata: {
            ...orderMeta,
            accessionedAt: now,
            accessionedBy: input.receivedBy,
            workstationId: input.workstationId,
            qualityRemarks: input.qualityRemarks
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      try {
        await tx.insert(investigationAuditTraces).values({
          id: crypto.randomUUID(),
          traceId: 'TRACE-' + crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          branchId: order.branchId || null,
          orderId: order.id,
          patientId: order.patientId,
          actorId: input.receivedBy,
          actorRole: 'LAB_ACCESSIONER',
          action: 'ACCESSION_SPECIMEN',
          targetEntity: 'INVESTIGATION_ORDER',
          targetEntityId: order.id,
          justification: input.qualityRemarks || 'Specimen accessioned at laboratory receiving workstation',
          operationStatus: 'SUCCESS',
          correlationId: crypto.randomUUID(),
          metadata: { workstationId: input.workstationId },
          occurredAt: now
        } as any);
      } catch {}

      return await this.getOrderById(tenantId, orderId, tx);
    });
  }

  async startProcessing(
    tenantId: string,
    orderId: string,
    input: StartProcessingInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) return null;
    if (order.status === 'CANCELLED') {
      throw new AppError({
        message: 'Cannot process a cancelled investigation order.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const now = new Date();
    return await runInTx(db, async (tx: any) => {
      try {
        await tx
          .update(investigationSpecimens)
          .set({
            collectionStatus: 'IN_ANALYSIS',
            analyzerId: input.analyzerId || null,
            workstationId: input.workstationId || null,
            updatedAt: now
          } as any)
          .where(and(eq(investigationSpecimens.tenantId, tenantId), eq(investigationSpecimens.orderId, orderId)));
      } catch {}

      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
      await tx
        .update(investigationOrders)
        .set({
          status: 'PROCESSING',
          metadata: {
            ...orderMeta,
            processingStartedAt: now,
            analyzerId: input.analyzerId,
            workstationId: input.workstationId,
            technicianId: input.technicianId,
            notes: input.notes
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      try {
        await tx.insert(investigationAuditTraces).values({
          id: crypto.randomUUID(),
          traceId: 'TRACE-' + crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          branchId: order.branchId || null,
          orderId: order.id,
          patientId: order.patientId,
          actorId: input.technicianId || 'LAB_TECHNICIAN',
          actorRole: 'LAB_TECHNICIAN',
          action: 'START_PROCESSING',
          targetEntity: 'INVESTIGATION_ORDER',
          targetEntityId: order.id,
          justification: input.notes || 'Specimen loaded onto analyzer / manual processing started',
          operationStatus: 'SUCCESS',
          correlationId: crypto.randomUUID(),
          metadata: { analyzerId: input.analyzerId, workstationId: input.workstationId },
          occurredAt: now
        } as any);
      } catch {}

      return await this.getOrderById(tenantId, orderId, tx);
    });
  }

  async rejectSpecimen(
    tenantId: string,
    orderId: string,
    input: RejectSpecimenInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) return null;

    const now = new Date();
    return await runInTx(db, async (tx: any) => {
      try {
        await tx
          .update(investigationSpecimens)
          .set({
            collectionStatus: 'REJECTED',
            rejectionReason: input.rejectionReason,
            rejectedBy: input.rejectedBy,
            rejectedAt: now,
            updatedAt: now
          } as any)
          .where(and(eq(investigationSpecimens.tenantId, tenantId), eq(investigationSpecimens.orderId, orderId)));
      } catch {}

      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
      await tx
        .update(investigationOrders)
        .set({
          status: 'SAMPLE_REJECTED',
          metadata: {
            ...orderMeta,
            rejection: {
              rejectionReason: input.rejectionReason,
              remarks: input.remarks,
              rejectedBy: input.rejectedBy,
              rejectedAt: now
            }
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      try {
        await tx.insert(investigationAuditTraces).values({
          id: crypto.randomUUID(),
          traceId: 'TRACE-' + crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          branchId: order.branchId || null,
          orderId: order.id,
          patientId: order.patientId,
          actorId: input.rejectedBy,
          actorRole: 'LAB_TECHNICIAN',
          action: 'REJECT_SPECIMEN',
          targetEntity: 'INVESTIGATION_SPECIMEN',
          targetEntityId: order.id,
          justification: input.rejectionReason,
          operationStatus: 'SUCCESS',
          correlationId: crypto.randomUUID(),
          metadata: { remarks: input.remarks },
          occurredAt: now
        } as any);
      } catch {}

      return await this.getOrderById(tenantId, orderId, tx);
    });
  }

  async recollectSpecimen(
    tenantId: string,
    orderId: string,
    input: RecollectSpecimenInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) return null;

    const now = new Date();
    const existingCount = Array.isArray(order.specimens) ? order.specimens.length : 1;
    const newSpecimenId = crypto.randomUUID();
    const newBarcode = `BC-${order.orderNumber}-R${existingCount + 1}`;

    return await runInTx(db, async (tx: any) => {
      try {
        await tx.insert(investigationSpecimens).values({
          id: newSpecimenId,
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          orderId: order.id,
          patientId: order.patientId,
          accessionNumber: newBarcode,
          specimenType: input.specimenType || order.specimen?.specimenType || 'WHOLE_BLOOD',
          containerType: input.containerType || order.specimen?.containerType || 'EDTA_TUBE',
          collectionStatus: 'RECOLLECTION_REQUESTED',
          metadata: {
            parentSpecimenId: input.previousSpecimenId || order.specimen?.id || null,
            requestedBy: input.requestedBy,
            notes: input.notes,
            isReplacement: true
          },
          createdAt: now,
          updatedAt: now
        } as any);
      } catch {}

      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
      await tx
        .update(investigationOrders)
        .set({
          status: 'RECOLLECTION_REQUESTED',
          metadata: {
            ...orderMeta,
            activeSpecimenBarcode: newBarcode,
            activeSpecimenId: newSpecimenId,
            recollectionRequestedAt: now,
            recollectionRequestedBy: input.requestedBy,
            recollectionNotes: input.notes
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      try {
        await tx.insert(investigationAuditTraces).values({
          id: crypto.randomUUID(),
          traceId: 'TRACE-' + crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          branchId: order.branchId || null,
          orderId: order.id,
          patientId: order.patientId,
          actorId: input.requestedBy,
          actorRole: 'LAB_TECHNICIAN',
          action: 'RECOLLECT_SPECIMEN',
          targetEntity: 'INVESTIGATION_ORDER',
          targetEntityId: order.id,
          justification: input.notes || 'Recollection requested following specimen rejection',
          operationStatus: 'SUCCESS',
          correlationId: crypto.randomUUID(),
          metadata: { previousSpecimenId: input.previousSpecimenId, newBarcode, newSpecimenId },
          occurredAt: now
        } as any);
      } catch {}

      return await this.getOrderById(tenantId, orderId, tx);
    });
  }

  async technicalValidateResult(
    tenantId: string,
    orderId: string,
    input: TechnicalValidateInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) return null;

    const now = new Date();
    return await runInTx(db, async (tx: any) => {
      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};

      if (!input.isAccepted) {
        await tx
          .update(investigationOrders)
          .set({
            status: 'TECHNICAL_REJECTED',
            metadata: {
              ...orderMeta,
              technicalValidation: {
                isAccepted: false,
                technicianId: input.technicianId,
                rejectionReason: input.rejectionReason || input.comments || 'Technical validation failed',
                validatedAt: now
              }
            },
            updatedAt: now
          } as any)
          .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));
      } else {
        try {
          await tx
            .update(investigationResults)
            .set({
              resultStatus: 'TECHNICAL_VALIDATED',
              updatedAt: now
            } as any)
            .where(and(eq(investigationResults.tenantId, tenantId), eq(investigationResults.orderId, orderId)));
        } catch {}

        await tx
          .update(investigationOrders)
          .set({
            status: 'TECHNICAL_VALIDATED',
            metadata: {
              ...orderMeta,
              technicalValidation: {
                isAccepted: true,
                technicianId: input.technicianId,
                comments: input.comments,
                validatedAt: now
              }
            },
            updatedAt: now
          } as any)
          .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));
      }

      try {
        await tx.insert(investigationAuditTraces).values({
          id: crypto.randomUUID(),
          traceId: 'TRACE-' + crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          branchId: order.branchId || null,
          orderId: order.id,
          patientId: order.patientId,
          actorId: input.technicianId,
          actorRole: 'LAB_TECHNICIAN',
          action: input.isAccepted ? 'TECHNICAL_VALIDATE_ACCEPTED' : 'TECHNICAL_VALIDATE_REJECTED',
          targetEntity: 'INVESTIGATION_ORDER',
          targetEntityId: order.id,
          justification: input.comments || input.rejectionReason || (input.isAccepted ? 'Technical criteria satisfied' : 'Technical flags triggered rejection'),
          operationStatus: 'SUCCESS',
          correlationId: crypto.randomUUID(),
          metadata: { isAccepted: input.isAccepted },
          occurredAt: now
        } as any);
      } catch {}

      return await this.getOrderById(tenantId, orderId, tx);
    });
  }

  async pathologistValidateResult(
    tenantId: string,
    orderId: string,
    input: PathologistValidateInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const now = new Date();
    return await runInTx(db, async (tx: any) => {
      const order = await this.getOrderById(tenantId, orderId, tx);
      if (!order) return null;

      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
      const verifiedResults = ((order?.results && order.results.length > 0) ? order.results : (orderMeta.results || [])).map((r: any) => ({
        ...r,
        verifiedBy: input.pathologistId,
        verifiedAt: now
      }));

      try {
        await tx
          .update(investigationResults)
          .set({
            resultStatus: 'VERIFIED',
            verifiedBy: input.pathologistId,
            verifiedAt: now,
            updatedAt: now
          } as any)
          .where(and(eq(investigationResults.tenantId, tenantId), eq(investigationResults.orderId, orderId)));
      } catch {}

      const reportNumber = `REP-${order.orderNumber}`;
      const reportId = crypto.randomUUID();
      const reportPayload = {
        id: reportId,
        tenantId,
        partnerId: order.partnerId,
        organizationId: order.organizationId,
        orderId: order.id,
        patientId: order.patientId,
        reportNumber,
        reportTitle: `Diagnostic Report: ${order.investigationName || order.testName}`,
        clinicalFindings: verifiedResults.map((r: any) => `${r.parameterName || r.testCode}: ${r.resultValue} ${r.unit || ''} [${r.abnormalFlag || 'NORMAL'}]`).join(' | '),
        impression: input.clinicalImpression || (order.isCritical ? 'CRITICAL ANALYTE ABNORMALITY CONFIRMED' : 'All analytes clinically validated and approved by pathologist.'),
        reportingClinician: input.pathologistName || input.pathologistId,
        verifyingPathologist: input.pathologistName || input.pathologistId,
        reportStatus: 'FINAL',
        finalizedAt: now,
        metadata: {
          pathologistId: input.pathologistId,
          pathologistName: input.pathologistName,
          digitalSignature: input.digitalSignature || `SIG-PATH-${input.pathologistId}-${Date.now()}`,
          recommendations: input.recommendations,
          orderNumber: order.orderNumber
        }
      };

      try {
        await tx.insert(investigationReports).values(reportPayload as any);
      } catch {
        try {
          await tx
            .update(investigationReports)
            .set(reportPayload as any)
            .where(and(eq(investigationReports.tenantId, tenantId), eq(investigationReports.orderId, orderId)));
        } catch {}
      }

      await tx
        .update(investigationOrders)
        .set({
          status: 'VERIFIED',
          verifiedAt: now,
          metadata: {
            ...orderMeta,
            results: verifiedResults,
            verifiedBy: input.pathologistId,
            verifiedAt: now,
            pathologistValidation: {
              pathologistId: input.pathologistId,
              pathologistName: input.pathologistName,
              digitalSignature: input.digitalSignature,
              clinicalImpression: input.clinicalImpression,
              recommendations: input.recommendations,
              validatedAt: now
            },
            report: reportPayload
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      try {
        await tx.insert(investigationAuditTraces).values({
          id: crypto.randomUUID(),
          traceId: 'TRACE-' + crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          branchId: order.branchId || null,
          orderId: order.id,
          patientId: order.patientId,
          actorId: input.pathologistId,
          actorRole: 'PATHOLOGIST',
          action: 'PATHOLOGIST_VALIDATION',
          targetEntity: 'INVESTIGATION_REPORT',
          targetEntityId: reportId,
          justification: input.clinicalImpression || 'Pathologist clinical sign-off and digital release',
          operationStatus: 'SUCCESS',
          correlationId: crypto.randomUUID(),
          metadata: { digitalSignature: input.digitalSignature, reportNumber },
          occurredAt: now
        } as any);
      } catch {}

      const updated = await this.getOrderById(tenantId, orderId, tx);
      if (updated) {
        updated.status = 'VERIFIED';
        updated.verifiedBy = input.pathologistId;
        updated.verifiedAt = now;
        updated.results = verifiedResults;
        updated.report = reportPayload;
      }
      return updated;
    });
  }

  async deliverReport(
    tenantId: string,
    orderId: string,
    input: DeliverReportInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) return null;

    if (order.status !== 'VERIFIED' && order.status !== 'COMPLETED') {
      throw new AppError({
        message: 'Cannot deliver report before pathologist verification is completed.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const now = new Date();
    return await runInTx(db, async (tx: any) => {
      try {
        await tx
          .update(investigationReports)
          .set({
            updatedAt: now,
            metadata: sql`jsonb_set(coalesce(metadata, '{}'::jsonb), '{delivery}', ${JSON.stringify({
              channel: input.deliveryChannel,
              recipient: input.recipient,
              deliveredAt: now.toISOString(),
              deliveredBy: input.deliveredBy || 'SYSTEM'
            })}::jsonb)`
          } as any)
          .where(and(eq(investigationReports.tenantId, tenantId), eq(investigationReports.orderId, orderId)));
      } catch {}

      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
      await tx
        .update(investigationOrders)
        .set({
          status: 'DELIVERED',
          metadata: {
            ...orderMeta,
            delivery: {
              channel: input.deliveryChannel,
              deliveryChannel: input.deliveryChannel,
              recipient: input.recipient,
              deliveredAt: now,
              deliveredBy: input.deliveredBy || 'SYSTEM',
              notes: input.notes
            }
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      try {
        await tx.insert(investigationAuditTraces).values({
          id: crypto.randomUUID(),
          traceId: 'TRACE-' + crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          branchId: order.branchId || null,
          orderId: order.id,
          patientId: order.patientId,
          actorId: input.deliveredBy || 'SYSTEM',
          actorRole: 'SYSTEM_DELIVERY',
          action: 'DELIVER_REPORT',
          targetEntity: 'INVESTIGATION_REPORT',
          targetEntityId: order.report?.id || order.id,
          justification: `Diagnostic report dispatched via ${input.deliveryChannel} to ${input.recipient}`,
          operationStatus: 'SUCCESS',
          correlationId: crypto.randomUUID(),
          metadata: { channel: input.deliveryChannel, recipient: input.recipient },
          occurredAt: now
        } as any);
      } catch {}

      return await this.getOrderById(tenantId, orderId, tx);
    });
  }

  async lookupByBarcode(
    tenantId: string,
    barcode: string,
    dbClient = getDatabase()
  ): Promise<{ order: StoredLabOrder; specimen: any } | null> {
    const db = requireDb(dbClient);
    try {
      const cleanBarcode = barcode.trim();
      const specRows = await db
        .select()
        .from(investigationSpecimens)
        .where(and(eq(investigationSpecimens.tenantId, tenantId), eq(investigationSpecimens.accessionNumber, cleanBarcode)))
        .limit(1);

      if (specRows && specRows.length > 0 && specRows[0]) {
        const spec = specRows[0];
        const order = await this.getOrderById(tenantId, spec.orderId, db);
        if (order) {
          return { order, specimen: spec };
        }
      }

      const allOrders = await this.searchOrders(tenantId, undefined, undefined, db);
      for (const ord of allOrders) {
        if (ord.specimens && ord.specimens.some((s: any) => s.accessionNumber === cleanBarcode || s.barcode === cleanBarcode)) {
          const matchSpec = ord.specimens.find((s: any) => s.accessionNumber === cleanBarcode || s.barcode === cleanBarcode);
          return { order: ord, specimen: matchSpec };
        }
        if (ord.specimen && (ord.specimen.accessionNumber === cleanBarcode || ord.specimen.barcode === cleanBarcode)) {
          return { order: ord, specimen: ord.specimen };
        }
      }

      return null;
    } catch (err) {
      logger.error('Failed to lookup barcode in database', err);
      return null;
    }
  }

  evaluateLabQc(
    tenantId: string,
    input: LabQcEvaluationInput
  ) {
    const history = input.historyZScores || [];
    const evaluation = evaluateWestgardRules(
      input.targetMean,
      input.standardDeviation,
      input.measuredValue,
      history
    );

    return {
      tenantId,
      analyzerId: input.analyzerId,
      testCode: input.testCode,
      targetMean: input.targetMean,
      standardDeviation: input.standardDeviation,
      measuredValue: input.measuredValue,
      lotNumber: input.lotNumber || 'QC-DEFAULT-LOT',
      operatorId: input.operatorId || 'LAB_QC_OPERATOR',
      zScore: evaluation.zScore,
      westgardStatus: evaluation.westgardStatus,
      violatedRules: evaluation.violatedRules,
      recommendation: evaluation.recommendation,
      evaluatedAt: new Date().toISOString()
    };
  }

  async logPanicIntimation(
    tenantId: string,
    orderId: string,
    intimationRecord: any,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) return null;

    const now = new Date();
    try {
      return await runInTx(db, async (tx: any) => {
        const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
        const updatedMeta = {
          ...orderMeta,
          panicIntimation: intimationRecord,
          isPanicIntimated: true,
          isCritical: true,
          intimatedAt: intimationRecord.intimatedAt || now.toISOString()
        };

        try {
          await tx
            .update(criticalPanicValueAlerts)
            .set({
              communicatedToDoctor: true,
              acknowledgementTimestamp: now
            } as any)
            .where(and(eq(criticalPanicValueAlerts.tenantId, tenantId), eq(criticalPanicValueAlerts.patientMrn, order.patientMrn || '')));
        } catch {}

        await tx
          .update(investigationOrders)
          .set({
            isCritical: true,
            metadata: updatedMeta,
            updatedAt: now
          } as any)
          .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

        try {
          await tx.insert(investigationAuditTraces).values({
            id: crypto.randomUUID(),
            traceId: 'TRACE-' + crypto.randomUUID(),
            tenantId,
            partnerId: order.partnerId,
            organizationId: order.organizationId,
            branchId: order.branchId || null,
            orderId: order.id,
            patientId: order.patientId,
            actorId: intimationRecord.callerName || intimationRecord.communicatedBy || 'LAB_TECHNICIAN',
            actorRole: 'LAB_TECHNICIAN',
            action: 'PANIC_INTIMATION_RECORDED',
            targetEntity: 'INVESTIGATION_ORDER',
            targetEntityId: order.id,
            justification: `Verbal read-back intimation logged with Dr. ${intimationRecord.recipientDoctorName || order.orderingDoctorName}`,
            operationStatus: 'SUCCESS',
            correlationId: crypto.randomUUID(),
            metadata: intimationRecord,
            occurredAt: now
          } as any);
        } catch {}

        return await this.getOrderById(tenantId, orderId, tx);
      });
    } catch (err) {
      logger.error('Failed to log panic intimation in database', err);
      throw new AppError({
        message: 'Database update failed. Panic intimation logging aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // NABL & NABH 5th EDITION: IMMUTABLE RESULT AMENDMENTS & AUDIT LEDGER
  // =========================================================================
  async amendResult(
    tenantId: string,
    orderId: string,
    input: {
      resultId: string;
      newValue: string;
      newAbnormalFlag?: string | undefined;
      clinicalReason: string;
      amendedBy: string;
      amendedRole: string;
    },
    dbClient = getDatabase()
  ) {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(tenantId, orderId, db);
    if (!order) {
      throw new AppError({
        message: `Lab order ${orderId} not found`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const result = order.results.find((r) => r.id === input.resultId);
    if (!result) {
      throw new AppError({
        message: `Investigation result ${input.resultId} not found on order ${orderId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const now = new Date();

    return await runInTx(db, async (tx: any) => {
      // 1. Fetch previous amendments count for this result
      const previousAmendments = await tx
        .select({ id: investigationResultAmendments.id })
        .from(investigationResultAmendments)
        .where(
          and(
            eq(investigationResultAmendments.tenantId, tenantId),
            eq(investigationResultAmendments.resultId, input.resultId)
          )
        );

      const amendmentNumber = previousAmendments.length + 1;

      // 2. Insert immutable amendment record into NABL audit ledger
      const [amendment] = await tx
        .insert(investigationResultAmendments)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          orderId: order.id,
          resultId: result.id,
          reportId: null,
          amendmentNumber,
          previousValue: result.resultValue,
          newValue: input.newValue,
          previousAbnormalFlag: result.abnormalFlag || null,
          newAbnormalFlag: input.newAbnormalFlag || result.abnormalFlag || null,
          reason: input.clinicalReason.trim(),
          amendedBy: input.amendedBy,
          amendedRole: input.amendedRole,
          amendedAt: now
        })
        .returning();

      // 3. Update current working value in investigation_results
      await tx
        .update(investigationResults)
        .set({
          resultValue: input.newValue,
          abnormalFlag: input.newAbnormalFlag || result.abnormalFlag,
          updatedAt: now
        })
        .where(
          and(
            eq(investigationResults.tenantId, tenantId),
            eq(investigationResults.id, input.resultId)
          )
        );

      // 4. Update order status to AMENDED
      await tx
        .update(investigationOrders)
        .set({
          status: 'AMENDED',
          updatedAt: now
        })
        .where(
          and(
            eq(investigationOrders.tenantId, tenantId),
            eq(investigationOrders.id, orderId)
          )
        );

      // 5. Append Cryptographic Audit Trace to investigation_audit_traces
      try {
        const traceHash = crypto
          .createHash('sha256')
          .update(
            JSON.stringify({
              orderId,
              resultId: result.id,
              previousValue: result.resultValue,
              newValue: input.newValue,
              reason: input.clinicalReason,
              amendedBy: input.amendedBy,
              timestamp: now.toISOString()
            })
          )
          .digest('hex');

        await tx.insert(investigationAuditTraces).values({
          id: crypto.randomUUID(),
          traceId: 'TRACE-AMEND-' + crypto.randomUUID(),
          tenantId,
          partnerId: order.partnerId,
          organizationId: order.organizationId,
          branchId: order.branchId || null,
          orderId: order.id,
          patientId: order.patientId,
          actorId: input.amendedBy,
          actorRole: input.amendedRole,
          action: 'AMEND_LAB_RESULT',
          targetEntity: 'INVESTIGATION_RESULT',
          targetEntityId: result.id,
          justification: `NABL amendment logged: "${input.clinicalReason.trim()}". Value changed from "${result.resultValue}" to "${input.newValue}"`,
          operationStatus: 'SUCCESS',
          correlationId: crypto.randomUUID(),
          metadata: {
            amendmentNumber,
            previousValue: result.resultValue,
            newValue: input.newValue,
            reason: input.clinicalReason,
            traceHash
          },
          occurredAt: now
        });
      } catch (auditErr) {
        logger.warn('Failed to append investigation audit trace for amendment', { error: String(auditErr) });
      }

      return {
        amendment,
        updatedOrder: await this.getOrderById(tenantId, orderId, tx)
      };
    });
  }

  async getAmendmentHistory(tenantId: string, orderId: string, dbClient = getDatabase()) {
    const db = requireDb(dbClient);
    return await db
      .select()
      .from(investigationResultAmendments)
      .where(
        and(
          eq(investigationResultAmendments.tenantId, tenantId),
          eq(investigationResultAmendments.orderId, orderId)
        )
      )
      .orderBy(asc(investigationResultAmendments.amendedAt));
  }
}

export const labDiagnosticsRepository = new LabDiagnosticsRepository();
