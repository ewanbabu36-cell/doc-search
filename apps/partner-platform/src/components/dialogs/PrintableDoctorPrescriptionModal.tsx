import React, { useState, useEffect } from 'react';
import type { ConsultationDto } from '@docsearch/api-contracts';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';
import { ProfileUpdateRequiredAlertModal } from '../common/ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import { getBilingualDosingInstruction, findGenericSaltMatch } from '../views/DoctorExpressConsultationDesk.js';

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
  signatureUrl?: string;
  stampSealUrl?: string;
}

const STORAGE_KEY = 'docsearch_custom_rx_letterhead';

export const PrintableDoctorPrescriptionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  consultation
}) => {
  const [profile, setProfile] = useState(getVerifiedRoleProfile);

  const getActiveHeaderConfig = (): CustomPrescriptionHeader => {
    const prof = getVerifiedRoleProfile();
    let saved: any = null;
    if (typeof window !== 'undefined') {
      const savedStr = localStorage.getItem(STORAGE_KEY);
      if (savedStr) {
        try {
          saved = JSON.parse(savedStr);
        } catch {}
      }
    }
    return {
      doctorName: saved?.doctorName || consultation?.doctorName || prof.doctorName || 'Consulting Physician',
      doctorDegree: saved?.doctorDegree || prof.doctorDegree || 'MBBS',
      doctorSpecialty: saved?.doctorSpecialty || prof.doctorSpecialty || 'General Medicine',
      doctorCouncilName: saved?.doctorCouncilName || prof.doctorCouncilName || 'State Medical Council',
      doctorRegNo: saved?.doctorRegNo || prof.doctorRegNo || 'Reg # Verification Required',
      entityLegalName: saved?.entityLegalName || prof.entityLegalName || 'Healthcare Clinic & Consultation',
      officialAddress: saved?.officialAddress || prof.officialAddress,
      contactPhone: saved?.contactPhone || prof.contactPhone,
      supportEmail: saved?.supportEmail || prof.supportEmail,
      footerNotes: saved?.footerNotes || 'Digitally Signed & Authenticated under IT Act 2000 & NMC Guidelines. Valid for 30 days.',
      showWatermark: saved?.showWatermark ?? true,
      themeColor: saved?.themeColor || '#0284C7',
      signatureUrl: saved?.signatureUrl || prof.branding?.signatureUrl || '',
      stampSealUrl: saved?.stampSealUrl || prof.branding?.stampSealUrl || ''
    };
  };

  const [headerConfig, setHeaderConfig] = useState<CustomPrescriptionHeader>(getActiveHeaderConfig);

  useEffect(() => {
    if (isOpen) {
      setProfile(getVerifiedRoleProfile());
      setHeaderConfig(getActiveHeaderConfig());
    }
  }, [isOpen]);

  const [isEditing, setIsEditing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [letterheadMode, setLetterheadMode] = useState<'PLAIN_A4' | 'PREPRINTED_PAD'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docsearch_prescription_letterhead_mode');
      if (saved === 'PREPRINTED_PAD' || saved === 'PLAIN_A4') return saved;
    }
    return 'PLAIN_A4';
  });

  const handleSelectLetterheadMode = (mode: 'PLAIN_A4' | 'PREPRINTED_PAD') => {
    setLetterheadMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('docsearch_prescription_letterhead_mode', mode);
    }
  };

  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);

  if (!isOpen || !consultation) return null;

  const handlePrint = () => {
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }
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
      doctorName: consultation?.doctorName || profile.doctorName || 'Consulting Physician',
      doctorDegree: profile.doctorDegree || 'MBBS',
      doctorSpecialty: profile.doctorSpecialty || 'General Medicine',
      doctorCouncilName: profile.doctorCouncilName || 'State Medical Council',
      doctorRegNo: profile.doctorRegNo || 'Reg # Verification Required',
      entityLegalName: profile.entityLegalName || 'Healthcare Clinic & Consultation',
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

            {/* Letterhead Paper vs Pre-Printed Pad Switcher */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => handleSelectLetterheadMode('PLAIN_A4')}
                style={{
                  backgroundColor: letterheadMode === 'PLAIN_A4' ? '#0284C7' : 'transparent',
                  color: letterheadMode === 'PLAIN_A4' ? '#FFF' : '#94A3B8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Print full clinic header & branding on blank A4 paper"
              >
                <span>📄</span>
                <span>Plain A4 (Full Header)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectLetterheadMode('PREPRINTED_PAD')}
                style={{
                  backgroundColor: letterheadMode === 'PREPRINTED_PAD' ? '#F59E0B' : 'transparent',
                  color: letterheadMode === 'PREPRINTED_PAD' ? '#000' : '#94A3B8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Leave 65mm blank top margin for doctor's pre-printed stationery pad"
              >
                <span>📋</span>
                <span>Pre-Printed Pad (65mm Top Margin)</span>
              </button>
            </div>

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
            {/* Print Styles for Letterhead Pad Margin */}
            <style>{`
              @media print {
                .preprinted-pad-spacer {
                  border: none !important;
                  background: transparent !important;
                  color: transparent !important;
                  min-height: 65mm !important;
                  height: 65mm !important;
                }
                .preprinted-pad-spacer * {
                  display: none !important;
                  visibility: hidden !important;
                }
              }
            `}</style>

            {letterheadMode === 'PLAIN_A4' ? (
              /* Header: Verified Doctor & Facility Credentials (Plain A4 Paper) */
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
            ) : (
              /* Pre-Printed Letterhead Mode: 65mm blank reserved top margin */
              <div
                className="preprinted-pad-spacer"
                style={{
                  minHeight: '65mm',
                  height: '65mm',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAFC',
                  color: '#94A3B8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  gap: '4px',
                  marginBottom: '16px',
                  userSelect: 'none'
                }}
              >
                <span>📋 [ Pre-Printed Physical Letterhead Stationery Space - 65mm ]</span>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                  (This box is automatically invisible when printed. Top margin preserved for your physical clinic letterhead pad)
                </span>
              </div>
            )}

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
                    consultation.medications.map((m, idx) => {
                      const saltMatch = findGenericSaltMatch(m.medicationName);
                      const genericText = m.genericName || saltMatch?.genericSalt;
                      const showGeneric = genericText && !m.medicationName.toUpperCase().includes(genericText.toUpperCase());
                      const bilingual = getBilingualDosingInstruction(m.frequency, m.beforeAfterFood);

                      return (
                        <tr key={m.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <strong style={{ color: '#0F172A', fontSize: '0.8125rem' }}>{m.medicationName}</strong>
                            {showGeneric && (
                              <div style={{ color: '#047857', fontSize: '0.6875rem', fontWeight: 700, marginTop: '2px' }}>
                                Generic Salt: {genericText.toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {m.dosage} · {m.route}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                            <div>{m.frequency} ({m.beforeAfterFood.replace(/_/g, ' ')})</div>
                            <div style={{ fontSize: '0.6875rem', color: '#D97706', fontWeight: 700, marginTop: '2px' }}>
                              🇮🇳 {bilingual.hindi}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: headerConfig.themeColor }}>
                            {m.duration} {m.durationUnit.toLowerCase()}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#475569', fontSize: '0.6875rem' }}>
                            {m.instructions || m.indication || 'As advised'}
                          </td>
                        </tr>
                      );
                    })
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

              <div style={{ textAlign: 'center', minWidth: '220px', position: 'relative' }}>
                {(headerConfig.stampSealUrl || profile.branding?.stampSealUrl) && (
                  <img
                    src={headerConfig.stampSealUrl || profile.branding?.stampSealUrl}
                    alt="Official Seal"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      bottom: '20px',
                      width: '56px',
                      height: '56px',
                      opacity: 0.65,
                      pointerEvents: 'none'
                    }}
                  />
                )}
                {(headerConfig.signatureUrl || profile.branding?.signatureUrl) ? (
                  <img
                    src={headerConfig.signatureUrl || profile.branding?.signatureUrl}
                    alt="Doctor Signature"
                    style={{ height: '40px', width: 'auto', maxHeight: '40px', objectFit: 'contain', margin: '0 auto 2px', display: 'block' }}
                  />
                ) : (
                  <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', color: headerConfig.themeColor, marginBottom: '2px' }}>
                    {headerConfig.doctorName}
                  </div>
                )}
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
      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName="Doctor Prescription Print"
        missingFields={profileMissingFields}
      />
    </div>
  );
};
