import React, { useState } from 'react';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface OpdChamberPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientMrn: string;
  consultationFee?: number;
  onPaymentSettled?: (receiptNo: string, amount: number, mode: string) => void;
}

export const OpdChamberPaymentModal: React.FC<OpdChamberPaymentModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientMrn,
  consultationFee = 500,
  onPaymentSettled
}) => {
  const [feeAmount, setFeeAmount] = useState<number>(consultationFee);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI_QR' | 'WAIVED'>('UPI_QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [settledReceipt, setSettledReceipt] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCollectPayment = () => {
    setIsProcessing(true);
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;

    hospitalEventBus.publish(
      'CHAMBER_PAYMENT_COLLECTED',
      'OpdChamberPaymentModal',
      {
        receiptNo,
        patientName,
        patientMrn,
        amount: paymentMode === 'WAIVED' ? 0 : feeAmount,
        paymentMode,
        timestamp: new Date().toISOString()
      },
      `In-Chamber Payment collected: ₹${paymentMode === 'WAIVED' ? 0 : feeAmount} via ${paymentMode} for ${patientName}`
    );

    setTimeout(() => {
      setIsProcessing(false);
      setSettledReceipt(receiptNo);
      if (onPaymentSettled) {
        onPaymentSettled(receiptNo, paymentMode === 'WAIVED' ? 0 : feeAmount, paymentMode);
      }
      setTimeout(() => {
        onClose();
      }, 1400);
    }, 500);
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
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(16, 185, 129, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>💰</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#34D399' }}>
                Solo Doctor Chamber Fee Settlement
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1' }}>
                {patientName} ({patientMrn}) • Desk Payment & Instant Receipt Stamp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {settledReceipt && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22C55E', color: '#86EFAC', padding: '10px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
              ✓ Consultation fee settled! Receipt stamped as #{settledReceipt}.
            </div>
          )}

          {/* Amount Box */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#070C16', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>Consultation Fee:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34D399' }}>₹</span>
              <input
                type="number"
                value={feeAmount}
                disabled={paymentMode === 'WAIVED'}
                onChange={(e) => setFeeAmount(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: '90px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#34D399',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  textAlign: 'right'
                }}
              />
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
              Collection Mode:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPaymentMode('UPI_QR')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: paymentMode === 'UPI_QR' ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: paymentMode === 'UPI_QR' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.02)',
                  color: paymentMode === 'UPI_QR' ? '#38BDF8' : '#94A3B8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📲 Dynamic UPI QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: paymentMode === 'CASH' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: paymentMode === 'CASH' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.02)',
                  color: paymentMode === 'CASH' ? '#34D399' : '#94A3B8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                💵 Cash Received
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('WAIVED')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: paymentMode === 'WAIVED' ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: paymentMode === 'WAIVED' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.02)',
                  color: paymentMode === 'WAIVED' ? '#FBBF24' : '#94A3B8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🤝 Courtesy Waived (₹0)
              </button>
            </div>
          </div>

          {/* QR Code Presentation if UPI selected */}
          {paymentMode === 'UPI_QR' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '14px', textAlign: 'center', color: '#0F172A' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369A1', marginBottom: '6px' }}>
                BHARAT UPI QR CODE • ₹{feeAmount}
              </div>
              <div style={{ width: '120px', height: '120px', margin: '0 auto', backgroundColor: '#F1F5F9', border: '2px solid #CBD5E1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                🏁
              </div>
              <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '6px' }}>
                Scan with GPay, PhonePe, Paytm or any BHIM UPI App
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#070C16'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#CBD5E1',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing || Boolean(settledReceipt)}
            onClick={handleCollectPayment}
            style={{
              padding: '8px 22px',
              borderRadius: '8px',
              backgroundColor: '#10B981',
              border: 'none',
              color: '#070C16',
              fontSize: '0.82rem',
              fontWeight: 900,
              cursor: isProcessing || Boolean(settledReceipt) ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? 'Recording Settlement...' : settledReceipt ? '✓ Stamped' : `Stamp Receipt & Collect (₹${paymentMode === 'WAIVED' ? 0 : feeAmount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
