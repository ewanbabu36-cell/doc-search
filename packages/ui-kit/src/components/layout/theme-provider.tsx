import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { themes, type ThemeMode } from '../../tokens/colors';

const ALL_THEME_CLASSES = Object.values(themes);
export const THEME_BROADCAST_CHANNEL_NAME = 'docsearch_theme_sync_channel';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode, options?: { skipBroadcast?: boolean; skipPersist?: boolean }) => void;
  toggleTheme: () => void;
  syncRemoteTheme: (remoteTheme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode | undefined;
  storageKey?: string | undefined;
  cloudTheme?: ThemeMode | undefined;
  onThemeChange?: ((newTheme: ThemeMode) => void) | undefined;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = themes.ADVANCE_PRO,
  storageKey = 'docsearch_theme',
  cloudTheme,
  onThemeChange
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as ThemeMode | null;
      if (stored && ALL_THEME_CLASSES.includes(stored)) {
        return stored;
      }
    }
    return cloudTheme && ALL_THEME_CLASSES.includes(cloudTheme) ? cloudTheme : defaultTheme;
  });

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const onThemeChangeRef = useRef(onThemeChange);
  onThemeChangeRef.current = onThemeChange;

  // Initialize BroadcastChannel for instant cross-tab theme synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return () => {};
    }

    try {
      const channel = new BroadcastChannel(THEME_BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'THEME_SYNC' && event.data?.theme) {
          const syncedTheme = event.data.theme as ThemeMode;
          if (ALL_THEME_CLASSES.includes(syncedTheme)) {
            setThemeState((current) => (current === syncedTheme ? current : syncedTheme));
          }
        }
      };

      return () => {
        channel.close();
        broadcastChannelRef.current = null;
      };
    } catch (err) {
      console.warn('[ThemeProvider] BroadcastChannel initialization failed:', err);
      return () => {};
    }
  }, []);

  // Listen for storage event as a fallback for browsers where BroadcastChannel is blocked
  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const newTheme = e.newValue as ThemeMode;
        if (ALL_THEME_CLASSES.includes(newTheme)) {
          setThemeState((current) => (current === newTheme ? current : newTheme));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey]);

  // Synchronize when authoritative cloudTheme is fetched or changes from backend profile
  useEffect(() => {
    if (cloudTheme && ALL_THEME_CLASSES.includes(cloudTheme)) {
      setThemeState((current) => {
        if (current !== cloudTheme) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, cloudTheme);
          }
          return cloudTheme;
        }
        return current;
      });
    }
  }, [cloudTheme, storageKey]);

  // Apply theme to document root element and cache in localStorage
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      ALL_THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
      root.classList.add(theme);
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  // Universal Click Ripple Engine
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        '.ds-spotlight-card, .ds-card, [class*="Card"], [data-card="true"], .ds-interactive, button'
      ) as HTMLElement | null;

      if (target) {
        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ds-click-ripple';
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        target.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 650);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const setTheme = useCallback(
    (newTheme: ThemeMode, options?: { skipBroadcast?: boolean; skipPersist?: boolean }) => {
      if (!ALL_THEME_CLASSES.includes(newTheme)) return;

      setThemeState(newTheme);

      // Local storage update
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
      }

      // Broadcast to other open tabs in the same browser
      if (!options?.skipBroadcast && broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'THEME_SYNC',
            theme: newTheme,
            timestamp: Date.now()
          });
        } catch (err) {
          console.warn('[ThemeProvider] Cross-tab broadcast failed:', err);
        }
      }

      // Trigger cloud persistence callback
      if (!options?.skipPersist && onThemeChangeRef.current) {
        try {
          onThemeChangeRef.current(newTheme);
        } catch (err) {
          console.warn('[ThemeProvider] onThemeChange callback error:', err);
        }
      }
    },
    [storageKey]
  );

  const syncRemoteTheme = useCallback(
    (remoteTheme: ThemeMode) => {
      if (ALL_THEME_CLASSES.includes(remoteTheme)) {
        setTheme(remoteTheme, { skipPersist: true, skipBroadcast: false });
      }
    },
    [setTheme]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const themeList: ThemeMode[] = [
        themes.ADVANCE_PRO,
        themes.OBSIDIAN_TITANIUM,
        themes.IMPERIAL_GOLD,
        themes.QUANTUM_BIOLUM,
        themes.TOKYO_CYBERPUNK,
        themes.SOLAR_AMBER,
        themes.SWISS_CLINICAL,
        themes.AURORA_GLOW,
        themes.NORDIC_PURE,
        themes.OCEANIC_NAVY,
        themes.AYUR_WELLNESS,
        themes.CYBER_SURGEON,
        themes.ROSE_CARE,
        themes.HEALTHCARE_LIGHT,
        themes.BLACK_WHITE
      ];
      const currentIndex = themeList.indexOf(prev);
      const nextIndex = (currentIndex + 1) % themeList.length;
      const nextTheme = themeList[nextIndex] || themes.ADVANCE_PRO;

      // Broadcast and persist
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'THEME_SYNC',
            theme: nextTheme,
            timestamp: Date.now()
          });
        } catch {}
      }

      if (onThemeChangeRef.current) {
        try {
          onThemeChangeRef.current(nextTheme);
        } catch {}
      }

      return nextTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, syncRemoteTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

