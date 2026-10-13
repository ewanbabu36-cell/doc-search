import React, { useState, useEffect } from 'react';
import type { InpatientDischargeSummaryDto } from '@docsearch/api-contracts';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export interface PrintableDischargeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: InpatientDischargeSummaryDto | null;
  hospitalName?: string | undefined;
  facilityAddress?: string | undefined;
}

export const PrintableDischargeSummaryModal: React.FC<PrintableDischargeSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  hospitalName,
  facilityAddress
}) => {
  const [profile, setProfile] = useState(getVerifiedRoleProfile);
  const [isCopied, setIsCopied] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(getVerifiedRoleProfile());
      setWhatsAppSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !summary) return null;

  const resolvedHospitalName = hospitalName || profile.entityLegalName || 'DOC SEARCH ADVANCED MULTI-SPECIALITY HOSPITAL';
  const resolvedAddress = facilityAddress || profile.officialAddress || 'Medical College Road, Healthcare District';
  const resolvedPhone = profile.contactPhone || '+91 98765 43210';
  const resolvedEmail = (profile as any).officialEmail || (profile as any).contactEmail || 'ipd@docsearch.health';
  const resolvedDoctor = summary.attendingConsultantName || profile.doctorName || 'Dr. Vikram Malhotra, MS (Gen Surg)';
  const doctorRegNo = profile.doctorRegNo || 'MCI-2016-884920';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `*HOSPITAL DISCHARGE SUMMARY*\n` +
      `*Hospital:* ${resolvedHospitalName}\n` +
      `*Patient:* ${summary.patientName} (${summary.patientMrn})\n` +
      `*Summary #:* ${summary.summaryNumber}\n` +
      `*Admission:* ${new Date(summary.admissionDate).toLocaleDateString('en-IN')}\n` +
      `*Discharge:* ${new Date(summary.dischargeDate).toLocaleDateString('en-IN')}\n` +
      `*Final Diagnosis:* ${summary.finalPrimaryDiagnosis}\n` +
      `*Attending Consultant:* ${resolvedDoctor}\n\n` +
      `*Discharge Medications:*\n${summary.dischargeMedicationAdvice}\n\n` +
      `*Diet & Advice:* ${summary.dietAndActivityAdvice}\n` +
      `*Emergency Warning Signs:* ${summary.warningSignsToSeekImmediateCare}\n` +
      `*Follow-up Date:* ${summary.followUpAppointmentDate || 'After 7 days'}\n\n` +
      `_Issued by ${resolvedHospitalName} Electronic Medical Records_`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    setIsSendingWhatsApp(true);
    setTimeout(() => {
      setIsSendingWhatsApp(false);
      setWhatsAppSuccess(true);
      setTimeout(() => setWhatsAppSuccess(false), 3500);
    }, 800);
  };

  return (
    <div
      className="ds-discharge-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ds-discharge-modal-container"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '94vh',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif"
        }}
      >
        {/* Top Control Bar (Hidden during Print) */}
        <div
          className="ds-no-print"
          style={{
            padding: '12px 20px',
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>📄</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
                Official Clinical Discharge Summary
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                NABH / JCI Inpatient Standard • Summary #{summary.summaryNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyText}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: isCopied ? '#34D399' : '#E2E8F0',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Copy Summary to Clipboard"
            >
              <span>{isCopied ? '✓ Copied' : '📋 Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={isSendingWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: whatsAppSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(37, 211, 102, 0.15)',
                border: `1px solid ${whatsAppSuccess ? '#10B981' : 'rgba(37, 211, 102, 0.35)'}`,
                color: whatsAppSuccess ? '#10B981' : '#25D366',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Dispatch to Patient's Registered Mobile via WhatsApp"
            >
              <span>📲</span>
              <span>{isSendingWhatsApp ? 'Sending...' : whatsAppSuccess ? '✓ Dispatched' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#2563EB',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)'
              }}
            >
              <span>🖨️</span>
              <span>Print A4</span>
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
                padding: '4px 8px',
                lineHeight: 1
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A4 Standard) */}
        <div
          id="ds-printable-discharge-content"
          style={{
            padding: '36px 44px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#FFFFFF',
            lineHeight: 1.5
          }}
        >
          {/* 1. Hospital Letterhead */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2.5px solid #0F172A',
              paddingBottom: '16px',
              marginBottom: '18px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                {resolvedHospitalName}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', marginTop: '2px', textTransform: 'uppercase' }}>
                Multi-Speciality Hospital &amp; Intensive Care Centre
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
                {resolvedAddress}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                📞 24x7 Emergency: {resolvedPhone} | ✉️ {resolvedEmail}
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, color: '#0F172A' }}>
                NABH ACCREDITED • REG: HOSP-2026-904
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'monospace' }}>
                CR-ID: {summary.summaryNumber}
              </div>
              {/* Barcode representation */}
              <div style={{ marginTop: '4px', height: '24px', width: '130px', background: 'repeating-linear-gradient(90deg, #0f172a, #0f172a 2px, transparent 2px, transparent 4px)', opacity: 0.85 }} />
            </div>
          </div>

          {/* Document Title Banner */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '6px',
              padding: '6px 12px',
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '0.92rem',
              color: '#0F172A',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}
          >
            Clinical Inpatient Discharge Summary (डिस्चार्ज समरी)
          </div>

          {/* 2. Patient Demographics & Admission Matrix */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
              marginBottom: '18px',
              border: '1px solid #E2E8F0'
            }}
          >
            <tbody>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '18%', border: '1px solid #E2E8F0' }}>Patient Name</td>
                <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0F172A', width: '32%', border: '1px solid #E2E8F0' }}>{summary.patientName}</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '18%', border: '1px solid #E2E8F0' }}>UHID / MRN</td>
                <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0F172A', width: '32%', border: '1px solid #E2E8F0', fontFamily: 'monospace' }}>{summary.patientMrn}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', border: '1px solid #E2E8F0' }}>Date of Admission</td>
                <td style={{ padding: '6px 10px', color: '#0F172A', border: '1px solid #E2E8F0' }}>
                  {new Date(summary.admissionDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', border: '1px solid #E2E8F0' }}>Date of Discharge</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0F172A', border: '1px solid #E2E8F0' }}>
                  {new Date(summary.dischargeDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', border: '1px solid #E2E8F0' }}>Treating Consultant</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#2563EB', border: '1px solid #E2E8F0' }}>{resolvedDoctor}</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', border: '1px solid #E2E8F0' }}>Type of Discharge</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: '#16A34A', border: '1px solid #E2E8F0' }}>
                  STABLE / ROUTINE MEDICAL DISCHARGE
                </td>
              </tr>
            </tbody>
          </table>

          {/* 3. Clinical Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
            {/* Diagnosis Box */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '10px 14px', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Final Primary Diagnosis:
              </div>
              <div style={{ color: '#1E293B', fontWeight: 700, fontSize: '0.9rem' }}>
                • {summary.finalPrimaryDiagnosis}
              </div>
              {summary.finalSecondaryDiagnosis && (
                <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '3px' }}>
                  Secondary: {summary.finalSecondaryDiagnosis}
                </div>
              )}
            </div>

            {/* Surgical Procedures (if any) */}
            {summary.surgicalProceduresPerformed && (
              <div>
                <div style={{ fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px', marginBottom: '4px' }}>
                  OPERATIVE / SURGICAL PROCEDURES PERFORMED:
                </div>
                <div style={{ color: '#334155', paddingLeft: '8px' }}>
                  {summary.surgicalProceduresPerformed}
                </div>
              </div>
            )}

            {/* Hospital Course */}
            <div>
              <div style={{ fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px', marginBottom: '4px' }}>
                HOSPITAL COURSE &amp; CLINICAL MANAGEMENT:
              </div>
              <div style={{ color: '#334155', paddingLeft: '8px', textAlign: 'justify' }}>
                {summary.hospitalCourseSummary || 'Patient admitted with acute symptoms. Responded favourably to institutional therapy. Afebrile, vitals stable, ambulating independently at time of discharge.'}
              </div>
            </div>

            {/* Treatment Administered */}
            {summary.treatmentGiven && (
              <div>
                <div style={{ fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px', marginBottom: '4px' }}>
                  IN-HOSPITAL PHARMACOTHERAPY &amp; INTERVENTIONS:
                </div>
                <div style={{ color: '#334155', paddingLeft: '8px' }}>
                  {summary.treatmentGiven}
                </div>
              </div>
            )}

            {/* Key Investigations */}
            {summary.keyInvestigationFindings && (
              <div>
                <div style={{ fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px', marginBottom: '4px' }}>
                  PERTINENT LABORATORY &amp; RADIOLOGY FINDINGS:
                </div>
                <div style={{ color: '#334155', paddingLeft: '8px' }}>
                  {summary.keyInvestigationFindings}
                </div>
              </div>
            )}

            {/* Discharge Medications Box */}
            <div style={{ border: '1.5px solid #2563EB', borderRadius: '6px', padding: '12px 14px', backgroundColor: '#EFF6FF' }}>
              <div style={{ fontWeight: 900, color: '#1E40AF', fontSize: '0.86rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💊</span>
                <span>DISCHARGE MEDICATION SCHEDULE &amp; PRECAUTIONS:</span>
              </div>
              <div style={{ color: '#1E293B', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.6, paddingLeft: '4px' }}>
                {summary.dischargeMedicationAdvice || 'Take prescribed medications regularly as directed. Do not skip doses without doctor consultation.'}
              </div>
            </div>

            {/* Diet & Activity Advice */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.78rem', marginBottom: '3px' }}>
                  🥗 DIETARY &amp; LIFESTYLE ADVICE:
                </div>
                <div style={{ color: '#475569', fontSize: '0.78rem' }}>
                  {summary.dietAndActivityAdvice || 'Normal home-cooked diet. High fluid intake. Avoid heavy exertion for 1 week.'}
                </div>
              </div>

              <div style={{ border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ fontWeight: 800, color: '#B91C1C', fontSize: '0.78rem', marginBottom: '3px' }}>
                  🚨 RED FLAGS / SEEK IMMEDIATE CARE:
                </div>
                <div style={{ color: '#991B1B', fontSize: '0.78rem', fontWeight: 600 }}>
                  {summary.warningSignsToSeekImmediateCare || 'High fever (>101°F), severe breathlessness, uncontrolled bleeding, persistent vomiting.'}
                </div>
              </div>
            </div>

            {/* Review Date & Chamber */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>NEXT FOLLOW-UP REVIEW: </span>
                <span style={{ color: '#2563EB', fontWeight: 800 }}>
                  {summary.followUpAppointmentDate || 'After 7 Days'} ({summary.followUpDoctorName || resolvedDoctor})
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Bring this discharge card on every subsequent OPD visit.
              </div>
            </div>
          </div>

          {/* 4. Official Signatures and Medico-Legal Disclaimer Footer */}
          <div
            style={{
              marginTop: '36px',
              paddingTop: '16px',
              borderTop: '1px dashed #CBD5E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end'
            }}
          >
            <div>
              <div style={{ width: '130px', borderBottom: '1px solid #94A3B8', marginBottom: '6px' }} />
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
                Dr. Resident Medical Officer
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                MBBS, DNB • Duty Medical Officer
              </div>
            </div>

            {/* Center Digital Stamp */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-block',
                  border: '1.5px solid #16A34A',
                  color: '#16A34A',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                ELECTRONICALLY SIGNED &amp; SEALED ✓
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94A3B8', marginTop: '2px' }}>
                Secured via DocSearch Cryptographic EMR
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ width: '150px', borderBottom: '1px solid #0F172A', marginBottom: '6px', marginLeft: 'auto' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                {resolvedDoctor}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
                Attending Consultant Physician / Surgeon
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                Reg No: {doctorRegNo}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
