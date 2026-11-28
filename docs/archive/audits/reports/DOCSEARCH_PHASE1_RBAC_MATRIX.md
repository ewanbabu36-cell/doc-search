# DOC SEARCH — Phase 1: Comprehensive Role-Based Access Control (RBAC) Matrix
**Document Reference:** `DOCSEARCH_PHASE1_RBAC_MATRIX.md`  
**Security Standard:** Principle of Least Privilege (PoLP), Separation of Duties (SoD), NABH 5th Edition, ISO 15189  
**Execution Branch:** `audit/master-forensic-remediation`  
**Auditor:** Antigravity Forensic Engineering Audit Team  
**Date:** November 2026  

---

## 1. Master Role & Permission Hierarchy

DOC SEARCH enforces a strict hierarchical access control model:
$$\text{IDENTITY} \longrightarrow \text{TENANT} \longrightarrow \text{PROFILE} \longrightarrow \text{ROLE} \longrightarrow \text{DEPARTMENT} \longrightarrow \text{PERMISSION} \longrightarrow \text{RESOURCE SCOPE} \longrightarrow \text{ACTION}$$

### 1.1 Action-Level Separation (Granular Operations)
Under healthcare governance standards, broad "read/write" permissions are prohibited. DOC SEARCH implements granular action separation:
- $\text{VIEW} \neq \text{EDIT} \neq \text{DELETE} \neq \text{SHARE} \neq \text{PRINT} \neq \text{EXPORT}$
- $\text{EDIT} \neq \text{APPROVE}$ (Entering data does not imply sign-off authority)
- $\text{UPDATE} \neq \text{DELETE}$ (Modifying a record does not permit purging or hard deletion)
- $\text{REMOVE} \neq \text{DELETE}$ (Logical archival/soft-delete vs permanent purging)
- $\text{CREATE} \neq \text{APPROVE}$ (Order creation vs clinical/financial sign-off)

---

## 2. Complete Enterprise Hospital Permission Matrix (14 Roles)

| Role Code | Clinical Records | Prescriptions & Rx | Inpatient (IPD) | Pharmacy Dispensary | Lab: Enter Results | Lab: Verify Report | Radiology & PACS | Billing & POS | Refund Approval | User & Staff Mgmt | Export & Audit |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SUPER_ADMIN** | FULL | FULL | FULL | FULL | FULL | FULL | FULL | FULL | FULL | FULL | FULL |
| **COMPANY_ADMIN** | AUDIT | AUDIT | AUDIT | AUDIT | AUDIT | AUDIT | AUDIT | FULL | FULL | FULL | FULL |
| **HOSPITAL_ADMIN** | FULL | READ | FULL | FULL | FULL | FULL | FULL | FULL | FULL | FULL | FULL |
| **CLINIC_ADMIN** | FULL | READ | VIEW | FULL | FULL | FULL | FULL | FULL | FULL | FULL | FULL |
| **CHIEF_MED_OFFICER** | FULL | FULL | FULL | READ | READ | FULL | FULL | AUDIT | DENIED | READ | AUDIT |
| **DOCTOR** | FULL | FULL | FULL | READ | READ | REVIEW | ORDER/VIEW | READ | DENIED | DENIED | DENIED |
| **NURSE** | VITALS/NOTES | READ | CARE/NOTES | READ | SPECIMEN | DENIED | VIEW | DENIED | DENIED | DENIED | DENIED |
| **PHARMACIST** | READ (Allergy) | DISPENSE | MED_PASS | FULL | DENIED | DENIED | DENIED | POS ONLY | DENIED | DENIED | PRINT |
| **LAB_TECHNICIAN** | DENIED | DENIED | DENIED | DENIED | **CREATE/EDIT** | **DENIED** | DENIED | DENIED | DENIED | DENIED | PRINT |
| **PATHOLOGIST** | READ (Lab) | DENIED | DENIED | DENIED | EDIT | **SIGN-OFF**\* | DENIED | DENIED | DENIED | DENIED | FULL |
| **RADIOLOGIST** | READ (Imaging) | DENIED | DENIED | DENIED | DENIED | DENIED | **SIGN-OFF** | DENIED | DENIED | DENIED | FULL |
| **RECEPTIONIST** | REGISTRATION | DENIED | BED ASSIGN | DENIED | DENIED | DENIED | DENIED | INVOICE/REC | DENIED | DENIED | DENIED |
| **CASHIER** | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | **COLLECT** | **DENIED** | DENIED | PRINT |
| **PATIENT** | OWN ONLY | OWN ONLY | OWN ONLY | OWN ORDERS | OWN LABS | VIEW ONLY | OWN PACS | OWN INVOICE | N/A | N/A | DOWNLOAD |

*\*Note on Pathologist Sign-Off:* While the matrix and `@docsearch/auth` specify sign-off authority, route guard defect `P1-SEC-03` currently blocks actual execution on `PATCH /api/v1/partner/lab/orders/:id/verify`.

---

## 3. Separation of Duties (SoD) Enforcement & Verification

Separation of Duties prevents clinical error, patient harm, and internal financial fraud by ensuring that single individuals cannot execute conflicting phases of high-risk workflows.

### 3.1 Financial Separation: Cashier vs Supervisor Refund Approval
- **Rule:** A Cashier (`CASHIER` / `BILLING_CLERK`) can create invoices and collect payments (`billing:invoices:create`, `billing:payments:create`), but CANNOT execute refunds (`billing:invoices:refund`).
- **SoD Dual-Custody:** Refunds require supervisor authorization (`HOSPITAL_ADMIN`, `FINANCE_OFFICER`, or `CHIEF_FINANCIAL_OFFICER`).
- **Anti-Self-Approval Defense:** The system strictly checks `supervisor_user_id !== request.session.userId`. A billing clerk attempting to supply their own `userId` as the approving supervisor is immediately blocked with `403 Forbidden` (`Separation of duties violation`).
- **Verification Status:** Empirically verified in `tests/security/enterprise-access-control.test.mjs` (Lines 318–374).

### 3.2 Laboratory Separation: Specimen Entry vs Pathological Sign-Off
- **Rule (ISO 15189 / NABL 5th Ed):** A Lab Technician (`LAB_TECHNICIAN`) collects specimens and enters raw analyzer values (`lab:results:create`, `lab:results:update`), but is strictly forbidden from verifying or signing off on the medical diagnostic report (`lab:results:validate`).
- **Clinical Governance:** Medical report verification requires a certified Pathologist (`PATHOLOGIST`, `CHIEF_MEDICAL_OFFICER`, or authorized laboratory director).
- **Verification Status:** Empirically verified in `tests/security/enterprise-access-control.test.mjs` (Lines 375–412). Lab technicians attempting to invoke `PATCH /api/v1/partner/lab/orders/:id/verify` receive `403 Forbidden`.

### 3.3 Pharmacy Separation: Prescription Ordering vs Dispensing
- **Rule:** Doctors write e-prescriptions (`prescriptions:create`). Pharmacists dispense medications (`pharmacy:dispense`). Pharmacists cannot alter drug dosages or prescribe new Schedule X / H1 narcotics without a doctor's amended counter-signature.
- **Verification Status:** Enforced across `ClinicalWorkflowRepository` and `PharmacyDispensaryRepository`.

---

## 4. Forensic Defect Analysis: The Pathologist Omission (`P1-SEC-03`)

### 4.1 The Defect
In `apps/api-gateway/src/routes/partner/lab-diagnostics.routes.ts`:
```typescript
Line 10:
const PATHOLOGIST_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR'] as const;
```
Lines 410, 418, 427, 445 apply:
```typescript
preHandler: [authenticate, requirePermission('lab:results', 'validate'), requireRoles(...PATHOLOGIST_ROLES)]
```

### 4.2 Why This Breaks the Security Architecture
1. In `RealAuthService.ts:204-216`, authentic lab pathologists are assigned `roles: ['PATHOLOGIST']` and `permissions: ['lab:results:validate', ...]`.
2. When the Pathologist logs in and attempts to verify an order at `PATCH /api/v1/partner/lab/orders/:id/verify`, Fastify's `requireRoles` guard checks if the user's role array intersects with `PATHOLOGIST_ROLES`.
3. Because `'PATHOLOGIST'` is absent from `PATHOLOGIST_ROLES`, the route handler throws `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
4. This forces clinical laboratories to either:
   - Misclassify pathologists as `DOCTOR` or `HOSPITAL_ADMIN` (privilege inflation).
   - Have non-specialist hospital administrators verify complex biopsy/blood pathology reports (severe patient safety risk).

### 4.3 Approved Remediation Code Change (For User Review)
In `apps/api-gateway/src/routes/partner/lab-diagnostics.routes.ts:10`:
```typescript
// BEFORE:
const PATHOLOGIST_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN', 'CHIEF_MEDICAL_OFFICER', 'DOCTOR'] as const;

// AFTER:
const PATHOLOGIST_ROLES = [
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'HOSPITAL_ADMIN',
  'CLINIC_ADMIN',
  'CHIEF_MEDICAL_OFFICER',
  'DOCTOR',
  'PATHOLOGIST'
] as const;
```

---

## 5. Temporal Access Control & Role Expiration (ABAC)

DOC SEARCH incorporates Attribute-Based Access Control (ABAC) with temporal constraints:
- Staff roles can have `effective_from` and `effective_to` timestamps.
- In `auth-guard.ts:286-305`, the preHandler evaluates temporal role claims:
  - If `effective_from > NOW`, access is denied (`403 Forbidden: Role not yet effective`).
  - If `effective_to <= NOW`, access is denied (`403 Forbidden: Role has expired`).
- Stale permissions from expired roles (e.g. an expired `NURSE` role alongside an active `BILLING_EXECUTIVE` role) are pruned dynamically during session hydration so expired roles contribute exactly zero permissions.
