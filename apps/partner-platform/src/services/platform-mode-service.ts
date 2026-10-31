/**
 * Platform Operating Mode Service: Daily Express vs Advance Pro
 *
 * Provides progressive disclosure across all 4 Sovereign Healthcare Profiles:
 * - EXPRESS: Ultra-clean, distraction-free, 90% daily routine workflow on screen.
 * - ADVANCED: Unlocks deep master settings, wholesale imports, audit vaults, and compliance matrices.
 */

export type PlatformOperatingMode = 'EXPRESS' | 'ADVANCED';

const STORAGE_KEY = 'docsearch_platform_operating_mode';
const EVENT_NAME = 'docsearch_operating_mode_changed';

class PlatformModeService {
  private currentMode: PlatformOperatingMode = 'EXPRESS';
  private listeners = new Set<(mode: PlatformOperatingMode) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as PlatformOperatingMode;
      if (stored === 'ADVANCED' || stored === 'EXPRESS') {
        this.currentMode = stored;
      }

      // Universal Hotkey Listener: Alt + A (or Ctrl + Shift + A)
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        const isAltA = e.altKey && (e.key === 'a' || e.key === 'A');
        const isCtrlShiftA = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A');
        if (isAltA || isCtrlShiftA) {
          e.preventDefault();
          this.toggleMode();
        }
      });
    }
  }

  public getMode(): PlatformOperatingMode {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as PlatformOperatingMode;
      if (stored === 'ADVANCED' || stored === 'EXPRESS') {
        this.currentMode = stored;
      }
    }
    return this.currentMode;
  }

  public isAdvanced(): boolean {
    return this.getMode() === 'ADVANCED';
  }

  public isExpress(): boolean {
    return this.getMode() === 'EXPRESS';
  }

  public setMode(mode: PlatformOperatingMode): void {
    this.currentMode = mode;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { mode } }));
      } catch {}
    }
    this.notify();
  }

  public toggleMode(): PlatformOperatingMode {
    const nextMode: PlatformOperatingMode = this.currentMode === 'EXPRESS' ? 'ADVANCED' : 'EXPRESS';
    this.setMode(nextMode);
    return nextMode;
  }

  public subscribe(listener: (mode: PlatformOperatingMode) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentMode);
      } catch (err) {
        console.error('[PlatformModeService] Listener error:', err);
      }
    }
  }
}

export const platformModeService = new PlatformModeService();
