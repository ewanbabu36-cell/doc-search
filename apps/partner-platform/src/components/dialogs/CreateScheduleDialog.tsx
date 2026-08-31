import React, { useState } from 'react';
import type {
  DayOfWeek,
  ConsultationMode,
  CreateDoctorScheduleRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface CreateScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
  doctors: { id: string; fullName: string; doctorCode: string }[];
  onCreateSchedule: (req: CreateDoctorScheduleRequest) => Promise<void>;
}

export const CreateScheduleDialog: React.FC<CreateScheduleDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  partnerId,
  organizationId,
  branchId,
  actorId,
  actorRole,
  doctors,
  onCreateSchedule
}) => {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [shiftName, setShiftName] = useState('Morning Clinic OPD');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [slotDuration, setSlotDuration] = useState(20);
  const [maxPatients, setMaxPatients] = useState(1);
  const [bufferTime, setBufferTime] = useState(5);
  const [mode, setMode] = useState<ConsultationMode>('IN_PERSON');
  const [room, setRoom] = useState('Room 302');
  const [reason, setReason] = useState('Creating weekly recurring OPD clinic schedule');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      setError('Doctor selection is required.');
      return;
    }
    if (!shiftName || shiftName.trim().length < 2) {
      setError('Shift name is required.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Audit justification is mandatory.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateSchedule({
        actorId,
        actorRole,
        tenantId,
        partnerId,
        organizationId,
        branchId,
        doctorId,
        dayOfWeek,
        shiftName,
        startTime,
        endTime,
        slotDurationMinutes: slotDuration,
        maxPatientsPerSlot: maxPatients,
        bufferTimeMinutes: bufferTime,
        consultationMode: mode,
        roomNumber: room || undefined,
        reason
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Weekly Recurring OPD Schedule"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Create Schedule
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited OPD Schedule Template">
          Configures recurring clinic consultation hours and generates discrete appointment slots for patient scheduling.
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Doctor *
          </label>
          <Select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={doctors.map((d) => ({
              value: d.id,
              label: `${d.fullName} (${d.doctorCode})`
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Day of Week *
            </label>
            <Select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              options={[
                { value: 'MONDAY', label: 'Monday' },
                { value: 'TUESDAY', label: 'Tuesday' },
                { value: 'WEDNESDAY', label: 'Wednesday' },
                { value: 'THURSDAY', label: 'Thursday' },
                { value: 'FRIDAY', label: 'Friday' },
                { value: 'SATURDAY', label: 'Saturday' },
                { value: 'SUNDAY', label: 'Sunday' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Shift / Session Name *
            </label>
            <Input value={shiftName} onChange={(e) => setShiftName(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Start Time (HH:MM) *
            </label>
            <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="09:00" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              End Time (HH:MM) *
            </label>
            <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="13:00" required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Slot Duration (Mins) *
            </label>
            <Input
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value, 10) || 15)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Max Patients / Slot
            </label>
            <Input
              type="number"
              value={maxPatients}
              onChange={(e) => setMaxPatients(parseInt(e.target.value, 10) || 1)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Buffer Time (Mins)
            </label>
            <Input
              type="number"
              value={bufferTime}
              onChange={(e) => setBufferTime(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Consultation Mode *
            </label>
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as ConsultationMode)}
              options={[
                { value: 'IN_PERSON', label: 'In-Person Consultation' },
                { value: 'TELEHEALTH', label: 'Telehealth Virtual OPD' },
                { value: 'HYBRID', label: 'Hybrid Session' },
                { value: 'WALK_IN', label: 'Walk-In Clinic' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Room / Clinic Location
            </label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Room 302" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Added recurring Monday morning OPD clinic session"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
