import React from 'react';
import type {
  EncounterDto,
  EncounterAuditTraceDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface EncounterProfileViewProps {
  encounter: EncounterDto | null;
  auditTraces: EncounterAuditTraceDto[];
}

export const EncounterProfileView: React.FC<EncounterProfileViewProps> = ({
  encounter,
  auditTraces
}) => {
  if (!encounter) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ds-color-text-muted)' }}>
          Please select an encounter from the Directory, Overview, or OPD Queue workspace to view its clinical dossier.
        </div>
      </Card>
    );
  }

  const encounterAudits = auditTraces.filter((a) => a.encounterId === encounter.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Dossier */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {encounter.patientName}
              </h2>
              <Badge
                variant={
                  encounter.status === 'IN_CONSULTATION'
                    ? 'primary'
                    : encounter.status === 'WAITING' || encounter.status === 'CHECKED_IN'
                    ? 'warning'
                    : encounter.status === 'COMPLETED'
                    ? 'success'
                    : encounter.status === 'CANCELLED'
                    ? 'danger'
                    : 'neutral'
                }
              >
                {encounter.status}
              </Badge>
              <Badge variant="primary">{encounter.encounterNumber}</Badge>
              {encounter.tokenNumber && <Badge variant="neutral">Token: {encounter.tokenNumber}</Badge>}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              MRN: <strong>{encounter.patientMrn}</strong> · DOB: <strong>{encounter.patientDob ?? '—'}</strong> · Type: <strong>{encounter.encounterType}</strong> · Priority: <strong>{encounter.priority}</strong>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
              Clinical Department & Physician
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
              {encounter.departmentName ?? 'Department'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>
              {encounter.doctorName ?? 'Unassigned Attending Physician'}
            </span>
          </div>
        </div>
      </Card>

      {/* Grid: Clinical Complaint, Routing, Lifecycle Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card title="Chief Complaint & Triage Notes" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Chief Complaint</span>
              <strong>{encounter.chiefComplaint}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Visit Category</span>
              <span>{encounter.visitReason ?? 'General Clinical Visit'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Triage Vitals</span>
              <code>{encounter.triageNotes ?? 'None recorded at check-in'}</code>
            </div>
          </div>
        </Card>

        <Card title="Facility & Operational Routing" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Facility / Branch</span>
              <strong>{encounter.branchName ?? 'Care Center Facility'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Consultation Mode</span>
              <strong>{encounter.consultationMode}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Attending Specialist</span>
              <strong>{encounter.doctorName ?? 'Unassigned'} ({encounter.doctorSpecialty ?? 'General'})</strong>
            </div>
          </div>
        </Card>

        <Card title="Encounter Lifecycle Timestamps" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Registered: </span>
              <strong>{new Date(encounter.registeredAt).toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Checked In: </span>
              <strong>{encounter.checkedInAt ? new Date(encounter.checkedInAt).toLocaleString() : 'Pending Arrival'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Consultation Started: </span>
              <strong>{encounter.consultationStartedAt ? new Date(encounter.consultationStartedAt).toLocaleString() : 'Not Started'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Completed: </span>
              <strong>{encounter.completedAt ? new Date(encounter.completedAt).toLocaleString() : 'In Progress'}</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Referrals Section */}
      {encounter.referrals.length > 0 && (
        <Card title="Clinical Referrals Generated" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Type</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Clinical Summary</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encounter.referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{r.referralType}</TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {r.destinationDepartmentName ?? r.destinationFacilityName ?? 'Specialist Clinic'}
                    </TableCell>
                    <TableCell><Badge variant="danger">{r.urgency}</Badge></TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '300px' }}>{r.clinicalSummary}</TableCell>
                    <TableCell><Badge variant="warning">{r.referralStatus}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Audit Trail */}
      {encounterAudits.length > 0 && (
        <Card title="Encounter Mutation Audit Ledger" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trace ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Audit Justification</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encounterAudits.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>{a.traceId}</TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>{a.action}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{a.actorId} ({a.actorRole})</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{a.justification}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(a.occurredAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
