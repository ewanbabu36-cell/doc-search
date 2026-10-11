import React, { useState, useEffect } from 'react';
import { type Language, translations } from '../i18n.js';
import { patientApiService, type PatientPrescription, type PatientLabReport } from '../services/patient-api.js';
import { speakAdvice } from '../utils/voice-assistant.js';

interface Props {
  language: Language;
  onBack: () => void;
}

export const MeriParchiScreen: React.FC<Props> = ({ language, onBack }) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'RX' | 'LAB'>('RX');
  const [selectedRx, setSelectedRx] = useState<PatientPrescription | null>(null);
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [labReports, setLabReports] = useState<PatientLabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      patientApiService.getPrescriptions(),
      patientApiService.getLabReports()
    ]).then(([rx, labs]) => {
      if (mounted) {
        setPrescriptions(rx);
        setLabReports(labs);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#F8FAFC',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '0.9375rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ← {language === 'hi' ? 'वापस' : 'Back'}
        </button>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38BDF8' }}>
          {t.myRecords}
        </span>
        <div style={{ width: '60px' }} />
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '16px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('RX')}
          style={{
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: activeTab === 'RX' ? '#0284C7' : 'transparent',
            color: activeTab === 'RX' ? '#F8FAFC' : '#94A3B8',
            transition: 'all 0.2s ease'
          }}
        >
          📄 {t.myPrescriptions} ({prescriptions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('LAB')}
          style={{
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: activeTab === 'LAB' ? '#0284C7' : 'transparent',
            color: activeTab === 'LAB' ? '#F8FAFC' : '#94A3B8',
            transition: 'all 0.2s ease'
          }}
        >
          🧪 {t.labReports} ({labReports.length})
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#94A3B8', fontSize: '0.9375rem' }}>
          ⏳ {language === 'hi' ? 'डॉक्टर का पर्चा और रिपोर्ट लोड हो रही है...' : 'Loading medical records...'}
        </div>
      )}

      {/* List of Prescriptions */}
      {activeTab === 'RX' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '18px',
                padding: '18px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {rx.doctorName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>
                    {rx.specialty}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px' }}>
                  {rx.date}
                </span>
              </div>

              <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.8125rem', color: '#E0F2FE', marginBottom: '14px' }}>
                <strong>Diagnosis:</strong> {rx.diagnosis}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {rx.medicines.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: '#F1F5F9' }}>• {m.name}</span>
                    <span style={{ color: '#94A3B8' }}>{m.dosage} ({m.timing.replace('_', ' ')})</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const medText = rx.medicines
                    .map(
                      (m) =>
                        `${m.name}, ${m.dosage}, ${
                          m.timing === 'EMPTY_STOMACH'
                            ? 'सुबह खाली पेट'
                            : m.timing === 'NIGHT'
                            ? 'रात को सोते समय'
                            : 'खाने के बाद'
                        }`
                    )
                    .join('. ');
                  const speech =
                    language === 'hi'
                      ? `${rx.doctorName} की सलाह: बीमारी - ${rx.diagnosis}। दवाइयाँ: ${medText}।`
                      : `Prescription by ${rx.doctorName}: Diagnosis ${rx.diagnosis}. Medicines: ${medText}.`;
                  speakAdvice(speech, language);
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#38BDF8',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🔊</span>
                <span>{language === 'hi' ? 'दवा की सलाह सुनें (आवाज़)' : 'Listen Prescription Advice'}</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedRx(rx)}
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#F8FAFC',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  👁️ {t.viewPdf}
                </button>
                <button
                  type="button"
                  onClick={() => alert('Prescription link copied for WhatsApp!')}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34D399',
                    borderRadius: '12px',
                    padding: '10px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📲 {t.shareWhatsApp}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List of Lab Reports */}
      {activeTab === 'LAB' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {labReports.map((lab) => (
            <div
              key={lab.id}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '18px',
                padding: '18px',
                border: lab.status === 'HIGH_ALERT' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', maxWidth: '70%' }}>
                  {lab.testName}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: lab.status === 'HIGH_ALERT' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: lab.status === 'HIGH_ALERT' ? '#F87171' : '#34D399',
                    border: lab.status === 'HIGH_ALERT' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {lab.status === 'HIGH_ALERT' ? `🔴 ${t.highAlert}` : `🟢 ${t.normal}`}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: lab.status === 'HIGH_ALERT' ? '#F87171' : '#F8FAFC' }}>
                  {lab.value}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 600 }}>{lab.unit}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: 'auto' }}>Range: {lab.referenceRange}</span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                Verified by: {lab.signedBy} • {lab.date}
              </div>

              <button
                type="button"
                onClick={() => alert(`Downloading NABL Verified PDF for ${lab.testName}`)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#F8FAFC',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📥 Download NABL Verified Report (PDF)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Full-Screen Modal Preview */}
      {selectedRx && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '20px', padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>Digital Prescription</span>
              <button type="button" onClick={() => setSelectedRx(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{selectedRx.doctorName}</div>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>{selectedRx.specialty} • Date: {selectedRx.date}</div>
              <div style={{ fontSize: '0.875rem', color: '#34D399', fontWeight: 700, marginTop: '4px' }}>Diagnosis: {selectedRx.diagnosis}</div>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.875rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '10px' }}>Rx Medications</h4>
              {selectedRx.medicines.map((m, idx) => (
                <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#F8FAFC' }}>{m.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#38BDF8', marginTop: '2px' }}>Dosage: {m.dosage} | Timing: {m.timing.replace('_', ' ')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Duration: {m.duration}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelectedRx(null)}
              style={{ width: '100%', backgroundColor: '#0284C7', color: '#F8FAFC', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '16px' }}
            >
              Close Prescription
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
