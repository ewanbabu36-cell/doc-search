# EWAN COMPANY CAPABILITY AUDIT (`EWAN_COMPANY_CAPABILITY_AUDIT.md`)

**Date**: 2026-09-27  
**System**: DOC SEARCH Healthcare Enterprise OS  
**Scope**: Existing Ewan / AI / Trainer / Sales / Customer Success / Subscription / License / Payment / Account Lock Architecture  
**Protocol**: `DISCOVER → AUDIT → EVIDENCE → GAP → PLAN → CONTROLLED IMPLEMENTATION → TEST → INDEPENDENT VERIFICATION → FREEZE`

---

## 1. Executive Summary

An exhaustive, file-by-file, line-by-line audit was executed across `apps/api-gateway`, `packages/database`, `packages/ui-kit`, `apps/partner-platform`, `apps/company-platform`, and `apps/landing-page` to inspect all existing Ewan AI, Staff Trainer, Commercial Sales, Subscription, License, Payment, and Account Lock capabilities prior to controlled implementation.

### Summary Classification Table

| Capability Domain | Classification | Primary Evidence (`file:lines`) |
| :--- | :--- | :--- |
| **1. Ewan Floating Assistant & UI (`<EwanSystemTrainer />`)** | `PARTIAL` | `packages/ui-kit/src/components/ewan/EwanSystemTrainer.tsx:1-880` |
| **2. Backend Staff Trainer (`EwannameStaffTrainerService`)** | `PARTIAL` | `apps/api-gateway/src/services/ai/EwannameStaffTrainerService.ts:1-265` |
| **3. AI Permission Firewall & Role Context** | `WORKING` (Needs Locked-Account Mode Exemption) | `apps/api-gateway/src/ai/permission-firewall.ts:67-237` |
| **4. Commercial Guard & Locked Account Ewan Access** | `BROKEN` (P0 Blocker) | `apps/api-gateway/src/app.ts:229-271`, `apps/api-gateway/src/plugins/commercial-guard.ts:35-53` |
| **5. Mode 1: Product Trainer** | `PARTIAL` | `apps/api-gateway/src/services/ai/EwannameStaffTrainerService.ts:25-185` |
| **6. Mode 2: Company Sales Manager Assistant** | `MISSING` in Ewan (`WORKING` CRM tables) | `apps/api-gateway/src/services/company/SalesMarketingService.ts:1-254` |
| **7. Mode 3: Customer Success Assistant** | `MISSING` in Ewan | `apps/api-gateway/src/services/ai/AiOperationsAssistantService.ts:1-162` |
| **8. Mode 4: Renewal Manager Assistant (365d -> 60d -> 30d -> Lock)** | `PARTIAL` | `apps/api-gateway/src/services/company/LicenseService.ts:156-233` |
| **9. Mode 5: Payment / Renewal Assistant** | `PARTIAL` | `apps/api-gateway/src/routes/company/commercial.routes.ts:121-282` |
| **10. Mode 6: Locked-Account Recovery Assistant** | `MISSING` / `BROKEN` | `apps/api-gateway/src/plugins/commercial-guard.ts:42-53`, `PartnerPlatformShell.tsx:4122-4225` |
