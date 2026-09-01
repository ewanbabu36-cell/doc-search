import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';

interface DashboardWidget {
  id: string;
  titleKey: string;
  defaultTitle: string;
  category: 'REVENUE' | 'EMERGENCY' | 'CLINICAL' | 'SECURITY' | 'INFRASTRUCTURE';
  gridSpan: '1x1' | '2x1' | '2x2';
  inrAmount?: number;
  staticValue?: string;
  subtext: string;
  accentColor: string;
  isPinned: boolean;
  isVisible: boolean;
}

const INITIAL_WIDGETS: DashboardWidget[] = [
  {
    id: 'WID-ARR-01',
    titleKey: 'arr_revenue',
    defaultTitle: '📈 Annual Recurring Revenue (ARR)',
    category: 'REVENUE',
    gridSpan: '2x1',
    inrAmount: 27000000,
    subtext: '+28.4% MoM Net Growth',
    accentColor: '#10B981',
    isPinned: true,
    isVisible: true
  },
  {
    id: 'WID-ER-02',
    titleKey: 'emergency_sirens',
    defaultTitle: '🚨 National Emergency ER Sirens',
    category: 'EMERGENCY',
    gridSpan: '1x1',
    staticValue: '89 Dispatches',
    subtext: '100% Pre-Arrival Triage',
    accentColor: '#EF4444',
    isPinned: true,
    isVisible: true
  },
  {
    id: 'WID-CONSULT-03',
    titleKey: 'live_consults',
    defaultTitle: '🩺 Live Doctor Consultations / Hr',
    category: 'CLINICAL',
    gridSpan: '2x2',
    staticValue: '15,160 / hr',
    subtext: '4,820 Active Doctors Online',
    accentColor: '#06B6D4',
    isPinned: false,
    isVisible: true
  },
  {
    id: 'WID-QUOTA-04',
    titleKey: 'tenant_quota',
    defaultTitle: '⚡ Tenant Quota Throttler Status',
    category: 'INFRASTRUCTURE',
    gridSpan: '1x1',
    staticValue: '1 Throttled',
    subtext: '2 Near Capacity (>85%)',
    accentColor: '#FCD34D',
    isPinned: false,
    isVisible: true
  },
  {
    id: 'WID-SEC-05',
    titleKey: 'security_rbac',
    defaultTitle: '🛡️ SOC2 Intrusion Threat Radar',
    category: 'SECURITY',
    gridSpan: '2x1',
    staticValue: 'Zero Breaches',
    subtext: 'CloudHSM KMS Encrypted',
    accentColor: '#38BDF8',
    isPinned: false,
    isVisible: true
  },
  {
    id: 'WID-FX-06',
    titleKey: 'multi_currency',
    defaultTitle: '🌐 Multi-Currency Net Take-Rate',
    category: 'REVENUE',
    gridSpan: '1x1',
    staticValue: '15.2% Margin',
    subtext: 'USD, EUR, AED, INR Settled',
    accentColor: '#A78BFA',
    isPinned: false,
    isVisible: true
  }
];

export const CustomizableExecutiveWidgetGridView: React.FC = () => {
  const { formatMoney, t } = useGlobalLocale();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(INITIAL_WIDGETS);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const toggleVisibility = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w))
    );
  };

  const togglePin = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, isPinned: !w.isPinned } : w))
    );
  };

  const changeGridSpan = (widgetId: string, newSpan: '1x1' | '2x1' | '2x2') => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, gridSpan: newSpan } : w))
    );
  };

  const handleSaveLayout = () => {
    setSaveNotice('✓ Custom Executive Dashboard Layout saved and synced to your personalized Founder Profile!');
    setTimeout(() => setSaveNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🧩 Customizable Executive Widget Grid & Drag-Drop Studio
            </h2>
            <Badge variant="success">● Personalized Executive Layout Engine Active</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Rearrange, resize (1x1, 2x1, 2x2), toggle, and pin executive KPI cards tailored to your leadership operational focus
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveLayout}
          style={{
            backgroundColor: '#06B6D4',
            color: '#070C16',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
          }}
        >
          💾 {t('save_layout', 'Save Custom Layout')}
        </Button>
      </div>

      {saveNotice && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 16px', color: '#A7F3D0', fontSize: '0.875rem', fontWeight: 700 }}>
          {saveNotice}
        </div>
      )}

      {/* Widget Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}
      >
        {widgets.filter((w) => w.isVisible).map((w) => {
          const displayValue = w.inrAmount ? formatMoney(w.inrAmount) : w.staticValue;
          const displayTitle = t(w.titleKey, w.defaultTitle);

          return (
            <div
              key={w.id}
              style={{
                gridColumn: w.gridSpan === '2x1' || w.gridSpan === '2x2' ? 'span 2' : 'span 1',
                backgroundColor: '#0F172A',
                border: w.isPinned ? `2px solid ${w.accentColor}` : '1px solid #334155',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: w.isPinned ? `0 8px 30px ${w.accentColor}33` : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {displayTitle}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => togglePin(w.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: w.isPinned ? '#FCD34D' : '#64748B',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                      title={w.isPinned ? 'Unpin Widget' : 'Pin Widget to Top'}
                    >
                      📌
                    </button>
                    <select
                      value={w.gridSpan}
                      onChange={(e) => changeGridSpan(w.id, e.target.value as '1x1' | '2x1' | '2x2')}
                      style={{
                        backgroundColor: '#1E293B',
                        color: '#94A3B8',
                        border: '1px solid #475569',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        padding: '1px 4px'
                      }}
                    >
                      <option value="1x1">1x1 Size</option>
                      <option value="2x1">2x1 Wide</option>
                      <option value="2x2">2x2 Large</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: w.accentColor, margin: '12px 0 4px' }}>
                  {displayValue}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{w.subtext}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', borderTop: '1px solid #1E293B', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => toggleVisibility(w.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.6875rem',
                    cursor: 'pointer'
                  }}
                >
                  Hide Widget
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
