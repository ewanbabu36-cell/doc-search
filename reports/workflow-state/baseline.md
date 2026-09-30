# DOC SEARCH — CATEGORY 14: WORKFLOW / STATE BASELINE AUDIT REPORT

**Generated:** 2026-09-29T04:29:45.059Z
**Audit Scope:** Full Monorepo Workflow State Machines, Transitions, APIs, and DB Persistence

## 1. Executive Summary

- **Route Files Scanned:** 63
- **State Transition Endpoints Found:** 254
- **Endpoints Allowing Direct Status Updates:** 220
- **PostgreSQL Status/State Columns:** 411
- **Formal Service State Machines:** 3
- **Universal Workflow Engine Services:** 1
- **Frontend Workflow Storage References:** 137
- **Audited Core Business Workflows:** 12

## 2. Core Business Workflow State Models

| Workflow | Entity Table | Initial State | Active / Intermediate Stages | Terminal States |
| :--- | :--- | :--- | :--- | :--- |
| `PARTNER_ONBOARDING` | `partner_profiles` | `LEAD` | PENDING_VERIFICATION, UNDER_REVIEW, APPROVED, ACTIVE | `REJECTED, SUSPENDED, TERMINATED` |
| `COMMERCIAL_SUBSCRIPTION` | `subscriptions` | `PENDING` | ACTIVE, RENEWAL_WINDOW, EXPIRING_SOON, GRACE_PERIOD, EXPIRED, LOCKED | `CANCELLED, REVOKED` |
| `PATIENT_REGISTRATION` | `patients` | `ACTIVE` | INACTIVE | `DECEASED, MERGED` |
| `APPOINTMENT_LIFECYCLE` | `appointments` | `BOOKED` | CONFIRMED, RESCHEDULED, CHECKED_IN, IN_CONSULTATION | `COMPLETED, CANCELLED, NO_SHOW` |
| `QUEUE_TOKEN_LIFECYCLE` | `queue_tokens` | `GENERATED` | WAITING, CALLED, SERVING | `COMPLETED, CANCELLED, SKIPPED` |
| `CLINICAL_ENCOUNTER` | `encounters` | `REGISTERED` | CHECKED_IN, TRIAGE_DONE, WAITING, IN_CONSULTATION | `COMPLETED, CANCELLED, DISCHARGED` |
| `CLINICAL_CONSULTATION` | `consultations` | `DRAFT` | IN_PROGRESS, DIAGNOSIS_RECORDED, INVESTIGATION_ORDERED, PRESCRIPTION_GENERATED | `COMPLETED, CANCELLED` |
| `LAB_DIAGNOSTICS_LIMS` | `lab_orders` | `ORDERED` | ACCEPTED, SPECIMEN_COLLECTED, IN_ANALYSIS, RESULTED, VERIFIED | `REPORT_RELEASED, CANCELLED` |
| `RADIOLOGY_RIS_PACS` | `radiology_orders` | `REQUESTED` | SCHEDULED, IN_PROGRESS, ACQUIRED, REPORTED, VERIFIED | `COMPLETED, CANCELLED` |
| `PRESCRIPTION_LIFECYCLE` | `prescriptions` | `DRAFT` | ISSUED, QUEUED_PHARMACY, PARTIALLY_DISPENSED | `DISPENSED, CANCELLED` |
| `PHARMACY_DISPENSING` | `dispensing_sessions` | `QUEUED` | STOCK_RESERVED, VERIFIED | `DISPENSED, REJECTED` |
| `BILLING_INVOICE` | `billing_invoices` | `DRAFT` | GENERATED, PARTIALLY_PAID | `PAID, VOID, REFUNDED` |

## 3. High-Risk State Transition Endpoints (Client-Supplied Status)

The following endpoints accept client status payloads and require deep state-machine transition validation audit:

| Method | Endpoint | File Location |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/quick-session` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/refresh` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/logout` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/register-partner-user` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/change-password` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/self-register` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `PUT` | `/api/v1/auth/registration-form-config` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `PUT` | `/api/v1/auth/launch-offer` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/verification-queue/:id/request-information` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/verification-queue/:id/resubmit` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/verification-queue/:id/approve` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/verification-queue/:id/reject` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/verification-queue/approve` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/verification-queue/reject` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/verification-queue/:id/refund` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/staged-amendments` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/auth/demo-request` | [`apps/api-gateway/src/routes/auth.routes.ts`](file:///apps/api-gateway/src/routes/auth.routes.ts) |
| `POST` | `/api/v1/commercial/calculate-order` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/create-checkout-order` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/hq/plans` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `PUT` | `/api/v1/commercial/hq/plans/:id` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/hq/extend-grace` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/hq/record-offline-payment` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/hq/partner-types` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `PUT` | `/api/v1/commercial/hq/partner-types/:id` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/hq/overrides` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/hq/pricing` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/hq/invoices/generate` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `POST` | `/api/v1/commercial/hq/invoices/:id/payments` | [`apps/api-gateway/src/routes/company/commercial.routes.ts`](file:///apps/api-gateway/src/routes/company/commercial.routes.ts) |
| `PATCH` | `/api/v1/company/admin/internal-employees/:id/status` | [`apps/api-gateway/src/routes/company/company-admin.routes.ts`](file:///apps/api-gateway/src/routes/company/company-admin.routes.ts) |
| `POST` | `/api/v1/company/executive/operations/verify-doctor` | [`apps/api-gateway/src/routes/company/executive.routes.ts`](file:///apps/api-gateway/src/routes/company/executive.routes.ts) |
| `POST` | `/api/v1/company/integration/webhooks/dispatch-test` | [`apps/api-gateway/src/routes/company/integration.routes.ts`](file:///apps/api-gateway/src/routes/company/integration.routes.ts) |
| `POST` | `/api/v1/company/templates/:templateId/versions` | [`apps/api-gateway/src/routes/company/partner-access-control.routes.ts`](file:///apps/api-gateway/src/routes/company/partner-access-control.routes.ts) |
| `POST` | `/api/v1/company/partners/:partnerId/save-as-template` | [`apps/api-gateway/src/routes/company/partner-access-control.routes.ts`](file:///apps/api-gateway/src/routes/company/partner-access-control.routes.ts) |

*... and 185 more endpoints listed in baseline.json*

## 4. Formal State Machine Implementations in Codebase

- **Service:** [`apps/api-gateway/src/services/company/PartnerService.ts`](file:///apps/api-gateway/src/services/company/PartnerService.ts)
- **Service:** [`apps/api-gateway/src/services/partner/Patient360ContinuityService.ts`](file:///apps/api-gateway/src/services/partner/Patient360ContinuityService.ts)
- **Service:** [`apps/api-gateway/src/services/partner/RadiologyService.ts`](file:///apps/api-gateway/src/services/partner/RadiologyService.ts)

## 5. Universal Workflow Engine Architecture

Services residing in `apps/api-gateway/src/services/workflow`:
- `UniversalHealthcareWorkflowEngineService.ts`

## 6. Frontend Workflow Storage Keys (Non-Authoritative Verification)

- `getItem` key: `docsearch_verification_queue` in [`apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx`](file:///apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)
- `setItem` key: `docsearch_verification_queue` in [`apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx`](file:///apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)
- `setItem` key: `docsearch_auth_token` in [`apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx`](file:///apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)
- `setItem` key: `docsearch_refresh_token` in [`apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx`](file:///apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)
- `getItem` key: `docsearch_verification_queue` in [`apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx`](file:///apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)
- `setItem` key: `docsearch_verification_queue` in [`apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx`](file:///apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)
- `getItem` key: `docsearch_recent_patients` in [`apps/partner-platform/src/components/common/ActivePatientContextBar.tsx`](file:///apps/partner-platform/src/components/common/ActivePatientContextBar.tsx)
- `setItem` key: `docsearch_recent_patients` in [`apps/partner-platform/src/components/common/ActivePatientContextBar.tsx`](file:///apps/partner-platform/src/components/common/ActivePatientContextBar.tsx)
- `getItem` key: `docsearch_opd_queue` in [`apps/partner-platform/src/components/common/OpdQueueTvDisplayModal.tsx`](file:///apps/partner-platform/src/components/common/OpdQueueTvDisplayModal.tsx)
- `setItem` key: `docsearch_opd_queue` in [`apps/partner-platform/src/components/common/OpdQueueTvDisplayModal.tsx`](file:///apps/partner-platform/src/components/common/OpdQueueTvDisplayModal.tsx)
- `getItem` key: `docsearch_verification_queue` in [`apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx`](file:///apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)
- `setItem` key: `docsearch_verification_queue` in [`apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx`](file:///apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)
- `getItem` key: `docsearch_prescription_letterhead_mode` in [`apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx`](file:///apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx)
- `setItem` key: `docsearch_prescription_letterhead_mode` in [`apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx`](file:///apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx)
- `getItem` key: `docsearch_auth_token` in [`apps/partner-platform/src/components/PartnerPlatformShell.tsx`](file:///apps/partner-platform/src/components/PartnerPlatformShell.tsx)
- `getItem` key: `docsearch_partner_token` in [`apps/partner-platform/src/components/PartnerPlatformShell.tsx`](file:///apps/partner-platform/src/components/PartnerPlatformShell.tsx)
- `getItem` key: `docsearch_auth_token` in [`apps/partner-platform/src/components/PartnerPlatformShell.tsx`](file:///apps/partner-platform/src/components/PartnerPlatformShell.tsx)
- `getItem` key: `docsearch_auth_token` in [`apps/partner-platform/src/components/views/CreateInvoiceView.tsx`](file:///apps/partner-platform/src/components/views/CreateInvoiceView.tsx)
- `getItem` key: `docsearch_auth_token` in [`apps/partner-platform/src/components/views/DoctorExpressConsultationDesk.tsx`](file:///apps/partner-platform/src/components/views/DoctorExpressConsultationDesk.tsx)
- `getItem` key: `docsearch_auth_token` in [`apps/partner-platform/src/components/views/DoctorExpressConsultationDesk.tsx`](file:///apps/partner-platform/src/components/views/DoctorExpressConsultationDesk.tsx)
