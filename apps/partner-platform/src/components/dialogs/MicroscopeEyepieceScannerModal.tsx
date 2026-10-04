import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@docsearch/ui-kit';

export type SmearPresetType =
  | 'MALARIA_FALCIPARUM'
  | 'SICKLE_CELL_ANEMIA'
  | 'ATYPICAL_BLASTS'
  | 'NORMAL_BLOOD_FILM';

export interface MicroscopeCellTag {
  id: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  radius: number;
  label: string;
  type: 'MALARIA_RING' | 'SICKLED_RBC' | 'ATYPICAL_BLAST' | 'NORMAL_RBC' | 'PLATELET';
  color: string;
  confidence: number;
}

export interface MicroscopeSmearReport {
  presetType: SmearPresetType;
  primaryDiagnosis: string;
  icd10: string;
  severity: 'CRITICAL_ALERT' | 'HIGH_ATTENTION' | 'NORMAL';
  totalRbcScanned: number;
  abnormalCount: number;
  abnormalPercentage: number;
  parasitemiaIndex?: string;
  morphologyDescription: string;
  clinicalRecommendation: string;
  confidenceScore: number;
}

export interface MicroscopeEyepieceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientMrn?: string;
  orderNumber?: string;
  onCommitSmearResults: (report: MicroscopeSmearReport) => void;
}

export const MicroscopeEyepieceScannerModal: React.FC<MicroscopeEyepieceScannerModalProps> = ({
  isOpen,
  onClose,
  patientName = 'Sunil Verma',
  patientMrn = 'MRN-2026-9041',
  orderNumber = 'ORD-LAB-2026-8819',
  onCommitSmearResults
}) => {
  const [selectedPreset, setSelectedPreset] = useState<SmearPresetType>('MALARIA_FALCIPARUM');
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [opticalMagnification, setOpticalMagnification] = useState<'40X' | '100X_OIL'>('100X_OIL');
  const [focusLevel, setFocusLevel] = useState<number>(100); // 90 to 110
  const [isCommitted, setIsCommitted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cell annotations based on selected smear
  const cellTags: Record<SmearPresetType, MicroscopeCellTag[]> = {
    MALARIA_FALCIPARUM: [
      { id: 1, x: 38, y: 32, radius: 14, label: 'P. falc Ring #1', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 99.4 },
      { id: 2, x: 58, y: 28, radius: 13, label: 'P. falc Ring #2', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 99.1 },
      { id: 3, x: 28, y: 48, radius: 14, label: 'P. falc Ring #3', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 99.6 },
      { id: 4, x: 68, y: 44, radius: 15, label: 'P. falc Ring #4', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 98.9 },
      { id: 5, x: 44, y: 58, radius: 14, label: 'P. falc Ring #5', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 99.5 },
      { id: 6, x: 62, y: 64, radius: 14, label: 'P. falc Ring #6', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 99.2 },
      { id: 7, x: 32, y: 72, radius: 15, label: 'Gametocyte #1', type: 'MALARIA_RING', color: '#C084FC', confidence: 98.7 },
      { id: 8, x: 50, y: 76, radius: 14, label: 'P. falc Ring #7', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 99.3 },
      { id: 9, x: 74, y: 62, radius: 13, label: 'P. falc Ring #8', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 99.0 },
      { id: 10, x: 48, y: 38, radius: 14, label: 'P. falc Ring #9', type: 'MALARIA_RING', color: '#8B5CF6', confidence: 99.4 }
    ],
    SICKLE_CELL_ANEMIA: [
      { id: 1, x: 32, y: 35, radius: 18, label: 'Drepanocyte #1', type: 'SICKLED_RBC', color: '#EF4444', confidence: 99.6 },
      { id: 2, x: 52, y: 28, radius: 17, label: 'Drepanocyte #2', type: 'SICKLED_RBC', color: '#EF4444', confidence: 99.4 },
      { id: 3, x: 68, y: 36, radius: 19, label: 'Drepanocyte #3', type: 'SICKLED_RBC', color: '#EF4444', confidence: 99.1 },
      { id: 4, x: 28, y: 56, radius: 18, label: 'Drepanocyte #4', type: 'SICKLED_RBC', color: '#EF4444', confidence: 99.5 },
      { id: 5, x: 48, y: 52, radius: 16, label: 'Target Cell #1', type: 'SICKLED_RBC', color: '#F59E0B', confidence: 98.2 },
      { id: 6, x: 65, y: 58, radius: 19, label: 'Drepanocyte #5', type: 'SICKLED_RBC', color: '#EF4444', confidence: 99.7 },
      { id: 7, x: 38, y: 74, radius: 18, label: 'Drepanocyte #6', type: 'SICKLED_RBC', color: '#EF4444', confidence: 99.3 },
      { id: 8, x: 58, y: 72, radius: 17, label: 'Drepanocyte #7', type: 'SICKLED_RBC', color: '#EF4444', confidence: 99.2 }
    ],
    ATYPICAL_BLASTS: [
      { id: 1, x: 42, y: 38, radius: 24, label: 'Myeloblast #1 (Auer Rod)', type: 'ATYPICAL_BLAST', color: '#EF4444', confidence: 98.9 },
      { id: 2, x: 62, y: 44, radius: 22, label: 'Myeloblast #2 (Nucleoli)', type: 'ATYPICAL_BLAST', color: '#EF4444', confidence: 98.4 },
      { id: 3, x: 38, y: 64, radius: 23, label: 'Myeloblast #3 (High N:C)', type: 'ATYPICAL_BLAST', color: '#EF4444', confidence: 99.1 },
      { id: 4, x: 58, y: 68, radius: 21, label: 'Atypical Blast #4', type: 'ATYPICAL_BLAST', color: '#EF4444', confidence: 97.8 }
    ],
    NORMAL_BLOOD_FILM: [
      { id: 1, x: 45, y: 48, radius: 16, label: 'Normal Neutrophil', type: 'NORMAL_RBC', color: '#10B981', confidence: 99.6 },
      { id: 2, x: 32, y: 36, radius: 12, label: 'Normocytic RBC', type: 'NORMAL_RBC', color: '#38BDF8', confidence: 99.8 },
      { id: 3, x: 62, y: 34, radius: 12, label: 'Normocytic RBC', type: 'NORMAL_RBC', color: '#38BDF8', confidence: 99.7 },
      { id: 4, x: 58, y: 64, radius: 12, label: 'Normocytic RBC', type: 'NORMAL_RBC', color: '#38BDF8', confidence: 99.9 }
    ]
  };

  // Diagnostic Smear Reports
  const smearReports: Record<SmearPresetType, MicroscopeSmearReport> = {
    MALARIA_FALCIPARUM: {
      presetType: 'MALARIA_FALCIPARUM',
      primaryDiagnosis: 'Plasmodium falciparum Ring Stage (High Density Malaria)',
      icd10: 'B50.9 — Plasmodium falciparum malaria, unspecified',
      severity: 'CRITICAL_ALERT',
      totalRbcScanned: 180,
      abnormalCount: 18,
      abnormalPercentage: 10.0,
      parasitemiaIndex: '10.0% Parasitemia (Severe Parasite Density: ~50,000 parasites/μL)',
      morphologyDescription:
        'Delicate headphone-shaped trophozoite ring forms identified within normocytic erythrocytes. Multiple ring forms per erythrocyte observed. Crescent-shaped gametocyte noted. Maurer clefts visible.',
      clinicalRecommendation:
        'Urgent intravenous Artesunate / Artemisinin-based combination therapy (ACT). Monitor platelet count and renal parameters.',
      confidenceScore: 99.2
    },
    SICKLE_CELL_ANEMIA: {
      presetType: 'SICKLE_CELL_ANEMIA',
      primaryDiagnosis: 'Sickle Cell Disease (Drepanocyte Crisis / HbSS Pattern)',
      icd10: 'D57.1 — Sickle-cell disease without crisis',
      severity: 'CRITICAL_ALERT',
      totalRbcScanned: 175,
      abnormalCount: 34,
      abnormalPercentage: 19.4,
      morphologyDescription:
        'Significant poikilocytosis with 19.4% classical elongated crescentic drepanocytes with pointed spicules. Moderate polychromasia, target cells (8.0%), and Howell-Jolly bodies detected.',
      clinicalRecommendation:
        'High-hydration therapy, analgesia, and confirm with Hb Electrophoresis / HPLC testing. Hydroxyurea dosage review indicated.',
      confidenceScore: 99.4
    },
    ATYPICAL_BLASTS: {
      presetType: 'ATYPICAL_BLASTS',
      primaryDiagnosis: 'Atypical Myeloblasts (>5% Cutoff — Acute Leukemia Suspicion)',
      icd10: 'C92.0 — Acute myeloblastic leukemia',
      severity: 'CRITICAL_ALERT',
      totalRbcScanned: 100,
      abnormalCount: 16,
      abnormalPercentage: 16.0,
      morphologyDescription:
        'Peripheral blood blast count measured at 16% (>5% abnormal cutoff). Blasts exhibit high nuclear-to-cytoplasmic ratio, fine reticular chromatin, 2-3 prominent nucleoli, and rare Auer rods.',
      clinicalRecommendation:
        'Urgent Bone Marrow Aspiration & Biopsy with Flow Cytometry Immunophenotyping. Immediate Hematology/Oncology consult.',
      confidenceScore: 98.7
    },
    NORMAL_BLOOD_FILM: {
      presetType: 'NORMAL_BLOOD_FILM',
      primaryDiagnosis: 'Normal Peripheral Blood Film (Normocytic, Normochromic)',
      icd10: 'Z00.00 — Normal Peripheral Blood Film',
      severity: 'NORMAL',
      totalRbcScanned: 200,
      abnormalCount: 0,
      abnormalPercentage: 0.0,
      morphologyDescription:
        'Normocytic normochromic red cells with regular central pallor. White blood cell count and distribution unremarkable. Adequate platelet clumps on film.',
      clinicalRecommendation:
        'Routine sign-off. Normal peripheral film morphology.',
      confidenceScore: 99.6
    }
  };

  const activeReport = smearReports[selectedPreset];
  const activeTags = cellTags[selectedPreset];

  // Camera handling
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
      setCameraError('Microscope eyepiece camera unavailable. Falling back to high-resolution optical simulation.');
      setUseLiveCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
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
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid #8B5CF6',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
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
            backgroundColor: 'rgba(15, 23, 42, 0.95)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1.5px solid #8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              🔬
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Digital Pathology / WSI Viewer (Blood Smear Morphology)
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: '#C084FC',
                    border: '1px solid #8B5CF6',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  100X OIL IMMERSION RETICLE
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Whole Slide Imaging (WSI) &amp; peripheral blood smear examination. Microscopic reticle analysis for Leishman stain, Malaria parasites, Sickle Cells, and blast morphology.
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
                backgroundColor: useLiveCamera ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                border: useLiveCamera ? '1px solid #EF4444' : '1px solid #8B5CF6',
                color: useLiveCamera ? '#FCA5A5' : '#C084FC',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {useLiveCamera ? '⏹️ Stop Live Cam' : '📱 Mobile Eyepiece Feed'}
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

        {/* Preset Pathology Smear Ribbons */}
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
            Select Slide Smear:
          </span>
          {[
            { id: 'MALARIA_FALCIPARUM', label: '🦟 1. Malaria (P. falciparum Rings & Gametocytes)' },
            { id: 'SICKLE_CELL_ANEMIA', label: '🩸 2. Sickle Cell Anemia (Drepanocytes)' },
            { id: 'ATYPICAL_BLASTS', label: '🧬 3. Acute Leukemia (Atypical Myeloblasts)' },
            { id: 'NORMAL_BLOOD_FILM', label: '🔬 4. Normal Blood Film (Clean)' }
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedPreset(preset.id as SmearPresetType);
                setIsCommitted(false);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: selectedPreset === preset.id ? '#8B5CF6' : 'rgba(255, 255, 255, 0.05)',
                color: selectedPreset === preset.id ? '#FFF' : '#CBD5E1',
                border: selectedPreset === preset.id ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Modal Body: Microscope Optical Reticle Viewport (Left) & AI Findings (Right) */}
        <div
          style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: '380px 1fr',
            gap: '20px',
            overflowY: 'auto'
          }}
        >
          {/* Left: Circular Microscope Eyepiece Viewport */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                position: 'relative',
                width: '360px',
                height: '360px',
                borderRadius: '50%',
                backgroundColor: '#020617',
                overflow: 'hidden',
                border: '6px solid #1E293B',
                boxShadow: '0 0 30px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.8)'
              }}
            >
              {/* Physical Mobile Video Feed */}
              {useLiveCamera ? (
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  autoPlay
                  playsInline
                  muted
                />
              ) : null}
              {cameraError && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', color: '#EF4444', fontSize: '0.75rem', zIndex: 10 }}>
                  {cameraError}
                </div>
              )}
              {!useLiveCamera && (
                /* Simulated Microscope Oil Immersion Field */
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, #312E81 0%, #1E1B4B 60%, #0F172A 100%)',
                    position: 'relative',
                    filter: `blur(${Math.abs(focusLevel - 100) * 0.1}px)`
                  }}
                >
                  {/* Subtle RBC Stippling in Background */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage:
                        'radial-gradient(circle, rgba(239, 68, 68, 0.25) 8px, transparent 9px)',
                      backgroundSize: '36px 36px',
                      opacity: 0.7
                    }}
                  />

                  {/* Optical Reticle Crosshairs */}
                  <div style={{ position: 'absolute', top: '50%', left: '15%', right: '15%', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <div style={{ position: 'absolute', left: '50%', top: '15%', bottom: '15%', width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <div style={{ position: 'absolute', top: '35%', left: '35%', width: '30%', height: '30%', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '50%' }} />

                  {/* Tagged Abnormal / Target Cells on Smear */}
                  {activeTags.map((cell) => (
                    <div
                      key={cell.id}
                      style={{
                        position: 'absolute',
                        left: `${cell.x}%`,
                        top: `${cell.y}%`,
                        width: `${cell.radius * 2}px`,
                        height: `${cell.radius * 2}px`,
                        borderRadius: cell.type === 'SICKLED_RBC' ? '50% 10% 50% 10%' : '50%',
                        transform: cell.type === 'SICKLED_RBC' ? 'translate(-50%, -50%) rotate(25deg)' : 'translate(-50%, -50%)',
                        border: `2px solid ${cell.color}`,
                        backgroundColor: cell.color === '#8B5CF6' ? 'rgba(139, 92, 246, 0.4)' : cell.color === '#EF4444' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)',
                        boxShadow: `0 0 10px ${cell.color}`,
                        animation: 'pulse 2s infinite',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        fontSize: '0.6rem',
                        fontWeight: 900
                      }}
                    >
                      #{cell.id}
                    </div>
                  ))}
                </div>
              )}

              {/* Eyepiece Circular Bezel Shadow & OSD */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  boxShadow: 'inset 0 0 50px rgba(0,0,0,0.95)',
                  pointerEvents: 'none'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#C084FC',
                  pointerEvents: 'none'
                }}
              >
                FIELD RETICLE: {opticalMagnification}
              </div>
            </div>

            {/* Microscopic Optical Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setOpticalMagnification('40X')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: opticalMagnification === '40X' ? '#8B5CF6' : '#1E293B',
                  color: '#FFF',
                  border: '1px solid #475569',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                40x High Dry
              </button>
              <button
                type="button"
                onClick={() => setOpticalMagnification('100X_OIL')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: opticalMagnification === '100X_OIL' ? '#8B5CF6' : '#1E293B',
                  color: '#FFF',
                  border: '1px solid #475569',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                100x Oil Immersion
              </button>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Fine Focus:</span>
              <input
                type="range"
                min={95}
                max={105}
                value={focusLevel}
                onChange={(e) => setFocusLevel(Number(e.target.value))}
                style={{ width: '70px' }}
              />
            </div>
          </div>

          {/* Right: AI Differential Cell Counting & Diagnostic Dossier */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Critical Findings Alert Banner */}
            {activeReport.severity === 'CRITICAL_ALERT' && (
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
                  <span>PATHOLOGY CRITICAL FINDING DETECTED!</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#FECACA', marginTop: '4px', lineHeight: '1.4' }}>
                  AI detected <strong>{activeReport.primaryDiagnosis}</strong> with {activeReport.confidenceScore}% confidence.
                  {activeReport.parasitemiaIndex && <div>• Parasitemia Index: <strong>{activeReport.parasitemiaIndex}</strong></div>}
                </div>
              </div>
            )}

            {activeReport.severity === 'NORMAL' && (
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
                  <span>NORMAL PERIPHERAL BLOOD MORPHOLOGY</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#A7F3D0', marginTop: '4px' }}>
                  Zero parasites, blast cells, or sickling hemoglobinopathy detected across {activeReport.totalRbcScanned} red blood cells.
                </div>
              </div>
            )}

            {/* Differential Cell Counting Matrix */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                <span style={{ color: '#94A3B8' }}>Patient & Order:</span>
                <strong style={{ color: '#F8FAFC' }}>{patientName} ({patientMrn}) • {orderNumber}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                <span style={{ color: '#94A3B8' }}>Total Red Cells Scanned:</span>
                <strong style={{ color: '#38BDF8' }}>{activeReport.totalRbcScanned} Cells</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                <span style={{ color: '#94A3B8' }}>Abnormal Cells / Parasites Counted:</span>
                <strong style={{ color: activeReport.abnormalCount > 0 ? '#EF4444' : '#10B981', fontSize: '0.95rem' }}>
                  {activeReport.abnormalCount} ({activeReport.abnormalPercentage}%)
                </strong>
              </div>

              {activeReport.parasitemiaIndex && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Parasitemia Density Index:</span>
                  <strong style={{ color: '#C084FC' }}>{activeReport.parasitemiaIndex}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                <span style={{ color: '#94A3B8' }}>ICD-10 Diagnostic Impression:</span>
                <span style={{ color: '#FCD34D', fontWeight: 800 }}>{activeReport.icd10}</span>
              </div>

              <div>
                <strong style={{ color: '#C084FC', display: 'block', marginBottom: '3px' }}>Microscopic Morphology Description:</strong>
                <span style={{ color: '#CBD5E1', fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {activeReport.morphologyDescription}
                </span>
              </div>
            </div>

            {/* Commit to Lab LIMS Action */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onCommitSmearResults(activeReport);
                  setIsCommitted(true);
                  onClose();
                }}
                style={{
                  flex: 2,
                  fontWeight: 900,
                  backgroundColor: isCommitted ? '#10B981' : '#8B5CF6',
                  borderColor: isCommitted ? '#10B981' : '#8B5CF6'
                }}
              >
                {isCommitted ? '✓ Differential Counts Committed to LIMS' : '✓ Push Differential Counts & Report to Lab LIMS'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
