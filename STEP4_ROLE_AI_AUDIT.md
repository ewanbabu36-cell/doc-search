# STEP 4 — ROLE AI AUDIT REPORT
## PREMIUM AI — ROLE-AWARE AI AUTHORIZATION & CAPABILITY MATRIX

**Document Version**: 1.0.0  
**Status**: APPROVED & CERTIFIED  
**Auditor**: Senior Principal Engineer + AI Security Architect  
**Baseline Commit**: `85b28bf8f1dc48f63efb92b6593faa1149d27bd1`  

---

## A. Existing Roles

The platform enforces a normalized 9-role authorization topology defined in `apps/api-gateway/src/ai/role-context.ts`, deterministically resolved from the cryptographically verified JWT `SessionContext.roles`:

| Platform Role | System Roles Mapped | Primary Domain | Default Scope |
| :--- | :--- | :--- | :--- |
| **OWNER** | `SUPER_ADMIN`, `COMPANY_ADMIN`, `OWNER`, `HOSPITAL_OWNER` | Executive & Commercial Operations | `ORGANIZATION` |
| **MANAGER** | `HOSPITAL_ADMIN`, `CLINIC_ADMIN`, `BRANCH_MANAGER`, `OPERATIONS_MANAGER` | Facility & Department Operations | `BRANCH` |
| **DOCTOR** | `DOCTOR`, `PHYSICIAN`, `ATTENDING_PHYSICIAN`, `CONSULTANT`, `CARDIOLOGIST`, `CARDIOLOGY_HOD`, `SURGEON` | Clinical Encounters & Diagnosis | `BRANCH` |
| **NURSE** | `NURSE`, `STAFF_NURSE`, `HEAD_NURSE`, `ICU_NURSE`, `ICU_INTENSIVIST` | Inpatient Care & Vitals Triage | `BRANCH` |
| **RECEPTION** | `RECEPTIONIST`, `FRONT_DESK`, `REGISTRATION_CLERK` | Patient Intake, Registration & Scheduling | `BRANCH` |
| **PHARMACY** | `PHARMACIST`, `PHARMACY_MANAGER`, `DISPENSER` | Medication Dispensing & Formulary | `BRANCH` |
| **LAB** | `LAB_TECHNICIAN`, `PATHOLOGIST`, `BIOCHEMIST`, `LAB_MANAGER` | Specimen Accessioning & Panic Labs | `BRANCH` |
| **FINANCE** | `FINANCE_MANAGER`, `BILLING_CLERK`, `ACCOUNTANT`, `FINANCE_CONTROLLER` | Invoicing, Ledgers & Collections | `ORGANIZATION` |
| **PATIENT** | `PATIENT`, `PATIENT_PORTAL_USER` | Personal Encounters & Appointments | `PATIENT_OWN` |

---

## B. Existing Permissions

Every AI invocation requires explicit permission validation evaluated via `RBACEvaluator.hasPermission(session, requiredPermission)`:

- `billing:invoices:read` — Revenue & ledger analytics access
- `partners:read` — Cross-partner & facility analytics access
- `clinical:encounters:read` — Department queue & occupancy overview
- `inventory:read` — Supply stock & reorder tracking
- `clinical:consultations:read` — Consultation history & notes summarization
- `clinical:consultations:create` — Clinical documentation & care plan drafting
- `ai_copilot:soap:generate` — Real-time speech-to-SOAP generation
- `ai_copilot:soap:approve` — Attending physician clinical sign-off
- `ai_copilot:ddi:evaluate` — Pharmacodynamic drug-drug interaction checking
- `ai_copilot:ddi:override` — Physician justification override for DDI warnings
- `clinical:vitals:read` — Nursing triage & vital trends
- `ai_copilot:sepsis:evaluate` — NEWS2 scoring & early warning surveillance
- `appointments:read` — Front desk queue & scheduling lookups
- `patients:create` — Patient demographic check-in assistance
- `pharmacy:dispense:read` — Dispensing guideline verification
- `pharmacy:inventory:read` — Near-expiry batch & stock radar
- `lab:orders:read` — Specimen accessioning queue lookups
- `ai_copilot:panic:read` — Diagnostic panic threshold alert generation
- `patient:portal:read` — Patient self-service visit preparation

---

## C. Existing AI Capabilities

Registered in `apps/api-gateway/src/ai/capability-registry.ts`:

1. `OWNER_REVENUE_INTELLIGENCE` (Financial / Tenant Scope / Read)
2. `OWNER_ORGANIZATION_ANALYTICS` (Operational / Tenant Scope / Read)
3. `MANAGER_OPERATIONAL_OVERVIEW` (Operational / Branch Scope / Read)
4. `MANAGER_INVENTORY_ALERTS` (Operational / Branch Scope / Read)
5. `DOCTOR_ENCOUNTER_SUMMARY` (Clinical / Branch Scope / Suggest)
6. `DOCTOR_CLINICAL_DOCUMENTATION` (Clinical / Branch Scope / Draft / HITL)
7. `CLINICAL_AMBIENT_SCRIBE` (Clinical / Branch Scope / Draft / HITL)
8. `DRUG_INTERACTION_CDSS` (Clinical / Branch Scope / Suggest)
9. `NURSE_PATIENT_PREPARATION` (Clinical / Branch Scope / Suggest)
10. `SEPSIS_EARLY_WARNING_CDSS` (Clinical / Branch Scope / Execute / HITL)
11. `RECEPTION_APPOINTMENT_ASSISTANCE` (Operational / Branch Scope / Read)
12. `RECEPTION_PATIENT_REGISTRATION` (Operational / Branch Scope / Read)
13. `PHARMACY_PRESCRIPTION_ASSISTANCE` (Clinical / Branch Scope / Suggest)
14. `PHARMACY_INVENTORY_ALERTS` (Operational / Branch Scope / Read)
15. `LAB_SAMPLE_WORKFLOW` (Diagnostic / Branch Scope / Read)
16. `DIAGNOSTIC_PANIC_ALERT` (Diagnostic / Branch Scope / Execute / HITL)
17. `FINANCE_BILLING_ANALYTICS` (Financial / Tenant Scope / Read)
18. `PATIENT_VISIT_GUIDANCE` (Operational / Patient Own Scope / Read)

---

## D. Existing Tools

Registered in `apps/api-gateway/src/ai/tool-registry.ts` with strict Zod input and output validation:

- `get_owner_revenue_summary` (Action: `READ`, Scope: Tenant, Role: Owner)
- `get_manager_operations_summary` (Action: `READ`, Scope: Branch, Role: Manager)
- `get_patient_clinical_history` (Action: `READ`, Scope: Branch, Role: Doctor)
- `get_clinical_transcript` (Action: `READ`, Scope: Branch, Role: Doctor)
- `lookup_drug_interactions` (Action: `SUGGEST`, Scope: Branch, Roles: Doctor, Pharmacy)
- `get_nurse_care_checklist` (Action: `SUGGEST`, Scope: Branch, Role: Nurse)
- `get_patient_vitals` (Action: `READ`, Scope: Branch, Roles: Doctor, Nurse)
- `get_reception_queue_schedule` (Action: `READ`, Scope: Branch, Role: Reception)
- `get_pharmacy_inventory_status` (Action: `READ`, Scope: Branch, Role: Pharmacy)
- `get_lab_pending_orders` (Action: `READ`, Scope: Branch, Role: Lab)
- `lookup_critical_lab_values` (Action: `EXECUTE_WITH_APPROVAL`, Scope: Branch, Role: Lab, HITL: Yes)
- `get_finance_outstanding_invoices` (Action: `READ`, Scope: Tenant, Role: Finance)
- `get_patient_personal_appointments` (Action: `READ`, Scope: Patient Own, Role: Patient)

---

## E. Existing Data Scopes

- `ORGANIZATION` (Tenant-wide aggregated data; Owner and Finance only)
- `BRANCH` (Scoped strictly to authenticated `session.branchId`; Doctor, Nurse, Reception, Pharmacy, Lab, Manager)
- `PATIENT_OWN` (Scoped strictly to `session.userId` / authenticated MRN; Patient only)

---

## F. Existing HITL Requirements

Enforced by Gate 9 in `AiPermissionFirewall.ts`:
- Clinical commitments, panic alert broadcasts, and diagnostic note sign-offs require verified clinician approval (`isApprovalGranted === true`).
- Forged approver tokens (where `approverId !== session.userId`) fail closed (`HTTP 403`).
- Approval capability mismatch (e.g. approval granted for Sepsis CDSS attempted on Scribe) fails closed (`HTTP 403`).
- Non-clinician users (e.g. nurses, clerks) attempting to forge physician approvals fail closed (`HTTP 403`).

---

## G. Existing Commercial Entitlement Checks

Enforced by Gate 8 in `AiPermissionFirewall.ts`:
- Calls `entitlementService.canAccess(session, 'MODULE_AI_COPILOT')`.
- Tenants on expired subscriptions or plans lacking the AI Copilot module fail closed (`HTTP 403`).
- Payload flags attempting to bypass entitlement (e.g., `bypassEntitlement: true`) are strictly ignored.

---

## H. Existing Audit Controls

- Append-only persistent database audit logging via `auditRepository.recordEvent`.
- SHA-256 cryptographic chaining with `previousHash` linking.
- Zero credentials, tokens, or JWTs logged.
- Failed firewall decisions logged with exact `failedGate` and `denialReason`.

---

## I. Security Gaps

- **Cross-Role Escalation**: Mitigated via Gate 4.5 in `AiPermissionFirewall`.
- **Patient Cross-Access**: Mitigated via Gate 4.6 in `AiPermissionFirewall`.
- **Direct Tool Bypass**: Mitigated via Tool Registry allowlisting and Capability Registry coupling.

---

## J. Missing Role/Capability Mappings

- All 9 platform roles have explicit, unambiguous mappings.
- No unregistered or floating capabilities exist.

---

## K. Duplicate or Conflicting Authorization Logic

- Consolidated into a single source of truth: `AiPermissionFirewall.ts` and `role-context.ts`.
