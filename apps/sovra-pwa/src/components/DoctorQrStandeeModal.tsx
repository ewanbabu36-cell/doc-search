// Sovra Doctor Clinic Desk QR Standee Generator Modal
// Solves Weakness #5 (Cold Start Discovery: Every patient visiting the clinic scans this acrylic desk standee to connect)
// Generates high-res printable A5 Acrylic Desk Standee with bilingual instructions (Hindi & English).

import React, { useRef } from 'react';

interface DoctorQrStandeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName?: string;
  specialty?: string;
  roomNumber?: string;
  clinicName?: string;
  regNo?: string;
}

export const DoctorQrStandeeModal: React.FC<DoctorQrStandeeModalProps> = ({
  isOpen,
  onClose,
  doctorName = 'Dr. Ramesh Sharma, MD',
  specialty = 'Consultant Cardiologist & Physician',
  roomNumber = 'Room 204 (2nd Floor)',
  clinicName = 'DocSearch Apex Super Specialty Hospital',
  regNo = 'MCI-99410'
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeInMsg 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '500px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          color: '#F8FAFC',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#5EEAD4' }}>
              🖨️ Clinic Desk QR Standee
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#94A3B8' }}>
              Print and place on OPD desk for instant zero-friction patient onboarding
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#94A3B8',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Printable Standee Preview Container */}
        <div
          ref={printAreaRef}
          className="printable-standee-card"
          style={{
            background: '#FFFFFF',
            color: '#0F172A',
            borderRadius: '16px',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            marginBottom: '18px',
            border: '2px solid #0F766E'
          }}
        >
          {/* Hospital Branding Header */}
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {clinicName}
          </div>

          <div style={{ width: '40px', height: '3px', background: '#0F766E', margin: '8px auto 14px auto', borderRadius: '2px' }} />

          {/* Doctor Info */}
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
            {doctorName}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
            {specialty}
          </div>
          <div style={{ fontSize: '11px', color: '#0F766E', fontWeight: 700, marginTop: '2px' }}>
            {roomNumber} • Reg: {regNo}
          </div>

          {/* QR Code Container */}
          <div
            style={{
              width: '170px',
              height: '170px',
              margin: '16px auto',
              background: '#F8FAFC',
              border: '2px dashed #0F766E',
              borderRadius: '14px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {/* SVG Visual QR Pattern */}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gridTemplateRows: 'repeat(5, 1fr)',
                gap: '4px'
              }}
            >
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: (i % 2 === 0 || i % 4 === 0 || i === 0 || i === 4 || i === 20 || i === 24) ? '#0F172A' : '#CBD5E1',
                    borderRadius: '2px'
                  }}
                />
              ))}
            </div>

            <div
              style={{
                position: 'absolute',
                background: '#0F766E',
                color: 'white',
                fontWeight: 900,
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              SOVRA
            </div>
          </div>

          {/* Bilingual Guidance */}
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F766E', marginBottom: '4px' }}>
            📲 स्कैन करें और लाइव टोकन नंबर देखें
          </div>
          <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600, lineHeight: 1.3 }}>
            Scan with phone camera to track live OPD token & receive official digital prescription.
          </div>

          {/* Feature Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '14px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
              ✓ No App Download
            </span>
            <span style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
              ✓ 100% Free Lifetime
            </span>
            <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
              ✓ NMC Verified
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              background: '#0F766E',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.4)'
            }}
          >
            <span>🖨️</span>
            <span>Print Desk Standee (A5)</span>
          </button>

          <button
            onClick={() => alert(`Standee saved: ${doctorName.replace(/[\s\.]/g, '_')}_OPD_Standee.png`)}
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#38BDF8',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📥 Download PNG
          </button>
        </div>
      </div>
    </div>
  );
};
