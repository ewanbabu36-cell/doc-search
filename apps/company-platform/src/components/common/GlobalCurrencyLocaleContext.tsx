import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'SAR';
export type LocaleCode = 'en' | 'es' | 'fr' | 'de' | 'ar' | 'hi';
export type VisionMode = 'NORMAL' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA';
export type TypographyMode = 'STANDARD' | 'DYSLEXIC';
export type HighContrastMode = 'OFF' | 'BLACK_WHITE_HIGH_CONTRAST' | 'YELLOW_BLACK_SURGICAL';

export interface CurrencyRate {
  symbol: string;
  rateToInr: number;
  name: string;
  flag: string;
}

export const CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyRate> = {
  INR: { symbol: '₹', rateToInr: 1.0, name: 'Indian Rupee', flag: '🇮🇳' },
  USD: { symbol: '$', rateToInr: 0.012, name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', rateToInr: 0.011, name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', rateToInr: 0.0094, name: 'British Pound', flag: '🇬🇧' },
  AED: { symbol: 'د.إ', rateToInr: 0.044, name: 'UAE Dirham', flag: '🇦🇪' },
  SGD: { symbol: 'S$', rateToInr: 0.016, name: 'Singapore Dollar', flag: '🇸🇬' },
  SAR: { symbol: '﷼', rateToInr: 0.045, name: 'Saudi Riyal', flag: '🇸🇦' }
};

export const LOCALE_REGISTRY: Record<LocaleCode, { name: string; nativeName: string; dir: 'ltr' | 'rtl'; flag: string }> = {
  en: { name: 'English (US/UK)', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  ar: { name: 'Arabic (Middle East)', nativeName: 'العربية', dir: 'rtl', flag: '🇦🇪' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' }
};

interface GlobalCurrencyLocaleContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  direction: 'ltr' | 'rtl';
  fontSizeScale: number;
  setFontSizeScale: (scale: number) => void;
  visionMode: VisionMode;
  setVisionMode: (v: VisionMode) => void;
  typographyMode: TypographyMode;
  setTypographyMode: (t: TypographyMode) => void;
  highContrastMode: HighContrastMode;
  setHighContrastMode: (h: HighContrastMode) => void;
  reducedMotion: boolean;
  setReducedMotion: (r: boolean) => void;
  screenReaderActive: boolean;
  setScreenReaderActive: (s: boolean) => void;
  formatMoney: (amountInInr: number) => string;
}

const GlobalCurrencyLocaleContext = createContext<GlobalCurrencyLocaleContextType | undefined>(undefined);

export const GlobalCurrencyLocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [locale, setLocale] = useState<LocaleCode>('en');
  const [fontSizeScale, setFontSizeScale] = useState<number>(100);
  const [visionMode, setVisionMode] = useState<VisionMode>('NORMAL');
  const [typographyMode, setTypographyMode] = useState<TypographyMode>('STANDARD');
  const [highContrastMode, setHighContrastMode] = useState<HighContrastMode>('OFF');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [screenReaderActive, setScreenReaderActive] = useState<boolean>(false);

  const direction = LOCALE_REGISTRY[locale].dir;

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }, [direction, locale]);

  const formatMoney = (amountInInr: number): string => {
    const curr = CURRENCY_REGISTRY[currency];
    const converted = amountInInr * curr.rateToInr;
    if (currency === 'INR') {
      if (converted >= 10000000) return `₹ ${(converted / 10000000).toFixed(2)} Cr`;
      if (converted >= 100000) return `₹ ${(converted / 100000).toFixed(2)} Lakhs`;
      return `₹ ${converted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    return `${curr.symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <GlobalCurrencyLocaleContext.Provider
      value={{
        currency,
        setCurrency,
        locale,
        setLocale,
        direction,
        fontSizeScale,
        setFontSizeScale,
        visionMode,
        setVisionMode,
        typographyMode,
        setTypographyMode,
        highContrastMode,
        setHighContrastMode,
        reducedMotion,
        setReducedMotion,
        screenReaderActive,
        setScreenReaderActive,
        formatMoney
      }}
    >
      <div
        style={{
          zoom: `${fontSizeScale}%`,
          fontFamily: typographyMode === 'DYSLEXIC' ? 'OpenDyslexic, Comic Sans MS, sans-serif' : 'inherit',
          letterSpacing: typographyMode === 'DYSLEXIC' ? '0.04em' : 'normal',
          filter:
            visionMode === 'PROTANOPIA'
              ? 'url(#protanopia-filter)'
              : visionMode === 'DEUTERANOPIA'
              ? 'url(#deuteranopia-filter)'
              : visionMode === 'TRITANOPIA'
              ? 'url(#tritanopia-filter)'
              : 'none',
          backgroundColor:
            highContrastMode === 'BLACK_WHITE_HIGH_CONTRAST'
              ? '#000000'
              : highContrastMode === 'YELLOW_BLACK_SURGICAL'
              ? '#0A0A00'
              : 'transparent',
          color:
            highContrastMode === 'YELLOW_BLACK_SURGICAL'
              ? '#FFFF00'
              : 'inherit',
          transition: reducedMotion ? 'none' : 'all 0.2s ease'
        }}
      >
        {children}
      </div>
    </GlobalCurrencyLocaleContext.Provider>
  );
};

export const useGlobalLocale = () => {
  const context = useContext(GlobalCurrencyLocaleContext);
  if (!context) {
    throw new Error('useGlobalLocale must be used within GlobalCurrencyLocaleProvider');
  }
  return context;
};
