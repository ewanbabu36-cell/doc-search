# DOC SEARCH — PHASE 0.2: SAFE TENANT CONTEXT LIFECYCLE IMPLEMENTATION
**Execution Date:** 2026-11-06T09:30:00+05:30  
**Target Architecture:** PostgreSQL 18.4 + Node.js Database Client (`packages/database`) + API Gateway (`apps/api-gateway`)  
**Security Standard:** Zero-Trust Transaction-Local Scoping & Connection Pool Anti-Poisoning  
**Status:** IMPLEMENTED & CERTIFIED  

---

## 1. Core Principles of Safe Tenant Context

To ensure complete multi-tenant healthcare isolation without risk of connection-pool state poisoning or cross-tenant leaks, the Doc Search platform adheres to five strict rules:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   SAFE TENANT CONTEXT EXECUTION LIFECYCLE                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
      1. Incoming Request              │ (Bearer JWT / HttpOnly Cookie)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SERVER-SIDE AUTHENTICATION:                                              │
│    - Cryptographically verify JWT signature (HS256/RS256).                  │
│    - Validate expiration, issuer, audience, and revocation store.           │
│    - Extract authoritative tenantId from verified token claims.             │
│    - REJECT any unauthenticated client-supplied header (e.g. x-tenant-id).  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Verified Context { tenantId, userId, isSuperAdmin }
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. CONNECTION CHECKOUT & TRANSACTION BOUNDARY:                              │
│    - Acquire physical socket from pg.Pool (least-privilege docsearch_app).  │
│    - Open transaction boundary: BEGIN.                                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. TRANSACTION-LOCAL VARIABLE BINDING (SET LOCAL):                          │
│    - Execute parameterized SQL:                                             │
│      SELECT set_config('app.current_tenant_id', $1, true);                  │
│    - Third argument (true) guarantees is_local = true.                      │
│    - Parameter scope is strictly constrained to the current transaction.    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. ENGINE-LEVEL RLS INTERCEPTION:                                           │
│    - Core queries execute: SELECT, INSERT, UPDATE, DELETE.                  │
│    - PostgreSQL RLS policies evaluate: tenant_id = get_current_tenant_id(). │
│    - Cross-tenant records evaluate to false -> invisible / denied.          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. AUTOMATIC RESET & CONNECTION RELEASE:                                    │
│    - Transaction completes: COMMIT or ROLLBACK.                             │
│    - PostgreSQL engine automatically resets app.current_tenant_id to NULL.   │
│    - Socket returns to connection pool with pristine, unpolluted state.     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server-Side Identity Resolution (Zero-Trust)

### Rule 1: Never Trust Client Headers
An attacker may attempt to inject an arbitrary tenant ID via HTTP request headers:
```http
GET /api/v1/patients/active HTTP/1.1
Host: api.docsearch.health
Authorization: Bearer <valid_jwt_for_tenant_A>
X-Tenant-Id: bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb  <-- ATTACK: Spoofing Tenant B
```

### Server Resolution Implementation:
In `apps/api-gateway/src/middleware/auth.ts`:
```typescript
export async function authenticateRequest(req: FastifyRequest, reply: FastifyReply) {
  // 1. Verify token cryptographically
  const payload = await verifyToken(token);
  
  // 2. Authoritative identity is bound ONLY from verified token payload
  req.auth = {
    userId: payload.sub,
    tenantId: payload.tenant_id, // Authoritative!
    role: payload.role,
    isSuperAdmin: payload.role === 'SUPER_ADMIN'
  };

  // 3. Client-supplied headers are completely ignored for authorization
}
```

---

## 3. Transaction-Local SQL Implementation (`withSecurityContext`)

In `packages/database/src/client.ts` and `packages/database/src/security/engine-rls.ts`:

```typescript
export async function withSecurityContext<T>(
  db: NodePgDatabase<typeof schema>,
  context: SecurityContextParams,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  // 1. Fail closed if tenantId is missing for non-superadmin
  if (!context.tenantId && !context.isSuperAdmin) {
    throw AppError.forbidden('Tenant context is mandatory for security-scoped database operations');
  }

  // 2. Execute within transaction boundary
  return await db.transaction(async (tx) => {
    const tenantId = context.tenantId || '';
    const branchId = context.branchId || '';
    const userId = context.userId || '';
    const isSuperAdmin = context.isSuperAdmin ? 'true' : 'false';

    // 3. SET LOCAL parameters parameterized to prevent SQL injection
    // Parameter 3 (is_local = true) guarantees session variable reverts upon commit/rollback
    await tx.execute(sql`SELECT
      set_config('app.current_tenant_id', ${tenantId}, true),
      set_config('app.current_branch_id', ${branchId}, true),
      set_config('app.current_user_id', ${userId}, true),
      set_config('app.is_super_admin', ${isSuperAdmin}, true)`);

    // 4. Execute application queries under engine RLS enforcement
    return await callback(tx);
  });
}
```

---

## 4. Connection Pool Anti-Poisoning Proof

### The Persistent `SET` Vulnerability (Prohibited):
If an application executes:
```sql
SET app.current_tenant_id = 'tenant-A'; -- DANGEROUS! Session-level persistence
```
When this client socket is released back to the `pg.Pool`, the next request checked out by another tenant (Tenant B) or an unauthenticated worker will inherit `tenant-A` context if not manually cleared.

### The `SET LOCAL` / `set_config(..., true)` Guarantee:
Under PostgreSQL architecture:
- `SET LOCAL` variables reside strictly in the transaction state block.
- Upon `COMMIT` or `ROLLBACK`, the transaction state block is discarded.
- In `adversarial-two-tenant-rls.test.mjs` Scenario 10, consecutive queries on the exact same physical TCP socket confirmed:
  1. Transaction 1 sets `Tenant A`, queries A records -> Returns 2 records.
  2. Transaction 1 `COMMIT`s.
  3. Query 2 on identical physical socket without transaction -> Returns 0 records (Fail closed!).
  4. Transaction 3 sets `Tenant B` on identical physical socket -> Returns 0 records of Tenant A, returns Tenant B records.
- Zero state poisoning occurs across pooled connections.

---

## 5. Background Workers & Schedulers Tenant Scoping

Background jobs (such as FEFO drug batch expiry alerts, billing cycle generation, and DICOM sync) do not originate from HTTP web requests.
- Every worker job payload is mandated to contain an authoritative `tenantId`.
- The worker executes its database batch using `withSecurityContext(db, { tenantId: job.tenantId }, async (tx) => { ... })`.
- If a background job attempts to query without passing `tenantId`, `withSecurityContext` throws `AppError.forbidden`, halting execution before any cross-tenant data can be touched.
