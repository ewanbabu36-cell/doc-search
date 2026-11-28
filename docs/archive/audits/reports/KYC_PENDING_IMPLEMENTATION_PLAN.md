# KYC PENDING — COMPREHENSIVE IMPLEMENTATION PLAN
**End-to-End KYC Workflow, Attribution, State Machine & Action Engine**
**Date:** September 8, 2026 | **Author:** Senior Staff Full-Stack, Security & QA Engineer

---

## Phase 1 — Data Model & Persistence

### 1. Database Migration `0051_kyc_workflow_enhancements.sql`
- Add new migration file in `packages/database/migrations/0051_kyc_workflow_enhancements.sql`.
- Update `company.partner_onboarding_staged_registrations`:
  ```sql
  -- Drop previous restrictive status check
  ALTER TABLE "company"."partner_onboarding_staged_registrations" 
    DROP CONSTRAINT IF EXISTS "chk_partner_onboarding_status";

  -- Add comprehensive status check constraint
  ALTER TABLE "company"."partner_onboarding_staged_registrations"
    ADD CONSTRAINT "chk_partner_onboarding_status" 
    CHECK ("status" IN ('PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED'));

  -- Add attribution columns (Who registered this partner?)
  ALTER TABLE "company"."partner_onboarding_staged_registrations"
    ADD COLUMN IF NOT EXISTS "registered_by_user_id" text,
    ADD COLUMN IF NOT EXISTS "registered_by_name" text,
    ADD COLUMN IF NOT EXISTS "registered_by_email" text,
    ADD COLUMN IF NOT EXISTS "registered_by_role" text,
    ADD COLUMN IF NOT EXISTS "registration_source" varchar(64) DEFAULT 'SELF_REGISTRATION_PORTAL';

  -- Add reviewer assignment columns
  ALTER TABLE "company"."partner_onboarding_staged_registrations"
    ADD COLUMN IF NOT EXISTS "assigned_reviewer_id" uuid REFERENCES "core"."users"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "assigned_reviewer_name" text,
    ADD COLUMN IF NOT EXISTS "assigned_reviewer_email" text,
    ADD COLUMN IF NOT EXISTS "assigned_at" timestamp with time zone;

  -- Add review lifecycle tracking columns
  ALTER TABLE "company"."partner_onboarding_staged_registrations"
    ADD COLUMN IF NOT EXISTS "review_started_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "review_started_by" text,
    ADD COLUMN IF NOT EXISTS "requested_info_reason" text,
    ADD COLUMN IF NOT EXISTS "info_requested_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "resubmitted_at" timestamp with time zone;
  ```
- Register migration in `packages/database/migrations/meta/_journal.json`.

### 2. Drizzle Schema Update
- Update `packages/database/src/schema/company/index.ts` to include the new columns in `partnerOnboardingStagedRegistrations` table definition and export types.

---

## Phase 2 — Backend APIs & Repository Enhancements

### 1. Repository Methods in `PartnerOnboardingRepository.ts`
- `assignReviewer(id: string, reviewer: { id?: string; name: string; email: string }, session: SessionContext)`:
  - Validates record exists and is in `PENDING` or `UNDER_REVIEW`.
  - Atomically locks row (`for update`), updates `assigned_reviewer_id`, `assigned_reviewer_name`, `assigned_reviewer_email`, `assigned_at`.
  - Logs `KYC_ASSIGNED` audit event.
- `startReview(id: string, reviewer: { id?: string; name: string; email: string }, session: SessionContext)`:
  - Guards: status must be `PENDING` or `RESUBMITTED`.
  - Atomically updates status to `UNDER_REVIEW`, sets `review_started_at`, `review_started_by`.
  - Logs `KYC_REVIEW_STARTED` audit event.
- `requestAdditionalInformation(id: string, reason: string, reviewer: { id?: string; name: string; email: string }, session: SessionContext)`:
  - Guards: status must be `UNDER_REVIEW`. Validates reason is non-empty.
  - Atomically updates status to `ADDITIONAL_INFORMATION_REQUIRED`, sets `requested_info_reason`, `info_requested_at`.
  - Logs `KYC_INFORMATION_REQUESTED` audit event.
- `resubmitRegistration(id: string, additionalPayload: any, documents: any[], session?: SessionContext)`:
  - Guards: status must be `ADDITIONAL_INFORMATION_REQUIRED`.
  - Atomically updates status to `RESUBMITTED`, updates payload and documents, sets `resubmitted_at`.
  - Logs `KYC_RESUBMITTED` audit event.
- `getRegistrationTimeline(id: string)`:
  - Queries `auditEvents` table for all audit events tied to this resource (`resourceId: id`).
  - Formats into a chronological timeline of events.

### 2. REST Route Handlers in `apps/api-gateway/src/routes/auth.routes.ts`
- `GET /api/v1/auth/verification-queue/:id` — Get full case details with attribution, documents, and reviewer info.
- `POST /api/v1/auth/verification-queue/:id/assign` — Assign reviewer.
- `POST /api/v1/auth/verification-queue/:id/start-review` — Start review session.
- `POST /api/v1/auth/verification-queue/:id/request-information` — Request additional documents or clarification.
- `POST /api/v1/auth/verification-queue/:id/resubmit` — Resubmit requested information.
- `GET /api/v1/auth/verification-queue/:id/timeline` — Retrieve full event history.
- Existing `/approve` and `/reject` updated to validate state machine transitions (only `UNDER_REVIEW` or `PENDING` can transition to `APPROVED`/`REJECTED`).

---

## Phase 3 — RBAC Authorization

- Ensure all KYC management routes require role `SUPER_ADMIN` or `COMPANY_ADMIN` (or permission `kyc:review` / `kyc:approve`).
- Re-use `adminVerificationGuard` with dev localhost founder fallback.
- Reject unauthenticated or non-admin callers with HTTP 403 Forbidden.

---

## Phase 4 — Company Panel UI: "Who Registered This Partner?" & Next Action Engine

### 1. Updated Types & Extended Queue Item in `PartnerVerificationConsole.tsx`
- Extend `PendingVerificationItem` interface:
  ```ts
  export interface PendingVerificationItem {
    id: string;
    dbId?: string;
    partnerName: string;
    partnerType: 'PATHOLOGY' | 'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'DOCTOR';
    tenantSlug: string;
    submittedBy: string;
    submittedAt: string;
    category: 'BANK' | 'ADDRESS' | 'LICENSE_CERTIFICATE' | 'AADHAAR_KYC' | 'PROFILE_AMENDMENT';
    status: 'PENDING' | 'PENDING_APPROVAL' | 'UNDER_REVIEW' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';
    registeredBy: {
      userId?: string;
      name: string;
      email: string;
      role?: string;
      source: string;
      registeredAt: string;
    };
    assignedReviewer?: {
      id?: string;
      name?: string;
      email?: string;
      assignedAt?: string;
    };
    reviewStartedAt?: string;
    requestedInfoReason?: string;
    resubmittedAt?: string;
    details: Record<string, string>;
    documentName: string;
    documentType: string;
    aiMatchScore: number;
    extractedOcrText: string;
    sha256Hash: string;
    documentDataUrl?: string;
    documents?: Array<{
      documentId: string;
      documentName: string;
      documentType: string;
      sha256Hash: string;
      verificationStatus: string;
      uploadedAt: string;
    }>;
  }
  ```

### 2. Prominent Attribution Card ("WHO REGISTERED THIS PARTNER?")
- Render dedicated high-contrast visual card in Column 2:
  - **Registrant Name & Role** (e.g. `sabbir (Authorized Doctor / Founder)`)
  - **Registrant Email & Phone** (`abcclinic@docsearch.health`, `+91 88091 49036`)
  - **Registration Source Badge** (`🌐 Online Portal Self-Registration`, `🏢 Admin Direct Invite`)
  - **Submission Date & Pending Duration** (`Applied on 08-Sep-2026, Pending for 2 hours`)
  - **Assigned Compliance Reviewer** (`Assigned to: Shah Alam (Founder & Admin)`)

### 3. Next Action Engine Component
- Based on `selectedItem.status`:
  - If `PENDING` or `RESUBMITTED`:
    - Show `▶️ Start Official Review` and `👤 Assign Reviewer` buttons.
    - Show `⚡ Direct 1-Click Approve` (fast-track option).
  - If `UNDER_REVIEW`:
    - Show `✓ Approve KYC & Issue Badge`.
    - Show `⚠️ Request Additional Information` (opens modal with required message input).
    - Show `✕ Reject KYC` (opens modal with mandatory rejection reason).
  - If `ADDITIONAL_INFORMATION_REQUIRED`:
    - Show Amber alert badge: `⏳ Awaiting Partner Resubmission: "${selectedItem.requestedInfoReason}"`.
    - Allow admin to re-open or simulate/record resubmission.
  - If `APPROVED`:
    - Show Green Seal: `✅ KYC Verified & Partner Activated`. No duplicate action allowed.
  - If `REJECTED`:
    - Show Red Banner: `❌ KYC Application Rejected: "${selectedItem.rejectionReason}"`.

---

## Phase 5 — Action Modals & Dialogs

1. **Assign Reviewer Modal**:
   - Allows choosing reviewer email / name (e.g. `admin@docsearch.health`, `compliance@docsearch.health`, `founder@docsearch.health`).
2. **Request Information Modal**:
   - Textarea requiring specific instructions to the partner on what documents or clarifications are needed.
3. **Reject KYC Modal**:
   - Dropdown of common rejection grounds (e.g. `Expired Medical License`, `Name Mismatch on Council Record`, `Blurry / Illegible Scan`) + custom reason notes.

---

## Phase 6 — Audit Trail & Timeline Display

- Render collapsible **Case Timeline & Audit History** inside `PartnerVerificationConsole.tsx`:
  - Shows chronologically:
    1. Registered by applicant
    2. Staged in central verification queue
    3. Assigned to reviewer
    4. Review initiated
    5. Information requested / approved / rejected
- Display cryptographic hash badge (`SHA-256 integrity verified`).

---

## Phase 7 — Notifications

- When status transitions occur:
  - Generate notification payload / communication log in `communicationRepository`.
  - Log audit event with full actor attribution.

---

## Phase 8 — Security & Idempotency

- Row-level lock (`SELECT ... FOR UPDATE`) in all repository transitions.
- Idempotency check: Reject duplicate or stale transition attempts with HTTP 409 Conflict.
- Strict input validation using Zod.
- Sensitive document masking (Aadhaar masked, file URLs securely scoped).

---

## Phase 9 — Testing Suite

- Add comprehensive automated test script `tests/kyc/kyc-workflow-state-machine.test.mjs`:
  - Test 1: Full registration with `registeredBy` attribution.
  - Test 2: Status transition from `PENDING` -> `UNDER_REVIEW`.
  - Test 3: Status transition from `UNDER_REVIEW` -> `ADDITIONAL_INFORMATION_REQUIRED`.
  - Test 4: Status transition from `ADDITIONAL_INFORMATION_REQUIRED` -> `RESUBMITTED`.
  - Test 5: Status transition from `UNDER_REVIEW` -> `APPROVED`.
  - Test 6: Rejection of invalid transitions (e.g. `APPROVED` -> `APPROVED`, `REJECTED` -> `APPROVED`).
  - Test 7: Reviewer assignment persistence.
  - Test 8: Tamper-evident audit trail verification.
  - Test 9: Partner login after approval (and 403 while pending).

---

## Phase 10 — Final Verification

- Monorepo Typecheck: `tsc --noEmit` across `apps/api-gateway`, `apps/company-platform`, `apps/partner-platform`.
- Run all security and workflow test suites.
- End-to-end browser walkthrough on ports 4000, 5173, 5174, 5175.
- Generate `KYC_PENDING_FINAL_IMPLEMENTATION_REPORT.md`.
