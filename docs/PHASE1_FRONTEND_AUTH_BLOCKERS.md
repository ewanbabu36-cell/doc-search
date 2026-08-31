# Phase 1 Frontend Auth Blockers Documentation

This document identifies all frontend persona selections, demo mocks, and fake timeout logins that will be migrated to the real `POST /api/v1/auth/login` endpoint in Phase 2.

## 1. Identified Frontend Blockers

| File Location | Line / Pattern | Issue Description | Phase 2 Action |
|---|---|---|---|
| `apps/partner-platform/src/main.tsx` | `DEMO_STAFF_USERS[0]` | Default initial state auto-logs in a demo staff member on fresh load. | Initialize auth state as `null`, render real `HospitalStaffLogin` screen. |
| `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx` | `setTimeout(..., 400)` & Persona cards | Clicking role card triggers local state switch without backend credential verification. | Convert to standard Email + Password form calling `POST /api/v1/auth/login`. |
| `apps/company-platform/src/components/auth/FounderLogin.tsx` | `setTimeout(..., 400)` | Founder persona button triggers local state switch without password verification. | Connect to `POST /api/v1/auth/login` verifying `founder.alok@docsearch.health` credentials. |
| `apps/partner-platform/src/services/api-client.ts` | Hardcoded `http://localhost:4000` | Localhost hardcoding in client. | Read from `import.meta.env.VITE_API_BASE_URL`. |

---

## 2. Target Phase 2 Authentication Flow
```
User Enters Credentials (Email + Password)
                 ↓
      POST /api/v1/auth/login
                 ↓
Backend Verifies scrypt Hash & Issues Signed JWT
                 ↓
Frontend Stores JWT in Secure Token Storage
                 ↓
All API Calls Include: Authorization: Bearer <JWT>
```
