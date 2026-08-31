import React from 'react';
import {
  Card,
  Button,
  Badge
} from '@docsearch/ui-kit';
import type {
  PurchaseOrderDto,
  GoodsReceiptDto,
  PurchaseInvoiceDto
} from '@docsearch/api-contracts';

export interface PurchaseOrderDetailViewProps {
  purchaseOrder: PurchaseOrderDto | null;
  goodsReceipts: GoodsReceiptDto[];
  purchaseInvoices: PurchaseInvoiceDto[];
  onBack: () => void;
  onOpenSendPO: () => void;
  onOpenCreateGRN: () => void;
  onOpenCancelPO: () => void;
}

export const PurchaseOrderDetailView: React.FC<PurchaseOrderDetailViewProps> = ({
  purchaseOrder,
  goodsReceipts,
  purchaseInvoices,
  onBack,
  onOpenSendPO,
  onOpenCreateGRN,
  onOpenCancelPO
}) => {
  if (!purchaseOrder) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>No purchase order selected.</p>
        <Button variant="outline" onClick={onBack}>Back to PO Directory</Button>
      </Card>
    );
  }

  const linkedGRNs = goodsReceipts.filter((g) => g.purchaseOrderId === purchaseOrder.id);
  const linkedInvoices = purchaseInvoices.filter((i) => i.purchaseOrderId === purchaseOrder.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
                Purchase Order {purchaseOrder.poNumber}
              </h2>
              <Badge variant={purchaseOrder.status === 'FULLY_RECEIVED' ? 'success' : 'primary'}>
                {purchaseOrder.status}
              </Badge>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Vendor: {purchaseOrder.vendorName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {purchaseOrder.status === 'APPROVED' && (
            <Button variant="primary" size="sm" onClick={onOpenSendPO}>Transmit to Vendor</Button>
          )}
          {(purchaseOrder.status === 'SENT_TO_VENDOR' || purchaseOrder.status === 'PARTIALLY_RECEIVED') && (
            <Button variant="primary" size="sm" onClick={onOpenCreateGRN}>+ Receive Consignment (GRN)</Button>
          )}
          {purchaseOrder.status !== 'FULLY_RECEIVED' && purchaseOrder.status !== 'CANCELLED' && (
            <Button variant="danger" size="sm" onClick={onOpenCancelPO}>Cancel PO</Button>
          )}
        </div>
      </div>

      {/* PO Itemized Lines */}
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
          Contracted Line Items ({purchaseOrder.items.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Item Code</th>
                <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Ordered</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Received</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net Line Total</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>{item.itemCode}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{item.itemName}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>{item.orderedQuantity} {item.unit}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{item.receivedQuantity} {item.unit}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>${item.netAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Downstream Receiving & Invoicing Trail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Goods Receipts (GRN) History ({linkedGRNs.length})
          </h3>
          {linkedGRNs.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No consignments received yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {linkedGRNs.map((g) => (
                <div key={g.id} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{g.grnNumber}</span>
                    <Badge variant="success">{g.status}</Badge>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Received by {g.receivedBy} on {new Date(g.receivedDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            Supplier Invoices ({linkedInvoices.length})
          </h3>
          {linkedInvoices.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No supplier bills recorded against this PO.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {linkedInvoices.map((inv) => (
                <div key={inv.id} style={{ padding: '0.75rem', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{inv.invoiceNumber} (Vendor: {inv.vendorInvoiceNumber})</span>
                    <Badge variant={inv.matchingStatus === 'MATCHED_3WAY' ? 'success' : 'warning'}>{inv.matchingStatus}</Badge>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
                    Billed: ${inv.totalAmount.toFixed(2)} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
