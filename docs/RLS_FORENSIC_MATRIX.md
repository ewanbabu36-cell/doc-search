# DOC SEARCH — Row-Level Security (RLS) Forensic Matrix

**Audit Date:** August 30, 2026  
**Auditor:** PostgreSQL & RLS Specialist  

---

| Schema | Table Name | Classification | Tenant Scoped | Branch Scoped | RLS Enabled | FORCE RLS | Isolation Policy Implemented |
|---|---|---|:---:|:---:|:---:|:---:|:---:|
| `core` | `sessions` | USER/SESSION | Yes | No | Yes | Yes | `p_sessions_tenant_isolation` |
| `core` | `user_tenants` | USER/TENANT | Yes | No | Yes | Yes | `p_user_tenants_tenant_isolation` |
| `core` | `user_branches` | USER/BRANCH | Yes | Yes | Yes | Yes | `p_user_branches_tenant_isolation` |
| `core` | `audit_events` | AUDIT | Yes | Yes | Yes | Yes | `p_audit_events_tenant_isolation` + Append-only Trigger |
| `core` | `partner_profiles` | TENANT/PARTNER | Yes | No | Yes | Yes | `p_partner_profiles_isolation` |
| `clinical` | `radiology_orders` | CLINICAL/RADIOLOGY | Yes | Yes | Yes | Yes | `p_radiology_orders_isolation` |
| `clinical` | `radiology_studies` | CLINICAL/RADIOLOGY | Yes | Yes | Yes | Yes | `p_radiology_studies_isolation` |
| `clinical` | `radiology_reports` | CLINICAL/RADIOLOGY | Yes | Yes | Yes | Yes | `p_radiology_reports_isolation` |
| `clinical` | `radiology_critical_findings` | CLINICAL/SAFETY | Yes | Yes | Yes | Yes | `p_radiology_critical_findings_isolation` |
| `clinical` | `dietary_kitchens` | OPERATIONAL/DIETARY | Yes | Yes | Yes | Yes | `p_dietary_kitchens_isolation` |
| `clinical` | `dietary_orders` | CLINICAL/DIETARY | Yes | Yes | Yes | Yes | `p_dietary_orders_isolation` |
| `clinical` | `dietary_assessments` | CLINICAL/DIETARY | Yes | Yes | Yes | Yes | `p_dietary_assessments_isolation` |
| `clinical` | `dietary_meal_dispatches` | OPERATIONAL/DIETARY | Yes | Yes | Yes | Yes | `p_dietary_meal_dispatches_isolation` |

### Transaction Context Mechanism:
- Enforced via `withSecurityContext` executing `SET LOCAL app.current_tenant_id`, `SET LOCAL app.current_branch_id`, `SET LOCAL app.current_user_id`, and `SET LOCAL app.is_super_admin`.
