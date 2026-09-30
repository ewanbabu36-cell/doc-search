import {
  getDatabase,
  patients,
  patientContacts,
  encounters,
  encounterQueues,
  consultations,
  consultationVitals,
  consultationDiagnoses,
  consultationMedications,
  consultationFollowups,
  radiologyOrders,
  pharmacyPrescriptions,
  pharmacyPrescriptionItems,
  pharmacyDispensing,
  billingInvoices,
  billingInvoiceItems,
  billingPayments,
  appointmentsPartitioned,
  encounterReferrals,
  criticalPanicValueAlerts,
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
  ne,
  and,
  or,
  ilike,
  desc,
  asc,
  type Patient,
  type Encounter
} from '@docsearch/database';
import crypto from 'node:crypto';
import { AppError, ErrorCode, createLogger, normalizePhoneNumber } from '@docsearch/shared-core';
import { slotLockManager } from '@docsearch/shared-core/server';
import { labDiagnosticsRepository } from './LabDiagnosticsRepository.js';
import { radiologyRepository } from './RadiologyRepository.js';
import { staffAdministrationRepository } from './StaffAdministrationRepository.js';

const logger = createLogger('clinical-workflow-repository');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireDb(dbClient = getDatabase()) {
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

async function resolveDepartmentId(
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

  throw new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `No operational department is provisioned for tenant '${tenantId}'.`,
    statusCode: 404
  });
}

async function resolveDoctorId(
  db: any,
  tenantId: string,
  providedDocId?: string,
  partnerId?: string,
  organizationId?: string,
  branchId?: string,
  departmentId?: string
): Promise<string> {
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

    throw new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `Doctor profile '${providedDocId}' does not exist for tenant '${tenantId}'.`,
      statusCode: 404
    });
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

async function resolveMedicationId(
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
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  departmentId?: string;
  doctorId?: string;
  encounterId: string;
  queueDate?: string;
  estimatedWaitMinutes?: number;
  metadata?: any;
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
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
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
    testName?: string;
    testCode?: string;
    category?: string;
    priority?: string;
  }> | any;
  followUpAdvice?: string;
  followUpDate?: string;
  followUpWindow?: string;
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

const ICD10_CATALOGUE = [
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

const GENERIC_DRUG_CATALOGUE = [
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

export class ClinicalWorkflowRepository {
  // =========================================================================
  // 1. PATIENT REGISTRATION & DEDUPLICATION (IDEMPOTENT)
  // =========================================================================

  async searchPatients(
    tenantId: string,
    query?: string,
    dbClient = getDatabase(),
    scopeFilters?: { branchId?: string | undefined; departmentId?: string | undefined }
  ): Promise<Patient[]> {
    const db = requireDb(dbClient);
    try {
      let rows = await db
        .select()
        .from(patients)
        .where(eq(patients.tenantId, tenantId))
        .orderBy(desc(patients.createdAt));

      if (scopeFilters?.branchId) {
        rows = rows.filter((r) => r.branchId === scopeFilters.branchId);
      }
      if (scopeFilters?.departmentId) {
        rows = rows.filter(
          (r) =>
            (r as any).departmentId === scopeFilters.departmentId ||
            ((r.metadata as any)?.departmentId && (r.metadata as any).departmentId === scopeFilters.departmentId)
        );
      }

      if (!query) return rows;
      const q = query.toLowerCase().trim();
      const matchingContactPatientIds = new Set<string>();
      try {
        const contactRows = await db
          .select({ patientId: patientContacts.patientId })
          .from(patientContacts)
          .where(and(
            eq(patientContacts.tenantId, tenantId),
            or(
              ilike(patientContacts.primaryMobile, `%${q}%`),
              ilike(patientContacts.alternateMobile, `%${q}%`),
              ilike(patientContacts.email, `%${q}%`)
            )
          ));
        for (const c of contactRows) {
          if (c.patientId) matchingContactPatientIds.add(c.patientId);
        }
      } catch {
        // Fallback gracefully if contact table scan has issue
      }

      return rows.filter(r => 
        (r.firstName && r.firstName.toLowerCase().includes(q)) ||
        (r.lastName && r.lastName.toLowerCase().includes(q)) ||
        (r.mrn && r.mrn.toLowerCase().includes(q)) ||
        (r.patientCode && r.patientCode.toLowerCase().includes(q)) ||
        matchingContactPatientIds.has(r.id)
      );
    } catch (err) {
      logger.error('Failed to query patients from database', err);
      throw new AppError({
        message: 'Database query failed. Patient data lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPatientById(
    tenantId: string,
    patientId: string,
    dbClient = getDatabase(),
    scopeFilters?: { branchId?: string | undefined; departmentId?: string | undefined }
  ): Promise<Patient | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(patients)
        .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)));
      if (!found) return null;

      if (scopeFilters?.branchId && found.branchId && found.branchId !== scopeFilters.branchId) {
        throw new AppError({
          message: 'Access denied: Patient record belongs to another branch outside your assigned branch scope.',
          code: ErrorCode.BRANCH_ACCESS_DENIED,
          statusCode: 403
        });
      }
      if (scopeFilters?.departmentId) {
        const patDept = (found as any).departmentId || (found.metadata as any)?.departmentId;
        if (patDept && patDept !== scopeFilters.departmentId) {
          throw new AppError({
            message: 'Access denied: Patient record belongs to another department outside your assigned department scope.',
            code: ErrorCode.FORBIDDEN,
            statusCode: 403
          });
        }
      }

      try {
        const [contact] = await db
          .select()
          .from(patientContacts)
          .where(and(eq(patientContacts.tenantId, tenantId), eq(patientContacts.patientId, patientId)));

        if (contact) {
          return {
            ...found,
            mobileNumber: contact.primaryMobile,
            primaryMobile: contact.primaryMobile,
            email: contact.email,
            contact
          } as any;
        }
      } catch (contactErr) {
        logger.warn('Failed to query patient contact information', { error: String(contactErr) });
      }

      return found;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to query patient by ID in database', err);
      throw new AppError({
        message: 'Database query failed. Patient lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createPatient(input: CreatePatientInput, dbClient = getDatabase()): Promise<Patient> {
    const db = requireDb(dbClient);

    // Tier 1 Authority: Idempotency / Duplicate Prevention by MRN
    if (input.mrn) {
      const [existingByMrn] = await db
        .select()
        .from(patients)
        .where(and(eq(patients.tenantId, input.tenantId), eq(patients.mrn, input.mrn)));
      if (existingByMrn) {
        const sameFirstName =
          String(existingByMrn.firstName || '').trim().toLowerCase() ===
          String(input.firstName || '').trim().toLowerCase();
        const sameLastName =
          String(existingByMrn.lastName || '').trim().toLowerCase() ===
          String(input.lastName || '').trim().toLowerCase();
        if (!sameFirstName || !sameLastName) {
          throw new AppError({
            message: `Duplicate MRN collision: MRN "${input.mrn}" is already assigned to another patient (${existingByMrn.id}) in this tenant.`,
            code: ErrorCode.CONFLICT,
            statusCode: 409
          });
        }
        logger.info('Duplicate patient registration prevented by MRN. Returning existing record.', { mrn: input.mrn, id: existingByMrn.id });
        try {
          const [contact] = await db
            .select()
            .from(patientContacts)
            .where(and(eq(patientContacts.tenantId, input.tenantId), eq(patientContacts.patientId, existingByMrn.id)));
          if (contact) {
            return {
              ...existingByMrn,
              mobileNumber: contact.primaryMobile,
              primaryMobile: contact.primaryMobile,
              contact
            } as any;
          }
        } catch {
          // Fallback to existing patient without contact
        }
        return existingByMrn;
      }
    }

    // Tier 2 Authority: Deduplication by Canonical Primary Mobile Number
    const normalizedMobile = input.mobileNumber ? normalizePhoneNumber(input.mobileNumber) : null;
    if (normalizedMobile) {
      const [existingContact] = await db
        .select()
        .from(patientContacts)
        .where(and(
          eq(patientContacts.tenantId, input.tenantId),
          eq(patientContacts.primaryMobile, normalizedMobile)
        ));

      if (existingContact) {
        const [existingPatient] = await db
          .select()
          .from(patients)
          .where(and(
            eq(patients.tenantId, input.tenantId),
            eq(patients.id, existingContact.patientId)
          ));

        if (existingPatient) {
          logger.info('Duplicate patient registration prevented by phone number. Returning existing record.', {
            tenantId: input.tenantId,
            phone: normalizedMobile,
            id: existingPatient.id,
            mrn: existingPatient.mrn
          });
          return {
            ...existingPatient,
            mobileNumber: existingContact.primaryMobile,
            primaryMobile: existingContact.primaryMobile,
            email: existingContact.email,
            contact: existingContact
          } as any;
        }
      }
    }

    const id = crypto.randomUUID();
    const mrn = input.mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const record = {
      id,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      patientCode: input.patientCode || `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
      mrn,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth || '2000-01-01',
      gender: input.gender || 'OTHER',
      bloodGroup: input.bloodGroup || null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      return await runInTx(db, async (tx) => {
        const [created] = await tx.insert(patients).values(record as unknown as typeof patients.$inferInsert).returning();
        if (!created) {
          throw new Error('Insert returned empty result');
        }

        let contactRecord = null;
        if (normalizedMobile) {
          const [contact] = await tx
            .insert(patientContacts)
            .values({
              id: crypto.randomUUID(),
              tenantId: input.tenantId,
              partnerId,
              patientId: created.id,
              primaryMobile: normalizedMobile,
              preferredContactMethod: 'MOBILE',
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();
          contactRecord = contact;
        }

        return {
          ...created,
          ...(contactRecord ? {
            mobileNumber: contactRecord.primaryMobile,
            primaryMobile: contactRecord.primaryMobile,
            contact: contactRecord
          } : (normalizedMobile ? { mobileNumber: normalizedMobile, primaryMobile: normalizedMobile } : {}))
        } as any;
      });
    } catch (err: any) {
      // Check if this was a concurrent unique constraint violation on primary_mobile or mrn
      const isUniqueViolation =
        err?.code === '23505' ||
        err?.message?.includes('unique') ||
        err?.message?.includes('duplicate key') ||
        err?.message?.includes('idx_patient_contacts_tenant_primary_mobile_uidx') ||
        err?.message?.includes('idx_patients_tenant_mrn');

      if (isUniqueViolation) {
        // Resolve concurrent phone collision
        if (normalizedMobile) {
          try {
            const [existingContact] = await db
              .select()
              .from(patientContacts)
              .where(and(
                eq(patientContacts.tenantId, input.tenantId),
                eq(patientContacts.primaryMobile, normalizedMobile)
              ));
            if (existingContact) {
              const [existingPatient] = await db
                .select()
                .from(patients)
                .where(and(
                  eq(patients.tenantId, input.tenantId),
                  eq(patients.id, existingContact.patientId)
                ));
              if (existingPatient) {
                logger.info('Resolved concurrent duplicate registration via phone collision.', { id: existingPatient.id });
                return {
                  ...existingPatient,
                  mobileNumber: existingContact.primaryMobile,
                  primaryMobile: existingContact.primaryMobile,
                  contact: existingContact
                } as any;
              }
            }
          } catch (resErr) {
            logger.warn('Failed to resolve concurrent race via phone lookup', { error: String(resErr) });
          }
        }

        // Resolve concurrent MRN collision
        if (input.mrn) {
          try {
            const [existingByMrn] = await db
              .select()
              .from(patients)
              .where(and(eq(patients.tenantId, input.tenantId), eq(patients.mrn, input.mrn)));
            if (existingByMrn) {
              logger.info('Resolved concurrent duplicate registration via MRN collision.', { id: existingByMrn.id });
              return existingByMrn;
            }
          } catch (resErr) {
            logger.warn('Failed to resolve concurrent race via MRN lookup', { error: String(resErr) });
          }
        }
      }

      if (err instanceof AppError) throw err;
      logger.error(`Failed to create patient in database: ${err?.message || err} | code: ${err?.code} | detail: ${err?.detail || ''}`);
      throw new AppError({
        message: 'Database persistence failed. Patient registration aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async updatePatient(
    tenantId: string,
    patientId: string,
    patch: Partial<CreatePatientInput>,
    dbClient = getDatabase()
  ): Promise<Patient | null> {
    const db = requireDb(dbClient);
    try {
      // 1. Verify patient exists in this tenant
      const [existingPatient] = await db
        .select()
        .from(patients)
        .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)));

      if (!existingPatient) {
        return null;
      }

      return await runInTx(db, async (tx) => {
        let updatedContact = null;

        // 2. Handle mobileNumber update if supplied
        if (patch.mobileNumber !== undefined) {
          const rawMobile = patch.mobileNumber;
          if (rawMobile !== null && rawMobile !== '') {
            const normalizedMobile = normalizePhoneNumber(rawMobile);
            if (!normalizedMobile) {
              throw AppError.badRequest('Invalid mobile number format provided for patient contact');
            }

            // Check if this normalized mobile number is already in use by ANOTHER patient in the SAME tenant
            const [collision] = await tx
              .select()
              .from(patientContacts)
              .where(and(
                eq(patientContacts.tenantId, tenantId),
                eq(patientContacts.primaryMobile, normalizedMobile),
                ne(patientContacts.patientId, patientId)
              ));

            if (collision) {
              logger.warn('Patient mobile number collision detected within tenant', {
                tenantId,
                patientId,
                existingPatientWithMobile: collision.patientId,
                mobile: normalizedMobile
              });
              throw AppError.conflict(`Mobile number ${normalizedMobile} is already registered to another patient in this tenant`);
            }

            // Check if this patient already has a contact record
            const [existingContact] = await tx
              .select()
              .from(patientContacts)
              .where(and(
                eq(patientContacts.tenantId, tenantId),
                eq(patientContacts.patientId, patientId)
              ));

            if (existingContact) {
              // Update existing contact record - preserve alternateMobile, email, metadata
              const [saved] = await tx
                .update(patientContacts)
                .set({
                  primaryMobile: normalizedMobile,
                  updatedAt: new Date()
                })
                .where(and(
                  eq(patientContacts.tenantId, tenantId),
                  eq(patientContacts.patientId, patientId)
                ))
                .returning();
              updatedContact = saved;
            } else {
              // Insert new contact record for this patient
              const [saved] = await tx
                .insert(patientContacts)
                .values({
                  id: crypto.randomUUID(),
                  tenantId,
                  partnerId: existingPatient.partnerId,
                  patientId,
                  primaryMobile: normalizedMobile,
                  preferredContactMethod: 'MOBILE',
                  metadata: {},
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
                .returning();
              updatedContact = saved;
            }
          }
        }

        // 3. Update demographic fields on patients table
        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (patch.firstName !== undefined) updateData['firstName'] = patch.firstName;
        if (patch.lastName !== undefined) updateData['lastName'] = patch.lastName;
        if (patch.gender !== undefined) updateData['gender'] = patch.gender;
        if (patch.dateOfBirth !== undefined) updateData['dateOfBirth'] = patch.dateOfBirth;
        if (patch.bloodGroup !== undefined) updateData['bloodGroup'] = patch.bloodGroup;

        const [updated] = await tx
          .update(patients)
          .set(updateData as any)
          .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)))
          .returning();

        if (!updated) {
          return null;
        }

        // If contact wasn't updated in this call, retrieve existing contact if present
        if (!updatedContact) {
          const [contact] = await tx
            .select()
            .from(patientContacts)
            .where(and(
              eq(patientContacts.tenantId, tenantId),
              eq(patientContacts.patientId, patientId)
            ));
          updatedContact = contact || null;
        }

        return {
          ...updated,
          ...(updatedContact ? {
            mobileNumber: updatedContact.primaryMobile,
            primaryMobile: updatedContact.primaryMobile,
            email: updatedContact.email,
            contact: updatedContact
          } : {})
        } as any;
      });
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to update patient in database', err);
      throw new AppError({
        message: 'Database update failed. Patient modification aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 2. APPOINTMENT / WALK-IN ENCOUNTERS
  // =========================================================================

  async getEncounters(
    tenantId: string,
    status?: string,
    dbClient = getDatabase(),
    scopeFilters?: { branchId?: string | undefined; departmentId?: string | undefined }
  ): Promise<Encounter[]> {
    const db = requireDb(dbClient);
    try {
      let rows = await db
        .select()
        .from(encounters)
        .where(eq(encounters.tenantId, tenantId))
        .orderBy(desc(encounters.createdAt));

      if (scopeFilters?.branchId) {
        rows = rows.filter((e) => e.branchId === scopeFilters.branchId);
      }
      if (scopeFilters?.departmentId) {
        rows = rows.filter(
          (e) =>
            e.departmentId === scopeFilters.departmentId ||
            ((e.metadata as any)?.departmentId && (e.metadata as any).departmentId === scopeFilters.departmentId)
        );
      }

      if (!status) return rows;
      return rows.filter(e => e.status === status);
    } catch (err) {
      logger.error('Failed to query encounters from database', err);
      throw new AppError({
        message: 'Database query failed. Encounter lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getEncounterById(
    tenantId: string,
    encounterId: string,
    dbClient = getDatabase(),
    scopeFilters?: { branchId?: string | undefined; departmentId?: string | undefined }
  ): Promise<Encounter | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)));
      if (!found) return null;

      if (scopeFilters?.branchId && found.branchId && found.branchId !== scopeFilters.branchId) {
        throw new AppError({
          message: 'Access denied: Encounter belongs to another branch outside your assigned branch scope.',
          code: ErrorCode.BRANCH_ACCESS_DENIED,
          statusCode: 403
        });
      }
      if (scopeFilters?.departmentId) {
        const encDept = found.departmentId || (found.metadata as any)?.departmentId;
        if (encDept && encDept !== scopeFilters.departmentId) {
          throw new AppError({
            message: 'Access denied: Encounter belongs to another department outside your assigned department scope.',
            code: ErrorCode.FORBIDDEN,
            statusCode: 403
          });
        }
      }

      return found;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to query encounter by ID in database', err);
      throw new AppError({
        message: 'Database query failed. Encounter lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createEncounter(input: CreateEncounterInput, dbClient = getDatabase()): Promise<Encounter> {
    const db = requireDb(dbClient);

    // Strict Tenant Boundary: Verify patient exists within this tenant
    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.tenantId, input.tenantId), eq(patients.id, input.patientId)))
      .limit(1);

    if (!patient) {
      throw new AppError({
        message: `Patient ${input.patientId} does not exist in this tenant partition. Cross-tenant mutation blocked.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    // Idempotency: If encounterNumber is provided and already exists in tenant, return it
    if (input.encounterNumber) {
      const [existingByNumber] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.encounterNumber, input.encounterNumber)));
      if (existingByNumber) {
        logger.info('Duplicate encounter prevented by encounterNumber. Returning existing record.', { encounterNumber: input.encounterNumber });
        return existingByNumber;
      }
    }

    // Check if active encounter for same patient, doctor, and type was created very recently (prevent double click)
    const existingList = await db
      .select()
      .from(encounters)
      .where(and(
        eq(encounters.tenantId, input.tenantId),
        eq(encounters.patientId, input.patientId)
      ))
      .orderBy(desc(encounters.createdAt));

    const activeEncounter = existingList.find(e => 
      ['REGISTERED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'].includes(e.status) &&
      (!input.doctorId || e.doctorId === input.doctorId) &&
      (!input.encounterType || e.encounterType === input.encounterType)
    );

    if (activeEncounter && !input.encounterNumber) {
      logger.info('Active encounter already exists for patient. Returning existing record.', { encounterId: activeEncounter.id });
      return activeEncounter;
    }

    const id = crypto.randomUUID();
    const encNumber = input.encounterNumber || `ENC-${Math.floor(100000 + Math.random() * 900000)}`;
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const departmentId = await resolveDepartmentId(db, input.tenantId, input.departmentId, partnerId, organizationId, branchId);
    const doctorId = await resolveDoctorId(db, input.tenantId, input.doctorId, partnerId, organizationId, branchId, departmentId);

    // P0-A: Authoritative PostgreSQL Transaction-Scoped Advisory Lock for Slot Booking
    const isAppointmentBooking = input.encounterType === 'APPOINTMENT' || Boolean(input.metadata?.slotDate || input.metadata?.slotId || input.metadata?.appointmentDate || input.metadata?.startTime);
    if (doctorId && isAppointmentBooking) {
      const slotDate = input.metadata?.slotDate || (input.metadata?.appointmentDate ? String(input.metadata.appointmentDate).split('T')[0] : new Date().toISOString().split('T')[0]);
      const startTime = input.metadata?.startTime || input.metadata?.slotTime || '09:00';
      const acquired = await slotLockManager.acquireDatabaseSlotLock(db, input.tenantId, doctorId, slotDate, startTime);
      if (!acquired) {
        throw new AppError({
          message: `Doctor appointment slot on ${slotDate} at ${startTime} is currently locked or undergoing checkout by another patient. Please select another slot.`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }
    }

    const record = {
      id,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      departmentId,
      patientId: input.patientId,
      doctorId,
      encounterNumber: encNumber,
      encounterType: input.encounterType || 'OPD', // OPD, WALK_IN, APPOINTMENT
      status: input.status || 'CHECKED_IN',
      chiefComplaint: input.chiefComplaint || 'Routine OPD visit',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const [created] = await db.insert(encounters).values(record as unknown as typeof encounters.$inferInsert).returning();
      if (!created) {
        throw new Error('Insert returned empty result');
      }
      return created;
    } catch (err) {
      logger.error('Failed to create encounter in database', err);
      throw new AppError({
        message: 'Database persistence failed. Encounter creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async updateEncounterStatus(
    tenantId: string,
    encounterId: string,
    targetStatus: string,
    dbClient = getDatabase()
  ): Promise<Encounter | null> {
    const db = requireDb(dbClient);
    
    // Validate current status before transition
    const existing = await this.getEncounterById(tenantId, encounterId, db);
    if (!existing) {
      throw new AppError({
        message: `Encounter not found: ${encounterId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const currentStatus = String(existing.status || '').toUpperCase().trim();
    const desiredStatus = String(targetStatus || '').toUpperCase().trim();

    const VALID_ENCOUNTER_TRANSITIONS: Record<string, string[]> = {
      REGISTERED: ['CHECKED_IN', 'CANCELLED'],
      CHECKED_IN: ['WAITING', 'IN_CONSULTATION', 'CANCELLED'],
      WAITING: ['IN_CONSULTATION', 'CANCELLED'],
      IN_CONSULTATION: ['COMPLETED', 'DISCHARGED', 'CANCELLED'],
      DISCHARGED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: []
    };

    if (!Object.prototype.hasOwnProperty.call(VALID_ENCOUNTER_TRANSITIONS, desiredStatus)) {
      throw new AppError({
        message: `Invalid encounter status: '${targetStatus}'.`,
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    if (currentStatus === desiredStatus) {
      return existing;
    }

    const allowed = VALID_ENCOUNTER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(desiredStatus)) {
      throw new AppError({
        message: `Invalid state transition: Cannot transition encounter from '${currentStatus}' to '${desiredStatus}'.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    try {
      const now = new Date();
      const [updated] = await db
        .update(encounters)
        .set({ status: targetStatus, updatedAt: now })
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)))
        .returning();

      if (targetStatus === 'IN_CONSULTATION') {
        try {
          await db
            .update(encounterQueues)
            .set({ queueStatus: 'CALLED', calledAt: now, updatedAt: now })
            .where(and(
              eq(encounterQueues.tenantId, tenantId),
              eq(encounterQueues.encounterId, encounterId),
              eq(encounterQueues.queueStatus, 'WAITING')
            ));
        } catch (queueErr) {
          logger.warn('Could not update associated encounter queue token', { error: String(queueErr) });
        }
      }

      return updated || null;
    } catch (err) {
      logger.error('Failed to update encounter status in database', err);
      throw new AppError({
        message: 'Database update failed. Encounter status transition aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 3. OPERATIONAL QUEUE & TOKEN MANAGEMENT (POSTGRESQL-BACKED)
  // =========================================================================

  async createQueueToken(input: CreateQueueTokenInput, dbClient = getDatabase()): Promise<StoredQueueToken> {
    const db = requireDb(dbClient);
    const today: string = input.queueDate ?? (new Date().toISOString().split('T')[0] ?? '2026-09-03');

    // Idempotency: If token already exists for this encounter, return existing record
    const [existing] = await db
      .select()
      .from(encounterQueues)
      .where(and(eq(encounterQueues.tenantId, input.tenantId), eq(encounterQueues.encounterId, input.encounterId)));

    if (existing) {
      const tokenRec = existing as unknown as StoredQueueToken;
      logger.info('Queue token already exists for encounter. Returning existing record.', { tokenId: tokenRec.id, tokenNumber: tokenRec.tokenNumber });
      return tokenRec;
    }

    // Deterministic sequential token number for this tenant, branch, and date
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const departmentId = await resolveDepartmentId(db, input.tenantId, input.departmentId, partnerId, organizationId, branchId);

    // Concurrency Protection: Transaction-scoped advisory lock serializes token sequence allocation
    const queueSeqKey = `queue_seq:${input.tenantId}:${branchId || 'main'}:${today}`;
    const seqHash = crypto.createHash('md5').update(queueSeqKey).digest();
    const seqK1 = seqHash.readInt32BE(0);
    const seqK2 = seqHash.readInt32BE(4);
    if (typeof (db as any).execute === 'function') {
      await (db as any).execute(`SELECT pg_advisory_xact_lock(${seqK1}, ${seqK2});`);
    }

    const existingTokens = await db
      .select()
      .from(encounterQueues)
      .where(and(
        eq(encounterQueues.tenantId, input.tenantId),
        eq(encounterQueues.branchId, branchId),
        eq(encounterQueues.queueDate, today)
      ));

    const nextNumber = existingTokens.length + 1;
    const tokenNumber = `TKN-${String(nextNumber).padStart(3, '0')}`;

    let targetDocId: string | null = null;
    if (input.doctorId) {
      targetDocId = await resolveDoctorId(db, input.tenantId, input.doctorId, partnerId, organizationId, branchId, departmentId);
    }

    const lockTarget = targetDocId || 'UNASSIGNED';
    const queueSlotTime = input.metadata?.startTime || input.metadata?.slotTime || today;
    const acquired = await slotLockManager.acquireDatabaseSlotLock(db, input.tenantId, lockTarget, today, queueSlotTime);
    if (!acquired) {
      throw new AppError({
        message: `Queue slot on ${today} for doctor ${lockTarget} is currently being issued by another concurrent transaction.`,
        code: ErrorCode.CONFLICT,
        statusCode: 409
      });
    }

    const id = crypto.randomUUID();
    const newRecord = {
      id,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      departmentId,
      doctorId: targetDocId,
      encounterId: input.encounterId,
      tokenNumber,
      queueDate: today,
      queueStatus: 'WAITING',
      estimatedWaitMinutes: input.estimatedWaitMinutes || 15,
      metadata: input.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const [created] = await db.insert(encounterQueues).values(newRecord as unknown as typeof encounterQueues.$inferInsert).returning();
      if (!created) {
        throw new Error('Insert returned empty result');
      }

      // Also ensure linked encounter is in WAITING status
      await db
        .update(encounters)
        .set({ status: 'WAITING', updatedAt: new Date() })
        .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.id, input.encounterId)));

      return created as unknown as StoredQueueToken;
    } catch (err) {
      logger.error('Failed to create queue token in database', err);
      throw new AppError({
        message: 'Database persistence failed. Queue token generation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getQueue(
    tenantId: string,
    filters?: { branchId?: string; doctorId?: string; queueDate?: string; queueStatus?: string },
    dbClient = getDatabase()
  ): Promise<StoredQueueToken[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(encounterQueues)
        .where(eq(encounterQueues.tenantId, tenantId))
        .orderBy(asc(encounterQueues.createdAt));

      let list = rows as unknown as StoredQueueToken[];
      if (filters?.branchId) list = list.filter(q => q.branchId === filters.branchId);
      if ((filters as any)?.departmentId) list = list.filter(q => q.departmentId === (filters as any).departmentId);
      if (filters?.doctorId) list = list.filter(q => q.doctorId === filters.doctorId);
      if (filters?.queueDate) list = list.filter(q => q.queueDate === filters.queueDate);
      if (filters?.queueStatus) list = list.filter(q => q.queueStatus === filters.queueStatus);

      return list;
    } catch (err) {
      logger.error('Failed to query queue from database', err);
      throw new AppError({
        message: 'Database query failed. Operational queue lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getQueueTokenById(tenantId: string, queueId: string, dbClient = getDatabase()): Promise<StoredQueueToken | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(encounterQueues)
        .where(and(eq(encounterQueues.tenantId, tenantId), eq(encounterQueues.id, queueId)));
      return (found as unknown as StoredQueueToken) || null;
    } catch (err) {
      logger.error('Failed to query queue token by ID in database', err);
      throw new AppError({
        message: 'Database query failed. Queue token lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async callQueueToken(tenantId: string, queueId: string, dbClient = getDatabase()): Promise<StoredQueueToken> {
    const db = requireDb(dbClient);
    const token = await this.getQueueTokenById(tenantId, queueId, db);
    if (!token) {
      throw new AppError({
        message: `Queue token not found: ${queueId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (token.queueStatus !== 'WAITING') {
      throw new AppError({
        message: `Cannot call token in '${token.queueStatus}' status. Expected 'WAITING'.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const now = new Date();
    try {
      const [updated] = await db
        .update(encounterQueues)
        .set({ queueStatus: 'CALLED', calledAt: now, updatedAt: now })
        .where(and(eq(encounterQueues.tenantId, tenantId), eq(encounterQueues.id, queueId)))
        .returning();

      return updated as unknown as StoredQueueToken;
    } catch (err) {
      logger.error('Failed to call queue token in database', err);
      throw new AppError({
        message: 'Database update failed. Token call aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async startQueueToken(tenantId: string, queueId: string, dbClient = getDatabase()): Promise<StoredQueueToken> {
    const db = requireDb(dbClient);
    const token = await this.getQueueTokenById(tenantId, queueId, db);
    if (!token) {
      throw new AppError({
        message: `Queue token not found: ${queueId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (!['WAITING', 'CALLED'].includes(token.queueStatus)) {
      throw new AppError({
        message: `Cannot start consultation for token in '${token.queueStatus}' status. Expected 'CALLED' or 'WAITING'.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const now = new Date();
    try {
      const [updated] = await db
        .update(encounterQueues)
        .set({ queueStatus: 'IN_PROGRESS', updatedAt: now })
        .where(and(eq(encounterQueues.tenantId, tenantId), eq(encounterQueues.id, queueId)))
        .returning();

      // Also update linked encounter to IN_CONSULTATION
      await db
        .update(encounters)
        .set({ status: 'IN_CONSULTATION', updatedAt: now })
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, token.encounterId)));

      return updated as unknown as StoredQueueToken;
    } catch (err) {
      logger.error('Failed to start queue token in database', err);
      throw new AppError({
        message: 'Database update failed. Consultation start aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async completeQueueToken(tenantId: string, queueId: string, dbClient = getDatabase()): Promise<StoredQueueToken> {
    const db = requireDb(dbClient);
    const token = await this.getQueueTokenById(tenantId, queueId, db);
    if (!token) {
      throw new AppError({
        message: `Queue token not found: ${queueId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    if (token.queueStatus === 'CANCELLED' || token.queueStatus === 'COMPLETED') {
      throw new AppError({
        message: `Cannot complete queue token with status '${token.queueStatus}'.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    if (!['IN_PROGRESS', 'CALLED', 'WAITING'].includes(token.queueStatus)) {
      throw new AppError({
        message: `Cannot complete queue token in '${token.queueStatus}' status.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    const now = new Date();
    try {
      const [updated] = await db
        .update(encounterQueues)
        .set({ queueStatus: 'COMPLETED', updatedAt: now })
        .where(and(eq(encounterQueues.tenantId, tenantId), eq(encounterQueues.id, queueId)))
        .returning();

      return updated as unknown as StoredQueueToken;
    } catch (err) {
      logger.error('Failed to complete queue token in database', err);
      throw new AppError({
        message: 'Database update failed. Token completion aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 4. DOCTOR CONSULTATION & CHILD DOMAIN ENTITIES
  // =========================================================================

  async getConsultationByEncounter(tenantId: string, encounterId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(consultations)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.encounterId, encounterId)));
      if (!found) return null;
      const meta = ((found as any).metadata as any) || {};

      const vitals = await db
        .select()
        .from(consultationVitals)
        .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.consultationId, found.id)));
      const diagnoses = await db
        .select()
        .from(consultationDiagnoses)
        .where(and(eq(consultationDiagnoses.tenantId, tenantId), eq(consultationDiagnoses.consultationId, found.id)));
      const medications = await db
        .select()
        .from(consultationMedications)
        .where(and(eq(consultationMedications.tenantId, tenantId), eq(consultationMedications.consultationId, found.id)));
      const followups = await db
        .select()
        .from(consultationFollowups)
        .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, found.id)));

      return {
        ...(found as unknown as StoredConsultation),
        status: (found as any).consultationStatus || 'IN_PROGRESS',
        labInvestigations: meta.labInvestigations || [],
        vitals,
        diagnoses,
        medications,
        followups
      };
    } catch (err) {
      logger.error('Failed to query consultation by encounter in database', err);
      throw new AppError({
        message: 'Database query failed. Consultation lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getConsultationById(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(consultations)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.id, consultationId)));
      if (!found) return null;
      const meta = ((found as any).metadata as any) || {};

      const vitals = await db
        .select()
        .from(consultationVitals)
        .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.consultationId, consultationId)));
      const diagnoses = await db
        .select()
        .from(consultationDiagnoses)
        .where(and(eq(consultationDiagnoses.tenantId, tenantId), eq(consultationDiagnoses.consultationId, consultationId)));
      const medications = await db
        .select()
        .from(consultationMedications)
        .where(and(eq(consultationMedications.tenantId, tenantId), eq(consultationMedications.consultationId, consultationId)));
      const followups = await db
        .select()
        .from(consultationFollowups)
        .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, consultationId)));

      return {
        ...(found as unknown as StoredConsultation),
        status: (found as any).consultationStatus || 'IN_PROGRESS',
        labInvestigations: meta.labInvestigations || [],
        vitals,
        diagnoses,
        medications,
        followups
      };
    } catch (err) {
      logger.error('Failed to query consultation by ID in database', err);
      throw new AppError({
        message: 'Database query failed. Consultation lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async saveConsultation(input: SaveConsultationInput, dbClient = getDatabase()): Promise<StoredConsultation> {
    const db = requireDb(dbClient);

    if (input.encounterId) {
      const [parentEnc] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.id, input.encounterId)))
        .limit(1);
      if (parentEnc) {
        const encStatus = String(parentEnc.status || '').toUpperCase();
        if (['COMPLETED', 'DISCHARGED', 'CANCELLED'].includes(encStatus)) {
          throw new AppError({
            message: `Cannot modify or create consultation for an encounter in ${encStatus} status.`,
            code: ErrorCode.CONFLICT,
            statusCode: 409
          });
        }
      }
    }

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const doctorId = await resolveDoctorId(db, input.tenantId, input.doctorId, partnerId, organizationId, branchId);

    // Check if consultation already exists for this encounter
    const existing = await this.getConsultationByEncounter(input.tenantId, input.encounterId, db);

    let consultationId = existing?.id;
    const consNumber = existing?.consultationNumber || `CON-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    if (!existing) {
      consultationId = crypto.randomUUID();
      try {
        await db.insert(consultations).values({
          id: consultationId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          encounterId: input.encounterId,
          patientId: input.patientId,
          doctorId,
          consultationNumber: consNumber,
          consultationStatus: input.status || 'IN_PROGRESS',
          chiefComplaint: input.chiefComplaint || '',
          historyOfPresentIllness: input.historyOfPresentIllness || '',
          pastMedicalHistory: input.pastMedicalHistory || '',
          examinationNotes: input.examinationNotes || '',
          assessmentNotes: input.assessmentNotes || '',
          planNotes: input.planNotes || '',
          createdBy: doctorId,
          updatedBy: doctorId,
          metadata: {
            labInvestigations: input.labInvestigations || (input as any).investigations || []
          },
          createdAt: now,
          updatedAt: now
        } as unknown as typeof consultations.$inferInsert);
      } catch (err) {
        logger.error('Failed to insert consultation in database', err);
        throw new AppError({
          message: 'Database persistence failed. Clinical consultation draft aborted.',
          code: ErrorCode.SERVICE_UNAVAILABLE,
          statusCode: 503
        });
      }
    } else {
      if (String(existing.status || '').toUpperCase() === 'FINALIZED') {
        throw new AppError({
          message: 'Consultation is already FINALIZED and locked. Use formal consultation amendment.',
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }
      try {
        await db
          .update(consultations)
          .set({
            consultationStatus: input.status || existing.status,
            chiefComplaint: input.chiefComplaint ?? existing.chiefComplaint,
            historyOfPresentIllness: input.historyOfPresentIllness ?? existing.historyOfPresentIllness,
            pastMedicalHistory: input.pastMedicalHistory ?? existing.pastMedicalHistory,
            examinationNotes: input.examinationNotes ?? existing.examinationNotes,
            assessmentNotes: input.assessmentNotes ?? existing.assessmentNotes,
            planNotes: input.planNotes ?? existing.planNotes,
            metadata: {
              labInvestigations: input.labInvestigations ?? (input as any).investigations ?? (existing as any).metadata?.labInvestigations ?? []
            },
            updatedBy: doctorId,
            updatedAt: now
          } as unknown as typeof consultations.$inferInsert)
          .where(and(eq(consultations.tenantId, input.tenantId), eq(consultations.id, consultationId!)));
      } catch (err) {
        logger.error('Failed to update consultation in database', err);
        throw new AppError({
          message: 'Database update failed. Clinical consultation draft aborted.',
          code: ErrorCode.SERVICE_UNAVAILABLE,
          statusCode: 503
        });
      }
    }

    // Persist child vitals
    if (input.vitals) {
      try {
        if (existing) {
          await db.delete(consultationVitals).where(eq(consultationVitals.consultationId, consultationId!));
        }
        const v = input.vitals;
        await db.insert(consultationVitals).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          consultationId: consultationId!,
          patientId: input.patientId,
          temperatureCelsius: v.temperatureCelsius ? String(v.temperatureCelsius) : (v.temperatureFahrenheit ? String(((v.temperatureFahrenheit - 32) * 5 / 9).toFixed(1)) : '37.0'),
          pulseBpm: v.pulseBpm || v.heartRateBpm || 72,
          respiratoryRateBpm: v.respiratoryRateBpm || 16,
          systolicBp: v.systolicBp || 120,
          diastolicBp: v.diastolicBp || 80,
          oxygenSaturationPercent: v.oxygenSaturationPercent || v.spO2Percentage || 99,
          weightKg: v.weightKg ? String(v.weightKg) : null,
          heightCm: v.heightCm ? String(v.heightCm) : null,
          bmi: v.bmi ? String(v.bmi) : null,
          painScore: (v as any).painScore ?? 0,
          clinicalNotes: (v as any).clinicalNotes || null,
          recordedBy: doctorId,
          recordedAt: now
        } as any);
      } catch (err) {
        logger.warn('Failed to insert vitals', { error: String(err) });
      }
    }

    // Persist child diagnoses
    if (Array.isArray(input.diagnoses) && input.diagnoses.length > 0) {
      if (existing) {
        try {
          await db.delete(consultationDiagnoses).where(eq(consultationDiagnoses.consultationId, consultationId!));
        } catch {}
      }
      for (const d of input.diagnoses) {
        try {
          await db.insert(consultationDiagnoses).values({
            id: crypto.randomUUID(),
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            consultationId: consultationId!,
            patientId: input.patientId,
            diagnosisCode: d.diagnosisCode || d.code || 'R69',
            diagnosisName: d.diagnosisName || d.description || 'Illness, unspecified',
            diagnosisType: d.type || (d.isPrimary ? 'PRIMARY' : 'SECONDARY'),
            clinicalStatus: 'ACTIVE',
            recordedBy: doctorId,
            recordedAt: now
          } as any);
        } catch (err) {
          logger.warn('Failed to insert diagnosis', { error: String(err) });
        }
      }
    }

    // Persist child medications
    const medList = input.medications || (input as any).prescriptions;
    if (Array.isArray(medList) && medList.length > 0) {
      if (existing) {
        try {
          await db.delete(consultationMedications).where(eq(consultationMedications.consultationId, consultationId!));
        } catch {}
      }
      for (const m of medList) {
        try {
          const medName = m.medicationName || m.drugName || 'Generic Drug';
          const duration = typeof m.duration === 'number' ? m.duration : (Number.parseInt(String(m.duration || m.durationDays || '5'), 10) || 5);
          await db.insert(consultationMedications).values({
            id: crypto.randomUUID(),
            tenantId: input.tenantId,
            partnerId,
            organizationId,
            consultationId: consultationId!,
            patientId: input.patientId,
            medicationName: medName,
            genericName: m.genericName || medName,
            strength: m.strength || '500mg',
            dosage: m.dosage || '1 unit',
            route: m.route || 'ORAL',
            frequency: m.frequency || 'BID',
            duration,
            durationUnit: m.durationUnit || 'DAYS',
            quantity: m.quantity || 10,
            instructions: m.instructions || 'As advised',
            beforeAfterFood: m.beforeAfterFood || 'AFTER_FOOD',
            status: 'ACTIVE',
            prescribedBy: doctorId,
            prescribedAt: now
          } as any);
        } catch (err) {
          logger.warn('Failed to insert consultation medication', { error: String(err) });
        }
      }
    }

    // Persist follow-up advice
    if (input.followUpAdvice || input.followUpDate || input.followUpWindow) {
      try {
        if (existing) {
          await db.delete(consultationFollowups).where(eq(consultationFollowups.consultationId, consultationId!));
        }
        await db.insert(consultationFollowups).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          consultationId: consultationId!,
          patientId: input.patientId,
          followUpRequired: true,
          recommendedDate: input.followUpDate || '2026-09-10',
          recommendedWindow: input.followUpWindow || 'AFTER_1_WEEK',
          reason: input.followUpAdvice || 'Follow-up consultation',
          status: 'PENDING',
          recordedBy: doctorId,
          recordedAt: now
        } as any);
      } catch (err) {
        logger.warn('Failed to insert consultation follow-up', { error: String(err) });
      }
    }

    // Bridge imaging orders to radiology_orders (P0-03)
    let bridgedRadiologyOrders: any[] = [];
    const imagingOrdersInput = (input as any).imagingOrders || (input as any).radiologyOrders || (input as any).radiologyInvestigations;
    if (imagingOrdersInput && (Array.isArray(imagingOrdersInput) ? imagingOrdersInput.length > 0 : Object.keys(imagingOrdersInput).length > 0)) {
      const items = Array.isArray(imagingOrdersInput) ? imagingOrdersInput : [imagingOrdersInput];
      bridgedRadiologyOrders = await this.bridgeRadiologyOrders(
        input.tenantId,
        input.patientId,
        input.encounterId,
        doctorId,
        items,
        db
      );
    }

    return {
      id: consultationId!,
      tenantId: input.tenantId,
      partnerId,
      organizationId,
      branchId,
      encounterId: input.encounterId,
      patientId: input.patientId,
      doctorId,
      consultationNumber: consNumber,
      status: input.status || 'IN_PROGRESS',
      chiefComplaint: input.chiefComplaint || '',
      historyOfPresentIllness: input.historyOfPresentIllness || '',
      pastMedicalHistory: input.pastMedicalHistory || '',
      examinationNotes: input.examinationNotes || '',
      assessmentNotes: input.assessmentNotes || '',
      planNotes: input.planNotes || '',
      vitals: input.vitals || null,
      diagnoses: input.diagnoses || [],
      medications: medList || [],
      labInvestigations: input.labInvestigations || (input as any).investigations || [],
      radiologyOrders: bridgedRadiologyOrders,
      followUpAdvice: input.followUpAdvice || '',
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
  }

  async saveDiagnosis(
    input: { tenantId: string; consultationId: string; icd10Code?: string; code?: string; description?: string; diagnosisType?: string },
    dbClient = getDatabase()
  ) {
    const db = requireDb(dbClient);
    const [cons] = await db
      .select()
      .from(consultations)
      .where(and(eq(consultations.tenantId, input.tenantId), eq(consultations.id, input.consultationId)))
      .limit(1);

    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(consultationDiagnoses).values({
      id,
      tenantId: input.tenantId,
      partnerId: cons?.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: cons?.organizationId || '00000000-0000-4000-8000-000000000002',
      consultationId: input.consultationId,
      patientId: cons?.patientId || crypto.randomUUID(),
      diagnosisCode: input.icd10Code || input.code || 'R69',
      diagnosisName: input.description || 'Clinical Diagnosis',
      diagnosisType: input.diagnosisType || 'PROVISIONAL',
      clinicalStatus: 'ACTIVE',
      recordedBy: cons?.doctorId || 'DOCTOR',
      recordedAt: now
    } as any);

    return { id, success: true };
  }

  async finalizeConsultation(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredConsultation | null> {
    const db = requireDb(dbClient);
    try {
      const [updated] = await db
        .update(consultations)
        .set({ consultationStatus: 'FINALIZED', completedAt: new Date(), updatedAt: new Date() } as unknown as typeof consultations.$inferInsert)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.id, consultationId)))
        .returning();
      if (!updated) return null;
      return {
        ...(updated as unknown as StoredConsultation),
        status: 'FINALIZED'
      };
    } catch (err) {
      logger.error('Failed to finalize consultation in database', err);
      throw new AppError({
        message: 'Database update failed. Consultation finalization aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async searchConsultations(
    tenantId: string,
    filters?: { doctorId?: string; patientId?: string; encounterId?: string; status?: string; searchTerm?: string },
    dbClient = getDatabase()
  ): Promise<StoredConsultation[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(consultations)
        .where(eq(consultations.tenantId, tenantId))
        .orderBy(desc(consultations.createdAt));

      let list = rows as unknown as StoredConsultation[];
      if (filters?.doctorId) {
        list = list.filter((c) => c.doctorId === filters.doctorId);
      }
      if (filters?.patientId) {
        list = list.filter((c) => c.patientId === filters.patientId);
      }
      if (filters?.encounterId) {
        list = list.filter((c) => c.encounterId === filters.encounterId);
      }
      if (filters?.status) {
        list = list.filter((c) => c.status === filters.status || (c as any).consultationStatus === filters.status);
      }
      if (filters?.searchTerm) {
        const q = filters.searchTerm.toLowerCase();
        list = list.filter((c) => 
          (c.consultationNumber && c.consultationNumber.toLowerCase().includes(q)) ||
          (c.chiefComplaint && c.chiefComplaint.toLowerCase().includes(q))
        );
      }
      return list;
    } catch (err) {
      logger.error('Failed to search consultations in database', err);
      throw new AppError({
        message: 'Database query failed. Consultation search unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getConsultationOverview(tenantId: string, dbClient = getDatabase()): Promise<{
    totalConsultationsCount: number;
    activeConsultationsCount: number;
    draftConsultationsCount: number;
    inProgressConsultationsCount: number;
    completedTodayCount: number;
    followUpsRequiredCount: number;
    uncompletedNotesCount: number;
    amendedCount: number;
  }> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(consultations)
        .where(eq(consultations.tenantId, tenantId));

      const todayStr = new Date().toISOString().split('T')[0];
      const totalConsultationsCount = rows.length;
      let activeConsultationsCount = 0;
      let draftConsultationsCount = 0;
      let inProgressConsultationsCount = 0;
      let completedTodayCount = 0;
      let uncompletedNotesCount = 0;

      for (const r of rows) {
        const st = (r as any).consultationStatus || 'IN_PROGRESS';
        if (st === 'STARTED' || st === 'IN_PROGRESS') activeConsultationsCount++;
        if (st === 'DRAFT') draftConsultationsCount++;
        if (st === 'IN_PROGRESS') inProgressConsultationsCount++;
        if (st === 'COMPLETED' || st === 'FINALIZED') {
          const completedAtStr = r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : '';
          if (completedAtStr === todayStr) completedTodayCount++;
        }
        if (st !== 'COMPLETED' && st !== 'FINALIZED' && st !== 'CANCELLED') {
          uncompletedNotesCount++;
        }
      }

      return {
        totalConsultationsCount,
        activeConsultationsCount,
        draftConsultationsCount,
        inProgressConsultationsCount,
        completedTodayCount,
        followUpsRequiredCount: 0,
        uncompletedNotesCount,
        amendedCount: 0
      };
    } catch (err) {
      logger.error('Failed to query consultation overview in database', err);
      throw new AppError({
        message: 'Database query failed. Consultation overview unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 5. DIGITAL PRESCRIPTION PERSISTENCE (POSTGRESQL-BACKED)
  // =========================================================================

  async getPrescriptionsByConsultation(tenantId: string, consultationId: string, dbClient = getDatabase()): Promise<StoredPrescription[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.consultationId, consultationId)));

      const results: StoredPrescription[] = [];
      for (const r of rows) {
        const items = await db
          .select()
          .from(pharmacyPrescriptionItems)
          .where(and(eq(pharmacyPrescriptionItems.tenantId, tenantId), eq(pharmacyPrescriptionItems.prescriptionId, r.id)));
        results.push({
          ...(r as any),
          items
        });
      }
      return results;
    } catch (err) {
      logger.error('Failed to query prescriptions from database', err);
      throw new AppError({
        message: 'Database query failed. Prescription lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getPrescriptionById(tenantId: string, prescriptionId: string, dbClient = getDatabase()): Promise<StoredPrescription | null> {
    const db = requireDb(dbClient);
    try {
      const [r] = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.id, prescriptionId)));

      if (!r) return null;

      const items = await db
        .select()
        .from(pharmacyPrescriptionItems)
        .where(and(eq(pharmacyPrescriptionItems.tenantId, tenantId), eq(pharmacyPrescriptionItems.prescriptionId, r.id)));

      const formattedItems = items.map((it: any) => {
        const meta: any = it.metadata || {};
        return {
          ...it,
          medicationName: meta['medicationName'] || it['medicationName'] || meta['drugName'] || 'Medication',
          genericName: meta['genericName'] || it['genericName'],
          strength: meta['strength'] || it['strength'] || ''
        };
      });

      return {
        ...(r as any),
        items: formattedItems
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

  async createPrescription(input: CreatePrescriptionInput, dbClient = getDatabase()): Promise<StoredPrescription> {
    const db = requireDb(dbClient);

    // Idempotency: If prescription already exists for consultation, return existing
    if (input.consultationId) {
      const existing = await this.getPrescriptionsByConsultation(input.tenantId, input.consultationId, db);
      if (existing.length > 0 && existing[0]) {
        logger.info('Prescription already exists for consultation. Returning existing record.', { id: existing[0].id });
        return existing[0];
      }
    }

    const prescriptionId = crypto.randomUUID();
    const prescriptionNumber = `RX-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    let encounterId = input.encounterId;
    if (input.encounterId) {
      try {
        const [enc] = await db
          .select()
          .from(encounters)
          .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.id, input.encounterId)))
          .limit(1);
        if (enc) {
          const encStatus = String(enc.status || '').toUpperCase();
          if (['CANCELLED'].includes(encStatus)) {
            throw new AppError({
              message: `Cannot issue prescription for a ${encStatus} encounter.`,
              code: ErrorCode.CONFLICT,
              statusCode: 409
            });
          }
          if (enc.patientId && input.patientId && enc.patientId !== input.patientId) {
            throw new AppError({
              message: `Prescription patientId mismatch: encounter belongs to patient ${enc.patientId}, not ${input.patientId}`,
              code: ErrorCode.BAD_REQUEST,
              statusCode: 400
            });
          }
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
      }
    } else {
      try {
        const [enc] = await db
          .select()
          .from(encounters)
          .where(and(eq(encounters.tenantId, input.tenantId), eq(encounters.patientId, input.patientId)))
          .orderBy(desc(encounters.createdAt))
          .limit(1);
        if (enc) encounterId = enc.id;
      } catch {
        // ignore
      }
    }

    // Allergy safety check: Check patient active drug allergies against prescribed items
    try {
      const allergies = await this.getPatientAllergies(input.tenantId, input.patientId, db);
      const activeDrugAllergies = allergies.filter((a: any) => 
        (a.status === 'ACTIVE' || !a.status) && 
        (a.allergenType === 'DRUG' || !a.allergenType)
      );

      if (activeDrugAllergies.length > 0 && input.items && input.items.length > 0) {
        for (const item of input.items) {
          const medName = (item.medicationName || (item as any).medicineName || '').toLowerCase().trim();
          for (const allergy of activeDrugAllergies) {
            const allergen = (allergy.allergen || '').toLowerCase().trim();
            if (allergen && (medName.includes(allergen) || allergen.includes(medName))) {
              if (!(input as any).allowAllergyOverride) {
                const prescribedName = item.medicationName || (item as any).medicineName || 'Medication';
                throw new AppError({
                  message: `Allergy contraindication alert: Patient is allergic to "${allergy.allergen}". Prescribed medication "${prescribedName}" triggers a ${allergy.severity || 'SEVERE'} reaction (${allergy.reaction || 'Adverse Reaction'}). Override not authorized.`,
                  code: ErrorCode.BAD_REQUEST,
                  statusCode: 400
                });
              }
            }
          }
        }
      }
    } catch (allergyErr) {
      if (allergyErr instanceof AppError) throw allergyErr;
      logger.warn('Allergy contraindication check skipped due to error', { error: String(allergyErr) });
    }

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);
    const doctorId = await resolveDoctorId(db, input.tenantId, input.prescribingDoctorId || (input as any).doctorId, partnerId, organizationId, branchId);

    if (!encounterId) {
      encounterId = crypto.randomUUID();
      try {
        const departmentId = await resolveDepartmentId(db, input.tenantId, undefined, partnerId, organizationId, branchId);
        await db.insert(encounters).values({
          id: encounterId,
          tenantId: input.tenantId,
          partnerId,
          organizationId,
          branchId,
          departmentId,
          patientId: input.patientId,
          encounterNumber: `ENC-RX-${Math.floor(100000 + Math.random() * 900000)}`,
          encounterType: 'OPD',
          status: 'COMPLETED',
          chiefComplaint: 'OPD Prescription Order',
          createdAt: now,
          updatedAt: now
        } as any);
      } catch (encErr) {
        logger.warn('Failed to insert fallback encounter for prescription', { error: String(encErr) });
      }
    }

    try {
      const [rx] = await db.insert(pharmacyPrescriptions).values({
        id: prescriptionId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        branchId,
        prescriptionNumber,
        patientId: input.patientId,
        encounterId,
        consultationId: input.consultationId || null,
        prescribingDoctorId: doctorId,
        priority: input.priority || 'ROUTINE',
        status: 'CREATED',
        notes: input.notes || 'OPD Digital Prescription',
        prescribedAt: now,
        createdAt: now,
        updatedAt: now
      } as any).returning();

      if (!rx) {
        throw new Error('Insert returned empty prescription record');
      }

      const insertedItems: any[] = [];
      const items = input.items || [];
      for (const item of items) {
        let qty = 10;
        if (typeof item.prescribedQuantity === 'number') qty = item.prescribedQuantity;
        else if (typeof item.quantity === 'number') qty = item.quantity;
        else if (typeof item.prescribedQuantity === 'string') qty = parseInt(item.prescribedQuantity, 10) || 10;
        else if (typeof item.quantity === 'string') qty = parseInt(item.quantity, 10) || 10;

        let durationNum = 5;
        if (typeof item.duration === 'number') durationNum = item.duration;
        else if (typeof item.duration === 'string') durationNum = parseInt(item.duration, 10) || 5;

        const medId = await resolveMedicationId(
          db,
          input.tenantId,
          partnerId,
          organizationId,
          branchId,
          item.medicationId,
          item.medicationName,
          (item as any)['genericName'],
          (item as any)['dosageForm'],
          (item as any)['strength']
        );

        const [insertedItem] = await db.insert(pharmacyPrescriptionItems).values({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          prescriptionId: rx.id,
          medicationId: medId,
          prescribedQuantity: qty,
          remainingQuantity: qty,
          unit: 'TABLET',
          dosage: item.dosage || '1 tablet',
          frequency: item.frequency || 'BID',
          route: item.route || 'ORAL',
          duration: durationNum,
          durationUnit: item.durationUnit || 'DAYS',
          fulfillmentStatus: 'PENDING',
          instructions: item.instructions || 'Take after meals',
          metadata: {
            medicationName: item.medicationName || (item as any)['drugName'],
            genericName: (item as any)['genericName'],
            strength: (item as any)['strength'],
            ...(((item as any)['metadata'] as Record<string, any>) || {})
          },
          createdAt: now,
          updatedAt: now
        } as any).returning();
        insertedItems.push({
          ...insertedItem,
          medicationName: item.medicationName || (item as any)['drugName'],
          genericName: (item as any)['genericName'],
          strength: (item as any)['strength']
        });
      }

      return {
        id: rx.id,
        tenantId: rx.tenantId,
        partnerId: rx.partnerId,
        organizationId: rx.organizationId,
        branchId: rx.branchId,
        prescriptionNumber: rx.prescriptionNumber,
        patientId: rx.patientId,
        encounterId: rx.encounterId,
        consultationId: rx.consultationId,
        prescribingDoctorId: rx.prescribingDoctorId,
        priority: rx.priority,
        status: rx.status,
        notes: rx.notes,
        items: insertedItems,
        createdAt: rx.createdAt
      };
    } catch (err) {
      logger.error('Failed to create prescription in database', err);
      throw new AppError({
        message: 'Database persistence failed. Digital prescription creation aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  // =========================================================================
  // 6. CONSULTATION COMPLETION & FULL DOWNSTREAM ORCHESTRATION
  // =========================================================================

  async completeConsultationWorkflow(
    tenantId: string,
    consultationId: string,
    doctorId?: string,
    dbClient = getDatabase()
  ): Promise<ConsultationWorkflowResult> {
    const db = requireDb(dbClient);

    const consultation = await this.getConsultationById(tenantId, consultationId, db);
    if (!consultation) {
      throw new AppError({
        message: `Consultation not found: ${consultationId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const effectiveDoctorId = await resolveDoctorId(db, tenantId, doctorId || consultation.doctorId);

    // Idempotency: If already finalized, retrieve and return all existing connected entities
    if (consultation.status === 'FINALIZED') {
      logger.info('Consultation already finalized. Returning existing downstream records.', { consultationId });
      const encounter = await this.getEncounterById(tenantId, consultation.encounterId, db);
      const queueList = await this.getQueue(tenantId, undefined, db);
      const queueToken = queueList.find(q => q.encounterId === consultation.encounterId) || null;
      const prescriptions = await this.getPrescriptionsByConsultation(tenantId, consultationId, db);
      const prescription = prescriptions[0] || null;

      // Look up pharmacy order in dispensing queue
      const pharmOrders = await db
        .select()
        .from(pharmacyDispensing)
        .where(and(eq(pharmacyDispensing.tenantId, tenantId), eq(pharmacyDispensing.patientId, consultation.patientId)));
      const pharmacyOrder = prescription ? pharmOrders.find(p => p.prescriptionId === prescription.id) : null;

      // Look up lab orders
      const labOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, consultation.patientId, db);
      const relatedLabOrders = labOrders.filter(l => l.encounterId === consultation.encounterId);

      // Look up follow-up
      const followUps = await db
        .select()
        .from(consultationFollowups)
        .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, consultationId)));

      return {
        consultation,
        encounter,
        queueToken,
        prescription,
        pharmacyOrder: pharmacyOrder || null,
        labOrders: relatedLabOrders,
        followUp: followUps[0] || null
      };
    }

    // 1. Finalize Consultation
    const finalizedCons = await this.finalizeConsultation(tenantId, consultationId, db);

    // 2. Complete Encounter
    const encounter = await this.updateEncounterStatus(tenantId, consultation.encounterId, 'COMPLETED', db);

    // 3. Complete Queue Token
    let queueToken: StoredQueueToken | null = null;
    const queueList = await this.getQueue(tenantId, undefined, db);
    const linkedToken = queueList.find(q => q.encounterId === consultation.encounterId);
    if (linkedToken) {
      queueToken = await this.completeQueueToken(tenantId, linkedToken.id, db);
    }

    // 4. Downstream: Digital Prescription & Pharmacy Order
    let prescription: StoredPrescription | null = null;
    let pharmacyOrder: any = null;

    // Check if consultation has medications
    const dbMeds = await db
      .select()
      .from(consultationMedications)
      .where(and(eq(consultationMedications.tenantId, tenantId), eq(consultationMedications.consultationId, consultationId)));

    const medItems = (consultation.medications && consultation.medications.length > 0)
      ? consultation.medications
      : dbMeds;

    if (medItems && medItems.length > 0) {
      const resolvedItems = [];
      for (const m of medItems as any[]) {
        const resolvedMedId = await resolveMedicationId(
          db,
          tenantId,
          consultation.partnerId,
          consultation.organizationId,
          consultation.branchId,
          m.medicationId,
          m.medicationName || m.brandName,
          m.genericName,
          m.dosageForm,
          m.strength
        );
        resolvedItems.push({
          medicationId: resolvedMedId,
          dosage: m.dosage || '1 unit',
          frequency: m.frequency || 'BID',
          route: m.route || 'ORAL',
          duration: typeof m.duration === 'number' ? m.duration : 5,
          durationUnit: m.durationUnit || 'DAYS',
          prescribedQuantity: m.quantity || 10,
          instructions: m.instructions || 'As advised'
        });
      }

      // Create digital prescription
      prescription = await this.createPrescription({
        tenantId,
        partnerId: consultation.partnerId,
        organizationId: consultation.organizationId,
        branchId: consultation.branchId,
        patientId: consultation.patientId,
        encounterId: consultation.encounterId,
        consultationId,
        prescribingDoctorId: effectiveDoctorId,
        items: resolvedItems
      }, db);

      // Create Pharmacy Order in Pharmacy Dispensing Queue (status: PENDING)
      const dispensingNumber = `DISP-${Math.floor(100000 + Math.random() * 900000)}`;
      const [newDispensing] = await db.insert(pharmacyDispensing).values({
        id: crypto.randomUUID(),
        tenantId,
        partnerId: consultation.partnerId,
        organizationId: consultation.organizationId,
        branchId: consultation.branchId,
        dispensingNumber,
        prescriptionId: prescription.id,
        patientId: consultation.patientId,
        pharmacistId: effectiveDoctorId,
        pharmacistName: 'Unassigned Pharmacy Queue',
        dispensingStatus: 'PENDING',
        dispensingMode: 'OUTPATIENT_COUNTER',
        counselingProvided: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any).returning();
      pharmacyOrder = newDispensing;
    }

    // 5. Downstream: Lab Investigation Orders (Pathology Queue)
    const labOrders: any[] = [];
    const labInvestigations = consultation.labInvestigations;
    if (labInvestigations && (Array.isArray(labInvestigations) ? labInvestigations.length > 0 : Object.keys(labInvestigations).length > 0)) {
      const testNames: string[] = Array.isArray(labInvestigations)
        ? labInvestigations.map((t: any) => typeof t === 'string' ? t : (t.testName || t.name || 'Diagnostic Test'))
        : (labInvestigations.testNames || ['Complete Blood Count']);

      const createdLabs = await this.bridgeDiagnosticOrders(
        tenantId,
        consultation.patientId,
        consultation.encounterId,
        effectiveDoctorId,
        testNames,
        db
      );
      labOrders.push(...createdLabs);
    }

    // 5.1 Downstream: Radiology / Imaging Orders (Radiology RIS Worklist)
    const radOrders: any[] = [];
    const imagingOrders = (consultation as any).imagingOrders || (consultation as any).radiologyOrders || (consultation as any).radiologyInvestigations;
    if (imagingOrders && (Array.isArray(imagingOrders) ? imagingOrders.length > 0 : Object.keys(imagingOrders).length > 0)) {
      const items = Array.isArray(imagingOrders) ? imagingOrders : [imagingOrders];
      const createdRads = await this.bridgeRadiologyOrders(
        tenantId,
        consultation.patientId,
        consultation.encounterId,
        effectiveDoctorId,
        items,
        db
      );
      radOrders.push(...createdRads);
    }

    // 6. Downstream: Follow-up Scheduling
    let followUp: any = null;
    const followUps = await db
      .select()
      .from(consultationFollowups)
      .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, consultationId)));

    if (followUps.length > 0) {
      followUp = followUps[0];
    } else if (consultation.followUpAdvice) {
      const [createdFol] = await db.insert(consultationFollowups).values({
        id: crypto.randomUUID(),
        tenantId,
        partnerId: consultation.partnerId,
        organizationId: consultation.organizationId,
        consultationId,
        patientId: consultation.patientId,
        followUpRequired: true,
        recommendedDate: '2026-09-10',
        recommendedWindow: 'AFTER_1_WEEK',
        reason: consultation.followUpAdvice,
        status: 'PENDING',
        recordedBy: effectiveDoctorId,
        recordedAt: new Date()
      } as any).returning();
      followUp = createdFol;
    }

    return {
      consultation: finalizedCons || consultation,
      encounter,
      queueToken,
      prescription,
      pharmacyOrder,
      labOrders,
      radiologyOrders: radOrders,
      followUp
    };
  }

  // =========================================================================
  // 7. DOWNSTREAM FAILURE RECOVERY & RETRY
  // =========================================================================

  async retryDownstreamOrders(
    tenantId: string,
    consultationId: string,
    dbClient = getDatabase()
  ): Promise<ConsultationWorkflowResult> {
    const db = requireDb(dbClient);
    const consultation = await this.getConsultationById(tenantId, consultationId, db);
    if (!consultation) {
      throw new AppError({
        message: `Consultation not found: ${consultationId}`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    logger.info('Executing idempotent retry for downstream orders', { consultationId });
    return this.completeConsultationWorkflow(tenantId, consultationId, consultation.doctorId, db);
  }

  // =========================================================================
  // 8. DIAGNOSTIC BRIDGE & CLINICAL HISTORY
  // =========================================================================

  async bridgeDiagnosticOrders(
    tenantId: string,
    patientId: string,
    encounterId: string,
    doctorId: string,
    testNames: string[],
    dbClient = getDatabase()
  ) {
    const db = requireDb(dbClient);
    const defaults = await resolvePartnerAndOrg(db, tenantId);
    let partnerId = defaults.partnerId;
    let organizationId = defaults.organizationId;
    let branchId = await resolveBranchId(db, tenantId);
    try {
      const [enc] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)));
      if (enc) {
        partnerId = enc.partnerId || partnerId;
        organizationId = enc.organizationId || organizationId;
        branchId = enc.branchId || branchId;
      }
    } catch {
      // Use resolved tenant hierarchy if encounter lookup fails
    }

    // Check existing lab orders for this encounter to prevent duplicates on retry
    const existingOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, patientId, db);
    const existingEncounterOrders = existingOrders.filter(o => o.encounterId === encounterId);

    const createdOrders = [];
    for (const testName of testNames) {
      const alreadyCreated = existingEncounterOrders.find(o => o.testName === testName);
      if (alreadyCreated) {
        logger.info('Duplicate lab order prevented. Returning existing order.', { orderId: alreadyCreated.id, testName });
        createdOrders.push(alreadyCreated);
        continue;
      }

      const order = await labDiagnosticsRepository.createOrder({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId,
        encounterId,
        orderingDoctorId: doctorId,
        testName,
        category: testName.includes('CBC') || testName.includes('Blood Count') ? 'HEMATOLOGY' : 'BIOCHEMISTRY',
        priority: 'ROUTINE',
        clinicalNotes: `Ordered during OPD Consultation (Enc: ${encounterId}, Doctor: ${doctorId})`
      }, db);
      createdOrders.push(order);
    }
    return createdOrders;
  }

  async bridgeRadiologyOrders(
    tenantId: string,
    patientId: string,
    encounterId: string,
    doctorId: string,
    imagingItems: any[],
    dbClient = getDatabase()
  ) {
    const db = requireDb(dbClient);
    const defaults = await resolvePartnerAndOrg(db, tenantId);
    let partnerId = defaults.partnerId;
    let organizationId = defaults.organizationId;
    let branchId = await resolveBranchId(db, tenantId);
    let patientName = 'Patient';
    let patientMrn = 'MRN-000';
    let doctorName = 'Attending Doctor';

    try {
      const patient = await this.getPatientById(tenantId, patientId, db);
      if (patient) {
        patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
        patientMrn = patient.mrn || patient.uhid || patientMrn;
      }
      const [enc] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)));
      if (enc) {
        partnerId = enc.partnerId || partnerId;
        organizationId = enc.organizationId || organizationId;
        branchId = enc.branchId || branchId;
      }
      const [doc] = await db
        .select()
        .from(operationalStaff)
        .where(and(eq(operationalStaff.tenantId, tenantId), eq(operationalStaff.id, doctorId)));
      if (doc) {
        doctorName = (doc as any).fullName || 'Attending Doctor';
      }
    } catch {
      // Use fallback defaults if lookups fail
    }

    // Check existing radiology orders for this encounter to prevent duplicates
    const existingOrdersRes = await radiologyRepository.findManyOrders({ tenantId }, db);
    const existingEncounterOrders = (existingOrdersRes.items || []).filter(o => o.encounterId === encounterId);

    const createdOrders = [];
    for (const item of imagingItems) {
      const procedureName = typeof item === 'string' ? item : (item.procedureName || item.name || item.testName || 'Diagnostic X-Ray');
      const modalityType = item.modalityType || (
        procedureName.toLowerCase().includes('mri') ? 'MAGNETIC_RESONANCE_IMAGING_MRI' :
        procedureName.toLowerCase().includes('ct') ? 'COMPUTED_TOMOGRAPHY_CT' :
        procedureName.toLowerCase().includes('ultrasound') || procedureName.toLowerCase().includes('usg') ? 'ULTRASOUND_SONOGRAPHY_USG' :
        procedureName.toLowerCase().includes('mammogra') ? 'MAMMOGRAPHY' :
        'X_RAY_DIGITAL_RADIOGRAPHY'
      );
      const priority = item.priority || 'ROUTINE_ELECTIVE';
      const procedureId = item.procedureId || crypto.randomUUID();

      const alreadyCreated = existingEncounterOrders.find(o => o.procedureName === procedureName);
      if (alreadyCreated) {
        logger.info('Duplicate radiology order prevented. Returning existing order.', { orderId: alreadyCreated.id, procedureName });
        createdOrders.push(alreadyCreated);
        continue;
      }

      const orderNumber = `RAD-ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      const order = await radiologyRepository.createOrder(
        {
          tenantId,
          partnerId,
          organizationId,
          branchId,
          orderNumber,
          patientId,
          patientName,
          patientMrn,
          encounterId,
          orderingDoctorName: doctorName,
          orderingDepartment: 'OPD Clinical',
          procedureId,
          procedureName,
          modalityType,
          priority,
          clinicalIndication: item.clinicalIndication || `Ordered during OPD Consultation (Enc: ${encounterId})`,
          requiresContrast: Boolean(item.requiresContrast),
          status: 'ORDERED'
        },
        db
      );
      createdOrders.push(order);
    }
    return createdOrders;
  }

  async getPatientClinicalHistory(tenantId: string, patientId: string, dbClient = getDatabase()) {
    const db = requireDb(dbClient);
    try {
      const patient = await this.getPatientById(tenantId, patientId, db);
      const patientMrn = patient?.mrn || patientId;

      const patientAppointments = await db
        .select()
        .from(appointmentsPartitioned)
        .where(and(eq(appointmentsPartitioned.tenantId, tenantId), eq(appointmentsPartitioned.patientId, patientId)))
        .orderBy(desc(appointmentsPartitioned.slotTime));

      const patientEncounters = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.patientId, patientId)))
        .orderBy(desc(encounters.createdAt));

      const patientVitals = await db
        .select()
        .from(consultationVitals)
        .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.patientId, patientId)))
        .orderBy(desc(consultationVitals.recordedAt));

      const patientConsultations = await db
        .select()
        .from(consultations)
        .where(and(eq(consultations.tenantId, tenantId), eq(consultations.patientId, patientId)))
        .orderBy(desc(consultations.createdAt));

      const labOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, patientId, db);
      const radiologyOrdersRes = await radiologyRepository.findManyOrders({ tenantId, limit: 200 }, db);
      const radiologyOrders = (radiologyOrdersRes.items || []).filter(
        (o: any) => o.patientId === patientId || (patientMrn && o.patientMrn === patientMrn)
      );
      const radOrderIds = new Set(radiologyOrders.map((o: any) => o.id));
      const allRadStudies = await radiologyRepository.findStudies(tenantId, db, 200, 0);
      const radiologyStudies = allRadStudies.filter(
        (s: any) => radOrderIds.has(s.orderId) || (patientMrn && s.patientMrn === patientMrn)
      );
      const radStudyIds = new Set(radiologyStudies.map((s: any) => s.id));
      const allRadReports = await radiologyRepository.findReports(tenantId, undefined, db, 200, 0);
      const radiologyReports = allRadReports.filter(
        (r: any) => radOrderIds.has(r.orderId) || radStudyIds.has(r.studyId) || (patientMrn && r.patientMrn === patientMrn)
      );

      const prescriptions = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.patientId, patientId)))
        .orderBy(desc(pharmacyPrescriptions.createdAt));

      const populatedPrescriptions = await Promise.all(
        prescriptions.map(async (rx) => {
          const items = await db
            .select()
            .from(pharmacyPrescriptionItems)
            .where(and(eq(pharmacyPrescriptionItems.tenantId, tenantId), eq(pharmacyPrescriptionItems.prescriptionId, rx.id)));
          return { ...rx, items };
        })
      );

      const referrals = await db
        .select()
        .from(encounterReferrals)
        .where(and(eq(encounterReferrals.tenantId, tenantId), eq(encounterReferrals.patientId, patientId)))
        .orderBy(desc(encounterReferrals.referredAt));

      const followups = await db
        .select()
        .from(consultationFollowups)
        .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.patientId, patientId)))
        .orderBy(desc(consultationFollowups.recommendedDate));

      const clinicalAlerts = await db
        .select()
        .from(criticalPanicValueAlerts)
        .where(and(eq(criticalPanicValueAlerts.tenantId, tenantId), eq(criticalPanicValueAlerts.patientMrn, patientMrn)))
        .orderBy(desc(criticalPanicValueAlerts.alertTimestamp));

      const invoices = await db
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.patientId, patientId)))
        .orderBy(desc(billingInvoices.createdAt));

      const populatedConsultations = await Promise.all(
        patientConsultations.map(async (c) => {
          const vitals = await db
            .select()
            .from(consultationVitals)
            .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.consultationId, c.id)));
          const diagnoses = await db
            .select()
            .from(consultationDiagnoses)
            .where(and(eq(consultationDiagnoses.tenantId, tenantId), eq(consultationDiagnoses.consultationId, c.id)));
          const medications = await db
            .select()
            .from(consultationMedications)
            .where(and(eq(consultationMedications.tenantId, tenantId), eq(consultationMedications.consultationId, c.id)));
          const consFollowups = await db
            .select()
            .from(consultationFollowups)
            .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.consultationId, c.id)));

          return {
            ...c,
            status: (c as any).consultationStatus || 'FINALIZED',
            vitals,
            diagnoses,
            medications,
            followups: consFollowups
          };
        })
      );

      // Reconstruct complete chronological timeline
      const timeline: Array<{ id: string; type: string; timestamp: Date; summary: string; status?: string; severity?: string; details?: any }> = [];

      if (patient) {
        timeline.push({
          id: `reg-${patient.id}`,
          type: 'REGISTRATION',
          timestamp: new Date(patient.createdAt),
          summary: `Patient registered: ${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn})`,
          status: 'COMPLETED'
        });
      }

      for (const apt of patientAppointments) {
        timeline.push({
          id: `apt-${apt.id}`,
          type: 'APPOINTMENT',
          timestamp: new Date(apt.slotTime),
          summary: `Appointment scheduled (${apt.appointmentType}): ${apt.status}`,
          status: apt.status,
          details: { doctorId: apt.doctorId, department: apt.department }
        });
      }

      for (const enc of patientEncounters) {
        timeline.push({
          id: `enc-${enc.id}`,
          type: 'ENCOUNTER',
          timestamp: new Date(enc.checkedInAt || enc.registeredAt || enc.createdAt),
          summary: `OPD Encounter (${enc.encounterType}): ${enc.chiefComplaint || 'Consultation'}`,
          status: enc.status,
          details: { doctorId: enc.doctorId, triageNotes: enc.triageNotes }
        });
      }

      for (const v of patientVitals) {
        timeline.push({
          id: `vit-${v.id}`,
          type: 'VITALS',
          timestamp: new Date(v.recordedAt),
          summary: `Vitals recorded: BP ${v.systolicBp}/${v.diastolicBp}, HR ${v.pulseBpm} bpm, SpO2 ${v.oxygenSaturationPercent}%`,
          status: 'RECORDED',
          details: { bmi: v.bmi, recordedBy: v.recordedBy }
        });
      }

      for (const c of populatedConsultations) {
        timeline.push({
          id: `con-${c.id}`,
          type: 'CONSULTATION',
          timestamp: new Date(c.createdAt),
          summary: `Consultation (${c.consultationNumber}): ${c.chiefComplaint}`,
          status: c.status,
          details: { diagnosesCount: c.diagnoses?.length || 0, medsCount: c.medications?.length || 0 }
        });
      }

      for (const rx of populatedPrescriptions) {
        timeline.push({
          id: `rx-${rx.id}`,
          type: 'PRESCRIPTION',
          timestamp: new Date(rx.createdAt),
          summary: `Prescription issued (${rx.prescriptionNumber}): ${rx.items.length} item(s)`,
          status: rx.status,
          details: { doctorId: rx.prescribingDoctorId }
        });
      }

      for (const ord of labOrders) {
        timeline.push({
          id: `lab-${ord.id}`,
          type: 'LAB_ORDER',
          timestamp: new Date(ord.orderedAt || ord.updatedAt || Date.now()),
          summary: `Diagnostic Lab Order: ${ord.testName} (${ord.status})`,
          status: ord.status
        });
      }

      for (const ro of radiologyOrders) {
        timeline.push({
          id: `rad-${ro.id}`,
          type: 'RADIOLOGY_ORDER',
          timestamp: new Date(ro.orderedAt || Date.now()),
          summary: `Radiology Imaging Order: ${ro.procedureName} (${ro.modalityType}) - Status: ${ro.status}`,
          status: ro.status,
          details: ro
        });
      }

      for (const rs of radiologyStudies) {
        timeline.push({
          id: `rad-study-${rs.id}`,
          type: 'RADIOLOGY_STUDY',
          timestamp: new Date(rs.studyDateTime || rs.createdAt || Date.now()),
          summary: `DICOM Study Acquired (${rs.accessionNumber}): ${rs.studyDescription} [${rs.modalityType}]`,
          status: rs.status,
          details: rs
        });
      }

      for (const rr of radiologyReports) {
        timeline.push({
          id: `rad-rep-${rr.id}`,
          type: 'RADIOLOGY_REPORT',
          timestamp: new Date(rr.finalizedAt || rr.createdAt || Date.now()),
          summary: `Radiology Report (${rr.reportNumber}) [${rr.status}]: ${rr.impression}`,
          status: rr.status,
          details: rr
        });
      }

      for (const ref of referrals) {
        timeline.push({
          id: `ref-${ref.id}`,
          type: 'REFERRAL',
          timestamp: new Date(ref.referredAt),
          summary: `Referral (${ref.referralType}): ${ref.clinicalSummary}`,
          status: ref.referralStatus,
          severity: ref.urgency
        });
      }

      for (const al of clinicalAlerts) {
        timeline.push({
          id: `alt-${al.id}`,
          type: 'CLINICAL_ALERT',
          timestamp: new Date(al.alertTimestamp),
          summary: `Clinical Alert [${al.urgencyLevel}] ${al.category}: ${al.clinicalRiskSummary}`,
          severity: al.urgencyLevel,
          status: al.acknowledgementTimestamp ? 'ACKNOWLEDGED' : 'ACTIVE'
        });
      }

      for (const inv of invoices) {
        timeline.push({
          id: `inv-${inv.id}`,
          type: 'BILLING_INVOICE',
          timestamp: new Date(inv.createdAt),
          summary: `OPD Invoice (${inv.invoiceNumber}): ${inv.status} - Total: ${inv.totalAmount} ${inv.currency}`,
          status: inv.status
        });
      }

      timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        patientId,
        patient,
        appointments: patientAppointments,
        encounters: patientEncounters,
        vitals: patientVitals,
        consultations: populatedConsultations,
        prescriptions: populatedPrescriptions,
        labOrders,
        radiologyOrders,
        radiologyStudies,
        radiologyReports,
        referrals,
        followups,
        clinicalAlerts,
        invoices,
        timeline,
        totalAppointments: patientAppointments.length,
        totalEncounters: patientEncounters.length,
        totalConsultations: populatedConsultations.length,
        totalPrescriptions: populatedPrescriptions.length,
        totalLabOrders: labOrders.length,
        totalRadiologyOrders: radiologyOrders.length,
        totalRadiologyStudies: radiologyStudies.length,
        totalRadiologyReports: radiologyReports.length,
        totalReferrals: referrals.length,
        totalAlerts: clinicalAlerts.length
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to query patient clinical history from database', err);
      throw new AppError({
        message: 'Database query failed. Clinical history lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async searchIcd10(query?: string) {
    if (!query) return ICD10_CATALOGUE;
    const q = query.toLowerCase();
    return ICD10_CATALOGUE.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }

  async getGenericAlternatives(drugQuery?: string) {
    if (!drugQuery) return GENERIC_DRUG_CATALOGUE;
    const q = drugQuery.toLowerCase();
    return GENERIC_DRUG_CATALOGUE.filter(d => 
      d.brandName.toLowerCase().includes(q) || 
      d.genericName.toLowerCase().includes(q)
    );
  }

  async getExitHubPatients(tenantId: string, search?: string, dbClient = getDatabase()) {
    const db = requireDb(dbClient);
    try {
      const activeEncounters = await db
        .select()
        .from(encounters)
        .where(
          and(
            eq(encounters.tenantId, tenantId),
            or(
              eq(encounters.status, 'IN_PROGRESS'),
              eq(encounters.status, 'ARRIVED'),
              eq(encounters.status, 'CHECKED_IN'),
              eq(encounters.status, 'COMPLETED')
            )
          )
        )
        .orderBy(desc(encounters.createdAt))
        .limit(50);

      const records = await Promise.all(
        activeEncounters.map(async (enc: any) => {
          const [pat] = await db
            .select()
            .from(patients)
            .where(and(eq(patients.tenantId, tenantId), eq(patients.id, enc.patientId)))
            .limit(1);

          const patientName = pat ? `${pat.firstName} ${pat.lastName}` : 'Walk-in Patient';
          const uhid = pat?.mrn || enc.patientId;
          const mobile = (pat?.metadata as any)?.['mobileNumber'] || (pat?.metadata as any)?.['phone'] || '';

          const [cons] = await db
            .select()
            .from(consultations)
            .where(and(eq(consultations.tenantId, tenantId), eq(consultations.encounterId, enc.id)))
            .orderBy(desc(consultations.createdAt))
            .limit(1);

          const consultationStatus = (cons?.consultationStatus === 'COMPLETED' || cons?.consultationStatus === 'READY_FOR_COMPLETION' || enc.status === 'COMPLETED') ? 'READY' : 'IN_PROGRESS';
          const doctorName = (cons as any)?.doctorName || 'Dr. Attending Physician';

          let labStatus: 'VERIFIED' | 'PENDING' | 'NO_TESTS' = 'NO_TESTS';
          let labTestsCount = 0;
          try {
            const labOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, enc.patientId, db);
            const encLabs = labOrders.filter((o: any) => o.encounterId === enc.id || !o.encounterId);
            labTestsCount = encLabs.length;
            if (labTestsCount > 0) {
              const allVerified = encLabs.every((o: any) => o.status === 'VERIFIED' || o.status === 'COMPLETED');
              labStatus = allVerified ? 'VERIFIED' : 'PENDING';
            }
          } catch {}

          let pharmacyStatus: 'PACKED' | 'DISPENSED' | 'OUTSIDE_RX' = 'DISPENSED';
          try {
            const rxs = await db
              .select()
              .from(pharmacyPrescriptions)
              .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.encounterId, enc.id)));
            if (rxs.length > 0) {
              const rxIds = rxs.map((r: any) => r.id);
              const disp = await db
                .select()
                .from(pharmacyDispensing)
                .where(and(eq(pharmacyDispensing.tenantId, tenantId)));
              const encDisp = disp.filter((d: any) => rxIds.includes(d.prescriptionId));
              const allDispensed = encDisp.length > 0 && encDisp.every((d: any) => d.status === 'DISPENSED');
              pharmacyStatus = allDispensed ? 'DISPENSED' : 'PACKED';
            }
          } catch {}

          let billingStatus: 'PAID' | 'DUE' = 'PAID';
          let amountDue = 0;
          try {
            const invoices = await db
              .select()
              .from(billingInvoices)
              .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.encounterId, enc.id)));
            const unpaid = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'REFUNDED');
            if (unpaid.length > 0) {
              billingStatus = 'DUE';
              amountDue = unpaid.reduce((sum: number, i: any) => sum + parseFloat(i.dueAmount || i.totalAmount || '0'), 0);
            }
          } catch {}

          const tokenNumber = enc.encounterNumber || `T-${enc.id.slice(0, 4).toUpperCase()}`;
          const completedAt = enc.createdAt ? new Date(enc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

          return {
            encounterId: enc.id,
            patientId: enc.patientId,
            uhid,
            tokenNumber,
            patientName,
            mobile,
            doctorName,
            consultationStatus,
            labStatus,
            labTestsCount,
            billingStatus,
            amountDue,
            pharmacyStatus,
            completedAt
          };
        })
      );

      if (search) {
        const q = search.toLowerCase().trim();
        return records.filter(
          (r: any) =>
            r.patientName.toLowerCase().includes(q) ||
            r.uhid.toLowerCase().includes(q) ||
            r.tokenNumber.toLowerCase().includes(q) ||
            r.mobile.includes(q)
        );
      }

      return records;
    } catch (err) {
      logger.error('Failed to get exit hub patients', err);
      throw new AppError({
        message: 'Failed to retrieve exit hub patients',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async checkoutEncounter(
    tenantId: string,
    encounterId: string,
    options: { forceDischarge?: boolean | undefined; overrideReason?: string | undefined; notes?: string | undefined } = {},
    dbClient = getDatabase()
  ) {
    const db = requireDb(dbClient);
    try {
      const [enc] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)))
        .limit(1);

      if (!enc) {
        throw new AppError({
          message: `Encounter ${encounterId} not found`,
          code: ErrorCode.NOT_FOUND,
          statusCode: 404
        });
      }

      if (enc.status === 'DISCHARGED' || enc.status === 'CLOSED') {
        throw new AppError({
          message: `Illegal state transition: Encounter ${encounterId} is already DISCHARGED.`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }

      const violations: string[] = [];

      const invoices = await db
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.encounterId, encounterId)));
      const unpaid = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'REFUNDED');
      if (unpaid.length > 0) {
        violations.push(`Unsettled invoices: ${unpaid.length} invoice(s) pending payment.`);
      }

      try {
        const labOrders = await labDiagnosticsRepository.searchOrders(tenantId, undefined, enc.patientId, db);
        const pendingEncounterLabs = labOrders.filter(
          (o: any) =>
            o.encounterId === encounterId &&
            !['VERIFIED', 'COMPLETED', 'CANCELLED', 'RELEASED'].includes(String(o.status || '').toUpperCase())
        );
        if (pendingEncounterLabs.length > 0) {
          violations.push(`Pending diagnostic results: ${pendingEncounterLabs.length} lab order(s) awaiting result verification.`);
        }
      } catch {}

      try {
        const radOrders = await db
          .select()
          .from(radiologyOrders)
          .where(and(eq(radiologyOrders.tenantId, tenantId), eq(radiologyOrders.encounterId, encounterId)));
        const pendingRads = radOrders.filter(
          (r: any) => !['COMPLETED', 'REPORTED', 'FINALIZED', 'CANCELLED'].includes(String(r.status || '').toUpperCase())
        );
        if (pendingRads.length > 0) {
          violations.push(`Pending radiology studies: ${pendingRads.length} imaging order(s) awaiting completion.`);
        }
      } catch {}

      try {
        const pharmQueue = await db
          .select()
          .from(pharmacyDispensing)
          .where(and(eq(pharmacyDispensing.tenantId, tenantId), eq(pharmacyDispensing.patientId, enc.patientId)));
        const pendingPharm = pharmQueue.filter(
          (p: any) => p.encounterId === encounterId && String(p.status || '').toUpperCase() === 'PENDING'
        );
        if (pendingPharm.length > 0) {
          violations.push(`Pending pharmacy dispensing: ${pendingPharm.length} prescription(s) awaiting dispensing.`);
        }
      } catch {}

      if (violations.length > 0 && !options.forceDischarge) {
        throw new AppError({
          message: `Cannot checkout patient: ${violations.join(' ')}`,
          code: ErrorCode.CONFLICT,
          statusCode: 409
        });
      }

      const now = new Date();
      const existingMeta = (enc.metadata as Record<string, any>) || {};
      const updatedMeta = {
        ...existingMeta,
        dischargedAt: now.toISOString(),
        dischargeNotes: options.notes || null,
        forceDischarge: Boolean(options.forceDischarge),
        overrideReason: options.overrideReason || null
      };

      await db
        .update(encounters)
        .set({
          status: 'DISCHARGED',
          metadata: updatedMeta,
          updatedAt: now
        })
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)));

      return {
        success: true,
        message: 'Patient encounter successfully cleared and discharged',
        encounterId,
        status: 'DISCHARGED',
        dischargedAt: now.toISOString()
      };
    } catch (err) {
      if (err instanceof AppError || (err && typeof err === 'object' && ('statusCode' in err || 'code' in err))) throw err;
      logger.error('Failed to checkout encounter', err);
      throw new AppError({
        message: 'Encounter checkout failed',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500
      });
    }
  }

  async dischargeEncounter(
    tenantId: string,
    encounterId: string,
    options: { forceDischarge?: boolean | undefined; overrideReason?: string | undefined; notes?: string | undefined } = {},
    dbClient = getDatabase()
  ) {
    return this.checkoutEncounter(tenantId, encounterId, options, dbClient);
  }

  // =========================================================================
  // 9. OPD CORE: APPOINTMENT SCHEDULING & SLOT LIFECYCLE
  // =========================================================================

  async createAppointment(input: CreateAppointmentInput, dbClient = getDatabase()): Promise<StoredAppointment> {
    const db = requireDb(dbClient);
    if (!input.tenantId || !UUID_REGEX.test(input.tenantId)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Valid tenantId UUID is required for appointment booking.',
        statusCode: 400
      });
    }
    if (!input.patientId || !UUID_REGEX.test(input.patientId)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Valid patientId UUID is required for appointment booking.',
        statusCode: 400
      });
    }
    if (!input.doctorId || !UUID_REGEX.test(input.doctorId)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Valid doctorId UUID is required for appointment booking.',
        statusCode: 400
      });
    }

    const patient = await this.getPatientById(input.tenantId, input.patientId, db);
    if (!patient) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Patient ${input.patientId} not found or does not belong to tenant.`,
        statusCode: 404
      });
    }

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, input.tenantId, input.branchId);

    const slotTimeDate = new Date(input.slotTime);
    if (isNaN(slotTimeDate.getTime())) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid slotTime provided for appointment.',
        statusCode: 400
      });
    }

    const slotDateStr = slotTimeDate.toISOString().slice(0, 10);
    const startTimeStr = slotTimeDate.toTimeString().slice(0, 5);

    const acquired = await slotLockManager.acquireDatabaseSlotLock(db, input.tenantId, input.doctorId, slotDateStr, startTimeStr);
    if (!acquired) {
      throw new AppError({
        statusCode: 409,
        code: ErrorCode.CONFLICT,
        message: `Doctor appointment slot on ${slotDateStr} at ${startTimeStr} is currently locked or being booked by another patient. Please choose another slot.`
      });
    }

    const [existing] = await db
      .select()
      .from(appointmentsPartitioned)
      .where(
        and(
          eq(appointmentsPartitioned.tenantId, input.tenantId),
          eq(appointmentsPartitioned.doctorId, input.doctorId),
          eq(appointmentsPartitioned.slotTime, slotTimeDate),
          ne(appointmentsPartitioned.status, 'CANCELLED')
        )
      )
      .limit(1);

    if (existing) {
      throw new AppError({
        statusCode: 409,
        code: ErrorCode.CONFLICT,
        message: `Active appointment already exists for this patient with the selected doctor at ${slotTimeDate.toISOString()}.`
      });
    }

    const appointmentId = crypto.randomUUID();
    const feeStr = (input.consultationFee !== undefined && input.consultationFee !== null)
      ? Number(input.consultationFee).toFixed(2)
      : '500.00';

    const [created] = await db
      .insert(appointmentsPartitioned)
      .values({
        id: appointmentId,
        tenantId: input.tenantId,
        branchId: branchId || null,
        patientId: input.patientId,
        doctorId: input.doctorId,
        department: input.departmentId || 'OPD',
        slotTime: slotTimeDate,
        status: input.status || 'SCHEDULED',
        appointmentType: input.appointmentType || 'CONSULTATION',
        consultationFee: feeStr,
        metadata: {
          ...(input.metadata || {}),
          reason: input.reason || 'General Outpatient Consultation',
          partnerId,
          organizationId
        }
      })
      .returning();

    return {
      ...created,
      patient
    } as StoredAppointment;
  }

  async getAppointments(
    tenantId: string,
    filters: { doctorId?: string; patientId?: string; status?: string; branchId?: string; date?: string },
    dbClient = getDatabase()
  ): Promise<StoredAppointment[]> {
    const db = requireDb(dbClient);
    const conditions = [eq(appointmentsPartitioned.tenantId, tenantId)];

    if (filters.doctorId && UUID_REGEX.test(filters.doctorId)) {
      conditions.push(eq(appointmentsPartitioned.doctorId, filters.doctorId));
    }
    if (filters.patientId && UUID_REGEX.test(filters.patientId)) {
      conditions.push(eq(appointmentsPartitioned.patientId, filters.patientId));
    }
    if (filters.status) {
      conditions.push(eq(appointmentsPartitioned.status, filters.status.toUpperCase()));
    }
    if (filters.branchId && UUID_REGEX.test(filters.branchId)) {
      conditions.push(eq(appointmentsPartitioned.branchId, filters.branchId));
    }

    const rows = await db
      .select()
      .from(appointmentsPartitioned)
      .where(and(...conditions))
      .orderBy(asc(appointmentsPartitioned.slotTime));

    if (filters.date) {
      return rows.filter((r) => {
        const slotDate = new Date(r.slotTime).toISOString().split('T')[0];
        return slotDate === filters.date;
      }) as StoredAppointment[];
    }

    return rows as StoredAppointment[];
  }

  async getAppointmentById(tenantId: string, appointmentId: string, dbClient = getDatabase()): Promise<StoredAppointment | null> {
    const db = requireDb(dbClient);
    const [row] = await db
      .select()
      .from(appointmentsPartitioned)
      .where(and(eq(appointmentsPartitioned.tenantId, tenantId), eq(appointmentsPartitioned.id, appointmentId)))
      .limit(1);

    if (!row) return null;
    const patient = await this.getPatientById(tenantId, row.patientId, db);
    return { ...row, patient } as StoredAppointment;
  }

  async rescheduleAppointment(
    tenantId: string,
    appointmentId: string,
    newSlotTime: string | Date,
    reason?: string,
    dbClient = getDatabase()
  ): Promise<StoredAppointment> {
    const db = requireDb(dbClient);
    const apt = await this.getAppointmentById(tenantId, appointmentId, db);
    if (!apt) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Appointment not found in tenant scope.',
        statusCode: 404
      });
    }

    if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Cannot reschedule appointment with status '${apt.status}'.`,
        statusCode: 400
      });
    }

    const newDate = new Date(newSlotTime);
    if (isNaN(newDate.getTime())) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid newSlotTime provided for rescheduling.',
        statusCode: 400
      });
    }

    const slotDateStr = newDate.toISOString().slice(0, 10);
    const startTimeStr = newDate.toTimeString().slice(0, 5);
    const acquired = await slotLockManager.acquireDatabaseSlotLock(db, tenantId, apt.doctorId, slotDateStr, startTimeStr);
    if (!acquired) {
      throw new AppError({
        statusCode: 409,
        code: ErrorCode.CONFLICT,
        message: `New appointment slot on ${slotDateStr} at ${startTimeStr} is currently locked or undergoing booking.`
      });
    }

    const [updated] = await db
      .update(appointmentsPartitioned)
      .set({
        slotTime: newDate,
        status: 'RESCHEDULED',
        metadata: {
          ...(apt.metadata || {}),
          rescheduledAt: new Date().toISOString(),
          rescheduleReason: reason || 'Patient requested reschedule',
          previousSlotTime: apt.slotTime
        },
        updatedAt: new Date()
      })
      .where(and(eq(appointmentsPartitioned.tenantId, tenantId), eq(appointmentsPartitioned.id, appointmentId)))
      .returning();

    return updated as StoredAppointment;
  }

  async cancelAppointment(
    tenantId: string,
    appointmentId: string,
    reason?: string,
    dbClient = getDatabase()
  ): Promise<StoredAppointment> {
    const db = requireDb(dbClient);
    const apt = await this.getAppointmentById(tenantId, appointmentId, db);
    if (!apt) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Appointment not found in tenant scope.',
        statusCode: 404
      });
    }

    if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Cannot cancel appointment with status '${apt.status}'.`,
        statusCode: 400
      });
    }

    const [updated] = await db
      .update(appointmentsPartitioned)
      .set({
        status: 'CANCELLED',
        metadata: {
          ...(apt.metadata || {}),
          cancelledAt: new Date().toISOString(),
          cancellationReason: reason || 'Cancelled by patient or reception'
        },
        updatedAt: new Date()
      })
      .where(and(eq(appointmentsPartitioned.tenantId, tenantId), eq(appointmentsPartitioned.id, appointmentId)))
      .returning();

    return updated as StoredAppointment;
  }

  async checkInAppointment(
    tenantId: string,
    appointmentId: string,
    dbClient = getDatabase()
  ): Promise<{ appointment: StoredAppointment; encounter: Encounter }> {
    const db = requireDb(dbClient);
    const apt = await this.getAppointmentById(tenantId, appointmentId, db);
    if (!apt) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Appointment not found in tenant scope.',
        statusCode: 404
      });
    }

    if (apt.status === 'CANCELLED') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Cannot check in a cancelled appointment.',
        statusCode: 400
      });
    }

    if (apt.status === 'COMPLETED') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Cannot check in an already completed appointment.',
        statusCode: 400
      });
    }

    if (apt.status === 'NO_SHOW') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Cannot check in a no-show appointment.',
        statusCode: 400
      });
    }

    if (apt.status === 'CHECKED_IN') {
      if (apt.metadata?.encounterId) {
        const existingEncounter = await this.getEncounterById(tenantId, apt.metadata.encounterId, db);
        if (existingEncounter) {
          return {
            appointment: apt,
            encounter: existingEncounter
          };
        }
      }
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Appointment is already checked in.',
        statusCode: 400
      });
    }

    const encounter = await this.createEncounter(
      {
        tenantId,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        ...(apt.branchId ? { branchId: apt.branchId } : {}),
        ...(apt.department && UUID_REGEX.test(apt.department) ? { departmentId: apt.department } : {}),
        encounterType: 'OPD',
        status: 'CHECKED_IN',
        chiefComplaint: apt.metadata?.reason || 'Scheduled OPD Consultation',
        metadata: {
          appointmentId: apt.id,
          slotTime: apt.slotTime
        }
      },
      db
    );

    const [updatedApt] = await db
      .update(appointmentsPartitioned)
      .set({
        status: 'CHECKED_IN',
        metadata: {
          ...(apt.metadata || {}),
          checkedInAt: new Date().toISOString(),
          encounterId: encounter.id
        },
        updatedAt: new Date()
      })
      .where(and(eq(appointmentsPartitioned.tenantId, tenantId), eq(appointmentsPartitioned.id, appointmentId)))
      .returning();

    return {
      appointment: updatedApt as StoredAppointment,
      encounter
    };
  }

  // =========================================================================
  // 10. OPD CORE: NURSE TRIAGE & VITALS RECORDING
  async saveVitals(input: any, dbClient = getDatabase()) {
    const res = await this.recordEncounterVitals(input.tenantId, input.encounterId, input, dbClient);
    return res.vitals;
  }

  async recordEncounterVitals(
    tenantId: string,
    encounterId: string,
    input: Omit<RecordEncounterVitalsInput, 'tenantId' | 'encounterId'>,
    dbClient = getDatabase()
  ): Promise<{ vitals: StoredEncounterVitals; alertCreated: boolean; alert?: StoredClinicalAlert }> {
    const db = requireDb(dbClient);
    const encounter = await this.getEncounterById(tenantId, encounterId, db);
    if (!encounter) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Encounter '${encounterId}' not found in tenant scope.`,
        statusCode: 404
      });
    }

    if (input.systolicBp < 40 || input.systolicBp > 300) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'systolicBp must be between 40 and 300 mmHg.',
        statusCode: 400
      });
    }
    if (input.diastolicBp < 20 || input.diastolicBp > 200) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'diastolicBp must be between 20 and 200 mmHg.',
        statusCode: 400
      });
    }
    const pulse = input.pulseBpm ?? input.pulseRateBpm ?? 72;
    if (pulse < 20 || pulse > 300) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'pulseBpm must be between 20 and 300 bpm.',
        statusCode: 400
      });
    }
    if (input.oxygenSaturationPercent !== undefined && (input.oxygenSaturationPercent < 0 || input.oxygenSaturationPercent > 100)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'oxygenSaturationPercent must be between 0 and 100%.',
        statusCode: 400
      });
    }
    if (input.respiratoryRateBpm !== undefined && (input.respiratoryRateBpm < 4 || input.respiratoryRateBpm > 60)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'respiratoryRateBpm must be between 4 and 60 bpm.',
        statusCode: 400
      });
    }

    let computedBmi: string | null = null;
    if (input.heightCm && input.weightKg) {
      const hM = Number(input.heightCm) / 100;
      const wKg = Number(input.weightKg);
      if (hM > 0 && wKg > 0) {
        computedBmi = (wKg / (hM * hM)).toFixed(1);
      }
    }

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, tenantId, input.partnerId, input.organizationId);

    const tempCelsius = input.temperatureCelsius
      ? String(input.temperatureCelsius)
      : (input.temperatureFahrenheit ? String(((input.temperatureFahrenheit - 32) * 5 / 9).toFixed(1)) : '37.0');

    let consultationId: string | null = null;
    const existingCons = await this.getConsultationByEncounter(tenantId, encounterId, db);
    if (existingCons) {
      consultationId = existingCons.id;
    } else {
      consultationId = crypto.randomUUID();
      const now = new Date();
      await db.insert(consultations).values({
        id: consultationId,
        tenantId,
        partnerId,
        organizationId,
        branchId: encounter.branchId,
        patientId: encounter.patientId,
        encounterId,
        doctorId: encounter.doctorId || '00000000-0000-4000-8000-000000000005',
        consultationNumber: `CON-TRIAGE-${Math.floor(100000 + Math.random() * 900000)}`,
        consultationStatus: 'DRAFT',
        chiefComplaint: encounter.chiefComplaint || 'Triage intake',
        createdBy: input.recordedBy || 'Nurse Station',
        updatedBy: input.recordedBy || 'Nurse Station',
        createdAt: now,
        updatedAt: now
      });
    }

    const vitalsId = crypto.randomUUID();
    const [insertedVitals] = await db
      .insert(consultationVitals)
      .values({
        id: vitalsId,
        tenantId,
        partnerId,
        organizationId,
        consultationId,
        patientId: encounter.patientId,
        temperatureCelsius: tempCelsius,
        pulseBpm: pulse,
        respiratoryRateBpm: input.respiratoryRateBpm || 16,
        systolicBp: input.systolicBp,
        diastolicBp: input.diastolicBp,
        oxygenSaturationPercent: input.oxygenSaturationPercent ?? 98,
        weightKg: input.weightKg ? String(input.weightKg) : null,
        heightCm: input.heightCm ? String(input.heightCm) : null,
        bmi: computedBmi,
        painScore: input.painScore ?? 0,
        clinicalNotes: input.clinicalNotes || 'Triage vitals logged at nurse station',
        recordedBy: input.recordedBy || 'Staff Nurse, RN',
        recordedAt: new Date()
      })
      .returning();

    const triageSummary = `BP: ${input.systolicBp}/${input.diastolicBp} mmHg, HR: ${pulse} bpm, SpO2: ${input.oxygenSaturationPercent ?? 98}%, Temp: ${tempCelsius}°C${computedBmi ? `, BMI: ${computedBmi}` : ''}`;
    await db
      .update(encounters)
      .set({
        triageNotes: triageSummary,
        metadata: {
          ...(encounter.metadata || {}),
          latestVitalsId: vitalsId,
          vitals: {
            systolicBp: input.systolicBp,
            diastolicBp: input.diastolicBp,
            pulseBpm: pulse,
            oxygenSaturationPercent: input.oxygenSaturationPercent ?? 98,
            temperatureCelsius: tempCelsius,
            bmi: computedBmi
          }
        },
        updatedAt: new Date()
      })
      .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)));

    let alertCreated = false;
    let alertRecord: StoredClinicalAlert | undefined;
    const patient = await this.getPatientById(tenantId, encounter.patientId, db);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
    const patientMrn = patient?.mrn || encounter.patientId;

    if (input.oxygenSaturationPercent !== undefined && input.oxygenSaturationPercent < 90) {
      alertRecord = await this.createClinicalAlert(
        tenantId,
        {
          patientMrn,
          patientName,
          category: 'VITAL_BREACH',
          urgencyLevel: 'CRITICAL',
          clinicalRiskSummary: `Hypoxia alert: Oxygen saturation SpO2 dropped to ${input.oxygenSaturationPercent}% (critical threshold < 90%). Immediate oxygen supplementation required.`,
          testName: 'Pulse Oximetry (SpO2)',
          measuredValue: `${input.oxygenSaturationPercent}%`,
          normalRange: '95-100%',
          panicThreshold: '< 90%',
          doctorName: 'Attending Physician',
          location: 'OPD Nurse Triage Station',
          branchId: encounter.branchId
        },
        db
      );
      alertCreated = true;
    } else if (input.systolicBp >= 180 || input.diastolicBp >= 110) {
      alertRecord = await this.createClinicalAlert(
        tenantId,
        {
          patientMrn,
          patientName,
          category: 'VITAL_BREACH',
          urgencyLevel: 'HIGH',
          clinicalRiskSummary: `Hypertensive urgency alert: Blood pressure measured at ${input.systolicBp}/${input.diastolicBp} mmHg (threshold >= 180/110).`,
          testName: 'Non-Invasive Blood Pressure (NIBP)',
          measuredValue: `${input.systolicBp}/${input.diastolicBp} mmHg`,
          normalRange: '90-120 / 60-80 mmHg',
          panicThreshold: '>= 180/110 mmHg',
          doctorName: 'Attending Physician',
          location: 'OPD Nurse Triage Station',
          branchId: encounter.branchId
        },
        db
      );
      alertCreated = true;
    }

    return {
      vitals: insertedVitals as StoredEncounterVitals,
      alertCreated,
      ...(alertRecord ? { alert: alertRecord } : {})
    };
  }

  async getEncounterVitals(tenantId: string, encounterId: string, dbClient = getDatabase()): Promise<StoredEncounterVitals[]> {
    const db = requireDb(dbClient);
    const encounter = await this.getEncounterById(tenantId, encounterId, db);
    if (!encounter) return [];

    const existingCons = await this.getConsultationByEncounter(tenantId, encounterId, db);
    if (!existingCons) {
      return db
        .select()
        .from(consultationVitals)
        .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.patientId, encounter.patientId)))
        .orderBy(desc(consultationVitals.recordedAt));
    }

    return db
      .select()
      .from(consultationVitals)
      .where(and(eq(consultationVitals.tenantId, tenantId), eq(consultationVitals.consultationId, existingCons.id)))
      .orderBy(desc(consultationVitals.recordedAt));
  }

  // =========================================================================
  // 11. OPD CORE: CONSULTATION BILLING & CASHIER PAYMENT COLLECTION
  // =========================================================================

  async createOpdPayment(
    tenantId: string,
    encounterId: string,
    input: Omit<CreateOpdPaymentInput, 'tenantId' | 'encounterId'>,
    dbClient = getDatabase()
  ): Promise<StoredOpdPayment> {
    const db = requireDb(dbClient);
    const encounter = await this.getEncounterById(tenantId, encounterId, db);
    if (!encounter) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Encounter '${encounterId}' not found in tenant scope.`,
        statusCode: 404
      });
    }

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, tenantId, input.branchId || encounter.branchId);

    const amount = Number(input.amount || 500);
    if (amount <= 0) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Payment amount must be greater than zero.',
        statusCode: 400
      });
    }

    const amountStr = amount.toFixed(2);
    const invoiceId = crypto.randomUUID();
    const invoiceNumber = `INV-OPD-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    await db
      .insert(billingInvoices)
      .values({
        id: invoiceId,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: encounter.patientId,
        encounterId,
        invoiceNumber,
        invoiceType: 'OPD',
        status: 'PAID',
        subtotal: amountStr,
        discountTotal: '0.00',
        taxTotal: '0.00',
        totalAmount: amountStr,
        paidAmount: amountStr,
        dueAmount: '0.00',
        currency: 'INR',
        issuedAt: now,
        finalizedAt: now,
        finalizedBy: input.collectedBy || 'OPD Cashier',
        createdAt: now,
        updatedAt: now
      });

    await db.insert(billingInvoiceItems).values({
      id: crypto.randomUUID(),
      tenantId,
      invoiceId,
      serviceCode: 'OPD-CONSULT-01',
      description: 'OPD Doctor Consultation Fee',
      quantity: 1,
      unitPrice: amountStr,
      grossAmount: amountStr,
      discountAmount: '0.00',
      taxAmount: '0.00',
      netAmount: amountStr,
      metadata: { serviceCategory: 'CONSULTATION' },
      createdAt: now
    } as any);

    const paymentId = crypto.randomUUID();
    const paymentNumber = `RCT-OPD-${Math.floor(100000 + Math.random() * 900000)}`;
    await db
      .insert(billingPayments)
      .values({
        id: paymentId,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        invoiceId,
        patientId: encounter.patientId,
        paymentNumber,
        paymentMethod: input.paymentMethod || 'CASH',
        amount: amountStr,
        currency: 'INR',
        status: 'SUCCESS',
        receivedBy: input.collectedBy || 'OPD Cashier',
        receivedAt: now,
        notes: input.notes || 'OPD Consultation Fee',
        createdAt: now,
        updatedAt: now
      } as any)
      .returning();

    await db
      .update(encounters)
      .set({
        metadata: {
          ...(encounter.metadata || {}),
          invoiceId,
          invoiceNumber,
          paymentId,
          paymentNumber,
          paymentStatus: 'PAID',
          paymentAmount: amount
        },
        updatedAt: now
      })
      .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, encounterId)));

    return {
      invoiceId,
      invoiceNumber,
      paymentId,
      paymentNumber,
      encounterId,
      patientId: encounter.patientId,
      amount,
      paymentMethod: input.paymentMethod || 'CASH',
      status: 'PAID',
      paidAt: now
    };
  }

  async getOpdInvoice(tenantId: string, invoiceIdOrEncounterId: string, dbClient = getDatabase()) {
    const db = requireDb(dbClient);
    const [inv] = await db
      .select()
      .from(billingInvoices)
      .where(and(
        eq(billingInvoices.tenantId, tenantId),
        or(eq(billingInvoices.id, invoiceIdOrEncounterId), eq(billingInvoices.encounterId, invoiceIdOrEncounterId))
      ))
      .limit(1);

    if (!inv) return null;
    const items = await db
      .select()
      .from(billingInvoiceItems)
      .where(and(eq(billingInvoiceItems.tenantId, tenantId), eq(billingInvoiceItems.invoiceId, inv.id)));
    const payments = await db
      .select()
      .from(billingPayments)
      .where(and(eq(billingPayments.tenantId, tenantId), eq(billingPayments.invoiceId, inv.id)));

    return {
      invoice: inv,
      items,
      payments,
      ...inv
    };
  }

  // =========================================================================
  // 12. OPD CORE: CLINICAL REFERRALS
  // =========================================================================

  async createReferral(input: CreateReferralInput, dbClient = getDatabase()): Promise<StoredReferral> {
    const db = requireDb(dbClient);
    const encounter = await this.getEncounterById(input.tenantId, input.encounterId, db);
    if (!encounter) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Encounter '${input.encounterId}' not found in tenant scope.`,
        statusCode: 404
      });
    }

    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, input.tenantId, input.partnerId, input.organizationId);

    const referralId = crypto.randomUUID();
    const now = new Date();
    const destDeptId = (input.destinationDepartmentId && UUID_REGEX.test(input.destinationDepartmentId)) ? input.destinationDepartmentId : null;
    const destDocId = (input.destinationDoctorId && UUID_REGEX.test(input.destinationDoctorId)) ? input.destinationDoctorId : null;
    const rawRefDoc = input.referringDoctorId || encounter.doctorId;
    const refDocId = (rawRefDoc && UUID_REGEX.test(rawRefDoc)) ? rawRefDoc : null;

    const [referral] = await db
      .insert(encounterReferrals)
      .values({
        id: referralId,
        tenantId: input.tenantId,
        partnerId,
        organizationId,
        encounterId: input.encounterId,
        patientId: input.patientId,
        referralType: input.referralType || 'INTERNAL_SPECIALIST',
        referringDoctorId: refDocId,
        destinationDepartmentId: destDeptId,
        destinationDoctorId: destDocId,
        destinationFacilityName: input.destinationFacilityName || (!destDeptId ? input.destinationDepartmentId : null),
        clinicalSummary: input.clinicalSummary,
        urgency: input.urgency || 'ROUTINE',
        referralStatus: 'PENDING',
        referredAt: now,
        metadata: {
          ...(input.metadata || {}),
          departmentName: input.destinationDepartmentId || null
        },
        createdAt: now,
        updatedAt: now
      } as any)
      .returning();

    return referral as StoredReferral;
  }

  async getReferrals(
    tenantId: string,
    filters: { patientId?: string; encounterId?: string; referralStatus?: string },
    dbClient = getDatabase()
  ): Promise<StoredReferral[]> {
    const db = requireDb(dbClient);
    const conditions = [eq(encounterReferrals.tenantId, tenantId)];

    if (filters.patientId && UUID_REGEX.test(filters.patientId)) {
      conditions.push(eq(encounterReferrals.patientId, filters.patientId));
    }
    if (filters.encounterId && UUID_REGEX.test(filters.encounterId)) {
      conditions.push(eq(encounterReferrals.encounterId, filters.encounterId));
    }
    if (filters.referralStatus) {
      conditions.push(eq(encounterReferrals.referralStatus, filters.referralStatus.toUpperCase()));
    }

    const rows = await db
      .select()
      .from(encounterReferrals)
      .where(and(...conditions))
      .orderBy(desc(encounterReferrals.referredAt));

    return rows as StoredReferral[];
  }

  async updateReferralStatus(
    tenantId: string,
    referralId: string,
    status: string,
    notes?: string,
    dbClient = getDatabase()
  ): Promise<StoredReferral> {
    const db = requireDb(dbClient);
    const [ref] = await db
      .select()
      .from(encounterReferrals)
      .where(and(eq(encounterReferrals.tenantId, tenantId), eq(encounterReferrals.id, referralId)))
      .limit(1);

    if (!ref) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Referral not found in tenant scope.',
        statusCode: 404
      });
    }

    const [updated] = await db
      .update(encounterReferrals)
      .set({
        referralStatus: status.toUpperCase(),
        metadata: {
          ...(ref.metadata || {}),
          statusUpdateNotes: notes || '',
          statusUpdatedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      })
      .where(and(eq(encounterReferrals.tenantId, tenantId), eq(encounterReferrals.id, referralId)))
      .returning();

    return updated as StoredReferral;
  }

  // =========================================================================
  // 13. OPD CORE: CLINICAL ALERTS & ALLERGY WARNINGS
  // =========================================================================

  async createClinicalAlert(
    tenantId: string,
    input: CreateClinicalAlertInput,
    dbClient = getDatabase()
  ): Promise<StoredClinicalAlert> {
    const db = requireDb(dbClient);
    const { partnerId, organizationId } = await resolvePartnerAndOrg(db, tenantId, input.partnerId, input.organizationId);
    const branchId = await resolveBranchId(db, tenantId, input.branchId);

    const existing = await db
      .select()
      .from(criticalPanicValueAlerts)
      .where(
        and(
          eq(criticalPanicValueAlerts.tenantId, tenantId),
          eq(criticalPanicValueAlerts.patientMrn, input.patientMrn),
          eq(criticalPanicValueAlerts.category, input.category)
        )
      )
      .orderBy(desc(criticalPanicValueAlerts.createdAt))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      const ex = existing[0];
      const ageHours = (Date.now() - new Date(ex.createdAt).getTime()) / (1000 * 3600);
      if (ageHours < 24 && ex.clinicalRiskSummary === input.clinicalRiskSummary) {
        return ex as StoredClinicalAlert;
      }
    }

    const alertId = crypto.randomUUID();
    const now = new Date();

    const [alert] = await db
      .insert(criticalPanicValueAlerts)
      .values({
        id: alertId,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientMrn: input.patientMrn,
        patientName: input.patientName,
        location: input.location || 'OPD Clinical Station',
        testName: input.testName || 'Clinical Examination Alert',
        measuredValue: input.measuredValue || 'N/A',
        referenceNormalRange: input.referenceNormalRange || input.normalRange || 'Normal',
        panicThreshold: input.panicThreshold || 'Breach',
        category: input.category,
        urgencyLevel: input.urgencyLevel,
        clinicalRiskSummary: input.clinicalRiskSummary,
        communicatedToDoctor: true,
        doctorName: input.doctorName || 'Attending Physician',
        alertTimestamp: now,
        createdAt: now
      })
      .returning();

    return alert as StoredClinicalAlert;
  }

  async getPatientClinicalAlerts(tenantId: string, patientMrn: string, dbClient = getDatabase()): Promise<StoredClinicalAlert[]> {
    const db = requireDb(dbClient);
    return db
      .select()
      .from(criticalPanicValueAlerts)
      .where(and(eq(criticalPanicValueAlerts.tenantId, tenantId), eq(criticalPanicValueAlerts.patientMrn, patientMrn)))
      .orderBy(desc(criticalPanicValueAlerts.alertTimestamp));
  }

  async acknowledgeClinicalAlert(tenantId: string, alertId: string, doctorName: string, dbClient = getDatabase()): Promise<StoredClinicalAlert> {
    const db = requireDb(dbClient);
    const [alert] = await db
      .select()
      .from(criticalPanicValueAlerts)
      .where(and(eq(criticalPanicValueAlerts.tenantId, tenantId), eq(criticalPanicValueAlerts.id, alertId)))
      .limit(1);

    if (!alert) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Clinical alert not found in tenant scope.',
        statusCode: 404
      });
    }

    const [updated] = await db
      .update(criticalPanicValueAlerts)
      .set({
        acknowledgementTimestamp: new Date(),
        doctorName: doctorName || alert.doctorName
      })
      .where(and(eq(criticalPanicValueAlerts.tenantId, tenantId), eq(criticalPanicValueAlerts.id, alertId)))
      .returning();

    return updated as StoredClinicalAlert;
  }

  // -------------------------------------------------------------------------
  // Allergy Safety & Registry
  // -------------------------------------------------------------------------

  async recordPatientAllergy(
    tenantId: string,
    patientId: string,
    input: {
      allergen: string;
      allergenType?: string;
      severity?: string;
      reaction?: string;
      recordedBy?: string;
      notes?: string;
    },
    dbClient = getDatabase()
  ): Promise<any> {
    const db = requireDb(dbClient);
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)))
      .limit(1);

    if (!patient) {
      throw new AppError({
        message: 'Patient not found for allergy recording',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const currentMeta = (patient.metadata as Record<string, any>) || {};
    const currentAllergies: any[] = Array.isArray(currentMeta['allergies']) ? currentMeta['allergies'] : [];

    const newAllergy = {
      id: crypto.randomUUID(),
      patientId,
      allergen: input.allergen.trim(),
      allergenType: input.allergenType || 'DRUG',
      severity: input.severity || 'SEVERE',
      reaction: input.reaction || 'Adverse allergic reaction',
      status: 'ACTIVE',
      recordedBy: input.recordedBy || 'Attending Physician',
      notes: input.notes || '',
      recordedAt: new Date().toISOString()
    };

    const updatedAllergies = [...currentAllergies, newAllergy];
    await db
      .update(patients)
      .set({
        metadata: { ...currentMeta, allergies: updatedAllergies },
        updatedAt: new Date()
      })
      .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)));

    if (['SEVERE', 'LIFE_THREATENING'].includes(newAllergy.severity.toUpperCase())) {
      try {
        await this.createClinicalAlert(tenantId, {
          tenantId,
          patientMrn: patient.mrn,
          patientName: `${patient.firstName} ${patient.lastName}`,
          category: 'ALLERGY',
          urgencyLevel: newAllergy.severity === 'LIFE_THREATENING' ? 'CRITICAL' : 'HIGH',
          clinicalRiskSummary: `Active ${newAllergy.severity} allergy to ${newAllergy.allergen}: ${newAllergy.reaction}`,
          testName: `Allergy: ${newAllergy.allergen}`,
          panicThreshold: 'Known Hypersensitivity',
          doctorName: input.recordedBy || 'Attending Physician'
        }, db);
      } catch (alertErr) {
        logger.warn('Failed to register critical panic alert for allergy', { error: String(alertErr) });
      }
    }

    return newAllergy;
  }

  async getPatientAllergies(tenantId: string, patientId: string, dbClient = getDatabase()): Promise<any[]> {
    const db = requireDb(dbClient);
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)))
      .limit(1);

    if (!patient) return [];
    const meta = (patient.metadata as Record<string, any>) || {};
    return Array.isArray(meta['allergies']) ? meta['allergies'] : [];
  }

  async updatePatientAllergyStatus(
    tenantId: string,
    patientId: string,
    allergyId: string,
    status: 'ACTIVE' | 'RESOLVED' | 'INACTIVE',
    dbClient = getDatabase()
  ): Promise<any> {
    const db = requireDb(dbClient);
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)))
      .limit(1);

    if (!patient) {
      throw new AppError({
        message: 'Patient not found',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const currentMeta = (patient.metadata as Record<string, any>) || {};
    const currentAllergies: any[] = Array.isArray(currentMeta['allergies']) ? currentMeta['allergies'] : [];
    let updated = false;
    let updatedAllergy = null;

    const modifiedAllergies = currentAllergies.map(a => {
      if (a.id === allergyId) {
        updated = true;
        updatedAllergy = { ...a, status, updatedAt: new Date().toISOString() };
        return updatedAllergy;
      }
      return a;
    });

    if (!updated) {
      throw new AppError({
        message: 'Allergy record not found for patient',
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    await db
      .update(patients)
      .set({
        metadata: { ...currentMeta, allergies: modifiedAllergies },
        updatedAt: new Date()
      })
      .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)));

    return updatedAllergy;
  }

  // =========================================================================
  // 14. OPD CORE: FOLLOW-UP APPOINTMENT CONVERSION
  // =========================================================================

  async createFollowUp(input: CreateFollowUpInput, dbClient = getDatabase()): Promise<StoredFollowUp> {
    const db = requireDb(dbClient);
    const now = new Date();
    const id = crypto.randomUUID();
    const defaults = await resolvePartnerAndOrg(db, input.tenantId);

    let consultationId = input.consultationId;
    if (!consultationId || !UUID_REGEX.test(consultationId)) {
      const existing = await db
        .select({ id: consultations.id })
        .from(consultations)
        .where(and(eq(consultations.tenantId, input.tenantId), eq(consultations.patientId, input.patientId)))
        .orderBy(desc(consultations.createdAt))
        .limit(1);
      if (existing.length > 0 && existing[0]?.id) {
        consultationId = existing[0].id;
      } else {
        const cons = await this.saveConsultation(
          {
            tenantId: input.tenantId,
            patientId: input.patientId,
            encounterId: input.encounterId || crypto.randomUUID(),
            doctorId: input.doctorId || '00000000-0000-4000-8000-000000000005',
            chiefComplaint: 'Follow-up Recommendation'
          },
          db
        );
        consultationId = cons.id;
      }
    }

    const [followUp] = await db
      .insert(consultationFollowups)
      .values({
        id,
        tenantId: input.tenantId,
        partnerId: defaults.partnerId,
        organizationId: defaults.organizationId,
        consultationId,
        patientId: input.patientId,
        recommendedDate: input.recommendedDate || input.followUpDate || null,
        reason: input.reason || 'Routine OPD follow-up',
        notes: input.notes || null,
        status: 'PENDING',
        recordedBy: input.recordedBy || 'Attending Physician',
        recordedAt: now,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return followUp as StoredFollowUp;
  }

  async getFollowUps(tenantId: string, filters: { patientId?: string; doctorId?: string }, dbClient = getDatabase()): Promise<StoredFollowUp[]> {
    const db = requireDb(dbClient);
    const conditions = [eq(consultationFollowups.tenantId, tenantId)];
    if (filters.patientId && UUID_REGEX.test(filters.patientId)) {
      conditions.push(eq(consultationFollowups.patientId, filters.patientId));
    }
    return db
      .select()
      .from(consultationFollowups)
      .where(and(...conditions))
      .orderBy(asc(consultationFollowups.recommendedDate));
  }

  async convertFollowUpToAppointment(
    tenantId: string,
    followUpId: string,
    slotDetails: { doctorId?: string; slotTime: string | Date; departmentId?: string },
    dbClient = getDatabase()
  ): Promise<{ followUp: StoredFollowUp; appointment: StoredAppointment }> {
    const db = requireDb(dbClient);
    const [followUp] = await db
      .select()
      .from(consultationFollowups)
      .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.id, followUpId)))
      .limit(1);

    if (!followUp) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Follow-up recommendation not found in tenant scope.',
        statusCode: 404
      });
    }

    const effectiveDoctorId = slotDetails.doctorId || '00000000-0000-4000-8000-000000000005';

    const appointment = await this.createAppointment(
      {
        tenantId,
        patientId: followUp.patientId,
        doctorId: effectiveDoctorId,
        departmentId: slotDetails.departmentId || 'OPD',
        slotTime: slotDetails.slotTime,
        appointmentType: 'FOLLOW_UP',
        reason: followUp.reason || 'Converted from consultation follow-up',
        metadata: {
          originalFollowUpId: followUp.id,
          originalConsultationId: followUp.consultationId
        }
      },
      db
    );

    const [updatedFollowUp] = await db
      .update(consultationFollowups)
      .set({
        status: 'SCHEDULED',
        notes: followUp.notes ? `${followUp.notes} | Converted to appointment ${appointment.id}` : `Converted to appointment ${appointment.id}`,
        updatedAt: new Date()
      })
      .where(and(eq(consultationFollowups.tenantId, tenantId), eq(consultationFollowups.id, followUpId)))
      .returning();

    return {
      followUp: updatedFollowUp as StoredFollowUp,
      appointment
    };
  }

  // =========================================================================
  // 15. OPD CORE: PRESCRIPTION FINALIZATION & IMMUTABILITY
  // =========================================================================

  async finalizePrescription(tenantId: string, prescriptionId: string, dbClient = getDatabase()): Promise<StoredPrescription> {
    const db = requireDb(dbClient);
    const rx = await this.getPrescriptionById(tenantId, prescriptionId, db);
    if (!rx) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Prescription not found in tenant scope.',
        statusCode: 404
      });
    }

    if (rx.status === 'FINALIZED') {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: 'Prescription is already finalized and cannot be modified.',
        statusCode: 409
      });
    }

    await db
      .update(pharmacyPrescriptions)
      .set({
        status: 'FINALIZED',
        updatedAt: new Date()
      })
      .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.id, prescriptionId)));

    return {
      ...rx,
      status: 'FINALIZED'
    };
  }

  // =========================================================================
  // 16. OPD CORE: DOCTOR WORKSPACE CONSOLIDATED RETRIEVAL
  // =========================================================================

  async getDoctorOpdWorkspace(tenantId: string, doctorId: string, branchId?: string, dbClient = getDatabase()): Promise<DoctorOpdWorkspaceDto> {
    const db = requireDb(dbClient);
    const today = new Date().toISOString().slice(0, 10);

    const queue = await this.getQueue(tenantId, { doctorId, ...(branchId ? { branchId } : {}), queueDate: today }, db);

    const activeToken = queue.find(q => q.queueStatus === 'IN_PROGRESS' || q.queueStatus === 'CALLED');
    let activePatient: DoctorOpdWorkspaceDto['activePatient'] = null;

    if (activeToken) {
      const encounter = await this.getEncounterById(tenantId, activeToken.encounterId, db);
      if (encounter) {
        const patient = await this.getPatientById(tenantId, encounter.patientId, db);
        if (patient) {
          const vitalsList = await this.getEncounterVitals(tenantId, encounter.id, db);
          const alertsList = await this.getPatientClinicalAlerts(tenantId, patient.mrn || patient.id, db);
          const history = await this.getPatientClinicalHistory(tenantId, patient.id, db);

          activePatient = {
            encounter,
            patient,
            vitals: vitalsList[0] || null,
            activeAlerts: alertsList.filter(a => !a.acknowledgementTimestamp),
            previousDiagnoses: (history as any).consultations?.flatMap((c: any) => c.diagnoses || []) || [],
            previousPrescriptions: (history as any).prescriptions || []
          };
        }
      }
    }

    const waitingCount = queue.filter(q => q.queueStatus === 'WAITING').length;
    const servedTodayCount = queue.filter(q => q.queueStatus === 'SERVED').length;
    const activeAlertsCount = activePatient ? activePatient.activeAlerts.length : 0;

    return {
      doctorId,
      queue,
      activePatient,
      summary: {
        waitingCount,
        servedTodayCount,
        activeAlertsCount
      }
    };
  }
}

export const clinicalWorkflowRepository = new ClinicalWorkflowRepository();

