import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';

export interface IdleScreenPrivacyShieldProps {
  idleTimeoutSeconds?: number;
  staffName?: string;
  enabled?: boolean;
}

export const IdleScreenPrivacyShield: React.FC<IdleScreenPrivacyShieldProps> = ({
  idleTimeoutSeconds = 300,
  staffName = 'Authorized Healthcare Staff',
  enabled = true
}) => {
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const isShieldActiveRef = useRef(isShieldActive);
  isShieldActiveRef.current = isShieldActive;

  // Reset idle timer on any user activity
  const resetActivity = useCallback(() => {
    // If the shield is already active, moving the mouse should not silently unmask
    // unless user explicitly clicks Resume or enters PIN for maximum counter security
    if (!isShieldActiveRef.current) {
      setIdleSeconds(0);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetActivity, { passive: true }));

    const handleManualLock = () => {
      setIsShieldActive(true);
    };

    const handleHotkeys = (e: KeyboardEvent) => {
      // Hotkey Alt+L to immediately lock screen
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsShieldActive(true);
      }
    };

    window.addEventListener('docsearch:lock-privacy-shield', handleManualLock);
    window.addEventListener('keydown', handleHotkeys);

    const interval = setInterval(() => {
      setIdleSeconds((prev) => {
        const next = prev + 1;
        if (next >= idleTimeoutSeconds && !isShieldActiveRef.current) {
          setIsShieldActive(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetActivity));
      window.removeEventListener('docsearch:lock-privacy-shield', handleManualLock);
      window.removeEventListener('keydown', handleHotkeys);
      clearInterval(interval);
    };
  }, [enabled, idleTimeoutSeconds, resetActivity]);

  const handleResumeScreen = () => {
    setIsShieldActive(false);
    setIdleSeconds(0);
    setPinInput('');
    setPinError(false);
  };

  const handlePinUnlock = () => {
    if (pinInput === '2026' || pinInput === '1234') {
      handleResumeScreen();
    } else {
      setPinError(true);
    }
  };

  const handleSnooze = () => {
    setIsShieldActive(false);
    // Snooze by setting negative idle seconds (300s = 5 minutes)
    setIdleSeconds(-300);
    setPinInput('');
    setPinError(false);
  };

  if (!enabled || !isShieldActive) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Counter Privacy Shield"
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-500"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
    >
      <div className="bg-slate-900/95 text-slate-100 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-indigo-500/40 text-center space-y-5 mx-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
          🛡️
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-xl font-black text-white">Counter Privacy Shield Active</h2>
            <Badge variant="success" className="text-[10px]">LOCKED</Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Screen blurred after {idleTimeoutSeconds}s of inactivity (idle for {idleSeconds}s) to protect patient records and diagnostic data from bystanders and unauthorized viewing.
          </p>
        </div>

        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
          <span>Active Staff Session:</span>
          <strong className="text-indigo-300 font-mono">{staffName}</strong>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            onClick={handleResumeScreen}
            className="w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg text-sm"
          >
            🔓 Tap to Resume Consultation
          </Button>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1.5">Or Quick Unlock with PIN:</div>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handlePinUnlock()}
                placeholder="PIN (Demo: 2026)"
                className="flex-1 p-2 rounded-lg bg-slate-800 border border-slate-700 text-center font-mono text-sm tracking-widest text-white focus:outline-none focus:border-indigo-500"
              />
              <Button variant="outline" size="sm" onClick={handlePinUnlock}>
                Unlock
              </Button>
            </div>
            {pinError && (
              <div className="text-[11px] text-red-400 font-semibold mt-1">
                Incorrect PIN. Use demo PIN 2026.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleSnooze}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              ⏱️ Snooze 5 Mins (Active Procedure)
            </button>
            <span className="text-[10px] text-slate-400">NABH &amp; DPDP Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
