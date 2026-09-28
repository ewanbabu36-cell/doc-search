/**
 * EWAN Zen Audio Engine
 * Zero-dependency, offline-first Web Audio procedural soundscape synthesizer.
 * Generates soothing ambient instrumental music, warm analog chords,
 * Tibetan singing bowl overtones, and soft rain textures at calm background volumes.
 */

export interface ZenSoundscapeTrack {
  id: string;
  name: string;
  description: string;
  icon: string;
  tempoBpm: number;
}

export const ZEN_SOUNDSCAPE_TRACKS: ZenSoundscapeTrack[] = [
  {
    id: 'zen-sanctuary',
    name: 'HQ Zen Sanctuary',
    description: 'Warm analog ambient chords & gentle acoustic piano pads for executive peace',
    icon: '🧘',
    tempoBpm: 45
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus Serenity',
    description: 'Tibetan singing bowls, subtle theta resonance & celestial fifths',
    icon: '🌊',
    tempoBpm: 40
  },
  {
    id: 'midnight-rain',
    name: 'Midnight Rain & Soft Keys',
    description: 'Gentle rain texture whisper with mellow jazz-calm chords',
    icon: '🌧️',
    tempoBpm: 50
  },
  {
    id: '432hz-ethereal',
    name: '432Hz Ethereal Healing',
    description: 'Meditative 432Hz Solfeggio drone with delicate celestial plucks',
    icon: '🍃',
    tempoBpm: 38
  }
];

const STORAGE_KEY = 'docsearch_ewan_zen_music_v1';

interface StoredZenState {
  volume: number;
  trackId: string;
  isPlaying: boolean;
}

class EwanZenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private isPlaying = false;
  private currentTrackId = 'zen-sanctuary';
  private volume = 0.20; // Default soft 20% volume ("slowly baje")
  private timerId: any = null;
  private chordIndex = 0;
  private activeVoices: { osc: OscillatorNode; gain: GainNode }[] = [];

  constructor() {
    this.loadStoredPreferences();
  }

  private loadStoredPreferences() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredZenState = JSON.parse(raw);
        if (typeof parsed.volume === 'number') {
          this.volume = Math.max(0, Math.min(1, parsed.volume));
        }
        if (parsed.trackId && ZEN_SOUNDSCAPE_TRACKS.some(t => t.id === parsed.trackId)) {
          this.currentTrackId = parsed.trackId;
        }
      }
    } catch (e) {
      // fallback to defaults
    }
  }

  private savePreferences() {
    if (typeof window === 'undefined') return;
    try {
      const state: StoredZenState = {
        volume: this.volume,
        trackId: this.currentTrackId,
        isPlaying: this.isPlaying
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  private initAudioContext() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public async play(): Promise<boolean> {
    this.initAudioContext();
    if (!this.ctx || !this.masterGain) return false;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        return false;
      }
    }

    this.isPlaying = true;
    this.savePreferences();
    this.broadcastState();

    // Smooth fade in
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 1.5);

    this.startSequencer();
    return true;
  }

  public pause() {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;

    // Smooth fade out
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    setTimeout(() => {
      this.isPlaying = false;
      this.stopSequencer();
      this.stopRain();
      this.savePreferences();
      this.broadcastState();
    }, 1200);
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public setVolume(newVol: number) {
    const clamped = Math.max(0, Math.min(1, newVol));
    this.volume = clamped;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.1);
    }
    this.savePreferences();
    this.broadcastState();
  }

  public setTrack(trackId: string) {
    if (!ZEN_SOUNDSCAPE_TRACKS.some(t => t.id === trackId)) return;
    this.currentTrackId = trackId;
    this.chordIndex = 0;
    this.savePreferences();
    this.broadcastState();

    if (this.isPlaying) {
      this.stopSequencer();
      this.stopRain();
      this.startSequencer();
    }
  }

  public getTrack(): ZenSoundscapeTrack {
    return ZEN_SOUNDSCAPE_TRACKS.find(t => t.id === this.currentTrackId) || ZEN_SOUNDSCAPE_TRACKS[0]!;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private broadcastState() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('docsearch:ewan_zen_music_state', {
        detail: {
          isPlaying: this.isPlaying,
          volume: this.volume,
          trackId: this.currentTrackId,
          track: this.getTrack()
        }
      })
    );
  }

  // --- PROCEDURAL SOUND GENERATOR ---

  private startSequencer() {
    this.stopSequencer();

    if (this.currentTrackId === 'midnight-rain') {
      this.startRain();
    } else {
      this.stopRain();
    }

    const playStep = () => {
      if (!this.isPlaying || !this.ctx) return;
      this.playCurrentSoundscapeStep();

      const track = this.getTrack();
      const stepDurationMs = (60 / track.tempoBpm) * 4 * 1000; // 1 measure per chord
      this.timerId = setTimeout(playStep, stepDurationMs);
    };

    playStep();
  }

  private stopSequencer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.stopActiveVoices();
  }

  private stopActiveVoices() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.activeVoices.forEach(v => {
      try {
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
        setTimeout(() => {
          try { v.osc.stop(); } catch (e) {}
        }, 1600);
      } catch (e) {}
    });
    this.activeVoices = [];
  }

  private playCurrentSoundscapeStep() {
    if (!this.ctx || !this.masterGain) return;

    switch (this.currentTrackId) {
      case 'zen-sanctuary':
        this.playZenSanctuaryStep();
        break;
      case 'deep-focus':
        this.playDeepFocusStep();
        break;
      case 'midnight-rain':
        this.playMidnightRainStep();
        break;
      case '432hz-ethereal':
        this.play432HzStep();
        break;
      default:
        this.playZenSanctuaryStep();
        break;
    }
  }

  // Track 1: HQ Zen Sanctuary (Warm Lush Analog Pads & Chords)
  private playZenSanctuaryStep() {
    // Fmaj9 -> Gsus4 -> Em7 -> Am9
    const progressions = [
      [174.61, 220.00, 261.63, 329.63, 392.00], // F3, A3, C4, E4, G4 (Fmaj9)
      [196.00, 261.63, 293.66, 392.00],         // G3, C4, D4, G4 (Gsus4)
      [164.81, 196.00, 246.94, 293.66],         // E3, G3, B3, D4 (Em7)
      [110.00, 220.00, 261.63, 329.63, 493.88]  // A2, A3, C4, E4, B4 (Am9)
    ];

    const chord = progressions[this.chordIndex % progressions.length]!;
    this.chordIndex++;

    this.renderWarmPadChord(chord, 5.0, 420);

    // Every 2 chords, chime a gentle singing bowl overtone
    if (this.chordIndex % 2 === 0) {
      this.playSingingBowl(523.25, 6.0); // C5 overtone
    }
  }

  // Track 2: Deep Focus Serenity (Tibetan Singing Bowl & Alpha Tone)
  private playDeepFocusStep() {
    // Meditative 5ths with singing bowl
    const roots = [130.81, 146.83, 164.81, 196.00]; // C3, D3, E3, G3
    const root = roots[this.chordIndex % roots.length]!;
    this.chordIndex++;

    const fifth = root * 1.5;
    const octave = root * 2.0;

    this.renderWarmPadChord([root, fifth, octave], 6.5, 320);
    this.playSingingBowl(octave * 1.5, 7.0);
  }

  // Track 3: Midnight Rain & Soft Keys (Lo-fi Rhodes style keys)
  private playMidnightRainStep() {
    // Dm9 -> G13 -> Cmaj9 -> Am9
    const progressions = [
      [146.83, 220.00, 261.63, 329.63], // D3, A3, C4, E4 (Dm9)
      [196.00, 246.94, 329.63, 440.00], // G3, B3, E4, A4 (G13)
      [130.81, 196.00, 246.94, 329.63], // C3, G3, B3, E4 (Cmaj9)
      [110.00, 164.81, 220.00, 261.63]  // A2, E3, A3, C4 (Am)
    ];

    const chord = progressions[this.chordIndex % progressions.length]!;
    this.chordIndex++;

    this.renderWarmPadChord(chord, 4.5, 550, 'triangle');
  }

  // Track 4: 432Hz Ethereal Healing (Solfeggio tuned drone)
  private play432HzStep() {
    // Base frequency 432Hz
    const a432 = 432 / 2; // 216Hz
    const e432 = a432 * 1.5; // 324Hz
    const cs432 = a432 * 1.25; // 270Hz

    const chords = [
      [a432, e432, 432],
      [a432 * 0.75, cs432, e432], // F#m equivalent
      [a432 * 0.888, e432, 432 * 1.2]
    ];

    const chord = chords[this.chordIndex % chords.length]!;
    this.chordIndex++;

    this.renderWarmPadChord(chord, 6.0, 380, 'sine');
    this.playSingingBowl(432, 6.5);
  }

  // Helper: Warm Analog Pad Chord Synthesis
  private renderWarmPadChord(
    frequencies: number[],
    durationSeconds: number,
    cutoffFreq: number,
    oscType: OscillatorType = 'sine'
  ) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffFreq, now);
    filter.Q.setValueAtTime(1.2, now);
    filter.connect(this.masterGain);

    frequencies.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = oscType;
      // Slight detune for analog warmth
      const detuneCents = (idx % 2 === 0 ? 1 : -1) * (idx * 3);
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detuneCents, now);

      // Slow gentle attack and long decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12 / frequencies.length, now + 2.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + durationSeconds + 0.1);

      this.activeVoices.push({ osc, gain });
    });
  }

  // Helper: Tibetan Singing Bowl Chime Tone
  private playSingingBowl(frequency: number, durationSeconds: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    // Subtle gentle vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.4, now); // 0.4 Hz gentle shimmer
    lfoGain.gain.setValueAtTime(2.0, now);
    lfo.connect(osc.frequency);
    lfo.start(now);
    lfo.stop(now + durationSeconds);

    // Soft chime attack and long ring
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + durationSeconds + 0.1);

    this.activeVoices.push({ osc, gain });
  }

  // Helper: Soft Pink Noise Rain Whisper
  private startRain() {
    if (!this.ctx || !this.masterGain || this.rainGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate gentle pink noise
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.05;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.rainGain.gain.linearRampToValueAtTime(0.035, this.ctx.currentTime + 2.0);

    noiseSource.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    noiseSource.start();
  }

  private stopRain() {
    if (this.rainGain && this.ctx) {
      try {
        this.rainGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.rainGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
        setTimeout(() => {
          this.rainGain = null;
        }, 1100);
      } catch (e) {
        this.rainGain = null;
      }
    }
  }
}

// Singleton instance
export const ewanZenAudio = new EwanZenAudioEngine();
