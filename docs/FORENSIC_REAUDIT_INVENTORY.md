# DOC SEARCH — Forensic Repository Inventory

**Audit Date:** August 30, 2026  
**Auditor:** Independent Adversarial Production Certification Auditor  

---

## 1. Monorepo Structure

### Applications (`apps/`):
- `apps/api-gateway`: Fastify HTTP Gateway (Port 4000) with Authentication, RBAC, RLS Context, Helmet, Rate Limiting, Audit Interceptors, and Health/Readiness Probes.
- `apps/company-platform`: React 18 + Vite SPA for 15 Company Executive & Administrative Domains.
- `apps/partner-platform`: React 18 + Vite SPA for Hospital/Clinic Partner Clinical & Operational Modules.

### Packages (`packages/`):
- `packages/auth`: JWT & Refresh Token lifecycle, scrypt hashing, SessionService, ScopeGuard, RBAC Evaluator.
- `packages/database`: Drizzle ORM schemas, PostgreSQL RLS transaction helper (`withSecurityContext`), connection pool.
- `packages/api-contracts`: Strict Zod request/response validation schemas (Company, Partner, FHIR R4, Dietary, Radiology).
- `packages/shared-core`: Centralized error handling (`AppError`), structured JSON logger, cryptographic helpers, `ClinicalSafetyService`.
- `packages/ui-kit`: Shared design system components.

---

## 2. Database Migrations Forensics

- **Total SQL Migrations on Disk:** 43
- **Total Registered Journal Entries:** 43
- **0041_security_wave_1_rls_and_audit.sql:** CONFIRMED ON DISK & JOURNAL
- **0042_complete_multi_tenant_rls.sql:** CONFIRMED ON DISK & JOURNAL
- **Migration Journal Discrepancies:** 0 (100% Match)

---

## 3. Test Suites Forensics
- `packages/auth/test/security-foundation.test.mjs` (Wave 1: 21 tests)
- `packages/database/test/migration-integrity.test.mjs` (Migration Integrity: 2 tests)
- `apps/api-gateway/test/wave2-integration.test.mjs` (Wave 2 + Auth APIs: 20 tests)
- `apps/api-gateway/test/wave3-company-domains.test.mjs` (Wave 3: 26 tests)
- `apps/api-gateway/test/wave5-dietary-domain.test.mjs` (Wave 5: 15 tests)
- `apps/api-gateway/test/wave6-production-audit.test.mjs` (Wave 6: 15 tests)
- **Total Executable Tests:** 99
