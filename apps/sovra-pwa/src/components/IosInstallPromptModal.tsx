// Sovra Apple iOS Visual Onboarding Modal
// Solves Weakness #3 (iOS Safari Restrictions: Web Push blocked & 7-day cache purge in standard browser tabs)
// Provides an iOS-tailored visual guide to Add to Home Screen for lifetime local vault persistence & instant alerts.

import React, { useState, useEffect } from 'react';

interface IosInstallPromptModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

export const IosInstallPromptModal: React.FC<IosInstallPromptModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  forceShow = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isStandalone =
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;

      setIsIosDevice(isIos);

      // Auto-trigger for iOS Safari users who haven't installed yet and haven't dismissed
      const dismissed = localStorage.getItem('sovra_ios_prompt_dismissed') === 'true';
      if ((isIos && !isStandalone && !dismissed) || forceShow) {
        setInternalIsOpen(true);
      }
    }
  }, [forceShow]);

  const isVisible = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleDontShowAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sovra_ios_prompt_dismissed', 'true');
    }
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 16px 0',
        animation: 'fadeInMsg 0.25s ease'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
          border: '1px solid #334155',
          borderTop: '2px solid #14B8A6',
          borderRadius: '24px 24px 16px 16px',
          width: '100%',
          maxWidth: '460px',
          padding: '24px 20px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)',
          color: '#F8FAFC',
          margin: '0 12px',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Handle */}
        <div style={{ width: '36px', height: '4px', background: '#475569', borderRadius: '2px', margin: '0 auto 16px auto' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.4)'
              }}
            >
              🍎
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#5EEAD4', letterSpacing: '-0.01em' }}>
                Install Sovra on iPhone / iPad
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Activate Doctor Push Alerts & Offline Vault
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#CBD5E1',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Why Apple iOS Requires This Banner */}
        <div
          style={{
            background: 'rgba(15, 118, 110, 0.18)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: '12px',
            padding: '10px 12px',
            fontSize: '11px',
            color: '#CCFBF1',
            lineHeight: 1.4,
            marginBottom: '16px'
          }}
        >
          <strong>Apple iOS Requirement:</strong> On iPhone, Web Push notifications only work after adding the app to your Home Screen. This also protects your prescriptions from Apple's 7-day browser cache deletion.
        </div>

        {/* 3-Step Visual Animation Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Step 1 */}
          <div
            style={{
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
                color: '#38BDF8'
              }}
            >
              ⎋
            </div>
            <div style={{ flex: 1, fontSize: '12px', color: '#E2E8F0', lineHeight: 1.3 }}>
              <strong>Step 1:</strong> Tap the <strong>Share button</strong> in your Safari bottom navigation bar.
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
                color: '#34D399'
              }}
            >
              ➕
            </div>
            <div style={{ flex: 1, fontSize: '12px', color: '#E2E8F0', lineHeight: 1.3 }}>
              <strong>Step 2:</strong> Scroll down the action sheet and select <strong>"Add to Home Screen"</strong>.
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
                color: '#FBBF24',
                fontWeight: 800
              }}
            >
              Add
            </div>
            <div style={{ flex: 1, fontSize: '12px', color: '#E2E8F0', lineHeight: 1.3 }}>
              <strong>Step 3:</strong> Tap <strong>"Add"</strong> in the top-right corner. Sovra will appear as a standalone app!
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDontShowAgain}
            style={{
              flex: 1,
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#94A3B8',
              padding: '10px',
              borderRadius: '10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Don't Show Again
          </button>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              background: '#0F766E',
              border: 'none',
              color: '#FFFFFF',
              padding: '10px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.4)'
            }}
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
