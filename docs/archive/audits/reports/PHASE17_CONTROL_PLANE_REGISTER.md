# DOC SEARCH — PHASE 17 ENTERPRISE CONTROL PLANE REGISTER

## STATUS: PARTIALLY VERIFIED — HARDENING IN PROGRESS

---

## 1. EXECUTIVE SUMMARY & ZERO-TRUST CONTROL PHILOSOPHY

The DOC SEARCH enterprise control plane governs all access, licensing, subscriptions, entitlements, RBAC/ABAC boundaries, staff provisioning, and organizational hierarchy. In accordance with zero-trust architecture:

1. **HQ is the Supreme Authority**: No client browser, cached JWT claim, or partner-side state may override HQ commercial decisions, licensing status, or organizational boundaries.
2. **Fail-Closed by Default**: Any missing credentials, unauthenticated calls, corrupted signatures, expired licenses, revoked sessions, or mismatched tenant/partner IDs must immediately terminate execution with `401 Unauthorized` or `403 Forbidden`.
3. **Cryptographic Integrity & Anti-Tamper**: Licenses are cryptographically sealed with HMAC-SHA256 signatures (`x-docsearch-license-signature`). Tampered or outdated licenses are rejected immediately. Server clock is strictly authoritative.
4. **Tenant & Partner Scoping**: Cross-tenant and cross-partner resource access is strictly forbidden. Parameter tampering via URL params, query strings, request bodies, or headers is blocked at the gateway level.
5. **Separation of Duties & Dual-Control**: Administrative privilege escalation, self-role assignment, and Day-0 hard purges require authenticated dual-control governance.

---

## 2. CANONICAL CONTROL OBJECTS INVENTORY (CP-01 TO CP-24)

| Control ID | Enterprise Control Object | Authoritative Source | Primary Enforcement Mechanism | Fail-Closed Policy |
| :--- | :--- | :--- | :--- | :--- |
| **CP-01** | Global Tenant (`tenants`) | Database `tenants` table | `auth-guard.ts`, `ScopeGuard.ts` | 403 Forbidden on mismatched tenant |
| **CP-02** | Partner Profile (`partner_profiles`) | Database `partner_profiles` table | `PartnerGovernanceService.ts`, `partner.routes.ts` | 404 Not Found or 403 Cross-Tenant Denied |
| **CP-03** | Product Catalog (`products`) | Database `products` table | `ProductService.ts`, `product.routes.ts` | 403 Forbidden on unauthorized mutation |
| **CP-04** | Commercial Plan (`plans`) | Database `plans` table | `ProductService.ts`, `SubscriptionService.ts` | 400 Bad Request on invalid plan |
| **CP-05** | Price Version (`price_versions`) | Database `price_versions` table | `ProductService.ts`, `CommercialFinanceService.ts` | 400 Bad Request on inactive price |
| **CP-06** | Subscription Lifecycle (`subscriptions`) | Database `subscriptions` table | `SubscriptionService.ts`, `commercial-guard.ts` | Grace period countdown -> SUSPENDED -> LOCKED |
| **CP-07** | Cryptographic License (`licenses`) | Database `licenses` table | `LicenseService.ts`, `commercial-guard.ts` | Rejected if invalid state or missing license |
| **CP-08** | HMAC-SHA256 Signature (`signature`) | Database `licenses.signature` | `LicenseService.verifySignature()` | 403 Forbidden on tamper or invalid key |
| **CP-09** | License State Machine | `commercial-guard.ts`, `LicenseService.ts` | Deterministic state transitions | Block write operations when EXPIRED / LOCKED |
| **CP-10** | Feature Entitlement (`plan_entitlements`) | Database `plan_entitlements` | `EntitlementService.ts`, `requireFeatureEntitlement` | 403 Forbidden if feature not licensed |
| **CP-11** | Partner Profile Boundary | `facility-normalizer.ts` | `isModuleAllowedForPartnerProfile()` | 403 Forbidden if module outside profile scope |
| **CP-12** | Governance Overrides | Database `partner_overrides` | `PartnerGovernanceService.ts` | Overrides supersede base plan, auditable |
| **CP-13** | Global Operational Freeze | In-Memory / Distributed Flag | `CommercialControlService.ts` | All partner mutations fail closed (503/423) |
| **CP-14** | Tenant Commercial Freeze | Database `partner_profiles.metadata` | `commercial-guard.ts` | Block clinical mutations when frozen |
| **CP-15** | User / Session Revocation | Database `revocation_ledger` | `SessionRevocationService.ts`, `auth-guard.ts` | Immediate token termination (401 Unauthorized) |
| **CP-16** | Operational Department (`departments`)| Database `operational_departments` | `StaffAdministrationService.ts` | Tenant & facility isolation enforced |
| **CP-17** | RBAC Role Hierarchy | `packages/auth/rbac-evaluator.ts` | `requireRoles()`, `RBACEvaluator.enforceRole()` | 403 Forbidden if role insufficient |
| **CP-18** | Role Permissions Matrix | `packages/auth/rbac-evaluator.ts` | `requirePermission()`, `RBACEvaluator` | 403 Forbidden if permission missing |
| **CP-19** | Operational Staff (`staff`) | Database `operational_staff` | `StaffAdministrationService.ts` | 403 on cross-tenant access/creation |
| **CP-20** | Staff Role Assignment | Database `staff_role_assignments` | `StaffAdministrationService.assignStaffRole()` | Self-escalation blocked, quota checked |
| **CP-21** | Doctor & Resource Quotas | License metadata & DB count | `StaffAdministrationService.enforceDoctorQuota` | 403 Quota Exceeded on over-allocation |
| **CP-22** | Break-Glass Emergency Access | Database `break_glass_events` | `verifyActiveBreakGlassForPatientChart()` | 403 Forbidden without emergency grant |
| **CP-23** | Anti-Tamper Clock Authority | Server NTP & Header Analysis | `AntiTamperClockService.ts` | 400 Bad Request on client time skew |
| **CP-24** | Immutable Audit Ledger | Database `audit_events` | `AuditRepository.ts`, `recordEvent()` | Persisted append-only transaction ledger |

---

## 3. AUTHORITATIVE CONTROL CHAIN

The execution of any enterprise request follows the strict sequential hierarchy:

```
[Incoming Request]
       │
       ▼
[Anti-Tamper & Clock Validation] (CP-23)
       │
       ▼
[Cryptographic JWT Authentication] (CP-15, CP-01)
       │
       ▼
[Session Revocation & Freeze Check] (CP-13, CP-14)
       │
       ▼
[Zero-Trust Tenant & Partner Scoping] (CP-01, CP-02)
       │
       ▼
[License State & HMAC Signature Validation] (CP-07, CP-08, CP-09)
       │
       ▼
[Feature Entitlement & Profile Boundary Check] (CP-10, CP-11)
       │
       ▼
[RBAC Role & Granular Permission Evaluation] (CP-17, CP-18)
       │
       ▼
[Break-Glass Emergency Chart Exception] (CP-22)
       │
       ▼
[Resource Quota & Concurrency Mutex Lock] (CP-21, CP-20)
       │
       ▼
[Atomic Database Transaction with RLS Context] (CP-16, CP-19)
       │
       ▼
[Immutable Audit Ledger Record] (CP-24)
       │
       ▼
[HTTP 200/201 Response]
```

---

## 4. DISCOVERED CONTROL-PLANE VULNERABILITIES & REMEDIATION PLAN

### 4.1. VULN-P17-01: Unauthenticated Account Takeover via Password Reset
- **Location**: `apps/api-gateway/src/routes/company/partner.routes.ts:1536`
- **Severity**: **CRITICAL (P0)**
- **Flaw**: `POST /api/v1/company/partners/reset-password` was guarded with `preHandler: [optionalAuthenticate]` without any role or permission checks. An unauthenticated attacker could reset passwords of arbitrary partner accounts.
- **Remediation**: Enforce `preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]`. Block anonymous callers with 401 and non-HQ callers with 403.

### 4.2. VULN-P17-02: Unauthenticated Hard Purge / Partner Deletion
- **Location**: `apps/api-gateway/src/routes/company/partner.routes.ts:1463-1476`
- **Severity**: **CRITICAL (P0)**
- **Flaw**: `optionalCompanyAdminGuard` executed `optionalAuthenticate`, then checked `if (user && !['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(user.role))`. If `user` was `undefined` (anonymous caller), the check evaluated to false and allowed unauthenticated deletion of partners.
- **Remediation**: Enforce `preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]` on both `DELETE /api/v1/company/partners/:partnerId` and `DELETE /api/v1/company/partners/staged/:partnerId`.

### 4.3. VULN-P17-03: Lax `optionalAuthenticate` on Sensitive Administrative Endpoints
- **Location**: Multiple endpoints across `partner.routes.ts`, `executive.routes.ts`, `subscription.routes.ts`.
- **Severity**: **HIGH (P1)**
- **Flaw**: Core administration routes used `optionalAuthenticate` in combination with or in place of strict `authenticate`.
- **Remediation**: Replace all occurrences of `optionalAuthenticate` with strict `authenticate` across partner directory, staff, departments, executive operations, and subscription administration.

### 4.4. VULN-P17-04: Missing Partner Tenant Scope Validation on `/api/v1/company/partners/:partnerId/*`
- **Location**: `apps/api-gateway/src/routes/company/partner.routes.ts`
- **Severity**: **HIGH (P1 - IDOR)**
- **Flaw**: Authenticated non-HQ callers could query or mutate other partners' staff, departments, or commercial details by changing `:partnerId` in the URL.
- **Remediation**: Add strict partner scope validation: non-HQ callers (`!session.isSuperAdmin && !session.roles.includes('COMPANY_ADMIN')`) are only permitted to access routes where `partnerId === session.tenantId` (or mapped partner ID). Mismatches must immediately reject with 403 Forbidden.

### 4.5. VULN-P17-05: Self-Escalation in Staff Role Assignment
- **Location**: `apps/api-gateway/src/services/partner/StaffAdministrationService.ts:727`
- **Severity**: **HIGH (P1)**
- **Flaw**: `assignStaffRole` lacked an explicit check preventing non-admin users from assigning themselves administrative roles (`targetStaff.userId === session.userId`).
- **Remediation**: Enforce self-escalation prevention: reject if `!session.isSuperAdmin && targetStaff.userId === session.userId`. Require that callers assigning administrative roles hold administrative privileges.

### 4.6. VULN-P17-06: Missing `partnerId` Parameter Tampering Guard in `auth-guard.ts`
- **Location**: `apps/api-gateway/src/plugins/auth-guard.ts:316`
- **Severity**: **MEDIUM (P2)**
- **Flaw**: `auth-guard.ts` validated client-supplied `tenantId` against `session.tenantId`, but did not validate client-supplied `partnerId` in body, query, params, or `x-partner-id` header.
- **Remediation**: Extend Zero-Trust Identity validation in `auth-guard.ts` to inspect `partnerId` and reject with 403 `TENANT_ACCESS_DENIED` if it conflicts with `session.tenantId` for non-HQ callers.

---

## 5. HARDENING ROADMAP & VERIFICATION COMMITMENT

1. [x] Architectural & Codebase Audit of 24 Control Objects.
2. [x] Vulnerability Identification and Classification (`VULN-P17-01` to `VULN-P17-06`).
3. [ ] Code Remediation of `partner.routes.ts`, `auth-guard.ts`, `StaffAdministrationService.ts`, `executive.routes.ts`, `subscription.routes.ts`.
4. [ ] Independent Adversarial Test Suite (`phase17-control-plane-hardening.test.mjs`).
5. [ ] Full Regression Suite Execution & Clean Monorepo Builds.
6. [ ] Final Verification Matrices & Certification Report.
