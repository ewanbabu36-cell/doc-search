# Phase 2 Frontend Auth & Session Routing Audit

## 1. Audit Scope & Inventory of Client-Side Authentication

| File / Component | Initial Behavior | Vulnerability / Bypass Risk | Remediation in Phase 2 |
|---|---|---|---|
| `apps/partner-platform/src/main.tsx` | Defaults to `DEMO_STAFF_USERS[0]` on load if storage empty | Auto-logs in as Dr. Rajesh Sharma without authentication | Initialize `currentUser = null`. Render real `HospitalStaffLogin` screen. |
| `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx` | Persona card clicks $\rightarrow$ `setTimeout(..., 400)` | Local state persona selection without password verification | Form inputs (Email + Password) $\rightarrow$ `POST /api/v1/auth/login` verifying cryptographic scrypt hash. |
| `apps/company-platform/src/components/auth/FounderLogin.tsx` | Role selector $\rightarrow$ `setTimeout(..., 400)` | Local state role switch without password verification | Form inputs (Email + Password) $\rightarrow$ `POST /api/v1/auth/login` verifying `founder.alok@docsearch.health`. |
| `apps/partner-platform/src/components/PartnerPlatformShell.tsx` | Reads `currentUser` from React prop | Relies on client state | Server-authorized session bootstrap validating active JWT and permissions. |
| `apps/partner-platform/src/services/api-client.ts` | Hardcoded `http://localhost:4000` | Localhost hardcoding in client | Configurable API origin with automatic 401 interception and logout redirection. |
| Logout Handlers | `localStorage.removeItem()` only | Session remains valid in PostgreSQL `core.sessions` table | `POST /api/v1/auth/logout` called on backend before clearing local storage. |

---

## 2. Server-Authoritative Role Routing Concept
```
Browser Login (Email + Password)
               ↓
    POST /api/v1/auth/login
               ↓
Fastify API Gateway + scrypt verification
               ↓
Server Returns: { user: { id, email, roles, permissions, tenantId, branchId }, accessToken }
               ↓
Client Stores Access Token
               ↓
PartnerPlatformShell renders only authorized tabs based on server-resolved roles & permissions
```
