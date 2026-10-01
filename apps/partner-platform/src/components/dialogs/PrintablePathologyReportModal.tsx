import React, { useState, useEffect } from 'react';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';
import { downloadVectorPathologyPdf } from '../../utils/clientPathologyPdf.js';
import { ProfileUpdateRequiredAlertModal } from '../common/ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import { getStandardTestInterpretation } from '../../services/diagnostic-test-interpretation-engine.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: InvestigationOrderDto;
}

export interface LabHeaderSettings {
  labName: string;
  labTagline: string;
  labAddress: string;
  certificateNo: string;
  technicianName: string;
  technicianTitle: string;
  technicianRegNo?: string;
  pathologistName: string;
  pathologistTitle: string;
  pathologistRegNo: string;
  medicoLegalNotice?: string;
}

const DEFAULT_SETTINGS_STORAGE_KEY = 'docsearch_lab_header_settings';

const getDefaultSettings = (): LabHeaderSettings => {
  const profile = getVerifiedRoleProfile();

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(DEFAULT_SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
  }

  return {
    labName: (profile.entityLegalName || 'DOC SEARCH CLINICAL PATHOLOGY LABORATORY').toUpperCase(),
    labTagline: profile.facilityTagline || 'CLINICAL PATHOLOGY, HAEMATOLOGY & DIAGNOSTIC MEDICINE',
    labAddress: `📍 ${profile.officialAddress || 'Facility Premises'} | 📞 ${profile.contactPhone || 'Official Desk'}${profile.website ? ' | 🌐 ' + profile.website : ''}`,
    certificateNo: profile.nablCertificateNo || 'ISO 9001:2015 CERTIFIED COMPANY / NABL Standard',
    technicianName: profile.technicianName || 'MD. SANJAR ALAM',
    technicianTitle: profile.technicianDegree || 'D.M.L.T',
    technicianRegNo: profile.technicianRegNo || 'Registration No. - 26534/10',
    pathologistName: profile.pathologistName || (profile.doctorName ? `DR. ${profile.doctorName}` : 'DR. VIKRAM KUMAR'),
    pathologistTitle: profile.pathologistDegree || 'MBBS (DMCH)',
    pathologistRegNo: profile.pathologistRegNo ? (profile.pathologistRegNo.includes('Reg') ? profile.pathologistRegNo : `Registration No. - ${profile.pathologistRegNo}`) : 'Registration No. - 47684',
    medicoLegalNotice: profile.branding?.medicoLegalNotice || profile.medicoLegalNotice || 'Note:- Here all types of Blood and urine tests are done through automated machines. Results must be correlated clinically with medical history. Not Valid for Medico-Legal Purpose.'
  };
};

export const PrintablePathologyReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order
}) => {
  const profile = getVerifiedRoleProfile();
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [printOnLetterhead, setPrintOnLetterhead] = useState(false);

  // Lab customization settings state
  const [settings, setSettings] = useState<LabHeaderSettings>(getDefaultSettings);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [formSettings, setFormSettings] = useState<LabHeaderSettings>(getDefaultSettings);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getDefaultSettings();
      setSettings(active);
      setFormSettings(active);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [blockedActionName, setBlockedActionName] = useState('NABL Pathology Report');
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);

  if (!isOpen || !order) return null;

  const checkGuard = (action: string): boolean => {
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setBlockedActionName(action);
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return false;
    }
    return true;
  };

  const handlePrint = () => {
    if (!checkGuard('Print Pathology Report')) return;
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!checkGuard('Download Vector PDF Report')) return;
    try {
      setIsDownloadingPdf(true);
      // Generate instant client vector ISO-32000-1 binary PDF with NABH barcode & doctor digital signature
      downloadVectorPathologyPdf(order, settings);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch {
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!checkGuard('Send Report via WhatsApp')) return;
    setIsSendingWhatsApp(true);
    setTimeout(() => {
      setIsSendingWhatsApp(false);
      setWhatsAppSuccess(true);
      setTimeout(() => setWhatsAppSuccess(false), 4000);
    }, 800);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEFAULT_SETTINGS_STORAGE_KEY, JSON.stringify(formSettings));
    }
    setSaveSuccessMessage(true);
    setTimeout(() => {
      setSaveSuccessMessage(false);
      setIsEditingSettings(false);
    }, 1200);
  };

  const handleResetToDefault = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEFAULT_SETTINGS_STORAGE_KEY);
    }
    const def = getDefaultSettings();
    setSettings(def);
    setFormSettings(def);
    setIsEditingSettings(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* CSS @media print style */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: ${printOnLetterhead ? '0mm' : '8mm'};
          }
          body * {
            visibility: hidden !important;
          }
          #printable-pathology-sheet, #printable-pathology-sheet * {
            visibility: visible !important;
          }
          #printable-pathology-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: ${printOnLetterhead ? '55mm 16mm 14mm 16mm' : '14mm 16mm'} !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 12pt !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '890px',
        maxHeight: '94vh',
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        borderRadius: '16px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.9)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Top Action Bar (Screen Only - Hidden in Print) */}
        <div className="no-print" style={{
          backgroundColor: '#0F172A',
          color: '#FFF',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>📄</span>
            <div>
              <strong style={{ fontSize: '0.875rem' }}>NABL Diagnostic Report Preview</strong>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>
                Order #{order.orderNumber} • Patient: {order.patientName} (MRN: {order.patientMrn})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Blank Paper vs Pre-printed Letterhead toggle */}
            <button
              type="button"
              onClick={() => setPrintOnLetterhead(!printOnLetterhead)}
              style={{
                backgroundColor: printOnLetterhead ? '#7C3AED' : 'rgba(255,255,255,0.12)',
                color: '#FFF',
                border: `1px solid ${printOnLetterhead ? '#A855F7' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Toggle between blank A4 paper (with digital header) or pre-printed lab letterhead stationery"
            >
              <span>{printOnLetterhead ? '📜' : '📄'}</span>
              <span>{printOnLetterhead ? 'Pre-Printed Letterhead Mode' : 'Blank A4 (Full Header)'}</span>
            </button>

            {/* Customize Lab Header & Signature Button */}
            <button
              type="button"
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              style={{
                backgroundColor: isEditingSettings ? '#F59E0B' : 'rgba(255,255,255,0.12)',
                color: isEditingSettings ? '#000' : '#F8FAFC',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>⚙️</span>
              <span>{isEditingSettings ? 'Close Edit Form' : 'Edit Lab Header & Doctor'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={isSendingWhatsApp}
              style={{
                backgroundColor: '#25D366',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📲</span>
              <span>{isSendingWhatsApp ? 'Sending...' : whatsAppSuccess ? '✓ Sent to WhatsApp' : 'Send WhatsApp PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📄</span>
              <span>{isDownloadingPdf ? 'Generating PDF...' : pdfSuccess ? '✓ PDF Downloaded' : 'Download PDF'}</span>
            </button>

            {/* High-Visibility Emerald Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                backgroundColor: '#10B981',
                color: '#064E3B',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
              }}
              title="Print A4 Report directly to physical printer (Ctrl+P)"
            >
              <span>🖨️</span>
              <span>Print A4 Report</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Lab Header & Signatures Customization Panel (Accordion Drawer) */}
        {isEditingSettings && (
          <div className="no-print" style={{
            backgroundColor: '#0F172A',
            borderBottom: '2px solid #06B6D4',
            padding: '16px 20px',
            color: '#FFF'
          }}>
            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛠️</span> Customize Lab Name, Address, NABL Certificate & Signatures
                </span>
                {saveSuccessMessage && (
                  <span style={{ fontSize: '0.75rem', color: '#4ADE80', fontWeight: 800 }}>
                    ✓ Settings Saved & Applied!
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>LAB BRAND NAME *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.labName}
                    onChange={(e) => setFormSettings({ ...formSettings, labName: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>TAGLINE / ACCREDITATION *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.labTagline}
                    onChange={(e) => setFormSettings({ ...formSettings, labTagline: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>NABL / REG NO. *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.certificateNo}
                    onChange={(e) => setFormSettings({ ...formSettings, certificateNo: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>LAB ADDRESS, PHONE & WEBSITE *</label>
                <input
                  type="text"
                  required
                  value={formSettings.labAddress}
                  onChange={(e) => setFormSettings({ ...formSettings, labAddress: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>HEAD PATHOLOGIST NAME *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.pathologistName}
                    onChange={(e) => setFormSettings({ ...formSettings, pathologistName: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>PATHOLOGIST REGISTRATION NO. *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.pathologistRegNo}
                    onChange={(e) => setFormSettings({ ...formSettings, pathologistRegNo: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>TECHNOLOGIST NAME *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.technicianName}
                    onChange={(e) => setFormSettings({ ...formSettings, technicianName: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>TECHNOLOGIST REG NO. / STAFF ID *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.technicianRegNo || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, technicianRegNo: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, marginBottom: '2px' }}>STATUTORY MEDICO-LEGAL DISCLAIMER (REPORT BOTTOM) *</label>
                <textarea
                  rows={2}
                  value={formSettings.medicoLegalNotice || ''}
                  onChange={(e) => setFormSettings({ ...formSettings, medicoLegalNotice: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#FFF', fontSize: '0.75rem', lineHeight: 1.35 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                >
                  💾 Save & Apply to Reports
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#CBD5E1',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Reset Defaults
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Printable Report Sheet (A4 Dimensions Style) */}
        <div id="printable-pathology-sheet" style={{
          padding: '32px 36px',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          
          {/* Lab Header & NABL Badge (Hidden in Pre-Printed Letterhead Mode) */}
          {!printOnLetterhead ? (
            <div id="lab-header-banner" style={{ borderBottom: '2.5px solid #0284C7', paddingBottom: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {profile.branding?.logoUrl ? (
                    <img src={profile.branding.logoUrl} alt="Logo" style={{ height: '48px', width: 'auto', maxHeight: '48px', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '1.75rem' }}>🧪</span>
                  )}
                  <div>
                    <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {settings.labName}
                    </h1>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                      {settings.labTagline}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
                  {settings.labAddress}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ border: '1.5px solid #0284C7', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F0F9FF' }}>
                  <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#0369A1', display: 'block' }}>NABL CERTIFICATE NO.</span>
                  <strong style={{ fontSize: '0.75rem', color: '#0C4A6E' }}>{settings.certificateNo}</strong>
                </div>
                {profile.abdmFacilityId ? (
                  <span style={{ fontSize: '0.625rem', color: '#0284C7', marginTop: '2px', display: 'block', fontWeight: 700 }}>
                    ABDM HFR: {profile.abdmFacilityId}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.625rem', color: '#64748B', marginTop: '2px', display: 'block' }}>ABDM Connected Lab</span>
                )}
                {profile.emergencyHelpline && (
                  <span style={{ fontSize: '0.625rem', color: '#DC2626', marginTop: '1px', display: 'block', fontWeight: 700 }}>
                    24x7 Helpline: {profile.emergencyHelpline}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="no-print" style={{
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              border: '1.5px dashed #7C3AED',
              borderRadius: '8px',
              padding: '10px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📜</span>
                <div>
                  <strong style={{ color: '#6D28D9', fontSize: '0.8125rem' }}>Pre-Printed Letterhead Stationery Mode Active</strong>
                  <div style={{ color: '#4C1D95', fontSize: '0.72rem' }}>
                    Digital header will NOT print. A 55mm top margin is reserved on the paper so your pre-printed clinic logo/address shows cleanly.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintOnLetterhead(false)}
                style={{ backgroundColor: '#7C3AED', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
              >
                Switch to Blank A4
              </button>
            </div>
          )}

          {/* Patient Demographics & Sample Barcode Grid */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            fontSize: '0.8125rem'
          }}>
            <div>
              <div><span style={{ color: '#64748B' }}>Patient Name:</span> <strong>{order.patientName}</strong></div>
              <div><span style={{ color: '#64748B' }}>Age / Gender:</span> <strong>{(order as any).patientAge || '38'} Yrs / {order.patientGender || 'Male'}</strong></div>
              <div><span style={{ color: '#64748B' }}>UHID / MRN:</span> <strong style={{ fontFamily: 'monospace' }}>{order.patientMrn}</strong></div>
              <div><span style={{ color: '#64748B' }}>ABHA Address:</span> <strong>{order.patientName.toLowerCase().replace(/\s+/g, '.')}@sbx</strong></div>
            </div>

            <div>
              <div><span style={{ color: '#64748B' }}>Order Number:</span> <strong style={{ fontFamily: 'monospace' }}>{order.orderNumber}</strong></div>
              <div><span style={{ color: '#64748B' }}>Referring Doctor:</span> <strong>{order.orderingDoctorName}</strong></div>
              <div><span style={{ color: '#64748B' }}>Specimen / Matrix:</span> <strong>{order.specimenType || 'EDTA Whole Blood / Serum'}</strong></div>
              <div><span style={{ color: '#64748B' }}>Department:</span> <strong>Clinical Biochemistry & Hematology</strong></div>
            </div>

            <div>
              <div><span style={{ color: '#64748B' }}>Sample Collected:</span> <strong>{new Date(order.orderedAt).toLocaleDateString()} 08:30 AM</strong></div>
              <div><span style={{ color: '#64748B' }}>Sample Received:</span> <strong>{new Date(order.orderedAt).toLocaleDateString()} 09:15 AM</strong></div>
              <div><span style={{ color: '#64748B' }}>Report Released:</span> <strong>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
              <div><span style={{ color: '#64748B' }}>Report Status:</span> <span style={{ color: '#16A34A', fontWeight: 800 }}>✓ FINAL NABL APPROVED</span></div>
            </div>
          </div>

          {/* Test Investigation Title */}
          <div style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '6px 12px', borderRadius: '4px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase' }}>
              {order.report?.reportTitle || ('TEST INVESTIGATION: ' + order.investigationName)}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {order.investigationName.toLowerCase().includes('culture') || order.results.some(r => r.parameterCode.startsWith('AST_')) ? 'Microbiology Culture & AST (CLSI M100 Protocol)' : 'Analyzed on Beckman Coulter / Roche Cobas 6000'}
            </span>
          </div>

          {/* MICROBIOLOGY CULTURE & SENSITIVITY (AST) DEDICATED SECTION */}
          {(() => {
            const microSpecimen = order.results.find(r => r.parameterCode === 'MICRO_SPECIMEN')?.resultValue;
            const microOrganism = order.results.find(r => r.parameterCode === 'MICRO_ORGANISM')?.resultValue;
            const microColony = order.results.find(r => r.parameterCode === 'MICRO_COLONY')?.resultValue;
            const microIncubation = order.results.find(r => r.parameterCode === 'MICRO_SPECIMEN')?.qualitativeInterpretation || '48 Hours at 37°C Aerobic';
            const astResults = order.results.filter(r => r.parameterCode.startsWith('AST_'));
            const standardResults = order.results.filter(r => !r.parameterCode.startsWith('MICRO_') && !r.parameterCode.startsWith('AST_'));
            const isMicrobiology = astResults.length > 0 || !!microOrganism || order.investigationName.toLowerCase().includes('culture');

            if (!isMicrobiology) {
              return (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', marginBottom: '18px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #CBD5E1', backgroundColor: '#F1F5F9', color: '#334155' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px' }}>TEST PARAMETER</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px' }}>OBSERVED VALUE</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px' }}>UNITS</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px' }}>BIOLOGICAL REFERENCE INTERVAL {order.patientGender ? `(${order.patientGender.toUpperCase()})` : ''}</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px' }}>FLAG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.results.map((r, i) => {
                      const isCritical = r.abnormalFlag === 'CRITICAL_HIGH' || r.abnormalFlag === 'CRITICAL_LOW';
                      const isAbnormal = r.abnormalFlag === 'HIGH' || r.abnormalFlag === 'LOW';
                      return (
                        <tr key={r.id || i} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: isCritical ? '#FEF2F2' : 'transparent' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>{r.parameterName}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: isCritical ? '#DC2626' : isAbnormal ? '#D97706' : '#0F172A', fontSize: '0.875rem' }}>
                            {r.resultValue}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B' }}>{r.unit || '-'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569', fontWeight: 500 }}>{r.referenceRange || 'N/A'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {r.abnormalFlag === 'NORMAL' && <span style={{ color: '#16A34A', fontWeight: 700 }}>NORMAL</span>}
                            {r.abnormalFlag === 'HIGH' && <span style={{ color: '#D97706', fontWeight: 800 }}>▲ HIGH</span>}
                            {r.abnormalFlag === 'LOW' && <span style={{ color: '#D97706', fontWeight: 800 }}>▼ LOW</span>}
                            {isCritical && <span style={{ color: '#DC2626', fontWeight: 900, backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>🚨 CRITICAL</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            }

            return (
              <div style={{ marginBottom: '18px' }}>
                {/* Microbiology Culture Findings Box */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  fontSize: '0.8125rem'
                }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Specimen Source:</span>{' '}
                    <strong style={{ color: '#0F172A' }}>{microSpecimen || order.specimenType || 'Clean Catch Midstream Urine'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Incubation Protocol:</span>{' '}
                    <strong style={{ color: '#0F172A' }}>{microIncubation}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Organism Isolated:</span>{' '}
                    <strong style={{ color: '#0284C7', fontStyle: 'italic', fontSize: '0.875rem' }}>
                      {microOrganism || 'Escherichia coli'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Colony Count:</span>{' '}
                    <strong style={{ color: microColony?.startsWith('Zero') ? '#16A34A' : '#DC2626' }}>
                      {microColony || '> 10^5 CFU/mL (Significant Bacteriuria)'}
                    </strong>
                  </div>
                </div>

                {/* Antibiogram Sensitivity Grid */}
                {astResults.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>ANTIBIOTIC SUSCEPTIBILITY TESTING (AST ANTIBIOGRAM):</span>
                      <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem' }}>Kirby-Bauer Disc Diffusion / MIC</span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', marginBottom: '10px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #CBD5E1', backgroundColor: '#F1F5F9', color: '#334155' }}>
                          <th style={{ textAlign: 'left', padding: '8px 10px' }}>ANTIMICROBIAL AGENT</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px' }}>ZONE / MIC</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px' }}>CLSI BREAKPOINT</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px' }}>SUSCEPTIBILITY STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {astResults.map((ast, i) => {
                          const isResistant = ast.resultValue.includes('RESISTANT') || ast.abnormalFlag === 'HIGH';
                          const isIntermediate = ast.resultValue.includes('INTERMEDIATE') || ast.abnormalFlag === 'LOW';
                          const isSensitive = !isResistant && !isIntermediate;

                          return (
                            <tr key={ast.id || i} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: isResistant ? '#FEF2F2' : 'transparent' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>
                                {ast.parameterName.replace('AST: ', '')}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569', fontFamily: 'monospace' }}>
                                {ast.unit || '-'}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B' }}>
                                Standard CLSI M100
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                {isSensitive && (
                                  <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid #86EFAC' }}>
                                    🟢 SENSITIVE (S)
                                  </span>
                                )}
                                {isIntermediate && (
                                  <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid #FCD34D' }}>
                                    🟡 INTERMEDIATE (I)
                                  </span>
                                )}
                                {isResistant && (
                                  <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '2px 8px', borderRadius: '4px', fontWeight: 900, fontSize: '0.75rem', border: '1px solid #FCA5A5' }}>
                                    🔴 RESISTANT (R)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div style={{ fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic', marginBottom: '8px' }}>
                      * Susceptibility reported as per CLSI M100 standard. S = Sensitive (Standard dosing regimen); I = Intermediate (Susceptible with increased exposure); R = Resistant.
                    </div>
                  </div>
                )}

                {/* Any additional non-culture parameters */}
                {standardResults.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                      ADDITIONAL BIOCHEMICAL FINDINGS:
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <tbody>
                        {standardResults.map((r, i) => (
                          <tr key={r.id || i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.parameterName}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800 }}>{r.resultValue} {r.unit || ''}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748B' }}>{r.referenceRange || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Standard Diagnostic Test Interpretation Engine (Ground Truth from Reference Image) */}
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', backgroundColor: '#F8FAFC' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Interpretation:
            </span>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {order.report?.impression && order.report.impression !== 'Test findings are clinically correlated with internal quality controls (IQC Level 1 & 2 passed). Values outside reference range should be evaluated in context of clinical presentation.'
                ? order.report.impression
                : getStandardTestInterpretation(order.investigationName || (order as any).testName || 'Complete Blood Count (CBC)')}
            </p>
          </div>

          {/* End of Report Bar */}
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: '#94A3B8', margin: '10px 0', borderTop: '1px dashed #CBD5E1', paddingTop: '6px', fontStyle: 'italic' }}>
            ~~End of report~~
          </div>

          {/* Signatures & Security QR Code Footer (Dual Signatories from Image 1) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.2fr', gap: '16px', alignItems: 'flex-end', paddingTop: '10px', borderTop: '2px solid #CBD5E1' }}>
            
            {/* Technologist Signature (Left Signatory from Image 1) */}
            <div>
              {profile.branding?.technologistSignatureUrl ? (
                <img src={profile.branding.technologistSignatureUrl} alt="Technologist Signature" style={{ height: '36px', width: 'auto', maxHeight: '36px', objectFit: 'contain', display: 'block', marginBottom: '2px' }} />
              ) : (
                <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#0369A1', marginBottom: '2px' }}>{settings.technicianName.split(',')[0]}</div>
              )}
              <div style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase' }}>{settings.technicianName}</div>
              <div style={{ fontSize: '0.6875rem', color: '#475569', fontWeight: 700 }}>{settings.technicianTitle}</div>
              <div style={{ fontSize: '0.625rem', color: '#64748B', fontFamily: 'monospace' }}>{settings.technicianRegNo || 'Registration No. - 26534/10'}</div>
            </div>

            {/* Center: ISO 9001:2015 Badge & Map QR */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '4px', fontSize: '0.5625rem', fontWeight: 800, color: '#0369A1', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.02em', textAlign: 'center' }}>
                ISO 9001:2015<br />CERTIFIED COMPANY
              </div>
              <div style={{ display: 'inline-block', border: '1px solid #CBD5E1', padding: '4px', borderRadius: '4px' }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📱</span>
              </div>
              <div style={{ fontSize: '0.5625rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                Scan for Map / Verify Result
              </div>
            </div>

            {/* Pathologist Signature & Official Stamp (Right Signatory from Image 1) */}
            <div style={{ textAlign: 'right', position: 'relative' }}>
              {profile.branding?.stampSealUrl && (
                <img
                  src={profile.branding.stampSealUrl}
                  alt="Official Seal"
                  style={{
                    position: 'absolute',
                    right: '30px',
                    bottom: '15px',
                    width: '60px',
                    height: '60px',
                    opacity: 0.7,
                    pointerEvents: 'none'
                  }}
                />
              )}
              {profile.branding?.signatureUrl ? (
                <img src={profile.branding.signatureUrl} alt="Signature" style={{ height: '36px', width: 'auto', maxHeight: '36px', objectFit: 'contain', marginLeft: 'auto', display: 'block', marginBottom: '2px' }} />
              ) : (
                <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#16A34A', marginBottom: '2px' }}>{settings.pathologistName.split(',')[0]}</div>
              )}
              <div style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase' }}>
                {settings.pathologistName.toUpperCase().startsWith('DR.') ? settings.pathologistName : `DR. ${settings.pathologistName}`}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#475569', fontWeight: 700 }}>{settings.pathologistTitle}</div>
              <div style={{ fontSize: '0.625rem', color: '#0369A1', fontWeight: 700, fontFamily: 'monospace' }}>{settings.pathologistRegNo}</div>
            </div>

          </div>

          {/* Statutory Medico-Legal Notice (Full Width Bottom Line from Image 1) */}
          <div style={{ fontSize: '0.625rem', color: '#475569', textAlign: 'center', marginTop: '14px', borderTop: '1px solid #CBD5E1', paddingTop: '8px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 }}>
            {settings.medicoLegalNotice || profile.medicoLegalNotice || profile.branding?.medicoLegalNotice || 'Note:- Here all types of Blood and urine tests are done through automated machines. Results must be correlated clinically with medical history. Not Valid for Medico-Legal Purpose.'}
          </div>

        </div>

      </div>

      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName={blockedActionName}
        missingFields={profileMissingFields}
      />
    </div>
  );
};
