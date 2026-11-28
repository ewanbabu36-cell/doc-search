# KYC PENDING — DEEP AUDIT REPORT
**DOC SEARCH Platform Architecture & KYC Verification Workflow**
**Date:** September 8, 2026 | **Author:** Senior Staff Full-Stack, Security & QA Engineer

---

## A. Architecture Discovered

The **DOC SEARCH** platform is structured as a multi-tier monorepo with workspace packages and applications:

```
├── apps/
│   ├── api-gateway/         # Fastify v5 REST API Gateway (Port 4000)
│   ├── company-platform/    # React/Vite Super Admin & Company Operations Console (Port 5174)
│   ├── partner-platform/    # React/Vite Healthcare Partner Staff Portal (Port 5173)
│   └── landing-page/        # Public Landing Page & Self-Registration Portal (Port 5175)
├── packages/
│   ├── api-contracts/       # Zod schemas & DTO contracts for Partner, Compliance, Auth
│   ├── auth/                # JWT verification, RBAC evaluator, ScopeGuard, Audit builder
│   ├── database/            # Drizzle ORM, PostgreSQL connection, migrations (0000-0050)
│   ├── shared-core/         # AppError, ErrorCode, Logger, standard utilities
│   └── ui-kit/              # Reusable UI component library (Tabs, Badges, Tables, etc.)
```

### High-Level Data Flow
1. **Partner Self-Registration**: Submitted from Landing Page (`http://localhost:5175`) or Partner Portal (`http://localhost:5173`) via `POST /api/v1/auth/register-partner-user` or `POST /api/v1/auth/self-register`.
2. **Staged Queue Persistence**: Persisted in PostgreSQL table `company.partner_onboarding_staged_registrations`.
3. **Company Admin Review**: Company Console (`http://localhost:5174`) polls `GET /api/v1/auth/verification-queue`, displays pending items in `PartnerVerificationConsole.tsx` under CRM / Document Verification Queue.
4. **Approval / Activation**: Admin approves via `POST /api/v1/auth/verification-queue/approve`, committing status `APPROVED` in PostgreSQL, activating user credentials in `realAuthService`, and recording a tamper-evident audit record in `core.audit_events`.
5. **Partner Login**: Once activated, partner logs in to `http://localhost:5173/login` with active JWT session issued by API Gateway.

---

## B. Existing KYC Files

### 1. Backend & API (`apps/api-gateway`)
- `apps/api-gateway/src/routes/auth.routes.ts`: Contains `/api/v1/auth/verification-queue`, `/api/v1/auth/verification-queue/approve`, `/api/v1/auth/verification-queue/reject`, and partner registration endpoints.
- `apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts`: Repository managing `partner_onboarding_staged_registrations`, baseline seed, row-level locking (`SELECT ... FOR UPDATE`), approval, and rejection transactions.
- `apps/api-gateway/src/services/core/RealAuthService.ts`: Cryptographic scrypt password hashing, credential store, activation of partner accounts.
- `apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts`: Detailed compliance document verification repository (master document types, requirements, verification history).
- `apps/api-gateway/src/routes/company/partner.routes.ts`: CRM partner management routes.

### 2. Database & Schemas (`packages/database`)
- `packages/database/src/schema/company/index.ts`: Defines table `partnerOnboardingStagedRegistrations` (line 3870).
- `packages/database/src/schema/core/document-verification.ts`: Defines `documentTypes`, `documentRequirements`, `entityDocuments`, `documentVerifications`, `documentAuditLogs`.
- `packages/database/src/schema/core/audit-events.ts`: Defines immutable `auditEvents` table.
- `packages/database/migrations/0050_partner_onboarding_staged_registrations.sql`: SQL migration creating `partner_onboarding_staged_registrations`.

### 3. Frontend (`apps/company-platform` & `apps/partner-platform`)
- `apps/company-platform/src/components/crm/PartnerVerificationConsole.tsx`: 3-column verification console (queue list, review details, document preview canvas).
- `apps/company-platform/src/components/crm/PartnerListView.tsx`: Partner Directory table with quick activation and KYC review modal.
- `apps/company-platform/src/components/crm/PartnerLifecycleManager.tsx`: CRM tab router containing `VERIFICATION` tab.
- `apps/company-platform/src/components/CompanyShell.tsx`: Header with `🏥 KYC [Pending]` badge button.
- `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx`: Partner login form handling active and pending states.

---

## C. Existing Database Models

### Table: `company.partner_onboarding_staged_registrations`
| Column | Type | Nullable | Constraints & References |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | PRIMARY KEY |
| `tenant_draft_id` | `uuid` | NULL | REFERENCES `core.tenants(id)` |
| `organization_name` | `text` | NOT NULL | |
| `organization_type` | `varchar(50)` | NOT NULL | |
| `contact_email` | `text` | NOT NULL | |
| `contact_phone` | `varchar(20)` | NOT NULL | |
| `registration_payload` | `jsonb` | NOT NULL | DEFAULT `'{}'::jsonb` |
| `kyc_documents` | `jsonb` | NOT NULL | DEFAULT `'[]'::jsonb` |
| `status` | `varchar(30)` | NOT NULL | DEFAULT `'PENDING'`, CHECK (`status` IN ('PENDING', 'APPROVED', 'REJECTED')) |
| `rejection_reason` | `text` | NULL | |
| `created_at` | `timestamptz` | NOT NULL | DEFAULT `now()` |
| `updated_at` | `timestamptz` | NOT NULL | DEFAULT `now()` |
| `approved_at` | `timestamptz` | NULL | |
| `approved_by` | `uuid` | NULL | REFERENCES `core.users(id)` |

---

## D. Existing APIs

| Method | Route | Description | Auth Guard | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register-partner-user` | Self-registration endpoint | Public | Working |
| `POST` | `/api/v1/auth/self-register` | Shared portal registration | Public | Working |
| `GET` | `/api/v1/auth/verification-queue` | Returns pending KYC list | `adminVerificationGuard` | Working |
| `POST` | `/api/v1/auth/verification-queue/approve` | Approves staged partner | `adminVerificationGuard` | Working |
| `POST` | `/api/v1/auth/verification-queue/reject` | Rejects staged partner | `adminVerificationGuard` | Working |
| `GET` | `/api/v1/auth/self-registered-partners` | List for partner platform | `adminVerificationGuard` | Working |
| `POST` | `/api/v1/auth/login` | Partner & staff login | Public | Working (403 on pending) |

---

## E. Existing Frontend Screens

1. **Company Platform — Document Verification Queue (`PartnerVerificationConsole.tsx`)**:
   - Column 1: Queue list with filters (search query, facility type, status chip, category).
   - Column 2: Selected case metadata, AI OCR match score, SHA-256 fingerprint, action buttons.
   - Column 3: Interactive document viewer with zoom controls and tamper-evident watermark.
2. **Company Platform — Partner Directory (`PartnerListView.tsx`)**:
   - Directory table showing all partners with status badges (`ACTIVE`, `ONBOARDING`, `PENDING`).
   - Action buttons: `🔐 Creds`, `📥 Kit`, `📮 Post`, `🛡️ Review KYC`, `⚡ Activate`, `⏸️ Suspend`.
   - `Review KYC Modal`: Modal displaying facility name, applicant, contact phone, registered email, city, and attached license proof.
3. **Company Platform — Header (`CompanyShell.tsx`)**:
   - Top-right `🏥 KYC [Pending]` badge displaying live pending count and routing directly to `VERIFICATION` tab.
4. **Partner Platform — Login Screen (`HospitalStaffLogin.tsx`)**:
   - Displays bilingual notice when account is pending KYC verification approval.

---

## F. Existing RBAC System

- Defined in `packages/auth/src/rbac.ts` and `apps/api-gateway/src/plugins/auth-guard.ts`.
- Evaluated via `RBACEvaluator.enforceRole` and `RBACEvaluator.enforcePermission`.
- Recognized roles: `SUPER_ADMIN`, `COMPANY_ADMIN`, `HOSPITAL_ADMIN`, `CLINIC_ADMIN`, `DOCTOR`, `PATHOLOGIST`, `PHARMACIST`, `RECEPTIONIST`, etc.
- Scope guards: Zero-trust tenant boundary enforcement (`ScopeGuard.enforceTenantScope`) and branch isolation (`ScopeGuard.enforceBranchScope`).

---

## G. Existing Audit System

- Handled by `apps/api-gateway/src/repositories/core/AuditRepository.ts`.
- Every record is saved to `core.audit_events` with SHA-256 cryptographic chain:
  `buildSecurityAuditRecord(payload, session, previousHash)`.
- Already captures: `PARTNER_ONBOARDING_REGISTERED`, `PARTNER_ONBOARDING_APPROVED`.

---

## H. Registration → KYC Relationship Trace

```
1. Partner registers via Landing Page or Partner Portal
   ├── Email: "abcclinic@docsearch.health"
   ├── Password: "DocSearch2026!"
   ├── Facility Name: "abc clinic"
   ├── Organization Type: "CLINIC"
   ├── Owner / Doctor Name: "sabbir"
   ├── Contact Phone: "8809149036"
   ├── City: "KATIHAR"
   └── Document: "abc_clinic_License_Proof.pdf" (SHA-256: a7c9f8e...)
             ↓
2. API Gateway: POST /api/v1/auth/register-partner-user
   ├── Creates user credential in realAuthService (status: PENDING_APPROVAL)
   └── Calls partnerOnboardingRepository.createStagedRegistration({...})
             ↓
3. PostgreSQL Database: company.partner_onboarding_staged_registrations
   ├── id: 00000000-0000-4000-8000-000000000003
   ├── organization_name: "abc clinic"
   ├── organization_type: "CLINIC"
   ├── contact_email: "abcclinic@docsearch.health"
   ├── contact_phone: "8809149036"
   ├── registration_payload: { name: "sabbir", city: "KATIHAR", licenseNumber: "REG-2026", ... }
   ├── kyc_documents: [{ documentName: "abc_clinic_License_Proof.pdf", ... }]
   └── status: "PENDING"
             ↓
4. Company Platform: GET /api/v1/auth/verification-queue
   ├── Returns item in verification queue
   ├── Auto-selects real pending item in PartnerVerificationConsole.tsx
   └── Displays in Partner Directory as PENDING with "🛡️ Review KYC" button
             ↓
5. Admin Decision: POST /api/v1/auth/verification-queue/approve
   ├── Atomically locks row (SELECT ... FOR UPDATE)
   ├── Updates status to "APPROVED", sets approved_at and approved_by
   ├── Activates credential in realAuthService (status: ACTIVE)
   └── Generates audit record in core.audit_events (PARTNER_ONBOARDING_APPROVED)
             ↓
6. Partner Login: POST /api/v1/auth/login
   ├── Verifies scrypt password hash
   ├── Validates user.status === 'ACTIVE'
   └── Issues HS256 JWT access token for Partner Dashboard
```

---

## I. Root Causes Analysis

### Issue 1: "Who Registered This Partner?" Transparency Deficit
- **Location**: `PartnerOnboardingRepository.ts`, `auth.routes.ts`, `PartnerVerificationConsole.tsx`.
- **Evidence**: `registeredBy` was only stored implicitly inside `registrationPayload.name` or `registrationPayload.ownerName`. No explicit columns or fields existed for `registeredByUserId`, `registeredByName`, `registeredByEmail`, `registeredByRole`, and `registrationSource`.
- **Impact**: Admin cannot clearly trace whether a partner was registered by a doctor directly, an invited staff member, a sales representative, or an automated integration.
- **Root Cause**: Staged registration schema treated registration metadata as unstructured JSON without explicit attribution fields.
- **Recommended Fix**: Add explicit attribution columns (`registered_by_user_id`, `registered_by_name`, `registered_by_email`, `registered_by_role`, `registration_source`) to the schema and return them in all queue and detail endpoints.

### Issue 2: KYC Status Machine Incompleteness & SQL Check Constraint Block
- **Location**: `packages/database/migrations/0050_partner_onboarding_staged_registrations.sql` (line 16), `PartnerOnboardingRepository.ts`.
- **Evidence**: Table has constraint `CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED'))`.
- **Impact**: Any attempt to transition to intermediate workflow states such as `UNDER_REVIEW`, `ADDITIONAL_INFORMATION_REQUIRED`, or `RESUBMITTED` causes a hard PostgreSQL constraint violation error.
- **Root Cause**: Initial migration only accounted for a binary pending/approved/rejected state rather than a full regulatory KYC workflow.
- **Recommended Fix**: Add migration `0051_kyc_workflow_enhancements.sql` to update the check constraint to:
  `CHECK ("status" IN ('PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED'))`.

### Issue 3: Missing Granular Action APIs
- **Location**: `apps/api-gateway/src/routes/auth.routes.ts`.
- **Evidence**: Only `approve` and `reject` endpoints existed. Endpoints for `assign`, `start-review`, `request-information`, and `timeline` were missing.
- **Impact**: Admin could only perform an all-or-nothing approve or reject, with no capability to claim a ticket, start an official review period, or request resubmission of illegible documents.
- **Root Cause**: Backend API layer was missing dedicated REST handlers for intermediate lifecycle transitions.
- **Recommended Fix**: Implement `POST /api/v1/auth/verification-queue/:id/assign`, `POST /api/v1/auth/verification-queue/:id/start-review`, `POST /api/v1/auth/verification-queue/:id/request-information`, and `GET /api/v1/auth/verification-queue/:id/timeline`.

### Issue 4: Next Action Engine Absent in UI
- **Location**: `PartnerVerificationConsole.tsx`.
- **Evidence**: Buttons were statically rendered regardless of whether the item was already approved, rejected, or pending.
- **Impact**: Admin could accidentally re-trigger actions or be confused about what step should come next.
- **Root Cause**: Frontend lacked a state-machine-driven action component that evaluates current KYC status, assigned reviewer, and allowed next transitions.
- **Recommended Fix**: Implement a reactive Next Action Engine in `PartnerVerificationConsole.tsx` that determines allowed actions based on current status.

### Issue 5: Missing Reviewer Assignment & Persistence
- **Location**: `partnerOnboardingStagedRegistrations` table and `PartnerOnboardingRepository.ts`.
- **Evidence**: No fields existed for `assigned_reviewer_id`, `assigned_reviewer_name`, `assigned_reviewer_email`, or `assigned_at`.
- **Impact**: Multiple compliance admins reviewing the queue could duplicate work on the same applicant.
- **Root Cause**: Reviewer assignment was not modeled in the schema.
- **Recommended Fix**: Add reviewer columns and `assignReviewer` repository method.

---

## J. Missing Functionality Summary

1. **Attribution & Origin**: Missing explicit `registeredBy` (ID, name, email, role, source) in data model and UI.
2. **Intermediate States**: Missing `UNDER_REVIEW`, `ADDITIONAL_INFORMATION_REQUIRED`, `RESUBMITTED` lifecycle states.
3. **Workflow Actions**: Missing "Start Review", "Assign Reviewer", and "Request Additional Information" (with mandatory reason).
4. **Audit Trail**: Missing audit events for `KYC_ASSIGNED`, `KYC_REVIEW_STARTED`, `KYC_INFORMATION_REQUESTED`, `KYC_RESUBMITTED`.
5. **Timeline View**: Missing chronological timeline displaying who registered, who was assigned, when review started, and final decision.
6. **Per-Document Verification Status**: Individual document verification flags (`VERIFIED` / `REJECTED`) inside `kycDocuments`.

---

## K. Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Data Loss on Migration** | Low | Critical | Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and update check constraint; never drop or recreate existing data. |
| **Concurrent Action Race** | Medium | High | Maintain PostgreSQL `SELECT ... FOR UPDATE` row locking during all transitions; reject stale requests with 409 Conflict. |
| **Breaking Existing Tests** | Low | High | Ensure all previous statuses (`PENDING`, `APPROVED`, `REJECTED`) remain fully supported and backward-compatible. |
| **Cross-Tenant Exposure** | Low | Critical | Maintain Zero Trust security guards; only Super Admins and Company Admins can access global KYC queue. |

---

## L. High-Level Implementation Plan

- **Phase 1**: Database Migration (`0051_kyc_workflow_enhancements.sql`) & Drizzle schema update for attribution, reviewer, intermediate statuses, and timeline.
- **Phase 2**: Repository methods in `PartnerOnboardingRepository.ts` for assign, start review, request info, resubmit, and timeline.
- **Phase 3**: REST API endpoints in `auth.routes.ts` with RBAC authorization and audit recording.
- **Phase 4**: Next Action Engine & UI enhancements in `PartnerVerificationConsole.tsx` (Attribution card, timeline, action dialogs).
- **Phase 5**: Automated test suite additions & end-to-end verification.
