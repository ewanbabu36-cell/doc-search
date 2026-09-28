import React, { useState } from 'react';
import { Card, Badge, Button, Input } from '@docsearch/ui-kit';

export interface ShiftHandoverSignOffViewProps {
  onHandoverComplete?: () => void;
  onBackToLedger?: () => void;
}

export const ShiftHandoverSignOffView: React.FC<ShiftHandoverSignOffViewProps> = ({
  onHandoverComplete,
  onBackToLedger
}) => {
  const [outgoingCashier] = useState('Pooja Sharma (Staff ID #CSH-084)');
  const [incomingCashier, setIncomingCashier] = useState('Anil Kapoor (Staff ID #CSH-091)');
  const [supervisorName] = useState('Rajesh Malhotra (Chief Accounts Officer)');
  const [counterId] = useState('COUNTER-01 (OPD Lobby)');
  const [shiftHours] = useState('08:00 AM – 04:00 PM (Shift A)');

  // Financial Figures
  const [openingFloat] = useState(2000);
  const [cashCollected] = useState(18450);
  const [cashRefunded] = useState(300);
  const expectedCash = openingFloat + cashCollected - cashRefunded; // 20,150
  const [physicalCash] = useState(20150);
  const variance = physicalCash - expectedCash; // 0

  const [digitalCollections] = useState(55800);
  const [totalBillsSettled] = useState(48);

  // Dual Sign-off State
  const [supervisorPin, setSupervisorPin] = useState('');
  const [isSignedOff, setIsSignedOff] = useState(false);
  const [handoverTimestamp, setHandoverTimestamp] = useState('');
  const [handoverHash, setHandoverHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleExecuteSignOff = () => {
    if (!supervisorPin.trim()) {
      setError('Please enter Supervisor Authorization PIN to complete shift handover.');
      return;
    }
    setError(null);
    const now = new Date().toISOString();
    setHandoverTimestamp(now);
    setHandoverHash(`SHA256:7f8a9b2c${Date.now().toString(16)}e4d1f08a`);
    setIsSignedOff(true);

    if (onHandoverComplete) {
      onHandoverComplete();
    }
  };

  const handlePrintHandoverCertificate = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.6rem' }}>🔄</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Shift Handover & Cash Drawer Sign-Off
            </h1>
            <Badge variant="warning">Mandatory Counter Closure</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Mandatory dual sign-off protocol before closing the cash counter. Tally physical currency, verify drawer variance, and certify handover to incoming cashier.
          </p>
        </div>

        {onBackToLedger && (
          <Button variant="outline" size="sm" onClick={onBackToLedger} style={{ fontWeight: 700 }}>
            ← Back to Cash Ledger
          </Button>
        )}
      </div>

      {/* 2-Column Handover Certificate & Sign-off Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Left: Financial Reconciliation Certificate */}
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#A855F7', textTransform: 'uppercase' }}>
              📜 End-of-Shift Reconciliation Summary
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{counterId}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Outgoing Cashier:</span>
              <div style={{ fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>{outgoingCashier}</div>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>Incoming Cashier:</span>
              <div style={{ fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>{incomingCashier}</div>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>Shift Timing:</span>
              <div style={{ fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>{shiftHours}</div>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>Bills Settled:</span>
              <div style={{ fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>{totalBillsSettled} Invoices</div>
            </div>
          </div>

          {/* Detailed Financial Lines */}
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
              <span>Opening Float (Cash):</span>
              <span style={{ color: '#F8FAFC', fontWeight: 600 }}>₹{openingFloat.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
              <span>Cash Collections:</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>+₹{cashCollected.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
              <span>Cash Refunds / Payouts:</span>
              <span style={{ color: '#EF4444', fontWeight: 700 }}>-₹{cashRefunded.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', borderTop: '1px solid #334155', paddingTop: '6px' }}>
              <span>Digital Collections (UPI + Card):</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>₹{digitalCollections.toLocaleString('en-IN')}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#F8FAFC',
              fontWeight: 900,
              fontSize: '1rem',
              borderTop: '1px dashed #334155',
              paddingTop: '8px'
            }}>
              <span>Expected Cash in Drawer:</span>
              <span style={{ color: '#10B981' }}>₹{expectedCash.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F8FAFC', fontWeight: 900, fontSize: '1rem' }}>
              <span>Physical Cash Handed Over:</span>
              <span style={{ color: '#F8FAFC' }}>₹{physicalCash.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Variance Box */}
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: variance === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1.5px solid ${variance === 0 ? '#10B981' : '#EF4444'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                Handover Variance
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: variance === 0 ? '#10B981' : '#EF4444' }}>
                {variance === 0 ? '🟢 ₹0.00 (PERFECT TALLY)' : `🔴 ₹${variance.toLocaleString('en-IN')} VARIANCE`}
              </div>
            </div>
            <span style={{ fontSize: '1.5rem' }}>{variance === 0 ? '✓' : '⚠️'}</span>
          </div>
        </Card>

        {/* Right: Dual Digital Sign-Off Panel */}
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
            ✍️ Dual Signatory Digital Sign-Off
          </span>

          {/* Outgoing Cashier Declaration */}
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              1. Outgoing Cashier Confirmation
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
              "I, {outgoingCashier}, certify that all bills for Shift A have been settled, drawer cash has been physically counted to exactly ₹{physicalCash.toLocaleString('en-IN')}, and custody is being transferred."
            </p>
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
              ✓ Signed Digitally by Outgoing Cashier
            </div>
          </div>

          {/* Incoming Cashier Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
              2. Incoming Shift Cashier
            </label>
            <Input
              value={incomingCashier}
              onChange={(e) => setIncomingCashier(e.target.value)}
              placeholder="Incoming Cashier Name & Staff ID"
            />
          </div>

          {/* Supervisor PIN Verification */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
              3. Chief Accounts / Supervisor Authorization PIN *
            </label>
            <Input
              type="password"
              placeholder="Enter 4 or 6-digit Supervisor PIN"
              value={supervisorPin}
              onChange={(e) => setSupervisorPin(e.target.value)}
            />
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
              Authorizer: <strong>{supervisorName}</strong>
            </div>
          </div>

          {error && (
            <div style={{ color: '#EF4444', fontSize: '0.78rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Sign-off Action or Certified Stamp */}
          {!isSignedOff ? (
            <button
              type="button"
              onClick={handleExecuteSignOff}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#7C3AED',
                border: 'none',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: 'auto',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)'
              }}
            >
              <span>🔒 Authorize & Lock Counter Shift</span>
            </button>
          ) : (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10B981',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              marginTop: 'auto'
            }}>
              <div style={{ color: '#10B981', fontWeight: 900, fontSize: '1rem', marginBottom: '4px' }}>
                ✓ SHIFT HANDOVER CERTIFIED & COUNTER CLOSED
              </div>
              <div style={{ fontSize: '0.75rem', color: '#F8FAFC' }}>
                Certified: {new Date(handoverTimestamp).toLocaleTimeString()} • {new Date(handoverTimestamp).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px', fontFamily: 'monospace' }}>
                {handoverHash}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                <Button variant="primary" size="sm" onClick={handlePrintHandoverCertificate} style={{ fontWeight: 800 }}>
                  🖨️ Print Shift Handover Slip
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
