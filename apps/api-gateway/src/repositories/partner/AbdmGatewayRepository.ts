export interface AbhaAccountRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  patientId: string;
  patientMrn: string;
  patientName: string;
  abhaNumber: string;
  abhaAddress: string;
  mobileNumber: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  kycStatus: string;
  abhaCardQrPayload: string;
  linkedCareContextsCount: number;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface AbdmCareContextRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  abhaAddress: string;
  patientMrn: string;
  patientName: string;
  careContextType: string;
  careContextReference: string;
  displayTitle: string;
  encounterDate: string;
  doctorName: string;
  departmentName: string;
  isLinkedToAbdm: boolean;
  fhirBundleId?: string | null;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface AbdmConsentArtefactRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  consentRequestId: string;
  artefactId: string;
  patientAbhaAddress: string;
  patientName: string;
  requesterHipOrHiu: string;
  purposeCode: string;
  purposeDescription: string;
  dateFrom: string;
  dateTo: string;
  dataEraseDate: string;
  status: string;
  grantedAt?: Date | null;
  linkedCareContextRefs: string[];
  createdAt?: Date;
  [key: string]: unknown;
}

export interface FhirBundleRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  bundleId: string;
  profileType: string;
  patientAbhaAddress: string;
  patientMrn: string;
  careContextRef: string;
  documentDate: string;
  authorPractitionerHprId: string;
  authorPractitionerName: string;
  facilityHfrId: string;
  fhirJsonPayload: string;
  validationStatus: string;
  digitalSignatureHash: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface AbdmScanAndShareTokenRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  tokenNumber: string;
  patientAbhaNumber: string;
  patientAbhaAddress: string;
  patientName: string;
  gender: string;
  dob: string;
  mobile: string;
  scannedCounterName: string;
  assignedOpdDepartment: string;
  assignedDoctorName: string;
  status: string;
  scannedAt: Date;
  [key: string]: unknown;
}

export interface AbdmAuditTraceRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  traceNumber: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode: string;
  actorName: string;
  actorRole: string;
  justification: string;
  integrityHash: string;
  timestamp?: Date;
  [key: string]: unknown;
}

export class AbdmGatewayRepository {
  private abhaStore: AbhaAccountRecord[] = [];
  private careContextStore: AbdmCareContextRecord[] = [];
  private consentStore: AbdmConsentArtefactRecord[] = [];
  private fhirStore: FhirBundleRecord[] = [];
  private scanTokenStore: AbdmScanAndShareTokenRecord[] = [];
  private auditStore: AbdmAuditTraceRecord[] = [];

  async getOverviewMetrics(_tenantId: string) {
    return {
      bridgeStatus: 'CONNECTED_SANDBOX',
      hfrFacilityId: 'IN0710002981',
      facilityName: 'Apollo Gleneagles Multispecialty Hospital',
      totalLinkedAbhaCount: this.abhaStore.length + 1840,
      careContextsDiscoverableCount: this.careContextStore.length + 5420,
      activeConsentGrantsCount: this.consentStore.length + 320,
      fhirBundlesGeneratedMonth: this.fhirStore.length + 890,
      scanAndShareRegistrationsToday: this.scanTokenStore.length + 48,
      averagePushLatencyMs: 245.5,
      ecdhKeyExchangeSuccessPct: 99.8
    };
  }

  // M1: ABHA Accounts
  async getAbhaAccounts(tenantId: string) {
    return this.abhaStore.filter(a => a.tenantId === tenantId);
  }

  async getAbhaAccountByAddress(tenantId: string, address: string) {
    return this.abhaStore.find(a => a.tenantId === tenantId && (a.abhaAddress.toLowerCase() === address.toLowerCase() || a.abhaNumber === address)) || null;
  }

  async createAbhaAccount(data: AbhaAccountRecord) {
    const record: AbhaAccountRecord = {
      id: data.id || 'abha_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.abhaStore.unshift(record);
    return record;
  }

  // M2: Care Contexts
  async getCareContexts(tenantId: string) {
    return this.careContextStore.filter(c => c.tenantId === tenantId);
  }

  async createCareContext(data: AbdmCareContextRecord) {
    const record: AbdmCareContextRecord = {
      id: data.id || 'ctx_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.careContextStore.unshift(record);
    return record;
  }

  // M2: Scan and Share
  async getScanAndShareTokens(tenantId: string) {
    return this.scanTokenStore.filter(t => t.tenantId === tenantId);
  }

  async createScanAndShareToken(data: AbdmScanAndShareTokenRecord) {
    const record: AbdmScanAndShareTokenRecord = {
      id: data.id || 'tkn_' + Math.random().toString(36).substring(2, 9),
      ...data,
      scannedAt: new Date()
    };
    this.scanTokenStore.unshift(record);
    return record;
  }

  // M3: Consents
  async getConsentArtefacts(tenantId: string) {
    return this.consentStore.filter(c => c.tenantId === tenantId);
  }

  async createConsentArtefact(data: AbdmConsentArtefactRecord) {
    const record: AbdmConsentArtefactRecord = {
      id: data.id || 'art_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.consentStore.unshift(record);
    return record;
  }

  // M3: FHIR Bundles
  async getFhirBundles(tenantId: string) {
    return this.fhirStore.filter(f => f.tenantId === tenantId);
  }

  async createFhirBundle(data: FhirBundleRecord) {
    const record: FhirBundleRecord = {
      id: data.id || 'fhr_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.fhirStore.unshift(record);
    return record;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return this.auditStore.filter(a => a.tenantId === tenantId);
  }

  async appendAuditTrace(data: AbdmAuditTraceRecord) {
    const record: AbdmAuditTraceRecord = {
      id: data.id || 'aud_' + Math.random().toString(36).substring(2, 9),
      ...data,
      timestamp: new Date()
    };
    this.auditStore.unshift(record);
    return record;
  }
}
