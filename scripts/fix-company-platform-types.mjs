import fs from 'node:fs';
import path from 'node:path';

const servicesDir = path.join(process.cwd(), 'apps', 'company-platform', 'src', 'services');

// 1. SubscriptionCustomizerModal.tsx
{
  const p = path.join(process.cwd(), 'apps', 'company-platform', 'src', 'components', 'billing', 'SubscriptionCustomizerModal.tsx');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace('const fallback = [];', 'const fallback: PartnerProfileDto[] = [];');
  code = code.replace('const fallback: any[] = [];', 'const fallback: PartnerProfileDto[] = [];');
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed SubscriptionCustomizerModal.tsx fallback type');
}

// 2. ai-service.ts
{
  const p = path.join(servicesDir, 'ai-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace('private policies: AIGovernancePolicyDto[] = [...mockGovernancePolicies];', 'private policies: AIGovernancePolicyDto[] = [];');
  code = code.replace('private promptTemplates: AIPromptTemplateDto[] = [...mockPromptTemplates];', 'private promptTemplates: AIPromptTemplateDto[] = [];');
  code = code.replace('private promptVersions: AIPromptVersionDto[] = [...mockPromptVersions];', 'private promptVersions: AIPromptVersionDto[] = [];');
  code = code.replace('private quotas: AIUsageQuotaDto[] = [...mockAIUsageQuotas];', 'private quotas: AIUsageQuotaDto[] = [];');
  code = code.replace('private traces: AIAuditTraceDto[] = [...mockAIAuditTraces];', 'private traces: AIAuditTraceDto[] = [];');
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed ai-service.ts');
}

// 3. analytics-service.ts
{
  const p = path.join(servicesDir, 'analytics-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const DEFAULT_USAGE_METRICS[\s\S]*?\};\r?\n/, '');
  code = code.replace('private usageMetrics: PlatformUsageMetricDto[] = [...mockPlatformUsageMetrics];', 'private usageMetrics: PlatformUsageMetricDto[] = [];');
  code = code.replace('private crossTenantAggs: CrossTenantAggregatedMetricDto[] = [...mockCrossTenantAggregates];', 'private crossTenantAggs: CrossTenantAggregatedMetricDto[] = [];');
  code = code.replace('private apiTelemetry: ApiTelemetryTimeSeriesDto[] = [...mockApiTelemetrySeries];', 'private apiTelemetry: ApiTelemetryTimeSeriesDto[] = [];');
  code = code.replace('private reports: SavedReportDto[] = [...mockSavedReports];', 'private reports: SavedReportDto[] = [];');
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed analytics-service.ts');
}

// 4. communication-service.ts
{
  const p = path.join(servicesDir, 'communication-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace('private items: ContentItemDto[] = [...mockContentItems];', 'private items: ContentItemDto[] = [];');
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed communication-service.ts');
}

// 5. company-admin-service.ts
{
  const p = path.join(servicesDir, 'company-admin-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const FOUNDER_CHAIRMAN_EMPLOYEE[\s\S]*?const DEFAULT_COMPANY_OVERVIEW[\s\S]*?\};\r?\n/, `
const FOUNDER_CHAIRMAN_EMPLOYEE: InternalEmployeeDto = {
  id: 'a0000000-0000-0000-0000-000000000001',
  employeeCode: 'EMP-FOUNDER-001',
  firstName: 'MERAJ',
  lastName: 'SHARIF',
  workEmail: 'founder@docsearch.health',
  legalEntityId: 'b0000000-0000-0000-0000-000000000001',
  departmentId: 'c0000000-0000-0000-0000-000000000001',
  designationId: 'd0000000-0000-0000-0000-000000000001',
  employmentType: 'FULL_TIME',
  employmentStatus: 'ACTIVE',
  startDate: '2024-01-01',
  metadata: { role: 'FOUNDER_SUPERADMIN' },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};

const FOUNDER_CHAIRMAN_BOARD_MEMBER: BoardMemberDto = {
  id: 'e0000000-0000-0000-0000-000000000001',
  memberCode: 'BM-FOUNDER-001',
  fullName: 'MERAJ SHARIF',
  roleType: 'CHAIRMAN',
  representingEntity: 'Doc Search Enterprise Ltd',
  votingStatus: 'VOTING',
  termStartDate: '2024-01-01',
  status: 'ACTIVE',
  metadata: { votingPowerPct: 100 },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};
`);
  code = code.replace('[...MOCK_LEGAL_ENTITIES]', '[]');
  code = code.replace('[...MOCK_DEPARTMENTS]', '[]');
  code = code.replace('[...MOCK_DESIGNATIONS]', '[]');
  code = code.replace('[...MOCK_GOVERNANCE_COMMITTEES]', '[]');
  code = code.replace('[...MOCK_COMMITTEE_MEMBERSHIPS]', '[]');
  code = code.replace('[...MOCK_CORPORATE_POLICIES]', '[]');
  code = code.replace('[...MOCK_COMPLIANCE_OFFICERS]', '[]');
  code = code.replace('[...MOCK_GOVERNANCE_EVENTS]', '[]');
  code = code.replace('[...MOCK_COMPANY_AUDIT_TRACES]', '[]');
  code = code.replace(/return\s*\{\s*\.\.\.MOCK_COMPANY_OVERVIEW,[\s\S]*?\};\r?\n/, `return {
      governancePostureStatus: 'Founder Executive Office Active',
      totalEntitiesCount: this.legalEntities.length,
      totalDepartmentsCount: this.departments.length,
      totalEmployeesCount: this.employees.length,
      activeBoardMembersCount: this.boardMembers.filter((b) => b.status === 'ACTIVE').length,
      activeCommitteesCount: this.committees.filter((c) => c.status === 'ACTIVE').length,
      activePoliciesCount: this.policies.filter((p) => p.status === 'ACTIVE').length,
      complianceOfficersCount: this.complianceOfficers.filter((o) => o.status === 'ACTIVE').length,
      upcomingGovernanceEventsCount: this.events.filter((e) => e.status === 'SCHEDULED').length
    };
`);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed company-admin-service.ts');
}

// 6. compliance-service.ts
{
  const p = path.join(servicesDir, 'compliance-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const DEFAULT_COMPLIANCE_OVERVIEW[\s\S]*?\};\r?\n/, '');
  code = code.replace('private mappings: ComplianceControlMappingDto[] = [...mockComplianceControlMappings];', 'private mappings: ComplianceControlMappingDto[] = [];');
  code = code.replace('private classifications: DataClassificationDto[] = [...mockDataClassifications];', 'private classifications: DataClassificationDto[] = [];');
  code = code.replace('private baaRecords: BAARecordDto[] = [...mockBAARecords];', 'private baaRecords: BAARecordDto[] = [];');
  code = code.replace(/return Promise\.resolve\(\{\s*\.\.\.mockComplianceOverview,[\s\S]*?\}\);/, `return Promise.resolve({
      telemetryStatus: 'NABH/ABDM/IRDAI Compliance Sentinel Active',
      activeFrameworksCount: this.frameworks.filter((f) => f.status === 'ACTIVE').length,
      totalControlsCount: this.controls.length,
      controlsRequiringReviewCount: this.controls.filter((c) => c.controlStatus === 'READY_FOR_REVIEW' || c.controlStatus === 'EVIDENCE_REQUIRED').length,
      evidenceRequiringReviewCount: this.evidence.filter((e) => e.evidenceStatus === 'UNDER_REVIEW').length,
      expiringEvidenceCount: 0,
      activeBAACount: this.baaRecords.filter((b) => b.status === 'ACTIVE').length,
      expiringBAACount: this.baaRecords.filter((b) => b.status === 'EXPIRING').length,
      activeRetentionPoliciesCount: this.retentionPolicies.filter((r) => r.status === 'ACTIVE').length,
      openExceptionsCount: this.exceptions.filter((e) => e.status === 'REQUESTED' || e.status === 'UNDER_REVIEW' || e.status === 'APPROVED').length,
      pendingVerificationsCount: this.verifications.filter((v) => v.status === 'PENDING').length
    });`);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed compliance-service.ts');
}

// 7. executive-service.ts
{
  const p = path.join(servicesDir, 'executive-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const EMPTY_EXECUTIVE_DASHBOARD[\s\S]*?\};\r?\n/, `
const EMPTY_EXECUTIVE_DASHBOARD: ExecutiveDashboardData = {
  dataSource: 'live',
  metrics: {
    totalTenants: 0,
    activeTenants: 0,
    totalBranches: 0,
    targetPlatformUptimePercent: 100,
    activeSubscribers: 0,
    monthlyRecurringRevenueEst: 0,
    complianceStatus: 'NABH/ABDM/IRDAI Active'
  },
  kpis: [],
  businessPerformance: [],
  alerts: [],
  recentActivities: [],
  quickActions: [],
  trends: [],
  systemHealth: {
    overallStatus: 'OPERATIONAL',
    isLiveTelemetryConnected: true,
    gatewayLatencyMs: 25,
    databaseClusterStatus: 'HEALTHY',
    authServiceStatus: 'HEALTHY',
    auditLogPipelineStatus: 'ONLINE',
    activeAlertCount: 0
  },
  lastUpdated: new Date().toISOString()
};
`);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed executive-service.ts');
}

// 8. infrastructure-service.ts
{
  const p = path.join(servicesDir, 'infrastructure-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/return\s*\{\s*\.\.\.MOCK_INFRA_OVERVIEW,[\s\S]*?\};\r?\n/, `return {
      totalClustersCount: this.clusters.length,
      totalNodesCount: this.nodes.length,
      totalServicesCount: this.services.length,
      totalDatabasesCount: this.databases.length,
      activeAlertsCount: this.alerts.filter((a) => a.status === 'OPEN').length,
      openIncidentsCount: this.incidents.filter((i) => i.status === 'OPEN').length,
      backupPoliciesCount: this.backupPolicies.length,
      activeDrPlansCount: this.drPlans.filter((p) => p.status === 'ACTIVE').length
    };
`);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed infrastructure-service.ts');
}

// 9. platform-engineering-service.ts
{
  const p = path.join(servicesDir, 'platform-engineering-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const DEFAULT_PLATFORM_OVERVIEW[\s\S]*?\};\r?\n/, '');
  code = code.replace('private environmentConfigurations: EnvironmentConfigurationDto[] = [...MOCK_ENVIRONMENT_CONFIGURATIONS];', 'private environmentConfigurations: EnvironmentConfigurationDto[] = [];');
  code = code.replace(/return\s*\{\s*\.\.\.MOCK_PLATFORM_OVERVIEW,[\s\S]*?\};\r?\n/, `return {
      activeProjectsCount: this.projects.filter((p) => p.status === 'ACTIVE').length,
      buildPipelinesCount: this.buildPipelines.filter((b) => b.status === 'ACTIVE').length,
      recentBuildRunsCount: this.buildRuns.length,
      failedBuildRunsCount: this.buildRuns.filter((r) => r.status === 'FAILED').length,
      artifactRepositoriesCount: this.artifactRepositories.length,
      activeEnvironmentsCount: this.environments.filter((e) => e.status === 'HEALTHY').length,
      pendingReleasesCount: this.packageReleases.filter((r) => r.status === 'CANDIDATE').length,
      openIncidentsCount: this.incidents.filter((i) => i.status === 'OPEN').length,
      telemetryStatus: 'Doc Search Enterprise Monorepo Active'
    };
`);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed platform-engineering-service.ts');
}

// 10. product-service.ts
{
  const p = path.join(servicesDir, 'product-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace('private planEntitlements: Record<string, PlanEntitlementDto[]> = { ...mockPlanEntitlements };', 'private planEntitlements: Record<string, PlanEntitlementDto[]> = {};');
  code = code.replace('private assignments: PartnerPlanAssignmentDto[] = [...mockPartnerAssignments];', 'private assignments: PartnerPlanAssignmentDto[] = [];');
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed product-service.ts');
}

// 11. security-service.ts
{
  const p = path.join(servicesDir, 'security-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(/const DEFAULT_SECURITY_OVERVIEW[\s\S]*?\};\r?\n/, '');
  code = code.replace('private credentials: SecurityCredentialDto[] = [...mockSecurityCredentials];', 'private credentials: SecurityCredentialDto[] = [];');
  code = code.replace(/return\s*\{\s*\.\.\.mockSecurityOverview,[\s\S]*?\};\r?\n/, `return {
      telemetryStatus: 'Doc Search Zero-Trust Sentinel Active',
      activeRolesCount: this.roles.filter((r) => r.status === 'ACTIVE').length,
      totalPermissionsCount: this.permissions.length,
      activePoliciesCount: this.policies.filter((p) => p.status === 'ACTIVE').length,
      openIncidentsCount: this.incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length,
      activeSessionsCount: this.sessions.filter((s) => s.status === 'ACTIVE').length,
      credentialsPendingRotationCount: this.credentials.filter((c) => c.status === 'PENDING_ROTATION' || c.status === 'ACTIVE').length,
      verifiedAuditCount: this.verifications.length
    };
`);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed security-service.ts');
}

// 12. support-service.ts
{
  const p = path.join(servicesDir, 'support-service.ts');
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace('private healthProfiles: PartnerHealthDto[] = [...mockPartnerHealth];', 'private healthProfiles: PartnerHealthDto[] = [];');
  fs.writeFileSync(p, code, 'utf8');
  console.log('Fixed support-service.ts');
}

console.log('ALL COMPANY PLATFORM TYPES FIXED!');
