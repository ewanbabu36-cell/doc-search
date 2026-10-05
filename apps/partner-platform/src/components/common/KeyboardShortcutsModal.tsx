import React, { useEffect } from 'react';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateModule?: (moduleKey: any) => void;
  onOpenFastOpd?: () => void;
}

interface ShortcutItem {
  keys: string[];
  action: string;
  category: 'GLOBAL' | 'FUNCTION_KEYS' | 'CLINICAL' | 'OPERATIONS';
  badge?: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // Global Navigation
  {
    keys: ['Ctrl / Cmd', 'K'],
    action: 'Universal Spotlight: Search Patients, Beds, Drugs, Tests & Modules',
    category: 'GLOBAL',
    badge: 'SPOTLIGHT'
  },
  {
    keys: ['Ctrl', '/'],
    action: 'Toggle this Keyboard Shortcuts & Smart Workflows Guide',
    category: 'GLOBAL'
  },
  {
    keys: ['Esc'],
    action: 'Close open Modals, Drawers, Search Palette or Dropdowns',
    category: 'GLOBAL'
  },
  {
    keys: ['Ctrl / Cmd', 'Enter'],
    action: 'Instant Quick Save & Commit current clinical form or bill',
    category: 'GLOBAL'
  },

  // Function Keys
  {
    keys: ['F1'],
    action: 'Reception & Fast OPD Registration Drawer',
    category: 'FUNCTION_KEYS',
    badge: 'RECEPTION'
  },
  {
    keys: ['F2'],
    action: 'Doctor OPD Chamber & Clinical EMR Desk',
    category: 'FUNCTION_KEYS',
    badge: 'DOCTOR'
  },
  {
    keys: ['F3'],
    action: 'Hospital Cashier Desk & POS Billing Ledger',
    category: 'FUNCTION_KEYS',
    badge: 'BILLING'
  },
  {
    keys: ['F4'],
    action: 'Inpatient Ward Bed Matrix & Real-time Census',
    category: 'FUNCTION_KEYS',
    badge: 'IPD'
  },
  {
    keys: ['F9'],
    action: 'Emergency & Trauma Triage (Red/Amber Resus Queue)',
    category: 'FUNCTION_KEYS',
    badge: 'EMERGENCY'
  },

  // Clinical Shortcuts
  {
    keys: ['Alt', 'C'],
    action: 'Doctor Consultation Chamber & Token Queue',
    category: 'CLINICAL'
  },
  {
    keys: ['Alt', 'F'],
    action: 'Doctor Fullscreen Focus Mode (Distraction-free EMR)',
    category: 'CLINICAL'
  },
  {
    keys: ['Alt', 'M'],
    action: 'AI Clinical Ambient Voice Scribe HUD (Hands-Free Dictation)',
    category: 'CLINICAL',
    badge: 'AI SCRIBE'
  },
  {
    keys: ['Alt', 'L'],
    action: 'Pathology & Diagnostic Laboratory LIMS Desk',
    category: 'CLINICAL'
  },

  // Operations
  {
    keys: ['Alt', 'N'],
    action: 'Express OPD Intake Drawer (Instant Token Issuance)',
    category: 'OPERATIONS'
  },
  {
    keys: ['Alt', 'B'],
    action: 'Pharmacy Retail & Inpatient POS Dispense Counter',
    category: 'OPERATIONS'
  },
  {
    keys: ['Alt', 'P'],
    action: 'Instant Thermal Print (Label, Wristband, Bill or Rx)',
    category: 'OPERATIONS',
    badge: 'HARDWARE'
  }
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigateModule: _onNavigateModule,
  onOpenFastOpd: _onOpenFastOpd
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    { key: 'FUNCTION_KEYS', title: '⚡ Standard Terminal Function Keys (F1 – F9)', color: '#38BDF8' },
    { key: 'GLOBAL', title: '🌐 Global Spotlight & Navigation', color: '#818CF8' },
    { key: 'CLINICAL', title: '🩺 Clinical & Doctor Chamber Shortcuts', color: '#34D399' },
    { key: 'OPERATIONS', title: '📦 Pharmacy, Cashier & Operations', color: '#FBBF24' }
  ] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(15, 23, 42, 0.95)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⌨️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                Hospital Fast-Flow Keyboard Shortcuts
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '3px' }}>
                Master terminal shortcuts designed for rapid hospital operations, clinical consultations, and triage.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94A3B8',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {categories.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat.key);
            if (items.length === 0) return null;

            return (
              <div key={cat.key}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: cat.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{cat.title}</span>
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        borderBottom: idx < items.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>
                          {item.action}
                        </span>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: cat.color,
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${cat.color}40`
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {item.keys.map((k, ki) => (
                          <React.Fragment key={ki}>
                            <kbd
                              style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#38BDF8',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                boxShadow: '0 2px 0 rgba(0, 0, 0, 0.4)'
                              }}
                            >
                              {k}
                            </kbd>
                            {ki < item.keys.length - 1 && (
                              <span style={{ color: '#64748B', fontSize: '0.8rem', alignSelf: 'center', padding: '0 2px' }}>
                                +
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡 Tip:</span>
            <span>Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#38BDF8', fontFamily: 'monospace' }}>Ctrl + K</kbd> anywhere to search patients, beds, or drugs directly.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: '#38BDF8',
              border: 'none',
              color: '#0F172A',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
