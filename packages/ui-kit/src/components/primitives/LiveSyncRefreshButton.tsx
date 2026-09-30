import React, { useState, useEffect } from 'react';

export interface LiveSyncRefreshButtonProps {
  onRefresh?: () => void | Promise<void>;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  compact?: boolean;
}

export const LiveSyncRefreshButton: React.FC<LiveSyncRefreshButtonProps> = ({
  onRefresh,
  className,
  style,
  label = 'Live Sync',
  compact = false
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [timeAgoText, setTimeAgoText] = useState('just now');

  // Update time ago string periodically
  useEffect(() => {
    const updateTimeAgo = () => {
      const diffSec = Math.floor((Date.now() - lastSyncTime) / 1000);
      if (diffSec < 10) {
        setTimeAgoText('just now');
      } else if (diffSec < 60) {
        setTimeAgoText(`${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setTimeAgoText(`${diffMin}m ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      updateTimeAgo();
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Global hotkey: Shift + R to trigger live sync
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        handleTriggerSync();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRefresh]);

  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    // 1. Dispatch global custom event for all listening components
    window.dispatchEvent(
      new CustomEvent('docsearch:manual_refresh', {
        detail: { timestamp: Date.now() }
      })
    );

    // 2. Call custom onRefresh if provided
    if (onRefresh) {
      try {
        await Promise.resolve(onRefresh());
      } catch (e) {
        console.warn('Live sync error:', e);
      }
    }

    // Keep spin active for at least 600ms for visual responsiveness
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(Date.now());
      setTimeAgoText('just now');
    }, 600);
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleTriggerSync}
      disabled={isSyncing}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '4px 8px' : '4px 10px',
        backgroundColor: isSyncing ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.05)',
        border: isSyncing ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        color: isSyncing ? '#34D399' : '#CBD5E1',
        fontSize: '0.75rem',
        fontWeight: 700,
        cursor: isSyncing ? 'wait' : 'pointer',
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!isSyncing) {
          e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
          e.currentTarget.style.color = '#38BDF8';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSyncing) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.color = '#CBD5E1';
        }
      }}
      title={`Live Data Sync (Shift+R) • Last synced: ${timeAgoText} • Click to refresh data`}
    >
      <style>{`
        @keyframes dsSyncSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dsSyncPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      {/* Rotating Sync Icon */}
      <span
        style={{
          display: 'inline-block',
          fontSize: '0.8125rem',
          lineHeight: 1,
          animation: isSyncing ? 'dsSyncSpin 0.7s infinite linear' : 'none'
        }}
      >
        🔄
      </span>

      {/* Label and Time Ago */}
      {!compact && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>{isSyncing ? 'Syncing...' : label}</span>
          {!isSyncing && (
            <span
              style={{
                fontSize: '0.65rem',
                color: '#64748B',
                fontWeight: 500
              }}
            >
              • {timeAgoText}
            </span>
          )}
        </span>
      )}

      {/* Online Beacon */}
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          boxShadow: '0 0 6px #10B981',
          animation: 'dsSyncPulse 2s infinite ease-in-out'
        }}
      />
    </button>
  );
};
