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

// 3 New Company Administration Advancements
import { McaStatutoryRegisterVaultView } from './McaStatutoryRegisterVaultView.js';
import { PoshEthicsVigilanceView } from './PoshEthicsVigilanceView.js';
import { SubsidiaryTransferEscrowView } from './SubsidiaryTransferEscrowView.js';

import { Tabs, Badge, Spinner, ErrorState } from '@docsearch/ui-kit';

type ActiveTab =
  | 'role-matrix'
  | 'overview'
  | 'mca-vault'
  | 'posh-ethics'
  | 'subsidiary-escrow'
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
      setError(err instanceof Error ? err.message : 'Failed to load Company Administration data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleUpdateEmployeeStatus = async (employeeId: string, employmentStatus: EmploymentStatus, reason: string) => {
    const updated = await companyAdminService.updateEmployeeStatus({
      employeeId,
      employmentStatus,
      reason,
      actorEmail: 'admin.director@docsearch.internal'
    });
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleApprovePolicy = async (policyId: string, resolutionReference: string, reason: string) => {
    const updated = await companyAdminService.approveCorporatePolicy({
      policyId,
      resolutionReference,
      reason,
      actorEmail: 'board.governance@docsearch.internal'
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
    const updated = await companyAdminService.appointComplianceOfficer({
      officerCode,
      officerRole,
      employeeId,
      officerName,
      workEmail,
      regulatoryAuthorityReference,
      reason,
      actorEmail: 'board.governance@docsearch.internal'
    });
    setComplianceOfficers((prev) => [updated, ...prev.filter((o) => o.id !== updated.id)]);
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
      reason,
      actorEmail: 'governance.secretary@docsearch.internal'
    });
    setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
  };

  if (isLoading && !overview) {
    return (
      <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Company Administration & Corporate Governance workspace...
        </span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState title="Company Administration Unavailable" message={error} onRetry={loadData} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              🏛️ Company Administration, Statutory Registers & Corporate Governance HQ
            </h1>
            <Badge variant="success">● MCA V3 & POSH 2013 Statutory Active</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            MCA/ROC Board resolution vault, statutory POSH Internal Complaints Committee, and multi-subsidiary transfer pricing escrow
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
            id: 'mca-vault',
            label: '📜 MCA / ROC Statutory Vault',
            badge: <Badge variant="success">Class 3 DSC</Badge>
          },
          {
            id: 'posh-ethics',
            label: '⚖️ Statutory POSH Desk',
            badge: <Badge variant="primary">100% Trained</Badge>
          },
          {
            id: 'subsidiary-escrow',
            label: '🏢 Multi-Subsidiary Escrow',
            badge: <Badge variant="neutral">Sec 92C</Badge>
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

      {activeTab === 'mca-vault' && (
        <McaStatutoryRegisterVaultView />
      )}

      {activeTab === 'posh-ethics' && (
        <PoshEthicsVigilanceView />
      )}

      {activeTab === 'subsidiary-escrow' && (
        <SubsidiaryTransferEscrowView />
      )}

      {activeTab === 'entities' && (
        <LegalEntityListView entities={entities} />
      )}

      {activeTab === 'departments' && (
        <DepartmentHierarchyView
          departments={departments}
          onAddDepartment={(newDept) => setDepartments([newDept, ...departments])}
        />
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
