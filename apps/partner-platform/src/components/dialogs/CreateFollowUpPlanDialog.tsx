import React, { useState } from 'react';
import type {
  ConsultationDto,
  CreateFollowUpPlanRequest
} from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface CreateFollowUpPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  actorId: string;
  actorRole: string;
  onCreateFollowUp: (req: CreateFollowUpPlanRequest) => Promise<void>;
}

export const CreateFollowUpPlanDialog: React.FC<CreateFollowUpPlanDialogProps> = ({
  isOpen,
  onClose,
  consultation,
  actorId,
  actorRole,
  onCreateFollowUp
}) => {
  const [followUpRequired, setFollowUpRequired] = useState(true);
  const [window, setWindow] = useState('AFTER_2_WEEKS');
  const [recommendedDate, setRecommendedDate] = useState('2026-09-12');
  const [reason, setReason] = useState('Review BP log, medication response, and repeat ECG');
  const [notes, setNotes] = useState('Patient to bring home BP readings logbook');
  const [justification, setJustification] = useState('Created structured clinical follow-up plan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Clinical reason for follow-up is required.');
      return;
    }
    if (!justification.trim()) {
      setError('Audit justification is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateFollowUp({
        tenantId: consultation.tenantId,
        consultationId: consultation.id,
        followUpRequired,
        recommendedDate: recommendedDate || undefined,
        recommendedWindow: window,
        reason: reason.trim(),
        notes: notes || undefined,
        actorId,
        actorRole,
        justification
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create follow-up plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`📅 Create Follow-Up Clinical Plan: ${consultation.patientName} (${consultation.patientMrn})`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Follow-Up Plan'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" title="Error">{error}</Alert>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="followUpCheck"
            checked={followUpRequired}
            onChange={(e) => setFollowUpRequired(e.target.checked)}
          />
          <label htmlFor="followUpCheck" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            Clinical Follow-Up Required
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Recommended Window
            </label>
            <Select
              value={window}
              onChange={(e) => setWindow(e.target.value)}
              options={[
                { value: 'AFTER_3_DAYS', label: 'In 3 Days' },
                { value: 'AFTER_1_WEEK', label: 'In 1 Week' },
                { value: 'AFTER_2_WEEKS', label: 'In 2 Weeks' },
                { value: 'AFTER_1_MONTH', label: 'In 1 Month' },
                { value: 'AFTER_3_MONTHS', label: 'In 3 Months' },
                { value: 'AFTER_6_MONTHS', label: 'In 6 Months' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              Target Date
            </label>
            <Input value={recommendedDate} onChange={(e) => setRecommendedDate(e.target.value)} type="date" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Clinical Reason *
          </label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for follow-up review" required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
            Preparation Notes
          </label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lab tests or records to bring" />
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
