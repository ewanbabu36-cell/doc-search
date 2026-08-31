import React from 'react';
import type {
  PatientRegistrationOverviewDto,
  PatientDto
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

export interface PatientOverviewViewProps {
  overview: PatientRegistrationOverviewDto;
  patients: PatientDto[];
  onSelectPatient: (patientId: string) => void;
}

export const PatientOverviewView: React.FC<PatientOverviewViewProps> = ({
  overview,
  patients,
  onSelectPatient
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Operational Live Telemetry">
        Master Patient Index (MPI) records, demographic identifiers, consent directives, and insurance policies are sample preview fixtures. <strong>Live EHR encounter data is not connected.</strong>
      </Alert>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Total MPI Patients
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.totalPatientsCount} Records
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.activePatientsCount} Active Status
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Duplicate Review Queue
            </span>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: overview.pendingDuplicateReviewsCount > 0 ? 'var(--ds-color-warning)' : 'var(--ds-color-success)'
              }}
            >
              {overview.pendingDuplicateReviewsCount} Pending
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              {overview.mergedRecordsCount} Merged Records
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Insured Coverage
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              {overview.insuredPatientsCount} / {overview.totalPatientsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Third-Party Payer Policies Attached
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Active Consents
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              {overview.activeConsentsCount} Directives
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Treatment & Communication Consents
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Patient Roster */}
      <Card
        title="Master Patient Index Directory"
        subtitle="Canonical patient identifiers, birth dates, primary mobile contacts, and lifecycle statuses"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MRN</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Date of Birth / Gender</TableHead>
                <TableHead>Primary Mobile</TableHead>
                <TableHead>Assigned Branch</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectPatient(p.id)}
                >
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {p.mrn}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.fullName}</strong>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                      Code: {p.patientCode} · Blood: {p.bloodGroup ?? 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.dateOfBirth} ({p.gender})
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.primaryContact?.primaryMobile ?? '—'}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {p.branchName ?? 'Branch Facility'}
                  </TableCell>
                  <TableCell>
                    {p.insurancePolicies.length > 0 ? (
                      <Badge variant="primary">{p.insurancePolicies[0]?.payerName}</Badge>
                    ) : (
                      <Badge variant="neutral">Self Pay</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === 'ACTIVE'
                          ? 'success'
                          : p.status === 'DUPLICATE_REVIEW'
                          ? 'warning'
                          : p.status === 'MERGED'
                          ? 'neutral'
                          : 'danger'
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
