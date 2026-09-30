import React, { useEffect, useState } from 'react';
import type { ExecutiveDashboardData } from '../../types/executive.js';
import { executiveService } from '../../services/executive-service.js';
import { ExecutiveOverview } from './ExecutiveOverview.js';
import { KpiSummary } from './KpiSummary.js';
import { BusinessPerformance } from './BusinessPerformance.js';
import { AlertsSection } from './AlertsSection.js';
import { RecentActivities } from './RecentActivities.js';
import { QuickActions } from './QuickActions.js';
import { TrendAnalytics } from './TrendAnalytics.js';
import { SystemHealthSummary } from './SystemHealthSummary.js';

// 8 Executive Advancements
import { NationalHealthcareWarRoomView } from './NationalHealthcareWarRoomView.js';
import { RealtimeEbitdaUnitEconomicsView } from './RealtimeEbitdaUnitEconomicsView.js';
import { PlatformEmergencyPanicLockModal } from './PlatformEmergencyPanicLockModal.js';
import { CustomizableExecutiveWidgetGridView } from './CustomizableExecutiveWidgetGridView.js';
import { AiOutbreakBillingAnomalyCenterView } from './AiOutbreakBillingAnomalyCenterView.js';
import { AiVoiceWhatsAppAgentStudioView } from './AiVoiceWhatsAppAgentStudioView.js';
import { AbdmNationalHealthStackConsoleView } from './AbdmNationalHealthStackConsoleView.js';
import { MultiCloudDisasterRecoveryDrillView } from './MultiCloudDisasterRecoveryDrillView.js';
import { LimsHl7AstmIotDeviceHubView } from './LimsHl7AstmIotDeviceHubView.js';
import { generateAndDownloadExecutiveBoardPdf } from '../../utils/clientExecutiveBoardPdf.js';
import { PathologyPartnerOnboardingWizard } from '../crm/PathologyPartnerOnboardingWizard.js';

import { Spinner, ErrorState, Badge, Button } from '@docsearch/ui-kit';

export type ExecutiveTabId =
  | 'OVERVIEW'
  | 'ANOMALIES'
  | 'CUSTOM_GRID'
  | 'WAR_ROOM'
  | 'EBITDA'
  | 'AI_VOICE'
  | 'ABDM_STACK'
  | 'DR_FAILOVER'
  | 'LIMS_IOT';

export interface ExecutiveCommandCenterProps {
  initialTab?: ExecutiveTabId;
}

export const ExecutiveCommandCenter: React.FC<ExecutiveCommandCenterProps> = ({
  initialTab = 'OVERVIEW'
}) => {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<ExecutiveTabId>(initialTab);
  const [isPanicOpen, setIsPanicOpen] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await executiveService.getExecutiveDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executive telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px'
        }}
      >
        <Spinner size="lg" />
        <span style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-muted)' }}>
          Loading Executive & Command Center telemetry...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Command Center Unavailable"
        message={error || 'Could not establish connection to the executive service layer.'}
        onRetry={loadData}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Command Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', backgroundColor: '#0F172A', border: '1.5px solid rgba(6, 182, 212, 0.4)', borderRadius: '14px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#F8FAFC' }}>
              ⚡ Executive & Command Center HQ
            </h1>
            <Badge variant="success">● Pan-India Live Health Grid Active</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
            National healthcare consultation heatmaps, real-time EBITDA & unit economics, and 1-click platform emergency broadcast
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              generateAndDownloadExecutiveBoardPdf({
                arrAmount: '₹ 2.70 Crore',
                grossMargin: '84.5% Margin',
                cacLtvRatio: '1 : 6.4 Ratio',
                freeCashflow: '+ ₹ 12.40 L/mo',
                activeHospitals: 486,
                liveConsultsRate: '15,160 / hr',
                erDispatches: 89,
                avgOpdWait: '11.8 Mins',
                uptimePercent: '99.98%',
                complianceStatus: 'ABDM M1-M3 & HIPAA Validated'
              });
            }}
          >
            📥 Export Executive Board PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowOnboardingWizard(!showOnboardingWizard)}
          >
            {showOnboardingWizard ? '✖️ Close Wizard' : '🧪 + Onboard Pathology Lab (Live)'}
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsPanicOpen(true)}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
            }}
          >
            🚨 National Panic Siren
          </Button>
        </div>
      </div>

      {/* Prominent Fast-Track Onboarding Banner */}
      <div
        style={{
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          border: '1.5px solid #06B6D4',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.75rem' }}>🧪</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 900, color: '#F8FAFC', fontSize: '1rem' }}>
                Healthcare Partner Live Onboarding Pipeline
              </span>
              <Badge variant="success">Step-by-Step Live</Badge>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Add Pathology ➔ Verify KYC Docs ➔ Customize Features & Subscription ➔ Set User ID/Password ➔ Partner Login (localhost:5173).
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowOnboardingWizard(true)}
          style={{ backgroundColor: '#10B981', color: '#064E3B', fontWeight: 900, padding: '8px 18px' }}
        >
          🚀 Start Pathology Onboarding Wizard ➔
        </Button>
      </div>

      {/* Onboarding Wizard Embed when opened */}
      {showOnboardingWizard && (
        <div style={{ backgroundColor: '#070C16', border: '2px solid #06B6D4', borderRadius: '16px', padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setShowOnboardingWizard(false)}
              style={{ backgroundColor: '#334155', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}
            >
              ✖️ Close Onboarding Hub
            </button>
          </div>
          <PathologyPartnerOnboardingWizard
            onClose={() => setShowOnboardingWizard(false)}
            onComplete={() => setShowOnboardingWizard(false)}
          />
        </div>
      )}

      {/* Executive Modules Card Matrix Selector (Replaces Horizontal Scroll Bar) */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '16px',
          padding: '16px 18px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem', color: '#06B6D4' }}>⚡</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
              Executive Modules & Advanced Intelligence
            </span>
            <span
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#38BDF8',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.6875rem',
                fontWeight: 700
              }}
            >
              9 Modules (Single Screen Matrix)
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Active Dashboard:</span>
            <strong style={{ color: '#38BDF8' }}>
              {activeTab === 'OVERVIEW' && 'Classic Overview'}
              {activeTab === 'ANOMALIES' && 'AI Outbreak & Anomalies'}
              {activeTab === 'CUSTOM_GRID' && 'Custom Widget Studio'}
              {activeTab === 'WAR_ROOM' && 'National War-Room'}
              {activeTab === 'EBITDA' && 'EBITDA & Burn Rate'}
              {activeTab === 'AI_VOICE' && 'AI Voice & WhatsApp'}
              {activeTab === 'ABDM_STACK' && 'ABDM M1-M3 Gateway'}
              {activeTab === 'DR_FAILOVER' && 'Multi-Cloud Failover'}
              {activeTab === 'LIMS_IOT' && 'LIMS HL7/ASTM IoT'}
            </strong>
          </div>
        </div>

        {/* 3x3 Card Matrix Grid (Balanced 9-Module Cockpit with Universal Spotlight) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px'
          }}
        >
          {[
            {
              id: 'OVERVIEW' as const,
              title: 'Classic Overview',
              subtitle: 'Pan-India Operational HQ',
              icon: '📊',
              bg: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              badge: 'Live HQ',
              badgeColor: '#38BDF8',
              badgeBg: 'rgba(56, 189, 248, 0.15)',
              spotlightClass: 'spotlight-cyan'
            },
            {
              id: 'ANOMALIES' as const,
              title: 'AI Outbreak & Anomalies',
              subtitle: 'Disease Radar & Fraud Audit',
              icon: '🤖',
              bg: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
              badge: '2 Critical',
              badgeColor: '#F87171',
              badgeBg: 'rgba(239, 68, 68, 0.2)',
              spotlightClass: 'spotlight-red'
            },
            {
              id: 'CUSTOM_GRID' as const,
              title: 'Custom Widget Studio',
              subtitle: 'Drag & Drop Cockpit Builder',
              icon: '🧩',
              bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
              badge: 'Drag & Drop',
              badgeColor: '#FBBF24',
              badgeBg: 'rgba(245, 158, 11, 0.15)',
              spotlightClass: 'spotlight-amber'
            },
            {
              id: 'WAR_ROOM' as const,
              title: 'National War-Room',
              subtitle: 'Live Bed Heatmap & Surge',
              icon: '⚡',
              bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              badge: '15.1k / hr',
              badgeColor: '#34D399',
              badgeBg: 'rgba(16, 185, 129, 0.15)',
              spotlightClass: 'spotlight-green'
            },
            {
              id: 'EBITDA' as const,
              title: 'EBITDA & Burn Rate',
              subtitle: 'Real-Time CFO Economics',
              icon: '💰',
              bg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              badge: 'Cash Positive',
              badgeColor: '#60A5FA',
              badgeBg: 'rgba(59, 130, 246, 0.15)',
              spotlightClass: 'spotlight-blue'
            },
            {
              id: 'AI_VOICE' as const,
              title: 'AI Voice & WhatsApp',
              subtitle: 'Autonomous Multilingual Bot',
              icon: '🎙️',
              bg: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
              badge: 'Multi-Lingual',
              badgeColor: '#C084FC',
              badgeBg: 'rgba(139, 92, 246, 0.15)',
              spotlightClass: 'spotlight-purple'
            },
            {
              id: 'ABDM_STACK' as const,
              title: 'ABDM M1-M3 Gateway',
              subtitle: 'National Health ID & ABHA',
              icon: '🧬',
              bg: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
              badge: 'NHA Certified',
              badgeColor: '#2DD4BF',
              badgeBg: 'rgba(20, 184, 166, 0.15)',
              spotlightClass: 'spotlight-teal'
            },
            {
              id: 'DR_FAILOVER' as const,
              title: 'Multi-Cloud Failover',
              subtitle: 'Disaster Recovery Live Drill',
              icon: '🛡️',
              bg: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              badge: 'AWS ↔ GCP',
              badgeColor: '#818CF8',
              badgeBg: 'rgba(99, 102, 241, 0.15)',
              spotlightClass: 'spotlight-indigo'
            },
            {
              id: 'LIMS_IOT' as const,
              title: 'LIMS HL7/ASTM IoT',
              subtitle: 'Lab Analyzer & Panic Siren',
              icon: '🧪',
              bg: 'linear-gradient(135deg, #BE123C 0%, #E11D48 100%)',
              badge: 'Panic Sirens',
              badgeColor: '#FB7185',
              badgeBg: 'rgba(225, 29, 72, 0.2)',
              spotlightClass: 'spotlight-rose'
            }
          ].map((mod) => {
            const isActive = activeTab === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => setActiveTab(mod.id)}
                className={`ds-spotlight-card ${mod.spotlightClass} ${isActive ? 'ds-active-card' : ''}`}
                data-card="true"
                title={`${mod.title} — ${mod.subtitle}`}
                style={{
                  backgroundColor: isActive ? 'rgba(6, 182, 212, 0.14)' : '#11182E',
                  border: isActive ? '1.5px solid #06B6D4' : '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* 1. Conic Rotating Border Beam */}
                <div className="ds-border-beam-container">
                  <div className="ds-border-beam" />
                </div>

                {/* 2. Holographic Specular Sheen Sweep */}
                <span className="ds-holo-sheen" />

                {/* 3. Ambient Healthcare & Tech Telemetry Backgrounds */}
                {mod.id === 'ANOMALIES' || mod.id === 'WAR_ROOM' ? (
                  <div className="ds-telemetry-bg">
                    <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
                      <path
                        className="ds-telemetry-ecg-line"
                        d="M 0 30 L 40 30 L 50 10 L 60 50 L 70 20 L 80 40 L 90 30 L 200 30"
                        fill="none"
                        stroke={mod.badgeColor}
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                ) : mod.id === 'AI_VOICE' ? (
                  <div className="ds-telemetry-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '18px' }}>
                    <div className="ds-telemetry-equalizer">
                      <div className="ds-audio-bar" style={{ animationDelay: '0ms' }} />
                      <div className="ds-audio-bar" style={{ animationDelay: '180ms' }} />
                      <div className="ds-audio-bar" style={{ animationDelay: '360ms' }} />
                      <div className="ds-audio-bar" style={{ animationDelay: '120ms' }} />
                      <div className="ds-audio-bar" style={{ animationDelay: '280ms' }} />
                    </div>
                  </div>
                ) : mod.id === 'DR_FAILOVER' ? (
                  <div className="ds-telemetry-bg">
                    <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#818CF8" strokeWidth="0.8" strokeDasharray="3 3" />
                      <circle cx="30" cy="20" r="2.5" fill="#818CF8" opacity="0.8" />
                      <circle cx="70" cy="20" r="2.5" fill="#818CF8" opacity="0.8" />
                    </svg>
                  </div>
                ) : null}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, zIndex: 2 }}>
                  <div
                    className="ds-card-icon"
                    data-card-icon="true"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: mod.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontSize: '1.2rem',
                      flexShrink: 0,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.45)'
                    }}
                  >
                    {mod.icon}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 800 : 700,
                        color: isActive ? '#FFFFFF' : '#F1F5F9',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.01em'
                      }}
                      title={mod.title}
                    >
                      {mod.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: isActive ? '#93C5FD' : '#94A3B8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px'
                      }}
                      title={mod.subtitle}
                    >
                      {mod.subtitle}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0, zIndex: 2 }}>
                  <span
                    style={{
                      backgroundColor: mod.badgeBg,
                      border: `1px solid ${mod.badgeColor}40`,
                      color: mod.badgeColor,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {mod.badge}
                  </span>
                  {isActive ? (
                    <span style={{ fontSize: '0.65rem', color: '#06B6D4', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        className="ds-pulse-indicator"
                        style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06B6D4', boxShadow: '0 0 8px #06B6D4' }}
                      />
                      Active
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748B', transition: 'transform 0.2s ease' }}>→</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab: AI Outbreak & Billing Anomaly Alert Center */}
      {activeTab === 'ANOMALIES' && (
        <AiOutbreakBillingAnomalyCenterView />
      )}

      {/* Tab: Customizable Widget Grid */}
      {activeTab === 'CUSTOM_GRID' && (
        <CustomizableExecutiveWidgetGridView />
      )}

      {/* Tab: War Room */}
      {activeTab === 'WAR_ROOM' && (
        <NationalHealthcareWarRoomView />
      )}

      {/* Tab: EBITDA */}
      {activeTab === 'EBITDA' && (
        <RealtimeEbitdaUnitEconomicsView />
      )}

      {/* Tab: AI Voice & WhatsApp Triage */}
      {activeTab === 'AI_VOICE' && (
        <AiVoiceWhatsAppAgentStudioView />
      )}

      {/* Tab: ABDM National Health Stack Console */}
      {activeTab === 'ABDM_STACK' && (
        <AbdmNationalHealthStackConsoleView />
      )}

      {/* Tab: Multi-Cloud Disaster Recovery Drill */}
      {activeTab === 'DR_FAILOVER' && (
        <MultiCloudDisasterRecoveryDrillView />
      )}

      {/* Tab: LIMS HL7/ASTM IoT Hub */}
      {activeTab === 'LIMS_IOT' && (
        <LimsHl7AstmIotDeviceHubView />
      )}

      {/* Tab: Overview */}
      {activeTab === 'OVERVIEW' && (
        <>
          {/* 1. Executive Overview & Status Header */}
          <ExecutiveOverview
            metrics={data.metrics}
            lastUpdated={data.lastUpdated}
            isDevelopmentPreview={data.dataSource === 'development_preview'}
          />

          {/* 2. Key Operational KPI Summary */}
          <KpiSummary kpis={data.kpis} />

          {/* 3 & 4. Two Column Operational Grid: Alerts & Business Performance */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px'
            }}
          >
            <AlertsSection alerts={data.alerts} />
            <BusinessPerformance performance={data.businessPerformance} />
          </div>

          {/* 5 & 6. Quick Actions & Trends */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px'
            }}
          >
            <QuickActions actions={data.quickActions} />
            <TrendAnalytics trends={data.trends} />
          </div>

          {/* 7 & 8. Recent Activities & System Health Telemetry */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px'
            }}
          >
            <RecentActivities activities={data.recentActivities} />
            <SystemHealthSummary health={data.systemHealth} />
          </div>
        </>
      )}

      {/* Panic Lock Modal */}
      <PlatformEmergencyPanicLockModal
        isOpen={isPanicOpen}
        onClose={() => setIsPanicOpen(false)}
      />
    </div>
  );
};
