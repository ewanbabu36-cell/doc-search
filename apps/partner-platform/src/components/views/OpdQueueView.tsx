import React, { useState } from 'react';
import type {
  EncounterQueueDto,
  EncounterDto,
  OperationalDepartmentDto,
  DoctorProfileDto
} from '@docsearch/api-contracts';
import {
  Card,
  Button,
  Badge,
  Select,
  Alert,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface OpdQueueViewProps {
  queues: EncounterQueueDto[];
  encounters: EncounterDto[];
  departments: OperationalDepartmentDto[];
  doctors: DoctorProfileDto[];
  actorId: string;
  actorRole: string;
  onCallNextPatient: (encounterId: string) => Promise<void>;
  onSelectEncounter: (encounterId: string) => void;
}

export const OpdQueueView: React.FC<OpdQueueViewProps> = ({
  queues,
  encounters,
  departments,
  doctors,
  onCallNextPatient,
  onSelectEncounter
}) => {
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [docFilter, setDocFilter] = useState('ALL');

  const filtered = queues.filter((q) => {
    if (deptFilter !== 'ALL' && q.departmentId !== deptFilter) return false;
    if (docFilter !== 'ALL' && q.doctorId !== docFilter) return false;
    return true;
  });

  const getEncounter = (encId: string) => encounters.find((e) => e.id === encId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Real-Time OPD Queue Board
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Sequential token numbers, live patient status tracking, and physician consultation room calling
          </span>
        </div>
      </div>

      <Alert type="info" title="OPD Queue Protocol">
        Patients checked in at reception receive automated token IDs. Physicians call patients in order of triage urgency and token sequence.
      </Alert>

      {/* Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Filter by Department
            </label>
            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: d.departmentName }))
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Filter by Consulting Physician
            </label>
            <Select
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Physicians' },
                ...doctors.map((d) => ({ value: d.id, label: d.fullName }))
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Queue Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token #</TableHead>
                <TableHead>Patient Name & MRN</TableHead>
                <TableHead>Department & Physician</TableHead>
                <TableHead>Queue Status</TableHead>
                <TableHead>Wait Time</TableHead>
                <TableHead>Encounter Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero patients currently in the waiting queue.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((q) => {
                  const enc = getEncounter(q.encounterId);
                  return (
                    <TableRow key={q.id}>
                      <TableCell>
                        <strong style={{ fontSize: '1rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-primary)' }}>
                          {q.tokenNumber}
                        </strong>
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{enc?.patientName ?? 'Patient'}</strong>
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                          MRN: <code>{enc?.patientMrn ?? 'N/A'}</code> · DOB: {enc?.patientDob ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>
                        <strong>{q.departmentName ?? 'Department'}</strong>
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                          {q.doctorName ?? 'Unassigned Doctor'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            q.queueStatus === 'IN_PROGRESS'
                              ? 'primary'
                              : q.queueStatus === 'WAITING'
                              ? 'warning'
                              : q.queueStatus === 'SERVED'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {q.queueStatus}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.8125rem' }}>
                        {q.queueStatus === 'IN_PROGRESS' ? 'Now with Doctor' : `~${q.estimatedWaitMinutes} mins`}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button variant="outline" size="sm" onClick={() => onSelectEncounter(q.encounterId)}>
                            Dossier
                          </Button>
                          {q.queueStatus === 'WAITING' && (
                            <Button variant="primary" size="sm" onClick={() => onCallNextPatient(q.encounterId)}>
                              📢 Call Patient
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
