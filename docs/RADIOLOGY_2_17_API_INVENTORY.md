# DOC SEARCH — Phase 2.17 Radiology API Inventory

| HTTP Method | Route Path | Purpose | Authentication | Required Permission | Scope Enforced | DB Table | Audit Chained | Status |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/v1/partner/radiology/orders` | List and filter clinical radiology orders | Bearer JWT | `radiology:order:read` | Tenant / Branch | `radiology_orders` | Logged | **VERIFIED** |
| GET | `/api/v1/partner/radiology/orders/:id` | Get details of a single radiology order | Bearer JWT | `radiology:order:read` | Tenant / Branch | `radiology_orders` | Logged | **VERIFIED** |
| POST | `/api/v1/partner/radiology/orders` | Create and persist new clinical imaging order | Bearer JWT | `radiology:order:create` | Tenant / Branch | `radiology_orders` | SHA-256 Chained | **VERIFIED** |
| PATCH | `/api/v1/partner/radiology/orders/:id/status` | Advance radiology order lifecycle state | Bearer JWT | `radiology:order:update` | Tenant / Branch | `radiology_orders` | SHA-256 Chained | **VERIFIED** |
