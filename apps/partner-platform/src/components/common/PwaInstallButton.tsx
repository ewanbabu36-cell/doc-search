import React, { useState } from 'react';
import { usePwa } from '../../hooks/usePwa.js';

export const PwaInstallButton: React.FC = () => {
  const {
    isStandalone,
    isOnline,
    outboxCount,
    isOutboxSyncing,
    hasUpdateAvailable,
    installApp,
    updateApp
  } = usePwa();

  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const res = await installApp();
      if (res === 'unavailable') {
        // Fallback for browsers that require menu install (e.g. desktop Chrome / Edge / Safari)
        alert(
          'To install DOC SEARCH on your device:\n\n' +
          '• Chrome / Edge: Click the (⊕) or install icon in your browser address bar at the top right.\n' +
          '• Safari / iOS: Tap Share (box with arrow) -> "Add to Home Screen".\n' +
          '• Android: Tap browser menu (⋮) -> "Install App" or "Add to Home screen".'
        );
      }
    } finally {
      setInstalling(false);
    }
  };

  // 1. If a new Service Worker update is ready
  if (hasUpdateAvailable) {
    return (
      <button
        type="button"
        onClick={updateApp}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '8px',
          backgroundColor: 'rgba(56, 189, 248, 0.2)',
          border: '1px solid #38bdf8',
          color: '#38bdf8',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          animation: 'pulse 1.5s infinite'
        }}
        title="New version available. Click to refresh instantly."
      >
        <span>🔄</span>
        <span>Update Ready</span>
      </button>
    );
  }

  // 2. If Offline or Outbox has items
  if (!isOnline || outboxCount > 0) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '8px',
          backgroundColor: isOnline ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.2)',
          border: isOnline ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(239, 68, 68, 0.5)',
          color: isOnline ? '#facc15' : '#f87171',
          fontSize: '0.75rem',
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif'
        }}
        title={
          isOnline
            ? `${outboxCount} changes pending cloud sync`
            : `Working offline. All changes safely queued in local outbox.`
        }
      >
        <span>{isOnline ? (isOutboxSyncing ? '⚡' : '🟡') : '📡'}</span>
        <span>
          {isOnline
            ? isOutboxSyncing
              ? `Syncing (${outboxCount})...`
              : `Outbox (${outboxCount})`
            : `Offline (${outboxCount} Queued)`}
        </span>
      </div>
    );
  }

  // 3. If running in standalone app mode
  if (isStandalone) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '6px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '0.6875rem',
          fontWeight: 600,
          userSelect: 'none'
        }}
        title="Running in Standalone Native PWA App Mode with 0ms boot"
      >
        <span>⚡</span>
        <span className="ds-hide-on-compact">App Mode</span>
      </div>
    );
  }

  // 4. Default in browser tab: Offer 1-Click Installation
  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={installing}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '8px',
        backgroundColor: 'rgba(14, 165, 233, 0.18)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        color: '#38bdf8',
        fontSize: '0.75rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#0284c7';
        e.currentTarget.style.color = '#ffffff';
        e.currentTarget.style.borderColor = '#38bdf8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.18)';
        e.currentTarget.style.color = '#38bdf8';
        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      }}
      title="Install DOC SEARCH as a desktop / mobile app for 1-click launch and offline resilience"
    >
      <span>📲</span>
      <span>{installing ? 'Installing...' : 'Install App'}</span>
    </button>
  );
};
