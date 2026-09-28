import type {
  AbhaAccountDto,
  AbdmCareContextDto,
  AbdmConsentArtefactDto,
  FhirBundleRecordDto,
  AbdmScanAndShareTokenDto,
  AbdmGatewayOverviewMetricsDto,
  AbdmAuditTraceDto
} from '@docsearch/api-contracts';

export const mockAbdmOverviewMetrics: AbdmGatewayOverviewMetricsDto = {
  bridgeStatus: 'DISCONNECTED',
  hfrFacilityId: '',
  facilityName: 'Doc Search Network Gateway',
  totalLinkedAbhaCount: 0,
  careContextsDiscoverableCount: 0,
  activeConsentGrantsCount: 0,
  fhirBundlesGeneratedMonth: 0,
  scanAndShareRegistrationsToday: 0,
  averagePushLatencyMs: 0,
  ecdhKeyExchangeSuccessPct: 100
};

export const mockAbhaAccounts: AbhaAccountDto[] = [];

export const mockAbdmCareContexts: AbdmCareContextDto[] = [];

export const mockAbdmConsentArtefacts: AbdmConsentArtefactDto[] = [];

export const mockFhirBundles: FhirBundleRecordDto[] = [];

export const mockScanAndShareTokens: AbdmScanAndShareTokenDto[] = [];

export const mockAbdmAuditTraces: AbdmAuditTraceDto[] = [];
