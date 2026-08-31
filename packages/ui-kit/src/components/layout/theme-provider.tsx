import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, type ThemeMode } from '../../tokens/colors';

const ALL_THEME_CLASSES = Object.values(themes);

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode | undefined;
  storageKey?: string | undefined;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = themes.ADVANCE_PRO,
  storageKey = 'docsearch_theme'
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as ThemeMode | null;
      if (stored && ALL_THEME_CLASSES.includes(stored)) {
        return stored;
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      ALL_THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
      root.classList.add(theme);
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const themeList: ThemeMode[] = [
        themes.ADVANCE_PRO,
        themes.NORDIC_PURE,
        themes.OCEANIC_NAVY,
        themes.AYUR_WELLNESS,
        themes.CYBER_SURGEON,
        themes.ROSE_CARE,
        themes.BLACK_WHITE
      ];
      const currentIndex = themeList.indexOf(prev);
      const nextIndex = (currentIndex + 1) % themeList.length;
      return themeList[nextIndex] || themes.ADVANCE_PRO;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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
