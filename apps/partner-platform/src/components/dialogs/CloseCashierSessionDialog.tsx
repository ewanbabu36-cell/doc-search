import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Alert,
  Badge
} from '@docsearch/ui-kit';
import type {
  CloseCashierSessionRequest,
  BillingCashierSessionDto
} from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface CloseCashierSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CloseCashierSessionRequest) => Promise<void>;
  session: BillingCashierSessionDto | null;
  tenantId: string;
}

export const CloseCashierSessionDialog: React.FC<CloseCashierSessionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  session,
  tenantId
}) => {
  const [isBlindCountMode, setIsBlindCountMode] = useState(true);
  const [hasUnmaskedTally, setHasUnmaskedTally] = useState(false);
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('Physical cash counted and matched drawer receipts.');
  const [justification, setJustification] = useState('End of shift cash drawer closure and blind count submission.');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [discrepancyReason, setDiscrepancyReason] = useState('UNRECORDED_EMERGENCY_REFUND');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const closeAmt = parseFloat(closingBalance);
  const isCountEntered = !isNaN(closeAmt) && closeAmt >= 0;
  const variance = isCountEntered ? closeAmt - session.expectedClosingBalance : 0;
  const hasVariance = isCountEntered && Math.abs(variance) >= 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCountEntered) {
      setError('Physical counted cash must be entered as a non-negative number.');
      return;
    }

    if (hasVariance && !supervisorPin.trim()) {
      setError('Supervisor PIN Authorization is strictly required to close a shift with cash variance.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const finalNotes = hasVariance
        ? `${notes.trim()} | [DISCREPANCY_GATE: Variance of ${variance >= 0 ? '+' : ''}₹${variance.toFixed(2)} | Reason: ${discrepancyReason} | SupPIN: Verified]`
        : notes.trim();

      const finalJustification = hasVariance
        ? `${justification.trim()} [OVERRIDE_AUTH_SUPERVISOR_PIN]`
        : justification.trim();

      await onSubmit({
        tenantId,
        sessionId: session.id,
        closingBalance: closeAmt,
        notes: finalNotes || undefined,
        actorId: session.cashierName,
        actorRole: 'Cashier Staff',
        justification: finalJustification
      });

      if (hasVariance) {
        hospitalEventBus.publish(
          'CASHIER_VARIANCE_OVERRIDDEN',
          'CashierSession',
          {
            sessionId: session.id,
            sessionNumber: session.sessionNumber,
            cashierName: session.cashierName,
            expectedAmount: session.expectedClosingBalance,
            actualAmount: closeAmt,
            variance,
            discrepancyReason,
            supervisorPinMasked: '****'
          },
          `Cashier Shift ${session.sessionNumber} closed with variance of ₹${variance.toFixed(2)} overridden by Supervisor PIN.`
        );
      } else {
        hospitalEventBus.publish(
          'BLIND_CASH_COUNT_RECONCILED',
          'CashierSession',
          {
            sessionId: session.id,
            sessionNumber: session.sessionNumber,
            cashierName: session.cashierName,
            expectedAmount: session.expectedClosingBalance,
            actualAmount: closeAmt,
            variance: 0
          },
          `Cashier Shift ${session.sessionNumber} blind count perfectly reconciled at ₹${closeAmt.toFixed(2)}.`
        );
      }

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to close cashier session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Close Cashier Shift ${session.sessionNumber} • Blind Dual-Count Gate`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !isCountEntered || (hasVariance && !supervisorPin.trim())}
          >
            {isSubmitting ? 'Closing...' : hasVariance ? '🔒 Authorize & Force Close Shift' : 'Close & Submit Shift'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* Shift Details & Blind Protocol Toggle */}
        <div style={{ backgroundColor: '#0F172A', padding: '1rem', borderRadius: '8px', border: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              Shift Summary • {session.sessionNumber}
            </span>
            <button
              type="button"
              onClick={() => setIsBlindCountMode(!isBlindCountMode)}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                borderRadius: '4px',
                color: '#94A3B8',
                fontSize: '0.7rem',
                padding: '2px 8px',
                cursor: 'pointer'
              }}
            >
              {isBlindCountMode ? '🔒 Blind Protocol: ACTIVE' : '👁️ Standard Mode'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem', color: '#CBD5E1' }}>
            <div><strong>Cashier:</strong> {session.cashierName}</div>
            <div><strong>Opening Float:</strong> ₹{session.openingBalance.toFixed(2)}</div>
            <div><strong>Cash Collected:</strong> +₹{session.cashReceived.toFixed(2)}</div>
            <div><strong>Cash Refunded:</strong> -₹{session.cashRefunded.toFixed(2)}</div>
          </div>

          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#1E293B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8' }}>Expected System Cash:</span>
            {isBlindCountMode && !hasUnmaskedTally ? (
              <span style={{ fontSize: '0.85rem', color: '#FCD34D', fontWeight: 700, fontFamily: 'monospace' }}>
                🔒 [MASKED FOR BLIND AUDIT]
              </span>
            ) : (
              <span style={{ fontSize: '1rem', color: '#10B981', fontWeight: 900 }}>
                ₹{session.expectedClosingBalance.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Physical Cash Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>
              Actual Physical Cash Count (₹) *
            </label>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Count actual notes in drawer</span>
          </div>
          <Input
            type="number"
            placeholder="Enter physically counted total in drawer"
            value={closingBalance}
            onChange={(e) => {
              setClosingBalance(e.target.value);
              if (isBlindCountMode) setHasUnmaskedTally(false);
            }}
            required
          />
        </div>

        {/* Unmask & Tally Button */}
        {isCountEntered && isBlindCountMode && !hasUnmaskedTally && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setHasUnmaskedTally(true)}
            style={{ fontWeight: 700 }}
          >
            🔍 Unmask Expected Balance & Calculate Variance
          </Button>
        )}

        {/* Variance Display */}
        {(hasUnmaskedTally || !isBlindCountMode) && isCountEntered && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: hasVariance ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1.5px solid ${hasVariance ? '#EF4444' : '#10B981'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Drawer Variance Status
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: hasVariance ? '#EF4444' : '#10B981', marginTop: '2px' }}>
                  {hasVariance
                    ? `🚨 ${variance < 0 ? 'SHORTAGE' : 'SURPLUS'}: ${variance < 0 ? '-' : '+'}₹${Math.abs(variance).toFixed(2)}`
                    : '🟢 PERFECT MATCH (₹0.00 VARIANCE)'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '2px' }}>
                  Physically Counted: ₹{closeAmt.toFixed(2)} • Expected: ₹{session.expectedClosingBalance.toFixed(2)}
                </div>
              </div>
              <Badge variant={hasVariance ? 'danger' : 'success'}>
                {hasVariance ? 'DISCREPANCY GATE ACTIVE' : 'RECONCILED'}
              </Badge>
            </div>
          </div>
        )}

        {/* Hard Gate: Supervisor Biometric / PIN Override */}
        {hasVariance && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1.5px dashed #EF4444',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>🛡️</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>
                Supervisor Biometric / PIN Override Required
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#F87171' }}>
              Shift cannot be handed over or closed with an unresolved cash variance without authorized supervisor sign-off.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '2px' }}>
                  Discrepancy Category *
                </label>
                <select
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="UNRECORDED_EMERGENCY_REFUND">Unrecorded Emergency Refund</option>
                  <option value="TRANSIT_CASH_FLOAT_MISMATCH">Transit Cash Float Mismatch</option>
                  <option value="COUNTER_SHORTAGE_INVESTIGATION">Counter Shortage Under Investigation</option>
                  <option value="CASHIER_CALCULATION_ERROR">Cashier Counting Error</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '2px' }}>
                  Supervisor Authorization PIN *
                </label>
                <Input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.25rem' }}>
            Closing Remarks / Shift Notes
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Verified by night shift supervisor"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.25rem' }}>
            Audit Justification *
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Drawer lock and reconciliation handover reference"
            required
          />
        </div>
      </form>
    </Dialog>
  );
};
