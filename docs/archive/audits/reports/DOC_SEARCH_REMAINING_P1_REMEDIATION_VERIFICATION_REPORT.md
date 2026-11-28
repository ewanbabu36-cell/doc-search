# DOC SEARCH — REMAINING P1 REMEDIATION & INDEPENDENT VERIFICATION REPORT

**Date:** September 25, 2026  
**Mode:** Controlled Implementation Only (`AUDIT TARGET -> EVIDENCE -> GAP -> CONTROLLED IMPLEMENTATION -> REGRESSION TEST -> INDEPENDENT VERIFICATION -> REPORT`)  
**Source of Truth:** `DOC_SEARCH_FULL_DEEP_AUDIT_MASTER_REPORT.md`

---

## 1. PREVIOUSLY VERIFIED BASELINE (NO REGRESSIONS)

| Finding ID | Domain | Verification Suite | Status |
| :--- | :--- | :--- | :---: |
| **`FINDING-P0-AUTH-01`** | `POST /api/v1/auth/quick-session` Production Block & Zero-Trust Identity/Role/Tenant Hardening | `QS-1`, `QS-2` (`10/10 PASS` in `p0-p1-remediation-verification.test.mjs`) | **`P0 VERIFIED`** |
| **`FINDING-P1-STORAGE-01`** | `DocumentVerificationRepository.uploadDocument()` Fail-Closed Binary Validation & SHA-256 Integrity | `PDF-1` & `STOR-1..10` (`17/17 PASS` in `p0-p1-remediation-verification.test.mjs`) | **`P1-01 VERIFIED`** |
| **`FINDING-P1-COM-02`** | `EntitlementService.canAccess()` Fail-Closed Default-Deny (`No Entitlement = No Access`) | `ENT-1` (`A..H`) & `RBAC-1..9` (`18/18 PASS` in `p0-p1-remediation-verification.test.mjs`) | **`P1-02 VERIFIED`** |

---

## 2. TARGETED REMEDIATION & INDEPENDENT VERIFICATION OF REMAINING P1 FINDINGS (`P1-03`, `P1-04`, `P1-05`)

| Finding ID | Root Cause | Controlled Implementation & Authorization Hardening | Regression & Boundary Verification (`p0-p1-remediation-verification.test.mjs`) | Status |
| :--- | :--- | :--- | :--- | :---: |
| **`FINDING-P1-AUTH-DUAL-STORE-03`** (`P1-03`) | Local JSON files (`approved_partners.json`, `partner_credentials.json`) read/written alongside PostgreSQL | Removed runtime JSON file dependency in `RealAuthService.ts`, `auth.routes.ts`, and `PartnerSyncService.ts`; PostgreSQL (`users`, `user_credentials`, `partner_verification_queue`) is sole authority | `DS-1` (`A–I`): Verified approval, restart, multi-instance (`Instance A..F`), and proved tampering with or deleting `data/approved_partners.json` & `data/partner_credentials.json` cannot alter PostgreSQL status or roles | **`FIXED`** (`P1-03 VERIFIED`) |
| **`FINDING-P1-COMP-EXPIRY-04`** (`P1-04`) | Stored `VERIFIED` status trusted after `expiryDate < today`; expired mandatory docs did not block dependent operational routes | Added `hasExpiredMandatoryComplianceHold(tenantId)` in `DocumentVerificationRepository.ts` and enforced in `commercial-guard.ts` (`requireActiveCommercialAccess`) | `EXP-1` (`1–6`): Verified `VERIFIED + future` (`200`), `VERIFIED + today` (`200`), `VERIFIED + yesterday` (`403 EXPIRED_COMPLIANCE_HOLD`), `VERIFIED + older` (`403`), unverified renewal stays blocked (`403`), and HQ `VERIFY` restores `200` | **`FIXED`** (`P1-04 VERIFIED`) |
| **`FINDING-P1-ABAC-BREAKGLASS-05`** (`P1-05`) | Expired `effective_to` roles still contributed JWT permissions when paired with an unrelated active role; Break-Glass needed non-staff/wildcard blocks | Stripped expired/future role permissions in `auth-guard.ts` (`ROLE_PERMISSION_PREFIXES` filter) so expired roles contribute zero permissions; blocked `PATIENT`/`GUEST` and wildcard `patientId: '*'` in `partner-access-control.routes.ts` | `TRBAC-BG-1` (`1–10`): Verified valid role (`200`), expired role (`403`), expired `NURSE` + valid `BILLING_EXECUTIVE` (`403`), patient-scoped Break-Glass (`201`/`200`), missing reason (`400`), unauthenticated (`401`), cross-tenant (`403`), expired/revoked (`403`), immutable audit log, and normal user/wildcard rejection (`403`) | **`FIXED`** (`P1-05 VERIFIED`) |

---

## 3. FINAL P0/P1 VERIFICATION STATE

```text
P0 VERIFIED
P1-01 VERIFIED
P1-02 VERIFIED
P1-03 VERIFIED
P1-04 VERIFIED
P1-05 VERIFIED

P0/P1 REMEDIATION VERIFIED
```
