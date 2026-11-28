# DOC SEARCH — PHASE 23 IMPLEMENTATION PLAN

**Document ID**: `DOC_SEARCH_PHASE23_IMPLEMENTATION_PLAN`  
**Phase**: Phase 23 — Command Center + BI  
**Author**: Phase 23 Principal Architect & QA Lead  
**Date**: September 27, 2026  
**Git Commit**: `2576d660eb8dd3e580952615defd5d440a585126`  

---

## 1. Plan Overview

The implementation phase will execute controlled, non-disruptive remediations and architectural extensions to address all gaps identified in `DOC_SEARCH_PHASE23_GAP_REGISTER.md`. Under no circumstances will existing working routes or schemas be replaced.

---

## 2. Work Packages & Sequence

### Work Package 1: Purge Mock Fallback in `ExecutiveMisRepository.ts` (`GAP-P23-01`)
* **Target File**: [`apps/api-gateway/src/repositories/partner/ExecutiveMisRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/ExecutiveMisRepository.ts)
* **Changes**:
  1. Remove hardcoded fallback arrays for `DEFAULT_PRIMARY_TENANTS` in `getDepartmentWiseBilling`, `getUnbilledEncounters`, `getInsuranceClaimAging`, `getInventoryShrinkage`, and `getDoctorPayouts`.
  2. For `getCommandSnapshot`, if no database row exists in `executiveCommandSnapshots`, generate a clean baseline with zero active surge codes and 0s instead of hardcoded `Apex Multi-Specialty Hospital` numbers.
  3. Ensure unseeded tenants receive clean empty arrays (`[]`), guaranteeing 100% zero-state truth.

### Work Package 2: Governed CSV Export Capabilities (`GAP-P23-03`)
* **Target Files**:
  - [`apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts)
  - [`apps/api-gateway/src/services/partner/CommandCenterService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/CommandCenterService.ts)
  - [`apps/api-gateway/src/routes/partner/command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/command-center.routes.ts)
  - [`apps/api-gateway/src/routes/company/hq-command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/hq-command-center.routes.ts)
* **Features**:
  1. Implement `generateCsvExport(session, category, range)` producing RFC 4180 CSV strings with standard `text/csv` headers.
  2. Partner export categories: `OVERVIEW`, `PATIENTS`, `OPD`, `IPD`, `LAB`, `RADIOLOGY`, `PHARMACY`, `REVENUE`, `INVENTORY`.
  3. HQ export categories: `PARTNERS`, `LICENSES`, `REVENUE`.
  4. Enforce tenant isolation and role permissions.

### Work Package 3: AI / Ewan Usage Telemetry in Command Center (`GAP-P23-04`)
* **Target Files**:
  - [`apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts)
  - [`apps/api-gateway/src/services/partner/CommandCenterService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/CommandCenterService.ts)
  - [`apps/api-gateway/src/routes/partner/command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/command-center.routes.ts)
* **Features**:
  1. Add `getAiTelemetry(tenantId, range)` querying `core.ai_request_registry` for total requests, average latency, token usage, and status distribution (`SUCCESS`, `BLOCKED`, `REJECTED`).
  2. Register route `GET /api/v1/partner/command-center/ai-telemetry`.

### Work Package 4: Partner Commercial License Status (`GAP-P23-05`)
* **Target Files**:
  - [`apps/api-gateway/src/services/partner/CommandCenterService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/CommandCenterService.ts)
  - [`apps/api-gateway/src/routes/partner/command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/command-center.routes.ts)
* **Features**:
  1. Add `getLicenseStatus(session)` fetching current license status, expiry date, days remaining, and plan code for the tenant.
  2. Register route `GET /api/v1/partner/command-center/license`.

### Work Package 5: Build & Compilation Verification
* Run `npm.cmd --prefix apps/api-gateway run build` to ensure 100% clean TypeScript compilation with zero errors.

### Work Package 6: Reconciliation Test Suite (`GAP-P23-02`)
* Create and execute [`apps/api-gateway/test/phase23-command-center-bi-reconciliation.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/phase23-command-center-bi-reconciliation.test.mjs):
  - Test zero-state compliance (`NO_DATA`, clean 0s)
  - Test reconciliation: Revenue dashboard vs Invoices/Payments tables
  - Test reconciliation: Patient volume vs Patients table
  - Test reconciliation: Bed occupancy vs Inpatient beds table
  - Test reconciliation: Lab diagnostics vs Investigation orders table
  - Test reconciliation: Pharmacy vs Dispensing records
  - Test CSV export generation & MIME headers
  - Test Ewan AI telemetry retrieval
  - Test License status retrieval
  - Test Cross-tenant isolation (Tenant B cannot see Tenant A's metrics or exports)
  - Test Role-based access control (Doctor cannot call HQ command center)
* Run existing Phase 13 test suite (`phase13-command-center-analytics.test.mjs`) to verify zero regressions.

### Work Package 7: Final Documentation & Freeze
* Author Deliverables 6 through 10.
