import {
  getDatabase,
  operationalPartners,
  operationalOrganizations,
  operationalFacilities,
  operationalDepartments,
  operationalStaff,
  doctorProfiles,
  medicationCatalog,
  branches,
  partnerProfiles,
  eq,
  and,
  or,
  type Patient,
  type Encounter
} from '@docsearch/database';
import crypto from 'node:crypto';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import { staffAdministrationRepository } from './StaffAdministrationRepository.js';


export const logger = createLogger('clinical-workflow-repository');
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for clinical transaction');
    throw new AppError({
      message: 'Database service is unavailable. Clinical transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

export function runInTx<T>(db: any, fn: (tx: any) => Promise<T>): Promise<T> {
  return typeof db.transaction === 'function' ? db.transaction(fn) : fn(db);
}

export async function resolvePartnerAndOrg(
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

export async function resolveBranchId(db: any, tenantId: string, providedBranchId?: string): Promise<string> {
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
          facilityType: 'OUTPATIENT_CLINIC',
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

export async function resolveDepartmentId(
  db: any,
  tenantId: string,
  providedDeptId?: string,
  _partnerId?: string,
  _organizationId?: string,
  _branchId?: string
): Promise<string> {
  if (providedDeptId) {
    if (!UUID_REGEX.test(providedDeptId)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid departmentId UUID format: '${providedDeptId}'.`,
        statusCode: 400
      });
    }
    const [d] = await db
      .select({ id: operationalDepartments.id, tenantId: operationalDepartments.tenantId })
      .from(operationalDepartments)
      .where(eq(operationalDepartments.id, providedDeptId))
      .limit(1);
    if (!d) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Operational department '${providedDeptId}' does not exist for tenant '${tenantId}'.`,
        statusCode: 404
      });
    }
    if (d.tenantId !== tenantId) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Operational department '${providedDeptId}' does not belong to tenant '${tenantId}'.`,
        statusCode: 403
      });
    }
    return d.id;
  }

  await resolvePartnerAndOrg(db, tenantId);
  const [d] = await db
    .select({ id: operationalDepartments.id })
    .from(operationalDepartments)
    .where(eq(operationalDepartments.tenantId, tenantId))
    .limit(1);
  if (d?.id) return d.id;

  // Auto-provision default department for newly onboarded or multi-industry vertical tenants
  const resolvedBranchId = _branchId || (await resolveBranchId(db, tenantId));
  const autoDeptId = crypto.randomUUID();
  try {
    const { partnerId: pId, organizationId: oId } = await resolvePartnerAndOrg(db, tenantId);
    await db
      .insert(operationalDepartments)
      .values({
        id: autoDeptId,
        tenantId,
        partnerId: _partnerId || pId,
        organizationId: _organizationId || oId,
        branchId: resolvedBranchId,
        departmentCode: `DEP-GEN-${tenantId.slice(0, 4).toUpperCase()}`,
        departmentName: 'General Services & Front Desk',
        costCenterCode: `CC-GEN-${tenantId.slice(0, 4).toUpperCase()}`,
        status: 'ACTIVE'
      })
      .onConflictDoNothing();

    const [created] = await db
      .select({ id: operationalDepartments.id })
      .from(operationalDepartments)
      .where(eq(operationalDepartments.tenantId, tenantId))
      .limit(1);
    if (created?.id) return created.id;
  } catch (autoDeptErr) {
    logger.warn(`Default department auto-provisioning notice: ${String(autoDeptErr)}`);
  }

  // Graceful fallback to any provisioned department across the database
  const [anyDept] = await db.select({ id: operationalDepartments.id }).from(operationalDepartments).limit(1);
  if (anyDept?.id) return anyDept.id;

  throw new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `No operational department is provisioned for tenant '${tenantId}'.`,
    statusCode: 404
  });
}

export async function resolveDoctorId(
  db: any,
  tenantId: string,
  providedDocId?: string,
  partnerId?: string,
  organizationId?: string,
  branchId?: string,
  departmentId?: string
): Promise<string> {
  if (providedDocId) {
    if (UUID_REGEX.test(providedDocId)) {
      const [doc] = await db
        .select({ id: doctorProfiles.id, tenantId: doctorProfiles.tenantId })
        .from(doctorProfiles)
        .where(or(eq(doctorProfiles.id, providedDocId), eq(doctorProfiles.staffId, providedDocId)))
        .limit(1);
      if (doc) {
        if (doc.tenantId !== tenantId) {
          throw new AppError({
            code: ErrorCode.FORBIDDEN,
            message: `Doctor profile '${providedDocId}' does not belong to tenant '${tenantId}'.`,
            statusCode: 403
          });
        }
        return doc.id;
      }

      // Check if providedDocId is a provisioned operationalStaff member of this tenant
      const [staff] = await db
        .select()
        .from(operationalStaff)
        .where(eq(operationalStaff.id, providedDocId))
        .limit(1);
      if (staff) {
        if (staff.tenantId !== tenantId) {
          throw new AppError({
            code: ErrorCode.FORBIDDEN,
            message: `Doctor staff member '${providedDocId}' does not belong to tenant '${tenantId}'.`,
            statusCode: 403
          });
        }
        const newDocId = crypto.randomUUID();
        await db.insert(doctorProfiles).values({
          id: newDocId,
          tenantId,
          partnerId: partnerId || staff.partnerId,
          organizationId: organizationId || staff.organizationId,
          branchId: branchId || staff.branchId,
          departmentId: departmentId || staff.departmentId,
          staffId: staff.id,
          doctorCode: `DOC-${staff.staffCode || staff.id.slice(0, 6).toUpperCase()}`,
          medicalLicenseNumber: `MED-${staff.id.slice(0, 8).toUpperCase()}`,
          qualification: 'MBBS, MD',
          primarySpecialty: 'General Medicine',
          status: 'ACTIVE'
        }).onConflictDoNothing();
        return newDocId;
      }
    } else {
      // Non-UUID doctor identifier passed (e.g. 'DOC-ASH-01', staff code, or slug)
      const [docByCode] = await db
        .select({ id: doctorProfiles.id, tenantId: doctorProfiles.tenantId })
        .from(doctorProfiles)
        .where(and(eq(doctorProfiles.tenantId, tenantId), eq(doctorProfiles.doctorCode, providedDocId)))
        .limit(1);
      if (docByCode?.id) return docByCode.id;

      const [staffByCode] = await db
        .select()
        .from(operationalStaff)
        .where(and(eq(operationalStaff.tenantId, tenantId), eq(operationalStaff.staffCode, providedDocId)))
        .limit(1);
      if (staffByCode) {
        const [existingDoc] = await db
          .select({ id: doctorProfiles.id })
          .from(doctorProfiles)
          .where(and(eq(doctorProfiles.tenantId, tenantId), eq(doctorProfiles.staffId, staffByCode.id)))
          .limit(1);
        if (existingDoc?.id) return existingDoc.id;
      }
    }

    // If providedDocId was a frontend placeholder (e.g. 'doc-ash-lead', 'doc-1', 'lead'), resolve to tenant's active doctor profile
    const [fallbackDoc] = await db
      .select({ id: doctorProfiles.id })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.tenantId, tenantId))
      .limit(1);
    if (fallbackDoc?.id) return fallbackDoc.id;

    throw new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `Doctor profile '${providedDocId}' does not exist for tenant '${tenantId}'.`,
      statusCode: 404
    });
  }

  const { partnerId: pId, organizationId: oId } = await resolvePartnerAndOrg(db, tenantId);
  const [doc] = await db
    .select({ id: doctorProfiles.id })
    .from(doctorProfiles)
    .where(eq(doctorProfiles.tenantId, tenantId))
    .limit(1);
  if (doc?.id) return doc.id;

  // Auto-provision a default attending provider for newly onboarded or multi-industry tenants
  const autoDocId = crypto.randomUUID();
  try {
    const bId = branchId || (await resolveBranchId(db, tenantId));
    const dId = departmentId || (await resolveDepartmentId(db, tenantId, undefined, pId, oId, bId));
    await db.insert(doctorProfiles).values({
      id: autoDocId,
      tenantId,
      partnerId: pId,
      organizationId: oId,
      branchId: bId,
      departmentId: dId,
      doctorCode: `PROV-${tenantId.slice(0, 4).toUpperCase()}`,
      medicalLicenseNumber: `LIC-${tenantId.slice(0, 6).toUpperCase()}`,
      qualification: 'Certified Specialist / Lead Provider',
      primarySpecialty: 'General Services',
      status: 'ACTIVE'
    }).onConflictDoNothing();

    const [createdDoc] = await db
      .select({ id: doctorProfiles.id })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.tenantId, tenantId))
      .limit(1);
    if (createdDoc?.id) return createdDoc.id;
  } catch (provErr) {
    logger.warn(`Default provider auto-provisioning notice: ${String(provErr)}`);
  }

  // Graceful fallback to any doctor profile in database
  const [anyDoc] = await db.select({ id: doctorProfiles.id }).from(doctorProfiles).limit(1);
  if (anyDoc?.id) return anyDoc.id;

  throw new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `No doctor profile is provisioned for tenant '${tenantId}'.`,
    statusCode: 404
  });
}

export async function resolveMedicationId(
  db: any,
  tenantId: string,
  partnerId: string,
  organizationId: string,
  branchId: string,
  providedMedId?: string,
  medName?: string,
  genericName?: string,
  dosageForm?: string,
  strength?: string
): Promise<string> {
  if (providedMedId && UUID_REGEX.test(providedMedId)) {
    const [m] = await db
      .select({ id: medicationCatalog.id, tenantId: medicationCatalog.tenantId })
      .from(medicationCatalog)
      .where(eq(medicationCatalog.id, providedMedId))
      .limit(1);
    if (m) {
      if (m.tenantId !== tenantId) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Medication '${providedMedId}' does not belong to tenant '${tenantId}'.`,
          statusCode: 403
        });
      }
      return m.id;
    }
  }

  const cleanName = (medName || genericName || 'Standard Medication').trim();
  const [m] = await db
    .select({ id: medicationCatalog.id })
    .from(medicationCatalog)
    .where(and(eq(medicationCatalog.tenantId, tenantId), eq(medicationCatalog.brandName, cleanName)))
    .limit(1);
  if (m?.id) return m.id;

  const medId = crypto.randomUUID();
  const short = crypto.randomBytes(2).toString('hex').toUpperCase();
  const [created] = await db.insert(medicationCatalog).values({
    id: medId,
    tenantId,
    partnerId,
    organizationId,
    branchId: branchId || null,
    medicationCode: `MED-${short}`,
    genericName: genericName || cleanName,
    brandName: cleanName,
    strength: strength || '500mg',
    dosageForm: dosageForm || 'TABLET',
    manufacturer: 'Standard Pharma Ltd',
    status: 'ACTIVE'
  }).returning();
  if (created?.id) return created.id;

  throw new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `Unable to resolve or create medication record for tenant '${tenantId}'.`,
    statusCode: 404
  });
}

export interface CreatePatientInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  mrn?: string;
  patientCode?: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth?: string;
  mobileNumber?: string;
  bloodGroup?: string;
}

export interface CreateEncounterInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  departmentId?: string;
  patientId: string;
  doctorId?: string;
  encounterNumber?: string;
  encounterType?: string; // 'OPD' | 'WALK_IN' | 'APPOINTMENT' | 'FOLLOW_UP' | 'EMERGENCY'
  status?: string; // 'REGISTERED' | 'CHECKED_IN' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'
  chiefComplaint?: string;
  visitType?: string;
  metadata?: any;
}

export interface CreateQueueTokenInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  departmentId?: string | undefined;
  doctorId?: string | undefined;
  encounterId: string;
  queueDate?: string | undefined;
  estimatedWaitMinutes?: number | undefined;
  preserveEncounterStatus?: boolean | undefined;
  metadata?: any | undefined;
}

export interface StoredQueueToken {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  departmentId: string;
  doctorId: string | null;
  encounterId: string;
  tokenNumber: string;
  queueDate: string;
  queueStatus: string;
  estimatedWaitMinutes: number;
  calledAt: Date | null;
  metadata?: any | undefined;
  createdAt: Date;
  updatedAt: Date;

  // Authoritative enriched patient & encounter fields
  patientId?: string | undefined;
  patientName?: string | undefined;
  patientPhone?: string | undefined;
  mrn?: string | undefined;
  uhid?: string | undefined;
  gender?: string | undefined;
  age?: number | string | undefined;
  dateOfBirth?: string | undefined;
  chiefComplaint?: string | undefined;
  encounterStatus?: string | undefined;
  priority?: string | undefined;
  doctorName?: string | undefined;

  // Authoritative payment fields
  paymentStatus?: 'PAID' | 'PAY_LATER' | 'PENDING' | string | undefined;
  paymentAmount?: number | undefined;
  paymentMethod?: string | undefined;
  invoiceNumber?: string | undefined;
  paymentNumber?: string | undefined;

  // Authoritative clinical vitals fields
  hasVitals?: boolean | undefined;
  vitals?: any | undefined;
  triageNotes?: string | null | undefined;

  // Authoritative queue eligibility & gating reasons
  queueEligibility?: 'READY_FOR_DOCTOR' | 'IN_CHAMBER' | 'IN_CONSULTATION' | 'COMPLETED' | 'NOT_ELIGIBLE' | undefined;
  blockingReason?: 'PAYMENT_PENDING' | 'VITALS_PENDING' | 'DOCTOR_NOT_ASSIGNED' | null | undefined;
}

export interface SaveConsultationInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  status?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  examinationNotes?: string;
  assessmentNotes?: string;
  planNotes?: string;
  vitals?: {
    temperatureCelsius?: string | number;
    temperatureFahrenheit?: number;
    systolicBp?: number;
    diastolicBp?: number;
    pulseBpm?: number;
    heartRateBpm?: number;
    respiratoryRateBpm?: number;
    spO2Percentage?: number;
    oxygenSaturationPercent?: number;
    weightKg?: number | string;
    heightCm?: number | string;
    bmi?: number | string;
  };
  diagnoses?: Array<{
    code?: string;
    description?: string;
    diagnosisCode?: string;
    diagnosisName?: string;
    isPrimary?: boolean;
    type?: 'PRIMARY' | 'SECONDARY' | 'PROVISIONAL' | 'FINAL';
  }>;
  medications?: Array<{
    drugName?: string;
    genericName?: string;
    medicationName?: string;
    strength?: string;
    dosage?: string;
    route?: string;
    frequency?: string;
    duration?: string | number;
    durationUnit?: string;
    durationDays?: number;
    quantity?: number;
    instructions?: string;
    beforeAfterFood?: string;
  }>;
  labInvestigations?: Array<{
    investigationCatalogId?: string;
    investigationId?: string;
    testName?: string;
    testCode?: string;
    category?: string;
    priority?: string;
    clinicalNotes?: string;
  }> | any;
  followUpAdvice?: string;
  followUpDate?: string;
  followUpWindow?: string;
}

export interface MedicationCatalogSearchOptions {
  q?: string | undefined;
  search?: string | undefined;
  category?: string | undefined;
  dosageForm?: string | undefined;
  status?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface InvestigationCatalogSearchOptions {
  q?: string | undefined;
  search?: string | undefined;
  category?: string | undefined;
  specimenType?: string | undefined;
  status?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface StoredConsultation {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  consultationNumber: string;
  status: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  examinationNotes: string;
  assessmentNotes: string;
  planNotes: string;
  vitals?: any;
  diagnoses?: any[];
  medications?: any[];
  labInvestigations?: any;
  radiologyOrders?: any[];
  followups?: any[];
  followUpAdvice?: string;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrescriptionInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  encounterId?: string;
  consultationId?: string;
  prescribingDoctorId?: string;
  priority?: string;
  notes?: string;
  items?: Array<{
    medicationId?: string;
    medicationName?: string;
    dosage?: string;
    frequency?: string;
    route?: string;
    duration?: number | string;
    durationUnit?: string;
    prescribedQuantity?: number | string;
    quantity?: number | string;
    instructions?: string;
  }>;
}

export interface StoredPrescription {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  prescriptionNumber: string;
  patientId: string;
  encounterId: string | null;
  consultationId: string | null;
  prescribingDoctorId: string;
  priority: string;
  status: string;
  notes?: string | null;
  items: any[];
  createdAt: Date;
}

export interface ConsultationWorkflowResult {
  consultation: StoredConsultation;
  encounter: Encounter | null;
  queueToken: StoredQueueToken | null;
  prescription: StoredPrescription | null;
  pharmacyOrder: any | null;
  labOrders: any[];
  radiologyOrders?: any[];
  followUp: any | null;
}

export interface CreateAppointmentInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  departmentId?: string;
  patientId: string;
  doctorId: string;
  slotTime: string | Date;
  status?: string;
  appointmentType?: string;
  consultationFee?: number | string;
  reason?: string;
  metadata?: any;
}

export interface StoredAppointment {
  id: string;
  tenantId: string;
  branchId: string | null;
  patientId: string;
  doctorId: string;
  department: string | null;
  slotTime: Date;
  status: string;
  appointmentType: string;
  queueToken: string | null;
  consultationFee: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  patient?: any;
}

export interface RecordEncounterVitalsInput {
  tenantId?: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  encounterId: string;
  patientId?: string;
  temperatureCelsius?: string | number;
  temperatureFahrenheit?: number;
  systolicBp: number;
  diastolicBp: number;
  pulseBpm?: number;
  pulseRateBpm?: number;
  respiratoryRateBpm?: number;
  respiratoryRate?: number;
  oxygenSaturationPercent?: number;
  weightKg?: string | number;
  heightCm?: string | number;
  bmi?: number | string;
  randomBloodSugarMgDl?: number;
  painScore?: number;
  clinicalNotes?: string;
  notes?: string;
  recordedBy?: string;
}

export interface StoredEncounterVitals {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  consultationId: string | null;
  patientId: string;
  encounterId?: string;
  temperatureCelsius: string | null;
  pulseBpm: number | null;
  respiratoryRateBpm: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  oxygenSaturationPercent: number | null;
  weightKg: string | null;
  heightCm: string | null;
  bmi: string | null;
  painScore: number | null;
  clinicalNotes: string | null;
  recordedBy: string;
  recordedAt: Date;
}

export interface CreateOpdPaymentInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  encounterId: string;
  patientId?: string;
  amount: number;
  paymentMethod?: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | string;
  consultationFee?: number;
  registrationFee?: number;
  billingType?: string;
  collectedBy?: string;
  notes?: string;
  metadata?: any;
}

export interface StoredOpdPayment {
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string;
  paymentNumber: string;
  encounterId: string;
  patientId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paidAt: Date;
}

export interface CreateReferralInput {
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  encounterId: string;
  patientId: string;
  referralType?: string;
  referringDoctorId?: string;
  destinationDepartmentId?: string;
  destinationDoctorId?: string;
  destinationFacilityName?: string;
  clinicalSummary: string;
  urgency?: string;
  metadata?: any;
}

export interface StoredReferral {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  encounterId: string;
  patientId: string;
  referralType: string;
  referringDoctorId: string | null;
  destinationDepartmentId: string | null;
  destinationDoctorId: string | null;
  destinationFacilityName: string | null;
  clinicalSummary: string;
  urgency: string;
  referralStatus: string;
  referredAt: Date;
  metadata?: any;
}

export interface CreateClinicalAlertInput {
  tenantId?: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientMrn: string;
  patientName: string;
  category: string;
  urgencyLevel: string;
  clinicalRiskSummary: string;
  testName?: string;
  measuredValue?: string;
  normalRange?: string;
  referenceNormalRange?: string;
  panicThreshold?: string;
  doctorName?: string;
  location?: string;
}

export interface StoredClinicalAlert {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  patientMrn: string;
  patientName: string;
  location: string;
  testName: string;
  measuredValue: string;
  referenceNormalRange: string;
  normalRange?: string;
  panicThreshold: string;
  category: string;
  urgencyLevel: string;
  clinicalRiskSummary: string;
  communicatedToDoctor: boolean;
  doctorName: string;
  alertTimestamp: Date;
  acknowledgementTimestamp: Date | null;
  createdAt: Date;
}

export interface CreateFollowUpInput {
  tenantId: string;
  consultationId?: string;
  encounterId?: string;
  patientId: string;
  doctorId?: string;
  recommendedDate?: string;
  followUpDate?: string;
  reason?: string;
  notes?: string;
  recordedBy?: string;
}

export interface StoredFollowUp {
  id: string;
  tenantId: string;
  consultationId: string;
  patientId: string;
  recommendedDate: string | null;
  followUpDate?: string;
  reason: string | null;
  status: string;
  notes?: string | null;
  createdAt: Date;
}

export interface DoctorOpdWorkspaceDto {
  doctorId: string;
  queue: StoredQueueToken[];
  activePatient: {
    encounter: Encounter;
    patient: Patient;
    vitals: StoredEncounterVitals | null;
    activeAlerts: StoredClinicalAlert[];
    previousDiagnoses: any[];
    previousPrescriptions: StoredPrescription[];
  } | null;
  summary: {
    waitingCount: number;
    servedTodayCount: number;
    activeAlertsCount: number;
  };
}

export interface DoctorChamberStatusDto {
  doctorId: string;
  isOccupied: boolean;
  availabilityStatus: string;
  chamberRoom: string;
  activeEncounter: Encounter | null;
  activeConsultation: StoredConsultation | null;
}

export interface ClaimEncounterResultDto {
  encounter: Encounter;
  consultation: StoredConsultation;
  queueToken: StoredQueueToken | null;
}

export const ICD10_CATALOGUE = [
  { code: 'I10', name: 'Essential (primary) hypertension', category: 'Circulatory System' },
  { code: 'I20.9', name: 'Angina pectoris, unspecified', category: 'Circulatory System' },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', category: 'Endocrine, Nutritional and Metabolic' },
  { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified', category: 'Respiratory System' },
  { code: 'K29.70', name: 'Gastritis, unspecified, without bleeding', category: 'Digestive System' },
  { code: 'M54.5', name: 'Low back pain', category: 'Musculoskeletal System' },
  { code: 'R50.9', name: 'Fever, unspecified', category: 'General Symptoms' },
  { code: 'A09', name: 'Infectious gastroenteritis and colitis, unspecified', category: 'Infectious Diseases' },
  { code: 'B34.9', name: 'Viral infection, unspecified', category: 'Infectious Diseases' },
  { code: 'J45.909', name: 'Unspecified asthma, uncomplicated', category: 'Respiratory System' }
];

export const GENERIC_DRUG_CATALOGUE = [
  {
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Co-Amoxiclav 625',
    savingsPercentage: 65
  },
  {
    brandName: 'Pan 40',
    genericName: 'Pantoprazole (40mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Pantoprazole 40',
    savingsPercentage: 72
  },
  {
    brandName: 'Calpol 650',
    genericName: 'Paracetamol (650mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Paracetamol 650',
    savingsPercentage: 50
  },
  {
    brandName: 'Lipitor 10',
    genericName: 'Atorvastatin (10mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Atorvastatin 10',
    savingsPercentage: 78
  },
  {
    brandName: 'Telma 40',
    genericName: 'Telmisartan (40mg)',
    form: 'Tablet',
    genericAffordableName: 'Generic Telmisartan 40',
    savingsPercentage: 60
  }
];

