import type {
  InfrastructureProjectDto,
  InfrastructureClusterDto,
  InfrastructureNodeDto,
  InfrastructureServiceDto,
  InfrastructureDatabaseDto,
  DatabaseConnectionPoolDto,
  InfrastructureRegionDto,
  InfrastructureReplicationLinkDto,
  InfrastructureHealthSnapshotDto,
  InfrastructureAlertDto,
  InfrastructureIncidentDto,
  BackupPolicyDto,
  BackupRecordDto,
  RestoreVerificationDto,
  DisasterRecoveryPlanDto,
  DisasterRecoveryDrillDto,
  FailoverEventDto,
  InfrastructureAuditTraceDto,
  InfrastructureOverviewDto,
  CreateInfrastructureProjectRequest,
  CreateClusterRequest,
  CreateNodeRequest,
  CreateInfrastructureServiceRequest,
  CreateInfrastructureDatabaseRequest,
  UpdateConnectionPoolRequest,
  CreateRegionRequest,
  CreateReplicationLinkRequest,
  RunHealthProbeRequest,
  CreateInfrastructureAlertRequest,
  CreateInfrastructureIncidentRequest,
  AcknowledgeInfrastructureIncidentRequest,
  ResolveInfrastructureIncidentRequest,
  CreateBackupPolicyRequest,
  TriggerBackupRequest,
  VerifyBackupRequest,
  CreateDRPlanRequest,
  ScheduleDRDrillRequest,
  ExecuteDRDrillRequest,
  InitiateFailoverRequest,
  RollbackFailoverRequest,
  GenerateInfrastructureAuditReportRequest
} from '@docsearch/api-contracts';
import {
  MOCK_INFRA_PROJECTS,
  MOCK_INFRA_REGIONS,
  MOCK_INFRA_CLUSTERS,
  MOCK_INFRA_NODES,
  MOCK_INFRA_SERVICES,
  MOCK_INFRA_DATABASES,
  MOCK_CONNECTION_POOLS,
  MOCK_REPLICATION_LINKS,
  MOCK_HEALTH_SNAPSHOTS,
  MOCK_INFRA_ALERTS,
  MOCK_INFRA_INCIDENTS,
  MOCK_BACKUP_POLICIES,
  MOCK_BACKUP_RECORDS,
  MOCK_RESTORE_VERIFICATIONS,
  MOCK_DR_PLANS,
  MOCK_DR_DRILLS,
  MOCK_FAILOVER_EVENTS,
  MOCK_INFRA_AUDIT_TRACES,
  MOCK_INFRA_OVERVIEW
} from './mock-infrastructure-data.js';

export interface IInfrastructureService {
  getOverview(): Promise<InfrastructureOverviewDto>;
  getProjects(): Promise<InfrastructureProjectDto[]>;
  createProject(req: CreateInfrastructureProjectRequest): Promise<InfrastructureProjectDto>;
  getRegions(): Promise<InfrastructureRegionDto[]>;
  createRegion(req: CreateRegionRequest): Promise<InfrastructureRegionDto>;
  getClusters(): Promise<InfrastructureClusterDto[]>;
  createCluster(req: CreateClusterRequest): Promise<InfrastructureClusterDto>;
  getNodes(): Promise<InfrastructureNodeDto[]>;
  createNode(req: CreateNodeRequest): Promise<InfrastructureNodeDto>;
  getServices(): Promise<InfrastructureServiceDto[]>;
  createService(req: CreateInfrastructureServiceRequest): Promise<InfrastructureServiceDto>;
  getDatabases(): Promise<InfrastructureDatabaseDto[]>;
  createDatabase(req: CreateInfrastructureDatabaseRequest): Promise<InfrastructureDatabaseDto>;
  getConnectionPools(): Promise<DatabaseConnectionPoolDto[]>;
  updateConnectionPool(req: UpdateConnectionPoolRequest): Promise<DatabaseConnectionPoolDto>;
  getReplicationLinks(): Promise<InfrastructureReplicationLinkDto[]>;
  createReplicationLink(req: CreateReplicationLinkRequest): Promise<InfrastructureReplicationLinkDto>;
  getHealthSnapshots(): Promise<InfrastructureHealthSnapshotDto[]>;
  runHealthProbe(req: RunHealthProbeRequest): Promise<InfrastructureHealthSnapshotDto>;
  getAlerts(): Promise<InfrastructureAlertDto[]>;
  createAlert(req: CreateInfrastructureAlertRequest): Promise<InfrastructureAlertDto>;
  getIncidents(): Promise<InfrastructureIncidentDto[]>;
  createIncident(req: CreateInfrastructureIncidentRequest): Promise<InfrastructureIncidentDto>;
  acknowledgeIncident(req: AcknowledgeInfrastructureIncidentRequest): Promise<InfrastructureIncidentDto>;
  resolveIncident(req: ResolveInfrastructureIncidentRequest): Promise<InfrastructureIncidentDto>;
  getBackupPolicies(): Promise<BackupPolicyDto[]>;
  createBackupPolicy(req: CreateBackupPolicyRequest): Promise<BackupPolicyDto>;
  getBackupRecords(): Promise<BackupRecordDto[]>;
  triggerBackup(req: TriggerBackupRequest): Promise<BackupRecordDto>;
  getRestoreVerifications(): Promise<RestoreVerificationDto[]>;
  verifyBackup(req: VerifyBackupRequest): Promise<RestoreVerificationDto>;
  getDRPlans(): Promise<DisasterRecoveryPlanDto[]>;
  createDRPlan(req: CreateDRPlanRequest): Promise<DisasterRecoveryPlanDto>;
  getDRDrills(): Promise<DisasterRecoveryDrillDto[]>;
  scheduleDRDrill(req: ScheduleDRDrillRequest): Promise<DisasterRecoveryDrillDto>;
  executeDRDrill(req: ExecuteDRDrillRequest): Promise<DisasterRecoveryDrillDto>;
  getFailoverEvents(): Promise<FailoverEventDto[]>;
  initiateFailover(req: InitiateFailoverRequest): Promise<FailoverEventDto>;
  rollbackFailover(req: RollbackFailoverRequest): Promise<FailoverEventDto>;
  getAuditTraces(): Promise<InfrastructureAuditTraceDto[]>;
  generateAuditReport(req: GenerateInfrastructureAuditReportRequest): Promise<{ reportId: string; downloadUrl: string }>;
}

export class InfrastructureService implements IInfrastructureService {
  private projects: InfrastructureProjectDto[] = [...MOCK_INFRA_PROJECTS];
  private regions: InfrastructureRegionDto[] = [...MOCK_INFRA_REGIONS];
  private clusters: InfrastructureClusterDto[] = [...MOCK_INFRA_CLUSTERS];
  private nodes: InfrastructureNodeDto[] = [...MOCK_INFRA_NODES];
  private services: InfrastructureServiceDto[] = [...MOCK_INFRA_SERVICES];
  private databases: InfrastructureDatabaseDto[] = [...MOCK_INFRA_DATABASES];
  private connectionPools: DatabaseConnectionPoolDto[] = [...MOCK_CONNECTION_POOLS];
  private replicationLinks: InfrastructureReplicationLinkDto[] = [...MOCK_REPLICATION_LINKS];
  private healthSnapshots: InfrastructureHealthSnapshotDto[] = [...MOCK_HEALTH_SNAPSHOTS];
  private alerts: InfrastructureAlertDto[] = [...MOCK_INFRA_ALERTS];
  private incidents: InfrastructureIncidentDto[] = [...MOCK_INFRA_INCIDENTS];
  private backupPolicies: BackupPolicyDto[] = [...MOCK_BACKUP_POLICIES];
  private backupRecords: BackupRecordDto[] = [...MOCK_BACKUP_RECORDS];
  private restoreVerifications: RestoreVerificationDto[] = [...MOCK_RESTORE_VERIFICATIONS];
  private drPlans: DisasterRecoveryPlanDto[] = [...MOCK_DR_PLANS];
  private drDrills: DisasterRecoveryDrillDto[] = [...MOCK_DR_DRILLS];
  private failoverEvents: FailoverEventDto[] = [...MOCK_FAILOVER_EVENTS];
  private auditTraces: InfrastructureAuditTraceDto[] = [...MOCK_INFRA_AUDIT_TRACES];

  private addAuditTrace(
    action: string,
    resourceReference: string,
    actorEmail: string,
    reason: string,
    environment = 'PRODUCTION',
    operationStatus: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'SIMULATED' = 'SUCCESS'
  ) {
    const trace: InfrastructureAuditTraceDto = {
      id: crypto.randomUUID(),
      traceId: `tr-infra-${Math.floor(1000 + Math.random() * 9000)}`,
      actorEmail,
      action,
      resourceReference,
      environment,
      operationStatus,
      occurredAt: new Date().toISOString(),
      correlationReference: `corr-${Date.now()}`,
      evidenceReference: `ev-infra-trace-${Date.now()}`,
      reason,
      metadata: {}
    };
    this.auditTraces.unshift(trace);
  }

  async getOverview(): Promise<InfrastructureOverviewDto> {
    return {
      ...MOCK_INFRA_OVERVIEW,
      totalRegionsCount: this.regions.length,
      totalClustersCount: this.clusters.length,
      totalNodesCount: this.nodes.length,
      totalServicesCount: this.services.length,
      totalDatabasesCount: this.databases.length,
      activeAlertsCount: this.alerts.filter((a) => a.status === 'OPEN').length,
      openIncidentsCount: this.incidents.filter((i) => i.status === 'OPEN').length,
      backupPoliciesCount: this.backupPolicies.length,
      activeDrPlansCount: this.drPlans.filter((p) => p.status === 'ACTIVE').length
    };
  }

  async getProjects(): Promise<InfrastructureProjectDto[]> {
    return [...this.projects];
  }

  async createProject(req: CreateInfrastructureProjectRequest): Promise<InfrastructureProjectDto> {
    const proj: InfrastructureProjectDto = {
      id: crypto.randomUUID(),
      projectCode: req.projectCode,
      projectName: req.projectName,
      description: req.description,
      projectType: req.projectType,
      repositoryReference: req.repositoryReference,
      ownerEmail: req.ownerEmail,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.projects.push(proj);
    this.addAuditTrace('INFRASTRUCTURE_PROJECT_CREATED', proj.projectCode, req.actorEmail, req.reason);
    return proj;
  }

  async getRegions(): Promise<InfrastructureRegionDto[]> {
    return [...this.regions];
  }

  async createRegion(req: CreateRegionRequest): Promise<InfrastructureRegionDto> {
    const reg: InfrastructureRegionDto = {
      id: crypto.randomUUID(),
      regionCode: req.regionCode,
      regionName: req.regionName,
      provider: req.provider,
      geographicReference: req.geographicReference,
      status: 'ACTIVE',
      isPrimary: req.isPrimary,
      isDrRegion: req.isDrRegion,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.regions.push(reg);
    this.addAuditTrace('INFRASTRUCTURE_REGION_REGISTERED', reg.regionCode, req.actorEmail, req.reason);
    return reg;
  }

  async getClusters(): Promise<InfrastructureClusterDto[]> {
    return [...this.clusters];
  }

  async createCluster(req: CreateClusterRequest): Promise<InfrastructureClusterDto> {
    const reg = this.regions.find((r) => r.id === req.regionId);
    const cluster: InfrastructureClusterDto = {
      id: crypto.randomUUID(),
      clusterCode: req.clusterCode,
      clusterName: req.clusterName,
      provider: req.provider,
      regionId: req.regionId,
      regionCode: reg?.regionCode ?? 'UNKNOWN',
      environment: req.environment,
      clusterType: req.clusterType,
      orchestrationType: req.orchestrationType,
      status: 'HEALTHY',
      nodeCount: 0,
      versionReference: req.versionReference,
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.clusters.push(cluster);
    this.addAuditTrace('INFRASTRUCTURE_CLUSTER_CREATED', cluster.clusterCode, req.actorEmail, req.reason, req.environment);
    return cluster;
  }

  async getNodes(): Promise<InfrastructureNodeDto[]> {
    return [...this.nodes];
  }

  async createNode(req: CreateNodeRequest): Promise<InfrastructureNodeDto> {
    const cluster = this.clusters.find((c) => c.id === req.clusterId);
    const node: InfrastructureNodeDto = {
      id: crypto.randomUUID(),
      nodeCode: req.nodeCode,
      clusterId: req.clusterId,
      clusterName: cluster?.clusterName ?? 'UNKNOWN',
      nodeName: req.nodeName,
      nodeType: req.nodeType,
      instanceReference: req.instanceReference,
      cpuCapacity: req.cpuCapacity,
      memoryCapacity: req.memoryCapacity,
      status: 'READY',
      availabilityZoneReference: req.availabilityZoneReference,
      environment: req.environment,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.nodes.push(node);
    if (cluster) {
      cluster.nodeCount += 1;
    }
    this.addAuditTrace('INFRASTRUCTURE_NODE_REGISTERED', node.nodeCode, req.actorEmail, req.reason, req.environment);
    return node;
  }

  async getServices(): Promise<InfrastructureServiceDto[]> {
    return [...this.services];
  }

  async createService(req: CreateInfrastructureServiceRequest): Promise<InfrastructureServiceDto> {
    const cluster = this.clusters.find((c) => c.id === req.clusterId);
    const svc: InfrastructureServiceDto = {
      id: crypto.randomUUID(),
      serviceCode: req.serviceCode,
      serviceName: req.serviceName,
      serviceType: req.serviceType,
      clusterId: req.clusterId,
      clusterName: cluster?.clusterName ?? 'UNKNOWN',
      environment: req.environment,
      status: 'RUNNING',
      healthStatus: 'HEALTHY',
      versionReference: req.versionReference,
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.services.push(svc);
    this.addAuditTrace('INFRASTRUCTURE_SERVICE_REGISTERED', svc.serviceCode, req.actorEmail, req.reason, req.environment);
    return svc;
  }

  async getDatabases(): Promise<InfrastructureDatabaseDto[]> {
    return [...this.databases];
  }

  async createDatabase(req: CreateInfrastructureDatabaseRequest): Promise<InfrastructureDatabaseDto> {
    const reg = this.regions.find((r) => r.id === req.regionId);
    const db: InfrastructureDatabaseDto = {
      id: crypto.randomUUID(),
      databaseCode: req.databaseCode,
      databaseName: req.databaseName,
      databaseType: req.databaseType,
      clusterId: req.clusterId,
      regionId: req.regionId,
      regionCode: reg?.regionCode ?? 'UNKNOWN',
      environment: req.environment,
      status: 'ONLINE',
      engineVersion: req.engineVersion,
      replicationMode: req.replicationMode,
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.databases.push(db);
    this.addAuditTrace('INFRASTRUCTURE_DATABASE_REGISTERED', db.databaseCode, req.actorEmail, req.reason, req.environment);
    return db;
  }

  async getConnectionPools(): Promise<DatabaseConnectionPoolDto[]> {
    return [...this.connectionPools];
  }

  async updateConnectionPool(req: UpdateConnectionPoolRequest): Promise<DatabaseConnectionPoolDto> {
    const pool = this.connectionPools.find((p) => p.id === req.poolId);
    if (!pool) throw new Error(`Connection pool not found with ID ${req.poolId}`);
    pool.maxConnections = req.maxConnections;
    pool.connectionTimeoutMs = req.connectionTimeoutMs;
    pool.lastCheckedAt = new Date().toISOString();
    this.addAuditTrace('CONNECTION_POOL_UPDATED', pool.poolCode, req.actorEmail, req.reason, pool.environment);
    return { ...pool };
  }

  async getReplicationLinks(): Promise<InfrastructureReplicationLinkDto[]> {
    return [...this.replicationLinks];
  }

  async createReplicationLink(req: CreateReplicationLinkRequest): Promise<InfrastructureReplicationLinkDto> {
    const srcReg = this.regions.find((r) => r.id === req.sourceRegionId);
    const tgtReg = this.regions.find((r) => r.id === req.targetRegionId);
    const srcDb = this.databases.find((d) => d.id === req.sourceDatabaseId);
    const tgtDb = this.databases.find((d) => d.id === req.targetDatabaseId);

    const link: InfrastructureReplicationLinkDto = {
      id: crypto.randomUUID(),
      replicationCode: req.replicationCode,
      sourceRegionId: req.sourceRegionId,
      sourceRegionCode: srcReg?.regionCode ?? 'UNKNOWN',
      targetRegionId: req.targetRegionId,
      targetRegionCode: tgtReg?.regionCode ?? 'UNKNOWN',
      sourceDatabaseId: req.sourceDatabaseId,
      sourceDatabaseName: srcDb?.databaseName ?? 'UNKNOWN',
      targetDatabaseId: req.targetDatabaseId,
      targetDatabaseName: tgtDb?.databaseName ?? 'UNKNOWN',
      replicationMode: req.replicationMode,
      status: 'HEALTHY',
      lagReference: '0s (Synchronous Multi-AZ)',
      lastVerifiedAt: new Date().toISOString(),
      failureCount: 0,
      metadata: {}
    };
    this.replicationLinks.push(link);
    this.addAuditTrace('REPLICATION_LINK_CREATED', link.replicationCode, req.actorEmail, req.reason);
    return link;
  }

  async getHealthSnapshots(): Promise<InfrastructureHealthSnapshotDto[]> {
    return [...this.healthSnapshots];
  }

  async runHealthProbe(req: RunHealthProbeRequest): Promise<InfrastructureHealthSnapshotDto> {
    const snapshot: InfrastructureHealthSnapshotDto = {
      id: crypto.randomUUID(),
      resourceType: req.resourceType,
      resourceReference: req.resourceReference,
      environment: req.environment,
      healthStatus: 'HEALTHY',
      availabilityStatus: 'Sample probe completed (Preview)',
      cpuUtilizationReference: '35% (Simulated)',
      memoryUtilizationReference: '48% (Simulated)',
      latencyReference: '12ms',
      errorRateReference: '0.00%',
      checkedAt: new Date().toISOString(),
      checkSource: 'MANUAL_CONTROL_PLANE_PROBE',
      sourceStatus: 'PENDING_TELEMETRY_PIPELINE',
      metadata: { simulated: true }
    };
    this.healthSnapshots.unshift(snapshot);
    this.addAuditTrace('HEALTH_PROBE_EXECUTED', req.resourceReference, req.actorEmail, req.reason, req.environment, 'SIMULATED');
    return snapshot;
  }

  async getAlerts(): Promise<InfrastructureAlertDto[]> {
    return [...this.alerts];
  }

  async createAlert(req: CreateInfrastructureAlertRequest): Promise<InfrastructureAlertDto> {
    const alert: InfrastructureAlertDto = {
      id: crypto.randomUUID(),
      alertCode: `alt-infra-${Math.floor(1000 + Math.random() * 9000)}`,
      resourceType: req.resourceType,
      resourceReference: req.resourceReference,
      severity: req.severity,
      alertType: req.alertType,
      title: req.title,
      description: req.description,
      status: 'OPEN',
      detectedAt: new Date().toISOString(),
      metadata: {}
    };
    this.alerts.unshift(alert);
    this.addAuditTrace('INFRASTRUCTURE_ALERT_TRIGGERED', alert.alertCode, req.actorEmail, req.reason);
    return alert;
  }

  async getIncidents(): Promise<InfrastructureIncidentDto[]> {
    return [...this.incidents];
  }

  async createIncident(req: CreateInfrastructureIncidentRequest): Promise<InfrastructureIncidentDto> {
    const inc: InfrastructureIncidentDto = {
      id: crypto.randomUUID(),
      incidentCode: `inc-infra-${Math.floor(1000 + Math.random() * 9000)}`,
      category: req.category,
      severity: req.severity,
      title: req.title,
      description: req.description,
      source: req.source,
      environment: req.environment,
      resourceReference: req.resourceReference,
      status: 'OPEN',
      detectedAt: new Date().toISOString(),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.incidents.unshift(inc);
    this.addAuditTrace('INFRASTRUCTURE_INCIDENT_CREATED', inc.incidentCode, req.actorEmail, req.reason, req.environment);
    return inc;
  }

  async acknowledgeIncident(req: AcknowledgeInfrastructureIncidentRequest): Promise<InfrastructureIncidentDto> {
    const inc = this.incidents.find((i) => i.id === req.incidentId);
    if (!inc) throw new Error(`Incident not found with ID ${req.incidentId}`);
    inc.status = 'INVESTIGATING';
    inc.acknowledgedAt = new Date().toISOString();
    inc.assignedToEmail = req.assignedToEmail;
    inc.updatedAt = new Date().toISOString();
    this.addAuditTrace('INFRASTRUCTURE_INCIDENT_ACKNOWLEDGED', inc.incidentCode, req.actorEmail, req.reason, inc.environment);
    return { ...inc };
  }

  async resolveIncident(req: ResolveInfrastructureIncidentRequest): Promise<InfrastructureIncidentDto> {
    const inc = this.incidents.find((i) => i.id === req.incidentId);
    if (!inc) throw new Error(`Incident not found with ID ${req.incidentId}`);
    inc.status = 'RESOLVED';
    inc.resolvedAt = new Date().toISOString();
    inc.resolutionNotes = req.resolutionNotes;
    inc.updatedAt = new Date().toISOString();
    this.addAuditTrace('INFRASTRUCTURE_INCIDENT_RESOLVED', inc.incidentCode, req.actorEmail, req.reason, inc.environment);
    return { ...inc };
  }

  async getBackupPolicies(): Promise<BackupPolicyDto[]> {
    return [...this.backupPolicies];
  }

  async createBackupPolicy(req: CreateBackupPolicyRequest): Promise<BackupPolicyDto> {
    const pol: BackupPolicyDto = {
      id: crypto.randomUUID(),
      policyCode: req.policyCode,
      policyName: req.policyName,
      resourceType: req.resourceType,
      scheduleReference: req.scheduleReference,
      retentionDays: req.retentionDays,
      retentionPolicy: req.retentionPolicy,
      encryptionReference: req.encryptionReference,
      crossRegionEnabled: req.crossRegionEnabled,
      immutableBackupEnabled: req.immutableBackupEnabled,
      status: 'ACTIVE',
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.backupPolicies.push(pol);
    this.addAuditTrace('BACKUP_POLICY_CREATED', pol.policyCode, req.actorEmail, req.reason);
    return pol;
  }

  async getBackupRecords(): Promise<BackupRecordDto[]> {
    return [...this.backupRecords];
  }

  async triggerBackup(req: TriggerBackupRequest): Promise<BackupRecordDto> {
    const pol = this.backupPolicies.find((p) => p.id === req.policyId);
    const now = new Date();
    const expiry = new Date(now.getTime() + (pol?.retentionDays ?? 30) * 24 * 60 * 60 * 1000);

    const rec: BackupRecordDto = {
      id: crypto.randomUUID(),
      backupCode: `bk-manual-${Date.now()}`,
      policyId: req.policyId,
      policyName: pol?.policyName ?? 'UNKNOWN',
      resourceReference: req.resourceReference,
      environment: req.environment,
      backupType: req.backupType,
      status: 'SUCCEEDED',
      startedAt: now.toISOString(),
      completedAt: new Date(now.getTime() + 12000).toISOString(),
      sizeReference: '48.9 GB (Sample)',
      storageReference: `s3://docsearch-immutable-backups/${req.environment.toLowerCase()}/manual-${Date.now()}.tar.zst`,
      checksumReference: `sha256:${crypto.randomUUID().replace(/-/g, '')}`,
      retentionUntil: expiry.toISOString(),
      verificationStatus: 'VERIFIED',
      metadata: { triggeredManually: true }
    };
    this.backupRecords.unshift(rec);
    this.addAuditTrace('BACKUP_TRIGGERED_MANUAL', rec.backupCode, req.actorEmail, req.reason, req.environment);
    return rec;
  }

  async getRestoreVerifications(): Promise<RestoreVerificationDto[]> {
    return [...this.restoreVerifications];
  }

  async verifyBackup(req: VerifyBackupRequest): Promise<RestoreVerificationDto> {
    const bk = this.backupRecords.find((b) => b.id === req.backupId);
    const verif: RestoreVerificationDto = {
      id: crypto.randomUUID(),
      verificationCode: `verif-bk-${Date.now()}`,
      backupId: req.backupId,
      backupCode: bk?.backupCode ?? 'UNKNOWN',
      targetEnvironment: req.targetEnvironment,
      verificationType: req.verificationType,
      status: 'PASSED',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      verifiedByEmail: req.actorEmail,
      evidenceReference: `ev-verif-audit-${Date.now()}`,
      notes: 'Automated test container spinup verified checksum integrity 100%.',
      metadata: { validatedBy: req.actorEmail }
    };
    this.restoreVerifications.unshift(verif);
    this.addAuditTrace('BACKUP_RESTORE_VERIFIED', verif.verificationCode, req.actorEmail, req.reason, req.targetEnvironment);
    return verif;
  }

  async getDRPlans(): Promise<DisasterRecoveryPlanDto[]> {
    return [...this.drPlans];
  }

  async createDRPlan(req: CreateDRPlanRequest): Promise<DisasterRecoveryPlanDto> {
    const prim = this.regions.find((r) => r.id === req.primaryRegionId);
    const dr = this.regions.find((r) => r.id === req.drRegionId);
    const now = new Date();
    const nextReview = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const plan: DisasterRecoveryPlanDto = {
      id: crypto.randomUUID(),
      planCode: req.planCode,
      planName: req.planName,
      scope: req.scope,
      primaryRegionId: req.primaryRegionId,
      primaryRegionCode: prim?.regionCode ?? 'UNKNOWN',
      drRegionId: req.drRegionId,
      drRegionCode: dr?.regionCode ?? 'UNKNOWN',
      rtoMinutes: req.rtoMinutes,
      rpoMinutes: req.rpoMinutes,
      failoverStrategy: req.failoverStrategy,
      runbookReference: req.runbookReference,
      lastReviewedAt: now.toISOString(),
      nextReviewDue: nextReview.toISOString(),
      status: 'ACTIVE',
      ownerEmail: req.ownerEmail,
      metadata: {}
    };
    this.drPlans.push(plan);
    this.addAuditTrace('DR_PLAN_CREATED', plan.planCode, req.actorEmail, req.reason);
    return plan;
  }

  async getDRDrills(): Promise<DisasterRecoveryDrillDto[]> {
    return [...this.drDrills];
  }

  async scheduleDRDrill(req: ScheduleDRDrillRequest): Promise<DisasterRecoveryDrillDto> {
    const plan = this.drPlans.find((p) => p.id === req.planId);
    const drill: DisasterRecoveryDrillDto = {
      id: crypto.randomUUID(),
      drillCode: `drill-${Date.now()}`,
      planId: req.planId,
      planName: plan?.planName ?? 'UNKNOWN',
      drillType: req.drillType,
      scheduledAt: req.scheduledAt,
      status: 'SCHEDULED',
      expectedRtoMinutes: req.expectedRtoMinutes,
      expectedRpoMinutes: req.expectedRpoMinutes,
      result: 'NOT_EVALUATED',
      conductedByEmail: req.actorEmail,
      metadata: {}
    };
    this.drDrills.unshift(drill);
    this.addAuditTrace('DR_DRILL_SCHEDULED', drill.drillCode, req.actorEmail, req.reason);
    return drill;
  }

  async executeDRDrill(req: ExecuteDRDrillRequest): Promise<DisasterRecoveryDrillDto> {
    const drill = this.drDrills.find((d) => d.id === req.drillId);
    if (!drill) throw new Error(`Drill not found with ID ${req.drillId}`);
    drill.status = 'COMPLETED';
    drill.startedAt = new Date().toISOString();
    drill.completedAt = new Date().toISOString();
    drill.actualRtoMinutesReference = `${drill.expectedRtoMinutes - 2}m 15s (Simulated)`;
    drill.actualRpoReference = `${drill.expectedRpoMinutes * 10}s (Simulated)`;
    drill.result = 'PASSED';
    drill.evidenceReference = `ev-drill-${Date.now()}.pdf`;
    drill.findingsReference = 'Simulation executed cleanly with 0 data loss.';

    this.addAuditTrace('DR_DRILL_EXECUTED_SIMULATION', drill.drillCode, req.actorEmail, req.reason, 'PRODUCTION', 'SIMULATED');
    return { ...drill };
  }

  async getFailoverEvents(): Promise<FailoverEventDto[]> {
    return [...this.failoverEvents];
  }

  async initiateFailover(req: InitiateFailoverRequest): Promise<FailoverEventDto> {
    const plan = this.drPlans.find((p) => p.id === req.planId);
    const fo: FailoverEventDto = {
      id: crypto.randomUUID(),
      failoverCode: `fo-sim-${Date.now()}`,
      planId: req.planId,
      planName: plan?.planName ?? 'UNKNOWN',
      sourceRegionId: plan?.primaryRegionId ?? crypto.randomUUID(),
      sourceRegionCode: plan?.primaryRegionCode ?? 'reg-us-east-1',
      targetRegionId: plan?.drRegionId ?? crypto.randomUUID(),
      targetRegionCode: plan?.drRegionCode ?? 'reg-us-west-2',
      environment: req.environment,
      triggerType: req.triggerType,
      status: 'COMPLETED',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      initiatedByEmail: req.actorEmail,
      rollbackReference: `rb-sim-${Date.now()}`,
      reason: req.reason,
      metadata: { simulatedOnly: true }
    };
    this.failoverEvents.unshift(fo);
    this.addAuditTrace('FAILOVER_INITIATED_SIMULATION', fo.failoverCode, req.actorEmail, req.reason, req.environment, 'SIMULATED');
    return fo;
  }

  async rollbackFailover(req: RollbackFailoverRequest): Promise<FailoverEventDto> {
    const fo = this.failoverEvents.find((f) => f.id === req.failoverEventId);
    if (!fo) throw new Error(`Failover event not found with ID ${req.failoverEventId}`);
    fo.status = 'ROLLED_BACK';
    this.addAuditTrace('FAILOVER_ROLLED_BACK_SIMULATION', fo.failoverCode, req.actorEmail, req.reason, fo.environment, 'SIMULATED');
    return { ...fo };
  }

  async getAuditTraces(): Promise<InfrastructureAuditTraceDto[]> {
    return [...this.auditTraces];
  }

  async generateAuditReport(req: GenerateInfrastructureAuditReportRequest): Promise<{ reportId: string; downloadUrl: string }> {
    const reportId = `rep-infra-${Date.now()}`;
    this.addAuditTrace('INFRASTRUCTURE_AUDIT_REPORT_GENERATED', reportId, req.actorEmail, req.reason, req.environment);
    return {
      reportId,
      downloadUrl: `https://audit.docsearch.internal/reports/${reportId}.pdf`
    };
  }
}

export const infrastructureService = new InfrastructureService();
