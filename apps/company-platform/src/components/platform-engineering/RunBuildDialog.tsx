import React, { useState } from 'react';
import type { BuildPipelineDto, PlatformEnvironmentType } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface RunBuildDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pipeline: BuildPipelineDto;
  onExecuteBuild: (pipelineId: string, branch: string, commit: string, env: PlatformEnvironmentType, reason: string) => Promise<void>;
}

export const RunBuildDialog: React.FC<RunBuildDialogProps> = ({
  isOpen,
  onClose,
  pipeline,
  onExecuteBuild
}) => {
  const [branch, setBranch] = useState('main');
  const [commit, setCommit] = useState('7a9c8f2');
  const [env, setEnv] = useState<PlatformEnvironmentType>(pipeline.defaultEnvironment);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification (at least 3 characters) is required for audited build execution.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onExecuteBuild(pipeline.id, branch, commit, env, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger build run');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Trigger Build: ${pipeline.pipelineName}`}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute Build Run
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Pipeline Execution">
          Executing this build will trigger Turborepo orchestration across workspace targets and record an immutable entry in <code>core.audit_events</code>.
        </Alert>

        {error && <Alert type="error" title="Execution Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Pipeline Code
          </label>
          <Input value={pipeline.pipelineCode} readOnly disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Git Branch Reference *
          </label>
          <Input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="e.g. main or feat/monorepo-feature"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Commit SHA Reference *
          </label>
          <Input
            value={commit}
            onChange={(e) => setCommit(e.target.value)}
            placeholder="e.g. 7a9c8f2"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Target Environment *
          </label>
          <Select
            value={env}
            onChange={(e) => setEnv(e.target.value as PlatformEnvironmentType)}
            options={[
              { value: 'DEVELOPMENT', label: 'Development (Sandbox)' },
              { value: 'TEST', label: 'Test / Automated QA' },
              { value: 'STAGING', label: 'Staging (Pre-production)' },
              { value: 'PRODUCTION', label: 'Production (Restricted)' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification / Execution Reason *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Monorepo quality gate verification before staging release"
            required
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px', display: 'block' }}>
            Required for platform engineering audit logging
          </span>
        </div>
      </form>
    </Dialog>
  );
};
