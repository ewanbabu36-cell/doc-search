import React, { useState } from 'react';
import type { IntegrationIncidentDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface IncidentActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  incident: IntegrationIncidentDto;
  mode: 'ACKNOWLEDGE' | 'RESOLVE';
  onAcknowledge: (incidentId: string, assignedToEmail: string, reason: string) => Promise<void>;
  onResolve: (incidentId: string, resolutionNotes: string, reason: string) => Promise<void>;
}

export const IncidentActionDialog: React.FC<IncidentActionDialogProps> = ({
  isOpen,
  onClose,
  incident,
  mode,
  onAcknowledge,
  onResolve
}) => {
  const [assignedEmail, setAssignedEmail] = useState('integration.lead@docsearch.internal');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A governance rationale is mandatory for incident state transitions.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'ACKNOWLEDGE') {
        if (!assignedEmail.trim()) {
          setError('Assignee email is required.');
          setIsSubmitting(false);
          return;
        }
        await onAcknowledge(incident.id, assignedEmail.trim(), reason.trim());
      } else {
        if (!resolutionNotes.trim()) {
          setError('Resolution notes explaining corrective actions are required.');
          setIsSubmitting(false);
          return;
        }
        await onResolve(incident.id, resolutionNotes.trim(), reason.trim());
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incident action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'ACKNOWLEDGE' ? 'Acknowledge & Assign Incident' : 'Resolve Integration Incident'}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {mode === 'ACKNOWLEDGE' ? 'Acknowledge Incident' : 'Mark Resolved'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Incident: </span>
              <code>{incident.incidentCode}</code>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Title: </span>
              <strong>{incident.title}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Category & Severity: </span>
              <span>{incident.category} ({incident.severity})</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        {mode === 'ACKNOWLEDGE' ? (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Assign Incident To (Email)
            </label>
            <Input
              type="email"
              required
              value={assignedEmail}
              onChange={(e) => setAssignedEmail(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Resolution Notes & Corrective Actions
            </label>
            <Input
              required
              placeholder="e.g. Expanded token bucket quota on partner gateway and verified successful subsequent batch..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
            Governance Reason (Mandatory Audit)
          </label>
          <Input
            required
            placeholder="e.g. Incident triage per operational playbook INT-SOP-04..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </form>
    </Dialog>
  );
};
