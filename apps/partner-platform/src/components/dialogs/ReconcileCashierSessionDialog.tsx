import React, { useState, useMemo } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert,
  Badge
} from '@docsearch/ui-kit';
import type {
  ReconcileCashierSessionRequest,
  BillingCashierSessionDto
} from '@docsearch/api-contracts';

export interface ReconcileCashierSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ReconcileCashierSessionRequest) => Promise<void>;
  session: BillingCashierSessionDto | null;
  tenantId: string;
}

export const ReconcileCashierSessionDialog: React.FC<ReconcileCashierSessionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  session,
  tenantId
}) => {
  // Physical Denomination Counters (Epic Systems & NABH Blind Drop Standard)
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '2000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    'coins': 0
  });

  const physicalCountedTotal = useMemo(() => {
    let sum = 0;
    sum += (denominations['2000'] || 0) * 2000;
    sum += (denominations['500'] || 0) * 500;
    sum += (denominations['200'] || 0) * 200;
    sum += (denominations['100'] || 0) * 100;
    sum += (denominations['50'] || 0) * 50;
    sum += (denominations['20'] || 0) * 20;
    sum += (denominations['10'] || 0) * 10;
    sum += (denominations['coins'] || 0);
    return sum;
  }, [denominations]);

  const [useDenominationCounter, setUseDenominationCounter] = useState(true);
  const [manualAmount, setManualAmount] = useState(session?.closingBalance ? session.closingBalance.toString() : '0.00');
  const [remarks, setRemarks] = useState('Epic Systems-Standard Blind Drop: Physical currency counted without drawer balance visibility.');
  const [justification, setJustification] = useState('End-of-shift statutory treasury reconciliation.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blind Drop Verification & Discrepancy State
  const [blindDropRevealed, setBlindDropRevealed] = useState(false);
  const [discrepancyStatus, setDiscrepancyStatus] = useState<string | null>(null);
  const [calculatedVariance, setCalculatedVariance] = useState<number | null>(null);
  const [supervisorOtp, setSupervisorOtp] = useState('');
  const [cctvCameraId, setCctvCameraId] = useState('CAM-BILLING-COUNTER-02');
  const [supervisorName, setSupervisorName] = useState('Finance Supervisor Alice Wong');

  if (!session) return null;

  const actualAmount = useDenominationCounter ? physicalCountedTotal : (parseFloat(manualAmount) || 0);

  const handleDenominationChange = (denom: string, val: string) => {
    const parsed = parseInt(val, 10);
    setDenominations((prev) => ({
      ...prev,
      [denom]: isNaN(parsed) || parsed < 0 ? 0 : parsed
    }));
  };

  const handleVerifyBlindDrop = async () => {
    if (actualAmount <= 0) {
      setError('Please count at least one currency denomination or enter cash total.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/partner/billing/cashier-sessions/blind-drop-reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          cashierId: session.cashierId || 'cashier-001',
          cashierName: session.cashierName,
          physicalCountAmount: actualAmount,
          currencyBreakdown: denominations,
          supervisorOtp: supervisorOtp.trim() || undefined,
          cctvCameraId: cctvCameraId.trim() || undefined
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error?.message || 'Failed to verify blind drop with treasury vault.');
      }

      setBlindDropRevealed(true);
      setCalculatedVariance(resData.data.variance);
      setDiscrepancyStatus(resData.data.reconciliationStatus);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Blind drop verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualAmount < 0) {
      setError('Actual amount must be a non-negative number.');
      return;
    }

    if (discrepancyStatus === 'DISCREPANCY_FLAGGED' && !supervisorOtp.trim()) {
      setError('Supervisor OTP and CCTV reference required to finalize flagged discrepancy.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenantId,
        sessionId: session.id,
        actualAmount,
        remarks: `${remarks} | CCTV: ${cctvCameraId} | Variance: ₹${calculatedVariance ?? 0}`,
        actorId: supervisorName,
        actorRole: 'Finance Auditor',
        justification: justification.trim()
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasHighVariance = calculatedVariance !== null && Math.abs(calculatedVariance) > 100;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Blind-Drop Shift Reconcile — ${session.sessionNumber}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            🔒 Blind Drop Security: Expected drawer balance masked during count
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {!blindDropRevealed ? (
              <Button
                variant="primary"
                onClick={handleVerifyBlindDrop}
                disabled={isSubmitting || actualAmount <= 0}
              >
                {isSubmitting ? 'Verifying with Vault...' : `Submit Blind Count (₹${actualAmount.toLocaleString('en-IN')})`}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || (hasHighVariance && !supervisorOtp)}
              >
                {isSubmitting ? 'Locking Drawer...' : 'Lock Drawer & Seal Shift'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* Blind Drop Banner */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Cashier:</strong> {session.cashierName}</div>
            <div>
              <strong>Expected Drawer:</strong>{' '}
              {blindDropRevealed ? (
                <span style={{ fontWeight: 700, color: '#1e293b' }}>
                  ₹{session.expectedClosingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              ) : (
                <Badge variant="neutral">🔒 Blind Masked (Count First)</Badge>
              )}
            </div>
            <div>
              <strong>Physical Counted Cash:</strong>{' '}
              <span style={{ fontWeight: 700, color: '#2563eb' }}>
                ₹{actualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <strong>Audit Status:</strong>{' '}
              {blindDropRevealed ? (
                <Badge variant={hasHighVariance ? 'danger' : 'success'}>
                  {hasHighVariance ? `Variance: ₹${calculatedVariance?.toFixed(2)} (FLAGGED)` : 'PERFECTLY BALANCED'}
                </Badge>
              ) : (
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Awaiting Cashier Submission</span>
              )}
            </div>
          </div>
        </div>

        {/* Physical Currency Denomination Breakdown */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
              Physical Denomination Counter (RBI INR Standard)
            </span>
            <button
              type="button"
              onClick={() => setUseDenominationCounter(!useDenominationCounter)}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {useDenominationCounter ? 'Switch to Quick Total' : 'Switch to Denominations'}
            </button>
          </div>

          {useDenominationCounter ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {['500', '200', '100', '50', '20', '10', '2000', 'coins'].map((denom) => (
                <div key={denom} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    {denom === 'coins' ? 'Coins (₹ Total)' : `₹${denom} Notes`}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={denominations[denom] || ''}
                    onChange={(e) => handleDenominationChange(denom, e.target.value)}
                    placeholder="0"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'right' }}>
                    = ₹{((denominations[denom] || 0) * (denom === 'coins' ? 1 : parseInt(denom, 10))).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Total Verified Physical Cash (₹) *
              </label>
              <Input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {/* High Variance Discrepancy Lock Section */}
        {hasHighVariance && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🚨</span>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#991b1b' }}>
                DISCREPANCY LOCK TRIGGERED: VARIANCE &gt; ₹100 DETECTED
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#b91c1c', margin: '0 0 0.5rem 0' }}>
              Hospital Treasury Protocol requires supervisor sign-off and CCTV audit camera footage timestamp before shift closure.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#7f1d1d' }}>
                  Supervisor Authorization OTP *
                </label>
                <input
                  type="password"
                  value={supervisorOtp}
                  onChange={(e) => setSupervisorOtp(e.target.value)}
                  placeholder="Enter 4-digit OTP"
                  style={{ width: '100%', padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #f87171' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#7f1d1d' }}>
                  CCTV Camera Channel Reference *
                </label>
                <input
                  type="text"
                  value={cctvCameraId}
                  onChange={(e) => setCctvCameraId(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #f87171' }}
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Supervisor / Auditor Name
          </label>
          <Input
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            placeholder="Audit verification officer"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Treasury Justification
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Treasury reconciliation justification"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Shift Close Remarks / Audit Footprint
          </label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Audit verification details"
          />
        </div>
      </form>
    </Dialog>
  );
};
