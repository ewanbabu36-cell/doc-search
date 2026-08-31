import React, { useState } from 'react';
import type { EncounterDto } from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface EncounterHistoryViewProps {
  encounters: EncounterDto[];
  onSelectEncounter: (encounterId: string) => void;
}

export const EncounterHistoryView: React.FC<EncounterHistoryViewProps> = ({
  encounters,
  onSelectEncounter
}) => {
  const [patientSearch, setPatientSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = encounters.filter((e) => {
    if (patientSearch) {
      const q = patientSearch.toLowerCase();
      const match =
        e.patientName.toLowerCase().includes(q) ||
        e.patientMrn.toLowerCase().includes(q) ||
        e.encounterNumber.toLowerCase().includes(q) ||
        (e.doctorName && e.doctorName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
          Historical Encounter & Patient Visit Archive
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
          Longitudinal audit history of past patient visits, consultation summaries, and specialist routing across all facility branches
        </span>
      </div>

      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Search History (Patient, MRN, Doctor)
            </label>
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search history records..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Filter by Terminal Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Historic Encounters' },
                { value: 'COMPLETED', label: 'Completed Visits' },
                { value: 'REFERRED', label: 'Referred Visits' },
                { value: 'CANCELLED', label: 'Cancelled Encounters' },
                { value: 'NO_SHOW', label: 'No Shows' }
              ]}
            />
          </div>
        </div>
      </Card>

      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date / Time</TableHead>
                <TableHead>Encounter #</TableHead>
                <TableHead>Patient & MRN</TableHead>
                <TableHead>Department & Physician</TableHead>
                <TableHead>Encounter Type</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero historical records matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(e.registeredAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', fontWeight: '600' }}>
                      {e.encounterNumber}
                    </TableCell>
                    <TableCell>
                      <strong>{e.patientName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{e.patientMrn}</code>
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {e.departmentName ?? 'General'} · {e.doctorName ?? 'Unassigned'}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      <Badge variant="neutral">{e.encounterType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '240px' }}>
                      {e.chiefComplaint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          e.status === 'COMPLETED'
                            ? 'success'
                            : e.status === 'REFERRED'
                            ? 'primary'
                            : e.status === 'CANCELLED'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onSelectEncounter(e.id)}>
                        Dossier
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
