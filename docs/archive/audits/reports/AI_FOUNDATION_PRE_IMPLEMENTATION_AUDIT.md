# DOC SEARCH — AI FOUNDATION & SECURE AI CORE
## STEP 0: PRE-IMPLEMENTATION ARCHITECTURE & SECURITY AUDIT

**Target Phase**: DOC SEARCH — AI Foundation & Secure AI Core  
**Certified Baseline Commit**: `b9014652966801f219293fe987050036f600e63a` (Phase 8 Revenue Launch Certification)  
**Security Baseline Freeze**: 100% Invariant Compliance  
**Date**: September 4, 2026  

---

### 1. Existing Architecture & Context

DOC SEARCH / Intelligent Hospital Operating System is a production-grade multi-tenant healthcare enterprise application operating on Node.js/TypeScript, Fastify, Drizzle ORM, and PostgreSQL.

The system completed **Phase 8: Production Revenue Launch & SaaS Entitlement Certification** (23/23 PASS) and **Phase 7: Production Clinical Certification** (15/15 PASS), establishing:
* Authoritative server-side JWT authentication (`@docsearch/auth`).
* Session-derived RBAC with granular permissions and role hierarchy.
* Database-level multi-tenant isolation and branch scoping (`0044_clinical_ai_rls.sql`, `core.get_current_tenant_id()`).
* Database-driven subscription and commercial entitlement engine (`company.plan_entitlements`, `EntitlementService`).
* Cryptographic HMAC-SHA256 license integrity verification (`LicenseService`).
* Tamper-evident persistent audit logging with SHA-256 integrity chaining (`core.audit_events`, `AuditRepository`).

---

### 2. Existing Security Boundaries

The system enforces strict multi-layered security boundaries that must NEVER be bypassed:
1. **Transport & Network Boundary**: TLS termination, CORS policy, secure cookie / header transmission.
2. **Authentication Gate**: Stateless cryptographic JWT verification yielding an immutable `SessionContext` (`userId`, `tenantId`, `branchId`, `roles`, `permissions`, `isSuperAdmin`).
3. **Commercial Entitlement Gate**: Pre-handler `requireActiveCommercialAccess` validating organization subscription status and license expiry against database records.
4. **Tenant Isolation Boundary**: All queries are scoped by `session.tenantId`. Client-supplied tenant identifiers in URL query parameters or request bodies are strictly checked or ignored.
5. **Branch Scope Boundary**: Non-admin hospital users are locked to their assigned `session.branchId`.
6. **Data Privacy Boundary**: Patient health information (PHI) is protected under minimum-necessary access principles. Patients may only view their own records bound to their verified `patientMrn`.
7. **Audit & Non-Repudiation Boundary**: All state mutations and sensitive queries produce immutable audit records with SHA-256 cryptographic chaining.

---

### 3. Existing Reusable Services & Modules

The AI Foundation builds upon and reuses the following core production modules without duplication:
* **`@docsearch/auth`**:
  * `SessionContext`: Authoritative security context.
  * `RBACEvaluator`: Evaluates `hasPermission()` and `hasAnyRole()`.
* **`apps/api-gateway/src/services/company/EntitlementService.ts`**:
  * `canAccess(session, featureCode)`: Authoritative database check for commercial entitlement `MODULE_AI_COPILOT`.
* **`apps/api-gateway/src/services/company/LicenseService.ts`**:
  * `verifyLicense(tenantId)`: HMAC-SHA256 signature verification and temporal expiry validation.
* **`apps/api-gateway/src/repositories/core/AuditRepository.ts`**:
  * `recordEvent(event, session)`: Persists structured audit events into `core.audit_events` with SHA-256 checksum and hash chaining.
* **`packages/database/src/client.ts`**:
  * `withSecurityContext(session, callback)`: Sets PostgreSQL session variables `app.current_tenant_id` and `app.current_branch_id` for database-level RLS.
* **`@docsearch/shared-core`**:
  * `AppError`, `ErrorCode`, `createLogger`: Standardized error and logging framework.

---

### 4. Identified Gaps Prior to AI Foundation Hardening

1. **AI Output Trust vs Security Decision**: LLM output cannot make authorization decisions. A strict server-side Permission Firewall is mandatory before tool invocation or execution.
2. **Capability & Tool Registry**: AI capabilities and tools must be explicitly registered with strict input/output Zod schemas, risk levels, and role restrictions. Zero arbitrary code or SQL execution.
3. **Human-in-the-Loop (HITL) Enforcement**: Clinical suggestions or high-risk mutations must require explicit, authenticated clinician confirmation with role and identity verification.
4. **Prompt Injection & Context Tampering**: The model or malicious caller must never be able to manipulate `tenantId`, `branchId`, `userId`, `role`, or `permissions` via prompts or payload parameters.
5. **Audit Chaining**: AI executions must be cryptographically chained and recorded in persistent database storage without leaking credentials or raw PHI.

---

### 5. Existing AI Components

The AI architecture is structured in `apps/api-gateway/src/ai/`:
* `types.ts`: Core interfaces (`AiRequestContext`, `AiCapabilityDefinition`, `AiToolDefinition`, `PermissionFirewallResult`, `AiModelProvider`, `AiExecutionResult`).
* `capability-registry.ts`: Registry containing 11 verified clinical, financial, and operational capabilities with risk levels and role/scope constraints.
* `tool-registry.ts`: Registry containing 13 verified tools with Zod schema validation, strictly scoped to domain handlers.
* `permission-firewall.ts`: 9-gate fail-closed evaluation engine (Identity, Tenant, Branch, Capability, Role Escalation, Patient Isolation, RBAC, Permission, Tool, Entitlement, HITL).
* `role-context.ts`: Authoritative mapping between session roles (Owner, Manager, Doctor, Nurse, Reception, Pharmacy, Lab, Finance, Patient) and permitted capabilities/tools.
* `ai-core.ts`: Central AI Core orchestrator managing context derivation, firewall evaluation, tool/model execution, usage telemetry, and persistent audit recording.
* `provider-interface.ts`: Provider abstraction decoupling AI Core from specific LLMs (defaulting to deterministic reference provider for reliable, crash-safe verification).
* `apps/api-gateway/src/routes/partner/ai-foundation.routes.ts`: Authenticated HTTP endpoints under `/api/v1/partner/ai/*`.

---

### 6. Files to Reuse

| File / Module | Purpose |
| :--- | :--- |
| `packages/auth/src/*` | JWT parsing, session creation, RBAC evaluation |
| `packages/database/src/schema/*` | PostgreSQL DDL definitions (`core`, `company`, `clinical`, etc.) |
| `packages/database/src/client.ts` | Drizzle ORM client and `withSecurityContext` RLS wrapper |
| `apps/api-gateway/src/plugins/auth-guard.ts` | HTTP authentication preHandler |
| `apps/api-gateway/src/plugins/commercial-guard.ts` | Commercial subscription & license preHandler |
| `apps/api-gateway/src/services/company/EntitlementService.ts` | Authoritative commercial entitlement verification |
| `apps/api-gateway/src/services/company/LicenseService.ts` | Cryptographic license verification |
| `apps/api-gateway/src/repositories/core/AuditRepository.ts` | Database-backed audit trail with SHA-256 hash chaining |

---

### 7. Files That Must NOT Be Modified

* `tests/certification/phase7-critical-workflows.mjs` (Phase 7 certified baseline)
* `tests/certification/phase8-revenue-launch.mjs` (Phase 8 certified baseline)
* `PATIENT_REVENUE_JOURNEY_CHECKPOINT_B.md` (Untracked user deliverable)
* Any existing database migration files `0000_*.sql` through `0043_*.sql`
* Core billing calculations or invariant verification logic

---

### 8. Proposed Implementation Map

```text
               +-------------------------------------------------------------+
               |                  Incoming AI Request                        |
               +-------------------------------------------------------------+
                                              |
                                              v
               +-------------------------------------------------------------+
               |      Fastify HTTP Plugin: authenticate (JWT verification)   |
               +-------------------------------------------------------------+
                                              |
                                              v
               +-------------------------------------------------------------+
               |   Fastify HTTP Plugin: requireActiveCommercialAccess        |
               +-------------------------------------------------------------+
                                              |
                                              v
               +-------------------------------------------------------------+
               |       AI Core: Derives server-trusted AiRequestContext      |
               +-------------------------------------------------------------+
                                              |
                                              v
               +-------------------------------------------------------------+
               |             AiPermissionFirewall (9 Gates)                  |
               |  1. Identity Check          6. Granular Permission Check    |
               |  2. Tenant Isolation Check  7. Tool Whitelist & Schema Check|
               |  3. Branch Scope Check      8. Commercial Entitlement Check |
               |  4. Capability Whitelist    9. Human-in-the-Loop (HITL) Gate|
               |  5. Role Escalation Check                                   |
               +-------------------------------------------------------------+
                                              |
                                  [Any check fails? -> DENY 400/401/403]
                                              |
                                        [All PASS]
                                              |
                                              v
               +-------------------------------------------------------------+
               |      Controlled Tool Execution OR Deterministic Model Call  |
               +-------------------------------------------------------------+
                                              |
                                              v
               +-------------------------------------------------------------+
               |         AuditRepository: Persistent SHA-256 Audit Log       |
               +-------------------------------------------------------------+
                                              |
                                              v
               +-------------------------------------------------------------+
               |             Usage Telemetry & Response Packaging            |
               +-------------------------------------------------------------+
```

---

### 9. Audit Sign-Off

The existing codebase architecture and security boundaries are fully audited and validated. All foundation components are prepared for comprehensive certification testing under `tests/certification/ai-foundation-certification.mjs`.
