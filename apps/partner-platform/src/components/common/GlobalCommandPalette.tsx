import React, { useState, useEffect } from 'react';
import type { PartnerModuleKey, OrganizationWorkspaceType } from '../PartnerPlatformShell.js';

export interface CommandItem {
  id: string;
  category: 'Workspace' | 'Quick Action' | 'Clinical Module' | 'Theme & Settings';
  title: string;
  subtitle?: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateModule: (moduleKey: PartnerModuleKey) => void;
  onSwitchWorkspace: (workspace: OrganizationWorkspaceType) => void;
  onToggleTheme: () => void;
}

export const GlobalCommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateModule,
  onSwitchWorkspace,
  onToggleTheme
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allCommands: CommandItem[] = [
    // Workspaces
    { id: 'wsp-ent', category: 'Workspace', title: 'Switch to Enterprise Command Center', subtitle: 'Multi-Facility Unified Governance', icon: '👑', action: () => { onSwitchWorkspace('ENTERPRISE_COMMAND'); onClose(); } },
    { id: 'wsp-hosp', category: 'Workspace', title: 'Switch to Hospital Operations', subtitle: 'Inpatient Wards, Bed Matrix, OT & ER', icon: '🏥', action: () => { onSwitchWorkspace('HOSPITAL'); onClose(); } },
    { id: 'wsp-clinic', category: 'Workspace', title: 'Switch to Doctor Clinic Desk', subtitle: 'OPD Consultations, Voice Scribe & Tokens', icon: '🩺', action: () => { onSwitchWorkspace('CLINIC'); onClose(); } },
    { id: 'wsp-pharm', category: 'Workspace', title: 'Switch to Retail Pharmacy POS', subtitle: 'Barcode POS, DDI Shield, Jan Aushadhi & Expiry', icon: '💊', action: () => { onSwitchWorkspace('PHARMACY'); onClose(); } },
    { id: 'wsp-path', category: 'Workspace', title: 'Switch to Pathology Laboratory (LIMS)', subtitle: 'Sample Collection, Analyzer Sync & NABL Reports', icon: '🧪', action: () => { onSwitchWorkspace('PATHOLOGY'); onClose(); } },
    { id: 'wsp-diag', category: 'Workspace', title: 'Switch to Radiology & Diagnostic PACS', subtitle: 'Web DICOM Viewer & Modality Scheduling', icon: '🔬', action: () => { onSwitchWorkspace('DIAGNOSTIC_CENTRE'); onClose(); } },

    // Quick Actions
    { id: 'act-scribe', category: 'Quick Action', title: 'Start Ambient AI Voice Scribe', subtitle: 'Acoustic Hinglish/English SOAP Note Generation', icon: '🎙️', shortcut: 'Alt+V', action: () => { onNavigateModule('ai-clinical-cdss'); onClose(); } },
    { id: 'act-upi', category: 'Quick Action', title: 'Instant Multi-Party UPI Split POS', subtitle: 'Dynamic QR with instant doctor/hospital settlement', icon: '⚡', shortcut: 'Alt+U', action: () => { onNavigateModule('billing-revenue-cycle'); onClose(); } },
    { id: 'act-abha', category: 'Quick Action', title: '1-Second ABHA Scan & Share Kiosk', subtitle: 'Zero-typing digital check-in & token pass', icon: '🇮🇳', shortcut: 'Alt+A', action: () => { onNavigateModule('abdm-fhir-gateway'); onClose(); } },
    { id: 'act-ddi', category: 'Quick Action', title: 'Drug Interaction & Jan Aushadhi Finder', subtitle: 'PMBJP generic price comparison & lethal DDI check', icon: '🛡️', shortcut: 'Alt+D', action: () => { onNavigateModule('clinical-consultation'); onClose(); } },
    { id: 'act-breakglass', category: 'Quick Action', title: 'Emergency Break-Glass Clinical Override', subtitle: '2-hour urgent trauma access with CISO audit', icon: '🚨', shortcut: 'Alt+B', action: () => { onNavigateModule('organization-foundation'); onClose(); } },
    { id: 'act-tpa', category: 'Quick Action', title: 'TPA Cashless Insurance AI Predictor', subtitle: 'Pre-submission 98% approval score & NHCX FHIR', icon: '🩻', shortcut: 'Alt+T', action: () => { onNavigateModule('insurance-claims'); onClose(); } },

    // Clinical Modules
    { id: 'mod-opd', category: 'Clinical Module', title: 'OPD Doctor Consultation & EMR', subtitle: 'Specialty-adaptive pediatric, eye, ortho clinical desk', icon: '🩺', action: () => { onNavigateModule('clinical-consultation'); onClose(); } },
    { id: 'mod-ipd', category: 'Clinical Module', title: 'IPD ADT Bed Census Matrix', subtitle: 'Live ward occupancy, nurse flowsheets, transfers', icon: '🛏️', action: () => { onNavigateModule('inpatient-management'); onClose(); } },
    { id: 'mod-er', category: 'Clinical Module', title: 'Emergency & Trauma Triage (ER)', subtitle: 'Red/Yellow/Green acuity triage & crash cart', icon: '🚨', action: () => { onNavigateModule('emergency-trauma'); onClose(); } },
    { id: 'mod-ot', category: 'Clinical Module', title: 'Operation Theatres (OT) Management', subtitle: 'Surgical scheduling, anesthesia logs, PAC', icon: '🔪', action: () => { onNavigateModule('operation-theatre-management'); onClose(); } },
    { id: 'mod-pharm', category: 'Clinical Module', title: 'Pharmacy POS & Dispensing Counter', subtitle: 'Inventory batch tracking, Schedule H1 register', icon: '💊', action: () => { onNavigateModule('pharmacy-medication'); onClose(); } },
    { id: 'mod-lab', category: 'Clinical Module', title: 'Pathology Laboratory LIMS', subtitle: 'Bi-directional machine interface & critical alerts', icon: '🧪', action: () => { onNavigateModule('clinical-investigation'); onClose(); } },
    { id: 'mod-rad', category: 'Clinical Module', title: 'Radiology & Web DICOM PACS', subtitle: 'High-res X-Ray, CT, MRI scans on browser', icon: '🔬', action: () => { onNavigateModule('radiology-imaging'); onClose(); } },
    { id: 'mod-whatsapp', category: 'Clinical Module', title: 'WhatsApp Patient Portal & Reports', subtitle: 'Automated digital Rx and lab PDF dispatch', icon: '📲', action: () => { onNavigateModule('whatsapp-patient-portal'); onClose(); } },
    { id: 'mod-tele', category: 'Clinical Module', title: 'Telemedicine & Video OPD', subtitle: 'WebRTC encrypted video consultation desk', icon: '📹', action: () => { onNavigateModule('telemedicine-rpm'); onClose(); } },

    // Theme & UI
    { id: 'thm-toggle', category: 'Theme & Settings', title: 'Cycle Visual Theme', subtitle: 'Advance Pro, Nordic Pure, Oceanic Navy, Cyber Surgeon', icon: '🎨', shortcut: 'Alt+Shift+T', action: () => { onToggleTheme(); onClose(); } }
  ];

  const filtered = allCommands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase()) ||
    (c.subtitle && c.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
        }
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 12, 22, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(6, 182, 212, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', gap: '10px' }}>
          <span style={{ fontSize: '1.25rem' }}>🔍</span>
          <input
            autoFocus
            type="text"
            placeholder="Type a command, patient MRN, module, or action... (e.g. 'UPI', 'EMR', 'Break-Glass')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: '0.9375rem',
              fontWeight: 600
            }}
          />
          <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#94A3B8', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
              No commands or modules matching "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 18px',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #06B6D4' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '0.625rem', color: '#64748B', backgroundColor: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '1px' }}>
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.shortcut && (
                    <span style={{ fontSize: '0.6875rem', color: '#38BDF8', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(15, 23, 42, 0.95)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#64748B' }}>
          <span>↑↓ to navigate • ↵ to select</span>
          <span style={{ color: '#06B6D4', fontWeight: 700 }}>⚡ DocSearch Super-Spotlight</span>
        </div>
      </div>
    </div>
  );
};
