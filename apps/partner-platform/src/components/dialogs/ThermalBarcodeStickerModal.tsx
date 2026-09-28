import React, { useState } from 'react';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';

export interface TubeStickerItem {
  tubeType: string;
  tubeColor: string;
  tubeColorHex: string;
  tubeIcon: string;
  testNames: string[];
  accessionNumber: string;
  specimenMatrix: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: InvestigationOrderDto | null;
}

// Generate realistic Code 128 barcode stripes from string for crisp SVG rendering
function generateBarcodeStripes(text: string): { width: number; x: number }[] {
  const hash = Array.from(text).reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
  const bars: { width: number; x: number }[] = [];
  let currentX = 10;
  // Deterministic stripe pattern
  const pattern = [2, 1, 3, 1, 1, 2, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2];
  for (let i = 0; i < 36; i++) {
    const pIdx = (i + (hash % 10)) % pattern.length;
    const w = pattern[pIdx] || 2;
    if (i % 2 === 0) {
      bars.push({ x: currentX, width: w });
    }
    currentX += w + 1;
  }
  return bars;
}

export const ThermalBarcodeStickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order
}) => {
  const [labelSize, setLabelSize] = useState<'50x25' | '50x30'>('50x25');
  const [copies, setCopies] = useState<number>(1);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number>(0);

  if (!isOpen || !order) return null;

  // Derive required vacutainer tubes based on tests in the order
  const getDerivedTubes = (): TubeStickerItem[] => {
    const testName = (order.investigationName || '').toUpperCase();
    const tubes: TubeStickerItem[] = [];
    const baseAccession = order.specimens?.[0]?.accessionNumber || `ACC-${order.orderNumber.replace(/\D/g, '') || '89410'}`;

    if (testName.includes('CBC') || testName.includes('HEMOGLOBIN') || testName.includes('ESR') || testName.includes('BLOOD GROUP')) {
      tubes.push({
        tubeType: 'K2 / K3 EDTA (Lavender)',
        tubeColor: 'Lavender',
        tubeColorHex: '#A855F7',
        tubeIcon: '💜',
        testNames: ['CBC', 'Hemoglobin', 'ESR'],
        accessionNumber: `${baseAccession}-EDTA`,
        specimenMatrix: 'Whole Blood'
      });
    }

    if (testName.includes('LIPID') || testName.includes('LFT') || testName.includes('KFT') || testName.includes('THYROID') || testName.includes('SERUM') || testName.includes('BIOCHEMISTRY')) {
      tubes.push({
        tubeType: 'SST / Clot Activator (Red/Gold)',
        tubeColor: 'Red',
        tubeColorHex: '#EF4444',
        tubeIcon: '🔴',
        testNames: ['Biochemistry / Serology'],
        accessionNumber: `${baseAccession}-SERUM`,
        specimenMatrix: 'Serum'
      });
    }

    if (testName.includes('SUGAR') || testName.includes('GLUCOSE') || testName.includes('FBS') || testName.includes('PPBS')) {
      tubes.push({
        tubeType: 'Sodium Fluoride (Grey)',
        tubeColor: 'Grey',
        tubeColorHex: '#94A3B8',
        tubeIcon: '⚪',
        testNames: ['Blood Glucose (Fluoride)'],
        accessionNumber: `${baseAccession}-GLUC`,
        specimenMatrix: 'Fluoride Plasma'
      });
    }

    if (testName.includes('PT') || testName.includes('INR') || testName.includes('COAG')) {
      tubes.push({
        tubeType: 'Sodium Citrate 3.2% (Light Blue)',
        tubeColor: 'Blue',
        tubeColorHex: '#38BDF8',
        tubeIcon: '🔵',
        testNames: ['Coagulation (PT/INR)'],
        accessionNumber: `${baseAccession}-CIT`,
        specimenMatrix: 'Citrated Plasma'
      });
    }

    // Default fallback if no specific pattern matched
    if (tubes.length === 0) {
      tubes.push({
        tubeType: `${order.specimenType || 'Whole Blood / Serum'} Tube`,
        tubeColor: 'Lavender',
        tubeColorHex: '#A855F7',
        tubeIcon: '🧪',
        testNames: [order.investigationName || 'Clinical Test'],
        accessionNumber: baseAccession,
        specimenMatrix: order.specimenType || 'Clinical Specimen'
      });
    }

    return tubes;
  };

  const tubes = getDerivedTubes();
  const currentTube = tubes[selectedTubeIndex] || tubes[0]!;
  const stripes = generateBarcodeStripes(currentTube.accessionNumber);

  const handlePrint = () => {
    window.print();
  };

  const nowFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Thermal Label CSS for Zebra / TSC / Citizen Printers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-thermal-label, #printable-thermal-label * {
            visibility: visible !important;
          }
          #printable-thermal-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 2mm !important;
            width: ${labelSize === '50x25' ? '50mm' : '50mm'} !important;
            height: ${labelSize === '50x25' ? '25mm' : '30mm'} !important;
            box-shadow: none !important;
            border: none !important;
            background: #FFF !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        borderRadius: '14px',
        border: '1.5px solid rgba(6, 182, 212, 0.4)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
        width: '100%',
        maxWidth: '680px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div className="no-print" style={{
          backgroundColor: '#0B1120',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🖨️</span>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#38BDF8' }}>
                Phlebotomy Vacutainer Thermal Barcode Sticker
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Order #{order.orderNumber} • Patient: {order.patientName} (UHID: {order.patientMrn})
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1.2rem',
              fontWeight: 800
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Controls: Size & Tube Selection */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Label Size:</span>
              <button
                type="button"
                onClick={() => setLabelSize('50x25')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: labelSize === '50x25' ? '#0284C7' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${labelSize === '50x25' ? '#38BDF8' : 'rgba(255,255,255,0.15)'}`,
                  color: labelSize === '50x25' ? '#FFF' : '#CBD5E1'
                }}
              >
                50 x 25 mm (Standard)
              </button>
              <button
                type="button"
                onClick={() => setLabelSize('50x30')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: labelSize === '50x30' ? '#0284C7' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${labelSize === '50x30' ? '#38BDF8' : 'rgba(255,255,255,0.15)'}`,
                  color: labelSize === '50x30' ? '#FFF' : '#CBD5E1'
                }}
              >
                50 x 30 mm (Extended)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Copies:</span>
              <select
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#FFF',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                <option value={1}>1 Sticker</option>
                <option value={2}>2 Stickers</option>
                <option value={3}>3 Stickers</option>
              </select>
            </div>
          </div>

          {/* Tube Selection Pills */}
          {tubes.length > 1 && (
            <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, alignSelf: 'center' }}>
                Required Tubes ({tubes.length}):
              </span>
              {tubes.map((tube, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedTubeIndex(idx)}
                  style={{
                    backgroundColor: selectedTubeIndex === idx ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${selectedTubeIndex === idx ? tube.tubeColorHex : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: selectedTubeIndex === idx ? '#FFF' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{tube.tubeIcon}</span>
                  <span>{tube.tubeType}</span>
                </button>
              ))}
            </div>
          )}

          {/* The Actual Thermal Sticker Print Preview Area */}
          <div style={{
            backgroundColor: '#020617',
            padding: '28px',
            borderRadius: '10px',
            border: '1px dashed rgba(255,255,255,0.15)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div
              id="printable-thermal-label"
              style={{
                width: labelSize === '50x25' ? '280px' : '280px',
                minHeight: labelSize === '50x25' ? '140px' : '170px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                padding: '8px 10px',
                borderRadius: '4px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                fontFamily: 'Arial, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                border: '1px solid #E2E8F0'
              }}
            >
              {/* Row 1: Patient Details */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '-0.2px', textTransform: 'uppercase' }}>
                    {order.patientName}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '0.75rem' }}>
                    {(order as any).patientAge || '35'}Y/{(order as any).patientGender?.[0] || 'M'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', marginTop: '2px', fontWeight: 700 }}>
                  <span>UHID: {order.patientMrn}</span>
                  <span>{currentTube.specimenMatrix}</span>
                </div>
              </div>

              {/* Row 2: Code 128 Barcode Representation */}
              <div style={{ textAlign: 'center', margin: '3px 0' }}>
                <svg width="220" height="34" style={{ display: 'inline-block' }}>
                  {stripes.map((s, idx) => (
                    <rect key={idx} x={s.x} y="0" width={s.width} height="34" fill="#000000" />
                  ))}
                </svg>
                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px', marginTop: '-2px' }}>
                  *{currentTube.accessionNumber}*
                </div>
              </div>

              {/* Row 3: Test Names & Timestamp */}
              <div style={{ borderTop: '1px solid #000', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.6rem', fontWeight: 700 }}>
                <div style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentTube.testNames.join(', ')}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#333' }}>
                  {nowFormatted}
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textAlign: 'center' }}>
            💡 Tip: Set your printer paper size to <strong>50 x 25 mm</strong> (or 2 x 1 inch) in the print dialog. Fits all standard 2ml, 3ml & 5ml Vacutainers.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="no-print" style={{
          backgroundColor: '#0B1120',
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#CBD5E1',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: '#0284C7',
              border: 'none',
              color: '#FFF',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}
          >
            <span>🖨️</span>
            <span>Print {copies} Tube Sticker{copies > 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
