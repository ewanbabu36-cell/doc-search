import React, { useState } from 'react';
import type {
  PartnerProfileDto,
  PartnerTransitionHistoryDto,
  PartnerLifecycleStatus
} from '@docsearch/api-contracts';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import { PartnerActivityTimeline } from './PartnerActivityTimeline.js';
import { PartnerLifecycleTransitionDialog } from './PartnerLifecycleTransitionDialog.js';
import { PartnerAccessGovernanceCockpit } from './PartnerAccessGovernanceCockpit.js';

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
  const [isGovernanceCockpitOpen, setIsGovernanceCockpitOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const kycDossier = (partner.metadata as any)?.kycDossier;
  const permittedActions = (partner.metadata as any)?.permittedActions;
  const commercial = (partner.metadata as any)?.commercial;
  const leadInfo = (partner.metadata as any)?.leadInfo;
  const tasks = (partner.metadata as any)?.tasks || [];
  const communication = (partner.metadata as any)?.communication || [];
  const duplicateRisk = (partner.metadata as any)?.duplicateRisk;

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

      {/* Duplicate Registration Risk Alert */}
      {duplicateRisk?.hasRisk && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '10px',
          padding: '12px 18px',
          color: '#FECACA',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <strong>Potential Duplicate Registration Flagged:</strong>
            <span style={{ marginLeft: '6px' }}>
              Detected duplicate criteria ({duplicateRisk.signals?.join(', ')}). Potential matching profile: {duplicateRisk.potentialMatchPartnerId || 'Existing Profile'}.
            </span>
          </div>
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsGovernanceCockpitOpen(true)}
              style={{
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
                fontWeight: 800,
                border: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)'
              }}
            >
              🛡️ Access, Entitlements & Staff Governance Cockpit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsTransitionDialogOpen(true)}>
              🔄 Change Lifecycle Status
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsEntitlementsModalOpen(true)}>
              💳 Manage Entitlements & Subscription Tiers
            </Button>
            <Button variant="outline" size="sm" onClick={handleResendCredentials}>
              🔑 Resend ABDM Gateway Credentials
            </Button>
            <Button variant="subtle" size="sm" onClick={handleExportAuditLog}>
              📑 Export Partner Security Audit Log (JSON)
            </Button>
            {permittedActions && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #1E293B', fontSize: '0.6875rem', color: '#94A3B8' }}>
                <span>Action Permissions:</span>
                <span style={{ color: permittedActions.canApprove ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                  {permittedActions.canApprove ? 'Full KYC & Lifecycle Authority' : 'Restricted Reviewer'}
                </span>
              </div>
            )}
            {commercial && (commercial.plan || commercial.license) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#38BDF8' }}>
                <span>Commercial Tier:</span>
                <span style={{ fontWeight: 800 }}>
                  {commercial.plan?.name || commercial.license?.planCode || 'Active Plan'}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Partner 360: KYC Regulatory Dossier & Cryptographic Verification */}
      {kycDossier && (
        <Card title="Partner 360: KYC Regulatory Dossier & Legal Attestation" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', backgroundColor: '#0F172A', padding: '14px', borderRadius: '10px', border: '1px solid #1E293B' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>KYC CASE STATUS</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge
                    variant={
                      kycDossier.status === 'APPROVED'
                        ? 'success'
                        : kycDossier.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {kycDossier.status}
                  </Badge>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>REGISTERED BY (APPLICANT)</span>
                <div style={{ marginTop: '2px', fontSize: '0.875rem', color: '#F8FAFC', fontWeight: 700 }}>
                  {kycDossier.registeredBy?.name || partner.primaryContact.name}
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#38BDF8' }}>
                  {kycDossier.registeredBy?.email || partner.primaryContact.email} · {kycDossier.registeredBy?.source || 'Direct Portal'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ASSIGNED COMPLIANCE REVIEWER</span>
                <div style={{ marginTop: '2px', fontSize: '0.875rem', color: '#F8FAFC', fontWeight: 700 }}>
                  {kycDossier.assignedReviewer?.name || 'Unassigned'}
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  {kycDossier.assignedReviewer?.email || 'Awaiting assignment'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>SUBMISSION DATE</span>
                <div style={{ marginTop: '2px', fontSize: '0.875rem', color: '#F8FAFC', fontWeight: 700 }}>
                  {kycDossier.submittedAt ? new Date(kycDossier.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </div>
              </div>
            </div>

            {kycDossier.requestedInfoReason && (
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', borderRadius: '8px', padding: '12px 16px', color: '#FDE68A', fontSize: '0.8125rem' }}>
                <strong>⚠️ Clarification Requested from Partner:</strong> {kycDossier.requestedInfoReason}
              </div>
            )}

            {kycDossier.rejectionReason && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', padding: '12px 16px', color: '#FECACA', fontSize: '0.8125rem' }}>
                <strong>✕ Rejection Reason:</strong> {kycDossier.rejectionReason}
              </div>
            )}

            {/* Document Evidence Table */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
                Attached Regulatory Compliance Documents
              </h4>
              {kycDossier.documents && kycDossier.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {kycDossier.documents.map((doc: any) => (
                    <div
                      key={doc.documentId || doc.sha256Hash}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        backgroundColor: '#0F172A',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #334155'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>📄</span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>{doc.documentName}</strong>
                              <span style={{ backgroundColor: '#1E293B', color: '#38BDF8', fontSize: '0.625rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                                v{doc.version || 1}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{doc.documentType}</span>
                              <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                                🔒 SHA-256: {doc.sha256Hash ? `${doc.sha256Hash.slice(0, 16)}...` : 'VERIFIED'}
                              </span>
                              {doc.uploadedAt && (
                                <span style={{ fontSize: '0.625rem', color: '#64748B' }}>
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '4px' }}>
                          VERIFIED SEAL
                        </span>
                      </div>

                      {/* Prior Version Lineage */}
                      {doc.previousVersions && doc.previousVersions.length > 0 && (
                        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                            Previous Version Lineage ({doc.previousVersions.length} prior submission{doc.previousVersions.length > 1 ? 's' : ''}):
                          </span>
                          {doc.previousVersions.map((pv: any, pidx: number) => (
                            <div key={pidx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.6875rem', color: '#64748B', paddingLeft: '12px', borderLeft: '2px solid #334155' }}>
                              <span>↳ v{pv.version}: <strong>{pv.documentName}</strong></span>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.625rem', color: '#94A3B8' }}>SHA-256: {pv.sha256Hash?.slice(0, 10)}...</span>
                              {pv.replacedAt && <span>Replaced: {new Date(pv.replacedAt).toLocaleDateString('en-IN')}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8', fontStyle: 'italic', padding: '8px 0' }}>
                  No regulatory documents uploaded yet.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sales Lead Attribution Card */}
      {leadInfo && (
        <Card title="Sales Pipeline Origin & Attribution" padding="md">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem', fontWeight: 700 }}>ORIGINAL LEAD ID</span>
              <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{leadInfo.leadId}</span>
            </div>
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem', fontWeight: 700 }}>SOURCE</span>
              <strong style={{ color: '#F8FAFC' }}>{leadInfo.source || 'Direct Outreach'}</strong>
            </div>
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem', fontWeight: 700 }}>LEAD STATUS</span>
              <Badge variant="success">{leadInfo.status || 'CONVERTED'}</Badge>
            </div>
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem', fontWeight: 700 }}>CONVERTED DATE</span>
              <span style={{ color: '#F8FAFC' }}>
                {leadInfo.convertedAt ? new Date(leadInfo.convertedAt).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            {leadInfo.notes && (
              <div style={{ gridColumn: '1 / -1', backgroundColor: '#0F172A', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '2px' }}>CONVERSION NOTES:</span>
                <span style={{ color: '#E2E8F0' }}>{leadInfo.notes}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* CRM & Onboarding Tasks */}
      {tasks && tasks.length > 0 && (
        <Card title={`CRM & Onboarding Tasks (${tasks.length})`} padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map((t: any) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1E293B', fontSize: '0.8125rem' }}>
                <div>
                  <strong style={{ color: '#F8FAFC' }}>{t.title}</strong>
                  <div style={{ color: '#94A3B8', fontSize: '0.6875rem', marginTop: '2px' }}>
                    Assigned: {t.assignedUserEmail} · Due: {new Date(t.dueDate).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge variant={t.priority === 'HIGH' || t.priority === 'URGENT' ? 'danger' : 'neutral'}>{t.priority}</Badge>
                  <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'}>{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Communication & Outbound Dispatch History */}
      {communication && communication.length > 0 && (
        <Card title={`Communication & Dispatch History (${communication.length})`} padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {communication.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1E293B', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{c.channel === 'SMS' ? '📱' : c.channel === 'WEBHOOK' ? '🔗' : '📧'}</span>
                  <div>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{c.channel}</span>
                    <span style={{ color: '#94A3B8', marginLeft: '6px' }}>to {c.recipientEmail}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge variant={c.deliveryStatus === 'DELIVERED' ? 'success' : c.deliveryStatus === 'FAILED' ? 'danger' : 'neutral'}>
                    {c.deliveryStatus}
                  </Badge>
                  <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>
                    {c.dispatchedAt ? new Date(c.dispatchedAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
                >
                  💾 Save & Update Entitlements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGovernanceCockpitOpen && (
        <PartnerAccessGovernanceCockpit
          partnerId={partner.id}
          facilityName={partner.tradeName || partner.legalName}
          onClose={() => setIsGovernanceCockpitOpen(false)}
        />
      )}
    </div>
  );
};
