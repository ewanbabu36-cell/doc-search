# Phase 1 Auth Architecture Audit Documentation

## 1. Existing Architecture Inventory

| Component | Existing Schema / Location | Production Reality |
|---|---|---|
| **User Table** | `packages/database/src/schema/core/users.ts` (`core.users`) | Defines `id`, `email`, `first_name`, `last_name`, `status`, `is_email_verified`, `metadata`. |
| **Credential Table** | `packages/database/src/schema/core/credentials.ts` (`core.user_credentials`) | Defines `id`, `user_id`, `password_hash`, `failed_login_attempts`, `locked_until`, `last_password_change_at`. |
| **Role Table** | `packages/database/src/schema/core/roles.ts` (`core.roles`) | Defines `id`, `tenant_id`, `name`, `code`, `description`, `is_system`, `permissions` (JSONB). |
| **Tenant Membership** | `packages/database/src/schema/core/memberships.ts` (`core.tenant_memberships`) | Maps `user_id` to `tenant_id`, `role_id`, `status`. |
| **Branch Membership** | `packages/database/src/schema/core/memberships.ts` (`core.branch_memberships`) | Maps `user_id` to `branch_id`, `tenant_id`, `is_primary`. |
| **Session Table** | `packages/database/src/schema/core/sessions.ts` (`core.sessions`) | Defines `id`, `user_id`, `tenant_id`, `branch_id`, `token_family_id`, `refresh_token_hash`, `expires_at`, `revoked_at`. |
| **Audit Table** | `packages/database/src/schema/core/audit-events.ts` (`core.audit_events`) | Defines `id`, `event_type`, `resource_type`, `resource_id`, `tenant_id`, `branch_id`, `actor_id`, `metadata`. |
| **JWT Utilities** | `packages/auth/src/token-service.ts` | Uses `jsonwebtoken` (`signJwt`, `verifyJwt`, `generateRefreshToken`, `hashRefreshToken`). |
| **Password Hashing** | `packages/auth/src/password-service.ts` | Uses Node.js `crypto.scryptSync` with 16-byte random salt and `timingSafeEqual`. |

---

## 2. Identified Vulnerabilities in Previous Code
1. **Random User ID on Login**: `apps/api-gateway/src/routes/auth.routes.ts` previously executed `crypto.randomUUID()` instead of querying the user store.
2. **Hardcoded Role & Wildcard Permissions**: Previously assigned `roles: ['HOSPITAL_ADMIN']` and `permissions: ['*']` to any login.
3. **Password Verification Bypass**: Previously accepted any string without hashing/verification.
4. **InMemorySessionStore**: Process memory Map was used instead of PostgreSQL `core.sessions` table.
5. **No Tenant Isolation in Auth**: Allowed arbitrary client payloads to dictate tenant/branch.

---

## 3. Remediation Target in Phase 1
- Full database user lookup against `core.users` and `core.user_credentials`.
- Cryptographic verification via `verifyPassword(password, credential.passwordHash)`.
- Account status enforcement (`ACTIVE` vs `SUSPENDED`/`LOCKED`).
- Authoritative tenant and branch resolution from user memberships.
- Role-specific granular permissions without wildcard leakage.
- Persistent session storage in `core.sessions` with SHA-256 refresh token hashing and family rotation.
- Real audit events for `AUTH_USER_LOGGED_IN`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`.
