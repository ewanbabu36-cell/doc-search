import React, { useState, useEffect } from 'react';
import { type Language, translations } from '../i18n.js';
import { patientApiService, type PatientPrescription, type PatientLabReport, type ScannedParchiRecord } from '../services/patient-api.js';
import { speakAdvice } from '../utils/voice-assistant.js';
import { PaperParchiScannerModal } from './PaperParchiScannerModal.js';

interface Props {
  language: Language;
  onBack: () => void;
}

export const MeriParchiScreen: React.FC<Props> = ({ language, onBack }) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'RX' | 'SCANNED' | 'LAB'>('RX');
  const [selectedRx, setSelectedRx] = useState<PatientPrescription | null>(null);
  const [selectedScannedRecord, setSelectedScannedRecord] = useState<ScannedParchiRecord | null>(null);
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [labReports, setLabReports] = useState<PatientLabReport[]>([]);
  const [scannedParchis, setScannedParchis] = useState<ScannedParchiRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      patientApiService.getPrescriptions(),
      patientApiService.getLabReports()
    ]).then(([rx, labs]) => {
      if (mounted) {
        setPrescriptions(rx);
        setLabReports(labs);
        setScannedParchis(patientApiService.getScannedParchis());
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleRecordSaved = (newRecord: ScannedParchiRecord) => {
    setScannedParchis((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
    setActiveTab('SCANNED');
  };

  const handleDeleteScanned = (id: string) => {
    if (confirm(language === 'hi' ? 'क्या आप इस स्कैन किए गए पर्चे को हटाना चाहते हैं?' : 'Delete this scanned record?')) {
      patientApiService.deleteScannedParchi(id);
      setScannedParchis((prev) => prev.filter((r) => r.id !== id));
      if (selectedScannedRecord?.id === id) {
        setSelectedScannedRecord(null);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
        <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#38BDF8' }}>
          {t.myRecords}
        </span>
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          style={{
            backgroundColor: '#0284C7',
            border: 'none',
            color: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>📸</span>
          <span>{language === 'hi' ? 'स्कैन' : 'Scan'}</span>
        </button>
      </div>

      {/* Hero AI Kagaz Scanner Card (Eka Care Killer) */}
      <div
        onClick={() => setIsScannerOpen(true)}
        style={{
          backgroundColor: 'rgba(2, 132, 199, 0.15)',
          border: '1.5px dashed #0284C7',
          borderRadius: '18px',
          padding: '14px 16px',
          marginBottom: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}
          >
            📸
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#F8FAFC' }}>
              {language === 'hi' ? 'पुराने कागज़ पर्ची व टेस्ट स्कैन करें' : 'Scan Paper Parchi & Lab Reports'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
              {language === 'hi' ? 'AI से 5 साल पुराना डॉक्टर का पर्चा तुरंत डिजिटल बनाएं' : 'Convert 5-yr old paper records into digital timeline'}
            </div>
          </div>
        </div>
        <span style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '6px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
          + Scan ➔
        </span>
      </div>

      {/* Tabs Switcher: 3 Rich Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '16px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('RX')}
          style={{
            padding: '10px 4px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: activeTab === 'RX' ? '#0284C7' : 'transparent',
            color: activeTab === 'RX' ? '#F8FAFC' : '#94A3B8',
            transition: 'all 0.2s ease'
          }}
        >
          📄 {language === 'hi' ? 'ई-पर्चा' : 'Digital Rx'} ({prescriptions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SCANNED')}
          style={{
            padding: '10px 4px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: activeTab === 'SCANNED' ? '#0284C7' : 'transparent',
            color: activeTab === 'SCANNED' ? '#F8FAFC' : '#94A3B8',
            transition: 'all 0.2s ease'
          }}
        >
          📸 {language === 'hi' ? 'कागज़ स्कैन' : 'Scanned'} ({scannedParchis.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LAB')}
          style={{
            padding: '10px 4px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            backgroundColor: activeTab === 'LAB' ? '#0284C7' : 'transparent',
            color: activeTab === 'LAB' ? '#F8FAFC' : '#94A3B8',
            transition: 'all 0.2s ease'
          }}
        >
          🧪 {language === 'hi' ? 'लैब रिपोर्ट' : 'Lab Tests'} ({labReports.length})
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#94A3B8', fontSize: '0.9375rem' }}>
          ⏳ {language === 'hi' ? 'डॉक्टर का पर्चा और रिपोर्ट लोड हो रही है...' : 'Loading medical records...'}
        </div>
      )}

      {/* TAB 1: Digital e-Prescriptions */}
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

      {/* TAB 2: AI Digitized Scanned Paper Parchis (Eka Care Killer) */}
      {activeTab === 'SCANNED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {scannedParchis.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 16px', backgroundColor: '#1E293B', borderRadius: '18px' }}>
              <span style={{ fontSize: '2.5rem' }}>📸</span>
              <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '10px' }}>
                {language === 'hi' ? 'कोई पुराना कागज़ स्कैन नहीं है' : 'No scanned paper records yet'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px', marginBottom: '16px' }}>
                {language === 'hi' ? 'घर में रखी पुरानी डॉक्टर की पर्ची का फोटो खींचकर डिजिटल बनाएं।' : 'Snap a picture of old paper records to digitize.'}
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                + Scan Old Record Now
              </button>
            </div>
          )}

          {scannedParchis.map((scan) => (
            <div
              key={scan.id}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '18px',
                padding: '18px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
              {/* Card Header with AI Scan Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', backgroundColor: '#0284C7', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                      AI DIGITIZED PARCHI
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>
                      ● {scan.confidenceScore}% AI Confidence
                    </span>
                  </div>
                  <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC', marginTop: '6px' }}>
                    {scan.doctorName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {scan.clinicHospital}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 800, backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                    📅 {scan.consultationDate}
                  </span>
                  <div style={{ fontSize: '0.625rem', color: '#64748B', marginTop: '4px' }}>
                    Scanned {scan.scannedAt}
                  </div>
                </div>
              </div>

              {/* Diagnosis Banner */}
              <div style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.8125rem', color: '#FDE68A', marginBottom: '12px' }}>
                <strong>Diagnosis:</strong> {scan.diagnosis}
              </div>

              {/* Vitals Bar if captured */}
              {scan.vitals && (
                <div style={{ display: 'flex', gap: '12px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {scan.vitals.bp && <span>BP: <strong>{scan.vitals.bp}</strong></span>}
                  {scan.vitals.pulse && <span>Pulse: <strong>{scan.vitals.pulse}</strong></span>}
                  {scan.vitals.spo2 && <span>SpO2: <strong>{scan.vitals.spo2}</strong></span>}
                  {scan.vitals.weight && <span>Weight: <strong>{scan.vitals.weight}</strong></span>}
                </div>
              )}

              {/* Extracted Medicines */}
              {scan.medicines && scan.medicines.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
                    Extracted Medicines ({scan.medicines.length}):
                  </div>
                  {scan.medicines.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#F1F5F9' }}>• {m.name}</span>
                      <span style={{ color: '#94A3B8' }}>{m.dosage} ({m.timing})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Lab Values */}
              {scan.labValues && scan.labValues.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
                    Extracted Lab Values ({scan.labValues.length}):
                  </div>
                  {scan.labValues.map((lv, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#F1F5F9' }}>{lv.testName}</span>
                      <span style={{ color: lv.flag === 'HIGH' ? '#F87171' : '#34D399', fontWeight: 700 }}>
                        {lv.value} {lv.unit} {lv.flag === 'HIGH' ? '(High)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Voice Listen Button */}
              <button
                type="button"
                onClick={() => {
                  const medList = scan.medicines.map((m) => `${m.name}, ${m.dosage}`).join('. ');
                  const speech = language === 'hi'
                    ? `${scan.doctorName} का पुराना पर्चा: तारीख ${scan.consultationDate}। बीमारी: ${scan.diagnosis}। दवाइयाँ: ${medList}।`
                    : `Scanned record from ${scan.consultationDate} by ${scan.doctorName}. Diagnosis: ${scan.diagnosis}. Medicines: ${medList}.`;
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
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🔊</span>
                <span>{language === 'hi' ? 'दवा की सलाह सुनें (आवाज़)' : 'Listen Scanned Advice'}</span>
              </button>

              {/* Card Footer: View Original Paper Photo & Delete */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {scan.originalImageUri ? (
                  <button
                    type="button"
                    onClick={() => setSelectedScannedRecord(scan)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#F8FAFC',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🖼️</span>
                    <span>{language === 'hi' ? 'मूल कागज़ देखें' : 'View Original Paper'}</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => handleDeleteScanned(scan.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ {language === 'hi' ? 'हटाएं' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: List of Lab Reports */}
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

      {/* Scanned Paper Photo Viewer Modal */}
      {selectedScannedRecord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '20px', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#38BDF8' }}>
                  {selectedScannedRecord.doctorName}
                </span>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {selectedScannedRecord.consultationDate} • Original Physical Document
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScannedRecord(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, borderRadius: '14px', overflow: 'hidden', backgroundColor: '#0B0F19', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedScannedRecord.originalImageUri ? (
                <img
                  src={selectedScannedRecord.originalImageUri}
                  alt="Scanned original paper"
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: '#94A3B8' }}>No image preview</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedScannedRecord(null)}
              style={{ width: '100%', backgroundColor: '#0284C7', color: '#F8FAFC', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', marginTop: '14px' }}
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}

      {/* Eka Care Killer: Paper Parchi Scanner Modal */}
      <PaperParchiScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        language={language}
        onRecordSaved={handleRecordSaved}
      />
    </div>
  );
};
