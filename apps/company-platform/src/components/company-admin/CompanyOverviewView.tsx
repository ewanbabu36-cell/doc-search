import React from 'react';
import type {
  CompanyOverviewDto,
  LegalEntityDto,
  DepartmentDto,
  BoardMemberDto,
  CorporatePolicyDto,
  GovernanceEventDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface CompanyOverviewViewProps {
  overview: CompanyOverviewDto;
  entities: LegalEntityDto[];
  departments: DepartmentDto[];
  boardMembers: BoardMemberDto[];
  policies: CorporatePolicyDto[];
  events: GovernanceEventDto[];
}

export const CompanyOverviewView: React.FC<CompanyOverviewViewProps> = ({
  overview,
  entities,
  departments: _departments,
  boardMembers,
  policies: _policies,
  events
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Disclaimers */}
      <Alert type="info" title="Live Telemetry — Live Telemetry">
        Corporate entity structures, internal staff records, board seats, and corporate resolutions shown below are development fixtures. <strong>Live corporate governance integration is not connected.</strong> Zero real legal filings or employee PII are exposed.
      </Alert>

      {/* KPI Posture Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Corporate Legal Structure
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.totalEntitiesCount} Entities
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Delaware C-Corp (Parent) + 2 Subsidiaries
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Departments & Staff
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              {overview.totalDepartmentsCount} Depts
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.totalEmployeesCount} Internal Employees Registered
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Board & Committees
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              {overview.activeBoardMembersCount} Directors
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.activeCommitteesCount} Active Governance Committees
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Policies & Compliance
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.activePoliciesCount} Policies
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.complianceOfficersCount} Designated Officers (HIPAA/GDPR)
            </span>
          </div>
        </Card>
      </div>

      {/* Legal Entities Structure */}
      <Card
        title="Corporate Legal Entities & Subsidiaries"
        subtitle="Incorporation jurisdictions, registration references, and operating company hierarchy"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Code</TableHead>
                <TableHead>Legal Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Registration Number</TableHead>
                <TableHead>Tax ID (EIN/VAT)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((ent) => (
                <TableRow key={ent.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {ent.entityCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{ent.entityName}</strong>
                    {ent.parentEntityName && (
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        Subsidiary of {ent.parentEntityName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{ent.entityType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {ent.jurisdiction}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {ent.registrationNumber}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'var(--ds-font-mono)' }}>
                    {ent.taxIdentifierReference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ent.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {ent.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Board & Upcoming Governance Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <Card title="Board of Directors" subtitle="Governing board seats & voting rights" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Director Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Representation</TableHead>
                  <TableHead>Voting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boardMembers.map((bm) => (
                  <TableRow key={bm.id}>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                        {bm.fullName}
                      </strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{bm.roleType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {bm.representingEntity}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bm.votingStatus === 'VOTING' ? 'primary' : 'neutral'}>
                        {bm.votingStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card title="Upcoming Governance Events" subtitle="Scheduled meetings and regulatory filings" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                        {evt.title}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                        {evt.eventCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{evt.eventType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {new Date(evt.scheduledAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={evt.status === 'COMPLETED' ? 'success' : 'primary'}>
                        {evt.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>
    </div>
  );
};
