import React, { useState, useEffect } from 'react';
import { Dialog, Button, Badge, Alert } from '@docsearch/ui-kit';

export interface UnbilledItem {
  id: string;
  source: 'MAR' | 'OT_SURGERY' | 'NURSING_PROCEDURE';
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  timestamp: string;
}

export interface DischargeAuditResult {
  clearanceStatus: 'DISCHARGE_FROZEN_UNBILLED_CONSUMABLES' | 'DISCHARGE_PERMITTED_ZERO_LEAKAGE';
  unbilledItemsDetected: number;
  unbilledTotalAmount: number;
  leakagePrevented: number;
  items: UnbilledItem[];
  patientAdmissionId: string;
  patientName: string;
  invoiceId: string;
  overrideApplied?: boolean;
  overrideDetails?: {
    approvedBy: string;
    reason: string;
    overrideTimestamp: string;
  };
}

export interface DischargeClearanceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string;
  patientName: string;
  invoiceId?: string;
  onClearanceGranted?: (result: DischargeAuditResult) => void;
}

export const DischargeClearanceAuditModal: React.FC<DischargeClearanceAuditModalProps> = ({
  isOpen,
  onClose,
  admissionId,
  patientName,
  invoiceId = 'INV-IPD-2026-001',
  onClearanceGranted
}) => {
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<DischargeAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Override form state
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideDirectorName, setOverrideDirectorName] = useState('Dr. Suresh Rao (Medical Director)');
  const [overrideReason, setOverrideReason] = useState('Indigent patient waiver approved by hospital ethics and charity committee.');
  const [overridePin, setOverridePin] = useState('9942');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const fetchAudit = async (autoPost: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/partner/billing/ipd/discharge-clearance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientAdmissionId: admissionId,
          patientName,
          invoiceId,
          autoPostUnbilled: autoPost
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to complete clinical-financial discharge audit.');
      }
      setAuditResult(data.data);
      if (autoPost) {
        setSuccessMessage(`✅ Successfully auto-posted ${data.data.unbilledItemsDetected} unbilled item(s) (₹${data.data.leakagePrevented.toLocaleString('en-IN')}) directly to Invoice ${invoiceId}. Clinical-to-financial parity achieved!`);
        if (onClearanceGranted) onClearanceGranted(data.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error during audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && admissionId) {
      fetchAudit(false);
      setSuccessMessage(null);
      setShowOverrideForm(false);
    }
  }, [isOpen, admissionId]);

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overridePin || !overrideReason.trim()) {
      setError('Please provide both the authorization PIN and clinical justification.');
      return;
    }
    setIsSubmittingOverride(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/partner/billing/ipd/discharge-clearance-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientAdmissionId: admissionId,
          medicalDirectorName: overrideDirectorName,
          reason: overrideReason,
          authorizationPin: overridePin,
          patientName
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Override sign-off rejected.');
      }
      setSuccessMessage(`🛡️ Emergency Medical Director override applied: ${data.data.auditTraceReference}. Final discharge unlocked.`);
      if (auditResult) {
        const updated: DischargeAuditResult = {
          ...auditResult,
          clearanceStatus: 'DISCHARGE_PERMITTED_ZERO_LEAKAGE',
          overrideApplied: true,
          overrideDetails: {
            approvedBy: overrideDirectorName,
            reason: overrideReason,
            overrideTimestamp: new Date().toISOString()
          }
        };
        setAuditResult(updated);
        if (onClearanceGranted) onClearanceGranted(updated);
      }
      setShowOverrideForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Override failed.');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  if (!isOpen) return null;

  const isFrozen = auditResult?.clearanceStatus === 'DISCHARGE_FROZEN_UNBILLED_CONSUMABLES' && !auditResult.overrideApplied;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="IPD Clinical-to-Financial Discharge Hard-Gate & Leakage Interceptor"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Zero-Leakage Assurance • NABH / IRDAI Standard RCM Interceptor
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {isFrozen && (
              <Button
                variant="primary"
                onClick={() => fetchAudit(true)}
                disabled={loading}
              >
                {loading ? 'Posting...' : `⚡ 1-Click Auto-Post (₹${auditResult?.unbilledTotalAmount?.toLocaleString('en-IN')})`}
              </Button>
            )}
            {!isFrozen && (
              <Button
                variant="primary"
                onClick={onClose}
              >
                Proceed to Final Summary Clearance
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.25rem 0' }}>
        {/* Status Alert Banner */}
        {error && <Alert type="error">{error}</Alert>}
        {successMessage && <Alert type="success">{successMessage}</Alert>}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Scanning MAR logs, OT surgical implant sheets, and nursing procedure records against Invoice {invoiceId}...
          </div>
        ) : auditResult ? (
          <>
            {/* Header Shield */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: isFrozen ? '#fef2f2' : '#f0fdf4',
                border: isFrozen ? '1px solid #fecaca' : '1px solid #bbf7d0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{isFrozen ? '🚨' : '🛡️'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: isFrozen ? '#991b1b' : '#166534' }}>
                    {isFrozen
                      ? 'DISCHARGE HARD-GATE ACTIVE — UNBILLED CONSUMABLES DETECTED'
                      : 'DISCHARGE PERMITTED — 100% REVENUE RECONCILED'}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: isFrozen ? '#b91c1c' : '#15803d' }}>
                    Patient: <strong>{patientName}</strong> • Admission ID: <code>{admissionId}</code>
                  </div>
                </div>
              </div>
              <div>
                <Badge variant={isFrozen ? 'danger' : 'success'}>
                  {isFrozen ? `${auditResult.unbilledItemsDetected} Unbilled Items` : 'Clearance Ready'}
                </Badge>
              </div>
            </div>

            {/* Unbilled Items Grid */}
            {isFrozen && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>
                    Unbilled Surgical Implants & Consumables Detected in Clinical Chart
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#dc2626' }}>
                    Total Leakage Risk: ₹{auditResult.unbilledTotalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '0.5rem 1rem' }}>Source</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Item Description</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditResult.items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                            {item.source}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{item.description}</td>
                        <td style={{ padding: '0.5rem 1rem', color: '#64748b' }}>{item.category}</td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontWeight: 700, color: '#b91c1c' }}>
                          ₹{item.totalAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Medical Director Override Drawer */}
            {isFrozen && (
              <div style={{ marginTop: '0.5rem', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                    ⚠️ Need to bypass billing for this patient?
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOverrideForm(!showOverrideForm)}
                  >
                    {showOverrideForm ? 'Hide Override Form' : 'Medical Director Override Sign-Off'}
                  </Button>
                </div>

                {showOverrideForm && (
                  <form onSubmit={handleApplyOverride} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#78350f' }}>
                          Medical Director / Sign-off Authority
                        </label>
                        <input
                          type="text"
                          value={overrideDirectorName}
                          onChange={(e) => setOverrideDirectorName(e.target.value)}
                          style={{ width: '100%', padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #d97706' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#78350f' }}>
                          Director Authorization PIN
                        </label>
                        <input
                          type="password"
                          value={overridePin}
                          onChange={(e) => setOverridePin(e.target.value)}
                          placeholder="Enter PIN"
                          style={{ width: '100%', padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #d97706' }}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#78350f' }}>
                        Mandatory Audit Justification (Preserved for Legal & Statutory Audit)
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        style={{ width: '100%', padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #d97706' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingOverride}
                      >
                        {isSubmittingOverride ? 'Validating PIN...' : 'Confirm Statutory Director Override'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </Dialog>
  );
};
