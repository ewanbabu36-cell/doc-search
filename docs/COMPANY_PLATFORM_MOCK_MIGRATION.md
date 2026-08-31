# DOC SEARCH — Company Platform Mock Migration Plan

| File | Domain | Consumer | Replacement API | Replacement Repository | Classification | Status |
|---|---|---|---|---|---|---|
| `mock-data.ts` | Executive & Command Center | `ExecutiveService` | `GET /api/v1/company/executive/overview` | `ExecutiveRepository` | MIGRATED | **COMPLETED** |
| `mock-partner-data.ts` | CRM & Partner Lifecycle | `PartnerService` | `/api/v1/company/partners` | `PartnerRepository` | MIGRATED | **COMPLETED** |
| `mock-product-data.ts` | Product / Plans / Entitlements | `ProductService` | `/api/v1/company/products` | `ProductRepository` | MIGRATED | **COMPLETED** |
| `mock-subscription-data.ts` | Subscription / Billing / Finance | `SubscriptionService` | `/api/v1/company/subscriptions` | `SubscriptionRepository` | MIGRATED | **COMPLETED** |
| `mock-sales-marketing-data.ts` | Sales & Marketing | `SalesMarketingService` | `/api/v1/company/sales/*` | `SalesMarketingRepository` | MIGRATED | **COMPLETED** |
| `mock-support-data.ts` | Customer Success & Support | `SupportService` | `/api/v1/company/support/*` | `SupportRepository` | MIGRATED | **COMPLETED** |
| `mock-communication-data.ts` | Communication & Content | `CommunicationService` | `/api/v1/company/communication/*` | `CommunicationRepository` | MIGRATED | **COMPLETED** |
| `mock-analytics-data.ts` | Analytics / BI / Intelligence | `AnalyticsService` | `/api/v1/company/analytics/*` | `AnalyticsRepository` | MIGRATED | **COMPLETED** |
| `mock-ai-data.ts` | AI Platform & AI Governance | `AIService` | `/api/v1/company/ai/*` | `AIGovernanceRepository` | MIGRATED | **COMPLETED** |
| `mock-security-data.ts` | Security / RBAC / Policy / Audit | `SecurityService` | `/api/v1/company/security/*` | `SecurityAdminRepository` | MIGRATED | **COMPLETED** |
| `mock-compliance-data.ts` | Compliance & Data Governance | `ComplianceService` | `/api/v1/company/compliance/*` | `ComplianceRepository` | MIGRATED | **COMPLETED** |
| `mock-integration-data.ts` | API / Integration / Interoperability | `IntegrationService` | `/api/v1/company/integration/*` | `IntegrationRepository` | MIGRATED | **COMPLETED** |
| `mock-platform-engineering-data.ts` | Platform Engineering | `PlatformEngineeringService` | `/api/v1/company/platform/*` | `PlatformEngineeringRepository` | MIGRATED | **COMPLETED** |
| `mock-infrastructure-data.ts` | Infrastructure / Monitoring / DR | `InfrastructureService` | `/api/v1/company/infrastructure/*` | `InfrastructureRepository` | MIGRATED | **COMPLETED** |
| `mock-company-admin-data.ts` | Company Administration & Governance | `CompanyAdminService` | `/api/v1/company/admin/*` | `CompanyAdminRepository` | MIGRATED | **COMPLETED** |
