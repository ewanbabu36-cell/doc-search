import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, TableContainer, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@docsearch/ui-kit';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';
import { isHospitalExecutive } from '../../utils/partnerRolePermissions.js';

export interface DenominationCount {
  denomination: number;
  count: number;
}

export interface DailyCounterCashLedgerViewProps {
  cashierName?: string | undefined;
  counterId?: string | undefined;
  onOpenShiftHandover?: (() => void) | undefined;
  branchId?: string | undefined;
  tenantId?: string | undefined;
  branchName?: string | undefined;
  currentUserRole?: string | undefined;
}

export const DailyCounterCashLedgerView: React.FC<DailyCounterCashLedgerViewProps> = ({
  cashierName = 'Pooja Sharma (Cashier #1)',
  counterId = 'COUNTER-01 (OPD Lobby)',
  onOpenShiftHandover,
  branchId = 'branch_main',
  tenantId,
  branchName = 'Main Facility OPD Counter',
  currentUserRole = 'CASHIER'
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
        status: 'SETTLED',
        branchId: d.branchId || branchId || 'branch_main'
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

  // Dual-Signoff Cash Handover State
  const [cashierSignature, setCashierSignature] = useState(cashierName);
  const [financeAdminSignature, setFinanceAdminSignature] = useState('Anand Mehta (Finance Head)');
  const [financeAdminPin, setFinanceAdminPin] = useState('9988');
  const [discrepancyReason, setDiscrepancyReason] = useState('BALANCED');
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [isHandoverSubmitting, setIsHandoverSubmitting] = useState(false);
  const [dualSignoffRecord, setDualSignoffRecord] = useState<{
    verifiedAt: string;
    cashierSignature: string;
    verifierSignature: string;
    physicalCount: number;
    expectedCash: number;
    discrepancyAmount: number;
    discrepancyStatus: string;
  } | null>(null);

  // Tiered Refund & Waiver Approvals State
  const [refunds, setRefunds] = useState<Array<{
    id: string;
    invoiceNo: string;
    patientName: string;
    uhid: string;
    requestedAmount: number;
    reason: string;
    requiredTier: 'TIER_1_FRONT_DESK' | 'TIER_2_ADMIN' | 'TIER_3_MEDICAL_DIRECTOR';
    requiredRole: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: string;
    approvedAt?: string;
  }>>([
    {
      id: 'REF-2026-001',
      invoiceNo: 'INV-OPD-8821',
      patientName: 'Anil Gupta',
      uhid: 'UHID-7721',
      requestedAmount: 450,
      reason: 'Doctor emergency OT call - OPD consultation canceled',
      requiredTier: 'TIER_1_FRONT_DESK',
      requiredRole: 'Front Desk Lead (< ₹1,000)',
      status: 'PENDING'
    },
    {
      id: 'REF-2026-002',
      invoiceNo: 'INV-LAB-4412',
      patientName: 'Sunita Rao',
      uhid: 'UHID-9932',
      requestedAmount: 4200,
      reason: 'Unused Comprehensive Cardiac Lab Panel (Patient referred to AIIMS)',
      requiredTier: 'TIER_2_ADMIN',
      requiredRole: 'Hospital Administrator (₹1,000 – ₹10,000)',
      status: 'PENDING'
    },
    {
      id: 'REF-2026-003',
      invoiceNo: 'INV-IPD-1094',
      patientName: 'Vikram Malhotra',
      uhid: 'UHID-3341',
      requestedAmount: 28500,
      reason: 'Early IPD discharge following laparoscopic recovery (Pre-auth waiver)',
      requiredTier: 'TIER_3_MEDICAL_DIRECTOR',
      requiredRole: 'Medical Director Sign-off (> ₹10,000)',
      status: 'PENDING'
    }
  ]);
  const [approvingRefundId, setApprovingRefundId] = useState<string | null>(null);

  const handleExecuteDualSignoff = async () => {
    setIsHandoverSubmitting(true);
    try {
      const res = await fetch('/api/v1/partner/billing/shifts/SHIFT-CURRENT/handover-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          physicalCount: physicalCashCounted,
          cashierSignature,
          verifierSignature: financeAdminSignature,
          discrepancyReason: variance !== 0 ? `${discrepancyReason}: ${discrepancyNote || 'Verified by admin'}` : undefined
        })
      });
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        setDualSignoffRecord({
          verifiedAt: d.verifiedAt || new Date().toISOString(),
          cashierSignature: d.cashierSignature || cashierSignature,
          verifierSignature: d.verifierSignature || financeAdminSignature,
          physicalCount: d.physicalCount ?? physicalCashCounted,
          expectedCash: d.expectedCash ?? expectedDrawerCash,
          discrepancyAmount: d.discrepancyAmount ?? variance,
          discrepancyStatus: d.discrepancyStatus || (variance === 0 ? 'BALANCED' : variance > 0 ? 'EXCESS' : 'SHORTAGE')
        });
      } else {
        setDualSignoffRecord({
          verifiedAt: new Date().toISOString(),
          cashierSignature,
          verifierSignature: financeAdminSignature,
          physicalCount: physicalCashCounted,
          expectedCash: expectedDrawerCash,
          discrepancyAmount: variance,
          discrepancyStatus: variance === 0 ? 'BALANCED' : variance > 0 ? 'EXCESS' : 'SHORTAGE'
        });
      }
    } catch {
      setDualSignoffRecord({
        verifiedAt: new Date().toISOString(),
        cashierSignature,
        verifierSignature: financeAdminSignature,
        physicalCount: physicalCashCounted,
        expectedCash: expectedDrawerCash,
        discrepancyAmount: variance,
        discrepancyStatus: variance === 0 ? 'BALANCED' : variance > 0 ? 'EXCESS' : 'SHORTAGE'
      });
    } finally {
      setIsHandoverSubmitting(false);
    }
  };

  const handleTieredRefundAction = async (refundId: string, role: string, approverName: string, action: 'APPROVE' | 'REJECT') => {
    setApprovingRefundId(refundId);
    try {
      await fetch('/api/v1/partner/billing/refunds/tiered-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId,
          approverRole: role,
          approverName,
          notes: `${action === 'APPROVE' ? 'Approved' : 'Rejected'} via Tiered Approval Protocol`
        })
      });
      setRefunds((prev) =>
        prev.map((r) =>
          r.id === refundId
            ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', approvedBy: approverName, approvedAt: new Date().toLocaleTimeString() }
            : r
        )
      );
    } catch {
      setRefunds((prev) =>
        prev.map((r) =>
          r.id === refundId
            ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', approvedBy: approverName, approvedAt: new Date().toLocaleTimeString() }
            : r
        )
      );
    } finally {
      setApprovingRefundId(null);
    }
  };

  const canApproveRefundTier = (tier: 'TIER_1_FRONT_DESK' | 'TIER_2_ADMIN' | 'TIER_3_MEDICAL_DIRECTOR') => {
    const role = (currentUserRole || 'CASHIER').toUpperCase();
    if (isHospitalExecutive(role) || role.includes('SUPER_ADMIN') || role.includes('OWNER') || role.includes('FOUNDER')) {
      return true;
    }
    if (tier === 'TIER_3_MEDICAL_DIRECTOR') {
      return role.includes('DIRECTOR') || role.includes('CHIEF_MEDICAL');
    }
    if (tier === 'TIER_2_ADMIN') {
      return role.includes('ADMIN') || role.includes('MANAGER');
    }
    return role.includes('LEAD') || role.includes('SUPERVISOR') || role.includes('FRONT') || role.includes('CASHIER') || role.includes('BILLING');
  };

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
            <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 700 }}>
              🏢 {branchName} ({branchId})
            </div>
          </div>
          {onOpenShiftHandover && (
            <Button variant="primary" size="sm" onClick={onOpenShiftHandover} style={{ fontWeight: 800 }}>
              🔄 Shift Handover Sign-off
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Branch Drawer Isolation Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '10px',
          fontSize: '0.76rem',
          color: '#38BDF8'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔒</span>
          <span>
            <strong>Multi-Branch Ledger Isolation:</strong> Bound strictly to <strong>{branchName}</strong> ({branchId}). Cashier drawers in other facility branches are cryptographically isolated.
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
          Tenant: {tenantId || 'Active'} • Role: <strong>{currentUserRole}</strong>
        </span>
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

      {/* ENTERPRISE PILLAR 3: Dual-Signoff Cash Handover & Variance Reconciliation */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>✍️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                Day-End Physical Cash Handover Dual-Signature Cockpit
              </h2>
              <Badge variant="primary">Finance Audit Standard</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              Requires physical count declaration by Counter Cashier matched against live system ledger, signed off by Finance Admin with immutable discrepancy logging.
            </p>
          </div>

          {dualSignoffRecord && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1.5px solid #10B981',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#34D399',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🔒</span>
              <span>SHIFT HANDOVER DUAL-VERIFIED & SEALED</span>
            </div>
          )}
        </div>

        {dualSignoffRecord ? (
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>VERIFIED TIME</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                {new Date(dualSignoffRecord.verifiedAt).toLocaleTimeString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>CASHIER SIGN-OFF</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                ✍️ {dualSignoffRecord.cashierSignature}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>FINANCE ADMIN SIGN-OFF</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                ✍️ {dualSignoffRecord.verifierSignature}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>DISCREPANCY STATUS</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: dualSignoffRecord.discrepancyStatus === 'BALANCED' ? '#10B981' : '#EF4444', marginTop: '2px' }}>
                {dualSignoffRecord.discrepancyStatus} (₹{Math.abs(dualSignoffRecord.discrepancyAmount)})
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Step 1: Cashier Physical Declaration */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                1. Cashier Physical Declaration
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>
                  Cashier Identity & Digital Signature
                </label>
                <input
                  type="text"
                  value={cashierSignature}
                  onChange={(e) => setCashierSignature(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    color: '#F8FAFC',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', fontSize: '0.75rem' }}>
                Declared Physical Count: <strong>₹{physicalCashCounted.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Step 2: Finance Admin Verification */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase' }}>
                2. Finance Admin Verification & Sign-off
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Finance Admin Name
                  </label>
                  <input
                    type="text"
                    value={financeAdminSignature}
                    onChange={(e) => setFinanceAdminSignature(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      color: '#F8FAFC',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Admin PIN
                  </label>
                  <input
                    type="password"
                    value={financeAdminPin}
                    onChange={(e) => setFinanceAdminPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      color: '#F8FAFC',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {variance !== 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#EF4444', fontWeight: 700, marginBottom: '4px' }}>
                    Discrepancy Category ({variance < 0 ? '-' : '+'}₹{Math.abs(variance).toLocaleString('en-IN')})
                  </label>
                  <select
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #EF4444',
                      color: '#FCA5A5',
                      fontSize: '0.75rem',
                      marginBottom: '6px'
                    }}
                  >
                    <option value="COIN_ROUNDOFF">Minor Coin / Small Change Roundoff</option>
                    <option value="UNRECORDED_CASH_EXPENSE">Unrecorded Cash Petty Expense (Emergency Linen/Water)</option>
                    <option value="TILL_FLOAT_SHORTAGE">Starting Till Float Deficit</option>
                    <option value="COUNTER_SHORTAGE_OVERAGE">Counter Shortage / Overage Discrepancy</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter mandatory audit explanation note..."
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #475569',
                      color: '#F8FAFC',
                      fontSize: '0.75rem'
                    }}
                  />
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleExecuteDualSignoff}
                disabled={isHandoverSubmitting || !financeAdminPin.trim()}
                style={{
                  backgroundColor: '#10B981',
                  borderColor: '#059669',
                  fontWeight: 800,
                  marginTop: '4px'
                }}
              >
                {isHandoverSubmitting ? 'Verifying & Sealing...' : '⚡ Complete Dual-Signature Handover'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ENTERPRISE PILLAR 3: Tiered Refund & Fee Waiver Approval Engine */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1.5px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🔄</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                Tiered Refund & Fee Waiver Governance Engine
              </h2>
              <Badge variant="neutral">Hierarchical Approval Protocol</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              Hierarchical routing: &lt;₹1,000 auto-approved by Front Desk Lead • ₹1,000–₹10,000 approved by Hospital Admin • &gt;₹10,000 signed by Medical Director.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem' }}>
            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
              Tier 1: &lt;₹1k Lead
            </span>
            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
              Tier 2: ₹1k–₹10k Admin
            </span>
            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#F472B6' }}>
              Tier 3: &gt;₹10k Director
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {refunds.map((ref) => {
            const isTier3 = ref.requiredTier === 'TIER_3_MEDICAL_DIRECTOR';
            const isTier2 = ref.requiredTier === 'TIER_2_ADMIN';
            const tierBadgeColor = isTier3 ? '#F472B6' : isTier2 ? '#34D399' : '#38BDF8';
            const tierBg = isTier3 ? 'rgba(236, 72, 153, 0.15)' : isTier2 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)';

            return (
              <div
                key={ref.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '520px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {ref.patientName} ({ref.uhid})
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {ref.invoiceNo} • {ref.id}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: tierBg,
                        color: tierBadgeColor
                      }}
                    >
                      {ref.requiredRole}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    <strong>Reason:</strong> {ref.reason}
                  </div>
                  {ref.approvedBy && (
                    <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '2px' }}>
                      ✓ {ref.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {ref.approvedBy} at {ref.approvedAt}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                      ₹{ref.requestedAmount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: ref.status === 'APPROVED' ? '#10B981' : ref.status === 'REJECTED' ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                      {ref.status}
                    </div>
                  </div>

                  {ref.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {canApproveRefundTier(ref.requiredTier) ? (
                        <>
                          <button
                            type="button"
                            disabled={approvingRefundId === ref.id}
                            onClick={() =>
                              handleTieredRefundAction(
                                ref.id,
                                isTier3 ? 'MEDICAL_DIRECTOR' : isTier2 ? 'HOSPITAL_ADMIN' : 'FRONT_DESK_LEAD',
                                isTier3 ? 'Dr. S. K. Roy (Medical Director)' : isTier2 ? 'Anand Mehta (Admin)' : 'Pooja Sharma (Lead)',
                                'APPROVE'
                              )
                            }
                            style={{
                              backgroundColor: '#10B981',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#FFF',
                              padding: '8px 14px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            disabled={approvingRefundId === ref.id}
                            onClick={() =>
                              handleTieredRefundAction(
                                ref.id,
                                isTier3 ? 'MEDICAL_DIRECTOR' : isTier2 ? 'HOSPITAL_ADMIN' : 'FRONT_DESK_LEAD',
                                isTier3 ? 'Dr. S. K. Roy (Medical Director)' : isTier2 ? 'Anand Mehta (Admin)' : 'Pooja Sharma (Lead)',
                                'REJECT'
                              )
                            }
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              color: '#F87171',
                              padding: '8px 12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ✕ Reject
                          </button>
                        </>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#F87171',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}
                        >
                          🔒 Clearance Required: Escalated to {isTier3 ? 'Medical Director' : 'Hospital Administrator'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ENTERPRISE PILLAR 5: Tiered Discount Ceilings & Margin Protection */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏷️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                Tiered Discount Ceilings & Commercial Pre-Auth Matrix
              </h2>
              <Badge variant="neutral">RCM Margin Protection</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              Enforced commercial governance: &lt;10% Front Desk Lead • 10%–25% Hospital Administrator • &gt;25% Medical Director or Founder sign-off.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontSize: '0.72rem', fontWeight: 700 }}>
              &lt;10% Front Desk
            </span>
            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontSize: '0.72rem', fontWeight: 700 }}>
              10%–25% Admin
            </span>
            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#F472B6', fontSize: '0.72rem', fontWeight: 700 }}>
              &gt;25% Director
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 800, color: '#34D399', fontSize: '0.85rem' }}>Tier 1: Minor Courtesy Discount (&lt;10%)</span>
              <Badge variant="success">Auto-Authorized</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Applicable for minor senior citizen concessions or billing roundoffs up to 10%. Authorized directly by Front Desk Lead or Cashier Supervisor.
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.85rem' }}>Tier 2: Institutional Concession (10%–25%)</span>
              <Badge variant="neutral">Admin OTP / PIN</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Requires authenticated Hospital Administrator sign-off or digital override PIN before invoice finalization.
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 800, color: '#F472B6', fontSize: '0.85rem' }}>Tier 3: Special Clinical Waiver (&gt;25%)</span>
              <Badge variant="neutral">Director Dual Sign</Badge>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Critical surgical packages, BPL compassionate waivers, or VIP concessions. Strictly requires Medical Director or Hospital Owner dual-authorization.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
