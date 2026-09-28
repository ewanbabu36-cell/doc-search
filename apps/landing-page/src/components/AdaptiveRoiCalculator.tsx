import React, { useState } from 'react';

export type CalculatorPersona = 'SOLO_DOCTOR' | 'HOSPITAL' | 'PHARMACY' | 'LAB';

interface Props {
  onOpenDemoModal?: () => void;
}

export const AdaptiveRoiCalculator: React.FC<Props> = ({ onOpenDemoModal }) => {
  const [persona, setPersona] = useState<CalculatorPersona>('SOLO_DOCTOR');

  // Solo Doctor State
  const [dailyPatients, setDailyPatients] = useState<number>(40);

  // Hospital State
  const [bedCount, setBedCount] = useState<number>(150);
  const [dailyOpdCount, setDailyOpdCount] = useState<number>(650);

  // Pharmacy State
  const [monthlyTurnoverLakhs, setMonthlyTurnoverLakhs] = useState<number>(8); // in Lakhs (₹)

  // Lab State
  const [dailySamples, setDailySamples] = useState<number>(120);

  // Audio tactile chime
  const playTactileChime = (freq = 750) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // AudioContext unavailable
    }
  };

  return (
    <section
      id="calculator"
      style={{
        padding: '80px 32px',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 10,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '9999px',
              padding: '4px 14px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}
          >
            ADAPTIVE ROI & EFFICIENCY CALCULATOR
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 10px 0', color: '#F8FAFC' }}>
            Calculate Your Time Saved & Revenue Retention
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto' }}>
            Tailored financial, clinical time, and operational models for every healthcare operator.
          </p>
        </div>

        {/* 4-Persona Selector Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '36px'
          }}
        >
          {[
            { id: 'SOLO_DOCTOR', label: 'Solo Doctor & Clinic', icon: '🩺' },
            { id: 'HOSPITAL', label: 'Multi-Specialty Hospital', icon: '🏥' },
            { id: 'PHARMACY', label: 'Retail & Hospital Chemist', icon: '💊' },
            { id: 'LAB', label: 'Diagnostic Pathology Lab', icon: '🧪' }
          ].map((tab) => {
            const isSelected = persona === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playTactileChime(850);
                  setPersona(tab.id as CalculatorPersona);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.6)',
                  color: isSelected ? '#F8FAFC' : '#94A3B8',
                  boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Calculator Container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '32px',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* ========================================================================= */}
          {/* SLIDERS COLUMN (LEFT)                                                     */}
          {/* ========================================================================= */}
          <div>
            {/* 1. SOLO DOCTOR SLIDER */}
            {persona === 'SOLO_DOCTOR' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#E2E8F0' }}>
                      Daily OPD Consultations:
                    </label>
                    <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: '1.25rem' }}>
                      {dailyPatients} Patients / Day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={dailyPatients}
                    onChange={(e) => setDailyPatients(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer', height: '6px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                    <span>10 / day</span>
                    <span>40 (Typical)</span>
                    <span>120 / day</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 800, marginBottom: '6px' }}>
                    ⚡ CLINICAL SUPERPOWERS FOR SOLO PRACTITIONERS
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                    <li>Ambient Voice Scribe auto-types Hinglish & English consultations in 30 seconds</li>
                    <li>1-Click drug protocol kits eliminate typing dosage & frequencies</li>
                    <li>Digital prescriptions automatically delivered to patient WhatsApp with your clinic header</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2. HOSPITAL SLIDERS */}
            {persona === 'HOSPITAL' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#E2E8F0' }}>Hospital Bed Capacity:</label>
                    <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: '1.25rem' }}>{bedCount} Beds</span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={1000}
                    step={25}
                    value={bedCount}
                    onChange={(e) => setBedCount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer', height: '6px' }}
                  />
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#E2E8F0' }}>Daily Hospital Footfall (OPD):</label>
                    <span style={{ fontWeight: 800, color: '#A855F7', fontSize: '1.25rem' }}>{dailyOpdCount} Patients</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={3000}
                    step={50}
                    value={dailyOpdCount}
                    onChange={(e) => setDailyOpdCount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#A855F7', cursor: 'pointer', height: '6px' }}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 800, marginBottom: '6px' }}>
                    ⚡ ENTERPRISE HOSPITAL VALUE
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                    <li>ABDM M2 token intake cuts reception queues from 25 min to 45 seconds</li>
                    <li>Zero unbilled pharmacy or consumable items via closed-loop nursing sync</li>
                    <li>100% NABH digital audit compliance with cryptographically signed logs</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 3. PHARMACY SLIDERS */}
            {persona === 'PHARMACY' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#E2E8F0' }}>
                      Monthly Medicine Turnover:
                    </label>
                    <span style={{ fontWeight: 800, color: '#10B981', fontSize: '1.25rem' }}>
                      ₹{monthlyTurnoverLakhs} Lakhs / Month
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    step={1}
                    value={monthlyTurnoverLakhs}
                    onChange={(e) => setMonthlyTurnoverLakhs(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer', height: '6px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                    <span>₹2 Lakh</span>
                    <span>₹8 Lakh (Average)</span>
                    <span>₹50 Lakh</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 800, marginBottom: '6px' }}>
                    ⚡ ZERO EXPIRY & FAST DISPENSE ENGINE
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                    <li>FEFO batch radar sells near-expiry medicine first to eliminate dead stock loss</li>
                    <li>Sub-10ms checkout with automatic 80mm ESC/POS thermal printing</li>
                    <li>Automated CDSCO Schedule H & H1 narcotics audit registers</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. LAB SLIDERS */}
            {persona === 'LAB' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#E2E8F0' }}>
                      Daily Samples Processed:
                    </label>
                    <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '1.25rem' }}>
                      {dailySamples} Samples / Day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={600}
                    step={20}
                    value={dailySamples}
                    onChange={(e) => setDailySamples(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer', height: '6px' }}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 800, marginBottom: '6px' }}>
                    ⚡ DIRECT ANALYZER TELEMETRY & DISPATCH
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                    <li>ASTM E1381/E1394 captures Mindray & Sysmex CBC parameters with 0 manual typing</li>
                    <li>NABL 15-minute panic notification automatically alerts doctor on WhatsApp</li>
                    <li>Cryptographic QR code on every PDF report for fraud-proof verification</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CALCULATED OUTPUT METRICS (RIGHT)                                         */}
          {/* ========================================================================= */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* 1. SOLO DOCTOR OUTPUTS */}
            {persona === 'SOLO_DOCTOR' && (
              <div>
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Clinical Documentation Time Saved
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                    ~{(dailyPatients * 3.3 / 60).toFixed(1)} hrs / day
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Eliminates manual prescription typing through Ambient AI & 1-click kits
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Keystrokes Eliminated
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                      ~{(dailyPatients * 460).toLocaleString('en-IN')} /day
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Follow-up Retention
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A855F7', marginTop: '2px' }}>
                      +28.4%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. HOSPITAL OUTPUTS */}
            {persona === 'HOSPITAL' && (
              <div>
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Estimated Monthly Clinical Revenue Tracked
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
                    ₹ {(bedCount * 38000 + dailyOpdCount * 420 * 26).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Doctor & Nursing Hours Saved
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
                      ~{Math.round(bedCount * 2.8 + dailyOpdCount * 0.4)} hrs/mo
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Billing Leakage Prevented
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B', marginTop: '2px' }}>
                      8.4% (₹{Math.round((bedCount * 38000 + dailyOpdCount * 420 * 26) * 0.084 / 100000).toFixed(1)}L/mo)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PHARMACY OUTPUTS */}
            {persona === 'PHARMACY' && (
              <div>
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Annual Expiry Stock Loss Prevented
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                    ₹ {Math.round(monthlyTurnoverLakhs * 100000 * 0.045 * 12).toLocaleString('en-IN')} / year
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Eliminates expired returns using real-time FEFO batch prioritization
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Queue Velocity
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                      3.2x Faster
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Customer Retention
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A855F7', marginTop: '2px' }}>
                      +14.2%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. LAB OUTPUTS */}
            {persona === 'LAB' && (
              <div>
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Monthly Automated Dispatch Savings
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                    ₹ {Math.round(dailySamples * 5.5 * 26).toLocaleString('en-IN')} / mo
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Zero SMS gateway fees & zero printed paper report waste
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Transcription Errors
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                      0.0% (ASTM)
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Report Delivery TAT
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B', marginTop: '2px' }}>
                      -64% Faster
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Request Custom Audit Button */}
            <button
              type="button"
              onClick={onOpenDemoModal}
              style={{
                background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                color: '#FFFFFF',
                padding: '14px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              Request Tailored Clinical ROI Audit →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
