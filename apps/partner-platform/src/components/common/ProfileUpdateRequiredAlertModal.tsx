import React from 'react';
import { openPartnerProfileSettings, type MissingProfileField } from '../../utils/partnerProfileGuard.js';

export interface ProfileUpdateRequiredAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedActionName?: string;
  missingFields?: MissingProfileField[];
  onOpenSettings?: (initialTab?: 'ADDRESS' | 'KYC' | 'CERTIFICATES' | 'BANK') => void;
}

export const ProfileUpdateRequiredAlertModal: React.FC<ProfileUpdateRequiredAlertModalProps> = ({
  isOpen,
  onClose,
  blockedActionName = 'Bill Print / Report Generation',
  missingFields = [],
  onOpenSettings
}) => {
  if (!isOpen) return null;

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
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '2px solid #F59E0B',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amber Alert Header */}
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.25)',
                border: '1.5px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              ⚠️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#FCD34D' }}>
                Update Your Profile First!
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#CBD5E1' }}>
                कृपया पहले अपना हॉस्पिटल प्रोफ़ाइल पूरा करें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Block Notice */}
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🛑</span>
            <div style={{ fontSize: '0.8125rem', color: '#FCA5A5' }}>
              <strong>Action Blocked:</strong> Cannot generate or print{' '}
              <span style={{ textDecoration: 'underline', color: '#FFFFFF' }}>{blockedActionName}</span> until facility profile is verified.
            </div>
          </div>

          {/* Statutory explanation in Hinglish */}
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.55 }}>
            Statutory Medical Regulations (Clinical Establishments Act & GST Rules) ke anusaar bina Hospital Legal Name, Registration License, aur Complete Address ke koi bhi bill ya lab report print karna strictly prohibited hai.
          </p>

          {/* Missing Fields Checklist */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              📋 Missing Mandatory Details (आवश्यक विवरण):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {missingFields.length > 0 ? (
                missingFields.map((field) => (
                  <div
                    key={field.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#EF4444', fontWeight: 900 }}>✕</span>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>
                          {field.label}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                          {field.labelHindi}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {field.tab} TAB
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    color: '#F87171'
                  }}
                >
                  <span>✕</span> Hospital Legal Name, Registration Number & Address missing.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#070C16',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#94A3B8',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            Cancel / रद्द करें
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              const targetTab = missingFields[0]?.tab || 'ADDRESS';
              if (onOpenSettings) {
                onOpenSettings(targetTab);
              } else {
                openPartnerProfileSettings(targetTab);
              }
            }}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              backgroundColor: '#F59E0B',
              border: 'none',
              color: '#000000',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D97706')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F59E0B')}
          >
            <span>✏️</span>
            <span>Update Profile Now (अभी प्रोफ़ाइल भरें)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
