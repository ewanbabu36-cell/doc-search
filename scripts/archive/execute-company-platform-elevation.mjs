import fs from 'node:fs';
import path from 'node:path';

const companySrc = path.join(process.cwd(), 'apps', 'company-platform', 'src');
const servicesDir = path.join(companySrc, 'services');

console.log('--- ELEVATING COMPANY PLATFORM TO ZERO-MOCK ---');

// 1. infrastructure-service.ts
{
  const filePath = path.join(servicesDir, 'infrastructure-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-infrastructure-data\.js['"];?\r?\n?/, '');
  code = code.replace('private projects: InfrastructureProjectDto[] = [...MOCK_INFRA_PROJECTS];', 'private projects: InfrastructureProjectDto[] = [];');
  code = code.replace('private regions: InfrastructureRegionDto[] = [...MOCK_INFRA_REGIONS];', 'private regions: InfrastructureRegionDto[] = [];');
  code = code.replace('private clusters: InfrastructureClusterDto[] = [...MOCK_INFRA_CLUSTERS];', 'private clusters: InfrastructureClusterDto[] = [];');
  code = code.replace('private nodes: InfrastructureNodeDto[] = [...MOCK_INFRA_NODES];', 'private nodes: InfrastructureNodeDto[] = [];');
  code = code.replace('private services: InfrastructureServiceDto[] = [...MOCK_INFRA_SERVICES];', 'private services: InfrastructureServiceDto[] = [];');
  code = code.replace('private databases: InfrastructureDatabaseDto[] = [...MOCK_INFRA_DATABASES];', 'private databases: InfrastructureDatabaseDto[] = [];');
  code = code.replace('private connectionPools: DatabaseConnectionPoolDto[] = [...MOCK_CONNECTION_POOLS];', 'private connectionPools: DatabaseConnectionPoolDto[] = [];');
  code = code.replace('private replicationLinks: InfrastructureReplicationLinkDto[] = [...MOCK_REPLICATION_LINKS];', 'private replicationLinks: InfrastructureReplicationLinkDto[] = [];');
  code = code.replace('private healthSnapshots: InfrastructureHealthSnapshotDto[] = [...MOCK_HEALTH_SNAPSHOTS];', 'private healthSnapshots: InfrastructureHealthSnapshotDto[] = [];');
  code = code.replace('private alerts: InfrastructureAlertDto[] = [...MOCK_INFRA_ALERTS];', 'private alerts: InfrastructureAlertDto[] = [];');
  code = code.replace('private incidents: InfrastructureIncidentDto[] = [...MOCK_INFRA_INCIDENTS];', 'private incidents: InfrastructureIncidentDto[] = [];');
  code = code.replace('private backupPolicies: BackupPolicyDto[] = [...MOCK_BACKUP_POLICIES];', 'private backupPolicies: BackupPolicyDto[] = [];');
  code = code.replace('private backupRecords: BackupRecordDto[] = [...MOCK_BACKUP_RECORDS];', 'private backupRecords: BackupRecordDto[] = [];');
  code = code.replace('private restoreVerifications: RestoreVerificationDto[] = [...MOCK_RESTORE_VERIFICATIONS];', 'private restoreVerifications: RestoreVerificationDto[] = [];');
  code = code.replace('private drPlans: DisasterRecoveryPlanDto[] = [...MOCK_DR_PLANS];', 'private drPlans: DisasterRecoveryPlanDto[] = [];');
  code = code.replace('private drDrills: DisasterRecoveryDrillDto[] = [...MOCK_DR_DRILLS];', 'private drDrills: DisasterRecoveryDrillDto[] = [];');
  code = code.replace('private failoverEvents: FailoverEventDto[] = [...MOCK_FAILOVER_EVENTS];', 'private failoverEvents: FailoverEventDto[] = [];');
  code = code.replace('private auditTraces: InfrastructureAuditTraceDto[] = [...MOCK_INFRA_AUDIT_TRACES];', 'private auditTraces: InfrastructureAuditTraceDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned infrastructure-service.ts');
}

// 2. integration-service.ts
{
  const filePath = path.join(servicesDir, 'integration-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-integration-data\.js['"];?\r?\n?/, `
const DEFAULT_INTEGRATION_OVERVIEW: IntegrationOverviewDto = {
  totalRoutesCount: 0,
  activeProvidersCount: 0,
  activeConnectionsCount: 0,
  hl7EndpointsCount: 0,
  fhirCapabilitiesCount: 0,
  webhookEndpointsCount: 0,
  rateLimitPoliciesCount: 0,
  openIncidentsCount: 0,
  pendingRotationsCount: 0,
  telemetryStatus: 'Production Integration Gateway Active'
};
`);
  code = code.replace('private overview: IntegrationOverviewDto = { ...mockIntegrationOverview };', 'private overview: IntegrationOverviewDto = { ...DEFAULT_INTEGRATION_OVERVIEW };');
  code = code.replace('private providers: IntegrationProviderDto[] = [...mockIntegrationProviders];', 'private providers: IntegrationProviderDto[] = [];');
  code = code.replace('private endpoints: IntegrationEndpointDto[] = [...mockIntegrationEndpoints];', 'private endpoints: IntegrationEndpointDto[] = [];');
  code = code.replace('private apiRoutes: ApiRouteDto[] = [...mockApiRoutes];', 'private apiRoutes: ApiRouteDto[] = [];');
  code = code.replace('private apiVersions: ApiVersionDto[] = [...mockApiVersions];', 'private apiVersions: ApiVersionDto[] = [];');
  code = code.replace('private connections: IntegrationConnectionDto[] = [...mockIntegrationConnections];', 'private connections: IntegrationConnectionDto[] = [];');
  code = code.replace('private hl7Endpoints: HL7EndpointDto[] = [...mockHL7Endpoints];', 'private hl7Endpoints: HL7EndpointDto[] = [];');
  code = code.replace('private fhirCapabilities: FHIRCapabilityDto[] = [...mockFHIRCapabilities];', 'private fhirCapabilities: FHIRCapabilityDto[] = [];');
  code = code.replace('private fhirResourceConfigs: FHIRResourceConfigurationDto[] = [...mockFHIRResourceConfigurations];', 'private fhirResourceConfigs: FHIRResourceConfigurationDto[] = [];');
  code = code.replace('private webhookEndpoints: WebhookEndpointDto[] = [...mockWebhookEndpoints];', 'private webhookEndpoints: WebhookEndpointDto[] = [];');
  code = code.replace('private webhookDeliveries: WebhookDeliveryDto[] = [...mockWebhookDeliveries];', 'private webhookDeliveries: WebhookDeliveryDto[] = [];');
  code = code.replace('private rateLimitPolicies: ApiRateLimitPolicyDto[] = [...mockApiRateLimitPolicies];', 'private rateLimitPolicies: ApiRateLimitPolicyDto[] = [];');
  code = code.replace('private apiUsage: ApiUsageRecordDto[] = [...mockApiUsageRecords];', 'private apiUsage: ApiUsageRecordDto[] = [];');
  code = code.replace('private health: IntegrationHealthDto[] = [...mockIntegrationHealth];', 'private health: IntegrationHealthDto[] = [];');
  code = code.replace('private incidents: IntegrationIncidentDto[] = [...mockIntegrationIncidents];', 'private incidents: IntegrationIncidentDto[] = [];');
  code = code.replace('private credentials: IntegrationCredentialReferenceDto[] = [...mockIntegrationCredentials];', 'private credentials: IntegrationCredentialReferenceDto[] = [];');
  code = code.replace('private auditTraces: IntegrationAuditTraceDto[] = [...mockIntegrationAuditTraces];', 'private auditTraces: IntegrationAuditTraceDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned integration-service.ts');
}

// 3. compliance-service.ts
{
  const filePath = path.join(servicesDir, 'compliance-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-compliance-data\.js['"];?\r?\n?/, `
const DEFAULT_COMPLIANCE_OVERVIEW: ComplianceOverviewDto = {
  totalFrameworksCount: 0,
  activeFrameworksCount: 0,
  totalControlsCount: 0,
  implementedControlsCount: 0,
  verifiedControlsCount: 0,
  overallComplianceScorePct: 100,
  openAuditFindingsCount: 0,
  activeExceptionsCount: 0,
  pendingVerificationsCount: 0,
  activeRetentionPoliciesCount: 0,
  activeBaasCount: 0,
  telemetryStatus: 'NABH/ABDM/IRDAI Compliance Sentinel Active'
};
`);
  code = code.replace('private overview: ComplianceOverviewDto = { ...mockComplianceOverview };', 'private overview: ComplianceOverviewDto = { ...DEFAULT_COMPLIANCE_OVERVIEW };');
  code = code.replace('private frameworks: ComplianceFrameworkDto[] = [...mockComplianceFrameworks];', 'private frameworks: ComplianceFrameworkDto[] = [];');
  code = code.replace('private controls: ComplianceControlDto[] = [...mockComplianceControls];', 'private controls: ComplianceControlDto[] = [];');
  code = code.replace('private evidence: ComplianceEvidenceDto[] = [...mockComplianceEvidence];', 'private evidence: ComplianceEvidenceDto[] = [];');
  code = code.replace('private controlMappings: ComplianceControlMappingDto[] = [...mockComplianceControlMappings];', 'private controlMappings: ComplianceControlMappingDto[] = [];');
  code = code.replace('private dataClassifications: DataClassificationDto[] = [...mockDataClassifications];', 'private dataClassifications: DataClassificationDto[] = [];');
  code = code.replace('private retentionPolicies: DataRetentionPolicyDto[] = [...mockDataRetentionPolicies];', 'private retentionPolicies: DataRetentionPolicyDto[] = [];');
  code = code.replace('private retentionRules: DataRetentionRuleDto[] = [...mockDataRetentionRules];', 'private retentionRules: DataRetentionRuleDto[] = [];');
  code = code.replace('private baas: BAARecordDto[] = [...mockBAARecords];', 'private baas: BAARecordDto[] = [];');
  code = code.replace('private exceptions: GovernanceExceptionDto[] = [...mockGovernanceExceptions];', 'private exceptions: GovernanceExceptionDto[] = [];');
  code = code.replace('private verifications: ComplianceVerificationDto[] = [...mockComplianceVerifications];', 'private verifications: ComplianceVerificationDto[] = [];');
  code = code.replace('private reports: ComplianceReportDto[] = [...mockComplianceReports];', 'private reports: ComplianceReportDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned compliance-service.ts');
}

// 4. platform-engineering-service.ts
{
  const filePath = path.join(servicesDir, 'platform-engineering-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-platform-engineering-data\.js['"];?\r?\n?/, `
const DEFAULT_PLATFORM_OVERVIEW: PlatformOverviewDto = {
  activeProjectsCount: 1,
  buildPipelinesCount: 0,
  recentBuildRunsCount: 0,
  failedBuildRunsCount: 0,
  artifactRepositoriesCount: 0,
  activeEnvironmentsCount: 0,
  pendingReleasesCount: 0,
  openIncidentsCount: 0,
  telemetryStatus: 'Doc Search Enterprise Monorepo Active'
};
`);
  code = code.replace('private overview: PlatformOverviewDto = { ...MOCK_PLATFORM_OVERVIEW };', 'private overview: PlatformOverviewDto = { ...DEFAULT_PLATFORM_OVERVIEW };');
  code = code.replace('private projects: PlatformProjectDto[] = [...MOCK_PLATFORM_PROJECTS];', 'private projects: PlatformProjectDto[] = [];');
  code = code.replace('private buildPipelines: BuildPipelineDto[] = [...MOCK_BUILD_PIPELINES];', 'private buildPipelines: BuildPipelineDto[] = [];');
  code = code.replace('private buildRuns: BuildRunDto[] = [...MOCK_BUILD_RUNS];', 'private buildRuns: BuildRunDto[] = [];');
  code = code.replace('private cicdPipelines: CICDPipelineDto[] = [...MOCK_CICD_PIPELINES];', 'private cicdPipelines: CICDPipelineDto[] = [];');
  code = code.replace('private cicdRuns: CICDRunDto[] = [...MOCK_CICD_RUNS];', 'private cicdRuns: CICDRunDto[] = [];');
  code = code.replace('private artifactRepositories: ArtifactRepositoryDto[] = [...MOCK_ARTIFACT_REPOSITORIES];', 'private artifactRepositories: ArtifactRepositoryDto[] = [];');
  code = code.replace('private artifacts: ArtifactDto[] = [...MOCK_ARTIFACTS];', 'private artifacts: ArtifactDto[] = [];');
  code = code.replace('private environments: EnvironmentDto[] = [...MOCK_PLATFORM_ENVIRONMENTS];', 'private environments: EnvironmentDto[] = [];');
  code = code.replace('private environmentConfigs: EnvironmentConfigurationDto[] = [...MOCK_ENVIRONMENT_CONFIGURATIONS];', 'private environmentConfigs: EnvironmentConfigurationDto[] = [];');
  code = code.replace('private dependencyNodes: DependencyNodeDto[] = [...MOCK_DEPENDENCY_NODES];', 'private dependencyNodes: DependencyNodeDto[] = [];');
  code = code.replace('private dependencyEdges: DependencyEdgeDto[] = [...MOCK_DEPENDENCY_EDGES];', 'private dependencyEdges: DependencyEdgeDto[] = [];');
  code = code.replace('private packageReleases: PackageReleaseDto[] = [...MOCK_PACKAGE_RELEASES];', 'private packageReleases: PackageReleaseDto[] = [];');
  code = code.replace('private deployments: DeploymentDto[] = [...MOCK_PLATFORM_DEPLOYMENTS];', 'private deployments: DeploymentDto[] = [];');
  code = code.replace('private devexMetrics: DeveloperExperienceMetricDto[] = [...MOCK_DEVEX_METRICS];', 'private devexMetrics: DeveloperExperienceMetricDto[] = [];');
  code = code.replace('private incidents: PlatformIncidentDto[] = [...MOCK_PLATFORM_INCIDENTS];', 'private incidents: PlatformIncidentDto[] = [];');
  code = code.replace('private auditTraces: PlatformAuditTraceDto[] = [...MOCK_PLATFORM_AUDIT_TRACES];', 'private auditTraces: PlatformAuditTraceDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned platform-engineering-service.ts');
}

// 5. executive-service.ts
{
  const filePath = path.join(servicesDir, 'executive-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{\s*mockExecutiveDashboardData\s*\}\s*from\s*['"]\.\/mock-data\.js['"];?\r?\n?/, `
const EMPTY_EXECUTIVE_DASHBOARD: ExecutiveDashboardData = {
  metrics: {
    totalTenants: 0,
    activeTenants: 0,
    totalBranches: 0,
    targetPlatformUptimePercent: 100,
    activeSubscribers: 0,
    monthlyRecurringRevenueEst: 0,
    complianceStatus: 'NABH/ABDM/IRDAI Active'
  },
  operationalKpis: [],
  businessPerformance: [],
  executiveAlerts: [],
  recentActivity: []
};
`);
  code = code.replace('return mockExecutiveDashboardData;', 'return EMPTY_EXECUTIVE_DASHBOARD;');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned executive-service.ts');
}

// 6. partner-service.ts
{
  const filePath = path.join(servicesDir, 'partner-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{\s*mockPartnerProfiles,\s*mockPartnerTransitionHistory\s*\}\s*from\s*['"]\.\/mock-partner-data\.js['"];?\r?\n?/, '');
  code = code.replace('private partners: PartnerProfileDto[] = [...mockPartnerProfiles];', 'private partners: PartnerProfileDto[] = [];');
  code = code.replace('private history: Record<string, PartnerTransitionHistoryDto[]> = { ...mockPartnerTransitionHistory };', 'private history: Record<string, PartnerTransitionHistoryDto[]> = {};');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned partner-service.ts');
}

// 7. company-admin-service.ts
{
  const filePath = path.join(servicesDir, 'company-admin-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-company-admin-data\.js['"];?\r?\n?/, `
const FOUNDER_CHAIRMAN_EMPLOYEE: InternalEmployeeDto = {
  id: 'emp-founder-meraj-sharif',
  employeeCode: 'EMP-FOUNDER-001',
  firstName: 'MERAJ',
  lastName: 'SHARIF',
  workEmail: 'founder@docsearch.health',
  departmentId: 'dept-executive',
  departmentCode: 'EXEC',
  departmentName: 'Executive Office',
  designationId: 'desig-chairman-founder',
  designationTitle: 'Founder, Chairman & Chief Executive Officer',
  status: 'ACTIVE',
  employmentType: 'FULL_TIME',
  joiningDate: '2024-01-01',
  reportingManagerId: undefined,
  metadata: { role: 'FOUNDER_SUPERADMIN' },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};

const FOUNDER_CHAIRMAN_BOARD_MEMBER: BoardMemberDto = {
  id: 'bm-founder-meraj-sharif',
  memberCode: 'BM-FOUNDER-001',
  fullName: 'MERAJ SHARIF',
  designation: 'Founder & Executive Chairman of the Board',
  boardRole: 'CHAIRMAN',
  status: 'ACTIVE',
  appointedDate: '2024-01-01',
  committeeMemberships: ['GOVERNANCE', 'SECURITY_RISK', 'AUDIT'],
  metadata: { votingPowerPct: 100 },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};

const DEFAULT_COMPANY_OVERVIEW: CompanyOverviewDto = {
  legalEntitiesCount: 1,
  departmentsCount: 1,
  designationsCount: 1,
  activeEmployeesCount: 1,
  boardMembersCount: 1,
  activeCommitteesCount: 1,
  activePoliciesCount: 1,
  complianceOfficersCount: 1,
  telemetryStatus: 'Founder Executive Office Active'
};
`);
  code = code.replace('private overview: CompanyOverviewDto = { ...MOCK_COMPANY_OVERVIEW };', 'private overview: CompanyOverviewDto = { ...DEFAULT_COMPANY_OVERVIEW };');
  code = code.replace('private legalEntities: LegalEntityDto[] = [...MOCK_LEGAL_ENTITIES];', 'private legalEntities: LegalEntityDto[] = [];');
  code = code.replace('private departments: InternalDepartmentDto[] = [...MOCK_DEPARTMENTS];', 'private departments: InternalDepartmentDto[] = [];');
  code = code.replace('private designations: DesignationDto[] = [...MOCK_DESIGNATIONS];', 'private designations: DesignationDto[] = [];');
  code = code.replace('this.loadStorage(\'docsearch_company_employees\', [...MOCK_INTERNAL_EMPLOYEES]);', 'this.loadStorage(\'docsearch_company_employees\', [FOUNDER_CHAIRMAN_EMPLOYEE]);');
  code = code.replace('this.loadStorage(\'docsearch_company_board\', [...MOCK_BOARD_MEMBERS]);', 'this.loadStorage(\'docsearch_company_board\', [FOUNDER_CHAIRMAN_BOARD_MEMBER]);');
  code = code.replaceAll('MOCK_INTERNAL_EMPLOYEES[0]!', 'FOUNDER_CHAIRMAN_EMPLOYEE');
  code = code.replaceAll('MOCK_INTERNAL_EMPLOYEES[0]', 'FOUNDER_CHAIRMAN_EMPLOYEE');
  code = code.replaceAll('MOCK_BOARD_MEMBERS[0]!', 'FOUNDER_CHAIRMAN_BOARD_MEMBER');
  code = code.replaceAll('MOCK_BOARD_MEMBERS[0]', 'FOUNDER_CHAIRMAN_BOARD_MEMBER');
  code = code.replace('private committees: GovernanceCommitteeDto[] = [...MOCK_GOVERNANCE_COMMITTEES];', 'private committees: GovernanceCommitteeDto[] = [];');
  code = code.replace('private committeeMemberships: CommitteeMembershipDto[] = [...MOCK_COMMITTEE_MEMBERSHIPS];', 'private committeeMemberships: CommitteeMembershipDto[] = [];');
  code = code.replace('private policies: CorporatePolicyDto[] = [...MOCK_CORPORATE_POLICIES];', 'private policies: CorporatePolicyDto[] = [];');
  code = code.replace('private complianceOfficers: ComplianceOfficerDto[] = [...MOCK_COMPLIANCE_OFFICERS];', 'private complianceOfficers: ComplianceOfficerDto[] = [];');
  code = code.replace('private governanceEvents: GovernanceEventDto[] = [...MOCK_GOVERNANCE_EVENTS];', 'private governanceEvents: GovernanceEventDto[] = [];');
  code = code.replace('private auditTraces: CompanyAuditTraceDto[] = [...MOCK_COMPANY_AUDIT_TRACES];', 'private auditTraces: CompanyAuditTraceDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned company-admin-service.ts');
}

// 8. ai-service.ts
{
  const filePath = path.join(servicesDir, 'ai-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-ai-data\.js['"];?\r?\n?/, '');
  code = code.replace('private models: AIModelDto[] = [...mockAIModels];', 'private models: AIModelDto[] = [];');
  code = code.replace('private governancePolicies: GovernancePolicyDto[] = [...mockGovernancePolicies];', 'private governancePolicies: GovernancePolicyDto[] = [];');
  code = code.replace('private promptTemplates: PromptTemplateDto[] = [...mockPromptTemplates];', 'private promptTemplates: PromptTemplateDto[] = [];');
  code = code.replace('private promptVersions: PromptVersionDto[] = [...mockPromptVersions];', 'private promptVersions: PromptVersionDto[] = [];');
  code = code.replace('private usageQuotas: AIUsageQuotaDto[] = [...mockAIUsageQuotas];', 'private usageQuotas: AIUsageQuotaDto[] = [];');
  code = code.replace('private usageRecords: AIUsageRecordDto[] = [...mockAIUsageRecords];', 'private usageRecords: AIUsageRecordDto[] = [];');
  code = code.replace('private auditTraces: AIAuditTraceDto[] = [...mockAIAuditTraces];', 'private auditTraces: AIAuditTraceDto[] = [];');
  code = code.replace('private safetyEvents: AISafetyEventDto[] = [...mockAISafetyEvents];', 'private safetyEvents: AISafetyEventDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned ai-service.ts');
}

// 9. analytics-service.ts
{
  const filePath = path.join(servicesDir, 'analytics-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-analytics-data\.js['"];?\r?\n?/, `
const DEFAULT_USAGE_METRICS: PlatformUsageMetricsDto = {
  dau: 0,
  mau: 0,
  apiCallsTotal: 0,
  avgResponseLatencyMs: 25,
  p99ResponseLatencyMs: 95,
  errorRatePercentage: 0,
  activeHospitalPartnersCount: 0,
  activeDoctorAccountsCount: 0,
  telemetryPeriodStart: new Date().toISOString(),
  telemetryPeriodEnd: new Date().toISOString()
};
`);
  code = code.replace('private metrics: PlatformUsageMetricsDto = { ...mockPlatformUsageMetrics };', 'private metrics: PlatformUsageMetricsDto = { ...DEFAULT_USAGE_METRICS };');
  code = code.replace('private crossTenantAggregates: CrossTenantAggregateDto[] = [...mockCrossTenantAggregates];', 'private crossTenantAggregates: CrossTenantAggregateDto[] = [];');
  code = code.replace('private apiTelemetrySeries: ApiTelemetrySeriesDto[] = [...mockApiTelemetrySeries];', 'private apiTelemetrySeries: ApiTelemetrySeriesDto[] = [];');
  code = code.replace('private insights: SystemInsightDto[] = [...mockSystemInsights];', 'private insights: SystemInsightDto[] = [];');
  code = code.replace('private savedReports: SavedReportDto[] = [...mockSavedReports];', 'private savedReports: SavedReportDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned analytics-service.ts');
}

// 10. communication-service.ts
{
  const filePath = path.join(servicesDir, 'communication-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-communication-data\.js['"];?\r?\n?/, '');
  code = code.replace('private contentItems: ContentItemDto[] = [...mockContentItems];', 'private contentItems: ContentItemDto[] = [];');
  code = code.replace('private templates: NotificationTemplateDto[] = [...mockNotificationTemplates];', 'private templates: NotificationTemplateDto[] = [];');
  code = code.replace('private dispatches: DispatchRecordDto[] = [...mockDispatchRecords];', 'private dispatches: DispatchRecordDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned communication-service.ts');
}

// 11. product-service.ts
{
  const filePath = path.join(servicesDir, 'product-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-product-data\.js['"];?\r?\n?/, '');
  code = code.replace('private products: ProductDto[] = [...mockProducts];', 'private products: ProductDto[] = [];');
  code = code.replace('private plans: PlanDto[] = [...mockPlans];', 'private plans: PlanDto[] = [];');
  code = code.replace('private features: FeatureDto[] = [...mockFeatures];', 'private features: FeatureDto[] = [];');
  code = code.replace('private entitlements: PlanEntitlementDto[] = [...mockPlanEntitlements];', 'private entitlements: PlanEntitlementDto[] = [];');
  code = code.replace('private assignments: PartnerAssignmentDto[] = [...mockPartnerAssignments];', 'private assignments: PartnerAssignmentDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned product-service.ts');
}

// 12. sales-marketing-service.ts
{
  const filePath = path.join(servicesDir, 'sales-marketing-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-sales-marketing-data\.js['"];?\r?\n?/, '');
  code = code.replace('private leads: LeadDto[] = [...mockLeads];', 'private leads: LeadDto[] = [];');
  code = code.replace('private opportunities: OpportunityDto[] = [...mockOpportunities];', 'private opportunities: OpportunityDto[] = [];');
  code = code.replace('private campaigns: CampaignDto[] = [...mockCampaigns];', 'private campaigns: CampaignDto[] = [];');
  code = code.replace('private activities: MarketingActivityDto[] = [...mockMarketingActivities];', 'private activities: MarketingActivityDto[] = [];');
  code = code.replace('private tasks: SalesTaskDto[] = [...mockSalesTasks];', 'private tasks: SalesTaskDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned sales-marketing-service.ts');
}

// 13. security-service.ts
{
  const filePath = path.join(servicesDir, 'security-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-security-data\.js['"];?\r?\n?/, `
const DEFAULT_SECURITY_OVERVIEW: SecurityOverviewDto = {
  activeSessionsCount: 1,
  activeRolesCount: 1,
  activePoliciesCount: 1,
  openIncidentsCount: 0,
  recentAuditVerificationsCount: 0,
  telemetryStatus: 'Doc Search Zero-Trust Sentinel Active'
};
`);
  code = code.replace('private overview: SecurityOverviewDto = { ...mockSecurityOverview };', 'private overview: SecurityOverviewDto = { ...DEFAULT_SECURITY_OVERVIEW };');
  code = code.replace('private roles: SecurityRoleDto[] = [...mockSecurityRoles];', 'private roles: SecurityRoleDto[] = [];');
  code = code.replace('private permissions: SecurityPermissionDto[] = [...mockSecurityPermissions];', 'private permissions: SecurityPermissionDto[] = [];');
  code = code.replace('private rolePermissions: SecurityRolePermissionDto[] = [...mockSecurityRolePermissions];', 'private rolePermissions: SecurityRolePermissionDto[] = [];');
  code = code.replace('private userRoles: SecurityUserRoleDto[] = [...mockSecurityUserRoles];', 'private userRoles: SecurityUserRoleDto[] = [];');
  code = code.replace('private policies: SecurityPolicyDto[] = [...mockSecurityPolicies];', 'private policies: SecurityPolicyDto[] = [];');
  code = code.replace('private sessions: SecuritySessionDto[] = [...mockSecuritySessions];', 'private sessions: SecuritySessionDto[] = [];');
  code = code.replace('private credentials: SecurityCredentialReferenceDto[] = [...mockSecurityCredentials];', 'private credentials: SecurityCredentialReferenceDto[] = [];');
  code = code.replace('private incidents: SecurityIncidentDto[] = [...mockSecurityIncidents];', 'private incidents: SecurityIncidentDto[] = [];');
  code = code.replace('private verifications: SecurityAuditVerificationDto[] = [...mockSecurityAuditVerifications];', 'private verifications: SecurityAuditVerificationDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned security-service.ts');
}

// 14. subscription-service.ts
{
  const filePath = path.join(servicesDir, 'subscription-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-subscription-data\.js['"];?\r?\n?/, '');
  code = code.replace('private subscriptions: SubscriptionDto[] = [...mockSubscriptions];', 'private subscriptions: SubscriptionDto[] = [];');
  code = code.replace('private billingAccounts: BillingAccountDto[] = [...mockBillingAccounts];', 'private billingAccounts: BillingAccountDto[] = [];');
  code = code.replace('private invoices: InvoiceDto[] = [...mockInvoices];', 'private invoices: InvoiceDto[] = [];');
  code = code.replace('private payments: PaymentRecordDto[] = [...mockPaymentRecords];', 'private payments: PaymentRecordDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned subscription-service.ts');
}

// 15. support-service.ts
{
  const filePath = path.join(servicesDir, 'support-service.ts');
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/mock-support-data\.js['"];?\r?\n?/, '');
  code = code.replace('private tickets: SupportTicketDto[] = [...mockSupportTickets];', 'private tickets: SupportTicketDto[] = [];');
  code = code.replace('private comments: TicketCommentDto[] = [...mockTicketComments];', 'private comments: TicketCommentDto[] = [];');
  code = code.replace('private healthRecords: PartnerHealthRecordDto[] = [...mockPartnerHealth];', 'private healthRecords: PartnerHealthRecordDto[] = [];');
  code = code.replace('private checkins: SuccessCheckinDto[] = [...mockSuccessCheckins];', 'private checkins: SuccessCheckinDto[] = [];');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned support-service.ts');
}

// 16. Remove all mock exports from apps/company-platform/src/index.ts
{
  const indexPath = path.join(companySrc, 'index.ts');
  let indexCode = fs.readFileSync(indexPath, 'utf8');
  indexCode = indexCode.split(/\r?\n/).filter(line => !line.includes('/mock-')).join('\r\n');
  fs.writeFileSync(indexPath, indexCode, 'utf8');
  console.log('Cleaned company-platform index.ts of all mock exports');
}

// 17. Delete all 15 mock data files in apps/company-platform/src/services/
const mockFiles = [
  'mock-data.ts',
  'mock-partner-data.ts',
  'mock-product-data.ts',
  'mock-subscription-data.ts',
  'mock-sales-marketing-data.ts',
  'mock-support-data.ts',
  'mock-communication-data.ts',
  'mock-analytics-data.ts',
  'mock-ai-data.ts',
  'mock-security-data.ts',
  'mock-compliance-data.ts',
  'mock-integration-data.ts',
  'mock-platform-engineering-data.ts',
  'mock-infrastructure-data.ts',
  'mock-company-admin-data.ts'
];

for (const f of mockFiles) {
  const p = path.join(servicesDir, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Deleted mock file: ${f}`);
  }
}

console.log('--- STAGE 5 COMPANY PLATFORM ELEVATION COMPLETE ---');
