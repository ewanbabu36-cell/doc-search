# DOC SEARCH — PHASE 0: APPLICATION INVENTORY
**Document ID:** `DOCSEARCH-PHASE0-APPS`  
**Execution Timestamp:** 2026-11-21T17:25:00+05:30  
**Audit Branch:** `audit/master-forensic-remediation`  

---

## 1. Application Inventory & Structural Mapping

### 1.1 `apps/partner-platform` (Enterprise Hospital, Clinic & Pharmacy OS)
- **Role**: Primary B2B SaaS interface used by Doctors, Nurses, Pharmacists, Lab Technicians, Radiologists, Receptionists, and Hospital Administrators.
- **Source Files**: 1,051 files | **Lines of Code**: 363,110 lines
- **Entry Points**: `src/main.tsx`, `index.html`
- **Core Architecture**:
  - `PartnerPlatformShell.tsx`: Primary desktop application shell with collapsible left navigation, domain matrix switcher, quick add modals, and user profile drawer.
  - Domain Managers:
    - `ClinicalConsultationDomainManager.tsx` (Doctor OPD & SOAP Cockpit)
    - `PharmacyDomainManager.tsx` (Retail POS, Wholesale B2B, FEFO Batch Management)
    - `ClinicalInvestigationDomainManager.tsx` (Pathology LIMS, ASTM/HL7 Analyzer Sync)
    - `InpatientDomainManager.tsx` (IPD, Ward Management, Bed Allocation)
    - `EmergencyDomainManager.tsx` (ER Triage, Crash Cart, STAT Escalation)
    - `BillingDomainManager.tsx` (Cashier Desk, Invoicing, Insurance Claims, TPA)
    - `BloodBankDomainManager.tsx` (Donor Management, Component Separation, Crossmatching)
    - `OTDomainManager.tsx` (Operation Theatre Scheduling, WHO Surgical Safety Checklist)
    - `RadiologyDomainManager.tsx` (PACS DICOM Viewer Integration)
- **Offline / PWA Capability**: Integrated Service Worker (`pwaCompanion`) with IndexedDB offline token cache.

---

### 1.2 `apps/api-gateway` (Fastify Enterprise API Backend)
- **Role**: Authoritative REST and WebSocket backend providing authentication, RBAC, tenant isolation, business transactions, and PostgreSQL persistence.
- **Source Files**: 489 files | **Lines of Code**: 227,607 lines
- **Entry Points**: `src/server.ts`, `dist/server.js`
- **Core Architecture**:
  - `src/plugins/`: `auth.ts`, `idempotency.ts`, `audit.ts`, `rate-limit.ts`, `cors.ts`, `telemetry.ts`
  - `src/routes/`:
    - `auth/`: Authentication, session verification, logout, password recovery.
    - `partner/`: Clinical consultations, encounters, pharmacy, billing, LIMS, emergency, IPD, OT, blood bank, hardware integration.
    - `company/`: HQ governance, partner onboarding, license validation, platform billing.
    - `patient/`: Patient appointment booking, medical record access, ABHA integration.
  - `src/repositories/partner/`: Drizzle ORM data access layers with RLS tenant context scoping.
  - `src/services/partner/`: Transactional business logic with database transaction rollback guarantees.

---

### 1.3 `apps/company-platform` (Executive & HQ Governance Platform)
- **Role**: Internal DocSearch corporate management portal for partner vetting, subscription billing, system monitoring, and global clinical audit.
- **Source Files**: 398 files | **Lines of Code**: 131,666 lines
- **Entry Points**: `src/main.tsx`, `index.html`
- **Key Modules**:
  - `PartnerApprovalView.tsx` (Hospital/Clinic KYC Verification)
  - `PlatformSubscriptionView.tsx` (B2B SaaS Revenue & Tier Invoicing)
  - `AuditLogViewer.tsx` (System-Wide Security & Event Audit Trail)
  - `InfrastructureMonitorView.tsx` (Microservice Health Telemetry)

---

### 1.4 `apps/patient-app` (Patient Mobile Companion App)
- **Role**: Patient-facing mobile application for viewing prescriptions, lab reports, booking appointments, and ABHA Health ID integration.
- **Source Files**: 51 files | **Lines of Code**: 13,620 lines
- **Entry Points**: `src/main.tsx`, `index.html`, Capacitor Android configuration
- **Key Modules**:
  - `AppointmentBookingView.tsx`
  - `PrescriptionListView.tsx`
  - `DiagnosticReportViewer.tsx`
  - `AbhaHealthLockerView.tsx`

---

### 1.5 `apps/landing-page` (Public Discovery & Marketing Portal)
- **Role**: Public website for doctor discovery, clinic booking, and hospital SaaS marketing.
- **Source Files**: 20 files | **Lines of Code**: 14,896 lines
- **Entry Points**: `src/main.tsx`, `index.html`
- **Key Modules**:
  - `DoctorDiscoveryGrid.tsx`
  - `PublicSlotBookingModal.tsx`
  - `PricingCalculator.tsx`
