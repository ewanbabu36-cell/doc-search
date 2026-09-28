/**
 * Partner Profile Completion Guard
 * Enforces mandatory statutory profile updates before allowing Bill/Invoice printing
 * or Clinical Lab Report generation.
 */

export interface MissingProfileField {
  id: string;
  label: string;
  labelHindi: string;
  tab: 'ADDRESS' | 'KYC' | 'CERTIFICATES' | 'BANK';
  description: string;
}

export interface PartnerProfileGuardStatus {
  isUpdated: boolean;
  facilityLegalName: string;
  missingFields: MissingProfileField[];
  regOrLicenseNo?: string;
  addressSummary?: string;
  officialPhone?: string;
}

export function getActiveUserEmail(): string {
  if (typeof window === 'undefined') return 'default_user';
  try {
    const authStr = localStorage.getItem('docsearch_partner_staff_auth');
    if (authStr) {
      const parsed = JSON.parse(authStr);
      if (parsed?.email) return parsed.email.toLowerCase().trim();
    }
  } catch {}
  return 'default_user';
}

/**
 * Evaluates whether the currently authenticated partner has completed
 * and updated their official facility profile.
 */
export function checkPartnerProfileStatus(userEmailOverride?: string): PartnerProfileGuardStatus {
  if (typeof window === 'undefined') {
    return { isUpdated: true, facilityLegalName: 'Healthcare Facility', missingFields: [] };
  }

  const email = (userEmailOverride || getActiveUserEmail()).toLowerCase().trim();

  // Founder is authorized for automated audit/dev pipelines
  if (email === 'founder@docsearch.health') {
    return {
      isUpdated: true,
      facilityLegalName: 'DocSearch Health Founder Facility',
      missingFields: []
    };
  }

  const explicitUpdatedKey = `docsearch_partner_profile_updated_${email}`;
  const isExplicitlyUpdated = localStorage.getItem(explicitUpdatedKey) === 'true';

  const settingsKey = `docsearch_account_settings_${email}`;
  let savedSettings: any = null;
  try {
    const raw = localStorage.getItem(settingsKey);
    if (raw) savedSettings = JSON.parse(raw);
  } catch {}

  let authUser: any = null;
  try {
    const authStr = localStorage.getItem('docsearch_partner_staff_auth');
    if (authStr) authUser = JSON.parse(authStr);
  } catch {}

  let regPartner: any = null;
  try {
    const regList = JSON.parse(localStorage.getItem('docsearch_registered_partners') || '[]');
    regPartner = regList.find((p: any) =>
      (p.email && p.email.toLowerCase().trim() === email) ||
      (p.phone && authUser?.phone && p.phone === authUser.phone) ||
      (p.id && (p.id === authUser?.partnerId || p.id === authUser?.id))
    );
  } catch {}

  const missingFields: MissingProfileField[] = [];

  const addr = savedSettings?.address || {};
  const cert = savedSettings?.certificates || {};
  const legalName = (addr.legalName || regPartner?.facilityName || authUser?.tenantName || '').trim();
  const addressLine1 = (addr.addressLine1 || regPartner?.address || regPartner?.addressLine1 || '').trim();
  const city = (addr.city || regPartner?.city || '').trim();
  const pincode = (addr.pincode || regPartner?.pincode || '').trim();
  const phone = (addr.officialPhone || regPartner?.phone || authUser?.phone || '').trim();

  // 1. Legal Name Check
  if (!legalName || legalName.length < 3) {
    missingFields.push({
      id: 'legalName',
      label: 'Hospital / Facility Legal Name',
      labelHindi: 'अस्पताल / क्लिनिक का पूरा नाम',
      tab: 'ADDRESS',
      description: 'Official registered entity name for legal billing header'
    });
  }

  // 2. Physical Address Check
  if (!addressLine1 || !city || !pincode || pincode.length !== 6) {
    missingFields.push({
      id: 'address',
      label: 'Complete Facility Address & 6-Digit PIN',
      labelHindi: 'अस्पताल का पूरा पता एवं पिनकोड',
      tab: 'ADDRESS',
      description: 'Premises location required for statutory medical records & invoices'
    });
  }

  // 3. Official Contact Number Check
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    missingFields.push({
      id: 'phone',
      label: 'Official Contact / Reception Phone Number',
      labelHindi: 'रिसेप्शन / अस्पताल का संपर्क नंबर',
      tab: 'ADDRESS',
      description: 'Emergency patient inquiry phone printed on bill & test slips'
    });
  }

  // 4. Clinical Establishment License / Council Registration Check
  const hasHospitalLic = (cert.hospitalCeaRegNo || '').trim().length > 3;
  const hasDoctorReg = (cert.doctorRegNo || '').trim().length > 3;
  const hasPharmLic = ((cert.pharmacyCouncilRegNo || '') + (cert.pharmacyDrugLicense20B || '')).trim().length > 3;
  const hasLabAccreditation = ((cert.nablCertificateNo || '') + (cert.bmwPollutionAuthNo || '')).trim().length > 3;
  const hasRegPartnerLic = (
    (regPartner?.clinicalLicense || '') +
    (regPartner?.licenseNumber || '') +
    (authUser?.clinicalLicense || '') +
    (authUser?.licenseNumber || '')
  ).trim().length > 3;

  if (!hasHospitalLic && !hasDoctorReg && !hasPharmLic && !hasLabAccreditation && !hasRegPartnerLic) {
    missingFields.push({
      id: 'license',
      label: 'Registration / Clinical Establishment (CEA) License No.',
      labelHindi: 'रजिस्ट्रेशन / मेडिकल काउंसिल लाइसेंस नंबर',
      tab: 'CERTIFICATES',
      description: 'Statutory registration license required for lawful clinical report & billing dispatch'
    });
  }

  // The profile is considered updated if confirmed in DB (authUser.isProfileCompleted) OR locally confirmed with core fields present
  const isComplete = authUser?.isProfileCompleted === true || (missingFields.length === 0 && (isExplicitlyUpdated || !!savedSettings?.isProfileUpdated));

  return {
    isUpdated: isComplete,
    facilityLegalName: legalName || 'Unregistered Healthcare Facility',
    missingFields,
    regOrLicenseNo:
      cert.hospitalCeaRegNo ||
      cert.doctorRegNo ||
      cert.pharmacyCouncilRegNo ||
      cert.nablCertificateNo ||
      regPartner?.clinicalLicense ||
      regPartner?.licenseNumber ||
      authUser?.clinicalLicense ||
      authUser?.licenseNumber ||
      '',
    addressSummary: addressLine1 ? `${addressLine1}, ${city} - ${pincode}` : '',
    officialPhone: phone
  };
}

/**
 * Marks the partner profile as fully updated and broadcasts a reactive event.
 */
export function markPartnerProfileAsUpdated(userEmailOverride?: string): void {
  if (typeof window === 'undefined') return;
  const email = (userEmailOverride || getActiveUserEmail()).toLowerCase().trim();
  localStorage.setItem(`docsearch_partner_profile_updated_${email}`, 'true');

  // Also update saved account settings if present
  try {
    const settingsKey = `docsearch_account_settings_${email}`;
    const raw = localStorage.getItem(settingsKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.isProfileUpdated = true;
      parsed.lastProfileUpdatedAt = new Date().toISOString();
      localStorage.setItem(settingsKey, JSON.stringify(parsed));
    }
  } catch {}

  // Dispatch custom window event for reactive UI unlocks
  window.dispatchEvent(new CustomEvent('docsearch:partner_profile_updated', {
    detail: { email, timestamp: Date.now() }
  }));
}

/**
 * Triggers opening the Universal Account Settings Modal to the specified tab.
 */
export function openPartnerProfileSettings(tab: 'ADDRESS' | 'KYC' | 'CERTIFICATES' | 'BANK' = 'ADDRESS'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('docsearch:open_settings', {
    detail: { tab }
  }));
}
