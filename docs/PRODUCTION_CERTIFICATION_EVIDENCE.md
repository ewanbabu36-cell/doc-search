# DOC SEARCH — Production Certification Evidence

**Audit Date:** August 30, 2026  

---

| Control | Evidence Location | Verification Method | Result |
|---|---|---|:---:|
| **Migration Tracking** | `packages/database/migrations/meta/_journal.json` | Executed `packages/database/test/migration-integrity.test.mjs` (100% match) | **PASS** |
| **PostgreSQL RLS** | `0041_security_wave_1_rls_and_audit.sql` & `0042_complete_multi_tenant_rls.sql` | Policies defined for `sessions`, `user_tenants`, `user_branches`, `audit_events`, `radiology_orders`, `dietary_orders`, etc. | **PASS** |
| **Tenant Isolation** | `apps/api-gateway/test/wave6-production-audit.test.mjs` (TEST 02) | Cross-tenant order access rejected with 403 Forbidden | **PASS** |
| **Branch Isolation** | `packages/auth/test/security-foundation.test.mjs` (TEST 11) | Cross-branch resource access denied | **PASS** |
| **Authentication** | `apps/api-gateway/src/routes/auth.routes.ts` & `apps/api-gateway/test/wave2-integration.test.mjs` (TEST 18-20) | Real REST login, refresh rotation, logout executed & verified | **PASS** |
| **RBAC / Permissions** | `apps/api-gateway/test/wave3-company-domains.test.mjs` | Pre-handler permission checks enforce least-privilege RBAC | **PASS** |
| **Clinical Safety** | `packages/shared-core/src/clinical/clinical-safety-service.ts` | Real allergen, NPO, and therapeutic restriction gates tested and verified | **PASS** |
| **Audit Immutability** | `apps/api-gateway/test/wave6-production-audit.test.mjs` (TEST 07) | SHA-256 hash chains detect tamper; DB trigger prevents mutation | **PASS** |
| **Persistence** | `packages/database/src/client.ts` | Fail-closed 503 in production on DB disconnect | **PASS** |
| **E2E Golden Paths** | `apps/api-gateway/test/wave5-dietary-domain.test.mjs` & `wave6-production-audit.test.mjs` | Real multi-step clinical workflows execute from creation to delivery | **PASS** |
| **CI Security Gates** | `.github/workflows/ci.yml` | Monorepo builds, typecheck, lint, and test suites run in strict blocking order | **PASS** |
| **Observability & Probes** | `apps/api-gateway/src/routes/health.ts` | `/health` returns liveness, `/ready` checks live database connectivity | **PASS** |
