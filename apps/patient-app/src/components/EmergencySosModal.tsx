import React from 'react';
import { type Language } from '../i18n.js';

interface Props {
  language: Language;
  onClose: () => void;
}

export const EmergencySosModal: React.FC<Props> = ({ language, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 210,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#0F172A',
          borderRadius: '24px',
          border: '2px solid #EF4444',
          padding: '24px',
          boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)',
          color: '#F8FAFC'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.75rem' }}>🚨</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EF4444' }}>
              {language === 'hi' ? 'आपातकालीन सहायता (SOS)' : 'Emergency Help (SOS)'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginBottom: '20px', lineHeight: 1.4 }}>
          {language === 'hi'
            ? 'अगर मरीज़ को गंभीर सीने में दर्द, सांस लेने में तकलीफ, या बेहोशी है, तो तुरंत नीचे दिए गए नंबर पर कॉल करें:'
            : 'If the patient has severe chest pain, breathing difficulty, or trauma, call immediately:'}
        </p>

        {/* 1-Tap Hospital Casualty Hotline */}
        <a
          href="tel:+919876543210"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            textDecoration: 'none',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '12px',
            fontWeight: 800,
            fontSize: '1.0625rem',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>📞</span>
            <div>
              <div>{language === 'hi' ? 'हॉस्पिटल कैज़ुअल्टी डेस्क' : 'Hospital Casualty Desk'}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>+91 98765 43210 (24x7)</div>
            </div>
          </div>
          <span style={{ fontSize: '1.25rem' }}>➔</span>
        </a>

        {/* National Ambulance 108 */}
        <a
          href="tel:108"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#F8FAFC',
            textDecoration: 'none',
            borderRadius: '16px',
            padding: '14px 20px',
            marginBottom: '20px',
            fontWeight: 700,
            fontSize: '0.9375rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.25rem' }}>🚑</span>
            <div>
              <div>{language === 'hi' ? 'राष्ट्रीय एम्बुलेंस सेवा' : 'National Ambulance'}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>डायल 108 (टोल-फ्री)</div>
            </div>
          </div>
          <span style={{ color: '#38BDF8' }}>Call 108</span>
        </a>

        {/* Hospital Address */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '12px', fontSize: '0.75rem', color: '#94A3B8' }}>
          📍 <strong>Apex Care Superspeciality Hospital</strong><br />
          Plot 4B, Vibhuti Khand, Gomti Nagar, Lucknow (Emergency Gate 1)
        </div>
      </div>
    </div>
  );
};
