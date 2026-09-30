import { themes, type ThemeMode } from '@docsearch/ui-kit';

const ALL_THEME_CLASSES = Object.values(themes) as string[];

export interface PartnerAccountPreferences {
  themePreference?: string;
  theme?: string;
  [key: string]: any;
}

let lastPersistedTheme: string | null = null;
let persistTimeout: any = null;

/**
 * Retrieves the authoritative UI preferences (including theme) from PostgreSQL backend
 */
export async function fetchCloudThemePreference(): Promise<ThemeMode | null> {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('docsearch_auth_token');
  if (!token) return null;

  try {
    const res = await fetch('/api/v1/partner/account/preferences', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (json.success && json.data) {
      const themeCandidate = json.data.themePreference || json.data.theme;
      if (themeCandidate && ALL_THEME_CLASSES.includes(themeCandidate)) {
        return themeCandidate as ThemeMode;
      }
    }
    return null;
  } catch (err) {
    console.warn('[ThemeSyncService] Failed to fetch cloud theme preferences:', err);
    return null;
  }
}

/**
 * Persists the user/partner theme selection to PostgreSQL database asynchronously
 * with debounce to prevent excessive writes when cycling through themes
 */
export async function persistCloudThemePreference(newTheme: ThemeMode): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!ALL_THEME_CLASSES.includes(newTheme)) return false;

  lastPersistedTheme = newTheme;

  if (persistTimeout) {
    clearTimeout(persistTimeout);
  }

  return new Promise((resolve) => {
    persistTimeout = setTimeout(async () => {
      const token = localStorage.getItem('docsearch_auth_token');
      if (!token) {
        resolve(false);
        return;
      }

      try {
        const res = await fetch('/api/v1/partner/account/preferences', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            themePreference: newTheme,
            theme: newTheme
          })
        });

        const json = await res.json();
        resolve(Boolean(json.success));
      } catch (err) {
        console.warn('[ThemeSyncService] Failed to persist theme to backend:', err);
        resolve(false);
      }
    }, 150); // Fast 150ms debounce
  });
}

/**
 * Sets up two-way cloud synchronization:
 * 1. Hydrates initial theme from cloud on startup
 * 2. Listens to window focus / visibilityChange events to pull remote updates when switching browsers
 */
export function setupCrossBrowserThemeSync(onSyncTheme: (theme: ThemeMode) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let isMounted = true;

  const pullRemoteTheme = async () => {
    if (!isMounted) return;
    const remoteTheme = await fetchCloudThemePreference();
    if (remoteTheme && isMounted) {
      const localTheme = localStorage.getItem('docsearch_theme');
      if (remoteTheme !== localTheme || remoteTheme !== lastPersistedTheme) {
        lastPersistedTheme = remoteTheme;
        onSyncTheme(remoteTheme);
      }
    }
  };

  // 1. Initial pull
  void pullRemoteTheme();

  // 2. Window focus & visibility listeners: When user switches back to this browser from another browser,
  // sync any changes that occurred in the other browser
  const handleWindowFocus = () => {
    void pullRemoteTheme();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void pullRemoteTheme();
    }
  };

  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    isMounted = false;
    window.removeEventListener('focus', handleWindowFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
