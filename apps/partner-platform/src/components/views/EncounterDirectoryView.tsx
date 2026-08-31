import React, { useState } from 'react';
import type {
  EncounterDto,
  PatientDto,
  DoctorProfileDto,
  OperationalDepartmentDto,
  CreateEncounterRequest,
  CheckInEncounterRequest,
  AssignDoctorRequest,
  ChangeEncounterStatusRequest,
  CancelEncounterRequest,
  ReferEncounterRequest,
  ReassignEncounterRequest
} from '@docsearch/api-contracts';
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
import { CreateEncounterDialog } from '../dialogs/CreateEncounterDialog.js';
import { CheckInEncounterDialog } from '../dialogs/CheckInEncounterDialog.js';
import { AssignDoctorDialog } from '../dialogs/AssignDoctorDialog.js';
import { ChangeEncounterStatusDialog } from '../dialogs/ChangeEncounterStatusDialog.js';
import { CancelEncounterDialog } from '../dialogs/CancelEncounterDialog.js';
import { ReferEncounterDialog } from '../dialogs/ReferEncounterDialog.js';
import { ReassignEncounterDialog } from '../dialogs/ReassignEncounterDialog.js';

export interface EncounterDirectoryViewProps {
  encounters: EncounterDto[];
  patients: PatientDto[];
  doctors: DoctorProfileDto[];
  departments: OperationalDepartmentDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  onSelectEncounter: (encounterId: string) => void;
  onCreateEncounter: (req: CreateEncounterRequest) => Promise<void>;
  onCheckInEncounter: (req: CheckInEncounterRequest) => Promise<void>;
  onAssignDoctor: (req: AssignDoctorRequest) => Promise<void>;
  onChangeStatus: (req: ChangeEncounterStatusRequest) => Promise<void>;
  onCancelEncounter: (req: CancelEncounterRequest) => Promise<void>;
  onReferEncounter: (req: ReferEncounterRequest) => Promise<void>;
  onReassignEncounter: (req: ReassignEncounterRequest) => Promise<void>;
}

export const EncounterDirectoryView: React.FC<EncounterDirectoryViewProps> = ({
  encounters,
  patients,
  doctors,
  departments,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  onSelectEncounter,
  onCreateEncounter,
  onCheckInEncounter,
  onAssignDoctor,
  onChangeStatus,
  onCancelEncounter,
  onReferEncounter,
  onReassignEncounter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [checkInEncounter, setCheckInEncounter] = useState<EncounterDto | null>(null);
  const [assignDocEncounter, setAssignDocEncounter] = useState<EncounterDto | null>(null);
  const [statusEncounter, setStatusEncounter] = useState<EncounterDto | null>(null);
  const [cancelEncounter, setCancelEncounter] = useState<EncounterDto | null>(null);
  const [referEncounter, setReferEncounter] = useState<EncounterDto | null>(null);
  const [reassignEncounter, setReassignEncounter] = useState<EncounterDto | null>(null);

  const filtered = encounters.filter((e) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        e.encounterNumber.toLowerCase().includes(q) ||
        e.patientName.toLowerCase().includes(q) ||
        e.patientMrn.toLowerCase().includes(q) ||
        (e.doctorName && e.doctorName.toLowerCase().includes(q)) ||
        (e.tokenNumber && e.tokenNumber.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && e.encounterType !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Clinical Encounters & Visits Directory
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Searchable registry of patient visits, queue tokens, attending physician links, and workflow states
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          ➕ Register New Encounter
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Search Encounters
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Encounter #, Patient, MRN, Doctor..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Encounter Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Lifecycle Statuses' },
                { value: 'REGISTERED', label: 'Registered' },
                { value: 'CHECKED_IN', label: 'Checked In' },
                { value: 'WAITING', label: 'Waiting in Queue' },
                { value: 'IN_CONSULTATION', label: 'In Consultation' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'REFERRED', label: 'Referred' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'NO_SHOW', label: 'No Show' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
              Encounter Type
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Encounter Types' },
                { value: 'OPD', label: 'OPD Scheduled' },
                { value: 'WALK_IN', label: 'Walk-In' },
                { value: 'FOLLOW_UP', label: 'Follow-Up' },
                { value: 'TELECONSULTATION', label: 'Teleconsultation' },
                { value: 'EMERGENCY', label: 'Emergency' },
                { value: 'IPD', label: 'Inpatient (IPD)' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Encounters Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Encounter #</TableHead>
                <TableHead>Patient & MRN</TableHead>
                <TableHead>Department & Doctor</TableHead>
                <TableHead>Type & Priority</TableHead>
                <TableHead>Queue Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero encounters found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
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
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {e.priority} · {e.consultationMode}
                      </span>
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
                    <TableCell>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <Button variant="outline" size="sm" onClick={() => onSelectEncounter(e.id)}>
                          Dossier
                        </Button>
                        {e.status === 'REGISTERED' && (
                          <Button variant="primary" size="sm" onClick={() => setCheckInEncounter(e)}>
                            Check In
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setAssignDocEncounter(e)}>
                          Doctor
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setStatusEncounter(e)}>
                          Status
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setReferEncounter(e)}>
                          Refer
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setReassignEncounter(e)}>
                          Reassign
                        </Button>
                        {e.status !== 'CANCELLED' && e.status !== 'COMPLETED' && (
                          <Button variant="outline" size="sm" onClick={() => setCancelEncounter(e)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modals */}
      {isCreateOpen && (
        <CreateEncounterDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={tenantId}
          partnerId={partnerId}
          organizationId={organizationId}
          branchId={branchId}
          actorId={actorId}
          actorRole={actorRole}
          patients={patients}
          doctors={doctors}
          departments={departments}
          onCreateEncounter={onCreateEncounter}
        />
      )}

      {checkInEncounter && (
        <CheckInEncounterDialog
          isOpen={Boolean(checkInEncounter)}
          onClose={() => setCheckInEncounter(null)}
          encounter={checkInEncounter}
          actorId={actorId}
          actorRole={actorRole}
          onCheckIn={onCheckInEncounter}
        />
      )}

      {assignDocEncounter && (
        <AssignDoctorDialog
          isOpen={Boolean(assignDocEncounter)}
          onClose={() => setAssignDocEncounter(null)}
          encounter={assignDocEncounter}
          doctors={doctors}
          actorId={actorId}
          actorRole={actorRole}
          onAssignDoctor={onAssignDoctor}
        />
      )}

      {statusEncounter && (
        <ChangeEncounterStatusDialog
          isOpen={Boolean(statusEncounter)}
          onClose={() => setStatusEncounter(null)}
          encounter={statusEncounter}
          actorId={actorId}
          actorRole={actorRole}
          onChangeStatus={onChangeStatus}
        />
      )}

      {cancelEncounter && (
        <CancelEncounterDialog
          isOpen={Boolean(cancelEncounter)}
          onClose={() => setCancelEncounter(null)}
          encounter={cancelEncounter}
          actorId={actorId}
          actorRole={actorRole}
          onCancelEncounter={onCancelEncounter}
        />
      )}

      {referEncounter && (
        <ReferEncounterDialog
          isOpen={Boolean(referEncounter)}
          onClose={() => setReferEncounter(null)}
          encounter={referEncounter}
          departments={departments}
          doctors={doctors}
          actorId={actorId}
          actorRole={actorRole}
          onReferEncounter={onReferEncounter}
        />
      )}

      {reassignEncounter && (
        <ReassignEncounterDialog
          isOpen={Boolean(reassignEncounter)}
          onClose={() => setReassignEncounter(null)}
          encounter={reassignEncounter}
          departments={departments}
          doctors={doctors}
          actorId={actorId}
          actorRole={actorRole}
          onReassignEncounter={onReassignEncounter}
        />
      )}
    </div>
  );
};
