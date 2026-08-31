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
  InfrastructureOverviewDto
} from '@docsearch/api-contracts';

export const MOCK_INFRA_REGIONS: InfrastructureRegionDto[] = [
  {
    id: 'c1a11111-1111-4111-8111-111111111111',
    regionCode: 'reg-us-east-1',
    regionName: 'US East (N. Virginia)',
    provider: 'AWS',
    geographicReference: 'North Virginia, United States',
    status: 'ACTIVE',
    isPrimary: true,
    isDrRegion: false,
    metadata: { azCount: 3, latencyTargetMs: 12 },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'c1a22222-2222-4222-8222-222222222222',
    regionCode: 'reg-us-west-2',
    regionName: 'US West (Oregon) - DR',
    provider: 'AWS',
    geographicReference: 'Oregon, United States',
    status: 'ACTIVE',
    isPrimary: false,
    isDrRegion: true,
    metadata: { azCount: 3, standbyMode: 'WARM_STANDBY' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

export const MOCK_INFRA_PROJECTS: InfrastructureProjectDto[] = [
  {
    id: 'c2a11111-1111-4111-8111-111111111111',
    projectCode: 'proj-infra-core',
    projectName: 'Doc Search Cloud Core Infrastructure',
    description: 'Kubernetes EKS control-plane, multi-region networking, and VPC peering mesh',
    projectType: 'INFRASTRUCTURE',
    repositoryReference: 'github.com/docsearch/infrastructure-core',
    ownerEmail: 'infra.lead@docsearch.internal',
    status: 'ACTIVE',
    metadata: { terraformWorkspace: 'production-core' },
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-08-15T12:00:00Z'
  },
  {
    id: 'c2a22222-2222-4222-8222-222222222222',
    projectCode: 'proj-infra-dr',
    projectName: 'Multi-Region Disaster Recovery Orchestration',
    description: 'Cross-region replication, continuous backup verifications, and automated failover control plane',
    projectType: 'DISASTER_RECOVERY',
    repositoryReference: 'github.com/docsearch/dr-automation',
    ownerEmail: 'sre.lead@docsearch.internal',
    status: 'ACTIVE',
    metadata: { rtoTarget: '15m', rpoTarget: '5m' },
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  }
];

export const MOCK_INFRA_CLUSTERS: InfrastructureClusterDto[] = [
  {
    id: 'c3a11111-1111-4111-8111-111111111111',
    clusterCode: 'eks-prod-useast1',
    clusterName: 'Production Core Application Cluster (EKS)',
    provider: 'AWS_EKS',
    regionId: 'c1a11111-1111-4111-8111-111111111111',
    regionCode: 'reg-us-east-1',
    environment: 'PRODUCTION',
    clusterType: 'APPLICATION',
    orchestrationType: 'KUBERNETES',
    status: 'HEALTHY',
    nodeCount: 12,
    versionReference: 'Kubernetes v1.29.3',
    ownerEmail: 'k8s.admin@docsearch.internal',
    metadata: { autoscalingMin: 6, autoscalingMax: 24 },
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z'
  },
  {
    id: 'c3a22222-2222-4222-8222-222222222222',
    clusterCode: 'eks-dr-uswest2',
    clusterName: 'Disaster Recovery Standby Cluster (EKS)',
    provider: 'AWS_EKS',
    regionId: 'c1a22222-2222-4222-8222-222222222222',
    regionCode: 'reg-us-west-2',
    environment: 'PRODUCTION',
    clusterType: 'DR',
    orchestrationType: 'KUBERNETES',
    status: 'HEALTHY',
    nodeCount: 4,
    versionReference: 'Kubernetes v1.29.3',
    ownerEmail: 'sre.lead@docsearch.internal',
    metadata: { standbyWarmNodes: 4, failoverTargetCapacity: 16 },
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z'
  }
];

export const MOCK_INFRA_NODES: InfrastructureNodeDto[] = [
  {
    id: 'c4a11111-1111-4111-8111-111111111111',
    nodeCode: 'node-useast1-app-01',
    clusterId: 'c3a11111-1111-4111-8111-111111111111',
    clusterName: 'Production Core Application Cluster (EKS)',
    nodeName: 'ip-10-0-12-45.ec2.internal',
    nodeType: 'COMPUTE',
    instanceReference: 'm6i.2xlarge',
    cpuCapacity: '8 vCPU',
    memoryCapacity: '32 GiB',
    status: 'READY',
    availabilityZoneReference: 'us-east-1a',
    environment: 'PRODUCTION',
    metadata: { podCount: 18, kernelVersion: '5.15.0-aws' },
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z'
  },
  {
    id: 'c4a22222-2222-4222-8222-222222222222',
    nodeCode: 'node-useast1-app-02',
    clusterId: 'c3a11111-1111-4111-8111-111111111111',
    clusterName: 'Production Core Application Cluster (EKS)',
    nodeName: 'ip-10-0-13-88.ec2.internal',
    nodeType: 'COMPUTE',
    instanceReference: 'm6i.2xlarge',
    cpuCapacity: '8 vCPU',
    memoryCapacity: '32 GiB',
    status: 'READY',
    availabilityZoneReference: 'us-east-1b',
    environment: 'PRODUCTION',
    metadata: { podCount: 22, kernelVersion: '5.15.0-aws' },
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z'
  },
  {
    id: 'c4a33333-3333-4333-8333-333333333333',
    nodeCode: 'node-uswest2-dr-01',
    clusterId: 'c3a22222-2222-4222-8222-222222222222',
    clusterName: 'Disaster Recovery Standby Cluster (EKS)',
    nodeName: 'ip-10-2-10-12.ec2.internal',
    nodeType: 'COMPUTE',
    instanceReference: 'm6i.xlarge',
    cpuCapacity: '4 vCPU',
    memoryCapacity: '16 GiB',
    status: 'READY',
    availabilityZoneReference: 'us-west-2a',
    environment: 'PRODUCTION',
    metadata: { podCount: 8, standbyState: 'WARM' },
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z'
  }
];

export const MOCK_INFRA_SERVICES: InfrastructureServiceDto[] = [
  {
    id: 'c5a11111-1111-4111-8111-111111111111',
    serviceCode: 'svc-api-gateway',
    serviceName: 'Fastify API Gateway Ingress Service',
    serviceType: 'API',
    clusterId: 'c3a11111-1111-4111-8111-111111111111',
    clusterName: 'Production Core Application Cluster (EKS)',
    environment: 'PRODUCTION',
    status: 'RUNNING',
    healthStatus: 'HEALTHY',
    versionReference: 'v1.0.0-release',
    ownerEmail: 'api.lead@docsearch.internal',
    metadata: { replicas: 4, port: 4000 },
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z'
  },
  {
    id: 'c5a22222-2222-4222-8222-222222222222',
    serviceCode: 'svc-company-platform',
    serviceName: 'Company Governance Platform Web Service',
    serviceType: 'WEB',
    clusterId: 'c3a11111-1111-4111-8111-111111111111',
    clusterName: 'Production Core Application Cluster (EKS)',
    environment: 'PRODUCTION',
    status: 'RUNNING',
    healthStatus: 'HEALTHY',
    versionReference: 'v1.0.0-release',
    ownerEmail: 'platform.lead@docsearch.internal',
    metadata: { replicas: 3, port: 3000 },
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z'
  }
];

export const MOCK_BACKUP_POLICIES: BackupPolicyDto[] = [
  {
    id: 'c6a11111-1111-4111-8111-111111111111',
    policyCode: 'pol-pg-prod-daily',
    policyName: 'Production PostgreSQL Continuous WAL & Daily Snapshots',
    resourceType: 'POSTGRESQL_CLUSTER',
    scheduleReference: 'Hourly Continuous WAL + Daily 02:00 UTC Full Snapshot',
    retentionDays: 30,
    retentionPolicy: '30_DAYS_IMMUTABLE_WORM',
    encryptionReference: 'AES-256-GCM (AWS KMS / vault://infrastructure/kms/backup-key)',
    crossRegionEnabled: true,
    immutableBackupEnabled: true,
    status: 'ACTIVE',
    ownerEmail: 'database.admin@docsearch.internal',
    metadata: { replicationDestination: 'us-west-2', legalHoldEnabled: true },
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

export const MOCK_INFRA_DATABASES: InfrastructureDatabaseDto[] = [
  {
    id: 'c7a11111-1111-4111-8111-111111111111',
    databaseCode: 'db-pg-prod-primary',
    databaseName: 'Doc Search Production PostgreSQL Cluster (Multi-AZ)',
    databaseType: 'POSTGRESQL',
    clusterId: 'c3a11111-1111-4111-8111-111111111111',
    regionId: 'c1a11111-1111-4111-8111-111111111111',
    regionCode: 'reg-us-east-1',
    environment: 'PRODUCTION',
    status: 'ONLINE',
    engineVersion: 'PostgreSQL 16.2',
    replicationMode: 'PRIMARY_REPLICA',
    backupPolicyId: 'c6a11111-1111-4111-8111-111111111111',
    backupPolicyName: 'Production PostgreSQL Continuous WAL & Daily Snapshots',
    ownerEmail: 'database.admin@docsearch.internal',
    metadata: { multiAz: true, storageAllocatedGb: 500, maxIops: 12000 },
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z'
  },
  {
    id: 'c7a22222-2222-4222-8222-222222222222',
    databaseCode: 'db-pg-dr-standby',
    databaseName: 'Doc Search DR Standby PostgreSQL Read Replica',
    databaseType: 'POSTGRESQL',
    clusterId: 'c3a22222-2222-4222-8222-222222222222',
    regionId: 'c1a22222-2222-4222-8222-222222222222',
    regionCode: 'reg-us-west-2',
    environment: 'PRODUCTION',
    status: 'ONLINE',
    engineVersion: 'PostgreSQL 16.2',
    replicationMode: 'PRIMARY_REPLICA',
    backupPolicyId: 'c6a11111-1111-4111-8111-111111111111',
    backupPolicyName: 'Production PostgreSQL Continuous WAL & Daily Snapshots',
    ownerEmail: 'sre.lead@docsearch.internal',
    metadata: { streamingReplication: true, crossRegionSync: true },
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z'
  }
];

export const MOCK_CONNECTION_POOLS: DatabaseConnectionPoolDto[] = [
  {
    id: 'c8a11111-1111-4111-8111-111111111111',
    poolCode: 'pool-pg-prod-primary',
    databaseId: 'c7a11111-1111-4111-8111-111111111111',
    databaseName: 'Doc Search Production PostgreSQL Cluster (Multi-AZ)',
    environment: 'PRODUCTION',
    maxConnections: 150,
    activeConnections: 34,
    idleConnections: 48,
    waitingConnections: 0,
    connectionTimeoutMs: 5000,
    status: 'HEALTHY',
    lastCheckedAt: '2026-08-29T16:00:00Z',
    metadata: { poolMode: 'TRANSACTION', pgbouncerReference: 'pgbouncer-prod-pool-01' }
  }
];

export const MOCK_REPLICATION_LINKS: InfrastructureReplicationLinkDto[] = [
  {
    id: 'c9a11111-1111-4111-8111-111111111111',
    replicationCode: 'repl-useast1-to-uswest2',
    sourceRegionId: 'c1a11111-1111-4111-8111-111111111111',
    sourceRegionCode: 'reg-us-east-1',
    targetRegionId: 'c1a22222-2222-4222-8222-222222222222',
    targetRegionCode: 'reg-us-west-2',
    sourceDatabaseId: 'c7a11111-1111-4111-8111-111111111111',
    sourceDatabaseName: 'Doc Search Production PostgreSQL Cluster (Multi-AZ)',
    targetDatabaseId: 'c7a22222-2222-4222-8222-222222222222',
    targetDatabaseName: 'Doc Search DR Standby PostgreSQL Read Replica',
    replicationMode: 'PRIMARY_REPLICA',
    status: 'HEALTHY',
    lagReference: '350ms (Asynchronous Cross-Region WAL Stream)',
    lastVerifiedAt: '2026-08-29T16:00:00Z',
    failureCount: 0,
    metadata: { replicationSlot: 'dr_standby_slot_uswest2', tlsEnforced: true }
  }
];

export const MOCK_HEALTH_SNAPSHOTS: InfrastructureHealthSnapshotDto[] = [
  {
    id: 'd1a11111-1111-4111-8111-111111111111',
    resourceType: 'CLUSTER',
    resourceReference: 'eks-prod-useast1',
    environment: 'PRODUCTION',
    healthStatus: 'HEALTHY',
    availabilityStatus: 'Sample health state (Preview)',
    cpuUtilizationReference: '38% (Simulated)',
    memoryUtilizationReference: '52% (Simulated)',
    latencyReference: '14ms',
    errorRateReference: '0.00%',
    checkedAt: '2026-08-29T16:30:00Z',
    checkSource: 'KUBE_APISERVER_PROBE',
    sourceStatus: 'PENDING_TELEMETRY_PIPELINE',
    metadata: { note: 'Live Telemetry — Live Telemetry' }
  },
  {
    id: 'd1a22222-2222-4222-8222-222222222222',
    resourceType: 'DATABASE',
    resourceReference: 'db-pg-prod-primary',
    environment: 'PRODUCTION',
    healthStatus: 'HEALTHY',
    availabilityStatus: 'Sample health state (Preview)',
    cpuUtilizationReference: '24% (Simulated)',
    memoryUtilizationReference: '44% (Simulated)',
    latencyReference: '2.1ms',
    errorRateReference: '0.00%',
    checkedAt: '2026-08-29T16:30:00Z',
    checkSource: 'POSTGRES_HEARTBEAT_PROBE',
    sourceStatus: 'PENDING_TELEMETRY_PIPELINE',
    metadata: { note: 'Live Telemetry — Live Telemetry' }
  }
];

export const MOCK_INFRA_ALERTS: InfrastructureAlertDto[] = [
  {
    id: 'd2a11111-1111-4111-8111-111111111111',
    alertCode: 'alt-infra-001',
    resourceType: 'DATABASE_POOL',
    resourceReference: 'pool-pg-prod-primary',
    severity: 'MEDIUM',
    alertType: 'CONNECTION_SURGE_WARNING',
    title: 'PostgreSQL connection pool utilization exceeded 70% threshold',
    description: 'Temporary connection burst detected during batch indexing execution. Pool automatically handled queues without error.',
    status: 'RESOLVED',
    detectedAt: '2026-08-28T14:12:00Z',
    acknowledgedAt: '2026-08-28T14:15:00Z',
    resolvedAt: '2026-08-28T14:30:00Z',
    assignedToEmail: 'database.admin@docsearch.internal',
    resolutionNotes: 'Peak workload cleared normally. PgBouncer pool connections stabilized below 40%.',
    metadata: { triggerThreshold: 70, peakObserved: 74 }
  }
];

export const MOCK_INFRA_INCIDENTS: InfrastructureIncidentDto[] = [
  {
    id: 'd3a11111-1111-4111-8111-111111111111',
    incidentCode: 'inc-infra-001',
    category: 'REPLICATION_FAILURE',
    severity: 'HIGH',
    title: 'Cross-region DR replication lag spike during simulated drill',
    description: 'During scheduled disaster recovery simulation, replication link lag exceeded 15s before catching up.',
    source: 'DR_MONITORING_DAEMON',
    environment: 'PRODUCTION',
    resourceReference: 'repl-useast1-to-uswest2',
    status: 'RESOLVED',
    assignedToEmail: 'sre.lead@docsearch.internal',
    detectedAt: '2026-08-20T03:15:00Z',
    acknowledgedAt: '2026-08-20T03:18:00Z',
    containedAt: '2026-08-20T03:25:00Z',
    resolvedAt: '2026-08-20T03:40:00Z',
    resolutionNotes: 'Adjusted WAL buffer pipeline concurrency in us-west-2 replica. Replication lag normalized to <500ms.',
    metadata: { postMortemReference: 'pm-infra-2026-08-20-repl' },
    createdAt: '2026-08-20T03:15:00Z',
    updatedAt: '2026-08-20T03:40:00Z'
  }
];

export const MOCK_BACKUP_RECORDS: BackupRecordDto[] = [
  {
    id: 'd4a11111-1111-4111-8111-111111111111',
    backupCode: 'bk-pg-20260829-0200',
    policyId: 'c6a11111-1111-4111-8111-111111111111',
    policyName: 'Production PostgreSQL Continuous WAL & Daily Snapshots',
    resourceReference: 'db-pg-prod-primary',
    environment: 'PRODUCTION',
    backupType: 'FULL',
    status: 'SUCCEEDED',
    startedAt: '2026-08-29T02:00:00Z',
    completedAt: '2026-08-29T02:14:22Z',
    sizeReference: '48.4 GB',
    storageReference: 's3://docsearch-immutable-backups/prod/pg-20260829-0200.tar.zst',
    checksumReference: 'sha256:7f8a9b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    retentionUntil: '2026-09-28T02:00:00Z',
    verificationStatus: 'VERIFIED',
    metadata: { crossRegionSynced: true, replicaStorageReference: 's3://docsearch-dr-backups-uswest2/prod/...' }
  }
];

export const MOCK_RESTORE_VERIFICATIONS: RestoreVerificationDto[] = [
  {
    id: 'd5a11111-1111-4111-8111-111111111111',
    verificationCode: 'verif-bk-20260829-01',
    backupId: 'd4a11111-1111-4111-8111-111111111111',
    backupCode: 'bk-pg-20260829-0200',
    targetEnvironment: 'DISASTER_RECOVERY',
    verificationType: 'AUTOMATED',
    status: 'PASSED',
    startedAt: '2026-08-29T02:20:00Z',
    completedAt: '2026-08-29T02:35:10Z',
    verifiedByEmail: 'dr.automation@docsearch.internal',
    evidenceReference: 'ev-restore-audit-20260829-01',
    notes: 'Automated test container spinup and database integrity check passed with 0 table checksum discrepancies.',
    metadata: { tablesValidatedCount: 116, checksumResult: 'MATCH_100_PERCENT' }
  }
];

export const MOCK_DR_PLANS: DisasterRecoveryPlanDto[] = [
  {
    id: 'd6a11111-1111-4111-8111-111111111111',
    planCode: 'dr-plan-tier1-full',
    planName: 'Doc Search Tier-1 Multi-Region Full Disaster Recovery Plan',
    scope: 'Production Ingress Gateway, Company Web Platform, PostgreSQL Master, and Redis Clusters',
    primaryRegionId: 'c1a11111-1111-4111-8111-111111111111',
    primaryRegionCode: 'reg-us-east-1',
    drRegionId: 'c1a22222-2222-4222-8222-222222222222',
    drRegionCode: 'reg-us-west-2',
    rtoMinutes: 15,
    rpoMinutes: 5,
    failoverStrategy: 'SEMI_AUTOMATED',
    runbookReference: 'runbook://dr/tier1-regional-failover-v2.3.md',
    lastReviewedAt: '2026-08-01T00:00:00Z',
    nextReviewDue: '2026-11-01T00:00:00Z',
    status: 'ACTIVE',
    ownerEmail: 'sre.lead@docsearch.internal',
    metadata: { dnsFailoverRoute53: true, healthCheckThreshold: 3 }
  }
];

export const MOCK_DR_DRILLS: DisasterRecoveryDrillDto[] = [
  {
    id: 'd7a11111-1111-4111-8111-111111111111',
    drillCode: 'drill-2026-q3-sim',
    planId: 'd6a11111-1111-4111-8111-111111111111',
    planName: 'Doc Search Tier-1 Multi-Region Full Disaster Recovery Plan',
    drillType: 'FAILOVER_SIMULATION',
    scheduledAt: '2026-08-20T03:00:00Z',
    startedAt: '2026-08-20T03:00:00Z',
    completedAt: '2026-08-20T03:42:00Z',
    status: 'COMPLETED',
    expectedRtoMinutes: 15,
    actualRtoMinutesReference: '11m 45s (Simulated)',
    expectedRpoMinutes: 5,
    actualRpoReference: '42s (Simulated)',
    result: 'PASSED',
    findingsReference: 'Minor DNS TTL propagation delay identified; adjusted Route 53 TTL to 60s.',
    evidenceReference: 'ev-dr-drill-q3-2026.pdf',
    conductedByEmail: 'sre.lead@docsearch.internal',
    metadata: { simulationScore: '100%' }
  }
];

export const MOCK_FAILOVER_EVENTS: FailoverEventDto[] = [
  {
    id: 'd8a11111-1111-4111-8111-111111111111',
    failoverCode: 'fo-2026-q3-drill',
    planId: 'd6a11111-1111-4111-8111-111111111111',
    planName: 'Doc Search Tier-1 Multi-Region Full Disaster Recovery Plan',
    sourceRegionId: 'c1a11111-1111-4111-8111-111111111111',
    sourceRegionCode: 'reg-us-east-1',
    targetRegionId: 'c1a22222-2222-4222-8222-222222222222',
    targetRegionCode: 'reg-us-west-2',
    environment: 'PRODUCTION',
    triggerType: 'DRILL',
    status: 'COMPLETED',
    startedAt: '2026-08-20T03:05:00Z',
    completedAt: '2026-08-20T03:38:00Z',
    initiatedByEmail: 'sre.lead@docsearch.internal',
    rollbackReference: 'rb-2026-q3-drill-complete',
    reason: 'Q3 Scheduled DR Simulation Drill across US-East-1 to US-West-2',
    metadata: { simulationMode: true, trafficDivertedPercent: 10 }
  }
];

export const MOCK_INFRA_AUDIT_TRACES: InfrastructureAuditTraceDto[] = [
  {
    id: 'd9a11111-1111-4111-8111-111111111111',
    traceId: 'tr-infra-801',
    actorEmail: 'sre.lead@docsearch.internal',
    action: 'DISASTER_RECOVERY_DRILL_EXECUTED',
    resourceReference: 'dr-plan-tier1-full',
    environment: 'PRODUCTION',
    operationStatus: 'SUCCESS',
    occurredAt: '2026-08-20T03:42:00Z',
    correlationReference: 'corr-dr-drill-2026-q3',
    evidenceReference: 'ev-dr-drill-q3-2026.pdf',
    reason: 'Quarterly compliance Disaster Recovery simulation execution and verification',
    metadata: { rtoMeasured: '11m 45s', rpoMeasured: '42s' }
  },
  {
    id: 'd9a22222-2222-4222-8222-222222222222',
    actorEmail: 'database.admin@docsearch.internal',
    action: 'BACKUP_VERIFICATION_AUTOMATED',
    resourceReference: 'bk-pg-20260829-0200',
    environment: 'PRODUCTION',
    operationStatus: 'SUCCESS',
    occurredAt: '2026-08-29T02:35:10Z',
    traceId: 'tr-infra-802',
    correlationReference: 'corr-bk-verif-20260829',
    evidenceReference: 'ev-restore-audit-20260829-01',
    reason: 'Nightly automated backup integrity test and checksum verification',
    metadata: { tablesValidated: 116 }
  }
];

export const MOCK_INFRA_OVERVIEW: InfrastructureOverviewDto = {
  totalRegionsCount: MOCK_INFRA_REGIONS.length,
  totalClustersCount: MOCK_INFRA_CLUSTERS.length,
  totalNodesCount: MOCK_INFRA_NODES.length,
  totalServicesCount: MOCK_INFRA_SERVICES.length,
  totalDatabasesCount: MOCK_INFRA_DATABASES.length,
  activeAlertsCount: MOCK_INFRA_ALERTS.filter((a) => a.status === 'OPEN').length,
  openIncidentsCount: MOCK_INFRA_INCIDENTS.filter((i) => i.status === 'OPEN').length,
  backupPoliciesCount: MOCK_BACKUP_POLICIES.length,
  activeDrPlansCount: MOCK_DR_PLANS.filter((p) => p.status === 'ACTIVE').length,
  telemetryStatus: 'Live Telemetry (Live Telemetry)'
};
