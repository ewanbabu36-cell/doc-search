import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformEmergencyPanicLockModal: React.FC<Props> = ({
  isOpen,
  onClose
}) => {
  const [broadcastMessage, setBroadcastMessage] = useState('CRITICAL SYSTEM UPDATE: Scheduled core gateway maintenance in 10 minutes. Active video consults will remain uninterrupted.');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleTriggerEmergencyBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.92)',
      backdropFilter: 'blur(8px)',
      zIndex: 10040,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(239, 68, 68, 0.7)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '640px',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(239, 68, 68, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 National Platform Emergency Broadcast & Maintenance Lockout
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Instant global push siren across all Patient Portals, Doctor EMRs & Mobile Apps
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

        {isSent ? (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', borderRadius: '8px', padding: '16px', color: '#A7F3D0', fontWeight: 800, textAlign: 'center' }}>
            ✓ Emergency Broadcast siren successfully pushed to 4,820 Doctor EMRs, 142 Hospital Central Hubs, and 1.8M Active Patient apps!
          </div>
        ) : (
          <form onSubmit={handleTriggerEmergencyBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', padding: '10px 14px', color: '#FCA5A5' }}>
              ⚠️ <strong>EXECUTIVE PROTOCOL WARNING:</strong> This action will trigger a high-priority system-wide visual banner across every connected user in India.
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>BROADCAST ANNOUNCEMENT TEXT *</label>
              <textarea
                rows={3}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', padding: '8px 10px', color: '#FFF', fontSize: '0.8125rem' }}
              />
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
                style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 22px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.5)' }}
              >
                🚨 Trigger Pan-India Siren
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
