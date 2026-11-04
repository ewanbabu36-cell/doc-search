import React, { useState, useEffect, useRef, useMemo } from 'react';

export type SpotlightCategory =
  | 'ALL'
  | 'PATIENT'
  | 'DOCTOR'
  | 'BED'
  | 'SUPPLY_FINANCE'
  | 'CLINICAL_PROTOCOL'
  | 'NAVIGATION';

export interface SpotlightEntityItem {
  id: string;
  category: SpotlightCategory;
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  icon: string;
  keywords: string[];
  clinicalDomain?: string;
  onSelect?: () => void;
  metadata?: Record<string, string>;
}

export interface DocSearchOmniSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDomain?: (domainId: string, context?: Record<string, string>) => void;
  customEntities?: SpotlightEntityItem[];
}

const DEFAULT_GLOBAL_INDEX: SpotlightEntityItem[] = [
  // Patients
  {
    id: 'pat-001',
    category: 'PATIENT',
    title: 'Aarav Patel (UHID-2026-0812)',
    subtitle: 'Male, 42 yrs • Blood: B+ • Active Admission: ICU-VENT-02',
    badge: 'ICU ADMITTED',
    badgeVariant: 'danger',
    icon: '👤',
    keywords: ['aarav', 'patel', '0812', 'uhid-2026-0812', 'icu'],
    metadata: { domain: 'crm-partner-lifecycle', patientId: 'pat-001' }
  },
  {
    id: 'pat-002',
    category: 'PATIENT',
    title: 'Meera Deshmukh (UHID-2026-0944)',
    subtitle: 'Female, 28 yrs • Blood: O+ • OPD Token #14 (Dr. Sethi)',
    badge: 'OPD QUEUE',
    badgeVariant: 'primary',
    icon: '👤',
    keywords: ['meera', 'deshmukh', '0944', 'uhid-2026-0944', 'opd'],
    metadata: { domain: 'crm-partner-lifecycle', patientId: 'pat-002' }
  },
  {
    id: 'pat-003',
    category: 'PATIENT',
    title: 'Gurpreet Singh (UHID-2026-1029)',
    subtitle: 'Male, 61 yrs • Blood: A+ • Post-Op Recovery PACU Bed-04',
    badge: 'PACU RECOVERY',
    badgeVariant: 'warning',
    icon: '👤',
    keywords: ['gurpreet', 'singh', '1029', 'uhid-2026-1029', 'pacu', 'ot'],
    metadata: { domain: 'crm-partner-lifecycle', patientId: 'pat-003' }
  },

  // Doctors
  {
    id: 'doc-001',
    category: 'DOCTOR',
    title: 'Dr. Rohan Sethi (DMC-44120)',
    subtitle: 'Chief Interventional Cardiologist • AIIMS Alumnus • NMC Verified',
    badge: 'NMC VERIFIED',
    badgeVariant: 'success',
    icon: '🩺',
    keywords: ['rohan', 'sethi', 'cardiologist', 'dmc-44120', 'aiims'],
    metadata: { domain: 'partner-staff-management', doctorId: 'doc-001' }
  },
  {
    id: 'doc-002',
    category: 'DOCTOR',
    title: 'Dr. Priya Venkatraman (KMC-99211)',
    subtitle: 'Consultant Surgical Oncologist • CMC Vellore • MCh Surgical Oncology',
    badge: 'NMC VERIFIED',
    badgeVariant: 'success',
    icon: '🩺',
    keywords: ['priya', 'venkatraman', 'oncology', 'kmc-99211', 'surgeon'],
    metadata: { domain: 'partner-staff-management', doctorId: 'doc-002' }
  },
  {
    id: 'doc-003',
    category: 'DOCTOR',
    title: 'Dr. Nilesh Kulkarni (MMC-33108)',
    subtitle: 'Orthopaedic Surgeon • Maharashtra Council • Status: Suspended',
    badge: 'SUSPENDED',
    badgeVariant: 'danger',
    icon: '⚠️',
    keywords: ['nilesh', 'kulkarni', 'ortho', 'mmc-33108', 'suspended'],
    metadata: { domain: 'crm-partner-lifecycle', doctorId: 'doc-003' }
  },

  // Beds & Telemetry
  {
    id: 'bed-001',
    category: 'BED',
    title: 'Apollo City Hospital - ICU-VENT-04',
    subtitle: 'ICU Ventilator Bed • Status: OCCUPIED (94% Surge Alert)',
    badge: 'SURGE 94%',
    badgeVariant: 'danger',
    icon: '🛏️',
    keywords: ['apollo', 'icu-vent-04', 'icu', 'ventilator', 'bed'],
    metadata: { domain: 'executive-command-center', tab: 'BED_TELEMETRY' }
  },
  {
    id: 'bed-002',
    category: 'BED',
    title: 'Manipal Super Specialty - HDU-08',
    subtitle: 'High Dependency Unit • Status: VACANT • ACLS Ready',
    badge: 'VACANT',
    badgeVariant: 'success',
    icon: '🛏️',
    keywords: ['manipal', 'hdu-08', 'hdu', 'vacant', 'bed'],
    metadata: { domain: 'executive-command-center', tab: 'BED_TELEMETRY' }
  },

  // Finance & POs
  {
    id: 'po-001',
    category: 'SUPPLY_FINANCE',
    title: 'PO-2026-8812 (Cipla Therapeutics)',
    subtitle: 'Meropenem 1g Vials (1,000 Qty) • Variance: +5.5% (₹13,500 over PO)',
    badge: 'PO VARIANCE',
    badgeVariant: 'warning',
    icon: '⚖️',
    keywords: ['po-2026-8812', 'cipla', 'meropenem', 'variance', 'po'],
    metadata: { domain: 'central-supply-chain', tab: 'THREE_WAY_MATCHING' }
  },
  {
    id: 'inv-001',
    category: 'SUPPLY_FINANCE',
    title: 'INV-2026-0982 (Care Plus Multispeciality)',
    subtitle: 'Amount Due: ₹24,999 • Failed e-NACH Mandate • Stage 2 Grace Period',
    badge: 'DUNNING 88.4%',
    badgeVariant: 'primary',
    icon: '🔄',
    keywords: ['inv-2026-0982', 'care plus', 'dunning', 'nach', 'invoice'],
    metadata: { domain: 'subscription-billing-finance', tab: 'smart-dunning' }
  },

  // Clinical Protocols
  {
    id: 'prot-001',
    category: 'CLINICAL_PROTOCOL',
    title: 'Sepsis Hour-1 Resuscitation Bundle',
    clinicalDomain: 'EMERGENCY_CRITICAL_CARE',
    subtitle: 'Surviving Sepsis 2026 • STAT Blood Cultures, Pip-Taz & 30ml/kg Crystalloid',
    badge: 'SUPERINTENDENT APPROVED',
    badgeVariant: 'success',
    icon: '📋',
    keywords: ['sepsis', 'hour-1', 'protocol', 'crystalloid', 'blood culture', 'order set'],
    metadata: { domain: 'company-admin-governance', tab: 'clinical-order-sets' }
  },
  {
    id: 'prot-002',
    category: 'CLINICAL_PROTOCOL',
    title: 'Acute STEMI Door-to-Balloon Protocol',
    subtitle: 'AHA/ACC 2026 • 12-Lead ECG < 10m, Aspirin 325mg + Ticagrelor 180mg',
    badge: 'ACTIVE BUNDLE',
    badgeVariant: 'primary',
    icon: '🫀',
    keywords: ['stemi', 'heart', 'd2b', 'door to balloon', 'ecg', 'aspirin', 'cath lab'],
    metadata: { domain: 'company-admin-governance', tab: 'clinical-order-sets' }
  },

  // Fast Navigation
  {
    id: 'nav-001',
    category: 'NAVIGATION',
    title: 'Jump to Multi-Hospital Bed & Transfer Grid',
    subtitle: 'Epic Hyperspace Benchmark • Live Pan-India bed telemetry & ICU transfer desk',
    badge: 'EPIC PARITY',
    badgeVariant: 'info',
    icon: '🏥',
    keywords: ['bed', 'grid', 'icu', 'transfer', 'census'],
    metadata: { domain: 'executive-command-center', tab: 'BED_TELEMETRY' }
  },
  {
    id: 'nav-002',
    category: 'NAVIGATION',
    title: 'Jump to ASC 606 & Ind AS 115 Revenue Waterfall',
    subtitle: 'Stripe Billing Benchmark • 12-month amortization schedule & audit journal',
    badge: 'GAAP AUDIT',
    badgeVariant: 'success',
    icon: '📊',
    keywords: ['asc 606', 'revenue', 'waterfall', 'deferred', 'amortization'],
    metadata: { domain: 'subscription-billing-finance', tab: 'asc606-waterfall' }
  },
  {
    id: 'nav-003',
    category: 'NAVIGATION',
    title: 'Jump to SAP S/4HANA 3-Way PO Matching & ROP Desk',
    subtitle: 'SAP S/4HANA Benchmark • ±0.5% tolerance reconciliation & auto reorder alerts',
    badge: 'SAP PARITY',
    badgeVariant: 'primary',
    icon: '⚖️',
    keywords: ['po matching', '3-way', 'sap', 'grn', 'reorder point', 'rop'],
    metadata: { domain: 'central-supply-chain', tab: 'THREE_WAY_MATCHING' }
  }
];

export const DocSearchOmniSpotlightModal: React.FC<DocSearchOmniSpotlightModalProps> = ({
  isOpen,
  onClose,
  onNavigateToDomain,
  customEntities
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SpotlightCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fullIndex = useMemo(() => {
    return customEntities ? [...customEntities, ...DEFAULT_GLOBAL_INDEX] : DEFAULT_GLOBAL_INDEX;
  }, [customEntities]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return fullIndex.filter((item) => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [fullIndex, searchQuery, activeCategory]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setActiveCategory('ALL');
    }
  }, [isOpen]);

  // Keyboard navigation listener (ArrowUp, ArrowDown, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredItems.length - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        handleExecute(selected);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleExecute = (item: SpotlightEntityItem) => {
    if (item.onSelect) {
      item.onSelect();
    } else if (item.metadata?.['domain']) {
      onNavigateToDomain?.(item.metadata['domain'], item.metadata);
    }
    onClose();
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      activeElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(2, 6, 23, 0.78)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#0B132B',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
            backgroundColor: '#0F172A',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '1.25rem', color: '#38BDF8' }}>⚡</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search patients, doctors, beds, POs, order sets... (or Esc to dismiss)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#F8FAFC',
              fontSize: '1.05rem',
              fontWeight: 500,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
          <div
            style={{
              padding: '2px 8px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#94A3B8',
              fontFamily: 'monospace'
            }}
          >
            ESC
          </div>
        </div>

        {/* Category Pill Filters */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 16px',
            backgroundColor: '#0B132B',
            borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'PATIENT', label: 'Patients (UHID)' },
            { id: 'DOCTOR', label: 'Doctors & NMC' },
            { id: 'BED', label: 'Beds & ICU' },
            { id: 'SUPPLY_FINANCE', label: 'POs & Finance' },
            { id: 'CLINICAL_PROTOCOL', label: 'Order Sets' },
            { id: 'NAVIGATION', label: 'Quick Navigation' }
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as SpotlightCategory)}
                style={{
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.18)' : '#1E293B',
                  color: isActive ? '#38BDF8' : '#94A3B8',
                  border: isActive ? '1px solid #38BDF8' : '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#64748B',
                fontSize: '0.88rem'
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
              No clinical or enterprise records matched "<strong>{searchQuery}</strong>"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleExecute(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#0284C7' : '#1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        flexShrink: 0
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: isSelected ? '#FFFFFF' : '#F1F5F9',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#94A3B8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            item.badgeVariant === 'danger'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : item.badgeVariant === 'success'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : item.badgeVariant === 'warning'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(56, 189, 248, 0.2)',
                          color:
                            item.badgeVariant === 'danger'
                              ? '#EF4444'
                              : item.badgeVariant === 'success'
                              ? '#10B981'
                              : item.badgeVariant === 'warning'
                              ? '#F59E0B'
                              : '#38BDF8',
                          border: '1px solid currentColor'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>
                        ↵ Open
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: '#0F172A',
            borderTop: '1px solid rgba(51, 65, 85, 0.6)',
            fontSize: '0.72rem',
            color: '#64748B'
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><strong style={{ color: '#94A3B8' }}>↑↓</strong> to navigate</span>
            <span><strong style={{ color: '#94A3B8' }}>↵</strong> to select</span>
            <span><strong style={{ color: '#94A3B8' }}>ESC</strong> to close</span>
          </div>
          <div>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>DocSearch Omni-Spotlight v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
