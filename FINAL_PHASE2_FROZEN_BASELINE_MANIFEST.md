# DOC SEARCH — PHASE 2 FROZEN BASELINE & INTEGRITY MANIFEST

**Freeze Timestamp**: 2026-08-31T09:08:00Z  
**Final Status**: `PHASE_2_FULL_ACCEPTANCE_PASS`  
**State**: `FROZEN_LOCKED — DO NOT ALTER`

---

## 1. Environment & Package Versions
- **Platform OS**: Windows NT (x64)
- **Node.js Runtime**: `v24.14.0` (LTS/Current)
- **Package Manager**: `pnpm@9.15.4`
- **TypeScript**: `^5.7.3`
- **Vite Bundler**: `v6.4.3`
- **Monorepo Engine**: Turborepo `^2.3.3`
- **Core Workspace Packages**:
  - `@docsearch/api-gateway`: `1.0.0` (Fastify v5 backend)
  - `@docsearch/partner-platform`: `1.0.0` (React 18 + Vite HIS/LIMS platform)
  - `@docsearch/company-platform`: `1.0.0` (React 18 + Vite SaaS HQ platform)
  - `@docsearch/landing-page`: `1.0.0` (Public Marketing portal)
  - `@docsearch/database`: `1.0.0` (PostgreSQL schemas & migrations)
  - `@docsearch/auth`: `1.0.0` (scrypt password hashing & JWT token services)
  - `@docsearch/ui-kit`: `1.0.0` (Shared design system components)

---

## 2. Database Migration State
- **Active Schemas**: `core`, `clinical`, `billing`, `pharmacy`, `lab`, `audit`
- **Critical Tables Frozen**:
  - `core.users` — User identity & account status (`ACTIVE`)
  - `core.user_credentials` — Salted `scrypt` password hashes (`verifyPassword`)
  - `core.tenant_memberships` — Authoritative multi-tenant isolation
  - `core.branch_memberships` — Organization branch authorization
  - `core.roles` & `core.role_permissions` — Granular RBAC scopes
  - `core.sessions` — Persistent PostgreSQL session store & token rotation
  - `core.audit_events` — Security audit trail (`AUTH_USER_LOGGED_IN`, `AUTH_LOGOUT`)
  - `lab.orders`, `lab.order_specimens`, `lab.order_results` — Multi-analyte lab investigations
- **Migration History**: `0001_core_schema.sql` through `0041_security_wave_1_rls_and_audit.sql` applied cleanly.

---

## 3. Running Live Services & Verified Endpoints

| Service Name | Port / URL | State | Verified Endpoints |
|---|---|:---:|---|
| **Fastify API Gateway** | `http://localhost:4000` | `LIVE` | `GET /health`<br>`POST /api/v1/auth/login`<br>`POST /api/v1/auth/refresh`<br>`POST /api/v1/auth/logout`<br>`POST /api/v1/partner/lab/orders`<br>`POST /api/v1/partner/lab/orders/:id/collect-sample`<br>`POST /api/v1/partner/lab/orders/:id/results`<br>`PATCH /api/v1/partner/lab/orders/:id/verify`<br>`GET /api/v1/partner/lab/orders/:id/pdf` |
| **Hospital Partner Platform** | `http://localhost:5173` | `LIVE` | Real Staff Login, OPD Desk, Pathology LIMS Workbench, Dual-Signature A4 Report Preview, Native Print Invocation, PDF Download |
| **Company SaaS HQ Platform** | `http://localhost:5174` | `LIVE` | Executive Founder Authentication, Multi-Tenant Governance, Subscription MRR Control |
| **Public Marketing Portal** | `http://localhost:5175` | `LIVE` | AI Receptionist & Public Health Search |

---

## 4. Test Suite Execution & Acceptance Results

| Test Suite | Execution Command | Result | Status |
|---|---|:---:|:---:|
| **Phase 1 Security Suite** | `node scratch/run_phase1_verification_suite.cjs` | **27 / 27 PASS** | ✅ `PASS` |
| **Production Truth Auth & PDF Suite** | `node scratch/test_real_auth_and_pdf.cjs` | **33 / 33 PASS** | ✅ `PASS` |
| **Complete Hospital Workflow E2E** | `node scratch/run_full_hospital_workflow_e2e.cjs` | **32 / 32 PASS** | ✅ `PASS` |
| **Chrome CDP Real Browser Acceptance** | `node scratch/cdp_browser_runner_final.cjs` | **8 / 8 PASS** | ✅ `PASS` |

---

## 5. Frozen Verified Artifacts & Reports
1. `docs/PHASE1_AUTH_ARCHITECTURE.md` — Core auth & session architecture baseline
2. `docs/PHASE1_FRONTEND_AUTH_BLOCKERS.md` — Inventory of eliminated demo fallbacks
3. `docs/PHASE1_AUTH_STATIC_SCAN.md` — Zero-wildcard, zero-bypass static verification
4. `docs/PHASE2_FRONTEND_AUTH_AUDIT.md` — Client session routing audit
5. `docs/PHASE2_AUTH_FLOW.md` — Complete end-to-end token & session bootstrap pipeline
6. `docs/PHASE2_REAL_BROWSER_E2E_REPORT.md` — Real browser execution evidence
7. `docs/PHASE2_LIMS_REAL_WORLD_E2E_FINAL_REPORT.md` — Complete clinical LIMS multi-order verification
8. `docs/PHASE2_FINAL_BROWSER_ACCEPTANCE_REPORT.md` — Final full browser acceptance matrix

---

## 6. Known Environmental & External Blockers
- **WhatsApp Cloud API Dispatch**: Live endpoint returns compliant simulated response; awaiting external Meta Cloud API / Twilio production webhook credentials.

---

## 7. Baseline Lock Directive
> **PHASE 2 IS OFFICIALLY LOCKED AND FROZEN.**  
> Do NOT modify any working Phase 2 authentication, session, LIMS, PDF, or printing code.  
> No Phase 3 work may begin until explicitly instructed.
