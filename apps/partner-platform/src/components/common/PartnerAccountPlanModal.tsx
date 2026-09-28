import React, { useState, useEffect } from 'react';
import {
  fetchPartnerAccountPlanFeatures,
  type PartnerAccountPlanFeaturesData
} from '../../services/partner-account-service.js';

export interface PartnerAccountPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    role?: string;
    tenantName?: string;
  } | undefined;
}

export const PartnerAccountPlanModal: React.FC<PartnerAccountPlanModalProps> = ({
  isOpen,
  onClose,
  currentUser: _currentUser
}) => {
  const [data, setData] = useState<PartnerAccountPlanFeaturesData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FEATURES' | 'LIMITS'>('OVERVIEW');
  const [featureFilter, setFeatureFilter] = useState<'ALL' | 'AVAILABLE' | 'LOCKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadAccountData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchPartnerAccountPlanFeatures();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to retrieve authoritative account plan and features.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to account services.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAccountData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const plan = data?.currentPlan;
  const sub = data?.subscription;
  const org = data?.organizationProfile;
  const limits = data?.limits;

  // Filter features
  const filteredFeatures = (data?.features || []).filter((f) => {
    if (featureFilter === 'AVAILABLE' && f.status !== 'AVAILABLE') return false;
    if (featureFilter === 'LOCKED' && f.status === 'AVAILABLE') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const availableCount = (data?.features || []).filter((f) => f.status === 'AVAILABLE').length;
  const lockedCount = (data?.features || []).filter((f) => f.status !== 'AVAILABLE').length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000001,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        padding: 0
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          height: '100vh',
          maxHeight: '100vh',
          backgroundColor: '#0F172A',
          borderLeft: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          borderRadius: '16px 0 0 16px',
          boxShadow: '-12px 0 45px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              💳
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                  My Account / Plan & Features
                </h2>
                {plan ? (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      backgroundColor: sub?.isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: sub?.isExpired ? '#FCA5A5' : '#6EE7B7',
                      border: sub?.isExpired ? '1px solid #EF4444' : '1px solid #10B981'
                    }}
                  >
                    {plan.name}
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(148, 163, 184, 0.15)',
                      color: '#94A3B8',
                      border: '1px solid #475569'
                    }}
                  >
                    NOT CONFIGURED
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Authoritative organization subscription, plan validity, and real feature entitlements.
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
              padding: '6px',
              borderRadius: '6px',
              lineHeight: 1
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid #1E293B'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'OVERVIEW' ? '#06B6D4' : 'transparent',
              color: activeTab === 'OVERVIEW' ? '#070C16' : '#94A3B8',
              transition: 'all 0.15s ease'
            }}
          >
            📋 Plan & Subscription
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FEATURES')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'FEATURES' ? '#06B6D4' : 'transparent',
              color: activeTab === 'FEATURES' ? '#070C16' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>✨ Feature Matrix</span>
            <span
              style={{
                backgroundColor: activeTab === 'FEATURES' ? '#070C16' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'FEATURES' ? '#06B6D4' : '#CBD5E1',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.6875rem'
              }}
            >
              {availableCount}/{data?.features?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LIMITS')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'LIMITS' ? '#06B6D4' : 'transparent',
              color: activeTab === 'LIMITS' ? '#070C16' : '#94A3B8',
              transition: 'all 0.15s ease'
            }}
          >
            📊 Quotas & Usage
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#F1F5F9' }}>
                Querying Authoritative Account & Plan Entitlements...
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                Verifying cryptographic license signature and live quotas
              </div>
            </div>
          ) : errorMessage ? (
            <div
              style={{
                padding: '24px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#FCA5A5'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Account Resolution Error</div>
              <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', margin: '8px 0 16px 0' }}>
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={loadAccountData}
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: PLAN & SUBSCRIPTION OVERVIEW */}
              {activeTab === 'OVERVIEW' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Organization Profile Identity Card */}
                  <div
                    style={{
                      padding: '16px 20px',
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Authenticated Organization
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                        {org?.legalName || org?.tradeName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '2px' }}>
                        Type: {org?.partnerType?.replace(/_/g, ' ')} • Status: {org?.lifecycleStatus}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: org?.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: org?.verificationStatus === 'VERIFIED' ? '#10B981' : '#F59E0B',
                          border: org?.verificationStatus === 'VERIFIED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        ● {org?.verificationStatus}
                      </span>
                      {org?.primaryContactEmail && (
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                          Primary: {org.primaryContactEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Founding Partner 1st Year Free Promotional Hero Banner */}
                  {sub?.isFirstYearFree && (
                    <div
                      style={{
                        padding: '16px 20px',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        border: '1.5px solid #10B981',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '2rem' }}>🎁</span>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>
                            Founding Partner Launch Offer: 1st Year 100% Free
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
                            Zero software license charges for 365 days. All clinical, POS, and LIMS operations fully unlocked.
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                          Free Operational Period
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                          {sub.daysRemainingInFreeYear ?? sub.daysRemaining ?? 365} Days Remaining
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Plan & Subscription Status Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {/* Plan Card */}
                    <div
                      style={{
                        padding: '18px 20px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Active Subscription Plan
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 6px 0' }}>
                        {plan?.name || 'NOT CONFIGURED'}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                        {plan?.description || 'No subscription plan has been assigned to this partner account yet.'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#CBD5E1', borderTop: '1px solid #1E293B', paddingTop: '10px' }}>
                        <div>
                          <span style={{ color: '#64748B' }}>Cadence: </span>
                          <strong>{sub?.billingCycle}</strong>
                        </div>
                        {plan && plan.basePrice > 0 && (
                          <div>
                            <span style={{ color: '#64748B' }}>Base: </span>
                            <strong>₹{plan.basePrice.toLocaleString('en-IN')}</strong>
                          </div>
                        )}
                        {plan?.isTrial && (
                          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.625rem' }}>
                            TRIAL
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Validity & Expiry Card */}
                    <div
                      style={{
                        padding: '18px 20px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: sub?.isExpired ? '1px solid #EF4444' : '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.6875rem', color: sub?.isExpired ? '#EF4444' : '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                          Validity & Commercial Status
                        </div>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: sub?.isExpired ? '#EF4444' : sub?.isInGracePeriod ? '#F59E0B' : '#10B981',
                            color: '#FFFFFF'
                          }}
                        >
                          {sub?.status}
                        </span>
                      </div>

                      {/* Expiry Countdown */}
                      <div style={{ margin: '10px 0 14px 0' }}>
                        {sub?.daysRemaining !== null && sub?.daysRemaining !== undefined ? (
                          <div>
                            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: sub?.isExpired ? '#EF4444' : '#F8FAFC' }}>
                              {sub.daysRemaining}
                            </span>
                            <span style={{ fontSize: '0.875rem', color: '#94A3B8', marginLeft: '6px' }}>
                              days remaining
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94A3B8' }}>
                            Auto-Renew / Permanent License
                          </div>
                        )}
                      </div>

                      {/* Explicit Date Table */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', borderTop: '1px solid #1E293B', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Start Date:</span>
                          <span style={{ color: '#CBD5E1', fontWeight: 600 }}>
                            {sub?.startDate ? new Date(sub.startDate).toLocaleDateString() : 'UNKNOWN'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B' }}>Expiry Date:</span>
                          <span style={{ color: sub?.isExpired ? '#F87171' : '#CBD5E1', fontWeight: 600 }}>
                            {sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'UNKNOWN'}
                          </span>
                        </div>
                        {sub?.renewalDate && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Next Renewal:</span>
                            <span style={{ color: '#38BDF8', fontWeight: 600 }}>
                              {new Date(sub.renewalDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {sub?.gracePeriodEnd && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Grace Period Ends:</span>
                            <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                              {new Date(sub.gracePeriodEnd).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post-Year-1 Renewal Tenures & Negotiable Terms */}
                  {sub?.availableRenewalTenures && sub.availableRenewalTenures.length > 0 && (
                    <div
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '12px',
                        padding: '18px 20px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
                            🗓️ Post-Year-1 Renewal Terms & Pre-Negotiated Savings
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                            Authoritative rates applicable after your 1st Free Year. All plans and payment terms are dynamically negotiable from HQ.
                          </div>
                        </div>
                        <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '1px solid #3B82F6', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                          HQ Negotiable Terms
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                        {sub.availableRenewalTenures.map((t) => (
                          <div
                            key={t.tenureCode}
                            style={{
                              backgroundColor: 'rgba(30, 41, 59, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              padding: '12px 10px',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC' }}>{t.label}</div>
                            <div style={{ fontSize: '0.625rem', color: t.defaultDiscountPercent > 0 ? '#34D399' : '#94A3B8', fontWeight: 700, margin: '2px 0' }}>
                              {t.defaultDiscountPercent > 0 ? `Save ${t.defaultDiscountPercent}%` : 'Standard Base'}
                            </div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#38BDF8', marginTop: '6px' }}>
                              ₹{t.totalPrice.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                              (₹{t.monthlyEquivalent.toLocaleString('en-IN')}/mo)
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: '12px', fontSize: '0.6875rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                        <span>💡 Flexible payment terms available: 100% Upfront, 50-50 Split, or Quarterly PDC.</span>
                        <span style={{ color: '#38BDF8', fontWeight: 600 }}>Custom terms? Contact your DOC SEARCH Enterprise Lead.</span>
                      </div>
                    </div>
                  )}

                  {/* Summary Quick Ticker */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid #1E293B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>🛡️</span>
                      <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                        Commercial License Signature: <strong>{sub?.isSignatureValid ? 'Verified (HMAC-SHA256)' : 'Unverified'}</strong>
                      </span>
                    </div>
                    {sub?.licenseKey && (
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94A3B8' }}>
                        Key: {sub.licenseKey.substring(0, 8)}••••••••{sub.licenseKey.slice(-4)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: FEATURE ENTITLEMENT MATRIX */}
              {activeTab === 'FEATURES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Search and Filters */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setFeatureFilter('ALL')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: featureFilter === 'ALL' ? '#38BDF8' : 'rgba(255, 255, 255, 0.08)',
                          color: featureFilter === 'ALL' ? '#0F172A' : '#94A3B8'
                        }}
                      >
                        All ({data?.features?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeatureFilter('AVAILABLE')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: featureFilter === 'AVAILABLE' ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                          color: featureFilter === 'AVAILABLE' ? '#0F172A' : '#94A3B8'
                        }}
                      >
                        ✅ Available ({availableCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeatureFilter('LOCKED')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: featureFilter === 'LOCKED' ? '#EF4444' : 'rgba(255, 255, 255, 0.08)',
                          color: featureFilter === 'LOCKED' ? '#0F172A' : '#94A3B8'
                        }}
                      >
                        🔒 Locked ({lockedCount})
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Filter features by name or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        minWidth: '220px'
                      }}
                    />
                  </div>

                  {/* Feature Cards List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredFeatures.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', fontSize: '0.875rem' }}>
                        No features matching the selected filter criteria.
                      </div>
                    ) : (
                      filteredFeatures.map((feat) => {
                        const isAvailable = feat.status === 'AVAILABLE';
                        return (
                          <div
                            key={feat.id || feat.code}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: isAvailable ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.4)',
                              border: isAvailable ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '1.25rem' }}>
                                {isAvailable ? '✅' : '🔒'}
                              </span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong style={{ fontSize: '0.875rem', color: isAvailable ? '#F8FAFC' : '#94A3B8' }}>
                                    {feat.name}
                                  </strong>
                                  <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', color: '#64748B' }}>
                                    {feat.code}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                                  {feat.description || 'Core healthcare operational capability'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                              <span
                                style={{
                                  fontSize: '0.625rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                  color: '#CBD5E1'
                                }}
                              >
                                {feat.category}
                              </span>

                              <span
                                style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                  color: isAvailable ? '#10B981' : '#F87171',
                                  border: isAvailable ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)'
                                }}
                              >
                                {feat.status}
                              </span>
                            </div>

                            {!isAvailable && feat.reason && (
                              <div
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                  borderRadius: '6px',
                                  fontSize: '0.6875rem',
                                  color: '#FCA5A5',
                                  borderLeft: '2px solid #EF4444'
                                }}
                              >
                                <strong>Reason:</strong> {feat.reason}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: QUOTAS & REAL USAGE COUNTERS */}
              {activeTab === 'LIMITS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Authoritative capacity limits governed by your plan and live counted records in the database.
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {/* Doctor Seats Quota */}
                    {limits?.doctorSeats && (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid #1E293B'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>
                            👨‍⚕️ {limits.doctorSeats.name}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>
                            {limits.doctorSeats.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', margin: '8px 0 4px 0' }}>
                          {limits.doctorSeats.used} <span style={{ fontSize: '0.875rem', color: '#64748B' }}>/ {limits.doctorSeats.limit}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, (limits.doctorSeats.used / limits.doctorSeats.limit) * 100)}%`,
                              height: '100%',
                              backgroundColor: '#06B6D4'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '6px' }}>
                          Remaining capacity: <strong>{limits.doctorSeats.remaining} seats</strong>
                        </div>
                      </div>
                    )}

                    {/* Inpatient Beds Quota */}
                    {limits?.inpatientBeds && (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid #1E293B'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>
                            🛏️ {limits.inpatientBeds.name}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>
                            {limits.inpatientBeds.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', margin: '8px 0 4px 0' }}>
                          {limits.inpatientBeds.used} <span style={{ fontSize: '0.875rem', color: '#64748B' }}>/ {limits.inpatientBeds.limit}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, (limits.inpatientBeds.used / Math.max(1, limits.inpatientBeds.limit)) * 100)}%`,
                              height: '100%',
                              backgroundColor: '#3B82F6'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '6px' }}>
                          Remaining capacity: <strong>{limits.inpatientBeds.remaining} beds</strong>
                        </div>
                      </div>
                    )}

                    {/* Branches Quota */}
                    {limits?.branches && (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid #1E293B'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>
                            🏥 {limits.branches.name}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>
                            {limits.branches.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', margin: '8px 0 4px 0' }}>
                          {limits.branches.used} <span style={{ fontSize: '0.875rem', color: '#64748B' }}>/ {limits.branches.limit}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, (limits.branches.used / Math.max(1, limits.branches.limit)) * 100)}%`,
                              height: '100%',
                              backgroundColor: '#10B981'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '6px' }}>
                          Remaining capacity: <strong>{limits.branches.remaining} branches</strong>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Credits */}
                    {limits?.whatsappCredits && (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid #1E293B'
                        }}
                      >
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>
                          📲 {limits.whatsappCredits.name}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '8px 0 4px 0' }}>
                          Limit: {limits.whatsappCredits.limit?.toLocaleString() ?? 'NOT CONFIGURED'}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          Live usage tracking: <strong style={{ color: '#94A3B8' }}>{limits.whatsappCredits.used}</strong>
                        </div>
                      </div>
                    )}

                    {/* Storage Quota */}
                    {limits?.storageQuotaGb && (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid #1E293B'
                        }}
                      >
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>
                          💾 {limits.storageQuotaGb.name}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '8px 0 4px 0' }}>
                          Quota: {limits.storageQuotaGb.limit} GB
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          Disk usage tracking: <strong style={{ color: '#94A3B8' }}>{limits.storageQuotaGb.used}</strong>
                        </div>
                      </div>
                    )}

                    {/* Concurrent Users */}
                    {limits?.concurrentUsers && (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid #1E293B'
                        }}
                      >
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F1F5F9' }}>
                          👥 {limits.concurrentUsers.name}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '8px 0 4px 0' }}>
                          Max: {limits.concurrentUsers.limit} Users
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          Active session monitor: <strong style={{ color: '#94A3B8' }}>{limits.concurrentUsers.used}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(15, 23, 42, 0.95)'
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
            DOC SEARCH Commercial Health OS • Security Tier 1 Multi-Tenant Isolation
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
