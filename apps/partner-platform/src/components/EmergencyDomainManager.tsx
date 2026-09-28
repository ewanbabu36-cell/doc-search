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
import { OfflineMeshDisasterSyncView } from './views/OfflineMeshDisasterSyncView.js';
import { TabOverflowMenu } from './common/TabOverflowMenu.js';
import { DocSearchSpatialCore3D, SkeletonPage } from '@docsearch/ui-kit';

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
import { BreakGlassEmergencyModal } from './security/BreakGlassEmergencyModal.js';

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
  | 'mesh-network'
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
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState(false);

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
    return <SkeletonPage layout="cards" metricCount={4} />;
  }

  return (
    <div className="space-y-6">
      {/* 3D Spatial Feature Core: Emergency & Trauma */}
      <DocSearchSpatialCore3D
        preset="emergency"
        height={360}
        interactive={true}
        onNodeClick={(id) => {
          if (id === 'esi-triage') {
            setActiveTab('triage');
          } else if (id === 'crash-cart') {
            setActiveTab('crash-cart');
          } else if (id === 'stat-bed') {
            setActiveTab('queue');
          } else if (id === 'blood-bank') {
            setActiveTab('resuscitation');
          } else if (id === 'trauma-call') {
            setActiveTab('trauma');
          } else if (id === 'mlc-registry') {
            setActiveTab('mlc');
          } else if (id === 'ambulance-gps') {
            setActiveTab('ambulance');
          }
        }}
      />

      {/* Tab Navigation */}
      <div
        style={{
          position: 'relative',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--ds-color-surface)',
          border: '1px solid var(--ds-color-border)',
          borderRadius: '10px',
          padding: '6px 8px'
        }}
      >
        {[
          { id: 'command-center', label: '🚨 Command Center' },
          { id: 'triage', label: '🩺 Triage Desk' },
          { id: 'queue', label: '📋 Priority Queue' },
          { id: 'resuscitation', label: '⚡ Code Blue / Resus' },
          { id: 'trauma', label: '🩸 Trauma Command' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as EmergencyTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--ds-color-text-muted)',
                backgroundColor: isActive ? 'var(--ds-color-danger, #DC2626)' : 'transparent',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--ds-color-danger, #EF4444)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--ds-color-surface-hover)';
                  e.currentTarget.style.color = 'var(--ds-color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--ds-color-text-muted)';
                }
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Secondary Modules Selector Dropdown */}
        <TabOverflowMenu
          label="More Emergency Tools"
          options={[
            { id: 'dashboard', label: '📊 ED Dashboard' },
            { id: 'observation', label: '🛏 Observation Unit' },
            { id: 'procedure', label: '💉 ED Procedures' },
            { id: 'mlc', label: '⚖ Medico-Legal (MLC)' },
            { id: 'ambulance', label: '🚑 Ambulance Transit' },
            { id: 'crash-cart', label: '🛒 Crash Cart' },
            { id: 'disposition', label: '🚪 Dispositions' },
            { id: 'death', label: '⚰ Death Registry' },
            { id: 'disaster', label: '☢ Disaster / MCI' },
            { id: 'mesh-network', label: '🌐 P2P Mesh Network' },
            { id: 'staff', label: '👨‍⚕ ED Staff' },
            { id: 'analytics', label: '📈 ED Analytics' },
            { id: 'audit-vault', label: '🔒 Audit Vault' },
            { id: 'control-center', label: '⚙ SOP Protocols' }
          ]}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as EmergencyTab)}
          onReset={() => setActiveTab('command-center')}
          accentColor="#DC2626"
          activeBorderColor="#EF4444"
        />
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
          onSelectPatient={(e) => { setSelectedEncounter(e); setActiveTab('patient'); }}
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
          onSelectTrauma={(t) => { setSelectedTrauma(t); setActiveTab('trauma-patient'); }}
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
          onOpenMeshNetwork={() => setActiveTab('mesh-network')}
        />
      )}

      {activeTab === 'mesh-network' && <OfflineMeshDisasterSyncView />}

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

      <BreakGlassEmergencyModal
        isOpen={isBreakGlassOpen}
        onClose={() => setIsBreakGlassOpen(false)}
        onOverrideSuccess={(res) => {
          console.log('[BreakGlass] Override authorized:', res);
          loadData();
        }}
      />
    </div>
  );
};
