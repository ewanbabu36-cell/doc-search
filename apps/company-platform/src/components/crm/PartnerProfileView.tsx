import React, { useState } from 'react';
import type {
  PartnerProfileDto,
  PartnerTransitionHistoryDto,
  PartnerLifecycleStatus
} from '@docsearch/api-contracts';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import { PartnerActivityTimeline } from './PartnerActivityTimeline.js';
import { PartnerLifecycleTransitionDialog } from './PartnerLifecycleTransitionDialog.js';

export interface PartnerProfileViewProps {
  partner: PartnerProfileDto;
  history: PartnerTransitionHistoryDto[];
  onBack: () => void;
  onTransitionStatus: (toStatus: PartnerLifecycleStatus, reason: string) => Promise<void>;
}

const lifecycleOrder: PartnerLifecycleStatus[] = [
  'LEAD',
  'PROSPECT',
  'ONBOARDING',
  'VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'OFFBOARDED'
];

export const PartnerProfileView: React.FC<PartnerProfileViewProps> = ({
  partner,
  history,
  onBack,
  onTransitionStatus
}) => {
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar with Back Action & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Partner Directory
          </Button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              {partner.tradeName}
            </h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
              Tenant ID: {partner.tenantSlug}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="neutral">Type: {partner.partnerType}</Badge>
          <Badge
            variant={
              partner.lifecycleStatus === 'ACTIVE'
                ? 'success'
                : partner.lifecycleStatus === 'SUSPENDED'
                ? 'danger'
                : 'primary'
            }
          >
            Status: {partner.lifecycleStatus}
          </Badge>
          <Button variant="primary" size="sm" onClick={() => setIsTransitionDialogOpen(true)}>
            Transition Lifecycle Stage
          </Button>
        </div>
      </div>

      {/* Lifecycle Stage Pipeline Bar */}
      <Card title="Partner Lifecycle Progression" padding="md">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            overflowX: 'auto',
            padding: '12px 0'
          }}
        >
          {lifecycleOrder.map((status, idx) => {
            const isCurrent = status === partner.lifecycleStatus;
            const isPassed = lifecycleOrder.indexOf(partner.lifecycleStatus) > idx;

            return (
              <div
                key={status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: '1 1 auto',
                  minWidth: '100px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent
                        ? 'var(--ds-color-primary)'
                        : isPassed
                        ? 'var(--ds-color-success)'
                        : 'var(--ds-color-surface-subtle)',
                      color: isCurrent || isPassed ? '#ffffff' : 'var(--ds-color-text-muted)',
                      border: `1px solid ${isCurrent || isPassed ? 'transparent' : 'var(--ds-color-border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: isCurrent ? '700' : '500',
                      color: isCurrent
                        ? 'var(--ds-color-primary)'
                        : isPassed
                        ? 'var(--ds-color-text-primary)'
                        : 'var(--ds-color-text-muted)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {status}
                  </span>
                </div>
                {idx < lifecycleOrder.length - 1 && (
                  <div
                    style={{
                      height: '2px',
                      flex: '1 1 20px',
                      backgroundColor: isPassed ? 'var(--ds-color-success)' : 'var(--ds-color-border-subtle)'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two Column Grid: Organization Info & Onboarding Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Organization Info */}
        <Card title="Organization & Legal Profile" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Legal Name:</span>
              <strong style={{ color: 'var(--ds-color-text-primary)' }}>{partner.legalName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Trade / Facility Name:</span>
              <span style={{ color: 'var(--ds-color-text-primary)' }}>{partner.tradeName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Tenant Domain Slug:</span>
              <span style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-secondary)' }}>
                {partner.tenantSlug}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Partner Classification:</span>
              <Badge variant="neutral">{partner.partnerType}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Verification Status:</span>
              <Badge variant={partner.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>
                {partner.verificationStatus}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Onboarding & Facility Scope */}
        <Card title="Onboarding Progress & Facility Scoping" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Current Step: {partner.onboardingStep}</span>
                <span style={{ fontWeight: '600', color: 'var(--ds-color-primary)' }}>
                  {partner.onboardingProgressPercent}% Complete
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: 'var(--ds-color-surface-subtle)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${partner.onboardingProgressPercent}%`,
                    height: '100%',
                    backgroundColor: 'var(--ds-color-primary)',
                    borderRadius: '4px',
                    transition: 'width 250ms ease'
                  }}
                />
              </div>
            </div>

            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--ds-color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Configured Branches:</span>
                <strong>{partner.branchCount} Facilities</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Scoped User Memberships:</span>
                <strong>{partner.userCount} Accounts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Data Isolation:</span>
                <Badge variant="success">Tenant & Branch Scoped</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Primary Contact & Administrative Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Contact Info */}
        <Card title="Primary Enterprise Contact" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Representative:</span>
              <strong>{partner.primaryContact.name}</strong>
            </div>
            {partner.primaryContact.roleTitle && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Title:</span>
                <span>{partner.primaryContact.roleTitle}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-color-text-muted)' }}>Email:</span>
              <a
                href={`mailto:${partner.primaryContact.email}`}
                style={{ color: 'var(--ds-color-primary)', textDecoration: 'none' }}
              >
                {partner.primaryContact.email}
              </a>
            </div>
            {partner.primaryContact.phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Phone:</span>
                <span>{partner.primaryContact.phone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Administrative Actions */}
        <Card title="Administrative Actions" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => setIsTransitionDialogOpen(true)}>
              Change Lifecycle Status
            </Button>
            <Button variant="subtle" size="sm" disabled>
              Manage Entitlements & Tiers 
            </Button>
            <Button variant="subtle" size="sm" disabled>
              Export Partner Security Audit Log
            </Button>
          </div>
        </Card>
      </div>

      {/* Partner Activity & Lifecycle Transition History */}
      <PartnerActivityTimeline history={history} />

      {/* Transition Dialog */}
      {isTransitionDialogOpen && (
        <PartnerLifecycleTransitionDialog
          isOpen={isTransitionDialogOpen}
          onClose={() => setIsTransitionDialogOpen(false)}
          partner={partner}
          onTransition={onTransitionStatus}
        />
      )}
    </div>
  );
};
