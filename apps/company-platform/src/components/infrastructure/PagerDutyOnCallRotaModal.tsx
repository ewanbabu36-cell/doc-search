import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PagerDutyOnCallRotaModal: React.FC<Props> = ({
  isOpen,
  onClose
}) => {
  const [sirenSent, setSirenSent] = useState(false);

  if (!isOpen) return null;

  const handleTriggerTestSiren = () => {
    setSirenSent(true);
    setTimeout(() => setSirenSent(false), 5000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10016,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1.5px solid rgba(6, 182, 212, 0.6)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '680px',
        padding: '26px',
        boxShadow: '0 25px 80px rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 24x7 SRE On-Call Rota & Escalation Engine
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Automated high-urgency phone voice sirens, SMS, and incident commander escalation
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

        {sirenSent && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', color: '#A7F3D0', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '12px' }}>
            ✓ Test Siren dispatched to Primary On-Call Engineer (+91 98100 XXXXX) via Twilio Voice Call & PagerDuty!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          {/* Active Shift Tiers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ backgroundColor: '#1E293B', border: '1px solid #10B981', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800 }}>TIER 1 (PRIMARY ON-CALL SRE):</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFF' }}>Priya Menon (Lead SRE Engineer)</div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Response SLA: &lt; 5 minutes • Voice Call + Push Notification</span>
              </div>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem' }}>
                ● ON DUTY NOW
              </span>
            </div>

            <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800 }}>TIER 2 (SECONDARY ESCALATION):</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFF' }}>Vikramaditya Roy (Staff DevOps Architect)</div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Triggers automatically if Tier 1 unacknowledged after 5 mins</span>
              </div>
              <span style={{ backgroundColor: '#0F172A', color: '#94A3B8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
                HOT STANDBY
              </span>
            </div>

            <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800 }}>TIER 3 (INCIDENT COMMANDER / VP):</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFF' }}>Head of Infrastructure & Operations</div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>P1 Critical Nationwide Severity Escalation</span>
              </div>
              <span style={{ backgroundColor: '#0F172A', color: '#94A3B8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
                EXECUTIVE ESCALATION
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={handleTriggerTestSiren}
              style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)' }}
            >
              📣 Test Siren Broadcast
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #475569', borderRadius: '6px', padding: '8px 18px', cursor: 'pointer', fontWeight: 700 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
