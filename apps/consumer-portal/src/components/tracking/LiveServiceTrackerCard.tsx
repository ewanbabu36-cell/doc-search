import React, { useState } from 'react';

export type ServiceTrackerMode = 'OPD_QUEUE' | 'HOME_PHLEBOTOMY';

export interface OpdQueueStepDetails {
  tokenNumber: string;
  runningTokenNumber: string;
  doctorName: string;
  department: string;
  chamberNumber: string;
  currentStepIndex: number; // 0 to 3
  vitalsSummary?: string;
  estimatedWaitMinutes: number;
}

export interface PhlebotomyStepDetails {
  orderId: string;
  testsList: string[];
  riderName: string;
  riderPhone: string;
  currentStepIndex: number; // 0 to 3
  estimatedArrivalMinutes: number;
  coldChainTemperatureC: number;
  barcodeTubeId?: string;
}

export interface LiveServiceTrackerCardProps {
  initialMode?: ServiceTrackerMode;
  opdDetails?: OpdQueueStepDetails;
  phlebotomyDetails?: PhlebotomyStepDetails;
  onAlertDelay?: (minutes: number) => void;
  onCallRider?: (phone: string) => void;
  isDarkMode?: boolean;
}

export const LiveServiceTrackerCard: React.FC<LiveServiceTrackerCardProps> = ({
  initialMode = 'OPD_QUEUE',
  opdDetails = {
    tokenNumber: '#18',
    runningTokenNumber: '#14',
    doctorName: 'Dr. Vivek Sharma',
    department: 'General Surgery & OPD',
    chamberNumber: 'Chamber 04 (1st Floor)',
    currentStepIndex: 2,
    vitalsSummary: 'BP 124/82 mmHg • Pulse 74 bpm • SpO2 99%',
    estimatedWaitMinutes: 12
  },
  phlebotomyDetails = {
    orderId: 'HCO-2026-881',
    testsList: ['Complete Blood Count (CBC)', 'HbA1c & Fasting Glucose', 'Lipid Profile (6 Parameters)'],
    riderName: 'Amit Kumar',
    riderPhone: '+91 98765 43210',
    currentStepIndex: 1,
    estimatedArrivalMinutes: 18,
    coldChainTemperatureC: 3.8,
    barcodeTubeId: 'BAR-EDTA-882194'
  },
  onAlertDelay,
  onCallRider,
  isDarkMode = true
}) => {
  const [activeMode, setActiveMode] = useState<ServiceTrackerMode>(initialMode);
  const [showDelayDropdown, setShowDelayDropdown] = useState(false);

  const opdSteps = [
    { title: 'Token Booked', desc: 'Pre-arrival registration confirmed' },
    { title: 'Triage & Vitals', desc: opdDetails.vitalsSummary || 'Recorded at Nurse Station' },
    { title: 'In Doctor Queue', desc: `Current: ${opdDetails.runningTokenNumber} ➔ Your: ${opdDetails.tokenNumber}` },
    { title: 'Consultation Active', desc: `In ${opdDetails.chamberNumber}` }
  ];

  const phlebotomySteps = [
    { title: 'Rider Assigned', desc: `${phlebotomyDetails.riderName} dispatched with sterile kit` },
    { title: 'Out for Collection', desc: `Estimated arrival in ~${phlebotomyDetails.estimatedArrivalMinutes} mins` },
    { title: 'At Doorstep', desc: 'Barcoded vacutainers ready for venous draw' },
    { title: 'Cold-Chain Secure', desc: `Temp ${phlebotomyDetails.coldChainTemperatureC}°C (Target 2-8°C)` }
  ];

  const currentSteps = activeMode === 'OPD_QUEUE' ? opdSteps : phlebotomySteps;
  const currentStepIdx = activeMode === 'OPD_QUEUE' ? opdDetails.currentStepIndex : phlebotomyDetails.currentStepIndex;

  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  return (
    <div
      role="region"
      aria-label="Real Time Service and Delivery Stepper"
      style={{
        background: isDarkMode ? '#1E293B' : '#FFFFFF',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
        borderRadius: '24px',
        padding: '20px',
        color: textColor,
        boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 8px 24px rgba(0, 0, 0, 0.06)',
        margin: '8px 0'
      }}
    >
      {/* Mode Switcher Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveMode('OPD_QUEUE')}
            style={{
              background: activeMode === 'OPD_QUEUE' ? '#4F46E5' : isDarkMode ? '#0F172A' : '#F1F5F9',
              color: activeMode === 'OPD_QUEUE' ? '#FFFFFF' : subTextColor,
              border: 'none',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🩺 Live OPD Chamber
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('HOME_PHLEBOTOMY')}
            style={{
              background: activeMode === 'HOME_PHLEBOTOMY' ? '#06B6D4' : isDarkMode ? '#0F172A' : '#F1F5F9',
              color: activeMode === 'HOME_PHLEBOTOMY' ? '#FFFFFF' : subTextColor,
              border: 'none',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🧪 Home Blood Draw
          </button>
        </div>

        {/* Live Pulse Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px #10B981',
              display: 'inline-block'
            }}
          />
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#10B981' }}>
            REAL-TIME
          </span>
        </div>
      </div>

      {/* Mode Context Info Banner */}
      {activeMode === 'OPD_QUEUE' ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: textColor }}>
              {opdDetails.doctorName}
            </div>
            <div style={{ fontSize: '0.75rem', color: subTextColor }}>
              {opdDetails.department} • <strong>{opdDetails.chamberNumber}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                color: '#818CF8',
                padding: '4px 10px',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 900
              }}
            >
              Token: {opdDetails.tokenNumber}
            </span>
            <div style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 800, marginTop: '4px' }}>
              ~{opdDetails.estimatedWaitMinutes} mins wait
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: textColor }}>
              Phlebotomist: {phlebotomyDetails.riderName}
            </div>
            <div style={{ fontSize: '0.75rem', color: subTextColor }}>
              Order #{phlebotomyDetails.orderId} • {phlebotomyDetails.testsList.length} Tests
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: '#06B6D4',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              ❄️ {phlebotomyDetails.coldChainTemperatureC}°C
            </span>
            {onCallRider && (
              <button
                type="button"
                onClick={() => onCallRider(phlebotomyDetails.riderPhone)}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                📞 Call
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4-Step Animated Stepper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
        {currentSteps.map((step, idx) => {
          const isDone = idx < currentStepIdx;
          const isCurrent = idx === currentStepIdx;

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
              {/* Vertical connecting line (for non-last items) */}
              {idx < currentSteps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '24px',
                    left: '11px',
                    width: '2px',
                    height: '24px',
                    backgroundColor: isDone ? '#10B981' : isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                    zIndex: 1
                  }}
                />
              )}

              {/* Step Circle Indicator */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isDone
                    ? '#10B981'
                    : isCurrent
                      ? '#4F46E5'
                      : isDarkMode ? '#0F172A' : '#F1F5F9',
                  border: isCurrent
                    ? '2px solid #818CF8'
                    : isDone
                      ? 'none'
                      : isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #CBD5E1',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  flexShrink: 0,
                  boxShadow: isCurrent ? '0 0 10px rgba(99, 102, 241, 0.6)' : 'none'
                }}
              >
                {isDone ? '✓' : idx + 1}
              </div>

              {/* Step Text Details */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    color: isCurrent ? (isDarkMode ? '#818CF8' : '#4F46E5') : isDone ? textColor : subTextColor
                  }}
                >
                  {step.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '2px' }}>
                  {step.desc}
                </div>
              </div>

              {/* Current Step Active Pill */}
              {isCurrent && (
                <span
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF',
                    color: isDarkMode ? '#818CF8' : '#4F46E5',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '8px'
                  }}
                >
                  IN PROGRESS
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* OPD Queue "Delay Alert" Action */}
      {activeMode === 'OPD_QUEUE' && onAlertDelay && (
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: subTextColor }}>
              Running late? Inform doctor so your slot isn't cancelled:
            </span>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowDelayDropdown(!showDelayDropdown)}
                style={{
                  backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
                  color: textColor,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ⏱️ Alert Delay ▼
              </button>

              {showDelayDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: '6px',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '4px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    zIndex: 10
                  }}
                >
                  {[5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        onAlertDelay(mins);
                        setShowDelayDropdown(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: textColor,
                        padding: '6px 12px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + {mins} mins late
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
