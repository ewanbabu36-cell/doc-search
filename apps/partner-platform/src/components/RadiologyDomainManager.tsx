import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@docsearch/ui-kit';
import { radiologyManagementService } from '../services/radiology-management-service.js';
import type {
  RadiologyOverviewMetricsDto,
  RadiologyAnalyticsDto,
  RadiologyDepartmentDto,
  RadiologyModalityDto,
  RadiologyProcedureCatalogDto,
  RadiologyOrderDto,
  RadiologyAppointmentDto,
  RadiologyPreparationRecordDto,
  RadiologyStudyDto,
  RadiologyReportDto,
  RadiologyCriticalFindingDto,
  RadiologyQualityEventDto,
  RadiologyAuditTraceDto,
  CreateRadiologyOrderRequest,
  ScheduleRadiologyStudyRequest,
  RescheduleRadiologyStudyRequest,
  CancelRadiologyStudyRequest,
  RecordPreparationRequest,
  StartRadiologyProcedureRequest,
  CompleteRadiologyProcedureRequest,
  CreateRadiologyReportRequest,
  FinalizeRadiologyReportRequest,
  AmendRadiologyReportRequest,
  RecordCriticalFindingRequest,
  AcknowledgeCriticalFindingRequest,
  CreatePacsReferenceRequest
} from '@docsearch/api-contracts';

// Views
import { RadiologyOverviewView } from './views/RadiologyOverviewView.js';
import { RadiologyControlCenterView } from './views/RadiologyControlCenterView.js';
import { RadiologyOrderDirectoryView } from './views/RadiologyOrderDirectoryView.js';
import { RadiologyOrderDetailView } from './views/RadiologyOrderDetailView.js';
import { RadiologySchedulingView } from './views/RadiologySchedulingView.js';
import { RadiologyModalityBoardView } from './views/RadiologyModalityBoardView.js';
import { RadiologyTechnologistWorklistView } from './views/RadiologyTechnologistWorklistView.js';
import { RadiologyPreparationView } from './views/RadiologyPreparationView.js';
import { RadiologyStudyWorklistView } from './views/RadiologyStudyWorklistView.js';
import { RadiologistWorkbenchView } from './views/RadiologistWorkbenchView.js';
import { RadiologyReportingView } from './views/RadiologyReportingView.js';
import { RadiologyCriticalFindingsView } from './views/RadiologyCriticalFindingsView.js';
import { RadiologyPacsView } from './views/RadiologyPacsView.js';
import { RadiologyProcedureCatalogView } from './views/RadiologyProcedureCatalogView.js';
import { RadiologyQualityView } from './views/RadiologyQualityView.js';
import { RadiologyAnalyticsView } from './views/RadiologyAnalyticsView.js';
import { RadiologyAuditVaultView } from './views/RadiologyAuditVaultView.js';
import { AiChestXrayTriageView } from './views/AiChestXrayTriageView.js';

// Dialogs
import { CreateRadiologyOrderDialog } from './dialogs/CreateRadiologyOrderDialog.js';
import { ScheduleRadiologyDialog } from './dialogs/ScheduleRadiologyDialog.js';
import { RescheduleRadiologyDialog } from './dialogs/RescheduleRadiologyDialog.js';
import { CancelRadiologyDialog } from './dialogs/CancelRadiologyDialog.js';
import { StartProcedureDialog } from './dialogs/StartProcedureDialog.js';
import { CompleteProcedureDialog } from './dialogs/CompleteProcedureDialog.js';
import { PreparationChecklistDialog } from './dialogs/PreparationChecklistDialog.js';
import { CreateRadiologyReportDialog } from './dialogs/CreateRadiologyReportDialog.js';
import { FinalizeRadiologyReportDialog } from './dialogs/FinalizeRadiologyReportDialog.js';
import { AmendRadiologyReportDialog } from './dialogs/AmendRadiologyReportDialog.js';
import { CriticalFindingDialog } from './dialogs/CriticalFindingDialog.js';
import { AcknowledgeCriticalFindingDialog } from './dialogs/AcknowledgeCriticalFindingDialog.js';
import { PacsReferenceDialog } from './dialogs/PacsReferenceDialog.js';

interface Props {
  tenantId: string;
}

type TabType =
  | 'overview'
  | 'ai-chest-xray'
  | 'orders'
  | 'scheduling'
  | 'modalities'
  | 'tech-worklist'
  | 'preparation'
  | 'studies'
  | 'radiologist-workbench'
  | 'reports'
  | 'critical-findings'
  | 'pacs'
  | 'catalog'
  | 'quality'
  | 'analytics'
  | 'audit-vault'
  | 'control-center';

type TabBadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export const RadiologyDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  // Domain State
  const [metrics, setMetrics] = useState<RadiologyOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<RadiologyAnalyticsDto | null>(null);
  const [department, setDepartment] = useState<RadiologyDepartmentDto | null>(null);
  const [modalities, setModalities] = useState<RadiologyModalityDto[]>([]);
  const [procedures, setProcedures] = useState<RadiologyProcedureCatalogDto[]>([]);
  const [orders, setOrders] = useState<RadiologyOrderDto[]>([]);
  const [appointments, setAppointments] = useState<RadiologyAppointmentDto[]>([]);
  const [preparations, setPreparations] = useState<RadiologyPreparationRecordDto[]>([]);
  const [studies, setStudies] = useState<RadiologyStudyDto[]>([]);
  const [reports, setReports] = useState<RadiologyReportDto[]>([]);
  const [criticalFindings, setCriticalFindings] = useState<RadiologyCriticalFindingDto[]>([]);
  const [qualityEvents, setQualityEvents] = useState<RadiologyQualityEventDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<RadiologyAuditTraceDto[]>([]);

  // Selection & Dialog State
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrderDto | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<RadiologyAppointmentDto | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<RadiologyStudyDto | null>(null);
  const [selectedReport, setSelectedReport] = useState<RadiologyReportDto | null>(null);
  const [selectedCriticalFinding, setSelectedCriticalFinding] = useState<RadiologyCriticalFindingDto | null>(null);

  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isStartProcOpen, setIsStartProcOpen] = useState(false);
  const [isCompleteProcOpen, setIsCompleteProcOpen] = useState(false);
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [isFinalizeReportOpen, setIsFinalizeReportOpen] = useState(false);
  const [isAmendReportOpen, setIsAmendReportOpen] = useState(false);
  const [isCriticalFindingOpen, setIsCriticalFindingOpen] = useState(false);
  const [isAcknowledgeCriticalOpen, setIsAcknowledgeCriticalOpen] = useState(false);
  const [isPacsRefOpen, setIsPacsRefOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, a, d, md, pr, ord, app, prep, st, rep, cf, qe, at] = await Promise.all([
        radiologyManagementService.getOverviewMetrics(tenantId),
        radiologyManagementService.getAnalytics(tenantId),
        radiologyManagementService.getDepartment(tenantId),
        radiologyManagementService.getModalities(tenantId),
        radiologyManagementService.getProcedures(tenantId),
        radiologyManagementService.getOrders(tenantId),
        radiologyManagementService.getAppointments(tenantId),
        radiologyManagementService.getPreparationRecords(tenantId),
        radiologyManagementService.getStudies(tenantId),
        radiologyManagementService.getReports(tenantId),
        radiologyManagementService.getCriticalFindings(tenantId),
        radiologyManagementService.getQualityEvents(tenantId),
        radiologyManagementService.getAuditTraces(tenantId)
      ]);
      setMetrics(m);
      setAnalytics(a);
      setDepartment(d);
      setModalities(md);
      setProcedures(pr);
      setOrders(ord);
      setAppointments(app);
      setPreparations(prep);
      setStudies(st);
      setReports(rep);
      setCriticalFindings(cf);
      setQualityEvents(qe);
      setAuditTraces(at);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCriticalCount = criticalFindings.filter((c) => c.status !== 'ACKNOWLEDGED_BY_CLINICIAN').length;

  const tabs: { id: TabType; label: string; count?: number; badgeVariant?: TabBadgeVariant }[] = [
    { id: 'overview', label: 'Radiology Overview' },
    { id: 'orders', label: 'Imaging Orders', count: orders.length },
    { id: 'scheduling', label: 'Modality Scheduling', count: appointments.length },
    { id: 'modalities', label: 'Modality Fleet', count: modalities.length },
    { id: 'tech-worklist', label: 'Technologist Queue', count: orders.filter((o) => o.status === 'SCHEDULED' || o.status === 'IN_PROGRESS').length },
    { id: 'preparation', label: 'Patient Safety & Prep', count: preparations.length },
    { id: 'studies', label: 'Acquired Studies (PACS)', count: studies.length },
    { id: 'radiologist-workbench', label: 'Radiologist Workbench', count: studies.filter((s) => s.status === 'ACQUIRED').length, badgeVariant: 'warning' },
    { id: 'reports', label: 'Diagnostic Reports', count: reports.length },
    {
      id: 'critical-findings',
      label: 'Critical Findings Alert',
      count: pendingCriticalCount,
      badgeVariant: pendingCriticalCount > 0 ? 'danger' : 'neutral'
    },
    { id: 'pacs', label: 'DICOM Nodes' },
    { id: 'catalog', label: 'Procedure Catalog', count: procedures.length },
    { id: 'quality', label: 'QA & Dose Compliance', count: qualityEvents.length },
    { id: 'analytics', label: 'Analytics' },
    { id: 'audit-vault', label: 'Audit Vault', count: auditTraces.length },
    { id: 'control-center', label: 'Control Center' }
  ];

  if (loading || !metrics || !analytics || !department) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin text-3xl mb-2">🩻</div>
        <div>Loading Radiology, Medical Imaging & PACS / RIS Domain...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white px-4 pt-2 gap-1 rounded-t-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedOrder(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant={tab.badgeVariant || (activeTab === tab.id ? 'primary' : 'neutral')}>
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      <div className="p-1">
        {activeTab === 'overview' && (
          <RadiologyOverviewView
            metrics={metrics}
            orders={orders}
            criticalFindings={criticalFindings}
            modalities={modalities}
            onOpenNewOrder={() => setIsCreateOrderOpen(true)}
            onOpenCriticalAlerts={() => setActiveTab('critical-findings')}
          />
        )}

        {activeTab === 'orders' && (
          selectedOrder ? (
            <RadiologyOrderDetailView
              order={selectedOrder}
              preparation={preparations.find((p) => p.orderId === selectedOrder.id)}
              study={studies.find((s) => s.orderId === selectedOrder.id)}
              onBack={() => setSelectedOrder(null)}
              onPreparation={() => setIsPrepOpen(true)}
              onStartProcedure={() => setIsStartProcOpen(true)}
            />
          ) : (
            <RadiologyOrderDirectoryView
              orders={orders}
              onOpenOrder={(o) => setSelectedOrder(o)}
              onSchedule={(o) => {
                setSelectedOrder(o);
                setIsScheduleOpen(true);
              }}
              onCancel={(o) => {
                setSelectedOrder(o);
                setIsCancelOpen(true);
              }}
              onOpenNewOrder={() => setIsCreateOrderOpen(true)}
            />
          )
        )}

        {activeTab === 'scheduling' && (
          <RadiologySchedulingView
            appointments={appointments}
            onReschedule={(app) => {
              setSelectedAppointment(app);
              setIsRescheduleOpen(true);
            }}
          />
        )}

        {activeTab === 'modalities' && <RadiologyModalityBoardView modalities={modalities} />}

        {activeTab === 'tech-worklist' && (
          <RadiologyTechnologistWorklistView
            orders={orders}
            onStartProcedure={(o) => {
              setSelectedOrder(o);
              setIsStartProcOpen(true);
            }}
            onCompleteProcedure={(o) => {
              setSelectedOrder(o);
              setIsCompleteProcOpen(true);
            }}
          />
        )}

        {activeTab === 'preparation' && <RadiologyPreparationView records={preparations} />}

        {activeTab === 'studies' && (
          <RadiologyStudyWorklistView
            studies={studies}
            onOpenReport={(s) => {
              setSelectedStudy(s);
              setIsCreateReportOpen(true);
            }}
            onConfigurePacs={(s) => {
              setSelectedStudy(s);
              setIsPacsRefOpen(true);
            }}
          />
        )}

        {activeTab === 'radiologist-workbench' && (
          <RadiologistWorkbenchView
            studies={studies}
            reports={reports}
            onOpenDraftReport={(s) => {
              setSelectedStudy(s);
              setIsCreateReportOpen(true);
            }}
            onFinalizeReport={(r) => {
              setSelectedReport(r);
              setIsFinalizeReportOpen(true);
            }}
            onFlagCritical={(r) => {
              setSelectedReport(r);
              setIsCriticalFindingOpen(true);
            }}
          />
        )}

        {activeTab === 'reports' && (
          <RadiologyReportingView
            reports={reports}
            onAmend={(r) => {
              setSelectedReport(r);
              setIsAmendReportOpen(true);
            }}
          />
        )}

        {activeTab === 'critical-findings' && (
          <RadiologyCriticalFindingsView
            findings={criticalFindings}
            onAcknowledge={(f) => {
              setSelectedCriticalFinding(f);
              setIsAcknowledgeCriticalOpen(true);
            }}
          />
        )}

        {activeTab === 'pacs' && <RadiologyPacsView studies={studies} />}
        {activeTab === 'ai-chest-xray' && <AiChestXrayTriageView />}

        {activeTab === 'catalog' && <RadiologyProcedureCatalogView procedures={procedures} />}

        {activeTab === 'quality' && <RadiologyQualityView events={qualityEvents} />}

        {activeTab === 'analytics' && <RadiologyAnalyticsView analytics={analytics} />}

        {activeTab === 'audit-vault' && <RadiologyAuditVaultView auditTraces={auditTraces} />}

        {activeTab === 'control-center' && (
          <RadiologyControlCenterView
            department={department}
            metrics={metrics}
            onRefresh={loadData}
          />
        )}
      </div>

      {/* Dialog Modals */}
      <CreateRadiologyOrderDialog
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        procedures={procedures}
        onSubmit={async (req: CreateRadiologyOrderRequest) => {
          await radiologyManagementService.createOrder(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <ScheduleRadiologyDialog
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        order={selectedOrder}
        modalities={modalities}
        onSubmit={async (req: ScheduleRadiologyStudyRequest) => {
          await radiologyManagementService.scheduleStudy(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <RescheduleRadiologyDialog
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        appointment={selectedAppointment}
        onSubmit={async (req: RescheduleRadiologyStudyRequest) => {
          await radiologyManagementService.rescheduleStudy(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <CancelRadiologyDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        order={selectedOrder}
        onSubmit={async (req: CancelRadiologyStudyRequest) => {
          await radiologyManagementService.cancelStudy(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <PreparationChecklistDialog
        isOpen={isPrepOpen}
        onClose={() => setIsPrepOpen(false)}
        order={selectedOrder}
        onSubmit={async (req: RecordPreparationRequest) => {
          await radiologyManagementService.recordPreparation(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <StartProcedureDialog
        isOpen={isStartProcOpen}
        onClose={() => setIsStartProcOpen(false)}
        order={selectedOrder}
        onSubmit={async (req: StartRadiologyProcedureRequest) => {
          await radiologyManagementService.startProcedure(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <CompleteProcedureDialog
        isOpen={isCompleteProcOpen}
        onClose={() => setIsCompleteProcOpen(false)}
        order={selectedOrder}
        onSubmit={async (req: CompleteRadiologyProcedureRequest) => {
          await radiologyManagementService.completeProcedure(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <CreateRadiologyReportDialog
        isOpen={isCreateReportOpen}
        onClose={() => setIsCreateReportOpen(false)}
        study={selectedStudy}
        onSubmit={async (req: CreateRadiologyReportRequest) => {
          await radiologyManagementService.createReport(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <FinalizeRadiologyReportDialog
        isOpen={isFinalizeReportOpen}
        onClose={() => setIsFinalizeReportOpen(false)}
        report={selectedReport}
        onSubmit={async (req: FinalizeRadiologyReportRequest) => {
          await radiologyManagementService.finalizeReport(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <AmendRadiologyReportDialog
        isOpen={isAmendReportOpen}
        onClose={() => setIsAmendReportOpen(false)}
        report={selectedReport}
        onSubmit={async (req: AmendRadiologyReportRequest) => {
          await radiologyManagementService.amendReport(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <CriticalFindingDialog
        isOpen={isCriticalFindingOpen}
        onClose={() => setIsCriticalFindingOpen(false)}
        report={selectedReport}
        onSubmit={async (req: RecordCriticalFindingRequest) => {
          await radiologyManagementService.recordCriticalFinding(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <AcknowledgeCriticalFindingDialog
        isOpen={isAcknowledgeCriticalOpen}
        onClose={() => setIsAcknowledgeCriticalOpen(false)}
        finding={selectedCriticalFinding}
        onSubmit={async (req: AcknowledgeCriticalFindingRequest) => {
          await radiologyManagementService.acknowledgeCriticalFinding(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <PacsReferenceDialog
        isOpen={isPacsRefOpen}
        onClose={() => setIsPacsRefOpen(false)}
        study={selectedStudy}
        onSubmit={async (req: CreatePacsReferenceRequest) => {
          await radiologyManagementService.createPacsReference(req);
          loadData();
        }}
        tenantId={tenantId}
      />
    </div>
  );
};
