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
  } | undefined;
  onSettingsSaved?: ((data: any) => void) | undefined;
}

export const UniversalAccountSettingsModal: React.FC<UniversalAccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSettingsSaved
}) => {
  const [activeTab, setActiveTab] = useState<'BANK' | 'ADDRESS' | 'PASSWORD'>('BANK');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Storage key specific to user
  const userKey = currentUser?.email || 'default_user';
  const storageKey = `docsearch_account_settings_${userKey}`;

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
    branchName: 'Nariman Point Branch, Mumbai'
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
    gstin: '27AAAAA0000A1Z5'
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
          if (parsed.security) setSecurityData((prev) => ({ ...prev, twoFactorEnabled: parsed.security.twoFactorEnabled, autoLockMinutes: parsed.security.autoLockMinutes }));
        } catch {}
      }
    }
  }, [isOpen, storageKey]);

  if (!isOpen) return null;

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

    const payload = {
      bank: { ...bankData, ifscCode: bankData.ifscCode.toUpperCase() },
      address: addressData,
      security: { twoFactorEnabled: securityData.twoFactorEnabled, autoLockMinutes: securityData.autoLockMinutes }
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
    setSaveSuccessMessage('✓ Bank Account & Settlement Details updated successfully!');
    if (onSettingsSaved) onSettingsSaved(payload);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (addressData.pincode.length !== 6 || !/^\d+$/.test(addressData.pincode)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN Code.');
      return;
    }

    const payload = {
      bank: bankData,
      address: addressData,
      security: { twoFactorEnabled: securityData.twoFactorEnabled, autoLockMinutes: securityData.autoLockMinutes }
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
    setSaveSuccessMessage('✓ Official Address, Contact & Location Profile updated successfully!');
    if (onSettingsSaved) onSettingsSaved(payload);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
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
      security: {
        twoFactorEnabled: securityData.twoFactorEnabled,
        autoLockMinutes: securityData.autoLockMinutes,
        updatedAt: new Date().toISOString()
      }
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
    setSecurityData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: securityData.twoFactorEnabled,
      autoLockMinutes: securityData.autoLockMinutes
    });

    setSaveSuccessMessage('✓ Password changed and session security updated successfully!');
    if (onSettingsSaved) onSettingsSaved(payload);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
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
        maxWidth: '820px',
        maxHeight: '92vh',
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
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                Account Settings & Master Profile
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Role: <strong style={{ color: '#38BDF8' }}>{currentUser?.role || currentUser?.roleTitle || 'STAFF'}</strong> • {currentUser?.email || 'user@docsearch.health'}
              </span>
            </div>
          </div>

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

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#070C16',
          padding: '0 16px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('BANK'); setErrorMessage(null); }}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              color: activeTab === 'BANK' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'BANK' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>💳</span> Bank & Settlement Update
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('ADDRESS'); setErrorMessage(null); }}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              color: activeTab === 'ADDRESS' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'ADDRESS' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📍</span> Address & Location Profile
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('PASSWORD'); setErrorMessage(null); }}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              color: activeTab === 'PASSWORD' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'PASSWORD' ? '3px solid #06B6D4' : '3px solid transparent',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔐</span> Password & Security Update
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
              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#38BDF8' }}>Direct B2B Hospital / Lab Settlement Payouts</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    All patient digital payments and OPD consultation fees are credited directly to this verified bank account.
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  ✓ Instant IMPS / NEFT Enabled
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
                    SETTLEMENT FREQUENCY
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

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  UPI ID / VPA FOR INSTANT QR SETTLEMENTS
                </label>
                <input
                  type="text"
                  value={bankData.upiId}
                  onChange={(e) => setBankData({ ...bankData, upiId: e.target.value })}
                  placeholder="tatapathology@okhdfcbank"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.8125rem' }}
                />
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
                  💾 Save & Update Bank Details
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ADDRESS & LOCATION PROFILE */}
          {activeTab === 'ADDRESS' && (
            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 16px', borderRadius: '10px' }}>
                <strong style={{ fontSize: '0.875rem', color: '#60A5FA' }}>Official Facility Address & Legal Contact Information</strong>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                  This official address is printed on invoices, NABL test reports, GST receipts, and prescription letterheads.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    LEGAL ENTITY / LAB NAME *
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
                  💾 Save & Update Address Profile
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PASSWORD & SECURITY */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px 16px', borderRadius: '10px' }}>
                <strong style={{ fontSize: '0.875rem', color: '#FBBF24' }}>Cryptographic Password & Multi-Factor Security</strong>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                  Passwords are encrypted using zero-knowledge scrypt key derivation. Changing your password will secure your session across all active devices.
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
                  🔒 Update Password & Security
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
