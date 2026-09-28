import React, { useState, useEffect, useCallback } from 'react';
import { Alert, DocSearchSpatialCore3D } from '@docsearch/ui-kit';
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

import { inpatientManagementService } from '../services/inpatient-management-service.js';
import { hospitalEventBus, type ActivePatientSummary, type HospitalEventPayload } from '../services/hospital-event-bus.js';

// Views
import { InpatientOverviewView } from './views/InpatientOverviewView.js';
import { AdmissionRequestView } from './views/AdmissionRequestView.js';
import { AdmissionDetailView } from './views/AdmissionDetailView.js';
import { BedManagementView } from './views/BedManagementView.js';
import { BedAvailabilityView } from './views/BedAvailabilityView.js';
import { WardDirectoryView } from './views/WardDirectoryView.js';
import { WardDetailView } from './views/WardDetailView.js';
import { BedDetailView } from './views/BedDetailView.js';
import { LiveIcuTelemetryCodeBlueView } from './views/LiveIcuTelemetryCodeBlueView.js';
import { NursingStationView } from './views/NursingStationView.js';
import { PatientCensusView } from './views/PatientCensusView.js';
import { PatientLocationView } from './views/PatientLocationView.js';
import { TransferManagementView } from './views/TransferManagementView.js';
import { TransferDetailView } from './views/TransferDetailView.js';
import { NursingCareView } from './views/NursingCareView.js';
import { VitalObservationView } from './views/VitalObservationView.js';
import { DoctorRoundsView } from './views/DoctorRoundsView.js';
import { DischargePlanningView } from './views/DischargePlanningView.js';
import { DischargeWorkbenchView } from './views/DischargeWorkbenchView.js';
import { DischargeSummaryView } from './views/DischargeSummaryView.js';
import { BedTurnaroundView } from './views/BedTurnaroundView.js';
import { BedBlockManagementView } from './views/BedBlockManagementView.js';
import { IPDAnalyticsView } from './views/IPDAnalyticsView.js';
import { IPDReportsView } from './views/IPDReportsView.js';
import { IPDAuditVaultView } from './views/IPDAuditVaultView.js';
import { BedOccupancyAnalyticsView } from './views/BedOccupancyAnalyticsView.js';
import { InstantNhcxAutoAdjudicationView } from './views/InstantNhcxAutoAdjudicationView.js';
import { SmartHospitalIotBedOrchestrationView } from './views/SmartHospitalIotBedOrchestrationView.js';
import { TabOverflowMenu } from './common/TabOverflowMenu.js';

// Dialogs
import { CreateWardDialog } from './dialogs/CreateWardDialog.js';
import { EditWardDialog } from './dialogs/EditWardDialog.js';
import { CreateBedDialog } from './dialogs/CreateBedDialog.js';
import { EditBedDialog } from './dialogs/EditBedDialog.js';
import { BlockBedDialog } from './dialogs/BlockBedDialog.js';
import { CreateBedReservationDialog } from './dialogs/CreateBedReservationDialog.js';
import { CancelBedReservationDialog } from './dialogs/CancelBedReservationDialog.js';
import { CreateAdmissionRequestDialog } from './dialogs/CreateAdmissionRequestDialog.js';
import { ApproveAdmissionDialog } from './dialogs/ApproveAdmissionDialog.js';
import { RejectAdmissionDialog } from './dialogs/RejectAdmissionDialog.js';
import { CancelAdmissionDialog } from './dialogs/CancelAdmissionDialog.js';
import { AllocateBedDialog } from './dialogs/AllocateBedDialog.js';
import { CreateTransferDialog } from './dialogs/CreateTransferDialog.js';
import { ApproveTransferDialog } from './dialogs/ApproveTransferDialog.js';
import { CompleteTransferDialog } from './dialogs/CompleteTransferDialog.js';
import { NursingAssessmentDialog } from './dialogs/NursingAssessmentDialog.js';
import { NursingNoteDialog } from './dialogs/NursingNoteDialog.js';
import { CarePlanDialog } from './dialogs/CarePlanDialog.js';
import { RecordVitalDialog } from './dialogs/RecordVitalDialog.js';
import { DoctorRoundDialog } from './dialogs/DoctorRoundDialog.js';
import { CreateDischargePlanDialog } from './dialogs/CreateDischargePlanDialog.js';
import { RequestDischargeDialog } from './dialogs/RequestDischargeDialog.js';
import { ApproveDischargeDialog } from './dialogs/ApproveDischargeDialog.js';
import { CompleteDischargeDialog } from './dialogs/CompleteDischargeDialog.js';
import { FinalizeDischargeSummaryDialog } from './dialogs/FinalizeDischargeSummaryDialog.js';
import { ReleaseBedDialog } from './dialogs/ReleaseBedDialog.js';
import { CompleteCleaningDialog } from './dialogs/CompleteCleaningDialog.js';
import { DirectAdmitBedDialog } from './dialogs/DirectAdmitBedDialog.js';

export interface InpatientDomainManagerProps {
  tenantId?: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string | null;
  initialTab?: InpatientTab;
}

export type InpatientTab =
  | 'overview'
  | 'icu-telemetry'
  | 'admissions'
  | 'admission-detail'
  | 'bed-board'
  | 'bed-availability'
  | 'wards'
  | 'ward-detail'
  | 'bed-detail'
  | 'nursing-station'
  | 'patient-census'
  | 'patient-locations'
  | 'transfers'
  | 'transfer-detail'
  | 'nursing-care'
  | 'vitals'
  | 'rounds'
  | 'discharge-planning'
  | 'discharge-workbench'
  | 'nhcx-auto-discharge'
  | 'discharge-summaries'
  | 'bed-turnaround'
  | 'smart-hospital-iot'
  | 'bed-blocks'
  | 'analytics'
  | 'reports'
  | 'audit'
  | 'occupancy-analytics';

export const InpatientDomainManager: React.FC<InpatientDomainManagerProps> = ({
  tenantId = '11111111-1111-4111-8111-111111111111',
  partnerId = '22222222-2222-4222-8222-222222222222',
  organizationId = '33333333-3333-4333-8333-333333333333',
  branchId = '44444444-4444-4444-8444-444444444444',
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<InpatientTab>(initialTab || 'bed-board');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Listen for Universal Command Palette "Bed 204" trigger
  useEffect(() => {
    const handleOpenBed = () => {
      setActiveTab('icu-telemetry');
    };
    window.addEventListener('docsearch:open_bed_monitor', handleOpenBed);
    return () => window.removeEventListener('docsearch:open_bed_monitor', handleOpenBed);
  }, []);
  const [metrics, setMetrics] = useState<InpatientOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<InpatientAnalyticsDto | null>(null);
  const [units, setUnits] = useState<InpatientUnitDto[]>([]);
  const [wards, setWards] = useState<InpatientWardDto[]>([]);
  const [selectedWard, setSelectedWard] = useState<InpatientWardDto | null>(null);
  const [beds, setBeds] = useState<InpatientBedDto[]>([]);
  const [selectedBed, setSelectedBed] = useState<InpatientBedDto | null>(null);
  const [requests, setRequests] = useState<InpatientAdmissionRequestDto[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<InpatientAdmissionRequestDto | null>(null);
  const [admissions, setAdmissions] = useState<InpatientAdmissionDto[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<InpatientAdmissionDto | null>(null);
  const [transfers, setTransfers] = useState<InpatientTransferDto[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<InpatientTransferDto | null>(null);
  const [nursingAssessments, setNursingAssessments] = useState<InpatientNursingAssessmentDto[]>([]);
  const [vitals, setVitals] = useState<InpatientVitalObservationDto[]>([]);
  const [rounds, setRounds] = useState<InpatientDoctorRoundDto[]>([]);
  const [dischargePlans, setDischargePlans] = useState<InpatientDischargePlanDto[]>([]);
  const [dischargeSummaries, setDischargeSummaries] = useState<InpatientDischargeSummaryDto[]>([]);
  const [bedTurnarounds, setBedTurnarounds] = useState<InpatientBedTurnaroundDto[]>([]);
  const [selectedTurnaround, setSelectedTurnaround] = useState<InpatientBedTurnaroundDto | null>(null);
  const [bedBlocks, setBedBlocks] = useState<InpatientBedBlockDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<InpatientAuditTraceDto[]>([]);
  const [activePatient, setActivePatient] = useState<ActivePatientSummary | null>(() => hospitalEventBus.getActivePatient());

  // Dialog open states
  const [isCreateWardOpen, setIsCreateWardOpen] = useState(false);
  const [isEditWardOpen, setIsEditWardOpen] = useState(false);
  const [isCreateBedOpen, setIsCreateBedOpen] = useState(false);
  const [isEditBedOpen, setIsEditBedOpen] = useState(false);
  const [isBlockBedOpen, setIsBlockBedOpen] = useState(false);
  const [isReserveBedOpen, setIsReserveBedOpen] = useState(false);
  const [isCancelReservationOpen, setIsCancelReservationOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [isApproveAdmissionOpen, setIsApproveAdmissionOpen] = useState(false);
  const [isRejectAdmissionOpen, setIsRejectAdmissionOpen] = useState(false);
  const [isCancelAdmissionOpen, setIsCancelAdmissionOpen] = useState(false);
  const [isAllocateBedOpen, setIsAllocateBedOpen] = useState(false);
  const [isCreateTransferOpen, setIsCreateTransferOpen] = useState(false);
  const [isApproveTransferOpen, setIsApproveTransferOpen] = useState(false);
  const [isCompleteTransferOpen, setIsCompleteTransferOpen] = useState(false);
  const [isNursingAssessmentOpen, setIsNursingAssessmentOpen] = useState(false);
  const [isNursingNoteOpen, setIsNursingNoteOpen] = useState(false);
  const [isCarePlanOpen, setIsCarePlanOpen] = useState(false);
  const [isRecordVitalOpen, setIsRecordVitalOpen] = useState(false);
  const [isDoctorRoundOpen, setIsDoctorRoundOpen] = useState(false);
  const [isCreateDischargePlanOpen, setIsCreateDischargePlanOpen] = useState(false);
  const [isRequestDischargeOpen, setIsRequestDischargeOpen] = useState(false);
  const [isApproveDischargeOpen, setIsApproveDischargeOpen] = useState(false);
  const [isCompleteDischargeOpen, setIsCompleteDischargeOpen] = useState(false);
  const [isFinalizeSummaryOpen, setIsFinalizeSummaryOpen] = useState(false);
  const [isReleaseBedOpen, setIsReleaseBedOpen] = useState(false);
  const [isCompleteCleaningOpen, setIsCompleteCleaningOpen] = useState(false);
  const [isDirectAdmitOpen, setIsDirectAdmitOpen] = useState(false);

  const [notification, setNotification] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const showNotification = (message: string, variant: 'success' | 'danger' = 'success') => {
    setNotification({ message, variant });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [
        m,
        a,
        uList,
        wList,
        bList,
        reqList,
        admList,
        trfList,
        naList,
        vitList,
        rndList,
        dpList,
        dsList,
        trnList,
        blkList,
        audList
      ] = await Promise.all([
        inpatientManagementService.getOverviewMetrics(tenantId),
        inpatientManagementService.getAnalytics(tenantId),
        inpatientManagementService.getUnits(tenantId),
        inpatientManagementService.getWards(tenantId),
        inpatientManagementService.getBeds(tenantId),
        inpatientManagementService.getAdmissionRequests(tenantId),
        inpatientManagementService.getAdmissions(tenantId),
        inpatientManagementService.getTransfers(tenantId),
        inpatientManagementService.getNursingAssessments(tenantId),
        inpatientManagementService.getVitalObservations(tenantId),
        inpatientManagementService.getDoctorRounds(tenantId),
        inpatientManagementService.getDischargePlans(tenantId),
        inpatientManagementService.getDischargeSummaries(tenantId),
        inpatientManagementService.getBedTurnarounds(tenantId),
        inpatientManagementService.getBedBlocks(tenantId),
        inpatientManagementService.getAuditTraces(tenantId)
      ]);
      setMetrics(m);
      setAnalytics(a);
      setUnits(uList);
      setWards(wList);
      setBeds(bList);
      let mergedRequests = reqList;
      try {
        const storedAdms = typeof window !== 'undefined' ? localStorage.getItem('docsearch_admission_requests') : null;
        if (storedAdms) {
          const parsedAdms = JSON.parse(storedAdms);
          if (Array.isArray(parsedAdms) && parsedAdms.length > 0) {
            const extra = parsedAdms.filter((pa: any) => !reqList.some((r) => r.id === pa.id));
            mergedRequests = [...extra, ...reqList];
          }
        }
      } catch {}
      setRequests(mergedRequests);
      setAdmissions(admList);
      setTransfers(trfList);
      setNursingAssessments(naList);
      setVitals(vitList);
      setRounds(rndList);
      setDischargePlans(dpList);
      setDischargeSummaries(dsList);
      setBedTurnarounds(trnList);
      setBedBlocks(blkList);
      setAuditTraces(audList);
    } catch {
      showNotification('Failed to load inpatient records.', 'danger');
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();

    const unsubscribe = hospitalEventBus.subscribe('PATIENT_SELECTED', (payload: HospitalEventPayload) => {
      const selected = payload.data as ActivePatientSummary;
      if (selected && (selected.id || selected.uhid)) {
        setActivePatient(selected);
      }
    });

    const unsubscribeClear = hospitalEventBus.subscribe('PATIENT_CLEARED', () => {
      setActivePatient(null);
    });

    const unsubscribeAdmission = hospitalEventBus.subscribe('IPD_ADMISSION_REQUESTED', (payload: HospitalEventPayload) => {
      const d = payload.data || {};
      showNotification(`⚡ New Inpatient Admission Requested from OPD: ${d.patientName || 'Patient'}`);
      void loadData();
    });

    return () => {
      unsubscribe();
      unsubscribeClear();
      unsubscribeAdmission();
    };
  }, [loadData]);

  // Handlers
  const handleCreateWard = async (req: CreateWardRequest) => {
    await inpatientManagementService.createWard(req);
    await loadData();
    showNotification(`Ward ${req.wardName} registered successfully.`);
  };

  const handleUpdateWard = async (req: UpdateWardRequest) => {
    const updated = await inpatientManagementService.updateWard(req);
    setSelectedWard(updated);
    await loadData();
    showNotification('Ward configuration updated.');
  };

  const handleCreateBed = async (req: CreateBedRequest) => {
    await inpatientManagementService.createBed(req);
    await loadData();
    showNotification(`Bed ${req.bedCode} registered in ward.`);
  };

  const handleUpdateBed = async (req: UpdateBedRequest) => {
    const updated = await inpatientManagementService.updateBed(req);
    setSelectedBed(updated);
    await loadData();
    showNotification('Bed equipment attributes updated.');
  };

  const handleBlockBed = async (req: BlockBedRequest) => {
    await inpatientManagementService.blockBed(req);
    await loadData();
    showNotification('Bed placed under maintenance block.', 'danger');
  };

  const handleCreateReservation = async (req: CreateBedReservationRequest) => {
    await inpatientManagementService.createBedReservation(req);
    await loadData();
    showNotification('Bed reserved for patient.');
  };

  const handleCancelReservation = async (req: CancelBedReservationRequest) => {
    await inpatientManagementService.cancelBedReservation(req);
    await loadData();
    showNotification('Bed reservation released.');
  };

  const handleCreateAdmissionRequest = async (req: CreateAdmissionRequest) => {
    const created = await inpatientManagementService.createAdmissionRequest(req);
    await loadData();
    showNotification(`Admission request ${created.requestNumber} logged.`);
  };

  const handleApproveAdmission = async (req: ApproveAdmissionRequest) => {
    const adm = await inpatientManagementService.approveAdmission(req);
    setSelectedAdmission(adm);
    await loadData();
    showNotification(`Admission ${adm.admissionNumber} authorized & patient admitted.`);
  };

  const handleRejectAdmission = async (req: RejectAdmissionRequest) => {
    await inpatientManagementService.rejectAdmission(req);
    await loadData();
    showNotification('Admission request rejected.', 'danger');
  };

  const handleCancelAdmission = async (req: CancelAdmissionRequest) => {
    await inpatientManagementService.cancelAdmission(req);
    await loadData();
    showNotification('Admission request cancelled.');
  };

  const handleAllocateBed = async (req: AllocateBedRequest) => {
    const adm = await inpatientManagementService.allocateBed(req);
    setSelectedAdmission(adm);
    await loadData();
    showNotification('Bed assigned to inpatient.');
  };

  const handleCreateTransfer = async (req: CreateTransferRequest) => {
    const trf = await inpatientManagementService.createTransfer(req);
    setSelectedTransfer(trf);
    await loadData();
    showNotification(`Transfer request ${trf.transferNumber} raised.`);
  };

  const handleApproveTransfer = async (req: ApproveTransferRequest) => {
    const trf = await inpatientManagementService.approveTransfer(req);
    setSelectedTransfer(trf);
    await loadData();
    showNotification(`Transfer ${trf.transferNumber} destination bed approved.`);
  };

  const handleCompleteTransfer = async (req: CompleteTransferRequest) => {
    const trf = await inpatientManagementService.completeTransfer(req);
    setSelectedTransfer(trf);
    await loadData();
    showNotification(`Transfer ${trf.transferNumber} finalized and bed occupied.`);
  };

  const handleRecordNursingAssessment = async (req: RecordNursingAssessmentRequest) => {
    await inpatientManagementService.recordNursingAssessment(req);
    await loadData();
    showNotification('Nursing assessment saved.');
  };

  const handleRecordNursingNote = async (req: RecordNursingNoteRequest) => {
    await inpatientManagementService.recordNursingNote(req);
    await loadData();
    showNotification('Nursing clinical note logged.');
  };

  const handleRecordCarePlan = async (req: RecordCarePlanRequest) => {
    await inpatientManagementService.recordCarePlan(req);
    await loadData();
    showNotification('Nursing care plan updated.');
  };

  const handleRecordVital = async (req: RecordVitalObservationRequest) => {
    await inpatientManagementService.recordVitalObservation(req);
    await loadData();
    showNotification('Vitals observation recorded.');
  };

  const handleRecordDoctorRound = async (req: RecordDoctorRoundRequest) => {
    await inpatientManagementService.recordDoctorRound(req);
    await loadData();
    showNotification('Doctor round note signed.');
  };

  const handleCreateDischargePlan = async (req: CreateDischargePlanRequest) => {
    await inpatientManagementService.createDischargePlan(req);
    await loadData();
    showNotification('Discharge plan initiated.');
  };

  const handleRequestDischarge = async (req: RequestDischargeRequest) => {
    await inpatientManagementService.requestDischarge(req);
    await loadData();
    showNotification('Discharge order signed by physician.');
  };

  const handleApproveDischarge = async (req: ApproveDischargeRequest) => {
    await inpatientManagementService.approveDischarge(req);
    await loadData();
    showNotification('Discharge clearances authorized.');
  };

  const handleCompleteDischarge = async (req: CompleteDischargeRequest) => {
    const adm = await inpatientManagementService.completeDischarge(req);
    setSelectedAdmission(adm);
    await loadData();
    showNotification(`Patient ${adm.patientName} discharged and bed released.`);
  };

  const handleFinalizeDischargeSummary = async (req: FinalizeDischargeSummaryRequest) => {
    const ds = await inpatientManagementService.finalizeDischargeSummary(req);
    await loadData();
    showNotification(`Discharge summary ${ds.summaryNumber} sealed.`);
  };

  const handleReleaseBed = async (req: ReleaseBedRequest) => {
    await inpatientManagementService.releaseBed(req);
    await loadData();
    showNotification('Bed released to housekeeping queue.');
  };

  const handleCompleteCleaning = async (req: CompleteCleaningRequest) => {
    await inpatientManagementService.completeCleaning(req);
    await loadData();
    showNotification('Bed sanitization certified. Bed is now AVAILABLE.');
  };

  const handleQuickCompleteCleaning = async (bed: InpatientBedDto) => {
    await inpatientManagementService.completeCleaning({
      turnaroundId: '',
      bedId: bed.id,
      inspectedBy: 'Nursing Supervisor',
      passed: true,
      tenantId,
      notes: 'Bed sanitized and ready for new patient admission'
    });
    await loadData();
    showNotification(`✅ Bed ${bed.bedCode} sanitized and ready for new patient admission.`);
  };

  const handleDirectAdmit = async (data: {
    patientName: string;
    patientMrn: string;
    patientAge: number;
    patientGender: 'M' | 'F' | 'OTHER';
    bedId: string;
    wardId: string;
    admittingDoctorName: string;
    department: string;
    provisionalDiagnosis: string;
    admissionType: 'EMERGENCY' | 'ELECTIVE';
    expectedLengthOfStayDays: number;
  }) => {
    await inpatientManagementService.directAdmitPatient({
      tenantId,
      partnerId,
      organizationId,
      branchId: branchId || '44444444-4444-4444-8444-444444444444',
      patientName: data.patientName,
      patientMrn: data.patientMrn,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      bedId: data.bedId,
      wardId: data.wardId,
      admittingDoctorName: data.admittingDoctorName,
      department: data.department,
      provisionalDiagnosis: data.provisionalDiagnosis,
      admissionType: data.admissionType,
      expectedLengthOfStayDays: data.expectedLengthOfStayDays
    });
    await loadData();
    showNotification(`✅ Patient ${data.patientName} admitted to bed successfully.`);
  };

  const safeBeds = Array.isArray(beds) ? beds : [];
  const safeAdmissions = Array.isArray(admissions) ? admissions : [];
  const safeRequests = Array.isArray(requests) ? requests : [];

  const totalBedsCount = safeBeds.length;
  const occupiedBedsCount = safeBeds.filter((b) => b?.status === 'OCCUPIED').length;
  const availableBedsCount = safeBeds.filter((b) => b?.status === 'AVAILABLE').length;
  const cleaningBedsCount = safeBeds.filter((b) => b?.status === 'CLEANING').length;
  const icuBedsOccupied = safeBeds.filter((b) => b?.status === 'OCCUPIED' && ((b?.wardName || '').toLowerCase().includes('icu') || (b?.bedCode || '').includes('ICU'))).length;
  const plannedDischargesCount = safeAdmissions.filter((a) => a?.status === 'DISCHARGE_PLANNED').length;
  const activeInpatientsCount = safeAdmissions.filter((a) => a?.status === 'ADMITTED' || a?.status === 'DISCHARGE_PLANNED').length;

  const primaryDailyTabs: { id: InpatientTab; label: string; icon: string; count?: number }[] = [
    { id: 'bed-board', label: '1. Bed Master Board', icon: '🛏️', count: availableBedsCount },
    { id: 'nursing-station', label: '2. Nursing Station', icon: '🩺', count: activeInpatientsCount },
    { id: 'patient-census', label: '3. Daily Patient Census', icon: '📋', count: activeInpatientsCount },
    { id: 'rounds', label: '4. Doctor Daily Rounds', icon: '👨‍⚕️' },
    { id: 'admissions', label: '5. Admission Requests', icon: '📝', count: safeRequests.filter((r) => r?.status === 'SUBMITTED').length },
    { id: 'discharge-workbench', label: '6. Discharge & Clearances', icon: '🚪', count: plannedDischargesCount }
  ];

  const secondaryFacilityTabs: { id: InpatientTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'ADT Command Desk & Census', icon: '🎛️' },
    { id: 'icu-telemetry', label: 'Live ICU Telemetry & Code Blue', icon: '🚨' },
    { id: 'bed-availability', label: 'Bed Availability Matrix', icon: '🟢' },
    { id: 'patient-locations', label: 'Patient Locations Directory', icon: '📍' },
    { id: 'transfers', label: 'Transfers (ADT)', icon: '⇄' },
    { id: 'nursing-care', label: 'Nursing Assessments & Care Plans', icon: '📑' },
    { id: 'vitals', label: 'Inpatient Vitals Flowsheet', icon: '💓' },
    { id: 'discharge-planning', label: 'Discharge Anticipation & Planning', icon: '🗓️' },
    { id: 'occupancy-analytics', label: 'Bed Occupancy Analytics', icon: '📊' },
    { id: 'bed-turnaround', label: 'Housekeeping Turnaround', icon: '🧹' },
    { id: 'wards', label: 'Ward Directory', icon: '🏢' },
    { id: 'bed-blocks', label: 'Maintenance Blocks', icon: '⚠️' },
    { id: 'nhcx-auto-discharge', label: '⚡ Zero-Wait NHCX Discharge', icon: '⚡' },
    { id: 'smart-hospital-iot', label: '📡 Smart IoT Bed Orchestrator', icon: '📡' },
    { id: 'discharge-summaries', label: 'Discharge Summaries Archive', icon: '📜' },
    { id: 'analytics', label: 'IPD Analytics', icon: '📈' },
    { id: 'reports', label: 'Regulatory Reports', icon: '📑' },
    { id: 'audit', label: 'Audit Vault', icon: '🔒' }
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* 3D Spatial Feature Core: Inpatient IPD */}
      <DocSearchSpatialCore3D
        preset="inpatient"
        height={360}
        interactive={true}
        onNodeClick={(id) => {
          if (id === 'bed-board') {
            setActiveTab('bed-board');
          } else if (id === 'nursing-desk') {
            setActiveTab('nursing-station');
          } else if (id === 'ot-surgery') {
            setActiveTab('rounds');
          } else if (id === 'sbar-handover') {
            setActiveTab('patient-census');
          } else if (id === 'diet-kitchen') {
            setActiveTab('overview');
          } else if (id === 'icu-telemetry') {
            setActiveTab('smart-hospital-iot');
          } else if (id === 'discharge-clearance') {
            setActiveTab('discharge-workbench');
          }
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--ds-color-primary)', color: 'var(--ds-color-primary-foreground, white)', padding: '0.25rem 0.75rem', borderRadius: '6px', fontWeight: 800 }}>
          🏥 HOSPITAL IPD OPERATIONAL MATRIX
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-muted)' }}>
          Tenant: {tenantId.slice(0, 8)}... | Branch: {branchId ? branchId.slice(0, 8) : 'All'}...
        </span>
      </div>

      {notification && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert type={notification.variant === 'danger' ? 'error' : 'success'}>{notification.message}</Alert>
        </div>
      )}

      {/* Real-World Hospital Live Shift Handover & Census Ribbon */}
      <div style={{
        backgroundColor: 'var(--ds-color-surface)',
        border: '1.5px solid var(--ds-color-border)',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.5rem' }}>🏥</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: 'var(--ds-color-text-primary)', fontSize: '0.95rem' }}>
                Live Hospital Census & Shift Handover
              </strong>
              <span style={{ backgroundColor: 'var(--ds-color-success)', color: 'var(--ds-color-success-foreground, white)', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                LIVE TELEMETRY
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
              Real-time occupancy and operational telemetry across all inpatient wards, ICUs, and nursing stations
            </div>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--ds-color-primary-subtle, rgba(2, 132, 199, 0.15))', border: '1px solid var(--ds-color-primary)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-accent)', fontWeight: 700 }}>Total Inpatients</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--ds-color-primary)', fontWeight: 900 }}>{activeInpatientsCount}</div>
          </div>
          <div style={{ backgroundColor: 'var(--ds-color-success-subtle, rgba(16, 185, 129, 0.15))', border: '1px solid var(--ds-color-success)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-success)', fontWeight: 700 }}>Available Beds</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--ds-color-success)', fontWeight: 900 }}>{availableBedsCount} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/ {totalBedsCount}</span></div>
          </div>
          <div style={{ backgroundColor: 'var(--ds-color-danger-subtle, rgba(239, 68, 68, 0.15))', border: '1px solid var(--ds-color-danger)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-danger)', fontWeight: 700 }}>Occupied Beds</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--ds-color-danger)', fontWeight: 900 }}>{occupiedBedsCount}</div>
          </div>
          <div style={{ backgroundColor: 'var(--ds-color-primary-subtle, rgba(14, 165, 233, 0.15))', border: '1px solid var(--ds-color-accent)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-accent)', fontWeight: 700 }}>ICU Patients</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--ds-color-accent)', fontWeight: 900 }}>{icuBedsOccupied}</div>
          </div>
          <div style={{ backgroundColor: 'var(--ds-color-warning-subtle, rgba(245, 158, 11, 0.15))', border: '1px solid var(--ds-color-warning)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-warning)', fontWeight: 700 }}>Cleaning</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--ds-color-warning)', fontWeight: 900 }}>{cleaningBedsCount}</div>
          </div>
          <div style={{ backgroundColor: 'var(--ds-color-primary-subtle, rgba(14, 165, 233, 0.15))', border: '1px solid var(--ds-color-primary)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-accent)', fontWeight: 700 }}>Pending Discharge</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--ds-color-accent)', fontWeight: 900 }}>{plannedDischargesCount}</div>
          </div>
        </div>
      </div>

      {/* Inpatient Sub-Pages & Operational Action Toolbar (No duplicate menu cards, zero horizontal scrollbar) */}
      <div
        style={{
          backgroundColor: 'var(--ds-color-surface)',
          border: '1px solid var(--ds-color-border)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}
      >
        {/* Top Row: Page Sub-Desk Context & Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🛏️</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                Inpatient Operations Desk (IPD)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
                Manage live wards, nursing station, doctor rounds, census, and rapid bed admissions
              </div>
            </div>
          </div>

          {/* Operational Action Buttons Right on the Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsDirectAdmitOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--ds-color-success)',
                border: '1px solid var(--ds-color-success)',
                color: 'var(--ds-color-success-foreground, white)',
                fontSize: '0.8rem',
                fontWeight: 700,
                minHeight: '34px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s ease'
              }}
              title="Directly admit a patient to an available bed"
            >
              <span>+ Direct Admit Bed</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateRequestOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--ds-color-primary)',
                border: '1px solid var(--ds-color-primary)',
                color: 'var(--ds-color-primary-foreground, white)',
                fontSize: '0.8rem',
                fontWeight: 700,
                minHeight: '34px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.15s ease'
              }}
              title="Create a new admission requisition"
            >
              <span>+ New Admission Req</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateBedOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--ds-color-surface-subtle, rgba(255,255,255,0.05))',
                border: '1px solid var(--ds-color-border)',
                color: 'var(--ds-color-text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                minHeight: '34px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Add a new physical bed or ICU station"
            >
              <span>+ Register Bed</span>
            </button>
          </div>
        </div>

        {/* Sub-Pages Navigation Buttons (Clean single row, zero horizontal scrollbar) */}
        <div
          style={{
            position: 'relative',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            paddingTop: '8px',
            borderTop: '1px solid var(--ds-color-border)'
          }}
        >
          {primaryDailyTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 11px',
                  borderRadius: '7px',
                  border: isActive ? '1.5px solid var(--ds-color-primary)' : '1px solid var(--ds-color-border)',
                  backgroundColor: isActive ? 'var(--ds-color-primary-subtle, rgba(2, 132, 199, 0.15))' : 'var(--ds-color-surface-subtle, transparent)',
                  color: isActive ? 'var(--ds-color-primary)' : 'var(--ds-color-text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{(tab.label.split('(')[0] ?? tab.label).trim()}</span>
                {typeof tab.count === 'number' && (
                  <span
                    style={{
                      backgroundColor: isActive ? 'var(--ds-color-primary)' : 'var(--ds-color-surface-hover)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '999px'
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Secondary Inpatient Modules Dropdown */}
          <TabOverflowMenu
            label="More Inpatient Modules"
            options={secondaryFacilityTabs.map((sec) => ({
              id: sec.id,
              label: `${sec.icon} ${sec.label}`
            }))}
            activeId={activeTab}
            onSelect={(id) => setActiveTab(id as InpatientTab)}
            onReset={() => setActiveTab('overview')}
            accentColor="var(--ds-color-primary)"
            activeBorderColor="var(--ds-color-accent)"
          />
        </div>
      </div>

      {/* Active Cross-Department Patient Context Banner */}
      {activePatient && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Active Inpatient Context:</span>
            <strong style={{ color: '#38BDF8', fontSize: '0.94rem', fontWeight: 800 }}>{activePatient.name}</strong>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
              UHID: {activePatient.uhid || activePatient.id}
            </span>
            {activePatient.age && (
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                • {activePatient.age}y / {activePatient.gender || 'M'}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
              ✓ Auto-linked from Reception / OPD Desk
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsCreateRequestOpen(true)}
              style={{
                backgroundColor: 'var(--ds-color-primary)',
                border: '1px solid var(--ds-color-primary)',
                borderRadius: '6px',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                transition: 'all 0.15s ease'
              }}
            >
              + Create Requisition
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePatient(null);
                hospitalEventBus.clearActivePatient('InpatientDomainManager');
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '4px 10px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              Clear Patient ✕
            </button>
          </div>
        </div>
      )}

      {/* View router */}
      {activeTab === 'overview' && metrics && (
        <InpatientOverviewView
          metrics={metrics}
          admissions={admissions}
          requests={requests}
          onOpenCreateRequest={() => setIsCreateRequestOpen(true)}
          onOpenBedBoard={() => setActiveTab('bed-board')}
          onOpenNursingStation={() => setActiveTab('nursing-station')}
          onSelectAdmission={(id) => {
            const adm = (admissions || []).find((a) => a?.id === id) || null;
            setSelectedAdmission(adm);
            setActiveTab('admission-detail');
          }}
        />
      )}

      {activeTab === 'admissions' && (
        <AdmissionRequestView
          requests={requests}
          onOpenCreateRequest={() => setIsCreateRequestOpen(true)}
          onOpenApprove={(req) => {
            setSelectedRequest(req);
            setIsApproveAdmissionOpen(true);
          }}
          onOpenReject={(req) => {
            setSelectedRequest(req);
            setIsRejectAdmissionOpen(true);
          }}
          onOpenCancel={(req) => {
            setSelectedRequest(req);
            setIsCancelAdmissionOpen(true);
          }}
        />
      )}

      {activeTab === 'admission-detail' && (
        <AdmissionDetailView
          admission={selectedAdmission}
          assessments={nursingAssessments}
          vitals={vitals}
          rounds={rounds}
          onBack={() => setActiveTab('overview')}
          onOpenTransfer={() => setIsCreateTransferOpen(true)}
          onOpenRecordVital={() => setIsRecordVitalOpen(true)}
          onOpenDoctorRound={() => setIsDoctorRoundOpen(true)}
          onOpenRequestDischarge={() => setIsRequestDischargeOpen(true)}
        />
      )}

      {activeTab === 'icu-telemetry' && (
        <LiveIcuTelemetryCodeBlueView />
      )}

      {activeTab === 'bed-board' && (
        <BedManagementView
          beds={beds}
          wards={wards}
          onOpenCreateBed={() => setIsCreateBedOpen(true)}
          onOpenEditBed={(b) => {
            setSelectedBed(b);
            setIsEditBedOpen(true);
          }}
          onOpenBlockBed={(b) => {
            setSelectedBed(b);
            setIsBlockBedOpen(true);
          }}
          onOpenReserveBed={(b) => {
            setSelectedBed(b);
            setIsReserveBedOpen(true);
          }}
          onOpenReleaseBed={(b) => {
            setSelectedBed(b);
            setIsReleaseBedOpen(true);
          }}
          onOpenQuickAdmit={(b) => {
            setSelectedBed(b);
            setIsDirectAdmitOpen(true);
          }}
          onCompleteCleaning={(b) => handleQuickCompleteCleaning(b)}
          onSelectBed={(b) => {
            setSelectedBed(b);
            setActiveTab('bed-detail');
          }}
        />
      )}

      {activeTab === 'bed-availability' && (
        <BedAvailabilityView beds={beds} wards={wards} />
      )}

      {activeTab === 'nursing-station' && (
        <NursingStationView
          admissions={admissions}
          wards={wards}
          onOpenNursingAssessment={(adm) => {
            setSelectedAdmission(adm);
            setIsNursingAssessmentOpen(true);
          }}
          onOpenNursingNote={(adm) => {
            setSelectedAdmission(adm);
            setIsNursingNoteOpen(true);
          }}
          onOpenCarePlan={(adm) => {
            setSelectedAdmission(adm);
            setIsCarePlanOpen(true);
          }}
          onOpenRecordVital={(adm) => {
            setSelectedAdmission(adm);
            setIsRecordVitalOpen(true);
          }}
          onSelectAdmission={(id) => {
            const adm = (admissions || []).find((a) => a?.id === id) || null;
            setSelectedAdmission(adm);
            setActiveTab('admission-detail');
          }}
        />
      )}

      {activeTab === 'patient-census' && (
        <PatientCensusView admissions={admissions} />
      )}

      {activeTab === 'patient-locations' && (
        <PatientLocationView admissions={admissions} />
      )}

      {activeTab === 'transfers' && (
        <TransferManagementView
          transfers={transfers}
          onOpenApproveTransfer={(trf) => {
            setSelectedTransfer(trf);
            setIsApproveTransferOpen(true);
          }}
          onOpenCompleteTransfer={(trf) => {
            setSelectedTransfer(trf);
            setIsCompleteTransferOpen(true);
          }}
          onSelectTransfer={(trf) => {
            setSelectedTransfer(trf);
            setActiveTab('transfer-detail');
          }}
        />
      )}

      {activeTab === 'transfer-detail' && (
        <TransferDetailView
          transfer={selectedTransfer}
          onBack={() => setActiveTab('transfers')}
        />
      )}

      {activeTab === 'nursing-care' && (
        <NursingCareView assessments={nursingAssessments} />
      )}

      {activeTab === 'vitals' && (
        <VitalObservationView vitals={vitals} />
      )}

      {activeTab === 'rounds' && (
        <DoctorRoundsView
          rounds={rounds}
          admissions={admissions}
          onOpenDoctorRound={(adm) => {
            setSelectedAdmission(adm);
            setIsDoctorRoundOpen(true);
          }}
        />
      )}

      {activeTab === 'discharge-planning' && (
        <DischargePlanningView
          plans={dischargePlans}
          admissions={admissions}
          onOpenCreatePlan={(adm) => {
            setSelectedAdmission(adm);
            setIsCreateDischargePlanOpen(true);
          }}
        />
      )}

      {activeTab === 'discharge-workbench' && (
        <DischargeWorkbenchView
          admissions={admissions}
          onOpenApproveDischarge={(adm) => {
            setSelectedAdmission(adm);
            setIsApproveDischargeOpen(true);
          }}
          onOpenCompleteDischarge={(adm) => {
            setSelectedAdmission(adm);
            setIsCompleteDischargeOpen(true);
          }}
          onOpenFinalizeSummary={(adm) => {
            setSelectedAdmission(adm);
            setIsFinalizeSummaryOpen(true);
          }}
        />
      )}

      {activeTab === 'nhcx-auto-discharge' && (
        <InstantNhcxAutoAdjudicationView />
      )}

      {activeTab === 'discharge-summaries' && (
        <DischargeSummaryView summaries={dischargeSummaries} />
      )}

      {activeTab === 'bed-turnaround' && (
        <BedTurnaroundView
          turnarounds={bedTurnarounds}
          onOpenCompleteCleaning={(trn) => {
            setSelectedTurnaround(trn);
            setIsCompleteCleaningOpen(true);
          }}
        />
      )}

      {activeTab === 'smart-hospital-iot' && (
        <SmartHospitalIotBedOrchestrationView />
      )}

      {activeTab === 'wards' && (
        <WardDirectoryView
          wards={wards}
          onOpenCreateWard={() => setIsCreateWardOpen(true)}
          onSelectWard={(w) => {
            setSelectedWard(w);
            setActiveTab('ward-detail');
          }}
        />
      )}

      {activeTab === 'ward-detail' && (
        <WardDetailView
          ward={selectedWard}
          beds={beds}
          onBack={() => setActiveTab('wards')}
          onOpenEditWard={() => setIsEditWardOpen(true)}
          onOpenCreateBed={() => setIsCreateBedOpen(true)}
        />
      )}

      {activeTab === 'bed-detail' && (
        <BedDetailView
          bed={selectedBed}
          onBack={() => setActiveTab('bed-board')}
        />
      )}

      {activeTab === 'bed-blocks' && (
        <BedBlockManagementView blocks={bedBlocks} />
      )}

      {activeTab === 'analytics' && analytics && (
        <IPDAnalyticsView analytics={analytics} />
      )}

      {activeTab === 'reports' && (
        <IPDReportsView />
      )}

      {activeTab === 'audit' && (
        <IPDAuditVaultView auditTraces={auditTraces} />
      )}

      {activeTab === 'occupancy-analytics' && metrics && (
        <BedOccupancyAnalyticsView metrics={metrics} />
      )}

      {/* 27 Audited Dialogs */}
      <CreateWardDialog
        isOpen={isCreateWardOpen}
        onClose={() => setIsCreateWardOpen(false)}
        onSubmit={handleCreateWard}
        units={units}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <EditWardDialog
        isOpen={isEditWardOpen}
        onClose={() => setIsEditWardOpen(false)}
        onSubmit={handleUpdateWard}
        ward={selectedWard}
        tenantId={tenantId}
      />

      <CreateBedDialog
        isOpen={isCreateBedOpen}
        onClose={() => setIsCreateBedOpen(false)}
        onSubmit={handleCreateBed}
        wards={wards}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <EditBedDialog
        isOpen={isEditBedOpen}
        onClose={() => setIsEditBedOpen(false)}
        onSubmit={handleUpdateBed}
        bed={selectedBed}
        tenantId={tenantId}
      />

      <BlockBedDialog
        isOpen={isBlockBedOpen}
        onClose={() => setIsBlockBedOpen(false)}
        onSubmit={handleBlockBed}
        bed={selectedBed}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <CreateBedReservationDialog
        isOpen={isReserveBedOpen}
        onClose={() => setIsReserveBedOpen(false)}
        onSubmit={handleCreateReservation}
        bed={selectedBed}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <CancelBedReservationDialog
        isOpen={isCancelReservationOpen}
        onClose={() => setIsCancelReservationOpen(false)}
        onSubmit={handleCancelReservation}
        bed={selectedBed}
        tenantId={tenantId}
      />

      <CreateAdmissionRequestDialog
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onSubmit={handleCreateAdmissionRequest}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <ApproveAdmissionDialog
        isOpen={isApproveAdmissionOpen}
        onClose={() => setIsApproveAdmissionOpen(false)}
        onSubmit={handleApproveAdmission}
        request={selectedRequest}
        wards={wards}
        beds={beds}
        tenantId={tenantId}
      />

      <RejectAdmissionDialog
        isOpen={isRejectAdmissionOpen}
        onClose={() => setIsRejectAdmissionOpen(false)}
        onSubmit={handleRejectAdmission}
        request={selectedRequest}
        tenantId={tenantId}
      />

      <CancelAdmissionDialog
        isOpen={isCancelAdmissionOpen}
        onClose={() => setIsCancelAdmissionOpen(false)}
        onSubmit={handleCancelAdmission}
        request={selectedRequest}
        tenantId={tenantId}
      />

      <AllocateBedDialog
        isOpen={isAllocateBedOpen}
        onClose={() => setIsAllocateBedOpen(false)}
        onSubmit={handleAllocateBed}
        admission={selectedAdmission}
        wards={wards}
        beds={beds}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <CreateTransferDialog
        isOpen={isCreateTransferOpen}
        onClose={() => setIsCreateTransferOpen(false)}
        onSubmit={handleCreateTransfer}
        admission={selectedAdmission}
        wards={wards}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <ApproveTransferDialog
        isOpen={isApproveTransferOpen}
        onClose={() => setIsApproveTransferOpen(false)}
        onSubmit={handleApproveTransfer}
        transfer={selectedTransfer}
        beds={beds}
        tenantId={tenantId}
      />

      <CompleteTransferDialog
        isOpen={isCompleteTransferOpen}
        onClose={() => setIsCompleteTransferOpen(false)}
        onSubmit={handleCompleteTransfer}
        transfer={selectedTransfer}
        tenantId={tenantId}
      />

      <NursingAssessmentDialog
        isOpen={isNursingAssessmentOpen}
        onClose={() => setIsNursingAssessmentOpen(false)}
        onSubmit={handleRecordNursingAssessment}
        admission={selectedAdmission}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <NursingNoteDialog
        isOpen={isNursingNoteOpen}
        onClose={() => setIsNursingNoteOpen(false)}
        onSubmit={handleRecordNursingNote}
        admission={selectedAdmission}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <CarePlanDialog
        isOpen={isCarePlanOpen}
        onClose={() => setIsCarePlanOpen(false)}
        onSubmit={handleRecordCarePlan}
        admission={selectedAdmission}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <RecordVitalDialog
        isOpen={isRecordVitalOpen}
        onClose={() => setIsRecordVitalOpen(false)}
        onSubmit={handleRecordVital}
        admission={selectedAdmission}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <DoctorRoundDialog
        isOpen={isDoctorRoundOpen}
        onClose={() => setIsDoctorRoundOpen(false)}
        onSubmit={handleRecordDoctorRound}
        admission={selectedAdmission}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <CreateDischargePlanDialog
        isOpen={isCreateDischargePlanOpen}
        onClose={() => setIsCreateDischargePlanOpen(false)}
        onSubmit={handleCreateDischargePlan}
        admission={selectedAdmission}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <RequestDischargeDialog
        isOpen={isRequestDischargeOpen}
        onClose={() => setIsRequestDischargeOpen(false)}
        onSubmit={handleRequestDischarge}
        admission={selectedAdmission}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <ApproveDischargeDialog
        isOpen={isApproveDischargeOpen}
        onClose={() => setIsApproveDischargeOpen(false)}
        onSubmit={handleApproveDischarge}
        admission={selectedAdmission}
        tenantId={tenantId}
      />

      <CompleteDischargeDialog
        isOpen={isCompleteDischargeOpen}
        onClose={() => setIsCompleteDischargeOpen(false)}
        onSubmit={handleCompleteDischarge}
        admission={selectedAdmission}
        tenantId={tenantId}
      />

      <FinalizeDischargeSummaryDialog
        isOpen={isFinalizeSummaryOpen}
        onClose={() => setIsFinalizeSummaryOpen(false)}
        onSubmit={handleFinalizeDischargeSummary}
        admission={selectedAdmission}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId || '44444444-4444-4444-8444-444444444444'}
      />

      <ReleaseBedDialog
        isOpen={isReleaseBedOpen}
        onClose={() => setIsReleaseBedOpen(false)}
        onSubmit={handleReleaseBed}
        bed={selectedBed}
        tenantId={tenantId}
      />

      <CompleteCleaningDialog
        isOpen={isCompleteCleaningOpen}
        onClose={() => setIsCompleteCleaningOpen(false)}
        onSubmit={handleCompleteCleaning}
        turnaround={selectedTurnaround}
        tenantId={tenantId}
      />

      <DirectAdmitBedDialog
        isOpen={isDirectAdmitOpen}
        onClose={() => setIsDirectAdmitOpen(false)}
        onSubmit={handleDirectAdmit}
        bed={selectedBed}
        wards={wards}
        tenantId={tenantId}
        partnerId={partnerId}
      />
    </div>
  );
};