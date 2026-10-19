// Sovra Doctor Anti-Spam & Consultation Management Controls
// Solves Weakness #4 (Doctor Spam & Harassment: 1-Click Mute, Block Patient, and Archive Consultation)
// Protects doctor's peace of mind with instant local blocklist and mute toggles.

import React, { useState } from 'react';
import { Conversation } from '../types.js';

interface DoctorChatControlsProps {
  conversation: Conversation;
  onToggleMute: (isMuted: boolean) => void;
  onToggleBlock: (isBlocked: boolean) => void;
  onArchive: () => void;
  onOpenStandee: () => void;
}

export const DoctorChatControls: React.FC<DoctorChatControlsProps> = ({
  conversation,
  onToggleMute,
  onToggleBlock,
  onArchive,
  onOpenStandee
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Doctor Consultation Controls (Mute, Block, Archive)"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#F8FAFC',
          borderRadius: '8px',
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>⚙️</span>
        <span style={{ fontSize: '11px', fontWeight: 600 }}>Doctor Tools</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '240px',
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '14px',
              padding: '8px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'fadeInMsg 0.15s ease'
            }}
          >
            <div style={{ padding: '6px 10px', fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              Consultation Governance
            </div>

            {/* Mute Toggle */}
            <button
              onClick={() => {
                onToggleMute(!conversation.isMuted);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: conversation.isMuted ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                color: conversation.isMuted ? '#FBBF24' : '#E2E8F0',
                border: 'none',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <span>{conversation.isMuted ? '🔔' : '🔕'}</span>
              <span>{conversation.isMuted ? 'Unmute Notifications' : 'Mute Patient Alerts'}</span>
            </button>

            {/* Block Patient Toggle */}
            <button
              onClick={() => {
                const confirmMsg = conversation.isBlocked
                  ? `Unblock ${conversation.participantName}?`
                  : `Block ${conversation.participantName}? They will no longer be able to message you.`;
                if (window.confirm(confirmMsg)) {
                  onToggleBlock(!conversation.isBlocked);
                  setIsOpen(false);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: conversation.isBlocked ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: conversation.isBlocked ? '#F87171' : '#FCA5A5',
                border: 'none',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <span>🚫</span>
              <span>{conversation.isBlocked ? 'Unblock Patient' : 'Block & Restrict Patient'}</span>
            </button>

            {/* Archive Consultation */}
            <button
              onClick={() => {
                onArchive();
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: '#38BDF8',
                border: 'none',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <span>📁</span>
              <span>Archive Case / Mark Done</span>
            </button>

            <div style={{ height: '1px', background: '#334155', margin: '4px 0' }} />

            {/* Printable Desk Standee */}
            <button
              onClick={() => {
                onOpenStandee();
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(15, 118, 110, 0.2)',
                color: '#5EEAD4',
                border: '1px solid rgba(20, 184, 166, 0.3)',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              <span>🖨️</span>
              <span>Generate Desk QR Standee</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
