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

export interface DiagnosisCenterViewProps {
  consultations: ConsultationDto[];
  onSelectConsultation: (id: string) => void;
}

export const DiagnosisCenterView: React.FC<DiagnosisCenterViewProps> = ({
  consultations,
  onSelectConsultation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Flatten diagnoses with consultation metadata
  const allDiagnoses = consultations.flatMap((c) =>
    c.diagnoses.map((d) => ({
      ...d,
      patientName: c.patientName,
      patientMrn: c.patientMrn,
      doctorName: c.doctorName,
      doctorSpecialty: c.doctorSpecialty,
      consultationNumber: c.consultationNumber,
      consultationId: c.id
    }))
  );

  const filtered = allDiagnoses.filter((d) => {
    if (typeFilter !== 'ALL' && d.diagnosisType !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        d.diagnosisCode.toLowerCase().includes(q) ||
        d.diagnosisName.toLowerCase().includes(q) ||
        d.patientName.toLowerCase().includes(q) ||
        d.patientMrn.toLowerCase().includes(q) ||
        d.doctorName.toLowerCase().includes(q)
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
              🔬 Clinical Diagnosis Registry
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Cross-patient clinical conditions, ICD code classifications, and chronic disease registries.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ minWidth: '220px' }}>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ICD code, disease, patient..."
              />
            </div>
            <div style={{ minWidth: '150px' }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Diagnosis Types' },
                  { value: 'PRIMARY', label: 'Primary Only' },
                  { value: 'SECONDARY', label: 'Secondary Only' },
                  { value: 'DIFFERENTIAL', label: 'Differential' },
                  { value: 'PROVISIONAL', label: 'Provisional' }
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title={`Documented Conditions (${filtered.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ICD Code</TableHead>
                <TableHead>Diagnosis Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status & Certainty</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Documenting Physician</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No clinical diagnoses found matching search filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ds-color-primary)' }}>
                      {row.diagnosisCode}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{row.diagnosisName}</div>
                      {row.notes && <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{row.notes}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isPrimary ? 'primary' : 'neutral'}>{row.diagnosisType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Badge variant={row.clinicalStatus === 'ACTIVE' ? 'warning' : 'neutral'}>{row.clinicalStatus}</Badge>
                        <Badge variant="neutral">{row.certainty}</Badge>
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
