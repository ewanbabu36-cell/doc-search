import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const AbhaAuthModeEnum = z.enum([
  'AADHAAR_OTP',
  'MOBILE_OTP',
  'DEMOGRAPHICS',
  'BIOMETRIC_IRIS_FINGERPRINT'
]);
export type AbhaAuthMode = z.infer<typeof AbhaAuthModeEnum>;

export const AbdmCareContextTypeEnum = z.enum([
  'OPD_CONSULTATION_VISIT',
  'IPD_DISCHARGE_EPISODE',
  'DIAGNOSTIC_LAB_REPORT',
  'RADIOLOGY_STUDY_REPORT',
  'IMMUNIZATION_RECORD'
]);
export type AbdmCareContextType = z.infer<typeof AbdmCareContextTypeEnum>;

export const AbdmConsentStatusEnum = z.enum([
  'REQUESTED',
  'GRANTED',
  'DENIED',
  'REVOKED',
  'EXPIRED'
]);
export type AbdmConsentStatus = z.infer<typeof AbdmConsentStatusEnum>;

export const FhirBundleProfileEnum = z.enum([
  'PRESCRIPTION_RECORD',
  'DIAGNOSTIC_REPORT_LAB',
  'DIAGNOSTIC_REPORT_RAD',
  'DISCHARGE_SUMMARY',
  'IMMUNIZATION_RECORD',
  'HEALTH_DOCUMENT'
]);
export type FhirBundleProfile = z.infer<typeof FhirBundleProfileEnum>;

export const AbdmGatewayBridgeStatusEnum = z.enum([
  'CONNECTED_SANDBOX',
  'CONNECTED_PRODUCTION',
  'DISCONNECTED',
  'TOKEN_REFRESHING'
]);
export type AbdmGatewayBridgeStatus = z.infer<typeof AbdmGatewayBridgeStatusEnum>;

// ============================================================================
// DTOs
// ============================================================================

export const AbhaAccountDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientMrn: z.string(),
  patientName: z.string(),
  abhaNumber: z.string(), // "91-4421-8890-1234"
  abhaAddress: z.string(), // "kavita.joshi@abdm"
  mobileNumber: z.string(),
  gender: z.enum(['M', 'F', 'O']),
  dateOfBirth: z.string(),
  address: z.string(),
  kycStatus: z.enum(['VERIFIED_AADHAAR', 'VERIFIED_MOBILE', 'PENDING']),
  abhaCardQrPayload: z.string(),
  linkedCareContextsCount: z.number(),
  createdAt: z.string()
});
export type AbhaAccountDto = z.infer<typeof AbhaAccountDtoSchema>;

export const AbdmCareContextDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  abhaAddress: z.string(),
  patientMrn: z.string(),
  patientName: z.string(),
  careContextType: AbdmCareContextTypeEnum,
  careContextReference: z.string(), // e.g. "VISIT-OPD-2026-881" or "IPD-DIS-2026-104"
  displayTitle: z.string(),
  encounterDate: z.string(),
  doctorName: z.string(),
  departmentName: z.string(),
  isLinkedToAbdm: z.boolean(),
  fhirBundleId: z.string().nullable().optional(),
  createdAt: z.string()
});
export type AbdmCareContextDto = z.infer<typeof AbdmCareContextDtoSchema>;

export const AbdmConsentArtefactDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  consentRequestId: z.string(),
  artefactId: z.string(),
  patientAbhaAddress: z.string(),
  patientName: z.string(),
  requesterHipOrHiu: z.string(), // e.g. "Tata Memorial Centre (HIU-001)"
  purposeCode: z.enum(['CARETREAT', 'PUBHLTH', 'BTCHQ', 'DSRCH']),
  purposeDescription: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  dataEraseDate: z.string(),
  status: AbdmConsentStatusEnum,
  grantedAt: z.string().nullable().optional(),
  linkedCareContextRefs: z.array(z.string()),
  createdAt: z.string()
});
export type AbdmConsentArtefactDto = z.infer<typeof AbdmConsentArtefactDtoSchema>;

export const FhirBundleRecordDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bundleId: z.string(),
  profileType: FhirBundleProfileEnum,
  patientAbhaAddress: z.string(),
  patientMrn: z.string(),
  careContextRef: z.string(),
  documentDate: z.string(),
  authorPractitionerHprId: z.string(),
  authorPractitionerName: z.string(),
  facilityHfrId: z.string(),
  fhirJsonPayload: z.string(), // stringified valid FHIR R4 JSON
  validationStatus: z.enum(['VALID_FHIR_R4', 'SCHEMA_WARNING', 'INVALID']),
  digitalSignatureHash: z.string(),
  createdAt: z.string()
});
export type FhirBundleRecordDto = z.infer<typeof FhirBundleRecordDtoSchema>;

export const AbdmScanAndShareTokenDtoSchema = z.object({
  id: z.string().uuid(),
  tokenNumber: z.string(), // "TKN-042"
  patientAbhaNumber: z.string(),
  patientAbhaAddress: z.string(),
  patientName: z.string(),
  gender: z.string(),
  dob: z.string(),
  mobile: z.string(),
  scannedCounterName: z.string(),
  assignedOpdDepartment: z.string(),
  assignedDoctorName: z.string(),
  status: z.enum(['WAITING_AT_COUNTER', 'CONVERTED_TO_APPOINTMENT', 'CANCELLED']),
  scannedAt: z.string()
});
export type AbdmScanAndShareTokenDto = z.infer<typeof AbdmScanAndShareTokenDtoSchema>;

export const AbdmGatewayOverviewMetricsDtoSchema = z.object({
  bridgeStatus: AbdmGatewayBridgeStatusEnum,
  hfrFacilityId: z.string(),
  facilityName: z.string(),
  totalLinkedAbhaCount: z.number(),
  careContextsDiscoverableCount: z.number(),
  activeConsentGrantsCount: z.number(),
  fhirBundlesGeneratedMonth: z.number(),
  scanAndShareRegistrationsToday: z.number(),
  averagePushLatencyMs: z.number(),
  ecdhKeyExchangeSuccessPct: z.number()
});
export type AbdmGatewayOverviewMetricsDto = z.infer<typeof AbdmGatewayOverviewMetricsDtoSchema>;

export const AbdmAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  traceNumber: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityCode: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  justification: z.string(),
  integrityHash: z.string(),
  timestamp: z.string()
});
export type AbdmAuditTraceDto = z.infer<typeof AbdmAuditTraceDtoSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

export const CreateAbhaNumberRequestSchema = z.object({
  patientMrn: z.string(),
  patientName: z.string(),
  mobileNumber: z.string(),
  aadhaarNumberLast4: z.string(),
  preferredAbhaAddress: z.string(),
  authMode: AbhaAuthModeEnum
});
export type CreateAbhaNumberRequest = z.infer<typeof CreateAbhaNumberRequestSchema>;

export const VerifyAbhaOtpRequestSchema = z.object({
  txnId: z.string(),
  otp: z.string(),
  preferredAbhaAddress: z.string()
});
export type VerifyAbhaOtpRequest = z.infer<typeof VerifyAbhaOtpRequestSchema>;

export const LinkCareContextRequestSchema = z.object({
  abhaAddress: z.string(),
  patientMrn: z.string(),
  patientName: z.string(),
  careContextType: AbdmCareContextTypeEnum,
  careContextReference: z.string(),
  displayTitle: z.string(),
  doctorName: z.string(),
  departmentName: z.string()
});
export type LinkCareContextRequest = z.infer<typeof LinkCareContextRequestSchema>;

export const CreateConsentRequestSchema = z.object({
  patientAbhaAddress: z.string(),
  requesterHipOrHiu: z.string(),
  purposeCode: z.enum(['CARETREAT', 'PUBHLTH', 'BTCHQ', 'DSRCH']),
  purposeDescription: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  dataEraseDate: z.string(),
  careContextRefs: z.array(z.string())
});
export type CreateConsentRequest = z.infer<typeof CreateConsentRequestSchema>;

export const GenerateFhirBundleRequestSchema = z.object({
  profileType: FhirBundleProfileEnum,
  patientAbhaAddress: z.string(),
  patientMrn: z.string(),
  careContextRef: z.string(),
  authorPractitionerHprId: z.string(),
  authorPractitionerName: z.string(),
  clinicalSummaryText: z.string()
});
export type GenerateFhirBundleRequest = z.infer<typeof GenerateFhirBundleRequestSchema>;

export const ProcessScanAndShareRequestSchema = z.object({
  patientAbhaNumber: z.string(),
  patientAbhaAddress: z.string(),
  patientName: z.string(),
  gender: z.string(),
  dob: z.string(),
  mobile: z.string(),
  scannedCounterName: z.string(),
  assignedOpdDepartment: z.string(),
  assignedDoctorName: z.string()
});
export type ProcessScanAndShareRequest = z.infer<typeof ProcessScanAndShareRequestSchema>;
