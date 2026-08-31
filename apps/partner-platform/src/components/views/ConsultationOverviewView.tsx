import React from 'react';
import type {
  ConsultationDto,
  ConsultationOverviewDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  Button,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';

export interface ConsultationOverviewViewProps {
  overview: ConsultationOverviewDto;
  consultations: ConsultationDto[];
  onSelectConsultation: (id: string) => void;
  onOpenWorklist: () => void;
}

export const ConsultationOverviewView: React.FC<ConsultationOverviewViewProps> = ({
  overview,
  consultations,
  onSelectConsultation,
  onOpenWorklist
}) => {
  const getStatusBadge = (status: ConsultationDto['consultationStatus']) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="warning">Draft</Badge>;
      case 'STARTED':
      case 'IN_PROGRESS':
        return <Badge variant="primary">In Progress</Badge>;
      case 'READY_FOR_COMPLETION':
        return <Badge variant="primary">Ready to Sign</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const recentConsultations = consultations.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <Card padding="md" style={{ background: 'linear-gradient(135deg, var(--ds-color-primary-light, #e0f2fe) 0%, #ffffff 100%)', border: '1px solid var(--ds-color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              🩺 Clinical Consultation & EMR Documentation Center
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-secondary)' }}>
              Structured physician documentation, vital observations, ICD diagnostics, digital prescription orders, and legally locked EMR records.
            </p>
          </div>
          <Button variant="primary" onClick={onOpenWorklist}>
            ⚡ Open Doctor Worklist
          </Button>
        </div>
      </Card>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <Card padding="sm">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-color-text-muted)' }}>TOTAL CONSULTATIONS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: 'var(--ds-color-primary)' }}>
            {overview.totalConsultationsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>All recorded EMR sessions</div>
        </Card>

        <Card padding="sm">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-color-text-muted)' }}>ACTIVE / IN PROGRESS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#0284c7' }}>
            {overview.activeConsultationsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>In active clinical review</div>
        </Card>

        <Card padding="sm">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-color-text-muted)' }}>DRAFT RECORDS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#eab308' }}>
            {overview.draftConsultationsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>Pending physician completion</div>
        </Card>

        <Card padding="sm">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-color-text-muted)' }}>COMPLETED TODAY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#16a34a' }}>
            {overview.completedTodayCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>Signed & locked records</div>
        </Card>

        <Card padding="sm">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-color-text-muted)' }}>FOLLOW-UPS REQUIRED</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#8b5cf6' }}>
            {overview.followUpsRequiredCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>Recommended review visits</div>
        </Card>

        <Card padding="sm">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-color-text-muted)' }}>AMENDED RECORDS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#ea580c' }}>
            {overview.amendedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>Audited addendum versions</div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card title="📋 Recent Clinical Consultation Activity" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consultation #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Encounter</TableHead>
                <TableHead>Attending Physician</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentConsultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No clinical consultations recorded in current session.
                  </TableCell>
                </TableRow>
              ) : (
                recentConsultations.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ds-color-primary)' }}>
                      {row.consultationNumber}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{row.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: {row.patientMrn} · {row.patientGender ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{row.encounterNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{row.encounterType}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{row.doctorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{row.doctorSpecialty}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {row.chiefComplaint}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getStatusBadge(row.consultationStatus)}
                        {row.isAmended && <Badge variant="warning">v{row.version}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => onSelectConsultation(row.id)}>
                        Open Dossier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
