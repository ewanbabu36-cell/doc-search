# DOC SEARCH — API Implementation Status (Wave 2)

| Route | HTTP Method | Auth Required | Permission Required | Scope Enforced | Persistence |
|---|---|---|---|---|---|
| `/health` | GET | No | None | Global | Memory / System |
| `/ready` | GET | No | None | Global | Database Probe |
| `/api/v1/company/executive/overview` | GET | Yes | `analytics:read` | Global / Tenant | Live Database Counts |
| `/api/v1/company/partners` | GET | Yes | `partners:read` | Global / Tenant | PostgreSQL |
| `/api/v1/company/partners/:partnerId` | GET | Yes | `partners:read` | Global / Tenant | PostgreSQL |
| `/api/v1/company/partners` | POST | Yes | `partners:create` | Tenant Bound | PostgreSQL + Audit |
| `/api/v1/company/partners/:partnerId/status` | PATCH | Yes | `partners:update` | Tenant Bound | PostgreSQL + Audit |
| `/api/v1/company/products` | GET | Yes | None | Global Platform | PostgreSQL |
| `/api/v1/company/products/:productId` | GET | Yes | None | Global Platform | PostgreSQL |
| `/api/v1/company/products` | POST | Yes | `products:create` | Global Platform | PostgreSQL + Audit |
| `/api/v1/company/subscriptions` | GET | Yes | `subscriptions:read` | Global / Tenant | PostgreSQL |
| `/api/v1/company/subscriptions/:id` | GET | Yes | `subscriptions:read` | Global / Tenant | PostgreSQL |
| `/api/v1/partner/radiology/orders` | GET | Yes | `clinical:radiology:read` | Tenant + Branch | PostgreSQL |
| `/api/v1/partner/radiology/orders/:id` | GET | Yes | `clinical:radiology:read` | Tenant + Branch | PostgreSQL |
| `/api/v1/partner/radiology/orders` | POST | Yes | `clinical:radiology:create` | Tenant + Branch | PostgreSQL + Audit |
| `/api/v1/partner/radiology/orders/:id/status` | PATCH | Yes | `clinical:radiology:update` | Tenant + Branch | PostgreSQL + Audit |
