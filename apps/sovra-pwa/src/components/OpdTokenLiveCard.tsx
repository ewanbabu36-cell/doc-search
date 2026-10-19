// Sovra OPD Live Queue Token Hook Component
// Solves Weakness #1 (User Adoption Friction / WhatsApp Habit)
// Gives patients an irresistible immediate hook: tracking their live queue token & estimated wait time

import React, { useState, useEffect } from 'react';
import { i18n } from '../services/i18n.js';

export interface OpdTokenData {
  tokenNumber: number;
  currentlyServing: number;
  doctorName: string;
  specialty: string;
  roomNumber: string;
  department: string;
  estimatedWaitMinutes: number;
  patientName: string;
  uhid: string;
}

interface OpdTokenLiveCardProps {
  initialToken?: Partial<OpdTokenData>;
  onDismiss?: () => void;
  onInstallClick?: () => void;
}

export const OpdTokenLiveCard: React.FC<OpdTokenLiveCardProps> = ({
  initialToken,
  onDismiss,
  onInstallClick
}) => {
  const [token, setToken] = useState<OpdTokenData>({
    tokenNumber: initialToken?.tokenNumber || 18,
    currentlyServing: initialToken?.currentlyServing || 14,
    doctorName: initialToken?.doctorName || 'Dr. Ramesh Sharma, MD',
    specialty: initialToken?.specialty || 'Cardiology OPD',
    roomNumber: initialToken?.roomNumber || 'Room 204 (2nd Floor)',
    department: initialToken?.department || 'Outpatient Consultation Suite',
    estimatedWaitMinutes: initialToken?.estimatedWaitMinutes || 12,
    patientName: initialToken?.patientName || 'Mohit Kumar',
    uhid: initialToken?.uhid || 'UHID-2026-8819'
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [autoAdvanceToast, setAutoAdvanceToast] = useState<string | null>(null);
  const [, setLang] = useState(i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe((l) => setLang(l));
  }, []);

  // Check URL parameters for direct counter scan: ?token=22&serving=17&room=204
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlServing = params.get('serving');
      const urlDoc = params.get('doctor');
      const urlRoom = params.get('room');

      if (urlToken) {
        const tNum = parseInt(urlToken, 10) || 18;
        const sNum = urlServing ? parseInt(urlServing, 10) : Math.max(1, tNum - 4);
        setToken((prev) => ({
          ...prev,
          tokenNumber: tNum,
          currentlyServing: sNum,
          doctorName: urlDoc || prev.doctorName,
          roomNumber: urlRoom ? `Room ${urlRoom}` : prev.roomNumber,
          estimatedWaitMinutes: Math.max(3, (tNum - sNum) * 3)
        }));
      }
    }
  }, []);

  const tokensAhead = Math.max(0, token.tokenNumber - token.currentlyServing);
  const isMyTurn = token.currentlyServing === token.tokenNumber;
  const hasPassed = token.currentlyServing > token.tokenNumber;

  const handleSimulateNextToken = () => {
    if (hasPassed) return;
    const nextServing = token.currentlyServing + 1;
    setToken((prev) => ({
      ...prev,
      currentlyServing: nextServing,
      estimatedWaitMinutes: Math.max(0, (prev.tokenNumber - nextServing) * 3)
    }));

    if (nextServing === token.tokenNumber) {
      setAutoAdvanceToast('🔔 Ding! It is now your turn! Please proceed to ' + token.roomNumber);
    } else {
      setAutoAdvanceToast(`⚡ Token #${nextServing} called to ${token.roomNumber}`);
    }
    setTimeout(() => setAutoAdvanceToast(null), 3500);
  };

  return (
    <div
      style={{
        background: isMyTurn
          ? 'linear-gradient(135deg, #065F46 0%, #047857 100%)'
          : 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
        border: `1px solid ${isMyTurn ? '#34D399' : '#374151'}`,
        borderRadius: '16px',
        padding: '16px',
        margin: '12px 14px',
        boxShadow: isMyTurn
          ? '0 10px 30px rgba(16, 185, 129, 0.35)'
          : '0 8px 24px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInMsg 0.3s ease'
      }}
    >
      {/* Pulse Beacon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isMyTurn ? '#A7F3D0' : '#10B981',
              boxShadow: '0 0 10px #10B981'
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: isMyTurn ? '#ECFDF5' : '#34D399'
            }}
          >
            {i18n.t('opdQueueTracker')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleSimulateNextToken}
            title="Simulate Next Token Call"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#F8FAFC',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {i18n.t('nextCall')}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: My Token vs Currently Serving */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        {/* Your Token */}
        <div
          style={{
            background: 'rgba(15, 118, 110, 0.2)',
            border: '1px solid rgba(20, 184, 166, 0.4)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '11px', color: '#5EEAD4', fontWeight: 600 }}>{i18n.t('yourToken')}</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
            #{token.tokenNumber}
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
            {token.patientName}
          </div>
        </div>

        {/* Serving Now */}
        <div
          style={{
            background: isMyTurn ? 'rgba(255, 255, 255, 0.2)' : '#1E293B',
            border: `1px solid ${isMyTurn ? '#A7F3D0' : '#475569'}`,
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '11px', color: isMyTurn ? '#ECFDF5' : '#94A3B8', fontWeight: 600 }}>
            {i18n.t('currentlyServing')}
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: isMyTurn ? '#A7F3D0' : '#38BDF8',
              lineHeight: 1.1
            }}
          >
            #{token.currentlyServing}
          </div>
          <div style={{ fontSize: '10px', color: isMyTurn ? '#ECFDF5' : '#38BDF8', marginTop: '4px' }}>
            {isMyTurn ? i18n.t('yourTurnNow') : `${tokensAhead} ${i18n.t('patientsAhead')}`}
          </div>
        </div>
      </div>

      {/* Doctor & Room Info */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '10px 12px',
          borderRadius: '10px',
          fontSize: '12px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{token.doctorName}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{token.specialty}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: '#5EEAD4' }}>{token.roomNumber}</div>
          <div style={{ fontSize: '10px', color: '#FCD34D' }}>
            {isMyTurn ? 'Enter Clinic' : `~${token.estimatedWaitMinutes} mins wait`}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginBottom: '4px' }}>
          <span>Queue Progress</span>
          <span>{isMyTurn ? '100%' : `${Math.min(95, Math.round((token.currentlyServing / token.tokenNumber) * 100))}%`}</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#374151', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(10, (token.currentlyServing / token.tokenNumber) * 100))}%`,
              height: '100%',
              background: isMyTurn ? '#34D399' : 'linear-gradient(90deg, #0F766E, #14B8A6)',
              borderRadius: '9999px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Toast alert */}
      {autoAdvanceToast && (
        <div
          style={{
            background: '#047857',
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '10px',
            animation: 'fadeInMsg 0.2s ease'
          }}
        >
          {autoAdvanceToast}
        </div>
      )}

      {/* Onboarding Hook: 1-Click Install Incentive */}
      <div
        style={{
          background: 'rgba(15, 118, 110, 0.3)',
          border: '1px dashed #14B8A6',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div style={{ fontSize: '11px', color: '#CCFBF1', lineHeight: 1.3 }}>
          {i18n.t('pinTokenPrompt')}
        </div>
        <button
          onClick={onInstallClick || (() => alert('Add to Home Screen clicked! Use browser menu → Install app.'))}
          style={{
            background: '#FFFFFF',
            color: '#0F766E',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {i18n.t('pinTokenButton')}
        </button>
      </div>
    </div>
  );
};
