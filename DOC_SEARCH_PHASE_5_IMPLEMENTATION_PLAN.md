# DOC SEARCH — PHASE 5: CONTROLLED IMPLEMENTATION PLAN (`DOC_SEARCH_PHASE_5_IMPLEMENTATION_PLAN.md`)

**Phase:** Phase 5 — Patient 360 + Universal IDs + Clinical Data Continuity
**Mode:** `CONTROLLED IMPLEMENTATION MODE (P0 & P1 PRIORITY)`

---

## 1. Prioritized Gap Classification (`P0 / P1 / P2 / P3`)

| Priority | Gap ID | Description | Resolution in Phase 5 |
|---|---|---|---|
| **P0** | `P5-GAP-01` | **Duplicate MRN Collision (`ClinicalWorkflowRepository.ts:704`)**: Supplying an existing MRN with a different patient's demographics silently returned the existing patient record instead of blocking the MRN collision. | Enforce demographic match check on MRN collision; return `409 Conflict (DUPLICATE_MRN_COLLISION)` when a different patient attempts to claim an existing MRN, while preserving idempotent retry when the same patient retries. |
| **P0** | `P5-GAP-02` | **Non-Deterministic `Math.random()` MRN / Business Identifiers**: `MRN-${Math.random()}` and `ENC-${Math.random()}` can collide under concurrent requests. | Implement a concurrency-safe, tenant-scoped monotonic sequence engine (`MRN-YYYY-NNNNNN`, `ENC-YYYY-NNNNNN`, `APT-YYYY-NNNNNN`, `TKN-DEPT-SEQ3`, `ORD-DEPT-YYYY-NNNNNN`, `ACC-YYYY-NNNNNN`, `RES-DEPT-YYYY-NNNNNN`, `RX-YYYY-NNNNNN`, `DISP-YYYY-NNNNNN`, `INV-YYYY-NNNNNN`, `TXN-YYYY-NNNNNN`, `DOC-YYYY-NNNNNN`). |
| **P0** | `P5-GAP-03` | **Cross-Entity Patient/Encounter Tampering & Orphan Clinical/Financial Records**: Orders, tasks, results, prescriptions, dispensings, documents, or transactions created without a valid `(tenantId, patientId, encounterId)` or with mismatched `patientId` vs `encounter.patientId` / `order.patientId`. | Enforce strict referential & lineage validation on every clinical/financial/document creation operation (`400`/`404`/`409`). Block parallel departmental patient creation (`403`). |
| **P1** | `P5-GAP-04` | **Patient Exit / Checkout Guard (`checkoutEncounter`)**: Permitted patient exit while critical Lab/Radiology orders were still `PENDING` or Pharmacy prescriptions were undispensed. | Upgrade `checkoutEncounter` and `Patient360ContinuityService.exitPatientEncounter` to block exit (`409 Conflict`) if pending Lab/Radiology results, undispensed prescriptions, or unpaid invoices exist (unless `forceDischarge: true` + `overrideReason` is audited). |
| **P1** | `P5-GAP-05` | **Authoritative Patient 360 Read Model, Reconstructable Patient Timeline, Document Linkage & Complete Data Lineage Engine**: Missing unified read model across all 7 domains (`identity`, `currentState`, `clinicalHistory`, `operations`, `commercial`, `documents`, `auditLineage`) with immediate cache invalidation. | Build `Patient360ContinuityService` and `/api/v1/partner/patient-360/*` endpoints providing Steps 1–14 in dependency order. |
