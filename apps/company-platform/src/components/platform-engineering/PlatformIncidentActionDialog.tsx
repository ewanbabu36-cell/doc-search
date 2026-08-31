import React, { useState } from 'react';
import type { PlatformIncidentDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface PlatformIncidentActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  incident: PlatformIncidentDto;
  mode: 'ACKNOWLEDGE' | 'RESOLVE';
  onAcknowledge: (incidentId: string, assignedToEmail: string, reason: string) => Promise<void>;
  onResolve: (incidentId: string, resolutionNotes: string, reason: string) => Promise<void>;
}

export const PlatformIncidentActionDialog: React.FC<PlatformIncidentActionDialogProps> = ({
  isOpen,
  onClose,
  incident,
  mode,
  onAcknowledge,
  onResolve
}) => {
  const [assignedToEmail, setAssignedToEmail] = useState('lead.devops@docsearch.internal');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification (at least 3 characters) is required.');
      return;
    }
    if (mode === 'RESOLVE' && (!resolutionNotes || resolutionNotes.trim().length < 5)) {
      setError('Detailed resolution notes (at least 5 characters) are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'ACKNOWLEDGE') {
        await onAcknowledge(incident.id, assignedToEmail, reason);
      } else {
        await onResolve(incident.id, resolutionNotes, reason);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`${mode === 'ACKNOWLEDGE' ? 'Acknowledge' : 'Resolve'} Incident: ${incident.incidentCode}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={mode === 'ACKNOWLEDGE' ? 'primary' : 'primary'}
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {mode === 'ACKNOWLEDGE' ? 'Acknowledge Incident' : 'Confirm Resolution'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert
          type={mode === 'ACKNOWLEDGE' ? 'warning' : 'success'}
          title={mode === 'ACKNOWLEDGE' ? 'Incident Triage & Assignment' : 'Incident Resolution Sign-off'}
        >
          {mode === 'ACKNOWLEDGE'
            ? 'Assign an engineer to investigate and begin remediation.'
            : 'Provide post-mortem resolution notes to mark this incident as resolved.'}
        </Alert>

        {error && <Alert type="error" title="Validation Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Incident Summary
          </label>
          <Input value={`${incident.title} (${incident.severity} / ${incident.category})`} readOnly disabled />
        </div>

        {mode === 'ACKNOWLEDGE' ? (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Assigned Lead Engineer *
            </label>
            <Input
              value={assignedToEmail}
              onChange={(e) => setAssignedToEmail(e.target.value)}
              placeholder="e.g. lead.devops@docsearch.internal"
              required
            />
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
              Resolution Notes / Corrective Actions *
            </label>
            <Input
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Adjusted pipeline concurrency and cleared Turborepo cache"
              required
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Routine triage and remediation following triage protocol"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
