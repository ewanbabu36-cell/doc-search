import React, { useState, useEffect, useRef } from 'react';
import {
  hardwareStatusService,
  type HardwarePeripheralOverview
} from '../../services/hardware-status-service.js';
import { hardwarePrinterService } from '../../services/hardware-printer-service.js';

export interface HardwareDiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'BARCODE' | 'PRINTER' | 'ANALYZER';
}

export const HardwareDiagnosticsDrawer: React.FC<HardwareDiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  defaultTab = 'BARCODE'
}) => {
  const [status, setStatus] = useState<HardwarePeripheralOverview>(() => hardwareStatusService.getStatus());
  const [activeTab, setActiveTab] = useState<'BARCODE' | 'PRINTER' | 'ANALYZER'>(defaultTab);
  const [testBarcodeInput, setTestBarcodeInput] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [isSimulatingAstm, setIsSimulatingAstm] = useState(false);
  const [astmConsoleLogs, setAstmConsoleLogs] = useState<string[]>([
    'ASTM E1381/E1394 Service Initialized.',
    'Listening on COM3 (115200 Baud, 8N1) & TCP 192.168.1.110:5000.'
  ]);

  const testInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = hardwareStatusService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setTimeout(() => {
        if (activeTab === 'BARCODE' && testInputRef.current) {
          testInputRef.current.focus();
        }
      }, 150);
    }
  }, [isOpen, defaultTab]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showFeedback = (type: 'success' | 'warning' | 'error', text: string) => {
    setActionFeedback({ type, text });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleTestScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testBarcodeInput.trim()) return;
    const parsed = hardwareStatusService.triggerBarcodeScan(testBarcodeInput.trim(), 14);
    showFeedback('success', `✓ Scanned ${parsed.raw} (${parsed.symbology})`);
    setTestBarcodeInput('');
  };

  const handleQuickScan = (code: string) => {
    const parsed = hardwareStatusService.triggerBarcodeScan(code, 12);
    showFeedback('success', `✓ Fast Wedge: ${parsed.raw} (${parsed.symbology})`);
  };

  const handlePrinterTest = async () => {
    const res = await hardwareStatusService.triggerPrinterTest();
    if (res.success) {
      showFeedback('success', res.message);
    } else {
      showFeedback('error', res.message);
    }
  };

  const handlePairUsbPrinter = async () => {
    try {
      const ok = await hardwarePrinterService.requestUsbPrinter();
      if (ok) {
        showFeedback('success', '✓ Paired TVS / ESC/POS thermal printer via WebUSB!');
      } else {
        showFeedback('warning', 'Pairing cancelled or no USB device selected.');
      }
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'WebUSB pairing failed');
    }
  };

  const handlePairSerialPrinter = async () => {
    try {
      const ok = await hardwarePrinterService.requestSerialPrinter(9600);
      if (ok) {
        showFeedback('success', '✓ Paired thermal printer via WebSerial virtual COM port!');
      } else {
        showFeedback('warning', 'WebSerial connection cancelled.');
      }
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'WebSerial pairing failed');
    }
  };

  const handleTriggerAstmStream = async () => {
    setIsSimulatingAstm(true);
    setAstmConsoleLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] <ENQ> Sending handshake to ${status.astmAnalyzer.model}...`,
      `[${new Date().toLocaleTimeString()}] <ACK> Handshake accepted by analyzer.`
    ]);

    const result = await hardwareStatusService.triggerAnalyzerSync();

    setAstmConsoleLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] H|\\^&|||${result.analyzer}||||||||E1394-97`,
      `[${new Date().toLocaleTimeString()}] P|1||MRN-4421||Sharma^Rahul|||M`,
      `[${new Date().toLocaleTimeString()}] O|1|${result.sampleId}||^^^CBC||||||||||||||||||O`,
      ...result.parameters.map(
        (p) => `[${new Date().toLocaleTimeString()}] R|^^^${p.name}|${p.value}|${p.unit}|${p.range}|N||F`
      ),
      `[${new Date().toLocaleTimeString()}] <EOT> Transmission complete (${result.parameters.length} parameters committed).`
    ]);

    setIsSimulatingAstm(false);
    showFeedback('success', `✓ Ingested ${result.parameters.length} hematology parameters from ${result.analyzer}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(11, 15, 23, 0.55)',
        backdropFilter: 'blur(4px)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          height: '100vh',
          backgroundColor: 'var(--ds-color-surface, #0F172A)',
          borderLeft: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--ds-color-text-primary, #F8FAFC)',
          animation: 'dsSlideInFromRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'rgba(30, 41, 59, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.35rem' }}>🔌</span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>Hardware Peripherals & Diagnostics</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Live health, USB wedge calibration, ESC/POS spooler & ASTM analyzer interface
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd
              style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              Alt+H / Esc
            </kbd>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#CBD5E1',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Status Feedback Toast */}
        {actionFeedback && (
          <div
            style={{
              margin: '12px 20px 0',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor:
                actionFeedback.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : actionFeedback.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              color:
                actionFeedback.type === 'success'
                  ? '#34D399'
                  : actionFeedback.type === 'warning'
                  ? '#FBBF24'
                  : '#F87171',
              border: `1px solid ${
                actionFeedback.type === 'success'
                  ? '#10B981'
                  : actionFeedback.type === 'warning'
                  ? '#F59E0B'
                  : '#EF4444'
              }`
            }}
          >
            {actionFeedback.text}
          </div>
        )}

        {/* 3. Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '12px 20px 0',
            gap: '8px',
            borderBottom: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('BARCODE')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'BARCODE' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'BARCODE' ? '#38BDF8' : '#94A3B8',
              borderBottom: activeTab === 'BARCODE' ? '2px solid #38BDF8' : '2px solid transparent',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔫</span>
            <span>Barcode Scanner Gun</span>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: status.barcodeGun.status === 'READY' ? '#10B981' : '#EF4444'
              }}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRINTER')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'PRINTER' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'PRINTER' ? '#38BDF8' : '#94A3B8',
              borderBottom: activeTab === 'PRINTER' ? '2px solid #38BDF8' : '2px solid transparent',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🖨️</span>
            <span>TVS 80mm ESC/POS</span>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: status.thermalPrinter.status === 'ONLINE' ? '#10B981' : '#EF4444'
              }}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ANALYZER')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'ANALYZER' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'ANALYZER' ? '#38BDF8' : '#94A3B8',
              borderBottom: activeTab === 'ANALYZER' ? '2px solid #38BDF8' : '2px solid transparent',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🧪</span>
            <span>ASTM Lab Analyzer</span>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: status.astmAnalyzer.status === 'SYNCED' ? '#10B981' : '#F59E0B'
              }}
            />
          </button>
        </div>

        {/* 4. Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* TAB 1: BARCODE SCANNER */}
          {activeTab === 'BARCODE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Telemetry Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Hardware Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        boxShadow: '0 0 8px #10B981'
                      }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34D399' }}>
                      {status.barcodeGun.status}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Avg Wedge Burst</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
                    {status.barcodeGun.avgBurstMs} ms
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Total Session Scans</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F1F5F9', marginTop: '4px' }}>
                    {status.barcodeGun.totalScans}
                  </div>
                </div>
              </div>

              {/* Live Interactive Scanner Test Box */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                    🎯 Live Barcode Scanner Test Pad
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 600 }}>
                    Auto Laser Sweep & Audio Chime
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  Click inside this box and trigger your physical USB barcode gun, or press any preset simulation below:
                </div>

                <form onSubmit={handleTestScanSubmit} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <input
                    ref={testInputRef}
                    type="text"
                    value={testBarcodeInput}
                    onChange={(e) => setTestBarcodeInput(e.target.value)}
                    placeholder="Aim barcode gun and pull trigger..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#0284C7',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Test Scan
                  </button>
                </form>

                {/* Quick Simulation Presets */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                    ⚡ One-Click Simulation Barcodes:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleQuickScan('8901030389211')}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#CBD5E1',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      💊 Paracetamol 650mg (EAN-13)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickScan('ACC-2026-9812')}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#CBD5E1',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      🧪 Vacutainer EDTA (ACC-9812)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickScan('UHID-4092-2026')}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#CBD5E1',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      👤 Patient Token (UHID-4092)
                    </button>
                  </div>
                </div>
              </div>

              {/* Scanner Hardware Specs */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0' }}>
                  Hardware Gun Configuration
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '0.72rem', color: '#94A3B8' }}>
                  <div>Device: <strong style={{ color: '#F8FAFC' }}>{status.barcodeGun.model}</strong></div>
                  <div>Protocol: <strong style={{ color: '#F8FAFC' }}>USB Keyboard Wedge (HID)</strong></div>
                  <div>Laser Beam Sweep: <strong style={{ color: '#34D399' }}>Enabled (600ms emerald)</strong></div>
                  <div>Audio Feedback: <strong style={{ color: '#34D399' }}>Web Audio Dual-Beep Active</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THERMAL PRINTER */}
          {activeTab === 'PRINTER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Printer Telemetry */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Printer Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        boxShadow: '0 0 8px #10B981'
                      }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34D399' }}>
                      {status.thermalPrinter.status}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Paper Spec</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
                    {status.thermalPrinter.paperWidth} (Auto-Cut)
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Slips Printed</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F1F5F9', marginTop: '4px' }}>
                    {status.thermalPrinter.totalReceiptsPrinted}
                  </div>
                </div>
              </div>

              {/* Printer Control Actions */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                  🖨️ Direct Hardware Pairing & Spooler
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  Connect direct POS hardware via Chrome WebUSB or WebSerial (RS-232 COM port) for silent thermal cutting.
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handlePairUsbPrinter}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      borderRadius: '8px',
                      color: '#34D399',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Pair WebUSB (TVS / Epson)
                  </button>
                  <button
                    type="button"
                    onClick={handlePairSerialPrinter}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38BDF8',
                      borderRadius: '8px',
                      color: '#38BDF8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Pair WebSerial (COM Port)
                  </button>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    onClick={handlePrinterTest}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#10B981',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#022C22',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🧾</span>
                    <span>Print 80mm Hardware Diagnostic Test Slip</span>
                  </button>
                </div>
              </div>

              {/* Sample Slip Format Preview */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#FFF',
                  color: '#000',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: '1.4'
                }}
              >
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  DOCSEARCH SUPER SPECIALTY
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.7rem' }}>TVS RP 3200 PLUS • 80mm ESC/POS</div>
                <div style={{ textAlign: 'center', margin: '6px 0' }}>--------------------------------</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TOKEN: #999</span>
                  <span>TIME: {new Date().toLocaleTimeString()}</span>
                </div>
                <div>PATIENT: Peripheral Self-Test Slip</div>
                <div>STATUS: 🟢 Hardware Connected & Ready</div>
                <div style={{ textAlign: 'center', margin: '6px 0' }}>--------------------------------</div>
                <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#555' }}>
                  * SILENT THERMAL CUT VERIFIED *
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASTM LAB ANALYZER */}
          {activeTab === 'ANALYZER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Telemetry */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Analyzer Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        boxShadow: '0 0 8px #10B981'
                      }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34D399' }}>
                      {status.astmAnalyzer.status}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Protocol Standard</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#A78BFA', marginTop: '4px' }}>
                    ASTM E1381/E1394
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Ingested Tests</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F1F5F9', marginTop: '4px' }}>
                    {status.astmAnalyzer.totalResultsIngested}
                  </div>
                </div>
              </div>

              {/* Analyzer Control Box */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(167, 139, 250, 0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                    🧪 Automated Analyzer Bridge
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#A78BFA', fontWeight: 600 }}>
                    Mindray BC-5000 / Sysmex XN-550
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  Direct serial / TCP interfacing for zero manual result transcription into phlebotomy orders.
                </div>

                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleTriggerAstmStream}
                    disabled={isSimulatingAstm}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#7C3AED',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: isSimulatingAstm ? 'not-allowed' : 'pointer',
                      opacity: isSimulatingAstm ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>⚡</span>
                    <span>{isSimulatingAstm ? 'Streaming ASTM Packet...' : 'Simulate Mindray ASTM Test Transmission'}</span>
                  </button>
                </div>
              </div>

              {/* Live Terminal Stream */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#020617',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'monospace',
                  fontSize: '0.72rem',
                  color: '#4ADE80',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                <div style={{ color: '#94A3B8', marginBottom: '6px', fontSize: '0.68rem' }}>
                  // LIVE ASTM E1381 SERIAL / TCP PACKET STREAM
                </div>
                {astmConsoleLogs.map((log, idx) => (
                  <div key={idx} style={{ lineHeight: '1.5' }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--ds-color-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(15, 23, 42, 0.8)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            MediSphere Hardware Bus • Low Latency Direct Driver v2.6.4
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Inspector
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dsSlideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
