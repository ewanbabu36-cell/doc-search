# MAMTA NURSING HOME — DATABASE & PERSISTENCE DELETION VERIFICATION

> **DATE**: September 16, 2026  
> **CLASSIFICATION**: STEP 12 — DATABASE PERSISTENCE, FOREIGN KEY & ORPHAN AUDIT  
> **RULE**: PROVE ZERO ACTIVE OR ORPHANED MAMTA RECORDS ACROSS ALL PERSISTENCE FIXTURES AND REPOSITORIES WITHOUT AFFECTING UNRELATED PARTNERS.  
> **STATUS**: **VERIFIED — ZERO RESIDUAL RECORDS**

---

## 1. Executive Summary

This document verifies the complete eradication of **Mamta Nursing Home & Multi-Specialty Hospital** from the persistence layer, including database schemas, Drizzle seed definitions, local JSON caches, disk fixtures, and authorization tables.

All queries confirm:
1. **Zero Active Records**: No partner profile, organization, facility, staff member, doctor, patient, encounter, or invoice exists for Mamta Nursing Home.
2. **Zero Orphaned Records**: Child tables (`operational_departments`, `doctor_profiles`, `licenses`, `subscriptions`, `operational_staff`) have zero lingering foreign keys referencing Mamta IDs.
3. **Unrelated Partners Protected**: All valid operational partners (`Ashok Lab`, `Faiyaz Clinic`, `Ashish Paliwal Clinic`, `Apex Multi-Specialty Clinics`) remain active, intact, and unaffected.

---

## 2. Table-by-Table Deletion Verification

| Schema & Table Name | Target Field / Foreign Key | Query / Filter Applied | Result | Verification Status |
|---|---|---|---|---|
| `core.tenants` | `id` | `WHERE id IN ('a79b51f0...', '70c257ee...')` | 0 records | **VERIFIED CLEAN** |
| `core.branches` | `tenant_id`, `id` | `WHERE tenant_id = 'a79b51f0...' OR id = 'fac-mamta-main'` | 0 records | **VERIFIED CLEAN** |
| `core.users` | `email` | `WHERE email LIKE '%@mamtanursinghome.com' OR email = 'mamta@docsearch.com'` | 0 records | **VERIFIED CLEAN** |
| `core.credentials` | `user_id` | `WHERE user_id IN (SELECT id FROM core.users WHERE email = 'mamta@docsearch.com')` | 0 records | **VERIFIED CLEAN** |
| `company.partner_profiles` | `id`, `trade_name`, `legal_name` | `WHERE id IN ('89076f82...', '70c257ee...') OR trade_name ILIKE '%Mamta%'` | 0 records | **VERIFIED CLEAN** |
| `company.operational_partners` | `id`, `tenant_id` | `WHERE id IN ('89076f82...', '70c257ee...') OR tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `company.operational_organizations` | `id`, `organization_code` | `WHERE id = 'cc1bd494...' OR organization_code = 'org-mamta-001'` | 0 records | **VERIFIED CLEAN** |
| `company.operational_facilities` | `id`, `facility_code` | `WHERE id = 'fac-mamta-main' OR facility_code = 'fac-mamta-main'` | 0 records | **VERIFIED CLEAN** |
| `company.operational_departments` | `tenant_id`, `department_code` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `company.operational_staff` | `tenant_id`, `employee_code` | `WHERE tenant_id = 'a79b51f0...' OR employee_code LIKE 'MNH-%'` | 0 records | **VERIFIED CLEAN** |
| `clinical.doctor_profiles` | `tenant_id`, `staff_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `clinical.patients` | `tenant_id`, `mrn` | `WHERE tenant_id = 'a79b51f0...' OR mrn LIKE 'MNH-%'` | 0 records | **VERIFIED CLEAN** |
| `clinical.encounters` | `tenant_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `clinical.consultations` | `tenant_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `clinical.lab_orders` | `tenant_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `clinical.radiology_orders` | `tenant_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `clinical.pharmacy_dispensations` | `tenant_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `billing.patient_invoices` | `tenant_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `company.subscriptions` | `tenant_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `company.licenses` | `tenant_id` | `WHERE tenant_id = 'a79b51f0...'` | 0 records | **VERIFIED CLEAN** |
| `company.partner_staged_registrations` | `contact_email`, `organization_name` | `WHERE contact_email = 'mamta@docsearch.com' OR organization_name ILIKE '%Mamta%'` | 0 records | **VERIFIED CLEAN** |

---

## 3. Disk Fixtures & Repository Data Inspection

| Fixture File | Inspected Content | Result |
|---|---|---|
| `apps/api-gateway/data/approved_partners.json` | Parsed 3 active partners (`ashok@lab.in`, `faiyaz@docsearch.health`, `ashish@clinic.in`) | **0 Mamta Records** |
| `apps/api-gateway/data/partner_credentials.json` | Parsed 3 credential sets (`ASHOKA LAB`, `FAIYAZ CLINIC`, `ASHISH PALIWAL CLINIC`) | **0 Mamta Records** |
| `apps/api-gateway/data/purged_partners.json` | Parsed 1 authoritative purge tombstone for Mamta Nursing Home | **1 Tombstone Registered** |
| `packages/database/src/seeds/universal-seed.ts` | Inspected all seeded entities (`PROD_HEALTHCARE_SUITE`, `PLAN_ENTERPRISE_NETWORK`, `Apex Multi-Specialty Clinics`) | **0 Mamta Records** |
| `packages/database/src/seeds/workflow-seeds.ts` | Inspected baseline clinical workflow seeds | **0 Mamta Records** |

---

## 4. Referential Integrity & Collateral Protection

To guarantee that the permanent deletion did not destabilize valid tenants or violate relational constraints:

1. **Cascade Order Preserved**: The deletion pattern in `purgePartnerPermanently` executes child-first removal (`partnerLifecycleTransitions` ➔ `partnerGovernanceOverrides` ➔ `partnerPlanAssignments` ➔ `licenses` ➔ `subscriptions` ➔ `doctorProfiles` ➔ `operationalStaff` ➔ `operationalDepartments` ➔ `operationalFacilities` ➔ `operationalOrganizations` ➔ `operationalPartners` ➔ `partnerProfiles` ➔ `tenants`).
2. **Foreign-Key Health**: Zero orphaned child records remain in the schema.
3. **Unrelated Partners Intact**: Verification script confirmed that neither Ashok Lab (`821ab7d6-7e33-4d8b-b0f7-60d61f37a925`), Faiyaz Clinic (`f450f3ff-2c56-46c5-a95b-7c6a8474ab1c`), nor Ashish Paliwal Clinic (`e22d5633-a82c-48c6-92f5-f229a76a7341`) share foreign keys or affiliations with Mamta Nursing Home.

**Verification Result**: **VERIFIED — ZERO RESIDUAL RECORDS**
