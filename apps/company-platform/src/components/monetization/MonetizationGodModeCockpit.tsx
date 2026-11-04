import React, { useState } from 'react';
import { Badge } from '@docsearch/ui-kit';
import { MonetizationEngineView } from './MonetizationEngineView.js';
import { MicroAddonsMarketplacePanel } from './MicroAddonsMarketplacePanel.js';
import { UsageQuotaThrottlerPanel } from './UsageQuotaThrottlerPanel.js';
import { TpaClaimFactoringPanel } from './TpaClaimFactoringPanel.js';
import { AiChurnRadarPanel } from './AiChurnRadarPanel.js';
import { DoctorAffiliateLoopPanel } from './DoctorAffiliateLoopPanel.js';
import { B2BGstInvoicingHub } from './B2BGstInvoicingHub.js';

export type MonetizationCockpitTab =
  | 'LICENSE_ENGINE'
  | 'MICRO_ADDONS'
  | 'USAGE_QUOTAS'
  | 'T0_FACTORING'
  | 'CHURN_RADAR'
  | 'DOCTOR_AFFILIATES'
  | 'GST_INVOICING';

interface TabConfig {
  id: MonetizationCockpitTab;
  label: string;
  icon: string;
  badge?: string;
  description: string;
}

const COCKPIT_TABS: TabConfig[] = [
  {
    id: 'LICENSE_ENGINE',
    label: 'License Lifecycle & Pricing',
    icon: '⚡',
    badge: '100% Free / Lowest Price',
    description: 'Free launch lock, ₹499/mo disruptor pricing, renewals & 15-day grace periods'
  },
  {
    id: 'MICRO_ADDONS',
    label: 'Micro-Addons App Store',
    icon: '🧩',
    badge: '6 Add-ons',
    description: 'AI Scribe, WhatsApp Bot, Smart TV Kiosk, OT Surgery & Blood Bank'
  },
  {
    id: 'USAGE_QUOTAS',
    label: 'Smart Usage Quotas',
    icon: '🎛️',
    badge: 'Real-time Throttle',
    description: 'WhatsApp messages, DICOM storage GB, AI Scribe minutes & VIP bypass'
  },
  {
    id: 'T0_FACTORING',
    label: 'T-0 Claim Factoring Desk',
    icon: '🏦',
    badge: '80% Day-0 Cash',
    description: 'Day-0 liquidity advance for hospital cashless claims with 2% factoring take'
  },
  {
    id: 'CHURN_RADAR',
    label: 'AI Churn Radar',
    icon: '📡',
    badge: 'Auto-Retention',
    description: 'Dormancy risk scoring (0-100), WhatsApp outreach & 50% discount offers'
  },
  {
    id: 'DOCTOR_AFFILIATES',
    label: 'Viral Doctor Affiliates',
    icon: '🤝',
    badge: '15% Recurring',
    description: 'Doctor invite links, QR codes, affiliate tracking & batch UPI payouts'
  },
  {
    id: 'GST_INVOICING',
    label: 'B2B GST E-Invoicing',
    icon: '📑',
    badge: '18% SAC 998313',
    description: 'Govt. IRN issuance, signed B2B QR codes & GSTR-1 input credit receipts'
  }
];

export const MonetizationGodModeCockpit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MonetizationCockpitTab>('LICENSE_ENGINE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Master Cockpit Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090D16 0%, #0F172A 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>👑</span>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                Monetization Engine & Revenue Lifecycle HQ
              </h1>
              <Badge variant="success">Founder God-Mode Active</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#94A3B8', maxWidth: '820px', lineHeight: '1.6' }}>
              Pan-India healthcare monetization command center. Orchestrate 100% Free Launch viral adoption, the world&apos;s lowest SaaS pricing (₹499/mo), modular clinical micro-addons, T-0 insurance claim liquidity factoring, and zero-leakage B2B GST compliance.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#38BDF8',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '8px 14px',
                borderRadius: '10px'
              }}
            >
              🚀 Global Strategy: 100% Free Launch Active
            </span>
          </div>
        </div>

        {/* Top Metric Bar: Live GMV, Fintech Payment Take-Rate (0.5%), T-0 Insurance Advance Volume, Active MRR/ARR, and Doctor Savings */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px'
          }}
        >
          <div style={{ backgroundColor: '#0B1120', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>NETWORK LIVE GMV</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ 42,85,000
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#38BDF8', marginTop: '2px' }}>Consults, Labs & Rx</div>
          </div>

          <div style={{ backgroundColor: '#0B1120', borderRadius: '12px', padding: '14px', border: '1px solid #10B981' }}>
            <div style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>FINTECH PAYMENT TAKE-RATE</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#10B981', marginTop: '2px', fontFamily: 'monospace' }}>
              0.5% Net Margin
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#86EFAC', marginTop: '2px' }}>₹ 21,425 Pure Take</div>
          </div>

          <div style={{ backgroundColor: '#0B1120', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase' }}>T-0 INSURANCE ADVANCES</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ 12,40,000
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#FDE68A', marginTop: '2px' }}>2.0% Factoring Revenue</div>
          </div>

          <div style={{ backgroundColor: '#0B1120', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#C084FC', fontWeight: 800, textTransform: 'uppercase' }}>ANNUAL RUN-RATE (ARR)</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#C084FC', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ 46.08 Lakhs
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#E9D5FF', marginTop: '2px' }}>MRR: ₹ 3,84,000</div>
          </div>

          <div style={{ backgroundColor: '#0B1120', borderRadius: '12px', padding: '14px', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>DOCTOR SAVINGS COUNTER</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', fontFamily: 'monospace' }}>
              ₹ 28,50,000
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#7DD3FC', marginTop: '2px' }}>80% Saved vs Rivals</div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '24px',
            overflowX: 'auto',
            paddingBottom: '4px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {COCKPIT_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #38BDF8' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  color: isActive ? '#38BDF8' : '#94A3B8',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      color: isActive ? '#7DD3FC' : '#64748B'
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'LICENSE_ENGINE' && <MonetizationEngineView />}
      {activeTab === 'MICRO_ADDONS' && <MicroAddonsMarketplacePanel />}
      {activeTab === 'USAGE_QUOTAS' && <UsageQuotaThrottlerPanel />}
      {activeTab === 'T0_FACTORING' && <TpaClaimFactoringPanel />}
      {activeTab === 'CHURN_RADAR' && <AiChurnRadarPanel />}
      {activeTab === 'DOCTOR_AFFILIATES' && <DoctorAffiliateLoopPanel />}
      {activeTab === 'GST_INVOICING' && <B2BGstInvoicingHub />}
    </div>
  );
};
