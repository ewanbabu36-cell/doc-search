import React, { useState, useEffect } from 'react';

export interface UniversalAccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    role?: string;
    roleTitle?: string;
    department?: string;
    tenantName?: string;
    organizationType?: string;
  } | undefined;
  onSettingsSaved?: ((data: any) => void) | undefined;
}

export type ApprovalStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export type RoleCategory =
  | 'DOCTOR'
  | 'PATHOLOGY_LAB'
  | 'HOSPITAL'
  | 'PHARMACY'
  | 'STAFF_OPERATIONS'
  | 'COMPANY_HQ';

export const getRoleCategory = (user?: { role?: string; department?: string; organizationType?: string; email?: string }): RoleCategory => {
  if (!user) return 'DOCTOR';
  const role = (user.role || '').toUpperCase();
  const org = (user.organizationType || '').toUpperCase();
  const dept = (user.department || '').toUpperCase();
  const email = (user.email || '').toLowerCase();

  if (role.includes('SUPER_ADMIN') || role.includes('COMPANY') || email.includes('docsearch.health') || role.includes('FOUNDER') || role.includes('CEO') || role.includes('COMPLIANCE')) {
    return 'COMPANY_HQ';
  }
  if (role.includes('PATHOLOGIST') || org === 'PATHOLOGY' || org === 'DIAGNOSTIC_CENTRE' || dept.includes('PATHOLOGY') || email.includes('tata')) {
    return 'PATHOLOGY_LAB';
  }
  if (role.includes('PHARMACIST') || org === 'PHARMACY' || dept.includes('PHARMACY')) {
    return 'PHARMACY';
  }
  if (role.includes('DOCTOR') || role.includes('SURGEON') || role.includes('PHYSICIAN') || role.includes('RADIOLOGIST') || role.includes('PEDIATRICIAN') || role.includes('CONSULTANT')) {
    return 'DOCTOR';
  }
  if (role.includes('HOSPITAL_ADMIN') || role.includes('DIRECTOR') || role.includes('ORGANIZATION_ADMIN') || org === 'HOSPITAL' || org === 'CLINIC') {
    return 'HOSPITAL';
  }
  return 'STAFF_OPERATIONS';
};

export const UniversalAccountSettingsModal: React.FC<UniversalAccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSettingsSaved
}) => {
  const [activeTab, setActiveTab] = useState<'BANK' | 'ADDRESS' | 'CERTIFICATES' | 'PASSWORD'>('BANK');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleCategory = getRoleCategory(currentUser);
  const isCompanyAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'COMPANY_ADMIN' || currentUser?.role === 'COMPLIANCE_OFFICER';

  // Storage key specific to user
  const userKey = currentUser?.email || 'default_user';
  const storageKey = `docsearch_account_settings_${userKey}`;

  // Approval Status state
  const [bankApprovalStatus, setBankApprovalStatus] = useState<ApprovalStatus>('APPROVED');
  const [addressApprovalStatus, setAddressApprovalStatus] = useState<ApprovalStatus>('APPROVED');
  const [certApprovalStatus, setCertApprovalStatus] = useState<ApprovalStatus>('APPROVED');
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);

  // Bank Form State
  const [bankData, setBankData] = useState({
    accountHolderName: currentUser?.name || 'Tata Pathology Healthcare LLP',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200084920192',
    confirmAccountNumber: '50200084920192',
    ifscCode: 'HDFC0000240',
    upiId: 'tatapathology@okhdfcbank',
    accountType: 'CURRENT',
    settlementCycle: 'DAILY_T1',
    cancelledChequeFile: 'cancelled_cheque_hdfc.pdf'
  });

  // Address Form State
  const [addressData, setAddressData] = useState({
    legalName: currentUser?.tenantName || 'Tata Pathology & Diagnostic Laboratory',
    addressLine1: 'Plot No. 42, Health City Avenue, Main Road',
    addressLine2: 'Opposite Civil Hospital Gate No. 2',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400021',
    officialPhone: '+91 98765 43210',
    whatsappNumber: '+91 98765 43210',
    supportEmail: currentUser?.email || 'admin@tatapathology.com',
    website: 'https://www.tatapathology.com',
    gstin: '27AAAAA0000A1Z5',
    addressProofFile: 'establishment_address_proof.pdf'
  });

  // Role-Specific Certificates State
  const [certData, setCertData] = useState({
    // Doctor Fields
    doctorDegreeName: 'MBBS, MD (General Medicine)',
    doctorDegreeFile: 'dr_rajesh_md_degree.pdf',
    doctorCouncilName: 'Maharashtra Medical Council (MMC)',
    doctorRegNo: 'MMC-78291-B',
    doctorRegCertificateFile: 'mmc_registration_certificate.pdf',
    doctorIndemnityPolicyNo: 'IND-ICICI-2026-9901',
    doctorIndemnityFile: 'medical_indemnity_insurance.pdf',

    // Pathology Lab Fields
    nablCertificateNo: 'MC-4892-2026',
    nablCertFile: 'nabl_iso15189_accreditation.pdf',
    pathologistDegreeFile: 'pathologist_md_license.pdf',
    bmwPollutionAuthNo: 'BMW-POLLUTION-2026-441',
    bmwCertFile: 'biomedical_waste_clearance.pdf',

    // Hospital Fields
    hospitalCeaRegNo: 'CEA-MH-2026-9812',
    hospitalCeaFile: 'clinical_establishment_act_license.pdf',
    hospitalNabhGrade: 'NABH Full Accreditation (Entry Level)',
    hospitalNabhFile: 'nabh_accreditation_certificate.pdf',
    hospitalFireNocNo: 'FIRE-NOC-MUM-2026-102',
    hospitalFireNocFile: 'fire_safety_clearance.pdf',
    hospitalAerbRegNo: 'Aerb-Rad-2026-881',
    hospitalAerbFile: 'aerb_radiation_safety_license.pdf',

    // Pharmacy Fields
    pharmacyCouncilRegNo: 'MH-PHARM-2026-4421',
    pharmacistCouncilCertFile: 'registered_pharmacist_license.pdf',
    pharmacyDrugLicense20B: 'DL-20B-MH-Mumbai-49102',
    pharmacyDrugLicense21B: 'DL-21B-MH-Mumbai-49103',
    pharmacyDrugLicenseFile: 'form20_21_drug_license.pdf',
    pharmacistDegreeFile: 'b_pharm_degree_certificate.pdf',

    // Staff / Operations Fields
    staffHighestQualification: 'B.Sc (Nursing) / Diploma in Medical Lab Tech (DMLT)',
    staffQualificationFile: 'qualification_degree_marksheet.pdf',
    staffNursingCouncilNo: 'MNC-NURSE-99120',
    staffRegistrationFile: 'paramedical_nursing_council_cert.pdf',
    staffPastExperienceYears: '5 Years at Apollo / Fortis Hospital',
    staffExperienceCertFile: 'experience_relieving_letter.pdf',
    staffGovtIdType: 'Aadhaar Card / PAN Card',
    staffGovtIdFile: 'government_id_proof.pdf',

    // Company HQ Fields
    mcaCinNo: 'U72900DL2026PTC391020',
    incorporationCertFile: 'certificate_of_incorporation.pdf',
    cdscoPlatformClearanceNo: 'CDSCO-MD-DIGITAL-2026-004',
    cdscoCertFile: 'cdsco_medical_software_clearance.pdf',
    iso27001CertFile: 'iso_27001_security_certificate.pdf'
  });

  // Password & Security State
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true,
    autoLockMinutes: '15'
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Load persistent settings if available
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.bank) setBankData(parsed.bank);
          if (parsed.address) setAddressData(parsed.address);
          if (parsed.certificates) setCertData((prev) => ({ ...prev, ...parsed.certificates }));
          if (parsed.bankApprovalStatus) setBankApprovalStatus(parsed.bankApprovalStatus);
          if (parsed.addressApprovalStatus) setAddressApprovalStatus(parsed.addressApprovalStatus);
          if (parsed.certApprovalStatus) setCertApprovalStatus(parsed.certApprovalStatus);
          if (parsed.lastSubmittedAt) setLastSubmittedAt(parsed.lastSubmittedAt);
          if (parsed.security) setSecurityData((prev) => ({ ...prev, twoFactorEnabled: parsed.security.twoFactorEnabled, autoLockMinutes: parsed.security.autoLockMinutes }));
        } catch {}
      }
    }
  }, [isOpen, storageKey]);

  if (!isOpen) return null;

  const saveToStorage = (updatedPayload: any) => {
    localStorage.setItem(storageKey, JSON.stringify(updatedPayload));
    if (onSettingsSaved) onSettingsSaved(updatedPayload);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (bankData.accountNumber !== bankData.confirmAccountNumber) {
      setErrorMessage('Account Number and Confirm Account Number do not match.');
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankData.ifscCode.trim().toUpperCase())) {
      setErrorMessage('Please enter a valid 11-digit IFSC code (e.g. HDFC0000240).');
      return;
    }

    const newStatus: ApprovalStatus = isCompanyAdmin ? 'APPROVED' : 'PENDING_APPROVAL';
    setBankApprovalStatus(newStatus);
    const now = new Date().toLocaleString();
    setLastSubmittedAt(now);

    const payload = {
      bank: { ...bankData, ifscCode: bankData.ifscCode.toUpperCase() },
      address: addressData,
      certificates: certData,
      bankApprovalStatus: newStatus,
      addressApprovalStatus,
      certApprovalStatus,
      lastSubmittedAt: now,
      security: { twoFactorEnabled: securityData.twoFactorEnabled, autoLockMinutes: securityData.autoLockMinutes }
    };

    saveToStorage(payload);
    setSaveSuccessMessage(
      isCompanyAdmin
        ? '✓ Bank details updated and Approved directly by Admin!'
        : '⏳ Bank change request submitted! Sent to Company Admin for verification & approval.'
    );
    setTimeout(() => setSaveSuccessMessage(null), 4500);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (addressData.pincode.length !== 6 || !/^\d+$/.test(addressData.pincode)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN Code.');
      return;
    }

    const newStatus: ApprovalStatus = isCompanyAdmin ? 'APPROVED' : 'PENDING_APPROVAL';
    setAddressApprovalStatus(newStatus);
    const now = new Date().toLocaleString();
    setLastSubmittedAt(now);

    const payload = {
      bank: bankData,
      address: addressData,
      certificates: certData,
      bankApprovalStatus,
      addressApprovalStatus: newStatus,
      certApprovalStatus,
      lastSubmittedAt: now,
      security: { twoFactorEnabled: securityData.twoFactorEnabled, autoLockMinutes: securityData.autoLockMinutes }
    };

    saveToStorage(payload);
    setSaveSuccessMessage(
      isCompanyAdmin
        ? '✓ Official Address & Location updated and Approved directly by Admin!'
        : '⏳ Address change request submitted! Sent to Company Admin for verification & approval.'
    );
    setTimeout(() => setSaveSuccessMessage(null), 4500);
  };

  const handleSaveCertificates = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const newStatus: ApprovalStatus = isCompanyAdmin ? 'APPROVED' : 'PENDING_APPROVAL';
    setCertApprovalStatus(newStatus);
    const now = new Date().toLocaleString();
    setLastSubmittedAt(now);

    const payload = {
      bank: bankData,
      address: addressData,
      certificates: certData,
      bankApprovalStatus,
      addressApprovalStatus,
      certApprovalStatus: newStatus,
      lastSubmittedAt: now,
      security: { twoFactorEnabled: securityData.twoFactorEnabled, autoLockMinutes: securityData.autoLockMinutes }
    };

    saveToStorage(payload);
    setSaveSuccessMessage(
      isCompanyAdmin
        ? '✓ Role-specific certificates verified and Approved directly by Admin!'
        : `⏳ Uploaded ${roleCategory} credentials submitted! Sent to Company Compliance Officer for verification & approval.`
    );
    setTimeout(() => setSaveSuccessMessage(null), 4500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!securityData.currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (securityData.newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    const payload = {
      bank: bankData,
      address: addressData,
      certificates: certData,
      bankApprovalStatus,
      addressApprovalStatus,
      certApprovalStatus,
      lastSubmittedAt,
      security: {
        twoFactorEnabled: securityData.twoFactorEnabled,
        autoLockMinutes: securityData.autoLockMinutes,
        updatedAt: new Date().toISOString()
      }
    };

    saveToStorage(payload);
    setSecurityData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: securityData.twoFactorEnabled,
      autoLockMinutes: securityData.autoLockMinutes
    });

    setSaveSuccessMessage('✓ Password changed immediately! (No admin approval required for security passwords)');
    setTimeout(() => setSaveSuccessMessage(null), 4500);
  };

  const handleAdminApproveAll = () => {
    setBankApprovalStatus('APPROVED');
    setAddressApprovalStatus('APPROVED');
    setCertApprovalStatus('APPROVED');

    const payload = {
      bank: bankData,
      address: addressData,
      certificates: certData,
      bankApprovalStatus: 'APPROVED',
      addressApprovalStatus: 'APPROVED',
      certApprovalStatus: 'APPROVED',
      lastSubmittedAt,
      approvedAt: new Date().toLocaleString(),
      approvedBy: currentUser?.email || 'Admin'
    };

    saveToStorage(payload);
    setSaveSuccessMessage(`👑 [ADMIN ACTION] All submitted Bank, Address, and ${roleCategory} credentials APPROVED & LOCKED!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const getRoleTabTitle = () => {
    switch (roleCategory) {
      case 'DOCTOR': return '🩺 Doctor Degree & Council License';
      case 'PATHOLOGY_LAB': return '🧪 NABL & Pathologist Certificates';
      case 'HOSPITAL': return '🏥 Hospital CEA, NABH & Fire NOC';
      case 'PHARMACY': return '💊 Pharmacy Drug License & Degree';
      case 'STAFF_OPERATIONS': return '🎓 Staff Qualification & Experience';
      case 'COMPANY_HQ': return '🏢 MCA, CDSCO & ISO Certificates';
      default: return '📜 Role Certificates';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '880px',
        maxHeight: '94vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(6, 182, 212, 0.4)',
        borderRadius: '18px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.95)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0B132B',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                  Account Settings & Role Verification Profile
                </h2>
                <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06B6D4', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
                  ROLE: {roleCategory}
                </span>
                {isCompanyAdmin && (
                  <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.25)', border: '1px solid #8B5CF6', color: '#DDD6FE', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
                    👑 ADMIN MODE
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                User: <strong style={{ color: '#F8FAFC' }}>{currentUser?.name || 'Staff User'}</strong> ({currentUser?.role || currentUser?.roleTitle}) • {currentUser?.email || 'user@docsearch.health'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCompanyAdmin && (bankApprovalStatus === 'PENDING_APPROVAL' || addressApprovalStatus === 'PENDING_APPROVAL' || certApprovalStatus === 'PENDING_APPROVAL') && (
              <button
                type="button"
                onClick={handleAdminApproveAll}
                style={{
                  backgroundColor: '#10B981',
                  color: '#070C16',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                ✓ Admin Approve All Pending
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#CBD5E1',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Global Compliance Approval Alert Banner */}
        <div style={{
          backgroundColor: '#070C16',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🛡️</span>
            <span style={{ color: '#94A3B8' }}>
              Governance Rule: <strong>Bank, Address & {roleCategory} Certificates require Company Admin Approval.</strong> Passwords update instantly.
            </span>
          </div>
          <div>
            {(bankApprovalStatus === 'PENDING_APPROVAL' || addressApprovalStatus === 'PENDING_APPROVAL' || certApprovalStatus === 'PENDING_APPROVAL') ? (
              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#FCD34D', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                ⏳ Pending Admin Review ({lastSubmittedAt || 'Recently'})
              </span>
            ) : (
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                ✓ Verified & Approved by Company Admin
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#070C16',
          padding: '0 16px',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('BANK'); setErrorMessage(null); }}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: activeTab === 'BANK' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'BANK' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>💳</span> Bank & Cheque {bankApprovalStatus === 'PENDING_APPROVAL' && '⏳'}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('ADDRESS'); setErrorMessage(null); }}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: activeTab === 'ADDRESS' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'ADDRESS' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📍</span> Address & Location {addressApprovalStatus === 'PENDING_APPROVAL' && '⏳'}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('CERTIFICATES'); setErrorMessage(null); }}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: activeTab === 'CERTIFICATES' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'CERTIFICATES' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📜</span> {getRoleTabTitle()} {certApprovalStatus === 'PENDING_APPROVAL' && '⏳'}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('PASSWORD'); setErrorMessage(null); }}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: activeTab === 'PASSWORD' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'PASSWORD' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🔐</span> Password (Instant Update)
          </button>
        </div>

        {/* Feedback Messages */}
        {saveSuccessMessage && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderBottom: '1px solid #10B981', color: '#A7F3D0', padding: '10px 24px', fontSize: '0.8125rem', fontWeight: 700 }}>
            {saveSuccessMessage}
          </div>
        )}

        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid #EF4444', color: '#FCA5A5', padding: '10px 24px', fontSize: '0.8125rem', fontWeight: 700 }}>
            ✗ {errorMessage}
          </div>
        )}

        {/* Body Container */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* TAB 1: BANK DETAILS */}
          {activeTab === 'BANK' && (
            <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#38BDF8' }}>Direct B2B Bank Payout & Settlement Details</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    Updating bank account requires admin approval and verified cancelled cheque proof.
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: bankApprovalStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: bankApprovalStatus === 'APPROVED' ? '#6EE7B7' : '#FCD34D', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Status: {bankApprovalStatus === 'APPROVED' ? '✓ VERIFIED & APPROVED' : '⏳ PENDING ADMIN APPROVAL'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    ACCOUNT HOLDER NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankData.accountHolderName}
                    onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    BANK NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankData.bankName}
                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, State Bank of India, ICICI Bank"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    BANK ACCOUNT NUMBER *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    CONFIRM ACCOUNT NUMBER *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankData.confirmAccountNumber}
                    onChange={(e) => setBankData({ ...bankData, confirmAccountNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    IFSC CODE *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankData.ifscCode}
                    onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="HDFC0000240"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    ACCOUNT TYPE
                  </label>
                  <select
                    value={bankData.accountType}
                    onChange={(e) => setBankData({ ...bankData, accountType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  >
                    <option value="CURRENT">Current Account (Business/Lab)</option>
                    <option value="SAVINGS">Savings Account</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    SETTLEMENT CYCLE
                  </label>
                  <select
                    value={bankData.settlementCycle}
                    onChange={(e) => setBankData({ ...bankData, settlementCycle: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  >
                    <option value="DAILY_T1">Daily Auto-Settlement (T+1)</option>
                    <option value="WEEKLY">Weekly Settlement (Monday)</option>
                    <option value="MONTHLY">Monthly Settlement</option>
                  </select>
                </div>
              </div>

              {/* Upload Cancelled Cheque / Bank Proof Certificate */}
              <div style={{ backgroundColor: '#1E293B', border: '1px dashed rgba(6, 182, 212, 0.4)', borderRadius: '10px', padding: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', marginBottom: '6px' }}>
                  📎 UPLOAD CANCELLED CHEQUE / PASSBOOK PROOF (PDF/PNG/JPG) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBankData({ ...bankData, cancelledChequeFile: e.target.files[0].name });
                      }
                    }}
                    style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                  />
                  {bankData.cancelledChequeFile && (
                    <span style={{ fontSize: '0.75rem', color: '#6EE7B7', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      📄 Attached: {bankData.cancelledChequeFile}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#06B6D4',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {isCompanyAdmin ? '👑 Approve & Save Bank Details' : '📤 Submit for Admin Approval'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ADDRESS & LOCATION PROFILE */}
          {activeTab === 'ADDRESS' && (
            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#60A5FA' }}>Official Facility Address & Legal Profile</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    Note: Legal address change reflects on GST bills and NABL reports after Admin verification.
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: addressApprovalStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: addressApprovalStatus === 'APPROVED' ? '#6EE7B7' : '#FCD34D', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Status: {addressApprovalStatus === 'APPROVED' ? '✓ VERIFIED & APPROVED' : '⏳ PENDING ADMIN APPROVAL'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    LEGAL ENTITY / CLINIC / LAB NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.legalName}
                    onChange={(e) => setAddressData({ ...addressData, legalName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    GSTIN (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={addressData.gstin}
                    onChange={(e) => setAddressData({ ...addressData, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AAAAA0000A1Z5"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  PREMISES / STREET ADDRESS LINE 1 *
                </label>
                <input
                  type="text"
                  required
                  value={addressData.addressLine1}
                  onChange={(e) => setAddressData({ ...addressData, addressLine1: e.target.value })}
                  placeholder="e.g. Shop No. 4, Ground Floor, Civil Lines"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  AREA / LANDMARK LINE 2
                </label>
                <input
                  type="text"
                  value={addressData.addressLine2}
                  onChange={(e) => setAddressData({ ...addressData, addressLine2: e.target.value })}
                  placeholder="Near State Bank, Opp. Medical College"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    CITY / DISTRICT *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    STATE *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.state}
                    onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    PIN CODE (6 DIGITS) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressData.pincode}
                    onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    OFFICIAL PHONE *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.officialPhone}
                    onChange={(e) => setAddressData({ ...addressData, officialPhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    PATIENT WHATSAPP NUMBER
                  </label>
                  <input
                    type="text"
                    value={addressData.whatsappNumber}
                    onChange={(e) => setAddressData({ ...addressData, whatsappNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    SUPPORT EMAIL
                  </label>
                  <input
                    type="email"
                    value={addressData.supportEmail}
                    onChange={(e) => setAddressData({ ...addressData, supportEmail: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              {/* Upload Address Proof / Establishment Certificate */}
              <div style={{ backgroundColor: '#1E293B', border: '1px dashed rgba(59, 130, 246, 0.4)', borderRadius: '10px', padding: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#60A5FA', marginBottom: '6px' }}>
                  📎 UPLOAD CLINICAL ESTABLISHMENT / ELECTRICITY BILL ADDRESS PROOF *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAddressData({ ...addressData, addressProofFile: e.target.files[0].name });
                      }
                    }}
                    style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                  />
                  {addressData.addressProofFile && (
                    <span style={{ fontSize: '0.75rem', color: '#6EE7B7', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      📄 Attached: {addressData.addressProofFile}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#06B6D4',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {isCompanyAdmin ? '👑 Approve & Save Address' : '📤 Submit for Admin Approval'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ROLE-SPECIFIC CERTIFICATES & CREDENTIALS */}
          {activeTab === 'CERTIFICATES' && (
            <form onSubmit={handleSaveCertificates} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#C4B5FD' }}>
                    {getRoleTabTitle()}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    Upload official verified qualifications, regulatory licenses, and registration credentials for role: <strong>{currentUser?.role || roleCategory}</strong>.
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: certApprovalStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: certApprovalStatus === 'APPROVED' ? '#6EE7B7' : '#FCD34D', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Status: {certApprovalStatus === 'APPROVED' ? '✓ VERIFIED & APPROVED' : '⏳ PENDING ADMIN APPROVAL'}
                </span>
              </div>

              {/* 1. DOCTOR ROLE FIELDS */}
              {roleCategory === 'DOCTOR' && (
                <>
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          MEDICAL DEGREE / SPECIALIZATION (MBBS / MD / MS) *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.doctorDegreeName}
                          onChange={(e) => setCertData({ ...certData, doctorDegreeName: e.target.value })}
                          placeholder="e.g. MBBS, MD (Internal Medicine)"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD MBBS / MD DEGREE CERTIFICATE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, doctorDegreeFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.doctorDegreeFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Degree: {certData.doctorDegreeFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          STATE MEDICAL COUNCIL *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.doctorCouncilName}
                          onChange={(e) => setCertData({ ...certData, doctorCouncilName: e.target.value })}
                          placeholder="e.g. MMC / DMC / KMC"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          COUNCIL REGISTRATION NO. *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.doctorRegNo}
                          onChange={(e) => setCertData({ ...certData, doctorRegNo: e.target.value })}
                          placeholder="MMC-78291-B"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD COUNCIL CERTIFICATE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, doctorRegCertificateFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.doctorRegCertificateFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Council Reg: {certData.doctorRegCertificateFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          PROFESSIONAL INDEMNITY INSURANCE NO.
                        </label>
                        <input
                          type="text"
                          value={certData.doctorIndemnityPolicyNo}
                          onChange={(e) => setCertData({ ...certData, doctorIndemnityPolicyNo: e.target.value })}
                          placeholder="IND-ICICI-2026-9901"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD INDEMNITY POLICY COPY
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, doctorIndemnityFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.doctorIndemnityFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Policy: {certData.doctorIndemnityFile}</span>}
                  </div>
                </>
              )}

              {/* 2. PATHOLOGY / DIAGNOSTIC LAB ROLE FIELDS */}
              {roleCategory === 'PATHOLOGY_LAB' && (
                <>
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          NABL ACCREDITATION NUMBER (ISO 15189:2022) *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.nablCertificateNo}
                          onChange={(e) => setCertData({ ...certData, nablCertificateNo: e.target.value })}
                          placeholder="MC-4892-2026"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD NABL ACCREDITATION CERTIFICATE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, nablCertFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.nablCertFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached NABL Certificate: {certData.nablCertFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          HEAD PATHOLOGIST MEDICAL COUNCIL REG NO. *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.doctorRegNo}
                          onChange={(e) => setCertData({ ...certData, doctorRegNo: e.target.value })}
                          placeholder="MMC-78291-B"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD PATHOLOGIST MD DEGREE & REGISTRATION *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, pathologistDegreeFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.pathologistDegreeFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Pathologist License: {certData.pathologistDegreeFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          BIOMEDICAL WASTE (BMW) CLEARANCE NO.
                        </label>
                        <input
                          type="text"
                          value={certData.bmwPollutionAuthNo}
                          onChange={(e) => setCertData({ ...certData, bmwPollutionAuthNo: e.target.value })}
                          placeholder="BMW-POLLUTION-2026-441"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD BMW POLLUTION CLEARANCE CERTIFICATE
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, bmwCertFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.bmwCertFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached BMW Clearance: {certData.bmwCertFile}</span>}
                  </div>
                </>
              )}

              {/* 3. HOSPITAL / CLINIC ENTERPRISE ROLE FIELDS */}
              {roleCategory === 'HOSPITAL' && (
                <>
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          CLINICAL ESTABLISHMENT ACT REGISTRATION NO. *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.hospitalCeaRegNo}
                          onChange={(e) => setCertData({ ...certData, hospitalCeaRegNo: e.target.value })}
                          placeholder="CEA-MH-2026-9812"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD CLINICAL ESTABLISHMENT LICENSE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, hospitalCeaFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.hospitalCeaFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached CEA License: {certData.hospitalCeaFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          NABH ACCREDITATION LEVEL (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          value={certData.hospitalNabhGrade}
                          onChange={(e) => setCertData({ ...certData, hospitalNabhGrade: e.target.value })}
                          placeholder="e.g. NABH Full / Entry Level"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD NABH ACCREDITATION CERTIFICATE
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, hospitalNabhFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.hospitalNabhFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached NABH: {certData.hospitalNabhFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          FIRE SAFETY NOC NUMBER *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.hospitalFireNocNo}
                          onChange={(e) => setCertData({ ...certData, hospitalFireNocNo: e.target.value })}
                          placeholder="FIRE-NOC-2026-102"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD FIRE NOC CERTIFICATE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, hospitalFireNocFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.hospitalFireNocFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Fire NOC: {certData.hospitalFireNocFile}</span>}
                  </div>
                </>
              )}

              {/* 4. PHARMACY / CHEMIST ROLE FIELDS */}
              {roleCategory === 'PHARMACY' && (
                <>
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          STATE PHARMACY COUNCIL REG NO. *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.pharmacyCouncilRegNo}
                          onChange={(e) => setCertData({ ...certData, pharmacyCouncilRegNo: e.target.value })}
                          placeholder="MH-PHARM-2026-4421"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD PHARMACIST REGISTRATION CERTIFICATE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, pharmacistCouncilCertFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.pharmacistCouncilCertFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Pharmacist Certificate: {certData.pharmacistCouncilCertFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          DRUG LICENSE FORM 20B & 21B NO. *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.pharmacyDrugLicense20B}
                          onChange={(e) => setCertData({ ...certData, pharmacyDrugLicense20B: e.target.value })}
                          placeholder="DL-20B-MH-49102"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD FORM 20B / 21B DRUG LICENSE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, pharmacyDrugLicenseFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.pharmacyDrugLicenseFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Drug License: {certData.pharmacyDrugLicenseFile}</span>}
                  </div>
                </>
              )}

              {/* 5. STAFF / NURSE / OPERATIONS ROLE FIELDS */}
              {roleCategory === 'STAFF_OPERATIONS' && (
                <>
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          HIGHEST QUALIFICATION (DEGREE / DIPLOMA) *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.staffHighestQualification}
                          onChange={(e) => setCertData({ ...certData, staffHighestQualification: e.target.value })}
                          placeholder="e.g. B.Sc Nursing / GNM / DMLT / B.Com / MBA"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD DEGREE / DIPLOMA CERTIFICATE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, staffQualificationFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.staffQualificationFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Qualification: {certData.staffQualificationFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          PAST CLINICAL / HOSPITAL EXPERIENCE DETAILS *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.staffPastExperienceYears}
                          onChange={(e) => setCertData({ ...certData, staffPastExperienceYears: e.target.value })}
                          placeholder="e.g. 5 Years Senior Staff Nurse at Max Healthcare"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD EXPERIENCE / RELIEVING CERTIFICATE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, staffExperienceCertFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.staffExperienceCertFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Experience: {certData.staffExperienceCertFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          GOVERNMENT ID TYPE (AADHAAR / PAN) *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.staffGovtIdType}
                          onChange={(e) => setCertData({ ...certData, staffGovtIdType: e.target.value })}
                          placeholder="Aadhaar Card"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD GOVT ID PROOF *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, staffGovtIdFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.staffGovtIdFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Govt ID: {certData.staffGovtIdFile}</span>}
                  </div>
                </>
              )}

              {/* 6. COMPANY HQ ROLES */}
              {roleCategory === 'COMPANY_HQ' && (
                <>
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          MCA / ROC CORPORATE IDENTITY NO. (CIN) *
                        </label>
                        <input
                          type="text"
                          required
                          value={certData.mcaCinNo}
                          onChange={(e) => setCertData({ ...certData, mcaCinNo: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD INCORPORATION CERTIFICATE *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, incorporationCertFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.incorporationCertFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached CIN Document: {certData.incorporationCertFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          CDSCO MEDICAL SOFTWARE CLEARANCE
                        </label>
                        <input
                          type="text"
                          value={certData.cdscoPlatformClearanceNo}
                          onChange={(e) => setCertData({ ...certData, cdscoPlatformClearanceNo: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                          UPLOAD CDSCO & ISO 27001 CLEARANCE
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCertData({ ...certData, cdscoCertFile: e.target.files[0].name });
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.cdscoCertFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached CDSCO Clearance: {certData.cdscoCertFile}</span>}
                  </div>
                </>
              )}

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#06B6D4',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {isCompanyAdmin ? `👑 Approve & Lock ${roleCategory} Certificates` : '📤 Submit Certificates for Admin Approval'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: PASSWORD & SECURITY */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#FBBF24' }}>Cryptographic Password & Multi-Factor Security</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    Password changes do NOT require admin approval — they take effect immediately across all sessions.
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  ⚡ Instant Self-Service Update
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  CURRENT PASSWORD *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={securityData.currentPassword}
                    onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                    placeholder="Enter existing password"
                    style={{ width: '100%', padding: '8px 12px', paddingRight: '40px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    {showCurrentPass ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    NEW SECURE PASSWORD *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                      placeholder="Minimum 8 characters"
                      style={{ width: '100%', padding: '8px 12px', paddingRight: '40px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      {showNewPass ? '👁️' : '🔒'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    CONFIRM NEW PASSWORD *
                  </label>
                  <input
                    type="password"
                    required
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              {/* Password strength guidelines */}
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>PASSWORD CRITERIA:</span>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.6875rem', color: '#CBD5E1', flexWrap: 'wrap' }}>
                  <span style={{ color: securityData.newPassword.length >= 8 ? '#4ADE80' : '#94A3B8' }}>● At least 8 characters</span>
                  <span style={{ color: /[A-Z]/.test(securityData.newPassword) ? '#4ADE80' : '#94A3B8' }}>● Uppercase letter</span>
                  <span style={{ color: /[0-9]/.test(securityData.newPassword) ? '#4ADE80' : '#94A3B8' }}>● Number</span>
                  <span style={{ color: /[^A-Za-z0-9]/.test(securityData.newPassword) ? '#4ADE80' : '#94A3B8' }}>● Special character (!@#$)</span>
                </div>
              </div>

              {/* 2FA Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px' }}>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: '#F8FAFC', display: 'block' }}>Two-Factor Authentication (2FA)</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Require OTP SMS / Authenticator verification upon login</span>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={securityData.twoFactorEnabled}
                    onChange={(e) => setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: securityData.twoFactorEnabled ? '#06B6D4' : '#475569',
                    borderRadius: '24px',
                    transition: '0.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: securityData.twoFactorEnabled ? '22px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#FFF',
                      borderRadius: '50%',
                      transition: '0.2s'
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#06B6D4',
                    color: '#070C16',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  🔒 Update Password Immediately
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
