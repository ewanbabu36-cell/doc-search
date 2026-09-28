import { SmartWaitingRoomVitalsGateway } from './SmartWaitingRoomVitalsGateway.js';
import React, { useState, useMemo } from 'react';
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
import { PrintableDoctorPrescriptionModal } from '../dialogs/PrintableDoctorPrescriptionModal.js';

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
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showIotGateway, setShowIotGateway] = useState<boolean>(false);
  const [printModalConsultation, setPrintModalConsultation] = useState<ConsultationDto | null>(null);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Helper to read Nurse Vitals
  const getNurseVitals = (encId: string, enc: EncounterDto) => {
    try {
      const stored = JSON.parse(localStorage.getItem('docsearch_nurse_vitals') || '{}');
      if (stored[encId]) return stored[encId];
      if (enc.metadata && (enc.metadata as any).nurseVitals) return (enc.metadata as any).nurseVitals;
    } catch {}
    return null;
  };

  // Active encounters for selected doctor or ALL doctors
  const doctorEncounters = useMemo(() => {
    return encounters.filter((e) => {
      if (!selectedDoctorId || selectedDoctorId === 'ALL') return true;
      if (e.doctorId === selectedDoctorId) return true;
      if (e.doctorName && selectedDoctor?.fullName && e.doctorName.toLowerCase().includes(selectedDoctor.fullName.toLowerCase())) return true;
      return false;
    });
  }, [encounters, selectedDoctorId, selectedDoctor]);

  // Combine encounter and consultation status
  const worklistItems = useMemo(() => {
    return doctorEncounters.map((enc) => {
      const cons = consultations.find(
        (c) => (c.encounterId === enc.id || (c.patientMrn && c.patientMrn === enc.patientMrn)) && c.consultationStatus !== 'CANCELLED'
      );
      const vitals = getNurseVitals(enc.id, enc);
      return {
        encounter: enc,
        consultation: cons,
        nurseVitals: vitals
      };
    }).filter((item) => {
      if (filterType === 'ALL') return true;
      if (filterType === 'WAITING') return !item.consultation || item.consultation.consultationStatus === 'DRAFT';
      if (filterType === 'IN_PROGRESS') return item.consultation?.consultationStatus === 'IN_PROGRESS' || item.consultation?.consultationStatus === 'STARTED';
      if (filterType === 'COMPLETED') return item.consultation?.consultationStatus === 'COMPLETED';
      if (filterType === 'READY_WITH_VITALS') return !!item.nurseVitals;
      return true;
    });
  }, [doctorEncounters, consultations, filterType]);

  const handleStartConsultationClick = async (enc: EncounterDto) => {
    await onStartNewConsultation({
      tenantId: enc.tenantId || 'default',
      partnerId: enc.partnerId || 'default',
      organizationId: enc.organizationId || '33333333-3333-4333-8333-333333333301',
      branchId: enc.branchId || '44444444-4444-4444-8444-444444444401',
      patientId: enc.patientId,
      encounterId: enc.id,
      doctorId: enc.doctorId ?? selectedDoctor?.id ?? 'aaaa1111-1111-4aaa-8aaa-111111111101',
      consultationType: enc.encounterType === 'TELECONSULTATION' ? 'TELECONSULTATION' : 'OPD_CONSULTATION',
      chiefComplaint: enc.chiefComplaint ?? enc.visitReason ?? 'General clinical consultation & digital prescription',
      actorId,
      actorRole,
      justification: `Started clinical consultation & digital prescription for token ${enc.tokenNumber || enc.encounterNumber}`
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Printable Prescription Modal if invoked from worklist */}
      {printModalConsultation && (
        <PrintableDoctorPrescriptionModal
          isOpen={true}
          onClose={() => setPrintModalConsultation(null)}
          consultation={printModalConsultation}
        />
      )}

      {/* Optional Collapsible IoT Gateway */}
      {showIotGateway && (
        <div style={{ position: 'relative' }}>
          <SmartWaitingRoomVitalsGateway />
          <button
            type="button"
            onClick={() => setShowIotGateway(false)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Close IoT Hub
          </button>
        </div>
      )}

      {/* Physician & Appointment Queue Selector Header */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>
                📅 Doctor Live Appointment Queue & Clinical Worklist
              </h3>
              <Badge variant="success">● Queue Live</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Real-time patient tokens from Reception, verified Nurse vitals, and 1-click Digital Prescription (Rx) launch.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIotGateway(!showIotGateway)}
              style={{ border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38BDF8', fontSize: '0.78rem' }}
            >
              <span>📡</span>
              <span>{showIotGateway ? 'Hide IoT Hub' : 'Bluetooth IoT Hub'}</span>
            </Button>

            <div style={{ minWidth: '240px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px', color: 'var(--ds-color-text-muted)' }}>
                Attending Physician / Chamber
              </label>
              <Select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                options={[
                  { value: 'ALL', label: '⭐ All Attending Doctors & Chambers' },
                  ...doctors.map((d) => ({
                    value: d.id,
                    label: `${d.fullName} (${d.primarySpecialty})`
                  }))
                ]}
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px', color: 'var(--ds-color-text-muted)' }}>
                Filter Queue Status
              </label>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Patients' },
                  { value: 'READY_WITH_VITALS', label: '🟢 Ready with Nurse Vitals' },
                  { value: 'WAITING', label: '⏳ Waiting / Not Started' },
                  { value: 'IN_PROGRESS', label: '🩺 In Consultation' },
                  { value: 'COMPLETED', label: '✅ Completed & Signed' }
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {selectedDoctor && selectedDoctorId !== 'ALL' && (
        <Alert type="info" title={`Active Desk: ${selectedDoctor.fullName} — ${selectedDoctor.primarySpecialty}`}>
          License: {selectedDoctor.medicalLicenseNumber} · Room: Consultation Suite 101 · OPD Schedule: Active
        </Alert>
      )}

      {/* Appointment & Patient Worklist Table */}
      <Card title={`Live OPD Queue & Appointments (${worklistItems.length})`} padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue / Token</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Doctor & Chamber</TableHead>
                <TableHead>Nurse Vitals & Triage</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>EMR Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {worklistItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '36px' }}>
                    No patient appointments in current queue matching filter criteria. Arriving registrations from Reception will appear here automatically.
                  </TableCell>
                </TableRow>
              ) : (
                worklistItems.map((row) => {
                  const hasVitals = !!row.nurseVitals;
                  const vit = row.nurseVitals;

                  return (
                    <TableRow key={row.encounter.id}>
                      {/* Token */}
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              backgroundColor: row.consultation?.consultationStatus === 'IN_PROGRESS' ? '#06B6D4' : (hasVitals ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                              color: row.consultation?.consultationStatus === 'IN_PROGRESS' ? '#042F2E' : (hasVitals ? '#34D399' : '#FBBF24'),
                              fontWeight: 900,
                              fontSize: '0.9rem'
                            }}
                          >
                            {row.encounter.tokenNumber ?? 'TK'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Patient Details */}
                      <TableCell>
                        <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.9rem' }}>{row.encounter.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                          MRN: <strong>{row.encounter.patientMrn}</strong> · {row.encounter.patientGender ?? '—'} · {row.encounter.patientMobile || '+91 98765 43210'}
                        </div>
                      </TableCell>

                      {/* Doctor & Room */}
                      <TableCell>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E2E8F0' }}>
                          {row.encounter.doctorName || 'Dr. Alok Nath'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {row.encounter.departmentName || 'General Medicine'} · Room 101
                        </div>
                      </TableCell>

                      {/* Nurse Vitals Badge */}
                      <TableCell>
                        {hasVitals ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Badge variant="success" style={{ fontSize: '0.6875rem', fontWeight: 800 }}>
                                ✓ Vitals Recorded
                              </Badge>
                              {vit.triageCategory && (
                                <Badge variant={vit.triageCategory === 'CRITICAL' ? 'danger' : (vit.triageCategory === 'URGENT' ? 'warning' : 'neutral')} style={{ fontSize: '0.65rem' }}>
                                  {vit.triageCategory}
                                </Badge>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 600 }}>
                              BP: {vit.systolicBp}/{vit.diastolicBp} · HR: {vit.pulseBpm} bpm · SpO2: {vit.spo2Percent}% · Temp: {vit.tempF}°F
                            </div>
                          </div>
                        ) : (
                          <Badge variant="warning" style={{ fontSize: '0.6875rem' }}>
                            ⏳ Pending at Nurse Station
                          </Badge>
                        )}
                      </TableCell>

                      {/* Chief Complaint */}
                      <TableCell>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: '#CBD5E1' }}>
                          {row.encounter.chiefComplaint ?? row.encounter.visitReason ?? 'General Consultation'}
                        </div>
                      </TableCell>

                      {/* EMR Status */}
                      <TableCell>
                        {!row.consultation && <Badge variant="neutral">Not Started</Badge>}
                        {row.consultation?.consultationStatus === 'DRAFT' && <Badge variant="warning">Draft EMR</Badge>}
                        {(row.consultation?.consultationStatus === 'IN_PROGRESS' || row.consultation?.consultationStatus === 'STARTED') && (
                          <Badge variant="primary">In Chamber</Badge>
                        )}
                        {row.consultation?.consultationStatus === 'COMPLETED' && <Badge variant="success">Rx Signed</Badge>}
                        {row.consultation && !['DRAFT', 'IN_PROGRESS', 'STARTED', 'COMPLETED'].includes(row.consultation.consultationStatus) && (
                          <Badge variant="neutral">{row.consultation.consultationStatus}</Badge>
                        )}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                          {!row.consultation ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleStartConsultationClick(row.encounter)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, backgroundColor: '#0284C7', borderColor: '#0284C7' }}
                            >
                              <span>🩺</span>
                              <span>Start Rx & EMR</span>
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  if (row.consultation) {
                                    onOpenConsultation(row.consultation.id);
                                  }
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}
                              >
                                <span>🩺</span>
                                <span>Open EMR</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPrintModalConsultation(row.consultation || null)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #0284C7', color: '#38BDF8' }}
                                title="Print Prescription Slip"
                              >
                                <span>🖨️</span>
                                <span>Rx Slip</span>
                              </Button>
                            </>
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
