import React, { useState } from 'react';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';
import type { RecordVitalObservationRequest, InpatientAdmissionDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

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

  const sBp = parseInt(systolicBpMmHg, 10) || 120;
  const hr = parseInt(pulseBpm, 10) || 76;
  const rr = parseInt(respiratoryRateBpm, 10) || 18;
  const o2 = parseInt(spo2Percentage, 10) || 98;
  const temp = parseFloat(temperatureCelsius) || 37.0;

  // Real-world clinical NEWS2 score calculation
  let news2 = 0;
  if (rr <= 8) news2 += 3;
  else if (rr >= 9 && rr <= 11) news2 += 1;
  else if (rr >= 21 && rr <= 24) news2 += 2;
  else if (rr >= 25) news2 += 3;

  if (o2 <= 91) news2 += 3;
  else if (o2 >= 92 && o2 <= 93) news2 += 2;
  else if (o2 >= 94 && o2 <= 95) news2 += 1;

  if (sBp <= 90) news2 += 3;
  else if (sBp >= 91 && sBp <= 100) news2 += 2;
  else if (sBp >= 101 && sBp <= 110) news2 += 1;
  else if (sBp >= 220) news2 += 3;

  if (hr <= 40) news2 += 3;
  else if (hr >= 41 && hr <= 50) news2 += 1;
  else if (hr >= 91 && hr <= 110) news2 += 1;
  else if (hr >= 111 && hr <= 130) news2 += 2;
  else if (hr >= 131) news2 += 3;

  if (temp <= 35.0) news2 += 3;
  else if (temp >= 35.1 && temp <= 36.0) news2 += 1;
  else if (temp >= 38.1 && temp <= 39.0) news2 += 1;
  else if (temp >= 39.1) news2 += 2;

  // Septic Shock Triad Detection: Severe Hypotension (sBP <= 90) + Tachycardia (HR >= 110) + Dyspyrexia/Tachypnea
  const isSepticShockRisk = sBp <= 90 && hr >= 110 && (temp >= 38.0 || temp <= 36.0 || rr >= 22);
  const isHighRiskNews2 = news2 >= 5 || isSepticShockRisk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const isAbnormal = isHighRiskNews2;
      const formattedNotes = isHighRiskNews2
        ? `[NEWS2: ${news2} - ${isSepticShockRisk ? 'SEPTIC SHOCK TRIAD' : 'HIGH CLINICAL RISK'}] ${notes}`
        : notes;

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
        isAbnormal,
        notes: formattedNotes
      });

      if (isHighRiskNews2) {
        hospitalEventBus.publish(
          'SEPSIS_ALERT_TRIGGERED',
          'InpatientVitalsStation',
          {
            admissionId: admission.id,
            patientName: admission.patientName,
            patientMrn: admission.patientMrn,
            bedCode: admission.bedCode,
            news2Score: news2,
            isSepticShockRisk,
            vitals: { sBp, hr, rr, o2, temp }
          },
          `🚨 Sepsis / High-Risk NEWS2 Alert (${news2}): ${admission.patientName} (Bed ${admission.bedCode})`
        );
      }

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

        {/* Dynamic NEWS2 & Septic Shock Telemetry Bar */}
        <div
          style={{
            backgroundColor: isHighRiskNews2 ? '#FEF2F2' : '#F0FDF4',
            border: isHighRiskNews2 ? '1.5px solid #EF4444' : '1px solid #86EFAC',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isHighRiskNews2 ? '#DC2626' : '#15803D' }}>
              {isHighRiskNews2 ? '🚨 HIGH CLINICAL RISK DETECTED' : '✓ PHYSIOLOGICALLY STABLE'}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, backgroundColor: isHighRiskNews2 ? '#EF4444' : '#16A34A', color: '#FFF', padding: '2px 8px', borderRadius: '4px' }}>
              NEWS2 Score: {news2}
            </span>
          </div>
          {isSepticShockRisk ? (
            <div style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600 }}>
              ⚠️ <strong>Septic Shock Triad:</strong> Severe Hypotension (sBP {sBp}) + Tachycardia (Pulse {hr}) with Dyspyrexia. Automatic code-red notification will be dispatched to On-Duty Medical Officer.
            </div>
          ) : isHighRiskNews2 ? (
            <div style={{ fontSize: '0.75rem', color: '#991B1B' }}>
              Elevated physiological deterioration score (&ge; 5). Escalation protocol active.
            </div>
          ) : (
            <div style={{ fontSize: '0.72rem', color: '#166534' }}>
              Low risk (Score 0-4). Routine 4-hourly nursing observation protocol.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: isHighRiskNews2 ? '#DC2626' : undefined, borderColor: isHighRiskNews2 ? '#DC2626' : undefined }}
          >
            {isSubmitting ? 'Saving...' : isHighRiskNews2 ? '🚨 Save & Dispatch Code-Red' : 'Save Observation'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};