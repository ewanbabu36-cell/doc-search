import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartDunningRecurringRecoveryModal: React.FC<Props> = ({
  isOpen,
  onClose
}) => {
  const [retryDone, setRetryDone] = useState(false);

  if (!isOpen) return null;

  const handleRetryAll = () => {
    setRetryDone(true);
    setTimeout(() => {
      setRetryDone(false);
      onClose();
    }, 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 12, 22, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 10030,
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
              ⚡ Smart Dunning & Recurring UPI AutoPay Recovery Engine
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Automated cascading retries for failed hospital SaaS subscriptions with zero service interruption
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

        {retryDone && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', borderRadius: '8px', padding: '12px', color: '#A7F3D0', fontWeight: 700, marginBottom: '12px' }}>
            ✓ Smart AutoPay retry cascade triggered for 3 hospitals! UPI AutoPay mandate executed & ₹ 1,80,000 recovered!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ color: '#F8FAFC' }}>Fortis Healthcare (Noida) — Enterprise Tier Renewal</strong>
              <div style={{ color: '#EF4444', fontSize: '0.75rem' }}>Reason: Bank Server Timeout on Primary Debit Card</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 800, color: '#FCD34D' }}>₹ 1,50,000</span>
              <span style={{ display: 'block', fontSize: '0.6875rem', color: '#38BDF8' }}>Fallback: UPI AutoPay Ready</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ color: '#F8FAFC' }}>Kare Health Clinic (Gurugram) — Growth Tier Renewal</strong>
              <div style={{ color: '#EF4444', fontSize: '0.75rem' }}>Reason: Daily Transaction Limit Exceeded</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 800, color: '#FCD34D' }}>₹ 30,000</span>
              <span style={{ display: 'block', fontSize: '0.6875rem', color: '#38BDF8' }}>Fallback: WhatsApp Payment Link Dispatched</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
              Dunning Success Rate: <strong>96.4% Recovery</strong>
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #475569', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRetryAll}
                style={{ backgroundColor: '#06B6D4', color: '#070C16', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                ⚡ Execute Smart Retries
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
