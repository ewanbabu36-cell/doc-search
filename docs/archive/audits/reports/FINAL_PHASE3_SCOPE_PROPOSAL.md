# DOC SEARCH — PHASE 3 SCOPE PROPOSAL & ARCHITECTURAL BLUEPRINT

**Planning Status**: `PHASE_3_PLANNING_STATUS: COMPLETE`  
**Phase 2 Status**: `PHASE_2_FULL_ACCEPTANCE_PASS (FROZEN & LOCKED)`  
**Scope Directive**: Planning Audit Only — No Implementation Until Explicit Approval

---

## 1. Executive Summary

Following the full acceptance and lockdown of **Phase 1 (Real Database Authentication & Persistent Sessions)** and **Phase 2 (Pathology LIMS, Multi-Test Diagnostics, ISO 32000-1 Binary PDF, and Direct A4 Print)**, this proposal defines the exact scope, boundaries, dependencies, and execution sequence for **Phase 3**.

---

## 2. Current System State & Phase 2 Frozen Boundary

### Protected Phase 2 Core (LOCKED — DO NOT ALTER):
1. `apps/api-gateway/src/routes/auth.routes.ts` & `RealAuthService.ts`
2. `apps/api-gateway/src/repositories/partner/LabDiagnosticsRepository.ts` & `lab-diagnostics.routes.ts`
3. `apps/api-gateway/src/services/partner/PathologyPdfGenerator.ts`
4. `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx` & `main.tsx`
5. `apps/company-platform/src/components/auth/FounderLogin.tsx` & `main.tsx`
6. `packages/database/src/schema/core/` (users, credentials, sessions, roles, memberships)
7. `packages/database/src/repositories/core/PostgresSessionStore.ts`
8. `packages/auth/src/password-service.ts` & `token-service.ts`

---

## 3. Existing Monorepo Implementation Audit Matrix

| Domain / Module | Current Classification | Gap / Limitation | Recommended Phase |
|---|:---:|---|:---:|
| **Authentication & Sessions** | `REAL + VERIFIED` | Fully verified across 32 backend tests + 8 browser CDP tests. | **Phase 1 & 2 (Frozen)** |
| **Pathology LIMS & Reporting** | `REAL + VERIFIED` | Multi-order test entry, dynamic ranges, pathologist sign-off, binary PDF, print. | **Phase 2 (Frozen)** |
| **Patient Registration & Demographics** | `PARTIALLY IMPLEMENTED` | Basic patient record exists; needs authoritative demographic validation & UHID indexing. | **Phase 3 (In-Scope)** |
| **Doctor OPD Consultation & EMR** | `PARTIALLY IMPLEMENTED` | Doctor consultation UI exists with Ambient AI UI, but needs end-to-end DB persistence for chief complaints, vitals, ICD-10 diagnosis, and clinical notes. | **Phase 3 (Primary Focus)** |
| **Electronic Prescription (e-Rx)** | `PARTIALLY IMPLEMENTED` | Rx builder UI exists; needs database persistence, dosage schedules, PMBJP Jan Aushadhi generic substitutions, and PDF generation. | **Phase 3 (Primary Focus)** |
| **Clinical Order Integration** | `PARTIALLY IMPLEMENTED` | Doctor ordering lab tests needs direct automatic piping into the verified Phase 2 LIMS queue. | **Phase 3 (Primary Focus)** |
| **Pharmacy POS & Dispensing** | `PARTIALLY IMPLEMENTED` | Dispensing UI exists; needs real inventory stock deduction against Doctor's e-Rx and invoice line items. | **Phase 4** |
| **Central Billing & Invoicing** | `PARTIALLY IMPLEMENTED` | Billing UI exists; needs consolidated ledger linking Consultation fees + Lab tests + Pharmacy charges. | **Phase 4** |
| **Inpatient ADT & Ward Nursing** | `UI ONLY` | Bed matrix and flowsheets are UI-only. | **Phase 5** |
| **Emergency / OT / Blood Bank** | `UI ONLY` | Operation theater, trauma queue, and blood cross-matching are UI mock. | **Phase 6** |
| **ABDM / FHIR M1, M2, M3** | `API ONLY` | ABDM milestone wrappers exist; awaiting NHA production gateway bridge. | **Phase 7** |
| **Company SaaS HQ Governance** | `PARTIALLY IMPLEMENTED` | Founder auth is real; SaaS subscription billing & tenant provisioning needs DB wiring. | **Phase 8** |

---

## 4. Phase 3 Recommended Primary Objective

### **PRIMARY OBJECTIVE: DOCTOR OPD CONSULTATION & EMR + ELECTRONIC PRESCRIPTION (e-Rx) + AUTOMATED DIAGNOSTIC ORDERING**

### *Why this is the exact next product layer*:
In hospital operations, diagnostic investigations do not happen in isolation. They are ordered during the **Doctor-Patient Consultation**.
By implementing the complete Doctor Consultation & EMR layer:
1. A Doctor (**Dr. Rajesh Sharma, MD**) examines the patient (**Rahul Kumar, MRN-84920**).
2. The Doctor records **Vitals** (BP: 120/80, Pulse: 72, SpO2: 98%, Temp: 98.4°F), **Chief Complaints**, and **ICD-10 Diagnosis** (`E11.9 - Type 2 Diabetes Mellitus`).
3. The Doctor generates an **Official Electronic Prescription (e-Rx)** with drug dosages (e.g. *Metformin 500mg BD*, *Atorvastatin 10mg OD*) with Jan Aushadhi generic pricing.
4. The Doctor directly places **Diagnostic Orders** (`CBC`, `Lipid Profile`, `FBS`) which **automatically appear in the verified Phase 2 Pathology LIMS queue**.
5. Generates an authentic **Medical Prescription PDF / Direct A4 Print**.

---

## 5. In-Scope vs Out-of-Scope for Phase 3

### ✅ In-Scope:
1. **Patient Registration & Queue Triage**:
   - Create/Search patient with authoritative UHID (`MRN-84920`).
   - OPD Queue token assignment (`TOKEN-OPD-001`).
2. **Doctor Clinical Consultation & EMR**:
   - Vitals recording & automated BMI calculation.
   - Clinical notes, history of present illness (HPI), physical findings.
   - ICD-10 coded diagnosis search and selection.
3. **Electronic Prescription (e-Rx) Engine**:
   - Structured medication ordering (Drug name, Form, Strength, Frequency, Duration, Instructions).
   - PMBJP Jan Aushadhi generic alternative lookup and price comparison.
   - Digital Doctor signature & DMC medical registration stamping.
4. **Automated Clinical Order Placement**:
   - Direct ordering of Lab Investigations linking to Phase 2 LIMS (`lab.orders`).
5. **Prescription Document Generation**:
   - ISO 32000-1 Binary Prescription PDF (`GET /api/v1/partner/clinical/prescriptions/:id/pdf`).
   - Clean A4 `@media print` layout for physical prescription printing.
6. **Session & History Persistence**:
   - Patient Medical Record (EMR) history shows all past consultations, diagnoses, and prescriptions.

### 🚫 Out-of-Scope (Deferred to Future Phases):
- IPD Admission & Bed Allocations (Phase 5).
- Operation Theatre (OT) Surgery Scheduling (Phase 6).
- Blood Bank Cross-matching (Phase 6).
- Full TPA Insurance Adjudication & Pre-Auth (Phase 4).
- Production ABDM NHA Gateway Push (Phase 7).

---

## 6. Required Database Entities & Schema Mapping

The database already has `packages/database/src/schema/clinical/index.ts`. Phase 3 will utilize:
- `clinical.encounters` — OPD consultation encounters
- `clinical.vitals` — Temperature, pulse, blood pressure, SpO2, BMI
- `clinical.diagnoses` — ICD-10 clinical diagnosis records
- `clinical.prescriptions` & `clinical.prescription_items` — e-Rx medications, dosage, frequency
- `clinical.investigation_orders` — Lab & Radiology orders linked to `lab.orders`

---

## 7. Required API Gateway Endpoints for Phase 3

| Method | Endpoint Path | Description | RBAC Permission |
|---|---|---|---|
| `POST` | `/api/v1/partner/clinical/encounters` | Start OPD consultation encounter | `clinical:encounters:create` |
| `POST` | `/api/v1/partner/clinical/encounters/:id/vitals` | Record patient vitals | `clinical:vitals:create` |
| `POST` | `/api/v1/partner/clinical/encounters/:id/diagnoses` | Record ICD-10 diagnoses | `clinical:diagnoses:create` |
| `POST` | `/api/v1/partner/clinical/prescriptions` | Create and finalize e-Prescription | `clinical:prescriptions:create` |
| `GET` | `/api/v1/partner/clinical/prescriptions/:id/pdf` | Generate authentic binary Prescription PDF | `clinical:prescriptions:read` |
| `POST` | `/api/v1/partner/clinical/encounters/:id/orders` | Order diagnostic investigations into LIMS | `clinical:orders:create` |
| `GET` | `/api/v1/partner/clinical/patients/:id/history` | Retrieve full patient clinical timeline & EMR | `clinical:records:read` |

---

## 8. Definition of Done for Phase 3

Phase 3 will be considered complete ONLY when:
1. **Doctor Authentication**: Real database login as Dr. Rajesh Sharma, MD (`doctor.rajesh@docsearch.health` / `DoctorPass123!`).
2. **Consultation Workflow**: Consultation encounter created, vitals recorded, ICD-10 diagnosis saved to PostgreSQL.
3. **e-Prescription Creation**: Prescription saved with structured dosages, generic substitutions, and doctor digital signature.
4. **LIMS Bridge Verification**: Lab investigations ordered from the consultation automatically appear in the Phase 2 Pathology Workbench without data loss.
5. **Prescription PDF & Print**: Authentic binary `%PDF-1.4` Prescription generated and verified alongside clean `@media print` A4 layout.
6. **Zero Regression**: Phase 1 & Phase 2 verification suites remain **100% PASS (0 Failures)**.
7. **Chrome CDP Browser Acceptance**: Real Chrome browser executes the full Doctor OPD journey end-to-end.

---

## 9. Recommended Implementation Order
```
Step 1: Patient OPD Queue & Consultation Encounter API + UI
                     ↓
Step 2: Vitals & Clinical Examination Persistence
                     ↓
Step 3: ICD-10 Diagnosis Search & Recording
                     ↓
Step 4: Structured e-Prescription (e-Rx) Engine & Jan Aushadhi Generic Sync
                     ↓
Step 5: Diagnostic Investigation Ordering Bridge to Phase 2 LIMS
                     ↓
Step 6: Prescription PDF Generation & A4 Direct Print Layout
                     ↓
Step 7: Patient Clinical EMR History Timeline
                     ↓
Step 8: Automated Regression + Real Chrome Browser CDP Verification
```
