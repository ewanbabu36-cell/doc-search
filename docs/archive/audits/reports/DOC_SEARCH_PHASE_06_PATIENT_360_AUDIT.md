# DOC SEARCH — PHASE 06: PATIENT 360 ARCHITECTURE AUDIT, GAP MATRIX & DESIGN

**Document ID**: `DOC_SEARCH_PHASE_06_PATIENT_360_AUDIT.md`
**Phase**: Phase 06 — Patient 360 Engine
**Lifecycle Stage**: `AUDIT → GAP → DESIGN`
**Baseline Verified**: Phases 01–05 Frozen & Verified (`0` P0/P1 blockers)

---

## 1. STEP 1 — PATIENT 360 ARCHITECTURE AUDIT

### 1.1 Patient Identity & Schema Audit

| Component | Repository Path | Current Implementation | Classification |
|---|---|---|---|
| PostgreSQL Patient Master (`patients` & `patient_contacts`) | `packages/database/src/schema/clinical.ts` & `ClinicalWorkflowRepository.ts` | Stores `id` (UUID PK), `tenantId`, `partnerId`, `organizationId`, `branchId`, `mrn`, `patientCode`, `firstName`, `lastName`, `gender`, `dateOfBirth`, `bloodGroup`, `status`, `metadata`. Enforces tenant-scoped MRN uniqueness (`409 Conflict`). | **WORKING** |
| Canonical Patient 360 Service (`Patient360ContinuityService`) | `apps/api-gateway/src/services/partner/Patient360ContinuityService.ts` | Enforces `CanonicalPatientRecord` with immutable `patientId` (UUID), `patientCode` (`PAT-YYYY-NNNNNN`), `mrn` (`MRN-YYYY-NNNNNN`), phone normalization, demographic deduplication, and blocks downstream departments (`LIMS`, `RADIOLOGY`, `PHARMACY`, `BILLING`) from creating parallel patient identities (`403`). | **PARTIAL** (Missing `PATCH` update, `GET` list/search, and zero-state summary API on `/patient-360`) |
| Duplicate Patient Handling | `apps/api-gateway/src/services/partner/Patient360ContinuityService.ts` | Idempotent replay if exact same `(firstName, lastName, dateOfBirth)` + `(mrn or mobileNumber)`; throws `409 CONFLICT` if same MRN or same mobile number is submitted for a different person. | **WORKING** |

---

## 2. STEP 2 — PATIENT 360 GAP MATRIX

| Gap ID | Domain | Current Implementation | Evidence | Risk | Dependency | Required Change | Priority | Verification Method |
|---|---|---|---|---|---|---|---|---|
| `GAP-P06-01` | Location Scope & Adversarial Scope Override Security | `verifyActorAuthorization` passes `session.branchId` instead of `patient.branchId`, and routes ignore client-supplied `tenantId`/`partnerId`/`locationId` overrides in query/body instead of failing closed. | `Patient360ContinuityService.ts#L520-L526`, `patient-360-continuity.routes.ts` | Cross-branch (`Branch A → Branch B`) access or silent scope override attempt not rejected with `403`. | Phase 03 `IdentitySecurityFoundationService` | Enforce target `patient.branchId` (`locationId`) on every patient/encounter/360 read & write; explicitly reject any mismatched `tenantId`, `partnerId`, `branchId`, or `locationId` in query/body with HTTP `403`. | **P0** | Automated tests `B`, `C`, `D`, `I` in `phase06-patient-360-verification.test.mjs` |
| `GAP-P06-02` | Patient Master CRUD & Zero-State Contract | Missing `PATCH /api/v1/partner/patient-360/patients/:patientId` and `GET /api/v1/partner/patient-360/patients` (zero-state list/search). | `patient-360-continuity.routes.ts` | Cannot update canonical patient demographics/contacts via `/patient-360/patients/:patientId` or verify tenant zero-state list directly. | `ClinicalWorkflowRepository.updatePatient` | Add `updateCanonicalPatient()` (`PATCH /api/v1/partner/patient-360/patients/:patientId`) and `listCanonicalPatients()` (`GET /api/v1/partner/patient-360/patients`) with strict zero-state response (`0` counts across all domains for new partner). | **P0** | Automated tests `A` & `F` in `phase06-patient-360-verification.test.mjs` |
| `GAP-P06-03` | Commercial / Entitlement Control on Patient 360 | `/api/v1/partner/patient-360` exempted in `commercial-guard.ts` and `Patient360ContinuityService` did not pass runtime commercial/entitlement overrides to `authorize()`. | `commercial-guard.ts#L49`, `Patient360ContinuityService.ts#L520` | Commercially suspended/expired partners or restricted entitlements could access Patient 360 if not blocked by runtime entitlement checks. | Phase 03/04 Entitlement & License Engine | Enforce partner commercial status (`ACTIVE`/`GRACE_PERIOD`) & capability entitlement (`CAP_PATIENT_MASTER` / `PATIENT_360`) inside `verifyActorAuthorization` + support runtime partner commercial state enforcement. | **P1** | Automated test `G` (Entitlement Restriction) in `phase06-patient-360-verification.test.mjs` |
| `GAP-P06-04` | Partner Isolation (`Partner A → Partner B`) | `CanonicalPatientRecord.partnerId` defaulted to `session.tenantId` rather than `session.partnerId || session.tenantId`. | `Patient360ContinuityService.ts#L678` | Cross-partner access within or across sessions must check `pat.partnerId === effectivePartnerId`. | `SessionContext` | Bind `partnerId = (session as any).partnerId || session.organizationId || session.tenantId` and enforce strict `pat.partnerId` equality on all reads and mutations. | **P1** | Automated test `C` in `phase06-patient-360-verification.test.mjs` |
| `GAP-P06-05` | Canonical Patient 360 DTO & Longitudinal Timeline Fields | `Patient360ReadModel` and `PatientTimelineEvent` lacked explicit Phase 06 DTO fields (`demographics`, `contact`, `partnerLocation`, `activeEncounters`, `historicalEncounters`, `vitals`, `clinicalNotes`, `labOrdersResults`, `radiologyStudiesReports`, `prescriptions`, `pharmacyEvents`, `billingPaymentReferences`, `workflowTasks`, and timeline `tenantId`, `partnerId`, `locationId`, `occurredAt`, `recordedAt`, `actor`, `department`, `source`, `entityId`). | `Patient360ContinuityService.ts#L232-L287` | Consumers expecting the explicit Phase 06 DTO structure alongside Phase 05 continuity fields need both unified in one contract. | `Patient360ContinuityService.getPatient360` | Enrich `Patient360ReadModel` and `PatientTimelineEvent` with all required Phase 06 fields while preserving 100% of Phase 05 fields. | **P1** | Automated tests `E`, `F`, `H` in `phase06-patient-360-verification.test.mjs` & Phase 05 regression suite |
