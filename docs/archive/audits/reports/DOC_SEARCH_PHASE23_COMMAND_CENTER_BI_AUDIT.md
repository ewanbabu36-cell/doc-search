# DOC SEARCH — PHASE 23 COMMAND CENTER + BI AUDIT REPORT

**Document ID**: `DOC_SEARCH_PHASE23_COMMAND_CENTER_BI_AUDIT`  
**Phase**: Phase 23 — Command Center + BI  
**Author**: Phase 23 Command Center + BI Principal Architect & QA Lead  
**Date**: September 27, 2026  
**Git Commit**: `2576d660eb8dd3e580952615defd5d440a585126`  
**Standard**: NIST SP 800-162 • ISO 27001 • HIPAA § 164.312  

---

## 1. Executive Summary & Audit Scope

This audit provides an exhaustive, evidence-based discovery of all analytics, reporting, business intelligence (BI), Executive MIS, and Command Center architectures within the **DOC SEARCH** healthcare platform. The audit was conducted in accordance with the Phase 23 directive: **Whole Project Analytics Redemption** and the absolute non-negotiable rule that code existing or returning HTTP 200 is not proof of real-world readiness.

The codebase was audited across:
1. **API Gateway Backend**: [`apps/api-gateway/src`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src)
2. **Database Engine & Schemas**: [`packages/database/src`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/database/src)
3. **Frontend Applications**: [`apps/partner-platform/src`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/partner-platform/src), [`apps/company-platform/src`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/company-platform/src)
4. **Automated Test Suites**: [`apps/api-gateway/test`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test)

---

## 2. Existing System Architecture Discovery

### 2.1 Backend Route & Service Map

| Domain / Scope | Route File | Service File | Repository File | Primary Tables Queried |
| :--- | :--- | :--- | :--- | :--- |
| **Partner Command Center** | [`command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/command-center.routes.ts) | [`CommandCenterService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/CommandCenterService.ts) | [`CommandCenterRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts) | `patients`, `encounters`, `appointmentsPartitioned`, `consultations`, `inpatientBeds`, `inpatientAdmissions`, `investigationOrders`, `criticalPanicValueAlerts`, `radiologyOrders`, `pharmacyDispensing`, `billingInvoices`, `billingPayments`, `billingRefunds`, `supplyChainInventory` |
| **HQ Command Center** | [`hq-command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/hq-command-center.routes.ts) | [`HqCommandCenterService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/HqCommandCenterService.ts) | [`HqCommandCenterRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/company/HqCommandCenterRepository.ts) | `tenants`, `partnerProfiles`, `operationalPartners`, `subscriptions`, `licenses`, `plans`, `commercialOrderSnapshots`, `auditEvents`, `revocations`, `founderApprovalRequests` |
| **Partner Executive MIS** | [`executive-mis.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/executive-mis.routes.ts) | [`ExecutiveMisService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/ExecutiveMisService.ts) | [`ExecutiveMisRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/ExecutiveMisRepository.ts) | `executiveCommandSnapshots`, `hospitalSurgeEvents`, `predictiveBedForecasts`, `whatIfSimulationRuns`, in-memory Map fallbacks |
| **Company Executive Overview** | [`executive.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/executive.routes.ts) | [`ExecutiveService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/ExecutiveService.ts) | [`ExecutiveRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/company/ExecutiveRepository.ts) | `partnerProfiles`, `subscriptions`, `sessions`, `auditEvents`, `userBranches` |
| **Company BI & Analytics** | [`analytics.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/analytics.routes.ts) | [`AnalyticsService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/AnalyticsService.ts) | [`AnalyticsRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/company/AnalyticsRepository.ts) | `analyticsReports`, `systemInsights`, `partnerProfiles`, `consultations`, `fhirBundlesRepository` |

---

## 3. Data Source-of-Truth Findings

### 3.1 Partner Command Center (`CommandCenterRepository.ts`)
* **Status**: **VERIFIED PRODUCTION GRADE**
* **Audit Finding**: All 12 domain aggregations (Overview, Patients, OPD, IPD, Lab, Radiology, Pharmacy, Revenue, Inventory, Pending Queue, SLAs, Staff Workload) execute genuine Drizzle ORM queries against PostgreSQL tables.
* **Zero-State Behavior**: When queried with an empty tenant ID (e.g. `22222222-2222-4222-8222-222222222222`), the repository deterministically returns `totalPatients: 0`, `activeEncounters: 0`, `grossRevenue: 0`, and flags `dataQuality: 'NO_DATA'`.
* **Reconciliation Integrity**: Revenue calculations explicitly sum `billingInvoices` for gross billing, `billingPayments` for collections, `dueAmount` for receivables, and `billingRefunds` for refunds, guaranteeing complete financial separation.

### 3.2 HQ Command Center (`HqCommandCenterRepository.ts`)
* **Status**: **VERIFIED PRODUCTION GRADE**
* **Audit Finding**: Computes platform-wide partner lifecycle status, license expiration windows (7, 30, 60 days), cross-tenant clinical throughput, commercial order revenue from `commercialOrderSnapshots`, and security audit severity distribution directly from PostgreSQL relational rows.
* **Role Enforcement**: Rejects non-HQ roles with HTTP 403 Forbidden via `HqCommandCenterService.validateHqSession`.

### 3.3 Executive MIS (`ExecutiveMisRepository.ts`)
* **Status**: **MOCK / FALLBACK LEAKAGE DETECTED (DEFECT)**
* **Audit Finding**: While `ExecutiveMisRepository` contains table references to `executiveCommandSnapshots`, lines 69–81, 92–132, 164–219, and 450–480 contain hardcoded sample records for `DEFAULT_PRIMARY_TENANTS` (e.g., `Apex Multi-Specialty Hospital`, `Kavita Joshi`, `Ramanathan Iyer`). This violates Phase 23 Section 38 ("NO MOCK / NO FALLBACK").
* **Remediation Required**: `ExecutiveMisRepository` must be hardened to either read authoritative state from `executiveCommandSnapshots` / relational tables or return clean empty state `[]` without static patient names or fabricated revenue numbers.

### 3.4 Frontend Analytics Services
* **Status**: **MOCK FALLBACK ALLOWED IN DEVELOPMENT (CONTROLLED)**
* **Audit Finding**: Both `apps/partner-platform/src/services/executive-command-service.ts` and `apps/company-platform/src/services/analytics-service.ts` import mock objects (`mock-executive-command-data.ts`, `mock-analytics-data.ts`). However, these fallbacks are gated behind `isMockFallbackAllowed()`. When `VITE_MOCK_FALLBACK=false` or in production builds, they fail closed and throw errors if the backend is unreachable.

---

## 4. Time Model Audit

The system time model was inspected in `CommandCenterRepository.resolveDateRange()` and `HqCommandCenterRepository.resolveDateRange()`:
- **Supported Periods**: `TODAY`, `YESTERDAY`, `LAST_7_DAYS`, `LAST_30_DAYS`, `PREVIOUS_MONTH`, `THIS_MONTH` (Default), and `CUSTOM` (`customStart`, `customEnd`).
- **Timezone Semantics**: Database timestamps are stored in UTC (`timestamp with time zone`). Server range bounds calculate standard local boundary offsets without browser-local distortion.
- **Comparison Period**: Automatically computes matching previous comparison window (`prevStart`, `prevEnd`) for trend and percentage change calculations.

---

## 5. Security & Isolation Audit

1. **Tenant Isolation**:
   - `CommandCenterService` asserts `session.tenantId`. All queries in `CommandCenterRepository` include `eq(table.tenantId, tenantId)`.
   - Verified under `phase13-command-center-analytics.test.mjs` (Test 18) where cross-tenant queries were strictly blocked.
2. **HQ Administrative Role Isolation**:
   - `HqCommandCenterService` enforces that only users possessing `COMPANY_ADMIN`, `SUPER_ADMIN`, `FOUNDER`, `CHIEF_MEDICAL_OFFICER`, or `OPERATIONS_DIRECTOR` roles can view cross-tenant HQ analytics.
   - Non-HQ users receive HTTP 403 Forbidden.
3. **Audit Logging**:
   - Viewing the Partner Command Center or HQ Command Center records a cryptographic audit event in `core.audit_events` (`COMMAND_CENTER_EXECUTIVE_VIEW`, `HQ_COMMAND_CENTER_VIEW`).

---

## 6. Audit Verdict

| Component | Architecture Truth | Source of Truth | Zero-State Truth | Mock Leakage | Audit Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Partner Command Center API** | Relational Drizzle | PostgreSQL Live | Clean 0s (`NO_DATA`) | None | **VERIFIED** |
| **HQ Command Center API** | Relational Drizzle | PostgreSQL Live | Clean 0s (`NO_DATA`) | None | **VERIFIED** |
| **Executive MIS API** | Hybrid Table / Map | Partial Fallback | Static Baseline Leak | **DETECTED** | **REMEDIATION REQUIRED** |
| **Company Analytics API** | Relational Drizzle | PostgreSQL Live | Clean 0s | None | **VERIFIED** |
| **Command Center Exports** | Not Implemented | N/A | N/A | None | **GAP IDENTIFIED** |
| **AI / Ewan Telemetry in CC** | Partial Table / Missing CC Route | `ai_request_registry` | Clean | None | **GAP IDENTIFIED** |
| **Partner License in CC** | Exists in Account / Missing CC Route | `licenses` table | Clean | None | **GAP IDENTIFIED** |
