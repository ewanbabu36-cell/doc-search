import React, { useState } from 'react';
import type { ApiVersionDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface ApiDeprecateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  apiVersion: ApiVersionDto;
  onDeprecate: (versionId: string, sunsetDate: string, migrationReference: string, reason: string) => Promise<void>;
}

export const ApiDeprecateDialog: React.FC<ApiDeprecateDialogProps> = ({
  isOpen,
  onClose,
  apiVersion,
  onDeprecate
}) => {
  const [sunsetDate, setSunsetDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [migrationReference, setMigrationReference] = useState('DOC-MIGRATE-V1-TO-V2');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sunsetDate || !migrationReference.trim() || !reason.trim()) {
      setError('All fields are required for initiating API deprecation schedule.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onDeprecate(
        apiVersion.id,
        new Date(sunsetDate).toISOString(),
        migrationReference.trim(),
        reason.trim()
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API Deprecation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate API Version Deprecation & Sunset Schedule"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Confirm Deprecation Schedule
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="API Lifecycle Deprecation">
          Marking an API version as DEPRECATED transmits deprecation headers (`Sunset`, `Deprecation`) on API Gateway responses and notifies registered healthcare partners.
        </Alert>

        <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--ds-color-surface-subtle)', border: '1px solid var(--ds-color-border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>API Name: </span>
              <strong>{apiVersion.apiName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Version: </span>
              <code>{apiVersion.version}</code>
            </div>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Validation Error">
            {error}
          </Alert>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Final Sunset Date
            </label>
            <Input
              type="date"
              required
              value={sunsetDate}
              onChange={(e) => setSunsetDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Migration Guide Reference
            </label>
            <Input
              required
              placeholder="e.g. DOC-MIGRATE-V1-TO-V2..."
              value={migrationReference}
              onChange={(e) => setMigrationReference(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
            Governance Reason (Mandatory Audit)
          </label>
          <Input
            required
            placeholder="e.g. Deprecation of legacy FHIR STU3 bridge in favor of US Core R4..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </form>
    </Dialog>
  );
};
