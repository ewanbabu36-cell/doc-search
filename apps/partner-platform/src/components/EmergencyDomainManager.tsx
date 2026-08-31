import React, { useState, useEffect, useCallback } from 'react';
import type {
  EmergencyDepartmentDto,
  EmergencyZoneDto,
  EmergencyEncounterDto,
  EmergencyTriageAssessmentDto,
  EmergencyResuscitationEventDto,
  TraumaActivationDto,
  EmergencyObservationCaseDto,
  EmergencyMLCCaseDto,
  EmergencyCrashCartDto,
  EmergencyAmbulanceTransferDto,
  EmergencyDispositionDto,
  EmergencyDeathRecordDto,
  EmergencyDisasterEventDto,
  EmergencyAuditTraceDto,
  EmergencyOverviewMetricsDto,
  EmergencyAnalyticsDto,
  RegisterEmergencyPatientRequest,
  CreateTriageAssessmentRequest,
  ReassessTriageRequest,
  AssignEmergencyPatientRequest,
  CreateResuscitationEventRequest,
  RecordResuscitationActionRequest,
  CreateTraumaActivationRequest,
  RecordTraumaAssessmentRequest,
  CreateEmergencyProcedureRequest,
  CreateObservationCaseRequest,
  CreateMLCCaseRequest,
  CreateAmbulanceTransferRequest,
  CreateDispositionRequest,
  CreateEmergencyDeathRecordRequest,
  ActivateDisasterModeRequest,
  RegisterDisasterPatientRequest,
  CheckCrashCartRequest
} from '@docsearch/api-contracts';

import { emergencyManagementService } from '../services/emergency-management-service.js';

// Views
import { EmergencyCommandCenterView } from './views/EmergencyCommandCenterView.js';
import { EmergencyDashboardView } from './views/EmergencyDashboardView.js';
import { EmergencyQueueView } from './views/EmergencyQueueView.js';
import { EmergencyPatientView } from './views/EmergencyPatientView.js';
import { EmergencyTriageView } from './views/EmergencyTriageView.js';
import { ResuscitationView } from './views/ResuscitationView.js';
import { TraumaCommandView } from './views/TraumaCommandView.js';
import { TraumaPatientView } from './views/TraumaPatientView.js';
import { EmergencyObservationView } from './views/EmergencyObservationView.js';
import { EmergencyProcedureView } from './views/EmergencyProcedureView.js';
import { MLCWorkbenchView } from './views/MLCWorkbenchView.js';
import { AmbulanceTransferView } from './views/AmbulanceTransferView.js';
import { CrashCartView } from './views/CrashCartView.js';
import { EmergencyDispositionView } from './views/EmergencyDispositionView.js';
import { EmergencyDeathView } from './views/EmergencyDeathView.js';
import { DisasterManagementView } from './views/DisasterManagementView.js';
import { EmergencyStaffView } from './views/EmergencyStaffView.js';
import { EmergencyAnalyticsView } from './views/EmergencyAnalyticsView.js';
import { EmergencyAuditVaultView } from './views/EmergencyAuditVaultView.js';
import { EmergencyControlCenterView } from './views/EmergencyControlCenterView.js';

// Dialogs
import { RegisterEmergencyPatientDialog } from './dialogs/RegisterEmergencyPatientDialog.js';
import { CreateTriageAssessmentDialog } from './dialogs/CreateTriageAssessmentDialog.js';
import { ReassessTriageDialog } from './dialogs/ReassessTriageDialog.js';
import { AssignEmergencyPatientDialog } from './dialogs/AssignEmergencyPatientDialog.js';
import { CreateResuscitationEventDialog } from './dialogs/CreateResuscitationEventDialog.js';
import { RecordResuscitationActionDialog } from './dialogs/RecordResuscitationActionDialog.js';
import { CreateTraumaActivationDialog } from './dialogs/CreateTraumaActivationDialog.js';
import { RecordTraumaAssessmentDialog } from './dialogs/RecordTraumaAssessmentDialog.js';
import { CreateEmergencyProcedureDialog } from './dialogs/CreateEmergencyProcedureDialog.js';
import { CreateObservationCaseDialog } from './dialogs/CreateObservationCaseDialog.js';
import { CreateMLCCaseDialog } from './dialogs/CreateMLCCaseDialog.js';
import { CreateAmbulanceTransferDialog } from './dialogs/CreateAmbulanceTransferDialog.js';
import { CreateDispositionDialog } from './dialogs/CreateDispositionDialog.js';
import { CreateEmergencyDeathDialog } from './dialogs/CreateEmergencyDeathDialog.js';
import { ActivateDisasterModeDialog } from './dialogs/ActivateDisasterModeDialog.js';
import { RegisterDisasterPatientDialog } from './dialogs/RegisterDisasterPatientDialog.js';
import { CheckCrashCartDialog } from './dialogs/CheckCrashCartDialog.js';

export type EmergencyTab =
  | 'command-center'
  | 'dashboard'
  | 'queue'
  | 'patient'
  | 'triage'
  | 'resuscitation'
  | 'trauma'
  | 'trauma-patient'
  | 'observation'
  | 'procedure'
  | 'mlc'
  | 'ambulance'
  | 'crash-cart'
  | 'disposition'
  | 'death'
  | 'disaster'
  | 'staff'
  | 'analytics'
  | 'audit-vault'
  | 'control-center';

interface Props {
  tenantId?: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
}

export const EmergencyDomainManager: React.FC<Props> = ({
  tenantId = '11111111-1111-4111-8111-111111111111',
  partnerId = '22222222-2222-4222-8222-222222222222',
  organizationId = '33333333-3333-4333-8333-333333333333',
  branchId = '44444444-4444-4444-8444-444444444444'
}) => {
  const [activeTab, setActiveTab] = useState<EmergencyTab>('command-center');
  const [loading, setLoading] = useState(true);

  // Datasets
  const [department, setDepartment] = useState<EmergencyDepartmentDto | null>(null);
  const [zones, setZones] = useState<EmergencyZoneDto[]>([]);
  const [encounters, setEncounters] = useState<EmergencyEncounterDto[]>([]);
  const [triageAssessments, setTriageAssessments] = useState<EmergencyTriageAssessmentDto[]>([]);
  const [resuscitationEvents, setResuscitationEvents] = useState<EmergencyResuscitationEventDto[]>([]);
  const [traumaActivations, setTraumaActivations] = useState<TraumaActivationDto[]>([]);
  const [observationCases, setObservationCases] = useState<EmergencyObservationCaseDto[]>([]);
  const [mlcCases, setMlcCases] = useState<EmergencyMLCCaseDto[]>([]);
  const [crashCarts, setCrashCarts] = useState<EmergencyCrashCartDto[]>([]);
  const [ambulanceTransfers, setAmbulanceTransfers] = useState<EmergencyAmbulanceTransferDto[]>([]);
  const [dispositions, setDispositions] = useState<EmergencyDispositionDto[]>([]);
  const [deathRecords, setDeathRecords] = useState<EmergencyDeathRecordDto[]>([]);
  const [disasterEvents, setDisasterEvents] = useState<EmergencyDisasterEventDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<EmergencyAuditTraceDto[]>([]);
  const [metrics, setMetrics] = useState<EmergencyOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<EmergencyAnalyticsDto | null>(null);

  // Selected Entities
  const [selectedEncounter, setSelectedEncounter] = useState<EmergencyEncounterDto | null>(null);
  const [selectedTrauma, setSelectedTrauma] = useState<TraumaActivationDto | null>(null);
  const [selectedResusEvent, setSelectedResusEvent] = useState<EmergencyResuscitationEventDto | null>(null);
  const [selectedCart, setSelectedCart] = useState<EmergencyCrashCartDto | null>(null);

  // Dialog States
  const [isArrivalOpen, setIsArrivalOpen] = useState(false);
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isReassessOpen, setIsReassessOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResusOpen, setIsResusOpen] = useState(false);
  const [isResusActionOpen, setIsResusActionOpen] = useState(false);
  const [isTraumaOpen, setIsTraumaOpen] = useState(false);
  const [isTraumaSecondaryOpen, setIsTraumaSecondaryOpen] = useState(false);
  const [isProcedureOpen, setIsProcedureOpen] = useState(false);
  const [isObsOpen, setIsObsOpen] = useState(false);
  const [isMLCOpen, setIsMLCOpen] = useState(false);
  const [isAmbulanceOpen, setIsAmbulanceOpen] = useState(false);
  const [isDispositionOpen, setIsDispositionOpen] = useState(false);
  const [isDeathOpen, setIsDeathOpen] = useState(false);
  const [isDisasterOpen, setIsDisasterOpen] = useState(false);
  const [isDisasterPatientOpen, setIsDisasterPatientOpen] = useState(false);
  const [isCartCheckOpen, setIsCartCheckOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        deptRes,
        zonesRes,
        encRes,
        triageRes,
        resusRes,
        traumaRes,
        obsRes,
        mlcRes,
        cartsRes,
        transfersRes,
        dispRes,
        deathRes,
        disasterRes,
        tracesRes,
        metricsRes,
        analyticsRes
      ] = await Promise.all([
        emergencyManagementService.getDepartment(tenantId),
        emergencyManagementService.getZones(tenantId),
        emergencyManagementService.getEncounters(tenantId),
        emergencyManagementService.getTriageAssessments(tenantId),
        emergencyManagementService.getResuscitationEvents(tenantId),
        emergencyManagementService.getTraumaActivations(tenantId),
        emergencyManagementService.getObservationCases(tenantId),
        emergencyManagementService.getMLCCases(tenantId),
        emergencyManagementService.getCrashCarts(tenantId),
        emergencyManagementService.getAmbulanceTransfers(tenantId),
        emergencyManagementService.getDispositions(tenantId),
        emergencyManagementService.getDeathRecords(tenantId),
        emergencyManagementService.getDisasterEvents(tenantId),
        emergencyManagementService.getAuditTraces(tenantId),
        emergencyManagementService.getOverviewMetrics(tenantId),
        emergencyManagementService.getAnalytics(tenantId)
      ]);

      setDepartment(deptRes);
      setZones(zonesRes);
      setEncounters(encRes);
      setTriageAssessments(triageRes);
      setResuscitationEvents(resusRes);
      setTraumaActivations(traumaRes);
      setObservationCases(obsRes);
      setMlcCases(mlcRes);
      setCrashCarts(cartsRes);
      setAmbulanceTransfers(transfersRes);
      setDispositions(dispRes);
      setDeathRecords(deathRes);
      setDisasterEvents(disasterRes);
      setAuditTraces(tracesRes);
      setMetrics(metricsRes);
      setAnalytics(analyticsRes);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !metrics || !analytics || !department) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-700">Connecting to Emergency & Trauma Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 gap-2 text-xs font-semibold scrollbar-none">
        <button onClick={() => setActiveTab('command-center')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'command-center' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🚨 Command Center</button>
        <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>📊 ED Dashboard</button>
        <button onClick={() => setActiveTab('queue')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'queue' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>📋 Priority Queue</button>
        <button onClick={() => setActiveTab('triage')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'triage' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🩺 Triage Desk</button>
        <button onClick={() => setActiveTab('resuscitation')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'resuscitation' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>⚡ Resuscitation / Code Blue</button>
        <button onClick={() => setActiveTab('trauma')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'trauma' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🩸 Trauma Command</button>
        <button onClick={() => setActiveTab('observation')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'observation' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🛏 Observation Unit</button>
        <button onClick={() => setActiveTab('procedure')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'procedure' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>💉 ED Procedures</button>
        <button onClick={() => setActiveTab('mlc')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'mlc' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>⚖ Medico-Legal (MLC)</button>
        <button onClick={() => setActiveTab('ambulance')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'ambulance' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🚑 Ambulance Transit</button>
        <button onClick={() => setActiveTab('crash-cart')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'crash-cart' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🛒 Crash Cart</button>
        <button onClick={() => setActiveTab('disposition')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'disposition' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🚪 Dispositions</button>
        <button onClick={() => setActiveTab('death')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'death' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>⚰ Death Registry</button>
        <button onClick={() => setActiveTab('disaster')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'disaster' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>☢ Disaster / MCI</button>
        <button onClick={() => setActiveTab('staff')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'staff' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>👨‍⚕ ED Staff</button>
        <button onClick={() => setActiveTab('analytics')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'analytics' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>📈 ED Analytics</button>
        <button onClick={() => setActiveTab('audit-vault')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'audit-vault' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🔒 Audit Vault</button>
        <button onClick={() => setActiveTab('control-center')} className={`px-3 py-2 rounded-lg whitespace-nowrap ${activeTab === 'control-center' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>⚙ SOP Protocols</button>
      </div>

      {/* Render Active View */}
      {activeTab === 'command-center' && (
        <EmergencyCommandCenterView
          metrics={metrics}
          encounters={encounters}
          zones={zones}
          onRegisterArrival={() => setIsArrivalOpen(true)}
          onActivateDisaster={() => setIsDisasterOpen(true)}
        />
      )}

      {activeTab === 'dashboard' && (
        <EmergencyDashboardView
          metrics={metrics}
          encounters={encounters}
          onOpenQueue={() => setActiveTab('queue')}
          onOpenTriage={() => setActiveTab('triage')}
        />
      )}

      {activeTab === 'queue' && (
        <EmergencyQueueView
          encounters={encounters}
          onTriage={(e) => { setSelectedEncounter(e); setIsTriageOpen(true); }}
          onReassess={(e) => { setSelectedEncounter(e); setIsReassessOpen(true); }}
          onAssign={(e) => { setSelectedEncounter(e); setIsAssignOpen(true); }}
          onDisposition={(e) => { setSelectedEncounter(e); setIsDispositionOpen(true); }}
        />
      )}

      {activeTab === 'patient' && (
        <EmergencyPatientView
          encounter={selectedEncounter}
          onBack={() => setActiveTab('queue')}
          onTriage={(e) => { setSelectedEncounter(e); setIsTriageOpen(true); }}
          onDisposition={(e) => { setSelectedEncounter(e); setIsDispositionOpen(true); }}
        />
      )}

      {activeTab === 'triage' && (
        <EmergencyTriageView
          assessments={triageAssessments}
          encounters={encounters}
          onTriageEncounter={(e) => { setSelectedEncounter(e); setIsTriageOpen(true); }}
        />
      )}

      {activeTab === 'resuscitation' && (
        <ResuscitationView
          events={resuscitationEvents}
          encounters={encounters}
          onStartResus={(e) => { setSelectedEncounter(e); setIsResusOpen(true); }}
          onRecordAction={(ev) => { setSelectedResusEvent(ev); setIsResusActionOpen(true); }}
        />
      )}

      {activeTab === 'trauma' && (
        <TraumaCommandView
          traumas={traumaActivations}
          encounters={encounters}
          onActivateTrauma={(e) => { setSelectedEncounter(e); setIsTraumaOpen(true); }}
          onRecordSecondary={(t) => { setSelectedTrauma(t); setIsTraumaSecondaryOpen(true); }}
        />
      )}

      {activeTab === 'trauma-patient' && (
        <TraumaPatientView
          trauma={selectedTrauma}
          onBack={() => setActiveTab('trauma')}
          onRecordSecondary={(t) => { setSelectedTrauma(t); setIsTraumaSecondaryOpen(true); }}
        />
      )}

      {activeTab === 'observation' && (
        <EmergencyObservationView
          cases={observationCases}
          encounters={encounters}
          onAdmitToObservation={(e) => { setSelectedEncounter(e); setIsObsOpen(true); }}
        />
      )}

      {activeTab === 'procedure' && (
        <EmergencyProcedureView
          encounters={encounters}
          onOpenProcedureDialog={(e) => { setSelectedEncounter(e); setIsProcedureOpen(true); }}
        />
      )}

      {activeTab === 'mlc' && (
        <MLCWorkbenchView
          cases={mlcCases}
          encounters={encounters}
          onRegisterMLC={(e) => { setSelectedEncounter(e); setIsMLCOpen(true); }}
        />
      )}

      {activeTab === 'ambulance' && (
        <AmbulanceTransferView
          transfers={ambulanceTransfers}
          encounters={encounters}
          onDispatchAmbulance={(e) => { setSelectedEncounter(e); setIsAmbulanceOpen(true); }}
        />
      )}

      {activeTab === 'crash-cart' && (
        <CrashCartView
          carts={crashCarts}
          onCheckCart={(c) => { setSelectedCart(c); setIsCartCheckOpen(true); }}
        />
      )}

      {activeTab === 'disposition' && (
        <EmergencyDispositionView
          dispositions={dispositions}
          encounters={encounters}
          onAuthorizeDisposition={(e) => { setSelectedEncounter(e); setIsDispositionOpen(true); }}
        />
      )}

      {activeTab === 'death' && (
        <EmergencyDeathView
          deaths={deathRecords}
          encounters={encounters}
          onCertifyDeath={(e) => { setSelectedEncounter(e); setIsDeathOpen(true); }}
        />
      )}

      {activeTab === 'disaster' && (
        <DisasterManagementView
          events={disasterEvents}
          onActivateDisaster={() => setIsDisasterOpen(true)}
          onRegisterVictim={() => setIsDisasterPatientOpen(true)}
        />
      )}

      {activeTab === 'staff' && <EmergencyStaffView department={department} />}
      {activeTab === 'analytics' && <EmergencyAnalyticsView analytics={analytics} />}
      {activeTab === 'audit-vault' && <EmergencyAuditVaultView traces={auditTraces} />}
      {activeTab === 'control-center' && <EmergencyControlCenterView />}

      {/* Audited Dialog Modals */}
      <RegisterEmergencyPatientDialog
        isOpen={isArrivalOpen}
        onClose={() => setIsArrivalOpen(false)}
        onSubmit={async (req: RegisterEmergencyPatientRequest) => {
          await emergencyManagementService.registerEmergencyPatient(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateTriageAssessmentDialog
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateTriageAssessmentRequest) => {
          await emergencyManagementService.createTriageAssessment(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <ReassessTriageDialog
        isOpen={isReassessOpen}
        onClose={() => setIsReassessOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: ReassessTriageRequest) => {
          await emergencyManagementService.reassessTriage(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <AssignEmergencyPatientDialog
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        encounter={selectedEncounter}
        zones={zones}
        onSubmit={async (req: AssignEmergencyPatientRequest) => {
          await emergencyManagementService.assignEmergencyPatient(req);
          await loadData();
        }}
        tenantId={tenantId}
      />

      <CreateResuscitationEventDialog
        isOpen={isResusOpen}
        onClose={() => setIsResusOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateResuscitationEventRequest) => {
          await emergencyManagementService.createResuscitationEvent(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <RecordResuscitationActionDialog
        isOpen={isResusActionOpen}
        onClose={() => setIsResusActionOpen(false)}
        event={selectedResusEvent}
        onSubmit={async (req: RecordResuscitationActionRequest) => {
          await emergencyManagementService.recordResuscitationAction(req);
          await loadData();
        }}
        tenantId={tenantId}
      />

      <CreateTraumaActivationDialog
        isOpen={isTraumaOpen}
        onClose={() => setIsTraumaOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateTraumaActivationRequest) => {
          await emergencyManagementService.createTraumaActivation(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <RecordTraumaAssessmentDialog
        isOpen={isTraumaSecondaryOpen}
        onClose={() => setIsTraumaSecondaryOpen(false)}
        trauma={selectedTrauma}
        onSubmit={async (req: RecordTraumaAssessmentRequest) => {
          await emergencyManagementService.recordTraumaAssessment(req);
          await loadData();
        }}
        tenantId={tenantId}
      />

      <CreateEmergencyProcedureDialog
        isOpen={isProcedureOpen}
        onClose={() => setIsProcedureOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateEmergencyProcedureRequest) => {
          await emergencyManagementService.createEmergencyProcedure(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateObservationCaseDialog
        isOpen={isObsOpen}
        onClose={() => setIsObsOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateObservationCaseRequest) => {
          await emergencyManagementService.createObservationCase(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateMLCCaseDialog
        isOpen={isMLCOpen}
        onClose={() => setIsMLCOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateMLCCaseRequest) => {
          await emergencyManagementService.createMLCCase(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateAmbulanceTransferDialog
        isOpen={isAmbulanceOpen}
        onClose={() => setIsAmbulanceOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateAmbulanceTransferRequest) => {
          await emergencyManagementService.createAmbulanceTransfer(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateDispositionDialog
        isOpen={isDispositionOpen}
        onClose={() => setIsDispositionOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateDispositionRequest) => {
          await emergencyManagementService.createDisposition(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateEmergencyDeathDialog
        isOpen={isDeathOpen}
        onClose={() => setIsDeathOpen(false)}
        encounter={selectedEncounter}
        onSubmit={async (req: CreateEmergencyDeathRecordRequest) => {
          await emergencyManagementService.createDeathRecord(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <ActivateDisasterModeDialog
        isOpen={isDisasterOpen}
        onClose={() => setIsDisasterOpen(false)}
        onSubmit={async (req: ActivateDisasterModeRequest) => {
          await emergencyManagementService.activateDisasterMode(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <RegisterDisasterPatientDialog
        isOpen={isDisasterPatientOpen}
        onClose={() => setIsDisasterPatientOpen(false)}
        onSubmit={async (req: RegisterDisasterPatientRequest) => {
          await emergencyManagementService.registerDisasterPatient(req);
          await loadData();
        }}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CheckCrashCartDialog
        isOpen={isCartCheckOpen}
        onClose={() => setIsCartCheckOpen(false)}
        cart={selectedCart}
        onSubmit={async (req: CheckCrashCartRequest) => {
          await emergencyManagementService.checkCrashCart(req);
          await loadData();
        }}
        tenantId={tenantId}
      />
    </div>
  );
};
