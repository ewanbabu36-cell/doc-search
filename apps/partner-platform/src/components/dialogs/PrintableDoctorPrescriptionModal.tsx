import React, { useState } from 'react';
import type { ConsultationDto } from '@docsearch/api-contracts';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationDto;
}

export interface CustomPrescriptionHeader {
  doctorName: string;
  doctorDegree: string;
  doctorSpecialty: string;
  doctorCouncilName: string;
  doctorRegNo: string;
  entityLegalName: string;
  officialAddress: string;
  contactPhone: string;
  supportEmail: string;
  footerNotes: string;
  showWatermark: boolean;
  themeColor: string;
}

const STORAGE_KEY = 'docsearch_custom_rx_letterhead';

export const PrintableDoctorPrescriptionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  consultation
}) => {
  const profile = getVerifiedRoleProfile();

  const [headerConfig, setHeaderConfig] = useState<CustomPrescriptionHeader>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return {
      doctorName: profile.doctorName,
      doctorDegree: profile.doctorDegree,
      doctorSpecialty: profile.doctorSpecialty,
      doctorCouncilName: profile.doctorCouncilName,
      doctorRegNo: profile.doctorRegNo,
      entityLegalName: profile.entityLegalName,
      officialAddress: profile.officialAddress,
      contactPhone: profile.contactPhone,
      supportEmail: profile.supportEmail,
      footerNotes: 'Digitally Signed & Authenticated under IT Act 2000 & NMC Guidelines. Valid for 30 days.',
      showWatermark: true,
      themeColor: '#0284C7'
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  if (!isOpen || !consultation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(headerConfig));
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    setIsEditing(false);
  };

  const handleResetDefaults = () => {
    const def = {
      doctorName: profile.doctorName,
      doctorDegree: profile.doctorDegree,
      doctorSpecialty: profile.doctorSpecialty,
      doctorCouncilName: profile.doctorCouncilName,
      doctorRegNo: profile.doctorRegNo,
      entityLegalName: profile.entityLegalName,
      officialAddress: profile.officialAddress,
      contactPhone: profile.contactPhone,
      supportEmail: profile.supportEmail,
      footerNotes: 'Digitally Signed & Authenticated under IT Act 2000 & NMC Guidelines. Valid for 30 days.',
      showWatermark: true,
      themeColor: '#0284C7'
    };
    setHeaderConfig(def);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 11000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(6, 182, 212, 0.4)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '95vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 70px rgba(0,0,0,0.95)',
        overflow: 'hidden'
      }}>
        {/* Top Control Bar */}
        <div style={{
          backgroundColor: '#0B132B',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🩺</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                Doctor Prescription (Rx) Letterhead & Designer
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                №: <strong style={{ color: '#38BDF8' }}>{consultation.consultationNumber}</strong> • {isEditing ? '✏️ Customizer Mode Active' : '👁️ Print Preview Mode'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {saveToast && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#10B981', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                ✓ Template Saved!
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              style={{
                backgroundColor: isEditing ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                color: isEditing ? '#000' : '#E2E8F0',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              {isEditing ? '👁️ Preview Letterhead' : '✏️ Customize Letterhead'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                backgroundColor: '#06B6D4',
                color: '#070C16',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontWeight: 900,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              🖨️ Print Prescription
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#CBD5E1',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Customizer Drawer (When isEditing = true) */}
        {isEditing && (
          <div style={{
            backgroundColor: '#1E293B',
            padding: '16px 20px',
            borderBottom: '1.5px solid #06B6D4',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            fontSize: '0.75rem'
          }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>Doctor Full Name:</label>
              <input
                type="text"
                value={headerConfig.doctorName}
                onChange={(e) => setHeaderConfig({ ...headerConfig, doctorName: e.target.value })}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>Degrees & Qualifications:</label>
              <input
                type="text"
                value={headerConfig.doctorDegree}
                onChange={(e) => setHeaderConfig({ ...headerConfig, doctorDegree: e.target.value })}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>Clinical Specialty / Title:</label>
              <input
                type="text"
                value={headerConfig.doctorSpecialty}
                onChange={(e) => setHeaderConfig({ ...headerConfig, doctorSpecialty: e.target.value })}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>Medical Council & Reg No:</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  placeholder="Council"
                  value={headerConfig.doctorCouncilName}
                  onChange={(e) => setHeaderConfig({ ...headerConfig, doctorCouncilName: e.target.value })}
                  style={{ width: '50%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 8px', color: '#FFF' }}
                />
                <input
                  type="text"
                  placeholder="Reg No"
                  value={headerConfig.doctorRegNo}
                  onChange={(e) => setHeaderConfig({ ...headerConfig, doctorRegNo: e.target.value })}
                  style={{ width: '50%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 8px', color: '#FFF' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>Hospital / Clinic Name:</label>
              <input
                type="text"
                value={headerConfig.entityLegalName}
                onChange={(e) => setHeaderConfig({ ...headerConfig, entityLegalName: e.target.value })}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>Clinic Address & Contacts:</label>
              <input
                type="text"
                value={headerConfig.officialAddress}
                onChange={(e) => setHeaderConfig({ ...headerConfig, officialAddress: e.target.value })}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', color: '#FFF' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveConfig}
                style={{ flex: 1, backgroundColor: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}
              >
                💾 Save Custom Header
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 10px', fontWeight: 600, cursor: 'pointer' }}
              >
                ↺ Reset
              </button>
            </div>
          </div>
        )}

        {/* Printable Canvas (White Paper simulation) */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#070C16' }}>
          <div id="printable-prescription-canvas" style={{
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            padding: '32px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}>
            {/* Header: Verified Doctor & Facility Credentials */}
            <div style={{ borderBottom: `2.5px solid ${headerConfig.themeColor}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 900, color: headerConfig.themeColor }}>
                  {headerConfig.doctorName}
                </h1>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                  {headerConfig.doctorDegree}
                </div>
                <div style={{ fontSize: '0.8125rem', color: headerConfig.themeColor, fontWeight: 700 }}>
                  {headerConfig.doctorSpecialty}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  <strong>State Medical Council:</strong> {headerConfig.doctorCouncilName} • <strong>Reg. No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{headerConfig.doctorRegNo}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', maxWidth: '340px' }}>
                <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>
                  {headerConfig.entityLegalName}
                </h3>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: '#64748B', lineHeight: 1.3 }}>
                  {headerConfig.officialAddress}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.6875rem', color: '#64748B' }}>
                  📞 {headerConfig.contactPhone} • ✉️ {headerConfig.supportEmail}
                </p>
                <span style={{ display: 'inline-block', backgroundColor: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD', padding: '2px 6px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 800, marginTop: '4px' }}>
                  ✓ ABDM 2.0 & NMC COMPLIANT
                </span>
              </div>
            </div>

            {/* Patient Demographics & Vitals Bar */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', margin: '14px 0', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block' }}>Patient Name:</span>
                <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>{consultation.patientName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block' }}>MRN / UHID:</span>
                <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{consultation.patientMrn}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block' }}>Consultation Date:</span>
                <strong style={{ color: '#0F172A' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block' }}>Known Allergies:</span>
                <strong style={{ color: consultation.patientAllergies.length > 0 ? '#DC2626' : '#16A34A' }}>
                  {consultation.patientAllergies.length > 0 ? consultation.patientAllergies.join(', ') : 'None Reported'}
                </strong>
              </div>
            </div>

            {/* Clinical Diagnoses */}
            {consultation.diagnoses && consultation.diagnoses.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: headerConfig.themeColor, textTransform: 'uppercase' }}>
                  PROVISIONAL / CLINICAL DIAGNOSIS:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {consultation.diagnoses.map((d, i) => (
                    <span key={i} style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>
                      {d.diagnosisCode ? `[${d.diagnosisCode}] ` : ''}{d.diagnosisName} ({d.diagnosisType})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rx Symbol & Medication Table */}
            <div style={{ margin: '18px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: headerConfig.themeColor, fontFamily: 'serif' }}>℞</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                  PRESCRIBED MEDICATIONS & REGIMEN:
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', border: '1px solid #CBD5E1' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1.5px solid #94A3B8', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#1E293B' }}>#</th>
                    <th style={{ padding: '8px 10px', color: '#1E293B' }}>MEDICATION (BRAND / GENERIC)</th>
                    <th style={{ padding: '8px 10px', color: '#1E293B' }}>DOSAGE & ROUTE</th>
                    <th style={{ padding: '8px 10px', color: '#1E293B' }}>TIMING & FREQUENCY</th>
                    <th style={{ padding: '8px 10px', color: '#1E293B' }}>DURATION</th>
                    <th style={{ padding: '8px 10px', color: '#1E293B' }}>INSTRUCTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {consultation.medications && consultation.medications.length > 0 ? (
                    consultation.medications.map((m, idx) => (
                      <tr key={m.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <strong style={{ color: '#0F172A', fontSize: '0.8125rem' }}>{m.medicationName}</strong>
                          {m.genericName && <div style={{ color: '#64748B', fontSize: '0.6875rem' }}>Generic: {m.genericName}</div>}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {m.dosage} · {m.route}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                          {m.frequency} ({m.beforeAfterFood.replace('_', ' ')})
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: headerConfig.themeColor }}>
                          {m.duration} {m.durationUnit.toLowerCase()}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#475569', fontSize: '0.6875rem' }}>
                          {m.instructions || m.indication || 'As advised'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#94A3B8' }}>
                        No medications prescribed in this consultation draft.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Special Instructions & Advice */}
            {consultation.instructions && (
              <div style={{ marginBottom: '14px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <strong style={{ fontSize: '0.75rem', color: headerConfig.themeColor, textTransform: 'uppercase' }}>
                  DIETARY & GENERAL HEALTH INSTRUCTIONS:
                </strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '0.75rem', color: '#334155' }}>
                  {consultation.instructions.dietInstruction && <li><strong>Diet:</strong> {consultation.instructions.dietInstruction}</li>}
                  {consultation.instructions.patientInstruction && <li><strong>Advice:</strong> {consultation.instructions.patientInstruction}</li>}
                  {consultation.instructions.warningSignInstruction && <li><strong>Warning Signs:</strong> {consultation.instructions.warningSignInstruction}</li>}
                  {consultation.instructions.homeCareInstruction && <li><strong>Home Care:</strong> {consultation.instructions.homeCareInstruction}</li>}
                </ul>
              </div>
            )}

            {/* Doctor Signature & Stamping Footer */}
            <div style={{ marginTop: '28px', borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                  Digital Prescription Hash (SHA-256): <span style={{ fontFamily: 'monospace' }}>{profile.sha256Hash.substring(0, 24)}...</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                  ✓ {headerConfig.footerNotes}
                </div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '220px' }}>
                <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', color: headerConfig.themeColor, marginBottom: '2px' }}>
                  {headerConfig.doctorName}
                </div>
                <div style={{ borderTop: '1px solid #0F172A', paddingTop: '2px' }}>
                  <strong style={{ fontSize: '0.75rem', color: '#0F172A', display: 'block' }}>{headerConfig.doctorName}</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>{headerConfig.doctorDegree}</span>
                  <span style={{ fontSize: '0.6875rem', color: headerConfig.themeColor, fontWeight: 700, display: 'block' }}>Reg: {headerConfig.doctorRegNo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
