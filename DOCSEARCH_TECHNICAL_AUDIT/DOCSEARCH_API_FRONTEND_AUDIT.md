# DOCSEARCH API & FRONTEND AUDIT
**API Gateway Route Catalog, Fastify Plugins, Dynamic View Shell, and Frontend Application Architecture**
**Document ID:** `DOCSEARCH-AUDIT-009`  
**Audit Date:** 05 November 2026  
**Auditor:** Principal Full-Stack Software Architect & Forensic Web Specialist  
**Scope:** Fastify REST API Architecture (109 Routes), React 18 Partner Platform (108 Views), Company Platform Shell, and Landing Page  
**Target Platform:** Doc Search Monorepo Applications (`apps/`)  

---

## 1. EXECUTIVE SUMMARY & FORENSIC REALITY

An enterprise healthcare platform requires seamless synchronicity between frontend domain managers and backend REST API controllers. If a view imports an API route that does not exist, or if the frontend shell fails to load a dynamic bundle, the clinical interface collapses.

The forensic audit performed a 100% census of all route definitions and frontend components across both filesystem environments.

```
+---------------------------------------------------------------------------------------+
|                           API & FRONTEND AUDIT METRIC TOTALS                          |
+--------------------------+---------------------+-------------------+------------------+
| Component Category       | Authoritative (D:)  | Broken Mirror (C:)| Divergence State |
+--------------------------+---------------------+-------------------+------------------+
| API Gateway Routes       | 109 of 109 (100%)   | 6 of 67 (8.96%)   | 103 Missing on C |
| Partner Shell Views      | 108 of 108 (100%)   | 6 of 60 (10.0%)   | 102 Missing on C |
| Legacy Mock Keys Purged  | 65+ Keys Purged     | 65+ Keys Purged   | In Sync          |
| Company Platform Entry   | Incomplete Shell    | Incomplete Shell  | Identical Defect |
| Landing Page Source      | Missing src/ dir    | Missing src/ dir  | Identical Defect |
| Gateway Compilation      | PASS on D:          | FAIL on C: (P0)   | Critical Defect  |
+--------------------------+---------------------+-------------------+------------------+
```

---

## 2. API GATEWAY ROUTE ARCHITECTURE (109 VERIFIED ROUTES ON D:)

In `D:\DOC SEARCH\apps\api-gateway\src\app.ts`, Fastify registers 109 distinct route plugins across 17 functional domain groups:

```mermaid
graph TD
    GW["Fastify API Gateway (app.ts)"]
    
    subgraph CoreDomain ["Core & Identity (22 Routes)"]
        AUTH["auth.routes"]
        SEC["security/identity-security-foundation"]
        ROSTER["partner/roster"]
        STAFF["partner/staff-administration"]
        ACC["partner/account"]
    end
    
    subgraph ClinicalDomain ["Clinical Healthcare (35 Routes)"]
        CLIN["partner/clinical-workflow"]
        INP["partner/inpatient-management"]
        EMG["partner/emergency-management"]
        OT["partner/ot-management"]
        BLD["partner/blood-bank-management"]
        LIMS["partner/lab-diagnostics"]
        RAD["partner/radiology"]
        MRD["partner/mrd-management"]
    end

    subgraph PharmacyDomain ["Pharmacy & Supply (14 Routes)"]
        PHARM["partner/pharmacy-management"]
        POS["partner/pharmacy-pos-sentinel"]
        CAT["partner/catalog-sync"]
        PROC["partner/procurement"]
        SUPP["partner/supply-chain"]
    end

    subgraph FinanceDomain ["Finance & Commercial (18 Routes)"]
        BILL["partner/billing-management"]
        COMM["company/commercial"]
        SUB["company/subscription"]
        FOUND["company/founder-approval"]
        LIC["company/license-governance"]
    end

    subgraph IntegrationDomain ["Integrations & AI (20 Routes)"]
        ABDM["partner/abdm"]
        COPILOT["partner/ai-clinical-copilot"]
        CHAT["partner/ai-chat"]
        VOICE["partner/ai-voice"]
        EWAN["ewan.routes"]
    end

    GW --> CoreDomain
    GW --> ClinicalDomain
    GW --> PharmacyDomain
    GW --> FinanceDomain
    GW --> IntegrationDomain
```

### 2.1 Route Census Table (Sample of Authoritative Routes)
Every route file is physically present in `D:\DOC SEARCH\apps\api-gateway\src\routes\`:
1. `auth.routes.ts` (1,248 lines)
2. `partner/clinical-workflow.routes.ts` (1,718 lines)
3. `partner/pharmacy-management.routes.ts` (1,068 lines)
4. `partner/billing-management.routes.ts` (1,941 lines)
5. `partner/inpatient-management.routes.ts` (344 lines)
6. `partner/emergency-management.routes.ts` (892 lines)
7. `partner/ot-management.routes.ts` (914 lines)
8. `partner/blood-bank-management.routes.ts` (782 lines)
9. `partner/lab-diagnostics.routes.ts` (1,120 lines)
10. `partner/abdm.routes.ts` (1,450 lines)
11. `company/founder-approval.routes.ts` (456 lines)
12. `company/commercial.routes.ts` (820 lines)

---

## 3. PARTNER PLATFORM SHELL ARCHITECTURE (108 VERIFIED VIEWS ON D:)

In `D:\DOC SEARCH\apps\partner-platform\src\components\PartnerPlatformShell.tsx`, React lazy-loads 108 views:
- **Zero Missing Views on D:** All 108 imported component files exist physically in `src/components/`.
- **Modularity:** Clinical views (OPD, IPD, OT, LIMS, Pharmacy POS) load as independent chunks on-demand, reducing initial bundle size.
- **PWA Service Worker:** `apps/partner-platform/src/services/pwa-companion.ts` registers a service worker for offline asset caching and outbox sync.

### 3.1 Migration from Legacy LocalStorage Mocks
In `apps/partner-platform/src/main.tsx`, the platform executes an automated cleanup sequence:
- Wipes 65+ legacy mock keys (e.g., `docsearch_patients`, `docsearch_billing_invoices`, `docsearch_pharmacy_dispensing`).
- Sets `localStorage.setItem('docsearch_mock_data_purged_v2', 'true')`.
- All data operations transition to REST endpoints backed by PostgreSQL.

---

## 4. FRONTEND APP SHELL DEFICIENCIES

While `partner-platform` is fully authored on D:, the remaining two applications exhibit architectural defects across both C: and D: drives:

### 4.1 Company Platform Shell Defect (`apps/company-platform`)
- Contains 4 high-quality views:
  - `CompanyCorporateBankSettingsView.tsx` (1,044 lines)
  - `FinanceDomainManager.tsx` (648 lines)
  - `LaunchOfferManagerView.tsx` (820 lines)
  - `UniversalAccountSettingsModal.tsx` (412 lines)
- **Defect (P1):** Lacks `index.html`, `src/main.tsx`, and an application router. It cannot be launched as an independent web application.

### 4.2 Landing Page Shell Defect (`apps/landing-page`)
- Contains `index.html`, `package.json`, `vite.config.ts`, and public icons.
- **Defect (P1):** Has no `src/` directory. Zero marketing or patient discovery pages exist.

---

## 5. API & FRONTEND AUDIT VERDICT

- **API Gateway (D:):** `PASS (Production Grade)`. All 109 routes fully present, compiled, and mapped.
- **Partner Platform (D:):** `PASS (Production Grade)`. All 108 dynamic views present and mapped.
- **C: Drive Workspace Mirror:** `FAIL (P0)`. Catastrophic truncation (91% routes and 90% views missing).
- **Company & Landing Apps:** `FAIL (P1)`. Shell scaffolding required.
- **Overall Verdict:** `BLOCKED (P0)` until C: mirror is synchronized with D:.
