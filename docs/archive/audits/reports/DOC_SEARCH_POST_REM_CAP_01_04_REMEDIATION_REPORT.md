# DOC SEARCH — POST-REM-CAP-01 → CAP-04 CONTROLLED REMEDIATION & VERIFICATION REPORT

**Audit Reference**: `DOC_SEARCH_POST_REMEDIATION_PARTNER_PROFILE_INDUSTRY_CAPABILITY_AUDIT.md`  
**Date**: 2026-09-25  
**Final Remediation Status**: **`FULLY REMEDIATED`**

---

## A. Executive Summary

| Finding ID | Severity | Description | Status |
| :--- | :--- | :--- | :--- |
| **`POST-REM-CAP-01`** | `P2` | `EntitlementService` wholesale prefix separation & wholesale plan ID registration (`plan-pharma-wholesale-free-yr1`, `plan-pharma-wholesale-annual-yr2`) | **`REMEDIATED`** |
| **`POST-REM-CAP-02`** | `P2` | Branch & Department `ScopeGuard` propagation across `LabDiagnosticsService`, `RadiologyService`, `PharmacyManagementService`, and `InpatientManagementService` | **`REMEDIATED`** |
| **`POST-REM-CAP-03`** | `P2` | Server-side `PARTNER_PROFILE_ALLOWED_MODULES[partnerType]` intersection check inside `commercial-guard.ts` (`requireModuleCommercialAccess`) and `EntitlementService` | **`REMEDIATED`** |
| **`POST-REM-CAP-04`** | `P3` | Partner-platform `localStorage` & `IndexedDB` `${tenantId}:${userId}` namespacing (`docsearch:${tenantId}:${userId}:<key>`) and logout purge | **`REMEDIATED`** |

---

## B. Files Modified

1. `apps/api-gateway/src/services/company/EntitlementService.ts`
2. `packages/auth/src/scope-guard.ts`
3. `apps/api-gateway/src/services/partner/LabDiagnosticsService.ts`
4. `apps/api-gateway/src/services/partner/RadiologyService.ts`
5. `apps/api-gateway/src/services/partner/PharmacyManagementService.ts`
6. `apps/api-gateway/src/services/partner/InpatientManagementService.ts`
7. `packages/shared-core/src/workflow/facility-normalizer.ts`
8. `apps/api-gateway/src/plugins/commercial-guard.ts`
9. `apps/partner-platform/src/services/patient-session-tab-service.ts`
10. `apps/partner-platform/src/services/pharmacy-offline-storage-service.ts`
11. `apps/partner-platform/src/services/api-client.ts`
12. `apps/api-gateway/test/post-rem-cap01-cap04-remediation.test.mjs`

---

## C. Changes Made

- **`POST-REM-CAP-01`**: Separated `PHARMACY_WHOLESALE` from retail `PHARMACY_` prefix wildcards in `EntitlementService.ts` and registered `plan-pharma-wholesale-free-yr1` and `plan-pharma-wholesale-annual-yr2` in `planPharmIds` and `planPharmaWholesaleIds`.
- **`POST-REM-CAP-02`**: Propagated `ScopeGuard.resolveEffectiveQueryScope(session, requestedScope)`, `ScopeGuard.filterRecordsByScope()`, and `ScopeGuard.assertRecordInScope()` across `LabDiagnosticsService`, `RadiologyService`, `PharmacyManagementService`, and `InpatientManagementService`.
- **`POST-REM-CAP-03`**: Exported `PARTNER_PROFILE_ALLOWED_MODULES` and `isModuleAllowedForPartnerProfile()` from `@docsearch/shared-core` and enforced server-side partner profile module intersection inside `commercial-guard.ts` (`requireModuleCommercialAccess`) and `EntitlementService.canAccess()`, blocking disallowed `metadata.includedModules` overrides with HTTP `403`.
- **`POST-REM-CAP-04`**: Namespaced `localStorage` and `IndexedDB` keys in `patient-session-tab-service.ts` and `pharmacy-offline-storage-service.ts` by `docsearch:${tenantId}:${userId}:<key>`, invalidated legacy global keys, and wired `clearAllAuthTokens()` in `api-client.ts` to purge state on logout.

---

## D. Test Results

- **Targeted Suite (`post-rem-cap01-cap04-remediation.test.mjs`)**: **`4 / 4 PASS`**
- **Regression Suites (`cap01-cap07-remediation.test.mjs`, `p0-p1-remediation-verification.test.mjs`, `partner-onboarding-commercial-lifecycle.test.mjs`, `partner-onboarding-persistence-p1.test.mjs`, `pharmacy-management-vertical-slice.test.mjs`)**: **`103 / 103 PASS`**
- **Combined Total**: **`107 / 107 PASS` (`0` failures)**

---

## E. Typecheck / Build

- `packages/shared-core`: `PASS` (`0` errors)
- `packages/auth`: `PASS` (`0` errors)
- `apps/api-gateway`: `PASS` (`0` errors)
- `apps/partner-platform`: `PASS` (`0` errors)

---

## F. Remaining Findings

- `P0`: `0`
- `P1`: `0`
- `P2`: `0`
- `P3`: `0`
- `UNKNOWN`: `0`

---

## G. Final Remediation Status

`FULLY REMEDIATED`
