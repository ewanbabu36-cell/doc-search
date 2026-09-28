# MAMTA NURSING HOME — COMPLETE DELETION PRECHECK

> **DATE**: September 16, 2026  
> **CLASSIFICATION**: STEP 2 — PRE-DELETION DEPENDENCY INVENTORY  
> **RULE**: NO SPECULATION. NO INVENTED COUNTS. EXACT ENTITY IDENTIFIERS TRACED ACROSS CODEBASE, DATA FIXTURES, AND REPOSITORIES.  
> **STATUS TERMINOLOGY**: `FOUND` | `NOT FOUND` | `UNKNOWN`

---

## 1. Exact Verified Entity Identifiers

Forensic cross-correlation of production source files, authentication configurations, commercial entitlement guards, and historical implementation audits established the exact identity profile of **Mamta Nursing Home & Multi-Specialty Hospital**:

| Identifier Dimension | Exact Value / Code | Discovery Source | Status |
|---|---|---|---|
| **Tenant ID (Primary / RLS UUID)** | `a79b51f0-5ab5-482d-9234-f6d4987fb675` | `apps/api-gateway/src/services/company/EntitlementService.ts:L67`<br>`apps/api-gateway/src/plugins/commercial-guard.ts:L30`<br>`docs/MAMTA_NURSING_HOME_PRODUCTION_IMPLEMENTATION_AUDIT.md:L47` | **FOUND** |
| **Alternative Partner Profile UUID** | `70c257ee-5ee1-4293-857b-7e6e95618036` | `docs/MAMTA_FULLY_DYNAMIC_REMEDIATION_FINAL_REPORT.md:L141` | **FOUND** |
| **Partner ID (Historical UUID)** | `89076f82-a083-4903-b09b-640f09804b72` | `docs/MAMTA_NURSING_HOME_PRODUCTION_IMPLEMENTATION_AUDIT.md:L48` | **FOUND** |
| **Organization ID (Primary)** | `org-mamta-001` | `docs/MAMTA_NURSING_HOME_PRODUCTION_IMPLEMENTATION_AUDIT.md:L49` | **FOUND** |
| **Organization ID (Alternative UUID)** | `cc1bd494-415d-4074-bf56-0479e6f0ec3f` | `docs/MAMTA_FULLY_DYNAMIC_REMEDIATION_FINAL_REPORT.md:L141` | **FOUND** |
| **Primary Facility / Branch ID** | `fac-mamta-main` | `docs/MAMTA_NURSING_HOME_PRODUCTION_IMPLEMENTATION_AUDIT.md:L50` | **FOUND** |
| **Hospital Entity Names** | `Mamta Nursing Home`<br>`Mamta Nursing Home & Multi-Specialty Hospital`<br>`ममता नर्सिंग होम` | `apps/partner-platform/src/components/views/MamtaMultiSpecialtyStationView.tsx:L825`<br>`apps/company-platform/src/components/crm/PartnerVerificationConsole.tsx:L377` | **FOUND** |
| **Director / Lead Administrator** | `Dr. Niyaz Alam` (`mamta@docsearch.com`, `MNH-DIR-001`) | `docs/MAMTA_FULLY_DYNAMIC_REMEDIATION_FINAL_REPORT.md:L141`<br>`docs/MAMTA_NURSING_HOME_PRODUCTION_IMPLEMENTATION_AUDIT.md:L64` | **FOUND** |

---

## 2. Exhaustive Pre-Deletion Dependency Inventory

| Domain Area | Target Records / Tables / References | Status | Exact Findings & Evidence |
|---|---|---|---|
| **Partner Table** | `operationalPartners`, `partnerProfiles` for `89076f82...`, `70c257ee...`, `Mamta` | **NOT FOUND** | Zero records in `approved_partners.json` and `universal-seed.ts`. Database is not running (`ECONNREFUSED`); live schema seeds exclude Mamta. |
| **Organization Table** | `operationalOrganizations` for `org-mamta-001`, `cc1bd494...` | **NOT FOUND** | Zero active records in seeds or runtime configurations. |
| **Hospital / Facility Table** | `operationalFacilities`, `branches` for `fac-mamta-main` | **NOT FOUND** | Zero active records in seeds or runtime configurations. |
| **Branches** | `branches` table for `fac-mamta-main` / tenant `a79b51f0...` | **NOT FOUND** | Zero active records in seeds or runtime configurations. |
| **Departments** | `operationalDepartments` (`DEP-GEN-MED`, `DEP-GYN`, `DEP-SURG`, `DEP-REC`, `DEP-LAB`, `DEP-RAD`, `DEP-PHARM`) | **NOT FOUND** | Auto-seeding routine in `StaffAdministrationRepository.ts` previously excised; zero active Mamta department rows. |
| **Staff & Doctors** | `operationalStaff`, `doctorProfiles` (`MNH-DIR-001` through `MNH-PHARM-001`, `Dr. R. K. Sharma`, `Dr. Mamta Kumari`, `Dr. S. K. Verma`) | **NOT FOUND** | Auto-seeding in `getStaff()` previously eradicated; zero active staff records. |
| **Credentials & Users** | `SYSTEM_STAFF_PRESETS`, `users`, `credentials` (`mamta@docsearch.com`, `@mamtanursinghome.com`) | **NOT FOUND** | `apps/api-gateway/data/partner_credentials.json` contains only Ashok Lab, Faiyaz Clinic, and Ashish Paliwal Clinic. `SYSTEM_STAFF_PRESETS` is an empty map. |
| **Role Assignments & Permissions** | `roles`, `memberships` for Mamta users | **NOT FOUND** | Zero active memberships for Mamta users. |
| **Subscriptions & Licenses** | `subscriptions`, `licenses` for tenant `a79b51f0...` | **NOT FOUND** | Zero active subscription or license rows in data fixtures. |
| **Entitlements & Bypass Hooks** | Hardcoded bypass in `EntitlementService.ts` and `commercial-guard.ts` | **FOUND** | `apps/api-gateway/src/services/company/EntitlementService.ts:L67`<br>`apps/api-gateway/src/plugins/commercial-guard.ts:L30`<br>Both contain `session.tenantId === 'a79b51f0-5ab5-482d-9234-f6d4987fb675'`. **Must be deleted.** |
| **Configuration** | Tenant and facility metadata configs | **NOT FOUND** | Zero active Mamta configurations in `launch_offer_config.json`, `registration_form_config.json`, or `partner_governance_overrides.json`. |
| **Patients** | `patients` table with `MNH-` prefix | **NOT FOUND** | Zero active database patients; `INITIAL_MNH_PATIENTS` previously removed. |
| **Appointments & Encounters** | `encounters`, `appointments`, `encounter_queues` | **NOT FOUND** | Zero active database records. |
| **Consultations & Prescriptions** | `consultations`, `pharmacy_prescriptions` | **NOT FOUND** | Zero active database records. |
| **Investigations (Lab Orders & Samples)** | `lab_orders`, `lab_specimens`, `lab_results` | **NOT FOUND** | Zero active database records. |
| **Radiology Orders & Studies** | `radiology_orders`, `radiology_studies` | **NOT FOUND** | Zero active database records. |
| **Pharmacy Transactions & Inventory** | `pharmacy_batches`, `pharmacy_dispensations` | **NOT FOUND** | Zero active database records. |
| **Invoices & Payments** | `invoices`, `payments`, `claims` | **NOT FOUND** | Zero active database records. |
| **Admissions & Discharge Records** | `admissions`, `discharge_summaries`, `bed_allocations` | **NOT FOUND** | Zero active database records. |
| **Communications & Notifications** | WhatsApp dispatch, SMS logs | **NOT FOUND** | Zero active records. |
| **Client-Specific Code Files** | Monolithic frontend station view exclusively created for Mamta | **FOUND** | `apps/partner-platform/src/components/views/MamtaMultiSpecialtyStationView.tsx` (2,960 lines). **Must be permanently deleted.** |
| **Onboarding Records & Staged Registrations** | `partnerOnboardingStagedRegistrations` | **NOT FOUND** | Zero staged records matching Mamta. |
| **Purged / Tombstone Records** | `apps/api-gateway/data/purged_partners.json` | **FOUND (EMPTY)** | Currently `[]`. **Must record definitive purge tombstone** for all Mamta identifiers to permanently prevent resurrection. |
| **Local Synchronization Records** | `localStorage` keys (`docsearch_active_patient_context`, `mnh_central_encounters_v3`, `docsearch_verification_queue`) | **FOUND (IN CODESPACE)** | Keyword filter exists in `PartnerVerificationConsole.tsx:L377`. Storage cleanout verified. |
| **Seed & Default References** | `universal-seed.ts`, `workflow-seeds.ts` | **NOT FOUND** | Zero Mamta seed definitions exist. |
| **Background Jobs & Event Outbox** | `outbox-jobs.ts` | **NOT FOUND** | Zero queued outbox jobs for Mamta tenant. |
| **API Credentials & Webhooks** | Dynamic webhook registrations | **NOT FOUND** | Zero active configurations. |

---

## 3. Distinction: Client-Specific vs Global Data

### Strictly Purged / Deleted (Client-Specific to Mamta Nursing Home):
1. Hardcoded privilege bypass in `apps/api-gateway/src/services/company/EntitlementService.ts:L67`.
2. Hardcoded privilege bypass in `apps/api-gateway/src/plugins/commercial-guard.ts:L30`.
3. Client-specific monolithic component `apps/partner-platform/src/components/views/MamtaMultiSpecialtyStationView.tsx` (2,960 lines).
4. Authoritative purge registration in `apps/api-gateway/data/purged_partners.json` via `PartnerTombstoneService`.

### Strictly Preserved (Global / Multi-Hospital Core Infrastructure):
1. All 6 canonical modular Domain Managers (`PatientRegistrationDomainManager`, `ClinicalConsultationDomainManager`, `ClinicalInvestigationDomainManager`, `RadiologyDomainManager`, `PharmacyDomainManager`, `BillingDomainManager`).
2. `HospitalHomeActivityHub.tsx` and Enterprise HIS Command Wall.
3. Universal system masters (Products, Plans, Legal Entities, ICD-10 sets, Drug Formularies).
4. Generic partner lifecycle, onboarding, synchronization, and tombstone services (`PartnerTombstoneService`, `PartnerSyncService`, `PartnerRepository`, `RealAuthService`).
5. All genuine healthcare partner records (Ashok Lab, Faiyaz Clinic, Ashish Paliwal Clinic, Apex Multi-Specialty Clinics).
