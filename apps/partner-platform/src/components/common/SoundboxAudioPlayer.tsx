import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateInvoiceReceiptBytes, type InvoiceSlipData } from '@docsearch/shared-core';

export interface SoundboxPaymentEventDetail {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  patientName?: string;
  patientPhone?: string;
  payerVpa?: string;
  txnRef?: string;
  facilityName?: string;
  facilityGstin?: string;
  items?: Array<{ name: string; qty: number; amount: number }>;
  paymentMode?: string;
  soundboxVoicePromptHindi?: string;
  soundboxVoicePromptEnglish?: string;
}

export interface SoundboxAudioPlayerProps {
  facilityName?: string;
  defaultLanguage?: 'HI' | 'EN';
  autoPrintReceipt?: boolean;
  onPaymentReceived?: (detail: SoundboxPaymentEventDetail) => void;
  className?: string;
  compact?: boolean;
}

/**
 * Synthesizes the iconic PayTM/PhonePe counter soundbox two-tone chime (C5 -> E5 -> G5)
 * using the browser Web Audio API AudioContext.
 */
function playSoundboxChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Frequencies: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.12 },
      { freq: 659.25, start: 0.12, duration: 0.14 },
      { freq: 783.99, start: 0.26, duration: 0.35 }
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.warn('Web Audio Soundbox chime playback unavailable:', err);
  }
}

/**
 * Speaks the payment announcement using Web Speech Synthesis API in Hindi or Indian English.
 */
function speakAnnouncement(text: string, language: 'HI' | 'EN'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Clear counter pace
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    if (language === 'HI') {
      utterance.lang = 'hi-IN';
      const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
      if (hindiVoice) utterance.voice = hindiVoice;
    } else {
      utterance.lang = 'en-IN';
      const indianVoice = voices.find((v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
      if (indianVoice) utterance.voice = indianVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis unavailable:', err);
  }
}

/**
 * Generates raw ESC/POS thermal bytes and dispatches 1-click silent thermal print.
 */
function autoCutThermalReceipt(detail: SoundboxPaymentEventDetail, facilityName: string): Uint8Array {
  const invoiceData: InvoiceSlipData = {
    facilityName: detail.facilityName || facilityName || 'DocSearch Multispeciality Clinic',
    ...(detail.facilityGstin ? { facilityGstin: detail.facilityGstin } : {}),
    invoiceNumber: detail.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString('en-IN'),
    customerName: detail.patientName || 'Walk-in Patient',
    ...(detail.patientPhone ? { patientPhone: detail.patientPhone } : {}),
    items: detail.items && detail.items.length > 0
      ? detail.items
      : [{ name: 'OPD Clinical Consultation Fee', qty: 1, amount: detail.amount }],
    totalAmount: detail.amount,
    netPayable: detail.amount,
    paidAmount: detail.amount,
    balanceDue: 0,
    paymentMode: `UPI (${detail.payerVpa || 'Soundbox Verified'})`,
    upiQrString: `upi://pay?pa=counter@icici&pn=${encodeURIComponent(facilityName)}&am=${detail.amount.toFixed(2)}&cu=INR`
  };

  const bytes = generateInvoiceReceiptBytes(invoiceData, { rollWidth: '80mm', feedLines: 4 });

  // Silent print dispatch via browser print iframe or custom hardware bridge
  if (typeof window !== 'undefined') {
    try {
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const printFrame = document.createElement('iframe');
      printFrame.style.display = 'none';
      printFrame.src = url;
      document.body.appendChild(printFrame);
      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
          URL.revokeObjectURL(url);
        } catch {}
      }, 3000);
    } catch (e) {
      console.warn('Silent print bridge not available, byte generation successful:', e);
    }
  }

  return bytes;
}

export const SoundboxAudioPlayer: React.FC<SoundboxAudioPlayerProps> = ({
  facilityName = 'DocSearch Partner Clinic',
  defaultLanguage = 'HI',
  autoPrintReceipt = true,
  onPaymentReceived,
  className,
  compact = true
}) => {
  const [language, setLanguage] = useState<'HI' | 'EN'>(defaultLanguage);
  const [isAutoPrintEnabled, setIsAutoPrintEnabled] = useState<boolean>(autoPrintReceipt);
  const [lastPayment, setLastPayment] = useState<SoundboxPaymentEventDetail | null>(null);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const pulseTimerRef = useRef<any>(null);
  void setLanguage;
  void setIsAutoPrintEnabled;

  const handleProcessPayment = useCallback(
    (detail: SoundboxPaymentEventDetail) => {
      setLastPayment(detail);
      setIsPulsing(true);

      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setIsPulsing(false), 5000);

      // 1. Play two-tone soundbox chime
      playSoundboxChime();

      // 2. Announce amount in selected language after brief chime delay (300ms)
      setTimeout(() => {
        const textToSpeak =
          language === 'HI'
            ? detail.soundboxVoicePromptHindi || `DocSearch counter par ${detail.amount} rupaye praapt hue`
            : detail.soundboxVoicePromptEnglish || `Rupees ${detail.amount} received successfully on DocSearch UPI`;
        speakAnnouncement(textToSpeak, language);
      }, 320);

      // 3. Auto-cut ESC/POS receipt without receptionist intervention
      if (isAutoPrintEnabled) {
        autoCutThermalReceipt(detail, facilityName);
      }

      // 4. Callback
      if (onPaymentReceived) {
        onPaymentReceived(detail);
      }
    },
    [facilityName, isAutoPrintEnabled, language, onPaymentReceived]
  );

  // Global listener for soundbox payment notifications from WebSocket, soundbox webhook or polling
  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<SoundboxPaymentEventDetail>;
      if (customEvent.detail && typeof customEvent.detail.amount === 'number') {
        handleProcessPayment(customEvent.detail);
      }
    };

    window.addEventListener('docsearch:soundbox_payment', listener);
    return () => window.removeEventListener('docsearch:soundbox_payment', listener);
  }, [handleProcessPayment]);

  const handleTestChime = () => {
    handleProcessPayment({
      invoiceId: 'INV-TEST-001',
      invoiceNumber: 'INV-2026-TEST',
      amount: 500,
      patientName: 'Test Patient',
      payerVpa: 'patient@okhdfcbank',
      txnRef: `UPI-TEST-${Date.now().toString(36).toUpperCase()}`,
      soundboxVoicePromptHindi: 'DocSearch counter par 500 rupaye praapt hue',
      soundboxVoicePromptEnglish: 'Rupees 500 received successfully on DocSearch UPI'
    });
  };

  if (compact) {
    return (
      <div
        className={className}
        title={isPulsing && lastPayment ? `₹${lastPayment.amount} Received via UPI` : `UPI Soundbox Online (${language})`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          borderRadius: '8px',
          backgroundColor: isPulsing ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${isPulsing ? '#22C55E' : 'rgba(255, 255, 255, 0.08)'}`,
          fontSize: '0.75rem',
          color: isPulsing ? '#86EFAC' : '#94A3B8',
          flexShrink: 0,
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>🔊</span>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isPulsing ? '#22C55E' : '#10B981',
            boxShadow: '0 0 5px #10B981'
          }}
        />
        {isPulsing && lastPayment && (
          <span style={{ fontWeight: 800, color: '#86EFAC', fontSize: '0.72rem' }}>
            ₹{lastPayment.amount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '10px',
        backgroundColor: isPulsing ? 'rgba(34, 197, 94, 0.25)' : 'rgba(15, 23, 42, 0.75)',
        border: isPulsing ? '1.5px solid #22C55E' : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: isPulsing ? '0 0 16px rgba(34, 197, 94, 0.4)' : 'none',
        transition: 'all 0.25s ease',
        fontSize: '0.75rem'
      }}
    >
      {/* Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isPulsing ? '#22C55E' : '#10B981',
            boxShadow: '0 0 6px #10B981',
            animation: isPulsing ? 'pulse 1s infinite' : 'none'
          }}
        />
        <span style={{ fontWeight: 800, color: isPulsing ? '#86EFAC' : '#E2E8F0' }}>
          {isPulsing && lastPayment ? `₹${lastPayment.amount} Received!` : 'Soundbox Online'}
        </span>
      </div>

      {/* Language Toggle: HI / EN */}
      <button
        type="button"
        onClick={() => setLanguage((l) => (l === 'HI' ? 'EN' : 'HI'))}
        style={{
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#38BDF8',
          fontSize: '0.6875rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
        title={`Click to switch soundbox voice language (Currently: ${language === 'HI' ? 'Hindi' : 'English'})`}
      >
        {language === 'HI' ? '🗣️ Hindi' : '🗣️ English'}
      </button>

      {/* Auto-Print Receipt Indicator Toggle */}
      <button
        type="button"
        onClick={() => setIsAutoPrintEnabled((p) => !p)}
        style={{
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: isAutoPrintEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          border: isAutoPrintEnabled ? '1px solid #22C55E' : '1px solid rgba(255, 255, 255, 0.1)',
          color: isAutoPrintEnabled ? '#86EFAC' : '#94A3B8',
          fontSize: '0.6875rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
        title="Auto-Cut ESC/POS Receipt upon Soundbox payment confirmation"
      >
        {isAutoPrintEnabled ? '🖨️ Auto-Cut: ON' : '🖨️ Auto-Cut: OFF'}
      </button>

      {/* Test Chime Trigger */}
      <button
        type="button"
        onClick={handleTestChime}
        style={{
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid #38BDF8',
          color: '#38BDF8',
          fontSize: '0.6875rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
        title="Test Soundbox Audio & Chime"
      >
        🔊 Test ₹500
      </button>
    </div>
  );
};
