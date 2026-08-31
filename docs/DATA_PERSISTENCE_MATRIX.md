# DOC SEARCH — Data Persistence Matrix (Wave 2)

| Domain | Entity / Table | Storage Engine | Scope Level | RLS Policy | Audit Logging |
|---|---|---|---|---|---|
| Core Security | `core.audit_events` | PostgreSQL | Tenant / Branch | Immutable Append | SHA-256 Hash Chain |
| Core Auth | `core.sessions` | PostgreSQL | User / Tenant | Session Guard | Session Revocation |
| Company CRM | `company.partner_profiles` | PostgreSQL | Tenant | Organization RLS | PARTNER_CREATED / UPDATED |
| Company CRM | `company.partner_lifecycle_transitions` | PostgreSQL | Tenant | Transition History | Audit Trail |
| Product Catalog | `company.products` | PostgreSQL | Global Platform | Global Read / Admin Write | PRODUCT_CREATED |
| Billing & Subscriptions | `company.subscriptions` | PostgreSQL | Tenant | Tenant Isolation | SUBSCRIPTION_UPDATED |
| Clinical Radiology | `clinical.radiology_orders` | PostgreSQL | Tenant / Branch | Facility Branch Scope | RADIOLOGY_ORDER_CREATED |
| Clinical Radiology | `clinical.radiology_studies` | PostgreSQL | Tenant / Branch | Facility Branch Scope | RADIOLOGY_STUDY_CREATED |
| Clinical Radiology | `clinical.radiology_reports` | PostgreSQL | Tenant / Branch | Facility Branch Scope | RADIOLOGY_REPORT_FINALIZED |
