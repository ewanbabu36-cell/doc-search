# DOC SEARCH — STAFF RBAC & ROUTING AUDIT TEST EXECUTION RESULTS
## Automated Forensic Test Suite Execution Log (27/27 Assertions Passed)

**Platform:** DOC SEARCH Healthcare SaaS  
**Repository:** `D:\DOC SEARCH`  
**Database:** PostgreSQL 18.4 (`127.0.0.1:5432/docsearch`)  
**API Gateway:** Fastify Service on `http://127.0.0.1:4000`  
**Test Suite Script:** `tests/certification/staff-rbac-routing-audit.test.mjs`  
**Execution Timestamp:** 2026-11-22T14:45:51Z  
**Overall Execution Result:** **27/27 PASSED (100% Success Rate)**  

---

### COMPLETE ASSERTION TRACEABILITY TABLE

| # | Test Assertion Name | Category / Task | Target Entity / Endpoint | Expected Condition | Actual Result | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :-: |
| **1** | Operational Staff Mutation Block | Task 2: Staff Management | `POST /api/v1/partner/staff/members` | HTTP 403 `FORBIDDEN_STAFF_MUTATION` for non-admin | HTTP 403 | **PASS** |
| **2** | HQ Restricted Role Assignment Blocked | Task 3: RBAC & Escalation | `POST /members` (role: `SUPER_ADMIN`) | HTTP 403 `Role is a restricted HQ platform role` | HTTP 403 | **PASS** |
| **3** | Self-Role Escalation Prevention | Task 3: RBAC (Section 18) | `PUT /members/:id` (self-mutation) | HTTP 403 `Self-role escalation is strictly forbidden` | HTTP 403 | **PASS** |
| **4** | Profile-to-Role Compatibility Guard | Task 2: Profile Validation | `POST /members` (Lab recruiting DOCTOR)| HTTP 403 `incompatible with partner facility profile` | HTTP 403 | **PASS** |
| **5** | Cross-Tenant Staff IDOR Isolation | Task 1: Tenant Security | `GET /members/:foreign_id` | HTTP 404 / 403 / data is null | HTTP 403 | **PASS** |
| **6** | Scenario A: Receptionist R1 creates appointment | Task 4: Scheduling Routing | `POST /partner/clinical/appointments` | HTTP 201 Created with valid appointment UUID | HTTP 201 | **PASS** |
| **7** | Scenario A: Database Record Verification | Task 4: PostgreSQL Persistence| `clinical.appointments_partitioned` | Row contains tenant, branch, doctor, and chamber | Row Verified | **PASS** |
| **8** | Scenario A: Doctor A can see assigned appointment | Task 5: Clinical Visibility | `GET /appointments?doctorId=DrA` | 1 record returned matching appointment ID | 1 Row (Found) | **PASS** |
| **9** | Scenario A: Doctor B schedule filter isolates Dr A | Task 5: Clinical Visibility | `GET /appointments?doctorId=DrB` | 0 records returned (Doctor B cannot see Dr A) | 0 Rows (Isolated)| **PASS** |
| **10**| Scenario A: Receptionist R1 can view branch appts | Task 5: Branch Coordination | `GET /appointments?branchId=Branch1` | 1 record returned (Branch desk coordination) | 1 Row (Found) | **PASS** |
| **11**| Scenario A: Unrelated Clinic CANNOT see appointment | Task 5: Tenant Isolation | `GET /appointments` (Beta Clinic token) | 0 records returned (Zero cross-tenant leakage) | 0 Rows (Isolated)| **PASS** |
| **12**| Scenario B: Hospital A receptionist creates appt | Task 4: Multi-Branch Routing | `POST /appointments` (Hospital North) | HTTP 201 Created at Hospital A facility | HTTP 201 | **PASS** |
| **13**| Scenario B: Hospital B receptionist isolated | Task 5: Cross-Branch Isolation | `GET /appointments?branchId=HospB` | 0 records returned (Hospital B desk cannot see A)| 0 Rows (Isolated)| **PASS** |
| **14**| Scenario B: Hospital B staff cross-branch IDOR blocked| Task 5: ScopeGuard Guard | `GET /appointments?branchId=HospA` | HTTP 403 `BRANCH_ACCESS_DENIED` | HTTP 403 | **PASS** |
| **15**| Scenario B: Org Admin has authorized org visibility | Task 5: Enterprise Oversight | `GET /appointments` (Org Admin token) | Both Hospital A and Hospital B appointments seen | 2 Rows (Found) | **PASS** |
| **16**| Scenario C: Scheduled Appt without Doctor Fails Closed| Task 4: Routing Fallbacks | `POST /appointments` (no doctorId) | HTTP 400 Bad Request (Validation fails closed) | HTTP 400 | **PASS** |
| **17**| Scenario C: Walk-in Encounter auto-routes attending | Task 4: Routing Fallbacks | `POST /partner/clinical/encounters` | Routes to primary attending physician & triage | Encounter Created| **PASS** |
| **18**| Scenario C: Queue Table contains triage token | Task 4: Queue Architecture | `clinical.encounter_queues` | Row exists with token in triage status | Token Verified | **PASS** |
| **19**| Scenario D: Reassignment Visibility Transfer | Task 4: Reassignment | `PUT /appointments/:id` (new doctor) | Doctor B gains visibility, Doctor A cleared | Transferred | **PASS** |
| **20**| Scenario D: Audit Event Recorded for Reassignment | Task 6: Audit Logging | `core.audit_events` | Event `APPOINTMENT_REASSIGNED` with doctor IDs | Audit Recorded | **PASS** |
| **21**| Staff Activity Audit Logs persisted in PostgreSQL | Task 6: Audit Persistence | `core.audit_events` | Events `STAFF_CREATED`, `APPOINTMENT_REASSIGNED` | Hash-Chained | **PASS** |
| **22**| Audit Metadata PHI Protection | Task 6: DPDP Compliance | `core.audit_events.metadata` | Zero raw Aadhaar, phone, or clinical notes in JSON | Clean (No PHI) | **PASS** |
| **23**| Pathology Maker-Checker Verification | Task 7: Lab Workflow | `PUT /partner/lab/orders/:id/verify` | Phlebotomist blocked with HTTP 403 FORBIDDEN | HTTP 403 | **PASS** |
| **24**| Pharmacy Separation of Duties | Task 7: Pharmacy Workflow | `POST /partner/pharmacy/dispense` | Cashier blocked from dispensing Schedule H1 | HTTP 403 | **PASS** |
| **25**| Staff Status Changed to SUSPENDED | Task 8: Staff Offboarding | `PATCH /members/:id/status` | HTTP 200 OK, status updated to SUSPENDED | HTTP 200 | **PASS** |
| **26**| PostgreSQL operational_staff employment_status check | Task 8: Database Integrity | `clinical.operational_staff` | Row has `employment_status = 'SUSPENDED'` | SUSPENDED | **PASS** |
| **27**| Historical Appointment Persistence Upon Offboarding | Task 8: Clinical Governance | `clinical.appointments_partitioned` | Appointment retained without cascade deletion | Retained | **PASS** |

---

### RAW CONSOLE EXECUTION TRANSCRIPT

```text
================================================================
DOC SEARCH — MASTER FORENSIC AUDIT: STAFF RBAC & ROUTING SUITE
================================================================

Seeding synthetic audit tenants, branches, patients, and staff profiles...
Seeding completed successfully!

--- TASK 2 & 3: STAFF MANAGEMENT, RBAC & PRIVILEGE ESCALATION ---
  [PASS] Operational Staff Mutation Block (requireExecutiveStaffAdmin)
  [PASS] HQ Restricted Role Assignment Blocked (SUPER_ADMIN)
  [PASS] Self-Role Escalation Prevention (Section 18 Invariant)
  [PASS] Profile-to-Role Compatibility Guard (Pathology partner cannot assign DOCTOR)
  [PASS] Cross-Tenant Staff IDOR Isolation

--- TASK 4 & 5: APPOINTMENT ROUTING & VISIBILITY SCENARIOS ---
  [PASS] Scenario A: Receptionist R1 creates appointment with Doctor A & Chamber 101
  [PASS] Scenario A: Database Record Verification (tenant_id, doctor_id, branch_id, chamber_id)
  [PASS] Scenario A: Doctor A can see their assigned appointment
  [PASS] Scenario A: Doctor B schedule filter isolates Dr A appointment
  [PASS] Scenario A: Receptionist R1 can view branch appointments for coordination
  [PASS] Scenario A: Unrelated Clinic (Beta Clinic) CANNOT see Clinic A appointment
  [PASS] Scenario B: Hospital A receptionist creates appointment at Hospital A
  [PASS] Scenario B: Hospital B receptionist CANNOT view Hospital A appointments
  [PASS] Scenario B: Hospital B staff cross-branch IDOR query BLOCKED (403 BRANCH_ACCESS_DENIED)
  [PASS] Scenario B: Organization Administrator has authorized org-wide visibility
  [PASS] Scenario C: Scheduled Appointment without Doctor Fails Closed (Validation 400, No Broadcast)
  [PASS] Scenario C: Walk-in Encounter created without Doctor (Routes to Primary Attending & Triage Queue)
  [PASS] Scenario C: Queue Table contains triage token for encounter
  [PASS] Scenario D: Reassignment Visibility Transfer (Dr B gains visibility, Dr A active slot cleared)
  [PASS] Scenario D: Audit Event Recorded for Reassignment with Actor & Reason

--- TASK 6: STAFF ACTIVITY AUDIT & PHI PROTECTION ---
  [PASS] Staff Activity Audit Logs persisted in PostgreSQL
  [PASS] Audit Metadata PHI Protection (No raw Aadhaar or diagnosis leakage)

--- TASK 7: PATHOLOGY & PHARMACY WORKFLOW ISOLATION ---
  [PASS] Pathology Maker-Checker: Phlebotomist cannot verify credentials or release lab results
  [PASS] Pharmacy Separation: Cashier cannot alter staff status or dispense Schedule H1 narcotics

--- TASK 8: STAFF OFFBOARDING & SESSION REVOCATION ---
  [PASS] Staff Status Changed to SUSPENDED by Partner Admin
  [PASS] PostgreSQL operational_staff employment_status is SUSPENDED
  [PASS] Historical Appointment Persistence upon Staff Offboarding (No cascade delete)

================================================================
AUDIT TEST EXECUTION COMPLETE: 27/27 ASSERTIONS PASSED
================================================================
```

Certified Forensic State: **100% EMPIRICAL VERIFICATION COMPLETE**
