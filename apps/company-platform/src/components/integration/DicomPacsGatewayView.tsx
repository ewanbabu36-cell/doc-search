import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface DicomStudy {
  accessionNumber: string;
  patientName: string;
  modality: 'MR' | 'CT' | 'DX' | 'US';
  studyDescription: string;
  seriesCount: number;
  sliceCount: number;
  studyDate: string;
  pacsServerNode: string;
  radiologistStatus: 'VERIFIED_REPORT' | 'PENDING_READ';
}

const SAMPLE_STUDIES: DicomStudy[] = [
  {
    accessionNumber: 'DICOM-ACC-9041',
    patientName: 'Rahul Sharma (42M)',
    modality: 'MR',
    studyDescription: 'MRI Brain with Contrast (3.0 Tesla Protocol)',
    seriesCount: 6,
    sliceCount: 240,
    studyDate: '2026-08-31 10:15 AM',
    pacsServerNode: 'PACS-NODE-SARITA-VIHAR (Port 104)',
    radiologistStatus: 'VERIFIED_REPORT'
  },
  {
    accessionNumber: 'DICOM-ACC-9042',
    patientName: 'Sunita Kapoor (56F)',
    modality: 'CT',
    studyDescription: 'High-Resolution Computed Tomography (HRCT Chest 128 Slice)',
    seriesCount: 4,
    sliceCount: 380,
    studyDate: '2026-08-31 11:00 AM',
    pacsServerNode: 'PACS-NODE-DELHI-SOUTH (Port 104)',
    radiologistStatus: 'VERIFIED_REPORT'
  },
  {
    accessionNumber: 'DICOM-ACC-9043',
    patientName: 'Devansh Roy (12M)',
    modality: 'DX',
    studyDescription: 'Digital Chest X-Ray (PA View)',
    seriesCount: 1,
    sliceCount: 1,
    studyDate: '2026-08-31 11:30 AM',
    pacsServerNode: 'PACS-NODE-NOIDA-HUB (Port 104)',
    radiologistStatus: 'PENDING_READ'
  }
];

export const DicomPacsGatewayView: React.FC = () => {
  const [studies] = useState<DicomStudy[]>(SAMPLE_STUDIES);
  const [activeViewerStudy, setActiveViewerStudy] = useState<DicomStudy | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🩻 DICOM / PACS Radiology Server Connector & Web Viewer
          </h2>
          <Badge variant="primary">DICOM C-STORE / WADO-RS Online (Port 11112)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          High-speed zero-footprint medical imaging bridge for MRI, CT Scans, and Digital X-Rays across hospital radiology modalities
        </p>
      </div>

      {/* Studies Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accession #</TableHead>
                <TableHead>Patient & Modality</TableHead>
                <TableHead>Study Description</TableHead>
                <TableHead>Series / Slices</TableHead>
                <TableHead>PACS Server Node</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studies.map((s) => (
                <TableRow key={s.accessionNumber}>
                  <TableCell style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700 }}>
                    {s.accessionNumber}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant={s.modality === 'MR' ? 'primary' : s.modality === 'CT' ? 'warning' : 'neutral'}>
                        {s.modality}
                      </Badge>
                      <strong>{s.patientName}</strong>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {s.studyDescription}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {s.seriesCount} Series / {s.sliceCount} Slices
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {s.pacsServerNode}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.radiologistStatus === 'VERIFIED_REPORT' ? 'success' : 'warning'}>
                      {s.radiologistStatus === 'VERIFIED_REPORT' ? '✓ Verified' : '⏳ Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setActiveViewerStudy(s)}
                      style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '4px 12px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      👁️ Launch Web DICOM
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* DICOM Web Viewer Modal Simulator */}
      {activeViewerStudy && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 10009,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#0A0F1D',
            color: '#FFF',
            border: '2px solid #06B6D4',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '840px',
            padding: '24px',
            boxShadow: '0 25px 80px rgba(6, 182, 212, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🩻</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 800, color: '#38BDF8' }}>
                    DICOM High-Resolution Web Imaging Viewer
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {activeViewerStudy.studyDescription} • {activeViewerStudy.patientName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveViewerStudy(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Simulated Medical Imaging Display Canvas */}
            <div style={{ backgroundColor: '#020617', borderRadius: '12px', border: '1px solid #334155', height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '4.5rem', opacity: 0.8, marginBottom: '8px' }}>
                {activeViewerStudy.modality === 'MR' ? '🧠' : activeViewerStudy.modality === 'CT' ? '🫁' : '🦴'}
              </div>
              <span style={{ color: '#06B6D4', fontWeight: 800, fontSize: '0.875rem', letterSpacing: '1px' }}>
                {activeViewerStudy.modality} RADIOLOGICAL SERIES RENDERING (WADO-RS)
              </span>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '4px' }}>
                Window Width: 350 | Window Level: 40 | Matrix: 512x512 Lossless 16-Bit
              </span>

              <div style={{ position: 'absolute', bottom: '12px', left: '14px', fontSize: '0.6875rem', color: '#10B981', fontFamily: 'monospace' }}>
                ● C-STORE Verified • PACS Node {activeViewerStudy.pacsServerNode}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setActiveViewerStudy(null)}
                style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #475569', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontWeight: 700 }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
