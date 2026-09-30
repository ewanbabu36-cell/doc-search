import { apiCall, isMockFallbackAllowed } from './api-client.js';
import type {
  AbhaAccountDto,
  AbdmCareContextDto,
  AbdmConsentArtefactDto,
  FhirBundleRecordDto,
  AbdmScanAndShareTokenDto,
  AbdmGatewayOverviewMetricsDto,
  AbdmAuditTraceDto,
  CreateAbhaNumberRequest,
  LinkCareContextRequest,
  CreateConsentRequest,
  GenerateFhirBundleRequest,
  ProcessScanAndShareRequest
} from '@docsearch/api-contracts';

import {
  mockAbdmOverviewMetrics,
  mockAbhaAccounts,
  mockAbdmCareContexts,
  mockAbdmConsentArtefacts,
  mockFhirBundles,
  mockScanAndShareTokens,
  mockAbdmAuditTraces
} from './mock-abdm-fhir-data.js';

export interface IAbdmFhirService {
  getOverviewMetrics(tenantId: string): Promise<AbdmGatewayOverviewMetricsDto>;
  getAbhaAccounts(tenantId: string): Promise<AbhaAccountDto[]>;
  createAbhaNumber(tenantId: string, payload: CreateAbhaNumberRequest): Promise<AbhaAccountDto>;

  getCareContexts(tenantId: string): Promise<AbdmCareContextDto[]>;
  linkCareContext(tenantId: string, payload: LinkCareContextRequest): Promise<AbdmCareContextDto>;

  getConsentArtefacts(tenantId: string): Promise<AbdmConsentArtefactDto[]>;
  createConsentRequest(tenantId: string, payload: CreateConsentRequest): Promise<AbdmConsentArtefactDto>;

  getFhirBundles(tenantId: string): Promise<FhirBundleRecordDto[]>;
  generateFhirBundle(tenantId: string, payload: GenerateFhirBundleRequest): Promise<FhirBundleRecordDto>;

  getScanAndShareTokens(tenantId: string): Promise<AbdmScanAndShareTokenDto[]>;
  processScanAndShare(tenantId: string, payload: ProcessScanAndShareRequest): Promise<AbdmScanAndShareTokenDto>;

  getAuditTraces(tenantId: string): Promise<AbdmAuditTraceDto[]>;
}

export class AbdmFhirService implements IAbdmFhirService {
  private metrics: AbdmGatewayOverviewMetricsDto = { ...mockAbdmOverviewMetrics };
  private abhaAccounts: AbhaAccountDto[] = [...mockAbhaAccounts];
  private careContexts: AbdmCareContextDto[] = [...mockAbdmCareContexts];
  private consents: AbdmConsentArtefactDto[] = [...mockAbdmConsentArtefacts];
  private fhirBundles: FhirBundleRecordDto[] = [...mockFhirBundles];
  private scanTokens: AbdmScanAndShareTokenDto[] = [...mockScanAndShareTokens];
  private auditTraces: AbdmAuditTraceDto[] = [...mockAbdmAuditTraces];

  private appendAudit(
    action: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    justification: string,
    actorName = 'ABDM National Bridge',
    actorRole = 'SYSTEM_GATEWAY',
    tenantId = '11111111-1111-4111-8111-111111111111'
  ) {
    const traceNumber = `TRACE-ABDM-${Math.floor(10000 + Math.random() * 90000)}`;
    const trace: AbdmAuditTraceDto = {
      id: crypto.randomUUID(),
      tenantId,
      traceNumber,
      action,
      entityType,
      entityId,
      entityCode,
      actorName,
      actorRole,
      justification,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString()
    };
    this.auditTraces.unshift(trace);
  }

  async getOverviewMetrics(_tenantId: string): Promise<AbdmGatewayOverviewMetricsDto> {
    try {
      return await apiCall<AbdmGatewayOverviewMetricsDto>('/api/v1/partner/abdm/overview');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return { ...this.metrics };
    }
  }

  async getAbhaAccounts(_tenantId: string): Promise<AbhaAccountDto[]> {
    try {
      return await apiCall<AbhaAccountDto[]>('/api/v1/partner/abdm/m1/abha-accounts');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.abhaAccounts];
    }
  }

  async createAbhaNumber(tenantId: string, payload: CreateAbhaNumberRequest): Promise<AbhaAccountDto> {
    try {
      return await apiCall<AbhaAccountDto>('/api/v1/partner/abdm/m1/verify-aadhaar-otp', {
        method: 'POST',
        body: JSON.stringify({
          txnId: 'TXN-DIRECT-' + Date.now(),
          otp: '123456',
          ...payload
        })
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      const randPart = Math.floor(1000 + Math.random() * 9000);
      const abhaNumber = `91-${randPart}-8890-${payload.aadhaarNumberLast4}`;
      const abhaAddress = payload.preferredAbhaAddress.includes('@')
        ? payload.preferredAbhaAddress
        : `${payload.preferredAbhaAddress}@abdm`;

      const newAcc: AbhaAccountDto = {
        id: crypto.randomUUID(),
        tenantId: tenantId || '11111111-1111-4111-8111-111111111111',
        patientId: crypto.randomUUID(),
        patientMrn: payload.patientMrn,
        patientName: payload.patientName,
        abhaNumber,
        abhaAddress,
        mobileNumber: payload.mobileNumber,
        gender: 'M',
        dateOfBirth: '1985-06-15',
        address: 'Registered Address, Verified via Aadhaar KYC',
        kycStatus: 'VERIFIED_AADHAAR',
        abhaCardQrPayload: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%230f172a"/><text x="50" y="55" fill="white" font-size="8" text-anchor="middle">${abhaAddress}</text></svg>`,
        linkedCareContextsCount: 0,
        createdAt: new Date().toISOString()
      };

      this.abhaAccounts.unshift(newAcc);
      this.metrics.totalLinkedAbhaCount += 1;
      this.appendAudit('CREATE_ABHA_NUMBER_M1', 'ABHA_ACCOUNT', newAcc.id, abhaNumber, `Created and linked ABHA Address ${abhaAddress} via ${payload.authMode}`, undefined, undefined, tenantId);
      return newAcc;
    }
  }

  async getCareContexts(_tenantId: string): Promise<AbdmCareContextDto[]> {
    try {
      return await apiCall<AbdmCareContextDto[]>('/api/v1/partner/abdm/m2/care-contexts');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.careContexts];
    }
  }

  async linkCareContext(tenantId: string, payload: LinkCareContextRequest): Promise<AbdmCareContextDto> {
    try {
      return await apiCall<AbdmCareContextDto>('/api/v1/partner/abdm/m2/care-contexts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      const newContext: AbdmCareContextDto = {
        id: crypto.randomUUID(),
        tenantId: tenantId || '11111111-1111-4111-8111-111111111111',
        abhaAddress: payload.abhaAddress,
        patientMrn: payload.patientMrn,
        patientName: payload.patientName,
        careContextType: payload.careContextType,
        careContextReference: payload.careContextReference,
        displayTitle: payload.displayTitle,
        encounterDate: new Date().toISOString().substring(0, 10),
        doctorName: payload.doctorName,
        departmentName: payload.departmentName,
        isLinkedToAbdm: true,
        fhirBundleId: null,
        createdAt: new Date().toISOString()
      };

      this.careContexts.unshift(newContext);
      this.metrics.careContextsDiscoverableCount += 1;
      this.appendAudit('LINK_CARE_CONTEXT_M2', 'CARE_CONTEXT', newContext.id, payload.careContextReference, `Linked care context ${payload.careContextReference} to ABHA ${payload.abhaAddress}`, undefined, undefined, tenantId);
      return newContext;
    }
  }

  async getConsentArtefacts(_tenantId: string): Promise<AbdmConsentArtefactDto[]> {
    try {
      return await apiCall<AbdmConsentArtefactDto[]>('/api/v1/partner/abdm/m3/consent-requests');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.consents];
    }
  }

  async createConsentRequest(tenantId: string, payload: CreateConsentRequest): Promise<AbdmConsentArtefactDto> {
    try {
      return await apiCall<AbdmConsentArtefactDto>('/api/v1/partner/abdm/m3/consent-requests', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      const newConsent: AbdmConsentArtefactDto = {
        id: crypto.randomUUID(),
        tenantId: tenantId || '11111111-1111-4111-8111-111111111111',
        consentRequestId: `CR-2026-08-${Math.floor(1000 + Math.random() * 9000)}`,
        artefactId: `ART-ABDM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        patientAbhaAddress: payload.patientAbhaAddress,
        patientName: 'Patient Registered Name',
        requesterHipOrHiu: payload.requesterHipOrHiu,
        purposeCode: payload.purposeCode,
        purposeDescription: payload.purposeDescription,
        dateFrom: payload.dateFrom,
        dateTo: payload.dateTo,
        dataEraseDate: payload.dataEraseDate,
        status: 'GRANTED',
        grantedAt: new Date().toISOString(),
        linkedCareContextRefs: payload.careContextRefs,
        createdAt: new Date().toISOString()
      };

      this.consents.unshift(newConsent);
      this.metrics.activeConsentGrantsCount += 1;
      this.appendAudit('GRANT_CONSENT_ARTEFACT_M2', 'CONSENT_ARTEFACT', newConsent.id, newConsent.artefactId, `Consent granted for ${payload.requesterHipOrHiu} with purpose ${payload.purposeCode}`, undefined, undefined, tenantId);
      return newConsent;
    }
  }

  async getFhirBundles(_tenantId: string): Promise<FhirBundleRecordDto[]> {
    try {
      return await apiCall<FhirBundleRecordDto[]>('/api/v1/partner/abdm/m3/fhir-bundles');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.fhirBundles];
    }
  }

  async generateFhirBundle(tenantId: string, payload: GenerateFhirBundleRequest): Promise<FhirBundleRecordDto> {
    try {
      return await apiCall<FhirBundleRecordDto>('/api/v1/partner/abdm/m3/fhir-bundles/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      const bundleId = `BUNDLE-${payload.profileType.substring(0, 3)}-${new Date().toISOString().substring(0, 10)}-${Math.floor(100 + Math.random() * 900)}`;

      const fhirJson = JSON.stringify({
        resourceType: 'Bundle',
        id: bundleId,
        meta: { profile: [`https://nrces.in/ndhm/fhir/r4/StructureDefinition/${payload.profileType}`] },
        type: 'document',
        timestamp: new Date().toISOString(),
        entry: [
          {
            resource: {
              resourceType: 'Composition',
              status: 'final',
              type: { coding: [{ system: 'http://snomed.info/sct', code: '440545006', display: payload.profileType }] },
              subject: { reference: `Patient/${payload.patientMrn}`, display: payload.patientAbhaAddress },
              author: [{ reference: `Practitioner/${payload.authorPractitionerHprId}`, display: payload.authorPractitionerName }],
              section: [{ title: 'Clinical Summary', text: { status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml">${payload.clinicalSummaryText}</div>` } }]
            }
          }
        ]
      }, null, 2);

      const record: FhirBundleRecordDto = {
        id: crypto.randomUUID(),
        tenantId: tenantId || '11111111-1111-4111-8111-111111111111',
        bundleId,
        profileType: payload.profileType,
        patientAbhaAddress: payload.patientAbhaAddress,
        patientMrn: payload.patientMrn,
        careContextRef: payload.careContextRef,
        documentDate: new Date().toISOString().substring(0, 10),
        authorPractitionerHprId: payload.authorPractitionerHprId,
        authorPractitionerName: payload.authorPractitionerName,
        facilityHfrId: 'IN-MH-HFR-90812',
        fhirJsonPayload: fhirJson,
        validationStatus: 'VALID_FHIR_R4',
        digitalSignatureHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        createdAt: new Date().toISOString()
      };

      this.fhirBundles.unshift(record);
      this.metrics.fhirBundlesGeneratedMonth += 1;
      this.appendAudit('GENERATE_FHIR_R4_BUNDLE_M3', 'FHIR_BUNDLE', record.id, bundleId, `Generated validated FHIR R4 Bundle for ${payload.careContextRef} (${payload.profileType})`, undefined, undefined, tenantId);
      return record;
    }
  }

  async getScanAndShareTokens(_tenantId: string): Promise<AbdmScanAndShareTokenDto[]> {
    try {
      return await apiCall<AbdmScanAndShareTokenDto[]>('/api/v1/partner/abdm/m2/scan-and-share/tokens');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.scanTokens];
    }
  }

  async processScanAndShare(_tenantId: string, payload: ProcessScanAndShareRequest): Promise<AbdmScanAndShareTokenDto> {
    try {
      return await apiCall<AbdmScanAndShareTokenDto>('/api/v1/partner/abdm/m2/scan-and-share', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      const tokenNumber = `TKN-${Math.floor(100 + Math.random() * 900)}`;
      const token: AbdmScanAndShareTokenDto = {
        id: crypto.randomUUID(),
        tokenNumber,
        patientAbhaNumber: payload.patientAbhaNumber,
        patientAbhaAddress: payload.patientAbhaAddress,
        patientName: payload.patientName,
        gender: payload.gender,
        dob: payload.dob,
        mobile: payload.mobile,
        scannedCounterName: payload.scannedCounterName,
        assignedOpdDepartment: payload.assignedOpdDepartment,
        assignedDoctorName: payload.assignedDoctorName,
        status: 'CONVERTED_TO_APPOINTMENT',
        scannedAt: new Date().toISOString()
      };

      this.scanTokens.unshift(token);
      this.metrics.scanAndShareRegistrationsToday += 1;
      this.appendAudit('SCAN_AND_SHARE_REGISTRATION', 'SCAN_TOKEN', token.id, tokenNumber, `Fast-track OPD check-in token generated for ABHA ${payload.patientAbhaAddress}`);
      return token;
    }
  }

  async getAuditTraces(_tenantId: string): Promise<AbdmAuditTraceDto[]> {
    try {
      return await apiCall<AbdmAuditTraceDto[]>('/api/v1/partner/abdm/audit-traces');
    } catch (error) {
      if (!isMockFallbackAllowed()) throw error;
      return [...this.auditTraces];
    }
  }
}

export const abdmFhirService = new AbdmFhirService();
