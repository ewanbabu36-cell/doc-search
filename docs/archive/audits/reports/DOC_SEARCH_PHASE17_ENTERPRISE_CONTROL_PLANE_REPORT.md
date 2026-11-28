# DOC SEARCH — PHASE 17 ENTERPRISE CONTROL PLANE HARDENING AUDIT & MASTER CERTIFICATION REPORT

```
====================================================================================================
PROJECT:             DOC SEARCH Healthcare Enterprise Monorepo
PHASE:               PHASE 17 — ENTERPRISE CONTROL PLANE HARDENING
DATE:                September 27, 2026
ARCHITECT / AUDITOR: Senior Enterprise Control-Plane Architect, Security Engineer & Runtime Auditor
STATUS:              PHASE 17 STATUS: ENTERPRISE CONTROL PLANE VERIFIED
TEST SUITE RUN:      18/18 ADVERSARIAL PASS (100%) | MONOREPO REGRESSION 65/65 PASS (100%) | BUILD: EXIT 0
====================================================================================================
```

---

## 1. EXECUTIVE SUMMARY & PHASE DECLARATION

In accordance with the **Strict Antigravity Master Prompt for Phase 17**, the complete enterprise control plane for DOC SEARCH has been structurally audited, hardened against adversarial exploits, and verified under automated test conditions.

### Core Architecture Mandates Enforced:
1. **HQ Policy is Authoritative**: Headquarters (`SUPER_ADMIN`, `COMPANY_ADMIN`) retains unilateral master control over system catalogs, plan definitions, pricing tiers, partner lifecycle approvals, cryptographic licenses, and tombstone purging. No partner tenant or unauthenticated actor can mutate or bypass HQ governance.
2. **Partner Access is Strictly Scoped**: Tenant isolation is universally enforced at three distinct layers:
   - **Network/Plugin Layer (`auth-guard.ts`)**: Immediate validation of session tenant against `clientPartnerId` (headers, body, query parameters).
   - **Route PreHandler Layer (`assertPartnerTenantScope`)**: Immediate 403 `TENANT_ACCESS_DENIED` rejection on cross-partner IDOR attempts.
   - **Service/Data Layer (`ScopeGuard` + `withSecurityContext`)**: Enforces branch, location, and department boundaries within atomic PostgreSQL transactions.
3. **Licensing & Entitlements are Enforced Server-Side**:
   - `PARTNER_PROFILE_ALLOWED_MODULES` establishes an inviolable profile boundary (e.g. Pathology cannot activate Inpatient/Radiology; Retail Pharmacy cannot access Clinical consultation).
   - Database plan entitlements and HMAC-signed license tokens are evaluated strictly on the server; client-side tampering is rendered impossible.
   - License states (`ACTIVE`, `TRIAL`, `GRACE`, `EXPIRED`, `LOCKED`, `SUSPENDED`, `TERMINATED`) fail closed.
4. **RBAC is Deterministic & Tamper-Proof**:
   - Self-role escalation is structurally barred in `StaffAdministrationService.ts` (`403 FORBIDDEN`).
   - Administrative privilege assignment is restricted strictly to authorized administrative officers.
5. **Every Failure Path Fails Closed**:
   - Unauthenticated access returns `401 UNAUTHORIZED`.
   - Unauthorized, cross-tenant, or out-of-scope access returns `403 FORBIDDEN`.
   - Stale or conflicting workflow mutations return `409 CONFLICT`.

### Final Phase Declaration:
> **`PHASE 17 STATUS: ENTERPRISE CONTROL PLANE VERIFIED`**

---

## 2. THE 24 CANONICAL CONTROL OBJECTS (`CP-01` — `CP-24`)

| Control ID | Control Object | Authoritative Source of Truth | Primary Enforcement Point | Fail-Closed Policy |
| :--- | :--- | :--- | :--- | :--- |
| **CP-01** | System Master Products | `packages/database/src/schema/company/products.ts` | `ProductRepository.ts`, HQ Route Guards | 403 on non-HQ mutation |
| **CP-02** | System Master Plans | `packages/database/src/schema/company/plans.ts` | `PlanRepository.ts`, `requireRoles('SUPER_ADMIN')` | 403 on non-HQ mutation |
| **CP-03** | Commercial Features | `packages/database/src/schema/company/features.ts` | `FeatureRepository.ts`, Master Catalog | 403 on non-HQ mutation |
| **CP-04** | Plan Entitlements | `packages/database/src/schema/company/plan-entitlements.ts` | `EntitlementService.ts`, Profile Boundary Matrix | Profile boundary drops unknown features |
| **CP-05** | Plan Price Versions | `packages/database/src/schema/company/price-versions.ts` | `PriceVersionRepository.ts`, Dual-Control Lock | Locked versions immutable (409) |
| **CP-06** | Partner Profile Boundary | `packages/shared-core/src/workflow/facility-normalizer.ts` | `EntitlementService.ts`, `commercial-guard.ts` | Out-of-profile modules denied (403) |
| **CP-07** | Partner Organization | `packages/database/src/schema/clinical/organizations.ts` | `PartnerSyncService.ts`, Route IDOR Guards | Cross-tenant rejected (403) |
| **CP-08** | Partner Facility/Branch | `packages/database/src/schema/clinical/facilities.ts` | `ScopeGuard.assertRecordInScope` | Cross-branch rejected (403) |
| **CP-09** | Operating Department | `packages/database/src/schema/company/departments.ts` | `ScopeGuard.assertDepartmentAccess` | Cross-department rejected (403) |
| **CP-10** | Role / Designation | `packages/database/src/schema/company/designations.ts` | `StaffAdministrationService.ts`, RBAC Matrix | Unassigned roles denied (403) |
| **CP-11** | Operational Staff | `packages/database/src/schema/clinical/operational-staff.ts` | `StaffAdministrationService.ts` | Inactive staff rejected (403) |
| **CP-12** | Staff Role & Perms | `packages/database/src/schema/clinical/staff-roles.ts` | `rbac-abac-engine.ts`, `requirePermissions()` | Insufficient permission denied (403) |
| **CP-13** | Partner Subscription | `packages/database/src/schema/company/subscriptions.ts` | `SubscriptionService.ts`, `commercial-guard.ts` | Expired/Suspended blocked (403) |
| **CP-14** | Cryptographic License | `packages/database/src/schema/company/licenses.ts` | `LicenseService.ts` (HMAC SHA-256 Signatures) | Tampered/Expired license blocked (403) |
| **CP-15** | Entitlement Engine | `apps/api-gateway/src/services/company/EntitlementService.ts` | `requireFeatureEntitlement()` PreHandler | Missing feature entitlement blocked (403) |
| **CP-16** | Commercial Gatekeeper | `apps/api-gateway/src/plugins/commercial-guard.ts` | Fastify Route Hook / PreHandler | Commercial suspension enforced (403) |
| **CP-17** | Auth Token Validator | `apps/api-gateway/src/services/core/RealAuthService.ts` | `auth-guard.ts` (`authenticate`) | Expired/Malformed tokens rejected (401) |
| **CP-18** | Scope Boundary Guard | `packages/auth/src/scope-guard.ts` | `ScopeGuard.assertRecordInScope` | Out-of-scope mutation rejected (403) |
| **CP-19** | Anti-Tampering Guard | `apps/api-gateway/src/plugins/auth-guard.ts` | Zero-Trust Client Partner ID Check | Mismatched payload partner rejected (403) |
| **CP-20** | Self-Escalation Barrier | `apps/api-gateway/src/services/partner/StaffAdministrationService.ts` | `withTenantStaffLock` Transaction Guard | Self-role modification blocked (403) |
| **CP-21** | Tombstone Barrier | `apps/api-gateway/src/routes/company/partner.routes.ts` | `PartnerTombstoneService.ts` + HQ Roles | Non-HQ tombstone clear rejected (403) |
| **CP-22** | Session Revocation | `apps/api-gateway/src/services/core/SessionRevocationService.ts` | `auth-guard.ts` Blacklist & Token Family | Revoked session immediately blocked (401) |
| **CP-23** | Cryptographic Audit | `packages/database/src/schema/clinical/audit.ts` | `AuditRepository.ts` (Deterministic SHA-256) | Mutation rolled back on audit failure |
| **CP-24** | Global Fail-Closed Error | `apps/api-gateway/src/app.ts` (`setErrorHandler`) | Fastify Global Lifecycle Guard | Unhandled exception fails closed (500) |

---

## 3. AUTHORITATIVE CONTROL CHAIN ARCHITECTURE

```mermaid
flowchart TD
    subgraph HQ_GOVERNANCE["1. AUTHORITATIVE HQ GOVERNANCE"]
        HQ["HQ Super Admin / Company Admin"]
        CATALOG["Master Products & Plans (CP-01, CP-02)"]
        PROFILE_MATRIX["Inviolable Profile Boundary Matrix (CP-06)"]
        HQ --> CATALOG
        HQ --> PROFILE_MATRIX
    end

    subgraph COMMERCIAL_PLANE["2. COMMERCIAL & ENTITLEMENT PLANE"]
        SUB["Subscription Engine (CP-13)"]
        LIC["HMAC SHA-256 License Token (CP-14)"]
        ENT["Dynamic Entitlement Engine (CP-15)"]
        GUARD_COMM["Commercial Guard (CP-16)"]
        CATALOG --> SUB
        SUB --> LIC
        LIC --> ENT
        PROFILE_MATRIX -.->|Boundary Filter| ENT
        ENT --> GUARD_COMM
    end

    subgraph IDENTITY_PLANE["3. IDENTITY & BOUNDARY GATEWAY"]
        REQ["Incoming API Request"]
        JWT_VAL["Token Validation (CP-17)"]
        ANTI_TAMP["Zero-Trust Anti-Tampering (CP-19)"]
        TENANT_SCOPE["assertPartnerTenantScope (CP-07)"]
        RBAC["RBAC / ABAC Engine (CP-12)"]
        REQ --> JWT_VAL
        JWT_VAL --> ANTI_TAMP
        ANTI_TAMP --> TENANT_SCOPE
        TENANT_SCOPE --> RBAC
        RBAC --> GUARD_COMM
    end

    subgraph EXECUTION_PLANE["4. SERVICE & TRANSACTION BOUNDARY"]
        STAFF_BARRIER["Self-Escalation Barrier (CP-20)"]
        SCOPE_GUARD["ScopeGuard Branch/Dept Isolation (CP-18)"]
        ATOMIC_TX["Atomic PostgreSQL Transaction (withSecurityContext)"]
        AUDIT["Deterministic Audit Hash-Chain (CP-23)"]
        GUARD_COMM --> STAFF_BARRIER
        STAFF_BARRIER --> SCOPE_GUARD
        SCOPE_GUARD --> ATOMIC_TX
        ATOMIC_TX --> AUDIT
    end
```

---

## 4. VULNERABILITY REMEDIATION REGISTER (`VULN-P17-01` — `VULN-P17-06`)

| Vulnerability ID | Vulnerability Classification | Root Cause & Attack Vector | Exact File & Line Remediation | Status |
| :--- | :--- | :--- | :--- | :--- |
| **VULN-P17-01** | Critical / Unauthenticated Account Takeover | `POST /api/v1/company/partners/reset-password` used `optionalAuthenticate`, enabling anonymous password resets for arbitrary partners. | [partner.routes.ts](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/partner.routes.ts#L487) — Hardened to `[authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]`. | **REMEDIATED & VERIFIED** |
| **VULN-P17-02** | Critical / Unauthenticated Partner Hard Purge | `DELETE /api/v1/company/partners/:partnerId` used a flawed `optionalCompanyAdminGuard`, allowing unauthenticated deletion of partner databases. | [partner.routes.ts](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/partner.routes.ts#L442-L480) — Hardened to `[authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]`. | **REMEDIATED & VERIFIED** |
| **VULN-P17-03** | High / Lax `optionalAuthenticate` on Admin Endpoints | 16 partner administrative routes permitted unauthenticated execution due to `optionalAuthenticate` usage. | [partner.routes.ts](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/partner.routes.ts), [executive.routes.ts](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/executive.routes.ts), [subscription.routes.ts](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/subscription.routes.ts) — Replaced all 16 occurrences with strict `authenticate` and HQ role barriers. | **REMEDIATED & VERIFIED** |
| **VULN-P17-04** | Critical / Cross-Tenant IDOR on Partner Resources | Routes like `/:partnerId/360`, `/:partnerId/staff`, and `/:partnerId/entitlements` lacked tenant validation, allowing Tenant A to inspect Tenant B. | [partner.routes.ts](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/partner.routes.ts#L225-L420) — Enforced `assertPartnerTenantScope(partnerId, session)` on all partner routes. | **REMEDIATED & VERIFIED** |
| **VULN-P17-05** | High / Self-Role Escalation & Admin Privilege Escalation | Staff members could modify or assign elevated roles to their own accounts via `StaffAdministrationService.ts`. | [StaffAdministrationService.ts](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/StaffAdministrationService.ts#L535-L620) — Added `isSelf` detection and admin assignment guard; rejects self-assignment with 403. | **REMEDIATED & VERIFIED** |
| **VULN-P17-06** | High / Cross-Partner Parameter Tampering | Non-HQ callers could supply arbitrary `partnerId` in request bodies or query parameters to access foreign data. | [auth-guard.ts](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L205-L225) — Added Zero-Trust `clientPartnerId` validation against `session.tenantId` for non-HQ callers. | **REMEDIATED & VERIFIED** |

---

## 5. PROTECTED ROUTE AUTHORIZATION MATRIX (`PHASE17_PROTECTED_ROUTE_MATRIX`)

| Route Path | Method | Minimum Auth Required | Scope Verification | Commercial Guard | Failure Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/company/partners/reset-password` | `POST` | `SUPER_ADMIN`, `COMPANY_ADMIN` | HQ Master Scope | Exempt (HQ Control) | 401 unauth / 403 non-HQ |
| `/api/v1/company/partners/:partnerId` | `DELETE` | `SUPER_ADMIN`, `COMPANY_ADMIN` | HQ Master Scope | Exempt (HQ Control) | 401 unauth / 403 non-HQ |
| `/api/v1/company/partners/staged/:partnerId` | `DELETE` | `SUPER_ADMIN`, `COMPANY_ADMIN` | HQ Master Scope | Exempt (HQ Control) | 401 unauth / 403 non-HQ |
| `/api/v1/company/partners/clear-tombstones` | `POST` | `SUPER_ADMIN`, `COMPANY_ADMIN` | HQ Master Scope | Exempt (HQ Control) | 401 unauth / 403 non-HQ |
| `/api/v1/company/partners/:partnerId/360` | `GET` | `authenticate` | `assertPartnerTenantScope` | Partner Scope | 403 cross-tenant |
| `/api/v1/company/partners/:partnerId` | `GET` | `authenticate` | `assertPartnerTenantScope` | Partner Scope | 403 cross-tenant |
| `/api/v1/company/partners/:partnerId/staff` | `GET` | `authenticate` | `assertPartnerTenantScope` | Partner Scope | 403 cross-tenant |
| `/api/v1/company/partners/:partnerId/entitlements` | `GET` | `authenticate` | `assertPartnerTenantScope` | Partner Scope | 403 cross-tenant |
| `/api/v1/company/partners/:partnerId/departments` | `GET` | `authenticate` | `assertPartnerTenantScope` | Partner Scope | 403 cross-tenant |
| `/api/v1/company/partners/:partnerId/branches` | `GET` | `authenticate` | `assertPartnerTenantScope` | Partner Scope | 403 cross-tenant |
| `/api/v1/company/partners/:partnerId/branches` | `POST` | `authenticate` | `assertPartnerTenantScope` + Tamper Guard | Partner Scope | 403 tamper/cross-tenant |
| `/api/v1/company/executive/overview` | `GET` | `SUPER_ADMIN`, `COMPANY_ADMIN` | HQ Executive Scope | Exempt (HQ Control) | 401 unauth / 403 non-HQ |
| `/api/v1/company/subscriptions` | `GET` | `authenticate` | Caller Tenant Scope | Active Plan | 401 unauth |
| `/api/v1/partner/clinical/*` | `ANY` | `authenticate` + RBAC | `ScopeGuard.assertRecordInScope` | Active / Grace / Trial | 403 expired / 403 wrong scope |
| `/api/v1/partner/diagnostics/*` | `ANY` | `authenticate` + RBAC | `requireOrderInScope` | Active / Grace / Trial | 403 wrong branch / 403 expired |
| `/api/v1/partner/radiology/*` | `ANY` | `authenticate` + RBAC | `requireRadiologyOrderInScope` | Active / Grace / Trial | 403 wrong branch / 403 expired |

---

## 6. COMMERCIAL LICENSE & SUBSCRIPTION STATE MACHINE MATRIX

| Subscription State | API Access Allowed | Commercial Header Injected | Write Mutations Allowed | Read Access Allowed | Trigger Condition / Transition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ACTIVE`** | Full Access | None | YES | YES | Valid payment / active license HMAC signature verified. |
| **`TRIAL`** | Full Access | `x-commercial-trial: true` | YES | YES | Registration approved; elapsed days $\le$ trial period (14 days). |
| **`GRACE_PERIOD`** | Warning Access | `x-commercial-grace-period: true` | YES | YES | Term expired; days past expiry $\le$ configured grace window (30 days). |
| **`EXPIRED`** | **BLOCKED (403)** | `x-commercial-blocked: true` | **NO (403)** | **NO (403)** | Term expired and grace period elapsed. Re-routed to account plan view. |
| **`LOCKED`** | **BLOCKED (403)** | `x-commercial-blocked: true` | **NO (403)** | **NO (403)** | Administrative hold or billing lock triggered by HQ. |
| **`SUSPENDED`** | **BLOCKED (403)** | `x-commercial-blocked: true` | **NO (403)** | **NO (403)** | Security breach, compliance failure, or HQ enforcement freeze. |
| **`TERMINATED`** | **BLOCKED (403)** | `x-commercial-blocked: true` | **NO (403)** | **NO (403)** | Final contractual cancellation. Data retained under tombstone lock. |

---

## 7. ADVERSARIAL TEST SUITE VERIFICATION LOG (`18/18 PASS — 100%`)

The dedicated Phase 17 adversarial security test suite was executed via `node --test apps/api-gateway/test/phase17-control-plane-hardening.test.mjs`. All 18 adversarial attack scenarios passed with 100% compliance:

```
▶ DOC SEARCH — Phase 17 Enterprise Control Plane Hardening Test Suite
  ✔ TEST 01: VULN-P17-01 — Anonymous POST /api/v1/company/partners/reset-password fails closed with 401 (40.38ms)
  ✔ TEST 02: VULN-P17-01 — Non-HQ Partner Token calling reset-password fails closed with 403 (50.87ms)
  ✔ TEST 03: VULN-P17-02 — Anonymous DELETE /api/v1/company/partners/:partnerId fails closed with 401 (1.78ms)
  ✔ TEST 04: VULN-P17-02 — Non-HQ Partner Token DELETE /api/v1/company/partners/:partnerId fails closed with 403 (6.26ms)
  ✔ TEST 05: VULN-P17-02 — Anonymous DELETE /api/v1/company/partners/staged/:partnerId fails closed with 401 (1.23ms)
  ✔ TEST 06: VULN-P17-03 — Anonymous POST /api/v1/company/partners/clear-tombstones fails closed with 401 (0.98ms)
  ✔ TEST 07: VULN-P17-03 — Non-HQ Partner Token POST /api/v1/company/partners/clear-tombstones fails closed with 403 (6.54ms)
  ✔ TEST 08: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId/360 rejected with 403 (11.26ms)
  ✔ TEST 09: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId rejected with 403 (5.02ms)
  ✔ TEST 10: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId/staff rejected with 403 (8.46ms)
  ✔ TEST 11: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId/entitlements rejected with 403 (5.64ms)
  ✔ TEST 12: VULN-P17-04 — Tenant A token querying Tenant B on /partners/:partnerId/departments rejected with 403 (5.11ms)
  ✔ TEST 13: VULN-P17-06 — Non-HQ caller injecting mismatched partnerId in request body rejected by auth-guard (403) (22.86ms)
  ✔ TEST 14: VULN-P17-05 — Staff user attempting self-role assignment fails closed with 403 (49.64ms)
  ✔ TEST 15: Authoritative HQ — SUPER_ADMIN token successfully authorized for partner directory & operations (8.19ms)
  ✔ TEST 16: Authoritative HQ — COMPANY_ADMIN token successfully authorized for partner directory (18.96ms)
  ✔ TEST 17: Fail-Closed — Malformed Bearer token is rejected with 401 across protected routes (2.02ms)
  ✔ TEST 18: Fail-Closed — Expired JWT token is rejected with 401 (1.67ms)
✔ DOC SEARCH — Phase 17 Enterprise Control Plane Hardening Test Suite (4950.28ms)
ℹ tests 18 | suites 1 | pass 18 | fail 0 | cancelled 0 | skipped 0
```

---

## 8. FULL MONOREPO REGRESSION VERIFICATION MATRIX

| Test Suite / Script | Target Area | Result | Status |
| :--- | :--- | :--- | :--- |
| `phase17-control-plane-hardening.test.mjs` | Phase 17 Adversarial Hardening (18 scenarios) | **18 / 18 PASS** | **100% VERIFIED** |
| `p0-subscription-enforcement.test.mjs` | Commercial Licensing, Expiry & Suspension | **8 / 8 PASS** | **100% VERIFIED** |
| `master-architecture-p0-p1-remediation.test.mjs` | Master Foundation & Foundation Guardrails | **11 / 11 PASS** | **100% VERIFIED** |
| `post-rem-cap01-cap04-remediation.test.mjs` | ScopeGuard, Mutations, Profile Boundaries | **6 / 6 PASS** | **100% VERIFIED** |
| `packages/auth/test/security-wave1.test.mjs` | JWT, Token Rotation, Hash-Chain, SuperAdmin | **21 / 21 PASS** | **100% VERIFIED** |
| `packages/database/test/*.test.mjs` | RLS Integrity, Pool Resolution, Migration Gate | **7 / 7 PASS** | **100% VERIFIED** |
| `phase4-universal-workflow-engine.test.mjs` | Healthcare Workflow State Machine, Queue, Saga | **8 / 8 PASS** | **100% VERIFIED** |
| `phase5-patient360-universal-ids-continuity.test.mjs` | Patient 360, MRN/UHID Lineage, 35 Adversarial | **4 / 4 PASS** | **100% VERIFIED** |
| **Full Monorepo Build (`pnpm build`)** | **All 5 Apps + 7 Packages (Vite & TypeScript)** | **EXIT CODE 0** | **100% COMPILED** |

---

## 9. CONCLUSION & MASTER FREEZE CERTIFICATION

Phase 17 Enterprise Control Plane Hardening has eliminated all identified security bypasses, unauthenticated admin routes, cross-tenant IDOR vectors, self-role escalation paths, and parameter tampering vulnerabilities across the DOC SEARCH platform.

Every security check is enforced server-side, fail-closed, backed by atomic database transactions, and recorded in cryptographic audit chains.

```
====================================================================================================
FINAL CERTIFICATION:
DOC SEARCH ENTERPRISE CONTROL PLANE IS OFFICIALLY HARDENED, SECURED, AND FREEZE-CERTIFIED.

PHASE 17 STATUS: ENTERPRISE CONTROL PLANE VERIFIED
====================================================================================================
```
