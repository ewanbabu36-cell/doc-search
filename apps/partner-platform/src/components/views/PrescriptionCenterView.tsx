import React, { useState } from 'react';
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
  Button,
  Input,
  Select
} from '@docsearch/ui-kit';

export interface PrescriptionCenterViewProps {
  consultations: ConsultationDto[];
  onSelectConsultation: (id: string) => void;
}

export const PrescriptionCenterView: React.FC<PrescriptionCenterViewProps> = ({
  consultations,
  onSelectConsultation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Flatten prescriptions with consultation metadata
  const allMedications = consultations.flatMap((c) =>
    c.medications.map((m) => ({
      ...m,
      patientName: c.patientName,
      patientMrn: c.patientMrn,
      patientAllergies: c.patientAllergies,
      doctorName: c.doctorName,
      doctorSpecialty: c.doctorSpecialty,
      consultationNumber: c.consultationNumber,
      consultationId: c.id
    }))
  );

  const filtered = allMedications.filter((m) => {
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        m.medicationName.toLowerCase().includes(q) ||
        (m.genericName && m.genericName.toLowerCase().includes(q)) ||
        m.patientName.toLowerCase().includes(q) ||
        m.patientMrn.toLowerCase().includes(q) ||
        m.doctorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
              💊 Clinical Prescription & Medication Center
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Prescription orders, active medications, dosage regimens, food relations, and discontinuation history.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ minWidth: '220px' }}>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search drug, generic, patient..."
              />
            </div>
            <div style={{ minWidth: '150px' }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active Only' },
                  { value: 'DISCONTINUED', label: 'Discontinued' },
                  { value: 'COMPLETED', label: 'Completed' }
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title={`Prescription Orders (${filtered.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication Order</TableHead>
                <TableHead>Dosage & Sig</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Prescribing Doctor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No clinical prescriptions found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--ds-color-text-primary)' }}>
                        {row.medicationName} ({row.strength})
                      </div>
                      {row.genericName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          Generic: {row.genericName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontSize: '0.8125rem' }}>
                        <div>{row.dosage} · {row.frequency}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          {row.route} · {row.beforeAfterFood.replace('_', ' ')} · {row.duration} {row.durationUnit.toLowerCase()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'danger'}>{row.status}</Badge>
                        {row.asNeeded && <Badge variant="warning">PRN</Badge>}
                      </div>
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
                        View EMR
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
