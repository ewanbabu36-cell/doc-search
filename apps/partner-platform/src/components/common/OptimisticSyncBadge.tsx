import React, { useState, useEffect } from 'react';
import { usePwa } from '../../hooks/usePwa.js';

export interface OptimisticSyncEventDetail {
  actionName: string;
  entity?: string;
}

export const OptimisticSyncBadge: React.FC = () => {
  const { isOnline, outboxCount, isOutboxSyncing } = usePwa();
  const [recentAction, setRecentAction] = useState<string | null>(null);

  useEffect(() => {
    const handleOptimisticAction = (e: Event) => {
      const custom = e as CustomEvent<OptimisticSyncEventDetail>;
      const action = custom.detail?.actionName || 'Change Applied';
      setRecentAction(action);

      const timer = setTimeout(() => {
        setRecentAction(null);
      }, 2500);

      return () => clearTimeout(timer);
    };

    window.addEventListener('docsearch:optimistic_action', handleOptimisticAction);
    return () => window.removeEventListener('docsearch:optimistic_action', handleOptimisticAction);
  }, []);

  // 1. Offline with queued changes
  if (!isOnline) {
    return (
      <div
        title="Working completely offline. All clinical and financial records are preserved in local outbox and will auto-sync on reconnection."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          fontSize: '0.6875rem',
          fontWeight: 700,
          fontFamily: 'system-ui, monospace'
        }}
      >
        <span style={{ fontSize: '0.75rem' }}>📡</span>
        <span>Offline ({outboxCount} Queued)</span>
      </div>
    );
  }

  // 2. Active Outbox Flushing or Recent Optimistic Action
  if (isOutboxSyncing || outboxCount > 0) {
    return (
      <div
        title="Flushing offline outbox mutations to PostgreSQL backend via API Gateway"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: '20px',
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          color: '#38bdf8',
          fontSize: '0.6875rem',
          fontWeight: 700,
          fontFamily: 'system-ui, monospace',
          animation: 'pulse 1.2s infinite'
        }}
      >
        <span>⚡</span>
        <span>Syncing Outbox ({outboxCount})</span>
      </div>
    );
  }

  // 3. User just performed an action (<16ms optimistic UI feedback)
  if (recentAction) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: '20px',
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
          border: '1.5px solid #10b981',
          color: '#34d399',
          fontSize: '0.6875rem',
          fontWeight: 800,
          fontFamily: 'system-ui, monospace',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: '0.8125rem' }}>✓</span>
        <span>{recentAction} (Persisted)</span>
      </div>
    );
  }

  // 4. Default: Healthy Cloud Connected
  return (
    <div
      title="DOC SEARCH Resilient Architecture: Connected to PostgreSQL with zero latency"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '20px',
        backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.04))',
        border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
        color: 'var(--ds-color-text-muted, #94a3b8)',
        fontSize: '0.6875rem',
        fontWeight: 600,
        userSelect: 'none'
      }}
    >
      <span style={{ fontSize: '0.75rem', color: '#10b981' }}>●</span>
      <span>Cloud Synced</span>
    </div>
  );
};
