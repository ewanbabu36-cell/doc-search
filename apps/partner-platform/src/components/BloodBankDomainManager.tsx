import React, { useState, useEffect, useCallback } from 'react';
import { Button, DocSearchSpatialCore3D, SkeletonPage } from '@docsearch/ui-kit';
import { bloodBankManagementService } from '../services/blood-bank-management-service.js';
import type {
  BloodBankOverviewMetricsDto,
  BloodBankAnalyticsDto,
  BloodBankFacilityDto,
  BloodDonorDto,
  BloodDonorScreeningDto,
  BloodDonationDto,
  BloodTestRecordDto,
  BloodComponentDto,
  BloodRequestDto,
  BloodCrossmatchDto,
  BloodIssueDto,
  TransfusionRecordDto,
  TransfusionReactionDto,
  BloodQualityCheckDto,
  BloodStorageTemperatureLogDto,
  BloodDiscardRecordDto,
  BloodBankAuditTraceDto,
  CreateDonorRequest,
  ScreenDonorRequest,
  CreateDonationRequest,
  RecordBloodTestRequest,
  ReleaseBloodUnitRequest,
  CreateComponentRequest,
  CreateBloodRequestRequest,
  CreateCrossmatchRequest,
  ReserveBloodUnitRequest,
  IssueBloodUnitRequest,
  RecordTransfusionRequest,
  RecordTransfusionObservationRequest,
  ReportTransfusionReactionRequest,
  ReturnBloodUnitRequest,
  DiscardBloodUnitRequest,
  CreateQualityCheckRequest,
  RecordTemperatureRequest,
  ResolveStorageExcursionRequest
} from '@docsearch/api-contracts';

// Views
import { BloodBankCommandCenterView } from './views/BloodBankCommandCenterView.js';
import { DonorDirectoryView } from './views/DonorDirectoryView.js';
import { DonorDetailView } from './views/DonorDetailView.js';
import { DonationCollectionView } from './views/DonationCollectionView.js';
import { BloodTestingView } from './views/BloodTestingView.js';
import { ComponentPreparationView } from './views/ComponentPreparationView.js';
import { BloodInventoryView } from './views/BloodInventoryView.js';
import { BloodRequestWorkbenchView } from './views/BloodRequestWorkbenchView.js';
import { CrossmatchWorkbenchView } from './views/CrossmatchWorkbenchView.js';
import { BloodReservationView } from './views/BloodReservationView.js';
import { BloodIssueView } from './views/BloodIssueView.js';
import { TransfusionWorkbenchView } from './views/TransfusionWorkbenchView.js';
import { TransfusionReactionView } from './views/TransfusionReactionView.js';
import { BloodReturnView } from './views/BloodReturnView.js';
import { BloodDiscardView } from './views/BloodDiscardView.js';
import { BloodQualityControlView } from './views/BloodQualityControlView.js';
import { TemperatureMonitoringView } from './views/TemperatureMonitoringView.js';
import { BloodBankAnalyticsView } from './views/BloodBankAnalyticsView.js';
import { BloodBankAuditVaultView } from './views/BloodBankAuditVaultView.js';
import { TabOverflowMenu } from './common/TabOverflowMenu.js';

// Dialogs
import { CreateDonorDialog } from './dialogs/CreateDonorDialog.js';
import { ScreenDonorDialog } from './dialogs/ScreenDonorDialog.js';
import { CreateDonationDialog } from './dialogs/CreateDonationDialog.js';
import { RecordBloodTestDialog } from './dialogs/RecordBloodTestDialog.js';
import { ReleaseBloodUnitDialog } from './dialogs/ReleaseBloodUnitDialog.js';
import { CreateBloodComponentDialog } from './dialogs/CreateBloodComponentDialog.js';
import { CreateBloodRequestDialog } from './dialogs/CreateBloodRequestDialog.js';
import { CreateCrossmatchDialog } from './dialogs/CreateCrossmatchDialog.js';
import { ReserveBloodUnitDialog } from './dialogs/ReserveBloodUnitDialog.js';
import { IssueBloodUnitDialog } from './dialogs/IssueBloodUnitDialog.js';
import { RecordTransfusionDialog } from './dialogs/RecordTransfusionDialog.js';
import { RecordTransfusionObservationDialog } from './dialogs/RecordTransfusionObservationDialog.js';
import { ReportTransfusionReactionDialog } from './dialogs/ReportTransfusionReactionDialog.js';
import { ReturnBloodUnitDialog } from './dialogs/ReturnBloodUnitDialog.js';
import { DiscardBloodUnitDialog } from './dialogs/DiscardBloodUnitDialog.js';
import { CreateQualityCheckDialog } from './dialogs/CreateQualityCheckDialog.js';
import { RecordTemperatureDialog } from './dialogs/RecordTemperatureDialog.js';
import { ResolveStorageExcursionDialog } from './dialogs/ResolveStorageExcursionDialog.js';

interface Props {
  tenantId: string;
}

type TabType =
  | 'command-center'
  | 'donors'
  | 'collections'
  | 'testing'
  | 'components'
  | 'inventory'
  | 'requests'
  | 'crossmatch'
  | 'reservations'
  | 'issues'
  | 'transfusion'
  | 'reactions'
  | 'returns'
  | 'discards'
  | 'quality-control'
  | 'temperature'
  | 'analytics'
  | 'audit-vault';

type TabBadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export const BloodBankDomainManager: React.FC<Props> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('command-center');
  const [loading, setLoading] = useState(true);

  // Domain State
  const [metrics, setMetrics] = useState<BloodBankOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<BloodBankAnalyticsDto | null>(null);
  const [facility, setFacility] = useState<BloodBankFacilityDto | null>(null);
  const [donors, setDonors] = useState<BloodDonorDto[]>([]);
  const [screenings, setScreenings] = useState<BloodDonorScreeningDto[]>([]);
  const [donations, setDonations] = useState<BloodDonationDto[]>([]);
  const [tests, setTests] = useState<BloodTestRecordDto[]>([]);
  const [components, setComponents] = useState<BloodComponentDto[]>([]);
  const [requests, setRequests] = useState<BloodRequestDto[]>([]);
  const [crossmatches, setCrossmatches] = useState<BloodCrossmatchDto[]>([]);
  const [issues, setIssues] = useState<BloodIssueDto[]>([]);
  const [transfusions, setTransfusions] = useState<TransfusionRecordDto[]>([]);
  const [reactions, setReactions] = useState<TransfusionReactionDto[]>([]);
  const [qualityChecks, setQualityChecks] = useState<BloodQualityCheckDto[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<BloodStorageTemperatureLogDto[]>([]);
  const [discards, setDiscards] = useState<BloodDiscardRecordDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<BloodBankAuditTraceDto[]>([]);

  // Dialog & Selection State
  const [selectedDonor, setSelectedDonor] = useState<BloodDonorDto | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<BloodDonationDto | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<BloodComponentDto | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequestDto | null>(null);
  const [selectedTransfusion, setSelectedTransfusion] = useState<TransfusionRecordDto | null>(null);
  const [selectedTempLog, setSelectedTempLog] = useState<BloodStorageTemperatureLogDto | null>(null);

  const [isCreateDonorOpen, setIsCreateDonorOpen] = useState(false);
  const [isScreenDonorOpen, setIsScreenDonorOpen] = useState(false);
  const [isCreateDonationOpen, setIsCreateDonationOpen] = useState(false);
  const [isRecordTestOpen, setIsRecordTestOpen] = useState(false);
  const [isReleaseUnitOpen, setIsReleaseUnitOpen] = useState(false);
  const [isCreateComponentOpen, setIsCreateComponentOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [isCreateCrossmatchOpen, setIsCreateCrossmatchOpen] = useState(false);
  const [isReserveUnitOpen, setIsReserveUnitOpen] = useState(false);
  const [isIssueUnitOpen, setIsIssueUnitOpen] = useState(false);
  const [isRecordTransfusionOpen, setIsRecordTransfusionOpen] = useState(false);
  const [isRecordObservationOpen, setIsRecordObservationOpen] = useState(false);
  const [isReportReactionOpen, setIsReportReactionOpen] = useState(false);
  const [isReturnUnitOpen, setIsReturnUnitOpen] = useState(false);
  const [isDiscardUnitOpen, setIsDiscardUnitOpen] = useState(false);
  const [isCreateQCOpen, setIsCreateQCOpen] = useState(false);
  const [isRecordTempOpen, setIsRecordTempOpen] = useState(false);
  const [isResolveExcursionOpen, setIsResolveExcursionOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, a, f, dn, sc, dt, tt, cp, rq, xm, is, tr, rx, qc, tl, ds, at] = await Promise.all([
        bloodBankManagementService.getOverviewMetrics(tenantId),
        bloodBankManagementService.getAnalytics(tenantId),
        bloodBankManagementService.getFacility(tenantId),
        bloodBankManagementService.getDonors(tenantId),
        bloodBankManagementService.getScreenings(tenantId),
        bloodBankManagementService.getDonations(tenantId),
        bloodBankManagementService.getTests(tenantId),
        bloodBankManagementService.getComponents(tenantId),
        bloodBankManagementService.getRequests(tenantId),
        bloodBankManagementService.getCrossmatches(tenantId),
        bloodBankManagementService.getIssues(tenantId),
        bloodBankManagementService.getTransfusions(tenantId),
        bloodBankManagementService.getReactions(tenantId),
        bloodBankManagementService.getQualityChecks(tenantId),
        bloodBankManagementService.getTemperatureLogs(tenantId),
        bloodBankManagementService.getDiscards(tenantId),
        bloodBankManagementService.getAuditTraces(tenantId)
      ]);
      setMetrics(m);
      setAnalytics(a);
      setFacility(f);
      setDonors(dn);
      setScreenings(sc);
      setDonations(dt);
      setTests(tt);
      setComponents(cp);
      setRequests(rq);
      setCrossmatches(xm);
      setIssues(is);
      setTransfusions(tr);
      setReactions(rx);
      setQualityChecks(qc);
      setTemperatureLogs(tl);
      setDiscards(ds);
      setAuditTraces(at);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs: { id: TabType; label: string; count?: number; badgeVariant?: TabBadgeVariant }[] = [
    { id: 'command-center', label: 'Command Center' },
    { id: 'donors', label: 'Donor Registry', count: donors.length },
    { id: 'collections', label: 'Blood Collections', count: donations.length },
    { id: 'testing', label: 'Serology Testing', count: tests.length },
    { id: 'components', label: 'Component Yield', count: components.length },
    { id: 'inventory', label: 'Blood Inventory', count: components.filter((c) => c.status === 'RELEASED_USABLE').length },
    { id: 'requests', label: 'Clinical Requisitions', count: requests.filter((r) => r.status === 'PENDING_CROSSMATCH').length, badgeVariant: 'danger' },
    { id: 'crossmatch', label: 'Crossmatch Workbench', count: crossmatches.length },
    { id: 'reservations', label: 'Reservations', count: requests.filter((r) => r.status === 'RESERVED').length },
    { id: 'issues', label: 'Issue Manifest', count: issues.length },
    { id: 'transfusion', label: 'Transfusions', count: transfusions.length },
    { id: 'reactions', label: 'Adverse Reactions', count: reactions.length, badgeVariant: reactions.length > 0 ? 'danger' : 'neutral' },
    { id: 'returns', label: 'Unit Returns', count: components.filter((c) => c.status === 'ISSUED_TO_DEPARTMENT').length },
    { id: 'discards', label: 'Biohazard Discards', count: discards.length },
    { id: 'quality-control', label: 'QC & Calibrations', count: qualityChecks.length },
    { id: 'temperature', label: 'Cold-Chain Monitoring', count: temperatureLogs.filter((t) => t.isExcursion).length, badgeVariant: 'danger' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'audit-vault', label: 'Audit Vault', count: auditTraces.length }
  ];

  const primaryTabIds: TabType[] = ['command-center', 'donors', 'inventory', 'requests', 'crossmatch'];
  const primaryTabs = tabs.filter((t) => primaryTabIds.includes(t.id));
  const secondaryTabs = tabs.filter((t) => !primaryTabIds.includes(t.id));

  if (loading || !metrics || !analytics || !facility) {
    return <SkeletonPage layout="cards" metricCount={4} />;
  }

  return (
    <div className="space-y-6">
      {/* 3D Spatial Feature Core: Blood Bank & Transfusion Medicine */}
      <DocSearchSpatialCore3D
        preset="blood-bank"
        height={360}
        interactive={true}
        onNodeClick={(id) => {
          if (id === 'donor-registry') {
            setActiveTab('donors');
          } else if (id === 'separation') {
            setActiveTab('components');
          } else if (id === 'crossmatch') {
            setActiveTab('crossmatch');
          } else if (id === 'cold-chain') {
            setActiveTab('temperature');
          } else if (id === 'stat-transfuse') {
            setActiveTab('transfusion');
          } else if (id === 'plasma-cryo') {
            setActiveTab('inventory');
          } else if (id === 'regulatory-trace') {
            setActiveTab('audit-vault');
          }
        }}
      />

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
                setSelectedDonor(null);
              }}
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
              {tab.count !== undefined && (
                <span
                  style={{
                    backgroundColor: isActive ? '#991B1B' : '#1E293B',
                    color: isActive ? '#FEE2E2' : '#94A3B8',
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
          label="More Blood Bank Modules"
          options={secondaryTabs}
          activeId={activeTab}
          onSelect={(id) => {
            setActiveTab(id as TabType);
            setSelectedDonor(null);
          }}
          onReset={() => {
            setActiveTab('command-center');
            setSelectedDonor(null);
          }}
          accentColor="#DC2626"
          activeBorderColor="#EF4444"
        />
      </div>

      <div className="p-1">
        {activeTab === 'command-center' && (
          <BloodBankCommandCenterView
            metrics={metrics}
            requests={requests}
            crossmatches={crossmatches}
            temperatureLogs={temperatureLogs}
            facility={facility}
            onOpenNewRequest={() => setIsCreateRequestOpen(true)}
            onOpenNewDonor={() => setIsCreateDonorOpen(true)}
          />
        )}

        {activeTab === 'donors' && (
          selectedDonor ? (
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedDonor(null)}>← Back to Donor Directory</Button>
              <DonorDetailView
                donor={selectedDonor}
                screenings={screenings.filter((s) => s.donorId === selectedDonor.id)}
                donations={donations.filter((d) => d.donorId === selectedDonor.id)}
              />
            </div>
          ) : (
            <DonorDirectoryView
              donors={donors}
              onOpenScreening={(d) => {
                setSelectedDonor(d);
                setIsScreenDonorOpen(true);
              }}
              onOpenDonation={(d) => {
                setSelectedDonor(d);
                setIsCreateDonationOpen(true);
              }}
              onOpenRegister={() => setIsCreateDonorOpen(true)}
            />
          )
        )}

        {activeTab === 'collections' && (
          <DonationCollectionView
            donations={donations}
            onOpenTest={(d) => {
              setSelectedDonation(d);
              setIsRecordTestOpen(true);
            }}
            onOpenSeparate={(d) => {
              setSelectedDonation(d);
              setIsCreateComponentOpen(true);
            }}
          />
        )}

        {activeTab === 'testing' && <BloodTestingView tests={tests} />}

        {activeTab === 'components' && (
          <ComponentPreparationView
            components={components}
            onRelease={(c) => {
              setSelectedComponent(c);
              setIsReleaseUnitOpen(true);
            }}
            onDiscard={(c) => {
              setSelectedComponent(c);
              setIsDiscardUnitOpen(true);
            }}
          />
        )}

        {activeTab === 'inventory' && <BloodInventoryView components={components} />}

        {activeTab === 'requests' && (
          <BloodRequestWorkbenchView
            requests={requests}
            onOpenCrossmatch={(r) => {
              setSelectedRequest(r);
              setIsCreateCrossmatchOpen(true);
            }}
            onOpenNewRequest={() => setIsCreateRequestOpen(true)}
          />
        )}

        {activeTab === 'crossmatch' && <CrossmatchWorkbenchView crossmatches={crossmatches} />}

        {activeTab === 'reservations' && (
          <BloodReservationView
            requests={requests}
            components={components}
            onIssue={(req, comp) => {
              setSelectedRequest(req);
              setSelectedComponent(comp);
              setIsIssueUnitOpen(true);
            }}
          />
        )}

        {activeTab === 'issues' && <BloodIssueView issues={issues} />}

        {activeTab === 'transfusion' && (
          <TransfusionWorkbenchView
            transfusions={transfusions}
            onOpenObservation={(t) => {
              setSelectedTransfusion(t);
              setIsRecordObservationOpen(true);
            }}
            onOpenReaction={(t) => {
              setSelectedTransfusion(t);
              setIsReportReactionOpen(true);
            }}
            onOpenNewTransfusion={() => setIsRecordTransfusionOpen(true)}
          />
        )}

        {activeTab === 'reactions' && <TransfusionReactionView reactions={reactions} />}

        {activeTab === 'returns' && (
          <BloodReturnView
            components={components}
            onOpenReturn={(c) => {
              setSelectedComponent(c);
              setIsReturnUnitOpen(true);
            }}
          />
        )}

        {activeTab === 'discards' && <BloodDiscardView discards={discards} />}

        {activeTab === 'quality-control' && (
          <BloodQualityControlView
            checks={qualityChecks}
            onOpenNewQC={() => setIsCreateQCOpen(true)}
          />
        )}

        {activeTab === 'temperature' && (
          <TemperatureMonitoringView
            logs={temperatureLogs}
            onOpenRecordTemp={() => setIsRecordTempOpen(true)}
            onOpenResolveExcursion={(log) => {
              setSelectedTempLog(log);
              setIsResolveExcursionOpen(true);
            }}
          />
        )}

        {activeTab === 'analytics' && <BloodBankAnalyticsView analytics={analytics} />}

        {activeTab === 'audit-vault' && <BloodBankAuditVaultView auditTraces={auditTraces} />}
      </div>

      {/* Dialog Modals */}
      <CreateDonorDialog
        isOpen={isCreateDonorOpen}
        onClose={() => setIsCreateDonorOpen(false)}
        onSubmit={async (req: CreateDonorRequest) => {
          await bloodBankManagementService.createDonor(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <ScreenDonorDialog
        isOpen={isScreenDonorOpen}
        onClose={() => setIsScreenDonorOpen(false)}
        donor={selectedDonor}
        onSubmit={async (req: ScreenDonorRequest) => {
          await bloodBankManagementService.screenDonor(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <CreateDonationDialog
        isOpen={isCreateDonationOpen}
        onClose={() => setIsCreateDonationOpen(false)}
        donor={selectedDonor}
        onSubmit={async (req: CreateDonationRequest) => {
          await bloodBankManagementService.createDonation(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <RecordBloodTestDialog
        isOpen={isRecordTestOpen}
        onClose={() => setIsRecordTestOpen(false)}
        donation={selectedDonation}
        onSubmit={async (req: RecordBloodTestRequest) => {
          await bloodBankManagementService.recordBloodTest(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <ReleaseBloodUnitDialog
        isOpen={isReleaseUnitOpen}
        onClose={() => setIsReleaseUnitOpen(false)}
        unit={selectedComponent}
        onSubmit={async (req: ReleaseBloodUnitRequest) => {
          await bloodBankManagementService.releaseBloodUnit(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <CreateBloodComponentDialog
        isOpen={isCreateComponentOpen}
        onClose={() => setIsCreateComponentOpen(false)}
        donation={selectedDonation}
        onSubmit={async (req: CreateComponentRequest) => {
          await bloodBankManagementService.createComponent(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <CreateBloodRequestDialog
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onSubmit={async (req: CreateBloodRequestRequest) => {
          await bloodBankManagementService.createBloodRequest(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <CreateCrossmatchDialog
        isOpen={isCreateCrossmatchOpen}
        onClose={() => setIsCreateCrossmatchOpen(false)}
        request={selectedRequest}
        components={components.filter((c) => c.status === 'RELEASED_USABLE')}
        onSubmit={async (req: CreateCrossmatchRequest) => {
          await bloodBankManagementService.createCrossmatch(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <ReserveBloodUnitDialog
        isOpen={isReserveUnitOpen}
        onClose={() => setIsReserveUnitOpen(false)}
        request={selectedRequest}
        component={selectedComponent}
        onSubmit={async (req: ReserveBloodUnitRequest) => {
          await bloodBankManagementService.reserveBloodUnit(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <IssueBloodUnitDialog
        isOpen={isIssueUnitOpen}
        onClose={() => setIsIssueUnitOpen(false)}
        request={selectedRequest}
        component={selectedComponent}
        onSubmit={async (req: IssueBloodUnitRequest) => {
          await bloodBankManagementService.issueBloodUnit(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <RecordTransfusionDialog
        isOpen={isRecordTransfusionOpen}
        onClose={() => setIsRecordTransfusionOpen(false)}
        onSubmit={async (req: RecordTransfusionRequest) => {
          await bloodBankManagementService.recordTransfusion(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <RecordTransfusionObservationDialog
        isOpen={isRecordObservationOpen}
        onClose={() => setIsRecordObservationOpen(false)}
        transfusion={selectedTransfusion}
        onSubmit={async (req: RecordTransfusionObservationRequest) => {
          await bloodBankManagementService.recordTransfusionObservation(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <ReportTransfusionReactionDialog
        isOpen={isReportReactionOpen}
        onClose={() => setIsReportReactionOpen(false)}
        transfusion={selectedTransfusion}
        onSubmit={async (req: ReportTransfusionReactionRequest) => {
          await bloodBankManagementService.reportTransfusionReaction(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <ReturnBloodUnitDialog
        isOpen={isReturnUnitOpen}
        onClose={() => setIsReturnUnitOpen(false)}
        unit={selectedComponent}
        onSubmit={async (req: ReturnBloodUnitRequest) => {
          await bloodBankManagementService.returnBloodUnit(req);
          loadData();
        }}
        tenantId={tenantId}
      />

      <DiscardBloodUnitDialog
        isOpen={isDiscardUnitOpen}
        onClose={() => setIsDiscardUnitOpen(false)}
        unit={selectedComponent}
        onSubmit={async (req: DiscardBloodUnitRequest) => {
          await bloodBankManagementService.discardBloodUnit(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <CreateQualityCheckDialog
        isOpen={isCreateQCOpen}
        onClose={() => setIsCreateQCOpen(false)}
        onSubmit={async (req: CreateQualityCheckRequest) => {
          await bloodBankManagementService.createQualityCheck(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <RecordTemperatureDialog
        isOpen={isRecordTempOpen}
        onClose={() => setIsRecordTempOpen(false)}
        onSubmit={async (req: RecordTemperatureRequest) => {
          await bloodBankManagementService.recordTemperature(req);
          loadData();
        }}
        tenantId={tenantId}
        partnerId="22222222-2222-4222-8222-222222222222"
        organizationId="33333333-3333-4333-8333-333333333333"
        branchId="44444444-4444-4444-8444-444444444444"
      />

      <ResolveStorageExcursionDialog
        isOpen={isResolveExcursionOpen}
        onClose={() => setIsResolveExcursionOpen(false)}
        log={selectedTempLog}
        onSubmit={async (req: ResolveStorageExcursionRequest) => {
          await bloodBankManagementService.resolveStorageExcursion(req);
          loadData();
        }}
        tenantId={tenantId}
      />
    </div>
  );
};
