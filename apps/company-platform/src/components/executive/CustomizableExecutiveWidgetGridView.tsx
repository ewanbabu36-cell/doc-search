import React, { useState, useEffect, useMemo } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';
import { riskManagementService, type CompanyRiskOverviewDto } from '../../services/risk-management-service.js';
import { executiveService, type DailyOperationsData } from '../../services/executive-service.js';
import type { ExecutiveDashboardData } from '../../types/executive.js';

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
    defaultTitle: 'Annual Recurring Revenue (ARR)',
    category: 'REVENUE',
    gridSpan: '2x1',
    staticValue: 'Loading...',
    subtext: 'Live PostgreSQL subscription ARR',
    accentColor: '#10B981',
    isPinned: true,
    isVisible: true,
    description: 'Consolidated SaaS subscription ARR and take-rate commissions'
  },
  {
    id: 'WID-ER-02',
    titleKey: 'emergency_sirens',
    defaultTitle: 'Active Hospital & Emergency Escalations',
    category: 'EMERGENCY',
    gridSpan: '1x1',
    staticValue: 'Loading...',
    subtext: 'Live clinical operations monitor',
    accentColor: '#EF4444',
    isPinned: true,
    isVisible: true,
    description: 'Unresolved hospital escalations and emergency triage arrivals'
  },
  {
    id: 'WID-CONSULT-03',
    titleKey: 'live_consults',
    defaultTitle: 'Today Appointments & OPD Volume',
    category: 'CLINICAL',
    gridSpan: '2x2',
    staticValue: 'Loading...',
    subtext: 'Completed & waiting consultations',
    accentColor: '#06B6D4',
    isPinned: false,
    isVisible: true,
    description: 'Real-time outpatient appointments across active partner clinics'
  },
  {
    id: 'WID-QUOTA-04',
    titleKey: 'tenant_quota',
    defaultTitle: 'Risk & Revenue Leakage Radar',
    category: 'INFRASTRUCTURE',
    gridSpan: '1x1',
    staticValue: 'Loading...',
    subtext: 'Open PostgreSQL risk alerts',
    accentColor: '#FCD34D',
    isPinned: false,
    isVisible: true,
    description: 'Detected leakage exposures across billing, licenses & COGS'
  },
  {
    id: 'WID-SEC-05',
    titleKey: 'security_rbac',
    defaultTitle: 'Platform Health & Security Isolation',
    category: 'SECURITY',
    gridSpan: '2x1',
    staticValue: 'Loading...',
    subtext: 'PostgreSQL RLS & SHA-256 Audit Ledger',
    accentColor: '#38BDF8',
    isPinned: false,
    isVisible: true,
    description: 'Multi-tenant RLS enforcement & active gateway status'
  },
  {
    id: 'WID-FX-06',
    titleKey: 'multi_currency',
    defaultTitle: 'Gross & EBITDA Margin %',
    category: 'REVENUE',
    gridSpan: '1x1',
    staticValue: 'Loading...',
    subtext: 'Live P&L unit profitability',
    accentColor: '#A78BFA',
    isPinned: false,
    isVisible: true,
    description: 'Net gross margin after recorded COGS and operating costs'
  },
  {
    id: 'WID-BED-07',
    titleKey: 'bed_occupancy',
    defaultTitle: 'Inpatient (IPD) Bed Occupancy',
    category: 'CLINICAL',
    gridSpan: '2x1',
    staticValue: 'Loading...',
    subtext: 'Live ward & ICU bed allocation',
    accentColor: '#F59E0B',
    isPinned: false,
    isVisible: true,
    description: 'Real-time occupied vs total IPD beds and ICU vacancy'
  },
  {
    id: 'WID-LIMS-08',
    titleKey: 'lims_volume',
    defaultTitle: 'Today Diagnostic Volume (LIMS & RIS)',
    category: 'CLINICAL',
    gridSpan: '1x1',
    staticValue: 'Loading...',
    subtext: 'Pathology tests & radiology orders',
    accentColor: '#10B981',
    isPinned: false,
    isVisible: true,
    description: 'Authoritative diagnostic investigation orders today'
  },
  {
    id: 'WID-PHARM-09',
    titleKey: 'pharm_sales',
    defaultTitle: 'Partner Clinical GMV & Rx Orders',
    category: 'REVENUE',
    gridSpan: '2x1',
    staticValue: 'Loading...',
    subtext: 'Take-rate & pharmacy dispensing volume',
    accentColor: '#A78BFA',
    isPinned: false,
    isVisible: true,
    description: 'Clinical GMV realized across partner hospitals & pharmacies'
  },
  {
    id: 'WID-BILLING-10',
    titleKey: 'unpaid_invoices',
    defaultTitle: 'B2B Receivables & Overdue Invoices',
    category: 'REVENUE',
    gridSpan: '1x1',
    staticValue: 'Loading...',
    subtext: 'Pending partner subscription dues',
    accentColor: '#EF4444',
    isPinned: false,
    isVisible: true,
    description: 'Pending & overdue invoices in company.invoices'
  },
  {
    id: 'WID-AI-11',
    titleKey: 'ai_copilot',
    defaultTitle: 'Net Company P&L / Burn Rate',
    category: 'CLINICAL',
    gridSpan: '1x1',
    staticValue: 'Loading...',
    subtext: 'Live revenue minus COGS & OPEX',
    accentColor: '#06B6D4',
    isPinned: false,
    isVisible: true,
    description: 'Monthly net profit or burn directly from PostgreSQL ledger'
  }
];

const STORAGE_KEY = 'docsearch_executive_custom_grid_layout_v4';

interface SavedProfileVault {
  version: string;
  savedAt: string;
  activeRolePreset: 'FOUNDER' | 'CFO' | 'CMO' | 'CTO';
  widgets: DashboardWidget[];
}

export const CustomizableExecutiveWidgetGridView: React.FC = () => {
  const { formatMoney, t } = useGlobalLocale();

  // Hydrate from LocalStorage vault
  const [vaultState] = useState<SavedProfileVault>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedProfileVault;
        if (parsed && Array.isArray(parsed.widgets) && parsed.widgets.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return {
      version: '3.0',
      savedAt: new Date().toLocaleTimeString(),
      activeRolePreset: 'FOUNDER',
      widgets: MASTER_WIDGET_CATALOG.slice(0, 6)
    };
  });

  const [widgets, setWidgets] = useState<DashboardWidget[]>(vaultState.widgets);
  const [activeRolePreset, setActiveRolePreset] = useState<'FOUNDER' | 'CFO' | 'CMO' | 'CTO'>(vaultState.activeRolePreset);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>(vaultState.savedAt);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'ALL' | 'REVENUE' | 'CLINICAL' | 'EMERGENCY' | 'SECURITY'>('ALL');
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [riskOv, setRiskOv] = useState<CompanyRiskOverviewDto | null>(null);
  const [opsData, setOpsData] = useState<DailyOperationsData | null>(null);
  const [execData, setExecData] = useState<ExecutiveDashboardData | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      riskManagementService.getOverview(),
      executiveService.getDailyOperations(),
      executiveService.getExecutiveDashboard()
    ]).then(([rRes, oRes, eRes]) => {
      if (!active) return;
      if (rRes.status === 'fulfilled') setRiskOv(rRes.value);
      if (oRes.status === 'fulfilled') setOpsData(oRes.value);
      if (eRes.status === 'fulfilled') setExecData(eRes.value);
    });
    return () => {
      active = false;
    };
  }, []);

  const liveMetrics = useMemo(() => {
    const pnl = riskOv?.pnl;
    const ops = opsData?.metrics;
    const exec = execData?.metrics;
    const totalBeds = ops?.totalBedsCount ?? 0;
    const occupiedBeds = ops?.occupiedBedsCount ?? 0;
    const bedPct = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';
    return new Map<string, { value: string; subtext?: string }>([
      [
        'WID-ARR-01',
        {
          value: pnl ? formatMoney(pnl.contractedArrInr) : formatMoney(0),
          subtext: `MRR: ${formatMoney(pnl?.contractedMrrInr ?? 0)} (${riskOv?.partnerSummary.paidPartners ?? 0} paid)`
        }
      ],
      [
        'WID-ER-02',
        {
          value: `${ops?.unresolvedEscalationsCount ?? 0} Unresolved`,
          subtext: `${ops?.pendingDoctorsCount ?? 0} Pending Dr Verifications`
        }
      ],
      [
        'WID-CONSULT-03',
        {
          value: `${ops?.appointmentsToday ?? 0} Today`,
          subtext: `${ops?.appointmentsCompleted ?? 0} Done • ${ops?.appointmentsWaiting ?? 0} Waiting`
        }
      ],
      [
        'WID-QUOTA-04',
        {
          value: `${riskOv?.openAlertsSummary.totalOpen ?? 0} Open Alerts`,
          subtext: `${riskOv?.openAlertsSummary.critical ?? 0} Critical • Burn: ${formatMoney(pnl?.totalDirectLeakageExposureInr ?? 0)}`
        }
      ],
      [
        'WID-SEC-05',
        {
          value: execData?.systemHealth?.overallStatus || 'OPERATIONAL',
          subtext: `${exec?.activeTenants ?? 0}/${exec?.totalTenants ?? 0} Active Tenants • ${exec?.totalBranches ?? 0} Branches`
        }
      ],
      [
        'WID-FX-06',
        {
          value: `${pnl?.grossMarginPercent ?? 0}% Gross`,
          subtext: `EBITDA Margin: ${pnl?.ebitdaMarginPercent ?? 0}%`
        }
      ],
      [
        'WID-BED-07',
        {
          value: `${bedPct}% Occupied`,
          subtext: `${occupiedBeds} / ${totalBeds} Beds (${ops?.vacantIcuBedsCount ?? 0} ICU free)`
        }
      ],
      [
        'WID-LIMS-08',
        {
          value: `${ops?.pathologyTestsToday ?? 0} Labs Today`,
          subtext: `${ops?.radiologyOrdersToday ?? 0} Radiology Orders Today`
        }
      ],
      [
        'WID-PHARM-09',
        {
          value: `${formatMoney(pnl?.partnerClinicalGmvInr ?? 0)} GMV`,
          subtext: `${ops?.rxOrdersToday ?? 0} Rx Today • Take-rate: ${formatMoney(pnl?.platformTakeRateInr ?? 0)}`
        }
      ],
      [
        'WID-BILLING-10',
        {
          value: formatMoney(pnl?.pendingReceivablesInr ?? 0),
          subtext: `Overdue: ${formatMoney(pnl?.overdueReceivablesInr ?? 0)}`
        }
      ],
      [
        'WID-AI-11',
        {
          value: pnl ? `${pnl.netProfitLossInr >= 0 ? '+' : '-'} ${formatMoney(Math.abs(pnl.netProfitLossInr))}` : formatMoney(0),
          subtext: (pnl?.netProfitLossInr ?? 0) >= 0 ? 'Net Profitable' : `Burn: ${formatMoney(pnl?.monthlyBurnRateInr ?? 0)}/mo`
        }
      ]
    ]);
  }, [riskOv, opsData, execData, formatMoney]);

  // Auto-Save Effect: Runs on every single widget, resize, pin, hide or preset mutation
  useEffect(() => {
    try {
      const now = new Date().toLocaleTimeString();
      const payload: SavedProfileVault = {
        version: '3.0',
        savedAt: now,
        activeRolePreset,
        widgets
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSavedTimestamp(now);
    } catch {}
  }, [widgets, activeRolePreset]);

  const applyRolePreset = (role: 'FOUNDER' | 'CFO' | 'CMO' | 'CTO') => {
    setActiveRolePreset(role);
    let targetIds: string[] = [];

    if (role === 'CFO') {
      targetIds = ['WID-ARR-01', 'WID-FX-06', 'WID-PHARM-09', 'WID-BILLING-10'];
    } else if (role === 'CMO') {
      targetIds = ['WID-CONSULT-03', 'WID-ER-02', 'WID-BED-07', 'WID-LIMS-08', 'WID-AI-11'];
    } else if (role === 'CTO') {
      targetIds = ['WID-SEC-05', 'WID-QUOTA-04', 'WID-AI-11', 'WID-ARR-01'];
    } else {
      targetIds = ['WID-ARR-01', 'WID-ER-02', 'WID-CONSULT-03', 'WID-QUOTA-04', 'WID-SEC-05', 'WID-FX-06'];
    }

    const newWidgets = MASTER_WIDGET_CATALOG.map((item) => ({
      ...item,
      isVisible: targetIds.includes(item.id),
      isPinned: targetIds.slice(0, 2).includes(item.id)
    }));

    setWidgets(newWidgets);
    setSaveNotice(`✓ Switched to "${role === 'CFO' ? '💰 CFO Financial' : role === 'CMO' ? '🩺 CMO Clinical' : role === 'CTO' ? '🛡️ CTO SecOps' : '👑 Founder Master'}" Preset & Auto-Saved to Vault!`);
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const toggleVisibility = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w))
    );
    setSaveNotice('✓ Visibility updated & Auto-Saved to Vault');
    setTimeout(() => setSaveNotice(null), 2500);
  };

  const togglePin = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, isPinned: !w.isPinned } : w))
    );
    setSaveNotice('✓ Pin state updated & Auto-Saved to Vault');
    setTimeout(() => setSaveNotice(null), 2500);
  };

  const changeGridSpan = (widgetId: string, newSpan: '1x1' | '2x1' | '2x2') => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, gridSpan: newSpan } : w))
    );
    setSaveNotice(`✓ Card resized to ${newSpan} & Auto-Saved to Vault`);
    setTimeout(() => setSaveNotice(null), 2500);
  };

  const handleAddWidgetFromCatalog = (item: DashboardWidget) => {
    setWidgets((prev) => {
      const exists = prev.some((w) => w.id === item.id);
      if (exists) {
        return prev.map((w) => (w.id === item.id ? { ...w, isVisible: true } : w));
      }
      return [...prev, { ...item, isVisible: true }];
    });
    setSaveNotice(`✓ Added "${item.defaultTitle}" & Auto-Saved to Vault!`);
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setSaveNotice('✓ Widget removed & Auto-Saved to Vault.');
    setTimeout(() => setSaveNotice(null), 2500);
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
    setSaveNotice('✓ Widget reordered & Auto-Saved to Vault!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleResetLayout = () => {
    applyRolePreset('FOUNDER');
  };

  // Export Profile Vault JSON
  const handleExportProfileVault = () => {
    const payload: SavedProfileVault = {
      version: '3.0',
      savedAt: new Date().toISOString(),
      activeRolePreset,
      widgets
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocSearch-Executive-Vault-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSaveNotice('✓ Exported Executive Profile Vault JSON backup successfully!');
    setTimeout(() => setSaveNotice(null), 3500);
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
            <Badge variant="success">● Vault Synced ({lastSavedTimestamp})</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Instant LocalStorage Vault Active: Every drag, resize, pin or preset is auto-saved in real-time and persists across page reloads.
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
            onClick={handleExportProfileVault}
            style={{ fontWeight: 700 }}
          >
            📤 Export Vault
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetLayout}
            style={{ fontWeight: 700 }}
          >
            🔄 Reset
          </Button>
        </div>
      </div>

      {/* 🎭 1-Click Executive Role Preset Switcher Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '10px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#E2E8F0' }}>
            🎭 1-Click Role Presets:
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Instant Auto-Save Enabled
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => applyRolePreset('FOUNDER')}
            style={{
              backgroundColor: activeRolePreset === 'FOUNDER' ? '#06B6D4' : '#1E293B',
              color: activeRolePreset === 'FOUNDER' ? '#070C16' : '#94A3B8',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeRolePreset === 'FOUNDER' ? '0 0 15px rgba(6, 182, 212, 0.4)' : 'none'
            }}
          >
            👑 Founder / Master View
          </button>

          <button
            type="button"
            onClick={() => applyRolePreset('CFO')}
            style={{
              backgroundColor: activeRolePreset === 'CFO' ? '#10B981' : '#1E293B',
              color: activeRolePreset === 'CFO' ? '#070C16' : '#86EFAC',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeRolePreset === 'CFO' ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            💰 CFO Financial View
          </button>

          <button
            type="button"
            onClick={() => applyRolePreset('CMO')}
            style={{
              backgroundColor: activeRolePreset === 'CMO' ? '#06B6D4' : '#1E293B',
              color: activeRolePreset === 'CMO' ? '#070C16' : '#67E8F9',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeRolePreset === 'CMO' ? '0 0 15px rgba(6, 182, 212, 0.4)' : 'none'
            }}
          >
            🩺 CMO Clinical View
          </button>

          <button
            type="button"
            onClick={() => applyRolePreset('CTO')}
            style={{
              backgroundColor: activeRolePreset === 'CTO' ? '#38BDF8' : '#1E293B',
              color: activeRolePreset === 'CTO' ? '#070C16' : '#BAE6FD',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeRolePreset === 'CTO' ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none'
            }}
          >
            🛡️ CTO / SecOps View
          </button>
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
          const live = liveMetrics.get(w.id);
          const displayValue = live?.value ?? (w.inrAmount ? formatMoney(w.inrAmount) : w.staticValue || '—');
          const displaySubtext = live?.subtext ?? w.subtext;
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
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{displaySubtext}</span>
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
                const live = liveMetrics.get(item.id);
                const displayVal = live?.value ?? (item.inrAmount ? formatMoney(item.inrAmount) : item.staticValue || '—');

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
