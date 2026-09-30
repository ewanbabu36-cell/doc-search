# CATEGORY 12 — AUTHORIZATION / RBAC BASELINE AUDIT REPORT

**Date:** 2026-09-29T03:12:18.126Z  
**Repository:** DOC SEARCH Monorepo (`apps/api-gateway`, `packages/auth`, `packages/database`)  
**Database Engine:** Native PostgreSQL 18.4 (Port 5432)  
**API Gateway:** Live Fastify Server (Port 4000)  

---

## 1. Executive Summary

| Metric | Baseline Count | Status |
| :--- | :--- | :--- |
| **Total Route Files Scanned** | 63 | Completed |
| **Total Endpoints Identified** | 285 | Inventory Complete |
| **Fully Guarded Endpoints (Auth + Role/Perm)** | 26 | Protected |
| **Auth-Only Endpoints (Missing Role/Perm)** | 236 | Scrutiny Required |
| **Optional Auth Endpoints** | 0 | Risk / Investigation |
| **Public Intentional Endpoints** | 0 | Expected Public |
| **Unguarded Endpoints (Non-public)** | 23 | Action Required |
| **Unguarded Mutations (POST/PUT/DELETE)** | 143 | **P0/P1 High Risk** |
| **Core Database Roles** | 0 | Cataloged |
| **Core Database Permissions** | 0 | Cataloged |
| **Core Role-Permission Mappings** | 0 | Cataloged |
| **Company Security Roles** | 0 | Cataloged |
| **Frontend Permission Checks** | 0 | Cross-Referenced |

---

## 2. Invariant Trace Model

Every request MUST satisfy the complete authorization chain:
```
USER
  ↓
STAFF (Active & In-Date)
  ↓
PARTNER / TENANT (Session Isolation)
  ↓
DEPARTMENT (Scoping)
  ↓
ROLE (Active Temporal Assignment)
  ↓
PERMISSION (Explicit or Action-Equivalent)
  ↓
FEATURE / ENTITLEMENT (Active License & Plan)
  ↓
RESOURCE (Target Scope & Ownership)
  ↓
ACTION (Non-governed / Governed)
  ↓
BACKEND ENFORCEMENT (403 on Failure, Zero Database Mutation)
```

---

## 3. Unguarded Mutations Requiring Direct Remediation

* **`POST /api/v1/partner/abdm/m1/generate-aadhaar-otp`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m1/verify-aadhaar-otp`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m1/generate-mobile-otp`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m1/verify-mobile-otp`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m1/verify-demographics`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m1/search-by-health-id`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m2/care-contexts`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m2/care-contexts/discover`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m2/care-contexts/link/init`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m2/care-contexts/link/confirm`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m2/scan-and-share`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m3/consent-requests`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m3/consents/revoke`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m3/fhir-bundles/generate`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m3/health-information/request`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m3/health-information/encrypt-payload`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/abdm/m3/health-information/decrypt-payload`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/abdm/callback/v0.5/care-contexts/on-discover`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/abdm/callback/v0.5/consents/hip/on-notify`**  
  File: [`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai/chat/conversations`**  
  File: [`apps/api-gateway/src/routes/partner/ai-chat.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-chat.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai/chat/conversations/:conversationId/messages`**  
  File: [`apps/api-gateway/src/routes/partner/ai-chat.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-chat.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai/chat/conversations/:conversationId/archive`**  
  File: [`apps/api-gateway/src/routes/partner/ai-chat.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-chat.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai-copilot/ambient-scribe/soap`**  
  File: [`apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/ai-copilot/ambient-scribe/soap/:id/approve`**  
  File: [`apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai-copilot/sepsis/evaluate`**  
  File: [`apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/ai-copilot/sepsis/alerts/:id/acknowledge`**  
  File: [`apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai-copilot/ddi/evaluate`**  
  File: [`apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai-copilot/ddi/override`**  
  File: [`apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai-copilot/panic-values`**  
  File: [`apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/ai-copilot/panic-values/:id/acknowledge`**  
  File: [`apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-clinical-copilot.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai/execute`**  
  File: [`apps/api-gateway/src/routes/partner/ai-foundation.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-foundation.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai/voice/transcribe`**  
  File: [`apps/api-gateway/src/routes/partner/ai-voice.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-voice.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai/voice/interact`**  
  File: [`apps/api-gateway/src/routes/partner/ai-voice.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-voice.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai/voice/synthesize`**  
  File: [`apps/api-gateway/src/routes/partner/ai-voice.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-voice.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/ai/voice/extract-soap`**  
  File: [`apps/api-gateway/src/routes/partner/ai-voice.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-voice.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/biomedical/assets`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/biomedical/assets/:id`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/biomedical/work-orders`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/biomedical/work-orders/:id/assign`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/biomedical/work-orders/:id/complete`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/biomedical/work-orders/:id/verify`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/biomedical/ppm-schedules`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/biomedical/ppm-schedules/:id/complete`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/biomedical/calibrations`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/biomedical/safety-tests`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/biomedical/spare-parts`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/biomedical/spare-parts/consume`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/biomedical/condemnations`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/biomedical/condemnations/:id/approve`**  
  File: [`apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/executive-mis/billing/unbilled-encounters/:encounterId/resolve`**  
  File: [`apps/api-gateway/src/routes/partner/executive-mis.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/executive-mis.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/executive-mis/inventory/shrinkage-audit`**  
  File: [`apps/api-gateway/src/routes/partner/executive-mis.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/executive-mis.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/executive-mis/doctors/payouts/:doctorId/approve`**  
  File: [`apps/api-gateway/src/routes/partner/executive-mis.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/executive-mis.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/executive-mis/command/surge`**  
  File: [`apps/api-gateway/src/routes/partner/executive-mis.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/executive-mis.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/executive-mis/command/surge/resolve`**  
  File: [`apps/api-gateway/src/routes/partner/executive-mis.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/executive-mis.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/executive-mis/command/what-if`**  
  File: [`apps/api-gateway/src/routes/partner/executive-mis.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/executive-mis.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/executive-mis/command/bed-override`**  
  File: [`apps/api-gateway/src/routes/partner/executive-mis.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/executive-mis.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/devices`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/scans`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/rfid-reads`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/print-jobs/generate`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/analyzers`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/analyzers/:analyzerId/astm/handshake`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/analyzers/:analyzerId/astm/message`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/analyzers/:analyzerId/hl7/message`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/analyzers/:analyzerId/query-worklist`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/hardware/analyzers/:analyzerId/qc-runs`**  
  File: [`apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/hardware-bridge.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/configuration/initialize`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/locations`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/locations/:id`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/departments`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/departments/:id`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/services`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/services/:id`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/staff`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/staff/:id`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/roles/assign`**  
  File: [`apps/api-gateway/src/routes/partner/partner-configuration.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/partner-configuration.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/patient-360/patients/:patientId`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PUT /api/v1/partner/patient-360/patients/:patientId`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/patient-360/patients/:patientId/status`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/patients/:patientId/merge`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/patients`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/appointments`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/encounters/check-in`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/tokens`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/patient-360/tokens/:tokenId/status`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/consultations`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/orders`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/results`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/transactions`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/documents`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/patient-360/documents/:documentId/rename`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/patient-360/encounters/:encounterId/status`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/patient-360/encounters/:encounterId/exit`**  
  File: [`apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/vendors`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/items`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/requisitions`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/procurement/requisitions/:id/approve`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/purchase-orders`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/procurement/purchase-orders/:id/approve`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/purchase-orders/emergency`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/goods-receipts`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/inspections`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/invoices`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/invoices/match`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/procurement/returns`**  
  File: [`apps/api-gateway/src/routes/partner/procurement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/procurement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/warehouses`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/warehouses/:warehouseId/locations`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/vendors`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/items`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/requisitions`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/supply-chain/requisitions/:id/approve`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/purchase-orders`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/supply-chain/purchase-orders/:id/approve`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/goods-receipts`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/consumptions`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/transfers`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/supply-chain/transfers/:id/approve`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/transfers/:id/dispatch`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/transfers/:id/receive`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/recalls`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/stock-counts`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/stock-counts/:id/record`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/supply-chain/stock-counts/:id/reconcile`**  
  File: [`apps/api-gateway/src/routes/partner/supply-chain.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/supply-chain.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/definitions/publish-version`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/instances`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/tasks`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/tasks/:taskId/transition`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/tasks/:taskId/assign`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/workflows/tasks/:taskId/priority`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/tasks/:taskId/sla-evaluate`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/tasks/:taskId/escalate`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/exceptions`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/exceptions/:exceptionId/resolve`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/handoffs`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/handoffs/:handoffId/respond`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/sagas/execute`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/workflows/sagas/:sagaId/recover`**  
  File: [`apps/api-gateway/src/routes/partner/universal-workflow.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/universal-workflow.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/whatsapp/conversations/:conversationId/messages`**  
  File: [`apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/whatsapp/conversations/:conversationId/toggle-bot`**  
  File: [`apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/whatsapp/dispatches`**  
  File: [`apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`PATCH /api/v1/partner/whatsapp/queue-tokens/:tokenId`**  
  File: [`apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/whatsapp/medication-reminders`**  
  File: [`apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts)  
  Classification: `AUTH_ONLY`  
  Current PreHandler: `authenticate`  
  Missing: `requirePermission` or `requireRoles`

* **`POST /api/v1/partner/whatsapp/webhook`**  
  File: [`apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/whatsapp-engagement.routes.ts)  
  Classification: `UNGUARDED`  
  Current PreHandler: `none`  
  Missing: `requirePermission` or `requireRoles`


---

## 4. Auth-Only Endpoints Analysis

* `GET /api/v1/partner/abdm/overview` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m1/generate-aadhaar-otp` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m1/verify-aadhaar-otp` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m1/generate-mobile-otp` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m1/verify-mobile-otp` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m1/verify-demographics` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m1/search-by-health-id` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `GET /api/v1/partner/abdm/m1/abha-accounts` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `GET /api/v1/partner/abdm/m2/care-contexts` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m2/care-contexts` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m2/care-contexts/discover` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m2/care-contexts/link/init` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m2/care-contexts/link/confirm` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `GET /api/v1/partner/abdm/m2/scan-and-share/tokens` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m2/scan-and-share` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `GET /api/v1/partner/abdm/m3/consent-requests` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m3/consent-requests` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m3/consents/revoke` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `GET /api/v1/partner/abdm/m3/fhir-bundles` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m3/fhir-bundles/generate` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m3/health-information/request` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m3/health-information/encrypt-payload` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/abdm/m3/health-information/decrypt-payload` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `GET /api/v1/partner/abdm/audit-traces` ([`apps/api-gateway/src/routes/partner/abdm.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/abdm.routes.ts))
* `POST /api/v1/partner/ai/chat/conversations` ([`apps/api-gateway/src/routes/partner/ai-chat.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-chat.routes.ts))
* `GET /api/v1/partner/ai/chat/conversations` ([`apps/api-gateway/src/routes/partner/ai-chat.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-chat.routes.ts))
* `GET /api/v1/partner/ai/chat/conversations/:conversationId` ([`apps/api-gateway/src/routes/partner/ai-chat.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-chat.routes.ts))
* `POST /api/v1/partner/ai/chat/conversations/:conversationId/messages` ([`apps/api-gateway/src/routes/partner/ai-chat.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-chat.routes.ts))
* `POST /api/v1/partner/ai/chat/conversations/:conversationId/archive` ([`apps/api-gateway/src/routes/partner/ai-chat.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-chat.routes.ts))
* `GET /api/v1/partner/ai/role-context` ([`apps/api-gateway/src/routes/partner/ai-foundation.routes.ts`](file:///D:/DOC SEARCH/apps/api-gateway/src/routes/partner/ai-foundation.routes.ts))

... and 206 more (see baseline.json)

---

## 5. Database Roles & Permissions Inventory

### Roles (`core.roles`)


### Company Security Roles (`company.security_roles`)


---

## 6. Wildcard and Hardcoded Admin Findings

### Wildcards Detected (`58` occurrences)
* [`apps/api-gateway/src/plugins/auth-guard.ts:218`](file:///D:/DOC SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L218): `OWNER: ['*'],`
* [`apps/api-gateway/src/plugins/auth-guard.ts:219`](file:///D:/DOC SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L219): `HOSPITAL_ADMIN: ['*'],`
* [`apps/api-gateway/src/plugins/auth-guard.ts:220`](file:///D:/DOC SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L220): `PARTNER_ADMIN: ['*'],`
* [`apps/api-gateway/src/plugins/auth-guard.ts:221`](file:///D:/DOC SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L221): `CLINIC_ADMIN: ['*'],`
* [`apps/api-gateway/src/plugins/auth-guard.ts:222`](file:///D:/DOC SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L222): `ADMINISTRATOR: ['*'],`
* [`apps/api-gateway/src/plugins/auth-guard.ts:235`](file:///D:/DOC SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L235): `CHIEF_FINANCIAL_OFFICER: ['*'],`
* [`apps/api-gateway/src/plugins/auth-guard.ts:257`](file:///D:/DOC SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L257): `if (!allowedPrefixes.has('*')) {`
* [`apps/api-gateway/src/plugins/security.ts:31`](file:///D:/DOC SEARCH/apps/api-gateway/src/plugins/security.ts#L31): `const isWildcard = env.CORS_ORIGIN === '*' || !env.CORS_ORIGIN;`
* [`apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts:241`](file:///D:/DOC SEARCH/apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts#L241): `permissions: ['*'],`
* [`apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts:754`](file:///D:/DOC SEARCH/apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts#L754): `permissions: ['*'],`
* [`apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts:940`](file:///D:/DOC SEARCH/apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts#L940): `permissions: ['*'],`
* [`apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts:1109`](file:///D:/DOC SEARCH/apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts#L1109): `permissions: ['*'],`
* [`apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts:1240`](file:///D:/DOC SEARCH/apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts#L1240): `permissions: ['*'],`
* [`apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts:1369`](file:///D:/DOC SEARCH/apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts#L1369): `permissions: ['*'],`
* [`apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts:1507`](file:///D:/DOC SEARCH/apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts#L1507): `permissions: ['*'],`

### Hardcoded Admin Findings (`0` occurrences)


---

## 7. Next Remediation Actions

1. Remediate all **143** unguarded mutation endpoints with granular `requirePermission` or `requireRoles`.
2. Inspect `optionalAuthenticate` routes to prevent privilege escalation or authorization bypass.
3. Validate two-session isolation (Session A authorized vs Session B unauthorized on exact same resource).
4. Run live API and PostgreSQL verification suite.
