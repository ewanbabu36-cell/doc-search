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
import { apiCall, isMockFallbackAllowed } from './api-client.js';

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
  private legalEntities: LegalEntityDto[];
  private departments: DepartmentDto[];
  private designations: DesignationDto[];
  private employees: InternalEmployeeDto[];
  private boardMembers: BoardMemberDto[];
  private committees: GovernanceCommitteeDto[];
  private memberships: CommitteeMembershipDto[];
  private policies: CorporatePolicyDto[];
  private complianceOfficers: ComplianceOfficerDto[];
  private events: GovernanceEventDto[];
  private auditTraces: CompanyAuditTraceDto[];

  constructor(_apiUrl?: string) {
    this.legalEntities = this.loadStorage('docsearch_company_entities', [...MOCK_LEGAL_ENTITIES]);
    this.departments = this.loadStorage('docsearch_company_departments', [...MOCK_DEPARTMENTS]);
    this.designations = this.loadStorage('docsearch_company_designations', [...MOCK_DESIGNATIONS]);
    this.employees = this.loadStorage('docsearch_company_employees', [...MOCK_INTERNAL_EMPLOYEES]);
    this.boardMembers = this.loadStorage('docsearch_company_board', [...MOCK_BOARD_MEMBERS]);
    this.committees = this.loadStorage('docsearch_company_committees', [...MOCK_GOVERNANCE_COMMITTEES]);
    this.memberships = this.loadStorage('docsearch_company_memberships', [...MOCK_COMMITTEE_MEMBERSHIPS]);
    this.policies = this.loadStorage('docsearch_company_policies', [...MOCK_CORPORATE_POLICIES]);
    this.complianceOfficers = this.loadStorage('docsearch_company_officers', [...MOCK_COMPLIANCE_OFFICERS]);
    this.events = this.loadStorage('docsearch_company_events', [...MOCK_GOVERNANCE_EVENTS]);
    this.auditTraces = this.loadStorage('docsearch_company_audit', [...MOCK_COMPANY_AUDIT_TRACES]);

    // Sanitize cached employees: Purge obsolete mock accounts and lock in Founder MERAJ SHARIF
    const nonMockEmployees = this.employees.filter((e) => {
      const email = (e.workEmail || '').toLowerCase();
      const first = (e.firstName || '').toUpperCase();
      const last = (e.lastName || '').toUpperCase();
      return !(
        email.includes('alok.sharma') ||
        email.includes('shahalam') ||
        first.includes('ALOK') ||
        first.includes('SHAH') ||
        (last.includes('SHARMA') && first.includes('ALOK'))
      );
    });
    const hasFounder = nonMockEmployees.some(
      (e) => (e.firstName?.toUpperCase() === 'MERAJ' && e.lastName?.toUpperCase() === 'SHARIF') ||
             e.workEmail?.toLowerCase() === 'founder@docsearch.health'
    );
    if (!hasFounder) {
      nonMockEmployees.unshift(MOCK_INTERNAL_EMPLOYEES[0]!);
    }
    this.employees = nonMockEmployees;
    this.saveStorage('docsearch_company_employees', this.employees);

    // Sanitize cached board members: Retain only Founder MERAJ SHARIF and real board seats
    const nonMockBoard = this.boardMembers.filter(
      (b) => b.fullName?.toUpperCase() === 'MERAJ SHARIF' ||
             (!['bm-01', 'bm-02', 'bm-03', 'bm-04'].includes(b.memberCode.toLowerCase()) &&
              b.fullName?.toUpperCase() !== 'ARTHUR STERLING' &&
              b.fullName?.toUpperCase() !== 'SHAH ALAM')
    );
    if (!nonMockBoard.some((b) => b.fullName?.toUpperCase() === 'MERAJ SHARIF')) {
      nonMockBoard.unshift(MOCK_BOARD_MEMBERS[0]!);
    }
    this.boardMembers = nonMockBoard;
    this.saveStorage('docsearch_company_board', this.boardMembers);
  }

  private loadStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveStorage<T>(key: string, val: T): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }

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
    this.saveStorage('docsearch_company_audit', this.auditTraces);
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

  // --- LEGAL ENTITIES ---
  async getLegalEntities(): Promise<LegalEntityDto[]> {
    try {
      const data = await apiCall<LegalEntityDto[]>('/api/v1/company/admin/legal-entities');
      if (Array.isArray(data)) {
        this.legalEntities = data;
        this.saveStorage('docsearch_company_entities', this.legalEntities);
        return [...this.legalEntities];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.legalEntities];
  }

  async createLegalEntity(req: CreateLegalEntityRequest): Promise<LegalEntityDto> {
    try {
      const entity = await apiCall<LegalEntityDto>('/api/v1/company/admin/legal-entities', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (entity) {
        this.legalEntities.push(entity);
        this.saveStorage('docsearch_company_entities', this.legalEntities);
        this.addAuditTrace('LEGAL_ENTITY_CREATED', entity.entityCode, req.actorEmail, req.reason);
        return entity;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

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
    this.saveStorage('docsearch_company_entities', this.legalEntities);
    this.addAuditTrace('LEGAL_ENTITY_CREATED', entity.entityCode, req.actorEmail, req.reason);
    return entity;
  }

  // --- DEPARTMENTS ---
  async getDepartments(): Promise<DepartmentDto[]> {
    try {
      const data = await apiCall<DepartmentDto[]>('/api/v1/company/admin/departments');
      if (Array.isArray(data)) {
        this.departments = data;
        this.saveStorage('docsearch_company_departments', this.departments);
        return [...this.departments];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.departments];
  }

  async createDepartment(req: CreateDepartmentRequest): Promise<DepartmentDto> {
    try {
      const dept = await apiCall<DepartmentDto>('/api/v1/company/admin/departments', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (dept) {
        this.departments.push(dept);
        this.saveStorage('docsearch_company_departments', this.departments);
        this.addAuditTrace('DEPARTMENT_CREATED', dept.departmentCode, req.actorEmail, req.reason);
        return dept;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

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
    this.saveStorage('docsearch_company_departments', this.departments);
    this.addAuditTrace('DEPARTMENT_CREATED', dept.departmentCode, req.actorEmail, req.reason);
    return dept;
  }

  // --- DESIGNATIONS ---
  async getDesignations(): Promise<DesignationDto[]> {
    try {
      const data = await apiCall<DesignationDto[]>('/api/v1/company/admin/designations');
      if (Array.isArray(data)) {
        this.designations = data;
        this.saveStorage('docsearch_company_designations', this.designations);
        return [...this.designations];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    return [...this.designations];
  }

  async createDesignation(req: CreateDesignationRequest): Promise<DesignationDto> {
    try {
      const desig = await apiCall<DesignationDto>('/api/v1/company/admin/designations', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (desig) {
        this.designations.push(desig);
        this.saveStorage('docsearch_company_designations', this.designations);
        this.addAuditTrace('DESIGNATION_CREATED', desig.designationCode, req.actorEmail, req.reason);
        return desig;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

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
    this.saveStorage('docsearch_company_designations', this.designations);
    this.addAuditTrace('DESIGNATION_CREATED', desig.designationCode, req.actorEmail, req.reason);
    return desig;
  }

  // --- INTERNAL EMPLOYEES ---
  async getInternalEmployees(): Promise<InternalEmployeeDto[]> {
    try {
      const data = await apiCall<InternalEmployeeDto[]>('/api/v1/company/admin/internal-employees');
      if (Array.isArray(data)) {
        const cleaned = data.filter((e) => {
          const email = (e.workEmail || '').toLowerCase();
          const first = (e.firstName || '').toUpperCase();
          const last = (e.lastName || '').toUpperCase();
          return !(
            email.includes('alok.sharma') ||
            email.includes('shahalam') ||
            first.includes('ALOK') ||
            first.includes('SHAH') ||
            (last.includes('SHARMA') && first.includes('ALOK'))
          );
        });
        if (!cleaned.some((e) => e.workEmail?.toLowerCase() === 'founder@docsearch.health')) {
          cleaned.unshift(MOCK_INTERNAL_EMPLOYEES[0]!);
        }
        this.employees = cleaned;
        this.saveStorage('docsearch_company_employees', this.employees);
        return [...this.employees];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
    const cleaned = this.employees.filter((e) => {
      const email = (e.workEmail || '').toLowerCase();
      const first = (e.firstName || '').toUpperCase();
      const last = (e.lastName || '').toUpperCase();
      return !(
        email.includes('alok.sharma') ||
        email.includes('shahalam') ||
        first.includes('ALOK') ||
        first.includes('SHAH') ||
        (last.includes('SHARMA') && first.includes('ALOK'))
      );
    });
    if (!cleaned.some((e) => e.workEmail?.toLowerCase() === 'founder@docsearch.health')) {
      cleaned.unshift(MOCK_INTERNAL_EMPLOYEES[0]!);
    }
    this.employees = cleaned;
    this.saveStorage('docsearch_company_employees', this.employees);
    return [...this.employees];
  }

  async createInternalEmployee(req: CreateInternalEmployeeRequest): Promise<InternalEmployeeDto> {
    try {
      const emp = await apiCall<InternalEmployeeDto>('/api/v1/company/admin/internal-employees', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      if (emp) {
        this.employees.unshift(emp);
        this.saveStorage('docsearch_company_employees', this.employees);
        this.addAuditTrace('INTERNAL_EMPLOYEE_ONBOARDED', emp.employeeCode, req.actorEmail, req.reason);
        return emp;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

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
      departmentName: dept?.departmentName ?? 'Clinical & Hospital Operations',
      designationId: req.designationId,
      designationTitle: desig?.title ?? 'Clinical Operations Lead',
      managerEmployeeId: req.managerEmployeeId,
      managerName: manager ? `${manager.firstName} ${manager.lastName}` : undefined,
      employmentType: req.employmentType,
      employmentStatus: 'ACTIVE',
      startDate: req.startDate,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.employees.unshift(emp);
    if (dept) {
      dept.employeeCount += 1;
      this.saveStorage('docsearch_company_departments', this.departments);
    }
    this.saveStorage('docsearch_company_employees', this.employees);
    this.addAuditTrace('INTERNAL_EMPLOYEE_ONBOARDED', emp.employeeCode, req.actorEmail, req.reason);
    return emp;
  }

  async updateEmployeeStatus(req: UpdateEmployeeStatusRequest): Promise<InternalEmployeeDto> {
    const target = this.employees.find((e) => e.id === req.employeeId);
    if (target) {
      const isFounder =
        (target.firstName?.toUpperCase() === 'MERAJ' && target.lastName?.toUpperCase() === 'SHARIF') ||
        target.workEmail?.toLowerCase() === 'founder@docsearch.health' ||
        target.workEmail?.toLowerCase() === 'meraj@docsearch.health' ||
        Boolean((target.metadata as any)?.isProtectedFounder);

      if (isFounder) {
        this.addAuditTrace(
          'FOUNDER_SHIELD_SECURITY_BLOCK',
          target.employeeCode,
          req.actorEmail || 'unauthorized@docsearch.internal',
          'Attempted modification or status change on Founder MERAJ SHARIF blocked by immutable Founder Shield',
          'DENIED'
        );
        throw new Error(
          'IMMUTABLE FOUNDER SHIELD ACTIVE: Meraj Sharif is the Company Founder & Root Account. This profile is permanently protected and cannot be changed, updated, deactivated, suspended, or removed.'
        );
      }
    }

    try {
      const updated = await apiCall<InternalEmployeeDto>(`/api/v1/company/admin/internal-employees/${req.employeeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: req.employmentStatus, reason: req.reason })
      });
      if (updated) {
        this.employees = this.employees.map((e) => (e.id === updated.id ? updated : e));
        this.saveStorage('docsearch_company_employees', this.employees);
        this.addAuditTrace('EMPLOYEE_STATUS_UPDATED', updated.employeeCode, req.actorEmail, req.reason);
        return updated;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }

    const emp = this.employees.find((e) => e.id === req.employeeId);
    if (!emp) throw new Error(`Employee not found with ID ${req.employeeId}`);
    emp.employmentStatus = req.employmentStatus;
    emp.updatedAt = new Date().toISOString();
    this.saveStorage('docsearch_company_employees', this.employees);
    this.addAuditTrace('EMPLOYEE_STATUS_UPDATED', emp.employeeCode, req.actorEmail, req.reason);
    return { ...emp };
  }

  // --- BOARD MEMBERS ---
  async getBoardMembers(): Promise<BoardMemberDto[]> {
    try {
      const data = await apiCall<BoardMemberDto[]>('/api/v1/company/admin/board-members');
      if (Array.isArray(data)) {
        this.boardMembers = data;
        this.saveStorage('docsearch_company_board', this.boardMembers);
        return [...this.boardMembers];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
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
    this.saveStorage('docsearch_company_board', this.boardMembers);
    this.addAuditTrace('BOARD_MEMBER_APPOINTED', bm.memberCode, req.actorEmail, req.reason);
    return bm;
  }

  // --- GOVERNANCE COMMITTEES ---
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
    this.saveStorage('docsearch_company_committees', this.committees);
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
    this.saveStorage('docsearch_company_memberships', this.memberships);
    this.addAuditTrace('COMMITTEE_MEMBER_ASSIGNED', `${comm?.committeeCode ?? 'comm'}:${req.memberEmail}`, req.actorEmail, req.reason);
    return membership;
  }

  // --- CORPORATE POLICIES ---
  async getCorporatePolicies(): Promise<CorporatePolicyDto[]> {
    try {
      const data = await apiCall<CorporatePolicyDto[]>('/api/v1/company/admin/policies');
      if (Array.isArray(data) && data.length > 0) {
        this.policies = data;
        this.saveStorage('docsearch_company_policies', this.policies);
        return [...this.policies];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
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
    this.saveStorage('docsearch_company_policies', this.policies);
    this.addAuditTrace('CORPORATE_POLICY_CREATED', pol.policyCode, req.actorEmail, req.reason);
    return pol;
  }

  async approveCorporatePolicy(req: ApproveCorporatePolicyRequest): Promise<CorporatePolicyDto> {
    const pol = this.policies.find((p) => p.id === req.policyId);
    if (!pol) throw new Error(`Corporate policy not found with ID ${req.policyId}`);
    pol.status = 'ACTIVE';
    pol.approvedByBoardAt = new Date().toISOString();
    pol.updatedAt = new Date().toISOString();
    this.saveStorage('docsearch_company_policies', this.policies);
    this.addAuditTrace('CORPORATE_POLICY_APPROVED_BY_BOARD', pol.policyCode, req.actorEmail, req.reason);
    return { ...pol };
  }

  // --- COMPLIANCE OFFICERS ---
  async getComplianceOfficers(): Promise<ComplianceOfficerDto[]> {
    try {
      const data = await apiCall<ComplianceOfficerDto[]>('/api/v1/company/admin/compliance-officers');
      if (Array.isArray(data) && data.length > 0) {
        this.complianceOfficers = data;
        this.saveStorage('docsearch_company_officers', this.complianceOfficers);
        return [...this.complianceOfficers];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
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
    this.saveStorage('docsearch_company_officers', this.complianceOfficers);
    this.addAuditTrace('COMPLIANCE_OFFICER_APPOINTED', off.officerCode, req.actorEmail, req.reason);
    return off;
  }

  // --- GOVERNANCE EVENTS ---
  async getGovernanceEvents(): Promise<GovernanceEventDto[]> {
    try {
      const data = await apiCall<GovernanceEventDto[]>('/api/v1/company/admin/governance-events');
      if (Array.isArray(data) && data.length > 0) {
        this.events = data;
        this.saveStorage('docsearch_company_events', this.events);
        return [...this.events];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
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
    this.saveStorage('docsearch_company_events', this.events);
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
    this.saveStorage('docsearch_company_events', this.events);
    this.addAuditTrace('GOVERNANCE_EVENT_COMPLETED_WITH_MINUTES', evt.eventCode, req.actorEmail, req.reason);
    return { ...evt };
  }

  // --- AUDIT TRACES ---
  async getAuditTraces(): Promise<CompanyAuditTraceDto[]> {
    try {
      const data = await apiCall<CompanyAuditTraceDto[]>('/api/v1/company/admin/audit-traces');
      if (Array.isArray(data) && data.length > 0) {
        this.auditTraces = data;
        this.saveStorage('docsearch_company_audit', this.auditTraces);
        return [...this.auditTraces];
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
    }
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
