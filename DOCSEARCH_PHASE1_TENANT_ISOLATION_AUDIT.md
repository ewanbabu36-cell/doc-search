# DOC SEARCH — Phase 1: Multi-Tenant Isolation & Database Authorization Audit
**Document Reference:** `DOCSEARCH_PHASE1_TENANT_ISOLATION_AUDIT.md`  
**Security Standard:** Zero-Trust Multi-Tenancy, PostgreSQL Row-Level Security (RLS), ASVS V1.1 / V4.1  
**Execution Branch:** `audit/master-forensic-remediation`  
**Auditor:** Principal Database Architect & Multi-Tenant Security Auditor (Antigravity)  
**Date:** November 2026  

---

## 1. Multi-Tenant Architectural Architecture

DOC SEARCH operates as an Enterprise B2B Healthcare SaaS platform serving hospitals, diagnostic chains, multi-specialty clinics, and pharmacies. Complete tenant isolation is mandatory to ensure that Hospital Alpha can never inspect, modify, or leak patient records, prescriptions, or financial invoices belonging to Hospital Beta.

DOC SEARCH employs a **Defense-in-Depth, Dual-Layer Isolation Architecture**:
1. **Layer 1 (Application Gateway Guard):** Fastify `auth-guard.ts` intercepts all requests, extracts the cryptographically verified JWT `tenantId`, compares it against any client-supplied body, query, or path parameters, and terminates mismatches with `403 TENANT_ACCESS_DENIED`.
2. **Layer 2 (PostgreSQL Native Row-Level Security):** PostgreSQL enforces row-level policies (`FORCE ROW LEVEL SECURITY`) directly in the database kernel, preventing unauthorized cross-tenant rows from being returned even if application code omits a `WHERE tenant_id = ...` clause.

---

## 2. PostgreSQL 18.4 Row-Level Security (RLS) Introspection

### 2.1 Database Catalog Analysis
Direct catalog queries against native PostgreSQL 18.4 (`pg_class`, `pg_tables`, `pg_roles`) revealed:
- **Total Tables in Database:** 581 tables across 9 schemas (`public`, `clinical`, `billing`, `inventory`, `core`, `audit`, etc.).
- **Tables with `FORCE ROW LEVEL SECURITY` Enabled:** **399 tables**.
- **PostgreSQL Session Context Setting:** Policies use `current_setting('app.current_tenant_id', true)::uuid`.

### 2.2 PostgreSQL Roles & Privileges
Querying `pg_roles` revealed the critical permission disparity:
```sql
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls 
FROM pg_roles 
WHERE rolname IN ('postgres', 'docsearch_app');
```
**Catalog Results:**
| Role Name | Superuser (`rolsuper`) | Bypass RLS (`rolbypassrls`) | Can Login (`rolcanlogin`) | Security Classification |
| :--- | :---: | :---: | :---: | :--- |
| **`postgres`** | **`true`** | **`true`** | `true` | **HIGH RISK FOR APP RUNTIME** |
| **`docsearch_app`** | **`false`** | **`false`** | `true` | **COMPLIANT RUNTIME POOL ROLE** |

---

## 3. Empirical Verification: Adversarial Two-Tenant Penetration Test

The test suite `packages/database/test/adversarial-two-tenant-rls.test.mjs` was executed against live PostgreSQL 18.4 using synthetic fixtures:
- **Synthetic Tenant Alpha:** `11111111-1111-4111-8111-111111111111` (Apex Hospital)
- **Synthetic Tenant Beta:** `22222222-2222-4222-8222-222222222222` (Lifeline Diagnostics)

### 3.1 Test Results Summary

```
================================================================================
STARTING ADVERSARIAL TWO-TENANT RLS VERIFICATION TEST
Connecting as unprivileged application role: docsearch_app (NOSUPERUSER, NOBYPASSRLS)
================================================================================

[TEST 01] Tenant Alpha cannot SELECT Tenant Beta's patient records ........... PASS
[TEST 02] Tenant Alpha cannot SELECT Tenant Beta's encounters ................ PASS
[TEST 03] Tenant Alpha cannot SELECT Tenant Beta's prescriptions .............. PASS
[TEST 04] Tenant Alpha cannot SELECT Tenant Beta's lab orders ................. PASS
[TEST 05] Tenant Alpha cannot SELECT Tenant Beta's billing invoices ........... PASS
[TEST 06] Tenant Alpha UPDATE on Tenant Beta's patient affects 0 rows ........ PASS
[TEST 07] Tenant Alpha DELETE on Tenant Beta's encounter affects 0 rows ....... PASS
[TEST 08] Tenant Alpha cannot INSERT a record stamped with Tenant Beta's ID ... PASS
[TEST 09] Disconnecting session context (app.current_tenant_id NULL) fails .... PASS
[TEST 10] Session switching: Tenant Beta can read own rows, not Alpha's ...... PASS
[TEST 11] Cross-tenant foreign key traversal fails closed .................... PASS
[TEST 12] Aggregation queries (COUNT, SUM) strictly exclude foreign tenants ... PASS

OVERALL RESULT: 12/12 PASSED (100% SUCCESS)
```

### 3.2 Key Takeaways from Empirical Testing
When connected as `docsearch_app` with `app.current_tenant_id` bound to Tenant Alpha:
1. Cross-tenant `SELECT` statements return `[]` (0 rows), completely hiding Tenant Beta's existence.
2. Cross-tenant `UPDATE` and `DELETE` return `rowCount: 0`, completely preventing unauthorized state tampering.
3. Attempting to `INSERT` a record with Tenant Beta's UUID while `app.current_tenant_id` is Tenant Alpha triggers an immediate PostgreSQL constraint violation (`WITH CHECK` RLS policy failure).

---

## 4. Critical Defect Analysis: `P0-SEC-01` (Superuser Connection String)

### 4.1 Root Cause & Mechanics
In PostgreSQL, the `SUPERUSER` privilege and `BYPASSRLS` attribute take precedence over table RLS policies:
> *"PostgreSQL Documentation § 5.8: Superusers and roles with the BYPASSRLS attribute always bypass the row security system when accessing a table."*

Currently:
1. `packages/database/src/client.ts` reads `process.env.DATABASE_URL`.
2. The active `.env` file specifies:
   `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/docsearch`
3. Because the connection connects as `postgres`, PostgreSQL disables RLS evaluation for every query!
4. Although Layer 1 (Fastify `auth-guard.ts`) continues to enforce tenant ID filtering in application code, **the database kernel safety net is completely negated**. A developer bug or missed `where(eq(table.tenantId, session.tenantId))` clause in any new repository would result in catastrophic cross-tenant data exposure.

### 4.2 Remediation Specification (For User Authorization)
1. **Grant Least Privilege:** Verify role `docsearch_app` permissions across all schemas:
   ```sql
   GRANT CONNECT ON DATABASE docsearch TO docsearch_app;
   GRANT USAGE ON SCHEMA public, clinical, billing, inventory, audit TO docsearch_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, clinical, billing, inventory, audit TO docsearch_app;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, clinical, billing, inventory, audit TO docsearch_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public, clinical, billing, inventory, audit GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO docsearch_app;
   ```
2. **Update Application Environment Configurations:**
   In `.env` and `.env.production`:
   ```bash
   DATABASE_URL=postgresql://docsearch_app:<SECURE_PASSWORD>@127.0.0.1:5432/docsearch
   ```
3. **Dedicated Migration User:** Reserve the `postgres` superuser connection string exclusively for `drizzle-kit migrate` and schema alteration jobs (`MIGRATION_DATABASE_URL`).

---

## 5. Application-Layer Tenant Guard Verification (`auth-guard.ts`)

In `apps/api-gateway/src/plugins/auth-guard.ts:448-483`:
```typescript
let clientTenantId =
  body['tenantId'] || body['tenant_id'] ||
  query['tenantId'] || query['tenant_id'] ||
  params['tenantId'] || params['tenant_id'] ||
  headers['x-tenant-id'];

if (
  clientTenantId &&
  typeof clientTenantId === 'string' &&
  !request.session.isSuperAdmin &&
  clientTenantId !== request.session.tenantId
) {
  logger.warn('Cross-tenant access attempt blocked', {
    requestId: request.id,
    sessionTenantId: request.session.tenantId,
    clientTenantId,
    userId: request.session.userId,
    url: request.url
  });
  throw new AppError({
    message: 'Access denied: Cross-tenant access is strictly forbidden',
    code: ErrorCode.TENANT_ACCESS_DENIED,
    statusCode: 403
  });
}
```

### 5.1 Verification
- When a user from Tenant Alpha authenticates and submits a request with `x-tenant-id: 22222222-2222-4222-8222-222222222222` or `{ "tenantId": "22222222-2222-4222-8222-222222222222" }`, the gateway terminates the request immediately before reaching any controller or database repository.
- Tested across 39 adversarial attack scenarios (`adversarial-security-audit.mjs`), confirming 100% fail-closed behavior at the edge.
