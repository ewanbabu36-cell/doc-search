import type {
  LegalEntityDto,
  DepartmentDto,
  DesignationDto,
  InternalEmployeeDto,
  BoardMemberDto,
  GovernanceCommitteeDto,
  CommitteeMembershipDto,
  CorporatePolicyDto,
  ComplianceOfficerDto,
  GovernanceEventDto,
  CompanyAuditTraceDto,
  CompanyOverviewDto
} from '@docsearch/api-contracts';

export const MOCK_LEGAL_ENTITIES: LegalEntityDto[] = [
  {
    id: 'e1a11111-1111-4111-8111-111111111111',
    entityCode: 'ent-us-corp',
    entityName: 'Doc Search Inc.',
    entityType: 'C_CORP',
    jurisdiction: 'Delaware, United States',
    registrationNumber: 'DE-7892145',
    incorporationDate: '2025-01-15T00:00:00Z',
    taxIdentifierReference: 'EIN-XX-XXX8921',
    registeredAddress: '1209 North Orange Street, Wilmington, DE 19801, USA',
    status: 'ACTIVE',
    metadata: { filingAgent: 'Corporation Service Company (CSC)', fiscalYearEnd: '12-31' },
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e1a22222-2222-4222-8222-222222222222',
    entityCode: 'ent-us-tech-llc',
    entityName: 'Doc Search Technologies LLC',
    entityType: 'SUBSIDIARY',
    jurisdiction: 'California, United States',
    registrationNumber: 'CA-LLC-20250912',
    incorporationDate: '2025-02-01T00:00:00Z',
    taxIdentifierReference: 'EIN-XX-XXX4419',
    registeredAddress: '555 Mission Street, Suite 2400, San Francisco, CA 94105, USA',
    status: 'ACTIVE',
    parentEntityId: 'e1a11111-1111-4111-8111-111111111111',
    parentEntityName: 'Doc Search Inc.',
    metadata: { operationalRole: 'Engineering & Technology R&D Subsidiary' },
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e1a33333-3333-4333-8333-333333333333',
    entityCode: 'ent-uk-ltd',
    entityName: 'Doc Search Healthcare Services UK Ltd',
    entityType: 'INTERNATIONAL_BRANCH',
    jurisdiction: 'England & Wales, United Kingdom',
    registrationNumber: 'UK-COMP-15498210',
    incorporationDate: '2025-06-15T00:00:00Z',
    taxIdentifierReference: 'VAT-GB-XXX-9102-14',
    registeredAddress: '100 Bishopsgate, London EC2N 4AG, United Kingdom',
    status: 'ACTIVE',
    parentEntityId: 'e1a11111-1111-4111-8111-111111111111',
    parentEntityName: 'Doc Search Inc.',
    metadata: { gdprRepresentativeRole: true },
    createdAt: '2025-06-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

export const MOCK_DEPARTMENTS: DepartmentDto[] = [
  {
    id: 'e2a11111-1111-4111-8111-111111111111',
    departmentCode: 'dept-exec',
    departmentName: 'Executive Office & Corporate Strategy',
    description: 'Executive management, board coordination, and corporate planning',
    costCenterCode: 'CC-1000',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    leadEmail: 'founder@docsearch.health',
    employeeCount: 1,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e2a22222-2222-4222-8222-222222222222',
    departmentCode: 'dept-eng',
    departmentName: 'Product & Platform Engineering',
    description: 'Cloud platform architecture, Fastify gateways, React design systems, and data pipelines',
    costCenterCode: 'CC-2000',
    legalEntityId: 'e1a22222-2222-4222-8222-222222222222',
    legalEntityName: 'Doc Search Technologies LLC',
    leadEmail: 'founder@docsearch.health',
    employeeCount: 0,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e2a33333-3333-4333-8333-333333333333',
    departmentCode: 'dept-clinical-ai',
    departmentName: 'Clinical Safety & AI Governance',
    description: 'Medical NLP validation, clinical safety reviews, and prompt boundary governance',
    costCenterCode: 'CC-3000',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    leadEmail: 'founder@docsearch.health',
    employeeCount: 0,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e2a44444-4444-4444-8444-444444444444',
    departmentCode: 'dept-legal-compliance',
    departmentName: 'Regulatory, Legal & Compliance',
    description: 'HIPAA privacy oversight, SOC 2 Type II audit readiness, and enterprise BAAs',
    costCenterCode: 'CC-4000',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    leadEmail: 'founder@docsearch.health',
    employeeCount: 0,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e2a55555-5555-4555-8555-555555555555',
    departmentCode: 'dept-hr',
    departmentName: 'Human Resources & People Operations (HR)',
    description: 'Talent acquisition, clinical & doctor recruitment, staff payroll, performance appraisals, and employee relations',
    costCenterCode: 'CC-5000',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    leadEmail: 'founder@docsearch.health',
    employeeCount: 0,
    status: 'ACTIVE',
    metadata: { focusAreas: ['Talent Sourcing', 'Doctor Hiring', 'Payroll', 'Compliance Training'] },
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e2a66666-6666-4666-8666-666666666666',
    departmentCode: 'dept-finance',
    departmentName: 'Finance, Treasury & Invoicing',
    description: 'Hospital B2B subscription billing, 18% GST filing, doctor revenue share payouts, and corporate treasury',
    costCenterCode: 'CC-6000',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    leadEmail: 'founder@docsearch.health',
    employeeCount: 0,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e2a77777-7777-4777-8777-777777777777',
    departmentCode: 'dept-sales-growth',
    departmentName: 'Enterprise Sales & Strategic Growth',
    description: 'Hospital network contracts, diagnostic lab partnerships, field key account management, and client onboarding',
    costCenterCode: 'CC-7000',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    leadEmail: 'founder@docsearch.health',
    employeeCount: 0,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

export const MOCK_DESIGNATIONS: DesignationDto[] = [
  {
    id: 'e3a11111-1111-4111-8111-111111111111',
    designationCode: 'desig-ceo',
    title: 'Chief Executive Officer',
    bandLevel: 'EXECUTIVE',
    departmentId: 'e2a11111-1111-4111-8111-111111111111',
    departmentName: 'Executive Office & Corporate Strategy',
    jobFamily: 'Executive Leadership',
    isExecutive: true,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e3a22222-2222-4222-8222-222222222222',
    designationCode: 'desig-cmo',
    title: 'Chief Medical Officer & Clinical Director',
    bandLevel: 'EXECUTIVE',
    departmentId: 'e2a33333-3333-4333-8333-333333333333',
    departmentName: 'Clinical Safety & AI Governance',
    jobFamily: 'Clinical Leadership',
    isExecutive: true,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e3a33333-3333-4333-8333-333333333333',
    designationCode: 'desig-vp-eng',
    title: 'Vice President of Platform Engineering',
    bandLevel: 'DIRECTOR',
    departmentId: 'e2a22222-2222-4222-8222-222222222222',
    departmentName: 'Product & Platform Engineering',
    jobFamily: 'Engineering Leadership',
    isExecutive: true,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e3a44444-4444-4444-8444-444444444444',
    designationCode: 'desig-pr-arch',
    title: 'Principal Platform Architect',
    bandLevel: 'PRINCIPAL',
    departmentId: 'e2a22222-2222-4222-8222-222222222222',
    departmentName: 'Product & Platform Engineering',
    jobFamily: 'Software Engineering',
    isExecutive: false,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e3a55555-5555-4555-8555-555555555555',
    designationCode: 'desig-gc-cpo',
    title: 'General Counsel & Chief Privacy Officer',
    bandLevel: 'EXECUTIVE',
    departmentId: 'e2a44444-4444-4444-8444-444444444444',
    departmentName: 'Regulatory, Legal & Compliance',
    jobFamily: 'Legal & Regulatory',
    isExecutive: true,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e3a66666-6666-4666-8666-666666666666',
    designationCode: 'desig-chro',
    title: 'Chief Human Resources Officer (CHRO)',
    bandLevel: 'EXECUTIVE',
    departmentId: 'e2a55555-5555-4555-8555-555555555555',
    departmentName: 'Human Resources & People Operations (HR)',
    jobFamily: 'Human Resources',
    isExecutive: true,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e3a77777-7777-4777-8777-777777777777',
    designationCode: 'desig-hr-lead',
    title: 'Senior HR & Talent Acquisition Lead',
    bandLevel: 'SENIOR',
    departmentId: 'e2a55555-5555-4555-8555-555555555555',
    departmentName: 'Human Resources & People Operations (HR)',
    jobFamily: 'Human Resources',
    isExecutive: false,
    status: 'ACTIVE',
    metadata: {},
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

export const MOCK_INTERNAL_EMPLOYEES: InternalEmployeeDto[] = [
  {
    id: 'e4a11111-1111-4111-8111-111111111111',
    employeeCode: 'EMP-0001',
    firstName: 'MERAJ',
    lastName: 'SHARIF',
    workEmail: 'founder@docsearch.health',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    departmentId: 'e2a11111-1111-4111-8111-111111111111',
    departmentName: 'Executive Office & Corporate Strategy',
    designationId: 'e3a11111-1111-4111-8111-111111111111',
    designationTitle: 'Founder & Chief Executive Officer',
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    startDate: '2025-01-15T00:00:00Z',
    metadata: {
      officeLocation: 'Global HQ',
      role: 'SUPER_ADMIN_FOUNDER',
      isProtectedFounder: true,
      immutableShield: true
    },
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-09-09T00:00:00Z'
  }
];

export const MOCK_BOARD_MEMBERS: BoardMemberDto[] = [
  {
    id: 'e5a11111-1111-4111-8111-111111111111',
    memberCode: 'BM-01',
    fullName: 'MERAJ SHARIF',
    roleType: 'EXECUTIVE_DIRECTOR',
    representingEntity: 'Executive Management (Founder & CEO)',
    votingStatus: 'VOTING',
    termStartDate: '2025-01-15T00:00:00Z',
    status: 'ACTIVE',
    metadata: { founderDirector: true, immutableShield: true },
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-09-09T00:00:00Z'
  }
];

export const MOCK_GOVERNANCE_COMMITTEES: GovernanceCommitteeDto[] = [
  {
    id: 'e6a11111-1111-4111-8111-111111111111',
    committeeCode: 'comm-audit-risk',
    committeeName: 'Audit & Enterprise Risk Committee',
    committeeType: 'AUDIT',
    chairEmail: 'general.counsel@docsearch.internal',
    charterReference: 'charter://corp/audit-risk-committee-2025.pdf',
    memberCount: 3,
    status: 'ACTIVE',
    metadata: { quarterlyAuditReviews: true },
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e6a22222-2222-4222-8222-222222222222',
    committeeCode: 'comm-clinical-safety',
    committeeName: 'Clinical Safety & AI Governance Steering Committee',
    committeeType: 'CLINICAL_SAFETY',
    chairEmail: 'cmo@docsearch.internal',
    charterReference: 'charter://corp/clinical-safety-steering-2025.pdf',
    memberCount: 4,
    status: 'ACTIVE',
    metadata: { nlpSafetyOversight: true },
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

export const MOCK_COMMITTEE_MEMBERSHIPS: CommitteeMembershipDto[] = [
  {
    id: 'e7a11111-1111-4111-8111-111111111111',
    committeeId: 'e6a11111-1111-4111-8111-111111111111',
    committeeName: 'Audit & Enterprise Risk Committee',
    memberType: 'INTERNAL_EMPLOYEE',
    memberName: 'MERAJ SHARIF',
    memberEmail: 'founder@docsearch.health',
    roleInCommittee: 'CHAIR',
    joinedDate: '2025-02-01T00:00:00Z',
    status: 'ACTIVE',
    metadata: {}
  },
  {
    id: 'e7a22222-2222-4222-8222-222222222222',
    committeeId: 'e6a22222-2222-4222-8222-222222222222',
    committeeName: 'Clinical Safety & AI Governance Steering Committee',
    memberType: 'INTERNAL_EMPLOYEE',
    memberName: 'MERAJ SHARIF',
    memberEmail: 'founder@docsearch.health',
    roleInCommittee: 'CHAIR',
    joinedDate: '2025-02-15T00:00:00Z',
    status: 'ACTIVE',
    metadata: {}
  }
];

export const MOCK_CORPORATE_POLICIES: CorporatePolicyDto[] = [
  {
    id: 'e8a11111-1111-4111-8111-111111111111',
    policyCode: 'pol-bylaws-v2',
    title: 'Amended & Restated Corporate Bylaws',
    category: 'BYLAWS',
    versionReference: 'v2.1',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    approvedByBoardAt: '2025-01-15T00:00:00Z',
    reviewCycleMonths: 12,
    nextReviewDue: '2027-01-15T00:00:00Z',
    documentReference: 'doc://corporate/bylaws-restated-v2.1.pdf',
    status: 'ACTIVE',
    ownerEmail: 'founder@docsearch.health',
    metadata: { boardResolutionReference: 'res-2025-01-bylaws' },
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e8a22222-2222-4222-8222-222222222222',
    policyCode: 'pol-code-conduct',
    title: 'Corporate Code of Business Conduct & Ethics',
    category: 'CODE_OF_CONDUCT',
    versionReference: 'v1.4',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    approvedByBoardAt: '2025-02-01T00:00:00Z',
    reviewCycleMonths: 12,
    nextReviewDue: '2027-02-01T00:00:00Z',
    documentReference: 'doc://corporate/code-of-conduct-v1.4.pdf',
    status: 'ACTIVE',
    ownerEmail: 'founder@docsearch.health',
    metadata: { allStaffMandatory: true },
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e8a33333-3333-4333-8333-333333333333',
    policyCode: 'pol-whistleblower',
    title: 'Clinical Safety & Ethics Whistleblower Protection Policy',
    category: 'WHISTLEBLOWER',
    versionReference: 'v1.2',
    legalEntityId: 'e1a11111-1111-4111-8111-111111111111',
    legalEntityName: 'Doc Search Inc.',
    approvedByBoardAt: '2025-02-15T00:00:00Z',
    reviewCycleMonths: 12,
    nextReviewDue: '2027-02-15T00:00:00Z',
    documentReference: 'doc://corporate/whistleblower-protection-v1.2.pdf',
    status: 'ACTIVE',
    ownerEmail: 'founder@docsearch.health',
    metadata: { hotlineRef: 'https://ethics.docsearch.internal' },
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

export const MOCK_COMPLIANCE_OFFICERS: ComplianceOfficerDto[] = [
  {
    id: 'e9a11111-1111-4111-8111-111111111111',
    officerCode: 'off-hipaa-privacy',
    officerRole: 'HIPAA_PRIVACY_OFFICER',
    employeeId: 'emp-0001',
    officerName: 'MERAJ SHARIF',
    workEmail: 'founder@docsearch.health',
    appointmentDate: '2025-02-15T00:00:00Z',
    regulatoryAuthorityReference: 'U.S. HHS Office for Civil Rights (OCR) / HIPAA Entity Registry',
    status: 'ACTIVE',
    metadata: { contactPhone: '+91 98765 00000', officialNoticeEmail: 'founder@docsearch.health' },
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e9a22222-2222-4222-8222-222222222222',
    officerCode: 'off-hipaa-sec',
    officerRole: 'HIPAA_SECURITY_OFFICER',
    employeeId: 'emp-0001',
    officerName: 'MERAJ SHARIF',
    workEmail: 'founder@docsearch.health',
    appointmentDate: '2025-02-15T00:00:00Z',
    regulatoryAuthorityReference: 'NIST CSF / HIPAA Security Rule Governance',
    status: 'ACTIVE',
    metadata: { pkiSignKey: 'vault://compliance/security-officer-sig' },
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'e9a33333-3333-4333-8333-333333333333',
    officerCode: 'off-dpo-uk',
    officerRole: 'DATA_PROTECTION_OFFICER',
    officerName: 'MERAJ SHARIF',
    workEmail: 'founder@docsearch.health',
    appointmentDate: '2025-06-15T00:00:00Z',
    regulatoryAuthorityReference: 'UK Information Commissioner’s Office (ICO) Registration #ZB98214',
    status: 'ACTIVE',
    metadata: { icoRegistration: 'ZB98214' },
    createdAt: '2025-06-15T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

export const MOCK_GOVERNANCE_EVENTS: GovernanceEventDto[] = [
  {
    id: 'f1a11111-1111-4111-8111-111111111111',
    eventCode: 'gov-agm-2026',
    eventType: 'ANNUAL_GENERAL_MEETING',
    title: 'Doc Search Inc. 2026 Annual Shareholder Meeting',
    scheduledAt: '2026-10-15T14:00:00Z',
    organizerEmail: 'founder@docsearch.health',
    minutesReference: 'minutes://corp/agm-2026-draft.pdf',
    status: 'SCHEDULED',
    metadata: { proxyVotingOpenDate: '2026-09-15' },
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'f1a22222-2222-4222-8222-222222222222',
    eventCode: 'gov-bm-2026-q3',
    eventType: 'BOARD_MEETING',
    title: 'Q3 2026 Regular Board of Directors Meeting',
    scheduledAt: '2026-09-20T16:00:00Z',
    organizerEmail: 'founder@docsearch.health',
    minutesReference: 'minutes://corp/board-q3-2026-agenda.pdf',
    status: 'SCHEDULED',
    metadata: { quorumRequired: 1 },
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z'
  },
  {
    id: 'f1a33333-3333-4333-8333-333333333333',
    eventCode: 'gov-filing-delaware-2026',
    eventType: 'FRANCHISE_RENEWAL',
    title: 'State of Delaware Annual Franchise Tax & Annual Report Filing',
    scheduledAt: '2026-03-01T00:00:00Z',
    completedAt: '2026-02-20T10:00:00Z',
    organizerEmail: 'founder@docsearch.health',
    resolutionReference: 'res-delaware-filing-2026-completed',
    status: 'COMPLETED',
    metadata: { stateFilingConfirmation: 'DE-CONF-2026-99214' },
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z'
  }
];

export const MOCK_COMPANY_AUDIT_TRACES: CompanyAuditTraceDto[] = [
  {
    id: 'f2a11111-1111-4111-8111-111111111111',
    traceId: 'tr-corp-901',
    actorEmail: 'general.counsel@docsearch.internal',
    action: 'CORPORATE_POLICY_APPROVED',
    entityReference: 'pol-bylaws-v2',
    operationStatus: 'SUCCESS',
    occurredAt: '2026-08-01T10:00:00Z',
    correlationReference: 'corr-board-res-2025-01',
    evidenceReference: 'ev-bylaws-signoff-2025.pdf',
    reason: 'Annual corporate bylaws review and unanimous board consent sign-off',
    metadata: { boardVotesInFavor: 4, boardVotesAgainst: 0 }
  },
  {
    id: 'f2a22222-2222-4222-8222-222222222222',
    actorEmail: 'ceo@docsearch.internal',
    action: 'COMPLIANCE_OFFICER_APPOINTED',
    entityReference: 'off-hipaa-privacy',
    operationStatus: 'SUCCESS',
    occurredAt: '2026-08-15T14:30:00Z',
    traceId: 'tr-corp-902',
    correlationReference: 'corr-app-hipaa-cpo-2025',
    evidenceReference: 'ev-cpo-appointment-letter.pdf',
    reason: 'Formal corporate appointment of General Counsel as Chief Privacy Officer',
    metadata: { hhsRegistrationNotified: true }
  }
];

export const MOCK_COMPANY_OVERVIEW: CompanyOverviewDto = {
  totalEntitiesCount: MOCK_LEGAL_ENTITIES.length,
  totalDepartmentsCount: MOCK_DEPARTMENTS.length,
  totalEmployeesCount: MOCK_INTERNAL_EMPLOYEES.length,
  activeBoardMembersCount: MOCK_BOARD_MEMBERS.filter((b) => b.status === 'ACTIVE').length,
  activeCommitteesCount: MOCK_GOVERNANCE_COMMITTEES.filter((c) => c.status === 'ACTIVE').length,
  activePoliciesCount: MOCK_CORPORATE_POLICIES.filter((p) => p.status === 'ACTIVE').length,
  complianceOfficersCount: MOCK_COMPLIANCE_OFFICERS.filter((o) => o.status === 'ACTIVE').length,
  upcomingGovernanceEventsCount: MOCK_GOVERNANCE_EVENTS.filter((e) => e.status === 'SCHEDULED').length,
  governancePostureStatus: 'Compliant & Active (Delaware C-Corp)'
};
