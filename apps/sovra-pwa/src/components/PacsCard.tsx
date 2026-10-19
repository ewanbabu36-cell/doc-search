// Sovra Zero-Storage PACS DICOM Clinical Card
// Solves Weakness #5 (200MB+ Heavy CT/MRI Scans filling up browser IndexedDB storage)
// Streams scans directly from DocSearch Orthanc PACS server with 0 MB local phone memory footprint.

import React, { useState } from 'react';
import { PacsStudyData } from '../types.js';
import { PacsDicomViewerModal } from './PacsDicomViewerModal.js';

interface PacsCardProps {
  study: PacsStudyData;
}

export const PacsCard: React.FC<PacsCardProps> = ({ study }) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const getModalityColor = (modality: string) => {
    switch (modality) {
      case 'CT':
        return { bg: 'rgba(56, 189, 248, 0.2)', border: '#38BDF8', text: '#38BDF8' };
      case 'MRI':
        return { bg: 'rgba(168, 85, 247, 0.2)', border: '#A855F7', text: '#C084FC' };
      case 'XRAY':
        return { bg: 'rgba(234, 179, 8, 0.2)', border: '#EAB308', text: '#FDE047' };
      case 'US':
        return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981', text: '#6EE7B7' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', border: '#94A3B8', text: '#E2E8F0' };
    }
  };

  const style = getModalityColor(study.modality);

  return (
    <>
      <div
        className="clinical-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
            borderBottom: '1px solid #334155',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🩻</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#F1F5F9' }}>
                Radiology PACS Study
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>{study.studyInstanceUid.slice(0, 24)}...</div>
            </div>
          </div>

          <span
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: style.text,
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px'
            }}
          >
            {study.modality}
          </span>
        </div>

        {/* Study Details Body */}
        <div style={{ padding: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
            {study.studyDescription}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>
            {study.bodyPart} • {study.sliceCount} DICOM Slices • {study.studyDate}
          </div>

          {/* Key Findings Box */}
          {study.keyFindings && (
            <div
              style={{
                background: '#1E293B',
                borderLeft: '3px solid #38BDF8',
                borderRadius: '0 8px 8px 0',
                padding: '8px 12px',
                fontSize: '11px',
                color: '#CBD5E1',
                lineHeight: 1.4,
                marginBottom: '14px'
              }}
            >
              <div style={{ fontWeight: 700, color: '#F8FAFC', marginBottom: '2px' }}>
                Radiologist Interpretation:
              </div>
              {study.keyFindings}
            </div>
          )}

          {/* Zero Storage Badge */}
          <div
            style={{
              background: 'rgba(15, 118, 110, 0.2)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: '8px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#5EEAD4',
              marginBottom: '14px'
            }}
          >
            <span>☁️ Direct PACS Stream</span>
            <strong>0 MB Phone Storage Used</strong>
          </div>

          {/* Open Viewer CTA */}
          <button
            onClick={() => setIsViewerOpen(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #0F766E 0%, #0369A1 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(3, 105, 161, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🔬 Open Interactive DICOM Viewer</span>
            <span>➔</span>
          </button>
        </div>
      </div>

      {/* Interactive Modal Viewer */}
      {isViewerOpen && (
        <PacsDicomViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          study={study}
        />
      )}
    </>
  );
};
