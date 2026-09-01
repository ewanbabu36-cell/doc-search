# ROLE-BASED DOCUMENT & CERTIFICATE VERIFICATION ARCHITECTURE

## 1. Executive Summary & Audit of Existing Architecture

This document formalizes the complete end-to-end architecture for **Role-Based Document & Certificate Verification** within the Doc Search platform across the Database, Backend API, Validation, RBAC Security, Audit Logging, and Frontend UI for both the Hospital Partner Platform (`apps/partner-platform`) and Company SaaS HQ Platform (`apps/company-platform`).

---

## 2. Current Architecture vs. Gaps Identified

### Current State
* Document requirements were partially distributed across disparate module tables (e.g., `procurement_vendor_documents`, `insurance_document_records`, `whatsapp_document_dispatches`).
* Universal settings modal had UI fields for bank, address, and role-based documents.
* Company platform CRM verified partners at the macro tenant level (`partner_profiles.verification_status`), but lacked a granular, relational document requirement engine.

### Gaps Addressed
1. **Dynamic Requirement Resolution**: Requirements must be computed dynamically by the backend based on `(Entity Type + Role + Professional Type + Facility Type + Configured Policy)`.
2. **Dedicated Master & Relational Document Model**:
   * `document_types` master defining all regulatory & qualification types (e.g., `MEDICAL_DEGREE`, `MEDICAL_REGISTRATION`, `NABL_ACCREDITATION`, `PHARMACY_DRUG_LICENSE`, `STAFF_QUALIFICATION`).
   * `document_requirements` mapping rule table with conditions (e.g. `requiresSpecialization`, `isConditional`).
   * `entity_documents` tracking uploaded files, metadata, cryptographic SHA-256 hash, versioning (`version`, `is_current`, `superseded_by`), and expiry dates.
   * `document_verifications` recording verifier actions (`VERIFIED`, `REJECTED`, `REQUEST_REUPLOAD`) with immutable reasoning.
   * `document_audit_logs` tracking append-only audit trail.
3. **Backend Dynamic Requirement API**:
   * `GET /api/v1/compliance/documents/requirements`
   * `POST /api/v1/compliance/documents/upload`
   * `POST /api/v1/compliance/documents/:id/verify`
   * `POST /api/v1/compliance/documents/:id/reject`
   * `GET /api/v1/compliance/documents/summary`
4. **Gated Submission & Blocking Engine**:
   * Profile verification / onboarding status is blocked until all mandatory documents for the role/facility type are uploaded and verified by Company Admin.

---

## 3. Role & Facility Type Requirement Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ROLE / FACILITY TYPE MAPPING MATRIX                                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 🩺 DOCTOR                                                                              │
│    ├── MEDICAL_DEGREE (Mandatory)                                                      │
│    ├── MEDICAL_REGISTRATION (Mandatory, Requires Council & Reg No)                     │
│    ├── SPECIALIZATION_CERTIFICATE (Conditional on Specialization claimed)              │
│    └── EXPERIENCE_CERTIFICATE (Mandatory / Optional)                                   │
│                                                                                        │
│ 🧪 LABORATORY / DIAGNOSTIC CENTER                                                      │
│    ├── LAB_REGISTRATION (Mandatory, State / Municipal License)                         │
│    ├── LAB_LICENSE (Mandatory, Clinical Establishment Act)                             │
│    ├── LAB_ACCREDITATION (NABL ISO 15189, Conditional/Mandatory for Tier)              │
│    ├── RESPONSIBLE_PERSON_QUALIFICATION (MD Pathologist Degree & Reg No)               │
│    └── BIOMEDICAL_WASTE_CLEARANCE (Pollution Control Board)                            │
│                                                                                        │
│ 🏥 HOSPITAL / CLINIC                                                                   │
│    ├── HOSPITAL_REGISTRATION (Mandatory, Clinical Establishment Act)                   │
│    ├── OPERATING_LICENSE (Mandatory, State Govt License)                               │
│    ├── FIRE_SAFETY_NOC (Mandatory, Municipal Fire Dept)                                │
│    ├── NABH_ACCREDITATION (Conditional / Quality Tier)                                 │
│    └── RADIATION_SAFETY_AERB (Conditional for Radiology/Cath Lab)                      │
│                                                                                        │
│ 💊 PHARMACY                                                                            │
│    ├── PHARMACY_DRUG_LICENSE_20B_21B (Mandatory, Drugs & Cosmetics Act)                │
│    ├── PHARMACIST_REGISTRATION (Mandatory, State Pharmacy Council)                     │
│    ├── PHARMACIST_QUALIFICATION (B.Pharm / D.Pharm Degree)                             │
│    └── EXPERIENCE_CERTIFICATE                                                          │
│                                                                                        │
│ 🎓 STAFF / NURSE / RECEPTION / ALLIED HEALTH                                           │
│    ├── QUALIFICATION_CERTIFICATE (B.Sc Nursing, GNM, DMLT, MBA, B.Com)                 │
│    ├── PROFESSIONAL_REGISTRATION (Nursing Council / Paramedical, conditional)          │
│    ├── EXPERIENCE_CERTIFICATE (Past Hospital Relieving Letter)                         │
│    └── GOVERNMENT_ID_PROOF (Aadhaar / PAN Card)                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Relational Database Schema Specification

* `core.document_types`
* `core.document_requirements`
* `core.entity_documents`
* `core.document_verifications`
* `core.document_audit_logs`

---

## 5. Status State Machine & Transitions

```text
       ┌──────────────┐
       │ NOT_UPLOADED │
       └──────┬───────┘
              │ (Upload)
              ▼
   ┌──────────────────────┐
   │ PENDING_VERIFICATION │◄─────────────┐
   └──────┬────────────┬──┘              │
          │            │                 │ (Re-upload)
(Verify)  │            │ (Reject)        │
          ▼            ▼                 │
    ┌──────────┐  ┌──────────┐           │
    │ VERIFIED │  │ REJECTED ├───────────┘
    └─────┬────┘  └──────────┘
          │
          ├─────────────────────────┐
          │ (Expires)               │ (New Version Uploaded)
          ▼                         ▼
    ┌─────────┐               ┌────────────┐
    │ EXPIRED │               │ SUPERSEDED │
    └─────────┘               └────────────┘
```
