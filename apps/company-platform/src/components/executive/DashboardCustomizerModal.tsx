import React from 'react';

export type RolePresetType = 'FOUNDER' | 'CFO' | 'CMO' | 'CTO';

export interface DashboardWidgetConfig {
  id: string;
  name: string;
  category: 'FINANCIAL' | 'CLINICAL' | 'SECURITY' | 'GROWTH' | 'OPERATIONS';
  description: string;
  isVisible: boolean;
  order: number;
}

export const DEFAULT_WIDGET_CONFIGS: DashboardWidgetConfig[] = [
  {
    id: '3d-network-core',
    name: '🌐 3D Healthcare Operating Core',
    category: 'OPERATIONS',
    description: 'Interactive spatial telemetry grid connecting core clinical & enterprise satellites',
    isVisible: true,
    order: 0
  },
  {
    id: 'kpi-summary',
    name: '👑 Top 5 Enterprise KPI Strip',
    category: 'GROWTH',
    description: 'Total Partners, Active Subscriptions, Branches, MRR, ARR',
    isVisible: true,
    order: 1
  },
  {
    id: 'subsystem-health',
    name: '🛡️ Platform Health & Active Sessions',
    category: 'SECURITY',
    description: 'Gateways, Database, Cloud Storage & Latency diagnostic badges',
    isVisible: true,
    order: 2
  },
  {
    id: 'partner-operations-workstation',
    name: '🏢 Healthcare Partner Workstation (Master/Detail)',
    category: 'OPERATIONS',
    description: 'Enterprise dense tabular queue with contextual split inspector for partner branches & licenses',
    isVisible: true,
    order: 2.5
  },
  {
    id: 'daily-ops',
    name: '⚡ Daily Operations Command Bar',
    category: 'OPERATIONS',
    description: '8 hospital & clinical quick actions with zero text truncation',
    isVisible: true,
    order: 3
  },
  {
    id: 'revenue-overview',
    name: '📈 Revenue Multi-Wave Chart',
    category: 'FINANCIAL',
    description: 'Real-time multi-wave bezier charts for MRR, ARR, One-time & Add-ons',
    isVisible: true,
    order: 4
  },
  {
    id: 'copilot-insights',
    name: '🤖 AI Copilot Operational Insights',
    category: 'OPERATIONS',
    description: 'Real-time telemetry analysis and executive recommendations',
    isVisible: true,
    order: 5
  },
  {
    id: 'critical-alerts',
    name: '🚨 Critical Operations Alerts Radar',
    category: 'OPERATIONS',
    description: 'Live alerts for payment failures, expiring plans, trauma surges',
    isVisible: true,
    order: 6
  },
  {
    id: 'sub-distribution',
    name: '🍩 Subscription Distribution Donut',
    category: 'GROWTH',
    description: 'Active partner tiers: Enterprise, Professional, Starter, Custom',
    isVisible: true,
    order: 7
  },
  {
    id: 'partner-growth',
    name: '📊 Partner Growth Velocity Bars',
    category: 'GROWTH',
    description: 'Monthly acquisition trajectory and annual target attainment',
    isVisible: true,
    order: 8
  },
  {
    id: 'top-plans',
    name: '🏆 Top Performing Plans Leaderboard',
    category: 'FINANCIAL',
    description: 'Trailing 30-day billings and MoM revenue growth percentages',
    isVisible: true,
    order: 9
  },
  {
    id: 'recent-activities',
    name: '📜 Recent Security & Audit Logs Vault',
    category: 'SECURITY',
    description: 'Chronological timeline of system actions and compliance logs',
    isVisible: true,
    order: 10
  },
  {
    id: 'quick-actions',
    name: '🚀 Quick Action Operations Launchpad',
    category: 'OPERATIONS',
    description: 'Instant launchpad for partner onboarding, plans, broadcasts, reports',
    isVisible: true,
    order: 11
  },
  {
    id: 'global-presence',
    name: '🌐 Regional Presence & Geo Density',
    category: 'GROWTH',
    description: 'Partner hospital distribution across North, South, West & East India',
    isVisible: true,
    order: 12
  },
  {
    id: 'support-overview',
    name: '🎫 Support & Incident Resolution Matrix',
    category: 'OPERATIONS',
    description: 'Open, In-Progress, Resolved and Closed ticket breakdown donut',
    isVisible: true,
    order: 13
  },
  {
    id: 'unlock-copilot',
    name: '✨ Dedicated AI Copilot Action Card',
    category: 'OPERATIONS',
    description: 'Direct prompt starter card for executive natural language queries',
    isVisible: true,
    order: 14
  }
];

export interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetConfigs: DashboardWidgetConfig[];
  activeRolePreset: RolePresetType;
  onApplyPreset: (preset: RolePresetType) => void;
  onToggleWidget: (id: string) => void;
  onMoveWidget: (id: string, direction: 'UP' | 'DOWN') => void;
  onResetToDefault: () => void;
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgetConfigs,
  activeRolePreset,
  onApplyPreset,
  onToggleWidget,
  onMoveWidget,
  onResetToDefault
}) => {
  if (!isOpen) return null;

  const sortedWidgets = [...widgetConfigs].sort((a, b) => a.order - b.order);
  const visibleCount = widgetConfigs.filter((w) => w.isVisible).length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #334155',
          borderRadius: '20px',
          width: '100%',
          maxWidth: 'min(94vw, 760px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(56, 189, 248, 0.15)',
          padding: '24px 22px',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1E293B',
            paddingBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              🎨
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF' }}>
                  Customize Command Center
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}
                >
                  {visibleCount} / {widgetConfigs.length} Active
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                Reorder sections, select executive role presets, or toggle individual widgets. Auto-saves to your local profile.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#1E293B',
              border: 'none',
              borderRadius: '10px',
              color: '#94A3B8',
              fontSize: '1.1rem',
              width: '34px',
              height: '34px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFF';
              e.currentTarget.style.backgroundColor = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.backgroundColor = '#1E293B';
            }}
          >
            ✕
          </button>
        </div>

        {/* 1-Click Executive Role Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.02em' }}>
            ⚡ 1-CLICK EXECUTIVE ROLE PRESETS
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px'
            }}
          >
            {[
              { id: 'FOUNDER', label: '👑 Founder Master', desc: 'All 14 widgets enabled', color: '#6366F1' },
              { id: 'CFO', label: '💰 CFO Finance', desc: 'Revenue, MRR, Plans, Payouts', color: '#10B981' },
              { id: 'CMO', label: '🏥 CMO Clinical', desc: 'Daily Ops, Beds, Appointments', color: '#06B6D4' },
              { id: 'CTO', label: '🛡️ CTO SecOps', desc: 'Health, Alerts, Audit Vault', color: '#F59E0B' }
            ].map((preset) => {
              const isActive = activeRolePreset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.id as RolePresetType)}
                  style={{
                    backgroundColor: isActive ? `${preset.color}22` : '#1E293B',
                    border: `1.5px solid ${isActive ? preset.color : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isActive ? `0 4px 20px ${preset.color}33` : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isActive ? '#FFF' : '#E2E8F0' }}>
                      {preset.label}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: '0.6875rem', color: preset.color, fontWeight: 900 }}>
                        ✓ Active
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                    {preset.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section List & Visibility Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.02em' }}>
              📋 REORDER & TOGGLE DASHBOARD WIDGETS
            </span>
            <button
              type="button"
              onClick={onResetToDefault}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#38BDF8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ↺ Reset to Default
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '42vh',
              overflowY: 'auto',
              paddingRight: '4px'
            }}
          >
            {sortedWidgets.map((widget, index) => (
              <div
                key={widget.id}
                style={{
                  backgroundColor: widget.isVisible ? '#1E293B' : '#131A2A',
                  border: '1px solid',
                  borderColor: widget.isVisible ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  opacity: widget.isVisible ? 1 : 0.6,
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Reorder Buttons (Up / Down) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMoveWidget(widget.id, 'UP')}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: index === 0 ? '#475569' : '#94A3B8',
                      fontSize: '0.6875rem',
                      cursor: index === 0 ? 'default' : 'pointer',
                      padding: 0,
                      lineHeight: 1
                    }}
                    title="Move section up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={index === sortedWidgets.length - 1}
                    onClick={() => onMoveWidget(widget.id, 'DOWN')}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: index === sortedWidgets.length - 1 ? '#475569' : '#94A3B8',
                      fontSize: '0.6875rem',
                      cursor: index === sortedWidgets.length - 1 ? 'default' : 'pointer',
                      padding: 0,
                      lineHeight: 1
                    }}
                    title="Move section down"
                  >
                    ▼
                  </button>
                </div>

                {/* Widget Information */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: widget.isVisible ? '#F8FAFC' : '#94A3B8' }}>
                      {widget.name}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: '#94A3B8',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.625rem',
                        fontWeight: 700
                      }}
                    >
                      {widget.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                    {widget.description}
                  </div>
                </div>

                {/* Visibility Toggle Switch */}
                <button
                  type="button"
                  onClick={() => onToggleWidget(widget.id)}
                  style={{
                    backgroundColor: widget.isVisible ? '#10B981' : '#334155',
                    color: widget.isVisible ? '#000' : '#94A3B8',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '65px',
                    textAlign: 'center'
                  }}
                >
                  {widget.isVisible ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #1E293B',
            paddingTop: '14px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            💾 Changes are instantly auto-saved to your browser profile.
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#6366F1',
              color: '#FFF',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 22px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4F46E5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366F1';
            }}
          >
            Apply & View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
