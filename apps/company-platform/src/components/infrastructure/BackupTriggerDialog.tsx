import React, { useState } from 'react';
import type { BackupPolicyDto, BackupType } from '@docsearch/api-contracts';
import { Dialog, Button, Input, Select, Alert } from '@docsearch/ui-kit';

export interface BackupTriggerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  policies: BackupPolicyDto[];
  onTriggerBackup: (policyId: string, resourceReference: string, backupType: BackupType, environment: string, reason: string) => Promise<void>;
}

export const BackupTriggerDialog: React.FC<BackupTriggerDialogProps> = ({
  isOpen,
  onClose,
  policies,
  onTriggerBackup
}) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.id ?? '');
  const [resourceRef, setResourceRef] = useState('db-pg-prod-primary');
  const [backupType, setBackupType] = useState<BackupType>('FULL');
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory business justification (at least 3 characters) is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onTriggerBackup(selectedPolicyId, resourceRef, backupType, environment, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger backup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Trigger Manual Database Backup"
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Execute Backup
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert type="info" title="Audited Backup Execution">
          Triggering an on-demand backup generates an encrypted snapshot stored in immutable WORM storage with cross-region sync to the disaster recovery cluster.
        </Alert>

        {error && <Alert type="error" title="Backup Error">{error}</Alert>}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Backup Policy *
          </label>
          <Select
            value={selectedPolicyId}
            onChange={(e) => setSelectedPolicyId(e.target.value)}
            options={policies.map((p) => ({
              value: p.id,
              label: `${p.policyName} (${p.retentionDays}d retention)`
            }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Resource Reference *
          </label>
          <Input
            value={resourceRef}
            onChange={(e) => setResourceRef(e.target.value)}
            placeholder="e.g. db-pg-prod-primary"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Backup Type *
          </label>
          <Select
            value={backupType}
            onChange={(e) => setBackupType(e.target.value as BackupType)}
            options={[
              { value: 'FULL', label: 'Full Database Snapshot' },
              { value: 'INCREMENTAL', label: 'Incremental WAL Delta' },
              { value: 'SNAPSHOT', label: 'Storage Volume Snapshot' },
              { value: 'ARCHIVE', label: 'Cold Glacier Archive' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Environment *
          </label>
          <Select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            options={[
              { value: 'PRODUCTION', label: 'Production' },
              { value: 'STAGING', label: 'Staging' },
              { value: 'DEVELOPMENT', label: 'Development' }
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
            Audit Justification *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Pre-migration snapshot before schema upgrade"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
