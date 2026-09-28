import React, { useState, useEffect, useMemo } from 'react';
import { Button, Spinner } from '@docsearch/ui-kit';

export interface CommercialRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenewalSuccess?: (() => void) | undefined;
  currentPlan?: {
    id: string;
    code: string;
    name: string;
    basePrice: number;
    currency: string;
    [key: string]: any;
  } | null | undefined;
  subscription?: {
    expiryDate: string | null;
    daysRemaining: number | null;
    isExpired?: boolean;
    isLocked?: boolean;
    partnerId?: string | null;
    tenantId?: string;
    [key: string]: any;
  } | null | undefined;
  organizationProfile?: {
    partnerId: string | null;
    legalName: string;
    partnerType: string;
    [key: string]: any;
  } | null | undefined;
}

export interface OrderCalculationDto {
  planId: string;
  planCode: string;
  planName: string;
  durationYears: number;
  annualBasePriceInr: number;
  grossAmountInr: number;
  discountRatePercent: number;
  discountAmountInr: number;
  finalAmountInr: number;
  taxableAmountInr: number;
  cgstAmountInr: number;
  sgstAmountInr: number;
  igstAmountInr: number;
  currency: string;
  sacCode: string;
}

export const CommercialRenewalModal: React.FC<CommercialRenewalModalProps> = ({
  isOpen,
  onClose,
  onRenewalSuccess,
  currentPlan,
  subscription,
  organizationProfile
}) => {
  const [selectedDurationYears, setSelectedDurationYears] = useState<number>(1);
  const [isInterstate, setIsInterstate] = useState<boolean>(false);
  const [calculation, setCalculation] = useState<OrderCalculationDto | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Determine starting base date for extension invariant
  const existingExpiryDate = useMemo(() => {
    if (subscription?.expiryDate) {
      const d = new Date(subscription.expiryDate);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }, [subscription?.expiryDate]);

  const isCurrentlyActive = existingExpiryDate && existingExpiryDate.getTime() > Date.now();

  // Projected New Expiry Date
  const projectedExpiryDate = useMemo(() => {
    const base = isCurrentlyActive && existingExpiryDate ? new Date(existingExpiryDate) : new Date();
    const projected = new Date(base);
    projected.setFullYear(projected.getFullYear() + selectedDurationYears);
    return projected;
  }, [existingExpiryDate, isCurrentlyActive, selectedDurationYears]);

  // Recalculate order whenever duration or interstate changes
  useEffect(() => {
    if (!isOpen || !currentPlan?.id) return;
    let isCancelled = false;

    const fetchCalculation = async () => {
      setIsCalculating(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/v1/commercial/calculate-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: currentPlan.id,
            durationYears: selectedDurationYears,
            isInterstate
          })
        });

        const json = await res.json();
        if (!isCancelled) {
          if (res.ok && json.success && json.data) {
            setCalculation(json.data);
          } else {
            // Local fallback calculation matching approved rules
            const annual = currentPlan.basePrice || (currentPlan.code.includes('HOSPITAL') ? 20000 : 6000);
            const gross = annual * selectedDurationYears;
            const discPercent = selectedDurationYears === 5 ? 20 : selectedDurationYears === 3 ? 10 : selectedDurationYears === 2 ? 2 : 0;
            const discountAmt = Math.round(gross * (discPercent / 100));
            const finalAmt = gross - discountAmt;
            const taxable = Math.round((finalAmt / 1.18) * 100) / 100;
            const gst = Math.round((finalAmt - taxable) * 100) / 100;

            setCalculation({
              planId: currentPlan.id,
              planCode: currentPlan.code,
              planName: currentPlan.name,
              durationYears: selectedDurationYears,
              annualBasePriceInr: annual,
              grossAmountInr: gross,
              discountRatePercent: discPercent,
              discountAmountInr: discountAmt,
              finalAmountInr: finalAmt,
              taxableAmountInr: taxable,
              cgstAmountInr: isInterstate ? 0 : Math.round((gst / 2) * 100) / 100,
              sgstAmountInr: isInterstate ? 0 : Math.round((gst / 2) * 100) / 100,
              igstAmountInr: isInterstate ? gst : 0,
              currency: 'INR',
              sacCode: '998313'
            });
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setErrorMessage(err.message || 'Error calculating commercial order.');
        }
      } finally {
        if (!isCancelled) setIsCalculating(false);
      }
    };

    fetchCalculation();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentPlan?.id, selectedDurationYears, isInterstate]);

  if (!isOpen) return null;

  const handleInitiateRenewal = async () => {
    const partnerId = organizationProfile?.partnerId || subscription?.partnerId;
    if (!partnerId || !currentPlan?.id) {
      setErrorMessage('Missing partner identity or plan master ID to generate commercial snapshot.');
      return;
    }

    setIsCreatingCheckout(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/v1/commercial/create-checkout-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          planId: currentPlan.id,
          durationYears: selectedDurationYears,
          isInterstate,
          customerBillingAddress: organizationProfile?.legalName || 'India'
        })
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setSuccessMessage('Commercial Order Snapshot created successfully! Order Reference: ' + json.data.razorpayOrderId);
        
        // Notify parent after brief delay
        setTimeout(() => {
          onRenewalSuccess?.();
        }, 1500);
      } else {
        setErrorMessage(json.message || json.error?.message || 'Failed to initiate commercial checkout order.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error initiating renewal checkout.');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const tenureOptions = [
    { years: 1, label: '1 Year', discountBadge: 'Standard', discountPercent: 0 },
    { years: 2, label: '2 Years', discountBadge: '2% OFF', discountPercent: 2 },
    { years: 3, label: '3 Years', discountBadge: '10% OFF', discountPercent: 10 },
    { years: 5, label: '5 Years', discountBadge: '20% OFF', discountPercent: 20 }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(10px)',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCreatingCheckout) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#0F172A',
          border: '1.5px solid #38BDF8',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1E293B',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>💳</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
                Renew / Extend Healthcare OS License
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                {organizationProfile?.legalName || 'Healthcare Facility'} • Plan: <strong>{currentPlan?.name || 'Healthcare OS'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Extension Invariant Banner */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>🛡️</span>
            <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.45 }}>
              <strong style={{ color: '#34D399', display: 'block', marginBottom: '2px' }}>
                Active License Extension Guarantee (Zero Lost Days)
              </strong>
              {isCurrentlyActive ? (
                <>
                  Your current license is valid until{' '}
                  <strong style={{ color: '#F8FAFC' }}>{existingExpiryDate?.toLocaleDateString()}</strong>.
                  Early renewal preserves all remaining days. Your new validity will extend to:{' '}
                  <strong style={{ color: '#38BDF8', fontSize: '0.875rem' }}>
                    {projectedExpiryDate.toLocaleDateString()}
                  </strong>.
                </>
              ) : (
                <>
                  Your license is currently expired/locked. Renewing will immediately reactivate all operational modules and set validity through:{' '}
                  <strong style={{ color: '#38BDF8', fontSize: '0.875rem' }}>
                    {projectedExpiryDate.toLocaleDateString()}
                  </strong>.
                </>
              )}
            </div>
          </div>

          {/* Tenure Selection Grid */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '10px' }}>
              Select Subscription Duration & Approved Multi-Year Discount
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px'
              }}
            >
              {tenureOptions.map((opt) => {
                const isSelected = selectedDurationYears === opt.years;
                return (
                  <button
                    key={opt.years}
                    type="button"
                    onClick={() => setSelectedDurationYears(opt.years)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#38BDF8' : '#CBD5E1',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{opt.label}</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: opt.discountPercent > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: opt.discountPercent > 0 ? '#34D399' : '#94A3B8'
                      }}
                    >
                      {opt.discountBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interstate / Tax Options */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0', display: 'block' }}>
                GST Tax Jurisprudence (SAC Code: 998313)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {isInterstate ? 'Inter-state transaction (IGST 18%)' : 'Intra-state transaction (CGST 9% + SGST 9%)'}
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#CBD5E1' }}>
              <input
                type="checkbox"
                checked={isInterstate}
                onChange={(e) => setIsInterstate(e.target.checked)}
                style={{ accentColor: '#38BDF8' }}
              />
              Inter-State (IGST)
            </label>
          </div>

          {/* Financial Calculation Breakdown */}
          {isCalculating ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
              <Spinner size="sm" /> Calculating authoritative GST order...
            </div>
          ) : calculation ? (
            <div
              style={{
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8' }}>
                <span>Annual Base Price ({calculation.sacCode})</span>
                <span style={{ color: '#F8FAFC' }}>₹{calculation.annualBasePriceInr.toLocaleString()} / yr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8' }}>
                <span>Gross Tenure Amount ({calculation.durationYears} Yr)</span>
                <span style={{ color: '#F8FAFC' }}>₹{calculation.grossAmountInr.toLocaleString()}</span>
              </div>
              {calculation.discountAmountInr > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#34D399' }}>
                  <span>Approved Tenure Discount ({calculation.discountRatePercent}%)</span>
                  <span>- ₹{calculation.discountAmountInr.toLocaleString()}</span>
                </div>
              )}
              <div
                style={{
                  borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                  paddingTop: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  color: '#94A3B8'
                }}
              >
                <span>Taxable Amount (Excl. GST)</span>
                <span style={{ color: '#CBD5E1' }}>₹{calculation.taxableAmountInr.toLocaleString()}</span>
              </div>
              {isInterstate ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  <span>IGST (18%)</span>
                  <span style={{ color: '#CBD5E1' }}>₹{calculation.igstAmountInr.toLocaleString()}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8' }}>
                    <span>CGST (9%)</span>
                    <span style={{ color: '#CBD5E1' }}>₹{calculation.cgstAmountInr.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8' }}>
                    <span>SGST (9%)</span>
                    <span style={{ color: '#CBD5E1' }}>₹{calculation.sgstAmountInr.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div
                style={{
                  borderTop: '1.5px solid rgba(56, 189, 248, 0.3)',
                  paddingTop: '10px',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>Total Final Payable</span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>(18% GST Inclusive)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.375rem', fontWeight: 900, color: '#38BDF8' }}>
                    ₹{calculation.finalAmountInr.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Error Message */}
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

          {/* Success Message */}
          {successMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                fontSize: '0.8125rem'
              }}
            >
              {successMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #1E293B',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Secured via Server-Verified Razorpay Webhook & SHA256 Signature
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={isCreatingCheckout}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleInitiateRenewal}
              disabled={isCreatingCheckout || isCalculating || !calculation}
              style={{
                backgroundColor: '#38BDF8',
                borderColor: '#38BDF8',
                color: '#0F172A',
                fontWeight: 800
              }}
            >
              {isCreatingCheckout ? (
                <>
                  <Spinner size="sm" /> Creating Order...
                </>
              ) : (
                `Proceed to Pay ₹${calculation ? calculation.finalAmountInr.toLocaleString() : '...'}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
