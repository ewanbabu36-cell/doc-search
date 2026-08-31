import { apiRequest } from './api-client.js';

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
  EncounterDto,
  EncounterQueueDto,
  EncounterReferralDto,
  EncounterAuditTraceDto,
  EncounterOverviewDto,
  CreateEncounterRequest,
  CheckInEncounterRequest,
  AssignDoctorRequest,
  ChangeEncounterStatusRequest,
  CancelEncounterRequest,
  ReferEncounterRequest,
  ReassignEncounterRequest,
  SearchEncounterRequest,
  QueryEncounterAuditRequest
} from '@docsearch/api-contracts';
import { MOCK_TENANT_ID } from './mock-partner-foundation-data.js';
import {
  MOCK_ENCOUNTERS,
  MOCK_ENCOUNTER_QUEUES,
  MOCK_ENCOUNTER_REFERRALS,
  MOCK_ENCOUNTER_AUDIT_TRACES,
  MOCK_ENCOUNTER_OVERVIEW
} from './mock-encounter-data.js';
import { patientRegistrationService } from './patient-registration-service.js';
import { doctorRosterService } from './doctor-roster-service.js';
import { staffAdministrationService } from './staff-administration-service.js';

export interface IEncounterService {
  getOverview(tenantId: string, partnerId?: string, organizationId?: string, branchId?: string): Promise<EncounterOverviewDto>;
  searchEncounters(req: SearchEncounterRequest): Promise<EncounterDto[]>;
  getEncounterById(tenantId: string, encounterId: string): Promise<EncounterDto | null>;
  createEncounter(req: CreateEncounterRequest): Promise<EncounterDto>;
  checkInEncounter(req: CheckInEncounterRequest): Promise<EncounterDto>;
  assignDoctor(req: AssignDoctorRequest): Promise<EncounterDto>;
  changeEncounterStatus(req: ChangeEncounterStatusRequest): Promise<EncounterDto>;
  cancelEncounter(req: CancelEncounterRequest): Promise<EncounterDto>;
  referEncounter(req: ReferEncounterRequest): Promise<EncounterReferralDto>;
  reassignEncounter(req: ReassignEncounterRequest): Promise<EncounterDto>;
  getQueue(tenantId: string, organizationId?: string, branchId?: string, departmentId?: string, doctorId?: string): Promise<EncounterQueueDto[]>;
  callNextPatient(tenantId: string, encounterId: string, actorId: string, actorRole: string, reason: string): Promise<EncounterDto>;
  getReferrals(tenantId: string, organizationId?: string): Promise<EncounterReferralDto[]>;
  getAuditTraces(req: QueryEncounterAuditRequest): Promise<EncounterAuditTraceDto[]>;
}

export class EncounterService implements IEncounterService {
  private encounters: EncounterDto[] = loadStored("docsearch_encounters", MOCK_ENCOUNTERS);
  private queues: EncounterQueueDto[] = [...MOCK_ENCOUNTER_QUEUES];
  private referrals: EncounterReferralDto[] = [...MOCK_ENCOUNTER_REFERRALS];
  private auditTraces: EncounterAuditTraceDto[] = [...MOCK_ENCOUNTER_AUDIT_TRACES];
  private nextEncounterCounter = 6;
  private nextQueueTokenCounter = 4;

  private generateEncounterNumber(): string {
    const padded = String(this.nextEncounterCounter++).padStart(6, '0');
    return `ENC-ORG001-${padded}`;
  }

  private generateQueueToken(): string {
    const padded = String(this.nextQueueTokenCounter++).padStart(3, '0');
    return `Q-${padded}`;
  }

  private addAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string,
    branchId: string | undefined,
    encounterId: string | undefined,
    patientId: string | undefined,
    actorId: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    targetEntityId: string,
    justification: string,
    operationStatus: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS'
  ) {
    const trace: EncounterAuditTraceDto = {
      id: crypto.randomUUID(),
      traceId: `enc-tr-${Math.floor(4000 + Math.random() * 6000)}`,
      tenantId,
      partnerId,
      organizationId,
      branchId,
      encounterId,
      patientId,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetEntityId,
      justification,
      operationStatus,
      correlationId: `corr-enc-${Date.now()}`,
      metadata: {},
      occurredAt: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverview(
    tenantId: string,
    partnerId?: string,
    organizationId?: string,
    branchId?: string
  ): Promise<EncounterOverviewDto> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }

    const filtered = this.encounters.filter((e) => {
      if (partnerId && e.partnerId !== partnerId) return false;
      if (organizationId && e.organizationId !== organizationId) return false;
      if (branchId && e.branchId !== branchId) return false;
      return true;
    });

    return {
      ...MOCK_ENCOUNTER_OVERVIEW,
      totalEncountersTodayCount: filtered.length,
      waitingQueueCount: filtered.filter((e) => e.status === 'WAITING' || e.status === 'CHECKED_IN').length,
      inConsultationCount: filtered.filter((e) => e.status === 'IN_CONSULTATION').length,
      completedTodayCount: filtered.filter((e) => e.status === 'COMPLETED').length,
      emergencyEncountersCount: filtered.filter((e) => e.priority === 'EMERGENCY').length,
      telehealthEncountersCount: filtered.filter((e) => e.consultationMode === 'TELEHEALTH').length,
      cancelledCount: filtered.filter((e) => e.status === 'CANCELLED').length
    };
  }

  async searchEncounters(req: SearchEncounterRequest): Promise<EncounterDto[]> {
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${req.tenantId}`);
    }

    return this.encounters.filter((e) => {
      if (e.tenantId !== req.tenantId) return false;
      if (req.partnerId && e.partnerId !== req.partnerId) return false;
      if (req.organizationId && e.organizationId !== req.organizationId) return false;
      if (req.branchId && e.branchId !== req.branchId) return false;
      if (req.departmentId && e.departmentId !== req.departmentId) return false;
      if (req.doctorId && e.doctorId !== req.doctorId) return false;
      if (req.patientId && e.patientId !== req.patientId) return false;
      if (req.status && e.status !== req.status) return false;
      if (req.encounterType && e.encounterType !== req.encounterType) return false;
      if (req.priority && e.priority !== req.priority) return false;
      if (req.consultationMode && e.consultationMode !== req.consultationMode) return false;
      if (req.encounterNumber && !e.encounterNumber.toLowerCase().includes(req.encounterNumber.toLowerCase())) return false;

      if (req.query) {
        const q = req.query.toLowerCase().trim();
        const match =
          e.encounterNumber.toLowerCase().includes(q) ||
          e.patientName.toLowerCase().includes(q) ||
          e.patientMrn.toLowerCase().includes(q) ||
          (e.doctorName && e.doctorName.toLowerCase().includes(q)) ||
          e.chiefComplaint.toLowerCase().includes(q) ||
          (e.tokenNumber && e.tokenNumber.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }

  async getEncounterById(tenantId: string, encounterId: string): Promise<EncounterDto | null> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }
    return this.encounters.find((e) => e.id === encounterId) ?? null;
  }

  async createEncounter(req: CreateEncounterRequest): Promise<EncounterDto> {
    try {
      const res = await apiRequest<EncounterDto>('/api/v1/partner/encounters', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.encounters.unshift(res.data);
        return res.data;
      }
    } catch {
      // Fallback
    }
    saveStored('docsearch_encounters', this.encounters);
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Cannot create encounter in foreign tenant ${req.tenantId}`);
    }

    const patient = await patientRegistrationService.getPatientById(req.tenantId, req.patientId);
    if (!patient) {
      throw new Error(`Patient ${req.patientId} not found in Master Patient Index.`);
    }

    let doctorName: string | undefined = undefined;
    let doctorSpecialty: string | undefined = undefined;
    if (req.doctorId) {
      const doc = await doctorRosterService.getDoctorById(req.tenantId, req.doctorId);
      if (doc) {
        doctorName = doc.fullName;
        doctorSpecialty = doc.primarySpecialty;
      }
    }

    const depts = await staffAdministrationService.getDepartments(req.tenantId, req.organizationId);
    const dept = depts.find((d) => d.id === req.departmentId);

    const encounterId = crypto.randomUUID();
    const encounterNumber = this.generateEncounterNumber();
    const tokenNumber = req.autoCheckIn ? this.generateQueueToken() : undefined;

    let queueItem: EncounterQueueDto | undefined = undefined;
    if (req.autoCheckIn && tokenNumber) {
      queueItem = {
        id: crypto.randomUUID(),
        tenantId: req.tenantId,
        partnerId: req.partnerId,
        organizationId: req.organizationId,
        branchId: req.branchId,
        departmentId: req.departmentId,
        departmentName: dept?.departmentName,
        doctorId: req.doctorId,
        doctorName,
        encounterId,
        tokenNumber,
        queueDate: new Date().toISOString().split('T')[0] ?? '2026-08-29',
        queueStatus: 'WAITING',
        estimatedWaitMinutes: 15,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.queues.unshift(queueItem);
    }

    const newEncounter: EncounterDto = {
      id: encounterId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      organizationName: 'Apex Multi-Specialty Clinics',
      branchId: req.branchId,
      branchName: 'Apex Care Center',
      departmentId: req.departmentId,
      departmentName: dept?.departmentName ?? 'General Department',
      patientId: req.patientId,
      patientName: patient.fullName,
      patientMrn: patient.mrn,
      patientDob: patient.dateOfBirth,
      patientGender: patient.gender,
      patientMobile: patient.primaryContact?.primaryMobile,
      doctorId: req.doctorId,
      doctorName,
      doctorSpecialty,
      opdSlotId: req.opdSlotId,
      encounterNumber,
      encounterType: req.encounterType ?? 'OPD',
      status: req.autoCheckIn ? 'CHECKED_IN' : 'REGISTERED',
      priority: req.priority ?? 'ROUTINE',
      consultationMode: req.consultationMode ?? 'IN_PERSON',
      chiefComplaint: req.chiefComplaint,
      visitReason: req.visitReason,
      triageNotes: req.triageNotes,
      referralSource: req.referralSource,
      tokenNumber,
      queueItem,
      referrals: [],
      registeredAt: new Date().toISOString(),
      checkedInAt: req.autoCheckIn ? new Date().toISOString() : undefined,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.encounters.unshift(newEncounter);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      newEncounter.id,
      patient.id,
      req.actorId,
      req.actorRole,
      'ENCOUNTER_CREATED',
      'encounters',
      newEncounter.encounterNumber,
      req.reason
    );

    return newEncounter;
  }

  async checkInEncounter(req: CheckInEncounterRequest): Promise<EncounterDto> {
    const enc = this.encounters.find((e) => e.id === req.encounterId && e.tenantId === req.tenantId);
    if (!enc) {
      throw new Error(`Encounter ${req.encounterId} not found.`);
    }

    if (enc.status !== 'REGISTERED') {
      throw new Error(`Cannot check in encounter in status '${enc.status}'. Valid source status is 'REGISTERED'.`);
    }

    const tokenNumber = this.generateQueueToken();
    enc.status = 'WAITING';
    enc.checkedInAt = new Date().toISOString();
    enc.tokenNumber = tokenNumber;
    if (req.triageNotes) {
      enc.triageNotes = req.triageNotes;
    }
    enc.updatedAt = new Date().toISOString();

    const queueItem: EncounterQueueDto = {
      id: crypto.randomUUID(),
      tenantId: enc.tenantId,
      partnerId: enc.partnerId,
      organizationId: enc.organizationId,
      branchId: enc.branchId,
      departmentId: enc.departmentId,
      departmentName: enc.departmentName,
      doctorId: enc.doctorId,
      doctorName: enc.doctorName,
      encounterId: enc.id,
      tokenNumber,
      queueDate: new Date().toISOString().split('T')[0] ?? '2026-08-29',
      queueStatus: 'WAITING',
      estimatedWaitMinutes: 15,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.queues.unshift(queueItem);
    enc.queueItem = queueItem;

    this.addAudit(
      req.tenantId,
      enc.partnerId,
      enc.organizationId,
      enc.branchId,
      enc.id,
      enc.patientId,
      req.actorId,
      req.actorRole,
      'PATIENT_CHECKED_IN',
      'encounters',
      `${enc.encounterNumber} (Token: ${tokenNumber})`,
      req.reason
    );

    return { ...enc };
  }

  async assignDoctor(req: AssignDoctorRequest): Promise<EncounterDto> {
    const enc = this.encounters.find((e) => e.id === req.encounterId && e.tenantId === req.tenantId);
    if (!enc) {
      throw new Error(`Encounter ${req.encounterId} not found.`);
    }

    const doc = await doctorRosterService.getDoctorById(req.tenantId, req.doctorId);
    if (!doc) {
      throw new Error(`Doctor profile ${req.doctorId} not found.`);
    }

    enc.doctorId = doc.id;
    enc.doctorName = doc.fullName;
    enc.doctorSpecialty = doc.primarySpecialty;
    enc.updatedAt = new Date().toISOString();

    if (enc.queueItem) {
      enc.queueItem.doctorId = doc.id;
      enc.queueItem.doctorName = doc.fullName;
    }

    this.addAudit(
      req.tenantId,
      enc.partnerId,
      enc.organizationId,
      enc.branchId,
      enc.id,
      enc.patientId,
      req.actorId,
      req.actorRole,
      'DOCTOR_ASSIGNED',
      'encounters',
      `${enc.encounterNumber} -> ${doc.fullName}`,
      req.reason
    );

    return { ...enc };
  }

  async changeEncounterStatus(req: ChangeEncounterStatusRequest): Promise<EncounterDto> {
    const enc = this.encounters.find((e) => e.id === req.encounterId && e.tenantId === req.tenantId);
    if (!enc) {
      throw new Error(`Encounter ${req.encounterId} not found.`);
    }

    const prevStatus = enc.status;
    enc.status = req.newStatus;
    enc.updatedAt = new Date().toISOString();

    if (req.newStatus === 'IN_CONSULTATION') {
      enc.consultationStartedAt = new Date().toISOString();
      if (enc.queueItem) enc.queueItem.queueStatus = 'IN_PROGRESS';
    } else if (req.newStatus === 'COMPLETED') {
      enc.completedAt = new Date().toISOString();
      if (enc.queueItem) enc.queueItem.queueStatus = 'SERVED';
    }

    this.addAudit(
      req.tenantId,
      enc.partnerId,
      enc.organizationId,
      enc.branchId,
      enc.id,
      enc.patientId,
      req.actorId,
      req.actorRole,
      `STATUS_CHANGED_${prevStatus}_TO_${req.newStatus}`,
      'encounters',
      enc.encounterNumber,
      req.reason
    );

    return { ...enc };
  }

  async cancelEncounter(req: CancelEncounterRequest): Promise<EncounterDto> {
    const enc = this.encounters.find((e) => e.id === req.encounterId && e.tenantId === req.tenantId);
    if (!enc) {
      throw new Error(`Encounter ${req.encounterId} not found.`);
    }

    enc.status = 'CANCELLED';
    enc.cancelledAt = new Date().toISOString();
    enc.cancellationReason = req.cancellationReason;
    enc.updatedAt = new Date().toISOString();

    if (enc.queueItem) {
      enc.queueItem.queueStatus = 'CANCELLED';
    }

    this.addAudit(
      req.tenantId,
      enc.partnerId,
      enc.organizationId,
      enc.branchId,
      enc.id,
      enc.patientId,
      req.actorId,
      req.actorRole,
      'ENCOUNTER_CANCELLED',
      'encounters',
      enc.encounterNumber,
      req.reason
    );

    return { ...enc };
  }

  async referEncounter(req: ReferEncounterRequest): Promise<EncounterReferralDto> {
    const enc = this.encounters.find((e) => e.id === req.encounterId && e.tenantId === req.tenantId);
    if (!enc) {
      throw new Error(`Encounter ${req.encounterId} not found.`);
    }

    let destDeptName: string | undefined = undefined;
    if (req.destinationDepartmentId) {
      const depts = await staffAdministrationService.getDepartments(req.tenantId, enc.organizationId);
      const d = depts.find((dept) => dept.id === req.destinationDepartmentId);
      if (d) destDeptName = d.departmentName;
    }

    let destDocName: string | undefined = undefined;
    if (req.destinationDoctorId) {
      const doc = await doctorRosterService.getDoctorById(req.tenantId, req.destinationDoctorId);
      if (doc) destDocName = doc.fullName;
    }

    const referral: EncounterReferralDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      encounterId: enc.id,
      patientId: enc.patientId,
      patientName: enc.patientName,
      patientMrn: enc.patientMrn,
      referralType: req.referralType,
      referringDoctorId: enc.doctorId,
      referringDoctorName: enc.doctorName,
      destinationDepartmentId: req.destinationDepartmentId,
      destinationDepartmentName: destDeptName,
      destinationDoctorId: req.destinationDoctorId,
      destinationDoctorName: destDocName,
      destinationFacilityName: req.destinationFacilityName,
      clinicalSummary: req.clinicalSummary,
      urgency: req.urgency ?? 'ROUTINE',
      referralStatus: 'PENDING',
      referredAt: new Date().toISOString(),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.referrals.unshift(referral);
    enc.referrals.push(referral);
    enc.status = 'REFERRED';
    enc.updatedAt = new Date().toISOString();

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      enc.branchId,
      enc.id,
      enc.patientId,
      req.actorId,
      req.actorRole,
      'ENCOUNTER_REFERRED',
      'encounter_referrals',
      referral.id,
      req.reason
    );

    return referral;
  }

  async reassignEncounter(req: ReassignEncounterRequest): Promise<EncounterDto> {
    const enc = this.encounters.find((e) => e.id === req.encounterId && e.tenantId === req.tenantId);
    if (!enc) {
      throw new Error(`Encounter ${req.encounterId} not found.`);
    }

    const depts = await staffAdministrationService.getDepartments(req.tenantId, enc.organizationId);
    const targetDept = depts.find((d) => d.id === req.newDepartmentId);
    if (!targetDept) {
      throw new Error(`Target department ${req.newDepartmentId} not found.`);
    }

    enc.departmentId = targetDept.id;
    enc.departmentName = targetDept.departmentName;

    if (req.newDoctorId) {
      const doc = await doctorRosterService.getDoctorById(req.tenantId, req.newDoctorId);
      if (doc) {
        enc.doctorId = doc.id;
        enc.doctorName = doc.fullName;
        enc.doctorSpecialty = doc.primarySpecialty;
      }
    } else {
      enc.doctorId = undefined;
      enc.doctorName = undefined;
      enc.doctorSpecialty = undefined;
    }
    enc.updatedAt = new Date().toISOString();

    this.addAudit(
      req.tenantId,
      enc.partnerId,
      enc.organizationId,
      enc.branchId,
      enc.id,
      enc.patientId,
      req.actorId,
      req.actorRole,
      'ENCOUNTER_REASSIGNED',
      'encounters',
      `${enc.encounterNumber} -> ${targetDept.departmentName}`,
      req.reason
    );

    return { ...enc };
  }

  async getQueue(
    tenantId: string,
    organizationId?: string,
    branchId?: string,
    departmentId?: string,
    doctorId?: string
  ): Promise<EncounterQueueDto[]> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }

    return this.queues.filter((q) => {
      if (organizationId && q.organizationId !== organizationId) return false;
      if (branchId && q.branchId !== branchId) return false;
      if (departmentId && q.departmentId !== departmentId) return false;
      if (doctorId && q.doctorId !== doctorId) return false;
      return true;
    });
  }

  async callNextPatient(
    tenantId: string,
    encounterId: string,
    actorId: string,
    actorRole: string,
    reason: string
  ): Promise<EncounterDto> {
    const enc = this.encounters.find((e) => e.id === encounterId && e.tenantId === tenantId);
    if (!enc) {
      throw new Error(`Encounter ${encounterId} not found.`);
    }

    enc.status = 'IN_CONSULTATION';
    enc.consultationStartedAt = new Date().toISOString();
    enc.updatedAt = new Date().toISOString();

    if (enc.queueItem) {
      enc.queueItem.queueStatus = 'IN_PROGRESS';
      enc.queueItem.calledAt = new Date().toISOString();
    }

    this.addAudit(
      tenantId,
      enc.partnerId,
      enc.organizationId,
      enc.branchId,
      enc.id,
      enc.patientId,
      actorId,
      actorRole,
      'CALL_NEXT_PATIENT',
      'encounters',
      `${enc.encounterNumber} (Token: ${enc.tokenNumber ?? 'N/A'})`,
      reason
    );

    return { ...enc };
  }

  async getReferrals(tenantId: string, organizationId?: string): Promise<EncounterReferralDto[]> {
    if (tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${tenantId}`);
    }

    return this.referrals.filter((r) => {
      if (organizationId && r.organizationId !== organizationId) return false;
      return true;
    });
  }

  async getAuditTraces(req: QueryEncounterAuditRequest): Promise<EncounterAuditTraceDto[]> {
    if (req.tenantId !== MOCK_TENANT_ID) {
      throw new Error(`[Multi-Tenant Denial] Access denied to tenant ${req.tenantId}`);
    }

    return this.auditTraces.filter((t) => {
      if (t.tenantId !== req.tenantId) return false;
      if (req.partnerId && t.partnerId !== req.partnerId) return false;
      if (req.organizationId && t.organizationId !== req.organizationId) return false;
      if (req.encounterId && t.encounterId !== req.encounterId) return false;
      if (req.patientId && t.patientId !== req.patientId) return false;
      return true;
    });
  }
}

export const encounterService = new EncounterService();
