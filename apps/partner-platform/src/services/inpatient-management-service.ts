import { apiRequest, isMockFallbackAllowed } from './api-client.js';
import {
  synchronizeBedInventoryWithProfile,
  broadcastBedState
} from './bed-profile-synchronizer.js';

function loadStored<T>(key: string, fallback: T[]): T[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          if (key === 'docsearch_inpatient_admissions' && parsed.some((a: any) => a?.admissionNumber === 'ADM-2026-0089' || a?.patientId === 'pat-001')) {
            window.localStorage.removeItem(key);
            return [...fallback];
          }
          if (key === 'docsearch_inpatient_beds' && parsed.some((b: any) => b?.currentPatientId === 'pat-001')) {
            window.localStorage.removeItem(key);
            return [...fallback];
          }
          return parsed;
        }
      }
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
  InpatientOverviewMetricsDto,
  InpatientAnalyticsDto,
  InpatientUnitDto,
  InpatientWardDto,
  InpatientBedDto,
  InpatientAdmissionRequestDto,
  InpatientAdmissionDto,
  InpatientTransferDto,
  InpatientNursingAssessmentDto,
  InpatientVitalObservationDto,
  InpatientDoctorRoundDto,
  InpatientDischargePlanDto,
  InpatientDischargeSummaryDto,
  InpatientBedTurnaroundDto,
  InpatientBedBlockDto,
  InpatientAuditTraceDto,
  CreateWardRequest,
  UpdateWardRequest,
  CreateBedRequest,
  UpdateBedRequest,
  BlockBedRequest,
  CreateBedReservationRequest,
  CancelBedReservationRequest,
  CreateAdmissionRequest,
  ApproveAdmissionRequest,
  RejectAdmissionRequest,
  CancelAdmissionRequest,
  AllocateBedRequest,
  CreateTransferRequest,
  ApproveTransferRequest,
  CompleteTransferRequest,
  RecordNursingAssessmentRequest,
  RecordNursingNoteRequest,
  RecordCarePlanRequest,
  RecordVitalObservationRequest,
  RecordDoctorRoundRequest,
  CreateDischargePlanRequest,
  RequestDischargeRequest,
  ApproveDischargeRequest,
  CompleteDischargeRequest,
  FinalizeDischargeSummaryRequest,
  ReleaseBedRequest,
  CompleteCleaningRequest
} from '@docsearch/api-contracts';

import {
  mockInpatientUnits,
  mockInpatientWards,
  mockInpatientBeds,
  mockInpatientAdmissionRequests,
  mockInpatientAdmissions,
  mockInpatientTransfers,
  mockInpatientNursingAssessments,
  mockInpatientVitalObservations,
  mockInpatientDoctorRounds,
  mockInpatientDischargePlans,
  mockInpatientDischargeSummaries,
  mockInpatientBedTurnarounds,
  mockInpatientBedBlocks,
  mockInpatientAuditTraces,
  mockInpatientOverviewMetrics,
  mockInpatientAnalytics
} from './mock-inpatient-data.js';

export interface IInpatientManagementService {
  getOverviewMetrics(tenantId: string): Promise<InpatientOverviewMetricsDto>;
  getAnalytics(tenantId: string): Promise<InpatientAnalyticsDto>;
  getUnits(tenantId: string): Promise<InpatientUnitDto[]>;
  getWards(tenantId: string): Promise<InpatientWardDto[]>;
  getBeds(tenantId: string): Promise<InpatientBedDto[]>;
  getAdmissionRequests(tenantId: string): Promise<InpatientAdmissionRequestDto[]>;
  getAdmissions(tenantId: string): Promise<InpatientAdmissionDto[]>;
  getTransfers(tenantId: string): Promise<InpatientTransferDto[]>;
  getNursingAssessments(tenantId: string): Promise<InpatientNursingAssessmentDto[]>;
  getVitalObservations(tenantId: string): Promise<InpatientVitalObservationDto[]>;
  getDoctorRounds(tenantId: string): Promise<InpatientDoctorRoundDto[]>;
  getDischargePlans(tenantId: string): Promise<InpatientDischargePlanDto[]>;
  getDischargeSummaries(tenantId: string): Promise<InpatientDischargeSummaryDto[]>;
  getBedTurnarounds(tenantId: string): Promise<InpatientBedTurnaroundDto[]>;
  getBedBlocks(tenantId: string): Promise<InpatientBedBlockDto[]>;
  getAuditTraces(tenantId: string): Promise<InpatientAuditTraceDto[]>;
  createWard(req: CreateWardRequest): Promise<InpatientWardDto>;
  updateWard(req: UpdateWardRequest): Promise<InpatientWardDto>;
  createBed(req: CreateBedRequest): Promise<InpatientBedDto>;
  updateBed(req: UpdateBedRequest): Promise<InpatientBedDto>;
  blockBed(req: BlockBedRequest): Promise<InpatientBedDto>;
  createBedReservation(req: CreateBedReservationRequest): Promise<InpatientBedDto>;
  cancelBedReservation(req: CancelBedReservationRequest): Promise<InpatientBedDto>;
  createAdmissionRequest(req: CreateAdmissionRequest): Promise<InpatientAdmissionRequestDto>;
  approveAdmission(req: ApproveAdmissionRequest): Promise<InpatientAdmissionDto>;
  rejectAdmission(req: RejectAdmissionRequest): Promise<InpatientAdmissionRequestDto>;
  cancelAdmission(req: CancelAdmissionRequest): Promise<InpatientAdmissionRequestDto>;
  allocateBed(req: AllocateBedRequest): Promise<InpatientAdmissionDto>;
  createTransfer(req: CreateTransferRequest): Promise<InpatientTransferDto>;
  approveTransfer(req: ApproveTransferRequest): Promise<InpatientTransferDto>;
  completeTransfer(req: CompleteTransferRequest): Promise<InpatientTransferDto>;
  recordNursingAssessment(req: RecordNursingAssessmentRequest): Promise<InpatientNursingAssessmentDto>;
  recordNursingNote(req: RecordNursingNoteRequest): Promise<void>;
  recordCarePlan(req: RecordCarePlanRequest): Promise<void>;
  recordVitalObservation(req: RecordVitalObservationRequest): Promise<InpatientVitalObservationDto>;
  recordDoctorRound(req: RecordDoctorRoundRequest): Promise<InpatientDoctorRoundDto>;
  createDischargePlan(req: CreateDischargePlanRequest): Promise<InpatientDischargePlanDto>;
  requestDischarge(req: RequestDischargeRequest): Promise<void>;
  approveDischarge(req: ApproveDischargeRequest): Promise<void>;
  completeDischarge(req: CompleteDischargeRequest): Promise<InpatientAdmissionDto>;
  finalizeDischargeSummary(req: FinalizeDischargeSummaryRequest): Promise<InpatientDischargeSummaryDto>;
  releaseBed(req: ReleaseBedRequest): Promise<InpatientBedDto>;
  completeCleaning(req: CompleteCleaningRequest & { bedId?: string }): Promise<InpatientBedDto>;
  directAdmitPatient(req: DirectAdmitPatientRequest): Promise<InpatientAdmissionDto>;
}

export interface DirectAdmitPatientRequest {
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  patientName: string;
  patientMrn: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'OTHER';
  bedId: string;
  wardId: string;
  admittingDoctorName: string;
  department: string;
  provisionalDiagnosis: string;
  admissionType?: 'EMERGENCY' | 'ELECTIVE';
  expectedLengthOfStayDays?: number;
}

export class MockInpatientManagementService implements IInpatientManagementService {
  private units: InpatientUnitDto[] = isMockFallbackAllowed() ? [...mockInpatientUnits] : [];
  private wards: InpatientWardDto[] = isMockFallbackAllowed() ? loadStored("docsearch_inpatient_wards", mockInpatientWards) : [];
  private beds: InpatientBedDto[] = isMockFallbackAllowed() ? loadStored("docsearch_inpatient_beds", mockInpatientBeds) : [];
  private requests: InpatientAdmissionRequestDto[] = isMockFallbackAllowed() ? loadStored("docsearch_inpatient_admission_requests", mockInpatientAdmissionRequests) : [];
  private admissions: InpatientAdmissionDto[] = isMockFallbackAllowed() ? loadStored("docsearch_inpatient_admissions", mockInpatientAdmissions) : [];
  private transfers: InpatientTransferDto[] = isMockFallbackAllowed() ? loadStored("docsearch_inpatient_transfers", mockInpatientTransfers) : [];
  private nursingAssessments: InpatientNursingAssessmentDto[] = isMockFallbackAllowed() ? [...mockInpatientNursingAssessments] : [];
  private vitals: InpatientVitalObservationDto[] = isMockFallbackAllowed() ? [...mockInpatientVitalObservations] : [];
  private rounds: InpatientDoctorRoundDto[] = isMockFallbackAllowed() ? [...mockInpatientDoctorRounds] : [];
  private dischargePlans: InpatientDischargePlanDto[] = isMockFallbackAllowed() ? [...mockInpatientDischargePlans] : [];
  private dischargeSummaries: InpatientDischargeSummaryDto[] = isMockFallbackAllowed() ? loadStored("docsearch_inpatient_discharge_summaries", mockInpatientDischargeSummaries) : [];
  private bedTurnarounds: InpatientBedTurnaroundDto[] = isMockFallbackAllowed() ? [...mockInpatientBedTurnarounds] : [];
  private bedBlocks: InpatientBedBlockDto[] = isMockFallbackAllowed() ? [...mockInpatientBedBlocks] : [];
  private auditTraces: InpatientAuditTraceDto[] = isMockFallbackAllowed() ? [...mockInpatientAuditTraces] : [];

  private addTrace(actorName: string, actorRole: string, action: string, entityType: string, entityCode: string, justification: string, tenantId = '11111111-1111-4111-8111-111111111111') {
    const trace: InpatientAuditTraceDto = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      tenantId,
      partnerId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      branchId: '44444444-4444-4444-8444-444444444444',
      traceNumber: `TRACE-IPD-${Date.now().toString().slice(-8)}`,
      actorId: 'usr-admin',
      actorName,
      actorRole,
      action,
      entityType,
      entityId: entityCode,
      entityCode,
      justification,
      newState: { status: action, entityCode },
      previousHash: 'sha256-genesis',
      ipAddress: '127.0.0.1',
      integrityHash: 'sha256-' + Math.random().toString(36).substring(2, 18),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  private saveTenantBeds(tenantId: string) {
    const tenantKey = `docsearch_inpatient_beds_${tenantId}`;
    const bedsForTenant = this.beds.filter((b) => b.tenantId === tenantId);
    saveStored(tenantKey, bedsForTenant.length > 0 ? bedsForTenant : this.beds);
    saveStored("docsearch_inpatient_beds", this.beds);
    broadcastBedState(this.beds);
  }

  private saveTenantAdmissions(tenantId: string) {
    const tenantKey = `docsearch_inpatient_admissions_${tenantId}`;
    const admsForTenant = this.admissions.filter((a) => a.tenantId === tenantId);
    saveStored(tenantKey, admsForTenant.length > 0 ? admsForTenant : this.admissions);
    saveStored("docsearch_inpatient_admissions", this.admissions);
  }

  private saveTenantWards(tenantId: string) {
    const tenantKey = `docsearch_inpatient_wards_${tenantId}`;
    const wardsForTenant = this.wards.filter((w) => w.tenantId === tenantId);
    saveStored(tenantKey, wardsForTenant.length > 0 ? wardsForTenant : this.wards);
    saveStored("docsearch_inpatient_wards", this.wards);
  }

  private ensureTenantData(tenantId: string) {
    if (!tenantId || tenantId === 'undefined') return;
    if (!isMockFallbackAllowed()) return;
    const tenantWardKey = `docsearch_inpatient_wards_${tenantId}`;
    const tenantBedKey = `docsearch_inpatient_beds_${tenantId}`;
    const tenantAdmKey = `docsearch_inpatient_admissions_${tenantId}`;

    const storedWards = loadStored<InpatientWardDto>(tenantWardKey, []);
    const storedBeds = loadStored<InpatientBedDto>(tenantBedKey, []);
    const storedAdms = loadStored<InpatientAdmissionDto>(tenantAdmKey, []);

    if (storedWards.length > 0) {
      for (const w of storedWards) {
        if (!this.wards.some((existing) => existing.id === w.id)) {
          this.wards.push(w);
        }
      }
    } else if (tenantId !== '11111111-1111-4111-8111-111111111111') {
      const starterWards: InpatientWardDto[] = [
        {
          id: `wrd-${tenantId}-1`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          unitId: 'unit-1',
          wardCode: 'GW-M',
          wardName: 'General Medical Ward',
          wardType: 'GENERAL',
          careLevel: 'LEVEL_1_OBSERVATION',
          genderPolicy: 'ALL',
          building: 'Main Hospital Block',
          floor: '2nd Floor, Wing A',
          nursingStationName: 'Station 2A',
          totalBeds: 4,
          activeBeds: 4,
          occupiedBeds: 1,
          blockedBeds: 0,
          cleaningBeds: 1,
          isolationCapable: false,
          ventilatorCapable: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `wrd-${tenantId}-2`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          unitId: 'unit-2',
          wardCode: 'ICU-1',
          wardName: 'Intensive Care Unit (ICU)',
          wardType: 'ICU',
          careLevel: 'LEVEL_3_ICU',
          genderPolicy: 'ALL',
          building: 'Main Hospital Block',
          floor: '3rd Floor, Critical Wing',
          nursingStationName: 'ICU Central Console',
          totalBeds: 3,
          activeBeds: 3,
          occupiedBeds: 1,
          blockedBeds: 0,
          cleaningBeds: 0,
          isolationCapable: true,
          ventilatorCapable: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `wrd-${tenantId}-3`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          unitId: 'unit-3',
          wardCode: 'EM-OBS',
          wardName: 'Emergency Observation Unit',
          wardType: 'HDU',
          careLevel: 'LEVEL_2_STEPDOWN',
          genderPolicy: 'ALL',
          building: 'Emergency & Trauma Block',
          floor: 'Ground Floor, ER',
          nursingStationName: 'Triage Desk',
          totalBeds: 3,
          activeBeds: 3,
          occupiedBeds: 0,
          blockedBeds: 0,
          cleaningBeds: 0,
          isolationCapable: false,
          ventilatorCapable: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `wrd-${tenantId}-4`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          unitId: 'unit-4',
          wardCode: 'PVT-D',
          wardName: 'Private Deluxe Suite',
          wardType: 'PRIVATE',
          careLevel: 'LEVEL_1_OBSERVATION',
          genderPolicy: 'ALL',
          building: 'Specialty Tower',
          floor: '4th Floor, Premium Wing',
          nursingStationName: 'Station 4P',
          totalBeds: 2,
          activeBeds: 2,
          occupiedBeds: 0,
          blockedBeds: 0,
          cleaningBeds: 0,
          isolationCapable: false,
          ventilatorCapable: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      this.wards.push(...starterWards);
      saveStored(tenantWardKey, starterWards);
    }

    if (storedBeds.length > 0) {
      for (const b of storedBeds) {
        if (!this.beds.some((existing) => existing.id === b.id)) {
          this.beds.push(b);
        }
      }
    } else if (tenantId !== '11111111-1111-4111-8111-111111111111') {
      const starterBeds: InpatientBedDto[] = [
        {
          id: `bed-${tenantId}-101`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-1`,
          wardName: 'General Medical Ward',
          bedCode: 'GW-101',
          bedNumber: '101',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'GENERAL',
          status: 'OCCUPIED',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: true,
          dailyChargeRate: 1800,
          currentPatientId: `pat-${tenantId}-1`,
          currentPatientName: 'Ananya Deshmukh',
          currentPatientMrn: 'MRN-2026-9041',
          currentAdmissionId: `adm-${tenantId}-1`,
          lastOccupiedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-102`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-1`,
          wardName: 'General Medical Ward',
          bedCode: 'GW-102',
          bedNumber: '102',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'GENERAL',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: false,
          dailyChargeRate: 1800,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-103`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-1`,
          wardName: 'General Medical Ward',
          bedCode: 'GW-103',
          bedNumber: '103',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'GENERAL',
          status: 'CLEANING',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: false,
          dailyChargeRate: 1800,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-104`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-1`,
          wardName: 'General Medical Ward',
          bedCode: 'GW-104',
          bedNumber: '104',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'GENERAL',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: false,
          dailyChargeRate: 1800,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-icu-1`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-2`,
          wardName: 'Intensive Care Unit (ICU)',
          bedCode: 'ICU-01',
          bedNumber: 'ICU-1',
          bedType: 'ICU_CRITICAL',
          bedClass: 'ICU',
          status: 'OCCUPIED',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: true,
          hasCardiacMonitor: true,
          dailyChargeRate: 6500,
          currentPatientId: `pat-${tenantId}-2`,
          currentPatientName: 'Rajinder Singh',
          currentPatientMrn: 'MRN-2026-8812',
          currentAdmissionId: `adm-${tenantId}-2`,
          lastOccupiedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-icu-2`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-2`,
          wardName: 'Intensive Care Unit (ICU)',
          bedCode: 'ICU-02',
          bedNumber: 'ICU-2',
          bedType: 'ICU_CRITICAL',
          bedClass: 'ICU',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: true,
          hasCardiacMonitor: true,
          dailyChargeRate: 6500,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-icu-3`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-2`,
          wardName: 'Intensive Care Unit (ICU)',
          bedCode: 'ICU-03',
          bedNumber: 'ICU-3',
          bedType: 'ICU_CRITICAL',
          bedClass: 'ICU',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: true,
          hasCardiacMonitor: true,
          dailyChargeRate: 6500,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-em-1`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-3`,
          wardName: 'Emergency Observation Unit',
          bedCode: 'EM-01',
          bedNumber: 'EM-1',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'HDU',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: true,
          dailyChargeRate: 3200,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-em-2`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-3`,
          wardName: 'Emergency Observation Unit',
          bedCode: 'EM-02',
          bedNumber: 'EM-2',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'HDU',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: true,
          dailyChargeRate: 3200,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-pvt-1`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-4`,
          wardName: 'Private Deluxe Suite',
          bedCode: 'PVT-201',
          bedNumber: '201',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'DELUXE',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: true,
          dailyChargeRate: 4500,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `bed-${tenantId}-pvt-2`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          wardId: `wrd-${tenantId}-4`,
          wardName: 'Private Deluxe Suite',
          bedCode: 'PVT-202',
          bedNumber: '202',
          bedType: 'STANDARD_ELECTRIC',
          bedClass: 'DELUXE',
          status: 'AVAILABLE',
          genderEligibility: 'ALL',
          hasOxygenPort: true,
          hasSuctionPort: true,
          hasVentilator: false,
          hasCardiacMonitor: true,
          dailyChargeRate: 4500,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      this.beds.push(...starterBeds);
      saveStored(tenantBedKey, starterBeds);
    }

    if (storedAdms.length > 0) {
      for (const a of storedAdms) {
        if (!this.admissions.some((existing) => existing.id === a.id)) {
          this.admissions.push(a);
        }
      }
    } else if (tenantId !== '11111111-1111-4111-8111-111111111111') {
      const starterAdmissions: InpatientAdmissionDto[] = [
        {
          id: `adm-${tenantId}-1`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          admissionNumber: `ADM-${Date.now().toString().slice(-6)}`,
          patientId: `pat-${tenantId}-1`,
          patientName: 'Ananya Deshmukh',
          patientMrn: 'MRN-2026-9041',
          patientAge: 38,
          patientGender: 'F',
          wardId: `wrd-${tenantId}-1`,
          wardName: 'General Medical Ward',
          bedId: `bed-${tenantId}-101`,
          bedCode: 'GW-101',
          department: 'Internal Medicine',
          specialty: 'Infectious Disease',
          admittingDoctorName: 'Dr. Rajesh Verma, MD',
          attendingConsultantName: 'Dr. Rajesh Verma, MD',
          admissionDateTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          expectedDischargeDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          primaryDiagnosis: 'Dengue Fever with mild thrombocytopenia (Platelets 85,000)',
          admissionType: 'EMERGENCY',
          admissionSource: 'EMERGENCY_DEPT',
          isolationRequired: false,
          payerType: 'INSURANCE_TPA',
          payerName: 'Star Health Insurance',
          financialDepositAmount: 5000,
          clinicalClearance: false,
          billingCleared: false,
          insuranceCleared: true,
          dischargeSummaryFinalized: false,
          status: 'ADMITTED',
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `adm-${tenantId}-2`,
          tenantId,
          partnerId: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          branchId: '44444444-4444-4444-8444-444444444444',
          admissionNumber: `ADM-${(Date.now() + 1).toString().slice(-6)}`,
          patientId: `pat-${tenantId}-2`,
          patientName: 'Rajinder Singh',
          patientMrn: 'MRN-2026-8812',
          patientAge: 64,
          patientGender: 'M',
          wardId: `wrd-${tenantId}-2`,
          wardName: 'Intensive Care Unit (ICU)',
          bedId: `bed-${tenantId}-icu-1`,
          bedCode: 'ICU-01',
          department: 'Pulmonology & Critical Care',
          specialty: 'Critical Care',
          admittingDoctorName: 'Dr. Priya Nair, MD',
          attendingConsultantName: 'Dr. Priya Nair, MD',
          admissionDateTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          expectedDischargeDate: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          primaryDiagnosis: 'COPD with Acute Exacerbation & Type 2 Respiratory Failure (BiPAP Support)',
          admissionType: 'EMERGENCY',
          admissionSource: 'EMERGENCY_DEPT',
          isolationRequired: false,
          payerType: 'CASH_SELF_PAY',
          payerName: 'Self Pay',
          financialDepositAmount: 25000,
          clinicalClearance: false,
          billingCleared: false,
          insuranceCleared: false,
          dischargeSummaryFinalized: false,
          status: 'ADMITTED',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      this.admissions.push(...starterAdmissions);
      saveStored(tenantAdmKey, starterAdmissions);
    }

    // Authoritative 6-Pillar Profile Bed Reconciliation
    const synced = synchronizeBedInventoryWithProfile(this.beds, this.wards);
    this.beds = synced.beds;
    this.wards = synced.wards;
    this.saveTenantBeds(tenantId);
    this.saveTenantWards(tenantId);
  }

  async getOverviewMetrics(tenantId: string): Promise<InpatientOverviewMetricsDto> {
    this.ensureTenantData(tenantId);
    const bedsToUse = this.beds.filter((b) => b.tenantId === tenantId).length > 0
      ? this.beds.filter((b) => b.tenantId === tenantId)
      : this.beds;
    const admissionsToUse = this.admissions.filter((a) => a.tenantId === tenantId).length > 0
      ? this.admissions.filter((a) => a.tenantId === tenantId)
      : this.admissions;
    const requestsToUse = this.requests.filter((r) => r.tenantId === tenantId).length > 0
      ? this.requests.filter((r) => r.tenantId === tenantId)
      : this.requests;
    const transfersToUse = this.transfers.filter((t) => t.tenantId === tenantId).length > 0
      ? this.transfers.filter((t) => t.tenantId === tenantId)
      : this.transfers;

    const totalBeds = bedsToUse.length;
    const occupiedBeds = bedsToUse.filter((b) => b.status === 'OCCUPIED').length;
    const availableBeds = bedsToUse.filter((b) => b.status === 'AVAILABLE').length;
    const blockedBeds = bedsToUse.filter((b) => b.status === 'BLOCKED').length;
    const cleaningBeds = bedsToUse.filter((b) => b.status === 'CLEANING').length;
    const totalInpatients = admissionsToUse.filter((a) => a.status === 'ADMITTED' || a.status === 'DISCHARGE_PLANNED').length;
    const pendingAdmissions = requestsToUse.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
    const transferBacklog = transfersToUse.filter((t) => t.status === 'REQUESTED' || t.status === 'APPROVED').length;
    const dischargeBacklog = admissionsToUse.filter((a) => a.status === 'DISCHARGE_PLANNED' && !a.billingCleared).length;
    const occupancyRatePercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const icuBeds = bedsToUse.filter((b) => b.wardName?.toLowerCase().includes('icu') || b.bedCode?.includes('ICU'));
    const icuOccupied = icuBeds.filter((b) => b.status === 'OCCUPIED').length;
    const icuOccupancyRatePercentage = icuBeds.length > 0 ? Math.round((icuOccupied / icuBeds.length) * 100) : 0;

    const baseOverview = isMockFallbackAllowed() ? mockInpatientOverviewMetrics : {
      ...mockInpatientOverviewMetrics,
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      blockedBeds: 0,
      cleaningBeds: 0,
      totalInpatients: 0,
      pendingAdmissions: 0,
      transferBacklog: 0,
      dischargeBacklog: 0,
      occupancyRatePercentage: 0,
      icuOccupancyRatePercentage: 0,
      averageLengthOfStayDays: 0,
      admissionsToday: 0,
      dischargesToday: 0,
      reservedBeds: 0,
      cleaningBacklog: 0,
      criticalAlertsCount: 0
    };

    return {
      ...baseOverview,
      totalBeds,
      occupiedBeds,
      availableBeds,
      blockedBeds,
      cleaningBeds,
      totalInpatients,
      pendingAdmissions,
      transferBacklog,
      dischargeBacklog,
      occupancyRatePercentage,
      icuOccupancyRatePercentage
    };
  }

  async getAnalytics(_tenantId: string): Promise<InpatientAnalyticsDto> {
    return { ...mockInpatientAnalytics };
  }

  async getUnits(tenantId: string): Promise<InpatientUnitDto[]> {
    this.ensureTenantData(tenantId);
    const matched = this.units.filter((u) => u.tenantId === tenantId);
    return matched.length > 0 ? matched : this.units;
  }

  async getWards(tenantId: string): Promise<InpatientWardDto[]> {
    this.ensureTenantData(tenantId);
    try {
      const res = await apiRequest<InpatientWardDto[]>('/api/v1/partner/inpatient/wards');
      if (res.success && Array.isArray(res.data)) {
        this.wards = res.data;
        this.saveTenantWards(tenantId);
        return res.data;
      }
    } catch {
      // Fallback
    }
    const matched = this.wards.filter((w) => w.tenantId === tenantId);
    return matched.length > 0 ? matched : this.wards;
  }

  async getBeds(tenantId: string): Promise<InpatientBedDto[]> {
    this.ensureTenantData(tenantId);
    try {
      const res = await apiRequest<InpatientBedDto[]>('/api/v1/partner/inpatient/beds');
      if (res.success && Array.isArray(res.data)) {
        this.beds = res.data;
        this.saveTenantBeds(tenantId);
        return res.data;
      }
    } catch {
      // Fallback
    }
    const matched = this.beds.filter((b) => b.tenantId === tenantId);
    return matched.length > 0 ? matched : this.beds;
  }

  async getAdmissionRequests(tenantId: string): Promise<InpatientAdmissionRequestDto[]> {
    this.ensureTenantData(tenantId);
    const matched = this.requests.filter((r) => r.tenantId === tenantId);
    return matched.length > 0 ? matched : this.requests;
  }

  async getAdmissions(tenantId: string): Promise<InpatientAdmissionDto[]> {
    this.ensureTenantData(tenantId);
    try {
      const res = await apiRequest<InpatientAdmissionDto[]>('/api/v1/partner/inpatient/admissions');
      if (res.success && Array.isArray(res.data)) {
        this.admissions = res.data;
        this.saveTenantAdmissions(tenantId);
        return res.data;
      }
    } catch {
      // Fallback
    }
    const matched = this.admissions.filter((a) => a.tenantId === tenantId);
    return matched.length > 0 ? matched : this.admissions;
  }

  async getTransfers(tenantId: string): Promise<InpatientTransferDto[]> {
    const matched = (this.transfers || []).filter((t) => t.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.transfers || []);
  }

  async getNursingAssessments(tenantId: string): Promise<InpatientNursingAssessmentDto[]> {
    const matched = (this.nursingAssessments || []).filter((n) => n.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.nursingAssessments || []);
  }

  async getVitalObservations(tenantId: string): Promise<InpatientVitalObservationDto[]> {
    const matched = (this.vitals || []).filter((v) => v.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.vitals || []);
  }

  async getDoctorRounds(tenantId: string): Promise<InpatientDoctorRoundDto[]> {
    const matched = (this.rounds || []).filter((r) => r.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.rounds || []);
  }

  async getDischargePlans(tenantId: string): Promise<InpatientDischargePlanDto[]> {
    const matched = (this.dischargePlans || []).filter((d) => d.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.dischargePlans || []);
  }

  async getDischargeSummaries(tenantId: string): Promise<InpatientDischargeSummaryDto[]> {
    const matched = (this.dischargeSummaries || []).filter((d) => d.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.dischargeSummaries || []);
  }

  async getBedTurnarounds(tenantId: string): Promise<InpatientBedTurnaroundDto[]> {
    const matched = (this.bedTurnarounds || []).filter((b) => b.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.bedTurnarounds || []);
  }

  async getBedBlocks(tenantId: string): Promise<InpatientBedBlockDto[]> {
    const matched = (this.bedBlocks || []).filter((b) => b.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.bedBlocks || []);
  }

  async getAuditTraces(tenantId: string): Promise<InpatientAuditTraceDto[]> {
    const matched = (this.auditTraces || []).filter((a) => a.tenantId === tenantId);
    return matched.length > 0 ? matched : (this.auditTraces || []);
  }

  async createWard(req: CreateWardRequest): Promise<InpatientWardDto> {
    try {
      const res = await apiRequest<InpatientWardDto>('/api/v1/partner/inpatient/wards', {
        method: 'POST',
        body: JSON.stringify({
          ...req,
          name: req.wardName,
          capacity: req.totalBeds
        })
      });
      if (res.success && res.data) {
        this.wards.unshift(res.data);
        saveStored("docsearch_inpatient_wards", this.wards);
        this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'CREATE_WARD', 'INPATIENT_WARD', res.data.wardCode, 'Ward registered in roster');
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newWard: InpatientWardDto = {
      id: 'wrd-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      unitId: req.unitId,
      wardCode: req.wardCode,
      wardName: req.wardName,
      wardType: req.wardType,
      careLevel: req.careLevel,
      genderPolicy: req.genderPolicy || 'ALL',
      building: req.building,
      floor: req.floor,
      nursingStationName: req.nursingStationName,
      totalBeds: req.totalBeds,
      activeBeds: req.totalBeds,
      occupiedBeds: 0,
      blockedBeds: 0,
      cleaningBeds: 0,
      isolationCapable: req.isolationCapable ?? false,
      ventilatorCapable: req.ventilatorCapable ?? false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.wards.push(newWard);
    saveStored("docsearch_inpatient_wards", this.wards);
    this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'CREATE_WARD', 'INPATIENT_WARD', newWard.wardCode, 'Ward registered in roster');
    return newWard;
  }

  async updateWard(req: UpdateWardRequest): Promise<InpatientWardDto> {
    const index = this.wards.findIndex((w) => w.id === req.wardId);
    if (index === -1) throw new Error('Ward not found');
    const existing = this.wards[index];
    if (!existing) throw new Error('Ward not found');
    const updated: InpatientWardDto = {
      ...existing,
      wardName: req.wardName ?? existing.wardName,
      careLevel: req.careLevel ?? existing.careLevel,
      nursingStationName: req.nursingStationName ?? existing.nursingStationName,
      isolationCapable: req.isolationCapable ?? existing.isolationCapable,
      ventilatorCapable: req.ventilatorCapable ?? existing.ventilatorCapable,
      isActive: req.isActive ?? existing.isActive,
      updatedAt: new Date().toISOString()
    };
    this.wards[index] = updated;
    this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'UPDATE_WARD', 'INPATIENT_WARD', updated.wardCode, 'Ward profile updated');
    return updated;
  }

  async createBed(req: CreateBedRequest): Promise<InpatientBedDto> {
    try {
      const res = await apiRequest<InpatientBedDto>('/api/v1/partner/inpatient/beds', {
        method: 'POST',
        body: JSON.stringify({
          ...req,
          bedNumber: req.bedNumber || req.bedCode
        })
      });
      if (res.success && res.data) {
        this.beds.unshift(res.data);
        saveStored("docsearch_inpatient_beds", this.beds);
        this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'CREATE_BED', 'INPATIENT_BED', res.data.bedCode, 'Bed registered');
        return res.data;
      }
    } catch {
      // Fallback
    }
    const ward = this.wards.find((w) => w.id === req.wardId);
    const newBed: InpatientBedDto = {
      id: 'bed-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      wardId: req.wardId,
      wardName: ward?.wardName || 'General Ward',
      bedCode: req.bedCode,
      bedNumber: req.bedNumber,
      bedType: req.bedType,
      bedClass: req.bedClass,
      status: 'AVAILABLE',
      genderEligibility: req.genderEligibility || 'ALL',
      hasOxygenPort: req.hasOxygenPort ?? true,
      hasSuctionPort: req.hasSuctionPort ?? true,
      hasVentilator: req.hasVentilator ?? false,
      hasCardiacMonitor: req.hasCardiacMonitor ?? false,
      dailyChargeRate: req.dailyChargeRate,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.beds.push(newBed);
    saveStored("docsearch_inpatient_beds", this.beds);
    this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'CREATE_BED', 'INPATIENT_BED', newBed.bedCode, 'Bed registered');
    return newBed;
  }

  async updateBed(req: UpdateBedRequest): Promise<InpatientBedDto> {
    const index = this.beds.findIndex((b) => b.id === req.bedId);
    if (index === -1) throw new Error('Bed not found');
    const existing = this.beds[index];
    if (!existing) throw new Error('Bed not found');
    const updated: InpatientBedDto = {
      ...existing,
      bedType: req.bedType ?? existing.bedType,
      bedClass: req.bedClass ?? existing.bedClass,
      hasOxygenPort: req.hasOxygenPort ?? existing.hasOxygenPort,
      hasSuctionPort: req.hasSuctionPort ?? existing.hasSuctionPort,
      hasVentilator: req.hasVentilator ?? existing.hasVentilator,
      hasCardiacMonitor: req.hasCardiacMonitor ?? existing.hasCardiacMonitor,
      dailyChargeRate: req.dailyChargeRate ?? existing.dailyChargeRate,
      isActive: req.isActive ?? existing.isActive,
      updatedAt: new Date().toISOString()
    };
    this.beds[index] = updated;
    this.addTrace('Hospital Admin', 'ADMINISTRATOR', 'UPDATE_BED', 'INPATIENT_BED', updated.bedCode, 'Bed updated');
    return updated;
  }

  async blockBed(req: BlockBedRequest): Promise<InpatientBedDto> {
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (!bed) throw new Error('Bed not found');
    bed.status = 'BLOCKED';
    bed.notes = req.justificationNotes;
    bed.updatedAt = new Date().toISOString();
    const newBlock: InpatientBedBlockDto = {
      id: 'blk-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      bedId: req.bedId,
      bedCode: bed.bedCode,
      wardId: bed.wardId,
      blockNumber: `BLK-${Date.now().toString().slice(-6)}`,
      blockReason: req.blockReason,
      authorizedBy: req.authorizedBy,
      justificationNotes: req.justificationNotes,
      blockedFrom: new Date().toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.bedBlocks.unshift(newBlock);
    this.addTrace(req.authorizedBy, 'SUPERVISOR', 'BLOCK_BED', 'INPATIENT_BED', bed.bedCode, req.justificationNotes);
    return bed;
  }

  async createBedReservation(req: CreateBedReservationRequest): Promise<InpatientBedDto> {
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (!bed) throw new Error('Bed not found');
    bed.status = 'RESERVED';
    bed.currentPatientName = req.patientName;
    bed.currentPatientMrn = req.patientMrn;
    bed.updatedAt = new Date().toISOString();
    this.addTrace(req.reservedBy, 'ADT_OFFICER', 'RESERVE_BED', 'INPATIENT_BED', bed.bedCode, req.notes || 'Reserved for elective procedure');
    return bed;
  }

  async cancelBedReservation(req: CancelBedReservationRequest): Promise<InpatientBedDto> {
    const bed = this.beds.find((b) => b.status === 'RESERVED');
    if (!bed) throw new Error('No reserved bed found');
    bed.status = 'AVAILABLE';
    bed.currentPatientName = undefined;
    bed.currentPatientMrn = undefined;
    bed.updatedAt = new Date().toISOString();
    this.addTrace(req.cancelledBy, 'ADT_OFFICER', 'CANCEL_BED_RESERVATION', 'INPATIENT_BED', bed.bedCode, req.reason);
    return bed;
  }

  async createAdmissionRequest(req: CreateAdmissionRequest): Promise<InpatientAdmissionRequestDto> {
    try {
      const res = await apiRequest<InpatientAdmissionRequestDto>('/api/v1/partner/inpatient/admissions', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    const newReq: InpatientAdmissionRequestDto = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      requestNumber: `REQ-ADM-${Date.now().toString().slice(-6)}`,
      patientId: req.patientId,
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      referringDoctorName: req.referringDoctorName,
      admittingDoctorName: req.admittingDoctorName,
      department: req.department,
      specialty: req.specialty,
      requestedWardType: req.requestedWardType,
      requestedBedClass: req.requestedBedClass,
      admissionSource: req.admissionSource,
      priority: req.priority || 'ROUTINE',
      isEmergency: req.isEmergency ?? false,
      provisionalDiagnosis: req.provisionalDiagnosis,
      admissionReason: req.admissionReason,
      expectedLengthOfStayDays: req.expectedLengthOfStayDays || 3,
      insurancePreAuthRef: req.insurancePreAuthRef,
      status: 'SUBMITTED',
      decisionNotes: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requests.unshift(newReq);
    this.addTrace(req.admittingDoctorName, 'PHYSICIAN', 'CREATE_ADMISSION_REQUEST', 'ADMISSION_REQUEST', newReq.requestNumber, req.admissionReason);
    return newReq;
  }

  async approveAdmission(req: ApproveAdmissionRequest): Promise<InpatientAdmissionDto> {
    const admissionReq = this.requests.find((r) => r.id === req.requestId);
    if (!admissionReq) throw new Error('Admission request not found');
    admissionReq.status = 'APPROVED';
    admissionReq.decisionNotes = `Approved by ${req.approverName}`;
    admissionReq.updatedAt = new Date().toISOString();

    const ward = this.wards.find((w) => w.id === req.allocatedWardId);
    const bed = this.beds.find((b) => b.id === req.allocatedBedId);

    try {
      const res = await apiRequest<InpatientAdmissionDto>('/api/v1/partner/inpatient/admissions', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: admissionReq.tenantId,
          partnerId: admissionReq.partnerId,
          organizationId: admissionReq.organizationId,
          branchId: admissionReq.branchId,
          patientId: admissionReq.patientId,
          doctorId: admissionReq.admittingDoctorName,
          department: admissionReq.department,
          bedId: req.allocatedBedId,
          admissionReason: admissionReq.admissionReason || admissionReq.provisionalDiagnosis
        })
      });
      if (res.success && res.data) {
        if (bed) {
          bed.status = 'OCCUPIED';
          bed.currentPatientId = admissionReq.patientId;
          bed.currentPatientName = admissionReq.patientName;
          bed.currentPatientMrn = admissionReq.patientMrn;
          bed.currentAdmissionId = res.data.id;
          bed.lastOccupiedAt = new Date().toISOString();
        }
        const createdAdmission: InpatientAdmissionDto = {
          ...res.data,
          patientName: admissionReq.patientName,
          patientMrn: admissionReq.patientMrn,
          wardId: req.allocatedWardId,
          wardName: ward?.wardName || 'Inpatient Ward',
          bedId: req.allocatedBedId,
          bedCode: bed?.bedCode || 'BED-01',
          department: admissionReq.department,
          specialty: admissionReq.specialty,
          admittingDoctorName: admissionReq.admittingDoctorName,
          attendingConsultantName: admissionReq.admittingDoctorName,
          status: 'ADMITTED'
        };
        this.admissions.unshift(createdAdmission);
        saveStored("docsearch_inpatient_admissions", this.admissions);
        saveStored("docsearch_inpatient_beds", this.beds);
        saveStored("docsearch_inpatient_admission_requests", this.requests);
        this.addTrace(req.approverName, req.approverRole, 'APPROVE_ADMISSION', 'INPATIENT_ADMISSION', createdAdmission.admissionNumber, req.justification);
        return createdAdmission;
      }
      if (!isMockFallbackAllowed()) {
        throw new Error(res.error?.message || 'Patient admission failed on server');
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err instanceof Error ? err : new Error('Patient admission network error');
      }
    }

    if (bed) {
      bed.status = 'OCCUPIED';
      bed.currentPatientId = admissionReq.patientId;
      bed.currentPatientName = admissionReq.patientName;
      bed.currentPatientMrn = admissionReq.patientMrn;
      bed.currentAdmissionId = 'adm-' + admissionReq.id;
      bed.lastOccupiedAt = new Date().toISOString();
    }

    const newAdmission: InpatientAdmissionDto = {
      id: 'adm-' + admissionReq.id,
      tenantId: admissionReq.tenantId,
      partnerId: admissionReq.partnerId,
      organizationId: admissionReq.organizationId,
      branchId: admissionReq.branchId,
      admissionNumber: `ADM-${Date.now().toString().slice(-6)}`,
      admissionRequestId: admissionReq.id,
      patientId: admissionReq.patientId,
      patientName: admissionReq.patientName,
      patientMrn: admissionReq.patientMrn,
      patientAge: 45,
      patientGender: 'M',
      wardId: req.allocatedWardId,
      wardName: ward?.wardName || 'Inpatient Ward',
      bedId: req.allocatedBedId,
      bedCode: bed?.bedCode || 'BED-01',
      department: admissionReq.department,
      specialty: admissionReq.specialty,
      attendingConsultantName: admissionReq.admittingDoctorName,
      admittingDoctorName: admissionReq.admittingDoctorName,
      admissionDateTime: new Date().toISOString(),
      expectedDischargeDate: new Date(Date.now() + (admissionReq.expectedLengthOfStayDays || 3) * 24 * 3600 * 1000).toISOString(),
      primaryDiagnosis: admissionReq.provisionalDiagnosis,
      admissionType: admissionReq.isEmergency ? 'EMERGENCY' : 'ELECTIVE',
      admissionSource: admissionReq.admissionSource,
      isolationRequired: false,
      payerType: 'INSURANCE_TPA',
      payerName: 'Apex Health TPA',
      financialDepositAmount: 0,
      clinicalClearance: false,
      billingCleared: false,
      insuranceCleared: false,
      dischargeSummaryFinalized: false,
      status: 'ADMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.admissions.unshift(newAdmission);
    saveStored("docsearch_inpatient_admissions", this.admissions);
    saveStored("docsearch_inpatient_beds", this.beds);
    saveStored("docsearch_inpatient_admission_requests", this.requests);
    this.addTrace(req.approverName, req.approverRole, 'APPROVE_ADMISSION', 'INPATIENT_ADMISSION', newAdmission.admissionNumber, req.justification);
    return newAdmission;
  }

  async rejectAdmission(req: RejectAdmissionRequest): Promise<InpatientAdmissionRequestDto> {
    const r = this.requests.find((x) => x.id === req.requestId);
    if (!r) throw new Error('Admission request not found');
    r.status = 'REJECTED';
    r.decisionNotes = req.reason;
    r.updatedAt = new Date().toISOString();
    this.addTrace(req.rejectorName, 'CHIEF_MEDICAL_OFFICER', 'REJECT_ADMISSION_REQUEST', 'ADMISSION_REQUEST', r.requestNumber, req.reason);
    return r;
  }

  async cancelAdmission(req: CancelAdmissionRequest): Promise<InpatientAdmissionRequestDto> {
    const r = this.requests.find((x) => x.id === req.requestId);
    if (!r) throw new Error('Admission request not found');
    r.status = 'CANCELLED';
    r.decisionNotes = req.reason;
    r.updatedAt = new Date().toISOString();
    this.addTrace(req.cancelledBy, 'ADT_OFFICER', 'CANCEL_ADMISSION_REQUEST', 'ADMISSION_REQUEST', r.requestNumber, req.reason);
    return r;
  }

  async allocateBed(req: AllocateBedRequest): Promise<InpatientAdmissionDto> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (!adm) throw new Error('Admission not found');
    const ward = this.wards.find((w) => w.id === req.wardId);
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (bed) {
      bed.status = 'OCCUPIED';
      bed.currentPatientName = adm.patientName;
      bed.currentPatientMrn = adm.patientMrn;
    }
    adm.wardId = req.wardId;
    adm.wardName = ward?.wardName || adm.wardName;
    adm.bedId = req.bedId;
    adm.bedCode = bed?.bedCode || adm.bedCode;
    adm.updatedAt = new Date().toISOString();
    this.addTrace(req.allocatedBy, 'NURSE_SUPERVISOR', 'ALLOCATE_BED', 'INPATIENT_ADMISSION', adm.admissionNumber, 'Bed allocated');
    return adm;
  }

  async createTransfer(req: CreateTransferRequest): Promise<InpatientTransferDto> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (!adm) throw new Error('Admission not found');
    const destWard = this.wards.find((w) => w.id === req.destinationWardId);
    const newTransfer: InpatientTransferDto = {
      id: 'trf-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      transferNumber: `TRF-${Date.now().toString().slice(-6)}`,
      admissionId: adm.id,
      patientId: adm.patientId,
      patientName: adm.patientName,
      patientMrn: adm.patientMrn,
      sourceWardId: adm.wardId,
      sourceWardName: adm.wardName,
      sourceBedId: adm.bedId,
      sourceBedCode: adm.bedCode,
      destinationWardId: req.destinationWardId,
      destinationWardName: destWard?.wardName || 'Destination Ward',
      transferType: req.transferType,
      priority: req.priority || 'ROUTINE',
      transferReason: req.transferReason,
      requestingDoctorName: req.requestingDoctorName,
      transportRequirement: req.transportRequirement || 'WHEELCHAIR',
      nursingHandoffNotes: req.nursingHandoffNotes,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.transfers.unshift(newTransfer);
    this.addTrace(req.requestingDoctorName, 'PHYSICIAN', 'CREATE_TRANSFER', 'INPATIENT_TRANSFER', newTransfer.transferNumber, req.transferReason);
    return newTransfer;
  }

  async approveTransfer(req: ApproveTransferRequest): Promise<InpatientTransferDto> {
    const trf = this.transfers.find((t) => t.id === req.transferId);
    if (!trf) throw new Error('Transfer not found');
    const bed = this.beds.find((b) => b.id === req.assignedBedId);
    trf.destinationBedId = req.assignedBedId;
    trf.destinationBedCode = bed?.bedCode || 'BED-02';
    trf.status = 'APPROVED';
    trf.approvedAt = new Date().toISOString();
    trf.updatedAt = new Date().toISOString();
    this.addTrace(req.approverName, 'NURSE_SUPERVISOR', 'APPROVE_TRANSFER', 'INPATIENT_TRANSFER', trf.transferNumber, req.justification);
    return trf;
  }

  async completeTransfer(req: CompleteTransferRequest): Promise<InpatientTransferDto> {
    const trf = this.transfers.find((t) => t.id === req.transferId);
    if (!trf) throw new Error('Transfer not found');

    try {
      const res = await apiRequest<InpatientTransferDto>('/api/v1/partner/inpatient/transfers', {
        method: 'POST',
        body: JSON.stringify({
          admissionId: trf.admissionId,
          patientId: trf.patientId,
          sourceBedId: trf.sourceBedId,
          destinationBedId: trf.destinationBedId || req.transferId,
          transferReason: trf.transferReason,
          transferredBy: req.completedBy
        })
      });
      if (res.success && res.data) {
        trf.status = 'COMPLETED';
        trf.completedAt = new Date().toISOString();
        trf.updatedAt = new Date().toISOString();

        const oldBed = this.beds.find((b) => b.id === trf.sourceBedId);
        if (oldBed) {
          oldBed.status = 'AVAILABLE';
          oldBed.currentPatientName = undefined;
          oldBed.currentPatientMrn = undefined;
          oldBed.currentPatientId = undefined;
        }
        const newBed = this.beds.find((b) => b.id === trf.destinationBedId);
        if (newBed) {
          newBed.status = 'OCCUPIED';
          newBed.currentPatientName = trf.patientName;
          newBed.currentPatientMrn = trf.patientMrn;
        }
        const adm = this.admissions.find((a) => a.id === trf.admissionId);
        if (adm) {
          adm.wardId = trf.destinationWardId;
          adm.wardName = trf.destinationWardName;
          adm.bedId = trf.destinationBedId || adm.bedId;
          adm.bedCode = trf.destinationBedCode || adm.bedCode;
        }

        saveStored("docsearch_inpatient_transfers", this.transfers);
        saveStored("docsearch_inpatient_beds", this.beds);
        saveStored("docsearch_inpatient_admissions", this.admissions);
        this.addTrace(req.completedBy, 'RECEIVING_NURSE', 'COMPLETE_TRANSFER', 'INPATIENT_TRANSFER', trf.transferNumber, 'Bedside handover verified');
        return { ...trf, ...res.data };
      }
    } catch {
      // Fallback
    }

    // Free source bed and route to cleaning
    const oldBed = this.beds.find((b) => b.id === trf.sourceBedId);
    if (oldBed) {
      oldBed.status = 'CLEANING';
      oldBed.currentPatientName = undefined;
      oldBed.currentPatientMrn = undefined;
      const turnaround: InpatientBedTurnaroundDto = {
        id: 'trn-' + Math.random().toString(36).substring(2, 9),
        tenantId: req.tenantId,
        partnerId: trf.partnerId,
        organizationId: trf.organizationId,
        branchId: trf.branchId,
        bedId: oldBed.id,
        bedCode: oldBed.bedCode,
        wardId: oldBed.wardId,
        turnaroundNumber: `CLN-${Date.now().toString().slice(-6)}`,
        cleaningType: 'TERMINAL_DISINFECTION',
        status: 'IN_PROGRESS',
        environmentalInspectionPassed: false,
        requestedAt: new Date().toISOString(),
        cleaningStartedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.bedTurnarounds.unshift(turnaround);
    }

    // Occupy destination bed
    const newBed = this.beds.find((b) => b.id === trf.destinationBedId);
    if (newBed) {
      newBed.status = 'OCCUPIED';
      newBed.currentPatientName = trf.patientName;
      newBed.currentPatientMrn = trf.patientMrn;
    }

    // Update admission record
    const adm = this.admissions.find((a) => a.id === trf.admissionId);
    if (adm) {
      adm.wardId = trf.destinationWardId;
      adm.wardName = trf.destinationWardName;
      adm.bedId = trf.destinationBedId || adm.bedId;
      adm.bedCode = trf.destinationBedCode || adm.bedCode;
    }

    trf.status = 'COMPLETED';
    trf.completedAt = new Date().toISOString();
    trf.updatedAt = new Date().toISOString();
    this.addTrace(req.completedBy, 'RECEIVING_NURSE', 'COMPLETE_TRANSFER', 'INPATIENT_TRANSFER', trf.transferNumber, 'Bedside handover verified');
    return trf;
  }

  async recordNursingAssessment(req: RecordNursingAssessmentRequest): Promise<InpatientNursingAssessmentDto> {
    const newAssessment: InpatientNursingAssessmentDto = {
      id: 'ass-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionId: req.admissionId,
      patientId: req.patientId,
      assessedBy: req.assessedBy,
      shiftType: req.shiftType,
      assessmentType: req.assessmentType,
      fallRiskScore: req.fallRiskScore,
      fallRiskLevel: req.fallRiskLevel,
      pressureInjuryRiskScore: req.pressureInjuryRiskScore,
      pressureInjuryRiskLevel: req.pressureInjuryRiskLevel,
      painScore: req.painScore,
      consciousnessLevel: req.consciousnessLevel,
      mobilityStatus: req.mobilityStatus,
      dietaryIntakeLevel: req.dietaryIntakeLevel,
      nursingSummary: req.nursingSummary,
      createdAt: new Date().toISOString()
    };
    this.nursingAssessments.unshift(newAssessment);
    this.addTrace(req.assessedBy, 'STAFF_NURSE', 'RECORD_NURSING_ASSESSMENT', 'NURSING_ASSESSMENT', newAssessment.id, req.nursingSummary);
    return newAssessment;
  }

  async recordNursingNote(req: RecordNursingNoteRequest): Promise<void> {
    try {
      await apiRequest('/api/v1/partner/inpatient/nursing-notes', {
        method: 'POST',
        body: JSON.stringify({
          admissionId: req.admissionId,
          patientId: req.patientId,
          nurseName: req.authorName,
          notes: req.noteContent,
          careObservations: (req as any).shiftHandoverNotes || 'Routine nursing care'
        })
      });
    } catch {
      // Fallback
    }
    this.addTrace(req.authorName, 'STAFF_NURSE', 'RECORD_NURSING_NOTE', 'NURSING_NOTE', req.admissionId, req.noteContent);
  }

  async recordCarePlan(req: RecordCarePlanRequest): Promise<void> {
    this.addTrace(req.createdBy, 'CARE_COORDINATOR', 'RECORD_CARE_PLAN', 'CARE_PLAN', req.admissionId, req.nursingDiagnosis);
  }

  async recordVitalObservation(req: RecordVitalObservationRequest): Promise<InpatientVitalObservationDto> {
    try {
      await apiRequest('/api/v1/partner/inpatient/nursing-notes', {
        method: 'POST',
        body: JSON.stringify({
          admissionId: req.admissionId,
          patientId: req.patientId,
          nurseName: req.recordedBy,
          temperature: req.temperatureCelsius ? `${req.temperatureCelsius} C` : undefined,
          bloodPressure: req.systolicBpMmHg && req.diastolicBpMmHg ? `${req.systolicBpMmHg}/${req.diastolicBpMmHg} mmHg` : undefined,
          pulseRate: req.pulseBpm ? `${req.pulseBpm} bpm` : undefined,
          spO2: req.spo2Percentage ? `${req.spo2Percentage}%` : undefined,
          respiratoryRate: req.respiratoryRateBpm ? `${req.respiratoryRateBpm} bpm` : undefined,
          notes: req.notes || 'Telemetry recorded',
          careObservations: req.isAbnormal ? 'Telemetry abnormal vitals' : 'Routine telemetry vitals'
        })
      });
    } catch {
      // Fallback
    }
    const newVital: InpatientVitalObservationDto = {
      id: 'vit-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionId: req.admissionId,
      patientId: req.patientId,
      recordedBy: req.recordedBy,
      temperatureCelsius: req.temperatureCelsius,
      pulseBpm: req.pulseBpm,
      respiratoryRateBpm: req.respiratoryRateBpm,
      systolicBpMmHg: req.systolicBpMmHg,
      diastolicBpMmHg: req.diastolicBpMmHg,
      spo2Percentage: req.spo2Percentage,
      bloodGlucoseMgDl: req.bloodGlucoseMgDl,
      painScaleScore: req.painScaleScore,
      gcsScore: req.gcsScore,
      isAbnormal: req.isAbnormal ?? false,
      notes: req.notes,
      recordedAt: new Date().toISOString()
    };
    this.vitals.unshift(newVital);
    this.addTrace(req.recordedBy, 'STAFF_NURSE', 'RECORD_VITAL_OBSERVATION', 'VITAL_OBSERVATION', newVital.id, req.notes || 'Telemetry recorded');
    return newVital;
  }

  async recordDoctorRound(req: RecordDoctorRoundRequest): Promise<InpatientDoctorRoundDto> {
    const newRound: InpatientDoctorRoundDto = {
      id: 'rnd-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionId: req.admissionId,
      patientId: req.patientId,
      doctorName: req.doctorName,
      doctorSpecialty: req.doctorSpecialty,
      roundType: req.roundType,
      subjectiveAssessment: req.subjectiveAssessment,
      objectiveClinicalFindings: req.objectiveClinicalFindings,
      clinicalImpression: req.clinicalImpression,
      treatmentPlanUpdates: req.treatmentPlanUpdates,
      orderedInvestigationsSummary: req.orderedInvestigationsSummary,
      medicationAdjustments: req.medicationAdjustments,
      dischargeReadinessScore: req.dischargeReadinessScore || 70,
      roundTimestamp: new Date().toISOString()
    };
    this.rounds.unshift(newRound);
    this.addTrace(req.doctorName, 'ATTENDING_PHYSICIAN', 'RECORD_DOCTOR_ROUND', 'DOCTOR_ROUND', newRound.id, req.clinicalImpression);
    return newRound;
  }

  async createDischargePlan(req: CreateDischargePlanRequest): Promise<InpatientDischargePlanDto> {
    const newPlan: InpatientDischargePlanDto = {
      id: 'dp-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionId: req.admissionId,
      patientId: req.patientId,
      targetDischargeDate: req.targetDischargeDate,
      readinessStatus: 'PLANNING',
      coordinatorName: req.coordinatorName,
      isMedicationReconciled: true,
      isNursingCareHandoverDone: true,
      isBillingCleared: false,
      isInsurancePreApproved: false,
      isDischargeSummaryFinalized: false,
      transportArrangement: req.transportArrangement || 'SELF_TRANSPORT',
      patientEducationSummary: req.patientEducationSummary,
      followUpInstructions: req.followUpInstructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.dischargePlans.unshift(newPlan);
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (adm) {
      adm.status = 'DISCHARGE_PLANNED';
    }
    this.addTrace(req.coordinatorName, 'DISCHARGE_COORDINATOR', 'CREATE_DISCHARGE_PLAN', 'DISCHARGE_PLAN', newPlan.id, 'Discharge roadmap initialized');
    return newPlan;
  }

  async requestDischarge(req: RequestDischargeRequest): Promise<void> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (!adm) throw new Error('Admission not found');
    adm.status = 'DISCHARGE_PLANNED';
    adm.clinicalClearance = true;
    adm.updatedAt = new Date().toISOString();
    this.addTrace(req.requestingDoctorName, 'PHYSICIAN', 'REQUEST_DISCHARGE', 'INPATIENT_ADMISSION', adm.admissionNumber, 'Physician discharge order signed');
  }

  async approveDischarge(req: ApproveDischargeRequest): Promise<void> {
    const adm = this.admissions.find((a) => a.status === 'DISCHARGE_PLANNED');
    if (adm) {
      adm.clinicalClearance = req.clinicalClearance;
      adm.billingCleared = req.financialClearance;
      adm.insuranceCleared = req.insuranceClearance;
      adm.updatedAt = new Date().toISOString();
    }
    this.addTrace(req.authorizedBy, 'DISCHARGE_ADMIN', 'APPROVE_DISCHARGE_CLEARANCES', 'INPATIENT_ADMISSION', adm?.admissionNumber || 'ADM-ALL', 'Multi-department clearance certified');
  }

  async completeDischarge(req: CompleteDischargeRequest): Promise<InpatientAdmissionDto> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    try {
      const res = await apiRequest<InpatientAdmissionDto>(`/api/v1/partner/inpatient/admissions/${req.admissionId}/discharge`, {
        method: 'POST',
        body: JSON.stringify({
          patientId: adm?.patientId || req.admissionId,
          dischargeReason: req.dischargeDisposition || 'Routine clinical recovery',
          dischargeCondition: 'Patient stable on discharge',
          finalClinicalNotes: (req as any).summaryNotes || 'Treatment regimen completed successfully'
        })
      });
      if (res.success && res.data) {
        if (adm) {
          adm.status = 'DISCHARGED';
          adm.actualDischargeDateTime = new Date().toISOString();
          adm.dischargeDisposition = req.dischargeDisposition;
          adm.updatedAt = new Date().toISOString();
          const bed = this.beds.find((b) => b.id === adm.bedId);
          if (bed) {
            bed.status = 'AVAILABLE';
            bed.currentPatientName = undefined;
            bed.currentPatientMrn = undefined;
            bed.currentPatientId = undefined;
            bed.currentAdmissionId = undefined;
          }
          saveStored("docsearch_inpatient_admissions", this.admissions);
          saveStored("docsearch_inpatient_beds", this.beds);
        }
        return { ...(adm || {}), ...res.data } as InpatientAdmissionDto;
      }
    } catch {
      // Fallback
    }
    if (!adm) throw new Error('Admission not found');
    adm.status = 'DISCHARGED';
    adm.actualDischargeDateTime = new Date().toISOString();
    adm.dischargeDisposition = req.dischargeDisposition;
    adm.updatedAt = new Date().toISOString();

    // Release bed & trigger housekeeping turnaround
    const bed = this.beds.find((b) => b.id === adm.bedId);
    if (bed) {
      bed.status = 'CLEANING';
      bed.currentPatientName = undefined;
      bed.currentPatientMrn = undefined;
      bed.currentAdmissionId = undefined;
      const turnaround: InpatientBedTurnaroundDto = {
        id: 'trn-' + Math.random().toString(36).substring(2, 9),
        tenantId: adm.tenantId,
        partnerId: adm.partnerId,
        organizationId: adm.organizationId,
        branchId: adm.branchId,
        bedId: bed.id,
        bedCode: bed.bedCode,
        wardId: bed.wardId,
        turnaroundNumber: `CLN-${Date.now().toString().slice(-6)}`,
        cleaningType: 'TERMINAL_DISINFECTION',
        status: 'IN_PROGRESS',
        environmentalInspectionPassed: false,
        requestedAt: new Date().toISOString(),
        cleaningStartedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.bedTurnarounds.unshift(turnaround);
    }

    this.addTrace(req.dischargedBy, 'DISCHARGE_OFFICER', 'COMPLETE_DISCHARGE', 'INPATIENT_ADMISSION', adm.admissionNumber, 'Discharge finalized & bed released');
    return adm;
  }

  async finalizeDischargeSummary(req: FinalizeDischargeSummaryRequest): Promise<InpatientDischargeSummaryDto> {
    const adm = this.admissions.find((a) => a.id === req.admissionId);
    if (adm) {
      adm.dischargeSummaryFinalized = true;
    }
    const summary: InpatientDischargeSummaryDto = {
      id: 'sum-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      summaryNumber: `DS-${Date.now().toString().slice(-6)}`,
      admissionId: req.admissionId,
      patientId: adm?.patientId || 'pat-001',
      patientName: adm?.patientName || 'Patient',
      patientMrn: adm?.patientMrn || 'MRN-001',
      attendingConsultantName: req.attendingConsultantName,
      admissionDate: adm?.admissionDateTime || new Date().toISOString(),
      dischargeDate: new Date().toISOString(),
      finalPrimaryDiagnosis: req.finalPrimaryDiagnosis,
      finalSecondaryDiagnosis: req.finalSecondaryDiagnosis,
      surgicalProceduresPerformed: req.surgicalProceduresPerformed,
      hospitalCourseSummary: req.hospitalCourseSummary,
      keyInvestigationFindings: req.keyInvestigationFindings,
      treatmentGiven: req.treatmentGiven,
      dischargeMedicationAdvice: req.dischargeMedicationAdvice,
      dietAndActivityAdvice: req.dietAndActivityAdvice,
      warningSignsToSeekImmediateCare: req.warningSignsToSeekImmediateCare,
      followUpAppointmentDate: req.followUpAppointmentDate,
      followUpDoctorName: req.followUpDoctorName,
      isFinalized: true,
      finalizedBy: req.finalizedBy,
      finalizedAt: new Date().toISOString(),
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.dischargeSummaries.unshift(summary);
    this.addTrace(req.finalizedBy, 'ATTENDING_PHYSICIAN', 'FINALIZE_DISCHARGE_SUMMARY', 'DISCHARGE_SUMMARY', summary.summaryNumber, 'Summary sealed and signed');
    return summary;
  }

  async releaseBed(req: ReleaseBedRequest): Promise<InpatientBedDto> {
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (!bed) throw new Error('Bed not found');
    bed.status = 'CLEANING';
    bed.currentPatientName = undefined;
    bed.currentPatientMrn = undefined;
    bed.currentAdmissionId = undefined;
    bed.updatedAt = new Date().toISOString();
    const turnaround: InpatientBedTurnaroundDto = {
      id: 'trn-' + Math.random().toString(36).substring(2, 9),
      tenantId: req.tenantId,
      partnerId: bed.partnerId,
      organizationId: bed.organizationId,
      branchId: bed.branchId,
      bedId: bed.id,
      bedCode: bed.bedCode,
      wardId: bed.wardId,
      turnaroundNumber: `CLN-${Date.now().toString().slice(-6)}`,
      cleaningType: 'TERMINAL_DISINFECTION',
      status: 'IN_PROGRESS',
      environmentalInspectionPassed: false,
      requestedAt: new Date().toISOString(),
      cleaningStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.bedTurnarounds.unshift(turnaround);
    this.saveTenantBeds(req.tenantId || bed.tenantId);
    this.addTrace(req.releasedBy, 'NURSE_SUPERVISOR', 'RELEASE_BED', 'INPATIENT_BED', bed.bedCode, req.reason);
    return bed;
  }

  async completeCleaning(req: CompleteCleaningRequest & { bedId?: string }): Promise<InpatientBedDto> {
    let trn = req.turnaroundId ? this.bedTurnarounds.find((t) => t.id === req.turnaroundId) : undefined;
    if (!trn && req.bedId) {
      trn = this.bedTurnarounds.find((t) => t.bedId === req.bedId && t.status === 'IN_PROGRESS');
    }
    if (trn) {
      trn.status = 'AVAILABLE';
      trn.inspectedBy = req.inspectedBy;
      trn.environmentalInspectionPassed = req.passed;
      trn.cleaningCompletedAt = new Date().toISOString();
    }

    const bed = req.bedId
      ? this.beds.find((b) => b.id === req.bedId)
      : (trn ? this.beds.find((b) => b.id === trn.bedId) : undefined);

    if (!bed) throw new Error('Bed not found for turnaround ticket');
    bed.status = 'AVAILABLE';
    bed.updatedAt = new Date().toISOString();
    this.saveTenantBeds(bed.tenantId);
    this.addTrace(req.inspectedBy || 'Nurse / Housekeeping', 'INFECTION_CONTROL', 'COMPLETE_CLEANING', 'INPATIENT_BED', bed.bedCode, req.notes || 'Terminal disinfection certified');
    return bed;
  }

  async directAdmitPatient(req: DirectAdmitPatientRequest): Promise<InpatientAdmissionDto> {
    this.ensureTenantData(req.tenantId);

    const bed = this.beds.find((b) => b.id === req.bedId);
    const ward = this.wards.find((w) => w.id === req.wardId) || this.wards.find((w) => w.id === bed?.wardId);

    try {
      const res = await apiRequest<InpatientAdmissionDto>('/api/v1/partner/inpatient/admissions', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          branchId: req.branchId,
          patientId: 'pat-' + Math.random().toString(36).substring(2, 9),
          patientName: req.patientName,
          patientMrn: req.patientMrn,
          department: req.department,
          doctorId: req.admittingDoctorName,
          bedId: req.bedId,
          admissionReason: req.provisionalDiagnosis
        })
      });
      if (res.success && res.data) {
        if (bed) {
          bed.status = 'OCCUPIED';
          bed.currentPatientName = req.patientName;
          bed.currentPatientMrn = req.patientMrn;
          bed.currentAdmissionId = res.data.id;
          bed.lastOccupiedAt = new Date().toISOString();
        }
        const adm: InpatientAdmissionDto = {
          ...res.data,
          patientName: req.patientName,
          patientMrn: req.patientMrn,
          patientAge: req.patientAge,
          patientGender: req.patientGender,
          wardId: ward?.id || bed?.wardId || 'wrd-1',
          wardName: ward?.wardName || bed?.wardName || 'Inpatient Ward',
          bedId: req.bedId,
          bedCode: bed?.bedCode || 'BED',
          department: req.department,
          admittingDoctorName: req.admittingDoctorName,
          attendingConsultantName: req.admittingDoctorName,
          primaryDiagnosis: req.provisionalDiagnosis,
          status: 'ADMITTED'
        };
        this.admissions.unshift(adm);
        this.saveTenantBeds(req.tenantId);
        this.saveTenantAdmissions(req.tenantId);
        this.addTrace(req.admittingDoctorName, 'PHYSICIAN', 'DIRECT_ADMIT', 'INPATIENT_BED', bed?.bedCode || req.bedId, req.provisionalDiagnosis);
        return adm;
      }
    } catch {
      // Fallback
    }

    const admId = 'adm-' + Math.random().toString(36).substring(2, 9);
    if (bed) {
      bed.status = 'OCCUPIED';
      bed.currentPatientName = req.patientName;
      bed.currentPatientMrn = req.patientMrn;
      bed.currentAdmissionId = admId;
      bed.lastOccupiedAt = new Date().toISOString();
      bed.updatedAt = new Date().toISOString();
    }

    const newAdmission: InpatientAdmissionDto = {
      id: admId,
      tenantId: req.tenantId,
      partnerId: req.partnerId,
      organizationId: req.organizationId,
      branchId: req.branchId,
      admissionNumber: `ADM-${Date.now().toString().slice(-6)}`,
      patientId: 'pat-' + Math.random().toString(36).substring(2, 9),
      patientName: req.patientName,
      patientMrn: req.patientMrn,
      patientAge: req.patientAge,
      patientGender: req.patientGender,
      wardId: ward?.id || bed?.wardId || 'wrd-1',
      wardName: ward?.wardName || bed?.wardName || 'Inpatient Ward',
      bedId: req.bedId,
      bedCode: bed?.bedCode || 'BED',
      department: req.department,
      specialty: req.department,
      attendingConsultantName: req.admittingDoctorName,
      admittingDoctorName: req.admittingDoctorName,
      admissionDateTime: new Date().toISOString(),
      expectedDischargeDate: new Date(Date.now() + (req.expectedLengthOfStayDays || 3) * 24 * 3600 * 1000).toISOString(),
      primaryDiagnosis: req.provisionalDiagnosis,
      admissionType: (req.admissionType as any) || 'ELECTIVE',
      admissionSource: 'DIRECT_BED_BOARD',
      isolationRequired: false,
      payerType: 'CASH_SELF_PAY',
      payerName: 'Direct Admission',
      financialDepositAmount: 0,
      clinicalClearance: false,
      billingCleared: false,
      insuranceCleared: false,
      dischargeSummaryFinalized: false,
      status: 'ADMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.admissions.unshift(newAdmission);
    this.saveTenantBeds(req.tenantId);
    this.saveTenantAdmissions(req.tenantId);
    this.addTrace(req.admittingDoctorName, 'PHYSICIAN', 'DIRECT_ADMIT', 'INPATIENT_BED', bed?.bedCode || req.bedId, req.provisionalDiagnosis);
    return newAdmission;
  }
}

function mapToInpatientWardDto(w: any): InpatientWardDto {
  return {
    id: String(w.id || ''),
    tenantId: String(w.tenantId || ''),
    partnerId: String(w.partnerId || ''),
    organizationId: String(w.organizationId || ''),
    branchId: String(w.branchId || ''),
    unitId: String(w.unitId || '00000000-0000-4000-8000-000000000001'),
    wardCode: String(w.wardCode || w.code || ''),
    wardName: String(w.name || w.wardName || 'Ward'),
    wardType: (w.wardType || 'GENERAL') as any,
    careLevel: (w.careLevel || 'GENERAL_CARE') as any,
    genderPolicy: String(w.genderPolicy || 'ALL'),
    building: String(w.building || 'Main Block'),
    floor: String(w.floor || w.floorNumber || '1'),
    wing: w.wing || undefined,
    nursingStationName: String(w.nursingStationName || 'Station A'),
    isolationCapable: Boolean(w.isolationCapable),
    ventilatorCapable: Boolean(w.ventilatorCapable),
    totalBeds: Number(w.capacity || w.totalBeds || 0),
    activeBeds: Number(w.activeBeds || w.capacity || 0),
    occupiedBeds: Number(w.occupiedBeds || 0),
    blockedBeds: Number(w.blockedBeds || 0),
    cleaningBeds: Number(w.cleaningBeds || 0),
    isActive: Boolean(w.isActive ?? true),
    createdAt: typeof w.createdAt === 'string' ? w.createdAt : new Date().toISOString(),
    updatedAt: typeof w.updatedAt === 'string' ? w.updatedAt : new Date().toISOString()
  };
}

function mapToInpatientBedDto(b: any): InpatientBedDto {
  return {
    id: String(b.id || ''),
    tenantId: String(b.tenantId || ''),
    partnerId: String(b.partnerId || ''),
    organizationId: String(b.organizationId || ''),
    branchId: String(b.branchId || ''),
    wardId: String(b.wardId || ''),
    wardName: b.wardName || undefined,
    roomId: b.roomId || undefined,
    roomNumber: b.roomNumber || undefined,
    bedCode: String(b.bedNumber || b.bedCode || ''),
    bedNumber: String(b.bedNumber || b.bedCode || ''),
    bedType: (b.bedType || 'STANDARD_MANUAL') as any,
    bedClass: (b.bedClass || 'GENERAL') as any,
    status: (b.status || 'AVAILABLE') as any,
    genderEligibility: String(b.genderEligibility || 'ALL'),
    hasOxygenPort: Boolean(b.hasOxygenPort ?? true),
    hasSuctionPort: Boolean(b.hasSuctionPort ?? true),
    hasVentilator: Boolean(b.hasVentilator ?? false),
    hasCardiacMonitor: Boolean(b.hasCardiacMonitor ?? false),
    dailyChargeRate: Number(b.dailyChargeRate || 1500),
    currentPatientId: b.currentPatientId || undefined,
    currentPatientName: b.currentPatientName || undefined,
    currentPatientMrn: b.currentPatientMrn || undefined,
    currentAdmissionId: b.currentAdmissionId || undefined,
    lastCleanedAt: b.lastCleanedAt || undefined,
    lastOccupiedAt: b.lastOccupiedAt || undefined,
    isActive: Boolean(b.isActive ?? true),
    notes: b.notes || undefined,
    createdAt: typeof b.createdAt === 'string' ? b.createdAt : new Date().toISOString(),
    updatedAt: typeof b.updatedAt === 'string' ? b.updatedAt : new Date().toISOString()
  };
}

function mapToInpatientAdmissionDto(a: any): InpatientAdmissionDto {
  return {
    id: String(a.id || ''),
    tenantId: String(a.tenantId || ''),
    partnerId: String(a.partnerId || ''),
    organizationId: String(a.organizationId || ''),
    branchId: String(a.branchId || ''),
    admissionNumber: String(a.admissionNumber || `ADM-${String(a.id || '').slice(0, 6)}`),
    patientId: String(a.patientId || ''),
    patientName: String(a.patientName || a.patientId || 'Inpatient'),
    patientMrn: String(a.patientMrn || a.patientId || 'MRN-IPD'),
    patientAge: Number(a.patientAge || 35),
    patientGender: (a.patientGender || 'OTHER') as any,
    wardId: String(a.wardId || ''),
    wardName: String(a.wardName || 'Inpatient Ward'),
    bedId: String(a.bedId || ''),
    bedCode: String(a.bedNumber || a.bedCode || 'BED'),
    department: String(a.department || 'GENERAL_MEDICINE'),
    specialty: String(a.department || 'GENERAL_MEDICINE'),
    attendingConsultantName: String(a.attendingDoctorName || a.attendingDoctorId || 'Attending Physician'),
    admittingDoctorName: String(a.admittingDoctorName || a.attendingDoctorId || 'Admitting Physician'),
    admissionDateTime: typeof a.admittedAt === 'string' ? a.admittedAt : (a.admittedAt ? new Date(a.admittedAt).toISOString() : (typeof a.createdAt === 'string' ? a.createdAt : new Date().toISOString())),
    expectedDischargeDate: typeof a.expectedDischargeDate === 'string' ? a.expectedDischargeDate : new Date(Date.now() + 3 * 86400000).toISOString(),
    primaryDiagnosis: String(a.admissionReason || a.primaryDiagnosis || 'Clinical Observation'),
    admissionType: (a.admissionType || 'ELECTIVE') as any,
    admissionSource: (a.admissionSource || 'EMERGENCY_TRANSFER') as any,
    isolationRequired: Boolean(a.isolationRequired),
    payerType: (a.payerType || 'CASH_SELF_PAY') as any,
    payerName: String(a.payerName || 'Direct / TPA'),
    financialDepositAmount: Number(a.financialDepositAmount || 0),
    clinicalClearance: Boolean(a.clinicalClearance ?? true),
    billingCleared: Boolean(a.billingCleared ?? true),
    insuranceCleared: Boolean(a.insuranceCleared ?? true),
    dischargeSummaryFinalized: Boolean(a.dischargeSummaryFinalized),
    status: (a.status || 'ADMITTED') as any,
    createdAt: typeof a.createdAt === 'string' ? a.createdAt : new Date().toISOString(),
    updatedAt: typeof a.updatedAt === 'string' ? a.updatedAt : new Date().toISOString()
  };
}

export class InpatientManagementService extends MockInpatientManagementService implements IInpatientManagementService {
  override async getWards(tenantId: string): Promise<InpatientWardDto[]> {
    try {
      const res = await apiRequest<any[]>('/api/v1/partner/inpatient/wards');
      if (res.success && Array.isArray(res.data)) {
        return res.data.map(mapToInpatientWardDto);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.getWards(tenantId);
  }

  override async createWard(req: CreateWardRequest): Promise<InpatientWardDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/inpatient/wards', {
        method: 'POST',
        body: JSON.stringify({
          wardCode: req.wardCode,
          name: req.wardName,
          wardType: req.wardType,
          capacity: req.totalBeds,
          floorNumber: parseInt(req.floor, 10) || 1
        })
      });
      if (res.success && res.data) {
        return mapToInpatientWardDto(res.data);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createWard(req);
  }

  override async getBeds(tenantId: string): Promise<InpatientBedDto[]> {
    try {
      const res = await apiRequest<any[]>('/api/v1/partner/inpatient/beds');
      if (res.success && Array.isArray(res.data)) {
        return res.data.map(mapToInpatientBedDto);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.getBeds(tenantId);
  }

  override async createBed(req: CreateBedRequest): Promise<InpatientBedDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/inpatient/beds', {
        method: 'POST',
        body: JSON.stringify({
          wardId: req.wardId,
          bedNumber: req.bedNumber || req.bedCode,
          bedType: req.bedType,
          bedClass: req.bedClass,
          dailyChargeRate: req.dailyChargeRate
        })
      });
      if (res.success && res.data) {
        return mapToInpatientBedDto(res.data);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createBed(req);
  }

  override async getAdmissions(tenantId: string): Promise<InpatientAdmissionDto[]> {
    try {
      const res = await apiRequest<any[]>('/api/v1/partner/inpatient/admissions');
      if (res.success && Array.isArray(res.data)) {
        return res.data.map(mapToInpatientAdmissionDto);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.getAdmissions(tenantId);
  }

  override async directAdmitPatient(req: DirectAdmitPatientRequest): Promise<InpatientAdmissionDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/inpatient/admissions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: req.patientMrn,
          doctorId: req.admittingDoctorName,
          bedId: req.bedId,
          department: req.department,
          admissionReason: req.provisionalDiagnosis,
          encounterType: 'INPATIENT'
        })
      });
      if (res.success && res.data) {
        return mapToInpatientAdmissionDto({
          ...res.data,
          patientName: req.patientName,
          patientMrn: req.patientMrn,
          patientAge: req.patientAge,
          patientGender: req.patientGender === 'M' ? 'MALE' : req.patientGender === 'F' ? 'FEMALE' : 'OTHER',
          bedId: req.bedId,
          department: req.department,
          admittingDoctorName: req.admittingDoctorName,
          admissionReason: req.provisionalDiagnosis
        });
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.directAdmitPatient(req);
  }

  override async createTransfer(req: CreateTransferRequest): Promise<InpatientTransferDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/inpatient/transfers', {
        method: 'POST',
        body: JSON.stringify({
          admissionId: req.admissionId,
          transferReason: req.transferReason
        })
      });
      if (res.success && res.data) {
        return {
          id: res.data.id || String(Math.random()),
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          branchId: req.branchId,
          transferNumber: `TRF-${Date.now().toString().slice(-6)}`,
          admissionId: req.admissionId,
          patientId: 'patient-id',
          patientName: 'Transferred Patient',
          patientMrn: 'MRN',
          destinationWardId: req.destinationWardId,
          destinationWardName: 'Ward',
          transferReason: req.transferReason,
          transferType: req.transferType,
          priority: req.priority,
          requestingDoctorName: req.requestingDoctorName,
          transportRequirement: req.transportRequirement,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        } as any;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.createTransfer(req);
  }

  override async completeDischarge(req: CompleteDischargeRequest): Promise<InpatientAdmissionDto> {
    try {
      const res = await apiRequest<any>(`/api/v1/partner/inpatient/admissions/${req.admissionId}/discharge`, {
        method: 'POST',
        body: JSON.stringify({
          dischargeType: req.dischargeDisposition,
          dischargeSummary: 'Discharged from care'
        })
      });
      if (res.success && res.data) {
        return mapToInpatientAdmissionDto(res.data);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.completeDischarge(req);
  }

  override async recordDoctorRound(req: RecordDoctorRoundRequest): Promise<InpatientDoctorRoundDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/inpatient/rounds', {
        method: 'POST',
        body: JSON.stringify({
          admissionId: req.admissionId,
          roundNotes: req.clinicalImpression || req.subjectiveAssessment,
          planOfCare: req.treatmentPlanUpdates
        })
      });
      if (res.success && res.data) {
        return {
          id: res.data.id || String(Math.random()),
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          branchId: req.branchId,
          admissionId: req.admissionId,
          patientId: req.patientId,
          doctorName: req.doctorName,
          doctorSpecialty: req.doctorSpecialty,
          roundType: req.roundType,
          subjectiveAssessment: req.subjectiveAssessment,
          objectiveClinicalFindings: req.objectiveClinicalFindings,
          clinicalImpression: req.clinicalImpression,
          treatmentPlanUpdates: req.treatmentPlanUpdates,
          orderedInvestigationsSummary: req.orderedInvestigationsSummary,
          medicationAdjustments: req.medicationAdjustments,
          dischargeReadinessScore: req.dischargeReadinessScore || 70,
          roundTimestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.recordDoctorRound(req);
  }

  override async recordVitalObservation(req: RecordVitalObservationRequest): Promise<InpatientVitalObservationDto> {
    try {
      const res = await apiRequest<any>('/api/v1/partner/inpatient/vitals', {
        method: 'POST',
        body: JSON.stringify({
          admissionId: req.admissionId,
          systolicBp: req.systolicBpMmHg,
          diastolicBp: req.diastolicBpMmHg,
          heartRate: req.pulseBpm,
          temperatureF: req.temperatureCelsius ? (req.temperatureCelsius * 9/5 + 32) : undefined,
          respiratoryRate: req.respiratoryRateBpm,
          spo2Percent: req.spo2Percentage,
          consciousnessLevel: req.gcsScore && req.gcsScore < 15 ? 'CONFUSED' : 'ALERT'
        })
      });
      if (res.success && res.data) {
        return {
          id: res.data.id || String(Math.random()),
          tenantId: req.tenantId,
          partnerId: req.partnerId,
          organizationId: req.organizationId,
          branchId: req.branchId,
          admissionId: req.admissionId,
          patientId: req.patientId,
          recordedBy: req.recordedBy,
          temperatureCelsius: req.temperatureCelsius,
          pulseBpm: req.pulseBpm,
          respiratoryRateBpm: req.respiratoryRateBpm,
          systolicBpMmHg: req.systolicBpMmHg,
          diastolicBpMmHg: req.diastolicBpMmHg,
          spo2Percentage: req.spo2Percentage,
          bloodGlucoseMgDl: req.bloodGlucoseMgDl,
          painScaleScore: req.painScaleScore,
          gcsScore: req.gcsScore,
          isAbnormal: req.isAbnormal ?? false,
          notes: req.notes,
          recordedAt: new Date().toISOString()
        };
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.recordVitalObservation(req);
  }

  override async recordNursingNote(req: RecordNursingNoteRequest): Promise<void> {
    try {
      await apiRequest<any>('/api/v1/partner/inpatient/nursing-notes', {
        method: 'POST',
        body: JSON.stringify({
          admissionId: req.admissionId,
          noteType: req.noteType,
          noteContent: req.noteContent
        })
      });
      return;
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return super.recordNursingNote(req);
  }
}

export const inpatientManagementService = new InpatientManagementService();


