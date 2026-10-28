import React, { useState, useEffect } from 'react';
import { useHapticSoundFeedback } from '../hooks/useHapticSoundFeedback.js';

export interface IOSLockScreenProps {
  onUnlock: (selectedStaff?: any) => void;
  onOpenTraditionalLogin?: () => void;
  hospitalName?: string;
}

export const IOSLockScreen: React.FC<IOSLockScreenProps> = ({
  onUnlock,
  onOpenTraditionalLogin,
  hospitalName = 'DocSearch Apollo Medical Center',
}) => {
  const [timeStr, setTimeStr] = useState<string>('09:41');
  const [dateStr, setDateStr] = useState<string>('Wednesday, October 28');
  const [isFaceIdScanning, setIsFaceIdScanning] = useState<boolean>(false);
  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInstantUnlock = (staffPreset?: any) => {
    playClick();
    triggerHaptic(30);
    setIsFaceIdScanning(true);
    setTimeout(() => {
      onUnlock(staffPreset);
    }, 450);
  };

  const defaultProfiles = [
    {
      id: 'apollo-cmo',
      name: 'Dr. Apollo',
      role: 'HOSPITAL_EXECUTIVE',
      roleTitle: 'Chief Medical Officer',
      email: 'cmo@apollo.docsearch.internal',
      organizationType: 'HOSPITAL',
      defaultModule: 'clinical-consultation',
    },
    {
      id: 'apollo-nurse',
      name: 'Sister Nancy',
      role: 'HOSPITAL_NURSE',
      roleTitle: 'Head Triage Nurse',
      email: 'nurse@apollo.docsearch.internal',
      organizationType: 'HOSPITAL',
      defaultModule: 'nurse-vitals-triage',
    },
    {
      id: 'apollo-cashier',
      name: 'Cashier Sharma',
      role: 'HOSPITAL_CASHIER',
      roleTitle: 'Billing Cashier',
      email: 'cashier@apollo.docsearch.internal',
      organizationType: 'HOSPITAL',
      defaultModule: 'billing-revenue-cycle',
    },
    {
      id: 'apollo-pharma',
      name: 'Dr. Mehta',
      role: 'HOSPITAL_PHARMACIST',
      roleTitle: 'Chief Pharmacist',
      email: 'pharma@apollo.docsearch.internal',
      organizationType: 'HOSPITAL',
      defaultModule: 'pharmacy-medication',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between py-10 px-6 select-none bg-gradient-to-b from-indigo-950 via-slate-950 to-black text-white pointer-events-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2.5rem 1.5rem',
        background: 'radial-gradient(circle at 50% 10%, #1e1b4b 0%, #09090b 60%, #000000 100%)',
        color: '#ffffff',
        zIndex: 9999,
        overflowY: 'auto',
      }}
    >
      {/* 1. Top Section: Hospital Brand & Lock Icon */}
      <div
        className="flex flex-col items-center gap-2 pt-2"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
      >
        <div
          className="flex items-center gap-2 text-white/80 text-sm font-semibold"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)' }}
        >
          <span style={{ fontSize: '18px' }}>🏥</span>
          <span>{hospitalName}</span>
        </div>

        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {isFaceIdScanning ? (
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid #34d399',
                borderTopColor: 'transparent',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          ) : (
            '🔒'
          )}
        </div>
      </div>

      {/* 2. Center: Large iOS Clock & Date */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          margin: '2rem 0',
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.85)',
            letterSpacing: '0.02em',
            marginBottom: '0.25rem',
          }}
        >
          {dateStr}
        </span>

        <h1
          style={{
            fontSize: 'clamp(4.5rem, 12vw, 8.5rem)',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            margin: '0.5rem 0',
            textShadow: '0 4px 25px rgba(0,0,0,0.8)',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          {timeStr}
        </h1>

        {/* Live Triage Notification Banner */}
        <div
          style={{
            marginTop: '1.5rem',
            maxWidth: '380px',
            width: '100%',
            padding: '12px 16px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            🚨
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Emergency Center</span>
              <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>● Live</span>
            </div>
            <p
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.75)',
                margin: '2px 0 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Triage Level 2 patient arrived in Red Resuscitation Bay
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bottom: Quick Staff Unlock & Traditional Login */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '440px',
          width: '100%',
          gap: '12px',
          paddingBottom: '1rem',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)' }}>
          Select Staff Role to Unlock Workstation
        </span>

        {/* Quick Staff Profile Buttons Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            width: '100%',
          }}
        >
          {defaultProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => handleInstantUnlock(p)}
              style={{
                padding: '10px 14px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                textAlign: 'left',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', color: '#60a5fa' }}>
                {p.name}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>
                {p.roleTitle}
              </span>
            </button>
          ))}
        </div>

        {/* Primary Unlock Button */}
        <button
          onClick={() => handleInstantUnlock(defaultProfiles[0])}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '4px',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span>Tap to Unlock Smartphone OS</span>
          <span>➔</span>
        </button>

        {/* Traditional Credentials Fallback */}
        {onOpenTraditionalLogin && (
          <button
            onClick={() => {
              playClick();
              onOpenTraditionalLogin();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Staff Password Login & Registration
          </button>
        )}
      </div>
    </div>
  );
};
