import React from 'react';
import type {
  EncounterOverviewDto,
  EncounterDto
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

export interface EncounterOverviewViewProps {
  overview: EncounterOverviewDto;
  encounters: EncounterDto[];
  onSelectEncounter: (encounterId: string) => void;
}

export const EncounterOverviewView: React.FC<EncounterOverviewViewProps> = ({
  overview,
  encounters,
  onSelectEncounter
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="Operational Live Telemetry">
        Clinical encounters, OPD queue tokens, attending physician assignments, and triage summaries are sample preview fixtures. <strong>Live hospital EHR integration is not connected.</strong>
      </Alert>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Today's Encounters
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {overview.totalEncountersTodayCount} Visits
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Registered & Scheduled
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Waiting in Queue
            </span>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: overview.waitingQueueCount > 0 ? 'var(--ds-color-warning)' : 'var(--ds-color-success)'
              }}
            >
              {overview.waitingQueueCount} Patients
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Checked-in & Ready
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              In Consultation
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-primary)' }}>
              {overview.inConsultationCount} Active
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              With Attending Physician
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', textTransform: 'uppercase' }}>
              Completed Visits
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ds-color-success)' }}>
              {overview.completedTodayCount} Completed
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
              Consultations Finalized
            </span>
          </div>
        </Card>
      </div>

      {/* Active Encounters Ledger */}
      <Card
        title="Live Clinical Encounters Roster"
        subtitle="Real-time patient encounter tracking across outpatient departments and care centers"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Encounter #</TableHead>
                <TableHead>Patient Name & MRN</TableHead>
                <TableHead>Department & Doctor</TableHead>
                <TableHead>Type / Mode</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Queue Token</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {encounters.map((e) => (
                <TableRow
                  key={e.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectEncounter(e.id)}
                >
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {e.encounterNumber}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{e.patientName}</strong>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                      MRN: <code>{e.patientMrn}</code>
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <strong>{e.departmentName ?? 'Department'}</strong>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                      {e.doctorName ?? 'Unassigned Doctor'}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    <Badge variant="neutral">{e.encounterType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', maxWidth: '240px' }}>
                    {e.chiefComplaint}
                  </TableCell>
                  <TableCell>
                    {e.tokenNumber ? (
                      <Badge variant="primary">{e.tokenNumber}</Badge>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        e.status === 'IN_CONSULTATION'
                          ? 'primary'
                          : e.status === 'WAITING' || e.status === 'CHECKED_IN'
                          ? 'warning'
                          : e.status === 'COMPLETED'
                          ? 'success'
                          : e.status === 'CANCELLED'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {e.status}
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
