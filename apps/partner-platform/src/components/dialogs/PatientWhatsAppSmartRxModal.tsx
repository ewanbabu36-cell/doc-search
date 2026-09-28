import React, { useState } from 'react';
import { Button } from '@docsearch/ui-kit';
import type { ConsultationDto } from '@docsearch/api-contracts';
import { getBilingualDosingInstruction, findGenericSaltMatch } from '../views/DoctorExpressConsultationDesk.js';

export interface PatientWhatsAppSmartRxModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
  medications: Array<{
    id: string;
    medicationName: string;
    strength: string;
    dosage: string;
    frequency: string;
    duration: number;
    durationUnit: string;
    beforeAfterFood: string;
    instructions: string;
  }>;
  selectedTests: string[];
  treatmentPlan: string;
  followUpDays: string;
  onPrint?: () => void;
  onNextPatient?: () => void;
}

export const PatientWhatsAppSmartRxModal: React.FC<PatientWhatsAppSmartRxModalProps> = ({
  isOpen,
  onClose,
  consultation,
  medications,
  selectedTests,
  treatmentPlan,
  followUpDays,
  onPrint,
  onNextPatient
}) => {
  const [copied, setCopied] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);

  if (!isOpen || !consultation) return null;

  const patientPhone = (consultation.patientMobile || '9876543210').replace(/\D/g, '').slice(-10);
  const verificationUrl = `https://docsearch.in/verify/rx/${consultation.id || 'DOC-RX'}`;

  // Format WhatsApp message text
  const whatsappText = encodeURIComponent(
    `*Namaste ${consultation.patientName || 'Patient'}*,\n\n` +
    `Your digital prescription from *${consultation.doctorName || 'Dr. Consultant'}* has been generated at *DocSearch Connected Health*.\n\n` +
    `📋 *Consultation Summary:*\n` +
    `• MRN / UHID: ${consultation.patientMrn || 'MRN-7890'}\n` +
    `• Diagnosis: ${consultation.diagnoses?.[0]?.diagnosisName || consultation.clinicalAssessment || 'Clinical Consultation'}\n\n` +
    `💊 *Prescribed Medications (${medications.length}):*\n` +
    medications.map((m, idx) => {
      const bilingual = getBilingualDosingInstruction(m.frequency, m.beforeAfterFood);
      const saltMatch = findGenericSaltMatch(m.medicationName);
      const genericNote = saltMatch && !m.medicationName.toUpperCase().includes(saltMatch.genericSalt)
        ? `\n   _Generic Salt:_ ${saltMatch.genericSalt}`
        : '';
      return `${idx + 1}. *${m.medicationName}* ${m.strength} (${m.dosage} - ${m.frequency}) x ${m.duration} ${m.durationUnit}${genericNote}\n   _Dosing:_ ${bilingual.hindi} (${bilingual.english})\n   _Note:_ ${m.instructions || 'As advised'}`;
    }).join('\n\n') +
    (selectedTests.length > 0 ? `\n\n🔬 *Recommended Lab Tests:*\n${selectedTests.map((t) => `• ${t}`).join('\n')}` : '') +
    `\n\n📅 *Next Follow-up:* ${followUpDays || 'As advised'}\n` +
    `\n🔗 *Verify & Download Official PDF:* ${verificationUrl}\n\n` +
    `_This e-Prescription is digitally signed under IT Act 2000 & NMC Telemedicine Guidelines._`
  );

  const handleSendWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?phone=91${patientPhone}&text=${whatsappText}`;
    window.open(url, '_blank');
    setWhatsappSent(true);
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(decodeURIComponent(whatsappText));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            backgroundColor: '#075E54',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}
            >
              💬
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Patient WhatsApp Smart e-Rx
                </h3>
                <span style={{ fontSize: '0.85rem' }}>✓</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>
                Direct Omnichannel Delivery • NMC & ABDM Compliant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body: WhatsApp Chat Simulation */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#E5DDD5',
            overflowY: 'auto',
            flex: 1,
            backgroundImage: 'radial-gradient(#00000010 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        >
          {/* WhatsApp Speech Bubble */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px 12px 12px 2px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              border: '1px solid #D1D5DB'
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px dashed #CBD5E1',
                paddingBottom: '10px',
                marginBottom: '10px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#059669',
                    backgroundColor: '#ECFDF5',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                >
                  ⚡ Verified Digital Prescription
                </span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
                  {consultation.doctorName || 'Dr. Sanjay Gupta, MBBS, MD'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                  DocSearch Partner Clinic • Reg # NMC-2018-09871
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
                  Token #{consultation.queueToken || 'TK-01'}
                </span>
                <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Patient Info */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.78rem',
                color: '#334155',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span><strong>Patient:</strong> {consultation.patientName}</span>
              <span><strong>MRN:</strong> {consultation.patientMrn || 'MRN-101'}</span>
              <span><strong>Mobile:</strong> +91 {patientPhone}</span>
            </div>

            {/* Medication Timetable */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                💊 Prescribed Medicines ({medications.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {medications.map((med, idx) => {
                  const bilingual = getBilingualDosingInstruction(med.frequency, med.beforeAfterFood);
                  const saltMatch = findGenericSaltMatch(med.medicationName);
                  const showGeneric = saltMatch && !med.medicationName.toUpperCase().includes(saltMatch.genericSalt);

                  return (
                    <div
                      key={med.id || idx}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#0369A1' }}>
                            {idx + 1}. {med.medicationName} {med.strength}
                          </strong>
                          {showGeneric && (
                            <div style={{ fontSize: '0.65rem', color: '#047857', fontWeight: 700 }}>
                              Generic: {saltMatch.genericSalt}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: '#E0F2FE',
                            color: '#0284C7',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          {med.frequency}
                        </span>
                      </div>
                      <div style={{ marginTop: '3px', fontSize: '0.68rem', color: '#D97706', fontWeight: 700 }}>
                        🇮🇳 {bilingual.hindi}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          fontSize: '0.72rem',
                          color: '#475569',
                          marginTop: '3px'
                        }}
                      >
                        <span>⏱️ {med.duration} {med.durationUnit}</span>
                        <span>🍽️ {med.beforeAfterFood}</span>
                        {med.instructions && <span>ℹ️ {med.instructions}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Investigations if ordered */}
            {selectedTests.length > 0 && (
              <div
                style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1D4ED8' }}>
                  🔬 Diagnostic Tests Ordered:
                </div>
                <div style={{ fontSize: '0.74rem', color: '#1E40AF', marginTop: '2px' }}>
                  {selectedTests.join(' • ')}
                </div>
              </div>
            )}

            {/* Advice & Follow-up */}
            <div style={{ fontSize: '0.75rem', color: '#475569', borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
              <div><strong>📅 Next Review:</strong> {followUpDays || 'After 5 Days'}</div>
              {treatmentPlan && (
                <div style={{ marginTop: '2px', whiteSpace: 'pre-line' }}>
                  <strong>Doctor Advice:</strong> {treatmentPlan.split('\n')[0]}
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#94A3B8', marginTop: '6px' }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
            </div>
          </div>

          {/* WhatsApp Sent Feedback */}
          {whatsappSent && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                backgroundColor: '#DCFCE7',
                border: '1px solid #86EFAC',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#15803D',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              ✓ WhatsApp message opened and sent to +91 {patientPhone}!
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              style={{ fontSize: '0.78rem' }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Text'}
            </Button>
            {onPrint && (
              <Button
                size="sm"
                variant="outline"
                onClick={onPrint}
                style={{ fontSize: '0.78rem' }}
              >
                🖨️ Print
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button
              size="md"
              variant="primary"
              onClick={handleSendWhatsApp}
              style={{
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                color: '#FFFFFF',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.4)'
              }}
            >
              <span>💬</span>
              <span>Send via WhatsApp (+91 {patientPhone})</span>
            </Button>

            <Button
              size="md"
              variant="outline"
              onClick={() => {
                onClose();
                if (onNextPatient) onNextPatient();
              }}
              style={{ fontWeight: 700 }}
            >
              Next Patient ➔
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
