# DOC SEARCH — POST-REMEDIATION ARCHITECTURE GROUP B REPORT

## Scope
Controlled remediation of **GROUP B** commercial plan, operating model, and capability catalog architecture:
- **B1 (`P0-01`)**: Canonical Plan Resolution Without Silent Clinic Fallback (`PartnerSyncService.ts`)
- **B2 (`P1-04`)**: Canonical `operating_model` Column Persistence Across Company & Clinical Registries (`0061` Migration, `PartnerSyncService.ts`, `PartnerConfigurationEngineService.ts`, `StaffAdministrationRepository.ts`)
- **B3 (`P1-05`)**: Canonical Capability Layer Distinct from Commercial `FeatureCode` (`CapabilityAndDependencyEngine.ts`, `MasterFoundationService.ts`)

---

## 1. Remediations & File Evidence

### B1 (`P0-01`) — Canonical Plan Resolution (`PartnerSyncService.ts`)
- **File**: [`apps/api-gateway/src/services/company/PartnerSyncService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/PartnerSyncService.ts#L27-L207)
- **What Changed**:
  - Exported `resolveVerticalPlan` and removed `DEFAULT_PLAN_STARTER_ID` (`plan-clinic-free-yr1`) silent fallback.
  - Explicitly mapped all supported verticals (`HOSPITAL`, `CLINIC`, `PATHOLOGY`, `PHARMACY` retail, `PHARMACY_WHOLESALE`, `DIAGNOSTIC_CENTRE`, `BLOOD_BANK`, and combo plans).
  - Throws `AppError` (`400 VALIDATION_ERROR`) when `partnerType` is unknown/unsupported or when an explicit `planId` is not recognized in the canonical plan catalog.

### B2 (`P1-04`) — Canonical `operating_model` Persistence
- **Files**:
  - [`packages/database/migrations/0061_architecture_p0_p1_remediation.sql`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/database/migrations/0061_architecture_p0_p1_remediation.sql#L10-L16)
  - [`packages/database/src/schema/company/index.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/database/src/schema/company/index.ts#L30-L50)
  - [`packages/database/src/schema/clinical/index.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/database/src/schema/clinical/index.ts#L15-L65)
  - [`apps/api-gateway/src/services/company/PartnerSyncService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/PartnerSyncService.ts#L1044-L1085)
  - [`apps/api-gateway/src/services/partner/PartnerConfigurationEngineService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/PartnerConfigurationEngineService.ts#L215-L303)
  - [`apps/api-gateway/src/repositories/partner/StaffAdministrationRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/StaffAdministrationRepository.ts#L130-L185)
- **What Changed**:
  - Added canonical `operating_model varchar(64)` column to `company.partner_profiles`, `clinical.operational_partners`, and `clinical.operational_organizations`.
  - Updated onboarding sync (`PartnerSyncService`), partner configuration engine (`PartnerConfigurationEngineService`), and operational hierarchy provisioning (`StaffAdministrationRepository`) to persist and read `operatingModel` (`RETAIL_ONLY`, `WHOLESALE_ONLY`, `HYBRID`, `MULTI_SPECIALTY`, etc.) from the first-class `operating_model` column.

### B3 (`P1-05`) — Canonical Capability Layer Distinct from `FeatureCode`
- **Files**:
  - [`apps/api-gateway/src/services/company/CapabilityAndDependencyEngine.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/CapabilityAndDependencyEngine.ts#L42-L670)
  - [`apps/api-gateway/src/services/company/MasterFoundationService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/MasterFoundationService.ts#L1-L220)
- **What Changed**:
  - Confirmed and tested that `MASTER_CAPABILITIES` (`PATIENT_REGISTRATION`, `APPOINTMENT`, `OPD`, `IPD`, `ICU`, `EMERGENCY`, etc.) and `INDUSTRY_MASTER_CATALOG` represent canonical operational capabilities with prerequisite dependency graphs (`validateCapabilityDependencies`), distinct from commercial `FeatureCode` billing entitlements.

---

## 2. Verification & Test Results
- **Test Suite**: [`apps/api-gateway/test/master-architecture-p0-p1-remediation.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/master-architecture-p0-p1-remediation.test.mjs)
  - `P0-01`: Verified canonical plan mapping for `HOSPITAL`, `PATHOLOGY`, `PHARMACY`, `PHARMACY_WHOLESALE`, `DIAGNOSTIC_CENTRE`, and fail-closed rejection on `TELEMEDICINE_AGGREGATOR`, `""`, and `plan-nonexistent-xyz` (`PASS`).
  - `P1-04`: Verified `operating_model = 'WHOLESALE_ONLY'` persistence across `company.partner_profiles`, `clinical.operational_partners`, and `clinical.operational_organizations` (`PASS`).
  - `P1-05`: Verified `MASTER_CAPABILITIES` catalog and `validateCapabilityDependencies` prerequisite enforcement (`PASS`).
- **Group B Status**: **FROZEN & VERIFIED**
