import React, { createContext, useContext, useState, useCallback } from 'react';
import { SUPPORTED_UI_LANGUAGES, type UiLanguageCode, type UiLanguageMeta } from '@docsearch/shared-core';

const LANDING_STORAGE_KEY = 'docsearch_landing_lang';

const LANDING_TRANSLATIONS: Record<UiLanguageCode, Record<string, string>> = {
  en: {
    'nav.overview': 'Overview',
    'nav.demo_live': '10-Sec Live Demo',
    'nav.icu_radar': 'ICU Bed Radar',
    'nav.architecture': 'Architecture',
    'nav.security': 'Security',
    'nav.find_doctors': 'Find Doctors (Merit)',
    'nav.track_token': 'Track OPD Token',
    'cta.live_demo': 'Live Product Demo',
    'cta.multi_erp': 'Multi-Industry ERP',
    'cta.sign_in': 'Sign In',
    'cta.claim_seat': 'Claim Free Seat'
  },
  hi: {
    'nav.overview': 'अवलोकन',
    'nav.demo_live': '10-सेकंड लाइव डेमो',
    'nav.icu_radar': 'ICU बेड रडार',
    'nav.architecture': 'आर्किटेक्चर',
    'nav.security': 'सुरक्षा',
    'nav.find_doctors': 'डॉक्टर खोजें (मेरिट)',
    'nav.track_token': 'OPD टोकन ट्रैक करें',
    'cta.live_demo': 'लाइव प्रोडक्ट डेमो',
    'cta.multi_erp': 'मल्टी-इंडस्ट्री ERP',
    'cta.sign_in': 'साइन इन करें',
    'cta.claim_seat': 'मुफ़्त सीट बुक करें'
  },
  mr: {
    'nav.overview': 'आढावा',
    'nav.demo_live': '१०-सेकंद लाइव्ह डेमो',
    'nav.icu_radar': 'ICU बेड रडार',
    'nav.architecture': 'आर्किटेक्चर',
    'nav.security': 'सुरक्षा',
    'nav.find_doctors': 'डॉक्टर शोधा (मेरिट)',
    'nav.track_token': 'OPD टोकन तपासा',
    'cta.live_demo': 'लाइव्ह प्रॉडक्ट डेमो',
    'cta.multi_erp': 'मल्टी-इंडस्ट्री ERP',
    'cta.sign_in': 'साइन इन करा',
    'cta.claim_seat': 'मोफत जागा मिळवा'
  },
  bn: {
    'nav.overview': 'সংক্ষিপ্ত বিবরণ',
    'nav.demo_live': '১০-সেকেন্ড লাইভ ডেমো',
    'nav.icu_radar': 'ICU বেড রাডার',
    'nav.architecture': 'আর্কিটেকচার',
    'nav.security': 'নিরাপত্তা',
    'nav.find_doctors': 'ডাক্তার খুঁজুন (মেরিট)',
    'nav.track_token': 'OPD টোকেন ট্র্যাক করুন',
    'cta.live_demo': 'লাইভ প্রোডাক্ট ডেমো',
    'cta.multi_erp': 'মাল্টি-ইন্ডাস্ট্রি ERP',
    'cta.sign_in': 'সাইন ইন',
    'cta.claim_seat': 'বিনামূল্যে আসন নিন'
  },
  ta: {
    'nav.overview': 'மேலோட்டம்',
    'nav.demo_live': '10-வினாடி நேரலை டெமோ',
    'nav.icu_radar': 'ICU படுக்கை ரேடார்',
    'nav.architecture': 'கட்டமைப்பு',
    'nav.security': 'பாதுகாப்பு',
    'nav.find_doctors': 'மருத்துவர்களைக் கண்டறியவும்',
    'nav.track_token': 'OPD டோக்கன் நிலை',
    'cta.live_demo': 'நேரலை டெமோ',
    'cta.multi_erp': 'பல்துறை ERP',
    'cta.sign_in': 'உள்நுழைய',
    'cta.claim_seat': 'இலவச இருக்கை பெறுக'
  },
  te: {
    'nav.overview': 'అవలోకనం',
    'nav.demo_live': '10-సెకన్ల లైవ్ డెమో',
    'nav.icu_radar': 'ICU బెడ్ రాడార్',
    'nav.architecture': 'ఆర్కిటెక్చర్',
    'nav.security': 'భద్రత',
    'nav.find_doctors': 'వైద్యులను కనుగొనండి',
    'nav.track_token': 'OPD టోకెన్ ట్రాక్',
    'cta.live_demo': 'లైవ్ డెమో',
    'cta.multi_erp': 'మల్టీ-ఇండస్ట్రీ ERP',
    'cta.sign_in': 'సైన్ ఇన్',
    'cta.claim_seat': 'ఉచిత సీటు పొందండి'
  }
};

export function getSavedLandingLanguage(): UiLanguageCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANDING_STORAGE_KEY) as UiLanguageCode | null;
    if (saved && SUPPORTED_UI_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch (err) {
    console.warn('[LandingI18n] Unable to read saved language preference:', err);
  }
  return 'en';
}

interface LandingI18nContextValue {
  language: UiLanguageCode;
  languageMeta: UiLanguageMeta;
  setLanguage: (lang: UiLanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: UiLanguageMeta[];
}

const LandingI18nContext = createContext<LandingI18nContextValue | null>(null);

export const LandingI18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<UiLanguageCode>(() => getSavedLandingLanguage());

  const setLanguage = useCallback((lang: UiLanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANDING_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (err) {
      console.warn('[LandingI18n] Unable to save language preference:', err);
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const dict = LANDING_TRANSLATIONS[language] || LANDING_TRANSLATIONS.en;
      return dict[key] || LANDING_TRANSLATIONS.en[key] || fallback || key;
    },
    [language]
  );

  const languageMeta = SUPPORTED_UI_LANGUAGES.find((l) => l.code === language) || SUPPORTED_UI_LANGUAGES[0]!;

  return (
    <LandingI18nContext.Provider
      value={{
        language,
        languageMeta,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_UI_LANGUAGES
      }}
    >
      {children}
    </LandingI18nContext.Provider>
  );
};

export function useLandingI18n(): LandingI18nContextValue {
  const ctx = useContext(LandingI18nContext);
  if (!ctx) {
    return {
      language: 'en',
      languageMeta: SUPPORTED_UI_LANGUAGES[0]!,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => LANDING_TRANSLATIONS.en[key] || fallback || key,
      supportedLanguages: SUPPORTED_UI_LANGUAGES
    };
  }
  return ctx;
}
