import React, { useState } from 'react';
import type { SecuritySessionDto } from '@docsearch/api-contracts';
import { Dialog, Button, FormField, Badge, Alert } from '@docsearch/ui-kit';

export interface SessionTerminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: SecuritySessionDto;
  onTerminate: (sessionId: string, reason: string) => Promise<void>;
}

export const SessionTerminationDialog: React.FC<SessionTerminationDialogProps> = ({
  isOpen,
  onClose,
  session,
  onTerminate
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory security reason must be provided for privileged session termination.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTerminate(session.sessionId, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Privileged Session Termination"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Terminate Session
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="error" title="Forceful Session Invalidation">
          Terminating this session will immediately invalidate all active access tokens for user <strong>{session.userEmail}</strong> and block further API calls.
        </Alert>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>Session ID: </span>
            <code style={{ fontFamily: 'var(--ds-font-mono)' }}>{session.sessionId}</code>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>User: </span>
            <strong>{session.userEmail}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--ds-color-text-muted)' }}>Authentication Method: </span>
            <Badge variant="neutral">{session.authenticationMethod}</Badge>
          </div>
        </div>

        <FormField
          label="Termination Reason & Incident Reference"
          required
          helperText="State specific security justification, anomaly investigation ID, or administrative trigger."
        >
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Terminated due to suspicious geographic IP anomaly during active incident investigation."
            className="ds-interactive"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              color: 'var(--ds-color-text-primary)',
              backgroundColor: 'var(--ds-color-surface)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: '6px',
              resize: 'vertical'
            }}
          />
        </FormField>
      </form>
    </Dialog>
  );
};
