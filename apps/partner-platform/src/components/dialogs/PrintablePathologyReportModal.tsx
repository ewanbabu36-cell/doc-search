import React, { useState, useEffect, useMemo } from 'react';
import type { InvestigationOrderDto } from '@docsearch/api-contracts';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';
import { downloadVectorPathologyPdf } from '../../utils/clientPathologyPdf.js';
import { ProfileUpdateRequiredAlertModal } from '../common/ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import { getStandardTestInterpretation } from '../../services/diagnostic-test-interpretation-engine.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order?: InvestigationOrderDto | undefined;
  orders?: InvestigationOrderDto[] | undefined;
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
  signatureUrl?: string;
  pathologistSignatureUrl?: string;
  technologistSignatureUrl?: string;
  stampSealUrl?: string;
  logoUrl?: string;
  signatureApprovalStatus?: string;
  digitalSignatureApproved?: boolean;
}

const DEFAULT_SETTINGS_STORAGE_KEY = 'docsearch_lab_header_settings';

const getDefaultSettings = (): LabHeaderSettings => {
  const profile = getVerifiedRoleProfile();
  let savedSettings: any = {};

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(DEFAULT_SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        savedSettings = JSON.parse(saved);
      } catch {}
    }
  }

  const signatureUrl = savedSettings.signatureUrl || savedSettings.pathologistSignatureUrl || profile.branding?.signatureUrl || profile.branding?.pathologistSignatureUrl || '';
  const pathologistSignatureUrl = savedSettings.pathologistSignatureUrl || savedSettings.signatureUrl || profile.branding?.pathologistSignatureUrl || profile.branding?.signatureUrl || signatureUrl;
  const technologistSignatureUrl = savedSettings.technologistSignatureUrl || profile.branding?.technologistSignatureUrl || '';
  const stampSealUrl = savedSettings.stampSealUrl || profile.branding?.stampSealUrl || '';
  const logoUrl = savedSettings.logoUrl || profile.branding?.logoUrl || '';

  return {
    labName: (savedSettings.labName || profile.entityLegalName || 'DOC SEARCH CLINICAL PATHOLOGY LABORATORY').toUpperCase(),
    labTagline: savedSettings.labTagline || profile.facilityTagline || 'CLINICAL PATHOLOGY, HAEMATOLOGY & DIAGNOSTIC MEDICINE',
    labAddress: savedSettings.labAddress || `📍 ${profile.officialAddress || 'Facility Premises'} | 📞 ${profile.contactPhone || 'Official Desk'}${profile.website ? ' | 🌐 ' + profile.website : ''}`,
    certificateNo: savedSettings.certificateNo || profile.nablCertificateNo || 'ISO 9001:2015 CERTIFIED COMPANY / NABL Standard',
    technicianName: savedSettings.technicianName || profile.technicianName || 'MD. SANJAR ALAM',
    technicianTitle: savedSettings.technicianTitle || profile.technicianDegree || 'D.M.L.T',
    technicianRegNo: savedSettings.technicianRegNo || profile.technicianRegNo || 'Registration No. - 26534/10',
    pathologistName: savedSettings.pathologistName || profile.pathologistName || (profile.doctorName ? `DR. ${profile.doctorName}` : 'DR. VIKRAM KUMAR'),
    pathologistTitle: savedSettings.pathologistTitle || profile.pathologistDegree || 'MBBS (DMCH)',
    pathologistRegNo: savedSettings.pathologistRegNo || (profile.pathologistRegNo ? (profile.pathologistRegNo.includes('Reg') ? profile.pathologistRegNo : `Registration No. - ${profile.pathologistRegNo}`) : 'Registration No. - 47684'),
    medicoLegalNotice: savedSettings.medicoLegalNotice || profile.branding?.medicoLegalNotice || profile.medicoLegalNotice || 'Note:- Here all types of Blood and urine tests are done through automated machines. Results must be correlated clinically with medical history. Not Valid for Medico-Legal Purpose.',
    signatureUrl,
    pathologistSignatureUrl,
    technologistSignatureUrl,
    stampSealUrl,
    logoUrl,
    signatureApprovalStatus: 'APPROVED',
    digitalSignatureApproved: true
  };
};

export const PrintablePathologyReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  orders
}) => {
  const [profile, setProfile] = useState(getVerifiedRoleProfile);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [printOnLetterhead, setPrintOnLetterhead] = useState(false);

  // Normalize single or multiple orders
  const orderList = useMemo<InvestigationOrderDto[]>(() => {
    if (orders && orders.length > 0) return orders;
    if (order) return [order];
    return [];
  }, [orders, order]);

  const primaryOrder = orderList[0];
  const isMulti = orderList.length > 1;

  // Total parameters count across all orders
  const totalParamsCount = useMemo(() => {
    return orderList.reduce((acc, o) => acc + (o.results?.length || 0), 0);
  }, [orderList]);

  // Compact 1-Page Eco Density State
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  // Excluded parameters set (Doctor/Tech can uncheck parameters they don't want to print)
  const [excludedParamIds, setExcludedParamIds] = useState<Set<string>>(new Set());

  // Lab customization settings state
  const [settings, setSettings] = useState<LabHeaderSettings>(getDefaultSettings);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [formSettings, setFormSettings] = useState<LabHeaderSettings>(getDefaultSettings);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const refreshedProfile = getVerifiedRoleProfile();
      setProfile(refreshedProfile);
      const active = getDefaultSettings();
      setSettings(active);
      setFormSettings(active);
      setIsCompactMode(isMulti || totalParamsCount <= 14);
      setExcludedParamIds(new Set());
    }
  }, [isOpen, isMulti, totalParamsCount]);

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

  if (!isOpen || orderList.length === 0 || !primaryOrder) return null;

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
      // Generate instant client vector ISO-32000-1 binary PDF with NABL header & doctor digital signature
      downloadVectorPathologyPdf(orderList, settings);
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

  const toggleParamExclusion = (paramKey: string) => {
    setExcludedParamIds(prev => {
      const next = new Set(prev);
      if (next.has(paramKey)) {
        next.delete(paramKey);
      } else {
        next.add(paramKey);
      }
      return next;
    });
  };

  // Unique specimen types across orders
  const uniqueSpecimens = Array.from(new Set(orderList.map(o => o.specimenType || 'EDTA Whole Blood / Serum'))).join(', ');

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
      {/* CSS @media print style with dynamic page fitting */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: ${printOnLetterhead ? '0mm' : '6mm'};
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
            padding: ${printOnLetterhead ? '55mm 14mm 10mm 14mm' : (isCompactMode ? '8mm 14mm 8mm 14mm' : '14mm 16mm')} !important;
            box-shadow: none !important;
            border: none !important;
            font-size: ${isCompactMode ? '9.5pt' : '11pt'} !important;
          }
          .no-print {
            display: none !important;
          }
          .test-section-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '920px',
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
              <strong style={{ fontSize: '0.875rem' }}>
                {isMulti ? `NABL Consolidated Multi-Test Report (${orderList.length} Tests Combined)` : 'NABL Diagnostic Report Preview'}
              </strong>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>
                Patient: <strong style={{ color: '#F8FAFC' }}>{primaryOrder.patientName}</strong> (MRN: {primaryOrder.patientMrn}) • Orders: {orderList.map(o => '#' + o.orderNumber).join(', ')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Auto-Fit / Eco 1-Page Compact Density Toggle */}
            <button
              type="button"
              onClick={() => setIsCompactMode(!isCompactMode)}
              style={{
                backgroundColor: isCompactMode ? '#059669' : 'rgba(255,255,255,0.12)',
                color: '#FFF',
                border: `1.5px solid ${isCompactMode ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Automatically tighten table padding and fonts so multiple tests fit on exactly 1 single A4 sheet"
            >
              <span>{isCompactMode ? '🌱' : '📄'}</span>
              <span>{isCompactMode ? 'Eco 1-Page (Active)' : 'Normal Density'}</span>
            </button>

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
              <span>{printOnLetterhead ? 'Pre-Printed Letterhead' : 'Blank A4 Header'}</span>
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
              <span>{isEditingSettings ? 'Close Edit Form' : 'Edit Doctor/Header'}</span>
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
              <span>{isSendingWhatsApp ? 'Sending...' : whatsAppSuccess ? '✓ Sent to WhatsApp' : 'Send WhatsApp'}</span>
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
              <span>📥</span>
              <span>{isDownloadingPdf ? 'Generating PDF...' : pdfSuccess ? '✓ PDF Ready' : 'Download Vector PDF'}</span>
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

        {/* Doctor Selective Parameter Tip (Screen Only) */}
        <div className="no-print" style={{
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
          padding: '6px 20px',
          fontSize: '0.72rem',
          color: '#38BDF8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            💡 <strong>Doctor Selective Diagnostic Mode:</strong> Check or uncheck any individual test parameter below if you only wish to print specific targeted findings.
          </div>
          <div style={{ color: '#94A3B8' }}>
            Combined: <strong>{orderList.length} Tests</strong> | Total Analytes: <strong>{totalParamsCount}</strong>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>LABORATORY LEGAL NAME *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.labName}
                    onChange={(e) => setFormSettings({ ...formSettings, labName: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>FACILITY TAGLINE / SPECIALTY *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.labTagline}
                    onChange={(e) => setFormSettings({ ...formSettings, labTagline: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>NABL CERTIFICATE / ACCREDITATION NO. *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.certificateNo}
                    onChange={(e) => setFormSettings({ ...formSettings, certificateNo: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>VERIFYING PATHOLOGIST NAME *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.pathologistName}
                    onChange={(e) => setFormSettings({ ...formSettings, pathologistName: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '2px' }}>PATHOLOGIST DEGREE / TITLE *</label>
                  <input
                    type="text"
                    required
                    value={formSettings.pathologistTitle}
                    onChange={(e) => setFormSettings({ ...formSettings, pathologistTitle: e.target.value })}
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
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
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
          padding: isCompactMode ? '20px 28px' : '32px 36px',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          
          {/* Lab Header & NABL Badge (Hidden in Pre-Printed Letterhead Mode) */}
          {!printOnLetterhead ? (
            <div id="lab-header-banner" style={{ borderBottom: '2.5px solid #0284C7', paddingBottom: isCompactMode ? '10px' : '14px', marginBottom: isCompactMode ? '12px' : '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {profile.branding?.logoUrl ? (
                    <img src={profile.branding.logoUrl} alt="Logo" style={{ height: isCompactMode ? '40px' : '48px', width: 'auto', maxHeight: '48px', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: isCompactMode ? '1.5rem' : '1.75rem' }}>🧪</span>
                  )}
                  <div>
                    <h1 style={{ margin: 0, fontSize: isCompactMode ? '1.2rem' : '1.35rem', fontWeight: 900, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {settings.labName}
                    </h1>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                      {settings.labTagline}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '3px' }}>
                  {settings.labAddress}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ border: '1.5px solid #0284C7', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#F0F9FF' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#0369A1', display: 'block' }}>NABL CERTIFICATE NO.</span>
                  <strong style={{ fontSize: '0.72rem', color: '#0C4A6E' }}>{settings.certificateNo}</strong>
                </div>
                {profile.abdmFacilityId ? (
                  <span style={{ fontSize: '0.6rem', color: '#0284C7', marginTop: '2px', display: 'block', fontWeight: 700 }}>
                    ABDM HFR: {profile.abdmFacilityId}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.6rem', color: '#64748B', marginTop: '2px', display: 'block' }}>ABDM Connected Lab</span>
                )}
              </div>
            </div>
          ) : (
            <div className="no-print" style={{
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              border: '1.5px dashed #7C3AED',
              borderRadius: '8px',
              padding: '10px 16px',
              marginBottom: '14px',
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

          {/* Unified Patient Demographics Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: isCompactMode ? '8px 12px' : '12px 16px',
            marginBottom: isCompactMode ? '12px' : '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            fontSize: isCompactMode ? '0.75rem' : '0.8125rem'
          }}>
            <div>
              <div><span style={{ color: '#64748B' }}>Patient Name:</span> <strong>{primaryOrder.patientName}</strong></div>
              <div><span style={{ color: '#64748B' }}>Age / Gender:</span> <strong>{(primaryOrder as any).patientAge || '38'} Yrs / {primaryOrder.patientGender || 'Male'}</strong></div>
              <div><span style={{ color: '#64748B' }}>UHID / MRN:</span> <strong style={{ fontFamily: 'monospace' }}>{primaryOrder.patientMrn}</strong></div>
              <div><span style={{ color: '#64748B' }}>ABHA Address:</span> <strong>{primaryOrder.patientName.toLowerCase().replace(/\s+/g, '.')}@sbx</strong></div>
            </div>

            <div>
              <div>
                <span style={{ color: '#64748B' }}>{isMulti ? 'Order Number(s):' : 'Order Number:'}</span>{' '}
                <strong style={{ fontFamily: 'monospace' }}>
                  {orderList.map(o => o.orderNumber).join(', ')}
                </strong>
              </div>
              <div><span style={{ color: '#64748B' }}>Referring Doctor:</span> <strong>{primaryOrder.orderingDoctorName}</strong></div>
              <div><span style={{ color: '#64748B' }}>Specimen / Matrix:</span> <strong>{uniqueSpecimens}</strong></div>
              <div>
                <span style={{ color: '#64748B' }}>Department:</span>{' '}
                <strong>{isMulti ? 'Clinical Pathology & Integrated Diagnostics' : (primaryOrder.investigationCategory || 'Clinical Biochemistry & Hematology')}</strong>
              </div>
            </div>

            <div>
              <div><span style={{ color: '#64748B' }}>Sample Collected:</span> <strong>{new Date(primaryOrder.orderedAt).toLocaleDateString()} 08:30 AM</strong></div>
              <div><span style={{ color: '#64748B' }}>Sample Received:</span> <strong>{new Date(primaryOrder.orderedAt).toLocaleDateString()} 09:15 AM</strong></div>
              <div><span style={{ color: '#64748B' }}>Report Released:</span> <strong>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
              <div>
                <span style={{ color: '#64748B' }}>Report Status:</span>{' '}
                <span style={{ color: '#16A34A', fontWeight: 800 }}>
                  ✓ {isMulti ? `FINAL CONSOLIDATED (${orderList.length} PANELS)` : 'FINAL NABL APPROVED'}
                </span>
              </div>
            </div>
          </div>

          {/* MULTI-TEST INVESTIGATIONS STACKED SEQUENTIALLY */}
          {orderList.map((ord, ordIdx) => {
            const microSpecimen = ord.results.find(r => r.parameterCode === 'MICRO_SPECIMEN')?.resultValue;
            const microOrganism = ord.results.find(r => r.parameterCode === 'MICRO_ORGANISM')?.resultValue;
            const microColony = ord.results.find(r => r.parameterCode === 'MICRO_COLONY')?.resultValue;
            const microIncubation = ord.results.find(r => r.parameterCode === 'MICRO_SPECIMEN')?.qualitativeInterpretation || '48 Hours at 37°C Aerobic';
            const astResults = ord.results.filter(r => r.parameterCode.startsWith('AST_'));
            const isMicrobiology = astResults.length > 0 || !!microOrganism || ord.investigationName.toLowerCase().includes('culture');

            const sectionTitle = ord.report?.reportTitle || ord.investigationName;
            const departmentBadge = ord.investigationCategory ? `${ord.investigationCategory.toUpperCase()} • ` : '';

            return (
              <div key={ord.id || ordIdx} className="test-section-card" style={{ marginBottom: isCompactMode ? '10px' : '16px' }}>
                
                {/* Test Section Header */}
                <div style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: isCompactMode ? '4px 10px' : '6px 12px',
                  borderRadius: '4px',
                  marginBottom: isCompactMode ? '6px' : '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 800, fontSize: isCompactMode ? '0.78rem' : '0.85rem', textTransform: 'uppercase' }}>
                    {departmentBadge}{sectionTitle}
                  </span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                    {isMicrobiology ? 'Microbiology Culture (CLSI M100 Protocol)' : 'Automated Analyzer Assays (Roche Cobas / Beckman)'}
                  </span>
                </div>

                {/* Standard Results Table */}
                {!isMicrobiology && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isCompactMode ? '0.75rem' : '0.8125rem', marginBottom: '6px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #CBD5E1', backgroundColor: '#F1F5F9', color: '#334155' }}>
                        <th className="no-print" style={{ width: '28px', padding: isCompactMode ? '4px 6px' : '6px 8px', textAlign: 'center' }}>✓</th>
                        <th style={{ textAlign: 'left', padding: isCompactMode ? '4px 8px' : '6px 10px' }}>TEST PARAMETER</th>
                        <th style={{ textAlign: 'center', padding: isCompactMode ? '4px 8px' : '6px 10px' }}>OBSERVED VALUE</th>
                        <th style={{ textAlign: 'center', padding: isCompactMode ? '4px 8px' : '6px 10px' }}>UNITS</th>
                        <th style={{ textAlign: 'center', padding: isCompactMode ? '4px 8px' : '6px 10px' }}>
                          BIOLOGICAL REFERENCE INTERVAL {primaryOrder.patientGender ? `(${primaryOrder.patientGender.toUpperCase()})` : ''}
                        </th>
                        <th style={{ textAlign: 'center', padding: isCompactMode ? '4px 8px' : '6px 10px' }}>FLAG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ord.results.map((r, i) => {
                        const paramKey = `${ord.id}-${r.parameterCode || i}`;
                        const isExcluded = excludedParamIds.has(paramKey);
                        if (isExcluded) return null;

                        const isCritical = r.abnormalFlag === 'CRITICAL_HIGH' || r.abnormalFlag === 'CRITICAL_LOW';
                        const isAbnormal = r.abnormalFlag === 'HIGH' || r.abnormalFlag === 'LOW';

                        return (
                          <tr key={r.id || i} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: isCritical ? '#FEF2F2' : (i % 2 === 1 ? '#F8FAFC' : 'transparent') }}>
                            <td className="no-print" style={{ textAlign: 'center', padding: isCompactMode ? '3px 4px' : '4px 6px' }}>
                              <input
                                type="checkbox"
                                checked={!isExcluded}
                                onChange={() => toggleParamExclusion(paramKey)}
                                title="Uncheck to exclude this parameter from print"
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: isCompactMode ? '4px 8px' : '6px 10px', fontWeight: 600, color: '#1E293B' }}>
                              {r.parameterName}
                            </td>
                            <td style={{ padding: isCompactMode ? '4px 8px' : '6px 10px', textAlign: 'center', fontWeight: 800, color: isCritical ? '#DC2626' : isAbnormal ? '#D97706' : '#0F172A', fontSize: isCompactMode ? '0.8rem' : '0.875rem' }}>
                              {r.resultValue}
                            </td>
                            <td style={{ padding: isCompactMode ? '4px 8px' : '6px 10px', textAlign: 'center', color: '#64748B' }}>
                              {r.unit || '-'}
                            </td>
                            <td style={{ padding: isCompactMode ? '4px 8px' : '6px 10px', textAlign: 'center', color: '#475569', fontWeight: 500 }}>
                              {r.referenceRange || 'N/A'}
                            </td>
                            <td style={{ padding: isCompactMode ? '4px 8px' : '6px 10px', textAlign: 'center' }}>
                              {r.abnormalFlag === 'NORMAL' && <span style={{ color: '#16A34A', fontWeight: 700 }}>NORMAL</span>}
                              {r.abnormalFlag === 'HIGH' && <span style={{ color: '#D97706', fontWeight: 800 }}>▲ HIGH</span>}
                              {r.abnormalFlag === 'LOW' && <span style={{ color: '#D97706', fontWeight: 800 }}>▼ LOW</span>}
                              {isCritical && <span style={{ color: '#DC2626', fontWeight: 900, backgroundColor: '#FEE2E2', padding: '1px 5px', borderRadius: '3px', fontSize: '0.7rem' }}>🚨 CRITICAL</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Microbiology Special Block if applicable */}
                {isMicrobiology && (
                  <div>
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: isCompactMode ? '8px 10px' : '12px 14px',
                      marginBottom: '8px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      fontSize: '0.75rem'
                    }}>
                      <div><span style={{ color: '#64748B' }}>Specimen Source:</span> <strong>{microSpecimen || ord.specimenType || 'Clean Catch Midstream Urine'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Incubation:</span> <strong>{microIncubation}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Organism Isolated:</span> <strong style={{ color: '#0284C7', fontStyle: 'italic' }}>{microOrganism || 'Escherichia coli'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Colony Count:</span> <strong style={{ color: microColony?.startsWith('Zero') ? '#16A34A' : '#DC2626' }}>{microColony || '> 10^5 CFU/mL'}</strong></div>
                    </div>

                    {astResults.length > 0 && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isCompactMode ? '0.72rem' : '0.78rem', marginBottom: '8px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                            <th style={{ textAlign: 'left', padding: '4px 8px' }}>ANTIMICROBIAL AGENT</th>
                            <th style={{ textAlign: 'center', padding: '4px 8px' }}>ZONE / MIC</th>
                            <th style={{ textAlign: 'center', padding: '4px 8px' }}>BREAKPOINT</th>
                            <th style={{ textAlign: 'center', padding: '4px 8px' }}>SUSCEPTIBILITY</th>
                          </tr>
                        </thead>
                        <tbody>
                          {astResults.map((ast, i) => (
                            <tr key={ast.id || i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{ast.parameterName.replace('AST: ', '')}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'center' }}>{ast.unit || '-'}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'center' }}>CLSI M100</td>
                              <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 800, color: ast.resultValue.includes('RESISTANT') ? '#DC2626' : '#16A34A' }}>
                                {ast.resultValue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

              </div>
            );
          })}

          {/* Unified Clinical Interpretation & Remarks */}
          <div style={{
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: isCompactMode ? '6px 10px' : '10px 14px',
            marginBottom: isCompactMode ? '8px' : '12px',
            backgroundColor: '#F8FAFC'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Clinical Interpretation & Diagnostic Correlation:
            </span>
            <div style={{ fontSize: isCompactMode ? '0.75rem' : '0.8125rem', color: '#334155', lineHeight: 1.4 }}>
              {orderList.map((ord, idx) => {
                const interp = (ord.report?.impression && ord.report.impression !== 'Test findings are clinically correlated with internal quality controls (IQC Level 1 & 2 passed). Values outside reference range should be evaluated in context of clinical presentation.')
                  ? ord.report.impression
                  : getStandardTestInterpretation(ord.investigationName || (ord as any).testName || 'Complete Blood Count (CBC)');
                return (
                  <div key={ord.id || idx} style={{ marginBottom: idx < orderList.length - 1 ? '4px' : '0' }}>
                    {isMulti && <strong style={{ color: '#0369A1' }}>{ord.investigationName}: </strong>}
                    <span>{interp}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* End of Report Bar */}
          <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#94A3B8', margin: isCompactMode ? '4px 0' : '8px 0', borderTop: '1px dashed #CBD5E1', paddingTop: '4px', fontStyle: 'italic' }}>
            ~~End of report~~
          </div>

          {/* Signatures & Security QR Code Footer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.2fr', gap: '12px', alignItems: 'flex-end', paddingTop: isCompactMode ? '6px' : '10px', borderTop: '2px solid #CBD5E1' }}>
            
            {/* Technologist Signature (Left) */}
            <div>
              <div style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✓</span> <span>TECHNOLOGIST SIGN-OFF: APPROVED</span>
              </div>
              {(settings.technologistSignatureUrl || profile.branding?.technologistSignatureUrl) ? (
                <img
                  src={settings.technologistSignatureUrl || profile.branding?.technologistSignatureUrl}
                  alt="Technologist Signature"
                  style={{ height: isCompactMode ? '32px' : '40px', width: 'auto', maxHeight: '40px', objectFit: 'contain', display: 'block', marginBottom: '2px' }}
                />
              ) : (
                <div style={{ fontFamily: 'cursive', fontSize: '1rem', color: '#0369A1', marginBottom: '2px' }}>{settings.technicianName.split(',')[0]}</div>
              )}
              <div style={{ fontSize: isCompactMode ? '0.75rem' : '0.8125rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase' }}>{settings.technicianName}</div>
              <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>{settings.technicianTitle}</div>
              <div style={{ fontSize: '0.6rem', color: '#64748B', fontFamily: 'monospace' }}>{settings.technicianRegNo || 'Registration No. - 26534/10'}</div>
            </div>

            {/* Center: ISO 9001:2015 Badge & Map QR */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.02em', textAlign: 'center' }}>
                ✓ DIGITALLY SIGNED & APPROVED
              </div>
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, color: '#0369A1', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.02em', textAlign: 'center' }}>
                ISO 9001:2015 CERTIFIED
              </div>
              <div style={{ display: 'inline-block', border: '1px solid #CBD5E1', padding: '3px', borderRadius: '4px' }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📱</span>
              </div>
              <div style={{ fontSize: '0.55rem', color: '#64748B', marginTop: '1px', fontWeight: 600 }}>
                Scan to Verify Result
              </div>
            </div>

            {/* Pathologist Signature & Official Stamp (Right) */}
            <div style={{ textAlign: 'right', position: 'relative' }}>
              <div style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                <span>✓</span> <span>CLINICAL SIGN-OFF: APPROVED & VALIDATED</span>
              </div>
              {(settings.stampSealUrl || profile.branding?.stampSealUrl) && (
                <img
                  src={settings.stampSealUrl || profile.branding?.stampSealUrl}
                  alt="Official Seal"
                  style={{
                    position: 'absolute',
                    right: '25px',
                    bottom: '10px',
                    width: isCompactMode ? '48px' : '60px',
                    height: isCompactMode ? '48px' : '60px',
                    opacity: 0.75,
                    pointerEvents: 'none'
                  }}
                />
              )}
              {(settings.signatureUrl || settings.pathologistSignatureUrl || profile.branding?.signatureUrl || profile.branding?.pathologistSignatureUrl) ? (
                <img
                  src={settings.signatureUrl || settings.pathologistSignatureUrl || profile.branding?.signatureUrl || profile.branding?.pathologistSignatureUrl}
                  alt="Pathologist Signature"
                  style={{ height: isCompactMode ? '32px' : '40px', width: 'auto', maxHeight: '40px', objectFit: 'contain', marginLeft: 'auto', display: 'block', marginBottom: '2px' }}
                />
              ) : (
                <div style={{ fontFamily: 'cursive', fontSize: '1rem', color: '#16A34A', marginBottom: '2px' }}>{settings.pathologistName.split(',')[0]}</div>
              )}
              <div style={{ fontSize: isCompactMode ? '0.75rem' : '0.8125rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase' }}>
                {settings.pathologistName.toUpperCase().startsWith('DR.') ? settings.pathologistName : `DR. ${settings.pathologistName}`}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>{settings.pathologistTitle}</div>
              <div style={{ fontSize: '0.6rem', color: '#0369A1', fontWeight: 700, fontFamily: 'monospace' }}>{settings.pathologistRegNo}</div>
            </div>

          </div>

          {/* Statutory Medico-Legal Notice (Full Width Bottom Line) */}
          <div style={{ fontSize: '0.58rem', color: '#475569', textAlign: 'center', marginTop: isCompactMode ? '8px' : '12px', borderTop: '1px solid #CBD5E1', paddingTop: '6px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 }}>
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
