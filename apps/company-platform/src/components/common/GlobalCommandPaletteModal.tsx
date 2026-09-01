import React, { useState, useEffect, useRef } from 'react';

export interface CommandItem {
  id: string;
  category: 'DOMAINS' | 'QUICK_ACTIONS' | 'SYSTEM_TELEMETRY';
  icon: string;
  title: string;
  subtitle: string;
  shortcut?: string;
  onSelect: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateDomain: (domainId: string) => void;
}

export const GlobalCommandPaletteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateDomain
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const ALL_COMMANDS: CommandItem[] = [
    // Domains
    {
      id: 'dom-exec',
      category: 'DOMAINS',
      icon: '⚡',
      title: 'Executive & Command Center',
      subtitle: 'National Healthcare War-Room, Real-time EBITDA & Panic Siren',
      shortcut: 'G E',
      onSelect: () => {
        onNavigateDomain('executive-command-center');
        onClose();
      }
    },
    {
      id: 'dom-growth',
      category: 'DOMAINS',
      icon: '👑',
      title: 'Growth & Organic Expansion HQ',
      subtitle: 'SEO programmatic pages, doctor affiliate engine & plan studio',
      shortcut: 'G G',
      onSelect: () => {
        onNavigateDomain('growth-engine');
        onClose();
      }
    },
    {
      id: 'dom-crm',
      category: 'DOMAINS',
      icon: '🏢',
      title: 'CRM & Partner Lifecycle HQ',
      subtitle: 'Doctor onboarding, NMC registry verify & WhatsApp broadcaster',
      shortcut: 'G C',
      onSelect: () => {
        onNavigateDomain('crm-partner-lifecycle');
        onClose();
      }
    },
    {
      id: 'dom-prod',
      category: 'DOMAINS',
      icon: '📦',
      title: 'Product, Plans & Entitlements HQ',
      subtitle: 'Feature flags canary rollout, API quotas & clinical add-ons',
      shortcut: 'G P',
      onSelect: () => {
        onNavigateDomain('product-plans-entitlements');
        onClose();
      }
    },
    {
      id: 'dom-bill',
      category: 'DOMAINS',
      icon: '💳',
      title: 'Billing, Invoicing & Global Tax HQ',
      subtitle: 'Global Tax Ledger, GST E-Invoicing, TPA claims & doctor escrow',
      shortcut: 'G B',
      onSelect: () => {
        onNavigateDomain('subscription-billing-finance');
        onClose();
      }
    },
    {
      id: 'dom-sales',
      category: 'DOMAINS',
      icon: '📈',
      title: 'Sales Pipeline & ARR Forecast HQ',
      subtitle: 'AI Lead Scorer, ARR Deal Forecast & Field BDM GPS tracker',
      shortcut: 'G S',
      onSelect: () => {
        onNavigateDomain('sales-marketing');
        onClose();
      }
    },
    {
      id: 'dom-integ',
      category: 'DOMAINS',
      icon: '🔌',
      title: 'API, Interoperability & Webhook Ingress',
      subtitle: 'Custom Webhooks, Zapier/Slack bridge, HL7 FHIR & ABDM 2.0',
      shortcut: 'G I',
      onSelect: () => {
        onNavigateDomain('api-integration-interoperability');
        onClose();
      }
    },
    {
      id: 'dom-sec',
      category: 'DOMAINS',
      icon: '🛡️',
      title: 'Security, CloudHSM & SOC2 Audit HQ',
      subtitle: 'SIEM threat radar, FIPS key rotation & SOC2 evidence lock',
      shortcut: 'G K',
      onSelect: () => {
        onNavigateDomain('security-rbac-policy-audit');
        onClose();
      }
    },
    {
      id: 'dom-admin',
      category: 'DOMAINS',
      icon: '🏛️',
      title: 'Company Administration & Corporate Governance',
      subtitle: 'MCA/ROC resolution vault, statutory POSH desk & subsidiary escrow',
      shortcut: 'G A',
      onSelect: () => {
        onNavigateDomain('company-admin-governance');
        onClose();
      }
    },

    // Quick Actions
    {
      id: 'act-panic',
      category: 'QUICK_ACTIONS',
      icon: '🚨',
      title: 'Trigger Pan-India Emergency Siren',
      subtitle: 'Push global high-priority banner across all Doctor & Patient apps',
      shortcut: '⇧ ⌘ P',
      onSelect: () => {
        onNavigateDomain('executive-command-center');
        onClose();
      }
    },
    {
      id: 'act-dunning',
      category: 'QUICK_ACTIONS',
      icon: '⚡',
      title: 'Execute Smart Dunning Recurring Recovery',
      subtitle: 'Recover failed hospital subscription invoices via UPI auto-debit',
      shortcut: '⇧ ⌘ D',
      onSelect: () => {
        onNavigateDomain('subscription-billing-finance');
        onClose();
      }
    },
    {
      id: 'act-nmc',
      category: 'QUICK_ACTIONS',
      icon: '🩺',
      title: 'Verify Doctor NMC / State Council Registry',
      subtitle: 'Automated digital verification with National Medical Commission',
      shortcut: '⇧ ⌘ V',
      onSelect: () => {
        onNavigateDomain('crm-partner-lifecycle');
        onClose();
      }
    },
    {
      id: 'act-webhook',
      category: 'QUICK_ACTIONS',
      icon: '⚡',
      title: 'Dispatch Test Webhook Payload (Zapier / Slack)',
      subtitle: 'Test external health cloud event trigger integration',
      shortcut: '⇧ ⌘ W',
      onSelect: () => {
        onNavigateDomain('api-integration-interoperability');
        onClose();
      }
    }
  ];

  const filteredCommands = ALL_COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 12, 22, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 10060,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #06B6D4',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(6, 182, 212, 0.4)',
          color: '#F8FAFC'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #334155', gap: '12px' }}>
          <span style={{ fontSize: '1.25rem', color: '#06B6D4' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a domain, quick action, or command (e.g. 'Tax', 'War-Room', 'NMC', 'Siren')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFF',
              fontSize: '1rem',
              fontWeight: 600
            }}
          />
          <span style={{ backgroundColor: '#1E293B', color: '#94A3B8', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontSize: '0.6875rem', fontWeight: 800 }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
              No matching commands or domains found for &quot;{query}&quot;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                    border: isSelected ? '1px solid #06B6D4' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{cmd.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                        {cmd.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {cmd.subtitle}
                      </div>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <span style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontSize: '0.6875rem', fontWeight: 800 }}>
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderTop: '1px solid #334155', backgroundColor: '#090D16', fontSize: '0.6875rem', color: '#64748B' }}>
          <span>Navigation: <kbd style={{ color: '#94A3B8' }}>↑</kbd> <kbd style={{ color: '#94A3B8' }}>↓</kbd> to select • <kbd style={{ color: '#94A3B8' }}>↵ Enter</kbd> to open</span>
          <span style={{ color: '#06B6D4', fontWeight: 700 }}>⚡ DocSearch Global Spotlight Hub</span>
        </div>
      </div>
    </div>
  );
};
