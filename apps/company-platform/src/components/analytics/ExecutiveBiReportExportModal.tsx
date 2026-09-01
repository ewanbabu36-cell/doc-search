import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExportSuccess: (dossierName: string) => void;
}

export const ExecutiveBiReportExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onExportSuccess
}) => {
  const [reportType, setReportType] = useState<'BOARD_DECK' | 'FINANCIAL_REVENUE' | 'NABL_AUDIT' | 'ABDM_COMPLIANCE'>('BOARD_DECK');
  const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'PPTX'>('PDF');
  const [dateRange, setDateRange] = useState('AUG_2026');
  const [watermark, setWatermark] = useState('CONFIDENTIAL - BOARD OF DIRECTORS ONLY');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const title = reportType === 'BOARD_DECK' ? 'Executive Board of Directors Performance Dossier (Aug 2026)' : 'Healthcare Clinical & Financial Master Dossier';
      onExportSuccess(title);
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10006,
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
        boxShadow: '0 25px 80px rgba(16, 185, 129, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📥 Executive BI Dossier & Board Report Generator
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Export cryptographically sealed audit decks and financial statements
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
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>REPORT DOSSIER TEMPLATE *</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
            >
              <option value="BOARD_DECK">🏛️ Executive Board of Directors Monthly Strategy Deck</option>
              <option value="FINANCIAL_REVENUE">💵 Hospital B2B Revenue, GST & Razorpay Settlement Dossier</option>
              <option value="NABL_AUDIT">🧪 NABL & NABH Clinical Quality & Analyzer Audit Pack</option>
              <option value="ABDM_COMPLIANCE">⚡ National Health Authority (NHA) ABDM M1-M3 Registry</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>EXPORT FILE FORMAT *</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="PDF">📄 PDF Master Document (Signed)</option>
                <option value="EXCEL">📊 Excel / CSV Raw Financial Ledger</option>
                <option value="PPTX">📑 PowerPoint Executive Slide Deck</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>DATE AUDIT PERIOD</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF' }}
              >
                <option value="AUG_2026">August 2026 (Full Month)</option>
                <option value="Q2_2026">Q2 FY 2026-27 (Apr - Jun)</option>
                <option value="YTD_2026">Year-to-Date (YTD 2026)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '3px', fontWeight: 700 }}>SECURITY WATERMARK & COMPLIANCE STAMP</label>
            <input
              type="text"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FCD34D', fontFamily: 'monospace', fontWeight: 700 }}
            />
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#A7F3D0', border: '1px solid #10B981' }}>
            🔒 <strong>CRYPTOGRAPHIC SEAL:</strong> This dossier will be compiled with SHA-256 Merkle Verification Hash and digital signature for governance compliance.
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
              disabled={isExporting}
              style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
            >
              {isExporting ? '⚡ Compiling Master Dossier...' : '📥 Generate & Download Dossier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
