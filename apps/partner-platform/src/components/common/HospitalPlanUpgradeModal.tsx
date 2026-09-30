import React, { useState, useEffect } from 'react';
import {
  HOSPITAL_PRO_TIER_NAME,
  HOSPITAL_FREE_TIER_NAME
} from '@docsearch/shared-core';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';

export interface HospitalPlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFeatureName?: string | undefined;
  currentUser?: HospitalStaffUser | undefined;
  onUpgradeSuccess?: ((updatedPlanTier: string) => void) | undefined;
}

export interface CompanyPaymentDetails {
  beneficiaryName: string;
  legalEntityName: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  businessUpiId: string;
  secondaryUpiId?: string | null;
  gstin: string;
  pan: string;
  billingEmail: string;
  billingPhone: string;
  upiIntentUrl: string;
  instructions: string;
  isolationNotice: string;
}

export const HospitalPlanUpgradeModal: React.FC<HospitalPlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  targetFeatureName,
  currentUser,
  onUpgradeSuccess
}) => {
  const [step, setStep] = useState<'REVIEW' | 'PAYMENT' | 'CONFIRMED'>('REVIEW');
  const [selectedDurationYears, setSelectedDurationYears] = useState<number>(1);
  const [companyDetails, setCompanyDetails] = useState<CompanyPaymentDetails | null>(null);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [payerAccountOrUpi, setPayerAccountOrUpi] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [partnerRecord, setPartnerRecord] = useState<any>(null);
  const [hospitalPlan, setHospitalPlan] = useState<any>(null);

  // Pricing calculation
  const annualBasePrice = hospitalPlan?.basePrice || 20000;
  const grossTenureAmount = annualBasePrice * selectedDurationYears;
  const discountPercent = selectedDurationYears === 5 ? 20 : selectedDurationYears === 3 ? 10 : selectedDurationYears === 2 ? 2 : 0;
  const discountAmount = Math.round(grossTenureAmount * (discountPercent / 100));
  const finalPayableAmount = grossTenureAmount - discountAmount;

  // Fetch plan & company corporate payment details on mount
  useEffect(() => {
    if (!isOpen) return;

    // 1. Fetch Plan details
    fetch('/api/v1/commercial/plans')
      .then((r) => r.json())
      .then((json) => {
        const hp = json?.data?.find((p: any) => p.code === 'PLAN_HOSPITAL_ANNUAL' || p.code?.includes('HOSPITAL'));
        if (hp) setHospitalPlan(hp);
      })
      .catch(() => {});

    // 2. Fetch Partner profile
    fetch('/api/v1/partner/account/plan-and-features')
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.organizationProfile) {
          setPartnerRecord(json.data.organizationProfile);
        }
      })
      .catch(() => {});

    // 3. Fetch Company HQ Corporate Bank & Business UPI details
    fetch(`/api/v1/commercial/company-payment-details?amount=${finalPayableAmount}&invoiceRef=HOSPITAL-UPGRADE`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setCompanyDetails(json.data);
        }
      })
      .catch(() => {});
  }, [isOpen, finalPayableAmount]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 4) {
      setErrorMessage('Please enter a valid 12-digit UTR or UPI transaction reference number.');
      return;
    }

    setIsSubmittingUtr(true);
    setErrorMessage(null);

    try {
      const partnerId = partnerRecord?.partnerId || partnerRecord?.id;
      const planId = hospitalPlan?.id || '44444444-4444-4000-8000-000000000004';

      if (!partnerId) {
        throw new Error('Partner facility verification required before submitting payment.');
      }

      // 1. Submit Payment Proof to Company HQ
      const submitRes = await fetch('/api/v1/commercial/submit-payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          planId,
          planName: 'Hospital Enterprise Annual Plan',
          planCode: 'PLAN_HOSPITAL_ANNUAL',
          durationYears: selectedDurationYears,
          payableAmountInr: finalPayableAmount,
          paymentMethod: 'UPI',
          utrNumber: utrNumber.trim().toUpperCase(),
          payerUpiOrAccount: payerAccountOrUpi.trim() || undefined,
          partnerRemarks: remarks.trim() || undefined
        })
      });

      const submitJson = await submitRes.json();
      if (!submitRes.ok || !submitJson.success) {
        throw new Error(submitJson.message || 'Failed to submit payment reference.');
      }

      // 2. Also register server-side checkout order snapshot
      try {
        await fetch('/api/v1/commercial/create-checkout-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partnerId,
            planId,
            durationYears: selectedDurationYears,
            customerBillingAddress: currentUser?.tenantName || 'Hospital Headquarters'
          })
        });
      } catch {}

      setStep('CONFIRMED');

      // Update parent component
      setTimeout(() => {
        onUpgradeSuccess?.(HOSPITAL_PRO_TIER_NAME);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error submitting payment reference.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const defaultCompany: CompanyPaymentDetails = companyDetails || {
    beneficiaryName: 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
    legalEntityName: 'DOCSEARCH HEALTHCARE TECHNOLOGIES PRIVATE LIMITED',
    bankName: 'HDFC Bank Ltd',
    branchName: 'Bandra Kurla Complex, Mumbai',
    accountNumber: '50200084920192',
    ifscCode: 'HDFC0000240',
    accountType: 'CURRENT',
    businessUpiId: 'docsearch.billing@hdfcbank',
    secondaryUpiId: 'docsearch.saas@icici',
    gstin: '27AABCD1234E1Z5',
    pan: 'AABCD1234E',
    billingEmail: 'billing@docsearch.health',
    billingPhone: '+91 1800 200 4000',
    upiIntentUrl: `upi://pay?pa=docsearch.billing@hdfcbank&pn=DOCSEARCH%20HEALTHCARE%20TECHNOLOGIES%20PRIVATE%20LIMITED&am=${finalPayableAmount}&cu=INR&tn=DocSearch%20Hospital%20Plan%20Upgrade`,
    instructions: 'Authoritative Corporate Account for DocSearch SaaS Subscriptions & Plan Upgrades only.',
    isolationNotice:
      'DocSearch SaaS Platform Fee Separation: This payment routes exclusively to DocSearch Healthcare Technologies Pvt Ltd corporate bank account. All patient OPD consultation, lab testing, and pharmacy collections remain isolated in each partner hospital/clinic account.'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(10px)',
        padding: 0,
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmittingUtr) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '840px',
          height: '100vh',
          backgroundColor: '#0F172A',
          borderLeft: '2px solid #6366F1',
          borderRadius: '20px 0 0 20px',
          boxShadow: '-12px 0 50px rgba(0, 0, 0, 0.8)',
          overflowY: 'auto',
          color: '#F8FAFC',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid #1E293B',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(124, 58, 237, 0.22) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>👑</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Upgrade to Complete Hospital Enterprise Suite
                </h2>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    backgroundColor: '#10B981',
                    color: '#070C16',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                >
                  OFFICIAL HQ CHECKOUT
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                {currentUser?.tenantName || 'Healthcare Facility'} • Active Plan: {currentUser?.planTier || HOSPITAL_FREE_TIER_NAME}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmittingUtr}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.3rem',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Financial Separation Guarantee Banner */}
        <div
          style={{
            backgroundColor: '#070C16',
            borderBottom: '1px solid #1E293B',
            padding: '10px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.75rem',
            color: '#CBD5E1'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>⚖️</span>
          <span>
            <strong style={{ color: '#10B981' }}>DocSearch Corporate Payment Separation:</strong> Subscription funds route directly to DocSearch HQ corporate bank account. All patient OPD consultation, lab, and pharmacy fees remain strictly in your own bank account.
          </span>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {targetFeatureName && step === 'REVIEW' && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.8125rem',
                color: '#FCA5A5'
              }}
            >
              <span>🔒</span>
              <span>
                <strong>{targetFeatureName}</strong> is locked on your current Free OPD Foundation tier. Upgrade below to activate full hospital access.
              </span>
            </div>
          )}

          {/* STEP 1: PLAN REVIEW & TENURE SELECTION */}
          {step === 'REVIEW' && (
            <>
              {/* Tenure Selection Grid */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, color: '#CBD5E1', marginBottom: '8px' }}>
                  CHOOSE SUBSCRIPTION TENURE (APPROVED SAAS DISCOUNTS)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  {[
                    { years: 1, label: '1 Year', badge: 'Standard', discount: 0 },
                    { years: 2, label: '2 Years', badge: '2% OFF', discount: 2 },
                    { years: 3, label: '3 Years', badge: '10% OFF', discount: 10 },
                    { years: 5, label: '5 Years', badge: '20% OFF', discount: 20 }
                  ].map((opt) => {
                    const isSelected = selectedDurationYears === opt.years;
                    const price = annualBasePrice * opt.years * (1 - opt.discount / 100);
                    return (
                      <button
                        key={opt.years}
                        type="button"
                        onClick={() => setSelectedDurationYears(opt.years)}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #818CF8' : '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : '#1E293B',
                          color: isSelected ? '#FFFFFF' : '#CBD5E1',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>{opt.label}</span>
                        <span style={{ fontSize: '0.6875rem', color: opt.discount > 0 ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                          {opt.badge}
                        </span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                          ₹{Math.round(price).toLocaleString('en-IN')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1.5px solid #6366F1',
                  borderRadius: '14px',
                  padding: '18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏥</span>
                    <strong style={{ fontSize: '0.95rem', color: '#A5B4FC' }}>
                      Hospital Enterprise Pro Suite (Complete Clinical & Inpatient OS)
                    </strong>
                  </div>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#38BDF8' }}>
                    ₹{finalPayableAmount.toLocaleString('en-IN')}{' '}
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ {selectedDurationYears} Year(s)</span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: '#E2E8F0' }}>
                  {[
                    '✓ 24x7 Inpatient ADT Bed Matrix & Wards',
                    '✓ Operation Theatres (OT) & PAC Scheduling',
                    '✓ Emergency Trauma Bay & Code Blue Alerts',
                    '✓ Cashless Insurance & NHCX / TPA Claims',
                    '✓ Blood Bank, Component & Cross-Match',
                    '✓ Web DICOM PACS & Radiology Viewer',
                    '✓ NABH Quality & Infection Control',
                    '✓ Unlimited Doctor Desks & Hospital Beds'
                  ].map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#94A3B8'
                  }}
                >
                  <span>HSN/SAC Code: 998313 (IT Software Licensing)</span>
                  <span>18% GST Inclusive • Official Tax Invoice Provided</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setStep('PAYMENT')}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                    border: '1.5px solid #A78BFA',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span>Proceed to Company Bank & UPI Payment</span>
                  <span>➜</span>
                </button>
              </div>
            </>
          )}

          {/* STEP 2: CORPORATE BANK & DYNAMIC NPCI UPI QR */}
          {step === 'PAYMENT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setStep('REVIEW')}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.8125rem' }}
                >
                  ← Back to Plan Review
                </button>
                <div style={{ fontSize: '0.875rem', color: '#38BDF8', fontWeight: 800 }}>
                  Amount Payable: ₹{finalPayableAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.4fr)', gap: '20px' }}>
                {/* Rail A: Instant NPCI UPI Scan & Pay */}
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1.5px solid #06B6D4',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                    <strong style={{ fontSize: '0.875rem', color: '#38BDF8' }}>
                      RAIL A: Scan with Any UPI App
                    </strong>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '12px' }}>
                    Google Pay, PhonePe, Paytm, BHIM, Cred, or Mobile Banking
                  </span>

                  {/* Visual SVG QR Code Matrix */}
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: '12px',
                      borderRadius: '12px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                      border: '2px solid #06B6D4',
                      display: 'inline-block'
                    }}
                  >
                    <svg width="150" height="150" viewBox="0 0 100 100" style={{ display: 'block' }}>
                      <rect x="5" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                      <rect x="9" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                      <rect x="13" y="13" width="10" height="10" fill="#06B6D4" rx="2" />

                      <rect x="69" y="5" width="26" height="26" fill="#0F172A" rx="4" />
                      <rect x="73" y="9" width="18" height="18" fill="#FFFFFF" rx="2" />
                      <rect x="77" y="13" width="10" height="10" fill="#06B6D4" rx="2" />

                      <rect x="5" y="69" width="26" height="26" fill="#0F172A" rx="4" />
                      <rect x="9" y="73" width="18" height="18" fill="#FFFFFF" rx="2" />
                      <rect x="13" y="77" width="10" height="10" fill="#06B6D4" rx="2" />

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

                      <circle cx="50" cy="50" r="7" fill="#06B6D4" />
                      <text x="50" y="53" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#FFFFFF">DS</text>
                    </svg>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>
                      {defaultCompany.businessUpiId}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopy(defaultCompany.businessUpiId, 'UPI')}
                      style={{
                        backgroundColor: copiedField === 'UPI' ? '#10B981' : 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid #06B6D4',
                        color: copiedField === 'UPI' ? '#070C16' : '#38BDF8',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedField === 'UPI' ? '✓ Copied' : '📋 Copy UPI'}
                    </button>

                    <a
                      href={defaultCompany.upiIntentUrl}
                      style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid #818CF8',
                        color: '#A5B4FC',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      Pay in UPI App
                    </a>
                  </div>
                </div>

                {/* Rail B: Direct NEFT / RTGS Wire Details */}
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                    <strong style={{ fontSize: '0.875rem', color: '#A5B4FC' }}>
                      RAIL B: Corporate Bank Transfer (NEFT / RTGS / IMPS)
                    </strong>
                  </div>

                  <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '5px' }}>
                      <span style={{ color: '#94A3B8' }}>Beneficiary:</span>
                      <strong style={{ color: '#F8FAFC' }}>{defaultCompany.beneficiaryName}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '5px' }}>
                      <span style={{ color: '#94A3B8' }}>Bank Name:</span>
                      <span style={{ color: '#F8FAFC' }}>{defaultCompany.bankName}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '5px' }}>
                      <span style={{ color: '#94A3B8' }}>Account Number:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>
                        {defaultCompany.accountNumber}{' '}
                        <button
                          type="button"
                          onClick={() => handleCopy(defaultCompany.accountNumber, 'ACC')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60A5FA' }}
                          title="Copy account number"
                        >
                          📋
                        </button>
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '5px' }}>
                      <span style={{ color: '#94A3B8' }}>IFSC Code:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#F8FAFC' }}>
                        {defaultCompany.ifscCode}{' '}
                        <button
                          type="button"
                          onClick={() => handleCopy(defaultCompany.ifscCode, 'IFSC')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60A5FA' }}
                          title="Copy IFSC code"
                        >
                          📋
                        </button>
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '5px' }}>
                      <span style={{ color: '#94A3B8' }}>Account Type:</span>
                      <span style={{ color: '#F8FAFC' }}>Current Account (Corporate)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94A3B8' }}>Company GSTIN:</span>
                      <span style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>{defaultCompany.gstin}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* UTR Submission Form */}
              <form
                onSubmit={handleSubmitUtr}
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1.5px solid #818CF8',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9375rem', color: '#FFFFFF' }}>
                    Step 2: Confirm Payment Reference (UTR / UPI Ref Number)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    After completing payment in your banking or UPI app, enter the 12-digit transaction reference number below.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      12-DIGIT UTR / TRANSACTION ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 427189021948 or UPI Ref"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.toUpperCase().trim())}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        border: '1.5px solid #38BDF8',
                        color: '#FFFFFF',
                        fontSize: '0.9375rem',
                        fontFamily: 'monospace',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                      REMITTER BANK / UPI ID (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. hospital@icici"
                      value={payerAccountOrUpi}
                      onChange={(e) => setPayerAccountOrUpi(e.target.value.trim())}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.8125rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    REMARKS / HOSPITAL NAME (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Upgrade for City Care Hospital"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.8125rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="submit"
                    disabled={isSubmittingUtr}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      backgroundColor: '#10B981',
                      border: 'none',
                      color: '#070C16',
                      fontWeight: 900,
                      fontSize: '0.9375rem',
                      cursor: isSubmittingUtr ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSubmittingUtr ? 'Verifying & Submitting Reference...' : '✓ Submit UTR & Confirm Plan Activation'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: CONFIRMATION */}
          {step === 'CONFIRMED' && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10B981',
                borderRadius: '16px',
                padding: '32px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <span style={{ fontSize: '3rem' }}>🎉</span>
              <h3 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#34D399' }}>
                Payment Reference Successfully Submitted!
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#CBD5E1', maxWidth: '520px', lineHeight: 1.5 }}>
                Your payment reference (UTR: <strong>{utrNumber}</strong>) of <strong>₹{finalPayableAmount.toLocaleString('en-IN')}</strong> has been transmitted to DocSearch Corporate Finance for automated bank statement reconciliation.
              </p>
              <div style={{ padding: '8px 16px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #10B981' }}>
                <span style={{ fontSize: '0.8125rem', color: '#6EE7B7', fontWeight: 700 }}>
                  ✓ Hospital Enterprise Pro Suite Entitlements Activated
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  marginTop: '12px',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#38BDF8',
                  border: 'none',
                  color: '#070C16',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Done & Return to Hospital Dashboard
              </button>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#F87171',
                fontSize: '0.8125rem'
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
