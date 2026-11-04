import React, { useState } from 'react';
import { Badge } from '@docsearch/ui-kit';
import { SepsisEarlyWarningRadarModal } from './SepsisEarlyWarningRadarModal.js';

export interface StoryboardPatientData {
  uhid: string;
  name: string;
  ageGender: string;
  bloodGroup: string;
  avatarUrl?: string | undefined;
  allergies: string[];
  codeStatus: 'FULL_CODE' | 'DNR' | 'DNI' | 'LIMITED_INTERVENTION';
  fallRisk: 'LOW' | 'MODERATE' | 'HIGH';
  dvtRisk: 'LOW' | 'MODERATE' | 'HIGH';
  vitals: {
    bp: string;
    pulse: number;
    spo2: number;
    temp: string;
    weight: string;
    bmi: string;
    painScore?: number | undefined;
  };
  attendingDoctor: string;
  department: string;
  location: string; // e.g. "Chamber 101" or "ICU-BED-04"
  admissionDate?: string | undefined;
  losDays?: number | undefined;
  primaryDiagnosis?: string | undefined;
  isolationPrecautions?: 'NONE' | 'CONTACT' | 'DROPLET' | 'AIRBORNE' | undefined;
}

export interface PatientStoryboardRailProps {
  patient?: StoryboardPatientData | undefined;
  isCollapsed?: boolean | undefined;
  onToggleCollapse?: (() => void) | undefined;
  onOpenAllergyDossier?: (() => void) | undefined;
  onOpenVitalsFlowsheet?: (() => void) | undefined;
  onOpenCodeStatusModal?: (() => void) | undefined;
}

const DEFAULT_STORYBOARD_PATIENT: StoryboardPatientData = {
  uhid: 'UHID-2026-102',
  name: 'Kishore Kumar',
  ageGender: '52Y / Male',
  bloodGroup: 'B Positive (B+)',
  allergies: ['PENICILLIN ANAPHYLAXIS', 'SULFA DRUGS'],
  codeStatus: 'FULL_CODE',
  fallRisk: 'HIGH',
  dvtRisk: 'MODERATE',
  vitals: {
    bp: '138/88',
    pulse: 78,
    spo2: 98,
    temp: '99.2 °F',
    weight: '72 kg',
    bmi: '24.9',
    painScore: 3
  },
  attendingDoctor: 'Dr. Amitabh Verma, MD',
  department: 'General Medicine & ICU',
  location: 'ICU-BED-04 (Medical ICU)',
  admissionDate: '2026-11-02',
  losDays: 3,
  primaryDiagnosis: 'Acute Pancreatitis / Post-op Day 2',
  isolationPrecautions: 'CONTACT'
};

export const PatientStoryboardRail: React.FC<PatientStoryboardRailProps> = ({
  patient = DEFAULT_STORYBOARD_PATIENT,
  isCollapsed = false,
  onToggleCollapse,
  onOpenAllergyDossier,
  onOpenVitalsFlowsheet,
  onOpenCodeStatusModal
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(isCollapsed);
  const [isSepsisModalOpen, setIsSepsisModalOpen] = useState(false);

  const collapsed = onToggleCollapse !== undefined ? isCollapsed : internalCollapsed;
  const toggle = onToggleCollapse !== undefined ? onToggleCollapse : () => setInternalCollapsed((prev) => !prev);

  if (collapsed) {
    return (
      <aside
        style={{
          width: '54px',
          backgroundColor: '#090D16',
          borderRight: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 6px',
          gap: '14px',
          flexShrink: 0,
          transition: 'width 0.2s ease',
          zIndex: 40
        }}
        title="Epic Storyboard (Collapsed) • Click to Expand"
      >
        <button
          type="button"
          onClick={toggle}
          style={{
            background: 'none',
            border: 'none',
            color: '#38BDF8',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '4px'
          }}
          title="Expand Patient Storyboard Rail"
        >
          ▶
        </button>

        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#0284C7',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.875rem'
          }}
        >
          {patient.name.charAt(0)}
        </div>

        {patient.allergies.length > 0 && (
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              boxShadow: '0 0 8px #EF4444',
              animation: 'pulse 1.5s infinite'
            }}
            title={`Allergies: ${patient.allergies.join(', ')}`}
          />
        )}

        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '0.75rem',
            color: '#94A3B8',
            fontWeight: 800,
            letterSpacing: '0.5px'
          }}
        >
          {patient.uhid}
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: '280px',
        minWidth: '280px',
        backgroundColor: '#080C14',
        borderRight: '1.5px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: '100%',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 40,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.45)'
      }}
    >
      <div>
        {/* STORYBOARD HEADER & COLLAPSE CONTROL */}
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0A0F1D'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: '#0284C7' }}>⚡</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Patient 360 Storyboard
            </span>
          </div>
          <button
            type="button"
            onClick={toggle}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '2px 4px'
            }}
            title="Collapse Storyboard"
          >
            ◀
          </button>
        </div>

        {/* PATIENT AVATAR & DEMOGRAPHICS */}
        <div style={{ padding: '14px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(2, 132, 199, 0.25)',
                border: '2px solid #0284C7',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 900,
                flexShrink: 0
              }}
            >
              {patient.name.split(' ').map((n) => n[0]).join('')}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  color: '#F8FAFC',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={patient.name}
              >
                {patient.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '1px' }}>
                {patient.ageGender}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#38BDF8', fontFamily: 'monospace', fontWeight: 700 }}>
                {patient.uhid}
              </div>
            </div>
          </div>

          {/* Blood Group & Primary Diagnosis */}
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.68rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 800
              }}
            >
              🩸 {patient.bloodGroup}
            </span>

            {patient.losDays !== undefined && (
              <span style={{ fontSize: '0.68rem', color: '#CBD5E1', fontWeight: 600 }}>
                LOS: <strong style={{ color: '#38BDF8' }}>Day {patient.losDays}</strong>
              </span>
            )}
          </div>

          {patient.primaryDiagnosis && (
            <div
              style={{
                fontSize: '0.72rem',
                color: '#E2E8F0',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                padding: '6px 8px',
                borderRadius: '6px',
                marginTop: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontWeight: 600
              }}
            >
              Dx: {patient.primaryDiagnosis}
            </div>
          )}
        </div>

        {/* PULSATING RED ALLERGY SENTINEL */}
        {patient.allergies.length > 0 ? (
          <div
            onClick={onOpenAllergyDossier}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.18)',
              borderBottom: '2px solid #EF4444',
              padding: '10px 14px',
              cursor: onOpenAllergyDossier ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}
            title="Documented Severe Allergy Alerts • Click to inspect"
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Allergy Hard-Lock Active
              </div>
              <div style={{ fontSize: '0.72rem', color: '#FEE2E2', fontWeight: 800, marginTop: '2px' }}>
                {patient.allergies.join(', ')}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '6px 14px', borderBottom: '1px solid #1E293B', fontSize: '0.68rem', color: '#10B981', fontWeight: 700 }}>
            ✓ No Known Drug Allergies (NKDA)
          </div>
        )}

        {/* CLINICAL CODE STATUS & PRECAUTIONS */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
              Resuscitation Code
            </span>
            <button
              type="button"
              onClick={onOpenCodeStatusModal}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <Badge
                variant={patient.codeStatus === 'FULL_CODE' ? 'success' : 'critical'}
                style={{ fontSize: '0.68rem', fontWeight: 800 }}
              >
                {patient.codeStatus === 'FULL_CODE' ? '🟢 FULL CODE' : '🟣 DNR / DNI'}
              </Badge>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div
              style={{
                backgroundColor: patient.fallRisk === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${patient.fallRisk === 'HIGH' ? '#EF4444' : 'rgba(255, 255, 255, 0.1)'}`,
                padding: '4px 6px',
                borderRadius: '6px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 700 }}>FALL RISK</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: patient.fallRisk === 'HIGH' ? '#FCA5A5' : '#CBD5E1' }}>
                {patient.fallRisk}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 6px',
                borderRadius: '6px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 700 }}>DVT RISK</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#38BDF8' }}>
                {patient.dvtRisk}
              </div>
            </div>
          </div>
        </div>

        {/* REAL-TIME BEDSIDE VITALS FLOWSHEET */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
              Bedside Vitals Stream
            </span>
            <button
              type="button"
              onClick={onOpenVitalsFlowsheet}
              style={{
                background: 'none',
                border: 'none',
                color: '#38BDF8',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Flowsheet →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* BP */}
            <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', padding: '6px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>BP (mmHg)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                {patient.vitals.bp}
              </div>
            </div>

            {/* Pulse */}
            <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', padding: '6px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>Pulse (bpm)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#34D399', fontFamily: 'monospace' }}>
                {patient.vitals.pulse}
              </div>
            </div>

            {/* SpO2 */}
            <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', padding: '6px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>SpO2 (%)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#6EE7B7', fontFamily: 'monospace' }}>
                {patient.vitals.spo2}%
              </div>
            </div>

            {/* Temp */}
            <div style={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', padding: '6px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>Temp (°F)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace' }}>
                {patient.vitals.temp}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94A3B8', marginTop: '8px' }}>
            <span>Weight: <strong>{patient.vitals.weight}</strong></span>
            <span>BMI: <strong>{patient.vitals.bmi}</strong></span>
            {patient.vitals.painScore !== undefined && (
              <span style={{ color: patient.vitals.painScore >= 4 ? '#F87171' : '#34D399' }}>
                Pain: <strong>{patient.vitals.painScore}/10</strong>
              </span>
            )}
          </div>

          {/* Sepsis Sentinel Alert Trigger */}
          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsSepsisModalOpen(true)}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #EF4444',
                borderRadius: '6px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FCA5A5' }}>
                🚨 Sepsis Radar (qSOFA)
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#EF4444' }}>
                Eval STAT →
              </span>
            </button>
          </div>
        </div>

        {/* ATTENDING CLINICIAN & BED LOCATION */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>
            Location & Care Team
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F8FAFC' }}>
            🚪 {patient.location}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '2px' }}>
            👨‍⚕️ {patient.attendingDoctor}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '1px' }}>
            {patient.department}
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid #1E293B',
          backgroundColor: '#0A0F1D',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '0.65rem', color: '#64748B', textAlign: 'center' }}>
          Press <kbd style={{ backgroundColor: '#1E293B', padding: '1px 4px', borderRadius: '3px', color: '#38BDF8' }}>F8</kbd> for Vitals • <kbd style={{ backgroundColor: '#1E293B', padding: '1px 4px', borderRadius: '3px', color: '#38BDF8' }}>F3</kbd> for Next
        </div>
      </div>

      {/* Surviving Sepsis 1-Hour Sentinel Modal */}
      <SepsisEarlyWarningRadarModal
        isOpen={isSepsisModalOpen}
        onClose={() => setIsSepsisModalOpen(false)}
        patientName={patient.name}
        uhid={patient.uhid}
        bedId={patient.location}
        qSofaScore={2}
        vitals={{
          rr: 24,
          sbp: 96,
          gcs: 14,
          lactate: 2.8,
          temp: patient.vitals.temp,
          spo2: patient.vitals.spo2
        }}
      />
    </aside>
  );
};
