import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface ActionInboxItem {
  id: string;
  category: 'FINANCE_DUNNING' | 'SUPPLY_CHAIN_PO' | 'COMPLIANCE_NMC' | 'BED_SURGE';
  title: string;
  description: string;
  urgency: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
  metadata?: Record<string, string>;
  resolved: boolean;
}

const INITIAL_INBOX_ITEMS: ActionInboxItem[] = [
  {
    id: 'ACT-001',
    category: 'BED_SURGE',
    title: 'ICU Critical Capacity Surge (>90%)',
    description: 'Apollo Speciality Multispeciality Hospital ICU is at 94% occupancy. 2 ventilator beds remaining.',
    urgency: 'CRITICAL',
    timestamp: '5 mins ago',
    resolved: false
  },
  {
    id: 'ACT-002',
    category: 'FINANCE_DUNNING',
    title: 'Failed e-NACH Mandate Recovery Required',
    description: 'Care Plus Multispeciality (₹24,999) failed bank timeout. ML smart retry scheduled for peak liquidity window.',
    urgency: 'WARNING',
    timestamp: '18 mins ago',
    resolved: false
  },
  {
    id: 'ACT-003',
    category: 'SUPPLY_CHAIN_PO',
    title: '3-Way PO Variance (+5.5% Overcharge)',
    description: 'Cipla Meropenem 1g invoice exceeds PO unit rate by ₹13.50/vial (₹13,500 total variance). Needs AP sign-off.',
    urgency: 'WARNING',
    timestamp: '42 mins ago',
    resolved: false
  },
  {
    id: 'ACT-004',
    category: 'COMPLIANCE_NMC',
    title: 'Physician License Sanction Alert',
    description: 'Maharashtra Medical Council marked Dr. Nilesh Kulkarni (MMC-33108) as SUSPENDED. Prescription privileges flagged.',
    urgency: 'CRITICAL',
    timestamp: '1 hour ago',
    resolved: false
  }
];

export interface GlobalActionInboxFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDomain?: (domainId: string, context?: Record<string, string>) => void;
}

export const GlobalActionInboxFlyout: React.FC<GlobalActionInboxFlyoutProps> = ({
  isOpen,
  onClose,
  onNavigateToDomain
}) => {
  const [items, setItems] = useState<ActionInboxItem[]>(INITIAL_INBOX_ITEMS);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'FINANCE' | 'SUPPLY'>('ALL');
  const [toast, setToast] = useState<string | null>(null);

  const activeItems = items.filter((item) => {
    if (item.resolved) return false;
    if (filter === 'CRITICAL') return item.urgency === 'CRITICAL';
    if (filter === 'FINANCE') return item.category === 'FINANCE_DUNNING';
    if (filter === 'SUPPLY') return item.category === 'SUPPLY_CHAIN_PO';
    return true;
  });

  const handleQuickResolve = (item: ActionInboxItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, resolved: true } : i))
    );
    setToast(`✓ Action resolved: ${item.title}`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModule = (item: ActionInboxItem) => {
    if (item.category === 'BED_SURGE') {
      onNavigateToDomain?.('executive-command-center', { tab: 'BED_TELEMETRY' });
    } else if (item.category === 'FINANCE_DUNNING') {
      onNavigateToDomain?.('subscription-billing-finance', { tab: 'smart-dunning' });
    } else if (item.category === 'SUPPLY_CHAIN_PO') {
      onNavigateToDomain?.('central-supply-chain', { tab: 'THREE_WAY_MATCHING' });
    } else if (item.category === 'COMPLIANCE_NMC') {
      onNavigateToDomain?.('crm-partner-lifecycle', { tab: 'NMC_REGISTRY_HUB' });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        backgroundColor: 'rgba(2, 6, 23, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          backgroundColor: '#0F172A',
          borderLeft: '1px solid #1E293B',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          color: '#F8FAFC'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0B132B'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📬</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                Enterprise Action Inbox
              </h3>
              <Badge variant="danger">{activeItems.length}</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
              Pending critical escalations across Bed Grid, Dunning & Supply Chain
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#059669',
              color: '#FFF',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {toast}
          </div>
        )}

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 16px',
            borderBottom: '1px solid #1E293B',
            backgroundColor: '#0B132B'
          }}
        >
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'CRITICAL', label: '🚨 Critical' },
            { id: 'FINANCE', label: '💳 Finance' },
            { id: 'SUPPLY', label: '⚖️ Supply PO' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              style={{
                backgroundColor: filter === f.id ? '#0284C7' : '#1E293B',
                color: filter === f.id ? '#FFF' : '#94A3B8',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Action Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontWeight: 600, color: '#94A3B8' }}>Inbox Zero!</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>All clinical, financial, and supply chain actions are cleared.</div>
            </div>
          ) : (
            activeItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#1E293B',
                  border: item.urgency === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #334155',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Badge variant={item.urgency === 'CRITICAL' ? 'danger' : 'warning'}>
                      {item.urgency}
                    </Badge>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.timestamp}</span>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F8FAFC' }}>
                  {item.title}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: '1.4' }}>
                  {item.description}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Button
                    variant="primary"
                    onClick={() => handleOpenModule(item)}
                    style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  >
                    Open Desk →
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleQuickResolve(item)}
                    style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  >
                    Mark Resolved
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1E293B', backgroundColor: '#0B132B', fontSize: '0.72rem', color: '#64748B', textAlign: 'center' }}>
          Real-time webhook and telemetry synchronization enabled
        </div>
      </div>
    </div>
  );
};
