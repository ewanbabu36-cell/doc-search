# DOC SEARCH — Security Architecture & Reference Model

## 1. Overview
DOC SEARCH operates a multi-tenant, multi-facility healthcare SaaS platform. This document defines the security architecture, token lifecycles, role-based access controls (RBAC), tenant isolation mechanisms, Row-Level Security (RLS) policies, and cryptographic audit hash chaining implemented in Wave 1.

---

## 2. Authentication & JWT Pipeline
```
HTTP Request
    │
    ▼
Authorization: Bearer <JWT>
    │
    ▼
Verify Header (alg === 'HS256')
    │
    ▼
Constant-Time Signature Check
    │
    ▼
Runtime Zod Claims Validation (sub, iat, exp, iss, aud, jti)
    │
    ▼
Verify Expiration (Fail Closed if expired or missing)
    │
    ▼
Verify Issuer & Audience
    │
    ▼
Build Immutable SessionContext (userId, tenantId, branchId, roles, permissions)
```

---

## 3. Refresh-Token Lifecycle & Reuse Detection
1. **Creation**: When a user authenticates, a 256-bit entropy random token is generated. Its SHA-256 hash is stored in `core.sessions`.
2. **Rotation**: Upon token refresh (`/auth/refresh`), the existing token is hashed and verified. A new refresh token is issued, and the session record is updated with the new hash.
3. **Reuse Detection**: If an already-rotated or revoked token hash is presented, the system detects a replay attack and revokes the entire `tokenFamilyId` session family.
4. **Logout**: Sets `revokedAt = NOW()` on the session.

---

## 4. Multi-Tenant & Branch Scoping
- **Tenant Scope**: Verified on every request. Data access across tenant boundaries is strictly rejected with HTTP 403 `TENANT_ACCESS_DENIED`.
- **Branch Scope**: When a user is scoped to a specific facility branch, requests for resources in other branches are denied with HTTP 403 `BRANCH_ACCESS_DENIED`.
- **Super Admin**: Only users with `SUPER_ADMIN` role have cross-tenant access.

---

## 5. PostgreSQL Row-Level Security (RLS)
The database client utilizes `withSecurityContext(db, context, callback)` to wrap operations in a transaction with local session variables:
```sql
SET LOCAL app.current_tenant_id = '<tenant-uuid>';
SET LOCAL app.current_branch_id = '<branch-uuid>';
SET LOCAL app.current_user_id = '<user-uuid>';
SET LOCAL app.is_super_admin = 'false';
```

RLS policies on core tables evaluate:
```sql
CREATE POLICY p_sessions_tenant_isolation ON core.sessions
  USING (core.is_super_admin() OR tenant_id = core.get_current_tenant_id())
  WITH CHECK (core.is_super_admin() OR tenant_id = core.get_current_tenant_id());
```

---

## 6. Cryptographic Audit Hash Chaining
Audit events in `core.audit_events` are tamper-evident:
$$\text{currentHash} = \text{SHA-256}(\text{canonicalJson}(\text{event}) + \text{previousHash})$$

Database trigger `trg_audit_events_immutability` prohibits all `UPDATE` and `DELETE` queries on audit tables.

---

## 7. Production Environment Configuration
```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@db-host:5432/docsearch_prod
DATABASE_SSL=true
DATABASE_SSL_CA=/path/to/prod-ca.pem
JWT_SECRET=<32-character-high-entropy-production-secret>
JWT_ISSUER=docsearch-api
JWT_AUDIENCE=docsearch-platform
ENCRYPTION_KEY=<64-character-hex-encryption-key>
CORS_ORIGIN=https://company.docsearch.health,https://partner.docsearch.health
```
