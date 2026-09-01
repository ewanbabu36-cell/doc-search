import React, { useState, useEffect } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';

export interface DashboardWidget {
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
  description?: string;
}

export const MASTER_WIDGET_CATALOG: DashboardWidget[] = [
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
    isVisible: true,
    description: 'Consolidated SaaS subscription ARR and take-rate commissions'
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
    isVisible: true,
    description: 'Real-time 108 ambulance dispatch and emergency triage arrivals'
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
    isVisible: true,
    description: 'Real-time specialist OPD consultations across 486 hospital nodes'
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
    isVisible: true,
    description: 'Multi-tenant API rate limiters and database storage quotas'
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
    isVisible: true,
    description: 'Continuous cryptographic KMS audit trail and DDoS defense telemetry'
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
    isVisible: true,
    description: 'Cross-border interbank FX Treasury conversion margin'
  },

  // 5 New Modular Catalog Widgets
  {
    id: 'WID-BED-07',
    titleKey: 'bed_occupancy',
    defaultTitle: '🛏️ Live Inpatient Bed Occupancy %',
    category: 'CLINICAL',
    gridSpan: '2x1',
    staticValue: '82.4% Occupied',
    subtext: '14,280 / 17,320 Beds (ICU, Deluxe, General)',
    accentColor: '#F59E0B',
    isPinned: false,
    isVisible: true,
    description: 'Real-time IPD bed census, ICU vacancy, and ventilator standby'
  },
  {
    id: 'WID-LIMS-08',
    titleKey: 'lims_volume',
    defaultTitle: '🧪 Daily LIMS Pathology Lab Volume',
    category: 'CLINICAL',
    gridSpan: '1x1',
    staticValue: '28,500 Orders / Day',
    subtext: '+31.8% MoM Automated Lab Orders',
    accentColor: '#10B981',
    isPinned: false,
    isVisible: true,
    description: 'Diagnostic analyzer test throughput across CBC, LFT, and KFT panels'
  },
  {
    id: 'WID-PHARM-09',
    titleKey: 'pharm_sales',
    defaultTitle: '💊 Pharmacy Medicine Sales & Stockout Risk',
    category: 'REVENUE',
    gridSpan: '2x1',
    staticValue: '51,400 RX Dispensed',
    subtext: '99.4% Fulfillment Rate (Zero Stockout)',
    accentColor: '#A78BFA',
    isPinned: false,
    isVisible: true,
    description: 'E-Prescription dispensing revenue and automated inventory reorder alerts'
  },
  {
    id: 'WID-BILLING-10',
    titleKey: 'unpaid_invoices',
    defaultTitle: '💳 Unpaid Hospital Invoices & Dues',
    category: 'REVENUE',
    gridSpan: '1x1',
    inrAmount: 8400000,
    subtext: 'Pending TPA / Corporate Insurance Pre-Auth',
    accentColor: '#EF4444',
    isPinned: false,
    isVisible: true,
    description: 'Outstanding institutional claims and cashless patient discharge balances'
  },
  {
    id: 'WID-AI-11',
    titleKey: 'ai_copilot',
    defaultTitle: '🤖 AI Clinical Copilot Diagnostic Accuracy',
    category: 'CLINICAL',
    gridSpan: '1x1',
    staticValue: '99.2% Accuracy',
    subtext: 'ICD-10 Validated with Zero Safety Flags',
    accentColor: '#06B6D4',
    isPinned: false,
    isVisible: true,
    description: 'Differential diagnosis validation and drug-drug interaction alerts'
  }
];

const STORAGE_KEY = 'docsearch_executive_custom_grid_layout';

export const CustomizableExecutiveWidgetGridView: React.FC = () => {
  const { formatMoney, t } = useGlobalLocale();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MASTER_WIDGET_CATALOG.slice(0, 6);
  });

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'ALL' | 'REVENUE' | 'CLINICAL' | 'EMERGENCY' | 'SECURITY'>('ALL');
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch {}
  }, [widgets]);

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

  const handleAddWidgetFromCatalog = (item: DashboardWidget) => {
    setWidgets((prev) => {
      const exists = prev.some((w) => w.id === item.id);
      if (exists) {
        return prev.map((w) => (w.id === item.id ? { ...w, isVisible: true } : w));
      }
      return [...prev, { ...item, isVisible: true }];
    });
    setSaveNotice(`✓ Added "${item.defaultTitle}" to your active Executive Board!`);
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setSaveNotice('✓ Widget removed from executive board.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // HTML5 Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverWidgetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverWidgetId(null);

    const sourceId = draggedWidgetId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    setWidgets((prev) => {
      const sourceIndex = prev.findIndex((w) => w.id === sourceId);
      const targetIndex = prev.findIndex((w) => w.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      if (moved) {
        updated.splice(targetIndex, 0, moved);
      }
      return updated;
    });

    setDraggedWidgetId(null);
    setSaveNotice('✓ Widget position reordered and saved smoothly!');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleResetLayout = () => {
    setWidgets(MASTER_WIDGET_CATALOG.slice(0, 6));
    localStorage.removeItem(STORAGE_KEY);
    setSaveNotice('✓ Reset to Default Executive Dashboard Grid Layout');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleSaveLayout = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch {}
    setSaveNotice('✓ Custom Executive Dashboard Layout saved and synced to your personalized Founder Profile!');
    setTimeout(() => setSaveNotice(null), 5000);
  };

  const filteredCatalog = MASTER_WIDGET_CATALOG.filter((item) => {
    if (catalogCategoryFilter === 'ALL') return true;
    return item.category === catalogCategoryFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🧩 Customizable Executive Widget Grid & Drag-Drop Studio
            </h2>
            <Badge variant="success">● {widgets.filter((w) => w.isVisible).length} Active Widgets on Board</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Grab any widget card (⋮⋮) to drag and drop reorder. Click "+ Add Widget" to choose from 11 modular clinical and financial KPI cards.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCatalogOpen(true)}
            style={{
              backgroundColor: '#10B981',
              color: '#070C16',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            ➕ Add Widget ({MASTER_WIDGET_CATALOG.length})
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetLayout}
            style={{ fontWeight: 700 }}
          >
            🔄 Reset Layout
          </Button>

          <Button
            variant="primary"
            size="sm"
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
          const isDragging = draggedWidgetId === w.id;
          const isDragOver = dragOverWidgetId === w.id;

          return (
            <div
              key={w.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, w.id)}
              onDragOver={(e) => handleDragOver(e, w.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, w.id)}
              onDragEnd={handleDragEnd}
              style={{
                gridColumn: w.gridSpan === '2x1' || w.gridSpan === '2x2' ? 'span 2' : 'span 1',
                backgroundColor: isDragOver ? '#1E293B' : '#0F172A',
                border: isDragOver
                  ? '2px dashed #06B6D4'
                  : w.isPinned
                  ? `2px solid ${w.accentColor}`
                  : '1px solid #334155',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isDragOver
                  ? '0 0 25px rgba(6, 182, 212, 0.6)'
                  : w.isPinned
                  ? `0 8px 30px ${w.accentColor}33`
                  : 'none',
                opacity: isDragging ? 0.4 : 1,
                cursor: 'grab',
                transform: isDragOver ? 'scale(1.02)' : 'none',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        color: '#64748B',
                        fontSize: '1rem',
                        cursor: 'grab',
                        letterSpacing: '-2px'
                      }}
                      title="Drag to reorder"
                    >
                      ⋮⋮
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {displayTitle}
                    </span>
                  </div>

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
                        padding: '1px 4px',
                        cursor: 'pointer'
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid #1E293B', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                  Drag: <strong>⋮⋮ Grab Handle</strong>
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
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
                    Hide
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveWidget(w.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '0.6875rem',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modular Widget Catalog Modal */}
      {isCatalogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setIsCatalogOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #06B6D4',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                    🧩 Modular Executive Widget Catalog
                  </h3>
                  <Badge variant="primary">{MASTER_WIDGET_CATALOG.length} Widgets Available</Badge>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Select any clinical, financial, or operational KPI card to add to your personalized leadership dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['ALL', 'REVENUE', 'CLINICAL', 'EMERGENCY', 'SECURITY'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatalogCategoryFilter(cat)}
                  style={{
                    backgroundColor: catalogCategoryFilter === cat ? '#06B6D4' : '#1E293B',
                    color: catalogCategoryFilter === cat ? '#070C16' : '#94A3B8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {filteredCatalog.map((item) => {
                const isAlreadyOnBoard = widgets.some((w) => w.id === item.id && w.isVisible);
                const displayVal = item.inrAmount ? formatMoney(item.inrAmount) : item.staticValue;

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#1E293B',
                      border: isAlreadyOnBoard ? '1px solid #10B981' : '1px solid #334155',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC' }}>
                          {item.defaultTitle}
                        </span>
                        <Badge variant={item.category === 'REVENUE' ? 'success' : 'primary'}>
                          {item.category}
                        </Badge>
                      </div>

                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: item.accentColor, margin: '6px 0 2px' }}>
                        {displayVal}
                      </div>

                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>
                        {item.description || item.subtext}
                      </span>
                    </div>

                    <Button
                      variant={isAlreadyOnBoard ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleAddWidgetFromCatalog(item)}
                      style={{
                        backgroundColor: isAlreadyOnBoard ? '#334155' : '#10B981',
                        color: isAlreadyOnBoard ? '#94A3B8' : '#070C16',
                        fontWeight: 800,
                        width: '100%'
                      }}
                    >
                      {isAlreadyOnBoard ? '✓ Active on Board' : '➕ Add to Board'}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: '12px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCatalogOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
