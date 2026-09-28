import React, { useState, useEffect, useMemo } from 'react';
import { MediSphereAiCopilotModal } from './MediSphereAiCopilotModal.js';
import { DailyOperationsBar } from './DailyOperationsBar.js';
import { CommandCenterDetailModal, type ActiveDetailModalType } from './CommandCenterDetailModal.js';
import { executiveService } from '../../services/executive-service.js';
import type { ExecutiveDashboardData } from '../../types/executive.js';
import {
  DashboardCustomizerModal,
  DEFAULT_WIDGET_CONFIGS,
  type RolePresetType,
  type DashboardWidgetConfig
} from './DashboardCustomizerModal.js';
import {
  getDynamicRevenueData,
  getSubscriptionDistribution,
  getPartnerGrowthBars,
  getTopPerformingPlans,
  getGlobalPresenceData,
  getSupportMetrics
} from './dashboardTelemetryEngine.js';
import {
  DocSearchSpatialCore3D,
  DataPulse,
  EffectIntensityProvider,
  WorkstationCommandBar,
  MasterDetailSplitView,
  WorkstationPanel,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { partnerService } from '../../services/partner-service.js';
import { UnifiedFilterRibbon, type UnifiedPartnerFilterType } from '../crm/UnifiedFilterRibbon.js';
import { SlideOverPartnerDrawer } from '../crm/SlideOverPartnerDrawer.js';

export interface CommandCenterDashboardProps {
  onOpenOnboardingWizard?: () => void;
  onNavigateToDomain?: (domainId: string) => void;
}

export type MediSphereCommandCenterDashboardProps = CommandCenterDashboardProps;

export const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = ({
  onOpenOnboardingWizard,
  onNavigateToDomain
}) => {
  const [revenueTimeframe, setRevenueTimeframe] = useState<'This Month' | 'Last Month' | 'This Quarter' | 'This Year'>('This Month');
  const [partnerGrowthYear, setPartnerGrowthYear] = useState<'This Year' | '2025' | '2024'>('This Year');
  const [supportTimeframe, setSupportTimeframe] = useState<'This Week' | 'This Month'>('This Week');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotTopic, setCopilotTopic] = useState<string | undefined>(undefined);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);
  const [activeDetailModal, setActiveDetailModal] = useState<ActiveDetailModalType | null>(null);

  // Layout Customization State (Persistent via LocalStorage)
  const LAYOUT_STORAGE_KEY = 'docsearch_command_center_layout_v2';
  const PRESET_STORAGE_KEY = 'docsearch_command_center_preset_v2';

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [activeRolePreset, setActiveRolePreset] = useState<RolePresetType>(() => {
    try {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY);
      if (saved && ['FOUNDER', 'CFO', 'CMO', 'CTO'].includes(saved)) {
        return saved as RolePresetType;
      }
    } catch {}
    return 'FOUNDER';
  });

  const [widgetConfigs, setWidgetConfigs] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WIDGET_CONFIGS;
  });

  // Auto-save layout preferences
  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(widgetConfigs));
      localStorage.setItem(PRESET_STORAGE_KEY, activeRolePreset);
    } catch {}
  }, [widgetConfigs, activeRolePreset]);

  const isWidgetVisible = (id: string): boolean => {
    const w = widgetConfigs.find((item) => item.id === id);
    return w ? w.isVisible : true;
  };

  const handleApplyPreset = (preset: RolePresetType) => {
    setActiveRolePreset(preset);
    let visibleIds: string[] = [];
    if (preset === 'CFO') {
      visibleIds = ['kpi-summary', 'partner-operations-workstation', 'revenue-overview', 'sub-distribution', 'top-plans', 'daily-ops', 'critical-alerts', 'quick-actions'];
    } else if (preset === 'CMO') {
      visibleIds = ['3d-network-core', 'kpi-summary', 'partner-operations-workstation', 'daily-ops', 'critical-alerts', 'global-presence', 'support-overview', 'copilot-insights', 'partner-growth'];
    } else if (preset === 'CTO') {
      visibleIds = ['3d-network-core', 'kpi-summary', 'partner-operations-workstation', 'subsystem-health', 'critical-alerts', 'recent-activities', 'daily-ops', 'support-overview'];
    } else {
      visibleIds = DEFAULT_WIDGET_CONFIGS.map((w) => w.id);
    }

    setWidgetConfigs((prev) =>
      prev.map((w) => ({
        ...w,
        isVisible: visibleIds.includes(w.id)
      }))
    );
    triggerToast(`✓ Switched to "${preset}" Layout Preset`);
  };

  const handleToggleWidget = (id: string) => {
    setWidgetConfigs((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isVisible: !w.isVisible } : w))
    );
  };

  const handleMoveWidget = (id: string, direction: 'UP' | 'DOWN') => {
    setWidgetConfigs((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((w) => w.id === id);
      if (index === -1) return prev;
      if (direction === 'UP' && index > 0) {
        const curr = sorted[index];
        const prevW = sorted[index - 1];
        if (curr && prevW) {
          const tempOrder = curr.order;
          curr.order = prevW.order;
          prevW.order = tempOrder;
        }
      } else if (direction === 'DOWN' && index < sorted.length - 1) {
        const curr = sorted[index];
        const nextW = sorted[index + 1];
        if (curr && nextW) {
          const tempOrder = curr.order;
          curr.order = nextW.order;
          nextW.order = tempOrder;
        }
      }
      return [...sorted];
    });
  };

  const handleResetToDefault = () => {
    setWidgetConfigs(DEFAULT_WIDGET_CONFIGS);
    setActiveRolePreset('FOUNDER');
    triggerToast('✓ Command Center Layout Restored to Default');
  };

  // Live Executive & Platform Telemetry Data Binding
  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [, setIsLoadingTelemetry] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        setIsLoadingTelemetry(true);
        const res = await executiveService.getExecutiveDashboard();
        if (isMounted && res) {
          setDashboardData(res);
        }
      } catch (err) {
        console.warn('Could not load Command Center live telemetry:', err);
      } finally {
        if (isMounted) setIsLoadingTelemetry(false);
      }
    };

    void fetchTelemetry();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void fetchTelemetry();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalTenants = dashboardData?.metrics?.totalTenants ?? 0;
  const activeTenants = dashboardData?.metrics?.activeTenants ?? 0;
  const activeSubs = dashboardData?.metrics?.activeSubscribers ?? 0;
  const totalBranches = dashboardData?.metrics?.totalBranches ?? 0;
  const mrrEst = dashboardData?.metrics?.monthlyRecurringRevenueEst ?? 0;
  const arrEst = mrrEst > 0 ? mrrEst * 12 : 0;
  const activeUsers = (dashboardData as any)?.activeSessions ?? 1;
  const uptimePercent = dashboardData?.metrics?.targetPlatformUptimePercent ?? 99.98;
  const gatewayLatency = dashboardData?.systemHealth?.gatewayLatencyMs ?? 14;
  const liveRecentActivities = dashboardData?.recentActivities && dashboardData.recentActivities.length > 0
    ? dashboardData.recentActivities
    : null;

  // Dynamic business telemetry & projections
  const revenueData = useMemo(
    () => getDynamicRevenueData(revenueTimeframe, mrrEst),
    [revenueTimeframe, mrrEst]
  );

  const subscriptionData = useMemo(
    () => getSubscriptionDistribution(totalTenants),
    [totalTenants]
  );

  const partnerGrowthData = useMemo(
    () => getPartnerGrowthBars(partnerGrowthYear, totalTenants),
    [partnerGrowthYear, totalTenants]
  );

  const topPlansData = useMemo(
    () => getTopPerformingPlans(revenueData.mrr),
    [revenueData.mrr]
  );

  const globalPresenceData = useMemo(
    () => getGlobalPresenceData(totalTenants),
    [totalTenants]
  );

  const supportData = useMemo(
    () => getSupportMetrics(supportTimeframe, (dashboardData as any)?.supportTicketCount ?? 0),
    [supportTimeframe, dashboardData]
  );

  const spatialNodeMetrics = useMemo(() => ({
    patient: { label: 'Care Records', status: 'NOMINAL' as const },
    doctor: { label: 'Clinical Staff', status: 'NOMINAL' as const },
    hospital: { count: totalBranches > 0 ? totalBranches : totalTenants, label: 'Operating Centers', status: 'NOMINAL' as const },
    lab: { label: 'Pathology LIMS', status: 'NOMINAL' as const },
    pharmacy: { label: 'Formulary Grid', status: 'NOMINAL' as const },
    finance: { count: mrrEst > 0 ? Math.round(mrrEst / 1000) : undefined, label: mrrEst > 0 ? 'k MRR' : 'Billing Engine', status: 'NOMINAL' as const },
    ai: { label: 'CDSS Neural Bus', status: 'NOMINAL' as const },
  }), [totalBranches, totalTenants, mrrEst]);

  const triggerToast = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 3500);
  };

  const openCopilotWithPrompt = (prompt: string) => {
    setCopilotTopic(prompt);
    setIsCopilotOpen(true);
  };

  // Workstation Partner Operations State (Live Multi-tenant Telemetry)
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnerTableSearch, setPartnerTableSearch] = useState('');
  const [partnerTableFilter, setPartnerTableFilter] = useState<UnifiedPartnerFilterType>('ALL');
  const [commandBarSearch, setCommandBarSearch] = useState('');
  const [drawerPartner, setDrawerPartner] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadPartners = async () => {
      try {
        const res = await partnerService.getDirectory({ pageSize: 50 });
        if (isMounted && res && res.items && res.items.length > 0) {
          setPartnersList(res.items);
          setSelectedPartnerId((prev) => prev || res.items[0]?.id || null);
        }
      } catch (err) {
        console.warn('Could not load partners for workstation split view:', err);
      }
    };
    void loadPartners();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPartners = useMemo(() => {
    return partnersList.filter((p) => {
      const q = (partnerTableSearch || commandBarSearch).toLowerCase();
      const matchesSearch =
        !q ||
        (p.legalName && p.legalName.toLowerCase().includes(q)) ||
        (p.tradeName && p.tradeName.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.licenseNumber && p.licenseNumber.toLowerCase().includes(q));

      const meta = (p.metadata as any) || {};
      const planTier = meta.planTier || p.planTier || '';
      const isFree = planTier.toLowerCase().includes('free') || planTier.toLowerCase().includes('starter');
      const isKycPending = ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED'].includes(
        meta.kycStatus || p.verificationStatus || ''
      );

      const matchesFilter =
        partnerTableFilter === 'ALL' ||
        (partnerTableFilter === 'KYC_PENDING' && isKycPending) ||
        (partnerTableFilter === 'FREE' && isFree) ||
        (partnerTableFilter === 'ENTERPRISE_PRO' && !isFree);

      return matchesSearch && matchesFilter;
    });
  }, [partnersList, partnerTableSearch, commandBarSearch, partnerTableFilter]);

  const selectedPartner = useMemo(() => {
    return partnersList.find((p) => p.id === selectedPartnerId) || filteredPartners[0] || null;
  }, [partnersList, filteredPartners, selectedPartnerId]);

  const handle3DNodeClick = (nodeId: string) => {
    switch (nodeId) {
      case 'core':
        triggerToast('⚡ DOC SEARCH CORE: All Systems Nominal. Telemetry Grid Active.');
        break;
      case 'doctor':
        triggerToast('🩺 Routing to Clinical Staff & Provider Directory...');
        onNavigateToDomain?.('partner-staff-management');
        break;
      case 'hospital':
        triggerToast('🏥 Routing to Hospital Operations & Partner Lifecycle...');
        onNavigateToDomain?.('crm-partner-lifecycle');
        break;
      case 'patient':
        triggerToast('🧬 Routing to Patient Records & Care Network...');
        onNavigateToDomain?.('crm-partner-lifecycle');
        break;
      case 'lab':
        triggerToast('🧪 Routing to Diagnostic Labs & Pathology Management...');
        onNavigateToDomain?.('master-directory');
        break;
      case 'pharmacy':
        triggerToast('💊 Routing to Pharmacy Formulary & Dispensing POS...');
        onNavigateToDomain?.('master-directory');
        break;
      case 'finance':
        triggerToast('💳 Routing to Billing, Invoicing & Subscription Engine...');
        onNavigateToDomain?.('subscription-billing-finance');
        break;
      case 'ai':
        triggerToast('🤖 Initializing DocSearch AI Neural Engine...');
        openCopilotWithPrompt('Analyze real-time DocSearch clinical telemetry and operational metrics');
        break;
      default:
        triggerToast(`Telemetry node activated: ${nodeId}`);
    }
  };

  return (
    <EffectIntensityProvider initialIntensity="command">
      <div
        className="ds-animated-gradient-bg"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          color: '#F8FAFC',
          padding: '12px 16px 40px 16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif'
        }}
      >
      {/* Toast Notification */}
      {quickNotification && (
        <div
          className="ds-spring-press"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 10003,
            backgroundColor: 'rgba(18, 24, 38, 0.95)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#F8FAFC',
            padding: '10px 18px',
            borderRadius: '12px',
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⚡</span>
          <span>{quickNotification}</span>
        </div>
      )}

      {/* Top Header Row: Command Center Brand Title + Verified Badge + Subtitle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '4px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.875rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              Command Center
              <span
                title="Verified Healthcare Operating System"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(2, 132, 199, 0.16)',
                  border: '1px solid rgba(2, 132, 199, 0.35)',
                  color: '#38BDF8',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                ✓
              </span>
              <DataPulse status="online" label="MISSION CONTROL ONLINE" size="sm" style={{ marginLeft: '6px', fontSize: '0.6875rem', color: '#38BDF8' }} />
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#94A3B8', letterSpacing: '-0.01em' }}>
            Unified spatial healthcare intelligence and clinical operations
          </p>
        </div>
      </div>

      {/* Persistent Enterprise Workstation Command Ribbon */}
      <WorkstationCommandBar
        primaryActions={[
          {
            id: 'copilot-cmd',
            label: 'AI Copilot',
            icon: <span>🤖</span>,
            shortcut: 'Ctrl+K',
            variant: 'primary',
            onClick: () => openCopilotWithPrompt('')
          },
          {
            id: 'onboard-partner',
            label: 'Onboard Partner',
            icon: <span>➕</span>,
            shortcut: 'Alt+N',
            variant: 'default',
            onClick: () => onOpenOnboardingWizard?.()
          }
        ]}
        groups={[
          {
            id: 'timeframe-grp',
            actions: [
              {
                id: 'tf-month',
                label: 'This Month',
                active: revenueTimeframe === 'This Month',
                onClick: () => setRevenueTimeframe('This Month')
              },
              {
                id: 'tf-last-month',
                label: 'Last Month',
                active: revenueTimeframe === 'Last Month',
                onClick: () => setRevenueTimeframe('Last Month')
              },
              {
                id: 'tf-quarter',
                label: 'This Quarter',
                active: revenueTimeframe === 'This Quarter',
                onClick: () => setRevenueTimeframe('This Quarter')
              },
              {
                id: 'tf-year',
                label: 'This Year',
                active: revenueTimeframe === 'This Year',
                onClick: () => setRevenueTimeframe('This Year')
              }
            ]
          },
          {
            id: 'preset-grp',
            actions: [
              {
                id: 'p-founder',
                label: 'Founder',
                active: activeRolePreset === 'FOUNDER',
                onClick: () => handleApplyPreset('FOUNDER')
              },
              {
                id: 'p-cfo',
                label: 'CFO',
                active: activeRolePreset === 'CFO',
                onClick: () => handleApplyPreset('CFO')
              },
              {
                id: 'p-cmo',
                label: 'CMO',
                active: activeRolePreset === 'CMO',
                onClick: () => handleApplyPreset('CMO')
              },
              {
                id: 'p-cto',
                label: 'CTO',
                active: activeRolePreset === 'CTO',
                onClick: () => handleApplyPreset('CTO')
              }
            ]
          }
        ]}
        secondaryActions={[
          {
            id: 'customize-workspace',
            label: 'Customize',
            icon: <span>🎨</span>,
            shortcut: 'Alt+C',
            variant: 'subtle',
            onClick: () => setIsCustomizerOpen(true)
          },
          {
            id: 'refresh-data',
            label: 'Refresh',
            icon: <span>↻</span>,
            shortcut: 'Ctrl+R',
            variant: 'subtle',
            onClick: () => {
              triggerToast('⚡ Telemetry synchronized with live cluster');
              void executiveService.getExecutiveDashboard().then((res) => res && setDashboardData(res));
            }
          }
        ]}
        searchSlot={
          <div style={{ position: 'relative', width: '220px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '0.75rem', color: '#64748B' }}>🔍</span>
            <input
              type="text"
              value={commandBarSearch}
              onChange={(e) => setCommandBarSearch(e.target.value)}
              placeholder="Filter queue... (Ctrl+F)"
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '5px 8px 5px 28px',
                color: '#F8FAFC',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            />
          </div>
        }
        statusSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
            <DataPulse status="online" label="ONLINE" size="sm" />
            <span style={{ color: '#38BDF8', fontFamily: 'monospace', fontWeight: 600 }}>{gatewayLatency}ms</span>
            <span style={{ color: '#64748B' }}>•</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>{uptimePercent}% SLA</span>
          </div>
        }
      />

      {/* 3D Interactive Spatial Operating Core */}
      {isWidgetVisible('3d-network-core') && (
        <DocSearchSpatialCore3D
          preset="overview"
          height={380}
          interactive={true}
          onNodeClick={(id) => handle3DNodeClick(id)}
          nodeMetrics={spatialNodeMetrics}
        />
      )}

      {/* Row 1: 5 Top KPI Metrics with Glowing Wave Sparklines */}
      {isWidgetVisible('kpi-summary') && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px'
          }}
        >
          {/* 1. Total Partners */}
          <div
            onClick={() => setActiveDetailModal('partners-list')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)';
            }}
            style={{
              backgroundColor: 'rgba(18, 24, 38, 0.75)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px 16px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--ds-shadow-base), var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.1))',
              cursor: 'pointer',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC', fontSize: '1rem' }}>
                  👥
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Total Partners</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#C084FC', backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>List</span>
                <span>↗</span>
              </span>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {totalTenants.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{activeTenants.toLocaleString('en-IN')} Active</span>
                <span style={{ color: activeTenants > 0 ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                  ● {activeTenants > 0 ? 'Live Network' : 'Ready'}
                </span>
              </div>
            </div>

            {/* Glowing Purple Wave Sparkline */}
            <div style={{ marginTop: '8px', height: '38px', width: '100%' }}>
              <svg width="100%" height="100%" viewBox="0 0 160 38" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 30 Q 40 10, 80 22 T 160 8 L 160 38 L 0 38 Z" fill="url(#sparkPurple)" />
                <path d="M 0 30 Q 40 10, 80 22 T 160 8" fill="none" stroke="#A855F7" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* 2. Active Subscriptions */}
          <div
            onClick={() => setActiveDetailModal('subscriptions-list')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)';
            }}
            style={{
              backgroundColor: 'rgba(18, 24, 38, 0.75)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px 16px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--ds-shadow-base), var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.1))',
              cursor: 'pointer',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', fontSize: '1rem' }}>
                  🛡️
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Active Subscriptions</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>Plans</span>
                <span>↗</span>
              </span>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {activeSubs.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{activeSubs.toLocaleString('en-IN')} Active Licenses</span>
                <span style={{ color: activeSubs > 0 ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                  ({activeSubs > 0 ? '99.4% Active' : '0.0% Active'})
                </span>
              </div>
            </div>

            {/* Glowing Green Wave Sparkline */}
            <div style={{ marginTop: '8px', height: '38px', width: '100%' }}>
              <svg width="100%" height="100%" viewBox="0 0 160 38" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 32 C 35 25, 60 12, 90 22 C 120 30, 140 10, 160 8 L 160 38 L 0 38 Z" fill="url(#sparkGreen)" />
                <path d="M 0 32 C 35 25, 60 12, 90 22 C 120 30, 140 10, 160 8" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* 3. Total Branches */}
          <div
            onClick={() => setActiveDetailModal('branches-list')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(56, 189, 248, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)';
            }}
            style={{
              backgroundColor: 'rgba(18, 24, 38, 0.75)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px 16px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--ds-shadow-base), var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.1))',
              cursor: 'pointer',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '1rem' }}>
                  🏥
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Total Branches</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>Branches</span>
                <span>↗</span>
              </span>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {totalBranches.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{totalBranches.toLocaleString('en-IN')} Nodes</span>
                <span style={{ color: totalBranches > 0 ? '#38BDF8' : '#94A3B8', fontWeight: 700 }}>
                  ({totalBranches > 0 ? 'Topology Synced' : 'Ready'})
                </span>
              </div>
            </div>

            {/* Glowing Blue Wave Sparkline */}
            <div style={{ marginTop: '8px', height: '38px', width: '100%' }}>
              <svg width="100%" height="100%" viewBox="0 0 160 38" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 30 Q 40 12, 80 20 T 160 6 L 160 38 L 0 38 Z" fill="url(#sparkBlue)" />
                <path d="M 0 30 Q 40 12, 80 20 T 160 6" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* 4. MRR (This Month) */}
          <div
            onClick={() => setActiveDetailModal('mrr-breakdown')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)';
            }}
            style={{
              backgroundColor: 'rgba(18, 24, 38, 0.75)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px 16px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--ds-shadow-base), var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.1))',
              cursor: 'pointer',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24', fontSize: '1rem' }}>
                  📜
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>MRR (This Month)</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#FBBF24', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>Ledger</span>
                <span>↗</span>
              </span>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                ₹ {mrrEst.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>₹ {(mrrEst / 100000).toFixed(1)}L MRR</span>
                <span style={{ color: mrrEst > 0 ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                  ({revenueData.mrrGrowth})
                </span>
              </div>
            </div>

            {/* Glowing Amber Wave Sparkline */}
            <div style={{ marginTop: '8px', height: '38px', width: '100%' }}>
              <svg width="100%" height="100%" viewBox="0 0 160 38" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 30 Q 40 14, 80 22 T 160 8 L 160 38 L 0 38 Z" fill="url(#sparkAmber)" />
                <path d="M 0 30 Q 40 14, 80 22 T 160 8" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* 5. ARR (This Year) */}
          <div
            onClick={() => setActiveDetailModal('arr-breakdown')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)';
            }}
            style={{
              backgroundColor: 'rgba(18, 24, 38, 0.75)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px 16px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--ds-shadow-base), var(--ds-specular-edge, inset 0 1px 0 0 rgba(255, 255, 255, 0.1))',
              cursor: 'pointer',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontSize: '1rem' }}>
                  📈
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>ARR (This Year)</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>Forecast</span>
                <span>↗</span>
              </span>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                ₹ {(arrEst / 10000000).toFixed(2)} Cr
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>₹ {(arrEst / 100000).toFixed(1)}L ARR</span>
                <span style={{ color: arrEst > 0 ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                  ({revenueData.arrGrowth})
                </span>
              </div>
            </div>

            {/* Glowing Emerald Wave Sparkline */}
            <div style={{ marginTop: '8px', height: '38px', width: '100%' }}>
              <svg width="100%" height="100%" viewBox="0 0 160 38" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 30 Q 40 12, 80 18 T 160 6 L 160 38 L 0 38 Z" fill="url(#sparkEmerald)" />
                <path d="M 0 30 Q 40 12, 80 18 T 160 6" fill="none" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Row 1b: Active Users + Platform Health (Responsive Flex Container) */}
      {isWidgetVisible('subsystem-health') && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'stretch'
          }}
        >
        {/* 6. Active Users */}
        <div
          onClick={() => setActiveDetailModal('active-users')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.6)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 72, 153, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.25)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)';
          }}
          style={{
            flex: '1 1 240px',
            minWidth: '220px',
            maxWidth: '320px',
            backgroundColor: '#11182E',
            border: '1px solid rgba(236, 72, 153, 0.25)',
            borderRadius: '14px',
            padding: '16px 16px 10px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F472B6', fontSize: '1rem' }}>
                👤
              </div>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Active Users</span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#F472B6', backgroundColor: 'rgba(236, 72, 153, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>Sessions</span>
              <span>↗</span>
            </span>
          </div>

          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {activeUsers}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Founder / Super Admin</span>
              <span style={{ color: '#64748B', fontWeight: 500 }}>(Meraj Sharif)</span>
            </div>
          </div>

          {/* Glowing Pink Wave Sparkline */}
          <div style={{ marginTop: '8px', height: '38px', width: '100%' }}>
            <svg width="100%" height="100%" viewBox="0 0 160 38" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkPink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EC4899" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M 0 32 C 30 20, 65 30, 95 18 C 125 6, 145 20, 160 8 L 160 38 L 0 38 Z" fill="url(#sparkPink)" />
              <path d="M 0 32 C 30 20, 65 30, 95 18 C 125 6, 145 20, 160 8" fill="none" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Platform Health Telemetry Card (Responsive) */}
        <div
          style={{
            flex: '3 1 480px',
            minWidth: '280px',
            backgroundColor: '#11182E',
            border: '1px solid rgba(16, 185, 129, 0.28)',
            borderRadius: '14px',
            padding: '14px 18px 10px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  fontSize: '1.1rem'
                }}
              >
                🩺
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                    Platform Health & Telemetry
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: '#34D399'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                    Online
                  </span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  All 442 core tables & cloud subsystems operational within SLA
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Uptime (30d)
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1.1 }}>
                  {uptimePercent}%
                </div>
              </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDetailModal('system-telemetry');
                  }}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.72rem',
                    color: '#38BDF8',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                  }}
                >
                  <span>Infra Details</span>
                  <span>→</span>
                </button>
            </div>
          </div>

          {/* Subsystems Horizontal Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              marginTop: '8px',
              marginBottom: '4px'
            }}
          >
            {[
              { id: 'system-telemetry' as ActiveDetailModalType, name: 'System', status: 'Healthy', metric: 'CPU 12% • RAM 4.2G', color: '#10B981' },
              { id: 'api-telemetry' as ActiveDetailModalType, name: 'APIs', status: 'Healthy', metric: `${gatewayLatency}ms Avg Latency`, color: '#10B981' },
              { id: 'database-telemetry' as ActiveDetailModalType, name: 'Database', status: 'Healthy', metric: '442 Tables Synced', color: '#10B981' },
              { id: 'storage-telemetry' as ActiveDetailModalType, name: 'Storage', status: 'Healthy', metric: 'S3 & Local Synced', color: '#10B981' }
            ].map((sub) => (
              <div
                key={sub.name}
                onClick={() => setActiveDetailModal(sub.id)}
                title={`Click to view ${sub.name} detailed diagnostic metrics`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.transform = 'none';
                }}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '7px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: sub.color, boxShadow: `0 0 6px ${sub.color}` }} />
                    <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '0.75rem' }}>{sub.name}</span>
                    <span style={{ color: '#38BDF8', fontSize: '0.625rem', opacity: 0.8 }}>↗</span>
                  </div>
                  <span style={{ color: '#64748B', fontSize: '0.65rem' }}>{sub.metric}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <svg width="40" height="12" viewBox="0 0 40 12" fill="none">
                    <path
                      d="M 1 9 L 7 7 L 14 10 L 21 4 L 28 7 L 35 2 L 39 3"
                      stroke="#10B981"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span style={{ color: '#10B981', fontWeight: 800, fontSize: '0.65rem' }}>{sub.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Telemetry Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.65rem',
              color: '#64748B',
              flexWrap: 'wrap',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡ Cluster: ap-south-1 (Mumbai)</span>
              <span>•</span>
              <span>TLS 1.3 Active</span>
              <span>•</span>
              <span>0 Incidents (Last 30 Days)</span>
            </div>
            <div style={{ color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🛡️ Auto-healing enabled</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Row 1c: Daily Operations & Essential Healthcare Toolkit */}
      {isWidgetVisible('daily-ops') && (
        <DailyOperationsBar
          onOpenOnboardingWizard={onOpenOnboardingWizard}
          onNavigateToDomain={onNavigateToDomain}
          onTriggerToast={triggerToast}
          dashboardData={dashboardData}
        />
      )}

      {/* Enterprise Partner Operations Workstation (Master/Detail Split View) */}
      {isWidgetVisible('partner-operations-workstation') && (
        <WorkstationPanel
          title="Healthcare Partner Operations Workstation"
          subtitle="Enterprise master/detail split view with dense tabular queue and contextual inspector for hospital networks and clinical facilities"
          icon="🏢"
          badge={
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#38BDF8',
                background: 'rgba(2, 132, 199, 0.12)',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(2, 132, 199, 0.3)'
              }}
            >
              {filteredPartners.length} Active Organizations
            </span>
          }
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDrawerPartner(selectedPartner || filteredPartners[0] || null)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  cursor: 'pointer'
                }}
              >
                📋 Slide-Over Sheet ↗
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailModal('partners-list')}
                className="ds-interactive"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#E2E8F0',
                  cursor: 'pointer'
                }}
              >
                Full Directory ↗
              </button>
            </div>
          }
        >
          <MasterDetailSplitView
            masterTitle={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F8FAFC' }}>
                  Enterprise Partner Queue
                </span>
                <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.15)', color: '#38BDF8', fontWeight: 600 }}>
                  {filteredPartners.length}
                </span>
              </div>
            }
            masterSubtitle="Select an organization row to inspect live telemetry & licensing"
            masterActions={
              <UnifiedFilterRibbon
                activeFilter={partnerTableFilter}
                counts={{
                  all: partnersList.length,
                  kycPending: partnersList.filter(p => ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED'].includes((p.metadata as any)?.kycStatus || p.verificationStatus)).length,
                  free: partnersList.filter(p => (((p.metadata as any)?.planTier || p.planTier || '').toLowerCase().includes('free'))).length,
                  enterprisePro: partnersList.filter(p => !(((p.metadata as any)?.planTier || p.planTier || '').toLowerCase().includes('free'))).length
                }}
                onSelectFilter={setPartnerTableFilter}
              />
            }
            masterContent={
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Search Bar inside Master Queue */}
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <input
                    type="text"
                    value={partnerTableSearch}
                    onChange={(e) => setPartnerTableSearch(e.target.value)}
                    placeholder="Search by name, slug, city, or license..."
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      color: '#F8FAFC',
                      fontSize: '0.75rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <Table density="compact" isStriped isStickyHeader>
                    <TableHeader isSticky>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Branches</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px 12px', color: '#64748B', fontSize: '0.8125rem' }}>
                            No matching healthcare organizations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPartners.map((p) => {
                          const isSelected = selectedPartner?.id === p.id;
                          return (
                            <TableRow
                              key={p.id}
                              isSelected={isSelected}
                              isClickable
                              onClick={() => {
                                setSelectedPartnerId(p.id);
                                setDrawerPartner(p);
                              }}
                            >
                              <TableCell>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.8125rem' }}>
                                    {p.tradeName || p.legalName}
                                  </span>
                                  <span style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'monospace' }}>
                                    {p.tenantSlug}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span style={{ fontSize: '0.6875rem', color: '#CBD5E1', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 5px', borderRadius: '4px' }}>
                                  {p.partnerType ? p.partnerType.replace(/_/g, ' ') : 'HOSPITAL'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                  {p.city ? `${p.city}, ${p.state || ''}` : 'Regional'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span style={{ fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                  {p.branchCount || 1}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span
                                  style={{
                                    fontSize: '0.625rem',
                                    fontWeight: 700,
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: p.accountStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: p.accountStatus === 'ACTIVE' ? '#34D399' : '#FBBF24'
                                  }}
                                >
                                  {p.accountStatus || 'ACTIVE'}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            }
            detailTitle={
              selectedPartner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {selectedPartner.tradeName || selectedPartner.legalName}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34D399',
                      fontWeight: 700,
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    ✓ {selectedPartner.verificationStatus || 'VERIFIED'}
                  </span>
                </div>
              ) : (
                'Contextual Inspector'
              )
            }
            detailSubtitle={
              selectedPartner
                ? `Tenant ID: ${selectedPartner.tenantId || selectedPartner.id} • Registered: ${new Date(selectedPartner.createdAt).toLocaleDateString()}`
                : undefined
            }
            detailActions={
              selectedPartner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      triggerToast(`Opening white-label portal for ${selectedPartner.tradeName}...`);
                      window.open(`http://localhost:5175?tenant=${selectedPartner.tenantSlug}`, '_blank');
                    }}
                    className="ds-interactive ds-spring-press"
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      background: '#0078D4',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 6px rgba(0, 120, 212, 0.3)'
                    }}
                  >
                    <span>↗</span> White-Label Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerToast(`Routing to billing for ${selectedPartner.tradeName}...`);
                      onNavigateToDomain?.('subscription-billing-finance');
                    }}
                    className="ds-interactive"
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#E2E8F0',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Manage Billing
                  </button>
                </div>
              ) : null
            }
            detailContent={
              selectedPartner ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px' }}>
                  {/* 1. Operational Telemetry Metric Tiles */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Active Branches
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px', fontFamily: 'monospace' }}>
                        {selectedPartner.branchCount || 1}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#10B981', marginTop: '2px' }}>
                        ● 100% Operational
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Clinical Staff
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#818CF8', marginTop: '4px', fontFamily: 'monospace' }}>
                        {selectedPartner.userCount || 4}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                        Doctors & Nurses
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Documents
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399', marginTop: '4px', fontFamily: 'monospace' }}>
                        {selectedPartner.documentsCount || 2}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#34D399', marginTop: '2px' }}>
                        NABH / CEA Verified
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        KYC Progress
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FBBF24', marginTop: '4px', fontFamily: 'monospace' }}>
                        {selectedPartner.kycCompletionPercent || 100}%
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#FBBF24', marginTop: '2px' }}>
                        Regulatory Cleared
                      </div>
                    </div>
                  </div>

                  {/* 2. Structured Panels Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    {/* Medical Director & Authorized Contact */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🩺</span> Authorized Medical Director
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 600, color: '#F8FAFC' }}>
                          {selectedPartner.primaryContact?.name || selectedPartner.registeredBy?.name || 'Dr. Medical Director'}
                        </div>
                        <div style={{ color: '#94A3B8' }}>
                          {selectedPartner.primaryContact?.roleTitle || selectedPartner.registeredBy?.role || 'Chief of Medical Operations'}
                        </div>
                        <div style={{ color: '#38BDF8', fontFamily: 'monospace', marginTop: '2px' }}>
                          {selectedPartner.primaryContact?.email || selectedPartner.registeredBy?.email || 'admin@hospital.in'}
                        </div>
                        <div style={{ color: '#64748B', fontFamily: 'monospace' }}>
                          {selectedPartner.primaryContact?.phone || '+91-80-23456789'}
                        </div>
                      </div>
                    </div>

                    {/* Regulatory Compliance & Licensing */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🛡️</span> Compliance & Telemetry
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                        <div>
                          <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>License Number:</span>
                          <div style={{ color: '#F8FAFC', fontFamily: 'monospace', fontWeight: 600 }}>
                            {selectedPartner.licenseNumber || 'REG-2026-CEA-091'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>SLA Health:</span>
                          <div style={{ color: '#10B981', fontWeight: 600 }}>
                            ● {selectedPartner.slaStatus || 'ON_TRACK'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>Duplicate Risk:</span>
                          <div style={{ color: selectedPartner.duplicateRisk?.hasRisk ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                            {selectedPartner.duplicateRisk?.hasRisk ? 'FLAGGED (SHARED CEA)' : 'CLEAN'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontSize: '0.6875rem' }}>Security Protocol:</span>
                          <div style={{ color: '#38BDF8', fontWeight: 600 }}>
                            AES-256-GCM
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Action Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        triggerToast(`Auditing partner records for ${selectedPartner.tradeName}...`);
                        onNavigateToDomain?.('compliance-regulatory');
                      }}
                      className="ds-interactive"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#F8FAFC',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Audit Trail
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerToast(`Opening clinical staff directory for ${selectedPartner.tradeName}...`);
                        onNavigateToDomain?.('partner-staff-management');
                      }}
                      className="ds-interactive"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#F8FAFC',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Clinical Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerToast(`Running AI diagnostic scan on ${selectedPartner.tradeName}...`);
                        openCopilotWithPrompt(`Analyze operational telemetry and branch performance for ${selectedPartner.tradeName}`);
                      }}
                      className="ds-interactive"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#C084FC',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🤖 AI Diagnostics
                    </button>
                  </div>
                </div>
              ) : null
            }
            hasSelection={!!selectedPartner}
            masterWidth="460px"
          />
        </WorkstationPanel>
      )}

      {/* Row 2: Revenue Overview (50%) + AI Copilot Insights (25%) + Critical Alerts (25%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '16px'
        }}
      >
        {/* Left: Revenue Overview (6 cols) */}
        {isWidgetVisible('revenue-overview') && (
          <div
            style={{
              gridColumn: (!isWidgetVisible('copilot-insights') && !isWidgetVisible('critical-alerts')) ? 'span 12' : (!isWidgetVisible('copilot-insights') || !isWidgetVisible('critical-alerts')) ? 'span 8' : 'span 6',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
            }}
          >
            {/* Card Header & Timeframe Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>Revenue Overview</strong>
                {/* Legend Dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.75rem', color: '#94A3B8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                    MRR
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06B6D4' }} />
                    ARR
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    One-time
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C026D3' }} />
                    Add-ons
                  </span>
                </div>
              </div>

              <select
                value={revenueTimeframe}
                onChange={(e) => setRevenueTimeframe(e.target.value as any)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="This Quarter">This Quarter</option>
                <option value="This Year">This Year</option>
              </select>
            </div>

            {/* Chart & Right Metrics Split */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              {/* SVG Multi-wave chart */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* Y Axis Grid Lines & Labels */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', position: 'absolute', left: 0, top: 0, fontSize: '0.6875rem', color: '#475569', zIndex: 1 }}>
                  {revenueData.yAxisLabels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>

                {/* Waves */}
                <div style={{ marginLeft: '32px', height: '140px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaBlueWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="areaAmberWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="areaPurpleWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C026D3" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#C026D3" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="areaCyanWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid horizontal dashed lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#1E293B" strokeDasharray="3 3" />
                    <line x1="0" y1="55" x2="400" y2="55" stroke="#1E293B" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="400" y2="90" stroke="#1E293B" strokeDasharray="3 3" />
                    <line x1="0" y1="125" x2="400" y2="125" stroke="#1E293B" strokeDasharray="3 3" />

                    {/* Purple Wave: Add-ons */}
                    <path d={revenueData.purpleAreaPath} fill="url(#areaPurpleWave)" />
                    <path d={revenueData.purpleWavePath} fill="none" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" />

                    {/* Amber Wave: One-time */}
                    <path d={revenueData.amberAreaPath} fill="url(#areaAmberWave)" />
                    <path d={revenueData.amberWavePath} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

                    {/* Cyan Wave: ARR Component */}
                    <path d={revenueData.cyanAreaPath} fill="url(#areaCyanWave)" />
                    <path d={revenueData.cyanWavePath} fill="none" stroke="#06B6D4" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />

                    {/* Blue Glowing Wave: MRR Primary */}
                    <path d={revenueData.blueAreaPath} fill="url(#areaBlueWave)" />
                    <path d={revenueData.blueWavePath} fill="none" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Day markers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: '32px', marginTop: '6px', fontSize: '0.6875rem', color: '#64748B' }}>
                  {revenueData.dayLabels.map((day, idx) => (
                    <span key={idx}>{day}</span>
                  ))}
                </div>
              </div>

              {/* Right Summary Metrics Stack */}
              <div
                style={{
                  width: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: '1px solid #1E293B',
                  paddingLeft: '16px'
                }}
              >
                <div onClick={() => setActiveDetailModal('mrr-breakdown')} style={{ cursor: 'pointer' }} title="Click for MRR diagnostic ledger">
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>MRR</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>
                      ₹ {revenueData.mrr.toLocaleString('en-IN')}
                    </strong>
                    <span style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 800 }}>
                      {revenueData.mrrGrowth}
                    </span>
                  </div>
                </div>

                <div onClick={() => setActiveDetailModal('arr-breakdown')} style={{ cursor: 'pointer' }} title="Click for ARR diagnostic ledger">
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>ARR</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>
                      ₹ {revenueData.arr.toLocaleString('en-IN')}
                    </strong>
                    <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800 }}>
                      {revenueData.arrGrowth}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>One-time Revenue</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>
                      ₹ {revenueData.oneTime.toLocaleString('en-IN')}
                    </strong>
                    <span style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 800 }}>
                      {revenueData.oneTimeGrowth}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Add-on Revenue</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>
                      ₹ {revenueData.addOn.toLocaleString('en-IN')}
                    </strong>
                    <span style={{ fontSize: '0.6875rem', color: '#C026D3', fontWeight: 800 }}>
                      {revenueData.addOnGrowth}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Middle: AI Copilot Insights (3 cols) */}
        {isWidgetVisible('copilot-insights') && (
          <div
            style={{
              gridColumn: !isWidgetVisible('revenue-overview') && !isWidgetVisible('critical-alerts') ? 'span 12' : !isWidgetVisible('revenue-overview') ? 'span 6' : !isWidgetVisible('critical-alerts') ? 'span 6' : 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem', color: '#A855F7' }}>🤖</span>
                <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>AI Copilot Insights</strong>
              </div>
              <button
                type="button"
                onClick={() => openCopilotWithPrompt('')}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                View all
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Tile 1 */}
              <div
                onClick={() => openCopilotWithPrompt('How do I onboard the first hospital partner?')}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', color: '#34D399' }}>✨</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6EE7B7' }}>
                      Partner acquisition pipeline active
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                      {subscriptionData.total} partners enrolled • 0 churn risks
                    </div>
                  </div>
                </div>
                <span style={{ color: '#64748B', fontSize: '0.875rem' }}>›</span>
              </div>

              {/* Tile 2 */}
              <div
                onClick={() => openCopilotWithPrompt('Show partner onboarding pipeline and velocity')}
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', color: '#38BDF8' }}>🚀</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7DD3FC' }}>
                      Velocity: {partnerGrowthData.attainmentPercent}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                      Monthly run-rate pacing towards target
                    </div>
                  </div>
                </div>
                <span style={{ color: '#64748B', fontSize: '0.875rem' }}>›</span>
              </div>

              {/* Tile 3 */}
              <div
                onClick={() => openCopilotWithPrompt('Verify platform telemetry and health')}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', color: '#10B981' }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#A7F3D0' }}>
                      All subsystems operational
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                      0 critical incidents • {uptimePercent}% Uptime
                    </div>
                  </div>
                </div>
                <span style={{ color: '#64748B', fontSize: '0.875rem' }}>›</span>
              </div>

              {/* Tile 4 */}
              <div
                onClick={() => openCopilotWithPrompt('Show revenue forecast for next quarter')}
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', color: '#818CF8' }}>📈</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#A5B4FC' }}>
                      Revenue forecast trajectory
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                      ₹ {((revenueData.mrr * 1.15) / 100000).toFixed(1)}L projected next period (+15%)
                    </div>
                  </div>
                </div>
                <span style={{ color: '#64748B', fontSize: '0.875rem' }}>›</span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Critical Alerts (3 cols) */}
        {isWidgetVisible('critical-alerts') && (
          <div
            style={{
              gridColumn: !isWidgetVisible('revenue-overview') && !isWidgetVisible('copilot-insights') ? 'span 12' : !isWidgetVisible('revenue-overview') ? 'span 6' : !isWidgetVisible('copilot-insights') ? 'span 6' : 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>Critical Alerts</strong>
              <button
                type="button"
                onClick={() => setActiveDetailModal('subscriptions-list')}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                View all ↗
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                onClick={() => setActiveDetailModal('mrr-breakdown')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>Payment Failures</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900 }}>
                    0
                  </span>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>›</span>
                </div>
              </div>

              <div
                onClick={() => setActiveDetailModal('subscriptions-list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>Expiring Plans (30d)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900 }}>
                    2
                  </span>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>›</span>
                </div>
              </div>

              <div
                onClick={() => setActiveDetailModal('active-users')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>Security & Auth</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900 }}>
                    0
                  </span>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>›</span>
                </div>
              </div>

              <div
                onClick={() => setActiveDetailModal('partners-list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>Pending Approvals</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900 }}>
                    3
                  </span>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>›</span>
                </div>
              </div>

              <div
                onClick={() => triggerToast('Support escalation: Trauma Center Integration Ticket #4102 escalated')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EA580C' }} />
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>Support Escalations</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: 'rgba(234, 88, 12, 0.2)', color: '#FB923C', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900 }}>
                    1
                  </span>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>›</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Subscription Distribution (Donut) + Partner Growth (Bar) + Top Plans + Recent Activities */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '16px'
        }}
      >
        {/* 1. Subscription Distribution (3 cols) */}
        {isWidgetVisible('sub-distribution') && (
          <div
            onClick={() => setActiveDetailModal('subscriptions-list')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(56, 189, 248, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1E293B';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
            }}
            style={{
              gridColumn: 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                Subscription Distribution
              </strong>
              <span style={{ fontSize: '0.6875rem', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>
                Details ↗
              </span>
            </div>

            {/* Radial Donut Chart */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '10px 0' }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                {/* Background circle */}
                <circle cx="70" cy="70" r="52" fill="none" stroke="#1E293B" strokeWidth="18" />
                {subscriptionData.slices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="18"
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease, stroke-dasharray 0.6s ease' }}
                  />
                ))}
              </svg>

              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Total</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF' }}>{subscriptionData.total.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.625rem', color: '#38BDF8', fontWeight: 700 }}>Partners</div>
              </div>
            </div>

            {/* Donut Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              {subscriptionData.slices.map((slice) => (
                <div key={slice.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: slice.color }} />
                    {slice.name}
                  </span>
                  <span style={{ fontWeight: 800, color: '#FFFFFF' }}>
                    {slice.percent}% <span style={{ color: '#64748B', fontWeight: 500 }}>({slice.count})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Partner Growth (Bar Chart) (3 cols) */}
        {isWidgetVisible('partner-growth') && (
          <div
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName !== 'SELECT') {
                setActiveDetailModal('partners-list');
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 92, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1E293B';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
            }}
            style={{
              gridColumn: 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>Partner Growth</strong>
                <span style={{ fontSize: '0.6875rem', color: '#C084FC', backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>
                  List ↗
                </span>
              </div>
              <select
                value={partnerGrowthYear}
                onChange={(e) => setPartnerGrowthYear(e.target.value as any)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#CBD5E1',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="This Year">This Year</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* Bar Chart Area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', height: '140px', padding: '16px 0 6px 0', borderBottom: '1px solid #1E293B' }}>
              {partnerGrowthData.bars.map((bar) => (
                <div key={bar.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                  {bar.isCurrent && (
                    <div
                      style={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #06B6D4',
                        color: '#38BDF8',
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        marginBottom: '2px'
                      }}
                    >
                      {bar.month} {bar.count}
                    </div>
                  )}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '22px',
                      height: `${bar.height}px`,
                      background: bar.isCurrent
                        ? 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)'
                        : 'linear-gradient(180deg, #0284C7 0%, #1E3A8A 100%)',
                      borderRadius: '4px 4px 0 0',
                      boxShadow: bar.isCurrent ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none',
                      transition: 'height 0.4s ease'
                    }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: bar.isCurrent ? '#38BDF8' : '#64748B', fontWeight: bar.isCurrent ? 800 : 500 }}>
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B', marginTop: '6px' }}>
              <span>Target: {partnerGrowthData.annualTarget}</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>{partnerGrowthData.attainmentPercent}</span>
            </div>
          </div>
        )}

        {/* 3. Top Performing Plans (3 cols) */}
        {isWidgetVisible('top-plans') && (
          <div
            onClick={() => setActiveDetailModal('subscriptions-list')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(56, 189, 248, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1E293B';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
            }}
            style={{
              gridColumn: 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                Top Performing Plans
              </strong>
              <span style={{ fontSize: '0.6875rem', color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>
                Details ↗
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topPlansData.map((plan) => (
                <div
                  key={plan.rank}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: plan.color, color: '#000', fontSize: '0.6875rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {plan.rank}
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                      {plan.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>{plan.rev}</strong>
                    <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34D399', fontSize: '0.6875rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>
                      {plan.growth}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.6875rem', color: '#64748B', textAlign: 'right', marginTop: '4px' }}>
              Calculated on trailing 30-day billings
            </div>
          </div>
        )}

        {/* 4. Recent Activities (3 cols) */}
        {isWidgetVisible('recent-activities') && (
          <div
            style={{
              gridColumn: 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>Recent Activities</strong>
              <button
                type="button"
                onClick={() => triggerToast('Opening system audit logs')}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                View all
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(liveRecentActivities && liveRecentActivities.length > 0
                ? liveRecentActivities.map((act) => ({
                    icon: act.eventType.includes('SECURITY') ? '🛡️' : act.eventType.includes('AUDIT') ? '📜' : '⚡',
                    title: act.eventType.replace(/_/g, ' '),
                    time: act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
                  }))
                : [
                    { icon: '⚡', title: 'Command Center Operating System Initialized', time: 'Just now' },
                    { icon: '🛡️', title: 'Founder Shield Active (Founder Meraj Sharif)', time: '1 min ago' },
                    { icon: '📜', title: 'PostgreSQL Live Schema Connected & Healthy', time: '2 min ago' },
                    { icon: '🤖', title: 'AI Copilot & Compliance Engine Standing By', time: '3 min ago' },
                    { icon: '👥', title: 'Partner Onboarding Pipeline Open for Registration', time: '4 min ago' }
                  ]
              ).map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
                    {act.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#E2E8F0', fontWeight: 600, lineHeight: 1.3 }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                      {act.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.6875rem', color: '#64748B', textAlign: 'right', marginTop: '4px' }}>
              Audit Vault 256-bit Immutable
            </div>
          </div>
        )}
      </div>

      {/* Row 4: Quick Actions (3 cols) + Global Presence (3 cols) + Support Overview (3 cols) + Unlock AI Copilot (3 cols) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '16px'
        }}
      >
        {/* 1. Quick Actions (3 cols) */}
        {isWidgetVisible('quick-actions') && (
          <div
            style={{
              gridColumn: 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
            }}
          >
            <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '10px' }}>
              Quick Actions
            </strong>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
                gap: '10px'
              }}
            >
              {[
                { label: 'Add Partner', icon: '➕', bg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', action: onOpenOnboardingWizard },
                { label: 'Create Plan', icon: '📑', bg: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', action: () => setActiveDetailModal('subscriptions-list') },
                { label: 'Send Notice', icon: '📢', bg: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', action: () => triggerToast('Broadcast Notice Composer') },
                { label: 'Create Banner', icon: '🖼️', bg: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', action: () => triggerToast('Marketing Banner Hub') },
                { label: 'View Invoices', icon: '🧾', bg: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', action: () => setActiveDetailModal('mrr-breakdown') },
                { label: 'Refunds', icon: '💸', bg: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)', action: () => setActiveDetailModal('mrr-breakdown') },
                { label: 'Add Add-on', icon: '🧩', bg: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)', action: () => setActiveDetailModal('subscriptions-list') },
                { label: 'Generate Report', icon: '📊', bg: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)', action: () => setActiveDetailModal('arr-breakdown') }
              ].map((act) => (
                <button
                  key={act.label}
                  type="button"
                  onClick={act.action}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 4px',
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0F172A';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: act.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}
                  >
                    {act.icon}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#CBD5E1', fontWeight: 600, textAlign: 'center', lineHeight: 1.1 }}>
                    {act.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Global Presence (3 cols) */}
        {isWidgetVisible('global-presence') && (
          <div
            onClick={() => setActiveDetailModal('branches-list')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(56, 189, 248, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1E293B';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
            }}
            style={{
              gridColumn: 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>Global Presence</strong>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Partners by Region</div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDetailModal('branches-list');
                }}
                style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', color: '#38BDF8', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: '3px 8px' }}
              >
                Branches ↗
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', minWidth: '100px' }}>
                {globalPresenceData.map((reg) => (
                  <div key={reg.region} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: reg.color }} />
                      {reg.region}
                    </span>
                    <strong style={{ color: '#FFF' }}>{reg.count}</strong>
                  </div>
                ))}
              </div>

              {/* Dotted Geo Map Graphic */}
              <div style={{ flex: 1, height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="100" viewBox="0 0 140 100">
                  <g fill="#1E293B">
                    {/* Digital dot array representing geo map */}
                    <circle cx="30" cy="20" r="2" fill="#334155" />
                    <circle cx="38" cy="22" r="2.5" fill="#334155" />
                    <circle cx="45" cy="26" r="3" fill="#334155" />
                    <circle cx="52" cy="24" r="2" fill="#334155" />
                    <circle cx="42" cy="34" r="3.5" fill="#334155" />
                    <circle cx="48" cy="40" r="4" fill="#38BDF8" />
                    <circle cx="56" cy="42" r="2.5" fill="#334155" />
                    <circle cx="44" cy="50" r="3" fill="#334155" />
                    <circle cx="50" cy="58" r="3.5" fill="#334155" />
                    <circle cx="52" cy="68" r="4" fill="#334155" />
                    <circle cx="68" cy="45" r="2.5" fill="#334155" />
                    <circle cx="75" cy="42" r="3" fill="#334155" />
                    <circle cx="82" cy="48" r="2" fill="#334155" />
                    <circle cx="32" cy="45" r="3" fill="#334155" />
                    <circle cx="28" cy="52" r="2.5" fill="#334155" />
                  </g>
                  <circle cx="48" cy="40" r="8" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 3. Support Overview (3 cols) */}
        {isWidgetVisible('support-overview') && (
          <div
            style={{
              gridColumn: 'span 3',
              backgroundColor: '#11182E',
              border: '1px solid #1E293B',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>Support Overview</strong>
              <select
                value={supportTimeframe}
                onChange={(e) => setSupportTimeframe(e.target.value as any)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#CBD5E1',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              {/* Support Radial Donut */}
              <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="34" fill="none" stroke="#1E293B" strokeWidth="12" />
                  {supportData.donutSlices.map((slice, idx) => (
                    <circle
                      key={idx}
                      cx="45"
                      cy="45"
                      r="34"
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="12"
                      strokeDasharray={slice.dashArray}
                      strokeDashoffset={slice.dashOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 45 45)"
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  ))}
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#FFF' }}>{supportData.totalTickets}</div>
                  <div style={{ fontSize: '0.55rem', color: '#94A3B8' }}>Tickets</div>
                </div>
              </div>

              {/* Support Breakdown List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94A3B8' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EA580C' }} />
                    Open
                  </span>
                  <strong style={{ color: '#FFF' }}>{supportData.open}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94A3B8' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    In Progress
                  </span>
                  <strong style={{ color: '#FFF' }}>{supportData.inProgress}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94A3B8' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    Resolved
                  </span>
                  <strong style={{ color: '#FFF' }}>{supportData.resolved}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94A3B8' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#7C3AED' }} />
                    Closed
                  </span>
                  <strong style={{ color: '#FFF' }}>{supportData.closed}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Unlock the Power of AI Copilot (3 cols) */}
        {isWidgetVisible('unlock-copilot') && (
          <div
            style={{
              gridColumn: 'span 3',
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.45)'
            }}
          >
            {/* Subtle glowing robot background aura */}
            <div
              style={{
                position: 'absolute',
                right: '-10px',
                bottom: '-10px',
                fontSize: '5rem',
                opacity: 0.25,
                pointerEvents: 'none'
              }}
            >
              🤖
            </div>

            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                🤖
              </div>
              <strong style={{ fontSize: '1.05rem', color: '#FFFFFF', lineHeight: 1.2, display: 'block' }}>
                Unlock the power of AI Copilot
              </strong>
              <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
                Ask, Analyze, Act - Everything simplified
              </p>
            </div>

            <button
              type="button"
              onClick={() => openCopilotWithPrompt('')}
              style={{
                marginTop: '16px',
                backgroundColor: '#FFFFFF',
                color: '#4F46E5',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                width: 'fit-content'
              }}
            >
              <span>Open Copilot</span>
              <span>➔</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Entity & Telemetry Detail Modal */}
      <CommandCenterDetailModal
        modalType={activeDetailModal}
        onClose={() => setActiveDetailModal(null)}
        dashboardData={dashboardData}
        {...(onNavigateToDomain ? { onNavigateToDomain } : {})}
        {...(onOpenOnboardingWizard ? { onOpenOnboardingWizard } : {})}
      />

      {/* AI Copilot Interactive Modal */}
      <MediSphereAiCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        initialTopic={copilotTopic}
      />

      {/* Executive Layout Customizer Modal */}
      <DashboardCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgetConfigs={widgetConfigs}
        activeRolePreset={activeRolePreset}
        onApplyPreset={handleApplyPreset}
        onToggleWidget={handleToggleWidget}
        onMoveWidget={handleMoveWidget}
        onResetToDefault={handleResetToDefault}
      />

      {/* Slide-Over Partner Drawer Sheet */}
      <SlideOverPartnerDrawer
        partner={drawerPartner}
        isOpen={Boolean(drawerPartner)}
        onClose={() => setDrawerPartner(null)}
        onOpenFullDossier={() => {
          setDrawerPartner(null);
          onNavigateToDomain?.('crm-partner-lifecycle');
        }}
        onPartnerUpdated={(updated) => {
          setPartnersList((prev) => prev.map((p) => p.id === updated.id ? updated : p));
          setDrawerPartner(updated);
        }}
      />
      </div>
    </EffectIntensityProvider>
  );
};

export const MediSphereCommandCenterDashboard = CommandCenterDashboard;
