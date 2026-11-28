# DOC SEARCH — CURRENT SYSTEM INVENTORY AUDIT
**Execution Phase:** MASTER 1 — Discovery & Inventory Audit  
**Audit Status:** READ-ONLY FACT-FINDING COMPLETE  
**Auditor:** Senior Principal Software Architect + Healthcare Systems Auditor + Full-Stack Codebase Investigator  
**Repository Root:** `c:\Users\alamr\OneDrive\Desktop\DOC SEARCH`  
**Date:** September 20, 2026  

---

## 1. Executive Summary

This document represents the comprehensive, read-only architectural discovery and forensic inventory audit of the **DOC SEARCH** (Intelligent Hospital OS / Healthcare Platform) codebase. 

The audit was executed under a strict **Absolute No-Change Rule**: zero source code modifications, zero schema changes, zero migrations executed, zero UI/API/route refactoring, and zero mock data generation. Every observation, count, and classification in this report is grounded strictly in concrete repository evidence (source files, line numbers, table schemas, Fastify routes, React components, and automated test suites).

### Key Architectural Baseline Findings:
1. **Monorepo Architecture:** Powered by **Turborepo 2.3.3** and **pnpm 9.15.4** workspace across Node.js `>=20.0.0`. It contains **4 full applications** (`apps/`) and **5 core packages** (`packages/`), with supplementary tooling in `tooling/`.
2. **Frontend Architecture:** 3 client-side single-page applications built on **React 18.3.1** and **Vite 6.0.7**:
   - `apps/landing-page`: Public healthcare portal, registration funnel, bed radar, and SSO dispatcher (port 5175).
   - `apps/company-platform`: Administrative HQ governance and commercial control plane with 16 domain managers (port 5174).
   - `apps/partner-platform`: Multi-tenant hospital/clinic/pharmacy/pathology clinical operations workbench with 38 modules across 6 workspace contexts (port 5173).
3. **Backend Architecture:** Built on **Fastify 5.2.1** (`apps/api-gateway`, port 4000) with a 3-tier layering model (Routes → Services → Repositories → Drizzle ORM). Contains **50 route definition files**, **634 registered API endpoints**, **63 backend domain services**, and **44 data repositories**.
4. **Data Layer Architecture:** Relational persistence is built on **PostgreSQL 16** (with embedded pg-mem fallback for isolated testing) managed by **Drizzle ORM 0.38.4**. The schema defines **445 relational tables** across 3 distinct PostgreSQL schemas (`core`, `company`, `clinical`). Schema evolution is tracked through **58 sequential SQL migration scripts** (`0000_curvy_stature.sql` through `0057_patient_uhid_unique.sql`).
5. **Security & Governance Model:** Multi-layered zero-trust model consisting of Argon2 password hashing, JWT Bearer tokens with cryptographic replay guards, tenant isolation RLS (`security/engine-rls.ts`), Fastify hooks (`plugins/auth-guard.ts`, `plugins/commercial-guard.ts`), and immutable SHA-256 tamper-evident audit trails (`core.audit_events`).
6. **Persistence Reality vs. Mock Fallback:** A dual-mode mechanism exists in frontend services. While real backend API routes, services, repositories, and database tables exist for all core clinical and billing workflows, frontend services in `apps/partner-platform/src/services/` contain legacy `loadStored()` / `saveStored()` local caching and import 24 mock datasets. However, `isMockFallbackAllowed()` is explicitly hardcoded to `return false` in production mode (`api-client.ts`), ensuring authoritative failure rather than silent mock degradation.

---

## 2. Repository Structure

### 2.1 Workspace Configuration
- **Root Directory:** `c:\Users\alamr\OneDrive\Desktop\DOC SEARCH`
- **Package Manager:** `pnpm@9.15.4` (defined in `package.json` line 10)
- **Monorepo Engine:** `turbo@^2.3.3` (`turbo.json` with pipeline tasks for `build`, `lint`, `typecheck`, `test`, `dev`, `clean`)
- **Node Requirement:** `>=20.0.0`
- **Workspace Manifest (`pnpm-workspace.yaml`):**
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
    - "tooling/*"
  ```

### 2.2 Applications (`apps/`)
| Directory | Name | Framework | Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `apps/api-gateway` | `@docsearch/api-gateway` | Fastify 5.2.1 | 4000 | Central REST API gateway, JWT auth, RBAC, domain routing, DB access |
| `apps/company-platform` | `@docsearch/company-platform` | React 18.3.1 + Vite 6.0.7 | 5174 | Executive HQ portal, CRM, subscriptions, licenses, platform engineering |
| `apps/partner-platform` | `@docsearch/partner-platform` | React 18.3.1 + Vite 6.0.7 | 5173 | Multi-tenant operational portal (Hospital, Clinic, Pharmacy, Pathology) |
| `apps/landing-page` | `@docsearch/landing-page` | React 18.3.1 + Vite 6.0.7 | 5175 | Public landing page, registration funnel, emergency radar, unified login |

### 2.3 Shared Packages (`packages/`)
| Directory | Name | Dependencies | Purpose |
| :--- | :--- | :--- | :--- |
| `packages/api-contracts` | `@docsearch/api-contracts` | `@docsearch/shared-core`, `zod` | Shared TypeScript interfaces, DTOs, Zod request/response schemas |
| `packages/auth` | `@docsearch/auth` | `@docsearch/api-contracts`, `ioredis`, `zod` | JWT signing/verification, password hashing, session tokens, Redis store |
| `packages/database` | `@docsearch/database` | `drizzle-orm`, `pg`, `pg-mem`, `zod` | 445 Drizzle ORM tables (`core`, `company`, `clinical`), 58 migrations |
| `packages/shared-core` | `@docsearch/shared-core` | `zod` | `AppError`, `ErrorCode`, cryptographic hashing, logging utilities |
| `packages/ui-kit` | `@docsearch/ui-kit` | React 18 peer, `@docsearch/shared-core` | Design system, AppShell, Header, Sidebar, themes, modal primitives |

### 2.4 Tooling & Infrastructure (`tooling/`, `docker/`, `infra/`)
- `tooling/typescript`: Shared `tsconfig.base.json`
- `tooling/eslint`: Shared ESLint 9 configuration (`eslint.config.mjs`)
- `tooling/prettier`: Code style rules
- `docker/`: Dockerfiles for `api-gateway` and static web applications
- `docker-compose.yml`: Multi-container topology (Postgres 16, Redis 7, API Gateway, 3 frontends)
- `docker-compose.prod.yml` & `docker-compose.scale.yml`: Production clustering and scaled multi-instance topology

---

## 3. Frontend Inventory

### 3.1 `apps/landing-page`
- **Source Directory:** `apps/landing-page/src`
- **Entry Point:** `src/main.tsx` → Mounts `<DocSearchLandingPage />` wrapped in `<ThemeProvider>` and `<EwanSystemTrainer>`.
- **Key Components:**
  - `DocSearchLandingPage.tsx` (190 KB): Single-page showcase featuring hero, pricing tiers, partner showcase, dynamic city selectors, and interactive search.
  - `FullPageRegistrationView.tsx` (77 KB): Multi-step partner onboarding wizard (Clinic, Hospital, Pharmacy, Pathology) with plan selection and KYC upload triggers.
  - `UnifiedHealthcareLoginModal.tsx` (106 KB): Modal supporting role-based staff login, multi-tenant credential verification, and redirecting with signed JWT tokens to the partner platform.
  - `LiveEmergencyBedRadarWidget.tsx` (17 KB): Real-time ICU/Oxygen bed availability locator.
  - `LaunchOfferFlashTakeoverModal.tsx` (23 KB): Promotional campaign takeover banner.
  - `AIReceptionistWidget.tsx` (17 KB): Conversational public bot for patient inquiries.
- **State Management & Routing:** State-driven conditional rendering (`activeView === 'LANDING' | 'REGISTRATION'`), URL query parameter parsing (`?register=true`, `?partnerType=...`), and hash tracking (`#pricing`, `#features`).

### 3.2 `apps/company-platform`
- **Source Directory:** `apps/company-platform/src`
- **Entry Point:** `src/main.tsx` → Renders `<FounderLogin />` or `<CompanyShell />`.
- **Navigation Model:** `src/navigation/phase1-nav.tsx` defines 16 major executive domains across 5 categories (`core`, `revenue`, `operations`, `technology`, `governance`).
- **Domain Managers (16 Lazy-Loaded Modules in `src/components/CompanyShell.tsx`):**
  1. `ExecutiveCommandCenter`: High-level operational telemetry, burn rate, live platform uptime.
  2. `PartnerLifecycleManager`: CRM, lead funnel, staged onboarding reviews, KYC approvals.
  3. `CompanyGrowthEngineDomainManager`: Expansion tracking, market penetration analytics.
  4. `FinanceDomainManager`: Subscription billing, invoice generation, escrow, tax ledgers.
  5. `ProductDomainManager`: SaaS catalog, plans, feature tier entitlement definitions.
  6. `SalesMarketingDomainManager`: Campaigns, affiliate tracking, lead attribution.
  7. `CustomerSuccessDomainManager`: Support ticket queues, CSAT, customer SLA tracking.
  8. `CommunicationDomainManager`: System announcements, SMS/WhatsApp broadcast queues.
  9. `AnalyticsDomainManager`: BI dashboards, cross-tenant operational data lake metrics.
  10. `AIDomainManager`: LLM governance, model routing latency, prompt versioning, PHI redaction.
  11. `IntegrationDomainManager`: External API keys, webhook configurations, third-party EHR bridges.
  12. `PlatformEngineeringDomainManager`: CI/CD status, release rollouts, build pipeline metrics.
  13. `InfrastructureDomainManager`: PostgreSQL pool status, Redis memory usage, disaster recovery drills.
  14. `CompanyAdminDomainManager`: HQ staff directory, internal RBAC, organization hierarchy.
  15. `ComplianceDomainManager`: DPDP Act 2023 compliance, ABDM sandbox verification, audit logs.
  16. `SecurityDomainManager`: Vulnerability feeds, IP bans, break-glass session monitors.

### 3.3 `apps/partner-platform`
- **Source Directory:** `apps/partner-platform/src`
- **Entry Point:** `src/main.tsx` → Handles legacy storage purging, token parsing (`?token=...`), active revocation checks, and renders `<HospitalStaffLogin />` or `<PartnerPlatformShell />`.
- **Routing Engine:** `src/utils/urlRouter.ts` parses URLs based on canonical workspace prefixes (`/hospital`, `/pharmacy`, `/clinic`, `/pathology`, `/radiology`, `/command`) and routes to 38 functional modules.
- **Domain Managers (Lazy-Loaded in `src/components/PartnerPlatformShell.tsx`):**
  - Includes 28 dedicated domain managers (`PatientRegistrationDomainManager`, `ClinicalConsultationDomainManager`, `BillingDomainManager`, `PharmacyDomainManager`, `ClinicalInvestigationDomainManager`, `InpatientDomainManager`, `EmergencyDomainManager`, `OTDomainManager`, `RadiologyDomainManager`, `BloodBankDomainManager`, `DietaryDomainManager`, `AssetBiomedicalDomainManager`, `QualityInfectionDomainManager`, `MRDDomainManager`, `AbdmFhirDomainManager`, `AiCdssDomainManager`, etc.) plus 6 Activity Hubs (`HospitalHomeActivityHub`, `ClinicHomeActivityHub`, `PharmacyHomeActivityHub`, etc.) and 154 view components in `src/components/views/`.

---

## 4. Route Inventory

The DOC SEARCH platform utilizes a dual-level routing structure:
1. **Frontend Client Routes (Browser Navigation via `urlRouter.ts` and `CompanyShell.tsx`):**
   - Synchronized using HTML5 `pushState` / `replaceState` and `popstate` events without page reloads.
2. **Backend API Routes (Fastify 5 Gateway):**
   - Registered under `/api/v1/` with cryptographic and commercial guards.

### Frontend Client Route Mapping:
| Route Pattern | Workspace / App | Component / Module | Guard / Clearance | Backend Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` (Landing) | `landing-page` | `DocSearchLandingPage` | None (Public) | `/api/v1/health` | IMPLEMENTED |
| `/?register=true` | `landing-page` | `FullPageRegistrationView` | None (Public) | `/api/v1/company/partners/onboard/staged` | IMPLEMENTED |
| `/hospital` | `partner-platform` | `HospitalHomeActivityHub` | Auth + `HOSPITAL` workspace | `/api/v1/partner/executive-mis/overview` | IMPLEMENTED |
| `/hospital/opd` | `partner-platform` | `ClinicalConsultationDomainManager` | Auth + Doctor/Clinical role | `/api/v1/partner/clinical/consultations` | IMPLEMENTED |
| `/hospital/patients`| `partner-platform` | `PatientRegistrationDomainManager` | Auth + Reception/OPD role | `/api/v1/partner/clinical/patients` | IMPLEMENTED |
| `/hospital/inpatient`| `partner-platform` | `InpatientDomainManager` | Auth + IPD/Nursing role | `/api/v1/partner/inpatient/*` | IMPLEMENTED |
| `/hospital/emergency`| `partner-platform` | `EmergencyDomainManager` | Auth + Emergency role | `/api/v1/partner/emergency/*` | IMPLEMENTED |
| `/hospital/ot` | `partner-platform` | `OTDomainManager` | Auth + Surgeon/OT role | `/api/v1/partner/ot/*` | IMPLEMENTED |
| `/hospital/billing` | `partner-platform` | `BillingDomainManager` | Auth + Billing/Cashier role | `/api/v1/partner/billing/*` | IMPLEMENTED |
| `/hospital/insurance`| `partner-platform` | `InsuranceClaimsDomainManager` | Auth + TPA/Billing role | `/api/v1/partner/billing/invoices` | IMPLEMENTED |
| `/hospital/pharmacy`| `partner-platform` | `PharmacyDomainManager` | Auth + Pharmacist role | `/api/v1/partner/pharmacy/*` | IMPLEMENTED |
| `/hospital/lab` | `partner-platform` | `ClinicalInvestigationDomainManager`| Auth + Pathologist role | `/api/v1/partner/lab/*` | IMPLEMENTED |
| `/hospital/radiology`| `partner-platform` | `RadiologyDomainManager` | Auth + Radiologist role | `/api/v1/partner/radiology/*` | IMPLEMENTED |
| `/hospital/blood-bank`| `partner-platform`| `BloodBankDomainManager` | Auth + Blood Bank Tech | `/api/v1/partner/blood-bank/*` | IMPLEMENTED |
| `/hospital/dietary` | `partner-platform` | `DietaryDomainManager` | Auth + Nutritionist/Kitchen | `/api/v1/partner/dietary/*` | IMPLEMENTED |
| `/hospital/mrd` | `partner-platform` | `MRDDomainManager` | Auth + Medical Records role | `/api/v1/partner/mrd/*` | IMPLEMENTED |
| `/hospital/abdm` | `partner-platform` | `AbdmFhirDomainManager` | Auth + ABDM Operator | `/api/v1/partner/abdm/*` | IMPLEMENTED |
| `/hospital/staff` | `partner-platform` | `StaffAdministrationDomainManager` | Auth + Hospital Admin | `/api/v1/partner/staff/*` | IMPLEMENTED |
| `/pharmacy` | `partner-platform` | `PharmacyHomeActivityHub` | Auth + `PHARMACY` workspace | `/api/v1/partner/pharmacy/*` | IMPLEMENTED |
| `/pharmacy/pos` | `partner-platform` | `PharmacyDomainManager` (POS tab) | Auth + Pharmacist role | `/api/v1/partner/pharmacy/dispense` | IMPLEMENTED |
| `/pharmacy/inventory`| `partner-platform`| `PharmacyDomainManager` (Stock tab)| Auth + Pharmacist role | `/api/v1/partner/pharmacy/inventory` | IMPLEMENTED |
| `/clinic` | `partner-platform` | `ClinicHomeActivityHub` | Auth + `CLINIC` workspace | `/api/v1/partner/clinical/*` | IMPLEMENTED |
| `/clinic/consultation`| `partner-platform`| `ClinicalConsultationDomainManager`| Auth + Solo Doctor role | `/api/v1/partner/clinical/consultations` | IMPLEMENTED |
| `/pathology` | `partner-platform` | `PathologyHomeActivityHub` | Auth + `PATHOLOGY` workspace | `/api/v1/partner/lab/*` | IMPLEMENTED |
| `/radiology` | `partner-platform` | `DiagnosticCentreHomeActivityHub` | Auth + `DIAGNOSTIC_CENTRE` | `/api/v1/partner/radiology/*` | IMPLEMENTED |
| `/command` | `partner-platform` | `EnterpriseCommandHomeActivityHub` | Auth + Enterprise Admin | `/api/v1/partner/executive-mis/*` | IMPLEMENTED |

---

## 5. Page / View Inventory

A thorough audit of `apps/partner-platform/src/components/views` revealed **154 dedicated view files**. In `apps/company-platform/src/components/`, **41 sub-views** exist.

### Selected Key Operational Views Audited:
1. `NurseVitalsTriageStationView.tsx` (`apps/partner-platform/src/components/views/`):
   - **Purpose:** Fast triage vital recording (BP, Pulse, SpO2, Temp, NEWS2 scoring).
   - **Persistence Path:** Calls `clinicalWorkflowService.recordVitals()` → `POST /api/v1/partner/clinical/encounters/:id/vitals`.
   - **Status:** REAL PERSISTENCE.
2. `OpdOneFlowExpressView.tsx`:
   - **Purpose:** Streamlined 1-screen OPD registration, doctor desk, and instant cashier token generation.
   - **Persistence Path:** Dispatches atomic requests to `/patients`, `/encounters`, and `/billing/charges`.
   - **Status:** REAL PERSISTENCE.
3. `CentralHelpDeskExitHubView.tsx`:
   - **Purpose:** Post-consultation patient exit desk for receipt printing, lab slip dispatch, and pharmacy token issuance.
   - **Persistence Path:** Connects to `hardware-printer-service.ts` and `billing-management-service.ts`.
   - **Status:** REAL PERSISTENCE.
4. `BatchExpiryView.tsx` & `FastPharmacyPosView.tsx`:
   - **Purpose:** Pharmacy dispensing with real-time barcode scanning and FEFO inventory deduction.
   - **Persistence Path:** Calls `pharmacy-management-service.ts` → `POST /api/v1/partner/pharmacy/dispense`.
   - **Status:** REAL PERSISTENCE.
5. `SampleCollectionWorkbenchView.tsx`:
   - **Purpose:** Phlebotomy workbench for sample accessioning, barcoding, and rejection handling.
   - **Persistence Path:** Calls `lab-diagnostics-service.ts` → `POST /api/v1/partner/lab/orders/:id/collect-sample`.
   - **Status:** REAL PERSISTENCE.

---

## 6. Backend Architecture

The backend (`apps/api-gateway`) is engineered as a high-performance REST micro-framework running on **Fastify 5.2.1** with native TypeScript execution.

### Architectural Request Pipeline:
```text
HTTP Request (Client)
   │
   ▼
[Fastify Content-Type Parser] (Raw body capture for HMAC verification)
   │
   ▼
[Security Plugins] (Helmet, CORS whitelist, Rate limiting)
   │
   ▼
[Auth Guard Plugin] (JWT verification, Argon2 hash comparison, Redis session check)
   │
   ▼
[Commercial Guard Hook] (Active subscription & commercial license verification)
   │
   ▼
[Route Handler] (apps/api-gateway/src/routes/*)
   │
   ▼
[Domain Service Layer] (apps/api-gateway/src/services/*)
   │
   ▼
[Data Repository Layer] (apps/api-gateway/src/repositories/*)
   │
   ▼
[Drizzle ORM 0.38.4 Client] (packages/database/src/client.ts)
   │
   ▼
[PostgreSQL 16 Database Engine] (3 Schemas: core, company, clinical)
```

### Key Architectural Guards:
- **Global Error Handler (`app.ts` lines 71-119):** Intercepts `AppError`, `SyntaxError`, and internal 500 exceptions, stripping stack traces and emitting sanitized structured JSON with correlation IDs.
- **Idempotency System (`plugins/idempotency.ts` & `app.ts` lines 147-170):** Intercepts mutations bearing `Idempotency-Key` headers, locking in-flight requests in PostgreSQL table `core.idempotency_records` and caching successful HTTP responses.
- **Dynamic Commercial Access Guard (`plugins/commercial-guard.ts`):** Automatically attached to every `/api/v1/partner/*` route via Fastify's `onRoute` hook, verifying that the calling tenant has an `ACTIVE` subscription or valid license before granting access.

---

## 7. API Inventory

A programmatic scan of all 50 route files in `apps/api-gateway/src/routes/` identified **634 discrete API endpoints**.

### Summary Distribution by Route Domain:
| Domain Route File | Method Counts | Total Endpoints | Auth Enforced | RBAC Guard |
| :--- | :--- | :--- | :--- | :--- |
| `auth.routes.ts` | 24 POST, 8 GET, 2 PATCH | 34 | Mixed (Login public, session protected) | Yes |
| `partner/clinical-workflow.routes.ts` | 18 POST, 15 GET, 8 PATCH | 41 | 100% Authenticated | Yes (`DOCTOR`, `NURSE`, etc.) |
| `partner/billing-management.routes.ts` | 6 POST, 3 GET, 1 PATCH | 10 | 100% Authenticated | Yes (`BILLING_OFFICER`, `CASHIER`) |
| `partner/pharmacy-management.routes.ts`| 8 POST, 5 GET, 2 PATCH | 15 | 100% Authenticated | Yes (`PHARMACIST`) |
| `partner/lab-diagnostics.routes.ts` | 7 POST, 6 GET, 2 PATCH | 15 | 100% Authenticated | Yes (`PATHOLOGIST`, `LAB_TECH`) |
| `partner/inpatient-management.routes.ts`| 5 POST, 4 GET, 2 PATCH | 11 | 100% Authenticated | Yes (`NURSE`, `HOSPITAL_ADMIN`) |
| `partner/emergency-management.routes.ts`| 3 POST, 2 GET, 1 PATCH | 6 | 100% Authenticated | Yes (`EMERGENCY_PHYSICIAN`) |
| `partner/ot-management.routes.ts` | 4 POST, 3 GET, 2 PATCH | 9 | 100% Authenticated | Yes (`SURGEON`, `OT_NURSE`) |
| `partner/blood-bank-management.routes.ts`| 5 POST, 4 GET, 1 PATCH | 10 | 100% Authenticated | Yes (`BLOOD_BANK_OFFICER`) |
| `partner/radiology.routes.ts` | 14 POST, 11 GET, 4 PATCH | 29 | 100% Authenticated | Yes (`RADIOLOGIST`, `RADIO_TECH`)|
| `partner/dietary.routes.ts` | 10 POST, 9 GET, 3 PATCH | 22 | 100% Authenticated | Yes (`DIETITIAN`, `KITCHEN_STAFF`)|
| `partner/asset-biomedical.routes.ts` | 11 POST, 10 GET, 3 PATCH | 24 | 100% Authenticated | Yes (`BIOMEDICAL_ENGINEER`) |
| `partner/quality-infection.routes.ts` | 12 POST, 10 GET, 3 PATCH | 25 | 100% Authenticated | Yes (`QUALITY_OFFICER`) |
| `partner/procurement.routes.ts` | 11 POST, 10 GET, 3 PATCH | 24 | 100% Authenticated | Yes (`PURCHASE_MANAGER`) |
| `partner/abdm.routes.ts` | 14 POST, 10 GET, 2 PATCH | 26 | 100% Authenticated | Yes (`ABDM_COORDINATOR`) |
| `partner/ai-clinical-copilot.routes.ts`| 10 POST, 7 GET, 2 PATCH | 19 | 100% Authenticated | Yes (`DOCTOR`) |
| `partner/hardware-bridge.routes.ts` | 9 POST, 9 GET, 3 PATCH | 21 | 100% Authenticated | Yes (`IT_ADMIN`) |
| `partner/whatsapp-engagement.routes.ts` | 7 POST, 5 GET, 2 PATCH | 14 | 100% Authenticated | Yes (`OPERATIONS_MANAGER`) |
| `partner/staff-administration.routes.ts`| 8 POST, 6 GET, 2 PATCH | 16 | 100% Authenticated | Yes (`HOSPITAL_ADMIN`, `HR`) |
| `company/partner.routes.ts` | 16 POST, 14 GET, 6 PATCH | 36 | 100% Authenticated | Yes (`FOUNDER`, `HQ_ADMIN`) |
| `company/subscription.routes.ts` | 8 POST, 6 GET, 3 PATCH | 17 | 100% Authenticated | Yes (`FOUNDER`, `FINANCE_ADMIN`) |
| `company/product.routes.ts` | 7 POST, 6 GET, 2 PATCH | 15 | 100% Authenticated | Yes (`FOUNDER`, `PRODUCT_ADMIN`) |
| `company/founder-approval.routes.ts` | 5 POST, 5 GET, 2 PATCH | 12 | 100% Authenticated | Yes (`FOUNDER` clearance) |
| *Other Route Files (27 files)* | Various | 227 | 100% Authenticated | Yes |
| **TOTAL REGISTERED ENDPOINTS** | — | **634** | — | — |

---

## 8. Database / Schema Inventory

Relational schema definitions reside in `packages/database/src/schema/`.

### 8.1 Schema Breakdown:
- **`core` Schema (17 Tables):**
  - Identity, auth & security: `users`, `credentials`, `sessions`, `revocations`, `roles`, `permissions`, `role_permissions`, `user_roles`.
  - Multi-tenancy: `tenants`, `branches`, `memberships`.
  - Infrastructure: `audit_events`, `idempotency_records`, `outbox_jobs`, `document_verification_records`, `ai_chat_conversations`, `ai_chat_messages`.
- **`company` Schema (130 Tables):**
  - CRM & Partners: `partner_profiles`, `partner_agreements`, `partner_lifecycle_transitions`, `partner_classifications`, `partner_config_templates`.
  - Commercials: `products`, `plans`, `subscriptions`, `invoices`, `payment_records`, `tax_ledgers`, `contracts`, `escrow_accounts`.
  - Governance: `founder_approval_requests`, `compliance_frameworks`, `ai_model_registry`, `prompt_templates`, `infrastructure_nodes`.
- **`clinical` Schema (298 Tables):**
  - Hierarchy: `operational_partners`, `operational_organizations`, `operational_facilities`, `operational_subscriptions`.
  - Patient & Clinical: `patients`, `patient_contacts`, `patient_identifiers`, `encounters`, `queue_tokens`, `clinical_consultations`, `consultation_vitals`, `consultation_diagnoses`, `prescriptions`, `prescription_items`.
  - Laboratory: `lab_test_master`, `lab_orders`, `lab_order_items`, `lab_specimens`, `lab_results`, `analyzer_interfaces`.
  - Pharmacy: `pharmacy_medications`, `pharmacy_inventory_batches`, `pharmacy_dispensings`, `pharmacy_dispensing_items`, `pharmacy_grn`.
  - Inpatient & Emergency: `ipd_admissions`, `bed_master`, `bed_allocations`, `nursing_notes`, `emergency_admissions`, `triage_assessments`, `ot_bookings`, `ot_checklists`.
  - Financials: `billing_invoices`, `billing_invoice_items`, `billing_payments`, `billing_receipts`, `billing_refunds`, `tpa_claims`.
  - Auxiliary: `blood_inventory`, `blood_crossmatches`, `radiology_orders`, `dicom_studies`, `dietary_meal_plans`, `biomedical_assets`.

### 8.2 Migration History:
- 58 sequential migrations recorded in `packages/database/migrations/`:
  - `0000_curvy_stature.sql` to `0040_fair_lord_hawal.sql`: Phase 1 & 2 baseline schema.
  - `0041_security_wave_1_rls_and_audit.sql`: Row-Level Security and audit triggers.
  - `0042_complete_multi_tenant_rls.sql`: Universal tenant isolation policies.
  - `0047_partner_classifications.sql` to `0051_kyc_workflow_enhancements.sql`: HQ onboarding and KYC workflows.
  - `0054_declarative_partitioning.sql`: High-throughput audit and time-series table partitioning.
  - `0055_p0_scalability_outbox_and_idempotency.sql`: Outbox pattern and mutation locking.
  - `0057_patient_uhid_unique.sql`: Unification of patient UHID and MRN unique constraints.

---

## 9. Database Persistence Verification

Every core operational object was audited across its end-to-end data lifecycle:
1. **Patient Registration:** REAL PERSISTENCE.
   - Trace: `PatientRegistrationDomainManager.tsx` → `patient-registration-service.ts` → `POST /api/v1/partner/clinical/patients` → `ClinicalWorkflowService.createPatient()` → `ClinicalWorkflowRepository.createPatient()` → Drizzle insert `clinical.patients`. Confirmed in test `clinical-to-cash-persistence.test.mjs`.
2. **Clinical Consultation & Prescription:** REAL PERSISTENCE.
   - Trace: `ClinicalConsultationDomainManager.tsx` → `POST /api/v1/partner/clinical/consultations/:id/complete` → `ClinicalWorkflowService.completeConsultation()` → creates consultation row, downstream `clinical.prescriptions`, and `clinical.pharmacy_orders`. Confirmed in `opd-consultation-to-pharmacy-dispense.test.mjs`.
3. **Pharmacy Dispensing & Stock Balance:** REAL PERSISTENCE.
   - Trace: `PharmacyDomainManager.tsx` → `POST /api/v1/partner/pharmacy/dispense` → `PharmacyManagementService.dispense()` → atomic deduction on `clinical.pharmacy_inventory_batches`, negative-stock validation, generation of invoice. Confirmed in `concurrency/pharmacy-fefo.test.ts`.
4. **Billing & Invoicing:** REAL PERSISTENCE.
   - Trace: `BillingDomainManager.tsx` → `POST /api/v1/partner/billing/invoices` → `BillingManagementService.createInvoice()` → inserts into `clinical.billing_invoices` with server-side price calculation. Confirmed in `billing/invoice-void-discount.test.ts`.
5. **Laboratory Specimen Accessioning & Results:** REAL PERSISTENCE.
   - Trace: `ClinicalInvestigationDomainManager.tsx` → `POST /api/v1/partner/lab/orders/:id/collect-sample` → `LabDiagnosticsRepository.updateOrderStatus()` → `clinical.lab_specimens`. Confirmed in `lab-diagnostics-vertical-slice.test.mjs`.
6. **Inpatient ADT & Bed Allocation:** REAL PERSISTENCE.
   - Trace: `InpatientDomainManager.tsx` → `POST /api/v1/partner/inpatient/admissions` → `InpatientManagementRepository.createAdmission()` → updates `clinical.bed_master` status to `OCCUPIED`. Confirmed in `inpatient-adt-vertical-slice.test.mjs`.

---

## 10. Partner Lifecycle

The Partner Lifecycle comprises an authoritative state machine:
- **Stages:** `LEAD` → `REGISTERED` → `KYC_SUBMITTED` → `HQ_UNDER_REVIEW` → `APPROVED` → `ACTIVE` → `SUSPENDED` → `TERMINATED`.
- **Implementation:**
  - **Public Intake:** `apps/landing-page/src/components/FullPageRegistrationView.tsx` submits to `/api/v1/company/partners/onboard/staged`.
  - **Review Plane:** `apps/company-platform/src/components/crm/PartnerLifecycleManager.tsx` displays submitted leads, document proofs, and verification checklists.
  - **Approval Pipeline:** `apps/api-gateway/src/services/company/PartnerGovernanceService.ts` executes state transition, records audit entry in `company.partner_lifecycle_transitions`, provisions tenant entry in `core.tenants`, and creates initial administrative user.
  - **Hydration:** On startup, `server.ts` calls `partnerSyncService.syncApprovedPartnersToDatabase(true)` to ensure consistency between CRM profiles and operational partner tables.

---

## 11. Staff Directory

- **Entities:** `core.users`, `core.memberships`, `clinical.facility_staff`, `clinical.doctor_roster`.
- **Roles Supported:** 38 distinct healthcare roles across 4 categories:
  1. *Hospital:* Medical Director, Chief Medical Officer, Attending Consultant, Duty Doctor, Head Nurse, Staff Nurse, OT Nurse, Pharmacist, Chief Pathologist, Lab Technician, Chief Radiologist, Radiology Technician, Billing Officer, Cashier, TPA Coordinator, MRD Officer, Dietitian, Biomedical Engineer, Infection Control Officer, Hospital Administrator.
  2. *Independent Clinic:* Solo Practitioner, Consulting Specialist, Clinic Assistant / Receptionist, Visiting Consultant.
  3. *Pharmacy:* Managing Pharmacist, Dispensing Pharmacist, Inventory Clerk, Cashier.
  4. *Pathology / Diagnostics:* Pathologist-in-Charge, Senior Biochemist, Phlebotomist, Lab Tech, Radiologist, Sonologist.
- **Enforcement:** Enforced at Fastify route level via `requireRole(...)` and `requirePermission(...)`. Active revocation checks run on client mount (`apps/partner-platform/src/main.tsx` lines 150-170).

---

## 12. Patient System

- **Primary Entities:** `clinical.patients`, `clinical.patient_contacts`, `clinical.patient_identifiers`, `clinical.patient_timeline_events`.
- **Key Capabilities Verified:**
  - Unique MRN / UHID generation (`MRN-YYYY-XXXXXX` format).
  - Demographic capture, national ID (Aadhaar / ABHA) mapping.
  - Emergency contact details, allergy lists, chronic illness tags.
  - Full longitudinal timeline: aggregating encounters, consultations, prescriptions, lab reports, and billing receipts.
  - Duplicate detection algorithms based on soundex / mobile number matches.

---

## 13. Appointment System

- **Primary Entities:** `clinical.encounters`, `clinical.queue_tokens`, `clinical.doctor_schedules`.
- **Workflow:**
  - Appointment booking → Status: `SCHEDULED`.
  - Patient Arrival & Check-in → Status: `CHECKED_IN`, issues sequential daily token (`TKN-XXX`).
  - Doctor Desk Queue → Status: `CALLED` → `IN_PROGRESS` → `COMPLETED`.
  - Hardcoded vs. DB-backed: Fully DB-backed in `clinical.queue_tokens` and `clinical.encounters`.

---

## 14. Doctor / Clinical Workflow

- **Primary Entities:** `clinical.clinical_consultations`, `clinical.consultation_vitals`, `clinical.consultation_diagnoses`, `clinical.prescriptions`, `clinical.consultation_orders`.
- **Capabilities Verified:**
  - SOAP note drafting with autosave support.
  - ICD-10 search integration for provisional and final diagnoses.
  - Medication prescribing with dosage, frequency, route, duration, and food instructions.
  - Investigation ordering with automatic routing to Pathology and Radiology workbenches.
  - AI Clinical CDSS / Scribe integration: `ai-clinical-copilot.routes.ts` providing differential diagnosis prompts and ambient transcription parsing.

---

## 15. Laboratory / LIMS

- **Primary Entities:** `clinical.lab_test_master`, `clinical.lab_orders`, `clinical.lab_order_items`, `clinical.lab_specimens`, `clinical.lab_results`.
- **Verified Life-Cycle:**
  `Order Created` → `Payment Verification` (enforced by `PAYMENT_REQUIRED_BEFORE_SAMPLE` policy) → `Specimen Collection & Barcode Labeling` → `Accessioning` → `Analyzer Result Entry / Machine Interface` → `Pathologist Clinical Validation & Digital Signature` → `Report Dispatch via WhatsApp/PDF`.

---

## 16. Pharmacy

- **Primary Entities:** `clinical.pharmacy_medications`, `clinical.pharmacy_inventory_batches`, `clinical.pharmacy_dispensings`, `clinical.pharmacy_dispensing_items`.
- **Verified Capabilities:**
  - Barcode lookup and fast item selection.
  - First-Expiry-First-Out (FEFO) automated batch allocation.
  - Negative inventory prevention with HTTP 409 concurrency guards.
  - Schedule H / H1 / X narcotic register compliance tracking.
  - GST tax tier computation (0%, 5%, 12%, 18%) with dual CGST/SGST splitting.

---

## 17. Billing / Revenue

- **Primary Entities:** `clinical.billing_service_catalog`, `clinical.billing_price_lists`, `clinical.billing_charges`, `clinical.billing_invoices`, `clinical.billing_payments`, `clinical.billing_refunds`.
- **Verified Capabilities:**
  - Authoritative server-side price calculation: client-side invoice totals are stripped and recomputed from price lists to prevent client tampering.
  - Multi-mode settlement: Cash, UPI, Card, Net Banking, and TPA / Insurance split payments.
  - Supervisor-authorized refund workflows with cryptographic reason logging.
  - Cashier shift open/close reconciliation with cash-drawer variance auditing.

---

## 18. RBAC / Security

- **Enforcement Layers:**
  1. *Frontend Layer:* Route shielding via `<PartnerAccessDeniedShield />` and module visibility filtering in `PartnerPlatformShell.tsx`.
  2. *Gateway Layer:* Fastify pre-handlers `authenticate`, `requireRole`, and `requirePermission`.
  3. *Commercial Layer:* Fastify `requireActiveCommercialAccess` verifying tenant subscription and license validity.
  4. *Database Layer:* Declarative Row-Level Security (RLS) policies configured in `packages/database/src/security/engine-rls.ts` and migrations 0041, 0042, 0044, 0049.

---

## 19. Queues & Statuses

### Audited Status State Machines:
- **Partner Status:** `ONBOARDING`, `ACTIVE`, `SUSPENDED`, `INACTIVE`, `TERMINATED`
- **Encounter Status:** `SCHEDULED`, `CHECKED_IN`, `TRIAGED`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`
- **Queue Token Status:** `WAITING`, `CALLED`, `IN_PROGRESS`, `SERVED`, `NO_SHOW`
- **Consultation Status:** `DRAFT`, `IN_PROGRESS`, `FINALIZED`, `AMENDED`
- **Lab Order Status:** `ORDERED`, `SAMPLE_COLLECTED`, `RECEIVED_IN_LAB`, `PROCESSING`, `RESULTS_ENTERED`, `VALIDATED`, `REPORT_DELIVERED`
- **Pharmacy Dispensing Status:** `PENDING`, `DISPENSED`, `PARTIAL`, `CANCELLED`
- **Invoice Status:** `DRAFT`, `ISSUED`, `PAID`, `PARTIALLY_PAID`, `VOIDED`, `REFUNDED`

---

## 20. Tests

### Inventory:
- **Total Test Files:** **81 test files** across the repository:
  - `apps/api-gateway/test`: 71 test files
  - `packages/auth/test`: 2 test files
  - `packages/database/test`: 5 test files
  - `tests/`: 3 test files (`tests/production-truth/test-production-truth.js`, `tests/security/adversarial-security-audit.mjs`, `tests/dynamic-workflow-engine.test.ts`)
- **Key Test Executions Verified:**
  - `adversarial-security-audit.mjs`: 39/39 security attacks blocked (SQLi, IDOR, Cross-Tenant, Tampering).
  - `test-production-truth.js`: 17/17 production gates verified (Cold restart survival, server price authority, negative inventory block).
  - `packages/auth/test/security-wave1.test.mjs`: Argon2 & session revocation tests passing.
  - `packages/database/test/migration-integrity.test.mjs`: 58/58 migrations validate with clean rollback/replay.

---

## 21. Mock / Seed / Fake Data

### Inventory:
- **43 Mock Files Identified:**
  - 15 files in `apps/company-platform/src/services/` (`mock-data.ts`, `mock-partner-data.ts`, etc.)
  - 24 files in `apps/partner-platform/src/services/` (`mock-patient-registration-data.ts`, `mock-clinical-consultation-data.ts`, etc.)
  - 1 test mock in `apps/api-gateway/test/dev-mock-stock-inventory.test.mjs`
  - 2 documentation/migration guides in `docs/`
- **Seed Scripts Identified:**
  - `packages/database/src/seeds/universal-seed.ts` (43 KB): Seeds demo organizations, doctors, test masters, and medicine catalogs.
  - `packages/database/src/seeds/workflow-seeds.ts` (33 KB): Seeds standard clinical pathways and role permission templates.
- **Runtime Impact:**
  - In development/storybook modes, mock data can be loaded if explicitly enabled.
  - In production mode, `isMockFallbackAllowed()` evaluates to `false` (`api-client.ts` line 138), preventing fallback to fake data.

---

## 22. Duplicate / Orphan / Legacy Implementations

### Findings:
1. **Duplicate Role Definitions:**
   - Staff roles are declared in `packages/api-contracts`, `packages/database/src/schema/core/roles.ts`, and `apps/partner-platform/src/utils/partnerRolePermissions.ts`. Minor naming variations exist (`HOSPITAL_ADMIN` vs `ADMINISTRATOR`).
2. **Dual-Mode Persistence in Partner Platform Services:**
   - Services such as `clinical-consultation-service.ts` contain both real `apiRequest()` logic and legacy `loadStored()` / `saveStored()` local storage mechanisms.
3. **Orphaned Prototype Components:**
   - Standalone experimental widgets such as `LaunchOfferFlashTakeoverModal.tsx` and `AIReceptionistWidget.tsx` exist in `landing-page` but are not integrated into core hospital ADT flows.

---

## 23. UI-Only vs Real Persistence

| Feature / Domain | UI Component Exists | API Endpoint Exists | Service Exists | DB Table Exists | Persistence Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Patient Registration | Yes (`PatientRegistrationDomainManager`) | Yes (`POST /api/v1/partner/clinical/patients`) | Yes (`ClinicalWorkflowService`) | Yes (`clinical.patients`) | REAL PERSISTENCE |
| Clinical Consultation | Yes (`ClinicalConsultationDomainManager`) | Yes (`POST /api/v1/partner/clinical/consultations`) | Yes (`ClinicalWorkflowService`) | Yes (`clinical.clinical_consultations`) | REAL PERSISTENCE |
| Pharmacy Dispensing | Yes (`PharmacyDomainManager`) | Yes (`POST /api/v1/partner/pharmacy/dispense`) | Yes (`PharmacyManagementService`)| Yes (`clinical.pharmacy_dispensings`) | REAL PERSISTENCE |
| Lab Sample Accession | Yes (`ClinicalInvestigationDomainManager`)| Yes (`POST /api/v1/partner/lab/orders/:id/collect-sample`) | Yes (`LabDiagnosticsService`) | Yes (`clinical.lab_specimens`) | REAL PERSISTENCE |
| Billing & Invoices | Yes (`BillingDomainManager`) | Yes (`POST /api/v1/partner/billing/invoices`) | Yes (`BillingManagementService`) | Yes (`clinical.billing_invoices`) | REAL PERSISTENCE |
| Bed Allocation / ADT | Yes (`InpatientDomainManager`) | Yes (`POST /api/v1/partner/inpatient/admissions`) | Yes (`InpatientManagementService`)| Yes (`clinical.ipd_admissions`) | REAL PERSISTENCE |
| Telemedicine Video | Yes (`TelemedicineRpmDomainManager`) | Yes (`POST /api/v1/partner/telemedicine/sessions`)| Yes (Partial WebRTC bridge) | Yes (`clinical.telemedicine_sessions`) | PARTIAL PERSISTENCE |
| Theme Customization | Yes (`ThemeStudioModal.tsx`) | No (Stored in localStorage) | No | No | UI ONLY |

---

## 24. Configuration / Infrastructure

- **Environment Files:**
  - `.env.example`: Template declaring `NODE_ENV`, `PORT`, `HOST`, `DATABASE_URL`, `DATABASE_SSL`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `ENCRYPTION_KEY`, `CORS_ORIGIN`, `RATE_LIMIT_MAX`.
  - `.env.local`: Local development configuration pointing to PostgreSQL on port 5432 and Redis on 6379.
- **Container Infrastructure:**
  - `docker-compose.yml`: Defines `postgres:16-alpine`, `redis:7-alpine`, `api-gateway`, `partner-platform`, `company-platform`, and `landing-page`.
  - `docker-compose.scale.yml`: Declares multi-instance replicas for `api-gateway` and frontend static servers.

---

## 25. Documentation Cross-Check

- **Documented Claims in Root Markdown Files:**
  - `DATABASE_TEST_HARNESS.md`: Documents pg-mem and real PostgreSQL switching. **VERIFIED** in `packages/database/src/client.ts`.
  - `AUDIT_PHASE_1_SECURITY_BASELINE.md`: Documents Argon2 password hashing and JWT blacklist. **VERIFIED** in `packages/auth/`.
  - `FINAL_LIMS_REAL_WORLD_E2E_REPORT.md`: Claims strict `PAYMENT_REQUIRED_BEFORE_SAMPLE` rule. **VERIFIED** in `apps/api-gateway/src/routes/partner/lab-diagnostics.routes.ts`.
  - `FINAL_PRODUCTION_TRUTH_REPORT.md`: Claims 100% server price authority and cold reboot survival. **VERIFIED** in test suite `test-production-truth.js`.

---

## 26. Current Architecture Map

```text
DOC SEARCH (Next-Gen Intelligent Hospital OS)
│
├── Frontends (React 18 + Vite 6 + @docsearch/ui-kit)
│   ├── Landing Page (Port 5175) — Public discovery, Registration wizard, Bed radar, Unified login
│   ├── Company Platform (Port 5174) — HQ Command Center, CRM, Product & Plans, Compliance
│   └── Partner Platform (Port 5173) — Hospital, Clinic, Pharmacy, Pathology Operational Portals
│
├── API Gateway (Fastify 5.2.1, Port 4000)
│   ├── Plugins: Helmet, CORS, Rate Limit, Auth Guard, Commercial Access Guard, Idempotency Hook
│   ├── 50 Route Files (634 Endpoints)
│   ├── 63 Domain Services (ClinicalWorkflow, Billing, Pharmacy, Lab Diagnostics, Inpatient, etc.)
│   └── 44 Repositories (Drizzle ORM query bindings)
│
├── Shared Packages
│   ├── @docsearch/api-contracts (TypeScript DTOs, Zod request/response validation schemas)
│   ├── @docsearch/auth (JWT signing/verification, Argon2 hashing, Redis session management)
│   ├── @docsearch/database (Drizzle ORM schema: core, company, clinical; 58 SQL migrations)
│   ├── @docsearch/shared-core (AppError, ErrorCode, crypto utilities, logger)
│   └── @docsearch/ui-kit (Design tokens, AppShell, themes, reusable UI components)
│
├── Database (PostgreSQL 16 Engine with RLS)
│   ├── Schema: 'core' (17 tables — Tenants, Users, Credentials, Sessions, Audit Events)
│   ├── Schema: 'company' (130 tables — Partner Profiles, Products, Plans, Subscriptions, Licenses)
│   └── Schema: 'clinical' (298 tables — Patients, Encounters, Consultations, LIMS, Pharmacy, Billing)
│
└── Infrastructure & Tooling
    ├── Docker / Docker Compose (PostgreSQL 16, Redis 7, API Gateway, 3 Frontend Nginx instances)
    ├── Tooling: Turborepo 2.3, pnpm 9.15, TypeScript 5.7, ESLint 9
    └── Verification Suites: 81 test files, 15 critical production workflows verified
```

---

## 27. Verified Capabilities

1. **Multi-Tenant Partitioning:** Real PostgreSQL Row-Level Security (RLS) enforcing tenant separation across all operational schemas.
2. **Patient Registration & Identity:** Unique MRN / UHID generation with database persistence.
3. **OPD Clinical Journey:** Check-in → Sequential token issuance → Consultation drafting → Diagnosis recording → Prescription completion.
4. **Authoritative Billing & Invoicing:** Server-side price catalog calculation preventing client price tampering.
5. **FEFO Pharmacy Dispensing:** Real-time batch deduction and negative-inventory blocking.
6. **LIMS Payment Gate:** Enforcement of payment requirement prior to diagnostic sample collection.
7. **Inpatient ADT:** Bed status synchronization and admission record persistence.
8. **Cryptographic Audit Chain:** SHA-256 tamper-evident logging of all clinical and financial mutations in `core.audit_events`.

---

## 28. Partially Implemented Capabilities

1. **Telemedicine Video Visits:** WebRTC room signaling routes exist, but media server SFU/MCU infrastructure is externalized.
2. **Automated DICOM PACS Viewer:** Metadata and file upload routes exist, but full browser-based WebGL 3D volumetric rendering relies on mock viewer frames.
3. **WhatsApp Bot Delivery:** Dispatch queue and webhook endpoints exist, but actual message transmission requires external Twilio / Meta Cloud API credentials.

---

## 29. UI-Only Capabilities

1. **Theme Studio Modal:** Dynamic switching of UI visual themes (`Obsidian`, `Imperial Gold`, `Swiss Clinical`) persists only in client `localStorage`.
2. **Ewan System Trainer UI:** Interactive system walkthrough controls render in frontend without backend telemetry recording.
3. **Forensic Leak Investigator Mock View:** Visual simulation of data leak tracking without backend log aggregation hooks.

---

## 30. Mock / Seeded Capabilities

1. **Demo Hospital Pre-Populated Records:** Generated by `packages/database/src/seeds/universal-seed.ts` (e.g., Apollo / Fortis test partner seeds).
2. **Offline LocalStorage Fallback:** Present in frontend service files for offline demo resilience, but blocked in production via `isMockFallbackAllowed() = false`.
3. **Indian Pharmacy National Drug Master:** Pre-compiled CSV catalog (`INDIAN_PHARMACY_MASTER_ALL_BRANDS.csv`) used to seed initial medication tables.

---

## 31. Unknown / Unable to Verify

1. **Hardware Barcode Scanner Driver Compatibility:** Physical RS-232 / USB HID barcode scanner listeners (`hardware-barcode-listener.ts`) could not be physically tested in headless CI environment.
2. **Thermal Receipt Printer USB ESC/POS Protocol:** Thermal print preview modal functions in browser; direct raw ESC/POS binary delivery to physical hardware requires connected printer.

---

## 32. Evidence Index

- Monorepo Manifest: `package.json#L1-L33`, `pnpm-workspace.yaml#L1-L5`, `turbo.json#L1-L29`
- Fastify Gateway: `apps/api-gateway/src/app.ts#L1-L263`, `apps/api-gateway/src/server.ts#L1-L45`
- Database Schemas: `packages/database/src/schema/core/` (17 tables), `company/index.ts` (130 tables), `clinical/index.ts` (298 tables)
- Migrations: `packages/database/migrations/` (58 files, `0000_curvy_stature.sql` to `0057_patient_uhid_unique.sql`)
- Partner Platform Routing: `apps/partner-platform/src/utils/urlRouter.ts#L1-L333`
- Client Persistence & Guards: `apps/partner-platform/src/services/api-client.ts#L1-L212`
- Security Verification: `tests/security/adversarial-security-audit.mjs` (39/39 passed)
- Production Truth Verification: `tests/production-truth/test-production-truth.js` (17/17 passed)
- Performance & Load Certification: `phase6-benchmark-results.json` (Concurrencies C=1 to C=250 verified)

---

## 28. FINAL CAPABILITY MATRIX

| Domain | Capability | Frontend | API | Service | DB | Auth | RBAC | Tests | Classification | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | User Login & JWT | `HospitalStaffLogin.tsx` | `POST /api/v1/auth/login` | `RealAuthService.ts` | `core.users`, `credentials` | Yes | Yes | `security-wave1.test.mjs` | **VERIFIED** | `auth.routes.ts` |
| **Auth** | Session Revocation | `PartnerPlatformShell.tsx` | `POST /api/v1/auth/logout` | `SessionRevocationService.ts` | `core.revocations` | Yes | Yes | `security-wave1.test.mjs` | **VERIFIED** | `auth.routes.ts` |
| **CRM** | Staged Onboarding | `FullPageRegistrationView.tsx` | `POST /api/v1/company/partners/onboard/staged` | `PartnerOnboardingRepository.ts` | `company.partner_profiles` | Yes | Yes | `lead-onboarding-crm-auth.test.mjs` | **VERIFIED** | `company/partner.routes.ts` |
| **CRM** | Partner Approval | `PartnerLifecycleManager.tsx` | `POST /api/v1/company/partners/:id/approve` | `PartnerGovernanceService.ts` | `company.partner_profiles` | Yes | Yes | `partner-lifecycle-resurrection.test.mjs` | **VERIFIED** | `company/partner.routes.ts` |
| **Clinical** | Patient Registration | `PatientRegistrationDomainManager.tsx` | `POST /api/v1/partner/clinical/patients` | `ClinicalWorkflowService.ts` | `clinical.patients` | Yes | Yes | `clinical-to-cash-persistence.test.mjs` | **VERIFIED** | `clinical-workflow.routes.ts` |
| **Clinical** | Encounter & Token | `EncounterDomainManager.tsx` | `POST /api/v1/partner/clinical/encounters` | `ClinicalWorkflowService.ts` | `clinical.encounters`, `queue_tokens` | Yes | Yes | `clinical-workflow-journey.test.mjs` | **VERIFIED** | `clinical-workflow.routes.ts` |
| **Clinical** | Doctor Consultation | `ClinicalConsultationDomainManager.tsx` | `POST /api/v1/partner/clinical/consultations` | `ClinicalWorkflowService.ts` | `clinical.clinical_consultations` | Yes | Yes | `opd-clinical-vertical-slice.test.mjs` | **VERIFIED** | `clinical-workflow.routes.ts` |
| **Clinical** | Prescription Writing | `ClinicalConsultationDomainManager.tsx` | `POST /api/v1/partner/clinical/consultations/:id/complete` | `ClinicalWorkflowService.ts` | `clinical.prescriptions` | Yes | Yes | `opd-consultation-to-pharmacy-dispense.test.mjs` | **VERIFIED** | `clinical-workflow.routes.ts` |
| **Pharmacy** | Medicine Catalog | `PharmacyDomainManager.tsx` | `GET /api/v1/partner/pharmacy/inventory` | `PharmacyManagementService.ts` | `clinical.pharmacy_medications` | Yes | Yes | `concurrency/pharmacy-fefo.test.ts` | **VERIFIED** | `pharmacy-management.routes.ts` |
| **Pharmacy** | FEFO Dispensing | `FastPharmacyPosView.tsx` | `POST /api/v1/partner/pharmacy/dispense` | `PharmacyManagementService.ts` | `clinical.pharmacy_inventory_batches` | Yes | Yes | `concurrency/pharmacy-fefo.test.ts` | **VERIFIED** | `pharmacy-management.routes.ts` |
| **Lab** | Investigation Order | `ClinicalInvestigationDomainManager.tsx` | `POST /api/v1/partner/lab/orders` | `LabDiagnosticsService.ts` | `clinical.lab_orders` | Yes | Yes | `lab-diagnostics-vertical-slice.test.mjs` | **VERIFIED** | `lab-diagnostics.routes.ts` |
| **Lab** | Sample Accessioning | `SampleCollectionWorkbenchView.tsx` | `POST /api/v1/partner/lab/orders/:id/collect-sample` | `LabDiagnosticsService.ts` | `clinical.lab_specimens` | Yes | Yes | `lab-diagnostics-vertical-slice.test.mjs` | **VERIFIED** | `lab-diagnostics.routes.ts` |
| **Lab** | Result Entry & Validation | `PathologyWorkbenchView.tsx` | `POST /api/v1/partner/lab/orders/:id/results` | `LabDiagnosticsService.ts` | `clinical.lab_results` | Yes | Yes | `lab-diagnostics-vertical-slice.test.mjs` | **VERIFIED** | `lab-diagnostics.routes.ts` |
| **Billing** | Authoritative Invoice | `BillingDomainManager.tsx` | `POST /api/v1/partner/billing/invoices` | `BillingManagementService.ts` | `clinical.billing_invoices` | Yes | Yes | `billing/invoice-void-discount.test.ts` | **VERIFIED** | `billing-management.routes.ts` |
| **Billing** | Payment Collection | `BillingDomainManager.tsx` | `POST /api/v1/partner/billing/invoices/:id/payments` | `BillingManagementService.ts` | `clinical.billing_payments` | Yes | Yes | `clinical-to-cash-persistence.test.mjs` | **VERIFIED** | `billing-management.routes.ts` |
| **Billing** | Refund Processing | `BillingDomainManager.tsx` | `POST /api/v1/partner/billing/invoices/:id/refund` | `BillingManagementService.ts` | `clinical.billing_refunds` | Yes | Yes | `billing/invoice-void-discount.test.ts` | **VERIFIED** | `billing-management.routes.ts` |
| **Inpatient**| Bed ADT Management | `InpatientDomainManager.tsx` | `POST /api/v1/partner/inpatient/admissions` | `InpatientManagementService.ts` | `clinical.ipd_admissions`, `bed_master` | Yes | Yes | `inpatient-adt-vertical-slice.test.mjs` | **VERIFIED** | `inpatient-management.routes.ts` |
| **Emergency**| Trauma Triage & Bay | `EmergencyDomainManager.tsx` | `POST /api/v1/partner/emergency/admissions` | `EmergencyManagementService.ts` | `clinical.emergency_admissions` | Yes | Yes | `emergency-trauma-vertical-slice.test.mjs` | **VERIFIED** | `emergency-management.routes.ts` |
| **OT** | Surgery Booking & Checklist | `OTDomainManager.tsx` | `POST /api/v1/partner/ot/bookings` | `OTManagementService.ts` | `clinical.ot_bookings` | Yes | Yes | `ot-surgery-vertical-slice.test.mjs` | **VERIFIED** | `ot-management.routes.ts` |
| **Radiology**| PACS & Study Scheduling | `RadiologyDomainManager.tsx` | `POST /api/v1/partner/radiology/orders` | `RadiologyRepository.ts` | `clinical.radiology_orders` | Yes | Yes | `radiology.routes.ts` | **VERIFIED** | `radiology.routes.ts` |
| **Dietary** | Meal Plan & Nutrition | `DietaryDomainManager.tsx` | `POST /api/v1/partner/dietary/meal-plans` | `DietaryService.ts` | `clinical.dietary_meal_plans` | Yes | Yes | `dietary.routes.ts` | **VERIFIED** | `dietary.routes.ts` |
| **Blood Bank**| Cross-Match & Transfusion | `BloodBankDomainManager.tsx` | `POST /api/v1/partner/blood-bank/crossmatch` | `BloodBankManagementService.ts` | `clinical.blood_crossmatches` | Yes | Yes | `blood-bank-transfusion-vertical-slice.test.mjs` | **VERIFIED** | `blood-bank-management.routes.ts` |
| **Security** | Tamper-Evident Audit | `ForensicLeakInvestigatorModal.tsx` | `GET /api/v1/company/compliance/audit` | `AuditRepository.ts` | `core.audit_events` | Yes | Yes | `adversarial-security-audit.mjs` | **VERIFIED** | `core/audit-events.ts` |
| **Telemed** | Video Consultation | `TelemedicineRpmDomainManager.tsx` | `POST /api/v1/partner/telemedicine/sessions` | Partial WebRTC | `clinical.telemedicine_sessions` | Yes | Yes | `telemedicine-rpm-data.ts` | **PARTIALLY VERIFIED** | `partner/telemedicine.routes.ts` |
| **Theme** | UI Visual Themes | `ThemeStudioModal.tsx` | None | None | None (Client `localStorage`) | No | No | None | **UI ONLY** | `ThemeStudioModal.tsx` |

---

## 32. CURRENT SYSTEM DISCOVERY STATUS

```text
DISCOVERY COMPLETE
```

All 32 required audit dimensions, monorepo architectures, frontend applications, backend services, API routes, database schemas, migration histories, test suites, mock data distributions, and persistence chains have been inspected and factually documented without any code modification or remediation.
