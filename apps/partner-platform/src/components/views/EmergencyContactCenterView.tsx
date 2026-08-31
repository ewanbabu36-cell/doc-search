import React from 'react';
import type { PatientDto } from '@docsearch/api-contracts';
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

export interface EmergencyContactCenterViewProps {
  patients: PatientDto[];
  onSelectPatient: (patientId: string) => void;
}

export const EmergencyContactCenterView: React.FC<EmergencyContactCenterViewProps> = ({
  patients,
  onSelectPatient
}) => {
  const allContacts = patients.flatMap((p) =>
    p.emergencyContacts.map((ec) => ({
      ...ec,
      patientName: p.fullName,
      mrn: p.mrn,
      patientMobile: p.primaryContact?.primaryMobile
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Emergency Contact Roster
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Designated family contacts and caregivers for emergency admissions and critical alerts
        </span>
      </div>

      <Alert type="info" title="Emergency Notification Readiness">
        Emergency contacts provide immediate next-of-kin reachability during clinical escalations and hospital transfers.
      </Alert>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact Name</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Primary Phone</TableHead>
                <TableHead>Associated Patient & MRN</TableHead>
                <TableHead>Address / Location</TableHead>
                <TableHead>Primary Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero emergency contacts recorded.
                  </TableCell>
                </TableRow>
              ) : (
                allContacts.map((c) => (
                  <TableRow
                    key={c.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectPatient(c.patientId)}
                  >
                    <TableCell style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                      {c.contactName}
                    </TableCell>
                    <TableCell><Badge variant="neutral">{c.relationship}</Badge></TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>{c.primaryPhone}</TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{c.patientName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{c.mrn}</code>
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{c.address ?? 'Same as patient address'}</TableCell>
                    <TableCell>
                      <Badge variant={c.isPrimary ? 'success' : 'neutral'}>
                        {c.isPrimary ? 'PRIMARY' : 'SECONDARY'}
                      </Badge>
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
