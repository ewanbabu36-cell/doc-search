import { useState, useCallback, useEffect } from 'react';
import { type ModularFeatureAction, FEATURE_REGISTRY } from '../registry/feature-registry.js';
import { useHapticSoundFeedback } from './useHapticSoundFeedback.js';

export interface RunningAppSession {
  action: ModularFeatureAction;
  openedAt: number;
  lastActiveTime?: string | undefined;
}

export function useSmartphoneOS() {
  const [runningApps, setRunningApps] = useState<RunningAppSession[]>(() => [
    // Pre-seed warm default clinical sessions
    {
      action: FEATURE_REGISTRY.find((a) => a.id === 'clinical_opd_queue') || FEATURE_REGISTRY[0]!,
      openedAt: Date.now() - 1000 * 60 * 12,
      lastActiveTime: '12m ago',
    },
    {
      action: FEATURE_REGISTRY.find((a) => a.id === 'ipd_bed_census') || FEATURE_REGISTRY[1]!,
      openedAt: Date.now() - 1000 * 60 * 5,
      lastActiveTime: '5m ago',
    },
  ]);

  const [activeAppAction, setActiveAppAction] = useState<ModularFeatureAction | null>(null);
  const [isRecentAppsOpen, setIsRecentAppsOpen] = useState<boolean>(false);
  const [isPhoneFrameMode, setIsPhoneFrameMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_smartphone_frame_mode');
      if (stored !== null) return stored === 'true';
      return false; // Default to false: Enterprise Hospital OS opens in pure full-screen mode without mobile frames
    }
    return false;
  });

  const { playClick, triggerHaptic } = useHapticSoundFeedback();

  // Save phone frame mode preference
  const togglePhoneFrameMode = useCallback(() => {
    playClick();
    triggerHaptic(20);
    setIsPhoneFrameMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('docsearch_smartphone_frame_mode', String(next));
      }
      return next;
    });
  }, [playClick, triggerHaptic]);

  // 1. Launch / Foreground App
  const launchApp = useCallback((action: ModularFeatureAction) => {
    playClick();
    triggerHaptic(15);
    setIsRecentAppsOpen(false);
    setActiveAppAction(action);

    setRunningApps((prev) => {
      const existingIdx = prev.findIndex((s) => s.action.id === action.id);
      const now = Date.now();
      const newSession: RunningAppSession = { action, openedAt: now, lastActiveTime: 'Active now' };

      if (existingIdx !== -1) {
        // Move to front of recent stack
        const updated = [...prev];
        updated.splice(existingIdx, 1);
        return [newSession, ...updated];
      }
      return [newSession, ...prev];
    });

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', action.route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [playClick, triggerHaptic]);

  // 2. Middle Button: Home Button [ ○ ]
  const pressHome = useCallback(() => {
    playClick();
    triggerHaptic(30);
    setIsRecentAppsOpen(false);
    setActiveAppAction(null);
  }, [playClick, triggerHaptic]);

  // 3. Right Button: Back Button [ ◁ ]
  const pressBack = useCallback(() => {
    playClick();
    triggerHaptic(20);

    if (isRecentAppsOpen) {
      setIsRecentAppsOpen(false);
      return;
    }

    if (activeAppAction) {
      // Return to home screen from active app
      setActiveAppAction(null);
      return;
    }

    // Already on home screen - soft bounce vibration
    triggerHaptic(10);
  }, [isRecentAppsOpen, activeAppAction, playClick, triggerHaptic]);

  // 4. Left Button: Recent / Open Apps [ ||| ]
  const pressRecentApps = useCallback(() => {
    playClick();
    triggerHaptic(25);
    setIsRecentAppsOpen((prev) => !prev);
  }, [playClick, triggerHaptic]);

  // 5. Kill individual app from Multitasking Switcher
  const killApp = useCallback((actionId: string) => {
    playClick();
    triggerHaptic(20);
    setRunningApps((prev) => prev.filter((s) => s.action.id !== actionId));
    setActiveAppAction((prev) => (prev?.id === actionId ? null : prev));
  }, [playClick, triggerHaptic]);

  // 6. Clear All background apps
  const clearAllApps = useCallback(() => {
    playClick();
    triggerHaptic(40);
    setRunningApps([]);
    setActiveAppAction(null);
    setIsRecentAppsOpen(false);
  }, [playClick, triggerHaptic]);

  // Global physical Escape & Alt keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRecentAppsOpen) {
          setIsRecentAppsOpen(false);
        } else if (activeAppAction) {
          setActiveAppAction(null);
        }
      } else if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        pressRecentApps();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecentAppsOpen, activeAppAction, pressRecentApps]);

  return {
    runningApps,
    activeAppAction,
    isRecentAppsOpen,
    isPhoneFrameMode,
    launchApp,
    pressHome,
    pressBack,
    pressRecentApps,
    killApp,
    clearAllApps,
    togglePhoneFrameMode,
    setIsRecentAppsOpen,
    setActiveAppAction,
  };
}
