import React, { useState } from 'react';
import { Badge } from '@docsearch/ui-kit';

export interface PipDraftPayload {
  patientId: string;
  patientName: string;
  uhid: string;
  tokenNo: string;
  chamberRoom?: string | undefined;
  draftSummary: string; // e.g. "3 Meds prescribed • Dx: Viral Fever"
  elapsedMinutes: number;
}

export interface FloatingPictureInPictureTrayProps {
  draft?: PipDraftPayload | null | undefined;
  isOpen: boolean;
  onResume: () => void;
  onDiscard: () => void;
}

export const FloatingPictureInPictureTray: React.FC<FloatingPictureInPictureTrayProps> = ({
  draft,
  isOpen,
  onResume,
  onDiscard
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!isOpen || !draft) return null;

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '18px',
          right: '24px',
          zIndex: 9998,
          backgroundColor: '#0F172A',
          border: '1.5px solid #0284C7',
          borderRadius: '24px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(2, 132, 199, 0.4)',
          color: '#F8FAFC',
          fontSize: '0.78rem',
          fontWeight: 800,
          animation: 'bounce 2s infinite'
        }}
        title="Active Consultation Docked • Click to expand PiP tray"
      >
        <span style={{ fontSize: '1rem' }}>📌</span>
        <span>Draft: {draft.patientName}</span>
        <Badge variant="info">{draft.elapsedMinutes}m ago</Badge>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '24px',
        zIndex: 9998,
        width: '320px',
        backgroundColor: '#0B1120',
        border: '1.5px solid #0284C7',
        borderRadius: '14px',
        padding: '14px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(2, 132, 199, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>📌</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Consultation Docked (PiP)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '2px 4px'
            }}
            title="Minimize to Pill"
          >
            _
          </button>
          <button
            type="button"
            onClick={onDiscard}
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '2px 4px'
            }}
            title="Discard Draft"
          >
            ✕
          </button>
        </div>
      </div>

      {/* PATIENT INFO & SUMMARY */}
      <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '10px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#F8FAFC' }}>
              {draft.patientName}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontFamily: 'monospace' }}>
              {draft.uhid} • Token #{draft.tokenNo}
            </div>
          </div>
          <Badge variant="neutral" style={{ fontSize: '0.65rem' }}>
            {draft.elapsedMinutes}m elapsed
          </Badge>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '6px', lineHeight: 1.3 }}>
          {draft.draftSummary}
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          type="button"
          onClick={onDiscard}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #334155',
            color: '#94A3B8',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '0.72rem',
            cursor: 'pointer'
          }}
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onResume}
          style={{
            backgroundColor: '#0284C7',
            border: 'none',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
          }}
        >
          Resume Consultation ➔
        </button>
      </div>
    </div>
  );
};
