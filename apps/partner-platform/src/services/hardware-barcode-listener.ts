/**
 * Universal Barcode & 2D DataMatrix Scanner Listener (DS-HW-902)
 *
 * Enterprise keyboard wedge hardware scanner driver for:
 * - High-speed USB HID / Bluetooth barcode and 2D DataMatrix scanners (Honeywell, Zebra, Datalogic, TVS, Syble)
 * - Inter-character timing detection (<35ms threshold) distinguishing barcode bursts from manual keyboard typing
 * - GS1 DataMatrix parser: GTIN (01), Expiry (17), Batch (10), Serial (21)
 * - Linear 1D barcode parser (EAN-13, UPC, Code 128, Code 39)
 * - Phlebotomy vacutainer accession & patient token parser
 * - Integrated Web Audio synthesizer for immediate ergonomic acoustic feedback
 */

import { useEffect, useRef, useCallback } from 'react';
import { hospitalEventBus } from './hospital-event-bus.js';

export type BarcodeSymbology =
  | 'GS1_DATAMATRIX'
  | 'EAN13_UPC'
  | 'CODE128_1D'
  | 'ACCESSION_CODE'
  | 'MRN_UHID'
  | 'RAW';

export interface ScannedBarcodePayload {
  raw: string;
  symbology: BarcodeSymbology;
  gtin?: string | undefined;
  batchNumber?: string | undefined;
  expiryDate?: string | undefined; // ISO YYYY-MM-DD
  serialNumber?: string | undefined;
  accessionNumber?: string | undefined;
  mrnOrToken?: string | undefined;
  timestamp: number;
}

export interface BarcodeScannerOptions {
  onScan: (payload: ScannedBarcodePayload) => void;
  enabled?: boolean | undefined;
  maxInterKeyDelayMs?: number | undefined; // Default 35ms
  minScanLength?: number | undefined; // Default 3 chars
  preventDefaultOnScan?: boolean | undefined;
  playAudioChime?: boolean | undefined;
}

/**
 * Synthesizes acoustic confirmation sound via Web Audio API
 */
export function playScannerAudioChime(type: 'success' | 'warning' | 'error' = 'success'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant dual-frequency POS confirmation beep (1046Hz -> 1318Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.setValueAtTime(1318.5, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'error') {
      // Low buzz error tone (220Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch {
    // AudioContext may be restricted by autoplay policies until user interaction
  }
}

/**
 * Parses raw barcode strings into structured payloads with GS1 DataMatrix intelligence
 */
export function parseScannedBarcode(rawInput: string): ScannedBarcodePayload {
  const raw = rawInput.trim();
  const timestamp = Date.now();

  // 1. Phlebotomy Accession & Lab Specimen Barcode
  if (/^(ACC|SPEC|LAB|ORD)-/i.test(raw)) {
    return {
      raw,
      symbology: 'ACCESSION_CODE',
      accessionNumber: raw.toUpperCase(),
      timestamp
    };
  }

  // 2. Patient MRN, UHID, or Queue Token
  if (/^(UHID|MRN|TK|PAT)-/i.test(raw) || /^DS-ORG\d+-\d+/i.test(raw)) {
    return {
      raw,
      symbology: 'MRN_UHID',
      mrnOrToken: raw.toUpperCase(),
      timestamp
    };
  }

  // 3. GS1 DataMatrix with Parentheses or FNC1 separators
  // Examples:
  // (01)08901234567890(17)261231(10)BTH-9876(21)SN100234
  // 01089012345678901726123110BTH-9876
  const hasGs1ParenAIs = /\(01\)|\(17\)|\(10\)|\(21\)/.test(raw);
  const startsWithGs101 = raw.startsWith('01') && raw.length >= 16;

  if (hasGs1ParenAIs || startsWithGs101) {
    let gtin: string | undefined = undefined;
    let batchNumber: string | undefined = undefined;
    let expiryDate: string | undefined = undefined;
    let serialNumber: string | undefined = undefined;

    if (hasGs1ParenAIs) {
      // Bracketed format
      const gtinMatch = raw.match(/\(01\)(\d{14})/);
      if (gtinMatch?.[1]) gtin = gtinMatch[1];

      const expiryMatch = raw.match(/\(17\)(\d{6})/);
      if (expiryMatch?.[1]) {
        const yy = parseInt(expiryMatch[1].slice(0, 2), 10);
        const mm = expiryMatch[1].slice(2, 4);
        const dd = expiryMatch[1].slice(4, 6);
        const fullYear = yy >= 50 ? 1900 + yy : 2000 + yy;
        expiryDate = `${fullYear}-${mm}-${dd}`;
      }

      const batchMatch = raw.match(/\(10\)([^\(\s]+)/);
      if (batchMatch?.[1]) batchNumber = batchMatch[1].trim();

      const serialMatch = raw.match(/\(21\)([^\(\s]+)/);
      if (serialMatch?.[1]) serialNumber = serialMatch[1].trim();
    } else {
      // Raw string format: 01 (14 digits) + 17 (6 digits) + 10 (batch)
      gtin = raw.slice(2, 16);
      if (raw.length >= 24 && raw.slice(16, 18) === '17') {
        const yy = parseInt(raw.slice(18, 20), 10);
        const mm = raw.slice(20, 22);
        const dd = raw.slice(22, 24);
        const fullYear = yy >= 50 ? 1900 + yy : 2000 + yy;
        expiryDate = `${fullYear}-${mm}-${dd}`;

        if (raw.length > 26 && raw.slice(24, 26) === '10') {
          batchNumber = raw.slice(26).split(/[\x1D\s]/)[0];
        }
      }
    }

    return {
      raw,
      symbology: 'GS1_DATAMATRIX',
      gtin,
      batchNumber,
      expiryDate,
      serialNumber,
      timestamp
    };
  }

  // 4. Standard 1D Retail Barcode (EAN-13, UPC-A, etc.)
  if (/^\d{8,14}$/.test(raw)) {
    return {
      raw,
      symbology: 'EAN13_UPC',
      gtin: raw.padStart(14, '0'),
      timestamp
    };
  }

  // 5. General Code 128 / Code 39
  return {
    raw,
    symbology: 'CODE128_1D',
    timestamp
  };
}

/**
 * Global Keyboard Wedge Hardware Barcode Listener Manager
 */
class HardwareBarcodeManager {
  private buffer: string[] = [];
  private timestamps: number[] = [];
  private subscribers: Set<(payload: ScannedBarcodePayload) => void> = new Set();
  private isListening = false;
  private maxInterKeyDelayMs = 35; // Hardware scanners send chars < 35ms apart
  private minScanLength = 3;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  private startListening() {
    if (this.isListening || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown, true); // Use capture phase
    this.isListening = true;
  }

  private stopListening() {
    if (!this.isListening || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown, true);
    this.isListening = false;
  }

  public subscribe(callback: (payload: ScannedBarcodePayload) => void): () => void {
    this.subscribers.add(callback);
    if (this.subscribers.size === 1) {
      this.startListening();
    }
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stopListening();
      }
    };
  }

  private handleKeyDown(e: KeyboardEvent) {
    const now = Date.now();

    // Reset buffer if inter-character interval exceeds threshold
    if (this.timestamps.length > 0) {
      const lastTime = this.timestamps[this.timestamps.length - 1]!;
      const delta = now - lastTime;
      if (delta > this.maxInterKeyDelayMs) {
        this.buffer = [];
        this.timestamps = [];
      }
    }

    if (e.key === 'Enter') {
      if (this.buffer.length >= this.minScanLength) {
        // Calculate average delta to verify hardware burst speed
        let totalDelta = 0;
        for (let i = 1; i < this.timestamps.length; i++) {
          totalDelta += this.timestamps[i]! - this.timestamps[i - 1]!;
        }
        const avgDelta = this.timestamps.length > 1 ? totalDelta / (this.timestamps.length - 1) : 0;

        // Scanners emit characters rapidly (avg < 40ms)
        if (avgDelta <= 40 || this.buffer.length >= 8) {
          const rawString = this.buffer.join('');
          e.preventDefault();
          e.stopPropagation();

          const payload = parseScannedBarcode(rawString);
          playScannerAudioChime('success');

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('docsearch:laser_beam_sweep', {
                detail: {
                  raw: payload.raw,
                  symbology: payload.symbology,
                  timestamp: payload.timestamp,
                  burstMs: Math.round(avgDelta)
                }
              })
            );
          }

          // Notify all subscribers
          this.subscribers.forEach((cb) => {
            try {
              cb(payload);
            } catch (err) {
              console.error('[HardwareBarcodeManager] Error in subscriber:', err);
            }
          });

          // Broadcast to global Hospital Event Bus
          try {
            hospitalEventBus.publish('BARCODE_SCANNED', 'HardwareBarcodeManager', payload);
          } catch {
            // ignore
          }

          this.buffer = [];
          this.timestamps = [];
          return;
        }
      }

      this.buffer = [];
      this.timestamps = [];
      return;
    }

    // Only collect single printable characters
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      this.buffer.push(e.key);
      this.timestamps.push(now);
    }
  }

  /**
   * Manually simulate a hardware scan (e.g. for testing or software trigger)
   */
  public triggerManualScan(rawString: string): ScannedBarcodePayload {
    const payload = parseScannedBarcode(rawString);
    playScannerAudioChime('success');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('docsearch:laser_beam_sweep', {
          detail: {
            raw: payload.raw,
            symbology: payload.symbology,
            timestamp: payload.timestamp,
            burstMs: 14
          }
        })
      );
    }

    this.subscribers.forEach((cb) => cb(payload));
    try {
      hospitalEventBus.publish('BARCODE_SCANNED', 'HardwareBarcodeManager', payload);
    } catch {
      // ignore
    }
    return payload;
  }
}

export const hardwareBarcodeManager = new HardwareBarcodeManager();

/**
 * React Hook for seamless hardware scanner integration in any hospital view
 */
export function useHardwareBarcodeScanner(options: BarcodeScannerOptions): void {
  const onScanRef = useRef(options.onScan);
  onScanRef.current = options.onScan;
  const enabled = options.enabled ?? true;

  const handleScan = useCallback(
    (payload: ScannedBarcodePayload) => {
      if (enabled) {
        onScanRef.current(payload);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = hardwareBarcodeManager.subscribe(handleScan);
    return () => {
      unsubscribe();
    };
  }, [enabled, handleScan]);
}
