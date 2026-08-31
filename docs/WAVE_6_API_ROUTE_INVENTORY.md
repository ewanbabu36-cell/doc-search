# DOC SEARCH — Production API Route Inventory

| HTTP Method | Route Path | Domain | Authentication | RBAC Permission | Scope Guard | Database Table | Audit Chained | Status |
|---|---|---|---|---|---|---|---|---|
| GET | `/health` | System | Public | None | None | None | No | **VERIFIED** |
| GET | `/ready` | System | Public | None | None | None | No | **VERIFIED** |
| GET | `/api/v1/company/executive/overview` | Executive | Bearer JWT | `executive:read` | Tenant | Multiple | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/partners` | CRM | Bearer JWT | `partner:read` | Tenant | `partner_accounts` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/company/partners` | CRM | Bearer JWT | `partner:create` | Tenant | `partner_accounts` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/partners/:id` | CRM | Bearer JWT | `partner:read` | Tenant | `partner_accounts` | Yes (SHA-256) | **VERIFIED** |
| PATCH | `/api/v1/company/partners/:id/status` | CRM | Bearer JWT | `partner:update` | Tenant | `partner_accounts` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/products` | Product | Bearer JWT | `product:read` | Tenant | `platform_products` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/company/products` | Product | Bearer JWT | `product:create` | Tenant | `platform_products` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/subscriptions` | Finance | Bearer JWT | `subscription:read` | Tenant | `partner_subscriptions` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/sales/leads` | Sales | Bearer JWT | `sales:read` | Tenant | `sales_leads` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/marketing/campaigns` | Marketing | Bearer JWT | `sales:read` | Tenant | `marketing_campaigns` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/support/tickets` | Support | Bearer JWT | `support:read` | Tenant | `support_tickets` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/support/health` | Support | Bearer JWT | `support:read` | Tenant | `partner_health_scores` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/communication/content` | Communication | Bearer JWT | `communication:read` | Tenant | `communication_items` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/analytics/reports` | Analytics | Bearer JWT | `analytics:read` | Tenant | `analytics_reports` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/analytics/insights` | Analytics | Bearer JWT | `analytics:read` | Tenant | `operational_insights` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/ai/models` | AI Governance | Bearer JWT | `ai:read` | Tenant | `governed_ai_models` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/ai/policies` | AI Governance | Bearer JWT | `ai:read` | Tenant | `ai_safety_policies` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/security/roles` | Security Admin | Bearer JWT | `security:read` | Tenant | `security_roles` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/security/permissions` | Security Admin | Bearer JWT | `security:read` | Tenant | `security_permissions` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/compliance/frameworks` | Compliance | Bearer JWT | `compliance:read` | Tenant | `compliance_frameworks` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/integration/providers` | Integration | Bearer JWT | `integration:read` | Tenant | `integration_providers` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/integration/webhooks` | Integration | Bearer JWT | `integration:read` | Tenant | `integration_webhooks` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/platform/projects` | Platform Eng | Bearer JWT | `platform:read` | Tenant | `platform_projects` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/platform/environments` | Platform Eng | Bearer JWT | `platform:read` | Tenant | `platform_environments` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/infrastructure/clusters` | Infrastructure | Bearer JWT | `infrastructure:read` | Tenant | `k8s_clusters` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/infrastructure/dr` | Infrastructure | Bearer JWT | `infrastructure:read` | Tenant | `dr_plans` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/admin/legal-entities` | Company Admin | Bearer JWT | `company:admin:read` | Tenant | `legal_entities` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/company/admin/departments` | Company Admin | Bearer JWT | `company:admin:read` | Tenant | `departments` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/radiology/orders` | Radiology 2.17 | Bearer JWT | `radiology:order:read` | Tenant/Branch | `radiology_orders` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/radiology/orders/:id` | Radiology 2.17 | Bearer JWT | `radiology:order:read` | Tenant/Branch | `radiology_orders` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/radiology/orders` | Radiology 2.17 | Bearer JWT | `radiology:order:create` | Tenant/Branch | `radiology_orders` | Yes (SHA-256) | **VERIFIED** |
| PATCH | `/api/v1/partner/radiology/orders/:id/status` | Radiology 2.17 | Bearer JWT | `radiology:order:update` | Tenant/Branch | `radiology_orders` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/dietary/overview` | Dietary 2.18 | Bearer JWT | `dietary:assessment:read` | Tenant/Branch | Multiple | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/dietary/analytics` | Dietary 2.18 | Bearer JWT | `dietary:assessment:read` | Tenant/Branch | Multiple | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/dietary/kitchens` | Dietary 2.18 | Bearer JWT | `dietary:kitchen:read` | Tenant/Branch | `dietary_kitchens` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/kitchens` | Dietary 2.18 | Bearer JWT | `dietary:kitchen:create` | Tenant/Branch | `dietary_kitchens` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/dietary/diet-types` | Dietary 2.18 | Bearer JWT | `dietary:diet-type:read` | Tenant Bound | `dietary_diet_types` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/diet-types` | Dietary 2.18 | Bearer JWT | `dietary:diet-type:create` | Tenant Bound | `dietary_diet_types` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/dietary/assessments` | Dietary 2.18 | Bearer JWT | `dietary:assessment:read` | Tenant/Branch | `dietary_assessments` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/assessments` | Dietary 2.18 | Bearer JWT | `dietary:assessment:create` | Tenant/Branch | `dietary_assessments` | Yes (SHA-256) | **VERIFIED** |
| PATCH | `/api/v1/partner/dietary/assessments/:id/finalize` | Dietary 2.18 | Bearer JWT | `dietary:assessment:update` | Tenant/Branch | `dietary_assessments` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/dietary/orders` | Dietary 2.18 | Bearer JWT | `dietary:order:read` | Tenant/Branch | `dietary_orders` | Yes (SHA-256) | **VERIFIED** |
| GET | `/api/v1/partner/dietary/orders/:id` | Dietary 2.18 | Bearer JWT | `dietary:order:read` | Tenant/Branch | `dietary_orders` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/orders` | Dietary 2.18 | Bearer JWT | `dietary:order:create` | Tenant/Branch | `dietary_orders` | Yes (SHA-256) | **VERIFIED** |
| PATCH | `/api/v1/partner/dietary/orders/:id/approve` | Dietary 2.18 | Bearer JWT | `dietary:order:update` | Tenant/Branch | `dietary_orders` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/production-plans` | Dietary 2.18 | Bearer JWT | `dietary:production:create` | Tenant/Branch | `dietary_production_plans` | Yes (SHA-256) | **VERIFIED** |
| PATCH | `/api/v1/partner/dietary/production-plans/:id/release` | Dietary 2.18 | Bearer JWT | `dietary:production:update` | Tenant/Branch | `dietary_production_plans` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/quality-checks` | Dietary 2.18 | Bearer JWT | `dietary:quality:create` | Tenant/Branch | `dietary_quality_checks` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/tray-assemblies` | Dietary 2.18 | Bearer JWT | `dietary:tray:create` | Tenant/Branch | `dietary_tray_assemblies` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/dispatches` | Dietary 2.18 | Bearer JWT | `dietary:dispatch:create` | Tenant/Branch | `dietary_meal_dispatches` | Yes (SHA-256) | **VERIFIED** |
| PATCH | `/api/v1/partner/dietary/dispatches/:id/deliver` | Dietary 2.18 | Bearer JWT | `dietary:delivery:update` | Tenant/Branch | `dietary_meal_dispatches` | Yes (SHA-256) | **VERIFIED** |
| PATCH | `/api/v1/partner/dietary/dispatches/:id/refuse` | Dietary 2.18 | Bearer JWT | `dietary:delivery:update` | Tenant/Branch | `dietary_meal_dispatches` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/billing-references` | Dietary 2.18 | Bearer JWT | `dietary:billing:create` | Tenant Bound | `dietary_billing_references` | Yes (SHA-256) | **VERIFIED** |
| POST | `/api/v1/partner/dietary/procurement-references` | Dietary 2.18 | Bearer JWT | `dietary:procurement:create` | Tenant Bound | `dietary_procurement_references` | Yes (SHA-256) | **VERIFIED** |
