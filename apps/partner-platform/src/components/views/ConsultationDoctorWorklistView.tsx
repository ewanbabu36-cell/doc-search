import { SmartWaitingRoomVitalsGateway } from './SmartWaitingRoomVitalsGateway.js';
import React, { useState } from 'react';
import type {
  ConsultationDto,
  DoctorProfileDto,
  EncounterDto,
  CreateConsultationRequest
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
  TableHead,
  TableRow,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';

export interface ConsultationDoctorWorklistViewProps {
  doctors: DoctorProfileDto[];
  consultations: ConsultationDto[];
  encounters: EncounterDto[];
  actorId: string;
  actorRole: string;
  onOpenConsultation: (consultationId: string) => void;
  onStartNewConsultation: (req: CreateConsultationRequest) => Promise<void>;
}

export const ConsultationDoctorWorklistView: React.FC<ConsultationDoctorWorklistViewProps> = ({
  doctors,
  consultations,
  encounters,
  actorId,
  actorRole,
  onOpenConsultation,
  onStartNewConsultation
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id ?? '');
  const [filterType, setFilterType] = useState<string>('ALL');

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) ?? doctors[0];

  // Active encounters for selected doctor
  const doctorEncounters = encounters.filter((e) => !selectedDoctorId || e.doctorId === selectedDoctorId);

  // Combine encounter and consultation status
  const worklistItems = doctorEncounters.map((enc) => {
    const cons = consultations.find((c) => c.encounterId === enc.id && c.consultationStatus !== 'CANCELLED');
    return {
      encounter: enc,
      consultation: cons
    };
  }).filter((item) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'WAITING') return !item.consultation || item.consultation.consultationStatus === 'DRAFT';
    if (filterType === 'IN_PROGRESS') return item.consultation?.consultationStatus === 'IN_PROGRESS' || item.consultation?.consultationStatus === 'STARTED';
    if (filterType === 'COMPLETED') return item.consultation?.consultationStatus === 'COMPLETED';
    return true;
  });

  const handleStartConsultationClick = async (enc: EncounterDto) => {
    await onStartNewConsultation({
      tenantId: enc.tenantId,
      partnerId: enc.partnerId,
      organizationId: enc.organizationId,
      branchId: enc.branchId,
      patientId: enc.patientId,
      encounterId: enc.id,
      doctorId: enc.doctorId ?? selectedDoctor?.id ?? 'aaaa1111-1111-4aaa-8aaa-111111111101',
      consultationType: enc.encounterType === 'TELECONSULTATION' ? 'TELECONSULTATION' : 'OPD_CONSULTATION',
      chiefComplaint: enc.chiefComplaint ?? enc.visitReason ?? 'General clinical consultation',
      actorId,
      actorRole,
      justification: `Started clinical consultation for encounter ${enc.encounterNumber}`
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SmartWaitingRoomVitalsGateway />

      {/* Physician Selector Header */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 700 }}>
              👨‍⚕️ Physician Consultation Worklist
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Live patient arrivals, queue tokens, triage vital logs, and one-click EMR consultation launch.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px', color: 'var(--ds-color-text-muted)' }}>
                Attending Physician
              </label>
              <Select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                options={doctors.map((d) => ({
                  value: d.id,
                  label: `${d.fullName} (${d.primarySpecialty})`
                }))}
              />
            </div>

            <div style={{ minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px', color: 'var(--ds-color-text-muted)' }}>
                Filter Status
              </label>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Patients' },
                  { value: 'WAITING', label: 'Waiting / Not Started' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'COMPLETED', label: 'Completed' }
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {selectedDoctor && (
        <Alert type="info" title={`Active Desk: ${selectedDoctor.fullName} — ${selectedDoctor.primarySpecialty}`}>
          License: {selectedDoctor.medicalLicenseNumber} · Consultation Room: Suite 101 · Mode: In-Person & Telehealth
        </Alert>
      )}

      {/* Worklist Table */}
      <Card title={`Queue & Consultations (${worklistItems.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue / Token</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Encounter #</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>EMR Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {worklistItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                    No patients assigned to current physician worklist matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                worklistItems.map((row) => (
                  <TableRow key={row.encounter.id}>
                    <TableCell>
                      <Badge variant={row.encounter.priority === 'URGENT' || row.encounter.priority === 'EMERGENCY' ? 'danger' : 'primary'}>
                        {row.encounter.tokenNumber ?? 'TOKEN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{row.encounter.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        MRN: {row.encounter.patientMrn} · {row.encounter.patientGender ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.encounter.encounterNumber}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>{row.encounter.encounterType}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {row.encounter.chiefComplaint ?? row.encounter.visitReason ?? 'Routine Consultation'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!row.consultation && <Badge variant="neutral">Not Started</Badge>}
                      {row.consultation?.consultationStatus === 'DRAFT' && <Badge variant="warning">Draft In Progress</Badge>}
                      {(row.consultation?.consultationStatus === 'IN_PROGRESS' || row.consultation?.consultationStatus === 'STARTED') && (
                        <Badge variant="primary">In Consultation</Badge>
                      )}
                      {row.consultation?.consultationStatus === 'COMPLETED' && <Badge variant="success">Completed & Signed</Badge>}
                      {row.consultation && !['DRAFT', 'IN_PROGRESS', 'STARTED', 'COMPLETED'].includes(row.consultation.consultationStatus) && (
                        <Badge variant="neutral">{row.consultation.consultationStatus}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!row.consultation ? (
                        <Button size="sm" variant="primary" onClick={() => handleStartConsultationClick(row.encounter)}>
                          ▶️ Start EMR
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (row.consultation) {
                              onOpenConsultation(row.consultation.id);
                            }
                          }}
                        >
                          📂 Open Record
                        </Button>
                      )}
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
