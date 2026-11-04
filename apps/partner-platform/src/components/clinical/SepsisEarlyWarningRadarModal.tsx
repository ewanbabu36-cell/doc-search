import React, { useState } from 'react';
import { Badge, Button, Dialog } from '@docsearch/ui-kit';

export interface SepsisRadarProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  uhid: string;
  bedId?: string | undefined;
  qSofaScore: number; // 0 - 3
  vitals: {
    rr: number; // breaths/min
    sbp: number; // mmHg
    gcs: number; // 3-15
    lactate?: number | undefined; // mmol/L
    temp?: string | undefined;
    spo2?: number | undefined;
  };
}

export const SepsisEarlyWarningRadarModal: React.FC<SepsisRadarProps> = ({
  isOpen,
  onClose,
  patientName,
  uhid,
  bedId = 'ICU-BED-04',
  qSofaScore,
  vitals
}) => {
  const [bundleChecks, setBundleChecks] = useState<Record<string, boolean>>({
    lactate: false,
    bloodCultures: false,
    antibiotics: false,
    crystalloids: false,
    vasopressors: false
  });

  const toggleCheck = (id: string) => {
    setBundleChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(bundleChecks).filter(Boolean).length;
  const isCritical = qSofaScore >= 2;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>{isCritical ? '🚨' : '⚠️'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: isCritical ? '#EF4444' : '#F59E0B' }}>
              {isCritical ? 'CRITICAL SEPSIS SENTINEL (qSOFA >= 2)' : 'CLINICAL DETERIORATION WATCHLIST'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
              Surviving Sepsis Campaign (SSC) 1-Hour Protocol • Automated Bedside Telemetry
            </div>
          </div>
        </div>
      }
    >
      <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Patient & Location strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--ds-color-surface-muted, #1E293B)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--ds-color-border, #334155)'
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ds-color-text-primary)' }}>
              {patientName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
              UHID: <strong style={{ color: '#38BDF8' }}>{uhid}</strong> • Bed: <strong>{bedId}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge variant={isCritical ? 'danger' : 'warning'}>
              {isCritical ? `qSOFA SCORE: ${qSofaScore} / 3 (HIGH RISK)` : `qSOFA: ${qSofaScore} / 3 (MONITOR)`}
            </Badge>
            <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '4px' }}>
              In-Hospital Mortality Risk &gt; 10%
            </div>
          </div>
        </div>

        {/* qSOFA Criteria Breakdown Cards */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ds-color-text-muted)', marginBottom: '8px' }}>
            qSOFA Bedside Score Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* 1. Tachypnea */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: vitals.rr >= 22 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                border: `1.5px solid ${vitals.rr >= 22 ? '#EF4444' : '#10B981'}`
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 600 }}>
                1. RESPIRATORY RATE
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: vitals.rr >= 22 ? '#EF4444' : '#10B981' }}>
                {vitals.rr} <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>bpm</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: vitals.rr >= 22 ? '#F87171' : '#34D399', marginTop: '2px' }}>
                {vitals.rr >= 22 ? '⚠️ RR >= 22 (+1 Point)' : '✓ Normal (< 22)'}
              </div>
            </div>

            {/* 2. Hypotension */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: vitals.sbp <= 100 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                border: `1.5px solid ${vitals.sbp <= 100 ? '#EF4444' : '#10B981'}`
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 600 }}>
                2. SYSTOLIC BP
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: vitals.sbp <= 100 ? '#EF4444' : '#10B981' }}>
                {vitals.sbp} <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>mmHg</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: vitals.sbp <= 100 ? '#F87171' : '#34D399', marginTop: '2px' }}>
                {vitals.sbp <= 100 ? '⚠️ SBP <= 100 (+1 Point)' : '✓ Normotensive (> 100)'}
              </div>
            </div>

            {/* 3. Altered Mentation */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: vitals.gcs < 15 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                border: `1.5px solid ${vitals.gcs < 15 ? '#EF4444' : '#10B981'}`
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', fontWeight: 600 }}>
                3. GLASGOW COMA SCALE
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: vitals.gcs < 15 ? '#EF4444' : '#10B981' }}>
                {vitals.gcs} <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>/ 15</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: vitals.gcs < 15 ? '#F87171' : '#34D399', marginTop: '2px' }}>
                {vitals.gcs < 15 ? '⚠️ GCS < 15 (+1 Point)' : '✓ Alert & Oriented (15)'}
              </div>
            </div>
          </div>
        </div>

        {/* Surviving Sepsis Campaign (SSC) 1-Hour Resuscitation Bundle */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ds-color-text-muted)' }}>
              1-Hour Resuscitation Bundle (Zero Delay Protocol)
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8' }}>
              {completedCount} of 5 Completed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              {
                id: 'lactate',
                title: '1. Measure Serum Lactate STAT (Target <= 2.0 mmol/L)',
                desc: 'Remonitor in 2-4 hrs if initial lactate > 2.0 mmol/L.'
              },
              {
                id: 'bloodCultures',
                title: '2. Obtain Blood Cultures prior to Antibiotics (2 Sets)',
                desc: 'Aerobic & anaerobic peripheral sets without delaying antibiotic start.'
              },
              {
                id: 'antibiotics',
                title: '3. Administer Broad-Spectrum IV Antibiotics',
                desc: 'Antibiogram-guided coverage (Piperacillin-Tazobactam / Meropenem).'
              },
              {
                id: 'crystalloids',
                title: '4. Rapid Fluid Bolus 30 mL/kg Crystalloid',
                desc: 'For Hypotension (MAP < 65) or Serum Lactate >= 4.0 mmol/L.'
              },
              {
                id: 'vasopressors',
                title: '5. Vasopressor Titration (Noradrenaline / Norepinephrine)',
                desc: 'Target Mean Arterial Pressure (MAP) >= 65 mmHg if unresponsive to fluid bolus.'
              }
            ].map((step) => (
              <label
                key={step.id}
                onClick={() => toggleCheck(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: bundleChecks[step.id] ? 'rgba(16, 185, 129, 0.12)' : 'var(--ds-color-surface, #0F172A)',
                  border: `1px solid ${bundleChecks[step.id] ? '#10B981' : 'var(--ds-color-border, #334155)'}`,
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={!!bundleChecks[step.id]}
                  onChange={() => toggleCheck(step.id)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: bundleChecks[step.id] ? '#10B981' : 'var(--ds-color-text-primary)',
                      textDecoration: bundleChecks[step.id] ? 'line-through' : 'none'
                    }}
                  >
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                    {step.desc}
                  </div>
                </div>
                {bundleChecks[step.id] && (
                  <Badge variant="success">Completed</Badge>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button variant="secondary" onClick={onClose}>
            Dismiss Sentinel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              alert(`🚨 CODE SEPSIS ACTIVATED: Emergency Resuscitation Team & ICU Registrar Paged for ${patientName} (${bedId})`);
              onClose();
            }}
          >
            🚨 Activate Code Sepsis & Page RRT
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
