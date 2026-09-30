import React, { useState, useEffect } from 'react';
import type { PartnerProfileDto } from '@docsearch/api-contracts';

export interface Partner360BigScreenModalProps {
  partner: PartnerProfileDto | null;
  onClose: () => void;
  onResetPassword: (partner: PartnerProfileDto) => void;
  onOpenStaff: (partner: PartnerProfileDto) => void;
  onOpenConfig: (partner: PartnerProfileDto) => void;
  onOpenRole: (partner: PartnerProfileDto) => void;
  onOpenSimulator: (partner: PartnerProfileDto) => void;
  onOpenLicense: (partner: PartnerProfileDto) => void;
  onOpenEdit: (partner: PartnerProfileDto) => void;
  onReviewKyc: (partner: PartnerProfileDto) => void;
  onDownloadWelcomeKit?: (partner: PartnerProfileDto) => void;
  onPrintSpeedPostDossier?: (partner: PartnerProfileDto) => void;
  onToggleStatus: (partner: PartnerProfileDto) => void;
  onDeletePartner: (partner: PartnerProfileDto) => void;
  onSelectPartner360Full?: (partnerId: string) => void;
}

export const Partner360BigScreenModal: React.FC<Partner360BigScreenModalProps> = ({
  partner,
  onClose,
  onResetPassword,
  onOpenStaff,
  onOpenConfig,
  onOpenRole,
  onOpenSimulator,
  onOpenLicense,
  onOpenEdit,
  onReviewKyc,
  onDownloadWelcomeKit,
  onPrintSpeedPostDossier,
  onToggleStatus,
  onDeletePartner,
  onSelectPartner360Full
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'commercials' | 'kyc' | 'staff' | 'audit'>('overview');
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!partner) return null;

  const meta = (partner.metadata as any) || {};
  const isKycPending = ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED'].includes(
    meta.kycStatus || partner.verificationStatus
  );
  const isActive = partner.lifecycleStatus === 'ACTIVE';

  const copyPartnerId = () => {
    navigator.clipboard.writeText(partner.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const getPartnerIcon = (type?: string) => {
    const t = (type || partner.partnerType || '').toLowerCase();
    if (t.includes('hospital')) return '🏥';
    if (t.includes('clinic')) return '🩺';
    if (t.includes('lab') || t.includes('patholog')) return '🔬';
    if (t.includes('pharm') || t.includes('chemist')) return '💊';
    if (t.includes('optical') || t.includes('eye')) return '👓';
    if (t.includes('dental')) return '🦷';
    return '🏢';
  };

  const cleanPhone = (partner.primaryContact?.phone || '').replace(/[^0-9]/g, '');
  const whatsAppUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=Hello%20${encodeURIComponent(partner.tradeName)},%20this%20is%20DocSearch%20HQ.`
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '96vw',
          maxWidth: '1440px',
          height: '92vh',
          backgroundColor: '#0A0F1D',
          border: '1.5px solid #1E293B',
          borderRadius: '16px',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInScale 0.18s ease-out'
        }}
      >
        {/* ================================================================ */}
        {/* 1. TOP HEADER STRIP                                             */}
        {/* ================================================================ */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0F172A',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Left: Facility Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                border: '1.5px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                flexShrink: 0
              }}
            >
              {getPartnerIcon(partner.partnerType)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                  {partner.tradeName}
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {partner.partnerType?.replace(/_/g, ' ')}
                </span>
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isActive ? '#34D399' : '#F87171',
                    border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}
                >
                  ● {partner.lifecycleStatus}
                </span>
                <span
                  style={{
                    backgroundColor: isKycPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isKycPending ? '#FBBF24' : '#34D399',
                    border: `1px solid ${isKycPending ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  KYC: {(meta.kycStatus || partner.verificationStatus || 'APPROVED').replace(/_/g, ' ')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{partner.legalName}</span>
                <span style={{ color: '#475569' }}>•</span>
                <span
                  onClick={copyPartnerId}
                  style={{
                    fontFamily: 'var(--ds-font-mono)',
                    fontSize: '0.75rem',
                    color: '#38BDF8',
                    cursor: 'pointer',
                    backgroundColor: '#1E293B',
                    padding: '1px 8px',
                    borderRadius: '4px',
                    border: '1px solid #334155'
                  }}
                  title="Click to copy Partner UUID"
                >
                  {copiedId ? '✓ Copied UUID' : `ID: ${partner.tenantSlug || partner.id.slice(0, 12)}`}
                </span>
                <span style={{ color: '#475569' }}>•</span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  📍 {meta.city || (partner as any).city || 'New Delhi'}, {meta.state || (partner as any).state || 'Delhi'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick External Links & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onSelectPartner360Full && (
              <button
                type="button"
                onClick={() => onSelectPartner360Full(partner.id)}
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Full Page View</span>
                <span>↗</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                color: '#CBD5E1',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Close (ESC)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 2. PROMINENT ACTION RIBBON (ALL ACTIONS AVAILABLE IN BIG SCREEN) */}
        {/* ================================================================ */}
        <div
          style={{
            backgroundColor: '#0B132B',
            borderBottom: '1px solid #1E293B',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginRight: '6px', flexShrink: 0 }}>
            ⚡ ACTIONS:
          </span>

          {/* Action 1: Reset Password */}
          <button
            type="button"
            onClick={() => onResetPassword(partner)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #F59E0B',
              color: '#FCD34D',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>🔑</span>
            <span>Reset Password</span>
          </button>

          {/* Action 2: Welcome Kit PDF */}
          {onDownloadWelcomeKit && (
            <button
              type="button"
              onClick={() => onDownloadWelcomeKit(partner)}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
            >
              <span>📥</span>
              <span>Download Welcome Kit</span>
            </button>
          )}

          {/* Action 3: Print Speed Post Dossier */}
          {onPrintSpeedPostDossier && (
            <button
              type="button"
              onClick={() => onPrintSpeedPostDossier(partner)}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #FB923C',
                color: '#FB923C',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
            >
              <span>📮</span>
              <span>Speed Post Dossier</span>
            </button>
          )}

          {/* Action 4: Blueprint & Capabilities */}
          <button
            type="button"
            onClick={() => onOpenConfig(partner)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#E2E8F0',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>⚙️</span>
            <span>Blueprint & Capabilities</span>
          </button>

          {/* Action 5: Role Policies */}
          <button
            type="button"
            onClick={() => onOpenRole(partner)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #8B5CF6',
              color: '#C084FC',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>🛡️</span>
            <span>Role Policies</span>
          </button>

          {/* Action 6: Staff Access Simulator */}
          <button
            type="button"
            onClick={() => onOpenSimulator(partner)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #10B981',
              color: '#34D399',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>🎯</span>
            <span>Access Simulator</span>
          </button>

          {/* Action 7: Staff Directory */}
          <button
            type="button"
            onClick={() => onOpenStaff(partner)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #06B6D4',
              color: '#22D3EE',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>👥</span>
            <span>Staff Directory</span>
          </button>

          {/* Action 8: HQ License Key */}
          <button
            type="button"
            onClick={() => onOpenLicense(partner)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #EAB308',
              color: '#FACC15',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>📜</span>
            <span>HQ License</span>
          </button>

          {/* Action 9: Edit Partner */}
          <button
            type="button"
            onClick={() => onOpenEdit(partner)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #64748B',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>✏️</span>
            <span>Edit Details</span>
          </button>

          {/* Action 10: Review KYC */}
          <button
            type="button"
            onClick={() => onReviewKyc(partner)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #F59E0B',
              color: '#FBBF24',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>🛡️</span>
            <span>Review KYC</span>
          </button>

          {/* Action 11: Suspend / Activate Toggle */}
          <button
            type="button"
            onClick={() => onToggleStatus(partner)}
            style={{
              backgroundColor: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${isActive ? '#EF4444' : '#10B981'}`,
              color: isActive ? '#FCA5A5' : '#6EE7B7',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span>{isActive ? '⏸️' : '⚡'}</span>
            <span>{isActive ? 'Suspend Account' : 'Activate Account'}</span>
          </button>

          {/* Action 12: Permanent Delete (Prominent Red Button) */}
          <button
            type="button"
            onClick={() => onDeletePartner(partner)}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              border: '1.5px solid #EF4444',
              color: '#FCA5A5',
              borderRadius: '8px',
              padding: '7px 16px',
              fontSize: '0.78rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              marginLeft: 'auto',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
            }}
          >
            <span>🗑️</span>
            <span>Permanently Delete</span>
          </button>
        </div>

        {/* ================================================================ */}
        {/* 3. NAVIGATION TABS                                              */}
        {/* ================================================================ */}
        <div
          style={{
            backgroundColor: '#0F172A',
            borderBottom: '1px solid #1E293B',
            padding: '0 24px',
            display: 'flex',
            gap: '8px'
          }}
        >
          {[
            { id: 'overview', label: '📊 Master Dossier & Facility Info' },
            { id: 'commercials', label: '💳 Commercials & Capabilities' },
            { id: 'kyc', label: '🛡️ Compliance & KYC Status' },
            { id: 'staff', label: '👥 Staff & Credentialing' },
            { id: 'audit', label: '📜 Audit Trail & Identifiers' }
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isTabActive ? '#38BDF8' : 'transparent'}`,
                  color: isTabActive ? '#38BDF8' : '#94A3B8',
                  padding: '12px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: isTabActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/* 4. TAB CONTENT BODY                                             */}
        {/* ================================================================ */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#0A0F1D'
          }}
        >
          {/* TAB 1: OVERVIEW & FACILITY INFO */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Card 1: Facility Profile */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8', marginTop: 0, marginBottom: '14px' }}>
                  🏢 Facility Identity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Trade Name:</span>
                    <strong style={{ color: '#F8FAFC' }}>{partner.tradeName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Legal Name:</span>
                    <span style={{ color: '#E2E8F0' }}>{partner.legalName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Partner Category:</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{partner.partnerType?.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Active Branches:</span>
                    <span style={{ color: '#F8FAFC' }}>{partner.branchCount || 1} Registered</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Tenant Slug:</span>
                    <code style={{ color: '#38BDF8', backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px' }}>
                      {partner.tenantSlug}
                    </code>
                  </div>
                </div>
              </div>

              {/* Card 2: Primary Contact & Direct Outreach */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981', marginTop: 0, marginBottom: '14px' }}>
                  👤 Primary Contact & Communications
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Contact Person:</span>
                    <strong style={{ color: '#F8FAFC' }}>{partner.primaryContact.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Email Address:</span>
                    <a href={`mailto:${partner.primaryContact.email}`} style={{ color: '#38BDF8', textDecoration: 'none' }}>
                      {partner.primaryContact.email}
                    </a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Phone / Mobile:</span>
                    <span style={{ color: '#F8FAFC' }}>{partner.primaryContact.phone || '—'}</span>
                  </div>

                  {whatsAppUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <span>💬</span>
                        <span>Open WhatsApp Chat</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Physical Address & Location */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F59E0B', marginTop: 0, marginBottom: '14px' }}>
                  📍 Physical Facility Location
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>City:</span>
                    <strong style={{ color: '#F8FAFC' }}>{meta.city || (partner as any).city || 'New Delhi'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>State / Region:</span>
                    <span style={{ color: '#F8FAFC' }}>{meta.state || (partner as any).state || 'Delhi'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Country:</span>
                    <span style={{ color: '#F8FAFC' }}>{meta.country || 'India'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Registration Source:</span>
                    <span style={{ color: '#38BDF8', fontWeight: 600 }}>
                      {(meta.registeredBy?.source || 'SELF_REGISTRATION_PORTAL').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMMERCIALS & CAPABILITIES */}
          {activeTab === 'commercials' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8', marginTop: 0, marginBottom: '14px' }}>
                  💳 Commercial Subscription Tier
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Current Plan Tier:</span>
                    <strong style={{ color: '#F8FAFC', fontSize: '1rem' }}>{meta.planTier || 'Standard Tier'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Monthly Fee:</span>
                    <span style={{ color: '#10B981', fontWeight: 700, fontSize: '1.1rem' }}>
                      ₹{meta.monthlyFee ? Number(meta.monthlyFee).toLocaleString() : '2,999'} / month
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Plan Expiry Date:</span>
                    <span style={{ color: '#CBD5E1' }}>{meta.planExpiryDate || 'Active (Auto-Renewing)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Billing Cycle:</span>
                    <span style={{ color: '#F8FAFC' }}>Monthly Recurring (Prepaid)</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#C084FC', marginTop: 0, marginBottom: '14px' }}>
                  ⚙️ Active Capabilities & Feature Modules
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    'Patient Teleconsultation',
                    'Digital OPD Queue',
                    'EHR & Prescription Generator',
                    'Staff RBAC Delegation',
                    'Diagnostic Lab Integration',
                    'E-Billing & Payment Gateway',
                    'Speed Post Dispatch Ledger'
                  ].map((feat, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: 'rgba(192, 132, 252, 0.12)',
                        border: '1px solid rgba(192, 132, 252, 0.3)',
                        color: '#E9D5FF',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenConfig(partner)}
                    style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #C084FC',
                      color: '#C084FC',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Configure Capabilities & Blueprints →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLIANCE & KYC */}
          {activeTab === 'kyc' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FBBF24', marginTop: 0, marginBottom: '14px' }}>
                  🛡️ KYC Audit & Verification Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>KYC Status:</span>
                    <span style={{ color: isKycPending ? '#FBBF24' : '#34D399', fontWeight: 800 }}>
                      {(meta.kycStatus || partner.verificationStatus || 'APPROVED').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Documents Verified:</span>
                    <span style={{ color: '#F8FAFC' }}>{meta.documentsCount ?? 2} Uploaded</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>KYC Completion:</span>
                    <span style={{ color: '#38BDF8', fontWeight: 700 }}>{meta.kycCompletionPercent ?? 100}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Assigned Reviewer:</span>
                    <span style={{ color: '#F8FAFC' }}>{meta.assignedReviewer?.name || 'Unassigned (Automated SLA)'}</span>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => onReviewKyc(partner)}
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid #F59E0B',
                        color: '#FCD34D',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Open Document Review Console ↗
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8', marginTop: 0, marginBottom: '14px' }}>
                  🔍 Duplicate & Risk Signals
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                  {meta.duplicateRisk?.hasRisk ? (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', padding: '12px', color: '#FCA5A5' }}>
                      <strong>⚠️ Duplicate Signals Detected:</strong>
                      <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                        {meta.duplicateRisk.signals?.map((sig: string, sIdx: number) => (
                          <li key={sIdx}>{sig}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', borderRadius: '8px', padding: '12px', color: '#6EE7B7' }}>
                      ✓ Zero duplicate risks detected. Primary email, facility name, and phone are unique.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STAFF & CREDENTIALING */}
          {activeTab === 'staff' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8', marginTop: 0, marginBottom: '14px' }}>
                  🔐 Portal Login & Access Credentials
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Login URL:</span>
                    <a
                      href={meta.credentials?.loginUrl || 'http://localhost:5174/login'}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#38BDF8', textDecoration: 'none' }}
                    >
                      {meta.credentials?.loginUrl || 'http://localhost:5174/login'} ↗
                    </a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Primary User ID:</span>
                    <code style={{ color: '#F8FAFC', backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px' }}>
                      {meta.credentials?.userId || partner.primaryContact.email}
                    </code>
                  </div>
                  {meta.credentials?.temporaryPassword && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94A3B8' }}>Temporary Password:</span>
                      <code style={{ color: '#34D399', backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px' }}>
                        {meta.credentials.temporaryPassword}
                      </code>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => onResetPassword(partner)}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #F59E0B',
                        color: '#FCD34D',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🔑 Reset Password
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenStaff(partner)}
                      style={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #06B6D4',
                        color: '#22D3EE',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      👥 View All Staff Members
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34D399', marginTop: 0, marginBottom: '14px' }}>
                  🎯 Governance & Role Simulation
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '0 0 14px 0' }}>
                  Test and verify exact permissions for doctors, nursing heads, lab technicians, and front desk operators under this partner.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenSimulator(partner)}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Open Access Simulator ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenRole(partner)}
                    style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      color: '#CBD5E1',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Manage Role Policies
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT & SYSTEM IDENTIFIERS */}
          {activeTab === 'audit' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8', marginTop: 0, marginBottom: '14px' }}>
                  📜 Timestamp & Lifecycle Trail
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Created At:</span>
                    <span style={{ color: '#F8FAFC' }}>
                      {partner.createdAt ? new Date(partner.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Last Updated:</span>
                    <span style={{ color: '#F8FAFC' }}>
                      {partner.updatedAt ? new Date(partner.updatedAt).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Registration Origin:</span>
                    <span style={{ color: '#38BDF8' }}>
                      {(meta.registeredBy?.source || 'COMPANY_ADMIN_ONBOARDING').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94A3B8', marginTop: 0, marginBottom: '14px' }}>
                  🔑 Internal System UUIDs
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94A3B8' }}>Partner UUID:</span>
                    <code style={{ color: '#38BDF8', backgroundColor: '#1E293B', padding: '2px 8px', borderRadius: '4px' }}>
                      {partner.id}
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94A3B8' }}>Tenant ID:</span>
                    <code style={{ color: '#F8FAFC', backgroundColor: '#1E293B', padding: '2px 8px', borderRadius: '4px' }}>
                      {partner.tenantId || partner.id}
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94A3B8' }}>Tenant Slug:</span>
                    <code style={{ color: '#34D399', backgroundColor: '#1E293B', padding: '2px 8px', borderRadius: '4px' }}>
                      {partner.tenantSlug}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
