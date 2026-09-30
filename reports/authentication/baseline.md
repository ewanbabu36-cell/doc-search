# DOC SEARCH — CATEGORY 11: AUTHENTICATION BASELINE REPORT

**Audit Date:** 2026-09-29T02:11:07.818Z  
**Auditor:** Antigravity Authentication & Identity Auditor  
**Scope:** Full Monorepo (`D:\DOC SEARCH`)  

---

## 1. Authentication Architecture Inventory

### A. Login & Session Endpoints
| Endpoint | Method | File | Backend Handler |
| :--- | :---: | :--- | :--- |
| `/api/v1/auth/login` | `POST` | `apps/api-gateway/src/routes/auth.routes.ts` | `realAuthService.authenticateUser` |
| `/api/v1/auth/quick-session` | `POST` | `apps/api-gateway/src/routes/auth.routes.ts` | `sessionService.createSession (requires verified JWT header, disabled in prod)` |

### B. Logout Endpoints
| Endpoint | Method | File | Backend Handler |
| :--- | :---: | :--- | :--- |
| `/api/v1/auth/logout` | `POST` | `apps/api-gateway/src/routes/auth.routes.ts` | `EMPTY_STUB (Does not revoke session or token!)` |

### C. Refresh Endpoints
| Endpoint | Method | File | Backend Handler |
| :--- | :---: | :--- | :--- |
| `/api/v1/auth/refresh` | `POST` | `apps/api-gateway/src/routes/auth.routes.ts` | `sessionService.rotateRefreshToken` |

### D. Registration & Password Endpoints
| Endpoint | Method | File | Backend Handler |
| :--- | :---: | :--- | :--- |
| `/api/v1/auth/register-partner-user` | `POST` | `apps/api-gateway/src/routes/auth.routes.ts` | `realAuthService.registerPartnerUserCredential` |
| `/api/v1/auth/self-register` | `POST` | `apps/api-gateway/src/routes/auth.routes.ts` | `partnerOnboardingRepository.createStagedRegistration` |
| `/api/v1/auth/demo-request` | `POST` | `apps/api-gateway/src/routes/auth.routes.ts` | `Public demo request` |
| `/api/v1/auth/change-password` | `POST` | `apps/api-gateway/src/routes/auth.routes.ts` | `realAuthService.changePassword` |
| `/api/v1/company/partner-access-control/:partnerId/reset-password` | `POST` | `apps/api-gateway/src/routes/company/partner-access-control.routes.ts` | `realAuthService.resetPartnerPassword` |

---

## 2. Authoritative Database Tables
| Table | Schema File | Description |
| :--- | :--- | :--- |
| `core.users` | `packages/database/src/schema/core/users.ts` | Authoritative user identities (email, name, status, metadata) |
| `core.user_credentials` | `packages/database/src/schema/core/credentials.ts` | Cryptographic scrypt password hashes and failed attempt locks |
| `core.sessions` | `packages/database/src/schema/core/sessions.ts` | Server-persisted session records with refresh token hashes and expiry |
| `core.revocations` | `packages/database/src/schema/core/revocations.ts` | Append-only revocation ledger for users, tenants, branches, and sessions |
| `core.roles` | `packages/database/src/schema/core/roles.ts` | Role definitions and permissions |
| `core.memberships` | `packages/database/src/schema/core/memberships.ts` | User-tenant membership mappings and roles |
| `clinical.operational_staff` | `packages/database/src/schema/clinical/staff.ts` | Staff credentials and role profiles |

---

## 3. Discovered Vulnerabilities & Defects

### AUTH-VULN-01: POST /api/v1/auth/logout does not revoke session or token
- **Taxonomy:** I. LOGOUT ERROR & J. SESSION REVOCATION ERROR
- **Severity:** `CRITICAL`
- **Location:** `apps/api-gateway/src/routes/auth.routes.ts:573`
- **Description:** The logout route returns a static HTTP 200 without reading the Authorization token, calling sessionRevocationService.revokeSession, or marking the session revoked in core.sessions/core.revocations.

### AUTH-VULN-02: JWT jti claim is overwritten with random hex, disconnecting access tokens from sessionId
- **Taxonomy:** E. TOKEN CREATION ERROR & J. SESSION REVOCATION ERROR
- **Severity:** `CRITICAL`
- **Location:** `packages/auth/src/token-service.ts:61`
- **Description:** signJwt assigns jti: randomBytes(16).toString("hex") after spreading payload, overriding sessionId passed in payload.jti. Furthermore, SessionRevocationService.isRevoked checks claims.sessionId which is undefined.

### AUTH-VULN-03: SessionService defaults to InMemorySessionStore; core.sessions table is never populated
- **Taxonomy:** H. SESSION PERSISTENCE ERROR & 13. SESSION DATABASE VERIFICATION
- **Severity:** `HIGH`
- **Location:** `apps/api-gateway/src/routes/auth.routes.ts:133`
- **Description:** When REDIS_URL is not set, SessionService uses InMemorySessionStore. Sessions do not survive server restarts, and core.sessions in PostgreSQL remains with 0 rows.

### AUTH-VULN-04: HospitalStaffLogin checks localStorage for plaintext staff password before server auth
- **Taxonomy:** B. CREDENTIAL VERIFICATION ERROR & N. MOCK AUTHENTICATION
- **Severity:** `CRITICAL`
- **Location:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:833-877`
- **Description:** HospitalStaffLogin reads docsearch_partner_staff and docsearch_custom_staff from localStorage and authenticates locally if password matches, bypassing server-side credential verification.

### AUTH-VULN-05: Frontend login does not store refreshToken in localStorage
- **Taxonomy:** G. REFRESH TOKEN ERROR
- **Severity:** `HIGH`
- **Location:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:1030`
- **Description:** HospitalStaffLogin saves accessToken to docsearch_auth_token but fails to save refreshToken to docsearch_refresh_token, preventing ensureAuthToken() from refreshing expired sessions.

### AUTH-VULN-06: Password change does not revoke existing user sessions
- **Taxonomy:** J. SESSION REVOCATION ERROR
- **Severity:** `MEDIUM`
- **Location:** `apps/api-gateway/src/services/core/RealAuthService.ts:1091`
- **Description:** RealAuthService.changePassword updates passwordHash in memory and DB but does not call sessionRevocationService.revokeUser to invalidate existing tokens issued prior to password change.


---

## 4. Scan Counts Summary
- **Hardcoded Credential References:** 7
- **Suspicious Bypass References:** 8
- **Frontend LocalStorage Auth Authority References:** 24
- **Identified Core Vulnerabilities:** 6
