# Phase 1 Auth Static Scan & Classification Report

## 1. Static Scan Inventory

| Pattern / Identifier | Locations | Classification | Action Taken / Status |
|---|---|---|---|
| `crypto.randomUUID()` in Login | `apps/api-gateway/src/routes/auth.routes.ts` | **PRODUCTION BUG** | **REMOVED**. Replaced with authoritative user ID from `core.users` credential store. |
| `permissions: ["*"]` in Login | `apps/api-gateway/src/routes/auth.routes.ts` | **PRODUCTION BUG** | **REMOVED**. Replaced with granular role-specific permissions (`lab:orders:create`, etc.). |
| `roles: ['HOSPITAL_ADMIN']` on any email | `apps/api-gateway/src/routes/auth.routes.ts` | **PRODUCTION BUG** | **REMOVED**. Replaced with role resolution from user identity. |
| `InMemorySessionStore` | `packages/auth/src/session-service.ts` | **TEST ONLY** | Retained in `packages/auth` strictly for unit test fixtures; production API Gateway uses `PostgresSessionStore`. |
| `DEMO_STAFF_USERS` | `apps/partner-platform/src/data/mock-staff-administration-data.ts` | **DEVELOPMENT ONLY** | Documented in `PHASE1_FRONTEND_AUTH_BLOCKERS.md` for complete UI form conversion in Phase 2. |
| `setTimeout(..., 400)` in Logins | `HospitalStaffLogin.tsx`, `FounderLogin.tsx` | **DEVELOPMENT ONLY** | Documented in `PHASE1_FRONTEND_AUTH_BLOCKERS.md` for real `POST /api/v1/auth/login` wiring in Phase 2. |
| `scrypt` password hashing | `packages/auth/src/password-service.ts` | **PRODUCTION STANDARD** | Active in `RealAuthService.ts` for real password verification. |
| `PostgresSessionStore` | `packages/database/src/schema/core/sessions.ts` | **PRODUCTION STANDARD** | Active for persistent session management. |

---

## 2. Production Path Guarantee
- The production authentication route (`POST /api/v1/auth/login`) contains **0 random UUID generators**, **0 wildcard permissions**, and **0 password bypasses**.
- Invalid credentials unconditionally yield `HTTP 401 Unauthorized`.
