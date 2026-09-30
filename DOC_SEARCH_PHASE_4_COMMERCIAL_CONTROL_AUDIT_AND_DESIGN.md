# DOC SEARCH — PHASE 4: COMMERCIAL CONTROL + SUBSCRIPTION + LICENSE + ENTITLEMENT FOUNDATION
# AUDIT & CANONICAL ARCHITECTURE DESIGN

**Document Version:** 1.0.0  
**Phase:** 4 (Commercial Control + Subscription + License + Entitlement Foundation)  
**Program Status:** AUDIT & DESIGN COMPLETE — READY FOR CONTROLLED IMPLEMENTATION  
**Author:** DOC SEARCH Engineering & Security Governance  
**Date:** 2026-09-26  

---

## 1. EXECUTIVE SUMMARY & OBJECTIVE

The objective of Phase 4 is to establish, harden, and freeze the authoritative server-side commercial control plane for DOC SEARCH:

```
PLAN
  → SUBSCRIPTION
    → LICENSE
      → ENTITLEMENT
        → FEATURE
          → MODULE
            → DEPARTMENT
              → ROLE
                → PERMISSION
                  → PARTNER
                    → STAFF
                      → ACTION
```

### Core Invariants
1. **Server-Side Enforcement**: Authorization must never depend on UI visibility. A hidden button or disabled control is not enforcement. Every commercially restricted operation is verified server-side.
2. **Fail-Closed Default**: If no active subscription, valid license, or explicit entitlement exists, access is strictly denied (`403 Forbidden` / `COMMERCIAL_ACCESS_DENIED`).
3. **Cryptographic License Integrity**: Commercial software licenses are cryptographically sealed with SHA-256 HMAC signatures. Tampered or forged license records are rejected immediately.
4. **Deterministic Time Boundaries**: License and subscription lifecycles (`ACTIVE → RENEWAL_WINDOW → EXPIRING_SOON → EXPIRED → GRACE_PERIOD → LOCKED`) are evaluated using deterministic, injectible time to prevent clock skew and race conditions.
5. **Phase 3 Unified Security**: Centralized identity and RBAC/ABAC authorization integrates commercial gates:
   $$\text{Canonical Identity} + \text{RBAC} + \text{ABAC} + \text{Commercial Entitlement} + \text{License State} + \text{Security Policy} = \text{Final Access Decision}$$
6. **Zero-Mock Policy**: 100% of runtime data operates on authoritative database tables (`plans`, `subscriptions`, `licenses`, `plan_entitlements`, `features`, `partner_governance_overrides`, `commercial_order_snapshots`).

---

## 2. AUDIT OF CURRENT COMMERCIAL ARCHITECTURE & EVIDENCE

A comprehensive audit of the DOC SEARCH repository across `apps/api-gateway` and `packages/` yielded the following inventory:

### A. Existing Components Inspected

| Component | File Path | Function / Responsibility | Audit Assessment |
|---|---|---|---|
| **Commercial Guard Plugin** | `apps/api-gateway/src/plugins/commercial-guard.ts` | Fastify pre-handler: enforces active license, HMAC validity, anti-tamper clock, node-lock, partner profile boundaries, and module entitlements. | **VERIFIED WORKING** (Solid gate; needs unified link to `resolveCommercialAccess`). |
| **License Service** | `apps/api-gateway/src/services/company/LicenseService.ts` | Generates license keys, HMAC signing, lifecycle evaluation, air-gapped packages, node-locking, and heartbeats. | **VERIFIED WORKING** (Deterministic HMAC and status logic intact). |
| **Subscription Service** | `apps/api-gateway/src/services/company/SubscriptionService.ts` | Manages subscription creation, tenure negotiation (1, 2, 3, 5 yrs), order pricing calculation, renewals, suspensions, and reconciliations. | **VERIFIED WORKING** (Solid financial calculations; needs atomic license HMAC re-signing guarantee across all renewal callers). |
| **Entitlement Service** | `apps/api-gateway/src/services/company/EntitlementService.ts` | Evaluates feature access (`canAccess`, `enforceFeatureAccess`), quota limits (doctors, beds, branches), and cache invalidation. | **VERIFIED WORKING** (Enforces profile boundaries and catalog entitlements). |
| **Partner Governance Service** | `apps/api-gateway/src/services/company/PartnerGovernanceService.ts` | Manages emergency kill switches (`globalFreeze`, `billingFreeze`, `communicationFreeze`), module overrides, and staff suspensions. | **VERIFIED WORKING** (Persists to `company.partner_governance_overrides`). |
| **Commercial Routes** | `apps/api-gateway/src/routes/company/commercial.routes.ts` | Plan catalog, order calculation, checkout creation, HQ pipeline, offline payment recording, partner classifications, and pricing overrides. | **VERIFIED WORKING** (Protected by `authenticate` and RBAC). |
| **Billing Management Service** | `apps/api-gateway/src/services/partner/BillingManagementService.ts` | Handles B2B commercial webhook payments, auto-provisions invoices, records payments, and extends subscriptions/licenses. | **PARTIAL** (Direct license update in lines 750-762 did not re-sign license HMAC signature). |
| **Identity Security Service (Phase 3)** | `apps/api-gateway/src/services/security/IdentitySecurityFoundationService.ts` | Centralized identity context, 12 security gates, anti-spoofing, and audit logging. | **VERIFIED WORKING** (Gate 5 checks license status and entitlements; needs direct connection to `resolveCommercialAccess`). |
| **Database Schemas & Tables** | `packages/database/src/schema/company/index.ts` | PostgreSQL tables: `plans`, `price_versions`, `features`, `plan_entitlements`, `subscriptions`, `licenses`, `commercial_order_snapshots`, `commercial_overrides`, `partner_governance_overrides`. | **VERIFIED WORKING** (Comprehensive normalized relational structure). |

---

## 3. GAP ANALYSIS & DEFECT INVENTORY

| Gap ID | Severity | Location | Description | Remediation Plan |
|---|:---:|---|---|---|
| **GAP-COMM-01** | **P1** | `BillingManagementService.ts:750` | Direct DB update of license expiry on webhook payment does not re-compute and update `signature` via `licenseService.signLicensePayload`. | Delegate license extension to `licenseService.renewLicense` or re-sign signature atomically during webhook settlement. |
| **GAP-COMM-02** | **P1** | Platform Architecture | Absence of a single consolidated `resolveCommercialAccess` decision engine accepting injected `currentTime` and returning standardized decision codes (`ALLOW`, `DENY`, `EXPIRED`, `GRACE`, `SUSPENDED`, `REVOKED`, `NOT_ENTITLED`, `LIMIT_EXCEEDED`, `PAYMENT_REQUIRED`, `GLOBAL_FREEZE`, `BILLING_FREEZE`). | Implement `CommercialControlService.ts` as the single canonical commercial decision authority. |
| **GAP-COMM-03** | **P2** | `IdentitySecurityFoundationService.ts:867` | License expiry check in identity resolution was evaluated against wall-clock `Date.now()` without evaluating `gracePeriodEnd` via `evaluateLicenseStatus`. | Integrate `CommercialControlService.resolveCommercialAccess` into `IdentitySecurityFoundationService.resolveIdentityContext` and authorization Gate 5. |
| **GAP-COMM-04** | **P2** | Test Matrix | Absence of unified `DOC_SEARCH_PHASE_4_COMMERCIAL_CONTROL.test.mjs` test suite covering the 30-point commercial control matrix with deterministic time boundaries and adversarial attack vectors. | Author and execute comprehensive 30+ point automated test suite. |

---

## 4. CANONICAL COMMERCIAL DATA MODEL

### A. Plan Model (`company.plans`)
* **Identity**: UUID primary key (`id`), immutable business code (`code`, e.g. `PLAN_HOSPITAL_ANNUAL`), version (`version`).
* **Attributes**: `name`, `description`, `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`), `basePrice` (INR), `currency` (`INR`), `billingInterval` (`ANNUAL`), `trialDurationDays` (0 or 14).
* **Quotas & Limits**: `maxConcurrentUsers`, `maxDoctors`, `maxBranches`, `maxBeds`, `storageQuotaGb`, `monthlyWhatsAppCredits`.
* **Price Versions**: Linked to `company.price_versions` (`versionNumber`, `annualBasePriceInr`, `gstRatePercent: 18`, `taxInclusive: true`, `sacCode: '998313'`).

### B. Subscription Model (`company.subscriptions`)
* **Identity**: UUID primary key (`id`), `partnerId` (FK `partner_profiles.id`), `productId` (FK `products.id`), `planId` (FK `plans.id`).
* **Lifecycle**: `status` (`PENDING`, `TRIAL`, `ACTIVE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`).
* **Cadence & Dates**: `billingCycle` (`YEARLY`, `TWO_YEARS`, `THREE_YEARS`, `FIVE_YEARS`, `PROMOTIONAL_FREE_1_YEAR`), `startDate`, `renewalDate`, `endDate`, `cancellationDate`, `cancellationReason`.
* **Metadata**: `isFirstYearFree`, `lastRenewedAt`, `lastPaymentId`, `negotiationNotes`.

### C. License Model (`company.licenses`)
* **Identity**: UUID primary key (`id`), `licenseKey` (`LIC-YYYY-XXXX-XXXX`), `partnerId`, `tenantId`, `subscriptionId`, `planId`.
* **Lifecycle**: `status` (`ACTIVE`, `FREE_ACTIVE`, `EXPIRING_SOON`, `RENEWAL_WINDOW`, `GRACE_PERIOD`, `EXPIRED`, `LOCKED`, `SUSPENDED`, `REVOKED`), `activationStatus` (`ACTIVATED`, `SUSPENDED`, `REVOKED`).
* **Cryptographic Seal**: SHA-256 HMAC `signature` over `licenseKey:partnerId:tenantId:subscriptionId:planId:expiryDate`.
* **Temporal Gates**: `issuedAt`, `startDate`, `expiryDate`, `gracePeriodEnd`.
* **Hardware & Node-Locking**: `metadata.boundNodes` (list of authorized physical machine fingerprints), `metadata.maxSeats`.

### D. Entitlement Model (`company.plan_entitlements` & `company.features`)
* **Identity**: `planId` + `featureId` unique compound key.
* **Attributes**: `entitlementType` (`FEATURE_ACCESS`, `QUOTA_LIMIT`), `status` (`ACTIVE`, `INACTIVE`), `value` (`{ enabled: boolean, limit?: number }`).
* **Partner Profile Boundary**: Intersection with `PARTNER_PROFILE_ALLOWED_MODULES[partnerType]` ensures profile isolation (e.g. Pharmacy cannot access OT/Surgery).

---

## 5. LICENSE LIFECYCLE & STATE MACHINE

```
[COMMISSIONING]
       │
       ▼
   ┌─────────┐
   │ ACTIVE  │ ◄────────────────────────────────────────┐
   └────┬────┘                                          │
        │ (expiryDate - 60 days)                        │
        ▼                                               │
   ┌────────────────┐                                   │
   │ RENEWAL_WINDOW │                                   │
   └────┬───────────┘                                   │
        │ (expiryDate - 30 days)                        │
        ▼                                               │
   ┌───────────────┐                                    │
   │ EXPIRING_SOON │                                    │
   └────┬──────────┘                                    │
        │ (currentTime >= expiryDate)                   │ Successful
        ▼                                               │ Payment /
   ┌──────────────┐                                     │ HQ Renewal
   │ GRACE_PERIOD │ ──── (Within 7-15 days grace) ──────┤
   └────┬─────────┘                                     │
        │ (currentTime >= gracePeriodEnd)               │
        ▼                                               │
   ┌─────────┐                                          │
   │ LOCKED  │ ─────────────────────────────────────────┘
   └─────────┘

[ADMINISTRATIVE / EMERGENCY ACTIONS (Any State)]
  ├─► SUSPENDED (HQ Command / Breach / Investigation)
  ├─► REVOKED (Fraud / Non-Payment / Contract Termination)
  └─► GLOBAL_FREEZE (Platform Emergency Kill-Switch)
```

---

## 6. CANONICAL COMMERCIAL DECISION ENGINE DESIGN

We consolidate commercial authorization into `CommercialControlService.ts`:

```typescript
export interface CommercialDecision {
  decision: 'ALLOW' | 'DENY';
  reasonCode:
    | 'ALLOW'
    | 'GLOBAL_FREEZE'
    | 'BILLING_FREEZE'
    | 'COMMUNICATION_FREEZE'
    | 'LICENSE_REVOKED'
    | 'LICENSE_SUSPENDED'
    | 'LICENSE_LOCKED'
    | 'LICENSE_EXPIRED'
    | 'LICENSE_TAMPERED'
    | 'LICENSE_MISSING'
    | 'SUBSCRIPTION_INACTIVE'
    | 'MODULE_DISABLED_BY_HQ'
    | 'PROFILE_BOUNDARY_VIOLATION'
    | 'NOT_ENTITLED'
    | 'LIMIT_EXCEEDED'
    | 'PAYMENT_REQUIRED';
  status: 'ACTIVE' | 'GRACE' | 'EXPIRING' | 'EXPIRED' | 'LOCKED' | 'SUSPENDED' | 'REVOKED' | 'FROZEN';
  message: string;
  daysRemaining: number;
  isInGracePeriod: boolean;
  limits?: { limitType: string; current: number; maxAllowed: number };
}

export function resolveCommercialAccess(params: {
  partnerId: string;
  tenantId?: string;
  partnerType?: string;
  subscription?: Subscription | null;
  license?: License | null;
  entitlements?: FeatureEntitlement[];
  featureCode: string;
  currentTime?: Date;
  currentCount?: number;
  skipHmacVerification?: boolean;
}): CommercialDecision;
```

---

## 7. TEST & VERIFICATION PROTOCOL

The test suite `DOC_SEARCH_PHASE_4_COMMERCIAL_CONTROL.test.mjs` will systematically cover:
1. Plan catalog & pricing models
2. Subscription creation & multi-year terms (1, 2, 3, 5 yrs)
3. Cryptographic license generation & HMAC signature verification
4. Entitlement mapping & partner profile boundary isolation
5. License lifecycle transitions (ACTIVE, RENEWAL_WINDOW, EXPIRING_SOON, GRACE_PERIOD, LOCKED)
6. Emergency kill-switches (GLOBAL_FREEZE, BILLING_FREEZE, COMMUNICATION_FREEZE)
7. Seat & resource limit enforcement (Doctors, Beds, Branches)
8. B2B Webhook payment settlement & license HMAC re-signing
9. Adversarial attacks (tenant spoofing, partner ID forgery, expired license bypass, role escalation)
10. Time-boundary assertions with deterministic injected clocks
11. Multi-phase regression suite (Phase 1, Phase 2, Phase 3, Phase 4)

---
*End of Audit and Architecture Design Document.*
