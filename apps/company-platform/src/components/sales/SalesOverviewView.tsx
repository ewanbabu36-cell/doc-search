import React from 'react';
import type {
  LeadDto,
  OpportunityDto,
  CampaignDto,
  SalesTaskDto
} from '@docsearch/api-contracts';
import { Card, Badge, Alert } from '@docsearch/ui-kit';

export interface SalesOverviewViewProps {
  leads: LeadDto[];
  opportunities: OpportunityDto[];
  campaigns: CampaignDto[];
  tasks: SalesTaskDto[];
}

export const SalesOverviewView: React.FC<SalesOverviewViewProps> = ({
  leads,
  opportunities,
  campaigns,
  tasks
}) => {
  const activeOpportunities = opportunities.filter((o) => o.stage !== 'WON' && o.stage !== 'LOST');
  const openTasks = tasks.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert type="info" title="B2B Sales & Partner Expansion Pipeline">
        <strong>Live CRM sales telemetry not connected (Live Telemetry).</strong> Doc Search platform manages enterprise healthcare pipelines, opportunity milestones, and marketing initiatives without fabricated revenue or conversion BI.
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
            Active Leads & Prospects
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {leads.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="primary">Discovery & Qualification</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Open Enterprise Deals
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {activeOpportunities.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="success">Proposal & Negotiation</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Active Outreach Campaigns
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {activeCampaigns.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant="neutral">Target Segment Focus</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginBottom: '4px' }}>
            Pending Follow-Up Tasks
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
            {openTasks.length}
          </div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={openTasks.length > 0 ? 'warning' : 'neutral'}>Action Required</Badge>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Priority Follow-ups & Pipeline Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Urgent Tasks & Follow-ups */}
        <Card title="Immediate Sales Follow-ups" subtitle="Pending actionable tasks and partner commitments" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {openTasks.length === 0 ? (
              <div style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.875rem' }}>
                All sales follow-up tasks are completed.
              </div>
            ) : (
              openTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: 'var(--ds-color-surface-subtle)',
                    borderRadius: '6px',
                    border: '1px solid var(--ds-color-border-subtle)',
                    fontSize: '0.875rem'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--ds-color-text-primary)', display: 'block' }}>
                      {t.title}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                      Target: {t.relatedEntityName ?? 'Enterprise Account'} | Owner: {t.assignedUserEmail}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge variant={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'danger' : 'neutral'}>
                      Due: {new Date(t.dueDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Sales Pipeline Integrity */}
        <Card title="Enterprise Sales Governance" subtitle="Security compliance and data boundary controls" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Data Boundaries:</span>
              <Badge variant="success">B2B Organization Data Only (Zero PHI)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Financial Projections:</span>
              <Badge variant="neutral">Not Connected (Zero Fake Revenue)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Opportunity Auditing:</span>
              <Badge variant="success">Loss Justification Mandatory</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Partner Sync:</span>
              <Badge variant="success">Bound to CRM Partner Profiles</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
