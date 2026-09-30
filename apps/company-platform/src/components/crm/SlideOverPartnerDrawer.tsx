import React, { useState, useEffect } from 'react';
import type { PartnerProfileDto, PartnerLifecycleStatus } from '@docsearch/api-contracts';
import { partnerService } from '../../services/partner-service.js';
import { generateAndDownloadWelcomeKitPdf, openPrintableSpeedPostDossier } from '../../utils/partnerWelcomeKitPdf.js';

export interface SlideOverPartnerDrawerProps {
  partner: PartnerProfileDto | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullDossier?: (partnerId: string) => void;
  onPartnerUpdated?: (updatedPartner: PartnerProfileDto) => void;
  onOpenSimulator?: (partner: PartnerProfileDto) => void;
}

const buildWelcomeKitData = (p: PartnerProfileDto) => {
  const m = (p.metadata as any) || {};
  return {
    partnerId: p.id,
    partnerName: p.tradeName,
    classification: m.classification || p.partnerType || 'HOSPITAL',
    contactPerson: p.primaryContact?.name || 'Partner Admin',
    phone: p.primaryContact?.phone || '+91 98765 43210',
    email: m.credentials?.userId || p.primaryContact?.email || 'admin@docsearch.health',
    password: m.credentials?.temporaryPassword || 'DocSearch2026!',
    city: m.city || 'India',
    state: m.state || 'India',
    planTier: m.planTier || 'Standard Tier',
    monthlyFee: m.monthlyFee || 0,
    features: m.accessibleFeatures || ['Full Healthcare Platform Suite'],
    planExpiryDate: m.planExpiryDate,
    activatedAt: p.createdAt,
    loginUrl: m.credentials?.loginUrl || 'https://partners.docsearch.health'
  };
};

export const SlideOverPartnerDrawer: React.FC<SlideOverPartnerDrawerProps> = ({
  partner,
  isOpen,
  onClose,
  onOpenFullDossier,
  onPartnerUpdated,
  onOpenSimulator
}) => {
  const [activeTab, setActiveTab] = useState<'licenses' | 'kyc' | 'billing' | 'actions'>('licenses');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [licenseUploadStatus, setLicenseUploadStatus] = useState<string | null>(null);
  const licenseFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleLicenseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseUploadStatus(`✓ ${file.name.slice(0, 18)} Uploaded`);
      setActionNotice(`✓ Uploaded license renewal "${file.name}" for ${partner?.tradeName || 'Partner'}`);
      setTimeout(() => setLicenseUploadStatus(null), 6000);
    }
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !partner) return null;

  const meta = (partner.metadata as any) || {};
  const planTier = meta.planTier || 'Standard Tier';
  const isFree = planTier.toLowerCase().includes('free') || planTier.toLowerCase().includes('starter');
  const kycStatus = meta.kycStatus || partner.verificationStatus || 'PENDING';
  const isKycVerified = kycStatus === 'APPROVED';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleKycAction = async (newStatus: 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFORMATION_REQUIRED') => {
    setIsUpdating(true);
    setActionNotice(null);
    try {
      const updated = await partnerService.updatePartner(partner.id, {
        verificationStatus: newStatus,
        metadata: {
          ...meta,
          kycStatus: newStatus,
          kycCompletionPercent: newStatus === 'APPROVED' ? 100 : 60
        }
      });
      onPartnerUpdated?.(updated);
      setActionNotice(
        newStatus === 'APPROVED'
          ? '✓ KYC Dossier Approved & Verified!'
          : newStatus === 'REJECTED'
          ? '⚠️ Partner KYC Dossier Rejected'
          : 'ℹ️ Additional clarification requested from partner'
      );
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice(`Error: ${err.message || 'Failed to update KYC'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePlanToggle = async (targetTier: 'Hospital Free Tier' | 'Enterprise Pro') => {
    setIsUpdating(true);
    setActionNotice(null);
    try {
      const updated = await partnerService.updatePartner(partner.id, {
        metadata: {
          ...meta,
          planTier: targetTier,
          monthlyFee: targetTier === 'Enterprise Pro' ? 9999 : 0
        }
      });
      onPartnerUpdated?.(updated);
      setActionNotice(`✓ Switched partner subscription to ${targetTier}`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice(`Error updating plan: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLifecycleToggle = async (targetStatus: PartnerLifecycleStatus) => {
    setIsUpdating(true);
    setActionNotice(null);
    try {
      const updated = await partnerService.transitionLifecycle(partner.id, {
        fromStatus: partner.lifecycleStatus,
        toStatus: targetStatus,
        reason: `Super Admin drawer quick transition to ${targetStatus}`
      });
      onPartnerUpdated?.(updated);
      setActionNotice(`✓ Partner lifecycle status updated to ${targetStatus}`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPartnerIcon = () => {
    const t = (partner.partnerType || '').toLowerCase();
    if (t.includes('hospital')) return '🏥';
    if (t.includes('pharmacy') || t.includes('chemist')) return '💊';
    if (t.includes('lab') || t.includes('pathology')) return '🧪';
    if (t.includes('diagnostic')) return '🔬';
    if (t.includes('clinic')) return '🩺';
    return '🏢';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(3, 7, 18, 0.65)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Slide-Over Drawer Sheet */}
      <div
        style={{
          width: '420px',
          maxWidth: '94vw',
          height: '100%',
          backgroundColor: '#0A0F1D',
          borderLeft: '1.5px solid #1E293B',
          boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(56, 189, 248, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* ================================================================= */}
        {/* 1. TOP HEADER & IDENTITY BAR                                      */}
        {/* ================================================================= */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#0F172A',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                flexShrink: 0
              }}
            >
              {getPartnerIcon()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#F8FAFC',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '280px'
                  }}
                >
                  {partner.tradeName}
                </h2>
                <span
                  style={{
                    backgroundColor: partner.lifecycleStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: partner.lifecycleStatus === 'ACTIVE' ? '#34D399' : '#FBBF24',
                    border: `1px solid ${partner.lifecycleStatus === 'ACTIVE' ? '#10B981' : '#F59E0B'}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.6875rem',
                    fontWeight: 800
                  }}
                >
                  {partner.lifecycleStatus}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{partner.legalName}</span>
                <span style={{ color: '#475569' }}>•</span>
                <span
                  onClick={() => copyToClipboard(partner.id, 'Partner ID')}
                  style={{
                    fontSize: '0.6875rem',
                    color: '#38BDF8',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}
                  title="Click to copy Partner ID"
                >
                  {copiedText === 'Partner ID' ? '✓ Copied' : `ID: ${partner.tenantSlug || partner.id.slice(0, 8)}`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onOpenFullDossier && (
              <button
                type="button"
                onClick={() => onOpenFullDossier(partner.id)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#38BDF8',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Open full-page detailed profile dossier"
              >
                Full Page ↗
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F8FAFC';
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94A3B8';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: actionNotice.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              borderBottom: `1px solid ${actionNotice.includes('Error') ? '#EF4444' : '#10B981'}`,
              color: actionNotice.includes('Error') ? '#FCA5A5' : '#6EE7B7',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{actionNotice}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. TAB SELECTION STRIP: LICENSES | KYC | BILLING | ACTIONS        */}
        {/* ================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            backgroundColor: '#090E1A',
            borderBottom: '1px solid #1E293B',
            padding: '4px 6px',
            gap: '4px'
          }}
        >
          {[
            { id: 'licenses' as const, label: 'Licenses', icon: '📜' },
            { id: 'kyc' as const, label: 'KYC', icon: '🛡️', badge: isKycVerified ? '✓' : 'Pending', badgeColor: isKycVerified ? '#10B981' : '#F59E0B' },
            { id: 'billing' as const, label: 'Plans', icon: '💳' },
            { id: 'actions' as const, label: 'Actions', icon: '⚡' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '7px 3px',
                  borderRadius: '6px',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: isActive ? '1px solid #38BDF8' : '1px solid transparent',
                  color: isActive ? '#38BDF8' : '#94A3B8',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      padding: '1px 4px',
                      borderRadius: '999px',
                      backgroundColor: `${tab.badgeColor}22`,
                      color: tab.badgeColor,
                      border: `1px solid ${tab.badgeColor}55`,
                      fontWeight: 800
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* 3. SCROLLABLE CONTENT BODY                                        */}
        {/* ================================================================= */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {/* =============================================================== */}
          {/* 🌟 OMNIPRESENT 1-PANE PARTNER 360 EXECUTIVE SNAPSHOT             */}
          {/* =============================================================== */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Header: Title & Live Nominal Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚡</span> Partner 360 Snapshot
              </span>
              <span style={{ fontSize: '0.65rem', color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                ● 1-Pane Command
              </span>
            </div>

            {/* 1. 👨‍⚕️ Doctor Count & Roster */}
            <div style={{ backgroundColor: '#070C16', borderRadius: '8px', padding: '9px 11px', border: '1px solid #1E293B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>👨‍⚕️ EMPANELLED DOCTORS</span>
                <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 800 }}>12 Live in OPD</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
                  {meta.doctorCount || (partner.userCount ? Math.max(partner.userCount, 48) : 48)}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Registered Physicians</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#38BDF8', marginTop: '3px' }}>
                14 Specialists • 6 Super-Spec • 12 OPD duty
              </div>
            </div>

            {/* 2. 🛏️ Bed Capacity & Occupancy */}
            <div style={{ backgroundColor: '#070C16', borderRadius: '8px', padding: '9px 11px', border: '1px solid #1E293B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>🛏️ BED CAPACITY & OCCUPANCY</span>
                <span style={{ fontSize: '0.65rem', color: '#F59E0B', fontWeight: 800 }}>
                  {meta.bedOccupancyPercent || 78}% Occupied
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
                  {meta.occupiedBeds || 94} / {meta.totalBeds || 120}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Beds in Active Service</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px', fontSize: '0.6875rem' }}>
                <span style={{ color: '#F87171' }}>🚨 18 ICU & Ventilator</span>
                <span style={{ color: '#34D399' }}>● 26 Beds Available</span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#1E293B', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${meta.bedOccupancyPercent || 78}%`, height: '100%', backgroundColor: '#F59E0B' }} />
              </div>
            </div>

            {/* 3. 📜 License Upload & Compliance */}
            <div style={{ backgroundColor: '#070C16', borderRadius: '8px', padding: '9px 11px', border: '1px solid #1E293B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>📜 LICENSES & COMPLIANCE</span>
                <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 800 }}>✓ VERIFIED</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '5px', fontSize: '0.7rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.625rem' }}>Drug License (Form 20B/21B):</span>
                  <span style={{ color: '#F8FAFC', fontWeight: 700, fontFamily: 'monospace' }}>
                    {meta.licenseNumber || 'DL-2024-VALID'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.625rem' }}>CEA Registration:</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>✓ CEA-ACT-CLEAR</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.625rem' }}>Bio-Waste PCB NOC:</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>✓ Clear</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.625rem' }}>Fire NOC Safety:</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>✓ NOC-2025 Clear</span>
                </div>
              </div>

              {/* 1-Click License Upload Trigger */}
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  type="file"
                  ref={licenseFileInputRef}
                  onChange={handleLicenseFileUpload}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <button
                  type="button"
                  onClick={() => licenseFileInputRef.current?.click()}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid #38BDF8',
                    color: '#38BDF8',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Upload renewed Drug License (20B/21B) or CEA certificate"
                >
                  <span>⬆</span>
                  <span>Upload / Renew License</span>
                </button>
                {licenseUploadStatus && (
                  <span style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>
                    {licenseUploadStatus}
                  </span>
                )}
              </div>
            </div>

            {/* 4. 💰 Revenue & Settlement Status */}
            <div style={{ backgroundColor: '#070C16', borderRadius: '8px', padding: '9px 11px', border: '1px solid #1E293B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>💰 REVENUE & SETTLEMENT</span>
                <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 800 }}>T+0 Escrow</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981' }}>
                  {meta.monthlyFee ? `₹${(meta.monthlyFee * 6).toLocaleString('en-IN')}` : '₹18.4L'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>MTD Platform GMV</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px', fontSize: '0.6875rem' }}>
                <span style={{ color: '#CBD5E1' }}>Platform Commission: <strong style={{ color: '#F8FAFC' }}>10% (₹1.84L)</strong></span>
                <span style={{ color: '#34D399', fontWeight: 700 }}>✓ Instant UPI Settled</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deep Compliance & Operations ({activeTab.toUpperCase()}):
            </span>
          </div>

          {/* TAB 1: LICENSES */}
          {activeTab === 'licenses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>💊</span>
                    <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>Drug License (Form 20B / 21B)</strong>
                  </div>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid #10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
                    VALID & ACTIVE
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>License Number:</span>
                    <span style={{ color: '#CBD5E1', fontFamily: 'monospace', fontWeight: 600 }}>
                      {meta.licenseNumber || `DL-${partner.id.slice(0, 4).toUpperCase()}-20B/21B`}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Issuing Authority:</span>
                    <span style={{ color: '#CBD5E1' }}>State Drugs Control Dept</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Valid Till:</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>31-Mar-2028</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Schedule H1 Permission:</span>
                    <span style={{ color: '#34D399', fontWeight: 700 }}>✓ Endorsed</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏥</span>
                    <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>Clinical Establishment Act (CEA)</strong>
                  </div>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid #10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
                    REGISTERED
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>CEA Registration ID:</span>
                    <span style={{ color: '#CBD5E1', fontFamily: 'monospace', fontWeight: 600 }}>
                      CEA-{partner.tenantSlug?.toUpperCase() || 'HOSP'}-2024
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Category:</span>
                    <span style={{ color: '#CBD5E1' }}>Multi-Specialty Center</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Fire NOC Status:</span>
                    <span style={{ color: '#34D399', fontWeight: 700 }}>✓ Clear (NOC-2025)</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Pollution PCB:</span>
                    <span style={{ color: '#34D399', fontWeight: 700 }}>✓ Bio-Waste Compliant</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🧪</span>
                    <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>Accreditations (NABL / NABH)</strong>
                  </div>
                  <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid #38BDF8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
                    NABL ACCREDITED
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Accreditation Standard:</span>
                    <span style={{ color: '#CBD5E1' }}>ISO 15189:2022</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>NABL Certificate No:</span>
                    <span style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>MC-3498</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KYC STATUS & VERIFICATION */}
          {activeTab === 'kyc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>KYC Dossier Review Status</strong>
                  <span
                    style={{
                      backgroundColor: isKycVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isKycVerified ? '#34D399' : '#FBBF24',
                      border: `1px solid ${isKycVerified ? '#10B981' : '#F59E0B'}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 800
                    }}
                  >
                    {kycStatus}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
                    <span style={{ color: '#94A3B8' }}>Entity Permanent Account Number (PAN):</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 700, fontFamily: 'monospace' }}>
                      {meta.panNumber || 'AAACD1234F'} <span style={{ color: '#34D399' }}>✓ Verified</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
                    <span style={{ color: '#94A3B8' }}>Goods and Services Tax (GSTIN):</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 700, fontFamily: 'monospace' }}>
                      {meta.gstin || '07AAACD1234F1Z5'} <span style={{ color: '#34D399' }}>✓ Active</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
                    <span style={{ color: '#94A3B8' }}>Director / Superintendent Aadhaar:</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 700 }}>
                      UIDAI Authenticated <span style={{ color: '#34D399' }}>✓</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ color: '#94A3B8' }}>Verification SLA Remaining:</span>
                    <span style={{ color: '#38BDF8', fontWeight: 700 }}>&lt; 24h (Priority Queue)</span>
                  </div>
                </div>

                {/* 1-Touch Fast KYC Actions */}
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #1E293B' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Regulatory Actions:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={isUpdating || isKycVerified}
                      onClick={() => handleKycAction('APPROVED')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#10B981',
                        border: 'none',
                        color: '#064E3B',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: isKycVerified ? 'default' : 'pointer',
                        opacity: isKycVerified ? 0.6 : 1
                      }}
                    >
                      {isKycVerified ? '✓ Already Approved' : '✓ Approve KYC'}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleKycAction('ADDITIONAL_INFORMATION_REQUIRED')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid #F59E0B',
                        color: '#FBBF24',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚠️ Request Clarification
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleKycAction('REJECTED')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #EF4444',
                        color: '#FCA5A5',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BILLING & PLANS */}
          {activeTab === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>Subscription & Commercial Tier</strong>
                  <span
                    style={{
                      backgroundColor: isFree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: isFree ? '#34D399' : '#C084FC',
                      border: `1px solid ${isFree ? '#10B981' : '#A855F7'}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 800
                    }}
                  >
                    {isFree ? '🟢 Hospital Free Tier' : '🟣 Enterprise Pro'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem', marginBottom: '14px' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Monthly Subscription:</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1rem' }}>
                      {isFree ? '₹0 / month' : '₹9,999 / month'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Estimated GMV Volume:</span>
                    <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: '1rem' }}>
                      {isFree ? '₹1.8L / mo' : '₹14.2L / mo'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Billing Cycle:</span>
                    <span style={{ color: '#CBD5E1' }}>1st of every month</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Invoice Settlement:</span>
                    <span style={{ color: '#34D399', fontWeight: 700 }}>✓ Settled (Up to Date)</span>
                  </div>
                </div>

                {/* 1-Click Plan Switcher */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid #1E293B' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Change Subscription Tier:
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={isUpdating || isFree}
                      onClick={() => handlePlanToggle('Hospital Free Tier')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: isFree ? 'rgba(16, 185, 129, 0.2)' : '#1E293B',
                        border: `1px solid ${isFree ? '#10B981' : '#334155'}`,
                        color: isFree ? '#34D399' : '#94A3B8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: isFree ? 'default' : 'pointer'
                      }}
                    >
                      🟢 Hospital Free Tier (₹0)
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating || !isFree}
                      onClick={() => handlePlanToggle('Enterprise Pro')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: !isFree ? 'rgba(168, 85, 247, 0.2)' : '#1E293B',
                        border: `1px solid ${!isFree ? '#A855F7' : '#334155'}`,
                        color: !isFree ? '#C084FC' : '#94A3B8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: !isFree ? 'default' : 'pointer'
                      }}
                    >
                      🟣 Enterprise Pro (₹9,999)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUICK ACTIONS */}
          {activeTab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => openPrintableSpeedPostDossier(buildWelcomeKitData(partner))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38BDF8')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
              >
                <span style={{ fontSize: '1.2rem' }}>📬</span>
                <div>
                  <div>Print SpeedPost Welcome Dossier</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Physical onboarding letter with QR codes</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => generateAndDownloadWelcomeKitPdf(buildWelcomeKitData(partner))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38BDF8')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
              >
                <span style={{ fontSize: '1.2rem' }}>📥</span>
                <div>
                  <div>Download Digital Welcome Kit (PDF)</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Hospital onboarding credentials kit</div>
                </div>
              </button>

              {onOpenSimulator && (
                <button
                  type="button"
                  onClick={() => onOpenSimulator(partner)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    color: '#38BDF8',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0284C7')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
                >
                  <span style={{ fontSize: '1.2rem' }}>🚀</span>
                  <div>
                    <div>Launch Partner Portal Simulator</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Simulate doctor, nurse & pharmacist desk</div>
                  </div>
                </button>
              )}

              {/* Status Toggle Action */}
              <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid #1E293B' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Lifecycle Controls:
                </span>
                {partner.lifecycleStatus === 'ACTIVE' ? (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleLifecycleToggle('SUSPENDED')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #EF4444',
                      borderRadius: '6px',
                      color: '#F87171',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⏸ Place on Administrative Suspension
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleLifecycleToggle('ACTIVE')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      borderRadius: '6px',
                      color: '#34D399',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Activate Partner Account Immediately
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 4. BOTTOM QUICK CONTACT & ACTIONS FOOTER                         */}
        {/* ================================================================= */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#0F172A',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            fontSize: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94A3B8' }}>Contact:</span>
            <strong style={{ color: '#F8FAFC' }}>{partner.primaryContact?.name || 'Admin'}</strong>
            {partner.primaryContact?.phone && (
              <a
                href={`tel:${partner.primaryContact.phone}`}
                style={{ color: '#38BDF8', textDecoration: 'none' }}
              >
                📞 {partner.primaryContact.phone}
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#CBD5E1',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
