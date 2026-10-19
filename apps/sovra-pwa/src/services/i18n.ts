// Sovra 1-Click Bilingual i18n Service (English & Hindi)
// Solves Weakness #2 (Bhasha Ki Rukawat: English Only UI vs Tier-2/3 OPD Patients)
// Zero-cost client-side localization engine with instant reactive language switching.

export type LanguageCode = 'en' | 'hi';

type TranslationKeys =
  | 'appName'
  | 'tagline'
  | 'opdQueueTracker'
  | 'yourToken'
  | 'currentlyServing'
  | 'patientsAhead'
  | 'yourTurnNow'
  | 'minsWait'
  | 'pinTokenPrompt'
  | 'pinTokenButton'
  | 'nextCall'
  | 'clinicOpen'
  | 'clinicClosed'
  | 'emergencyNoticeTitle'
  | 'emergencyNoticeText'
  | 'dial108'
  | 'hospitalEr'
  | 'typeMessagePlaceholder'
  | 'clinicClosedPlaceholder'
  | 'prescriptionTitle'
  | 'labReportTitle'
  | 'pacsScanTitle'
  | 'opdPaymentTitle'
  | 'directPacsStream'
  | 'zeroStorageUsed'
  | 'openPacsViewer'
  | 'voiceNoteRecording'
  | 'voiceNoteTapToSend'
  | 'doctorVerifiedBadge'
  | 'mutePatient'
  | 'blockPatient'
  | 'archiveConsultation'
  | 'printStandee'
  | 'backupSync'
  | 'batteryOptimize'
  | 'allChats'
  | 'unreadChats';

const translations: Record<LanguageCode, Record<TranslationKeys, string>> = {
  en: {
    appName: 'SOVRA',
    tagline: 'Zero-Cost Health Messenger',
    opdQueueTracker: 'Live OPD Queue Tracker',
    yourToken: 'YOUR TOKEN',
    currentlyServing: 'CURRENTLY SERVING',
    patientsAhead: 'patients ahead',
    yourTurnNow: '🔔 YOUR TURN NOW! Please proceed to clinic',
    minsWait: 'mins wait',
    pinTokenPrompt: '📲 Keep Token on Lock Screen to get vibration alert when your turn is called.',
    pinTokenButton: 'Pin Token',
    nextCall: '⏭ Next Call',
    clinicOpen: 'OPD Clinic Open: Consultations monitored (09:00 AM – 08:00 PM)',
    clinicClosed: 'MEDICO-LEGAL EMERGENCY NOTICE — OPD CLINIC CLOSED',
    emergencyNoticeTitle: 'MEDICO-LEGAL NOTICE: CLINIC CLOSED',
    emergencyNoticeText:
      'Regular doctor consultation hours are 09:00 AM – 08:00 PM. Direct chat is NOT monitored for acute emergencies. If experiencing chest pain, acute breathlessness, or severe trauma, dial 108 immediately.',
    dial108: '🚑 Dial 108 (National Ambulance)',
    hospitalEr: '🏥 Hospital 24x7 ER Desk',
    typeMessagePlaceholder: 'Type a message or record voice note...',
    clinicClosedPlaceholder: '🔒 OPD Consultation Closed (09:00 AM – 08:00 PM). Emergency calls only.',
    prescriptionTitle: 'Digital Prescription (Rx)',
    labReportTitle: 'Pathology Lab Report',
    pacsScanTitle: 'Radiology PACS Scan',
    opdPaymentTitle: 'OPD Consultation Fee',
    directPacsStream: 'Direct PACS Stream',
    zeroStorageUsed: '0 MB Phone Storage Used',
    openPacsViewer: '🔬 Open Interactive DICOM Viewer',
    voiceNoteRecording: '🔴 Recording Voice Note...',
    voiceNoteTapToSend: 'Tap Send ➤',
    doctorVerifiedBadge: '✓ NMC Verified Doctor',
    mutePatient: '🔕 Mute Patient',
    blockPatient: '🚫 Block Patient',
    archiveConsultation: '📁 Archive Consultation',
    printStandee: '🖨️ Clinic Desk Standee',
    backupSync: '☁️ Backup',
    batteryOptimize: '⚡ Battery',
    allChats: 'ALL',
    unreadChats: 'UNREAD'
  },
  hi: {
    appName: 'SOVRA',
    tagline: 'मुफ्त स्वास्थ्य मैसेंजर',
    opdQueueTracker: 'लाइव ओपीडी टोकन ट्रैकर',
    yourToken: 'आपका टोकन',
    currentlyServing: 'अभी नंबर चल रहा है',
    patientsAhead: 'मरीज़ आपसे आगे हैं',
    yourTurnNow: '🔔 अब आपकी बारी है! कृपया डॉक्टर के कमरे में जाएं',
    minsWait: 'मिनट शेष',
    pinTokenPrompt: '📲 टोकन को लॉक स्क्रीन पर रखें ताकि आपकी बारी आते ही फोन वाइब्रेट हो सके।',
    pinTokenButton: 'टोकन पिन करें',
    nextCall: '⏭ अगला नंबर',
    clinicOpen: 'ओपीडी क्लिनिक खुला है: डॉक्टर परामर्श समय (सुबह 09:00 – रात 08:00)',
    clinicClosed: 'आपातकालीन कानूनी सूचना — ओपीडी क्लिनिक बंद है',
    emergencyNoticeTitle: 'आपातकालीन सूचना: क्लिनिक बंद है',
    emergencyNoticeText:
      'डॉक्टर परामर्श समय सुबह 09:00 से रात 08:00 बजे तक है। रात में गंभीर इमरजेंसी के लिए चैट पर निर्भर न रहें। सीने में दर्द, सांस लेने में तकलीफ या गंभीर स्थिति में तुरंत 108 डायल करें।',
    dial108: '🚑 108 एम्बुलेंस को कॉल करें',
    hospitalEr: '🏥 अस्पताल 24x7 इमरजेंसी डेस्क',
    typeMessagePlaceholder: 'संदेश लिखें या आवाज़ (वॉइस नोट) रिकॉर्ड करें...',
    clinicClosedPlaceholder: '🔒 क्लिनिक बंद है (सुबह 09:00 – रात 08:00)। इमरजेंसी में 108 पर कॉल करें।',
    prescriptionTitle: 'डिजिटल पर्चा (Rx)',
    labReportTitle: 'जांच रिपोर्ट (Lab Report)',
    pacsScanTitle: 'रेडियोलॉजी सीटी/एमआरआई स्कैन',
    opdPaymentTitle: 'परामर्श शुल्क भुगतान',
    directPacsStream: 'सीधा पैक्स (PACS) प्रसारण',
    zeroStorageUsed: '0 MB फोन स्टोरेज खर्च',
    openPacsViewer: '🔬 स्कैन देखने के लिए खोलें',
    voiceNoteRecording: '🔴 आवाज़ रिकॉर्ड हो रही है...',
    voiceNoteTapToSend: 'भेजें ➤',
    doctorVerifiedBadge: '✓ एनएमसी (NMC) सत्यापित डॉक्टर',
    mutePatient: '🔕 सूचना बंद करें (Mute)',
    blockPatient: '🚫 मरीज़ को ब्लॉक करें',
    archiveConsultation: '📁 केस समाप्त (Archive)',
    printStandee: '🖨️ क्लिनिक डेस्क क्यूआर स्टैंडी',
    backupSync: '☁️ बैकअप',
    batteryOptimize: '⚡ बैटरी छूट',
    allChats: 'सभी',
    unreadChats: 'अपठित'
  }
};

type Listener = (lang: LanguageCode) => void;

class I18nService {
  private currentLang: LanguageCode = 'hi'; // Default to Hindi for high Indian OPD impact
  private listeners: Set<Listener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sovra_language') as LanguageCode;
      if (saved === 'en' || saved === 'hi') {
        this.currentLang = saved;
      }
    }
  }

  getLanguage(): LanguageCode {
    return this.currentLang;
  }

  setLanguage(lang: LanguageCode): void {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sovra_language', lang);
    }
    this.listeners.forEach((fn) => fn(lang));
  }

  toggleLanguage(): LanguageCode {
    const next = this.currentLang === 'hi' ? 'en' : 'hi';
    this.setLanguage(next);
    return next;
  }

  t(key: TranslationKeys): string {
    return translations[this.currentLang]?.[key] || translations.en[key] || key;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const i18n = new I18nService();
