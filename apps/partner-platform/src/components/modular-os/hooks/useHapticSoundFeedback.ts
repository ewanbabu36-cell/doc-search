// Web Audio API & Vibration Micro-Haptic Synthesis (Zero External Dependencies)

class AudioHapticEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Crisp high-frequency micro-click (like iOS keyboard/toggle)
  public playClick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // Soft low-frequency magnetic snap into dock slot
  public playSnap() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  // Tactile micro-haptic pulse on supported mobile/tablet devices
  public triggerHaptic(duration = 15) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {}
    }
  }

  // Combined acoustic + haptic feedback for drag drop
  public onDropSuccess() {
    this.playSnap();
    this.triggerHaptic(20);
  }

  public onDragStart() {
    this.playClick();
    this.triggerHaptic(10);
  }
}

export const audioHaptic = new AudioHapticEngine();

export function useHapticSoundFeedback() {
  return {
    playClick: () => audioHaptic.playClick(),
    playSnap: () => audioHaptic.playSnap(),
    triggerHaptic: (duration?: number) => audioHaptic.triggerHaptic(duration),
    onDropSuccess: () => audioHaptic.onDropSuccess(),
    onDragStart: () => audioHaptic.onDragStart(),
  };
}
