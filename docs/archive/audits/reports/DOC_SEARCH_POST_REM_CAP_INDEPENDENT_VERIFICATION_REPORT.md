# DOC SEARCH — POST-REM-CAP INDEPENDENT VERIFICATION REPORT

---

## 1. Audit Metadata

| Field | Value |
| :--- | :--- |
| **Report Title** | `DOC SEARCH — POST-REM-CAP INDEPENDENT VERIFICATION REPORT` |
| **Audit Step** | `STEP 1 — CURRENT REMEDIATION INDEPENDENT VERIFICATION` |
| **Audit Date** | `2026-09-25` |
| **Audit Mode** | **`STRICT READ-ONLY VERIFICATION AUDIT`** (`0` source modifications, `0` schema/migration edits, `0` test modifications) |
| **Auditor Roles** | Principal Healthcare SaaS Architect, RBAC/ABAC Security Architect, Multi-Tenant SaaS Architect, Entitlement & Licensing Architect, Senior QA/Verification Engineer |
| **Live Test Suites Executed** | `post-rem-cap01-cap04-remediation.test.mjs` (`4/4 PASS`), `cap01-cap07-remediation.test.mjs` (`9/9 PASS`), `p0-p1-remediation-verification.test.mjs` + `partner-onboarding-commercial-lifecycle.test.mjs` + `partner-onboarding-persistence-p1.test.mjs` + `pharmacy-management-vertical-slice.test.mjs` (`94/94 PASS`) — **Total: `107 / 107 PASS`** |

---

## 2. Verification Scope

This read-only audit independently verified all defined `POST-REM-CAP-*` remediation items (`POST-REM-CAP-01` through `POST-REM-CAP-04`) and their foundational prerequisite `CAP-*` items (`CAP-01` through `CAP-07`) across:
- **Backend Entitlement & Commercial Guards**:
  - [`apps/api-gateway/src/services/company/EntitlementService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/EntitlementService.ts)
  - [`apps/api-gateway/src/plugins/commercial-guard.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/plugins/commercial-guard.ts)
  - [`apps/api-gateway/src/services/company/LicenseService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/LicenseService.ts)
- **Authentication, RBAC & ABAC Scope Guards**:
  - [`packages/auth/src/scope-guard.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/auth/src/scope-guard.ts)
  - [`packages/auth/src/rbac-evaluator.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/auth/src/rbac-evaluator.ts)
  - [`packages/shared-core/src/workflow/facility-normalizer.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/shared-core/src/workflow/facility-normalizer.ts)
  - [`apps/api-gateway/src/services/core/RealAuthService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/core/RealAuthService.ts)
- **Partner Clinical, Diagnostic, Pharmacy & Inpatient Services/Repositories**:
  - [`apps/api-gateway/src/services/partner/LabDiagnosticsService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/LabDiagnosticsService.ts)
  - [`apps/api-gateway/src/services/partner/RadiologyService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/RadiologyService.ts)
  - [`apps/api-gateway/src/services/partner/PharmacyManagementService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/PharmacyManagementService.ts)
  - [`apps/api-gateway/src/services/partner/InpatientManagementService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/InpatientManagementService.ts)
  - [`apps/api-gateway/src/services/partner/ClinicalWorkflowService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/ClinicalWorkflowService.ts)
  - [`apps/api-gateway/src/services/partner/BillingManagementService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/BillingManagementService.ts)
  - [`apps/api-gateway/src/services/partner/WholesaleInvoiceIngestionService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/WholesaleInvoiceIngestionService.ts)
- **Partner Platform Frontend Storage & Gating**:
  - [`apps/partner-platform/src/services/patient-session-tab-service.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/services/patient-session-tab-service.ts)
  - [`apps/partner-platform/src/services/pharmacy-offline-storage-service.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/services/pharmacy-offline-storage-service.ts)
  - [`apps/partner-platform/src/services/api-client.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/services/api-client.ts)
  - [`apps/partner-platform/src/utils/partnerRolePermissions.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/utils/partnerRolePermissions.ts)
  - [`apps/partner-platform/src/components/PartnerPlatformShell.tsx`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/components/PartnerPlatformShell.tsx)

---

## 3. Source-of-Truth Remediation Baseline

The repository contains the following authoritative audit and remediation specifications (in chronological order):

1. **[DOC_SEARCH_PARTNER_PROFILE_INDUSTRY_CAPABILITY_DEEP_AUDIT_REPORT.md](file:///C:/Users/alamr/.gemini/antigravity/brain/892f07c8-c0bb-480f-a73b-ee5cfc4b62ea/DOC_SEARCH_PARTNER_PROFILE_INDUSTRY_CAPABILITY_DEEP_AUDIT_REPORT.md)** (`2026-09-25T08:43:58Z`): Defined `CAP-01` through `CAP-07`.
2. **[DOC_SEARCH_CAP_01_TO_CAP_07_REMEDIATION_REPORT.md](file:///C:/Users/alamr/.gemini/antigravity/brain/892f07c8-c0bb-480f-a73b-ee5cfc4b62ea/DOC_SEARCH_CAP_01_TO_CAP_07_REMEDIATION_REPORT.md)** (`2026-09-25T10:43:45Z`): Documented remediation of `CAP-01` through `CAP-07`.
3. **[DOC_SEARCH_POST_REMEDIATION_PARTNER_PROFILE_INDUSTRY_CAPABILITY_AUDIT.md](file:///C:/Users/alamr/.gemini/antigravity/brain/892f07c8-c0bb-480f-a73b-ee5cfc4b62ea/DOC_SEARCH_POST_REMEDIATION_PARTNER_PROFILE_INDUSTRY_CAPABILITY_AUDIT.md)** (`2026-09-25T10:53:14Z`): Authoritative independent post-remediation audit that re-verified `CAP-01` through `CAP-07` and defined the **4 authoritative `POST-REM-CAP-*` items**:
   - `POST-REM-CAP-01`
   - `POST-REM-CAP-02`
   - `POST-REM-CAP-03`
   - `POST-REM-CAP-04`
4. **[DOC_SEARCH_POST_REM_CAP_01_04_REMEDIATION_REPORT.md](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/DOC_SEARCH_POST_REM_CAP_01_04_REMEDIATION_REPORT.md)** (`2026-09-25T12:09:33Z`): Latest remediation implementation report claiming full remediation of `POST-REM-CAP-01` through `POST-REM-CAP-04`.

**Verification Baseline Selected**: `DOC_SEARCH_POST_REMEDIATION_PARTNER_PROFILE_INDUSTRY_CAPABILITY_AUDIT.md` + `DOC_SEARCH_POST_REM_CAP_01_04_REMEDIATION_REPORT.md` (covering `POST-REM-CAP-01`..`POST-REM-CAP-04` as primary targets and `CAP-01`..`CAP-07` as prerequisite capability baselines; `11` total items audited).

---

## 4. CAP Inventory

| CAP ID | Series | Baseline Priority | Summary of Requirement |
| :--- | :--- | :--- | :--- |
| **`POST-REM-CAP-01`** | Post-Rem | `P2` (Entitlement) | Separate `PHARMACY_WHOLESALE` from retail `PHARMACY_` prefix wildcards in `EntitlementService.ts` and register `plan-pharma-wholesale-free-yr1` and `plan-pharma-wholesale-annual-yr2` in `planPharmIds` / `planPharmaWholesaleIds`. |
| **`POST-REM-CAP-02`** | Post-Rem | `P2` / `P1` (Scope Isolation) | Propagate `ScopeGuard.resolveEffectiveQueryScope(session)` into `LabDiagnosticsService`, `RadiologyService`, `PharmacyManagementService`, and `InpatientManagementService` to enforce branch & department isolation. |
| **`POST-REM-CAP-03`** | Post-Rem | `P2` / `P1` (Module Boundary) | Enforce server-side `PARTNER_PROFILE_ALLOWED_MODULES[partnerType]` intersection inside `commercial-guard.ts` (`requireModuleCommercialAccess`) and `EntitlementService`. |
| **`POST-REM-CAP-04`** | Post-Rem | `P3` (Client Storage) | Namespace partner-platform `localStorage` & `IndexedDB` keys (`patient-session-tab-service.ts`, `pharmacy-offline-storage-service.ts`) by `${tenantId}:${userId}` and purge on logout. |
| **`CAP-01`** | Prerequisite | `P1` | Intersect Partner Profile allowed modules with Staff Role permissions in `partnerRolePermissions.ts` and `PartnerPlatformShell.tsx` so `['*']` roles (`OWNER`, `HOSPITAL_ADMIN`) cannot bypass facility boundaries. |
| **`CAP-02`** | Prerequisite | `P1` | Prevent privilege escalation in `RealAuthService.ts` by removing auto-injected `HOSPITAL_ADMIN` role and `staff:write` / `partners:write` permissions from operational staff logins. |
| **`CAP-03`** | Prerequisite | `P1` | Make `normalizeFacilityProfile()` in `facility-normalizer.ts` fail closed to `RESTRICTED` on `null`, `undefined`, empty, or unknown/tampered facility strings (never default to `HOSPITAL`). |
| **`CAP-04`** | Prerequisite | `P2` | Enforce Wholesale Pharmacy B2B distribution profile, commercial entitlement (`PHARMACY_WHOLESALE`), seller Form 20B/21B Drug License, and buyer Drug License in `WholesaleInvoiceIngestionService.ts`. |
| **`CAP-05`** | Prerequisite | `P2` | Enforce branch and department server-side data scope (`ScopeGuard.resolveEffectiveQueryScope`) and reject tampered query scope in `ClinicalWorkflowService` and `BillingManagementService`. |
| **`CAP-06`** | Prerequisite | `P2` | Atomically revalidate existing staff roles and revoke incompatible sessions/logins when a partner transitions facility profiles (`StaffAdministrationService.ts`, `PartnerAccountService.ts`). |
| **`CAP-07`** | Prerequisite | `P2` | Include `DIAGNOSTIC_CENTRE` and `PHARMACY_WHOLESALE` in `RegistrationFormPolicyService.allowedFacilityTypes` and canonical plan resolution. |

---

## 5. CAP-by-CAP Verification Table

| CAP ID | Requirement | Evidence | Implementation | Runtime/Test | Security/Isolation | Regression | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`POST-REM-CAP-01`** | Exclude `PHARMACY_WHOLESALE` from retail `PHARMACY_` prefix wildcards; register `plan-pharma-wholesale-free-yr1` & `plan-pharma-wholesale-annual-yr2` | [`EntitlementService.ts:100-108, 160-175, 233-238, 305-355`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/EntitlementService.ts#L160-L355) | `isWholesaleFeature` & `isRetailPosFeature` explicitly separated in DB entitlements, `includedModules`, and `planPharmaWholesaleIds` vs `planPharmIds` | `post-rem-cap01-cap04-remediation.test.mjs` Test 1 (`PASS`) | Retail plans blocked from `PHARMACY_WHOLESALE`; Wholesale plans blocked from `PHARMACY_POS` | Retail POS FEFO slice `11/11 PASS` | **`VERIFIED`** |
| **`POST-REM-CAP-02`** | Propagate `ScopeGuard.resolveEffectiveQueryScope(session)` across `LabDiagnosticsService`, `RadiologyService`, `PharmacyManagementService`, `InpatientManagementService` | [`scope-guard.ts:75-228`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/auth/src/scope-guard.ts#L75-L228), [`LabDiagnosticsService.ts:13-244`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/LabDiagnosticsService.ts#L13-L244), [`RadiologyService.ts:74-320`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/RadiologyService.ts#L74-L320) | Applied to list/read/create methods; **missing** on ID-based mutations (`collectSpecimen`, `enterResult`, `verifyResult`, `cancelOrder`, `updateOrderStatus`) and weakened by `isDefaultSeededFacility` (`0002`/`0003`) exemption in `ScopeGuard` | `post-rem-cap01-cap04-remediation.test.mjs` Test 2 (`PASS` on read/getById) | Cross-branch ID-based mutation bypass possible when `branchId` omitted from body; fallback UUID `0003` bypasses branch filter | No regression in existing tests | **`PARTIAL`** |
| **`POST-REM-CAP-03`** | Server-side `PARTNER_PROFILE_ALLOWED_MODULES[partnerType]` intersection in `commercial-guard.ts` & `EntitlementService` | [`commercial-guard.ts:158-256`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/plugins/commercial-guard.ts#L158-L256), [`EntitlementService.ts:165-227`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/EntitlementService.ts#L165-L227) | Enforced in `requireModuleCommercialAccess` & `EntitlementService` `if (!matched)` block; **skipped** in `EntitlementService.canAccess` when DB `plan_entitlements` (`matched`) returns truthy (`L195`), and omitted in `requireFeatureEntitlement` (`L177`) | `post-rem-cap01-cap04-remediation.test.mjs` Test 3 (`PASS` on metadata override) | If DB `plan_entitlements` has out-of-profile row or route uses `requireFeatureEntitlement`, profile check is bypassed | No regression | **`PARTIAL`** |
| **`POST-REM-CAP-04`** | Namespace `localStorage` & `IndexedDB` keys by `${tenantId}:${userId}` and purge on logout | [`patient-session-tab-service.ts:31-148`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/services/patient-session-tab-service.ts#L31-L148), [`pharmacy-offline-storage-service.ts:90-210`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/services/pharmacy-offline-storage-service.ts#L90-L210), [`api-client.ts:37-51`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/services/api-client.ts#L37-L51) | Keys formatted as `docsearch:${tenantId}:${userId}:<key>`; legacy keys deleted; `docsearch:auth_logout` purges state | `post-rem-cap01-cap04-remediation.test.mjs` Test 4 (`PASS`) | Prevents cross-tenant/cross-user tab & offline POS leakage on shared browsers | No regression | **`VERIFIED`** |
| **`CAP-01`** | Partner Profile ∩ Role UI & Workspace boundary intersection | [`partnerRolePermissions.ts:1210-1284`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/utils/partnerRolePermissions.ts#L1210-L1284), [`PartnerPlatformShell.tsx:351-3645`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src/components/PartnerPlatformShell.tsx#L351-L3645) | `isModuleAllowedForPartnerProfile` & `isWorkspaceAllowedForPartnerProfile` block `['*']` role escalation | `cap01-cap07-remediation.test.mjs` Tests 2 & 3 (`PASS`) | `PATHOLOGY`/`PHARMACY`/`CLINIC` `OWNER` blocked from `HOSPITAL` workspaces | No regression | **`VERIFIED`** |
| **`CAP-02`** | Operational staff privilege escalation prevention | [`RealAuthService.ts:187-241`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/core/RealAuthService.ts#L187-L241) | `resolveStrictPermissionsForRoles` strips `HOSPITAL_ADMIN`, `staff:write`, `partners:write` from non-admin staff | `cap01-cap07-remediation.test.mjs` Test 4 & HTTP Route Test (`PASS`) | Phlebotomist/Receptionist/Nurse cannot create staff or modify partner profile (`403`) | No regression | **`VERIFIED`** |
| **`CAP-03`** | Fail-closed `normalizeFacilityProfile()` to `RESTRICTED` | [`facility-normalizer.ts:147-267`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/shared-core/src/workflow/facility-normalizer.ts#L147-L267) | Unknown/null/empty/tampered inputs return `RESTRICTED_FACILITY_PROFILE` (`allowedWorkspaces: []`) | `cap01-cap07-remediation.test.mjs` Test 1 (`PASS`) | Tampered strings (`SUPER_HOSPITAL_HACK`) quarantined to `RESTRICTED` | No regression | **`VERIFIED`** |
| **`CAP-04`** | Wholesale Pharmacy B2B distribution governance | [`WholesaleInvoiceIngestionService.ts:615-910`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/WholesaleInvoiceIngestionService.ts#L615-L910), [`pharmacy-management.routes.ts:292-345`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/pharmacy-management.routes.ts#L292-L345) | `executeWholesaleB2bDispatch` enforces tenant, profile, `PHARMACY_WHOLESALE` entitlement, Seller Form 20B/21B DL, and Buyer DL | `cap01-cap07-remediation.test.mjs` Test 5 & HTTP Route Test (`PASS`) | Retail-only pharmacy & expired Form 20B/21B blocked with `403` | No regression | **`VERIFIED`** |
| **`CAP-05`** | Branch & Department `ScopeGuard` in Clinical & Billing | [`scope-guard.ts:75-142`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/auth/src/scope-guard.ts#L75-L142), [`ClinicalWorkflowService.ts:19-125`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/ClinicalWorkflowService.ts#L19-L125), [`BillingManagementService.ts:32-90`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/BillingManagementService.ts#L32-L90) | `resolveEffectiveQueryScope` wired into Clinical & Billing services and repositories | `cap01-cap07-remediation.test.mjs` Test 6 & HTTP Route Test (`PASS`) | Tampered `branchId` / `departmentId` rejected with `403` | No regression | **`VERIFIED`** |
| **`CAP-06`** | Atomic staff revalidation on partner profile transition | [`StaffAdministrationService.ts:781-940`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/StaffAdministrationService.ts#L781-L940), [`PartnerAccountService.ts:651-805`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/PartnerAccountService.ts#L651-L805) | `revalidateStaffOnProfileChange` marks incompatible staff `RESTRICTED_BY_PROFILE` and revokes active tokens | `cap01-cap07-remediation.test.mjs` Test 7 (`PASS`) | Restricted staff blocked at login and active JWT guard (`403`) | No regression | **`VERIFIED`** |
| **`CAP-07`** | `RegistrationFormPolicyService` canonical facility types | [`RegistrationFormPolicyService.ts:33-370`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/core/RegistrationFormPolicyService.ts#L33-L370) | Includes all 6 canonical types (`HOSPITAL`, `CLINIC`, `PATHOLOGY`, `PHARMACY`, `PHARMACY_WHOLESALE`, `DIAGNOSTIC_CENTRE`) | `cap01-cap07-remediation.test.mjs` Test 8 (`PASS`) | Deterministic plan resolution for all 6 facility types | No regression | **`VERIFIED`** |

---

## 6. Detailed Evidence (`PARTIAL` & `VERIFIED` Items)

### 6.1 Detailed Findings for `PARTIAL` Items (Section 16 Format)

#### Finding 1 — `POST-REM-CAP-02` (`PARTIAL`)
```text
CAP ID: POST-REM-CAP-02
Title: Incomplete Branch/Department Scope Enforcement on ID-Based Service Mutations & Hardcoded Default Facility Exemption in ScopeGuard
Required remediation:
Propagate ScopeGuard.resolveEffectiveQueryScope(session) and record-level branch/department isolation consistently across LabDiagnosticsService, RadiologyService, PharmacyManagementService, and InpatientManagementService so no branch- or department-scoped user can read or mutate another branch's or department's records.

Observed implementation:
1. Read, list, create, and getById methods (LabDiagnosticsService.searchOrders/getOrderById/createOrder, RadiologyService.getModalities/getProcedures/getOrders/getOrderById/createOrder, PharmacyManagementService.getPrescriptionQueue/getPrescriptionById/getMedications/getBatches/getInventory, InpatientManagementService.getWards/getBeds/getAdmissions/getNursingNotes) invoke ScopeGuard.resolveEffectiveQueryScope(), ScopeGuard.filterRecordsByScope(), and ScopeGuard.assertRecordInScope().
2. However, ID-based state mutation methods in LabDiagnosticsService (collectSpecimen L71-92, enterResult L94-115, verifyResult L117-148, reviewResult L150-167, cancelOrder L169-186, logPanicIntimation L200-244) and RadiologyService (updateOrderStatus L240-278, scheduleAppointment L287-320) pass only session.tenantId to the repository without invoking ScopeGuard.resolveEffectiveQueryScope() or asserting ScopeGuard.assertRecordInScope() on the target order's branchId/departmentId.
3. Furthermore, ScopeGuard.filterRecordsByScope (packages/auth/src/scope-guard.ts:158-165) and ScopeGuard.assertRecordInScope (packages/auth/src/scope-guard.ts:201-208) contain a hardcoded bypass:
   const isDefaultSeededFacility =
     recBranch === '00000000-0000-4000-8000-000000000002' ||
     recBranch === '00000000-0000-4000-8000-000000000003';
   Because PharmacyManagementRepository.resolveBranchId (L106) falls back to '00000000-0000-4000-8000-000000000003', any record saved with that fallback UUID bypasses branch scope filtering.

Evidence:
- apps/api-gateway/src/services/partner/LabDiagnosticsService.ts (lines 71-244: collectSpecimen, enterResult, verifyResult, reviewResult, cancelOrder, logPanicIntimation)
- apps/api-gateway/src/services/partner/RadiologyService.ts (lines 240-320: updateOrderStatus, getAppointments, scheduleAppointment)
- packages/auth/src/scope-guard.ts (lines 158-165, 201-208: isDefaultSeededFacility bypass)
- apps/api-gateway/src/repositories/partner/PharmacyManagementRepository.ts (line 106: resolveBranchId fallback to '00000000-0000-4000-8000-000000000003')

Expected behavior:
1. Every ID-based mutation (collectSpecimen, enterResult, verifyResult, reviewResult, cancelOrder, updateOrderStatus, scheduleAppointment) must fetch the target record, call ScopeGuard.assertRecordInScope(session, record, scope), and reject cross-branch/cross-department mutations with HTTP 403.
2. ScopeGuard.filterRecordsByScope and ScopeGuard.assertRecordInScope must enforce strict equality (recBranch === String(scope.branchId)) with zero hardcoded UUID exemptions.

Observed behavior:
Read/list/getOrderById calls reject cross-branch access with 403 (verified in post-rem-cap01-cap04-remediation.test.mjs), but ID-based mutations in LabDiagnosticsService and RadiologyService do not check record branchId/departmentId when branchId is omitted from the request payload, and records bearing '00000000-0000-4000-8000-000000000003' bypass filterRecordsByScope.

Missing evidence/path:
ScopeGuard.assertRecordInScope(session, existingOrder, scope) prior to repository mutation in LabDiagnosticsService (L71-244) and RadiologyService (L240-320), and removal of isDefaultSeededFacility in scope-guard.ts (L158-165, L201-208).

Security impact:
Intra-tenant lateral privilege violation: a Branch A user who knows a Branch B order UUID can trigger specimen collection, result entry, or order cancellation on Branch B's order if branchId is not sent in the request body/query.

Data isolation impact:
Records mapped to fallback branch UUID '00000000-0000-4000-8000-000000000003' remain visible across all branches of the same tenant.

Workflow impact:
Diagnostic worklists could have specimens or results mutated across branch boundaries within a multi-branch pathology/radiology chain.

Regression impact:
None on existing workflows; this is an incomplete remediation coverage gap.

Required next remediation:
1. Add ScopeGuard.assertRecordInScope(session, targetOrder, scope) before every ID-based mutation in LabDiagnosticsService and RadiologyService.
2. Seed explicit branch UUIDs in test fixtures so 'isDefaultSeededFacility' can be removed from packages/auth/src/scope-guard.ts.

Priority: P1 (Multi-Branch Data Scope & Mutation Isolation)
```

---

#### Finding 2 — `POST-REM-CAP-03` (`PARTIAL`)
```text
CAP ID: POST-REM-CAP-03
Title: EntitlementService Database Plan-Entitlement Early Return & requireFeatureEntitlement Bypass Partner Profile Module Boundary
Required remediation:
Enforce PARTNER_PROFILE_ALLOWED_MODULES[partnerType] intersection on the server side in commercial-guard.ts and EntitlementService so a non-hospital partner (e.g. PATHOLOGY, PHARMACY, CLINIC) can never access out-of-profile modules regardless of license metadata or plan entitlement rows.

Observed implementation:
1. In apps/api-gateway/src/plugins/commercial-guard.ts (lines 158-256), enforcePartnerProfileModuleBoundary(resolvedPartnerType, effectiveModuleCode) is called inside requireModuleCommercialAccess(moduleCode).
2. In apps/api-gateway/src/services/company/EntitlementService.ts (lines 221-227), isModuleAllowedForPartnerProfile(licensePartnerType, normalizedCode) is checked inside the `if (!matched)` block (when productRepository.getPlanEntitlements(license.planId) returns no matching row).
3. However, in EntitlementService.canAccess (lines 165-195), `matched = planEntitlements.find(...)` is evaluated FIRST. When `matched` is truthy (i.e. a row exists in company.plan_entitlements), execution skips lines 195-380 entirely and returns `true` without ever calling `isModuleAllowedForPartnerProfile(licensePartnerType, normalizedCode)`.
4. Additionally, `requireFeatureEntitlement(featureCode)` in apps/api-gateway/src/plugins/commercial-guard.ts (lines 177-184) calls `requireActiveCommercialAccess` and `entitlementService.enforceFeatureAccess`, but does NOT call `enforcePartnerProfileModuleBoundary`.

Evidence:
- apps/api-gateway/src/services/company/EntitlementService.ts (lines 156-195 vs lines 221-227)
- apps/api-gateway/src/plugins/commercial-guard.ts (lines 177-184: requireFeatureEntitlement vs lines 193-258: requireModuleCommercialAccess)

Expected behavior:
`isModuleAllowedForPartnerProfile(partnerType, featureCode)` must be enforced unconditionally at the top of `EntitlementService.canAccess()` (before checking `planEntitlements`, `includedModules`, or `planId` sets) AND inside `requireFeatureEntitlement(featureCode)`.

Observed behavior:
When `productRepository.getPlanEntitlements` returns `[]` (as in unit tests), `EntitlementService.canAccess` enters `if (!matched)` and enforces `isModuleAllowedForPartnerProfile` at line 225. When `plan_entitlements` rows exist in PostgreSQL and match `featureCode`, line 195 (`if (!matched)`) is false and `isModuleAllowedForPartnerProfile` is bypassed inside `EntitlementService.canAccess`.

Missing evidence/path:
Top-level `isModuleAllowedForPartnerProfile` guard prior to `planEntitlements.find()` in `EntitlementService.canAccess` (L155) and inside `requireFeatureEntitlement` (commercial-guard.ts:177).

Security impact:
Routes protected only by `requireFeatureEntitlement` (or direct `entitlementService.canAccess` calls) could allow an out-of-profile feature if a database `plan_entitlements` row matches the feature prefix.

Data isolation impact:
Tenant isolation (`tenantId`) is unaffected, but Partner Profile capability isolation (`PARTNER_PROFILE_ALLOWED_MODULES`) is bypassed on the DB `plan_entitlements` branch of `EntitlementService.canAccess`.

Workflow impact:
Potential exposure of out-of-profile features if DB `plan_entitlements` contains broad feature codes.

Regression impact:
None.

Required next remediation:
Move the `isModuleAllowedForPartnerProfile(licensePartnerType, normalizedCode)` check in `EntitlementService.canAccess()` above line 155 (before `planEntitlements.find()`) and invoke `enforcePartnerProfileModuleBoundary` inside `requireFeatureEntitlement()`.

Priority: P1 (Server-Side Partner Profile Entitlement Boundary)
```

---

### 6.2 Concise Proof for `VERIFIED` Items (Section 17 Format)

#### `POST-REM-CAP-01` — `VERIFIED`
```text
CAP ID: POST-REM-CAP-01
Status: VERIFIED

Requirement:
Exclude PHARMACY_WHOLESALE from retail PHARMACY_ prefix wildcard matching in EntitlementService.ts and register plan-pharma-wholesale-free-yr1 and plan-pharma-wholesale-annual-yr2 in planPharmIds / planPharmaWholesaleIds.

Implementation evidence:
- apps/api-gateway/src/services/company/EntitlementService.ts:
  - Lines 102-108: Parent governance override separates PHARMACY_POS (!normFeat.startsWith('PHARMACY_WHOLESALE')) from PHARMACY_WHOLESALE.
  - Lines 160-175: Defines isWholesaleFeature and isRetailPosFeature; evaluates isWholesaleFeature (L169-171) and isRetailPosFeature (L172-174) before generic PHARMACY_ prefix matching.
  - Lines 233-238: Enforces identical separation on license.metadata.includedModules.
  - Lines 305-320: Registers plan-pharma-wholesale-free-yr1 and plan-pharma-wholesale-annual-yr2 (both string codes and toDeterministicUuid digests) in planPharmaWholesaleIds and planPharmIds.
  - Lines 348-355: Evaluates planPharmaWholesaleIds (grants PHARMACY_WHOLESALE & PHARMACY, blocks isRetailPosFeature) and planPharmIds (grants PHARMACY_POS & PHARMACY, blocks isWholesaleFeature).

Execution path:
requireModuleCommercialAccess('PHARMACY_POS') [commercial-guard.ts:200-217 maps /pharmacy/wholesale/* -> PHARMACY_WHOLESALE, /pharmacy/dispense -> PHARMACY_POS, /pharmacy/medications|batches|inventory -> PHARMACY] -> entitlementService.enforceFeatureAccess -> entitlementService.canAccess.

Verification evidence:
- apps/api-gateway/test/post-rem-cap01-cap04-remediation.test.mjs (lines 75-197): PASS (7.79ms)

Negative/security verification:
- Retail plan (plan-pharma-free-yr1) calling canAccess('PHARMACY_WHOLESALE') -> returns false.
- Retail metadata (includedModules: ['PHARMACY_POS']) calling canAccess('PHARMACY_WHOLESALE') -> returns false.
- Wholesale plans (plan-pharma-wholesale-free-yr1, plan-pharma-wholesale-annual-yr2) calling canAccess('PHARMACY_POS') -> returns false.
- Combo Clinic+Pharmacy (plan-combo-crx-free-yr1) calling canAccess('PHARMACY_WHOLESALE') -> returns false.

Regression check:
- apps/api-gateway/test/pharmacy-management-vertical-slice.test.mjs (11/11 steps PASS): Retail FEFO dispensing, batch receive, and medication catalog unaffected.

Conclusion:
VERIFIED
```

#### `POST-REM-CAP-04` — `VERIFIED`
```text
CAP ID: POST-REM-CAP-04
Status: VERIFIED

Requirement:
Namespace partner-platform localStorage and IndexedDB keys in patient-session-tab-service.ts and pharmacy-offline-storage-service.ts by ${tenantId}:${userId} and purge state on logout.

Implementation evidence:
- apps/partner-platform/src/services/patient-session-tab-service.ts (lines 31-148, 340-365): resolveClientSessionIdentity(), getStorageKey() -> `docsearch:${tenantId}:${userId}:docsearch_session_tabs`, invalidateLegacyGlobalKeys(), purgeOnLogout().
- apps/partner-platform/src/services/pharmacy-offline-storage-service.ts (lines 90-215): getDatabaseName() -> `DocSearchPharmacyLocalDB:${tenantId}:${userId}`, getSimulateOfflineStorageKey() -> `docsearch:${tenantId}:${userId}:docsearch_simulate_offline_mode`, purgeOnLogout().
- apps/partner-platform/src/services/api-client.ts (lines 37-51): clearAllAuthTokens() dispatches `CustomEvent('docsearch:auth_logout')` and clears session/auth tokens.

Execution path:
User login/session switch -> setSessionContext(tenantId, userId) -> reads/writes strictly under `docsearch:${tenantId}:${userId}:*`. Logout -> clearAllAuthTokens() -> dispatches `docsearch:auth_logout` -> PatientSessionTabService.purgeOnLogout() + PharmacyOfflineStorageService.purgeOnLogout().

Verification evidence:
- apps/api-gateway/test/post-rem-cap01-cap04-remediation.test.mjs (lines 482-596): PASS (3.21ms)

Negative/security verification:
- Tenant B (`tenant-beta:user-pharmacist-2`) cannot read Tenant A (`tenant-alpha:user-doc-1`) patient tabs (`0` tabs leaked).
- Legacy unnamespaced `localStorage.getItem('docsearch_session_tabs')` is immediately invalidated (`null`).
- Calling `clearAllAuthTokens()` purges active tenant/user storage keys (`null`).

Regression check:
- Multi-tab OPD/POS state persistence within the same authenticated session remains intact.

Conclusion:
VERIFIED
```

#### `CAP-01` through `CAP-07` — `VERIFIED`
```text
CAP IDs: CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-06, CAP-07
Status: VERIFIED

Implementation & Execution Evidence:
- CAP-01: apps/partner-platform/src/utils/partnerRolePermissions.ts (L1210-1284) & PartnerPlatformShell.tsx (L351-3645) intersect role permissions with PARTNER_PROFILE_ALLOWED_MODULES.
- CAP-02: apps/api-gateway/src/services/core/RealAuthService.ts (L187-241) resolveStrictPermissionsForRoles() prevents HOSPITAL_ADMIN / staff:write injection on operational_staff.
- CAP-03: packages/shared-core/src/workflow/facility-normalizer.ts (L147-267) normalizeFacilityProfile() returns RESTRICTED_FACILITY_PROFILE for null/empty/unknown/tampered facility strings.
- CAP-04: apps/api-gateway/src/services/partner/WholesaleInvoiceIngestionService.ts (L615-910) executeWholesaleB2bDispatch() enforces tenant scope, partner profile, PHARMACY_WHOLESALE entitlement, non-expired Seller Form 20B/21B DL, and Buyer DL.
- CAP-05: packages/auth/src/scope-guard.ts (L75-142), ClinicalWorkflowService.ts (L19-125), BillingManagementService.ts (L32-90) enforce branch/department scope and block tampered query scopes with 403.
- CAP-06: apps/api-gateway/src/services/partner/StaffAdministrationService.ts (L781-940) & PartnerAccountService.ts (L651-805) atomically revalidate staff on profile change, set RESTRICTED_BY_PROFILE, and revoke sessions.
- CAP-07: apps/api-gateway/src/services/core/RegistrationFormPolicyService.ts (L33-370) supports all 6 canonical facility types including DIAGNOSTIC_CENTRE and PHARMACY_WHOLESALE.

Verification evidence:
- apps/api-gateway/test/cap01-cap07-remediation.test.mjs: 9 / 9 tests PASS.

Conclusion:
VERIFIED
```

---

## 7. Security & Tenant Isolation Verification

| Adversarial Vector | Verification Method & Evidence | Observed Result | Verdict |
| :--- | :--- | :--- | :--- |
| **Tenant Isolation (`Tenant A` → `Tenant B`)** | `withSecurityContext` PostgreSQL RLS (`engine-rls.ts`) + `ScopeGuard.enforceTenantScope` (`scope-guard.ts:9-21`) + `pharmacy-management-vertical-slice.test.mjs` Step 11 | Cross-tenant queries return `0` rows or throw `403 TENANT_ACCESS_DENIED` | **`VERIFIED`** |
| **Partner Isolation (`Partner A` → `Partner B`)** | `partnerProfiles.tenantId` + `WholesaleInvoiceIngestionService` cross-tenant check (`cap01-cap07-remediation.test.mjs` Test 5) | Cross-partner B2B dispatch throws `403 TENANT_ACCESS_DENIED` | **`VERIFIED`** |
| **Role Escalation (`PHLEBOTOMIST` → `HOSPITAL_ADMIN`)** | `RealAuthService.resolveStrictPermissionsForRoles` (`RealAuthService.ts:187-241`) + Fastify route injection (`POST /api/v1/partner/staff`) | Operational staff receives `403 INSUFFICIENT_PERMISSIONS` on admin routes | **`VERIFIED`** |
| **Client-Supplied `tenantId` / `branchId` / `departmentId` Override** | `ScopeGuard.resolveEffectiveQueryScope` (`scope-guard.ts:95-125`) + `auth-guard.ts` (`L198-L215`) | Tampered `tenantId`, `branchId`, or `departmentId` throws `403` (`TENANT_ACCESS_DENIED` / `BRANCH_ACCESS_DENIED` / `FORBIDDEN`) | **`VERIFIED`** |
| **Cross-Branch ID-Based Mutation (`Branch A` mutating `Branch B` Order by UUID)** | Static trace of `LabDiagnosticsService.collectSpecimen/enterResult/verifyResult/cancelOrder` (`L71-186`) & `RadiologyService.updateOrderStatus` (`L240-278`) | Read `getOrderById` blocks with `403`, but mutation methods do not call `assertRecordInScope` when `branchId` is omitted from payload | **`PARTIAL` (`POST-REM-CAP-02`)** |
| **Entitlement Bypass via `metadata.includedModules` vs DB `plan_entitlements`** | `commercial-guard.ts:158-256` & `EntitlementService.ts:165-227` | Blocked in `requireModuleCommercialAccess` and `includedModules`, but `EntitlementService.canAccess` skips `isModuleAllowedForPartnerProfile` when DB `plan_entitlements` (`matched`) is truthy (`L195`) | **`PARTIAL` (`POST-REM-CAP-03`)** |
| **Expired / Suspended License Access** | `LicenseService.evaluateLicenseStatus` (`LicenseService.ts:126-195`) + `commercial-guard.ts:60-88` | Expired/suspended licenses return `403 COMMERCIAL_ACCESS_DENIED` while `/api/v1/partner/account/*` remains accessible for renewal | **`VERIFIED`** |

---

## 8. Entitlement & Feature Verification (UI vs Backend)

| Partner Profile | Frontend Visibility (`PartnerPlatformShell.tsx` / `partnerRolePermissions.ts`) | Backend Route Guard (`commercial-guard.ts` / `EntitlementService.ts`) | Consistency Status |
| :--- | :--- | :--- | :--- |
| **`PATHOLOGY`** | `clinical-investigation`, `patient-registration`, `billing-revenue`, `compliance-hub`, `account-plan-features` only | `requireModuleCommercialAccess('PATHOLOGY_LIMS')` allows; `INPATIENT_IPD` / `PHARMACY_POS` blocked (`403`) | **Consistent** (subject to `POST-REM-CAP-03` DB `plan_entitlements` fix) |
| **`PHARMACY` (Retail)** | `pharmacy-medication` (Retail POS), `billing-revenue`, `compliance-hub`, `account-plan-features` | `PHARMACY_POS` & `PHARMACY` allowed; `PHARMACY_WHOLESALE` blocked (`403`) | **Consistent (`VERIFIED`)** |
| **`PHARMACY_WHOLESALE`** | `pharmacy-medication` (Wholesale B2B), `billing-revenue`, `compliance-hub`, `account-plan-features` | `PHARMACY_WHOLESALE` & `PHARMACY` allowed; retail `PHARMACY_POS` (`/dispense`) blocked (`403`) | **Consistent (`VERIFIED`)** |
| **`CLINIC`** | `clinical-consultation`, `patient-registration`, `pharmacy-medication` (if Combo), `billing-revenue` | `CLINICAL_EMR` & `OPD_QUEUE` allowed; `INPATIENT_IPD` & `OT_SURGERY` blocked (`403`) | **Consistent** |
| **`DIAGNOSTIC_CENTRE`** | `radiology-imaging`, `clinical-investigation`, `patient-registration`, `billing-revenue` | `RADIOLOGY_PACS` & `PATHOLOGY_LIMS` allowed; `INPATIENT_IPD` & `PHARMACY_POS` blocked (`403`) | **Consistent** |
| **`HOSPITAL`** | Full multi-specialty suite gated by plan (`FREE` OPD vs `PRO` IPD/OT/ER/LIMS/RIS/Pharmacy) | Plan-gated across all hospital modules | **Consistent** |

---

## 9. Regression Matrix

| Area | Pre-remediation expectation | Current behavior | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | JWT verification, session revocation check, `quick-session` blocked in prod | Working as expected; `clearAllAuthTokens` also dispatches logout purge event | `auth-guard.ts`, `api-client.ts:37-51`, `p0-p1-remediation-verification.test.mjs` (`PASS`) | **`NO REGRESSION`** |
| **Authorization & RBAC** | `RBACEvaluator` enforces `resource:action` & governed actions (`validate`, `approve`, `refund`) | Working as expected; `operational_staff` no longer receives `HOSPITAL_ADMIN` | `rbac-evaluator.ts`, `RealAuthService.ts:187-241`, `cap01-cap07-remediation.test.mjs` (`PASS`) | **`NO REGRESSION`** |
| **Tenant Isolation** | Strict `tenantId` isolation across all services & PostgreSQL RLS | `100%` isolated across all `107` tests | `scope-guard.ts:9-21`, `pharmacy-management-vertical-slice.test.mjs` Step 11 (`PASS`) | **`NO REGRESSION`** |
| **Partner Isolation** | Partner A cannot access Partner B profile, staff, or B2B dispatch | Enforced and verified | `WholesaleInvoiceIngestionService.ts:615-650`, `cap01-cap07-remediation.test.mjs` (`PASS`) | **`NO REGRESSION`** |
| **ABAC & ScopeGuard** | Branch and Department scope enforced on Clinical & Billing | Enforced on Clinical, Billing, and read/getById of Lab/RIS/Pharmacy/IPD; partial on ID-based Lab/RIS mutations (`POST-REM-CAP-02`) | `scope-guard.ts:75-228`, `post-rem-cap01-cap04-remediation.test.mjs` (`PASS`) | **`NO REGRESSION`** (Partial coverage gap in `POST-REM-CAP-02`) |
| **Entitlement & Licensing** | HMAC-SHA256 verification, temporal status, grace period, kill-switches | Working across all plans; wholesale plan IDs now recognized (`POST-REM-CAP-01`) | `LicenseService.ts`, `EntitlementService.ts:160-355` | **`NO REGRESSION`** |
| **Feature Visibility** | UI navigation & workspace switcher bounded by `PARTNER_PROFILE_ALLOWED_MODULES` | Enforced in `PartnerPlatformShell.tsx` and `partnerRolePermissions.ts` | `cap01-cap07-remediation.test.mjs` Tests 1–3 (`PASS`) | **`NO REGRESSION`** |
| **Retail Pharmacy** | Catalog -> GRN Batch -> FEFO -> Partial/Full Dispense -> Ledger -> Invoice | All 11 vertical slice steps pass against embedded PostgreSQL | `pharmacy-management-vertical-slice.test.mjs` (`11/11 PASS`) | **`NO REGRESSION`** |
| **Wholesale Pharmacy** | Form 20B/21B DL + Buyer DL + `PHARMACY_WHOLESALE` entitlement enforcement | Enforced and separated from retail `PHARMACY_POS` | `post-rem-cap01-cap04-remediation.test.mjs` Test 1 & `cap01-cap07-remediation.test.mjs` Test 5 (`PASS`) | **`NO REGRESSION`** |
| **Lab / LIMS** | Order -> Specimen -> Result -> Pathologist Sign-off | Working; read/getById scoped by `ScopeGuard` | `LabDiagnosticsService.ts`, `post-rem-cap01-cap04-remediation.test.mjs` (`PASS`) | **`NO REGRESSION`** |
| **Radiology / RIS** | Modality -> Order -> Study -> Report -> Verify | Working; read/getById scoped by `ScopeGuard` | `RadiologyService.ts`, `post-rem-cap01-cap04-remediation.test.mjs` (`PASS`) | **`NO REGRESSION`** |
| **Clinical & Billing** | Patient registration, OPD consultation, invoicing, payments, TPA pre-auth | Working with `ScopeGuard` branch/department enforcement | `ClinicalWorkflowService.ts`, `BillingManagementService.ts` | **`NO REGRESSION`** |
| **Data Persistence** | Durable PostgreSQL onboarding, concurrency lock (`409`), zero `.data/*.json` dependency | All persistence and concurrency tests pass | `partner-onboarding-persistence-p1.test.mjs` (`PASS`) | **`NO REGRESSION`** |

---

## 10. P0/P1 Gate

```text
P0/P1 REMEDIATION GATE: FAIL
```

### Justification for `FAIL` Gate Verdict:
Per Section 19, `PASS` may only be declared when every security, tenant/scope isolation, and entitlement boundary remediation item is `VERIFIED` with zero gaps. Because adversarial code tracing identified partial paths in two security/isolation items:
1. **`POST-REM-CAP-02` (`PARTIAL`)**: ID-based mutation methods in [`LabDiagnosticsService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/LabDiagnosticsService.ts#L71-L244) (`collectSpecimen`, `enterResult`, `verifyResult`, `reviewResult`, `cancelOrder`, `logPanicIntimation`) and [`RadiologyService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/RadiologyService.ts#L240-L320) (`updateOrderStatus`, `scheduleAppointment`) do not call `ScopeGuard.assertRecordInScope(session, order, scope)` before mutating, and [`ScopeGuard`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/auth/src/scope-guard.ts#L158-L165) contains a hardcoded `isDefaultSeededFacility` (`00000000-0000-4000-8000-000000000002` / `00000000-0000-4000-8000-000000000003`) exemption.
2. **`POST-REM-CAP-03` (`PARTIAL`)**: [`EntitlementService.canAccess`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/EntitlementService.ts#L165-L227) evaluates `isModuleAllowedForPartnerProfile(licensePartnerType, normalizedCode)` only inside the `if (!matched)` branch (`L225`), skipping the partner profile boundary check when database `company.plan_entitlements` rows return a match (`L165-194`), and [`requireFeatureEntitlement`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/plugins/commercial-guard.ts#L177-L184) does not invoke `enforcePartnerProfileModuleBoundary`.

---

## 11. Architecture Coding Gate

```text
NEW ARCHITECTURE CODING STATUS: BLOCKED
```

> **DO NOT START NEW ARCHITECTURE CODING.**  
> `BLOCKED — P0/P1 remediation verification is not fully complete.`

---

## 12. Remaining Gaps

1. **`POST-REM-CAP-02` Gap A**: Missing `ScopeGuard.resolveEffectiveQueryScope(session)` + `ScopeGuard.assertRecordInScope(session, order, scope)` prior to ID-based mutations in `LabDiagnosticsService.ts` (`collectSpecimen`, `enterResult`, `verifyResult`, `reviewResult`, `cancelOrder`, `logPanicIntimation`) and `RadiologyService.ts` (`updateOrderStatus`, `getAppointments`, `scheduleAppointment`).
2. **`POST-REM-CAP-02` Gap B**: Hardcoded `isDefaultSeededFacility` (`00000000-0000-4000-8000-000000000002` and `00000000-0000-4000-8000-000000000003`) exemption in `packages/auth/src/scope-guard.ts` (`L158-165`, `L201-208`).
3. **`POST-REM-CAP-03` Gap A**: `isModuleAllowedForPartnerProfile(licensePartnerType, normalizedCode)` in `apps/api-gateway/src/services/company/EntitlementService.ts` (`L225`) is placed inside `if (!matched)` instead of before `planEntitlements.find()` (`L155`).
4. **`POST-REM-CAP-03` Gap B**: `requireFeatureEntitlement(featureCode)` in `apps/api-gateway/src/plugins/commercial-guard.ts` (`L177-184`) does not invoke `enforcePartnerProfileModuleBoundary(resolvedPartnerType, featureCode)`.

---

## 13. Required Follow-up Remediation

Before re-running this verification gate to unlock new architecture coding, execute the following targeted fixes in a controlled remediation turn:

1. **Complete `POST-REM-CAP-02` (`LabDiagnosticsService.ts`, `RadiologyService.ts`, `scope-guard.ts`)**:
   - In `LabDiagnosticsService.ts` (`collectSpecimen`, `enterResult`, `verifyResult`, `reviewResult`, `cancelOrder`, `logPanicIntimation`) and `RadiologyService.ts` (`updateOrderStatus`, `getAppointments`, `scheduleAppointment`), resolve `const scope = ScopeGuard.resolveEffectiveQueryScope(session)` and call `ScopeGuard.assertRecordInScope(session, existingOrder, scope)` before executing any repository update.
   - Remove the `isDefaultSeededFacility` exemption from `ScopeGuard.filterRecordsByScope` and `ScopeGuard.assertRecordInScope` in `packages/auth/src/scope-guard.ts` (`L158-165`, `L201-208`), and ensure `pharmacy-management-vertical-slice.test.mjs` uses a session whose `branchId` matches the seeded facility or `dataScope: 'tenant'`.
2. **Complete `POST-REM-CAP-03` (`EntitlementService.ts`, `commercial-guard.ts`)**:
   - Move the `licensePartnerType` + `isModuleAllowedForPartnerProfile(licensePartnerType, normalizedCode)` check in `EntitlementService.canAccess()` (`EntitlementService.ts:221-227`) to execute **before** line 155 (`productRepository.getPlanEntitlements(license.planId)`) so database `plan_entitlements` rows can never bypass the partner's facility profile boundary.
   - Add `enforcePartnerProfileModuleBoundary(resolvedPartnerType, featureCode)` inside `requireFeatureEntitlement(featureCode)` in `commercial-guard.ts` (`L177-184`).

---

## 14. Final Status

## POST-REM-CAP INDEPENDENT VERIFICATION SUMMARY

### Primary `POST-REM-CAP-01 → 04` Series (`N = 4`)
- **Total `POST-REM-CAP` Items**: `4`
- **VERIFIED**: `2` (`POST-REM-CAP-01`, `POST-REM-CAP-04`)
- **PARTIAL**: `2` (`POST-REM-CAP-02`, `POST-REM-CAP-03`)
- **NOT IMPLEMENTED**: `0`
- **REGRESSION**: `0`
- **UNKNOWN**: `0`

### Combined `CAP-01 → 07` + `POST-REM-CAP-01 → 04` Baseline (`N = 11`)
- **Total CAP Items**: `11`
- **VERIFIED**: `9` (`CAP-01`, `CAP-02`, `CAP-03`, `CAP-04`, `CAP-05`, `CAP-06`, `CAP-07`, `POST-REM-CAP-01`, `POST-REM-CAP-04`)
- **PARTIAL**: `2` (`POST-REM-CAP-02`, `POST-REM-CAP-03`)
- **NOT IMPLEMENTED**: `0`
- **REGRESSION**: `0`
- **UNKNOWN**: `0`

### P0/P1 Gate
`FAIL`

### New Architecture Coding
`BLOCKED`

> `BLOCKED — P0/P1 remediation verification is not fully complete.`
