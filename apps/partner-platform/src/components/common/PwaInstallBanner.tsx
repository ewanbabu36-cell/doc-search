import React, { useState, useEffect } from 'react';
import { usePwa } from '../../hooks/usePwa.js';

export const PwaInstallBanner: React.FC = () => {
  const { isInstallable, isStandalone, isInstalled, installApp } = usePwa();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('docsearch_pwa_banner_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  if (!isInstallable || isStandalone || isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('docsearch_pwa_banner_dismissed', 'true');
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        maxWidth: '540px',
        width: 'calc(100% - 32px)',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#0b0f17',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0
          }}
        >
          🏥
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Install DOC SEARCH App
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Instant 0ms boot &amp; offline resilience
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={installApp}
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
          }}
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 8px',
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
