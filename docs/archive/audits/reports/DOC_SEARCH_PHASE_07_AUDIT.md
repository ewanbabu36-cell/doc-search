# DOC SEARCH — PHASE 07: CLINICAL ENCOUNTER EXECUTION & OPD CONSULTATION ENGINE AUDIT, GAP MATRIX & DESIGN

**Document ID**: `DOC_SEARCH_PHASE_07_AUDIT.md`  
**Phase**: Phase 07 — Clinical Encounter Execution & OPD OneFlow Consultation Engine  
**Lifecycle Stage**: `AUDIT → EVIDENCE → GAP → DESIGN`  
**Baseline Verified**: Phases 01–06 Frozen & Verified (`0` P0/P1 blockers, `10/10` Phase 06 test assertions passing)  

---

## 1. Architectural Chain & Dependency Direction

In strict accordance with the DOC SEARCH master architectural dependency order:

$$\text{Partner (P02)} \longrightarrow \text{Identity / RBAC / ABAC (P03)} \longrightarrow \text{Workflow Engine (P04)} \longrightarrow \text{Patient 360 (P05--06)}$$
$$\Big\downarrow$$
$$\mathbf{Clinical\ Encounter\ Execution\ (OPD\ /\ EMR\ /\ Consultation)\ [PHASE\ 07]}$$
$$\Big\downarrow$$
$$\text{Orders\ (Rx\ /\ Lab\ /\ Rad)} \longrightarrow \text{Dispensing\ /\ Results} \longrightarrow \text{Billing\ /\ Ledger} \longrightarrow \text{Audit}$$

Phase 07 addresses the pivotal clinical execution core: where the doctor meets the patient, documents findings and ICD-10 diagnoses, records objective vitals, issues digital e-prescriptions, orders investigations, and atomically finalizes the encounter.

---

## 2. STEP 1 — Evidence-Based Domain Audit

### 2.1 Database & Schema Audit

| Table / Entity | Schema Path | Persistence Mechanism | Status | Notes |
|---|---|---|---|---|
| `clinical.consultations` | `packages/database/src/schema/clinical.ts` | PostgreSQL (`id`, `tenantId`, `partnerId`, `encounterId`, `patientId`, `doctorId`, `consultationNumber`, `status`, `chiefComplaint`, `vitals`, `diagnoses`, `medications`, `labInvestigations`, `followupDate`) | **VERIFIED WORKING** | Fully mapped in Drizzle ORM and embedded PostgreSQL engine. |
| `clinical.encounters` | `packages/database/src/schema/clinical.ts` | PostgreSQL (`id`, `tenantId`, `patientId`, `doctorId`, `encounterNumber`, `status`, `encounterType`, `visitType`) | **VERIFIED WORKING** | Enforces tenant scoping and lifecycle transitions (`CHECKED_IN` $\to$ `IN_CONSULTATION` $\to$ `COMPLETED`). |
| `clinical.queue_tokens` | `packages/database/src/schema/clinical.ts` | PostgreSQL (`id`, `tenantId`, `encounterId`, `tokenNumber`, `queueDate`, `queueStatus`, `estimatedWaitMinutes`) | **VERIFIED WORKING** | Orchestrates OPD patient queuing and token completion. |
| `pharmacy.prescriptions` | `packages/database/src/schema/pharmacy.ts` | PostgreSQL (`id`, `tenantId`, `prescriptionNumber`, `patientId`, `encounterId`, `consultationId`, `prescribingDoctorId`, `status`) | **VERIFIED WORKING** | Generates digital prescription ledger on consultation finalization. |
| `pharmacy.pharmacy_dispensing` | `packages/database/src/schema/pharmacy.ts` | PostgreSQL (`id`, `tenantId`, `dispensingNumber`, `prescriptionId`, `patientId`, `dispensingStatus`) | **VERIFIED WORKING** | Automatically queued in `PENDING` status upon consultation completion. |
| `diagnostics.investigation_orders` | `packages/database/src/schema/diagnostics.ts` | PostgreSQL (`id`, `tenantId`, `orderNumber`, `encounterId`, `patientId`, `testName`, `status`) | **VERIFIED WORKING** | Queued upon consultation finalization if lab/radiology tests ordered. |
| `core.audit_events` | `packages/database/src/schema/core.ts` | PostgreSQL (`id`, `tenantId`, `eventType`, `resourceType`, `resourceId`, `actorId`, `timestamp`) | **VERIFIED WORKING** | Append-only tamper-evident audit logging inside security context. |

### 2.2 API Gateway & Backend Services Audit

| Component | Path | Methods & Capabilities | Status | Notes |
|---|---|---|---|---|
| `clinical-workflow.routes.ts` | `apps/api-gateway/src/routes/partner/clinical-workflow.routes.ts` | `POST /api/v1/partner/clinical/consultations`<br>`GET /api/v1/partner/clinical/consultations/:id`<br>`POST /api/v1/partner/clinical/consultations/:id/complete`<br>`GET /api/v1/partner/clinical/queues`<br>`POST /api/v1/partner/clinical/queues`<br>`GET /api/v1/partner/clinical/encounters/:id` | **VERIFIED WORKING** | Robust, validated with Zod schemas (`SaveConsultationSchema`), RBAC (`requirePermission`), commercial guards (`requireActiveCommercialAccess`), and idempotency (`enforceIdempotency`). |
| `ClinicalWorkflowService.ts` | `apps/api-gateway/src/services/partner/ClinicalWorkflowService.ts` | `saveConsultation`, `finalizeConsultation`, `completeConsultationWorkflow`, `getConsultationById`, `searchConsultations` | **VERIFIED WORKING** | Runs inside `withSecurityContext` transaction, orchestrating consultation finalization, encounter completion, queue closing, e-Rx generation, pharmacy dispensing queuing, and audit recording. |
| `ClinicalWorkflowRepository.ts` | `apps/api-gateway/src/repositories/partner/ClinicalWorkflowRepository.ts` | Lines 2351–2575: `completeConsultationWorkflow` | **VERIFIED WORKING** | Atomic multi-table persistence across 6 clinical domains in a single PostgreSQL transaction. |

### 2.3 Frontend Platform & Client Services Audit (The Smoking Guns)

| Component | Path | Discovered Implementation | Classification | Concrete Findings & Evidence |
|---|---|---|---|---|
| `OpdOneFlowExpressView.tsx` | `apps/partner-platform/src/components/views/OpdOneFlowExpressView.tsx` | Lines 294–321: `handleNextPatient` auto-advances using client timer and hardcoded mock patients (`Sunita Devi`, `Anil Verma`, random `Math.floor` UHIDs). Never calls the backend API to persist consultations or complete queue tokens. | **BROKEN / UI-ONLY** | Violates "Zero mock runtime data" and "Zero-state truth". Bypasses PostgreSQL persistence. |
| `clinical-consultation-service.ts` | `apps/partner-platform/src/services/clinical-consultation-service.ts` | Line 189: `if (res.success && Array.isArray(res.data) && res.data.length > 0) return res.data;`<br>Lines 88–92: `loadStored("docsearch_consultations", MOCK_CONSULTATIONS)`<br>Lines 1148–1165: Offline localStorage fallback writes mock prescriptions for `Rahul Kumar` and hardcoded branch UUID. | **BROKEN / MOCK LEAKAGE** | Treats legitimate zero-state server responses (`res.data = []`) as failure, falling back to mock consultations in localStorage. |
| `SoloDoctorOpdCockpitView.tsx` | `apps/partner-platform/src/components/views/SoloDoctorOpdCockpitView.tsx` | Props-driven clinical cockpit with rich UI templates, ICD-10 search, prescription drafting, and event dispatch. | **PARTIAL** | UI is functional when provided real props, but relies on caller (`ClinicalConsultationDomainManager`) to wire real backend API. |

---

## 3. STEP 2 — Gap Matrix

| Gap ID | Domain | Root Cause / Evidence | Classification & Risk | Required Controlled Fix | Priority | Verification Method |
|---|---|---|---|---|---|---|
| `GAP-P07-01` | OPD OneFlow Express Execution | `OpdOneFlowExpressView.tsx#L294-L321`: `handleNextPatient` creates synthetic patients (`Sunita Devi`, `Anil Verma`), random UHIDs (`UHID-2026-XXXX`), and never calls the backend API Gateway. | **BROKEN** (High Risk: Fabricated data in production clinical cockpit) | Purge all synthetic mock patient generators. Wire `handleNextPatient` directly to backend `saveConsultation` and `completeConsultationWorkflow` APIs. Load real OPD queue from `/api/v1/partner/clinical/queues`. | **P0** | Automated E2E verification test suite & component verification |
| `GAP-P07-02` | Zero-State Truth & LocalStorage Fallback | `clinical-consultation-service.ts#L189`: Condition `res.data.length > 0` causes empty server responses (`[]`) for new tenants to fall back to `MOCK_CONSULTATIONS` in `localStorage`. Lines 1148–1165 write `Rahul Kumar` mock prescriptions to `localStorage`. | **BROKEN** (High Risk: Corrupts zero-state for new partners) | If `res.success && Array.isArray(res.data)`, return `res.data` unconditionally (preserving zero-state). Eliminate `MOCK_CONSULTATIONS` and synthetic `Rahul Kumar` localStorage writes when `!isMockFallbackAllowed()`. | **P0** | Zero-state automated tests in `phase7-clinical-encounter-execution.test.mjs` |
| `GAP-P07-03` | Real OPD Queue Integration | `OpdOneFlowExpressView.tsx` relied on an in-memory `hospitalEventBus` rather than polling or fetching the live backend queue (`GET /api/v1/partner/clinical/queues`). | **PARTIAL** (Operational Disconnect) | Integrate `fetchLiveQueue()` on mount. If 0 tokens wait in the queue, render certified Zero-State UI with 0 counts. | **P1** | Zero-state queue test & component mount assertion |
| `GAP-P07-04` | Atomic Downstream Workflow Orchestration | Consultation completion must atomically transition: Consultation (`FINALIZED`) $\to$ Encounter (`COMPLETED`) $\to$ Queue Token (`COMPLETED`) $\to$ Prescription (`ISSUED`) $\to$ Pharmacy Queue (`PENDING`) $\to$ Lab Orders (`PENDING`) $\to$ Audit Trail. | **PARTIAL** (Backend ready, needs comprehensive end-to-end regression & failure verification) | Verify atomic rollback on database failure, idempotent re-try semantics, and longitudinal timeline reflection. | **P1** | Automated test Groups B, C, G in `phase7-clinical-encounter-execution.test.mjs` |
| `GAP-P07-05` | Commercial & Role Authorization | Denied roles (e.g. `NURSE` or `BILLING_EXECUTIVE` attempting to finalize doctor consultation) or expired commercial plans must fail closed (`403`). Inactive staff or revoked tokens must be rejected (`401`/`403`). | **PARTIAL** (Guard integration needs multi-tenant automated proof) | Implement comprehensive tests verifying IDOR blocking, tenant isolation, role enforcement, and commercial plan locking on all `/clinical/consultations` endpoints. | **P1** | Automated test Groups D, E, F in `phase7-clinical-encounter-execution.test.mjs` |

---

## 4. STEP 3 — Architectural Design & Controlled Implementation Plan

### 4.1 Live OPD OneFlow Execution Architecture

```
[Doctor in OpdOneFlowExpressView]
           │
           │ 1. Mount: GET /api/v1/partner/clinical/queues
           ▼
[Backend Clinical Queue] ──(If empty)──► [Certified Zero-State UI (0 Patients)]
           │
           │ 2. Patient Selected (Real UHID, Token, Encounter)
           ▼
[Doctor Enters Notes, Vitals, ICD-10 Diagnoses, Medicines, Labs]
           │
           │ 3. Click "Complete & Next Patient"
           ▼
[POST /api/v1/partner/clinical/consultations] (Save Draft / Active Consultation)
           │
           │ 4. Atomic Workflow Execution
           ▼
[POST /api/v1/partner/clinical/consultations/:id/complete]
           │
           ├──► 1. Finalize Consultation (status: 'FINALIZED')
           ├──► 2. Update Encounter (status: 'COMPLETED')
           ├──► 3. Complete Queue Token (status: 'COMPLETED')
           ├──► 4. Generate Digital Prescription (status: 'ISSUED')
           ├──► 5. Insert Pharmacy Dispensing Queue Item (status: 'PENDING')
           ├──► 6. Insert Diagnostic Lab Investigation Orders (status: 'PENDING')
           ├──► 7. Record Immutable Audit Events in core.audit_events
           │
           ▼
[Fetch Next Real Waiting Token in Queue] ──(If none)──► [Zero-State UI]
```

### 4.2 Non-Negotiable Engineering Invariants
1. **Zero Mock Tolerance**: `Sunita Devi`, `Anil Verma`, `Rahul Kumar`, random `Math.floor` UHIDs, and `MOCK_CONSULTATIONS` are strictly removed from operational production execution paths.
2. **Fail-Closed Multi-Tenancy**: Every consultation query and mutation must enforce `session.tenantId` matching. IDOR attempts across tenants or partners must yield HTTP `403`.
3. **Role & Commercial Discipline**: Only licensed doctors and authorized clinical admins can finalize consultations. Inactive staff, expired temporal roles, and suspended/expired commercial licenses fail closed (`403`).
