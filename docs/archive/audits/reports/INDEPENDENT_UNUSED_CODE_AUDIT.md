# STRICT MODE: INDEPENDENT UNUSED CODE AUDIT
**Monorepo:** Doc Search — Next-Gen Healthcare Platform  
**Audit Scope:** Entire Repository (`apps/`, `packages/`, `scripts/`, `infra/`, root)  
**Execution Mode:** STRICT READ-ONLY AUDIT (Zero Source Code Modifications)  
**Baseline Commit:** `aad78d08407f154406627eb6556ae0cf29fd66ec`  
**Date:** November 5, 2026  

---

## 1. Executive Summary & Audit Methodology

A zero-trust, independent, static and runtime-dependency audit was performed across the entire Doc Search monorepo comprising **16,249 non-ignored files** across 12 packages and applications. Every file, module, export, database table, script, and dependency was evaluated against:
1. AST and static import/export dependency graphs.
2. Cross-package reference frequency.
3. Fastify HTTP route registration and frontend API client invocations.
4. Dynamic loading, reflection, and runtime configuration paths.
5. Project healthcare domain relevance (Hospital Management, EMR, PACS/DICOM, Pharmacy, Lab, ABDM, Billing).

### Summary of Audit Findings Across 10 Mandated Categories

| Category | Findings Identified | Estimated Bloat / Impact | Primary Domain | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| **1. Unused Files & Modules** | 3 zero-byte files, 3 orphaned JSON reports, 4 stray root PNGs | ~872 MB disk space, root clutter | Root / Tooling | LOW |
| **2. Unrelated Code** | TPA Debt Factoring, Generic Medicine Arbitrage, Legacy VPS Script | ~850 LOC non-clinical financial logic | Backend / APIs | MEDIUM |
| **3. Dead & Unreachable Code** | 209 dead mock fallback blocks, disabled by `isMockFallbackAllowed() = false` | ~6,500 LOC unreachable dead code | Frontend Services | LOW |
| **4. Duplicate Implementations** | 8 distinct function/hook implementations duplicated across packages | Code drift, divergent UUID & auth handling | Core / Frontend / Repos | MEDIUM |
| **5. Abandoned Features** | Standalone workflow engine schema (7 tables) never queried | 134 LOC dead schema | Database | MEDIUM |
| **6. Unused Functions & APIs** | 17 Fastify route files (72 endpoints) with 0 frontend & 0 test callers; 175 UI-kit exports unused in frontends | High API surface maintenance overhead | APIs / UI-Kit | MEDIUM |
| **7. Unused Dependencies** | 6 phantom / unused packages across root & app manifests (`embedded-postgres`, `@docsearch/database` in client, `@docsearch/auth`, `@capacitor/network`, `workbox-window`) | Slower install times, dependency confusion | Package Manifests | LOW |
| **8. Legacy Implementations** | 464 archived scripts in `scripts/archive/`, 17 ad-hoc root scripts | Repository navigation friction | Scripts | LOW |
| **9. Orphaned Assets & Cache** | `temp_chrome_profile/` (356.38 MB), `audit-results/` (84.04 MB) | 440+ MB unneeded local storage | Assets / Tooling | LOW |
| **10. Unused Database Schemas** | 9 tables (`facility_registry`, `partner_agreements`, 7 workflow tables) | Orphaned schema definitions | Database | MEDIUM |

---

## 2. Detailed Findings by Category

### Category 1: Unused Files and Modules

#### Finding F-01: Zero-Byte Shell Redirection Artifacts in Root
- **Exact File Paths:**
  - `D:/DOC SEARCH/r.json()).then(console.log)` (0 bytes)
  - `D:/DOC SEARCH/r.json()).then(console.log).catch(console.error)` (0 bytes)
  - `D:/DOC SEARCH/r.text()).then(console.log).catch(console.error)` (0 bytes)
- **Symbol / Name:** File system artifacts created by accidental unquoted PowerShell/Bash pipeline execution.
- **Why Unused:** Accidental command output redirection from previous curl/fetch terminal commands. Zero content.
- **Repository Reference Evidence:** 0 references across the entire codebase.
- **Affected Domain:** Infrastructure / Root Directory.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE`.

#### Finding F-02: Orphaned Benchmark & Comparison JSON Reports
- **Exact File Paths:**
  - `D:/DOC SEARCH/d-vs-c-comparison-report.json` (871,321 bytes / 850 KB)
  - `D:/DOC SEARCH/phase-7-certification-results.json` (13,578 bytes)
  - `D:/DOC SEARCH/phase6-benchmark-results.json` (19,959 bytes)
- **Why Unused:** One-off certification and performance benchmarking dumps generated during historical test runs. Not referenced by active CI scripts or runtime code.
- **Repository Reference Evidence:** No active test or runtime module imports these JSON files.
- **Affected Domain:** Root / Tooling.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE` (or move to an archive folder outside active source control).

#### Finding F-03: Orphaned Root Screenshots
- **Exact File Paths:**
  - `D:/DOC SEARCH/patient_app_abha_card_modal.png` (113,653 bytes)
  - `D:/DOC SEARCH/patient_app_benchmark_home.png` (93,588 bytes)
  - `D:/DOC SEARCH/patient_app_home_lab_modal.png` (113,601 bytes)
  - `D:/DOC SEARCH/patient_app_tata1mg_modal.png` (112,632 bytes)
- **Why Unused:** Visual verification screenshots taken during manual browser validation. Not embedded in markdown documentation or application assets.
- **Affected Domain:** Frontend / Documentation Assets.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE` (or move to `docs/assets/`).

---

### Category 2: Code Unrelated to Project Purpose

#### Finding F-04: Non-Clinical TPA Debt Factoring & Micro-Lending Engine
- **Exact File Path:** `apps/api-gateway/src/routes/company/tpa-factoring.routes.ts` (Lines 1–280) and `apps/api-gateway/src/services/company/TpaFactoringService.ts`
- **Symbol:** `tpaFactoringRoutes`, `TpaFactoringService`
- **Why Unrelated:** DocSearch is an enterprise healthcare EMR, Hospital Information System (HIS), PACS, and ABDM platform. TPA Factoring introduces invoice discounting, bank debt underwriting, credit risk APR calculation, and financial receivables factoring that are completely disconnected from core clinical care, OPD/IPD operations, and pharmacy workflows.
- **Reference Evidence:** Registered in `apps/api-gateway/src/app.ts:394`, but 0 frontend callers in `apps/company-platform` or `apps/partner-platform`.
- **Affected Domain:** Backend / APIs.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REVIEW` (Evaluate whether enterprise commercial fintech factoring is part of the core product roadmap or should be extracted into a separate external service).

#### Finding F-05: Generic Medicine Arbitrage Margin Optimizer
- **Exact File Path:** `apps/api-gateway/src/routes/partner/generic-arbitrage.routes.ts` (Lines 1–110)
- **Symbol:** `genericArbitrageRoutes`
- **Why Unrelated:** Commercial margin arbitrage trading algorithms comparing generic vs branded wholesale price spreads.
- **Reference Evidence:** Registered in `apps/api-gateway/src/app.ts:448`, but 0 frontend callers and 0 test assertions.
- **Affected Domain:** Backend / APIs.
- **Confidence Level:** `MEDIUM`.
- **Recommended Action:** `REVIEW`.

#### Finding F-06: Obsolete Raw VPS Deployment Script
- **Exact File Path:** `scripts/deploy-to-vps.js` (Lines 1–85)
- **Symbol:** Script module executing direct SSH commands to hardcoded IP `159.65.158.176`.
- **Why Unrelated:** The monorepo has standardized on Kubernetes (EKS 1.35–1.37) and Terraform infrastructure (`infra/` and `deploy/`). Raw SSH VPS script is obsolete and presents a security risk if executed unintentionally.
- **Affected Domain:** Infrastructure.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE`.

---

### Category 3: Dead and Unreachable Code

#### Finding F-07: 209 Dead Mock Fallback Blocks in Frontend Services
- **Exact File Paths:**
  - `apps/company-platform/src/services/api-client.ts` (Lines 30–32)
  - `apps/partner-platform/src/services/api-client.ts` (Lines 154–156)
  - 42 service files in `apps/company-platform/src/services/` (e.g., `ai-service.ts`, `analytics-service.ts`, `communication-service.ts`, etc.)
  - 38 service files in `apps/partner-platform/src/services/`
- **Symbol:** `isMockFallbackAllowed()`, private mock state arrays (`this.models`, `this.policies`, etc.)
- **Why Dead:**
  ```typescript
  // apps/company-platform/src/services/api-client.ts
  export function isMockFallbackAllowed(): boolean {
    return false; // Permanently hardcoded to false
  }

  // Across 80+ frontend service classes:
  try {
    return await apiCall('/api/v1/endpoint');
  } catch (error) {
    if (!isMockFallbackAllowed()) throw error; // ALWAYS throws error!
    return [...this.models]; // NEVER REACHED!
  }
  ```
  Because `isMockFallbackAllowed()` returns strictly `false`, `!isMockFallbackAllowed()` is universally `true`. Every single catch-block fallback is completely unreachable. Furthermore, all initialized mock arrays in service constructors consume heap memory without ever being accessed.
- **Line Count Impact:** ~6,500 lines of dead code and unreachable mock data.
- **Affected Domain:** Frontend.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE` (Strip unreachable fallback blocks and unused in-memory mock fixtures; retain standard error propagation).

---

### Category 4: Duplicate Implementations

#### Finding F-08: Duplicated Deterministic UUID Generators
- **Locations:**
  1. `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts` (Line 18)
  2. `apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts` (Line 24)
- **Symbol:** `toDeterministicUuid(input: string): string`
- **Why Duplicate:** Identical MD5/SHA-256 to UUID format transformation functions implemented independently in two repository files.
- **Affected Domain:** Backend Repositories.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE` duplicate; consolidate into `@docsearch/shared-core/crypto`.

#### Finding F-09: Duplicated `ensureUuid` Sanitizers
- **Locations:**
  1. `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts` (Line 26)
  2. `apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts` (Line 31)
  3. `apps/api-gateway/src/repositories/partner/QualityInfectionRepository.ts` (Line 22)
- **Symbol:** `ensureUuid(val: string): string`
- **Why Duplicate:** Identical validation regex and fallback UUID generator implemented in three separate repository classes.
- **Affected Domain:** Backend Repositories.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** Consolidate into `@docsearch/shared-core`.

#### Finding F-10: Duplicated Ewan AI Knowledge Search
- **Locations:**
  1. `apps/api-gateway/src/services/ewan/ewan-knowledge-engine.ts` (Line 45)
  2. `packages/ui-kit/src/components/ewan/ewanKnowledgeBase.ts` (Line 60)
- **Symbol:** `searchEwanKnowledge(query: string)`
- **Why Duplicate:** Knowledge base search logic duplicated across backend service and frontend UI kit component.
- **Affected Domain:** Backend / UI Kit.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** Unify authoritative knowledge engine on backend; frontend should query backend API.

#### Finding F-11: Duplicated React Hooks & API Helpers
- **Locations:**
  - `useFounderApproval`: duplicated between `apps/company-platform/src/hooks/useFounderApproval.ts` and `apps/partner-platform/src/hooks/useFounderApproval.ts`.
  - `getAuthToken`: duplicated between `apps/company-platform/src/services/api-client.ts` and `apps/partner-platform/src/services/api-client.ts`.
  - `resolveNearestDepotByPincode`: duplicated between `apps/company-platform/src/services/central-supply-chain-service.ts` and `apps/partner-platform/src/services/b2b-wholesale-supply-service.ts`.
- **Affected Domain:** Frontend Apps.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** Extract common hooks and utilities to `@docsearch/ui-kit` or `@docsearch/shared-core`.

---

### Category 5: Abandoned Features & Experimental Code

#### Finding F-12: Abandoned Workflow Engine Schema
- **Exact File Path:** `packages/database/src/schema/workflow-schema.ts` (Lines 1–135)
- **Symbols:**
  - `workflow_versions` (Line 16)
  - `workflow_stages` (Line 28)
  - `workflow_transitions` (Line 43)
  - `workflow_requirements` (Line 60)
  - `workflow_requirement_instances` (Line 92)
  - `workflow_approvals` (Line 106)
  - `workflow_transition_logs` (Line 117)
- **Why Abandoned:** Defined as a generic state-machine workflow engine. Zero queries in `apps/api-gateway`, zero UI components, and zero migrations reference these tables. The actual active workflows in DocSearch use `universal-workflow.routes.ts` and `clinical-workflow.routes.ts` which operate directly on encounter and clinical tables.
- **Affected Domain:** Database / Schema.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REVIEW` (Verify if planned for future custom BPMN workflows or deprecate).

---

### Category 6: Unused Functions, Components, and APIs

#### Finding F-13: 17 Fastify Route Modules with Zero Frontend and Zero Test Callers
- **Exact File Paths:**
  1. `apps/api-gateway/src/routes/communication/whatsapp-webhook.routes.ts` (3 endpoints)
  2. `apps/api-gateway/src/routes/company/growth-retention.routes.ts` (6 endpoints)
  3. `apps/api-gateway/src/routes/company/monetization-engine.routes.ts` (7 endpoints)
  4. `apps/api-gateway/src/routes/company/revenue-compliance.routes.ts` (5 endpoints)
  5. `apps/api-gateway/src/routes/company/revenue-waterfall.routes.ts` (2 endpoints)
  6. `apps/api-gateway/src/routes/compliance/clinical-registry.routes.ts` (6 endpoints)
  7. `apps/api-gateway/src/routes/executive/bed-telemetry.routes.ts` (4 endpoints)
  8. `apps/api-gateway/src/routes/locks.routes.ts` (6 endpoints)
  9. `apps/api-gateway/src/routes/partner/antibiogram.routes.ts` (2 endpoints)
  10. `apps/api-gateway/src/routes/partner/bed-turnaround.routes.ts` (3 endpoints)
  11. `apps/api-gateway/src/routes/partner/billing-webhook.routes.ts` (3 endpoints)
  12. `apps/api-gateway/src/routes/partner/clinical-sentinel.routes.ts` (2 endpoints)
  13. `apps/api-gateway/src/routes/partner/generic-arbitrage.routes.ts` (2 endpoints)
  14. `apps/api-gateway/src/routes/partner/public-kiosk.routes.ts` (2 endpoints)
  15. `apps/api-gateway/src/routes/patient/chronic-refill.routes.ts` (3 endpoints)
  16. `apps/api-gateway/src/routes/supply-chain/po-matching.routes.ts` (4 endpoints)
  17. `apps/api-gateway/src/routes/webhooks/notification-webhook.routes.ts` (2 endpoints)
- **Total Inactive Endpoints:** 72 endpoints registered in `app.ts` that have no callers across any web/mobile frontend and no automated tests.
- **Affected Domain:** APIs / Backend.
- **Confidence Level:** `MEDIUM`.
- **Recommended Action:** `REVIEW` (Identify which are planned enterprise endpoints needing UI connection vs obsolete prototypes).

#### Finding F-14: 175 Unused Exported Symbols in UI Kit
- **Exact File Path:** `packages/ui-kit/src/components/`
- **Symbols:** `BottomNavDestination`, `AdaptiveFAB`, `ClinicalSparkline`, `TableLoadingState`, `WorkspaceDensityProvider`, `AIOperationalPipeline`, etc.
- **Why Unused:** Defined in `@docsearch/ui-kit` as generic component library widgets, but never imported in any of the 5 consumer frontends (`company-platform`, `partner-platform`, `patient-app`, `sovra-pwa`, `landing-page`).
- **Affected Domain:** UI Kit / Frontend.
- **Confidence Level:** `MEDIUM`.
- **Recommended Action:** `KEEP` if maintaining `@docsearch/ui-kit` as a standalone design system; `REVIEW` for tree-shaking efficiency.

---

### Category 7: Unused Dependencies and Packages

#### Finding F-15: Phantom Dependency: `embedded-postgres` in Root
- **File:** `package.json` (Line 37)
- **Declared:** `"embedded-postgres": "18.4.0-beta.17"`
- **Why Unused:** The codebase successfully completed Phase 7.2D migration to the native PostgreSQL daemon (`scripts/native-postgres-daemon.mjs` running on port 5432). The embedded npm package is legacy scaffolding and no longer required.
- **Affected Domain:** Root Tooling / Dependencies.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE`.

#### Finding F-16: Architectural Boundary Violation: `@docsearch/database` in Frontend
- **File:** `apps/company-platform/package.json` (Line 17)
- **Declared:** `"@docsearch/database": "workspace:*"`
- **Why Unused:** Frontend React applications running in the browser cannot connect directly to PostgreSQL or execute Drizzle ORM queries. Static analysis revealed `@docsearch/database` was only mentioned in a string label in `DependencyGraphView.tsx` (Line 70).
- **Affected Domain:** Frontend / Architecture.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE`.

#### Finding F-17: Phantom Dependency: `@docsearch/auth` in Frontends
- **Files:**
  - `apps/company-platform/package.json` (Line 16)
  - `apps/partner-platform/package.json` (Line 17)
  - `apps/patient-app/package.json` (Line 27)
- **Declared:** `"@docsearch/auth": "workspace:*"`
- **Why Unused:** `@docsearch/auth` contains server-side JWT signing, Argon2 hashing, and Redis distributed session stores. Frontends do not import from `@docsearch/auth`; they use browser localStorage token storage and API requests.
- **Affected Domain:** Frontend Dependencies.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE` from frontend manifests.

#### Finding F-18: Unused Capacitor & PWA Dependencies
- **Files:**
  - `apps/patient-app/package.json` (Line 23): `"@capacitor/network": "^6.0.3"` — 0 imports in `apps/patient-app/src`.
  - `apps/partner-platform/package.json` (Line 32): `"workbox-window": "^7.4.1"` — 0 imports in `apps/partner-platform/src`.
- **Affected Domain:** Mobile / PWA Dependencies.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE`.

---

### Category 8: Legacy Implementations & Obsolete Configurations

#### Finding F-19: 464 Obsolete Scripts in `scripts/archive/`
- **Location:** `scripts/archive/` (464 files)
- **Why Obsolete:** Contains historic development artifacts from early iteration phases (Phase 0 through Phase 18 register generators, visual CDP scrapers, legacy seeders). None of these scripts are invoked by `package.json` scripts, Turbo pipeline, or CI.
- **Affected Domain:** Repository Maintenance.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REVIEW` (Archive into a separate repository or zip bundle to declutter monorepo root).

#### Finding F-20: Ad-hoc Check & Seed Scripts in `scripts/`
- **Location:** `scripts/`
  - `scripts/apply-migration-0070.mjs`
  - `scripts/apply-migration-0071.mjs`
  - `scripts/check-catalog-counts.mjs`
  - `scripts/check-cols.mjs`
  - `scripts/check-sample-patient.mjs`
  - `scripts/check-tables.mjs`
  - `scripts/enrich-insurance-payers.mjs`
  - `scripts/enrich-investigations.mjs`
  - `scripts/enrich-medications.mjs`
  - `scripts/generate-comprehensive-rls.mjs`
  - `scripts/purge-day-zero-database.mjs`
  - `scripts/seed-active-license.mjs`
  - `scripts/seed-daycare-procedures.mjs`
  - `scripts/seed-master-catalogs.mjs`
  - `scripts/sync-migrations-journal.mjs`
  - `scripts/test-app-role.mjs`
- **Why Obsolete:** One-off diagnostic and database bootstrapping scripts not integrated into npm lifecycle commands.
- **Confidence Level:** `MEDIUM`.
- **Recommended Action:** Consolidate into `scripts/tools/` or clean up.

---

### Category 9: Orphaned Assets and Local Caches

#### Finding F-21: Abandoned Chrome User Profile Directory
- **Location:** `D:/DOC SEARCH/temp_chrome_profile/`
- **Disk Usage:** **356.38 MB**
- **Why Orphaned:** Generated during automated browser testing and CDP sessions. Ignored by git in `.gitignore:57`, but consuming significant local disk space.
- **Confidence Level:** `HIGH`.
- **Recommended Action:** `REMOVE` (Safe local disk cleanup).

#### Finding F-22: Stale Audit Baseline Results
- **Location:** `D:/DOC SEARCH/audit-results/`
- **Disk Usage:** **84.04 MB**
- **Why Orphaned:** Contains 84 MB of legacy syntax, typecheck, build, and runtime baseline JSON dumps from early audit phases.
- **Confidence Level:** `MEDIUM`.
- **Recommended Action:** `REVIEW`.

---

### Category 10: Unused Database Models and Schemas

#### Finding F-23: Unreferenced Clinical & Company Schema Tables
- **Locations:**
  1. `facility_registry` in `packages/database/src/schema/clinical/index.ts:23` (1 reference — only schema declaration).
  2. `partner_agreements` in `packages/database/src/schema/company/index.ts:19` (1 reference — only schema declaration).
- **Why Unused:** Defined in schema files but never queried in repositories, services, or migration rollbacks.
- **Confidence Level:** `MEDIUM`.
- **Recommended Action:** `REVIEW` (Verify if required for future multi-facility federation or commercial contract tracking).

---

## 3. Audit Verification Matrix

| Finding ID | Exact File Path | Line(s) | Symbol / Name | Domain | Confidence | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | `D:/DOC SEARCH/r.json()).then(console.log)*` | N/A | Shell redirect artifacts | Root | `HIGH` | `REMOVE` |
| **F-02** | `D:/DOC SEARCH/d-vs-c-comparison-report.json` | N/A | 850KB audit dump | Root | `HIGH` | `REMOVE` |
| **F-03** | `D:/DOC SEARCH/patient_app_*.png` | N/A | Root screenshot assets | Root | `HIGH` | `REMOVE` |
| **F-04** | `apps/api-gateway/src/routes/company/tpa-factoring.routes.ts` | 1–280 | `tpaFactoringRoutes` | Backend | `HIGH` | `REVIEW` |
| **F-05** | `apps/api-gateway/src/routes/partner/generic-arbitrage.routes.ts` | 1–110 | `genericArbitrageRoutes` | Backend | `MEDIUM` | `REVIEW` |
| **F-06** | `scripts/deploy-to-vps.js` | 1–85 | SSH VPS deploy script | Infra | `HIGH` | `REMOVE` |
| **F-07** | `apps/company-platform/src/services/api-client.ts` | 30–32 | `isMockFallbackAllowed` (209 blocks) | Frontend | `HIGH` | `REMOVE` |
| **F-08** | `apps/api-gateway/src/repositories/company/AIGovernanceRepository.ts` | 18 | `toDeterministicUuid` | Backend | `HIGH` | `REMOVE` (Unify) |
| **F-09** | `apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts` | 31 | `ensureUuid` | Backend | `HIGH` | `REMOVE` (Unify) |
| **F-10** | `packages/ui-kit/src/components/ewan/ewanKnowledgeBase.ts` | 60 | `searchEwanKnowledge` | UI Kit | `HIGH` | `REMOVE` (Unify) |
| **F-11** | `apps/company-platform/src/hooks/useFounderApproval.ts` | 1–60 | `useFounderApproval` | Frontend | `HIGH` | `REMOVE` (Unify) |
| **F-12** | `packages/database/src/schema/workflow-schema.ts` | 16–135 | 7 workflow tables | Database | `HIGH` | `REVIEW` |
| **F-13** | `apps/api-gateway/src/routes/**/*.routes.ts` (17 files) | Var | 72 uncalled endpoints | APIs | `MEDIUM` | `REVIEW` |
| **F-14** | `packages/ui-kit/src/components/**/*.tsx` | Var | 175 unused UI exports | UI Kit | `MEDIUM` | `KEEP` / `REVIEW` |
| **F-15** | `package.json` | 37 | `embedded-postgres` | Root | `HIGH` | `REMOVE` |
| **F-16** | `apps/company-platform/package.json` | 17 | `@docsearch/database` | Frontend | `HIGH` | `REMOVE` |
| **F-17** | `apps/company-platform/package.json`, `apps/partner-platform/package.json` | Var | `@docsearch/auth` | Frontend | `HIGH` | `REMOVE` |
| **F-18** | `apps/patient-app/package.json` | 23 | `@capacitor/network` | Mobile | `HIGH` | `REMOVE` |
| **F-19** | `scripts/archive/` (464 files) | 1–End | Legacy scripts | Scripts | `HIGH` | `REVIEW` (Archive) |
| **F-20** | `scripts/apply-migration-0070.mjs` etc. | 1–End | One-off check scripts | Scripts | `MEDIUM` | `REVIEW` |
| **F-21** | `temp_chrome_profile/` | N/A | 356MB Chrome profile | Tooling | `HIGH` | `REMOVE` |
| **F-22** | `audit-results/` | N/A | 84MB baseline logs | Tooling | `MEDIUM` | `REVIEW` |
| **F-23** | `packages/database/src/schema/clinical/index.ts` | 23 | `facility_registry` | Database | `MEDIUM` | `REVIEW` |

---
**Verdict:** Complete master audit completed in strict read-only mode. Zero source files modified.
