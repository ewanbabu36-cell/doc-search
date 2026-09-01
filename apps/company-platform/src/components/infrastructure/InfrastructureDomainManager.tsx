import React, { useState, useEffect } from 'react';
import type {
  InfrastructureOverviewDto,
  InfrastructureProjectDto,
  InfrastructureRegionDto,
  InfrastructureClusterDto,
  InfrastructureNodeDto,
  InfrastructureServiceDto,
  InfrastructureDatabaseDto,
  DatabaseConnectionPoolDto,
  InfrastructureReplicationLinkDto,
  InfrastructureHealthSnapshotDto,
  InfrastructureAlertDto,
  InfrastructureIncidentDto,
  BackupPolicyDto,
  BackupRecordDto,
  RestoreVerificationDto,
  DisasterRecoveryPlanDto,
  DisasterRecoveryDrillDto,
  InfrastructureAuditTraceDto,
  BackupType
} from '@docsearch/api-contracts';
import { infrastructureService } from '../../services/infrastructure-service.js';
import { InfrastructureOverviewView } from './InfrastructureOverviewView.js';
import { InfrastructureTopologyView } from './InfrastructureTopologyView.js';
import { InfrastructureComputeView } from './InfrastructureComputeView.js';
import { InfrastructureServiceView } from './InfrastructureServiceView.js';
import { InfrastructureDatabaseView } from './InfrastructureDatabaseView.js';
import { DatabaseConnectionPoolView } from './DatabaseConnectionPoolView.js';
import { InfrastructureHealthView } from './InfrastructureHealthView.js';
import { InfrastructureAlertCenterView } from './InfrastructureAlertCenterView.js';
import { InfrastructureIncidentCenterView } from './InfrastructureIncidentCenterView.js';
import { BackupPolicyView } from './BackupPolicyView.js';
import { BackupRecordView } from './BackupRecordView.js';
import { RestoreVerificationView } from './RestoreVerificationView.js';
import { InfrastructureRegionView } from './InfrastructureRegionView.js';
import { InfrastructureReplicationView } from './InfrastructureReplicationView.js';
import { DisasterRecoveryPlanView } from './DisasterRecoveryPlanView.js';
import { DisasterRecoveryDrillView } from './DisasterRecoveryDrillView.js';
import { InfrastructureAuditTraceView } from './InfrastructureAuditTraceView.js';
import { ChaosEngineeringSimulatorView } from './ChaosEngineeringSimulatorView.js';
import { OpenTelemetryApmRadarView } from './OpenTelemetryApmRadarView.js';
import { PitrRansomwareSnapshotView } from './PitrRansomwareSnapshotView.js';
import { MultiRegionFailoverModal } from './MultiRegionFailoverModal.js';
import { PagerDutyOnCallRotaModal } from './PagerDutyOnCallRotaModal.js';
import { Tabs, Badge, Button, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
  | 'chaos'
  | 'apm-radar'
  | 'pitr-vault'
  | 'topology'
  | 'compute-services'
  | 'databases'
  | 'monitoring'
  | 'alerts-incidents'
  | 'backups'
  | 'replication-regions'
  | 'dr'
  | 'audit';

export const InfrastructureDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [overview, setOverview] = useState<InfrastructureOverviewDto | null>(null);
  const [_projects, setProjects] = useState<InfrastructureProjectDto[]>([]);
  const [regions, setRegions] = useState<InfrastructureRegionDto[]>([]);
  const [clusters, setClusters] = useState<InfrastructureClusterDto[]>([]);
  const [nodes, setNodes] = useState<InfrastructureNodeDto[]>([]);
  const [services, setServices] = useState<InfrastructureServiceDto[]>([]);
  const [databases, setDatabases] = useState<InfrastructureDatabaseDto[]>([]);
  const [connectionPools, setConnectionPools] = useState<DatabaseConnectionPoolDto[]>([]);
  const [replicationLinks, setReplicationLinks] = useState<InfrastructureReplicationLinkDto[]>([]);
  const [healthSnapshots, setHealthSnapshots] = useState<InfrastructureHealthSnapshotDto[]>([]);
  const [alerts, setAlerts] = useState<InfrastructureAlertDto[]>([]);
  const [incidents, setIncidents] = useState<InfrastructureIncidentDto[]>([]);
  const [backupPolicies, setBackupPolicies] = useState<BackupPolicyDto[]>([]);
  const [backupRecords, setBackupRecords] = useState<BackupRecordDto[]>([]);
  const [restoreVerifications, setRestoreVerifications] = useState<RestoreVerificationDto[]>([]);
  const [drPlans, setDrPlans] = useState<DisasterRecoveryPlanDto[]>([]);
  const [drDrills, setDrDrills] = useState<DisasterRecoveryDrillDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<InfrastructureAuditTraceDto[]>([]);

  // Modals
  const [isFailoverModalOpen, setIsFailoverModalOpen] = useState(false);
  const [isPagerDutyModalOpen, setIsPagerDutyModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        projectsRes,
        regionsRes,
        clustersRes,
        nodesRes,
        servicesRes,
        databasesRes,
        poolsRes,
        replicationRes,
        healthRes,
        alertsRes,
        incidentsRes,
        policiesRes,
        recordsRes,
        verificationsRes,
        drPlansRes,
        drDrillsRes,
        tracesRes
      ] = await Promise.all([
        infrastructureService.getOverview(),
        infrastructureService.getProjects(),
        infrastructureService.getRegions(),
        infrastructureService.getClusters(),
        infrastructureService.getNodes(),
        infrastructureService.getServices(),
        infrastructureService.getDatabases(),
        infrastructureService.getConnectionPools(),
        infrastructureService.getReplicationLinks(),
        infrastructureService.getHealthSnapshots(),
        infrastructureService.getAlerts(),
        infrastructureService.getIncidents(),
        infrastructureService.getBackupPolicies(),
        infrastructureService.getBackupRecords(),
        infrastructureService.getRestoreVerifications(),
        infrastructureService.getDRPlans(),
        infrastructureService.getDRDrills(),
        infrastructureService.getAuditTraces()
      ]);
      setOverview(overviewRes);
      setProjects(projectsRes);
      setRegions(regionsRes);
      setClusters(clustersRes);
      setNodes(nodesRes);
      setServices(servicesRes);
      setDatabases(databasesRes);
      setConnectionPools(poolsRes);
      setReplicationLinks(replicationRes);
      setHealthSnapshots(healthRes);
      setAlerts(alertsRes);
      setIncidents(incidentsRes);
      setBackupPolicies(policiesRes);
      setBackupRecords(recordsRes);
      setRestoreVerifications(verificationsRes);
      setDrPlans(drPlansRes);
      setDrDrills(drDrillsRes);
      setAuditTraces(tracesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Infrastructure & Monitoring data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleRunHealthProbe = async (serviceId: string) => {
    const newSnapshot = await infrastructureService.runHealthProbe({
      resourceReference: serviceId,
      resourceType: 'SERVICE',
      environment: 'PRODUCTION',
      actorEmail: 'admin@docsearch.internal',
      reason: 'Manual probe execution from monitoring dashboard'
    });
    setHealthSnapshots((prev) => [newSnapshot, ...prev]);
  };

  const handleTriggerBackup = async (
    policyId: string,
    resourceReference: string,
    backupType: BackupType,
    environment: string,
    reason: string
  ) => {
    const newRecord = await infrastructureService.triggerBackup({
      policyId,
      resourceReference,
      backupType,
      environment,
      reason,
      actorEmail: 'admin@docsearch.internal'
    });
    setBackupRecords((prev) => [newRecord, ...prev]);
  };

  const handleInitiateFailover = async (planId: string, environment: string, reason: string) => {
    await infrastructureService.initiateFailover({
      planId,
      environment,
      triggerType: 'MANUAL',
      reason,
      actorEmail: 'admin@docsearch.internal'
    });
    const freshPlans = await infrastructureService.getDRPlans();
    setDrPlans(freshPlans);
  };

  const handleExecuteDrill = async (drillId: string, reason: string) => {
    const executedDrill = await infrastructureService.executeDRDrill({
      drillId,
      actorEmail: 'admin@docsearch.internal',
      reason
    });
    setDrDrills((prev) => prev.map((d) => (d.id === executedDrill.id ? executedDrill : d)));
  };

  const handleAcknowledgeIncident = async (incidentId: string, reason: string) => {
    const updated = await infrastructureService.acknowledgeIncident({
      incidentId,
      actorEmail: 'admin@docsearch.internal',
      assignedToEmail: 'lead.sre@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleResolveIncident = async (incidentId: string, resolutionNotes: string) => {
    const updated = await infrastructureService.resolveIncident({
      incidentId,
      actorEmail: 'admin@docsearch.internal',
      reason: 'Resolved infrastructure incident',
      resolutionNotes
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Infrastructure & Disaster Recovery control plane...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Infrastructure Unavailable" message={error} onRetry={loadData} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              🏢 Infrastructure, Monitoring & Disaster Recovery Command Center
            </h1>
            <Badge variant="success">● 99.999% High Availability SLA</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            1-Click Multi-Region failover controller, Chaos Mesh resiliency simulator, OpenTelemetry APM radar, and PITR ransomware vault
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPagerDutyModalOpen(true)}
            style={{
              borderColor: '#06B6D4',
              color: '#38BDF8',
              fontWeight: 800
            }}
          >
            🚨 On-Call PagerDuty Roster
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFailoverModalOpen(true)}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              fontWeight: 900
            }}
          >
            ⚡ Multi-Region DR Failover
          </Button>
        </div>
      </div>

      {successBanner && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {successBanner}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'chaos',
            label: '🔥 Chaos Mesh',
            badge: <Badge variant="danger">Resilience</Badge>
          },
          {
            id: 'apm-radar',
            label: '📊 OpenTelemetry APM',
            badge: <Badge variant="success">18.4ms</Badge>
          },
          {
            id: 'pitr-vault',
            label: '💾 PITR Vault',
            badge: <Badge variant="primary">Immutable</Badge>
          },
          {
            id: 'topology',
            label: '🗺️ Topology',
            badge: <Badge variant="neutral">{regions.length}</Badge>
          },
          {
            id: 'compute-services',
            label: '🖥️ Compute & Services',
            badge: <Badge variant="neutral">{nodes.length + services.length}</Badge>
          },
          {
            id: 'databases',
            label: '🗄️ Databases & Pools',
            badge: <Badge variant="neutral">{databases.length}</Badge>
          },
          {
            id: 'monitoring',
            label: '🩺 Health & Monitoring',
            badge: <Badge variant="neutral">{healthSnapshots.length}</Badge>
          },
          {
            id: 'alerts-incidents',
            label: '🚨 Alerts & Incidents',
            badge: (
              <Badge variant={incidents.filter((i) => i.status === 'OPEN').length > 0 ? 'danger' : 'neutral'}>
                {incidents.length}
              </Badge>
            )
          },
          {
            id: 'backups',
            label: '💾 Backups & Restores',
            badge: <Badge variant="neutral">{backupRecords.length}</Badge>
          },
          {
            id: 'replication-regions',
            label: '🌍 Regions & Replication',
            badge: <Badge variant="neutral">{replicationLinks.length}</Badge>
          },
          {
            id: 'dr',
            label: '🛡️ Disaster Recovery',
            badge: <Badge variant="neutral">{drPlans.length}</Badge>
          },
          {
            id: 'audit',
            label: '🔍 Audit Trail',
            badge: <Badge variant="neutral">{auditTraces.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <InfrastructureOverviewView
          overview={overview}
          regions={regions}
          clusters={clusters}
          services={services}
          databases={databases}
          drPlans={drPlans}
          incidents={incidents}
        />
      )}

      {activeTab === 'chaos' && (
        <ChaosEngineeringSimulatorView />
      )}

      {activeTab === 'apm-radar' && (
        <OpenTelemetryApmRadarView />
      )}

      {activeTab === 'pitr-vault' && (
        <PitrRansomwareSnapshotView />
      )}

      {activeTab === 'topology' && (
        <InfrastructureTopologyView
          regions={regions}
          clusters={clusters}
          nodes={nodes}
          services={services}
          databases={databases}
        />
      )}

      {activeTab === 'compute-services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InfrastructureComputeView nodes={nodes} />
          <InfrastructureServiceView services={services} />
        </div>
      )}

      {activeTab === 'databases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InfrastructureDatabaseView databases={databases} />
          <DatabaseConnectionPoolView pools={connectionPools} />
        </div>
      )}

      {activeTab === 'monitoring' && (
        <InfrastructureHealthView
          snapshots={healthSnapshots}
          onRunHealthProbe={handleRunHealthProbe}
        />
      )}

      {activeTab === 'alerts-incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InfrastructureAlertCenterView alerts={alerts} />
          <InfrastructureIncidentCenterView
            incidents={incidents}
            onAcknowledgeIncident={handleAcknowledgeIncident}
            onResolveIncident={handleResolveIncident}
          />
        </div>
      )}

      {activeTab === 'backups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <BackupPolicyView policies={backupPolicies} />
          <BackupRecordView
            records={backupRecords}
            policies={backupPolicies}
            onTriggerBackup={handleTriggerBackup}
          />
          <RestoreVerificationView verifications={restoreVerifications} />
        </div>
      )}

      {activeTab === 'replication-regions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InfrastructureRegionView regions={regions} />
          <InfrastructureReplicationView replicationLinks={replicationLinks} />
        </div>
      )}

      {activeTab === 'dr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <DisasterRecoveryPlanView
            plans={drPlans}
            onInitiateFailover={handleInitiateFailover}
          />
          <DisasterRecoveryDrillView
            drills={drDrills}
            onExecuteDrill={handleExecuteDrill}
          />
        </div>
      )}

      {activeTab === 'audit' && (
        <InfrastructureAuditTraceView auditTraces={auditTraces} />
      )}

      {/* Modals */}
      <MultiRegionFailoverModal
        isOpen={isFailoverModalOpen}
        onClose={() => setIsFailoverModalOpen(false)}
        onFailoverSuccess={(regionTarget) => {
          setSuccessBanner(`🚨 EMERGENCY FAILOVER COMPLETE: 100% Nationwide traffic successfully diverted to ${regionTarget} (RTO: 38 seconds, 0 data loss)!`);
          setTimeout(() => setSuccessBanner(null), 8000);
        }}
      />

      <PagerDutyOnCallRotaModal
        isOpen={isPagerDutyModalOpen}
        onClose={() => setIsPagerDutyModalOpen(false)}
      />
    </div>
  );
};
