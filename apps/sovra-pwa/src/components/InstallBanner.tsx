// Sovra 1-Click PWA Install Banner ('Add to Home Screen')

import React, { useState, useEffect } from 'react';

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone PWA window
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[Sovra PWA] beforeinstallprompt captured, ready for 1-click install');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        'To install Sovra PWA on your device:\n' +
        '• On Android Chrome: Tap Menu (⋮) → "Install app" or "Add to Home Screen"\n' +
        '• On iOS Safari: Tap Share (⎋) → "Add to Home Screen"\n' +
        '• On Desktop Chrome/Edge: Click the Install icon in the browser address bar'
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[Sovra PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
  };

  if (dismissed) return null;

  if (isStandalone) {
    return (
      <div
        style={{
          background: 'rgba(15, 118, 110, 0.2)',
          borderBottom: '1px solid rgba(15, 118, 110, 0.4)',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#5EEAD4'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⚡</span>
          <span><strong>Sovra PWA Standalone Mode Active</strong> — 100% Free Lifetime Offline Cache Enabled</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '13px' }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="install-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="/icon.svg"
          alt="Sovra"
          style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0F766E' }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.2 }}>
            Install Sovra Healthcare Messenger
          </div>
          <div style={{ fontSize: '11px', color: '#CCFBF1', opacity: 0.9 }}>
            Add to Home Screen for 0ms offline access, doctor alerts & read receipts
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleInstallClick}
          style={{
            background: '#FFFFFF',
            color: '#0F766E',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          📲 Install PWA
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#CCFBF1',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '2px 6px'
          }}
          title="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
