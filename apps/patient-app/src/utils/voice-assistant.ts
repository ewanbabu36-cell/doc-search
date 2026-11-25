import type { Language } from '../i18n.js';

const BCP47_VOICE_MAP: Record<Language, string> = {
  hi: 'hi-IN',
  en: 'en-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN'
};

export function speakAdvice(text: string, language: Language = 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.info('[VoiceAssistant] Speech synthesis not supported in this browser:', text);
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = BCP47_VOICE_MAP[language] || 'hi-IN';
    utterance.rate = 0.9; // natural, deliberate pace for elderly and rural listeners
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}
