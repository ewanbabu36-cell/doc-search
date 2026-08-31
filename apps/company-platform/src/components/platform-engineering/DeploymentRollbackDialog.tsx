import React, { useState } from 'react';
import type { DeploymentDto } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Alert } from '@docsearch/ui-kit';

export interface DeploymentRollbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: DeploymentDto;
  onRollback: (deploymentId: string, rollbackArtifactRef: string, reason: string) => Promise<void>;
}

export const DeploymentRollbackDialog: React.FC<DeploymentRollbackDialogProps> = ({
  isOpen,
  onClose,
  deployment,
  onRollback
}) => {
  const [rollbackArtifactRef, setRollbackArtifactRef] = useState(deployment.artifactReference);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setError('A mandatory justification (at least 5 characters) explaining the emergency rollback is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onRollback(deployment.id, rollbackArtifactRef, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute rollback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Rollback Deployment: ${deployment.deploymentCode}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute Emergency Rollback
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="error" title="Emergency Rollback Action">
          Rolling back will immediately revert target workloads in <strong>{deployment.environmentName ?? deployment.environmentType}</strong> to the previous stable release artifact. This operation is recorded as a high-severity event in <code>core.audit_events</code>.
        </Alert>

        {error && <Alert type="error" title="Rollback Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Target Deployment
          </label>
          <Input value={deployment.deploymentCode} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Revert-to Artifact Reference *
          </label>
          <Input
            value={rollbackArtifactRef}
            onChange={(e) => setRollbackArtifactRef(e.target.value)}
            placeholder="e.g. art-oci-company-platform-1.0.0-stable"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Rollback Justification / Post-mortem Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Workload degradation observed in staging health checks"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
