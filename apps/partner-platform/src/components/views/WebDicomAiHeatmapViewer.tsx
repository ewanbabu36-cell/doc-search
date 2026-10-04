import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export type RadiologyModality = 'XRAY_CHEST' | 'XRAY_FRACTURE' | 'CT_BRAIN' | 'NORMAL';
export type WindowPreset = 'DEFAULT' | 'LUNG' | 'BONE' | 'BRAIN' | 'INVERT';

export interface RadiologyCase {
  id: string;
  patientName: string;
  patientMrn: string;
  patientAgeGender: string;
  accessionNumber: string;
  modalityType: string;
  studyDateTime: string;
  urgency: 'STAT_CRITICAL' | 'URGENT' | 'ROUTINE';
  isEmergencyPinned: boolean;
  priorityRank: number;
  aiDetectionTitle: string;
  aiConfidence: number;
  criticalFindingDescription: string;
  impression: string;
  icd10: string;
  recommendedAction: string;
  lesionBox: {
    top: string;
    left: string;
    width: string;
    height: string;
    label: string;
  };
  heatmapGradient: string;
}

export const WebDicomAiHeatmapViewer: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-CT-BRAIN');
  const [showAiBox, setShowAiBox] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, _setHeatmapOpacity] = useState<number>(0.65);
  const [windowPreset, setWindowPreset] = useState<WindowPreset>('BRAIN');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isNotifiedEr, setIsNotifiedEr] = useState(false);
  const [isSignedOff, setIsSignedOff] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Preset Multi-Modality Radiology Cases with AI Detections
  const cases: RadiologyCase[] = [
    {
      id: 'CASE-CT-BRAIN',
      patientName: 'Kamla Devi',
      patientMrn: 'MRN-2026-8812',
      patientAgeGender: '71y / Female',
      accessionNumber: 'ACC-CT-2026-1049',
      modalityType: 'Non-Contrast Head CT (Axial Slices)',
      studyDateTime: '14 mins ago (ER Trauma Triage)',
      urgency: 'STAT_CRITICAL',
      isEmergencyPinned: true,
      priorityRank: 1,
      aiDetectionTitle: '🚨 ACUTE SUBDURAL BRAIN HEMORRHAGE & MIDLINE SHIFT',
      aiConfidence: 99.1,
      criticalFindingDescription:
        'Hyperdense crescent-shaped extra-axial collection measuring 14mm in maximum thickness over the right cerebral convexity. Causes compression of the ipsilateral lateral ventricle and 6.2mm leftward midline shift. Sulcal effacement noted.',
      impression:
        'Acute Right Fronto-Parietal Subdural Hematoma (SDH) with subfalcine herniation risk (6.2mm midline shift).',
      icd10: 'I62.01 — Non-traumatic acute subdural hemorrhage',
      recommendedAction:
        'STAT Neurosurgery consultation for urgent decompression burr hole / craniotomy. Hyperosmolar therapy initiated.',
      lesionBox: {
        top: '26%',
        left: '20%',
        width: '110px',
        height: '150px',
        label: 'SUBDURAL HEMORRHAGE (14mm) • 99.1%'
      },
      heatmapGradient: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.85) 0%, rgba(245, 158, 11, 0.5) 50%, transparent 80%)'
    },
    {
      id: 'CASE-XRAY-PNEUMO',
      patientName: 'Ramesh Verma',
      patientMrn: 'MRN-2026-9041',
      patientAgeGender: '48y / Male',
      accessionNumber: 'ACC-XR-2026-9041',
      modalityType: 'Chest PA Digital Radiograph',
      studyDateTime: '32 mins ago (ER Acute Breathlessness)',
      urgency: 'STAT_CRITICAL',
      isEmergencyPinned: true,
      priorityRank: 2,
      aiDetectionTitle: '🚨 RIGHT TENSION PNEUMOTHORAX DETECTED',
      aiConfidence: 98.4,
      criticalFindingDescription:
        'Distinct visceral pleural line visible in the right hemithorax with total absence of peripheral pulmonary vascular markings. 45% right lung collapse with mild contralateral tracheal deviation.',
      impression:
        'Large Right-Sided Tension Pneumothorax with lung collapse and mass effect on mediastinum.',
      icd10: 'J93.0 — Spontaneous tension pneumothorax',
      recommendedAction:
        'Immediate needle decompression (2nd intercostal space mid-clavicular line) followed by underwater intercostal chest drain (ICD).',
      lesionBox: {
        top: '18%',
        left: '60%',
        width: '125px',
        height: '160px',
        label: 'PNEUMOTHORAX (PLEURAL LINE) • 98.4%'
      },
      heatmapGradient: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.45) 55%, transparent 80%)'
    },
    {
      id: 'CASE-XRAY-FRACTURE',
      patientName: 'Vikram Malhotra',
      patientMrn: 'MRN-2026-9104',
      patientAgeGender: '32y / Male',
      accessionNumber: 'ACC-XR-2026-9104',
      modalityType: 'Right Wrist AP & Lateral Radiograph',
      studyDateTime: '1 hour ago (Orthopedic ER)',
      urgency: 'URGENT',
      isEmergencyPinned: false,
      priorityRank: 3,
      aiDetectionTitle: '⚠️ ACUTE DISPLACED DISTAL RADIUS FRACTURE',
      aiConfidence: 97.2,
      criticalFindingDescription:
        'Complete transverse fracture through the distal radial metaphysis approximately 2cm proximal to the radiocarpal joint with 18 degrees of dorsal angulation (Colles fracture pattern). Associated fracture of the ulnar styloid process.',
      impression:
        'Acute Displaced Distal Radius Fracture (Colles type) with Ulnar Styloid Avulsion.',
      icd10: 'S52.531A — Colles fracture of right radius, initial encounter',
      recommendedAction:
        'Closed reduction and plaster immobilization or percutaneous pinning / volar locking plate fixation.',
      lesionBox: {
        top: '42%',
        left: '38%',
        width: '100px',
        height: '90px',
        label: 'DISTAL RADIUS FRACTURE • 97.2%'
      },
      heatmapGradient: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.8) 0%, rgba(239, 68, 68, 0.5) 60%, transparent 80%)'
    },
    {
      id: 'CASE-XRAY-NORMAL',
      patientName: 'Priya Sharma',
      patientMrn: 'MRN-2026-9211',
      patientAgeGender: '29y / Female',
      accessionNumber: 'ACC-XR-2026-9211',
      modalityType: 'Chest PA Digital Radiograph',
      studyDateTime: '2 hours ago (Routine OPD)',
      urgency: 'ROUTINE',
      isEmergencyPinned: false,
      priorityRank: 4,
      aiDetectionTitle: '✓ CLEAR: NO ACUTE CARDIOPULMONARY LESION',
      aiConfidence: 98.9,
      criticalFindingDescription:
        'Both lung fields are clear with normal vascular arborization. Costophrenic and cardiophrenic sulci are sharp. Normal cardiothoracic ratio (<0.50). Thoracic cage intact.',
      impression: 'Normal Chest Radiograph. Zero acute pathology.',
      icd10: 'Z00.00 — Normal general medical examination',
      recommendedAction: 'Routine sign-off. No clinical intervention required.',
      lesionBox: { top: '0%', left: '0%', width: '0px', height: '0px', label: '' },
      heatmapGradient: 'none'
    }
  ];

  const currentCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) || cases[0]!,
    [selectedCaseId, cases]
  );

  const handleNotifyEr = () => {
    setIsNotifiedEr(true);
    showToast(`🚨 STAT ALERT Dispatched: Attending ER Physician notified of ${currentCase.aiDetectionTitle}!`);
  };

  const handleSignOff = () => {
    setIsSignedOff(true);
    showToast(`✓ Radiologist Report Signed & Committed to Hospital PACS!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#064E3B',
            border: '1.5px solid #10B981',
            color: '#ECFDF5',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🚨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Emergency STAT Top Banner if Critical Case Pinned */}
      {currentCase.isEmergencyPinned && (
        <div
          style={{
            backgroundColor: '#450A0A',
            border: '2px solid #EF4444',
            borderRadius: '16px',
            padding: '16px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
            animation: 'pulse 2.5s infinite'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.8rem' }}>🚨</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 900, color: '#FCA5A5', fontSize: '0.95rem' }}>
                  📌 EMERGENCY PRIORITY #1 AUTO-PINNED BY AI COPILOT
                </span>
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFF',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  STAT READING REQUIRED
                </span>
              </div>
              <div style={{ color: '#FECACA', fontSize: '0.82rem', marginTop: '2px' }}>
                Patient <strong>{currentCase.patientName}</strong> ({currentCase.patientAgeGender}) • {currentCase.aiDetectionTitle}. Automatically elevated to top of Radiologist worklist.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button
              variant="danger"
              size="sm"
              onClick={handleNotifyEr}
              style={{ fontWeight: 900, padding: '8px 16px', boxShadow: '0 0 16px rgba(239, 68, 68, 0.5)' }}
            >
              {isNotifiedEr ? '✓ ER Clinician Intimated' : '⚡ Instant Notify ER Clinician'}
            </Button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        
        {/* Left Column: Radiologist Reading Worklist with Priority #1 Pinning */}
        <Card padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📋</span>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>
                Radiologist PACS Worklist
              </h3>
            </div>
            <Badge variant="danger">2 STAT Alerts</Badge>
          </div>

          <p style={{ fontSize: '0.72rem', color: '#94A3B8', margin: 0 }}>
            AI background scanner prioritizes scans with Fractures, Pneumothorax, and Brain Hemorrhage to Priority #1.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cases.map((c) => {
              const isSelected = c.id === selectedCaseId;
              const isStat = c.urgency === 'STAT_CRITICAL';
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setIsSignedOff(false);
                    setIsNotifiedEr(false);
                    if (c.id === 'CASE-CT-BRAIN') setWindowPreset('BRAIN');
                    else if (c.id === 'CASE-XRAY-PNEUMO') setWindowPreset('LUNG');
                    else if (c.id === 'CASE-XRAY-FRACTURE') setWindowPreset('BONE');
                    else setWindowPreset('DEFAULT');
                  }}
                  style={{
                    backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.6)',
                    border: isSelected
                      ? isStat ? '2px solid #EF4444' : '2px solid #38BDF8'
                      : isStat ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? isStat ? '0 0 16px rgba(239, 68, 68, 0.3)' : '0 0 16px rgba(56, 189, 248, 0.2)'
                      : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {c.isEmergencyPinned && (
                        <span style={{ fontSize: '0.75rem' }} title="Pinned Priority #1">📌</span>
                      )}
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F8FAFC' }}>
                        #{c.priorityRank}. {c.patientName}
                      </span>
                    </div>
                    <Badge variant={isStat ? 'danger' : c.urgency === 'URGENT' ? 'warning' : 'neutral'}>
                      {c.urgency === 'STAT_CRITICAL' ? 'STAT' : c.urgency}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {c.modalityType} • {c.patientAgeGender}
                  </div>

                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isStat ? '#FCA5A5' : '#38BDF8', marginTop: '6px' }}>
                    {c.aiDetectionTitle.replace('🚨 ', '').replace('⚠️ ', '').replace('✓ ', '')}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748B', marginTop: '4px' }}>
                    <span>{c.accessionNumber}</span>
                    <span>AI: {c.aiConfidence}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Column: Interactive Web DICOM Real-Time Heatmap Viewport */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* DICOM Viewport & Canvas Controls */}
          <div
            style={{
              backgroundColor: '#020617',
              border: '2px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'inset 0 0 50px rgba(0,0,0,0.9)'
            }}
          >
            {/* Top Viewport Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                  DICOM Controls:
                </span>
                
                {/* Window Presets */}
                {(['DEFAULT', 'BRAIN', 'LUNG', 'BONE', 'INVERT'] as WindowPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWindowPreset(preset)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: windowPreset === preset ? '#38BDF8' : 'rgba(255, 255, 255, 0.05)',
                      color: windowPreset === preset ? '#070C16' : '#CBD5E1',
                      border: windowPreset === preset ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {preset === 'DEFAULT' ? 'Standard' : (preset ? (preset.charAt(0) + preset.slice(1).toLowerCase() + ' Window') : 'Window')}
                  </button>
                ))}
              </div>

              {/* AI Detection & Heatmap Toggles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAiBox(!showAiBox)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: showAiBox ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: showAiBox ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: showAiBox ? '#FCA5A5' : '#94A3B8',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {showAiBox ? '🟥 Red AI Lesion Box: ON' : '⬜ Lesion Box: OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: showHeatmap ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: showHeatmap ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: showHeatmap ? '#FCD34D' : '#94A3B8',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {showHeatmap ? '🔥 Heatmap: ON' : '⚪ Heatmap: OFF'}
                </button>

                {/* Zoom Controls */}
                <button
                  type="button"
                  aria-label="Zoom out DICOM image"
                  title="Zoom Out"
                  onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
                  style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #475569', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  aria-label="Zoom in DICOM image"
                  title="Zoom In"
                  onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.1))}
                  style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #475569', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Simulated High-Res Medical DICOM Canvas Viewport */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '420px',
                backgroundColor: windowPreset === 'INVERT' ? '#E2E8F0' : '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Medical Image Simulation Graphic with Anatomical Structure */}
              <div
                style={{
                  position: 'relative',
                  width: '380px',
                  height: '380px',
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.15s ease',
                  filter:
                    windowPreset === 'INVERT'
                      ? 'invert(100%)'
                      : windowPreset === 'BONE'
                      ? 'contrast(160%) brightness(120%)'
                      : windowPreset === 'LUNG'
                      ? 'contrast(140%) brightness(95%)'
                      : 'contrast(120%)'
                }}
              >
                {/* Visual Representation based on Modality */}
                {currentCase.id === 'CASE-CT-BRAIN' && (
                  /* Axial Brain CT Simulation */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: '18px solid #FFF',
                      background: 'radial-gradient(ellipse at 48% 50%, #334155 0%, #1E293B 65%, #0F172A 100%)',
                      position: 'relative',
                      boxShadow: 'inset 0 0 30px #000'
                    }}
                  >
                    {/* Ventricles */}
                    <div style={{ position: 'absolute', top: '42%', left: '46%', width: '12px', height: '40px', backgroundColor: '#000', borderRadius: '6px' }} />
                    <div style={{ position: 'absolute', top: '44%', left: '38%', width: '10px', height: '32px', backgroundColor: '#000', borderRadius: '5px', transform: 'rotate(-15deg)' }} />

                    {/* Hyperdense Subdural Hematoma Crescent */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '22%',
                        left: '14%',
                        width: '36px',
                        height: '150px',
                        backgroundColor: '#FFF',
                        borderRadius: '40% 10% 10% 40%',
                        transform: 'rotate(10deg)',
                        boxShadow: '0 0 10px #FFF'
                      }}
                    />
                  </div>
                )}

                {currentCase.id === 'CASE-XRAY-PNEUMO' && (
                  /* Chest PA Digital Radiograph Simulation */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(180deg, #0F172A 0%, #020617 100%)',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {/* Spine & Mediastinum */}
                    <div style={{ position: 'absolute', width: '38px', height: '90%', backgroundColor: '#E2E8F0', opacity: 0.8, borderRadius: '4px' }} />
                    {/* Left Lung Field (Normal Vascular Markings) */}
                    <div style={{ position: 'absolute', left: '16%', width: '30%', height: '75%', backgroundColor: '#0F172A', border: '2px solid #64748B', borderRadius: '40% 20% 60% 40%', opacity: 0.9 }} />
                    {/* Right Lung Field (Pneumothorax with Visceral Pleural Line) */}
                    <div style={{ position: 'absolute', right: '16%', width: '30%', height: '75%', backgroundColor: '#020617', border: '2px solid #EF4444', borderRadius: '20% 40% 40% 60%' }}>
                      <div style={{ position: 'absolute', left: '20%', width: '2px', height: '80%', backgroundColor: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
                    </div>
                  </div>
                )}

                {currentCase.id === 'CASE-XRAY-FRACTURE' && (
                  /* Wrist Skeletal Fracture Simulation */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: '#020617',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {/* Radius Bone */}
                    <div style={{ position: 'absolute', width: '50px', height: '70%', backgroundColor: '#CBD5E1', borderRadius: '4px', left: '35%', top: '25%' }}>
                      {/* Cortical Break / Fracture Line */}
                      <div style={{ position: 'absolute', top: '35%', left: '-8px', width: '66px', height: '4px', backgroundColor: '#EF4444', transform: 'rotate(-12deg)', boxShadow: '0 0 8px #EF4444' }} />
                    </div>
                    {/* Ulna Bone */}
                    <div style={{ position: 'absolute', width: '32px', height: '65%', backgroundColor: '#94A3B8', borderRadius: '4px', right: '35%', top: '30%' }} />
                  </div>
                )}

                {currentCase.id === 'CASE-XRAY-NORMAL' && (
                  /* Normal Chest X-Ray */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ position: 'absolute', width: '40px', height: '90%', backgroundColor: '#CBD5E1', opacity: 0.7 }} />
                    <div style={{ position: 'absolute', left: '16%', width: '30%', height: '75%', backgroundColor: '#0B132B', border: '2px solid #475569', borderRadius: '40% 20% 60% 40%' }} />
                    <div style={{ position: 'absolute', right: '16%', width: '30%', height: '75%', backgroundColor: '#0B132B', border: '2px solid #475569', borderRadius: '20% 40% 40% 60%' }} />
                  </div>
                )}

                {/* AI Gradient Heatmap Layer */}
                {showHeatmap && currentCase.heatmapGradient !== 'none' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: currentCase.lesionBox.top,
                      left: currentCase.lesionBox.left,
                      width: currentCase.lesionBox.width,
                      height: currentCase.lesionBox.height,
                      background: currentCase.heatmapGradient,
                      opacity: heatmapOpacity,
                      pointerEvents: 'none',
                      borderRadius: '12px',
                      filter: 'blur(8px)',
                      transition: 'opacity 0.2s ease'
                    }}
                  />
                )}

                {/* AI Red Bounding Box & Target Tag */}
                {showAiBox && currentCase.lesionBox.width !== '0px' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: currentCase.lesionBox.top,
                      left: currentCase.lesionBox.left,
                      width: currentCase.lesionBox.width,
                      height: currentCase.lesionBox.height,
                      border: '2.5px solid #EF4444',
                      borderRadius: '6px',
                      boxShadow: '0 0 16px rgba(239, 68, 68, 0.8), inset 0 0 8px rgba(239, 68, 68, 0.4)',
                      animation: 'pulse 1.8s infinite',
                      pointerEvents: 'none'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '-2px',
                        backgroundColor: '#EF4444',
                        color: '#FFF',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {currentCase.lesionBox.label}
                    </span>
                  </div>
                )}
              </div>

              {/* DICOM Patient Info On-Screen Metadata Display (OSD) */}
              <div style={{ position: 'absolute', top: '12px', left: '14px', fontSize: '0.72rem', color: '#38BDF8', fontFamily: 'monospace', textShadow: '0 1px 3px #000' }}>
                <div><strong>{currentCase.patientName}</strong> ({currentCase.patientAgeGender})</div>
                <div>MRN: {currentCase.patientMrn}</div>
                <div>ACC: {currentCase.accessionNumber}</div>
              </div>

              <div style={{ position: 'absolute', top: '12px', right: '14px', fontSize: '0.72rem', color: '#38BDF8', fontFamily: 'monospace', textAlign: 'right', textShadow: '0 1px 3px #000' }}>
                <div>{currentCase.modalityType.split('(')[0]}</div>
                <div>Window: {windowPreset}</div>
                <div>Zoom: {Math.round(zoomLevel * 100)}%</div>
              </div>

              <div style={{ position: 'absolute', bottom: '12px', left: '14px', fontSize: '0.68rem', color: '#10B981', fontFamily: 'monospace', textShadow: '0 1px 3px #000' }}>
                ● WADO DICOM NODE 104 SYNCHRONIZED
              </div>
            </div>
          </div>

          {/* Structured Clinical Finding & AI Copilot Impression Dossier */}
          <Card padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                    AI Copilot Diagnostic Findings & Action Protocol
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                    Confidence: {currentCase.aiConfidence}% • Auto-generated for Attending Radiologist
                  </span>
                </div>
              </div>
              {isSignedOff ? (
                <Badge variant="success">✓ Radiologist Signed & Released to PACS</Badge>
              ) : (
                <Badge variant={currentCase.urgency === 'STAT_CRITICAL' ? 'danger' : 'warning'}>
                  Pending Sign-off
                </Badge>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #38BDF8' }}>
                <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '2px' }}>Detailed Radiological Findings:</strong>
                <span style={{ color: '#CBD5E1', lineHeight: '1.5' }}>{currentCase.criticalFindingDescription}</span>
              </div>

              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #EF4444' }}>
                <strong style={{ color: '#FCA5A5', display: 'block', marginBottom: '2px' }}>Diagnostic Impression:</strong>
                <span style={{ color: '#F8FAFC', fontWeight: 700 }}>{currentCase.impression}</span>
                <div style={{ fontSize: '0.72rem', color: '#C084FC', marginTop: '4px' }}>
                  ICD-10 Code: {currentCase.icd10}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #10B981' }}>
                <strong style={{ color: '#A7F3D0', display: 'block', marginBottom: '2px' }}>Emergency Clinical Protocol:</strong>
                <span style={{ color: '#E2E8F0' }}>{currentCase.recommendedAction}</span>
              </div>
            </div>

            {/* Radiologist Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Button
                variant="outline"
                size="md"
                onClick={handleNotifyEr}
                style={{ flex: 1, fontWeight: 800 }}
              >
                {isNotifiedEr ? '✓ ER Clinician Notified' : '⚡ Alert ER Team'}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleSignOff}
                style={{
                  flex: 2,
                  fontWeight: 900,
                  backgroundColor: isSignedOff ? '#10B981' : '#38BDF8',
                  borderColor: isSignedOff ? '#10B981' : '#38BDF8',
                  color: isSignedOff ? '#FFF' : '#070C16'
                }}
              >
                {isSignedOff ? '✓ Report Signed & Pushed to EMR' : '✍️ Radiologist Sign-off & Release to PACS'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
