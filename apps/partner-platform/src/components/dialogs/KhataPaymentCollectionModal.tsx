import React, { useState, useMemo, useEffect } from 'react';
import { Button, Input, Badge } from '@docsearch/ui-kit';
import {
  pharmacyCreditKhataService,
  type PharmacyKhataAccount,
  type PharmacyKhataLedgerEntry
} from '../../services/pharmacy-credit-khata-service.js';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export interface KhataPaymentCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: PharmacyKhataAccount | null;
  onPaymentSuccess?: (receiptNum: string) => void;
}

export const KhataPaymentCollectionModal: React.FC<KhataPaymentCollectionModalProps> = ({
  isOpen,
  onClose,
  account,
  onPaymentSuccess
}) => {
  const profile = useMemo(() => getVerifiedRoleProfile(), []);

  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI_QR' | 'CARD' | 'BANK_TRANSFER'>('UPI_QR');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [applyWaiver, setApplyWaiver] = useState(false);
  const [waiverAmount, setWaiverAmount] = useState<string>('');
  const [pharmacistName, setPharmacistName] = useState(profile.pharmacistName || '');
  const [notes, setNotes] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState<{
    entry: PharmacyKhataLedgerEntry;
    waiver?: PharmacyKhataLedgerEntry | undefined;
  } | null>(null);

  // Initialize payment amount to full outstanding when opened
  useEffect(() => {
    if (account && isOpen) {
      setPayAmount(account.currentBalance > 0 ? String(account.currentBalance) : '');
      setCashTendered('');
      setApplyWaiver(false);
      setWaiverAmount('');
      setNotes('');
      setCompletedReceipt(null);
      setPharmacistName(profile.pharmacistName || '');
    }
  }, [account, isOpen, profile.pharmacistName]);

  if (!isOpen || !account) return null;

  const numericPay = Math.max(0, Number(payAmount) || 0);
  const numericWaiver = applyWaiver ? Math.max(0, Number(waiverAmount) || 0) : 0;
  const currentBal = account.currentBalance || 0;
  const expectedNewBal = Math.max(0, Math.round((currentBal - numericPay - numericWaiver) * 100) / 100);

  const numericCashTendered = Math.max(0, Number(cashTendered) || 0);
  const changeToReturn = paymentMode === 'CASH' && numericCashTendered > numericPay ? numericCashTendered - numericPay : 0;

  // Dynamic UPI Details
  const activeUpiId = profile.upiId || (profile.contactPhone ? `${profile.contactPhone.replace(/\D/g, '')}@upi` : 'pharmacy@upi');
  const activeMerchantName = profile.entityLegalName || 'Pharmacy Counter';

  const handleSubmitPayment = () => {
    if (numericPay <= 0 && numericWaiver <= 0) {
      alert('Please enter a valid payment or waiver amount.');
      return;
    }

    try {
      const result = pharmacyCreditKhataService.recordPaymentCredit({
        accountId: account.id,
        amount: numericPay,
        paymentMode,
        settlementWaiver: numericWaiver,
        collectedBy: pharmacistName || profile.pharmacistName || 'Dispensing Chemist',
        notes: notes.trim() || undefined
      });

      setCompletedReceipt({
        entry: result.paymentEntry,
        waiver: result.waiverEntry
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(result.paymentEntry.referenceId || '');
      }
    } catch (err: any) {
      alert(`Error saving repayment: ${err.message}`);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleShareWhatsAppReceipt = () => {
    if (!completedReceipt) return;
    const phone = account.customerPhone.replace(/\D/g, '').slice(-10);
    const storeName = profile.entityLegalName || 'DocSearch Pharmacy';

    const text = encodeURIComponent(
      `*🧾 भुगतान रसीद (Payment Receipt)*\n` +
      `*${storeName}*\n\n` +
      `नमस्ते *${account.customerName}* ji,\n` +
      `आपके मेडिकल स्टोर खाते में *₹${completedReceipt.entry.amount.toFixed(2)}* की राशि सफलतापूर्वक जमा (Credit) कर ली गई है।\n\n` +
      `📋 *विवरण:*\n` +
      `• रसीद संख्या: ${completedReceipt.entry.referenceId}\n` +
      `• दिनांक: ${new Date(completedReceipt.entry.timestamp).toLocaleDateString('en-IN')}\n` +
      `• भुगतान माध्यम: ${completedReceipt.entry.paymentMode}\n` +
      `• पिछला बकाया: ₹${completedReceipt.entry.previousBalance.toFixed(2)}\n` +
      `• जमा राशि: ₹${completedReceipt.entry.amount.toFixed(2)}\n` +
      (completedReceipt.waiver ? `• छूट / Kasar: ₹${completedReceipt.waiver.amount.toFixed(2)}\n` : '') +
      `• *नया कुल बकाया: ₹${completedReceipt.entry.newBalance.toFixed(2)}*\n\n` +
      `_समय पर भुगतान करने के लिए धन्यवाद! स्वस्थ रहें।_`
    );

    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${text}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E293B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>💵</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F8FAFC' }}>
                {completedReceipt ? 'भुगतान रसीद (Payment Receipt)' : 'उधार जमा करें (Receive Khata Payment)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Customer: <strong style={{ color: '#38BDF8' }}>{account.customerName}</strong> ({account.customerPhone})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {completedReceipt ? (
            /* ========================================================================= */
            /* RECEIPT VIEW (After Successful Payment)                                  */
            /* ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10B981',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#34D399'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Payment Successfully Recorded!</div>
                  <div style={{ fontSize: '0.78rem', color: '#A7F3D0' }}>
                    Receipt #{completedReceipt.entry.referenceId} generated and synced to Galla Cash Register.
                  </div>
                </div>
              </div>

              {/* 80mm Thermal Slip Preview */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: '1px dashed #94A3B8'
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>
                    {profile.entityLegalName || 'PHARMACY DISPENSARY'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                    {profile.officialAddress || 'Medical Market, Hospital Road'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                    DL: {profile.pharmacyDrugLicense20B || 'FORM 20B/21B'} | Phone: {profile.contactPhone || 'N/A'}
                  </div>
                  <div style={{ fontWeight: 800, marginTop: '4px', fontSize: '0.85rem' }}>
                    *** KHATA PAYMENT RECEIPT ***
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Receipt #:</span>
                  <strong>{completedReceipt.entry.referenceId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Date & Time:</span>
                  <span>{new Date(completedReceipt.entry.timestamp).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Customer:</span>
                  <strong>{account.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Phone:</span>
                  <span>{account.customerPhone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Payment Mode:</span>
                  <strong>{completedReceipt.entry.paymentMode}</strong>
                </div>

                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Previous Outstanding Due:</span>
                    <span>₹{completedReceipt.entry.previousBalance.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.9rem', color: '#047857' }}>
                    <span>Amount Received (जमा):</span>
                    <span>₹{completedReceipt.entry.amount.toFixed(2)}</span>
                  </div>
                  {completedReceipt.waiver && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                      <span>Settlement Discount / Waiver:</span>
                      <span>₹{completedReceipt.waiver.amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.95rem', marginTop: '4px', borderTop: '1px solid #E2E8F0', paddingTop: '4px' }}>
                    <span>New Net Balance Due:</span>
                    <span>₹{completedReceipt.entry.newBalance.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748B', marginTop: '6px' }}>
                  Collected By: {completedReceipt.entry.collectedByPharmacist || 'Chemist'}
                  <br />
                  Thank you for your prompt payment!
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  onClick={handlePrintSlip}
                  style={{ flex: 1, backgroundColor: '#0284C7', borderColor: '#0284C7' }}
                >
                  🖨️ Print 80mm Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareWhatsAppReceipt}
                  style={{ flex: 1, borderColor: '#10B981', color: '#34D399' }}
                >
                  📲 Share on WhatsApp
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* INPUT FORM VIEW                                                          */
            /* ========================================================================= */
            <>
              {/* Outstanding Banner */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                    कुल बकाया राशि (Total Outstanding)
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
                    ₹{currentBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Credit Limit</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#E2E8F0' }}>
                    {account.creditLimit > 0 ? `₹${account.creditLimit.toLocaleString('en-IN')}` : 'Unlimited'}
                  </div>
                  <Badge variant={account.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {account.status}
                  </Badge>
                </div>
              </div>

              {/* Quick Amount Selector Chips */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '6px' }}>
                  Quick Fill Amount:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(currentBal))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      backgroundColor: numericPay === currentBal ? 'rgba(16, 185, 129, 0.3)' : '#1E293B',
                      border: numericPay === currentBal ? '1.5px solid #10B981' : '1px solid #334155',
                      color: numericPay === currentBal ? '#34D399' : '#CBD5E1',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Full Balance (₹{currentBal.toFixed(0)})
                  </button>
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPayAmount(String(amt))}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        backgroundColor: numericPay === amt ? 'rgba(56, 189, 248, 0.3)' : '#1E293B',
                        border: numericPay === amt ? '1.5px solid #38BDF8' : '1px solid #334155',
                        color: numericPay === amt ? '#38BDF8' : '#CBD5E1',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input & Payment Mode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Payment Amount Received (₹) *
                  </label>
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter amount..."
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Payment Mode
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['UPI_QR', 'CASH', 'CARD', 'BANK_TRANSFER'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMode(m)}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: paymentMode === m ? 800 : 500,
                          backgroundColor: paymentMode === m ? '#0284C7' : '#1E293B',
                          color: paymentMode === m ? '#FFFFFF' : '#94A3B8',
                          border: paymentMode === m ? '1px solid #38BDF8' : '1px solid #334155',
                          cursor: 'pointer'
                        }}
                      >
                        {m === 'UPI_QR' ? '📱 UPI' : m === 'CASH' ? '💵 Cash' : m === 'CARD' ? '💳 Card' : '🏦 Net'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* UPI QR Display when mode is UPI */}
              {paymentMode === 'UPI_QR' && numericPay > 0 && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center',
                    color: '#000000',
                    border: '2px solid #38BDF8'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Scan to Pay ₹{numericPay.toFixed(2)} with Any UPI App
                  </div>
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      margin: '0 auto',
                      border: '1px solid #000',
                      padding: '4px',
                      backgroundColor: '#FFF'
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                        `upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(activeMerchantName)}&am=${numericPay.toFixed(2)}&cu=INR&tn=KhataRepayment-${account.customerPhone}`
                      )}`}
                      alt="UPI QR Code"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155', marginTop: '4px' }}>
                    UPI ID: <span style={{ fontFamily: 'monospace' }}>{activeUpiId}</span>
                  </div>
                </div>
              )}

              {/* Cash Tendered & Change Return */}
              {paymentMode === 'CASH' && (
                <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Cash Handed by Customer (₹):
                  </label>
                  <Input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="e.g. 500 or 2000"
                  />
                  {changeToReturn > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '0.85rem', fontWeight: 800, color: '#34D399' }}>
                      💵 Return Change: ₹{changeToReturn.toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* Settlement Waiver / Kasar Round-off */}
              <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={applyWaiver}
                    onChange={(e) => setApplyWaiver(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Apply Settlement Discount / Round-off Waiver (कसर / छूट)</span>
                </label>
                {applyWaiver && (
                  <div style={{ marginTop: '8px' }}>
                    <Input
                      type="number"
                      value={waiverAmount}
                      onChange={(e) => setWaiverAmount(e.target.value)}
                      placeholder="Enter waiver discount amount e.g. 25"
                    />
                    <div style={{ fontSize: '0.72rem', color: '#F59E0B', marginTop: '4px' }}>
                      This amount will be forgiven as a settlement round-off discount and will clear customer debt.
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Calculation Summary */}
              <div
                style={{
                  backgroundColor: expectedNewBal === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${expectedNewBal === 0 ? '#10B981' : '#F59E0B'}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Remaining Balance After Payment:</div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      color: expectedNewBal === 0 ? '#34D399' : '#FCD34D'
                    }}
                  >
                    ₹{expectedNewBal.toFixed(2)}
                  </div>
                </div>
                {expectedNewBal === 0 && (
                  <Badge variant="success">Account Fully Settled (खाता नील)</Badge>
                )}
              </div>

              {/* Optional Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '4px' }}>
                  Remarks / Receipt Note:
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid by brother, settled via GPay"
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <Button
                  variant="primary"
                  onClick={handleSubmitPayment}
                  disabled={numericPay <= 0 && numericWaiver <= 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontWeight: 800,
                    backgroundColor: '#10B981',
                    borderColor: '#059669'
                  }}
                >
                  ⚡ Record Payment (₹{numericPay.toFixed(2)})
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
