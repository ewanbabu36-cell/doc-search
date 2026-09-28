# DOC SEARCH — PHASE 5: PATIENT 360 ARCHITECTURE AUDIT (`DOC_SEARCH_PHASE_5_PATIENT_360_ARCHITECTURE_AUDIT.md`)

**Phase:** Phase 5 — Patient 360 + Universal IDs + Clinical Data Continuity
**Status:** `AUDIT & GAP ANALYSIS COMPLETE`

---

## 1. Repository Audit Findings (Database, Backend, Frontend, API Contracts)

### A. Database & Schema Audit (`packages/database/src/schema/clinical/index.ts`)
- **Patient Master (`clinical.patients`)**: Holds `id` (`UUID`), `tenant_id`, `partner_id`, `organization_id`, `branch_id`, `patient_code`, `mrn`, `first_name`, `last_name`, `date_of_birth`, `gender`, `blood_group`, `status`, and `metadata`. Contact details are stored in `clinical.patient_contacts` (`primary_mobile`, `email`, `address`).
- **Encounter & Visit Decision (`clinical.encounters`)**: `Visit` and `Encounter` are consolidated into `clinical.encounters` where `encounter_type` (`OPD`, `WALK_IN`, `APPOINTMENT`, `FOLLOW_UP`, `EMERGENCY`, `IPD`) represents the clinical interaction subtype. No separate duplicate `visits` table should be created.
- **Queues & Tokens (`clinical.encounter_queues`)**: Stores `token_number` contextual to `(tenant_id, branch_id, department_id, queue_date)`.

### B. Backend Continuity & Identity Gaps Identified
1. **P0 — Duplicate MRN Collision (`ClinicalWorkflowRepository.ts:704-728`)**:
   - When `input.mrn` matched an existing patient in the tenant, `createPatient` returned the existing patient without verifying whether `firstName`/`lastName`/`dateOfBirth` belonged to the same person. If an operator or external client supplied an existing MRN (`MRN-000123`) for a *different* patient, it silently collided with the existing patient instead of rejecting with `409 Conflict (DUPLICATE_MRN_COLLISION)`.
2. **P0 — Non-Deterministic MRN / Business Numbering (`ClinicalWorkflowRepository.ts:770, 1178`)**:
   - `Math.random()` 6-digit MRNs and encounter numbers (`MRN-${Math.floor(100000 + Math.random() * 900000)}`) risk collisions under concurrency. Phase 5 replaces this with a concurrency-safe, tenant-scoped monotonic sequence generator (`MRN-2026-000001`, `ENC-2026-000001`, `APT-2026-000001`, `TKN-OPD-001`, `ORD-LIMS-2026-000001`, `ACC-2026-000001`, `RES-LIMS-2026-000001`, `RX-2026-000001`, `DISP-2026-000001`, `INV-2026-000001`, `TXN-2026-000001`, `DOC-2026-000001`).
3. **P0 — Cross-Entity Patient/Encounter Tampering & Orphan Record Prevention**:
   - Creating an Order, Task, Result, Prescription, Dispensing record, Financial Transaction, or Document without a valid `patientId` + `encounterId` in the same tenant, or where `encounter.patientId !== input.patientId` or `order.patientId !== input.patientId`, must be strictly rejected (`400`/`404`/`409`).
   - Department modules (`LIMS`, `RADIOLOGY`, `PHARMACY`, `BILLING`) must be prohibited from creating parallel departmental patient records (`403 PARALLEL_PATIENT_CREATION_FORBIDDEN`).
4. **P1 — Patient Exit / Checkout Guard (`ClinicalWorkflowRepository.ts:2748`)**:
   - `checkoutEncounter` checked unpaid invoices but did not block exit when pending Lab/Radiology results or unfulfilled Pharmacy dispensing existed. Phase 5 enforces pending-result and pending-dispensing guards on Patient Exit unless an explicit audited clinical override (`forceDischarge: true` + `overrideReason`) is supplied.
5. **P1 — Authoritative Patient 360 Read Model & Reconstructable Patient Timeline**:
   - `Patient 360` must aggregate all 7 domains (`identity`, `currentState`, `clinicalHistory`, `operations`, `commercial`, `documents`, `auditLineage`) and reconstruct the chronological `PatientTimeline` directly from persisted source-of-truth records (`patientId`, `encounterId`, `sourceType`, `sourceId`, `departmentId`, `staffId`, `timestamp`, `eventType`, `status`), with immediate cache invalidation on any clinical/financial/document mutation so stale Patient 360 data is never served.
