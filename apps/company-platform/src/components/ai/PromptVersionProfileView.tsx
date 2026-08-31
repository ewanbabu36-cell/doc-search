import React, { useState } from 'react';
import type {
  AIPromptTemplateDto,
  AIPromptVersionDto,
  AIPromptApprovalStatus
} from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';
import { PromptApprovalDialog } from './PromptApprovalDialog.js';

export interface PromptVersionProfileViewProps {
  template: AIPromptTemplateDto;
  versions: AIPromptVersionDto[];
  onBack: () => void;
  onApproveVersion: (versionId: string, status: AIPromptApprovalStatus, reason: string) => Promise<void>;
}

export const PromptVersionProfileView: React.FC<PromptVersionProfileViewProps> = ({
  template,
  versions,
  onBack,
  onApproveVersion
}) => {
  const [selectedVersion, setSelectedVersion] = useState<AIPromptVersionDto | null>(null);

  const handleApprove = async (status: AIPromptApprovalStatus, reason: string) => {
    if (!selectedVersion) return;
    await onApproveVersion(selectedVersion.id, status, reason);
    setSelectedVersion(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Prompt Templates
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {template.code}
              </span>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {template.name}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Type: {template.promptType} | Current Version: v{template.currentVersion} | Owner: {template.ownerEmail}
            </span>
          </div>
        </div>

        <Badge variant={template.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? 'success' : 'neutral'}>
          {template.approvalStatus}
        </Badge>
      </div>

      <Alert type="info" title="Prompt Version Traceability">
        Every prompt iteration is version-locked and requires verified safety evaluation before approval for production inference pipelines.
      </Alert>

      {/* Version History List */}
      <Card title="Prompt Version History & Approval Audit" subtitle="Immutable versions and associated safety approvals" padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {versions.length === 0 ? (
            <div style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '16px' }}>
              No version history recorded.
            </div>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant="primary">v{v.version}</Badge>
                    <Badge variant={v.approvalStatus === 'APPROVED_FOR_PRODUCTION' ? 'success' : 'neutral'}>
                      {v.approvalStatus}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      Created: {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVersion(v)}
                    >
                      Evaluate / Approve
                    </Button>
                  </div>
                </div>

                <p style={{ margin: '0 0 8px 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                  <strong>Change Summary:</strong> {v.changeSummary}
                </p>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--ds-color-surface)',
                    border: '1px solid var(--ds-color-border)',
                    fontFamily: 'var(--ds-font-mono)',
                    fontSize: '0.8125rem',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {v.promptContent}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {selectedVersion && (
        <PromptApprovalDialog
          isOpen={Boolean(selectedVersion)}
          onClose={() => setSelectedVersion(null)}
          version={selectedVersion}
          onApprove={handleApprove}
        />
      )}
    </div>
  );
};
