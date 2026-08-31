import React, { useState } from 'react';
import type {
  DoctorProfileDto,
  EncounterDto,
  OperationalDepartmentDto,
  ChangeEncounterStatusRequest,
  ReferEncounterRequest
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
import { ReferEncounterDialog } from '../dialogs/ReferEncounterDialog.js';

export interface DoctorWorklistViewProps {
  doctors: DoctorProfileDto[];
  encounters: EncounterDto[];
  departments: OperationalDepartmentDto[];
  actorId: string;
  actorRole: string;
  onCallPatient: (encounterId: string) => Promise<void>;
  onChangeStatus: (req: ChangeEncounterStatusRequest) => Promise<void>;
  onReferEncounter: (req: ReferEncounterRequest) => Promise<void>;
  onSelectEncounter: (encounterId: string) => void;
}

export const DoctorWorklistView: React.FC<DoctorWorklistViewProps> = ({
  doctors,
  encounters,
  departments,
  actorId,
  actorRole,
  onCallPatient,
  onChangeStatus,
  onReferEncounter,
  onSelectEncounter
}) => {
  const [selectedDocId, setSelectedDocId] = useState(doctors[0]?.id ?? '');
  const [referringEncounter, setReferringEncounter] = useState<EncounterDto | null>(null);

  const selectedDoctor = doctors.find((d) => d.id === selectedDocId) ?? doctors[0] ?? null;

  const docEncounters = encounters.filter((e) => e.doctorId === selectedDocId);
  const waitingPatients = docEncounters.filter((e) => e.status === 'WAITING' || e.status === 'CHECKED_IN');
  const inConsultation = docEncounters.filter((e) => e.status === 'IN_CONSULTATION');
  const completedToday = docEncounters.filter((e) => e.status === 'COMPLETED');

  const handleCompleteVisit = async (encounter: EncounterDto) => {
    await onChangeStatus({
      actorId,
      actorRole,
      tenantId: encounter.tenantId,
      partnerId: encounter.partnerId,
      organizationId: encounter.organizationId,
      encounterId: encounter.id,
      newStatus: 'COMPLETED',
      reason: 'Doctor completed clinical examination and finalized outpatient consultation'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            Doctor Clinical Worklist & Consultation Desk
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
            Physician consultation queue, in-room examination state, and referral escalation triggers
          </span>
        </div>

        <div style={{ minWidth: '240px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
            Active Physician
          </label>
          <Select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            options={doctors.map((d) => ({
              value: d.id,
              label: `${d.fullName} (${d.primarySpecialty})`
            }))}
          />
        </div>
      </div>

      {selectedDoctor && (
        <Alert type="info" title={`Consultation Desk: ${selectedDoctor.fullName}`}>
          Specialty: <strong>{selectedDoctor.primarySpecialty}</strong> · OPD Slots: Active · Room: Consultation Suite 101
        </Alert>
      )}

      {/* Active Consultation Spotlight */}
      {inConsultation.length > 0 && (
        <Card title="⚡ Patient Currently In Consultation Room" padding="md" style={{ border: '2px solid var(--ds-color-primary)' }}>
          {inConsultation.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '1.125rem', color: 'var(--ds-color-text-primary)' }}>
                  {e.patientName} (Token: {e.tokenNumber ?? 'N/A'})
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                  MRN: <code>{e.patientMrn}</code> · DOB: {e.patientDob ?? '—'} · Priority: {e.priority}
                </span>
                <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)', marginTop: '4px' }}>
                  Chief Complaint: <em>"{e.chiefComplaint}"</em>
                </span>
                {e.triageNotes && (
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                    Triage: {e.triageNotes}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => onSelectEncounter(e.id)}>
                  View Dossier
                </Button>
                <Button variant="outline" size="sm" onClick={() => setReferringEncounter(e)}>
                  Specialist Referral
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleCompleteVisit(e)}>
                  ✅ Conclude Consultation
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Waiting Queue for Selected Doctor */}
      <Card title={`Patients Waiting for Consultation (${waitingPatients.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token #</TableHead>
                <TableHead>Patient Name & MRN</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitingPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No patients currently waiting for {selectedDoctor?.fullName ?? 'this doctor'}.
                  </TableCell>
                </TableRow>
              ) : (
                waitingPatients.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.875rem' }}>
                      {e.tokenNumber ?? '—'}
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{e.patientName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{e.patientMrn}</code>
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', maxWidth: '280px' }}>
                      {e.chiefComplaint}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.priority === 'URGENT' ? 'danger' : 'neutral'}>
                        {e.priority}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {e.checkedInAt ? new Date(e.checkedInAt).toLocaleTimeString() : '—'}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="outline" size="sm" onClick={() => onSelectEncounter(e.id)}>
                          Dossier
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => onCallPatient(e.id)}>
                          📢 Call into Room
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Completed Consultations Today */}
      <Card title={`Completed Consultations Today (${completedToday.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Encounter #</TableHead>
                <TableHead>Patient & MRN</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedToday.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    Zero consultations completed today yet.
                  </TableCell>
                </TableRow>
              ) : (
                completedToday.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>
                      {e.encounterNumber}
                    </TableCell>
                    <TableCell>
                      <strong>{e.patientName}</strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: <code>{e.patientMrn}</code>
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{e.chiefComplaint}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{e.consultationMode}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {e.completedAt ? new Date(e.completedAt).toLocaleTimeString() : '—'}
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

      {referringEncounter && (
        <ReferEncounterDialog
          isOpen={Boolean(referringEncounter)}
          onClose={() => setReferringEncounter(null)}
          encounter={referringEncounter}
          departments={departments}
          doctors={doctors}
          actorId={actorId}
          actorRole={actorRole}
          onReferEncounter={onReferEncounter}
        />
      )}
    </div>
  );
};
