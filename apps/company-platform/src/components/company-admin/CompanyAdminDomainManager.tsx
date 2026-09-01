import React, { useState, useEffect } from 'react';
import type {
  CompanyOverviewDto,
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
  EmploymentStatus,
  ComplianceOfficerRole
} from '@docsearch/api-contracts';
import { companyAdminService } from '../../services/company-admin-service.js';
import { CompanyOverviewView } from './CompanyOverviewView.js';
import { LegalEntityListView } from './LegalEntityListView.js';
import { DepartmentHierarchyView } from './DepartmentHierarchyView.js';
import { EmployeeDirectoryView } from './EmployeeDirectoryView.js';
import { DesignationListView } from './DesignationListView.js';
import { BoardGovernanceView } from './BoardGovernanceView.js';
import { CorporatePolicyView } from './CorporatePolicyView.js';
import { ComplianceOfficerCenterView } from './ComplianceOfficerCenterView.js';
import { GovernanceCalendarView } from './GovernanceCalendarView.js';
import { CompanyAuditTraceView } from './CompanyAuditTraceView.js';
import { CompanyRoleAccessMatrixTemplate } from './CompanyRoleAccessMatrixTemplate.js';
import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'role-matrix'
  | 'overview'
  | 'entities'
  | 'departments'
  | 'employees'
  | 'designations'
  | 'board'
  | 'policies'
  | 'officers'
  | 'calendar'
  | 'audit';

export const CompanyAdminDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [overview, setOverview] = useState<CompanyOverviewDto | null>(null);
  const [entities, setEntities] = useState<LegalEntityDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [employees, setEmployees] = useState<InternalEmployeeDto[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMemberDto[]>([]);
  const [committees, setCommittees] = useState<GovernanceCommitteeDto[]>([]);
  const [memberships, setMemberships] = useState<CommitteeMembershipDto[]>([]);
  const [policies, setPolicies] = useState<CorporatePolicyDto[]>([]);
  const [complianceOfficers, setComplianceOfficers] = useState<ComplianceOfficerDto[]>([]);
  const [events, setEvents] = useState<GovernanceEventDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<CompanyAuditTraceDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        entitiesRes,
        deptRes,
        desigRes,
        empRes,
        boardRes,
        commRes,
        memRes,
        polRes,
        offRes,
        evtRes,
        tracesRes
      ] = await Promise.all([
        companyAdminService.getOverview(),
        companyAdminService.getLegalEntities(),
        companyAdminService.getDepartments(),
        companyAdminService.getDesignations(),
        companyAdminService.getInternalEmployees(),
        companyAdminService.getBoardMembers(),
        companyAdminService.getGovernanceCommittees(),
        companyAdminService.getCommitteeMemberships(),
        companyAdminService.getCorporatePolicies(),
        companyAdminService.getComplianceOfficers(),
        companyAdminService.getGovernanceEvents(),
        companyAdminService.getAuditTraces()
      ]);
      setOverview(overviewRes);
      setEntities(entitiesRes);
      setDepartments(deptRes);
      setDesignations(desigRes);
      setEmployees(empRes);
      setBoardMembers(boardRes);
      setCommittees(commRes);
      setMemberships(memRes);
      setPolicies(polRes);
      setComplianceOfficers(offRes);
      setEvents(evtRes);
      setAuditTraces(tracesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company administration control plane');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleUpdateEmployeeStatus = async (employeeId: string, status: EmploymentStatus, reason: string) => {
    const updated = await companyAdminService.updateEmployeeStatus({
      employeeId,
      employmentStatus: status,
      actorEmail: 'general.counsel@docsearch.internal',
      reason
    });
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleApprovePolicy = async (policyId: string, resolutionReference: string, reason: string) => {
    const updated = await companyAdminService.approveCorporatePolicy({
      policyId,
      resolutionReference,
      actorEmail: 'general.counsel@docsearch.internal',
      reason
    });
    setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAppointOfficer = async (
    officerCode: string,
    officerRole: ComplianceOfficerRole,
    employeeId: string,
    officerName: string,
    workEmail: string,
    regulatoryAuthorityReference: string,
    reason: string
  ) => {
    const officer = await companyAdminService.appointComplianceOfficer({
      officerCode,
      officerRole,
      employeeId,
      officerName,
      workEmail,
      regulatoryAuthorityReference,
      actorEmail: 'ceo@docsearch.internal',
      reason
    });
    setComplianceOfficers((prev) => [officer, ...prev]);
  };

  const handleCompleteEvent = async (
    eventId: string,
    minutesReference: string,
    resolutionReference: string | undefined,
    reason: string
  ) => {
    const updated = await companyAdminService.completeGovernanceEvent({
      eventId,
      minutesReference,
      resolutionReference,
      actorEmail: 'general.counsel@docsearch.internal',
      reason
    });
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Company Administration & Governance control plane...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Company Administration Control Plane Unavailable" message={error} onRetry={loadData} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              Company Administration & Governance
            </h1>
            
            <Badge variant="warning">Production View</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Corporate entity governance, departments, employee directory, board oversight, bylaws, and statutory compliance officers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: '📊 Overview'
          },
          {
            id: 'entities',
            label: '🏛️ Legal Entities',
            badge: <Badge variant="neutral">{entities.length}</Badge>
          },
          {
            id: 'departments',
            label: '🏢 Departments',
            badge: <Badge variant="neutral">{departments.length}</Badge>
          },
          {
            id: 'employees',
            label: '👥 Staff Directory',
            badge: <Badge variant="neutral">{employees.length}</Badge>
          },
          {
            id: 'designations',
            label: '🎖️ Designations',
            badge: <Badge variant="neutral">{designations.length}</Badge>
          },
          {
            id: 'board',
            label: '📜 Board & Committees',
            badge: <Badge variant="neutral">{boardMembers.length + committees.length}</Badge>
          },
          {
            id: 'policies',
            label: '📑 Corporate Policies',
            badge: <Badge variant="neutral">{policies.length}</Badge>
          },
          {
            id: 'officers',
            label: '🛡️ Compliance Officers',
            badge: <Badge variant="neutral">{complianceOfficers.length}</Badge>
          },
          {
            id: 'calendar',
            label: '📅 Governance Calendar',
            badge: <Badge variant="neutral">{events.length}</Badge>
          },
          {
            id: 'audit',
            label: '🔍 Audit Trail',
            badge: <Badge variant="neutral">{auditTraces.length}</Badge>
          }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && overview && (
        <CompanyOverviewView
          overview={overview}
          entities={entities}
          departments={departments}
          boardMembers={boardMembers}
          policies={policies}
          events={events}
        />
      )}

      {activeTab === 'entities' && (
        <LegalEntityListView entities={entities} />
      )}

      {activeTab === 'departments' && (
        <DepartmentHierarchyView departments={departments} />
      )}

      {activeTab === 'role-matrix' && (
        <CompanyRoleAccessMatrixTemplate />
      )}

      {activeTab === 'employees' && (
        <EmployeeDirectoryView
          employees={employees}
          onUpdateStatus={handleUpdateEmployeeStatus}
          onAddEmployee={(newEmp) => setEmployees([newEmp, ...employees])}
        />
      )}

      {activeTab === 'designations' && (
        <DesignationListView designations={designations} />
      )}

      {activeTab === 'board' && (
        <BoardGovernanceView
          boardMembers={boardMembers}
          committees={committees}
          memberships={memberships}
        />
      )}

      {activeTab === 'policies' && (
        <CorporatePolicyView
          policies={policies}
          onApprovePolicy={handleApprovePolicy}
        />
      )}

      {activeTab === 'officers' && (
        <ComplianceOfficerCenterView
          officers={complianceOfficers}
          employees={employees}
          onAppointOfficer={handleAppointOfficer}
        />
      )}

      {activeTab === 'calendar' && (
        <GovernanceCalendarView
          events={events}
          onCompleteEvent={handleCompleteEvent}
        />
      )}

      {activeTab === 'audit' && (
        <CompanyAuditTraceView auditTraces={auditTraces} />
      )}
    </div>
  );
};
