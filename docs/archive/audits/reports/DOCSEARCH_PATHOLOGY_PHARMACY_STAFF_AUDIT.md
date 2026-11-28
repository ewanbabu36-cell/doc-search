# DOC SEARCH — PATHOLOGY & PHARMACY STAFF GOVERNANCE FORENSIC AUDIT
## Maker-Checker Lab Verification, Narcotic Dispensing Safeguards & Separation of Duties

**Platform:** DOC SEARCH Healthcare SaaS  
**Repository:** `D:\DOC SEARCH`  
**Database:** PostgreSQL 18.4 (`127.0.0.1:5432/docsearch`)  
**Scope:** `packages/auth`, `api-gateway`, Pathology & Pharmacy Clinical Modules  
**Test Suite Reference:** `tests/certification/staff-rbac-routing-audit.test.mjs` (Task 7)  
**Execution Date:** November 22, 2026  

---

### 1. PATHOLOGY LABORATORY WORKFLOW & MAKER-CHECKER ARCHITECTURE

In clinical diagnostic laboratories (accredited under NABL / ISO 15189), regulatory mandates strictly require a **Maker-Checker separation of duties** between sample collection/testing and medical report verification.

```
[Patient Arrival / Accession]
       │
       ▼
[1. Specimen Collection: PHLEBOTOMIST]
  ├── Access: Sample Accession & Barcoding Desk
  ├── Privileges: `lab_orders:view`, `samples:collect`
  └── FORBIDDEN: Enter test values, sign off reports, release PDF to patient
       │
       ▼
[2. Specimen Analysis: LAB_TECHNICIAN / SENIOR_LAB_TECH]
  ├── Access: Hematology / Biochemistry Analyzer Workstation
  ├── Privileges: `samples:process`, `test_results:enter`
  └── FORBIDDEN: Validate medical interpretations, approve diagnostic release
       │
       ▼
[3. Clinical Sign-Off: PATHOLOGIST_MD / LAB_DIRECTOR]
  ├── Access: Diagnostic Sign-off Console
  ├── Privileges: `test_results:verify`, `reports:sign`, `reports:release`
  └── Digital Signature: Medical Council Registration Number cryptographic stamp
       │
       ▼
[Published Diagnostic Report Delivered to Patient App & Ordering Doctor]
```

#### Forensic Enforcement in RBAC Matrix:
- **Phlebotomist Mutation Test:** Phlebotomist token attempted to call `PUT /api/v1/partner/lab/orders/:id/verify`.
  - **Result:** Intercepted by `requireAnyPermission({ resource: 'lab_reports', action: 'verify' })`.
  - **Verdict:** **BLOCKED with HTTP 403 FORBIDDEN (PASS)**.
- **Profile Integrity:** As verified in Task 2, a Pathology Lab cannot appoint an OPD General `DOCTOR`. Any diagnostic evaluation must be signed off by a credentialed `PATHOLOGIST_MD` or `LAB_DIRECTOR`.

---

### 2. PHARMACY WORKFLOW & SCHEDULED NARCOTIC DISPENSING SAFEGUARDS

Pharmacy operations (governed by Drugs and Cosmetics Act 1940 and Pharmacy Act 1948) require strict division between financial handling and pharmacological dispensing, with enhanced auditing for Schedule H, H1, and NDPS narcotics.

```
[Valid Doctor e-Prescription in System]
       │
       ├────────────────────────────────────────┐
       │                                        │
       ▼                                        ▼
[1. Financial Cashier: PHARMACY_CASHIER]  [2. Dispensing: DISPENSING_PHARMACIST]
  ├── Role: Front Billing Counter           ├── Role: Registered Pharmacist
  ├── Privileges: `invoices:create`,        ├── Privileges: `prescriptions:dispense`,
  │   `payments:collect`                    │   `drugs:batch_verify`
  └── STRICT RESTRICTIONS:                  └── MANDATORY NARCOTIC CONTROLS:
      - Cannot dispense medications             - Doctor Registration Number match
      - Cannot view narcotic logs               - Patient identity photo match
      - Cannot alter staff accounts             - Batch/Expiry verification
                                                - Digital dispensing register entry
```

#### Forensic Separation of Duties Verified:
- **Cashier Dispense Mutation Test:** Cashier account attempted to authorize narcotic prescription dispensing (`POST /api/v1/partner/pharmacy/dispense`).
  - **Result:** Intercepted by `requireAnyPermission({ resource: 'pharmacy', action: 'dispense' })`.
  - **Verdict:** **BLOCKED with HTTP 403 FORBIDDEN (PASS)**.
- **Schedule H1 Narcotic Invariant:** Dispensing Schedule H1 or NDPS medications without a state-registered `DISPENSING_PHARMACIST` or `CHIEF_PHARMACIST` credentials active is rejected at both the API Gateway and repository layer.

---

### 3. SEPARATION OF DUTIES VERIFICATION MATRIX

| Functional Action | Phlebotomist | Lab Tech | Pathologist MD | Pharmacy Cashier | Dispensing Pharmacist | Chief Pharmacist |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Collect Diagnostic Sample** | **YES** | **YES** | **YES** | NO | NO | NO |
| **Input Analyzed Test Results** | NO | **YES** | **YES** | NO | NO | NO |
| **Approve & Sign Lab Report** | NO | NO | **YES** | NO | NO | NO |
| **Generate Retail POS Invoice** | NO | NO | NO | **YES** | **YES** | **YES** |
| **Dispense Standard Medication** | NO | NO | NO | NO | **YES** | **YES** |
| **Dispense Schedule H1 Narcotics**| NO | NO | NO | NO | **YES (Audited)**| **YES (Audited)**|
| **Alter Pharmacy Staff Status** | NO | NO | NO | NO | NO | **YES** |

Certified Forensic State: **VERIFIED OPERATIONAL COMPLIANCE**
