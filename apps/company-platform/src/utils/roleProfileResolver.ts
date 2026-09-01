export interface VerifiedRoleProfile {
  roleCategory: 'DOCTOR' | 'PATHOLOGY_LAB' | 'HOSPITAL' | 'PHARMACY' | 'STAFF_OPERATIONS' | 'COMPANY_HQ';
  entityLegalName: string;
  facilityTagline: string;
  officialAddress: string;
  contactPhone: string;
  supportEmail: string;
  website: string;
  gstin: string;
  
  // Doctor Credentials
  doctorName: string;
  doctorDegree: string;
  doctorCouncilName: string;
  doctorRegNo: string;
  doctorSpecialty: string;
  doctorIndemnityNo: string;

  // Lab Credentials
  nablCertificateNo: string;
  pathologistName: string;
  pathologistDegree: string;
  pathologistRegNo: string;
  bmwClearanceNo: string;

  // Hospital Credentials
  hospitalCeaRegNo: string;
  hospitalNabhGrade: string;
  hospitalFireNocNo: string;

  // Pharmacy Credentials
  pharmacyDrugLicense20B: string;
  pharmacyDrugLicense21B: string;
  pharmacistName: string;
  pharmacistRegNo: string;
  pharmacistDegree: string;

  // Bank & Settlement
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;

  // Verification & Trust Badge
  isVerified: boolean;
  sha256Hash: string;
  trustBadgeTitle: string;
}

export const getVerifiedRoleProfile = (): VerifiedRoleProfile => {
  let authUser: any = null;
  let savedSettings: any = null;

  if (typeof window !== 'undefined') {
    try {
      const authStr = localStorage.getItem('docsearch_partner_staff_auth');
      if (authStr) authUser = JSON.parse(authStr);
    } catch {}

    try {
      const userKey = authUser?.email || 'default_user';
      const settingsStr = localStorage.getItem(`docsearch_account_settings_${userKey}`);
      if (settingsStr) savedSettings = JSON.parse(settingsStr);
    } catch {}
  }

  const role = (authUser?.role || '').toUpperCase();
  const org = (authUser?.organizationType || '').toUpperCase();
  const dept = (authUser?.department || '').toUpperCase();
  const email = (authUser?.email || '').toLowerCase();

  let roleCategory: VerifiedRoleProfile['roleCategory'] = 'DOCTOR';
  if (role.includes('SUPER_ADMIN') || role.includes('COMPANY') || email.includes('docsearch.health')) {
    roleCategory = 'COMPANY_HQ';
  } else if (role.includes('PATHOLOGIST') || org === 'PATHOLOGY' || org === 'DIAGNOSTIC_CENTRE' || dept.includes('PATHOLOGY') || email.includes('tata')) {
    roleCategory = 'PATHOLOGY_LAB';
  } else if (role.includes('PHARMACIST') || org === 'PHARMACY' || dept.includes('PHARMACY')) {
    roleCategory = 'PHARMACY';
  } else if (role.includes('DOCTOR') || role.includes('SURGEON') || role.includes('PHYSICIAN') || role.includes('RADIOLOGIST') || role.includes('PEDIATRICIAN') || role.includes('CONSULTANT')) {
    roleCategory = 'DOCTOR';
  } else if (role.includes('HOSPITAL_ADMIN') || role.includes('DIRECTOR') || role.includes('ORGANIZATION_ADMIN') || org === 'HOSPITAL' || org === 'CLINIC') {
    roleCategory = 'HOSPITAL';
  } else {
    roleCategory = 'STAFF_OPERATIONS';
  }

  const bank = savedSettings?.bank || {};
  const addr = savedSettings?.address || {};
  const cert = savedSettings?.certificates || {};
  const isApproved = savedSettings?.certApprovalStatus === 'APPROVED' || savedSettings?.bankApprovalStatus === 'APPROVED';

  // Base facility defaults
  const isTata = email.includes('tata') || authUser?.tenantName?.includes('Tata');
  const entityLegalName = addr.legalName || (isTata ? 'Tata Pathology & Diagnostic Laboratory' : 'Apex Multi-Specialty Hospital & Research Center');
  const officialAddress = addr.addressLine1 ? `${addr.addressLine1}, ${addr.addressLine2 ? addr.addressLine2 + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}` : (isTata ? 'Plot No. 42, Health City Avenue, Main Road, Mumbai, Maharashtra - 400021' : 'Plot No. 14, Health City, Outer Ring Road, New Delhi, Delhi - 110048');
  const contactPhone = addr.officialPhone || '+91 98765 43210';
  const supportEmail = addr.supportEmail || authUser?.email || 'care@docsearch.health';
  const website = addr.website || 'https://www.docsearch.health';
  const gstin = addr.gstin || '27AAAAA0000A1Z5';

  return {
    roleCategory,
    entityLegalName,
    facilityTagline: roleCategory === 'PATHOLOGY_LAB'
      ? 'NABL ACCREDITED LAB (ISO 15189:2022) • ICMR APPROVED • CAP COMPLIANT'
      : roleCategory === 'HOSPITAL'
      ? 'NABH ACCREDITED MULTI-SPECIALTY TERTIARY CARE HOSPITAL • CEA LICENSED'
      : roleCategory === 'PHARMACY'
      ? 'REGISTERED 24x7 ALLOPATHIC & CRITICAL CARE PHARMACY • FORM 20B/21B'
      : 'CLINICAL EXCELLENCE & EVIDENCE-BASED HEALTHCARE CONSULTATION',
    officialAddress,
    contactPhone,
    supportEmail,
    website,
    gstin,

    // Doctor Credentials
    doctorName: authUser?.name || 'Dr. Rajesh Kumar, MD',
    doctorDegree: cert.doctorDegreeName || 'MBBS, MD (Internal Medicine)',
    doctorCouncilName: cert.doctorCouncilName || 'Maharashtra Medical Council (MMC)',
    doctorRegNo: cert.doctorRegNo || 'MMC-78291-B',
    doctorSpecialty: authUser?.roleTitle || 'Consultant Physician & Diabetologist',
    doctorIndemnityNo: cert.doctorIndemnityPolicyNo || 'IND-ICICI-2026-9901',

    // Lab Credentials
    nablCertificateNo: cert.nablCertificateNo || 'MC-4892-2026 (ISO 15189:2022)',
    pathologistName: 'Dr. R. K. Tata, MD (Pathology)',
    pathologistDegree: 'MD (Pathology & Cytogenetics)',
    pathologistRegNo: cert.doctorRegNo || 'MMC-78291-B',
    bmwClearanceNo: cert.bmwPollutionAuthNo || 'BMW-POLLUTION-2026-441',

    // Hospital Credentials
    hospitalCeaRegNo: cert.hospitalCeaRegNo || 'CEA-MH-2026-9812',
    hospitalNabhGrade: cert.hospitalNabhGrade || 'NABH Full Accreditation (Entry Level)',
    hospitalFireNocNo: cert.hospitalFireNocNo || 'FIRE-NOC-MUM-2026-102',

    // Pharmacy Credentials
    pharmacyDrugLicense20B: cert.pharmacyDrugLicense20B || 'DL-20B-MH-Mumbai-49102',
    pharmacyDrugLicense21B: cert.pharmacyDrugLicense21B || 'DL-21B-MH-Mumbai-49103',
    pharmacistName: 'Amit V. Patel, M.Pharm',
    pharmacistRegNo: cert.pharmacyCouncilRegNo || 'MH-PHARM-2026-4421',
    pharmacistDegree: 'M.Pharm (Clinical Pharmacy)',

    // Bank & Settlement
    bankName: bank.bankName || 'HDFC Bank Ltd',
    accountHolder: bank.accountHolderName || entityLegalName,
    accountNumber: bank.accountNumber || '50200084920192',
    ifscCode: bank.ifscCode || 'HDFC0000240',
    upiId: bank.upiId || 'docsearch.settlement@okhdfcbank',

    // Verification & Trust
    isVerified: isApproved,
    sha256Hash: cert.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    trustBadgeTitle: 'DOC SEARCH VERIFIED HEALTHCARE PARTNER (ABDM 2.0 / NABL COMPLIANT)'
  };
};
