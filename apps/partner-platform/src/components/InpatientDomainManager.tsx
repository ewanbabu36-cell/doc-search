import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from '@docsearch/ui-kit';
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

// Views
import { InpatientOverviewView } from './views/InpatientOverviewView.js';
import { ADTControlCenterView } from './views/ADTControlCenterView.js';
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

export interface InpatientDomainManagerProps {
  tenantId?: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string | null;
}

export type InpatientTab =
  | 'overview'
  | 'icu-telemetry'
  | 'control-center'
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
  | 'discharge-summaries'
  | 'bed-turnaround'
  | 'bed-blocks'
  | 'analytics'
  | 'reports'
  | 'audit'
  | 'occupancy-analytics';

export const InpatientDomainManager: React.FC<InpatientDomainManagerProps> = ({
  tenantId = '11111111-1111-4111-8111-111111111111',
  partnerId = '22222222-2222-4222-8222-222222222222',
  organizationId = '33333333-3333-4333-8333-333333333333',
  branchId = '44444444-4444-4444-8444-444444444444'
}) => {
  const [activeTab, setActiveTab] = useState<InpatientTab>('overview');
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
      setRequests(reqList);
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

  const tabs: { id: InpatientTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Command Center', icon: '📊' },
    { id: 'admissions', label: 'Admission Requests', icon: '📝' },
    { id: 'bed-board', label: 'Bed Master Board', icon: '🛏️' },
    { id: 'nursing-station', label: 'Nursing Station', icon: '🩺' },
    { id: 'patient-census', label: 'Daily Census', icon: '📋' },
    { id: 'transfers', label: 'Transfers (ADT)', icon: '⇄' },
    { id: 'discharge-workbench', label: 'Discharge Workbench', icon: '🚪' },
    { id: 'discharge-summaries', label: 'Discharge Summaries', icon: '📜' },
    { id: 'bed-turnaround', label: 'Housekeeping Turnaround', icon: '🧹' },
    { id: 'wards', label: 'Ward Directory', icon: '🏢' },
    { id: 'bed-blocks', label: 'Maintenance Blocks', icon: '⚠️' },
    { id: 'analytics', label: 'IPD Analytics', icon: '📈' },
    { id: 'reports', label: 'Regulatory Reports', icon: '📑' },
    { id: 'audit', label: 'Audit Vault', icon: '🔒' }
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
          Operational Live Telemetry
        </span>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Tenant: {tenantId.slice(0, 8)}... | Branch: {branchId ? branchId.slice(0, 8) : 'All'}...
        </span>
      </div>

      {notification && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert type={notification.variant === 'danger' ? 'error' : 'success'}>{notification.message}</Alert>
        </div>
      )}

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#2563eb' : '#f1f5f9',
              color: activeTab === tab.id ? '#fff' : '#475569',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

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
            const adm = admissions.find((a) => a.id === id) || null;
            setSelectedAdmission(adm);
            setActiveTab('admission-detail');
          }}
        />
      )}

      {activeTab === 'control-center' && metrics && (
        <ADTControlCenterView
          metrics={metrics}
          onOpenCreateRequest={() => setIsCreateRequestOpen(true)}
          onOpenBedBoard={() => setActiveTab('bed-board')}
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
            const adm = admissions.find((a) => a.id === id) || null;
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
        <DoctorRoundsView rounds={rounds} />
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
    </div>
  );
};