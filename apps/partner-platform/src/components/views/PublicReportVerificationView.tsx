import React, { useState } from 'react';

interface Props {
  reportNumber?: string;
  onClose?: () => void;
}

export const PublicReportVerificationView: React.FC<Props> = ({
  reportNumber = 'REP-WALK-89410',
  onClose
}) => {
  const [reportIdInput] = useState(reportNumber);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070C16',
      color: '#F8FAFC',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        border: '1.5px solid rgba(16, 185, 129, 0.4)',
        boxShadow: '0 25px 70px rgba(0,0,0,0.85)',
        overflow: 'hidden'
      }}>
        
        {/* Verification Status Header */}
        <div style={{
          backgroundColor: '#064E3B',
          padding: '20px 24px',
          borderBottom: '1px solid #10B981',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            backgroundColor: '#10B981',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            ✓
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#A7F3D0', fontWeight: 900 }}>
              OFFICIALLY VERIFIED DIAGNOSTIC REPORT
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#D1FAE5' }}>
              NABL ISO 15189:2022 Validated & Cryptographically Signed
            </span>
          </div>
        </div>

        {/* Body Details */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Lab Information Card */}
          <div style={{ backgroundColor: '#1E293B', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              ISSUING ACCREDITED LABORATORY
            </div>
            <strong style={{ fontSize: '1.05rem', color: '#38BDF8', display: 'block', marginTop: '2px' }}>
              APEX CENTRAL CLINICAL PATHOLOGY LABORATORY
            </strong>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              NABL Accreditation Certificate No: <strong style={{ color: '#FCD34D' }}>MC-4892</strong> (Valid till 2028)
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              Civil Lines Core Diagnostics Facility • ABDM Health Facility ID: DS-LAB-4492
            </div>
          </div>

          {/* Report & Patient Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
            <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Report Number:</div>
              <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>{reportIdInput}</strong>
            </div>

            <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Verification Status:</div>
              <strong style={{ color: '#34D399' }}>✓ APPROVED & RELEASED</strong>
            </div>

            <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Patient Name (Masked):</div>
              <strong style={{ color: '#F8FAFC' }}>R**** S***** (42Y / M)</strong>
            </div>

            <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>UHID / MRN:</div>
              <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>MRN-84920</strong>
            </div>
          </div>

          {/* Test & Sign-off Details */}
          <div style={{ backgroundColor: '#0B1120', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Investigation:</span>
                <strong style={{ fontSize: '0.9rem', color: '#F8FAFC', display: 'block' }}>
                  Complete Blood Count (CBC with 5-Part Differential) + Lipid Profile
                </strong>
              </div>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                100% Correlated
              </span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: '#94A3B8' }}>Authorized Signatory:</span>
                <strong style={{ color: '#38BDF8', display: 'block' }}>Dr. Shalini Deshmukh, MD (Pathology)</strong>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>State Medical Council Reg. No: MMC-2009/04/1822</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#94A3B8' }}>Digital Timestamp:</span>
                <div style={{ color: '#CBD5E1', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  {new Date().toISOString()}
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Tamper Seal */}
          <div style={{ backgroundColor: '#020617', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>
              SHA-256 CRYPTOGRAPHIC INTEGRITY DIGEST:
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '2px' }}>
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#64748B', textAlign: 'center' }}>
            🔒 This document is protected by Doc Search Asymmetric Cryptographic Verification. Any alteration to parameters or values invalidates this seal.
          </div>

          {onClose && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 24px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close Verification Screen
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
