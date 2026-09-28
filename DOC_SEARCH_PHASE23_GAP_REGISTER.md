# DOC SEARCH — PHASE 23 GAP REGISTER

**Document ID**: `DOC_SEARCH_PHASE23_GAP_REGISTER`  
**Phase**: Phase 23 — Command Center + BI  
**Author**: Phase 23 ERP Analytics Auditor & QA Lead  
**Date**: September 27, 2026  
**Git Commit**: `2576d660eb8dd3e580952615defd5d440a585126`  

---

## 1. Executive Summary

During the Phase 23 audit of the Command Center and BI platform, **0 P0 critical security vulnerabilities** were identified. However, **2 P1 high-severity items** and **3 P2 medium-severity architectural enhancements** were discovered that must be remediated to achieve complete enterprise production readiness.

---

## 2. Identified Gap Inventory

### `GAP-P23-01`: Mock / Fallback Data in `ExecutiveMisRepository.ts`
* **Severity**: **P1 (High)**
* **Component**: [`ExecutiveMisRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/ExecutiveMisRepository.ts#L69-L135)
* **Description**: Lines 69–81, 92–132, 164–219, and 450–480 contain hardcoded synthetic records for `DEFAULT_PRIMARY_TENANTS` (e.g., `Apex Multi-Specialty Hospital`, `Kavita Joshi`, `Ramanathan Iyer`, static doctor payouts). This violates the Phase 23 absolute rule against mock fallback data in production analytics code.
* **Impact**: If a primary tenant queries `/api/v1/partner/executive-mis/*`, synthetic records are returned instead of genuine database rows or clean zero-state arrays.
* **Remediation**: Remove all hardcoded synthetic patient names, static billing amounts, and mock hospital baselines. Ensure methods query relational tables (`executiveCommandSnapshots`, `billingInvoices`, `encounters`) or return clean empty states (`[]`) if unseeded.

---

### `GAP-P23-02`: Automated Reconciliation Test Suite Missing
* **Severity**: **P1 (High)**
* **Component**: [`apps/api-gateway/test`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test)
* **Description**: Section 23 requires an explicit reconciliation test verifying that Command Center dashboard numbers reconcile with authoritative transactional data (Dashboard Revenue vs Finance Revenue; Dashboard Patient Count vs Patient Table; Dashboard Lab Orders vs LIMS; Dashboard Inventory vs Batches; Dashboard License vs License Service).
* **Impact**: Potential calculation drifts between transactional writes and BI aggregations could go undetected.
* **Remediation**: Create a dedicated test suite [`phase23-command-center-bi-reconciliation.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/phase23-command-center-bi-reconciliation.test.mjs) testing cross-domain reconciliation, zero-state integrity, and multi-tenant isolation.

---

### `GAP-P23-03`: Missing Governed CSV Export Endpoints
* **Severity**: **P2 (Medium)**
* **Component**: [`command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/command-center.routes.ts), [`hq-command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/company/hq-command-center.routes.ts)
* **Description**: Section 26 mandates that if export capabilities exist or are requested, they must enforce strict tenant isolation, role permissions, and date scopes. Currently, no dedicated CSV export endpoint exists for Partner or HQ Command Center summaries.
* **Impact**: Users cannot export executive KPI reports to CSV format.
* **Remediation**: Implement `GET /api/v1/partner/command-center/export` and `GET /api/v1/hq/command-center/export` generating RFC 4180 compliant CSV streams with mandatory RBAC guards.

---

### `GAP-P23-04`: Missing Governed Ewan / AI Telemetry Endpoint in Command Center
* **Severity**: **P2 (Medium)**
* **Component**: [`command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/command-center.routes.ts), [`CommandCenterService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/partner/CommandCenterService.ts)
* **Description**: Section 18 requires governed AI/Ewan usage analytics (requests, latency, tokens, approval level, rejection rate) from `core.ai_request_registry`.
* **Impact**: Partner leadership cannot review AI usage or clinician override rates within the Command Center.
* **Remediation**: Add `getAiUsageTelemetry()` querying `core.ai_request_registry` scoped to session tenant ID, exposed via `GET /api/v1/partner/command-center/ai-telemetry`.

---

### `GAP-P23-05`: Missing Partner License / Subscription Status in Command Center
* **Severity**: **P2 (Medium)**
* **Component**: [`command-center.routes.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/routes/partner/command-center.routes.ts)
* **Description**: Section 4 & 17 requires Partner Command Center to show license/subscription status (current tier, days remaining, grace period) directly to partner leadership.
* **Impact**: Partners have to navigate to Account settings to view license status rather than seeing it on the executive overview.
* **Remediation**: Add `GET /api/v1/partner/command-center/license` fetching current license and plan entitlements.
