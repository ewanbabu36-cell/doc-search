import React, { useState } from 'react';
import { hospitalEventBus, type ActivePatientSummary } from '../../services/hospital-event-bus.js';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface News2ClinicalAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: ActivePatientSummary | null;
}

export const News2ClinicalAlertModal: React.FC<News2ClinicalAlertModalProps> = ({
  isOpen,
  onClose,
  patient
}) => {
  // Clinical Parameters State
  const [respRate, setRespRate] = useState<number>(24);
  const [spO2, setSpO2] = useState<number>(93);
  const [onOxygen, setOnOxygen] = useState<boolean>(true);
  const [systolicBp, setSystolicBp] = useState<number>(92);
  const [pulseRate, setPulseRate] = useState<number>(114);
  const [consciousness, setConsciousness] = useState<'A' | 'V' | 'P' | 'U'>('V'); // Alert, Voice, Pain, Unresponsive
  const [temperature, setTemperature] = useState<number>(38.8);
  const [dispatchAlertTriggered, setDispatchAlertTriggered] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  if (!isOpen) return null;

  const partnerProfile = getUnifiedPartnerProfile();
  const currentPatient = patient || {
    id: 'pat-101',
    uhid: 'UHID-2026-0812',
    name: 'Rahul Verma',
    age: 42,
    gender: 'MALE',
    bloodGroup: 'B+',
    bedNumber: 'ICU-04',
    wardName: 'Cardiology Critical Care (ICU)',
    doctorName: partnerProfile.doctorName ? `${partnerProfile.doctorName} (${partnerProfile.doctorDegree || 'Attending Physician'})` : 'Attending Physician'
  };

  // Royal College of Physicians NEWS2 Scoring Formula
  const getRespScore = (r: number): number => {
    if (r <= 8) return 3;
    if (r <= 11) return 1;
    if (r <= 20) return 0;
    if (r <= 24) return 2;
    return 3;
  };

  const getSpO2Score = (s: number): number => {
    if (s <= 91) return 3;
    if (s <= 93) return 2;
    if (s <= 95) return 1;
    return 0;
  };

  const getOxygenScore = (ox: boolean): number => (ox ? 2 : 0);

  const getBpScore = (bp: number): number => {
    if (bp <= 90) return 3;
    if (bp <= 100) return 2;
    if (bp <= 110) return 1;
    if (bp <= 219) return 0;
    return 3;
  };

  const getPulseScore = (p: number): number => {
    if (p <= 40) return 3;
    if (p <= 50) return 1;
    if (p <= 90) return 0;
    if (p <= 110) return 1;
    if (p <= 130) return 2;
    return 3;
  };

  const getConsciousnessScore = (c: 'A' | 'V' | 'P' | 'U'): number => (c === 'A' ? 0 : 3);

  const getTempScore = (t: number): number => {
    if (t <= 35.0) return 3;
    if (t <= 36.0) return 1;
    if (t <= 38.0) return 0;
    if (t <= 39.0) return 1;
    return 2;
  };

  const totalScore =
    getRespScore(respRate) +
    getSpO2Score(spO2) +
    getOxygenScore(onOxygen) +
    getBpScore(systolicBp) +
    getPulseScore(pulseRate) +
    getConsciousnessScore(consciousness) +
    getTempScore(temperature);

  const getRiskAssessment = (score: number) => {
    if (score >= 7) {
      return {
        level: 'HIGH CLINICAL RISK (SEVERE SEPSIS / MET TRIGGER)',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.2)',
        response: 'Emergency ICU / Medical Emergency Team (MET) response within 10 minutes. Continuous hemodynamic monitoring required.'
      };
    }
    if (score >= 5) {
      return {
        level: 'MEDIUM CLINICAL RISK (URGENT REVIEW)',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.2)',
        response: 'Urgent review by Ward Doctor / RMO within 30 minutes. Increase observation frequency to 1 hour.'
      };
    }
    return {
      level: 'LOW CLINICAL RISK (WARD STABLE)',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.2)',
      response: 'Routine ward nursing observations every 4 to 12 hours.'
    };
  };

  const risk = getRiskAssessment(totalScore);

  const handleDispatchMetCall = () => {
    hospitalEventBus.publish(
      'EMERGENCY_TRIAGE_ALERT',
      'NEWS2ClinicalMonitor',
      {
        severity: 'RED',
        patientName: currentPatient.name,
        uhid: currentPatient.uhid,
        bedNumber: currentPatient.bedNumber,
        score: totalScore
      },
      `🚨 MET Sepsis Code RED: Bed ${currentPatient.bedNumber || 'Ward'} (${currentPatient.name}) NEWS2 Score = ${totalScore}`
    );
    setDispatchAlertTriggered(true);
    setTimeout(() => setDispatchAlertTriggered(false), 5000);
  };

  if (isMinimized) {
    return (
      <aside
        role="button"
        tabIndex={0}
        aria-label="Restore NEWS2 Clinical Alert"
        onClick={() => setIsMinimized(false)}
        className="ds-minimized-dock-pill ds-spring-press"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: `1.5px solid ${risk.color}`,
          borderRadius: '9999px',
          boxShadow: `0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px ${risk.bg}`,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(20px)',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>🧠</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
          NEWS2 Alert ({risk.level.split(' ')[0]}) — Click to Restore
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0 4px'
          }}
        >
          ✕
        </button>
      </aside>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: isMaximized ? 'stretch' : 'center',
        justifyContent: isMaximized ? 'stretch' : 'center',
        padding: isMaximized ? 0 : '16px'
      }}
    >
      <div
        style={{
          width: isMaximized ? '100vw' : '780px',
          maxWidth: '100%',
          height: isMaximized ? '100vh' : 'auto',
          maxHeight: isMaximized ? '100vh' : '94vh',
          backgroundColor: '#0F172A',
          border: isMaximized ? 'none' : `2px solid ${risk.color}`,
          borderRadius: isMaximized ? 0 : '16px',
          boxShadow: `0 24px 64px rgba(0,0,0,0.8)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Top Header */}
        <div
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          title="Double click to toggle Maximize / Restore"
          style={{
            padding: '16px 20px',
            backgroundColor: '#1E293B',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🧠</span>
            <div>
              <strong style={{ color: '#F8FAFC', fontSize: '1rem' }}>
                Automated NEWS2 Sepsis & Clinical Deterioration Engine
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Royal College of Physicians Standard • Bedside Early Warning Protocol
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              aria-label="Minimize to dock pill"
              title="Minimize to dock pill (—)"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              —
            </button>
            <button
              type="button"
              aria-label={isMaximized ? "Restore down" : "Maximize full screen"}
              title={isMaximized ? "Restore down (🗗)" : "Maximize full screen (⛶)"}
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized(!isMaximized);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              {isMaximized ? '🗗' : '⛶'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Patient Demographic Banner */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#0B1120',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#CBD5E1'
          }}
        >
          <div>
            Patient: <strong style={{ color: '#38BDF8' }}>{currentPatient.name}</strong> ({currentPatient.uhid})
          </div>
          <div>
            Location: <strong style={{ color: '#34D399' }}>{currentPatient.bedNumber || 'ICU-04'}</strong> ({currentPatient.wardName})
          </div>
          <div>
            Doctor: <strong style={{ color: '#FBBF24' }}>{currentPatient.doctorName}</strong>
          </div>
        </div>

        {/* Modal Body: Vitals Matrix & Real-Time Score Meter */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Top Score Dial Box */}
          <div
            style={{
              backgroundColor: risk.bg,
              border: `1.5px solid ${risk.color}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: risk.color,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 900
                }}
              >
                {totalScore}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: risk.color, textTransform: 'uppercase' }}>
                  {risk.level}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#F8FAFC', marginTop: '4px', maxWidth: '440px' }}>
                  {risk.response}
                </div>
              </div>
            </div>

            {totalScore >= 7 && (
              <button
                type="button"
                onClick={handleDispatchMetCall}
                style={{
                  backgroundColor: '#DC2626',
                  border: '1.5px solid #F87171',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(220, 38, 38, 0.5)',
                  animation: 'pulse 1.5s infinite'
                }}
              >
                🚨 Trigger MET Sepsis Code RED
              </button>
            )}
          </div>

          {dispatchAlertTriggered && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10B981',
                color: '#6EE7B7',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                textAlign: 'center'
              }}
            >
              ✓ Emergency Medical Emergency Team (MET) & ICU On-Call RMO Alert Dispatched via Event Bus!
            </div>
          )}

          {/* Interactive Vitals Inputs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}
          >
            {/* 1. Respiration Rate */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                <span>RESPIRATION RATE</span>
                <span style={{ color: getRespScore(respRate) > 0 ? '#F87171' : '#34D399', fontWeight: 700 }}>
                  +{getRespScore(respRate)} pts
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="number"
                  value={respRate}
                  onChange={(e) => setRespRate(Number(e.target.value))}
                  style={{ width: '80px', padding: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '4px', fontSize: '1rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>breaths/min (Norm: 12-20)</span>
              </div>
            </div>

            {/* 2. SpO2 */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                <span>SpO2 OXYGEN SATURATION</span>
                <span style={{ color: getSpO2Score(spO2) > 0 ? '#F87171' : '#34D399', fontWeight: 700 }}>
                  +{getSpO2Score(spO2)} pts
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="number"
                  value={spO2}
                  onChange={(e) => setSpO2(Number(e.target.value))}
                  style={{ width: '80px', padding: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '4px', fontSize: '1rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>% (Norm: &ge;96%)</span>
              </div>
            </div>

            {/* 3. Supplemental Oxygen */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                <span>AIR OR OXYGEN THERAPY</span>
                <span style={{ color: onOxygen ? '#F87171' : '#34D399', fontWeight: 700 }}>
                  +{getOxygenScore(onOxygen)} pts
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setOnOxygen(false)}
                  style={{ flex: 1, padding: '6px', backgroundColor: !onOxygen ? '#0284C7' : '#0F172A', color: '#FFF', border: '1px solid #334155', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Room Air (0 pts)
                </button>
                <button
                  type="button"
                  onClick={() => setOnOxygen(true)}
                  style={{ flex: 1, padding: '6px', backgroundColor: onOxygen ? '#EF4444' : '#0F172A', color: '#FFF', border: '1px solid #334155', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Supplemental O2 (+2 pts)
                </button>
              </div>
            </div>

            {/* 4. Systolic Blood Pressure */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                <span>SYSTOLIC BLOOD PRESSURE</span>
                <span style={{ color: getBpScore(systolicBp) > 0 ? '#F87171' : '#34D399', fontWeight: 700 }}>
                  +{getBpScore(systolicBp)} pts
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(Number(e.target.value))}
                  style={{ width: '80px', padding: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '4px', fontSize: '1rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>mmHg (Norm: 111-219)</span>
              </div>
            </div>

            {/* 5. Heart Rate */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                <span>HEART / PULSE RATE</span>
                <span style={{ color: getPulseScore(pulseRate) > 0 ? '#F87171' : '#34D399', fontWeight: 700 }}>
                  +{getPulseScore(pulseRate)} pts
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="number"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(Number(e.target.value))}
                  style={{ width: '80px', padding: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '4px', fontSize: '1rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>bpm (Norm: 51-90)</span>
              </div>
            </div>

            {/* 6. Consciousness (AVPU) */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                <span>CONSCIOUSNESS (AVPU)</span>
                <span style={{ color: getConsciousnessScore(consciousness) > 0 ? '#F87171' : '#34D399', fontWeight: 700 }}>
                  +{getConsciousnessScore(consciousness)} pts
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {(['A', 'V', 'P', 'U'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConsciousness(level)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      backgroundColor: consciousness === level ? (level === 'A' ? '#10B981' : '#EF4444') : '#0F172A',
                      color: '#FFF',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {level === 'A' ? 'Alert' : level === 'V' ? 'Voice' : level === 'P' ? 'Pain' : 'Unresp'}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Body Temperature */}
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                <span>BODY TEMPERATURE</span>
                <span style={{ color: getTempScore(temperature) > 0 ? '#F87171' : '#34D399', fontWeight: 700 }}>
                  +{getTempScore(temperature)} pts
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  style={{ width: '80px', padding: '6px', backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', borderRadius: '4px', fontSize: '1rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>°C (Norm: 36.1 - 38.0)</span>
              </div>
            </div>
          </div>

          {/* Sepsis-6 Clinical Resuscitation Protocol Checklist */}
          {totalScore >= 5 && (
            <div
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                padding: '12px 16px'
              }}
            >
              <strong style={{ color: '#FCD34D', fontSize: '0.85rem' }}>
                ⚡ Sepsis-6 Resuscitation Protocol (Deliver within 1 Hour):
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: '#E2E8F0' }}>
                <div>☑ 1. Give high-flow oxygen (Target SpO2 94-98%)</div>
                <div>☑ 2. Take blood cultures before antibiotics</div>
                <div>☑ 3. Administer IV broad-spectrum antibiotics</div>
                <div>☑ 4. Give IV fluid resuscitation (30ml/kg)</div>
                <div>☑ 5. Check serum lactate & full blood count</div>
                <div>☑ 6. Monitor hourly urine output via catheter</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#1E293B',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            NABH Clinical Safety Parameter • All alerts logged into patient longitudinal EMR
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#0284C7',
              border: 'none',
              color: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Save Vitals & Close
          </button>
        </div>
      </div>
    </div>
  );
};
