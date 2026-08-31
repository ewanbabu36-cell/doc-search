# DOC SEARCH — Mock Data Migration Matrix

| Domain | Previous Status (Wave 1) | Target State (Wave 2) | Migration Status |
|---|---|---|---|
| Executive Overview | Hardcoded JSON counts | PostgreSQL count queries on live tables | **COMPLETED** |
| Partner Profiles (CRM) | In-memory mock arrays | `company.partner_profiles` + Drizzle Repo | **COMPLETED** |
| Partner Lifecycle | Mock state mutation | `company.partner_lifecycle_transitions` | **COMPLETED** |
| Product Catalog | Static list | `company.products` + Drizzle Repo | **COMPLETED** |
| Subscriptions | Mock records | `company.subscriptions` + Drizzle Repo | **COMPLETED** |
| Radiology Orders | Local UI state | `clinical.radiology_orders` + Drizzle Repo | **COMPLETED** |
| Audit Trail | Ephemeral logging | `core.audit_events` with SHA-256 chaining | **COMPLETED** |
