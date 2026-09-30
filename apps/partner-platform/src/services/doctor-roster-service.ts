import { apiRequest, isMockFallbackAllowed } from './api-client.js';
import type {
  DoctorProfileDto,
  DoctorSpecializationDto,
  DoctorScheduleDto,
  DoctorLeaveDto,
  OpdSlotDto,
  ConsultationFeeMatrixDto,
  DoctorOpdAuditTraceDto,
  DoctorRosterOverviewDto,
  CreateDoctorProfileRequest,
  UpdateDoctorProfileRequest,
  CreateDoctorSpecializationRequest,
  CreateDoctorScheduleRequest,
  UpdateDoctorScheduleRequest,
  AddDoctorLeaveRequest,
  ApproveDoctorLeaveRequest,
  BlockOpdSlotRequest,
  UnblockOpdSlotRequest,
  CreateConsultationFeeRequest,
  UpdateConsultationFeeRequest,
  AssignDoctorLocationRequest,
  QueryDoctorAuditRequest
} from '@docsearch/api-contracts';
import {
  MOCK_DOCTOR_PROFILES,
  MOCK_DOCTOR_SPECIALIZATIONS,
  MOCK_DOCTOR_SCHEDULES,
  MOCK_DOCTOR_LEAVES,
  MOCK_OPD_SLOTS,
  MOCK_CONSULTATION_FEES,
  MOCK_DOCTOR_OPD_AUDIT_TRACES,
  MOCK_DOCTOR_ROSTER_OVERVIEW
} from './mock-doctor-roster-data.js';

export interface IDoctorRosterService {
  getOverview(tenantId: string, partnerId?: string, organizationId?: string, branchId?: string): Promise<DoctorRosterOverviewDto>;
  getDoctors(tenantId: string, partnerId?: string, organizationId?: string, branchId?: string, departmentId?: string): Promise<DoctorProfileDto[]>;
  getDoctorById(tenantId: string, doctorId: string): Promise<DoctorProfileDto | null>;
  createDoctorProfile(req: CreateDoctorProfileRequest): Promise<DoctorProfileDto>;
  updateDoctorProfile(req: UpdateDoctorProfileRequest): Promise<DoctorProfileDto>;
  getSpecializations(tenantId: string, organizationId?: string): Promise<DoctorSpecializationDto[]>;
  createSpecialization(req: CreateDoctorSpecializationRequest): Promise<DoctorSpecializationDto>;
  getSchedules(tenantId: string, doctorId?: string, branchId?: string, dayOfWeek?: string): Promise<DoctorScheduleDto[]>;
  createSchedule(req: CreateDoctorScheduleRequest): Promise<DoctorScheduleDto>;
  updateSchedule(req: UpdateDoctorScheduleRequest): Promise<DoctorScheduleDto>;
  getLeaves(tenantId: string, doctorId?: string): Promise<DoctorLeaveDto[]>;
  addLeave(req: AddDoctorLeaveRequest): Promise<DoctorLeaveDto>;
  approveLeave(req: ApproveDoctorLeaveRequest): Promise<DoctorLeaveDto>;
  getOpdSlots(tenantId: string, doctorId?: string, branchId?: string, slotDate?: string): Promise<OpdSlotDto[]>;
  blockOpdSlot(req: BlockOpdSlotRequest): Promise<OpdSlotDto>;
  unblockOpdSlot(req: UnblockOpdSlotRequest): Promise<OpdSlotDto>;
  getConsultationFees(tenantId: string, organizationId?: string, branchId?: string, specialtyCode?: string, doctorId?: string): Promise<ConsultationFeeMatrixDto[]>;
  createConsultationFee(req: CreateConsultationFeeRequest): Promise<ConsultationFeeMatrixDto>;
  updateConsultationFee(req: UpdateConsultationFeeRequest): Promise<ConsultationFeeMatrixDto>;
  assignDoctorLocation(req: AssignDoctorLocationRequest): Promise<DoctorProfileDto>;
  getAuditTraces(req: QueryDoctorAuditRequest): Promise<DoctorOpdAuditTraceDto[]>;
}

function loadStored<T>(key: string, fallback: T[]): T[] {
  if (!isMockFallbackAllowed()) {
    return [];
  }
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
  if (!isMockFallbackAllowed()) {
    return;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }
}

export class DoctorRosterService implements IDoctorRosterService {
  private doctors: DoctorProfileDto[] = loadStored('docsearch_doctor_profiles', MOCK_DOCTOR_PROFILES);
  private specializations: DoctorSpecializationDto[] = loadStored('docsearch_doctor_specializations', MOCK_DOCTOR_SPECIALIZATIONS);
  private schedules: DoctorScheduleDto[] = loadStored('docsearch_doctor_schedules', MOCK_DOCTOR_SCHEDULES);
  private leaves: DoctorLeaveDto[] = loadStored('docsearch_doctor_leaves', MOCK_DOCTOR_LEAVES);
  private slots: OpdSlotDto[] = loadStored('docsearch_opd_slots', MOCK_OPD_SLOTS);
  private fees: ConsultationFeeMatrixDto[] = loadStored('docsearch_consultation_fees', MOCK_CONSULTATION_FEES);
  private auditTraces: DoctorOpdAuditTraceDto[] = isMockFallbackAllowed() ? [...MOCK_DOCTOR_OPD_AUDIT_TRACES] : [];

  private addAudit(
    tenantId: string,
    partnerId: string,
    organizationId: string | undefined,
    branchId: string | undefined,
    doctorId: string | undefined,
    actorId: string,
    actorRole: string,
    action: string,
    targetEntity: string,
    targetEntityId: string,
    justification: string,
    operationStatus: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS'
  ) {
    const trace: DoctorOpdAuditTraceDto = {
      id: crypto.randomUUID(),
      traceId: `doc-tr-${Math.floor(2000 + Math.random() * 8000)}`,
      tenantId,
      partnerId,
      organizationId,
      branchId,
      doctorId,
      actorId,
      actorRole,
      action,
      targetEntity,
      targetEntityId,
      justification,
      operationStatus,
      correlationId: `corr-doc-${Date.now()}`,
      metadata: {},
      occurredAt: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverview(
    _tenantId: string,
    partnerId?: string,
    organizationId?: string,
    branchId?: string
  ): Promise<DoctorRosterOverviewDto> {
    const filteredDocs = this.doctors.filter((d) => {
      if (partnerId && d.partnerId !== partnerId) return false;
      if (organizationId && d.organizationId !== organizationId) return false;
      if (branchId && d.branchId !== branchId) return false;
      return true;
    });

    const filteredSlots = this.slots.filter((s) => {
      if (partnerId && s.partnerId !== partnerId) return false;
      if (organizationId && s.organizationId !== organizationId) return false;
      if (branchId && s.branchId !== branchId) return false;
      return true;
    });

    return {
      ...MOCK_DOCTOR_ROSTER_OVERVIEW,
      totalDoctorsCount: filteredDocs.length,
      activeDoctorsCount: filteredDocs.filter((d) => d.status === 'ACTIVE').length,
      doctorsOnDutyTodayCount: filteredDocs.filter((d) => d.availabilityStatus === 'AVAILABLE').length,
      doctorsOnLeaveCount: filteredDocs.filter((d) => d.availabilityStatus === 'ON_LEAVE').length,
      totalWeeklySchedulesCount: this.schedules.length,
      todaySlotsCount: filteredSlots.length,
      todayBookedSlotsCount: filteredSlots.filter((s) => s.bookingStatus === 'BOOKED').length,
      todayBlockedSlotsCount: filteredSlots.filter((s) => s.bookingStatus === 'BLOCKED').length,
      todayAvailableSlotsCount: filteredSlots.filter((s) => s.bookingStatus === 'AVAILABLE').length,
      pendingLeaveRequestsCount: this.leaves.filter((l) => l.approvalStatus === 'PENDING').length
    };
  }

  async getDoctors(
    tenantId: string,
    partnerId?: string,
    organizationId?: string,
    branchId?: string,
    departmentId?: string
  ): Promise<DoctorProfileDto[]> {
    try {
      const params = new URLSearchParams();
      if (partnerId) params.append('partnerId', partnerId);
      if (organizationId) params.append('organizationId', organizationId);
      if (branchId) params.append('branchId', branchId);
      if (departmentId) params.append('departmentId', departmentId);
      params.append('staffType', 'DOCTOR');
      const res = await apiRequest<any[]>(`/api/v1/partner/staff/members?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        return res.data.map((s) => {
          const existing = this.doctors.find((d) => d.staffId === s.id || d.id === s.id);
          if (existing) return existing;
          return {
            id: s.id,
            tenantId: s.tenantId || tenantId,
            partnerId: s.partnerId || partnerId || '22222222-2222-4222-8222-222222222201',
            organizationId: s.organizationId || organizationId || '44444444-4444-4444-8444-444444444401',
            branchId: s.branchId || branchId || '88888888-1111-4888-8888-111111111101',
            departmentId: s.departmentId || departmentId || '71111111-1111-4111-8111-111111111101',
            staffId: s.id,
            fullName: s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Dr. Physician',
            workEmail: s.workEmail || `${s.staffCode || s.id}@docsearch.health`,
            doctorCode: s.staffCode || 'DOC-001',
            medicalLicenseNumber: s.medicalLicenseNumber || 'MCI-DEFAULT',
            qualification: s.qualification || 'MBBS, MD',
            experienceYears: 10,
            primarySpecialty: s.specialty || 'General Medicine',
            subSpecialties: [],
            consultationModes: ['IN_PERSON', 'TELEHEALTH'],
            telehealthEligible: true,
            bioSummary: 'Consultant Doctor',
            availabilityStatus: 'AVAILABLE',
            status: 'ACTIVE',
            metadata: {},
            createdAt: s.createdAt || new Date().toISOString(),
            updatedAt: s.updatedAt || new Date().toISOString()
          };
        });
      }
      if (!isMockFallbackAllowed()) {
        return [];
      }
    } catch (error) {
      if (!isMockFallbackAllowed()) {
        throw error;
      }
    }
    if (!isMockFallbackAllowed()) {
      return [];
    }
    return this.doctors.filter((d) => {
      if (partnerId && d.partnerId !== partnerId) return false;
      if (organizationId && d.organizationId !== organizationId) return false;
      if (branchId && d.branchId !== branchId) return false;
      if (departmentId && d.departmentId !== departmentId) return false;
      return true;
    });
  }

  async getDoctorById(_tenantId: string, doctorId: string): Promise<DoctorProfileDto | null> {
    return this.doctors.find((d) => d.id === doctorId) ?? null;
  }

  async createDoctorProfile(req: CreateDoctorProfileRequest): Promise<DoctorProfileDto> {

    const existingDoctor = this.doctors.find((d) => d.staffId === req.staffId);
    if (existingDoctor) {
      throw new Error(`[Doctor Profile Collision] Doctor profile already exists for staff member ${req.staffId}.`);
    }

    const doc: DoctorProfileDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      departmentId: req.departmentId,
      staffId: req.staffId,
      fullName: `Doctor Profile ${req.doctorCode}`,
      workEmail: `${req.doctorCode.toLowerCase()}@docsearch.docsearch.health`,
      doctorCode: req.doctorCode,
      medicalLicenseNumber: req.medicalLicenseNumber,
      qualification: req.qualification,
      experienceYears: req.experienceYears,
      primarySpecialty: req.primarySpecialty,
      subSpecialties: req.subSpecialties,
      consultationModes: req.consultationModes,
      telehealthEligible: req.telehealthEligible,
      bioSummary: req.bioSummary,
      availabilityStatus: 'AVAILABLE',
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.doctors.push(doc);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      doc.id,
      req.actorId,
      req.actorRole,
      'DOCTOR_PROFILE_CREATED',
      'doctor_profiles',
      doc.doctorCode,
      req.reason
    );
    return doc;
  }

  async updateDoctorProfile(req: UpdateDoctorProfileRequest): Promise<DoctorProfileDto> {
    const doc = this.doctors.find((d) => d.id === req.doctorId && d.tenantId === req.tenantId);
    if (!doc) {
      throw new Error(`Doctor profile ${req.doctorId} not found.`);
    }

    if (req.qualification) doc.qualification = req.qualification;
    if (req.experienceYears !== undefined) doc.experienceYears = req.experienceYears;
    if (req.primarySpecialty) doc.primarySpecialty = req.primarySpecialty;
    if (req.subSpecialties) doc.subSpecialties = req.subSpecialties;
    if (req.consultationModes) doc.consultationModes = req.consultationModes;
    if (req.telehealthEligible !== undefined) doc.telehealthEligible = req.telehealthEligible;
    if (req.bioSummary !== undefined) doc.bioSummary = req.bioSummary;
    if (req.availabilityStatus) doc.availabilityStatus = req.availabilityStatus;
    if (req.status) doc.status = req.status;
    doc.updatedAt = new Date().toISOString();

    this.addAudit(
      req.tenantId,
      doc.partnerId,
      doc.organizationId,
      doc.branchId,
      doc.id,
      req.actorId,
      req.actorRole,
      'DOCTOR_PROFILE_UPDATED',
      'doctor_profiles',
      doc.doctorCode,
      req.reason
    );
    return { ...doc };
  }

  async getSpecializations(_tenantId: string, organizationId?: string): Promise<DoctorSpecializationDto[]> {
    return this.specializations.filter((s) => {
      if (organizationId && s.organizationId !== organizationId) return false;
      return true;
    });
  }

  async createSpecialization(req: CreateDoctorSpecializationRequest): Promise<DoctorSpecializationDto> {
    const spec: DoctorSpecializationDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      departmentId: req.departmentId,
      specialtyCode: req.specialtyCode,
      specialtyName: req.specialtyName,
      isSurgical: req.isSurgical,
      opdConfig: {
        defaultSlotDuration: req.defaultSlotDuration,
        maxDailyPatients: req.maxDailyPatients
      },
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.specializations.push(spec);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      undefined,
      undefined,
      req.actorId,
      req.actorRole,
      'SPECIALIZATION_CREATED',
      'doctor_specializations',
      spec.specialtyCode,
      req.reason
    );
    return spec;
  }

  async getSchedules(
    _tenantId: string,
    doctorId?: string,
    branchId?: string,
    dayOfWeek?: string
  ): Promise<DoctorScheduleDto[]> {
    try {
      const params = new URLSearchParams();
      if (doctorId) params.set('doctorId', doctorId);
      if (branchId) params.set('branchId', branchId);
      if (dayOfWeek) params.set('dayOfWeek', dayOfWeek);
      const res = await apiRequest<DoctorScheduleDto[]>(`/api/v1/partner/roster/schedules?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        for (const remote of res.data) {
          const idx = this.schedules.findIndex((s) => s.id === remote.id);
          if (idx >= 0) this.schedules[idx] = remote;
          else this.schedules.push(remote);
        }
        saveStored('docsearch_doctor_schedules', this.schedules);
        return res.data;
      }
    } catch {
      // Fallback
    }

    return this.schedules.filter((s) => {
      if (doctorId && s.doctorId !== doctorId) return false;
      if (branchId && s.branchId !== branchId) return false;
      if (dayOfWeek && s.dayOfWeek !== dayOfWeek) return false;
      return true;
    });
  }

  async createSchedule(req: CreateDoctorScheduleRequest): Promise<DoctorScheduleDto> {
    try {
      const res = await apiRequest<DoctorScheduleDto>('/api/v1/partner/roster/schedules', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.schedules.unshift(res.data);
        saveStored('docsearch_doctor_schedules', this.schedules);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const doc = this.doctors.find((d) => d.id === req.doctorId);
    if (!doc) {
      throw new Error(`Doctor ${req.doctorId} not found.`);
    }

    const sched: DoctorScheduleDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      branchName: doc.branchName,
      doctorId: req.doctorId,
      doctorName: doc.fullName,
      dayOfWeek: req.dayOfWeek,
      shiftName: req.shiftName,
      startTime: req.startTime,
      endTime: req.endTime,
      slotDurationMinutes: req.slotDurationMinutes,
      maxPatientsPerSlot: req.maxPatientsPerSlot,
      bufferTimeMinutes: req.bufferTimeMinutes,
      consultationMode: req.consultationMode,
      roomNumber: req.roomNumber,
      isActive: true,
      breaks: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.schedules.push(sched);
    saveStored('docsearch_doctor_schedules', this.schedules);

    // Auto-generate next session slots for demonstration
    const slot: OpdSlotDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      branchName: doc.branchName,
      doctorId: req.doctorId,
      doctorName: doc.fullName,
      scheduleId: sched.id,
      slotDate: '2026-03-02',
      startTime: req.startTime,
      endTime: `${req.startTime.split(':')[0]}:30`,
      consultationMode: req.consultationMode,
      bookingStatus: 'AVAILABLE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.slots.push(slot);
    saveStored('docsearch_opd_slots', this.slots);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      doc.id,
      req.actorId,
      req.actorRole,
      'SCHEDULE_CREATED',
      'doctor_schedules',
      `${doc.doctorCode}-${req.dayOfWeek}`,
      req.reason
    );
    return sched;
  }

  async updateSchedule(req: UpdateDoctorScheduleRequest): Promise<DoctorScheduleDto> {
    try {
      const res = await apiRequest<DoctorScheduleDto>(`/api/v1/partner/roster/schedules/${encodeURIComponent(req.scheduleId)}`, {
        method: 'PUT',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.schedules.findIndex((s) => s.id === req.scheduleId);
        if (idx >= 0) this.schedules[idx] = res.data;
        saveStored('docsearch_doctor_schedules', this.schedules);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const s = this.schedules.find((item) => item.id === req.scheduleId && item.tenantId === req.tenantId);
    if (!s) {
      throw new Error(`Schedule ${req.scheduleId} not found.`);
    }

    if (req.startTime) s.startTime = req.startTime;
    if (req.endTime) s.endTime = req.endTime;
    if (req.slotDurationMinutes) s.slotDurationMinutes = req.slotDurationMinutes;
    if (req.maxPatientsPerSlot) s.maxPatientsPerSlot = req.maxPatientsPerSlot;
    if (req.roomNumber !== undefined) s.roomNumber = req.roomNumber;
    if (req.isActive !== undefined) s.isActive = req.isActive;
    s.updatedAt = new Date().toISOString();
    saveStored('docsearch_doctor_schedules', this.schedules);

    this.addAudit(
      req.tenantId,
      s.partnerId,
      s.organizationId,
      s.branchId,
      s.doctorId,
      req.actorId,
      req.actorRole,
      'SCHEDULE_UPDATED',
      'doctor_schedules',
      s.shiftName,
      req.reason
    );
    return { ...s };
  }

  async getLeaves(_tenantId: string, doctorId?: string): Promise<DoctorLeaveDto[]> {
    try {
      const params = new URLSearchParams();
      if (doctorId) params.set('doctorId', doctorId);
      const res = await apiRequest<DoctorLeaveDto[]>(`/api/v1/partner/roster/leaves?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        for (const remote of res.data) {
          const idx = this.leaves.findIndex((l) => l.id === remote.id);
          if (idx >= 0) this.leaves[idx] = remote;
          else this.leaves.push(remote);
        }
        saveStored('docsearch_doctor_leaves', this.leaves);
        return res.data;
      }
    } catch {
      // Fallback
    }

    if (doctorId) {
      return this.leaves.filter((l) => l.doctorId === doctorId);
    }
    return [...this.leaves];
  }

  async addLeave(req: AddDoctorLeaveRequest): Promise<DoctorLeaveDto> {
    try {
      const res = await apiRequest<DoctorLeaveDto>('/api/v1/partner/roster/leaves', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.leaves.unshift(res.data);
        saveStored('docsearch_doctor_leaves', this.leaves);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const doc = this.doctors.find((d) => d.id === req.doctorId && d.tenantId === req.tenantId);
    if (!doc) {
      throw new Error(`Doctor ${req.doctorId} not found.`);
    }

    // Auto-detect affected slots during the leave window
    const affectedSlots = this.slots.filter((s) => s.doctorId === req.doctorId);
    const affectedCount = affectedSlots.length > 0 ? affectedSlots.length : 12;

    const leave: DoctorLeaveDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId ?? doc.branchId,
      doctorId: req.doctorId,
      doctorName: doc.fullName,
      leaveType: req.leaveType,
      startDate: req.startDate,
      endDate: req.endDate,
      reason: req.reason,
      approvalStatus: 'APPROVED',
      approvedBy: req.actorId,
      affectedSlotsCount: affectedCount,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.leaves.push(leave);
    saveStored('docsearch_doctor_leaves', this.leaves);
    doc.availabilityStatus = 'ON_LEAVE';

    // Mark affected slots with leave conflict
    this.slots.forEach((s) => {
      if (s.doctorId === req.doctorId && s.bookingStatus === 'AVAILABLE') {
        s.bookingStatus = 'LEAVE_CONFLICT';
        s.blockReason = `Doctor on approved leave: ${req.reason}`;
      }
    });
    saveStored('docsearch_opd_slots', this.slots);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      doc.branchId,
      doc.id,
      req.actorId,
      req.actorRole,
      'LEAVE_REQUESTED_AND_APPROVED',
      'doctor_leaves',
      doc.doctorCode,
      req.reason
    );
    return leave;
  }

  async approveLeave(req: ApproveDoctorLeaveRequest): Promise<DoctorLeaveDto> {
    try {
      const res = await apiRequest<DoctorLeaveDto>(`/api/v1/partner/roster/leaves/${encodeURIComponent(req.leaveId)}/approve`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.leaves.findIndex((l) => l.id === req.leaveId);
        if (idx >= 0) this.leaves[idx] = res.data;
        saveStored('docsearch_doctor_leaves', this.leaves);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const leave = this.leaves.find((l) => l.id === req.leaveId && l.tenantId === req.tenantId);
    if (!leave) {
      throw new Error(`Leave record ${req.leaveId} not found.`);
    }

    leave.approvalStatus = req.approvalStatus;
    leave.approvedBy = req.actorId;
    leave.updatedAt = new Date().toISOString();
    saveStored('docsearch_doctor_leaves', this.leaves);

    const doc = this.doctors.find((d) => d.id === leave.doctorId);
    if (doc && req.approvalStatus === 'APPROVED') {
      doc.availabilityStatus = 'ON_LEAVE';
    }

    this.addAudit(
      req.tenantId,
      req.partnerId,
      leave.organizationId,
      leave.branchId,
      leave.doctorId,
      req.actorId,
      req.actorRole,
      `LEAVE_${req.approvalStatus}`,
      'doctor_leaves',
      leave.id,
      req.reason
    );
    return { ...leave };
  }

  async getOpdSlots(
    _tenantId: string,
    doctorId?: string,
    branchId?: string,
    slotDate?: string
  ): Promise<OpdSlotDto[]> {
    try {
      const params = new URLSearchParams();
      if (doctorId) params.set('doctorId', doctorId);
      if (branchId) params.set('branchId', branchId);
      if (slotDate) params.set('slotDate', slotDate);
      const res = await apiRequest<OpdSlotDto[]>(`/api/v1/partner/roster/slots?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        for (const remote of res.data) {
          const idx = this.slots.findIndex((s) => s.id === remote.id);
          if (idx >= 0) this.slots[idx] = remote;
          else this.slots.push(remote);
        }
        saveStored('docsearch_opd_slots', this.slots);
        return res.data;
      }
    } catch {
      // Fallback
    }

    return this.slots.filter((s) => {
      if (doctorId && s.doctorId !== doctorId) return false;
      if (branchId && s.branchId !== branchId) return false;
      if (slotDate && s.slotDate !== slotDate) return false;
      return true;
    });
  }

  async blockOpdSlot(req: BlockOpdSlotRequest): Promise<OpdSlotDto> {
    try {
      const res = await apiRequest<OpdSlotDto>(`/api/v1/partner/roster/slots/${encodeURIComponent(req.slotId)}/block`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.slots.findIndex((s) => s.id === req.slotId);
        if (idx >= 0) this.slots[idx] = res.data;
        saveStored('docsearch_opd_slots', this.slots);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const slot = this.slots.find((s) => s.id === req.slotId && s.tenantId === req.tenantId);
    if (!slot) {
      throw new Error(`OPD slot ${req.slotId} not found.`);
    }

    slot.bookingStatus = 'BLOCKED';
    slot.blockReason = req.blockReason;
    slot.updatedAt = new Date().toISOString();
    saveStored('docsearch_opd_slots', this.slots);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      slot.branchId,
      slot.doctorId,
      req.actorId,
      req.actorRole,
      'OPD_SLOT_BLOCKED',
      'opd_slots',
      `${slot.slotDate} ${slot.startTime}`,
      req.blockReason
    );
    return { ...slot };
  }

  async unblockOpdSlot(req: UnblockOpdSlotRequest): Promise<OpdSlotDto> {
    try {
      const res = await apiRequest<OpdSlotDto>(`/api/v1/partner/roster/slots/${encodeURIComponent(req.slotId)}/unblock`, {
        method: 'PATCH',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.slots.findIndex((s) => s.id === req.slotId);
        if (idx >= 0) this.slots[idx] = res.data;
        saveStored('docsearch_opd_slots', this.slots);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const slot = this.slots.find((s) => s.id === req.slotId && s.tenantId === req.tenantId);
    if (!slot) {
      throw new Error(`OPD slot ${req.slotId} not found.`);
    }

    slot.bookingStatus = 'AVAILABLE';
    delete slot.blockReason;
    slot.updatedAt = new Date().toISOString();
    saveStored('docsearch_opd_slots', this.slots);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      slot.branchId,
      slot.doctorId,
      req.actorId,
      req.actorRole,
      'OPD_SLOT_UNBLOCKED',
      'opd_slots',
      `${slot.slotDate} ${slot.startTime}`,
      req.reason
    );
    return { ...slot };
  }

  async getConsultationFees(
    _tenantId: string,
    organizationId?: string,
    branchId?: string,
    specialtyCode?: string,
    doctorId?: string
  ): Promise<ConsultationFeeMatrixDto[]> {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set('organizationId', organizationId);
      if (branchId) params.set('branchId', branchId);
      if (specialtyCode) params.set('specialtyCode', specialtyCode);
      if (doctorId) params.set('doctorId', doctorId);
      const res = await apiRequest<ConsultationFeeMatrixDto[]>(`/api/v1/partner/roster/fees?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        for (const remote of res.data) {
          const idx = this.fees.findIndex((f) => f.id === remote.id);
          if (idx >= 0) this.fees[idx] = remote;
          else this.fees.push(remote);
        }
        saveStored('docsearch_consultation_fees', this.fees);
        return res.data;
      }
    } catch {
      // Fallback
    }

    return this.fees.filter((f) => {
      if (organizationId && f.organizationId !== organizationId) return false;
      if (branchId && f.branchId && f.branchId !== branchId) return false;
      if (specialtyCode && f.specialtyCode && f.specialtyCode !== specialtyCode) return false;
      if (doctorId && f.doctorId && f.doctorId !== doctorId) return false;
      return true;
    });
  }

  async createConsultationFee(req: CreateConsultationFeeRequest): Promise<ConsultationFeeMatrixDto> {
    try {
      const res = await apiRequest<ConsultationFeeMatrixDto>('/api/v1/partner/roster/fees', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        this.fees.unshift(res.data);
        saveStored('docsearch_consultation_fees', this.fees);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const fee: ConsultationFeeMatrixDto = {
      id: crypto.randomUUID(),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      doctorId: req.doctorId,
      specialtyCode: req.specialtyCode,
      consultationType: req.consultationType,
      currency: req.currency,
      baseFeeAmount: req.baseFeeAmount,
      followUpValidityDays: req.followUpValidityDays,
      effectiveDate: req.effectiveDate,
      expiryDate: req.expiryDate,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.fees.push(fee);
    saveStored('docsearch_consultation_fees', this.fees);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.organizationId,
      req.branchId,
      req.doctorId,
      req.actorId,
      req.actorRole,
      'CONSULTATION_FEE_CREATED',
      'consultation_fee_matrices',
      `${req.consultationType}-$${req.baseFeeAmount}`,
      req.reason
    );
    return fee;
  }

  async updateConsultationFee(req: UpdateConsultationFeeRequest): Promise<ConsultationFeeMatrixDto> {
    try {
      const res = await apiRequest<ConsultationFeeMatrixDto>(`/api/v1/partner/roster/fees/${encodeURIComponent(req.feeId)}`, {
        method: 'PUT',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        const idx = this.fees.findIndex((f) => f.id === req.feeId);
        if (idx >= 0) this.fees[idx] = res.data;
        saveStored('docsearch_consultation_fees', this.fees);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const fee = this.fees.find((f) => f.id === req.feeId && f.tenantId === req.tenantId);
    if (!fee) {
      throw new Error(`Consultation fee record ${req.feeId} not found.`);
    }

    if (req.baseFeeAmount !== undefined) fee.baseFeeAmount = req.baseFeeAmount;
    if (req.followUpValidityDays !== undefined) fee.followUpValidityDays = req.followUpValidityDays;
    if (req.status) fee.status = req.status;
    fee.updatedAt = new Date().toISOString();
    saveStored('docsearch_consultation_fees', this.fees);

    this.addAudit(
      req.tenantId,
      req.partnerId,
      fee.organizationId,
      fee.branchId,
      fee.doctorId,
      req.actorId,
      req.actorRole,
      'CONSULTATION_FEE_UPDATED',
      'consultation_fee_matrices',
      fee.id,
      req.reason
    );
    return { ...fee };
  }

  async assignDoctorLocation(req: AssignDoctorLocationRequest): Promise<DoctorProfileDto> {
    const doc = this.doctors.find((d) => d.id === req.doctorId && d.tenantId === req.tenantId);
    if (!doc) {
      throw new Error(`Doctor ${req.doctorId} not found.`);
    }

    doc.organizationId = req.toOrganizationId;
    doc.branchId = req.toBranchId;
    doc.departmentId = req.toDepartmentId;
    doc.updatedAt = new Date().toISOString();

    this.addAudit(
      req.tenantId,
      req.partnerId,
      req.toOrganizationId,
      req.toBranchId,
      doc.id,
      req.actorId,
      req.actorRole,
      'DOCTOR_LOCATION_REASSIGNED',
      'doctor_profiles',
      doc.doctorCode,
      req.reason
    );
    return { ...doc };
  }

  async getAuditTraces(req: QueryDoctorAuditRequest): Promise<DoctorOpdAuditTraceDto[]> {
    return this.auditTraces.filter((t) => {
      if (t.tenantId !== req.tenantId) return false;
      if (req.partnerId && t.partnerId !== req.partnerId) return false;
      if (req.organizationId && t.organizationId !== req.organizationId) return false;
      if (req.branchId && t.branchId !== req.branchId) return false;
      if (req.doctorId && t.doctorId !== req.doctorId) return false;
      return true;
    });
  }
}

export const doctorRosterService = new DoctorRosterService();
