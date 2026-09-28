import React, { useState, useEffect, useCallback } from 'react';
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
import { RadiologyProcedureCatalogView } from './views/RadiologyProcedureCatalogView.js';
import { RadiologyQualityView } from './views/RadiologyQualityView.js';
import { RadiologyAnalyticsView } from './views/RadiologyAnalyticsView.js';
import { RadiologyAuditVaultView } from './views/RadiologyAuditVaultView.js';
import { WebDicomAiHeatmapViewer } from './views/WebDicomAiHeatmapViewer.js';
import { TabOverflowMenu } from './common/TabOverflowMenu.js';
import { DocSearchSpatialCore3D, Alert, SkeletonPage } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../services/hospital-event-bus.js';

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

export interface RadiologyDomainManagerProps {
  tenantId: string;
  initialTab?: TabType;
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

export const RadiologyDomainManager: React.FC<RadiologyDomainManagerProps> = ({ tenantId, initialTab }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
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
  const [radOrderAlert, setRadOrderAlert] = useState<string | null>(null);

  const syncDoctorRadiologyOrders = useCallback((baseOrders: RadiologyOrderDto[]): RadiologyOrderDto[] => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('docsearch_pending_radiology_orders') : null;
      if (!stored) return baseOrders;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) return baseOrders;

      const dynamicOrders: RadiologyOrderDto[] = [];
      parsed.forEach((entry: any) => {
        const tests = Array.isArray(entry.modalityTests) ? entry.modalityTests : [entry.modalityTests || 'Chest X-Ray'];
        tests.forEach((testName: string, idx: number) => {
          const testLower = String(testName).toLowerCase();
          const modalityType = testLower.includes('mri')
            ? 'MAGNETIC_RESONANCE_IMAGING_MRI'
            : testLower.includes('ct')
            ? 'COMPUTED_TOMOGRAPHY_CT'
            : testLower.includes('ultra') || testLower.includes('usg')
            ? 'ULTRASOUND_USG'
            : 'X_RAY_DIGITAL_RADIOGRAPHY';

          const orderId = `${entry.id || 'rad'}-${idx}`;
          const existing = baseOrders.find((o) => o.id === orderId);
          if (!existing) {
            dynamicOrders.push({
              id: orderId,
              tenantId,
              partnerId: 'default',
              organizationId: 'default',
              branchId: 'default',
              orderNumber: `RAD-${String(entry.id || Date.now()).slice(-6)}-${idx + 1}`,
              patientId: entry.patientId || `pat-${entry.patientMrn || '01'}`,
              patientName: entry.patientName || 'Patient',
              patientMrn: entry.patientMrn || 'MRN-RAD-01',
              encounterId: entry.consultationId || 'enc-rad-01',
              orderingDoctorName: entry.doctorName || 'Consulting Physician',
              orderingDepartment: 'OPD Clinical Desk',
              procedureId: `proc-rad-${idx}`,
              procedureName: testName,
              modalityType: modalityType as any,
              priority: entry.urgency === 'STAT' ? 'STAT_EMERGENCY_IMMEDIATE' : entry.urgency === 'URGENT' ? 'URGENT_WITHIN_4_HOURS' : 'ROUTINE_ELECTIVE',
              clinicalIndication: entry.clinicalIndication || 'Prescribed during Doctor OPD consultation',
              requiresContrast: false,
              status: 'ORDERED',
              orderedAt: entry.orderedAt || new Date().toISOString()
            });
          }
        });
      });

      return [...dynamicOrders, ...baseOrders];
    } catch (err) {
      console.warn('Error reading docsearch_pending_radiology_orders:', err);
      return baseOrders;
    }
  }, [tenantId]);

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
      const mergedOrders = syncDoctorRadiologyOrders(ord);
      setOrders(mergedOrders);
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
  }, [tenantId, syncDoctorRadiologyOrders]);

  useEffect(() => {
    loadData();

    const unsub = hospitalEventBus.subscribe('RADIOLOGY_ORDER_CREATED', (payload) => {
      const d = payload.data || {};
      setRadOrderAlert(`⚡ New Imaging Order: ${d.patientName || 'Patient'} (${d.modalityTests?.length || 1} scan[s])`);
      void loadData();
      setTimeout(() => setRadOrderAlert(null), 6000);
    });

    const handleStorage = () => {
      void loadData();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadData]);

  const pendingCriticalCount = criticalFindings.filter((c) => c.status !== 'ACKNOWLEDGED_BY_CLINICIAN').length;

  const tabs: { id: TabType; label: string; count?: number; badgeVariant?: TabBadgeVariant }[] = [
    { id: 'overview', label: 'Radiology Overview' },
    { id: 'ai-chest-xray', label: '🔥 Web DICOM AI Heatmap', count: 3, badgeVariant: 'danger' },
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
    { id: 'control-center', label: '🎛️ Modality Control Center' },
  ];

  const primaryTabIds: TabType[] = ['overview', 'tech-worklist', 'ai-chest-xray', 'radiologist-workbench', 'scheduling', 'orders'];
  const primaryTabs = tabs.filter((t) => primaryTabIds.includes(t.id));
  const secondaryTabs = tabs.filter((t) => !primaryTabIds.includes(t.id));

  if (loading || !metrics || !analytics || !department) {
    return <SkeletonPage layout="table" metricCount={4} />;
  }

  return (
    <div className="space-y-6">
      {/* 3D Spatial Feature Core: Radiology PACS & Clinical Imaging */}
      <DocSearchSpatialCore3D
        preset="radiology"
        height={360}
        interactive={true}
        onNodeClick={(id) => {
          if (id === 'ct-mri') {
            setActiveTab('studies');
          } else if (id === 'dicom-viewer' || id === 'ai-heatmaps') {
            setActiveTab('ai-chest-xray');
          } else if (id === 'critical-finding') {
            setActiveTab('critical-findings');
          } else if (id === 'prep-checklist') {
            setActiveTab('preparation');
          } else if (id === 'signed-reports') {
            setActiveTab('radiologist-workbench');
          } else if (id === 'pacs-archive') {
            setActiveTab('pacs');
          }
        }}
      />

      {radOrderAlert && (
        <Alert
          type="success"
          title="⚡ New OPD Imaging Order Received"
          onClose={() => setRadOrderAlert(null)}
        >
          {radOrderAlert}
        </Alert>
      )}

      {/* Persistent Emergency AI Copilot Alert Banner */}
      <div
        style={{
          backgroundColor: '#450A0A',
          border: '1.5px solid #EF4444',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.6rem' }}>🚨</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 900, color: '#FCA5A5', fontSize: '0.875rem' }}>
                AI COPILOT: STAT BRAIN HEMORRHAGE & PNEUMOTHORAX DETECTED
              </span>
              <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.65rem', fontWeight: 900, padding: '1px 6px', borderRadius: '4px' }}>
                PRIORITY #1 PINNED
              </span>
            </div>
            <div style={{ color: '#FECACA', fontSize: '0.78rem', marginTop: '2px' }}>
              Kamla Devi (71y / CT Brain: Acute SDH 14mm) & Ramesh Verma (48y / X-Ray: Tension Pneumothorax) auto-pinned to Priority #1.
            </div>
          </div>
        </div>
      </div>

      {/* 4-Pillar Quick Navigation Bar for Radiologist / Radiographer Workstation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Pillar 1: 🩻 Modality Scan Queue */}
        <div
          onClick={() => setActiveTab('tech-worklist')}
          style={{
            backgroundColor: activeTab === 'tech-worklist' ? 'rgba(245, 158, 11, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'tech-worklist' ? '#F59E0B' : 'var(--ds-color-border)'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: '#FCD34D', fontWeight: 700, textTransform: 'uppercase' }}>
              🩻 1. Modality Scan Queue
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ds-color-text-primary)' }}>
              {orders.filter((o) => o.status === 'SCHEDULED' || o.status === 'IN_PROGRESS').length} In Queue
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>🩻</span>
        </div>

        {/* Pillar 2: 🖥️ PACS DICOM Viewer */}
        <div
          onClick={() => setActiveTab('ai-chest-xray')}
          style={{
            backgroundColor: activeTab === 'ai-chest-xray' ? 'rgba(56, 189, 248, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'ai-chest-xray' ? '#38BDF8' : 'var(--ds-color-border)'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: '#7DD3FC', fontWeight: 700, textTransform: 'uppercase' }}>
              🖥️ 2. PACS DICOM Viewer
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8' }}>
              Web DICOM & AI
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>🖥️</span>
        </div>

        {/* Pillar 3: ✍️ Sign Radiology Report */}
        <div
          onClick={() => setActiveTab('radiologist-workbench')}
          style={{
            backgroundColor: activeTab === 'radiologist-workbench' ? 'rgba(168, 85, 247, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'radiologist-workbench' ? '#A855F7' : 'var(--ds-color-border)'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: '#D8B4FE', fontWeight: 700, textTransform: 'uppercase' }}>
              ✍️ 3. Sign Radiology Report
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#C084FC' }}>
              {studies.filter((s) => s.status === 'ACQUIRED').length} Awaiting Sign
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>✍️</span>
        </div>

        {/* Pillar 4: ⏱️ Modality Scheduling */}
        <div
          onClick={() => setActiveTab('scheduling')}
          style={{
            backgroundColor: activeTab === 'scheduling' ? 'rgba(16, 185, 129, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'scheduling' ? '#10B981' : 'var(--ds-color-border)'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: '#6EE7B7', fontWeight: 700, textTransform: 'uppercase' }}>
              ⏱️ 4. Modality Scheduling
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34D399' }}>
              {appointments.length} Booked Slots
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>⏱️</span>
        </div>
      </div>

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
        {primaryTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedOrder(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--ds-color-text-muted)',
                backgroundColor: isActive ? 'var(--ds-color-primary, #0284C7)' : 'transparent',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--ds-color-accent, #38BDF8)' : '1px solid transparent',
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
              {tab.count !== undefined && (
                <span
                  style={{
                    backgroundColor: isActive ? '#0369A1' : '#1E293B',
                    color: isActive ? '#E0F2FE' : '#94A3B8',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Secondary Modules Selector Dropdown */}
        <TabOverflowMenu
          label="More Radiology Modules"
          options={secondaryTabs}
          activeId={activeTab}
          onSelect={(id) => {
            setActiveTab(id as TabType);
            setSelectedOrder(null);
          }}
          onReset={() => {
            setActiveTab('overview');
            setSelectedOrder(null);
          }}
          accentColor="#0284C7"
          activeBorderColor="#38BDF8"
        />
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

        {activeTab === 'pacs' && <WebDicomAiHeatmapViewer />}
        {activeTab === 'ai-chest-xray' && <WebDicomAiHeatmapViewer />}

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
