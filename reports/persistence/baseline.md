# DOC SEARCH — CATEGORY 10: DATA PERSISTENCE BASELINE AUDIT REPORT

**Generated:** 2026-09-29T01:26:31.111Z  
**Auditor:** Data Persistence Auditor + Remediation Engineer  
**Objective:** Independent audit of full-stack persistence integrity across Native PostgreSQL 18.4, API Gateway, and Frontend Applications.

---

## 1. Executive Summary Statistics

| Metric | Count | Assessment |
|---|---|---|
| Total Browser Storage References (`localStorage` / `sessionStorage`) | 576 | Scanned across all 3 frontends |
| Auth / Session Management Storage | 175 | Expected for JWT / Auth tokens |
| UI Preference / Ephemeral State Storage | 378 | Expected for theme / table pagination |
| **Suspected Business Data in Browser Storage** | **23** | **Requires strict zero-trust analysis** |
| Repository Suspicious In-Memory / Fake Patterns | 50 | Potential non-persistent or bypass paths |
| Service In-Memory Maps | 18 | Potential state lost on process restart |
| Total Backend Mutation Endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) | 78 | Total write surface |
| Frontend Cache Hooks (Optimistic / Invalidation) | 0 | Query lifecycle hooks |

---

## 2. Suspected Business Data in Browser Storage

```json
[
  {
    "file": "apps/partner-platform/src/components/common/ActivePatientContextBar.tsx",
    "line": 20,
    "code": "const raw = localStorage.getItem('docsearch_recent_patients');",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/components/common/ActivePatientContextBar.tsx",
    "line": 32,
    "code": "localStorage.setItem('docsearch_recent_patients', JSON.stringify(patients.slice(0, 5)));",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx",
    "line": 67,
    "code": "const saved = localStorage.getItem('docsearch_prescription_letterhead_mode');",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/components/dialogs/PrintableDoctorPrescriptionModal.tsx",
    "line": 76,
    "code": "localStorage.setItem('docsearch_prescription_letterhead_mode', mode);",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/components/views/FastPharmacyPosCounterView.tsx",
    "line": 366,
    "code": "// Dynamic Sales History State: loaded from server dispensing records without localStorage dependency",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/components/views/NurseVitalsTriageStationView.tsx",
    "line": 188,
    "code": "// Load patient queue from encounterService and localStorage",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/main.tsx",
    "line": 460,
    "code": "<button onclick=\"localStorage.clear(); location.reload();\" style=\"background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;\">",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/clinical-investigation-service.ts",
    "line": 1611,
    "code": "window.localStorage.removeItem(\"docsearch_pending_lab_orders\");",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/hospital-event-bus.ts",
    "line": 67,
    "code": "const cached = localStorage.getItem('docsearch_active_patient_context');",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/hospital-event-bus.ts",
    "line": 100,
    "code": "localStorage.setItem('docsearch_active_patient_context', JSON.stringify(data));",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/hospital-event-bus.ts",
    "line": 105,
    "code": "localStorage.removeItem('docsearch_active_patient_context');",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-credit-khata-service.ts",
    "line": 124,
    "code": "const stored = window.localStorage.getItem('docsearch_pharmacy_sales_invoices');",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-offline-storage-service.ts",
    "line": 487,
    "code": "const stored = localStorage.getItem('docsearch_offline_invoices_backup');",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-offline-storage-service.ts",
    "line": 490,
    "code": "localStorage.setItem('docsearch_offline_invoices_backup', JSON.stringify(list));",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-offline-storage-service.ts",
    "line": 660,
    "code": "const stored = localStorage.getItem('docsearch_offline_invoices_backup');",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-revenue-galla-service.ts",
    "line": 173,
    "code": "const storedInvoices = window.localStorage.getItem(STORAGE_INVOICES_KEY);",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-revenue-galla-service.ts",
    "line": 192,
    "code": "window.localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(this.invoices));",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-revenue-galla-service.ts",
    "line": 502,
    "code": "window.localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(this.invoices));",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-revenue-galla-service.ts",
    "line": 516,
    "code": "window.localStorage.removeItem(STORAGE_INVOICES_KEY);",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-revenue-galla-service.ts",
    "line": 742,
    "code": "window.localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(this.invoices));",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/partner-platform/src/services/pharmacy-revenue-galla-service.ts",
    "line": 761,
    "code": "window.localStorage.removeItem(STORAGE_INVOICES_KEY);",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/company-platform/src/components/common/GlobalWhiteLabelContext.tsx",
    "line": 42,
    "code": "const saved = localStorage.getItem('ds_whitelabel_config');",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  },
  {
    "file": "apps/company-platform/src/components/common/GlobalWhiteLabelContext.tsx",
    "line": 50,
    "code": "localStorage.setItem('ds_whitelabel_config', JSON.stringify(whiteLabelConfig));",
    "classification": "SUSPECTED_BUSINESS_DATA_IN_STORAGE"
  }
]
```

---

## 3. Repository Suspicious Patterns

```json
[
  {
    "file": "apps/api-gateway/src/repositories/company/CompanyAdminRepository.ts",
    "line": 380,
    "code": "return { success: true };",
    "issue": "POTENTIAL_FAKE_SUCCESS_WITHOUT_DB_WRITE"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/HqCommandCenterRepository.ts",
    "line": 118,
    "code": "const partnerMap = new Map<string, any>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/HqCommandCenterRepository.ts",
    "line": 240,
    "code": "const planMap = new Map<string, any>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/HqCommandCenterRepository.ts",
    "line": 381,
    "code": "const planMap = new Map<string, any>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts",
    "line": 337,
    "code": "const hashToRecords = new Map<string, { id: string; name: string }[]>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts",
    "line": 338,
    "code": "const licenseToRecords = new Map<string, { id: string; name: string }[]>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/PartnerOnboardingRepository.ts",
    "line": 339,
    "code": "const aadhaarToRecords = new Map<string, { id: string; name: string }[]>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/PartnerRepository.ts",
    "line": 1064,
    "code": "const roleMap = new Map<string, RoleKycMatrixRow>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/PartnerRepository.ts",
    "line": 1143,
    "code": "const reviewerMap = new Map<string, ReviewerWorkload>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/PartnerRepository.ts",
    "line": 2257,
    "code": "const reviewerMap = new Map<string, ReviewerWorkload>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/PartnerRepository.ts",
    "line": 2363,
    "code": "const dailyRegMap = new Map<string, number>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/company/PartnerRepository.ts",
    "line": 2364,
    "code": "const dailyAppMap = new Map<string, number>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts",
    "line": 684,
    "code": "const docTypeMap = new Map(typesToUse.map((t) => [t.id, t]));",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/core/DocumentVerificationRepository.ts",
    "line": 1353,
    "code": "const typeMap = new Map(allDocTypes.map((t: any) => [t.id, t]));",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 161,
    "code": "private inMemoryAbhaStore: AbhaAccountRecord[] = [];",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 162,
    "code": "private inMemoryCareContextStore: AbdmCareContextRecord[] = [];",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 163,
    "code": "private inMemoryConsentStore: AbdmConsentArtefactRecord[] = [];",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 164,
    "code": "private inMemoryFhirStore: FhirBundleRecord[] = [];",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 165,
    "code": "private inMemoryScanTokenStore: AbdmScanAndShareTokenRecord[] = [];",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 166,
    "code": "private inMemoryAuditStore: AbdmAuditTraceRecord[] = [];",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 208,
    "code": "return this.inMemoryAbhaStore.filter((a) => a.tenantId === tenantId);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 238,
    "code": "this.inMemoryAbhaStore.find(",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 292,
    "code": "this.inMemoryAbhaStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 300,
    "code": "this.inMemoryAbhaStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 323,
    "code": "return this.inMemoryCareContextStore.filter((c) => c.tenantId === tenantId);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 352,
    "code": "return this.inMemoryCareContextStore.filter(",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 400,
    "code": "this.inMemoryCareContextStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 408,
    "code": "this.inMemoryCareContextStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 416,
    "code": "return this.inMemoryScanTokenStore.filter((t) => t.tenantId === tenantId);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 425,
    "code": "this.inMemoryScanTokenStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 448,
    "code": "return this.inMemoryConsentStore.filter((c) => c.tenantId === tenantId);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 476,
    "code": "this.inMemoryConsentStore.find(",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 527,
    "code": "this.inMemoryConsentStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 535,
    "code": "this.inMemoryConsentStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 562,
    "code": "const item = this.inMemoryConsentStore.find(",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 591,
    "code": "return this.inMemoryFhirStore.filter((f) => f.tenantId === tenantId);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 619,
    "code": "this.inMemoryFhirStore.find(",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 669,
    "code": "this.inMemoryFhirStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 677,
    "code": "this.inMemoryFhirStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 700,
    "code": "return this.inMemoryAuditStore.filter((a) => a.tenantId === tenantId);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 746,
    "code": "this.inMemoryAuditStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/AbdmGatewayRepository.ts",
    "line": 754,
    "code": "this.inMemoryAuditStore.unshift(record);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts",
    "line": 199,
    "code": "const doctorMap = new Map<string, { doctorId: string; totalAppointments: number; completedCount: number }>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts",
    "line": 209,
    "code": "const deptMap = new Map<string, number>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts",
    "line": 292,
    "code": "const wardMap = new Map<string, { wardName: string; totalBeds: number; occupiedBeds: number }>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts",
    "line": 431,
    "code": "const modMap = new Map<string, number>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts",
    "line": 566,
    "code": "const modeMap = new Map<string, number>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/CommandCenterRepository.ts",
    "line": 905,
    "code": "const staffMap = new Map<string, { staffId: string; role: string; totalAssigned: number; completedCount: number }>();",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/PharmacyManagementRepository.ts",
    "line": 2195,
    "code": "const isDuplicateInMemory = this.syncedOfflineInvoiceIds.has(inv.clientInvoiceId) || this.syncedOfflineInvoiceIds.has(inv.invoiceNumber);",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  },
  {
    "file": "apps/api-gateway/src/repositories/partner/PharmacyManagementRepository.ts",
    "line": 2214,
    "code": "if (isDuplicateInMemory || existingInDb) {",
    "issue": "IN_MEMORY_STORE_OR_CACHE_DETECTED"
  }
]
```

---

## 4. Service In-Memory Maps

```json
[
  {
    "file": "apps/api-gateway/src/services/company/CapabilityAndDependencyEngine.ts",
    "line": 403,
    "code": "private capabilitiesCache = new Map<string, CapabilityDefinition>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/company/CapabilityAndDependencyEngine.ts",
    "line": 404,
    "code": "private dependenciesCache = new Map<string, DependencyRule[]>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/company/ConditionalPolicyEngine.ts",
    "line": 43,
    "code": "private inMemoryPolicies = new Map<string, AccessPolicyDto>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/company/EntitlementService.ts",
    "line": 39,
    "code": "private accessCache = new Map<string, { result: boolean; expiresAt: number }>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/company/PartnerGovernanceService.ts",
    "line": 97,
    "code": "private overridesStore = new Map<string, PartnerGovernanceData>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/company/PartnerGovernanceService.ts",
    "line": 98,
    "code": "private partnerToTenantMap = new Map<string, string>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/company/PartnerGovernanceService.ts",
    "line": 99,
    "code": "private tenantToPartnerMap = new Map<string, string>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/company/PartnerTemplateService.ts",
    "line": 596,
    "code": "private templatesMemory = new Map<string, any>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/company/PartnerTemplateService.ts",
    "line": 597,
    "code": "private versionsMemory = new Map<string, any[]>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/core/RealAuthService.ts",
    "line": 518,
    "code": "private userCache = new Map<string, AuthenticatedUserRecord>(",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/partner/AiVoiceService.ts",
    "line": 76,
    "code": "private idempotencyCache = new Map<string, CachedVoiceResult>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/partner/CreditReceivablesService.ts",
    "line": 218,
    "code": "const patientMap = new Map<string, PatientAgeingSummary>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/partner/TaxEngineService.ts",
    "line": 174,
    "code": "const rateMap = new Map<string, any>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/security/IdentitySecurityFoundationService.ts",
    "line": 512,
    "code": "private makerCheckerStore = new Map<string, MakerCheckerRequestRecord>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/security/IdentitySecurityFoundationService.ts",
    "line": 513,
    "code": "private breakGlassStore = new Map<",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/security/IdentitySecurityFoundationService.ts",
    "line": 527,
    "code": "private identityCache = new Map<string, { expiresAt: number; context: CanonicalIdentityContext }>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/workflow/UniversalHealthcareWorkflowEngineService.ts",
    "line": 575,
    "code": "private idempotencyStore = new Map<string, { requestHash: string; result: any }>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  },
  {
    "file": "apps/api-gateway/src/services/workflow/UniversalHealthcareWorkflowEngineService.ts",
    "line": 579,
    "code": "const verMap = new Map<number, DepartmentWorkflowAdapterConfig>();",
    "issue": "IN_MEMORY_SERVICE_MAP"
  }
]
```

---

## 5. Next Actions for Remediation Loop
1. Analyze each suspected business storage site in the frontend to verify whether server PostgreSQL is the authoritative truth or if state is lost on reload / second session.
2. Inspect every repository and service in-memory store to ensure no business data is stored exclusively in process memory.
3. Test end-to-end lifecycle across the 12 core hospital workflows:
   `CREATE -> SAVE -> DATABASE -> RE-FETCH -> UPDATE -> RE-FETCH -> RELOAD -> SECOND SESSION -> SURVIVES RESTART`
