# PHASE 1 — SECURITY & RBAC BASELINE AUDIT
**Monorepo:** DOC SEARCH (Distributed Healthcare Operating System)  
**Audit Scope:** Authentication, Authorization, RBAC, Tenant/Branch Scoping, Audit Trail, Rate Limiting, Input Validation  
**Date of Inspection:** September 3, 2026  
**Classification Standard:** `[VERIFIED_FROM_SOURCE]`, `[PARTIALLY_IMPLEMENTED]`, `[NOT_IMPLEMENTED]`, `[CONTRADICTED]`, `[UNKNOWN]`

---

## 1. Executive Summary

This document establishes the verified baseline of the existing DOC SEARCH security architecture prior to executing Phase 1 hardening. Every capability has been inspected directly from source code files and classified according to its actual implementation status.

---

## 2. Capability Inspection & Classification Matrix

| # | Capability | Classification | Responsible Files & Functions | Current State & Forensic Assessment |
| :-: | :--- | :---: | :--- | :--- |
| **1** | **Authentication & Session Implementation** | `[VERIFIED_FROM_SOURCE]` | - [`packages/auth/src/token-service.ts`](file:///packages/auth/src/token-service.ts): `signJwt`, `verifyJwt`<br>- [`packages/auth/src/session-service.ts`](file:///packages/auth/src/session-service.ts): `SessionService`<br>- [`packages/auth/src/redis-session-store.ts`](file:///packages/auth/src/redis-session-store.ts): `RedisSessionStore`<br>- [`apps/api-gateway/src/services/core/RealAuthService.ts`](file:///apps/api-gateway/src/services/core/RealAuthService.ts): `RealAuthService.authenticateUser`<br>- [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts): `POST /api/v1/auth/login`, `/refresh`, `/logout` | Authenticates users against cryptographic scrypt hashes. Derives `tenantId`, `branchId`, `roles`, and `permissions` from server-side record (`PRODUCTION_CREDENTIAL_STORE`). Issues HMAC-SHA256 JWTs and rotating refresh tokens stored in Redis. Never exposes passwords in logs. |
| **2** | **Auth Middleware & Fastify Guards** | `[PARTIALLY_IMPLEMENTED]` | - [`apps/api-gateway/src/plugins/auth-guard.ts`](file:///apps/api-gateway/src/plugins/auth-guard.ts): `authenticate`, `requirePermission`, `requireRoles`, `requireTenantScope`, `requireBranchScope` | `authenticate` and `requirePermission` are actively applied as `preHandler` hooks across route files. However, `requireRoles`, `requireTenantScope`, and `requireBranchScope` are defined in `auth-guard.ts` but are **NOT attached** to partner/clinical routes. |
| **3** | **RBAC Implementation** | `[VERIFIED_FROM_SOURCE]` | - [`packages/auth/src/rbac-evaluator.ts`](file:///packages/auth/src/rbac-evaluator.ts): `RBACEvaluator.hasPermission`, `RBACEvaluator.enforcePermission`, `RBACEvaluator.enforceRole` | Deny-by-default permission evaluator. Matches exact `resource:action` strings or super-admin wildcard `*`. Throws HTTP 403 `AppError.forbidden` on failure. |
| **4** | **Role Definitions** | `[VERIFIED_FROM_SOURCE]` | - [`packages/api-contracts/src/auth/rbac.schema.ts`](file:///packages/api-contracts/src/auth/rbac.schema.ts): `RoleTypeSchema` | Defines 5 Platform Roles (`SUPER_ADMIN`, `COMPANY_ADMIN`, `COMPLIANCE_OFFICER`, `SUPPORT_LEAD`, `FINANCE_MANAGER`) and 11 Partner/Clinical Roles (`HOSPITAL_ADMIN`, `CLINIC_ADMIN`, `BRANCH_MANAGER`, `CHIEF_MEDICAL_OFFICER`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PHARMACIST`, `LAB_TECHNICIAN`, `BILLING_CLERK`, `PATIENT`). |
| **5** | **Permission Definitions** | `[PARTIALLY_IMPLEMENTED]` | - [`packages/api-contracts/src/auth/rbac.schema.ts`](file:///packages/api-contracts/src/auth/rbac.schema.ts): `PermissionActionSchema`, `PermissionScopeSchema`<br>- [`apps/api-gateway/src/services/core/RealAuthService.ts`](file:///apps/api-gateway/src/services/core/RealAuthService.ts) | Actions (`create`, `read`, `update`, `delete`, `manage`, `execute`, `audit`) and scopes (`global`, `tenant`, `branch`, `department`, `own`) are defined. However, several routes use misaligned permissions (e.g. pharmacy dispense checks `clinical:consultations:create` instead of pharmacy-specific permissions; billing checks `clinical:encounters:create` instead of `billing:invoices:create`). |
| **6** | **Tenant Scope Logic** | `[PARTIALLY_IMPLEMENTED]` | - [`packages/auth/src/scope-guard.ts`](file:///packages/auth/src/scope-guard.ts): `ScopeGuard.enforceTenantScope`<br>- [`packages/database/src/client.ts`](file:///packages/database/src/client.ts): `withSecurityContext` (`SET LOCAL app.current_tenant_id`)<br>- [`apps/api-gateway/src/plugins/auth-guard.ts`](file:///apps/api-gateway/src/plugins/auth-guard.ts): `requireTenantScope` | `withSecurityContext` and repository queries bind `tenantId = session.tenantId`. However, if a caller sends `tenantId` in request body/query (`req.body.tenantId = 'foreign-tenant'`), the system currently overwrites it or ignores it instead of **strictly rejecting** the request as an unauthorized cross-tenant breach. |
| **7** | **Branch Scope Logic** | `[PARTIALLY_IMPLEMENTED]` | - [`packages/auth/src/scope-guard.ts`](file:///packages/auth/src/scope-guard.ts): `ScopeGuard.enforceBranchScope`<br>- [`packages/database/src/client.ts`](file:///packages/database/src/client.ts): `withSecurityContext` (`SET LOCAL app.current_branch_id`) | Logic exists in `ScopeGuard`, but routes do not enforce `requireBranchScope`. Repositories like `ClinicalWorkflowRepository` take `input.branchId` from caller payload without verifying if the user's `session.branchId` allows accessing or writing to that branch. |
| **8** | **Caller-Supplied Security Fields Protection** | `[PARTIALLY_IMPLEMENTED]` | - [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts)<br>- [`apps/api-gateway/src/services/partner/ClinicalWorkflowService.ts`](file:///apps/api-gateway/src/services/partner/ClinicalWorkflowService.ts) | The auth login route strictly ignores caller-supplied roles and tenant IDs. Most services overwrite `tenantId: session.tenantId`. However, caller-supplied `branchId`, `role`, or mismatched `tenantId` are not actively validated and rejected with HTTP 403 / 400. |
| **9** | **Audit Implementation** | `[VERIFIED_FROM_SOURCE]` | - [`apps/api-gateway/src/repositories/core/AuditRepository.ts`](file:///apps/api-gateway/src/repositories/core/AuditRepository.ts): `auditRepository.recordEvent`<br>- [`packages/auth/src/audit-helper.ts`](file:///packages/auth/src/audit-helper.ts): `buildSecurityAuditRecord`, `computeAuditHash` | Cryptographic SHA-256 hash chaining (`previousHash` $\rightarrow$ `integrityHash`) into `core.audit_events`. Logs user logins, patient registrations, encounter check-ins, medication dispensations, and invoice voiding. |
| **10** | **Rate Limiting** | `[VERIFIED_FROM_SOURCE]` | - [`apps/api-gateway/src/plugins/security.ts`](file:///apps/api-gateway/src/plugins/security.ts): `registerSecurityPlugins` | Multi-tier rate limiting via `@fastify/rate-limit`. Authenticated clinical staff are keyed by `auth:{tenantId}:{userId}` (5,000 req/min quota) to prevent hospital NAT lockouts. Unauthenticated endpoints are keyed by `ip:{ip}` (60 req/min quota) to prevent brute-force attacks. |
| **11** | **Input Validation** | `[PARTIALLY_IMPLEMENTED]` | - [`packages/api-contracts`](file:///packages/api-contracts)<br>- [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts)<br>- [`apps/api-gateway/src/routes/partner/billing-management.routes.ts`](file:///apps/api-gateway/src/routes/partner/billing-management.routes.ts) | Login, refresh, invoice void, and discount endpoints enforce strict Zod validation. However, many clinical, pharmacy, and lab routes perform unsafe type casts (`const payload = request.body as Omit<...>`) without running Zod or Fastify schema validation before passing to services. |
| **12** | **Backend API Route Protection** | `[PARTIALLY_IMPLEMENTED]` | - [`apps/api-gateway/src/routes/partner/`](file:///apps/api-gateway/src/routes/partner/)<br>- [`apps/api-gateway/src/routes/company/`](file:///apps/api-gateway/src/routes/company/) | Protected routes have `authenticate` and `requirePermission`. However, permission names are misaligned for Pharmacy (`clinical:consultations` instead of pharmacy permissions) and Billing (`clinical:encounters` instead of billing permissions), and branch/tenant scope guards are missing from preHandlers. |

---

## 3. Specific Gaps Identified for Phase 1 Remediation

1. **Caller-Supplied Scope Validation**:
   - If a caller supplies a `tenantId` in `request.body`, `request.query`, or `request.params` that differs from `request.session.tenantId`, the request must be explicitly **DENIED (HTTP 403 / 400)** rather than silently ignored or overwritten.
   - If a branch-scoped caller (`session.dataScope === 'branch'`) supplies a `branchId` that does not match `session.branchId`, it must be explicitly **DENIED (HTTP 403)**.
   - If a caller supplies a `role` in `request.body` attempting privilege escalation (e.g. `role: 'SUPER_ADMIN'`), the server must reject or ignore the payload and evaluate permissions strictly from `request.session.roles`.

2. **Role & Permission Separation**:
   - Ensure distinct server-side enforcement for:
     - `DOCTOR` (`clinical:encounters`, `clinical:consultations`, `clinical:patients`, `clinical:orders`)
     - `RECEPTIONIST` (`clinical:patients:read`, `clinical:patients:create`, `clinical:encounters:read`, `clinical:encounters:create`)
     - `PHARMACIST` (`pharmacy:dispense`, `pharmacy:medications`, `pharmacy:inventory`)
     - `LAB_TECHNICIAN` (`lab:orders`, `lab:specimens`, `lab:results`)
     - `BILLING_CLERK` (`billing:invoices`, `billing:payments`)
     - `HOSPITAL_ADMIN` (`hospital:admin`, management operations)
     - `SUPER_ADMIN` / `COMPANY_ADMIN` (platform-wide access)
   - Align route `requirePermission` preHandlers in `pharmacy-management.routes.ts` and `billing-management.routes.ts` so they check the appropriate domain permissions instead of generic clinical encounter/consultation permissions.

3. **Input Validation on Clinical & Pharmacy Routes**:
   - Add Zod validation schemas for patient registration, encounter check-in, pharmacy dispensing, and lab result entry so that malformed requests are rejected with HTTP 400 before business logic executes.

---

## 4. Verification Baseline Summary

- **Total Capabilities Audited:** 12
- **`[VERIFIED_FROM_SOURCE]`**: 5 (Authentication, RBAC Engine, Role Definitions, Audit Trail, Rate Limiting)
- **`[PARTIALLY_IMPLEMENTED]`**: 7 (Auth Middleware/Guards, Permission Definitions, Tenant Scope, Branch Scope, Caller Field Protection, Input Validation, Route Protection)
- **`[NOT_IMPLEMENTED]`**: 0
- **`[CONTRADICTED]`**: 0
- **`[UNKNOWN]`**: 0
