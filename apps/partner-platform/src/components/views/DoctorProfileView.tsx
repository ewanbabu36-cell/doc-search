import React from 'react';
import type {
  DoctorProfileDto,
  DoctorScheduleDto,
  DoctorLeaveDto,
  ConsultationFeeMatrixDto,
  DoctorOpdAuditTraceDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface DoctorProfileViewProps {
  doctor: DoctorProfileDto | null;
  schedules: DoctorScheduleDto[];
  leaves: DoctorLeaveDto[];
  fees: ConsultationFeeMatrixDto[];
  auditTraces: DoctorOpdAuditTraceDto[];
}

export const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({
  doctor,
  schedules,
  leaves,
  fees,
  auditTraces
}) => {
  if (!doctor) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ds-color-text-muted)' }}>
          Please select a doctor from the Doctor Directory or Overview to view their complete clinical profile.
        </div>
      </Card>
    );
  }

  const docSchedules = schedules.filter((s) => s.doctorId === doctor.id);
  const docLeaves = leaves.filter((l) => l.doctorId === doctor.id);
  const docFees = fees.filter((f) => !f.doctorId || f.doctorId === doctor.id);
  const docAudits = auditTraces.filter((a) => a.doctorId === doctor.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Doctor Card */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {doctor.fullName}
              </h2>
              <Badge variant="primary">{doctor.primarySpecialty}</Badge>
              <Badge variant={doctor.availabilityStatus === 'AVAILABLE' ? 'success' : doctor.availabilityStatus === 'ON_LEAVE' ? 'primary' : 'warning'}>
                {doctor.availabilityStatus}
              </Badge>
              <Badge variant={doctor.telehealthEligible ? 'success' : 'neutral'}>
                {doctor.telehealthEligible ? 'TELEHEALTH ENABLED' : 'IN-PERSON ONLY'}
              </Badge>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
              Doctor Code: <code>{doctor.doctorCode}</code> · License: <strong>{doctor.medicalLicenseNumber}</strong> · Experience: <strong>{doctor.experienceYears} Years</strong>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
              Clinical Contact
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--ds-color-text-primary)' }}>
              {doctor.workEmail}
            </span>
            {doctor.workPhone && (
              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', display: 'block' }}>
                {doctor.workPhone}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Qualifications & Consultation Scope */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card title="Clinical Qualifications & Specialty" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Degrees & Certifications</span>
              <strong>{doctor.qualification}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Primary Specialty</span>
              <strong>{doctor.primarySpecialty}</strong>
            </div>
            {doctor.subSpecialties.length > 0 && (
              <div>
                <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Sub-Specialties</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {doctor.subSpecialties.map((sub) => (
                    <Badge key={sub} variant="neutral">{sub}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Facility & Department Assignment" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Assigned Organization</span>
              <strong>{doctor.organizationName ?? 'Organization'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Facility Branch</span>
              <strong>{doctor.branchName ?? 'Branch Facility'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', fontSize: '0.6875rem' }}>Department</span>
              <strong>{doctor.departmentName ?? 'Clinical Department'}</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly Recurring Schedules Table */}
      <Card
        title="Weekly Recurring OPD Schedules"
        subtitle="Clinic consultation timings, slot durations, and designated consultation rooms"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day of Week</TableHead>
                <TableHead>Shift / Session Name</TableHead>
                <TableHead>Clinic Hours</TableHead>
                <TableHead>Slot Duration</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '16px' }}>
                    Zero recurring OPD schedules configured for this doctor.
                  </TableCell>
                </TableRow>
              ) : (
                docSchedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell style={{ fontWeight: '700' }}>{s.dayOfWeek}</TableCell>
                    <TableCell style={{ fontWeight: '600' }}>{s.shiftName}</TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontFamily: 'var(--ds-font-mono)' }}>
                      {s.startTime} — {s.endTime}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>
                      {s.slotDurationMinutes} mins ({s.maxPatientsPerSlot} pt/slot)
                    </TableCell>
                    <TableCell><Badge variant="neutral">{s.consultationMode}</Badge></TableCell>
                    <TableCell style={{ fontSize: '0.8125rem' }}>{s.roomNumber ?? 'Unassigned'}</TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? 'success' : 'warning'}>
                        {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Consultation Fees Matrix */}
      <Card
        title="Applicable Consultation Fee Matrix"
        subtitle="Standardized fees for new patient, follow-up, and teleconsultation encounters"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consultation Type</TableHead>
                <TableHead>Base Fee Amount</TableHead>
                <TableHead>Follow-Up Validity</TableHead>
                <TableHead>Scope Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docFees.map((f) => (
                <TableRow key={f.id}>
                  <TableCell style={{ fontWeight: '600' }}>{f.consultationType}</TableCell>
                  <TableCell style={{ fontWeight: '700', color: 'var(--ds-color-primary)', fontSize: '0.875rem' }}>
                    ${f.baseFeeAmount.toFixed(2)} {f.currency}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>{f.followUpValidityDays} Days</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{f.doctorId ? 'DOCTOR SPECIFIC' : 'SPECIALTY DEFAULT'}</Badge>
                  </TableCell>
                  <TableCell><Badge variant="success">{f.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Leaves & Conflict History */}
      {docLeaves.length > 0 && (
        <Card title="Approved Leaves & Exclusion Windows" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Window (Start — End)</TableHead>
                  <TableHead>Affected Slots</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By & Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docLeaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell><Badge variant="neutral">{l.leaveType}</Badge></TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                      {l.affectedSlotsCount} slots blocked
                    </TableCell>
                    <TableCell><Badge variant="success">{l.approvalStatus}</Badge></TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      <strong>{l.approvedBy}</strong>: {l.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Doctor Audit Trail */}
      {docAudits.length > 0 && (
        <Card title="Doctor Audit Trail" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trace ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Justification</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docAudits.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem' }}>{a.traceId}</TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>{a.action}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{a.actorId} ({a.actorRole})</TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>{a.justification}</TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      {new Date(a.occurredAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
