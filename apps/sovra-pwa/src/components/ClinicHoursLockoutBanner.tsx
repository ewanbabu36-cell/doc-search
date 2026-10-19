// Sovra Doctor Medico-Legal Shield & OPD Clinic Hours Lockout
// Solves Weakness #4 (Doctor 2:00 AM Emergency Liability & Patient Miscommunication)
// Enforces OPD consulting hours (9:00 AM - 8:00 PM) with 1-click 108 Emergency Dialing & Legal Disclaimers.

import React, { useState, useEffect } from 'react';
import { UserRole } from '../types.js';

interface ClinicHoursLockoutBannerProps {
  currentUserRole: UserRole;
  startHour?: number; // default 9 (9 AM)
  endHour?: number;   // default 20 (8 PM)
  onLockStatusChange?: (isLocked: boolean) => void;
  hospitalEmergencyPhone?: string;
}

export const ClinicHoursLockoutBanner: React.FC<ClinicHoursLockoutBannerProps> = ({
  currentUserRole,
  startHour = 9,
  endHour = 20,
  onLockStatusChange,
  hospitalEmergencyPhone = '+91 1800-DOC-EMRG'
}) => {
  const [isWithinHours, setIsWithinHours] = useState(true);
  const [doctorOverride, setDoctorOverride] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  const checkClinicHours = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const isWorkingHours = currentHour >= startHour && currentHour < endHour;

    setIsWithinHours(isWorkingHours);
    setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    const isPatient = currentUserRole === 'PATIENT';
    const isLocked = isPatient && !isWorkingHours;
    if (onLockStatusChange) {
      onLockStatusChange(isLocked && !doctorOverride);
    }
  };

  useEffect(() => {
    checkClinicHours();
    const interval = setInterval(checkClinicHours, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentUserRole, startHour, endHour, doctorOverride]);

  // If currently within clinic hours and no override is needed
  if (isWithinHours) {
    return (
      <div
        style={{
          background: 'rgba(15, 118, 110, 0.15)',
          borderBottom: '1px solid rgba(20, 184, 166, 0.25)',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#5EEAD4'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          <span><strong>OPD Clinic Open:</strong> Consultations monitored (09:00 AM – 08:00 PM)</span>
        </div>
        <span style={{ color: '#94A3B8', fontSize: '10px' }}>Active • {currentTimeStr}</span>
      </div>
    );
  }

  // Clinic is CLOSED (Night / Off-Hours)
  const isDoctor = currentUserRole === 'DOCTOR' || currentUserRole === 'ADMIN';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #450A0A 0%, #7F1D1D 100%)',
        borderBottom: '2px solid #EF4444',
        padding: '12px 16px',
        color: '#FEE2E2',
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
        animation: 'fadeInMsg 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>🚨</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
              MEDICO-LEGAL EMERGENCY NOTICE — OPD CLINIC CLOSED
            </div>
            <div style={{ fontSize: '11px', color: '#FECACA', marginTop: '3px', lineHeight: 1.4 }}>
              Regular doctor consultation hours are <strong>09:00 AM – 08:00 PM</strong>. Direct chat is <strong>NOT monitored for life-threatening emergencies</strong>. If experiencing chest pain, acute shortness of breath, severe trauma, or loss of consciousness, do NOT wait for chat replies.
            </div>
          </div>
        </div>

        {/* Doctor Override Toggle if logged in as Doctor */}
        {isDoctor && (
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <button
              onClick={() => {
                const nextState = !doctorOverride;
                setDoctorOverride(nextState);
                if (onLockStatusChange) onLockStatusChange(false);
              }}
              style={{
                background: doctorOverride ? '#10B981' : '#374151',
                color: '#FFFFFF',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {doctorOverride ? '🔓 Doctor Override: ON' : '🔒 Doctor Override: OFF'}
            </button>
          </div>
        )}
      </div>

      {/* Emergency Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
        <a
          href="tel:108"
          style={{
            background: '#EF4444',
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          <span>🚑</span>
          <span>Dial 108 (National Ambulance)</span>
        </a>

        <a
          href={`tel:${hospitalEmergencyPhone}`}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🏥</span>
          <span>Hospital 24x7 ER Desk</span>
        </a>
      </div>
    </div>
  );
};
