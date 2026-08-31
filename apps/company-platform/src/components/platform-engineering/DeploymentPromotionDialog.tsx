import React, { useState } from 'react';
import type { EnvironmentDto, DeploymentStrategy } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface DeploymentPromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  environments: EnvironmentDto[];
  onPromote: (targetEnvironmentId: string, artifactRef: string, commitRef: string, strategy: DeploymentStrategy, reason: string) => Promise<void>;
}

export const DeploymentPromotionDialog: React.FC<DeploymentPromotionDialogProps> = ({
  isOpen,
  onClose,
  environments,
  onPromote
}) => {
  const [targetEnvId, setTargetEnvId] = useState(environments[0]?.id ?? '');
  const [artifactRef, setArtifactRef] = useState('art-002-company-platform-dist');
  const [commitRef, setCommitRef] = useState('7a9c8f2');
  const [strategy, setStrategy] = useState<DeploymentStrategy>('ROLLING');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification (at least 3 characters) is required for deployment promotion.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onPromote(targetEnvId, artifactRef, commitRef, strategy, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote deployment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Promote Platform Deployment"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Promote Deployment
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="warning" title="Audited Environment Mutation">
          Promoting an artifact triggers container rollout in the target cluster. Production promotions require multi-region verification and audit trail logging.
        </Alert>

        {error && <Alert type="error" title="Promotion Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Target Environment *
          </label>
          <Select
            value={targetEnvId}
            onChange={(e) => setTargetEnvId(e.target.value)}
            options={environments.map((env) => ({
              value: env.id,
              label: `${env.environmentName} (${env.environmentType})`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Artifact Reference (OCI / Bundle) *
          </label>
          <Input
            value={artifactRef}
            onChange={(e) => setArtifactRef(e.target.value)}
            placeholder="e.g. art-002-company-platform-dist"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Commit SHA Reference *
          </label>
          <Input
            value={commitRef}
            onChange={(e) => setCommitRef(e.target.value)}
            placeholder="e.g. 7a9c8f2"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Deployment Strategy *
          </label>
          <Select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as DeploymentStrategy)}
            options={[
              { value: 'ROLLING', label: 'Rolling Update (Zero Downtime)' },
              { value: 'BLUE_GREEN', label: 'Blue / Green Deployment' },
              { value: 'CANARY', label: 'Canary Rollout (10% Traffic)' },
              { value: 'RECREATE', label: 'Recreate (Maintenance Window)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification / Deployment Purpose *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Staging release verification for Domain #13 Platform Engineering"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
