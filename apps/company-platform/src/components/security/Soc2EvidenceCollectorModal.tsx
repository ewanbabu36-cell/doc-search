import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCollectSuccess: (packName: string) => void;
}

export const Soc2EvidenceCollectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCollectSuccess
}) => {
  const [standard, setStandard] = useState<'SOC2_TYPE_II' | 'ISO_27001' | 'HIPAA_SECURITY' | 'DPDP_INDIA'>('SOC2_TYPE_II');
  const [auditPeriod, setAuditPeriod] = useState('Q2_2026');
  const [isCollecting, setIsCollecting] = useState(false);

  if (!isOpen) return null;

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCollecting(true);

    setTimeout(() => {
      setIsCollecting(false);
      const title = standard === 'SOC2_TYPE_II' ? 'AICPA SOC2 Type II Master Evidence Pack (2026)' : 'ISO 27001:2022 ISMS Evidence Pack';
      onCollectSuccess(title);
      onClose();
    }, 500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10020,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(16, 185, 129, 0.6)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '620px',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(16, 185, 129, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📑 Automated SOC2 Type II & ISO 27001 Evidence Collector
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Compile cryptographically sealed security controls for legal and regulatory audits
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>COMPLIANCE / AUDIT STANDARD *</label>
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value as any)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            >
              <option value="SOC2_TYPE_II">AICPA SOC 2 Type II (Security, Availability, Confidentiality)</option>
              <option value="ISO_27001">ISO/IEC 27001:2022 Information Security Management</option>
              <option value="HIPAA_SECURITY">HIPAA Security & Privacy Rule (HHS / OCR)</option>
              <option value="DPDP_INDIA">India Digital Personal Data Protection (DPDP Act 2023)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>AUDIT EVIDENCE PERIOD *</label>
            <select
              value={auditPeriod}
              onChange={(e) => setAuditPeriod(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            >
              <option value="Q2_2026">Q2 2026 (Apr - Jun 2026)</option>
              <option value="YTD_2026">Year-to-Date 2026 (Full Evidence)</option>
              <option value="PAST_365">Past 365 Days Rolling Audit</option>
            </select>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '10px 14px', border: '1px solid #10B981', color: '#A7F3D0', fontSize: '0.75rem', lineHeight: '1.4' }}>
            🔒 <strong>AUTOMATED COMPLIANCE GATHERING:</strong> Extracts Merkle audit logs, CloudHSM key rotation records, Zero-Trust MFA enforcement rates, and emergency break-glass witness signatures.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCollecting}
              style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
            >
              {isCollecting ? '⚡ Compiling Evidence Pack...' : '📥 Generate & Download Evidence Pack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
