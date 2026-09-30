# EWAN IMPLEMENTATION PLAN (`EWAN_IMPLEMENTATION_PLAN.md`)

**Date**: 2026-09-27  
**System**: DOC SEARCH Healthcare Enterprise OS  
**Approach**: Evolutionary Extension (Zero Duplication, Zero Mock Data, 100% PostgreSQL Authority)

---

## 1. Controlled Implementation Steps

1. **Step 1: Subscription & License Lifecycle Standardization (`SubscriptionService.ts`, `LicenseService.ts`, `CommercialFinanceService.ts`)**:
   - Standardize post-expiry grace period to 30 days (`gracePeriodDays = 30`).
   - Ensure `evaluateLicenseStatus` returns `graceDaysRemaining` and `reconcileExpiries` transitions expired/locked rows cleanly.
   - Re-sign `licenses.signature` and invalidate `entitlementService` cache on all renewal/payment settlements.
2. **Step 2: Commercial Guard Exemption & Locked-Account Firewall (`app.ts`, `commercial-guard.ts`)**:
   - Exempt `/api/v1/partner/ewan/*` and `/api/v1/partner/ai/trainer/*` from `requireActiveCommercialAccess` so locked accounts can access Ewan, while blocking operational module queries inside `EwanAssistantService`.
3. **Step 3: Authoritative Partner Renewal & Payment Endpoints (`account.routes.ts`, `PartnerAccountService.ts`)**:
   - Add `/api/v1/partner/account/renewal-status`, `/api/v1/partner/account/renewal/initiate-order`, and `/api/v1/partner/account/renewal/verify-payment` with HMAC signature verification and idempotency.
4. **Step 4: Unified 6-Mode `EwanAssistantService` & Routes (`EwanAssistantService.ts`, `ewan.routes.ts`)**:
   - Implement Modes 1–6 (`PRODUCT_TRAINER`, `COMPANY_SALES_MANAGER`, `CUSTOMER_SUCCESS`, `RENEWAL_MANAGER`, `PAYMENT_RENEWAL_ASSISTANT`, `LOCKED_ACCOUNT_RECOVERY`) + `FINANCE_MANAGER_ASSISTANT` with adversarial prompt-injection defenses.
5. **Step 5: Frontend Locked Account Shell & `<EwanSystemTrainer />` (`EwanSystemTrainer.tsx`, `PartnerPlatformShell.tsx`)**:
   - Ensure `<EwanSystemTrainer />` (`zIndex: 1000005`) remains visible above lock overlays and wire **Renew License** + **Talk to Ewan** CTAs.
