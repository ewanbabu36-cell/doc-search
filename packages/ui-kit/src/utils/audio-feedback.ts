/**
 * DocSearch Enterprise Acoustic & Haptic Feedback Engine
 * Zero-dependency, offline-first Web Audio API procedural sound synthesizer.
 * Generates tactile chimes for success/dispense, soft acoustic thuds for errors,
 * and high-priority dual tones for critical NABL panic intimation.
 */

import { useState, useEffect, useCallback } from 'react';

export type AudioFeedbackType = 'chime' | 'thud' | 'panic';
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'panic';

const STORAGE_KEY = 'docsearch_audio_feedback_muted';

let audioCtx: AudioContext | null = null;
let isMutedState = false;

// Initialize mute state from localStorage if available
if (typeof window !== 'undefined') {
  try {
    isMutedState = localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    isMutedState = false;
  }
}

/**
 * Get or lazily create the AudioContext singleton.
 * Handles SSR safety and vendor prefixes.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  // Resume context if suspended by browser autoplay policy
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Browsers require a user interaction to resume
    });
  }

  return audioCtx;
}

/**
 * Trigger subtle hardware haptic vibration if supported (mobile/tablets/POS scanners).
 */
export function triggerHapticFeedback(pattern: HapticPattern = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) return;

  try {
    switch (pattern) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
        navigator.vibrate([30, 20, 30]);
        break;
      case 'panic':
        navigator.vibrate([80, 40, 80, 40, 120]);
        break;
    }
  } catch (e) {
    // Ignore vibration errors on unsupported devices
  }
}

/**
 * Check if acoustic audio feedback is currently muted.
 */
export function isAudioMuted(): boolean {
  return isMutedState;
}

/**
 * Set acoustic audio feedback mute state with persistent storage.
 */
export function setAudioMuted(muted: boolean): void {
  isMutedState = muted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
    } catch (e) {
      // Storage unavailable
    }
  }
}

/**
 * Play a gentle tactile chime (sine harmonic dual-tone).
 * Ideal for: successful dispense, bill generation, prescription sign-off, draft save.
 */
export function playChime(): void {
  if (isMutedState) return;
  triggerHapticFeedback('light');

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Master chime gain envelope
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.20, now + 0.015);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

  // Fundamental tone: 880 Hz (A5)
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.exponentialRampToValueAtTime(888, now + 0.2);

  // Octave harmonic overtone: 1760 Hz (A6)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.35, now);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1760, now);

  osc1.connect(masterGain);
  osc2.connect(gain2);
  gain2.connect(masterGain);

  osc1.start(now);
  osc2.start(now);

  osc1.stop(now + 0.28);
  osc2.stop(now + 0.28);
}

/**
 * Play a soft acoustic thud (damped low-frequency pulse).
 * Ideal for: validation errors, invalid barcode scan, out-of-stock warning, duplicate entry.
 */
export function playThud(): void {
  if (isMutedState) return;
  triggerHapticFeedback('medium');

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Low-pass filter to keep sound warm and mechanical without harsh clicks
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(240, now);
  filter.connect(ctx.destination);

  // Damped volume envelope
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.28, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  gain.connect(filter);

  // Pitch envelope dropping from 145Hz down to 48Hz
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(145, now);
  osc.frequency.exponentialRampToValueAtTime(48, now + 0.15);

  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * Play high-priority critical panic dual-tone pulse.
 * Ideal for: NABL critical panic lab findings, emergency code red, critical bed threshold.
 */
export function playPanicAlert(): void {
  if (isMutedState) return;
  triggerHapticFeedback('panic');

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Master alert gain
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.30, now);

  // High-priority alternating dual tone (960 Hz & 770 Hz)
  const tones = [
    { freq: 960, start: 0.00, end: 0.09 },
    { freq: 770, start: 0.11, end: 0.20 },
    { freq: 960, start: 0.22, end: 0.34 }
  ];

  tones.forEach(({ freq, start, end }) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + start);

    // Warm down square wave harshness with lowpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now + start);

    noteGain.gain.setValueAtTime(0.0001, now + start);
    noteGain.gain.linearRampToValueAtTime(0.25, now + start + 0.01);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + end);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(now + start);
    osc.stop(now + end + 0.02);
  });
}

/**
 * Unified audio feedback dispatcher.
 */
export function playAudioFeedback(type: AudioFeedbackType): void {
  switch (type) {
    case 'chime':
      playChime();
      break;
    case 'thud':
      playThud();
      break;
    case 'panic':
      playPanicAlert();
      break;
  }
}

/**
 * React hook for consuming audio feedback with live mute state tracking.
 */
export function useAudioFeedback() {
  const [muted, setMutedState] = useState<boolean>(isAudioMuted);

  useEffect(() => {
    setMutedState(isAudioMuted());
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setAudioMuted(next);
    setMutedState(next);
  }, [muted]);

  const setMuted = useCallback((val: boolean) => {
    setAudioMuted(val);
    setMutedState(val);
  }, []);

  return {
    isMuted: muted,
    toggleMute,
    setMuted,
    playChime,
    playThud,
    playPanic: playPanicAlert,
    play: playAudioFeedback
  };
}
