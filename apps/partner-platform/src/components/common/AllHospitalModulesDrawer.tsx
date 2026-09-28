import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { PartnerModuleKey } from '../PartnerPlatformShell.js';
import { isPartnerModuleAllowed } from '../../utils/partnerRolePermissions.js';
import { isHospitalModuleLocked } from '@docsearch/shared-core';

export interface AllHospitalModulesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: PartnerModuleKey;
  onSelectModule: (moduleKey: PartnerModuleKey) => void;
  currentUserRole?: string | undefined;
  currentUserPermissions?: any | undefined;
  isFreeHospital?: boolean | undefined;
  currentPlanTier?: string | undefined;
  onOpenUpgradeModal?: ((featureName: string) => void) | undefined;
  onTogglePersistentFullMode?: (() => void) | undefined;
}

interface ModuleDefinition {
  id: PartnerModuleKey;
  label: string;
  category: 'clinical' | 'inpatient' | 'diagnostics' | 'pharmacy' | 'frontdesk' | 'governance';
  categoryTitle: string;
  icon: string;
  description: string;
  tag?: string;
}

const ALL_MODULES_CATALOG: ModuleDefinition[] = [
  // 1. Clinical & OPD
  {
    id: 'my-smart-desk',
    label: 'Role-Tailored Smart Desk',
    category: 'clinical',
    categoryTitle: '🩺 Clinical & OPD',
    icon: '⚡',
    description: '4 killer tools tailored for your clinical persona (Doctor, Nurse, Pharmacy, Lab, Front Desk)',
    tag: 'Role Cockpit'
  },
  {
    id: 'clinical-consultation',
    label: 'Doctor OPD Desk & EMR',
    category: 'clinical',
    categoryTitle: '🩺 Clinical & OPD',
    icon: '🩺',
    description: 'Physician diagnosis, Rx generator, soap notes, patient history',
    tag: 'Core OPD'
  },
  {
    id: 'opd-one-flow-express',
    label: '1-Flow OPD Express',
    category: 'clinical',
    categoryTitle: '🩺 Clinical & OPD',
    icon: '⚡',
    description: 'Single-screen OPD flow: token, vitals, consult, payment in 60 seconds',
    tag: 'Ultra Fast'
  },
  {
    id: 'encounters-visits',
    label: 'OPD Queue & Appointments',
    category: 'clinical',
    categoryTitle: '🩺 Clinical & OPD',
    icon: '⏱️',
    description: 'Live doctor token queue, walk-in triage, doctor scheduling',
    tag: 'OPD Flow'
  },
  {
    id: 'ai-clinical-cdss',
    label: 'AI Voice Scribe & CDSS',
    category: 'clinical',
    categoryTitle: '🩺 Clinical & OPD',
    icon: '🎙️',
    description: 'Ambient doctor-patient audio transcription, drug interactions, clinical CDSS',
    tag: 'AI Powered'
  },
  {
    id: 'telemedicine-rpm',
    label: 'Telemedicine Video OPD',
    category: 'clinical',
    categoryTitle: '🩺 Clinical & OPD',
    icon: '📹',
    description: 'HIPAA/ABDM compliant video consultation, remote vitals monitoring',
    tag: 'Remote'
  },
  {
    id: 'nurse-triage-station',
    label: 'Nurse Vitals & Triage Station',
    category: 'clinical',
    categoryTitle: '🩺 Clinical & OPD',
    icon: '👩‍⚕️',
    description: 'Pre-consultation vitals entry, NEWS2 calculation, alert broadcasting',
    tag: 'Nursing'
  },

  // 2. Inpatient & Critical Care
  {
    id: 'inpatient-management',
    label: 'Inpatient ADT & Bed Matrix',
    category: 'inpatient',
    categoryTitle: '🏥 Inpatient & Critical Care',
    icon: '🛏️',
    description: 'Admission, discharge, transfers, ward bed matrix, nurse round notes'
  },
  {
    id: 'emergency-trauma',
    label: 'Emergency & Trauma (ER)',
    category: 'inpatient',
    categoryTitle: '🏥 Inpatient & Critical Care',
    icon: '🚨',
    description: 'Code Red trauma triage, crash cart tracking, fast ER admissions',
    tag: '24x7 ER'
  },
  {
    id: 'operation-theatre-management',
    label: 'Operation Theatres (OT)',
    category: 'inpatient',
    categoryTitle: '🏥 Inpatient & Critical Care',
    icon: '🔪',
    description: 'Surgical scheduling, WHO surgical checklist, anesthesia records'
  },
  {
    id: 'blood-bank-transfusion',
    label: 'Blood Bank & Cross-Match',
    category: 'inpatient',
    categoryTitle: '🏥 Inpatient & Critical Care',
    icon: '🩸',
    description: 'Donor blood registry, component separation, transfusion cross-match'
  },

  // 3. Diagnostics & Investigations
  {
    id: 'clinical-investigation',
    label: 'Pathology Laboratory LIMS',
    category: 'diagnostics',
    categoryTitle: '🧪 Diagnostics & Lab',
    icon: '🧪',
    description: '3-stage phlebotomy triage, auto-analyzer sync, NABL pathologist sign-off',
    tag: 'LIMS'
  },
  {
    id: 'radiology-imaging',
    label: 'Radiology & DICOM PACS',
    category: 'diagnostics',
    categoryTitle: '🧪 Diagnostics & Lab',
    icon: '🔬',
    description: 'Zero-footprint DICOM viewer, multi-planar reconstruction, radiologist reports',
    tag: 'DICOM'
  },

  // 4. Pharmacy & Supply Chain
  {
    id: 'pharmacy-medication',
    label: 'Hospital Pharmacy & POS',
    category: 'pharmacy',
    categoryTitle: '💊 Pharmacy & Supply Chain',
    icon: '💊',
    description: 'Prescription dispensing, batch/expiry tracking, GST tax invoicing, Schedule H1',
    tag: 'Retail & IPD'
  },
  {
    id: 'procurement-supply-chain',
    label: 'Procurement & Supply Chain',
    category: 'pharmacy',
    categoryTitle: '💊 Pharmacy & Supply Chain',
    icon: '🚚',
    description: 'Supplier POs, goods inward notes (GRN), central warehouse re-order levels'
  },

  // 5. Front Desk, Billing & Registry
  {
    id: 'patient-registration',
    label: 'Patient Registration & MPI',
    category: 'frontdesk',
    categoryTitle: '⚡ Front Desk, Billing & Portals',
    icon: '📇',
    description: 'UHID master patient index, fast barcode lookup, demographic KYC',
    tag: 'Registration'
  },
  {
    id: 'billing-revenue-cycle',
    label: 'Cashier & Billing POS',
    category: 'frontdesk',
    categoryTitle: '⚡ Front Desk, Billing & Portals',
    icon: '💳',
    description: 'OPD/IPD invoices, split payment, multi-party Dynamic UPI QR, receipt printing',
    tag: 'Finance'
  },
  {
    id: 'insurance-claims',
    label: 'TPA Cashless Claims & NHCX',
    category: 'frontdesk',
    categoryTitle: '⚡ Front Desk, Billing & Portals',
    icon: '🩻',
    description: 'TPA pre-authorization, cashless query replies, National Health Claims Exchange',
    tag: 'TPA / Cashless'
  },
  {
    id: 'abdm-fhir-gateway',
    label: 'ABDM 2.0 National Gateway',
    category: 'frontdesk',
    categoryTitle: '⚡ Front Desk, Billing & Portals',
    icon: '🇮🇳',
    description: 'ABHA creation, Scan & Share counter QR, FHIR health records linking',
    tag: 'ABDM 2.0'
  },
  {
    id: 'whatsapp-patient-portal',
    label: 'WhatsApp Patient Portal',
    category: 'frontdesk',
    categoryTitle: '⚡ Front Desk, Billing & Portals',
    icon: '📲',
    description: 'Automated WhatsApp Rx delivery, lab reports download, appointment reminders',
    tag: 'Patient Portal'
  },
  {
    id: 'help-desk-exit-hub',
    label: 'Help Desk Exit & Print Hub',
    category: 'frontdesk',
    categoryTitle: '⚡ Front Desk, Billing & Portals',
    icon: '🖨️',
    description: 'Patient departure clearance, discharge summary printing, feedback kiosk',
    tag: 'Exit Hub'
  },
  {
    id: 'preferred-partner-network',
    label: 'Preferred Partner Network',
    category: 'frontdesk',
    categoryTitle: '⚡ Front Desk, Billing & Portals',
    icon: '🤝',
    description: 'Diagnostic tie-ups, ambulance services, pharmacy partner referrals'
  },

  // 6. Governance, Operations & Quality
  {
    id: 'executive-command-center',
    label: 'Executive Command Center',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '📊',
    description: 'Hospital revenue KPI, live bed occupancy, patient flow metrics, doctor performance',
    tag: 'Executive'
  },
  {
    id: 'hospital-closed-loop',
    label: 'In-House Closed Loop (OPD & IPD)',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '🔄',
    description: 'Closed-loop clinical ordering from consultation directly into Lab, Pharmacy & Nursing',
    tag: 'Closed Loop'
  },
  {
    id: 'doctor-management',
    label: 'Doctor OPD Rosters & Profiles',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '👨‍⚕️',
    description: 'Doctor shifts, weekly OPD clinic schedule, leaves, consult fee management'
  },
  {
    id: 'staff-administration',
    label: 'Staff Directory & Access Roles',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '👥',
    description: 'Staff directory, RBAC permission matrices, credentials, onboarding'
  },
  {
    id: 'quality-incident-infection-control',
    label: 'NABH Quality & Infection Control',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '🛡️',
    description: 'Hospital-acquired infection audit, clinical incident reporting, NABH compliance',
    tag: 'NABH'
  },
  {
    id: 'asset-biomedical-maintenance',
    label: 'Biomedical Asset Maintenance',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '🔧',
    description: 'Medical device calibration, breakdown tickets, preventive maintenance contracts'
  },
  {
    id: 'dietary-kitchen-management',
    label: 'Dietary & Kitchen Management',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '🥗',
    description: 'Therapeutic patient meal plans, nutrition calculation, ward distribution'
  },
  {
    id: 'medical-records',
    label: 'MRD & ICD-10 Archive',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '📁',
    description: 'Medico-legal record archiving, ICD-10 diagnostic coding, birth/death records'
  },
  {
    id: 'organization-foundation',
    label: 'Organization & Branches',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '🏢',
    description: 'Facility branding, GSTIN, legal registration, multi-branch hierarchy'
  },
  {
    id: 'ai-chat-assistant',
    label: 'AI Copilot & Virtual Assistant',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '🤖',
    description: 'Facility-wide AI assistant for clinical guidelines, hospital SOPs and data query'
  },
  {
    id: 'account-plan-features',
    label: 'Hospital Plan & Subscriptions',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '💎',
    description: 'DocSearch enterprise subscription tier, features entitlement, invoice receipts'
  },
  {
    id: 'offers-rewards-hub',
    label: 'Partner Offers & Rewards Hub',
    category: 'governance',
    categoryTitle: '🏛️ Governance & Operations',
    icon: '🎁',
    description: 'Healthcare partner privileges, pharmaceutical manufacturer discounts'
  }
];

export const AllHospitalModulesDrawer: React.FC<AllHospitalModulesDrawerProps> = ({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
  currentUserRole,
  currentUserPermissions,
  isFreeHospital,
  currentPlanTier,
  onOpenUpgradeModal,
  onTogglePersistentFullMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
      setActiveCategory('all');
      return undefined;
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'clinical', label: '🩺 Clinical & OPD' },
    { id: 'inpatient', label: '🏥 Inpatient & ER' },
    { id: 'diagnostics', label: '🧪 Diagnostics' },
    { id: 'pharmacy', label: '💊 Pharmacy' },
    { id: 'frontdesk', label: '⚡ Billing & Desk' },
    { id: 'governance', label: '🏛️ Governance' }
  ];

  const allowedModules = useMemo(() => {
    return ALL_MODULES_CATALOG.filter((mod) => {
      const isAllowed = isPartnerModuleAllowed(mod.id, currentUserRole, currentUserPermissions);
      if (!isAllowed) return false;

      if (activeCategory !== 'all' && mod.category !== activeCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          mod.label.toLowerCase().includes(query) ||
          mod.description.toLowerCase().includes(query) ||
          mod.id.toLowerCase().includes(query) ||
          (mod.tag && mod.tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [currentUserRole, currentUserPermissions, activeCategory, searchQuery]);

  const groupedModules = useMemo(() => {
    const groups: { [key: string]: ModuleDefinition[] } = {};
    allowedModules.forEach((m) => {
      const cat = m.categoryTitle;
      const list = groups[cat] ?? [];
      list.push(m);
      groups[cat] = list;
    });
    return groups;
  }, [allowedModules]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          backgroundColor: 'var(--ds-color-surface, #0F172A)',
          borderLeft: '1px solid var(--ds-color-border, rgba(56, 189, 248, 0.2))',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--ds-color-text-primary, #F8FAFC)',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'var(--ds-color-surface, #0B1120)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--ds-color-primary, #38BDF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              📂
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--ds-color-text-primary, #FFFFFF)' }}>
                Hospital Master Suite
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                All 38 clinical, diagnostic & operations modules
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '3px 7px',
                borderRadius: '4px',
                backgroundColor: 'var(--ds-color-border, #1E293B)',
                color: 'var(--ds-color-text-muted, #94A3B8)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              ESC to close
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ds-color-text-muted, #94A3B8)',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
              title="Close Drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--ds-color-surface, #0E1626)',
            borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.06))',
            flexShrink: 0
          }}
        >
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.9rem',
                color: 'var(--ds-color-text-muted, #64748B)'
              }}
            >
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search module name, keyword, code..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 34px',
                borderRadius: '8px',
                border: '1px solid var(--ds-color-border, #334155)',
                backgroundColor: 'var(--ds-color-bg, #070C16)',
                color: 'var(--ds-color-text-primary, #F8FAFC)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-color-text-muted, #94A3B8)',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingTop: '10px',
              paddingBottom: '2px',
              scrollbarWidth: 'none'
            }}
          >
            {categories.map((c) => {
              const isSelected = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: isSelected
                      ? '1px solid var(--ds-color-primary, #38BDF8)'
                      : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
                    backgroundColor: isSelected
                      ? 'rgba(56, 189, 248, 0.15)'
                      : 'var(--ds-color-surface, #1E293B)',
                    color: isSelected ? 'var(--ds-color-primary, #38BDF8)' : 'var(--ds-color-text-muted, #94A3B8)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modules List (Scrollable) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {Object.keys(groupedModules).length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: 'var(--ds-color-text-muted, #94A3B8)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontWeight: 700, color: 'var(--ds-color-text-primary, #F8FAFC)' }}>No modules found</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Try searching for a different clinical or administrative keyword.
              </div>
            </div>
          ) : (
            Object.entries(groupedModules).map(([groupTitle, modules]) => (
              <div key={groupTitle} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--ds-color-text-muted, #94A3B8)',
                    paddingLeft: '4px'
                  }}
                >
                  {groupTitle} ({modules.length})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  {modules.map((mod) => {
                    const isActive = activeModule === mod.id;
                    const isLocked = isFreeHospital && isHospitalModuleLocked(mod.id, currentPlanTier);

                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          if (isLocked) {
                            if (onOpenUpgradeModal) onOpenUpgradeModal(mod.label);
                          } else {
                            onSelectModule(mod.id);
                            onClose();
                          }
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: isActive
                            ? 'rgba(56, 189, 248, 0.14)'
                            : 'var(--ds-color-surface, rgba(30, 41, 59, 0.5))',
                          border: isActive
                            ? '1.5px solid var(--ds-color-primary, #38BDF8)'
                            : '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.06))',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                          opacity: isLocked ? 0.75 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{mod.icon}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: isActive
                                    ? 'var(--ds-color-primary, #38BDF8)'
                                    : 'var(--ds-color-text-primary, #FFFFFF)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {mod.label}
                              </span>
                              {mod.tag && (
                                <span
                                  style={{
                                    fontSize: '0.625rem',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(56, 189, 248, 0.18)',
                                    color: 'var(--ds-color-primary, #38BDF8)',
                                    fontWeight: 700
                                  }}
                                >
                                  {mod.tag}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--ds-color-text-muted, #94A3B8)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginTop: '2px'
                              }}
                            >
                              {mod.description}
                            </div>
                          </div>
                        </div>

                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isLocked ? (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                                color: '#FFFFFF',
                                boxShadow: '0 0 8px rgba(124, 58, 237, 0.4)'
                              }}
                            >
                              🔒 PRO
                            </span>
                          ) : isActive ? (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#10B981',
                                color: '#FFFFFF'
                              }}
                            >
                              ACTIVE
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--ds-color-text-muted, #64748B)' }}>➔</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'var(--ds-color-surface, #0B1120)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          {onTogglePersistentFullMode && (
            <button
              type="button"
              onClick={() => {
                onTogglePersistentFullMode();
                onClose();
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--ds-color-border, #334155)',
                color: 'var(--ds-color-text-muted, #94A3B8)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🏢 Switch to Full Sidebar Mode
            </button>
          )}

          <span style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted, #64748B)', marginLeft: 'auto' }}>
            Tip: Press <kbd style={{ background: '#1E293B', padding: '1px 4px', borderRadius: '3px' }}>Ctrl+K</kbd> for instant search
          </span>
        </div>
      </div>
    </div>
  );
};
