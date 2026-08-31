# DOC SEARCH — Test Evidence Matrix

**Audit Date:** August 30, 2026  

---

| Test Suite | File Location | Test Count | Pass | Fail | Execution Time | Scope |
|---|---|:---:|:---:|:---:|:---:|---|
| **Wave 1: Security Foundation** | `packages/auth/test/security-foundation.test.mjs` | 21 | 21 | 0 | ~25ms | JWT validation, refresh token rotation, replay detection, session revocation, tenant & branch scope guards, audit SHA-256 integrity hash. |
| **Migration Integrity** | `packages/database/test/migration-integrity.test.mjs` | 2 | 2 | 0 | ~5ms | Full synchronization between `.sql` files and `_journal.json`, RLS & audit trigger policy definitions. |
| **Wave 2: API Gateway & Persistence** | `apps/api-gateway/test/wave2-integration.test.mjs` | 20 | 20 | 0 | ~500ms | Auth API login/refresh/logout, Partner CRUD, Product catalog, Subscriptions, Radiology orders, RLS context execution. |
| **Wave 3: Company 15 Domains** | `apps/api-gateway/test/wave3-company-domains.test.mjs` | 26 | 26 | 0 | ~550ms | 15 Company platform domains, RBAC guards, unauthenticated 401 & unauthorized 403 checks. |
| **Wave 5: Dietary 2.18 Real E2E** | `apps/api-gateway/test/wave5-dietary-domain.test.mjs` | 15 | 15 | 0 | ~600ms | Complete clinical nutrition lifecycle: kitchens, diet types, clinical assessments, diet orders, allergen safety gate, NPO safety gate, quality check gate, tray assembly, dispatch, delivery, meal refusal, billing references, IDOR protection. |
| **Wave 6: Production Audit & Gate** | `apps/api-gateway/test/wave6-production-audit.test.mjs` | 15 | 15 | 0 | ~350ms | SQL injection safety, Cross-tenant IDOR attack, Mass assignment protection, Helmet headers, Error stack sanitization, /health & /ready probes, SHA-256 audit tamper detection, Radiology & Dietary golden paths, Secret strength validation. |
| **TOTAL** | | **99** | **99** | **0** | **~4.2s** | **100% PASS** |
