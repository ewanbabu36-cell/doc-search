import { z } from 'zod';

// ==========================================
// 1. ENUMS
// ==========================================

export const LegalEntityTypeSchema = z.enum([
  'C_CORP',
  'LLC',
  'SUBSIDIARY',
  'HOLDING_COMPANY',
  'INTERNATIONAL_BRANCH'
]);
export type LegalEntityType = z.infer<typeof LegalEntityTypeSchema>;

export const EntityStatusSchema = z.enum([
  'ACTIVE',
  'DORMANT',
  'DISSOLVED',
  'UNDER_REVIEW'
]);
export type EntityStatus = z.infer<typeof EntityStatusSchema>;

export const DepartmentStatusSchema = z.enum([
  'ACTIVE',
  'RESTRUCTURED',
  'ARCHIVED'
]);
export type DepartmentStatus = z.infer<typeof DepartmentStatusSchema>;

export const BandLevelSchema = z.enum([
  'EXECUTIVE',
  'DIRECTOR',
  'PRINCIPAL',
  'SENIOR',
  'MID',
  'ASSOCIATE'
]);
export type BandLevel = z.infer<typeof BandLevelSchema>;

export const EmploymentTypeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACTOR',
  'ADVISOR'
]);
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

export const EmploymentStatusSchema = z.enum([
  'ACTIVE',
  'ON_LEAVE',
  'TERMINATED',
  'SUSPENDED'
]);
export type EmploymentStatus = z.infer<typeof EmploymentStatusSchema>;

export const BoardRoleTypeSchema = z.enum([
  'CHAIRMAN',
  'EXECUTIVE_DIRECTOR',
  'INDEPENDENT_DIRECTOR',
  'INVESTOR_DIRECTOR',
  'BOARD_OBSERVER'
]);
export type BoardRoleType = z.infer<typeof BoardRoleTypeSchema>;

export const VotingStatusSchema = z.enum([
  'VOTING',
  'NON_VOTING'
]);
export type VotingStatus = z.infer<typeof VotingStatusSchema>;

export const BoardMemberStatusSchema = z.enum([
  'ACTIVE',
  'RESIGNED',
  'TERM_COMPLETED'
]);
export type BoardMemberStatus = z.infer<typeof BoardMemberStatusSchema>;

export const CommitteeTypeSchema = z.enum([
  'AUDIT',
  'COMPENSATION',
  'NOMINATING_GOVERNANCE',
  'CLINICAL_SAFETY',
  'CYBERSECURITY'
]);
export type CommitteeType = z.infer<typeof CommitteeTypeSchema>;

export const CorporatePolicyCategorySchema = z.enum([
  'BYLAWS',
  'CODE_OF_CONDUCT',
  'CONFLICT_OF_INTEREST',
  'WHISTLEBLOWER',
  'EXECUTIVE_COMPENSATION',
  'CLINICAL_GOVERNANCE'
]);
export type CorporatePolicyCategory = z.infer<typeof CorporatePolicyCategorySchema>;

export const CorporatePolicyStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'UNDER_REVIEW',
  'SUPERSEDED'
]);
export type CorporatePolicyStatus = z.infer<typeof CorporatePolicyStatusSchema>;

export const ComplianceOfficerRoleSchema = z.enum([
  'HIPAA_PRIVACY_OFFICER',
  'HIPAA_SECURITY_OFFICER',
  'CHIEF_COMPLIANCE_OFFICER',
  'DATA_PROTECTION_OFFICER'
]);
export type ComplianceOfficerRole = z.infer<typeof ComplianceOfficerRoleSchema>;

export const ComplianceOfficerStatusSchema = z.enum([
  'ACTIVE',
  'DEPUTIZED',
  'TRANSITIONED'
]);
export type ComplianceOfficerStatus = z.infer<typeof ComplianceOfficerStatusSchema>;

export const GovernanceEventTypeSchema = z.enum([
  'ANNUAL_GENERAL_MEETING',
  'BOARD_MEETING',
  'COMMITTEE_MEETING',
  'REGULATORY_FILING',
  'FRANCHISE_RENEWAL'
]);
export type GovernanceEventType = z.infer<typeof GovernanceEventTypeSchema>;

export const GovernanceEventStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'POSTPONED',
  'CANCELLED'
]);
export type GovernanceEventStatus = z.infer<typeof GovernanceEventStatusSchema>;

export const AuditOperationStatusSchema = z.enum([
  'SUCCESS',
  'FAILURE',
  'DENIED'
]);
export type AuditOperationStatus = z.infer<typeof AuditOperationStatusSchema>;

// ==========================================
// 2. DTOs
// ==========================================

export const LegalEntityDtoSchema = z.object({
  id: z.string().uuid(),
  entityCode: z.string(),
  entityName: z.string(),
  entityType: LegalEntityTypeSchema,
  jurisdiction: z.string(),
  registrationNumber: z.string(),
  incorporationDate: z.string(),
  taxIdentifierReference: z.string(),
  registeredAddress: z.string(),
  status: EntityStatusSchema,
  parentEntityId: z.string().uuid().optional(),
  parentEntityName: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type LegalEntityDto = z.infer<typeof LegalEntityDtoSchema>;

export const DepartmentDtoSchema = z.object({
  id: z.string().uuid(),
  departmentCode: z.string(),
  departmentName: z.string(),
  description: z.string(),
  costCenterCode: z.string(),
  legalEntityId: z.string().uuid(),
  legalEntityName: z.string().optional(),
  parentDepartmentId: z.string().uuid().optional(),
  parentDepartmentName: z.string().optional(),
  leadEmployeeId: z.string().uuid().optional(),
  leadEmail: z.string().optional(),
  employeeCount: z.number().default(0),
  status: DepartmentStatusSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type DepartmentDto = z.infer<typeof DepartmentDtoSchema>;

export const DesignationDtoSchema = z.object({
  id: z.string().uuid(),
  designationCode: z.string(),
  title: z.string(),
  bandLevel: BandLevelSchema,
  departmentId: z.string().uuid().optional(),
  departmentName: z.string().optional(),
  jobFamily: z.string(),
  isExecutive: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'DEPRECATED']),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type DesignationDto = z.infer<typeof DesignationDtoSchema>;

export const InternalEmployeeDtoSchema = z.object({
  id: z.string().uuid(),
  employeeCode: z.string(),
  userId: z.string().uuid().optional(),
  firstName: z.string(),
  lastName: z.string(),
  workEmail: z.string().email(),
  legalEntityId: z.string().uuid(),
  legalEntityName: z.string().optional(),
  departmentId: z.string().uuid(),
  departmentName: z.string().optional(),
  designationId: z.string().uuid(),
  designationTitle: z.string().optional(),
  managerEmployeeId: z.string().uuid().optional(),
  managerName: z.string().optional(),
  employmentType: EmploymentTypeSchema,
  employmentStatus: EmploymentStatusSchema,
  startDate: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type InternalEmployeeDto = z.infer<typeof InternalEmployeeDtoSchema>;

export const BoardMemberDtoSchema = z.object({
  id: z.string().uuid(),
  memberCode: z.string(),
  fullName: z.string(),
  roleType: BoardRoleTypeSchema,
  representingEntity: z.string(),
  votingStatus: VotingStatusSchema,
  termStartDate: z.string(),
  termEndDate: z.string().optional(),
  status: BoardMemberStatusSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type BoardMemberDto = z.infer<typeof BoardMemberDtoSchema>;

export const GovernanceCommitteeDtoSchema = z.object({
  id: z.string().uuid(),
  committeeCode: z.string(),
  committeeName: z.string(),
  committeeType: CommitteeTypeSchema,
  chairPersonId: z.string().uuid().optional(),
  chairEmail: z.string(),
  charterReference: z.string(),
  memberCount: z.number().default(0),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type GovernanceCommitteeDto = z.infer<typeof GovernanceCommitteeDtoSchema>;

export const CommitteeMembershipDtoSchema = z.object({
  id: z.string().uuid(),
  committeeId: z.string().uuid(),
  committeeName: z.string().optional(),
  memberId: z.string().uuid().optional(),
  memberType: z.enum(['BOARD_MEMBER', 'INTERNAL_EMPLOYEE', 'EXTERNAL_ADVISOR']),
  memberName: z.string(),
  memberEmail: z.string(),
  roleInCommittee: z.enum(['CHAIR', 'REGULAR_MEMBER', 'ADVISOR']),
  joinedDate: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  metadata: z.record(z.unknown()).default({})
});
export type CommitteeMembershipDto = z.infer<typeof CommitteeMembershipDtoSchema>;

export const CorporatePolicyDtoSchema = z.object({
  id: z.string().uuid(),
  policyCode: z.string(),
  title: z.string(),
  category: CorporatePolicyCategorySchema,
  versionReference: z.string(),
  legalEntityId: z.string().uuid().optional(),
  legalEntityName: z.string().optional(),
  approvedByBoardAt: z.string().optional(),
  reviewCycleMonths: z.number().default(12),
  nextReviewDue: z.string(),
  documentReference: z.string(),
  status: CorporatePolicyStatusSchema,
  ownerEmail: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type CorporatePolicyDto = z.infer<typeof CorporatePolicyDtoSchema>;

export const ComplianceOfficerDtoSchema = z.object({
  id: z.string().uuid(),
  officerCode: z.string(),
  officerRole: ComplianceOfficerRoleSchema,
  employeeId: z.string().uuid().optional(),
  officerName: z.string(),
  workEmail: z.string(),
  appointmentDate: z.string(),
  regulatoryAuthorityReference: z.string(),
  status: ComplianceOfficerStatusSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type ComplianceOfficerDto = z.infer<typeof ComplianceOfficerDtoSchema>;

export const GovernanceEventDtoSchema = z.object({
  id: z.string().uuid(),
  eventCode: z.string(),
  eventType: GovernanceEventTypeSchema,
  title: z.string(),
  scheduledAt: z.string(),
  completedAt: z.string().optional(),
  organizerEmail: z.string(),
  minutesReference: z.string().optional(),
  resolutionReference: z.string().optional(),
  status: GovernanceEventStatusSchema,
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type GovernanceEventDto = z.infer<typeof GovernanceEventDtoSchema>;

export const CompanyAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string(),
  actorId: z.string().uuid().optional(),
  actorEmail: z.string(),
  action: z.string(),
  entityReference: z.string(),
  operationStatus: AuditOperationStatusSchema,
  occurredAt: z.string(),
  correlationReference: z.string().optional(),
  evidenceReference: z.string().optional(),
  reason: z.string(),
  metadata: z.record(z.unknown()).default({})
});
export type CompanyAuditTraceDto = z.infer<typeof CompanyAuditTraceDtoSchema>;

export const CompanyOverviewDtoSchema = z.object({
  totalEntitiesCount: z.number(),
  totalDepartmentsCount: z.number(),
  totalEmployeesCount: z.number(),
  activeBoardMembersCount: z.number(),
  activeCommitteesCount: z.number(),
  activePoliciesCount: z.number(),
  complianceOfficersCount: z.number(),
  upcomingGovernanceEventsCount: z.number(),
  governancePostureStatus: z.string()
});
export type CompanyOverviewDto = z.infer<typeof CompanyOverviewDtoSchema>;

// ==========================================
// 3. REQUEST SCHEMAS (MUTATIONS)
// ==========================================

export const CreateLegalEntityRequestSchema = z.object({
  entityCode: z.string().min(2),
  entityName: z.string().min(2),
  entityType: LegalEntityTypeSchema,
  jurisdiction: z.string().min(2),
  registrationNumber: z.string().min(2),
  incorporationDate: z.string(),
  taxIdentifierReference: z.string().min(2),
  registeredAddress: z.string().min(5),
  parentEntityId: z.string().uuid().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateLegalEntityRequest = z.infer<typeof CreateLegalEntityRequestSchema>;

export const CreateDepartmentRequestSchema = z.object({
  departmentCode: z.string().min(2),
  departmentName: z.string().min(2),
  description: z.string().min(2),
  costCenterCode: z.string().min(2),
  legalEntityId: z.string().uuid(),
  parentDepartmentId: z.string().uuid().optional(),
  leadEmail: z.string().email().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateDepartmentRequest = z.infer<typeof CreateDepartmentRequestSchema>;

export const CreateDesignationRequestSchema = z.object({
  designationCode: z.string().min(2),
  title: z.string().min(2),
  bandLevel: BandLevelSchema,
  departmentId: z.string().uuid().optional(),
  jobFamily: z.string().min(2),
  isExecutive: z.boolean().default(false),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateDesignationRequest = z.infer<typeof CreateDesignationRequestSchema>;

export const CreateInternalEmployeeRequestSchema = z.object({
  employeeCode: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  workEmail: z.string().email(),
  legalEntityId: z.string().uuid(),
  departmentId: z.string().uuid(),
  designationId: z.string().uuid(),
  managerEmployeeId: z.string().uuid().optional(),
  employmentType: EmploymentTypeSchema,
  startDate: z.string(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateInternalEmployeeRequest = z.infer<typeof CreateInternalEmployeeRequestSchema>;

export const UpdateEmployeeStatusRequestSchema = z.object({
  employeeId: z.string().uuid(),
  employmentStatus: EmploymentStatusSchema,
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type UpdateEmployeeStatusRequest = z.infer<typeof UpdateEmployeeStatusRequestSchema>;

export const CreateBoardMemberRequestSchema = z.object({
  memberCode: z.string().min(2),
  fullName: z.string().min(2),
  roleType: BoardRoleTypeSchema,
  representingEntity: z.string().min(2),
  votingStatus: VotingStatusSchema,
  termStartDate: z.string(),
  termEndDate: z.string().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateBoardMemberRequest = z.infer<typeof CreateBoardMemberRequestSchema>;

export const CreateGovernanceCommitteeRequestSchema = z.object({
  committeeCode: z.string().min(2),
  committeeName: z.string().min(2),
  committeeType: CommitteeTypeSchema,
  chairEmail: z.string().email(),
  charterReference: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateGovernanceCommitteeRequest = z.infer<typeof CreateGovernanceCommitteeRequestSchema>;

export const AssignCommitteeMemberRequestSchema = z.object({
  committeeId: z.string().uuid(),
  memberType: z.enum(['BOARD_MEMBER', 'INTERNAL_EMPLOYEE', 'EXTERNAL_ADVISOR']),
  memberName: z.string().min(2),
  memberEmail: z.string().email(),
  roleInCommittee: z.enum(['CHAIR', 'REGULAR_MEMBER', 'ADVISOR']),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type AssignCommitteeMemberRequest = z.infer<typeof AssignCommitteeMemberRequestSchema>;

export const CreateCorporatePolicyRequestSchema = z.object({
  policyCode: z.string().min(2),
  title: z.string().min(2),
  category: CorporatePolicyCategorySchema,
  versionReference: z.string().min(2),
  legalEntityId: z.string().uuid().optional(),
  reviewCycleMonths: z.number().min(1).default(12),
  documentReference: z.string().min(2),
  ownerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CreateCorporatePolicyRequest = z.infer<typeof CreateCorporatePolicyRequestSchema>;

export const ApproveCorporatePolicyRequestSchema = z.object({
  policyId: z.string().uuid(),
  resolutionReference: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ApproveCorporatePolicyRequest = z.infer<typeof ApproveCorporatePolicyRequestSchema>;

export const AppointComplianceOfficerRequestSchema = z.object({
  officerCode: z.string().min(2),
  officerRole: ComplianceOfficerRoleSchema,
  employeeId: z.string().uuid().optional(),
  officerName: z.string().min(2),
  workEmail: z.string().email(),
  regulatoryAuthorityReference: z.string().min(2),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type AppointComplianceOfficerRequest = z.infer<typeof AppointComplianceOfficerRequestSchema>;

export const ScheduleGovernanceEventRequestSchema = z.object({
  eventCode: z.string().min(2),
  eventType: GovernanceEventTypeSchema,
  title: z.string().min(2),
  scheduledAt: z.string(),
  organizerEmail: z.string().email(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type ScheduleGovernanceEventRequest = z.infer<typeof ScheduleGovernanceEventRequestSchema>;

export const CompleteGovernanceEventRequestSchema = z.object({
  eventId: z.string().uuid(),
  minutesReference: z.string().min(2),
  resolutionReference: z.string().optional(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type CompleteGovernanceEventRequest = z.infer<typeof CompleteGovernanceEventRequestSchema>;

export const GenerateCompanyAuditReportRequestSchema = z.object({
  reportType: z.string(),
  actorEmail: z.string().email(),
  reason: z.string().min(3)
});
export type GenerateCompanyAuditReportRequest = z.infer<typeof GenerateCompanyAuditReportRequestSchema>;
