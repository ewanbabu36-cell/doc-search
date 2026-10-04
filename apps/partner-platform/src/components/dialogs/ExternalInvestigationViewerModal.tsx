import React, { useState } from 'react';

export interface ExternalReportItem {
  id: string;
  title: string;
  sourceLab: string;
  reportDate: string;
  modality: 'ULTRASOUND' | 'BLOOD_TEST' | 'XRAY' | 'ECG';
  findingsSummary: string;
  imageUrl?: string;
  abnormalFlag: boolean;
}

export interface ExternalInvestigationViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientMrn: string;
}

const SAMPLE_EXTERNAL_REPORTS: ExternalReportItem[] = [
  {
    id: 'ext-usg-1',
    title: 'Whole Abdomen & Pelvis Ultrasound',
    sourceLab: 'Apex Diagnostic & Imaging Center',
    reportDate: '02-Oct-2026',
    modality: 'ULTRASOUND',
    findingsSummary: 'Liver: Mild hepatomegaly (15.8 cm) with diffuse increase in parenchymal echogenicity suggestive of Grade-1 Fatty Infiltration. Gallbladder: Normal, no calculi. Kidneys: Normal cortico-medullary differentiation. Spleen: Normal.',
    abnormalFlag: true
  },
  {
    id: 'ext-blood-1',
    title: 'Comprehensive Lipid & Glycated Hemoglobin (HbA1c)',
    sourceLab: 'Dr. Lal PathLabs Pvt Ltd',
    reportDate: '28-Sep-2026',
    modality: 'BLOOD_TEST',
    findingsSummary: 'HbA1c: 7.8% (Uncontrolled Diabetes) • Fasting Plasma Glucose: 164 mg/dL • Total Cholesterol: 228 mg/dL • Serum Triglycerides: 242 mg/dL (Elevated) • HDL: 38 mg/dL (Low).',
    abnormalFlag: true
  },
  {
    id: 'ext-xray-1',
    title: 'Digital Chest X-Ray (PA View)',
    sourceLab: 'City Care Hospital Radiology',
    reportDate: '15-Sep-2026',
    modality: 'XRAY',
    findingsSummary: 'Both lung fields show normal vascularity. Bilateral costophrenic angles are clear. Cardiac silhouette is within normal limits (CTR < 0.5). Bony thorax intact. Impression: No active parenchymal lesion.',
    abnormalFlag: false
  }
];

export const ExternalInvestigationViewerModal: React.FC<ExternalInvestigationViewerModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientMrn
}) => {
  const defaultReport: ExternalReportItem = SAMPLE_EXTERNAL_REPORTS[0] || {
    id: 'ext-default',
    title: 'Diagnostic Report',
    sourceLab: 'Laboratory',
    reportDate: 'Today',
    modality: 'BLOOD_TEST',
    findingsSummary: 'Normal diagnostic findings.',
    abnormalFlag: false
  };

  const [reports, setReports] = useState<ExternalReportItem[]>(SAMPLE_EXTERNAL_REPORTS);
  const [selectedReportId, setSelectedReportId] = useState<string>(SAMPLE_EXTERNAL_REPORTS[0]?.id || 'ext-1');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLab, setUploadLab] = useState('');
  const [uploadFindings, setUploadFindings] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!isOpen) return null;

  const currentReport: ExternalReportItem = reports.find((r) => r.id === selectedReportId) || reports[0] || defaultReport;

  const handleAddNewReport = () => {
    if (!uploadTitle.trim()) return;
    const newRep: ExternalReportItem = {
      id: `ext-upload-${Date.now()}`,
      title: uploadTitle,
      sourceLab: uploadLab || 'Outside Diagnostic Laboratory',
      reportDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      modality: 'BLOOD_TEST',
      findingsSummary: uploadFindings || 'External report scanned and attached to patient EMR.',
      abnormalFlag: true
    };
    setReports((prev) => [newRep, ...prev]);
    setSelectedReportId(newRep.id);
    setIsUploading(false);
    setUploadTitle('');
    setUploadLab('');
    setUploadFindings('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.85), 0 0 30px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E293B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📑</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#38BDF8' }}>
                Outside Diagnostic Scans & Lab Report Viewer
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {patientName} • {patientMrn} • External Ultrasound, X-Ray & Pathology Attachments
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsUploading((prev) => !prev)}
              style={{
                backgroundColor: isUploading ? '#64748B' : 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>📷</span>
              <span>{isUploading ? 'Cancel Upload' : 'Upload / Snap Scan'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
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
        </div>

        {/* Upload Form Tray */}
        {isUploading && (
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8' }}>
              Attach External Paper Document / Diagnostic Report:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Report Title (e.g. 2D Echo / Abdominal USG / Lipid Profile)"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.75rem' }}
              />
              <input
                type="text"
                placeholder="Diagnostic Center / Lab Name (e.g. Dr. Lal PathLabs)"
                value={uploadLab}
                onChange={(e) => setUploadLab(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.75rem' }}
              />
            </div>
            <textarea
              placeholder="Clinical Findings / Key Abnormalities noted on report..."
              value={uploadFindings}
              onChange={(e) => setUploadFindings(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0B111E', border: '1px solid rgba(255,255,255,0.15)', color: '#F8FAFC', fontSize: '0.75rem', resize: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={handleAddNewReport}
                style={{ backgroundColor: '#10B981', color: '#070C16', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              >
                ✓ Save & Attach to Patient File
              </button>
            </div>
          </div>
        )}

        {/* Main Split Layout: Left Report Selector | Right Document Display */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', overflow: 'hidden' }}>
          {/* Left Report Directory */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(15, 23, 42, 0.6)', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Attached Reports ({reports.length}):
            </div>
            {reports.map((rep) => {
              const isSelected = rep.id === selectedReportId;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                      {rep.title}
                    </span>
                    {rep.abnormalFlag && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', padding: '1px 5px', borderRadius: '4px' }}>
                        Abnormal
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                    {rep.sourceLab}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: '#64748B' }}>
                    📅 {rep.reportDate} • {rep.modality}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Document & Film Viewer */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#070C16', overflow: 'hidden' }}>
            {/* Viewer Toolbar */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0B111E' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                  {currentReport.title}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                  ({currentReport.sourceLab} • {currentReport.reportDate})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', minWidth: '40px', textAlign: 'center' }}>
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(180, z + 15))}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.7rem', cursor: 'pointer', marginLeft: '6px' }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: `${zoomLevel}%`,
                  maxWidth: '700px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  borderRadius: '8px',
                  padding: '30px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                {/* Simulated Diagnostic Report Document */}
                <div style={{ borderBottom: '2px solid #0284C7', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0369A1' }}>{currentReport.sourceLab}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Department of Radiodiagnosis & Clinical Pathology</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#475569' }}>
                      <div><strong>Date:</strong> {currentReport.reportDate}</div>
                      <div><strong>Barcode:</strong> {currentReport.id.toUpperCase()}</div>
                    </div>
                  </div>
                </div>

                {/* Patient Header Block */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '18px' }}>
                  <div><strong>Patient:</strong> {patientName}</div>
                  <div><strong>MRN / UHID:</strong> {patientMrn}</div>
                  <div><strong>Modality:</strong> {currentReport.modality}</div>
                  <div><strong>Status:</strong> Verified Final</div>
                </div>

                {/* Findings Block */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', marginBottom: '8px' }}>
                    CLINICAL OBSERVATION & DETAILED FINDINGS:
                  </div>
                  <div style={{ fontSize: '0.82rem', lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap' }}>
                    {currentReport.findingsSummary}
                  </div>
                </div>

                {/* Impression Highlight */}
                {currentReport.abnormalFlag && (
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: '6px', padding: '10px 14px', fontSize: '0.78rem', color: '#991B1B', marginBottom: '20px' }}>
                    <strong>IMPRESSION / CLINICAL CONCLUSION:</strong>
                    <div style={{ marginTop: '4px' }}>
                      Abnormal diagnostic finding noted. Correlate clinically and manage according to standard protocol.
                    </div>
                  </div>
                )}

                {/* Signature */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', textAlign: 'center', fontSize: '0.75rem' }}>
                  <div>
                    <div style={{ borderBottom: '1px solid #475569', width: '160px', height: '30px', marginBottom: '4px' }}></div>
                    <div style={{ fontWeight: 800 }}>Consultant Radiologist / Pathologist</div>
                    <div style={{ color: '#64748B' }}>Verified Digital Report</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
