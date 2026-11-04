import React, { createContext, useContext, useState, useEffect } from 'react';

export type WorkspaceDensityMode = 'ZEN_COMFORTABLE' | 'HIGH_DENSITY_TERMINAL';

export interface WorkspaceDensityContextValue {
  density: WorkspaceDensityMode;
  setDensity: (mode: WorkspaceDensityMode) => void;
  toggleDensity: () => void;
  isHighDensity: boolean;
}

const WorkspaceDensityContext = createContext<WorkspaceDensityContextValue | null>(null);

const STORAGE_KEY = 'docsearch_workspace_density_pref';

export interface WorkspaceDensityProviderProps {
  children: React.ReactNode;
  initialMode?: WorkspaceDensityMode;
}

export const WorkspaceDensityProvider: React.FC<WorkspaceDensityProviderProps> = ({
  children,
  initialMode = 'ZEN_COMFORTABLE'
}) => {
  const [density, setDensityState] = useState<WorkspaceDensityMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as WorkspaceDensityMode | null;
        if (stored === 'ZEN_COMFORTABLE' || stored === 'HIGH_DENSITY_TERMINAL') {
          return stored;
        }
      } catch {
        // LocalStorage fallback
      }
    }
    return initialMode;
  });

  const setDensity = (mode: WorkspaceDensityMode) => {
    setDensityState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // Ignore
      }
    }
  };

  const toggleDensity = () => {
    setDensity(density === 'ZEN_COMFORTABLE' ? 'HIGH_DENSITY_TERMINAL' : 'ZEN_COMFORTABLE');
  };

  const isHighDensity = density === 'HIGH_DENSITY_TERMINAL';

  // Apply CSS variables dynamically to the document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isHighDensity) {
        root.style.setProperty('--ds-table-row-padding', '4px 8px');
        root.style.setProperty('--ds-table-font-size', '0.78rem');
        root.style.setProperty('--ds-table-line-height', '1.2');
        root.style.setProperty('--ds-card-padding', '12px 14px');
        root.setAttribute('data-density', 'high-density-terminal');
      } else {
        root.style.setProperty('--ds-table-row-padding', '12px 16px');
        root.style.setProperty('--ds-table-font-size', '0.875rem');
        root.style.setProperty('--ds-table-line-height', '1.5');
        root.style.setProperty('--ds-card-padding', '20px 24px');
        root.setAttribute('data-density', 'zen-comfortable');
      }
    }
  }, [density, isHighDensity]);

  return (
    <WorkspaceDensityContext.Provider
      value={{
        density,
        setDensity,
        toggleDensity,
        isHighDensity
      }}
    >
      {children}
    </WorkspaceDensityContext.Provider>
  );
};

export function useWorkspaceDensity(): WorkspaceDensityContextValue {
  const ctx = useContext(WorkspaceDensityContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      density: 'ZEN_COMFORTABLE',
      setDensity: () => {},
      toggleDensity: () => {},
      isHighDensity: false
    };
  }
  return ctx;
}

/**
 * 1-Click Compact Density Switcher Pill for Header Navigation Bars
 */
export const DensitySwitcherPill: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { toggleDensity, isHighDensity } = useWorkspaceDensity();

  return (
    <button
      type="button"
      onClick={toggleDensity}
      title={isHighDensity ? 'Switch to Zen Comfortable Mode' : 'Switch to High-Density Terminal (Compact) Mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: '6px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        backgroundColor: isHighDensity ? 'rgba(56, 189, 248, 0.15)' : '#1E293B',
        color: isHighDensity ? '#38BDF8' : '#94A3B8',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ...style
      }}
    >
      <span>{isHighDensity ? '⚡ High-Density' : '🧘 Zen'}</span>
    </button>
  );
};
