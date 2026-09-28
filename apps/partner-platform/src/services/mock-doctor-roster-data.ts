import type {
  DoctorProfileDto,
  DoctorSpecializationDto,
  DoctorScheduleDto,
  DoctorLeaveDto,
  OpdSlotDto,
  ConsultationFeeMatrixDto,
  DoctorOpdAuditTraceDto,
  DoctorRosterOverviewDto
} from '@docsearch/api-contracts';



export const MOCK_DOCTOR_SPECIALIZATIONS: DoctorSpecializationDto[] = [];

export const MOCK_DOCTOR_PROFILES: DoctorProfileDto[] = [];

export const MOCK_DOCTOR_SCHEDULES: DoctorScheduleDto[] = [];

export const MOCK_DOCTOR_LEAVES: DoctorLeaveDto[] = [];

export const MOCK_OPD_SLOTS: OpdSlotDto[] = [];

export const MOCK_CONSULTATION_FEES: ConsultationFeeMatrixDto[] = [];

export const MOCK_DOCTOR_OPD_AUDIT_TRACES: DoctorOpdAuditTraceDto[] = [];

export const MOCK_DOCTOR_ROSTER_OVERVIEW: DoctorRosterOverviewDto = {
  totalDoctorsCount: 0,
  activeDoctorsCount: 0,
  doctorsOnDutyTodayCount: 0,
  doctorsOnLeaveCount: 0,
  totalWeeklySchedulesCount: 0,
  todaySlotsCount: 0,
  todayBookedSlotsCount: 0,
  todayBlockedSlotsCount: 0,
  todayAvailableSlotsCount: 0,
  pendingLeaveRequestsCount: 0,
  scheduleConflictsCount: 0
};
