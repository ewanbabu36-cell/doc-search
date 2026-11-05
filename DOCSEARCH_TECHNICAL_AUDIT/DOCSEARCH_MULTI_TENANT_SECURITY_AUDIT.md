# DOCSEARCH MULTI-TENANT SECURITY AUDIT
**Zero Cross-Tenant Data Leakage, Row-Level Security (RLS), and RBAC Governance**
**Document ID:** `DOCSEARCH-AUDIT-004`  
**Audit Date:** 05 November 2026  
**Auditor:** Principal Application Security Engineer & Forensic Systems Auditor  
**Scope:** Multi-Tenant Isolation Primitives, Row-Level Security (RLS), Fastify Auth Guards, and IDOR Vulnerabilities  
**Target Platform:** Doc Search API Gateway & PostgreSQL Database  

---

## 1. EXECUTIVE SUMMARY & ZERO CROSS-TENANT DATA LEAKAGE MANDATE

In a multi-tenant healthcare SaaS platform, cross-tenant data leakage is a **P0 Critical Severity Failure**. Under Indian statutory regulations (DPDP Act 2023, IT Act SPDI Rules 2011) and international healthcare security standards (HIPAA / ISO 27799), exposing Patient Health Information (PHI) or financial ledgers of Hospital A to Hospital B incurs severe statutory penalties and criminal liability.

The forensic audit evaluated whether tenant isolation is strictly enforced at both the database engine level and the API application layer.

```
+---------------------------------------------------------------------------------------+
|                       MULTI-TENANT SECURITY EVALUATION MATRIX                         |
+--------------------------+---------------------+-------------------+------------------+
| Security Dimension       | Mandated Standard   | Empirical State   | Classification   |
+--------------------------+---------------------+-------------------+------------------+
| Database Engine RLS      | 100% of Core Tables | 20 of 514 (3.89%) | FAIL (P0)        |
| RLS Bypass Exposure      | 0 Unprotected Tables| 494 Tables No RLS | FAIL (P0)        |
| API Token Tenant Scoping | Strict JWT Claims   | Verified in D:    | PASS             |
| UUID Format Hardening    | Rejects Malformed   | 100% Validated    | PASS             |
| SuperAdmin GodMode Guard | Blocked for Doctors | 100% Enforced     | PASS             |
| C: Drive Mirror State    | Compilable Guards   | Stripped/Missing  | FAIL (P0)        |
| Overall Isolation Status | ZERO LEAKAGE GATE   | CONDITIONAL / P0  | FAIL (P0)        |
+--------------------------+---------------------+-------------------+------------------+
```

---

## 2. DATABASE ENGINE ROW-LEVEL SECURITY (RLS) AUDIT

PostgreSQL provides native Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), which intercepts all SQL statements at the database kernel and restricts rows based on session variables (`set_config('app.current_tenant_id', ...)`).

### 2.1 Empirical RLS Activation Status
A query against `pg_tables` in the live PostgreSQL 18 cluster (`docsearch`) revealed:
- **Total Tables in Core Schemas (`clinical`, `company`, `core`, `pharmacy`):** 514 tables.
- **Tables with RLS ENABLED (`rowsecurity = true`):** **20 tables (3.89%)**.
- **Tables with RLS DISABLED (`rowsecurity = false`):** **494 tables (96.11%)**.

```
+---------------------------------------------------------------------------------------+
|                              TABLES WITH RLS ACTIVE (20)                              |
+-------------------+-------------------------------------------------------------------+
| Schema: core      | sessions, user_tenants, user_branches, audit_events,               |
|                   | ai_chat_conversations, ai_chat_messages                           |
+-------------------+-------------------------------------------------------------------+
| Schema: company   | partner_onboarding_staged_registrations                            |
+-------------------+-------------------------------------------------------------------+
| Schema: clinical  | cdss_audit_traces, ambient_ai_scribe_transcripts,                  |
|                   | sepsis_news2_alerts, clinical_safety_alerts                       |
+-------------------+-------------------------------------------------------------------+
```

### 2.2 The 494 Unprotected Tables Vulnerability (P0 - Critical)
Core clinical, commercial, and financial tables—including:
- `clinical.patients`
- `clinical.encounters`
- `clinical.prescriptions`
- `clinical.pharmacy_batches`
- `clinical.pharmacy_inventory`
- `clinical.billing_invoices`
- `company.subscriptions`

**do not have PostgreSQL Row-Level Security enabled**. They rely exclusively on application-level filtering (`WHERE tenant_id = $1` in TypeScript repositories).

> [!CAUTION]
> **P0 Architectural Risk:** Because RLS is disabled on 494 tables, if a software engineer accidentally omits `.where(eq(table.tenantId, tenantId))` in any repository query or raw SQL string, the database will return records from **all hospitals and clinics in the multi-tenant database**.

---

## 3. API GATEWAY AUTHENTICATION & SCOPE ENFORCEMENT

The API Gateway layer in `D:\DOC SEARCH\apps\api-gateway\src\plugins\auth-guard.ts` implements defensive controls:

### 3.1 Token Verification & Claims Extraction
- Uses Ed25519 / RS256 / HS256 JWT validation.
- Extracts standard session claims: `tenantId`, `partnerId`, `branchId`, `roles`, and `isSuperAdmin`.
- Injects claims into the Fastify request context: `req.session = { tenantId, partnerId, ... }`.

### 3.2 Role-Based Access Control (RBAC) & GodMode Boundaries
Empirical execution of `phase2-forensic-security-and-multitenant.test.mjs` confirmed:
1. **Founder / SuperAdmin Route Protection:** Clinical users (e.g., `DOCTOR`, `NURSE`, `PHARMACIST`) cannot access Central SaaS GodMode endpoints (`/api/v1/company/*`). Requests return HTTP 403 Forbidden.
2. **UUID Format Tampering:** Route parameters undergo strict UUID validation via `uuid-guard.ts`. Tampered IDs (e.g., `1234-admin`, SQL injection strings) are rejected before database dispatch with HTTP 400.
3. **Cross-Tenant IDOR Protection:** Repositories filter on `and(eq(table.id, id), eq(table.tenantId, session.tenantId))`. Querying an entity belonging to another tenant returns HTTP 404 (Not Found), preventing entity existence enumeration.

---

## 4. MULTI-TENANT DEFECT REGISTER

| Defect ID | Severity | Component | Forensic Defect Description |
|---|---|---|---|
| **SEC-01** | `P0 - Critical` | PostgreSQL Database | **96.1% of Tables Lack Engine RLS.** 494 core tables lack `ENABLE ROW LEVEL SECURITY`. Relying exclusively on application-level WHERE clauses violates the defense-in-depth isolation mandate. |
| **SEC-02** | `P0 - Critical` | Monorepo C: Workspace | **Stripped Authentication Package.** `packages/auth` on `C:\Users\alamr\OneDrive\Desktop\DOC SEARCH` is completely empty. Deployments initiated from C: possess zero security middleware. |
| **SEC-03** | `P1 - High` | Database Auth Service | **Empty Password DB Error.** During automated testing, `real-auth-service` outputs `error: empty password returned by client`, indicating unhandled edge cases in local password hashing workflows. |
| **SEC-04** | `P1 - High` | Token Revocation Cache | **In-Memory Session Revocation.** `sessionRevocationService` uses an in-memory Set rather than a distributed Redis cache. In a multi-instance production cluster, revoking a compromised token on Node 1 fails to invalidate it on Node 2. |

---

## 5. MULTI-TENANT SECURITY VERDICT

- **Authoritative Repository (D:):** `CONDITIONAL PASS`. Application-level tenant scoping and RBAC guards are functional and pass automated isolation tests. However, database engine RLS coverage is incomplete (only 3.89%).
- **C: Drive Workspace Mirror:** `CRITICAL FAIL (P0)`. Empty package skeletons provide zero security guarantees.
- **Production Gate Verdict:** **BLOCKED (P0)**. RLS must be activated on all 514 core tables prior to multi-tenant production launch.
