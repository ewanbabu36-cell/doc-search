# DOC SEARCH — FALLBACK / MOCK / STATIC-TRUTH ERROR: BASELINE REPORT

## 1. Executive Summary
- **Audit Execution Date:** 2026-09-29T09:03:20.273Z
- **Authoritative Database:** Real Native PostgreSQL 18.4 (Port 5432)
- **Active Backend API:** Fastify 5 API Gateway (Port 4000)
- **Total Forensic Findings:** 789
- **P0 Critical:** 334
- **P1 High:** 455
- **P2 Medium:** 0
- **P3 Low:** 0

---

## 2. Required Metric Inventory

| Metric | Baseline Value | Required Final Target |
| :--- | :--- | :--- |
| **MOCK_PRODUCTION_PATHS** | 40 | 0 |
| **STATIC_BUSINESS_TRUTH** | 75 | 0 |
| **HARDCODED_BUSINESS_TRUTH** | 75 | 0 |
| **BROWSER_BUSINESS_TRUTH** | 284 | 0 |
| **LOCALSTORAGE_BUSINESS_TRUTH** | 284 | 0 |
| **SESSIONSTORAGE_BUSINESS_TRUTH** | 0 | 0 |
| **INDEXEDDB_BUSINESS_TRUTH** | 0 | 0 |
| **SILENT_FALLBACKS** | 379 | 0 |
| **API_FAILURE_MOCK_FALLBACKS** | 0 | 0 |
| **API_FAILURE_EMPTY_FALLBACKS** | 0 | 0 |
| **DB_FAILURE_MEMORY_FALLBACKS** | 6 | 0 |
| **POSTGRES_TO_PGMEM_FALLBACKS** | 0 | 0 |
| **FALSE_SUCCESS_FALLBACKS** | 5 | 0 |
| **FALSE_EMPTY_STATES** | 0 | 0 |
| **FALSE_ZERO_STATES** | 0 | 0 |
| **STATIC_ANALYTICS** | 0 | 0 |
| **DEMO_DATA_PRODUCTION_LEAKS** | 0 | 0 |
| **SEED_DATA_PRODUCTION_LEAKS** | 0 | 0 |
| **CACHE_AS_AUTHORITY** | 0 | 0 |
| **BROWSER_ONLY_BUSINESS_HANDOFFS** | 3 | 0 |
| **FAKE_IMPLEMENTATIONS** | 0 | 0 |
| **UNSAFE_PROVIDER_FALLBACKS** | 0 | 0 |
| **ENVIRONMENT_FALLBACK_ERRORS** | 0 | 0 |
| **UNKNOWN_CRITICAL_TRUTH_PATHS** | 0 | 0 |

---

## 3. Discovered Forensic Findings Breakdown

### FND-0001 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:514`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_custom_partner_users/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const localCustom: HospitalStaffUser[] = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
```

### FND-0002 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:527`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_custom_partner_users/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_custom_partner_users', JSON.stringify(cleanedCustom));
```

### FND-0003 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:647`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(demoUser));
```

### FND-0004 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:803`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(personaUser));
```

### FND-0005 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:881`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(resolvedUser));
```

### FND-0006 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:1151`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_custom_partner_users/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const localCustom: HospitalStaffUser[] = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
```

### FND-0007 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/auth/HospitalStaffLogin.tsx:1154`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_custom_partner_users/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_custom_partner_users', JSON.stringify(filtered));
```

### FND-0008 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/ClinicalConsultationDomainManager.tsx:603`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
tenantId: selectedConsultation?.tenantId || '22222222-2222-4222-8222-222222222222',
```

### FND-0009 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/AmbientVoiceScribeCapsule.tsx:157`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const stored = localStorage.getItem('docsearch_partner_staff_auth');
```

### FND-0010 [P1] — SILENT_FALLBACKS
- **File:** `apps/partner-platform/src/components/common/FastOpdRegistrationDrawer.tsx:241`
- **Description:** Silent catch block with fallback comment hiding API/network failure
- **Root Cause:** API catch block suppresses errors and falls back to local or static state.
- **Code:**
```ts
} catch (apiErr: any) {       if (!isMockFallbackAllowed()) {
```

### FND-0011 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/OpdQueueTvDisplayModal.tsx:44`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_opd_queue/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const stored = localStorage.getItem('docsearch_opd_queue');
```

### FND-0012 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/OpdQueueTvDisplayModal.tsx:83`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_opd_queue/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_opd_queue', JSON.stringify(queue));
```

### FND-0013 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:223`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_registered_partners/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const partners = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
```

### FND-0014 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:418`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const authStr = localStorage.getItem('docsearch_partner_staff_auth');
```

### FND-0015 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:422`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(authObj));
```

### FND-0016 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:580`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_custom_partner_users/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const customUsers = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
```

### FND-0017 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:586`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_custom_partner_users/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_custom_partner_users', JSON.stringify(updated));
```

### FND-0018 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:592`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const staffList = JSON.parse(localStorage.getItem('docsearch_partner_staff') || '[]');
```

### FND-0019 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:608`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff', JSON.stringify(updatedStaff));
```

### FND-0020 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:611`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const authUser = JSON.parse(localStorage.getItem('docsearch_partner_staff_auth') || '{}');
```

### FND-0021 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/common/UniversalAccountSettingsModal.tsx:615`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(authUser));
```

### FND-0022 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:475`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
tenantId: '22222222-2222-4222-8222-222222222222',
```

### FND-0023 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:476`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
partnerId: '00000000-0000-0000-0000-000000000001',
```

### FND-0024 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:477`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
organizationId: '00000000-0000-0000-0000-000000000001',
```

### FND-0025 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:500`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
tenantId: '22222222-2222-4222-8222-222222222222',
```

### FND-0026 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:501`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
partnerId: '00000000-0000-0000-0000-000000000001',
```

### FND-0027 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:502`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
organizationId: '00000000-0000-0000-0000-000000000001',
```

### FND-0028 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:520`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
tenantId: '22222222-2222-4222-8222-222222222222',
```

### FND-0029 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:521`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
partnerId: '00000000-0000-0000-0000-000000000001',
```

### FND-0030 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:522`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
organizationId: '00000000-0000-0000-0000-000000000001',
```

### FND-0031 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:530`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
encounterId: '00000000-0000-0000-0000-000000000001',
```

### FND-0032 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/dialogs/DirectLabWalkInReportModal.tsx:532`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
orderingDoctorId: '00000000-0000-0000-0000-000000000001',
```

### FND-0033 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/EmergencyDomainManager.tsx:117`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
partnerId = '22222222-2222-4222-8222-222222222222',
```

### FND-0034 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/InpatientDomainManager.tsx:153`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
partnerId = '22222222-2222-4222-8222-222222222222',
```

### FND-0035 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/MRDDomainManager.tsx:65`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
partnerId = '22222222-2222-4222-8222-222222222222',
```

### FND-0036 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/OTDomainManager.tsx:100`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
partnerId = '22222222-2222-4222-8222-222222222222',
```

### FND-0037 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:664`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_registered_partners/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const list = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
```

### FND-0038 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:720`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const storedAuth = localStorage.getItem('docsearch_partner_staff_auth');
```

### FND-0039 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:726`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(parsed));
```

### FND-0040 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:732`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_registered_partners/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const list = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
```

### FND-0041 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:745`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_registered_partners/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_registered_partners', JSON.stringify(list));
```

### FND-0042 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:2928`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const saved = JSON.parse(localStorage.getItem('docsearch_partner_staff_auth') || '{}');
```

### FND-0043 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:2930`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(saved));
```

### FND-0044 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:2953`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const saved = JSON.parse(localStorage.getItem('docsearch_partner_staff_auth') || '{}');
```

### FND-0045 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PartnerPlatformShell.tsx:2955`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(saved));
```

### FND-0046 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PatientRegistrationDomainManager.tsx:82`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('docsearch_partner_staff_auth') : null;
```

### FND-0047 [P0] — LOCALSTORAGE_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/PatientRegistrationDomainManager.tsx:249`
- **Description:** Browser storage used as business truth with key pattern matching /docsearch_partner_staff/i
- **Root Cause:** Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.
- **Code:**
```ts
const storedAuth = localStorage.getItem('docsearch_partner_staff_auth');
```

### FND-0048 [P1] — HARDCODED_BUSINESS_TRUTH
- **File:** `apps/partner-platform/src/components/ProcurementDomainManager.tsx:120`
- **Description:** Hardcoded test tenant/facility alias UUID in business logic filter
- **Root Cause:** Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.
- **Code:**
```ts
partnerId = '22222222-2222-4222-8222-222222222222',
```

### FND-0049 [P1] — SILENT_FALLBACKS
- **File:** `apps/partner-platform/src/components/views/AmbientAiScribeView.tsx:238`
- **Description:** Silent catch block with fallback comment hiding API/network failure
- **Root Cause:** API catch block suppresses errors and falls back to local or static state.
- **Code:**
```ts
} catch (err: any) {               setIsManualFallbackActive(true);
```

### FND-0050 [P1] — SILENT_FALLBACKS
- **File:** `apps/partner-platform/src/components/views/CentralHelpDeskExitHubView.tsx:75`
- **Description:** Silent catch block with fallback comment hiding API/network failure
- **Root Cause:** API catch block suppresses errors and falls back to local or static state.
- **Code:**
```ts
} catch (err) {         if (isMounted && isMockFallbackAllowed()) {
```



*(Showing top 50 of 789 findings. Complete findings recorded in baseline.json)*
