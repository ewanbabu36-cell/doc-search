# DOC SEARCH — PHASE 1 MASTER FOUNDATION IMPLEMENTATION PLAN

## Overview

This plan defines the controlled, incremental implementation of **Phase 1 — Master Foundation**, establishing the single authoritative control plane:

```text
HQ → Partner → Industry → Operating Model → Plan → Subscription → License → Entitlement → Capability → Department → Role → Permission → Feature → Workflow → Transaction → Audit
```

Every implementation unit follows:
`Change → Test → Inspect → Regression Test → Continue`

---

## Ordered Implementation Steps (1–19)

### 1. Shared Identifiers / Enums / Contracts (`MasterFoundationService.ts`)
* Define canonical TypeScript types, enums, and identifiers for:
  * `IndustryCode`: `SOLO_DOCTOR_CLINIC`, `MULTI_SPECIALITY_HOSPITAL`, `PATHOLOGY`, `RADIOLOGY`, `PHARMACY_RETAIL`, `PHARMACY_WHOLESALE`, `DIAGNOSTIC_CENTRE`, `HYBRID` (plus legacy aliases `CLINIC`, `HOSPITAL`, `PHARMACY`, `DIAGNOSTIC_LAB`, `COMBO_CLINIC_PATHOLOGY`, `COMBO_CLINIC_PHARMACY`).
  * `OperatingModelCode`: `SOLO`, `CLINIC`, `HOSPITAL`, `DIAGNOSTIC_CENTER`, `RETAIL_PHARMACY`, `WHOLESALE_PHARMACY`, `HYBRID`.
  * `PermissionAction`: `CREATE`, `READ`, `UPDATE`, `DELETE`, `APPROVE`, `DISPENSE`, `VALIDATE`, `BILL`, `EXPORT`, `CONFIGURE`.
  * `ConfigurationLifecycleStatus`: `DRAFT`, `PUBLISHED`, `SUPERSEDED`.

### 2. Partner Master (`MasterFoundationService.resolvePartnerMaster`)
* Resolve authoritative partner state from `company.partner_profiles` + `core.tenants`:
  * `partnerId`, `tenantId`, `industry`, `operatingModel`, `lifecycleStatus`, `verificationStatus`, `subscriptionId`, `licenseId`, `configurationVersion`, and `isActive`.
  * Enforce fail-closed rejection when `tenant.status !== 'ACTIVE'`, `partnerProfile.lifecycleStatus === 'SUSPENDED' | 'TERMINATED'`, or `(industry, operatingModel)` is invalid/unknown.
  * Enforce strict tenant scope: never allow request query/body `partnerId` or `tenantId` to override authenticated `session.tenantId` for non-HQ callers.

### 3. Industry Master (`INDUSTRY_MASTER_CATALOG`)
* Create the data-driven `INDUSTRY_MASTER_CATALOG` synced with `company.partner_classifications`:
  * Maps each industry (`SOLO_DOCTOR_CLINIC`, `MULTI_SPECIALITY_HOSPITAL`, `PATHOLOGY`, `RADIOLOGY`, `PHARMACY_RETAIL`, `PHARMACY_WHOLESALE`, `DIAGNOSTIC_CENTRE`, `HYBRID`) to its allowed Operating Models, Capabilities, Departments, Role Templates, Features, and Commercial Plans.
  * Includes version metadata (`version: '1.0.0'`, `status: 'PUBLISHED'`).

### 4. Operating Model Master (`OPERATING_MODEL_MASTER_CATALOG`)
* Create the data-driven `OPERATING_MODEL_MASTER_CATALOG`:
  * Defines `SOLO`, `CLINIC`, `HOSPITAL`, `DIAGNOSTIC_CENTER`, `RETAIL_PHARMACY`, `WHOLESALE_PHARMACY`, and `HYBRID`.
  * Separates **Industry** (*what business the partner operates*) from **Operating Model** (*how that business operates*).
  * Provides `validateIndustryOperatingModel(industry, operatingModel)` which deterministically validates allowed combinations and fails closed (`valid: false`) on unsupported combinations (e.g., `PATHOLOGY` + `RETAIL_PHARMACY`, `PHARMACY_WHOLESALE` + `HOSPITAL`, `SOLO_DOCTOR_CLINIC` + `WHOLESALE_PHARMACY`).

### 5. Department Master (`DEPARTMENT_MASTER_CATALOG`)
* Centralize department definitions (`OPD_RECEPTION`, `OPD_CONSULTATION`, `IPD_WARDS`, `EMERGENCY_TRAUMA`, `ICU_CRITICAL_CARE`, `OPERATION_THEATRE`, `PATHOLOGY_LAB`, `RADIOLOGY_IMAGING`, `RETAIL_PHARMACY_DISPENSARY`, `WHOLESALE_DISTRIBUTION_HUB`, `BILLING_REVENUE_DESK`, `MEDICAL_RECORDS_MRD`, `ADMINISTRATION_HR`):
  * Each department declares `applicableIndustries`, `applicableOperatingModels`, `requiredCapabilities`, `requiredFeatures`, `defaultRoles`, and `version`.
  * Resolves available departments for a partner dynamically from `(Industry ∩ OperatingModel ∩ ActiveCapabilities)`.

### 6. Permission Master (`PERMISSION_MASTER_CATALOG`)
* Standardize central permission definitions persisted in `core.permissions` and `company.permission_packs`:
  * Supports `resource`, `action` (`CREATE`, `READ`, `UPDATE`, `DELETE`, `APPROVE`, `DISPENSE`, `VALIDATE`, `BILL`, `EXPORT`, `CONFIGURE`), `scope` (`TENANT`, `BRANCH`, `DEPARTMENT`, `ASSIGNED`), `status`, `version`, and `isGovernedAction`.
  * Fix `EffectiveAccessEngine.actionMatches` so governed actions (`DELETE`, `APPROVE`, `VALIDATE`, `DISPENSE`, `EXPORT`, `CONFIGURE`, `REFUND`) and resource paths never match via arbitrary substring `.includes()` or 2-segment boundary heuristics.

### 7. Role Template Master (`ROLE_TEMPLATE_MASTER_CATALOG`)
* Centralize role templates (`DOCTOR`, `NURSE`, `RECEPTIONIST`, `PHARMACIST`, `DISPENSING_PHARMACIST`, `WHOLESALE_PHARMACIST`, `LAB_TECHNICIAN`, `PATHOLOGIST`, `RADIOLOGY_TECHNICIAN`, `RADIOLOGIST`, `BILLING`, `ADMIN`, `INVENTORY`, `MANAGEMENT`):
  * Each role template defines `code`, `applicableIndustries`, `applicableOperatingModels`, `departmentScope`, `requiredCapabilities`, `permissionBundles`, `explicitPermissions`, `prohibitedActions`, `version`, and `status`.

### 8. Capability Master (`CapabilityAndDependencyEngine.ts`)
* Standardize `MASTER_CAPABILITIES` (`PATIENT_REGISTRATION`, `APPOINTMENT`, `OPD`, `IPD`, `EMERGENCY`, `ICU`, `OT`, `LAB_ORDERING`, `LAB_PROCESSING`, `LAB_REPORT_VALIDATION`, `LABORATORY`, `PATHOLOGY`, `RADIOLOGY`, `PHARMACY_RETAIL`, `PHARMACY_WHOLESALE`, `PHARMACY`, `BILLING`, `FINANCE`, `INVENTORY`, `REPORTING`, `ANALYTICS`, `HR`, `MRD`, `BLOOD_BANK`, `DIETARY`, `COMMUNICATION`, `AI`, `INTEGRATION`) with explicit `dependencies` (e.g., `LAB_REPORT_VALIDATION` requires `LAB_PROCESSING`, `PATHOLOGY` requires `LABORATORY`, `ICU` requires `IPD`).

### 9. Feature Master (`FEATURE_MASTER_CATALOG`)
* Standardize central features (`opd.registration`, `opd.queue`, `patient.emr`, `clinical.prescription`, `lab.orders`, `lab.processing`, `lab.result.validate`, `radiology.pacs`, `radiology.reporting`, `pharmacy.pos`, `pharmacy.dispense`, `pharmacy.wholesale`, `billing.invoices`, `inventory.ledger`, `reporting.analytics`, etc.) with `capabilityCode`, `dependencies`, `requiredPermissions`, `version`, and `status`.

### 10. Plan Master (`PLAN_MASTER_CATALOG` & `ProductRepository`)
* Link commercial plans (`plan-clinic-free-yr1`, `plan-clinic-annual-yr2`, `plan-hospital-free-yr1`, `plan-hospital-complete-yr1`, `plan-lab-free-yr1`, `plan-lab-annual-yr2`, `plan-pharma-free-yr1`, `plan-pharma-annual-yr2`, `plan-pharma-wholesale-free-yr1`, `plan-pharma-wholesale-annual-yr2`, `plan-diag-free-yr1`, `plan-diag-annual-yr2`) to `applicableIndustries`, `applicableOperatingModels`, `capabilities`, `features`, `limits`, `version`, and `effectiveDates`.

### 11. Subscription Master (`SubscriptionService.ts` & `EffectiveAccessEngine` Tier 4)
* Integrate `subscriptions` validation directly into `EffectiveAccessEngine` Tier 4 (`TIER_4_SUBSCRIPTION_STATUS`):
  * Verify active subscription (`ACTIVE`, `FREE_ACTIVE`, `TRIAL`, `RENEWAL_WINDOW`, `GRACE_PERIOD`) and reject `EXPIRED`, `CANCELLED`, `SUSPENDED`, or missing subscriptions (fail-closed).

### 12. License Engine (`LicenseService.ts` & `EffectiveAccessEngine` Tier 3)
* Integrate `LicenseService.verifyLicenseSignature` and `LicenseService.evaluateLicenseStatus` into `EffectiveAccessEngine` Tier 3 (`TIER_3_LICENSE_VALIDITY`):
  * Fail closed (`DENY_LICENSE_MISSING`, `DENY_LICENSE_SIGNATURE_INVALID`, `DENY_LICENSE_EXPIRED`, `DENY_LICENSE_LOCKED`, `DENY_LICENSE_SUSPENDED`) when no valid license exists or when the license is expired/locked/suspended.
  * Support `FREE_ACTIVE`, `EXPIRING_SOON`, `RENEWAL_WINDOW`, and `GRACE_PERIOD` states accurately.

### 13. Entitlement Engine (`EntitlementService.ts` & `EffectiveAccessEngine` Tier 5)
* Unify `EntitlementService.canAccess` and `EffectiveAccessEngine` Tier 5 (`TIER_5_PLAN_ENTITLEMENT`):
  * Deterministically derive effective entitlement from `Partner → Industry → Operating Model → Plan → Subscription → License → Entitlement → Capability → Feature`.
  * Fail closed (`DENY_ENTITLEMENT_MISSING` / `DENY_INDUSTRY_OPERATING_MODEL_MISMATCH`) when configuration is unknown, revoked, or expired.

### 14. Feature Dependency Engine (`CapabilityAndDependencyEngine.ts`)
* Upgrade `CapabilityAndDependencyEngine` with full graph dependency evaluation:
  * Detect **circular dependencies** (`CIRCULAR_DEPENDENCY`) using DFS cycle detection (`visiting` / `visited`).
  * Detect **missing dependencies** (`MISSING_DEPENDENCY`).
  * Detect **invalid/unknown dependencies** (`INVALID_DEPENDENCY`).
  * Detect **inactive/disabled dependencies** (`INACTIVE_DEPENDENCY`).
  * Detect **expired dependencies** (`EXPIRED_DEPENDENCY`, when `trialEndsAt < now`).
  * Evaluate multi-level `Feature → Capability → Feature → Permission` chains.

### 15. Configuration Versioning (`ConfigurationVersioningService.ts`)
* Extend `ConfigurationVersioningService` to support controlled configuration lifecycle states:
  * `DRAFT` → `PUBLISHED` (`EFFECTIVE`) → `SUPERSEDED` with `effectiveFrom`, `effectiveTo`, `actor`, `timestamp`, and `changeReason`.
  * Publishing a new version automatically transitions the previous `PUBLISHED` version to `SUPERSEDED` (`effectiveTo = now`) without mutating its historical `snapshot` JSON.

### 16. API Enforcement (`partner-access-control.routes.ts` & `MasterFoundationService`)
* Fix all cross-tenant IDOR gaps in `partner-access-control.routes.ts` via a central `assertPartnerTenantScope(request, partnerId)` guard.
* Expose authoritative Master Foundation endpoints:
  * `GET /api/v1/company/master-foundation/catalog` (Industries, Operating Models, Departments, Role Templates, Permissions, Capabilities, Features, Plans)
  * `GET /api/v1/partner/master-foundation/effective-context` (Tenant-isolated effective foundation context for the authenticated partner)
  * `POST /api/v1/company/partners/:partnerId/master-foundation/configure` (HQ configuration of partner Industry + Operating Model with versioned snapshot creation)
  * `POST /api/v1/company/partners/:partnerId/configuration/versions/:versionNumber/publish` (Draft → Published lifecycle transition)

### 17. Frontend Integration (`PartnerAccountService.ts`)
* Enrich `PartnerAccountService.getPlanAndFeatures(session)` (`GET /api/v1/partner/account/plan-and-features`) with `masterFoundation`:
  * `industry`, `operatingModel`, `isConfigurationValid`, `configurationVersion`, `effectiveCapabilities`, `effectiveDepartments`, `effectiveRoleTemplates`, and `featureDependencies`.

### 18. Comprehensive Automated Tests (`apps/api-gateway/test/phase1-master-foundation.test.mjs`)
* Build and run tests for all 9 required test domains: Partner, Industry, Operating Model, Role/Permission, Capability/Feature, Dependency Engine (missing, expired, disabled, circular), Subscription, License, Entitlement, Configuration Versioning, and Regression.

### 19. Security Verification & Independent Read-Only Verification
* Verify tenant isolation, IDOR rejection, partner/tenant/role/permission/plan/entitlement manipulation rejection, license bypass rejection, and produce `DOC_SEARCH_PHASE_1_MASTER_FOUNDATION_IMPLEMENTATION_REPORT.md` and `DOC_SEARCH_PHASE_1_MASTER_FOUNDATION_VERIFICATION_REPORT.md`.
