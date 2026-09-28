import React, { useState } from 'react';
import type { PartnerModuleKey } from '../PartnerPlatformShell.js';
import { isPartnerModuleAllowed } from '../../utils/partnerRolePermissions.js';

export interface HospitalPatientJourneyCommandBarProps {
  onNavigateModule?: ((moduleKey: PartnerModuleKey) => void) | undefined;
  activeModule?: PartnerModuleKey | undefined;
  currentUserRole?: string | undefined;
}

export interface PatientJourneyStage {
  step: number;
  category: 'OUTPATIENT' | 'INPATIENT';
  title: string;
  subtitle: string;
  moduleId: PartnerModuleKey;
  badge: string;
  badgeColor: string;
  icon: string;
  bg: string;
}

const PATIENT_JOURNEY_STAGES: PatientJourneyStage[] = [
  {
    step: 1,
    category: 'OUTPATIENT',
    title: '1. Patient Intake',
    subtitle: 'New Demographics & UHID',
    moduleId: 'patient-registration',
    badge: 'New UHID',
    badgeColor: '#38BDF8',
    icon: '📇',
    bg: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)'
  },
  {
    step: 2,
    category: 'OUTPATIENT',
    title: '2. OPD Token Queue',
    subtitle: 'Live Tokens & Waiting',
    moduleId: 'encounters-visits',
    badge: 'Queue Live',
    badgeColor: '#8B5CF6',
    icon: '⏱️',
    bg: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)'
  },
  {
    step: 3,
    category: 'OUTPATIENT',
    title: '3. Doctor Desk',
    subtitle: 'SOAP Notes & e-Prescription',
    moduleId: 'clinical-consultation',
    badge: 'e-Rx Active',
    badgeColor: '#10B981',
    icon: '🩺',
    bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
  },
  {
    step: 4,
    category: 'OUTPATIENT',
    title: '4. Diagnostics & Labs',
    subtitle: 'Pathology & Imaging Reports',
    moduleId: 'clinical-investigation',
    badge: 'Lab Orders',
    badgeColor: '#06B6D4',
    icon: '🧪',
    bg: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)'
  },
  {
    step: 5,
    category: 'INPATIENT',
    title: '5. Pharmacy POS',
    subtitle: 'FEFO Dispense & Inventory',
    moduleId: 'pharmacy-medication',
    badge: 'Fast POS',
    badgeColor: '#F59E0B',
    icon: '💊',
    bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
  },
  {
    step: 6,
    category: 'INPATIENT',
    title: '6. Cashier & Billing',
    subtitle: 'Invoices & Dynamic UPI QR',
    moduleId: 'billing-revenue-cycle',
    badge: 'POS Ready',
    badgeColor: '#10B981',
    icon: '⚡',
    bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
  },
  {
    step: 7,
    category: 'INPATIENT',
    title: '7. Inpatient & Beds',
    subtitle: 'Ward Occupancy, ICU & Bed',
    moduleId: 'inpatient-management',
    badge: 'Bed Matrix',
    badgeColor: '#6366F1',
    icon: '🛏️',
    bg: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
  },
  {
    step: 8,
    category: 'INPATIENT',
    title: '8. Emergency & Trauma',
    subtitle: 'Code Red & STAT Critical',
    moduleId: 'emergency-trauma',
    badge: '24/7 STAT',
    badgeColor: '#EF4444',
    icon: '🚨',
    bg: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
  }
];

export const HospitalPatientJourneyCommandBar: React.FC<HospitalPatientJourneyCommandBarProps> = ({
  onNavigateModule,
  activeModule,
  currentUserRole
}) => {
  const [journeyFilter, setJourneyFilter] = useState<'ALL' | 'OUTPATIENT' | 'INPATIENT'>('ALL');

  return (
    <div
      style={{
        backgroundColor: '#11182E',
        border: '1px solid #1E293B',
        borderRadius: '14px',
        padding: '14px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header Strip with Title, Filter Tabs, and Live Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              color: '#FFF',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.925rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                Patient Care & Clinical Journey
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38BDF8',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.6875rem',
                  fontWeight: 700
                }}
              >
                8 Core Stages
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              End-to-end hospital clinical workflow from registration to discharge & emergency care
            </div>
          </div>
        </div>

        {/* Filter Pills & Live Ops Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '2px'
            }}
          >
            {[
              { id: 'ALL', label: 'All Stages (8)' },
              { id: 'OUTPATIENT', label: '🩺 Outpatient & Clinic (4)' },
              { id: 'INPATIENT', label: '🏥 Inpatient & Critical (4)' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setJourneyFilter(tab.id as any)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: journeyFilter === tab.id ? '#1E293B' : 'transparent',
                  color: journeyFilter === tab.id ? '#F8FAFC' : '#94A3B8',
                  fontSize: '0.72rem',
                  fontWeight: journeyFilter === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.6875rem',
              color: '#10B981',
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '5px 9px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }}
            />
            Live Journey Active
          </div>
        </div>
      </div>

      {/* 8 Responsive Stage Cards Grid (Zero horizontal scrollbar) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px'
        }}
      >
        {PATIENT_JOURNEY_STAGES.filter(
          (s) => journeyFilter === 'ALL' || s.category === journeyFilter
        ).map((s) => {
          const isAllowed = isPartnerModuleAllowed(s.moduleId, currentUserRole);
          const isCurrent = activeModule === s.moduleId;
          return (
            <div
              key={s.step}
              onClick={() => {
                if (isAllowed && onNavigateModule) {
                  onNavigateModule(s.moduleId);
                }
              }}
              style={{
                backgroundColor: isCurrent ? 'rgba(56, 189, 248, 0.12)' : '#0E162B',
                border: isCurrent
                  ? '1.5px solid #38BDF8'
                  : isAllowed
                  ? '1px solid #1E293B'
                  : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                cursor: isAllowed && onNavigateModule ? 'pointer' : 'not-allowed',
                opacity: isAllowed ? 1 : 0.45,
                transition: 'all 0.18s ease',
                boxShadow: isCurrent
                  ? '0 0 12px rgba(56, 189, 248, 0.25)'
                  : '0 2px 6px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                if (isAllowed && !isCurrent) {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  e.currentTarget.style.backgroundColor = '#131D38';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (isAllowed && !isCurrent) {
                  e.currentTarget.style.borderColor = '#1E293B';
                  e.currentTarget.style.backgroundColor = '#0E162B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
              title={isAllowed ? `Open ${s.title}` : 'Access restricted for current role'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: s.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    fontSize: '1.05rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                  }}
                >
                  {s.icon}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: isCurrent ? 800 : 700,
                      color: isCurrent ? '#38BDF8' : '#F8FAFC',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.675rem',
                      color: '#94A3B8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px'
                    }}
                  >
                    {s.subtitle}
                  </div>
                </div>
              </div>

              {/* Status Badge & Launch Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                <span
                  style={{
                    backgroundColor: `${s.badgeColor}18`,
                    border: `1px solid ${s.badgeColor}40`,
                    color: s.badgeColor,
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '5px'
                  }}
                >
                  {s.badge}
                </span>
                <span style={{ fontSize: '0.72rem', color: isCurrent ? '#38BDF8' : '#64748B' }}>➔</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
