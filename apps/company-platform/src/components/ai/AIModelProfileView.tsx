import React from 'react';
import type { AIModelDto } from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface AIModelProfileViewProps {
  model: AIModelDto;
  onBack: () => void;
}

export const AIModelProfileView: React.FC<AIModelProfileViewProps> = ({
  model,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Model Registry
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.875rem', fontWeight: '700' }}>
                {model.modelCode}
              </span>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
                {model.modelName}
              </h1>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Provider: {model.provider} | Family: {model.modelFamily} | Version: {model.version}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={model.lifecycleStatus === 'ACTIVE' ? 'success' : 'neutral'}>
            {model.lifecycleStatus}
          </Badge>
          <Badge variant={model.deploymentStatus === 'PRODUCTION' ? 'primary' : 'neutral'}>
            Deploy: {model.deploymentStatus}
          </Badge>
        </div>
      </div>

      <Alert type="warning" title="Clinical Governance Boundary">
        AI model registration in Doc Search does not confer autonomous clinical authority. All inference pipelines executing this model remain strictly assistive under human physician review.
      </Alert>

      {/* Two Column Grid: Model Metadata & Governance Boundaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Card title="Model Specifications & Architecture" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Capability Category:</span>
              <Badge variant="neutral">{model.capabilityClassification}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Risk Classification:</span>
              <Badge variant={model.riskClassification === 'HIGH_CLINICAL_CONTEXT' ? 'danger' : 'neutral'}>
                {model.riskClassification}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Context Window:</span>
              <span>{model.contextWindow.toLocaleString()} tokens</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Supported Modalities:</span>
              <span>{model.supportedModalities.join(', ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Release Date:</span>
              <span>{model.releaseDate ? new Date(model.releaseDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </Card>

        <Card title="Governance Eligibility & Safety Gates" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Production Ingestion Approved:</span>
              <Badge variant={model.approvedForProduction ? 'success' : 'neutral'}>
                {model.approvedForProduction ? 'Approved for Production' : 'Staging / Restricted'}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Clinical Context Eligibility:</span>
              <Badge variant={model.approvedForClinicalContext ? 'warning' : 'neutral'}>
                {model.approvedForClinicalContext ? 'Assistive Clinical Context (Governed)' : 'Administrative Only'}
              </Badge>
            </div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--ds-color-border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', display: 'block', marginBottom: '4px' }}>
                MODEL NARRATIVE:
              </span>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--ds-color-text-primary)' }}>
                {model.description}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
