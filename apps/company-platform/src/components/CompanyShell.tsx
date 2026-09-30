import React, { useState, useEffect, useRef } from 'react';
import { UniversalAccountSettingsModal } from './common/UniversalAccountSettingsModal.js';
import { GlobalCurrencyLocaleProvider, useGlobalLocale } from './common/GlobalCurrencyLocaleContext.js';
import { GlobalWhiteLabelProvider, useGlobalWhiteLabel } from './common/GlobalWhiteLabelContext.js';
import { AccessibilityLocaleToolbar } from './common/AccessibilityLocaleToolbar.js';
import { GlobalCommandPaletteModal } from './common/GlobalCommandPaletteModal.js';
import { ThemeStudioModal } from './common/ThemeStudioModal.js';
import { HQActionInboxWidget } from './common/HQActionInboxWidget.js';
import {
  AppShell,
  Header,
  Sidebar,
  ContentArea,
  Badge,
  Button,
  Card,
  useTheme,
  themes,
  WorkspaceTabBar,
  type WorkspaceTabItem,
  SkeletonPage,
  EwanSystemTrainer,
  DocSearchLogo,
  LiveSyncRefreshButton
} from '@docsearch/ui-kit';
import { buildPhase1NavSections, PHASE_1_DOMAINS, isDomainAllowedForRole } from '../navigation/phase1-nav.js';

// Lazy-loaded domain managers for optimized bundle size & instantaneous initial load
const ExecutiveCommandCenter = React.lazy(() => import('./executive/ExecutiveCommandCenter.js').then(m => ({ default: m.ExecutiveCommandCenter })));
const MediSphereCommandCenterDashboard = React.lazy(() => import('./executive/MediSphereCommandCenterDashboard.js').then(m => ({ default: m.MediSphereCommandCenterDashboard })));
const PartnerLifecycleManager = React.lazy(() => import('./crm/PartnerLifecycleManager.js').then(m => ({ default: m.PartnerLifecycleManager })));
const ProductDomainManager = React.lazy(() => import('./product/ProductDomainManager.js').then(m => ({ default: m.ProductDomainManager })));
const FinanceDomainManager = React.lazy(() => import('./billing/FinanceDomainManager.js').then(m => ({ default: m.FinanceDomainManager })));
const SalesMarketingDomainManager = React.lazy(() => import('./sales/SalesMarketingDomainManager.js').then(m => ({ default: m.SalesMarketingDomainManager })));
const CustomerSuccessDomainManager = React.lazy(() => import('./support/CustomerSuccessDomainManager.js').then(m => ({ default: m.CustomerSuccessDomainManager })));
const CommunicationDomainManager = React.lazy(() => import('./communication/CommunicationDomainManager.js').then(m => ({ default: m.CommunicationDomainManager })));
const AnalyticsDomainManager = React.lazy(() => import('./analytics/AnalyticsDomainManager.js').then(m => ({ default: m.AnalyticsDomainManager })));
const AIDomainManager = React.lazy(() => import('./ai/AIDomainManager.js').then(m => ({ default: m.AIDomainManager })));
const SecurityDomainManager = React.lazy(() => import('./security/SecurityDomainManager.js').then(m => ({ default: m.SecurityDomainManager })));
const ComplianceDomainManager = React.lazy(() => import('./compliance/ComplianceDomainManager.js').then(m => ({ default: m.ComplianceDomainManager })));
const IntegrationDomainManager = React.lazy(() => import('./integration/IntegrationDomainManager.js').then(m => ({ default: m.IntegrationDomainManager })));
const PlatformEngineeringDomainManager = React.lazy(() => import('./platform-engineering/PlatformEngineeringDomainManager.js').then(m => ({ default: m.PlatformEngineeringDomainManager })));
const InfrastructureDomainManager = React.lazy(() => import('./infrastructure/InfrastructureDomainManager.js').then(m => ({ default: m.InfrastructureDomainManager })));
const CompanyAdminDomainManager = React.lazy(() => import('./company-admin/CompanyAdminDomainManager.js').then(m => ({ default: m.CompanyAdminDomainManager })));
const CompanyGrowthEngineDomainManager = React.lazy(() => import('./growth/CompanyGrowthEngineDomainManager.js').then(m => ({ default: m.CompanyGrowthEngineDomainManager })));
import { GlobalFounderApprovalsModal } from './common/GlobalFounderApprovalsModal.js';
import { useFounderApproval } from '../hooks/useFounderApproval.js';
import { CompanyPulseTicker } from './common/CompanyPulseTicker.js';
import { SlideOverPartnerDrawer } from './crm/SlideOverPartnerDrawer.js';
import { partnerService } from '../services/partner-service.js';
import type { PartnerProfileDto } from '@docsearch/api-contracts';

export interface CompanyShellProps {
  currentUser?: { name: string; email: string; role: string; roleTitle: string } | undefined;
  onLogout?: () => void;
}

const getThemeLabel = (t: string) => {
  switch (t) {
    case themes.OBSIDIAN_TITANIUM: return '🌌 Obsidian';
    case themes.IMPERIAL_GOLD: return '👑 Imperial Gold';
    case themes.QUANTUM_BIOLUM: return '🧬 Biolum';
    case themes.TOKYO_CYBERPUNK: return '⚡ Cyberpunk';
    case themes.SOLAR_AMBER: return '🔥 Solar Amber';
    case themes.SWISS_CLINICAL: return '🇨🇭 Swiss Clinical';
    case (themes as any).DAYLIGHT_CLINIC: return '☀️ Daylight Clinic';
    case themes.ADVANCE_PRO: return '✨ Advance Pro';
    case themes.AURORA_GLOW: return '🌈 Aurora Glow';
    case themes.NORDIC_PURE: return '🏥 Nordic Pure';
    case themes.OCEANIC_NAVY: return '🌊 Oceanic Navy';
    case themes.AYUR_WELLNESS: return '🌿 Ayur Wellness';
    case themes.CYBER_SURGEON: return '💜 Cyber Surgeon';
    case themes.ROSE_CARE: return '🌸 Rose Care';
    case themes.HEALTHCARE_LIGHT: return '🏥 Healthcare Light';
    case themes.BLACK_WHITE: return '🏁 B&W';
    default: return '🎨 Themes';
  }
};

const AccessDeniedShield: React.FC<{
  userRole: string;
  userName?: string | undefined;
  roleTitle?: string | undefined;
  domainId: string;
  domainTitle?: string | undefined;
  onReturn: () => void;
}> = ({ userRole, userName, roleTitle, domainId, domainTitle, onReturn }) => (
  <Card title="Role Access Restricted">
    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#CBD5E1' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          color: '#FCA5A5',
          padding: '4px 12px',
          borderRadius: '8px',
          fontWeight: 800,
          fontSize: '0.8125rem',
          marginBottom: '16px'
        }}
      >
        <span>🔒 403 ACCESS RESTRICTED • ZERO ROLE LEAKAGE ENFORCED</span>
      </div>
      <h2 style={{ color: '#F87171', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>
        Unauthorized Domain: {domainTitle || domainId}
      </h2>
      <p style={{ color: '#94A3B8', maxWidth: '580px', margin: '0 auto 20px auto', fontSize: '0.875rem', lineHeight: '1.6' }}>
        User <strong style={{ color: '#F1F5F9' }}>{userName || 'Staff User'}</strong> with active role{' '}
        <strong style={{ color: '#38BDF8' }}>{roleTitle || userRole}</strong> (<code>{userRole}</code>) does not possess clearance to view or operate in domain <code>{domainId}</code>.
      </p>
      <div
        style={{
          backgroundColor: '#0B1120',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '580px',
          margin: '0 auto 24px auto',
          textAlign: 'left',
          fontSize: '0.75rem',
          color: '#94A3B8',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <div><strong style={{ color: '#CBD5E1' }}>Audit Security Rule:</strong> Role-Based Access Control (RBAC) Isolation Active</div>
        <div><strong style={{ color: '#CBD5E1' }}>Founder Governance:</strong> Restricted domains require Founder or Executive credentials.</div>
        <div><strong style={{ color: '#CBD5E1' }}>Authorized Action:</strong> Please return to your designated operational workspace.</div>
      </div>
      <Button variant="primary" size="md" onClick={onReturn} style={{ fontWeight: 800 }}>
        Return to My Designated Domain ➔
      </Button>
    </div>
  </Card>
);

const CompanyShellInner: React.FC<CompanyShellProps> = ({ currentUser, onLogout }) => {
  const { t } = useGlobalLocale();
  const { whiteLabelConfig } = useGlobalWhiteLabel();
  const effectiveUser = currentUser;
  const userRole = effectiveUser?.role || 'SUPER_ADMIN';
  const isFounderUser =
    effectiveUser?.name?.toUpperCase().includes('MERAJ') ||
    effectiveUser?.email?.toLowerCase().includes('founder') ||
    effectiveUser?.email?.toLowerCase().includes('meraj') ||
    userRole === 'SUPER_ADMIN' ||
    userRole === 'SUPER_ADMIN_FOUNDER' ||
    userRole === 'FOUNDER';

  const getDefaultDomain = (role: string) => {
    switch (role) {
      case 'COMPLIANCE_OFFICER':
      case 'PLATFORM_COMPLIANCE':
      case 'SECURITY_CISO_AUDITOR':
      case 'CLINICAL_OPERATIONS_LEAD':
        return 'compliance-data-governance';
      case 'FINANCE_CONTROLLER':
      case 'FINANCE_MANAGER':
      case 'FINANCE_BILLING_LEAD':
        return 'subscription-billing-finance';
      case 'DEVOPS_LEAD':
        return 'infrastructure-monitoring-dr';
      case 'CLINICAL_AI_SAFETY_LEAD':
        return 'ai-platform-governance';
      case 'CUSTOMER_SUPPORT_LEAD':
      case 'SUPPORT_LEAD':
        return 'customer-success-support';
      case 'FIELD_SALES_REP':
        return 'growth-engine';
      case 'PARTNER_ONBOARDING_LEAD':
        return 'crm-partner-lifecycle';
      case 'SUPER_ADMIN_FOUNDER':
      case 'SUPER_ADMIN':
      case 'FOUNDER':
      default:
        return 'medisphere-command-center';
    }
  };

  const DOMAIN_METADATA_MAP: Record<string, { title: string; icon: string }> = React.useMemo(() => {
    const map: Record<string, { title: string; icon: string }> = {};
    for (const d of PHASE_1_DOMAINS) {
      map[d.id] = { title: d.title, icon: d.icon };
    }
    return map;
  }, []);

  const [activeDomainId, setActiveDomainId] = useState<string>(() => getDefaultDomain(userRole));
  const [domainHistory, setDomainHistory] = useState<string[]>([]);
  const prevDomainRef = useRef<string>(activeDomainId);
  const isBackNavRef = useRef<boolean>(false);

  const [companyTabs, setCompanyTabs] = useState<Array<WorkspaceTabItem>>(() => {
    const def = getDefaultDomain(userRole);
    return [{
      id: def,
      title: 'Command Center',
      icon: '⚡'
    }];
  });
  const [visitedDomains, setVisitedDomains] = useState<Set<string>>(() => new Set([getDefaultDomain(userRole)]));

  useEffect(() => {
    if (prevDomainRef.current !== activeDomainId) {
      if (!isBackNavRef.current) {
        setDomainHistory((prev) => [...prev, prevDomainRef.current]);
      }
      isBackNavRef.current = false;
      prevDomainRef.current = activeDomainId;

      // Reset scroll to top instantly on page change
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }

      // Dispatch smart background re-sync event for target domain
      window.dispatchEvent(
        new CustomEvent('docsearch:domain_activated', {
          detail: { domainId: activeDomainId, timestamp: Date.now() }
        })
      );
    }

    setVisitedDomains((prev) => {
      if (prev.has(activeDomainId)) return prev;
      const next = new Set(prev);
      next.add(activeDomainId);
      return next;
    });

    setCompanyTabs((prev) => {
      if (prev.some((t) => t.id === activeDomainId)) return prev;
      const meta = DOMAIN_METADATA_MAP[activeDomainId] || {
        title: activeDomainId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: '📋'
      };
      const updated = [...prev, { id: activeDomainId, title: meta.title, icon: meta.icon }];
      if (updated.length > 4) {
        return updated.slice(updated.length - 4);
      }
      return updated;
    });
  }, [activeDomainId, DOMAIN_METADATA_MAP]);

  const handleCloseTab = (tabId: string) => {
    setCompanyTabs((prev) => {
      if (prev.length <= 1) return prev;
      const nextTabs = prev.filter((t) => t.id !== tabId);
      if (activeDomainId === tabId) {
        const fallback = nextTabs[nextTabs.length - 1];
        if (fallback) setActiveDomainId(fallback.id);
      }
      return nextTabs;
    });
  };

  const handleCloseOtherTabs = () => {
    setCompanyTabs((prev) => {
      const activeTab = prev.find((t) => t.id === activeDomainId);
      return activeTab ? [activeTab] : prev.slice(0, 1);
    });
  };

  const handleDomainChange = (newDomainId: string) => {
    if (newDomainId !== activeDomainId) {
      setActiveDomainId(newDomainId);
    }
  };

  // Synchronize browser history and popstate
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.domainId) {
        isBackNavRef.current = true;
        setDomainHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1] === e.state.domainId) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setActiveDomainId(e.state.domainId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({ domainId: activeDomainId }, '', window.location.pathname);
    }
  }, [activeDomainId]);

  const handleGoBack = () => {
    if (domainHistory.length > 0) {
      const next = [...domainHistory];
      const prevDomain = next.pop()!;
      isBackNavRef.current = true;
      setDomainHistory(next);
      setActiveDomainId(prevDomain);
    } else {
      const def = getDefaultDomain(userRole);
      if (activeDomainId !== def) {
        setActiveDomainId(def);
      }
    }
  };

  const isCommandCenter = activeDomainId === 'medisphere-command-center' || activeDomainId === 'executive-command-center';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isFounderApprovalsOpen, setIsFounderApprovalsOpen] = useState<boolean>(false);
  const [pendingVerificationCount, setPendingVerificationCount] = useState<number>(0);
  const [showA11yToolbar, setShowA11yToolbar] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { pendingCount } = useFounderApproval(userRole, effectiveUser?.email);
  const { theme } = useTheme();
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState<boolean>(false);
  const [shellDrawerPartner, setShellDrawerPartner] = useState<PartnerProfileDto | null>(null);
  const [isShellDrawerOpen, setIsShellDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleOpenPartnerDrawer = async (e: any) => {
      if (e.detail?.partner) {
        setShellDrawerPartner(e.detail.partner);
        setIsShellDrawerOpen(true);
      } else if (e.detail?.partnerId) {
        try {
          const p = await partnerService.getPartnerById(e.detail.partnerId);
          if (p) {
            setShellDrawerPartner(p);
            setIsShellDrawerOpen(true);
          }
        } catch {}
      }
    };
    window.addEventListener('docsearch:open_partner_drawer', handleOpenPartnerDrawer);
    return () => window.removeEventListener('docsearch:open_partner_drawer', handleOpenPartnerDrawer);
  }, []);

  // Close user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Global listeners for EWAN Master Brain 1-click action triggers
  useEffect(() => {
    const handleOpenThemeStudio = () => setIsThemeStudioOpen(true);
    const handleOpenFounderApprovals = () => setIsFounderApprovalsOpen(true);
    window.addEventListener('docsearch:open_theme_studio', handleOpenThemeStudio);
    window.addEventListener('docsearch:open_founder_approvals', handleOpenFounderApprovals);
    return () => {
      window.removeEventListener('docsearch:open_theme_studio', handleOpenThemeStudio);
      window.removeEventListener('docsearch:open_founder_approvals', handleOpenFounderApprovals);
    };
  }, []);

  // Poll Central Verification Queue for real-time pending hospital registrations
  useEffect(() => {
    const fetchPendingQueue = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
        const res = await fetch('/api/v1/auth/verification-queue', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const pending = json.data.filter((x: any) => x.status === 'PENDING_APPROVAL').length;
            setPendingVerificationCount(pending);
          }
        }
      } catch {}
    };
    void fetchPendingQueue();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchPendingQueue();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navSections = buildPhase1NavSections(
    activeDomainId,
    handleDomainChange,
    userRole,
    pendingVerificationCount
  );

  const fullNavSections = navSections;

  const activeDomain = PHASE_1_DOMAINS.find((d) => d.id === activeDomainId);
  const isCurrentDomainAllowed = isDomainAllowedForRole(activeDomainId, userRole);

  const brandDisplayName = whiteLabelConfig.applyToShell
    ? whiteLabelConfig.hospitalName
    : t('company_platform', 'Company Platform');

  return (
    <AppShell
      intensity={
        activeDomainId === 'executive'
          ? 'command'
          : (activeDomainId === 'support' || activeDomainId === 'audit')
          ? 'operational'
          : 'management'
      }
      sidebar={
        <Sidebar
          brand={
            <DocSearchLogo
              variant={isSidebarCollapsed ? 'icon-only' : 'compact'}
              size="sm"
              badgeText={whiteLabelConfig.applyToShell ? whiteLabelConfig.hospitalName : 'COMPANY HQ'}
              redirectUrl="/"
              clickable={true}
              onClick={() => {
                setActiveDomainId(getDefaultDomain(userRole));
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/');
                }
              }}
            />
          }
          sections={fullNavSections}
          isCollapsed={isSidebarCollapsed}
          width={isSidebarCollapsed ? '68px' : '290px'}
          footerSlot={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {isSidebarCollapsed ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                  title="System Online • v2.6.4 • Company HQ"
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      boxShadow: '0 0 8px #10B981'
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        boxShadow: '0 0 8px #10B981'
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>
                      System Online
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, fontFamily: 'monospace' }}>
                    v2.6.4
                  </span>
                </div>
              )}
            </div>
          }
        />
      }
      header={
        <Header
          onBack={handleGoBack}
          canGoBack={domainHistory.length > 0}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isSidebarCollapsed && (
                <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ds-color-text-primary)', whiteSpace: 'nowrap' }}>
                  {brandDisplayName}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="ds-spring-press"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94A3B8',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                title="Search across domains (Ctrl+K / Cmd+K)"
              >
                <span>🔍</span>
                <span className="ds-hide-on-compact" style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>{t('quick_search', 'Search')}</span>
                <kbd style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#CBD5E1', padding: '1px 4px', borderRadius: '3px', fontSize: '0.625rem' }}>⌘K</kbd>
              </button>
            </div>
          }
          onMenuToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          organizationSlot={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <Badge variant={whiteLabelConfig.applyToShell ? 'primary' : 'neutral'} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                {whiteLabelConfig.applyToShell
                  ? whiteLabelConfig.hospitalName
                  : 'Doc Search HQ'}
              </Badge>
            </div>
          }
          userSlot={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {/* Universal Live Sync / Refresh Button */}
              <LiveSyncRefreshButton />

              {/* 1. Real-time Pending KYC Verification Alert */}
              {pendingVerificationCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('docsearch_crm_tab', 'VERIFICATION');
                    window.dispatchEvent(new CustomEvent('docsearch_switch_crm_tab', { detail: 'VERIFICATION' }));
                    setActiveDomainId('crm-partner-lifecycle');
                  }}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    border: '1.5px solid #EF4444',
                    color: '#FCA5A5',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)',
                    flexShrink: 0
                  }}
                  title="Healthcare Partners awaiting KYC & document verification"
                >
                  <span>🏥</span>
                  <span>KYC</span>
                  <span style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '1px 5px', borderRadius: '8px', fontSize: '0.625rem', fontWeight: 700 }}>
                    {pendingVerificationCount}
                  </span>
                  <span className="ds-hide-on-compact" style={{ color: '#F87171', fontSize: '0.6875rem', fontWeight: 600 }}>Review →</span>
                </button>
              )}

              {/* 2. Executive Pending Approvals Alert Pill (Only when > 0) */}
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsFounderApprovalsOpen(true)}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #EF4444',
                    color: '#FCA5A5',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title="Pending Founder Approvals • Executive Governance"
                >
                  <span>👑</span>
                  <span className="ds-hide-on-compact">Approvals</span>
                  <span style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '1px 5px', borderRadius: '8px', fontSize: '0.625rem', fontWeight: 700 }}>
                    {pendingCount}
                  </span>
                </button>
              )}

              {/* 3. Master User Profile Pill with Floating Dropdown */}
              <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '3px 10px 3px 6px',
                    borderRadius: '10px',
                    backgroundColor: isUserMenuOpen ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    border: isUserMenuOpen ? '1.5px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (!isUserMenuOpen) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isUserMenuOpen) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  title="Account & Session Menu"
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.8125rem',
                      boxShadow: '0 0 8px rgba(6, 182, 212, 0.35)',
                      flexShrink: 0,
                      position: 'relative'
                    }}
                  >
                    👑
                    {pendingCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-1px',
                          right: '-1px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: '#EF4444',
                          border: '1.5px solid #0F172A'
                        }}
                      />
                    )}
                  </div>
                  <div className="ds-hide-on-compact" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--ds-color-text-primary)', lineHeight: 1.2 }}>
                        {effectiveUser?.name || 'MERAJ SHARIF'}
                      </span>
                      {isFounderUser && (
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid #10B981',
                            color: '#6EE7B7',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          🛡️ FOUNDER SHIELD
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 500, lineHeight: 1.1 }}>
                      {effectiveUser?.roleTitle || effectiveUser?.role || 'Founder & SuperAdmin'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      color: '#94A3B8',
                      marginLeft: '2px',
                      transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Floating User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '270px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                      zIndex: 9999,
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    {/* User Profile Card */}
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid #1E293B', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC' }}>
                        {effectiveUser?.name || 'MERAJ SHARIF'}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {effectiveUser?.email || 'founder@docsearch.health'}
                      </div>
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(6, 182, 212, 0.2)',
                            color: '#38BDF8',
                            border: '1px solid rgba(6, 182, 212, 0.4)'
                          }}
                        >
                          {effectiveUser?.role || 'SUPER_ADMIN'}
                        </span>
                      </div>

                      {/* Founder Shield Protected Card */}
                      {isFounderUser && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '8px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            boxShadow: '0 0 14px rgba(6, 182, 212, 0.2)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '1rem' }}>🛡️</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.02em' }}>
                              FOUNDER SHIELD ACTIVE
                            </span>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', lineHeight: '1.3' }}>
                            Immutable Root Account: <strong>MERAJ SHARIF</strong>
                          </div>
                          <div style={{ fontSize: '0.625rem', color: '#94A3B8', marginTop: '2px' }}>
                            🔒 Protected against modification, deactivation, and removal.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Approvals Hub */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFounderApprovalsOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#CBD5E1',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👑</span>
                        <span>Approvals Hub</span>
                      </div>
                      {pendingCount > 0 && (
                        <span style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '1px 6px', borderRadius: '8px', fontSize: '0.625rem', fontWeight: 700 }}>
                          {pendingCount}
                        </span>
                      )}
                    </button>

                    {/* Theme Studio */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsThemeStudioOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#CBD5E1',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎨</span>
                        <span>Theme Studio</span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                        {getThemeLabel(theme)}
                      </span>
                    </button>

                    {/* Settings */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#CBD5E1',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>⚙️</span>
                      <span>Account & Settings</span>
                    </button>

                    {/* Kiosk Fullscreen Mode */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (!document.fullscreenElement) {
                          if (document.documentElement.requestFullscreen) {
                            document.documentElement.requestFullscreen().catch(() => {});
                          } else if ((document.documentElement as any).webkitRequestFullscreen) {
                            (document.documentElement as any).webkitRequestFullscreen();
                          }
                        } else {
                          if (document.exitFullscreen) {
                            document.exitFullscreen().catch(() => {});
                          } else if ((document as any).webkitExitFullscreen) {
                            (document as any).webkitExitFullscreen();
                          }
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#CBD5E1',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⛶</span>
                        <span>Kiosk Fullscreen Mode</span>
                      </div>
                      <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#94A3B8', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        F11 / Ctrl+Shift+F
                      </span>
                    </button>

                    {/* Divider */}
                    <div style={{ height: '1px', backgroundColor: '#1E293B', margin: '4px 0' }} />

                    {/* Logout */}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: '#F87171',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                          e.currentTarget.style.color = '#EF4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#F87171';
                        }}
                      >
                        <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>🚪</span>
                        <span>Log Out</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          }
        />
      }
    >
      {isCommandCenter && <CompanyPulseTicker />}
      {/* PERSISTENT MULTI-TASK WORKSPACE TAB BAR */}
      <WorkspaceTabBar
        tabs={companyTabs}
        activeTabId={activeDomainId}
        onSelectTab={(tabId: string) => {
          if (activeDomainId !== tabId) {
            setActiveDomainId(tabId);
          }
        }}
        onCloseTab={handleCloseTab}
        onCloseOtherTabs={handleCloseOtherTabs}
        onNewTask={() => setIsCommandPaletteOpen(true)}
        newTaskLabel="New Tab"
      />
      <ContentArea>
        {/* Real-World Corporate Daily Operations Quick Bar - Only shown in Command Center */}
        {isCommandCenter && (
          <>
            <HQActionInboxWidget
              onNavigateToPartnerLifecycle={() => setActiveDomainId('crm-partner-lifecycle')}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#0F172A',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '10px 16px',
                marginBottom: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
          {/* Left: Quick Jump to Daily Core Hubs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: '4px' }}>
              ⚡ Quick Actions:
            </span>

            {/* 1. Hospital Verification */}
            <button
              type="button"
              onClick={() => setActiveDomainId('crm-partner-lifecycle')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#1E293B',
                color: '#F1F5F9'
              }}
            >
              <span>🏥 Partner Verification</span>
              {pendingVerificationCount > 0 ? (
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    fontSize: '0.6875rem',
                    fontWeight: 900
                  }}
                >
                  {pendingVerificationCount} PENDING
                </span>
              ) : (
                <span style={{ backgroundColor: '#10B981', color: '#FFF', padding: '1px 6px', borderRadius: '10px', fontSize: '0.6875rem' }}>
                  ✓
                </span>
              )}
            </button>

            {/* 2a. Medisphere OS */}
            <button
              type="button"
              onClick={() => setActiveDomainId('medisphere-command-center')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                border: activeDomainId === 'medisphere-command-center' ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: activeDomainId === 'medisphere-command-center' ? 'rgba(6, 182, 212, 0.2)' : '#1E293B',
                color: activeDomainId === 'medisphere-command-center' ? '#38BDF8' : '#F1F5F9'
              }}
            >
              <span>⚡ Medisphere OS</span>
            </button>

            {/* 2b. Executive Command Center */}
            <button
              type="button"
              onClick={() => setActiveDomainId('executive-command-center')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                border: activeDomainId === 'executive-command-center' ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: activeDomainId === 'executive-command-center' ? 'rgba(6, 182, 212, 0.2)' : '#1E293B',
                color: activeDomainId === 'executive-command-center' ? '#38BDF8' : '#F1F5F9'
              }}
            >
              <span>📊 Exec Telemetry</span>
            </button>

            {/* 3. Partner CRM */}
            <button
              type="button"
              onClick={() => setActiveDomainId('crm-partner-lifecycle')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#1E293B',
                color: '#F1F5F9'
              }}
            >
              <span>🤝 Partners</span>
            </button>

            {/* 4. Monetization & Growth Engine */}
            <button
              type="button"
              onClick={() => setActiveDomainId('growth-engine')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#1E293B',
                color: '#F1F5F9'
              }}
            >
              <span>👑 Growth Engine</span>
            </button>

            {/* 5. Invoicing & GST */}
            <button
              type="button"
              onClick={() => setActiveDomainId('subscription-billing-finance')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#1E293B',
                color: '#F1F5F9'
              }}
            >
              <span>💳 Finance & GST</span>
            </button>

            {/* 6. Support Tickets */}
            <button
              type="button"
              onClick={() => setActiveDomainId('customer-success-support')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#1E293B',
                color: '#F1F5F9'
              }}
            >
              <span>🎧 Support Desk</span>
            </button>
          </div>

          {/* Right: Refresh & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isFounderUser && (
              <button
                type="button"
                onClick={() => setIsFounderApprovalsOpen(true)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: pendingCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: pendingCount > 0 ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: pendingCount > 0 ? '#FCA5A5' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>👑 Approvals</span>
                {pendingCount > 0 && (
                  <span style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '1px 5px', borderRadius: '6px', fontSize: '0.625rem' }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowA11yToolbar((prev) => !prev)}
              style={{
                padding: '4px 10px',
                backgroundColor: showA11yToolbar ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                border: showA11yToolbar ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: showA11yToolbar ? '#86EFAC' : '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Configure multi-currency and WCAG 2.2 accessibility"
            >
              🌐 {showA11yToolbar ? 'Hide FX' : 'FX & A11y'}
            </button>
          </div>
        </div>

        {/* Collapsible Global Multi-Currency & Accessibility Toolbar */}
        {showA11yToolbar && <AccessibilityLocaleToolbar />}
          </>
        )}

        {/* If Active Domain is NOT allowed for Current User Role: STRICT ZERO-LEAKAGE ACCESS SHIELD */}
        {!isCurrentDomainAllowed ? (
          <AccessDeniedShield
            userRole={userRole}
            userName={effectiveUser?.name}
            roleTitle={effectiveUser?.roleTitle}
            domainId={activeDomainId}
            domainTitle={activeDomain?.title}
            onReturn={() => setActiveDomainId(getDefaultDomain(userRole))}
          />
        ) : (
          <React.Suspense fallback={<SkeletonPage metricCount={4} layout="table" />}>
            {visitedDomains.has('medisphere-command-center') && (
              <div style={{ display: activeDomainId === 'medisphere-command-center' ? 'block' : 'none' }}>
                <MediSphereCommandCenterDashboard
                  onNavigateToDomain={setActiveDomainId}
                  onOpenOnboardingWizard={() => setActiveDomainId('crm-partner-lifecycle')}
                />
              </div>
            )}
            {visitedDomains.has('executive-command-center') && (
              <div style={{ display: activeDomainId === 'executive-command-center' ? 'block' : 'none' }}>
                <ExecutiveCommandCenter />
              </div>
            )}
            {visitedDomains.has('growth-engine') && (
              <div style={{ display: activeDomainId === 'growth-engine' ? 'block' : 'none' }}>
                <CompanyGrowthEngineDomainManager
                  currentUserRole={userRole}
                  currentUserName={effectiveUser?.name}
                  currentUserEmail={effectiveUser?.email}
                />
              </div>
            )}
            {visitedDomains.has('crm-partner-lifecycle') && (
              <div style={{ display: activeDomainId === 'crm-partner-lifecycle' ? 'block' : 'none' }}>
                <PartnerLifecycleManager />
              </div>
            )}
            {visitedDomains.has('product-plans-entitlements') && (
              <div style={{ display: activeDomainId === 'product-plans-entitlements' ? 'block' : 'none' }}>
                <ProductDomainManager />
              </div>
            )}
            {visitedDomains.has('subscription-billing-finance') && (
              <div style={{ display: activeDomainId === 'subscription-billing-finance' ? 'block' : 'none' }}>
                <FinanceDomainManager />
              </div>
            )}
            {visitedDomains.has('sales-marketing') && (
              <div style={{ display: activeDomainId === 'sales-marketing' ? 'block' : 'none' }}>
                <SalesMarketingDomainManager />
              </div>
            )}
            {visitedDomains.has('customer-success-support') && (
              <div style={{ display: activeDomainId === 'customer-success-support' ? 'block' : 'none' }}>
                <CustomerSuccessDomainManager />
              </div>
            )}
            {(visitedDomains.has('communication-broadcasting') || visitedDomains.has('communication-content')) && (
              <div style={{ display: (activeDomainId === 'communication-broadcasting' || activeDomainId === 'communication-content') ? 'block' : 'none' }}>
                <CommunicationDomainManager />
              </div>
            )}
            {(visitedDomains.has('analytics-reporting-bi') || visitedDomains.has('analytics-bi-intelligence')) && (
              <div style={{ display: (activeDomainId === 'analytics-reporting-bi' || activeDomainId === 'analytics-bi-intelligence') ? 'block' : 'none' }}>
                <AnalyticsDomainManager />
              </div>
            )}
            {(visitedDomains.has('ai-clinical-intelligence') || visitedDomains.has('ai-platform-governance')) && (
              <div style={{ display: (activeDomainId === 'ai-clinical-intelligence' || activeDomainId === 'ai-platform-governance') ? 'block' : 'none' }}>
                <AIDomainManager />
              </div>
            )}
            {visitedDomains.has('security-rbac-policy-audit') && (
              <div style={{ display: activeDomainId === 'security-rbac-policy-audit' ? 'block' : 'none' }}>
                <SecurityDomainManager />
              </div>
            )}
            {(visitedDomains.has('compliance-regulatory-legal') || visitedDomains.has('compliance-data-governance')) && (
              <div style={{ display: (activeDomainId === 'compliance-regulatory-legal' || activeDomainId === 'compliance-data-governance') ? 'block' : 'none' }}>
                <ComplianceDomainManager />
              </div>
            )}
            {visitedDomains.has('api-integration-interoperability') && (
              <div style={{ display: activeDomainId === 'api-integration-interoperability' ? 'block' : 'none' }}>
                <IntegrationDomainManager />
              </div>
            )}
            {(visitedDomains.has('platform-engineering-devops') || visitedDomains.has('platform-engineering')) && (
              <div style={{ display: (activeDomainId === 'platform-engineering-devops' || activeDomainId === 'platform-engineering') ? 'block' : 'none' }}>
                <PlatformEngineeringDomainManager />
              </div>
            )}
            {(visitedDomains.has('infrastructure-cloud-ops') || visitedDomains.has('infrastructure-monitoring-dr')) && (
              <div style={{ display: (activeDomainId === 'infrastructure-cloud-ops' || activeDomainId === 'infrastructure-monitoring-dr') ? 'block' : 'none' }}>
                <InfrastructureDomainManager />
              </div>
            )}
            {visitedDomains.has('company-admin-governance') && (
              <div style={{ display: activeDomainId === 'company-admin-governance' ? 'block' : 'none' }}>
                <CompanyAdminDomainManager
                  currentUserRole={userRole}
                  currentUserName={effectiveUser?.name}
                  currentUserEmail={effectiveUser?.email}
                />
              </div>
            )}

            {/* Fallback for unmounted domains */}
            {![
              'medisphere-command-center',
              'executive-command-center',
              'growth-engine',
              'crm-partner-lifecycle',
              'product-plans-entitlements',
              'subscription-billing-finance',
              'sales-marketing',
              'customer-success-support',
              'communication-broadcasting',
              'communication-content',
              'analytics-reporting-bi',
              'analytics-bi-intelligence',
              'ai-clinical-intelligence',
              'ai-platform-governance',
              'security-rbac-policy-audit',
              'compliance-regulatory-legal',
              'compliance-data-governance',
              'api-integration-interoperability',
              'platform-engineering-devops',
              'platform-engineering',
              'infrastructure-cloud-ops',
              'infrastructure-monitoring-dr',
              'company-admin-governance'
            ].includes(activeDomainId) && (
              <Card title={`${activeDomain?.title || 'Operational Domain'}`}>
                <div
                  style={{
                    padding: '48px',
                    textAlign: 'center',
                    color: 'var(--ds-color-text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>{activeDomain?.icon}</div>
                  <h3 style={{ margin: 0, color: 'var(--ds-color-text-primary)' }}>
                    {activeDomain?.title} Module
                  </h3>
                  <p style={{ margin: 0, maxWidth: '500px', fontSize: '0.875rem' }}>
                    This operational module is currently being provisioned.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveDomainId(getDefaultDomain(userRole))}
                  >
                    Return to My Assigned Dashboard
                  </Button>
                </div>
              </Card>
            )}
          </React.Suspense>
        )}
      </ContentArea>
      <UniversalAccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
      />
      <GlobalCommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateDomain={(domainId) => setActiveDomainId(domainId)}
        userRole={userRole}
      />
      <GlobalFounderApprovalsModal
        isOpen={isFounderApprovalsOpen}
        onClose={() => setIsFounderApprovalsOpen(false)}
        currentUserRole={userRole}
        currentUserName={effectiveUser?.name}
        currentUserEmail={effectiveUser?.email}
      />
      <ThemeStudioModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
      />
      {/* Slide-Over Partner Drawer */}
      <SlideOverPartnerDrawer
        partner={shellDrawerPartner}
        isOpen={isShellDrawerOpen}
        onClose={() => setIsShellDrawerOpen(false)}
        onOpenFullDossier={(_partnerId) => {
          setIsShellDrawerOpen(false);
          try {
            if (_partnerId) localStorage.setItem('docsearch_crm_partner_id', _partnerId);
          } catch {}
          setActiveDomainId('crm-partner-lifecycle');
        }}
        onPartnerUpdated={(updated) => setShellDrawerPartner(updated)}
      />
      {/* UNIVERSAL MASTER BRAIN & AI SYSTEM TRAINER — EWAN */}
      <EwanSystemTrainer
        currentPlatform="COMPANY_HQ"
        activeModule={activeDomainId}
        currentUser={currentUser ? {
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          roleTitle: currentUser.roleTitle
        } : undefined}
        onNavigate={(domainId) => setActiveDomainId(domainId)}
      />
    </AppShell>
  );
};

export const CompanyShell: React.FC<CompanyShellProps> = (props) => {
  return (
    <GlobalWhiteLabelProvider>
      <GlobalCurrencyLocaleProvider>
        <CompanyShellInner {...props} />
      </GlobalCurrencyLocaleProvider>
    </GlobalWhiteLabelProvider>
  );
};
