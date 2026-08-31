import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { RecordVitalObservationRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';

export interface RecordVitalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RecordVitalObservationRequest) => Promise<void>;
  admission: InpatientAdmissionDto | null;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RecordVitalDialog: React.FC<RecordVitalDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  admission,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [recordedBy, setRecordedBy] = useState('Staff Nurse Patricia Bailey, RN');
  const [temperatureCelsius, setTemperatureCelsius] = useState('37.0');
  const [pulseBpm, setPulseBpm] = useState('76');
  const [respiratoryRateBpm, setRespiratoryRateBpm] = useState('18');
  const [systolicBpMmHg, setSystolicBpMmHg] = useState('120');
  const [diastolicBpMmHg, setDiastolicBpMmHg] = useState('80');
  const [spo2Percentage, setSpo2Percentage] = useState('98');
  const [bloodGlucoseMgDl, setBloodGlucoseMgDl] = useState('110');
  const [painScaleScore, setPainScaleScore] = useState('0');
  const [gcsScore, setGcsScore] = useState('15');
  const [notes, setNotes] = useState('Routine observations chartered.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!admission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        admissionId: admission.id,
        patientId: admission.patientId,
        recordedBy,
        temperatureCelsius: parseFloat(temperatureCelsius) || undefined,
        pulseBpm: parseInt(pulseBpm, 10) || undefined,
        respiratoryRateBpm: parseInt(respiratoryRateBpm, 10) || undefined,
        systolicBpMmHg: parseInt(systolicBpMmHg, 10) || undefined,
        diastolicBpMmHg: parseInt(diastolicBpMmHg, 10) || undefined,
        spo2Percentage: parseInt(spo2Percentage, 10) || undefined,
        bloodGlucoseMgDl: parseFloat(bloodGlucoseMgDl) || undefined,
        painScaleScore: parseInt(painScaleScore, 10) || undefined,
        gcsScore: parseInt(gcsScore, 10) || undefined,
        isAbnormal: false,
        notes
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to chart vitals');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Chart Vitals & Observations — ${admission.patientName}` }>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Recorded By Nurse</label>
          <Input value={recordedBy} onChange={(e) => setRecordedBy(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Temp (°C)</label>
            <Input type="number" step="0.1" value={temperatureCelsius} onChange={(e) => setTemperatureCelsius(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Heart Rate (BPM)</label>
            <Input type="number" value={pulseBpm} onChange={(e) => setPulseBpm(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Resp Rate (BPM)</label>
            <Input type="number" value={respiratoryRateBpm} onChange={(e) => setRespiratoryRateBpm(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Systolic BP</label>
            <Input type="number" value={systolicBpMmHg} onChange={(e) => setSystolicBpMmHg(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Diastolic BP</label>
            <Input type="number" value={diastolicBpMmHg} onChange={(e) => setDiastolicBpMmHg(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>SpO2 (%)</label>
            <Input type="number" value={spo2Percentage} onChange={(e) => setSpo2Percentage(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Glucose (mg/dL)</label>
            <Input type="number" value={bloodGlucoseMgDl} onChange={(e) => setBloodGlucoseMgDl(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Pain Score (0-10)</label>
            <Input type="number" value={painScaleScore} onChange={(e) => setPainScaleScore(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>GCS Score (3-15)</label>
            <Input type="number" value={gcsScore} onChange={(e) => setGcsScore(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Observer Notes</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Observation'}</Button>
        </div>
      </form>
    </Dialog>
  );
};