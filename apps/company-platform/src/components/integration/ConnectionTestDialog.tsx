import React, { useState } from 'react';
import type { IntegrationConnectionDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface ConnectionTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  connection: IntegrationConnectionDto;
  onTest: (connectionId: string, reason: string) => Promise<{ status: string; latencyMs: number; message: string }>;
}

export const ConnectionTestDialog: React.FC<ConnectionTestDialogProps> = ({
  isOpen,
  onClose,
  connection,
  onTest
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; latencyMs: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A governance reason is mandatory for initiating connectivity handshakes.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await onTest(connection.id, reason.trim());
      setTestResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connectivity probe failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Test Integration Connection Probe"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            {testResult ? 'Close' : 'Cancel'}
          </Button>
          {!testResult && (
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Run Probe Handshake
            </Button>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Development Connectivity Simulation">
          Probe handshakes verify protocol readiness, TLS certificate validation, and sandbox ping responsiveness. In development mode, probe simulates gateway loopback.
        </Alert>

        <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Connection: </span>
              <strong>{connection.connectionCode}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Provider: </span>
              <span>{connection.providerName}</span>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Partner Scope: </span>
              <span>{connection.partnerName ?? 'Global Platform Scope'}</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Probe Error">
            {error}
          </Alert>
        )}

        {testResult && (
          <Alert type="success" title="Handshake Succeeded">
            <strong>Status: {testResult.status}</strong> ({testResult.latencyMs}ms latency)
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem' }}>{testResult.message}</p>
          </Alert>
        )}

        {!testResult && (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Governance Reason (Mandatory Audit)
            </label>
            <Input
              required
              placeholder="e.g. Periodic connectivity verification prior to scheduled batch sync..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
      </form>
    </Dialog>
  );
};
