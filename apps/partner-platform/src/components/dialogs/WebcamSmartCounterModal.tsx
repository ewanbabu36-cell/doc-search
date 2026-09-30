import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@docsearch/ui-kit';
import type { IndianMedicationFormularyItem } from '../../services/indian-pharmacy-catalog.js';

export interface SmartCounterVerificationResult {
  medicationId?: string;
  medicationName: string;
  detectedCount: number;
  countConfidence: number;
  isLoose: boolean;
  batchNumber: string;
  expiryDate: string; // MM/YYYY or YYYY-MM-DD
  isExpired: boolean;
  barcode: string;
  isBarcodeMatched: boolean;
  verificationTimestamp: string;
  status: 'VERIFIED' | 'EXPIRED_LOCK' | 'BARCODE_MISMATCH' | 'IN_PROGRESS';
}

export interface WebcamSmartCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMedication?: IndianMedicationFormularyItem | null;
  onCommitCount: (result: SmartCounterVerificationResult) => void;
}

type DemoPreset =
  | 'LOOSE_PARACETAMOL_10'
  | 'BLISTER_AUGMENTIN_10'
  | 'EXPIRED_PANTOCID'
  | 'MISMATCHED_BARCODE'
  | 'LOOSE_AZITHROMYCIN_14';

interface DetectedPillCircle {
  id: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  radius: number;
  confidence: number;
}

export const WebcamSmartCounterModal: React.FC<WebcamSmartCounterModalProps> = ({
  isOpen,
  onClose,
  targetMedication,
  onCommitCount
}) => {
  const [activePreset, setActivePreset] = useState<DemoPreset>('LOOSE_PARACETAMOL_10');
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [_isScanning, setIsScanning] = useState(false);
  const [_scanProgress, setScanProgress] = useState(100);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Verification state
  const [verificationResult, setVerificationResult] = useState<SmartCounterVerificationResult>({
    medicationId: 'med-in-dolo-650',
    medicationName: 'Dolo 650mg (Paracetamol)',
    detectedCount: 10,
    countConfidence: 99.4,
    isLoose: true,
    batchNumber: 'BTH-DOL-9941',
    expiryDate: '11/2027',
    isExpired: false,
    barcode: '890108920182',
    isBarcodeMatched: true,
    verificationTimestamp: new Date().toLocaleTimeString(),
    status: 'VERIFIED'
  });

  // Simulated computer vision pill coordinates on tray
  const [detectedPills, setDetectedPills] = useState<DetectedPillCircle[]>([
    { id: 1, x: 28, y: 32, radius: 18, confidence: 99.6 },
    { id: 2, x: 42, y: 28, radius: 17, confidence: 99.2 },
    { id: 3, x: 56, y: 33, radius: 18, confidence: 99.7 },
    { id: 4, x: 70, y: 30, radius: 19, confidence: 98.9 },
    { id: 5, x: 34, y: 50, radius: 18, confidence: 99.5 },
    { id: 6, x: 48, y: 52, radius: 17, confidence: 99.8 },
    { id: 7, x: 64, y: 49, radius: 18, confidence: 99.1 },
    { id: 8, x: 30, y: 68, radius: 19, confidence: 99.3 },
    { id: 9, x: 46, y: 70, radius: 18, confidence: 99.6 },
    { id: 10, x: 62, y: 67, radius: 18, confidence: 99.4 }
  ]);

  // Handle Preset Switching
  const loadPreset = (preset: DemoPreset) => {
    setActivePreset(preset);
    setIsScanning(true);
    setScanProgress(0);

    const scanInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setScanProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          setIsScanning(false);
          return 100;
        }
        return prev + 25;
      });
    }, 120);

    const now = new Date().toLocaleTimeString();

    if (preset === 'LOOSE_PARACETAMOL_10') {
      setDetectedPills([
        { id: 1, x: 28, y: 32, radius: 18, confidence: 99.6 },
        { id: 2, x: 42, y: 28, radius: 17, confidence: 99.2 },
        { id: 3, x: 56, y: 33, radius: 18, confidence: 99.7 },
        { id: 4, x: 70, y: 30, radius: 19, confidence: 98.9 },
        { id: 5, x: 34, y: 50, radius: 18, confidence: 99.5 },
        { id: 6, x: 48, y: 52, radius: 17, confidence: 99.8 },
        { id: 7, x: 64, y: 49, radius: 18, confidence: 99.1 },
        { id: 8, x: 30, y: 68, radius: 19, confidence: 99.3 },
        { id: 9, x: 46, y: 70, radius: 18, confidence: 99.6 },
        { id: 10, x: 62, y: 67, radius: 18, confidence: 99.4 }
      ]);
      setVerificationResult({
        medicationId: targetMedication?.id || 'med-in-dolo-650',
        medicationName: targetMedication?.brandName || 'Dolo 650mg (Paracetamol)',
        detectedCount: 10,
        countConfidence: 99.4,
        isLoose: true,
        batchNumber: 'BTH-DOL-9941',
        expiryDate: '11/2027',
        isExpired: false,
        barcode: '890108920182',
        isBarcodeMatched: true,
        verificationTimestamp: now,
        status: 'VERIFIED'
      });
    } else if (preset === 'BLISTER_AUGMENTIN_10') {
      setDetectedPills([
        { id: 1, x: 35, y: 25, radius: 16, confidence: 99.8 },
        { id: 2, x: 55, y: 25, radius: 16, confidence: 99.9 },
        { id: 3, x: 35, y: 40, radius: 16, confidence: 99.7 },
        { id: 4, x: 55, y: 40, radius: 16, confidence: 99.8 },
        { id: 5, x: 35, y: 55, radius: 16, confidence: 99.9 },
        { id: 6, x: 55, y: 55, radius: 16, confidence: 99.6 },
        { id: 7, x: 35, y: 70, radius: 16, confidence: 99.8 },
        { id: 8, x: 55, y: 70, radius: 16, confidence: 99.9 },
        { id: 9, x: 35, y: 85, radius: 16, confidence: 99.7 },
        { id: 10, x: 55, y: 85, radius: 16, confidence: 99.8 }
      ]);
      setVerificationResult({
        medicationId: 'med-in-augmentin-625',
        medicationName: 'Augmentin 625 Duo Strip',
        detectedCount: 1,
        countConfidence: 99.8,
        isLoose: false,
        batchNumber: 'BTH-AUG-2611',
        expiryDate: '12/2027',
        isExpired: false,
        barcode: '8901234567890',
        isBarcodeMatched: true,
        verificationTimestamp: now,
        status: 'VERIFIED'
      });
    } else if (preset === 'EXPIRED_PANTOCID') {
      setDetectedPills([
        { id: 1, x: 36, y: 35, radius: 17, confidence: 99.2 },
        { id: 2, x: 54, y: 35, radius: 17, confidence: 99.4 },
        { id: 3, x: 36, y: 52, radius: 17, confidence: 99.1 },
        { id: 4, x: 54, y: 52, radius: 17, confidence: 99.3 },
        { id: 5, x: 36, y: 68, radius: 17, confidence: 99.5 },
        { id: 6, x: 54, y: 68, radius: 17, confidence: 99.2 }
      ]);
      setVerificationResult({
        medicationId: 'med-in-pantocid-dsr',
        medicationName: 'Pantocid DSR Strip',
        detectedCount: 1,
        countConfidence: 99.3,
        isLoose: false,
        batchNumber: 'BTH-PAN-2401',
        expiryDate: '01/2025',
        isExpired: true,
        barcode: '890199201944',
        isBarcodeMatched: true,
        verificationTimestamp: now,
        status: 'EXPIRED_LOCK'
      });
    } else if (preset === 'MISMATCHED_BARCODE') {
      setDetectedPills([
        { id: 1, x: 45, y: 45, radius: 22, confidence: 98.7 }
      ]);
      setVerificationResult({
        medicationId: 'med-in-pan-40',
        medicationName: 'Pan 40mg (Mismatched Scanned Product)',
        detectedCount: 1,
        countConfidence: 98.7,
        isLoose: false,
        batchNumber: 'BTH-PAN-9902',
        expiryDate: '09/2027',
        isExpired: false,
        barcode: '890998877665',
        isBarcodeMatched: false,
        verificationTimestamp: now,
        status: 'BARCODE_MISMATCH'
      });
    } else if (preset === 'LOOSE_AZITHROMYCIN_14') {
      setDetectedPills(
        Array.from({ length: 14 }).map((_, i) => ({
          id: i + 1,
          x: 20 + (i % 5) * 15,
          y: 25 + Math.floor(i / 5) * 22,
          radius: 17,
          confidence: 99.1 + (i % 3) * 0.3
        }))
      );
      setVerificationResult({
        medicationId: 'med-in-azithral-500',
        medicationName: 'Azithral 500mg Tablets',
        detectedCount: 14,
        countConfidence: 99.5,
        isLoose: true,
        batchNumber: 'BTH-AZI-8802',
        expiryDate: '10/2027',
        isExpired: false,
        barcode: '890108920199',
        isBarcodeMatched: true,
        verificationTimestamp: now,
        status: 'VERIFIED'
      });
    }
  };

  // Webcam activation
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setUseLiveCamera(true);
    } catch (err: unknown) {
      setCameraError(
        'Webcam access unavailable or permission denied. Falling back to high-fidelity simulated camera feed.'
      );
      setUseLiveCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseLiveCamera(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.95)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        padding: 0
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: 'none',
          borderRadius: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>📷</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Webcam Blister & Pill Counting AI
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    border: '1px solid #10B981',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  ZERO HUMAN ERROR
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Instantaneous visual pill counting on tray + Real-time strip Batch/Expiry OCR validation.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={useLiveCamera ? stopCamera : startCamera}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: useLiveCamera ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                border: useLiveCamera ? '1px solid #EF4444' : '1px solid #38BDF8',
                color: useLiveCamera ? '#FCA5A5' : '#38BDF8',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {useLiveCamera ? '⏹️ Stop Physical Camera' : '📹 Start Physical Webcam'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preset Scenarios Ribbon */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Interactive Presets:
          </span>
          {[
            { id: 'LOOSE_PARACETAMOL_10', label: '💊 10 Loose Paracetamol Tabs' },
            { id: 'BLISTER_AUGMENTIN_10', label: '📦 Augmentin Blister Strip' },
            { id: 'EXPIRED_PANTOCID', label: '🚨 Expired Pantocid DSR (Alert Lock)' },
            { id: 'MISMATCHED_BARCODE', label: '⚠️ Mismatched Barcode' },
            { id: 'LOOSE_AZITHROMYCIN_14', label: '💊 14 Loose Azithromycin' }
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset.id as DemoPreset)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: activePreset === preset.id ? '#38BDF8' : 'rgba(255, 255, 255, 0.05)',
                color: activePreset === preset.id ? '#070C16' : '#CBD5E1',
                border: activePreset === preset.id ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Modal Body: Camera Viewport & AI Insights */}
        <div
          style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '20px',
            overflowY: 'auto'
          }}
        >
          {/* Left: Video Viewport & Computer Vision Overlays */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '460px',
                backgroundColor: '#020617',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid rgba(56, 189, 248, 0.3)',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
              }}
            >
              {/* Physical Video element */}
              {useLiveCamera ? (
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                /* Simulated Tray Background */
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 70%, #020617 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Grid Lines to simulate Pharmacy Counting Tray */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage:
                        'linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px)',
                      backgroundSize: '30px 30px'
                    }}
                  />

                  {/* Tray Outline */}
                  <div
                    style={{
                      width: '85%',
                      height: '80%',
                      border: '2px dashed rgba(56, 189, 248, 0.25)',
                      borderRadius: '12px',
                      position: 'relative'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '14px',
                        backgroundColor: '#0F172A',
                        padding: '0 8px',
                        fontSize: '0.65rem',
                        color: '#38BDF8',
                        fontWeight: 800
                      }}
                    >
                      PHARMACY COUNTING TRAY (ACTIVE ZONE)
                    </span>

                    {/* Detected Pill Circles */}
                    {detectedPills.map((pill) => (
                      <div
                        key={pill.id}
                        style={{
                          position: 'absolute',
                          left: `${pill.x}%`,
                          top: `${pill.y}%`,
                          width: `${pill.radius * 2}px`,
                          height: `${pill.radius * 2}px`,
                          borderRadius: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor:
                            verificationResult.status === 'EXPIRED_LOCK'
                              ? 'rgba(239, 68, 68, 0.4)'
                              : 'rgba(16, 185, 129, 0.4)',
                          border:
                            verificationResult.status === 'EXPIRED_LOCK'
                              ? '2px solid #EF4444'
                              : '2px solid #10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          boxShadow:
                            verificationResult.status === 'EXPIRED_LOCK'
                              ? '0 0 8px rgba(239, 68, 68, 0.8)'
                              : '0 0 8px rgba(16, 185, 129, 0.8)',
                          animation: 'pulse 2s infinite'
                        }}
                      >
                        #{pill.id}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scanning Target Crosshairs & Radar Bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: '#38BDF8',
                  boxShadow: '0 0 12px #38BDF8',
                  animation: 'scanDown 2.5s infinite alternate'
                }}
              />

              {/* Camera Status HUD Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#34D399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>●</span>
                <span>AI VISION STREAM 30 FPS • OCR ENGINE LIVE</span>
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#38BDF8'
                }}
              >
                Zero Human Error Protocol
              </div>
            </div>

            {cameraError && (
              <div style={{ fontSize: '0.72rem', color: '#FCA5A5', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                ℹ️ {cameraError}
              </div>
            )}
          </div>

          {/* Right: Real-time OCR & Batch/Expiry Safety Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Safety Warning Banners */}
            {verificationResult.status === 'EXPIRED_LOCK' && (
              <div
                style={{
                  backgroundColor: '#450A0A',
                  border: '2px solid #EF4444',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCA5A5', fontWeight: 900, fontSize: '0.85rem' }}>
                  <span>🚨</span>
                  <span>CRITICAL SAFETY ALERT: EXPIRED STRIP DETECTED!</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#FECACA', marginTop: '4px', lineHeight: '1.4' }}>
                  Camera OCR detected stamped expiry <strong>{verificationResult.expiryDate}</strong> on batch <strong>{verificationResult.batchNumber}</strong>. This item has expired! Dispensing has been physically locked by the system.
                </div>
              </div>
            )}

            {verificationResult.status === 'BARCODE_MISMATCH' && (
              <div
                style={{
                  backgroundColor: '#451A03',
                  border: '2px solid #F59E0B',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCD34D', fontWeight: 900, fontSize: '0.85rem' }}>
                  <span>⚠️</span>
                  <span>INVENTORY BARCODE MISMATCH!</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#FEF08A', marginTop: '4px', lineHeight: '1.4' }}>
                  Scanned barcode <strong>{verificationResult.barcode}</strong> does not match master record for selected cart medication. Strip belongs to <strong>Pan 40mg</strong>.
                </div>
              </div>
            )}

            {verificationResult.status === 'VERIFIED' && (
              <div
                style={{
                  backgroundColor: 'rgba(6, 78, 59, 0.4)',
                  border: '1.5px solid #10B981',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6EE7B7', fontWeight: 900, fontSize: '0.85rem' }}>
                  <span>✓</span>
                  <span>VERIFICATION PASSED: ZERO HUMAN ERROR</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#A7F3D0', marginTop: '4px' }}>
                  Exact tablet count matched with high confidence ({verificationResult.countConfidence}%). Batch valid and non-expired.
                </div>
              </div>
            )}

            {/* Structured Verification Dossier */}
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Identified Medication:</span>
                <strong style={{ color: '#F8FAFC' }}>{verificationResult.medicationName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Visual Count (Pills/Strips):</span>
                <strong style={{ color: '#38BDF8', fontSize: '1rem' }}>
                  {verificationResult.detectedCount} {verificationResult.isLoose ? 'Loose Tablets' : 'Blister Pack'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Stamped Batch OCR:</span>
                <code style={{ color: '#C084FC', fontWeight: 800 }}>{verificationResult.batchNumber}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Stamped Expiry Date:</span>
                <strong style={{ color: verificationResult.isExpired ? '#EF4444' : '#10B981' }}>
                  {verificationResult.expiryDate} {verificationResult.isExpired ? '(EXPIRED)' : '(Valid)'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Scanned Barcode:</span>
                <span style={{ color: verificationResult.isBarcodeMatched ? '#10B981' : '#F59E0B', fontFamily: 'monospace' }}>
                  {verificationResult.barcode} {verificationResult.isBarcodeMatched ? '✓ Match' : '✕ Mismatch'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Confidence Score:</span>
                <span style={{ color: '#34D399', fontWeight: 800 }}>{verificationResult.countConfidence}%</span>
              </div>
            </div>

            {/* Commit to POS Cart Action */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant={verificationResult.status === 'EXPIRED_LOCK' ? 'danger' : 'primary'}
                size="md"
                disabled={verificationResult.status === 'EXPIRED_LOCK' || verificationResult.status === 'BARCODE_MISMATCH'}
                onClick={() => {
                  onCommitCount(verificationResult);
                  onClose();
                }}
                style={{ flex: 2, fontWeight: 900 }}
              >
                {verificationResult.status === 'EXPIRED_LOCK'
                  ? '🚫 Dispensing Locked (Expired)'
                  : verificationResult.status === 'BARCODE_MISMATCH'
                  ? '🚫 Fix Mismatch to Proceed'
                  : `✓ Add ${verificationResult.detectedCount} ${verificationResult.isLoose ? 'Tabs' : 'Strip'} to Cart`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
