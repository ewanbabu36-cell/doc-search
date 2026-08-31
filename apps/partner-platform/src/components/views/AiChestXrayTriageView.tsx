import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export const AiChestXrayTriageView: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<'PNEUMONIA' | 'CARDIOMEGALY' | 'EFFUSION' | 'NORMAL'>('PNEUMONIA');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [windowPreset, setWindowPreset] = useState<'LUNG' | 'MEDIASTINUM' | 'INVERT'>('LUNG');
  const [isSigned, setIsSigned] = useState(false);

  const casesData = {
    PNEUMONIA: {
      patientName: 'Ramesh Patel (54y / Male)',
      accessionNo: 'ACC-XR-2026-9041',
      studyType: 'Chest PA Digital Radiograph',
      urgency: 'HIGH',
      findingsSummary: 'Heterogeneous airspace opacity and consolidation noted in the right lower lung zone. Air bronchograms visible. Costophrenic angles sharp. Heart size within normal limits.',
      impression: 'Right Lower Lobe (RLL) Bacterial Lobar Pneumonia.',
      icd10: 'J18.9 — Pneumonia, unspecified organism',
      aiConfidence: 94.2,
      heatmapColor: 'rgba(239, 68, 68, 0.45)',
      heatmapPos: { top: '52%', left: '28%', width: '130px', height: '110px' },
      classifications: [
        { label: 'Airspace Consolidation (Pneumonia)', score: 94.2, status: 'HIGH_RISK', color: '#EF4444' },
        { label: 'Pleural Effusion', score: 18.5, status: 'LOW_RISK', color: '#10B981' },
        { label: 'Cardiomegaly', score: 14.0, status: 'NORMAL', color: '#10B981' },
        { label: 'Pneumothorax', score: 2.1, status: 'CLEAR', color: '#10B981' }
      ]
    },
    CARDIOMEGALY: {
      patientName: 'Shanti Devi (68y / Female)',
      accessionNo: 'ACC-XR-2026-9042',
      studyType: 'Chest PA Digital Radiograph',
      urgency: 'MODERATE',
      findingsSummary: 'Cardiothoracic ratio (CTR) measured at 0.58, indicating significant cardiac enlargement. Mild cephalization of pulmonary vasculature noted. No focal consolidation.',
      impression: 'Cardiomegaly with early pulmonary venous congestion (CHF).',
      icd10: 'I51.7 — Cardiomegaly',
      aiConfidence: 91.8,
      heatmapColor: 'rgba(245, 158, 11, 0.45)',
      heatmapPos: { top: '48%', left: '42%', width: '160px', height: '140px' },
      classifications: [
        { label: 'Cardiomegaly (CTR > 0.55)', score: 91.8, status: 'HIGH_RISK', color: '#F59E0B' },
        { label: 'Pulmonary Venous Congestion', score: 78.4, status: 'MODERATE', color: '#F59E0B' },
        { label: 'Consolidation', score: 11.2, status: 'NORMAL', color: '#10B981' },
        { label: 'Pneumothorax', score: 1.0, status: 'CLEAR', color: '#10B981' }
      ]
    },
    EFFUSION: {
      patientName: 'Sunil Kumar (47y / Male)',
      accessionNo: 'ACC-XR-2026-9043',
      studyType: 'Chest PA Digital Radiograph',
      urgency: 'HIGH',
      findingsSummary: 'Dense homogenous opacity blunting the right lateral and posterior costophrenic sulci with a distinct meniscus sign. Partial compressive atelectasis of adjacent lung base.',
      impression: 'Moderate Right-sided Pleural Effusion.',
      icd10: 'J90 — Pleural effusion, not elsewhere classified',
      aiConfidence: 92.5,
      heatmapColor: 'rgba(59, 130, 246, 0.45)',
      heatmapPos: { top: '65%', left: '22%', width: '150px', height: '90px' },
      classifications: [
        { label: 'Pleural Effusion (Meniscus Sign)', score: 92.5, status: 'HIGH_RISK', color: '#3B82F6' },
        { label: 'Basilar Atelectasis', score: 81.0, status: 'MODERATE', color: '#F59E0B' },
        { label: 'Cardiomegaly', score: 22.0, status: 'NORMAL', color: '#10B981' },
        { label: 'Pneumothorax', score: 3.5, status: 'CLEAR', color: '#10B981' }
      ]
    },
    NORMAL: {
      patientName: 'Priya Sharma (29y / Female)',
      accessionNo: 'ACC-XR-2026-9044',
      studyType: 'Chest PA Digital Radiograph',
      urgency: 'NORMAL',
      findingsSummary: 'Both lung fields are clear with normal vascular markings. Hilar and mediastinal contours are unremarkable. Cardiothoracic ratio is normal (<0.50). Bony cage intact.',
      impression: 'Normal Chest Radiograph. No acute cardiopulmonary disease.',
      icd10: 'Z00.00 — Encounter for general adult medical examination',
      aiConfidence: 98.4,
      heatmapColor: 'transparent',
      heatmapPos: { top: '0%', left: '0%', width: '0px', height: '0px' },
      classifications: [
        { label: 'Airspace Consolidation', score: 1.2, status: 'CLEAR', color: '#10B981' },
        { label: 'Pleural Effusion', score: 0.8, status: 'CLEAR', color: '#10B981' },
        { label: 'Cardiomegaly', score: 2.5, status: 'CLEAR', color: '#10B981' },
        { label: 'Pneumothorax', score: 0.5, status: 'CLEAR', color: '#10B981' }
      ]
    }
  };

  const currentData = casesData[selectedCase];

  const handleCaseSwitch = (c: typeof selectedCase) => {
    setSelectedCase(c);
    setIsSigned(false);
  };

  const handleSignOff = () => {
    setIsSigned(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.5rem' }}>🩻</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              AI Chest X-Ray & Radiology Triage Co-Pilot (Grad-CAM Vision)
            </h2>
            <Badge variant="primary">Deep Vision ResNet-101</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Automated chest radiograph pathology classifier with live visual heatmap overlay & radiologist reporting assistant.
          </p>
        </div>

        {/* Urgency Badge */}
        <div>
          <Badge variant={currentData.urgency === 'HIGH' ? 'danger' : currentData.urgency === 'MODERATE' ? 'warning' : 'success'}>
            Triage Priority: {currentData.urgency}
          </Badge>
        </div>
      </div>

      {/* Case Presets Bar */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Select Medical Case:
          </span>
          <button
            onClick={() => handleCaseSwitch('PNEUMONIA')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'PNEUMONIA' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'PNEUMONIA' ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'PNEUMONIA' ? '#FCA5A5' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🫁 1. Lobar Pneumonia (94.2%)
          </button>
          <button
            onClick={() => handleCaseSwitch('CARDIOMEGALY')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'CARDIOMEGALY' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'CARDIOMEGALY' ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'CARDIOMEGALY' ? '#FCD34D' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🫀 2. Cardiomegaly / CHF (91.8%)
          </button>
          <button
            onClick={() => handleCaseSwitch('EFFUSION')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'EFFUSION' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'EFFUSION' ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'EFFUSION' ? '#93C5FD' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🌊 3. Pleural Effusion (92.5%)
          </button>
          <button
            onClick={() => handleCaseSwitch('NORMAL')}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: selectedCase === 'NORMAL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)', border: selectedCase === 'NORMAL' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.08)', color: selectedCase === 'NORMAL' ? '#A7F3D0' : '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🟢 4. Clear / Normal Radiograph
          </button>
        </div>

        {/* Heatmap Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant={showHeatmap ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            {showHeatmap ? '🔥 Grad-CAM Heatmap: ON' : '👁️ Raw DICOM View'}
          </Button>
        </div>
      </div>

      {/* 2-Column Radiograph & Diagnostic Classifier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Left: Medical DICOM X-Ray Viewer Canvas */}
        <div style={{
          backgroundColor: '#05070B',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 25px rgba(6, 182, 212, 0.2)',
          position: 'relative'
        }}>
          {/* DICOM Info Header */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#38BDF8', fontFamily: 'monospace', marginBottom: '8px' }}>
            <span>{currentData.patientName}</span>
            <span>{currentData.accessionNo}</span>
          </div>

          {/* Simulated High-Res X-Ray Canvas */}
          <div style={{
            width: '100%',
            maxWidth: '380px',
            height: '420px',
            backgroundColor: '#0A0F1D',
            borderRadius: '10px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #1E293B',
            filter: windowPreset === 'INVERT' ? 'invert(1)' : 'none'
          }}>
            {/* SVG Anatomical Silhouette of Chest Cavity */}
            <svg viewBox="0 0 300 350" style={{ width: '90%', height: '90%', opacity: 0.85 }}>
              {/* Spine & Ribs */}
              <line x1="150" y1="20" x2="150" y2="330" stroke="#334155" strokeWidth="12" strokeDasharray="14 4" />
              {/* Clavicles */}
              <path d="M 40 50 Q 150 70 260 50" stroke="#64748B" strokeWidth="8" fill="none" />
              {/* Left Ribs */}
              <path d="M 150 90 Q 60 110 50 160 Q 50 220 150 250" stroke="#475569" strokeWidth="5" fill="none" />
              <path d="M 150 120 Q 70 140 60 190 Q 60 250 150 280" stroke="#475569" strokeWidth="5" fill="none" />
              <path d="M 150 150 Q 80 170 70 220 Q 70 280 150 300" stroke="#475569" strokeWidth="5" fill="none" />
              {/* Right Ribs */}
              <path d="M 150 90 Q 240 110 250 160 Q 250 220 150 250" stroke="#475569" strokeWidth="5" fill="none" />
              <path d="M 150 120 Q 230 140 240 190 Q 240 250 150 280" stroke="#475569" strokeWidth="5" fill="none" />
              <path d="M 150 150 Q 220 170 230 220 Q 230 280 150 300" stroke="#475569" strokeWidth="5" fill="none" />
              {/* Cardiac Silhouette */}
              <ellipse cx="140" cy="210" rx={selectedCase === 'CARDIOMEGALY' ? '68' : '45'} ry="55" fill="#1E293B" stroke="#64748B" strokeWidth="3" opacity="0.9" />
              {/* Diaphragm */}
              <path d="M 40 290 Q 90 260 150 285 Q 210 260 260 290" stroke="#64748B" strokeWidth="7" fill="none" />
            </svg>

            {/* AI Heatmap Overlay Bounding Box (Grad-CAM Glow) */}
            {showHeatmap && selectedCase !== 'NORMAL' && (
              <div
                style={{
                  position: 'absolute',
                  top: currentData.heatmapPos.top,
                  left: currentData.heatmapPos.left,
                  width: currentData.heatmapPos.width,
                  height: currentData.heatmapPos.height,
                  backgroundColor: currentData.heatmapColor,
                  border: '2px dashed #EF4444',
                  borderRadius: '12px',
                  boxShadow: '0 0 35px rgba(239, 68, 68, 0.6)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  padding: '4px'
                }}
              >
                <span style={{ fontSize: '0.625rem', backgroundColor: '#EF4444', color: '#FFF', padding: '2px 4px', borderRadius: '3px', fontWeight: 800 }}>
                  {currentData.aiConfidence}% AI FOCUS
                </span>
              </div>
            )}
          </div>

          {/* Windowing Preset Controls */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => setWindowPreset('LUNG')}
              style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: windowPreset === 'LUNG' ? '#06B6D4' : 'rgba(255,255,255,0.05)', color: windowPreset === 'LUNG' ? '#070C16' : '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Lung Window (W:1500 L:-600)
            </button>
            <button
              onClick={() => setWindowPreset('MEDIASTINUM')}
              style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: windowPreset === 'MEDIASTINUM' ? '#06B6D4' : 'rgba(255,255,255,0.05)', color: windowPreset === 'MEDIASTINUM' ? '#070C16' : '#94A3B8', fontSize: '0.6875rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Mediastinum (W:350 L:50)
            </button>
            <button
              onClick={() => setWindowPreset(windowPreset === 'INVERT' ? 'LUNG' : 'INVERT')}
              style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: windowPreset === 'INVERT' ? '#8B5CF6' : 'rgba(255,255,255,0.05)', color: '#FFFFFF', fontSize: '0.6875rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              🔄 Invert DICOM
            </button>
          </div>
        </div>

        {/* Right: AI Multi-Pathology Diagnostic Matrix & Report Draft */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
              📊 AI Pathology Diagnostic Breakdown
            </span>
            <Badge variant="primary">{currentData.studyType}</Badge>
          </div>

          {/* Classification Confidence Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentData.classifications.map((item) => (
              <div key={item.label} style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 800, fontFamily: 'monospace' }}>
                    {item.score}% ({item.status})
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.score}%`, height: '100%', backgroundColor: item.color, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Generated Structured Radiology Report */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '10px', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '2px' }}>Radiological Findings:</strong>
              <span style={{ color: '#CBD5E1' }}>{currentData.findingsSummary}</span>
            </div>
            <div>
              <strong style={{ color: '#10B981', display: 'block', marginBottom: '2px' }}>Diagnostic Impression:</strong>
              <span style={{ color: '#F8FAFC', fontWeight: 700 }}>{currentData.impression}</span>
            </div>
            <div>
              <strong style={{ color: '#C084FC', display: 'block', marginBottom: '2px' }}>ICD-10 Diagnostic Code:</strong>
              <span style={{ color: '#E9D5FF', fontFamily: 'monospace' }}>{currentData.icd10}</span>
            </div>
          </div>

          {/* Radiologist Verification & Sign-off Stamp */}
          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSignOff}
              style={{
                width: '100%',
                fontWeight: 800,
                backgroundColor: isSigned ? '#10B981' : '#06B6D4',
                borderColor: isSigned ? '#10B981' : '#06B6D4'
              }}
            >
              {isSigned ? '✓ Radiologist Report Signed & Pushed to PACS' : '✍️ Radiologist Electronic Sign-Off & Commit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
