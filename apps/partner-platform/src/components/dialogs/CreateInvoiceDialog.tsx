import React, { useState } from 'react';
import {
  Dialog,
  Button,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  CreateInvoiceRequest,
  BillingChargeDto
} from '@docsearch/api-contracts';
import { AuditJustificationField } from '../common/AuditJustificationField.js';

export interface EditableLineItem {
  id: string;
  chargeId?: string | undefined;
  chargeItemId?: string | undefined;
  serviceCatalogId?: string | undefined;
  serviceCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
}

export interface CreateInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateInvoiceRequest) => Promise<void>;
  pendingCharges?: BillingChargeDto[];
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pendingCharges = [],
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const safePendingCharges = Array.isArray(pendingCharges) ? pendingCharges : [];

  const [patientName, setPatientName] = useState(() => safePendingCharges[0]?.patientName || '');
  const [patientMrn, setPatientMrn] = useState(() => safePendingCharges[0]?.patientMrn || '');
  const [patientId, setPatientId] = useState(() => safePendingCharges[0]?.patientId || '');
  const [invoiceType, setInvoiceType] = useState<'OPD' | 'IPD' | 'DIAGNOSTICS' | 'PHARMACY' | 'EMERGENCY'>('OPD');
  const [selectedChargeId, setSelectedChargeId] = useState<string>(safePendingCharges[0]?.id || '');
  const [dueDays, setDueDays] = useState('30');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'DRAFT'>('PAID');
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentReference, setPaymentReference] = useState<string>(() => `UPI-${Math.floor(100000 + Math.random() * 900000)}`);
  const [justification, setJustification] = useState('Commercial invoice generated for clinical encounter settlement.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Editable Line Items State
  const [items, setItems] = useState<EditableLineItem[]>([
    {
      id: 'item-1',
      serviceCode: 'SRV-CONS-OPD',
      description: 'General OPD Consultation Fee',
      quantity: 1,
      unitPrice: 500.00,
      discountAmount: 0,
      taxAmount: 0
    }
  ]);

  const selectedCharge = safePendingCharges.find((c) => c.id === selectedChargeId);

  // Sync items when selected charge changes
  React.useEffect(() => {
    if (selectedCharge) {
      setPatientName(selectedCharge.patientName || '');
      setPatientMrn(selectedCharge.patientMrn || '');
      setPatientId(selectedCharge.patientId || '');

      const chargeItems = Array.isArray(selectedCharge.items) ? selectedCharge.items : [];
      if (chargeItems.length > 0) {
        setItems(
          chargeItems.map((it, idx) => ({
            id: it.id || `charge-it-${idx + 1}`,
            chargeId: selectedCharge.id,
            chargeItemId: it.id,
            serviceCatalogId: it.serviceCatalogId || undefined,
            serviceCode: it.serviceCode || 'SRV-GEN',
            description: it.description || 'Clinical Service',
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            discountAmount: Number(it.discountAmount) || 0,
            taxAmount: Number(it.taxAmount) || 0
          }))
        );
      }
    }
  }, [selectedChargeId]);

  // Line item manipulation helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `custom-item-${Date.now()}`,
        serviceCode: 'SRV-CUSTOM',
        description: 'New Clinical Service / Medicine / Investigation',
        quantity: 1,
        unitPrice: 250.00,
        discountAmount: 0,
        taxAmount: 0
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setError('Invoice must have at least one billable item.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof EditableLineItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return {
          ...it,
          [field]: value
        };
      })
    );
  };

  // Compute live financial totals
  const subtotal = items.reduce((s, it) => s + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
  const discountTotal = items.reduce((s, it) => s + Number(it.discountAmount || 0), 0);
  const taxTotal = items.reduce((s, it) => s + Number(it.taxAmount || 0), 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientMrn.trim()) {
      setError('Patient name and MRN are required.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one line item to the invoice.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const formattedItems = items.map((it) => ({
        chargeId: it.chargeId || (selectedCharge ? selectedCharge.id : undefined),
        chargeItemId: it.chargeItemId,
        serviceCatalogId: it.serviceCatalogId,
        serviceCode: it.serviceCode || 'SRV-GEN',
        description: it.description.trim() || 'Medical Service',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discountAmount: Number(it.discountAmount) || 0,
        taxAmount: Number(it.taxAmount) || 0
      }));

      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        patientId: selectedCharge ? selectedCharge.patientId : patientId,
        patientName: selectedCharge ? selectedCharge.patientName : patientName.trim(),
        patientMrn: selectedCharge ? selectedCharge.patientMrn : patientMrn.trim(),
        invoiceType,
        chargeIds: selectedCharge ? [selectedCharge.id] : [],
        items: formattedItems,
        dueDays: parseInt(dueDays, 10) || 30,
        paymentStatus,
        paymentMode: paymentStatus === 'PAID' ? paymentMode : undefined,
        paymentReference: paymentStatus === 'PAID' ? paymentReference.trim() : undefined,
        actorId: 'Billing Supervisor Alice Wong',
        actorRole: 'Billing Manager',
        justification: justification.trim()
      } as any);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      presentation="drawer"
      maxWidth="lg"
      title="Create New Commercial Invoice (Full Editing Enabled)"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Payable Amount: <strong style={{ color: '#0284c7', fontSize: '1.1rem' }}>₹{grandTotal.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Invoice...' : `✓ Create Invoice (₹${grandTotal.toFixed(2)})`}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
        {error && <Alert type="error">{error}</Alert>}

        {safePendingCharges.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
              Import from Captured Clinical Charge (Optional)
            </label>
            <Select
              value={selectedChargeId}
              onChange={(e) => {
                setSelectedChargeId(e.target.value);
                if (!e.target.value) {
                  // Revert to manual editable item
                  setItems([
                    {
                      id: 'item-manual-1',
                      serviceCode: 'SRV-CONS-OPD',
                      description: 'General OPD Consultation Fee',
                      quantity: 1,
                      unitPrice: 500.00,
                      discountAmount: 0,
                      taxAmount: 0
                    }
                  ]);
                }
              }}
              options={[
                { value: '', label: '— Manual Line Items Entry (Create Custom Invoice) —' },
                ...safePendingCharges.map((ch) => ({
                  value: ch.id,
                  label: `${ch.chargeNumber} — ${ch.patientName} (₹${(Number(ch.grandTotal) || 0).toFixed(2)} [${ch.sourceDomain || 'CLINICAL'}])`
                }))
              ]}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
              Patient Full Name *
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Eleanor Vance or Rajesh Kumar"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
              Patient MRN *
            </label>
            <Input
              value={patientMrn}
              onChange={(e) => setPatientMrn(e.target.value)}
              placeholder="e.g. MRN-2026-00891"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
              Invoice Classification *
            </label>
            <Select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as 'OPD' | 'IPD' | 'DIAGNOSTICS' | 'PHARMACY' | 'EMERGENCY')}
              options={[
                { value: 'OPD', label: 'Outpatient (OPD)' },
                { value: 'IPD', label: 'Inpatient (IPD)' },
                { value: 'DIAGNOSTICS', label: 'Diagnostics & Pathology' },
                { value: 'PHARMACY', label: 'Pharmacy & Medical Counter' },
                { value: 'EMERGENCY', label: 'Emergency / Trauma' }
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
              Payment Terms (Due Days)
            </label>
            <Input
              type="number"
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              placeholder="30"
              required
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* EDITABLE BILLABLE LINE ITEMS SECTION */}
        {/* ========================================================= */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                ✏️ Invoice Line Items & Pricing (Editable)
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Cashier can edit description, quantity, rates, discounts or add multiple services/medicines.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + Add Item / Service
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map((item, index) => {
              const lineTotal = (Number(item.quantity || 1) * Number(item.unitPrice || 0)) - Number(item.discountAmount || 0) + Number(item.taxAmount || 0);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 0.8fr 1fr 0.8fr 0.8fr 1.2fr auto',
                    gap: '0.5rem',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                      Item #{index + 1} Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="e.g. Doctor Consultation, Blood Test"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        color: '#0f172a'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        color: '#0f172a',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, marginBottom: '2px' }}>
                      Disc (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.discountAmount}
                      onChange={(e) => handleUpdateItem(item.id, 'discountAmount', Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        color: '#16a34a'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                      Tax (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.taxAmount}
                      onChange={(e) => handleUpdateItem(item.id, 'taxAmount', Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                      Total
                    </label>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', paddingTop: '6px' }}>
                      ₹{lineTotal.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length <= 1}
                      title="Remove Item"
                      style={{
                        backgroundColor: items.length <= 1 ? '#f1f5f9' : '#fee2e2',
                        border: '1px solid',
                        borderColor: items.length <= 1 ? '#e2e8f0' : '#fca5a5',
                        color: items.length <= 1 ? '#94a3b8' : '#dc2626',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
            <div>Gross Subtotal: <strong style={{ color: '#0f172a' }}>₹{subtotal.toFixed(2)}</strong></div>
            <div>Total Discount: <strong style={{ color: '#16a34a' }}>-₹{discountTotal.toFixed(2)}</strong></div>
            <div>Total Tax (GST): <strong style={{ color: '#0f172a' }}>+₹{taxTotal.toFixed(2)}</strong></div>
            <div style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: 800 }}>Net Total: ₹{grandTotal.toFixed(2)}</div>
          </div>
        </div>

        {/* Payable Amount Summary Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
              Kitna Pay Karna Hai (Total Payable Amount)
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.02em', marginTop: '2px' }}>
              ₹{grandTotal.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
              {items.length} billed {items.length === 1 ? 'item' : 'items'} • All taxes and discounts included
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Desk Action:</div>
            <span style={{
              display: 'inline-block',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 800,
              backgroundColor: paymentStatus === 'PAID' ? '#166534' : '#991b1b',
              color: '#ffffff'
            }}>
              {paymentStatus === 'PAID' ? `✓ COLLECT ₹${grandTotal.toFixed(2)} NOW` : `⏱ MARK ₹${grandTotal.toFixed(2)} AS DUE`}
            </span>
          </div>
        </div>

        {/* Settlement Status & Payment Mode Configuration */}
        <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534' }}>Settlement & Payment Status</span>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#15803d' }}>
                Collect payment at billing desk or issue as outstanding payable
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPaymentStatus('PAID')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: paymentStatus === 'PAID' ? '#16a34a' : '#cbd5e1',
                  backgroundColor: paymentStatus === 'PAID' ? '#16a34a' : '#ffffff',
                  color: paymentStatus === 'PAID' ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                ✓ Settle Now (PAID)
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('DRAFT')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: paymentStatus === 'DRAFT' ? '#64748b' : '#cbd5e1',
                  backgroundColor: paymentStatus === 'DRAFT' ? '#64748b' : '#ffffff',
                  color: paymentStatus === 'DRAFT' ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Due Later (UNPAID)
              </button>
            </div>
          </div>

          {paymentStatus === 'PAID' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed #bbf7d0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
                  Payment Mode *
                </label>
                <Select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  options={[
                    { value: 'UPI', label: 'UPI / QR Code Scan' },
                    { value: 'CASH', label: 'Cash Currency' },
                    { value: 'CARD', label: 'Credit / Debit Card' },
                    { value: 'NET_BANKING', label: 'Online Net Banking' },
                    { value: 'INSURANCE', label: 'Insurance Direct TPA' },
                    { value: 'CHEQUE', label: 'Bank Cheque / DD' }
                  ]}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
                  Transaction / Reference #
                </label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UPI-TXN-49102"
                />
              </div>
            </div>
          )}
        </div>

        <AuditJustificationField
          value={justification}
          onChange={setJustification}
          defaultJustification="Commercial invoice generated for clinical encounter settlement"
          placeholder="Reason for invoice creation..."
        />
      </form>
    </Dialog>
  );
};
