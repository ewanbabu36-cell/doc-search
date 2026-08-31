# DOC SEARCH — Company Platform Data Source Matrix

| UI Metric / Field | API Endpoint | Service Method | Repository Query | PostgreSQL Table / Aggregation |
|---|---|---|---|---|
| Total Hospital Partners | `GET /api/v1/company/executive/overview` | `executiveService.getOverview` | `executiveRepository.getExecutiveSummary` | `count() FROM company.partner_profiles` |
| Active Subscriptions | `GET /api/v1/company/executive/overview` | `executiveService.getOverview` | `executiveRepository.getExecutiveSummary` | `count() FROM company.subscriptions` |
| Active User Sessions | `GET /api/v1/company/executive/overview` | `executiveService.getOverview` | `executiveRepository.getExecutiveSummary` | `count() FROM core.sessions` |
| Tamper-Evident Audit Count | `GET /api/v1/company/executive/overview` | `executiveService.getOverview` | `executiveRepository.getExecutiveSummary` | `count() FROM core.audit_events` |
| Partner Profile List | `GET /api/v1/company/partners` | `partnerService.getPartners` | `partnerRepository.findMany` | `SELECT FROM company.partner_profiles` |
| Product Catalog List | `GET /api/v1/company/products` | `productService.getProducts` | `productRepository.findMany` | `SELECT FROM company.products` |
| Subscription List | `GET /api/v1/company/subscriptions` | `subscriptionService.getSubscriptions` | `subscriptionRepository.findMany` | `SELECT FROM company.subscriptions` |
| Sales Pipeline Leads | `GET /api/v1/company/sales/leads` | `salesMarketingService.getLeads` | `salesMarketingRepository.getLeads` | `SELECT FROM company.sales_leads` |
| Marketing Campaigns | `GET /api/v1/company/marketing/campaigns` | `salesMarketingService.getCampaigns` | `salesMarketingRepository.getCampaigns` | `SELECT FROM company.marketing_campaigns` |
| Customer Support Tickets | `GET /api/v1/company/support/tickets` | `supportService.getTickets` | `supportRepository.getTickets` | `SELECT FROM company.support_tickets` |
| Announcements & Banners | `GET /api/v1/company/communication/content` | `communicationService.getContentItems` | `communicationRepository.getContentItems` | `SELECT FROM company.content_items` |
| Platform BI Reports | `GET /api/v1/company/analytics/reports` | `analyticsService.getReports` | `analyticsRepository.getReports` | `SELECT FROM company.analytics_reports` |
| Governed AI Models | `GET /api/v1/company/ai/models` | `aiGovernanceService.getModels` | `aiGovernanceRepository.getModels` | `SELECT FROM company.ai_models` |
| System Security Roles | `GET /api/v1/company/security/roles` | `securityAdminService.getRoles` | `securityAdminRepository.getRoles` | `SELECT FROM company.security_roles` |
| HIPAA / SOC2 Frameworks | `GET /api/v1/company/compliance/frameworks` | `complianceService.getFrameworks` | `complianceRepository.getFrameworks` | `SELECT FROM company.compliance_frameworks` |
| HL7 / FHIR Gateway Providers | `GET /api/v1/company/integration/providers` | `integrationService.getProviders` | `integrationRepository.getProviders` | `SELECT FROM company.integration_providers` |
| Monorepo Platform Projects | `GET /api/v1/company/platform/projects` | `platformEngineeringService.getProjects` | `platformEngineeringRepository.getProjects` | `SELECT FROM company.platform_projects` |
| High Availability Clusters | `GET /api/v1/company/infrastructure/clusters` | `infrastructureService.getClusters` | `infrastructureRepository.getClusters` | `SELECT FROM company.infrastructure_clusters` |
| Legal Corporate Entities | `GET /api/v1/company/admin/legal-entities` | `companyAdminService.getLegalEntities` | `companyAdminRepository.getLegalEntities` | `SELECT FROM company.legal_entities` |
