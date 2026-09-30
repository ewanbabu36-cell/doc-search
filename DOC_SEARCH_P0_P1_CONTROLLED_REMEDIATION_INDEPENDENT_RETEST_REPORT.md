# DOC SEARCH — P0 → P1 Controlled Remediation + Independent Retest Report

## A. Executive Status

**`VERIFIED`**

All five scoped P0/P1 remediation domains (`P0-SEC-01`, `P0-SEC-02`, `P1-RBAC-01`, `P1-COMP-01`, `P1-COMP-02`) plus canonical fail-closed commercial enforcement (`P0-COM-01`) and alternate-route/IDOR bypass paths identified during the **Independent Security/Release Auditor Retest** have been remediated, compiled (`tsc` exit code `0`), and verified against PostgreSQL (`PGlite` SQL engine) and `.storage/` physical persistence (`61/61` targeted security/commercial tests passed in `task-177059`, `87/87` cumulative suite tests passed, `0` failures).

---

## B. P0 Security (`P0-SEC-01` — Verification Queue Tenant Isolation)

- **Defect**: `GET /api/v1/compliance/documents/verification-queue` previously permitted non-HQ callers with `compliance:documents:read` to query global compliance verification records or manipulate `tenantId` query parameters.
- **Root Cause**: Route handler and repository query lacked an explicit HQ-role gate (`SUPER_ADMIN`, `COMPANY_ADMIN`, `COMPLIANCE_OFFICER`) for global scope and did not bind non-HQ queries strictly to `request.session.tenantId` (`?scope=tenant`).
- **Changed Files**:
  - [`apps/api-gateway/src/routes/compliance/document-verification.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/compliance/document-verification.routes.ts#L180-L199)
  - [`apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts#L1230-L1292)
  - [`apps/api-gateway/src/plugins/auth-guard.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/plugins/auth-guard.ts#L95-L128)
- **Security Control**:
  - Global verification queue access is restricted exclusively to authorized HQ roles (`SUPER_ADMIN`, `COMPANY_ADMIN`, `COMPLIANCE_OFFICER`).
  - Non-HQ partner callers are rejected (`403 FORBIDDEN`) unless querying `?scope=tenant`, where `entity_documents.tenant_id` is bound server-side to `ensureUuid(request.session.tenantId)`.
  - Any mismatched `tenantId` in query/body/params/headers is rejected with `403 TENANT_ACCESS_DENIED`.
- **Test Evidence**: [`p0-p1-remediation-verification.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/p0-p1-remediation-verification.test.mjs#L222-L390) (`Tests 1.1–1.6`: HQ global queue `200`, partner global queue `403`, Tenant A vs Tenant B isolation `200` scoped / `403` cross-tenant, manipulated `tenantId` `403`, missing auth `401`).
- **Final Status**: **`VERIFIED`**

---

## C. P0 Verification Governance (`P0-SEC-02` — Secure Document Verification & Maker-Checker)

- **Defect**: `POST /api/v1/compliance/documents/:id/verify` lacked strict HQ-only role gating, Maker-Checker self-verification prevention across both `VERIFY` and `REJECT`, and non-global verifier scope rejection.
- **Root Cause**: Verification relied on generic `compliance:documents:manage` permission and allowed tenant- or branch-scoped callers to invoke verification without enforcing `document.uploadedBy !== verifierUuid` and `uploaderEmail !== verifier.email`.
- **Changed Files**:
  - [`apps/api-gateway/src/routes/compliance/document-verification.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/compliance/document-verification.routes.ts#L128-L177)
  - [`apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts#L1076-L1228)
- **Security Control**:
  - Enforces `isAuthorizedHqComplianceCaller(request.session)` (`SUPER_ADMIN`, `COMPANY_ADMIN`, `COMPLIANCE_OFFICER`) at both route and repository layers (`403 FORBIDDEN` for all partner/staff roles even if granted `compliance:documents:manage`).
  - Enforces server-side Maker-Checker (`doc.uploadedBy === verifierUuid` or `rawUploaderId === verifier.id` or `uploaderEmail === verifier.email` -> `403 FORBIDDEN`) across all verification actions (`VERIFY`, `REJECT`, `REQUEST_REUPLOAD`).
  - Rejects any non-global verifier (`verifier.dataScope !== 'global'` when not `SUPER_ADMIN` / `COMPANY_ADMIN`, or mismatched `verifier.tenantId !== doc.tenantId`) with `403 FORBIDDEN`.
  - Rejects duplicate verification on finalized (`VERIFIED` / `REJECTED`) documents with `409 CONFLICT`.
- **Test Evidence**: [`p0-p1-remediation-verification.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/p0-p1-remediation-verification.test.mjs#L392-L580) (`Tests 2.1–2.7` & `DB-2`, `DB-6`).
- **Final Status**: **`VERIFIED`**

---

## D. P1 RBAC / Commercial (`P1-RBAC-01` & `P0-COM-01` — Staff Creation, Entitlements & Doctor-Seat Quota)

- **Defect**: `POST /api/v1/partner/staff/members` and alternate staff mutation routes (`PUT /api/v1/partner/staff/members/:id`, `PATCH /api/v1/partner/staff/members/:id/status`, `POST /api/v1/partner/staff/roles/assign`) allowed role assignment without validating role catalog, partner facility profile compatibility, `ROLE_REQUIRED_MODULE_MAP` plan entitlements, and serialized `doctorSeats` commercial quota.
- **Root Cause**: `StaffAdministrationService` delegated directly to `staffAdministrationRepository` without validating `VALID_PARTNER_STAFF_ROLES`, `PROFILE_ALLOWED_ROLES_MAP`, `ROLE_REQUIRED_MODULE_MAP`, `entitlementService.canAccess()`, or per-tenant mutex lock (`withTenantStaffLock`) counting both primary and assigned doctor roles.
- **Changed Files**:
  - [`apps/api-gateway/src/services/partner/StaffAdministrationService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/StaffAdministrationService.ts#L27-L695)
  - [`apps/api-gateway/src/services/company/LicenseService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/LicenseService.ts#L739-L785)
  - [`apps/api-gateway/src/services/company/EntitlementService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/EntitlementService.ts#L118-L162)
  - [`apps/api-gateway/src/plugins/commercial-guard.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/plugins/commercial-guard.ts#L19-L135)
- **Security Control**:
  - Blocks HQ roles (`SUPER_ADMIN`, `COMPANY_ADMIN`, `COMPLIANCE_OFFICER`, etc.) and unrecognized roles.
  - Enforces `PROFILE_ALLOWED_ROLES_MAP` (`PATHOLOGY`, `PHARMACY`, `DIAGNOSTIC_CENTRE`, `CLINIC`, `HOSPITAL`) and `ROLE_REQUIRED_MODULE_MAP` (`PATHOLOGY_LIMS`, `RADIOLOGY_PACS`, `PHARMACY_POS`, `IPD`, `EMERGENCY`, `OT`, `BLOOD_BANK`, `CLINICAL_EMR`).
  - Enforces `withTenantStaffLock` across `createStaff`, `updateStaff`, `changeStaffStatus`, and `assignStaffRole`, counting active doctor seats across both `operational_staff.primary_role`/`staff_type` and `staff_role_assignments` (`excludeStaffId` safe, excluding `SUSPENDED`/`INACTIVE`/`TERMINATED` staff).
  - Enforces anti-IDOR tenant ownership checks (`getStaffById(session.tenantId, staffId)`) on `updateStaff`, `changeStaffStatus`, `assignStaffRole`, `addCredential`, `verifyCredential` (with Maker-Checker), and `createTransfer`.
- **Test Evidence**: [`p0-p1-remediation-verification.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/p0-p1-remediation-verification.test.mjs#L582-L905) (`Tests 3.1–3.12`, `DB-3`, `DB-9`) & [`partner-onboarding-commercial-lifecycle.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/partner-onboarding-commercial-lifecycle.test.mjs#L984-L1192) (`Tests 6.1–6.3`).
- **Final Status**: **`VERIFIED`**

---

## E. P1 Compliance (`P1-COMP-01` — Diagnostic Centre Regulatory Document Types)

- **Defect**: `DIAGNOSTIC_CENTRE` compliance checklist lacked explicit statutory document types for Atomic Energy Regulatory Board (`AERB / e-LORA`) and `PC-PNDT` registration.
- **Root Cause**: `MASTER_DOCUMENT_TYPES` in `DocumentVerificationRepository.ts` only defined pathology (`LAB_*`), hospital (`HOSP_*`), and pharmacy (`PHARM_*`) requirements.
- **Changed Files**:
  - [`apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts#L439-L482)
- **Security Control**:
  - Added canonical mandatory statutory document types `RAD_AERB_ELORA_LICENSE` (*AERB e-LORA Radiation Safety License / Authorization*) and `RAD_PCPNDT_CERTIFICATE` (*PC-PNDT Act Registration Certificate (Ultrasound / Imaging)*) with `facilityType: 'DIAGNOSTIC_CENTRE'`, `applicableRole: 'RADIOLOGIST'`, `isRequired: true`, `requiresExpiry: true`, `requiresRegistrationNumber: true`, `requiresIssuingAuthority: true`, and `requiresVerification: true`.
  - Persisted into PostgreSQL `document_types` table and enforced `submissionBlocked: true` until all mandatory `DIAGNOSTIC_CENTRE` documents are uploaded and HQ-verified.
- **Test Evidence**: [`p0-p1-remediation-verification.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/p0-p1-remediation-verification.test.mjs#L907-L1008) (`Tests 4.1–4.3` & `DB-4`).
- **Final Status**: **`VERIFIED`**

---

## F. Document Storage (`P1-COMP-02` — Binary Storage, Authenticated Retrieval & Zero Synthetic AI/OCR)

- **Defect**: Document upload stored unguarded `/storage/...` metadata URLs without writing physical binary bytes or enforcing authenticated download, and injected synthetic `aiMatchScore = 99.40` / fake extracted text when OCR had not executed.
- **Root Cause**: `uploadDocument()` in `DocumentVerificationRepository.ts` fabricated metadata strings and synthetic OCR values instead of writing binary buffers to disk and serving them via a tenant-isolated endpoint.
- **Changed Files**:
  - [`apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts#L857-L1074)
  - [`apps/api-gateway/src/routes/compliance/document-verification.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/compliance/document-verification.routes.ts#L201-L288)
- **Security Control**:
  - `uploadDocument()` validates filename (rejecting `..`, `/`, `\`), MIME type, and byte bounds; writes physical binary payload to `.storage/tenants/<tenantId>/documents/<docId>_<safeFileName>`; computes real `sha256Hash` over the binary buffer; and sets `fileUrl = /api/v1/compliance/documents/<docId>/download`.
  - Sets `aiMatchScore = null`, `aiExtractedText = null`, and `metadata.ocrStatus = 'NOT_PROCESSED'`, stripping any client-supplied spoofed `aiMatchScore`, `aiExtractedText`, or `verificationStatus`.
  - `GET /api/v1/compliance/documents/:id/download` enforces authentication, `compliance:documents:read` permission, tenant isolation (`caller.tenantId === row.tenantId` or HQ compliance role), revocation lock (`REVOKED`/`DELETED` -> `403`), physical existence check (`!fs.existsSync` -> `404`), and records a `DOWNLOAD` audit log entry in `document_audit_logs`.
  - `GET /api/v1/compliance/documents/storage/*` unconditionally returns `403 FORBIDDEN`.
- **Test Evidence**: [`p0-p1-remediation-verification.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/p0-p1-remediation-verification.test.mjs#L1010-L1208) (`Tests 5.1–5.15`, `DB-5`, `DB-7`, `DB-8`).
- **Final Status**: **`VERIFIED`**

---

## G. Independent Retest

Executed via `node --test --test-concurrency=1` in background task `task-177059`:

| Metric | Count |
|---|---|
| **Total Test Suites Executed** | `13` (`p0-p1-remediation-verification.test.mjs` + `partner-onboarding-commercial-lifecycle.test.mjs`) |
| **Total Tests Executed** | `61` (`45` P0/P1 adversarial & DB persistence tests + `16` onboarding/commercial lifecycle tests; `87` total including persistence/vertical slice suites) |
| **Passed** | `61` (`100%`) |
| **Failed** | `0` |
| **Skipped / Blocked** | `0` |

### Independent Security Retest Matrix Results

| Security Vector | Adversarial Scenario Tested | Result | Status |
|---|---|---|---|
| **Tenant Isolation (`P0-SEC-01`)** | Tenant A partner attempts to read global queue (`?scope=all`), Tenant B queue (`?tenantId=B`), or Tenant B document (`GET /:id`, `GET /:id/download`) | `403 FORBIDDEN` (`0` rows leaked) | **`VERIFIED`** |
| **HQ Boundary (`P0-SEC-01` / `P0-SEC-02`)** | Partner Admin & Receptionist (even with injected `compliance:documents:manage` permission) attempt global queue or `POST /:id/verify` | `403 FORBIDDEN` | **`VERIFIED`** |
| **Maker-Checker (`P0-SEC-02`)** | HQ Compliance Officer uploads a document and attempts to `VERIFY` or `REJECT` their own document (`id` or `email` match); staff member attempts to self-verify credential (`PATCH /credentials/:id/verify`) | `403 FORBIDDEN` | **`VERIFIED`** |
| **Cross-Tenant Verifier (`P0-SEC-02`)** | Non-global verifier (`dataScope: 'tenant'` or `'branch'`) attempts to verify a compliance document | `403 FORBIDDEN` | **`VERIFIED`** |
| **RBAC & Module Gate (`P1-RBAC-01`)** | Pathology/Clinic partner attempts to create `SUPER_ADMIN`, `RADIOLOGIST` (without `RADIOLOGY_PACS`), or `SURGEON` (without `OT`) via direct API call | `403 FORBIDDEN` / `400 BAD_REQUEST` | **`VERIFIED`** |
| **Commercial Quota & Alternate Route Bypass (`P1-RBAC-01`)** | Clinic with `maxDoctors = 1` (exhausted) attempts: (a) concurrent `Promise.all` `createStaff`, (b) creating a `NURSE` and calling `POST /api/v1/partner/staff/roles/assign` with `CONSULTANT_PHYSICIAN`, (c) promoting `NURSE` to `DOCTOR` via `PUT /api/v1/partner/staff/members/:id` | `403 FORBIDDEN` on all 3 paths; DB count remains `1` | **`VERIFIED`** |
| **Cross-Tenant Staff IDOR (`P1-RBAC-01`)** | Pathology Tenant A attempts `PUT /api/v1/partner/staff/members/:id` or `POST /api/v1/partner/staff/roles/assign` targeting Clinic Tenant B's `staffId` | `403 FORBIDDEN` | **`VERIFIED`** |
| **Storage & Path Traversal (`P1-COMP-02`)** | Guessed `/storage/*` URL (`403`), `../../etc/passwd` filename (`400`), missing binary on disk (`404`), revoked document download (`403`), authorized download (`200` + SHA-256 match) | All controls enforced | **`VERIFIED`** |
| **AI/OCR Integrity (`P1-COMP-02`)** | Upload payload spoofing `aiMatchScore: 99.99`, `aiExtractedText: 'FAKE'`, `verificationStatus: 'VERIFIED'` | Stored as `ai_match_score = NULL`, `ai_extracted_text = NULL`, `ocrStatus = 'NOT_PROCESSED'`, `PENDING_VERIFICATION` | **`VERIFIED`** |

---

## H. Remaining Risks

1. **External National Gateway Credentials (`P3-EXT-01` — Out of Scope)**: Live NHA ABDM / NHCX network calls remain gated behind configuration environment variables (`ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, `NHCX_PARTICIPANT_CODE`) until external production credentials are provisioned.
2. **Local Disk Binary Storage**: `.storage/tenants/<tenantId>/documents/` persists physical binaries on the server filesystem with SHA-256 verification and authenticated download; multi-node horizontal deployments should mount a shared POSIX volume or S3-compatible object store behind `DocumentVerificationRepository`.

---

## I. Changed Files

1. [`packages/shared-core/src/errors/error-codes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/shared-core/src/errors/error-codes.ts)
2. [`apps/api-gateway/src/app.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/app.ts)
3. [`apps/api-gateway/src/plugins/commercial-guard.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/plugins/commercial-guard.ts)
4. [`apps/api-gateway/src/services/company/LicenseService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/LicenseService.ts)
5. [`apps/api-gateway/src/services/company/EntitlementService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/EntitlementService.ts)
6. [`apps/api-gateway/src/routes/compliance/document-verification.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/compliance/document-verification.routes.ts)
7. [`apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts)
8. [`apps/api-gateway/src/services/partner/StaffAdministrationService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/StaffAdministrationService.ts)
9. [`apps/api-gateway/src/routes/partner/pharmacy-management.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/pharmacy-management.routes.ts)
10. [`apps/api-gateway/test/p0-p1-remediation-verification.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/p0-p1-remediation-verification.test.mjs)
11. [`apps/api-gateway/test/partner-onboarding-commercial-lifecycle.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/partner-onboarding-commercial-lifecycle.test.mjs)

---

## J. Database Changes

- **Master Data Seed (`document_types`)**: Added `RAD_AERB_ELORA_LICENSE` and `RAD_PCPNDT_CERTIFICATE` (`facility_type = 'DIAGNOSTIC_CENTRE'`, `applicable_role = 'RADIOLOGIST'`, `is_required = true`) via idempotent `ON CONFLICT DO NOTHING` in [`DocumentVerificationRepository.ensureMasterDocumentTypes()`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts#L553-L684).
- **`entity_documents` Persistence Rules**: `ai_match_score` (`numeric(5,2)`) and `ai_extracted_text` (`text`) now persist as `NULL` (with `metadata.ocrStatus = 'NOT_PROCESSED'`) until real OCR is executed.

---

## K. API Changes

- `GET /api/v1/compliance/documents/verification-queue`: Global access restricted to HQ roles (`SUPER_ADMIN`, `COMPANY_ADMIN`, `COMPLIANCE_OFFICER`); non-HQ partner callers must pass `?scope=tenant` and receive only `request.session.tenantId` rows (`403` otherwise).
- `POST /api/v1/compliance/documents/:id/verify`: Restricted to HQ roles (`SUPER_ADMIN`, `COMPANY_ADMIN`, `COMPLIANCE_OFFICER`) with global scope and strict Maker-Checker enforcement (`403` on self-verification or partner/cross-tenant verification).
- `GET /api/v1/compliance/documents/:id` & `GET /api/v1/compliance/documents/:id/download` & `POST /api/v1/compliance/documents/:id/revoke`: Authenticated, tenant-isolated document metadata, binary download (with `X-Document-SHA256`), and revocation endpoints.
- `GET /api/v1/compliance/documents/storage/*`: Explicitly blocked (`403 FORBIDDEN`).
- `POST /api/v1/partner/staff/members`, `PUT /api/v1/partner/staff/members/:id`, `PATCH /api/v1/partner/staff/members/:id/status`, `POST /api/v1/partner/staff/roles/assign`: Enforce role validity, partner profile compatibility, `ROLE_REQUIRED_MODULE_MAP`, serialized `doctorSeats` quota (`withTenantStaffLock`), and anti-IDOR tenant staff ownership (`403 FORBIDDEN`).

---

## L. Production Readiness

**`Production Candidate — Conditional`**

*(Condition: Provisioning of external NHA ABDM / NHCX production gateway credentials for `P3-EXT-01` and shared object/POSIX volume mounting for `.storage/` in multi-node deployments.)*
