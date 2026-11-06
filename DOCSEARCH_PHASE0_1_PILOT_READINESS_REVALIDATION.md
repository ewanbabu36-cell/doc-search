# DOC SEARCH — PHASE 0.1: PILOT READINESS REVALIDATION
**Document ID:** `DOCSEARCH-P01-PILOT-001`  
**Audit Phase:** Phase 0.1 — Independent Audit Challenge & Claim Validation  
**Baseline Commit:** `39eaff5`  
**Classification:** Operational Governance & Commercial Pilot Audit  
**Status:** FACTUAL CLARIFICATION APPLIED  

---

## 1. THE FIVE PILOT FACILITIES: TRUTH RECONCILIATION

In the Phase 0 audit deliverables:
> *"Cleared to deploy immediately for up to 5 selected pilot partner facilities (1 Hospital, 2 Clinics, 1 Pathology Lab, 1 Retail Pharmacy) under supervised engineering monitoring."*

### Empirical Finding from Database and Legal Review:
Physical query of `core.tenants` and `company.partner_profiles` reveals:
- **Number of Signed Commercial MoUs / Contracts on File**: **ZERO (0)**.
- **Nature of Existing Tenants in DB**:
  - The 97 rows in `core.tenants` are **synthetic seed fixtures, developer test workspaces, and staged demo accounts** (e.g. `Rahul Polyclinic & Diagnostics`, `ASHIYANA CLINIC`, `abc-multi-specialty`, UUID test profiles).
  - There are **no legally executed commercial pilot agreements, signed Business Associate Agreements (BAAs), or Data Processing Agreements (DPAs)** with live healthcare institutions.
- **Classification**:
  The 5 facilities recommended in Phase 0 are **PROPOSED ARCHITECTURAL PILOT TARGETS** (a capacity recommendation for Phase 1), **NOT signed or approved commercial partners**.
  Representing them as existing approved healthcare partners would be a legal and commercial misrepresentation.

---

## 2. PILOT OPERATIONAL CONTROL READINESS EVALUATION

Before enrolling real patients in any pilot facility, the platform must satisfy 5 operational safety gates:

```
+-----------------------------------------------------------------------------------------+
|                              PILOT OPERATIONAL GATES RADAR                              |
+--------------------------+------------+-------------------------------------------------+
| Operational Gate         | Status     | Forensic Finding & Pre-requisite                |
+--------------------------+------------+-------------------------------------------------+
| 1. Database RLS Role     | BLOCKED    | Must switch runtime DB connection from postgres |
|                          |            | superuser to docsearch_app before real data.    |
| 2. Hardware Agent Serial | CONDITIONAL| Verified on virtual COM; requires physical      |
|    Weighing Scale        |            | calibration test with actual hospital scale.    |
| 3. WhatsApp Cloud API    | READY      | Tested with Meta Cloud DLR webhook parsing.     |
| 4. Thermal Printer Bridge| READY      | ESC/POS 58mm/80mm receipt generation verified.  |
| 5. Medico-Legal Sign-Off | BLOCKED    | Requires formal RMP clinical review of digital  |
|                          |            | prescription format & CA tax sign-off.          |
+--------------------------+------------+-------------------------------------------------+
```

---

## 3. MANDATORY PRE-PILOT CHECKLIST (THE 4 BLOCKING GATES)

Before deploying the platform to even a single real hospital or clinic, the following 4 engineering and legal prerequisites must be executed:

1. **Gate 1: Reconfigure Runtime PostgreSQL Role (Technical)**:
   - Reconfigure `apps/api-gateway` database pool to connect as `docsearch_app` (`rolsuper = false, rolbypassrls = false`).
   - Wrap all tenant transactions with `SET LOCAL app.current_tenant_id = $1` to activate native PostgreSQL engine RLS.
2. **Gate 2: Chartered Accountant Tax Clearance (Statutory)**:
   - Obtain formal written sign-off from an independent CA certifying the backward 18% GST calculation formula and Section 194J/206AA TDS tables.
3. **Gate 3: Clinical Director / Medico-Legal Approval (Clinical)**:
   - Verify that the PDF e-Prescription format includes all mandatory National Medical Commission (NMC) fields: Doctor Registration Number, State Medical Council, clinic physical address, patient UHID, and cryptographic verification QR code.
4. **Gate 4: Formal Commercial MoU Execution (Business)**:
   - Execute formal, signed Pilot Testing Agreements with 5 real facility owners, explicitly defining data governance, DPDP consent, liability limitations, and emergency paper-record fallbacks.
