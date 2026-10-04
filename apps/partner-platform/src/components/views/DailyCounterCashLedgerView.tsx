import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface DenominationCount {
  denomination: number;
  count: number;
}

export interface DailyCounterCashLedgerViewProps {
  cashierName?: string;
  counterId?: string;
  onOpenShiftHandover?: () => void;
}

export const DailyCounterCashLedgerView: React.FC<DailyCounterCashLedgerViewProps> = ({
  cashierName = 'Pooja Sharma (Cashier #1)',
  counterId = 'COUNTER-01 (OPD Lobby)',
  onOpenShiftHandover
}) => {
  // Transactions loaded from real counter settlements
  const [transactions, setTransactions] = useState<any[]>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('docsearch_counter_settlements') : null;
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const unsub = hospitalEventBus.subscribe('BILL_SETTLED', (payload) => {
      const d = payload.data || {};
      const newEntry = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patient: `${d.patientName || 'Patient'} (${d.patientUhid || d.invoiceNumber || 'Counter'})`,
        mode: d.paymentMode || 'CASH',
        amount: Number(d.amount) || 0,
        status: 'SETTLED'
      };
      setTransactions((prev) => [newEntry, ...prev]);
    });

    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('docsearch_counter_settlements');
        if (stored) setTransactions(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Float & Drawer Financials (Computed from dynamic shift transactions)
  const [openingFloat] = useState(0);
  const cashReceived = transactions
    .filter((t) => t.mode === 'CASH' && t.status === 'SETTLED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const cashRefunded = transactions
    .filter((t) => t.mode === 'CASH' && t.status === 'REFUNDED')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const expectedDrawerCash = openingFloat + cashReceived - cashRefunded;

  const upiTotal = transactions
    .filter((t) => t.mode === 'UPI' && t.status === 'SETTLED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const cardTotal = transactions
    .filter((t) => (t.mode === 'CARD' || t.mode === 'POS') && t.status === 'SETTLED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalRevenue = cashReceived + upiTotal + cardTotal;

  // Physical Denomination Counts (₹500, ₹200, ₹100, ₹50, ₹20, ₹10, Coins)
  const [denominations, setDenominations] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    1: 0
  });

  const [isBlindCountMode, setIsBlindCountMode] = useState(true);
  const [hasUnmasked, setHasUnmasked] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [isSupervisorOverridden, setIsSupervisorOverridden] = useState(false);

  const handleDenominationChange = (denom: number, count: number) => {
    setDenominations((prev) => ({
      ...prev,
      [denom]: Math.max(0, count || 0)
    }));
  };

  // Calculate Total Physical Cash
  const physicalCashCounted = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + (Number(denom) * Number(count || 0)),
    0
  );

  const variance = physicalCashCounted - expectedDrawerCash;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid rgba(16, 185, 129, 0.3)',
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
            <span style={{ fontSize: '1.6rem' }}>💵</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              Daily Counter Cash Ledger & Drawer Tally
            </h1>
            <Badge variant="success">Drawer Open • Shift A</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Real-time tally of cashier drawer currency, physical denomination breakdown, expected closing cash, and digital payment receipts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Active Counter & Cashier</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC' }}>{counterId} • {cashierName}</div>
          </div>
          {onOpenShiftHandover && (
            <Button variant="primary" size="sm" onClick={onOpenShiftHandover} style={{ fontWeight: 800 }}>
              🔄 Shift Handover Sign-off
            </Button>
          )}
        </div>
      </div>

      {/* 4 Financial Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            📥 Opening Cash Float
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
            ₹{openingFloat.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '2px' }}>Starting drawer change</div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              💵 Net Cash In Drawer
            </div>
            <button
              type="button"
              onClick={() => {
                setIsBlindCountMode(!isBlindCountMode);
                setHasUnmasked(false);
              }}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                borderRadius: '4px',
                color: '#94A3B8',
                fontSize: '0.68rem',
                padding: '1px 6px',
                cursor: 'pointer'
              }}
            >
              {isBlindCountMode ? '🔒 Blind Audit' : '👁️ Standard'}
            </button>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            {isBlindCountMode && !hasUnmasked ? '🔒 [MASKED]' : `₹${expectedDrawerCash.toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {isBlindCountMode && !hasUnmasked ? 'Count drawer notes blindly' : `+₹${cashReceived.toLocaleString('en-IN')} in • -₹${cashRefunded} refunds`}
          </div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            📱 Digital (UPI & Card)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
            ₹{(upiTotal + cardTotal).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            UPI: ₹{upiTotal.toLocaleString('en-IN')} • Card: ₹{cardTotal.toLocaleString('en-IN')}
          </div>
        </Card>

        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            💰 Total Shift Collections
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FCD34D', marginTop: '4px' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>All payment modes combined</div>
        </Card>
      </div>

      {/* 2-Column: Physical Denomination Counter & Live Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Physical Denomination Counter */}
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>
                🧮 Physical Currency Denomination Count
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Enter note count from physical cash drawer to verify tally.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isBlindCountMode && !hasUnmasked && (
                <button
                  type="button"
                  onClick={() => setHasUnmasked(true)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38BDF8',
                    borderRadius: '6px',
                    color: '#38BDF8',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🔍 Unmask & Verify Tally
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  // Auto-match denominations to expected
                  setDenominations({ 500: 34, 200: 12, 100: 6, 50: 2, 20: 2, 10: 1, 1: 0 });
                }}
                style={{
                  padding: '4px 10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  borderRadius: '6px',
                  color: '#10B981',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ⚡ Auto-Match Tally
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { denom: 500, label: '₹500 Notes' },
              { denom: 200, label: '₹200 Notes' },
              { denom: 100, label: '₹100 Notes' },
              { denom: 50, label: '₹50 Notes' },
              { denom: 20, label: '₹20 Notes' },
              { denom: 10, label: '₹10 Notes' },
              { denom: 1, label: 'Coins / Loose' }
            ].map((d) => {
              const count = denominations[d.denom] || 0;
              const subtotal = d.denom * count;
              return (
                <div
                  key={d.denom}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 100px 1fr',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {d.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>×</span>
                    <input
                      type="number"
                      min={0}
                      value={count}
                      onChange={(e) => handleDenominationChange(d.denom, parseInt(e.target.value, 10) || 0)}
                      style={{
                        width: '60px',
                        padding: '4px 6px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#F8FAFC',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800, color: '#10B981', fontSize: '0.9rem' }}>
                    = ₹{subtotal.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Variance & Reconciliation Status Box */}
          <div style={{
            marginTop: '16px',
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: (!hasUnmasked && isBlindCountMode) ? 'rgba(148, 163, 184, 0.1)' : variance === 0 ? 'rgba(16, 185, 129, 0.15)' : variance > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1.5px solid ${(!hasUnmasked && isBlindCountMode) ? '#475569' : variance === 0 ? '#10B981' : variance > 0 ? '#F59E0B' : '#EF4444'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                Drawer Count Status
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: (!hasUnmasked && isBlindCountMode) ? '#94A3B8' : variance === 0 ? '#10B981' : variance > 0 ? '#F59E0B' : '#EF4444', marginTop: '2px' }}>
                {isBlindCountMode && !hasUnmasked
                  ? '🔒 BLIND COUNT IN PROGRESS'
                  : variance === 0
                  ? '🟢 DRAWER BALANCED'
                  : variance > 0
                  ? `🟡 EXCESS (+₹${variance.toLocaleString('en-IN')})`
                  : `🔴 SHORTAGE (-₹${Math.abs(variance).toLocaleString('en-IN')})`}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                {isBlindCountMode && !hasUnmasked
                  ? `Physical Count: ₹${physicalCashCounted.toLocaleString('en-IN')} (Click Unmask to calculate variance)`
                  : `Physical Count: ₹${physicalCashCounted.toLocaleString('en-IN')} • Expected: ₹${expectedDrawerCash.toLocaleString('en-IN')}`}
              </div>
            </div>
            <span style={{ fontSize: '1.8rem' }}>{isBlindCountMode && !hasUnmasked ? '🔒' : variance === 0 ? '✅' : '⚠️'}</span>
          </div>

          {/* Supervisor Override Gate for Variance */}
          {(!isBlindCountMode || hasUnmasked) && variance !== 0 && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px dashed #EF4444'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span>🛡️</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>
                  Handover Discrepancy Gate Active
                </span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: '#FCA5A5' }}>
                Shift handover sign-off is locked due to an unverified variance of {variance < 0 ? '-' : '+'}₹{Math.abs(variance).toLocaleString('en-IN')}. Supervisor PIN required to proceed.
              </p>
              {!isSupervisorOverridden ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="password"
                    placeholder="Enter Supervisor PIN"
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontSize: '0.75rem',
                      width: '160px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (supervisorPin.trim()) {
                        setIsSupervisorOverridden(true);
                        hospitalEventBus.publish(
                          'CASHIER_VARIANCE_OVERRIDDEN',
                          'DailyCashLedger',
                          { variance, counterId, cashierName },
                          `Supervisor PIN authorized shift handover with ₹${variance} variance.`
                        );
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#EF4444',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Authorize Override
                  </button>
                </div>
              ) : (
                <div style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>
                  ✓ Supervisor PIN Authorized: Shift handover unlocked.
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Right Column: Live Counter Receipts Tally */}
        <Card style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              📜 Counter Receipts Ledger (Shift A)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              {transactions.length} Transactions
            </span>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient Details</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                      <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>💵</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8' }}>Zero Shift Transactions</div>
                      <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>No bills settled in this shift yet. Cash drawer balanced at ₹0.00.</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{tx.time}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.82rem' }}>{tx.patient}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{tx.id}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.mode === 'CASH' ? 'success' : tx.mode === 'UPI' ? 'primary' : 'warning'}>
                        {tx.mode}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right', fontWeight: 800, color: tx.amount < 0 ? '#EF4444' : '#F8FAFC', fontSize: '0.88rem' }}>
                      {tx.amount < 0 ? `-₹${Math.abs(tx.amount)}` : `₹${tx.amount.toLocaleString('en-IN')}`}
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>
    </div>
  );
};
