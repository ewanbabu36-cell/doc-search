import React from 'react';
import type {
  ConsultationDto
} from '@docsearch/api-contracts';
import {
  Card,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Badge,
  Button
} from '@docsearch/ui-kit';

export interface FollowUpPlanViewProps {
  consultations: ConsultationDto[];
  onSelectConsultation: (id: string) => void;
}

export const FollowUpPlanView: React.FC<FollowUpPlanViewProps> = ({
  consultations,
  onSelectConsultation
}) => {
  // Extract all followups with patient and doctor details
  const allFollowUps = consultations.flatMap((c) => {
    if (!c.followUp || !c.followUp.followUpRequired) return [];
    return [{
      ...c.followUp,
      patientName: c.patientName,
      patientMrn: c.patientMrn,
      doctorName: c.doctorName,
      doctorSpecialty: c.doctorSpecialty,
      consultationNumber: c.consultationNumber,
      consultationId: c.id
    }];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card padding="md">
        <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
          📅 Follow-Up Clinical Recommendations Board
        </h3>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
          Clinical review plans, chronic disease check-ins, medication titrations, and upcoming patient evaluation windows.
        </p>
      </Card>

      <Card title={`Pending Follow-Up Recommendations (${allFollowUps.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recommended Window</TableHead>
                <TableHead>Clinical Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Physician</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allFollowUps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No follow-up plans recorded.
                  </TableCell>
                </TableRow>
              ) : (
                allFollowUps.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant="primary">{row.recommendedWindow?.replace('_', ' ') ?? 'AS_SCHEDULED'}</Badge>
                      {row.recommendedDate && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                          Target: {row.recommendedDate}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{row.reason}</div>
                      {row.notes && <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{row.notes}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'PENDING' ? 'warning' : 'success'}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{row.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>MRN: {row.patientMrn}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.8125rem' }}>{row.doctorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{row.doctorSpecialty}</div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => onSelectConsultation(row.consultationId)}>
                        View EMR Dossier
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
