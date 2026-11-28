import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken } from '../../services/api-client.js';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'SAR';
export type LocaleCode = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te' | 'es' | 'fr' | 'de' | 'ar';
export type VisionMode = 'NORMAL' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA';
export type TypographyMode = 'STANDARD' | 'DYSLEXIC';
export type HighContrastMode = 'OFF' | 'BLACK_WHITE_HIGH_CONTRAST' | 'YELLOW_BLACK_SURGICAL';

export interface CurrencyRate {
  symbol: string;
  rateToInr: number;
  name: string;
  flag: string;
  inverseInr?: number;
}

export const BASELINE_CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyRate> = {
  INR: { symbol: '₹', rateToInr: 1.0, name: 'Indian Rupee', flag: '🇮🇳', inverseInr: 1.0 },
  USD: { symbol: '$', rateToInr: 0.0118, name: 'US Dollar', flag: '🇺🇸', inverseInr: 84.75 },
  EUR: { symbol: '€', rateToInr: 0.0111, name: 'Euro', flag: '🇪🇺', inverseInr: 90.09 },
  GBP: { symbol: '£', rateToInr: 0.00938, name: 'British Pound', flag: '🇬🇧', inverseInr: 106.61 },
  AED: { symbol: 'د.إ', rateToInr: 0.0435, name: 'UAE Dirham', flag: '🇦🇪', inverseInr: 23.08 },
  SGD: { symbol: 'S$', rateToInr: 0.0159, name: 'Singapore Dollar', flag: '🇸🇬', inverseInr: 62.89 },
  SAR: { symbol: '﷼', rateToInr: 0.0444, name: 'Saudi Riyal', flag: '🇸🇦', inverseInr: 22.52 }
};

export const LOCALE_REGISTRY: Record<LocaleCode, { name: string; nativeName: string; dir: 'ltr' | 'rtl'; flag: string }> = {
  en: { name: 'English (US/UK)', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी (Hindi)', dir: 'ltr', flag: '🇮🇳' },
  mr: { name: 'Marathi', nativeName: 'मराठी (Marathi)', dir: 'ltr', flag: '🇮🇳' },
  bn: { name: 'Bengali', nativeName: 'বাংলা (Bengali)', dir: 'ltr', flag: '🇮🇳' },
  ta: { name: 'Tamil', nativeName: 'தமிழ் (Tamil)', dir: 'ltr', flag: '🇮🇳' },
  te: { name: 'Telugu', nativeName: 'తెలుగు (Telugu)', dir: 'ltr', flag: '🇮🇳' },
  ar: { name: 'Arabic (Middle East)', nativeName: 'العربية (Arabic)', dir: 'rtl', flag: '🇦🇪' },
  es: { name: 'Spanish', nativeName: 'Español (Spanish)', dir: 'ltr', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français (French)', dir: 'ltr', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch (German)', dir: 'ltr', flag: '🇩🇪' }
};

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
  },
  mr: {
    'company_platform': 'कंपनी एंटरप्राइझ प्लॅटफॉर्म',
    'enterprise_governance': 'कॉर्पोरेट प्रशासन व नियंत्रण',
    'quick_search': 'त्वरित शोध',
    'settings': 'सेटिंग्ज',
    'logout': 'लॉगआउट',
    'overview': 'कार्यकारी आढावा',
    'growth_engine': 'वाढ आणि विस्तार इंजिन',
    'executive_command': 'कार्यकारी कमांड सेंटर',
    'crm_partners': 'CRM व पार्टनर लाइफसायकल',
    'products_plans': 'उत्पादने, प्लॅन्स व हक्क',
    'billing_finance': 'बिलिंग, चलन व कर',
    'sales_pipeline': 'विक्री पाइपलाइन व ARR अंदाज',
    'customer_success': 'ग्राहक यश व सहाय्य',
    'compliance_gov': 'अनुपालन व डेटा गव्हर्नन्स',
    'security_rbac': 'सुरक्षा, CloudHSM व SOC2 ऑडिट',
    'api_integration': 'API, इंटरऑपरेबिलिटी व वेबहुक्स',
    'company_admin': 'कंपनी प्रशासन व शासन',
    'active_doctors': 'सक्रिय डॉक्टर ऑनलाइन',
    'live_consults': 'थेट सल्लामसलत / तास',
    'arr_revenue': 'वार्षिक आवर्ती महसूल (ARR)',
    'emergency_sirens': 'राष्ट्रीय आपत्कालीन सायरन',
    'save_layout': 'कस्टम लेआउट जतन करा',
    'reconcile_tax': 'जागतिक कर राखीव समेट करा',
    'panic_siren': 'राष्ट्रीय आपत्कालीन सायरन'
  },
  bn: {
    'company_platform': 'কোম্পানি এন্টারপ্রাইজ প্ল্যাটফর্ম',
    'enterprise_governance': 'কর্পোরেট গভর্ন্যান্স ও নিয়ন্ত্রণ',
    'quick_search': 'দ্রুত অনুসন্ধান',
    'settings': 'সেটিংস',
    'logout': 'লগআউট',
    'overview': 'এক্সিকিউটিভ ওভারভিউ',
    'growth_engine': 'গ্রোথ ও সম্প্রসারণ ইঞ্জিন',
    'executive_command': 'এক্সিকিউটিভ কমান্ড সেন্টার',
    'crm_partners': 'CRM ও পার্টনার লাইফসাইকেল',
    'products_plans': 'প্রোডাক্ট, প্ল্যান ও অধিকার',
    'billing_finance': 'বিলিং, ইনভয়েসিং ও কর',
    'sales_pipeline': 'সেলস পাইপলাইন ও ARR পূর্বাভাস',
    'customer_success': 'কাস্টমার সাকসেস ও সাপোর্ট',
    'compliance_gov': 'কমপ্লায়েন্স ও ডেটা গভর্ন্যান্স',
    'security_rbac': 'নিরাপত্তা ও SOC2 অডিট',
    'api_integration': 'API ও ওয়েববুক ইন্টিগ্রেশন',
    'company_admin': 'কোম্পানি অ্যাডমিন',
    'active_doctors': 'অনলাইন সক্রিয় ডাক্তার',
    'live_consults': 'লাইভ পরামর্শ / ঘণ্টা',
    'arr_revenue': 'বার্ষিক পুনরাবৃত্ত রাজস্ব (ARR)',
    'emergency_sirens': 'জাতীয় জরুরি অ্যাম্বুলেন্স সাইরেন',
    'save_layout': 'কাস্টম লেআউট সংরক্ষণ করুন',
    'reconcile_tax': 'ট্যাক্স রিজার্ভ মিলান',
    'panic_siren': 'জাতীয় জরুরি সাইরেন'
  },
  ta: {
    'company_platform': 'நிறுவன மருத்துவத் தளம்',
    'enterprise_governance': 'நிறுவன நிர்வாகம்',
    'quick_search': 'விரைவு தேடல்',
    'settings': 'அமைப்புகள்',
    'logout': 'வெளியேறு',
    'overview': 'செயல் மேலோட்டம்',
    'growth_engine': 'வளர்ச்சி இயந்திரம்',
    'executive_command': 'கட்டளை மையம்',
    'crm_partners': 'CRM & கூட்டாளர் மேலாண்மை',
    'products_plans': 'தயாரிப்புகள் & திட்டங்கள்',
    'billing_finance': 'பில்லிங் & வரி கணக்கு',
    'sales_pipeline': 'விற்பனை & ARR கணிப்பு',
    'customer_success': 'வாடிக்கையாளர் ஆதரவு',
    'compliance_gov': 'ஒழுங்குமுறை இணக்கம்',
    'security_rbac': 'பாதுகாப்பு & SOC2 தணிக்கை',
    'api_integration': 'API & வெப்ஹூக்குகள்',
    'company_admin': 'நிறுவன நிர்வாகம்',
    'active_doctors': 'ஆன்லைன் மருத்துவர்கள்',
    'live_consults': 'நேரலை ஆலோசனைகள் / மணி',
    'arr_revenue': 'வருடாந்திர வருவாய் (ARR)',
    'emergency_sirens': 'தேசிய அவசர சைரன்',
    'save_layout': 'தனிப்பயன் அமைப்பைச் சேமி',
    'reconcile_tax': 'வரி இருப்புகளைச் சரிசெய்',
    'panic_siren': 'தேசிய அவசர எச்சரிக்கை'
  },
  te: {
    'company_platform': 'కంపెనీ ఎంటర్‌ప్రైజ్ ప్లాట్‌ఫారమ్',
    'enterprise_governance': 'కార్పొరేట్ గవర్నెన్స్',
    'quick_search': 'త్వరిత శోధన',
    'settings': 'సెట్టింగ్‌లు',
    'logout': 'లాగ్అవుట్',
    'overview': 'ఎగ్జిక్యూటివ్ అవలోకనం',
    'growth_engine': 'గ్రోత్ ఇంజిన్',
    'executive_command': 'కమాండ్ సెంటర్',
    'crm_partners': 'CRM & భాగస్వామి నిర్వహణ',
    'products_plans': 'ఉత్పత్తులు & ప్లాన్‌లు',
    'billing_finance': 'బిల్లింగ్ & పన్నులు',
    'sales_pipeline': 'సేల్స్ & ARR అంచనా',
    'customer_success': 'కస్టమర్ సపోర్ట్',
    'compliance_gov': 'డేటా గవర్నెన్స్',
    'security_rbac': 'భద్రత & SOC2 ఆడిట్',
    'api_integration': 'API & వెబ్‌హుక్స్',
    'company_admin': 'కంపెనీ అడ్మిన్',
    'active_doctors': 'ఆన్‌లైన్ వైద్యులు',
    'live_consults': 'లైవ్ కన్సల్టేషన్స్ / గం',
    'arr_revenue': 'వార్షిక ఆదాయం (ARR)',
    'emergency_sirens': 'జాతీయ అత్యవసర సైరన్లు',
    'save_layout': 'లేఅవుట్ సేవ్ చేయండి',
    'reconcile_tax': 'పన్ను నిల్వలను సరిచూడండి',
    'panic_siren': 'జాతీయ అత్యవసర సైరన్'
  }
};

interface GlobalCurrencyLocaleContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Record<CurrencyCode, CurrencyRate>;
  isLiveFxConnected: boolean;
  lastFxSyncTime: string;
  refreshLiveFxRates: () => Promise<void>;
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
  const [rates, setRates] = useState<Record<CurrencyCode, CurrencyRate>>(BASELINE_CURRENCY_REGISTRY);
  const [isLiveFxConnected, setIsLiveFxConnected] = useState<boolean>(true);
  const [lastFxSyncTime, setLastFxSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [fontSizeScale, setFontSizeScale] = useState<number>(100);
  const [visionMode, setVisionMode] = useState<VisionMode>('NORMAL');
  const [typographyMode, setTypographyMode] = useState<TypographyMode>('STANDARD');
  const [highContrastMode, setHighContrastMode] = useState<HighContrastMode>('OFF');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [screenReaderActive, setScreenReaderActive] = useState<boolean>(false);
  const [lastSwitchBanner, setLastSwitchBanner] = useState<string | null>(null);

  const direction = LOCALE_REGISTRY[locale].dir;

  const refreshLiveFxRates = useCallback(async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v1/company/treasury/fx-rates', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.rates) {
          setRates(json.data.rates);
          setIsLiveFxConnected(true);
          setLastFxSyncTime(new Date().toLocaleTimeString());
        }
      }
    } catch {
      // Keep baseline
    }
  }, []);

  useEffect(() => {
    void refreshLiveFxRates();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void refreshLiveFxRates();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshLiveFxRates]);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    const curr = rates[c] || BASELINE_CURRENCY_REGISTRY[c];
    setLastSwitchBanner(`🌐 Currency switched to ${curr.name} (${curr.symbol} ${c}) • Interbank rate 1 ${c} = ₹ ${curr.inverseInr || (1/curr.rateToInr).toFixed(2)}`);
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
    const curr = rates[currency] || BASELINE_CURRENCY_REGISTRY[currency];
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
        rates,
        isLiveFxConnected,
        lastFxSyncTime,
        refreshLiveFxRates,
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
