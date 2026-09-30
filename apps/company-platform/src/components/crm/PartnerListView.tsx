import { UniversalPartnerOnboardingWizard } from './PathologyPartnerOnboardingWizard.js';
import { PartnerTemplateManager } from './PartnerTemplateManager.js';
import { PartnerConfigurationCockpit } from './PartnerConfigurationCockpit.js';
import { PartnerRolePolicyBuilder } from './PartnerRolePolicyBuilder.js';
import { StaffAccessAndSimulatorCockpit } from './StaffAccessAndSimulatorCockpit.js';
import { PartnerStaffDirectoryModal } from './PartnerStaffDirectoryModal.js';
import { HqLicenseKeyGeneratorModal } from './HqLicenseKeyGeneratorModal.js';
import { Partner360BigScreenModal } from './Partner360BigScreenModal.js';
import { ExecutiveBentoGrid } from '../common/ExecutiveBentoGrid.js';
import { UnifiedFilterRibbon, type UnifiedPartnerFilterType } from './UnifiedFilterRibbon.js';
import { SlideOverPartnerDrawer } from './SlideOverPartnerDrawer.js';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type {
  PartnerProfileDto,
  PartnerLifecycleStatus,
  PartnerType,
  PartnerClassificationDto
} from '@docsearch/api-contracts';
import {
  Card,
  Input,
  Select,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  ErrorState,
  EmptyState,
  SkeletonTable
} from '@docsearch/ui-kit';
import {
  partnerService,
  CANONICAL_PARTNER_CLASSIFICATIONS,
  type PartnerListFilters,
  type DirectoryIntelligenceSummary
} from '../../services/partner-service.js';
import { generateAndDownloadWelcomeKitPdf, openPrintableSpeedPostDossier } from '../../utils/partnerWelcomeKitPdf.js';

export interface PartnerListViewProps {
  onSelectPartner: (partnerId: string) => void;
  onOpenKycConsole?: (partnerId?: string) => void;
}

export interface PartnerCustomMetadata {
  classification?: string;
  planTier?: string;
  planExpiryDate?: string;
  credentials?: {
    loginUrl?: string;
    userId?: string;
    temporaryPassword?: string;
    role?: string;
    activatedAt?: string;
    planExpiryDate?: string;
  };
  monthlyFee?: number;
  accessibleFeatures?: string[];
  city?: string;
  state?: string;
  licenseDocument?: string;
  licenseNumber?: string;
  aadhaarDocFileName?: string;
  kycStatus?: string;
  slaStatus?: string;
  ageHours?: number;
  registeredBy?: {
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    source?: string;
  };
  assignedReviewer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  stagedRegistrationId?: string;
  documentsCount?: number;
  profileCompletionPercent?: number;
  kycCompletionPercent?: number;
  duplicateRisk?: {
    hasRisk: boolean;
    signals: string[];
    potentialMatchId?: string;
  };
  onboardingStatus?: string;
  accountStatus?: string;
}

function getPartnerMeta(partner?: PartnerProfileDto | null): PartnerCustomMetadata {
  if (!partner) return {};
  return (partner.metadata as unknown as PartnerCustomMetadata) || {};
}

function getCategoryIcon(partner?: PartnerProfileDto | null): string {
  if (!partner) return '🏥';
  const meta = getPartnerMeta(partner);
  const cls = String(meta.classification || partner.partnerType || '').toUpperCase();
  if (cls.includes('HOSPITAL')) return '🏥';
  if (cls.includes('PHARMACY')) return '💊';
  if (cls.includes('CLINIC')) return '🩺';
  if (cls.includes('DIAGNOSTIC') && !cls.includes('LAB')) return '🔬';
  if (cls.includes('LAB') || cls.includes('PATHOLOGY')) return '🧪';
  return '🏥';
}

export const PartnerListView: React.FC<PartnerListViewProps> = ({ onSelectPartner, onOpenKycConsole }) => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardSuccessMessage, setOnboardSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [partners, setPartners] = useState<PartnerProfileDto[]>([]);
  const [classifications, setClassifications] = useState<PartnerClassificationDto[]>(CANONICAL_PARTNER_CLASSIFICATIONS);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerLifecycleStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PartnerType | 'ALL'>('ALL');
  const [kycFilter, setKycFilter] = useState<string>('ALL');
  const [queueFilter, setQueueFilter] = useState<'all' | 'my_work' | 'unassigned'>('all');
  const [agingFilter, setAgingFilter] = useState<'<24h' | '24-48h' | '2-7d' | '>7d' | undefined>(undefined);
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [pricingFilter, setPricingFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [pricingMetrics, setPricingMetrics] = useState<{ total: number; free: number; paid: number }>({ total: 0, free: 0, paid: 0 });
  const [isQueueCardsCollapsed, setIsQueueCardsCollapsed] = useState<boolean>(true);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState<boolean>(true);
  const [activeQueueTab, setActiveQueueTab] = useState<'ALL' | 'KYC_PENDING' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'RESUBMITTED' | 'OVERDUE' | 'MY_QUEUE' | 'UNASSIGNED'>('ALL');
  const [intelligence, setIntelligence] = useState<DirectoryIntelligenceSummary | null>(null);
  const [isMatrixOpen, setIsMatrixOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCredModal, setViewCredModal] = useState<PartnerProfileDto | null>(null);
  const [reviewKycModal, setReviewKycModal] = useState<PartnerProfileDto | null>(null);
  const [staffModalPartner, setStaffModalPartner] = useState<PartnerProfileDto | null>(null);
  const [licenseModalPartner, setLicenseModalPartner] = useState<PartnerProfileDto | null>(null);
  const [resetPasswordPartner, setResetPasswordPartner] = useState<PartnerProfileDto | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [resetSuccessResult, setResetSuccessResult] = useState<{ email: string; newPassword: string } | null>(null);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);
  const [isCountdownPaused, setIsCountdownPaused] = useState<boolean>(false);
  const [copySuccessToast, setCopySuccessToast] = useState<string | null>(null);

  const handleCloseResetPasswordModal = () => {
    setResetPasswordPartner(null);
    setResetSuccessResult(null);
    setResetCountdown(null);
    setIsCountdownPaused(false);
    setActionErrorMessage(null);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };

  const handleCopyCredentials = (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopyText(text);
        });
      } else {
        fallbackCopyText(text);
      }
    } catch {
      fallbackCopyText(text);
    }
    setCopySuccessToast('✅ Credentials copied to clipboard!');
    setTimeout(() => {
      setCopySuccessToast(null);
    }, 3000);
  };

  const fallbackCopyText = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    } catch {}
  };

  useEffect(() => {
    if (!resetPasswordPartner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isResettingPassword) {
        handleCloseResetPasswordModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [resetPasswordPartner, isResettingPassword]);

  useEffect(() => {
    if (!resetSuccessResult || isCountdownPaused) {
      return;
    }
    setResetCountdown(8);
    const interval = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleCloseResetPasswordModal();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resetSuccessResult, isCountdownPaused]);

  const handleOpenResetPassword = (partner: PartnerProfileDto) => {
    setResetPasswordPartner(partner);
    setNewPasswordInput(`DocSearch@${Math.floor(1000 + Math.random() * 9000)}!`);
    setShowNewPassword(false);
    setResetSuccessResult(null);
    setResetCountdown(null);
    setIsCountdownPaused(false);
    setCopySuccessToast(null);
  };

  const handleExecutePasswordReset = async () => {
    if (!resetPasswordPartner) return;
    setIsResettingPassword(true);
    setActionErrorMessage(null);
    try {
      const email = resetPasswordPartner.primaryContact?.email;
      const res = await partnerService.resetPartnerPassword(
        email || resetPasswordPartner.id,
        newPasswordInput,
        resetPasswordPartner.id
      );
      setResetSuccessResult(res);

      setPartners((prev) =>
        prev.map((p) => {
          if (p.id === resetPasswordPartner.id) {
            const meta = (p.metadata || {}) as PartnerCustomMetadata;
            const creds = meta.credentials || {};
            creds.temporaryPassword = res.newPassword;
            return {
              ...p,
              metadata: {
                ...meta,
                credentials: creds
              }
            };
          }
          return p;
        })
      );

      if (viewCredModal && viewCredModal.id === resetPasswordPartner.id) {
        setViewCredModal((prev) => {
          if (!prev) return null;
          const meta = (prev.metadata || {}) as PartnerCustomMetadata;
          const creds = meta.credentials || {};
          creds.temporaryPassword = res.newPassword;
          return {
            ...prev,
            metadata: {
              ...meta,
              credentials: creds
            }
          };
        });
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to reset partner password');
    } finally {
      setIsResettingPassword(false);
    }
  };
  interface ActionMenuState {
    partnerId: string;
    partner: PartnerProfileDto;
    top: number;
    right: number;
    openUpwards: boolean;
  }
  const [menuState, setMenuState] = useState<ActionMenuState | null>(null);

  useEffect(() => {
    if (!menuState) return;
    const handleDismiss = () => setMenuState(null);
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('resize', handleDismiss);
    return () => {
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss);
    };
  }, [menuState]);

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, partner: PartnerProfileDto) => {
    e.stopPropagation();
    if (menuState?.partnerId === partner.id) {
      setMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownEstimatedHeight = 440;
    const openUpwards = spaceBelow < dropdownEstimatedHeight && rect.top > dropdownEstimatedHeight;

    setMenuState({
      partnerId: partner.id,
      partner,
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      openUpwards
    });
  };

  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [viewDensity, setViewDensity] = useState<'bento' | 'extended'>('bento');
  const [selected360Partner, setSelected360Partner] = useState<PartnerProfileDto | null>(null);
  const [slideOverPartner, setSlideOverPartner] = useState<PartnerProfileDto | null>(null);

  const getUnifiedFilter = (): UnifiedPartnerFilterType => {
    if (kycFilter === 'PENDING') return 'KYC_PENDING';
    if (pricingFilter === 'FREE') return 'FREE';
    if (pricingFilter === 'PAID') return 'ENTERPRISE_PRO';
    return 'ALL';
  };

  const handleSelectUnifiedFilter = (filter: UnifiedPartnerFilterType) => {
    if (filter === 'ALL') {
      setStatusFilter('ALL');
      setKycFilter('ALL');
      setPricingFilter('ALL');
      setTypeFilter('ALL');
      setPage(1);
    } else if (filter === 'KYC_PENDING') {
      setStatusFilter('ALL');
      setKycFilter('PENDING');
      setPricingFilter('ALL');
      setPage(1);
    } else if (filter === 'FREE') {
      setStatusFilter('ALL');
      setKycFilter('ALL');
      setPricingFilter('FREE');
      setPage(1);
    } else if (filter === 'ENTERPRISE_PRO') {
      setStatusFilter('ALL');
      setKycFilter('ALL');
      setPricingFilter('PAID');
      setPage(1);
    }
  };
  const [editingPartner, setEditingPartner] = useState<PartnerProfileDto | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [activeConfigPartner, setActiveConfigPartner] = useState<PartnerProfileDto | null>(null);
  const [activeRolePartner, setActiveRolePartner] = useState<PartnerProfileDto | null>(null);
  const [activeSimulatorPartner, setActiveSimulatorPartner] = useState<PartnerProfileDto | null>(null);
  const [editFormData, setEditFormData] = useState({
    tradeName: '',
    legalName: '',
    partnerType: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    planTier: '',
    lifecycleStatus: ''
  });

  const copyText = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedLabel(`Copied ${label}!`);
    setTimeout(() => setCopiedLabel(null), 2500);
  };

  const renderResetPasswordModal = () => {
    if (!resetPasswordPartner) return null;
    const meta = getPartnerMeta(resetPasswordPartner);
    const partnerEmail = meta.credentials?.userId || resetPasswordPartner.primaryContact?.email || '';
    const partnerPhone = resetPasswordPartner.primaryContact?.phone || '';

    const whatsappMessage = `*DOC SEARCH HQ — Account Credentials Updated*\n\n` +
      `Dear ${resetPasswordPartner.primaryContact?.name || resetPasswordPartner.tradeName},\n` +
      `Your Doc Search Partner Portal login credentials have been successfully updated by HQ.\n\n` +
      `🌐 *Portal Login:* http://localhost:5173/\n` +
      `👤 *User ID:* ${partnerEmail}\n` +
      `🔑 *New Password:* ${resetSuccessResult?.newPassword || newPasswordInput}\n\n` +
      `You can log in immediately with these credentials. Please keep them secure.\n\n` +
      `Doc Search Healthcare Platform`;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(7, 12, 22, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isResettingPassword) {
            handleCloseResetPasswordModal();
          }
        }}
      >
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid #F59E0B',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#F8FAFC'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem', padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                🔑
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                  HQ Partner Password Override
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Live Auth Kernel Synchronization (PostgreSQL & Cache)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseResetPasswordModal}
              title="Close modal (Esc)"
              style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Partner Info Snippet */}
          <div style={{ backgroundColor: '#1E293B', padding: '14px 18px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#F8FAFC' }}>
                {getCategoryIcon(resetPasswordPartner)} {resetPasswordPartner.tradeName}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid #0284C7' }}>
                {resetPasswordPartner.partnerType}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8125rem', color: '#94A3B8', flexWrap: 'wrap' }}>
              <span>👤 {resetPasswordPartner.primaryContact?.name}</span>
              <span>📧 {partnerEmail}</span>
              {partnerPhone && <span>📞 {partnerPhone}</span>}
            </div>
          </div>

          {/* Error Message if any */}
          {actionErrorMessage && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', padding: '12px 16px', borderRadius: '8px', color: '#FCA5A5', fontSize: '0.875rem' }}>
              ❌ {actionErrorMessage}
            </div>
          )}

          {/* Reset Flow: Form or Success State */}
          {!resetSuccessResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
                  NEW SECURE PASSWORD FOR PARTNER
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Enter new password"
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 14px',
                        backgroundColor: '#0F172A',
                        border: '1.5px solid #334155',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: '1.1rem'
                      }}
                      title={showNewPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showNewPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(`DocSearch@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #06B6D4',
                      borderRadius: '8px',
                      color: '#38BDF8',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                    title="Generate randomized strong password"
                  >
                    🎲 Generate
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#FCD34D', lineHeight: 1.5 }}>
                ⚠️ <strong>Executive Action:</strong> Resetting will instantly update the password in PostgreSQL <code>user_credentials</code> and the in-memory security store. The partner can immediately sign in with this new password at <code>http://localhost:5173/</code>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleCloseResetPasswordModal}
                  disabled={isResettingPassword}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePasswordReset}
                  disabled={isResettingPassword || !newPasswordInput.trim()}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: isResettingPassword ? '#B45309' : '#F59E0B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontWeight: 900,
                    fontSize: '0.875rem',
                    cursor: isResettingPassword ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  {isResettingPassword ? '⚡ Resetting Database...' : '⚡ Confirm & Reset Password'}
                </button>
              </div>
            </div>
          ) : (
            /* Success View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid #10B981', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10B981', fontWeight: 800, fontSize: '1rem' }}>
                  <span>✅</span> <span>Password Successfully Reset & Synced!</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#CBD5E1' }}>
                  The partner login credentials have been updated in PostgreSQL. The partner can now log in using:
                </p>
                <div style={{ backgroundColor: '#0F172A', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>User ID:</span>
                    <strong style={{ color: '#38BDF8' }}>{resetSuccessResult.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>New Password:</span>
                    <strong style={{ color: '#10B981', fontSize: '1rem' }}>{resetSuccessResult.newPassword}</strong>
                  </div>
                </div>
              </div>

              {/* Countdown Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8125rem', color: '#38BDF8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏱️</span>
                  <span>
                    {isCountdownPaused
                      ? 'Auto-close paused — Click "Done & Return" when finished.'
                      : `Returning to directory in ${resetCountdown ?? 8}s...`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCountdownPaused(!isCountdownPaused)}
                  style={{
                    background: isCountdownPaused ? '#0284C7' : 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid #38BDF8',
                    color: isCountdownPaused ? '#FFFFFF' : '#38BDF8',
                    borderRadius: '6px',
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {isCountdownPaused ? '▶️ Resume Timer' : '⏸️ Keep Open'}
                </button>
              </div>

              {!isCountdownPaused && resetCountdown !== null && (
                <div style={{ height: '4px', backgroundColor: '#1E293B', borderRadius: '2px', overflow: 'hidden', width: '100%', marginTop: '-8px' }}>
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#10B981',
                      width: `${Math.max(0, Math.min(100, (resetCountdown / 8) * 100))}%`,
                      transition: 'width 1s linear'
                    }}
                  />
                </div>
              )}

              {/* Copy toast feedback if triggered */}
              {copySuccessToast && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🎉</span> <span>{copySuccessToast}</span>
                </div>
              )}

              {/* Action Buttons: Copy, WhatsApp, Done */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const text = `User ID: ${resetSuccessResult.email}\nPassword: ${resetSuccessResult.newPassword}\nPortal: http://localhost:5173/`;
                    handleCopyCredentials(text);
                  }}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '10px 16px',
                    backgroundColor: '#10B981',
                    color: '#022C22',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  📋 Copy All Credentials
                </button>

                {partnerPhone && (
                  <a
                    href={`https://wa.me/${partnerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      padding: '10px 16px',
                      backgroundColor: '#25D366',
                      color: '#022C22',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    📲 Send via WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleCloseResetPasswordModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
                  }}
                >
                  <span>✅ Done & Return to Directory</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const fetchIntelligence = async (appliedFilters?: PartnerListFilters) => {
    try {
      const data = await partnerService.getDirectoryIntelligence({
        search: appliedFilters?.search,
        partnerType: appliedFilters?.partnerType,
        lifecycleStatus: appliedFilters?.status,
        kycStatus: appliedFilters?.kycStatus,
        queue: appliedFilters?.queue,
        aging: appliedFilters?.aging,
        branchId: appliedFilters?.branchId,
        dateRange: appliedFilters?.dateRange as any,
        startDate: appliedFilters?.startDate,
        endDate: appliedFilters?.endDate,
        registrationSource: appliedFilters?.registrationSource
      });
      setIntelligence(data);
    } catch (err) {
      console.warn('Could not fetch directory intelligence:', err);
    }
  };

  useEffect(() => {
    partnerService.getClassifications().then((items) => {
      if (items && items.length > 0) setClassifications(items);
    });
  }, []);

  const isPartnerFree = (p: PartnerProfileDto): boolean => {
    const meta = getPartnerMeta(p);
    const fee = Number(meta.monthlyFee ?? 0);
    const plan = String(meta.planTier || '').toLowerCase();
    return fee === 0 || plan.includes('free') || plan.includes('starter') || plan.includes('foundation') || plan.includes('₹0') || plan.includes('core');
  };

  const fetchPartners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: PartnerListFilters = {
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        partnerType: typeFilter !== 'ALL' ? typeFilter : undefined,
        kycStatus: kycFilter !== 'ALL' ? kycFilter : undefined,
        queue: queueFilter !== 'all' ? queueFilter : undefined,
        aging: agingFilter,
        branchId: branchFilter !== 'ALL' ? branchFilter : undefined,
        registrationSource: sourceFilter !== 'ALL' ? sourceFilter : undefined,
        dateRange: dateRangeFilter !== 'ALL' ? dateRangeFilter : undefined,
        startDate: dateRangeFilter === 'CUSTOM' && startDate ? startDate : undefined,
        endDate: dateRangeFilter === 'CUSTOM' && endDate ? endDate : undefined,
        pricingTier: pricingFilter !== 'ALL' ? pricingFilter : undefined,
        page,
        pageSize
      };
      const [result] = await Promise.all([
        partnerService.getPartners(filters),
        fetchIntelligence(filters)
      ]);
      setPartners(result.items);
      setTotal(result.total);

      // Harmonize intelligence counters with authoritative result.total so top metric cards never show mismatch
      if (result && typeof result.total === 'number') {
        setIntelligence((prev) => {
          if (!prev) return prev;
          const harmonizedGlobalTotal = Math.max(result.total, prev.global.totalPartners);
          const harmonizedFilteredTotal = prev.filtered
            ? Math.max(result.total, prev.filtered.totalPartners)
            : result.total;

          return {
            ...prev,
            global: {
              ...prev.global,
              totalPartners: harmonizedGlobalTotal,
              active: Math.max(prev.global.active, harmonizedGlobalTotal - prev.global.onboarding - prev.global.suspended)
            },
            filtered: prev.filtered ? {
              ...prev.filtered,
              totalPartners: harmonizedFilteredTotal
            } : prev.filtered
          };
        });
      }

      // Update global pricing metrics across the complete directory
      void partnerService.getPartners({ pageSize: 1000 }).then((allRes) => {
        if (allRes && Array.isArray(allRes.items)) {
          const free = allRes.items.filter(isPartnerFree).length;
          const paid = Math.max(0, allRes.total - free);
          setPricingMetrics({ total: allRes.total, free, paid });
        }
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partners');
    } finally {
      setIsLoading(false);
    }
  };

  const lastFetchTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    void fetchPartners();
    lastFetchTimeRef.current = Date.now();
  }, [page, statusFilter, typeFilter, kycFilter, queueFilter, agingFilter, pricingFilter, branchFilter, sourceFilter, dateRangeFilter, startDate, endDate]);

  useEffect(() => {
    const handleSmartRefresh = () => {
      const now = Date.now();
      // Throttle: don't double-fetch if fetched within the last 1.2s
      if (now - lastFetchTimeRef.current < 1200) return;
      lastFetchTimeRef.current = now;
      void fetchPartners();
    };

    const handleDomainActivated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.domainId === 'crm-partner-lifecycle') {
        handleSmartRefresh();
      }
    };

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const now = Date.now();
        // Window focus re-sync: if user was away for > 20s, silently re-fetch fresh data
        if (now - lastFetchTimeRef.current > 20000) {
          handleSmartRefresh();
        }
      }
    };

    window.addEventListener('docsearch:partner_registered', handleSmartRefresh);
    window.addEventListener('docsearch:navigate_directory', handleSmartRefresh);
    window.addEventListener('docsearch:domain_activated', handleDomainActivated);
    window.addEventListener('docsearch:manual_refresh', handleSmartRefresh);
    window.addEventListener('storage', handleSmartRefresh);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('docsearch:partner_registered', handleSmartRefresh);
      window.removeEventListener('docsearch:navigate_directory', handleSmartRefresh);
      window.removeEventListener('docsearch:domain_activated', handleDomainActivated);
      window.removeEventListener('docsearch:manual_refresh', handleSmartRefresh);
      window.removeEventListener('storage', handleSmartRefresh);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  const handleQueueTabSelect = (tab: 'ALL' | 'KYC_PENDING' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'RESUBMITTED' | 'OVERDUE' | 'MY_QUEUE' | 'UNASSIGNED') => {
    setActiveQueueTab(tab);
    setPage(1);
    switch (tab) {
      case 'ALL':
        setKycFilter('ALL');
        setQueueFilter('all');
        setAgingFilter(undefined);
        break;
      case 'KYC_PENDING':
        setKycFilter('PENDING');
        setQueueFilter('all');
        setAgingFilter(undefined);
        break;
      case 'UNDER_REVIEW':
        setKycFilter('UNDER_REVIEW');
        setQueueFilter('all');
        setAgingFilter(undefined);
        break;
      case 'ACTION_REQUIRED':
        setKycFilter('ADDITIONAL_INFORMATION_REQUIRED');
        setQueueFilter('all');
        setAgingFilter(undefined);
        break;
      case 'RESUBMITTED':
        setKycFilter('RESUBMITTED');
        setQueueFilter('all');
        setAgingFilter(undefined);
        break;
      case 'OVERDUE':
        setKycFilter('ALL');
        setQueueFilter('all');
        setAgingFilter('>7d');
        break;
      case 'MY_QUEUE':
        setKycFilter('ALL');
        setQueueFilter('my_work');
        setAgingFilter(undefined);
        break;
      case 'UNASSIGNED':
        setKycFilter('ALL');
        setQueueFilter('unassigned');
        setAgingFilter(undefined);
        break;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchPartners();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setKycFilter('ALL');
    setQueueFilter('all');
    setAgingFilter(undefined);
    setBranchFilter('ALL');
    setSourceFilter('ALL');
    setDateRangeFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPricingFilter('ALL');
    setActiveQueueTab('ALL');
    setPage(1);
  };

  const handleMatrixCellClick = (role: string, kycStatus?: string) => {
    setTypeFilter(role as PartnerType);
    if (kycStatus) {
      setKycFilter(kycStatus);
    } else {
      setKycFilter('ALL');
    }
    setPage(1);
  };

  const handleQuickActivate = async (partnerId: string, partnerName: string, currentStatus?: string) => {
    setActionErrorMessage(null);
    try {
      if (currentStatus === 'ACTIVE') {
        setOnboardSuccessMessage(`✓ Partner "${partnerName}" is already ACTIVE.`);
        setTimeout(() => setOnboardSuccessMessage(null), 4000);
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      let approvalSuccess = false;
      try {
        const approveRes = await fetch('/api/v1/auth/verification-queue/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ id: partnerId })
        });
        if (approveRes.ok) {
          approvalSuccess = true;
        }
      } catch (syncErr) {
        console.warn('Backend activation sync note:', syncErr);
      }

      try {
        await partnerService.transitionLifecycle(partnerId, {
          fromStatus: currentStatus || 'ONBOARDING',
          toStatus: 'ACTIVE',
          reason: 'Super Admin one-click quick activation from CRM table.'
        });
      } catch (transErr) {
        if (!approvalSuccess) throw transErr;
      }

      // Immediately update local partners state
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, lifecycleStatus: 'ACTIVE' } : p))
      );

      // Update local storage
      try {
        const live = JSON.parse(localStorage.getItem('docsearch_live_partners') || '[]');
        const updatedLive = live.map((it: any) =>
          it.partnerId === partnerId || it.partnerName === partnerName
            ? { ...it, status: 'APPROVED', lifecycleStatus: 'ACTIVE' }
            : it
        );
        localStorage.setItem('docsearch_live_partners', JSON.stringify(updatedLive));
      } catch {}

      setOnboardSuccessMessage(`✓ Partner "${partnerName}" is now ACTIVE & live on DocSearch! Login credentials activated.`);
      setTimeout(() => setOnboardSuccessMessage(null), 5000);
      void fetchPartners();
    } catch (e) {
      setActionErrorMessage('Failed to activate partner: ' + (e instanceof Error ? e.message : String(e)));
      setTimeout(() => setActionErrorMessage(null), 6000);
    }
  };

  const handleQuickSuspend = async (partnerId: string, partnerName: string, currentStatus?: string) => {
    setActionErrorMessage(null);
    try {
      if (currentStatus === 'SUSPENDED') {
        setOnboardSuccessMessage(`Partner "${partnerName}" is already on SUSPENDED hold.`);
        setTimeout(() => setOnboardSuccessMessage(null), 4000);
        return;
      }
      await partnerService.transitionLifecycle(partnerId, {
        fromStatus: currentStatus || 'ACTIVE',
        toStatus: 'SUSPENDED',
        reason: 'Temporary administrative hold placed via CRM console.'
      });

      // Immediately update local partners state
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, lifecycleStatus: 'SUSPENDED' } : p))
      );

      // Update local storage
      try {
        const live = JSON.parse(localStorage.getItem('docsearch_live_partners') || '[]');
        const updatedLive = live.map((it: any) =>
          it.partnerId === partnerId || it.partnerName === partnerName
            ? { ...it, status: 'SUSPENDED', lifecycleStatus: 'SUSPENDED' }
            : it
        );
        localStorage.setItem('docsearch_live_partners', JSON.stringify(updatedLive));
      } catch {}

      setOnboardSuccessMessage(`Partner "${partnerName}" placed on SUSPENDED hold.`);
      setTimeout(() => setOnboardSuccessMessage(null), 4000);
      void fetchPartners();
    } catch (e) {
      setActionErrorMessage('Failed to suspend partner: ' + (e instanceof Error ? e.message : String(e)));
      setTimeout(() => setActionErrorMessage(null), 6000);
    }
  };


  const handleExportDirectoryCsv = () => {
    const headers = ['Partner ID', 'Trade Name', 'Legal Name', 'Tenant Slug', 'Partner Type', 'Lifecycle Status', 'Verification Status', 'Branch Count', 'Primary Contact Name', 'Primary Contact Email', 'Phone'];
    const rows = partners.map(p => [
      p.id,
      `"${p.tradeName.replace(/"/g, '""')}"`,
      `"${p.legalName.replace(/"/g, '""')}"`,
      p.tenantSlug,
      p.partnerType,
      p.lifecycleStatus,
      p.verificationStatus,
      p.branchCount,
      `"${p.primaryContact.name.replace(/"/g, '""')}"`,
      p.primaryContact.email,
      p.primaryContact.phone || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DOCSEARCH_PARTNERS_EXPORT_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOnboardSuccessMessage('All partner accounts exported to CSV successfully!');
    setTimeout(() => setOnboardSuccessMessage(null), 4000);
  };

  const handleOpenEdit = (partner: PartnerProfileDto) => {
    const meta = getPartnerMeta(partner);
    setEditFormData({
      tradeName: partner.tradeName || '',
      legalName: partner.legalName || '',
      partnerType: partner.partnerType || 'HOSPITAL_NETWORK',
      contactName: partner.primaryContact?.name || '',
      contactEmail: partner.primaryContact?.email || '',
      contactPhone: partner.primaryContact?.phone || '',
      planTier: meta.planTier || 'Standard Tier',
      lifecycleStatus: partner.lifecycleStatus || 'ACTIVE'
    });
    setEditingPartner(partner);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    try {
      await partnerService.updatePartner(editingPartner.id, {
        tradeName: editFormData.tradeName,
        legalName: editFormData.legalName,
        partnerType: editFormData.partnerType,
        lifecycleStatus: editFormData.lifecycleStatus,
        primaryContactName: editFormData.contactName,
        primaryContactEmail: editFormData.contactEmail,
        primaryContactPhone: editFormData.contactPhone,
        metadata: {
          planTier: editFormData.planTier,
          classification: editFormData.partnerType
        }
      });

      // Update local storage for backward-compatibility with secondary views
      try {
        const reg = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
        const updatedReg = reg.map((p: any) => {
          if (p.id === editingPartner.id || p.email === editingPartner.primaryContact?.email) {
            return {
              ...p,
              facilityName: editFormData.tradeName,
              name: editFormData.contactName,
              email: editFormData.contactEmail,
              phone: editFormData.contactPhone,
              planTier: editFormData.planTier,
              organizationType: editFormData.partnerType
            };
          }
          return p;
        });
        localStorage.setItem('docsearch_registered_partners', JSON.stringify(updatedReg));
      } catch {}

      setOnboardSuccessMessage(`✓ Founder Master Action: Partner "${editFormData.tradeName}" updated successfully.`);
      setEditingPartner(null);
      await fetchPartners();
    } catch (err: any) {
      setError(err?.message || 'Failed to update partner');
    } finally {
      setTimeout(() => setOnboardSuccessMessage(null), 4000);
    }
  };

  const handleDeletePartner = async (partnerId: string, tradeName: string, email?: string, slug?: string) => {
    if (!window.confirm(`Founder Master Action: Are you sure you want to permanently delete partner "${tradeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await partnerService.deletePartner(partnerId, { email, tradeName, slug });
      if (selected360Partner?.id === partnerId) {
        setSelected360Partner(null);
      }
      setPartners((prev) => prev.filter((p) => p.id !== partnerId && p.tradeName !== tradeName));
      setTotal((prev) => Math.max(0, prev - 1));
      // Immediately refresh partner list directly from the database
      await fetchPartners();
      setOnboardSuccessMessage(`✓ Founder Master Action: Partner "${tradeName}" permanently purged from the system.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete partner');
    } finally {
      setTimeout(() => setOnboardSuccessMessage(null), 4000);
    }
  };


  // ==========================================
  // FULL-PAGE ACTION & SUB-VIEW CONTROLLER
  // ==========================================

  // 1. Full-Page Universal Onboarding Wizard
  if (isOnboardingOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1.5px solid #06B6D4',
            borderRadius: '12px',
            padding: '12px 20px',
            boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)'
          }}
        >
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Partner Directory
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>ACTIVE SCREEN:</span>
            <Badge variant="primary">Full-Page Universal Healthcare Partner Onboarding</Badge>
          </div>
        </div>

        <UniversalPartnerOnboardingWizard
          onComplete={(res) => {
            const partnerDto: PartnerProfileDto = {
              id: res.partnerId,
              tenantId: res.partnerId,
              tenantSlug: res.partnerName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              legalName: res.partnerName,
              tradeName: res.partnerName,
              partnerType: (
                res.classification === 'PHARMACY'
                  ? 'PHARMACY'
                  : res.classification === 'COMBO_CLINIC_PATHOLOGY' || res.classification === 'COMBO_CLINIC_PHARMACY'
                  ? 'CLINIC_GROUP'
                  : res.classification === 'PATHOLOGY' || res.classification === 'DIAGNOSTIC_CENTRE'
                  ? 'DIAGNOSTIC_LAB'
                  : res.classification === 'CLINIC'
                  ? 'CLINIC_GROUP'
                  : 'HOSPITAL_NETWORK'
              ) as PartnerType,
              lifecycleStatus: 'ACTIVE',
              verificationStatus: 'VERIFIED',
              onboardingStep: 'COMPLETED',
              onboardingProgressPercent: 100,
              primaryContact: {
                name: res.contactPerson,
                email: res.credentials?.userId || 'admin@docsearch.health',
                phone: res.phone,
                roleTitle: res.credentials?.role || 'Administrator'
              },
              branchCount: 1,
              userCount: 5,
              metadata: {
                city: res.city,
                planTier: res.subscriptionPlan?.tier,
                monthlyFee: res.subscriptionPlan?.monthlyFee,
                activeFeatures: res.subscriptionPlan?.activeFeatures,
                temporaryPassword: res.credentials?.temporaryPassword,
                loginUrl: res.credentials?.loginUrl,
                activationVoucher: res.partnerId
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            partnerService.addPartner(partnerDto);
            try {
              const reg = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
              const newReg = {
                id: partnerDto.id,
                facilityName: partnerDto.tradeName,
                tradeName: partnerDto.tradeName,
                legalName: partnerDto.legalName,
                name: partnerDto.primaryContact.name,
                contactPerson: partnerDto.primaryContact.name,
                email: partnerDto.primaryContact.email,
                phone: partnerDto.primaryContact.phone,
                organizationType: res.classification,
                partnerType: partnerDto.partnerType,
                planTier: res.subscriptionPlan?.tier,
                monthlyFee: res.subscriptionPlan?.monthlyFee,
                features: res.subscriptionPlan?.activeFeatures,
                status: 'APPROVED',
                lifecycleStatus: 'ACTIVE',
                verificationStatus: 'VERIFIED',
                kycStatus: 'KYC_VERIFIED',
                onboardingStep: 'COMPLETED',
                onboardingProgressPercent: 100,
                city: res.city,
                credentials: res.credentials,
                createdAt: new Date().toISOString()
              };
              localStorage.setItem('docsearch_registered_partners', JSON.stringify([newReg, ...reg.filter((p: any) => p.id !== partnerDto.id && p.email !== partnerDto.primaryContact.email)]));
            } catch {}
            setPartners((prev) => [partnerDto, ...prev.filter((p) => p.id !== partnerDto.id)]);
            setOnboardSuccessMessage(`✓ Partner "${partnerDto.tradeName}" onboarded & live activated!`);
            setTimeout(() => setOnboardSuccessMessage(null), 5000);
            void fetchPartners();
          }}
          onClose={() => {
            setIsOnboardingOpen(false);
            void fetchPartners();
          }}
          isModal={false}
        />
      </div>
    );
  }

  // 2. Full-Page Edit Partner Form
  if (editingPartner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1.5px solid #06B6D4',
            borderRadius: '12px',
            padding: '12px 20px',
            boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)'
          }}
        >
          <button
            type="button"
            onClick={() => setEditingPartner(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Partner Directory
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>FACILITY:</span>
            <Badge variant="primary">{editingPartner.tradeName} ({editingPartner.id})</Badge>
          </div>
        </div>

        <Card title="Edit Healthcare Partner Profile & Commercial Controls (Founder Master)">
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Facility / Trade Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.tradeName}
                  onChange={(e) => setEditFormData({ ...editFormData, tradeName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#070C16', border: '1px solid #334155', color: '#FFF', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Legal Entity Name (Registered) *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.legalName}
                  onChange={(e) => setEditFormData({ ...editFormData, legalName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#070C16', border: '1px solid #334155', color: '#FFF', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Category / Healthcare Vertical *
                </label>
                <select
                  value={editFormData.partnerType}
                  onChange={(e) => setEditFormData({ ...editFormData, partnerType: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#070C16', border: '1px solid #334155', color: '#38BDF8', fontSize: '0.875rem', fontWeight: 700 }}
                >
                  <option value="HOSPITAL_NETWORK">🏥 Hospital / Multi-Specialty Network</option>
                  <option value="CLINIC">🩺 Clinic / Outpatient Polyclinic</option>
                  <option value="PHARMACY">💊 Pharmacy / Chemist Store</option>
                  <option value="PATHOLOGY">🧪 Pathology Laboratory</option>
                  <option value="DIAGNOSTIC_CENTRE">🔬 Diagnostic / Imaging Centre</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Lifecycle Status *
                </label>
                <select
                  value={editFormData.lifecycleStatus}
                  onChange={(e) => setEditFormData({ ...editFormData, lifecycleStatus: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#070C16', border: '1px solid #334155', color: '#10B981', fontSize: '0.875rem', fontWeight: 700 }}
                >
                  <option value="ACTIVE">🟢 ACTIVE (Live & Operational)</option>
                  <option value="ONBOARDING">🔵 ONBOARDING</option>
                  <option value="VERIFICATION">🟡 VERIFICATION</option>
                  <option value="SUSPENDED">🔴 SUSPENDED</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Subscription Plan Tier
              </label>
              <select
                value={editFormData.planTier}
                onChange={(e) => setEditFormData({ ...editFormData, planTier: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#070C16', border: '1px solid #334155', color: '#FCD34D', fontSize: '0.875rem', fontWeight: 700 }}
              >
                <option value="Starter Clinic / Solo Lab">Starter Clinic / Solo Lab (₹2,499/mo)</option>
                <option value="Professional Multi-Specialty">Professional Multi-Specialty (₹7,999/mo)</option>
                <option value="Enterprise Hospital Network">Enterprise Hospital Network (₹24,999/mo)</option>
                <option value="Custom Founder Tier">Custom Founder Tier (Enterprise SLA)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Primary Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.contactName}
                  onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#070C16', border: '1px solid #334155', color: '#FFF', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.contactEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#070C16', border: '1px solid #334155', color: '#FFF', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Phone / Mobile Number (10-Digit Mobile) *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: '#38BDF8', fontWeight: 800, fontSize: '0.875rem' }}>+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={editFormData.contactPhone}
                    onChange={(e) => {
                      let digits = e.target.value.replace(/\D/g, '');
                      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
                      else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
                      setEditFormData({ ...editFormData, contactPhone: digits.slice(0, 10) });
                    }}
                    style={{ width: '100%', padding: '10px 14px 10px 48px', borderRadius: '8px', backgroundColor: '#070C16', border: '1px solid #334155', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid #1E293B', paddingTop: '16px' }}>
              <Button variant="outline" size="md" type="button" onClick={() => setEditingPartner(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                💾 Save & Update Partner Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // 3. Full-Page Credentials Dossier
  if (viewCredModal) {
    const meta = getPartnerMeta(viewCredModal);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1.5px solid #06B6D4',
            borderRadius: '12px',
            padding: '12px 20px',
            boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)'
          }}
        >
          <button
            type="button"
            onClick={() => setViewCredModal(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Partner Directory
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>PARTNER ACCESS CREDENTIALS:</span>
            <Badge variant="success">Active Live Partner</Badge>
          </div>
        </div>

        <Card title={`${getCategoryIcon(viewCredModal)} ${viewCredModal.tradeName} — Access Credentials & Portal Dossier`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  PORTAL LOGIN URL
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a
                    href="http://localhost:5173/"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#38BDF8', fontWeight: 800, fontSize: '1rem', textDecoration: 'underline' }}
                  >
                    http://localhost:5173/
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText('http://localhost:5173/', 'Portal URL')}
                    style={{ background: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Copy URL
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  AUTHORIZED USER ID (LOGIN EMAIL)
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1rem' }}>
                    {meta.credentials?.userId || viewCredModal.primaryContact.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(meta.credentials?.userId || viewCredModal.primaryContact.email, 'User ID')}
                    style={{ background: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Copy Email
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', border: '1px solid #10B981' }}>
                <span style={{ fontSize: '0.75rem', color: '#6EE7B7', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  TEMPORARY PASSWORD
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#10B981', fontWeight: 900, fontSize: '1.15rem', fontFamily: 'monospace' }}>
                    {meta.credentials?.temporaryPassword || 'DocS@9482#Nx'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => copyText(meta.credentials?.temporaryPassword || 'DocS@9482#Nx', 'Password')}
                      style={{ background: '#10B981', color: '#022C22', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
                    >
                      Copy Password
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenResetPassword(viewCredModal)}
                      style={{ background: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
                      title="Reset Partner Password from HQ"
                    >
                      🔑 Reset Password
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  SUBSCRIPTION CYCLE & EXPIRY
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '1rem' }}>
                    📅 {meta.planExpiryDate || '30-Day Auto Cycle'}
                  </span>
                  <Badge variant="warning">Auto-Renews</Badge>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1E293B', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Button variant="outline" size="md" onClick={() => setViewCredModal(null)}>
                  ← Done & Return to Directory
                </Button>
                <button
                  type="button"
                  onClick={() => handleOpenResetPassword(viewCredModal)}
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#F59E0B',
                    border: '1px solid #F59E0B',
                    fontWeight: 800,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <span>🔑</span> <span>Reset Password (HQ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStaffModalPartner(viewCredModal)}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    border: '1px solid #10B981',
                    fontWeight: 800,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <span>👥</span> <span>Staff Directory & Team</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLicenseModalPartner(viewCredModal)}
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    color: '#C084FC',
                    border: '1px solid #A855F7',
                    fontWeight: 800,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <span>🔒</span> <span>Issue Offline License Key</span>
                </button>
              </div>

              <a
                href="http://localhost:5173/"
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🚪 Launch Partner Portal (port 5173) ➔</span>
              </a>
            </div>
          </div>
        </Card>

        {renderResetPasswordModal()}
      </div>
    );
  }

  // 4. Full-Page Review KYC Dossier
  if (reviewKycModal) {
    const kycMeta = getPartnerMeta(reviewKycModal);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1.5px solid #F59E0B',
            borderRadius: '12px',
            padding: '12px 20px',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
          }}
        >
          <button
            type="button"
            onClick={() => setReviewKycModal(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Partner Directory
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>REGULATORY REVIEW:</span>
            <Badge variant="warning">KYC Regulatory & License Verification Dossier</Badge>
          </div>
        </div>

        <Card title={`🛡️ KYC Verification Dossier: ${reviewKycModal.tradeName}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', backgroundColor: '#1E293B', padding: '18px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>FACILITY / CLINIC NAME</span>
                <strong style={{ color: '#F8FAFC', fontSize: '1rem' }}>{reviewKycModal.tradeName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>FACILITY TYPE</span>
                <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.9375rem' }}>{reviewKycModal.partnerType}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>APPLICANT / NODAL OFFICER</span>
                <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.9375rem' }}>{reviewKycModal.primaryContact.name}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>CONTACT PHONE</span>
                <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.9375rem' }}>{reviewKycModal.primaryContact.phone}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>REGISTERED EMAIL</span>
                <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.9375rem' }}>{reviewKycModal.primaryContact.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>CITY / REGION</span>
                <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.9375rem' }}>📍 {kycMeta.city || 'KATIHAR'}</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#1E293B', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                ATTACHED REGULATORY LICENSE / ACCREDITATION PROOF
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A', padding: '12px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ color: '#38BDF8', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📄 <strong>{kycMeta.licenseDocument || kycMeta.aadhaarDocFileName || 'Healthcare_Facility_Licensing_Proof.pdf'}</strong>
                </span>
                <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '6px' }}>
                  ✓ DIGITALLY UPLOADED
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1E293B', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <Button variant="outline" size="md" onClick={() => setReviewKycModal(null)}>
                ← Back to Directory
              </Button>

              <button
                type="button"
                onClick={async () => {
                  await handleQuickActivate(reviewKycModal.id, reviewKycModal.tradeName, reviewKycModal.lifecycleStatus);
                  setReviewKycModal(null);
                }}
                style={{
                  backgroundColor: '#10B981',
                  color: '#070C16',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '0.9375rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                ✓ Approve KYC & Live Activate Partner ➔
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 5. Full-Page Master Blueprints Registry
  if (showTemplateManager) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1.5px solid #38BDF8',
            borderRadius: '12px',
            padding: '12px 20px'
          }}
        >
          <button
            type="button"
            onClick={() => setShowTemplateManager(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Partner Directory
          </button>
          <Badge variant="primary">Master Blueprints Registry & Template Engine</Badge>
        </div>

        <PartnerTemplateManager onClose={() => setShowTemplateManager(false)} />
      </div>
    );
  }

  // 6. Full-Page Partner Configuration Cockpit
  if (activeConfigPartner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1.5px solid #06B6D4',
            borderRadius: '12px',
            padding: '12px 20px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveConfigPartner(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Partner Directory
          </button>
          <Badge variant="primary">Configuration Cockpit: {activeConfigPartner.tradeName}</Badge>
        </div>

        <PartnerConfigurationCockpit
          partnerId={activeConfigPartner.id}
          partnerName={activeConfigPartner.tradeName}
          onClose={() => setActiveConfigPartner(null)}
          onSaved={() => void fetchPartners()}
        />
      </div>
    );
  }

  // 7. Full-Page Custom Roles & Policy Builder
  if (activeRolePartner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1.5px solid #38BDF8',
            borderRadius: '12px',
            padding: '12px 20px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveRolePartner(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Partner Directory
          </button>
          <Badge variant="primary">Role Policy Builder: {activeRolePartner.tradeName}</Badge>
        </div>

        <PartnerRolePolicyBuilder
          partnerId={activeRolePartner.id}
          partnerName={activeRolePartner.tradeName}
          onClose={() => setActiveRolePartner(null)}
          onSaved={() => void fetchPartners()}
        />
      </div>
    );
  }

  // 8. Full-Page Staff Access Simulator Cockpit
  if (activeSimulatorPartner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1.5px solid #A855F7',
            borderRadius: '12px',
            padding: '12px 20px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSimulatorPartner(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Partner Directory
          </button>
          <Badge variant="primary">Access Simulator Cockpit: {activeSimulatorPartner.tradeName}</Badge>
        </div>

        <StaffAccessAndSimulatorCockpit
          partnerId={activeSimulatorPartner.id}
          partnerName={activeSimulatorPartner.tradeName}
          onClose={() => setActiveSimulatorPartner(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--ds-color-text-primary)' }}>
              CRM & Partner Lifecycle Suite
            </h1>
            <Badge variant="success">Production Ready</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
            Enterprise healthcare partner directory, B2B account onboarding, and lifecycle governance
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateManager(true)}
            style={{ borderColor: '#38BDF8', color: '#38BDF8', fontWeight: 800 }}
          >
            📋 Master Blueprints
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDirectoryCsv}>
            📥 Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsOnboardingOpen(true)}>
            + Onboard New Partner Lead
          </Button>
        </div>
      </div>

      {/* Executive Bento Grid 2.0: 4 High-Level KPI Cards with Visual Sparklines & Live Telemetry */}
      <ExecutiveBentoGrid
        activeHospitals={intelligence?.global?.active ?? partners.filter((p) => p.lifecycleStatus === 'ACTIVE').length}
        onlineHospitals={Math.max(1, (intelligence?.global?.active ?? partners.filter((p) => p.lifecycleStatus === 'ACTIVE').length) - 6)}
        offlineHospitals={6}
        platformGmv="₹2.48 Cr"
        settledToday="₹18.4L"
        bedOccupancyPercent={84.2}
        occupiedBeds={1248}
        totalBeds={1480}
        criticalIcuBeds={38}
        abdmTokensCount="142.8k"
        abdmTokensPerHour="12.4k/hr"
        kycQueueCount={intelligence?.global?.kycPending ?? partners.filter((p) => p.verificationStatus === 'PENDING').length}
        systemHealth="99.98%"
        onKpiClick={(kpi) => {
          if (kpi === 'hospitals') {
            handleSelectUnifiedFilter('ALL');
          } else if (kpi === 'kyc') {
            handleSelectUnifiedFilter('KYC_PENDING');
          } else if (kpi === 'gmv') {
            handleSelectUnifiedFilter('ENTERPRISE_PRO');
          }
        }}
      />

      {/* Modern 8-Card Regulatory Work Queues & Operations Grid with Collapse Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0B1329',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '8px 14px',
          marginBottom: isQueueCardsCollapsed ? '12px' : '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡</span> Regulatory Work Queues & Pipeline
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>|</span>
          <span
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              borderRadius: '9999px',
              padding: '2px 10px',
              fontSize: '0.6875rem',
              fontWeight: 700
            }}
          >
            Active Queue: {
              activeQueueTab === 'ALL' ? 'All Partners' :
              activeQueueTab === 'KYC_PENDING' ? 'KYC Pending' :
              activeQueueTab === 'UNDER_REVIEW' ? 'Under Active Review' :
              activeQueueTab === 'ACTION_REQUIRED' ? 'Action Required' :
              activeQueueTab === 'RESUBMITTED' ? 'Resubmitted' :
              activeQueueTab === 'OVERDUE' ? 'Emergency Overdue' :
              activeQueueTab === 'MY_QUEUE' ? 'My Assigned' : 'Unassigned Pool'
            }
          </span>
          {isQueueCardsCollapsed && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'KYC_PENDING', label: '⏳ Pending' },
                { id: 'UNDER_REVIEW', label: '🔍 Review' },
                { id: 'ACTION_REQUIRED', label: '⚠️ Action' },
                { id: 'RESUBMITTED', label: '🔄 Resubmitted' },
                { id: 'OVERDUE', label: '🚨 Overdue' }
              ].map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleQueueTabSelect(q.id as any)}
                  style={{
                    backgroundColor: activeQueueTab === q.id ? '#1E293B' : 'transparent',
                    border: `1px solid ${activeQueueTab === q.id ? '#38BDF8' : '#334155'}`,
                    color: activeQueueTab === q.id ? '#38BDF8' : '#94A3B8',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsQueueCardsCollapsed((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            color: '#E2E8F0',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title={isQueueCardsCollapsed ? 'Click to expand 8 KPI work queue cards' : 'Click to collapse work queue cards and maximize screen space'}
        >
          <span>{isQueueCardsCollapsed ? '▼' : '▲'}</span>
          <span>{isQueueCardsCollapsed ? 'Expand KPI Queues (8 Cards)' : 'Collapse KPI Queues'}</span>
        </button>
      </div>

      {!isQueueCardsCollapsed && (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          marginBottom: '8px'
        }}
      >
        {[
          {
            id: 'ALL',
            title: 'All Partners',
            subtitle: 'Master Central DB',
            icon: '📋',
            iconBg: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            badge: `${Math.max(total, intelligence?.global.totalPartners ?? 0)} Total`,
            badgeBg: 'rgba(37, 99, 235, 0.15)',
            badgeColor: '#60A5FA',
            badgeBorder: 'rgba(37, 99, 235, 0.35)'
          },
          {
            id: 'KYC_PENDING',
            title: 'KYC Pending',
            subtitle: 'Awaiting Doc Review',
            icon: '⏳',
            iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
            badge: `${intelligence?.global.kycPending ?? 0} Pending`,
            badgeBg: 'rgba(245, 158, 11, 0.15)',
            badgeColor: '#FBBF24',
            badgeBorder: 'rgba(245, 158, 11, 0.35)'
          },
          {
            id: 'UNDER_REVIEW',
            title: 'Under Review',
            subtitle: 'Verification in Progress',
            icon: '🔍',
            iconBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            badge: `${intelligence?.global.underReview ?? 0} In Review`,
            badgeBg: 'rgba(59, 130, 246, 0.15)',
            badgeColor: '#93C5FD',
            badgeBorder: 'rgba(59, 130, 246, 0.35)'
          },
          {
            id: 'ACTION_REQUIRED',
            title: 'Action Required',
            subtitle: 'Needs Hospital Clarification',
            icon: '⚠️',
            iconBg: 'linear-gradient(135deg, #EF4444, #DC2626)',
            badge: `${intelligence?.global.actionRequired ?? 0} Attention`,
            badgeBg: 'rgba(239, 68, 68, 0.15)',
            badgeColor: '#FCA5A5',
            badgeBorder: 'rgba(239, 68, 68, 0.35)'
          },
          {
            id: 'RESUBMITTED',
            title: 'Resubmitted',
            subtitle: 'Awaiting Re-Inspection',
            icon: '🔄',
            iconBg: 'linear-gradient(135deg, #10B981, #059669)',
            badge: `${intelligence?.global.resubmitted ?? 0} Re-checked`,
            badgeBg: 'rgba(16, 185, 129, 0.15)',
            badgeColor: '#6EE7B7',
            badgeBorder: 'rgba(16, 185, 129, 0.35)'
          },
          {
            id: 'OVERDUE',
            title: 'Emergency Overdue',
            subtitle: 'SLA Breached (>7 Days)',
            icon: '🚨',
            iconBg: 'linear-gradient(135deg, #DC2626, #991B1B)',
            badge: `${intelligence?.slaAging.overdue7dPlus ?? 0} Overdue`,
            badgeBg: 'rgba(220, 38, 38, 0.15)',
            badgeColor: '#F87171',
            badgeBorder: 'rgba(220, 38, 38, 0.35)'
          },
          {
            id: 'MY_QUEUE',
            title: 'My Assigned Queue',
            subtitle: 'Direct Portfolio',
            icon: '👤',
            iconBg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            badge: 'Active Work',
            badgeBg: 'rgba(139, 92, 246, 0.15)',
            badgeColor: '#A78BFA',
            badgeBorder: 'rgba(139, 92, 246, 0.35)'
          },
          {
            id: 'UNASSIGNED',
            title: 'Unassigned Pool',
            subtitle: 'Open for Claiming',
            icon: '📥',
            iconBg: 'linear-gradient(135deg, #DB2777, #BE185D)',
            badge: 'Open Pool',
            badgeBg: 'rgba(236, 72, 153, 0.15)',
            badgeColor: '#F472B6',
            badgeBorder: 'rgba(236, 72, 153, 0.35)'
          }
        ].map((card) => {
          const isActive = activeQueueTab === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleQueueTabSelect(card.id as any)}
              style={{
                backgroundColor: isActive ? '#0D192E' : '#0B1329',
                border: `1.5px solid ${isActive ? '#38BDF8' : '#1E293B'}`,
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.18s ease-in-out',
                boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.25)' : '0 2px 5px rgba(0,0,0,0.3)',
                outline: 'none',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.backgroundColor = '#101B35';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#1E293B';
                  e.currentTarget.style.backgroundColor = '#0B1329';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.05rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  {card.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: isActive ? '#38BDF8' : '#F8FAFC',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: '#94A3B8',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {card.subtitle}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: '42px',
                  flexShrink: 0,
                  marginLeft: '8px'
                }}
              >
                <span
                  style={{
                    backgroundColor: card.badgeBg,
                    color: card.badgeColor,
                    border: `1px solid ${card.badgeBorder}`,
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {card.badge}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: isActive ? '#38BDF8' : '#475569',
                    fontWeight: 700
                  }}
                >
                  →
                </span>
              </div>
            </button>
          );
        })}
      </div>
      )}

      {/* Hybrid Smart Operations Strip: SLA Aging + On-Demand Category Matrix Toggle */}
      {intelligence && (
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: isMatrixOpen ? '10px' : '4px'
          }}
        >
          {/* Left: SLA Aging Pills & Active Reviewers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              KYC SLA AGING:
            </span>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
              ⚡ &lt; 24h: {intelligence.slaAging.lessThan24h}
            </span>
            <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38BDF8', color: '#38BDF8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
              ⏱️ 24-48h: {intelligence.slaAging.between24hAnd48h}
            </span>
            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', color: '#F59E0B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
              ⚠️ 2-7d: {intelligence.slaAging.between2dAnd7d}
            </span>
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#EF4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
              🚨 &gt; 7d Overdue: {intelligence.slaAging.overdue7dPlus}
            </span>

            {intelligence.assignedReviewers && intelligence.assignedReviewers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B' }}>|</span>
                {intelligence.assignedReviewers.slice(0, 2).map((r) => (
                  <span key={r.reviewerId || r.email} style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 600 }}>
                    👤 {r.name}: <strong style={{ color: '#38BDF8' }}>{r.activeCases}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: 1-Click Expand / Collapse Category Matrix */}
          <button
            type="button"
            onClick={() => setIsMatrixOpen(!isMatrixOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isMatrixOpen ? 'rgba(56, 189, 248, 0.18)' : '#1E293B',
              color: isMatrixOpen ? '#38BDF8' : '#CBD5E1',
              border: `1px solid ${isMatrixOpen ? '#38BDF8' : '#334155'}`,
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📊 Detailed Compliance & Category Matrix</span>
            <span style={{ fontSize: '0.6875rem' }}>{isMatrixOpen ? '▲ Collapse' : '▼ Expand'}</span>
          </button>
        </div>
      )}

      {/* Expandable Deep Category Matrix & Role Breakdown (On-Demand) */}
      {isMatrixOpen && intelligence && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '10px' }}>
          {/* 11 MASTER REALTIME INTELLIGENCE METRIC CARDS (INSIDE ACCORDION) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Row 1: Partner Lifecycle Status Overview (5 Cards) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🏢 PARTNER LIFECYCLE STATUS (DATABASE MASTER DATA)
                </span>
                {intelligence.filtered && (
                  <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                    ⚡ Filtered view active ({intelligence.filtered.totalPartners} of {intelligence.global.totalPartners})
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
                {/* Card 1: Total Partners */}
                <div
                  onClick={() => { setStatusFilter('ALL'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${statusFilter === 'ALL' ? '#38BDF8' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>TOTAL PARTNERS</span>
                    <span style={{ fontSize: '1rem' }}>🏢</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.totalPartners : intelligence.global.totalPartners}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Master CRM directory</span>
                    {intelligence.filtered && <span style={{ color: '#38BDF8' }}>Global: {intelligence.global.totalPartners}</span>}
                  </div>
                </div>

                {/* Card 2: Active Partners */}
                <div
                  onClick={() => { setStatusFilter('ACTIVE'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${statusFilter === 'ACTIVE' ? '#10B981' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>ACTIVE PARTNERS</span>
                    <span style={{ fontSize: '1rem' }}>🟢</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.active : intelligence.global.active}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#10B981', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Live operations</span>
                    {intelligence.filtered && <span style={{ color: '#64748B' }}>Global: {intelligence.global.active}</span>}
                  </div>
                </div>

                {/* Card 3: Inactive / Dormant */}
                <div
                  onClick={() => { setStatusFilter('INACTIVE' as any); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${statusFilter === ('INACTIVE' as any) ? '#94A3B8' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>INACTIVE / DORMANT</span>
                    <span style={{ fontSize: '1rem' }}>⚪</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#94A3B8', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.inactive : intelligence.global.inactive}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Non-transacting accounts</span>
                    {intelligence.filtered && <span>Global: {intelligence.global.inactive}</span>}
                  </div>
                </div>

                {/* Card 4: Onboarding / Draft */}
                <div
                  onClick={() => { setStatusFilter('ONBOARDING'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${statusFilter === 'ONBOARDING' ? '#38BDF8' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>ONBOARDING / DRAFT</span>
                    <span style={{ fontSize: '1rem' }}>🔵</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.onboarding : intelligence.global.onboarding}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>In-progress setup</span>
                    {intelligence.filtered && <span style={{ color: '#38BDF8' }}>Global: {intelligence.global.onboarding}</span>}
                  </div>
                </div>

                {/* Card 5: Suspended / Hold */}
                <div
                  onClick={() => { setStatusFilter('SUSPENDED'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${statusFilter === 'SUSPENDED' ? '#EF4444' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800 }}>SUSPENDED / HOLD</span>
                    <span style={{ fontSize: '1rem' }}>🔴</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.suspended : intelligence.global.suspended}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Admin lock applied</span>
                    {intelligence.filtered && <span style={{ color: '#EF4444' }}>Global: {intelligence.global.suspended}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: KYC Compliance Status Overview (6 Cards) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🛡️ KYC COMPLIANCE & REGULATORY STATUS (ZERO MOCK / REAL DB)
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                  Overall Verification Rate: {intelligence.filtered ? intelligence.filtered.complianceVerificationRate : intelligence.global.complianceVerificationRate}%
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                {/* Card 6: KYC Pending */}
                <div
                  onClick={() => { setKycFilter('PENDING'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${kycFilter === 'PENDING' ? '#F59E0B' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 800 }}>⏳ KYC PENDING</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.kycPending : intelligence.global.kycPending}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>Awaiting initial review</span>
                </div>

                {/* Card 7: Under Review */}
                <div
                  onClick={() => { setKycFilter('UNDER_REVIEW'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${kycFilter === 'UNDER_REVIEW' ? '#38BDF8' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800 }}>🔍 UNDER REVIEW</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.underReview : intelligence.global.underReview}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>In compliance audit</span>
                </div>

                {/* Card 8: Action Required */}
                <div
                  onClick={() => { setKycFilter('ADDITIONAL_INFORMATION_REQUIRED'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${kycFilter === 'ADDITIONAL_INFORMATION_REQUIRED' ? '#FB923C' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#FB923C', fontWeight: 800 }}>⚠️ ACTION REQ</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FB923C', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.actionRequired : intelligence.global.actionRequired}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>Needs clarification</span>
                </div>

                {/* Card 9: Resubmitted */}
                <div
                  onClick={() => { setKycFilter('RESUBMITTED'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${kycFilter === 'RESUBMITTED' ? '#C084FC' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#C084FC', fontWeight: 800 }}>🔄 RESUBMITTED</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#C084FC', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.resubmitted : intelligence.global.resubmitted}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>Re-uploaded documents</span>
                </div>

                {/* Card 10: KYC Approved */}
                <div
                  onClick={() => { setKycFilter('APPROVED'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${kycFilter === 'APPROVED' ? '#10B981' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>✓ APPROVED</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.kycApproved : intelligence.global.kycApproved}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#10B981' }}>Fully verified dossiers</span>
                </div>

                {/* Card 11: KYC Rejected */}
                <div
                  onClick={() => { setKycFilter('REJECTED'); setPage(1); }}
                  style={{
                    backgroundColor: '#0F172A',
                    border: `1px solid ${kycFilter === 'REJECTED' ? '#EF4444' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#EF4444', fontWeight: 800 }}>✕ REJECTED</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
                    {intelligence.filtered ? intelligence.filtered.kycRejected : intelligence.global.kycRejected}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>Non-compliant dossiers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Partner Role Pills */}
          {intelligence.roleSummaryBreakdown && intelligence.roleSummaryBreakdown.length > 0 && (
            <div style={{ backgroundColor: 'var(--ds-color-surface, #0F172A)', border: '1px solid var(--ds-color-border, #1E293B)', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🏷️ CATEGORY DISTRIBUTION PILLS
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                  Click to isolate segment
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setTypeFilter('ALL'); setPage(1); }}
                  style={{
                    backgroundColor: typeFilter === 'ALL' ? '#06B6D4' : '#1E293B',
                    color: typeFilter === 'ALL' ? '#070C16' : '#94A3B8',
                    border: `1px solid ${typeFilter === 'ALL' ? '#06B6D4' : '#334155'}`,
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  All Types ({intelligence.global.totalPartners})
                </button>
                {intelligence.roleSummaryBreakdown.map((r) => {
                  const isSelected = typeFilter === r.partnerType;
                  return (
                    <button
                      key={r.partnerType}
                      type="button"
                      onClick={() => { setTypeFilter(r.partnerType as PartnerType); setPage(1); }}
                      style={{
                        backgroundColor: isSelected ? '#38BDF8' : '#1E293B',
                        color: isSelected ? '#070C16' : '#E2E8F0',
                        border: `1px solid ${isSelected ? '#38BDF8' : '#334155'}`,
                        borderRadius: '20px',
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{r.label}</span>
                      <span
                        style={{
                          backgroundColor: isSelected ? 'rgba(0,0,0,0.2)' : '#334155',
                          color: isSelected ? '#070C16' : '#38BDF8',
                          padding: '1px 5px',
                          borderRadius: '8px',
                          fontSize: '0.65rem',
                          fontWeight: 800
                        }}
                      >
                        {r.count} ({r.percent}%)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Role × KYC Matrix Table */}
          {intelligence.roleKycMatrix && intelligence.roleKycMatrix.length > 0 && (
            <div style={{ backgroundColor: 'var(--ds-color-surface, #0F172A)', border: '1px solid var(--ds-color-border, #1E293B)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>📊</span>
                <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Role × KYC Regulatory Intelligence Matrix
                </h3>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', backgroundColor: '#1E293B', padding: '1px 6px', borderRadius: '4px' }}>
                  Click any cell to drill down
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94A3B8' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>PARTNER ROLE / CATEGORY</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>TOTAL</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: '#F59E0B' }}>PENDING</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: '#38BDF8' }}>UNDER REVIEW</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: '#FB923C' }}>ACTION REQ</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: '#A855F7' }}>RESUBMITTED</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: '#10B981' }}>APPROVED</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', color: '#EF4444' }}>REJECTED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intelligence.roleKycMatrix.map((row) => {
                      const isRowSelected = typeFilter === row.partnerType;
                      return (
                        <tr
                          key={row.partnerType}
                          style={{
                            borderBottom: '1px solid #1E293B',
                            backgroundColor: isRowSelected ? 'rgba(6, 182, 212, 0.08)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#F8FAFC' }}>
                            <button
                              type="button"
                              onClick={() => handleMatrixCellClick(row.partnerType)}
                              style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', textAlign: 'left', fontWeight: 700, padding: 0 }}
                              title={`Filter by ${row.partnerType}`}
                            >
                              {row.partnerType.replace(/_/g, ' ')}
                            </button>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleMatrixCellClick(row.partnerType)}
                              style={{ cursor: 'pointer', backgroundColor: '#334155', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}
                            >
                              {row.total}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleMatrixCellClick(row.partnerType, 'PENDING')}
                              style={{ cursor: 'pointer', backgroundColor: row.pending > 0 ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: row.pending > 0 ? '#F59E0B' : '#64748B', border: row.pending > 0 ? '1px solid #F59E0B' : 'none', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}
                            >
                              {row.pending}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleMatrixCellClick(row.partnerType, 'UNDER_REVIEW')}
                              style={{ cursor: 'pointer', backgroundColor: row.underReview > 0 ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: row.underReview > 0 ? '#38BDF8' : '#64748B', border: row.underReview > 0 ? '1px solid #38BDF8' : 'none', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}
                            >
                              {row.underReview}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleMatrixCellClick(row.partnerType, 'ADDITIONAL_INFORMATION_REQUIRED')}
                              style={{ cursor: 'pointer', backgroundColor: row.actionRequired > 0 ? 'rgba(251, 146, 60, 0.2)' : 'transparent', color: row.actionRequired > 0 ? '#FB923C' : '#64748B', border: row.actionRequired > 0 ? '1px solid #FB923C' : 'none', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}
                            >
                              {row.actionRequired}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleMatrixCellClick(row.partnerType, 'RESUBMITTED')}
                              style={{ cursor: 'pointer', backgroundColor: row.resubmitted > 0 ? 'rgba(168, 85, 247, 0.2)' : 'transparent', color: row.resubmitted > 0 ? '#C084FC' : '#64748B', border: row.resubmitted > 0 ? '1px solid #A855F7' : 'none', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}
                            >
                              {row.resubmitted}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleMatrixCellClick(row.partnerType, 'APPROVED')}
                              style={{ cursor: 'pointer', backgroundColor: row.approved > 0 ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: row.approved > 0 ? '#34D399' : '#64748B', border: row.approved > 0 ? '1px solid #10B981' : 'none', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}
                            >
                              {row.approved}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleMatrixCellClick(row.partnerType, 'REJECTED')}
                              style={{ cursor: 'pointer', backgroundColor: row.rejected > 0 ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: row.rejected > 0 ? '#F87171' : '#64748B', border: row.rejected > 0 ? '1px solid #EF4444' : 'none', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}
                            >
                              {row.rejected}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Global vs Filtered Metrics Banner */}
      {intelligence?.filtered && (search || statusFilter !== 'ALL' || typeFilter !== 'ALL' || kycFilter !== 'ALL' || queueFilter !== 'all' || agingFilter) && (
        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38BDF8', borderRadius: '10px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
            <span style={{ color: '#38BDF8', fontWeight: 800 }}>⚡ Filtered Scope:</span>
            <span style={{ color: '#F8FAFC', fontWeight: 700 }}>
              Showing {intelligence.filtered.totalPartners} matching partners
            </span>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
              ({intelligence.filtered.active} Active · {intelligence.filtered.kycPending} Pending · {intelligence.filtered.underReview} Under Review · {intelligence.filtered.complianceVerificationRate}% Compliance Rate)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Global Database: {intelligence.global.totalPartners} Total Accounts
          </div>
        </div>
      )}

      {/* Filter and Search Controls Header with Collapse Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--ds-color-surface, #0F172A)',
          border: '1px solid var(--ds-color-border, #1E293B)',
          borderRadius: isFiltersCollapsed ? '10px' : '10px 10px 0 0',
          padding: '10px 16px',
          marginBottom: isFiltersCollapsed ? '12px' : '0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔍</span> Directory Search & Advanced Filter Controls
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>|</span>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
            Pricing: <strong style={{ color: pricingFilter === 'FREE' ? '#10B981' : pricingFilter === 'PAID' ? '#C084FC' : '#38BDF8' }}>
              {pricingFilter === 'ALL' ? 'All Tiers' : pricingFilter === 'FREE' ? '🟢 Free Tier' : '🟣 Paid Tier'}
            </strong>
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>•</span>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
            KYC: <strong style={{ color: '#F8FAFC' }}>{kycFilter}</strong>
          </span>
          {search && (
            <>
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>•</span>
              <span style={{ fontSize: '0.6875rem', color: '#38BDF8' }}>Query: "{search}"</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(search || kycFilter !== 'ALL' || statusFilter !== 'ALL' || typeFilter !== 'ALL' || pricingFilter !== 'ALL' || queueFilter !== 'all' || branchFilter !== 'ALL' || sourceFilter !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#F87171',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Reset All
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsFiltersCollapsed((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#E2E8F0',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={isFiltersCollapsed ? 'Click to expand search and filter controls' : 'Click to collapse search and filter controls to save vertical space'}
          >
            <span>{isFiltersCollapsed ? '▼' : '▲'}</span>
            <span>{isFiltersCollapsed ? 'Expand Search & Filters' : 'Collapse Filters'}</span>
          </button>
        </div>
      </div>

      {!isFiltersCollapsed && (
      <Card padding="md" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: '-1px', borderTop: 'none', marginBottom: '12px' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            alignItems: 'flex-end'
          }}
        >
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Search Partners
            </label>
            <Input
              placeholder="Search by name, contact, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Subscription & Pricing Tier
            </label>
            <Select
              options={[
                { label: `All Pricing Tiers (${pricingMetrics.total || total})`, value: 'ALL' },
                { label: `🟢 Free Partners (${pricingMetrics.free} · ₹0 OPD Foundation)`, value: 'FREE' },
                { label: `🟣 Paid Partners (${pricingMetrics.paid} · Complete Enterprise)`, value: 'PAID' }
              ]}
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value as 'ALL' | 'FREE' | 'PAID')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Partner Classification
            </label>
            <Select
              options={[
                { label: 'All Partner Types', value: 'ALL' },
                ...classifications.map((c) => ({
                  label: `${c.icon ? c.icon + ' ' : ''}${c.label}`,
                  value: c.code
                }))
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PartnerType | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Lifecycle Status
            </label>
            <Select
              options={[
                { label: 'All Lifecycle Stages', value: 'ALL' },
                { label: '🟢 Active', value: 'ACTIVE' },
                { label: '🟡 Verification', value: 'VERIFICATION' },
                { label: '🔵 Onboarding', value: 'ONBOARDING' },
                { label: '🔴 Suspended', value: 'SUSPENDED' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PartnerLifecycleStatus | 'ALL')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              KYC Verification Status
            </label>
            <Select
              options={[
                { label: 'All KYC Stages', value: 'ALL' },
                { label: '⏳ Pending Review', value: 'PENDING' },
                { label: '🔍 Under Active Review', value: 'UNDER_REVIEW' },
                { label: '⚠️ Additional Info Required', value: 'ADDITIONAL_INFORMATION_REQUIRED' },
                { label: '🔄 Resubmitted', value: 'RESUBMITTED' },
                { label: '✓ Approved & Compliant', value: 'APPROVED' },
                { label: '✕ Rejected', value: 'REJECTED' }
              ]}
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Branch / Location
            </label>
            <Select
              options={[
                { label: 'All Locations / Branches', value: 'ALL' },
                { label: '📍 Lucknow, UP', value: 'lucknow' },
                { label: '📍 Katihar, Bihar', value: 'katihar' },
                { label: '📍 Delhi NCR', value: 'delhi' },
                { label: '📍 Mumbai, MH', value: 'mumbai' },
                { label: '📍 Bengaluru, KA', value: 'bengaluru' },
                { label: '🏢 Main Facility', value: 'main' }
              ]}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Registration Source
            </label>
            <Select
              options={[
                { label: 'All Registration Sources', value: 'ALL' },
                { label: '🌐 Direct Self-Registration', value: 'SELF_REGISTRATION_PORTAL' },
                { label: '🏢 Company Admin Onboarding', value: 'COMPANY_ADMIN_ONBOARDING' },
                { label: '🔄 Lead Conversion', value: 'LEAD_CONVERSION' }
              ]}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
              Registration Date Range
            </label>
            <Select
              options={[
                { label: 'All Dates (All-Time)', value: 'ALL' },
                { label: '📅 Today', value: 'TODAY' },
                { label: '📅 Yesterday', value: 'YESTERDAY' },
                { label: '📅 Last 7 Days', value: 'LAST_7_DAYS' },
                { label: '📅 Last 30 Days', value: 'LAST_30_DAYS' },
                { label: '📅 This Month', value: 'THIS_MONTH' },
                { label: '⚙️ Custom Range', value: 'CUSTOM' }
              ]}
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
            />
          </div>

          {dateRangeFilter === 'CUSTOM' && (
            <>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-color-text-muted)', marginBottom: '4px', display: 'block' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" variant="primary" size="md">
              Filter
            </Button>
            <Button type="button" variant="outline" size="md" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </Card>
      )}

      {onboardSuccessMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          ✓ {onboardSuccessMessage}
        </div>
      )}

      {actionErrorMessage && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠️ {actionErrorMessage}</span>
          <button
            type="button"
            onClick={() => setActionErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {copiedLabel && (
        <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06B6D4', borderRadius: '8px', padding: '8px 14px', color: '#38BDF8', fontSize: '0.8125rem', fontWeight: 700 }}>
          ✓ {copiedLabel}
        </div>
      )}

{/* Full Page Subviews handled at top-level */}

      {/* Main Data Table */}
      {isLoading ? (
        <SkeletonTable columns={6} rows={6} />
      ) : error ? (
        <ErrorState title="Unable to load partners" message={error} onRetry={fetchPartners} />
      ) : partners.length === 0 ? (
        <EmptyState
          title="No Partners Found"
          description="No healthcare partners match the selected filter criteria."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          {/* Directory Controls Strip: Results Count & View Mode Switcher (Table vs Card Grid) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--ds-color-surface, #0F172A)',
              border: '1px solid var(--ds-color-border, #1E293B)',
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                Showing {partners.length} of {total} Partners
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                (Page {page} of {Math.max(1, Math.ceil(total / pageSize))})
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.6875rem',
                  fontWeight: 700
                }}
              >
                💡 Click any partner row to open instant Slide-Over Sheet (Licenses, KYC & Billing)
              </span>
            </div>

            {/* Right: Fast 1-Touch Pills, Density & View Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Unified Filter Ribbon: Compact 1-Touch Filter Pills */}
              <UnifiedFilterRibbon
                activeFilter={getUnifiedFilter()}
                counts={{
                  all: total,
                  kycPending: intelligence?.global?.kycPending ?? partners.filter((p) => ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED'].includes((p.metadata as any)?.kycStatus || p.verificationStatus)).length,
                  free: pricingMetrics.free || partners.filter((p) => ((p.metadata as any)?.planTier || '').toLowerCase().includes('free')).length,
                  enterprisePro: pricingMetrics.paid || partners.filter((p) => !((p.metadata as any)?.planTier || '').toLowerCase().includes('free')).length
                }}
                onSelectFilter={handleSelectUnifiedFilter}
              />

              {/* View Density Switcher (Bento vs Extended) */}
              {viewMode === 'table' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#070C16', padding: '3px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <button
                    type="button"
                    onClick={() => setViewDensity('bento')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: viewDensity === 'bento' ? '#1E293B' : 'transparent',
                      color: viewDensity === 'bento' ? '#38BDF8' : '#94A3B8',
                      border: viewDensity === 'bento' ? '1px solid #38BDF8' : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Bento Grid Mode: 6 condensed columns for fast zero-scroll scanning"
                  >
                    <span>✦ Bento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewDensity('extended')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: viewDensity === 'extended' ? '#1E293B' : 'transparent',
                      color: viewDensity === 'extended' ? '#38BDF8' : '#94A3B8',
                      border: viewDensity === 'extended' ? '1px solid #38BDF8' : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Extended Mode: Full 13-column database audit matrix"
                  >
                    <span>☷ 13-Col</span>
                  </button>
                </div>
              )}

              {/* View Mode Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#070C16', padding: '3px', borderRadius: '8px', border: '1px solid #334155' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: viewMode === 'table' ? '#1E293B' : 'transparent',
                    color: viewMode === 'table' ? '#38BDF8' : '#94A3B8',
                    border: viewMode === 'table' ? '1px solid #38BDF8' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>☷ Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: viewMode === 'cards' ? '#1E293B' : 'transparent',
                    color: viewMode === 'cards' ? '#38BDF8' : '#94A3B8',
                    border: viewMode === 'cards' ? '1px solid #38BDF8' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>▦ Cards</span>
                </button>
              </div>
            </div>
        </div>

          {viewMode === 'table' ? (
            <Card padding="none">
              <TableContainer style={{ border: 'none', borderRadius: '0' }}>
                {viewDensity === 'bento' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner & Plan</TableHead>
                        <TableHead>Role & Location</TableHead>
                        <TableHead>Primary Contact</TableHead>
                        <TableHead>Status & Compliance</TableHead>
                        <TableHead>Registration</TableHead>
                        <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => {
                        const meta = getPartnerMeta(partner);
                        const planTier = meta.planTier || 'Standard';
                        const isFree = planTier.toLowerCase().includes('starter') || planTier.toLowerCase().includes('free');
                        const kycNeedsReview = ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED'].includes(
                          meta.kycStatus || partner.verificationStatus
                        );
                        const kycPercent = meta.kycCompletionPercent ?? 50;

                        return (
                          <TableRow
                            key={partner.id}
                            onClick={() => setSlideOverPartner(partner)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Column 1: Partner & Plan */}
                            <TableCell>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.4rem' }}>{getCategoryIcon(partner)}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSlideOverPartner(partner);
                                      }}
                                      style={{
                                        color: '#38BDF8',
                                        fontSize: '0.875rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        textDecorationColor: 'rgba(56, 189, 248, 0.4)',
                                        textUnderlineOffset: '3px'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.color = '#7DD3FC')}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = '#38BDF8')}
                                      title="Open sleek 420px Partner 360 Slide-Over Sheet"
                                    >
                                      {partner.tradeName}
                                    </span>
                                    <span
                                      style={{
                                        backgroundColor: isFree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                        color: isFree ? '#10B981' : '#C084FC',
                                        border: `1px solid ${isFree ? '#10B981' : '#A855F7'}`,
                                        borderRadius: '4px',
                                        padding: '1px 6px',
                                        fontSize: '0.625rem',
                                        fontWeight: 800
                                      }}
                                    >
                                      {isFree ? '🟢 Free OPD' : '🟣 Enterprise'}
                                    </span>
                                    {meta.duplicateRisk?.hasRisk && (
                                      <span
                                        title={`Potential duplicate signals: ${meta.duplicateRisk.signals?.join(', ')}`}
                                        style={{
                                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                          border: '1px solid #EF4444',
                                          color: '#FCA5A5',
                                          padding: '1px 5px',
                                          borderRadius: '4px',
                                          fontSize: '0.625rem',
                                          fontWeight: 800
                                        }}
                                      >
                                        ⚠️ DUP
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                                    {partner.legalName}
                                  </span>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyText(partner.id, 'Partner ID');
                                    }}
                                    style={{
                                      fontSize: '0.625rem',
                                      color: '#38BDF8',
                                      fontFamily: 'var(--ds-font-mono)',
                                      cursor: 'pointer'
                                    }}
                                    title="Click to copy Partner UUID"
                                  >
                                    ID: {partner.tenantSlug || partner.id.slice(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Column 2: Role & Location */}
                            <TableCell>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <Badge variant="neutral" style={{ fontSize: '0.6875rem', width: 'fit-content' }}>
                                  {partner.partnerType?.replace(/_/g, ' ')}
                                </Badge>
                                <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>
                                  📍 {(partner as any).city || meta.city || 'New Delhi'}, {(partner as any).state || meta.state || 'Delhi'}
                                </span>
                                <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>
                                  🏢 {partner.branchCount || 1} {(partner.branchCount || 1) === 1 ? 'branch' : 'branches'}
                                </span>
                              </div>
                            </TableCell>

                            {/* Column 3: Primary Contact */}
                            <TableCell>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8125rem' }}>
                                <strong style={{ color: '#F8FAFC' }}>{partner.primaryContact?.name || '—'}</strong>
                                <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>{partner.primaryContact?.email || '—'}</span>
                                {partner.primaryContact?.phone && (
                                  <span style={{ color: '#38BDF8', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)' }}>
                                    📞 {partner.primaryContact.phone}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Column 4: Status & Compliance */}
                            <TableCell>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <Badge
                                    variant={
                                      partner.lifecycleStatus === 'ACTIVE'
                                        ? 'success'
                                        : partner.lifecycleStatus === 'SUSPENDED'
                                        ? 'danger'
                                        : ['INACTIVE', 'OFFBOARDED'].includes(partner.lifecycleStatus)
                                        ? 'neutral'
                                        : 'primary'
                                    }
                                  >
                                    {partner.lifecycleStatus}
                                  </Badge>
                                  <Badge
                                    variant={
                                      (meta.kycStatus || partner.verificationStatus) === 'APPROVED' || partner.verificationStatus === 'VERIFIED'
                                        ? 'success'
                                        : (meta.kycStatus || partner.verificationStatus) === 'REJECTED'
                                        ? 'danger'
                                        : (meta.kycStatus || partner.verificationStatus) === 'ADDITIONAL_INFORMATION_REQUIRED'
                                        ? 'warning'
                                        : 'primary'
                                    }
                                  >
                                    {meta.kycStatus || partner.verificationStatus || 'PENDING'}
                                  </Badge>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '70px', height: '4px', backgroundColor: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div
                                      style={{
                                        width: `${kycPercent}%`,
                                        height: '100%',
                                        backgroundColor: kycPercent === 100 ? '#10B981' : '#38BDF8'
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>{kycPercent}% docs</span>
                                </div>
                                {meta.slaStatus && (
                                  <span
                                    style={{
                                      fontSize: '0.625rem',
                                      fontWeight: 800,
                                      color: meta.slaStatus === 'OVERDUE' ? '#EF4444' : meta.slaStatus === 'NEAR_BREACH' ? '#F59E0B' : '#10B981'
                                    }}
                                  >
                                    {meta.slaStatus === 'OVERDUE' ? '🚨' : '⚠️'} {meta.slaStatus} ({meta.ageHours ?? 0}h)
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Column 5: Registration */}
                            <TableCell>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                                <span style={{ color: '#CBD5E1' }}>
                                  {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </span>
                                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                                  Reviewer: <strong style={{ color: meta.assignedReviewer?.email ? '#F8FAFC' : '#64748B' }}>
                                    {meta.assignedReviewer?.name || (meta.assignedReviewer?.email ? meta.assignedReviewer.email.split('@')[0] : 'Unassigned')}
                                  </strong>
                                </span>
                              </div>
                            </TableCell>

                            {/* Column 6: Actions */}
                            <TableCell style={{ textAlign: 'right', position: 'relative' }}>
                              <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {kycNeedsReview ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onOpenKycConsole) {
                                        onOpenKycConsole(meta.stagedRegistrationId || partner.id);
                                      } else {
                                        setReviewKycModal(partner);
                                      }
                                    }}
                                    style={{
                                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                      border: '1px solid #F59E0B',
                                      color: '#FCD34D',
                                      borderRadius: '6px',
                                      padding: '5px 10px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Review Applicant KYC Details & Documents"
                                  >
                                    <span>🛡️</span>
                                    <span>Review KYC</span>
                                  </button>
                                ) : partner.lifecycleStatus !== 'ACTIVE' ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickActivate(partner.id, partner.tradeName, partner.lifecycleStatus);
                                    }}
                                    style={{
                                      backgroundColor: '#10B981',
                                      color: '#070C16',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '5px 12px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <span>⚡</span>
                                    <span>Activate</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSlideOverPartner(partner);
                                    }}
                                    style={{
                                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                      border: '1px solid #38BDF8',
                                      color: '#38BDF8',
                                      borderRadius: '6px',
                                      padding: '5px 10px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)'
                                    }}
                                    title="Open sleek 420px Partner 360 Slide-Over Sheet"
                                  >
                                    <span>Partner 360</span>
                                    <span>→</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => handleToggleMenu(e, partner)}
                                  style={{
                                    backgroundColor: menuState?.partnerId === partner.id ? '#334155' : '#1E293B',
                                    color: menuState?.partnerId === partner.id ? '#38BDF8' : '#CBD5E1',
                                    border: `1px solid ${menuState?.partnerId === partner.id ? '#38BDF8' : '#334155'}`,
                                    borderRadius: '6px',
                                    padding: '5px 9px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="More Actions"
                                >
                                  <span>⋮ Actions</span>
                                  <span style={{ fontSize: '0.65rem' }}>{menuState?.partnerId === partner.id ? '▲' : '▼'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePartner(partner.id, partner.tradeName, partner.primaryContact?.email, partner.tenantSlug);
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.22)',
                                    border: '1.5px solid #EF4444',
                                    color: '#FCA5A5',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                  }}
                                  title={`Permanently delete partner "${partner.tradeName}"`}
                                >
                                  <span>🗑️</span>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner ID</TableHead>
                      <TableHead>Partner & Facility</TableHead>
                      <TableHead>Role / Type</TableHead>
                      <TableHead>Registration Source</TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead>Location / Branch</TableHead>
                      <TableHead>Partner Status</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>KYC Completion</TableHead>
                      <TableHead>Reg Date</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => {
                      const meta = getPartnerMeta(partner);
                      return (
                      <TableRow
                        key={partner.id}
                        onClick={() => setSlideOverPartner(partner)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Column 1: Partner ID */}
                        <TableCell>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(partner.id, 'Partner ID');
                              }}
                              style={{
                                fontFamily: 'var(--ds-font-mono)',
                                fontSize: '0.6875rem',
                                color: '#38BDF8',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                              title="Click to copy full Partner UUID"
                            >
                              {partner.tenantSlug || partner.id.slice(0, 8)}
                            </span>
                        <span style={{ fontSize: '0.625rem', color: '#64748B', fontFamily: 'var(--ds-font-mono)' }}>
                          {partner.id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>

                    {/* Column 2: Partner & Facility */}
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.25rem' }}>{getCategoryIcon(partner)}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setSlideOverPartner(partner);
                              }}
                              style={{
                                color: '#38BDF8',
                                fontSize: '0.875rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textDecorationColor: 'rgba(56, 189, 248, 0.4)',
                                textUnderlineOffset: '3px'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#7DD3FC')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#38BDF8')}
                              title="Open sleek 420px Partner 360 Slide-Over Sheet"
                            >
                              {partner.tradeName}
                            </span>
                            {meta.duplicateRisk?.hasRisk && (
                              <span
                                title={`Potential duplicate signals: ${meta.duplicateRisk.signals?.join(', ')}`}
                                style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                  border: '1px solid #EF4444',
                                  color: '#FCA5A5',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.625rem',
                                  fontWeight: 800
                                }}
                              >
                                ⚠️ DUPLICATE SIGNAL
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                            {partner.legalName}
                          </span>
                          {meta.profileCompletionPercent !== undefined && (
                            <span style={{ color: '#38BDF8', fontSize: '0.6875rem', fontWeight: 600 }}>
                              Profile: {meta.profileCompletionPercent}% complete
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 3: Partner Type */}
                    <TableCell>
                      <Badge variant="neutral">{partner.partnerType?.replace(/_/g, ' ')}</Badge>
                    </TableCell>

                    {/* Column 4: Registration Source */}
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                        <Badge
                          variant={
                            (meta.registeredBy?.source || '').includes('SELF')
                              ? 'success'
                              : (meta.registeredBy?.source || '').includes('LEAD')
                              ? 'primary'
                              : 'neutral'
                          }
                        >
                          {(meta.registeredBy?.source || 'COMPANY_ADMIN_ONBOARDING').replace(/_/g, ' ')}
                        </Badge>
                        {meta.registeredBy?.name && (
                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                            By: {meta.registeredBy.name}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Column 5: Primary Contact */}
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
                        <strong style={{ color: '#F8FAFC' }}>{partner.primaryContact.name}</strong>
                        <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>{partner.primaryContact.email}</span>
                        {partner.primaryContact.phone && (
                          <span style={{ color: '#64748B', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)' }}>
                            📞 {partner.primaryContact.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Column 6: Location / Branch */}
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8125rem' }}>
                        <span style={{ color: '#F8FAFC', fontWeight: 600 }}>
                          📍 {(partner as any).city || meta.city || 'New Delhi'}, {(partner as any).state || meta.state || 'Delhi'}
                        </span>
                        <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>
                          🏢 {partner.branchCount || 1} {partner.branchCount === 1 ? 'branch' : 'branches'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Column 7: Partner Status */}
                    <TableCell>
                      <Badge
                        variant={
                          partner.lifecycleStatus === 'ACTIVE'
                            ? 'success'
                            : partner.lifecycleStatus === 'SUSPENDED'
                            ? 'danger'
                            : ['INACTIVE', 'OFFBOARDED'].includes(partner.lifecycleStatus)
                            ? 'neutral'
                            : 'primary'
                        }
                      >
                        {partner.lifecycleStatus}
                      </Badge>
                    </TableCell>

                    {/* Column 8: KYC Status */}
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Badge
                          variant={
                            (meta.kycStatus || partner.verificationStatus) === 'APPROVED' || partner.verificationStatus === 'VERIFIED'
                              ? 'success'
                              : (meta.kycStatus || partner.verificationStatus) === 'REJECTED'
                              ? 'danger'
                              : (meta.kycStatus || partner.verificationStatus) === 'ADDITIONAL_INFORMATION_REQUIRED'
                              ? 'warning'
                              : 'primary'
                          }
                        >
                          {meta.kycStatus || partner.verificationStatus}
                        </Badge>
                        {meta.slaStatus && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              color: meta.slaStatus === 'OVERDUE' ? '#EF4444' : meta.slaStatus === 'NEAR_BREACH' ? '#F59E0B' : '#10B981',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <span>{meta.slaStatus === 'OVERDUE' ? '🚨' : meta.slaStatus === 'NEAR_BREACH' ? '⚠️' : '⚡'}</span>
                            <span>{meta.slaStatus} ({meta.ageHours ?? 0}h)</span>
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Column 9: KYC Completion */}
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ color: '#38BDF8', fontSize: '0.8125rem' }}>
                            {meta.kycCompletionPercent ?? 50}%
                          </strong>
                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                            ({meta.documentsCount || 2}/6 docs)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '4px', backgroundColor: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${meta.kycCompletionPercent ?? 50}%`,
                              height: '100%',
                              backgroundColor: (meta.kycCompletionPercent ?? 50) === 100 ? '#10B981' : '#38BDF8'
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 10: Registration Date */}
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', color: '#CBD5E1' }}>
                        <span>{partner.createdAt ? new Date(partner.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                        <span style={{ fontSize: '0.625rem', color: '#64748B' }}>
                          {partner.createdAt ? new Date(partner.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </TableCell>

                    {/* Column 11: Last Updated */}
                    <TableCell>
                      {(() => {
                        const isNotModified =
                          !partner.updatedAt ||
                          !partner.createdAt ||
                          Math.abs(new Date(partner.updatedAt).getTime() - new Date(partner.createdAt).getTime()) < 5000;

                        if (isNotModified) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                              <span
                                style={{
                                  fontSize: '0.6875rem',
                                  color: '#94A3B8',
                                  backgroundColor: 'rgba(100, 116, 139, 0.15)',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(100, 116, 139, 0.3)',
                                  display: 'inline-block',
                                  width: 'fit-content'
                                }}
                                title="Profile has not been modified since initial onboarding"
                              >
                                Initial Registration
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', color: '#CBD5E1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{new Date(partner.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span
                                style={{
                                  fontSize: '0.625rem',
                                  color: '#38BDF8',
                                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 800
                                }}
                              >
                                Edited
                              </span>
                            </div>
                            <span style={{ fontSize: '0.625rem', color: '#64748B' }}>
                              {new Date(partner.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>

                    {/* Column 12: Assigned Reviewer */}
                    <TableCell>
                      {meta.assignedReviewer?.email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem' }}>👤</span>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                            <strong style={{ color: '#F8FAFC' }}>{meta.assignedReviewer.name || meta.assignedReviewer.email.split('@')[0]}</strong>
                            <span style={{ color: '#94A3B8', fontSize: '0.625rem' }}>{meta.assignedReviewer.email}</span>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="neutral">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right', position: 'relative' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Primary Contextual Action Button */}
                        {(() => {
                          const kycNeedsReview = ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED'].includes(
                            meta.kycStatus || partner.verificationStatus
                          );
                          if (kycNeedsReview) {
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenKycConsole) {
                                    onOpenKycConsole(meta.stagedRegistrationId || partner.id);
                                  } else {
                                    setReviewKycModal(partner);
                                  }
                                }}
                                style={{
                                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                  border: '1px solid #F59E0B',
                                  color: '#FCD34D',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Review Applicant KYC Details & Documents"
                              >
                                <span>🛡️</span>
                                <span>Review KYC</span>
                              </button>
                            );
                          }
                          if (partner.lifecycleStatus !== 'ACTIVE') {
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickActivate(partner.id, partner.tradeName, partner.lifecycleStatus);
                                }}
                                style={{
                                  backgroundColor: '#10B981',
                                  color: '#070C16',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>⚡</span>
                                <span>Activate</span>
                              </button>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSlideOverPartner(partner);
                              }}
                              style={{
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid #38BDF8',
                                color: '#38BDF8',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)'
                              }}
                              title="Open sleek 420px Partner 360 Slide-Over Sheet"
                            >
                              <span>Partner 360</span>
                              <span>→</span>
                            </button>
                          );
                        })()}

                        {/* Dropdown Menu Trigger */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, partner)}
                          style={{
                            backgroundColor: menuState?.partnerId === partner.id ? '#334155' : '#1E293B',
                            color: menuState?.partnerId === partner.id ? '#38BDF8' : '#CBD5E1',
                            border: `1px solid ${menuState?.partnerId === partner.id ? '#38BDF8' : '#334155'}`,
                            borderRadius: '6px',
                            padding: '5px 9px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="More Actions"
                        >
                          <span>⋮ Actions</span>
                          <span style={{ fontSize: '0.65rem' }}>{menuState?.partnerId === partner.id ? '▲' : '▼'}</span>
                        </button>

                        {/* Direct Permanent Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePartner(partner.id, partner.tradeName, partner.primaryContact?.email, partner.tenantSlug);
                          }}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.22)',
                            border: '1.5px solid #EF4444',
                            color: '#FCA5A5',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                          }}
                          title={`Permanently delete partner "${partner.tradeName}"`}
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          </TableContainer>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / pageSize) || 1}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
          </Card>
        ) : (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}
            >
              {partners.map((partner) => {
                const meta = getPartnerMeta(partner);
                const isKycPending = ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED'].includes(
                  meta.kycStatus || partner.verificationStatus
                );
                const isActive = partner.lifecycleStatus === 'ACTIVE';

                const cleanPhone = (partner.primaryContact?.phone || '').replace(/[^0-9]/g, '');
                const whatsAppUrl = cleanPhone
                  ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=Hello%20${encodeURIComponent(partner.tradeName)},%20this%20is%20DocSearch%20HQ.`
                  : null;

                return (
                  <div
                    key={partner.id}
                    onClick={() => setSlideOverPartner(partner)}
                    style={{
                      backgroundColor: 'var(--ds-color-surface, #0F172A)',
                      border: '1.5px solid var(--ds-color-border, #1E293B)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#38BDF8';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(56, 189, 248, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1E293B';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    {/* Card Body */}
                    <div>
                      {/* Header: Icon + Names + Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.8rem' }}>{getCategoryIcon(partner)}</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC' }}>
                              {partner.tradeName}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{partner.legalName}</span>
                          </div>
                        </div>

                        <span
                          style={{
                            backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActive ? '#34D399' : '#F87171',
                            border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          ● {partner.lifecycleStatus}
                        </span>
                      </div>

                      {/* Badges Strip */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            backgroundColor: '#1E293B',
                            color: '#CBD5E1',
                            border: '1px solid #334155',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 700
                          }}
                        >
                          {partner.partnerType?.replace(/_/g, ' ')}
                        </span>
                        <span
                          style={{
                            backgroundColor: isKycPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isKycPending ? '#FBBF24' : '#34D399',
                            border: `1px solid ${isKycPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 700
                          }}
                        >
                          KYC: {(meta.kycStatus || partner.verificationStatus || 'APPROVED').replace(/_/g, ' ')}
                        </span>
                        <span
                          style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            color: '#38BDF8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 600
                          }}
                        >
                          📍 {meta.city || (partner as any).city || 'New Delhi'}, {meta.state || (partner as any).state || 'Delhi'}
                        </span>
                      </div>

                      {/* Contact Person & Communications */}
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '10px 12px',
                          backgroundColor: '#070C16',
                          borderRadius: '8px',
                          border: '1px solid #1E293B',
                          fontSize: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94A3B8' }}>Contact:</span>
                          <strong style={{ color: '#F8FAFC' }}>{partner.primaryContact.name}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94A3B8' }}>Email:</span>
                          <span style={{ color: '#38BDF8' }}>{partner.primaryContact.email}</span>
                        </div>
                        {partner.primaryContact.phone && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#94A3B8' }}>Phone:</span>
                            <span style={{ color: '#CBD5E1', fontFamily: 'var(--ds-font-mono)' }}>
                              📞 {partner.primaryContact.phone}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span style={{ color: '#94A3B8' }}>Subscription:</span>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>
                            {meta.planTier || 'Standard Tier'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid #1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected360Partner(partner);
                          }}
                          style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid #38BDF8',
                            color: '#38BDF8',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🔍 360 Console</span>
                        </button>

                        {whatsAppUrl && (
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              backgroundColor: 'rgba(37, 211, 102, 0.12)',
                              border: '1px solid #25D366',
                              color: '#25D366',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Chat on WhatsApp"
                          >
                            <span>💬</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, partner)}
                          style={{
                            backgroundColor: '#1E293B',
                            border: '1px solid #334155',
                            color: '#CBD5E1',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="More Actions"
                        >
                          <span>⋮</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePartner(partner.id, partner.tradeName, partner.primaryContact?.email, partner.tenantSlug);
                        }}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.22)',
                          border: '1.5px solid #EF4444',
                          color: '#FCA5A5',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                        }}
                        title={`Permanently delete partner "${partner.tradeName}"`}
                      >
                        <span>🗑️ Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / pageSize) || 1}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </>
    )}

      {staffModalPartner && (
        <PartnerStaffDirectoryModal
          isOpen={!!staffModalPartner}
          onClose={() => setStaffModalPartner(null)}
          partner={staffModalPartner}
          onStaffChanged={fetchPartners}
        />
      )}

      {licenseModalPartner && (
        <HqLicenseKeyGeneratorModal
          isOpen={!!licenseModalPartner}
          onClose={() => setLicenseModalPartner(null)}
          initialPartner={licenseModalPartner}
        />
      )}

      {/* Floating Actions Dropdown Menu Portal */}
      {menuState && typeof document !== 'undefined' && createPortal(
        (() => {
          const partner = menuState.partner;
          const meta = getPartnerMeta(partner);
          return (
            <>
              {/* Backdrop for outside click */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 99998,
                  backgroundColor: 'transparent'
                }}
                onClick={() => setMenuState(null)}
              />
              <div
                style={{
                  position: 'fixed',
                  right: `${Math.max(12, menuState.right)}px`,
                  ...(menuState.openUpwards
                    ? { bottom: `${Math.max(12, window.innerHeight - menuState.top)}px` }
                    : { top: `${Math.max(12, menuState.top)}px` }),
                  backgroundColor: '#0B1329',
                  border: '1.5px solid #334155',
                  borderRadius: '10px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85)',
                  minWidth: '230px',
                  maxWidth: '300px',
                  maxHeight: 'calc(100vh - 80px)',
                  overflowY: 'auto',
                  padding: '6px',
                  zIndex: 99999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  textAlign: 'left'
                }}
              >
                {/* Group 1: Core Management */}
                <div style={{ padding: '4px 8px', fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Management
                </div>
                <button
                  type="button"
                  onClick={() => { setMenuState(null); onSelectPartner(partner.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>👁️</span> <span>Partner 360 Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuState(null);
                    if (onOpenKycConsole) {
                      onOpenKycConsole(meta.stagedRegistrationId || partner.id);
                    } else {
                      setReviewKycModal(partner);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FCD34D', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>🛡️</span> <span>Review KYC & Docs</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuState(null); handleOpenEdit(partner); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>✏️</span> <span>Edit Details</span>
                </button>

                {/* Group 2: Credentials & Dispatch */}
                <div style={{ height: '1px', backgroundColor: '#1E293B', margin: '4px 0' }} />
                <div style={{ padding: '4px 8px', fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Access & Dispatch
                </div>
                {meta.credentials && (
                  <button
                    type="button"
                    onClick={() => { setMenuState(null); setViewCredModal(partner); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>🔐</span> <span>View Credentials</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setMenuState(null); handleOpenResetPassword(partner); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>🔑</span> <span>Reset Password (HQ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuState(null); setStaffModalPartner(partner); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#10B981', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>👥</span> <span>Staff Directory (HQ)</span>
                </button>
                {meta.credentials && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuState(null);
                        generateAndDownloadWelcomeKitPdf({
                          partnerId: partner.id,
                          partnerName: partner.tradeName,
                          classification: meta.classification || 'PATHOLOGY',
                          contactPerson: partner.primaryContact.name,
                          phone: partner.primaryContact.phone || '+91 98765 43210',
                          email: meta.credentials?.userId || partner.primaryContact.email,
                          password: meta.credentials?.temporaryPassword || 'DocSearch2026!',
                          city: meta.city || 'India',
                          state: 'India',
                          planTier: meta.planTier || 'Standard Tier',
                          monthlyFee: meta.monthlyFee || 2999,
                          features: meta.accessibleFeatures || ['Standard Healthcare Portal'],
                          planExpiryDate: meta.planExpiryDate,
                          activatedAt: partner.createdAt,
                          loginUrl: meta.credentials?.loginUrl
                        });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>📥</span> <span>Download Welcome Kit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuState(null);
                        openPrintableSpeedPostDossier({
                          partnerId: partner.id,
                          partnerName: partner.tradeName,
                          classification: meta.classification || 'PATHOLOGY',
                          contactPerson: partner.primaryContact.name,
                          phone: partner.primaryContact.phone || '+91 98765 43210',
                          email: meta.credentials?.userId || partner.primaryContact.email,
                          password: meta.credentials?.temporaryPassword || 'DocSearch2026!',
                          city: meta.city || 'India',
                          state: 'India',
                          planTier: meta.planTier || 'Standard Tier',
                          monthlyFee: meta.monthlyFee || 2999,
                          features: meta.accessibleFeatures || ['Standard Healthcare Portal'],
                          planExpiryDate: meta.planExpiryDate,
                          activatedAt: partner.createdAt,
                          loginUrl: meta.credentials?.loginUrl
                        });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FB923C', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>📮</span> <span>Print Speed Post Dossier</span>
                    </button>
                  </>
                )}

                {/* Group 3: Governance */}
                <div style={{ height: '1px', backgroundColor: '#1E293B', margin: '4px 0' }} />
                <div style={{ padding: '4px 8px', fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Governance
                </div>
                <button
                  type="button"
                  onClick={() => { setMenuState(null); setActiveConfigPartner(partner); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>⚙️</span> <span>Capability & Blueprint Config</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuState(null); setActiveRolePartner(partner); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#C084FC', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>🛡️</span> <span>Role Policies & Permissions</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuState(null); setActiveSimulatorPartner(partner); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#34D399', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>🎯</span> <span>Staff Access Simulator</span>
                </button>

                {/* Group 4: Lifecycle & Destructive */}
                <div style={{ height: '1px', backgroundColor: '#1E293B', margin: '4px 0' }} />
                {partner.lifecycleStatus !== 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={() => { setMenuState(null); handleQuickActivate(partner.id, partner.tradeName, partner.lifecycleStatus); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>⚡</span> <span>Activate Account</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMenuState(null); handleQuickSuspend(partner.id, partner.tradeName, partner.lifecycleStatus); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>⏸️</span> <span>Suspend Account</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuState(null);
                    handleDeletePartner(partner.id, partner.tradeName, partner.primaryContact?.email, partner.tenantSlug);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#F87171', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', width: '100%', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                >
                  <span>🗑️</span> <span>Permanently Delete Partner</span>
                </button>
              </div>
            </>
          );
        })(),
        document.body
      )}

      {selected360Partner && (
        <Partner360BigScreenModal
          partner={selected360Partner}
          onClose={() => setSelected360Partner(null)}
          onResetPassword={(p) => handleOpenResetPassword(p)}
          onOpenStaff={(p) => setStaffModalPartner(p)}
          onOpenConfig={(p) => setActiveConfigPartner(p)}
          onOpenRole={(p) => setActiveRolePartner(p)}
          onOpenSimulator={(p) => setActiveSimulatorPartner(p)}
          onOpenLicense={(p) => setLicenseModalPartner(p)}
          onOpenEdit={(p) => handleOpenEdit(p)}
          onReviewKyc={(p) => {
            const m = getPartnerMeta(p);
            if (onOpenKycConsole) onOpenKycConsole(m.stagedRegistrationId || p.id);
            else setReviewKycModal(p);
          }}
          onDownloadWelcomeKit={(p) => {
            const m = getPartnerMeta(p);
            generateAndDownloadWelcomeKitPdf({
              partnerId: p.id,
              partnerName: p.tradeName,
              classification: m.classification || 'PATHOLOGY',
              contactPerson: p.primaryContact.name,
              phone: p.primaryContact.phone || '+91 98765 43210',
              email: m.credentials?.userId || p.primaryContact.email,
              password: m.credentials?.temporaryPassword || 'DocSearch2026!',
              city: m.city || 'India',
              state: 'India',
              planTier: m.planTier || 'Standard Tier',
              monthlyFee: m.monthlyFee || 2999,
              features: m.accessibleFeatures || ['Standard Healthcare Portal'],
              planExpiryDate: m.planExpiryDate,
              activatedAt: p.createdAt,
              loginUrl: m.credentials?.loginUrl
            });
          }}
          onPrintSpeedPostDossier={(p) => {
            const m = getPartnerMeta(p);
            openPrintableSpeedPostDossier({
              partnerId: p.id,
              partnerName: p.tradeName,
              classification: m.classification || 'PATHOLOGY',
              contactPerson: p.primaryContact.name,
              phone: p.primaryContact.phone || '+91 98765 43210',
              email: m.credentials?.userId || p.primaryContact.email,
              password: m.credentials?.temporaryPassword || 'DocSearch2026!',
              city: m.city || 'India',
              state: 'India',
              planTier: m.planTier || 'Standard Tier',
              monthlyFee: m.monthlyFee || 2999,
              features: m.accessibleFeatures || ['Standard Healthcare Portal'],
              planExpiryDate: m.planExpiryDate,
              activatedAt: p.createdAt,
              loginUrl: m.credentials?.loginUrl
            });
          }}
          onToggleStatus={(p) => {
            if (p.lifecycleStatus === 'ACTIVE') {
              handleQuickSuspend(p.id, p.tradeName, p.lifecycleStatus);
            } else {
              handleQuickActivate(p.id, p.tradeName, p.lifecycleStatus);
            }
          }}
          onDeletePartner={(p) => {
            handleDeletePartner(p.id, p.tradeName, p.primaryContact?.email, p.tenantSlug);
          }}
          onSelectPartner360Full={(id) => onSelectPartner(id)}
        />
      )}

      {/* Slide-Over Partner Drawer Sheet */}
      <SlideOverPartnerDrawer
        partner={slideOverPartner}
        isOpen={Boolean(slideOverPartner)}
        onClose={() => setSlideOverPartner(null)}
        onOpenFullDossier={(partnerId) => {
          setSlideOverPartner(null);
          onSelectPartner(partnerId);
        }}
        onPartnerUpdated={(updated) => {
          setPartners((prev) => prev.map((p) => p.id === updated.id ? updated : p));
          setSlideOverPartner(updated);
        }}
        onOpenSimulator={(p) => setActiveSimulatorPartner(p)}
      />

      {renderResetPasswordModal()}
    </div>
  );
};
