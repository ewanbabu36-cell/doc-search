import React, { useState } from 'react';
import type {
  ConsultationDto,
  AddConsultationVitalsRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface AddVitalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  actorId: string;
  actorRole: string;
  onAddVitals: (req: AddConsultationVitalsRequest) => Promise<void>;
}

export const AddVitalsDialog: React.FC<AddVitalsDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  actorId,
  actorRole,
  onAddVitals
}) => {
  const current = consultation.vitals;
  const [temp, setTemp] = useState(current?.temperatureCelsius ?? '36.8');
  const [pulse, setPulse] = useState(current?.pulseBpm?.toString() ?? '76');
  const [respRate, setRespRate] = useState(current?.respiratoryRateBpm?.toString() ?? '16');
  const [sysBp, setSysBp] = useState(current?.systolicBp?.toString() ?? '120');
  const [diaBp, setDiaBp] = useState(current?.diastolicBp?.toString() ?? '80');
  const [spO2, setSpO2] = useState(current?.oxygenSaturationPercent?.toString() ?? '99');
  const [weight, setWeight] = useState(current?.weightKg ?? '70');
  const [height, setHeight] = useState(current?.heightCm ?? '170');
  const [painScore, setPainScore] = useState(current?.painScore?.toString() ?? '0');
  const [notes, setNotes] = useState(current?.clinicalNotes ?? 'Resting vitals stable');
  const [justification, setJustification] = useState('Logged structured clinical observations & vital signs');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateBmi = (): string => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddVitals({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        temperatureCelsius: temp || undefined,
        pulseBpm: pulse ? parseInt(pulse, 10) : undefined,
        respiratoryRateBpm: respRate ? parseInt(respRate, 10) : undefined,
        systolicBp: sysBp ? parseInt(sysBp, 10) : undefined,
        diastolicBp: diaBp ? parseInt(diaBp, 10) : undefined,
        oxygenSaturationPercent: spO2 ? parseInt(spO2, 10) : undefined,
        weightKg: weight || undefined,
        heightCm: height || undefined,
        bmi: calculateBmi() || undefined,
        painScore: painScore ? parseInt(painScore, 10) : undefined,
        clinicalNotes: notes || undefined,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record vitals');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`💓 Record Clinical Vitals: ${consultation.patientName} (${consultation.patientMrn})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Vitals'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Temperature (°C)
            </label>
            <Input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="36.8" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Pulse (bpm)
            </label>
            <Input value={pulse} onChange={(e) => setPulse(e.target.value)} type="number" placeholder="76" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Systolic BP (mmHg)
            </label>
            <Input value={sysBp} onChange={(e) => setSysBp(e.target.value)} type="number" placeholder="120" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Diastolic BP (mmHg)
            </label>
            <Input value={diaBp} onChange={(e) => setDiaBp(e.target.value)} type="number" placeholder="80" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              SpO2 (%)
            </label>
            <Input value={spO2} onChange={(e) => setSpO2(e.target.value)} type="number" placeholder="99" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Respiratory Rate (bpm)
            </label>
            <Input value={respRate} onChange={(e) => setRespRate(e.target.value)} type="number" placeholder="16" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Weight (kg)
            </label>
            <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70.0" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Height (cm)
            </label>
            <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Calculated BMI: <strong>{calculateBmi() || '—'} kg/m²</strong> · Pain Score (0–10)
          </label>
          <Input value={painScore} onChange={(e) => setPainScore(e.target.value)} type="number" min="0" max="10" placeholder="0" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Clinical Notes
          </label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Vitals observations" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
        </div>
      </form>
    </Dialog>
  );
};
