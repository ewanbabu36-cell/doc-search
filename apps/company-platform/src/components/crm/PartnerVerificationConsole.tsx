import React, { useState } from 'react';
import { Badge } from '@docsearch/ui-kit';

export interface PendingVerificationItem {
  id: string;
  partnerName: string;
  partnerType: 'PATHOLOGY' | 'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'DOCTOR';
  tenantSlug: string;
  submittedBy: string;
  submittedAt: string;
  category: 'BANK' | 'ADDRESS' | 'LICENSE_CERTIFICATE';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  details: Record<string, string>;
  documentName: string;
  documentType: string;
  aiMatchScore: number;
  extractedOcrText: string;
  expiryDate?: string;
  sha256Hash: string;
}

export const INITIAL_VERIFICATION_QUEUE: PendingVerificationItem[] = [
  {
    id: 'VERIF-2026-001',
    partnerName: 'Tata Pathology & Diagnostic Laboratory',
    partnerType: 'PATHOLOGY',
    tenantSlug: 'tata-pathology-mumbai',
    submittedBy: 'Dr. R. K. Tata, MD',
    submittedAt: 'Today at 07:15 AM',
    category: 'LICENSE_CERTIFICATE',
    status: 'PENDING_APPROVAL',
    details: {
      'NABL Accreditation No': 'MC-4892-2026 (ISO 15189:2022)',
      'Head Pathologist': 'Dr. R. K. Tata, MD (Pathology)',
      'Medical Council Reg No': 'MMC-78291-B',
      'Bio-Medical Waste No': 'BMW-POLLUTION-2026-441',
      'License Expiry Date': '2028-12-31 (840 Days Remaining)'
    },
    documentName: 'nabl_iso15189_tata_pathology_2026.pdf',
    documentType: 'NABL ISO 15189 Certificate',
    aiMatchScore: 99.4,
    extractedOcrText: 'NATIONAL ACCREDITATION BOARD FOR TESTING AND CALIBRATION LABORATORIES • CERTIFICATE NO: MC-4892 • ACCREDITED TO: TATA PATHOLOGY LAB • DISCIPLINE: CLINICAL PATHOLOGY, BIOCHEMISTRY, HEMATOLOGY • VALID UNTIL 31-DEC-2028',
    expiryDate: '2028-12-31',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'VERIF-2026-002',
    partnerName: 'Tata Pathology & Diagnostic Laboratory',
    partnerType: 'PATHOLOGY',
    tenantSlug: 'tata-pathology-mumbai',
    submittedBy: 'Dr. R. K. Tata, MD',
    submittedAt: 'Today at 07:18 AM',
    category: 'BANK',
    details: {
      'Account Holder': 'Tata Pathology Healthcare LLP',
      'Bank Name': 'HDFC Bank Ltd (Nariman Point)',
      'Account Number': '50200084920192',
      'IFSC Code': 'HDFC0000240',
      'Settlement Cycle': 'Daily T+1 Direct IMPS Auto-Settlement'
    },
    status: 'PENDING_APPROVAL',
    documentName: 'cancelled_cheque_hdfc_tatapathology.pdf',
    documentType: 'Bank Cancelled Cheque Proof',
    aiMatchScore: 98.8,
    extractedOcrText: 'HDFC BANK • NARIMAN POINT BRANCH • A/C NO: 50200084920192 • BENEFICIARY: TATA PATHOLOGY HEALTHCARE LLP • IFSC: HDFC0000240 • CANCELLED',
    sha256Hash: '4a6b2c8901dfbc3384219a15998a44b827ac31d99042b891823901b89721ac02'
  },
  {
    id: 'VERIF-2026-003',
    partnerName: 'Apex Multi-Specialty Hospital',
    partnerType: 'HOSPITAL',
    tenantSlug: 'apex-hospital-delhi',
    submittedBy: 'Dr. Alok Sharma, Medical Director',
    submittedAt: 'Yesterday at 04:30 PM',
    category: 'ADDRESS',
    status: 'PENDING_APPROVAL',
    details: {
      'Legal Entity': 'Apex Multi-Specialty Clinics Pvt Ltd',
      'Registered Address': 'Plot No. 14, Health City, Outer Ring Road',
      'City, State, PIN': 'New Delhi, Delhi - 110048',
      'Clinical Establishment No': 'CEA-DL-2026-1049',
      'Fire NOC Certificate': 'FIRE-NOC-DL-2026-8812'
    },
    documentName: 'clinical_establishment_reg_apex.pdf',
    documentType: 'State Govt Clinical Establishment License',
    aiMatchScore: 97.6,
    extractedOcrText: 'DIRECTORATE OF HEALTH SERVICES • CLINICAL ESTABLISHMENT REGISTRATION CERTIFICATE • APEX MULTI-SPECIALTY CLINICS • REG NO: CEA-DL-2026-1049 • VALIDITY: 5 YEARS',
    expiryDate: '2030-05-15',
    sha256Hash: '98fbc1234900a87612c8b742a981cde45688192300bca8912746198001bcfa32'
  }
];

export const PartnerVerificationConsole: React.FC = () => {
  const [queue, setQueue] = useState<PendingVerificationItem[]>(INITIAL_VERIFICATION_QUEUE);
  const [selectedId, setSelectedId] = useState<string>(queue[0]?.id || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const selectedItem = queue.find((q) => q.id === selectedId) || queue[0];

  const handleApprove = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
    );
    setToastMessage(`✓ [APPROVED & SEALED] Issued Gold Trust Badge to ${selectedItem?.partnerName || 'Partner'}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReject = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item))
    );
    setToastMessage(`⚠️ [REVISION REQUESTED] Notification sent to ${selectedItem?.partnerName || 'Partner'} to re-upload.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              Partner Verification & Regulatory Review Console
            </h1>
            <Badge variant="primary">AI Pre-Checked</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>
            Multi-tier split-screen compliance audit, AI OCR match verification, NABL/Council license validation, and digital Gold Trust Seal issuance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge variant={queue.some((q) => q.status === 'PENDING_APPROVAL') ? 'warning' : 'success'}>
            Pending Review: {queue.filter((q) => q.status === 'PENDING_APPROVAL').length}
          </Badge>
          <Badge variant="success">
            Approved & Sealed: {queue.filter((q) => q.status === 'APPROVED').length}
          </Badge>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid #10B981', color: '#A7F3D0', padding: '12px 20px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 800 }}>
          {toastMessage}
        </div>
      )}

      {/* Split-Screen Review Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
        
        {/* Column 1: Pending Queue Selector */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, fontSize: '0.8125rem', color: '#94A3B8', textTransform: 'uppercase' }}>
            Verification Queue ({queue.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '640px' }}>
            {queue.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #06B6D4' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.8125rem', color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                      {item.partnerName}
                    </strong>
                    <Badge variant={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'} style={{ fontSize: '0.625rem' }}>
                      {item.status === 'APPROVED' ? '✓ APPROVED' : item.status === 'REJECTED' ? 'REJECTED' : 'PENDING'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    {item.documentType}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                    <span>{item.submittedAt}</span>
                    <span style={{ color: '#34D399', fontWeight: 700 }}>AI Match: {item.aiMatchScore}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Submitted Metadata & AI Pre-Audit Comparison */}
        {selectedItem && (
          <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#06B6D4', fontWeight: 800, textTransform: 'uppercase' }}>
                  {selectedItem.category} COMPLIANCE AUDIT
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC' }}>
                  {selectedItem.partnerName}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Tenant: <code style={{ color: '#38BDF8' }}>{selectedItem.tenantSlug}</code> • By {selectedItem.submittedBy}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  🤖 AI OCR Match: {selectedItem.aiMatchScore}%
                </div>
              </div>
            </div>

            {/* Submitted Metadata Key-Values */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                SUBMITTED PARTNER METADATA:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#070C16', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                {Object.entries(selectedItem.details).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#94A3B8' }}>{key}:</span>
                    <strong style={{ color: '#F8FAFC', textAlign: 'right' }}>{val}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* AI OCR Extracted Text & Cross-Match */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                🤖 AI EXTRACTED OCR TEXT FROM ATTACHED DOCUMENT:
              </span>
              <div style={{ backgroundColor: '#070C16', padding: '10px', borderRadius: '8px', border: '1px dashed rgba(6, 182, 212, 0.3)', fontSize: '0.75rem', color: '#CBD5E1', fontFamily: 'monospace', lineHeight: 1.4 }}>
                "{selectedItem.extractedOcrText}"
              </div>
            </div>

            {/* Cryptographic SHA-256 Digital Fingerprint */}
            <div>
              <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                CRYPTOGRAPHIC SHA-256 DOCUMENT HASH:
              </span>
              <code style={{ fontSize: '0.625rem', color: '#94A3B8', wordBreak: 'break-all', display: 'block', backgroundColor: '#070C16', padding: '4px 6px', borderRadius: '4px' }}>
                {selectedItem.sha256Hash}
              </code>
            </div>

            {/* Admin Decision Buttons */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={() => handleApprove(selectedItem.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  color: '#070C16',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 900,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                ✓ Approve & Issue Gold Trust Badge
              </button>

              <button
                type="button"
                onClick={() => handleReject(selectedItem.id)}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #EF4444',
                  color: '#FCA5A5',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                ⚠️ Request Re-upload
              </button>
            </div>
          </div>
        )}

        {/* Column 3: High-Res Document Preview & Security Watermark */}
        {selectedItem && (
          <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                📄 Interactive Document Viewer
              </span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                  style={{ backgroundColor: '#1E293B', color: '#FFF', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
                  style={{ backgroundColor: '#1E293B', color: '#FFF', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Document Render Canvas */}
            <div style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '10px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
              minHeight: '460px'
            }}>
              {/* Tamper-Evident Diagonal Watermark */}
              <div style={{
                position: 'absolute',
                top: '40%',
                left: '10%',
                transform: 'rotate(-30deg)',
                fontSize: '1.4rem',
                fontWeight: 900,
                color: 'rgba(6, 182, 212, 0.15)',
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap'
              }}>
                DOC SEARCH DIGITAL AUDIT VAULT • VERIFIED COPY
              </div>

              {/* Simulated High-Res Certificate Mock */}
              <div style={{ border: '3px double #0284C7', padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid #CBD5E1', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '1.5rem' }}>🏛️</div>
                  <h4 style={{ margin: '4px 0 0', fontSize: '0.9375rem', fontWeight: 900, color: '#0369A1', textTransform: 'uppercase' }}>
                    {selectedItem.documentType}
                  </h4>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>GOVERNMENT REGULATORY & QUALITY ACCREDITATION AUTHORITY</span>
                </div>

                <div style={{ margin: '14px 0', fontSize: '0.75rem', lineHeight: 1.5, color: '#334155' }}>
                  <p><strong>Issued To:</strong> {selectedItem.partnerName}</p>
                  <p><strong>License / Certificate No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedItem.details['NABL Accreditation No'] || selectedItem.details['Clinical Establishment No'] || selectedItem.details['Account Number'] || 'MC-4892-2026'}</span></p>
                  <p><strong>Regulatory Compliance:</strong> Standards verified under ISO 15189:2022 & Clinical Establishment Act.</p>
                  {selectedItem.expiryDate && <p><strong>Validity Expiry Date:</strong> <strong style={{ color: '#16A34A' }}>{selectedItem.expiryDate}</strong></p>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '8px', fontSize: '0.625rem', color: '#64748B' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: 700 }}>Digitally Verified By AI OCR</span>
                    <span>Confidence Score: {selectedItem.aiMatchScore}%</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'cursive', fontSize: '0.875rem', color: '#0369A1' }}>Registrar General</div>
                    <span>Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Clean Copy Button */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                📁 Filename: {selectedItem.documentName}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
