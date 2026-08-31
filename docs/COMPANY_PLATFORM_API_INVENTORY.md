# DOC SEARCH — Company Platform API Inventory (Wave 3)

| Domain | Method | Path | Auth | Permission | Scope | Service | Repository | DB Table | Audit | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Executive | GET | `/api/v1/company/executive/overview` | Bearer JWT | `analytics:read` | Global/Tenant | `ExecutiveService` | `ExecutiveRepository` | Multiple | Append-only | VERIFIED |
| CRM | GET | `/api/v1/company/partners` | Bearer JWT | `partners:read` | Tenant | `PartnerService` | `PartnerRepository` | `partner_profiles` | Logged | VERIFIED |
| CRM | GET | `/api/v1/company/partners/:partnerId` | Bearer JWT | `partners:read` | Tenant | `PartnerService` | `PartnerRepository` | `partner_profiles` | Logged | VERIFIED |
| CRM | POST | `/api/v1/company/partners` | Bearer JWT | `partners:create` | Tenant | `PartnerService` | `PartnerRepository` | `partner_profiles` | SHA-256 | VERIFIED |
| CRM | PATCH | `/api/v1/company/partners/:partnerId/status` | Bearer JWT | `partners:update` | Tenant | `PartnerService` | `PartnerRepository` | `partner_lifecycle_transitions` | SHA-256 | VERIFIED |
| Product | GET | `/api/v1/company/products` | Bearer JWT | None | Global | `ProductService` | `ProductRepository` | `products` | Logged | VERIFIED |
| Product | POST | `/api/v1/company/products` | Bearer JWT | `products:create` | Global | `ProductService` | `ProductRepository` | `products` | SHA-256 | VERIFIED |
| Subscription | GET | `/api/v1/company/subscriptions` | Bearer JWT | `subscriptions:read` | Tenant | `SubscriptionService` | `SubscriptionRepository` | `subscriptions` | Logged | VERIFIED |
| Sales | GET | `/api/v1/company/sales/leads` | Bearer JWT | `sales:read` | Global/Tenant | `SalesMarketingService` | `SalesMarketingRepository` | `sales_leads` | Logged | VERIFIED |
| Sales | GET | `/api/v1/company/sales/opportunities` | Bearer JWT | `sales:read` | Global/Tenant | `SalesMarketingService` | `SalesMarketingRepository` | `sales_opportunities` | Logged | VERIFIED |
| Marketing | GET | `/api/v1/company/marketing/campaigns` | Bearer JWT | `marketing:read` | Global | `SalesMarketingService` | `SalesMarketingRepository` | `marketing_campaigns` | Logged | VERIFIED |
| Support | GET | `/api/v1/company/support/tickets` | Bearer JWT | `support:read` | Tenant | `SupportService` | `SupportRepository` | `support_tickets` | Logged | VERIFIED |
| Support | GET | `/api/v1/company/support/health` | Bearer JWT | `support:read` | Tenant | `SupportService` | `SupportRepository` | `partner_health_profiles` | Logged | VERIFIED |
| Communication | GET | `/api/v1/company/communication/content` | Bearer JWT | `communication:read` | Global | `CommunicationService` | `CommunicationRepository` | `content_items` | Logged | VERIFIED |
| Communication | GET | `/api/v1/company/communication/templates` | Bearer JWT | `communication:read` | Global | `CommunicationService` | `CommunicationRepository` | `notification_templates` | Logged | VERIFIED |
| Analytics | GET | `/api/v1/company/analytics/reports` | Bearer JWT | `analytics:read` | Global | `AnalyticsService` | `AnalyticsRepository` | `analytics_reports` | Logged | VERIFIED |
| Analytics | GET | `/api/v1/company/analytics/insights` | Bearer JWT | `analytics:read` | Global | `AnalyticsService` | `AnalyticsRepository` | `system_insights` | Logged | VERIFIED |
| AI Governance | GET | `/api/v1/company/ai/models` | Bearer JWT | `ai:governance:read` | Global | `AIGovernanceService` | `AIGovernanceRepository` | `ai_models` | Logged | VERIFIED |
| AI Governance | GET | `/api/v1/company/ai/policies` | Bearer JWT | `ai:governance:read` | Global | `AIGovernanceService` | `AIGovernanceRepository` | `ai_governance_policies` | Logged | VERIFIED |
| AI Governance | GET | `/api/v1/company/ai/audit` | Bearer JWT | `ai:governance:read` | Global | `AIGovernanceService` | `AIGovernanceRepository` | `ai_audit_traces` | Logged | VERIFIED |
| Security | GET | `/api/v1/company/security/roles` | Bearer JWT | `security:read` | Global | `SecurityAdminService` | `SecurityAdminRepository` | `security_roles` | Logged | VERIFIED |
| Security | GET | `/api/v1/company/security/permissions` | Bearer JWT | `security:read` | Global | `SecurityAdminService` | `SecurityAdminRepository` | `security_permissions` | Logged | VERIFIED |
| Security | GET | `/api/v1/company/security/policies` | Bearer JWT | `security:read` | Global | `SecurityAdminService` | `SecurityAdminRepository` | `security_policies` | Logged | VERIFIED |
| Compliance | GET | `/api/v1/company/compliance/frameworks` | Bearer JWT | `compliance:read` | Global | `ComplianceService` | `ComplianceRepository` | `compliance_frameworks` | Logged | VERIFIED |
| Compliance | GET | `/api/v1/company/compliance/controls` | Bearer JWT | `compliance:read` | Global | `ComplianceService` | `ComplianceRepository` | `compliance_controls` | Logged | VERIFIED |
| Integration | GET | `/api/v1/company/integration/providers` | Bearer JWT | `integrations:read` | Global | `IntegrationService` | `IntegrationRepository` | `integration_providers` | Logged | VERIFIED |
| Integration | GET | `/api/v1/company/integration/endpoints` | Bearer JWT | `integrations:read` | Global | `IntegrationService` | `IntegrationRepository` | `integration_endpoints` | Logged | VERIFIED |
| Integration | GET | `/api/v1/company/integration/webhooks` | Bearer JWT | `integrations:read` | Global | `IntegrationService` | `IntegrationRepository` | `webhook_endpoints` | Logged | VERIFIED |
| Platform Eng | GET | `/api/v1/company/platform/projects` | Bearer JWT | `platform:read` | Global | `PlatformEngineeringService` | `PlatformEngineeringRepository` | `platform_projects` | Logged | VERIFIED |
| Platform Eng | GET | `/api/v1/company/platform/environments` | Bearer JWT | `platform:read` | Global | `PlatformEngineeringService` | `PlatformEngineeringRepository` | `platform_environments` | Logged | VERIFIED |
| Platform Eng | GET | `/api/v1/company/platform/deployments` | Bearer JWT | `platform:read` | Global | `PlatformEngineeringService` | `PlatformEngineeringRepository` | `platform_deployments` | Logged | VERIFIED |
| Infrastructure | GET | `/api/v1/company/infrastructure/clusters` | Bearer JWT | `infrastructure:read` | Global | `InfrastructureService` | `InfrastructureRepository` | `infrastructure_clusters` | Logged | VERIFIED |
| Infrastructure | GET | `/api/v1/company/infrastructure/databases` | Bearer JWT | `infrastructure:read` | Global | `InfrastructureService` | `InfrastructureRepository` | `infrastructure_databases` | Logged | VERIFIED |
| Infrastructure | GET | `/api/v1/company/infrastructure/dr` | Bearer JWT | `infrastructure:read` | Global | `InfrastructureService` | `InfrastructureRepository` | `disaster_recovery_plans` | Logged | VERIFIED |
| Company Admin | GET | `/api/v1/company/admin/legal-entities` | Bearer JWT | `admin:read` | Global | `CompanyAdminService` | `CompanyAdminRepository` | `legal_entities` | Logged | VERIFIED |
| Company Admin | GET | `/api/v1/company/admin/departments` | Bearer JWT | `admin:read` | Global | `CompanyAdminService` | `CompanyAdminRepository` | `departments` | Logged | VERIFIED |
| Company Admin | GET | `/api/v1/company/admin/policies` | Bearer JWT | `admin:read` | Global | `CompanyAdminService` | `CompanyAdminRepository` | `corporate_policies` | Logged | VERIFIED |
