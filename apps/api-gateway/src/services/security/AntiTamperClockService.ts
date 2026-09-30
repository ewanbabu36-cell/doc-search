import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('anti-tamper-clock');

export interface ClockIntegrityStatus {
  isTampered: boolean;
  lastKnownTimestamp: number;
  currentTimestamp: number;
  skewMinutes: number;
  message?: string;
}

export class AntiTamperClockService {
  private lastKnownTimestamp: number = Date.now();
  private maxAllowedBackwardSkewMs = 5 * 60 * 1000; // 5 minutes tolerance for NTP adjustment

  constructor() {
    this.restoreLedger();
  }

  private restoreLedger(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('docsearch_clock_ledger');
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > this.lastKnownTimestamp) {
            this.lastKnownTimestamp = parsed;
          }
        }
      }
    } catch {}
  }

  private persistLedger(ts: number): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('docsearch_clock_ledger', String(ts));
      }
    } catch {}
  }

  /**
   * Records a valid forward clinical or operational transaction timestamp.
   */
  recordTransactionTime(ts: number = Date.now()): void {
    if (ts > this.lastKnownTimestamp) {
      this.lastKnownTimestamp = ts;
      this.persistLedger(ts);
    }
  }

  /**
   * Verifies that the system clock has not been maliciously rewound to circumvent license expiry.
   */
  verifyClockIntegrity(now: number = Date.now()): ClockIntegrityStatus {
    // If the current time is strictly earlier than last recorded time minus 5 mins
    if (now < this.lastKnownTimestamp - this.maxAllowedBackwardSkewMs) {
      const skewMinutes = Math.round((this.lastKnownTimestamp - now) / 60000);
      logger.error(`[ANTI-PIRACY] CLOCK ROLLBACK DETECTED! Current: ${new Date(now).toISOString()}, Last Known: ${new Date(this.lastKnownTimestamp).toISOString()} (Lag: ${skewMinutes} mins)`);
      return {
        isTampered: true,
        lastKnownTimestamp: this.lastKnownTimestamp,
        currentTimestamp: now,
        skewMinutes,
        message: `System clock was wound back by ${skewMinutes} minutes. Security anti-tamper lock engaged.`
      };
    }

    // Normal forward progression: update high-water mark
    if (now > this.lastKnownTimestamp) {
      this.lastKnownTimestamp = now;
      this.persistLedger(now);
    }

    return {
      isTampered: false,
      lastKnownTimestamp: this.lastKnownTimestamp,
      currentTimestamp: now,
      skewMinutes: 0
    };
  }

  getLastKnownTimestamp(): number {
    return this.lastKnownTimestamp;
  }
}

export const antiTamperClockService = new AntiTamperClockService();
