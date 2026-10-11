import React from 'react';
import { type Language } from '../i18n.js';
import { type PatientProfile } from '../services/patient-api.js';

interface Props {
  language: Language;
  patient: PatientProfile;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<Props> = ({ language, patient, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 210,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Top Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', backgroundColor: '#ECFDF5', padding: '4px 10px', borderRadius: '12px' }}>
            ● {language === 'hi' ? 'भुगतान सफल (PAID)' : 'PAID & VERIFIED'}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#F1F5F9',
              border: 'none',
              color: '#64748B',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Hospital Letterhead Branding */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #CBD5E1', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
            🏥 APEX CARE HOSPITAL
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Vibhuti Khand, Gomti Nagar • GSTIN: 09AAACH7821Q1Z4
          </div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginTop: '4px', color: '#0284C7' }}>
            OPD CONSULTATION FEE RECEIPT
          </div>
        </div>

        {/* Patient Details Table */}
        <div style={{ fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B' }}>Receipt No:</span>
            <strong>#RCP-3817</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B' }}>Date:</span>
            <span>11 Oct 2026, 11:30 AM</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B' }}>Patient Name:</span>
            <strong>{patient.fullName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B' }}>UHID / MRN:</span>
            <strong>{patient.uhid}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B' }}>Doctor:</span>
            <span>Dr. Vivek Sharma (MD)</span>
          </div>
        </div>

        {/* Amount Box */}
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem' }}>
            <span>OPD Specialist Consultation Fee</span>
            <strong>₹500.00</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem' }}>
            <span>Digital Registration Fee</span>
            <span style={{ color: '#10B981' }}>FREE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', paddingTop: '8px', fontSize: '1rem', fontWeight: 900 }}>
            <span>Total Paid</span>
            <span style={{ color: '#0F172A' }}>₹500.00</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
            Mode: UPI / PhonePe (Ref: UPI/9102847120)
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🖨️ {language === 'hi' ? 'प्रिंट / सेव' : 'Print / Save'}
          </button>
          <button
            type="button"
            onClick={() => alert(`Receipt #${'RCP-3817'} shared to WhatsApp`)}
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            💬 WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
