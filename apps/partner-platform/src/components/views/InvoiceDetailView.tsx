import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Dialog,
  Input,
  Select,
  Alert
} from '@docsearch/ui-kit';
import type {
  BillingInvoiceDto,
  BillingInvoiceStatus
} from '@docsearch/api-contracts';
import { PrintableInvoiceBillModal } from '../dialogs/PrintableInvoiceBillModal.js';
import { ProfileUpdateRequiredAlertModal } from '../common/ProfileUpdateRequiredAlertModal.js';
import { checkPartnerProfileStatus, type MissingProfileField } from '../../utils/partnerProfileGuard.js';
import { isBillCancellationAllowed, isDiscountAllowed } from '../../utils/partnerRolePermissions.js';

export interface InvoiceDetailViewProps {
  invoice: BillingInvoiceDto;
  onBack: () => void;
  onFinalize: (invoice: BillingInvoiceDto) => void;
  onApplyDiscount: (invoice: BillingInvoiceDto) => void;
  onRecordPayment: (invoice: BillingInvoiceDto) => void;
  onCreateCreditNote: (invoice: BillingInvoiceDto) => void;
  onCreateDebitAdjustment: (invoice: BillingInvoiceDto) => void;
  onCancelInvoice: (invoice: BillingInvoiceDto) => void;
  onUpdateInvoice?: (updated: Partial<BillingInvoiceDto> & { id: string }) => Promise<void>;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onBack,
  onFinalize,
  onApplyDiscount,
  onRecordPayment,
  onCreateCreditNote,
  onCreateDebitAdjustment,
  onCancelInvoice,
  onUpdateInvoice
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileGuardAlertOpen, setIsProfileGuardAlertOpen] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState<MissingProfileField[]>([]);

  // Theft Protection RBAC Guards: Prevent cash skimming & unauthorized discounting
  const canCancel = isBillCancellationAllowed();
  const canDiscount = isDiscountAllowed();

  const handlePrintClick = () => {
    const status = checkPartnerProfileStatus();
    if (!status.isUpdated) {
      setProfileMissingFields(status.missingFields);
      setIsProfileGuardAlertOpen(true);
      return;
    }
    setIsPrintModalOpen(true);
  };

  const [editPatientName, setEditPatientName] = useState(invoice.patientName || '');
  const [editPatientMrn, setEditPatientMrn] = useState(invoice.patientMrn || '');
  const [editStatus, setEditStatus] = useState(invoice.status || 'DRAFT');
  const [editItems, setEditItems] = useState(() => (invoice.items || []).map((it, idx) => ({
    id: it.id || `item-${idx + 1}`,
    serviceCode: it.serviceCode || 'SRV-GEN',
    description: it.description || 'Medical Service',
    quantity: Number(it.quantity) || 1,
    unitPrice: Number(it.unitPrice) || 0,
    discountAmount: Number(it.discountAmount) || 0,
    taxAmount: Number(it.taxAmount) || 0
  })));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setEditPatientName(invoice.patientName || '');
    setEditPatientMrn(invoice.patientMrn || '');
    setEditStatus(invoice.status || 'DRAFT');
    setEditItems((invoice.items || []).map((it, idx) => ({
      id: it.id || `item-${idx + 1}`,
      serviceCode: it.serviceCode || 'SRV-GEN',
      description: it.description || 'Medical Service',
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
      discountAmount: Number(it.discountAmount) || 0,
      taxAmount: Number(it.taxAmount) || 0
    })));
  }, [invoice]);

  const handleAddEditItem = () => {
    setEditItems((prev) => [
      ...prev,
      {
        id: `edit-it-${Date.now()}`,
        serviceCode: 'SRV-CUSTOM',
        description: 'New Clinical Service / Test / Medicine',
        quantity: 1,
        unitPrice: 200.00,
        discountAmount: 0,
        taxAmount: 0
      }
    ]);
  };

  const handleRemoveEditItem = (id: string) => {
    if (editItems.length <= 1) {
      setEditError('Invoice must contain at least one line item.');
      return;
    }
    setEditItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateEditItem = (id: string, field: string, val: any) => {
    setEditItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const editSubtotal = editItems.reduce((s, it) => s + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
  const editDiscountTotal = editItems.reduce((s, it) => s + Number(it.discountAmount || 0), 0);
  const editTaxTotal = editItems.reduce((s, it) => s + Number(it.taxAmount || 0), 0);
  const editTotalAmount = Math.max(0, editSubtotal - editDiscountTotal + editTaxTotal);
  const editPaidAmount = Number(invoice.paidAmount || 0);
  const editDueAmount = Math.max(0, editTotalAmount - editPaidAmount);

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPatientName.trim() || !editPatientMrn.trim()) {
      setEditError('Patient name and MRN are required.');
      return;
    }
    if (!onUpdateInvoice) return;

    setIsSaving(true);
    setEditError(null);
    try {
      await onUpdateInvoice({
        id: invoice.id,
        patientName: editPatientName.trim(),
        patientMrn: editPatientMrn.trim(),
        status: editStatus as any,
        subtotal: editSubtotal,
        discountTotal: editDiscountTotal,
        taxTotal: editTaxTotal,
        totalAmount: editTotalAmount,
        paidAmount: editPaidAmount,
        dueAmount: editDueAmount,
        items: editItems.map((it) => ({
          id: it.id,
          tenantId: invoice.tenantId,
          invoiceId: invoice.id,
          serviceCode: it.serviceCode,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          grossAmount: it.quantity * it.unitPrice,
          discountAmount: it.discountAmount,
          taxAmount: it.taxAmount,
          netAmount: (it.quantity * it.unitPrice) - it.discountAmount + it.taxAmount,
          createdAt: new Date().toISOString()
        }))
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditModalOpen(false);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: BillingInvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">PAID IN FULL</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">PARTIALLY PAID</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger">OVERDUE</Badge>;
      case 'ISSUED':
        return <Badge variant="primary">ISSUED</Badge>;
      case 'CANCELLED':
      case 'VOIDED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">DRAFT</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" onClick={onBack}>
            ← Back to Invoices
          </Button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              Invoice {invoice.invoiceNumber}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              {getStatusBadge(invoice.status)}
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Type: {invoice.invoiceType} | Currency: {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Role-Aware Printable Tax Invoice Button */}
          <Button variant="primary" onClick={handlePrintClick}>
            🖨️ Print Tax Invoice (GST)
          </Button>

          {/* Editable Invoice Action */}
          {onUpdateInvoice && invoice.status !== 'CANCELLED' && invoice.status !== 'VOIDED' && (
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              ✏️ Edit Invoice & Items
            </Button>
          )}

          {invoice.status === 'DRAFT' && (
            <>
              <Button variant="outline" onClick={() => onFinalize(invoice)}>
                Finalize & Issue
              </Button>
              {canCancel ? (
                <Button variant="danger" onClick={() => onCancelInvoice(invoice)}>
                  Cancel Draft
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  title="Draft cancellation requires Clinic Owner / Manager authorization (Theft Protection: Cash Skimming Prevention)"
                  style={{ opacity: 0.6, cursor: 'not-allowed', borderColor: '#fca5a5', color: '#b91c1c' }}
                >
                  🔒 Cancel Draft (Manager Only)
                </Button>
              )}
            </>
          )}

          {invoice.dueAmount > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && invoice.status !== 'VOIDED' && (
            <>
              {canDiscount ? (
                <Button variant="outline" onClick={() => onApplyDiscount(invoice)}>
                  + Discount
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  title="Discretionary discounts require Supervisor/Manager authorization (Theft Protection)"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                >
                  🔒 + Discount (Supervisor Only)
                </Button>
              )}
              {canCancel ? (
                <Button variant="outline" onClick={() => onCreateCreditNote(invoice)}>
                  + Credit Note
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  title="Credit notes require Supervisor/Manager authorization"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                >
                  🔒 + Credit Note
                </Button>
              )}
              <Button variant="outline" onClick={() => onCreateDebitAdjustment(invoice)}>
                + Debit Adj.
              </Button>
              <Button variant="primary" onClick={() => onRecordPayment(invoice)}>
                Collect Payment
              </Button>
            </>
          )}
        </div>
      </div>

      {saveSuccess && (
        <Alert type="success">✓ Invoice and line items updated successfully.</Alert>
      )}

      {/* Patient & Financial Summary Cards */}
      {/* Patient & Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Patient Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Patient Name:</span>
              <div style={{ fontWeight: 600 }}>{invoice.patientName || 'Eleanor Vance'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Medical Record Number (MRN):</span>
              <div style={{ fontWeight: 600 }}>{invoice.patientMrn || 'MRN-2026-00891'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Created Date:</span>
              <div>{new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Due Date:</span>
              <div>{invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : 'Immediate'}</div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Financial Settlement Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Gross Subtotal:</span>
              <span>₹{Number(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            {Number(invoice.discountTotal || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>Authorized Discounts:</span>
                <span>-₹{Number(invoice.discountTotal || 0).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.taxTotal || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Taxes:</span>
                <span>+₹{Number(invoice.taxTotal || 0).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
              <span>Total Bill (Kul Rakam):</span>
              <span>₹{Number(invoice.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
              <span>Amount Paid (Jama Kiya):</span>
              <span>₹{Number(invoice.paidAmount || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: Number(invoice.dueAmount || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 800, fontSize: '1.15rem', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem' }}>
              <span>Kitna Pay Karna Hai (Balance Due):</span>
              <span>₹{Number(invoice.dueAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice Line Items */}
      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
          Billed Service Items ({(invoice.items || []).length})
        </h3>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Service / Item Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Net Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.items || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                    No line items recorded for this invoice.
                  </TableCell>
                </TableRow>
              ) : (
                (invoice.items || []).map((it) => (
                  <TableRow key={it.id}>
                    <TableCell style={{ fontWeight: 600 }}>{it.serviceCode || 'SRV'}</TableCell>
                    <TableCell>{it.description}</TableCell>
                    <TableCell>{Number(it.quantity || 1)}</TableCell>
                    <TableCell>₹{Number(it.unitPrice || 0).toFixed(2)}</TableCell>
                    <TableCell>₹{Number(it.grossAmount || 0).toFixed(2)}</TableCell>
                    <TableCell style={{ color: Number(it.discountAmount || 0) > 0 ? '#16a34a' : 'inherit' }}>
                      {Number(it.discountAmount || 0) > 0 ? `-₹${Number(it.discountAmount || 0).toFixed(2)}` : '₹0.00'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>₹{Number(it.netAmount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Authorized Discounts Applied */}
      {(invoice.discounts || []).length > 0 && (
        <Card>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Authorized Discounts Applied
          </h3>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Amount Credited</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Approved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><Badge variant="neutral">{d.discountType}</Badge></TableCell>
                    <TableCell>{d.discountType === 'PERCENTAGE' ? `${d.discountValue}%` : `$${Number(d.discountValue || 0).toFixed(2)}`}</TableCell>
                    <TableCell style={{ color: '#16a34a', fontWeight: 600 }}>-${Number(d.discountAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>{d.reason}</TableCell>
                    <TableCell>{d.approvedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Payments & Settlement Ledger */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
            Payments & Settlement History ({(invoice.payments || []).length})
          </h3>
          {Number(invoice.dueAmount || 0) > 0 && invoice.status !== 'CANCELLED' && invoice.status !== 'VOIDED' && (
            <Button variant="primary" onClick={() => onRecordPayment(invoice)}>
              + Collect Payment (₹{Number(invoice.dueAmount || 0).toFixed(2)})
            </Button>
          )}
        </div>
        {(!invoice.payments || invoice.payments.length === 0) ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
            No settled receipts on file yet. Outstanding Balance Due: <strong style={{ color: '#dc2626' }}>₹{Number(invoice.dueAmount || 0).toFixed(2)}</strong>
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Amount Settled</TableHead>
                  <TableHead>Transaction Ref #</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Collected By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell style={{ fontWeight: 600 }}>{p.paymentNumber || 'PMT-ONLINE'}</TableCell>
                    <TableCell>
                      <Badge variant="success">{p.paymentMethod || (p as any).paymentMode || 'UPI'}</Badge>
                    </TableCell>
                    <TableCell style={{ color: '#16a34a', fontWeight: 700 }}>
                      ₹{Number(p.amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {p.referenceNumber || (p as any).transactionReference || 'TXN-DIRECT'}
                    </TableCell>
                    <TableCell>
                      {p.receivedAt ? new Date(p.receivedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </TableCell>
                    <TableCell>{p.receivedBy || (p as any).collectedBy || 'Cashier'}</TableCell>
                    <TableCell>
                      <Badge variant="success">{p.status || 'SUCCESS'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Invoice Activity & Timeline Audit History */}
      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
          📜 Invoice Activity & Audit History (Tarikh-war Record)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '4px solid #0284c7' }}>
            <div style={{ fontSize: '1.25rem' }}>🧾</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                Invoice Created & Issued ({invoice.invoiceNumber})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Generated on {new Date(invoice.createdAt || Date.now()).toLocaleString('en-IN')} for Patient <strong>{invoice.patientName}</strong> ({invoice.patientMrn}). Total billed: ₹{Number(invoice.totalAmount || 0).toFixed(2)} across {(invoice.items || []).length} line items.
              </div>
            </div>
            <Badge variant={invoice.status === 'PAID' ? 'success' : 'warning'}>{invoice.status}</Badge>
          </div>

          {(invoice.payments || []).map((pmt, pIdx) => (
            <div key={pmt.id || pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '6px', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '1.25rem' }}>💳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#166534', fontSize: '0.9rem' }}>
                  Payment Settled & Receipt Issued ({pmt.paymentNumber || 'PMT-ONLINE'})
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                  Received ₹{Number(pmt.amount || 0).toFixed(2)} via <strong>{pmt.paymentMethod || 'UPI'}</strong> (Ref: {pmt.referenceNumber || 'TXN-DIRECT'}). Collected by {pmt.receivedBy || 'Cashier'} on {new Date(pmt.receivedAt || Date.now()).toLocaleString('en-IN')}.
                </div>
              </div>
              <Badge variant="success">SETTLED</Badge>
            </div>
          ))}

          {Number(invoice.dueAmount || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '1.25rem' }}>⏳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>
                  Outstanding Payment Due (Baqaya Rakam)
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Balance of ₹{Number(invoice.dueAmount || 0).toFixed(2)} pending settlement. Due date: {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString('en-IN') : 'Immediate'}.
                </div>
              </div>
              <Badge variant="warning">DUE</Badge>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '4px solid #64748b' }}>
            <div style={{ fontSize: '1.25rem' }}>🔒</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                Regulatory Compliance & Audit Trail
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Commercial GST HSN/SAC codes validated. Immutable trace logged in Hospital Billing Audit Vault.
              </div>
            </div>
            <Badge variant="neutral">AUDITED</Badge>
          </div>
        </div>
      </Card>

      {/* Role-Aware Printable GST Tax Invoice / Bill Modal */}
      {isPrintModalOpen && (
        <PrintableInvoiceBillModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          invoiceData={{
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: new Date(invoice.issuedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            patientName: invoice.patientName || 'Eleanor Vance',
            patientMrn: invoice.patientMrn || 'MRN-2026-00891',
            paymentStatus: invoice.status === 'PAID' ? 'PAID' : Number(invoice.dueAmount || 0) > 0 && Number(invoice.paidAmount || 0) > 0 ? 'PARTIAL' : 'PENDING',
            paymentMode: invoice.payments?.[0]?.paymentMethod || (invoice.payments?.[0] as any)?.paymentMode || (invoice.status === 'PAID' ? 'UPI / ONLINE TRANSFER' : 'CASH'),
            transactionReference: invoice.payments?.[0]?.referenceNumber || (invoice.payments?.[0] as any)?.transactionReference || `UPI-${Math.floor(100000 + Math.random() * 900000)}`,
            items: (invoice.items || []).map((it, idx) => ({
              id: it.id || String(idx + 1),
              description: it.description || it.serviceCode || 'Healthcare Service',
              sacHsnCode: it.serviceCode || '999311',
              quantity: Number(it.quantity || 1),
              rate: Number(it.unitPrice || 0),
              discount: Number(it.discountAmount || 0),
              taxRatePercent: Number(it.taxAmount || 0) > 0 && Number(it.grossAmount || 0) > 0 ? Math.round((Number(it.taxAmount) / Number(it.grossAmount)) * 100) : 0
            }))
          }}
        />
      )}

      {/* Profile Update Mandatory Statutory Guard Alert Modal */}
      <ProfileUpdateRequiredAlertModal
        isOpen={isProfileGuardAlertOpen}
        onClose={() => setIsProfileGuardAlertOpen(false)}
        blockedActionName="GST Tax Invoice / Bill Print"
        missingFields={profileMissingFields}
      />

      {/* Interactive Edit Invoice Modal */}
      {isEditModalOpen && (
        <Dialog
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Invoice ${invoice.invoiceNumber} (Patient & Line Items)`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Total Bill: <strong style={{ color: '#0284c7', fontSize: '1.1rem' }}>₹{editTotalAmount.toFixed(2)}</strong> | Due: <strong style={{ color: editDueAmount > 0 ? '#dc2626' : '#16a34a' }}>₹{editDueAmount.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveInvoice} disabled={isSaving}>
                  {isSaving ? 'Saving...' : '✓ Save Changes'}
                </Button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
            {editError && <Alert type="error">{editError}</Alert>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Patient Name *
                </label>
                <Input
                  value={editPatientName}
                  onChange={(e) => setEditPatientName(e.target.value)}
                  placeholder="Patient Name"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Patient MRN *
                </label>
                <Input
                  value={editPatientMrn}
                  onChange={(e) => setEditPatientMrn(e.target.value)}
                  placeholder="MRN Number"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Invoice Status
                </label>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  options={[
                    { value: 'DRAFT', label: 'DRAFT (Pending Finalization)' },
                    { value: 'ISSUED', label: 'ISSUED (Payable Outstanding)' },
                    { value: 'PAID', label: 'PAID IN FULL (Settled)' },
                    { value: 'PARTIALLY_PAID', label: 'PARTIALLY PAID' }
                  ]}
                />
              </div>
            </div>

            {/* Line items editor */}
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
                    Line Items & Pricing Editor
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    Add, remove, or modify items and rates. Totals update dynamically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEditItem}
                  style={{
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
                  + Add Line Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {editItems.map((item, index) => {
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
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                          Item #{index + 1} Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateEditItem(item.id, 'description', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '0.82rem'
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
                          onChange={(e) => handleUpdateEditItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '0.82rem'
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
                          onChange={(e) => handleUpdateEditItem(item.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '0.82rem',
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
                          onChange={(e) => handleUpdateEditItem(item.id, 'discountAmount', Math.max(0, parseFloat(e.target.value) || 0))}
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
                          onChange={(e) => handleUpdateEditItem(item.id, 'taxAmount', Math.max(0, parseFloat(e.target.value) || 0))}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '0.82rem'
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
                          onClick={() => handleRemoveEditItem(item.id)}
                          disabled={editItems.length <= 1}
                          style={{
                            backgroundColor: editItems.length <= 1 ? '#f1f5f9' : '#fee2e2',
                            border: '1px solid',
                            borderColor: editItems.length <= 1 ? '#e2e8f0' : '#fca5a5',
                            color: editItems.length <= 1 ? '#94a3b8' : '#dc2626',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            cursor: editItems.length <= 1 ? 'not-allowed' : 'pointer'
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
                <div>Gross: <strong style={{ color: '#0f172a' }}>₹{editSubtotal.toFixed(2)}</strong></div>
                <div>Discount: <strong style={{ color: '#16a34a' }}>-₹{editDiscountTotal.toFixed(2)}</strong></div>
                <div>Tax: <strong style={{ color: '#0f172a' }}>+₹{editTaxTotal.toFixed(2)}</strong></div>
                <div style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: 800 }}>Net Total: ₹{editTotalAmount.toFixed(2)}</div>
              </div>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
