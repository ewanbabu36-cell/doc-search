import React, { useState } from 'react';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export interface PrintableMedicalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientAge: string | number;
  patientGender: string;
  patientMrn: string;
  diagnosis: string;
}

export const PrintableMedicalCertificateModal: React.FC<PrintableMedicalCertificateModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientAge,
  patientGender,
  patientMrn,
  diagnosis
}) => {
  const profile = getVerifiedRoleProfile();

  const [certificateType, setCertificateType] = useState<'SICK_LEAVE' | 'FITNESS' | 'TRAVEL_FITNESS'>('SICK_LEAVE');
  
  // Default dates: Today to Today + 3 Days
  const todayStr: string = new Date().toISOString().split('T')[0] || '';
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysStr: string = threeDaysLater.toISOString().split('T')[0] || '';
  
  const resumeDate = new Date();
  resumeDate.setDate(resumeDate.getDate() + 4);
  const resumeDateStr: string = resumeDate.toISOString().split('T')[0] || '';

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(threeDaysStr);
  const [fitResumeDate, setFitResumeDate] = useState<string>(resumeDateStr);
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState(diagnosis || 'Acute Respiratory Infection / Pyrexia');
  const [doctorRemarks, setDoctorRemarks] = useState('Advised complete bed rest, adequate hydration, and symptomatic medication.');
  const [issuedDate] = useState(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Header */}
        <div
          className="no-print"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E293B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📄</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                1-Click Medical & Fitness Certificate Generator
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Legal Medical Certificate • Formatted for Employers, Universities & Insurers
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                backgroundColor: '#10B981',
                color: '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 16px',
                fontSize: '0.8rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🖨️</span>
              <span>Print Certificate</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div
          className="no-print"
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            fontSize: '0.75rem'
          }}
        >
          <div>
            <label style={{ display: 'block', color: '#38BDF8', fontWeight: 700, marginBottom: '3px' }}>
              Certificate Type:
            </label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value as any)}
              style={{
                width: '100%',
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: '#0B111E',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                fontSize: '0.72rem'
              }}
            >
              <option value="SICK_LEAVE">Medical Rest / Sick Leave</option>
              <option value="FITNESS">Fitness to Resume Duty</option>
              <option value="TRAVEL_FITNESS">Fit to Travel Certificate</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: '#38BDF8', fontWeight: 700, marginBottom: '3px' }}>
              Rest Period:
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '50%',
                  padding: '4px',
                  borderRadius: '5px',
                  backgroundColor: '#0B111E',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.7rem'
                }}
              />
              <span style={{ color: '#64748B' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '50%',
                  padding: '4px',
                  borderRadius: '5px',
                  backgroundColor: '#0B111E',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.7rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#38BDF8', fontWeight: 700, marginBottom: '3px' }}>
              Fit to Resume Duty On:
            </label>
            <input
              type="date"
              value={fitResumeDate}
              onChange={(e) => setFitResumeDate(e.target.value)}
              style={{
                width: '100%',
                padding: '4px',
                borderRadius: '5px',
                backgroundColor: '#0B111E',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                fontSize: '0.7rem'
              }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', color: '#38BDF8', fontWeight: 700, marginBottom: '3px' }}>
              Diagnosis on Certificate:
            </label>
            <input
              type="text"
              value={clinicalDiagnosis}
              onChange={(e) => setClinicalDiagnosis(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: '#0B111E',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                fontSize: '0.72rem'
              }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', color: '#38BDF8', fontWeight: 700, marginBottom: '3px' }}>
              Physician Remarks / Instructions:
            </label>
            <input
              type="text"
              value={doctorRemarks}
              onChange={(e) => setDoctorRemarks(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: '#0B111E',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F8FAFC',
                fontSize: '0.72rem'
              }}
            />
          </div>
        </div>

        {/* Printable Certificate Preview Sheet (White Paper A4 layout) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F1F5F9' }}>
          <div
            id="printable-medical-cert-sheet"
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '40px 48px',
              borderRadius: '8px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              fontFamily: '"Times New Roman", Times, serif',
              position: 'relative',
              lineHeight: 1.6
            }}
          >
            {/* Header Letterhead */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {profile.entityLegalName || 'DOC SEARCH HEALTHCARE CLINIC'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                {profile.officialAddress || 'Main OPD Healthcare Complex • Comprehensive Medical Care'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Phone: {profile.contactPhone || '9876543210'} • Reg / License No: {profile.doctorRegNo || 'MCI-184920'}
              </div>
            </div>

            {/* Certificate Title */}
            <div style={{ textAlign: 'center', margin: '20px 0 28px' }}>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  textDecoration: 'underline',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {certificateType === 'SICK_LEAVE' && 'MEDICAL SICK LEAVE CERTIFICATE'}
                {certificateType === 'FITNESS' && 'MEDICAL FITNESS CERTIFICATE'}
                {certificateType === 'TRAVEL_FITNESS' && 'FIT TO TRAVEL MEDICAL CERTIFICATE'}
              </span>
            </div>

            {/* Date & Ref */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div><strong>Ref No:</strong> MC/{new Date().getFullYear()}/{patientMrn.replace(/\D/g, '').slice(-4) || '1042'}</div>
              <div><strong>Date of Issue:</strong> {issuedDate}</div>
            </div>

            {/* Certificate Body Paragraph */}
            <div style={{ fontSize: '0.95rem', textAlign: 'justify', marginBottom: '24px' }}>
              <p style={{ textIndent: '30px', margin: '0 0 16px 0' }}>
                This is to certify that <strong>{patientName}</strong>, aged <strong>{patientAge}</strong> years,{' '}
                <strong>{patientGender}</strong>, bearing Hospital Registration (MRN) <strong>{patientMrn}</strong>, was
                examined by me in the Outpatient Department.
              </p>

              {certificateType === 'SICK_LEAVE' && (
                <>
                  <p style={{ margin: '0 0 16px 0' }}>
                    The patient was diagnosed with <strong>{clinicalDiagnosis}</strong> and was advised complete medical
                    rest and absence from duty / classes from <strong>{new Date(startDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> to{' '}
                    <strong>{new Date(endDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> for recovery.
                  </p>
                  <p style={{ margin: '0 0 16px 0' }}>
                    The patient is clinically re-evaluated and found <strong>FIT to resume regular work / duty</strong> on{' '}
                    <strong>{new Date(fitResumeDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.
                  </p>
                </>
              )}

              {certificateType === 'FITNESS' && (
                <p style={{ margin: '0 0 16px 0' }}>
                  Having thoroughly examined the candidate, I find no clinical evidence of communicable diseases or
                  physical infirmity. The patient is declared <strong>MEDICALLY FIT</strong> to resume regular duties with
                  immediate effect from <strong>{new Date(fitResumeDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.
                </p>
              )}

              {certificateType === 'TRAVEL_FITNESS' && (
                <p style={{ margin: '0 0 16px 0' }}>
                  The passenger was evaluated and found hemodynamically stable, maintaining room-air oxygenation, and
                  free from active respiratory distress or contagious infection. The passenger is declared{' '}
                  <strong>MEDICALLY FIT FOR AIR / ROAD TRAVEL</strong>.
                </p>
              )}

              <p style={{ margin: '0' }}>
                <strong>Physician Remarks:</strong> {doctorRemarks}
              </p>
            </div>

            {/* Doctor Signature Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px', paddingTop: '16px' }}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                <div style={{ border: '1px dashed #CBD5E1', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', margin: '0 auto 6px' }}>
                  [Official Seal]
                </div>
                <div>Clinic / Hospital Seal</div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '220px' }}>
                <div style={{ borderBottom: '1.5px solid #0F172A', marginBottom: '6px', height: '40px' }}></div>
                <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{profile.doctorName || 'Attending Physician'}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>{profile.doctorDegree || 'MBBS, MD'} • {profile.doctorSpecialty || 'Consultant Physician'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Medical Reg No: {profile.doctorRegNo || 'MCI-184920'}</div>
              </div>
            </div>

            {/* Footer Notice */}
            <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '30px', paddingTop: '8px', fontSize: '0.68rem', color: '#94A3B8', textAlign: 'center' }}>
              This certificate is issued under doctor's clinical judgment for official purposes. Verify via Clinic Desk.
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Print Styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-medical-cert-sheet, #printable-medical-cert-sheet * {
            visibility: visible !important;
          }
          #printable-medical-cert-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 30px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
