/**
 * OPD Voice Caller & Hospital Chime Engine
 * Dual-tone Web Audio API medical bell chime + Web Speech Synthesis (Hindi/English)
 * Cross-window broadcast for waiting room TV synchronicity across displays
 */

import { hospitalEventBus } from './hospital-event-bus.js';

export interface OpdTokenCallEvent {
  tokenNumber: string | number;
  patientName?: string;
  roomNumber?: string;
  doctorName?: string;
  department?: string;
  uhid?: string;
  timestamp?: string;
}

export type AnnouncementLanguage = 'HI' | 'EN' | 'BILINGUAL' | 'BN' | 'MR' | 'TA' | 'TE';

export interface VoiceCallerOptions {
  muteChime?: boolean;
  muteVoice?: boolean;
  language?: AnnouncementLanguage;
  volume?: number;
  rate?: number;
}

class OpdVoiceCallerService {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<(event: OpdTokenCallEvent) => void> = new Set();
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private defaultLanguage: AnnouncementLanguage = 'BILINGUAL';

  constructor() {
    this.initBroadcastChannel();
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined') return;

    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('docsearch_opd_voice_queue');
        this.broadcastChannel.onmessage = (messageEvent) => {
          if (messageEvent.data && messageEvent.data.type === 'OPD_TOKEN_CALLED') {
            const detail: OpdTokenCallEvent = messageEvent.data.payload;
            this.notifyListeners(detail);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel initialization failed, falling back to window events:', e);
    }

    // Window event listener fallback
    window.addEventListener('docsearch:opd-token-called', ((e: CustomEvent<OpdTokenCallEvent>) => {
      if (e.detail) {
        this.notifyListeners(e.detail);
      }
    }) as EventListener);
  }

  private notifyListeners(event: OpdTokenCallEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in OPD voice caller listener:', err);
      }
    });
  }

  /**
   * Play authentic dual-tone hospital chime using Web Audio API oscillator
   * Tone 1: High chime "Ding" (880 Hz - A5)
   * Tone 2: Low chime "Dong" (587.33 Hz - D5)
   */
  public async playChime(volume: number = 0.35): Promise<void> {
    if (typeof window === 'undefined' || this.isMuted) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Tone 1: 880 Hz (A5 - High Ding)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(volume * 0.9, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // Tone 2: 587.33 Hz (D5 - Resonant Dong)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(587.33, now + 0.35);
      gain2.gain.setValueAtTime(volume, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.25);
    } catch (err) {
      console.warn('Web Audio chime error:', err);
    }
  }

  /**
   * Speak token announcement using Web Speech API with regional / bilingual support
   */
  public async speakAnnouncement(event: OpdTokenCallEvent, options?: VoiceCallerOptions): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (this.isMuted || options?.muteVoice) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterance

      const cleanToken = String(event.tokenNumber).replace(/^#+/, '');
      const patient = event.patientName ? event.patientName.trim() : 'Patient';
      const cleanRoom = event.roomNumber ? String(event.roomNumber).replace(/^(room|कमरा|रूम)\s*/i, '').trim() : '1';
      const doctor = event.doctorName ? event.doctorName.replace(/^dr\.?\s*/i, '').trim() : '';
      const doctorPhrase = doctor ? `Dr. ${doctor}` : 'Attending Physician';
      const doctorPhraseHindi = doctor ? `डॉक्टर ${doctor}` : 'चिकित्सक';

      const lang = options?.language || this.defaultLanguage;
      const rate = options?.rate || 0.88;

      const utterances: SpeechSynthesisUtterance[] = [];

      // 1. Hindi Announcement
      if (lang === 'HI' || lang === 'BILINGUAL') {
        const hindiText = `टोकन संख्या ${cleanToken}, ${patient}। कृपया कमरा नंबर ${cleanRoom}, ${doctorPhraseHindi} के पास पधारें।`;
        const hindiUtterance = new SpeechSynthesisUtterance(hindiText);
        hindiUtterance.lang = 'hi-IN';
        hindiUtterance.rate = rate;
        hindiUtterance.pitch = 1.05;
        utterances.push(hindiUtterance);
      }

      // 2. English Announcement
      if (lang === 'EN' || lang === 'BILINGUAL') {
        const englishText = `Token number ${cleanToken}, ${patient}. Please proceed to Room ${cleanRoom}, ${doctorPhrase}.`;
        const englishUtterance = new SpeechSynthesisUtterance(englishText);
        englishUtterance.lang = 'en-IN';
        englishUtterance.rate = 0.9;
        englishUtterance.pitch = 1.0;
        utterances.push(englishUtterance);
      }

      // Play sequentially
      const firstUtterance = utterances[0];
      const secondUtterance = utterances[1];
      if (utterances.length === 1 && firstUtterance) {
        window.speechSynthesis.speak(firstUtterance);
      } else if (utterances.length > 1 && firstUtterance && secondUtterance) {
        firstUtterance.onend = () => {
          setTimeout(() => {
            window.speechSynthesis.speak(secondUtterance);
          }, 320);
        };
        window.speechSynthesis.speak(firstUtterance);
      }
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  /**
   * Announce token publicly:
   * 1. Broadcasts across browser tabs/windows & hospital event bus.
   * 2. Plays authentic dual-tone hospital chime.
   * 3. Speaks bilingual or regional voice announcement.
   */
  public async announceToken(event: OpdTokenCallEvent, options?: VoiceCallerOptions): Promise<void> {
    const formattedToken = String(event.tokenNumber).startsWith('#') ? event.tokenNumber : `#${event.tokenNumber}`;
    const payload: OpdTokenCallEvent = {
      ...event,
      tokenNumber: formattedToken,
      timestamp: event.timestamp || new Date().toISOString()
    };

    // 1. Multi-window BroadcastChannel dispatch
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'OPD_TOKEN_CALLED',
          payload
        });
      } catch (err) {
        console.warn('BroadcastChannel postMessage error:', err);
      }
    }

    // 2. Local window CustomEvent dispatch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('docsearch:opd-token-called', {
          detail: payload
        })
      );
    }

    // 3. Hospital Event Bus integration for real-time SSE & audit telemetry
    hospitalEventBus.publish('PATIENT_CALLED', 'opdVoiceCallerService', {
      tokenNumber: payload.tokenNumber,
      token: payload.tokenNumber,
      opdToken: payload.tokenNumber,
      patientName: payload.patientName || 'OPD Patient',
      name: payload.patientName,
      roomNumber: payload.roomNumber || 'ROOM 101',
      chamber: payload.roomNumber || 'ROOM 101',
      doctorName: payload.doctorName,
      uhid: payload.uhid,
      timestamp: payload.timestamp
    }, `OPD Token ${payload.tokenNumber} called to ${payload.roomNumber || 'Chamber'}`);

    // Notify internal subscribers
    this.notifyListeners(payload);

    // 4. Play hospital bell chime
    if (!options?.muteChime) {
      await this.playChime(options?.volume);
    }

    // 5. Play voice announcement after chime delay
    if (!options?.muteVoice) {
      setTimeout(() => {
        void this.speakAnnouncement(payload, options);
      }, 550);
    }
  }

  /**
   * Subscribe to token call events (from current tab or remote tabs via BroadcastChannel)
   */
  public onTokenCalled(callback: (event: OpdTokenCallEvent) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public isVoiceMuted(): boolean {
    return this.isMuted;
  }

  public setDefaultLanguage(lang: AnnouncementLanguage): void {
    this.defaultLanguage = lang;
  }
}

export const opdVoiceCallerService = new OpdVoiceCallerService();
