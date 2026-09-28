import React, { useState } from 'react';
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

export const HospitalPlanUpgradeModal: React.FC<HospitalPlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  targetFeatureName,
  currentUser,
  onUpgradeSuccess
}) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!currentUser?.email) return;
    setIsUpgrading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch authoritative commercial hospital plan from plan master
      const plansRes = await fetch('/api/v1/commercial/plans');
      const plansJson = await plansRes.json();
      const hospitalPlan = plansJson?.data?.find(
        (p: any) => p.code === 'PLAN_HOSPITAL_ANNUAL' || p.code.includes('HOSPITAL')
      );

      if (!hospitalPlan?.id) {
        setErrorMessage('Authoritative Hospital Annual Plan (₹20,000/yr) not found in plan catalog.');
        setIsUpgrading(false);
        return;
      }

      // 2. Fetch authenticated partner account profile
      const accountRes = await fetch('/api/v1/partner/account/plan-and-features');
      const accountJson = await accountRes.json();
      const partnerId = accountJson?.data?.organizationProfile?.partnerId;

      if (!partnerId) {
        setErrorMessage('Partner profile verification required before commercial checkout.');
        setIsUpgrading(false);
        return;
      }

      // 3. Create server-side commercial order snapshot and checkout order
      const checkoutRes = await fetch('/api/v1/commercial/create-checkout-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          planId: hospitalPlan.id,
          durationYears: 1,
          customerBillingAddress: currentUser.tenantName || 'Hospital Headquarters'
        })
      });

      const checkoutJson = await checkoutRes.json();
      if (checkoutRes.ok && checkoutJson.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onUpgradeSuccess?.(HOSPITAL_PRO_TIER_NAME);
          onClose();
        }, 1500);
      } else {
        setErrorMessage(checkoutJson.message || checkoutJson.error?.message || 'Failed to initiate commercial checkout order.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during commercial checkout.');
    } finally {
      setIsUpgrading(false);
    }
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
        backgroundColor: 'rgba(3, 7, 18, 0.65)',
        backdropFilter: 'blur(10px)',
        padding: 0,
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUpgrading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '100vh',
          backgroundColor: '#0F172A',
          borderLeft: '1.5px solid #6366F1',
          borderRadius: '20px 0 0 20px',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
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
            padding: '24px 28px 20px',
            borderBottom: '1px solid #1E293B',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(124, 58, 237, 0.18) 100%)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                  color: '#FFFFFF'
                }}
              >
                ✨ 1-CLICK INSTANT UPGRADE
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                🟢 Currently: {currentUser?.planTier || HOSPITAL_FREE_TIER_NAME}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isUpgrading}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                lineHeight: 1
              }}
              title="Close modal"
            >
              ✕
            </button>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', marginTop: '12px', marginBottom: '6px' }}>
            Upgrade to Hospital Complete Enterprise Suite
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
            Elevate your facility from OPD Foundation to complete clinical ERP operations — Inpatient Beds, OT, TPA Claims, PACS, and Executive Command.
          </p>

          {targetFeatureName && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🔒</span>
              <span style={{ fontSize: '0.84rem', color: '#FCA5A5' }}>
                <strong>{targetFeatureName}</strong> is locked on your current Free OPD Core plan. Upgrade below to activate it immediately.
              </span>
            </div>
          )}
        </div>

        {/* Modal Body: Feature Comparison */}
        <div style={{ padding: '24px 28px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Free Tier Card */}
            <div
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                opacity: 0.85
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#10B981' }}>🟢 Hospital Foundation</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>₹0 / Forever</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '14px', lineHeight: 1.4 }}>
                Active plan for outpatient tokens, doctor desks, and digital triage.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'OPD Tokens & Reception Registry',
                  'Doctor OPD Desk & Prescription EMR',
                  'Nurse Vitals & Triage Station',
                  'ABHA Scan & Share QR Counter',
                  'Instant Cashier & Billing Desk',
                  'WhatsApp Digital Rx Pass',
                  'Max 5 Doctor Profiles',
                  '0 Inpatient Beds (Locked)'
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#CBD5E1' }}>
                    <span style={{ color: item.includes('0 Inpatient') ? '#EF4444' : '#10B981' }}>
                      {item.includes('0 Inpatient') ? '✕' : '✓'}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Complete Suite Card */}
            <div
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '2px solid #818CF8',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '16px',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}
              >
                RECOMMENDED
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#A5B4FC' }}>🟣 Complete Enterprise Suite</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>₹20,000<span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>/yr (GST Incl.)</span></span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#C7D2FE', marginBottom: '14px', lineHeight: 1.4 }}>
                Unlocks every clinical department, inpatient matrix, and insurance claim suite for ₹20,000/year (18% GST Inclusive, SAC 998313).
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Everything in Foundation + OPD',
                  '24x7 Inpatient ADT Bed Matrix & Wards',
                  'Operation Theatres (OT) & PAC Scheduling',
                  'Emergency & Code Blue Trauma Bay',
                  'Cashless Insurance & NHCX / TPA Claims',
                  'Blood Bank, Component & Cross-Match',
                  'Web DICOM PACS & Radiology Viewer',
                  'Executive Command Center & Telemetry',
                  'NABH Quality & Infection Control',
                  'Dietary & Kitchen Meal Scheduling',
                  'MRD & Legal ICD-10 Archive',
                  'Unlimited Doctors & Bed Capacity'
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#FFFFFF' }}>
                    <span style={{ color: '#818CF8', fontWeight: 800 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1.5px solid #10B981',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              <span>🎉</span>
              <span>Upgrade Successful! All hospital enterprise modules are now permanently unlocked.</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #EF4444',
                color: '#F87171',
                fontSize: '0.85rem'
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Footer / CTA */}
        <div
          style={{
            padding: '18px 28px 24px',
            borderTop: '1px solid #1E293B',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Billed Annually • Zero Data Deletion • Active Extension Preserves Remaining Days</span>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Cryptographically signed license activation upon server payment verification</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isUpgrading}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                border: '1px solid #334155',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Stay on Free OPD
            </button>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgrading || isSuccess}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                background: isSuccess
                  ? '#10B981'
                  : 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                border: '1.5px solid #A78BFA',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: isUpgrading || isSuccess ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: '0 0 16px rgba(124, 58, 237, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isUpgrading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  <span>Activating Suite...</span>
                </>
              ) : isSuccess ? (
                <>
                  <span>✓</span>
                  <span>Complete Suite Activated</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Activate Complete Suite Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
