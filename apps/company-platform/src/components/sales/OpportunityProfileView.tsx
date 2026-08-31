import React, { useState } from 'react';
import type { OpportunityDto, OpportunityStage } from '@docsearch/api-contracts';
import { Card, Button, Badge, Alert } from '@docsearch/ui-kit';
import { OpportunityTransitionDialog } from './OpportunityTransitionDialog.js';

export interface OpportunityProfileViewProps {
  opportunity: OpportunityDto;
  onBack: () => void;
  onTransitionStage: (toStage: OpportunityStage, reason: string) => Promise<void>;
}

export const OpportunityProfileView: React.FC<OpportunityProfileViewProps> = ({
  opportunity,
  onBack,
  onTransitionStage
}) => {
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Opportunities
          </Button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {opportunity.name}
            </h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Owner: {opportunity.assignedOwnerEmail}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={opportunity.priority === 'CRITICAL' || opportunity.priority === 'HIGH' ? 'danger' : 'neutral'}>
            Priority: {opportunity.priority}
          </Badge>
          <Badge
            variant={
              opportunity.stage === 'WON'
                ? 'success'
                : opportunity.stage === 'LOST'
                ? 'danger'
                : 'primary'
            }
          >
            Stage: {opportunity.stage}
          </Badge>
          <Button variant="primary" size="sm" onClick={() => setIsTransitionOpen(true)}>
            Advance Stage
          </Button>
        </div>
      </div>

      <Alert type="info" title="Zero Fabricated Monetary Values">
        <strong>Opportunity valuation decoupled from live financial data.</strong> Enterprise tier entitlements and branch scope metrics are tracked without fabricated commercial revenue totals.
      </Alert>

      {/* Two Column Grid: Opportunity Details & Target Entitlement Tier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Deal Parameters */}
        <Card title="Deal Governance & Milestones" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Associated Account:</span>
              <strong>{opportunity.partnerTradeName ?? 'Prospective Enterprise Lead'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Target Product:</span>
              <span>{opportunity.productName ?? 'Core Platform'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Target Plan Tier:</span>
              <strong style={{ color: 'var(--ds-color-primary)' }}>
                {opportunity.targetPlanName ?? 'Enterprise Hospital Network'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Expected Close Horizon:</span>
              <span>
                {opportunity.expectedCloseDate
                  ? new Date(opportunity.expectedCloseDate).toLocaleDateString()
                  : 'Undetermined'}
              </span>
            </div>
            {opportunity.lostReason && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-danger)' }}>Loss Justification:</span>
                <span style={{ color: 'var(--ds-color-danger)' }}>{opportunity.lostReason}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Next Actions & Milestones */}
        <Card title="Next Action & Strategy" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--ds-color-text-muted)', display: 'block', marginBottom: '4px' }}>
                Committed Next Action:
              </span>
              <p style={{ margin: 0, fontWeight: '500', color: 'var(--ds-color-text-primary)' }}>
                {opportunity.nextAction ?? 'Schedule executive proposal review meeting.'}
              </p>
            </div>
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--ds-color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>Commercial Valuation:</span>
              <div><Badge variant="neutral">Live billing not connected (Zero fake numbers)</Badge></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Transition Dialog */}
      {isTransitionOpen && (
        <OpportunityTransitionDialog
          isOpen={isTransitionOpen}
          onClose={() => setIsTransitionOpen(false)}
          opportunity={opportunity}
          onTransition={onTransitionStage}
        />
      )}
    </div>
  );
};
