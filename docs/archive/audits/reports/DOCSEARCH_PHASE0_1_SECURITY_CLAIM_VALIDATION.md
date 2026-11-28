# DOC SEARCH — PHASE 0.1: SECURITY CLAIM VALIDATION & RLS AUDIT
**Document ID:** `DOCSEARCH-P01-SEC-001`  
**Audit Phase:** Phase 0.1 — Independent Audit Challenge & Claim Validation  
**Baseline Commit:** `39eaff5`  
**Classification:** Enterprise Security, Tenant Isolation & Cryptographic Audit  
**Status:** ZERO-TRUST FORENSIC DEFECT DISCLOSED  

---

## 1. THE CRITICAL RLS SUPERUSER DISCOVERY

In Phase 0, the audit declared:
> *"Multi-tenant isolation is secured via PostgreSQL Row-Level Security (RLS) policies on 444 tables, preventing cross-tenant data leaks at the database engine level."*

### Empirical Database Finding:
Direct forensic inspection of the PostgreSQL 18.4 database roles and connection string revealed a **critical architectural gap**:

```
Role Name: postgres
Attributes: rolsuper = true, rolbypassrls = true
```

1. **Superuser Bypass Invariant**: In PostgreSQL, any user with `rolsuper = true` or `rolbypassrls = true` **completely bypasses Row-Level Security policies**, even if `relforcerowsecurity = true` is set on the table!
2. **Runtime Connection Configuration** (`.env`, line 4):
   ```bash
   DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/docsearch
   ```
   The backend API Gateway connects to the database as **`postgres`** (the superuser)!
3. **Forensic Proof of Cross-Tenant Leakage at Raw DB Layer**:
   Executing `SELECT count(*) FROM clinical.patients;` as user `postgres` without setting `app.current_tenant_id` returned **3 rows** (patients across all tenants).
4. **Where Tenant Isolation is Actually Enforced**:
   Because `postgres` bypasses RLS, **tenant isolation currently relies 100% on application-layer Drizzle ORM queries** (`where(eq(table.tenantId, tenantId))`), NOT on PostgreSQL engine RLS!

> [!WARNING]
> **Production Security Mandate (SEC-P01-01)**:  
> The database contains an existing dedicated non-superuser role: `docsearch_app` (`rolsuper: false, rolbypassrls: false`).  
> Before multi-facility production deployment, `DATABASE_URL` must be reconfigured to connect as `docsearch_app`, and the Fastify connection pool must issue `SET LOCAL app.current_tenant_id = $1` on every transaction to activate true engine-level RLS enforcement!

---

## 2. SECURITY CLAIMS AUDIT MATRIX

| Security Dimension | Phase 0 Claim | Independent Finding | Verification Method & Evidence | Validated Status |
| :--- | :--- | :--- | :--- | :---: |
| **Authentication (JWT)** | Signed with HMAC-SHA256, 3600s expiry | `packages/auth/src/jwt.ts` verifies signature, issuer (`docsearch-api`), and expiry. | Tested via tampered token script; returns HTTP 401 Unauthorized. | **VERIFIED** |
| **Password Hashing** | PBKDF2 / Argon2id with unique salt | `packages/auth/src/password.ts` uses PBKDF2 with 100,000 iterations and 32-byte salt. | Verified: 0 plaintext passwords stored in `core.user_credentials`. | **VERIFIED** |
| **Tenant Isolation (RLS)** | Database engine level RLS on 444 tables | RLS policies exist in SQL, but bypassed at runtime due to `postgres` superuser connection. | Tested in `scratch/test_rls_query.mjs`: `postgres` role returned rows without tenant context. | **APPLICATION LAYER ONLY (DB BYPASSED)** |
| **Authorization (RBAC)** | Role claims validated via `requireRoles` | `auth-guard.ts` evaluates `session.roles` against route requirements. | Unauthorized role calls return HTTP 403 Forbidden. | **VERIFIED** |
| **Sensitive Health Data (PHI)** | PII/PHI redacted in application logs | `packages/shared-core/src/logger/` masks Aadhaar, phone, and clinical notes. | Log inspection confirms masking regexes are active. | **VERIFIED** |
| **Webhook Tampering** | Razorpay HMAC-SHA256 signature verification | `routes/webhooks/` uses `crypto.timingSafeEqual` against `RAZORPAY_WEBHOOK_SECRET`. | Rejects tampered payloads with HTTP 401. | **VERIFIED** |
| **Disaster Recovery Key** | AES-256-GCM master key outside database | Master key stored in `backups/keys/master_dr.key` with restricted permissions. | Verified: DB backup payloads are encrypted using authenticated GCM mode. | **VERIFIED** |
| **Audit Trail Immutability** | `core.audit_events` append-only table | Drizzle schema lacks UPDATE/DELETE endpoints for audit logs. | Verified: Audit events record actor, IP, timestamp, and action. | **VERIFIED** |

---

## 3. REPRESENTATIVE CROSS-TENANT PENETRATION TEST

A targeted cross-tenant access test was executed against `POST /api/v1/partner/patients`:
- **Scenario**: User authenticated with Tenant A JWT attempted to query patient ID belonging to Tenant B (`GET /api/v1/partner/patients/:id`).
- **Application Layer Behavior**: The repository query evaluated `and(eq(patients.id, id), eq(patients.tenantId, session.tenantId))`.
- **Result**: Returned HTTP 404 Not Found.
- **Verdict**: Application-layer tenant isolation is **functioning correctly**, but remains vulnerable if a future route author forgets the `eq(table.tenantId)` filter, because the superuser DB connection will not catch it.

---

## 4. SUMMARY OF SECURITY RECOMMENDATIONS

1. **Switch Database Connection to `docsearch_app`**: Strip `rolsuper` and `rolbypassrls` from the application's runtime database user.
2. **Inject Session RLS Variable**: Wrap Fastify database requests in a transaction that executes `SET LOCAL app.current_tenant_id = $1`.
3. **Rotate Master Encryption Key**: Generate a cryptographically random 256-bit key from an external AWS KMS / HashiCorp Vault in production.
