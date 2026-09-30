# Category 15: Integration Error Baseline Audit Report
Generated: 2026-09-29T05:15:40.954Z

## Executive Summary
- **Backend API Routes Discovered**: 768
- **Frontend API Invocations Discovered**: 159
- **LocalStorage Business Handoffs Detected**: 356
- **Potential Route/Endpoint Contract Mismatches**: 5
- **Webhook Integration Findings**: 5
- **Live PostgreSQL Schema (Port 5432)**: 500 operational tables, 1012 FKs, 171 Uniques.

## External Services Boundary (Frozen Scope)
- **Razorpay Payment Gateway**: `NOT IMPLEMENTED (FROZEN SCOPE PRESERVED)` — Audit rule #4 applied: Razorpay is NOT to be newly developed. Stubs must remain clean and not simulate fake successful bank transfers in production.
- **ABDM (Ayushman Bharat Digital Mission)**: `NOT IMPLEMENTED (FROZEN SCOPE PRESERVED)` — Audit rule #5 applied: ABDM is NOT to be newly developed. Architecture stubs exist but must not claim real government NHA sandbox certification.
- **SMS / Email Notification Integration**: `INTERNAL MOCK / CONSOLE PROVIDER` — Notifications log to internal audit / console without throwing unhandled exceptions.
- **DICOM / PACS Radiology Server**: `METADATA STORAGE & LOCAL PREVIEW` — Radiology studies store valid DICOM metadata and accession numbers in PostgreSQL; external Orthanc PACS connector optional.

## Discovered Unmatched / Suspect Frontend Route Calls
- `apps/partner-platform/src/components/common/DynamicRoleDocumentChecklist.tsx` -> `/api/v1/compliance/documents/requirements?role=${encodeURIComponent(role)}&facilityType=${encodeURIComponent(facilityType)}&tenantId=11111111-1111-4111-8111-111111111111`
- `apps/partner-platform/src/components/common/DynamicRoleDocumentChecklist.tsx` -> `/api/v1/compliance/documents/upload`
- `apps/partner-platform/src/components/common/RealTimeHospitalActivityDock.tsx` -> `/api/health`
- `apps/company-platform/src/components/common/DynamicRoleDocumentChecklist.tsx` -> `/api/v1/compliance/documents/requirements?role=${encodeURIComponent(role)}&facilityType=${encodeURIComponent(facilityType)}&tenantId=11111111-1111-4111-8111-111111111111`
- `apps/company-platform/src/components/common/DynamicRoleDocumentChecklist.tsx` -> `/api/v1/compliance/documents/upload`


## Discovered LocalStorage Business State Keys
- `docsearch_custom_partner_users (apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)`
- `docsearch_verification_queue (apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)`
- `docsearch_partner_staff_auth (apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)`
- `docsearch_auth_token (apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)`
- `docsearch_user_session (apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)`
- `docsearch_refresh_token (apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx)`
- `docsearch_recent_patients (apps/partner-platform/src/components/common/ActivePatientContextBar.tsx)`
- `docsearch_partner_tenant (apps/partner-platform/src/components/common/ActivePatientContextBar.tsx)`
- `docsearch_partner_staff_auth (apps/partner-platform/src/components/common/AmbientVoiceScribeCapsule.tsx)`
- `docsearch_partner_tenant (apps/partner-platform/src/components/common/GlobalCommandPalette.tsx)`
- `docsearch_opd_queue (apps/partner-platform/src/components/common/OpdQueueTvDisplayModal.tsx)`
- `docsearch_schedule_h1_records (apps/partner-platform/src/components/common/ScheduleH1DrugRegisterModal.tsx)`
- `docsearch_registered_partners (apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)`
- `docsearch_staged_profile_amendments (apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)`
- `docsearch_verification_queue (apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)`
- `docsearch_partner_staff_auth (apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)`
- `docsearch_custom_partner_users (apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)`
- `docsearch_day1_pwd_${currentUser.email} (apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)`
- `docsearch_partner_staff (apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx)`
- `docsearch_prescription_letterhead_mode (apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx)`
