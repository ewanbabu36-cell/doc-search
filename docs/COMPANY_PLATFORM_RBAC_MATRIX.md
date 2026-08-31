# DOC SEARCH — Company Platform RBAC Matrix

| Domain | Read Permission | Create Permission | Update Permission | Delete Permission | Approve Permission | Publish Permission | Export Permission |
|---|---|---|---|---|---|---|---|
| 01. Executive | `analytics:read` | N/A | N/A | N/A | N/A | N/A | `analytics:export` |
| 02. CRM | `partners:read` | `partners:create` | `partners:update` | `partners:delete` | `partners:approve` | N/A | `partners:export` |
| 03. Product | `products:read` | `products:create` | `products:update` | `products:delete` | `products:approve` | `products:publish` | `products:export` |
| 04. Subscription | `subscriptions:read` | `subscriptions:create` | `subscriptions:update` | `subscriptions:delete` | `subscriptions:approve` | N/A | `subscriptions:export` |
| 05. Sales & Marketing | `sales:read`, `marketing:read` | `sales:create` | `sales:update` | `sales:delete` | `sales:approve` | `marketing:publish` | `sales:export` |
| 06. Support | `support:read` | `support:create` | `support:update` | `support:delete` | `support:resolve` | N/A | `support:export` |
| 07. Communication | `communication:read` | `communication:create` | `communication:update` | `communication:delete` | `communication:approve` | `communication:publish` | N/A |
| 08. Analytics | `analytics:read` | N/A | N/A | N/A | N/A | N/A | `analytics:export` |
| 09. AI Governance | `ai:governance:read` | `ai:governance:create` | `ai:governance:update` | `ai:governance:delete` | `ai:governance:approve` | N/A | `ai:governance:export` |
| 10. Security | `security:read` | `security:create` | `security:update` | `security:delete` | `security:approve` | N/A | `security:export` |
| 11. Compliance | `compliance:read` | `compliance:create` | `compliance:update` | `compliance:delete` | `compliance:approve` | N/A | `compliance:export` |
| 12. Integration | `integrations:read` | `integrations:create` | `integrations:update` | `integrations:delete` | `integrations:approve` | N/A | `integrations:export` |
| 13. Platform Engineering | `platform:read` | `platform:create` | `platform:update` | `platform:delete` | `platform:deploy` | `platform:promote` | `platform:export` |
| 14. Infrastructure | `infrastructure:read` | N/A | N/A | N/A | `infrastructure:failover` | N/A | `infrastructure:export` |
| 15. Company Admin | `admin:read` | `admin:create` | `admin:update` | `admin:delete` | `admin:approve` | `admin:publish` | `admin:export` |
