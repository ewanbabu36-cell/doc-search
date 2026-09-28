# DOC SEARCH — BASELINE FULL MONOREPO FORENSIC AUDIT REPORT
**Forensic Standard**: Zero-Trust Production Runtime Verification • Browser-to-Database Traceability  
**Baseline Frozen At**: 2026-09-28T10:00:00+05:30  
**Scope**: Full Monorepo (`apps/api-gateway`, `apps/partner-platform`, `apps/company-platform`, `apps/landing-page`, `packages/database`, `packages/auth`, `packages/shared-core`)

---

## 1. BASELINE AUDIT SUMMARY METRICS

| Audit Dimension | Exact Metric Value | Zero-Trust Health Status | Baseline Assessment |
| :--- | :--- | :--- | :--- |
| **Backend Fastify Registered Routes** | **1,567 registered routes** (1,402 unique method+path) | **ACTIVE** | Fastify route tree loaded across 42 route plugin files. |
| **Frontend API Call Sites Scanned** | **381 call sites** | **AUDITED** | Scanned across `partner-platform`, `company-platform`, `landing-page`. |
| **Confirmed Frontend/Backend API Mismatches** | **6 call sites** | **DEFECT (P0)** | 6 endpoints fail due to missing routes or plural/singular mismatches. |
| **Verified Frontend API Calls** | **375 call sites** | **VERIFIED** | Successfully mapped to registered Fastify routes. |
| **Drizzle ORM Schema Tables Defined** | **499 tables** | **PERSISTENCE GAP (P1)** | Live PostgreSQL supports all 499; Embedded SQLite/pg-mem tracks only 34-35. |
| **Browser Storage Operations** | **491 operations** | **HIGH RISK (P0/P1)** | Found across 86 distinct `localStorage`/`sessionStorage` keys. |
| **High-Risk Clinical/Business Storage Keys** | **14 critical keys** | **DANGEROUS LEAKAGE** | Prescriptions, patient queues, nurse vitals, registered partners, staff auth in LocalStorage. |
| **Frontend Services with Silent Fallbacks** | **14 services** | **ACTIVE TRAP (P0/P1)** | Swallowing 404/500 into synthetic/mock arrays instead of propagating explicit errors. |
| **Unguarded Sensitive Company Endpoints** | **1 endpoint** | **SECURITY VULNERABILITY (P1)** | `/api/v1/company/treasury/fx-rates` lacks `authenticate` / RBAC preHandler. |
| **Production Embedded Database Safety** | **Strict Fail-Closed Required** | **POLICY ENFORCEMENT NEEDED** | Production must never silently run on embedded storage; must fail closed. |

---

## 2. THE 6 CONFIRMED API MISMATCHES (BASELINE DEFECT REGISTER)

### 2.1 Blood Bank Management Service
1. **`GET /api/v1/partner/blood-bank/overview`**
   - **Frontend Site**: `apps/partner-platform/src/services/blood-bank-management-service.ts:165`
   - **Backend Status**: Route was missing in `blood-bank-management.routes.ts`.
   - **Runtime Effect**: Fastify returned 404; caught by `try/catch`, silently returned `mockBloodBankOverviewMetrics`.
2. **`GET /api/v1/partner/blood-bank/crossmatches`**
   - **Frontend Site**: `apps/partner-platform/src/services/blood-bank-management-service.ts:262`
   - **Backend Status**: Backend only exposed `POST /crossmatch` (mutation). No plural query route existed.
   - **Runtime Effect**: Fastify returned 404; swallowed into local in-memory array.
3. **`GET /api/v1/partner/blood-bank/issues`**
   - **Frontend Site**: `apps/partner-platform/src/services/blood-bank-management-service.ts:275`
   - **Backend Status**: Backend only exposed `POST /issue` (mutation). No plural query route existed.
   - **Runtime Effect**: Fastify returned 404; swallowed into local in-memory array.

### 2.2 Staff Administration Service
4. **`POST /api/v1/partner/staff/members/${staffId}/revoke`**
   - **Frontend Site**: `apps/partner-platform/src/services/staff-administration-service.ts:779`
   - **Backend Status**: Backend implemented status mutations at `PATCH /api/v1/partner/staff/members/:id/status`.
   - **Runtime Effect**: Fastify returned 404; swallowed into `docsearch_partner_staff` in `localStorage`.
5. **`POST /api/v1/partner/staff/members/${staffId}/restore`**
   - **Frontend Site**: `apps/partner-platform/src/services/staff-administration-service.ts:824`
   - **Backend Status**: Backend implemented status mutations at `PATCH /api/v1/partner/staff/members/:id/status`.
   - **Runtime Effect**: Fastify returned 404; swallowed into `docsearch_partner_staff` in `localStorage`.
6. **`PATCH /api/v1/partner/staff/members/${staffId}/permissions`**
   - **Frontend Site**: `apps/partner-platform/src/services/staff-administration-service.ts:870`
   - **Backend Status**: Backend route was missing (only had role assignment endpoint).
   - **Runtime Effect**: Fastify returned 404; swallowed into `docsearch_partner_staff` in `localStorage`.

---

## 3. THE 14 FRONTEND SERVICES WITH SILENT FALLBACK BEHAVIOR

| # | Service Name | File Location | Silent Fallback Pattern & Risk |
|---|---|---|---|
| 1 | **BloodBankManagementService** | `apps/partner-platform/src/services/blood-bank-management-service.ts` | Swallows 404/500, falls back to `mockBloodBankOverviewMetrics` and local state arrays. |
| 2 | **StaffAdministrationService** | `apps/partner-platform/src/services/staff-administration-service.ts` | Swallows 404/500, falls back to `MOCK_STAFF_ADMIN_OVERVIEW` and `docsearch_partner_staff`. |
| 3 | **ClinicalInvestigationService** | `apps/partner-platform/src/services/clinical-investigation-service.ts` | Falls back to `docsearch_investigation_catalog` and synthetic test orders. |
| 4 | **AssetBiomedicalService** | `apps/partner-platform/src/services/asset-biomedical-service.ts` | Mutations swallow errors and update local memory array only. |
| 5 | **DietaryService** | `apps/partner-platform/src/services/dietary-service.ts` | Meal orders fall back to synthetic memory store on failure. |
| 6 | **QualityInfectionService** | `apps/partner-platform/src/services/quality-infection-service.ts` | Incident reports and surveillance records fall back to in-memory fixtures. |
| 7 | **ProcurementService** | `apps/partner-platform/src/services/procurement-service.ts` | Purchase orders and vendor records fall back to synthetic state. |
| 8 | **SupplyChainService** | `apps/partner-platform/src/services/supply-chain-service.ts` | Material requisitions and stock movements fall back to in-memory fixtures. |
| 9 | **AbdmService** | `apps/partner-platform/src/services/abdm-service.ts` | ABHA creation and consent artefacts fall back to simulated responses. |
| 10 | **HardwareBridgeService** | `apps/partner-platform/src/services/hardware-bridge-service.ts` | Device telemetry falls back to simulated COM port data. |
| 11 | **ExecutiveMisService** | `apps/partner-platform/src/services/executive-mis-service.ts` | KPI cards and hospital metrics fall back to hardcoded numbers. |
| 12 | **WholesalePharmacyService** | `apps/partner-platform/src/services/wholesale-pharmacy-service.ts` | B2B distributor invoices fall back to simulated entries. |
| 13 | **PharmacyCreditKhataService** | `apps/partner-platform/src/services/pharmacy-credit-khata-service.ts` | Credit ledger entries fall back to `localStorage` store. |
| 14 | **PharmacyOfflineStorageService** | `apps/partner-platform/src/services/pharmacy-offline-storage-service.ts` | POS transactions fall back silently without notifying doctor/clerk. |

---

## 4. HIGH-RISK BROWSER STORAGE REGISTER (86 KEYS / 491 OPERATIONS)

| Storage Key | Operations | Severity | Current Inappropriate Usage |
|---|---|---|---|
| `docsearch_registered_partners` | 44 | **P0** | Partner self-registration stored in browser LocalStorage rather than pure PostgreSQL. |
| `docsearch_pending_doctor_prescriptions` | 12 | **P0** | Clinical doctor prescriptions saved in browser storage instead of transactional DB queue. |
| `docsearch_partner_staff_auth` | 41 | **P1** | Staff credentials and role permissions cached and manipulated in LocalStorage. |
| `docsearch_verification_queue` | 26 | **P1** | HQ approval queue mirrored in browser storage. |
| `docsearch_recent_opd_queue` | 13 | **P1** | Live OPD front desk token queue stored in LocalStorage. |
| `docsearch_nurse_vitals` | 11 | **P1** | Patient triage vitals cached in browser storage. |
| `docsearch_custom_partner_users` | 9 | **P1** | User identity records maintained in LocalStorage. |
| `docsearch_pending_lab_orders` | 6 | **P1** | Diagnostic investigation orders cached in browser LocalStorage. |
| `docsearch_pending_radiology_orders` | 4 | **P1** | Imaging scan orders cached in browser LocalStorage. |
| `docsearch_pharmacy_invoices` | 5 | **P1** | Sales invoices and billing transactions stored in browser memory. |

---

## 5. DATABASE PERSISTENCE GAP BASELINE

- **Defined Drizzle Tables**: **499 tables** across `clinical` (321), `company` (133), `core` (36), and `workflow` (9).
- **Tracked Embedded Tables**: **34-35 tables** in `packages/database/src/embedded-persistence.ts`.
- **Finding**: While PostgreSQL in production creates and persists all 499 tables, the development/embedded runtime tracks only 34 tables. 465 tables exist only in memory if embedded mode is used.
- **Mandate**: Production must enforce native PostgreSQL and strictly FAIL CLOSED if native PostgreSQL is absent.

---

## 6. SECURITY & ACCESS CONTROL BASELINE

- **Total Authenticated Endpoints**: 771 endpoints.
- **Unguarded Endpoint**: `GET /api/v1/company/treasury/fx-rates` in `apps/api-gateway/src/routes/company/subscription.routes.ts:328`.
  - Missing `preHandler: [authenticate, requireRoles('SUPER_ADMIN', 'COMPANY_ADMIN')]`.
  - Exposes unauthenticated access and returns static hardcoded currency data.
- **Verification Queue**: Certified secure with `adminVerificationGuard`.
