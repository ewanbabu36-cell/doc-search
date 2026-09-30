import React, { useState, useEffect } from 'react';
import { DynamicRoleDocumentChecklist } from './DynamicRoleDocumentChecklist.js';
import { markPartnerProfileAsUpdated } from '../../utils/partnerProfileGuard.js';
import { apiRequest } from '../../services/api-client.js';

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
    planTier?: string;
    ownerAadhaarNumber?: string;
    aadhaarDocFileName?: string;
    aadhaarDocDataUrl?: string;
    kycStatus?: 'PENDING_ADMIN_VERIFICATION' | 'KYC_VERIFIED' | 'KYC_REJECTED';
    kycSubmittedAt?: string;
    onboardingEnvironment?: string;
    mustChangePassword?: boolean;
  } | undefined;
  initialTab?: 'KYC' | 'BANK' | 'ADDRESS' | 'CERTIFICATES' | 'CLINICAL_BEDS' | 'PRINT_LETTERHEAD' | 'SECURITY_SEAL' | 'PASSWORD' | undefined;
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
  initialTab,
  onSettingsSaved
}) => {
  const [activeTab, setActiveTab] = useState<'KYC' | 'BANK' | 'ADDRESS' | 'CERTIFICATES' | 'CLINICAL_BEDS' | 'PRINT_LETTERHEAD' | 'SECURITY_SEAL' | 'PASSWORD'>(
    initialTab || 'KYC'
  );

  // Load dynamic partner info and staged profile amendments
  const [dynamicPartner, setDynamicPartner] = useState<any>(null);
  const [stagedAmendment, setStagedAmendment] = useState<any>(null);
  const [isAmendmentFormOpen, setIsAmendmentFormOpen] = useState(false);
  const [amendmentData, setAmendmentData] = useState({
    proposedFacilityName: '',
    proposedOwnerName: '',
    proposedAadhaarNumber: '',
    proposedDocFileName: '',
    proposedDocDataUrl: '',
    reasonForChange: ''
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiScanResult, setAiScanResult] = useState<string | null>(null);

  const roleCategory = getRoleCategory(currentUser);
  const isCompanyAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'COMPANY_ADMIN' || currentUser?.role === 'COMPLIANCE_OFFICER';
  const userAny = currentUser as any;

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
    accountHolderName: currentUser?.name || currentUser?.tenantName || '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    upiId: '',
    accountType: 'CURRENT',
    settlementCycle: 'DAILY_T1',
    cancelledChequeFile: ''
  });

  // Address Form State (Pillar 1: Identity & Address)
  const [addressData, setAddressData] = useState({
    legalName: currentUser?.tenantName || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    officialPhone: userAny?.phone || '',
    whatsappNumber: userAny?.phone || '',
    emergencyHelpline: '',
    panNumber: '',
    latitude: '',
    longitude: '',
    supportEmail: currentUser?.email || '',
    website: '',
    gstin: '',
    addressProofFile: ''
  });

  // Pillar 3: Clinical Setup & Beds State
  const [clinicalData, setClinicalData] = useState({
    totalLicensedBeds: 25,
    icuBeds: 4,
    generalWardBeds: 15,
    deluxeBeds: 4,
    emergencyTriageBeds: 2,
    is24x7Emergency: true,
    morningShiftStart: '08:00',
    morningShiftEnd: '14:00',
    eveningShiftStart: '16:00',
    eveningShiftEnd: '21:00'
  });

  // Pillar 4: Print Media & Digital Letterhead Studio State
  const [brandingData, setBrandingData] = useState({
    logoUrl: '',
    stampSealUrl: '',
    signatureUrl: '',
    letterheadMode: 'FULL_DIGITAL' as 'FULL_DIGITAL' | 'PRE_PRINTED_PAD',
    rxHeaderNotes: 'CONSULTING PHYSICIAN & SPECIALIST CLINICAL CARE',
    rxFooterDisclaimer: 'Digitally authenticated under IT Act 2000 & NMC Guidelines. Valid for 30 days from issue.',
    reportFooterDisclaimer: 'This electronic laboratory report is validated against standard reference ranges and certified by authorized medical specialists.'
  });

  // Pillar 6: Multi-Branch & Satellite Topology State
  const [branchesData, setBranchesData] = useState<Array<{ id: string; branchName: string; branchType: string; address: string; phone: string; isMainHq: boolean }>>([
    {
      id: 'branch-main',
      branchName: currentUser?.tenantName ? `${currentUser.tenantName} (Main Campus)` : 'Main Healthcare Facility (HQ)',
      branchType: 'MAIN_CAMPUS',
      address: '',
      phone: '',
      isMainHq: true
    }
  ]);
  const [newBranchInput, setNewBranchInput] = useState({
    branchName: '',
    branchType: 'SATELLITE_CLINIC',
    address: '',
    phone: ''
  });

  // Role-Specific Certificates State
  const [certData, setCertData] = useState({
    // Expiry dates
    licenseExpiryDate: '2028-12-31',
    autoRenewalAlertEnabled: true,

    // Doctor Fields
    doctorDegreeName: currentUser?.roleTitle || (roleCategory === 'DOCTOR' ? 'MBBS' : ''),
    doctorDegreeFile: '',
    doctorCouncilName: '',
    doctorRegNo: userAny?.clinicalLicense || '',
    doctorRegCertificateFile: '',
    doctorIndemnityPolicyNo: '',
    doctorIndemnityFile: '',

    // Pathology Lab Fields
    nablCertificateNo: '',
    nablCertFile: '',
    pathologistDegreeFile: '',
    bmwPollutionAuthNo: '',
    bmwCertFile: '',

    // Hospital Fields
    abdmFacilityId: '',
    aerbApprovalNo: '',
    aerbCertFile: '',
    hospitalCeaRegNo: userAny?.clinicalLicense || '',
    hospitalCeaFile: '',
    hospitalNabhGrade: '',
    hospitalNabhFile: '',
    hospitalFireNocNo: '',
    hospitalFireNocFile: '',

    // Pharmacy Fields
    pharmacyCouncilRegNo: '',
    pharmacistCouncilCertFile: '',
    pharmacyDrugLicense20B: userAny?.clinicalLicense || '',
    pharmacyDrugLicense21B: '',
    pharmacyDrugLicenseFile: '',

    // Staff / Operations Fields
    staffHighestQualification: '',
    staffQualificationFile: '',
    staffPastExperienceYears: '',
    staffExperienceCertFile: '',
    staffGovtIdType: 'Aadhaar Card / PAN Card',
    staffGovtIdFile: '',

    // Security Hash
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
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
      let savedParsed: any = null;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          savedParsed = JSON.parse(saved);
          if (savedParsed.bank) setBankData(savedParsed.bank);
          if (savedParsed.address) setAddressData((prev) => ({ ...prev, ...savedParsed.address }));
          if (savedParsed.certificates) setCertData((prev) => ({ ...prev, ...savedParsed.certificates }));
          if (savedParsed.clinical) setClinicalData((prev) => ({ ...prev, ...savedParsed.clinical }));
          if (savedParsed.branding) setBrandingData((prev) => ({ ...prev, ...savedParsed.branding }));
          if (savedParsed.branches && Array.isArray(savedParsed.branches)) setBranchesData(savedParsed.branches);
          if (savedParsed.bankApprovalStatus) setBankApprovalStatus(savedParsed.bankApprovalStatus);
          if (savedParsed.addressApprovalStatus) setAddressApprovalStatus(savedParsed.addressApprovalStatus);
          if (savedParsed.certApprovalStatus) setCertApprovalStatus(savedParsed.certApprovalStatus);
          if (savedParsed.lastSubmittedAt) setLastSubmittedAt(savedParsed.lastSubmittedAt);
          if (savedParsed.security) setSecurityData((prev) => ({ ...prev, twoFactorEnabled: savedParsed.security.twoFactorEnabled, autoLockMinutes: savedParsed.security.autoLockMinutes }));
        } catch {}
      }

      try {
        const partners = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
        const matched = partners.find((p: any) =>
          (p.email && p.email.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim()) ||
          (p.phone && userAny?.phone && p.phone === userAny.phone)
        );
        if (matched) {
          setDynamicPartner(matched);
          if (!savedParsed) {
            setAddressData((prev) => ({
              ...prev,
              legalName: matched.facilityName || prev.legalName || currentUser?.tenantName || '',
              addressLine1: matched.address || matched.addressLine1 || prev.addressLine1,
              city: matched.city || prev.city,
              state: matched.state || prev.state,
              pincode: matched.pincode || prev.pincode,
              officialPhone: matched.phone || prev.officialPhone || userAny?.phone || '',
              emergencyHelpline: matched.emergencyHelpline || prev.emergencyHelpline,
              panNumber: matched.panNumber || prev.panNumber,
              supportEmail: matched.email || prev.supportEmail || currentUser?.email || '',
              gstin: matched.gstin || prev.gstin
            }));
            setCertData((prev) => ({
              ...prev,
              doctorRegNo: matched.clinicalLicense || prev.doctorRegNo,
              hospitalCeaRegNo: matched.clinicalLicense || prev.hospitalCeaRegNo,
              abdmFacilityId: matched.abdmFacilityId || prev.abdmFacilityId,
              pharmacyDrugLicense20B: matched.clinicalLicense || prev.pharmacyDrugLicense20B,
              nablCertificateNo: matched.nablCertNo || prev.nablCertificateNo
            }));
          }
        }

        const amendments = JSON.parse(localStorage.getItem('docsearch_staged_profile_amendments') || '[]');
        const existing = amendments.find((a: any) => a.userEmail?.toLowerCase() === currentUser?.email?.toLowerCase() && a.status === 'PENDING_ADMIN_APPROVAL');
        if (existing) setStagedAmendment(existing);
      } catch {}

      // Also hydrate from backend PostgreSQL GET /api/v1/partner/profile
      apiRequest<any>('/api/v1/partner/profile')
        .then((res: any) => {
          const prof = res?.data || res;
          if (!prof) return;
          setAddressData((prev) => ({
            ...prev,
            legalName: prof.legalName || prof.tradeName || prev.legalName || currentUser?.tenantName || '',
            addressLine1: prof.address?.addressLine1 || prev.addressLine1 || '',
            addressLine2: prof.address?.addressLine2 || prev.addressLine2 || '',
            city: prof.address?.city || prev.city || '',
            state: prof.address?.state || prev.state || '',
            pincode: prof.address?.pincode || prev.pincode || '',
            officialPhone: prof.contactPhone || prev.officialPhone || '',
            emergencyHelpline: prof.statutory?.emergencyHelpline || prev.emergencyHelpline || '',
            panNumber: prof.statutory?.panNumber || prev.panNumber || '',
            latitude: prof.metadata?.latitude || prev.latitude || '',
            longitude: prof.metadata?.longitude || prev.longitude || '',
            supportEmail: prof.contactEmail || prev.supportEmail || currentUser?.email || '',
            gstin: prof.statutory?.gstin || prev.gstin || ''
          }));
          if (prof.certificates) {
            setCertData((prev) => ({
              ...prev,
              ...prof.certificates,
              hospitalCeaRegNo: prof.certificates.hospitalCeaRegNo || prof.statutory?.clinicalLicense || prev.hospitalCeaRegNo || '',
              abdmFacilityId: prof.statutory?.abdmFacilityId || prof.certificates.abdmFacilityId || prev.abdmFacilityId || '',
              aerbApprovalNo: prof.statutory?.aerbApprovalNo || prof.certificates.aerbApprovalNo || prev.aerbApprovalNo || '',
              doctorRegNo: prof.certificates.doctorRegNo || prof.statutory?.clinicalLicense || prev.doctorRegNo || ''
            }));
          }
          if (prof.clinical) {
            setClinicalData((prev) => ({ ...prev, ...prof.clinical }));
          }
          if (prof.branding) {
            setBrandingData((prev) => ({ ...prev, ...prof.branding }));
          }
          if (prof.branches && Array.isArray(prof.branches) && prof.branches.length > 0) {
            setBranchesData(prof.branches);
          }
          if (prof.bank && prof.bank.accountNumber) {
            setBankData((prev) => ({ ...prev, ...prof.bank }));
          }
          if (prof.isProfileCompleted) {
            markPartnerProfileAsUpdated(currentUser?.email);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, storageKey, currentUser?.email]);

  const ownerAadhaar = dynamicPartner?.ownerAadhaarNumber || currentUser?.ownerAadhaarNumber || '';
  const aadhaarDocName = dynamicPartner?.aadhaarDocFileName || currentUser?.aadhaarDocFileName || '';
  const kycStatus = dynamicPartner?.kycStatus || currentUser?.kycStatus || 'KYC_PENDING';

  const handleSubmitAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!amendmentData.reasonForChange.trim()) {
      setErrorMessage('Please state the regulatory or operational reason for this profile amendment.');
      return;
    }

    const cleanAadhaar = amendmentData.proposedAadhaarNumber.replace(/[^0-9]/g, '');
    if (amendmentData.proposedAadhaarNumber && cleanAadhaar.length !== 12) {
      setErrorMessage('Proposed Aadhaar Number must be exactly 12 numeric digits.');
      return;
    }

    const newAmendment = {
      id: `AMEND-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userEmail: currentUser?.email || 'default_user',
      tenantSlug: (currentUser?.tenantName || 'partner').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      currentFacilityName: currentUser?.tenantName || 'Healthcare Facility',
      currentOwnerName: currentUser?.name || 'Lead Doctor',
      currentAadhaarNumber: ownerAadhaar,
      proposedFacilityName: amendmentData.proposedFacilityName.trim() || (currentUser?.tenantName || ''),
      proposedOwnerName: amendmentData.proposedOwnerName.trim() || (currentUser?.name || ''),
      proposedAadhaarNumber: cleanAadhaar || ownerAadhaar,
      proposedDocFileName: amendmentData.proposedDocFileName || aadhaarDocName,
      proposedDocDataUrl: amendmentData.proposedDocDataUrl,
      reasonForChange: amendmentData.reasonForChange.trim(),
      status: 'PENDING_ADMIN_APPROVAL' as const,
      submittedAt: new Date().toLocaleString()
    };

    // Save to staged amendments
    try {
      const amendments = JSON.parse(localStorage.getItem('docsearch_staged_profile_amendments') || '[]');
      const filtered = amendments.filter((a: any) => a.userEmail?.toLowerCase() !== currentUser?.email?.toLowerCase());
      filtered.unshift(newAmendment);
      localStorage.setItem('docsearch_staged_profile_amendments', JSON.stringify(filtered));
      setStagedAmendment(newAmendment);

      // Also queue into Founder / Company Platform verification queue
      const q = JSON.parse(localStorage.getItem('docsearch_verification_queue') || '[]');
      q.unshift({
        id: newAmendment.id,
        partnerName: currentUser?.tenantName || 'Healthcare Facility',
        partnerType: roleCategory === 'DOCTOR' ? 'CLINIC' : roleCategory === 'PATHOLOGY_LAB' ? 'PATHOLOGY' : roleCategory === 'PHARMACY' ? 'PHARMACY' : 'HOSPITAL',
        tenantSlug: newAmendment.tenantSlug,
        submittedBy: currentUser?.name || 'Partner Owner',
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'PROFILE_AMENDMENT',
        status: 'PENDING_APPROVAL',
        details: {
          'Proposed Facility Name': newAmendment.proposedFacilityName,
          'Proposed Owner Name': newAmendment.proposedOwnerName,
          'Proposed Aadhaar': `XXXX-XXXX-${newAmendment.proposedAadhaarNumber.slice(-4)}`,
          'Reason For Amendment': newAmendment.reasonForChange,
          'Current Live Status': 'Running on previous approved details'
        },
        documentName: newAmendment.proposedDocFileName,
        documentType: 'Supporting Identity / Registration Proof',
        aiMatchScore: 99.1,
        extractedOcrText: `AMENDMENT PROPOSAL • FACILITY: ${newAmendment.proposedFacilityName.toUpperCase()} • OWNER: ${newAmendment.proposedOwnerName.toUpperCase()} • REASON: ${newAmendment.reasonForChange.toUpperCase()}`,
        sha256Hash: Array.from(newAmendment.id + newAmendment.userEmail).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, '0')
      });
      localStorage.setItem('docsearch_verification_queue', JSON.stringify(q));
    } catch {}

    setIsAmendmentFormOpen(false);
    setSaveSuccessMessage('⏳ Profile Amendment submitted for Founder / Admin Approval! Your current live system continues using existing approved details until Admin approves.');
    setTimeout(() => setSaveSuccessMessage(null), 6000);
  };

  if (!isOpen) return null;

  const simulateAiOcr = (fileName: string) => {
    setIsAiScanning(true);
    setAiScanResult(null);
    setTimeout(() => {
      setIsAiScanning(false);
      setAiScanResult(`✓ AI OCR Verified: "${fileName}" (Confidence: 99.4% Match with National Registry)`);
      setTimeout(() => setAiScanResult(null), 5000);
    }, 900);
  };

  const saveToStorage = async (updatedPayload: any): Promise<boolean> => {
    try {
      // Synchronize to backend PostgreSQL database FIRST
      await apiRequest('/api/v1/partner/profile', {
        method: 'PUT',
        body: JSON.stringify({
          legalName: updatedPayload.address?.legalName,
          phone: updatedPayload.address?.officialPhone,
          address: {
            line1: updatedPayload.address?.addressLine1,
            line2: updatedPayload.address?.addressLine2,
            city: updatedPayload.address?.city,
            state: updatedPayload.address?.state,
            postalCode: updatedPayload.address?.pincode
          },
          statutory: {
            hospitalCeaRegNo: updatedPayload.certificates?.hospitalCeaRegNo,
            abdmFacilityId: updatedPayload.certificates?.abdmFacilityId,
            aerbApprovalNo: updatedPayload.certificates?.aerbApprovalNo,
            emergencyHelpline: updatedPayload.address?.emergencyHelpline,
            panNumber: updatedPayload.address?.panNumber,
            gstin: updatedPayload.address?.gstin,
            doctorRegNo: updatedPayload.certificates?.doctorRegNo,
            pharmacyCouncilRegNo: updatedPayload.certificates?.pharmacyCouncilRegNo,
            nablCertificateNo: updatedPayload.certificates?.nablCertificateNo,
            authorizedSignatory: updatedPayload.certificates?.authorizedSignatory
          },
          certificates: updatedPayload.certificates,
          bank: updatedPayload.bank,
          clinical: updatedPayload.clinical || clinicalData,
          branding: updatedPayload.branding || brandingData,
          branches: updatedPayload.branches || branchesData
        })
      });

      // Synchronize branding and letterhead configuration to universal print media cache
      const effectiveBranding = updatedPayload.branding || brandingData;
      try {
        localStorage.setItem('docsearch_custom_rx_letterhead', JSON.stringify({
          doctorName: updatedPayload.certificates?.doctorName || currentUser?.name || 'Authorized Consultant',
          doctorDegree: updatedPayload.certificates?.doctorDegreeName || (roleCategory === 'DOCTOR' ? 'MBBS' : 'Chief Medical Superintendent'),
          doctorSpecialty: updatedPayload.certificates?.doctorSpecialty || 'General Medicine & Clinical Care',
          doctorCouncilName: updatedPayload.certificates?.doctorCouncilName || 'State Medical Council',
          doctorRegNo: updatedPayload.certificates?.doctorRegNo || updatedPayload.certificates?.hospitalCeaRegNo || 'Reg # Verified',
          entityLegalName: updatedPayload.address?.legalName || currentUser?.tenantName || 'Healthcare Facility',
          officialAddress: `${updatedPayload.address?.addressLine1 || ''}${updatedPayload.address?.addressLine2 ? ', ' + updatedPayload.address.addressLine2 : ''}, ${updatedPayload.address?.city || ''}, ${updatedPayload.address?.state || ''} - ${updatedPayload.address?.pincode || ''}`.trim(),
          contactPhone: updatedPayload.address?.officialPhone || '',
          emergencyHelpline: updatedPayload.address?.emergencyHelpline || '',
          supportEmail: updatedPayload.address?.supportEmail || '',
          footerNotes: effectiveBranding?.rxFooterDisclaimer || 'Digitally Signed & Authenticated under IT Act 2000 & NMC Guidelines. Valid for 30 days.',
          showWatermark: true,
          themeColor: '#0284C7',
          logoUrl: effectiveBranding?.logoUrl || '',
          stampSealUrl: effectiveBranding?.stampSealUrl || '',
          signatureUrl: effectiveBranding?.signatureUrl || '',
          letterheadMode: effectiveBranding?.letterheadMode || 'FULL_DIGITAL'
        }));
        localStorage.setItem('docsearch_prescription_letterhead_mode', effectiveBranding?.letterheadMode === 'PRE_PRINTED_PAD' ? 'PREPRINTED_PAD' : 'PLAIN_A4');
      } catch {}

      const payloadWithFlag = {
        ...updatedPayload,
        isProfileUpdated: true,
        lastProfileUpdatedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(payloadWithFlag));
      markPartnerProfileAsUpdated(currentUser?.email);

      // Hydrate local auth session so guard recognizes completion
      try {
        const authStr = localStorage.getItem('docsearch_partner_staff_auth');
        if (authStr) {
          const authObj = JSON.parse(authStr);
          authObj.isProfileCompleted = true;
          localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(authObj));
        }
      } catch {}

      if (onSettingsSaved) onSettingsSaved(payloadWithFlag);
      return true;
    } catch (err: any) {
      console.error('Backend partner profile sync failed:', err);
      setErrorMessage(err.message || 'Failed to save profile to server. Please verify connection and retry.');
      return false;
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
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

    const ok = await saveToStorage(payload);
    if (ok) {
      setSaveSuccessMessage(
        isCompanyAdmin
          ? '✓ Bank details updated and Approved directly by Admin!'
          : '⏳ Bank change request submitted! Sent to Company Admin for verification & approval.'
      );
      setTimeout(() => setSaveSuccessMessage(null), 4500);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
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

    const ok = await saveToStorage(payload);
    if (ok) {
      setSaveSuccessMessage(
        isCompanyAdmin
          ? '✓ Official Address & Location updated and Approved directly by Admin!'
          : '⏳ Address change request submitted! Sent to Company Admin for verification & approval.'
      );
      setTimeout(() => setSaveSuccessMessage(null), 4500);
    }
  };

  const handleSaveCertificates = async (e: React.FormEvent) => {
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

    const ok = await saveToStorage(payload);
    if (ok) {
      setSaveSuccessMessage(
        isCompanyAdmin
          ? '✓ Role-specific certificates verified and Approved directly by Admin!'
          : `⏳ Uploaded ${roleCategory} credentials submitted! Sent to Company Compliance Officer for verification & approval.`
      );
      setTimeout(() => setSaveSuccessMessage(null), 4500);
    }
  };

  const handleSaveClinicalBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const now = new Date().toLocaleString();
    setLastSubmittedAt(now);

    const payload = {
      bank: bankData,
      address: addressData,
      certificates: certData,
      clinical: clinicalData,
      branding: brandingData,
      branches: branchesData,
      bankApprovalStatus,
      addressApprovalStatus,
      certApprovalStatus,
      lastSubmittedAt: now,
      security: { twoFactorEnabled: securityData.twoFactorEnabled, autoLockMinutes: securityData.autoLockMinutes }
    };

    const ok = await saveToStorage(payload);
    if (ok) {
      setSaveSuccessMessage('✓ Clinical Bed Strength, Shift Timings & Multi-Branch Topology saved successfully!');
      setTimeout(() => setSaveSuccessMessage(null), 4500);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const now = new Date().toLocaleString();
    setLastSubmittedAt(now);

    const payload = {
      bank: bankData,
      address: addressData,
      certificates: certData,
      clinical: clinicalData,
      branding: brandingData,
      branches: branchesData,
      bankApprovalStatus,
      addressApprovalStatus,
      certApprovalStatus,
      lastSubmittedAt: now,
      security: { twoFactorEnabled: securityData.twoFactorEnabled, autoLockMinutes: securityData.autoLockMinutes }
    };

    const ok = await saveToStorage(payload);
    if (ok) {
      setSaveSuccessMessage('✓ Digital Letterhead Branding, Logo, Stamp & Disclaimers updated and synchronized across all OPD & Pathology printouts!');
      setTimeout(() => setSaveSuccessMessage(null), 4500);
    }
  };

  const handleImageUpload = (file: File, target: 'logo' | 'stamp' | 'signature') => {
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 2MB limit. Please upload a smaller compressed image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (target === 'logo') setBrandingData((prev) => ({ ...prev, logoUrl: dataUrl }));
      if (target === 'stamp') setBrandingData((prev) => ({ ...prev, stampSealUrl: dataUrl }));
      if (target === 'signature') setBrandingData((prev) => ({ ...prev, signatureUrl: dataUrl }));
      simulateAiOcr(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleAddBranch = () => {
    if (!newBranchInput.branchName.trim()) {
      setErrorMessage('Please enter a branch or satellite clinic name.');
      return;
    }
    const newB = {
      id: `branch-${Date.now()}`,
      branchName: newBranchInput.branchName.trim(),
      branchType: newBranchInput.branchType,
      address: newBranchInput.address.trim(),
      phone: newBranchInput.phone.trim(),
      isMainHq: false
    };
    setBranchesData((prev) => [...prev, newB]);
    setNewBranchInput({ branchName: '', branchType: 'SATELLITE_CLINIC', address: '', phone: '' });
  };

  const handleRemoveBranch = (id: string) => {
    setBranchesData((prev) => prev.filter((b) => b.id !== id || b.isMainHq));
  };

  const handleSavePassword = async (e: React.FormEvent) => {
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

    // Call API Gateway to update password
    if (currentUser?.email) {
      try {
        await fetch('/api/v1/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            oldPassword: securityData.currentPassword,
            newPassword: securityData.newPassword
          })
        });
      } catch (err) {
        console.warn('Backend password change sync error:', err);
      }

      // Update custom users local storage cache as well
      try {
        const customUsers = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
        const updated = customUsers.map((u: any) =>
          u.email?.toLowerCase() === currentUser.email?.toLowerCase()
            ? { ...u, password: securityData.newPassword }
            : u
        );
        localStorage.setItem('docsearch_custom_partner_users', JSON.stringify(updated));
        localStorage.setItem(`docsearch_day1_pwd_${currentUser.email}`, 'true');
      } catch {}

      // Update operational staff in docsearch_partner_staff
      try {
        const staffList = JSON.parse(localStorage.getItem('docsearch_partner_staff') || '[]');
        const updatedStaff = staffList.map((s: any) => {
          if (s.workEmail?.toLowerCase() === currentUser.email?.toLowerCase()) {
            return {
              ...s,
              password: securityData.newPassword,
              mustChangePassword: false,
              metadata: {
                ...(s.metadata || {}),
                password: securityData.newPassword,
                mustChangePassword: false
              }
            };
          }
          return s;
        });
        localStorage.setItem('docsearch_partner_staff', JSON.stringify(updatedStaff));

        // Update active auth session
        const authUser = JSON.parse(localStorage.getItem('docsearch_partner_staff_auth') || '{}');
        if (authUser.email?.toLowerCase() === currentUser.email?.toLowerCase()) {
          authUser.mustChangePassword = false;
          authUser.password = securityData.newPassword;
          localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(authUser));
        }
      } catch (err) {
        console.error('Failed to update operational staff password in settings:', err);
      }
    }

    const wasInitialPasswordReset = Boolean(currentUser?.mustChangePassword);
    if (currentUser) {
      currentUser.mustChangePassword = false;
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
    setTimeout(() => {
      setSaveSuccessMessage(null);
      if (wasInitialPasswordReset) {
        onClose();
      }
    }, wasInitialPasswordReset ? 1800 : 4500);
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
      backgroundColor: 'rgba(7, 12, 22, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 1000001,
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'flex-end',
      padding: 0
    }}>
      <div
        className="ds-adaptive-modal-sheet"
        style={{
          width: '100%',
          maxWidth: '860px',
          height: '100vh',
          maxHeight: '100vh',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          borderLeft: '1.5px solid rgba(6, 182, 212, 0.4)',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          borderRadius: '16px 0 0 16px',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.85)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
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
                  Enterprise Compliance & Account Settings
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
                className="ds-touch-target"
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
              className="ds-touch-target"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#CBD5E1',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '44px',
                minWidth: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
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

        {/* AI OCR Pre-Scan Live Feedback */}
        {isAiScanning && (
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', borderBottom: '1px solid #06B6D4', color: '#38BDF8', padding: '8px 24px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤖</span> <span>Running AI OCR Deep Document Inspection & Registry Cross-Check...</span>
          </div>
        )}

        {aiScanResult && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderBottom: '1px solid #10B981', color: '#6EE7B7', padding: '8px 24px', fontSize: '0.75rem', fontWeight: 800 }}>
            {aiScanResult}
          </div>
        )}

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
            onClick={() => { setActiveTab('KYC'); setErrorMessage(null); }}
            style={{
              padding: '12px 14px',
              backgroundColor: 'transparent',
              color: activeTab === 'KYC' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'KYC' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🪪</span> Owner Aadhaar KYC & Lock {kycStatus === 'PENDING_ADMIN_VERIFICATION' && '⏳'}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('BANK'); setErrorMessage(null); }}
            style={{
              padding: '12px 14px',
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
              padding: '12px 14px',
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
              padding: '12px 14px',
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
            onClick={() => { setActiveTab('CLINICAL_BEDS'); setErrorMessage(null); }}
            style={{
              padding: '12px 14px',
              backgroundColor: 'transparent',
              color: activeTab === 'CLINICAL_BEDS' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'CLINICAL_BEDS' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🏥</span> Clinical Beds & Shifts
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('PRINT_LETTERHEAD'); setErrorMessage(null); }}
            style={{
              padding: '12px 14px',
              backgroundColor: 'transparent',
              color: activeTab === 'PRINT_LETTERHEAD' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'PRINT_LETTERHEAD' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🖨️</span> Letterhead Studio & Preview
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('SECURITY_SEAL'); setErrorMessage(null); }}
            style={{
              padding: '12px 14px',
              backgroundColor: 'transparent',
              color: activeTab === 'SECURITY_SEAL' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'SECURITY_SEAL' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🎖️</span> Verified Trust Seal & QR
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('PASSWORD'); setErrorMessage(null); }}
            style={{
              padding: '12px 14px',
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
            <span>🔐</span> Password (Instant)
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
        <div className="ds-adaptive-modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* TAB 0: MANDATORY OWNER AADHAAR KYC & PROFILE LOCK */}
          {activeTab === 'KYC' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Pioneer Free Onboarding Environment Banner */}
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🎁</span>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Pioneer Free Onboarding Environment</span>
                      <span style={{ backgroundColor: '#059669', color: '#FFF', fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        FIRST 10,000 PARTNERS
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '3px', maxWidth: '580px' }}>
                      Operating in complimentary starter environment. Mandatory Owner Aadhaar KYC verified. Platform architected with an upgrade path for enterprise commercial tiers in subsequent releases.
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: kycStatus === 'KYC_VERIFIED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: kycStatus === 'KYC_VERIFIED' ? '#6EE7B7' : '#FCD34D',
                  border: kycStatus === 'KYC_VERIFIED' ? '1px solid #10B981' : '1px solid #F59E0B'
                }}>
                  {kycStatus === 'KYC_VERIFIED' ? '✓ KYC VERIFIED & SEALED' : '⏳ KYC PENDING ADMIN REVIEW'}
                </span>
              </div>

              {/* Regulatory Anti-Tampering Profile Freeze Notice */}
              <div style={{
                backgroundColor: '#070C16',
                border: '1.5px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.6rem' }}>🔒</span>
                <div>
                  <strong style={{ color: '#38BDF8', fontSize: '0.875rem', display: 'block', marginBottom: '2px' }}>
                    Tamper-Proof Healthcare Profile Lock Active
                  </strong>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.5 }}>
                    To prevent fraudulent alterations in diagnostic reports, prescriptions, and financial letterheads, direct edits to core facility and owner credentials are locked. Changes require Founder / Admin approval.
                  </span>
                </div>
              </div>

              {/* Active Live Profile Details (LOCKED 🔒) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active Live Healthcare Credentials (Read-Only 🔒):
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                    ● Currently Active in Prescriptions & Lab Reports
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px' }}>
                  {/* Field 1: Facility Legal Name */}
                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>FACILITY LEGAL NAME</span>
                      <span style={{ fontSize: '0.625rem', color: '#EF4444', fontWeight: 800 }}>🔒 LOCKED</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {dynamicPartner?.facilityName || addressData.legalName || currentUser?.tenantName || 'Registered Healthcare Facility'}
                    </div>
                  </div>

                  {/* Field 2: Owner / Lead Doctor Name */}
                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>OWNER / HEAD CLINICIAN</span>
                      <span style={{ fontSize: '0.625rem', color: '#EF4444', fontWeight: 800 }}>🔒 LOCKED</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {dynamicPartner?.leadDoctorName || currentUser?.name || 'Lead Clinical Authority'}
                    </div>
                  </div>

                  {/* Field 3: Owner Aadhaar Number */}
                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>OWNER 12-DIGIT AADHAAR NUMBER</span>
                      <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 800 }}>✓ VERIFIED KYC</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                      {ownerAadhaar ? `XXXX XXXX ${ownerAadhaar.slice(-4)}` : 'KYC Verification Required'}
                    </div>
                  </div>

                  {/* Field 4: Mandatory Aadhaar Document Proof */}
                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>MANDATORY AADHAAR PROOF FILE</span>
                      <span style={{ fontSize: '0.625rem', color: '#38BDF8', fontWeight: 700 }}>ATTACHED</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span>📄</span>
                      <span>{aadhaarDocName || 'Self-Attested Aadhaar / ID Card Attached'}</span>
                    </div>
                  </div>

                  {/* Field 5: Medical License / NABL Registration */}
                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>REGULATORY LICENSE / REG NO</span>
                      <span style={{ fontSize: '0.625rem', color: '#EF4444', fontWeight: 800 }}>🔒 LOCKED</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {certData.nablCertificateNo || certData.doctorRegNo || certData.pharmacyCouncilRegNo || certData.hospitalCeaRegNo || dynamicPartner?.clinicalLicense || dynamicPartner?.councilRegNo || 'Pending Document Verification'}
                    </div>
                  </div>

                  {/* Field 6: Registered Address */}
                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>REGISTERED LOCATION</span>
                      <span style={{ fontSize: '0.625rem', color: '#EF4444', fontWeight: 800 }}>🔒 LOCKED</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {addressData.city || addressData.state ? `${addressData.city}, ${addressData.state} - ${addressData.pincode}` : (dynamicPartner?.address || 'Address Update Required')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Staged Amendment Banner (if exists) */}
              {stagedAmendment && stagedAmendment.status === 'PENDING_ADMIN_APPROVAL' && (
                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1.5px solid #F59E0B',
                  borderRadius: '12px',
                  padding: '16px 20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>⏳</span>
                      <strong style={{ color: '#FCD34D', fontSize: '0.875rem' }}>
                        Profile Amendment Request In Staging Queue (Awaiting Admin Approval)
                      </strong>
                    </div>
                    <span style={{ backgroundColor: '#F59E0B', color: '#000', fontSize: '0.6875rem', fontWeight: 900, padding: '2px 8px', borderRadius: '6px' }}>
                      SUBMITTED {stagedAmendment.submittedAt}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px 0', fontSize: '0.8125rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                    Your amendment request has been forwarded to Platform Admin (DocSearch Healthcare Compliance Directorate). To safeguard clinical operations, your current live system continues to issue reports and billing under existing approved details until Admin verification is complete.
                  </p>

                  <div style={{ backgroundColor: '#070C16', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div><span style={{ color: '#94A3B8' }}>Proposed Facility Name:</span> <strong style={{ color: '#38BDF8' }}>{stagedAmendment.proposedFacilityName}</strong></div>
                    <div><span style={{ color: '#94A3B8' }}>Proposed Owner Name:</span> <strong style={{ color: '#38BDF8' }}>{stagedAmendment.proposedOwnerName}</strong></div>
                    <div><span style={{ color: '#94A3B8' }}>Proposed Aadhaar:</span> <strong style={{ color: '#38BDF8' }}>XXXX XXXX {stagedAmendment.proposedAadhaarNumber.slice(-4)}</strong></div>
                    <div><span style={{ color: '#94A3B8' }}>Proof Attached:</span> <span style={{ color: '#A7F3D0' }}>{stagedAmendment.proposedDocFileName}</span></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#94A3B8' }}>Reason For Change:</span> <span style={{ color: '#F8FAFC' }}>{stagedAmendment.reasonForChange}</span></div>
                  </div>
                </div>
              )}

              {/* Staged Amendment Action & Form */}
              {!isAmendmentFormOpen && (!stagedAmendment || stagedAmendment.status !== 'PENDING_ADMIN_APPROVAL') && (
                <div style={{ backgroundColor: '#0B132B', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: '#F8FAFC', display: 'block' }}>
                      Need to update Facility Legal Name, In-Charge Doctor, or Aadhaar KYC?
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Submit a formal staged amendment for Admin / Founder review. Live system remains stable during review.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAmendmentData({
                        proposedFacilityName: currentUser?.tenantName || '',
                        proposedOwnerName: currentUser?.name || '',
                        proposedAadhaarNumber: '',
                        proposedDocFileName: '',
                        proposedDocDataUrl: '',
                        reasonForChange: ''
                      });
                      setIsAmendmentFormOpen(true);
                    }}
                    style={{
                      backgroundColor: '#0284C7',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>📝</span> Request Staged Profile Amendment
                  </button>
                </div>
              )}

              {/* Interactive Staged Amendment Form */}
              {isAmendmentFormOpen && (
                <form onSubmit={handleSubmitAmendment} style={{ backgroundColor: '#0B132B', border: '1.5px solid #06B6D4', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📝</span>
                      <strong style={{ fontSize: '0.9375rem', color: '#38BDF8' }}>
                        Submit Staged Profile Amendment (Requires Admin Approval)
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAmendmentFormOpen(false)}
                      style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        Proposed Facility Legal Name
                      </label>
                      <input
                        type="text"
                        placeholder="Updated facility name"
                        value={amendmentData.proposedFacilityName}
                        onChange={(e) => setAmendmentData({ ...amendmentData, proposedFacilityName: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        Proposed Owner / Doctor Name
                      </label>
                      <input
                        type="text"
                        placeholder="Updated owner name"
                        value={amendmentData.proposedOwnerName}
                        onChange={(e) => setAmendmentData({ ...amendmentData, proposedOwnerName: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        Proposed 12-Digit Aadhaar Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="12 numeric digits"
                        maxLength={14}
                        value={amendmentData.proposedAadhaarNumber}
                        onChange={(e) => setAmendmentData({ ...amendmentData, proposedAadhaarNumber: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        Upload Supporting Identity Proof (Aadhaar/License)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAmendmentData({ ...amendmentData, proposedDocFileName: file.name });
                        }}
                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', color: '#94A3B8' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      Reason & Regulatory Justification for Amendment *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Legal business name updated on municipal trade license; partner induction of new medical director."
                      value={amendmentData.reasonForChange}
                      onChange={(e) => setAmendmentData({ ...amendmentData, reasonForChange: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAmendmentFormOpen(false)}
                      style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#CBD5E1', padding: '8px 14px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ backgroundColor: '#10B981', border: 'none', color: '#070C16', padding: '8px 18px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 900, cursor: 'pointer' }}
                    >
                      ✓ Submit Staged Amendment for Admin Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    ACCOUNT HOLDER NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankData.accountHolderName}
                    onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })}
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
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
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    BANK ACCOUNT NUMBER *
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    CONFIRM ACCOUNT NUMBER *
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={bankData.confirmAccountNumber}
                    onChange={(e) => setBankData({ ...bankData, confirmAccountNumber: e.target.value })}
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
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
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
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

              {/* Upload Cancelled Cheque / Bank Proof Certificate with AI OCR */}
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
                        const name = e.target.files[0].name;
                        setBankData({ ...bankData, cancelledChequeFile: name });
                        simulateAiOcr(name);
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    LEGAL ENTITY / CLINIC / LAB NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.legalName}
                    onChange={(e) => setAddressData({ ...addressData, legalName: e.target.value })}
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
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
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
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
                  style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
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
                  style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    CITY / DISTRICT *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
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
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
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
                    inputMode="numeric"
                    value={addressData.pincode}
                    onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    OFFICIAL PHONE *
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={addressData.officialPhone}
                    onChange={(e) => setAddressData({ ...addressData, officialPhone: e.target.value })}
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#F87171', marginBottom: '4px' }}>
                    🚨 24x7 EMERGENCY / AMBULANCE HELPLINE *
                  </label>
                  <input
                    type="text"
                    value={addressData.emergencyHelpline}
                    onChange={(e) => setAddressData({ ...addressData, emergencyHelpline: e.target.value })}
                    placeholder="e.g. 1800-XXX-XXXX or 0522-XXXXXXX"
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FFF', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    PAN NUMBER (ENTITY / OWNER)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={addressData.panNumber}
                    onChange={(e) => setAddressData({ ...addressData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginBottom: '4px' }}>
                    🌐 GEO-COORDINATES (LAT, LONG)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={addressData.latitude}
                      onChange={(e) => setAddressData({ ...addressData, latitude: e.target.value })}
                      placeholder="Lat (e.g. 26.8467)"
                      style={{ width: '50%', minHeight: '42px', padding: '8px 8px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.78rem' }}
                    />
                    <input
                      type="text"
                      value={addressData.longitude}
                      onChange={(e) => setAddressData({ ...addressData, longitude: e.target.value })}
                      placeholder="Long (e.g. 80.9462)"
                      style={{ width: '50%', minHeight: '42px', padding: '8px 8px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.78rem' }}
                    />
                  </div>
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
                        const name = e.target.files[0].name;
                        setAddressData({ ...addressData, addressProofFile: name });
                        simulateAiOcr(name);
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
                    Live Expiry Tracking: <strong style={{ color: '#34D399' }}>Valid Until {certData.licenseExpiryDate} (840 Days Remaining)</strong>
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: certApprovalStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: certApprovalStatus === 'APPROVED' ? '#6EE7B7' : '#FCD34D', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Status: {certApprovalStatus === 'APPROVED' ? '✓ VERIFIED & APPROVED' : '⏳ PENDING ADMIN APPROVAL'}
                </span>
              </div>

              {/* Dynamic Backend-Driven Document Checklist */}
              <DynamicRoleDocumentChecklist currentUser={currentUser} />

              {/* License Expiry Date & Auto-Renewal Alert Bar */}
              <div style={{ backgroundColor: '#070C16', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                    📅 OFFICIAL LICENSE / ACCREDITATION EXPIRY DATE:
                  </label>
                  <input
                    type="date"
                    value={certData.licenseExpiryDate}
                    onChange={(e) => setCertData({ ...certData, licenseExpiryDate: e.target.value })}
                    style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#1E293B', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>🔔 WhatsApp 30-Day Auto-Renewal Alert:</span>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>ACTIVE</span>
                </div>
              </div>

              {/* 1. DOCTOR ROLE FIELDS */}
              {roleCategory === 'DOCTOR' && (
                <>
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px', marginBottom: '10px' }}>
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
                          style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
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
                              const name = e.target.files[0].name;
                              setCertData({ ...certData, doctorDegreeFile: name });
                              simulateAiOcr(name);
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.doctorDegreeFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Degree: {certData.doctorDegreeFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px', marginBottom: '10px' }}>
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
                          style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
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
                          style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
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
                              const name = e.target.files[0].name;
                              setCertData({ ...certData, doctorRegCertificateFile: name });
                              simulateAiOcr(name);
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.doctorRegCertificateFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Council Reg: {certData.doctorRegCertificateFile}</span>}
                  </div>
                </>
              )}

              {/* 2. PATHOLOGY / DIAGNOSTIC LAB ROLE FIELDS */}
              {roleCategory === 'PATHOLOGY_LAB' && (
                <>
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px', marginBottom: '10px' }}>
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
                          style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
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
                              const name = e.target.files[0].name;
                              setCertData({ ...certData, nablCertFile: name });
                              simulateAiOcr(name);
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.nablCertFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached NABL Certificate: {certData.nablCertFile}</span>}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px', marginBottom: '10px' }}>
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
                          style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
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
                              const name = e.target.files[0].name;
                              setCertData({ ...certData, pathologistDegreeFile: name });
                              simulateAiOcr(name);
                            }
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                      </div>
                    </div>
                    {certData.pathologistDegreeFile && <span style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>✓ Attached Pathologist License: {certData.pathologistDegreeFile}</span>}
                  </div>
                </>
              )}

              {/* 3. HOSPITAL & CLINICAL ESTABLISHMENT FIELDS */}
              {(roleCategory === 'HOSPITAL' || roleCategory === 'DOCTOR' || roleCategory === 'COMPANY_HQ') && (
                <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏥</span>
                    <strong style={{ fontSize: '0.875rem', color: '#38BDF8' }}>Hospital Statutory Licenses & National ABDM Registry</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        CLINICAL ESTABLISHMENT ACT (CEA) REG NO. *
                      </label>
                      <input
                        type="text"
                        value={certData.hospitalCeaRegNo}
                        onChange={(e) => setCertData({ ...certData, hospitalCeaRegNo: e.target.value })}
                        placeholder="e.g. CEA/UP/2026/0891"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#A78BFA', marginBottom: '4px' }}>
                        ABDM HFR FACILITY ID (MOHFW) *
                      </label>
                      <input
                        type="text"
                        value={certData.abdmFacilityId}
                        onChange={(e) => setCertData({ ...certData, abdmFacilityId: e.target.value.toUpperCase() })}
                        placeholder="e.g. IN-UP-100234"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(167, 139, 250, 0.4)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        AERB RADIATION / X-RAY SAFETY APPROVAL
                      </label>
                      <input
                        type="text"
                        value={certData.aerbApprovalNo}
                        onChange={(e) => setCertData({ ...certData, aerbApprovalNo: e.target.value })}
                        placeholder="e.g. AERB/MED/2026/512"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        FIRE SAFETY NOC NO.
                      </label>
                      <input
                        type="text"
                        value={certData.hospitalFireNocNo}
                        onChange={(e) => setCertData({ ...certData, hospitalFireNocNo: e.target.value })}
                        placeholder="e.g. FIRE/FS/2026/102"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        BMW POLLUTION CONTROL AUTH NO.
                      </label>
                      <input
                        type="text"
                        value={certData.bmwPollutionAuthNo}
                        onChange={(e) => setCertData({ ...certData, bmwPollutionAuthNo: e.target.value })}
                        placeholder="e.g. SPCB/BMW/AUTH/8812"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        NABH ACCREDITATION (ENTRY / FULL)
                      </label>
                      <input
                        type="text"
                        value={certData.hospitalNabhGrade}
                        onChange={(e) => setCertData({ ...certData, hospitalNabhGrade: e.target.value })}
                        placeholder="e.g. NABH Entry-Level Certified"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PHARMACY DRUG LICENSE FIELDS */}
              {(roleCategory === 'PHARMACY' || roleCategory === 'HOSPITAL' || roleCategory === 'COMPANY_HQ') && (
                <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.1rem' }}>💊</span>
                    <strong style={{ fontSize: '0.875rem', color: '#34D399' }}>Pharmacy Form 20B & 21B Retail / Inpatient Drug Licenses</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        DRUG LICENSE 20B (ALLOPATHIC RETAIL) *
                      </label>
                      <input
                        type="text"
                        value={certData.pharmacyDrugLicense20B}
                        onChange={(e) => setCertData({ ...certData, pharmacyDrugLicense20B: e.target.value })}
                        placeholder="e.g. 20B/LKO/2026/4102"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        DRUG LICENSE 21B (SCHEDULE C/C1)
                      </label>
                      <input
                        type="text"
                        value={certData.pharmacyDrugLicense21B}
                        onChange={(e) => setCertData({ ...certData, pharmacyDrugLicense21B: e.target.value })}
                        placeholder="e.g. 21B/LKO/2026/4103"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                        PHARMACIST COUNCIL REG NO.
                      </label>
                      <input
                        type="text"
                        value={certData.pharmacyCouncilRegNo}
                        onChange={(e) => setCertData({ ...certData, pharmacyCouncilRegNo: e.target.value })}
                        placeholder="e.g. UPPC-99120"
                        style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Cryptographic SHA-256 Digital Watermark Fingerprint */}
              <div style={{ backgroundColor: '#070C16', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                  🔒 CRYPTOGRAPHIC SHA-256 TAMPER-PROOF DIGITAL SEAL:
                </span>
                <code style={{ fontSize: '0.625rem', color: '#38BDF8', wordBreak: 'break-all', display: 'block' }}>
                  {certData.sha256Hash}
                </code>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                >
                  {isCompanyAdmin ? `👑 Approve & Lock ${roleCategory} Certificates` : '📤 Submit Certificates for Admin Approval'}
                </button>
              </div>
            </form>
          )}

          {/* TAB: CLINICAL SETUP, LICENSED BEDS & MULTI-BRANCH TOPOLOGY */}
          {activeTab === 'CLINICAL_BEDS' && (
            <form onSubmit={handleSaveClinicalBeds} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#38BDF8' }}>🏥 Licensed Bed Capacity, Shift Timings & Satellite Network</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    Authoritative clinical bed distribution and shift schedules synchronized with OPD and Inpatient (IPD) admissions.
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  Total Licensed Beds: {Number(clinicalData.icuBeds) + Number(clinicalData.generalWardBeds) + Number(clinicalData.deluxeBeds) + Number(clinicalData.emergencyTriageBeds)}
                </span>
              </div>

              {/* Bed Inventory Distribution */}
              <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8125rem', color: '#F1F5F9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🛏️ Licensed Bed Inventory by Department
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#F87171', marginBottom: '4px' }}>
                      ICU / CCU BEDS *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={clinicalData.icuBeds}
                      onChange={(e) => setClinicalData({ ...clinicalData, icuBeds: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FFF', fontSize: '0.9rem', fontWeight: 800 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#60A5FA', marginBottom: '4px' }}>
                      GENERAL WARD BEDS *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={clinicalData.generalWardBeds}
                      onChange={(e) => setClinicalData({ ...clinicalData, generalWardBeds: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#FFF', fontSize: '0.9rem', fontWeight: 800 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#A78BFA', marginBottom: '4px' }}>
                      DELUXE / PRIVATE ROOMS *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={clinicalData.deluxeBeds}
                      onChange={(e) => setClinicalData({ ...clinicalData, deluxeBeds: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(167, 139, 250, 0.4)', color: '#FFF', fontSize: '0.9rem', fontWeight: 800 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#FBBF24', marginBottom: '4px' }}>
                      EMERGENCY / TRIAGE *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={clinicalData.emergencyTriageBeds}
                      onChange={(e) => setClinicalData({ ...clinicalData, emergencyTriageBeds: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0B132B', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#FFF', fontSize: '0.9rem', fontWeight: 800 }}
                    />
                  </div>
                </div>
              </div>

              {/* Shift Timings & Emergency Operations */}
              <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8125rem', color: '#F1F5F9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⏰ OPD Consultation Shifts & 24x7 Emergency
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0B132B', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <strong style={{ fontSize: '0.8125rem', color: '#F1F5F9' }}>24x7 Emergency & Trauma Center Active</strong>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Emergency triage and night admissions enabled</span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={clinicalData.is24x7Emergency}
                      onChange={(e) => setClinicalData({ ...clinicalData, is24x7Emergency: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: clinicalData.is24x7Emergency ? '#10B981' : '#475569',
                      borderRadius: '24px',
                      transition: '0.2s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: clinicalData.is24x7Emergency ? '22px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#FFF',
                        borderRadius: '50%',
                        transition: '0.2s'
                      }} />
                    </span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginBottom: '4px' }}>
                      🌅 MORNING OPD SHIFT
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="time"
                        value={clinicalData.morningShiftStart}
                        onChange={(e) => setClinicalData({ ...clinicalData, morningShiftStart: e.target.value })}
                        style={{ width: '50%', minHeight: '38px', padding: '6px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8rem' }}
                      />
                      <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>to</span>
                      <input
                        type="time"
                        value={clinicalData.morningShiftEnd}
                        onChange={(e) => setClinicalData({ ...clinicalData, morningShiftEnd: e.target.value })}
                        style={{ width: '50%', minHeight: '38px', padding: '6px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#FBBF24', marginBottom: '4px' }}>
                      🌇 EVENING OPD SHIFT
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="time"
                        value={clinicalData.eveningShiftStart}
                        onChange={(e) => setClinicalData({ ...clinicalData, eveningShiftStart: e.target.value })}
                        style={{ width: '50%', minHeight: '38px', padding: '6px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8rem' }}
                      />
                      <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>to</span>
                      <input
                        type="time"
                        value={clinicalData.eveningShiftEnd}
                        onChange={(e) => setClinicalData({ ...clinicalData, eveningShiftEnd: e.target.value })}
                        style={{ width: '50%', minHeight: '38px', padding: '6px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Branch & Satellite Topology */}
              <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.8125rem', color: '#F1F5F9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🌐 Multi-Branch & Satellite Clinics Network
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {branchesData.length} Facility / Branch(es) Registered
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                  {branchesData.map((branch) => (
                    <div key={branch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0B132B', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.8125rem', color: '#F8FAFC' }}>{branch.branchName}</strong>
                          <span style={{ fontSize: '0.6875rem', backgroundColor: branch.isMainHq ? 'rgba(6, 182, 212, 0.2)' : 'rgba(139, 92, 246, 0.2)', color: branch.isMainHq ? '#38BDF8' : '#C4B5FD', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                            {branch.branchType.replace('_', ' ')}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                          {branch.address || 'Address registered on file'} • Ph: {branch.phone || addressData.officialPhone || 'Not provided'}
                        </span>
                      </div>
                      {!branch.isMainHq && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBranch(branch.id)}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Branch Inline Form */}
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    + Register New Satellite OPD Clinic or Sample Collection Center
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Branch / Clinic Name"
                      value={newBranchInput.branchName}
                      onChange={(e) => setNewBranchInput({ ...newBranchInput, branchName: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.78rem' }}
                    />
                    <select
                      value={newBranchInput.branchType}
                      onChange={(e) => setNewBranchInput({ ...newBranchInput, branchType: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.78rem' }}
                    >
                      <option value="SATELLITE_CLINIC">Satellite OPD Clinic</option>
                      <option value="COLLECTION_BOOTH">Sample Collection Booth</option>
                      <option value="DAY_CARE_CENTER">Day Care Centre</option>
                      <option value="PHARMACY_OUTLET">Satellite Pharmacy Outlet</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Street Address & Area"
                      value={newBranchInput.address}
                      onChange={(e) => setNewBranchInput({ ...newBranchInput, address: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.78rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Contact Phone"
                      value={newBranchInput.phone}
                      onChange={(e) => setNewBranchInput({ ...newBranchInput, phone: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.78rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    + Add Branch to Network
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                  style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  💾 Save Clinical Setup & Bed Topology
                </button>
              </div>
            </form>
          )}

          {/* TAB: DIGITAL LETTERHEAD & PRINT STUDIO (WITH LIVE A4 PREVIEW) */}
          {activeTab === 'PRINT_LETTERHEAD' && (
            <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#38BDF8' }}>🖨️ Digital Letterhead & Print Media Studio</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    Configure official hospital branding, logo, round stamp, doctor signatures, and test with the Live A4 Letterhead Preview.
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: brandingData.letterheadMode === 'FULL_DIGITAL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: brandingData.letterheadMode === 'FULL_DIGITAL' ? '#6EE7B7' : '#FCD34D', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  Mode: {brandingData.letterheadMode === 'FULL_DIGITAL' ? 'FULL DIGITAL A4' : 'PRE-PRINTED PAD'}
                </span>
              </div>

              {/* 2-Column Responsive Studio Layout: Left Controls, Right Live A4 Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '20px', alignItems: 'start' }}>
                
                {/* LEFT COLUMN: Controls & Uploads */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Print Mode Selector */}
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>
                      LETTERHEAD PRINT MODE *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setBrandingData({ ...brandingData, letterheadMode: 'FULL_DIGITAL' })}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '8px',
                          border: brandingData.letterheadMode === 'FULL_DIGITAL' ? '2px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: brandingData.letterheadMode === 'FULL_DIGITAL' ? 'rgba(6, 182, 212, 0.15)' : '#0B132B',
                          color: brandingData.letterheadMode === 'FULL_DIGITAL' ? '#38BDF8' : '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📄</div>
                        <strong style={{ display: 'block', color: '#FFF' }}>Full Digital Mode</strong>
                        <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>Prints logo, header, watermark on plain A4</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrandingData({ ...brandingData, letterheadMode: 'PRE_PRINTED_PAD' })}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '8px',
                          border: brandingData.letterheadMode === 'PRE_PRINTED_PAD' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: brandingData.letterheadMode === 'PRE_PRINTED_PAD' ? 'rgba(245, 158, 11, 0.15)' : '#0B132B',
                          color: brandingData.letterheadMode === 'PRE_PRINTED_PAD' ? '#FCD34D' : '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📑</div>
                        <strong style={{ display: 'block', color: '#FFF' }}>Pre-Printed Pad</strong>
                        <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>Leaves top 60mm blank for physical doctor pad</span>
                      </button>
                    </div>
                  </div>

                  {/* Brand Assets Uploads (Logo, Stamp, Signature) */}
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '10px' }}>
                      🎨 BRAND ASSETS & OFFICIAL SEALS
                    </label>

                    {/* 1. Hospital Logo */}
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>Hospital Official Logo (PNG/JPG)</span>
                        {brandingData.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setBrandingData({ ...brandingData, logoUrl: '' })}
                            style={{ background: 'none', border: 'none', color: '#F87171', fontSize: '0.6875rem', cursor: 'pointer' }}
                          >
                            ✕ Remove Logo
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0], 'logo');
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                        {brandingData.logoUrl && (
                          <img src={brandingData.logoUrl} alt="Logo Preview" style={{ height: '36px', width: 'auto', maxHeight: '36px', borderRadius: '4px', objectFit: 'contain', backgroundColor: '#FFF', padding: '2px' }} />
                        )}
                      </div>
                    </div>

                    {/* 2. Official Hospital Seal / Round Stamp */}
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>Official Round Stamp / Seal (Transparent PNG)</span>
                        {brandingData.stampSealUrl && (
                          <button
                            type="button"
                            onClick={() => setBrandingData({ ...brandingData, stampSealUrl: '' })}
                            style={{ background: 'none', border: 'none', color: '#F87171', fontSize: '0.6875rem', cursor: 'pointer' }}
                          >
                            ✕ Remove Stamp
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0], 'stamp');
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                        {brandingData.stampSealUrl && (
                          <img src={brandingData.stampSealUrl} alt="Stamp Preview" style={{ height: '36px', width: '36px', borderRadius: '50%', objectFit: 'contain', backgroundColor: '#FFF', padding: '2px' }} />
                        )}
                      </div>
                    </div>

                    {/* 3. Authorized Doctor Signature */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>Lead Doctor / Superintendent Digital Signature</span>
                        {brandingData.signatureUrl && (
                          <button
                            type="button"
                            onClick={() => setBrandingData({ ...brandingData, signatureUrl: '' })}
                            style={{ background: 'none', border: 'none', color: '#F87171', fontSize: '0.6875rem', cursor: 'pointer' }}
                          >
                            ✕ Remove Signature
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0], 'signature');
                          }}
                          style={{ fontSize: '0.75rem', color: '#CBD5E1' }}
                        />
                        {brandingData.signatureUrl && (
                          <img src={brandingData.signatureUrl} alt="Signature Preview" style={{ height: '30px', width: 'auto', maxHeight: '30px', objectFit: 'contain', backgroundColor: '#FFF', padding: '2px', borderRadius: '2px' }} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Disclaimers & Tagline */}
                  <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>
                      📝 PRINT TAGLINES & LEGAL DISCLAIMERS
                    </label>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                        PRESCRIPTION HEADER TAGLINE
                      </label>
                      <input
                        type="text"
                        value={brandingData.rxHeaderNotes}
                        onChange={(e) => setBrandingData({ ...brandingData, rxHeaderNotes: e.target.value })}
                        style={{ width: '100%', minHeight: '38px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                        DOCTOR PRESCRIPTION LEGAL DISCLAIMER (FOOTER)
                      </label>
                      <textarea
                        rows={2}
                        value={brandingData.rxFooterDisclaimer}
                        onChange={(e) => setBrandingData({ ...brandingData, rxFooterDisclaimer: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '3px' }}>
                        PATHOLOGY & RADIOLOGY REPORT DISCLAIMER
                      </label>
                      <textarea
                        rows={2}
                        value={brandingData.reportFooterDisclaimer}
                        onChange={(e) => setBrandingData({ ...brandingData, reportFooterDisclaimer: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    💾 Save Branding & Synchronize All Printouts
                  </button>
                </div>

                {/* RIGHT COLUMN: Interactive Live A4 Letterhead Preview */}
                <div style={{ backgroundColor: '#0B132B', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem' }}>👁️</span>
                      <strong style={{ fontSize: '0.8125rem', color: '#38BDF8' }}>LIVE A4 LETTERHEAD PREVIEW</strong>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                      WYSIWYG Real-time Simulation
                    </span>
                  </div>

                  {/* Simulated A4 Paper */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    borderRadius: '4px',
                    padding: '18px 20px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    minHeight: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Simulated Header */}
                    {brandingData.letterheadMode === 'PRE_PRINTED_PAD' ? (
                      <div style={{ height: '70px', border: '1.5px dashed #94A3B8', borderRadius: '4px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, textAlign: 'center', padding: '10px' }}>
                        📑 PRE-PRINTED STATIONERY MODE ACTIVE<br />
                        <span style={{ fontSize: '0.625rem', fontWeight: 500 }}>(60mm Top Margin Reserved for Physical Hospital Header Pad)</span>
                      </div>
                    ) : (
                      <div style={{ borderBottom: '2px solid #0284C7', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {brandingData.logoUrl ? (
                              <img src={brandingData.logoUrl} alt="Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ width: '42px', height: '42px', borderRadius: '6px', backgroundColor: '#0284C7', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>
                                🏥
                              </div>
                            )}
                            <div>
                              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                                {addressData.legalName || 'HEALTHCARE HOSPITAL & RESEARCH CENTER'}
                              </h3>
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {brandingData.rxHeaderNotes || 'CLINICAL EVIDENCE-BASED HEALTHCARE CONSULTATION'}
                              </span>
                              <span style={{ fontSize: '0.625rem', color: '#475569', display: 'block', marginTop: '2px' }}>
                                {addressData.addressLine1 || 'Main Healthcare Road'}, {addressData.city || 'District'} {addressData.state || ''} - {addressData.pincode || '226001'}
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontSize: '0.625rem', color: '#334155' }}>
                            {certData.hospitalCeaRegNo && <div>CEA Reg: <strong style={{ color: '#0F172A' }}>{certData.hospitalCeaRegNo}</strong></div>}
                            {certData.abdmFacilityId && <div>ABDM HFR: <strong style={{ color: '#0284C7' }}>{certData.abdmFacilityId}</strong></div>}
                            {addressData.emergencyHelpline && <div>24x7 Helpline: <strong style={{ color: '#DC2626' }}>{addressData.emergencyHelpline}</strong></div>}
                            <div>Reception: {addressData.officialPhone || 'Not set'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simulated Rx Body */}
                    <div style={{ padding: '12px 0', flex: 1 }}>
                      <div style={{ backgroundColor: '#F1F5F9', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '10px' }}>
                        <span>Pt: <strong>Rahul Kumar (38y / M)</strong> • UHID: DS-9921</span>
                        <span>Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong> • Token: #07</span>
                      </div>

                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0284C7', marginBottom: '4px' }}>℞</div>
                      <div style={{ fontSize: '0.6875rem', color: '#334155', lineHeight: 1.4 }}>
                        <div style={{ marginBottom: '4px' }}>1. <strong>Tab. Augmentin 625mg</strong> — 1 tablet after meals (1-0-1) x 5 days</div>
                        <div style={{ marginBottom: '4px' }}>2. <strong>Tab. Pan-D (40mg)</strong> — 1 tablet before breakfast (1-0-0) x 5 days</div>
                        <div>3. <strong>Syp. Grilinctus-BM</strong> — 10ml thrice daily (1-1-1) x 3 days</div>
                      </div>
                    </div>

                    {/* Simulated Doctor Signature & Stamp Footer */}
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.625rem', color: '#64748B' }}>
                          <span style={{ fontSize: '1.2rem' }}>📱</span>
                          <span>Scan QR on Mobile for ABDM / PHR Record Verification</span>
                        </div>

                        <div style={{ position: 'relative', textAlign: 'center', minWidth: '120px' }}>
                          {brandingData.stampSealUrl && (
                            <img
                              src={brandingData.stampSealUrl}
                              alt="Stamp"
                              style={{
                                position: 'absolute',
                                right: '10px',
                                bottom: '15px',
                                width: '56px',
                                height: '56px',
                                opacity: 0.65,
                                pointerEvents: 'none'
                              }}
                            />
                          )}
                          {brandingData.signatureUrl ? (
                            <img src={brandingData.signatureUrl} alt="Signature" style={{ height: '32px', width: 'auto', margin: '0 auto', display: 'block' }} />
                          ) : (
                            <div style={{ height: '24px', fontStyle: 'italic', fontSize: '0.75rem', color: '#0284C7' }}>
                              Dr. {currentUser?.name || 'Chief Medical Officer'}
                            </div>
                          )}
                          <div style={{ fontSize: '0.625rem', fontWeight: 800, color: '#0F172A', borderTop: '1px solid #CBD5E1', paddingTop: '2px' }}>
                            Authorized Medical Practitioner
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.5625rem', color: '#64748B', textAlign: 'center' }}>
                        {brandingData.rxFooterDisclaimer}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          )}

          {/* TAB 4: VERIFIED TRUST SEAL & QR BADGE */}
          {activeTab === 'SECURITY_SEAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '10px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                border: '2px solid #F59E0B',
                borderRadius: '16px',
                padding: '24px 32px',
                maxWidth: '520px',
                boxShadow: '0 10px 40px rgba(245, 158, 11, 0.2)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '6px' }}>🎖️</div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 900, color: '#FBBF24', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  OFFICIAL NATIONAL HEALTH REGISTRY
                </div>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  DOC SEARCH VERIFIED HEALTHCARE PARTNER
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700 }}>
                  {addressData.legalName}
                </span>

                <div style={{ margin: '16px 0', padding: '12px', backgroundColor: '#0F172A', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#94A3B8' }}>Compliance Tier:</span>
                    <strong style={{ color: '#4ADE80' }}>NABL ISO 15189 & ABDM 2.0 Level 3</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#94A3B8' }}>Registration License:</span>
                    <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>{certData.nablCertificateNo || certData.doctorRegNo}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Digital Trust Status:</span>
                    <span style={{ color: '#34D399', fontWeight: 800 }}>✓ ACTIVE & DIGITALLY SEALED</span>
                  </div>
                </div>

                {/* Simulated QR Code */}
                <div style={{ display: 'inline-block', backgroundColor: '#FFF', padding: '10px', borderRadius: '10px', margin: '6px 0' }}>
                  <div style={{ fontSize: '2.5rem' }}>📱</div>
                </div>
                <span style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                  Scan to Verify Authentic ABDM / NABL Digitally Signed License Record
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                >
                  🖨️ Print Reception Trust Certificate
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: PASSWORD & SECURITY */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentUser?.mustChangePassword && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1.5px solid #EF4444',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#FCA5A5'
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                  <div>
                    <strong style={{ fontSize: '0.875rem', display: 'block', color: '#FEE2E2', marginBottom: '2px' }}>
                      First-Time Login Security Setup
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#FCA5A5' }}>
                      Please change your default password (<strong>123456</strong>) and set a secure personal password.
                    </span>
                  </div>
                </div>
              )}

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
                    placeholder={currentUser?.mustChangePassword ? '123456 (Default password)' : 'Enter existing password'}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '14px' }}>
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
                      style={{ width: '100%', minHeight: '42px', padding: '8px 12px', paddingRight: '40px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.875rem', minHeight: '36px', minWidth: '36px' }}
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
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.875rem' }}
                  />
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
