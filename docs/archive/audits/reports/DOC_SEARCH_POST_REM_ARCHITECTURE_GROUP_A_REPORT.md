# DOC SEARCH — POST-REMEDIATION ARCHITECTURE GROUP A REPORT

## Scope
Controlled remediation of **GROUP A** P0 security, identity, and audit blockers:
- **A1 (`P0-02`)**: License Signature Cryptographic Verification (`LicenseService.ts`)
- **A2 (`P0-03`)**: Removal of Synthetic Operational UUID Fallbacks & Scope Bypass Aliases (`ScopeGuard`, `PharmacyManagementRepository`, `ClinicalWorkflowRepository`, `LabDiagnosticsRepository`)
- **A3 (`P0-04`)**: Transactional Fail-Closed Audit Persistence (`AuditRepository.ts` & Migration `0061`)

---

## 1. Remediations & File Evidence

### A1 (`P0-02`) — License Signature Verification (`LicenseService.ts`)
- **File**: [`apps/api-gateway/src/services/company/LicenseService.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/services/company/LicenseService.ts#L88-L153)
- **What Changed**:
  - Removed `if (license.signature === 'seed_signature' || license.signature.startsWith('SIG-PROD-2026-')) return true;` from `verifyLicenseSignature`.
  - Enforced strict 64-hex-character SHA-256 HMAC digest format check (`/^[0-9a-f]{64}$/i`).
  - Enforced constant-time signature comparison via `crypto.timingSafeEqual(sigBuf, expBuf)`.
  - Updated [`packages/database/src/test-harness.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/database/src/test-harness.ts#L488-L509) and [`packages/database/src/seeds/universal-seed.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/database/src/seeds/universal-seed.ts#L1299-L1310) to compute genuine HMAC-SHA256 signatures for all seeded baseline licenses.

### A2 (`P0-03`) — Zero Synthetic Operational UUID Fallbacks
- **Files**:
  - [`packages/auth/src/scope-guard.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/auth/src/scope-guard.ts#L102-L190)
  - [`apps/api-gateway/src/repositories/partner/PharmacyManagementRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/PharmacyManagementRepository.ts#L70-L155)
  - [`apps/api-gateway/src/repositories/partner/ClinicalWorkflowRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/ClinicalWorkflowRepository.ts#L150-L240)
  - [`apps/api-gateway/src/repositories/partner/LabDiagnosticsRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/partner/LabDiagnosticsRepository.ts#L60-L140)
- **What Changed**:
  - Removed `isTestSeedFacilityAlias` (`00000000-0000-4000-8000-000000000002`, `00000000-0000-4000-8000-000000000003`) from `ScopeGuard.filterRecordsByScope` and `ScopeGuard.assertRecordInScope`.
  - Removed all synthetic operational fallback UUIDs (`00000000-0000-4000-8000-000000000001`..`0004`, `99999999-9999-4999-8999-999999999999`, `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`) from operational repositories.
  - Added fail-closed tenant/facility/department/patient/doctor resolvers (`resolveFacilityHierarchyOrThrow`, `resolvePatientIdOrThrow`, `resolveDoctorStaffIdOrThrow`) that throw `AppError` (`404 NOT_FOUND` / `403 FORBIDDEN`) when target operational entities do not exist in the caller's tenant scope.

### A3 (`P0-04`) — Transactional Fail-Closed Audit Persistence
- **Files**:
  - [`apps/api-gateway/src/repositories/core/AuditRepository.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/src/repositories/core/AuditRepository.ts#L21-L224)
  - [`packages/database/migrations/0061_architecture_p0_p1_remediation.sql`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/database/migrations/0061_architecture_p0_p1_remediation.sql#L1-L8)
  - [`packages/database/src/schema/core/audit-events.ts`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/packages/database/src/schema/core/audit-events.ts#L1-L40)
- **What Changed**:
  - Dropped legacy foreign-key constraints `audit_events_branch_id_branches_id_fk` and `audit_events_actor_id_users_id_fk` on `core.audit_events` so operational facility UUIDs (`operational_facilities.id`) and partner staff UUIDs (`operational_staff.id`) are stored directly in `core.audit_events.branch_id` and `core.audit_events.actor_id` without ever nulling them out.
  - Removed `memoryAuditStore` fallback from `AuditRepository.ts`.
  - Enforced fail-closed validation of `actorId`, `tenantId`, and `branchId` against canonical tenant/branch/facility registries within the caller's database transaction.

---

## 2. Verification & Test Results
- **Test Suite**: [`apps/api-gateway/test/master-architecture-p0-p1-remediation.test.mjs`](file:///c:/Users/alamr/OneDrive/Desktop/DOC%20SEARCH/apps/api-gateway/test/master-architecture-p0-p1-remediation.test.mjs)
  - `P0-02`: Verified valid HMAC-SHA256 passes, `seed_signature` and `SIG-PROD-2026-` fail (`false`), tampered `licenseKey`/`partnerId`/`expiryDate` fail (`false`), and seeded PostgreSQL licenses carry genuine 64-hex-char HMAC signatures (`PASS`).
  - `P0-03`: Verified `ScopeGuard` blocks `00000000-0000-4000-8000-000000000002` and `...0003`, and `PharmacyManagementRepository`, `ClinicalWorkflowRepository`, and `LabDiagnosticsRepository` reject unprovisioned operational references (`PASS`).
  - `P0-04`: Verified `AuditRepository.recordEvent` persists non-null `actorId`, `branchId`, and `tenantId` in PostgreSQL `core.audit_events` and rejects unprovisioned `branchId` (`PASS`).
- **Group A Status**: **FROZEN & VERIFIED**
