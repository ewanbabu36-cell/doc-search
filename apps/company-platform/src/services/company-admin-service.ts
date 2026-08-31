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
  CompanyOverviewDto,
  CreateLegalEntityRequest,
  CreateDepartmentRequest,
  CreateDesignationRequest,
  CreateInternalEmployeeRequest,
  UpdateEmployeeStatusRequest,
  CreateBoardMemberRequest,
  CreateGovernanceCommitteeRequest,
  AssignCommitteeMemberRequest,
  CreateCorporatePolicyRequest,
  ApproveCorporatePolicyRequest,
  AppointComplianceOfficerRequest,
  ScheduleGovernanceEventRequest,
  CompleteGovernanceEventRequest,
  GenerateCompanyAuditReportRequest
} from '@docsearch/api-contracts';
import {
  MOCK_LEGAL_ENTITIES,
  MOCK_DEPARTMENTS,
  MOCK_DESIGNATIONS,
  MOCK_INTERNAL_EMPLOYEES,
  MOCK_BOARD_MEMBERS,
  MOCK_GOVERNANCE_COMMITTEES,
  MOCK_COMMITTEE_MEMBERSHIPS,
  MOCK_CORPORATE_POLICIES,
  MOCK_COMPLIANCE_OFFICERS,
  MOCK_GOVERNANCE_EVENTS,
  MOCK_COMPANY_AUDIT_TRACES,
  MOCK_COMPANY_OVERVIEW
} from './mock-company-admin-data.js';

export interface ICompanyAdminService {
  getOverview(): Promise<CompanyOverviewDto>;
  getLegalEntities(): Promise<LegalEntityDto[]>;
  createLegalEntity(req: CreateLegalEntityRequest): Promise<LegalEntityDto>;
  getDepartments(): Promise<DepartmentDto[]>;
  createDepartment(req: CreateDepartmentRequest): Promise<DepartmentDto>;
  getDesignations(): Promise<DesignationDto[]>;
  createDesignation(req: CreateDesignationRequest): Promise<DesignationDto>;
  getInternalEmployees(): Promise<InternalEmployeeDto[]>;
  createInternalEmployee(req: CreateInternalEmployeeRequest): Promise<InternalEmployeeDto>;
  updateEmployeeStatus(req: UpdateEmployeeStatusRequest): Promise<InternalEmployeeDto>;
  getBoardMembers(): Promise<BoardMemberDto[]>;
  createBoardMember(req: CreateBoardMemberRequest): Promise<BoardMemberDto>;
  getGovernanceCommittees(): Promise<GovernanceCommitteeDto[]>;
  createGovernanceCommittee(req: CreateGovernanceCommitteeRequest): Promise<GovernanceCommitteeDto>;
  getCommitteeMemberships(): Promise<CommitteeMembershipDto[]>;
  assignCommitteeMember(req: AssignCommitteeMemberRequest): Promise<CommitteeMembershipDto>;
  getCorporatePolicies(): Promise<CorporatePolicyDto[]>;
  createCorporatePolicy(req: CreateCorporatePolicyRequest): Promise<CorporatePolicyDto>;
  approveCorporatePolicy(req: ApproveCorporatePolicyRequest): Promise<CorporatePolicyDto>;
  getComplianceOfficers(): Promise<ComplianceOfficerDto[]>;
  appointComplianceOfficer(req: AppointComplianceOfficerRequest): Promise<ComplianceOfficerDto>;
  getGovernanceEvents(): Promise<GovernanceEventDto[]>;
  scheduleGovernanceEvent(req: ScheduleGovernanceEventRequest): Promise<GovernanceEventDto>;
  completeGovernanceEvent(req: CompleteGovernanceEventRequest): Promise<GovernanceEventDto>;
  getAuditTraces(): Promise<CompanyAuditTraceDto[]>;
  generateAuditReport(req: GenerateCompanyAuditReportRequest): Promise<{ reportId: string; downloadUrl: string }>;
}

export class CompanyAdminService implements ICompanyAdminService {
  private legalEntities: LegalEntityDto[] = [...MOCK_LEGAL_ENTITIES];
  private departments: DepartmentDto[] = [...MOCK_DEPARTMENTS];
  private designations: DesignationDto[] = [...MOCK_DESIGNATIONS];
  private employees: InternalEmployeeDto[] = [...MOCK_INTERNAL_EMPLOYEES];
  private boardMembers: BoardMemberDto[] = [...MOCK_BOARD_MEMBERS];
  private committees: GovernanceCommitteeDto[] = [...MOCK_GOVERNANCE_COMMITTEES];
  private memberships: CommitteeMembershipDto[] = [...MOCK_COMMITTEE_MEMBERSHIPS];
  private policies: CorporatePolicyDto[] = [...MOCK_CORPORATE_POLICIES];
  private complianceOfficers: ComplianceOfficerDto[] = [...MOCK_COMPLIANCE_OFFICERS];
  private events: GovernanceEventDto[] = [...MOCK_GOVERNANCE_EVENTS];
  private auditTraces: CompanyAuditTraceDto[] = [...MOCK_COMPANY_AUDIT_TRACES];

  private addAuditTrace(
    action: string,
    entityReference: string,
    actorEmail: string,
    reason: string,
    operationStatus: 'SUCCESS' | 'FAILURE' | 'DENIED' = 'SUCCESS'
  ) {
    const trace: CompanyAuditTraceDto = {
      id: crypto.randomUUID(),
      traceId: `tr-corp-${Math.floor(1000 + Math.random() * 9000)}`,
      actorEmail,
      action,
      entityReference,
      operationStatus,
      occurredAt: new Date().toISOString(),
      correlationReference: `corr-corp-${Date.now()}`,
      evidenceReference: `ev-corp-${Date.now()}.pdf`,
      reason,
      metadata: {}
    };
    this.auditTraces.unshift(trace);
  }

  async getOverview(): Promise<CompanyOverviewDto> {
    return {
      ...MOCK_COMPANY_OVERVIEW,
      totalEntitiesCount: this.legalEntities.length,
      totalDepartmentsCount: this.departments.length,
      totalEmployeesCount: this.employees.length,
      activeBoardMembersCount: this.boardMembers.filter((b) => b.status === 'ACTIVE').length,
      activeCommitteesCount: this.committees.filter((c) => c.status === 'ACTIVE').length,
      activePoliciesCount: this.policies.filter((p) => p.status === 'ACTIVE').length,
      complianceOfficersCount: this.complianceOfficers.filter((o) => o.status === 'ACTIVE').length,
      upcomingGovernanceEventsCount: this.events.filter((e) => e.status === 'SCHEDULED').length
    };
  }

  async getLegalEntities(): Promise<LegalEntityDto[]> {
    return [...this.legalEntities];
  }

  async createLegalEntity(req: CreateLegalEntityRequest): Promise<LegalEntityDto> {
    const parent = this.legalEntities.find((e) => e.id === req.parentEntityId);
    const entity: LegalEntityDto = {
      id: crypto.randomUUID(),
      entityCode: req.entityCode,
      entityName: req.entityName,
      entityType: req.entityType,
      jurisdiction: req.jurisdiction,
      registrationNumber: req.registrationNumber,
      incorporationDate: req.incorporationDate,
      taxIdentifierReference: req.taxIdentifierReference,
      registeredAddress: req.registeredAddress,
      status: 'ACTIVE',
      parentEntityId: req.parentEntityId,
      parentEntityName: parent?.entityName,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.legalEntities.push(entity);
    this.addAuditTrace('LEGAL_ENTITY_CREATED', entity.entityCode, req.actorEmail, req.reason);
    return entity;
  }

  async getDepartments(): Promise<DepartmentDto[]> {
    return [...this.departments];
  }

  async createDepartment(req: CreateDepartmentRequest): Promise<DepartmentDto> {
    const entity = this.legalEntities.find((e) => e.id === req.legalEntityId);
    const parent = this.departments.find((d) => d.id === req.parentDepartmentId);
    const dept: DepartmentDto = {
      id: crypto.randomUUID(),
      departmentCode: req.departmentCode,
      departmentName: req.departmentName,
      description: req.description,
      costCenterCode: req.costCenterCode,
      legalEntityId: req.legalEntityId,
      legalEntityName: entity?.entityName ?? 'Doc Search Inc.',
      parentDepartmentId: req.parentDepartmentId,
      parentDepartmentName: parent?.departmentName,
      leadEmail: req.leadEmail,
      employeeCount: 0,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.departments.push(dept);
    this.addAuditTrace('DEPARTMENT_CREATED', dept.departmentCode, req.actorEmail, req.reason);
    return dept;
  }

  async getDesignations(): Promise<DesignationDto[]> {
    return [...this.designations];
  }

  async createDesignation(req: CreateDesignationRequest): Promise<DesignationDto> {
    const dept = this.departments.find((d) => d.id === req.departmentId);
    const desig: DesignationDto = {
      id: crypto.randomUUID(),
      designationCode: req.designationCode,
      title: req.title,
      bandLevel: req.bandLevel,
      departmentId: req.departmentId,
      departmentName: dept?.departmentName,
      jobFamily: req.jobFamily,
      isExecutive: req.isExecutive,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.designations.push(desig);
    this.addAuditTrace('DESIGNATION_CREATED', desig.designationCode, req.actorEmail, req.reason);
    return desig;
  }

  async getInternalEmployees(): Promise<InternalEmployeeDto[]> {
    return [...this.employees];
  }

  async createInternalEmployee(req: CreateInternalEmployeeRequest): Promise<InternalEmployeeDto> {
    const entity = this.legalEntities.find((e) => e.id === req.legalEntityId);
    const dept = this.departments.find((d) => d.id === req.departmentId);
    const desig = this.designations.find((g) => g.id === req.designationId);
    const manager = this.employees.find((m) => m.id === req.managerEmployeeId);

    const emp: InternalEmployeeDto = {
      id: crypto.randomUUID(),
      employeeCode: req.employeeCode,
      firstName: req.firstName,
      lastName: req.lastName,
      workEmail: req.workEmail,
      legalEntityId: req.legalEntityId,
      legalEntityName: entity?.entityName ?? 'Doc Search Inc.',
      departmentId: req.departmentId,
      departmentName: dept?.departmentName ?? 'General',
      designationId: req.designationId,
      designationTitle: desig?.title ?? 'Staff Member',
      managerEmployeeId: req.managerEmployeeId,
      managerName: manager ? `${manager.firstName} ${manager.lastName}` : undefined,
      employmentType: req.employmentType,
      employmentStatus: 'ACTIVE',
      startDate: req.startDate,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.employees.push(emp);
    if (dept) {
      dept.employeeCount += 1;
    }
    this.addAuditTrace('INTERNAL_EMPLOYEE_ONBOARDED', emp.employeeCode, req.actorEmail, req.reason);
    return emp;
  }

  async updateEmployeeStatus(req: UpdateEmployeeStatusRequest): Promise<InternalEmployeeDto> {
    const emp = this.employees.find((e) => e.id === req.employeeId);
    if (!emp) throw new Error(`Employee not found with ID ${req.employeeId}`);
    emp.employmentStatus = req.employmentStatus;
    emp.updatedAt = new Date().toISOString();
    this.addAuditTrace('EMPLOYEE_STATUS_UPDATED', emp.employeeCode, req.actorEmail, req.reason);
    return { ...emp };
  }

  async getBoardMembers(): Promise<BoardMemberDto[]> {
    return [...this.boardMembers];
  }

  async createBoardMember(req: CreateBoardMemberRequest): Promise<BoardMemberDto> {
    const bm: BoardMemberDto = {
      id: crypto.randomUUID(),
      memberCode: req.memberCode,
      fullName: req.fullName,
      roleType: req.roleType,
      representingEntity: req.representingEntity,
      votingStatus: req.votingStatus,
      termStartDate: req.termStartDate,
      termEndDate: req.termEndDate,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.boardMembers.push(bm);
    this.addAuditTrace('BOARD_MEMBER_APPOINTED', bm.memberCode, req.actorEmail, req.reason);
    return bm;
  }

  async getGovernanceCommittees(): Promise<GovernanceCommitteeDto[]> {
    return [...this.committees];
  }

  async createGovernanceCommittee(req: CreateGovernanceCommitteeRequest): Promise<GovernanceCommitteeDto> {
    const comm: GovernanceCommitteeDto = {
      id: crypto.randomUUID(),
      committeeCode: req.committeeCode,
      committeeName: req.committeeName,
      committeeType: req.committeeType,
      chairEmail: req.chairEmail,
      charterReference: req.charterReference,
      memberCount: 1,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.committees.push(comm);
    this.addAuditTrace('GOVERNANCE_COMMITTEE_CHARTERED', comm.committeeCode, req.actorEmail, req.reason);
    return comm;
  }

  async getCommitteeMemberships(): Promise<CommitteeMembershipDto[]> {
    return [...this.memberships];
  }

  async assignCommitteeMember(req: AssignCommitteeMemberRequest): Promise<CommitteeMembershipDto> {
    const comm = this.committees.find((c) => c.id === req.committeeId);
    const membership: CommitteeMembershipDto = {
      id: crypto.randomUUID(),
      committeeId: req.committeeId,
      committeeName: comm?.committeeName ?? 'Committee',
      memberType: req.memberType,
      memberName: req.memberName,
      memberEmail: req.memberEmail,
      roleInCommittee: req.roleInCommittee,
      joinedDate: new Date().toISOString(),
      status: 'ACTIVE',
      metadata: {}
    };
    this.memberships.push(membership);
    if (comm) {
      comm.memberCount += 1;
    }
    this.addAuditTrace('COMMITTEE_MEMBER_ASSIGNED', `${comm?.committeeCode ?? 'comm'}:${req.memberEmail}`, req.actorEmail, req.reason);
    return membership;
  }

  async getCorporatePolicies(): Promise<CorporatePolicyDto[]> {
    return [...this.policies];
  }

  async createCorporatePolicy(req: CreateCorporatePolicyRequest): Promise<CorporatePolicyDto> {
    const entity = this.legalEntities.find((e) => e.id === req.legalEntityId);
    const now = new Date();
    const nextReview = new Date(now.getTime() + req.reviewCycleMonths * 30 * 24 * 60 * 60 * 1000);

    const pol: CorporatePolicyDto = {
      id: crypto.randomUUID(),
      policyCode: req.policyCode,
      title: req.title,
      category: req.category,
      versionReference: req.versionReference,
      legalEntityId: req.legalEntityId,
      legalEntityName: entity?.entityName ?? 'Doc Search Inc.',
      reviewCycleMonths: req.reviewCycleMonths,
      nextReviewDue: nextReview.toISOString(),
      documentReference: req.documentReference,
      status: 'DRAFT',
      ownerEmail: req.ownerEmail,
      metadata: {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    this.policies.push(pol);
    this.addAuditTrace('CORPORATE_POLICY_CREATED', pol.policyCode, req.actorEmail, req.reason);
    return pol;
  }

  async approveCorporatePolicy(req: ApproveCorporatePolicyRequest): Promise<CorporatePolicyDto> {
    const pol = this.policies.find((p) => p.id === req.policyId);
    if (!pol) throw new Error(`Corporate policy not found with ID ${req.policyId}`);
    pol.status = 'ACTIVE';
    pol.approvedByBoardAt = new Date().toISOString();
    pol.updatedAt = new Date().toISOString();
    this.addAuditTrace('CORPORATE_POLICY_APPROVED_BY_BOARD', pol.policyCode, req.actorEmail, req.reason);
    return { ...pol };
  }

  async getComplianceOfficers(): Promise<ComplianceOfficerDto[]> {
    return [...this.complianceOfficers];
  }

  async appointComplianceOfficer(req: AppointComplianceOfficerRequest): Promise<ComplianceOfficerDto> {
    const off: ComplianceOfficerDto = {
      id: crypto.randomUUID(),
      officerCode: req.officerCode,
      officerRole: req.officerRole,
      employeeId: req.employeeId,
      officerName: req.officerName,
      workEmail: req.workEmail,
      appointmentDate: new Date().toISOString(),
      regulatoryAuthorityReference: req.regulatoryAuthorityReference,
      status: 'ACTIVE',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.complianceOfficers.push(off);
    this.addAuditTrace('COMPLIANCE_OFFICER_APPOINTED', off.officerCode, req.actorEmail, req.reason);
    return off;
  }

  async getGovernanceEvents(): Promise<GovernanceEventDto[]> {
    return [...this.events];
  }

  async scheduleGovernanceEvent(req: ScheduleGovernanceEventRequest): Promise<GovernanceEventDto> {
    const evt: GovernanceEventDto = {
      id: crypto.randomUUID(),
      eventCode: req.eventCode,
      eventType: req.eventType,
      title: req.title,
      scheduledAt: req.scheduledAt,
      organizerEmail: req.organizerEmail,
      status: 'SCHEDULED',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.events.unshift(evt);
    this.addAuditTrace('GOVERNANCE_EVENT_SCHEDULED', evt.eventCode, req.actorEmail, req.reason);
    return evt;
  }

  async completeGovernanceEvent(req: CompleteGovernanceEventRequest): Promise<GovernanceEventDto> {
    const evt = this.events.find((e) => e.id === req.eventId);
    if (!evt) throw new Error(`Governance event not found with ID ${req.eventId}`);
    evt.status = 'COMPLETED';
    evt.completedAt = new Date().toISOString();
    evt.minutesReference = req.minutesReference;
    evt.resolutionReference = req.resolutionReference;
    evt.updatedAt = new Date().toISOString();
    this.addAuditTrace('GOVERNANCE_EVENT_COMPLETED_WITH_MINUTES', evt.eventCode, req.actorEmail, req.reason);
    return { ...evt };
  }

  async getAuditTraces(): Promise<CompanyAuditTraceDto[]> {
    return [...this.auditTraces];
  }

  async generateAuditReport(req: GenerateCompanyAuditReportRequest): Promise<{ reportId: string; downloadUrl: string }> {
    const reportId = `rep-corp-${Date.now()}`;
    this.addAuditTrace('COMPANY_AUDIT_REPORT_GENERATED', reportId, req.actorEmail, req.reason);
    return {
      reportId,
      downloadUrl: `https://audit.docsearch.internal/reports/${reportId}.pdf`
    };
  }
}

export const companyAdminService = new CompanyAdminService();
