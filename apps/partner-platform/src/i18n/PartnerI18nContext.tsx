/**
 * DocSearch Partner Platform — Multi-Lingual Vernacular UI Localization Engine
 * Supports 6 Indian Languages: English (en), Hindi (hi), Marathi (mr),
 * Bengali (bn), Tamil (ta), and Telugu (te).
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SUPPORTED_UI_LANGUAGES,
  translatePartnerUi,
  translateWorkspaceLabel,
  type UiLanguageCode,
  type UiLanguageMeta
} from '@docsearch/shared-core';
import { saveRxLanguage, type RxLanguageCode } from '../utils/regional-prescription-translator.js';

export type { UiLanguageCode, UiLanguageMeta };
export { SUPPORTED_UI_LANGUAGES };

const UI_LANG_STORAGE_KEY = 'docsearch_partner_ui_lang';

const MODULE_KEY_MAP: Record<string, string> = {
  overview: 'nav.overview',
  'home-overview': 'nav.overview',
  'front-desk': 'nav.front_desk',
  'patient-registration': 'nav.front_desk',
  'clinical-consultation': 'nav.consultation',
  consultation: 'nav.consultation',
  'nurse-triage': 'nav.triage',
  inpatient: 'nav.inpatient',
  'inpatient-wards': 'nav.inpatient',
  'lab-diagnostics': 'nav.pathology',
  lims: 'nav.pathology',
  phlebotomy: 'nav.phlebotomy',
  pharmacy: 'nav.pharmacy',
  radiology: 'nav.radiology',
  billing: 'nav.billing',
  emergency: 'nav.emergency',
  ot: 'nav.ot',
  'blood-bank': 'nav.blood_bank',
  'staff-administration': 'nav.staff_admin',
  'offline-mesh': 'nav.offline_mesh',
  security: 'nav.security',
  analytics: 'nav.analytics'
};

interface PartnerI18nContextValue {
  language: UiLanguageCode;
  languageMeta: UiLanguageMeta;
  setLanguage: (lang: UiLanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  translateModuleTitle: (moduleId: string, fallbackTitle: string) => string;
  translateWorkspace: (workspace: string) => string;
  supportedLanguages: UiLanguageMeta[];
}

const PartnerI18nContext = createContext<PartnerI18nContextValue | null>(null);

export const PartnerI18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<UiLanguageCode>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem(UI_LANG_STORAGE_KEY);
      if (saved && ['en', 'hi', 'mr', 'bn', 'ta', 'te'].includes(saved)) {
        return saved as UiLanguageCode;
      }
    } catch {}
    return 'en';
  });

  const setLanguage = useCallback((nextLang: UiLanguageCode) => {
    setLanguageState(nextLang);
    try {
      localStorage.setItem(UI_LANG_STORAGE_KEY, nextLang);
      saveRxLanguage(nextLang.toUpperCase() as RxLanguageCode);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = nextLang;
      }
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('docsearch_ui_locale_sync');
        bc.postMessage({ type: 'LOCALE_CHANGED', language: nextLang });
        bc.close();
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel('docsearch_ui_locale_sync');
    bc.onmessage = (ev) => {
      if (ev.data?.type === 'LOCALE_CHANGED' && ev.data?.language) {
        setLanguageState(ev.data.language as UiLanguageCode);
      }
    };
    return () => bc.close();
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => translatePartnerUi(key, language, fallback),
    [language]
  );

  const translateModuleTitle = useCallback(
    (moduleId: string, fallbackTitle: string) => {
      if (language === 'en') return fallbackTitle;
      const directKey = MODULE_KEY_MAP[moduleId];
      if (directKey) return translatePartnerUi(directKey, language, fallbackTitle);
      const norm = moduleId.toLowerCase();
      for (const [pattern, dictKey] of Object.entries(MODULE_KEY_MAP)) {
        if (norm.includes(pattern)) {
          return translatePartnerUi(dictKey, language, fallbackTitle);
        }
      }
      return fallbackTitle;
    },
    [language]
  );

  const translateWorkspace = useCallback(
    (workspace: string) => translateWorkspaceLabel(workspace, language),
    [language]
  );

  const languageMeta =
    SUPPORTED_UI_LANGUAGES.find((l) => l.code === language) || SUPPORTED_UI_LANGUAGES[0]!;

  return (
    <PartnerI18nContext.Provider
      value={{
        language,
        languageMeta,
        setLanguage,
        t,
        translateModuleTitle,
        translateWorkspace,
        supportedLanguages: SUPPORTED_UI_LANGUAGES
      }}
    >
      {children}
    </PartnerI18nContext.Provider>
  );
};

export function usePartnerI18n(): PartnerI18nContextValue {
  const ctx = useContext(PartnerI18nContext);
  if (!ctx) {
    return {
      language: 'en',
      languageMeta: SUPPORTED_UI_LANGUAGES[0]!,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => translatePartnerUi(key, 'en', fallback),
      translateModuleTitle: (_id: string, fallback: string) => fallback,
      translateWorkspace: (ws: string) => ws.replace(/_/g, ' '),
      supportedLanguages: SUPPORTED_UI_LANGUAGES
    };
  }
  return ctx;
}
