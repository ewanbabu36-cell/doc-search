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
  hi: { name: 'Hindi', nativeName: 'हिन्दी (Hindi)', dir: 'ltr', flag: '🇮🇳' },
  ar: { name: 'Arabic (Middle East)', nativeName: 'العربية (Arabic)', dir: 'rtl', flag: '🇦🇪' },
  es: { name: 'Spanish', nativeName: 'Español (Spanish)', dir: 'ltr', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français (French)', dir: 'ltr', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch (German)', dir: 'ltr', flag: '🇩🇪' }
};

// Comprehensive Translations Dictionary for International UI
const TRANSLATIONS: Record<LocaleCode, Record<string, string>> = {
  en: {
    'company_platform': 'Company Platform',
    'enterprise_governance': 'Enterprise Governance',
    'quick_search': 'Quick Search',
    'settings': 'Settings',
    'logout': 'Logout',
    'overview': 'Executive Overview',
    'growth_engine': 'Growth & Organic Expansion',
    'executive_command': 'Executive & Command Center',
    'crm_partners': 'CRM & Partner Lifecycle',
    'products_plans': 'Product, Plans & Entitlements',
    'billing_finance': 'Billing, Invoicing & Global Tax',
    'sales_pipeline': 'Sales Pipeline & ARR Forecast',
    'customer_success': 'Customer Success & Support',
    'compliance_gov': 'Compliance, Regulatory & Data Governance',
    'security_rbac': 'Security, CloudHSM & SOC2 Audit',
    'api_integration': 'API, Interoperability & Webhooks',
    'company_admin': 'Company Admin & Corporate Governance',
    'active_doctors': 'Active Doctors Online',
    'live_consults': 'Live Consultations / Hr',
    'arr_revenue': 'Annual Recurring Revenue (ARR)',
    'emergency_sirens': 'National Emergency ER Sirens',
    'save_layout': 'Save Custom Layout',
    'reconcile_tax': 'Reconcile Global Tax Reserves',
    'panic_siren': 'National Panic Siren'
  },
  hi: {
    'company_platform': 'कंपनी एंटरप्राइज प्लेटफॉर्म',
    'enterprise_governance': 'कॉर्पोरेट प्रशासन और नियंत्रण',
    'quick_search': 'त्वरित खोज',
    'settings': 'सेटिंग्स',
    'logout': 'लॉगआउट',
    'overview': 'कार्यकारी अवलोकन',
    'growth_engine': 'विकास और विस्तार इंजन',
    'executive_command': 'कार्यकारी कमांड सेंटर',
    'crm_partners': 'सीआरएम और पार्टनर लाइफसाइकिल',
    'products_plans': 'उत्पाद, योजनाएं और पात्रता',
    'billing_finance': 'बिलिंग, चालान और वैश्विक कर',
    'sales_pipeline': 'बिक्री पाइपलाइन और एआरआर पूर्वानुमान',
    'customer_success': 'ग्राहक सफलता और सहायता',
    'compliance_gov': 'अनुपालन, नियामक और डेटा गवर्नेंस',
    'security_rbac': 'सुरक्षा, क्लाउडएचएसएम और एसओसी2 ऑडिट',
    'api_integration': 'एपीआई, इंटरऑपरेबिलिटी और वेबहुक',
    'company_admin': 'कंपनी प्रशासन और कानूनी शासन',
    'active_doctors': 'ऑनलाइन सक्रिय डॉक्टर',
    'live_consults': 'लाइव परामर्श / घंटा',
    'arr_revenue': 'वार्षिक आवर्ती राजस्व (ARR)',
    'emergency_sirens': 'राष्ट्रीय आपातकालीन एम्बुलेंस सायरन',
    'save_layout': 'कस्टम लेआउट सहेजें',
    'reconcile_tax': 'वैश्विक कर भंडार का मिलान करें',
    'panic_siren': 'राष्ट्रीय आपातकालीन सायरन'
  },
  ar: {
    'company_platform': 'منصة إدارة المؤسسات الصحية',
    'enterprise_governance': 'الحوكمة المؤسسية والامتثال',
    'quick_search': 'بحث سريع',
    'settings': 'الإعدادات',
    'logout': 'تسجيل الخروج',
    'overview': 'نظرة عامة تنفيذية',
    'growth_engine': 'محرك النمو والتوسع الصحي',
    'executive_command': 'مركز القيادة والعمليات الوطني',
    'crm_partners': 'إدارة علاقات الشركاء والمستشفيات',
    'products_plans': 'المنتجات والخطط وحزم الصلاحيات',
    'billing_finance': 'الفوترة والضرائب العالمية ودفتر الأستاذ',
    'sales_pipeline': 'خط مبيعات المستشفيات وتوقعات الإيرادات',
    'customer_success': 'نجاح العملاء والدعم الطبي الفوري',
    'compliance_gov': 'الامتثال وحوكمة البيانات الصحية',
    'security_rbac': 'الأمن السيبراني وتشفير المفاتيح والتدقيق',
    'api_integration': 'بوابة التكامل وتبادل البيانات الصحية',
    'company_admin': 'إدارة الشركة والسجلات النظامية',
    'active_doctors': 'أطباء نشطون متصلون',
    'live_consults': 'استشارات طبية مباشرة / ساعة',
    'arr_revenue': 'الإيرادات السنوية المتكررة (ARR)',
    'emergency_sirens': 'صفارات إنذار طوارئ الإسعاف',
    'save_layout': 'حفظ التخطيط المخصص',
    'reconcile_tax': 'تسوية احتياطيات الضرائب العالمية',
    'panic_siren': 'إنذار الطوارئ الوطني'
  },
  es: {
    'company_platform': 'Plataforma Corporativa de Salud',
    'enterprise_governance': 'Gobernanza Empresarial',
    'quick_search': 'Búsqueda Rápida',
    'settings': 'Ajustes',
    'logout': 'Cerrar Sesión',
    'overview': 'Resumen Ejecutivo',
    'growth_engine': 'Motor de Crecimiento',
    'executive_command': 'Centro de Comando Ejecutivo',
    'crm_partners': 'CRM y Ciclo de Socios',
    'products_plans': 'Productos, Planes y Derechos',
    'billing_finance': 'Facturación, Finanzas e Impuestos',
    'sales_pipeline': 'Embudo de Ventas y Pronóstico ARR',
    'customer_success': 'Éxito del Cliente y Soporte',
    'compliance_gov': 'Cumplimiento y Gobernanza de Datos',
    'security_rbac': 'Seguridad y Auditoría SOC2',
    'api_integration': 'API, Interoperabilidad y Webhooks',
    'company_admin': 'Administración Corporativa',
    'active_doctors': 'Médicos Activos Conectados',
    'live_consults': 'Consultas en Vivo / Hora',
    'arr_revenue': 'Ingresos Recurrentes Anuales (ARR)',
    'emergency_sirens': 'Sirenas de Emergencia Nacional',
    'save_layout': 'Guardar Diseño Personalizado',
    'reconcile_tax': 'Conciliar Reservas Fiscales',
    'panic_siren': 'Sirena de Emergencia Nacional'
  },
  fr: {
    'company_platform': 'Plateforme Entreprise de Santé',
    'enterprise_governance': 'Gouvernance d\'Entreprise',
    'quick_search': 'Recherche Rapide',
    'settings': 'Paramètres',
    'logout': 'Déconnexion',
    'overview': 'Aperçu Exécutif',
    'growth_engine': 'Moteur de Croissance',
    'executive_command': 'Centre de Commandement Exécutif',
    'crm_partners': 'CRM & Cycle de Vie Partenaires',
    'products_plans': 'Produits, Forfaits & Droits',
    'billing_finance': 'Facturation, Finances & Taxes',
    'sales_pipeline': 'Pipeline Commercial & Prévisions ARR',
    'customer_success': 'Succès Client & Support',
    'compliance_gov': 'Conformité & Gouvernance des Données',
    'security_rbac': 'Sécurité & Audit SOC2',
    'api_integration': 'API, Interopérabilité & Webhooks',
    'company_admin': 'Administration d\'Entreprise',
    'active_doctors': 'Médecins Actifs en Ligne',
    'live_consults': 'Consultations en Direct / H',
    'arr_revenue': 'Revenu Récurrent Annuel (ARR)',
    'emergency_sirens': 'Sirènes d\'Urgence Nationale',
    'save_layout': 'Enregistrer la Disposition',
    'reconcile_tax': 'Rapprocher les Réserves Fiscales',
    'panic_siren': 'Sirène d\'Urgence Nationale'
  },
  de: {
    'company_platform': 'Unternehmens-Gesundheitsplattform',
    'enterprise_governance': 'Unternehmensführung & Compliance',
    'quick_search': 'Schnellsuche',
    'settings': 'Einstellungen',
    'logout': 'Abmelden',
    'overview': 'Führungsübersicht',
    'growth_engine': 'Wachstumsmotor',
    'executive_command': 'Führungs- & Kontrollzentrum',
    'crm_partners': 'CRM & Partnerlebenszyklus',
    'products_plans': 'Produkte, Pläne & Berechtigungen',
    'billing_finance': 'Abrechnung, Finanzen & Globale Steuern',
    'sales_pipeline': 'Vertriebspipeline & ARR-Prognose',
    'customer_success': 'Kundenerfolg & Support',
    'compliance_gov': 'Compliance & Datenverwaltung',
    'security_rbac': 'Sicherheit & SOC2-Audit',
    'api_integration': 'API, Interoperabilität & Webhooks',
    'company_admin': 'Unternehmensverwaltung',
    'active_doctors': 'Aktive Ärzte Online',
    'live_consults': 'Live-Konsultationen / Std',
    'arr_revenue': 'Jährlich Wiederkehrender Umsatz (ARR)',
    'emergency_sirens': 'Nationale Notfall-Sirenen',
    'save_layout': 'Benutzerdefiniertes Layout speichern',
    'reconcile_tax': 'Globale Steuerrücklagen abgleichen',
    'panic_siren': 'Nationaler Notfallalarm'
  }
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
  t: (key: string, defaultText?: string) => string;
  lastSwitchBanner: string | null;
}

const GlobalCurrencyLocaleContext = createContext<GlobalCurrencyLocaleContextType | undefined>(undefined);

export const GlobalCurrencyLocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [locale, setLocaleState] = useState<LocaleCode>('en');
  const [fontSizeScale, setFontSizeScale] = useState<number>(100);
  const [visionMode, setVisionMode] = useState<VisionMode>('NORMAL');
  const [typographyMode, setTypographyMode] = useState<TypographyMode>('STANDARD');
  const [highContrastMode, setHighContrastMode] = useState<HighContrastMode>('OFF');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [screenReaderActive, setScreenReaderActive] = useState<boolean>(false);
  const [lastSwitchBanner, setLastSwitchBanner] = useState<string | null>(null);

  const direction = LOCALE_REGISTRY[locale].dir;

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    const curr = CURRENCY_REGISTRY[c];
    setLastSwitchBanner(`🌐 Currency switched to ${curr.name} (${curr.symbol} ${c}) • Real-time FX conversion applied across all financial ledgers!`);
    setTimeout(() => setLastSwitchBanner(null), 4500);
  };

  const setLocale = (l: LocaleCode) => {
    setLocaleState(l);
    const loc = LOCALE_REGISTRY[l];
    setLastSwitchBanner(`🗣️ Locale switched to ${loc.nativeName} (${loc.name}) ${loc.dir === 'rtl' ? '• [RTL Layout Auto-Flipped]' : ''}!`);
    setTimeout(() => setLastSwitchBanner(null), 4500);
  };

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
    if (direction === 'rtl') {
      document.body.style.direction = 'rtl';
      document.body.style.textAlign = 'right';
    } else {
      document.body.style.direction = 'ltr';
      document.body.style.textAlign = 'left';
    }
  }, [direction, locale]);

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[locale];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return defaultText || key;
  };

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
        formatMoney,
        t,
        lastSwitchBanner
      }}
    >
      <div
        style={{
          direction,
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
        {lastSwitchBanner && (
          <div
            style={{
              position: 'fixed',
              top: '50px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#0F172A',
              color: '#38BDF8',
              border: '2px solid #06B6D4',
              borderRadius: '30px',
              padding: '8px 24px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              boxShadow: '0 10px 40px rgba(6, 182, 212, 0.6)',
              zIndex: 10080,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <span>⚡</span>
            <span>{lastSwitchBanner}</span>
          </div>
        )}
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
