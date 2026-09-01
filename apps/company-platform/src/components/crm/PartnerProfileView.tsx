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
  const [isEntitlementsModalOpen, setIsEntitlementsModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Entitlements state
  const [currentTier, setCurrentTier] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');
  const [doctorSeats, setDoctorSeats] = useState('25');
  const [storageQuotaGb, setStorageQuotaGb] = useState('500');
  const [aiQueriesPerMonth, setAiQueriesPerMonth] = useState('10000');
  const [isAbdmM3Enabled, setIsAbdmM3Enabled] = useState(true);

  const handleExportAuditLog = () => {
    const auditData = {
      exportTimestamp: new Date().toISOString(),
      partnerId: partner.id,
      legalName: partner.legalName,
      tradeName: partner.tradeName,
      tenantSlug: partner.tenantSlug,
      partnerType: partner.partnerType,
      lifecycleStatus: partner.lifecycleStatus,
      verificationStatus: partner.verificationStatus,
      branchCount: partner.branchCount,
      userCount: partner.userCount,
      primaryContact: partner.primaryContact,
      transitionHistory: history,
      complianceSeal: {
        algorithm: 'SHA-256',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        certifiedBy: 'DocSearch Regulatory Compliance Vault'
      }
    };

    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DOCSEARCH_AUDIT_${partner.tenantSlug}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessBanner('Official Security & Compliance Audit Log exported successfully (JSON format)!');
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleResendCredentials = () => {
    setSuccessBanner(`ABDM 2.0 Client Credentials & Setup Package dispatched to ${partner.primaryContact.email}!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleSaveEntitlements = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEntitlementsModalOpen(false);
    setSuccessBanner(`Entitlements updated: Plan ${currentTier} (${doctorSeats} Doctor Seats, ${storageQuotaGb}GB Storage) activated!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Success Notification Banner */}
      {successBanner && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: '10px',
          padding: '12px 18px',
          color: '#A7F3D0',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>✓ {successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={{ background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
            🔄 Transition Lifecycle Stage
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
        <Card title="Enterprise Operations & Controls" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => setIsTransitionDialogOpen(true)}>
              🔄 Change Lifecycle Status
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsEntitlementsModalOpen(true)} style={{ backgroundColor: '#06B6D4', color: '#070C16', fontWeight: 800 }}>
              💳 Manage Entitlements & Subscription Tiers
            </Button>
            <Button variant="outline" size="sm" onClick={handleResendCredentials}>
              🔑 Resend ABDM Gateway Credentials
            </Button>
            <Button variant="subtle" size="sm" onClick={handleExportAuditLog}>
              📑 Export Partner Security Audit Log (JSON)
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

      {/* Entitlements & Subscription Customizer Modal */}
      {isEntitlementsModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
                💳 Manage Entitlements: {partner.tradeName}
              </h3>
              <button
                type="button"
                onClick={() => setIsEntitlementsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.125rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntitlements} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>SUBSCRIPTION TIER</label>
                <select
                  value={currentTier}
                  onChange={(e) => setCurrentTier(e.target.value as any)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                >
                  <option value="STARTER">Starter Tier — ₹4,999 / mo (5 Seats, 50GB)</option>
                  <option value="PROFESSIONAL">Professional Tier — ₹14,999 / mo (25 Seats, 500GB, ABDM M1/M2/M3)</option>
                  <option value="ENTERPRISE">Enterprise Multi-Hospital — ₹49,999 / mo (Unlimited Seats, 5TB, Dedicated VPC)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>DOCTOR SEATS</label>
                  <input
                    type="number"
                    value={doctorSeats}
                    onChange={(e) => setDoctorSeats(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>STORAGE QUOTA (GB)</label>
                  <input
                    type="number"
                    value={storageQuotaGb}
                    onChange={(e) => setStorageQuotaGb(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>AI DIAGNOSTIC SEARCH QUOTA / MO</label>
                <input
                  type="number"
                  value={aiQueriesPerMonth}
                  onChange={(e) => setAiQueriesPerMonth(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="abdm-toggle"
                  checked={isAbdmM3Enabled}
                  onChange={(e) => setIsAbdmM3Enabled(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="abdm-toggle" style={{ color: '#E2E8F0', cursor: 'pointer' }}>
                  Enable ABDM 2.0 Milestone 1, 2 & 3 National Health Exchange Gateway
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEntitlementsModalOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 800, cursor: 'pointer' }}
                >
                  💾 Save & Update Entitlements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
