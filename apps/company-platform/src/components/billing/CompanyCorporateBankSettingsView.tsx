import React, { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Button,
  Spinner,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface CompanyCorporateFinancialConfig {
  legalEntityName: string;
  tradeName: string;
  bankName: string;
  branchName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'CURRENT' | 'ESCROW';
  businessUpiId: string;
  secondaryUpiId?: string | null;
  gstin: string;
  pan: string;
  cinNumber?: string | null;
  billingEmail: string;
  billingPhone: string;
  registeredAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  supportedCurrencies: string[];
  paymentModes: {
    upiInstantQr: boolean;
    neftRtgsImps: boolean;
    cardNetbanking: boolean;
  };
  saasPaymentInstructions: string;
  autoReconciliation: boolean;
  lastUpdatedAt: string;
  updatedBy: string;
}

export interface PartnerPaymentProof {
  id: string;
  partnerId: string;
  tenantId?: string;
  partnerName: string;
  planId: string;
  planName: string;
  planCode: string;
  durationYears: number;
  payableAmountInr: number;
  paymentMethod: 'UPI' | 'NEFT_RTGS_IMPS' | 'CARD_ONLINE';
  utrNumber: string;
  payerUpiOrAccount?: string;
  partnerRemarks?: string;
  paymentDate: string;
  submittedAt: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  invoiceId?: string;
}

const DEFAULT_CONFIG: CompanyCorporateFinancialConfig = {
  legalEntityName: 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
  tradeName: 'DocSearch Platform HQ',
  bankName: 'HDFC Bank Ltd',
  branchName: 'Bandra Kurla Complex, Mumbai',
  accountHolderName: 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
  accountNumber: '50200084920192',
  ifscCode: 'HDFC0000240',
  accountType: 'CURRENT',
  businessUpiId: 'docsearch.billing@hdfcbank',
  secondaryUpiId: 'docsearch.saas@icici',
  gstin: '27AABCD1234E1Z5',
  pan: 'AABCD1234E',
  cinNumber: 'U72900MH2024PTC123456',
  billingEmail: 'billing@docsearch.health',
  billingPhone: '+91 1800 200 4000',
  registeredAddress: {
    line1: 'Unit 802, One International Center, Tower 2',
    line2: 'Senapati Bapat Marg, Prabhadevi',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    country: 'India'
  },
  supportedCurrencies: ['INR'],
  paymentModes: {
    upiInstantQr: true,
    neftRtgsImps: true,
    cardNetbanking: true
  },
  saasPaymentInstructions:
    'Authoritative Corporate Account for DocSearch SaaS Subscriptions & Plan Upgrades only. All patient OPD consultation, lab testing, and pharmacy collections remain isolated in each partner hospital/clinic account.',
  autoReconciliation: true,
  lastUpdatedAt: new Date().toISOString(),
  updatedBy: 'DOCSEARCH_HQ'
};

export const CompanyCorporateBankSettingsView: React.FC = () => {
  const [config, setConfig] = useState<CompanyCorporateFinancialConfig>(DEFAULT_CONFIG);
  const [pendingPayments, setPendingPayments] = useState<PartnerPaymentProof[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmAccNumber, setConfirmAccNumber] = useState<string>(DEFAULT_CONFIG.accountNumber);
  const [testAmount, setTestAmount] = useState<number>(20000);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch financial config
      const res = await fetch('/api/v1/company/financial-settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setConfig(json.data);
          setConfirmAccNumber(json.data.accountNumber);
        }
      }

      // 2. Fetch pending payments
      const payRes = await fetch('/api/v1/commercial/hq/pending-payments', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (payRes.ok) {
        const payJson = await payRes.json();
        if (payJson.success && Array.isArray(payJson.data)) {
          setPendingPayments(payJson.data);
        }
      }
    } catch (err: any) {
      console.warn('Error loading financial settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(null);

    if (config.accountNumber !== confirmAccNumber) {
      setErrorMessage('Account Number and Confirm Account Number do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/company/financial-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(config)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSaveSuccess('Company Corporate Bank Account & Business UPI configuration saved and activated across India!');
        setConfig(json.data);
      } else {
        setErrorMessage(json.message || 'Failed to update financial settings.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error updating financial settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyPayment = async (proofId: string, decision: 'APPROVED' | 'REJECTED') => {
    setIsVerifying(proofId);
    try {
      const reason = decision === 'REJECTED' ? prompt('Enter reason for rejection:') || 'Could not verify in bank statement' : undefined;
      const res = await fetch('/api/v1/commercial/hq/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ proofId, decision, reason })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert(decision === 'APPROVED' ? '✓ Payment verified! Partner subscription and license extended.' : 'Payment rejected.');
        await loadData();
      } else {
        alert(json.message || 'Failed to verify payment.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error during verification.');
    } finally {
      setIsVerifying(null);
    }
  };

  // Generate NPCI UPI URI string
  const upiUri = `upi://pay?pa=${encodeURIComponent(config.businessUpiId)}&pn=${encodeURIComponent(
    config.legalEntityName
  )}&am=${testAmount}&cu=INR&tn=DocSearch%20Hospital%20Annual%20Plan`;

  if (isLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ marginTop: '16px', color: 'var(--ds-color-text-muted)' }}>
          Loading DocSearch Corporate Banking & UPI Configuration...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Industry Standard Financial Architecture Guarantee Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '14px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px'
        }}
      >
        <span style={{ fontSize: '2.2rem', lineHeight: '1' }}>⚖️</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#10B981' }}>
              Industry Standard B2B SaaS Revenue Routing Architecture
            </h3>
            <Badge variant="success">STRICT FINANCIAL ISOLATION ACTIVE</Badge>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: '1.6' }}>
            <strong>DocSearch HQ Scope:</strong> The Corporate Bank Account and Business UPI ID configured below are <em>exclusively</em> used to receive <strong>DocSearch SaaS Platform Subscriptions, Plan Upgrades, and License Renewals</strong> from registered partner hospitals, clinics, pathology labs, and pharmacies.
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.8125rem', color: '#94A3B8', lineHeight: '1.6' }}>
            <strong>Partner Hospital Scope:</strong> All transactional healthcare revenues (Patient OPD consultation fees, pharmacy medicine sales, pathology lab test billings) are <em>never</em> routed to DocSearch HQ. Those patient payments flow directly and solely into each partner facility’s own bank account and personal/clinic UPI ID.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10B981',
            borderRadius: '10px',
            color: '#6EE7B7',
            padding: '12px 20px',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          ✓ {saveSuccess}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '10px',
            color: '#FCA5A5',
            padding: '12px 20px',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          ✗ {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Left Column: Corporate Bank & UPI Account Settings Form */}
        <Card
          title="Company Corporate Bank Account & UPI Gateway"
          subtitle="Authoritative destination for partner SaaS plan upgrades & subscription collections"
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  LEGAL ENTITY BENEFICIARY NAME *
                </label>
                <input
                  type="text"
                  required
                  value={config.legalEntityName}
                  onChange={(e) => setConfig({ ...config, legalEntityName: e.target.value.toUpperCase(), accountHolderName: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  BANK NAME *
                </label>
                <input
                  type="text"
                  required
                  value={config.bankName}
                  onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank Ltd, ICICI Bank, State Bank of India"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  CURRENT ACCOUNT NUMBER *
                </label>
                <input
                  type="text"
                  required
                  value={config.accountNumber}
                  onChange={(e) => setConfig({ ...config, accountNumber: e.target.value.trim() })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--ds-font-mono)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  CONFIRM ACCOUNT NUMBER *
                </label>
                <input
                  type="text"
                  required
                  value={confirmAccNumber}
                  onChange={(e) => setConfirmAccNumber(e.target.value.trim())}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--ds-font-mono)'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  IFSC CODE *
                </label>
                <input
                  type="text"
                  required
                  value={config.ifscCode}
                  onChange={(e) => setConfig({ ...config, ifscCode: e.target.value.toUpperCase().trim() })}
                  placeholder="HDFC0000240"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--ds-font-mono)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  ACCOUNT TYPE
                </label>
                <select
                  value={config.accountType}
                  onChange={(e) => setConfig({ ...config, accountType: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem'
                  }}
                >
                  <option value="CURRENT">Current Account (Corporate)</option>
                  <option value="ESCROW">Commercial Escrow Account</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  BRANCH NAME
                </label>
                <input
                  type="text"
                  value={config.branchName}
                  onChange={(e) => setConfig({ ...config, branchName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  PRIMARY BUSINESS UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  required
                  value={config.businessUpiId}
                  onChange={(e) => setConfig({ ...config, businessUpiId: e.target.value.toLowerCase().trim() })}
                  placeholder="docsearch.billing@hdfcbank"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1.5px solid #06B6D4',
                    color: '#38BDF8',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    fontFamily: 'var(--ds-font-mono)'
                  }}
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block', marginTop: '2px' }}>
                  Generates the instant scan-to-pay NPCI QR code for partners.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  SECONDARY BUSINESS UPI ID (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={config.secondaryUpiId || ''}
                  onChange={(e) => setConfig({ ...config, secondaryUpiId: e.target.value.toLowerCase().trim() })}
                  placeholder="docsearch.saas@icici"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--ds-font-mono)'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  COMPANY GSTIN
                </label>
                <input
                  type="text"
                  value={config.gstin}
                  onChange={(e) => setConfig({ ...config, gstin: e.target.value.toUpperCase().trim() })}
                  placeholder="27AABCD1234E1Z5"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--ds-font-mono)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  PAN NUMBER
                </label>
                <input
                  type="text"
                  value={config.pan}
                  onChange={(e) => setConfig({ ...config, pan: e.target.value.toUpperCase().trim() })}
                  placeholder="AABCD1234E"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--ds-font-mono)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-color-text-secondary)', marginBottom: '4px' }}>
                  SUPPORT BILLING EMAIL
                </label>
                <input
                  type="email"
                  value={config.billingEmail}
                  onChange={(e) => setConfig({ ...config, billingEmail: e.target.value.trim() })}
                  placeholder="billing@docsearch.health"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Saving Configuration...' : '💾 Save Corporate Bank & UPI Settings'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Column: Live Dynamic NPCI QR Preview & Quick Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Live Dynamic NPCI UPI QR Preview" subtitle="What partners scan when upgrading or renewing plans">
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#FFFFFF',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                  border: '2px solid #06B6D4'
                }}
              >
                {/* Visual SVG QR Code Matrix */}
                <svg width="180" height="180" viewBox="0 0 100 100" style={{ display: 'block' }}>
                  {/* Position detection corners */}
                  <rect x="5" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                  <rect x="9" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="13" y="13" width="10" height="10" fill="#06B6D4" rx="2" />

                  <rect x="69" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                  <rect x="73" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="77" y="13" width="10" height="10" fill="#06B6D4" rx="2" />

                  <rect x="5" y="69" width="26" height="26" fill="#0F172A" rx="4" />
                  <rect x="9" y="73" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="13" y="77" width="10" height="10" fill="#06B6D4" rx="2" />

                  {/* Stylized Data Pixels */}
                  <rect x="36" y="8" width="6" height="6" fill="#0F172A" />
                  <rect x="46" y="8" width="6" height="6" fill="#0F172A" />
                  <rect x="56" y="8" width="6" height="6" fill="#0F172A" />
                  <rect x="36" y="18" width="6" height="6" fill="#0F172A" />
                  <rect x="46" y="24" width="8" height="8" fill="#06B6D4" />
                  <rect x="58" y="18" width="6" height="6" fill="#0F172A" />

                  <rect x="8" y="36" width="6" height="6" fill="#0F172A" />
                  <rect x="18" y="36" width="6" height="6" fill="#0F172A" />
                  <rect x="28" y="36" width="6" height="6" fill="#0F172A" />
                  <rect x="38" y="36" width="6" height="6" fill="#0F172A" />
                  <rect x="48" y="36" width="6" height="6" fill="#0F172A" />
                  <rect x="58" y="36" width="6" height="6" fill="#0F172A" />
                  <rect x="68" y="36" width="6" height="6" fill="#0F172A" />
                  <rect x="78" y="36" width="6" height="6" fill="#0F172A" />
                  <rect x="88" y="36" width="6" height="6" fill="#0F172A" />

                  <rect x="36" y="46" width="6" height="6" fill="#0F172A" />
                  <rect x="46" y="46" width="8" height="8" fill="#0F172A" />
                  <rect x="58" y="46" width="6" height="6" fill="#0F172A" />
                  <rect x="68" y="46" width="6" height="6" fill="#0F172A" />
                  <rect x="78" y="46" width="6" height="6" fill="#0F172A" />
                  <rect x="88" y="46" width="6" height="6" fill="#0F172A" />

                  <rect x="36" y="58" width="6" height="6" fill="#0F172A" />
                  <rect x="46" y="58" width="6" height="6" fill="#0F172A" />
                  <rect x="56" y="58" width="6" height="6" fill="#0F172A" />
                  <rect x="68" y="58" width="6" height="6" fill="#0F172A" />
                  <rect x="78" y="58" width="6" height="6" fill="#0F172A" />

                  <rect x="36" y="68" width="6" height="6" fill="#0F172A" />
                  <rect x="46" y="68" width="6" height="6" fill="#0F172A" />
                  <rect x="56" y="68" width="6" height="6" fill="#0F172A" />
                  <rect x="68" y="68" width="6" height="6" fill="#0F172A" />
                  <rect x="78" y="68" width="6" height="6" fill="#0F172A" />
                  <rect x="88" y="68" width="6" height="6" fill="#0F172A" />

                  <rect x="36" y="78" width="6" height="6" fill="#0F172A" />
                  <rect x="46" y="78" width="8" height="8" fill="#06B6D4" />
                  <rect x="58" y="78" width="6" height="6" fill="#0F172A" />
                  <rect x="68" y="78" width="6" height="6" fill="#0F172A" />
                  <rect x="78" y="78" width="6" height="6" fill="#0F172A" />
                  <rect x="88" y="78" width="6" height="6" fill="#0F172A" />

                  <rect x="36" y="88" width="6" height="6" fill="#0F172A" />
                  <rect x="46" y="88" width="6" height="6" fill="#0F172A" />
                  <rect x="56" y="88" width="6" height="6" fill="#0F172A" />
                  <rect x="68" y="88" width="6" height="6" fill="#0F172A" />
                  <rect x="78" y="88" width="6" height="6" fill="#0F172A" />
                  <rect x="88" y="88" width="6" height="6" fill="#0F172A" />

                  {/* Central DocSearch Symbol */}
                  <circle cx="50" cy="50" r="7" fill="#06B6D4" />
                  <text x="50" y="53" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#FFFFFF">DS</text>
                </svg>
              </div>

              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                  {config.businessUpiId}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                  {config.legalEntityName}
                </span>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>Test Plan Amount: ₹</span>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  style={{
                    width: '90px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ds-color-surface-hover)',
                    border: '1px solid var(--ds-color-border-subtle)',
                    color: 'var(--ds-color-text-primary)',
                    fontSize: '0.75rem',
                    textAlign: 'center'
                  }}
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(config.businessUpiId, 'UPI')}
                  style={{
                    backgroundColor: copiedField === 'UPI' ? '#10B981' : 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid #06B6D4',
                    color: copiedField === 'UPI' ? '#070C16' : '#38BDF8',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {copiedField === 'UPI' ? '✓ Copied UPI ID' : '📋 Copy UPI ID'}
                </button>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>
                    Standard NPCI Protocol URI:
                  </span>
                  <a
                    href={upiUri}
                    style={{
                      fontSize: '0.6875rem',
                      color: '#38BDF8',
                      textDecoration: 'underline',
                      wordBreak: 'break-all'
                    }}
                  >
                    {upiUri.slice(0, 45)}...
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <Card title="NEFT / RTGS Wire Transfer Details" subtitle="For enterprise partners executing direct bank transfers">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ds-color-border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Beneficiary:</span>
                <strong style={{ color: 'var(--ds-color-text-primary)' }}>{config.accountHolderName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ds-color-border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Account No:</span>
                <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: 700, color: '#38BDF8' }}>
                  {config.accountNumber}{' '}
                  <button
                    type="button"
                    onClick={() => handleCopy(config.accountNumber, 'ACC')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60A5FA' }}
                  >
                    📋
                  </button>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ds-color-border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>IFSC:</span>
                <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: 700, color: 'var(--ds-color-text-primary)' }}>
                  {config.ifscCode}{' '}
                  <button
                    type="button"
                    onClick={() => handleCopy(config.ifscCode, 'IFSC')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60A5FA' }}
                  >
                    📋
                  </button>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ds-color-border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>Bank & Branch:</span>
                <span style={{ color: 'var(--ds-color-text-primary)' }}>{config.bankName}, {config.branchName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ds-color-text-muted)' }}>GSTIN:</span>
                <span style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-secondary)' }}>{config.gstin}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Maker-Checker Queue: Pending Partner Plan Upgrade Payments (UTR Verification) */}
      <Card
        title="Pending Partner Plan Upgrade Payments (Maker-Checker Queue)"
        subtitle="Verify incoming NEFT/UPI UTR numbers against company bank statements to activate/renew partner subscriptions"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Facility</TableHead>
                <TableHead>Requested Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Rail</TableHead>
                <TableHead>UTR / Ref Number</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--ds-color-text-muted)' }}>
                    No pending partner payment proofs awaiting verification.
                  </TableCell>
                </TableRow>
              ) : (
                pendingPayments.map((proof) => (
                  <TableRow key={proof.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{proof.partnerName}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{proof.planName}</Badge>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                        Tenure: {proof.durationYears} Year(s)
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#10B981', fontSize: '0.875rem' }}>
                        ₹ {proof.payableAmountInr.toLocaleString('en-IN')}
                      </strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant={proof.paymentMethod === 'UPI' ? 'primary' : 'neutral'}>
                        {proof.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: 700, color: '#38BDF8', fontSize: '0.8125rem' }}>
                        {proof.utrNumber}
                      </span>
                      {proof.partnerRemarks && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)', display: 'block' }}>
                          Note: {proof.partnerRemarks}
                        </span>
                      )}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {new Date(proof.submittedAt).toLocaleDateString()} {new Date(proof.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          proof.status === 'APPROVED'
                            ? 'success'
                            : proof.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {proof.status === 'PENDING_VERIFICATION' ? '⏳ PENDING REVIEW' : proof.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {proof.status === 'PENDING_VERIFICATION' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isVerifying === proof.id}
                            onClick={() => handleVerifyPayment(proof.id, 'APPROVED')}
                          >
                            {isVerifying === proof.id ? 'Verifying...' : '✓ Approve & Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isVerifying === proof.id}
                            onClick={() => handleVerifyPayment(proof.id, 'REJECTED')}
                          >
                            ✕ Reject
                          </Button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                          Verified by {proof.verifiedBy}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
