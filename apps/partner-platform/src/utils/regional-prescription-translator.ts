/**
 * DocSearch Regional Prescription Vernacular Translation Engine
 * -------------------------------------------------------------
 * Translates medical dosage timing, frequencies, and food relations
 * into major Indian vernacular languages (Hindi, Bengali, Marathi, Tamil, Telugu)
 * as well as romanized phonetic scripts for ESC/POS thermal hardware printers.
 */

export type RxLanguageCode = 'EN' | 'HI' | 'BN' | 'MR' | 'TA' | 'TE';

export interface RxLanguageOption {
  code: RxLanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_RX_LANGUAGES: RxLanguageOption[] = [
  { code: 'EN', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'HI', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
  { code: 'BN', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳' },
  { code: 'MR', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳' },
  { code: 'TA', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
  { code: 'TE', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳' }
];

export interface TranslatedDosage {
  nativeScript: string;
  romanized: string;
  english: string;
  language: RxLanguageCode;
}

// Frequency Dictionaries
const FREQ_NATIVE: Record<RxLanguageCode, Record<string, string>> = {
  EN: {
    '1-0-1': 'Morning 1, Night 1',
    '1-0-0': 'Morning 1',
    '0-0-1': 'Night 1',
    '0-1-0': 'Afternoon 1',
    '1-1-1': 'Morning 1, Afternoon 1, Night 1',
    '1-1-1-1': 'Four times daily (Every 6 hrs)',
    'SOS': 'As needed (When required)',
    'STAT': 'Immediately (Single dose)',
    'ONCE_WEEKLY': 'Once a week'
  },
  HI: {
    '1-0-1': 'सुबह 1, रात 1',
    '1-0-0': 'सुबह 1',
    '0-0-1': 'रात 1',
    '0-1-0': 'दोपहर 1',
    '1-1-1': 'सुबह 1, दोपहर 1, रात 1',
    '1-1-1-1': 'दिन में 4 बार (हर 6 घंटे)',
    'SOS': 'ज़रूरत पड़ने पर',
    'STAT': 'तुरंत (एक बार)',
    'ONCE_WEEKLY': 'हफ्ते में 1 बार'
  },
  BN: {
    '1-0-1': 'সকালে ১, রাতে ১',
    '1-0-0': 'সকালে ১',
    '0-0-1': 'রাতে ১',
    '0-1-0': 'দুপুরে ১',
    '1-1-1': 'সকালে ১, দুপুরে ১, রাতে ১',
    '1-1-1-1': 'দিনে ৪ বার (প্রতি ৬ ঘণ্টায়)',
    'SOS': 'প্রয়োজন হলে',
    'STAT': 'অবিলম্বে (একবার)',
    'ONCE_WEEKLY': 'সপ্তাহে ১ বার'
  },
  MR: {
    '1-0-1': 'सकाळी 1, रात्री 1',
    '1-0-0': 'सकाळी 1',
    '0-0-1': 'रात्री 1',
    '0-1-0': 'दुपारी 1',
    '1-1-1': 'सकाळी 1, दुपारी 1, रात्री 1',
    '1-1-1-1': 'दिवसातून 4 वेळा (दर 6 तासांनी)',
    'SOS': 'गरज भासल्यास',
    'STAT': 'तात्काळ (एकदा)',
    'ONCE_WEEKLY': 'आठवड्यातून 1 वेळा'
  },
  TA: {
    '1-0-1': 'காலை 1, இரவு 1',
    '1-0-0': 'காலை 1',
    '0-0-1': 'இரவு 1',
    '0-1-0': 'மதியம் 1',
    '1-1-1': 'காலை 1, மதியம் 1, இரவு 1',
    '1-1-1-1': 'நாளில் 4 முறை (ஒவ்வொரு 6 மணி நேரமும்)',
    'SOS': 'தேவைப்படும் போது',
    'STAT': 'உடனடியாக (ஒரு முறை)',
    'ONCE_WEEKLY': 'வாரத்திற்கு 1 முறை'
  },
  TE: {
    '1-0-1': 'ఉదయం 1, రాత్రి 1',
    '1-0-0': 'ఉదయం 1',
    '0-0-1': 'రాత్రి 1',
    '0-1-0': 'మధ్యాహ్నం 1',
    '1-1-1': 'ఉదయం 1, మధ్యాహ్నం 1, రాత్రి 1',
    '1-1-1-1': 'రోజుకు 4 సార్లు (ప్రతి 6 గంటలకు)',
    'SOS': 'అవసరమైనప్పుడు',
    'STAT': 'వెంటనే (ఒక్కసారి)',
    'ONCE_WEEKLY': 'వారానికి 1 సార్లు'
  }
};

const FREQ_ROMANIZED: Record<RxLanguageCode, Record<string, string>> = {
  EN: {
    '1-0-1': 'Morning 1, Night 1',
    '1-0-0': 'Morning 1',
    '0-0-1': 'Night 1',
    '0-1-0': 'Afternoon 1',
    '1-1-1': 'Morning 1, Afternoon 1, Night 1',
    '1-1-1-1': '4 Times Daily (Every 6 hrs)',
    'SOS': 'As needed',
    'STAT': 'Immediately',
    'ONCE_WEEKLY': 'Once a week'
  },
  HI: {
    '1-0-1': 'Subah 1, Raat 1',
    '1-0-0': 'Subah 1',
    '0-0-1': 'Raat 1',
    '0-1-0': 'Dopahar 1',
    '1-1-1': 'Subah 1, Dopahar 1, Raat 1',
    '1-1-1-1': 'Din mein 4 baar (Har 6 ghante)',
    'SOS': 'Zaroorat padne par',
    'STAT': 'Turant (Ek baar)',
    'ONCE_WEEKLY': 'Hafte mein 1 baar'
  },
  BN: {
    '1-0-1': 'Sokale 1, Raate 1',
    '1-0-0': 'Sokale 1',
    '0-0-1': 'Raate 1',
    '0-1-0': 'Dupure 1',
    '1-1-1': 'Sokale 1, Dupure 1, Raate 1',
    '1-1-1-1': 'Dine 4 baar',
    'SOS': 'Proyojon hole',
    'STAT': 'Obilombe (Ekbar)',
    'ONCE_WEEKLY': 'Soptah-e 1 baar'
  },
  MR: {
    '1-0-1': 'Sakali 1, Ratri 1',
    '1-0-0': 'Sakali 1',
    '0-0-1': 'Ratri 1',
    '0-1-0': 'Dupari 1',
    '1-1-1': 'Sakali 1, Dupari 1, Ratri 1',
    '1-1-1-1': 'Divasatun 4 vela',
    'SOS': 'Garaj bhaslyas',
    'STAT': 'Tatkal (Ekda)',
    'ONCE_WEEKLY': 'Aathvadyatun 1 vela'
  },
  TA: {
    '1-0-1': 'Kaalai 1, Iravu 1',
    '1-0-0': 'Kaalai 1',
    '0-0-1': 'Iravu 1',
    '0-1-0': 'Mathiyam 1',
    '1-1-1': 'Kaalai 1, Mathiyam 1, Iravu 1',
    '1-1-1-1': 'Naalil 4 murai',
    'SOS': 'Thevaipadum pothu',
    'STAT': 'Udanadiyaaga',
    'ONCE_WEEKLY': 'Vaarathirku 1 murai'
  },
  TE: {
    '1-0-1': 'Udayam 1, Raatri 1',
    '1-0-0': 'Udayam 1',
    '0-0-1': 'Raatri 1',
    '0-1-0': 'Madhyaahnam 1',
    '1-1-1': 'Udayam 1, Madhyaahnam 1, Raatri 1',
    '1-1-1-1': 'Rojuku 4 saarlu',
    'SOS': 'Avasaramainappudu',
    'STAT': 'Ventane (Okkasaari)',
    'ONCE_WEEKLY': 'Vaaraaniki 1 saari'
  }
};

// Food Relation Dictionaries
const TIMING_NATIVE: Record<RxLanguageCode, Record<string, string>> = {
  EN: {
    AFTER_FOOD: 'After food',
    AFTER_MEALS: 'After food',
    BEFORE_FOOD: 'Before food',
    BEFORE_MEALS: 'Before food',
    EMPTY_STOMACH: 'Empty stomach (Early morning)',
    BEDTIME: 'At bedtime',
    WITH_FOOD: 'With meals',
    WITH_MEALS: 'With meals'
  },
  HI: {
    AFTER_FOOD: 'खाने के बाद',
    AFTER_MEALS: 'खाने के बाद',
    BEFORE_FOOD: 'खाने से पहले',
    BEFORE_MEALS: 'खाने से पहले',
    EMPTY_STOMACH: 'खाली पेट',
    BEDTIME: 'सोने से पहले',
    WITH_FOOD: 'खाने के साथ',
    WITH_MEALS: 'खाने के साथ'
  },
  BN: {
    AFTER_FOOD: 'খাওয়ার পর',
    AFTER_MEALS: 'খাওয়ার পর',
    BEFORE_FOOD: 'খাওয়ার আগে',
    BEFORE_MEALS: 'খাওয়ার আগে',
    EMPTY_STOMACH: 'খালি পেটে',
    BEDTIME: 'ঘুমানোর আগে',
    WITH_FOOD: 'খাবারের সাথে',
    WITH_MEALS: 'খাবারের সাথে'
  },
  MR: {
    AFTER_FOOD: 'जेवणानंतर',
    AFTER_MEALS: 'जेवणानंतर',
    BEFORE_FOOD: 'जेवणापूर्वी',
    BEFORE_MEALS: 'जेवणापूर्वी',
    EMPTY_STOMACH: 'उपाशी पोटी',
    BEDTIME: 'झोपण्यापूर्वी',
    WITH_FOOD: 'जेवणासोबत',
    WITH_MEALS: 'जेवणासोबत'
  },
  TA: {
    AFTER_FOOD: 'உணவுக்குப் பின்',
    AFTER_MEALS: 'உணவுக்குப் பின்',
    BEFORE_FOOD: 'உணவுக்கு முன்',
    BEFORE_MEALS: 'உணவுக்கு முன்',
    EMPTY_STOMACH: 'வெறும் வயிற்றில்',
    BEDTIME: 'தூங்கும் முன்',
    WITH_FOOD: 'உணவுடன்',
    WITH_MEALS: 'உணவுடன்'
  },
  TE: {
    AFTER_FOOD: 'భోజనం తర్వాత',
    AFTER_MEALS: 'భోజనం తర్వాత',
    BEFORE_FOOD: 'భోజనానికి ముందు',
    BEFORE_MEALS: 'భోజనానికి ముందు',
    EMPTY_STOMACH: 'ఖాళీ కడుపుతో',
    BEDTIME: 'పడుకునే ముందు',
    WITH_FOOD: 'ఆహారంతో',
    WITH_MEALS: 'ఆహారంతో'
  }
};

const TIMING_ROMANIZED: Record<RxLanguageCode, Record<string, string>> = {
  EN: {
    AFTER_FOOD: 'After food',
    AFTER_MEALS: 'After food',
    BEFORE_FOOD: 'Before food',
    BEFORE_MEALS: 'Before food',
    EMPTY_STOMACH: 'Empty stomach',
    BEDTIME: 'At bedtime',
    WITH_FOOD: 'With meals',
    WITH_MEALS: 'With meals'
  },
  HI: {
    AFTER_FOOD: 'Khane ke baad',
    AFTER_MEALS: 'Khane ke baad',
    BEFORE_FOOD: 'Khane se pehle',
    BEFORE_MEALS: 'Khane se pehle',
    EMPTY_STOMACH: 'Khali pet',
    BEDTIME: 'Sone se pehle',
    WITH_FOOD: 'Khane ke saath',
    WITH_MEALS: 'Khane ke saath'
  },
  BN: {
    AFTER_FOOD: 'Khaowar por',
    AFTER_MEALS: 'Khaowar por',
    BEFORE_FOOD: 'Khaowar aage',
    BEFORE_MEALS: 'Khaowar aage',
    EMPTY_STOMACH: 'Khali pete',
    BEDTIME: 'Ghumanor aage',
    WITH_FOOD: 'Khabarer sathe',
    WITH_MEALS: 'Khabarer sathe'
  },
  MR: {
    AFTER_FOOD: 'Jevananantar',
    AFTER_MEALS: 'Jevananantar',
    BEFORE_FOOD: 'Jevanapurvi',
    BEFORE_MEALS: 'Jevanapurvi',
    EMPTY_STOMACH: 'Upashi poti',
    BEDTIME: 'Zhopanyapurvi',
    WITH_FOOD: 'Jevanasobat',
    WITH_MEALS: 'Jevanasobat'
  },
  TA: {
    AFTER_FOOD: 'Unavukku pin',
    AFTER_MEALS: 'Unavukku pin',
    BEFORE_FOOD: 'Unavukku mun',
    BEFORE_MEALS: 'Unavukku mun',
    EMPTY_STOMACH: 'Verum vayitril',
    BEDTIME: 'Thoongum mun',
    WITH_FOOD: 'Unavudan',
    WITH_MEALS: 'Unavudan'
  },
  TE: {
    AFTER_FOOD: 'Bhojanam taruvaatha',
    AFTER_MEALS: 'Bhojanam taruvaatha',
    BEFORE_FOOD: 'Bhojanaaniki mundu',
    BEFORE_MEALS: 'Bhojanaaniki mundu',
    EMPTY_STOMACH: 'Khaalee kaduputho',
    BEDTIME: 'Padukune mundu',
    WITH_FOOD: 'Aahaaramtho',
    WITH_MEALS: 'Aahaaramtho'
  }
};

const DURATION_UNITS: Record<RxLanguageCode, { day: string; days: string }> = {
  EN: { day: 'Day', days: 'Days' },
  HI: { day: 'दिन', days: 'दिन' },
  BN: { day: 'দিন', days: 'দিন' },
  MR: { day: 'दिवस', days: 'दिवस' },
  TA: { day: 'நாள்', days: 'நாட்கள்' },
  TE: { day: 'రోజు', days: 'రోజులు' }
};

const DURATION_UNITS_ROMANIZED: Record<RxLanguageCode, { day: string; days: string }> = {
  EN: { day: 'Day', days: 'Days' },
  HI: { day: 'Din', days: 'Din' },
  BN: { day: 'Din', days: 'Din' },
  MR: { day: 'Divas', days: 'Divas' },
  TA: { day: 'Naal', days: 'Naatkal' },
  TE: { day: 'Roju', days: 'Rojulu' }
};

/**
 * Normalizes input frequency to canonical format (e.g. "1 - 0 - 1" -> "1-0-1")
 */
function normalizeFrequency(freq: string): string {
  if (!freq) return '1-0-1';
  const clean = freq.trim().replace(/\s+/g, '');
  if (clean === '1-0-1' || clean === '1-0-0' || clean === '0-0-1' || clean === '0-1-0' || clean === '1-1-1' || clean === '1-1-1-1') {
    return clean;
  }
  const upper = clean.toUpperCase();
  if (upper.includes('SOS')) return 'SOS';
  if (upper.includes('STAT')) return 'STAT';
  if (upper.includes('WEEK') || upper.includes('QW')) return 'ONCE_WEEKLY';
  if (upper === 'OD') return '1-0-0';
  if (upper === 'BD') return '1-0-1';
  if (upper === 'TDS' || upper === 'TID') return '1-1-1';
  if (upper === 'QID') return '1-1-1-1';
  if (upper === 'HS') return '0-0-1';
  return clean;
}

/**
 * Normalizes input timing/food relation to canonical key
 */
function normalizeTiming(timing: string): string {
  if (!timing) return 'AFTER_FOOD';
  const clean = timing.trim().toUpperCase().replace(/\s+/g, '_');
  if (clean.includes('BEFORE') || clean === 'AC') return 'BEFORE_FOOD';
  if (clean.includes('EMPTY') || clean.includes('FASTING')) return 'EMPTY_STOMACH';
  if (clean.includes('BED') || clean.includes('NIGHT') || clean === 'HS') return 'BEDTIME';
  if (clean.includes('WITH')) return 'WITH_FOOD';
  return 'AFTER_FOOD';
}

/**
 * Core translation function: Translates dosage, frequency, food relation and duration
 * into native script, romanized transliteration, and standard English.
 */
export function translateDosageInstructions(params: {
  frequency: string;
  timing?: string;
  duration?: number | string;
  lang?: RxLanguageCode | string;
  customInstructions?: string;
}): TranslatedDosage {
  const lang: RxLanguageCode = (['EN', 'HI', 'BN', 'MR', 'TA', 'TE'].includes(params.lang as string)
    ? params.lang
    : 'EN') as RxLanguageCode;

  const normFreq = normalizeFrequency(params.frequency);
  const normTiming = normalizeTiming(params.timing || 'AFTER_FOOD');
  const durNum = Math.max(1, parseInt(String(params.duration || 5), 10) || 5);

  // English fallback
  const engFreqStr = FREQ_NATIVE.EN[normFreq] || params.frequency;
  const engTimingStr = TIMING_NATIVE.EN[normTiming] || params.timing || 'After food';
  const engDurationStr = `${durNum} ${durNum === 1 ? DURATION_UNITS.EN.day : DURATION_UNITS.EN.days}`;
  const english = `${engFreqStr} • ${engTimingStr} (${engDurationStr})${params.customInstructions ? ` [${params.customInstructions}]` : ''}`;

  if (lang === 'EN') {
    return {
      nativeScript: english,
      romanized: english,
      english,
      language: 'EN'
    };
  }

  // Native Script
  const nativeFreq = FREQ_NATIVE[lang]?.[normFreq] || engFreqStr;
  const nativeTiming = TIMING_NATIVE[lang]?.[normTiming] || engTimingStr;
  const nativeUnit = durNum === 1 ? DURATION_UNITS[lang]?.day : DURATION_UNITS[lang]?.days;
  const nativeDuration = `${durNum} ${nativeUnit || 'दिन'}`;
  const nativeScript = `${nativeFreq} — ${nativeTiming} (${nativeDuration})${params.customInstructions ? ` [${params.customInstructions}]` : ''}`;

  // Romanized Transliteration (Hardware printer friendly)
  const romFreq = FREQ_ROMANIZED[lang]?.[normFreq] || engFreqStr;
  const romTiming = TIMING_ROMANIZED[lang]?.[normTiming] || engTimingStr;
  const romUnit = durNum === 1 ? DURATION_UNITS_ROMANIZED[lang]?.day : DURATION_UNITS_ROMANIZED[lang]?.days;
  const romDuration = `${durNum} ${romUnit || 'Din'}`;
  const romanized = `${romFreq} - ${romTiming} (${romDuration})${params.customInstructions ? ` [${params.customInstructions}]` : ''}`;

  return {
    nativeScript,
    romanized,
    english,
    language: lang
  };
}

/**
 * Storage key for persisting doctor's preferred prescription language
 */
export const RX_LANGUAGE_STORAGE_KEY = 'docsearch_rx_vernacular_lang';

export function getSavedRxLanguage(): RxLanguageCode {
  if (typeof window === 'undefined') return 'HI';
  try {
    const saved = localStorage.getItem(RX_LANGUAGE_STORAGE_KEY);
    if (saved && ['EN', 'HI', 'BN', 'MR', 'TA', 'TE'].includes(saved)) {
      return saved as RxLanguageCode;
    }
  } catch {}
  return 'HI'; // Default to Hindi in Indian clinic setups
}

export function saveRxLanguage(lang: RxLanguageCode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RX_LANGUAGE_STORAGE_KEY, lang);
  } catch {}
}
