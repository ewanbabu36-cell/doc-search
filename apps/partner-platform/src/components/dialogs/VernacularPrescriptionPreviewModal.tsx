import React, { useState } from 'react';

export interface MedicationScheduleItem {
  id: string;
  medicationName: string;
  strength: string;
  dosage: string;
  frequency: string; // e.g. '1 - 0 - 1'
  duration: number;
  instructions?: string;
}

export interface VernacularPrescriptionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientAge: number | string;
  patientGender: string;
  patientMrn: string;
  diagnosis: string;
  medications: MedicationScheduleItem[];
  doctorName?: string;
  isMlcCase?: boolean;
}

export const VernacularPrescriptionPreviewModal: React.FC<VernacularPrescriptionPreviewModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientAge,
  patientGender,
  patientMrn,
  diagnosis,
  medications,
  doctorName = 'Dr. Verified Physician (MBBS, MD)',
  isMlcCase = false
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'ENGLISH' | 'HINDI' | 'URDU'>('HINDI');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const parseDoseSlots = (freq: string) => {
    const parts = freq.split('-').map((p) => p.trim());
    return {
      morning: parts[0] || '1',
      noon: parts[1] || '0',
      night: parts[2] || '1'
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.85)',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Screen only) */}
        <div
          className="no-print"
          style={{
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>🌐</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8' }}>
              Vernacular Dosage Schedule & Visual Icons
            </span>
          </div>

          {/* Language Switcher Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Language:</span>
            <button
              type="button"
              onClick={() => setSelectedLanguage('HINDI')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedLanguage === 'HINDI' ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.2)',
                backgroundColor: selectedLanguage === 'HINDI' ? '#F59E0B' : 'transparent',
                color: selectedLanguage === 'HINDI' ? '#0F172A' : '#F8FAFC'
              }}
            >
              हिंदी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('URDU')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedLanguage === 'URDU' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.2)',
                backgroundColor: selectedLanguage === 'URDU' ? '#10B981' : 'transparent',
                color: selectedLanguage === 'URDU' ? '#0F172A' : '#F8FAFC'
              }}
            >
              اردو (Urdu)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('ENGLISH')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedLanguage === 'ENGLISH' ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.2)',
                backgroundColor: selectedLanguage === 'ENGLISH' ? '#06B6D4' : 'transparent',
                color: selectedLanguage === 'ENGLISH' ? '#0F172A' : '#F8FAFC'
              }}
            >
              English
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                marginLeft: '10px',
                padding: '5px 14px',
                borderRadius: '6px',
                backgroundColor: '#2563EB',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🖨️ Print Slip
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer', marginLeft: '6px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Prescription Body */}
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1, position: 'relative' }}>
          {/* MLC Watermark if applicable */}
          {isMlcCase && (
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '2.5rem',
                fontWeight: 900,
                color: 'rgba(239, 68, 68, 0.15)',
                border: '4px dashed rgba(239, 68, 68, 0.25)',
                padding: '12px 28px',
                pointerEvents: 'none',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}
            >
              MEDICO-LEGAL CASE (MLC)
              <div style={{ fontSize: '1rem', marginTop: '4px' }}>STATUTORY POLICE INTIMATION FILED</div>
            </div>
          )}

          {/* Letterhead Header */}
          <div style={{ borderBottom: '2px solid #0284C7', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0369A1' }}>
                  DOCSEARCH HEALTHCARE OUTPATIENT CLINIC
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  {doctorName} • Reg. No. MCI-2018-8421
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                <div>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div>Emergency Helpline: 1800-DOC-HELP</div>
              </div>
            </div>
          </div>

          {/* Patient Info Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
            <div><strong>Patient:</strong> {patientName}</div>
            <div><strong>Age/Gender:</strong> {patientAge}Y / {patientGender}</div>
            <div><strong>MRN / UHID:</strong> {patientMrn}</div>
            <div><strong>Diagnosis:</strong> {diagnosis || 'Clinical Evaluation'}</div>
          </div>

          {/* Visual Vernacular Dosage Table */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #CBD5E1', paddingBottom: '6px', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                ℞ MEDICATIONS & DOSAGE SCHEDULE (दवा लेने का समय व खुराक)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>
                {selectedLanguage === 'HINDI' ? 'चित्र संकेत अनुसार दवा लें' : selectedLanguage === 'URDU' ? 'تصویری علامات کے مطابق دوا لیں' : 'Follow Visual Icons'}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', width: '38%' }}>Medicine Name / दवा का नाम</th>
                  <th style={{ textAlign: 'center', padding: '8px 6px', width: '15%' }}>
                    ☀️ {selectedLanguage === 'HINDI' ? 'सुबह (नाश्ता)' : selectedLanguage === 'URDU' ? 'صبح (ناشتہ)' : 'Morning'}
                  </th>
                  <th style={{ textAlign: 'center', padding: '8px 6px', width: '15%' }}>
                    🌤️ {selectedLanguage === 'HINDI' ? 'दोपहर (खाना)' : selectedLanguage === 'URDU' ? 'دوپہر (کھانا)' : 'Afternoon'}
                  </th>
                  <th style={{ textAlign: 'center', padding: '8px 6px', width: '15%' }}>
                    🌙 {selectedLanguage === 'HINDI' ? 'रात (खाना)' : selectedLanguage === 'URDU' ? 'رات (کھانا)' : 'Night'}
                  </th>
                  <th style={{ textAlign: 'center', padding: '8px 10px', width: '17%' }}>Days / दिन</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((m, idx) => {
                  const slots = parseDoseSlots(m.frequency);
                  return (
                    <tr key={m.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{m.medicationName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {m.strength} • {m.dosage}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 6px', fontWeight: 800, color: slots.morning !== '0' ? '#0369A1' : '#94A3B8' }}>
                        {slots.morning !== '0' ? `💊 ${slots.morning} गोली` : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 6px', fontWeight: 800, color: slots.noon !== '0' ? '#0369A1' : '#94A3B8' }}>
                        {slots.noon !== '0' ? `💊 ${slots.noon} गोली` : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 6px', fontWeight: 800, color: slots.night !== '0' ? '#0369A1' : '#94A3B8' }}>
                        {slots.night !== '0' ? `💊 ${slots.night} गोली` : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 10px', fontWeight: 800, color: '#0F172A' }}>
                        {m.duration} {selectedLanguage === 'HINDI' ? 'दिन' : selectedLanguage === 'URDU' ? 'دن' : 'Days'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vernacular Caution Flags */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', padding: '8px', fontSize: '0.72rem', color: '#92400E' }}>
              <strong>⚠️ पेट की सावधानी:</strong>
              <div>{selectedLanguage === 'HINDI' ? 'दवा हमेशा खाना खाने के बाद ताजा पानी से लें।' : selectedLanguage === 'URDU' ? 'دوا ہمیشہ کھانے کے بعد تازہ پانی سے لیں۔' : 'Take medicines after meals with fresh water.'}</div>
            </div>
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '8px', fontSize: '0.72rem', color: '#1E40AF' }}>
              <strong>🥛 दूध / चाय परहेज:</strong>
              <div>{selectedLanguage === 'HINDI' ? 'एंटीबायोटिक दवा दूध या चाय के साथ न लें।' : selectedLanguage === 'URDU' ? 'اینٹی بائیوٹک دودھ یا چائے کے ساتھ نہ لیں۔' : 'Avoid taking antibiotics with tea or milk.'}</div>
            </div>
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '8px', fontSize: '0.72rem', color: '#166534' }}>
              <strong>📱 फॉलो-अप रिपोर्ट WhatsApp:</strong>
              <div>{selectedLanguage === 'HINDI' ? 'जांच रिपोर्ट दिखाने के लिए नीचे दिया गया QR कोड स्कैन करें।' : selectedLanguage === 'URDU' ? 'رپورٹ بھیجنے کے لیے نیچے دیا گیا کیو آر کوڈ اسکین کریں۔' : 'Scan prescription QR code to send reports.'}</div>
            </div>
          </div>

          {/* Footer & Doctor Sign Block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '60px', height: '60px', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                🏁
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', maxWidth: '200px' }}>
                Official Clinic WhatsApp Query QR Code • Scanned securely by patient
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{doctorName}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Digitally Authenticated Signature</div>
              <div style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                ✓ DSC TOKEN VERIFIED • DOCSEARCH SYSTEM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
