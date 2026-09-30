import React from 'react';
import { MODULE_METADATA, type PartnerModuleKey } from '../PartnerPlatformShell.js';

export interface HospitalFeatureUpgradeShowcaseProps {
  moduleKey: PartnerModuleKey;
  onOpenUpgradeModal: (featureName: string) => void;
  onReturnHome: () => void;
}

export const HospitalFeatureUpgradeShowcase: React.FC<HospitalFeatureUpgradeShowcaseProps> = ({
  moduleKey,
  onOpenUpgradeModal,
  onReturnHome
}) => {
  const meta = MODULE_METADATA[moduleKey] || {
    title: moduleKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: '🔒'
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
        padding: '32px 20px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          width: '100%',
          backgroundColor: '#0F172A',
          border: '1.5px solid #6366F1',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 25px 60px -15px rgba(99, 102, 241, 0.25)',
          textAlign: 'center',
          color: '#F8FAFC'
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            border: '2px solid #818CF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.4rem',
            margin: '0 auto 20px',
            boxShadow: '0 0 24px rgba(99, 102, 241, 0.35)'
          }}
        >
          {meta.icon || '🔒'}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              letterSpacing: '0.04em'
            }}
          >
            🔒 COMPLETE ENTERPRISE FEATURE
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
            Current Plan: Free OPD Core
          </span>
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 12px' }}>
          {meta.title} is locked
        </h2>

        <p style={{ fontSize: '0.92rem', color: '#94A3B8', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: '540px' }}>
          Your facility is running on the <strong>Hospital Foundation (Free OPD Core)</strong> plan.
          To access <strong>{meta.title}</strong>, Inpatient Bed Matrix, OT Rostering, Cashless Insurance & NHCX claims, and Executive Command Telemetry, upgrade to the Complete Enterprise Suite.
        </p>

        {/* Feature Preview List */}
        <div
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px 20px',
            textAlign: 'left',
            marginBottom: '28px'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#A5B4FC', marginBottom: '10px', letterSpacing: '0.04em' }}>
            WHAT UNLOCKS IN COMPLETE ENTERPRISE SUITE (₹4,999/mo):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', fontSize: '0.82rem', color: '#E2E8F0' }}>
            <div>🛏️ 24x7 Inpatient ADT Bed Matrix</div>
            <div>🔪 Operation Theatres (OT) & PAC</div>
            <div>🚨 Emergency & Code Blue Bay</div>
            <div>📑 TPA Insurance & NHCX Claims</div>
            <div>🩸 Blood Bank & Cross-Match</div>
            <div>☢️ Web DICOM PACS Viewer</div>
            <div>📊 Executive Command Center</div>
            <div>🧼 NABH Quality & Infection Control</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onReturnHome}
            style={{
              padding: '11px 20px',
              borderRadius: '10px',
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              color: '#CBD5E1',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            ← Return to Home Overview
          </button>

          <button
            type="button"
            onClick={() => onOpenUpgradeModal(meta.title)}
            style={{
              padding: '11px 26px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              border: '1.5px solid #A78BFA',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚡</span>
            <span>Upgrade to Complete Suite (₹4,999/mo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
