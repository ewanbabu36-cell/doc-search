import React, { useState, useEffect } from 'react';
import { Badge } from '@docsearch/ui-kit';
import type {
  OperationTheatreComplexDto,
  OperationTheatreRoomDto,
  SurgicalProcedureDto,
  SurgeryRequestDto,
  PreOperativeAssessmentDto,
  SurgicalConsentDto,
  OTScheduleDto,
  PreOpChecklistDto,
  SurgicalSafetyChecklistDto,
  OTTransferDto,
  AnaesthesiaRecordDto,
  IntraoperativeRecordDto,
  OperativeNoteDto,
  SurgicalSpecimenDto,
  SurgicalImplantDto,
  SurgicalConsumableUsageDto,
  PACURecoveryRecordDto,
  PostoperativeTransferDto,
  SurgeryCancellationDto,
  OTAuditTraceDto,
  OTOverviewMetricsDto,
  OTAnalyticsDto
} from '@docsearch/api-contracts';

import { operationTheatreManagementService } from '../services/operation-theatre-management-service.js';

// Import Views
import { OTOverviewView } from './views/OTOverviewView.js';
import { OTCommandCenterView } from './views/OTCommandCenterView.js';
import { OTDirectoryView } from './views/OTDirectoryView.js';
import { OTRoomDirectoryView } from './views/OTRoomDirectoryView.js';
import { OTRoomDetailView } from './views/OTRoomDetailView.js';
import { SurgeryRequestView } from './views/SurgeryRequestView.js';
import { SurgeryRequestDetailView } from './views/SurgeryRequestDetailView.js';
import { PreOperativeWorkbenchView } from './views/PreOperativeWorkbenchView.js';
import { SurgicalConsentView } from './views/SurgicalConsentView.js';
import { OTScheduleView } from './views/OTScheduleView.js';
import { SurgicalTeamView } from './views/SurgicalTeamView.js';
import { PreOpChecklistView } from './views/PreOpChecklistView.js';
import { SurgicalSafetyChecklistView } from './views/SurgicalSafetyChecklistView.js';
import { OTTransferView } from './views/OTTransferView.js';
import { AnaesthesiaWorkbenchView } from './views/AnaesthesiaWorkbenchView.js';
import { IntraoperativeWorkbenchView } from './views/IntraoperativeWorkbenchView.js';
import { OperativeNotesView } from './views/OperativeNotesView.js';
import { SpecimenManagementView } from './views/SpecimenManagementView.js';
import { ImplantManagementView } from './views/ImplantManagementView.js';
import { SurgicalConsumablesView } from './views/SurgicalConsumablesView.js';
import { PACURecoveryView } from './views/PACURecoveryView.js';
import { PostoperativeTransferView } from './views/PostoperativeTransferView.js';
import { SurgeryCancellationView } from './views/SurgeryCancellationView.js';
import { EmergencyOTView } from './views/EmergencyOTView.js';
import { OTUtilizationView } from './views/OTUtilizationView.js';
import { SurgicalAnalyticsView } from './views/SurgicalAnalyticsView.js';
import { OTReportsView } from './views/OTReportsView.js';
import { OTAuditVaultView } from './views/OTAuditVaultView.js';

// Import Dialogs
import { CreateOperationTheatreDialog } from './dialogs/CreateOperationTheatreDialog.js';
import { EditOperationTheatreDialog } from './dialogs/EditOperationTheatreDialog.js';
import { CreateOTRoomDialog } from './dialogs/CreateOTRoomDialog.js';
import { CreateSurgicalProcedureDialog } from './dialogs/CreateSurgicalProcedureDialog.js';
import { CreateSurgeryRequestDialog } from './dialogs/CreateSurgeryRequestDialog.js';
import { ApproveSurgeryRequestDialog } from './dialogs/ApproveSurgeryRequestDialog.js';
import { RejectSurgeryRequestDialog } from './dialogs/RejectSurgeryRequestDialog.js';
import { CreatePreOperativeAssessmentDialog } from './dialogs/CreatePreOperativeAssessmentDialog.js';
import { CreateSurgicalConsentDialog } from './dialogs/CreateSurgicalConsentDialog.js';
import { CreateOTScheduleDialog } from './dialogs/CreateOTScheduleDialog.js';
import { RescheduleOTDialog } from './dialogs/RescheduleOTDialog.js';
import { AssignSurgicalTeamDialog } from './dialogs/AssignSurgicalTeamDialog.js';
import { CompletePreOpChecklistDialog } from './dialogs/CompletePreOpChecklistDialog.js';
import { CompleteSafetyChecklistDialog } from './dialogs/CompleteSafetyChecklistDialog.js';
import { CreateOTTransferDialog } from './dialogs/CreateOTTransferDialog.js';
import { CreateAnaesthesiaRecordDialog } from './dialogs/CreateAnaesthesiaRecordDialog.js';
import { StartSurgeryDialog } from './dialogs/StartSurgeryDialog.js';
import { CompleteSurgeryDialog } from './dialogs/CompleteSurgeryDialog.js';
import { CreateOperativeNoteDialog } from './dialogs/CreateOperativeNoteDialog.js';
import { FinalizeOperativeNoteDialog } from './dialogs/FinalizeOperativeNoteDialog.js';
import { CreateSpecimenDialog } from './dialogs/CreateSpecimenDialog.js';
import { CreateImplantRecordDialog } from './dialogs/CreateImplantRecordDialog.js';
import { RecordConsumableUsageDialog } from './dialogs/RecordConsumableUsageDialog.js';
import { CreatePACURecordDialog } from './dialogs/CreatePACURecordDialog.js';
import { CreatePostoperativeTransferDialog } from './dialogs/CreatePostoperativeTransferDialog.js';
import { CancelSurgeryDialog } from './dialogs/CancelSurgeryDialog.js';
import { CreateEmergencySurgeryDialog } from './dialogs/CreateEmergencySurgeryDialog.js';
import { OverrideOTConflictDialog } from './dialogs/OverrideOTConflictDialog.js';

interface Props {
  tenantId?: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
}

export const OTDomainManager: React.FC<Props> = ({
  tenantId = '11111111-1111-4111-8111-111111111111',
  partnerId = '22222222-2222-4222-8222-222222222222',
  organizationId = '33333333-3333-4333-8333-333333333333',
  branchId = '44444444-4444-4444-8444-444444444444'
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Datasets
  const [metrics, setMetrics] = useState<OTOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<OTAnalyticsDto | null>(null);
  const [complexes, setComplexes] = useState<OperationTheatreComplexDto[]>([]);
  const [rooms, setRooms] = useState<OperationTheatreRoomDto[]>([]);
  const [procedures, setProcedures] = useState<SurgicalProcedureDto[]>([]);
  const [requests, setRequests] = useState<SurgeryRequestDto[]>([]);
  const [preOpAssessments, setPreOpAssessments] = useState<PreOperativeAssessmentDto[]>([]);
  const [consents, setConsents] = useState<SurgicalConsentDto[]>([]);
  const [schedules, setSchedules] = useState<OTScheduleDto[]>([]);
  const [preOpChecklists, setPreOpChecklists] = useState<PreOpChecklistDto[]>([]);
  const [safetyChecklists, setSafetyChecklists] = useState<SurgicalSafetyChecklistDto[]>([]);
  const [transfers, setTransfers] = useState<OTTransferDto[]>([]);
  const [anaesthesiaRecords, setAnaesthesiaRecords] = useState<AnaesthesiaRecordDto[]>([]);
  const [intraopRecords, setIntraopRecords] = useState<IntraoperativeRecordDto[]>([]);
  const [operativeNotes, setOperativeNotes] = useState<OperativeNoteDto[]>([]);
  const [specimens, setSpecimens] = useState<SurgicalSpecimenDto[]>([]);
  const [implants, setImplants] = useState<SurgicalImplantDto[]>([]);
  const [consumables, setConsumables] = useState<SurgicalConsumableUsageDto[]>([]);
  const [pacuRecords, setPACURecords] = useState<PACURecoveryRecordDto[]>([]);
  const [postOpTransfers, setPostOpTransfers] = useState<PostoperativeTransferDto[]>([]);
  const [cancellations, setCancellations] = useState<SurgeryCancellationDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<OTAuditTraceDto[]>([]);

  // Selected State
  const [selectedComplex, setSelectedComplex] = useState<OperationTheatreComplexDto | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<OperationTheatreRoomDto | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SurgeryRequestDto | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<OTScheduleDto | null>(null);
  const [selectedNote, setSelectedNote] = useState<OperativeNoteDto | null>(null);

  // Dialog States
  const [isCreateComplexOpen, setIsCreateComplexOpen] = useState(false);
  const [isEditComplexOpen, setIsEditComplexOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isCreateProcedureOpen, setIsCreateProcedureOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [isApproveRequestOpen, setIsApproveRequestOpen] = useState(false);
  const [isRejectRequestOpen, setIsRejectRequestOpen] = useState(false);
  const [isPACAssessmentOpen, setIsPACAssessmentOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isAssignTeamOpen, setIsAssignTeamOpen] = useState(false);
  const [isPreOpChecklistOpen, setIsPreOpChecklistOpen] = useState(false);
  const [isSafetyChecklistOpen, setIsSafetyChecklistOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAnaesthesiaOpen, setIsAnaesthesiaOpen] = useState(false);
  const [isStartSurgeryOpen, setIsStartSurgeryOpen] = useState(false);
  const [isCompleteSurgeryOpen, setIsCompleteSurgeryOpen] = useState(false);
  const [isOperativeNoteOpen, setIsOperativeNoteOpen] = useState(false);
  const [isFinalizeNoteOpen, setIsFinalizeNoteOpen] = useState(false);
  const [isSpecimenOpen, setIsSpecimenOpen] = useState(false);
  const [isImplantOpen, setIsImplantOpen] = useState(false);
  const [isConsumableOpen, setIsConsumableOpen] = useState(false);
  const [isPACUOpen, setIsPACUOpen] = useState(false);
  const [isPostOpTransferOpen, setIsPostOpTransferOpen] = useState(false);
  const [isCancelSurgeryOpen, setIsCancelSurgeryOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isOverrideConflictOpen, setIsOverrideConflictOpen] = useState(false);

  const loadAll = async () => {
    const [
      m,
      an,
      c,
      rm,
      prc,
      reqs,
      pac,
      cns,
      sch,
      pck,
      ssc,
      trf,
      ans,
      iop,
      opn,
      spc,
      imp,
      csm,
      pcu,
      ptr,
      cnl,
      aud
    ] = await Promise.all([
      operationTheatreManagementService.getOverviewMetrics(tenantId),
      operationTheatreManagementService.getAnalytics(tenantId),
      operationTheatreManagementService.getComplexes(tenantId),
      operationTheatreManagementService.getRooms(tenantId),
      operationTheatreManagementService.getProcedures(tenantId),
      operationTheatreManagementService.getSurgeryRequests(tenantId),
      operationTheatreManagementService.getPreOpAssessments(tenantId),
      operationTheatreManagementService.getConsents(tenantId),
      operationTheatreManagementService.getSchedules(tenantId),
      operationTheatreManagementService.getPreOpChecklists(tenantId),
      operationTheatreManagementService.getSafetyChecklists(tenantId),
      operationTheatreManagementService.getTransfers(tenantId),
      operationTheatreManagementService.getAnaesthesiaRecords(tenantId),
      operationTheatreManagementService.getIntraoperativeRecords(tenantId),
      operationTheatreManagementService.getOperativeNotes(tenantId),
      operationTheatreManagementService.getSpecimens(tenantId),
      operationTheatreManagementService.getImplants(tenantId),
      operationTheatreManagementService.getConsumables(tenantId),
      operationTheatreManagementService.getPACURecords(tenantId),
      operationTheatreManagementService.getPostoperativeTransfers(tenantId),
      operationTheatreManagementService.getCancellations(tenantId),
      operationTheatreManagementService.getAuditTraces(tenantId)
    ]);

    setMetrics(m);
    setAnalytics(an);
    setComplexes(c);
    setRooms(rm);
    setProcedures(prc);
    setRequests(reqs);
    setPreOpAssessments(pac);
    setConsents(cns);
    setSchedules(sch);
    setPreOpChecklists(pck);
    setSafetyChecklists(ssc);
    setTransfers(trf);
    setAnaesthesiaRecords(ans);
    setIntraopRecords(iop);
    setOperativeNotes(opn);
    setSpecimens(spc);
    setImplants(imp);
    setConsumables(csm);
    setPACURecords(pcu);
    setPostOpTransfers(ptr);
    setCancellations(cnl);
    setAuditTraces(aud);
  };

  useEffect(() => {
    loadAll();
  }, [tenantId]);

  const navItems = [
    { id: 'overview', label: 'OT Overview' },
    { id: 'command-center', label: 'Command Center' },
    { id: 'ot-complexes', label: 'OT Complexes' },
    { id: 'ot-rooms', label: 'OT Rooms' },
    { id: 'surgery-requests', label: 'Surgery Requests' },
    { id: 'preop-workbench', label: 'PAC & Fitness' },
    { id: 'surgical-consents', label: 'Surgical Consents' },
    { id: 'ot-schedules', label: 'OT Schedule Roster' },
    { id: 'surgical-teams', label: 'Surgical Teams' },
    { id: 'preop-checklists', label: 'Pre-Op Checklists' },
    { id: 'safety-checklists', label: 'WHO Safety Checklists' },
    { id: 'ot-transfers', label: 'OT Transfers' },
    { id: 'anaesthesia', label: 'Anaesthesia' },
    { id: 'intraoperative', label: 'Intraoperative' },
    { id: 'operative-notes', label: 'Operative Notes' },
    { id: 'specimens', label: 'Specimens' },
    { id: 'implants', label: 'Implants & Prosthesis' },
    { id: 'consumables', label: 'Consumables & Stock' },
    { id: 'pacu-recovery', label: 'PACU Recovery' },
    { id: 'postop-transfers', label: 'Post-Op Transfers' },
    { id: 'cancellations', label: 'Cancellations' },
    { id: 'emergency-ot', label: 'Emergency OT' },
    { id: 'utilization', label: 'OT Utilization' },
    { id: 'analytics', label: 'Surgical Analytics' },
    { id: 'reports', label: 'Reports' },
    { id: 'audit-vault', label: 'Audit Vault' }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] gap-6 bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-200">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 space-y-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm max-h-[85vh] overflow-y-auto">
        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          OT & Surgery Modules
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{item.label}</span>
            {item.id === 'emergency-ot' && <Badge variant="danger">STAT</Badge>}
            {item.id === 'command-center' && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-y-auto max-h-[85vh]">
        {activeTab === 'overview' && metrics && (
          <OTOverviewView
            metrics={metrics}
            rooms={rooms}
            schedules={schedules}
            onOpenCommandCenter={() => setActiveTab('command-center')}
            onOpenBooking={() => setIsScheduleOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        )}

        {activeTab === 'command-center' && (
          <OTCommandCenterView
            rooms={rooms}
            schedules={schedules}
            pacuRecords={pacuRecords}
            onOpenSchedule={() => setActiveTab('ot-schedules')}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        )}

        {activeTab === 'ot-complexes' && (
          <OTDirectoryView
            complexes={complexes}
            onAddComplex={() => setIsCreateComplexOpen(true)}
            onEditComplex={(c) => {
              setSelectedComplex(c);
              setIsEditComplexOpen(true);
            }}
          />
        )}

        {activeTab === 'ot-rooms' && !selectedRoom && (
          <OTRoomDirectoryView
            rooms={rooms}
            onAddRoom={() => setIsCreateRoomOpen(true)}
            onSelectRoom={(r) => setSelectedRoom(r)}
          />
        )}

        {activeTab === 'ot-rooms' && selectedRoom && (
          <OTRoomDetailView
            room={selectedRoom}
            onBack={() => setSelectedRoom(null)}
            onBook={() => setIsScheduleOpen(true)}
          />
        )}

        {activeTab === 'surgery-requests' && !selectedRequest && (
          <SurgeryRequestView
            requests={requests}
            onCreateRequest={() => setIsCreateRequestOpen(true)}
            onApprove={(r) => {
              setSelectedRequest(r);
              setIsApproveRequestOpen(true);
            }}
            onReject={(r) => {
              setSelectedRequest(r);
              setIsRejectRequestOpen(true);
            }}
          />
        )}

        {activeTab === 'surgery-requests' && selectedRequest && (
          <SurgeryRequestDetailView
            request={selectedRequest}
            onBack={() => setSelectedRequest(null)}
            onApprove={(r) => {
              setSelectedRequest(r);
              setIsApproveRequestOpen(true);
            }}
          />
        )}

        {activeTab === 'preop-workbench' && (
          <PreOperativeWorkbenchView
            assessments={preOpAssessments}
            requests={requests}
            onOpenPAC={(r) => {
              setSelectedRequest(r);
              setIsPACAssessmentOpen(true);
            }}
          />
        )}

        {activeTab === 'surgical-consents' && (
          <SurgicalConsentView
            consents={consents}
            requests={requests}
            onExecuteConsent={(r) => {
              setSelectedRequest(r);
              setIsConsentOpen(true);
            }}
          />
        )}

        {activeTab === 'ot-schedules' && (
          <OTScheduleView
            schedules={schedules}
            onBookSchedule={() => setIsScheduleOpen(true)}
            onReschedule={(s) => {
              setSelectedSchedule(s);
              setIsRescheduleOpen(true);
            }}
            onAssignTeam={(s) => {
              setSelectedSchedule(s);
              setIsAssignTeamOpen(true);
            }}
            onStartSurgery={(s) => {
              setSelectedSchedule(s);
              setIsStartSurgeryOpen(true);
            }}
            onCancelSurgery={(s) => {
              setSelectedSchedule(s);
              setIsCancelSurgeryOpen(true);
            }}
          />
        )}

        {activeTab === 'surgical-teams' && (
          <SurgicalTeamView
            schedules={schedules}
            onAssignTeam={(s) => {
              setSelectedSchedule(s);
              setIsAssignTeamOpen(true);
            }}
          />
        )}

        {activeTab === 'preop-checklists' && (
          <PreOpChecklistView
            checklists={preOpChecklists}
            schedules={schedules}
            onOpenChecklist={(s) => {
              setSelectedSchedule(s);
              setIsPreOpChecklistOpen(true);
            }}
          />
        )}

        {activeTab === 'safety-checklists' && (
          <SurgicalSafetyChecklistView
            checklists={safetyChecklists}
            schedules={schedules}
            onOpenSafetyChecklist={(s) => {
              setSelectedSchedule(s);
              setIsSafetyChecklistOpen(true);
            }}
          />
        )}

        {activeTab === 'ot-transfers' && (
          <OTTransferView
            transfers={transfers}
            schedules={schedules}
            onOpenTransfer={(s) => {
              setSelectedSchedule(s);
              setIsTransferOpen(true);
            }}
          />
        )}

        {activeTab === 'anaesthesia' && (
          <AnaesthesiaWorkbenchView
            records={anaesthesiaRecords}
            schedules={schedules}
            onOpenRecord={(s) => {
              setSelectedSchedule(s);
              setIsAnaesthesiaOpen(true);
            }}
          />
        )}

        {activeTab === 'intraoperative' && (
          <IntraoperativeWorkbenchView
            records={intraopRecords}
            schedules={schedules}
            onCompleteSurgery={(s) => {
              setSelectedSchedule(s);
              setIsCompleteSurgeryOpen(true);
            }}
          />
        )}

        {activeTab === 'operative-notes' && (
          <OperativeNotesView
            notes={operativeNotes}
            schedules={schedules}
            onDraftNote={(s) => {
              setSelectedSchedule(s);
              setIsOperativeNoteOpen(true);
            }}
            onFinalizeNote={(n) => {
              setSelectedNote(n);
              setIsFinalizeNoteOpen(true);
            }}
          />
        )}

        {activeTab === 'specimens' && (
          <SpecimenManagementView
            specimens={specimens}
            schedules={schedules}
            onLogSpecimen={(s) => {
              setSelectedSchedule(s);
              setIsSpecimenOpen(true);
            }}
          />
        )}

        {activeTab === 'implants' && (
          <ImplantManagementView
            implants={implants}
            schedules={schedules}
            onLogImplant={(s) => {
              setSelectedSchedule(s);
              setIsImplantOpen(true);
            }}
          />
        )}

        {activeTab === 'consumables' && (
          <SurgicalConsumablesView
            consumables={consumables}
            schedules={schedules}
            onRecordUsage={(s) => {
              setSelectedSchedule(s);
              setIsConsumableOpen(true);
            }}
          />
        )}

        {activeTab === 'pacu-recovery' && (
          <PACURecoveryView
            pacuRecords={pacuRecords}
            schedules={schedules}
            onOpenPACUObservation={(s) => {
              setSelectedSchedule(s);
              setIsPACUOpen(true);
            }}
            onPostOpTransfer={(s) => {
              setSelectedSchedule(s);
              setIsPostOpTransferOpen(true);
            }}
          />
        )}

        {activeTab === 'postop-transfers' && (
          <PostoperativeTransferView
            transfers={postOpTransfers}
            schedules={schedules}
            onOpenTransfer={(s) => {
              setSelectedSchedule(s);
              setIsPostOpTransferOpen(true);
            }}
          />
        )}

        {activeTab === 'cancellations' && (
          <SurgeryCancellationView cancellations={cancellations} />
        )}

        {activeTab === 'emergency-ot' && (
          <EmergencyOTView
            schedules={schedules}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        )}

        {activeTab === 'utilization' && metrics && analytics && (
          <OTUtilizationView metrics={metrics} analytics={analytics} />
        )}

        {activeTab === 'analytics' && analytics && (
          <SurgicalAnalyticsView analytics={analytics} />
        )}

        {activeTab === 'reports' && <OTReportsView />}

        {activeTab === 'audit-vault' && <OTAuditVaultView traces={auditTraces} />}
      </div>

      {/* Dialog Modals */}
      <CreateOperationTheatreDialog
        isOpen={isCreateComplexOpen}
        onClose={() => setIsCreateComplexOpen(false)}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createComplex(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <EditOperationTheatreDialog
        isOpen={isEditComplexOpen}
        onClose={() => setIsEditComplexOpen(false)}
        complex={selectedComplex}
        onSubmit={async (req) => {
          await operationTheatreManagementService.updateComplex(req);
          await loadAll();
        }}
      />

      <CreateOTRoomDialog
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        complexes={complexes}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createRoom(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateSurgicalProcedureDialog
        isOpen={isCreateProcedureOpen}
        onClose={() => setIsCreateProcedureOpen(false)}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createProcedure(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateSurgeryRequestDialog
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        procedures={procedures}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createSurgeryRequest(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <ApproveSurgeryRequestDialog
        isOpen={isApproveRequestOpen}
        onClose={() => setIsApproveRequestOpen(false)}
        request={selectedRequest}
        onSubmit={async (req) => {
          await operationTheatreManagementService.approveSurgeryRequest(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />

      <RejectSurgeryRequestDialog
        isOpen={isRejectRequestOpen}
        onClose={() => setIsRejectRequestOpen(false)}
        request={selectedRequest}
        onSubmit={async (req) => {
          await operationTheatreManagementService.rejectSurgeryRequest(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />

      <CreatePreOperativeAssessmentDialog
        isOpen={isPACAssessmentOpen}
        onClose={() => setIsPACAssessmentOpen(false)}
        request={selectedRequest}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createPreOpAssessment(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateSurgicalConsentDialog
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        request={selectedRequest}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createSurgicalConsent(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateOTScheduleDialog
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        requests={requests.filter((r) => r.status === 'APPROVED' || r.status === 'SUBMITTED')}
        rooms={rooms}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createSchedule(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <RescheduleOTDialog
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        schedule={selectedSchedule}
        rooms={rooms}
        onSubmit={async (req) => {
          await operationTheatreManagementService.rescheduleOT(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />

      <AssignSurgicalTeamDialog
        isOpen={isAssignTeamOpen}
        onClose={() => setIsAssignTeamOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.assignSurgicalTeam(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />

      <CompletePreOpChecklistDialog
        isOpen={isPreOpChecklistOpen}
        onClose={() => setIsPreOpChecklistOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.completePreOpChecklist(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CompleteSafetyChecklistDialog
        isOpen={isSafetyChecklistOpen}
        onClose={() => setIsSafetyChecklistOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.completeSafetyChecklist(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateOTTransferDialog
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        schedule={selectedSchedule}
        rooms={rooms}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createOTTransfer(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateAnaesthesiaRecordDialog
        isOpen={isAnaesthesiaOpen}
        onClose={() => setIsAnaesthesiaOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createAnaesthesiaRecord(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <StartSurgeryDialog
        isOpen={isStartSurgeryOpen}
        onClose={() => setIsStartSurgeryOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.startSurgery(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />

      <CompleteSurgeryDialog
        isOpen={isCompleteSurgeryOpen}
        onClose={() => setIsCompleteSurgeryOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.completeSurgery(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />

      <CreateOperativeNoteDialog
        isOpen={isOperativeNoteOpen}
        onClose={() => setIsOperativeNoteOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createOperativeNote(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <FinalizeOperativeNoteDialog
        isOpen={isFinalizeNoteOpen}
        onClose={() => setIsFinalizeNoteOpen(false)}
        note={selectedNote}
        onSubmit={async (req) => {
          await operationTheatreManagementService.finalizeOperativeNote(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />

      <CreateSpecimenDialog
        isOpen={isSpecimenOpen}
        onClose={() => setIsSpecimenOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createSpecimen(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateImplantRecordDialog
        isOpen={isImplantOpen}
        onClose={() => setIsImplantOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createImplant(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <RecordConsumableUsageDialog
        isOpen={isConsumableOpen}
        onClose={() => setIsConsumableOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.recordConsumableUsage(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreatePACURecordDialog
        isOpen={isPACUOpen}
        onClose={() => setIsPACUOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createPACURecord(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreatePostoperativeTransferDialog
        isOpen={isPostOpTransferOpen}
        onClose={() => setIsPostOpTransferOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createPostoperativeTransfer(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CancelSurgeryDialog
        isOpen={isCancelSurgeryOpen}
        onClose={() => setIsCancelSurgeryOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.cancelSurgery(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />

      <CreateEmergencySurgeryDialog
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        rooms={rooms}
        onSubmit={async (req) => {
          await operationTheatreManagementService.createEmergencySurgery(req);
          await loadAll();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <OverrideOTConflictDialog
        isOpen={isOverrideConflictOpen}
        onClose={() => setIsOverrideConflictOpen(false)}
        schedule={selectedSchedule}
        onSubmit={async (req) => {
          await operationTheatreManagementService.overrideConflict(req);
          await loadAll();
        }}
        tenantId={tenantId}
      />
    </div>
  );
};
