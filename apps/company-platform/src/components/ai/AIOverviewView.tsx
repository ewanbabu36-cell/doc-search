import React from 'react';
import type {
  AIModelDto,
  AIGovernancePolicyDto,
  AIPromptTemplateDto,
  AIUsageQuotaDto,
  AISafetyEventDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface AIOverviewViewProps {
  models: AIModelDto[];
  policies: AIGovernancePolicyDto[];
  promptTemplates: AIPromptTemplateDto[];
  quotas: AIUsageQuotaDto[];
  safetyEvents: AISafetyEventDto[];
}

export const AIOverviewView: React.FC<AIOverviewViewProps> = ({
  models,
  policies,
  promptTemplates,
  quotas,
  safetyEvents
}) => {
  const activeModels = models.filter((m) => m.lifecycleStatus === 'ACTIVE');
  const approvedPolicies = policies.filter((p) => p.status === 'APPROVED');
  const approvedPrompts = promptTemplates.filter(
    (p) => p.approvalStatus === 'APPROVED_FOR_PRODUCTION'
  );
  const openSafetyEvents = safetyEvents.filter(
    (s) => s.status === 'OPEN' || s.status === 'UNDER_REVIEW'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="warning" title="Clinical Safety Boundary Mandate">
        <strong>AI governance configuration does not constitute clinical approval or autonomous medical decision-making.</strong> All Doc Search models, prompts, and inference pipelines are strictly assistive and mandate human-in-the-loop clinical review.
      </Alert>

      <Alert type="info" title="Telemetry Pipeline Notice">
        Live AI token consumption and latency telemetry is not connected (<strong>Live Telemetry — Live Telemetry</strong>).
      </Alert>

      {/* 4 Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Registered AI Models
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {activeModels.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="primary">{models.length} Cataloged</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Governance Policies
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {approvedPolicies.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="success">Enforced at Gateway</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Approved Production Prompts
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {approvedPrompts.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">Version Controlled</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Safety Alerts
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {openSafetyEvents.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={openSafetyEvents.length > 0 ? 'danger' : 'success'}>
              {openSafetyEvents.length > 0 ? 'Requires Review' : 'All Clear'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Enforced Governance Policies & Safety Feed Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Active Governance Policies */}
        <Card title="Active AI Governance Policies" subtitle="Core safety boundaries and human oversight mandates" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {policies.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  border: '1px solid var(--ds-color-border-subtle)',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: 'var(--ds-color-text-primary)' }}>{p.name}</strong>
                  <Badge variant={p.status === 'APPROVED' ? 'success' : 'neutral'}>
                    {p.status}
                  </Badge>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-secondary)' }}>
                  {p.description}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                  Policy Type: {p.policyType} | Human Oversight: {p.humanOversightRequired ? 'Mandatory' : 'Automated'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Quotas & Safety Oversight */}
        <Card title="AI Quota & Boundary Enforcement" subtitle="Platform quota limits and governance safety gates" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Configured Quota Rules:</span>
              <strong>{quotas.length} Active Rules</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Autonomous Diagnosis Prevention:</span>
              <Badge variant="success">Active (Non-Bypassable)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Outbound PHI Sanitization:</span>
              <Badge variant="success">Cryptographic Token Masking</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Inference Audit Trail:</span>
              <Badge variant="success">100% Request Traceability</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
