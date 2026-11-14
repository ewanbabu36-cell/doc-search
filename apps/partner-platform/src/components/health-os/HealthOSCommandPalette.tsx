import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type ActivePatientTab, type HealthOSModuleKey, type SlideOverTrayType } from './health-os-types.js';
import { HEALTH_OS_APPS } from './health-os-registry.js';
import './health-os.css';

export interface HealthOSCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: ActivePatientTab) => void;
  onSelectApp: (appId: HealthOSModuleKey) => void;
  onOpenTray: (tray: SlideOverTrayType) => void;
}

interface CommandItem {
  id: string;
  category: 'PATIENTS' | 'ACTIONS' | 'FINANCE' | 'NAVIGATION';
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  shortcut?: string;
  run: () => void;
}

const SEEDED_PATIENTS_REGISTRY: ActivePatientTab[] = [
  {
    encounterId: 'enc-2026-0001',
    patientId: 'pat-2026-0001',
    patientName: 'Aarav Sharma',
    mrn: 'MRN-2026-0001',
    acuity: 'ROUTINE',
    ageGender: '34y / Male',
    gender: 'MALE',
    age: 34,
    abhaId: '91-8842-1094-3321',
    bedNumber: 'OPD Token Q-001',
    allergies: ['Penicillin (Severe)', 'Amoxicillin'],
    chronicConditions: ['Type 2 Diabetes (E11.9)', 'Essential Hypertension (I10)'],
    department: 'General Medicine',
    attendingDoctor: 'Dr. Rajesh Sharma, MD',
    chiefComplaint: 'Severe headache, dizziness, BP 160/100 mmHg',
    vitals: {
      bp: '160/100',
      pulse: 88,
      spo2: 98,
      temp: 98.6,
      news2: 2,
    },
  },
  {
    encounterId: 'enc-2026-0002',
    patientId: 'pat-2026-0002',
    patientName: 'Priya Patel',
    mrn: 'MRN-2026-0002',
    acuity: 'EMERGENCY',
    ageGender: '28y / Female',
    gender: 'FEMALE',
    age: 28,
    abhaId: '91-4412-9981-1122',
    bedNumber: 'ICU Bed 01',
    allergies: ['Sulfa Antibiotics', 'Aspirin'],
    chronicConditions: ['Acute Severe Sepsis', 'Severe Hyperkalemia (K+ 6.8 mEq/L)'],
    department: 'Critical Care / ICU',
    attendingDoctor: 'Dr. Alok Verma, MD (Crit Care)',
    chiefComplaint: 'Septic shock, high fever 102.8°F, dyspnea, oliguria',
    vitals: {
      bp: '85/55',
      pulse: 128,
      spo2: 91,
      temp: 102.8,
      news2: 9,
    },
  },
  {
    encounterId: 'enc-2026-0003',
    patientId: 'pat-2026-0003',
    patientName: 'Rajesh Kumar',
    mrn: 'MRN-2026-0003',
    acuity: 'ROUTINE',
    ageGender: '52y / Male',
    gender: 'MALE',
    age: 52,
    abhaId: '91-5521-8874-2201',
    bedNumber: 'OPD Token Q-003',
    allergies: [],
    chronicConditions: ['Dyslipidemia (E78.5)'],
    department: 'Cardiology',
    attendingDoctor: 'Dr. Rajesh Sharma, MD',
    chiefComplaint: 'Exertional chest discomfort for 2 weeks',
    vitals: {
      bp: '130/84',
      pulse: 74,
      spo2: 99,
      temp: 98.4,
      news2: 0,
    },
  },
  {
    encounterId: 'enc-2026-0004',
    patientId: 'pat-2026-0004',
    patientName: 'Sunita Verma',
    mrn: 'MRN-2026-0004',
    acuity: 'URGENT',
    ageGender: '45y / Female',
    gender: 'FEMALE',
    age: 45,
    abhaId: '91-3319-7712-4402',
    bedNumber: 'HDU Bed 02',
    allergies: ['Ciprofloxacin'],
    chronicConditions: ['Bronchial Asthma (J45.9)', 'GERD'],
    department: 'Pulmonology',
    attendingDoctor: 'Dr. Vivek Sharma',
    chiefComplaint: 'Acute wheezing and nocturnal breathlessness',
    vitals: {
      bp: '138/92',
      pulse: 104,
      spo2: 93,
      temp: 99.1,
      news2: 4,
    },
  },
  {
    encounterId: 'enc-2026-0005',
    patientId: 'pat-2026-0005',
    patientName: 'Amit Singh',
    mrn: 'MRN-2026-0005',
    acuity: 'ROUTINE',
    ageGender: '39y / Male',
    gender: 'MALE',
    age: 39,
    abhaId: '91-9988-1122-3344',
    bedNumber: 'Gen Ward Male Bed 04',
    allergies: [],
    chronicConditions: ['Post-Op Appendectomy Day 2'],
    department: 'General Surgery',
    attendingDoctor: 'Dr. Alok Sharma',
    chiefComplaint: 'Post-operative recovery monitoring',
    vitals: {
      bp: '122/78',
      pulse: 76,
      spo2: 98,
      temp: 98.6,
      news2: 1,
    },
  },
];

export const HealthOSCommandPalette: React.FC<HealthOSCommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  onSelectApp,
  onOpenTray,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount or open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open handled by parent or custom event
          window.dispatchEvent(new CustomEvent('docsearch:open-command-palette'));
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compile all searchable commands
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Patient Charts
    for (const p of SEEDED_PATIENTS_REGISTRY) {
      items.push({
        id: `pat-${p.patientId}`,
        category: 'PATIENTS',
        icon: p.gender === 'FEMALE' ? '👩' : '👨',
        title: p.patientName,
        subtitle: `${p.mrn} • ${p.ageGender} • ${p.bedNumber || 'OPD'}`,
        badge: p.acuity,
        run: () => {
          onSelectPatient(p);
          onClose();
        },
      });
    }

    // 2. High-Frequency Clinical Trays
    items.push({
      id: 'act-quick-rx',
      category: 'ACTIONS',
      icon: '💊',
      title: 'Quick Prescribe (Quick Rx Drawer)',
      subtitle: 'Author electronic prescription without leaving active chart',
      shortcut: 'Rx',
      run: () => {
        onOpenTray('QUICK_RX');
        onClose();
      },
    });

    items.push({
      id: 'act-quick-lab',
      category: 'ACTIONS',
      icon: '🧪',
      title: 'Order Diagnostic Lab Panel (CBC, LFT, KFT)',
      subtitle: 'Instant STAT lab requisition with accession barcodes',
      shortcut: 'Lab',
      run: () => {
        onOpenTray('QUICK_LAB');
        onClose();
      },
    });

    items.push({
      id: 'act-quick-vitals',
      category: 'ACTIONS',
      icon: '❤️',
      title: 'Record Live Vitals & Acuity (NEWS2)',
      subtitle: 'Log blood pressure, pulse, SpO2, and calculate acuity',
      shortcut: 'Vit',
      run: () => {
        onOpenTray('QUICK_VITALS');
        onClose();
      },
    });

    // 3. Finance & Cashier Actions
    items.push({
      id: 'fin-instant-settle',
      category: 'FINANCE',
      icon: '💳',
      title: 'Instant Settle Counter Bill (Dynamic UPI QR)',
      subtitle: 'Counter cashier one-click settlement and thermal slip print',
      shortcut: 'Pay',
      run: () => {
        onOpenTray('INSTANT_SETTLE');
        onClose();
      },
    });

    items.push({
      id: 'fin-cash-ledger',
      category: 'FINANCE',
      icon: '💵',
      title: 'Daily Cash Ledger & Shift Handover',
      subtitle: 'View collected OPD/IPD counter cash and end-of-shift vault',
      run: () => {
        onSelectApp('billing-revenue-cycle');
        onClose();
      },
    });

    // 4. Module Navigation
    for (const app of HEALTH_OS_APPS) {
      items.push({
        id: `nav-${app.id}`,
        category: 'NAVIGATION',
        icon: app.icon,
        title: app.label,
        subtitle: app.description,
        run: () => {
          onSelectApp(app.id);
          onClose();
        },
      });
    }

    return items;
  }, [onSelectPatient, onSelectApp, onOpenTray, onClose]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase().trim();
    return allCommands.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  // Handle arrow navigation and Enter execution
  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredCommands[selectedIndex];
      if (current) {
        current.run();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="hos-palette-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="hos-palette-window"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownList}
      >
        {/* Search Input Bar */}
        <div className="hos-palette-input-wrap">
          <span className="hos-palette-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="hos-palette-input"
            placeholder="Type a patient name, MRN, lab test, medication, or action..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {query && (
            <button
              type="button"
              className="hos-palette-clear-btn"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
            >
              ✕
            </button>
          )}
          <kbd className="hos-palette-esc-badge" onClick={onClose}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="hos-palette-list">
          {filteredCommands.length === 0 ? (
            <div className="hos-palette-empty">
              <span>🔎</span>
              <span>No matching patients or actions found for "{query}"</span>
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`hos-palette-item ${isSelected ? 'hos-palette-item-selected' : ''}`}
                  onClick={() => item.run()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="hos-palette-item-icon">{item.icon}</div>
                  <div className="hos-palette-item-info">
                    <div className="hos-palette-item-title-row">
                      <span className="hos-palette-item-title">{item.title}</span>
                      {item.badge && (
                        <span
                          className="hos-palette-badge"
                          style={{
                            backgroundColor:
                              item.badge === 'EMERGENCY'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : item.badge === 'URGENT'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(16, 185, 129, 0.2)',
                            color:
                              item.badge === 'EMERGENCY'
                                ? '#f87171'
                                : item.badge === 'URGENT'
                                ? '#fbbf24'
                                : '#34d399',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="hos-palette-item-sub">{item.subtitle}</span>
                  </div>
                  {item.shortcut && (
                    <span className="hos-palette-item-shortcut">{item.shortcut}</span>
                  )}
                  <span className="hos-palette-item-category">{item.category}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Help Bar */}
        <div className="hos-palette-footer">
          <div className="hos-palette-footer-keys">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span className="hos-palette-footer-brand">DocSearch HealthOS • Zero-Tab Ergonomics</span>
        </div>
      </div>
    </div>
  );
};
