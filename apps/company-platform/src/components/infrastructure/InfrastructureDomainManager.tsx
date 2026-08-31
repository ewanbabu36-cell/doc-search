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
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'overview'
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
        replRes,
        healthRes,
        alertsRes,
        incidentsRes,
        policiesRes,
        recordsRes,
        verifRes,
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
      setReplicationLinks(replRes);
      setHealthSnapshots(healthRes);
      setAlerts(alertsRes);
      setIncidents(incidentsRes);
      setBackupPolicies(policiesRes);
      setBackupRecords(recordsRes);
      setRestoreVerifications(verifRes);
      setDrPlans(drPlansRes);
      setDrDrills(drDrillsRes);
      setAuditTraces(tracesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load infrastructure control plane');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleRunHealthProbe = async (
    resourceType: string,
    resourceReference: string,
    environment: string,
    reason: string
  ) => {
    const probe = await infrastructureService.runHealthProbe({
      resourceType,
      resourceReference,
      environment,
      actorEmail: 'sre.lead@docsearch.internal',
      reason
    });
    setHealthSnapshots((prev) => [probe, ...prev]);
  };

  const handleAcknowledgeIncident = async (incidentId: string, assignedToEmail: string, reason: string) => {
    const updated = await infrastructureService.acknowledgeIncident({
      incidentId,
      assignedToEmail,
      actorEmail: 'sre.lead@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleResolveIncident = async (incidentId: string, resolutionNotes: string, reason: string) => {
    const updated = await infrastructureService.resolveIncident({
      incidentId,
      resolutionNotes,
      actorEmail: 'sre.lead@docsearch.internal',
      reason
    });
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleTriggerBackup = async (
    policyId: string,
    resourceReference: string,
    backupType: BackupType,
    environment: string,
    reason: string
  ) => {
    const rec = await infrastructureService.triggerBackup({
      policyId,
      resourceReference,
      backupType,
      environment,
      actorEmail: 'database.admin@docsearch.internal',
      reason
    });
    setBackupRecords((prev) => [rec, ...prev]);
  };

  const handleExecuteDrill = async (drillId: string, reason: string) => {
    const updated = await infrastructureService.executeDRDrill({
      drillId,
      actorEmail: 'sre.lead@docsearch.internal',
      reason
    });
    setDrDrills((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleInitiateFailover = async (planId: string, environment: string, reason: string) => {
    await infrastructureService.initiateFailover({
      planId,
      environment,
      triggerType: 'DRILL',
      actorEmail: 'sre.lead@docsearch.internal',
      reason
    });
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Infrastructure / Monitoring / DR control plane...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Infrastructure Control Plane Unavailable" message={error} onRetry={loadData} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Infrastructure / Monitoring / Disaster Recovery
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Multi-region cluster topology, compute nodes, database connection pools, health probes, automated backups, and DR failover drills
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'topology',
            label: '🌐 Topology',
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
    </div>
  );
};
