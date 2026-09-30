# DOC SEARCH POST-REMEDIATION ADVERSARIAL VERIFICATION & PRODUCTION FREEZE AUDIT

**Audit Date**: 2026-09-20  
**Audit Scope**: Verification of P1 Remediations (IMPL-P1-001 to IMPL-P1-004), Real-World Operational Workflow, Security Controls, Data Integrity, and Production Readiness.  
**Mode**: Strict Audit & Adversarial Verification (No code or database modifications).  

---

## 1. EXECUTIVE SUMMARY

An independent adversarial audit of the recent P1 remediation implementations (IMPL-P1-001 through IMPL-P1-004) was conducted across the frontend, API routes, middleware, service layer, repository layer, and PostgreSQL database schemas.

### Primary Audit Findings:

1. **IMPL-P1-001 (Partner Profile Completion)**: **PARTIALLY VERIFIED**
   - **Backend**: `PUT /api/v1/partner/profile` and `PUT /api/v1/partner/account/profile` correctly persist statutory profile fields into `company.partner_profiles` and synchronize `clinical.operational_partners`. Tenant isolation is enforced via `session.tenantId`.
   - **Frontend Defect**: The frontend guard `checkPartnerProfileStatus()` in `partnerProfileGuard.ts` relies on `localStorage` (`docsearch_partner_profile_updated_${email}` or `docsearch_account_settings_${email}`) and does NOT query or hydrate from the backend API during login. If `localStorage` is cleared or a user logs in from Browser B, the profile guard fails and reports the profile as incomplete. Furthermore, `UniversalAccountSettingsModal.tsx` declares success and updates `localStorage` before the backend API call completes, catching backend failures with `console.warn` (fake UI success).

2. **IMPL-P1-002 (Billing Encounter Integrity)**: **PARTIALLY VERIFIED**
   - **Schema Validation**: `CreateInvoiceSchema` requires `encounterId: z.string().trim().min(1)`. Omitted or blank `encounterId` is rejected with HTTP 400 Bad Request.
   - **Database & Existence Defect**: The API does NOT verify that the `encounterId` actually exists. In `BillingManagementRepository.ts` (lines 551–564), if an `encounterId` is nonexistent or belongs to another tenant, the repository **silently sets `resolvedEncounterId = null`** and inserts the invoice with `encounter_id = NULL` in PostgreSQL. Live testing confirmed that submitting `fakeEncounterId = '00000000-0000-4000-8000-000000000099'` returns HTTP 201 Created and creates an orphan invoice.

3. **IMPL-P1-003 (Patient Checkout / Exit)**: **VERIFIED**
   - `POST /api/v1/partner/clinical/encounters/:id/checkout` enforces financial clearance against PostgreSQL: returns HTTP 409 Conflict if unsettled invoices exist. Successful checkout transitions status to `DISCHARGED` and records a `PATIENT_DISCHARGED` audit event. Re-calling checkout is idempotent.
   - **Administrative Override Risk**: `forceDischarge: true` bypasses financial checks. `overrideReason` is optional and not validated server-side. Any user with `clinical:encounters:update` can invoke `forceDischarge` without requiring a supervisor override token or elevated role.

4. **IMPL-P1-004 (Central Help Desk Exit Hub)**: **PARTIALLY VERIFIED**
   - **Backend**: `GET /api/v1/partner/clinical/exit-hub/patients` performs real PostgreSQL queries across encounters, patients, consultations, lab orders, pharmacy prescriptions, and billing invoices.
   - **Frontend Defect**: `CentralHelpDeskExitHubView.tsx` initializes state with `MOCK_EXIT_PATIENTS`. If the API returns an empty array `[]` (clean facility), it does not clear the mock data and continues displaying the 3 hardcoded mock patients. Moreover, the print modals ("Print Rx", "Print Lab Report", "Print Receipt") use hardcoded mock DTOs (`consultationDto`, `labOrderDto`, `invoiceData`) containing fake clinical data ("Acute Viral Pyrexia", "Paracetamol", "Dengue NS1 Negative", ₹950 total) rather than fetching the actual patient records.

---

## 2. REMEDIATION VERIFICATION MATRIX

| Remediation | Expected Change | Actual State | Evidence | Status |
| :--- | :--- | :--- | :--- | :---: |
| **IMPL-P1-001** | Backend profile persistence | Backend persistence implemented; frontend guard still relies on localStorage; Browser B login not hydrated | `account.routes.ts:31-51`<br>`PartnerAccountService.ts:484-592`<br>`partnerProfileGuard.ts:56-144` | **PARTIALLY VERIFIED** |
| **IMPL-P1-002** | Valid encounter invoice relationship | Blank/missing encounterId rejected with 400; but nonexistent encounterId silently set to NULL (HTTP 201 orphan invoice created) | `billing-management.routes.ts:16`<br>`BillingManagementRepository.ts:551-564`<br>`clinical/index.ts:3271` | **PARTIALLY VERIFIED** |
| **IMPL-P1-003** | Real checkout/exit transition | Real financial clearance check (409 on unpaid); atomic status update to DISCHARGED; audit logged | `clinical-workflow.routes.ts:764-775`<br>`ClinicalWorkflowRepository.ts:2464-2550` | **VERIFIED** |
| **IMPL-P1-004** | Real Exit Hub data | Real backend query across 6 tables; but UI mounts mock fallback on empty list and print modals use hardcoded mock DTOs | `ClinicalWorkflowRepository.ts:2334-2454`<br>`CentralHelpDeskExitHubView.tsx:29-72, 142-216` | **PARTIALLY VERIFIED** |

---

## 3. P1-001 VERIFICATION — PARTNER PROFILE COMPLETION

### A. Persistence
- **Execution Path**:
  `UniversalAccountSettingsModal.tsx` $\rightarrow$ `apiRequest('/api/v1/partner/profile', { method: 'PUT', ... })` $\rightarrow$ `account.routes.ts:43` $\rightarrow$ `PartnerAccountService.updateProfile()` $\rightarrow$ `db.update(partnerProfiles)` / `db.insert(partnerProfiles)` $\rightarrow$ `company.partner_profiles` & `clinical.operational_partners`.
- **Verdict**: Backend persistence is genuine and verified in PostgreSQL.

### B. Browser Independence (Defect Documented)
- **Trace**:
  1. Browser A saves profile $\rightarrow$ Saved to PostgreSQL $\rightarrow$ LocalStorage set.
  2. Browser storage cleared or Browser B logs into the same partner.
  3. `HospitalStaffLogin.tsx` (lines 758–781) receives user object from `/api/v1/auth/login`, but `isProfileCompleted` is NOT populated in `resolvedStaffUser`.
  4. `partnerProfileGuard.ts` (lines 56–144) checks `localStorage.getItem('docsearch_partner_profile_updated_${email}')` and `localStorage.getItem('docsearch_account_settings_${email}')`. Both are absent.
  5. `checkPartnerProfileStatus()` evaluates `isComplete = false`.
- **Verdict**: **FAILED**. Profile completion state does NOT survive browser storage clearing or multi-browser login.

### C. Tenant Isolation
- `PartnerAccountService.updateProfile` extracts `tenantId` strictly from `session.tenantId`:
  ```typescript
  const tenantId = session.tenantId;
  ```
- Client-supplied `tenantId` or `partnerId` in request body is ignored. Cross-tenant tampering is blocked.
- **Verdict**: **VERIFIED**.

### D. RBAC
- Routes `/api/v1/partner/account/profile` and `/api/v1/partner/profile` have `preHandler: [authenticate]`.
- Note: Any authenticated partner user can call the profile update endpoint; it does not enforce a specific `requirePermission('partner:profile', 'update')` or `requireRoles('HOSPITAL_ADMIN')`.
- **Verdict**: **PARTIALLY VERIFIED** (Authentication enforced, role restriction loose).

### E. Validation
- Server-side validation parses payload into `UpdatePartnerProfileInput`. However, strict statutory format validation (e.g. CEA license regex, PIN code regex) is performed primarily on the frontend.
- **Verdict**: **PARTIALLY VERIFIED**.

### F. Audit
- No dedicated `audit_events` row is written in `PartnerAccountService.updateProfile` (unlike `checkoutEncounter` or `voidInvoice`). Updated timestamp is recorded in table metadata.
- **Verdict**: **PARTIALLY VERIFIED**.

### G. No Fake Success (Defect Documented)
- In `UniversalAccountSettingsModal.tsx` (lines 353–381):
  ```typescript
  localStorage.setItem(storageKey, JSON.stringify(payloadWithFlag));
  markPartnerProfileAsUpdated(currentUser?.email);
  apiRequest('/api/v1/partner/profile', { method: 'PUT', ... }).catch((err) => {
    console.warn('Backend partner profile sync deferred:', err);
  });
  ```
- LocalStorage is marked updated **before** the API call resolves. If the backend call fails, the UI still displays a success message and unlocks the application.
- **Verdict**: **FAILED**.

---

## 4. P1-002 VERIFICATION — BILLING ENCOUNTER INTEGRITY

### A. Validation
- `CreateInvoiceSchema` requires `encounterId: z.string().trim().min(1, 'encounterId is required')`.
- Missing or empty `encounterId` is rejected with **HTTP 400 Validation Error** (tested and verified).

### B. Format
- The schema requires a non-empty string. It does not validate UUID format.

### C. Existence Check (Critical Defect Documented)
- In `BillingManagementRepository.ts` (lines 551–564):
  ```typescript
  let resolvedEncounterId: string | null = record.encounterId;
  if (resolvedEncounterId) {
    try {
      const [enc] = await tx
        .select({ id: encounters.id })
        .from(encounters)
        .where(and(eq(encounters.tenantId, record.tenantId), eq(encounters.id, resolvedEncounterId)));
      if (!enc) {
        resolvedEncounterId = null; // <--- SILENT FALLBACK TO NULL
      }
    } catch {
      resolvedEncounterId = null;
    }
  }
  ```
- If an invalid, nonexistent, or cross-tenant `encounterId` is supplied, the repository **does not reject the request**. It silently converts `resolvedEncounterId` to `null` and inserts the invoice with `encounter_id = NULL`!
- **Runtime Proof**:
  - Executed `test-fake-encounter-invoice.mjs` against `http://localhost:4000`:
  - Request: `POST /api/v1/partner/billing/invoices` with `encounterId: '00000000-0000-4000-8000-000000000099'` (nonexistent).
  - Response: **HTTP 201 Created**!
  - Result: Orphan invoice created in PostgreSQL with `encounter_id = NULL`.
- **Verdict**: **FAILED**. Nonexistent encounters are not rejected.

### D. Database Integrity
- In `packages/database/src/schema/clinical/index.ts` (line 3271):
  ```typescript
  encounterId: uuid('encounter_id').references(() => encounters.id, { onDelete: 'set null' }),
  ```
- The column is **NULLABLE** (no `.notNull()` constraint).
- **Verdict**: **PARTIALLY VERIFIED** (Foreign key constraint exists, but allows NULLs).

### E. Legitimate Non-Encounter Billing
- Certain business models (e.g. over-the-counter pharmacy sales to walk-in customers or direct retail lab walk-ins) legitimately do not have a clinical encounter.
- However, because the Zod schema requires `encounterId: z.string().trim().min(1)`, callers wishing to perform direct OTC sales are forced to supply a dummy string (which then silently gets saved as NULL).
- **Verdict**: Business rule mismatch between schema (strictly mandatory) and database (nullable with silent fallback).

---

## 5. P1-003 VERIFICATION — PATIENT CHECKOUT / EXIT

### A. Authentication & Tenant Isolation
- Endpoint: `POST /api/v1/partner/clinical/encounters/:id/checkout`.
- PreHandler: `[authenticate, requirePermission('clinical:encounters', 'update')]`.
- Scope: Evaluated strictly with `session.tenantId`. Cross-tenant checkout is rejected with HTTP 404/403.
- **Verdict**: **VERIFIED**.

### B. Clearance Validation
- Unpaid invoices query:
  ```typescript
  const invoices = await db
    .select()
    .from(billingInvoices)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.encounterId, encounterId)));
  const unpaid = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'REFUNDED');
  ```
- If `unpaid.length > 0` and `!options.forceDischarge`: Throws **HTTP 409 Conflict** (`Cannot checkout patient: Unsettled invoices: X invoice(s) pending payment.`).
- **Verdict**: **VERIFIED**.

### C. Clinical Clearance Checks
- The code does **NOT** check consultation completion status, pending lab orders, or pharmacy dispensing status before checkout. The only automated gate is financial (unsettled invoices).
- **Verdict**: **PARTIALLY VERIFIED** (Financial gate verified; clinical gates not implemented in checkout).

### D. Transactionality & State Transition
- Encounter status updates to `DISCHARGED`.
- Timestamp `dischargedAt` recorded in metadata and `updatedAt`.
- Audit event `PATIENT_DISCHARGED` recorded in `core.audit_events`.
- **Verdict**: **VERIFIED**.

### E. Idempotency
- If `enc.status === 'DISCHARGED'`, returns:
  ```json
  { "success": true, "message": "Encounter already discharged", "status": "DISCHARGED" }
  ```
- Duplicate calls do not duplicate audit events or corrupt state.
- **Verdict**: **VERIFIED**.

---

## 6. FORCE DISCHARGE / ADMINISTRATIVE OVERRIDE AUDIT

- **Schema**:
  ```typescript
  export const CheckoutEncounterSchema = z.object({
    forceDischarge: z.boolean().optional().default(false),
    overrideReason: z.string().trim().optional(),
    notes: z.string().trim().optional()
  });
  ```
- **Findings**:
  1. `overrideReason` is **optional**. Passing `forceDischarge: true` without an `overrideReason` succeeds.
  2. Role check: Any user possessing `clinical:encounters:update` (including standard staff and doctors) can invoke `forceDischarge: true`. There is no check for `HOSPITAL_ADMIN` or a supervisor token.
  3. Scope of bypass: Bypasses financial unsettled invoice check. Does not bypass any other checks because no other checks exist.
  4. Audit: The override is recorded in the `PATIENT_DISCHARGED` audit event metadata (`forceDischarge: true`, `overrideReason`).
- **Risk Classification**: **P1 (Unrestricted Administrative Override)**.

---

## 7. P1-004 VERIFICATION — EXIT HUB

### A. Real Backend Query
- `GET /api/v1/partner/clinical/exit-hub/patients` executes a real multi-table join across `encounters`, `patients`, `consultations`, `labOrders`, `pharmacyPrescriptions`, and `billingInvoices`.
- Discharged encounters are excluded. Clearance status (`consultationStatus`, `labStatus`, `billingStatus`, `pharmacyStatus`, `amountDue`) is computed from database records.
- **Verdict**: **VERIFIED**.

### B. Mock Fallback & Stale State (Defect Documented)
- In `CentralHelpDeskExitHubView.tsx`:
  - Lines 29–72: Hardcoded `MOCK_EXIT_PATIENTS` array (Ramesh Kumar, Sunita Devi, Anil Verma).
  - Line 83: `useState<ExitPatientRecord[]>(MOCK_EXIT_PATIENTS)`.
  - Line 103:
    ```typescript
    if (isMounted && res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
      setPatientsList(res.data);
    }
    ```
  - If `res.data` is an empty array `[]` (a clean facility with zero waiting patients), `setPatientsList` is **never called**. The UI continues displaying the 3 mock patients!
- **Verdict**: **FAILED**. Clean facilities display mock patients.

### C. Document Print Modals (Defect Documented)
- In `CentralHelpDeskExitHubView.tsx`:
  - Lines 142–165: `consultationDto` is a hardcoded mock object ("Acute Viral Pyrexia", "Paracetamol 650mg", "Pantoprazole 40mg").
  - Lines 168–197: `labOrderDto` is a hardcoded mock object ("Dengue NS1 Negative", "Hemoglobin 12.8", "Platelet Count 2.1").
  - Lines 200–216: `invoiceData` is a hardcoded mock object (Total: ₹950).
- Clicking "Print Rx", "Print Lab Report", or "Print Receipt" prints **completely fabricated mock clinical data**, even when viewing a real patient from the database!
- **Verdict**: **FAILED**.

---

## 8. FULL 20-STAGE WORKFLOW REGRESSION

| Stage | Action / Endpoint | Result | Evidence |
| :---: | :--- | :---: | :--- |
| **1** | Partner Registration | **PASS** | `universal-seed.ts` & `POST /api/v1/auth/register` |
| **2** | HQ Approval / Verification | **PASS** | `company.partner_profiles` status `ACTIVE` |
| **3** | Partner Login | **PASS** | `POST /api/v1/auth/login` $\rightarrow$ JWT Token |
| **4** | Profile Completion | **PARTIAL** | Backend persists (200 OK); frontend guard lacks API hydration |
| **5** | Staff Setup & RBAC | **PASS** | Roles assigned; JWT claims include roles & permissions |
| **6** | Patient Registration | **PASS** | `POST /api/v1/partner/patients` (HTTP 201, MRN allocated) |
| **7** | Appointment / Check-In | **PASS** | `POST /api/v1/partner/encounters` (HTTP 201, OPD encounter) |
| **8** | Payment (Advance/Registration) | **PASS** | `POST /api/v1/partner/billing/invoices/:id/payments` |
| **9** | Vitals Recording | **PASS** | Clinical encounter vitals logging |
| **10** | Token / Queue Allocation | **PASS** | Token `ACC-2026-XXXX` generated |
| **11** | Doctor Assignment | **PASS** | Doctor identity attached to consultation |
| **12** | Clinical Consultation | **PASS** | `POST /api/v1/partner/clinical/consultations` (HTTP 201) |
| **13** | Test Order Creation | **PASS** | `POST /api/v1/partner/lab/orders` (HTTP 201) |
| **14** | Lab Accessioning & Barcode | **PASS** | `POST /api/v1/partner/lab/orders/:id/collect-sample` (Barcode: `ACC-2026-XXXX`) |
| **15** | Result Entry & Flagging | **PASS** | `POST /api/v1/partner/lab/orders/:id/results` (HTTP 201) |
| **16** | Pathologist Verification | **PASS** | `PATCH /api/v1/partner/lab/orders/:id/verify` (HTTP 200, status: `VERIFIED`) |
| **17** | E-Prescription Finalization | **PASS** | Digital signature and prescription finalization |
| **18** | Pharmacy Stock Receipt | **PASS** | `POST /api/v1/partner/pharmacy/batches/receive-stock` (Batch allocated) |
| **19** | Pharmacy POS Dispensing | **PASS** | `POST /api/v1/partner/pharmacy/dispense` (HTTP 201, FEFO stock deducted) |
| **20** | Exit Hub Checkout & Handover | **PASS** | `POST /api/v1/partner/clinical/encounters/:id/checkout` (HTTP 200, `DISCHARGED`) |

---

## 9. PROCESS RESTART / PERSISTENCE TEST

- The daemon `scripts/start-all.js` was restarted during the audit session.
- State verified surviving restart in PostgreSQL:
  - Patients, Encounters, Consultations, Lab Orders, Lab Results, Batches, Stock Movements, Billing Invoices, Payments, Discharges.
- **Defect Identified**: Partner profile completion state in frontend does not survive `localStorage` wipe or fresh browser sessions.

---

## 10. SECURITY REGRESSION

- **Tenant Isolation**: 4/4 attack tests blocked. Authenticated session `tenantId` is strictly authoritative. Cross-tenant invoice, encounter, and patient access rejected with HTTP 403/404.
- **Role Isolation**: Doctor, Pathologist, Cashier, and Pharmacist permissions enforced via RBAC guards.
- **Request Tampering**: Manipulating `tenantId` or `branchId` in request headers or body is detected and blocked by `auth-guard.ts`.
- **Adversarial Audit**: 39/39 security attacks blocked (100% pass rate).

---

## 11. FAILURE-PATH VERIFICATION

| Test Case | Expected Behavior | Actual Behavior | Pass / Fail |
| :--- | :--- | :--- | :---: |
| Missing encounterId on invoice | HTTP 400 Validation Error | HTTP 400 Validation Error | **PASS** |
| Empty encounterId on invoice | HTTP 400 Validation Error | HTTP 400 Validation Error | **PASS** |
| Nonexistent encounterId on invoice | HTTP 400 or 404 Reject | **HTTP 201 Created (silent NULL)** | **FAIL** |
| Cross-tenant encounterId on invoice | HTTP 403 or 404 Reject | **HTTP 201 Created (silent NULL)** | **FAIL** |
| Checkout with unpaid invoice | HTTP 409 Conflict | HTTP 409 Conflict | **PASS** |
| Checkout non-existent encounter | HTTP 404 Not Found | HTTP 404 Not Found | **PASS** |
| Re-checkout already discharged | Deterministic 200 OK | Deterministic 200 OK | **PASS** |
| Void paid invoice without supervisor token | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| Force discharge without override reason | HTTP 400 Reject | **HTTP 200 OK (accepted)** | **FAIL** |

---

## 12. MOCK / DEMO DATA AUDIT

| Location | Identifier | Classification | Can Participate in Prod? |
| :--- | :--- | :--- | :---: |
| `CentralHelpDeskExitHubView.tsx:29` | `MOCK_EXIT_PATIENTS` | Frontend Fallback | **YES** (Displayed if facility has 0 exit patients) |
| `CentralHelpDeskExitHubView.tsx:142` | `consultationDto` | Hardcoded Mock DTO | **YES** (Printed when clicking "Print Rx") |
| `CentralHelpDeskExitHubView.tsx:168` | `labOrderDto` | Hardcoded Mock DTO | **YES** (Printed when clicking "Print Lab Report") |
| `CentralHelpDeskExitHubView.tsx:200` | `invoiceData` | Hardcoded Mock DTO | **YES** (Printed when clicking "Print Receipt") |
| `universal-seed.ts:351` | Demo Fixtures | Environment Gated | **NO** (Gated by `SEED_DEMO_FIXTURES=false`) |
| `partner-platform/src/services/` | `MOCK_*` arrays | In-Memory Fallback | **NO** (`isMockFallbackAllowed() === false`) |

---

## 13. DATABASE INTEGRITY AUDIT

1. `clinical.billing_invoices`:
   - `encounter_id` has a foreign key to `clinical.encounters(id)` with `ON DELETE SET NULL`.
   - `encounter_id` is **NULLABLE**.
   - Because `BillingManagementRepository.createInvoice` sets `resolvedEncounterId = null` when an encounter is not found, orphan invoices with `encounter_id = NULL` can be created via the API.
2. `clinical.encounters`:
   - Status transitions from `ARRIVED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` $\rightarrow$ `DISCHARGED`.
   - `closedAt` and metadata fields are properly populated on checkout.
3. `core.audit_events`:
   - Immutable audit logging with SHA-256 integrity hashing is operational.
   - `INVOICE_VOIDED` and `PATIENT_DISCHARGED` events are recorded.

---

## 14. TEST QUALITY ASSESSMENT

Review of `apps/api-gateway/test/p1-workflow-remediation-verification.test.mjs`:
- **Test 1 (Profile Update)**: Proves `PUT /api/v1/partner/profile` persists to PostgreSQL and `GET /api/v1/partner/account/plan-and-features` reads it. Does NOT prove frontend browser independence or frontend guard hydration.
- **Test 2 (Invoice Missing Encounter)**: Proves `POST /api/v1/partner/billing/invoices` rejects missing `encounterId` with 400. Does NOT test passing a nonexistent or cross-tenant `encounterId`.
- **Test 3 (Invoice Valid Encounter)**: Proves invoice with valid encounter is created and linked.
- **Test 4 (Exit Hub Query)**: Proves `GET /api/v1/partner/clinical/exit-hub/patients` returns active encounter. Does NOT test frontend view behavior or print DTOs.
- **Test 5 (Checkout Rejection)**: Proves checkout rejects unpaid invoices with 409 Conflict.
- **Test 6 (Force Discharge)**: Proves checkout with `forceDischarge: true` succeeds. Does NOT test whether `overrideReason` is mandatory or role-restricted.

---

## 15. BUILD & TYPECHECK RESULTS

- `packages/database`: Clean (`tsc --noEmit`, exit code 0).
- `apps/api-gateway`: Clean (`npm run build`, exit code 0).
- `apps/partner-platform`: Clean (`npm run build`, exit code 0, 995 modules, 10.51s).
- `apps/company-platform`: Clean (`npm run build`, exit code 0, 496 modules, 5.08s).
- `apps/landing-page`: Clean (`npm run build`, exit code 0, 133 modules, 1.68s).

---

## 16. REMAINING P0/P1/P2 FINDINGS

### P0 (Blockers): 0

### P1 (Required for Defined Operational Workflow): 4
1. **P1-A (Profile Guard Lacks Backend Hydration)**: `partnerProfileGuard.ts` relies on `localStorage` and is not hydrated from the backend API on login. Clearing storage or logging in from Browser B falsely reports the profile as incomplete.
2. **P1-B (Nonexistent EncounterId Silently Converted to NULL)**: `BillingManagementRepository.ts` lines 551–564 catches nonexistent `encounterId` and sets `resolvedEncounterId = null`, allowing orphan invoices to be created with HTTP 201. Must reject with HTTP 404/400.
3. **P1-C (Exit Hub Print Modals Use Hardcoded Mock DTOs)**: In `CentralHelpDeskExitHubView.tsx`, clicking print buttons prints hardcoded fake data ("Acute Viral Pyrexia", "Paracetamol", "Dengue NS1 Negative", ₹950 total) rather than real patient data.
4. **P1-D (Unrestricted Force Discharge)**: `CheckoutEncounterSchema` does not require `overrideReason`, and `checkoutEncounter` does not enforce supervisor authorization for `forceDischarge: true`.

### P2 (Non-Blocking Improvements): 3
1. **P2-A (Empty Exit Queue Displays Mock Patients)**: `CentralHelpDeskExitHubView.tsx` line 103 does not call `setPatientsList([])` if the API returns an empty array `[]`.
2. **P2-B (Unit Test Mock Query Builder Incompleteness)**: `invoice-void-discount.test.ts` `mockTx` lacks `.leftJoin()`.
3. **P2-C (Gate 17 Output String Interpolation)**: Cosmetic `[object Object]` in test runner log.

---

## 17. PRODUCTION CANDIDATE DECISION

### **POST-REMEDIATION VERIFICATION COMPLETE — PRODUCTION CANDIDATE / CONDITIONAL**

**Rationale**:
The core real-world healthcare workflow (Registration $\rightarrow$ Encounter $\rightarrow$ Consultation $\rightarrow$ Lab Accessioning $\rightarrow$ Pathologist Verification $\rightarrow$ Pharmacy FEFO $\rightarrow$ Billing Invoice $\rightarrow$ Payment $\rightarrow$ Exit Checkout) executes end-to-end against live PostgreSQL with zero P0 blockers, 17/17 Production-Truth Gates passing, and 39/39 Security Attacks blocked.

However, **Full Production Freeze ("Production Ready") cannot be granted** due to the 4 remaining P1 findings:
1. Browser independence of the Partner Profile Guard.
2. Silent NULL fallback on nonexistent `encounterId`.
3. Hardcoded mock print DTOs in the Exit Hub.
4. Unrestricted `forceDischarge` without mandatory reason or supervisor authorization.

---

## 18. EXACT REQUIRED NEXT ACTIONS

1. **Fix `BillingManagementRepository.ts`**:
   - Replace `if (!enc) { resolvedEncounterId = null; }` with:
     ```typescript
     if (!enc) {
       throw new AppError({
         message: `Encounter ${record.encounterId} not found for this facility.`,
         code: ErrorCode.NOT_FOUND,
         statusCode: 404
       });
     }
     ```
2. **Hydrate Profile Guard on Login**:
   - In `HospitalStaffLogin.tsx`, include `isProfileCompleted` in `resolvedStaffUser` from the login response.
   - In `partnerProfileGuard.ts`, fetch `/api/v1/partner/account/plan-and-features` on boot if `localStorage` lacks status.
3. **Wire Exit Hub Print Modals to Real Records**:
   - In `CentralHelpDeskExitHubView.tsx`, fetch real consultation, lab order, and invoice data when clicking Print buttons.
   - Set `setPatientsList(res.data)` even when `res.data.length === 0`.
4. **Enforce Force Discharge Governance**:
   - In `CheckoutEncounterSchema`, require `overrideReason: z.string().trim().min(5)`.
   - In `ClinicalWorkflowService.checkoutEncounter`, require supervisor role or supervisor token if `forceDischarge: true`.

---

## 19. SCOPE FREEZE STATEMENT

In accordance with strict audit directives:
- Zero source code files were modified during this audit.
- Zero database schemas or migrations were altered.
- All findings have been documented with concrete line numbers and runtime evidence.

---

**POST-REMEDIATION VERIFICATION COMPLETE — PRODUCTION CANDIDATE / CONDITIONAL**
