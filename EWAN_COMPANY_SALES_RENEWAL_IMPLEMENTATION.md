# EWAN COMPANY SALES, RENEWAL & LOCKED-ACCOUNT RECOVERY IMPLEMENTATION (`EWAN_COMPANY_SALES_RENEWAL_IMPLEMENTATION.md`)

**Date**: 2026-09-27  
**System**: DOC SEARCH Healthcare Enterprise OS  
**Status**: `IMPLEMENTED & VERIFIED`

---

## 1. Summary of Controlled Implementation

Ewan has been unified into a single governed AI & Commercial Assistant operating across **6 Partner & Company HQ modes** (`PRODUCT_TRAINER`, `COMPANY_SALES_MANAGER`, `CUSTOMER_SUCCESS`, `RENEWAL_MANAGER`, `PAYMENT_RENEWAL_ASSISTANT`, `LOCKED_ACCOUNT_RECOVERY`) plus `FINANCE_MANAGER_ASSISTANT`.

1. **Backend (`apps/api-gateway/src`)**:
   - `services/ai/EwanAssistantService.ts`
   - `routes/ewan.routes.ts`
   - `routes/partner/account.routes.ts`
   - `plugins/commercial-guard.ts` & `app.ts`
   - `services/company/LicenseService.ts`, `SubscriptionService.ts`, `CommercialFinanceService.ts`
2. **Frontend (`packages/ui-kit` & `apps/partner-platform`)**:
   - `packages/ui-kit/src/components/ewan/EwanSystemTrainer.tsx`
   - `apps/partner-platform/src/components/PartnerPlatformShell.tsx`
