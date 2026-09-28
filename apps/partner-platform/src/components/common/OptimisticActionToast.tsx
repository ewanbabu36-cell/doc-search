import React, { useState, useEffect } from 'react';
import { optimisticActionService, type OptimisticAction } from '../../services/optimistic-action-service.js';

export const OptimisticActionToast: React.FC = () => {
  const [action, setAction] = useState<OptimisticAction | null>(null);
  const [undoMsg, setUndoMsg] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [remainingSecs, setRemainingSecs] = useState<string>('5.0');

  useEffect(() => {
    const unsub = optimisticActionService.subscribe((currentAction, currentUndo) => {
      setAction(currentAction);
      setUndoMsg(currentUndo || null);
      if (currentAction) {
        setProgressPercent(100);
        setRemainingSecs((currentAction.timeoutMs / 1000).toFixed(1));
      }
    });
    return unsub;
  }, []);

  // Smooth linear countdown tick
  useEffect(() => {
    if (!action) return;

    const interval = 50; // 50ms tick
    const totalMs = action.timeoutMs;
    const start = action.timestamp;

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, totalMs - elapsed);
      const pct = (remaining / totalMs) * 100;
      setProgressPercent(pct);
      setRemainingSecs((remaining / 1000).toFixed(1));

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [action]);

  if (!action && !undoMsg) return null;

  return (
    <aside
      aria-live="polite"
      role="status"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        maxWidth: '460px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'auto',
        animation: 'dsPillSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* 1. Active Optimistic Transaction Pill */}
      {action && (
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface, #121826)',
            color: 'var(--ds-color-text-primary, #F8FAFC)',
            border: '1.5px solid var(--ds-color-success, #10B981)',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.2)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ds-color-success, #10B981)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  flexShrink: 0
                }}
              >
                ✓
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--ds-color-text-primary, #F8FAFC)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {action.title}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ds-color-text-muted, #94A3B8)' }}>
                  Saved locally • Auto-syncing in {remainingSecs}s
                </div>
              </div>
            </div>

            {/* Undo Button */}
            <button
              type="button"
              onClick={() => optimisticActionService.undo(action.id)}
              className="ds-interactive"
              title="Cancel this action (Ctrl+Z)"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.borderColor = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
              }}
            >
              <span>↩️ Undo</span>
              <kbd
                style={{
                  fontSize: '0.62rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Ctrl+Z
              </kbd>
            </button>
          </div>

          {/* Draining Linear Countdown Progress Bar */}
          <div
            style={{
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              width: '100%',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--ds-color-success, #10B981)',
                transition: 'width 0.05s linear'
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Reverted / Undone Notice Pill */}
      {!action && undoMsg && (
        <div
          style={{
            backgroundColor: 'var(--ds-color-surface, #121826)',
            color: 'var(--ds-color-text-primary, #F8FAFC)',
            border: '1.5px solid var(--ds-color-warning, #F59E0B)',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.2)',
            padding: '10px 14px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-color-warning, #FCD34D)' }}>
            {undoMsg}
          </span>
        </div>
      )}
    </aside>
  );
};
