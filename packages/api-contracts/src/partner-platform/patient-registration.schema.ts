import { z } from 'zod';

export const PatientStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'DECEASED',
  'MERGED',
  'DUPLICATE_REVIEW',
  'BLOCKED'
]);
export type PatientStatus = z.infer<typeof PatientStatusEnum>;

export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']);
export type Gender = z.infer<typeof GenderEnum>;

export const BloodGroupEnum = z.enum([
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
  'UNKNOWN'
]);
export type BloodGroup = z.infer<typeof BloodGroupEnum>;

export const MaritalStatusEnum = z.enum([
  'SINGLE',
  'MARRIED',
  'DIVORCED',
  'WIDOWED',
  'OTHER'
]);
export type MaritalStatus = z.infer<typeof MaritalStatusEnum>;

export const RegistrationSourceEnum = z.enum([
  'RECEPTION_DESK',
  'ONLINE_PORTAL',
  'EMERGENCY_TRANSFER',
  'REFERRAL'
]);
export type RegistrationSource = z.infer<typeof RegistrationSourceEnum>;

export const ContactMethodEnum = z.enum(['MOBILE', 'EMAIL', 'SMS', 'WHATSAPP']);
export type ContactMethod = z.infer<typeof ContactMethodEnum>;

export const AddressTypeEnum = z.enum(['RESIDENTIAL', 'PERMANENT', 'TEMPORARY', 'WORK']);
export type AddressType = z.infer<typeof AddressTypeEnum>;

export const EmergencyRelationshipEnum = z.enum([
  'SPOUSE',
  'PARENT',
  'SIBLING',
  'CHILD',
  'GUARDIAN',
  'FRIEND',
  'OTHER'
]);
export type EmergencyRelationship = z.infer<typeof EmergencyRelationshipEnum>;

export const PatientIdentifierTypeEnum = z.enum([
  'MRN',
  'NATIONAL_HEALTH_ID',
  'DRIVER_LICENSE_REF',
  'PASSPORT_REF',
  'INSURANCE_MEMBER_ID',
  'EXTERNAL_HOSPITAL_ID'
]);
export type PatientIdentifierType = z.infer<typeof PatientIdentifierTypeEnum>;

export const PatientConsentTypeEnum = z.enum([
  'GENERAL_REGISTRATION',
  'COMMUNICATION_SMS_EMAIL',
  'DATA_SHARING_HIE',
  'TREATMENT_DISCLOSURE',
  'TELEHEALTH_CONSENT'
]);
export type PatientConsentType = z.infer<typeof PatientConsentTypeEnum>;

export const PatientConsentStatusEnum = z.enum([
  'GRANTED',
  'REVOKED',
  'EXPIRED',
  'PENDING'
]);
export type PatientConsentStatus = z.infer<typeof PatientConsentStatusEnum>;

export const InsuranceCoverageTypeEnum = z.enum(['PRIMARY', 'SECONDARY', 'TERTIARY']);
export type InsuranceCoverageType = z.infer<typeof InsuranceCoverageTypeEnum>;

export const InsuranceEligibilityStatusEnum = z.enum([
  'ACTIVE',
  'EXPIRED',
  'VERIFICATION_PENDING',
  'INACTIVE'
]);
export type InsuranceEligibilityStatus = z.infer<typeof InsuranceEligibilityStatusEnum>;

export const DuplicateMatchCategoryEnum = z.enum([
  'EXACT_MATCH',
  'HIGH_CONFIDENCE',
  'POSSIBLE_MATCH',
  'NO_MATCH'
]);
export type DuplicateMatchCategory = z.infer<typeof DuplicateMatchCategoryEnum>;

export const DuplicateReviewStatusEnum = z.enum([
  'PENDING_REVIEW',
  'RESOLVED_MERGED',
  'RESOLVED_DISTINCT',
  'DISMISSED'
]);
export type DuplicateReviewStatus = z.infer<typeof DuplicateReviewStatusEnum>;

// DTO Schemas
export const PatientContactDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  patientId: z.string().uuid(),
  primaryMobile: z.string(),
  alternateMobile: z.string().optional(),
  email: z.string().optional(),
  preferredContactMethod: ContactMethodEnum,
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PatientContactDto = z.infer<typeof PatientContactDtoSchema>;

export const PatientAddressDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  patientId: z.string().uuid(),
  addressType: AddressTypeEnum,
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  isPrimary: z.boolean(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PatientAddressDto = z.infer<typeof PatientAddressDtoSchema>;

export const EmergencyContactDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  patientId: z.string().uuid(),
  contactName: z.string(),
  relationship: EmergencyRelationshipEnum,
  primaryPhone: z.string(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  isPrimary: z.boolean(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type EmergencyContactDto = z.infer<typeof EmergencyContactDtoSchema>;

export const PatientIdentifierDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  patientId: z.string().uuid(),
  identifierType: PatientIdentifierTypeEnum,
  identifierValue: z.string(),
  issuingAuthority: z.string().optional(),
  status: z.enum(['ACTIVE', 'REVOKED', 'EXPIRED', 'SUPERSEDED']),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PatientIdentifierDto = z.infer<typeof PatientIdentifierDtoSchema>;

export const PatientConsentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  patientId: z.string().uuid(),
  consentType: PatientConsentTypeEnum,
  consentStatus: PatientConsentStatusEnum,
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  recordedBy: z.string(),
  auditReference: z.string().optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PatientConsentDto = z.infer<typeof PatientConsentDtoSchema>;

export const PatientInsurancePolicyDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  patientId: z.string().uuid(),
  payerName: z.string(),
  policyNumber: z.string(),
  memberId: z.string(),
  planName: z.string(),
  tpaName: z.string().optional(),
  coverageType: InsuranceCoverageTypeEnum,
  eligibilityStatus: InsuranceEligibilityStatusEnum,
  coverageStartDate: z.string().datetime(),
  coverageEndDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PatientInsurancePolicyDto = z.infer<typeof PatientInsurancePolicyDtoSchema>;

export const PatientDuplicateCandidateDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  sourcePatientId: z.string().uuid(),
  sourcePatientName: z.string().optional(),
  sourceMrn: z.string().optional(),
  matchedPatientId: z.string().uuid(),
  matchedPatientName: z.string().optional(),
  matchedMrn: z.string().optional(),
  confidenceScore: z.number().min(0).max(100),
  matchCategory: DuplicateMatchCategoryEnum,
  matchingSignals: z.array(z.string()),
  reviewStatus: DuplicateReviewStatusEnum,
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PatientDuplicateCandidateDto = z.infer<typeof PatientDuplicateCandidateDtoSchema>;

export const PatientMergeEventDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  canonicalPatientId: z.string().uuid(),
  canonicalMrn: z.string().optional(),
  mergedPatientId: z.string().uuid(),
  mergedMrn: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  mergeReason: z.string(),
  mergedSnapshot: z.record(z.unknown()),
  correlationId: z.string(),
  mergedAt: z.string().datetime()
});
export type PatientMergeEventDto = z.infer<typeof PatientMergeEventDtoSchema>;

export const PatientRegistrationAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  action: z.string(),
  targetEntity: z.string(),
  targetEntityId: z.string(),
  justification: z.string(),
  operationStatus: z.enum(['SUCCESS', 'FAILURE', 'DENIED']),
  correlationId: z.string(),
  metadata: z.record(z.unknown()),
  occurredAt: z.string().datetime()
});
export type PatientRegistrationAuditTraceDto = z.infer<typeof PatientRegistrationAuditTraceDtoSchema>;

export const PatientDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
  branchId: z.string().uuid(),
  branchName: z.string().optional(),
  mrn: z.string(),
  patientCode: z.string(),
  firstName: z.string(),
  middleName: z.string().optional(),
  lastName: z.string(),
  preferredName: z.string().optional(),
  fullName: z.string(),
  dateOfBirth: z.string(), // YYYY-MM-DD
  gender: GenderEnum,
  bloodGroup: BloodGroupEnum.optional(),
  maritalStatus: MaritalStatusEnum.optional(),
  nationality: z.string().optional(),
  preferredLanguage: z.string(),
  occupation: z.string().optional(),
  status: PatientStatusEnum,
  registrationSource: RegistrationSourceEnum,
  mergedIntoPatientId: z.string().uuid().optional(),
  primaryContact: PatientContactDtoSchema.optional(),
  primaryAddress: PatientAddressDtoSchema.optional(),
  emergencyContacts: z.array(EmergencyContactDtoSchema).default([]),
  identifiers: z.array(PatientIdentifierDtoSchema).default([]),
  consents: z.array(PatientConsentDtoSchema).default([]),
  insurancePolicies: z.array(PatientInsurancePolicyDtoSchema).default([]),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PatientDto = z.infer<typeof PatientDtoSchema>;

export const PatientRegistrationOverviewDtoSchema = z.object({
  totalPatientsCount: z.number().int().min(0),
  activePatientsCount: z.number().int().min(0),
  newRegistrationsTodayCount: z.number().int().min(0),
  pendingDuplicateReviewsCount: z.number().int().min(0),
  mergedRecordsCount: z.number().int().min(0),
  insuredPatientsCount: z.number().int().min(0),
  activeConsentsCount: z.number().int().min(0)
});
export type PatientRegistrationOverviewDto = z.infer<typeof PatientRegistrationOverviewDtoSchema>;

export const PatientDuplicateCheckResultDtoSchema = z.object({
  matchCategory: DuplicateMatchCategoryEnum,
  confidenceScore: z.number().min(0).max(100),
  matchingSignals: z.array(z.string()),
  matchedPatients: z.array(PatientDtoSchema)
});
export type PatientDuplicateCheckResultDto = z.infer<typeof PatientDuplicateCheckResultDtoSchema>;

// Mutation Request Schemas
export const CreatePatientSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: GenderEnum,
  bloodGroup: BloodGroupEnum.optional(),
  maritalStatus: MaritalStatusEnum.optional(),
  nationality: z.string().optional(),
  preferredLanguage: z.string().default('English'),
  occupation: z.string().optional(),
  registrationSource: RegistrationSourceEnum.default('RECEPTION_DESK'),
  primaryMobile: z.string().min(7),
  alternateMobile: z.string().optional(),
  email: z.string().email().optional(),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default('USA'),
  postalCode: z.string().min(2),
  emergencyContactName: z.string().optional(),
  emergencyRelationship: EmergencyRelationshipEnum.optional(),
  emergencyPrimaryPhone: z.string().optional(),
  insurancePayerName: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceMemberId: z.string().optional(),
  insurancePlanName: z.string().optional(),
  generalConsentGranted: z.boolean().default(true),
  reason: z.string().min(3)
});
export type CreatePatientRequest = z.infer<typeof CreatePatientSchema>;

export const UpdatePatientSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  patientId: z.string().uuid(),
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1).optional(),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: GenderEnum.optional(),
  bloodGroup: BloodGroupEnum.optional(),
  maritalStatus: MaritalStatusEnum.optional(),
  nationality: z.string().optional(),
  preferredLanguage: z.string().optional(),
  occupation: z.string().optional(),
  status: PatientStatusEnum.optional(),
  reason: z.string().min(3)
});
export type UpdatePatientRequest = z.infer<typeof UpdatePatientSchema>;

export const AddPatientIdentifierSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  patientId: z.string().uuid(),
  identifierType: PatientIdentifierTypeEnum,
  identifierValue: z.string().min(1),
  issuingAuthority: z.string().optional(),
  reason: z.string().min(3)
});
export type AddPatientIdentifierRequest = z.infer<typeof AddPatientIdentifierSchema>;

export const UpdatePatientContactSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  patientId: z.string().uuid(),
  primaryMobile: z.string().min(7),
  alternateMobile: z.string().optional(),
  email: z.string().email().optional(),
  preferredContactMethod: ContactMethodEnum.default('MOBILE'),
  reason: z.string().min(3)
});
export type UpdatePatientContactRequest = z.infer<typeof UpdatePatientContactSchema>;

export const UpdatePatientAddressSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  patientId: z.string().uuid(),
  addressType: AddressTypeEnum.default('RESIDENTIAL'),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default('USA'),
  postalCode: z.string().min(2),
  reason: z.string().min(3)
});
export type UpdatePatientAddressRequest = z.infer<typeof UpdatePatientAddressSchema>;

export const AddEmergencyContactSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  patientId: z.string().uuid(),
  contactName: z.string().min(1),
  relationship: EmergencyRelationshipEnum,
  primaryPhone: z.string().min(7),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  isPrimary: z.boolean().default(true),
  reason: z.string().min(3)
});
export type AddEmergencyContactRequest = z.infer<typeof AddEmergencyContactSchema>;

export const AddPatientConsentSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  patientId: z.string().uuid(),
  consentType: PatientConsentTypeEnum,
  consentStatus: PatientConsentStatusEnum.default('GRANTED'),
  expiryDate: z.string().datetime().optional(),
  auditReference: z.string().optional(),
  reason: z.string().min(3)
});
export type AddPatientConsentRequest = z.infer<typeof AddPatientConsentSchema>;

export const AddPatientInsuranceSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  patientId: z.string().uuid(),
  payerName: z.string().min(2),
  policyNumber: z.string().min(2),
  memberId: z.string().min(2),
  planName: z.string().min(2),
  tpaName: z.string().optional(),
  coverageType: InsuranceCoverageTypeEnum.default('PRIMARY'),
  coverageStartDate: z.string().datetime(),
  coverageEndDate: z.string().datetime().optional(),
  reason: z.string().min(3)
});
export type AddPatientInsuranceRequest = z.infer<typeof AddPatientInsuranceSchema>;

export const SearchPatientSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  query: z.string().optional(), // MRN, patientCode, name, phone, email, identifier
  mrn: z.string().optional(),
  name: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().optional(),
  identifier: z.string().optional(),
  dateOfBirth: z.string().optional(),
  status: PatientStatusEnum.optional(),
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50)
});
export type SearchPatientRequest = {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  query?: string | undefined;
  mrn?: string | undefined;
  name?: string | undefined;
  mobile?: string | undefined;
  email?: string | undefined;
  identifier?: string | undefined;
  dateOfBirth?: string | undefined;
  status?: PatientStatus | undefined;
  pageIndex?: number | undefined;
  pageSize?: number | undefined;
};

export const CheckDuplicatePatientSchema = z.object({
  tenantId: z.string().uuid(),
  organizationId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  mobile: z.string(),
  email: z.string().optional(),
  identifierValue: z.string().optional()
});
export type CheckDuplicatePatientRequest = z.infer<typeof CheckDuplicatePatientSchema>;

export const ReviewDuplicatePatientSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  candidateId: z.string().uuid(),
  reviewStatus: DuplicateReviewStatusEnum,
  reviewNotes: z.string().min(3),
  reason: z.string().min(3)
});
export type ReviewDuplicatePatientRequest = z.infer<typeof ReviewDuplicatePatientSchema>;

export const MergePatientSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  canonicalPatientId: z.string().uuid(),
  mergedPatientId: z.string().uuid(),
  mergeReason: z.string().min(3),
  candidateId: z.string().uuid().optional()
});
export type MergePatientRequest = {
  actorId: string;
  actorRole: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  canonicalPatientId: string;
  mergedPatientId: string;
  mergeReason: string;
  candidateId?: string | undefined;
};


export const QueryPatientAuditSchema = z.object({
  tenantId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50)
});
export type QueryPatientAuditRequest = z.infer<typeof QueryPatientAuditSchema>;
