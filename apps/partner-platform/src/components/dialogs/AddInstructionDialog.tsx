import React, { useState } from 'react';
import type {
  ConsultationDto,
  AddInstructionRequest,
  InstructionPriority
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface AddInstructionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  actorId: string;
  actorRole: string;
  onAddInstruction: (req: AddInstructionRequest) => Promise<void>;
}

export const AddInstructionDialog: React.FC<AddInstructionDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  actorId,
  actorRole,
  onAddInstruction
}) => {
  const current = consultation.instructions;
  const [patientInst, setPatientInst] = useState(current?.patientInstruction ?? 'Maintain daily blood pressure journal');
  const [dietInst, setDietInst] = useState(current?.dietInstruction ?? 'Low sodium DASH diet (< 2,000 mg/day)');
  const [activityInst, setActivityInst] = useState(current?.activityInstruction ?? '30 minutes moderate walking 4-5 times weekly');
  const [warningInst, setWarningInst] = useState(current?.warningSignInstruction ?? 'Seek emergency care for severe chest pain or dyspnea');
  const [homeCareInst, setHomeCareInst] = useState(current?.homeCareInstruction ?? 'Ensure 7-8 hours sleep and adequate hydration');
  const [followUpInst, setFollowUpInst] = useState(current?.followUpInstruction ?? 'Return in 2 weeks for BP check and ECG review');
  const [priority, setPriority] = useState<InstructionPriority>(current?.instructionPriority ?? 'IMPORTANT');
  const [justification, setJustification] = useState('Documented comprehensive patient clinical instructions & lifestyle advice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddInstruction({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        patientInstruction: patientInst || undefined,
        dietInstruction: dietInst || undefined,
        activityInstruction: activityInst || undefined,
        warningSignInstruction: warningInst || undefined,
        homeCareInstruction: homeCareInst || undefined,
        followUpInstruction: followUpInst || undefined,
        instructionPriority: priority,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save instructions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`📋 Patient Instructions & Home Care: ${consultation.patientName} (${consultation.patientMrn})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Instructions'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Instruction Priority
          </label>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as InstructionPriority)}
            options={[
              { value: 'ROUTINE', label: 'Routine' },
              { value: 'IMPORTANT', label: 'Important' },
              { value: 'CRITICAL', label: 'Critical' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            General Patient Instructions
          </label>
          <Input value={patientInst} onChange={(e) => setPatientInst(e.target.value)} placeholder="General guidance" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Dietary Guidelines
          </label>
          <Input value={dietInst} onChange={(e) => setDietInst(e.target.value)} placeholder="Diet recommendations" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Physical Activity & Exercise
          </label>
          <Input value={activityInst} onChange={(e) => setActivityInst(e.target.value)} placeholder="Activity instructions" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Warning Signs / Red Flags ⚠️
          </label>
          <Input value={warningInst} onChange={(e) => setWarningInst(e.target.value)} placeholder="When to seek emergency help" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Home Care & Recovery
          </label>
          <Input value={homeCareInst} onChange={(e) => setHomeCareInst(e.target.value)} placeholder="Home care steps" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Follow-Up Guidance
          </label>
          <Input value={followUpInst} onChange={(e) => setFollowUpInst(e.target.value)} placeholder="Follow-up instructions" />
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
